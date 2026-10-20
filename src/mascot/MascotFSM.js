/**
 * MascotFSM.js - 6-State Mascot Finite State Machine & Emotional AI for Mecano
 * 
 * FSM States:
 * - IDLE: Default relaxed state with gentle breathing and blinking
 * - FLOW_DANCE: Rhythmic swaying during high combo streaks or Fever Mode
 * - HELPER_POINTING: Helpful gesture and pedagogical cue after USER_STUCK
 * - SLEEPY: Inactivity state after 25s idle, wakes on any keystroke
 * - HIGH_FIVE_WAIT: Level victory celebration prompt awaiting Spacebar
 * - CELEBRATING: Exuberant victory flip & confetti explosion after Spacebar
 * 
 * Works in browser DOM and in headless Node.js environments.
 */

import { getStuckHint, getRandomStreakPhrase, getVictoryPhrase } from './MascotPhrases.js';

export class MascotFSM {
  static STATES = Object.freeze({
    IDLE: 'IDLE',
    FLOW_DANCE: 'FLOW_DANCE',
    HELPER_POINTING: 'HELPER_POINTING',
    SLEEPY: 'SLEEPY',
    HIGH_FIVE_WAIT: 'HIGH_FIVE_WAIT',
    CELEBRATING: 'CELEBRATING'
  });

  /**
   * @param {Object|EventBus} [optionsOrBus] EventBus instance or options object
   * @param {Object} [optionsOrBus.eventBus] EventBus instance
   * @param {number} [optionsOrBus.sleepTimeoutSec=25] Seconds of inactivity before sleeping
   * @param {Function} [optionsOrBus.onStateChange] State change listener callback
   */
  constructor(optionsOrBus = null) {
    let bus = null;
    let options = {};

    if (optionsOrBus && typeof optionsOrBus.on === 'function') {
      bus = optionsOrBus;
    } else if (optionsOrBus && typeof optionsOrBus === 'object') {
      options = optionsOrBus;
      bus = options.eventBus || null;
    }

    this.eventBus = bus;
    this.sleepTimeoutSec = options.sleepTimeoutSec || 25;
    this.onStateChange = options.onStateChange || null;

    // FSM State Tracking
    this.state = MascotFSM.STATES.IDLE;
    this.previousState = null;
    this.history = [this.state];

    // Inactivity tracking
    this._idleSeconds = 0;
    this._inactivityInterval = null;
    this._unsubscribers = [];

    this.setupListeners();
  }

  /**
   * Set up EventBus listeners for gameplay events.
   */
  setupListeners() {
    if (!this.eventBus || typeof this.eventBus.on !== 'function') return;

    // 1. USER_STUCK -> HELPER_POINTING
    const unsubStuck = this.eventBus.on('USER_STUCK', (payload) => {
      this.transitionTo(MascotFSM.STATES.HELPER_POINTING);

      if (payload && payload.expectedKey) {
        const fingerMapNames = {
          lp: 'dedo meñique izquierdo',
          lr: 'dedo anular izquierdo',
          lm: 'dedo corazón izquierdo',
          li: 'dedo índice izquierdo',
          ri: 'dedo índice derecho',
          rm: 'dedo corazón derecho',
          rr: 'dedo anular derecho',
          rp: 'dedo meñique derecho',
          thumb: 'dedo pulgar',
          'thumb-l': 'dedo pulgar izquierdo',
          'thumb-r': 'dedo pulgar derecho'
        };
        const fingerName = payload.fingerName || fingerMapNames[payload.finger] || 'dedo indicado';
        const speech = getStuckHint(payload.expectedKey, fingerName, payload.colorName);
        this._dispatchSpeech(speech, 'HIGH', 'thinking');
      }
    });
    this._unsubscribers.push(unsubStuck);

    // 2. FEVER_MODE_CHANGED -> FLOW_DANCE or IDLE
    const unsubFever = this.eventBus.on('FEVER_MODE_CHANGED', (payload) => {
      if (payload && payload.isActive) {
        this.transitionTo(MascotFSM.STATES.FLOW_DANCE);
        this._dispatchSpeech(getRandomStreakPhrase(), 'NORMAL', 'happy');
      } else if (this.state === MascotFSM.STATES.FLOW_DANCE) {
        this.transitionTo(MascotFSM.STATES.IDLE);
      }
    });
    this._unsubscribers.push(unsubFever);

    // 3. LEVEL_COMPLETED -> HIGH_FIVE_WAIT
    const unsubLevel = this.eventBus.on('LEVEL_COMPLETED', (_payload) => {
      this.transitionTo(MascotFSM.STATES.HIGH_FIVE_WAIT);
      this._dispatchSpeech(getVictoryPhrase(), 'CRITICAL', 'victory');
    });
    this._unsubscribers.push(unsubLevel);

    // 4. KEY_PRESSED_FAIL -> If stuck, clear helper mode or offer gentle support
    const unsubFail = this.eventBus.on('KEY_PRESSED_FAIL', () => {
      this._idleSeconds = 0;
    });
    this._unsubscribers.push(unsubFail);

    // 5. KEY_PRESSED_SUCCESS -> Reset idle timer; return to IDLE if in HELPER_POINTING; trigger dance on high combo
    const unsubSuccess = this.eventBus.on('KEY_PRESSED_SUCCESS', (payload) => {
      this._idleSeconds = 0;
      if (this.state === MascotFSM.STATES.HELPER_POINTING) {
        this.transitionTo(MascotFSM.STATES.IDLE);
      } else if (payload && payload.comboCount >= 8 && this.state === MascotFSM.STATES.IDLE) {
        this.transitionTo(MascotFSM.STATES.FLOW_DANCE);
      }
    });
    this._unsubscribers.push(unsubSuccess);
  }

