/**
 * LipSync.js - Simulated Dynamic Lip-Sync & Syllable Cadence Engine
 * 
 * Implements:
 * 1. Procedural mouth bounce/opening oscillating at speech cadence (~4.8 Hz).
 * 2. Syllable-based duration estimation matching natural child-directed speech.
 * 3. Reactive 3-bar voice waveform indicator animation.
 * 4. Integration with MASCOT_SPEAK_REQUEST event from EventBus.
 * 
 * Works in browser DOM and in headless Node.js environments.
 */

export class LipSync {
  /**
   * @param {Object} [options]
   * @param {HTMLElement} [options.mouthElement=null] Target element representing mascot mouth
   * @param {HTMLElement[]} [options.waveBars=[]] Array of elements for the voice waveform visualizer
   * @param {Object} [options.eventBus=null] EventBus instance
   * @param {number} [options.cadenceFreq=4.8] Speech cadence oscillation frequency in Hz
   * @param {number} [options.mouthAmp=0.25] Peak mouth expansion amplitude
   * @param {number} [options.msPerSyllable=180] Milliseconds per estimated syllable
   */
  constructor(options = {}) {
    this.mouthElement = options.mouthElement || null;
    this.waveBars = options.waveBars || [];
    this.indicatorElement = options.indicatorElement || (this.waveBars[0] ? this.waveBars[0].parentElement : null);
    this.eventBus = options.eventBus || null;

    this.cadenceFreq = options.cadenceFreq || 4.8; // ~4.8 syllables/sec
    this.mouthAmp = options.mouthAmp !== undefined ? options.mouthAmp : 0.25;
    this.msPerSyllable = options.msPerSyllable || 180;

    // State
    this._isSpeaking = false;
    this._time = 0; // seconds
    this._speechDuration = 0; // seconds
    this._speechElapsed = 0; // seconds
    this._currentMouthScale = 1.0;
    this._waveAmplitudes = [0, 0, 0];
    this._currentText = '';

    this._unsubscribers = [];
    this._timerId = null;

    if (this.eventBus) {
      this._setupListeners();
    }
  }

  /**
   * Subscribe to MASCOT_SPEAK_REQUEST on EventBus.
   * @private
   */
  _setupListeners() {
    if (!this.eventBus || typeof this.eventBus.on !== 'function') return;

    const unsub = this.eventBus.on('MASCOT_SPEAK_REQUEST', (payload) => {
      if (payload && payload.text) {
        this.speak(payload.text);
      }
    });
    this._unsubscribers.push(unsub);

    // KEY_PRESSED_SUCCESS: Immediately stop speech animation & waveform indicator
    const unsubSuccess = this.eventBus.on('KEY_PRESSED_SUCCESS', () => {
      this.stopSpeaking();
    });
    this._unsubscribers.push(unsubSuccess);
  }

  /**
   * Bind DOM elements for mouth and waveform visualization.
   * @param {Object} elements
   * @param {HTMLElement} [elements.mouthElement]
   * @param {HTMLElement[]} [elements.waveBars]
   */
  bindElements({ mouthElement, waveBars, indicatorElement } = {}) {
    if (mouthElement) this.mouthElement = mouthElement;
    if (Array.isArray(waveBars)) {
      this.waveBars = waveBars;
      if (!this.indicatorElement && waveBars[0] && waveBars[0].parentElement) {
        this.indicatorElement = waveBars[0].parentElement;
      }
    }
    if (indicatorElement) this.indicatorElement = indicatorElement;
  }

  /**
   * Estimate syllable count from Spanish/English text.
   * Counts vowel groupings and spaces to produce natural child speech timing.
   * @param {string} text
   * @returns {number}
   */
  estimateSyllables(text) {
    if (!text || typeof text !== 'string') return 1;
    const clean = text.toLowerCase().replace(/[^a-záéíóúüñ\s]/gi, '').trim();
    if (!clean) return 1;

    // Count vowel clusters
    const vowelGroups = clean.match(/[aeiouyáéíóúü]+/gi);
    const count = vowelGroups ? vowelGroups.length : 1;
    return Math.max(1, count);
  }

  /**
   * Calculate speech duration in seconds for given text.
   * @param {string} text
   * @returns {number} duration in seconds
   */
  calculateDuration(text) {
    const syllables = this.estimateSyllables(text);
    const durationMs = Math.max(800, syllables * this.msPerSyllable);
    return durationMs / 1000;
  }

