/**
 * ProceduralAudio.js - Web Audio API Procedural Sound Engine for Mecano
 * 
 * Fulfills Requirement R5 and PROJECT.md specifications:
 * - C Major pentatonic scale procedural synthesizer (C4 = 261.63Hz to C6 = 1046.50Hz).
 * - Ascending scale tones on consecutive KEY_PRESSED_SUCCESS combos with 8ms attack, 140ms exponential decay.
 * - Non-punitive dull wood / rubber miss tone (140Hz -> 55Hz downward pitch sweep with 380Hz lowpass filter) on KEY_PRESSED_FAIL.
 * - Autoplay policy recovery (audioCtx.resume() on user interaction).
 * - Master SFX volume and mute control.
 * - EventBus subscription integration.
 * - Headless Node.js safe execution.
 */

// Major Pentatonic Scale frequencies (C Major: C, D, E, G, A) across 2 octaves
export const PENTATONIC_SCALE = Object.freeze([
  261.63, // Step 0: C4 (Do)
  293.66, // Step 1: D4 (Re)
  329.63, // Step 2: E4 (Mi)
  392.00, // Step 3: G4 (Sol)
  440.00, // Step 4: A4 (La)
  523.25, // Step 5: C5 (Do)
  587.33, // Step 6: D5 (Re)
  659.25, // Step 7: E5 (Mi)
  783.99, // Step 8: G5 (Sol)
  880.00, // Step 9: A5 (La)
  1046.50 // Step 10: C6 (Do)
]);

export class ProceduralAudio {
  /**
   * @param {Object} [options]
   * @param {AudioContext} [options.audioContext] Optional injected AudioContext (useful for headless testing)
   * @param {number} [options.volume=0.8] Initial SFX volume (0.0 to 1.0)
   * @param {boolean} [options.muted=false] Initial muted state
   */
  constructor(options = {}) {
    this._customAudioContext = options.audioContext || null;
    this._audioCtx = null;
    this._volume = typeof options.volume === 'number' ? Math.max(0, Math.min(1, options.volume)) : 0.8;
    this._muted = Boolean(options.muted);
    this._scale = [...PENTATONIC_SCALE];
    this._eventDisposers = [];
    this._autoplayHookAttached = false;
    this._lastSuccessFrequency = 0;

    // Set up autoplay policy recovery listeners if in browser environment
    this._setupAutoplayRecovery();
  }

  /**
   * Returns the underlying AudioContext, creating it lazily if not provided.
   * Handles browser prefixing and safe fallback for headless environments.
   * @returns {AudioContext|null}
   */
  getAudioContext() {
    if (this._customAudioContext) {
      return this._customAudioContext;
    }
    if (this._audioCtx) {
      return this._audioCtx;
    }

    const AudioContextClass = typeof window !== 'undefined'
      ? (window.AudioContext || window.webkitAudioContext)
      : (typeof globalThis !== 'undefined' ? globalThis.AudioContext : null);

    if (AudioContextClass) {
      try {
        this._audioCtx = new AudioContextClass();
      } catch (err) {
        console.warn('[ProceduralAudio] Failed to initialize AudioContext:', err.message);
      }
    }
    return this._audioCtx;
  }

  /**
   * Resumes the AudioContext if suspended (browser autoplay policy requirement).
   * @returns {Promise<void>}
   */
  async resume() {
    const ctx = this.getAudioContext();
    if (ctx && ctx.state === 'suspended' && typeof ctx.resume === 'function') {
      try {
        await ctx.resume();
      } catch (err) {
        console.warn('[ProceduralAudio] resume() failed:', err.message);
      }
    }
  }

  /**
   * Hooks pointer, touch, and keyboard interactions to automatically unlock audio.
   * @private
   */
  _setupAutoplayRecovery() {
    if (typeof window === 'undefined' || typeof window.addEventListener !== 'function' || this._autoplayHookAttached) {
      return;
    }

    const unlockHandler = () => {
      this.resume();
      const ctx = this.getAudioContext();
      if (ctx && ctx.state === 'running') {
        const events = ['pointerdown', 'touchstart', 'keydown', 'click'];
        for (const evt of events) {
          window.removeEventListener(evt, unlockHandler, true);
        }
        this._autoplayHookAttached = false;
      }
    };

    const events = ['pointerdown', 'touchstart', 'keydown', 'click'];
    for (const evt of events) {
      window.addEventListener(evt, unlockHandler, { capture: true, passive: true });
    }
    this._autoplayHookAttached = true;
  }

