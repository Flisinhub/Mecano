/**
 * AccessibilityPanel.js - Audio & Accessibility Settings Panel for Mecano
 * 
 * Fulfills Requirement R5 and PROJECT.md specifications:
 * - 3 independent volume sliders: Music, SFX, Voice.
 * - Dyslexia font toggle applying .font-dyslexic with OpenDyslexic / rounded Comic Sans fallbacks.
 * - High-contrast mode toggle applying .high-contrast with neon accessibility palette (WCAG AAA >= 7:1).
 * - Pronunciation mode selector (Letter Name vs Phonetic).
 * - LocalStorage / StorageManager persistence.
 * - Accessible keyboard navigation & ARIA semantics.
 * - Headless Node.js safe execution.
 */

export const STORAGE_KEY_A11Y = 'mecano_a11y_settings';

export const DYSLEXIA_FONTS = Object.freeze({
  DEFAULT: 'default',
  OPENDYSLEXIC: 'opendyslexic',
  COMICSANS: 'comicsans'
});

export const DEFAULT_A11Y_SETTINGS = Object.freeze({
  musicVolume: 0.8,
  sfxVolume: 0.8,
  voiceVolume: 0.85,
  dyslexiaFont: DYSLEXIA_FONTS.DEFAULT,
  highContrast: false,
  pronunciationMode: 'LETTER_NAME'
});

export class AccessibilityPanel {
  /**
   * @param {Object} [options]
   * @param {Object} [options.storage] StorageManager or localStorage-like interface
   * @param {Object} [options.proceduralAudio] ProceduralAudio instance for SFX volume sync
   * @param {Object} [options.voiceQueue] VoiceQueue instance for Voice volume sync
   * @param {Object} [options.voiceEngine] VoiceEngine instance for direct audio sync
   * @param {Function} [options.onMusicVolumeChange] Callback when music volume changes
   * @param {Function} [options.onSettingsChange] Callback on any setting change
   * @param {HTMLElement} [options.container] DOM container to mount into
   */
  constructor(options = {}) {
    this._storage = options.storage || null;
    this._proceduralAudio = options.proceduralAudio || null;
    this._voiceQueue = options.voiceQueue || null;
    this._voiceEngine = options.voiceEngine || null;
    this._onMusicVolumeChange = typeof options.onMusicVolumeChange === 'function' ? options.onMusicVolumeChange : null;
    this._onSettingsChange = typeof options.onSettingsChange === 'function' ? options.onSettingsChange : null;

    this._container = options.container || null;
    this._element = null;
    this._backdrop = null;
    this._isOpen = false;

    // Load persisted settings
    this._settings = { ...DEFAULT_A11Y_SETTINGS };
    this.loadSettings();

    // Apply settings immediately to DOM and connected engines
    this.applySettings();

    // Auto mount if container provided
    if (this._container) {
      this.mount(this._container);
    }
  }

  /**
   * Resolves safe storage backend (StorageManager, window.localStorage, or memory fallback).
   * @private
   */
  _getStorageBackend() {
    if (this._storage) return this._storage;
    if (typeof window !== 'undefined' && window.localStorage) {
      return window.localStorage;
    }
    return null;
  }

  /**
   * Loads saved settings from storage.
   * @returns {Object}
   */
  loadSettings() {
    const backend = this._getStorageBackend();
    if (!backend) return this._settings;

    try {
      let raw = null;
      if (typeof backend.getItem === 'function') {
        raw = backend.getItem(STORAGE_KEY_A11Y);
      } else if (typeof backend._readJson === 'function') {
        raw = backend._readJson(STORAGE_KEY_A11Y, null);
      }

      if (raw) {
        const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
        if (parsed && typeof parsed === 'object') {
          if (typeof parsed.musicVolume === 'number') this._settings.musicVolume = Math.max(0, Math.min(1, parsed.musicVolume));
          if (typeof parsed.sfxVolume === 'number') this._settings.sfxVolume = Math.max(0, Math.min(1, parsed.sfxVolume));
          if (typeof parsed.voiceVolume === 'number') {
            this._settings.voiceVolume = parsed.voiceVolume > 0 ? Math.max(0, Math.min(1, parsed.voiceVolume)) : 0.85;
          }
          if (typeof parsed.highContrast === 'boolean') this._settings.highContrast = parsed.highContrast;
          if (typeof parsed.dyslexiaFont === 'string') this._settings.dyslexiaFont = parsed.dyslexiaFont;
          if (typeof parsed.pronunciationMode === 'string') this._settings.pronunciationMode = parsed.pronunciationMode;
        }
      }
    } catch (err) {
      console.warn('[AccessibilityPanel] Failed to load a11y settings:', err.message);
    }
    return this._settings;
  }

