/**
 * VoiceQueue.js - Intelligent Prioritized Speech Synthesis Queue for Mecano
 * 
 * Fulfills Requirement R5 and PROJECT.md specifications:
 * - Intelligent Web Speech API queue with priority tiers (CRITICAL, HIGH, NORMAL, LOW).
 * - Anti-overlap engine: cleanly preempts lower-priority phrases without audio clipping.
 * - Rate throttling: when typing rate > 25 PPM, discards verbose speeches in favor of short encouraging interjections ("¡Bien!", "¡Genial!").
 * - Phonetic mode ("fff") and letter name mode ("efe") support for pedagogical guidance.
 * - Spanish natural voice selection (es-ES, es-MX, es-*).
 * - EventBus subscription integration (MASCOT_SPEAK_REQUEST, LEVEL_COMPLETED, USER_STUCK).
 * - Headless Node.js safe execution with mock/fallback compatibility.
 */

export const VOICE_PRIORITIES = Object.freeze({
  CRITICAL: 4,
  HIGH: 3,
  NORMAL: 2,
  LOW: 1
});

export const PRONUNCIATION_MODES = Object.freeze({
  LETTER_NAME: 'LETTER_NAME',
  PHONETIC: 'PHONETIC'
});

export const SPANISH_LETTER_NAMES = Object.freeze({
  'a': 'a',
  'b': 'be',
  'c': 'ce',
  'd': 'de',
  'e': 'e',
  'f': 'efe',
  'g': 'ge',
  'h': 'hache',
  'i': 'i',
  'j': 'jota',
  'k': 'ka',
  'l': 'ele',
  'm': 'eme',
  'n': 'ene',
  'ñ': 'eñe',
  'o': 'o',
  'p': 'pe',
  'q': 'cu',
  'r': 'erre',
  's': 'ese',
  't': 'te',
  'u': 'u',
  'v': 'uve',
  'w': 'uve doble',
  'x': 'equis',
  'y': 'ye',
  'z': 'zeta',
  ' ': 'espacio',
  'enter': 'intro',
  'intro': 'intro',
  'shift': 'mayúsculas',
  'backspace': 'borrar'
});

export const SPANISH_PHONETIC_SOUNDS = Object.freeze({
  'a': 'a',
  'b': 'b',
  'c': 'k',
  'd': 'd',
  'e': 'e',
  'f': 'fff',
  'g': 'g',
  'h': 'h',
  'i': 'i',
  'j': 'jjj',
  'k': 'k',
  'l': 'lll',
  'm': 'mmm',
  'n': 'nnn',
  'ñ': 'ñññ',
  'o': 'o',
  'p': 'p',
  'q': 'k',
  'r': 'rrr',
  's': 'sss',
  't': 't',
  'u': 'u',
  'v': 'b',
  'w': 'u',
  'x': 'ks',
  'y': 'y',
  'z': 'zzz',
  ' ': 'espacio',
  'enter': 'intro',
  'intro': 'intro',
  'shift': 'mayúsculas',
  'backspace': 'borrar'
});

export const SHORT_INTERJECTIONS = Object.freeze([
  '¡Bien!',
  '¡Genial!',
  '¡Eso!',
  '¡Sigue!',
  '¡Muy bien!',
  '¡Bravo!',
  '¡Súper!',
  '¡Excelente!'
]);

/**
 * Strips all Unicode emojis, pictographs, symbols, repetitive labels,
 * and key token brackets so text is read naturally without pronouncing
 * emoji names like "bombilla" or technical markup.
 * 
 * @param {string} text
 * @returns {string} Sanitized natural speech string
 */
