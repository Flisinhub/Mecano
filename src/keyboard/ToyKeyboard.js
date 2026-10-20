/**
 * ToyKeyboard.js - 3D Tactile Virtual Keyboard with Projectile Targeting & Anti-Frustration Feedback
 * 
 * Fulfills Requirement R4 and PROJECT.md specifications:
 * - 3D tactile button styling with realistic depth, squishy depression, and tactile bump markers on F and J
 * - Key screen position reporting for quadratic Bézier projectile targeting
 * - Non-punitive feedback: wrong key gently shakes (applySquashAndStretch or CSS), target key pulses luminously
 * - Opposing hand Shift illumination for uppercase and shifted characters
 * - Dead-key accent (tilde) and Alt Gr guidance
 */

import {
  SPANISH_KEYBOARD_LAYOUT,
  FINGER_COLORS,
  FINGER_NAMES,
  getFingerForKey,
  getKeyBaseChar,
  isHomemarkKey,
  hasAccent,
  hasDiaeresis,
  requiresShift,
  requiresAltGr,
  getShiftHandForChar
} from './KeyboardLayout.js';

import * as squashStretchModule from '../vfx/SquashStretch.js';

export class ToyKeyboard {
  /**
   * @param {Object} [options]
   * @param {HTMLElement|string} [options.container='#keyboard'] - Container element or selector
   * @param {Object} [options.eventBus=null] - EventBus instance for Pub/Sub events
   * @param {Array} [options.layout=SPANISH_KEYBOARD_LAYOUT] - Custom layout definition
   * @param {Function} [options.onKeyPress=null] - Callback invoked when a virtual key is clicked
   */
  constructor(options = {}) {
    this.container = typeof options.container === 'string'
      ? (typeof document !== 'undefined' ? document.querySelector(options.container) : null)
      : options.container;

    this.eventBus = options.eventBus || null;
    this.layout = options.layout || SPANISH_KEYBOARD_LAYOUT;
    this.onKeyPress = options.onKeyPress || null;

    this.currentTargetChar = null;
    this.keyElementsMap = new Map(); // keyChar -> HTMLElement
    this._eventDisposers = [];
    this._hitTimeouts = new Set();
    this._wiggleTimeouts = new Set();

    this.init();
  }

  /**
   * Initializes keyboard DOM, styling, and event subscriptions
   */
  init() {
    if (this.container) {
      this.render();
    }
    if (this.eventBus) {
      this.bindEventBus();
    }
  }

  /**
   * Mounts the keyboard to a new DOM container
   * @param {HTMLElement|string} container
   */
  mount(container) {
    this.container = typeof container === 'string'
      ? (typeof document !== 'undefined' ? document.querySelector(container) : null)
      : container;

    if (this.container) {
      this.init();
    }
  }

  /**
   * Renders the 3D toy-style keyboard inside container
   */
  render() {
    if (!this.container || typeof document === 'undefined') return;

    this.keyElementsMap.clear();

    // Check if the container already has child elements from static HTML
    const existingKeys = this.container.querySelectorAll('.key');
    if (existingKeys.length > 0) {
      // Upgrade and map existing keys from HTML
      this._upgradeExistingDomKeys(existingKeys);
      return;
    }

    // Otherwise, generate the full 3D keyboard dynamically from layout matrix
    this.container.classList.add('toy-keyboard');
    this.container.innerHTML = '';

    for (let r = 0; r < this.layout.length; r++) {
      const rowDef = this.layout[r];
      const rowEl = document.createElement('div');
      rowEl.className = 'keyboard-row';

      for (let c = 0; c < rowDef.length; c++) {
        const keyDef = rowDef[c];
        const keyEl = this._createKeyElement(keyDef);
        rowEl.appendChild(keyEl);
        this._registerKeyElement(keyDef.key, keyEl, keyDef.side);
      }

      this.container.appendChild(rowEl);
    }
  }

