/**
 * VoiceEngine.js - High-Fidelity Neural Voice Engine & Web Audio DSP Pipeline for Mecano
 * 
 * Fulfills Phase 1 Requirements:
 * - Hybrid speech pipeline: pre-rendered neural MP3s (edge-tts) + curated SpeechSynthesis fallback.
 * - Web Audio API DSP Chain: Highpass (85Hz) -> Peaking EQ (2800Hz, +2.5dB, Q=1.2) -> DynamicsCompressor -> AnalyserNode -> MasterGain -> Destination.
 * - Real-time audio analysis via AnalyserNode (fftSize=256) for acoustic lip-sync.
 * - Pure procedural SFX synthesizer: tactile key click, damped miss tone, ascending victory chord.
 * - Prosodic text normalization with natural respiratory pauses, formant preservation (pitch 1.00-1.04, rate 0.98-1.03).
 * - Curated heuristic voice ranking prioritizing Microsoft Edge Natural / Online, Google Español, and Apple Enhanced.
 */

import { cleanSpeechText } from './VoiceQueue.js';

export const VOICE_TIERS = Object.freeze({
  EDGE_NATURAL: 100,
  GOOGLE_ESPANOL: 80,
  APPLE_ENHANCED: 70,
  SAPI5_DESKTOP: -100
});

export class VoiceEngine {
  /**
   * @param {Object} [options]
   * @param {AudioContext} [options.audioContext]
   * @param {number} [options.volume=1.0] Master voice volume
   * @param {boolean} [options.muted=false] Master mute state
   * @param {Object} [options.eventBus=null] EventBus instance
   */
  constructor(options = {}) {
    this._customAudioContext = options.audioContext || null;
    this._audioCtx = null;
    this._volume = typeof options.volume === 'number' ? Math.max(0, Math.min(1, options.volume)) : 1.0;
    this._muted = Boolean(options.muted);
    this.eventBus = options.eventBus || null;

    // DSP Nodes
    this._highpassNode = null;
    this._peakingNode = null;
    this._compressorNode = null;
    this._analyserNode = null;
    this._voiceGainNode = null;
    this._sfxGainNode = null;

    // Neural MP3 Pre-rendered Audio Cache
    this._manifest = null;
    this._audioBufferCache = new Map(); // phraseId/url -> AudioBuffer
    this._activeSourceNode = null;

    // SpeechSynthesis Fallback State
    this._preferredVoice = null;
    this._allVoices = [];
    this._isSpeaking = false;
    this._visemeCallback = null;

    // Autoplay unlock
    this._setupAutoplayUnlock();

    // Initialize Web Speech API curated voice picker
    this._initSpeechVoices();

    // Load Neural MP3 Manifest
    this._loadManifest();
  }

  /**
   * Lazy initializes the Web Audio API AudioContext and DSP processing graph.
   * @returns {AudioContext|null}
   */
  getAudioContext() {
    if (this._customAudioContext) {
      if (!this._highpassNode) {
        this._audioCtx = this._customAudioContext;
        this._buildDspGraph();
      }
      return this._customAudioContext;
    }
    if (this._audioCtx) return this._audioCtx;

    const AudioContextClass = typeof window !== 'undefined'
      ? (window.AudioContext || window.webkitAudioContext)
      : (typeof globalThis !== 'undefined' ? globalThis.AudioContext : null);

    if (!AudioContextClass) return null;

    try {
      this._audioCtx = new AudioContextClass();
      this._buildDspGraph();
    } catch (err) {
      console.warn('[VoiceEngine] Failed to initialize AudioContext:', err.message);
    }

    return this._audioCtx;
  }