  /**
   * Helper to dispatch speech events via EventBus if available.
   * @private
   */
  _dispatchSpeech(text, priority = 'NORMAL', emotion = 'happy') {
    if (this.eventBus && typeof this.eventBus.emit === 'function') {
      try {
        this.eventBus.emit('MASCOT_SPEAK_REQUEST', {
          text,
          priority,
          emotion
        });
      } catch (err) {
        // Safe catch if bus throws
      }
    }
  }

  /**
   * Attempt transition to a new state.
   * Validates target against STATES enum; throws on unknown states.
   * @param {string} newState
   * @returns {boolean} True if state changed, false if already in that state
   */
  transitionTo(newState) {
    const validStates = Object.values(MascotFSM.STATES);
    if (!validStates.includes(newState)) {
      throw new Error(`[MascotFSM] Invalid state transition target: "${newState}"`);
    }

    if (this.state === newState) {
      return false;
    }

    const oldState = this.state;
    this.previousState = oldState;
    this.state = newState;
    this.history.push(newState);

    if (typeof this.onStateChange === 'function') {
      try {
        this.onStateChange(newState, oldState);
      } catch (err) {
        console.error('[MascotFSM] Error in onStateChange callback:', err);
      }
    }

    return true;
  }

  /**
   * Handle user keystroke.
   * - If SLEEPY: wakes Roby up immediately to IDLE.
   * - If HIGH_FIVE_WAIT and key is Space: triggers CELEBRATING.
   * - If HELPER_POINTING: clears helper pose back to IDLE.
   * @param {string} key
   */
  handleKeystroke(key) {
    this._idleSeconds = 0;

    // 1. Wake up from sleep
    if (this.state === MascotFSM.STATES.SLEEPY) {
      this.transitionTo(MascotFSM.STATES.IDLE);
      this._dispatchSpeech('¡Hola de nuevo! ¡A escribir!', 'NORMAL', 'happy');
      return;
    }

    // 2. High-five celebration on Spacebar
    if (this.state === MascotFSM.STATES.HIGH_FIVE_WAIT) {
      if (key === ' ' || key === 'Space' || key === 'Spacebar') {
        this.transitionTo(MascotFSM.STATES.CELEBRATING);
        this._dispatchSpeech('¡Yuhuuu! ¡Misión completada, campeón!', 'CRITICAL', 'victory');
      }
      return;
    }

    // 3. Clear helper mode once user continues typing
    if (this.state === MascotFSM.STATES.HELPER_POINTING) {
      this.transitionTo(MascotFSM.STATES.IDLE);
      return;
    }
  }

  /**
   * Feed idle time in seconds to the FSM.
   * Transitions to SLEEPY at or beyond 25s unless in victory states.
   * @param {number} idleSeconds
   */
  handleIdleTime(idleSeconds) {
    this._idleSeconds = Number(idleSeconds) || 0;

    if (
      this._idleSeconds >= this.sleepTimeoutSec &&
      this.state !== MascotFSM.STATES.SLEEPY &&
      this.state !== MascotFSM.STATES.HIGH_FIVE_WAIT &&
      this.state !== MascotFSM.STATES.CELEBRATING
    ) {
      this.transitionTo(MascotFSM.STATES.SLEEPY);
      this._dispatchSpeech('Zzz... ¿Te has dormido? Pulsa cualquier tecla para continuar.', 'LOW', 'sleepy');
    }
  }

  /**
   * Start autonomous inactivity timer (useful in browser game loops).
   */
  startInactivityTimer() {
    this.stopInactivityTimer();
    if (typeof setInterval === 'function') {
      this._inactivityInterval = setInterval(() => {
        this._idleSeconds += 1;
        this.handleIdleTime(this._idleSeconds);
      }, 1000);
    }
  }

  /**
   * Stop autonomous inactivity timer.
   */
  stopInactivityTimer() {
    if (this._inactivityInterval) {
      clearInterval(this._inactivityInterval);
      this._inactivityInterval = null;
    }
  }

  /**
   * Get current state.
   * @returns {string}
   */
  getState() {
    return this.state;
  }

  /**
   * Get previous state.
   * @returns {string|null}
   */
  getPreviousState() {
    return this.previousState;
  }

  /**
   * Get full history of states visited.
   * @returns {string[]}
   */
  getHistory() {
    return [...this.history];
  }

  /**
   * Reset FSM back to initial IDLE state.
   */
  reset() {
    this._idleSeconds = 0;
    this.previousState = this.state;
    this.state = MascotFSM.STATES.IDLE;
    this.history = [this.state];
  }

  /**
   * Teardown listeners and timers.
   */
  destroy() {
    this.stopInactivityTimer();
    for (const unsub of this._unsubscribers) {
      if (typeof unsub === 'function') unsub();
    }
    this._unsubscribers = [];
  }
}
