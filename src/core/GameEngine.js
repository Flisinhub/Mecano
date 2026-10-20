/**
 * GameEngine.js - Core Typing Game Loop & Stats Engine for Mecano
 * 
 * Manages typing state, active level, current target key, accuracy calculation,
 * combo tracking, fever mode multiplier, idle detection (USER_STUCK),
 * and event orchestration.
 * Fulfills Requirement R1, R4 and PROJECT.md specifications.
 */

import { globalBus, EVENTS } from './EventBus.js';
import { globalStorage } from './StorageManager.js';

export const FINGER_MAP = Object.freeze({
  // Left Pinky
  '1': { finger: 'lp', hand: 'left' },
  'q': { finger: 'lp', hand: 'left' },
  'a': { finger: 'lp', hand: 'left' },
  'z': { finger: 'lp', hand: 'left' },
  // Left Ring
  '2': { finger: 'lr', hand: 'left' },
  'w': { finger: 'lr', hand: 'left' },
  's': { finger: 'lr', hand: 'left' },
  'x': { finger: 'lr', hand: 'left' },
  // Left Middle
  '3': { finger: 'lm', hand: 'left' },
  'e': { finger: 'lm', hand: 'left' },
  'd': { finger: 'lm', hand: 'left' },
  'c': { finger: 'lm', hand: 'left' },
  // Left Index
  '4': { finger: 'li', hand: 'left' },
  '5': { finger: 'li', hand: 'left' },
  'r': { finger: 'li', hand: 'left' },
  't': { finger: 'li', hand: 'left' },
  'f': { finger: 'li', hand: 'left' },
  'g': { finger: 'li', hand: 'left' },
  'v': { finger: 'li', hand: 'left' },
  'b': { finger: 'li', hand: 'left' },
  // Right Index
  '6': { finger: 'ri', hand: 'right' },
  '7': { finger: 'ri', hand: 'right' },
  'y': { finger: 'ri', hand: 'right' },
  'u': { finger: 'ri', hand: 'right' },
  'h': { finger: 'ri', hand: 'right' },
  'j': { finger: 'ri', hand: 'right' },
  'n': { finger: 'ri', hand: 'right' },
  'm': { finger: 'ri', hand: 'right' },
  // Right Middle
  '8': { finger: 'rm', hand: 'right' },
  'i': { finger: 'rm', hand: 'right' },
  'k': { finger: 'rm', hand: 'right' },
  ',': { finger: 'rm', hand: 'right' },
  // Right Ring
  '9': { finger: 'rr', hand: 'right' },
  'o': { finger: 'rr', hand: 'right' },
  'l': { finger: 'rr', hand: 'right' },
  '.': { finger: 'rr', hand: 'right' },
  // Right Pinky
  '0': { finger: 'rp', hand: 'right' },
  'p': { finger: 'rp', hand: 'right' },
  'ñ': { finger: 'rp', hand: 'right' },
  '-': { finger: 'rp', hand: 'right' },
  '´': { finger: 'rp', hand: 'right' },
  'ç': { finger: 'rp', hand: 'right' },
  '?': { finger: 'rp', hand: 'right' },
  '¿': { finger: 'rp', hand: 'right' },
  // Thumbs
  ' ': { finger: 'thumb', hand: 'right' }
});

export const FINGER_NAMES_ES = Object.freeze({
  lp: 'Meñique Izquierdo',
  lr: 'Anular Izquierdo',
  lm: 'Corazón Izquierdo',
  li: 'Índice Izquierdo',
  ri: 'Índice Derecho',
  rm: 'Corazón Derecho',
  rr: 'Anular Derecho',
  rp: 'Meñique Derecho',
  thumb: 'Pulgar'
});

export const FINGER_COLORS_ES = Object.freeze({
  lp: 'coral',
  lr: 'naranja cálido',
  lm: 'amarillo sol',
  li: 'verde menta',
  ri: 'azul cielo',
  rm: 'amarillo sol',
  rr: 'naranja cálido',
  rp: 'coral',
  thumb: 'violeta mágico'
});