  /**
   * Persists settings to storage.
   * @returns {boolean}
   */
  saveSettings() {
    const backend = this._getStorageBackend();
    if (!backend) return false;

    try {
      const serialized = JSON.stringify(this._settings);
      if (typeof backend.setItem === 'function') {
        backend.setItem(STORAGE_KEY_A11Y, serialized);
      } else if (typeof backend._writeJson === 'function') {
        backend._writeJson(STORAGE_KEY_A11Y, this._settings);
      }
      return true;
    } catch (err) {
      console.warn('[AccessibilityPanel] Failed to save a11y settings:', err.message);
      return false;
    }
  }

  /**
   * Applies the current settings to the DOM (body classes) and attached audio engines.
   */
  applySettings() {
    // 1. Sync SFX Audio Engine
    if (this._proceduralAudio && typeof this._proceduralAudio.setVolume === 'function') {
      this._proceduralAudio.setVolume(this._settings.sfxVolume);
    }

    // 2. Sync Voice Queue & Voice Engine
    if (this._voiceQueue) {
      if (typeof this._voiceQueue.setVolume === 'function') {
        this._voiceQueue.setVolume(this._settings.voiceVolume);
      }
      if (typeof this._voiceQueue.setPronunciationMode === 'function') {
        this._voiceQueue.setPronunciationMode(this._settings.pronunciationMode);
      }
    }
    if (this._voiceEngine) {
      if (typeof this._voiceEngine.setVolume === 'function') {
        this._voiceEngine.setVolume(this._settings.voiceVolume);
      }
    }

    // 3. Sync Background Music Callback
    if (this._onMusicVolumeChange) {
      try {
        this._onMusicVolumeChange(this._settings.musicVolume);
      } catch (_) {}
    }

    // 4. Update DOM body classes if in browser environment
    if (typeof document !== 'undefined' && document.body) {
      const body = document.body;

      // High-Contrast Mode
      if (this._settings.highContrast) {
        body.classList.add('high-contrast');
      } else {
        body.classList.remove('high-contrast');
      }

      // Dyslexia Typography
      body.classList.remove('font-dyslexic', 'font-opendyslexic', 'font-comicsans');
      if (this._settings.dyslexiaFont === DYSLEXIA_FONTS.OPENDYSLEXIC) {
        body.classList.add('font-dyslexic', 'font-opendyslexic');
      } else if (this._settings.dyslexiaFont === DYSLEXIA_FONTS.COMICSANS) {
        body.classList.add('font-dyslexic', 'font-comicsans');
      }
    }

    // 5. Notify settings change callback
    if (this._onSettingsChange) {
      try {
        this._onSettingsChange({ ...this._settings });
      } catch (_) {}
    }

    // 6. Update UI elements if panel is mounted
    this._syncUI();
  }

  /**
   * Gets current settings snapshot.
   * @returns {Object}
   */
  getSettings() {
    return { ...this._settings };
  }

