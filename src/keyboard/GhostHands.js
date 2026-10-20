/**
 * GhostHands.js - Translucent Guide Hands Overlay with Active Finger Illumination & 2s Idle Cue
 * 
 * Fulfills Requirement R4 and PROJECT.md specifications:
 * - Translucent hands overlay with illuminated active finger corresponding to target key
 * - Strict pedagogical finger color standards
 * - 2-second idle assistance timer dispatching USER_STUCK and activating suggestive finger tap
 * - Directional visual cues ("Mano Izquierda", "Mano Derecha", finger names)
 */

import {
  FINGER_COLORS,
  FINGER_NAMES,
  getFingerForKey,
  getMultiKeyFingerCombo
} from './KeyboardLayout.js';

export class GhostHands {
  /**
   * @param {Object} [options]
   * @param {Object} [options.eventBus=null] - EventBus instance
   * @param {number} [options.idleThresholdMs=2000] - Inactivity duration before USER_STUCK
   * @param {string|Element} [options.leftHand='#hand-svg-left'] - Left hand SVG selector/element
   * @param {string|Element} [options.rightHand='#hand-svg-right'] - Right hand SVG selector/element
   * @param {string|Element} [options.hintContainer='#current-finger-hint'] - Dynamic hint wrapper
   */
  constructor(options = {}) {
    this.eventBus = options.eventBus || null;
    this.idleThresholdMs = options.idleThresholdMs || 2000;

    this.leftHandEl = typeof options.leftHand === 'string'
      ? (typeof document !== 'undefined' ? document.querySelector(options.leftHand) : null)
      : options.leftHand;

    this.rightHandEl = typeof options.rightHand === 'string'
      ? (typeof document !== 'undefined' ? document.querySelector(options.rightHand) : null)
      : options.rightHand;

    this.hintContainerEl = typeof options.hintContainer === 'string'
      ? (typeof document !== 'undefined' ? document.querySelector(options.hintContainer) : null)
      : options.hintContainer;

    this.currentFingerId = null;
    this.currentTargetKey = null;
    this.currentHand = null;

    this._idleTimer = null;
    this._isIdleStuck = false;
    this._eventDisposers = [];
    this._fingerUnitsMap = new Map(); // fingerId -> Element[]

    this.init();
  }

  /**
   * Initializes DOM mapping and event listeners
   */
  init() {
    this._mapFingerUnits();
    if (this.eventBus) {
      this.bindEventBus();
    }
  }

  /**
   * Discovers and registers SVG finger units
   * @private
   */
  _mapFingerUnits() {
    if (typeof document === 'undefined') return;

    this._fingerUnitsMap.clear();

    const units = document.querySelectorAll('.finger-unit');
    units.forEach((unit) => {
      const finger = unit.dataset.finger;
      const unitId = unit.id; // e.g. "fg-lp", "fg-thumb-l"

      if (finger) {
        if (!this._fingerUnitsMap.has(finger)) {
          this._fingerUnitsMap.set(finger, []);
        }
        this._fingerUnitsMap.get(finger).push(unit);
      }

      // Map thumb sides specifically
      if (unitId === 'fg-thumb-l') {
        if (!this._fingerUnitsMap.has('thumb-l')) this._fingerUnitsMap.set('thumb-l', []);
        this._fingerUnitsMap.get('thumb-l').push(unit);
      }
      if (unitId === 'fg-thumb-r') {
        if (!this._fingerUnitsMap.has('thumb-r')) this._fingerUnitsMap.set('thumb-r', []);
        this._fingerUnitsMap.get('thumb-r').push(unit);
      }
    });
  }