export function getFingerForKey(char) {
  if (!char) {
    return {
      finger: 'thumb',
      fingerName: 'Pulgar',
      hand: 'right',
      handName: 'ambas manos',
      colorName: 'violeta mágico',
      keyName: 'Espacio'
    };
  }
  const lower = char.toLowerCase();
  const mapping = FINGER_MAP[lower] || { finger: 'ri', hand: 'right' };
  const finger = mapping.finger || 'ri';
  const fingerName = FINGER_NAMES_ES[finger] || 'Dedo Índice';
  const colorName = FINGER_COLORS_ES[finger] || 'de color';
  const hand = mapping.hand || 'right';
  const handName = hand === 'left' ? 'Mano Izquierda' : (hand === 'right' ? 'Mano Derecha' : 'ambas manos');
  const keyName = char === ' ' ? 'Espacio' : (char === '\n' ? 'Intro' : char.toUpperCase());

  return {
    finger,
    fingerName,
    hand,
    handName,
    colorName,
    keyName
  };
}

export class GameEngine {
  /**
   * @param {Object} [options]
   * @param {import('./EventBus.js').EventBus} [options.eventBus]
   * @param {import('./StorageManager.js').StorageManager} [options.storage]
   * @param {number} [options.feverThreshold=10]
   * @param {number} [options.idleStuckThresholdMs=2000]
   * @param {Function} [options.keyPositionResolver] (key) => { x, y }
   */
  constructor(options = {}) {
    this.eventBus = options.eventBus || globalBus;
    this.storage = options.storage || globalStorage;
    this.feverThreshold = options.feverThreshold !== undefined ? options.feverThreshold : 10;
    this.idleStuckThresholdMs = options.idleStuckThresholdMs || 2000;
    this.keyPositionResolver = options.keyPositionResolver || (() => ({ x: 400, y: 500 }));

    // Game state
    this.levelId = 1;
    this.levelText = '';
    this.targetIndex = 0;
    this.currentTargetKey = '';
    this.isActive = false;

    // Keystroke statistics
    this.totalKeystrokes = 0;
    this.correctHits = 0;
    this.consecutiveErrors = 0;
    this.comboCount = 0;
    this.maxCombo = 0;
    this.feverActive = false;
    this.feverMultiplier = 1.0;

    // Timing and idle monitoring
    this.startTime = 0;
    this.lastKeystrokeTime = 0;
    this.lastErrorKey = '';
    this.lastErrorTime = 0;
    this._idleTimer = null;
    this._stuckEmitted = false;
  }

  /**
   * Start a new level, micro-lesson, or exam with the provided target text or word list.
   * @param {string|number} levelId
   * @param {string|string[]} textOrWords
   * @param {Object} [options]
   * @param {string} [options.lessonId] e.g. '1.1'
   * @param {boolean} [options.isExam=false]
   * @param {Object} [options.examConfig]
   */
  startLevel(levelId, textOrWords, options = {}) {
    this.levelId = levelId;
    this.lessonId = options.lessonId || null;
    this.isExamMode = Boolean(options.isExam);
    this.examConfig = options.examConfig || null;
    this.levelText = Array.isArray(textOrWords) ? textOrWords.join(' ') : String(textOrWords || '');
    this.targetIndex = 0;
    this.totalKeystrokes = 0;
    this.correctHits = 0;
    this.consecutiveErrors = 0;
    this.comboCount = 0;
    this.maxCombo = 0;
    this.feverActive = false;
    this.feverMultiplier = 1.0;
    this.startTime = Date.now();
    this.lastKeystrokeTime = this.startTime;
    this.lastErrorKey = '';
    this.lastErrorTime = 0;
    this.isActive = true;
    this._stuckEmitted = false;

    this._updateCurrentTarget();
  }

  /**
   * Update current target key and emit KEY_TARGET_CHANGED.
   * @private
   */
  _updateCurrentTarget() {
    if (!this.isActive || this.targetIndex >= this.levelText.length) {
      this.currentTargetKey = '';
      this._stopIdleTimer();
      return;
    }

    this.currentTargetKey = this.levelText[this.targetIndex];
    this._stuckEmitted = false;
    this._resetIdleTimer();

    const fingerInfo = getFingerForKey(this.currentTargetKey);
    const screenPosition = this.keyPositionResolver(this.currentTargetKey) || { x: 400, y: 500 };

    this.eventBus.emit(EVENTS.KEY_TARGET_CHANGED, {
      key: this.currentTargetKey,
      levelId: this.levelId,
      keyName: fingerInfo.keyName,
      finger: fingerInfo.finger,
      fingerName: fingerInfo.fingerName,
      hand: fingerInfo.hand,
      handName: fingerInfo.handName,
      colorName: fingerInfo.colorName,
      screenPosition
    });
  }