  /**
   * Builds the studio-grade DSP chain:
   * Source -> Highpass (85Hz) -> Peaking EQ (2800Hz, +2.5dB) -> Compressor -> Analyser -> VoiceGain -> Destination
   * @private
   */
  _buildDspGraph() {
    const ctx = this._audioCtx;
    if (!ctx) return;

    // 1. Highpass filter: cuts rumble and subsonics below 85Hz
    this._highpassNode = ctx.createBiquadFilter();
    this._highpassNode.type = 'highpass';
    this._highpassNode.frequency.setValueAtTime(85, ctx.currentTime);

    // 2. Peaking EQ filter: adds warmth and presence at 2800Hz (formant intelligibility)
    this._peakingNode = ctx.createBiquadFilter();
    this._peakingNode.type = 'peaking';
    this._peakingNode.frequency.setValueAtTime(2800, ctx.currentTime);
    this._peakingNode.Q.setValueAtTime(1.2, ctx.currentTime);
    this._peakingNode.gain.setValueAtTime(2.5, ctx.currentTime);

    // 3. Dynamics Compressor: stabilizes speech dynamics
    this._compressorNode = ctx.createDynamicsCompressor();
    this._compressorNode.threshold.setValueAtTime(-20, ctx.currentTime);
    this._compressorNode.knee.setValueAtTime(15, ctx.currentTime);
    this._compressorNode.ratio.setValueAtTime(3, ctx.currentTime);
    this._compressorNode.attack.setValueAtTime(0.005, ctx.currentTime);
    this._compressorNode.release.setValueAtTime(0.15, ctx.currentTime);

    // 4. AnalyserNode: extracts time-domain PCM data for acoustic lip-sync
    this._analyserNode = ctx.createAnalyser();
    this._analyserNode.fftSize = 256;
    this._analyserNode.smoothingTimeConstant = 0.5;

    // 5. Voice & SFX Gain nodes
    this._voiceGainNode = ctx.createGain();
    this._voiceGainNode.gain.setValueAtTime(this._muted ? 0 : this._volume, ctx.currentTime);

    this._sfxGainNode = ctx.createGain();
    this._sfxGainNode.gain.setValueAtTime(0.85, ctx.currentTime);

    // Connect DSP graph
    this._highpassNode.connect(this._peakingNode);
    this._peakingNode.connect(this._compressorNode);
    this._compressorNode.connect(this._analyserNode);
    this._analyserNode.connect(this._voiceGainNode);
    this._voiceGainNode.connect(ctx.destination);

    // SFX node connects directly to destination
    this._sfxGainNode.connect(ctx.destination);
  }

  /**
   * Returns the AnalyserNode for lip-sync acoustic envelope calculation.
   * @returns {AnalyserNode|null}
   */
  getAnalyserNode() {
    this.getAudioContext();
    return this._analyserNode;
  }

  /**
   * Resumes the AudioContext safely on user gesture.
   * @returns {Promise<void>}
   */
  async resume() {
    const ctx = this.getAudioContext();
    if (ctx && ctx.state === 'suspended' && typeof ctx.resume === 'function') {
      try {
        await ctx.resume();
      } catch (err) {
        console.warn('[VoiceEngine] resume() failed:', err.message);
      }
    }
  }

  /**
   * Automatically unlocks AudioContext on first pointer/key interaction.
   * @private
   */
  _setupAutoplayUnlock() {
    if (typeof window === 'undefined' || typeof window.addEventListener !== 'function') return;

    const unlockHandler = () => {
      this.resume();
      const ctx = this.getAudioContext();
      if (ctx && ctx.state === 'running') {
        const events = ['pointerdown', 'touchstart', 'keydown', 'click'];
        for (const evt of events) {
          window.removeEventListener(evt, unlockHandler, true);
        }
      }
    };

    const events = ['pointerdown', 'touchstart', 'keydown', 'click'];
    for (const evt of events) {
      window.addEventListener(evt, unlockHandler, { capture: true, passive: true });
    }
  }

  /**
   * Asynchronously loads pre-rendered neural voice manifest.
   * @private
   */
  async _loadManifest() {
    if (typeof fetch !== 'function') return;
    try {
      const res = await fetch('assets/audio/voices/manifest.json');
      if (res.ok) {
        this._manifest = await res.json();
      }
    } catch (_) {
      // Offline / standalone fallback: default phrase map
      this._manifest = {
        phrases: {
          welcome: { file: 'assets/audio/voices/welcome.mp3' },
          hand_position: { file: 'assets/audio/voices/hand_position.mp3' },
          error_cheer_1: { file: 'assets/audio/voices/error_cheer_1.mp3' },
          error_cheer_2: { file: 'assets/audio/voices/error_cheer_2.mp3' },
          streak_10: { file: 'assets/audio/voices/streak_10.mp3' },
          streak_20: { file: 'assets/audio/voices/streak_20.mp3' },
          level_complete_3stars: { file: 'assets/audio/voices/level_complete_3stars.mp3' },
          level_complete_2stars: { file: 'assets/audio/voices/level_complete_2stars.mp3' },
          level_complete_1star: { file: 'assets/audio/voices/level_complete_1star.mp3' },
          high_five: { file: 'assets/audio/voices/high_five.mp3' }
        }
      };
    }
  }