export function cleanSpeechText(text) {
  if (!text || typeof text !== 'string') return '';
  let c = text;
  // Replace key token brackets like [F] or [A]
  c = c.replace(/\[(espacio|space)\]/gi, 'barra espaciadora');
  c = c.replace(/(?:la\s+)?tecla\s+\[([a-zA-ZñÑ0-9])\]/gi, 'tecla $1');
  c = c.replace(/\[([a-zA-ZñÑ0-9])\]/g, '$1');
  c = c.replace(/\[([^\]]+)\]/g, '$1');
  // Strip Unicode emojis and pictographs
  c = c.replace(/\p{Extended_Pictographic}/gu, '');
  // Strip miscellaneous symbols, dingbats, arrows, geometric shapes
  c = c.replace(/[\u2600-\u27BF\u2B50\u2B55\u2300-\u23FF\u2190-\u21FF\u2934\u2935\uFE0E\uFE0F]/gu, '');
  // Explicit common emoji fallback
  c = c.replace(/[💡🤖⭐☆🚀✋🥋⚪🟡🟢⚫👑🎮🔥👍💖✨🐾🎼🎶🎁🧂🪽☕🛋️👗🎀👉👈⌨️💤⚡🏆🎯]/g, '');
  // Remove repetitive robotic robot prefixes like "Consejo de Roby:", "Consejo:", etc.
  c = c.replace(/^[\s\W]*Consejo\s*(de\s*Roby)?\s*:\s*/i, '');
  // Remove parentheses around explanations
  c = c.replace(/\(([^)]+)\)/g, '$1');
  // Clean accidental double words like "tecla tecla"
  c = c.replace(/\btecla\s+tecla\b/gi, 'tecla');
  // Collapse whitespace
  c = c.replace(/\s+/g, ' ').trim();
  return c;
}

/**
 * Scores a speech synthesis voice to prioritize natural, neural Spanish voices
 * (e.g. Microsoft Álvaro / Elvira Online Natural, Google Español) over legacy
 * robotic desktop voices (e.g. Helena Desktop).
 * 
 * @param {Object} v
 * @returns {number} Score
 */
export function scoreVoice(v) {
  if (!v) return -1000;
  const name = (v.name || '').toLowerCase();
  const lang = (v.lang || '').toLowerCase();
  const uri = (v.voiceURI || '').toLowerCase();

  let score = 0;
  const isSpanish = lang.startsWith('es') || name.includes('spanish') || uri.includes('spanish');
  if (!isSpanish) return -500;
  score += 100;

  // Heavily penalize legacy robotic desktop SAPI voices (e.g. Helena Desktop)
  if (name.includes('desktop') || uri.includes('desktop') || name.includes('sapi')) {
    score -= 80;
  }

  // Large bonus for modern neural / natural online voices
  if (name.includes('natural') || uri.includes('natural') || name.includes('online')) {
    score += 120;
  }

  // Prioritize friendly, warm, high-fidelity neural voices
  if (name.includes('álvaro') || name.includes('alvaro')) {
    score += 90; // Extremely friendly, young, joyful tone for Roby
  } else if (name.includes('elvira')) {
    score += 85; // Warm, natural Spanish female
  } else if (name.includes('ximena')) {
    score += 80;
  } else if (name.includes('google') && isSpanish) {
    score += 75; // Google Español
  } else if (name.includes('jorge') && isSpanish) {
    score += 70;
  } else if (name.includes('dalia') || name.includes('salome') || name.includes('mateo')) {
    score += 65;
  } else if (name.includes('laura') || name.includes('pablo')) {
    score += 50; // Windows OneCore modern voices
  }

  if (lang === 'es-es') score += 10;
  return score;
}

export class VoiceQueue {
  /**
   * @param {Object} [options]
   * @param {Object} [options.speechSynthesis] Custom/mock SpeechSynthesis instance
   * @param {Function} [options.SpeechSynthesisUtterance] Custom/mock SpeechSynthesisUtterance constructor
   * @param {number} [options.volume=1.0] Voice volume (0.0 to 1.0)
   * @param {number} [options.rate=0.95] Voice speed rate (natural relaxed pace for kids)
   * @param {number} [options.pitch=1.0] Natural human pitch (1.0 = human, no robotic distortion)
   * @param {string} [options.pronunciationMode='LETTER_NAME'] Default pronunciation mode
   * @param {number} [options.rateThrottleThreshold=25] PPM speed threshold to throttle speeches
   * @param {boolean} [options.muted=false] Initial mute state
   */
  constructor(options = {}) {
    this._customSynth = options.speechSynthesis || null;
    this._customUtteranceClass = options.SpeechSynthesisUtterance || null;

    this._volume = typeof options.volume === 'number' ? Math.max(0, Math.min(1, options.volume)) : 1.0;
    this._rate = typeof options.rate === 'number' ? options.rate : 0.95;
    this._pitch = typeof options.pitch === 'number' ? options.pitch : 1.0; // Natural warm human voice
    this._pronunciationMode = options.pronunciationMode === PRONUNCIATION_MODES.PHONETIC
      ? PRONUNCIATION_MODES.PHONETIC
      : PRONUNCIATION_MODES.LETTER_NAME;
    this._rateThrottleThreshold = options.rateThrottleThreshold || 25; // 25 PPM
    this._muted = typeof options.muted === 'boolean' ? options.muted : false;
    this._voiceEngine = options.voiceEngine || null;

    // Queue and state
    this._queue = [];
    this._currentRequest = null;
    this._isSpeaking = false;
    this._currentPPM = 0;
    this._lastInterjectionTime = 0;
    this._preferredVoice = null;
    this._eventDisposers = [];

    // Keystroke tracking for PPM calculation
    this._recentKeystrokes = [];

    // Initialize voice selection
    this._initVoices();
  }