  /**
   * Process a keystroke event.
   * @param {string} pressedKey
   * @param {{ x: number, y: number }} [keyScreenPosition]
   * @returns {{ success: boolean, finished: boolean, accuracy: number, combo: number }}
   */
  handleKeyPress(pressedKey, keyScreenPosition) {
    if (!this.isActive || !this.currentTargetKey) {
      return { success: false, finished: false, accuracy: this.getAccuracy(), combo: this.comboCount };
    }

    const now = Date.now();
    this.lastKeystrokeTime = now;
    const expected = this.currentTargetKey;

    // Case-flexible check:
    // In levels 1 to 6 (where Shift is not being trained), typing 'f' matches 'F' or vice-versa
    // so kids can type uppercase letters easily as printed on physical keycaps.
    // In level 7 and 8, uppercase letters require explicit Shift key.
    const isLevelShiftAware = Number(this.levelId) >= 7;
    const isCorrect = (pressedKey === expected) ||
      (!isLevelShiftAware && expected.length === 1 && pressedKey.toLowerCase() === expected.toLowerCase()) ||
      (expected.length === 1 && pressedKey.toLowerCase() === expected.toLowerCase() && expected === expected.toLowerCase());

    if (isCorrect) {
      // Correct keystroke
      this.totalKeystrokes++;
      this.correctHits++;
      this.comboCount++;
      if (this.comboCount > this.maxCombo) {
        this.maxCombo = this.comboCount;
      }
      this.consecutiveErrors = 0;
      this.lastErrorKey = '';

      // Check Fever Mode threshold
      if (this.comboCount >= this.feverThreshold && !this.feverActive) {
        this.feverActive = true;
        this.feverMultiplier = 2.0;
        this.eventBus.emit(EVENTS.FEVER_MODE_CHANGED, {
          isActive: true,
          multiplier: this.feverMultiplier
        });
      }

      const accuracy = this.getAccuracy();
      const pos = keyScreenPosition || this.keyPositionResolver(expected) || { x: 400, y: 500 };

      this.eventBus.emit(EVENTS.KEY_PRESSED_SUCCESS, {
        key: expected,
        comboCount: this.comboCount,
        accuracy,
        keyScreenPosition: pos
      });

      // Advance cursor
      this.targetIndex++;

      if (this.targetIndex >= this.levelText.length) {
        // Level complete
        return this._finishLevel();
      }

      this._updateCurrentTarget();
      return { success: true, finished: false, accuracy, combo: this.comboCount };
    }

    // Wrong keystroke: check hesitation guard (< 400ms repeated error on same key)
    const isRapidRepeat = (this.lastErrorKey === pressedKey) && (now - this.lastErrorTime < 400);
    this.lastErrorKey = pressedKey;
    this.lastErrorTime = now;

    if (!isRapidRepeat) {
      this.totalKeystrokes++;
      this.consecutiveErrors++;

      // Deactivate fever mode if active
      if (this.feverActive) {
        this.feverActive = false;
        this.feverMultiplier = 1.0;
        this.eventBus.emit(EVENTS.FEVER_MODE_CHANGED, {
          isActive: false,
          multiplier: 1.0
        });
      }

      this.comboCount = 0;

      // Record letter error in persistent heatmap
      if (this.storage && typeof this.storage.recordError === 'function') {
        this.storage.recordError(expected);
      }

      this.eventBus.emit(EVENTS.KEY_PRESSED_FAIL, {
        pressedKey,
        expectedKey: expected,
        consecutiveErrors: this.consecutiveErrors
      });
    }

    this._resetIdleTimer();

    return {
      success: false,
      finished: false,
      accuracy: this.getAccuracy(),
      combo: this.comboCount
    };
  }

  /**
   * Finalize the current level, compute stars and WPM, save progress, and emit LEVEL_COMPLETED.
   * @private
   */
  _finishLevel() {
    this.isActive = false;
    this._stopIdleTimer();

    const accuracy = this.getAccuracy();
    const wpm = this.getWPM();
    const stars = this.calculateStars(accuracy);

    // Save stars in StorageManager
    if (this.storage && typeof this.storage.saveLevelStars === 'function') {
      this.storage.saveLevelStars(this.levelId, stars);
    }

    // Record sub-lesson completion if in sub-lesson mode
    if (this.lessonId && this.storage && typeof this.storage.saveLessonCompleted === 'function') {
      this.storage.saveLessonCompleted(this.levelId, this.lessonId);
    }

    // Evaluate and record exam result if in exam mode
    let examResult = null;
    if (this.isExamMode && this.storage && typeof this.storage.saveExamResult === 'function') {
      const minAcc = (this.examConfig && this.examConfig.minAccuracy) || 85;
      const minWPM = (this.examConfig && this.examConfig.minWPM) || 0;
      const passed = (accuracy >= minAcc) && (wpm >= minWPM);

      examResult = this.storage.saveExamResult(this.levelId, {
        passed,
        accuracy,
        wpm,
        stars
      });

      this.eventBus.emit('EXAM_COMPLETED', {
        levelId: this.levelId,
        passed,
        accuracy,
        wpm,
        stars,
        examConfig: this.examConfig
      });
    }

    this.eventBus.emit(EVENTS.LEVEL_COMPLETED, {
      levelId: this.levelId,
      lessonId: this.lessonId,
      isExam: this.isExamMode,
      examResult,
      stars,
      accuracy,
      wpm
    });

    return {
      success: true,
      finished: true,
      accuracy,
      combo: this.comboCount,
      stars,
      wpm,
      isExam: this.isExamMode,
      examResult
    };
  }