  /**
   * Normalizes prosody by inserting clause pauses and formatting signs.
   * @param {string} rawText
   * @returns {string} Prosodically balanced text
   */
  normalizeProsody(rawText) {
    if (!rawText || typeof rawText !== 'string') return '';
    let text = cleanSpeechText(rawText);

    // Ensure polite pause after exclamations and questions
    text = text.replace(/([!¡?¿]+)\s*/g, '$1 ');
    // Insert natural breathing pauses for long compound clauses
    text = text.replace(/([,;])\s*/g, '$1 ');
    // Collapse excess whitespace
    text = text.replace(/\s+/g, ' ').trim();

    return text;
  }

  /**
   * Scores and ranks SpeechSynthesis voices to ensure high-fidelity neural voices.
   * @param {SpeechSynthesisVoice} voice
   * @returns {number} Score
   */
  scoreVoice(voice) {
    if (!voice) return -1000;
    const name = (voice.name || '').toLowerCase();
    const lang = (voice.lang || '').toLowerCase();
    const uri = (voice.voiceURI || '').toLowerCase();

    if (!lang.startsWith('es') && !name.includes('spanish')) {
      return -500;
    }

    let score = 0;

    // Severe penalty for legacy robotic SAPI5 desktop voices
    if (name.includes('desktop') || uri.includes('desktop') || name.includes('sapi') || name.includes('espeak')) {
      return -100;
    }

    // Priority 1: Edge Natural / Online
    if (name.includes('natural') || name.includes('online')) {
      score += 100;
      if (name.includes('álvaro') || name.includes('alvaro')) score += 20;
      else if (name.includes('elvira')) score += 18;
      else if (name.includes('ximena')) score += 15;
      else if (name.includes('alonso')) score += 12;
    }
    // Priority 2: Google Español
    else if (name.includes('google')) {
      score += 80;
    }
    // Priority 3: Apple Enhanced / Premium
    else if (name.includes('enhanced') || name.includes('premium') || name.includes('mónica') || name.includes('paulina')) {
      score += 70;
    } else {
      score += 40;
    }

    if (lang === 'es-es') score += 5;
    return score;
  }

  /**
   * Initializes SpeechSynthesis voices with async retry mechanism.
   * @private
   */
  _initSpeechVoices() {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;

    const synth = window.speechSynthesis;
    const pickBest = () => {
      const voices = synth.getVoices() || [];
      if (!Array.isArray(voices) || voices.length === 0) return;

      this._allVoices = voices.filter(v => (v.lang || '').toLowerCase().startsWith('es'));
      const ranked = [...voices].sort((a, b) => this.scoreVoice(b) - this.scoreVoice(a));

      if (ranked.length > 0 && this.scoreVoice(ranked[0]) > -50) {
        this._preferredVoice = ranked[0];
      }
    };

    pickBest();
    if (synth.onvoiceschanged !== undefined) {
      synth.onvoiceschanged = pickBest;
    }
    setTimeout(pickBest, 400);
    setTimeout(pickBest, 1200);
  }

  /**
   * Returns curated list of available Spanish voices for the UI dropdown.
   * @returns {Array<{ id: string, name: string, isNatural: boolean }>}
   */
  getAvailableVoices() {
    if (typeof window === 'undefined' || !window.speechSynthesis) return [];
    const synth = window.speechSynthesis;
    const voices = synth.getVoices() || [];

    const spanish = voices.filter(v => (v.lang || '').toLowerCase().startsWith('es'));
    spanish.sort((a, b) => this.scoreVoice(b) - this.scoreVoice(a));

    return spanish.map(v => ({
      id: v.name,
      name: v.name.replace(/Microsoft\s+/i, '').replace(/\s*-\s*Spanish.*$/i, ''),
      lang: v.lang,
      isNatural: v.name.toLowerCase().includes('natural') || v.name.toLowerCase().includes('google')
    }));
  }