  /**
   * Subscribes to relevant typed EventBus events
   */
  bindEventBus() {
    if (!this.eventBus) return;

    // KEY_TARGET_CHANGED: Activate matching finger and reset 2s idle timer
    const unsubTarget = this.eventBus.on('KEY_TARGET_CHANGED', (payload) => {
      if (!payload) return;
      const finger = payload.finger || getFingerForKey(payload.key).finger;
      this.currentLevelId = payload.levelId !== undefined ? payload.levelId : this.currentLevelId;
      this.setActiveFinger(finger, payload.key, payload.hand, this.currentLevelId);
      this.resetIdleTimer();
    });

    // KEY_PRESSED_SUCCESS: Reset idle timer & clear stuck animation
    const unsubSuccess = this.eventBus.on('KEY_PRESSED_SUCCESS', () => {
      this.resetIdleTimer();
      this.stopIdleSuggestion();
    });

    // KEY_PRESSED_FAIL: Reset idle timer & keep active finger lit
    const unsubFail = this.eventBus.on('KEY_PRESSED_FAIL', () => {
      this.resetIdleTimer();
    });

    // USER_STUCK: Trigger suggestive finger tap animation
    const unsubStuck = this.eventBus.on('USER_STUCK', (payload) => {
      if (payload && payload.finger) {
        this.triggerIdleSuggestion();
      }
    });

    this._eventDisposers.push(unsubTarget, unsubSuccess, unsubFail, unsubStuck);
  }

  /**
   * Activates and illuminates the specified guide finger
   * @param {string} fingerId - e.g. "li", "ri", "lp", "thumb"
   * @param {string} [keyChar=''] - Expected target key character
   * @param {string} [hand=null] - "left", "right", or "both"
   */
  setActiveFinger(fingerId, keyChar = '', hand = null, levelId = null) {
    this.clearActiveFinger();

    if (!fingerId) return;

    this.currentFingerId = fingerId;
    this.currentTargetKey = keyChar;
    const effectiveLevel = levelId !== null ? levelId : this.currentLevelId;

    const fingerInfo = getFingerForKey(keyChar || fingerId);
    this.currentHand = hand || fingerInfo.hand;
    const color = FINGER_COLORS[fingerId] || fingerInfo.color;

    // Resolve matching SVG finger elements
    let elements = [];
    if (fingerId === 'thumb') {
      // Both thumbs or side thumb
      if (this.currentHand === 'left' && this._fingerUnitsMap.has('thumb-l')) {
        elements = this._fingerUnitsMap.get('thumb-l');
      } else if (this.currentHand === 'right' && this._fingerUnitsMap.has('thumb-r')) {
        elements = this._fingerUnitsMap.get('thumb-r');
      } else {
        elements = this._fingerUnitsMap.get('thumb') || [];
      }
    } else if (this._fingerUnitsMap.has(fingerId)) {
      elements = this._fingerUnitsMap.get(fingerId);
    }

    // Apply active class and dynamic glowing color variable
    elements.forEach((unit) => {
      unit.classList.add('is-active-finger');
      unit.style.setProperty('--active-color', color);
    });

    // Check for multi-key combo (e.g. Alt Gr or Shift)
    const combo = getMultiKeyFingerCombo(keyChar, effectiveLevel);
    if (combo && combo.isCombo && combo.modifierFinger) {
      // Resolve modifier unit (thumb-r for Alt Gr, or lp/rp for Shift)
      const modCode = combo.modifierFinger.includes('thumb-r') ? 'thumb-r' : (combo.modifierFinger.includes('-l-') ? 'lp' : 'rp');
      const modElements = this._fingerUnitsMap.get(modCode) || [];
      modElements.forEach((unit) => {
        unit.classList.add('is-active-finger');
        unit.style.setProperty('--active-color', combo.modifierColor || '#C58AF9');
      });
    }

    // Update dynamic hint banner
    this.updateHintBanner(fingerId, keyChar, this.currentHand, color);
  }

  /**
   * Clears active illuminated finger state
   */
  clearActiveFinger() {
    this.stopIdleSuggestion();

    if (typeof document === 'undefined') return;

    const activeUnits = document.querySelectorAll('.finger-unit.is-active-finger');
    activeUnits.forEach((unit) => {
      unit.classList.remove('is-active-finger', 'is-idle-stuck');
      unit.style.removeProperty('--active-color');
    });

    this.currentFingerId = null;
    this.currentTargetKey = null;
  }