  /**
   * Creates a single 3D tactile key button element
   * @private
   */
  _createKeyElement(keyDef) {
    const keyEl = document.createElement('div');
    keyEl.className = 'key';
    keyEl.dataset.key = keyDef.key;
    keyEl.dataset.finger = keyDef.finger;
    keyEl.dataset.hand = keyDef.hand;

    // Apply finger color CSS variable
    const fingerColor = FINGER_COLORS[keyDef.finger] || '#2ed573';
    keyEl.style.setProperty('--finger-color', fingerColor);

    // Apply special button classes
    if (keyDef.isSpace) keyEl.classList.add('key-spacebar');
    if (keyDef.key === 'Shift') keyEl.classList.add('key-shift');
    if (keyDef.key === 'Enter') keyEl.classList.add('key-enter');
    if (keyDef.key === 'Control') keyEl.classList.add('key-ctrl');
    if (keyDef.key === 'Alt') keyEl.classList.add('key-alt');
    if (keyDef.key === 'AltGraph') keyEl.classList.add('key-altgr');
    if (keyDef.isAccent) keyEl.classList.add('key-accent');
    if (keyDef.homemark || isHomemarkKey(keyDef.key)) {
      keyEl.classList.add('key-homemark');
    }

    // Build key label structure
    const labelWrapper = document.createElement('div');
    labelWrapper.className = 'key-label';

    const primarySpan = document.createElement('span');
    primarySpan.className = 'key-label-primary';
    primarySpan.textContent = keyDef.primary || keyDef.key.toUpperCase();
    labelWrapper.appendChild(primarySpan);

    if (keyDef.secondary) {
      const secSpan = document.createElement('span');
      secSpan.className = 'key-label-secondary';
      secSpan.textContent = keyDef.secondary;
      labelWrapper.appendChild(secSpan);
    }

    if (keyDef.tertiary) {
      const tertSpan = document.createElement('span');
      tertSpan.className = 'key-label-tertiary';
      tertSpan.textContent = keyDef.tertiary;
      labelWrapper.appendChild(tertSpan);
    }

    keyEl.appendChild(labelWrapper);

    // Click/touch interactions
    keyEl.addEventListener('pointerdown', (e) => {
      this._handleKeyPointerDown(keyDef.key, keyEl, e);
    });

    return keyEl;
  }

  /**
   * Upgrades static keys in HTML to full 3D toy tactile specification
   * @private
   */
  _upgradeExistingDomKeys(keyNodeList) {
    keyNodeList.forEach((keyEl) => {
      const keyAttr = keyEl.dataset.key;
      const fingerAttr = keyEl.dataset.finger;
      const fingerInfo = getFingerForKey(keyAttr);

      // Enforce strict pedagogical finger colors
      const fingerColor = FINGER_COLORS[fingerAttr] || fingerInfo.color;
      keyEl.style.setProperty('--finger-color', fingerColor);

      // Enforce tactile bump on F and J
      if (isHomemarkKey(keyAttr)) {
        keyEl.classList.add('key-homemark');
      }

      // Attach pointer handler
      keyEl.addEventListener('pointerdown', (e) => {
        this._handleKeyPointerDown(keyAttr, keyEl, e);
      });

      // Side determination for shift/ctrl
      let side = null;
      if (keyEl.classList.contains('key-shift') || keyEl.dataset.key === 'Shift') {
        side = (fingerAttr === 'lp' || keyEl.getAttribute('aria-label')?.includes('izquierd')) ? 'left' : 'right';
      }

      this._registerKeyElement(keyAttr, keyEl, side);
    });
  }

  /**
   * Registers a key element in internal lookup maps
   * @private
   */
  _registerKeyElement(key, element, side = null) {
    if (!key) return;
    const lowerKey = key.toLowerCase();

    // Map by direct key
    this.keyElementsMap.set(key, element);
    this.keyElementsMap.set(lowerKey, element);

    // Map specialized aliases
    if (key === ' ' || key === 'Space') {
      this.keyElementsMap.set(' ', element);
      this.keyElementsMap.set('space', element);
    }
    if (key === 'Enter' || key === '\n') {
      this.keyElementsMap.set('\n', element);
      this.keyElementsMap.set('enter', element);
    }
    if (key === 'Shift') {
      if (side === 'left') {
        this.keyElementsMap.set('shift-left', element);
      } else if (side === 'right') {
        this.keyElementsMap.set('shift-right', element);
      }
    }
  }

  /**
   * Handles interactive pointer down on a virtual key
   * @private
   */
  _handleKeyPointerDown(keyChar, keyEl, event) {
    if (event) event.preventDefault();

    // Squishy depression feedback
    this._depressKey(keyEl);

    if (typeof this.onKeyPress === 'function') {
      this.onKeyPress(keyChar, event);
    }
  }

  /**
   * Applies squishy depression to a key element
   * @private
   */
  _depressKey(keyEl) {
    if (!keyEl) return;
    keyEl.classList.add('is-depressed');

    // Use SquashStretch damped harmonic bounce if available
    if (squashStretchModule && typeof squashStretchModule.applySquashAndStretch === 'function') {
      squashStretchModule.applySquashAndStretch(keyEl, {
        preset: 'keyPress',
        intensity: 0.85
      });
    }

    setTimeout(() => {
      keyEl.classList.remove('is-depressed');
    }, 120);
  }