  /**
   * Sets preferred voice by name or voiceURI.
   * @param {string} voiceName
   */
  setVoice(voiceName) {
    if (!voiceName || typeof window === 'undefined' || !window.speechSynthesis) return;
    const synth = window.speechSynthesis;
    const voices = synth.getVoices() || [];
    const found = voices.find(v => v.name === voiceName || v.voiceURI === voiceName);
    if (found) {
      this._preferredVoice = found;
    }
  }

  /**
   * Finds the best offline/local Spanish voice for instant fallback if online synthesis fails.
   * @private
   */
  _findLocalSpanishVoice() {
    if (typeof window === 'undefined' || !window.speechSynthesis) return null;
    const voices = window.speechSynthesis.getVoices() || [];
    const local = voices.find(v => (v.lang || '').toLowerCase().startsWith('es') && v.localService);
    if (local) return local;
    const offline = voices.find(v => (v.lang || '').toLowerCase().startsWith('es') && !v.name.includes('Online'));
    if (offline) return offline;
    return voices.find(v => (v.lang || '').toLowerCase().startsWith('es')) || null;
  }

  /**
   * Primary speech dispatch method:
   * 1. Checks if the phrase matches a pre-rendered neural MP3.
   * 2. If available, plays through Web Audio API DSP chain with acoustic lip-sync.
   * 3. Fallback: synthesizes through curated SpeechSynthesis with viseme events.
   * 
   * @param {Object} request
   * @param {string} [request.audioId] Explicit pre-rendered MP3 ID (e.g. 'welcome', 'streak_10')
   * @param {string} [request.text] Text to speak
   * @param {Function} [request.onStart]
   * @param {Function} [request.onEnd]
   * @param {Function} [request.onViseme]
   * @returns {Promise<boolean>}
   */
  async speak(request = {}) {
    if (this._muted || this._volume <= 0) {
      if (typeof request.onEnd === 'function') setTimeout(request.onEnd, 10);
      return false;
    }

    // 1. Try Pre-rendered Neural MP3 match
    const phraseId = request.audioId || this._matchPhraseId(request.text);
    if (phraseId && this._manifest && this._manifest.phrases && this._manifest.phrases[phraseId]) {
      const audioCtx = this.getAudioContext();
      if (audioCtx && audioCtx.state === 'suspended') {
        try { this.resume(); } catch (_) {}
      }
      const audioFile = this._manifest.phrases[phraseId].file;
      const played = await this._playPreRenderedAudio(audioFile, request);
      if (played) return true;
    }

    // 2. Fallback to Curated SpeechSynthesis
    const textToSpeak = this.normalizeProsody(request.text || '');
    if (!textToSpeak) {
      if (typeof request.onEnd === 'function') request.onEnd();
      return false;
    }

    return this._speakWithSpeechSynthesis(textToSpeak, request);
  }

  /**
   * Matches raw text to a known pre-rendered phrase ID strictly against canonical texts.
   * Prevents teacher tips or greetings from being accidentally hijacked by substring matches.
   * @private
   */
  _matchPhraseId(text) {
    if (!text || typeof text !== 'string') return null;
    const clean = text.toLowerCase().replace(/[^a-záéíóúüñ0-9\s]/gi, '').trim();

    if (clean.startsWith('hola supermecanógrafo') || clean.startsWith('hola supermecanografo') || clean.includes('soy roby tu compañero de aventuras')) return 'welcome';
    if (clean.startsWith('coloca tus dedos índices en las teclas f y j') || clean.startsWith('coloca tus dedos indices en las teclas f y j')) return 'hand_position';
    if (clean.startsWith('increíble racha de diez aciertos') || clean.startsWith('increible racha de diez aciertos')) return 'streak_10';
    if (clean.startsWith('sensacional veinte aciertos seguidos')) return 'streak_20';
    if (clean.startsWith('misión cumplida tres estrellas perfectas') || clean.startsWith('mision cumplida tres estrellas perfectas')) return 'level_complete_3stars';
    if (clean.startsWith('muy bien hecho has superado el desafío con dos estrellas') || clean.startsWith('muy bien hecho has superado el desafio con dos estrellas')) return 'level_complete_2stars';
    if (clean.startsWith('bien jugado has completado el nivel')) return 'level_complete_1star';
    if (clean.startsWith('choca esos cinco pulsa la barra espaciadora para celebrar')) return 'high_five';
    if (clean.startsWith('no te preocupes equivocarse es el truco secreto para aprender')) return 'error_cheer_1';
    if (clean.startsWith('respira hondo y busca la tecla iluminada tú tienes superpoderes') || clean.startsWith('respira hondo y busca la tecla iluminada tu tienes superpoderes')) return 'error_cheer_2';

    return null;
  }