  /**
   * Updates dynamic guidance banner in the UI
   * @param {string} fingerId
   * @param {string} keyChar
   * @param {string} hand
   * @param {string} color
   */
  updateHintBanner(fingerId, keyChar, hand, color) {
    if (typeof document === 'undefined') return;

    const handNameEl = document.getElementById('hint-hand-name');
    const fingerBadgeEl = document.getElementById('hint-finger-badge');
    const arrowLeftEl = document.getElementById('hint-arrow-left');
    const arrowRightEl = document.getElementById('hint-arrow-right');
    const visualHelperEl = document.getElementById('hint-visual-helper');

    const fingerName = FINGER_NAMES[fingerId] || 'Dedo Guía';
    const isLeft = hand === 'left' || fingerId.startsWith('l');
    const isRight = hand === 'right' || fingerId.startsWith('r');

    if (handNameEl) {
      if (fingerId === 'thumb' || hand === 'both') {
        handNameEl.textContent = 'Pulgares en Espacio';
      } else {
        handNameEl.textContent = isLeft ? 'Mano Izquierda' : 'Mano Derecha';
      }
    }

    if (arrowLeftEl) arrowLeftEl.style.opacity = isLeft || hand === 'both' ? '1' : '0.2';
    if (arrowRightEl) arrowRightEl.style.opacity = isRight || hand === 'both' ? '1' : '0.2';

    if (fingerBadgeEl) {
      const keyLabel = keyChar ? (keyChar === ' ' ? 'Espacio' : keyChar.toUpperCase()) : '';
      fingerBadgeEl.textContent = keyLabel ? `${fingerName} (${keyLabel})` : fingerName;
      fingerBadgeEl.style.backgroundColor = color;
      fingerBadgeEl.style.color = '#ffffff';
    }

    if (visualHelperEl) {
      visualHelperEl.textContent = `⭐ ¡Usa el ${fingerName}!`;
    }
  }

  /**
   * Starts the 2000ms inactivity timer
   */
  startIdleTimer() {
    this.clearIdleTimer();

    this._idleTimer = setTimeout(() => {
      this._onIdleTimeout();
    }, this.idleThresholdMs);
  }

  /**
   * Clears and restarts the 2000ms inactivity timer
   */
  resetIdleTimer() {
    this.clearIdleTimer();
    this.startIdleTimer();
  }

  /**
   * Clears active inactivity timer
   */
  clearIdleTimer() {
    if (this._idleTimer) {
      clearTimeout(this._idleTimer);
      this._idleTimer = null;
    }
  }

  /**
   * Invoked when user has been idle for >= 2000ms
   * @private
   */
  _onIdleTimeout() {
    if (!this.currentTargetKey && !this.currentFingerId) return;

    this.triggerIdleSuggestion();

    // Dispatch USER_STUCK event to EventBus
    if (this.eventBus && typeof this.eventBus.emit === 'function') {
      this.eventBus.emit('USER_STUCK', {
        expectedKey: this.currentTargetKey || '',
        finger: this.currentFingerId || 'ri',
        idleTimeMs: this.idleThresholdMs
      });
    }
  }

  /**
   * Activates suggestive bouncing tap animation on active finger
   */
  triggerIdleSuggestion() {
    this._isIdleStuck = true;

    if (typeof document === 'undefined') return;

    const activeUnits = document.querySelectorAll('.finger-unit.is-active-finger');
    activeUnits.forEach((unit) => {
      unit.classList.add('is-idle-stuck');
    });

    const hintBadge = document.getElementById('hint-finger-badge');
    if (hintBadge) {
      hintBadge.classList.add('is-pulsing-help');
    }
  }

  /**
   * Stops suggestive bouncing tap animation
   */
  stopIdleSuggestion() {
    this._isIdleStuck = false;

    if (typeof document === 'undefined') return;

    const stuckUnits = document.querySelectorAll('.finger-unit.is-idle-stuck');
    stuckUnits.forEach((unit) => {
      unit.classList.remove('is-idle-stuck');
    });

    const hintBadge = document.getElementById('hint-finger-badge');
    if (hintBadge) {
      hintBadge.classList.remove('is-pulsing-help');
    }
  }

  /**
   * Cleans up timers and unbinds event listeners
   */
  destroy() {
    this.clearIdleTimer();
    this.clearActiveFinger();

    this._eventDisposers.forEach((dispose) => {
      if (typeof dispose === 'function') dispose();
    });
    this._eventDisposers = [];
    this._fingerUnitsMap.clear();
  }
}