  /**
   * Resolves the SpeechSynthesis instance safely across browsers and headless mocks.
   * @returns {Object|null}
   */
  getSpeechSynthesis() {
    if (this._customSynth) return this._customSynth;
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      return window.speechSynthesis;
    }
    if (typeof globalThis !== 'undefined' && globalThis.speechSynthesis) {
      return globalThis.speechSynthesis;
    }
    return null;
  }

  /**
   * Resolves the SpeechSynthesisUtterance constructor safely.
   * @returns {Function|null}
   */
  getUtteranceClass() {
    if (this._customUtteranceClass) return this._customUtteranceClass;
    if (typeof window !== 'undefined' && window.SpeechSynthesisUtterance) {
      return window.SpeechSynthesisUtterance;
    }
    if (typeof globalThis !== 'undefined' && globalThis.SpeechSynthesisUtterance) {
      return globalThis.SpeechSynthesisUtterance;
    }
    return null;
  }

  /**
   * Initializes preferred Spanish voice selection and attaches onvoiceschanged listener.
   * @private
   */
  _initVoices() {
    const synth = this.getSpeechSynthesis();
    if (!synth || typeof synth.getVoices !== 'function') return;

    const pickVoice = () => {
      const voices = synth.getVoices() || [];
      if (!Array.isArray(voices) || voices.length === 0) return;

      // Rank voices to prefer modern natural neural voices over legacy desktop voices
      const ranked = [...voices].sort((a, b) => scoreVoice(b) - scoreVoice(a));
      if (ranked.length > 0 && scoreVoice(ranked[0]) > 0) {
        this._preferredVoice = ranked[0];
      } else {
        const fallback = voices.find(v => v.lang && v.lang.startsWith('es')) || voices[0];
        if (fallback) this._preferredVoice = fallback;
      }
    };

    pickVoice();
    if (synth.onvoiceschanged !== undefined) {
      synth.onvoiceschanged = pickVoice;
    }
  }

  /**
   * Converts a priority string or number to numeric ranking (1 to 4).
   * @param {string|number} priority
   * @returns {number}
   */
  _normalizePriority(priority) {
    if (typeof priority === 'number') {
      return Math.max(1, Math.min(4, Math.round(priority)));
    }
    if (typeof priority === 'string') {
      const upper = priority.toUpperCase();
      if (VOICE_PRIORITIES[upper] !== undefined) {
        return VOICE_PRIORITIES[upper];
      }
    }
    return VOICE_PRIORITIES.NORMAL;
  }

  /**
   * Sets current typing rate in PPM (keystrokes per minute).
   * @param {number} ppm
   */
  setTypingRate(ppm) {
    this._currentPPM = Math.max(0, Number(ppm) || 0);
  }

  /**
   * Gets current typing rate in PPM.
   * @returns {number}
   */
  getTypingRate() {
    return this._currentPPM;
  }

  /**
   * Sets the pronunciation mode: 'LETTER_NAME' or 'PHONETIC'.
   * @param {string} mode
   */
  setPronunciationMode(mode) {
    if (mode === PRONUNCIATION_MODES.PHONETIC || mode === PRONUNCIATION_MODES.LETTER_NAME) {
      this._pronunciationMode = mode;
    }
  }

  /**
   * Gets active pronunciation mode.
   * @returns {string}
   */
  getPronunciationMode() {
    return this._pronunciationMode;
  }

  /**
   * Sets voice volume (clamped 0.0 to 1.0).
   * @param {number} vol
   */
  setVolume(vol) {
    if (typeof vol === 'number' && !isNaN(vol)) {
      this._volume = Math.max(0, Math.min(1, vol));
    }
  }

  /**
   * Gets voice volume.
   * @returns {number}
   */
  getVolume() {
    return this._volume;
  }

  /**
   * Sets mute state.
   * @param {boolean} muted
   */
  setMuted(muted) {
    this._muted = Boolean(muted);
    if (this._muted) {
      this.cancel();
    }
  }

  /**
   * Gets mute state.
   * @returns {boolean}
   */
  isMuted() {
    return this._muted;
  }

  /**
   * Speaks a key according to the active pronunciation mode (LETTER_NAME or PHONETIC).
   * 
   * @param {string} key The key character to pronounce
   * @param {Object} [options]
   * @param {string} [options.priority='NORMAL']
   * @returns {boolean} Whether speech was enqueued/dispatched
   */
  speakKey(key, options = {}) {
    if (!key || typeof key !== 'string') return false;
    const lowerKey = key.toLowerCase();

    let spokenText = key;
    if (this._pronunciationMode === PRONUNCIATION_MODES.PHONETIC) {
      spokenText = SPANISH_PHONETIC_SOUNDS[lowerKey] || key;
    } else {
      spokenText = SPANISH_LETTER_NAMES[lowerKey] || key;
    }

    return this.speak({
      text: spokenText,
      priority: options.priority || 'NORMAL',
      emotion: options.emotion || 'happy',
      rate: options.rate || this._rate,
      pitch: options.pitch || this._pitch
    });
  }

  /**
   * Primary speech request method with priority scheduling and anti-overlap preemption.
   * 
   * Speed Throttling:
   * When typing rate > 25 PPM, verbose speeches are discarded in favor of short punchy
   * interjections ("¡Bien!", "¡Genial!") to protect the child's focus flow.
   * 
   * Anti-Overlap & Preemption:
   * - CRITICAL requests cancel ongoing speech immediately and flush lower-priority items.
   * - Requests with priority higher than current utterance preempt immediately.
   * - Equal or lower priority requests are queued and played sequentially.
   * 
   * @param {Object} request
   * @param {string} request.text Text to speak
   * @param {string|number} [request.priority='NORMAL'] 'CRITICAL' | 'HIGH' | 'NORMAL' | 'LOW'
   * @param {string} [request.emotion='happy']
   * @param {number} [request.rate] Speech rate override
   * @param {number} [request.pitch] Speech pitch override
   * @param {Function} [request.onStart]
   * @param {Function} [request.onEnd]
   * @returns {boolean} Whether the request was accepted
   */
  speak(request) {
    if (!request || !request.text || typeof request.text !== 'string') {
      return false;
    }
    if (this._muted || this._volume <= 0) {
      if (typeof request.onEnd === 'function') {
        setTimeout(request.onEnd, 10);
      }
      return false;
    }

    const priorityLevel = this._normalizePriority(request.priority);
    let textToSpeak = cleanSpeechText(request.text);
    if (!textToSpeak) return false;

    // Rate Throttle: When PPM > 25, non-critical verbose speeches are converted to short interjections
    if (this._currentPPM > this._rateThrottleThreshold && priorityLevel < VOICE_PRIORITIES.CRITICAL) {
      const now = Date.now();
      // If text is long (> 16 chars) or a full sentence, substitute with short encouragement
      if (textToSpeak.length > 16 || textToSpeak.includes(' ')) {
        // Enforce cooldown so we don't spam cheers too rapidly during fast typing
        if (now - this._lastInterjectionTime < 2500) {
          // Drop speech entirely to let the child focus on typing rhythm
          return false;
        }
        const interjection = SHORT_INTERJECTIONS[Math.floor(Math.random() * SHORT_INTERJECTIONS.length)];
        textToSpeak = interjection;
        this._lastInterjectionTime = now;
      }
    }

    const item = {
      text: textToSpeak,
      audioId: request.audioId || null,
      priorityLevel,
      priority: request.priority || 'NORMAL',
      emotion: request.emotion || 'happy',
      rate: typeof request.rate === 'number' ? request.rate : this._rate,
      pitch: typeof request.pitch === 'number' ? request.pitch : this._pitch,
      onStart: request.onStart,
      onEnd: request.onEnd
    };

    // Preemption Handling
    if (priorityLevel === VOICE_PRIORITIES.CRITICAL) {
      // 1. Cancel ongoing speech immediately
      this._cancelCurrent();
      // 2. Discard any queued items that have lower priority than CRITICAL
      this._queue = this._queue.filter(q => q.priorityLevel >= VOICE_PRIORITIES.CRITICAL);
      // 3. Put critical item at head and play
      this._queue.unshift(item);
      this._processQueue();
      return true;
    }

    if (this._isSpeaking && this._currentRequest) {
      if (priorityLevel > this._currentRequest.priorityLevel) {
        // Higher priority preempts currently speaking lower priority utterance
        this._cancelCurrent();
        this._queue.unshift(item);
        this._processQueue();
        return true;
      }
    }

    // Insert into queue ordered by priority (highest priority first, FIFO within same priority)
    this._insertByPriority(item);

    if (!this._isSpeaking) {
      this._processQueue();
    }
    return true;
  }

  /**
   * Inserts an item into the queue preserving priority ordering.
   * @private
   */
  _insertByPriority(item) {
    let insertIdx = this._queue.length;
    for (let i = 0; i < this._queue.length; i++) {
      if (item.priorityLevel > this._queue[i].priorityLevel) {
        insertIdx = i;
        break;
      }
    }
    this._queue.splice(insertIdx, 0, item);
  }

  /**
   * Processes the next item in the speech queue.
   * @private
   */
  _processQueue() {
    if (this._isSpeaking || this._queue.length === 0) {
      return;
    }

    // Delegate to high-fidelity VoiceEngine if configured
    if (this._voiceEngine && typeof this._voiceEngine.speak === 'function') {
      const item = this._queue.shift();
      this._currentRequest = item;
      this._isSpeaking = true;

      const req = {
        text: item.text,
        audioId: item.audioId || null,
        onStart: () => {
          if (typeof item.onStart === 'function') item.onStart();
        },
        onEnd: () => {
          this._isSpeaking = false;
          this._currentRequest = null;
          if (typeof item.onEnd === 'function') item.onEnd();
          this._processQueue();
        }
      };

      this._voiceEngine.speak(req).catch(() => {
        this._isSpeaking = false;
        this._currentRequest = null;
        if (typeof item.onEnd === 'function') item.onEnd();
        this._processQueue();
      });
      return;
    }

    const synth = this.getSpeechSynthesis();
    const UtteranceClass = this.getUtteranceClass();

    if (!synth || !UtteranceClass) {
      // Headless / unsupported fallback: safely invoke callbacks and empty queue
      const item = this._queue.shift();
      if (item) {
        if (typeof item.onStart === 'function') item.onStart();
        if (typeof item.onEnd === 'function') setTimeout(item.onEnd, 10);
      }
      return;
    }

    const item = this._queue.shift();
    this._currentRequest = item;
    this._isSpeaking = true;

    try {
      const utterance = new UtteranceClass(item.text);
      utterance.lang = 'es-ES';
      utterance.volume = this._volume;
      utterance.rate = item.rate || this._rate;
      utterance.pitch = item.pitch || this._pitch;

      if (this._preferredVoice) {
        utterance.voice = this._preferredVoice;
      }

      utterance.onstart = () => {
        if (typeof item.onStart === 'function') {
          item.onStart();
        }
      };

      const handleEnd = () => {
        this._isSpeaking = false;
        this._currentRequest = null;
        if (typeof item.onEnd === 'function') {
          item.onEnd();
        }
        // Process next queued request
        this._processQueue();
      };

      utterance.onend = handleEnd;
      utterance.onerror = (err) => {
        // Speech cancellation fires 'canceled' or 'interrupted' error code; handle cleanly
        handleEnd();
      };

      synth.speak(utterance);
    } catch (err) {
      console.warn('[VoiceQueue] Speech error:', err.message);
      this._isSpeaking = false;
      this._currentRequest = null;
      if (typeof item.onEnd === 'function') item.onEnd();
      this._processQueue();
    }
  }

  /**
   * Cancels the currently active utterance cleanly.
   * @private
   */
  _cancelCurrent() {
    if (this._voiceEngine && typeof this._voiceEngine.stop === 'function') {
      try { this._voiceEngine.stop(); } catch (_) {}
    }
    const synth = this.getSpeechSynthesis();
    if (synth && typeof synth.cancel === 'function') {
      try {
        synth.cancel();
      } catch (_) {}
    }
    this._isSpeaking = false;
    this._currentRequest = null;
  }

  /**
   * Clears the entire speech queue and cancels any current speech.
   */
  cancel() {
    this._cancelCurrent();
    this._queue = [];
  }

  /**
   * Direct alias for clear()
   */
  clear() {
    this.cancel();
  }

  /**
   * Returns current pending queue length.
   * @returns {number}
   */
  getQueueLength() {
    return this._queue.length;
  }

  /**
   * Returns a snapshot of pending queue items.
   * @returns {Array<Object>}
   */
  getQueue() {
    return [...this._queue];
  }

  /**
   * Returns whether speech synthesis is actively playing.
   * @returns {boolean}
   */
  isSpeaking() {
    return this._isSpeaking;
  }

  /**
   * Binds this VoiceQueue to a typed EventBus instance.
   * Automatically handles MASCOT_SPEAK_REQUEST, LEVEL_COMPLETED, USER_STUCK,
   * and tracks KEY_PRESSED_SUCCESS for PPM speed throttling.
   * 
   * @param {Object} eventBus
   * @returns {Function} Unsubscribe disposer
   */
  bindEventBus(eventBus) {
    if (!eventBus || typeof eventBus.on !== 'function') {
      return () => {};
    }

    // 1. MASCOT_SPEAK_REQUEST
    const unsubMascotSpeak = eventBus.on('MASCOT_SPEAK_REQUEST', (payload) => {
      if (!payload || !payload.text) return;
      const now = Date.now();
      // Avoid double-speaking thinking advice if USER_STUCK just spoke within 2.5s
      if (payload.emotion === 'thinking' && this._lastStuckSpokenTime && (now - this._lastStuckSpokenTime < 2500)) {
        return;
      }
      this.speak({
        text: payload.text,
        priority: payload.priority || 'NORMAL',
        emotion: payload.emotion || 'happy',
        audioId: payload.audioId || null
      });
    });

    // 2. LEVEL_COMPLETED (Critical priority congratulatory voice)
    const unsubLevelCompleted = eventBus.on('LEVEL_COMPLETED', (payload) => {
      const stars = payload && typeof payload.stars === 'number' ? payload.stars : 3;
      let victoryText = '¡Nivel completado! ¡Increíble trabajo!';
      if (stars === 3) {
        victoryText = '¡Excelente! ¡Tres estrellas perfectas! ¡Choca esos cinco!';
      } else if (stars === 2) {
        victoryText = '¡Muy bien hecho! ¡Has ganado dos estrellas!';
      }
      this.speak({
        text: victoryText,
        priority: 'CRITICAL',
        emotion: 'victory'
      });
    });

    // 3. USER_STUCK (High priority pointing advice with anti-spam cooldown)
    const unsubUserStuck = eventBus.on('USER_STUCK', (payload) => {
      if (!payload || !payload.expectedKey) return;
      const now = Date.now();
      // Cooldown: prevent spamming voice advice more than once every 5 seconds
      if (this._lastStuckSpokenTime && (now - this._lastStuckSpokenTime < 5000)) {
        return;
      }
      this._lastStuckSpokenTime = now;

      const keyName = SPANISH_LETTER_NAMES[payload.expectedKey.toLowerCase()] || payload.expectedKey;
      this.speak({
        text: `Pulsa la tecla ${keyName}`,
        priority: 'HIGH',
        emotion: 'thinking'
      });
    });

    // 4. KEY_PRESSED_SUCCESS (Cancel active advice & track PPM)
    const unsubKeySuccess = eventBus.on('KEY_PRESSED_SUCCESS', () => {
      // 🛑 Immediately stop any ongoing advice speech so Roby never lags behind!
      this.cancel();

      const now = Date.now();
      this._recentKeystrokes.push(now);
      // Keep keystrokes from the last 15 seconds
      const cutoff = now - 15000;
      this._recentKeystrokes = this._recentKeystrokes.filter(t => t >= cutoff);
      if (this._recentKeystrokes.length >= 2) {
        const spanMs = now - this._recentKeystrokes[0];
        if (spanMs > 1000) {
          const ppm = Math.round((this._recentKeystrokes.length / (spanMs / 60000)));
          this.setTypingRate(ppm);
        }
      }
    });

    const disposer = () => {
      if (typeof unsubMascotSpeak === 'function') unsubMascotSpeak();
      if (typeof unsubLevelCompleted === 'function') unsubLevelCompleted();
      if (typeof unsubUserStuck === 'function') unsubUserStuck();
      if (typeof unsubKeySuccess === 'function') unsubKeySuccess();
    };

    this._eventDisposers.push(disposer);
    return disposer;
  }

  /**
   * Disposes all EventBus subscriptions and cancels active speech.
   */
  dispose() {
    for (const d of this._eventDisposers) {
      try { d(); } catch (_) {}
    }
    this._eventDisposers = [];
    this.cancel();
  }
}