  /**
   * Gets current SFX volume level (0.0 - 1.0).
   * @returns {number}
   */
  getVolume() {
    return this._volume;
  }

  /**
   * Sets SFX volume level (clamped to 0.0 - 1.0).
   * @param {number} vol
   */
  setVolume(vol) {
    if (typeof vol === 'number' && !isNaN(vol)) {
      this._volume = Math.max(0, Math.min(1, vol));
    }
  }

  /**
   * Returns whether audio is currently muted.
   * @returns {boolean}
   */
  isMuted() {
    return this._muted;
  }

  /**
   * Sets mute state.
   * @param {boolean} muted
   */
  setMuted(muted) {
    this._muted = Boolean(muted);
  }

  /**
   * Plays the procedural major pentatonic tone corresponding to a combo count.
   * 
   * ADSR Envelope:
   * - Attack: 8ms exponential ramp to peak (0.4 * volume)
   * - Decay: 140ms exponential decay to 0.001
   * - Total duration: ~150ms
   * - Oscillator: Sine wave (toy glockenspiel / marimba tone)
   * 
   * @param {number} [comboCount=1] Consecutive hit count (1, 2, 3...) or 0-based step index
   * @param {number} [sfxVolume] Optional override volume
   * @returns {number} The synthesized frequency in Hz
   */
  playSuccess(comboCount = 1, sfxVolume = null) {
    if (this._muted) return 0;
    const effectiveVolume = sfxVolume !== null ? Math.max(0, Math.min(1, sfxVolume)) : this._volume;
    if (effectiveVolume <= 0) return 0;

    const ctx = this.getAudioContext();
    if (!ctx) return 0;

    // Attempt resume if suspended
    if (ctx.state === 'suspended' && typeof ctx.resume === 'function') {
      ctx.resume().catch(() => {});
    }

    // Determine note index from combo count:
    // If comboCount is 0, play Step 0 (C4 = 261.63Hz)
    // If comboCount is >= 1, combo 1 plays Step 0, combo 2 plays Step 1... clamped to Step 10 (C6 = 1046.50Hz)
    let noteIndex = 0;
    if (typeof comboCount === 'number' && comboCount > 0) {
      noteIndex = Math.min(Math.floor(comboCount - 1), this._scale.length - 1);
    } else if (typeof comboCount === 'number' && comboCount === 0) {
      noteIndex = 0;
    }
    const freq = this._scale[noteIndex];
    this._lastSuccessFrequency = freq;

    try {
      const now = ctx.currentTime || 0;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);

      // ADSR: 8ms attack, 140ms exponential decay
      const peakGain = 0.4 * effectiveVolume;
      gain.gain.setValueAtTime(0.001, now);
      if (typeof gain.gain.exponentialRampToValueAtTime === 'function') {
        gain.gain.exponentialRampToValueAtTime(Math.max(0.001, peakGain), now + 0.008);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);
      } else if (typeof gain.gain.setValueAtTime === 'function') {
        gain.gain.setValueAtTime(peakGain, now + 0.008);
        gain.gain.setValueAtTime(0.001, now + 0.14);
      }

      osc.connect(gain);
      gain.connect(ctx.destination);