  /**
   * Plays a pre-rendered neural MP3 via Web Audio API DSP chain with acoustic lip-sync.
   * @private
   */
  async _playPreRenderedAudio(url, request) {
    const ctx = this.getAudioContext();
    if (!ctx) return false;

    try {
      let buffer = this._audioBufferCache.get(url);
      if (!buffer) {
        const res = await fetch(url);
        if (!res.ok) return false;
        const arrayBuf = await res.arrayBuffer();
        buffer = await ctx.decodeAudioData(arrayBuf);
        this._audioBufferCache.set(url, buffer);
      }

      this.stop();

      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(this._highpassNode);

      this._activeSourceNode = source;
      this._isSpeaking = true;

      source.onended = () => {
        this._isSpeaking = false;
        this._activeSourceNode = null;
        if (typeof request.onEnd === 'function') request.onEnd();
      };

      if (typeof request.onStart === 'function') request.onStart();
      source.start(ctx.currentTime);
      return true;
    } catch (err) {
      console.warn('[VoiceEngine] Pre-rendered audio playback failed:', err.message);
      return false;
    }
  }

  /**
   * Synthesizes text using SpeechSynthesis with strict formant preservation and viseme emission.
   * @private
   */
  _speakWithSpeechSynthesis(text, request) {
    if (typeof window === 'undefined' || !window.speechSynthesis || !window.SpeechSynthesisUtterance) {
      if (typeof request.onEnd === 'function') setTimeout(request.onEnd, 10);
      return false;
    }

    this.stop();

    try {
      const synth = window.speechSynthesis;
      if (synth.paused) {
        try { synth.resume(); } catch (_) {}
      }

      const utterance = new window.SpeechSynthesisUtterance(text);
      utterance.lang = 'es-ES';
      utterance.volume = this._volume;

      // Formant preservation: strict conservative bounds
      utterance.rate = 1.01;
      utterance.pitch = 1.02;

      if (this._preferredVoice) {
        utterance.voice = this._preferredVoice;
      }

      this._activeUtterance = utterance;
      if (typeof window !== 'undefined') {
        window._activeSpeechUtterance = utterance;
      }

      let finished = false;
      const done = () => {
        if (finished) return;
        finished = true;
        this._isSpeaking = false;
        this._activeUtterance = null;
        if (typeof window !== 'undefined') window._activeSpeechUtterance = null;
        if (typeof request.onEnd === 'function') request.onEnd();
      };

      utterance.onstart = () => {
        this._isSpeaking = true;
        if (typeof request.onStart === 'function') request.onStart();
      };

      // Modulate procedural visemes on word boundaries for lip-sync
      utterance.onboundary = (e) => {
        if (typeof request.onViseme === 'function') {
          const char = text[e.charIndex] || '';
          request.onViseme(char);
        }
      };

      utterance.onend = () => {
        done();
      };

      let retriedWithLocal = false;
      utterance.onerror = (e) => {
        const errType = e.error || '';
        // If an online voice fails due to network, headless mode, or permissions, fallback immediately to local voice
        if (!retriedWithLocal && (errType === 'not-allowed' || errType === 'network' || errType === 'voice-unavailable')) {
          retriedWithLocal = true;
          const fallbackVoice = this._findLocalSpanishVoice();
          const retryUtterance = new window.SpeechSynthesisUtterance(text);
          retryUtterance.lang = 'es-ES';
          retryUtterance.volume = this._volume;
          retryUtterance.rate = 1.01;
          retryUtterance.pitch = 1.02;
          if (fallbackVoice) {
            retryUtterance.voice = fallbackVoice;
          }
          retryUtterance.onstart = utterance.onstart;
          retryUtterance.onboundary = utterance.onboundary;
          retryUtterance.onend = () => done();
          retryUtterance.onerror = () => done();
          this._activeUtterance = retryUtterance;
          if (typeof window !== 'undefined') window._activeSpeechUtterance = retryUtterance;
          try {
            synth.speak(retryUtterance);
            return;
          } catch (_) {
            done();
            return;
          }
        }
        done();
      };

      // Safety watchdog: prevent queue lock if speech engine drops
      const safetyTimeoutMs = Math.max(3000, text.length * 120);
      setTimeout(() => {
        if (!finished && this._activeUtterance === utterance) {
          done();
        }
      }, safetyTimeoutMs);

      synth.speak(utterance);
      return true;
    } catch (err) {
      this._isSpeaking = false;
      if (typeof request.onEnd === 'function') request.onEnd();
      return false;
    }
  }