  /**
   * Updates partial settings and applies them.
   * @param {Object} partial
   */
  updateSettings(partial = {}) {
    if (!partial || typeof partial !== 'object') return;

    if (typeof partial.musicVolume === 'number') {
      this._settings.musicVolume = Math.max(0, Math.min(1, partial.musicVolume));
    }
    if (typeof partial.sfxVolume === 'number') {
      this._settings.sfxVolume = Math.max(0, Math.min(1, partial.sfxVolume));
    }
    if (typeof partial.voiceVolume === 'number') {
      this._settings.voiceVolume = Math.max(0, Math.min(1, partial.voiceVolume));
    }
    if (typeof partial.highContrast === 'boolean') {
      this._settings.highContrast = partial.highContrast;
    }
    if (typeof partial.dyslexiaFont === 'string') {
      this._settings.dyslexiaFont = partial.dyslexiaFont;
    }
    if (typeof partial.pronunciationMode === 'string') {
      this._settings.pronunciationMode = partial.pronunciationMode;
    }

    this.saveSettings();
    this.applySettings();
  }

  // --- Individual Getters / Setters ---

  getMusicVolume() { return this._settings.musicVolume; }
  setMusicVolume(vol) { this.updateSettings({ musicVolume: vol }); }

  getSfxVolume() { return this._settings.sfxVolume; }
  setSfxVolume(vol) { this.updateSettings({ sfxVolume: vol }); }

  getVoiceVolume() { return this._settings.voiceVolume; }
  setVoiceVolume(vol) { this.updateSettings({ voiceVolume: vol }); }

  getHighContrast() { return this._settings.highContrast; }
  setHighContrast(enabled) { this.updateSettings({ highContrast: Boolean(enabled) }); }
  toggleHighContrast() { this.setHighContrast(!this._settings.highContrast); }

  getDyslexiaFont() { return this._settings.dyslexiaFont; }
  setDyslexiaFont(mode) {
    if (typeof mode === 'boolean') {
      mode = mode ? DYSLEXIA_FONTS.OPENDYSLEXIC : DYSLEXIA_FONTS.DEFAULT;
    }
    if (mode === DYSLEXIA_FONTS.OPENDYSLEXIC || mode === DYSLEXIA_FONTS.COMICSANS || mode === DYSLEXIA_FONTS.DEFAULT) {
      this.updateSettings({ dyslexiaFont: mode });
    }
  }

  toggleDyslexiaFont() {
    if (this._settings.dyslexiaFont === DYSLEXIA_FONTS.DEFAULT) {
      this.setDyslexiaFont(DYSLEXIA_FONTS.OPENDYSLEXIC);
    } else if (this._settings.dyslexiaFont === DYSLEXIA_FONTS.OPENDYSLEXIC) {
      this.setDyslexiaFont(DYSLEXIA_FONTS.COMICSANS);
    } else {
      this.setDyslexiaFont(DYSLEXIA_FONTS.DEFAULT);
    }
  }

  getPronunciationMode() { return this._settings.pronunciationMode; }
  setPronunciationMode(mode) { this.updateSettings({ pronunciationMode: mode }); }

  resetDefaults() {
    this._settings = { ...DEFAULT_A11Y_SETTINGS };
    this.saveSettings();
    this.applySettings();
  }

  // --- Modal Open / Close Controls ---

  isOpen() {
    return this._isOpen;
  }

  open() {
    if (!this._element && typeof document !== 'undefined') {
      this.mount(document.body);
    }
    if (this._backdrop) {
      this._backdrop.classList.remove('hidden');
      this._backdrop.setAttribute('aria-hidden', 'false');
    }
    if (this._element) {
      this._element.classList.remove('hidden');
    }
    this._isOpen = true;
    this._syncUI();
  }

  close() {
    if (this._backdrop) {
      this._backdrop.classList.add('hidden');
      this._backdrop.setAttribute('aria-hidden', 'true');
    }
    if (this._element) {
      this._element.classList.add('hidden');
    }
    this._isOpen = false;
  }

  toggle() {
    if (this._isOpen) {
      this.close();
    } else {
      this.open();
    }
  }

