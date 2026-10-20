/**
 * EventBus.js - Decoupled Pub/Sub Event System for Mecano
 * 
 * Provides typed event contracts for cross-module communication without direct dependencies.
 * Fulfills Requirement R1 and PROJECT.md specifications.
 */

export const EVENTS = Object.freeze({
  KEY_TARGET_CHANGED: 'KEY_TARGET_CHANGED',
  KEY_PRESSED_SUCCESS: 'KEY_PRESSED_SUCCESS',
  KEY_PRESSED_FAIL: 'KEY_PRESSED_FAIL',
  USER_STUCK: 'USER_STUCK',
  FEVER_MODE_CHANGED: 'FEVER_MODE_CHANGED',
  MASCOT_SPEAK_REQUEST: 'MASCOT_SPEAK_REQUEST',
  LEVEL_COMPLETED: 'LEVEL_COMPLETED'
});

export const EVENT_SCHEMAS = Object.freeze({
  [EVENTS.KEY_TARGET_CHANGED]: {
    required: ['key', 'finger', 'hand', 'screenPosition'],
    validate: (data) => (
      typeof data.key === 'string' &&
      typeof data.finger === 'string' &&
      typeof data.hand === 'string' &&
      data.screenPosition &&
      typeof data.screenPosition.x === 'number' &&
      typeof data.screenPosition.y === 'number'
    )
  },
  [EVENTS.KEY_PRESSED_SUCCESS]: {
    required: ['key', 'comboCount', 'accuracy', 'keyScreenPosition'],
    validate: (data) => (
      typeof data.key === 'string' &&
      typeof data.comboCount === 'number' &&
      typeof data.accuracy === 'number' &&
      data.keyScreenPosition &&
      typeof data.keyScreenPosition.x === 'number' &&
      typeof data.keyScreenPosition.y === 'number'
    )
  },
  [EVENTS.KEY_PRESSED_FAIL]: {
    required: ['pressedKey', 'expectedKey', 'consecutiveErrors'],
    validate: (data) => (
      typeof data.pressedKey === 'string' &&
      typeof data.expectedKey === 'string' &&
      typeof data.consecutiveErrors === 'number'
    )
  },
  [EVENTS.USER_STUCK]: {
    required: ['expectedKey', 'finger', 'idleTimeMs'],
    validate: (data) => (
      typeof data.expectedKey === 'string' &&
      typeof data.finger === 'string' &&
      typeof data.idleTimeMs === 'number'
    )
  },
  [EVENTS.FEVER_MODE_CHANGED]: {
    required: ['isActive', 'multiplier'],
    validate: (data) => (
      typeof data.isActive === 'boolean' &&
      typeof data.multiplier === 'number'
    )
  },
  [EVENTS.MASCOT_SPEAK_REQUEST]: {
    required: ['text'],
    validate: (data) => (
      typeof data.text === 'string'
    )
  },
  [EVENTS.LEVEL_COMPLETED]: {
    required: ['levelId', 'stars', 'accuracy', 'wpm'],
    validate: (data) => (
      (typeof data.levelId === 'number' || typeof data.levelId === 'string') &&
      typeof data.stars === 'number' &&
      typeof data.accuracy === 'number' &&
      typeof data.wpm === 'number'
    )
  }
});

export class EventBus {
  /**
   * @param {Object} [options]
   * @param {boolean} [options.strict=false] If true, throws when emitting unknown events
   * @param {boolean} [options.validatePayloads=false] If true, checks payloads against schema
   */
  constructor(options = {}) {
    this._listeners = new Map();
    this._strict = Boolean(options.strict);
    this._validatePayloads = Boolean(options.validatePayloads);
    this._eventHistory = [];
    this._maxHistory = options.maxHistory || 50;
  }

  /**
   * Subscribe a handler to an event.
   * @param {string} event
   * @param {Function} handler
   * @returns {Function} Unsubscribe function
   */
  on(event, handler) {
    if (typeof event !== 'string' || !event) {
      throw new TypeError(`[EventBus] Event name must be a non-empty string, got: ${typeof event}`);
    }
    if (typeof handler !== 'function') {
      throw new TypeError(`[EventBus] Handler must be a function, got: ${typeof handler}`);
    }

    if (!this._listeners.has(event)) {
      this._listeners.set(event, new Set());
    }
    this._listeners.get(event).add(handler);

    return () => this.off(event, handler);
  }