  /**
   * Stops any currently playing speech.
   */
  stop() {
    if (this._activeSourceNode) {
      try { this._activeSourceNode.stop(); } catch (_) {}
      this._activeSourceNode = null;
    }
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      try { window.speechSynthesis.cancel(); } catch (_) {}
    }
    this._isSpeaking = false;
  }

  /**
   * Sets master voice volume.
   * @param {number} vol (0.0 to 1.0)
   */
  setVolume(vol) {
    this._volume = Math.max(0, Math.min(1, Number(vol) || 0));
    if (this._voiceGainNode && this._audioCtx) {
      this._voiceGainNode.gain.setValueAtTime(this._muted ? 0 : this._volume, this._audioCtx.currentTime);
    }
  }

  /**
   * Sets mute state.
   * @param {boolean} muted
   */
  setMuted(muted) {
    this._muted = Boolean(muted);
    if (this._muted) {
      this.stop();
    }
    if (this._voiceGainNode && this._audioCtx) {
      this._voiceGainNode.gain.setValueAtTime(this._muted ? 0 : this._volume, this._audioCtx.currentTime);
    }
  }

  isSpeaking() {
    return this._isSpeaking;
  }

  // ==========================================================================
  // PROCEDURAL SFX SYNTHESIZER (Pure Web Audio API - Zero external files)
  // ==========================================================================

  /**
   * Emits a pleasant mechanical tactile key click on correct keystroke.
   * Triangle oscillator + resonant bandpass filter with quick 25ms decay.
   * @param {number} [combo=1]
   */
  playTactileKeyClick(combo = 1) {
    const ctx = this.getAudioContext();
    if (!ctx || this._muted) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      // Pitch rises gently with combo
      const baseFreq = 480 + Math.min(combo * 16, 240);
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(baseFreq, now);

      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(baseFreq * 1.5, now);
      filter.Q.setValueAtTime(3.0, now);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.exponentialRampToValueAtTime(0.18, now + 0.004);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.035);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this._sfxGainNode);

      osc.start(now);
      osc.stop(now + 0.04);
    } catch (_) {}
  }

  /**
   * Emits a non-punitive damped wood/rubber miss tone on failed keystroke.
   * 140Hz downward sweep with 380Hz lowpass filter.
   */
  playDampedMissTone() {
    const ctx = this.getAudioContext();
    if (!ctx || this._muted) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(140, now);
      osc.frequency.exponentialRampToValueAtTime(55, now + 0.12);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(380, now);

      gain.gain.setValueAtTime(0.22, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this._sfxGainNode);

      osc.start(now);
      osc.stop(now + 0.15);
    } catch (_) {}
  }

  /**
   * Emits a lush ascending celebratory chord (Do-Mi-Sol-Do / C4-E4-G4-C5) on level completion.
   */
  playVictoryChord() {
    const ctx = this.getAudioContext();
    if (!ctx || this._muted) return;

    try {
      const now = ctx.currentTime;
      const chord = [261.63, 329.63, 392.00, 523.25]; // C4, E4, G4, C5

      chord.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const delay = idx * 0.065;

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + delay);

        gain.gain.setValueAtTime(0.001, now + delay);
        gain.gain.exponentialRampToValueAtTime(0.18, now + delay + 0.015);
        gain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.7);

        osc.connect(gain);
        gain.connect(this._sfxGainNode);

        osc.start(now + delay);
        osc.stop(now + delay + 0.75);
      });
    } catch (_) {}
  }
}