  /**
   * Mounts the accessible panel DOM markup into target container.
   * @param {HTMLElement} container
   */
  mount(container) {
    if (typeof document === 'undefined' || !container) return;
    this._container = container;

    // Check if element already exists
    let existing = document.getElementById('a11y-backdrop');
    if (existing && existing.parentNode) {
      existing.parentNode.removeChild(existing);
    }

    const backdrop = document.createElement('div');
    backdrop.id = 'a11y-backdrop';
    backdrop.className = 'a11y-backdrop hidden';
    backdrop.setAttribute('aria-hidden', 'true');

    backdrop.innerHTML = `
      <div class="a11y-panel" id="a11y-panel" role="dialog" aria-modal="true" aria-labelledby="a11y-panel-title">
        <div class="a11y-header">
          <h2 id="a11y-panel-title">⚙️ Accesibilidad y Audio</h2>
          <button class="a11y-close-btn" id="a11y-close-btn" aria-label="Cerrar panel de accesibilidad">✖</button>
        </div>
        <div class="a11y-body">
          <!-- 🎵 Music Volume Slider -->
          <div class="a11y-group">
            <div class="a11y-label-row">
              <label for="a11y-music-slider">🎵 Música de Fondo</label>
              <span id="a11y-music-val" class="a11y-badge">80%</span>
            </div>
            <div class="a11y-slider-row">
              <input type="range" id="a11y-music-slider" min="0" max="100" step="5" value="80" aria-label="Volumen de música de fondo" />
            </div>
          </div>

          <!-- 🔊 SFX Volume Slider -->
          <div class="a11y-group">
            <div class="a11y-label-row">
              <label for="a11y-sfx-slider">🔊 Efectos de Sonido (SFX)</label>
              <span id="a11y-sfx-val" class="a11y-badge">80%</span>
            </div>
            <div class="a11y-slider-row">
              <input type="range" id="a11y-sfx-slider" min="0" max="100" step="5" value="80" aria-label="Volumen de efectos de sonido" />
              <button id="a11y-test-sfx-btn" class="a11y-mini-btn" type="button" title="Probar sonido">🔔 Probar</button>
            </div>
          </div>

          <!-- 🗣️ Voice Volume Slider -->
          <div class="a11y-group">
            <div class="a11y-label-row">
              <label for="a11y-voice-slider">🗣️ Voz de Roby</label>
              <span id="a11y-voice-val" class="a11y-badge">100%</span>
            </div>
            <div class="a11y-slider-row">
              <input type="range" id="a11y-voice-slider" min="0" max="100" step="5" value="100" aria-label="Volumen de voz de Roby" />
              <button id="a11y-test-voice-btn" class="a11y-mini-btn" type="button" title="Probar voz">🗣️ Probar</button>
            </div>
          </div>

          <!-- 🔍 Text Size Accessibility Selector (#accessibility-text-size) -->
          <div class="a11y-group">
            <div class="a11y-label-row">
              <label for="accessibility-text-size">🔍 Tamaño de Texto (Baja Visión)</label>
            </div>
            <div class="a11y-btn-group" id="accessibility-text-size" role="radiogroup" aria-label="Tamaño de texto">
              <button type="button" id="a11y-text-normal" class="a11y-toggle-btn" role="radio" aria-checked="true">Estándar (1.0x)</button>
              <button type="button" id="a11y-text-grande" class="a11y-toggle-btn" role="radio" aria-checked="false">Grande (1.5x)</button>
              <button type="button" id="a11y-text-extra" class="a11y-toggle-btn" role="radio" aria-checked="false">Gigante (2.0x)</button>
            </div>
          </div>

          <!-- 📖 Dyslexia Typography Toggle -->
          <div class="a11y-group">
            <div class="a11y-label-row">
              <label>📖 Tipografía Adaptada (Dislexia)</label>
            </div>
            <div class="a11y-btn-group" role="radiogroup" aria-label="Selección de tipografía adaptada">
              <button type="button" id="a11y-font-default" class="a11y-toggle-btn" role="radio" aria-checked="true">Normal (Fredoka)</button>
              <button type="button" id="a11y-font-opendyslexic" class="a11y-toggle-btn" role="radio" aria-checked="false">OpenDyslexic</button>
              <button type="button" id="a11y-font-comicsans" class="a11y-toggle-btn" role="radio" aria-checked="false">Comic Sans</button>
            </div>
          </div>

          <!-- 👁️ High Contrast Toggle -->
          <div class="a11y-group a11y-switch-row">
            <div>
              <div class="a11y-switch-title">👁️ Modo Alto Contraste (WCAG AAA)</div>
              <div class="a11y-switch-sub">Fondo negro puro, bordes nítidos y teclas neón</div>
            </div>
            <button type="button" id="a11y-high-contrast-toggle" class="a11y-switch-btn" role="switch" aria-checked="false">OFF</button>
          </div>

          <!-- 🔤 Phonetic Pronunciation Toggle -->
          <div class="a11y-group a11y-switch-row">
            <div>
              <div class="a11y-switch-title">🔤 Lectura Fonética de Teclas</div>
              <div class="a11y-switch-sub">Pronunciar sonido fonético ('fff') en lugar del nombre ('efe')</div>
            </div>
            <button type="button" id="a11y-phonetic-toggle" class="a11y-switch-btn" role="switch" aria-checked="false">OFF</button>
          </div>

          <!-- ↺ Reset Defaults Button -->
          <div class="a11y-footer">
            <button type="button" id="a11y-reset-btn" class="a11y-reset-btn">↺ Restaurar Valores</button>
          </div>
        </div>
      </div>
    `;

    container.appendChild(backdrop);
    this._backdrop = backdrop;
    this._element = backdrop.querySelector('#a11y-panel');

    // Attach DOM Event Listeners
    this._attachEventListeners();
    this._syncUI();
  }