      if (typeof osc.start === 'function') osc.start(now);
      if (typeof osc.stop === 'function') osc.stop(now + 0.15);
    } catch (err) {
      console.warn('[ProceduralAudio] playSuccess error:', err.message);
    }

    return freq;
  }

  /**
   * Direct alias for spec compatibility: playPentatonicSuccess(comboCount, sfxVolume)
   * Where comboCount can be a direct 0-based scale index or 1-based combo count.
   * @param {number} comboCount
   * @param {number} [sfxVolume]
   * @returns {number}
   */
  playPentatonicSuccess(comboCount, sfxVolume = null) {
    if (this._muted) return 0;
    const effectiveVolume = sfxVolume !== null ? Math.max(0, Math.min(1, sfxVolume)) : this._volume;
    if (effectiveVolume <= 0) return 0;

    const ctx = this.getAudioContext();
    if (!ctx) return 0;

    const noteIndex = Math.min(Math.max(0, Math.floor(comboCount || 0)), this._scale.length - 1);
    const freq = this._scale[noteIndex];
    this._lastSuccessFrequency = freq;

    try {
      const now = ctx.currentTime || 0;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);

      const peakGain = 0.4 * effectiveVolume;
      gain.gain.setValueAtTime(0.001, now);
      if (typeof gain.gain.exponentialRampToValueAtTime === 'function') {
        gain.gain.exponentialRampToValueAtTime(Math.max(0.001, peakGain), now + 0.008);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);
      } else {
        gain.gain.setValueAtTime(peakGain, now + 0.008);
        gain.gain.setValueAtTime(0.001, now + 0.14);
      }

      osc.connect(gain);
      gain.connect(ctx.destination);

      if (typeof osc.start === 'function') osc.start(now);
      if (typeof osc.stop === 'function') osc.stop(now + 0.15);
    } catch (err) {
      console.warn('[ProceduralAudio] playPentatonicSuccess error:', err.message);
    }

    return freq;
  }

  /**
   * Plays the non-punitive acoustic wood/rubber miss sound.
   * 
   * Acoustic parameters:
   * - Downward pitch sweep: 140Hz -> 55Hz over 100ms
   * - Lowpass filter: 380Hz cutoff, Q: 2.0 (hollow wood/rubber resonance)
   * - Gain envelope: 0.35 * volume decayed to 0.001 over 120ms
   * - Oscillator: Triangle wave
   * 
   * @param {number} [sfxVolume] Optional override volume
   */
  playMiss(sfxVolume = null) {
    if (this._muted) return;
    const effectiveVolume = sfxVolume !== null ? Math.max(0, Math.min(1, sfxVolume)) : this._volume;
    if (effectiveVolume <= 0) return;

    const ctx = this.getAudioContext();
    if (!ctx) return;

    if (ctx.state === 'suspended' && typeof ctx.resume === 'function') {
      ctx.resume().catch(() => {});
    }

    try {
      const now = ctx.currentTime || 0;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter ? ctx.createBiquadFilter() : null;

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(140, now);
      if (typeof osc.frequency.exponentialRampToValueAtTime === 'function') {
        osc.frequency.exponentialRampToValueAtTime(55, now + 0.10);
      } else {
        osc.frequency.setValueAtTime(55, now + 0.10);
      }

      if (filter) {
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(380, now);
        if (filter.Q && typeof filter.Q.setValueAtTime === 'function') {
          filter.Q.setValueAtTime(2.0, now);
        }
      }

      const peakGain = 0.35 * effectiveVolume;
      gain.gain.setValueAtTime(peakGain, now);
      if (typeof gain.gain.exponentialRampToValueAtTime === 'function') {
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
      } else {
        gain.gain.setValueAtTime(0.001, now + 0.12);
      }

      if (filter) {
        osc.connect(filter);
        filter.connect(gain);
      } else {
        osc.connect(gain);
      }
      gain.connect(ctx.destination);

      if (typeof osc.start === 'function') osc.start(now);
      if (typeof osc.stop === 'function') osc.stop(now + 0.13);
    } catch (err) {
      console.warn('[ProceduralAudio] playMiss error:', err.message);
    }
  }

  /**
   * Direct alias for spec compatibility: playWoodMiss(sfxVolume)
   * @param {number} [sfxVolume]
   */
  playWoodMiss(sfxVolume = null) {
    this.playMiss(sfxVolume);
  }

  /**
   * Plays a crisp, cheerful button click feedback sound.
   * Uses assets/sounds/button-click.wav if available, with a procedural Web Audio pop fallback.
   * @param {number} [sfxVolume]
   */
  playButtonClick(sfxVolume = null) {
    if (this._muted) return;
    const effectiveVolume = typeof sfxVolume === 'number' ? sfxVolume : this._volume;
    if (effectiveVolume <= 0) return;

    if (typeof Audio !== 'undefined') {
      try {
        const audio = new Audio('assets/sounds/button-click.wav');
        audio.volume = Math.max(0, Math.min(1, effectiveVolume * 0.5));
        audio.play().catch(() => {});
        return;
      } catch (e) {}
    }

    const ctx = this.getAudioContext();
    if (!ctx) return;
    try {
      if (ctx.state === 'suspended' && typeof ctx.resume === 'function') {
        ctx.resume().catch(() => {});
      }
      const now = ctx.currentTime || 0;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      if (osc.frequency && typeof osc.frequency.setValueAtTime === 'function') {
        osc.frequency.setValueAtTime(520, now);
        osc.frequency.exponentialRampToValueAtTime(880, now + 0.04);
      }
      if (gain.gain && typeof gain.gain.setValueAtTime === 'function') {
        gain.gain.setValueAtTime(effectiveVolume * 0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
      }
      osc.connect(gain);
      gain.connect(ctx.destination);
      if (typeof osc.start === 'function') osc.start(now);
      if (typeof osc.stop === 'function') osc.stop(now + 0.05);
    } catch (e) {}
  }

  /**
   * Plays a celebratory victory chord/arpeggio when a level is completed.
   */
  playCelebration() {
    if (this._muted || this._volume <= 0) return;
    const celebrationNotes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
    celebrationNotes.forEach((freq, idx) => {
      setTimeout(() => {
        const ctx = this.getAudioContext();
        if (!ctx) return;
        try {
          const now = ctx.currentTime || 0;
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now);
          gain.gain.setValueAtTime(0.001, now);
          if (typeof gain.gain.exponentialRampToValueAtTime === 'function') {
            gain.gain.exponentialRampToValueAtTime(0.3 * this._volume, now + 0.01);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
          }
          osc.connect(gain);
          gain.connect(ctx.destination);
          if (typeof osc.start === 'function') osc.start(now);
          if (typeof osc.stop === 'function') osc.stop(now + 0.30);
        } catch (_) {}
      }, idx * 75);
    });
  }

  /**
   * Plays a bright, cheerful Mario-style course selection chime when clicking a map node.
   * Ascending arpeggio: E5 (659.25) -> G5 (783.99) -> C6 (1046.50) with sparkle envelope.
   * @param {number} [sfxVolume]
   */
  playMapNodeSelect(sfxVolume = null) {
    if (this._muted || this._volume <= 0) return;
    const effectiveVolume = typeof sfxVolume === 'number' ? sfxVolume : this._volume;
    const ctx = this.getAudioContext();
    if (!ctx) return;

    try {
      if (ctx.state === 'suspended' && typeof ctx.resume === 'function') {
        ctx.resume().catch(() => {});
      }
      const now = ctx.currentTime || 0;
      const notes = [
        { f: 659.25, t: 0.00, dur: 0.08 },
        { f: 783.99, t: 0.06, dur: 0.08 },
        { f: 1046.50, t: 0.12, dur: 0.22 }
      ];
      notes.forEach(({ f, t, dur }) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(f, now + t);
        gain.gain.setValueAtTime(0.001, now + t);
        if (gain.gain.exponentialRampToValueAtTime) {
          gain.gain.exponentialRampToValueAtTime(0.32 * effectiveVolume, now + t + 0.008);
          gain.gain.exponentialRampToValueAtTime(0.001, now + t + dur);
        }
        osc.connect(gain);
        gain.connect(ctx.destination);
        if (osc.start) osc.start(now + t);
        if (osc.stop) osc.stop(now + t + dur + 0.02);
      });
    } catch (_) {}
  }

  /**
   * Plays a non-punitive shake feedback tone when a locked node is clicked.
   */
  playLockedShake(sfxVolume = null) {
    this.playMiss(sfxVolume);
  }

  /**
   * Binds this audio engine to a typed EventBus instance.
   * Automatically plays pentatonic notes on KEY_PRESSED_SUCCESS,
   * plays wood miss tone on KEY_PRESSED_FAIL,
   * and plays celebratory chime on LEVEL_COMPLETED.
   * 
   * @param {Object} eventBus EventBus instance with .on() method
   * @returns {Function} Unsubscribe disposer
   */
  bindEventBus(eventBus) {
    if (!eventBus || typeof eventBus.on !== 'function') {
      return () => {};
    }

    const unsubSuccess = eventBus.on('KEY_PRESSED_SUCCESS', (payload) => {
      const combo = payload && typeof payload.comboCount === 'number' ? payload.comboCount : 1;
      this.playSuccess(combo);
    });

    const unsubFail = eventBus.on('KEY_PRESSED_FAIL', () => {
      this.playMiss();
    });

    const unsubLevelCompleted = eventBus.on('LEVEL_COMPLETED', () => {
      this.playCelebration();
    });

    const disposer = () => {
      if (typeof unsubSuccess === 'function') unsubSuccess();
      if (typeof unsubFail === 'function') unsubFail();
      if (typeof unsubLevelCompleted === 'function') unsubLevelCompleted();
    };

    this._eventDisposers.push(disposer);
    return disposer;
  }

  /**
   * Disposes all EventBus subscriptions and closes the AudioContext if opened.
   */
  dispose() {
    for (const d of this._eventDisposers) {
      try { d(); } catch (_) {}
    }
    this._eventDisposers = [];

    if (this._audioCtx && typeof this._audioCtx.close === 'function') {
      try {
        this._audioCtx.close();
      } catch (_) {}
      this._audioCtx = null;
    }
  }
}