  /**
   * Subscribes to typed events on the EventBus
   */
  bindEventBus() {
    if (!this.eventBus) return;
    this.unbindEventBus();

    // KEY_TARGET_CHANGED: Light up target key, pulse halo, opposing shift
    const unsubTarget = this.eventBus.on('KEY_TARGET_CHANGED', (payload) => {
      if (payload && payload.key !== undefined) {
        this.setTargetKey(payload.key, payload.levelId !== undefined ? payload.levelId : this.currentLevelId);
      }
    });

    // KEY_PRESSED_SUCCESS: Green celebratory bounce, clears target
    const unsubSuccess = this.eventBus.on('KEY_PRESSED_SUCCESS', (payload) => {
      if (payload && payload.key !== undefined) {
        this.flashKeyHit(payload.key);
      }
    });

    // KEY_PRESSED_FAIL: Non-punitive soft wiggle and pastel flash
    const unsubFail = this.eventBus.on('KEY_PRESSED_FAIL', (payload) => {
      if (payload && payload.pressedKey !== undefined) {
        this.flashKeyError(payload.pressedKey);
      }
    });

    this._eventDisposers.push(unsubTarget, unsubSuccess, unsubFail);
  }

  /**
   * Sets current active level ID
   * @param {number|string} levelId
   */
  setCurrentLevelId(levelId) {
    this.currentLevelId = levelId;
  }

  /**
   * Unbinds EventBus subscriptions
   */
  unbindEventBus() {
    this._eventDisposers.forEach((dispose) => {
      if (typeof dispose === 'function') dispose();
    });
    this._eventDisposers = [];
  }

  /**
   * Sets and highlights the current expected target key
   * @param {string} targetChar
   * @param {number|string} [levelId=null]
   */
  setTargetKey(targetChar, levelId = null) {
    this.clearTarget();
    if (!targetChar && targetChar !== ' ') return;

    this.currentTargetChar = targetChar;
    const baseChar = getKeyBaseChar(targetChar);

    // 1. Highlight main character key
    const mainKeyEl = this.getKeyElement(baseChar);
    if (mainKeyEl) {
      mainKeyEl.classList.add('key--target');
    }

    // 2. Opposing hand Shift illumination for uppercase or shifted symbols (only when level requires Shift)
    const effectiveLevel = levelId !== null ? levelId : this.currentLevelId;
    if (requiresShift(targetChar, effectiveLevel)) {
      const shiftHand = getShiftHandForChar(targetChar, effectiveLevel);
      const shiftKeyEl = this.getKeyElement(shiftHand === 'left' ? 'shift-left' : 'shift-right');
      if (shiftKeyEl) {
        shiftKeyEl.classList.add('key--target');
      } else {
        // Fallback: illuminate all shift keys if side not distinct
        if (typeof document !== 'undefined') {
          document.querySelectorAll('.key-shift').forEach(el => el.classList.add('key--target'));
        }
      }
    }

    // 3. Alt Gr illumination for symbols
    if (requiresAltGr(targetChar)) {
      const altGrEl = this.getKeyElement('altgraph') || this.getKeyElement('alt-right') || (typeof document !== 'undefined' ? document.querySelector('.key-altgr') : null);
      if (altGrEl) {
        altGrEl.classList.add('key--target');
      }
    }

    // 4. Dead key accent (tilde) illumination
    if (hasAccent(targetChar) || hasDiaeresis(targetChar)) {
      const accentEl = this.getKeyElement('´') || (typeof document !== 'undefined' ? document.querySelector('.key-accent') : null);
      if (accentEl) {
        accentEl.classList.add('key--target');
      }
    }
  }

  /**
   * Clears target pulsing highlights from all keys
   */
  clearTarget() {
    this.currentTargetChar = null;
    if (typeof document === 'undefined') return;

    const targets = this.container ? this.container.querySelectorAll('.key--target') : document.querySelectorAll('.key--target');
    targets.forEach((keyEl) => {
      keyEl.classList.remove('key--target');
    });
  }