  /**
   * Trigger speaking animation for text or explicit duration.
   * @param {string} text Spoken dialogue text
   * @param {number} [durationMs] Optional override duration in ms
   */
  speak(text, durationMs) {
    this._currentText = String(text || '');
    const durationSec = (typeof durationMs === 'number' && durationMs > 0)
      ? durationMs / 1000
      : this.calculateDuration(this._currentText);

    this._isSpeaking = true;
    this._speechDuration = durationSec;
    this._speechElapsed = 0;
    this._time = 0;

    if (this.indicatorElement && this.indicatorElement.classList) {
      this.indicatorElement.classList.add('is-speaking');
    }

    // Clear existing timer if any
    if (this._timerId) {
      clearTimeout(this._timerId);
      this._timerId = null;
    }

    // Set automatic stop timer
    this._timerId = setTimeout(() => {
      this.stopSpeaking();
    }, durationSec * 1000);
  }

  /**
   * Stop speaking animation and reset mouth to rest.
   */
  stopSpeaking() {
    this._isSpeaking = false;
    this._currentMouthScale = 1.0;
    this._waveAmplitudes = [0, 0, 0];
    this._speechElapsed = 0;

    if (this._timerId) {
      clearTimeout(this._timerId);
      this._timerId = null;
    }

    if (this.indicatorElement && this.indicatorElement.classList) {
      this.indicatorElement.classList.remove('is-speaking');
    }

    this._applyDOM();
  }

  /**
   * Check if mascot is currently speaking.
   * @returns {boolean}
   */
  isSpeaking() {
    return this._isSpeaking;
  }

  /**
   * Update procedural mouth bounce and waveform bars by delta time.
   * @param {number} deltaTimeMs
   */
  update(deltaTimeMs) {
    const dt = Math.max(0, Math.min(100, deltaTimeMs)) / 1000;

    if (!this._isSpeaking) {
      this._currentMouthScale = 1.0;
      this._waveAmplitudes = [0, 0, 0];
      return;
    }

    this._time += dt;
    this._speechElapsed += dt;

    if (this._speechElapsed >= this._speechDuration) {
      this.stopSpeaking();
      return;
    }

    // Mouth scale oscillation: S_mouth(t) = 1.0 + A_talk * |sin(2 * PI * f * t)|
    const omega = 2 * Math.PI * this.cadenceFreq;
    const sineVal = Math.sin(omega * this._time);
    const absVal = Math.abs(sineVal);
    this._currentMouthScale = 1.0 + this.mouthAmp * absVal;

    // 3-Bar Waveform phases
    const b1 = Math.abs(Math.sin(omega * this._time));
    const b2 = Math.abs(Math.sin(omega * this._time + Math.PI / 3));
    const b3 = Math.abs(Math.sin(omega * this._time + (2 * Math.PI) / 3));
    this._waveAmplitudes = [
      Number(b1.toFixed(3)),
      Number(b2.toFixed(3)),
      Number(b3.toFixed(3))
    ];

    this._applyDOM();
  }

  /**
   * Apply calculated scales to DOM elements if available.
   * @private
   */
  _applyDOM() {
    // 1. Mouth element scale
    if (this.mouthElement && this.mouthElement.style) {
      this.mouthElement.style.transform = `scaleY(${this._currentMouthScale.toFixed(3)})`;
    }

    // 2. Wave bars height and indicator visibility
    if (this.indicatorElement && this.indicatorElement.classList) {
      if (this._isSpeaking) {
        this.indicatorElement.classList.add('is-speaking');
      } else {
        this.indicatorElement.classList.remove('is-speaking');
      }
    }

    if (Array.isArray(this.waveBars)) {
      this.waveBars.forEach((bar, idx) => {
        if (bar && bar.style) {
          const amp = this._waveAmplitudes[idx % 3] || 0;
          const heightPx = this._isSpeaking ? Math.round(6 + amp * 18) : 4;
          bar.style.height = `${heightPx}px`;
        }
      });
    }
  }

  /**
   * Get current mouth vertical scale factor.
   * @returns {number}
   */
  getMouthScale() {
    return Number(this._currentMouthScale.toFixed(3));
  }

  /**
   * Get normalized [0, 1] amplitudes of the 3 waveform bars.
   * @returns {number[]}
   */
  getWaveAmplitudes() {
    return [...this._waveAmplitudes];
  }

  /**
   * Teardown and unsubscribe from all events.
   */
  destroy() {
    this.stopSpeaking();
    for (const unsub of this._unsubscribers) {
      if (typeof unsub === 'function') unsub();
    }
    this._unsubscribers = [];
    this.mouthElement = null;
    this.waveBars = [];
  }
}