  /**
   * Remove a subscribed handler from an event.
   * @param {string} event
   * @param {Function} handler
   * @returns {boolean} True if handler was found and removed
   */
  off(event, handler) {
    if (!this._listeners.has(event)) {
      return false;
    }
    const set = this._listeners.get(event);
    const removed = set.delete(handler);
    if (set.size === 0) {
      this._listeners.delete(event);
    }
    return removed;
  }

  /**
   * Subscribe a handler that runs at most once.
   * @param {string} event
   * @param {Function} handler
   * @returns {Function} Unsubscribe function
   */
  once(event, handler) {
    if (typeof handler !== 'function') {
      throw new TypeError(`[EventBus] Handler must be a function, got: ${typeof handler}`);
    }
    const wrapper = (data) => {
      this.off(event, wrapper);
      handler(data);
    };
    return this.on(event, wrapper);
  }

  /**
   * Emit an event with data to all subscribed handlers.
   * @param {string} event
   * @param {*} [data]
   * @returns {number} Number of listeners invoked
   */
  emit(event, data = {}) {
    if (typeof event !== 'string' || !event) {
      throw new TypeError(`[EventBus] Event name must be a non-empty string, got: ${typeof event}`);
    }

    const isKnownEvent = Object.prototype.hasOwnProperty.call(EVENTS, event);

    if (this._strict && !isKnownEvent) {
      throw new Error(`[EventBus] Unknown event "${event}" emitted in strict mode`);
    }

    if (this._validatePayloads && isKnownEvent) {
      const valid = this.validatePayload(event, data);
      if (!valid) {
        throw new Error(`[EventBus] Payload validation failed for event "${event}": ${JSON.stringify(data)}`);
      }
    }

    // Keep history for inspection
    if (this._maxHistory > 0) {
      this._eventHistory.push({ event, data, timestamp: Date.now() });
      if (this._eventHistory.length > this._maxHistory) {
        this._eventHistory.shift();
      }
    }

    if (!this._listeners.has(event)) {
      return 0;
    }

    const listeners = Array.from(this._listeners.get(event));
    let invokedCount = 0;

    for (const handler of listeners) {
      try {
        handler(data);
        invokedCount++;
      } catch (err) {
        console.error(`[EventBus] Error executing handler for event "${event}":`, err);
      }
    }

    return invokedCount;
  }

  /**
   * Validate a payload against the predefined event schema.
   * @param {string} event
   * @param {*} data
   * @returns {boolean}
   */
  validatePayload(event, data) {
    if (!data || typeof data !== 'object') return false;
    const schema = EVENT_SCHEMAS[event];
    if (!schema) return true;
    for (const key of schema.required) {
      if (!(key in data)) return false;
    }
    return schema.validate ? schema.validate(data) : true;
  }

  /**
   * Check if an event name is a known core event.
   * @param {string} event
   * @returns {boolean}
   */
  isValidEvent(event) {
    return Object.prototype.hasOwnProperty.call(EVENTS, event);
  }

  /**
   * Check if there are active listeners for an event.
   * @param {string} event
   * @returns {boolean}
   */
  hasListeners(event) {
    return this._listeners.has(event) && this._listeners.get(event).size > 0;
  }

  /**
   * Get the number of active listeners for an event.
   * @param {string} [event] If omitted, returns total across all events
   * @returns {number}
   */
  listenerCount(event) {
    if (event !== undefined) {
      return this._listeners.has(event) ? this._listeners.get(event).size : 0;
    }
    let total = 0;
    for (const set of this._listeners.values()) {
      total += set.size;
    }
    return total;
  }

  /**
   * Get list of event names currently having listeners.
   * @returns {string[]}
   */
  getEvents() {
    return Array.from(this._listeners.keys());
  }

  /**
   * Get recent event history (for testing and debugging).
   * @returns {Array<{ event: string, data: *, timestamp: number }>}
   */
  getHistory() {
    return [...this._eventHistory];
  }

  /**
   * Clear all registered listeners and event history.
   */
  clear() {
    this._listeners.clear();
    this._eventHistory = [];
  }
}

export const globalBus = new EventBus();
export default globalBus;