  /**
   * Triggers celebratory green hit flash on correct keystroke
   * @param {string} keyChar
   */
  flashKeyHit(keyChar) {
    const baseChar = getKeyBaseChar(keyChar);
    const keyEl = this.getKeyElement(baseChar) || this.getKeyElement(keyChar);
    if (!keyEl) return;

    keyEl.classList.add('key--hit');
    this._depressKey(keyEl);

    const timeoutId = setTimeout(() => {
      keyEl.classList.remove('key--hit');
      this._hitTimeouts.delete(timeoutId);
    }, 180);

    this._hitTimeouts.add(timeoutId);
  }

  /**
   * Triggers non-punitive gentle wiggle and pastel red flash on incorrect keystroke
   * @param {string} keyChar
   */
  flashKeyError(keyChar) {
    const baseChar = getKeyBaseChar(keyChar);
    const keyEl = this.getKeyElement(baseChar) || this.getKeyElement(keyChar);
    if (!keyEl) return;

    keyEl.classList.remove('key--wrong-soft');
    // Force DOM reflow to re-trigger CSS animation
    void keyEl.offsetWidth;
    keyEl.classList.add('key--wrong-soft');

    // Damped squash & stretch error shake
    if (squashStretchModule && typeof squashStretchModule.applySquashAndStretch === 'function') {
      squashStretchModule.applySquashAndStretch(keyEl, {
        preset: 'gentle',
        direction: 'horizontal',
        intensity: 0.9
      });
    }

    const timeoutId = setTimeout(() => {
      keyEl.classList.remove('key--wrong-soft');
      this._wiggleTimeouts.delete(timeoutId);
    }, 280);

    this._wiggleTimeouts.add(timeoutId);
  }

  /**
   * Retrieves the DOM element corresponding to a character or key name
   * @param {string} keyChar
   * @returns {HTMLElement|null}
   */
  getKeyElement(keyChar) {
    if (!keyChar && keyChar !== ' ') return null;

    // Check direct Map entry
    if (this.keyElementsMap.has(keyChar)) {
      return this.keyElementsMap.get(keyChar);
    }

    const lower = String(keyChar).toLowerCase();
    if (this.keyElementsMap.has(lower)) {
      return this.keyElementsMap.get(lower);
    }

    // Base character fallback
    const base = getKeyBaseChar(keyChar);
    if (this.keyElementsMap.has(base)) {
      return this.keyElementsMap.get(base);
    }

    // Query selector fallback if element exists in container
    if (this.container && typeof this.container.querySelector === 'function') {
      if (keyChar === ' ') {
        return this.container.querySelector('.key-spacebar');
      }
      if (keyChar === '\n' || keyChar === 'Enter') {
        return this.container.querySelector('.key-enter');
      }
      return this.container.querySelector(`.key[data-key="${base}"]`)
          || this.container.querySelector(`.key[data-key="${keyChar}"]`);
    }

    return null;
  }

  /**
   * Reports exact screen center position { x, y } of a key for Bézier projectile targeting.
   * If running in headless/Node.js or element is hidden, returns calibrated fallback coordinates.
   * 
   * @param {string} keyChar - Character or key identifier
   * @returns {{ x: number, y: number }}
   */
  getKeyScreenPosition(keyChar) {
    const keyEl = this.getKeyElement(keyChar);

    if (keyEl && typeof keyEl.getBoundingClientRect === 'function') {
      const rect = keyEl.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        return {
          x: Math.round(rect.left + rect.width / 2),
          y: Math.round(rect.top + rect.height / 2)
        };
      }
    }

    // Headless / SSR / Mock fallback coordinates
    // Calibrated to standard 1024x768 viewport layout
    const baseChar = getKeyBaseChar(keyChar);
    let row = 2; // default home row
    let col = 4;

    for (let r = 0; r < this.layout.length; r++) {
      const idx = this.layout[r].findIndex(k => k.key.toLowerCase() === baseChar.toLowerCase());
      if (idx !== -1) {
        row = r;
        col = idx;
        break;
      }
    }

    const startX = 260;
    const startY = 480;
    const keyWidth = 48;
    const keyHeight = 52;
    const rowOffset = row * 16;

    return {
      x: startX + rowOffset + (col * keyWidth),
      y: startY + (row * keyHeight)
    };
  }

  /**
   * Unbinds event listeners and clears active timers
   */
  destroy() {
    this._eventDisposers.forEach(dispose => {
      if (typeof dispose === 'function') dispose();
    });
    this._eventDisposers = [];

    this._hitTimeouts.forEach(id => clearTimeout(id));
    this._hitTimeouts.clear();

    this._wiggleTimeouts.forEach(id => clearTimeout(id));
    this._wiggleTimeouts.clear();

    this.clearTarget();
    this.keyElementsMap.clear();
  }
}