  /**
   * Binds interactive UI event listeners.
   * @private
   */
  _attachEventListeners() {
    if (!this._backdrop) return;

    // Close button
    const closeBtn = this._backdrop.querySelector('#a11y-close-btn');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.close());
    }

    // Backdrop click outside panel closes modal
    this._backdrop.addEventListener('click', (e) => {
      if (e.target === this._backdrop) {
        this.close();
      }
    });

    // Escape key closes modal
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this._isOpen) {
        this.close();
      }
    });

    // Sliders
    const musicSlider = this._backdrop.querySelector('#a11y-music-slider');
    if (musicSlider) {
      musicSlider.addEventListener('input', (e) => {
        const val = Number(e.target.value) / 100;
        this.setMusicVolume(val);
      });
    }

    const sfxSlider = this._backdrop.querySelector('#a11y-sfx-slider');
    if (sfxSlider) {
      sfxSlider.addEventListener('input', (e) => {
        const val = Number(e.target.value) / 100;
        this.setSfxVolume(val);
      });
    }

    const voiceSlider = this._backdrop.querySelector('#a11y-voice-slider');
    if (voiceSlider) {
      voiceSlider.addEventListener('input', (e) => {
        const val = Number(e.target.value) / 100;
        this.setVoiceVolume(val);
      });
    }

    // Test SFX Button
    const testSfxBtn = this._backdrop.querySelector('#a11y-test-sfx-btn');
    if (testSfxBtn && this._proceduralAudio) {
      testSfxBtn.addEventListener('click', () => {
        this._proceduralAudio.playSuccess(5);
      });
    }

    // Test Voice Button
    const testVoiceBtn = this._backdrop.querySelector('#a11y-test-voice-btn');
    if (testVoiceBtn && this._voiceQueue) {
      testVoiceBtn.addEventListener('click', () => {
        this._voiceQueue.speak({
          text: '¡Hola! Soy Roby y tu sonido está perfecto.',
          priority: 'HIGH'
        });
      });
    }

    // Dyslexia Typography Buttons
    const fontDefaultBtn = this._backdrop.querySelector('#a11y-font-default');
    const fontOpenDyslexicBtn = this._backdrop.querySelector('#a11y-font-opendyslexic');
    const fontComicSansBtn = this._backdrop.querySelector('#a11y-font-comicsans');

    if (fontDefaultBtn) {
      fontDefaultBtn.addEventListener('click', () => this.setDyslexiaFont(DYSLEXIA_FONTS.DEFAULT));
    }
    if (fontOpenDyslexicBtn) {
      fontOpenDyslexicBtn.addEventListener('click', () => this.setDyslexiaFont(DYSLEXIA_FONTS.OPENDYSLEXIC));
    }
    if (fontComicSansBtn) {
      fontComicSansBtn.addEventListener('click', () => this.setDyslexiaFont(DYSLEXIA_FONTS.COMICSANS));
    }

    // Text Size Accessibility Buttons (#accessibility-text-size)
    const applyTextScale = (scaleId, mult) => {
      if (scaleId) {
        document.body.dataset.textScale = scaleId;
        document.documentElement.dataset.textScale = scaleId;
        document.documentElement.style.setProperty('--text-scale', mult);
      } else {
        delete document.body.dataset.textScale;
        delete document.documentElement.dataset.textScale;
        document.documentElement.style.setProperty('--text-scale', '1');
      }
      const targetWord = document.getElementById('target-word');
      if (targetWord) targetWord.style.setProperty('--text-scale', mult);
      const wordPanel = document.getElementById('word-panel');
      if (wordPanel) wordPanel.style.setProperty('--text-scale', mult);
      const zoomBtn = document.getElementById('zoom-toggle-btn');
      if (zoomBtn) {
        zoomBtn.textContent = scaleId === 'extra' ? '🔍 Aa++' : (scaleId === 'grande' ? '🔍 Aa+' : '🔍 Aa');
      }
      try { localStorage.setItem('mecano_text_zoom', scaleId); } catch (_) {}
      this._syncUI();
    };

    const textNormalBtn = this._backdrop.querySelector('#a11y-text-normal');
    const textGrandeBtn = this._backdrop.querySelector('#a11y-text-grande');
    const textExtraBtn = this._backdrop.querySelector('#a11y-text-extra');

    if (textNormalBtn) textNormalBtn.addEventListener('click', () => applyTextScale('', '1'));
    if (textGrandeBtn) textGrandeBtn.addEventListener('click', () => applyTextScale('grande', '1.50'));
    if (textExtraBtn) textExtraBtn.addEventListener('click', () => applyTextScale('extra', '2.00'));

    // High Contrast Toggle Switch
    const contrastBtn = this._backdrop.querySelector('#a11y-high-contrast-toggle');
    if (contrastBtn) {
      contrastBtn.addEventListener('click', () => this.toggleHighContrast());
    }

    // Phonetic Mode Toggle Switch
    const phoneticBtn = this._backdrop.querySelector('#a11y-phonetic-toggle');
    if (phoneticBtn) {
      phoneticBtn.addEventListener('click', () => {
        const nextMode = this._settings.pronunciationMode === 'PHONETIC' ? 'LETTER_NAME' : 'PHONETIC';
        this.setPronunciationMode(nextMode);
      });
    }

    // Reset Defaults
    const resetBtn = this._backdrop.querySelector('#a11y-reset-btn');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => this.resetDefaults());
    }
  }

  /**
   * Synchronizes visual control states to match internal settings.
   * @private
   */
  _syncUI() {
    if (!this._backdrop) return;

    // Music
    const musicSlider = this._backdrop.querySelector('#a11y-music-slider');
    const musicVal = this._backdrop.querySelector('#a11y-music-val');
    const musicPct = Math.round(this._settings.musicVolume * 100);
    if (musicSlider) musicSlider.value = musicPct;
    if (musicVal) musicVal.textContent = `${musicPct}%`;

    // SFX
    const sfxSlider = this._backdrop.querySelector('#a11y-sfx-slider');
    const sfxVal = this._backdrop.querySelector('#a11y-sfx-val');
    const sfxPct = Math.round(this._settings.sfxVolume * 100);
    if (sfxSlider) sfxSlider.value = sfxPct;
    if (sfxVal) sfxVal.textContent = `${sfxPct}%`;

    // Voice
    const voiceSlider = this._backdrop.querySelector('#a11y-voice-slider');
    const voiceVal = this._backdrop.querySelector('#a11y-voice-val');
    const voicePct = Math.round(this._settings.voiceVolume * 100);
    if (voiceSlider) voiceSlider.value = voicePct;
    if (voiceVal) voiceVal.textContent = `${voicePct}%`;

    // Text Size Accessibility (#accessibility-text-size)
    const currentScale = (typeof document !== 'undefined' && document.body.dataset.textScale) || '';
    const textNormalBtn = this._backdrop.querySelector('#a11y-text-normal');
    const textGrandeBtn = this._backdrop.querySelector('#a11y-text-grande');
    const textExtraBtn = this._backdrop.querySelector('#a11y-text-extra');

    if (textNormalBtn) {
      textNormalBtn.classList.toggle('active', currentScale === '');
      textNormalBtn.setAttribute('aria-checked', String(currentScale === ''));
    }
    if (textGrandeBtn) {
      textGrandeBtn.classList.toggle('active', currentScale === 'grande');
      textGrandeBtn.setAttribute('aria-checked', String(currentScale === 'grande'));
    }
    if (textExtraBtn) {
      textExtraBtn.classList.toggle('active', currentScale === 'extra');
      textExtraBtn.setAttribute('aria-checked', String(currentScale === 'extra'));
    }

    // Dyslexia Typography Buttons
    const fontDefaultBtn = this._backdrop.querySelector('#a11y-font-default');
    const fontOpenDyslexicBtn = this._backdrop.querySelector('#a11y-font-opendyslexic');
    const fontComicSansBtn = this._backdrop.querySelector('#a11y-font-comicsans');

    if (fontDefaultBtn) {
      const active = this._settings.dyslexiaFont === DYSLEXIA_FONTS.DEFAULT;
      fontDefaultBtn.classList.toggle('active', active);
      fontDefaultBtn.setAttribute('aria-checked', String(active));
    }
    if (fontOpenDyslexicBtn) {
      const active = this._settings.dyslexiaFont === DYSLEXIA_FONTS.OPENDYSLEXIC;
      fontOpenDyslexicBtn.classList.toggle('active', active);
      fontOpenDyslexicBtn.setAttribute('aria-checked', String(active));
    }
    if (fontComicSansBtn) {
      const active = this._settings.dyslexiaFont === DYSLEXIA_FONTS.COMICSANS;
      fontComicSansBtn.classList.toggle('active', active);
      fontComicSansBtn.setAttribute('aria-checked', String(active));
    }

    // High Contrast Switch
    const contrastBtn = this._backdrop.querySelector('#a11y-high-contrast-toggle');
    if (contrastBtn) {
      contrastBtn.classList.toggle('on', this._settings.highContrast);
      contrastBtn.setAttribute('aria-checked', String(this._settings.highContrast));
      contrastBtn.textContent = this._settings.highContrast ? 'ON' : 'OFF';
    }

    // Phonetic Switch
    const phoneticBtn = this._backdrop.querySelector('#a11y-phonetic-toggle');
    if (phoneticBtn) {
      const isPhonetic = this._settings.pronunciationMode === 'PHONETIC';
      phoneticBtn.classList.toggle('on', isPhonetic);
      phoneticBtn.setAttribute('aria-checked', String(isPhonetic));
      phoneticBtn.textContent = isPhonetic ? 'ON' : 'OFF';
    }
  }

  /**
   * Destroys the panel and removes DOM elements.
   */
  destroy() {
    this.close();
    if (this._backdrop && this._backdrop.parentNode) {
      this._backdrop.parentNode.removeChild(this._backdrop);
    }
    this._backdrop = null;
    this._element = null;
  }
}