  /**
   * Calculate accuracy percentage (0 to 100). Returns 100 when no keystrokes registered.
   * @returns {number}
   */
  getAccuracy() {
    if (this.totalKeystrokes === 0) return 100;
    return Math.round((this.correctHits / this.totalKeystrokes) * 100);
  }

  /**
   * Calculate Words Per Minute (WPM) based on 5 characters per standard word.
   * @returns {number}
   */
  getWPM() {
    const elapsedMinutes = (Date.now() - (this.startTime || Date.now())) / 60000;
    if (elapsedMinutes <= 0.005) return 0;
    const words = this.correctHits / 5;
    return Math.round(words / elapsedMinutes);
  }

  /**
   * Calculate keystrokes per minute (PPM).
   * @returns {number}
   */
  getPPM() {
    const elapsedMinutes = (Date.now() - (this.startTime || Date.now())) / 60000;
    if (elapsedMinutes <= 0.005) return 0;
    return Math.round(this.totalKeystrokes / elapsedMinutes);
  }

  /**
   * Pedagogical star calculation:
   * >= 95% -> 3 stars
   * >= 90% -> 2 stars
   * < 90% -> 1 star (non-punitive completion)
   * @param {number} accuracy
   * @returns {number}
   */
  calculateStars(accuracy) {
    if (accuracy >= 95) return 3;
    if (accuracy >= 90) return 2;
    return 1;
  }

  /**
   * Get complete game statistics snapshot.
   */
  getStats() {
    return {
      levelId: this.levelId,
      totalKeystrokes: this.totalKeystrokes,
      correctHits: this.correctHits,
      accuracy: this.getAccuracy(),
      comboCount: this.comboCount,
      maxCombo: this.maxCombo,
      feverActive: this.feverActive,
      feverMultiplier: this.feverMultiplier,
      wpm: this.getWPM(),
      ppm: this.getPPM(),
      targetIndex: this.targetIndex,
      totalTargets: this.levelText.length,
      progressPercent: this.levelText.length > 0 ? Math.round((this.targetIndex / this.levelText.length) * 100) : 0
    };
  }

  /**
   * Reset idle timer for USER_STUCK event.
   * @private
   */
  _resetIdleTimer() {
    this._stopIdleTimer();
    if (!this.isActive || !this.currentTargetKey) return;

    this._idleTimer = setTimeout(() => {
      this.triggerIdleStuck();
    }, this.idleStuckThresholdMs);
  }

  /**
   * Stop idle timer.
   * @private
   */
  _stopIdleTimer() {
    if (this._idleTimer) {
      clearTimeout(this._idleTimer);
      this._idleTimer = null;
    }
  }

  /**
   * Programmatically trigger USER_STUCK event (or triggered by idle timer).
   */
  triggerIdleStuck() {
    if (!this.isActive || !this.currentTargetKey || this._stuckEmitted) return;
    this._stuckEmitted = true;

    const fingerInfo = getFingerForKey(this.currentTargetKey);
    this.eventBus.emit(EVENTS.USER_STUCK, {
      expectedKey: this.currentTargetKey,
      keyName: fingerInfo.keyName,
      finger: fingerInfo.finger,
      fingerName: fingerInfo.fingerName,
      hand: fingerInfo.hand,
      handName: fingerInfo.handName,
      colorName: fingerInfo.colorName,
      idleTimeMs: this.idleStuckThresholdMs
    });
  }

  /**
   * Clean up timers and listeners when engine is destroyed.
   */
  dispose() {
    this._stopIdleTimer();
    this.isActive = false;
  }
}

export const globalGameEngine = new GameEngine();
export default globalGameEngine;
