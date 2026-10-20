(() => {
  var __defProp = Object.defineProperty;
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };

  // src/core/EventBus.js
  var EVENTS = Object.freeze({
    KEY_TARGET_CHANGED: "KEY_TARGET_CHANGED",
    KEY_PRESSED_SUCCESS: "KEY_PRESSED_SUCCESS",
    KEY_PRESSED_FAIL: "KEY_PRESSED_FAIL",
    USER_STUCK: "USER_STUCK",
    FEVER_MODE_CHANGED: "FEVER_MODE_CHANGED",
    MASCOT_SPEAK_REQUEST: "MASCOT_SPEAK_REQUEST",
    LEVEL_COMPLETED: "LEVEL_COMPLETED"
  });
  var EVENT_SCHEMAS = Object.freeze({
    [EVENTS.KEY_TARGET_CHANGED]: {
      required: ["key", "finger", "hand", "screenPosition"],
      validate: (data) => typeof data.key === "string" && typeof data.finger === "string" && typeof data.hand === "string" && data.screenPosition && typeof data.screenPosition.x === "number" && typeof data.screenPosition.y === "number"
    },
    [EVENTS.KEY_PRESSED_SUCCESS]: {
      required: ["key", "comboCount", "accuracy", "keyScreenPosition"],
      validate: (data) => typeof data.key === "string" && typeof data.comboCount === "number" && typeof data.accuracy === "number" && data.keyScreenPosition && typeof data.keyScreenPosition.x === "number" && typeof data.keyScreenPosition.y === "number"
    },
    [EVENTS.KEY_PRESSED_FAIL]: {
      required: ["pressedKey", "expectedKey", "consecutiveErrors"],
      validate: (data) => typeof data.pressedKey === "string" && typeof data.expectedKey === "string" && typeof data.consecutiveErrors === "number"
    },
    [EVENTS.USER_STUCK]: {
      required: ["expectedKey", "finger", "idleTimeMs"],
      validate: (data) => typeof data.expectedKey === "string" && typeof data.finger === "string" && typeof data.idleTimeMs === "number"
    },
    [EVENTS.FEVER_MODE_CHANGED]: {
      required: ["isActive", "multiplier"],
      validate: (data) => typeof data.isActive === "boolean" && typeof data.multiplier === "number"
    },
    [EVENTS.MASCOT_SPEAK_REQUEST]: {
      required: ["text"],
      validate: (data) => typeof data.text === "string"
    },
    [EVENTS.LEVEL_COMPLETED]: {
      required: ["levelId", "stars", "accuracy", "wpm"],
      validate: (data) => (typeof data.levelId === "number" || typeof data.levelId === "string") && typeof data.stars === "number" && typeof data.accuracy === "number" && typeof data.wpm === "number"
    }
  });
  var EventBus = class {
    /**
     * @param {Object} [options]
     * @param {boolean} [options.strict=false] If true, throws when emitting unknown events
     * @param {boolean} [options.validatePayloads=false] If true, checks payloads against schema
     */
    constructor(options = {}) {
      this._listeners = /* @__PURE__ */ new Map();
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
      if (typeof event !== "string" || !event) {
        throw new TypeError(`[EventBus] Event name must be a non-empty string, got: ${typeof event}`);
      }
      if (typeof handler !== "function") {
        throw new TypeError(`[EventBus] Handler must be a function, got: ${typeof handler}`);
      }
      if (!this._listeners.has(event)) {
        this._listeners.set(event, /* @__PURE__ */ new Set());
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
      if (typeof handler !== "function") {
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
      if (typeof event !== "string" || !event) {
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
      if (!data || typeof data !== "object") return false;
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
      if (event !== void 0) {
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
  };
  var globalBus = new EventBus();

  // src/core/StorageManager.js
  var STORAGE_KEYS = {
    STARS: "mecano_stars",
    ACCESSORIES: "mecano_accessories",
    HEATMAP: "mecano_error_heatmap",
    SETTINGS: "mecano_settings",
    PROGRESS: "mecano_progress",
    LESSONS: "mecano_lessons_progress",
    EXAMS: "mecano_exams_progress",
    STUDENT_NAME: "mecano_student_name",
    CERTIFICATES: "mecano_certificates"
  };
  var DEFAULT_STATE = Object.freeze({
    stars: {},
    accessories: {
      unlocked: [],
      equipped: {
        hat: null,
        glasses: null,
        crown: null
      }
    },
    heatmap: {},
    settings: {
      soundEnabled: true,
      voiceEnabled: true,
      animationEnabled: true,
      font: "default",
      contrast: "normal",
      volumes: {
        music: 0.7,
        sfx: 0.85,
        voice: 1
      }
    },
    progress: {
      unlockedLevel: 1,
      currentBelt: "blanco"
    },
    lessons: {},
    exams: {},
    studentName: "Campe\xF3n/a del Teclado",
    certificates: []
  });
  var MemoryStorage = class {
    constructor() {
      this._store = /* @__PURE__ */ new Map();
    }
    getItem(key) {
      return this._store.has(key) ? this._store.get(key) : null;
    }
    setItem(key, value) {
      this._store.set(key, String(value));
    }
    removeItem(key) {
      this._store.delete(key);
    }
    clear() {
      this._store.clear();
    }
    get length() {
      return this._store.size;
    }
  };
  var StorageManager = class {
    /**
     * @param {Object} [options]
     * @param {Object} [options.storage] Custom storage implementation (defaults to localStorage with fallback)
     */
    constructor(options = {}) {
      this._backend = options.storage || this._detectStorageBackend();
      this._isMemory = !(typeof window !== "undefined" && window.localStorage && this._backend === window.localStorage);
    }
    /**
     * Detect and test availability of localStorage, falling back to MemoryStorage.
     * @private
     */
    _detectStorageBackend() {
      try {
        if (typeof window !== "undefined" && window.localStorage) {
          const testKey = "__mecano_storage_test__";
          window.localStorage.setItem(testKey, "1");
          window.localStorage.removeItem(testKey);
          return window.localStorage;
        }
      } catch {
      }
      return new MemoryStorage();
    }
    /**
     * Safely read and parse a JSON key from backend storage.
     * @private
     */
    _readJson(key, defaultValue) {
      try {
        const raw = this._backend.getItem(key);
        if (raw === null || raw === void 0) {
          return structuredClone ? structuredClone(defaultValue) : JSON.parse(JSON.stringify(defaultValue));
        }
        return JSON.parse(raw);
      } catch (err) {
        console.warn(`[StorageManager] Failed parsing key "${key}", reverting to default:`, err);
        return structuredClone ? structuredClone(defaultValue) : JSON.parse(JSON.stringify(defaultValue));
      }
    }
    /**
     * Safely write a JSON value to backend storage.
     * @private
     */
    _writeJson(key, value) {
      try {
        this._backend.setItem(key, JSON.stringify(value));
        return true;
      } catch (err) {
        console.error(`[StorageManager] Failed writing key "${key}":`, err);
        return false;
      }
    }
    /**
     * Check if running on real browser localStorage or in-memory fallback.
     * @returns {boolean}
     */
    isPersistent() {
      return !this._isMemory;
    }
    // ==========================================
    // Level Stars API
    // ==========================================
    /**
     * Save stars earned for a level. If a previous record exists, stores the maximum.
     * @param {number|string} levelId
     * @param {number} stars (1 to 3)
     * @returns {number} The recorded stars count
     */
    saveLevelStars(levelId, stars) {
      const id = String(levelId);
      const starCount = Math.max(0, Math.min(3, Math.round(Number(stars) || 0)));
      const starsMap = this._readJson(STORAGE_KEYS.STARS, DEFAULT_STATE.stars);
      const existing = Number(starsMap[id]) || 0;
      const finalStars = Math.max(existing, starCount);
      starsMap[id] = finalStars;
      this._writeJson(STORAGE_KEYS.STARS, starsMap);
      return finalStars;
    }
    /**
     * Alias for saveLevelStars for compatibility.
     */
    setLevelStars(levelId, stars) {
      return this.saveLevelStars(levelId, stars);
    }
    /**
     * Retrieve stars earned for a level.
     * @param {number|string} levelId
     * @returns {number} (0 if unplayed)
     */
    getLevelStars(levelId) {
      const id = String(levelId);
      const starsMap = this._readJson(STORAGE_KEYS.STARS, DEFAULT_STATE.stars);
      return Number(starsMap[id]) || 0;
    }
    /**
     * Save stars earned for an individual micro-lesson.
     * @param {number|string} levelId
     * @param {number|string} lessonId
     * @param {number} stars (1 to 3)
     * @returns {number}
     */
    saveLessonStars(levelId, lessonId, stars) {
      const key = `${levelId}_${lessonId}`;
      return this.saveLevelStars(key, stars);
    }
    /**
     * Retrieve stars earned for an individual micro-lesson.
     * If recorded, returns recorded stars; if lesson is marked completed, defaults to 3.
     * @param {number|string} levelId
     * @param {number|string} lessonId
     * @returns {number} 0 to 3
     */
    getLessonStars(levelId, lessonId) {
      const key = `${levelId}_${lessonId}`;
      const stars = this.getLevelStars(key);
      if (stars > 0) return stars;
      if (this.isLessonCompleted(levelId, lessonId)) {
        return 3;
      }
      return 0;
    }
    /**
     * Get all level stars as an object map { [levelId]: stars }.
     * @returns {Record<string, number>}
     */
    getAllStars() {
      return this._readJson(STORAGE_KEYS.STARS, DEFAULT_STATE.stars);
    }
    /**
     * Get sum total of all stars earned across all levels.
     * @returns {number}
     */
    getTotalStars() {
      const starsMap = this.getAllStars();
      return Object.values(starsMap).reduce((acc, val) => acc + (Number(val) || 0), 0);
    }
    // ==========================================
    // Error Heatmap API
    // ==========================================
    /**
     * Record a mistaken letter stroke in the error heatmap.
     * @param {string} letter
     * @returns {number} Updated error count for that letter
     */
    recordError(letter) {
      if (!letter || typeof letter !== "string") return 0;
      const key = letter.toLowerCase();
      const heatmap = this._readJson(STORAGE_KEYS.HEATMAP, DEFAULT_STATE.heatmap);
      heatmap[key] = (Number(heatmap[key]) || 0) + 1;
      this._writeJson(STORAGE_KEYS.HEATMAP, heatmap);
      return heatmap[key];
    }
    /**
     * Retrieve error heatmap map { [letter]: count }.
     * @returns {Record<string, number>}
     */
    getErrorHeatmap() {
      return this._readJson(STORAGE_KEYS.HEATMAP, DEFAULT_STATE.heatmap);
    }
    /**
     * Get the top N most problematic letters for pedagogical review.
     * @param {number} [limit=5]
     * @returns {string[]}
     */
    getMostProblematicKeys(limit = 5) {
      const heatmap = this.getErrorHeatmap();
      return Object.entries(heatmap).sort((a, b) => b[1] - a[1]).slice(0, limit).map(([k]) => k);
    }
    /**
     * Clear error count for a specific letter or entire heatmap.
     * @param {string} [letter]
     */
    clearErrorHeatmap(letter) {
      if (letter) {
        const heatmap = this.getErrorHeatmap();
        delete heatmap[letter.toLowerCase()];
        this._writeJson(STORAGE_KEYS.HEATMAP, heatmap);
      } else {
        this._writeJson(STORAGE_KEYS.HEATMAP, {});
      }
    }
    // ==========================================
    // Accessories API
    // ==========================================
    /**
     * Retrieve complete accessory state { unlocked: string[], equipped: { hat, glasses, crown } }
     */
    getAccessories() {
      return this._readJson(STORAGE_KEYS.ACCESSORIES, DEFAULT_STATE.accessories);
    }
    /**
     * Get list of all unlocked accessory IDs.
     * @returns {string[]}
     */
    getUnlockedAccessories() {
      const acc = this.getAccessories();
      return Array.isArray(acc.unlocked) ? [...acc.unlocked] : [];
    }
    /**
     * Unlock an accessory by ID.
     * @param {string} accessoryId
     * @returns {boolean} True if newly unlocked, false if already owned or invalid
     */
    unlockAccessory(accessoryId) {
      if (!accessoryId || typeof accessoryId !== "string") return false;
      const acc = this.getAccessories();
      if (!Array.isArray(acc.unlocked)) {
        acc.unlocked = [];
      }
      if (!acc.unlocked.includes(accessoryId)) {
        acc.unlocked.push(accessoryId);
        this._writeJson(STORAGE_KEYS.ACCESSORIES, acc);
        return true;
      }
      return false;
    }
    /**
     * Check if a specific accessory is unlocked.
     * @param {string} accessoryId
     * @returns {boolean}
     */
    isAccessoryUnlocked(accessoryId) {
      return this.getUnlockedAccessories().includes(accessoryId);
    }
    /**
     * Equip an accessory in a specific slot (e.g. 'hat', 'glasses', 'crown').
     * Passing null or empty un-equips the slot.
     * @param {string} slot
     * @param {string|null} accessoryId
     * @returns {boolean}
     */
    equipAccessory(slot, accessoryId) {
      if (!slot || typeof slot !== "string") return false;
      const acc = this.getAccessories();
      if (!acc.equipped) {
        acc.equipped = { hat: null, glasses: null, crown: null };
      }
      if (accessoryId === null || accessoryId === "") {
        acc.equipped[slot] = null;
        this._writeJson(STORAGE_KEYS.ACCESSORIES, acc);
        return true;
      }
      if (!acc.unlocked.includes(accessoryId)) {
        acc.unlocked.push(accessoryId);
      }
      acc.equipped[slot] = accessoryId;
      this._writeJson(STORAGE_KEYS.ACCESSORIES, acc);
      return true;
    }
    /**
     * Get equipped accessories map.
     * @returns {Record<string, string|null>}
     */
    getEquippedAccessories() {
      const acc = this.getAccessories();
      return acc.equipped ? { ...acc.equipped } : { hat: null, glasses: null, crown: null };
    }
    // ==========================================
    // Level & Belt Progression API
    // ==========================================
    /**
     * Get highest unlocked level ID (1 to 8).
     * @returns {number}
     */
    getUnlockedLevel() {
      const prog = this._readJson(STORAGE_KEYS.PROGRESS, DEFAULT_STATE.progress);
      return Number(prog.unlockedLevel) || 1;
    }
    /**
     * Set highest unlocked level ID.
     * @param {number} level
     */
    setUnlockedLevel(level) {
      const lvl = Math.max(1, Number(level) || 1);
      const prog = this._readJson(STORAGE_KEYS.PROGRESS, DEFAULT_STATE.progress);
      if (lvl > (prog.unlockedLevel || 1)) {
        prog.unlockedLevel = lvl;
        this._writeJson(STORAGE_KEYS.PROGRESS, prog);
      }
      return prog.unlockedLevel;
    }
    /**
     * Get current martial arts belt ranking ('blanco', 'amarillo', 'verde', 'negro').
     * @returns {string}
     */
    getBelt() {
      const prog = this._readJson(STORAGE_KEYS.PROGRESS, DEFAULT_STATE.progress);
      return prog.currentBelt || "blanco";
    }
    /**
     * Update current martial arts belt rank.
     * @param {string} belt
     */
    setBelt(belt) {
      if (!belt || typeof belt !== "string") return;
      const prog = this._readJson(STORAGE_KEYS.PROGRESS, DEFAULT_STATE.progress);
      prog.currentBelt = belt;
      this._writeJson(STORAGE_KEYS.PROGRESS, prog);
    }
    // ==========================================
    // Settings API
    // ==========================================
    /**
     * Get user settings.
     */
    getSettings() {
      return this._readJson(STORAGE_KEYS.SETTINGS, DEFAULT_STATE.settings);
    }
    /**
     * Update settings with a partial object.
     * @param {Object} partialSettings
     */
    saveSettings(partialSettings) {
      const current = this.getSettings();
      const updated = {
        ...current,
        ...partialSettings,
        volumes: {
          ...current.volumes,
          ...partialSettings.volumes || {}
        }
      };
      this._writeJson(STORAGE_KEYS.SETTINGS, updated);
      return updated;
    }
    // ==========================================
    // Micro-Lessons Progress API
    // ==========================================
    /**
     * Mark a micro-lesson as completed for a level.
     * @param {number|string} levelId
     * @param {string|number} lessonId (e.g. '1.1')
     * @returns {string[]} Updated list of completed lesson IDs
     */
    saveLessonCompleted(levelId, lessonId) {
      const lvlKey = String(levelId);
      const lesKey = String(lessonId);
      const lessonsMap = this._readJson(STORAGE_KEYS.LESSONS, DEFAULT_STATE.lessons);
      if (!lessonsMap[lvlKey]) {
        lessonsMap[lvlKey] = [];
      }
      if (!lessonsMap[lvlKey].includes(lesKey)) {
        lessonsMap[lvlKey].push(lesKey);
        this._writeJson(STORAGE_KEYS.LESSONS, lessonsMap);
      }
      return lessonsMap[lvlKey];
    }
    /**
     * Get array of completed lesson IDs for a level.
     * @param {number|string} levelId
     * @returns {string[]}
     */
    getCompletedLessons(levelId) {
      const lvlKey = String(levelId);
      const lessonsMap = this._readJson(STORAGE_KEYS.LESSONS, DEFAULT_STATE.lessons);
      return Array.isArray(lessonsMap[lvlKey]) ? lessonsMap[lvlKey] : [];
    }
    /**
     * Check if a specific lesson is completed.
     * @param {number|string} levelId
     * @param {string|number} lessonId
     * @returns {boolean}
     */
    isLessonCompleted(levelId, lessonId) {
      const completed = this.getCompletedLessons(levelId);
      return completed.includes(String(lessonId));
    }
    // ==========================================
    // Level Exam API
    // ==========================================
    /**
     * Save the result of a level mastery examination.
     * @param {number|string} levelId
     * @param {Object} examResult { passed, accuracy, wpm, stars, date }
     * @returns {Object}
     */
    saveExamResult(levelId, examResult = {}) {
      const lvlKey = String(levelId);
      const examsMap = this._readJson(STORAGE_KEYS.EXAMS, DEFAULT_STATE.exams);
      const existing = examsMap[lvlKey] || {};
      const passed = Boolean(examResult.passed || existing.passed);
      const accuracy = Math.max(existing.accuracy || 0, Math.round(Number(examResult.accuracy) || 0));
      const wpm = Math.max(existing.wpm || 0, Math.round(Number(examResult.wpm) || 0));
      const stars = Math.max(existing.stars || 0, Math.round(Number(examResult.stars) || 0));
      const date = examResult.date || existing.date || (/* @__PURE__ */ new Date()).toISOString();
      examsMap[lvlKey] = {
        passed,
        accuracy,
        wpm,
        stars,
        date
      };
      this._writeJson(STORAGE_KEYS.EXAMS, examsMap);
      return examsMap[lvlKey];
    }
    /**
     * Get the exam result for a level.
     * @param {number|string} levelId
     * @returns {Object|null}
     */
    getExamResult(levelId) {
      const lvlKey = String(levelId);
      const examsMap = this._readJson(STORAGE_KEYS.EXAMS, DEFAULT_STATE.exams);
      return examsMap[lvlKey] || null;
    }
    /**
     * Check if the exam for a level has been successfully passed.
     * @param {number|string} levelId
     * @returns {boolean}
     */
    isExamPassed(levelId) {
      const result = this.getExamResult(levelId);
      return Boolean(result && result.passed);
    }
    // ==========================================
    // Student Profile & Typing Certificates API
    // ==========================================
    /**
     * Get the student name for certificates.
     * @returns {string}
     */
    getStudentName() {
      try {
        const raw = this._backend.getItem(STORAGE_KEYS.STUDENT_NAME);
        return raw && raw.trim() ? raw.trim() : DEFAULT_STATE.studentName;
      } catch {
        return DEFAULT_STATE.studentName;
      }
    }
    /**
     * Save student name for certificates.
     * @param {string} name
     */
    setStudentName(name) {
      const cleanName = typeof name === "string" && name.trim() ? name.trim() : DEFAULT_STATE.studentName;
      try {
        this._backend.setItem(STORAGE_KEYS.STUDENT_NAME, cleanName);
      } catch {
      }
      return cleanName;
    }
    /**
     * Save an unlocked certificate.
     * @param {Object} cert
     * @returns {Array<Object>}
     */
    saveCertificate(cert) {
      if (!cert || !cert.id) return [];
      const certs = this._readJson(STORAGE_KEYS.CERTIFICATES, DEFAULT_STATE.certificates);
      const existingIdx = certs.findIndex((c) => c.id === cert.id);
      if (existingIdx >= 0) {
        certs[existingIdx] = { ...certs[existingIdx], ...cert };
      } else {
        certs.push(cert);
      }
      this._writeJson(STORAGE_KEYS.CERTIFICATES, certs);
      return certs;
    }
    /**
     * Get all unlocked certificates.
     * @returns {Array<Object>}
     */
    getCertificates() {
      return this._readJson(STORAGE_KEYS.CERTIFICATES, DEFAULT_STATE.certificates);
    }
    /**
     * Get certificate by ID (e.g. 'cert-junior-n5' or 'cert-master-n8').
     * @param {string} certId
     * @returns {Object|null}
     */
    getCertificate(certId) {
      const certs = this.getCertificates();
      return certs.find((c) => c.id === certId) || null;
    }
    // ==========================================
    // Reset & Maintenance
    // ==========================================
    /**
     * Reset all storage to fresh initial defaults.
     */
    resetAll() {
      this._writeJson(STORAGE_KEYS.STARS, DEFAULT_STATE.stars);
      this._writeJson(STORAGE_KEYS.ACCESSORIES, DEFAULT_STATE.accessories);
      this._writeJson(STORAGE_KEYS.HEATMAP, DEFAULT_STATE.heatmap);
      this._writeJson(STORAGE_KEYS.SETTINGS, DEFAULT_STATE.settings);
      this._writeJson(STORAGE_KEYS.PROGRESS, DEFAULT_STATE.progress);
      this._writeJson(STORAGE_KEYS.LESSONS, DEFAULT_STATE.lessons);
      this._writeJson(STORAGE_KEYS.EXAMS, DEFAULT_STATE.exams);
      this._writeJson(STORAGE_KEYS.CERTIFICATES, DEFAULT_STATE.certificates);
      try {
        this._backend.setItem(STORAGE_KEYS.STUDENT_NAME, DEFAULT_STATE.studentName);
      } catch {
      }
    }
    /**
     * Alias for resetAll.
     */
    clear() {
      this.resetAll();
    }
  };
  var globalStorage = new StorageManager();

  // src/core/GameEngine.js
  var FINGER_MAP = Object.freeze({
    // Left Pinky
    "1": { finger: "lp", hand: "left" },
    "q": { finger: "lp", hand: "left" },
    "a": { finger: "lp", hand: "left" },
    "z": { finger: "lp", hand: "left" },
    // Left Ring
    "2": { finger: "lr", hand: "left" },
    "w": { finger: "lr", hand: "left" },
    "s": { finger: "lr", hand: "left" },
    "x": { finger: "lr", hand: "left" },
    // Left Middle
    "3": { finger: "lm", hand: "left" },
    "e": { finger: "lm", hand: "left" },
    "d": { finger: "lm", hand: "left" },
    "c": { finger: "lm", hand: "left" },
    // Left Index
    "4": { finger: "li", hand: "left" },
    "5": { finger: "li", hand: "left" },
    "r": { finger: "li", hand: "left" },
    "t": { finger: "li", hand: "left" },
    "f": { finger: "li", hand: "left" },
    "g": { finger: "li", hand: "left" },
    "v": { finger: "li", hand: "left" },
    "b": { finger: "li", hand: "left" },
    // Right Index
    "6": { finger: "ri", hand: "right" },
    "7": { finger: "ri", hand: "right" },
    "y": { finger: "ri", hand: "right" },
    "u": { finger: "ri", hand: "right" },
    "h": { finger: "ri", hand: "right" },
    "j": { finger: "ri", hand: "right" },
    "n": { finger: "ri", hand: "right" },
    "m": { finger: "ri", hand: "right" },
    // Right Middle
    "8": { finger: "rm", hand: "right" },
    "i": { finger: "rm", hand: "right" },
    "k": { finger: "rm", hand: "right" },
    ",": { finger: "rm", hand: "right" },
    // Right Ring
    "9": { finger: "rr", hand: "right" },
    "o": { finger: "rr", hand: "right" },
    "l": { finger: "rr", hand: "right" },
    ".": { finger: "rr", hand: "right" },
    // Right Pinky
    "0": { finger: "rp", hand: "right" },
    "p": { finger: "rp", hand: "right" },
    "\xF1": { finger: "rp", hand: "right" },
    "-": { finger: "rp", hand: "right" },
    "\xB4": { finger: "rp", hand: "right" },
    "\xE7": { finger: "rp", hand: "right" },
    "?": { finger: "rp", hand: "right" },
    "\xBF": { finger: "rp", hand: "right" },
    // Thumbs
    " ": { finger: "thumb", hand: "right" }
  });
  var FINGER_NAMES_ES = Object.freeze({
    lp: "Me\xF1ique Izquierdo",
    lr: "Anular Izquierdo",
    lm: "Coraz\xF3n Izquierdo",
    li: "\xCDndice Izquierdo",
    ri: "\xCDndice Derecho",
    rm: "Coraz\xF3n Derecho",
    rr: "Anular Derecho",
    rp: "Me\xF1ique Derecho",
    thumb: "Pulgar"
  });
  var FINGER_COLORS_ES = Object.freeze({
    lp: "coral",
    lr: "naranja c\xE1lido",
    lm: "amarillo sol",
    li: "verde menta",
    ri: "azul cielo",
    rm: "amarillo sol",
    rr: "naranja c\xE1lido",
    rp: "coral",
    thumb: "violeta m\xE1gico"
  });
  function getFingerForKey(char) {
    if (!char) {
      return {
        finger: "thumb",
        fingerName: "Pulgar",
        hand: "right",
        handName: "ambas manos",
        colorName: "violeta m\xE1gico",
        keyName: "Espacio"
      };
    }
    const lower = char.toLowerCase();
    const mapping = FINGER_MAP[lower] || { finger: "ri", hand: "right" };
    const finger = mapping.finger || "ri";
    const fingerName = FINGER_NAMES_ES[finger] || "Dedo \xCDndice";
    const colorName = FINGER_COLORS_ES[finger] || "de color";
    const hand = mapping.hand || "right";
    const handName = hand === "left" ? "Mano Izquierda" : hand === "right" ? "Mano Derecha" : "ambas manos";
    const keyName = char === " " ? "Espacio" : char === "\n" ? "Intro" : char.toUpperCase();
    return {
      finger,
      fingerName,
      hand,
      handName,
      colorName,
      keyName
    };
  }
  var GameEngine = class {
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
      this.feverThreshold = options.feverThreshold !== void 0 ? options.feverThreshold : 10;
      this.idleStuckThresholdMs = options.idleStuckThresholdMs || 2e3;
      this.keyPositionResolver = options.keyPositionResolver || (() => ({ x: 400, y: 500 }));
      this.levelId = 1;
      this.levelText = "";
      this.targetIndex = 0;
      this.currentTargetKey = "";
      this.isActive = false;
      this.totalKeystrokes = 0;
      this.correctHits = 0;
      this.consecutiveErrors = 0;
      this.comboCount = 0;
      this.maxCombo = 0;
      this.feverActive = false;
      this.feverMultiplier = 1;
      this.startTime = 0;
      this.lastKeystrokeTime = 0;
      this.lastErrorKey = "";
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
      this.levelText = Array.isArray(textOrWords) ? textOrWords.join(" ") : String(textOrWords || "");
      this.targetIndex = 0;
      this.totalKeystrokes = 0;
      this.correctHits = 0;
      this.consecutiveErrors = 0;
      this.comboCount = 0;
      this.maxCombo = 0;
      this.feverActive = false;
      this.feverMultiplier = 1;
      this.startTime = Date.now();
      this.lastKeystrokeTime = this.startTime;
      this.lastErrorKey = "";
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
        this.currentTargetKey = "";
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
      const isLevelShiftAware = Number(this.levelId) >= 7;
      const isCorrect = pressedKey === expected || !isLevelShiftAware && expected.length === 1 && pressedKey.toLowerCase() === expected.toLowerCase() || expected.length === 1 && pressedKey.toLowerCase() === expected.toLowerCase() && expected === expected.toLowerCase();
      if (isCorrect) {
        this.totalKeystrokes++;
        this.correctHits++;
        this.comboCount++;
        if (this.comboCount > this.maxCombo) {
          this.maxCombo = this.comboCount;
        }
        this.consecutiveErrors = 0;
        this.lastErrorKey = "";
        if (this.comboCount >= this.feverThreshold && !this.feverActive) {
          this.feverActive = true;
          this.feverMultiplier = 2;
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
        this.targetIndex++;
        if (this.targetIndex >= this.levelText.length) {
          return this._finishLevel();
        }
        this._updateCurrentTarget();
        return { success: true, finished: false, accuracy, combo: this.comboCount };
      }
      const isRapidRepeat = this.lastErrorKey === pressedKey && now - this.lastErrorTime < 400;
      this.lastErrorKey = pressedKey;
      this.lastErrorTime = now;
      if (!isRapidRepeat) {
        this.totalKeystrokes++;
        this.consecutiveErrors++;
        if (this.feverActive) {
          this.feverActive = false;
          this.feverMultiplier = 1;
          this.eventBus.emit(EVENTS.FEVER_MODE_CHANGED, {
            isActive: false,
            multiplier: 1
          });
        }
        this.comboCount = 0;
        if (this.storage && typeof this.storage.recordError === "function") {
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
      if (this.storage && typeof this.storage.saveLevelStars === "function") {
        this.storage.saveLevelStars(this.levelId, stars);
      }
      if (this.lessonId && this.storage && typeof this.storage.saveLessonCompleted === "function") {
        this.storage.saveLessonCompleted(this.levelId, this.lessonId);
      }
      let examResult = null;
      if (this.isExamMode && this.storage && typeof this.storage.saveExamResult === "function") {
        const minAcc = this.examConfig && this.examConfig.minAccuracy || 85;
        const minWPM = this.examConfig && this.examConfig.minWPM || 0;
        const passed = accuracy >= minAcc && wpm >= minWPM;
        examResult = this.storage.saveExamResult(this.levelId, {
          passed,
          accuracy,
          wpm,
          stars
        });
        this.eventBus.emit("EXAM_COMPLETED", {
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
      return Math.round(this.correctHits / this.totalKeystrokes * 100);
    }
    /**
     * Calculate Words Per Minute (WPM) based on 5 characters per standard word.
     * @returns {number}
     */
    getWPM() {
      const elapsedMinutes = (Date.now() - (this.startTime || Date.now())) / 6e4;
      if (elapsedMinutes <= 5e-3) return 0;
      const words = this.correctHits / 5;
      return Math.round(words / elapsedMinutes);
    }
    /**
     * Calculate keystrokes per minute (PPM).
     * @returns {number}
     */
    getPPM() {
      const elapsedMinutes = (Date.now() - (this.startTime || Date.now())) / 6e4;
      if (elapsedMinutes <= 5e-3) return 0;
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
        progressPercent: this.levelText.length > 0 ? Math.round(this.targetIndex / this.levelText.length * 100) : 0
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
  };
  var globalGameEngine = new GameEngine();

  // src/vfx/ParticleEngine.js
  var PEDAGOGICAL_COLORS = Object.freeze({
    // Left Pinky (Meñique Izquierdo) - Coral / Soft Red
    lp: Object.freeze({ primary: "#ff6b81", glow: "rgba(255, 107, 129, 0.65)", name: "Coral" }),
    // Left Ring (Anular Izquierdo) - Warm Orange
    lr: Object.freeze({ primary: "#ff9f43", glow: "rgba(255, 159, 67, 0.65)", name: "Naranja" }),
    // Left Middle (Medio Izquierdo) - Sun Yellow
    lm: Object.freeze({ primary: "#ffd32a", glow: "rgba(255, 211, 42, 0.70)", name: "Amarillo" }),
    // Left Index (Índice Izquierdo) - Mint Green
    li: Object.freeze({ primary: "#2ed573", glow: "rgba(46, 213, 115, 0.70)", name: "Verde Menta" }),
    // Right Index (Índice Derecho) - Sky Blue
    ri: Object.freeze({ primary: "#54a0ff", glow: "rgba(84, 160, 255, 0.70)", name: "Azul Cielo" }),
    // Right Middle (Medio Derecho) - Sun Yellow
    rm: Object.freeze({ primary: "#ffd32a", glow: "rgba(255, 211, 42, 0.70)", name: "Amarillo" }),
    // Right Ring (Anular Derecho) - Warm Orange
    rr: Object.freeze({ primary: "#ff9f43", glow: "rgba(255, 159, 67, 0.65)", name: "Naranja" }),
    // Right Pinky (Meñique Derecho) - Magic Violet / Lilac
    rp: Object.freeze({ primary: "#a29bfe", glow: "rgba(162, 155, 254, 0.70)", name: "Violeta M\xE1gico" }),
    // Thumbs (Pulgares / Espacio) - Cosmic Purple
    thumb: Object.freeze({ primary: "#9b59b6", glow: "rgba(155, 89, 182, 0.70)", name: "P\xFArpura C\xF3smico" }),
    // Golden Fever Accent
    fever: Object.freeze({ primary: "#f1c40f", glow: "rgba(241, 196, 15, 0.85)", name: "Oro Fiebre" })
  });
  function resolvePedagogicalColor(keyOrFinger) {
    if (!keyOrFinger) {
      return PEDAGOGICAL_COLORS.thumb;
    }
    const clean = String(keyOrFinger).toLowerCase().trim();
    if (PEDAGOGICAL_COLORS[clean]) {
      return PEDAGOGICAL_COLORS[clean];
    }
    if (clean.startsWith("#") || clean.startsWith("rgb")) {
      return { primary: clean, glow: clean, name: "Custom" };
    }
    return PEDAGOGICAL_COLORS.thumb;
  }
  var Particle = class {
    constructor() {
      this.reset();
    }
    reset() {
      this.active = false;
      this.kind = "ambient";
      this.subType = "bubble";
      this.x = 0;
      this.y = 0;
      this.startX = 0;
      this.vx = 0;
      this.vy = 0;
      this.radius = 4;
      this.color = "#ffffff";
      this.glow = "rgba(255, 255, 255, 0.5)";
      this.alpha = 1;
      this.maxAlpha = 1;
      this.rotation = 0;
      this.angularVelocity = 0;
      this.lifespan = 1;
      this.age = 0;
      this.gravity = 0;
      this.drag = 0;
      this.wobbleFreq = 1.2;
      this.wobbleAmp = 20;
      this.phase = 0;
      this.scale = 1;
      this.width = 6;
      this.height = 6;
    }
  };
  var ParticlePool = class {
    /**
     * @param {number} initialSize
     */
    constructor(initialSize = 100) {
      this.pool = [];
      this.activeList = [];
      for (let i = 0; i < initialSize; i++) {
        this.pool.push(new Particle());
      }
    }
    /**
     * Obtains an inactive particle from the pool, expanding if exhausted
     * @returns {Particle}
     */
    acquire() {
      let p;
      if (this.pool.length > 0) {
        p = this.pool.pop();
      } else {
        p = new Particle();
      }
      p.reset();
      p.active = true;
      this.activeList.push(p);
      return p;
    }
    /**
     * Returns a dead particle back to the pool
     * @param {Particle} p
     * @param {number} activeIndex
     */
    releaseAt(activeIndex) {
      const p = this.activeList[activeIndex];
      p.active = false;
      const last = this.activeList.pop();
      if (activeIndex < this.activeList.length) {
        this.activeList[activeIndex] = last;
      }
      this.pool.push(p);
    }
    /**
     * Deactivates and reclaims all particles
     */
    clear() {
      while (this.activeList.length > 0) {
        const p = this.activeList.pop();
        p.active = false;
        this.pool.push(p);
      }
    }
    get activeCount() {
      return this.activeList.length;
    }
    get poolCapacity() {
      return this.pool.length + this.activeList.length;
    }
  };
  var ParticleEngine = class {
    /**
     * @param {Object} [options]
     * @param {number} [options.width=800]
     * @param {number} [options.height=600]
     * @param {number} [options.maxAmbient=50]
     * @param {number} [options.maxPool=300]
     */
    constructor(options = {}) {
      this.width = options.width || 800;
      this.height = options.height || 600;
      this.maxAmbient = options.maxAmbient || 50;
      this.pool = new ParticlePool(options.maxPool || 300);
      this.feverActive = false;
      this.feverMultiplier = 1;
      this.ambientTimer = 0;
      this.ambientInterval = 0.15;
      this.seedAmbientParticles(Math.floor(this.maxAmbient * 0.7));
    }
    /**
     * Sets canvas dimensions
     * @param {number} w
     * @param {number} h
     */
    resize(w, h) {
      this.width = Math.max(10, Number(w) || 800);
      this.height = Math.max(10, Number(h) || 600);
    }
    /**
     * Toggles or adjusts fever mode
     * @param {boolean} isActive
     * @param {number} [multiplier=2.0]
     */
    setFeverMode(isActive, multiplier = 2) {
      this.feverActive = Boolean(isActive);
      this.feverMultiplier = this.feverActive ? Math.max(1, Number(multiplier) || 2) : 1;
      this.ambientInterval = this.feverActive ? 0.08 : 0.15;
    }
    /**
     * Pre-populates ambient particles distributed across the screen
     * @param {number} count
     */
    seedAmbientParticles(count) {
      for (let i = 0; i < count; i++) {
        const p = this.spawnAmbientParticle();
        if (p) {
          p.y = Math.random() * this.height;
          p.age = Math.random() * p.lifespan * 0.8;
        }
      }
    }
    /**
     * Spawns a single ambient particle (bubble, golden star, or dust mote)
     * @returns {Particle|null}
     */
    spawnAmbientParticle() {
      const activeAmbient = this.pool.activeList.filter((p2) => p2.kind === "ambient").length;
      const limit = this.feverActive ? Math.floor(this.maxAmbient * 1.6) : this.maxAmbient;
      if (activeAmbient >= limit) {
        return null;
      }
      const p = this.pool.acquire();
      p.kind = "ambient";
      const randType = Math.random();
      if (this.feverActive || randType < 0.35) {
        p.subType = "star";
        p.radius = 4 + Math.random() * 6;
        p.color = this.feverActive ? Math.random() < 0.6 ? "#ffd32a" : "#ffeaa7" : "#ffeaa7";
        p.glow = "rgba(255, 211, 42, 0.6)";
        p.maxAlpha = 0.5 + Math.random() * 0.45;
        p.alpha = 0;
        p.lifespan = 3.5 + Math.random() * 3;
        p.vy = -(15 + Math.random() * 25);
        p.vx = (Math.random() - 0.5) * 10;
        p.rotation = Math.random() * Math.PI * 2;
        p.angularVelocity = (Math.random() - 0.5) * 1.5;
      } else if (randType < 0.75) {
        p.subType = "bubble";
        p.radius = 6 + Math.random() * 10;
        const bubbleColors = [
          "rgba(162, 155, 254, 0.45)",
          // Lilac
          "rgba(116, 185, 255, 0.40)",
          // Sky
          "rgba(85, 239, 196, 0.35)",
          // Mint
          "rgba(255, 234, 167, 0.40)"
          // Soft gold
        ];
        p.color = bubbleColors[Math.floor(Math.random() * bubbleColors.length)];
        p.glow = "rgba(255, 255, 255, 0.3)";
        p.maxAlpha = 0.4 + Math.random() * 0.35;
        p.alpha = 0;
        p.lifespan = 5 + Math.random() * 4;
        p.vy = -(25 + Math.random() * 30);
        p.wobbleFreq = 1 + Math.random() * 0.8;
        p.wobbleAmp = 15 + Math.random() * 20;
        p.phase = Math.random() * Math.PI * 2;
      } else {
        p.subType = "mote";
        p.radius = 1.5 + Math.random() * 2;
        p.color = "#ffffff";
        p.glow = "rgba(255, 255, 255, 0.5)";
        p.maxAlpha = 0.3 + Math.random() * 0.35;
        p.alpha = 0;
        p.lifespan = 4 + Math.random() * 3;
        p.vy = -(10 + Math.random() * 18);
        p.vx = (Math.random() - 0.5) * 15;
      }
      p.startX = Math.random() * this.width;
      p.x = p.startX;
      p.y = this.height + p.radius + Math.random() * 30;
      p.age = 0;
      return p;
    }
    /**
     * Spawns a radial burst of particles matching the finger's pedagogical color
     * Fired on key press or target impact
     * 
     * @param {number} x - Center X coordinate
     * @param {number} y - Center Y coordinate
     * @param {string} [fingerOrColor='li'] - Finger ID ('lp','lr','lm','li','ri','rm','rr','rp','thumb') or color
     * @param {Object} [options]
     * @param {number} [options.count=18]
     * @param {number} [options.minSpeed=120]
     * @param {number} [options.maxSpeed=260]
     * @param {number} [options.gravity=320]
     * @param {number} [options.duration=0.55]
     * @returns {Array<Particle>}
     */
    spawnRadialBurst(x, y, fingerOrColor = "li", options = {}) {
      const colorDef = resolvePedagogicalColor(fingerOrColor);
      const count = options.count || (this.feverActive ? 26 : 18);
      const minSpeed = options.minSpeed || 120;
      const maxSpeed = options.maxSpeed || 260;
      const gravity = options.gravity !== void 0 ? options.gravity : 320;
      const baseDuration = options.duration || 0.55;
      const spawned = [];
      for (let i = 0; i < count; i++) {
        const p = this.pool.acquire();
        p.kind = "burst";
        p.subType = Math.random() < 0.3 ? "star" : "spark";
        p.x = x;
        p.y = y;
        p.startX = x;
        if (this.feverActive && Math.random() < 0.4) {
          p.color = "#ffd32a";
          p.glow = "rgba(255, 211, 42, 0.8)";
        } else {
          p.color = colorDef.primary;
          p.glow = colorDef.glow;
        }
        const angle = i / count * Math.PI * 2 + (Math.random() - 0.5) * 0.3;
        const speed = minSpeed + Math.random() * (maxSpeed - minSpeed);
        p.vx = Math.cos(angle) * speed;
        p.vy = Math.sin(angle) * speed;
        p.gravity = gravity;
        p.drag = 1.2;
        p.radius = 3 + Math.random() * 4;
        p.maxAlpha = 0.95;
        p.alpha = 0.95;
        p.lifespan = baseDuration * (0.75 + Math.random() * 0.5);
        p.age = 0;
        p.rotation = Math.random() * Math.PI * 2;
        p.angularVelocity = (Math.random() - 0.5) * 6;
        spawned.push(p);
      }
      return spawned;
    }
    /**
     * Spawns trail particles along a projectile arc
     * 
     * @param {number} x
     * @param {number} y
     * @param {string} fingerOrColor
     * @param {number} [count=2]
     * @returns {Array<Particle>}
     */
    spawnTrailParticle(x, y, fingerOrColor = "li", count = 2) {
      const colorDef = resolvePedagogicalColor(fingerOrColor);
      const spawned = [];
      for (let i = 0; i < count; i++) {
        const p = this.pool.acquire();
        p.kind = "trail";
        p.subType = Math.random() < 0.4 ? "star" : "disc";
        p.x = x + (Math.random() - 0.5) * 8;
        p.y = y + (Math.random() - 0.5) * 8;
        p.vx = (Math.random() - 0.5) * 30;
        p.vy = (Math.random() - 0.5) * 30 - 15;
        p.gravity = 40;
        p.drag = 0.8;
        p.radius = 2.5 + Math.random() * 3.5;
        p.color = colorDef.primary;
        p.glow = colorDef.glow;
        p.maxAlpha = 0.85;
        p.alpha = 0.85;
        p.lifespan = 0.32 + Math.random() * 0.25;
        p.age = 0;
        p.rotation = Math.random() * Math.PI * 2;
        p.angularVelocity = (Math.random() - 0.5) * 4;
        spawned.push(p);
      }
      return spawned;
    }
    /**
     * Spawns victory celebration confetti pieces
     * 
     * @param {number} x
     * @param {number} y
     * @param {number} [count=45]
     * @returns {Array<Particle>}
     */
    spawnConfetti(x, y, count = 45) {
      const palette = ["#ff6b81", "#ff9f43", "#ffd32a", "#2ed573", "#54a0ff", "#a29bfe", "#ffffff"];
      const spawned = [];
      for (let i = 0; i < count; i++) {
        const p = this.pool.acquire();
        p.kind = "confetti";
        p.subType = "ribbon";
        p.x = x + (Math.random() - 0.5) * 40;
        p.y = y + (Math.random() - 0.5) * 20;
        const angle = -Math.PI / 2 + (Math.random() - 0.5) * 1.8;
        const speed = 180 + Math.random() * 260;
        p.vx = Math.cos(angle) * speed;
        p.vy = Math.sin(angle) * speed;
        p.gravity = 280;
        p.drag = 0.9;
        p.width = 6 + Math.random() * 5;
        p.height = 10 + Math.random() * 6;
        p.color = palette[Math.floor(Math.random() * palette.length)];
        p.glow = "transparent";
        p.maxAlpha = 1;
        p.alpha = 1;
        p.lifespan = 1.2 + Math.random() * 0.8;
        p.age = 0;
        p.rotation = Math.random() * Math.PI * 2;
        p.angularVelocity = (Math.random() - 0.5) * 8;
        spawned.push(p);
      }
      return spawned;
    }
    /**
     * Updates all active particles by dt seconds
     * Reclaims dead particles to the pool
     * 
     * @param {number} dt - Delta time in seconds (clamped to 0.1s max to prevent tunneling)
     * @returns {number} Active particle count
     */
    update(dt) {
      const safeDt = Math.min(0.1, Math.max(1e-3, dt || 0.016));
      this.ambientTimer += safeDt;
      if (this.ambientTimer >= this.ambientInterval) {
        this.ambientTimer = 0;
        this.spawnAmbientParticle();
      }
      const activeList = this.pool.activeList;
      for (let i = activeList.length - 1; i >= 0; i--) {
        const p = activeList[i];
        p.age += safeDt;
        if (p.age >= p.lifespan) {
          this.pool.releaseAt(i);
          continue;
        }
        const progress = p.age / p.lifespan;
        if (p.kind === "ambient") {
          if (progress < 0.2) {
            p.alpha = progress / 0.2 * p.maxAlpha;
          } else if (progress > 0.8) {
            p.alpha = (1 - progress) / 0.2 * p.maxAlpha;
          } else {
            p.alpha = p.maxAlpha;
          }
          p.x += (p.vx || 0) * safeDt;
          p.y += p.vy * safeDt;
          if (p.y < -30) {
            this.pool.releaseAt(i);
            continue;
          }
        } else {
          p.alpha = (1 - progress) * p.maxAlpha;
          if (p.drag > 0) {
            p.vx *= Math.max(0, 1 - p.drag * safeDt);
            p.vy *= Math.max(0, 1 - p.drag * safeDt);
          }
          if (p.gravity > 0) {
            p.vy += p.gravity * safeDt;
          }
          p.x += p.vx * safeDt;
          p.y += p.vy * safeDt;
        }
        if (p.angularVelocity !== 0) {
          p.rotation += p.angularVelocity * safeDt;
        }
      }
      return this.pool.activeCount;
    }
    /**
     * Renders all active particles onto Canvas 2D context
     * @param {CanvasRenderingContext2D} ctx
     */
    render(ctx) {
      if (!ctx) return;
      const activeList = this.pool.activeList;
      if (activeList.length === 0) return;
      ctx.save();
      for (let i = 0; i < activeList.length; i++) {
        const p = activeList[i];
        if (p.alpha <= 0.01) continue;
        ctx.save();
        ctx.globalAlpha = Math.max(0, Math.min(1, p.alpha));
        ctx.translate(p.x, p.y);
        if (p.rotation !== 0) {
          ctx.rotate(p.rotation);
        }
        if (p.subType === "star") {
          this._renderStar(ctx, p.radius, p.color, p.glow);
        } else if (p.subType === "bubble") {
          this._renderBubble(ctx, p.radius, p.color);
        } else if (p.subType === "ribbon") {
          const flip = Math.cos(p.age * 12);
          ctx.scale(1, flip);
          ctx.fillStyle = p.color;
          ctx.fillRect(-p.width / 2, -p.height / 2, p.width, p.height);
        } else {
          ctx.fillStyle = p.color;
          if (p.glow && p.glow !== "transparent") {
            ctx.shadowColor = p.glow;
            ctx.shadowBlur = 6;
          }
          ctx.beginPath();
          ctx.arc(0, 0, Math.max(1, p.radius), 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }
      ctx.restore();
    }
    /**
     * Helper to draw a 4-point diamond star
     * @private
     */
    _renderStar(ctx, radius, color, glow) {
      if (glow) {
        ctx.shadowColor = glow;
        ctx.shadowBlur = 8;
      }
      ctx.fillStyle = color;
      ctx.beginPath();
      const rOuter = radius;
      const rInner = radius * 0.32;
      for (let i = 0; i < 4; i++) {
        const outerAngle = i * Math.PI / 2;
        const innerAngle = outerAngle + Math.PI / 4;
        if (i === 0) {
          ctx.moveTo(Math.cos(outerAngle) * rOuter, Math.sin(outerAngle) * rOuter);
        } else {
          ctx.lineTo(Math.cos(outerAngle) * rOuter, Math.sin(outerAngle) * rOuter);
        }
        ctx.lineTo(Math.cos(innerAngle) * rInner, Math.sin(innerAngle) * rInner);
      }
      ctx.closePath();
      ctx.fill();
    }
    /**
     * Helper to draw a translucent bubble with a specular reflection
     * @private
     */
    _renderBubble(ctx, radius, color) {
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(0, 0, radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "rgba(255, 255, 255, 0.65)";
      ctx.beginPath();
      ctx.arc(-radius * 0.35, -radius * 0.35, radius * 0.22, 0, Math.PI * 2);
      ctx.fill();
    }
    /**
     * Clears all active particles
     */
    clear() {
      this.pool.clear();
    }
    /**
     * Disposes the engine
     */
    dispose() {
      this.clear();
    }
  };

  // src/vfx/SquashStretch.js
  var SquashStretch_exports = {};
  __export(SquashStretch_exports, {
    DEFAULT_SPRING_CONFIG: () => DEFAULT_SPRING_CONFIG,
    SQUASH_PRESETS: () => SQUASH_PRESETS,
    applySquashAndStretch: () => applySquashAndStretch,
    calculateSquashAndStretch: () => calculateSquashAndStretch,
    default: () => SquashStretch_default,
    generateSpringKeyframes: () => generateSpringKeyframes
  });
  var DEFAULT_SPRING_CONFIG = Object.freeze({
    amplitude: 0.2,
    // Maximum deformation amplitude (20%)
    dampingRatio: 0.42,
    // Damping factor zeta (settles in ~3 oscillations)
    naturalFreq: 26,
    // Undamped angular frequency omega_n (rad/s)
    durationMs: 380,
    // Total animation duration in milliseconds
    origin: "50% 85%"
    // Transform origin (bottom-weighted for grounded bounce)
  });
  var SQUASH_PRESETS = Object.freeze({
    impact: {
      amplitude: 0.22,
      dampingRatio: 0.42,
      naturalFreq: 26,
      durationMs: 380,
      origin: "50% 85%"
    },
    hop: {
      amplitude: 0.16,
      dampingRatio: 0.5,
      naturalFreq: 22,
      durationMs: 320,
      origin: "50% 90%"
    },
    keyPress: {
      amplitude: 0.12,
      dampingRatio: 0.55,
      naturalFreq: 30,
      durationMs: 220,
      origin: "50% 50%"
    },
    gentle: {
      amplitude: 0.08,
      dampingRatio: 0.45,
      naturalFreq: 20,
      durationMs: 300,
      origin: "50% 80%"
    }
  });
  function calculateSquashAndStretch(tSec, options = {}) {
    const intensity = typeof options.intensity === "number" ? options.intensity : 1;
    const A = (options.amplitude ?? DEFAULT_SPRING_CONFIG.amplitude) * intensity;
    const zeta = options.dampingRatio ?? DEFAULT_SPRING_CONFIG.dampingRatio;
    const omegaN = options.naturalFreq ?? DEFAULT_SPRING_CONFIG.naturalFreq;
    const direction = options.direction || "vertical";
    const t = Math.max(0, tSec);
    const underDamped = Math.max(0, 1 - zeta * zeta);
    const omegaD = omegaN * Math.sqrt(underDamped);
    const decay = Math.exp(-zeta * omegaN * t);
    const displacement = A * decay * Math.cos(omegaD * t);
    let scaleX;
    let scaleY;
    if (direction === "vertical") {
      scaleX = 1 + displacement;
      scaleY = scaleX > 0.01 ? 1 / scaleX : 1;
    } else {
      scaleY = 1 + displacement;
      scaleX = scaleY > 0.01 ? 1 / scaleY : 1;
    }
    return {
      scaleX: Number(scaleX.toFixed(4)),
      scaleY: Number(scaleY.toFixed(4)),
      displacement: Number(displacement.toFixed(4))
    };
  }
  function generateSpringKeyframes(options = {}, samples = 12) {
    const durationMs = options.durationMs ?? DEFAULT_SPRING_CONFIG.durationMs;
    const totalSec = durationMs / 1e3;
    const keyframes = [];
    for (let i = 0; i <= samples; i++) {
      const fraction = i / samples;
      const tSec = fraction * totalSec;
      const { scaleX, scaleY } = calculateSquashAndStretch(tSec, options);
      keyframes.push({
        transform: `scale(${scaleX}, ${scaleY})`,
        offset: Number(fraction.toFixed(3))
      });
    }
    keyframes[keyframes.length - 1] = {
      transform: "scale(1, 1)",
      offset: 1
    };
    return keyframes;
  }
  function applySquashAndStretch(element, options = {}) {
    if (!element || typeof element !== "object") {
      return null;
    }
    const presetConfig = options.preset && SQUASH_PRESETS[options.preset] ? SQUASH_PRESETS[options.preset] : {};
    const merged = {
      ...DEFAULT_SPRING_CONFIG,
      ...presetConfig,
      ...options
    };
    const origin = merged.origin || DEFAULT_SPRING_CONFIG.origin;
    const durationMs = merged.durationMs || DEFAULT_SPRING_CONFIG.durationMs;
    if (element.style) {
      element.style.transformOrigin = origin;
    }
    if (element._activeSquashAnimation && typeof element._activeSquashAnimation.cancel === "function") {
      try {
        element._activeSquashAnimation.cancel();
      } catch (_) {
      }
      element._activeSquashAnimation = null;
    }
    if (typeof element.animate === "function") {
      const keyframes = generateSpringKeyframes(merged, 12);
      const animation = element.animate(keyframes, {
        duration: durationMs,
        easing: "linear",
        fill: "none"
      });
      element._activeSquashAnimation = animation;
      const cleanup = () => {
        if (element._activeSquashAnimation === animation) {
          element._activeSquashAnimation = null;
        }
      };
      animation.onfinish = cleanup;
      animation.oncancel = cleanup;
      return animation;
    }
    let isCancelled = false;
    let resolveFinished;
    const finishedPromise = new Promise((resolve) => {
      resolveFinished = resolve;
    });
    const timerId = setTimeout(() => {
      if (!isCancelled) {
        if (element.style) {
          element.style.transform = "scale(1, 1)";
        }
        resolveFinished();
      }
    }, durationMs);
    const fallbackController = {
      cancel: () => {
        isCancelled = true;
        clearTimeout(timerId);
        if (element.style) {
          element.style.transform = "scale(1, 1)";
        }
        resolveFinished();
      },
      finish: () => {
        isCancelled = true;
        clearTimeout(timerId);
        if (element.style) {
          element.style.transform = "scale(1, 1)";
        }
        resolveFinished();
      },
      finished: finishedPromise
    };
    element._activeSquashAnimation = fallbackController;
    return fallbackController;
  }
  var SquashStretch_default = {
    applySquashAndStretch,
    calculateSquashAndStretch,
    generateSpringKeyframes,
    DEFAULT_SPRING_CONFIG,
    SQUASH_PRESETS
  };

  // src/vfx/BezierProjectiles.js
  function calculateBezierPoint(p0, p1, p2, t) {
    const clampedT = Math.max(0, Math.min(1, t));
    const oneMinusT = 1 - clampedT;
    const c0 = oneMinusT * oneMinusT;
    const c1 = 2 * oneMinusT * clampedT;
    const c2 = clampedT * clampedT;
    return {
      x: c0 * p0.x + c1 * p1.x + c2 * p2.x,
      y: c0 * p0.y + c1 * p1.y + c2 * p2.y
    };
  }
  function calculateBezierTangent(p0, p1, p2, t) {
    const clampedT = Math.max(0, Math.min(1, t));
    const oneMinusT = 1 - clampedT;
    const vx = 2 * oneMinusT * (p1.x - p0.x) + 2 * clampedT * (p2.x - p1.x);
    const vy = 2 * oneMinusT * (p1.y - p0.y) + 2 * clampedT * (p2.y - p1.y);
    const angle = Math.atan2(vy, vx);
    return { vx, vy, angle };
  }
  function computeControlPoint(p0, p2, hand = "left") {
    const mx = (p0.x + p2.x) / 2;
    const my = (p0.y + p2.y) / 2;
    const dx = Math.abs(p2.x - p0.x);
    const baseArc = Math.max(100, dx * 0.38);
    const arcJitter = (Math.random() - 0.5) * 20;
    const hArc = baseArc + arcJitter;
    const lateralOffset = hand === "left" ? -35 : 35;
    return {
      x: mx + lateralOffset,
      y: Math.min(p0.y, p2.y) - hArc
    };
  }
  var MagicProjectile = class {
    /**
     * @param {Object} options
     */
    constructor(options = {}) {
      this.p0 = { x: options.p0?.x || 0, y: options.p0?.y || 0 };
      this.p2 = { x: options.p2?.x || 0, y: options.p2?.y || 0 };
      this.p1 = options.p1 || computeControlPoint(this.p0, this.p2, options.hand);
      this.key = options.key || "";
      this.finger = options.finger || "li";
      this.hand = options.hand || "left";
      this.colorDef = resolvePedagogicalColor(this.finger);
      this.duration = options.duration || (options.isFever ? 0.32 : 0.45);
      this.elapsed = 0;
      this.progress = 0;
      this.currentPos = { ...this.p0 };
      this.angle = 0;
      this.radius = options.radius || 7;
      this.trailTimer = 0;
      this.trailInterval = 0.025;
      this.isDead = false;
      this.onImpact = options.onImpact || null;
    }
    /**
     * Updates projectile progress
     * @param {number} dt
     * @param {ParticleEngine} [particleEngine]
     * @returns {boolean} True if still active, false if reached target
     */
    update(dt, particleEngine) {
      if (this.isDead) return false;
      this.elapsed += dt;
      const rawProgress = Math.min(1, this.elapsed / this.duration);
      this.progress = 1 - (1 - rawProgress) * (1 - rawProgress);
      this.currentPos = calculateBezierPoint(this.p0, this.p1, this.p2, this.progress);
      const tangent = calculateBezierTangent(this.p0, this.p1, this.p2, this.progress);
      this.angle = tangent.angle;
      if (particleEngine) {
        this.trailTimer += dt;
        if (this.trailTimer >= this.trailInterval) {
          this.trailTimer = 0;
          particleEngine.spawnTrailParticle(this.currentPos.x, this.currentPos.y, this.finger, 2);
        }
      }
      if (rawProgress >= 1) {
        this.isDead = true;
        if (typeof this.onImpact === "function") {
          this.onImpact(this.p2, this.finger, this);
        }
        return false;
      }
      return true;
    }
    /**
     * Renders projectile onto Canvas 2D
     * @param {CanvasRenderingContext2D} ctx
     */
    render(ctx) {
      if (this.isDead || !ctx) return;
      ctx.save();
      ctx.translate(this.currentPos.x, this.currentPos.y);
      ctx.rotate(this.angle);
      ctx.shadowColor = this.colorDef.glow;
      ctx.shadowBlur = 12;
      ctx.fillStyle = this.colorDef.primary;
      ctx.beginPath();
      ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.arc(0, 0, this.radius * 0.55, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = this.colorDef.glow;
      ctx.beginPath();
      ctx.moveTo(-this.radius * 2.2, 0);
      ctx.lineTo(0, -this.radius * 0.8);
      ctx.lineTo(0, this.radius * 0.8);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
  };
  var BezierProjectiles = class {
    /**
     * @param {Object} [options]
     * @param {ParticleEngine} [options.particleEngine]
     * @param {HTMLElement|null} [options.mascotElement]
     * @param {import('../core/EventBus.js').EventBus|null} [options.eventBus]
     * @param {Function} [options.targetResolver] () => { x, y }
     */
    constructor(options = {}) {
      this.particleEngine = options.particleEngine || new ParticleEngine();
      this.mascotElement = options.mascotElement || null;
      this.eventBus = options.eventBus || null;
      this.targetResolver = options.targetResolver || null;
      this.projectiles = [];
      this.feverActive = false;
      this.feverMultiplier = 1;
      this.unsubscribers = [];
      if (this.eventBus) {
        this.bindEvents(this.eventBus);
      }
    }
    /**
     * Sets target coordinate resolver callback (e.g. mascot avatar center)
     * @param {Function} resolver - Returns { x: number, y: number }
     */
    setTargetResolver(resolver) {
      this.targetResolver = resolver;
    }
    /**
     * Sets mascot DOM element for squash & stretch deformation
     * @param {HTMLElement} element
     */
    setMascotElement(element) {
      this.mascotElement = element;
    }
    /**
     * Resolves target position for the projectile landing
     * @returns {{ x: number, y: number }}
     */
    resolveTarget() {
      if (typeof this.targetResolver === "function") {
        try {
          const res = this.targetResolver();
          if (res && typeof res.x === "number" && typeof res.y === "number") {
            return res;
          }
        } catch (_) {
        }
      }
      if (this.mascotElement && typeof this.mascotElement.getBoundingClientRect === "function") {
        try {
          const rect = this.mascotElement.getBoundingClientRect();
          return {
            x: rect.left + rect.width / 2,
            y: rect.top + rect.height * 0.55
          };
        } catch (_) {
        }
      }
      return { x: 260, y: 220 };
    }
    /**
     * Subscribes to relevant EventBus events
     * @param {import('../core/EventBus.js').EventBus} bus
     */
    bindEvents(bus) {
      if (!bus || typeof bus.on !== "function") return;
      const unsubSuccess = bus.on("KEY_PRESSED_SUCCESS", (payload) => {
        this.handleSuccessKeyPress(payload);
      });
      this.unsubscribers.push(unsubSuccess);
      const unsubFever = bus.on("FEVER_MODE_CHANGED", (payload) => {
        this.feverActive = Boolean(payload && payload.isActive);
        this.feverMultiplier = this.feverActive ? payload.multiplier || 2 : 1;
      });
      this.unsubscribers.push(unsubFever);
    }
    /**
     * Handles KEY_PRESSED_SUCCESS payload to spawn a projectile
     * @param {Object} payload
     */
    handleSuccessKeyPress(payload) {
      if (!payload) return;
      const key = payload.key || "";
      const p0 = payload.keyScreenPosition || { x: 400, y: 550 };
      const p2 = this.resolveTarget();
      const finger = payload.finger || "li";
      const hand = payload.hand || (p0.x < (typeof window !== "undefined" ? window.innerWidth / 2 : 500) ? "left" : "right");
      this.spawnProjectile({
        p0,
        p2,
        key,
        finger,
        hand,
        isFever: this.feverActive
      });
    }
    /**
     * Spawns a new magic projectile
     * @param {Object} options
     * @returns {MagicProjectile}
     */
    spawnProjectile(options = {}) {
      const p0 = options.p0 || { x: 400, y: 500 };
      const p2 = options.p2 || this.resolveTarget();
      const finger = options.finger || "li";
      const hand = options.hand || "left";
      const projectile = new MagicProjectile({
        p0,
        p2,
        key: options.key || "",
        finger,
        hand,
        isFever: options.isFever !== void 0 ? options.isFever : this.feverActive,
        onImpact: (impactPos, impactFinger, proj) => {
          this.handleImpact(impactPos, impactFinger);
          if (typeof options.onImpact === "function") {
            options.onImpact(impactPos, impactFinger, proj);
          }
        }
      });
      this.projectiles.push(projectile);
      return projectile;
    }
    /**
     * Detonation on projectile impact:
     * 1. Radial burst of pedagogical particles
     * 2. Damped harmonic squash & stretch on target
     * 
     * @param {{ x: number, y: number }} impactPos
     * @param {string} finger
     */
    handleImpact(impactPos, finger) {
      if (this.particleEngine) {
        this.particleEngine.spawnRadialBurst(impactPos.x, impactPos.y, finger, {
          count: this.feverActive ? 24 : 16,
          minSpeed: 110,
          maxSpeed: 240
        });
      }
      if (this.mascotElement) {
        applySquashAndStretch(this.mascotElement, {
          preset: "impact",
          intensity: this.feverActive ? 1.3 : 1
        });
      }
    }
    /**
     * Updates all active projectiles
     * @param {number} dt
     * @returns {number} Active projectile count
     */
    update(dt) {
      const safeDt = Math.max(1e-3, Math.min(2, dt || 0.016));
      for (let i = this.projectiles.length - 1; i >= 0; i--) {
        const proj = this.projectiles[i];
        const isActive = proj.update(safeDt, this.particleEngine);
        if (!isActive) {
          this.projectiles.splice(i, 1);
        }
      }
      return this.projectiles.length;
    }
    /**
     * Renders all active projectiles onto Canvas 2D
     * @param {CanvasRenderingContext2D} ctx
     */
    render(ctx) {
      if (!ctx || this.projectiles.length === 0) return;
      for (let i = 0; i < this.projectiles.length; i++) {
        this.projectiles[i].render(ctx);
      }
    }
    /**
     * Cleans up all projectiles and event listeners
     */
    dispose() {
      this.projectiles = [];
      while (this.unsubscribers.length > 0) {
        const unsub = this.unsubscribers.pop();
        try {
          if (typeof unsub === "function") unsub();
        } catch (_) {
        }
      }
    }
  };

  // src/vfx/LiveScene.js
  function calculateParallaxOffset(normX, normY, timeMs, viewportWidth, viewportHeight, currentX, currentY, dtSec, scaleFactor = 1.08, lambda = 3.5) {
    return {
      targetX: 0,
      targetY: 0,
      nextX: 0,
      nextY: 0
    };
  }
  function injectStickerFilter(doc) {
    const targetDoc = doc || (typeof document !== "undefined" ? document : null);
    if (!targetDoc || !targetDoc.createElementNS) return null;
    if (targetDoc.getElementById("sticker-outline-3px")) {
      return targetDoc.getElementById("sticker-outline-3px");
    }
    const svgNS = "http://www.w3.org/2000/svg";
    const svg = targetDoc.createElementNS(svgNS, "svg");
    svg.setAttribute("id", "vfx-filter-defs");
    svg.setAttribute("style", "position: absolute; width: 0; height: 0; overflow: hidden; pointer-events: none;");
    svg.setAttribute("aria-hidden", "true");
    svg.innerHTML = `
    <defs>
      <filter id="sticker-outline-3px" x="-20%" y="-20%" width="140%" height="140%">
        <!-- 1. Dilate alpha mask outward by 3px -->
        <feMorphology in="SourceAlpha" operator="dilate" radius="3" result="dilatedAlpha" />
        <!-- 2. Flood dilated mask with pure white -->
        <feFlood flood-color="#ffffff" flood-opacity="1" result="whiteColor" />
        <feComposite in="whiteColor" in2="dilatedAlpha" operator="in" result="whiteOutline" />
        <!-- 3. Cast a smooth drop-shadow under the white outline -->
        <feDropShadow in="whiteOutline" dx="0" dy="5" stdDeviation="5" flood-color="rgba(15, 17, 35, 0.45)" result="dropShadow" />
        <!-- 4. Composite in order: Shadow -> White Outline -> Original Graphic -->
        <feMerge>
          <feMergeNode in="dropShadow" />
          <feMergeNode in="whiteOutline" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
    </defs>
  `;
    if (targetDoc.body) {
      targetDoc.body.appendChild(svg);
    }
    return svg;
  }
  var LiveScene = class {
    /**
     * @param {Object} [options]
     * @param {HTMLElement|string} [options.container] - Container element or selector
     * @param {import('../core/EventBus.js').EventBus|null} [options.eventBus]
     * @param {HTMLElement|null} [options.mascotElement]
     * @param {string} [options.backgroundImageUrl='assets/main_scene.png']
     * @param {boolean} [options.autoStart=true]
     * @param {boolean} [options.headless=false]
     */
    constructor(options = {}) {
      this.options = options;
      this.eventBus = options.eventBus || null;
      this.mascotElement = options.mascotElement || null;
      this.backgroundImageUrl = options.backgroundImageUrl || "assets/main_scene.png";
      this.isHeadless = Boolean(options.headless || typeof window === "undefined");
      this.width = typeof window !== "undefined" ? window.innerWidth : 1024;
      this.height = typeof window !== "undefined" ? window.innerHeight : 768;
      this.scaleFactor = 1.08;
      this.normX = 0;
      this.normY = 0;
      this.currentX = 0;
      this.currentY = 0;
      this.targetX = 0;
      this.targetY = 0;
      this.lastTime = 0;
      this.feverActive = false;
      this.feverMultiplier = 1;
      this.ambientParticleEngine = new ParticleEngine({
        width: this.width,
        height: this.height,
        maxAmbient: 50
      });
      this.projectiles = new BezierProjectiles({
        particleEngine: this.ambientParticleEngine,
        mascotElement: this.mascotElement,
        eventBus: this.eventBus
      });
      this.container = null;
      this.parallaxCanvas = null;
      this.parallaxCtx = null;
      this.ambientCanvas = null;
      this.ambientCtx = null;
      this.feverOverlay = null;
      this.projectileCanvas = null;
      this.projectileCtx = null;
      this.backgroundImage = null;
      this.isImageLoaded = false;
      this.rafId = null;
      this.isRunning = false;
      this.unsubscribers = [];
      this._onMouseMove = this.handleMouseMove.bind(this);
      this._onMouseLeave = this.handleMouseLeave.bind(this);
      this._onResize = this.handleResize.bind(this);
      this._loop = this.loop.bind(this);
      if (!this.isHeadless) {
        this.initDom();
        this.initBackground();
        injectStickerFilter();
      }
      if (this.eventBus) {
        this.bindEvents(this.eventBus);
      }
      if (options.autoStart && !this.isHeadless) {
        this.start();
      }
    }
    /**
     * Builds or mounts required DOM canvases and layers
     */
    initDom() {
      if (typeof document === "undefined") return;
      let containerEl = null;
      if (typeof this.options.container === "string") {
        containerEl = document.querySelector(this.options.container);
      } else if (this.options.container && this.options.container.nodeType) {
        containerEl = this.options.container;
      }
      if (!containerEl) {
        containerEl = document.getElementById("live-scene-container");
        if (!containerEl) {
          containerEl = document.createElement("div");
          containerEl.id = "live-scene-container";
          containerEl.className = "live-scene-container";
          document.body.insertBefore(containerEl, document.body.firstChild);
        }
      }
      this.container = containerEl;
      this.parallaxCanvas = this.container.querySelector("#parallax-canvas");
      if (!this.parallaxCanvas) {
        this.parallaxCanvas = document.createElement("canvas");
        this.parallaxCanvas.id = "parallax-canvas";
        this.parallaxCanvas.className = "parallax-canvas";
        this.container.appendChild(this.parallaxCanvas);
      }
      this.parallaxCtx = this.parallaxCanvas.getContext("2d");
      this.ambientCanvas = this.container.querySelector("#ambient-particles-canvas");
      if (!this.ambientCanvas) {
        this.ambientCanvas = document.createElement("canvas");
        this.ambientCanvas.id = "ambient-particles-canvas";
        this.ambientCanvas.className = "ambient-particles-canvas";
        this.container.appendChild(this.ambientCanvas);
      }
      this.ambientCtx = this.ambientCanvas.getContext("2d");
      this.feverOverlay = this.container.querySelector("#fever-lighting-overlay");
      if (!this.feverOverlay) {
        this.feverOverlay = document.createElement("div");
        this.feverOverlay.id = "fever-lighting-overlay";
        this.feverOverlay.className = "fever-lighting-overlay";
        this.container.appendChild(this.feverOverlay);
      }
      this.projectileCanvas = document.getElementById("projectile-vfx-canvas");
      if (!this.projectileCanvas) {
        this.projectileCanvas = document.createElement("canvas");
        this.projectileCanvas.id = "projectile-vfx-canvas";
        this.projectileCanvas.className = "projectile-vfx-canvas";
        document.body.appendChild(this.projectileCanvas);
      }
      this.projectileCtx = this.projectileCanvas.getContext("2d");
      this.handleResize();
      window.addEventListener("mousemove", this._onMouseMove, { passive: true });
      window.addEventListener("mouseleave", this._onMouseLeave, { passive: true });
      window.addEventListener("resize", this._onResize, { passive: true });
    }
    /**
     * Loads background image for parallax canvas
     */
    initBackground() {
      if (typeof Image === "undefined") return;
      const img = new Image();
      img.src = this.backgroundImageUrl;
      img.onload = () => {
        this.backgroundImage = img;
        this.isImageLoaded = true;
      };
      img.onerror = () => {
        if (this.backgroundImageUrl !== "Sprites/Main Scene.png") {
          img.src = "Sprites/Main Scene.png";
        }
      };
    }
    /**
     * Binds EventBus listeners
     * @param {import('../core/EventBus.js').EventBus} bus
     */
    bindEvents(bus) {
      if (!bus || typeof bus.on !== "function") return;
      const unsubFever = bus.on("FEVER_MODE_CHANGED", (payload) => {
        this.setFeverMode(payload && payload.isActive, payload ? payload.multiplier : 1);
      });
      this.unsubscribers.push(unsubFever);
      const unsubLevel = bus.on("LEVEL_COMPLETED", () => {
        this.triggerConfetti();
      });
      this.unsubscribers.push(unsubLevel);
    }
    /**
     * Sets or clears fever mode lighting and particle intensity
     * @param {boolean} isActive
     * @param {number} [multiplier=2.0]
     */
    setFeverMode(isActive, multiplier = 2) {
      this.feverActive = Boolean(isActive);
      this.feverMultiplier = this.feverActive ? Math.max(1, Number(multiplier) || 2) : 1;
      if (this.feverOverlay) {
        if (this.feverActive) {
          this.feverOverlay.classList.add("active");
          if (this.container) this.container.classList.add("fever-active");
        } else {
          this.feverOverlay.classList.remove("active");
          if (this.container) this.container.classList.remove("fever-active");
        }
      }
      this.ambientParticleEngine.setFeverMode(this.feverActive, this.feverMultiplier);
    }
    /**
     * Handles mouse motion across the viewport
     * @param {MouseEvent|{ clientX: number, clientY: number }} e
     */
    handleMouseMove(e) {
      if (!e) return;
      const clientX = e.clientX || 0;
      const clientY = e.clientY || 0;
      this.normX = clientX / this.width * 2 - 1;
      this.normY = clientY / this.height * 2 - 1;
    }
    /**
     * Gracefully re-centers parallax when mouse exits window
     */
    handleMouseLeave() {
      this.normX = 0;
      this.normY = 0;
    }
    /**
     * Updates canvas buffers upon viewport resize
     */
    handleResize() {
      if (typeof window === "undefined") return;
      this.width = window.innerWidth;
      this.height = window.innerHeight;
      const dpr = window.devicePixelRatio || 1;
      [this.parallaxCanvas, this.ambientCanvas, this.projectileCanvas].forEach((canvas) => {
        if (!canvas) return;
        canvas.width = Math.floor(this.width * dpr);
        canvas.height = Math.floor(this.height * dpr);
        canvas.style.width = `${this.width}px`;
        canvas.style.height = `${this.height}px`;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.resetTransform();
          ctx.scale(dpr, dpr);
        }
      });
      this.ambientParticleEngine.resize(this.width, this.height);
    }
    /**
     * Triggers screen celebration confetti
     * @param {number} [x]
     * @param {number} [y]
     * @param {number} [count=45]
     */
    triggerConfetti(x, y, count = 45) {
      const targetX = x !== void 0 ? x : this.width / 2;
      const targetY = y !== void 0 ? y : this.height * 0.45;
      this.ambientParticleEngine.spawnConfetti(targetX, targetY, count);
    }
    /**
     * Starts the animation loop
     */
    start() {
      if (this.isRunning) return;
      this.isRunning = true;
      this.lastTime = typeof performance !== "undefined" ? performance.now() : Date.now();
      this.loop(this.lastTime);
    }
    /**
     * Stops the animation loop
     */
    stop() {
      this.isRunning = false;
      if (this.rafId && typeof cancelAnimationFrame === "function") {
        cancelAnimationFrame(this.rafId);
        this.rafId = null;
      }
    }
    /**
     * Main render/update loop
     * @param {number} now
     */
    loop(now) {
      if (!this.isRunning) return;
      const dt = (now - (this.lastTime || now)) / 1e3;
      this.lastTime = now;
      this.update(dt, now);
      this.render();
      if (typeof requestAnimationFrame === "function") {
        this.rafId = requestAnimationFrame(this._loop);
      }
    }
    /**
     * Updates parallax physics, particles, and projectiles
     * 
     * @param {number} dt
     * @param {number} [now]
     */
    update(dt, now) {
      const timeMs = now !== void 0 ? now : typeof performance !== "undefined" ? performance.now() : Date.now();
      const { nextX, nextY, targetX, targetY } = calculateParallaxOffset(
        this.normX,
        this.normY,
        timeMs,
        this.width,
        this.height,
        this.currentX,
        this.currentY,
        dt,
        this.scaleFactor
      );
      this.targetX = targetX;
      this.targetY = targetY;
      this.currentX = nextX;
      this.currentY = nextY;
      this.ambientParticleEngine.update(dt);
      this.projectiles.update(dt);
    }
    /**
     * Renders all layers to their respective canvases
     */
    render() {
      if (this.parallaxCtx) {
        this.renderParallax(this.parallaxCtx);
      }
      if (this.ambientCtx) {
        this.ambientCtx.clearRect(0, 0, this.width, this.height);
        this.ambientParticleEngine.render(this.ambientCtx);
      }
      if (this.projectileCtx) {
        this.projectileCtx.clearRect(0, 0, this.width, this.height);
        this.projectiles.render(this.projectileCtx);
      }
    }
    /**
     * Draws the smooth parallax background image
     * @param {CanvasRenderingContext2D} ctx
     */
    renderParallax(ctx) {
      ctx.clearRect(0, 0, this.width, this.height);
      if (this.isImageLoaded && this.backgroundImage) {
        const renderW = this.width * this.scaleFactor;
        const renderH = this.height * this.scaleFactor;
        const drawX = (this.width - renderW) / 2 + this.currentX;
        const drawY = (this.height - renderH) / 2 + this.currentY;
        ctx.drawImage(this.backgroundImage, drawX, drawY, renderW, renderH);
      } else {
        const grad = ctx.createLinearGradient(0, 0, 0, this.height);
        grad.addColorStop(0, "#1a1d36");
        grad.addColorStop(0.5, "#2e3860");
        grad.addColorStop(1, "#1e2440");
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, this.width, this.height);
      }
    }
    /**
     * Cleans up all DOM nodes, listeners, and timers
     */
    dispose() {
      this.stop();
      if (typeof window !== "undefined") {
        window.removeEventListener("mousemove", this._onMouseMove);
        window.removeEventListener("mouseleave", this._onMouseLeave);
        window.removeEventListener("resize", this._onResize);
      }
      while (this.unsubscribers.length > 0) {
        const unsub = this.unsubscribers.pop();
        try {
          if (typeof unsub === "function") unsub();
        } catch (_) {
        }
      }
      if (this.ambientParticleEngine) this.ambientParticleEngine.dispose();
      if (this.projectiles) this.projectiles.dispose();
      if (this.container && this.container.parentNode && !this.options.container) {
        this.container.parentNode.removeChild(this.container);
      }
      if (this.projectileCanvas && this.projectileCanvas.parentNode) {
        this.projectileCanvas.parentNode.removeChild(this.projectileCanvas);
      }
    }
  };

  // src/mascot/MascotAnimator.js
  var MascotAnimator = class {
    /**
     * @param {Object} [options]
     * @param {HTMLElement} [options.element=null] Target DOM element for transforms
     * @param {Object} [options.eventBus=null] EventBus instance for automatic event subscriptions
     * @param {number} [options.breathingPeriod=2.6] Resting breathing cycle period in seconds
     * @param {number} [options.breathingAmplitude=4.0] Peak vertical breathing translation in pixels
     * @param {number} [options.breathingScaleAmp=0.02] Peak scale oscillation
     * @param {number} [options.maxTiltDeg=4.0] Maximum look-at angular tilt in degrees
     * @param {number} [options.tiltResponsiveness=8.0] Exponential decay smoothing rate for tilt
     * @param {number} [options.referenceCenterX=null] Center X coordinate for keyboard look-at calculation
     * @param {number} [options.referenceHalfWidth=350] Expected half-width of keyboard spread
     */
    constructor(options = {}) {
      this.element = options.element || null;
      this.eventBus = options.eventBus || null;
      this.breathingPeriod = options.breathingPeriod || 2.6;
      this.breathingAmplitude = options.breathingAmplitude !== void 0 ? options.breathingAmplitude : 4;
      this.breathingScaleAmp = options.breathingScaleAmp !== void 0 ? options.breathingScaleAmp : 0.02;
      this.maxTiltDeg = options.maxTiltDeg !== void 0 ? options.maxTiltDeg : 0;
      this.tiltResponsiveness = options.tiltResponsiveness || 8;
      this.referenceCenterX = options.referenceCenterX || null;
      this.referenceHalfWidth = options.referenceHalfWidth || 350;
      this._time = 0;
      this._currentTiltDeg = 0;
      this._targetTiltDeg = 0;
      this._currentYBreath = 0;
      this._currentScaleY = 1;
      this._currentScaleX = 1;
      this._hopVelocity = 0;
      this._hopY = 0;
      this._gravity = 650;
      this._isHopping = false;
      this._isRunning = false;
      this._rafId = null;
      this._lastTimestamp = 0;
      this._unsubscribers = [];
      if (this.eventBus) {
        this._setupListeners();
      }
    }
    /**
     * Bind or change the target DOM element.
     * @param {HTMLElement|null} el
     */
    bindElement(el) {
      this.element = el;
      if (this.element && this.element.style) {
        this.element.style.transformOrigin = "50% 85%";
      }
    }
    /**
     * Register EventBus listeners for target key updates and combos.
     * @private
     */
    _setupListeners() {
      if (!this.eventBus || typeof this.eventBus.on !== "function") return;
      const unsubTarget = this.eventBus.on("KEY_TARGET_CHANGED", (payload) => {
        if (payload && payload.screenPosition) {
          this.setTargetKeyPosition(payload.screenPosition);
        }
      });
      this._unsubscribers.push(unsubTarget);
      const unsubSuccess = this.eventBus.on("KEY_PRESSED_SUCCESS", (payload) => {
        if (payload && typeof payload.comboCount === "number") {
          this.triggerHop(payload.comboCount);
        }
      });
      this._unsubscribers.push(unsubSuccess);
    }
    /**
     * Update look-at target angle based on screen coordinate of expected key.
     * @param {{ x: number, y?: number }} screenPosition
     */
    setTargetKeyPosition(screenPosition) {
      if (!screenPosition || typeof screenPosition.x !== "number") return;
      let centerX = this.referenceCenterX;
      if (centerX === null) {
        if (typeof window !== "undefined" && window.innerWidth) {
          centerX = window.innerWidth / 2;
        } else {
          centerX = 500;
        }
      }
      const deltaX = screenPosition.x - centerX;
      const ratio = Math.max(-1, Math.min(1, deltaX / this.referenceHalfWidth));
      this._targetTiltDeg = ratio * this.maxTiltDeg;
    }
    /**
     * Directly set target tilt in degrees (clamped to [-maxTiltDeg, +maxTiltDeg]).
     * @param {number} degrees
     */
    setTargetTilt(degrees) {
      const d = Number(degrees) || 0;
      this._targetTiltDeg = Math.max(-this.maxTiltDeg, Math.min(this.maxTiltDeg, d));
    }
    /**
     * Trigger a procedural hop/jump based on combo count.
     * - Combo multiples of 5: Power jump (higher impulse)
     * - Combo >= 3 or single hits: Micro hop
     * @param {number} comboCount
     */
    triggerHop(comboCount = 1) {
      const combo = Math.max(1, Number(comboCount) || 1);
      if (combo % 5 === 0) {
        this._hopVelocity = -220;
        this._isHopping = true;
      } else if (combo >= 3) {
        this._hopVelocity = -120;
        this._isHopping = true;
      } else {
        this._hopVelocity = -75;
        this._isHopping = true;
      }
    }
    /**
     * Step the procedural simulation by delta time in milliseconds.
     * Uses fixed sub-stepping to guarantee physical stability without truncating time.
     * @param {number} deltaTimeMs
     */
    update(deltaTimeMs) {
      const totalDt = Math.max(0, Math.min(2e3, deltaTimeMs)) / 1e3;
      const maxSubStep = 0.05;
      let remaining = totalDt;
      while (remaining > 0) {
        const dt = Math.min(maxSubStep, remaining);
        this._time += dt;
        const angularFreq = 2 * Math.PI / this.breathingPeriod;
        this._currentYBreath = this.breathingAmplitude * Math.sin(angularFreq * this._time);
        const scaleYOffset = this.breathingScaleAmp * Math.sin(angularFreq * this._time - Math.PI / 4);
        this._currentScaleY = 1 + scaleYOffset;
        this._currentScaleX = 1 / this._currentScaleY;
        const decayFactor = 1 - Math.exp(-this.tiltResponsiveness * dt);
        this._currentTiltDeg += (this._targetTiltDeg - this._currentTiltDeg) * decayFactor;
        if (this._isHopping) {
          this._hopVelocity += this._gravity * dt;
          this._hopY += this._hopVelocity * dt;
          if (this._hopY >= 0) {
            this._hopY = 0;
            this._hopVelocity = 0;
            this._isHopping = false;
          }
        }
        remaining -= dt;
      }
      if (this.element && this.element.style) {
        const state = this.getTransformState();
        this.element.style.transform = state.transformString;
      }
    }
    /**
     * Get current transform matrix / values for inspection, rendering, or testing.
     * @returns {{
     *   translateY: number,
     *   rotateDeg: number,
     *   scaleX: number,
     *   scaleY: number,
     *   hopY: number,
     *   breathY: number,
     *   transformString: string,
     *   isHopping: boolean
     * }}
     */
    getTransformState() {
      const totalY = this._currentYBreath + this._hopY;
      const rotate = this._currentTiltDeg;
      const sx = this._currentScaleX;
      const sy = this._currentScaleY;
      const transformString = `translateY(${totalY.toFixed(2)}px) rotate(${rotate.toFixed(2)}deg) scale(${sx.toFixed(3)}, ${sy.toFixed(3)})`;
      return {
        translateY: Number(totalY.toFixed(2)),
        rotateDeg: Number(rotate.toFixed(2)),
        scaleX: Number(sx.toFixed(3)),
        scaleY: Number(sy.toFixed(3)),
        hopY: Number(this._hopY.toFixed(2)),
        breathY: Number(this._currentYBreath.toFixed(2)),
        transformString,
        isHopping: this._isHopping
      };
    }
    /**
     * Start autonomous requestAnimationFrame render loop (browser environment).
     */
    start() {
      if (this._isRunning) return;
      this._isRunning = true;
      this._lastTimestamp = typeof performance !== "undefined" && performance.now ? performance.now() : Date.now();
      const loop = (timestamp) => {
        if (!this._isRunning) return;
        const now = timestamp || (typeof performance !== "undefined" && performance.now ? performance.now() : Date.now());
        const delta = now - this._lastTimestamp;
        this._lastTimestamp = now;
        this.update(delta);
        if (typeof requestAnimationFrame === "function") {
          this._rafId = requestAnimationFrame(loop);
        }
      };
      if (typeof requestAnimationFrame === "function") {
        this._rafId = requestAnimationFrame(loop);
      }
    }
    /**
     * Stop autonomous animation loop.
     */
    stop() {
      this._isRunning = false;
      if (this._rafId && typeof cancelAnimationFrame === "function") {
        cancelAnimationFrame(this._rafId);
        this._rafId = null;
      }
    }
    /**
     * Reset simulation state back to zero / rest.
     */
    reset() {
      this._time = 0;
      this._currentTiltDeg = 0;
      this._targetTiltDeg = 0;
      this._currentYBreath = 0;
      this._currentScaleY = 1;
      this._currentScaleX = 1;
      this._hopVelocity = 0;
      this._hopY = 0;
      this._isHopping = false;
    }
    /**
     * Teardown and unsubscribe from all events.
     */
    destroy() {
      this.stop();
      for (const unsub of this._unsubscribers) {
        if (typeof unsub === "function") unsub();
      }
      this._unsubscribers = [];
      this.element = null;
    }
  };

  // src/mascot/MascotPhrases.js
  var PHRASE_CATEGORIES = Object.freeze({
    POSTURE: "posture",
    HOME_ROW: "home_row",
    TECHNIQUE: "technique",
    ANTI_FRUSTRATION: "anti_frustration",
    BREAKS: "breaks",
    STREAKS: "streaks",
    STUCK: "stuck",
    VICTORY: "victory",
    GREETINGS: "greetings"
  });
  var POSTURE_TIPS = Object.freeze([
    {
      id: "posture-1",
      category: "posture",
      categoryLabel: "Postura y Ergonom\xEDa",
      icon: "\u{1F9D8}",
      title: "Espalda como un rey",
      text: "Si\xE9ntate derecho apoyando la espalda en el respaldo de tu silla, \xA1como un rey o reina en su trono!",
      speechText: "Si\xE9ntate derecho apoyando la espalda en el respaldo de tu silla, como un rey o una reina en su trono."
    },
    {
      id: "posture-2",
      category: "posture",
      categoryLabel: "Postura y Ergonom\xEDa",
      icon: "\u{1F333}",
      title: "Pies como ra\xEDces",
      text: "Apoya ambos pies planos en el suelo para mantener un equilibrio firme y seguro.",
      speechText: "Apoya ambos pies planos en el suelo para mantener un equilibrio firme y seguro."
    },
    {
      id: "posture-3",
      category: "posture",
      categoryLabel: "Postura y Ergonom\xEDa",
      icon: "\u2601\uFE0F",
      title: "Mu\xF1ecas flotantes",
      text: "No apoyes las mu\xF1ecas en la mesa ni en el teclado; d\xE9jalas flotar en el aire como nubes suaves.",
      speechText: "No apoyes las mu\xF1ecas en la mesa ni en el teclado; d\xE9jalas flotar en el aire como nubes suaves."
    },
    {
      id: "posture-4",
      category: "posture",
      categoryLabel: "Postura y Ergonom\xEDa",
      icon: "\u{1F431}",
      title: "Garras de gatito",
      text: "Curva tus dedos suavemente sobre las teclas, como si sujetaras una manzana o una pompa de jab\xF3n.",
      speechText: "Curva tus dedos suavemente sobre las teclas, como si sujetaras una manzana sin romperla."
    },
    {
      id: "posture-5",
      category: "posture",
      categoryLabel: "Postura y Ergonom\xEDa",
      icon: "\u{1F4D0}",
      title: "Regla de los 90 grados",
      text: "Tus codos y tus rodillas deben doblarse en un \xE1ngulo recto bien c\xF3modo y natural.",
      speechText: "Tus codos y tus rodillas deben doblarse en un \xE1ngulo recto bien c\xF3modo y natural."
    },
    {
      id: "posture-6",
      category: "posture",
      categoryLabel: "Postura y Ergonom\xEDa",
      icon: "\u{1F440}",
      title: "Ojos a distancia",
      text: "Coloca la pantalla a la altura de tus ojos y a la distancia de tu brazo estirado.",
      speechText: "Coloca la pantalla a la altura de tus ojos y a la distancia de tu brazo estirado."
    },
    {
      id: "posture-7",
      category: "posture",
      categoryLabel: "Postura y Ergonom\xEDa",
      icon: "\u{1F388}",
      title: "Hombros ligeros",
      text: "Relaja los hombros y suelta la tensi\xF3n; teclear relajado es m\xE1s r\xE1pido y divertido.",
      speechText: "Relaja los hombros y suelta la tensi\xF3n; teclear relajado es m\xE1s r\xE1pido y divertido."
    },
    {
      id: "posture-8",
      category: "posture",
      categoryLabel: "Postura y Ergonom\xEDa",
      icon: "\u{1F56F}\uFE0F",
      title: "Buena luz",
      text: "Aseg\xFArate de jugar en un espacio con buena luz para que tu vista no se fatigue.",
      speechText: "Aseg\xFArate de jugar en un espacio con buena luz para que tu vista no se fatigue."
    }
  ]);
  var HOME_ROW_TIPS = Object.freeze([
    {
      id: "home-1",
      category: "home_row",
      categoryLabel: "Campamento Base",
      icon: "\u{1F3E0}",
      title: "Campamento base",
      text: "Tus dedos siempre descansan en la fila central: [A] [S] [D] [F] con la izquierda y [J] [K] [L] [\xD1] con la derecha.",
      speechText: "Tus dedos siempre descansan en la fila central: A S D F con la izquierda y J K L E\xD1E con la derecha."
    },
    {
      id: "home-2",
      category: "home_row",
      categoryLabel: "Campamento Base",
      icon: "\u26F0\uFE0F",
      title: "Las monta\xF1itas secretas",
      text: "Las teclas [F] y [J] tienen dos peque\xF1as marcas t\xE1ctiles para que tus \xEDndices las encuentren sin mirar.",
      speechText: "Las teclas F y J tienen dos peque\xF1as marcas t\xE1ctiles para que tus \xEDndices las encuentren sin mirar."
    },
    {
      id: "home-3",
      category: "home_row",
      categoryLabel: "Campamento Base",
      icon: "\u{1F451}",
      title: "Reyes del espacio",
      text: "Usa siempre cualquiera de tus dos pulgares para pulsar la [Barra Espaciadora].",
      speechText: "Usa siempre cualquiera de tus dos pulgares para pulsar la barra espaciadora."
    },
    {
      id: "home-4",
      category: "home_row",
      categoryLabel: "Campamento Base",
      icon: "\u{1F6E1}\uFE0F",
      title: "Me\xF1iques guardianes",
      text: "El dedo me\xF1ique es peque\xF1o pero fuerte: vigila la [A], la [\xD1], [Intro] y la tecla [May\xFAs].",
      speechText: "El dedo me\xF1ique es peque\xF1o pero fuerte: vigila la A, la E\xD1E, Intro y la tecla May\xFAsculas."
    },
    {
      id: "home-5",
      category: "home_row",
      categoryLabel: "Campamento Base",
      icon: "\u{1F91D}",
      title: "Cada dedo en su casa",
      text: "No le robes el trabajo a tus dedos vecinos; cada dedo tiene su propio grupo de teclas asignadas.",
      speechText: "No le robes el trabajo a tus dedos vecinos; cada dedo tiene su propio grupo de teclas asignadas."
    },
    {
      id: "home-6",
      category: "home_row",
      categoryLabel: "Campamento Base",
      icon: "\u{1F3E1}",
      title: "Vuelve siempre a casa",
      text: "Despu\xE9s de estirar un dedo para pulsar una tecla lejana, devu\xE9lvelo enseguida a la fila gu\xEDa.",
      speechText: "Despu\xE9s de estirar un dedo para pulsar una tecla lejana, devu\xE9lvelo enseguida a la fila gu\xEDa."
    },
    {
      id: "home-7",
      category: "home_row",
      categoryLabel: "Campamento Base",
      icon: "\u{1F49B}",
      title: "Coraz\xF3n centinela",
      text: "El dedo coraz\xF3n izquierdo cuida la [E], la [D] y la [C]; y el derecho cuida la [I], la [K] y la coma.",
      speechText: "El dedo coraz\xF3n izquierdo cuida la E, la D y la C; y el derecho cuida la I, la K y la coma."
    },
    {
      id: "home-8",
      category: "home_row",
      categoryLabel: "Campamento Base",
      icon: "\u{1F9E1}",
      title: "Anular equilibrista",
      text: "El dedo anular izquierdo viaja por la [W], la [S] y la [X]; y el derecho por la [O], la [L] y el punto.",
      speechText: "El dedo anular izquierdo viaja por la W, la S y la X; y el derecho por la O, la L y el punto."
    }
  ]);
  var TECHNIQUE_TIPS = Object.freeze([
    {
      id: "tech-1",
      category: "technique",
      categoryLabel: "T\xE9cnica al Tacto",
      icon: "\u{1F441}\uFE0F",
      title: "Ojos en la pantalla",
      text: "Tus ojos son exploradores y tus dedos constructores. \xA1Conf\xEDa en tus manos sin mirar hacia abajo!",
      speechText: "Tus ojos son exploradores y tus dedos constructores. Conf\xEDa en tus manos sin mirar hacia abajo."
    },
    {
      id: "tech-2",
      category: "technique",
      categoryLabel: "T\xE9cnica al Tacto",
      icon: "\u{1F3B5}",
      title: "Ritmo constante",
      text: "M\xE1s vale escribir a un comp\xE1s constante y suave que correr y tropezar: \xA1tan, tan, tan!",
      speechText: "M\xE1s vale escribir a un comp\xE1s constante y suave que correr y tropezar: ritmo tan, tan, tan."
    },
    {
      id: "tech-3",
      category: "technique",
      categoryLabel: "T\xE9cnica al Tacto",
      icon: "\u{1F327}\uFE0F",
      title: "Gotas de lluvia",
      text: "Toca las teclas con suavidad como gotas de lluvia sobre una hoja; no hace falta martillear con fuerza.",
      speechText: "Toca las teclas con suavidad como gotas de lluvia sobre una hoja; no hace falta martillear con fuerza."
    },
    {
      id: "tech-4",
      category: "technique",
      categoryLabel: "T\xE9cnica al Tacto",
      icon: "\u{1F5E3}\uFE0F",
      title: "Pronuncia en voz baja",
      text: "Si dices la letra o s\xEDlaba en voz bajita al pulsarla, tus dedos la memorizar\xE1n el doble de r\xE1pido.",
      speechText: "Si dices la letra o s\xEDlaba en voz bajita al pulsarla, tus dedos la memorizar\xE1n el doble de r\xE1pido."
    },
    {
      id: "tech-5",
      category: "technique",
      categoryLabel: "T\xE9cnica al Tacto",
      icon: "\u{1F3AF}",
      title: "Primero punter\xEDa",
      text: "La rapidez llega sola con la pr\xE1ctica si primero aseguras el dedo y la tecla correctos.",
      speechText: "La rapidez llega sola con la pr\xE1ctica si primero aseguras el dedo y la tecla correctos."
    },
    {
      id: "tech-6",
      category: "technique",
      categoryLabel: "T\xE9cnica al Tacto",
      icon: "\u26A1",
      title: "Toque de pluma",
      text: "No aprietes las teclas hasta el fondo; dale un toquecito \xE1gil y suelta enseguida.",
      speechText: "No aprietes las teclas hasta el fondo; dale un toquecito \xE1gil y suelta enseguida."
    },
    {
      id: "tech-7",
      category: "technique",
      categoryLabel: "T\xE9cnica al Tacto",
      icon: "\u{1F9ED}",
      title: "Br\xFAjula t\xE1ctil",
      text: "Si sientes que te has perdido, desliza tus \xEDndices hasta sentir las marquitas de la [F] y la [J].",
      speechText: "Si sientes que te has perdido, desliza tus \xEDndices hasta sentir las marquitas de la F y la J."
    },
    {
      id: "tech-8",
      category: "technique",
      categoryLabel: "T\xE9cnica al Tacto",
      icon: "\u{1F3B9}",
      title: "Manos de pianista",
      text: "Tocar el teclado es como tocar el piano: cada dedo tiene su tecla y su propio turno.",
      speechText: "Tocar el teclado es como tocar el piano: cada dedo tiene su tecla y su propio turno."
    }
  ]);
  var ANTI_FRUSTRATION_TIPS = Object.freeze([
    {
      id: "anti-1",
      category: "anti_frustration",
      categoryLabel: "\xC1nimo y Paciencia",
      icon: "\u{1F9E9}",
      title: "Los errores son pistas",
      text: "Equivocarse es el truco secreto del cerebro para saber qu\xE9 tecla necesita un poco m\xE1s de cari\xF1o.",
      speechText: "Equivocarse es el truco secreto del cerebro para saber qu\xE9 tecla necesita un poco m\xE1s de cari\xF1o."
    },
    {
      id: "anti-2",
      category: "anti_frustration",
      categoryLabel: "\xC1nimo y Paciencia",
      icon: "\u{1F409}",
      title: "Respiraci\xF3n de drag\xF3n",
      text: "Si una tecla se te resiste, respira hondo como un drag\xF3n sabio y vuelve a intentarlo con calma.",
      speechText: "Si una tecla se te resiste, respira hondo como un drag\xF3n sabio y vuelve a intentarlo con calma."
    },
    {
      id: "anti-3",
      category: "anti_frustration",
      categoryLabel: "\xC1nimo y Paciencia",
      icon: "\u{1F6B2}",
      title: "Como montar en bici",
      text: "Al principio hay que prestar mucha atenci\xF3n, pero muy pronto tus dedos volar\xE1n solos sin pensarlo.",
      speechText: "Al principio hay que prestar mucha atenci\xF3n, pero muy pronto tus dedos volar\xE1n solos sin pensarlo."
    },
    {
      id: "anti-4",
      category: "anti_frustration",
      categoryLabel: "\xC1nimo y Paciencia",
      icon: "\u2728",
      title: "Magia de 5 minutos",
      text: "Jugar un ratito corto cada d\xEDa entrena la memoria muscular de tus manos para toda la vida.",
      speechText: "Jugar un ratito corto cada d\xEDa entrena la memoria muscular de tus manos para toda la vida."
    },
    {
      id: "anti-5",
      category: "anti_frustration",
      categoryLabel: "\xC1nimo y Paciencia",
      icon: "\u{1F3C6}",
      title: "Campe\xF3n sin prisa",
      text: "Aqu\xED no hay prisa ni vidas que perder; cada acierto es un superpoder nuevo para tus dedos.",
      speechText: "Aqu\xED no hay prisa ni vidas que perder; cada acierto es un superpoder nuevo para tus dedos."
    },
    {
      id: "anti-6",
      category: "anti_frustration",
      categoryLabel: "\xC1nimo y Paciencia",
      icon: "\u{1F496}",
      title: "Paciencia y cari\xF1o",
      text: "Trata con cari\xF1o a tus deditos; est\xE1n aprendiendo un baile nuevo y lo est\xE1n haciendo genial.",
      speechText: "Trata con cari\xF1o a tus deditos; est\xE1n aprendiendo un baile nuevo y lo est\xE1n haciendo genial."
    },
    {
      id: "anti-7",
      category: "anti_frustration",
      categoryLabel: "\xC1nimo y Paciencia",
      icon: "\u{1F31F}",
      title: "Paso a pasito",
      text: "Nadie nace sabiendo escribir sin mirar. \xA1Con cada nivel est\xE1s m\xE1s cerca de ser un maestro!",
      speechText: "Nadie nace sabiendo escribir sin mirar. Con cada nivel est\xE1s m\xE1s cerca de ser un maestro."
    }
  ]);
  var BREAK_EXERCISES = Object.freeze([
    {
      id: "break-1",
      category: "breaks",
      categoryLabel: "Pausa Activa",
      icon: "\u2B50",
      title: "Estrellitas fugaces",
      text: "Abre y cierra las manos 5 veces bien abiertas, como estrellitas parpadeando en el cielo.",
      speechText: "Abre y cierra las manos cinco veces bien abiertas, como estrellitas parpadeando en el cielo."
    },
    {
      id: "break-2",
      category: "breaks",
      categoryLabel: "Pausa Activa",
      icon: "\u{1F963}",
      title: "Sopa m\xE1gica",
      text: "Gira las mu\xF1ecas suavemente en c\xEDrculos en el aire como si revolvieras una p\xF3cima m\xE1gica.",
      speechText: "Gira las mu\xF1ecas suavemente en c\xEDrculos en el aire como si revolvieras una p\xF3cima m\xE1gica."
    },
    {
      id: "break-3",
      category: "breaks",
      categoryLabel: "Pausa Activa",
      icon: "\u{1F4A6}",
      title: "Sacudir gotas",
      text: "Sacude las manos flojitas hacia abajo como si te secaras gotitas de agua de lluvia.",
      speechText: "Sacude las manos flojitas hacia abajo como si te secaras gotitas de agua de lluvia."
    },
    {
      id: "break-4",
      category: "breaks",
      categoryLabel: "Pausa Activa",
      icon: "\u{1F522}",
      title: "Baile de dedos",
      text: "Toca la punta de tu pulgar con cada dedo uno a uno: \xEDndice, coraz\xF3n, anular y me\xF1ique. \xA11, 2, 3, 4!",
      speechText: "Toca la punta de tu pulgar con cada dedo uno a uno: \xEDndice, coraz\xF3n, anular y me\xF1ique. Uno, dos, tres, cuatro."
    },
    {
      id: "break-5",
      category: "breaks",
      categoryLabel: "Pausa Activa",
      icon: "\u{1F52D}",
      title: "Mirada al horizonte",
      text: "Mira por la ventana o a un rinc\xF3n lejano durante 10 segundos para que tus ojos descansen felices.",
      speechText: "Mira por la ventana o a un rinc\xF3n lejano durante diez segundos para que tus ojos descansen felices."
    },
    {
      id: "break-6",
      category: "breaks",
      categoryLabel: "Pausa Activa",
      icon: "\u{1F981}",
      title: "Bostezo de le\xF3n",
      text: "Estira los brazos hacia arriba bien alto, abre las manos y respira hondo como un le\xF3n contento.",
      speechText: "Estira los brazos hacia arriba bien alto, abre las manos y respira hondo como un le\xF3n contento."
    }
  ]);
  var ALL_PEDAGOGICAL_TIPS = Object.freeze([
    ...POSTURE_TIPS,
    ...HOME_ROW_TIPS,
    ...TECHNIQUE_TIPS,
    ...ANTI_FRUSTRATION_TIPS,
    ...BREAK_EXERCISES
  ]);
  var STREAK_CELEBRATIONS = Object.freeze([
    "\xA1Tus dedos tienen motores de cohete! \u{1F680} \xA1Menudo ritmo llevas!",
    "\xA1Vaya punter\xEDa de gran pianista! \u{1F3B9} \xA1La melod\xEDa de las teclas suena genial!",
    "\xA1Chispas de energ\xEDa m\xE1gica! \u26A1 \xA1Tus reflejos est\xE1n imparables!",
    "\xA1Nivel maestro! \u{1F31F} Campamento base dominado y dedos voladores.",
    "\xA1Modo Fiebre a tope! \u{1F525} \xA1Tus manos se mueven a la velocidad de la luz!",
    "\xA1Diana tras diana! \u{1F3AF} Escribir sin mirar ya es tu nuevo superpoder."
  ]);
  var STUCK_HINTS = Object.freeze([
    "Busca con tu \xEDndice la monta\xF1ita en la tecla para orientarte y pulsa la tecla que brilla.",
    "T\xF3mate tu tiempo: mira el color de la mano en pantalla y pulsa con suavidad.",
    "Respira hondo y relajado: tus deditos saben perfectamente d\xF3nde est\xE1 la tecla.",
    "Vuelve un segundo al campamento base y estira tu dedito hacia la tecla iluminada.",
    "\xA1Tranquilo, no hay prisa! En Mecano jugamos para divertirnos y aprender."
  ]);
  var LEVEL_VICTORY_PHRASES = Object.freeze([
    "\xA1Nivel superado con matr\xEDcula de honor! \u{1F3C6} \xA1Choca esos cinco pulsando [Espacio]!",
    "\xA1Misi\xF3n gal\xE1ctica completada! \u2B50 Pulsa [Espacio] para celebrar juntos.",
    "\xA1Brillante trabajo en equipo! \u{1F389} \xA1Choca esos cinco con la barra espaciadora!",
    "\xA1Un paso gigante hacia el siguiente cintur\xF3n! \u{1F94B} \xA1Pulsa [Espacio] para festejar!",
    "\xA1Tus dedos son los reyes del teclado! \u{1F451} \xA1Pulsa [Espacio] y bailemos de alegr\xEDa!"
  ]);
  var MASCOT_GREETINGS = Object.freeze([
    "\xA1Hola, campe\xF3n! Mis sensores dicen que hoy vas a conseguir tres estrellas relucientes.",
    "\xBFSab\xEDas que tus dedos aprenden mientras juegas? \xA1Es el superpoder de la memoria t\xE1ctil!",
    "\xA1Recuerda curvar tus dedos como si sostuvieras una manzana! \xA1T\xFA puedes con todo!",
    "\xA1Roby es tu fan n\xFAmero uno en toda la galaxia! \xA1A por la siguiente palabra!",
    "Si alguna tecla se te resiste, t\xF3mate un respiro; aqu\xED aprendemos sonriendo.",
    "\xA1Tus manos son m\xE1gicas! Cada d\xEDa que juegas, escribes con m\xE1s seguridad y ritmo."
  ]);
  var _tipCycleIndex = 0;
  function getNextPedagogicalTip() {
    const tip = ALL_PEDAGOGICAL_TIPS[_tipCycleIndex % ALL_PEDAGOGICAL_TIPS.length];
    _tipCycleIndex = (_tipCycleIndex + 1) % ALL_PEDAGOGICAL_TIPS.length;
    return tip;
  }
  function getRandomStreakPhrase() {
    return STREAK_CELEBRATIONS[Math.floor(Math.random() * STREAK_CELEBRATIONS.length)];
  }
  function getStuckHint(expectedKey = "", fingerName = "", colorName = "") {
    if (expectedKey) {
      const keyDisplay = expectedKey === " " ? "Espacio" : expectedKey.toUpperCase();
      const fingerPart = fingerName ? ` con tu ${fingerName}` : "";
      const colorPart = colorName ? ` (${colorName})` : "";
      if (expectedKey.toLowerCase() === "f") {
        return `\xA1Busca la monta\xF1ita secreta de la tecla [F] con tu \xEDndice izquierdo!`;
      }
      if (expectedKey.toLowerCase() === "j") {
        return `\xA1Busca la monta\xF1ita secreta de la tecla [J] con tu \xEDndice derecho!`;
      }
      if (expectedKey === " ") {
        return `\xA1Usa cualquiera de tus dos pulgares para pulsar la [Barra Espaciadora]!`;
      }
      const hints = [
        `\xA1Pulsa la tecla [${keyDisplay}]${fingerPart}${colorPart}!`,
        `\xA1Tranquilo! Lleva tu ${fingerName || "dedito"} a la tecla [${keyDisplay}]. \xA1T\xFA puedes!`,
        `Vuelve a casa un segundo y pulsa [${keyDisplay}]${fingerPart}.`
      ];
      return hints[Math.floor(Math.random() * hints.length)];
    }
    return STUCK_HINTS[Math.floor(Math.random() * STUCK_HINTS.length)];
  }
  function getVictoryPhrase() {
    return LEVEL_VICTORY_PHRASES[Math.floor(Math.random() * LEVEL_VICTORY_PHRASES.length)];
  }
  function getRandomGreeting() {
    return MASCOT_GREETINGS[Math.floor(Math.random() * MASCOT_GREETINGS.length)];
  }

  // src/mascot/MascotFSM.js
  var MascotFSM = class _MascotFSM {
    static STATES = Object.freeze({
      IDLE: "IDLE",
      FLOW_DANCE: "FLOW_DANCE",
      HELPER_POINTING: "HELPER_POINTING",
      SLEEPY: "SLEEPY",
      HIGH_FIVE_WAIT: "HIGH_FIVE_WAIT",
      CELEBRATING: "CELEBRATING"
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
      if (optionsOrBus && typeof optionsOrBus.on === "function") {
        bus = optionsOrBus;
      } else if (optionsOrBus && typeof optionsOrBus === "object") {
        options = optionsOrBus;
        bus = options.eventBus || null;
      }
      this.eventBus = bus;
      this.sleepTimeoutSec = options.sleepTimeoutSec || 25;
      this.onStateChange = options.onStateChange || null;
      this.state = _MascotFSM.STATES.IDLE;
      this.previousState = null;
      this.history = [this.state];
      this._idleSeconds = 0;
      this._inactivityInterval = null;
      this._unsubscribers = [];
      this.setupListeners();
    }
    /**
     * Set up EventBus listeners for gameplay events.
     */
    setupListeners() {
      if (!this.eventBus || typeof this.eventBus.on !== "function") return;
      const unsubStuck = this.eventBus.on("USER_STUCK", (payload) => {
        this.transitionTo(_MascotFSM.STATES.HELPER_POINTING);
        if (payload && payload.expectedKey) {
          const fingerMapNames = {
            lp: "dedo me\xF1ique izquierdo",
            lr: "dedo anular izquierdo",
            lm: "dedo coraz\xF3n izquierdo",
            li: "dedo \xEDndice izquierdo",
            ri: "dedo \xEDndice derecho",
            rm: "dedo coraz\xF3n derecho",
            rr: "dedo anular derecho",
            rp: "dedo me\xF1ique derecho",
            thumb: "dedo pulgar",
            "thumb-l": "dedo pulgar izquierdo",
            "thumb-r": "dedo pulgar derecho"
          };
          const fingerName = payload.fingerName || fingerMapNames[payload.finger] || "dedo indicado";
          const speech = getStuckHint(payload.expectedKey, fingerName, payload.colorName);
          this._dispatchSpeech(speech, "HIGH", "thinking");
        }
      });
      this._unsubscribers.push(unsubStuck);
      const unsubFever = this.eventBus.on("FEVER_MODE_CHANGED", (payload) => {
        if (payload && payload.isActive) {
          this.transitionTo(_MascotFSM.STATES.FLOW_DANCE);
          this._dispatchSpeech(getRandomStreakPhrase(), "NORMAL", "happy");
        } else if (this.state === _MascotFSM.STATES.FLOW_DANCE) {
          this.transitionTo(_MascotFSM.STATES.IDLE);
        }
      });
      this._unsubscribers.push(unsubFever);
      const unsubLevel = this.eventBus.on("LEVEL_COMPLETED", (_payload) => {
        this.transitionTo(_MascotFSM.STATES.HIGH_FIVE_WAIT);
        this._dispatchSpeech(getVictoryPhrase(), "CRITICAL", "victory");
      });
      this._unsubscribers.push(unsubLevel);
      const unsubFail = this.eventBus.on("KEY_PRESSED_FAIL", () => {
        this._idleSeconds = 0;
      });
      this._unsubscribers.push(unsubFail);
      const unsubSuccess = this.eventBus.on("KEY_PRESSED_SUCCESS", (payload) => {
        this._idleSeconds = 0;
        if (this.state === _MascotFSM.STATES.HELPER_POINTING) {
          this.transitionTo(_MascotFSM.STATES.IDLE);
        } else if (payload && payload.comboCount >= 8 && this.state === _MascotFSM.STATES.IDLE) {
          this.transitionTo(_MascotFSM.STATES.FLOW_DANCE);
        }
      });
      this._unsubscribers.push(unsubSuccess);
    }
    /**
     * Helper to dispatch speech events via EventBus if available.
     * @private
     */
    _dispatchSpeech(text, priority = "NORMAL", emotion = "happy") {
      if (this.eventBus && typeof this.eventBus.emit === "function") {
        try {
          this.eventBus.emit("MASCOT_SPEAK_REQUEST", {
            text,
            priority,
            emotion
          });
        } catch (err) {
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
      const validStates = Object.values(_MascotFSM.STATES);
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
      if (typeof this.onStateChange === "function") {
        try {
          this.onStateChange(newState, oldState);
        } catch (err) {
          console.error("[MascotFSM] Error in onStateChange callback:", err);
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
      if (this.state === _MascotFSM.STATES.SLEEPY) {
        this.transitionTo(_MascotFSM.STATES.IDLE);
        this._dispatchSpeech("\xA1Hola de nuevo! \xA1A escribir!", "NORMAL", "happy");
        return;
      }
      if (this.state === _MascotFSM.STATES.HIGH_FIVE_WAIT) {
        if (key === " " || key === "Space" || key === "Spacebar") {
          this.transitionTo(_MascotFSM.STATES.CELEBRATING);
          this._dispatchSpeech("\xA1Yuhuuu! \xA1Misi\xF3n completada, campe\xF3n!", "CRITICAL", "victory");
        }
        return;
      }
      if (this.state === _MascotFSM.STATES.HELPER_POINTING) {
        this.transitionTo(_MascotFSM.STATES.IDLE);
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
      if (this._idleSeconds >= this.sleepTimeoutSec && this.state !== _MascotFSM.STATES.SLEEPY && this.state !== _MascotFSM.STATES.HIGH_FIVE_WAIT && this.state !== _MascotFSM.STATES.CELEBRATING) {
        this.transitionTo(_MascotFSM.STATES.SLEEPY);
        this._dispatchSpeech("Zzz... \xBFTe has dormido? Pulsa cualquier tecla para continuar.", "LOW", "sleepy");
      }
    }
    /**
     * Start autonomous inactivity timer (useful in browser game loops).
     */
    startInactivityTimer() {
      this.stopInactivityTimer();
      if (typeof setInterval === "function") {
        this._inactivityInterval = setInterval(() => {
          this._idleSeconds += 1;
          this.handleIdleTime(this._idleSeconds);
        }, 1e3);
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
      this.state = _MascotFSM.STATES.IDLE;
      this.history = [this.state];
    }
    /**
     * Teardown listeners and timers.
     */
    destroy() {
      this.stopInactivityTimer();
      for (const unsub of this._unsubscribers) {
        if (typeof unsub === "function") unsub();
      }
      this._unsubscribers = [];
    }
  };

  // src/mascot/LipSync.js
  var LipSync = class {
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
      this.cadenceFreq = options.cadenceFreq || 4.8;
      this.mouthAmp = options.mouthAmp !== void 0 ? options.mouthAmp : 0.25;
      this.msPerSyllable = options.msPerSyllable || 180;
      this._isSpeaking = false;
      this._time = 0;
      this._speechDuration = 0;
      this._speechElapsed = 0;
      this._currentMouthScale = 1;
      this._waveAmplitudes = [0, 0, 0];
      this._currentText = "";
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
      if (!this.eventBus || typeof this.eventBus.on !== "function") return;
      const unsub = this.eventBus.on("MASCOT_SPEAK_REQUEST", (payload) => {
        if (payload && payload.text) {
          this.speak(payload.text);
        }
      });
      this._unsubscribers.push(unsub);
      const unsubSuccess = this.eventBus.on("KEY_PRESSED_SUCCESS", () => {
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
      if (!text || typeof text !== "string") return 1;
      const clean = text.toLowerCase().replace(/[^a-záéíóúüñ\s]/gi, "").trim();
      if (!clean) return 1;
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
      return durationMs / 1e3;
    }
    /**
     * Trigger speaking animation for text or explicit duration.
     * @param {string} text Spoken dialogue text
     * @param {number} [durationMs] Optional override duration in ms
     */
    speak(text, durationMs) {
      this._currentText = String(text || "");
      const durationSec = typeof durationMs === "number" && durationMs > 0 ? durationMs / 1e3 : this.calculateDuration(this._currentText);
      this._isSpeaking = true;
      this._speechDuration = durationSec;
      this._speechElapsed = 0;
      this._time = 0;
      if (this.indicatorElement && this.indicatorElement.classList) {
        this.indicatorElement.classList.add("is-speaking");
      }
      if (this._timerId) {
        clearTimeout(this._timerId);
        this._timerId = null;
      }
      this._timerId = setTimeout(() => {
        this.stopSpeaking();
      }, durationSec * 1e3);
    }
    /**
     * Stop speaking animation and reset mouth to rest.
     */
    stopSpeaking() {
      this._isSpeaking = false;
      this._currentMouthScale = 1;
      this._waveAmplitudes = [0, 0, 0];
      this._speechElapsed = 0;
      if (this._timerId) {
        clearTimeout(this._timerId);
        this._timerId = null;
      }
      if (this.indicatorElement && this.indicatorElement.classList) {
        this.indicatorElement.classList.remove("is-speaking");
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
      const dt = Math.max(0, Math.min(100, deltaTimeMs)) / 1e3;
      if (!this._isSpeaking) {
        this._currentMouthScale = 1;
        this._waveAmplitudes = [0, 0, 0];
        return;
      }
      this._time += dt;
      this._speechElapsed += dt;
      if (this._speechElapsed >= this._speechDuration) {
        this.stopSpeaking();
        return;
      }
      const omega = 2 * Math.PI * this.cadenceFreq;
      const sineVal = Math.sin(omega * this._time);
      const absVal = Math.abs(sineVal);
      this._currentMouthScale = 1 + this.mouthAmp * absVal;
      const b1 = Math.abs(Math.sin(omega * this._time));
      const b2 = Math.abs(Math.sin(omega * this._time + Math.PI / 3));
      const b3 = Math.abs(Math.sin(omega * this._time + 2 * Math.PI / 3));
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
      if (this.mouthElement && this.mouthElement.style) {
        this.mouthElement.style.transform = `scaleY(${this._currentMouthScale.toFixed(3)})`;
      }
      if (this.indicatorElement && this.indicatorElement.classList) {
        if (this._isSpeaking) {
          this.indicatorElement.classList.add("is-speaking");
        } else {
          this.indicatorElement.classList.remove("is-speaking");
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
        if (typeof unsub === "function") unsub();
      }
      this._unsubscribers = [];
      this.mouthElement = null;
      this.waveBars = [];
    }
  };

  // src/mascot/MascotController.js
  var MASCOT_EMOTIONS = Object.freeze({
    IDLE: "idle",
    SPEAKING: "speaking",
    STREAK: "streak",
    ERROR: "error"
  });
  function getRobyAvatarSVG() {
    return `
<svg id="mascot-avatar-svg" class="mascot-svg-avatar" viewBox="0 0 240 240" aria-label="Roby el Robot" role="img">
  <defs>
    <!-- Soft chassis gradients -->
    <radialGradient id="roby-head-grad" cx="40%" cy="35%" r="65%">
      <stop offset="0%" stop-color="#ffe4e9" />
      <stop offset="60%" stop-color="#ffb8c6" />
      <stop offset="100%" stop-color="#f492a5" />
    </radialGradient>

    <radialGradient id="roby-mint-grad" cx="40%" cy="30%" r="70%">
      <stop offset="0%" stop-color="#c8f7e4" />
      <stop offset="70%" stop-color="#a8e6cf" />
      <stop offset="100%" stop-color="#7dd3b6" />
    </radialGradient>

    <linearGradient id="roby-screen-grad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#1e293b" />
      <stop offset="100%" stop-color="#0f172a" />
    </linearGradient>

    <linearGradient id="wing-grad-left" x1="100%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="rgba(168, 230, 207, 0.75)" />
      <stop offset="100%" stop-color="rgba(255, 184, 198, 0.35)" />
    </linearGradient>

    <linearGradient id="wing-grad-right" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="rgba(168, 230, 207, 0.75)" />
      <stop offset="100%" stop-color="rgba(255, 184, 198, 0.35)" />
    </linearGradient>

    <!-- Glow filters -->
    <filter id="eye-glow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="3.5" result="blur" />
      <feMerge>
        <feMergeNode in="blur" />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>

    <filter id="star-glow" x="-30%" y="-30%" width="160%" height="160%">
      <feGaussianBlur stdDeviation="4" result="blur" />
      <feMerge>
        <feMergeNode in="blur" />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>
  </defs>

  <!-- Root Animated Container (Breathing & Look-at Tilt) -->
  <g id="roby-root" class="roby-root-group" transform-origin="120 200">
    
    <!-- 1. Translucent Fairy Wings -->
    <g id="roby-wings" class="roby-wings">
      <!-- Left Wing -->
      <path id="roby-wing-left" class="roby-wing" d="M 68,140 C 20,130 5,85 25,60 C 50,30 85,90 78,135 Z"
            fill="url(#wing-grad-left)" stroke="#81e6d9" stroke-width="1.8" opacity="0.85" />
      <!-- Right Wing -->
      <path id="roby-wing-right" class="roby-wing" d="M 172,140 C 220,130 235,85 215,60 C 190,30 155,90 162,135 Z"
            fill="url(#wing-grad-right)" stroke="#81e6d9" stroke-width="1.8" opacity="0.85" />
    </g>

    <!-- 2. Bouncy Antennae with Glowing Stars -->
    <g id="roby-antennae" class="roby-antennae">
      <!-- Left Antenna -->
      <path id="roby-antenna-left" d="M 88,68 Q 72,40 68,26" fill="none" stroke="#a8e6cf" stroke-width="4.5" stroke-linecap="round" />
      <polygon id="roby-star-left" points="68,12 72,22 83,23 74,30 77,41 68,34 59,41 62,30 53,23 64,22"
               fill="#ffd32a" filter="url(#star-glow)" />

      <!-- Right Antenna -->
      <path id="roby-antenna-right" d="M 152,68 Q 168,40 172,26" fill="none" stroke="#a8e6cf" stroke-width="4.5" stroke-linecap="round" />
      <polygon id="roby-star-right" points="172,12 176,22 187,23 178,30 181,41 172,34 163,41 166,30 157,23 168,22"
               fill="#ffd32a" filter="url(#star-glow)" />
    </g>

    <!-- 3. Chibi Spherical Body & Head -->
    <g id="roby-body">
      <!-- Outer Spherical Chassis -->
      <circle cx="120" cy="130" r="76" fill="url(#roby-head-grad)" stroke="#f472b6" stroke-width="3" />
      
      <!-- Mint Goggles on Forehead -->
      <path d="M 70,82 C 70,68 170,68 170,82 C 170,92 155,94 120,94 C 85,94 70,92 70,82 Z"
            fill="url(#roby-mint-grad)" stroke="#38a169" stroke-width="2.5" />
      <ellipse cx="95" cy="80" rx="18" ry="8" fill="rgba(255, 255, 255, 0.45)" />
      <ellipse cx="145" cy="80" rx="18" ry="8" fill="rgba(255, 255, 255, 0.45)" />

      <!-- Dark Glossy Face Screen -->
      <rect x="62" y="96" width="116" height="84" rx="28" ry="28"
            fill="url(#roby-screen-grad)" stroke="#475569" stroke-width="2.5" />

      <!-- Screen reflection gloss -->
      <path d="M 72,106 Q 120,98 168,106 Q 120,114 72,106 Z" fill="rgba(255, 255, 255, 0.12)" />
    </g>

    <!-- 4. Interactive Expressive Eyes (Blinkable, Look-at Tracking, Star Eyes) -->
    <g id="roby-eyes" class="roby-eyes-group">
      <!-- Left Eye -->
      <g id="roby-eye-left" class="roby-eye" transform-origin="94 130">
        <!-- Normal LED Eye -->
        <circle id="roby-eye-left-base" cx="94" cy="130" r="14" fill="#00f2fe" filter="url(#eye-glow)" />
        <circle id="roby-pupil-left" cx="94" cy="130" r="8" fill="#0f172a" />
        <circle cx="91" cy="126" r="3" fill="#ffffff" />
        
        <!-- Star Eye for Streak (Initially Hidden) -->
        <polygon id="roby-star-eye-left" points="94,116 97,125 106,126 99,132 101,141 94,136 87,141 89,132 82,126 91,125"
                 fill="#ffd32a" filter="url(#star-glow)" style="display: none;" />
      </g>

      <!-- Right Eye -->
      <g id="roby-eye-right" class="roby-eye" transform-origin="146 130">
        <!-- Normal LED Eye -->
        <circle id="roby-eye-right-base" cx="146" cy="130" r="14" fill="#00f2fe" filter="url(#eye-glow)" />
        <circle id="roby-pupil-right" cx="146" cy="130" r="8" fill="#0f172a" />
        <circle cx="143" cy="126" r="3" fill="#ffffff" />

        <!-- Star Eye for Streak (Initially Hidden) -->
        <polygon id="roby-star-eye-right" points="146,116 149,125 158,126 151,132 153,141 146,136 139,141 141,132 134,126 143,125"
                 fill="#ffd32a" filter="url(#star-glow)" style="display: none;" />
      </g>

      <!-- Cute Blushing Cheeks -->
      <ellipse id="roby-blush-left" cx="76" cy="152" rx="7" ry="4" fill="#ff7675" opacity="0.65" />
      <ellipse id="roby-blush-right" cx="164" cy="152" rx="7" ry="4" fill="#ff7675" opacity="0.65" />
    </g>

    <!-- 5. Parametric Real-Time Lip-Sync Mouth -->
    <g id="roby-mouth-container">
      <!-- Reactive Mouth Path: morphs smoothly based on mouthOpenness -->
      <path id="roby-mouth" class="roby-mouth-path"
            d="M 104,158 Q 120,166 136,158"
            fill="none" stroke="#22d3ee" stroke-width="4.5" stroke-linecap="round" />
      <!-- Inner warm mouth background for when opened -->
      <ellipse id="roby-mouth-fill" cx="120" cy="162" rx="0" ry="0" fill="#e11d48" opacity="0" />
    </g>

  </g>
</svg>
`;
  }
  var MascotController = class {
    /**
     * @param {Object} [options]
     * @param {Object} [options.voiceEngine=null] VoiceEngine instance supplying Web Audio AnalyserNode
     * @param {Object} [options.eventBus=null] EventBus instance
     * @param {string|Element} [options.container='#mascot-avatar-wrapper'] Container to mount or wrap avatar
     */
    constructor(options = {}) {
      this.voiceEngine = options.voiceEngine || null;
      this.eventBus = options.eventBus || null;
      this.container = options.container || "#mascot-avatar-wrapper";
      this.mouthOpenness = 0;
      this._smoothRMS = 0;
      this._alpha = 0.35;
      this._silenceThreshold = 0.015;
      this._dataArray = null;
      this.emotion = MASCOT_EMOTIONS.IDLE;
      this._isSpeaking = false;
      this._time = 0;
      this._headTilt = 0;
      this._targetTilt = 0;
      this._breathingOffset = 0;
      this._pupilOffset = { x: 0, y: 0 };
      this._isBlinking = false;
      this._nextBlinkTime = 3.5;
      this.dom = {};
      this.sprites = {
        idle: null,
        speaking: null,
        streak: null,
        error: null
      };
      this._spritesLoaded = false;
      this.canvas = null;
      this.ctx = null;
      this.particles = [];
      this._rafId = null;
      this._lastTimestamp = 0;
      this._eventDisposers = [];
      this.init();
    }
    /**
     * Initialize avatar DOM, load 3D sprites, and start 60 FPS animation loop
     */
    init() {
      if (typeof document === "undefined") return;
      this._mountAvatar();
      this._cacheElements();
      this._initPixarCanvas();
      if (this.eventBus) {
        this._bindEventBus();
      }
      this.start();
    }
    /**
     * Mounts the vector SVG avatar into the mascot avatar wrapper
     * @private
     */
    _mountAvatar() {
      const containerEl = typeof this.container === "string" ? document.querySelector(this.container) : this.container;
      if (!containerEl) return;
      const existingImg = containerEl.querySelector("#mascot-avatar");
      if (existingImg && existingImg.tagName.toLowerCase() === "img") {
        const wrapper = document.createElement("div");
        wrapper.id = "mascot-avatar";
        wrapper.className = "mascot-avatar mascot-vector-avatar";
        wrapper.innerHTML = getRobyAvatarSVG();
        existingImg.replaceWith(wrapper);
      } else if (!containerEl.querySelector("#mascot-avatar-svg")) {
        const div = document.createElement("div");
        div.id = "mascot-avatar";
        div.className = "mascot-avatar mascot-vector-avatar";
        div.innerHTML = getRobyAvatarSVG();
        containerEl.prepend(div);
      }
    }
    /**
     * Cache references to parametric SVG nodes
     * @private
     */
    _cacheElements() {
      this.dom = {
        rootGroup: document.getElementById("roby-root"),
        wings: document.getElementById("roby-wings"),
        mouth: document.getElementById("roby-mouth"),
        mouthFill: document.getElementById("roby-mouth-fill"),
        eyeLeft: document.getElementById("roby-eye-left"),
        eyeRight: document.getElementById("roby-eye-right"),
        pupilLeft: document.getElementById("roby-pupil-left"),
        pupilRight: document.getElementById("roby-pupil-right"),
        eyeLeftBase: document.getElementById("roby-eye-left-base"),
        eyeRightBase: document.getElementById("roby-eye-right-base"),
        starEyeLeft: document.getElementById("roby-star-eye-left"),
        starEyeRight: document.getElementById("roby-star-eye-right"),
        wingLeft: document.getElementById("roby-wing-left"),
        wingRight: document.getElementById("roby-wing-right")
      };
    }
    /**
     * Subscribes to EventBus events
     * @private
     */
    _bindEventBus() {
      if (!this.eventBus || typeof this.eventBus.on !== "function") return;
      const unsubTarget = this.eventBus.on("KEY_TARGET_CHANGED", (payload) => {
        if (payload && payload.screenPosition) {
          this.lookAt(payload.screenPosition);
        }
      });
      const unsubSuccess = this.eventBus.on("KEY_PRESSED_SUCCESS", (payload) => {
        const combo = payload && payload.comboCount || 0;
        if (combo >= 20) {
          this.setEmotion(MASCOT_EMOTIONS.STREAK, 3800);
        } else if (combo >= 10) {
          this.setEmotion(MASCOT_EMOTIONS.STREAK, 3200);
        } else if (combo >= 5) {
          this.setEmotion(MASCOT_EMOTIONS.STREAK, 2e3);
        }
      });
      const unsubFail = this.eventBus.on("KEY_PRESSED_FAIL", () => {
        this.setEmotion(MASCOT_EMOTIONS.ERROR, 1800);
      });
      const unsubSpeak = this.eventBus.on("MASCOT_SPEAK_REQUEST", () => {
        this.setEmotion(MASCOT_EMOTIONS.SPEAKING);
      });
      this._eventDisposers.push(unsubTarget, unsubSuccess, unsubFail, unsubSpeak);
    }
    /**
     * Sets active emotional state with optional auto-reset duration in ms
     * @param {string} emotion 'idle' | 'speaking' | 'streak' | 'error'
     * @param {number} [durationMs=0]
     */
    setEmotion(emotion, durationMs = 0) {
      this.emotion = emotion;
      this._applyEmotionVisuals(emotion);
      if (durationMs > 0) {
        if (this._emotionTimer) clearTimeout(this._emotionTimer);
        this._emotionTimer = setTimeout(() => {
          this.setEmotion(MASCOT_EMOTIONS.IDLE);
        }, durationMs);
      }
    }
    /**
     * Updates eye styles and base mouth cues per emotion
     * @private
     */
    _applyEmotionVisuals(emotion) {
      const { eyeLeftBase, eyeRightBase, starEyeLeft, starEyeRight, mouth } = this.dom;
      if (!eyeLeftBase || !starEyeLeft) return;
      if (emotion === MASCOT_EMOTIONS.STREAK) {
        eyeLeftBase.style.display = "none";
        eyeRightBase.style.display = "none";
        starEyeLeft.style.display = "block";
        starEyeRight.style.display = "block";
        if (mouth) mouth.setAttribute("stroke", "#ffd32a");
      } else {
        eyeLeftBase.style.display = "block";
        eyeRightBase.style.display = "block";
        starEyeLeft.style.display = "none";
        starEyeRight.style.display = "none";
        if (mouth) {
          mouth.setAttribute("stroke", emotion === MASCOT_EMOTIONS.ERROR ? "#ff7675" : "#22d3ee");
        }
      }
    }
    /**
     * Updates look-at direction toward target key screen coordinates
     * @param {{ x: number, y?: number }} screenPos
     */
    lookAt(screenPos) {
      if (!screenPos || typeof screenPos.x !== "number") return;
      const windowWidth = (typeof window !== "undefined" ? window.innerWidth : 1e3) || 1e3;
      const center = windowWidth / 2;
      const offsetRatio = Math.max(-1, Math.min(1, (screenPos.x - center) / (windowWidth * 0.4)));
      this._targetTilt = offsetRatio * 4;
      this._pupilOffset = {
        x: offsetRatio * 4.5,
        y: 1.5
      };
    }
    /**
     * Connects or updates VoiceEngine instance
     * @param {Object} voiceEngine
     */
    connectVoiceEngine(voiceEngine) {
      this.voiceEngine = voiceEngine;
    }
    /**
     * Starts the 60 FPS animation loop
     */
    start() {
      if (this._rafId) return;
      this._lastTimestamp = typeof performance !== "undefined" ? performance.now() : Date.now();
      const loop = (timestamp) => {
        const dt = Math.min((timestamp - this._lastTimestamp) / 1e3, 0.1);
        this._lastTimestamp = timestamp;
        this.update(dt);
        this._rafId = requestAnimationFrame(loop);
      };
      if (typeof requestAnimationFrame !== "undefined") {
        this._rafId = requestAnimationFrame(loop);
      }
    }
    /**
     * Stops the animation loop
     */
    stop() {
      if (this._rafId && typeof cancelAnimationFrame !== "undefined") {
        cancelAnimationFrame(this._rafId);
        this._rafId = null;
      }
    }
    /**
     * Core animation tick: extracts audio RMS, updates lip-sync, blink, and parametric mouth
     * @param {number} dt Delta time in seconds
     */
    update(dt = 0.016) {
      this._time += dt;
      this._processAcousticLipSync(dt);
      this._headTilt += (this._targetTilt - this._headTilt) * Math.min(1, dt * 8);
      this._breathingOffset = Math.sin(this._time * 2.4) * 3.5;
      const wingAngle = Math.sin(this._time * 4) * 6;
      if (this._time >= this._nextBlinkTime) {
        this._isBlinking = true;
        this._nextBlinkTime = this._time + 3 + Math.random() * 3;
        setTimeout(() => {
          this._isBlinking = false;
        }, 140);
      }
      this._renderSvgUpdates(wingAngle);
      if (this._spritesLoaded && this.ctx) {
        this._renderPixarCanvas(dt);
      }
    }
    /**
     * Extracts RMS audio energy from Web Audio AnalyserNode or viseme cadence fallback
     * @private
     */
    _processAcousticLipSync(dt) {
      let currentRMS = 0;
      let hasAudioNode = false;
      if (this.voiceEngine) {
        const analyser = this.voiceEngine.getAnalyserNode();
        if (analyser) {
          hasAudioNode = true;
          if (!this._dataArray || this._dataArray.length !== analyser.fftSize) {
            this._dataArray = new Uint8Array(analyser.fftSize);
          }
          analyser.getByteTimeDomainData(this._dataArray);
          let sumSquares = 0;
          const len = this._dataArray.length;
          for (let i = 0; i < len; i++) {
            const norm = (this._dataArray[i] - 128) / 128;
            sumSquares += norm * norm;
          }
          currentRMS = Math.sqrt(sumSquares / len);
        }
      }
      if (hasAudioNode && currentRMS >= this._silenceThreshold) {
        this._smoothRMS = this._alpha * currentRMS + (1 - this._alpha) * this._smoothRMS;
        const normalized = Math.max(0, Math.min(1, (this._smoothRMS - this._silenceThreshold) / 0.16));
        this.mouthOpenness = normalized;
        if (!this._emotionTimer) {
          this.emotion = MASCOT_EMOTIONS.SPEAKING;
        }
      } else if (this.voiceEngine && this.voiceEngine.isSpeaking()) {
        const cadence = Math.abs(Math.sin(this._time * Math.PI * 4.8)) * 0.75 + 0.15;
        this.mouthOpenness = cadence;
        if (!this._emotionTimer) {
          this.emotion = MASCOT_EMOTIONS.SPEAKING;
        }
      } else {
        this._smoothRMS *= 1 - Math.min(1, dt * 10);
        this.mouthOpenness = Math.max(0, this.mouthOpenness - dt * 8);
        if (this.emotion === MASCOT_EMOTIONS.SPEAKING && this.mouthOpenness <= 0.05) {
          if (!this._emotionTimer) {
            this.emotion = MASCOT_EMOTIONS.IDLE;
          }
        }
      }
    }
    /**
     * Applies transforms and geometry morphing to the SVG avatar nodes
     * @private
     */
    _renderSvgUpdates(wingAngle) {
      const { rootGroup, mouth, mouthFill, eyeLeft, eyeRight, pupilLeft, pupilRight, wingLeft, wingRight } = this.dom;
      if (rootGroup) {
        rootGroup.setAttribute("transform", `translate(0, ${this._breathingOffset.toFixed(2)}) rotate(${this._headTilt.toFixed(2)} 120 130)`);
      }
      if (wingLeft && wingRight) {
        wingLeft.setAttribute("transform", `rotate(${-wingAngle.toFixed(1)} 68 140)`);
        wingRight.setAttribute("transform", `rotate(${wingAngle.toFixed(1)} 172 140)`);
      }
      const blinkScale = this._isBlinking ? 0.08 : 1;
      if (eyeLeft) eyeLeft.setAttribute("transform", `scale(1, ${blinkScale})`);
      if (eyeRight) eyeRight.setAttribute("transform", `scale(1, ${blinkScale})`);
      if (pupilLeft && pupilRight) {
        const px = this._pupilOffset.x.toFixed(2);
        const py = this._pupilOffset.y.toFixed(2);
        pupilLeft.setAttribute("transform", `translate(${px}, ${py})`);
        pupilRight.setAttribute("transform", `translate(${px}, ${py})`);
      }
      if (mouth) {
        const openness = this.mouthOpenness;
        if (this.emotion === MASCOT_EMOTIONS.ERROR) {
          mouth.setAttribute("d", "M 112,156 Q 120,166 128,156 Q 120,148 112,156");
          mouth.setAttribute("fill", "#ffeaa7");
        } else if (openness > 0.04) {
          const dropY = (162 + openness * 18).toFixed(1);
          const topY = (156 - openness * 4).toFixed(1);
          const d = `M 102,156 Q 120,${topY} 138,156 Q 120,${dropY} 102,156`;
          mouth.setAttribute("d", d);
          mouth.setAttribute("fill", "#e11d48");
          mouth.setAttribute("stroke-width", "2.5");
          if (mouthFill) {
            mouthFill.setAttribute("rx", (openness * 16).toFixed(1));
            mouthFill.setAttribute("ry", (openness * 10).toFixed(1));
            mouthFill.setAttribute("opacity", (openness * 0.9).toFixed(2));
          }
        } else {
          mouth.setAttribute("d", "M 104,158 Q 120,166 136,158");
          mouth.setAttribute("fill", "none");
          mouth.setAttribute("stroke-width", "4.5");
          if (mouthFill) mouthFill.setAttribute("opacity", "0");
        }
      }
    }
    /**
     * Initializes the 3D Pixar sprite canvas and preloads assets.
     * @private
     */
    _initPixarCanvas() {
      if (typeof document === "undefined") return;
      let canvasEl = document.getElementById("mascot-canvas");
      const containerEl = typeof this.container === "string" ? document.querySelector(this.container) : this.container;
      const portalFrame = document.getElementById("hologram-portal-frame") || containerEl;
      if (!canvasEl && portalFrame) {
        canvasEl = document.createElement("canvas");
        canvasEl.id = "mascot-canvas";
        canvasEl.className = "mascot-canvas";
        canvasEl.width = 280;
        canvasEl.height = 280;
        portalFrame.prepend(canvasEl);
      }
      if (canvasEl && canvasEl.getContext) {
        this.canvas = canvasEl;
        this.ctx = canvasEl.getContext("2d");
      }
      if (typeof Image !== "undefined") {
        const spritePaths = {
          idle: "assets/mascot/mascot_idle.png",
          speaking: "assets/mascot/mascot_speaking.png",
          streak: "assets/mascot/mascot_streak.png",
          error: "assets/mascot/mascot_error.png"
        };
        let loadedCount = 0;
        const totalCount = Object.keys(spritePaths).length;
        Object.entries(spritePaths).forEach(([key, src]) => {
          const img = new Image();
          img.onload = () => {
            this.sprites[key] = img;
            loadedCount++;
            if (loadedCount >= 2 && this.sprites.idle) {
              this._spritesLoaded = true;
              if (portalFrame) {
                portalFrame.classList.add("has-canvas");
              }
            }
          };
          img.onerror = () => {
          };
          img.src = src;
        });
      }
    }
    /**
     * Renders 60 FPS 3D Pixar avatar with lip-sync cross-fade, breathing, and look-at tracking.
     * @param {number} dt Delta time in seconds
     * @private
     */
    _renderPixarCanvas(dt) {
      const { ctx, canvas } = this;
      if (!ctx || !canvas) return;
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);
      ctx.save();
      ctx.translate(w / 2, h / 2);
      ctx.rotate(this._headTilt * Math.PI / 180);
      ctx.translate(0, this._breathingOffset);
      if (this.emotion === MASCOT_EMOTIONS.STREAK) {
        const jumpY = -Math.abs(Math.sin(this._time * 8.5)) * 14;
        ctx.translate(0, jumpY);
      } else if (this.emotion === MASCOT_EMOTIONS.ERROR) {
        const errorBob = Math.sin(this._time * 4) * 3;
        ctx.translate(0, errorBob);
      }
      if (this.mouthOpenness > 0.04) {
        const scaleY = 1 + Math.min(0.08, this.mouthOpenness * 0.075);
        const scaleX = 1 - Math.min(0.03, this.mouthOpenness * 0.025);
        ctx.scale(scaleX, scaleY);
      }
      let baseImg = this.sprites.idle;
      let overlayImg = null;
      let overlayAlpha = 0;
      if (this.emotion === MASCOT_EMOTIONS.STREAK && this.sprites.streak) {
        baseImg = this.sprites.streak;
      } else if (this.emotion === MASCOT_EMOTIONS.ERROR && this.sprites.error) {
        baseImg = this.sprites.error;
      } else if (this.sprites.speaking && (this.emotion === MASCOT_EMOTIONS.SPEAKING || this.mouthOpenness > 0.05)) {
        baseImg = this.sprites.idle;
        overlayImg = this.sprites.speaking;
        overlayAlpha = Math.min(1, Math.max(0, this.mouthOpenness * 1.65));
      }
      if (baseImg) {
        ctx.drawImage(baseImg, -w / 2, -h / 2, w, h);
      }
      if (overlayImg && overlayAlpha > 0.02) {
        ctx.save();
        ctx.globalAlpha = overlayAlpha;
        ctx.drawImage(overlayImg, -w / 2, -h / 2, w, h);
        ctx.restore();
      }
      if (this.emotion === MASCOT_EMOTIONS.STREAK) {
        this._updateAndDrawParticles(ctx, dt, w, h);
      }
      ctx.restore();
    }
    /**
     * Updates and renders magical sparks around Roby during streak celebrations.
     * @private
     */
    _updateAndDrawParticles(ctx, dt, w, h) {
      if (this.particles.length < 24 && Math.random() < 0.38) {
        const angle = Math.random() * Math.PI * 2;
        const dist = 60 + Math.random() * 55;
        this.particles.push({
          x: Math.cos(angle) * dist,
          y: Math.sin(angle) * dist,
          vx: (Math.random() - 0.5) * 35,
          vy: -20 - Math.random() * 40,
          size: 2.5 + Math.random() * 4.5,
          alpha: 1,
          color: Math.random() > 0.45 ? "#ffd32a" : "#22d3ee"
        });
      }
      for (let i = this.particles.length - 1; i >= 0; i--) {
        const p = this.particles[i];
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.alpha -= dt * 1.35;
        if (p.alpha <= 0) {
          this.particles.splice(i, 1);
          continue;
        }
        ctx.save();
        ctx.globalAlpha = Math.max(0, p.alpha);
        ctx.fillStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    }
    /**
     * Cleanup resources
     */
    dispose() {
      this.stop();
      this._eventDisposers.forEach((unsub) => unsub());
      this._eventDisposers = [];
    }
  };

  // src/mascot/SpeechBubble.js
  var FINGER_COLORS = Object.freeze({
    "lp": "#ff6b81",
    // Left Pinky: Coral / Soft Red
    "lr": "#ff9f43",
    // Left Ring: Warm Orange
    "lm": "#ffd32a",
    // Left Middle: Sun Yellow
    "li": "#2ed573",
    // Left Index: Mint Green
    "ri": "#00d2d3",
    // Right Index: Sky Blue
    "rm": "#ffd32a",
    // Right Middle: Sun Yellow
    "rr": "#ff9f43",
    // Right Ring: Warm Orange
    "rp": "#a29bfe",
    // Right Pinky: Magic Violet / Lilac
    "thumb": "#9b59b6"
    // Thumbs: Cosmic Purple
  });
  var KEY_TO_FINGER_MAP = Object.freeze({
    // Left Hand
    "q": "lp",
    "a": "lp",
    "z": "lp",
    "1": "lp",
    "w": "lr",
    "s": "lr",
    "x": "lr",
    "2": "lr",
    "e": "lm",
    "d": "lm",
    "c": "lm",
    "3": "lm",
    "r": "li",
    "f": "li",
    "v": "li",
    "t": "li",
    "g": "li",
    "b": "li",
    "4": "li",
    "5": "li",
    // Right Hand
    "y": "ri",
    "h": "ri",
    "n": "ri",
    "u": "ri",
    "j": "ri",
    "m": "ri",
    "6": "ri",
    "7": "ri",
    "i": "rm",
    "k": "rm",
    ",": "rm",
    "8": "rm",
    "o": "rr",
    "l": "rr",
    ".": "rr",
    "9": "rr",
    "p": "rp",
    "\xF1": "rp",
    "-": "rp",
    "0": "rp",
    "\xB4": "rp",
    "\xE1": "rp",
    "\xE9": "rp",
    "\xED": "rp",
    "\xF3": "rp",
    "\xFA": "rp",
    // Thumbs
    " ": "thumb",
    "space": "thumb",
    "espacio": "thumb",
    "spacebar": "thumb"
  });
  function getFingerForKey2(key) {
    if (!key) return "thumb";
    const str = String(key);
    if (str === " " || str.toLowerCase() === "space" || str.toLowerCase() === "espacio" || str.toLowerCase() === "spacebar") {
      return "thumb";
    }
    const clean = str.toLowerCase().trim();
    if (!clean) return "thumb";
    return KEY_TO_FINGER_MAP[clean] || "li";
  }
  function formatDialogueText(rawText) {
    if (!rawText || typeof rawText !== "string") return "";
    return rawText.replace(/\[([^\]]+)\]/g, (_match, token) => {
      const finger = getFingerForKey2(token);
      const color = FINGER_COLORS[finger] || "#2ed573";
      const displayKey = token.toUpperCase();
      return `<span class="bubble-key-highlight finger-${finger}" data-finger="${finger}" style="background-color: ${color}; color: #ffffff; padding: 2px 7px; border-radius: 6px; font-weight: bold; display: inline-block; box-shadow: 0 2px 5px rgba(0,0,0,0.2); margin: 0 2px;">${displayKey}</span>`;
    });
  }
  var SpeechBubble = class {
    /**
     * @param {Object} [options]
     * @param {HTMLElement} [options.container=null] Parent DOM element to mount the speech bubble
     * @param {Object} [options.eventBus=null] EventBus instance
     * @param {number} [options.charDelayMs=22] Typing interval in milliseconds per character
     * @param {number} [options.autoHideDelayMs=5000] Time to remain visible after typing finishes
     */
    constructor(options = {}) {
      this.container = options.container || null;
      this.eventBus = options.eventBus || null;
      this.charDelayMs = options.charDelayMs || 22;
      this.autoHideDelayMs = options.autoHideDelayMs || 5e3;
      this.rawText = "";
      this.formattedHtml = "";
      this._isVisible = false;
      this._isTyping = false;
      this._currentEmotion = "happy";
      this._tokens = [];
      this._currentTokenIndex = 0;
      this._typewriterInterval = null;
      this._autoHideTimer = null;
      this._unsubscribers = [];
      this.bubbleElement = null;
      this.contentElement = null;
      if (typeof document !== "undefined") {
        this._buildDOM();
      }
      if (this.eventBus) {
        this._setupListeners();
      }
    }
    /**
     * Create DOM elements for the comic speech bubble if document is available.
     * @private
     */
    _buildDOM() {
      if (typeof document === "undefined") return;
      this.bubbleElement = document.createElement("div");
      this.bubbleElement.className = "mascot-speech-bubble comic-bubble bubble-hidden";
      this.bubbleElement.setAttribute("role", "status");
      this.bubbleElement.setAttribute("aria-live", "polite");
      this.contentElement = document.createElement("div");
      this.contentElement.className = "bubble-content";
      const tailElement = document.createElement("div");
      tailElement.className = "bubble-tail";
      this.bubbleElement.appendChild(this.contentElement);
      this.bubbleElement.appendChild(tailElement);
      this.bubbleElement.addEventListener("click", () => this.skip());
      if (this.container) {
        this.container.appendChild(this.bubbleElement);
      }
    }
    /**
     * Mount bubble into target container.
     * @param {HTMLElement} container
     */
    mount(container) {
      this.container = container;
      if (this.bubbleElement && this.container && !this.container.contains(this.bubbleElement)) {
        this.container.appendChild(this.bubbleElement);
      }
    }
    /**
     * Setup EventBus subscription for MASCOT_SPEAK_REQUEST.
     * @private
     */
    _setupListeners() {
      if (!this.eventBus || typeof this.eventBus.on !== "function") return;
      const unsub = this.eventBus.on("MASCOT_SPEAK_REQUEST", (payload) => {
        if (payload && payload.text) {
          this.show(payload.text, {
            emotion: payload.emotion || "happy",
            priority: payload.priority || "normal"
          });
        }
      });
      this._unsubscribers.push(unsub);
      const unsubSuccess = this.eventBus.on("KEY_PRESSED_SUCCESS", () => {
        this.stopTypewriter();
      });
      this._unsubscribers.push(unsubSuccess);
    }
    /**
     * Split formatted HTML string into tag-safe typewriter tokens.
     * HTML tags are preserved as complete atomic units.
     * @param {string} html
     * @returns {string[]}
     */
    tokenize(html) {
      const tokens = [];
      let i = 0;
      while (i < html.length) {
        if (html[i] === "<") {
          const endTag = html.indexOf(">", i);
          if (endTag !== -1) {
            tokens.push(html.slice(i, endTag + 1));
            i = endTag + 1;
            continue;
          }
        }
        tokens.push(html[i]);
        i++;
      }
      return tokens;
    }
    /**
     * Show speech bubble with typewriter effect and key highlighting.
     * @param {string} text
     * @param {Object} [options]
     * @param {string} [options.emotion='happy'] Emotion style
     * @param {number} [options.charDelayMs] Custom typewriter delay
     * @param {boolean} [options.immediate=false] If true, skips typewriter
     */
    show(text, options = {}) {
      this.stopTypewriter();
      this.rawText = String(text || "");
      this.formattedHtml = formatDialogueText(this.rawText);
      this._currentEmotion = options.emotion || "happy";
      const delay = options.charDelayMs !== void 0 ? options.charDelayMs : this.charDelayMs;
      this._isVisible = true;
      if (this.bubbleElement) {
        this.bubbleElement.className = `mascot-speech-bubble comic-bubble bubble-emotion-${this._currentEmotion}`;
      }
      if (options.immediate) {
        this.skip();
        return;
      }
      this._tokens = this.tokenize(this.formattedHtml);
      this._currentTokenIndex = 0;
      this._isTyping = true;
      let buffer = "";
      if (this.contentElement) {
        this.contentElement.innerHTML = "";
      }
      if (typeof setInterval === "function") {
        this._typewriterInterval = setInterval(() => {
          if (this._currentTokenIndex >= this._tokens.length) {
            this._finishTypewriter();
            return;
          }
          while (this._currentTokenIndex < this._tokens.length && this._tokens[this._currentTokenIndex].startsWith("<")) {
            buffer += this._tokens[this._currentTokenIndex];
            this._currentTokenIndex++;
          }
          if (this._currentTokenIndex < this._tokens.length) {
            buffer += this._tokens[this._currentTokenIndex];
            this._currentTokenIndex++;
          }
          if (this.contentElement) {
            this.contentElement.innerHTML = buffer;
          }
        }, delay);
      } else {
        this.skip();
      }
    }
    /**
     * Complete typewriter immediately, revealing full text.
     */
    skip() {
      this.stopTypewriter();
      this._isTyping = false;
      if (this.contentElement) {
        this.contentElement.innerHTML = this.formattedHtml;
      }
      this._scheduleAutoHide();
    }
    /**
     * Called internally when typewriter naturally reaches end.
     * @private
     */
    _finishTypewriter() {
      this.stopTypewriter();
      this._isTyping = false;
      if (this.contentElement) {
        this.contentElement.innerHTML = this.formattedHtml;
      }
      this._scheduleAutoHide();
    }
    /**
     * Stop active typewriter interval.
     */
    stopTypewriter() {
      if (this._typewriterInterval) {
        clearInterval(this._typewriterInterval);
        this._typewriterInterval = null;
      }
      if (this._autoHideTimer) {
        clearTimeout(this._autoHideTimer);
        this._autoHideTimer = null;
      }
    }
    /**
     * Schedule automatic hide after configured timeout.
     * @private
     */
    _scheduleAutoHide() {
      if (this.autoHideDelayMs > 0 && typeof setTimeout === "function") {
        this._autoHideTimer = setTimeout(() => {
          this.hide();
        }, this.autoHideDelayMs);
      }
    }
    /**
     * Hide the speech bubble.
     */
    hide() {
      this.stopTypewriter();
      this._isVisible = false;
      this._isTyping = false;
      if (this.bubbleElement) {
        this.bubbleElement.classList.add("bubble-hidden");
      }
    }
    /**
     * Clear content and hide bubble.
     */
    clear() {
      this.hide();
      this.rawText = "";
      this.formattedHtml = "";
      if (this.contentElement) {
        this.contentElement.innerHTML = "";
      }
    }
    /**
     * Check if bubble is currently visible.
     * @returns {boolean}
     */
    isVisible() {
      return this._isVisible;
    }
    /**
     * Check if bubble is actively typing text.
     * @returns {boolean}
     */
    isTyping() {
      return this._isTyping;
    }
    /**
     * Get current raw dialogue text.
     * @returns {string}
     */
    getText() {
      return this.rawText;
    }
    /**
     * Get current formatted HTML string.
     * @returns {string}
     */
    getFormattedHtml() {
      return this.formattedHtml;
    }
    /**
     * Teardown and cleanup.
     */
    destroy() {
      this.stopTypewriter();
      for (const unsub of this._unsubscribers) {
        if (typeof unsub === "function") unsub();
      }
      this._unsubscribers = [];
      if (this.bubbleElement && this.bubbleElement.parentNode) {
        this.bubbleElement.parentNode.removeChild(this.bubbleElement);
      }
      this.bubbleElement = null;
      this.contentElement = null;
    }
  };

  // src/mascot/AccessorySocket.js
  var MASCOT_SOCKETS = Object.freeze({
    head: Object.freeze({
      id: "head",
      alias: "hat",
      top: "7%",
      left: "50%",
      transform: "translate(-50%, -100%)",
      zIndex: 15
    }),
    eyes: Object.freeze({
      id: "eyes",
      alias: "glasses",
      top: "39%",
      left: "50%",
      transform: "translate(-50%, -50%)",
      zIndex: 20
    }),
    neck: Object.freeze({
      id: "neck",
      alias: "crown",
      top: "74%",
      left: "50%",
      transform: "translate(-50%, 0)",
      zIndex: 10
    })
  });
  var ACCESSORY_CATALOG = Object.freeze([
    {
      id: "hat-cap",
      slot: "head",
      name: "Gorra de Aventurero",
      starsRequired: 3,
      icon: "\u{1F9E2}",
      description: "Gorra deportiva roja y blanca colocada hacia atr\xE1s.",
      svg: `<svg viewBox="0 0 100 60" width="100" height="60" class="acc-svg-cap">
      <ellipse cx="50" cy="40" rx="42" ry="18" fill="#e74c3c" />
      <path d="M 12 38 Q 50 10 88 38 Z" fill="#c0392b" />
      <ellipse cx="50" cy="18" rx="8" ry="4" fill="#ffffff" />
      <path d="M 65 38 C 75 42, 95 48, 98 42 C 92 36, 80 34, 65 38 Z" fill="#ffffff" />
    </svg>`
    },
    {
      id: "glasses-nerd",
      slot: "eyes",
      name: "Gafas de B\xFAho Sabio",
      starsRequired: 6,
      icon: "\u{1F453}",
      description: "Grandes lentes redondos de estudiante sabio.",
      svg: `<svg viewBox="0 0 120 50" width="120" height="50" class="acc-svg-nerd">
      <circle cx="32" cy="25" r="20" fill="rgba(255,255,255,0.3)" stroke="#2c3e50" stroke-width="5" />
      <circle cx="88" cy="25" r="20" fill="rgba(255,255,255,0.3)" stroke="#2c3e50" stroke-width="5" />
      <line x1="52" y1="25" x2="68" y2="25" stroke="#2c3e50" stroke-width="5" />
      <ellipse cx="26" cy="18" rx="6" ry="3" fill="#ffffff" opacity="0.8" />
      <ellipse cx="82" cy="18" rx="6" ry="3" fill="#ffffff" opacity="0.8" />
    </svg>`
    },
    {
      id: "hat-wizard",
      slot: "head",
      name: "Sombrero de Mago",
      starsRequired: 10,
      icon: "\u{1F9D9}",
      description: "Sombrero puntiagudo azul noche con estrellas m\xE1gicas.",
      svg: `<svg viewBox="0 0 120 100" width="120" height="100" class="acc-svg-wizard">
      <ellipse cx="60" cy="88" rx="55" ry="12" fill="#2c3e50" />
      <path d="M 18 86 Q 40 50 55 12 Q 68 50 102 86 Z" fill="#34495e" />
      <path d="M 28 85 Q 60 78 92 85" stroke="#f1c40f" stroke-width="8" fill="none" />
      <polygon points="56,35 58,40 63,40 59,43 61,48 56,45 52,48 54,43 50,40 55,40" fill="#f1c40f" />
      <polygon points="42,55 43,58 47,58 44,60 45,64 42,62 39,64 40,60 37,58 41,58" fill="#f1c40f" />
    </svg>`
    },
    {
      id: "glasses-star",
      slot: "eyes",
      name: "Gafas Pop Estelares",
      starsRequired: 15,
      icon: "\u2B50",
      description: "Gafas de sol con forma de estrella brillante.",
      svg: `<svg viewBox="0 0 130 55" width="130" height="55" class="acc-svg-star">
      <polygon points="35,5 42,20 58,20 45,30 50,46 35,36 20,46 25,30 12,20 28,20" fill="#f39c12" stroke="#d35400" stroke-width="2" />
      <polygon points="95,5 102,20 118,20 105,30 110,46 95,36 80,46 85,30 72,20 88,20" fill="#f39c12" stroke="#d35400" stroke-width="2" />
      <line x1="58" y1="24" x2="72" y2="24" stroke="#d35400" stroke-width="4" />
      <circle cx="35" cy="25" r="7" fill="rgba(255,255,255,0.7)" />
      <circle cx="95" cy="25" r="7" fill="rgba(255,255,255,0.7)" />
    </svg>`
    },
    {
      id: "glasses-cool",
      slot: "eyes",
      name: "Gafas de Sol Pixel",
      starsRequired: 20,
      icon: "\u{1F576}\uFE0F",
      description: "Gafas oscuras estilo retro gamer.",
      svg: `<svg viewBox="0 0 120 40" width="120" height="40" class="acc-svg-cool">
      <rect x="15" y="10" width="40" height="24" rx="4" fill="#111111" />
      <rect x="65" y="10" width="40" height="24" rx="4" fill="#111111" />
      <rect x="52" y="14" width="16" height="6" fill="#111111" />
      <line x1="20" y1="14" x2="32" y2="30" stroke="#ffffff" stroke-width="3" opacity="0.6" />
      <line x1="70" y1="14" x2="82" y2="30" stroke="#ffffff" stroke-width="3" opacity="0.6" />
    </svg>`
    },
    {
      id: "crown-gold",
      slot: "head",
      name: "Corona de Gran Maestro",
      starsRequired: 24,
      icon: "\u{1F451}",
      description: "Corona real dorada forjada con rub\xEDes y esmeraldas.",
      svg: `<svg viewBox="0 0 120 70" width="120" height="70" class="acc-svg-crown">
      <path d="M 15 60 L 105 60 L 100 20 L 78 40 L 60 12 L 42 40 L 20 20 Z" fill="#f1c40f" stroke="#d68910" stroke-width="3" />
      <circle cx="60" cy="12" r="5" fill="#e74c3c" />
      <circle cx="20" cy="20" r="4" fill="#2ecc71" />
      <circle cx="100" cy="20" r="4" fill="#2ecc71" />
      <rect x="22" y="52" width="76" height="8" rx="2" fill="#d68910" />
      <circle cx="60" cy="56" r="3" fill="#e74c3c" />
      <circle cx="42" cy="56" r="2.5" fill="#3498db" />
      <circle cx="78" cy="56" r="2.5" fill="#3498db" />
    </svg>`
    }
  ]);
  var AccessorySocket = class {
    /**
     * @param {Object} [options]
     * @param {Object} [options.storageManager=null] StorageManager instance
     * @param {HTMLElement} [options.container=null] Mascot container DOM element
     */
    constructor(options = {}) {
      this.storageManager = options.storageManager || null;
      this.container = options.container || null;
      this._fallbackStore = {
        unlocked: [],
        equipped: {
          head: null,
          eyes: null,
          neck: null,
          hat: null,
          glasses: null,
          crown: null
        }
      };
      this._socketElements = /* @__PURE__ */ new Map();
      if (this.container && typeof document !== "undefined") {
        this.renderSockets(this.container);
      }
    }
    /**
     * Normalize slot name across aliases ('hat' <-> 'head', 'glasses' <-> 'eyes', 'crown' <-> 'neck').
     * @param {string} slot
     * @returns {string} Standard socket id: 'head', 'eyes', or 'neck'
     */
    normalizeSlot(slot) {
      if (!slot) return "head";
      const s = String(slot).toLowerCase().trim();
      if (s === "hat" || s === "head") return "head";
      if (s === "glasses" || s === "eyes") return "eyes";
      if (s === "crown" || s === "neck") return "neck";
      return s;
    }
    /**
     * Get storage slot alias ('head' -> 'hat', 'eyes' -> 'glasses', 'neck' -> 'crown').
     * @param {string} slot
     * @returns {string}
     */
    getStorageSlot(slot) {
      const norm = this.normalizeSlot(slot);
      if (norm === "head") return "hat";
      if (norm === "eyes") return "glasses";
      if (norm === "neck") return "crown";
      return norm;
    }
    /**
     * Find accessory definition in catalog by ID.
     * @param {string} id
     * @returns {Object|null}
     */
    getAccessory(id) {
      return ACCESSORY_CATALOG.find((acc) => acc.id === id) || null;
    }
    /**
     * Return full accessory catalog.
     * @returns {Object[]}
     */
    getAllAccessories() {
      return [...ACCESSORY_CATALOG];
    }
    /**
     * Return all accessories compatible with a socket slot.
     * @param {string} slot
     * @returns {Object[]}
     */
    getAccessoriesForSlot(slot) {
      const norm = this.normalizeSlot(slot);
      return ACCESSORY_CATALOG.filter((acc) => this.normalizeSlot(acc.slot) === norm);
    }
    /**
     * Check whether an accessory is currently unlocked.
     * @param {string} id
     * @returns {boolean}
     */
    isUnlocked(id) {
      if (this.storageManager && typeof this.storageManager.isAccessoryUnlocked === "function") {
        return this.storageManager.isAccessoryUnlocked(id);
      }
      if (this.storageManager && typeof this.storageManager.getUnlockedAccessories === "function") {
        return this.storageManager.getUnlockedAccessories().includes(id);
      }
      return this._fallbackStore.unlocked.includes(id);
    }
    /**
     * Check if player has sufficient stars to unlock the item.
     * @param {string} id
     * @param {number} [totalStars] Optional stars count (queried from storageManager if omitted)
     * @returns {boolean}
     */
    canUnlock(id, totalStars) {
      const acc = this.getAccessory(id);
      if (!acc) return false;
      if (this.isUnlocked(id)) return false;
      let stars = totalStars;
      if (typeof stars !== "number" && this.storageManager && typeof this.storageManager.getTotalStars === "function") {
        stars = this.storageManager.getTotalStars();
      }
      const currentStars = Number(stars) || 0;
      return currentStars >= acc.starsRequired;
    }
    /**
     * Unlock an accessory.
     * @param {string} id
     * @param {number} [totalStars]
     * @returns {{ success: boolean, reason?: string }}
     */
    unlock(id, totalStars) {
      const acc = this.getAccessory(id);
      if (!acc) {
        return { success: false, reason: "Accesorios no encontrados" };
      }
      if (this.isUnlocked(id)) {
        return { success: false, reason: "Ya desbloqueado" };
      }
      if (!this.canUnlock(id, totalStars)) {
        return { success: false, reason: `Requiere ${acc.starsRequired} estrellas` };
      }
      if (this.storageManager && typeof this.storageManager.unlockAccessory === "function") {
        this.storageManager.unlockAccessory(id);
      } else {
        this._fallbackStore.unlocked.push(id);
      }
      return { success: true };
    }
    /**
     * Equip an accessory in a designated slot.
     * @param {string} slot 'head' | 'eyes' | 'neck' | 'hat' | 'glasses' | 'crown'
     * @param {string|null} id Accessory ID to equip, or null to unequip
     * @returns {boolean} True if successfully equipped
     */
    equip(slot, id) {
      const norm = this.normalizeSlot(slot);
      const storageKey = this.getStorageSlot(slot);
      if (id === null || id === "") {
        return this.unequip(norm);
      }
      const acc = this.getAccessory(id);
      if (!acc) return false;
      if (this.normalizeSlot(acc.slot) !== norm) {
        console.warn(`[AccessorySocket] Accessory "${id}" (${acc.slot}) not compatible with slot "${norm}"`);
        return false;
      }
      if (this.storageManager && typeof this.storageManager.equipAccessory === "function") {
        this.storageManager.equipAccessory(storageKey, id);
      }
      this._fallbackStore.equipped[norm] = id;
      this._fallbackStore.equipped[storageKey] = id;
      if (!this._fallbackStore.unlocked.includes(id)) {
        this._fallbackStore.unlocked.push(id);
      }
      this.updateEquippedVisuals();
      return true;
    }
    /**
     * Unequip accessory from a slot.
     * @param {string} slot
     * @returns {boolean}
     */
    unequip(slot) {
      const norm = this.normalizeSlot(slot);
      const storageKey = this.getStorageSlot(slot);
      if (this.storageManager && typeof this.storageManager.equipAccessory === "function") {
        this.storageManager.equipAccessory(storageKey, null);
      }
      this._fallbackStore.equipped[norm] = null;
      this._fallbackStore.equipped[storageKey] = null;
      this.updateEquippedVisuals();
      return true;
    }
    /**
     * Get equipped accessory ID for a slot.
     * @param {string} slot
     * @returns {string|null}
     */
    getEquipped(slot) {
      const norm = this.normalizeSlot(slot);
      const storageKey = this.getStorageSlot(slot);
      if (this.storageManager && typeof this.storageManager.getEquippedAccessories === "function") {
        const equipped = this.storageManager.getEquippedAccessories();
        return equipped[storageKey] || equipped[norm] || null;
      }
      return this._fallbackStore.equipped[norm] || this._fallbackStore.equipped[storageKey] || null;
    }
    /**
     * Get all currently equipped accessories across all slots.
     * @returns {{ head: string|null, eyes: string|null, neck: string|null }}
     */
    getAllEquipped() {
      return {
        head: this.getEquipped("head"),
        eyes: this.getEquipped("eyes"),
        neck: this.getEquipped("neck")
      };
    }
    /**
     * Build and mount socket container elements into mascot DOM container.
     * @param {HTMLElement} container
     */
    renderSockets(container) {
      if (!container || typeof document === "undefined") return;
      this.container = container;
      this._socketElements.forEach((el) => {
        if (el && el.parentNode) el.parentNode.removeChild(el);
      });
      this._socketElements.clear();
      for (const [key, cfg] of Object.entries(MASCOT_SOCKETS)) {
        const socketEl = document.createElement("div");
        socketEl.className = `accessory-socket socket-${key}`;
        socketEl.style.position = "absolute";
        socketEl.style.top = cfg.top;
        socketEl.style.left = cfg.left;
        socketEl.style.transform = cfg.transform;
        socketEl.style.zIndex = String(cfg.zIndex);
        socketEl.style.pointerEvents = "none";
        container.appendChild(socketEl);
        this._socketElements.set(key, socketEl);
      }
      this.updateEquippedVisuals();
    }
    /**
     * Refresh visual DOM elements of equipped accessories.
     */
    updateEquippedVisuals() {
      if (this._socketElements.size === 0 || typeof document === "undefined") return;
      for (const [slotKey, socketEl] of this._socketElements.entries()) {
        socketEl.innerHTML = "";
        const equippedId = this.getEquipped(slotKey);
        if (!equippedId) continue;
        const acc = this.getAccessory(equippedId);
        if (!acc) continue;
        const itemEl = document.createElement("div");
        itemEl.className = `accessory-item accessory-${acc.id}`;
        itemEl.innerHTML = acc.svg || acc.icon;
        socketEl.appendChild(itemEl);
      }
    }
    /**
     * Teardown sockets and clean up references.
     */
    destroy() {
      this._socketElements.forEach((el) => {
        if (el && el.parentNode) el.parentNode.removeChild(el);
      });
      this._socketElements.clear();
      this.container = null;
      this.storageManager = null;
    }
  };

  // src/keyboard/KeyboardLayout.js
  var FINGER_COLORS2 = Object.freeze({
    lp: "#F538A0",
    // Left Pinky: Magenta / Fucsia
    lr: "#FA903E",
    // Left Ring: Mandarina cálido
    lm: "#FCC934",
    // Left Middle: Ámbar luminoso
    li: "#81C995",
    // Left Index: Verde Menta
    ri: "#12B5CB",
    // Right Index: Cian / Turquesa
    rm: "#FCC934",
    // Right Middle: Ámbar luminoso
    rr: "#FA903E",
    // Right Ring: Mandarina cálido
    rp: "#F538A0",
    // Right Pinky: Magenta / Fucsia
    thumb: "#1A73E8",
    // Thumbs: Azul Intenso
    "thumb-l": "#1A73E8",
    // Left Thumb: Azul Intenso
    "thumb-r": "#1A73E8",
    // Right Thumb: Azul Intenso
    mod: "#C58AF9"
    // Modifiers (Alt Gr, Shift): Lavanda
  });
  var FINGER_NAMES = Object.freeze({
    lp: "Me\xF1ique Izquierdo",
    lr: "Anular Izquierdo",
    lm: "Coraz\xF3n Izquierdo",
    li: "\xCDndice Izquierdo",
    ri: "\xCDndice Derecho",
    rm: "Coraz\xF3n Derecho",
    rr: "Anular Derecho",
    rp: "Me\xF1ique Derecho",
    thumb: "Pulgar",
    "thumb-l": "Pulgar Izquierdo",
    "thumb-r": "Pulgar Derecho"
  });
  var FINGER_COLOR_NAMES = Object.freeze({
    lp: "coral",
    lr: "naranja c\xE1lido",
    lm: "amarillo sol",
    li: "verde menta",
    ri: "azul cielo",
    rm: "amarillo sol",
    rr: "naranja c\xE1lido",
    rp: "coral",
    thumb: "violeta m\xE1gico",
    "thumb-l": "violeta m\xE1gico",
    "thumb-r": "violeta m\xE1gico"
  });
  var FINGER_MAP2 = Object.freeze({
    // Left Pinky (lp) - Coral / Soft Red
    "1": { finger: "lp", hand: "left" },
    "!": { finger: "lp", hand: "left", requiresShift: true, baseKey: "1" },
    "|": { finger: "lp", hand: "left", requiresAltGr: true, baseKey: "1" },
    "q": { finger: "lp", hand: "left" },
    "a": { finger: "lp", hand: "left" },
    "z": { finger: "lp", hand: "left" },
    "shift-left": { finger: "lp", hand: "left" },
    "ctrl-left": { finger: "lp", hand: "left" },
    // Left Ring (lr) - Warm Orange
    "2": { finger: "lr", hand: "left" },
    '"': { finger: "lr", hand: "left", requiresShift: true, baseKey: "2" },
    "@": { finger: "lr", hand: "left", requiresAltGr: true, baseKey: "2" },
    "w": { finger: "lr", hand: "left" },
    "s": { finger: "lr", hand: "left" },
    "x": { finger: "lr", hand: "left" },
    // Left Middle (lm) - Sun Yellow
    "3": { finger: "lm", hand: "left" },
    "\xB7": { finger: "lm", hand: "left", requiresShift: true, baseKey: "3" },
    "#": { finger: "lm", hand: "left", requiresAltGr: true, baseKey: "3" },
    "e": { finger: "lm", hand: "left" },
    "d": { finger: "lm", hand: "left" },
    "c": { finger: "lm", hand: "left" },
    "\u20AC": { finger: "lm", hand: "left", requiresAltGr: true, baseKey: "e" },
    // Left Index (li) - Mint Green
    "4": { finger: "li", hand: "left" },
    "$": { finger: "li", hand: "left", requiresShift: true, baseKey: "4" },
    "~": { finger: "li", hand: "left", requiresAltGr: true, baseKey: "4" },
    "5": { finger: "li", hand: "left" },
    "%": { finger: "li", hand: "left", requiresShift: true, baseKey: "5" },
    "r": { finger: "li", hand: "left" },
    "t": { finger: "li", hand: "left" },
    "f": { finger: "li", hand: "left", homemark: true },
    "g": { finger: "li", hand: "left" },
    "v": { finger: "li", hand: "left" },
    "b": { finger: "li", hand: "left" },
    // Right Index (ri) - Sky Blue
    "6": { finger: "ri", hand: "right" },
    "&": { finger: "ri", hand: "right", requiresShift: true, baseKey: "6" },
    "7": { finger: "ri", hand: "right" },
    "/": { finger: "ri", hand: "right", requiresShift: true, baseKey: "7" },
    "y": { finger: "ri", hand: "right" },
    "u": { finger: "ri", hand: "right" },
    "h": { finger: "ri", hand: "right" },
    "j": { finger: "ri", hand: "right", homemark: true },
    "n": { finger: "ri", hand: "right" },
    "m": { finger: "ri", hand: "right" },
    // Right Middle (rm) - Sun Yellow
    "8": { finger: "rm", hand: "right" },
    "(": { finger: "rm", hand: "right", requiresShift: true, baseKey: "8" },
    "i": { finger: "rm", hand: "right" },
    "k": { finger: "rm", hand: "right" },
    ",": { finger: "rm", hand: "right" },
    ";": { finger: "rm", hand: "right", requiresShift: true, baseKey: "," },
    // Right Ring (rr) - Warm Orange
    "9": { finger: "rr", hand: "right" },
    ")": { finger: "rr", hand: "right", requiresShift: true, baseKey: "9" },
    "o": { finger: "rr", hand: "right" },
    "l": { finger: "rr", hand: "right" },
    ".": { finger: "rr", hand: "right" },
    ":": { finger: "rr", hand: "right", requiresShift: true, baseKey: "." },
    // Right Pinky (rp) - Coral / Soft Red
    "0": { finger: "rp", hand: "right" },
    "=": { finger: "rp", hand: "right", requiresShift: true, baseKey: "0" },
    "?": { finger: "rp", hand: "right", requiresShift: true, baseKey: "'" },
    "\xBF": { finger: "rp", hand: "right" },
    "\xA1": { finger: "rp", hand: "right" },
    "p": { finger: "rp", hand: "right" },
    "\xF1": { finger: "rp", hand: "right" },
    "-": { finger: "rp", hand: "right" },
    "_": { finger: "rp", hand: "right", requiresShift: true, baseKey: "-" },
    "\xB4": { finger: "rp", hand: "right", isAccent: true },
    "\xA8": { finger: "rp", hand: "right", requiresShift: true, isAccent: true },
    "{": { finger: "rp", hand: "right", requiresAltGr: true, baseKey: "\xB4" },
    "}": { finger: "rp", hand: "right", requiresAltGr: true, baseKey: "\xE7" },
    "\xE7": { finger: "rp", hand: "right" },
    "enter": { finger: "rp", hand: "right" },
    "\n": { finger: "rp", hand: "right", baseKey: "Enter" },
    "shift-right": { finger: "rp", hand: "right" },
    "ctrl-right": { finger: "rp", hand: "right" },
    // Thumbs (thumb) - Magic Purple
    " ": { finger: "thumb", hand: "both", baseKey: " " },
    "space": { finger: "thumb", hand: "both", baseKey: " " },
    "alt-left": { finger: "thumb-l", hand: "left", baseKey: "Alt" },
    "alt-right": { finger: "thumb-r", hand: "right", baseKey: "AltGraph" }
  });
  var SPANISH_KEYBOARD_LAYOUT = [
    // Fila 0: Números y símbolos superiores
    [
      { key: "1", primary: "1", secondary: "!", tertiary: "|", finger: "lp", hand: "left" },
      { key: "2", primary: "2", secondary: '"', tertiary: "@", finger: "lr", hand: "left" },
      { key: "3", primary: "3", secondary: "\xB7", tertiary: "#", finger: "lm", hand: "left" },
      { key: "4", primary: "4", secondary: "$", tertiary: "~", finger: "li", hand: "left" },
      { key: "5", primary: "5", secondary: "%", finger: "li", hand: "left" },
      { key: "6", primary: "6", secondary: "&", finger: "ri", hand: "right" },
      { key: "7", primary: "7", secondary: "/", finger: "ri", hand: "right" },
      { key: "8", primary: "8", secondary: "(", finger: "rm", hand: "right" },
      { key: "9", primary: "9", secondary: ")", finger: "rr", hand: "right" },
      { key: "0", primary: "0", secondary: "=", finger: "rp", hand: "right" },
      { key: "'", primary: "'", secondary: "?", finger: "rp", hand: "right" },
      { key: "\xA1", primary: "\xA1", secondary: "\xBF", finger: "rp", hand: "right" }
    ],
    // Fila 1: Superior (QWERTY...)
    [
      { key: "q", primary: "Q", finger: "lp", hand: "left" },
      { key: "w", primary: "W", finger: "lr", hand: "left" },
      { key: "e", primary: "E", tertiary: "\u20AC", finger: "lm", hand: "left" },
      { key: "r", primary: "R", finger: "li", hand: "left" },
      { key: "t", primary: "T", finger: "li", hand: "left" },
      { key: "y", primary: "Y", finger: "ri", hand: "right" },
      { key: "u", primary: "U", finger: "ri", hand: "right" },
      { key: "i", primary: "I", finger: "rm", hand: "right" },
      { key: "o", primary: "O", finger: "rr", hand: "right" },
      { key: "p", primary: "P", finger: "rp", hand: "right" },
      { key: "`", primary: "`", secondary: "^", tertiary: "[", finger: "rp", hand: "right" },
      { key: "+", primary: "+", secondary: "*", tertiary: "]", finger: "rp", hand: "right" }
    ],
    // Fila 2: Fila Guía Central (ASDF / JKLÑ)
    [
      { key: "a", primary: "A", finger: "lp", hand: "left" },
      { key: "s", primary: "S", finger: "lr", hand: "left" },
      { key: "d", primary: "D", finger: "lm", hand: "left" },
      { key: "f", primary: "F", finger: "li", hand: "left", homemark: true },
      { key: "g", primary: "G", finger: "li", hand: "left" },
      { key: "h", primary: "H", finger: "ri", hand: "right" },
      { key: "j", primary: "J", finger: "ri", hand: "right", homemark: true },
      { key: "k", primary: "K", finger: "rm", hand: "right" },
      { key: "l", primary: "L", finger: "rr", hand: "right" },
      { key: "\xF1", primary: "\xD1", finger: "rp", hand: "right" },
      { key: "\xB4", primary: "\xB4", secondary: "\xA8", tertiary: "{", finger: "rp", hand: "right", isAccent: true },
      { key: "\xE7", primary: "\xC7", secondary: "}", finger: "rp", hand: "right" },
      { key: "Enter", primary: "Intro", finger: "rp", hand: "right", isAction: true, width: 1.6 }
    ],
    // Fila 3: Inferior (ZXCVBNM)
    [
      { key: "Shift", primary: "May\xFAs", finger: "lp", hand: "left", isModifier: true, width: 1.4, side: "left" },
      { key: "z", primary: "Z", finger: "lp", hand: "left" },
      { key: "x", primary: "X", finger: "lr", hand: "left" },
      { key: "c", primary: "C", finger: "lm", hand: "left" },
      { key: "v", primary: "V", finger: "li", hand: "left" },
      { key: "b", primary: "B", finger: "li", hand: "left" },
      { key: "n", primary: "N", finger: "ri", hand: "right" },
      { key: "m", primary: "M", finger: "ri", hand: "right" },
      { key: ",", primary: ",", secondary: ";", finger: "rm", hand: "right" },
      { key: ".", primary: ".", secondary: ":", finger: "rr", hand: "right" },
      { key: "-", primary: "-", secondary: "_", finger: "rp", hand: "right" },
      { key: "Shift", primary: "May\xFAs", finger: "rp", hand: "right", isModifier: true, width: 1.5, side: "right" }
    ],
    // Fila 4: Barra espaciadora y modificadores de pulgar
    [
      { key: "Control", primary: "Ctrl", finger: "lp", hand: "left", isModifier: true, width: 1.2, side: "left" },
      { key: "Alt", primary: "Alt", finger: "thumb-l", hand: "left", isModifier: true, width: 1.2, side: "left" },
      { key: " ", primary: "Espacio", finger: "thumb", hand: "both", isSpace: true, width: 5 },
      { key: "AltGraph", primary: "Alt Gr", finger: "thumb-r", hand: "right", isModifier: true, width: 1.2, side: "right" },
      { key: "Control", primary: "Ctrl", finger: "rp", hand: "right", isModifier: true, width: 1.2, side: "right" }
    ]
  ];
  function isHomemarkKey(keyChar) {
    if (!keyChar) return false;
    const lower = String(keyChar).toLowerCase();
    return lower === "f" || lower === "j";
  }
  function hasAccent(char) {
    return typeof char === "string" && /[áéíóúÁÉÍÓÚ]/.test(char);
  }
  function hasDiaeresis(char) {
    return typeof char === "string" && /[üÜ]/.test(char);
  }
  function getKeyBaseChar(char) {
    if (!char) return "";
    if (char === " ") return " ";
    if (char === "\n" || char === "Enter") return "Enter";
    const accentMap = {
      "\xE1": "a",
      "\xE9": "e",
      "\xED": "i",
      "\xF3": "o",
      "\xFA": "u",
      "\xC1": "a",
      "\xC9": "e",
      "\xCD": "i",
      "\xD3": "o",
      "\xDA": "u",
      "\xFC": "u",
      "\xDC": "u"
    };
    if (accentMap[char]) return accentMap[char];
    const symbolMap = {
      "!": "1",
      '"': "2",
      "\xB7": "3",
      "$": "4",
      "%": "5",
      "&": "6",
      "/": "7",
      "(": "8",
      ")": "9",
      "=": "0",
      "?": "'",
      "\xBF": "\xA1",
      ";": ",",
      ":": ".",
      "_": "-",
      "|": "1",
      "@": "2",
      "#": "3",
      "~": "4",
      "\u20AC": "e",
      "{": "\xB4",
      "}": "\xE7",
      "[": "`",
      "]": "+"
    };
    if (symbolMap[char]) return symbolMap[char];
    return char.toLowerCase();
  }
  function requiresShift(char, levelId = null) {
    if (!char || char.length !== 1) return false;
    if (hasDiaeresis(char)) return true;
    if (/[!"·$%&/()=?¿:;_¨*]/.test(char)) return true;
    if (levelId !== null && Number(levelId) < 7) {
      if (char !== char.toLowerCase() && char === char.toUpperCase() && !/[0-9]/.test(char)) {
        return false;
      }
    }
    if (char !== char.toLowerCase() && char === char.toUpperCase() && !/[0-9]/.test(char)) {
      return true;
    }
    return false;
  }
  function requiresAltGr(char) {
    if (!char) return false;
    return /[@#~|€{}\[\]\\]/.test(char);
  }
  function getFingerForKey3(charOrKey) {
    if (!charOrKey) {
      return {
        finger: "thumb",
        hand: "right",
        color: FINGER_COLORS2.thumb,
        name: FINGER_NAMES.thumb,
        isHomemark: false
      };
    }
    const base = getKeyBaseChar(charOrKey);
    const mapping = FINGER_MAP2[base] || FINGER_MAP2[charOrKey.toLowerCase()] || { finger: "ri", hand: "right" };
    const fingerId = mapping.finger || "ri";
    const hand = mapping.hand || "right";
    const color = FINGER_COLORS2[fingerId] || FINGER_COLORS2.ri;
    const name = FINGER_NAMES[fingerId] || "Dedo Gu\xEDa";
    return {
      finger: fingerId,
      hand,
      color,
      name,
      isHomemark: isHomemarkKey(base)
    };
  }
  function getShiftHandForChar(char, levelId = null) {
    if (!requiresShift(char, levelId)) return null;
    const fingerData = getFingerForKey3(char);
    if (fingerData.hand === "left") {
      return "right";
    }
    if (fingerData.hand === "right") {
      return "left";
    }
    return "left";
  }
  function getMultiKeyFingerCombo(charOrKey, levelId = null) {
    if (!charOrKey) {
      return {
        char: " ",
        primaryFinger: "finger-r-thumb",
        primaryFingerName: "Pulgar",
        primaryColor: FINGER_COLORS2.thumb,
        modifierFinger: null,
        modifierFingerName: null,
        modifierColor: null,
        isCombo: false,
        combinationKeyName: null,
        labelText: "Pulsa [Espacio] con cualquiera de tus pulgares"
      };
    }
    const base = getKeyBaseChar(charOrKey);
    const mapping = FINGER_MAP2[base] || FINGER_MAP2[charOrKey.toLowerCase()] || { finger: "ri", hand: "right" };
    const rawFinger = mapping.finger || "ri";
    const fingerIdMap = {
      lp: "finger-l-pinky",
      lr: "finger-l-ring",
      lm: "finger-l-middle",
      li: "finger-l-index",
      ri: "finger-r-index",
      rm: "finger-r-middle",
      rr: "finger-r-ring",
      rp: "finger-r-pinky",
      thumb: mapping.hand === "left" ? "finger-l-thumb" : "finger-r-thumb",
      "thumb-l": "finger-l-thumb",
      "thumb-r": "finger-r-thumb"
    };
    const primaryFingerId = fingerIdMap[rawFinger] || "finger-r-index";
    const primaryFingerName = FINGER_NAMES[rawFinger] || "Dedo Gu\xEDa";
    const primaryColor = FINGER_COLORS2[rawFinger] || "#12B5CB";
    let modifierFingerId = null;
    let modifierColor = null;
    let modifierName = null;
    let combinationKeyName = null;
    if (requiresAltGr(charOrKey)) {
      modifierFingerId = "finger-r-thumb";
      modifierColor = FINGER_COLORS2.mod;
      modifierName = "Pulgar Derecho";
      combinationKeyName = "Alt Gr";
    } else if (requiresShift(charOrKey, levelId)) {
      const shiftHand = getShiftHandForChar(charOrKey, levelId);
      if (shiftHand === "right") {
        modifierFingerId = "finger-r-pinky";
        modifierName = "Me\xF1ique Derecho";
      } else {
        modifierFingerId = "finger-l-pinky";
        modifierName = "Me\xF1ique Izquierdo";
      }
      modifierColor = FINGER_COLORS2.mod;
      combinationKeyName = "May\xFAs";
    }
    let labelText = "";
    if (combinationKeyName && modifierFingerId) {
      const keySymbol = charOrKey;
      labelText = `Pulsa ${combinationKeyName} + ${keySymbol} (${modifierName} + ${primaryFingerName})`;
    } else {
      const keySymbol = charOrKey === " " ? "Espacio" : charOrKey === "\n" ? "Intro" : charOrKey.toUpperCase();
      labelText = `Pulsa [${keySymbol}] con el ${primaryFingerName}`;
    }
    return {
      char: charOrKey,
      primaryFinger: primaryFingerId,
      primaryFingerName,
      primaryColor,
      modifierFinger: modifierFingerId,
      modifierFingerName: modifierName,
      modifierColor,
      isCombo: Boolean(modifierFingerId),
      combinationKeyName,
      labelText
    };
  }

  // src/keyboard/ToyKeyboard.js
  var ToyKeyboard = class {
    /**
     * @param {Object} [options]
     * @param {HTMLElement|string} [options.container='#keyboard'] - Container element or selector
     * @param {Object} [options.eventBus=null] - EventBus instance for Pub/Sub events
     * @param {Array} [options.layout=SPANISH_KEYBOARD_LAYOUT] - Custom layout definition
     * @param {Function} [options.onKeyPress=null] - Callback invoked when a virtual key is clicked
     */
    constructor(options = {}) {
      this.container = typeof options.container === "string" ? typeof document !== "undefined" ? document.querySelector(options.container) : null : options.container;
      this.eventBus = options.eventBus || null;
      this.layout = options.layout || SPANISH_KEYBOARD_LAYOUT;
      this.onKeyPress = options.onKeyPress || null;
      this.currentTargetChar = null;
      this.keyElementsMap = /* @__PURE__ */ new Map();
      this._eventDisposers = [];
      this._hitTimeouts = /* @__PURE__ */ new Set();
      this._wiggleTimeouts = /* @__PURE__ */ new Set();
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
      this.container = typeof container === "string" ? typeof document !== "undefined" ? document.querySelector(container) : null : container;
      if (this.container) {
        this.init();
      }
    }
    /**
     * Renders the 3D toy-style keyboard inside container
     */
    render() {
      if (!this.container || typeof document === "undefined") return;
      this.keyElementsMap.clear();
      const existingKeys = this.container.querySelectorAll(".key");
      if (existingKeys.length > 0) {
        this._upgradeExistingDomKeys(existingKeys);
        return;
      }
      this.container.classList.add("toy-keyboard");
      this.container.innerHTML = "";
      for (let r = 0; r < this.layout.length; r++) {
        const rowDef = this.layout[r];
        const rowEl = document.createElement("div");
        rowEl.className = "keyboard-row";
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
      const keyEl = document.createElement("div");
      keyEl.className = "key";
      keyEl.dataset.key = keyDef.key;
      keyEl.dataset.finger = keyDef.finger;
      keyEl.dataset.hand = keyDef.hand;
      const fingerColor = FINGER_COLORS2[keyDef.finger] || "#2ed573";
      keyEl.style.setProperty("--finger-color", fingerColor);
      if (keyDef.isSpace) keyEl.classList.add("key-spacebar");
      if (keyDef.key === "Shift") keyEl.classList.add("key-shift");
      if (keyDef.key === "Enter") keyEl.classList.add("key-enter");
      if (keyDef.key === "Control") keyEl.classList.add("key-ctrl");
      if (keyDef.key === "Alt") keyEl.classList.add("key-alt");
      if (keyDef.key === "AltGraph") keyEl.classList.add("key-altgr");
      if (keyDef.isAccent) keyEl.classList.add("key-accent");
      if (keyDef.homemark || isHomemarkKey(keyDef.key)) {
        keyEl.classList.add("key-homemark");
      }
      const labelWrapper = document.createElement("div");
      labelWrapper.className = "key-label";
      const primarySpan = document.createElement("span");
      primarySpan.className = "key-label-primary";
      primarySpan.textContent = keyDef.primary || keyDef.key.toUpperCase();
      labelWrapper.appendChild(primarySpan);
      if (keyDef.secondary) {
        const secSpan = document.createElement("span");
        secSpan.className = "key-label-secondary";
        secSpan.textContent = keyDef.secondary;
        labelWrapper.appendChild(secSpan);
      }
      if (keyDef.tertiary) {
        const tertSpan = document.createElement("span");
        tertSpan.className = "key-label-tertiary";
        tertSpan.textContent = keyDef.tertiary;
        labelWrapper.appendChild(tertSpan);
      }
      keyEl.appendChild(labelWrapper);
      keyEl.addEventListener("pointerdown", (e) => {
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
        const fingerInfo = getFingerForKey3(keyAttr);
        const fingerColor = FINGER_COLORS2[fingerAttr] || fingerInfo.color;
        keyEl.style.setProperty("--finger-color", fingerColor);
        if (isHomemarkKey(keyAttr)) {
          keyEl.classList.add("key-homemark");
        }
        keyEl.addEventListener("pointerdown", (e) => {
          this._handleKeyPointerDown(keyAttr, keyEl, e);
        });
        let side = null;
        if (keyEl.classList.contains("key-shift") || keyEl.dataset.key === "Shift") {
          side = fingerAttr === "lp" || keyEl.getAttribute("aria-label")?.includes("izquierd") ? "left" : "right";
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
      this.keyElementsMap.set(key, element);
      this.keyElementsMap.set(lowerKey, element);
      if (key === " " || key === "Space") {
        this.keyElementsMap.set(" ", element);
        this.keyElementsMap.set("space", element);
      }
      if (key === "Enter" || key === "\n") {
        this.keyElementsMap.set("\n", element);
        this.keyElementsMap.set("enter", element);
      }
      if (key === "Shift") {
        if (side === "left") {
          this.keyElementsMap.set("shift-left", element);
        } else if (side === "right") {
          this.keyElementsMap.set("shift-right", element);
        }
      }
    }
    /**
     * Handles interactive pointer down on a virtual key
     * @private
     */
    _handleKeyPointerDown(keyChar, keyEl, event) {
      if (event) event.preventDefault();
      this._depressKey(keyEl);
      if (typeof this.onKeyPress === "function") {
        this.onKeyPress(keyChar, event);
      }
    }
    /**
     * Applies squishy depression to a key element
     * @private
     */
    _depressKey(keyEl) {
      if (!keyEl) return;
      keyEl.classList.add("is-depressed");
      if (SquashStretch_exports && typeof applySquashAndStretch === "function") {
        applySquashAndStretch(keyEl, {
          preset: "keyPress",
          intensity: 0.85
        });
      }
      setTimeout(() => {
        keyEl.classList.remove("is-depressed");
      }, 120);
    }
    /**
     * Subscribes to typed events on the EventBus
     */
    bindEventBus() {
      if (!this.eventBus) return;
      this.unbindEventBus();
      const unsubTarget = this.eventBus.on("KEY_TARGET_CHANGED", (payload) => {
        if (payload && payload.key !== void 0) {
          this.setTargetKey(payload.key, payload.levelId !== void 0 ? payload.levelId : this.currentLevelId);
        }
      });
      const unsubSuccess = this.eventBus.on("KEY_PRESSED_SUCCESS", (payload) => {
        if (payload && payload.key !== void 0) {
          this.flashKeyHit(payload.key);
        }
      });
      const unsubFail = this.eventBus.on("KEY_PRESSED_FAIL", (payload) => {
        if (payload && payload.pressedKey !== void 0) {
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
        if (typeof dispose === "function") dispose();
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
      if (!targetChar && targetChar !== " ") return;
      this.currentTargetChar = targetChar;
      const baseChar = getKeyBaseChar(targetChar);
      const mainKeyEl = this.getKeyElement(baseChar);
      if (mainKeyEl) {
        mainKeyEl.classList.add("key--target");
      }
      const effectiveLevel = levelId !== null ? levelId : this.currentLevelId;
      if (requiresShift(targetChar, effectiveLevel)) {
        const shiftHand = getShiftHandForChar(targetChar, effectiveLevel);
        const shiftKeyEl = this.getKeyElement(shiftHand === "left" ? "shift-left" : "shift-right");
        if (shiftKeyEl) {
          shiftKeyEl.classList.add("key--target");
        } else {
          if (typeof document !== "undefined") {
            document.querySelectorAll(".key-shift").forEach((el) => el.classList.add("key--target"));
          }
        }
      }
      if (requiresAltGr(targetChar)) {
        const altGrEl = this.getKeyElement("altgraph") || this.getKeyElement("alt-right") || (typeof document !== "undefined" ? document.querySelector(".key-altgr") : null);
        if (altGrEl) {
          altGrEl.classList.add("key--target");
        }
      }
      if (hasAccent(targetChar) || hasDiaeresis(targetChar)) {
        const accentEl = this.getKeyElement("\xB4") || (typeof document !== "undefined" ? document.querySelector(".key-accent") : null);
        if (accentEl) {
          accentEl.classList.add("key--target");
        }
      }
    }
    /**
     * Clears target pulsing highlights from all keys
     */
    clearTarget() {
      this.currentTargetChar = null;
      if (typeof document === "undefined") return;
      const targets = this.container ? this.container.querySelectorAll(".key--target") : document.querySelectorAll(".key--target");
      targets.forEach((keyEl) => {
        keyEl.classList.remove("key--target");
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
      keyEl.classList.add("key--hit");
      this._depressKey(keyEl);
      const timeoutId = setTimeout(() => {
        keyEl.classList.remove("key--hit");
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
      keyEl.classList.remove("key--wrong-soft");
      void keyEl.offsetWidth;
      keyEl.classList.add("key--wrong-soft");
      if (SquashStretch_exports && typeof applySquashAndStretch === "function") {
        applySquashAndStretch(keyEl, {
          preset: "gentle",
          direction: "horizontal",
          intensity: 0.9
        });
      }
      const timeoutId = setTimeout(() => {
        keyEl.classList.remove("key--wrong-soft");
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
      if (!keyChar && keyChar !== " ") return null;
      if (this.keyElementsMap.has(keyChar)) {
        return this.keyElementsMap.get(keyChar);
      }
      const lower = String(keyChar).toLowerCase();
      if (this.keyElementsMap.has(lower)) {
        return this.keyElementsMap.get(lower);
      }
      const base = getKeyBaseChar(keyChar);
      if (this.keyElementsMap.has(base)) {
        return this.keyElementsMap.get(base);
      }
      if (this.container && typeof this.container.querySelector === "function") {
        if (keyChar === " ") {
          return this.container.querySelector(".key-spacebar");
        }
        if (keyChar === "\n" || keyChar === "Enter") {
          return this.container.querySelector(".key-enter");
        }
        return this.container.querySelector(`.key[data-key="${base}"]`) || this.container.querySelector(`.key[data-key="${keyChar}"]`);
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
      if (keyEl && typeof keyEl.getBoundingClientRect === "function") {
        const rect = keyEl.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
          return {
            x: Math.round(rect.left + rect.width / 2),
            y: Math.round(rect.top + rect.height / 2)
          };
        }
      }
      const baseChar = getKeyBaseChar(keyChar);
      let row = 2;
      let col = 4;
      for (let r = 0; r < this.layout.length; r++) {
        const idx = this.layout[r].findIndex((k) => k.key.toLowerCase() === baseChar.toLowerCase());
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
        x: startX + rowOffset + col * keyWidth,
        y: startY + row * keyHeight
      };
    }
    /**
     * Unbinds event listeners and clears active timers
     */
    destroy() {
      this._eventDisposers.forEach((dispose) => {
        if (typeof dispose === "function") dispose();
      });
      this._eventDisposers = [];
      this._hitTimeouts.forEach((id) => clearTimeout(id));
      this._hitTimeouts.clear();
      this._wiggleTimeouts.forEach((id) => clearTimeout(id));
      this._wiggleTimeouts.clear();
      this.clearTarget();
      this.keyElementsMap.clear();
    }
  };

  // src/keyboard/GhostHands.js
  var GhostHands = class {
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
      this.idleThresholdMs = options.idleThresholdMs || 2e3;
      this.leftHandEl = typeof options.leftHand === "string" ? typeof document !== "undefined" ? document.querySelector(options.leftHand) : null : options.leftHand;
      this.rightHandEl = typeof options.rightHand === "string" ? typeof document !== "undefined" ? document.querySelector(options.rightHand) : null : options.rightHand;
      this.hintContainerEl = typeof options.hintContainer === "string" ? typeof document !== "undefined" ? document.querySelector(options.hintContainer) : null : options.hintContainer;
      this.currentFingerId = null;
      this.currentTargetKey = null;
      this.currentHand = null;
      this._idleTimer = null;
      this._isIdleStuck = false;
      this._eventDisposers = [];
      this._fingerUnitsMap = /* @__PURE__ */ new Map();
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
      if (typeof document === "undefined") return;
      this._fingerUnitsMap.clear();
      const units = document.querySelectorAll(".finger-unit");
      units.forEach((unit) => {
        const finger = unit.dataset.finger;
        const unitId = unit.id;
        if (finger) {
          if (!this._fingerUnitsMap.has(finger)) {
            this._fingerUnitsMap.set(finger, []);
          }
          this._fingerUnitsMap.get(finger).push(unit);
        }
        if (unitId === "fg-thumb-l") {
          if (!this._fingerUnitsMap.has("thumb-l")) this._fingerUnitsMap.set("thumb-l", []);
          this._fingerUnitsMap.get("thumb-l").push(unit);
        }
        if (unitId === "fg-thumb-r") {
          if (!this._fingerUnitsMap.has("thumb-r")) this._fingerUnitsMap.set("thumb-r", []);
          this._fingerUnitsMap.get("thumb-r").push(unit);
        }
      });
    }
    /**
     * Subscribes to relevant typed EventBus events
     */
    bindEventBus() {
      if (!this.eventBus) return;
      const unsubTarget = this.eventBus.on("KEY_TARGET_CHANGED", (payload) => {
        if (!payload) return;
        const finger = payload.finger || getFingerForKey3(payload.key).finger;
        this.currentLevelId = payload.levelId !== void 0 ? payload.levelId : this.currentLevelId;
        this.setActiveFinger(finger, payload.key, payload.hand, this.currentLevelId);
        this.resetIdleTimer();
      });
      const unsubSuccess = this.eventBus.on("KEY_PRESSED_SUCCESS", () => {
        this.resetIdleTimer();
        this.stopIdleSuggestion();
      });
      const unsubFail = this.eventBus.on("KEY_PRESSED_FAIL", () => {
        this.resetIdleTimer();
      });
      const unsubStuck = this.eventBus.on("USER_STUCK", (payload) => {
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
    setActiveFinger(fingerId, keyChar = "", hand = null, levelId = null) {
      this.clearActiveFinger();
      if (!fingerId) return;
      this.currentFingerId = fingerId;
      this.currentTargetKey = keyChar;
      const effectiveLevel = levelId !== null ? levelId : this.currentLevelId;
      const fingerInfo = getFingerForKey3(keyChar || fingerId);
      this.currentHand = hand || fingerInfo.hand;
      const color = FINGER_COLORS2[fingerId] || fingerInfo.color;
      let elements = [];
      if (fingerId === "thumb") {
        if (this.currentHand === "left" && this._fingerUnitsMap.has("thumb-l")) {
          elements = this._fingerUnitsMap.get("thumb-l");
        } else if (this.currentHand === "right" && this._fingerUnitsMap.has("thumb-r")) {
          elements = this._fingerUnitsMap.get("thumb-r");
        } else {
          elements = this._fingerUnitsMap.get("thumb") || [];
        }
      } else if (this._fingerUnitsMap.has(fingerId)) {
        elements = this._fingerUnitsMap.get(fingerId);
      }
      elements.forEach((unit) => {
        unit.classList.add("is-active-finger");
        unit.style.setProperty("--active-color", color);
      });
      const combo = getMultiKeyFingerCombo(keyChar, effectiveLevel);
      if (combo && combo.isCombo && combo.modifierFinger) {
        const modCode = combo.modifierFinger.includes("thumb-r") ? "thumb-r" : combo.modifierFinger.includes("-l-") ? "lp" : "rp";
        const modElements = this._fingerUnitsMap.get(modCode) || [];
        modElements.forEach((unit) => {
          unit.classList.add("is-active-finger");
          unit.style.setProperty("--active-color", combo.modifierColor || "#C58AF9");
        });
      }
      this.updateHintBanner(fingerId, keyChar, this.currentHand, color);
    }
    /**
     * Clears active illuminated finger state
     */
    clearActiveFinger() {
      this.stopIdleSuggestion();
      if (typeof document === "undefined") return;
      const activeUnits = document.querySelectorAll(".finger-unit.is-active-finger");
      activeUnits.forEach((unit) => {
        unit.classList.remove("is-active-finger", "is-idle-stuck");
        unit.style.removeProperty("--active-color");
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
      if (typeof document === "undefined") return;
      const handNameEl = document.getElementById("hint-hand-name");
      const fingerBadgeEl = document.getElementById("hint-finger-badge");
      const arrowLeftEl = document.getElementById("hint-arrow-left");
      const arrowRightEl = document.getElementById("hint-arrow-right");
      const visualHelperEl = document.getElementById("hint-visual-helper");
      const fingerName = FINGER_NAMES[fingerId] || "Dedo Gu\xEDa";
      const isLeft = hand === "left" || fingerId.startsWith("l");
      const isRight = hand === "right" || fingerId.startsWith("r");
      if (handNameEl) {
        if (fingerId === "thumb" || hand === "both") {
          handNameEl.textContent = "Pulgares en Espacio";
        } else {
          handNameEl.textContent = isLeft ? "Mano Izquierda" : "Mano Derecha";
        }
      }
      if (arrowLeftEl) arrowLeftEl.style.opacity = isLeft || hand === "both" ? "1" : "0.2";
      if (arrowRightEl) arrowRightEl.style.opacity = isRight || hand === "both" ? "1" : "0.2";
      if (fingerBadgeEl) {
        const keyLabel = keyChar ? keyChar === " " ? "Espacio" : keyChar.toUpperCase() : "";
        fingerBadgeEl.textContent = keyLabel ? `${fingerName} (${keyLabel})` : fingerName;
        fingerBadgeEl.style.backgroundColor = color;
        fingerBadgeEl.style.color = "#ffffff";
      }
      if (visualHelperEl) {
        visualHelperEl.textContent = `\u2B50 \xA1Usa el ${fingerName}!`;
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
      if (this.eventBus && typeof this.eventBus.emit === "function") {
        this.eventBus.emit("USER_STUCK", {
          expectedKey: this.currentTargetKey || "",
          finger: this.currentFingerId || "ri",
          idleTimeMs: this.idleThresholdMs
        });
      }
    }
    /**
     * Activates suggestive bouncing tap animation on active finger
     */
    triggerIdleSuggestion() {
      this._isIdleStuck = true;
      if (typeof document === "undefined") return;
      const activeUnits = document.querySelectorAll(".finger-unit.is-active-finger");
      activeUnits.forEach((unit) => {
        unit.classList.add("is-idle-stuck");
      });
      const hintBadge = document.getElementById("hint-finger-badge");
      if (hintBadge) {
        hintBadge.classList.add("is-pulsing-help");
      }
    }
    /**
     * Stops suggestive bouncing tap animation
     */
    stopIdleSuggestion() {
      this._isIdleStuck = false;
      if (typeof document === "undefined") return;
      const stuckUnits = document.querySelectorAll(".finger-unit.is-idle-stuck");
      stuckUnits.forEach((unit) => {
        unit.classList.remove("is-idle-stuck");
      });
      const hintBadge = document.getElementById("hint-finger-badge");
      if (hintBadge) {
        hintBadge.classList.remove("is-pulsing-help");
      }
    }
    /**
     * Cleans up timers and unbinds event listeners
     */
    destroy() {
      this.clearIdleTimer();
      this.clearActiveFinger();
      this._eventDisposers.forEach((dispose) => {
        if (typeof dispose === "function") dispose();
      });
      this._eventDisposers = [];
      this._fingerUnitsMap.clear();
    }
  };

  // src/keyboard/InteractiveHandsSVG.js
  var UNIVERSAL_FINGER_IDS = Object.freeze({
    LEFT_PINKY: "finger-l-pinky",
    LEFT_RING: "finger-l-ring",
    LEFT_MIDDLE: "finger-l-middle",
    LEFT_INDEX: "finger-l-index",
    LEFT_THUMB: "finger-l-thumb",
    RIGHT_THUMB: "finger-r-thumb",
    RIGHT_INDEX: "finger-r-index",
    RIGHT_MIDDLE: "finger-r-middle",
    RIGHT_RING: "finger-r-ring",
    RIGHT_PINKY: "finger-r-pinky"
  });
  var ANATOMICAL_HAND_PATH = "M 92.6,449.6 L 83.2,426.7 L 75.9,398.6 L 64.5,334.2 L 59.8,284.8 L 48.4,236.4 L 41.1,189.6 L 40,164.6 L 41.6,148 L 43.7,142.3 L 46.8,139.2 L 52,137.6 L 60.8,139.2 L 68.6,147.5 L 74.4,163.1 L 80.6,203.1 L 96.7,259.8 L 100.4,267.1 L 104,267.6 L 105.6,266 L 106.6,263.4 L 106.6,239 L 100.4,187.5 L 100.9,98.6 L 102.4,77.8 L 106.1,69 L 110.8,63.2 L 120.1,59.1 L 129.5,61.2 L 135.2,66.4 L 139.9,76.2 L 144.6,160.5 L 150.3,203.6 L 151.8,227 L 153.4,231.7 L 156,234.3 L 159.1,230.7 L 160.2,219.8 L 160.7,149.6 L 166.4,109.5 L 168,61.7 L 169.5,48.2 L 173.7,37.8 L 181.5,30 L 185.6,28.9 L 191.4,30 L 199.2,33.6 L 203.8,37.8 L 209.6,50.8 L 211.1,77.3 L 210.1,134 L 211.6,150.1 L 210.1,173 L 210.1,227 L 213.2,232.8 L 220,232.2 L 223.1,229.1 L 224.6,224.4 L 230.4,182.3 L 240.2,135 L 243.4,97 L 248,76.8 L 252.7,68.4 L 259,62.7 L 263.6,60.6 L 268.3,60.6 L 273,62.7 L 279.2,70 L 284.4,83 L 285.5,119.4 L 282.9,139.7 L 281.3,180.8 L 273,244.2 L 273,284.2 L 277.2,314.9 L 280.8,324.3 L 285,320.6 L 294.8,299.3 L 301.6,283.2 L 303.7,271.8 L 308.9,257.7 L 316.2,244.2 L 324.5,232.8 L 333.8,223.4 L 343.7,218.7 L 356.2,219.2 L 361.9,221.8 L 364,226 L 363,235.4 L 354.1,261.9 L 351,293.1 L 332.3,340.4 L 325,374.7 L 302.1,417.9 L 286.5,444.9 L 281.3,451.2 L 93.6,451.2 L 92.6,450.1 Z";
  function getLeftHandSVG() {
    return generateAnatomicalHandSVG(false);
  }
  function getRightHandSVG() {
    return generateAnatomicalHandSVG(true);
  }
  function generateAnatomicalHandSVG(isRight = false) {
    const transform = isRight ? 'transform="translate(400, 0) scale(-1, 1)"' : "";
    const side = isRight ? "r" : "l";
    return `
<svg class="interactive-hand-svg natural-hand-dorsal" id="hand-svg-${isRight ? "right" : "left"}" viewBox="0 0 400 480" width="100%" height="100%" aria-label="Mano ${isRight ? "Derecha" : "Izquierda"} Gu\xEDa" role="img" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <!-- Sombra profunda realista del contorno de la mano -->
    <filter id="hand-glow-drop-${side}" x="-25%" y="-20%" width="150%" height="140%">
      <feDropShadow dx="0" dy="10" stdDeviation="14" flood-color="#050711" flood-opacity="0.55" />
      <feDropShadow dx="0" dy="3" stdDeviation="5" flood-color="#050711" flood-opacity="0.35" />
    </filter>

    <!-- Gradiente de piel natural realista (dorso) -->
    <linearGradient id="skin-real-${side}" x1="20%" y1="0%" x2="80%" y2="100%">
      <stop offset="0%" stop-color="#FFEADE" />
      <stop offset="35%" stop-color="#F9CEAD" />
      <stop offset="75%" stop-color="#EDB388" />
      <stop offset="100%" stop-color="#DE9D6E" />
    </linearGradient>

    <!-- Gradiente de u\xF1a pulida con cut\xEDcula y brillo -->
    <linearGradient id="nail-real-${side}" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#FFFFFF" stop-opacity="0.95" />
      <stop offset="25%" stop-color="#FFF2F5" />
      <stop offset="65%" stop-color="#FCDCE5" />
      <stop offset="100%" stop-color="#F7BFCE" />
    </linearGradient>

    <!-- Gradientes de iluminaci\xF3n por dedo con desvanecimiento suave en el nudillo -->
    <linearGradient id="glow-grad-${side}-pinky" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#F538A0" stop-opacity="0.9" />
      <stop offset="75%" stop-color="#F538A0" stop-opacity="0.75" />
      <stop offset="100%" stop-color="#F538A0" stop-opacity="0.0" />
    </linearGradient>

    <linearGradient id="glow-grad-${side}-ring" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#FA903E" stop-opacity="0.9" />
      <stop offset="75%" stop-color="#FA903E" stop-opacity="0.75" />
      <stop offset="100%" stop-color="#FA903E" stop-opacity="0.0" />
    </linearGradient>

    <linearGradient id="glow-grad-${side}-middle" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#FCC934" stop-opacity="0.9" />
      <stop offset="75%" stop-color="#FCC934" stop-opacity="0.75" />
      <stop offset="100%" stop-color="#FCC934" stop-opacity="0.0" />
    </linearGradient>

    <linearGradient id="glow-grad-${side}-index" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="${isRight ? "#12B5CB" : "#81C995"}" stop-opacity="0.9" />
      <stop offset="75%" stop-color="${isRight ? "#12B5CB" : "#81C995"}" stop-opacity="0.75" />
      <stop offset="100%" stop-color="${isRight ? "#12B5CB" : "#81C995"}" stop-opacity="0.0" />
    </linearGradient>

    <linearGradient id="glow-grad-${side}-thumb" x1="50%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#1A73E8" stop-opacity="0.9" />
      <stop offset="75%" stop-color="#1A73E8" stop-opacity="0.75" />
      <stop offset="100%" stop-color="#1A73E8" stop-opacity="0.0" />
    </linearGradient>
  </defs>

  <g class="hand-scene" filter="url(#hand-glow-drop-${side})" ${transform}>

    <!-- ===================================================================
         1. SILUETA BASE COMPLETA Y CONTINUA DE LA MANO (100% Anat\xF3mica)
         =================================================================== -->
    <path class="hand-base-silhouette" d="${ANATOMICAL_HAND_PATH}"
          fill="url(#skin-real-${side})"
          stroke="#C57E4E"
          stroke-width="1.8"
          stroke-linejoin="round"
          stroke-linecap="round"
    />

    <!-- Sombra suave volum\xE9trica del borde cubital (me\xF1ique) y mu\xF1eca -->
    <path d="M 92.6,449.6 C 80,410 70,350 62,290" fill="none" stroke="#B06536" stroke-width="3" stroke-linecap="round" opacity="0.25" />
    <path d="M 281.3,451.2 C 295,430 315,390 326,360" fill="none" stroke="#B06536" stroke-width="3" stroke-linecap="round" opacity="0.2" />

    <!-- Arcos suaves y naturales de los nudillos principales (MCP) -->
    <path d="M 66,268 Q 84,262 102,267" fill="none" stroke="#C57E4E" stroke-width="1.6" stroke-linecap="round" opacity="0.45" />
    <path d="M 112,240 Q 134,233 154,237" fill="none" stroke="#C57E4E" stroke-width="1.7" stroke-linecap="round" opacity="0.45" />
    <path d="M 166,235 Q 188,229 210,234" fill="none" stroke="#C57E4E" stroke-width="1.8" stroke-linecap="round" opacity="0.45" />
    <path d="M 220,237 Q 244,244 268,256" fill="none" stroke="#C57E4E" stroke-width="1.7" stroke-linecap="round" opacity="0.45" />
    <path d="M 115,442 C 160,452 220,452 265,442" fill="none" stroke="#C57E4E" stroke-width="1.8" stroke-linecap="round" opacity="0.3" />

    <!-- ===================================================================
         2. DEDOS INTERACTIVOS (Capas anat\xF3micas de alta precisi\xF3n)
         =================================================================== -->

    <!-- DEDO ME\xD1IQUE (Pinky) -->
    <g class="interactive-finger finger-unit" id="finger-${side}-pinky" data-finger="${isRight ? "rp" : "lp"}" data-finger-id="finger-${side}-pinky" style="--default-color: #F538A0; --glow-gradient: url(#glow-grad-${side}-pinky);">
      <path class="finger-body" d="
        M 56,275
        L 48.4,236.4 L 41.1,189.6 L 40,164.6 L 41.6,148 L 43.7,142.3 L 46.8,139.2 L 52,137.6 L 60.8,139.2 L 68.6,147.5 L 74.4,163.1 L 80.6,203.1 L 96.7,259.8 L 100.4,267.1
        Q 78,272 56,275 Z"
        fill="transparent"
      />
      <path class="finger-rim" d="
        M 56,275
        L 48.4,236.4 L 41.1,189.6 L 40,164.6 L 41.6,148 L 43.7,142.3 L 46.8,139.2 L 52,137.6 L 60.8,139.2 L 68.6,147.5 L 74.4,163.1 L 80.6,203.1 L 96.7,259.8 L 100.4,267.1"
        fill="none" stroke="transparent" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
      />
      <path class="finger-crease" d="M 45,202 Q 62,206 78,202" fill="none" stroke="#C57E4E" stroke-width="1.4" stroke-linecap="round" opacity="0.45" />
      <path class="finger-crease" d="M 43,168 Q 58,172 71,168" fill="none" stroke="#C57E4E" stroke-width="1.3" stroke-linecap="round" opacity="0.4" />

      <path class="finger-nail" d="
        M 45,156
        C 43,146 47,138 56,137
        C 65,138 69,146 67,156
        C 66,163 46,163 45,156 Z"
        fill="url(#nail-real-${side})"
        stroke="#E69CAE"
        stroke-width="0.9"
      />
      <path class="nail-shine" d="M 47,144 Q 56,140 64,144" fill="none" stroke="#FFFFFF" stroke-width="1.2" stroke-linecap="round" opacity="0.85" />

      <circle class="finger-pad" cx="56" cy="148" r="12" />
      <circle class="finger-pulse-ring" cx="56" cy="148" r="14" />
    </g>

    <!-- DEDO ANULAR (Ring) -->
    <g class="interactive-finger finger-unit" id="finger-${side}-ring" data-finger="${isRight ? "rr" : "lr"}" data-finger-id="finger-${side}-ring" style="--default-color: #FA903E; --glow-gradient: url(#glow-grad-${side}-ring);">
      <path class="finger-body" d="
        M 104,267.6
        L 106.6,263.4 L 106.6,239 L 100.4,187.5 L 100.9,98.6 L 102.4,77.8 L 106.1,69 L 110.8,63.2 L 120.1,59.1 L 129.5,61.2 L 135.2,66.4 L 139.9,76.2 L 144.6,160.5 L 150.3,203.6 L 151.8,227 L 156,234.3
        Q 130,248 104,267.6 Z"
        fill="transparent"
      />
      <path class="finger-rim" d="
        M 104,267.6
        L 106.6,263.4 L 106.6,239 L 100.4,187.5 L 100.9,98.6 L 102.4,77.8 L 106.1,69 L 110.8,63.2 L 120.1,59.1 L 129.5,61.2 L 135.2,66.4 L 139.9,76.2 L 144.6,160.5 L 150.3,203.6 L 151.8,227 L 156,234.3"
        fill="none" stroke="transparent" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
      />
      <path class="finger-crease" d="M 104,162 Q 124,167 146,162" fill="none" stroke="#C57E4E" stroke-width="1.6" stroke-linecap="round" opacity="0.45" />
      <path class="finger-crease" d="M 104,115 Q 123,119 142,115" fill="none" stroke="#C57E4E" stroke-width="1.5" stroke-linecap="round" opacity="0.4" />

      <path class="finger-nail" d="
        M 108,82
        C 106,70 110,60 122,59
        C 133,60 137,70 135,82
        C 134,90 109,90 108,82 Z"
        fill="url(#nail-real-${side})"
        stroke="#E69CAE"
        stroke-width="1"
      />
      <path class="nail-shine" d="M 111,68 Q 122,63 131,68" fill="none" stroke="#FFFFFF" stroke-width="1.3" stroke-linecap="round" opacity="0.85" />

      <circle class="finger-pad" cx="122" cy="72" r="14" />
      <circle class="finger-pulse-ring" cx="122" cy="72" r="16" />
    </g>

    <!-- DEDO CORAZ\xD3N (Middle) -->
    <g class="interactive-finger finger-unit" id="finger-${side}-middle" data-finger="${isRight ? "rm" : "lm"}" data-finger-id="finger-${side}-middle" style="--default-color: #FCC934; --glow-gradient: url(#glow-grad-${side}-middle);">
      <path class="finger-body" d="
        M 156,234.3
        L 159.1,230.7 L 160.2,219.8 L 160.7,149.6 L 166.4,109.5 L 168,61.7 L 169.5,48.2 L 173.7,37.8 L 181.5,30 L 185.6,28.9 L 191.4,30 L 199.2,33.6 L 203.8,37.8 L 209.6,50.8 L 211.1,77.3 L 210.1,134 L 211.6,150.1 L 210.1,173 L 210.1,227 L 213.2,232.8
        Q 185,236 156,234.3 Z"
        fill="transparent"
      />
      <path class="finger-rim" d="
        M 156,234.3
        L 159.1,230.7 L 160.2,219.8 L 160.7,149.6 L 166.4,109.5 L 168,61.7 L 169.5,48.2 L 173.7,37.8 L 181.5,30 L 185.6,28.9 L 191.4,30 L 199.2,33.6 L 203.8,37.8 L 209.6,50.8 L 211.1,77.3 L 210.1,134 L 211.6,150.1 L 210.1,173 L 210.1,227 L 213.2,232.8"
        fill="none" stroke="transparent" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
      />
      <path class="finger-crease" d="M 166,140 Q 188,145 210,140" fill="none" stroke="#C57E4E" stroke-width="1.7" stroke-linecap="round" opacity="0.45" />
      <path class="finger-crease" d="M 168,84 Q 188,88 208,84" fill="none" stroke="#C57E4E" stroke-width="1.5" stroke-linecap="round" opacity="0.4" />

      <path class="finger-nail" d="
        M 172,52
        C 170,38 175,28 188,27
        C 201,28 206,38 204,52
        C 203,62 173,62 172,52 Z"
        fill="url(#nail-real-${side})"
        stroke="#E69CAE"
        stroke-width="1"
      />
      <path class="nail-shine" d="M 176,36 Q 188,30 198,36" fill="none" stroke="#FFFFFF" stroke-width="1.4" stroke-linecap="round" opacity="0.85" />

      <circle class="finger-pad" cx="188" cy="42" r="15" />
      <circle class="finger-pulse-ring" cx="188" cy="42" r="17" />
    </g>

    <!-- DEDO \xCDNDICE (Index) -->
    <g class="interactive-finger finger-unit" id="finger-${side}-index" data-finger="${isRight ? "ri" : "li"}" data-finger-id="finger-${side}-index" style="--default-color: ${isRight ? "#12B5CB" : "#81C995"}; --glow-gradient: url(#glow-grad-${side}-index);">
      <path class="finger-body" d="
        M 213.2,232.8
        L 220,232.2 L 223.1,229.1 L 224.6,224.4 L 230.4,182.3 L 240.2,135 L 243.4,97 L 248,76.8 L 252.7,68.4 L 259,62.7 L 263.6,60.6 L 268.3,60.6 L 273,62.7 L 279.2,70 L 284.4,83 L 285.5,119.4 L 282.9,139.7 L 281.3,180.8 L 273,244.2
        Q 243,237 213.2,232.8 Z"
        fill="transparent"
      />
      <path class="finger-rim" d="
        M 213.2,232.8
        L 220,232.2 L 223.1,229.1 L 224.6,224.4 L 230.4,182.3 L 240.2,135 L 243.4,97 L 248,76.8 L 252.7,68.4 L 259,62.7 L 263.6,60.6 L 268.3,60.6 L 273,62.7 L 279.2,70 L 284.4,83 L 285.5,119.4 L 282.9,139.7 L 281.3,180.8 L 273,244.2"
        fill="none" stroke="transparent" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
      />
      <path class="finger-crease" d="M 234,152 Q 256,157 278,152" fill="none" stroke="#C57E4E" stroke-width="1.7" stroke-linecap="round" opacity="0.45" />
      <path class="finger-crease" d="M 242,102 Q 260,106 278,102" fill="none" stroke="#C57E4E" stroke-width="1.5" stroke-linecap="round" opacity="0.4" />

      <path class="finger-nail" d="
        M 250,84
        C 248,71 253,61 266,60
        C 278,61 282,71 280,84
        C 279,93 251,93 250,84 Z"
        fill="url(#nail-real-${side})"
        stroke="#E69CAE"
        stroke-width="1"
      />
      <path class="nail-shine" d="M 254,70 Q 266,65 275,70" fill="none" stroke="#FFFFFF" stroke-width="1.3" stroke-linecap="round" opacity="0.85" />

      <circle class="finger-pad" cx="266" cy="74" r="14" />
      <circle class="finger-pulse-ring" cx="266" cy="74" r="16" />
    </g>

    <!-- DEDO PULGAR (Thumb) -->
    <g class="interactive-finger finger-unit" id="finger-${side}-thumb" data-finger="thumb" data-finger-id="finger-${side}-thumb" style="--default-color: #1A73E8; --glow-gradient: url(#glow-grad-${side}-thumb);">
      <path class="finger-body" d="
        M 280.8,324.3
        L 285,320.6 L 294.8,299.3 L 301.6,283.2 L 303.7,271.8 L 308.9,257.7 L 316.2,244.2 L 324.5,232.8 L 333.8,223.4 L 343.7,218.7 L 356.2,219.2 L 361.9,221.8 L 364,226 L 363,235.4 L 354.1,261.9 L 351,293.1 L 332.3,340.4
        Q 306,332 280.8,324.3 Z"
        fill="transparent"
      />
      <path class="finger-rim" d="
        M 280.8,324.3
        L 285,320.6 L 294.8,299.3 L 301.6,283.2 L 303.7,271.8 L 308.9,257.7 L 316.2,244.2 L 324.5,232.8 L 333.8,223.4 L 343.7,218.7 L 356.2,219.2 L 361.9,221.8 L 364,226 L 363,235.4 L 354.1,261.9 L 351,293.1 L 332.3,340.4"
        fill="none" stroke="transparent" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
      />
      <path class="finger-crease" d="M 318,265 Q 334,275 352,260" fill="none" stroke="#C57E4E" stroke-width="1.6" stroke-linecap="round" opacity="0.45" />

      <path class="finger-nail" d="
        M 342,238
        C 344,226 353,222 362,231
        C 368,241 364,251 354,255
        C 348,258 340,249 342,238 Z"
        fill="url(#nail-real-${side})"
        stroke="#E69CAE"
        stroke-width="1"
      />
      <path class="nail-shine" d="M 348,230 Q 355,228 361,234" fill="none" stroke="#FFFFFF" stroke-width="1.3" stroke-linecap="round" opacity="0.85" />

      <circle class="finger-pad" cx="354" cy="238" r="14" />
      <circle class="finger-pulse-ring" cx="354" cy="238" r="16" />
    </g>

  </g>
</svg>
`;
  }
  var InteractiveHandsSVG = class {
    /**
     * @param {Object} [options]
     * @param {Object} [options.eventBus=null] EventBus instance
     * @param {string|Element} [options.leftContainer='#hand-card-left .hand-illustration']
     * @param {string|Element} [options.rightContainer='#hand-card-right .hand-illustration']
     * @param {string|Element} [options.hintContainer='#current-finger-hint']
     * @param {number} [options.idleThresholdMs=2000] Inactivity time before hint bounce
     */
    constructor(options = {}) {
      this.eventBus = options.eventBus || null;
      this.idleThresholdMs = options.idleThresholdMs || 2e3;
      this.leftContainer = options.leftContainer || "#hand-card-left .hand-illustration";
      this.rightContainer = options.rightContainer || "#hand-card-right .hand-illustration";
      this.hintContainer = options.hintContainer || "#current-finger-hint";
      this.activeFingers = /* @__PURE__ */ new Set();
      this.currentTargetKey = null;
      this.currentCombo = null;
      this._idleTimer = null;
      this._isIdleStuck = false;
      this._eventDisposers = [];
      this.init();
    }
    /**
     * Mounts SVG hands into the DOM and binds event listeners
     */
    init() {
      if (typeof document === "undefined") return;
      this._mountSvgs();
      this._injectStyles();
      if (this.eventBus) {
        this.bindEventBus(this.eventBus);
      }
    }
    /**
     * Replaces realistic image containers with pure vector SVGs
     * @private
     */
    _mountSvgs() {
      const leftEl = typeof this.leftContainer === "string" ? document.querySelector(this.leftContainer) : this.leftContainer;
      const rightEl = typeof this.rightContainer === "string" ? document.querySelector(this.rightContainer) : this.rightContainer;
      if (leftEl) {
        leftEl.innerHTML = getLeftHandSVG();
      }
      if (rightEl) {
        rightEl.innerHTML = getRightHandSVG();
      }
    }
    /**
     * Injects dynamic CSS rules for finger illumination, elevation and multi-key combos
     * @private
     */
    _injectStyles() {
      if (document.getElementById("interactive-hands-styles")) return;
      const style = document.createElement("style");
      style.id = "interactive-hands-styles";
      style.textContent = `
      .interactive-hand-svg {
        width: 100%;
        height: 100%;
        max-height: 380px;
        display: block;
        overflow: visible;
        filter: drop-shadow(0 6px 14px rgba(0, 0, 0, 0.35));
      }

      .interactive-finger {
        cursor: pointer;
        transform-origin: 50% 80%;
        transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1),
                    filter 0.2s ease;
      }

      .interactive-finger .finger-body {
        transition: fill 0.2s ease, stroke 0.2s ease;
      }

      .interactive-finger .finger-rim {
        transition: stroke 0.2s ease;
      }

      .interactive-finger .finger-crease {
        transition: stroke 0.2s ease;
      }

      .interactive-finger .finger-nail {
        transition: fill 0.2s ease, filter 0.2s ease;
      }

      .interactive-finger .finger-pad {
        fill: transparent;
        stroke: transparent;
        transition: all 0.2s ease;
      }

      .interactive-finger .finger-pulse-ring {
        fill: none;
        stroke: transparent;
        transform-origin: center center;
      }

      /* ======================================================================
         Active Full-Body Illuminated Finger Elevation (Seamless & Natural)
         ====================================================================== */
      .interactive-finger.is-illuminated,
      .interactive-finger.is-active-finger {
        transform: translateY(-5px) scale(1.02);
        filter: drop-shadow(0 0 10px var(--finger-glow, var(--default-color)))
                drop-shadow(0 0 24px var(--finger-glow, var(--default-color)));
      }

      .interactive-finger.is-illuminated .finger-body,
      .interactive-finger.is-active-finger .finger-body {
        fill: var(--glow-gradient, var(--finger-color, var(--default-color))) !important;
        stroke: none !important;
      }

      .interactive-finger.is-illuminated .finger-rim,
      .interactive-finger.is-active-finger .finger-rim {
        stroke: #ffffff !important;
        stroke-width: 2.2px !important;
      }

      .interactive-finger.is-illuminated .finger-nail,
      .interactive-finger.is-active-finger .finger-nail {
        fill: #ffffff !important;
        stroke: #ffffff !important;
        filter: drop-shadow(0 0 6px #ffffff);
      }

      .interactive-finger.is-illuminated .finger-crease,
      .interactive-finger.is-active-finger .finger-crease {
        stroke: rgba(255, 255, 255, 0.8) !important;
      }

      .interactive-finger.is-illuminated .finger-pad,
      .interactive-finger.is-active-finger .finger-pad {
        fill: rgba(255, 255, 255, 0.85) !important;
        stroke: #ffffff !important;
        stroke-width: 2px !important;
        opacity: 0.95 !important;
      }

      .interactive-finger.is-illuminated .finger-pulse-ring,
      .interactive-finger.is-active-finger .finger-pulse-ring {
        stroke: #ffffff;
        animation: fingerRadarPulse 1.3s infinite ease-out;
      }

      @keyframes fingerRadarPulse {
        0% {
          r: 14px;
          opacity: 0.9;
          stroke-width: 3px;
        }
        100% {
          r: 32px;
          opacity: 0;
          stroke-width: 1px;
        }
      }

      /* 2-Second Idle Assistance Bounce */
      .interactive-finger.is-idle-stuck {
        animation: fingerIdleTap 0.65s infinite alternate ease-in-out !important;
      }

      @keyframes fingerIdleTap {
        0% {
          transform: translateY(-6px) scale(1.04);
        }
        50% {
          transform: translateY(-14px) scale(1.10);
        }
        100% {
          transform: translateY(-6px) scale(1.04);
        }
      }

      /* Multi-Key Modifier Badge */
      .combo-badge-tag {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 4px 10px;
        border-radius: 999px;
        font-weight: 800;
        background: #C58AF9;
        color: #1a1e36;
        box-shadow: 0 0 12px rgba(197, 138, 249, 0.7);
        animation: pulseTag 1s infinite alternate;
      }

      @keyframes pulseTag {
        from { transform: scale(1); }
        to { transform: scale(1.05); }
      }
    `;
      document.head.appendChild(style);
    }
    /**
     * Binds EventBus listeners
     * @param {Object} eventBus
     */
    bindEventBus(eventBus) {
      this.eventBus = eventBus;
      if (!this.eventBus || typeof this.eventBus.on !== "function") return;
      const unsubTarget = this.eventBus.on("KEY_TARGET_CHANGED", (payload) => {
        if (payload && payload.key !== void 0) {
          this.highlightKey(payload.key, payload.levelId !== void 0 ? payload.levelId : this.currentLevelId);
        }
        this.resetIdleTimer();
      });
      const unsubSuccess = this.eventBus.on("KEY_PRESSED_SUCCESS", () => {
        this.resetIdleTimer();
        this.stopIdleSuggestion();
      });
      const unsubFail = this.eventBus.on("KEY_PRESSED_FAIL", () => {
        this.resetIdleTimer();
      });
      const unsubStuck = this.eventBus.on("USER_STUCK", () => {
        this.triggerIdleSuggestion();
      });
      this._eventDisposers.push(unsubTarget, unsubSuccess, unsubFail, unsubStuck);
    }
    /**
     * Sets the active level ID for modifier calculations
     * @param {number|string} levelId
     */
    setCurrentLevelId(levelId) {
      this.currentLevelId = levelId;
    }
    /**
     * Highlights the appropriate finger(s) for the target character.
     * Supports multi-key combinations illuminating BOTH primary and modifier fingers!
     * 
     * @param {string} charOrKey
     * @param {number|string} [levelId=null]
     */
    highlightKey(charOrKey, levelId = null) {
      this.clearHighlights();
      this.currentTargetKey = charOrKey;
      const effectiveLevel = levelId !== null ? levelId : this.currentLevelId;
      const combo = getMultiKeyFingerCombo(charOrKey, effectiveLevel);
      this.currentCombo = combo;
      if (combo.primaryFinger) {
        this._activateFinger(combo.primaryFinger, combo.primaryColor);
      }
      if (combo.isCombo && combo.modifierFinger) {
        this._activateFinger(combo.modifierFinger, combo.modifierColor || "#C58AF9");
      }
      this._updateHintBanner(combo);
    }
    /**
     * Highlights an individual finger by its SVG element ID
     * @private
     * @param {string} fingerId
     * @param {string} color
     */
    _activateFinger(fingerId, color) {
      if (!fingerId) return;
      const el = document.getElementById(fingerId);
      if (!el) return;
      el.classList.add("is-illuminated", "is-active-finger");
      el.style.setProperty("--finger-color", color);
      el.style.setProperty("--finger-glow", color);
      this.activeFingers.add(fingerId);
    }
    /**
     * Clears all highlighted fingers
     */
    clearHighlights() {
      this.activeFingers.forEach((fingerId) => {
        const el = document.getElementById(fingerId);
        if (el) {
          el.classList.remove("is-illuminated", "is-active-finger", "is-idle-stuck");
          el.style.removeProperty("--finger-color");
          el.style.removeProperty("--finger-glow");
        }
      });
      this.activeFingers.clear();
    }
    /**
     * Updates the on-screen hint banner (#current-finger-hint)
     * @private
     */
    _updateHintBanner(combo) {
      if (typeof document === "undefined") return;
      const bannerEl = document.getElementById("current-finger-hint");
      if (!bannerEl) return;
      const badgeEl = document.getElementById("hint-finger-badge");
      const handNameEl = document.getElementById("hint-hand-name");
      const visualHelperEl = document.getElementById("hint-visual-helper");
      const arrowLeft = document.getElementById("hint-arrow-left");
      const arrowRight = document.getElementById("hint-arrow-right");
      if (combo.isCombo) {
        if (badgeEl) {
          badgeEl.textContent = `Combo: ${combo.labelText}`;
          badgeEl.style.backgroundColor = combo.modifierColor || "#C58AF9";
          badgeEl.style.color = "#12162a";
        }
        if (handNameEl) {
          handNameEl.textContent = "\xA1Usa ambas manos!";
        }
        if (arrowLeft) arrowLeft.style.opacity = "1";
        if (arrowRight) arrowRight.style.opacity = "1";
        if (visualHelperEl) {
          visualHelperEl.innerHTML = `\u2B50 Mant\xE9n <strong>${combo.combinationKeyName}</strong> y pulsa <strong>${combo.char}</strong>`;
        }
      } else {
        if (badgeEl) {
          badgeEl.textContent = combo.labelText;
          badgeEl.style.backgroundColor = combo.primaryColor;
          badgeEl.style.color = "#ffffff";
        }
        const hand = combo.primaryFinger.includes("-l-") ? "Mano Izquierda" : "Mano Derecha";
        if (handNameEl) {
          handNameEl.textContent = hand;
        }
        if (arrowLeft) arrowLeft.style.opacity = hand === "Mano Izquierda" ? "1" : "0.2";
        if (arrowRight) arrowRight.style.opacity = hand === "Mano Derecha" ? "1" : "0.2";
        if (visualHelperEl) {
          visualHelperEl.textContent = `\u2B50 Mira el dedo que brilla en tu ${hand}`;
        }
      }
    }
    /**
     * Resets the 2-second idle timer
     */
    resetIdleTimer() {
      if (this._idleTimer) {
        clearTimeout(this._idleTimer);
        this._idleTimer = null;
      }
      this.stopIdleSuggestion();
      if (this.currentTargetKey !== null) {
        this._idleTimer = setTimeout(() => {
          if (this.eventBus && typeof this.eventBus.emit === "function") {
            this.eventBus.emit("USER_STUCK", {
              expectedKey: this.currentTargetKey,
              finger: this.currentCombo ? this.currentCombo.primaryFinger : null,
              idleTimeMs: this.idleThresholdMs
            });
          }
          this.triggerIdleSuggestion();
        }, this.idleThresholdMs);
      }
    }
    /**
     * Triggers the suggestive idle bounce animation on active fingers
     */
    triggerIdleSuggestion() {
      this._isIdleStuck = true;
      this.activeFingers.forEach((fingerId) => {
        const el = document.getElementById(fingerId);
        if (el) el.classList.add("is-idle-stuck");
      });
    }
    /**
     * Stops the suggestive bounce animation
     */
    stopIdleSuggestion() {
      this._isIdleStuck = false;
      this.activeFingers.forEach((fingerId) => {
        const el = document.getElementById(fingerId);
        if (el) el.classList.remove("is-idle-stuck");
      });
    }
    /**
     * Cleanup and unmount
     */
    dispose() {
      if (this._idleTimer) clearTimeout(this._idleTimer);
      this._eventDisposers.forEach((unsub) => unsub());
      this._eventDisposers = [];
      this.clearHighlights();
    }
  };

  // src/keyboard/CurriculumData.js
  var CURRICULUM_LEVELS = [
    // =========================================================================
    // NIVEL 1: Los Centinelas de Casa (F, J y Espacio)
    // =========================================================================
    {
      id: 1,
      slug: "1-indices",
      name: "1 - \u{1F3AF} Los Centinelas de Casa (F, J y Espacio)",
      shortName: "\xCDndices (F y J)",
      beltTier: "blanco",
      minAccuracy: 85,
      minWPM: 6,
      allowedKeys: ["f", "j", " "],
      objective: "Localizar los bultitos t\xE1ctiles de F y J y usar el pulgar en el espacio",
      speech: "\xA1Hola! Coloca tus dedos \xEDndices en las marcas de la F y la J. \xA1Vamos a empezar desde cero!",
      tip: "F\xEDjate en las peque\xF1as marcas con relieve en las teclas F y J. \xA1Tus dedos \xEDndices descansan ah\xED!",
      lessons: [
        {
          id: "1.1",
          title: "El hogar del \xEDndice izquierdo (F)",
          tip: "Siente la rayita t\xE1ctil en la tecla F con tu dedo \xEDndice izquierdo.",
          speech: "Toca suavemente la letra F con tu \xEDndice izquierdo. \xA1Siente su marca!",
          words: [
            { text: "F", icon: "\u{1F448}", label: "\xCDndice Izquierdo" },
            { text: "F F", icon: "\u{1F448}", label: "Paso F" },
            { text: "F F F", icon: "\u{1F448}", label: "Toca la F" },
            { text: "F F F F", icon: "\u{1F448}", label: "Cuatro Fs" }
          ]
        },
        {
          id: "1.2",
          title: "El hogar del \xEDndice derecho (J)",
          tip: "Siente la rayita t\xE1ctil en la tecla J con tu dedo \xEDndice derecho.",
          speech: "Ahora busca la tecla J con tu \xEDndice derecho. \xA1Tiene otra marquita!",
          words: [
            { text: "J", icon: "\u{1F449}", label: "\xCDndice Derecho" },
            { text: "J J", icon: "\u{1F449}", label: "Paso J" },
            { text: "J J J", icon: "\u{1F449}", label: "Toca la J" },
            { text: "J J J J", icon: "\u{1F449}", label: "Cuatro Js" }
          ]
        },
        {
          id: "1.3",
          title: "Comp\xE1s alterno inicial (F y J)",
          tip: "Mueve un dedo y luego el otro sin mover las mu\xF1ecas.",
          speech: "Izquierda y derecha: F y J. \xA1Como dos amigos salud\xE1ndose!",
          words: [
            { text: "F J", icon: "\u{1F3B5}", label: "Izq - Der" },
            { text: "J F", icon: "\u{1F3B5}", label: "Der - Izq" },
            { text: "F J F", icon: "\u{1F3B6}", label: "Comp\xE1s suave" },
            { text: "J F J", icon: "\u{1F3B6}", label: "Comp\xE1s suave" }
          ]
        },
        {
          id: "1.4",
          title: "El pulgar en la barra espaciadora",
          tip: "Pulsa el espacio con el pulgar suavemente, como si dieras un saltito.",
          speech: "\xA1Llega el pulgar! Da un toque a la barra larga para dejar un espacio.",
          words: [
            { text: "F F", icon: "\u{1F7E3}", label: "F y Espacio" },
            { text: "J J", icon: "\u{1F7E3}", label: "J y Espacio" },
            { text: "F J", icon: "\u{1F7E3}", label: "Paso espaciado" },
            { text: "J F", icon: "\u{1F7E3}", label: "Paso espaciado" }
          ]
        },
        {
          id: "1.5",
          title: "Doble toque de \xEDndice izquierdo (FF)",
          tip: "Dos toquecitos seguidos con el mismo dedo sin despegar la mano.",
          speech: "\xA1Dos toquecitos en la F! Ta-t\xE1.",
          words: [
            { text: "FF", icon: "\u26A1", label: "Doble F" },
            { text: "FF F", icon: "\u26A1", label: "Fuerte F" },
            { text: "F FF", icon: "\u26A1", label: "Eco F" },
            { text: "FF FF", icon: "\u26A1", label: "Ritmo FF" }
          ]
        },
        {
          id: "1.6",
          title: "Doble toque de \xEDndice derecho (JJ)",
          tip: "Dos toquecitos r\xE1pidos en la J con el \xEDndice derecho.",
          speech: "Ahora dos toques en la J. \xA1Siente el ritmo!",
          words: [
            { text: "JJ", icon: "\u26A1", label: "Doble J" },
            { text: "JJ J", icon: "\u26A1", label: "Fuerte J" },
            { text: "J JJ", icon: "\u26A1", label: "Eco J" },
            { text: "JJ JJ", icon: "\u26A1", label: "Ritmo JJ" }
          ]
        },
        {
          id: "1.7",
          title: "Di\xE1logo entre gemelos (FF y JJ)",
          tip: "Dos toques a la izquierda, dos toques a la derecha.",
          speech: "Doble F y luego doble J. \xA1Alterna con calma!",
          words: [
            { text: "FF JJ", icon: "\u{1F46F}", label: "Pares F-J" },
            { text: "JJ FF", icon: "\u{1F46F}", label: "Pares J-F" },
            { text: "FF JJ FF", icon: "\u{1F46F}", label: "Pares tres" },
            { text: "JJ FF JJ", icon: "\u{1F46F}", label: "Pares tres" }
          ]
        },
        {
          id: "1.8",
          title: "Paso cruzado r\xE1pido (FJ y JF)",
          tip: "Pulsa F y enseguida J sin pausa intermedia.",
          speech: "\xA1Paso r\xE1pido! Un dedito y el otro enseguida.",
          words: [
            { text: "FJ", icon: "\u26A1", label: "Salto F-J" },
            { text: "JF", icon: "\u26A1", label: "Salto J-F" },
            { text: "FJ JF", icon: "\u26A1", label: "Ida y vuelta" },
            { text: "JF FJ", icon: "\u26A1", label: "Vuelta e ida" }
          ]
        },
        {
          id: "1.9",
          title: "Tr\xEDos r\xEDtmicos (FJF y JFJ)",
          tip: "Mant\xE9n un comp\xE1s de tres tiempos como en una canci\xF3n.",
          speech: "Uno, dos, tres: F, J, F. \xA1Siente la m\xFAsica en los dedos!",
          words: [
            { text: "FJF", icon: "\u{1F941}", label: "Tr\xEDo F-J-F" },
            { text: "JFJ", icon: "\u{1F941}", label: "Tr\xEDo J-F-J" },
            { text: "FJF JFJ", icon: "\u{1F941}", label: "Doble comp\xE1s" },
            { text: "JFJ FJF", icon: "\u{1F941}", label: "Doble comp\xE1s" }
          ]
        },
        {
          id: "1.10",
          title: "El pulgar bailar\xEDn con tr\xEDos",
          tip: "Tres toques y pulgar espaciador.",
          speech: "Escribe el tr\xEDo y descansa pulsando el espacio con el pulgar.",
          words: [
            { text: "F F F", icon: "\u{1F3B6}", label: "Tr\xEDo F" },
            { text: "J J J", icon: "\u{1F3B6}", label: "Tr\xEDo J" },
            { text: "F J F", icon: "\u{1F3B6}", label: "Tr\xEDo alterno" },
            { text: "J F J", icon: "\u{1F3B6}", label: "Tr\xEDo alterno" }
          ]
        },
        {
          id: "1.11",
          title: "Cadenas de cuatro tiempos (FFJJ)",
          tip: "Cuenta mentalmente: un-dos tres-cuatro.",
          speech: "\xA1Cuatro golpes seguidos! Dos en F y dos en J.",
          words: [
            { text: "FFJJ", icon: "\u{1F680}", label: "Vuelo F-J" },
            { text: "JJFF", icon: "\u{1F680}", label: "Vuelo J-F" },
            { text: "FFJJ FFJJ", icon: "\u{1F680}", label: "Doble vuelo" },
            { text: "JJFF JJFF", icon: "\u{1F680}", label: "Doble vuelo" }
          ]
        },
        {
          id: "1.12",
          title: "Alternancia en cuartetos (FJFJ)",
          tip: "Dedos \xE1giles: F, J, F, J sin detenerse.",
          speech: "\xA1Tic, tac, tic, tac! F, J, F, J.",
          words: [
            { text: "FJFJ", icon: "\u23F1\uFE0F", label: "Tic-tac" },
            { text: "JFJF", icon: "\u23F1\uFE0F", label: "Tac-tic" },
            { text: "FJFJ JFJF", icon: "\u23F1\uFE0F", label: "Reloj continuo" },
            { text: "JFJF FJFJ", icon: "\u23F1\uFE0F", label: "Reloj continuo" }
          ]
        },
        {
          id: "1.13",
          title: "Resistencia y suavidad",
          tip: "No mires tus dedos: conf\xEDa en que est\xE1n en las marcas F y J.",
          speech: "\xA1Intenta no mirar el teclado! Tus dedos ya saben d\xF3nde est\xE1 su casa.",
          words: [
            { text: "F FF F", icon: "\u{1F6E1}\uFE0F", label: "Escudo F" },
            { text: "J JJ J", icon: "\u{1F6E1}\uFE0F", label: "Escudo J" },
            { text: "FJ JF F", icon: "\u{1F6E1}\uFE0F", label: "Patr\xF3n mixto" },
            { text: "JF FJ J", icon: "\u{1F6E1}\uFE0F", label: "Patr\xF3n mixto" }
          ]
        },
        {
          id: "1.14",
          title: "Ritmo combinado con espacios",
          tip: "Combina pulsaciones r\xE1pidas y pausas de pulgar.",
          speech: "Casi listos para el gran examen. \xA1Sigue la melod\xEDa!",
          words: [
            { text: "FF J FF", icon: "\u{1F3B9}", label: "Melod\xEDa uno" },
            { text: "JJ F JJ", icon: "\u{1F3B9}", label: "Melod\xEDa dos" },
            { text: "FJ JF FJ", icon: "\u{1F3B9}", label: "Paso arm\xF3nico" },
            { text: "JF FJ JF", icon: "\u{1F3B9}", label: "Paso arm\xF3nico" }
          ]
        },
        {
          id: "1.15",
          title: "Ensayo general antes del examen",
          tip: "Respira hondo y relaja los hombros. \xA1Vas a bordarlo!",
          speech: "\xA1\xDAltimo entrenamiento antes del examen! Demuestra lo que has aprendido.",
          words: [
            { text: "F J FF JJ", icon: "\u{1F31F}", label: "Ensayo 1" },
            { text: "JF FJ FJF", icon: "\u{1F31F}", label: "Ensayo 2" },
            { text: "FFJJ JFJF", icon: "\u{1F31F}", label: "Ensayo 3" },
            { text: "FJFJ JJFF", icon: "\u{1F31F}", label: "Ensayo final" }
          ]
        }
      ],
      exam: {
        id: "1.exam",
        title: "\u{1F4CB} Gran Examen de los Centinelas (Nivel 1)",
        badge: "\u{1F3C5} Medalla de los Centinelas",
        minAccuracy: 85,
        minWPM: 6,
        speech: "\xA1Atenci\xF3n, cadete! Es la hora de tu primer Examen Oficial. Conf\xEDa en tus dedos y no mires las teclas.",
        passSpeech: "\xA1FANT\xC1STICO! Has superado el Examen del Nivel 1 con honores. \xA1Has ganado tu primera medalla!",
        retrySpeech: "\xA1Buen intento! Tienes mucho talento. Recuerda mantener los \xEDndices en sus marcas y vuelve a probar.",
        words: [
          { text: "F J F J", icon: "\u{1F3AF}", label: "Reto 1: Comp\xE1s" },
          { text: "FF JJ FF JJ", icon: "\u{1F3AF}", label: "Reto 2: Dobles" },
          { text: "FJF JFJ FJ", icon: "\u{1F3AF}", label: "Reto 3: Tr\xEDos" },
          { text: "FFJJ JFJF FJ", icon: "\u{1F3AF}", label: "Reto 4: Flujo" },
          { text: "F J FJ JF JJ FF", icon: "\u{1F3C6}", label: "Reto Final" }
        ]
      }
    },
    // =========================================================================
    // NIVEL 2: La Fila Guía Completa (A, S, D, F / J, K, L, Ñ)
    // =========================================================================
    {
      id: 2,
      slug: "2-filaguia",
      name: "2 - \u{1F3E0} La Fila Gu\xEDa Completa (A S D F / J K L \xD1)",
      shortName: "Fila Gu\xEDa Central",
      beltTier: "blanco",
      minAccuracy: 85,
      minWPM: 8,
      allowedKeys: ["a", "s", "d", "f", "j", "k", "l", "\xF1", " "],
      objective: "Colocar y dominar los 8 dedos descansando en la fila central",
      speech: "\xA1Llega toda la familia de dedos! Descansamos cuatro dedos a la izquierda y cuatro a la derecha.",
      tip: "Cada dedo tiene su tecla: Me\xF1ique en A, anular en S, coraz\xF3n en D, \xEDndice en F; \xEDndice en J, coraz\xF3n en K, anular en L y me\xF1ique en \xD1.",
      lessons: [
        {
          id: "2.1",
          title: "Los dedos coraz\xF3n en acci\xF3n (D y K)",
          tip: "El dedo coraz\xF3n izquierdo pulsa la D y el derecho pulsa la K.",
          speech: "\xA1Dedos del medio! El coraz\xF3n izquierdo en la D y el derecho en la K.",
          words: [
            { text: "D K", icon: "\u{1F49B}", label: "Medios D-K" },
            { text: "K D", icon: "\u{1F49B}", label: "Medios K-D" },
            { text: "DD KK", icon: "\u{1F49B}", label: "Dobles D-K" },
            { text: "DK KD", icon: "\u{1F49B}", label: "Paso D-K" }
          ]
        },
        {
          id: "2.2",
          title: "\xCDndices y corazones coordinados",
          tip: "Alterna F con D a la izquierda, y J con K a la derecha.",
          speech: "\xCDndice y coraz\xF3n trabajando juntos en cada mano.",
          words: [
            { text: "FD JK", icon: "\u{1F43E}", label: "Paso FD-JK" },
            { text: "DF KJ", icon: "\u{1F43E}", label: "Paso DF-KJ" },
            { text: "FDF JKJ", icon: "\u{1F43E}", label: "Tr\xEDo medio" },
            { text: "DFD KJK", icon: "\u{1F43E}", label: "Tr\xEDo medio" }
          ]
        },
        {
          id: "2.3",
          title: "Los dedos anulares se despiertan (S y L)",
          tip: "El anular izquierdo pulsa la S y el anular derecho pulsa la L.",
          speech: "\xA1Llegan los anulares! Mano izquierda en la S, mano derecha en la L.",
          words: [
            { text: "S L", icon: "\u{1F9E1}", label: "Anulares S-L" },
            { text: "L S", icon: "\u{1F9E1}", label: "Anulares L-S" },
            { text: "SS LL", icon: "\u{1F9E1}", label: "Dobles S-L" },
            { text: "SL LS", icon: "\u{1F9E1}", label: "Paso S-L" }
          ]
        },
        {
          id: "2.4",
          title: "Terceto izquierdo (S, D, F)",
          tip: "Anular (S), coraz\xF3n (D) e \xEDndice (F). \xA1Como una escalerita!",
          speech: "Sube la escalerita izquierda: S, D, F.",
          words: [
            { text: "SDF", icon: "\u{1FA9C}", label: "Escalera SDF" },
            { text: "FDS", icon: "\u{1FA9C}", label: "Baja FDS" },
            { text: "SDS FDF", icon: "\u{1FA9C}", label: "Ritmo SDF" },
            { text: "SDF FDS", icon: "\u{1FA9C}", label: "Ida y vuelta" }
          ]
        },
        {
          id: "2.5",
          title: "Terceto derecho (J, K, L)",
          tip: "\xCDndice (J), coraz\xF3n (K) y anular (L).",
          speech: "Ahora la escalerita derecha: J, K, L.",
          words: [
            { text: "JKL", icon: "\u{1FA9C}", label: "Escalera JKL" },
            { text: "LKJ", icon: "\u{1FA9C}", label: "Baja LKJ" },
            { text: "KJK LKL", icon: "\u{1FA9C}", label: "Ritmo JKL" },
            { text: "JKL LKJ", icon: "\u{1FA9C}", label: "Ida y vuelta" }
          ]
        },
        {
          id: "2.6",
          title: "Los peque\xF1os me\xF1iques (A y \xD1)",
          tip: "Los dedos m\xE1s peque\xF1os tienen mucha fuerza: A a la izquierda, \xD1 a la derecha.",
          speech: "\xA1Los me\xF1iques traviesos! A con la izquierda y \xD1 con la derecha.",
          words: [
            { text: "A \xD1", icon: "\u2764\uFE0F", label: "Me\xF1iques A-\xD1" },
            { text: "\xD1 A", icon: "\u2764\uFE0F", label: "Me\xF1iques \xD1-A" },
            { text: "AA \xD1\xD1", icon: "\u2764\uFE0F", label: "Dobles A-\xD1" },
            { text: "A \xD1 A", icon: "\u2764\uFE0F", label: "Paso A-\xD1" }
          ]
        },
        {
          id: "2.7",
          title: "La fila izquierda completa (ASDF)",
          tip: "Los cuatro dedos izquierdos tocan en orden: Me\xF1ique, anular, coraz\xF3n e \xEDndice.",
          speech: "\xA1Toda la mano izquierda afinada! A, S, D, F.",
          words: [
            { text: "ASDF", icon: "\u{1F590}\uFE0F", label: "Mano izq ASDF" },
            { text: "FDSA", icon: "\u{1F590}\uFE0F", label: "Baja FDSA" },
            { text: "AS DF", icon: "\u{1F590}\uFE0F", label: "Pares izq" },
            { text: "ASDF FDSA", icon: "\u{1F590}\uFE0F", label: "Mano completa" }
          ]
        },
        {
          id: "2.8",
          title: "La fila derecha completa (JKL\xD1)",
          tip: "Los cuatro dedos derechos en orden: J, K, L, \xD1.",
          speech: "\xA1Toda la mano derecha afinada! J, K, L, \xD1.",
          words: [
            { text: "JKL\xD1", icon: "\u{1F590}\uFE0F", label: "Mano der JKL\xD1" },
            { text: "\xD1LKJ", icon: "\u{1F590}\uFE0F", label: "Baja \xD1LKJ" },
            { text: "JK L\xD1", icon: "\u{1F590}\uFE0F", label: "Pares der" },
            { text: "JKL\xD1 \xD1LKJ", icon: "\u{1F590}\uFE0F", label: "Mano completa" }
          ]
        },
        {
          id: "2.9",
          title: "Los ocho centinelas juntos",
          tip: "Mant\xE9n todos los deditos descansando como patitas de gatito.",
          speech: "\xA1Ocho dedos sincronizados! Izquierda y derecha altern\xE1ndose.",
          words: [
            { text: "ASDF JKL\xD1", icon: "\u{1F3B9}", label: "Las dos manos" },
            { text: "FDSA \xD1LKJ", icon: "\u{1F3B9}", label: "Regreso" },
            { text: "AF J\xD1", icon: "\u{1F3B9}", label: "Extremos y centro" },
            { text: "FA \xD1J", icon: "\u{1F3B9}", label: "Centro y extremos" }
          ]
        },
        {
          id: "2.10",
          title: "Primeras s\xEDlabas reales de 2 letras",
          tip: "\xA1Ya estamos escribiendo palabras reales en espa\xF1ol!",
          speech: "\xA1Mira qu\xE9 bien! Ya formamos palabras reales de dos letras.",
          words: [
            { text: "LA", icon: "\u{1F3B6}", label: "La m\xFAsica" },
            { text: "DA", icon: "\u{1F381}", label: "Dar" },
            { text: "FA", icon: "\u{1F3BC}", label: "Nota Fa" },
            { text: "AS", icon: "\u{1F0CF}", label: "As de oros" }
          ]
        },
        {
          id: "2.11",
          title: "Palabras m\xE1gicas de 3 letras (Parte 1)",
          tip: "Sal, ala, asa. \xA1Todas se escriben solo con la fila gu\xEDa!",
          speech: "\xA1Palabras completas de tres letras! Lee cada una antes de teclearla.",
          words: [
            { text: "SAL", icon: "\u{1F9C2}", label: "Sal fina" },
            { text: "ALA", icon: "\u{1FABD}", label: "Ala de hada" },
            { text: "ASA", icon: "\u2615", label: "Asa de taza" },
            { text: "LAS", icon: "\u2728", label: "Las estrellas" }
          ]
        },
        {
          id: "2.12",
          title: "Palabras m\xE1gicas de 3 letras (Parte 2)",
          tip: "Acu\xE9rdate de usar el pulgar para el espacio entre palabras.",
          speech: "M\xE1s palabras de la fila central. \xA1Tus dedos vuelan solos!",
          words: [
            { text: "GAS", icon: "\u{1F388}", label: "Globo de gas" },
            { text: "FAS", icon: "\u{1F3DB}\uFE0F", label: "Columnas" },
            { text: "AJA", icon: "\u{1F4A1}", label: "\xA1Aj\xE1!" },
            { text: "ALLA", icon: "\u{1F449}", label: "All\xE1 lejos" }
          ]
        },
        {
          id: "2.13",
          title: "Palabras de 4 letras de la casa",
          tip: "Sala, faja, falda. Sigue el ritmo sin prisas.",
          speech: "\xA1Cuatro letras por palabra! Mant\xE9n el ritmo suave.",
          words: [
            { text: "SALA", icon: "\u{1F6CB}\uFE0F", label: "Sala c\xF3moda" },
            { text: "FAJA", icon: "\u{1F380}", label: "Lazo faja" },
            { text: "FALDA", icon: "\u{1F457}", label: "Falda de vuelo" },
            { text: "SALSA", icon: "\u{1F483}", label: "Baile salsa" }
          ]
        },
        {
          id: "2.14",
          title: "Frases r\xEDtmicas cortas",
          tip: "Separa cada palabra con un toque ligero del pulgar en el espacio.",
          speech: "\xA1Primeras frases! Dos palabras juntas con espacio en el medio.",
          words: [
            { text: "LA SAL", icon: "\u{1F9C2}", label: "La sal" },
            { text: "EL ALA", icon: "\u{1FABD}", label: "El ala" },
            { text: "LA SALA", icon: "\u{1F6CB}\uFE0F", label: "La sala" },
            { text: "DA LA SAL", icon: "\u{1F9C2}", label: "Da la sal" }
          ]
        },
        {
          id: "2.15",
          title: "Gran ensayo de la Fila Gu\xEDa",
          tip: "Los 8 dedos relajados. \xA1Todo listo para el examen de la fila gu\xEDa!",
          speech: "\xA1Excelente entrenamiento! Ya dominas la fila central al completo.",
          words: [
            { text: "SAL LA SALA", icon: "\u{1F31F}", label: "Ensayo 1" },
            { text: "LA FALDA FALLA", icon: "\u{1F31F}", label: "Ensayo 2" },
            { text: "ALLA DA LA SAL", icon: "\u{1F31F}", label: "Ensayo 3" },
            { text: "ASDF JKL\xD1 SALA", icon: "\u{1F31F}", label: "Ensayo 4" }
          ]
        }
      ],
      exam: {
        id: "2.exam",
        title: "\u{1F4CB} Gran Examen de la Fila Gu\xEDa (Nivel 2)",
        badge: "\u{1F3C5} Medalla de la Fila Gu\xEDa",
        minAccuracy: 85,
        minWPM: 8,
        speech: "\xA1Lleg\xF3 la prueba de fuego de la Fila Gu\xEDa! Los ocho dedos listos en sus teclas base.",
        passSpeech: "\xA1INCRE\xCDBLE! Dominas los 8 dedos de la fila gu\xEDa como un aut\xE9ntico profesional. \xA1Medalla concedida!",
        retrySpeech: "\xA1Casi lo tienes! Repasa la posici\xF3n de los 8 dedos y vuelve a intentarlo, lo lograr\xE1s muy pronto.",
        words: [
          { text: "ASDF JKL\xD1", icon: "\u{1F3AF}", label: "Reto 1: 8 Dedos" },
          { text: "SAL ALA ASA LAS", icon: "\u{1F3AF}", label: "Reto 2: Palabras" },
          { text: "LA FALDA DE LA SALA", icon: "\u{1F3AF}", label: "Reto 3: Frase corta" },
          { text: "ALLA DA LA SAL A LA FAJA", icon: "\u{1F3AF}", label: "Reto 4: Frase fluida" },
          { text: "LA SALSA DE LA SALA SALADA", icon: "\u{1F3C6}", label: "Reto Final" }
        ]
      }
    },
    // =========================================================================
    // NIVEL 3: El Salto Superior (Vocales E, I y Dedos Índices R, U)
    // =========================================================================
    {
      id: 3,
      slug: "3-vocales-ei",
      name: "3 - \u2728 El Salto Superior (Vocales E/I y R/U)",
      shortName: "Vocales E/I y R/U",
      beltTier: "amarillo",
      minAccuracy: 90,
      minWPM: 10,
      allowedKeys: ["a", "s", "d", "f", "j", "k", "l", "\xF1", "e", "i", "r", "u", " "],
      objective: "Movimiento vertical de dedos medios e \xEDndices arriba, volviendo siempre a casa",
      speech: "\xA1Subimos un piso! Los dedos medios suben a la E y a la I, y los \xEDndices a la R y a la U.",
      tip: "Sube el dedo un paso, pulsa la tecla superior y devu\xE9lvelo inmediatamente a la fila gu\xEDa.",
      lessons: [
        {
          id: "3.1",
          title: "El salto a la vocal E",
          tip: "Dedo coraz\xF3n izquierdo sube de la D a la E y vuelve a la D.",
          speech: "\xA1El coraz\xF3n izquierdo sube a la E! Sube, pulsa y vuelve a casa.",
          words: [
            { text: "DE", icon: "\u2B06\uFE0F", label: "Subida D-E" },
            { text: "ED", icon: "\u2B06\uFE0F", label: "Bajada E-D" },
            { text: "DED", icon: "\u2B06\uFE0F", label: "Salto D-E-D" },
            { text: "DEEDE", icon: "\u2B06\uFE0F", label: "Paso E" }
          ]
        },
        {
          id: "3.2",
          title: "El salto a la vocal I",
          tip: "Dedo coraz\xF3n derecho sube de la K a la I y vuelve a la K.",
          speech: "\xA1El coraz\xF3n derecho sube a la I! Arriba y a casa.",
          words: [
            { text: "KI", icon: "\u2B06\uFE0F", label: "Subida K-I" },
            { text: "IK", icon: "\u2B06\uFE0F", label: "Bajada I-K" },
            { text: "KIK", icon: "\u2B06\uFE0F", label: "Salto K-I-K" },
            { text: "KIIKI", icon: "\u2B06\uFE0F", label: "Paso I" }
          ]
        },
        {
          id: "3.3",
          title: "Danza de las vocales E e I",
          tip: "Coraz\xF3n izquierdo (E) y coraz\xF3n derecho (I) altern\xE1ndose.",
          speech: "E a la izquierda, I a la derecha. \xA1Las dos vocales m\xE1s alegres!",
          words: [
            { text: "E I", icon: "\u2728", label: "Vocales E-I" },
            { text: "I E", icon: "\u2728", label: "Vocales I-E" },
            { text: "DE KI", icon: "\u2728", label: "Medios arriba" },
            { text: "ED IK", icon: "\u2728", label: "Medios a casa" }
          ]
        },
        {
          id: "3.4",
          title: "Salto del \xEDndice izquierdo a la R",
          tip: "\xCDndice izquierdo sube de la F a la R.",
          speech: "\xA1\xCDndice izquierdo arriba a la R! Fuerte como un rugido.",
          words: [
            { text: "FR", icon: "\u{1F981}", label: "Subida F-R" },
            { text: "RF", icon: "\u{1F981}", label: "Bajada R-F" },
            { text: "FRF", icon: "\u{1F981}", label: "Salto F-R-F" },
            { text: "RED", icon: "\u{1F981}", label: "Palabra Red" }
          ]
        },
        {
          id: "3.5",
          title: "Salto del \xEDndice derecho a la U",
          tip: "\xCDndice derecho sube de la J a la U.",
          speech: "\xA1\xCDndice derecho arriba a la U! Suave como una ola.",
          words: [
            { text: "JU", icon: "\u{1F30A}", label: "Subida J-U" },
            { text: "UJ", icon: "\u{1F30A}", label: "Bajada U-J" },
            { text: "JUJ", icon: "\u{1F30A}", label: "Salto J-U-J" },
            { text: "SUR", icon: "\u{1F30A}", label: "Palabra Sur" }
          ]
        },
        {
          id: "3.6",
          title: "Los cuatro saltadores superiores (E, I, R, U)",
          tip: "Combina saltos de \xEDndices y corazones de ambas manos.",
          speech: "\xA1Cuatro teclas arriba dominadas! E, I, R y U.",
          words: [
            { text: "ER IU", icon: "\u{1F680}", label: "Pares sup" },
            { text: "RE UI", icon: "\u{1F680}", label: "Pares sup" },
            { text: "RIE FUE", icon: "\u{1F680}", label: "Diptongos" },
            { text: "RIO SUR", icon: "\u{1F680}", label: "Palabras" }
          ]
        },
        {
          id: "3.7",
          title: "S\xEDlabas ricas en espa\xF1ol con E",
          tip: "De, re, se, le, fe.",
          speech: "\xA1S\xEDlabas con la E! Muy \xFAtiles para escribir historias.",
          words: [
            { text: "DE RE", icon: "\u{1F3BC}", label: "De Re" },
            { text: "SE LE", icon: "\u{1F3BC}", label: "Se Le" },
            { text: "FE ME", icon: "\u{1F3BC}", label: "Fe Me" },
            { text: "EL ES", icon: "\u{1F3BC}", label: "El Es" }
          ]
        },
        {
          id: "3.8",
          title: "S\xEDlabas ricas en espa\xF1ol con I",
          tip: "Di, si, li, fi, ri.",
          speech: "\xA1S\xEDlabas con la I! Finas y cantarinas.",
          words: [
            { text: "DI SI", icon: "\u{1F514}", label: "Di Si" },
            { text: "LI FI", icon: "\u{1F514}", label: "Li Fi" },
            { text: "RI IR", icon: "\u{1F514}", label: "Ri Ir" },
            { text: "SI QUE", icon: "\u{1F514}", label: "Si Que" }
          ]
        },
        {
          id: "3.9",
          title: "Palabras reales de tres letras",
          tip: "Sed, red, dia, rio, lio.",
          speech: "\xA1Palabras completas con vocales superiores!",
          words: [
            { text: "SED", icon: "\u{1F4A7}", label: "Gota de agua" },
            { text: "RED", icon: "\u{1F578}\uFE0F", label: "Red m\xE1gica" },
            { text: "DIA", icon: "\u2600\uFE0F", label: "D\xEDa de sol" },
            { text: "RIO", icon: "\u{1F3DE}\uFE0F", label: "R\xEDo azul" }
          ]
        },
        {
          id: "3.10",
          title: "Vocabulario brillante de 4 letras",
          tip: "Isla, lila, fiel, seda.",
          speech: "\xA1Mira cu\xE1ntas palabras tan bonitas est\xE1s escribiendo!",
          words: [
            { text: "ISLA", icon: "\u{1F3DD}\uFE0F", label: "Isla del tesoro" },
            { text: "LILA", icon: "\u{1F338}", label: "Flor lila" },
            { text: "FIEL", icon: "\u{1F436}", label: "Perrito fiel" },
            { text: "SEDA", icon: "\u{1F9E3}", label: "Seda suave" }
          ]
        },
        {
          id: "3.11",
          title: "Palabras de amistad y familia",
          tip: "Ella, leal, idea, fila.",
          speech: "Palabras de cari\xF1o y compa\xF1erismo.",
          words: [
            { text: "ELLA", icon: "\u{1F467}", label: "Ella" },
            { text: "LEAL", icon: "\u{1F91D}", label: "Amigo leal" },
            { text: "IDEA", icon: "\u{1F4A1}", label: "Gran idea" },
            { text: "FILA", icon: "\u{1F6B6}", label: "Fila india" }
          ]
        },
        {
          id: "3.12",
          title: "Palabras ricas de 5 letras",
          tip: "Fideo, rueda, feria, reina.",
          speech: "\xA1Palabras largas de 5 letras! Est\xE1s avanzando a pasos agigantados.",
          words: [
            { text: "FIDEO", icon: "\u{1F35C}", label: "Fideo rico" },
            { text: "RUEDA", icon: "\u{1F6DE}", label: "Rueda veloz" },
            { text: "FERIA", icon: "\u{1F3A1}", label: "Feria alegre" },
            { text: "REINA", icon: "\u{1F451}", label: "Reina buena" }
          ]
        },
        {
          id: "3.13",
          title: "Cadenas de dos palabras",
          tip: "Pulgar en el espacio entre ambas palabras.",
          speech: "Frases de dos palabras con espacio intermedio.",
          words: [
            { text: "LA ISLA", icon: "\u{1F3DD}\uFE0F", label: "La isla" },
            { text: "EL RIO", icon: "\u{1F3DE}\uFE0F", label: "El r\xEDo" },
            { text: "MI FIEL", icon: "\u{1F436}", label: "Mi fiel" },
            { text: "LA SEDA", icon: "\u{1F9E3}", label: "La seda" }
          ]
        },
        {
          id: "3.14",
          title: "Oraciones completas de la fila superior",
          tip: "Lee toda la frase antes de teclear y mant\xE9n un ritmo continuo.",
          speech: "\xA1Oraciones completas! Siente el ritmo fluido de los dedos.",
          words: [
            { text: "EL DIA ES LILA", icon: "\u{1F305}", label: "El d\xEDa es lila" },
            { text: "ELLA ES LEAL", icon: "\u{1F91D}", label: "Ella es leal" },
            { text: "LA ISLA DEL RIO", icon: "\u{1F3DE}\uFE0F", label: "La isla del r\xEDo" },
            { text: "LA REINA RIE FIEL", icon: "\u{1F451}", label: "La reina r\xEDe fiel" }
          ]
        },
        {
          id: "3.15",
          title: "Desaf\xEDo de agilidad y memoria motriz",
          tip: "Manos relajadas y mu\xF1ecas flotando suavemente.",
          speech: "\xA1\xDAltimo repaso antes del examen del Nivel 3! Est\xE1s listo.",
          words: [
            { text: "ISLA RIO SEDA FIEL", icon: "\u{1F31F}", label: "Repaso 1" },
            { text: "LA REINA EN LA FERIA", icon: "\u{1F31F}", label: "Repaso 2" },
            { text: "EL FIDEO EN LA MESA", icon: "\u{1F31F}", label: "Repaso 3" },
            { text: "ELLA RIE FELIZ AL SOL", icon: "\u{1F31F}", label: "Repaso 4" }
          ]
        }
      ],
      exam: {
        id: "3.exam",
        title: "\u{1F4CB} Gran Examen del Salto Superior (Nivel 3)",
        badge: "\u{1F3C5} Medalla del Salto Superior",
        minAccuracy: 90,
        minWPM: 10,
        speech: "\xA1Examen de Acreditaci\xF3n del Salto Superior! Demuestra la precisi\xF3n de tus dedos medios e \xEDndices.",
        passSpeech: "\xA1ESPECTACULAR! Has superado el Examen de Nivel 3 con un dominio vertical asombroso. \xA1Cintur\xF3n Amarillo desbloqueado!",
        retrySpeech: "\xA1Muy buen esfuerzo! El salto a la E y a la I requiere pr\xE1ctica. Repasa las lecciones y repite enseguida.",
        words: [
          { text: "DED KIK FRF JUJ", icon: "\u{1F3AF}", label: "Reto 1: Saltos" },
          { text: "ISLA LILA FIEL SEDA", icon: "\u{1F3AF}", label: "Reto 2: Palabras" },
          { text: "EL RIO DE LA ISLA FELIZ", icon: "\u{1F3AF}", label: "Reto 3: Oraci\xF3n" },
          { text: "LA REINA LEAL DA SU RUEDA", icon: "\u{1F3AF}", label: "Reto 4: Fluidez" },
          { text: "ELLA RIE AL VER EL DIA LILA", icon: "\u{1F3C6}", label: "Reto Final" }
        ]
      }
    },
    // =========================================================================
    // NIVEL 4: La Expansión Superior Completa (O, U, P, Q, W, T, Y)
    // =========================================================================
    {
      id: 4,
      slug: "4-expansion",
      name: "4 - \u{1F34E} La Expansi\xF3n Superior Completa (O, U, P, Q, W, T, Y)",
      shortName: "Vocales O/U y P,Q,W,T,Y",
      beltTier: "amarillo",
      minAccuracy: 90,
      minWPM: 12,
      allowedKeys: ["a", "s", "d", "f", "j", "k", "l", "\xF1", "e", "i", "r", "u", "o", "p", "q", "w", "t", "y", "c", "m", " "],
      objective: "Completar todas las vocales y consonantes superiores",
      speech: "\xA1El piso superior al completo! Llegan la O, la P, la T, la Q y todas las consonantes divertidas.",
      tip: "El anular derecho sube a la O y el me\xF1ique derecho a la P. Mant\xE9n el resto de dedos en su sitio.",
      lessons: [
        {
          id: "4.1",
          title: "El salto a la vocal O (Anular derecho)",
          tip: "Anular derecho sube de la L a la O y vuelve a la L.",
          speech: "\xA1El anular derecho sube a la O! Redondita como una rosquilla.",
          words: [
            { text: "LO", icon: "\u{1F369}", label: "Subida L-O" },
            { text: "OL", icon: "\u{1F369}", label: "Bajada O-L" },
            { text: "LOL", icon: "\u{1F369}", label: "Salto L-O-L" },
            { text: "OSO", icon: "\u{1F43B}", label: "Oso mimoso" }
          ]
        },
        {
          id: "4.2",
          title: "El salto a la P (Me\xF1ique derecho)",
          tip: "Me\xF1ique derecho sube de la \xD1 a la P.",
          speech: "\xA1Me\xF1ique derecho arriba a la P! Con suavidad y destreza.",
          words: [
            { text: "PO", icon: "\u{1F388}", label: "Salto O-P" },
            { text: "OP", icon: "\u{1F388}", label: "Bajada P-O" },
            { text: "POP", icon: "\u{1F388}", label: "Toque Pop" },
            { text: "POLO", icon: "\u{1F367}", label: "Polo fr\xEDo" }
          ]
        },
        {
          id: "4.3",
          title: "Parejas ricas O y P",
          tip: "Combina el anular (O) y me\xF1ique (P) de la mano derecha.",
          speech: "Palabras con O y P: sopa, copa, palo, pelo.",
          words: [
            { text: "SOPA", icon: "\u{1F963}", label: "Sopa rica" },
            { text: "COPA", icon: "\u{1F3C6}", label: "Copa trofeo" },
            { text: "PALO", icon: "\u{1FAB5}", label: "Palo de madera" },
            { text: "PELO", icon: "\u{1F487}", label: "Pelo limpio" }
          ]
        },
        {
          id: "4.4",
          title: "El me\xF1ique izquierdo sube a la Q",
          tip: "Me\xF1ique izquierdo sube de la A a la Q.",
          speech: "\xA1Me\xF1ique izquierdo arriba a la Q! Para escribir palabras como queso.",
          words: [
            { text: "QA", icon: "\u{1F9C0}", label: "Subida A-Q" },
            { text: "QUE", icon: "\u{1F9C0}", label: "S\xEDlaba Que" },
            { text: "AQUI", icon: "\u{1F9C0}", label: "Aqu\xED" },
            { text: "QUESO", icon: "\u{1F9C0}", label: "Rico queso" }
          ]
        },
        {
          id: "4.5",
          title: "El anular izquierdo sube a la W",
          tip: "Anular izquierdo sube de la S a la W.",
          speech: "\xA1Anular izquierdo arriba a la W! Para palabras curiosas como web o kiwi.",
          words: [
            { text: "WS", icon: "\u{1F95D}", label: "Subida S-W" },
            { text: "SW", icon: "\u{1F95D}", label: "Bajada W-S" },
            { text: "WEB", icon: "\u{1F310}", label: "P\xE1gina web" },
            { text: "KIWI", icon: "\u{1F95D}", label: "Kiwi verde" }
          ]
        },
        {
          id: "4.6",
          title: "El \xEDndice izquierdo alcanza la T",
          tip: "\xCDndice izquierdo sube de la F hacia la T (al lado de la R).",
          speech: "\xA1\xCDndice izquierdo arriba a la T! Pato, tomate, pelota.",
          words: [
            { text: "FT", icon: "\u{1F986}", label: "Salto F-T" },
            { text: "TF", icon: "\u{1F986}", label: "Bajada T-F" },
            { text: "FTF", icon: "\u{1F986}", label: "Comp\xE1s T" },
            { text: "PATO", icon: "\u{1F986}", label: "Pato feliz" }
          ]
        },
        {
          id: "4.7",
          title: "El \xEDndice derecho alcanza la Y",
          tip: "\xCDndice derecho sube de la J hacia la Y (al lado de la U).",
          speech: "\xA1\xCDndice derecho arriba a la Y! Yate, payaso, rey.",
          words: [
            { text: "JY", icon: "\u26F5", label: "Salto J-Y" },
            { text: "YJ", icon: "\u26F5", label: "Bajada Y-J" },
            { text: "JYJ", icon: "\u26F5", label: "Comp\xE1s Y" },
            { text: "YATE", icon: "\u26F5", label: "Yate blanco" }
          ]
        },
        {
          id: "4.8",
          title: "La familia de la P (pa, pe, pi, po, pu)",
          tip: "Todas las vocales combinadas con la letra P.",
          speech: "\xA1Toda la familia de la P! Pa, pe, pi, po, pu.",
          words: [
            { text: "PA PE", icon: "\u{1F43E}", label: "Pa Pe" },
            { text: "PI PO", icon: "\u{1F43E}", label: "Pi Po" },
            { text: "PU PA", icon: "\u{1F43E}", label: "Pu Pa" },
            { text: "PAPA PIPA", icon: "\u{1F43E}", label: "Palabras P" }
          ]
        },
        {
          id: "4.9",
          title: "La familia de la T (ta, te, ti, to, tu)",
          tip: "Todas las vocales combinadas con la letra T.",
          speech: "\xA1Toda la familia de la T! Ta, te, ti, to, tu.",
          words: [
            { text: "TA TE", icon: "\u{1F941}", label: "Ta Te" },
            { text: "TI TO", icon: "\u{1F941}", label: "Ti To" },
            { text: "TU TA", icon: "\u{1F941}", label: "Tu Ta" },
            { text: "TAZA PATO", icon: "\u{1F941}", label: "Palabras T" }
          ]
        },
        {
          id: "4.10",
          title: "Animales y naturaleza de 4 letras",
          tip: "Pato, gato, sapo, lobo, loro.",
          speech: "\xA1Escribimos animales amigos! Pato, sapo, loro, puma.",
          words: [
            { text: "PATO", icon: "\u{1F986}", label: "Pato" },
            { text: "SAPO", icon: "\u{1F438}", label: "Sapo verde" },
            { text: "LORO", icon: "\u{1F99C}", label: "Loro cantor" },
            { text: "PUMA", icon: "\u{1F406}", label: "Puma \xE1gil" }
          ]
        },
        {
          id: "4.11",
          title: "Comida y cosas ricas de 4 letras",
          tip: "Sopa, pur\xE9, tarta, pera.",
          speech: "\xA1Cosas deliciosas para merendar! Sopa, queso, pera.",
          words: [
            { text: "SOPA", icon: "\u{1F963}", label: "Sopa rica" },
            { text: "QUESO", icon: "\u{1F9C0}", label: "Queso tierno" },
            { text: "PERA", icon: "\u{1F350}", label: "Pera dulce" },
            { text: "TARTA", icon: "\u{1F967}", label: "Tarta rica" }
          ]
        },
        {
          id: "4.12",
          title: "Palabras divertidas de 6 letras",
          tip: "Tomate, payaso, pelota, quiosco.",
          speech: "\xA1Palabras largas de 6 letras! Tus dedos son ya super veloces.",
          words: [
            { text: "TOMATE", icon: "\u{1F345}", label: "Tomate rojo" },
            { text: "PAYASO", icon: "\u{1F921}", label: "Payaso alegre" },
            { text: "PELOTA", icon: "\u26BD", label: "Pelota de juego" },
            { text: "PAQUETE", icon: "\u{1F4E6}", label: "Paquete sorpresa" }
          ]
        },
        {
          id: "4.13",
          title: "Parejas de palabras con espacio",
          tip: "El pato, la sopa, mi queso, la pelota.",
          speech: "Parejas de palabras coordinadas con el pulgar.",
          words: [
            { text: "EL PATO", icon: "\u{1F986}", label: "El pato" },
            { text: "LA SOPA", icon: "\u{1F963}", label: "La sopa" },
            { text: "MI QUESO", icon: "\u{1F9C0}", label: "Mi queso" },
            { text: "EL LORO", icon: "\u{1F99C}", label: "El loro" }
          ]
        },
        {
          id: "4.14",
          title: "Frases completas de la fila superior",
          tip: "Escribe a ritmo constante sin pausas bruscas.",
          speech: "\xA1Frases completas! Qu\xE9 bien lees y escribes a la vez.",
          words: [
            { text: "EL PATO COME SOPA", icon: "\u{1F986}", label: "El pato come sopa" },
            { text: "EL LORO PIDE QUESO", icon: "\u{1F99C}", label: "El loro pide queso" },
            { text: "LA TARTA DE TOMATE", icon: "\u{1F967}", label: "La tarta de tomate" },
            { text: "EL PAYASO TIRA LA PELOTA", icon: "\u{1F921}", label: "El payaso tira la pelota" }
          ]
        },
        {
          id: "4.15",
          title: "Gran desaf\xEDo pre-examen del piso superior",
          tip: "\xA1Todo el piso superior listo para ser evaluado!",
          speech: "\xA1\xDAltimo ensayo! Mant\xE9n la calma y disfruta escribiendo.",
          words: [
            { text: "PATO LORO QUESO TOMATE", icon: "\u{1F31F}", label: "Repaso 1" },
            { text: "EL PAYASO TOCA LA PELOTA", icon: "\u{1F31F}", label: "Repaso 2" },
            { text: "EL PUMA SALTA EN LA PLAYA", icon: "\u{1F31F}", label: "Repaso 3" },
            { text: "MI LORO COME PERA Y QUESO", icon: "\u{1F31F}", label: "Repaso 4" }
          ]
        }
      ],
      exam: {
        id: "4.exam",
        title: "\u{1F4CB} Gran Examen de la Expansi\xF3n Superior (Nivel 4)",
        badge: "\u{1F3C5} Medalla del Teclado Superior",
        minAccuracy: 90,
        minWPM: 12,
        speech: "\xA1Examen Oficial del Teclado Superior Completo! Todas las vocales y consonantes en juego.",
        passSpeech: "\xA1MAGISTRAL! Has conquistado todo el piso superior del teclado. \xA1Medalla de honor y pase al Nivel 5!",
        retrySpeech: "\xA1Gran esfuerzo! Las teclas superiores como la P y la T requieren pr\xE1ctica. \xA1Vuelve a intentarlo ya mismo!",
        words: [
          { text: "PATO QUESO LORO TOMATE", icon: "\u{1F3AF}", label: "Reto 1: Palabras" },
          { text: "EL PAYASO JUEGA PELOTA", icon: "\u{1F3AF}", label: "Reto 2: Oraci\xF3n" },
          { text: "MI LORO PIDE SOPA Y QUESO", icon: "\u{1F3AF}", label: "Reto 3: Ritmo" },
          { text: "EL PUMA COME PERA EN LA PLAYA", icon: "\u{1F3AF}", label: "Reto 4: Vocabulario" },
          { text: "UN PATO Y UN LORO JUEGAN PELOTA", icon: "\u{1F3C6}", label: "Reto Final" }
        ]
      }
    },
    // =========================================================================
    // NIVEL 5: La Fila Inferior y Puntuación (Z, X, C, V, B, N, M, Coma y Punto)
    // =========================================================================
    {
      id: 5,
      slug: "5-frases",
      name: "5 - \u{1F31F} La Fila Inferior y Puntuaci\xF3n Completa",
      shortName: "Fila Inferior y Signos",
      beltTier: "verde",
      minAccuracy: 90,
      minWPM: 15,
      allowedKeys: ["a", "s", "d", "f", "j", "k", "l", "\xF1", "e", "i", "r", "u", "o", "p", "q", "w", "t", "y", "z", "x", "c", "v", "b", "n", "m", ",", ".", " "],
      objective: "Bajar los dedos a la fila inferior sin mover las palmas y usar signos de puntuaci\xF3n",
      speech: "\xA1Bajamos a la planta baja! Llegan la V, B, N, M, C, X, Z y los signos de coma y punto. \xA1El teclado entero es tuyo!",
      tip: "Baja los dedos suavemente hacia abajo y regresa enseguida a la posici\xF3n base en la fila gu\xEDa.",
      lessons: [
        {
          id: "5.1",
          title: "Los \xEDndices bajan a la V y a la B",
          tip: "\xCDndice izquierdo baja de la F a la V (directo) y a la B (un pasito a la derecha).",
          speech: "\xA1\xCDndice izquierdo abajo! Vaca con la V, barco con la B.",
          words: [
            { text: "FV FB", icon: "\u{1F404}", label: "Bajada F-V-B" },
            { text: "VF BF", icon: "\u{1F404}", label: "Subida a casa" },
            { text: "VACA", icon: "\u{1F404}", label: "Vaca lechera" },
            { text: "BARCO", icon: "\u26F5", label: "Barco pirata" }
          ]
        },
        {
          id: "5.2",
          title: "Los \xEDndices bajan a la M y a la N",
          tip: "\xCDndice derecho baja de la J a la M (directo) y a la N (un pasito a la izquierda).",
          speech: "\xA1\xCDndice derecho abajo! Mano con la M, nido con la N.",
          words: [
            { text: "JM JN", icon: "\u270B", label: "Bajada J-M-N" },
            { text: "MJ NJ", icon: "\u270B", label: "Subida a casa" },
            { text: "MANO", icon: "\u270B", label: "Mano amiga" },
            { text: "NIDO", icon: "\u{1FABA}", label: "Nido de aves" }
          ]
        },
        {
          id: "5.3",
          title: "El coraz\xF3n izquierdo baja a la C",
          tip: "Dedo coraz\xF3n izquierdo baja de la D a la C.",
          speech: "\xA1Coraz\xF3n izquierdo abajo a la C! Casa, cine, cielo.",
          words: [
            { text: "DC", icon: "\u{1F3E0}", label: "Bajada D-C" },
            { text: "CD", icon: "\u{1F3E0}", label: "Subida C-D" },
            { text: "DCD", icon: "\u{1F3E0}", label: "Salto D-C-D" },
            { text: "CASA", icon: "\u{1F3E0}", label: "Casa bonita" }
          ]
        },
        {
          id: "5.4",
          title: "El coraz\xF3n derecho baja a la coma (,)",
          tip: "Dedo coraz\xF3n derecho baja de la K a la coma (,).",
          speech: "\xA1Coraz\xF3n derecho abajo a la coma! Para respirar y separar palabras.",
          words: [
            { text: "K,", icon: "comma", label: "Bajada K-," },
            { text: ",K", icon: "comma", label: "Subida ,-K" },
            { text: "SOL,", icon: "\u2600\uFE0F", label: "Sol con coma" },
            { text: "MAR,", icon: "\u{1F30A}", label: "Mar con coma" }
          ]
        },
        {
          id: "5.5",
          title: "El anular izquierdo baja a la X",
          tip: "Anular izquierdo baja de la S a la X.",
          speech: "\xA1Anular izquierdo abajo a la X! Taxi, texto, \xE9xito.",
          words: [
            { text: "SX", icon: "\u{1F695}", label: "Bajada S-X" },
            { text: "XS", icon: "\u{1F695}", label: "Subida X-S" },
            { text: "SXS", icon: "\u{1F695}", label: "Salto S-X-S" },
            { text: "TAXI", icon: "\u{1F695}", label: "Taxi veloz" }
          ]
        },
        {
          id: "5.6",
          title: "El me\xF1ique izquierdo baja a la Z",
          tip: "Me\xF1ique izquierdo baja de la A a la Z.",
          speech: "\xA1Me\xF1ique izquierdo abajo a la Z! Zapato, zorro, taza.",
          words: [
            { text: "AZ", icon: "\u{1F98A}", label: "Bajada A-Z" },
            { text: "ZA", icon: "\u{1F98A}", label: "Subida Z-A" },
            { text: "AZA", icon: "\u{1F98A}", label: "Salto A-Z-A" },
            { text: "ZORRO", icon: "\u{1F98A}", label: "Zorro listo" }
          ]
        },
        {
          id: "5.7",
          title: "El anular derecho baja al punto (.)",
          tip: "Anular derecho baja de la L al punto (.).",
          speech: "\xA1Anular derecho abajo al punto! Para terminar una frase perfecta.",
          words: [
            { text: "L.", icon: "dot", label: "Bajada L-." },
            { text: ".L", icon: "dot", label: "Subida .-L" },
            { text: "FIN.", icon: "\u{1F3C1}", label: "Fin con punto" },
            { text: "SOL.", icon: "\u2600\uFE0F", label: "Sol con punto" }
          ]
        },
        {
          id: "5.8",
          title: "S\xEDlabas de la planta baja (ba, va, ma, na, ca, za)",
          tip: "Todas las consonantes inferiores coordinadas con vocales.",
          speech: "\xA1S\xEDlabas de la fila inferior! Siente la coordinaci\xF3n de las tres alturas.",
          words: [
            { text: "BA VA", icon: "\u{1F3B5}", label: "Ba Va" },
            { text: "MA NA", icon: "\u{1F3B5}", label: "Ma Na" },
            { text: "CA ZA", icon: "\u{1F3B5}", label: "Ca Za" },
            { text: "PAN VAN", icon: "\u{1F3B5}", label: "Pan Van" }
          ]
        },
        {
          id: "5.9",
          title: "Palabras de 4 letras de la fila inferior",
          tip: "Vaca, bote, mano, nido, cine, taza.",
          speech: "\xA1Palabras completas de la fila baja! Escribe fluido y seguro.",
          words: [
            { text: "VACA", icon: "\u{1F404}", label: "Vaca" },
            { text: "BOTE", icon: "\u26F5", label: "Bote" },
            { text: "MANO", icon: "\u270B", label: "Mano" },
            { text: "CINE", icon: "\u{1F3AC}", label: "Cine" }
          ]
        },
        {
          id: "5.10",
          title: "Palabras m\xE1gicas de 5 letras de todo el teclado",
          tip: "Barco, noche, verde, cielo, zorro.",
          speech: "\xA1Tres filas alfanum\xE9ricas combinadas! Ya eres un aut\xE9ntico mecan\xF3grafo.",
          words: [
            { text: "BARCO", icon: "\u26F5", label: "Barco veloz" },
            { text: "NOCHE", icon: "\u{1F319}", label: "Noche estrellada" },
            { text: "VERDE", icon: "\u{1F343}", label: "Color verde" },
            { text: "CIELO", icon: "\u2601\uFE0F", label: "Cielo azul" }
          ]
        },
        {
          id: "5.11",
          title: "Palabras de 6 y 7 letras",
          tip: "Manzana, planeta, zapato, m\xFAsica.",
          speech: "\xA1Palabras largas y ricas! Mira qu\xE9 bien coordinas los 10 dedos.",
          words: [
            { text: "MANZANA", icon: "\u{1F34E}", label: "Manzana roja" },
            { text: "PLANETA", icon: "\u{1FA90}", label: "Planeta tierra" },
            { text: "ZAPATO", icon: "\u{1F45F}", label: "Zapato c\xF3modo" },
            { text: "MUSICA", icon: "\u{1F3B5}", label: "M\xFAsica alegre" }
          ]
        },
        {
          id: "5.12",
          title: "Listas con coma (,)",
          tip: "Usa la coma para hacer una pausa suave.",
          speech: "\xA1Listas con comas! Como cuando hacemos la lista de la compra.",
          words: [
            { text: "SOL, MAR, PAN", icon: "\u{1F30A}", label: "Sol, mar, pan" },
            { text: "CASA, MESA, CAMA", icon: "\u{1F3E0}", label: "Casa, mesa, cama" },
            { text: "VACA, PATO, LORO", icon: "\u{1F986}", label: "Vaca, pato, loro" },
            { text: "ROJO, VERDE, AZUL", icon: "\u{1F3A8}", label: "Rojo, verde, azul" }
          ]
        },
        {
          id: "5.13",
          title: "Oraciones cortas con punto final",
          tip: "Toda buena oraci\xF3n termina con un punto.",
          speech: "\xA1Oraciones con punto final! Estructura perfecta.",
          words: [
            { text: "EL PERRO CORRE.", icon: "\u{1F436}", label: "El perro corre." },
            { text: "EL GATO SALTA.", icon: "\u{1F431}", label: "El gato salta." },
            { text: "EL BARCO NAVEGA.", icon: "\u26F5", label: "El barco navega." },
            { text: "LA LUNA BRILLA.", icon: "\u{1F319}", label: "La luna brilla." }
          ]
        },
        {
          id: "5.14",
          title: "Oraciones completas con comas y puntos",
          tip: "Pausa en la coma y cierra en el punto.",
          speech: "\xA1Oraciones narrativas completas! Ya escribes como un escritor.",
          words: [
            { text: "EL PERRO CORRE, EL GATO SALTA.", icon: "\u{1F43E}", label: "Perro y gato" },
            { text: "LA MANZANA ES DULCE, ROJA Y RICA.", icon: "\u{1F34E}", label: "Manzana dulce" },
            { text: "UN BARCO NAVEGA, VELOZ EN EL MAR.", icon: "\u26F5", label: "Barco en el mar" },
            { text: "UN ZORRO VELOZ VIAJA EN TAXI.", icon: "\u{1F98A}", label: "Zorro en taxi" }
          ]
        },
        {
          id: "5.15",
          title: "Gran Ensayo de Graduaci\xF3n Elemental",
          tip: "Respira tranquilo y disfruta. \xA1Est\xE1s a un paso de tu T\xEDtulo Oficial!",
          speech: "\xA1\xDAltimo ensayo antes del Gran Examen de Acreditaci\xF3n! Todo tu esfuerzo se va a reflejar aqu\xED.",
          words: [
            { text: "VACA BARCO MANO CINE ZORRO TAXI.", icon: "\u{1F31F}", label: "Ensayo 1" },
            { text: "EL BARCO VERDE NAVEGA POR EL MAR AZUL.", icon: "\u{1F31F}", label: "Ensayo 2" },
            { text: "LA MANZANA ES DULCE, EL CIELO ESTA CLARO.", icon: "\u{1F31F}", label: "Ensayo 3" },
            { text: "UN ZORRO COME MANZANA, QUESO Y PAN.", icon: "\u{1F31F}", label: "Ensayo 4" }
          ]
        }
      ],
      exam: {
        id: "5.exam",
        title: "\u{1F4CB} Gran Examen Oficial de Mecanograf\xEDa Elemental (Nivel 5)",
        badge: "\u{1F393} T\xEDtulo de Mecan\xF3grafo Junior",
        minAccuracy: 90,
        minWPM: 15,
        isGraduationExam: true,
        diplomaTitle: "T\xEDtulo Oficial de Mecan\xF3grafo/a de Grado Elemental",
        speech: "\xA1ATENCI\xD3N! Este es el Gran Examen Oficial de Grado Elemental. Si lo apruebas, recibir\xE1s tu T\xCDTULO OFICIAL DE MECANOGRAF\xCDA homologado por la Academia Mecano.",
        passSpeech: "\xA1ENHORABUENA! \xA1HAS APROBADO EL GRAN EXAMEN! Roby y toda la academia te otorgan con orgullo tu T\xCDTULO OFICIAL DE MECANOGRAF\xCDA. \xA1Puedes verlo e imprimirlo ya mismo!",
        retrySpeech: "\xA1Has estado muy cerca! Has escrito de maravilla. Repasa un poquito las frases con coma y vuelve a intentarlo enseguida para conseguir tu T\xEDtulo Oficial.",
        words: [
          { text: "BARCO VACA NOCHE VERDE MANZANA CIELO.", icon: "\u{1F3AF}", label: "Reto 1: Tres filas" },
          { text: "EL PERRO CORRE VELOZ, EL GATO SALTA ALTO.", icon: "\u{1F3AF}", label: "Reto 2: Comas" },
          { text: "UN BARCO NAVEGA EN EL MAR AZUL Y CLARO.", icon: "\u{1F3AF}", label: "Reto 3: Puntuaci\xF3n" },
          { text: "EL ZORRO COME MANZANA DULCE EN EL BOSQUE.", icon: "\u{1F3AF}", label: "Reto 4: Vocabulario" },
          { text: "UN ZORRO VELOZ VIAJA EN TAXI POR LA CIUDAD.", icon: "\u{1F3C6}", label: "Reto de Graduaci\xF3n" }
        ]
      }
    },
    // =========================================================================
    // NIVEL 6: El Reino de los Cuentos y Aventuras (Tildes)
    // =========================================================================
    {
      id: 6,
      slug: "6-cuentos",
      name: "6 - \u{1F3F0} El Reino de los Cuentos y Aventuras (Tildes)",
      shortName: "Cuentos y Tildes",
      beltTier: "verde",
      minAccuracy: 90,
      minWPM: 18,
      allowedKeys: "abcdefghijklmn\xF1opqrstuvwxyz .,\xE1\xE9\xED\xF3\xFA\xB4".split(""),
      objective: "Dominar la tecla del acento (\xB4) antes de cada vocal y frases narrativas",
      speech: "\xA1Hab\xEDa una vez! Aprendemos a poner tildes: primero pulsas la tecla del acento (\xB4) y luego la vocal.",
      tip: "Para acentuar una vocal: pulsa la tecla \xB4 (al lado de la P o la \xD1) y luego la vocal que quieras acentuar.",
      lessons: [
        {
          id: "6.1",
          title: "La tecla del acento (\xB4) con la vocal A",
          tip: "Pulsa \xB4 con el me\xF1ique derecho y luego la A con el me\xF1ique izquierdo.",
          speech: "Acento y luego la A: \xE1. \xA1Como magia!",
          words: [
            { text: "\xE1", icon: "\u2728", label: "A con tilde" },
            { text: "mam\xE1", icon: "\u2764\uFE0F", label: "Mam\xE1" },
            { text: "pap\xE1", icon: "\u2B50", label: "Pap\xE1" },
            { text: "est\xE1", icon: "\u{1F4CD}", label: "Est\xE1" }
          ]
        },
        {
          id: "6.2",
          title: "El acento con la vocal E",
          tip: "Pulsa \xB4 y luego la E con el coraz\xF3n izquierdo.",
          speech: "Acento y luego la E: \xE9. \xA1Caf\xE9, beb\xE9, pur\xE9!",
          words: [
            { text: "\xE9", icon: "\u2728", label: "E con tilde" },
            { text: "caf\xE9", icon: "\u2615", label: "Caf\xE9 rico" },
            { text: "beb\xE9", icon: "\u{1F476}", label: "Beb\xE9 risue\xF1o" },
            { text: "pur\xE9", icon: "\u{1F963}", label: "Pur\xE9 suave" }
          ]
        },
        {
          id: "6.3",
          title: "El acento con la vocal I",
          tip: "Pulsa \xB4 y luego la I con el coraz\xF3n derecho.",
          speech: "Acento y luego la I: \xED. \xA1Aqu\xED, colibr\xED, rub\xED!",
          words: [
            { text: "\xED", icon: "\u2728", label: "I con tilde" },
            { text: "aqu\xED", icon: "\u{1F4CD}", label: "Aqu\xED mismo" },
            { text: "colibr\xED", icon: "\u{1F426}", label: "Colibr\xED veloz" },
            { text: "rub\xED", icon: "\u{1F48E}", label: "Piedra rub\xED" }
          ]
        },
        {
          id: "6.4",
          title: "El acento con la vocal O",
          tip: "Pulsa \xB4 y luego la O con el anular derecho.",
          speech: "Acento y luego la O: \xF3. \xA1Rat\xF3n, cami\xF3n, le\xF3n!",
          words: [
            { text: "\xF3", icon: "\u2728", label: "O con tilde" },
            { text: "rat\xF3n", icon: "\u{1F42D}", label: "Rat\xF3n travieso" },
            { text: "cami\xF3n", icon: "\u{1F69B}", label: "Cami\xF3n grande" },
            { text: "le\xF3n", icon: "\u{1F981}", label: "Le\xF3n fuerte" }
          ]
        },
        {
          id: "6.5",
          title: "El acento con la vocal U",
          tip: "Pulsa \xB4 y luego la U con el \xEDndice derecho.",
          speech: "Acento y luego la U: \xFA. \xA1T\xFA, ba\xFAl, men\xFA!",
          words: [
            { text: "\xFA", icon: "\u2728", label: "U con tilde" },
            { text: "t\xFA", icon: "\u{1F449}", label: "T\xFA puedes" },
            { text: "ba\xFAl", icon: "\u{1F9F0}", label: "Ba\xFAl secreto" },
            { text: "men\xFA", icon: "\u{1F4DC}", label: "Men\xFA rico" }
          ]
        },
        {
          id: "6.6",
          title: "Palabras de fantas\xEDa con tildes",
          tip: "Drag\xF3n, bot\xF3n, coraz\xF3n, jard\xEDn.",
          speech: "Palabras llenas de magia y emoci\xF3n.",
          words: [
            { text: "drag\xF3n", icon: "\u{1F409}", label: "Drag\xF3n verde" },
            { text: "bot\xF3n", icon: "\u{1F518}", label: "Bot\xF3n m\xE1gico" },
            { text: "coraz\xF3n", icon: "\u{1F496}", label: "Buen coraz\xF3n" },
            { text: "jard\xEDn", icon: "\u{1F33A}", label: "Jard\xEDn con flores" }
          ]
        },
        {
          id: "6.7",
          title: "Verbos en pasado con tilde",
          tip: "Cant\xF3, salt\xF3, bail\xF3, corri\xF3.",
          speech: "Cosas que ya pasaron: \xA1bail\xF3, jug\xF3, so\xF1\xF3!",
          words: [
            { text: "cant\xF3", icon: "\u{1F3A4}", label: "Cant\xF3 lindo" },
            { text: "salt\xF3", icon: "\u{1F998}", label: "Salt\xF3 alto" },
            { text: "bail\xF3", icon: "\u{1F483}", label: "Bail\xF3 feliz" },
            { text: "corri\xF3", icon: "\u{1F3C3}", label: "Corri\xF3 r\xE1pido" }
          ]
        },
        {
          id: "6.8",
          title: "Animales de cuento con acento",
          tip: "El le\xF3n, el delf\xEDn, el rat\xF3n.",
          speech: "Los animales del bosque tienen acento en su nombre.",
          words: [
            { text: "el le\xF3n", icon: "\u{1F981}", label: "El le\xF3n" },
            { text: "el delf\xEDn", icon: "\u{1F42C}", label: "El delf\xEDn" },
            { text: "el rat\xF3n", icon: "\u{1F42D}", label: "El rat\xF3n" },
            { text: "el tibur\xF3n", icon: "\u{1F988}", label: "El tibur\xF3n" }
          ]
        },
        {
          id: "6.9",
          title: "Cuentos de hadas (Frases cortas 1)",
          tip: "El gato con botas.",
          speech: "\xA1Empiezan los cuentos cl\xE1sicos!",
          words: [
            { text: "el gato con botas baila feliz.", icon: "\u{1F431}", label: "Gato con botas" },
            { text: "el peque\xF1o drag\xF3n come helado.", icon: "\u{1F409}", label: "Drag\xF3n de helado" },
            { text: "la reina canta en su jard\xEDn.", icon: "\u{1F451}", label: "Reina en el jard\xEDn" },
            { text: "un duende juega con el bot\xF3n.", icon: "\u{1F9DD}", label: "Duende y bot\xF3n" }
          ]
        },
        {
          id: "6.10",
          title: "Cuentos de hadas (Frases cortas 2)",
          tip: "Mant\xE9n el ritmo sin mirar el teclado.",
          speech: "M\xE1s aventuras fant\xE1sticas para teclear.",
          words: [
            { text: "mi perrito corre feliz por el parque.", icon: "\u{1F436}", label: "Perrito en parque" },
            { text: "la luna brilla y cuida mis sue\xF1os.", icon: "\u{1F319}", label: "Luna brillante" },
            { text: "el osito panda come hojas de bamb\xFA.", icon: "\u{1F43C}", label: "Osito y bamb\xFA" },
            { text: "un arco\xEDris cruza todo el cielo azul.", icon: "\u{1F308}", label: "Arco\xEDris en el cielo" }
          ]
        },
        {
          id: "6.11",
          title: "Aventuras en el mar y el espacio",
          tip: "Cohete espacial, delfines en las olas.",
          speech: "\xA1Viajamos al fondo del mar y a las estrellas!",
          words: [
            { text: "el cohete espacial viaja muy veloz.", icon: "\u{1F680}", label: "Cohete veloz" },
            { text: "los delfines saltan sobre las olas.", icon: "\u{1F42C}", label: "Delfines saltarines" },
            { text: "la tortuga nada tranquila en el lago.", icon: "\u{1F422}", label: "Tortuga marina" },
            { text: "un pez dorado nada en el ancho r\xEDo.", icon: "\u{1F420}", label: "Pez dorado" }
          ]
        },
        {
          id: "6.12",
          title: "Cuentos con di\xE1logos y acciones",
          tip: "El le\xF3n rugi\xF3 con gran emoci\xF3n.",
          speech: "Historias con emoci\xF3n y acci\xF3n trepidante.",
          words: [
            { text: "el le\xF3n rugi\xF3 con alegr\xEDa y bail\xF3.", icon: "\u{1F981}", label: "Le\xF3n bail\xF3" },
            { text: "el capit\xE1n rob\xF3 una risa al drag\xF3n.", icon: "\u{1F3F4}\u200D\u2620\uFE0F", label: "Risa de drag\xF3n" },
            { text: "la mariposa vol\xF3 hasta la cima alta.", icon: "\u{1F98B}", label: "Mariposa vol\xF3" },
            { text: "el peque\xF1o mago encontr\xF3 un rub\xED.", icon: "\u{1F9D9}", label: "Mago y rub\xED" }
          ]
        },
        {
          id: "6.13",
          title: "Frases narrativas de dos l\xEDneas",
          tip: "Lee con expresividad y teclea al comp\xE1s de tu voz interior.",
          speech: "\xA1Frases largas! Siente c\xF3mo vuelan tus manos.",
          words: [
            { text: "hab\xEDa una vez un drag\xF3n que so\xF1aba con volar alto.", icon: "\u{1F409}", label: "Drag\xF3n so\xF1ador" },
            { text: "en lo alto del castillo brillaba una estrella de cristal.", icon: "\u{1F3F0}", label: "Castillo y estrella" },
            { text: "los piratas cantaron una canci\xF3n bajo la luna llena.", icon: "\u{1F3F4}\u200D\u2620\uFE0F", label: "Canci\xF3n pirata" },
            { text: "la princesa descubri\xF3 un ba\xFAl lleno de cartas doradas.", icon: "\u{1F451}", label: "Ba\xFAl de cartas" }
          ]
        },
        {
          id: "6.14",
          title: "Historias m\xE1gicas de la naturaleza",
          tip: "Respira en cada coma y remata en el punto.",
          speech: "Cuentos de bosques encantados y animales amigos.",
          words: [
            { text: "en el bosque verde, las ardillas guardan bellotas con amor.", icon: "\u{1F43F}\uFE0F", label: "Ardillas del bosque" },
            { text: "el r\xEDo canta melod\xEDas suaves mientras cruza todo el valle.", icon: "\u{1F3DE}\uFE0F", label: "Canto del r\xEDo" },
            { text: "el b\xFAho sabio mira las estrellas desde su viejo roble.", icon: "\u{1F989}", label: "B\xFAho sabio" },
            { text: "las flores abren sus p\xE9talos de colores al salir el sol.", icon: "\u{1F338}", label: "Flores de sol" }
          ]
        },
        {
          id: "6.15",
          title: "Gran Ensayo de Fluidez Narrativa",
          tip: "\xA1Todo el repertorio de tildes y cuentos dominado!",
          speech: "\xA1Impresionante nivel! Ya est\xE1s preparado para el Examen de Cuentos.",
          words: [
            { text: "el drag\xF3n comi\xF3 helado y cant\xF3 una bella canci\xF3n.", icon: "\u{1F31F}", label: "Ensayo 1" },
            { text: "la reina pasea por su jard\xEDn lleno de rosas y jazm\xEDn.", icon: "\u{1F31F}", label: "Ensayo 2" },
            { text: "un cohete espacial lleg\xF3 a la luna con el robot Roby.", icon: "\u{1F31F}", label: "Ensayo 3" },
            { text: "el delf\xEDn salt\xF3 feliz y salud\xF3 al barco con emoci\xF3n.", icon: "\u{1F31F}", label: "Ensayo 4" }
          ]
        }
      ],
      exam: {
        id: "6.exam",
        title: "\u{1F4CB} Gran Examen de los Cuentos y Aventuras (Nivel 6)",
        badge: "\u{1F3C5} Medalla de los Cuentos Fant\xE1sticos",
        minAccuracy: 90,
        minWPM: 18,
        speech: "\xA1Examen de Fluidez Narrativa! Demuestra tu dominio de las tildes y las historias completas.",
        passSpeech: "\xA1MARAVILLOSO! Escribes historias con tildes perfectas y fluidez de maestro. \xA1Medalla de Cuentos otorgada!",
        retrySpeech: "\xA1Muy buen trabajo! Recuerda pulsar primero la tecla \xB4 y luego la vocal. \xA1Int\xE9ntalo de nuevo ya!",
        words: [
          { text: "el drag\xF3n comi\xF3 helado de fresa en el jard\xEDn.", icon: "\u{1F3AF}", label: "Reto 1: Tildes" },
          { text: "mi perrito corri\xF3 feliz por el parque verde.", icon: "\u{1F3AF}", label: "Reto 2: Acci\xF3n" },
          { text: "el le\xF3n rugi\xF3 con alegr\xEDa y bail\xF3 bajo el sol.", icon: "\u{1F3AF}", label: "Reto 3: Cuento" },
          { text: "la reina descubri\xF3 un ba\xFAl lleno de rub\xEDes.", icon: "\u{1F3AF}", label: "Reto 4: Aventura" },
          { text: "el cohete espacial viaj\xF3 hasta la luna de cristal.", icon: "\u{1F3C6}", label: "Reto Final" }
        ]
      }
    },
    // =========================================================================
    // NIVEL 7: Club de Chistes y Trabalenguas (Mayúsculas y Puntuación)
    // =========================================================================
    {
      id: 7,
      slug: "7-chistes",
      name: "7 - \u{1F602} Club de Chistes, Trabalenguas y May\xFAsculas (Shift, \xA1! \xBF?)",
      shortName: "Chistes, Shift y Signos",
      beltTier: "negro",
      minAccuracy: 90,
      minWPM: 20,
      allowedKeys: "abcdefghijklmn\xF1opqrstuvwxyzABCDEFGHIJKLMN\xD1OPQRSTUVWXYZ .,:;!\xA1\xBF?\xE1\xE9\xED\xF3\xFA".split(""),
      objective: "Dominar la tecla Shift contralateral para may\xFAsculas y signos de puntuaci\xF3n dobles",
      speech: "\xA1A re\xEDrnos y afilar los reflejos! Aprenderemos a usar May\xFAs con la mano contraria y los signos \xA1! y \xBF?.",
      tip: "Para escribir una may\xFAscula: mant\xE9n pulsada la tecla Shift con el me\xF1ique de la mano contraria y pulsa la letra.",
      lessons: [
        {
          id: "7.1",
          title: "May\xFAsculas con la mano izquierda (Shift Derecho)",
          tip: "Mant\xE9n Shift con el me\xF1ique derecho y pulsa A, S, D, F con la mano izquierda.",
          speech: "\xA1Shift derecho para may\xFAsculas de la izquierda! A, S, D, F en may\xFAscula.",
          words: [
            { text: "A S D F", icon: "\u{1F520}", label: "May\xFAs Izq" },
            { text: "Ana", icon: "\u{1F467}", label: "Nombre Ana" },
            { text: "Sara", icon: "\u{1F467}", label: "Nombre Sara" },
            { text: "Felipe", icon: "\u{1F466}", label: "Nombre Felipe" }
          ]
        },
        {
          id: "7.2",
          title: "May\xFAsculas con la mano derecha (Shift Izquierdo)",
          tip: "Mant\xE9n Shift con el me\xF1ique izquierdo y pulsa J, K, L, \xD1 con la mano derecha.",
          speech: "\xA1Shift izquierdo para may\xFAsculas de la derecha! Juan, Laura, Mateo.",
          words: [
            { text: "J K L \xD1", icon: "\u{1F520}", label: "May\xFAs Der" },
            { text: "Juan", icon: "\u{1F466}", label: "Nombre Juan" },
            { text: "Laura", icon: "\u{1F467}", label: "Nombre Laura" },
            { text: "Nuria", icon: "\u{1F467}", label: "Nombre Nuria" }
          ]
        },
        {
          id: "7.3",
          title: "Signos de exclamaci\xF3n (\xA1 y !)",
          tip: "En espa\xF1ol usamos signo al principio (\xA1) y al final (!).",
          speech: "\xA1Qu\xE9 divertido! \xA1Vamos a aprender los signos de sorpresa!",
          words: [
            { text: "\xA1Hola!", icon: "\u{1F389}", label: "\xA1Hola!" },
            { text: "\xA1Genial!", icon: "\u{1F389}", label: "\xA1Genial!" },
            { text: "\xA1Bravo!", icon: "\u{1F389}", label: "\xA1Bravo!" },
            { text: "\xA1A jugar!", icon: "\u{1F389}", label: "\xA1A jugar!" }
          ]
        },
        {
          id: "7.4",
          title: "Signos de interrogaci\xF3n (\xBF y ?)",
          tip: "Signo de pregunta al abrir (\xBF) y al cerrar (?).",
          speech: "\xBFQui\xE9n es? \xBFQu\xE9 hora es? \xA1Preguntas curiosas!",
          words: [
            { text: "\xBFQui\xE9n es?", icon: "\u2753", label: "\xBFQui\xE9n es?" },
            { text: "\xBFQu\xE9 tal?", icon: "\u2753", label: "\xBFQu\xE9 tal?" },
            { text: "\xBFC\xF3mo est\xE1s?", icon: "\u2753", label: "\xBFC\xF3mo est\xE1s?" },
            { text: "\xBFJugamos?", icon: "\u2753", label: "\xBFJugamos?" }
          ]
        },
        {
          id: "7.5",
          title: "Dos puntos y punto y coma (: y ;)",
          tip: "Signos de puntuaci\xF3n para explicar y enumerar.",
          speech: "Dos puntos para anunciar cosas: \xA1atentos!",
          words: [
            { text: "dijo: hola", icon: "\u{1F4AC}", label: "Dijo dos puntos" },
            { text: "mira esto:", icon: "\u{1F4AC}", label: "Mira esto" },
            { text: "uno; dos; tres;", icon: "\u{1F4AC}", label: "Punto y coma" },
            { text: "Roby dice: \xA1vamos!", icon: "\u{1F4AC}", label: "Roby dice" }
          ]
        },
        {
          id: "7.6",
          title: "Nombres propios de personas y ciudades",
          tip: "Los nombres siempre empiezan por may\xFAscula.",
          speech: "\xA1Nombres de amigos y ciudades del mundo!",
          words: [
            { text: "Madrid y Barcelona", icon: "\u{1F3D9}\uFE0F", label: "Ciudades" },
            { text: "Lucas y Sof\xEDa", icon: "\u{1F46B}", label: "Amigos" },
            { text: "Espa\xF1a y Europa", icon: "\u{1F30D}", label: "Lugares" },
            { text: "Roby el Robot", icon: "\u{1F916}", label: "Roby Robot" }
          ]
        },
        {
          id: "7.7",
          title: "Trabalenguas cl\xE1sico: Tres tristes tigres",
          tip: "Cuidado no se te traben los dedos.",
          speech: "\xA1El trabalenguas del tigre! Despacio y con ritmo.",
          words: [
            { text: "tres tristes tigres", icon: "\u{1F42F}", label: "Tres tigres" },
            { text: "com\xEDan trigo en un trigal", icon: "\u{1F42F}", label: "En un trigal" },
            { text: "un tigre, dos tigres, tres tigres", icon: "\u{1F42F}", label: "Contando tigres" },
            { text: "los tres tigres com\xEDan trigo feliz.", icon: "\u{1F42F}", label: "Tigres felices" }
          ]
        },
        {
          id: "7.8",
          title: "Trabalenguas veloz: Pepe pela patatas",
          tip: "La P y la T en acci\xF3n r\xE1pida.",
          speech: "\xA1Pepe pela patatas para una rica tortilla!",
          words: [
            { text: "pepe pela patatas", icon: "\u{1F954}", label: "Pepe pela" },
            { text: "para una rica tortilla", icon: "\u{1F954}", label: "Rica tortilla" },
            { text: "pepe pela y pica patatas", icon: "\u{1F954}", label: "Pela y pica" },
            { text: "\xA1qu\xE9 rica tortilla cocina Pepe!", icon: "\u{1F954}", label: "Tortilla de Pepe" }
          ]
        },
        {
          id: "7.9",
          title: "Trabalenguas del cielo: Despejado",
          tip: "El cielo est\xE1 despejado, \xBFqui\xE9n lo despejar\xE1?",
          speech: "\xA1Un cl\xE1sico de la escuela! Cuidado con la J y la D.",
          words: [
            { text: "el cielo est\xE1 nublado", icon: "\u2601\uFE0F", label: "Cielo nublado" },
            { text: "\xBFqui\xE9n lo despejar\xE1?", icon: "\u2600\uFE0F", label: "Pregunta" },
            { text: "el que lo despeje", icon: "\u{1F324}\uFE0F", label: "Respuesta" },
            { text: "\xA1un gran despejador ser\xE1!", icon: "\u{1F308}", label: "Exclamaci\xF3n" }
          ]
        },
        {
          id: "7.10",
          title: "Chistes de mecanograf\xEDa: El rat\xF3n del ordenador",
          tip: "\xBFQu\xE9 le dijo un rat\xF3n a otro?",
          speech: "\xA1Primer chiste! \xBFQu\xE9 le dice un rat\xF3n a una gata?",
          words: [
            { text: "\xBFQu\xE9 hace un rat\xF3n en el teclado?", icon: "\u{1F42D}", label: "Pregunta 1" },
            { text: "\xA1esperar a que llegue el queso!", icon: "\u{1F9C0}", label: "Chiste 1" },
            { text: "\xBFPor qu\xE9 vuela la computadora?", icon: "\u{1F4BB}", label: "Pregunta 2" },
            { text: "\xA1porque tiene un rat\xF3n volador!", icon: "\u{1F987}", label: "Chiste 2" }
          ]
        },
        {
          id: "7.11",
          title: "Chistes de animales simp\xE1ticos",
          tip: "Chistes divertidos para sonre\xEDr mientras tecleas.",
          speech: "\xA1A re\xEDr mientras los dedos bailan!",
          words: [
            { text: "\xBFQu\xE9 le dice un pez a otro pez?", icon: "\u{1F420}", label: "Pez chistoso" },
            { text: "\xA1nada de nada, amigo m\xEDo!", icon: "\u{1F30A}", label: "\xA1Nada de nada!" },
            { text: "\xBFQu\xE9 le dice el caf\xE9 al az\xFAcar?", icon: "\u2615", label: "Caf\xE9 dulce" },
            { text: "\xA1sin ti mi vida es amarga!", icon: "\u{1F36C}", label: "\xA1Qu\xE9 dulce!" }
          ]
        },
        {
          id: "7.12",
          title: "Di\xE1logos teatrales con signos dobles",
          tip: "Combina signos de interrogaci\xF3n y exclamaci\xF3n.",
          speech: "Di\xE1logos de teatro: \xA1preguntas y respuestas con energ\xEDa!",
          words: [
            { text: "\u2014\xBFC\xF3mo te llamas? \u2014\xA1Me llamo Roby!", icon: "\u{1F3AD}", label: "Presentaci\xF3n" },
            { text: "\u2014\xBFQuieres jugar? \u2014\xA1Claro que s\xED!", icon: "\u{1F3AD}", label: "Invitaci\xF3n" },
            { text: "\u2014\xBFD\xF3nde est\xE1 el tesoro? \u2014\xA1Aqu\xED mismo!", icon: "\u{1F3AD}", label: "El tesoro" },
            { text: "\u2014\xA1Qu\xE9 emoci\xF3n! \u2014\xA1Vamos a ganar!", icon: "\u{1F3AD}", label: "Victoria" }
          ]
        },
        {
          id: "7.13",
          title: "Retos de velocidad: Adivinanzas",
          tip: "Adivina, adivinanza.",
          speech: "\xA1Adivinanzas para mecan\xF3grafos despiertos!",
          words: [
            { text: "Blanca por dentro, verde por fuera.", icon: "\u{1F350}", label: "La pera" },
            { text: "Oro parece, plata no es.", icon: "\u{1F34C}", label: "El pl\xE1tano" },
            { text: "Tengo hojas y no soy \xE1rbol.", icon: "\u{1F4D6}", label: "El libro" },
            { text: "Tengo teclas y no soy piano.", icon: "\u2328\uFE0F", label: "\xA1El teclado!" }
          ]
        },
        {
          id: "7.14",
          title: "P\xE1rrafos de comedia y ritmo",
          tip: "Coordina may\xFAsculas y signos a toda velocidad.",
          speech: "\xA1P\xE1rrafos c\xF3micos! Mira qu\xE9 soltura tienes ya.",
          words: [
            { text: "El ping\xFCino Pepe se puso pajarita para pasear por Par\xEDs.", icon: "\u{1F427}", label: "Ping\xFCino Pepe" },
            { text: "Cuca cose una camisa de seda suave para su amigo conejo.", icon: "\u{1F9F5}", label: "Costura de Cuca" },
            { text: "El hipop\xF3tamo Hipo salta de alegr\xEDa cuando come sand\xEDa.", icon: "\u{1F99B}", label: "Hipop\xF3tamo Hipo" },
            { text: "\xA1Atenci\xF3n a todos los pasajeros! El cohete va a despegar.", icon: "\u{1F680}", label: "Despegue estelar" }
          ]
        },
        {
          id: "7.15",
          title: "Gran Ensayo del Club de Chistes",
          tip: "Todos los signos al alcance de tu mano.",
          speech: "\xA1\xDAltimo ensayo! Vas directo al cintur\xF3n negro.",
          words: [
            { text: "\xBFQui\xE9n canta en el roble? \xA1El ruise\xF1or real!", icon: "\u{1F31F}", label: "Ensayo 1" },
            { text: "Pepe pela patatas y Lucas cocina la rica sopa.", icon: "\u{1F31F}", label: "Ensayo 2" },
            { text: "\xA1Cuidado con el tigre! Tres tigres comen trigo.", icon: "\u{1F31F}", label: "Ensayo 3" },
            { text: "\xBFSabes qui\xE9n soy? \xA1Soy el gran maestro Roby!", icon: "\u{1F31F}", label: "Ensayo 4" }
          ]
        }
      ],
      exam: {
        id: "7.exam",
        title: "\u{1F4CB} Gran Examen de May\xFAsculas, Puntuaci\xF3n y Chistes (Nivel 7)",
        badge: "\u{1F3C5} Medalla del Cintur\xF3n Negro",
        minAccuracy: 90,
        minWPM: 20,
        speech: "\xA1Examen de Acreditaci\xF3n de May\xFAsculas y Puntuaci\xF3n! Demuestra tu agilidad con Shift y todos los signos.",
        passSpeech: "\xA1INCRE\xCDBLE! Dominas las may\xFAsculas y la puntuaci\xF3n completa con precisi\xF3n de cintur\xF3n negro. \xA1Medalla conseguida!",
        retrySpeech: "\xA1Gran esfuerzo! Recuerda pulsar Shift con la mano contraria a la letra. \xA1Repite y lo bordar\xE1s!",
        words: [
          { text: "\xBFC\xF3mo est\xE1s? \xA1Estoy muy feliz de estar aqu\xED!", icon: "\u{1F3AF}", label: "Reto 1: Signos" },
          { text: "Tres tristes tigres com\xEDan trigo en el trigal.", icon: "\u{1F3AF}", label: "Reto 2: Trabalenguas" },
          { text: "Pepe pela patatas para la cena de Madrid.", icon: "\u{1F3AF}", label: "Reto 3: May\xFAsculas" },
          { text: "\u2014\xBFD\xF3nde vas? \u2014\xA1Voy al castillo de cristal!", icon: "\u{1F3AF}", label: "Reto 4: Di\xE1logo" },
          { text: "\xA1Roby el Robot coron\xF3 a Lucas como gran campe\xF3n!", icon: "\u{1F3C6}", label: "Reto Final" }
        ]
      }
    },
    // =========================================================================
    // NIVEL 8: Desafío Galáctico del Dragón Robot (Gran Maestría)
    // =========================================================================
    {
      id: 8,
      slug: "8-galaxia",
      name: "8 - \u{1F409} Desaf\xEDo Gal\xE1ctico del Drag\xF3n Robot (Gran Maestr\xEDa)",
      shortName: "Desaf\xEDo Gal\xE1ctico",
      beltTier: "negro",
      minAccuracy: 92,
      minWPM: 25,
      allowedKeys: "abcdefghijklmn\xF1opqrstuvwxyzABCDEFGHIJKLMN\xD1OPQRSTUVWXYZ .,:;!\xA1\xBF?\xE1\xE9\xED\xF3\xFA\xC1\xC9\xCD\xD3\xDA\n".split(""),
      objective: "Fluidez absoluta de mecan\xF3grafo experto con p\xE1rrafos continuos e Intro",
      speech: "\xA1El reto definitivo de la galaxia! Roby y el Drag\xF3n Robot te coronar\xE1n como Gran Maestro Mecan\xF3grafo.",
      tip: "\xA1Respira hondo y conf\xEDa en tus deditos m\xE1gicos! Escribe relajado y con ritmo musical constante.",
      lessons: [
        {
          id: "8.1",
          title: "La tecla Intro (\n) para saltos de l\xEDnea",
          tip: "Pulsa Intro con el me\xF1ique derecho para cambiar de p\xE1rrafo.",
          speech: "\xA1La tecla Intro! Tu me\xF1ique derecho salta para empezar una nueva l\xEDnea.",
          words: [
            { text: "Hola.\nAdi\xF3s.", icon: "\u21B5", label: "Salto de l\xEDnea" },
            { text: "Roby vuela.\nEl drag\xF3n r\xEDe.", icon: "\u21B5", label: "Dos l\xEDneas" },
            { text: "Uno.\nDos.\nTres.", icon: "\u21B5", label: "Tres l\xEDneas" },
            { text: "El cohete viaja.\nLas estrellas brillan.", icon: "\u21B5", label: "Espacio estelar" }
          ]
        },
        {
          id: "8.2",
          title: "Misi\xF3n en la Nave Estelar Ori\xF3n",
          tip: "Coordina saltos y p\xE1rrafos sin perder el comp\xE1s.",
          speech: "\xA1Despegamos en la nave Ori\xF3n! Motores listos.",
          words: [
            { text: "El capit\xE1n Roby encendi\xF3 los motores de la nave estelar Ori\xF3n.", icon: "\u{1F680}", label: "Nave Ori\xF3n" },
            { text: "Las luces de la cabina parpadeaban con alegr\xEDa multicolor.", icon: "\u{1F680}", label: "Cabina" },
            { text: "El radar indicaba un rumbo directo hacia el planeta Caramelo.", icon: "\u{1F680}", label: "Rumbo estelar" },
            { text: "Todos los robots saludaron levantando sus antenas brillantes.", icon: "\u{1F680}", label: "Tripulaci\xF3n" }
          ]
        },
        {
          id: "8.3",
          title: "El Planeta de los R\xEDos de Chocolate",
          tip: "Frases completas y vocabulario dulce.",
          speech: "\xA1Un planeta delicioso donde los r\xEDos son de chocolate!",
          words: [
            { text: "En el planeta Caramelo los r\xEDos son de chocolate con leche.", icon: "\u{1F36B}", label: "R\xEDos dulces" },
            { text: "Las monta\xF1as son de galleta crujiente y nata montada.", icon: "\u{1F3D4}\uFE0F", label: "Monta\xF1as" },
            { text: "\xC1rboles de algod\xF3n de az\xFAcar crecen junto al lago dulce.", icon: "\u{1F36D}", label: "Algod\xF3n dulce" },
            { text: "Llov\xEDan gotas de caramelo tibio que ol\xEDan a fresa.", icon: "\u{1F353}", label: "Lluvia dulce" }
          ]
        },
        {
          id: "8.4",
          title: "El Drag\xF3n de Pompas de Jab\xF3n",
          tip: "Chispitas es un drag\xF3n muy simp\xE1tico que no lanza fuego.",
          speech: "Conoce al drag\xF3n Chispitas: \xA1lanza pompas de jab\xF3n!",
          words: [
            { text: "En la colina vive el simp\xE1tico drag\xF3n Chispitas.", icon: "\u{1F409}", label: "Chispitas" },
            { text: "En vez de fuego caliente lanza pompas de jab\xF3n multicolor.", icon: "\u{1FAE7}", label: "Pompas de jab\xF3n" },
            { text: "Las pompas flotan por todo el valle y cantan melod\xEDas.", icon: "\u{1FAE7}", label: "Pompas cantoras" },
            { text: "Los animales del bosque juegan a atraparlas entre risas.", icon: "\u{1F43E}", label: "Juego feliz" }
          ]
        },
        {
          id: "8.5",
          title: "La Llave Secreta de Timi el Robot",
          tip: "Mant\xE9n la velocidad constante sin apresurarte.",
          speech: "Timi ha encontrado una llave dorada en el bosque.",
          words: [
            { text: "El robot Timi encontr\xF3 una llave dorada bajo el viejo roble.", icon: "\u{1F5DD}\uFE0F", label: "Llave m\xE1gica" },
            { text: "Al girarla en la roca una puerta luminosa se abri\xF3 ante \xE9l.", icon: "\u{1F6AA}", label: "Puerta m\xE1gica" },
            { text: "Un inmenso jard\xEDn encantado apareci\xF3 lleno de mariposas.", icon: "\u{1F98B}", label: "Jard\xEDn encantado" },
            { text: "Flores que cantaban le dieron una c\xE1lida bienvenida a su hogar.", icon: "\u{1F33A}", label: "Bienvenida" }
          ]
        },
        {
          id: "8.6",
          title: "El Valle de los Cristales Cantores",
          tip: "Coordina may\xFAsculas y acentos en palabras largas.",
          speech: "Cristales que emiten notas musicales al tocarlos.",
          words: [
            { text: "En el valle secreto de cristal cada roca emite una nota musical.", icon: "\u{1F48E}", label: "Cristal cantor" },
            { text: "Cuando el viento sopla suave todo el valle parece una orquesta.", icon: "\u{1F3BC}", label: "Orquesta de viento" },
            { text: "Roby bail\xF3 alegremente siguiendo el comp\xE1s de las notas.", icon: "\u{1F916}", label: "Baile de Roby" },
            { text: "Las estrellas del cielo brillaban al ritmo de la m\xFAsica estelar.", icon: "\u2728", label: "Estrellas" }
          ]
        },
        {
          id: "8.7",
          title: "La Carrera de Trineos de Nieve de Az\xFAcar",
          tip: "P\xE1rrafos din\xE1micos de acci\xF3n y velocidad.",
          speech: "\xA1Carrera de trineos por la colina m\xE1s empinada!",
          words: [
            { text: "Los ping\xFCinos organizaron una gran carrera de trineos veloces.", icon: "\u{1F6F7}", label: "Carrera de trineo" },
            { text: "La nieve de az\xFAcar cruj\xEDa bajo las cuchillas brillantes.", icon: "\u2744\uFE0F", label: "Nieve crujiente" },
            { text: "El conejo saltar\xEDn tom\xF3 la delantera en la \xFAltima curva.", icon: "\u{1F430}", label: "Conejo veloz" },
            { text: "\xA1Todos los espectadores aplaudieron emocionados al ganador!", icon: "\u{1F44F}", label: "Aplausos" }
          ]
        },
        {
          id: "8.8",
          title: "El Secreto de la Corona Dorada",
          tip: "Palabras solemnes de maestr\xEDa.",
          speech: "La leyenda de la corona dorada de los mecan\xF3grafos.",
          words: [
            { text: "Cuenta la leyenda que quien domine los diez dedos recibir\xE1 una corona.", icon: "\u{1F451}", label: "Leyenda" },
            { text: "Una corona m\xE1gica forjada con estrellas luminosas del espacio.", icon: "\u{1F451}", label: "Corona estelar" },
            { text: "Esa corona otorga el don de escribir a la velocidad del rayo.", icon: "\u26A1", label: "Don del rayo" },
            { text: "Y hoy t\xFA est\xE1s a punto de conquistar ese gran tesoro dorado.", icon: "\u{1F3C6}", label: "Tu destino" }
          ]
        },
        {
          id: "8.9",
          title: "P\xE1rrafo Narrativo: Viaje al Espacio Profundo",
          tip: "Respira hondo y mant\xE9n la cadencia.",
          speech: "\xA1P\xE1rrafo continuo de alta precisi\xF3n!",
          words: [
            {
              text: "A trav\xE9s de la ventanilla de la nave espacial, miles de estrellas brillaban como diamantes en el infinito.",
              icon: "\u{1F30C}",
              label: "Espacio profundo"
            },
            {
              text: "Roby observ\xF3 una nebulosa dorada que danzaba suavemente al comp\xE1s de la gravedad c\xF3smica.",
              icon: "\u2728",
              label: "Nebulosa dorada"
            }
          ]
        },
        {
          id: "8.10",
          title: "P\xE1rrafo Narrativo: La Aldea de las Luci\xE9rnagas",
          tip: "Lectura fluida y tecleo sin esfuerzo visual.",
          speech: "La noche m\xE1gica en la aldea de las luci\xE9rnagas.",
          words: [
            {
              text: "Cuando el sol se ocultaba tras los cerros, millones de peque\xF1as luces flotaban entre las ramas del sauce.",
              icon: "\u{1FAB2}",
              label: "Luci\xE9rnagas"
            },
            {
              text: "Los ni\xF1os de la aldea sal\xEDan a cantar canciones alegres iluminados por el resplandor c\xE1lido.",
              icon: "\u{1F3B6}",
              label: "Canto c\xE1lido"
            }
          ]
        },
        {
          id: "8.11",
          title: "P\xE1rrafo Narrativo: El Faro del Fin del Mundo",
          tip: "Concentraci\xF3n total en cada cl\xE1usula.",
          speech: "El faro que gu\xEDa a los marineros de sue\xF1os.",
          words: [
            {
              text: "En el acantilado m\xE1s alto del oc\xE9ano se alzaba un viejo faro de piedra blanca y c\xFApula de bronce.",
              icon: "\u{1F5FC}",
              label: "Viejo faro"
            },
            {
              text: "Su haz de luz giratorio atravesaba la niebla protegiendo a los barcos de las rocas escarpadas.",
              icon: "\u{1F4A1}",
              label: "Luz giratoria"
            }
          ]
        },
        {
          id: "8.12",
          title: "P\xE1rrafo Narrativo: El Baile de las Mariposas",
          tip: "Mant\xE9n un ritmo de 25 WPM o m\xE1s.",
          speech: "La fiesta de primavera en el prado encantado.",
          words: [
            {
              text: "Flores multicolores abr\xEDan sus p\xE9talos al comp\xE1s de una suave brisa que perfumaba todo el prado.",
              icon: "\u{1F338}",
              label: "Prado en flor"
            },
            {
              text: "Cientos de mariposas de purpurina azul danzaban en c\xEDrculos celebrando la llegada del verano.",
              icon: "\u{1F98B}",
              label: "Baile azul"
            }
          ]
        },
        {
          id: "8.13",
          title: "Desaf\xEDo de Resistencia: El Banquete Gal\xE1ctico",
          tip: "Texto extenso de alta fluidez.",
          speech: "\xA1El banquete gal\xE1ctico de los campeones!",
          words: [
            {
              text: "En el gran sal\xF3n estelar se sirvieron pasteles de cometa, galletas de polvo de estrella y zumo de aurora boreal.",
              icon: "\u{1F9C1}",
              label: "Banquete estelar"
            },
            {
              text: "Todos los robots y ni\xF1os brindaron con copas de cristal por la amistad, la constancia y el aprendizaje.",
              icon: "\u{1F942}",
              label: "Brindis de honor"
            }
          ]
        },
        {
          id: "8.14",
          title: "Pen\xFAltimo Desaf\xEDo: El Drag\xF3n Chispitas te saluda",
          tip: "Siente el teclado como una extensi\xF3n natural de tus dedos.",
          speech: "El drag\xF3n Chispitas est\xE1 orgulloso de ti. \xA1Est\xE1s a un paso de la gloria!",
          words: [
            {
              text: "El drag\xF3n Chispitas despleg\xF3 sus alas luminosas y lanz\xF3 una gran pompa dorada que dec\xEDa tu nombre.",
              icon: "\u{1F409}",
              label: "Homenaje del Drag\xF3n"
            },
            {
              text: "Roby aplaudi\xF3 con entusiasmo y te entreg\xF3 la llave m\xE1gica de la Academia de Mecanograf\xEDa.",
              icon: "\u{1F916}",
              label: "Llave de oro"
            }
          ]
        },
        {
          id: "8.15",
          title: "Gran Ensayo de Graduaci\xF3n de Maestro",
          tip: "El \xFAltimo ensayo de la academia. Respira y brilla.",
          speech: "\xA1El \xFAltimo paso antes del Examen Final de Gran Maestro! Est\xE1s listo para coronarte.",
          words: [
            {
              text: "El capit\xE1n Roby encendi\xF3 los motores estelares de la nave Ori\xF3n con una enorme sonrisa.",
              icon: "\u{1F31F}",
              label: "Ensayo Final 1"
            },
            {
              text: "A trav\xE9s de la ventanilla miles de estrellas brillaban como diamantes en el espacio infinito.",
              icon: "\u{1F31F}",
              label: "Ensayo Final 2"
            },
            {
              text: "Su misi\xF3n era explorar el fabuloso planeta Caramelo donde los r\xEDos son de chocolate.",
              icon: "\u{1F31F}",
              label: "Ensayo Final 3"
            },
            {
              text: "\xA1Has recorrido todo el camino y hoy te coronas como el mejor mecan\xF3grafo de la galaxia!",
              icon: "\u{1F31F}",
              label: "Ensayo Final 4"
            }
          ]
        }
      ],
      exam: {
        id: "8.exam",
        title: "\u{1F451} Gran Examen Final de Graduaci\xF3n: Maestro Mecan\xF3grafo (Nivel 8)",
        badge: "\u{1F451} Gran T\xEDtulo de Maestro Mecan\xF3grafo",
        minAccuracy: 92,
        minWPM: 25,
        isGraduationExam: true,
        diplomaTitle: "T\xEDtulo Superior Oficial de Gran Maestro Mecan\xF3grafo (Cintur\xF3n Negro & Corona)",
        speech: "\xA1LLEG\xD3 EL MOMENTO CULMINANTE! El Gran Examen Final de Graduaci\xF3n de la Academia Mecano. Si lo superas, obtendr\xE1s el T\xCDTULO M\xC1XIMO DE GRAN MAESTRO MECAN\xD3GRAFO y la Corona Dorada.",
        passSpeech: "\xA1GLORIOSO! \xA1ERES UN GRAN MAESTRO MECAN\xD3GRAFO! Has conquistado el teclado por completo con la m\xE1xima excelencia. \xA1Tu T\xEDtulo Superior y tu Corona Dorada son tuyos!",
        retrySpeech: "\xA1Impresionante demostraci\xF3n! Mant\xE9n la calma en las frases largas. \xA1Vuelve a intentarlo ahora mismo para conseguir tu Corona!",
        words: [
          {
            text: "El capit\xE1n Roby encendi\xF3 los motores de la nave Ori\xF3n con una gran sonrisa.",
            icon: "\u{1F680}",
            label: "Reto 1: Despegue"
          },
          {
            text: "Miles de estrellas brillaban como diamantes luminosos en el espacio infinito.",
            icon: "\u{1F30C}",
            label: "Reto 2: El Cosmos"
          },
          {
            text: "El drag\xF3n Chispitas lanz\xF3 divertidas pompas de jab\xF3n que flotaban por el valle.",
            icon: "\u{1F409}",
            label: "Reto 3: El Drag\xF3n"
          },
          {
            text: "El misterioso robot Timi abri\xF3 la puerta secreta del inmenso jard\xEDn encantado.",
            icon: "\u{1F916}",
            label: "Reto 4: Timi"
          },
          {
            text: "\xA1Enhorabuena, campe\xF3n! Tus dedos vuelan como la luz y dominas todo el teclado a la perfecci\xF3n.",
            icon: "\u{1F451}",
            label: "Gran Reto de Graduaci\xF3n"
          }
        ]
      }
    }
  ];

  // src/keyboard/PedagogyEngine.js
  var PedagogyEngine = class _PedagogyEngine {
    /**
     * Authoritative belt progression requirements
     */
    static BELT_TIERS = [
      { belt: "blanco", minLevel: 1, minStars: 0, title: "Cintur\xF3n Blanco", emoji: "\u{1F94B}\u26AA" },
      { belt: "amarillo", minLevel: 3, minStars: 5, title: "Cintur\xF3n Amarillo", emoji: "\u{1F94B}\u{1F7E1}" },
      { belt: "verde", minLevel: 5, minStars: 11, title: "Cintur\xF3n Verde", emoji: "\u{1F94B}\u{1F7E2}" },
      { belt: "negro", minLevel: 7, minStars: 18, title: "Cintur\xF3n Negro & Corona", emoji: "\u{1F94B}\u26AB\u{1F451}" }
    ];
    /**
     * Canonical 8-level micro-curriculum specification (tested by test_harness.js)
     */
    static CURRICULUM = [
      { id: 1, name: "Los \xCDndices en Casa (F y J)", keys: ["f", "j", " "] },
      { id: 2, name: "La Fila Gu\xEDa B\xE1sica", keys: ["a", "s", "d", "f", "j", "k", "l", "\xF1"] },
      { id: 3, name: "Vocales Superiores (E, I)", keys: ["e", "i"] },
      { id: 4, name: "Expansi\xF3n de Vocales y Consonantes", keys: ["o", "u", "c", "m", "p", "t"] },
      { id: 5, name: "Frases Cortas y Barra Espaciadora", keys: [" "] },
      { id: 6, name: "Cuentos y Aventuras (Tildes)", keys: ["\xB4", "\xE1", "\xE9", "\xED", "\xF3", "\xFA"] },
      { id: 7, name: "May\xFAsculas y Puntuaci\xF3n", keys: ["Shift", "!", "?"] },
      { id: 8, name: "Desaf\xEDo Gal\xE1ctico", keys: ["\n"] }
    ];
    /**
     * Complete rich pedagogical levels database (from CurriculumData.js with flattened fallback words)
     */
    static RICH_LEVELS = CURRICULUM_LEVELS.map((lvl) => {
      const flattenedWords = Array.isArray(lvl.lessons) ? lvl.lessons.flatMap((lesson) => lesson.words || []) : lvl.words || [];
      return {
        ...lvl,
        words: flattenedWords
      };
    });
    constructor() {
      this._richLevels = _PedagogyEngine.RICH_LEVELS;
    }
    /**
     * Enforces 3-star non-punitive grading formula:
     * >= 95% -> 3 stars
     * >= 90% -> 2 stars
     * < 90%  -> 1 star (never 0 stars; every child completes and earns credit)
     * 
     * @param {number} accuracy - Percentage from 0 to 100
     * @returns {number} 1, 2, or 3
     */
    calculateStars(accuracy) {
      const acc = typeof accuracy === "number" ? accuracy : 0;
      if (acc >= 95) return 3;
      if (acc >= 90) return 2;
      return 1;
    }
    /**
     * Calculates belt promotion based on unlocked level number and total stars
     * 
     * @param {number} unlockedLevel - Highest unlocked level (1..8)
     * @param {number} totalStars - Sum of stars accumulated
     * @returns {string} Belt ID ('blanco', 'amarillo', 'verde', 'negro')
     */
    calculateBelt(unlockedLevel, totalStars) {
      let currentBelt = "blanco";
      const level = Number(unlockedLevel) || 1;
      const stars = Number(totalStars) || 0;
      for (const tier of _PedagogyEngine.BELT_TIERS) {
        if (level >= tier.minLevel && stars >= tier.minStars) {
          currentBelt = tier.belt;
        }
      }
      return currentBelt;
    }
    /**
     * Retrieves level configuration by ID (number 1..8 or string slug)
     * @param {number|string} levelId
     * @returns {Object|null}
     */
    getLevel(levelId) {
      if (!levelId) return this._richLevels[0];
      const numericId = parseInt(levelId, 10);
      if (!isNaN(numericId)) {
        const match = this._richLevels.find((l) => l.id === numericId);
        if (match) return match;
      }
      const slugMatch = this._richLevels.find((l) => l.slug === String(levelId));
      if (slugMatch) return slugMatch;
      return this._richLevels[0];
    }
    /**
     * Returns array of all 8 micro-curriculum levels
     * @returns {Array<Object>}
     */
    getAllLevels() {
      return this._richLevels;
    }
    /**
     * Retrieves all micro-lessons for a level
     * @param {number|string} levelId
     * @returns {Array<Object>}
     */
    getLessonsForLevel(levelId) {
      const level = this.getLevel(levelId);
      return level && Array.isArray(level.lessons) ? level.lessons : [];
    }
    /**
     * Retrieves a specific micro-lesson by ID (e.g. '1.1') or index (0..14)
     * @param {number|string} levelId
     * @param {string|number} lessonIdOrIndex
     * @returns {Object|null}
     */
    getLesson(levelId, lessonIdOrIndex) {
      const lessons = this.getLessonsForLevel(levelId);
      if (!lessons.length) return null;
      if (typeof lessonIdOrIndex === "string") {
        const match = lessons.find((l) => l.id === lessonIdOrIndex);
        if (match) return match;
      }
      const idx = Number(lessonIdOrIndex);
      if (!isNaN(idx) && idx >= 0 && idx < lessons.length) {
        return lessons[idx];
      }
      return lessons[0];
    }
    /**
     * Retrieves the exam definition for a level
     * @param {number|string} levelId
     * @returns {Object|null}
     */
    getExamForLevel(levelId) {
      const level = this.getLevel(levelId);
      return level && level.exam ? level.exam : null;
    }
    /**
     * Checks whether the child is eligible to take the level examination
     * (e.g. all 15 lessons completed in storage)
     * 
     * @param {number|string} levelId
     * @param {import('../core/StorageManager.js').StorageManager} storage
     * @returns {boolean}
     */
    canTakeExam(levelId, storage) {
      if (!storage) return true;
      const level = this.getLevel(levelId);
      const totalLessons = level && Array.isArray(level.lessons) ? level.lessons.length : 15;
      const completed = storage.getCompletedLessons(levelId);
      return completed.length >= totalLessons;
    }
    /**
     * Evaluates an examination attempt non-punitively
     * 
     * @param {number|string} levelId
     * @param {Object} results
     * @param {number} results.accuracy
     * @param {number} [results.wpm=0]
     * @returns {Object} { passed, accuracy, wpm, stars, isGraduation, diplomaTitle, cheer }
     */
    evaluateExam(levelId, results = {}) {
      const level = this.getLevel(levelId);
      const exam = this.getExamForLevel(levelId) || { minAccuracy: 85, minWPM: 6 };
      const accuracy = Math.max(0, Math.min(100, Math.round(results.accuracy ?? 100)));
      const wpm = Math.max(0, Math.round(results.wpm ?? 0));
      const requiredAccuracy = exam.minAccuracy || 85;
      const requiredWPM = exam.minWPM || 0;
      const passed = accuracy >= requiredAccuracy && wpm >= requiredWPM;
      const stars = this.calculateStars(accuracy);
      const isGraduation = Boolean(exam.isGraduationExam);
      const diplomaTitle = exam.diplomaTitle || (level.id === 5 ? "T\xEDtulo Oficial de Mecan\xF3grafo/a de Grado Elemental" : level.id === 8 ? "T\xEDtulo Superior de Gran Maestro Mecan\xF3grafo" : "");
      let cheer = "";
      if (passed) {
        if (isGraduation) {
          cheer = `\xA1GLORIOSO! \xA1Has aprobado el Examen Oficial de Graduaci\xF3n! \xA1Tu ${diplomaTitle} est\xE1 listo para ser impreso!`;
        } else {
          cheer = exam.passSpeech || `\xA1Felicidades! Has aprobado el examen con un ${accuracy}% de precisi\xF3n. \xA1Nivel superado!`;
        }
      } else {
        cheer = exam.retrySpeech || `\xA1Buen intento! Has logrado un ${accuracy}% de precisi\xF3n. Para la medalla necesitamos un ${requiredAccuracy}%. \xA1Repasa un poco o int\xE9ntalo de nuevo!`;
      }
      return {
        levelId: level.id,
        passed,
        accuracy,
        wpm,
        stars,
        requiredAccuracy,
        requiredWPM,
        isGraduation,
        diplomaTitle,
        cheer
      };
    }
    /**
     * Evaluates completion of a level session and determines rewards
     * 
     * @param {Object} session
     * @param {number|string} session.levelId
     * @param {number} session.accuracy
     * @param {number} session.wpm
     * @param {number} [session.unlockedLevel=1]
     * @param {number} [session.totalStars=0]
     * @param {string} [session.currentBelt='blanco']
     * @returns {Object} Evaluation summary
     */
    evaluateSession(session = {}) {
      const level = this.getLevel(session.levelId);
      const accuracy = Math.max(0, Math.min(100, Math.round(session.accuracy ?? 100)));
      const stars = this.calculateStars(accuracy);
      const wpm = Math.max(0, Math.round(session.wpm ?? 0));
      const totalStars = (session.totalStars || 0) + stars;
      const nextUnlockedLevel = Math.max(session.unlockedLevel || 1, level.id < 8 ? level.id + 1 : 8);
      const newBelt = this.calculateBelt(nextUnlockedLevel, totalStars);
      const isNewBelt = newBelt !== (session.currentBelt || "blanco");
      let cheer = "\xA1Sensacional trabajo! \xA1Has completado la lecci\xF3n!";
      if (stars === 3) cheer = "\xA1Impresionante! \xA13 estrellas doradas de maestr\xEDa!";
      else if (stars === 2) cheer = "\xA1Muy bien hecho! \xA1Tus deditos van a toda velocidad!";
      return {
        levelId: level.id,
        stars,
        accuracy,
        wpm,
        passed: true,
        // Non-punitive: always passes upon finishing words
        nextUnlockedLevel,
        newBelt,
        isNewBelt,
        cheer
      };
    }
    /**
     * Motor hesitation filter:
     * Ignores duplicate errors for the same character within 400ms
     * 
     * @param {number} lastErrorTimeMs
     * @param {number} currentErrorTimeMs
     * @param {string} lastErrorChar
     * @param {string} currentErrorChar
     * @returns {boolean} True if error should be filtered (ignored)
     */
    shouldFilterHesitation(lastErrorTimeMs, currentErrorTimeMs, lastErrorChar, currentErrorChar) {
      if (!lastErrorTimeMs || !currentErrorTimeMs) return false;
      const diff = currentErrorTimeMs - lastErrorTimeMs;
      return diff >= 0 && diff < 400 && String(lastErrorChar).toLowerCase() === String(currentErrorChar).toLowerCase();
    }
  };

  // src/audio/ProceduralAudio.js
  var PENTATONIC_SCALE = Object.freeze([
    261.63,
    // Step 0: C4 (Do)
    293.66,
    // Step 1: D4 (Re)
    329.63,
    // Step 2: E4 (Mi)
    392,
    // Step 3: G4 (Sol)
    440,
    // Step 4: A4 (La)
    523.25,
    // Step 5: C5 (Do)
    587.33,
    // Step 6: D5 (Re)
    659.25,
    // Step 7: E5 (Mi)
    783.99,
    // Step 8: G5 (Sol)
    880,
    // Step 9: A5 (La)
    1046.5
    // Step 10: C6 (Do)
  ]);
  var ProceduralAudio = class {
    /**
     * @param {Object} [options]
     * @param {AudioContext} [options.audioContext] Optional injected AudioContext (useful for headless testing)
     * @param {number} [options.volume=0.8] Initial SFX volume (0.0 to 1.0)
     * @param {boolean} [options.muted=false] Initial muted state
     */
    constructor(options = {}) {
      this._customAudioContext = options.audioContext || null;
      this._audioCtx = null;
      this._volume = typeof options.volume === "number" ? Math.max(0, Math.min(1, options.volume)) : 0.8;
      this._muted = Boolean(options.muted);
      this._scale = [...PENTATONIC_SCALE];
      this._eventDisposers = [];
      this._autoplayHookAttached = false;
      this._lastSuccessFrequency = 0;
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
      const AudioContextClass = typeof window !== "undefined" ? window.AudioContext || window.webkitAudioContext : typeof globalThis !== "undefined" ? globalThis.AudioContext : null;
      if (AudioContextClass) {
        try {
          this._audioCtx = new AudioContextClass();
        } catch (err) {
          console.warn("[ProceduralAudio] Failed to initialize AudioContext:", err.message);
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
      if (ctx && ctx.state === "suspended" && typeof ctx.resume === "function") {
        try {
          await ctx.resume();
        } catch (err) {
          console.warn("[ProceduralAudio] resume() failed:", err.message);
        }
      }
    }
    /**
     * Hooks pointer, touch, and keyboard interactions to automatically unlock audio.
     * @private
     */
    _setupAutoplayRecovery() {
      if (typeof window === "undefined" || typeof window.addEventListener !== "function" || this._autoplayHookAttached) {
        return;
      }
      const unlockHandler = () => {
        this.resume();
        const ctx = this.getAudioContext();
        if (ctx && ctx.state === "running") {
          const events2 = ["pointerdown", "touchstart", "keydown", "click"];
          for (const evt of events2) {
            window.removeEventListener(evt, unlockHandler, true);
          }
          this._autoplayHookAttached = false;
        }
      };
      const events = ["pointerdown", "touchstart", "keydown", "click"];
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
      if (typeof vol === "number" && !isNaN(vol)) {
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
      if (ctx.state === "suspended" && typeof ctx.resume === "function") {
        ctx.resume().catch(() => {
        });
      }
      let noteIndex = 0;
      if (typeof comboCount === "number" && comboCount > 0) {
        noteIndex = Math.min(Math.floor(comboCount - 1), this._scale.length - 1);
      } else if (typeof comboCount === "number" && comboCount === 0) {
        noteIndex = 0;
      }
      const freq = this._scale[noteIndex];
      this._lastSuccessFrequency = freq;
      try {
        const now = ctx.currentTime || 0;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, now);
        const peakGain = 0.4 * effectiveVolume;
        gain.gain.setValueAtTime(1e-3, now);
        if (typeof gain.gain.exponentialRampToValueAtTime === "function") {
          gain.gain.exponentialRampToValueAtTime(Math.max(1e-3, peakGain), now + 8e-3);
          gain.gain.exponentialRampToValueAtTime(1e-3, now + 0.14);
        } else if (typeof gain.gain.setValueAtTime === "function") {
          gain.gain.setValueAtTime(peakGain, now + 8e-3);
          gain.gain.setValueAtTime(1e-3, now + 0.14);
        }
        osc.connect(gain);
        gain.connect(ctx.destination);
        if (typeof osc.start === "function") osc.start(now);
        if (typeof osc.stop === "function") osc.stop(now + 0.15);
      } catch (err) {
        console.warn("[ProceduralAudio] playSuccess error:", err.message);
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
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, now);
        const peakGain = 0.4 * effectiveVolume;
        gain.gain.setValueAtTime(1e-3, now);
        if (typeof gain.gain.exponentialRampToValueAtTime === "function") {
          gain.gain.exponentialRampToValueAtTime(Math.max(1e-3, peakGain), now + 8e-3);
          gain.gain.exponentialRampToValueAtTime(1e-3, now + 0.14);
        } else {
          gain.gain.setValueAtTime(peakGain, now + 8e-3);
          gain.gain.setValueAtTime(1e-3, now + 0.14);
        }
        osc.connect(gain);
        gain.connect(ctx.destination);
        if (typeof osc.start === "function") osc.start(now);
        if (typeof osc.stop === "function") osc.stop(now + 0.15);
      } catch (err) {
        console.warn("[ProceduralAudio] playPentatonicSuccess error:", err.message);
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
      if (ctx.state === "suspended" && typeof ctx.resume === "function") {
        ctx.resume().catch(() => {
        });
      }
      try {
        const now = ctx.currentTime || 0;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const filter = ctx.createBiquadFilter ? ctx.createBiquadFilter() : null;
        osc.type = "triangle";
        osc.frequency.setValueAtTime(140, now);
        if (typeof osc.frequency.exponentialRampToValueAtTime === "function") {
          osc.frequency.exponentialRampToValueAtTime(55, now + 0.1);
        } else {
          osc.frequency.setValueAtTime(55, now + 0.1);
        }
        if (filter) {
          filter.type = "lowpass";
          filter.frequency.setValueAtTime(380, now);
          if (filter.Q && typeof filter.Q.setValueAtTime === "function") {
            filter.Q.setValueAtTime(2, now);
          }
        }
        const peakGain = 0.35 * effectiveVolume;
        gain.gain.setValueAtTime(peakGain, now);
        if (typeof gain.gain.exponentialRampToValueAtTime === "function") {
          gain.gain.exponentialRampToValueAtTime(1e-3, now + 0.12);
        } else {
          gain.gain.setValueAtTime(1e-3, now + 0.12);
        }
        if (filter) {
          osc.connect(filter);
          filter.connect(gain);
        } else {
          osc.connect(gain);
        }
        gain.connect(ctx.destination);
        if (typeof osc.start === "function") osc.start(now);
        if (typeof osc.stop === "function") osc.stop(now + 0.13);
      } catch (err) {
        console.warn("[ProceduralAudio] playMiss error:", err.message);
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
      const effectiveVolume = typeof sfxVolume === "number" ? sfxVolume : this._volume;
      if (effectiveVolume <= 0) return;
      if (typeof Audio !== "undefined") {
        try {
          const audio = new Audio("assets/sounds/button-click.wav");
          audio.volume = Math.max(0, Math.min(1, effectiveVolume * 0.5));
          audio.play().catch(() => {
          });
          return;
        } catch (e) {
        }
      }
      const ctx = this.getAudioContext();
      if (!ctx) return;
      try {
        if (ctx.state === "suspended" && typeof ctx.resume === "function") {
          ctx.resume().catch(() => {
          });
        }
        const now = ctx.currentTime || 0;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        if (osc.frequency && typeof osc.frequency.setValueAtTime === "function") {
          osc.frequency.setValueAtTime(520, now);
          osc.frequency.exponentialRampToValueAtTime(880, now + 0.04);
        }
        if (gain.gain && typeof gain.gain.setValueAtTime === "function") {
          gain.gain.setValueAtTime(effectiveVolume * 0.25, now);
          gain.gain.exponentialRampToValueAtTime(1e-3, now + 0.05);
        }
        osc.connect(gain);
        gain.connect(ctx.destination);
        if (typeof osc.start === "function") osc.start(now);
        if (typeof osc.stop === "function") osc.stop(now + 0.05);
      } catch (e) {
      }
    }
    /**
     * Plays a celebratory victory chord/arpeggio when a level is completed.
     */
    playCelebration() {
      if (this._muted || this._volume <= 0) return;
      const celebrationNotes = [523.25, 659.25, 783.99, 1046.5];
      celebrationNotes.forEach((freq, idx) => {
        setTimeout(() => {
          const ctx = this.getAudioContext();
          if (!ctx) return;
          try {
            const now = ctx.currentTime || 0;
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = "sine";
            osc.frequency.setValueAtTime(freq, now);
            gain.gain.setValueAtTime(1e-3, now);
            if (typeof gain.gain.exponentialRampToValueAtTime === "function") {
              gain.gain.exponentialRampToValueAtTime(0.3 * this._volume, now + 0.01);
              gain.gain.exponentialRampToValueAtTime(1e-3, now + 0.28);
            }
            osc.connect(gain);
            gain.connect(ctx.destination);
            if (typeof osc.start === "function") osc.start(now);
            if (typeof osc.stop === "function") osc.stop(now + 0.3);
          } catch (_) {
          }
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
      const effectiveVolume = typeof sfxVolume === "number" ? sfxVolume : this._volume;
      const ctx = this.getAudioContext();
      if (!ctx) return;
      try {
        if (ctx.state === "suspended" && typeof ctx.resume === "function") {
          ctx.resume().catch(() => {
          });
        }
        const now = ctx.currentTime || 0;
        const notes = [
          { f: 659.25, t: 0, dur: 0.08 },
          { f: 783.99, t: 0.06, dur: 0.08 },
          { f: 1046.5, t: 0.12, dur: 0.22 }
        ];
        notes.forEach(({ f, t, dur }) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = "sine";
          osc.frequency.setValueAtTime(f, now + t);
          gain.gain.setValueAtTime(1e-3, now + t);
          if (gain.gain.exponentialRampToValueAtTime) {
            gain.gain.exponentialRampToValueAtTime(0.32 * effectiveVolume, now + t + 8e-3);
            gain.gain.exponentialRampToValueAtTime(1e-3, now + t + dur);
          }
          osc.connect(gain);
          gain.connect(ctx.destination);
          if (osc.start) osc.start(now + t);
          if (osc.stop) osc.stop(now + t + dur + 0.02);
        });
      } catch (_) {
      }
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
      if (!eventBus || typeof eventBus.on !== "function") {
        return () => {
        };
      }
      const unsubSuccess = eventBus.on("KEY_PRESSED_SUCCESS", (payload) => {
        const combo = payload && typeof payload.comboCount === "number" ? payload.comboCount : 1;
        this.playSuccess(combo);
      });
      const unsubFail = eventBus.on("KEY_PRESSED_FAIL", () => {
        this.playMiss();
      });
      const unsubLevelCompleted = eventBus.on("LEVEL_COMPLETED", () => {
        this.playCelebration();
      });
      const disposer = () => {
        if (typeof unsubSuccess === "function") unsubSuccess();
        if (typeof unsubFail === "function") unsubFail();
        if (typeof unsubLevelCompleted === "function") unsubLevelCompleted();
      };
      this._eventDisposers.push(disposer);
      return disposer;
    }
    /**
     * Disposes all EventBus subscriptions and closes the AudioContext if opened.
     */
    dispose() {
      for (const d of this._eventDisposers) {
        try {
          d();
        } catch (_) {
        }
      }
      this._eventDisposers = [];
      if (this._audioCtx && typeof this._audioCtx.close === "function") {
        try {
          this._audioCtx.close();
        } catch (_) {
        }
        this._audioCtx = null;
      }
    }
  };

  // src/audio/VoiceQueue.js
  var VOICE_PRIORITIES = Object.freeze({
    CRITICAL: 4,
    HIGH: 3,
    NORMAL: 2,
    LOW: 1
  });
  var PRONUNCIATION_MODES = Object.freeze({
    LETTER_NAME: "LETTER_NAME",
    PHONETIC: "PHONETIC"
  });
  var SPANISH_LETTER_NAMES = Object.freeze({
    "a": "a",
    "b": "be",
    "c": "ce",
    "d": "de",
    "e": "e",
    "f": "efe",
    "g": "ge",
    "h": "hache",
    "i": "i",
    "j": "jota",
    "k": "ka",
    "l": "ele",
    "m": "eme",
    "n": "ene",
    "\xF1": "e\xF1e",
    "o": "o",
    "p": "pe",
    "q": "cu",
    "r": "erre",
    "s": "ese",
    "t": "te",
    "u": "u",
    "v": "uve",
    "w": "uve doble",
    "x": "equis",
    "y": "ye",
    "z": "zeta",
    " ": "espacio",
    "enter": "intro",
    "intro": "intro",
    "shift": "may\xFAsculas",
    "backspace": "borrar"
  });
  var SPANISH_PHONETIC_SOUNDS = Object.freeze({
    "a": "a",
    "b": "b",
    "c": "k",
    "d": "d",
    "e": "e",
    "f": "fff",
    "g": "g",
    "h": "h",
    "i": "i",
    "j": "jjj",
    "k": "k",
    "l": "lll",
    "m": "mmm",
    "n": "nnn",
    "\xF1": "\xF1\xF1\xF1",
    "o": "o",
    "p": "p",
    "q": "k",
    "r": "rrr",
    "s": "sss",
    "t": "t",
    "u": "u",
    "v": "b",
    "w": "u",
    "x": "ks",
    "y": "y",
    "z": "zzz",
    " ": "espacio",
    "enter": "intro",
    "intro": "intro",
    "shift": "may\xFAsculas",
    "backspace": "borrar"
  });
  var SHORT_INTERJECTIONS = Object.freeze([
    "\xA1Bien!",
    "\xA1Genial!",
    "\xA1Eso!",
    "\xA1Sigue!",
    "\xA1Muy bien!",
    "\xA1Bravo!",
    "\xA1S\xFAper!",
    "\xA1Excelente!"
  ]);
  function cleanSpeechText(text) {
    if (!text || typeof text !== "string") return "";
    let c = text;
    c = c.replace(/\[(espacio|space)\]/gi, "barra espaciadora");
    c = c.replace(/(?:la\s+)?tecla\s+\[([a-zA-ZñÑ0-9])\]/gi, "tecla $1");
    c = c.replace(/\[([a-zA-ZñÑ0-9])\]/g, "$1");
    c = c.replace(/\[([^\]]+)\]/g, "$1");
    c = c.replace(/\p{Extended_Pictographic}/gu, "");
    c = c.replace(/[\u2600-\u27BF\u2B50\u2B55\u2300-\u23FF\u2190-\u21FF\u2934\u2935\uFE0E\uFE0F]/gu, "");
    c = c.replace(/[💡🤖⭐☆🚀✋🥋⚪🟡🟢⚫👑🎮🔥👍💖✨🐾🎼🎶🎁🧂🪽☕🛋️👗🎀👉👈⌨️💤⚡🏆🎯]/g, "");
    c = c.replace(/^[\s\W]*Consejo\s*(de\s*Roby)?\s*:\s*/i, "");
    c = c.replace(/\(([^)]+)\)/g, "$1");
    c = c.replace(/\btecla\s+tecla\b/gi, "tecla");
    c = c.replace(/\s+/g, " ").trim();
    return c;
  }
  function scoreVoice(v) {
    if (!v) return -1e3;
    const name = (v.name || "").toLowerCase();
    const lang = (v.lang || "").toLowerCase();
    const uri = (v.voiceURI || "").toLowerCase();
    let score = 0;
    const isSpanish = lang.startsWith("es") || name.includes("spanish") || uri.includes("spanish");
    if (!isSpanish) return -500;
    score += 100;
    if (name.includes("desktop") || uri.includes("desktop") || name.includes("sapi")) {
      score -= 80;
    }
    if (name.includes("natural") || uri.includes("natural") || name.includes("online")) {
      score += 120;
    }
    if (name.includes("\xE1lvaro") || name.includes("alvaro")) {
      score += 90;
    } else if (name.includes("elvira")) {
      score += 85;
    } else if (name.includes("ximena")) {
      score += 80;
    } else if (name.includes("google") && isSpanish) {
      score += 75;
    } else if (name.includes("jorge") && isSpanish) {
      score += 70;
    } else if (name.includes("dalia") || name.includes("salome") || name.includes("mateo")) {
      score += 65;
    } else if (name.includes("laura") || name.includes("pablo")) {
      score += 50;
    }
    if (lang === "es-es") score += 10;
    return score;
  }
  var VoiceQueue = class {
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
      this._volume = typeof options.volume === "number" ? Math.max(0, Math.min(1, options.volume)) : 1;
      this._rate = typeof options.rate === "number" ? options.rate : 0.95;
      this._pitch = typeof options.pitch === "number" ? options.pitch : 1;
      this._pronunciationMode = options.pronunciationMode === PRONUNCIATION_MODES.PHONETIC ? PRONUNCIATION_MODES.PHONETIC : PRONUNCIATION_MODES.LETTER_NAME;
      this._rateThrottleThreshold = options.rateThrottleThreshold || 25;
      this._muted = typeof options.muted === "boolean" ? options.muted : false;
      this._voiceEngine = options.voiceEngine || null;
      this._queue = [];
      this._currentRequest = null;
      this._isSpeaking = false;
      this._currentPPM = 0;
      this._lastInterjectionTime = 0;
      this._preferredVoice = null;
      this._eventDisposers = [];
      this._recentKeystrokes = [];
      this._initVoices();
    }
    /**
     * Resolves the SpeechSynthesis instance safely across browsers and headless mocks.
     * @returns {Object|null}
     */
    getSpeechSynthesis() {
      if (this._customSynth) return this._customSynth;
      if (typeof window !== "undefined" && window.speechSynthesis) {
        return window.speechSynthesis;
      }
      if (typeof globalThis !== "undefined" && globalThis.speechSynthesis) {
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
      if (typeof window !== "undefined" && window.SpeechSynthesisUtterance) {
        return window.SpeechSynthesisUtterance;
      }
      if (typeof globalThis !== "undefined" && globalThis.SpeechSynthesisUtterance) {
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
      if (!synth || typeof synth.getVoices !== "function") return;
      const pickVoice = () => {
        const voices = synth.getVoices() || [];
        if (!Array.isArray(voices) || voices.length === 0) return;
        const ranked = [...voices].sort((a, b) => scoreVoice(b) - scoreVoice(a));
        if (ranked.length > 0 && scoreVoice(ranked[0]) > 0) {
          this._preferredVoice = ranked[0];
        } else {
          const fallback = voices.find((v) => v.lang && v.lang.startsWith("es")) || voices[0];
          if (fallback) this._preferredVoice = fallback;
        }
      };
      pickVoice();
      if (synth.onvoiceschanged !== void 0) {
        synth.onvoiceschanged = pickVoice;
      }
    }
    /**
     * Converts a priority string or number to numeric ranking (1 to 4).
     * @param {string|number} priority
     * @returns {number}
     */
    _normalizePriority(priority) {
      if (typeof priority === "number") {
        return Math.max(1, Math.min(4, Math.round(priority)));
      }
      if (typeof priority === "string") {
        const upper = priority.toUpperCase();
        if (VOICE_PRIORITIES[upper] !== void 0) {
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
      if (typeof vol === "number" && !isNaN(vol)) {
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
      if (!key || typeof key !== "string") return false;
      const lowerKey = key.toLowerCase();
      let spokenText = key;
      if (this._pronunciationMode === PRONUNCIATION_MODES.PHONETIC) {
        spokenText = SPANISH_PHONETIC_SOUNDS[lowerKey] || key;
      } else {
        spokenText = SPANISH_LETTER_NAMES[lowerKey] || key;
      }
      return this.speak({
        text: spokenText,
        priority: options.priority || "NORMAL",
        emotion: options.emotion || "happy",
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
      if (!request || !request.text || typeof request.text !== "string") {
        return false;
      }
      if (this._muted || this._volume <= 0) {
        if (typeof request.onEnd === "function") {
          setTimeout(request.onEnd, 10);
        }
        return false;
      }
      const priorityLevel = this._normalizePriority(request.priority);
      let textToSpeak = cleanSpeechText(request.text);
      if (!textToSpeak) return false;
      if (this._currentPPM > this._rateThrottleThreshold && priorityLevel < VOICE_PRIORITIES.CRITICAL) {
        const now = Date.now();
        if (textToSpeak.length > 16 || textToSpeak.includes(" ")) {
          if (now - this._lastInterjectionTime < 2500) {
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
        priority: request.priority || "NORMAL",
        emotion: request.emotion || "happy",
        rate: typeof request.rate === "number" ? request.rate : this._rate,
        pitch: typeof request.pitch === "number" ? request.pitch : this._pitch,
        onStart: request.onStart,
        onEnd: request.onEnd
      };
      if (priorityLevel === VOICE_PRIORITIES.CRITICAL) {
        this._cancelCurrent();
        this._queue = this._queue.filter((q) => q.priorityLevel >= VOICE_PRIORITIES.CRITICAL);
        this._queue.unshift(item);
        this._processQueue();
        return true;
      }
      if (this._isSpeaking && this._currentRequest) {
        if (priorityLevel > this._currentRequest.priorityLevel) {
          this._cancelCurrent();
          this._queue.unshift(item);
          this._processQueue();
          return true;
        }
      }
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
      if (this._voiceEngine && typeof this._voiceEngine.speak === "function") {
        const item2 = this._queue.shift();
        this._currentRequest = item2;
        this._isSpeaking = true;
        const req = {
          text: item2.text,
          audioId: item2.audioId || null,
          onStart: () => {
            if (typeof item2.onStart === "function") item2.onStart();
          },
          onEnd: () => {
            this._isSpeaking = false;
            this._currentRequest = null;
            if (typeof item2.onEnd === "function") item2.onEnd();
            this._processQueue();
          }
        };
        this._voiceEngine.speak(req).catch(() => {
          this._isSpeaking = false;
          this._currentRequest = null;
          if (typeof item2.onEnd === "function") item2.onEnd();
          this._processQueue();
        });
        return;
      }
      const synth = this.getSpeechSynthesis();
      const UtteranceClass = this.getUtteranceClass();
      if (!synth || !UtteranceClass) {
        const item2 = this._queue.shift();
        if (item2) {
          if (typeof item2.onStart === "function") item2.onStart();
          if (typeof item2.onEnd === "function") setTimeout(item2.onEnd, 10);
        }
        return;
      }
      const item = this._queue.shift();
      this._currentRequest = item;
      this._isSpeaking = true;
      try {
        const utterance = new UtteranceClass(item.text);
        utterance.lang = "es-ES";
        utterance.volume = this._volume;
        utterance.rate = item.rate || this._rate;
        utterance.pitch = item.pitch || this._pitch;
        if (this._preferredVoice) {
          utterance.voice = this._preferredVoice;
        }
        utterance.onstart = () => {
          if (typeof item.onStart === "function") {
            item.onStart();
          }
        };
        const handleEnd = () => {
          this._isSpeaking = false;
          this._currentRequest = null;
          if (typeof item.onEnd === "function") {
            item.onEnd();
          }
          this._processQueue();
        };
        utterance.onend = handleEnd;
        utterance.onerror = (err) => {
          handleEnd();
        };
        synth.speak(utterance);
      } catch (err) {
        console.warn("[VoiceQueue] Speech error:", err.message);
        this._isSpeaking = false;
        this._currentRequest = null;
        if (typeof item.onEnd === "function") item.onEnd();
        this._processQueue();
      }
    }
    /**
     * Cancels the currently active utterance cleanly.
     * @private
     */
    _cancelCurrent() {
      if (this._voiceEngine && typeof this._voiceEngine.stop === "function") {
        try {
          this._voiceEngine.stop();
        } catch (_) {
        }
      }
      const synth = this.getSpeechSynthesis();
      if (synth && typeof synth.cancel === "function") {
        try {
          synth.cancel();
        } catch (_) {
        }
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
      if (!eventBus || typeof eventBus.on !== "function") {
        return () => {
        };
      }
      const unsubMascotSpeak = eventBus.on("MASCOT_SPEAK_REQUEST", (payload) => {
        if (!payload || !payload.text) return;
        const now = Date.now();
        if (payload.emotion === "thinking" && this._lastStuckSpokenTime && now - this._lastStuckSpokenTime < 2500) {
          return;
        }
        this.speak({
          text: payload.text,
          priority: payload.priority || "NORMAL",
          emotion: payload.emotion || "happy",
          audioId: payload.audioId || null
        });
      });
      const unsubLevelCompleted = eventBus.on("LEVEL_COMPLETED", (payload) => {
        const stars = payload && typeof payload.stars === "number" ? payload.stars : 3;
        let victoryText = "\xA1Nivel completado! \xA1Incre\xEDble trabajo!";
        if (stars === 3) {
          victoryText = "\xA1Excelente! \xA1Tres estrellas perfectas! \xA1Choca esos cinco!";
        } else if (stars === 2) {
          victoryText = "\xA1Muy bien hecho! \xA1Has ganado dos estrellas!";
        }
        this.speak({
          text: victoryText,
          priority: "CRITICAL",
          emotion: "victory"
        });
      });
      const unsubUserStuck = eventBus.on("USER_STUCK", (payload) => {
        if (!payload || !payload.expectedKey) return;
        const now = Date.now();
        if (this._lastStuckSpokenTime && now - this._lastStuckSpokenTime < 5e3) {
          return;
        }
        this._lastStuckSpokenTime = now;
        const keyName = SPANISH_LETTER_NAMES[payload.expectedKey.toLowerCase()] || payload.expectedKey;
        this.speak({
          text: `Pulsa la tecla ${keyName}`,
          priority: "HIGH",
          emotion: "thinking"
        });
      });
      const unsubKeySuccess = eventBus.on("KEY_PRESSED_SUCCESS", () => {
        this.cancel();
        const now = Date.now();
        this._recentKeystrokes.push(now);
        const cutoff = now - 15e3;
        this._recentKeystrokes = this._recentKeystrokes.filter((t) => t >= cutoff);
        if (this._recentKeystrokes.length >= 2) {
          const spanMs = now - this._recentKeystrokes[0];
          if (spanMs > 1e3) {
            const ppm = Math.round(this._recentKeystrokes.length / (spanMs / 6e4));
            this.setTypingRate(ppm);
          }
        }
      });
      const disposer = () => {
        if (typeof unsubMascotSpeak === "function") unsubMascotSpeak();
        if (typeof unsubLevelCompleted === "function") unsubLevelCompleted();
        if (typeof unsubUserStuck === "function") unsubUserStuck();
        if (typeof unsubKeySuccess === "function") unsubKeySuccess();
      };
      this._eventDisposers.push(disposer);
      return disposer;
    }
    /**
     * Disposes all EventBus subscriptions and cancels active speech.
     */
    dispose() {
      for (const d of this._eventDisposers) {
        try {
          d();
        } catch (_) {
        }
      }
      this._eventDisposers = [];
      this.cancel();
    }
  };

  // src/audio/VoiceEngine.js
  var VOICE_TIERS = Object.freeze({
    EDGE_NATURAL: 100,
    GOOGLE_ESPANOL: 80,
    APPLE_ENHANCED: 70,
    SAPI5_DESKTOP: -100
  });
  var VoiceEngine = class {
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
      this._volume = typeof options.volume === "number" ? Math.max(0, Math.min(1, options.volume)) : 1;
      this._muted = Boolean(options.muted);
      this.eventBus = options.eventBus || null;
      this._highpassNode = null;
      this._peakingNode = null;
      this._compressorNode = null;
      this._analyserNode = null;
      this._voiceGainNode = null;
      this._sfxGainNode = null;
      this._manifest = null;
      this._audioBufferCache = /* @__PURE__ */ new Map();
      this._activeSourceNode = null;
      this._preferredVoice = null;
      this._allVoices = [];
      this._isSpeaking = false;
      this._visemeCallback = null;
      this._setupAutoplayUnlock();
      this._initSpeechVoices();
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
      const AudioContextClass = typeof window !== "undefined" ? window.AudioContext || window.webkitAudioContext : typeof globalThis !== "undefined" ? globalThis.AudioContext : null;
      if (!AudioContextClass) return null;
      try {
        this._audioCtx = new AudioContextClass();
        this._buildDspGraph();
      } catch (err) {
        console.warn("[VoiceEngine] Failed to initialize AudioContext:", err.message);
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
      this._highpassNode = ctx.createBiquadFilter();
      this._highpassNode.type = "highpass";
      this._highpassNode.frequency.setValueAtTime(85, ctx.currentTime);
      this._peakingNode = ctx.createBiquadFilter();
      this._peakingNode.type = "peaking";
      this._peakingNode.frequency.setValueAtTime(2800, ctx.currentTime);
      this._peakingNode.Q.setValueAtTime(1.2, ctx.currentTime);
      this._peakingNode.gain.setValueAtTime(2.5, ctx.currentTime);
      this._compressorNode = ctx.createDynamicsCompressor();
      this._compressorNode.threshold.setValueAtTime(-20, ctx.currentTime);
      this._compressorNode.knee.setValueAtTime(15, ctx.currentTime);
      this._compressorNode.ratio.setValueAtTime(3, ctx.currentTime);
      this._compressorNode.attack.setValueAtTime(5e-3, ctx.currentTime);
      this._compressorNode.release.setValueAtTime(0.15, ctx.currentTime);
      this._analyserNode = ctx.createAnalyser();
      this._analyserNode.fftSize = 256;
      this._analyserNode.smoothingTimeConstant = 0.5;
      this._voiceGainNode = ctx.createGain();
      this._voiceGainNode.gain.setValueAtTime(this._muted ? 0 : this._volume, ctx.currentTime);
      this._sfxGainNode = ctx.createGain();
      this._sfxGainNode.gain.setValueAtTime(0.85, ctx.currentTime);
      this._highpassNode.connect(this._peakingNode);
      this._peakingNode.connect(this._compressorNode);
      this._compressorNode.connect(this._analyserNode);
      this._analyserNode.connect(this._voiceGainNode);
      this._voiceGainNode.connect(ctx.destination);
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
      if (ctx && ctx.state === "suspended" && typeof ctx.resume === "function") {
        try {
          await ctx.resume();
        } catch (err) {
          console.warn("[VoiceEngine] resume() failed:", err.message);
        }
      }
    }
    /**
     * Automatically unlocks AudioContext on first pointer/key interaction.
     * @private
     */
    _setupAutoplayUnlock() {
      if (typeof window === "undefined" || typeof window.addEventListener !== "function") return;
      const unlockHandler = () => {
        this.resume();
        const ctx = this.getAudioContext();
        if (ctx && ctx.state === "running") {
          const events2 = ["pointerdown", "touchstart", "keydown", "click"];
          for (const evt of events2) {
            window.removeEventListener(evt, unlockHandler, true);
          }
        }
      };
      const events = ["pointerdown", "touchstart", "keydown", "click"];
      for (const evt of events) {
        window.addEventListener(evt, unlockHandler, { capture: true, passive: true });
      }
    }
    /**
     * Asynchronously loads pre-rendered neural voice manifest.
     * @private
     */
    async _loadManifest() {
      if (typeof fetch !== "function") return;
      try {
        const res = await fetch("assets/audio/voices/manifest.json");
        if (res.ok) {
          this._manifest = await res.json();
        }
      } catch (_) {
        this._manifest = {
          phrases: {
            welcome: { file: "assets/audio/voices/welcome.mp3" },
            hand_position: { file: "assets/audio/voices/hand_position.mp3" },
            error_cheer_1: { file: "assets/audio/voices/error_cheer_1.mp3" },
            error_cheer_2: { file: "assets/audio/voices/error_cheer_2.mp3" },
            streak_10: { file: "assets/audio/voices/streak_10.mp3" },
            streak_20: { file: "assets/audio/voices/streak_20.mp3" },
            level_complete_3stars: { file: "assets/audio/voices/level_complete_3stars.mp3" },
            level_complete_2stars: { file: "assets/audio/voices/level_complete_2stars.mp3" },
            level_complete_1star: { file: "assets/audio/voices/level_complete_1star.mp3" },
            high_five: { file: "assets/audio/voices/high_five.mp3" }
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
      if (!rawText || typeof rawText !== "string") return "";
      let text = cleanSpeechText(rawText);
      text = text.replace(/([!¡?¿]+)\s*/g, "$1 ");
      text = text.replace(/([,;])\s*/g, "$1 ");
      text = text.replace(/\s+/g, " ").trim();
      return text;
    }
    /**
     * Scores and ranks SpeechSynthesis voices to ensure high-fidelity neural voices.
     * @param {SpeechSynthesisVoice} voice
     * @returns {number} Score
     */
    scoreVoice(voice) {
      if (!voice) return -1e3;
      const name = (voice.name || "").toLowerCase();
      const lang = (voice.lang || "").toLowerCase();
      const uri = (voice.voiceURI || "").toLowerCase();
      if (!lang.startsWith("es") && !name.includes("spanish")) {
        return -500;
      }
      let score = 0;
      if (name.includes("desktop") || uri.includes("desktop") || name.includes("sapi") || name.includes("espeak")) {
        return -100;
      }
      if (name.includes("natural") || name.includes("online")) {
        score += 100;
        if (name.includes("\xE1lvaro") || name.includes("alvaro")) score += 20;
        else if (name.includes("elvira")) score += 18;
        else if (name.includes("ximena")) score += 15;
        else if (name.includes("alonso")) score += 12;
      } else if (name.includes("google")) {
        score += 80;
      } else if (name.includes("enhanced") || name.includes("premium") || name.includes("m\xF3nica") || name.includes("paulina")) {
        score += 70;
      } else {
        score += 40;
      }
      if (lang === "es-es") score += 5;
      return score;
    }
    /**
     * Initializes SpeechSynthesis voices with async retry mechanism.
     * @private
     */
    _initSpeechVoices() {
      if (typeof window === "undefined" || !window.speechSynthesis) return;
      const synth = window.speechSynthesis;
      const pickBest = () => {
        const voices = synth.getVoices() || [];
        if (!Array.isArray(voices) || voices.length === 0) return;
        this._allVoices = voices.filter((v) => (v.lang || "").toLowerCase().startsWith("es"));
        const ranked = [...voices].sort((a, b) => this.scoreVoice(b) - this.scoreVoice(a));
        if (ranked.length > 0 && this.scoreVoice(ranked[0]) > -50) {
          this._preferredVoice = ranked[0];
        }
      };
      pickBest();
      if (synth.onvoiceschanged !== void 0) {
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
      if (typeof window === "undefined" || !window.speechSynthesis) return [];
      const synth = window.speechSynthesis;
      const voices = synth.getVoices() || [];
      const spanish = voices.filter((v) => (v.lang || "").toLowerCase().startsWith("es"));
      spanish.sort((a, b) => this.scoreVoice(b) - this.scoreVoice(a));
      return spanish.map((v) => ({
        id: v.name,
        name: v.name.replace(/Microsoft\s+/i, "").replace(/\s*-\s*Spanish.*$/i, ""),
        lang: v.lang,
        isNatural: v.name.toLowerCase().includes("natural") || v.name.toLowerCase().includes("google")
      }));
    }
    /**
     * Sets preferred voice by name or voiceURI.
     * @param {string} voiceName
     */
    setVoice(voiceName) {
      if (!voiceName || typeof window === "undefined" || !window.speechSynthesis) return;
      const synth = window.speechSynthesis;
      const voices = synth.getVoices() || [];
      const found = voices.find((v) => v.name === voiceName || v.voiceURI === voiceName);
      if (found) {
        this._preferredVoice = found;
      }
    }
    /**
     * Finds the best offline/local Spanish voice for instant fallback if online synthesis fails.
     * @private
     */
    _findLocalSpanishVoice() {
      if (typeof window === "undefined" || !window.speechSynthesis) return null;
      const voices = window.speechSynthesis.getVoices() || [];
      const local = voices.find((v) => (v.lang || "").toLowerCase().startsWith("es") && v.localService);
      if (local) return local;
      const offline = voices.find((v) => (v.lang || "").toLowerCase().startsWith("es") && !v.name.includes("Online"));
      if (offline) return offline;
      return voices.find((v) => (v.lang || "").toLowerCase().startsWith("es")) || null;
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
        if (typeof request.onEnd === "function") setTimeout(request.onEnd, 10);
        return false;
      }
      const phraseId = request.audioId || this._matchPhraseId(request.text);
      if (phraseId && this._manifest && this._manifest.phrases && this._manifest.phrases[phraseId]) {
        const audioCtx = this.getAudioContext();
        if (audioCtx && audioCtx.state === "suspended") {
          try {
            this.resume();
          } catch (_) {
          }
        }
        const audioFile = this._manifest.phrases[phraseId].file;
        const played = await this._playPreRenderedAudio(audioFile, request);
        if (played) return true;
      }
      const textToSpeak = this.normalizeProsody(request.text || "");
      if (!textToSpeak) {
        if (typeof request.onEnd === "function") request.onEnd();
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
      if (!text || typeof text !== "string") return null;
      const clean = text.toLowerCase().replace(/[^a-záéíóúüñ0-9\s]/gi, "").trim();
      if (clean.startsWith("hola supermecan\xF3grafo") || clean.startsWith("hola supermecanografo") || clean.includes("soy roby tu compa\xF1ero de aventuras")) return "welcome";
      if (clean.startsWith("coloca tus dedos \xEDndices en las teclas f y j") || clean.startsWith("coloca tus dedos indices en las teclas f y j")) return "hand_position";
      if (clean.startsWith("incre\xEDble racha de diez aciertos") || clean.startsWith("increible racha de diez aciertos")) return "streak_10";
      if (clean.startsWith("sensacional veinte aciertos seguidos")) return "streak_20";
      if (clean.startsWith("misi\xF3n cumplida tres estrellas perfectas") || clean.startsWith("mision cumplida tres estrellas perfectas")) return "level_complete_3stars";
      if (clean.startsWith("muy bien hecho has superado el desaf\xEDo con dos estrellas") || clean.startsWith("muy bien hecho has superado el desafio con dos estrellas")) return "level_complete_2stars";
      if (clean.startsWith("bien jugado has completado el nivel")) return "level_complete_1star";
      if (clean.startsWith("choca esos cinco pulsa la barra espaciadora para celebrar")) return "high_five";
      if (clean.startsWith("no te preocupes equivocarse es el truco secreto para aprender")) return "error_cheer_1";
      if (clean.startsWith("respira hondo y busca la tecla iluminada t\xFA tienes superpoderes") || clean.startsWith("respira hondo y busca la tecla iluminada tu tienes superpoderes")) return "error_cheer_2";
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
          if (typeof request.onEnd === "function") request.onEnd();
        };
        if (typeof request.onStart === "function") request.onStart();
        source.start(ctx.currentTime);
        return true;
      } catch (err) {
        console.warn("[VoiceEngine] Pre-rendered audio playback failed:", err.message);
        return false;
      }
    }
    /**
     * Synthesizes text using SpeechSynthesis with strict formant preservation and viseme emission.
     * @private
     */
    _speakWithSpeechSynthesis(text, request) {
      if (typeof window === "undefined" || !window.speechSynthesis || !window.SpeechSynthesisUtterance) {
        if (typeof request.onEnd === "function") setTimeout(request.onEnd, 10);
        return false;
      }
      this.stop();
      try {
        const synth = window.speechSynthesis;
        if (synth.paused) {
          try {
            synth.resume();
          } catch (_) {
          }
        }
        const utterance = new window.SpeechSynthesisUtterance(text);
        utterance.lang = "es-ES";
        utterance.volume = this._volume;
        utterance.rate = 1.01;
        utterance.pitch = 1.02;
        if (this._preferredVoice) {
          utterance.voice = this._preferredVoice;
        }
        this._activeUtterance = utterance;
        if (typeof window !== "undefined") {
          window._activeSpeechUtterance = utterance;
        }
        let finished = false;
        const done = () => {
          if (finished) return;
          finished = true;
          this._isSpeaking = false;
          this._activeUtterance = null;
          if (typeof window !== "undefined") window._activeSpeechUtterance = null;
          if (typeof request.onEnd === "function") request.onEnd();
        };
        utterance.onstart = () => {
          this._isSpeaking = true;
          if (typeof request.onStart === "function") request.onStart();
        };
        utterance.onboundary = (e) => {
          if (typeof request.onViseme === "function") {
            const char = text[e.charIndex] || "";
            request.onViseme(char);
          }
        };
        utterance.onend = () => {
          done();
        };
        let retriedWithLocal = false;
        utterance.onerror = (e) => {
          const errType = e.error || "";
          if (!retriedWithLocal && (errType === "not-allowed" || errType === "network" || errType === "voice-unavailable")) {
            retriedWithLocal = true;
            const fallbackVoice = this._findLocalSpanishVoice();
            const retryUtterance = new window.SpeechSynthesisUtterance(text);
            retryUtterance.lang = "es-ES";
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
            if (typeof window !== "undefined") window._activeSpeechUtterance = retryUtterance;
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
        const safetyTimeoutMs = Math.max(3e3, text.length * 120);
        setTimeout(() => {
          if (!finished && this._activeUtterance === utterance) {
            done();
          }
        }, safetyTimeoutMs);
        synth.speak(utterance);
        return true;
      } catch (err) {
        this._isSpeaking = false;
        if (typeof request.onEnd === "function") request.onEnd();
        return false;
      }
    }
    /**
     * Stops any currently playing speech.
     */
    stop() {
      if (this._activeSourceNode) {
        try {
          this._activeSourceNode.stop();
        } catch (_) {
        }
        this._activeSourceNode = null;
      }
      if (typeof window !== "undefined" && window.speechSynthesis) {
        try {
          window.speechSynthesis.cancel();
        } catch (_) {
        }
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
        const baseFreq = 480 + Math.min(combo * 16, 240);
        osc.type = "triangle";
        osc.frequency.setValueAtTime(baseFreq, now);
        filter.type = "bandpass";
        filter.frequency.setValueAtTime(baseFreq * 1.5, now);
        filter.Q.setValueAtTime(3, now);
        gain.gain.setValueAtTime(1e-3, now);
        gain.gain.exponentialRampToValueAtTime(0.18, now + 4e-3);
        gain.gain.exponentialRampToValueAtTime(1e-3, now + 0.035);
        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this._sfxGainNode);
        osc.start(now);
        osc.stop(now + 0.04);
      } catch (_) {
      }
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
        osc.type = "sine";
        osc.frequency.setValueAtTime(140, now);
        osc.frequency.exponentialRampToValueAtTime(55, now + 0.12);
        filter.type = "lowpass";
        filter.frequency.setValueAtTime(380, now);
        gain.gain.setValueAtTime(0.22, now);
        gain.gain.exponentialRampToValueAtTime(1e-3, now + 0.14);
        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this._sfxGainNode);
        osc.start(now);
        osc.stop(now + 0.15);
      } catch (_) {
      }
    }
    /**
     * Emits a lush ascending celebratory chord (Do-Mi-Sol-Do / C4-E4-G4-C5) on level completion.
     */
    playVictoryChord() {
      const ctx = this.getAudioContext();
      if (!ctx || this._muted) return;
      try {
        const now = ctx.currentTime;
        const chord = [261.63, 329.63, 392, 523.25];
        chord.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          const delay = idx * 0.065;
          osc.type = "sine";
          osc.frequency.setValueAtTime(freq, now + delay);
          gain.gain.setValueAtTime(1e-3, now + delay);
          gain.gain.exponentialRampToValueAtTime(0.18, now + delay + 0.015);
          gain.gain.exponentialRampToValueAtTime(1e-3, now + delay + 0.7);
          osc.connect(gain);
          gain.connect(this._sfxGainNode);
          osc.start(now + delay);
          osc.stop(now + delay + 0.75);
        });
      } catch (_) {
      }
    }
  };

  // src/audio/AccessibilityPanel.js
  var STORAGE_KEY_A11Y = "mecano_a11y_settings";
  var DYSLEXIA_FONTS = Object.freeze({
    DEFAULT: "default",
    OPENDYSLEXIC: "opendyslexic",
    COMICSANS: "comicsans"
  });
  var DEFAULT_A11Y_SETTINGS = Object.freeze({
    musicVolume: 0.8,
    sfxVolume: 0.8,
    voiceVolume: 0.85,
    dyslexiaFont: DYSLEXIA_FONTS.DEFAULT,
    highContrast: false,
    pronunciationMode: "LETTER_NAME"
  });
  var AccessibilityPanel = class {
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
      this._onMusicVolumeChange = typeof options.onMusicVolumeChange === "function" ? options.onMusicVolumeChange : null;
      this._onSettingsChange = typeof options.onSettingsChange === "function" ? options.onSettingsChange : null;
      this._container = options.container || null;
      this._element = null;
      this._backdrop = null;
      this._isOpen = false;
      this._settings = { ...DEFAULT_A11Y_SETTINGS };
      this.loadSettings();
      this.applySettings();
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
      if (typeof window !== "undefined" && window.localStorage) {
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
        if (typeof backend.getItem === "function") {
          raw = backend.getItem(STORAGE_KEY_A11Y);
        } else if (typeof backend._readJson === "function") {
          raw = backend._readJson(STORAGE_KEY_A11Y, null);
        }
        if (raw) {
          const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
          if (parsed && typeof parsed === "object") {
            if (typeof parsed.musicVolume === "number") this._settings.musicVolume = Math.max(0, Math.min(1, parsed.musicVolume));
            if (typeof parsed.sfxVolume === "number") this._settings.sfxVolume = Math.max(0, Math.min(1, parsed.sfxVolume));
            if (typeof parsed.voiceVolume === "number") {
              this._settings.voiceVolume = parsed.voiceVolume > 0 ? Math.max(0, Math.min(1, parsed.voiceVolume)) : 0.85;
            }
            if (typeof parsed.highContrast === "boolean") this._settings.highContrast = parsed.highContrast;
            if (typeof parsed.dyslexiaFont === "string") this._settings.dyslexiaFont = parsed.dyslexiaFont;
            if (typeof parsed.pronunciationMode === "string") this._settings.pronunciationMode = parsed.pronunciationMode;
          }
        }
      } catch (err) {
        console.warn("[AccessibilityPanel] Failed to load a11y settings:", err.message);
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
        if (typeof backend.setItem === "function") {
          backend.setItem(STORAGE_KEY_A11Y, serialized);
        } else if (typeof backend._writeJson === "function") {
          backend._writeJson(STORAGE_KEY_A11Y, this._settings);
        }
        return true;
      } catch (err) {
        console.warn("[AccessibilityPanel] Failed to save a11y settings:", err.message);
        return false;
      }
    }
    /**
     * Applies the current settings to the DOM (body classes) and attached audio engines.
     */
    applySettings() {
      if (this._proceduralAudio && typeof this._proceduralAudio.setVolume === "function") {
        this._proceduralAudio.setVolume(this._settings.sfxVolume);
      }
      if (this._voiceQueue) {
        if (typeof this._voiceQueue.setVolume === "function") {
          this._voiceQueue.setVolume(this._settings.voiceVolume);
        }
        if (typeof this._voiceQueue.setPronunciationMode === "function") {
          this._voiceQueue.setPronunciationMode(this._settings.pronunciationMode);
        }
      }
      if (this._voiceEngine) {
        if (typeof this._voiceEngine.setVolume === "function") {
          this._voiceEngine.setVolume(this._settings.voiceVolume);
        }
      }
      if (this._onMusicVolumeChange) {
        try {
          this._onMusicVolumeChange(this._settings.musicVolume);
        } catch (_) {
        }
      }
      if (typeof document !== "undefined" && document.body) {
        const body = document.body;
        if (this._settings.highContrast) {
          body.classList.add("high-contrast");
        } else {
          body.classList.remove("high-contrast");
        }
        body.classList.remove("font-dyslexic", "font-opendyslexic", "font-comicsans");
        if (this._settings.dyslexiaFont === DYSLEXIA_FONTS.OPENDYSLEXIC) {
          body.classList.add("font-dyslexic", "font-opendyslexic");
        } else if (this._settings.dyslexiaFont === DYSLEXIA_FONTS.COMICSANS) {
          body.classList.add("font-dyslexic", "font-comicsans");
        }
      }
      if (this._onSettingsChange) {
        try {
          this._onSettingsChange({ ...this._settings });
        } catch (_) {
        }
      }
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
      if (!partial || typeof partial !== "object") return;
      if (typeof partial.musicVolume === "number") {
        this._settings.musicVolume = Math.max(0, Math.min(1, partial.musicVolume));
      }
      if (typeof partial.sfxVolume === "number") {
        this._settings.sfxVolume = Math.max(0, Math.min(1, partial.sfxVolume));
      }
      if (typeof partial.voiceVolume === "number") {
        this._settings.voiceVolume = Math.max(0, Math.min(1, partial.voiceVolume));
      }
      if (typeof partial.highContrast === "boolean") {
        this._settings.highContrast = partial.highContrast;
      }
      if (typeof partial.dyslexiaFont === "string") {
        this._settings.dyslexiaFont = partial.dyslexiaFont;
      }
      if (typeof partial.pronunciationMode === "string") {
        this._settings.pronunciationMode = partial.pronunciationMode;
      }
      this.saveSettings();
      this.applySettings();
    }
    // --- Individual Getters / Setters ---
    getMusicVolume() {
      return this._settings.musicVolume;
    }
    setMusicVolume(vol) {
      this.updateSettings({ musicVolume: vol });
    }
    getSfxVolume() {
      return this._settings.sfxVolume;
    }
    setSfxVolume(vol) {
      this.updateSettings({ sfxVolume: vol });
    }
    getVoiceVolume() {
      return this._settings.voiceVolume;
    }
    setVoiceVolume(vol) {
      this.updateSettings({ voiceVolume: vol });
    }
    getHighContrast() {
      return this._settings.highContrast;
    }
    setHighContrast(enabled) {
      this.updateSettings({ highContrast: Boolean(enabled) });
    }
    toggleHighContrast() {
      this.setHighContrast(!this._settings.highContrast);
    }
    getDyslexiaFont() {
      return this._settings.dyslexiaFont;
    }
    setDyslexiaFont(mode) {
      if (typeof mode === "boolean") {
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
    getPronunciationMode() {
      return this._settings.pronunciationMode;
    }
    setPronunciationMode(mode) {
      this.updateSettings({ pronunciationMode: mode });
    }
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
      if (!this._element && typeof document !== "undefined") {
        this.mount(document.body);
      }
      if (this._backdrop) {
        this._backdrop.classList.remove("hidden");
        this._backdrop.setAttribute("aria-hidden", "false");
      }
      if (this._element) {
        this._element.classList.remove("hidden");
      }
      this._isOpen = true;
      this._syncUI();
    }
    close() {
      if (this._backdrop) {
        this._backdrop.classList.add("hidden");
        this._backdrop.setAttribute("aria-hidden", "true");
      }
      if (this._element) {
        this._element.classList.add("hidden");
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
      if (typeof document === "undefined" || !container) return;
      this._container = container;
      let existing = document.getElementById("a11y-backdrop");
      if (existing && existing.parentNode) {
        existing.parentNode.removeChild(existing);
      }
      const backdrop = document.createElement("div");
      backdrop.id = "a11y-backdrop";
      backdrop.className = "a11y-backdrop hidden";
      backdrop.setAttribute("aria-hidden", "true");
      backdrop.innerHTML = `
      <div class="a11y-panel" id="a11y-panel" role="dialog" aria-modal="true" aria-labelledby="a11y-panel-title">
        <div class="a11y-header">
          <h2 id="a11y-panel-title">\u2699\uFE0F Accesibilidad y Audio</h2>
          <button class="a11y-close-btn" id="a11y-close-btn" aria-label="Cerrar panel de accesibilidad">\u2716</button>
        </div>
        <div class="a11y-body">
          <!-- \u{1F3B5} Music Volume Slider -->
          <div class="a11y-group">
            <div class="a11y-label-row">
              <label for="a11y-music-slider">\u{1F3B5} M\xFAsica de Fondo</label>
              <span id="a11y-music-val" class="a11y-badge">80%</span>
            </div>
            <div class="a11y-slider-row">
              <input type="range" id="a11y-music-slider" min="0" max="100" step="5" value="80" aria-label="Volumen de m\xFAsica de fondo" />
            </div>
          </div>

          <!-- \u{1F50A} SFX Volume Slider -->
          <div class="a11y-group">
            <div class="a11y-label-row">
              <label for="a11y-sfx-slider">\u{1F50A} Efectos de Sonido (SFX)</label>
              <span id="a11y-sfx-val" class="a11y-badge">80%</span>
            </div>
            <div class="a11y-slider-row">
              <input type="range" id="a11y-sfx-slider" min="0" max="100" step="5" value="80" aria-label="Volumen de efectos de sonido" />
              <button id="a11y-test-sfx-btn" class="a11y-mini-btn" type="button" title="Probar sonido">\u{1F514} Probar</button>
            </div>
          </div>

          <!-- \u{1F5E3}\uFE0F Voice Volume Slider -->
          <div class="a11y-group">
            <div class="a11y-label-row">
              <label for="a11y-voice-slider">\u{1F5E3}\uFE0F Voz de Roby</label>
              <span id="a11y-voice-val" class="a11y-badge">100%</span>
            </div>
            <div class="a11y-slider-row">
              <input type="range" id="a11y-voice-slider" min="0" max="100" step="5" value="100" aria-label="Volumen de voz de Roby" />
              <button id="a11y-test-voice-btn" class="a11y-mini-btn" type="button" title="Probar voz">\u{1F5E3}\uFE0F Probar</button>
            </div>
          </div>

          <!-- \u{1F50D} Text Size Accessibility Selector (#accessibility-text-size) -->
          <div class="a11y-group">
            <div class="a11y-label-row">
              <label for="accessibility-text-size">\u{1F50D} Tama\xF1o de Texto (Baja Visi\xF3n)</label>
            </div>
            <div class="a11y-btn-group" id="accessibility-text-size" role="radiogroup" aria-label="Tama\xF1o de texto">
              <button type="button" id="a11y-text-normal" class="a11y-toggle-btn" role="radio" aria-checked="true">Est\xE1ndar (1.0x)</button>
              <button type="button" id="a11y-text-grande" class="a11y-toggle-btn" role="radio" aria-checked="false">Grande (1.5x)</button>
              <button type="button" id="a11y-text-extra" class="a11y-toggle-btn" role="radio" aria-checked="false">Gigante (2.0x)</button>
            </div>
          </div>

          <!-- \u{1F4D6} Dyslexia Typography Toggle -->
          <div class="a11y-group">
            <div class="a11y-label-row">
              <label>\u{1F4D6} Tipograf\xEDa Adaptada (Dislexia)</label>
            </div>
            <div class="a11y-btn-group" role="radiogroup" aria-label="Selecci\xF3n de tipograf\xEDa adaptada">
              <button type="button" id="a11y-font-default" class="a11y-toggle-btn" role="radio" aria-checked="true">Normal (Fredoka)</button>
              <button type="button" id="a11y-font-opendyslexic" class="a11y-toggle-btn" role="radio" aria-checked="false">OpenDyslexic</button>
              <button type="button" id="a11y-font-comicsans" class="a11y-toggle-btn" role="radio" aria-checked="false">Comic Sans</button>
            </div>
          </div>

          <!-- \u{1F441}\uFE0F High Contrast Toggle -->
          <div class="a11y-group a11y-switch-row">
            <div>
              <div class="a11y-switch-title">\u{1F441}\uFE0F Modo Alto Contraste (WCAG AAA)</div>
              <div class="a11y-switch-sub">Fondo negro puro, bordes n\xEDtidos y teclas ne\xF3n</div>
            </div>
            <button type="button" id="a11y-high-contrast-toggle" class="a11y-switch-btn" role="switch" aria-checked="false">OFF</button>
          </div>

          <!-- \u{1F524} Phonetic Pronunciation Toggle -->
          <div class="a11y-group a11y-switch-row">
            <div>
              <div class="a11y-switch-title">\u{1F524} Lectura Fon\xE9tica de Teclas</div>
              <div class="a11y-switch-sub">Pronunciar sonido fon\xE9tico ('fff') en lugar del nombre ('efe')</div>
            </div>
            <button type="button" id="a11y-phonetic-toggle" class="a11y-switch-btn" role="switch" aria-checked="false">OFF</button>
          </div>

          <!-- \u21BA Reset Defaults Button -->
          <div class="a11y-footer">
            <button type="button" id="a11y-reset-btn" class="a11y-reset-btn">\u21BA Restaurar Valores</button>
          </div>
        </div>
      </div>
    `;
      container.appendChild(backdrop);
      this._backdrop = backdrop;
      this._element = backdrop.querySelector("#a11y-panel");
      this._attachEventListeners();
      this._syncUI();
    }
    /**
     * Binds interactive UI event listeners.
     * @private
     */
    _attachEventListeners() {
      if (!this._backdrop) return;
      const closeBtn = this._backdrop.querySelector("#a11y-close-btn");
      if (closeBtn) {
        closeBtn.addEventListener("click", () => this.close());
      }
      this._backdrop.addEventListener("click", (e) => {
        if (e.target === this._backdrop) {
          this.close();
        }
      });
      window.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && this._isOpen) {
          this.close();
        }
      });
      const musicSlider = this._backdrop.querySelector("#a11y-music-slider");
      if (musicSlider) {
        musicSlider.addEventListener("input", (e) => {
          const val = Number(e.target.value) / 100;
          this.setMusicVolume(val);
        });
      }
      const sfxSlider = this._backdrop.querySelector("#a11y-sfx-slider");
      if (sfxSlider) {
        sfxSlider.addEventListener("input", (e) => {
          const val = Number(e.target.value) / 100;
          this.setSfxVolume(val);
        });
      }
      const voiceSlider = this._backdrop.querySelector("#a11y-voice-slider");
      if (voiceSlider) {
        voiceSlider.addEventListener("input", (e) => {
          const val = Number(e.target.value) / 100;
          this.setVoiceVolume(val);
        });
      }
      const testSfxBtn = this._backdrop.querySelector("#a11y-test-sfx-btn");
      if (testSfxBtn && this._proceduralAudio) {
        testSfxBtn.addEventListener("click", () => {
          this._proceduralAudio.playSuccess(5);
        });
      }
      const testVoiceBtn = this._backdrop.querySelector("#a11y-test-voice-btn");
      if (testVoiceBtn && this._voiceQueue) {
        testVoiceBtn.addEventListener("click", () => {
          this._voiceQueue.speak({
            text: "\xA1Hola! Soy Roby y tu sonido est\xE1 perfecto.",
            priority: "HIGH"
          });
        });
      }
      const fontDefaultBtn = this._backdrop.querySelector("#a11y-font-default");
      const fontOpenDyslexicBtn = this._backdrop.querySelector("#a11y-font-opendyslexic");
      const fontComicSansBtn = this._backdrop.querySelector("#a11y-font-comicsans");
      if (fontDefaultBtn) {
        fontDefaultBtn.addEventListener("click", () => this.setDyslexiaFont(DYSLEXIA_FONTS.DEFAULT));
      }
      if (fontOpenDyslexicBtn) {
        fontOpenDyslexicBtn.addEventListener("click", () => this.setDyslexiaFont(DYSLEXIA_FONTS.OPENDYSLEXIC));
      }
      if (fontComicSansBtn) {
        fontComicSansBtn.addEventListener("click", () => this.setDyslexiaFont(DYSLEXIA_FONTS.COMICSANS));
      }
      const applyTextScale = (scaleId, mult) => {
        if (scaleId) {
          document.body.dataset.textScale = scaleId;
          document.documentElement.dataset.textScale = scaleId;
          document.documentElement.style.setProperty("--text-scale", mult);
        } else {
          delete document.body.dataset.textScale;
          delete document.documentElement.dataset.textScale;
          document.documentElement.style.setProperty("--text-scale", "1");
        }
        const targetWord = document.getElementById("target-word");
        if (targetWord) targetWord.style.setProperty("--text-scale", mult);
        const wordPanel = document.getElementById("word-panel");
        if (wordPanel) wordPanel.style.setProperty("--text-scale", mult);
        const zoomBtn = document.getElementById("zoom-toggle-btn");
        if (zoomBtn) {
          zoomBtn.textContent = scaleId === "extra" ? "\u{1F50D} Aa++" : scaleId === "grande" ? "\u{1F50D} Aa+" : "\u{1F50D} Aa";
        }
        try {
          localStorage.setItem("mecano_text_zoom", scaleId);
        } catch (_) {
        }
        this._syncUI();
      };
      const textNormalBtn = this._backdrop.querySelector("#a11y-text-normal");
      const textGrandeBtn = this._backdrop.querySelector("#a11y-text-grande");
      const textExtraBtn = this._backdrop.querySelector("#a11y-text-extra");
      if (textNormalBtn) textNormalBtn.addEventListener("click", () => applyTextScale("", "1"));
      if (textGrandeBtn) textGrandeBtn.addEventListener("click", () => applyTextScale("grande", "1.50"));
      if (textExtraBtn) textExtraBtn.addEventListener("click", () => applyTextScale("extra", "2.00"));
      const contrastBtn = this._backdrop.querySelector("#a11y-high-contrast-toggle");
      if (contrastBtn) {
        contrastBtn.addEventListener("click", () => this.toggleHighContrast());
      }
      const phoneticBtn = this._backdrop.querySelector("#a11y-phonetic-toggle");
      if (phoneticBtn) {
        phoneticBtn.addEventListener("click", () => {
          const nextMode = this._settings.pronunciationMode === "PHONETIC" ? "LETTER_NAME" : "PHONETIC";
          this.setPronunciationMode(nextMode);
        });
      }
      const resetBtn = this._backdrop.querySelector("#a11y-reset-btn");
      if (resetBtn) {
        resetBtn.addEventListener("click", () => this.resetDefaults());
      }
    }
    /**
     * Synchronizes visual control states to match internal settings.
     * @private
     */
    _syncUI() {
      if (!this._backdrop) return;
      const musicSlider = this._backdrop.querySelector("#a11y-music-slider");
      const musicVal = this._backdrop.querySelector("#a11y-music-val");
      const musicPct = Math.round(this._settings.musicVolume * 100);
      if (musicSlider) musicSlider.value = musicPct;
      if (musicVal) musicVal.textContent = `${musicPct}%`;
      const sfxSlider = this._backdrop.querySelector("#a11y-sfx-slider");
      const sfxVal = this._backdrop.querySelector("#a11y-sfx-val");
      const sfxPct = Math.round(this._settings.sfxVolume * 100);
      if (sfxSlider) sfxSlider.value = sfxPct;
      if (sfxVal) sfxVal.textContent = `${sfxPct}%`;
      const voiceSlider = this._backdrop.querySelector("#a11y-voice-slider");
      const voiceVal = this._backdrop.querySelector("#a11y-voice-val");
      const voicePct = Math.round(this._settings.voiceVolume * 100);
      if (voiceSlider) voiceSlider.value = voicePct;
      if (voiceVal) voiceVal.textContent = `${voicePct}%`;
      const currentScale = typeof document !== "undefined" && document.body.dataset.textScale || "";
      const textNormalBtn = this._backdrop.querySelector("#a11y-text-normal");
      const textGrandeBtn = this._backdrop.querySelector("#a11y-text-grande");
      const textExtraBtn = this._backdrop.querySelector("#a11y-text-extra");
      if (textNormalBtn) {
        textNormalBtn.classList.toggle("active", currentScale === "");
        textNormalBtn.setAttribute("aria-checked", String(currentScale === ""));
      }
      if (textGrandeBtn) {
        textGrandeBtn.classList.toggle("active", currentScale === "grande");
        textGrandeBtn.setAttribute("aria-checked", String(currentScale === "grande"));
      }
      if (textExtraBtn) {
        textExtraBtn.classList.toggle("active", currentScale === "extra");
        textExtraBtn.setAttribute("aria-checked", String(currentScale === "extra"));
      }
      const fontDefaultBtn = this._backdrop.querySelector("#a11y-font-default");
      const fontOpenDyslexicBtn = this._backdrop.querySelector("#a11y-font-opendyslexic");
      const fontComicSansBtn = this._backdrop.querySelector("#a11y-font-comicsans");
      if (fontDefaultBtn) {
        const active = this._settings.dyslexiaFont === DYSLEXIA_FONTS.DEFAULT;
        fontDefaultBtn.classList.toggle("active", active);
        fontDefaultBtn.setAttribute("aria-checked", String(active));
      }
      if (fontOpenDyslexicBtn) {
        const active = this._settings.dyslexiaFont === DYSLEXIA_FONTS.OPENDYSLEXIC;
        fontOpenDyslexicBtn.classList.toggle("active", active);
        fontOpenDyslexicBtn.setAttribute("aria-checked", String(active));
      }
      if (fontComicSansBtn) {
        const active = this._settings.dyslexiaFont === DYSLEXIA_FONTS.COMICSANS;
        fontComicSansBtn.classList.toggle("active", active);
        fontComicSansBtn.setAttribute("aria-checked", String(active));
      }
      const contrastBtn = this._backdrop.querySelector("#a11y-high-contrast-toggle");
      if (contrastBtn) {
        contrastBtn.classList.toggle("on", this._settings.highContrast);
        contrastBtn.setAttribute("aria-checked", String(this._settings.highContrast));
        contrastBtn.textContent = this._settings.highContrast ? "ON" : "OFF";
      }
      const phoneticBtn = this._backdrop.querySelector("#a11y-phonetic-toggle");
      if (phoneticBtn) {
        const isPhonetic = this._settings.pronunciationMode === "PHONETIC";
        phoneticBtn.classList.toggle("on", isPhonetic);
        phoneticBtn.setAttribute("aria-checked", String(isPhonetic));
        phoneticBtn.textContent = isPhonetic ? "ON" : "OFF";
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
  };

  // src/certificate/TypingCertificate.js
  var TypingCertificate = class {
    /**
     * Render official diploma onto an HTML5 Canvas element.
     * 
     * @param {HTMLCanvasElement} canvas
     * @param {Object} options
     * @param {string} [options.studentName='Campeón/a del Teclado']
     * @param {string} [options.title='Título Oficial de Mecanógrafo/a de Grado Elemental']
     * @param {string} [options.levelName='Nivel 5 - Fila Inferior y Puntuación']
     * @param {string} [options.beltRank='Cinturón Verde']
     * @param {number} [options.accuracy=95]
     * @param {number} [options.wpm=22]
     * @param {number} [options.stars=24]
     * @param {string} [options.date]
     */
    static renderToCanvas(canvas, options = {}) {
      if (!canvas) return;
      const width = 1920;
      const height = 1080;
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      const studentName = (options.studentName || "Campe\xF3n/a del Teclado").trim();
      const certTitle = (options.title || "T\xEDtulo Oficial de Mecanograf\xEDa").toUpperCase();
      const beltRank = options.beltRank || "Cintur\xF3n Verde";
      const accuracy = Math.round(Number(options.accuracy) || 95);
      const wpm = Math.round(Number(options.wpm) || 20);
      const stars = Math.round(Number(options.stars) || 15);
      const dateStr = options.date || (/* @__PURE__ */ new Date()).toLocaleDateString("es-ES", {
        day: "numeric",
        month: "long",
        year: "numeric"
      });
      const bgGrad = ctx.createRadialGradient(width / 2, height / 2, 200, width / 2, height / 2, 1100);
      bgGrad.addColorStop(0, "#fffdf7");
      bgGrad.addColorStop(0.65, "#fef5e7");
      bgGrad.addColorStop(1, "#fde8c8");
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);
      ctx.save();
      ctx.lineWidth = 14;
      ctx.strokeStyle = "#c59b27";
      ctx.strokeRect(40, 40, width - 80, height - 80);
      ctx.lineWidth = 4;
      ctx.strokeStyle = "#dfb743";
      ctx.strokeRect(58, 58, width - 116, height - 116);
      ctx.lineWidth = 2;
      ctx.strokeStyle = "#e8d28a";
      ctx.strokeRect(66, 66, width - 132, height - 132);
      const drawCorner = (x, y, flipX, flipY) => {
        ctx.save();
        ctx.translate(x, y);
        ctx.scale(flipX ? -1 : 1, flipY ? -1 : 1);
        ctx.fillStyle = "#c59b27";
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(80, 0);
        ctx.quadraticCurveTo(30, 30, 0, 80);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.arc(28, 28, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      };
      drawCorner(70, 70, false, false);
      drawCorner(width - 70, 70, true, false);
      drawCorner(70, height - 70, false, true);
      drawCorner(width - 70, height - 70, true, true);
      ctx.restore();
      ctx.save();
      ctx.textAlign = "center";
      ctx.font = '700 28px "Segoe UI", sans-serif';
      ctx.fillStyle = "#8b6914";
      if ("letterSpacing" in ctx) ctx.letterSpacing = "8px";
      ctx.fillText("\u2605 ACADEMIA OFICIAL DE MECANOGRAF\xCDA MECANO \u2605", width / 2, 140);
      if ("letterSpacing" in ctx) ctx.letterSpacing = "0px";
      if (certTitle.length > 42) {
        ctx.font = '900 44px "Segoe UI", Georgia, serif';
      } else if (certTitle.length > 28) {
        ctx.font = '900 50px "Segoe UI", Georgia, serif';
      } else {
        ctx.font = '900 62px "Segoe UI", Georgia, serif';
      }
      ctx.fillStyle = "#2d1810";
      ctx.fillText(certTitle, width / 2, 230);
      ctx.font = "italic 500 32px Georgia, serif";
      ctx.fillStyle = "#6b4f2c";
      ctx.fillText("Por el presente documento oficial se certifica con honores que:", width / 2, 310);
      const nameY = 415;
      ctx.fillStyle = "rgba(255, 235, 185, 0.5)";
      ctx.beginPath();
      if (typeof ctx.roundRect === "function") {
        ctx.roundRect(width / 2 - 550, nameY - 60, 1100, 95, 20);
      } else {
        ctx.rect(width / 2 - 550, nameY - 60, 1100, 95);
      }
      ctx.fill();
      ctx.lineWidth = 3;
      ctx.strokeStyle = "#c59b27";
      ctx.stroke();
      ctx.font = '800 56px "Segoe UI", Arial, sans-serif';
      ctx.fillStyle = "#0f172a";
      ctx.fillText(studentName, width / 2, nameY + 6);
      ctx.font = '400 27px "Segoe UI", sans-serif';
      ctx.fillStyle = "#475569";
      const desc1 = "Ha completado con \xE9xito y excelencia el programa formativo de mecanograf\xEDa al tacto,";
      const desc2 = "demostrando postura ergon\xF3mica, coordinaci\xF3n bimanual sin mirar el teclado y dominio pleno del teclado.";
      ctx.fillText(desc1, width / 2, 510);
      ctx.fillText(desc2, width / 2, 555);
      const statsY = 660;
      const statBoxWidth = 240;
      const statBoxHeight = 110;
      const statSpacing = 40;
      const totalBoxW = statBoxWidth * 4 + statSpacing * 3;
      let startX = (width - totalBoxW) / 2;
      const statsData = [
        { label: "PRECISI\xD3N", value: `${accuracy}%`, icon: "\u{1F3AF}", color: "#16a34a" },
        { label: "VELOCIDAD", value: `${wpm} PPM`, icon: "\u26A1", color: "#0284c7" },
        { label: "RANGO OFICIAL", value: beltRank, icon: "\u{1F94B}", color: "#d97706" },
        { label: "ESTRELLAS", value: `\u2B50 ${stars}`, icon: "\u2B50", color: "#eab308" }
      ];
      statsData.forEach((st, idx) => {
        const bx = startX + idx * (statBoxWidth + statSpacing);
        ctx.fillStyle = "#ffffff";
        ctx.shadowColor = "rgba(0,0,0,0.06)";
        ctx.shadowBlur = 12;
        ctx.shadowOffsetY = 4;
        ctx.beginPath();
        if (typeof ctx.roundRect === "function") {
          ctx.roundRect(bx, statsY, statBoxWidth, statBoxHeight, 16);
        } else {
          ctx.rect(bx, statsY, statBoxWidth, statBoxHeight);
        }
        ctx.fill();
        ctx.shadowColor = "transparent";
        ctx.lineWidth = 2;
        ctx.strokeStyle = "#e2e8f0";
        ctx.stroke();
        ctx.font = '700 17px "Segoe UI", sans-serif';
        ctx.fillStyle = "#64748b";
        ctx.fillText(st.label, bx + statBoxWidth / 2, statsY + 36);
        ctx.font = '800 28px "Segoe UI", sans-serif';
        ctx.fillStyle = st.color;
        ctx.fillText(st.value, bx + statBoxWidth / 2, statsY + 80);
      });
      ctx.textAlign = "left";
      ctx.font = '600 22px "Segoe UI", sans-serif';
      ctx.fillStyle = "#475569";
      ctx.fillText(`Fecha de expedici\xF3n:`, 180, 890);
      ctx.font = '700 26px "Segoe UI", sans-serif';
      ctx.fillStyle = "#1e293b";
      ctx.fillText(dateStr, 180, 930);
      const sealX = width / 2;
      const sealY = 910;
      const sealRadius = 78;
      ctx.save();
      ctx.translate(sealX, sealY);
      ctx.fillStyle = "#b48512";
      ctx.beginPath();
      const points = 32;
      for (let i = 0; i < points * 2; i++) {
        const r = i % 2 === 0 ? sealRadius : sealRadius - 7;
        const angle = i * Math.PI / points;
        ctx.lineTo(Math.cos(angle) * r, Math.sin(angle) * r);
      }
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = "#d4af37";
      ctx.beginPath();
      ctx.arc(0, 0, sealRadius - 12, 0, Math.PI * 2);
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = "#ffffff";
      ctx.beginPath();
      ctx.arc(0, 0, sealRadius - 18, 0, Math.PI * 2);
      ctx.stroke();
      ctx.textAlign = "center";
      ctx.font = '700 13px "Segoe UI", sans-serif';
      ctx.fillStyle = "#2d1810";
      ctx.fillText("SELLO OFICIAL", 0, -22);
      ctx.font = '800 24px "Segoe UI", sans-serif';
      ctx.fillText("\u{1F916} ROBY", 0, 8);
      ctx.font = '700 12px "Segoe UI", sans-serif';
      ctx.fillText("ACADEMIA MECANO", 0, 32);
      ctx.restore();
      ctx.textAlign = "right";
      ctx.font = 'italic 700 34px "Brush Script MT", cursive, Georgia';
      ctx.fillStyle = "#1e293b";
      ctx.fillText("Profesor Roby el Robot", width - 180, 905);
      ctx.lineWidth = 2;
      ctx.strokeStyle = "#94a3b8";
      ctx.beginPath();
      ctx.moveTo(width - 430, 920);
      ctx.lineTo(width - 180, 920);
      ctx.stroke();
      ctx.font = '600 20px "Segoe UI", sans-serif';
      ctx.fillStyle = "#64748b";
      ctx.fillText("Director de Pedagog\xEDa y Tutor Virtual", width - 180, 950);
      ctx.restore();
    }
    /**
     * Export the canvas content as a downloadable PNG file.
     * 
     * @param {HTMLCanvasElement} canvas
     * @param {string} [filename='Diploma_Mecanografia_Mecano.png']
     */
    static downloadPNG(canvas, filename = "Diploma_Mecanografia_Mecano.png") {
      if (!canvas) return;
      try {
        const dataUrl = canvas.toDataURL("image/png");
        const a = document.createElement("a");
        a.href = dataUrl;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      } catch (err) {
        console.error("[TypingCertificate] Error downloading certificate image:", err);
      }
    }
    /**
     * Trigger native browser print dialog specifically tailored for the certificate.
     * 
     * @param {HTMLCanvasElement} canvas
     */
    static printCertificate(canvas) {
      if (!canvas) return;
      try {
        const dataUrl = canvas.toDataURL("image/png");
        const win = window.open("", "_blank");
        if (!win) {
          window.print();
          return;
        }
        win.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>T\xEDtulo Oficial de Mecanograf\xEDa - Mecano</title>
          <style>
            @page {
              size: A4 landscape;
              margin: 0;
            }
            body {
              margin: 0;
              padding: 0;
              display: flex;
              align-items: center;
              justify-content: center;
              background: #fff;
              width: 100vw;
              height: 100vh;
            }
            img {
              max-width: 98vw;
              max-height: 96vh;
              object-fit: contain;
              box-shadow: 0 4px 15px rgba(0,0,0,0.1);
            }
          </style>
        </head>
        <body>
          <img src="${dataUrl}" onload="window.print(); setTimeout(() => window.close(), 1000);" />
        </body>
        </html>
      `);
        win.document.close();
      } catch (err) {
        console.warn("[TypingCertificate] Failed opening print window, falling back to window.print():", err);
        window.print();
      }
    }
  };

  // src/map/AdventureMap.js
  var ADVENTURE_WORLDS = [
    {
      id: 1,
      title: "Mundo 1: Valle Fila Gu\xEDa",
      subtitle: "Los Centinelas de Casa (F, J y Espacio)",
      theme: "valley",
      color: "#2ed573",
      banner: "\u{1F33F} Valle de los Centinelas (F y J)",
      bgImage: "assets/maps/world_1_bg.jpg",
      scenery: {
        hillColor1: "#1b4d3e",
        hillColor2: "#13392f",
        skyGradient: "linear-gradient(180deg, #0d2836 0%, #061826 100%)",
        accent: "#2ed573",
        emoji: "\u{1F3AF}"
      }
    },
    {
      id: 2,
      title: "Mundo 2: Isla Fila Superior",
      subtitle: "La Fila Gu\xEDa Completa (A S D F / J K L \xD1)",
      theme: "sky",
      color: "#00cec9",
      banner: "\u{1F3F0} Reino de la Fila Gu\xEDa Completa",
      scenery: {
        hillColor1: "#0f3c53",
        hillColor2: "#0b293a",
        skyGradient: "linear-gradient(180deg, #091a2e 0%, #05101f 100%)",
        accent: "#00cec9",
        emoji: "\u2601\uFE0F"
      }
    },
    {
      id: 3,
      title: "Mundo 3: Selva Fila Inferior",
      subtitle: "Vocales E/I y Primeras Palabras",
      theme: "jungle",
      color: "#e17055",
      banner: "\u{1F334} Selva Tropical de las Vocales",
      scenery: {
        hillColor1: "#472218",
        hillColor2: "#2c150e",
        skyGradient: "linear-gradient(180deg, #1c111e 0%, #090a18 100%)",
        accent: "#e17055",
        emoji: "\u{1F334}"
      }
    },
    {
      id: 4,
      title: "Mundo 4: Reino de las Vocales",
      subtitle: "Expansi\xF3n O/U y Consonantes (C, M, P, T)",
      theme: "crystals",
      color: "#a29bfe",
      banner: "\u2728 Cavernas de Cristal y Vocales",
      scenery: {
        hillColor1: "#372b64",
        hillColor2: "#221944",
        skyGradient: "linear-gradient(180deg, #16102b 0%, #080718 100%)",
        accent: "#a29bfe",
        emoji: "\u2728"
      }
    },
    {
      id: 5,
      title: "Mundo 5: Monta\xF1a de Frases",
      subtitle: "Frases y Espaciador (Graduaci\xF3n Primaria \u{1F393})",
      theme: "mountain",
      color: "#fdcb6e",
      banner: "\u{1F3D4}\uFE0F Cumbre de la Gran Monta\xF1a (Diploma \u{1F393})",
      scenery: {
        hillColor1: "#4a3b1a",
        hillColor2: "#2c220c",
        skyGradient: "linear-gradient(180deg, #1c1912 0%, #0a0b14 100%)",
        accent: "#fdcb6e",
        emoji: "\u{1F3D4}\uFE0F"
      }
    },
    {
      id: 6,
      title: "Mundo 6: Cueva de los Cuentos",
      subtitle: "Historias y Aventuras sin Mirar el Teclado",
      theme: "storybook",
      color: "#ff7675",
      banner: "\u{1F4D6} Fortaleza de los Cuentos \xC9picos",
      scenery: {
        hillColor1: "#4d1e2a",
        hillColor2: "#2e0f17",
        skyGradient: "linear-gradient(180deg, #220f1a 0%, #0b0716 100%)",
        accent: "#ff7675",
        emoji: "\u{1F3F0}"
      }
    },
    {
      id: 7,
      title: "Mundo 7: Club de Trabalenguas",
      subtitle: "Velocidad, Agilidad y Retos Extremos",
      theme: "circus",
      color: "#fd79a8",
      banner: "\u{1F3AA} Carnaval de Alta Velocidad y Humor",
      scenery: {
        hillColor1: "#4c183f",
        hillColor2: "#2c0c24",
        skyGradient: "linear-gradient(180deg, #220b24 0%, #080616 100%)",
        accent: "#fd79a8",
        emoji: "\u26A1"
      }
    },
    {
      id: 8,
      title: "Mundo 8: Desaf\xEDo Gal\xE1ctico",
      subtitle: "El Drag\xF3n Robot y el T\xEDtulo Maestro \u{1F409}",
      theme: "galaxy",
      color: "#ffd32a",
      banner: "\u{1F30C} Cosmos del Drag\xF3n Robot (Maestro Supremo)",
      scenery: {
        hillColor1: "#36225a",
        hillColor2: "#1a0f33",
        skyGradient: "linear-gradient(180deg, #130f28 0%, #040310 100%)",
        accent: "#ffd32a",
        emoji: "\u{1F409}"
      }
    }
  ];
  var MAP_NODE_COORDINATES = [
    // Fila 1: Lecciones 1 a 6 (Izquierda a Derecha)
    { x: 90, y: 90 },
    { x: 230, y: 75 },
    { x: 380, y: 100 },
    { x: 530, y: 80 },
    { x: 680, y: 100 },
    { x: 820, y: 85 },
    // Curva de descenso este: Lección 7
    { x: 960, y: 165 },
    // Fila 2: Lecciones 8 a 12 (Derecha a Izquierda)
    { x: 880, y: 260 },
    { x: 730, y: 245 },
    { x: 580, y: 270 },
    { x: 430, y: 245 },
    { x: 280, y: 265 },
    // Curva de descenso oeste: Lección 13
    { x: 130, y: 340 },
    // Fila 3: Lecciones 14, 15 y Castillo Examen 16 (Izquierda a Derecha)
    { x: 200, y: 440 },
    { x: 440, y: 445 },
    { x: 790, y: 430 }
    // Nodo Castillo
  ];
  var AdventureMap = class {
    /**
     * @param {Object} options
     * @param {Object} options.pedagogy PedagogyEngine instance
     * @param {Object} options.storage StorageManager instance
     * @param {Object} [options.audio] ProceduralAudio instance
     * @param {Function} [options.onSelectLesson] Callback (worldId, lessonId) => void
     * @param {Function} [options.onSelectExam] Callback (worldId) => void
     * @param {string} [options.modalId='adventure-map-modal'] Modal element ID
     */
    constructor(options = {}) {
      this.pedagogy = options.pedagogy;
      this.storage = options.storage;
      this.audio = options.audio || null;
      this.onSelectLesson = options.onSelectLesson || (() => {
      });
      this.onSelectExam = options.onSelectExam || (() => {
      });
      this.modalId = options.modalId || "adventure-map-modal";
      this.activeWorldId = 1;
      this.selectedNodeId = null;
      this.isOpen = false;
      this.nodes = [];
      this._modalEl = null;
      this._initialized = false;
    }
    /**
     * Initializes DOM elements and event listeners.
     */
    init() {
      if (this._initialized) return;
      this._modalEl = document.getElementById(this.modalId);
      if (!this._modalEl) {
        this._createModalMarkup();
      }
      this._bindModalEvents();
      this._initialized = true;
    }
    /**
     * Creates the base HTML structure of the Super Mario World Adventure Map.
     * @private
     */
    _createModalMarkup() {
      const modal = document.createElement("div");
      modal.id = this.modalId;
      modal.className = "adventure-map-modal hidden";
      modal.setAttribute("role", "dialog");
      modal.setAttribute("aria-modal", "true");
      modal.setAttribute("aria-label", "Mapa de Aventuras de Mecanograf\xEDa");
      modal.innerHTML = `
      <div class="adventure-map-backdrop" id="adventure-map-backdrop"></div>
      <div class="adventure-map-dialog" id="adventure-map-dialog">
        <!-- Cabecera Superior del Mapa Overworld -->
        <header class="map-dialog-header">
          <div class="map-header-left">
            <span class="map-header-badge">\u{1F5FA}\uFE0F MODO AVENTURA</span>
            <h2 class="map-header-title" id="map-header-title">Mapa de Mundos Mecano</h2>
          </div>
          <div class="map-header-meta">
            <div class="map-stars-pill" id="map-stars-pill" title="Total de estrellas doradas acumuladas">
              \u2B50 <span id="map-total-stars">0</span> Estrellas
            </div>
            <div class="map-belt-pill" id="map-belt-pill" title="Cintur\xF3n actual de mecanograf\xEDa">
              \u{1F94B} Cintur\xF3n Blanco
            </div>
            <button class="map-close-btn" id="map-close-btn" title="Cerrar mapa (Esc)" aria-label="Cerrar mapa">\u2716</button>
          </div>
        </header>

        <!-- Selector de Islas / Mundos Tem\xE1ticos (Mario World Tabs) -->
        <nav class="map-worlds-nav" id="map-worlds-nav" aria-label="Seleccionar Mundo o Isla Tem\xE1tica">
          <!-- Chips de mundos generados din\xE1micamente -->
        </nav>

        <!-- Tablero del Mundo con Sendero SVG y Nodos de Niveles -->
        <main class="adventure-map-board" id="adventure-map-board">
          <div class="map-board-background" id="map-board-background"></div>
          <svg class="map-trail-svg" id="map-trail-svg" viewBox="0 0 1100 540" preserveAspectRatio="xMidYMid meet">
            <defs>
              <!-- Filtros de sombra y resplandor -->
              <filter id="mario-node-shadow" x="-40%" y="-40%" width="180%" height="180%">
                <feDropShadow dx="0" dy="6" stdDeviation="5" flood-color="#050711" flood-opacity="0.75" />
              </filter>
              <filter id="mario-castle-shadow" x="-40%" y="-40%" width="180%" height="180%">
                <feDropShadow dx="0" dy="10" stdDeviation="8" flood-color="#050711" flood-opacity="0.85" />
              </filter>
              <filter id="mario-trail-glow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="4" result="blur" />
                <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
              </filter>
              <filter id="sparkle-glow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
              </filter>
              <filter id="portal-cyan-glow" x="-40%" y="-40%" width="180%" height="180%">
                <feGaussianBlur stdDeviation="5" result="blur" />
                <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
              </filter>
              <filter id="gold-coin-glow" x="-30%" y="-30%" width="160%" height="160%">
                <feDropShadow dx="0" dy="3" stdDeviation="4" flood-color="#f59e0b" flood-opacity="0.5" />
              </filter>

              <!-- Gradientes Met\xE1licos para Monedas de Oro 3D -->
              <linearGradient id="gold-coin-rim" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stop-color="#fef08a" />
                <stop offset="40%" stop-color="#eab308" />
                <stop offset="85%" stop-color="#854d0e" />
                <stop offset="100%" stop-color="#ca8a04" />
              </linearGradient>
              <linearGradient id="gold-coin-face" x1="20%" y1="0%" x2="80%" y2="100%">
                <stop offset="0%" stop-color="#fffbeb" />
                <stop offset="25%" stop-color="#fde047" />
                <stop offset="70%" stop-color="#f59e0b" />
                <stop offset="100%" stop-color="#b45309" />
              </linearGradient>
              <linearGradient id="gold-bevel-light" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stop-color="rgba(255, 255, 255, 0.75)" />
                <stop offset="45%" stop-color="rgba(255, 255, 255, 0)" />
                <stop offset="100%" stop-color="rgba(0, 0, 0, 0.45)" />
              </linearGradient>

              <!-- Gradientes para Ficha de Piedra Bloqueada 3D -->
              <linearGradient id="stone-slab-grad" x1="20%" y1="0%" x2="80%" y2="100%">
                <stop offset="0%" stop-color="#64748b" />
                <stop offset="45%" stop-color="#334155" />
                <stop offset="100%" stop-color="#1e293b" />
              </linearGradient>
              <radialGradient id="stone-inner-grad" cx="50%" cy="40%" r="60%">
                <stop offset="0%" stop-color="#1e293b" />
                <stop offset="100%" stop-color="#0f172a" />
              </radialGradient>
              <linearGradient id="lock-body-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stop-color="#fef08a" />
                <stop offset="50%" stop-color="#f59e0b" />
                <stop offset="100%" stop-color="#92400e" />
              </linearGradient>
              <linearGradient id="lock-shackle-grad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stop-color="#fef3c7" />
                <stop offset="50%" stop-color="#b45309" />
                <stop offset="100%" stop-color="#fde68a" />
              </linearGradient>

              <!-- Gradientes para Plataforma Portal Cian (Nivel Actual) -->
              <linearGradient id="portal-outer-ring" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stop-color="#a5f3fc" />
                <stop offset="50%" stop-color="#06b6d4" />
                <stop offset="100%" stop-color="#0284c7" />
              </linearGradient>
              <radialGradient id="portal-core-glow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stop-color="rgba(103, 232, 249, 0.95)" />
                <stop offset="55%" stop-color="rgba(6, 182, 212, 0.45)" />
                <stop offset="100%" stop-color="rgba(15, 23, 42, 0)" />
              </radialGradient>

              <!-- Gradientes para Castillo Medieval 3D -->
              <linearGradient id="castle-wall-light" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stop-color="#94a3b8" />
                <stop offset="50%" stop-color="#64748b" />
                <stop offset="100%" stop-color="#475569" />
              </linearGradient>
              <linearGradient id="castle-roof-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stop-color="#a5b4fc" />
                <stop offset="50%" stop-color="#6366f1" />
                <stop offset="100%" stop-color="#312e81" />
              </linearGradient>
              <radialGradient id="castle-portal-fire" cx="50%" cy="85%" r="75%">
                <stop offset="0%" stop-color="#fef08a" />
                <stop offset="35%" stop-color="#f59e0b" />
                <stop offset="70%" stop-color="#ec4899" />
                <stop offset="100%" stop-color="#0f172a" />
              </radialGradient>
              <linearGradient id="flag-wave-grad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stop-color="#fde047" />
                <stop offset="50%" stop-color="#f59e0b" />
                <stop offset="100%" stop-color="#d97706" />
              </linearGradient>
            </defs>
            <g id="svg-scenery-layer" class="svg-scenery-layer"></g>
            <g id="svg-clouds-back-layer" class="svg-clouds-back-layer"></g>
            <g id="svg-trail-layer" class="svg-trail-layer"></g>
            <g id="svg-fireflies-layer" class="svg-fireflies-layer"></g>
            <g id="svg-nodes-layer" class="svg-nodes-layer"></g>
            <g id="svg-clouds-front-layer" class="svg-clouds-front-layer"></g>
          </svg>
        </main>

        <!-- Tarjeta de Informaci\xF3n y Lanzador de Nivel (Course Card) -->
        <footer class="map-course-card" id="map-course-card">
          <div class="course-card-left">
            <div class="course-badge" id="course-badge">1.1</div>
            <div class="course-info">
              <h3 class="course-title" id="course-title">El hogar del \xEDndice izquierdo (F)</h3>
              <p class="course-desc" id="course-desc">Coloca tus dedos \xEDndices en la F y la J.</p>
            </div>
          </div>
          <div class="course-card-center">
            <div class="course-keys-row" id="course-keys-row">
              <span class="course-key-chip">F</span>
              <span class="course-key-chip">J</span>
            </div>
            <div class="course-stars-rating" id="course-stars-rating">
              <span class="star-on">\u2B50</span><span class="star-on">\u2B50</span><span class="star-on">\u2B50</span>
            </div>
          </div>
          <div class="course-card-right">
            <button class="pulse-button course-launch-btn" id="course-launch-btn">\xA1Entrar al Nivel! \u{1F680}</button>
          </div>
        </footer>
      </div>
    `;
      document.body.appendChild(modal);
      this._modalEl = modal;
    }
    /**
     * Binds UI click, touch, and keyboard events.
     * @private
     */
    _bindModalEvents() {
      if (!this._modalEl) return;
      const closeBtn = this._modalEl.querySelector("#map-close-btn");
      const backdrop = this._modalEl.querySelector("#adventure-map-backdrop");
      if (closeBtn) closeBtn.addEventListener("click", () => this.close());
      if (backdrop) backdrop.addEventListener("click", () => this.close());
      const launchBtn = this._modalEl.querySelector("#course-launch-btn");
      if (launchBtn) {
        launchBtn.addEventListener("click", () => {
          this._launchCurrentSelection();
        });
      }
      window.addEventListener("keydown", (e) => {
        if (!this.isOpen) return;
        if (e.key === "Escape") {
          e.preventDefault();
          this.close();
        } else if (e.key === "Enter") {
          e.preventDefault();
          this._launchCurrentSelection();
        } else if (e.key === "ArrowRight" || e.key === "ArrowDown") {
          e.preventDefault();
          this._stepNodeSelection(1);
        } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
          e.preventDefault();
          this._stepNodeSelection(-1);
        }
      });
    }
    /**
     * Opens the interactive adventure map.
     * @param {Object} [options]
     * @param {number} [options.worldId] Default world to display (defaults to current or 1)
     */
    open(options = {}) {
      this.init();
      if (!this._modalEl) return;
      if (this.audio) this.audio.playButtonClick();
      const highestUnlocked = this._getHighestUnlockedLevel();
      const requestedWorld = Number(options.worldId) || this.activeWorldId || 1;
      this.activeWorldId = Math.min(requestedWorld, highestUnlocked);
      this.isOpen = true;
      this._modalEl.classList.remove("hidden");
      this._modalEl.classList.add("map-entering");
      setTimeout(() => this._modalEl.classList.remove("map-entering"), 350);
      this.render();
    }
    /**
     * Closes the interactive adventure map with a smooth zoom transition.
     */
    close() {
      if (!this.isOpen || !this._modalEl) return;
      if (this.audio) this.audio.playButtonClick();
      this._modalEl.classList.add("map-leaving");
      setTimeout(() => {
        this._modalEl.classList.add("hidden");
        this._modalEl.classList.remove("map-leaving");
        this.isOpen = false;
      }, 250);
    }
    /**
     * Toggles the map open/closed.
     */
    toggle() {
      if (this.isOpen) {
        this.close();
      } else {
        this.open();
      }
    }
    /**
     * Changes the active world tab.
     * @param {number} worldId 1 to 8
     */
    setWorld(worldId) {
      const id = Math.max(1, Math.min(8, Number(worldId) || 1));
      const highestUnlocked = this._getHighestUnlockedLevel();
      if (id > highestUnlocked) {
        if (this.audio) this.audio.playLockedShake();
        this._flashLockedNotice(`\xA1Supera el Castillo Examen del Mundo ${id - 1} para navegar a esta Isla! \u{1F512}`);
        return;
      }
      if (this.audio) this.audio.playMapNodeSelect();
      this.activeWorldId = id;
      this.selectedNodeId = null;
      this.render();
    }
    /**
     * Re-renders the complete map dialog (Header, World Tabs, Overworld Trail & Course Card).
     */
    render() {
      if (!this._modalEl) return;
      this._renderHeaderMeta();
      this._renderWorldTabs();
      this._renderMapBoard();
    }
    /**
     * Updates global star totals and belt ranks in header.
     * @private
     */
    _renderHeaderMeta() {
      const totalStars = this.storage ? this.storage.getTotalStars() : 0;
      const starsEl = this._modalEl.querySelector("#map-total-stars");
      if (starsEl) starsEl.textContent = String(totalStars);
      const beltEl = this._modalEl.querySelector("#map-belt-pill");
      if (beltEl && this.pedagogy && this.storage) {
        const beltKey = this.storage.getBelt();
        const highestUnlocked = this._getHighestUnlockedLevel();
        const currentBelt = this.pedagogy.calculateBelt(highestUnlocked, totalStars);
        const tierObj = this.pedagogy.getBeltTier ? this.pedagogy.getBeltTier(currentBelt) : null;
        beltEl.textContent = tierObj ? `${tierObj.emoji} ${tierObj.title}` : `\u{1F94B} Cintur\xF3n ${currentBelt.toUpperCase()}`;
      }
    }
    /**
     * Renders the 8 World Tabs along the top.
     * @private
     */
    _renderWorldTabs() {
      const nav = this._modalEl.querySelector("#map-worlds-nav");
      if (!nav) return;
      nav.innerHTML = "";
      const highestUnlocked = this._getHighestUnlockedLevel();
      ADVENTURE_WORLDS.forEach((world) => {
        const isUnlocked = world.id <= highestUnlocked;
        const isActive = world.id === this.activeWorldId;
        const tab = document.createElement("button");
        tab.className = `map-world-tab ${isActive ? "is-active" : ""} ${!isUnlocked ? "is-locked" : "is-unlocked"}`;
        tab.style.setProperty("--world-theme-color", world.color);
        tab.setAttribute("role", "tab");
        tab.setAttribute("aria-selected", isActive ? "true" : "false");
        tab.title = isUnlocked ? world.title : `${world.title} (Bloqueado)`;
        const completedLessons = this.storage ? this.storage.getCompletedLessons(world.id).length : 0;
        const examPassed = this.storage ? this.storage.isExamPassed(world.id) : false;
        tab.innerHTML = `
        <span class="world-tab-icon">${isUnlocked ? world.scenery.emoji : "\u{1F512}"}</span>
        <div class="world-tab-texts">
          <span class="world-tab-name">${world.title.split(":")[1] || world.title}</span>
          <span class="world-tab-prog">${isUnlocked ? examPassed ? "\u{1F451} Superado" : `${completedLessons}/15` : "Bloqueado"}</span>
        </div>
      `;
        tab.addEventListener("click", () => {
          this.setWorld(world.id);
        });
        nav.appendChild(tab);
      });
    }
    /**
     * Renders the SVG Trail, Nodes, Scenery, and updates Course Card.
     * @private
     */
    _renderMapBoard() {
      const world = ADVENTURE_WORLDS.find((w) => w.id === this.activeWorldId) || ADVENTURE_WORLDS[0];
      const boardBg = this._modalEl.querySelector("#map-board-background");
      if (boardBg) {
        if (world.bgImage) {
          boardBg.style.background = `linear-gradient(rgba(10, 15, 30, 0.4), rgba(10, 15, 30, 0.7)), url('${world.bgImage}') center/cover no-repeat`;
        } else {
          boardBg.style.background = world.scenery.skyGradient;
        }
      }
      const titleEl = this._modalEl.querySelector("#map-header-title");
      if (titleEl) {
        titleEl.textContent = world.banner;
      }
      this._buildNodesForWorld(world.id);
      this._drawScenery(world);
      this._drawAtmosphere(world);
      this._drawTrail();
      this._drawFireflies();
      this._drawNodes();
      if (!this.selectedNodeId) {
        const activeNode = this.nodes.find((n) => n.isActive) || this.nodes.find((n) => n.isUnlocked) || this.nodes[0];
        this.selectedNodeId = activeNode ? activeNode.id : null;
      }
      this._updateCourseCard();
    }
    /**
     * Builds the 16 nodes definition for the current world.
     * @private
     */
    _buildNodesForWorld(worldId) {
      const lessons = this.pedagogy ? this.pedagogy.getLessonsForLevel(worldId) : [];
      const examDef = this.pedagogy ? this.pedagogy.getExamForLevel(worldId) : null;
      const highestUnlocked = this._getHighestUnlockedLevel();
      const isWorldUnlocked = worldId <= highestUnlocked;
      const completedLessons = this.storage ? this.storage.getCompletedLessons(worldId) : [];
      const isExamPassed = this.storage ? this.storage.isExamPassed(worldId) : false;
      this.nodes = [];
      for (let i = 0; i < 15; i++) {
        const lesson = lessons[i] || {
          id: `${worldId}.${i + 1}`,
          title: `Lecci\xF3n ${worldId}.${i + 1}`,
          words: [{ text: "f j", label: "Inicio" }]
        };
        const coord = MAP_NODE_COORDINATES[i] || { x: 100 + i * 50, y: 100 };
        const isCompleted = completedLessons.includes(lesson.id);
        let isUnlocked = false;
        if (isWorldUnlocked) {
          if (i === 0) {
            isUnlocked = true;
          } else {
            const prevLesson = lessons[i - 1];
            const prevCompleted = prevLesson && completedLessons.includes(prevLesson.id);
            isUnlocked = prevCompleted || isCompleted;
          }
        }
        const stars = this.storage ? this.storage.getLessonStars(worldId, lesson.id) : isCompleted ? 3 : 0;
        this.nodes.push({
          id: lesson.id,
          index: i,
          type: "lesson",
          worldId,
          number: lesson.id,
          title: lesson.title,
          tip: lesson.tip || (lesson.words && lesson.words[0] ? lesson.words[0].label : ""),
          words: lesson.words || [],
          x: coord.x,
          y: coord.y,
          isCompleted,
          isUnlocked,
          isActive: false,
          // Calculated next
          stars
        });
      }
      const castleCoord = MAP_NODE_COORDINATES[15] || { x: 790, y: 430 };
      const canTakeExam = isWorldUnlocked && (completedLessons.length >= 15 || isExamPassed);
      this.nodes.push({
        id: `${worldId}-exam`,
        index: 15,
        type: "castle",
        worldId,
        number: `Castillo ${worldId}`,
        title: examDef ? examDef.title : `Examen de Maestr\xEDa del Mundo ${worldId}`,
        tip: examDef ? examDef.description : "\xA1Demuestra tu dominio para desbloquear el siguiente mundo!",
        words: examDef ? examDef.words : [],
        x: castleCoord.x,
        y: castleCoord.y,
        isCompleted: isExamPassed,
        isUnlocked: canTakeExam,
        isActive: false,
        stars: isExamPassed ? 3 : 0
      });
      let foundActive = false;
      for (const node of this.nodes) {
        if (node.isUnlocked && !node.isCompleted) {
          node.isActive = true;
          foundActive = true;
          break;
        }
      }
      if (!foundActive && this.nodes.length > 0) {
        this.nodes[this.nodes.length - 1].isActive = true;
      }
    }
    /**
     * Draws decorative Mario World scenery elements (clouds, hills, question blocks).
     * @private
     */
    _drawScenery(world) {
      const layer = this._modalEl.querySelector("#svg-scenery-layer");
      if (!layer) return;
      layer.innerHTML = `
      <!-- Colinas onduladas de fondo -->
      <path d="M -20,400 Q 220,290 480,360 T 1120,320 L 1120,560 L -20,560 Z" fill="${world.scenery.hillColor1}" opacity="0.6" />
      <path d="M -20,440 Q 300,350 640,410 T 1120,380 L 1120,560 L -20,560 Z" fill="${world.scenery.hillColor2}" opacity="0.8" />

      <!-- Nubes sonrientes estilo Super Mario -->
      <g class="mario-cloud" transform="translate(140, 40)" opacity="0.45">
        <ellipse cx="60" cy="30" rx="36" ry="18" fill="#ffffff" />
        <ellipse cx="40" cy="32" rx="22" ry="14" fill="#ffffff" />
        <ellipse cx="80" cy="32" rx="22" ry="14" fill="#ffffff" />
        <circle cx="52" cy="30" r="2.2" fill="#1e293b" />
        <circle cx="68" cy="30" r="2.2" fill="#1e293b" />
      </g>
      <g class="mario-cloud" transform="translate(680, 30)" opacity="0.35">
        <ellipse cx="60" cy="30" rx="42" ry="20" fill="#ffffff" />
        <ellipse cx="38" cy="32" rx="26" ry="16" fill="#ffffff" />
        <ellipse cx="82" cy="32" rx="26" ry="16" fill="#ffffff" />
        <circle cx="52" cy="30" r="2.2" fill="#1e293b" />
        <circle cx="68" cy="30" r="2.2" fill="#1e293b" />
      </g>

      <!-- Bloques misteriosos flotantes [?] -->
      <g class="mario-block" transform="translate(470, 40)">
        <rect x="0" y="0" width="28" height="28" rx="6" fill="#f59e0b" stroke="#ffd32a" stroke-width="2" />
        <text x="14" y="20" font-family="'Nunito', sans-serif" font-weight="900" font-size="16" fill="#ffffff" text-anchor="middle">?</text>
      </g>
      <g class="mario-block" transform="translate(860, 200)">
        <rect x="0" y="0" width="28" height="28" rx="6" fill="#f59e0b" stroke="#ffd32a" stroke-width="2" />
        <text x="14" y="20" font-family="'Nunito', sans-serif" font-weight="900" font-size="16" fill="#ffffff" text-anchor="middle">?</text>
      </g>
    `;
    }
    /**
     * Draws multi-layer drifting clouds for Parallax depth.
     * @private
     */
    _drawAtmosphere(world) {
      const backCloudsLayer = this._modalEl.querySelector("#svg-clouds-back-layer");
      const frontCloudsLayer = this._modalEl.querySelector("#svg-clouds-front-layer");
      if (backCloudsLayer) {
        backCloudsLayer.innerHTML = `
        <!-- Capa de nubes de fondo m\xE1s lentas y et\xE9reas -->
        <g class="drifting-clouds-back">
          <g class="fluffy-cloud c1" transform="translate(180, 50)" opacity="0.45">
            <ellipse cx="60" cy="30" rx="46" ry="22" fill="#ffffff" />
            <ellipse cx="36" cy="32" rx="28" ry="17" fill="#ffffff" />
            <ellipse cx="84" cy="32" rx="28" ry="17" fill="#ffffff" />
          </g>
          <g class="fluffy-cloud c2" transform="translate(620, 35)" opacity="0.4">
            <ellipse cx="70" cy="30" rx="52" ry="24" fill="#ffffff" />
            <ellipse cx="42" cy="32" rx="32" ry="18" fill="#ffffff" />
            <ellipse cx="98" cy="32" rx="32" ry="18" fill="#ffffff" />
          </g>
          <g class="fluffy-cloud c3" transform="translate(950, 65)" opacity="0.35">
            <ellipse cx="50" cy="25" rx="38" ry="18" fill="#ffffff" />
            <ellipse cx="30" cy="26" rx="22" ry="14" fill="#ffffff" />
            <ellipse cx="70" cy="26" rx="22" ry="14" fill="#ffffff" />
          </g>
        </g>
      `;
      }
      if (frontCloudsLayer) {
        frontCloudsLayer.innerHTML = `
        <!-- Capa de nubes frontales transl\xFAcidas con desplazamiento suave -->
        <g class="drifting-clouds-front">
          <g class="wispy-cloud w1" transform="translate(80, 190)" opacity="0.22">
            <ellipse cx="90" cy="20" rx="80" ry="18" fill="#ffffff" filter="blur(3px)" />
            <ellipse cx="50" cy="22" rx="45" ry="14" fill="#ffffff" filter="blur(3px)" />
            <ellipse cx="130" cy="22" rx="45" ry="14" fill="#ffffff" filter="blur(3px)" />
          </g>
          <g class="wispy-cloud w2" transform="translate(720, 360)" opacity="0.25">
            <ellipse cx="110" cy="24" rx="95" ry="20" fill="#ffffff" filter="blur(4px)" />
            <ellipse cx="65" cy="26" rx="55" ry="16" fill="#ffffff" filter="blur(4px)" />
            <ellipse cx="155" cy="26" rx="55" ry="16" fill="#ffffff" filter="blur(4px)" />
          </g>
        </g>
      `;
      }
    }
    /**
     * Generates and draws the golden Mario Overworld path through all 16 nodes.
     * @private
     */
    _drawTrail() {
      const layer = this._modalEl.querySelector("#svg-trail-layer");
      if (!layer || !this.nodes.length) return;
      const splineD = this._generateSplinePath(this.nodes);
      layer.innerHTML = `
      <!-- Sombra profunda del sendero -->
      <path class="map-trail-shadow" d="${splineD}" fill="none" stroke="rgba(0, 0, 0, 0.55)" stroke-width="16" stroke-linecap="round" stroke-linejoin="round" />
      <!-- Calzada dorada de piedra con brillo -->
      <path class="map-trail-line map-trail-road" d="${splineD}" fill="none" stroke="#eab308" stroke-width="9" stroke-linecap="round" stroke-linejoin="round" filter="url(#mario-trail-glow)" />
      <!-- L\xEDnea discontinua blanca estilo Super Mario World -->
      <path class="map-trail-dashes" d="${splineD}" fill="none" stroke="#ffffff" stroke-width="3" stroke-linecap="round" stroke-dasharray="6 12" opacity="0.9" />
    `;
    }
    /**
     * Draws glowing animated magical fireflies / sparkles along the golden trail.
     * @private
     */
    _drawFireflies() {
      const layer = this._modalEl.querySelector("#svg-fireflies-layer");
      if (!layer || this.nodes.length < 2) return;
      let firefliesHTML = "";
      for (let i = 0; i < this.nodes.length - 1; i++) {
        const p1 = this.nodes[i];
        const p2 = this.nodes[i + 1];
        const midX = Math.round((p1.x + p2.x) / 2 + (i % 2 === 0 ? 12 : -12));
        const midY = Math.round((p1.y + p2.y) / 2 + (i % 3 === 0 ? -16 : 14));
        const isGold = i % 2 === 0;
        const color = isGold ? "#ffd32a" : "#67e8f9";
        const delay = (i * 0.35).toFixed(2);
        firefliesHTML += `
        <g class="trail-sparkle-group" transform="translate(${midX}, ${midY})">
          <circle cx="0" cy="0" r="3" fill="${color}" filter="url(#sparkle-glow)" class="sparkle-dot sparkle-anim-${i % 4 + 1}" style="animation-delay: ${delay}s;" />
          <polygon points="0,-4 1,-1 4,0 1,1 0,4 -1,1 -4,0 -1,-1" fill="#ffffff" opacity="0.8" class="sparkle-star" style="animation-delay: ${delay}s;" />
        </g>
      `;
      }
      layer.innerHTML = firefliesHTML;
    }
    /**
     * Draws the 16 interactive nodes on the map.
     * @private
     */
    _drawNodes() {
      const layer = this._modalEl.querySelector("#svg-nodes-layer");
      if (!layer || !this.nodes.length) return;
      layer.innerHTML = "";
      this.nodes.forEach((node) => {
        const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
        const isSelected = node.id === this.selectedNodeId;
        const classes = [
          "map-node",
          "map-node-group",
          `node-${node.type}`,
          node.type === "castle" ? "mario-castle-3d" : "",
          node.isUnlocked ? "is-unlocked" : "is-locked",
          node.isCompleted ? "is-completed" : "",
          node.isActive ? "is-active" : "",
          isSelected ? "is-selected" : ""
        ].filter(Boolean).join(" ");
        g.setAttribute("class", classes);
        g.setAttribute("data-node-id", node.id);
        g.setAttribute("transform", `translate(${node.x}, ${node.y})`);
        g.setAttribute("role", "button");
        g.setAttribute("tabindex", node.isUnlocked ? "0" : "-1");
        g.setAttribute("aria-label", `${node.number}: ${node.title}`);
        const hitboxRadius = node.type === "castle" ? 52 : 36;
        const hitboxMarkup = `<circle cx="0" cy="0" r="${hitboxRadius}" fill="transparent" class="map-node-hitbox" />`;
        const innerContent = node.type === "castle" ? this._getCastleNodeMarkup(node) : this._getLessonNodeMarkup(node);
        g.innerHTML = `
        ${hitboxMarkup}
        <g class="map-node-body">
          ${innerContent}
        </g>
      `;
        g.addEventListener("click", (e) => {
          e.stopPropagation();
          this._handleNodeClick(node);
        });
        layer.appendChild(g);
      });
    }
    /**
     * Markup for a 3D physical level token (Gold Coin, Launchpad Platform, or Ancient Stone Tablet).
     * @private
     */
    _getLessonNodeMarkup(node) {
      const isCompleted = node.isCompleted;
      const isUnlocked = node.isUnlocked;
      const isActive = node.isActive;
      const labelText = node.number.split(".")[1] || node.number;
      const robyMarker = isActive ? `
      <g class="mario-roby-wrapper mario-roby-marker" transform="translate(0, -32)">
        <image href="assets/mascot/mascot_idle.png" x="-26" y="-36" width="52" height="52" class="mario-roby-sprite" />
        <ellipse cx="0" cy="18" rx="14" ry="4" fill="rgba(0,0,0,0.5)" />
      </g>
    ` : "";
      if (isCompleted) {
        const starCount = Math.max(1, node.stars || 3);
        const starGlyphs = "\u2B50".repeat(starCount);
        return `
        <g class="coin-token-3d">
          <!-- Sombra de contacto 3D -->
          <ellipse cx="0" cy="24" rx="22" ry="7" fill="rgba(0,0,0,0.55)" filter="blur(3px)" />

          <!-- Borde estriado exterior de la moneda -->
          <circle cx="0" cy="0" r="23" fill="url(#gold-coin-rim)" filter="url(#mario-node-shadow)" />
          <!-- Bisel de profundidad 3D -->
          <circle cx="0" cy="1" r="21" fill="url(#gold-coin-face)" />
          <!-- Anillo acanalado interior -->
          <circle cx="0" cy="1" r="17.5" fill="none" stroke="#b45309" stroke-width="1.2" stroke-dasharray="2.5 1.5" opacity="0.65" />
          <circle cx="0" cy="1" r="16" fill="url(#gold-coin-face)" />

          <!-- Brillo especular superior -->
          <path d="M -15,-6 A 17 17 0 0 1 15,-6 A 15 13 0 0 0 -15,-6 Z" fill="rgba(255,255,255,0.45)" />

          <!-- N\xFAmero de nivel en relieve 3D con doble sombra -->
          <text cx="0" y="7" font-family="'Fredoka', 'Nunito', sans-serif" font-weight="900" font-size="14.5" fill="#78350f" text-anchor="middle" dy="1">${labelText}</text>
          <text cx="0" y="6" font-family="'Fredoka', 'Nunito', sans-serif" font-weight="900" font-size="14.5" fill="#ffffff" text-anchor="middle" filter="drop-shadow(0 1px 1px rgba(0,0,0,0.5))">${labelText}</text>

          <!-- Destello de estrella en esquina -->
          <polygon points="12,-12 14,-15 17,-12 14,-9" fill="#ffffff" opacity="0.9" filter="drop-shadow(0 0 2px #fff)" />

          <!-- Estrellas doradas 3D obtenidas -->
          <g class="node-stars" transform="translate(0, 33)">
            <text x="0" y="0" font-size="12" text-anchor="middle" fill="#ffd32a" filter="drop-shadow(0 1px 2px rgba(0,0,0,0.8))">
              ${starGlyphs}
            </text>
          </g>
        </g>
      `;
      }
      if (isActive) {
        return `
        <g class="launchpad-platform-3d">
          <!-- Halo de ondas de energ\xEDa conc\xE9ntricas en expansi\xF3n -->
          <circle cx="0" cy="0" r="34" class="launchpad-energy-ring r1" />
          <circle cx="0" cy="0" r="28" class="launchpad-energy-ring r2" />

          <!-- Base de sombra profunda -->
          <ellipse cx="0" cy="18" rx="28" ry="10" fill="rgba(0,0,0,0.6)" filter="blur(4px)" />

          <!-- Pedestal cil\xEDndrico de la plataforma arcade -->
          <path d="M -24,4 L -24,10 C -24,18 24,18 24,10 L 24,4 Z" fill="#0f172a" stroke="#0284c7" stroke-width="1.5" />

          <!-- Superficie superior con anillo de ne\xF3n y n\xFAcleo de energ\xEDa -->
          <ellipse cx="0" cy="3" rx="24" ry="14" fill="#0f172a" stroke="url(#portal-outer-ring)" stroke-width="3" filter="url(#portal-cyan-glow)" />
          <ellipse cx="0" cy="3" rx="18" ry="10" fill="url(#portal-core-glow)" />

          <!-- Emisores LED perimetrales luminosos -->
          <circle cx="-16" cy="3" r="2" fill="#67e8f9" filter="drop-shadow(0 0 3px #67e8f9)" />
          <circle cx="16" cy="3" r="2" fill="#67e8f9" filter="drop-shadow(0 0 3px #67e8f9)" />
          <circle cx="0" cy="-7" r="2" fill="#67e8f9" filter="drop-shadow(0 0 3px #67e8f9)" />
          <circle cx="0" cy="13" r="2" fill="#67e8f9" filter="drop-shadow(0 0 3px #67e8f9)" />

          <!-- N\xFAmero de lecci\xF3n en ne\xF3n cian -->
          <text cx="0" y="8" font-family="'Fredoka', 'Nunito', sans-serif" font-weight="900" font-size="13.5" fill="#67e8f9" text-anchor="middle" filter="drop-shadow(0 0 4px #00cec9)">${labelText}</text>

          <!-- Roby posado y saltando en la plataforma -->
          ${robyMarker}
        </g>
      `;
      }
      if (!isUnlocked) {
        return `
        <g class="stone-token-3d">
          <!-- Sombra en el terreno -->
          <ellipse cx="0" cy="22" rx="20" ry="6" fill="rgba(0,0,0,0.5)" filter="blur(2px)" />

          <!-- Losa de piedra 3D biselada -->
          <circle cx="0" cy="2" r="21" fill="#0f172a" />
          <circle cx="0" cy="0" r="21" fill="url(#stone-slab-grad)" stroke="#475569" stroke-width="2" filter="url(#mario-node-shadow)" />
          <!-- Hendidura circular interior -->
          <circle cx="0" cy="0" r="17" fill="url(#stone-inner-grad)" stroke="#0f172a" stroke-width="1.5" />

          <!-- Candado dorado en relieve 3D -->
          <path d="M -6,-3 L -6,-8 C -6,-13 6,-13 6,-8 L 6,-3" fill="none" stroke="url(#lock-shackle-grad)" stroke-width="3" stroke-linecap="round" />
          <rect x="-8" y="-3" width="16" height="13" rx="3" fill="url(#lock-body-grad)" stroke="#78350f" stroke-width="1" filter="drop-shadow(0 2px 3px rgba(0,0,0,0.5))" />
          <circle cx="0" cy="2" r="2" fill="#451a03" />
          <polygon points="-1,2 1,2 1.5,6 -1.5,6" fill="#451a03" />
        </g>
      `;
      }
      return `
      <g class="unlocked-token-3d">
        <!-- Sombra en el terreno -->
        <ellipse cx="0" cy="22" rx="21" ry="6" fill="rgba(0,0,0,0.5)" filter="blur(2.5px)" />

        <circle cx="0" cy="0" r="22" fill="#00cec9" stroke="#ffffff" stroke-width="3" filter="url(#mario-node-shadow)" />
        <circle cx="0" cy="1" r="17.5" fill="none" stroke="#0984e3" stroke-width="1.5" opacity="0.6" />
        <path d="M -15,-6 A 16 16 0 0 1 15,-6 A 14 12 0 0 0 -15,-6 Z" fill="rgba(255,255,255,0.4)" />
        <text cx="0" y="6" font-family="'Fredoka', 'Nunito', sans-serif" font-weight="900" font-size="15" fill="#ffffff" text-anchor="middle" filter="drop-shadow(0 1px 2px rgba(0,0,0,0.5))">${labelText}</text>
      </g>
    `;
    }
    /**
     * Markup for the final Castle / Fortress Examination node in stylized 3D.
     * @private
     */
    _getCastleNodeMarkup(node) {
      const isCompleted = node.isCompleted;
      const isUnlocked = node.isUnlocked;
      const isActive = node.isActive;
      const robyMarker = isActive ? `
      <g class="mario-roby-wrapper mario-roby-marker" transform="translate(0, -42)">
        <image href="assets/mascot/mascot_idle.png" x="-30" y="-38" width="60" height="60" class="mario-roby-sprite" />
        <ellipse cx="0" cy="22" rx="16" ry="5" fill="rgba(0,0,0,0.55)" />
      </g>
    ` : "";
      return `
      <!-- Halo aura m\xEDstica del castillo -->
      ${isActive ? '<ellipse cx="0" cy="0" rx="46" ry="38" class="castle-aura-halo" />' : ""}

      <!-- Sombra de la fortaleza en el terreno -->
      <ellipse cx="0" cy="34" rx="42" ry="12" fill="rgba(0,0,0,0.65)" filter="blur(5px)" />

      <!-- Base de roca de la colina del castillo -->
      <path d="M -40,32 Q 0,22 40,32 L 44,40 Q 0,46 -44,40 Z" fill="#1e293b" stroke="#334155" stroke-width="1.5" />

      <!-- Cuerpo principal de muralla de piedra -->
      <rect x="-32" y="-4" width="64" height="34" rx="2" fill="url(#castle-wall-light)" stroke="#1e293b" stroke-width="2" />

      <!-- L\xEDneas de canter\xEDa de sillares -->
      <line x1="-32" y1="8" x2="32" y2="8" stroke="#1e293b" stroke-width="1" opacity="0.4" />
      <line x1="-32" y1="20" x2="32" y2="20" stroke="#1e293b" stroke-width="1" opacity="0.4" />
      <line x1="-12" y1="8" x2="-12" y2="20" stroke="#1e293b" stroke-width="1" opacity="0.3" />
      <line x1="12" y1="8" x2="12" y2="20" stroke="#1e293b" stroke-width="1" opacity="0.3" />
      <line x1="0" y1="-4" x2="0" y2="8" stroke="#1e293b" stroke-width="1" opacity="0.3" />

      <!-- Torre Izquierda con almenas -->
      <rect x="-36" y="-18" width="16" height="38" rx="2" fill="url(#castle-wall-light)" stroke="#1e293b" stroke-width="1.8" />
      <!-- Almenas torre izquierda -->
      <path d="M -37,-24 L -37,-18 L -20,-18 L -20,-24 L -23,-24 L -23,-21 L -27,-21 L -27,-24 L -31,-24 L -31,-21 L -34,-21 L -34,-24 Z" fill="#64748b" stroke="#1e293b" stroke-width="1.2" />
      <!-- M\xE1stil y bandera torre izquierda -->
      <line x1="-28" y1="-24" x2="-28" y2="-36" stroke="#d97706" stroke-width="2" />
      <path d="M -28,-36 Q -22,-39 -16,-34 Q -22,-29 -28,-32 Z" class="castle-banner-wave b1" fill="url(#flag-wave-grad)" />

      <!-- Torre Derecha con almenas -->
      <rect x="20" y="-18" width="16" height="38" rx="2" fill="url(#castle-wall-light)" stroke="#1e293b" stroke-width="1.8" />
      <!-- Almenas torre derecha -->
      <path d="M 19,-24 L 19,-18 L 36,-18 L 36,-24 L 33,-24 L 33,-21 L 29,-21 L 29,-24 L 25,-24 L 25,-21 L 22,-21 L 22,-24 Z" fill="#64748b" stroke="#1e293b" stroke-width="1.2" />
      <!-- M\xE1stil y bandera torre derecha -->
      <line x1="28" y1="-24" x2="28" y2="-36" stroke="#d97706" stroke-width="2" />
      <path d="M 28,-36 Q 34,-39 40,-34 Q 34,-29 28,-32 Z" class="castle-banner-wave b2" fill="url(#flag-wave-grad)" />

      <!-- Torre Central Gran Torre\xF3n (m\xE1s alta) -->
      <rect x="-14" y="-28" width="28" height="42" rx="2" fill="url(#castle-wall-light)" stroke="#1e293b" stroke-width="2" />
      <!-- Tejado c\xF3nico piramidal imperial de la torre central -->
      <polygon points="0,-46 -17,-28 17,-28" fill="url(#castle-roof-grad)" stroke="#1e1b4b" stroke-width="1.5" />
      <!-- Gran Bandera Real en torre central -->
      <line x1="0" y1="-46" x2="0" y2="-58" stroke="#ffd32a" stroke-width="2.2" />
      <path d="M 0,-58 Q 10,-62 18,-55 Q 10,-48 0,-52 Z" class="castle-banner-wave b-center" fill="url(#flag-wave-grad)" filter="drop-shadow(0 1px 3px rgba(0,0,0,0.6))" />
      <!-- Corona dorada en torre central -->
      <polygon points="-5,-24 -7,-20 -3,-21 0,-26 3,-21 7,-20 5,-24" fill="#ffd32a" stroke="#b45309" stroke-width="0.8" />

      <!-- Portal Arqueado de la Fortaleza -->
      <path d="M -11,30 L -11,14 A 11 11 0 0 1 11,14 L 11,30 Z" fill="#090d16" stroke="#1e293b" stroke-width="2" />
      <!-- Fuego m\xE1gico / Luz interior c\xE1lida del portal -->
      <path d="M -9,30 L -9,15 A 9 9 0 0 1 9,15 L 9,30 Z" fill="url(#castle-portal-fire)" opacity="${isUnlocked ? "0.9" : "0.2"}" />
      <!-- Verja levadiza medieval dorada -->
      <line x1="-9" y1="18" x2="9" y2="18" stroke="#d97706" stroke-width="1.2" />
      <line x1="-9" y1="23" x2="9" y2="23" stroke="#d97706" stroke-width="1.2" />
      <line x1="-5" y1="14" x2="-5" y2="30" stroke="#d97706" stroke-width="1.2" />
      <line x1="0" y1="12" x2="0" y2="30" stroke="#d97706" stroke-width="1.2" />
      <line x1="5" y1="14" x2="5" y2="30" stroke="#d97706" stroke-width="1.2" />

      <!-- Ventanillas de tiro iluminadas en torres -->
      <rect x="-30" y="-10" width="4" height="10" rx="2" fill="${isUnlocked ? "#ffd32a" : "#0f172a"}" />
      <rect x="26" y="-10" width="4" height="10" rx="2" fill="${isUnlocked ? "#ffd32a" : "#0f172a"}" />

      <!-- Placa de texto Examen / Corona final -->
      <g transform="translate(0, 39)">
        <rect x="-32" y="-7" width="64" height="16" rx="7" fill="${isCompleted ? "#f59e0b" : isUnlocked ? "#6366f1" : "#334155"}" stroke="#ffffff" stroke-width="1.5" filter="drop-shadow(0 2px 4px rgba(0,0,0,0.6))" />
        <text x="0" y="5" font-family="'Fredoka', 'Nunito', sans-serif" font-weight="900" font-size="9.5" fill="#ffffff" text-anchor="middle">
          ${isCompleted ? "\u{1F451} SUPERADO" : isUnlocked ? "\u{1F3F0} EXAMEN" : "\u{1F512} BLOQUEADO"}
        </text>
      </g>

      <!-- Roby saltando en el castillo si est\xE1 activo -->
      ${robyMarker}
    `;
    }
    /**
     * Catmull-Rom cubic Bézier spline calculation connecting points smoothly.
     * @private
     */
    _generateSplinePath(pts) {
      if (!pts || pts.length < 2) return "";
      let d = `M ${pts[0].x},${pts[0].y}`;
      for (let i = 0; i < pts.length - 1; i++) {
        const p0 = i > 0 ? pts[i - 1] : pts[i];
        const p1 = pts[i];
        const p2 = pts[i + 1];
        const p3 = i < pts.length - 2 ? pts[i + 2] : p2;
        const cp1x = Math.round(p1.x + (p2.x - p0.x) / 6);
        const cp1y = Math.round(p1.y + (p2.y - p0.y) / 6);
        const cp2x = Math.round(p2.x - (p3.x - p1.x) / 6);
        const cp2y = Math.round(p2.y - (p3.y - p1.y) / 6);
        d += ` C ${cp1x},${cp1y} ${cp2x},${cp2y} ${p2.x},${p2.y}`;
      }
      return d;
    }
    /**
     * Handles user clicking a node on the map.
     * @private
     */
    _handleNodeClick(node) {
      if (!node.isUnlocked) {
        if (this.audio) this.audio.playLockedShake();
        this._flashLockedNotice(
          node.type === "castle" ? `\u{1F512} \xA1Debes completar las 15 lecciones del Mundo ${node.worldId} para retar el Castillo!` : `\u{1F512} \xA1Completa la lecci\xF3n anterior para desbloquear el camino a la lecci\xF3n ${node.number}!`
        );
        return;
      }
      if (this.audio) this.audio.playMapNodeSelect();
      if (this.selectedNodeId === node.id) {
        this._launchCurrentSelection();
        return;
      }
      this.selectedNodeId = node.id;
      this._drawNodes();
      this._updateCourseCard();
    }
    /**
     * Steps through nodes with keyboard arrows.
     * @private
     */
    _stepNodeSelection(delta) {
      if (!this.nodes.length) return;
      const curIdx = this.nodes.findIndex((n) => n.id === this.selectedNodeId);
      let nextIdx = curIdx + delta;
      if (nextIdx < 0) nextIdx = 0;
      if (nextIdx >= this.nodes.length) nextIdx = this.nodes.length - 1;
      const target = this.nodes[nextIdx];
      if (target) {
        this.selectedNodeId = target.id;
        this._drawNodes();
        this._updateCourseCard();
        if (this.audio) this.audio.playButtonClick();
      }
    }
    /**
     * Updates the Course Preview Card at the bottom.
     * @private
     */
    _updateCourseCard() {
      const card = this._modalEl.querySelector("#map-course-card");
      if (!card) return;
      const node = this.nodes.find((n) => n.id === this.selectedNodeId) || this.nodes[0];
      if (!node) return;
      const badgeEl = card.querySelector("#course-badge");
      const titleEl = card.querySelector("#course-title");
      const descEl = card.querySelector("#course-desc");
      const keysRow = card.querySelector("#course-keys-row");
      const starsRow = card.querySelector("#course-stars-rating");
      const launchBtn = card.querySelector("#course-launch-btn");
      if (badgeEl) badgeEl.textContent = node.type === "castle" ? "\u{1F3F0}" : node.number;
      if (titleEl) titleEl.textContent = node.title;
      if (descEl) descEl.textContent = node.tip || (node.isUnlocked ? "\xA1Pulsa para jugar y ganar estrellas!" : "Bloqueado");
      if (keysRow) {
        keysRow.innerHTML = "";
        const sampleWords = node.words && node.words[0] ? node.words[0].text : "";
        const uniqueKeys = Array.from(new Set(sampleWords.toUpperCase().replace(/\s+/g, "").split(""))).slice(0, 4);
        if (uniqueKeys.length > 0) {
          uniqueKeys.forEach((k) => {
            const chip = document.createElement("span");
            chip.className = "course-key-chip";
            chip.textContent = k;
            keysRow.appendChild(chip);
          });
        } else {
          const chip = document.createElement("span");
          chip.className = "course-key-chip";
          chip.textContent = node.type === "castle" ? "EXAMEN" : "TECLADO";
          keysRow.appendChild(chip);
        }
      }
      if (starsRow) {
        const s = Math.max(0, node.stars || (node.isCompleted ? 3 : 0));
        starsRow.innerHTML = `
        <span class="${s >= 1 ? "star-on" : "star-off"}">\u2B50</span>
        <span class="${s >= 2 ? "star-on" : "star-off"}">\u2B50</span>
        <span class="${s >= 3 ? "star-on" : "star-off"}">\u2B50</span>
      `;
      }
      if (launchBtn) {
        if (node.isUnlocked) {
          launchBtn.disabled = false;
          launchBtn.className = "pulse-button course-launch-btn";
          launchBtn.textContent = node.type === "castle" ? "\xA1Entrar al Castillo! \u{1F3F0}" : "\xA1Jugar Lecci\xF3n! \u{1F680}";
        } else {
          launchBtn.disabled = true;
          launchBtn.className = "course-launch-btn is-disabled";
          launchBtn.textContent = "\u{1F512} Bloqueado";
        }
      }
    }
    /**
     * Launches the currently selected level or exam and smoothly closes the map.
     * @private
     */
    _launchCurrentSelection() {
      const node = this.nodes.find((n) => n.id === this.selectedNodeId);
      if (!node || !node.isUnlocked) return;
      if (this.audio) this.audio.playMapNodeSelect();
      const dialog = this._modalEl.querySelector("#adventure-map-dialog");
      if (dialog) {
        dialog.classList.add("map-zooming-into-node");
      }
      setTimeout(() => {
        this.close();
        if (dialog) dialog.classList.remove("map-zooming-into-node");
        if (node.type === "castle") {
          this.onSelectExam(node.worldId);
        } else {
          this.onSelectLesson(node.worldId, node.id);
        }
      }, 280);
    }
    /**
     * Flashes a temporary notification when clicking a locked node.
     * @private
     */
    _flashLockedNotice(text) {
      const descEl = this._modalEl.querySelector("#course-desc");
      if (!descEl) return;
      const old = descEl.textContent;
      descEl.textContent = text;
      descEl.classList.add("desc-locked-alert");
      setTimeout(() => {
        descEl.textContent = old;
        descEl.classList.remove("desc-locked-alert");
      }, 3200);
    }
    /**
     * Helper to retrieve highest unlocked level ID.
     * @private
     */
    _getHighestUnlockedLevel() {
      if (!this.storage) return 1;
      let unlocked = 1;
      for (let i = 1; i <= 7; i++) {
        if (this.storage.isExamPassed(i)) {
          unlocked = i + 1;
        } else {
          break;
        }
      }
      const stored = this.storage.getUnlockedLevel() || 1;
      return Math.min(8, Math.max(unlocked, stored));
    }
  };

  // src/main.js
  var MecanoApp = class {
    constructor() {
      this.eventBus = null;
      this.storage = null;
      this.audio = null;
      this.voiceEngine = null;
      this.voiceQueue = null;
      this.pedagogy = null;
      this.toyKeyboard = null;
      this.ghostHands = null;
      this.interactiveHands = null;
      this.liveScene = null;
      this.adventureMap = null;
      this.mascotAnimator = null;
      this.mascotController = null;
      this.mascotFSM = null;
      this.lipSync = null;
      this.speechBubble = null;
      this.accessorySocket = null;
      this.accessibilityPanel = null;
      this.gameEngine = null;
      this.currentLevelId = 1;
      this.currentLevelData = null;
      this.levelWords = [];
      this.currentWordIndex = 0;
      this.wordsGoal = 8;
      this.isGameStarted = false;
      this.isPaused = false;
      this.unsubscribers = [];
      this._lastErrorCheerTime = 0;
      this._isStreakPlaying = false;
      this.dom = {};
    }
    /**
     * Initializes and bootstraps the application in browser DOM.
     */
    init() {
      if (typeof document === "undefined") return;
      this._cacheDom();
      this._initSubsystems();
      this._bindEventBus();
      this._bindDomListeners();
      this._initMascotAndAccessories();
      if (typeof window !== "undefined") {
        window.__MECANO_APP__ = this;
      }
      try {
        const savedZoom = localStorage.getItem("mecano_text_zoom");
        if (savedZoom === "grande" || savedZoom === "extra") {
          const mult = savedZoom === "grande" ? "1.35" : "1.70";
          const label = savedZoom === "grande" ? "\u{1F50D} Aa+" : "\u{1F50D} Aa++";
          const title = savedZoom === "grande" ? "Tama\xF1o de texto: Grande (1.35x)" : "Tama\xF1o de texto: Gigante (1.70x)";
          document.body.dataset.textScale = savedZoom;
          document.documentElement.dataset.textScale = savedZoom;
          document.documentElement.style.setProperty("--text-scale", mult);
          if (this.dom.zoomBtn) {
            this.dom.zoomBtn.textContent = label;
            this.dom.zoomBtn.title = `${title} (Clic para cambiar)`;
          }
        }
      } catch (e) {
      }
      this.renderLevelMap();
      this.updateBeltUI();
      this.showStartScreen();
    }
    /**
     * Cache references to essential DOM elements.
     * @private
     */
    _cacheDom() {
      this.dom = {
        // Header & Stats
        levelNumber: document.getElementById("level"),
        levelTitle: document.getElementById("level-title-display"),
        wordsCount: document.getElementById("words-count"),
        wordsGoal: document.getElementById("words-goal"),
        ppm: document.getElementById("ppm"),
        errors: document.getElementById("errors"),
        accuracy: document.getElementById("accuracy"),
        comboCounter: document.getElementById("combo-counter"),
        comboNumber: document.getElementById("combo-number"),
        mapBtn: document.getElementById("map-btn"),
        worldMapBtn: document.getElementById("world-map-btn"),
        zoomBtn: document.getElementById("zoom-toggle-btn"),
        settingsBtn: document.getElementById("settings-btn"),
        voiceSelect: document.getElementById("voice-select"),
        voiceTestBtn: document.getElementById("voice-test-btn"),
        voiceMuteBtn: document.getElementById("voice-mute-btn"),
        toolsDrawerToggle: document.getElementById("tools-drawer-toggle"),
        toolsDrawer: document.getElementById("header-tools-drawer"),
        // Play Area & Target
        targetWord: document.getElementById("target-word"),
        wordPanel: document.getElementById("word-panel"),
        // Mascot & Stage
        mascotStage: document.getElementById("mascot-stage"),
        mascotWrapper: document.getElementById("mascot-avatar-wrapper"),
        mascotAvatar: document.getElementById("mascot-avatar"),
        mascotBadge: document.getElementById("mascot-badge"),
        mascotBeltTag: document.getElementById("mascot-belt-tag"),
        mascotBubble: document.getElementById("mascot-bubble"),
        mascotSpeechText: document.getElementById("mascot-speech-text"),
        mascotSpeakBtn: document.getElementById("mascot-speak-btn"),
        voiceWaveIndicator: document.getElementById("voice-wave-indicator"),
        mascotTipBar: document.getElementById("mascot-tip-bar"),
        tipIcon: document.getElementById("tip-icon"),
        mascotLessonTip: document.getElementById("mascot-lesson-tip"),
        tipNextBtn: document.getElementById("tip-next-btn"),
        // Keyboard & Hands
        keyboard: document.getElementById("keyboard"),
        handLeft: document.getElementById("hand-svg-left"),
        handRight: document.getElementById("hand-svg-right"),
        currentFingerHint: document.getElementById("current-finger-hint"),
        // Start Screen Modal & Map
        startScreen: document.getElementById("start-screen"),
        startRobyRank: document.getElementById("start-roby-rank"),
        levelsMapGrid: document.getElementById("levels-map-grid"),
        totalStarsCount: document.getElementById("total-stars-count"),
        startGameBtn: document.getElementById("start-game-btn"),
        resetProgressBtn: document.getElementById("reset-progress-btn"),
        startDifficultySelect: document.getElementById("start-difficulty-select"),
        startKeyboardSelect: document.getElementById("start-keyboard-select"),
        // Level Complete Modal
        levelComplete: document.getElementById("level-complete"),
        levelCompleteTitle: document.getElementById("level-complete-title"),
        levelCompleteCount: document.getElementById("level-complete-count"),
        levelCompleteStats: document.getElementById("level-complete-stats-summary"),
        levelCompleteSpeech: document.getElementById("level-complete-mascot-speech"),
        levelCompleteAvatar: document.getElementById("level-complete-avatar"),
        starsRating: document.getElementById("stars-rating"),
        nextLevelBtn: document.getElementById("next-level-btn"),
        retryLevelBtn: document.getElementById("retry-level-btn"),
        // Confetti canvas
        confettiCanvas: document.getElementById("confetti-canvas"),
        // Sublessons navigation
        sublessonsNav: document.getElementById("sublessons-nav"),
        sublessonsTitle: document.getElementById("sublessons-nav-title"),
        sublessonsStatus: document.getElementById("sublessons-nav-status"),
        sublessonsChips: document.getElementById("sublessons-chips-container"),
        // Diploma button & Modal
        diplomaBtn: document.getElementById("diploma-btn"),
        diplomaModal: document.getElementById("diploma-modal"),
        diplomaModalBackdrop: document.getElementById("diploma-modal-backdrop"),
        diplomaCloseBtn: document.getElementById("diploma-close-btn"),
        diplomaStudentName: document.getElementById("diploma-student-name"),
        diplomaSaveNameBtn: document.getElementById("diploma-save-name-btn"),
        diplomaCanvas: document.getElementById("diploma-canvas"),
        diplomaPrintBtn: document.getElementById("diploma-print-btn"),
        diplomaDownloadBtn: document.getElementById("diploma-download-btn"),
        // Exam Modal
        examModal: document.getElementById("exam-modal"),
        examBadgeIcon: document.getElementById("exam-badge-icon"),
        examModalTitle: document.getElementById("exam-modal-title"),
        examStarsRating: document.getElementById("exam-stars-rating"),
        examModalMessage: document.getElementById("exam-modal-message"),
        examModalStats: document.getElementById("exam-modal-stats"),
        examModalSpeech: document.getElementById("exam-modal-speech"),
        examRetryBtn: document.getElementById("exam-retry-btn"),
        examReviewLessonsBtn: document.getElementById("exam-review-lessons-btn"),
        examViewDiplomaBtn: document.getElementById("exam-view-diploma-btn"),
        examNextLevelBtn: document.getElementById("exam-next-level-btn"),
        // Video Intro Modal
        lessonVideoBtn: document.getElementById("lesson-video-btn"),
        videoIntroModal: document.getElementById("video-intro-modal"),
        videoIntroCard: document.querySelector(".video-intro-card"),
        videoIntroPlayer: document.getElementById("video-intro-player"),
        videoIntroTitle: document.getElementById("video-intro-title"),
        videoIntroCloseBtn: document.getElementById("video-intro-close-btn"),
        videoIntroSkipBtn: document.getElementById("video-intro-skip-btn"),
        videoPlaceholder: document.getElementById("video-intro-placeholder"),
        videoPlaceholderHeading: document.getElementById("video-placeholder-heading"),
        videoPlaceholderText: document.getElementById("video-placeholder-text")
      };
    }
    /**
     * Instantiate all 5 decoupled architecture subsystems.
     * @private
     */
    _initSubsystems() {
      this.eventBus = new EventBus();
      this.storage = new StorageManager();
      this.voiceEngine = new VoiceEngine({ eventBus: this.eventBus });
      this.audio = new ProceduralAudio({ eventBus: this.eventBus });
      this.audio.bindEventBus(this.eventBus);
      this.voiceQueue = new VoiceQueue({
        eventBus: this.eventBus,
        voiceEngine: this.voiceEngine
      });
      this.voiceQueue.bindEventBus(this.eventBus);
      this.pedagogy = new PedagogyEngine();
      this.liveScene = new LiveScene({
        container: "#live-scene-container",
        eventBus: this.eventBus,
        mascotElement: this.dom.mascotAvatar,
        autoStart: true
      });
      this.toyKeyboard = new ToyKeyboard({
        container: this.dom.keyboard || "#keyboard",
        eventBus: this.eventBus,
        onKeyPress: (key) => this.handleKeystrokeInput(key)
      });
      this.interactiveHands = new InteractiveHandsSVG({
        eventBus: this.eventBus,
        leftContainer: "#hand-card-left .hand-illustration",
        rightContainer: "#hand-card-right .hand-illustration",
        hintContainer: this.dom.currentFingerHint || "#current-finger-hint"
      });
      this.ghostHands = new GhostHands({
        eventBus: this.eventBus,
        leftHand: this.dom.handLeft || "#hand-svg-left",
        rightHand: this.dom.handRight || "#hand-svg-right",
        hintContainer: this.dom.currentFingerHint || "#current-finger-hint"
      });
      this.mascotController = new MascotController({
        voiceEngine: this.voiceEngine,
        eventBus: this.eventBus,
        container: this.dom.mascotWrapper || "#mascot-avatar-wrapper"
      });
      this.mascotFSM = new MascotFSM({
        eventBus: this.eventBus,
        sleepTimeoutSec: 25,
        onStateChange: (newState, oldState) => this.handleMascotStateChange(newState, oldState)
      });
      this.mascotAnimator = new MascotAnimator({
        element: this.dom.mascotAvatar,
        eventBus: this.eventBus
      });
      this.mascotAnimator.start();
      const waveBars = this.dom.voiceWaveIndicator ? Array.from(this.dom.voiceWaveIndicator.querySelectorAll("span")) : [];
      this.lipSync = new LipSync({
        mouthElement: this.dom.mascotAvatar,
        waveBars,
        indicatorElement: this.dom.voiceWaveIndicator,
        eventBus: this.eventBus
      });
      this.speechBubble = new SpeechBubble({
        container: document.querySelector(".mascot-speech-container"),
        eventBus: this.eventBus
      });
      this.accessorySocket = new AccessorySocket({
        storageManager: this.storage,
        container: this.dom.mascotWrapper
      });
      this.accessibilityPanel = new AccessibilityPanel({
        storage: this.storage,
        proceduralAudio: this.audio,
        voiceQueue: this.voiceQueue,
        voiceEngine: this.voiceEngine,
        container: document.body
      });
      this.gameEngine = new GameEngine({
        eventBus: this.eventBus,
        storage: this.storage,
        feverThreshold: 10,
        idleStuckThresholdMs: 2e3,
        keyPositionResolver: (key) => this.toyKeyboard.getKeyScreenPosition(key)
      });
      this.adventureMap = new AdventureMap({
        pedagogy: this.pedagogy,
        storage: this.storage,
        audio: this.audio,
        onSelectLesson: (worldId, lessonId) => {
          this.startLesson(worldId, lessonId);
        },
        onSelectExam: (worldId) => {
          this.startExam(worldId);
        }
      });
    }
    /**
     * Wire EventBus subscriptions to handle reactive gameplay changes.
     * @private
     */
    _bindEventBus() {
      this.unsubscribers.push(
        this.eventBus.on("KEY_TARGET_CHANGED", (payload) => {
          this.updateWordDisplay();
          this._updateTargetKeyTip(payload);
          this._updateMascotSpeechBubbleForTarget(payload);
          this._updateAmbientBacklight(payload && payload.key);
        })
      );
      this.unsubscribers.push(
        this.eventBus.on("KEY_PRESSED_SUCCESS", (payload) => {
          if (!this._isStreakPlaying) {
            if (this.voiceQueue) this.voiceQueue.cancel();
            if (this.voiceEngine) this.voiceEngine.stop();
            if (this.lipSync) this.lipSync.stopSpeaking();
            if (this.dom.voiceWaveIndicator) {
              this.dom.voiceWaveIndicator.classList.remove("is-speaking");
            }
          }
          this._manualTipLockTime = 0;
          this.updateStats();
          this.updateWordDisplay();
          const combo = payload && payload.comboCount || 0;
          if (combo === 10 || combo === 20) {
            this._isStreakPlaying = true;
            if (this.mascotController) {
              this.mascotController.setEmotion(MASCOT_EMOTIONS.STREAK, combo === 20 ? 3800 : 3200);
            }
            const streakId = combo === 20 ? "streak_20" : "streak_10";
            const streakText = combo === 20 ? "\xA1Sensacional! \xA1Veinte aciertos seguidos! \xA1Eres el rey del teclado!" : "\xA1Incre\xEDble racha de diez aciertos seguidos! \xA1Tus dedos vuelan como un cohete!";
            if (this.voiceEngine) {
              this.voiceEngine.speak({
                audioId: streakId,
                text: streakText,
                priority: "CRITICAL",
                onEnd: () => {
                  this._isStreakPlaying = false;
                }
              }).catch(() => {
                this._isStreakPlaying = false;
              });
            } else {
              setTimeout(() => {
                this._isStreakPlaying = false;
              }, 3e3);
            }
          }
          this._checkWordAdvance();
        })
      );
      this.unsubscribers.push(
        this.eventBus.on("KEY_PRESSED_FAIL", (payload) => {
          this.updateStats();
          if (payload && payload.pressedKey) {
            this.toyKeyboard.flashKeyError(payload.pressedKey);
          }
          if (this.mascotController) {
            this.mascotController.setEmotion(MASCOT_EMOTIONS.ERROR, 1800);
          }
          const now = Date.now();
          if (now - this._lastErrorCheerTime > 6e3 && this.voiceEngine && !this.voiceEngine.isSpeaking() && !this._isStreakPlaying) {
            this._lastErrorCheerTime = now;
            const cheerId = Math.random() < 0.5 ? "error_cheer_1" : "error_cheer_2";
            const cheerText = cheerId === "error_cheer_1" ? "\xA1No te preocupes! Equivocarse es el truco secreto para aprender. \xA1Prueba otra vez!" : "\xA1Respira hondo y busca la tecla iluminada! \xA1T\xFA tienes superpoderes!";
            this.voiceEngine.speak({
              audioId: cheerId,
              text: cheerText,
              priority: "HIGH"
            }).catch(() => {
            });
          }
        })
      );
      this.unsubscribers.push(
        this.eventBus.on("FEVER_MODE_CHANGED", (payload) => {
          const isActive = Boolean(payload && payload.isActive);
          if (this.dom.comboCounter) {
            if (isActive) {
              this.dom.comboCounter.classList.add("fever-glow");
              this.dom.comboCounter.classList.remove("hidden");
            } else {
              this.dom.comboCounter.classList.remove("fever-glow");
            }
          }
          if (document.body) {
            document.body.classList.toggle("fever-active", isActive);
          }
          const backlight = document.getElementById("cockpit-ambient-backlight");
          if (backlight) {
            backlight.classList.toggle("fever-active", isActive);
          }
        })
      );
      this.unsubscribers.push(
        this.eventBus.on("USER_STUCK", (payload) => {
        })
      );
      this.unsubscribers.push(
        this.eventBus.on("MASCOT_SPEAK_REQUEST", (payload) => {
          if (!payload || !payload.text) return;
          if (this.dom.mascotSpeechText) {
            this.dom.mascotSpeechText.innerHTML = formatDialogueText(payload.text);
          }
          if (this.dom.mascotBubble) {
            this.dom.mascotBubble.classList.remove("bubble-pop");
            void this.dom.mascotBubble.offsetWidth;
            this.dom.mascotBubble.classList.add("bubble-pop");
          }
        })
      );
      this.unsubscribers.push(
        this.eventBus.on("LEVEL_COMPLETED", (payload) => {
          this.handleLevelCompleted(payload);
        })
      );
    }
    /**
     * Bind DOM event listeners for buttons, windows, and keyboard inputs.
     * @private
     */
    _bindDomListeners() {
      window.addEventListener("keydown", (e) => this.handleKeyDown(e));
      const unlockAudio = () => {
        if (this.voiceEngine) {
          this.voiceEngine.getAudioContext();
          this.voiceEngine.resume();
        }
        if (this.audio && typeof this.audio.unlock === "function") {
          this.audio.unlock();
        }
      };
      window.addEventListener("pointerdown", unlockAudio, { once: true, passive: true });
      window.addEventListener("keydown", unlockAudio, { once: true, passive: true });
      if (this.dom.worldMapBtn) {
        this.dom.worldMapBtn.addEventListener("click", () => {
          this.audio.playButtonClick();
          if (this.adventureMap) {
            this.adventureMap.open({ worldId: this.currentLevelId });
          }
        });
      }
      if (this.dom.mapBtn) {
        this.dom.mapBtn.addEventListener("click", () => {
          this.audio.playButtonClick();
          if (this.adventureMap) {
            this.adventureMap.open({ worldId: this.currentLevelId });
          } else {
            this.showStartScreen();
          }
        });
      }
      if (this.dom.zoomBtn) {
        this.dom.zoomBtn.addEventListener("click", () => {
          this.audio.playButtonClick();
          this.toggleTextZoom();
        });
      }
      if (this.dom.settingsBtn) {
        this.dom.settingsBtn.addEventListener("click", () => {
          this.audio.playButtonClick();
          this.accessibilityPanel.toggle();
        });
      }
      if (this.dom.voiceSelect) {
        this._populateVoiceSelector();
        this.dom.voiceSelect.addEventListener("change", (e) => {
          if (this.voiceEngine) {
            this.voiceEngine.setVoice(e.target.value);
          }
        });
      }
      if (this.dom.voiceTestBtn) {
        this.dom.voiceTestBtn.addEventListener("click", () => {
          if (this.voiceEngine) {
            this.voiceEngine.getAudioContext();
            this.voiceEngine.speak({
              audioId: "welcome",
              text: "\xA1Hola! Soy Roby. \xA1Tus dedos se mueven genial por el teclado!",
              priority: "HIGH"
            });
          }
        });
      }
      if (this.dom.voiceMuteBtn) {
        this.dom.voiceMuteBtn.addEventListener("click", () => {
          if (this.voiceEngine) {
            const nowMuted = !this.voiceEngine._muted;
            this.voiceEngine.setMuted(nowMuted);
            this.voiceQueue.setMuted(nowMuted);
            this.dom.voiceMuteBtn.textContent = nowMuted ? "\u{1F507}" : "\u{1F50A}";
            this.dom.voiceMuteBtn.title = nowMuted ? "Activar voz" : "Silenciar voz";
          }
        });
      }
      if (this.dom.toolsDrawerToggle && this.dom.toolsDrawer) {
        this.dom.toolsDrawerToggle.addEventListener("click", (e) => {
          e.stopPropagation();
          this.dom.toolsDrawer.classList.toggle("is-open");
          const isOpen = this.dom.toolsDrawer.classList.contains("is-open");
          this.dom.toolsDrawerToggle.setAttribute("aria-expanded", String(isOpen));
        });
        document.addEventListener("click", (e) => {
          if (!this.dom.toolsDrawer.contains(e.target)) {
            this.dom.toolsDrawer.classList.remove("is-open");
            this.dom.toolsDrawerToggle.setAttribute("aria-expanded", "false");
          }
        });
      }
      if (this.dom.mascotWrapper) {
        this.dom.mascotWrapper.addEventListener("click", () => {
          this.handleMascotClick();
        });
      }
      if (this.dom.mascotAvatar && this.dom.mascotAvatar !== this.dom.mascotWrapper) {
        this.dom.mascotAvatar.addEventListener("click", (e) => {
          e.stopPropagation();
          this.handleMascotClick();
        });
      }
      if (this.dom.tipNextBtn) {
        this.dom.tipNextBtn.addEventListener("click", (e) => {
          e.stopPropagation();
          this.cycleTip(true);
        });
      }
      if (this.dom.mascotTipBar) {
        this.dom.mascotTipBar.addEventListener("click", () => {
          this.cycleTip(false);
        });
      }
      if (this.dom.mascotSpeakBtn) {
        this.dom.mascotSpeakBtn.addEventListener("click", () => {
          this.audio.playButtonClick();
          if (this.voiceQueue) {
            if (this.voiceQueue._volume <= 0) this.voiceQueue.setVolume(0.85);
            if (this.voiceQueue._muted) this.voiceQueue.setMuted(false);
          }
          if (this.voiceEngine) {
            if (this.voiceEngine._volume <= 0) this.voiceEngine.setVolume(0.85);
            if (this.voiceEngine._muted) this.voiceEngine.setMuted(false);
          }
          if (this.dom.voiceMuteBtn) {
            this.dom.voiceMuteBtn.textContent = "\u{1F50A}";
            this.dom.voiceMuteBtn.title = "Silenciar voz";
          }
          const text = this.dom.mascotSpeechText?.textContent;
          if (text) {
            if (this.lipSync) this.lipSync.speak(text);
            this.voiceQueue.speak({
              text,
              priority: "CRITICAL",
              emotion: "happy",
              onStart: () => {
                if (this.dom.voiceWaveIndicator) {
                  this.dom.voiceWaveIndicator.classList.add("is-speaking");
                }
              },
              onEnd: () => {
                if (this.dom.voiceWaveIndicator) {
                  this.dom.voiceWaveIndicator.classList.remove("is-speaking");
                }
              }
            });
          }
        });
      }
      if (this.dom.startGameBtn) {
        this.dom.startGameBtn.addEventListener("click", () => {
          this.audio.playButtonClick();
          this.startLevel(this.currentLevelId);
        });
      }
      if (this.dom.resetProgressBtn) {
        this.dom.resetProgressBtn.addEventListener("click", () => {
          if (confirm("\xBFQuieres reiniciar todas tus estrellas y volver a empezar?")) {
            this.audio.playButtonClick();
            this.storage.resetAll();
            this.renderLevelMap();
            this.updateBeltUI();
            this._initMascotAndAccessories();
          }
        });
      }
      if (this.dom.nextLevelBtn) {
        this.dom.nextLevelBtn.addEventListener("click", () => {
          this.audio.playButtonClick();
          this.advanceToNextLessonOrExam();
        });
      }
      if (this.dom.retryLevelBtn) {
        this.dom.retryLevelBtn.addEventListener("click", () => {
          this.audio.playButtonClick();
          this.hideLevelCompleteModal();
          if (this.currentLessonId) {
            this.startLesson(this.currentLevelId, this.currentLessonId);
          } else {
            this.startLevel(this.currentLevelId);
          }
        });
      }
      if (this.dom.lessonVideoBtn) {
        this.dom.lessonVideoBtn.addEventListener("click", () => {
          this.audio.playButtonClick();
          this.showLessonVideoIntro(this.currentLevelId, this.currentLessonId, true);
        });
      }
      if (this.dom.videoIntroCloseBtn) {
        this.dom.videoIntroCloseBtn.addEventListener("click", () => {
          this.audio.playButtonClick();
          this.closeLessonVideoIntro();
        });
      }
      if (this.dom.videoIntroSkipBtn) {
        this.dom.videoIntroSkipBtn.addEventListener("click", () => {
          this.audio.playButtonClick();
          this.closeLessonVideoIntro();
        });
      }
      if (this.dom.diplomaBtn) {
        this.dom.diplomaBtn.addEventListener("click", () => {
          this.audio.playButtonClick();
          this.showDiplomaModal();
        });
      }
      if (this.dom.diplomaCloseBtn) {
        this.dom.diplomaCloseBtn.addEventListener("click", () => {
          this.audio.playButtonClick();
          this.hideDiplomaModal();
        });
      }
      if (this.dom.diplomaModalBackdrop) {
        this.dom.diplomaModalBackdrop.addEventListener("click", () => {
          this.hideDiplomaModal();
        });
      }
      if (this.dom.diplomaStudentName) {
        this.dom.diplomaStudentName.addEventListener("input", () => {
          const val = this.dom.diplomaStudentName.value;
          if (this.storage) this.storage.setStudentName(val);
          this._refreshDiplomaCanvas();
        });
      }
      if (this.dom.diplomaSaveNameBtn) {
        this.dom.diplomaSaveNameBtn.addEventListener("click", () => {
          this.audio.playButtonClick();
          const val = this.dom.diplomaStudentName?.value;
          if (val && this.storage) {
            this.storage.setStudentName(val);
            this._refreshDiplomaCanvas();
          }
        });
      }
      if (this.dom.diplomaPrintBtn) {
        this.dom.diplomaPrintBtn.addEventListener("click", () => {
          this.audio.playButtonClick();
          TypingCertificate.printCertificate(this.dom.diplomaCanvas);
        });
      }
      if (this.dom.diplomaDownloadBtn) {
        this.dom.diplomaDownloadBtn.addEventListener("click", () => {
          this.audio.playButtonClick();
          const studentName = this.storage ? this.storage.getStudentName() : "Campeon";
          const cleanName = studentName.replace(/\s+/g, "_");
          TypingCertificate.downloadPNG(this.dom.diplomaCanvas, `Diploma_Mecanografia_${cleanName}.png`);
        });
      }
      if (this.dom.examRetryBtn) {
        this.dom.examRetryBtn.addEventListener("click", () => {
          this.audio.playButtonClick();
          this.hideExamModal();
          this.startExam(this.currentLevelId);
        });
      }
      if (this.dom.examReviewLessonsBtn) {
        this.dom.examReviewLessonsBtn.addEventListener("click", () => {
          this.audio.playButtonClick();
          this.hideExamModal();
          this.startLesson(this.currentLevelId, 0);
        });
      }
      if (this.dom.examViewDiplomaBtn) {
        this.dom.examViewDiplomaBtn.addEventListener("click", () => {
          this.audio.playButtonClick();
          this.hideExamModal();
          this.showDiplomaModal();
        });
      }
      if (this.dom.examNextLevelBtn) {
        this.dom.examNextLevelBtn.addEventListener("click", () => {
          this.audio.playButtonClick();
          this.hideExamModal();
          const nextId = Math.min(8, Number(this.currentLevelId) + 1);
          this.startLevel(nextId);
        });
      }
    }
    /**
     * Initialize Roby mascot accessories and belt rank.
     * @private
     */
    _initMascotAndAccessories() {
      if (!this.accessorySocket) return;
      const totalStars = this.storage.getTotalStars();
      const catalog = this.accessorySocket.getAllAccessories();
      for (const acc of catalog) {
        if (totalStars >= acc.starsRequired && !this.accessorySocket.isUnlocked(acc.id)) {
          this.accessorySocket.unlock(acc.id, totalStars);
        }
      }
      const equipped = this.accessorySocket.getAllEquipped();
      if (!equipped.head && this.accessorySocket.isUnlocked("hat-cap")) {
        this.accessorySocket.equip("head", "hat-cap");
      }
      if (!equipped.eyes && this.accessorySocket.isUnlocked("glasses-nerd")) {
        this.accessorySocket.equip("eyes", "glasses-nerd");
      }
      this.accessorySocket.updateEquippedVisuals();
    }
    /**
     * Handle physical keydown events.
     * @param {KeyboardEvent} e
     */
    handleKeyDown(e) {
      if (e.ctrlKey || e.altKey || e.metaKey || e.key === "F11" || e.key === "F12" || e.key === "Tab") {
        return;
      }
      if (e.key === "Escape") {
        if (this.dom.startScreen && !this.dom.startScreen.classList.contains("hidden")) {
          this.hideStartScreen();
        } else {
          this.showStartScreen();
        }
        return;
      }
      if (this.dom.videoIntroModal && !this.dom.videoIntroModal.classList.contains("hidden")) {
        if (e.key === "Enter" || e.key === " " || e.key === "Escape") {
          e.preventDefault();
          this.closeLessonVideoIntro();
          return;
        }
      }
      if (this.mascotFSM && this.mascotFSM.getState() === MascotFSM.STATES.HIGH_FIVE_WAIT) {
        if (e.key === " " || e.key === "Spacebar" || e.key === "Enter") {
          e.preventDefault();
          this.triggerHighFiveCelebration();
          return;
        }
      }
      if (this.dom.startScreen && !this.dom.startScreen.classList.contains("hidden")) {
        if (e.key === "Enter") {
          e.preventDefault();
          this.startLevel(this.currentLevelId);
        }
        return;
      }
      if (this.dom.levelComplete && !this.dom.levelComplete.classList.contains("hidden")) {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          this.audio.playButtonClick();
          this.advanceToNextLessonOrExam();
        }
        return;
      }
      if (this.dom.examModal && !this.dom.examModal.classList.contains("hidden")) {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          if (this.dom.examNextLevelBtn && !this.dom.examNextLevelBtn.classList.contains("hidden")) {
            this.dom.examNextLevelBtn.click();
          } else if (this.dom.examRetryBtn) {
            this.dom.examRetryBtn.click();
          }
        }
        return;
      }
      if (e.key === " ") {
        e.preventDefault();
      }
      this.handleKeystrokeInput(e.key);
    }
    /**
     * Central keystroke input pipeline (shared by physical keyboard and virtual buttons).
     * @param {string} rawKey
     */
    handleKeystrokeInput(rawKey) {
      if (!this.isGameStarted || this.isPaused) return;
      if (this.mascotFSM) {
        this.mascotFSM.handleKeystroke(rawKey);
      }
      const screenPos = this.toyKeyboard.getKeyScreenPosition(rawKey);
      const result = this.gameEngine.handleKeyPress(rawKey, screenPos);
      if (result.success) {
        this.toyKeyboard.flashKeyHit(rawKey);
      }
    }
    /**
     * Triggers the high-five celebration and confettis.
     */
    triggerHighFiveCelebration() {
      if (!this.mascotFSM) return;
      this.mascotFSM.handleKeystroke(" ");
      this.audio.playCelebration();
      applySquashAndStretch(this.dom.mascotAvatar, { preset: "happyBounce" });
      if (this.liveScene && this.liveScene.ambientParticleEngine) {
        const cx = typeof window !== "undefined" ? window.innerWidth / 2 : 500;
        const cy = typeof window !== "undefined" ? window.innerHeight * 0.45 : 300;
        this.liveScene.ambientParticleEngine.spawnConfetti(cx, cy, 75);
      }
      this.voiceQueue.speak({
        text: "\xA1Choca esos cinco! \xA1Eres un as del teclado!",
        priority: "CRITICAL",
        emotion: "victory"
      });
      setTimeout(() => {
        this.showLevelCompleteModal();
      }, 700);
    }
    /**
     * Starts a curriculum level by ID (1 to 8), starting at the first uncompleted micro-lesson.
     * @param {number|string} levelId
     */
    startLevel(levelId) {
      const numericId = Math.max(1, Math.min(8, parseInt(levelId, 10) || 1));
      this.currentLevelId = numericId;
      this.currentLevelData = this.pedagogy.getLevel(numericId);
      const lessons = this.pedagogy.getLessonsForLevel(numericId);
      if (lessons && lessons.length > 0) {
        const completed = this.storage ? this.storage.getCompletedLessons(numericId) : [];
        const firstUncompleted = lessons.find((l) => !completed.includes(l.id));
        if (firstUncompleted) {
          return this.startLesson(numericId, firstUncompleted.id);
        } else {
          return this.startLesson(numericId, lessons[0].id);
        }
      }
      this.currentLessonId = null;
      this.isExamMode = false;
      this.levelWords = this.currentLevelData && this.currentLevelData.words ? [...this.currentLevelData.words] : [{ text: "f j", icon: "\u{1F3AF}", label: "Inicio" }];
      this.currentWordIndex = 0;
      this.wordsGoal = Math.min(this.levelWords.length, 8);
      const targetTexts = this.levelWords.slice(0, this.wordsGoal).map((w) => w.text);
      if (this.interactiveHands) this.interactiveHands.setCurrentLevelId(this.currentLevelId);
      if (this.toyKeyboard) this.toyKeyboard.setCurrentLevelId(this.currentLevelId);
      this.gameEngine.startLevel(this.currentLevelId, targetTexts);
      if (this.dom.levelNumber) this.dom.levelNumber.textContent = String(this.currentLevelId);
      if (this.dom.levelTitle) this.dom.levelTitle.textContent = this.currentLevelData.name;
      if (this.dom.tipIcon) this.dom.tipIcon.textContent = "\u{1F4A1}";
      if (this.dom.mascotLessonTip) this.dom.mascotLessonTip.textContent = this.currentLevelData.tip.replace(/^💡\s*/, "");
      this._manualTipLockTime = Date.now() + 6e3;
      if (this.dom.wordsGoal) this.dom.wordsGoal.textContent = String(this.wordsGoal);
      if (this.dom.wordsCount) this.dom.wordsCount.textContent = "0";
      this.eventBus.emit("MASCOT_SPEAK_REQUEST", {
        text: this.currentLevelData.speech,
        priority: "HIGH",
        emotion: "happy"
      });
      this.renderSublessonsBar();
      this.hideStartScreen();
      this.hideLevelCompleteModal();
      this.hideExamModal();
      this.isGameStarted = true;
      this.isPaused = false;
      this.updateStats();
      this.updateWordDisplay();
      this.updateBeltUI();
    }
    /**
     * Starts a specific micro-lesson within a level.
     * @param {number|string} levelId
     * @param {string|number} lessonIdOrIndex
     */
    startLesson(levelId, lessonIdOrIndex) {
      const numericId = Math.max(1, Math.min(8, parseInt(levelId, 10) || 1));
      this.currentLevelId = numericId;
      this.currentLevelData = this.pedagogy.getLevel(numericId);
      this.isExamMode = false;
      const lesson = this.pedagogy.getLesson(numericId, lessonIdOrIndex) || {
        id: `${numericId}.1`,
        title: "Lecci\xF3n Inicial",
        tip: this.currentLevelData.tip,
        speech: this.currentLevelData.speech,
        words: this.currentLevelData.words
      };
      this.currentLessonId = lesson.id;
      this.levelWords = lesson.words && lesson.words.length > 0 ? [...lesson.words] : [{ text: "f j", icon: "\u{1F3AF}", label: "Inicio" }];
      this.currentWordIndex = 0;
      this.wordsGoal = this.levelWords.length;
      const targetTexts = this.levelWords.map((w) => w.text);
      if (this.interactiveHands) this.interactiveHands.setCurrentLevelId(this.currentLevelId);
      if (this.toyKeyboard) this.toyKeyboard.setCurrentLevelId(this.currentLevelId);
      this.gameEngine.startLevel(this.currentLevelId, targetTexts, {
        lessonId: lesson.id,
        isExam: false
      });
      if (this.dom.levelNumber) this.dom.levelNumber.textContent = `${this.currentLevelId}.${lesson.id.split(".")[1] || "1"}`;
      if (this.dom.levelTitle) this.dom.levelTitle.textContent = `${this.currentLevelData.shortName} \u2022 ${lesson.title}`;
      if (this.dom.tipIcon) this.dom.tipIcon.textContent = "\u{1F4A1}";
      if (this.dom.mascotLessonTip) this.dom.mascotLessonTip.textContent = (lesson.tip || this.currentLevelData.tip).replace(/^💡\s*/, "");
      this._manualTipLockTime = Date.now() + 6e3;
      if (this.dom.wordsGoal) this.dom.wordsGoal.textContent = String(this.wordsGoal);
      if (this.dom.wordsCount) this.dom.wordsCount.textContent = "0";
      this.eventBus.emit("MASCOT_SPEAK_REQUEST", {
        text: lesson.speech || this.currentLevelData.speech,
        priority: "HIGH",
        emotion: "happy"
      });
      this.renderSublessonsBar();
      this.hideStartScreen();
      this.hideLevelCompleteModal();
      this.hideExamModal();
      this.isGameStarted = true;
      this.isPaused = false;
      this.updateStats();
      this.updateWordDisplay();
      this.updateBeltUI();
      this.showLessonVideoIntro(numericId, lesson.id, false);
    }
    /**
     * Starts the official level examination.
     * @param {number|string} levelId
     */
    startExam(levelId) {
      const numericId = Math.max(1, Math.min(8, parseInt(levelId, 10) || 1));
      this.currentLevelId = numericId;
      this.currentLevelData = this.pedagogy.getLevel(numericId);
      this.currentLessonId = null;
      this.isExamMode = true;
      const exam = this.pedagogy.getExamForLevel(numericId) || {
        id: `${numericId}.exam`,
        title: `Examen de Nivel ${numericId}`,
        words: [{ text: "f j", icon: "\u{1F3AF}", label: "Examen" }],
        minAccuracy: 85,
        minWPM: 6
      };
      this.levelWords = [...exam.words];
      this.currentWordIndex = 0;
      this.wordsGoal = this.levelWords.length;
      const targetTexts = this.levelWords.map((w) => w.text);
      if (this.interactiveHands) this.interactiveHands.setCurrentLevelId(this.currentLevelId);
      if (this.toyKeyboard) this.toyKeyboard.setCurrentLevelId(this.currentLevelId);
      this.gameEngine.startLevel(this.currentLevelId, targetTexts, {
        isExam: true,
        examConfig: exam
      });
      if (this.dom.levelNumber) this.dom.levelNumber.textContent = `${this.currentLevelId}.E`;
      if (this.dom.levelTitle) this.dom.levelTitle.textContent = `\u{1F4CB} ${exam.title}`;
      if (this.dom.tipIcon) this.dom.tipIcon.textContent = "\u{1F4CB}";
      if (this.dom.mascotLessonTip) this.dom.mascotLessonTip.textContent = `Examen de Maestr\xEDa: Mant\xE9n una precisi\xF3n mayor o igual al ${exam.minAccuracy}%. \xA1T\xFA puedes!`;
      this._manualTipLockTime = Date.now() + 7e3;
      if (this.dom.wordsGoal) this.dom.wordsGoal.textContent = String(this.wordsGoal);
      if (this.dom.wordsCount) this.dom.wordsCount.textContent = "0";
      this.eventBus.emit("MASCOT_SPEAK_REQUEST", {
        text: exam.speech || "\xA1Comienza el examen! Respira y demuestra todo lo que has aprendido.",
        priority: "HIGH",
        emotion: "happy"
      });
      this.renderSublessonsBar();
      this.hideStartScreen();
      this.hideLevelCompleteModal();
      this.hideExamModal();
      this.isGameStarted = true;
      this.isPaused = false;
      this.updateStats();
      this.updateWordDisplay();
      this.updateBeltUI();
    }
    /**
     * Renders the interactive sub-lessons chip navigation bar.
     */
    renderSublessonsBar() {
      if (!this.dom.sublessonsChips || !this.pedagogy || !this.storage) return;
      const levelId = this.currentLevelId || 1;
      const level = this.pedagogy.getLevel(levelId);
      const lessons = this.pedagogy.getLessonsForLevel(levelId);
      const completed = this.storage.getCompletedLessons(levelId);
      const isExamPassed = this.storage.isExamPassed(levelId);
      if (this.dom.sublessonsTitle) {
        this.dom.sublessonsTitle.textContent = `\u{1F4DA} ${level.shortName || level.name}`;
      }
      if (this.dom.sublessonsStatus) {
        const examBadge = isExamPassed ? " \u2022 \u{1F3C5} Aprobado" : "";
        this.dom.sublessonsStatus.textContent = `Completadas: ${completed.length}/${lessons.length}${examBadge}`;
      }
      this.dom.sublessonsChips.innerHTML = "";
      lessons.forEach((les) => {
        const chip = document.createElement("button");
        chip.type = "button";
        const isDone = completed.includes(les.id);
        const isCurrent = !this.isExamMode && this.currentLessonId === les.id;
        chip.className = `sublesson-chip ${isCurrent ? "is-current" : ""} ${isDone ? "is-completed" : ""}`;
        chip.dataset.lessonId = les.id;
        chip.title = `${les.id}: ${les.title}`;
        chip.innerHTML = `${les.id} ${isDone ? "\u2713" : ""}`;
        chip.addEventListener("click", () => {
          this.audio.playButtonClick();
          this.startLesson(levelId, les.id);
        });
        this.dom.sublessonsChips.appendChild(chip);
      });
      const examChip = document.createElement("button");
      examChip.type = "button";
      const isExamReady = completed.length >= lessons.length || completed.length >= 15;
      const isCurrentExam = this.isExamMode;
      examChip.className = `sublesson-chip exam-chip ${isCurrentExam ? "is-current" : ""} ${isExamReady ? "is-ready" : ""} ${isExamPassed ? "is-passed" : ""}`;
      examChip.title = `Examen Oficial de Nivel ${levelId}`;
      examChip.innerHTML = isExamPassed ? `\u{1F3C5} Examen \u2713` : `\u{1F4CB} Examen`;
      examChip.addEventListener("click", () => {
        this.audio.playButtonClick();
        this.startExam(levelId);
      });
      this.dom.sublessonsChips.appendChild(examChip);
    }
    /**
     * Check if the child just finished typing the current word and advance.
     * @private
     */
    _checkWordAdvance() {
      if (!this.gameEngine || !this.levelWords) return;
      let accumulatedChars = 0;
      let computedWordIdx = 0;
      for (let i = 0; i < this.wordsGoal; i++) {
        const wordLen = this.levelWords[i].text.length;
        if (this.gameEngine.targetIndex < accumulatedChars + wordLen) {
          computedWordIdx = i;
          break;
        }
        accumulatedChars += wordLen + 1;
        computedWordIdx = i + 1;
      }
      this.currentWordIndex = Math.min(this.wordsGoal, computedWordIdx);
      if (this.dom.wordsCount) {
        this.dom.wordsCount.textContent = String(this.currentWordIndex);
      }
    }
    /**
     * Renders the active word and visual icon in #target-word and #word-visual-badge.
     */
    updateWordDisplay() {
      if (!this.gameEngine || !this.dom.targetWord) return;
      const fullText = this.gameEngine.levelText;
      const targetIdx = this.gameEngine.targetIndex;
      let accumulated = 0;
      let activeWordObj = this.levelWords[0] || { text: "", icon: "\u{1F3AF}", label: "Escribe" };
      for (let i = 0; i < this.wordsGoal; i++) {
        const w = this.levelWords[i];
        if (!w) break;
        const wLen = w.text.length;
        if (targetIdx < accumulated + wLen + 1) {
          activeWordObj = w;
          break;
        }
        accumulated += wLen + 1;
      }
      if (this.dom.wordVisualIcon && this.dom.wordVisualLabel) {
        this.dom.wordVisualIcon.textContent = activeWordObj.icon || "\u{1F3AF}";
        this.dom.wordVisualLabel.textContent = activeWordObj.label || "\xA1T\xFA puedes!";
        if (this.dom.wordVisualBadge) {
          this.dom.wordVisualBadge.classList.remove("hidden");
        }
      }
      const len = fullText.length;
      this.dom.targetWord.className = "target-word unified-text";
      if (len <= 10) {
        this.dom.targetWord.classList.add("text--short");
      } else if (len <= 28) {
        this.dom.targetWord.classList.add("text--medium");
      } else if (len <= 65) {
        this.dom.targetWord.classList.add("text--long");
      } else if (len <= 130) {
        this.dom.targetWord.classList.add("text--paragraph");
      } else {
        this.dom.targetWord.classList.add("text--story");
      }
      const correctPart = fullText.slice(0, targetIdx);
      const nextChar = fullText[targetIdx] || "";
      const remaining = fullText.slice(targetIdx + 1);
      const escapeHtml = (t) => t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
      const displayNext = nextChar === " " ? "\u2423" : escapeHtml(nextChar);
      this.dom.targetWord.innerHTML = `
      <span class="typed-correct char-done">${escapeHtml(correctPart)}</span><span id="current-target-char" class="typed-next char-current">${displayNext}</span><span class="char-pending">${escapeHtml(remaining)}</span>
    `;
      const targetCharEl = document.getElementById("current-target-char");
      if (targetCharEl && len > 40 && this.dom.targetWord && this.dom.targetWord.scrollHeight > this.dom.targetWord.clientHeight) {
        const charTop = targetCharEl.offsetTop;
        const containerHeight = this.dom.targetWord.clientHeight;
        if (charTop > containerHeight * 0.75) {
          this.dom.targetWord.scrollTop = Math.max(0, charTop - containerHeight / 2);
        }
      }
    }
    /**
     * Updates all header stats (Accuracy, PPM, Errors, Combo).
     */
    updateStats() {
      if (!this.gameEngine) return;
      if (this.dom.accuracy) {
        this.dom.accuracy.textContent = String(this.gameEngine.getAccuracy());
      }
      if (this.dom.errors) {
        this.dom.errors.textContent = String(this.gameEngine.totalKeystrokes - this.gameEngine.correctHits);
      }
      if (this.dom.ppm) {
        this.dom.ppm.textContent = String(this.gameEngine.getPPM());
      }
      if (this.dom.comboCounter && this.dom.comboNumber) {
        this.dom.comboNumber.textContent = String(this.gameEngine.comboCount);
        if (this.gameEngine.comboCount >= 3) {
          this.dom.comboCounter.classList.remove("hidden");
        } else {
          this.dom.comboCounter.classList.add("hidden");
        }
      }
    }
    /**
     * Updates Roby's belt rank tag and start screen rank badge.
     */
    updateBeltUI() {
      if (!this.pedagogy || !this.storage) return;
      const highestUnlocked = this.getHighestUnlockedLevel();
      const totalStars = this.storage.getTotalStars();
      const beltId = this.pedagogy.calculateBelt(highestUnlocked, totalStars);
      const beltTier = PedagogyEngine.BELT_TIERS.find((t) => t.belt === beltId) || PedagogyEngine.BELT_TIERS[0];
      if (this.dom.mascotBeltTag) {
        this.dom.mascotBeltTag.textContent = `${beltTier.emoji} ${beltTier.title}`;
        this.dom.mascotBeltTag.className = `mascot-belt-tag belt-${beltId}`;
      }
      if (this.dom.startRobyRank) {
        this.dom.startRobyRank.textContent = `${beltTier.emoji} ${beltTier.title}`;
      }
    }
    /**
     * Renders the 8 levels map grid with stars, locks, and click listeners.
     */
    renderLevelMap() {
      if (!this.dom.levelsMapGrid || !this.pedagogy || !this.storage) return;
      const totalStars = this.storage.getTotalStars();
      if (this.dom.totalStarsCount) {
        this.dom.totalStarsCount.textContent = String(totalStars);
      }
      this.dom.levelsMapGrid.innerHTML = "";
      const highestUnlocked = this.getHighestUnlockedLevel();
      PedagogyEngine.RICH_LEVELS.forEach((lvl) => {
        const card = document.createElement("div");
        const isUnlocked = lvl.id <= highestUnlocked;
        const starsEarned = this.storage.getLevelStars(lvl.id);
        const completed = this.storage.getCompletedLessons(lvl.id);
        const totalLessons = lvl.lessons && lvl.lessons.length ? lvl.lessons.length : 15;
        const examPassed = this.storage.isExamPassed(lvl.id);
        card.className = `level-map-card ${isUnlocked ? "unlocked" : "locked"} ${lvl.id === this.currentLevelId ? "current-active" : ""}`;
        card.setAttribute("role", "button");
        card.setAttribute("tabindex", isUnlocked ? "0" : "-1");
        let starIcons = "";
        for (let s = 1; s <= 3; s++) {
          starIcons += s <= starsEarned ? "\u2B50" : "\u2606";
        }
        const examStatusText = examPassed ? '<div class="card-exam-badge passed">\u{1F3C5} Examen Aprobado</div>' : completed.length >= totalLessons ? '<div class="card-exam-badge ready">\u{1F4CB} \xA1Examen Disponible!</div>' : `<div class="card-exam-badge locked">\u{1F512} Examen (${completed.length}/${totalLessons})</div>`;
        card.innerHTML = `
        <div class="card-level-num">Nivel ${lvl.id}</div>
        <div class="card-level-icon">${lvl.words && lvl.words[0] ? lvl.words[0].icon : "\u{1F3AF}"}</div>
        <div class="card-level-name">${lvl.shortName || lvl.name}</div>
        <div class="card-lessons-count">\u{1F4DD} ${completed.length}/${totalLessons} Lecciones</div>
        <div class="card-stars-row">${starIcons}</div>
        ${examStatusText}
        ${!isUnlocked ? '<div class="card-lock-badge">\u{1F512} Bloqueado</div>' : ""}
      `;
        if (isUnlocked) {
          card.addEventListener("click", () => {
            this.audio.playButtonClick();
            this.startLevel(lvl.id);
          });
        }
        this.dom.levelsMapGrid.appendChild(card);
      });
    }
    /**
     * Determines the highest unlocked level based on passed examinations.
     * Level N+1 is unlocked only when Exam N is passed (or progress unlocked).
     * @returns {number} 1 to 8
     */
    getHighestUnlockedLevel() {
      if (!this.storage) return 1;
      let unlocked = 1;
      for (let i = 1; i <= 7; i++) {
        if (this.storage.isExamPassed(i)) {
          unlocked = i + 1;
        } else {
          break;
        }
      }
      const stored = this.storage.getUnlockedLevel() || 1;
      return Math.min(8, Math.max(unlocked, stored));
    }
    /**
     * Handle level completed event payload.
     * Dispatches between sub-lesson completion and official exam evaluation.
     * @param {Object} payload { levelId, lessonId, isExam, stars, accuracy, wpm, examResult }
     */
    handleLevelCompleted(payload) {
      this.isGameStarted = false;
      this.audio.playCelebration();
      this._initMascotAndAccessories();
      this.updateBeltUI();
      this.renderLevelMap();
      this.renderSublessonsBar();
      if (payload && payload.isExam) {
        this.showExamResultModal(payload);
        return;
      }
      const stars = payload && typeof payload.stars === "number" ? payload.stars : 1;
      if (this.currentLessonId && this.storage) {
        this.storage.saveLessonCompleted(this.currentLevelId, this.currentLessonId);
        this.storage.saveLessonStars(this.currentLevelId, this.currentLessonId, stars);
        if (this.adventureMap) {
          this.adventureMap.render();
        }
      }
      this.renderSublessonsBar();
      if (this.dom.levelCompleteTitle) {
        this.dom.levelCompleteTitle.textContent = `\xA1Lecci\xF3n Completada! \u{1F31F}`;
      }
      if (this.dom.levelCompleteCount) {
        this.dom.levelCompleteCount.textContent = String(this.wordsGoal);
      }
      if (this.dom.levelCompleteStats) {
        const accuracy = payload && typeof payload.accuracy === "number" ? payload.accuracy : this.gameEngine.getAccuracy();
        const wpm = payload && typeof payload.wpm === "number" ? payload.wpm : this.gameEngine.getWPM();
        this.dom.levelCompleteStats.innerHTML = `
        <div class="stat-pill"><strong>Acierto:</strong> ${accuracy}%</div>
        <div class="stat-pill"><strong>Velocidad:</strong> ${wpm} WPM</div>
        <div class="stat-pill"><strong>Racha:</strong> ${this.gameEngine.maxCombo}</div>
      `;
      }
      if (this.dom.starsRating) {
        const starSpans = this.dom.starsRating.querySelectorAll(".star");
        starSpans.forEach((sp, idx) => {
          sp.textContent = idx < stars ? "\u2B50" : "\u2606";
          sp.className = `star ${idx < stars ? "filled pulse" : "empty"}`;
        });
      }
      const lessons = this.pedagogy.getLessonsForLevel(this.currentLevelId);
      const currIdx = lessons.findIndex((l) => l.id === this.currentLessonId);
      const hasNextLesson = currIdx >= 0 && currIdx + 1 < lessons.length;
      if (this.dom.nextLevelBtn) {
        if (hasNextLesson) {
          this.dom.nextLevelBtn.textContent = `\xA1Siguiente Lecci\xF3n (${lessons[currIdx + 1].id})! \u{1F680}`;
        } else {
          this.dom.nextLevelBtn.textContent = `\xA1Presentarse al Examen de Nivel ${this.currentLevelId}! \u{1F4CB}`;
        }
        this.dom.nextLevelBtn.onclick = () => {
          this.audio.playButtonClick();
          this.advanceToNextLessonOrExam();
        };
      }
      if (this.dom.retryLevelBtn) {
        this.dom.retryLevelBtn.classList.remove("hidden");
        this.dom.retryLevelBtn.onclick = () => {
          this.audio.playButtonClick();
          this.hideLevelCompleteModal();
          this.startLesson(this.currentLevelId, this.currentLessonId);
        };
      }
      if (this.dom.levelCompleteSpeech) {
        this.dom.levelCompleteSpeech.textContent = `"\xA1Buen trabajo con esta lecci\xF3n! \xA1Tus deditos van a toda velocidad!"`;
      }
      if (this.liveScene && this.liveScene.ambientParticleEngine) {
        const cx = typeof window !== "undefined" ? window.innerWidth / 2 : 500;
        const cy = typeof window !== "undefined" ? window.innerHeight * 0.45 : 300;
        this.liveScene.ambientParticleEngine.spawnConfetti(cx, cy, 80);
      }
      if (this.mascotFSM) {
        this.mascotFSM.transitionTo(MascotFSM.STATES.CELEBRATING);
      }
      applySquashAndStretch(this.dom.mascotAvatar, { preset: "happyBounce" });
      setTimeout(() => {
        this.showLevelCompleteModal();
      }, 450);
    }
    /**
     * Advances smoothly to the next sequential micro-lesson or to the level mastery exam.
     */
    advanceToNextLessonOrExam() {
      this.hideLevelCompleteModal();
      const lessons = this.pedagogy.getLessonsForLevel(this.currentLevelId);
      const currIdx = lessons.findIndex((l) => l.id === this.currentLessonId);
      if (currIdx >= 0 && currIdx + 1 < lessons.length) {
        this.startLesson(this.currentLevelId, lessons[currIdx + 1].id);
      } else {
        this.startExam(this.currentLevelId);
      }
    }
    /**
     * Displays the video intro modal for the current lesson.
     * Looks for assets/videos/intro_{levelId}_{subLessonNum}.mp4 or assets/videos/intro_level_{levelId}.mp4.
     * @param {number|string} levelId
     * @param {string} [lessonId]
     * @param {boolean} [isManual=false]
     */
    showLessonVideoIntro(levelId, lessonId, isManual = false) {
      if (!this.dom.videoIntroModal || !this.dom.videoIntroPlayer) return;
      const subNum = lessonId ? String(lessonId).replace(/^.*\./, "") : "1";
      const lessonVideoPath = `assets/videos/intro_${levelId}_${subNum}.mp4`;
      const levelVideoPath = `assets/videos/intro_level_${levelId}.mp4`;
      const lessonData = this.pedagogy.getLesson(levelId, lessonId);
      const titleText = lessonData ? `Lecci\xF3n ${lessonData.id}: ${lessonData.title}` : `Nivel ${levelId}`;
      if (this.dom.videoIntroTitle) {
        this.dom.videoIntroTitle.textContent = titleText;
      }
      const player = this.dom.videoIntroPlayer;
      const placeholder = this.dom.videoPlaceholder;
      player.pause();
      player.removeAttribute("src");
      const tryLoadVideo = (src, onFail) => {
        let resolved = false;
        player.onloadedmetadata = () => {
          if (!resolved) {
            resolved = true;
            player.classList.remove("hidden");
            if (placeholder) placeholder.classList.add("hidden");
            this.dom.videoIntroModal.classList.remove("hidden");
            player.play().catch(() => {
            });
          }
        };
        player.onerror = () => {
          if (!resolved) {
            resolved = true;
            onFail();
          }
        };
        player.src = src;
      };
      tryLoadVideo(lessonVideoPath, () => {
        tryLoadVideo(levelVideoPath, () => {
          if (isManual) {
            player.classList.add("hidden");
            if (placeholder) {
              placeholder.classList.remove("hidden");
              if (this.dom.videoPlaceholderHeading) {
                this.dom.videoPlaceholderHeading.textContent = `V\xEDdeo de la Lecci\xF3n ${lessonId || levelId}`;
              }
              if (this.dom.videoPlaceholderText) {
                this.dom.videoPlaceholderText.innerHTML = `Coloca tu clip de v\xEDdeo en <code>${lessonVideoPath}</code> para reproducirlo aqu\xED.`;
              }
            }
            this.dom.videoIntroModal.classList.remove("hidden");
          } else {
            this.closeLessonVideoIntro();
          }
        });
      });
    }
    /**
     * Closes the video intro modal and starts or resumes gameplay.
     */
    closeLessonVideoIntro() {
      if (this.dom.videoIntroPlayer) {
        this.dom.videoIntroPlayer.pause();
        this.dom.videoIntroPlayer.removeAttribute("src");
      }
      if (this.dom.videoIntroModal) {
        this.dom.videoIntroModal.classList.add("hidden");
      }
      this.isGameStarted = true;
      this.isPaused = false;
      this.updateWordDisplay();
    }
    /**
     * Display the official examination results modal with non-punitive feedback.
     * @param {Object} payload
     */
    showExamResultModal(payload) {
      if (!this.dom.examModal) return;
      const evaluation = this.pedagogy.evaluateExam(this.currentLevelId, payload);
      const passed = evaluation.passed;
      if (this.dom.examBadgeIcon) {
        this.dom.examBadgeIcon.textContent = passed ? "\u{1F3C5}" : "\u{1F4A1}";
      }
      if (this.dom.examModalTitle) {
        this.dom.examModalTitle.textContent = passed ? `\xA1Examen de Nivel ${this.currentLevelId} Aprobado!` : `Examen de Nivel ${this.currentLevelId}`;
      }
      if (this.dom.examModalMessage) {
        this.dom.examModalMessage.textContent = passed ? `\xA1Enhorabuena! Has demostrado maestr\xEDa en este nivel.` : `\xA1Buen esfuerzo! Recuerda que para la medalla se requiere al menos un ${evaluation.requiredAccuracy}% de acierto.`;
      }
      if (this.dom.examModalStats) {
        this.dom.examModalStats.innerHTML = `
        <div class="exam-stat-pill">
          <div class="exam-stat-pill-label">Precisi\xF3n</div>
          <div class="exam-stat-pill-val">${evaluation.accuracy}%</div>
        </div>
        <div class="exam-stat-pill">
          <div class="exam-stat-pill-label">Velocidad</div>
          <div class="exam-stat-pill-val">${evaluation.wpm} WPM</div>
        </div>
        <div class="exam-stat-pill">
          <div class="exam-stat-pill-label">Requerido</div>
          <div class="exam-stat-pill-val">\u2265${evaluation.requiredAccuracy}%</div>
        </div>
      `;
      }
      if (this.dom.examStarsRating) {
        const starSpans = this.dom.examStarsRating.querySelectorAll(".star");
        starSpans.forEach((sp, idx) => {
          sp.textContent = idx < evaluation.stars ? "\u2B50" : "\u2606";
          sp.className = `star ${idx < evaluation.stars ? "filled pulse" : "empty"}`;
        });
      }
      if (this.dom.examModalSpeech) {
        this.dom.examModalSpeech.textContent = `"${evaluation.cheer}"`;
      }
      if (passed) {
        this.storage.saveExamPassed(this.currentLevelId, true);
        const nextLvl = Math.min(8, Number(this.currentLevelId) + 1);
        this.storage.setUnlockedLevel(nextLvl);
        this.updateBeltUI();
        this.renderLevelMap();
        if (this.adventureMap) {
          this.adventureMap.render();
        }
        if (this.currentLevelId === 5 || this.currentLevelId === 8 || evaluation.isGraduation) {
          const studentName = this.storage.getStudentName();
          this.storage.saveCertificate({
            id: `cert-level-${this.currentLevelId}`,
            levelId: this.currentLevelId,
            title: evaluation.diplomaTitle,
            accuracy: evaluation.accuracy,
            wpm: evaluation.wpm,
            stars: this.storage.getTotalStars(),
            studentName,
            date: (/* @__PURE__ */ new Date()).toISOString()
          });
          if (this.dom.examViewDiplomaBtn) {
            this.dom.examViewDiplomaBtn.classList.remove("hidden");
          }
        } else if (this.dom.examViewDiplomaBtn) {
          this.dom.examViewDiplomaBtn.classList.add("hidden");
        }
        if (this.dom.examNextLevelBtn) {
          this.dom.examNextLevelBtn.classList.remove("hidden");
        }
      } else {
        if (this.dom.examNextLevelBtn) {
          this.dom.examNextLevelBtn.classList.add("hidden");
        }
        if (this.dom.examViewDiplomaBtn) {
          this.dom.examViewDiplomaBtn.classList.add("hidden");
        }
      }
      this.dom.examModal.classList.remove("hidden");
      this.voiceQueue.speak({
        text: evaluation.cheer,
        priority: "CRITICAL",
        emotion: passed ? "victory" : "happy"
      });
    }
    /**
     * Hide the examination modal.
     */
    hideExamModal() {
      if (this.dom.examModal) {
        this.dom.examModal.classList.add("hidden");
      }
    }
    /**
     * Show the diploma modal and render high-resolution canvas.
     */
    showDiplomaModal() {
      if (!this.dom.diplomaModal) return;
      if (this.dom.diplomaStudentName) {
        this.dom.diplomaStudentName.value = this.storage ? this.storage.getStudentName() : "Campe\xF3n/a del Teclado";
      }
      this._refreshDiplomaCanvas();
      this.dom.diplomaModal.classList.remove("hidden");
    }
    /**
     * Hide the diploma modal.
     */
    hideDiplomaModal() {
      if (this.dom.diplomaModal) {
        this.dom.diplomaModal.classList.add("hidden");
      }
    }
    /**
     * Re-draw the official diploma onto the modal canvas.
     * @private
     */
    _refreshDiplomaCanvas() {
      if (!this.dom.diplomaCanvas) return;
      const studentName = this.dom.diplomaStudentName?.value?.trim() || (this.storage ? this.storage.getStudentName() : "Campe\xF3n/a del Teclado");
      const unlockedLevel = this.getHighestUnlockedLevel();
      const totalStars = this.storage ? this.storage.getTotalStars() : 15;
      const beltRank = this.pedagogy ? this.pedagogy.calculateBelt(unlockedLevel, totalStars) : "blanco";
      const beltTitle = PedagogyEngine.BELT_TIERS.find((b) => b.belt === beltRank)?.title || "Cintur\xF3n Blanco";
      const title = unlockedLevel >= 8 || this.storage?.isExamPassed(8) ? "T\xEDtulo Superior Oficial de Gran Maestro Mecan\xF3grafo" : "T\xEDtulo Oficial de Mecan\xF3grafo/a de Grado Elemental";
      TypingCertificate.renderToCanvas(this.dom.diplomaCanvas, {
        studentName,
        title,
        beltRank: beltTitle,
        accuracy: Math.max(90, Math.round(this.gameEngine?.getAccuracy() || 95)),
        wpm: Math.max(15, Math.round(this.gameEngine?.getWPM() || 24)),
        stars: totalStars
      });
    }
    /**
     * Handle Mascot FSM state change visual and avatar sprite updates.
     * @param {string} newState
     * @param {string} oldState
     */
    handleMascotStateChange(newState, oldState) {
      if (!this.dom.mascotAvatar) return;
      const sprites = {
        IDLE: "assets/robot_happy.png",
        FLOW_DANCE: "assets/robot_flow_dance.jpg",
        HELPER_POINTING: "assets/robot_thinking.png",
        SLEEPY: "assets/robot_sleeping.png",
        HIGH_FIVE_WAIT: "assets/robot_victory.png",
        CELEBRATING: "assets/robot_victory.png"
      };
      if (sprites[newState]) {
        this.dom.mascotAvatar.src = sprites[newState];
      }
      const stateSuffix = newState.toLowerCase().replace(/_/g, "-");
      const stateClass = `mascot-state-${stateSuffix}`;
      const allStateClasses = [
        "mascot-state-idle",
        "mascot-state-flow-dance",
        "mascot-state-helper-pointing",
        "mascot-state-sleepy",
        "mascot-state-high-five-wait",
        "mascot-state-celebrating",
        "mascot-idle",
        "mascot-flow-dance",
        "mascot-helper-pointing",
        "mascot-sleepy",
        "mascot-high-five-wait",
        "mascot-celebrating"
      ];
      const mascotTargets = [this.dom.mascotAvatar];
      mascotTargets.forEach((el) => {
        if (el && el.classList) {
          allStateClasses.forEach((cls) => el.classList.remove(cls));
          el.classList.add(stateClass);
        }
      });
      if (this.dom.mascotAvatar) {
        applySquashAndStretch(this.dom.mascotAvatar, {
          preset: newState === MascotFSM.STATES.FLOW_DANCE || newState === MascotFSM.STATES.CELEBRATING ? "happyBounce" : "gentlePulse"
        });
      }
      if (this.dom.mascotBadge) {
        switch (newState) {
          case MascotFSM.STATES.FLOW_DANCE:
            this.dom.mascotBadge.textContent = "Roby \u{1F525} \xA1En Racha!";
            this.dom.mascotBadge.className = "mascot-badge badge-combo";
            break;
          case MascotFSM.STATES.HELPER_POINTING:
            this.dom.mascotBadge.textContent = "Roby \u{1F4A1} \xA1Consejo!";
            this.dom.mascotBadge.className = "mascot-badge badge-tip";
            break;
          case MascotFSM.STATES.SLEEPY:
            this.dom.mascotBadge.textContent = "Roby \u{1F4A4} Zzz...";
            this.dom.mascotBadge.className = "mascot-badge badge-sleeping";
            break;
          case MascotFSM.STATES.HIGH_FIVE_WAIT:
            this.dom.mascotBadge.textContent = "Roby \u270B \xA1Choca esos 5!";
            this.dom.mascotBadge.className = "mascot-badge badge-victory";
            break;
          case MascotFSM.STATES.CELEBRATING:
            this.dom.mascotBadge.textContent = "Roby \u{1F3C6} \xA1Genial!";
            this.dom.mascotBadge.className = "mascot-badge badge-victory";
            break;
          case MascotFSM.STATES.IDLE:
          default:
            this.dom.mascotBadge.textContent = "Roby \u{1F916}";
            this.dom.mascotBadge.className = "mascot-badge badge-happy";
            break;
        }
      }
    }
    /**
     * Mascot Avatar click interaction.
     */
    handleMascotClick() {
      this.audio.playButtonClick();
      applySquashAndStretch(this.dom.mascotAvatar, { preset: "happyBounce" });
      if (this.voiceQueue) {
        if (this.voiceQueue._volume <= 0) this.voiceQueue.setVolume(0.85);
        if (this.voiceQueue._muted) this.voiceQueue.setMuted(false);
      }
      if (this.voiceEngine) {
        if (this.voiceEngine._volume <= 0) this.voiceEngine.setVolume(0.85);
        if (this.voiceEngine._muted) this.voiceEngine.setMuted(false);
      }
      if (this.dom.voiceMuteBtn) {
        this.dom.voiceMuteBtn.textContent = "\u{1F50A}";
        this.dom.voiceMuteBtn.title = "Silenciar voz";
      }
      const phrase = getRandomGreeting();
      this.eventBus.emit("MASCOT_SPEAK_REQUEST", {
        text: phrase,
        priority: "CRITICAL",
        emotion: "happy"
      });
    }
    /**
     * Update the lesson tip bar in real time with the active key and assigned finger.
     * @param {Object} payload { key, keyName, finger, fingerName, handName, colorName }
     * @private
     */
    _updateTargetKeyTip(payload) {
      if (!payload || !this.dom.mascotLessonTip) return;
      if (this._manualTipLockTime && Date.now() < this._manualTipLockTime) {
        return;
      }
      const keyName = payload.keyName || (payload.key === " " ? "Espacio" : (payload.key || "").toUpperCase());
      const fingerName = payload.fingerName || "el dedo asignado";
      const colorName = payload.colorName ? ` (${payload.colorName})` : "";
      const handName = payload.handName ? ` de tu ${payload.handName}` : "";
      if (this.dom.tipIcon) this.dom.tipIcon.textContent = "\u{1F3AF}";
      this.dom.mascotLessonTip.textContent = `Pulsa [${keyName}] con el ${fingerName}${colorName}${handName}.`;
    }
    /**
     * Updates mascot speech bubble to guide player to the next target key.
     * @param {Object} payload { key, keyName, finger, fingerName, handName }
     * @private
     */
    _updateMascotSpeechBubbleForTarget(payload) {
      if (!payload || !this.dom.mascotSpeechText || !payload.key) return;
      const keyName = payload.keyName || (payload.key === " " ? "Espacio" : (payload.key || "").toUpperCase());
      const fingerName = payload.fingerName || "el dedo asignado";
      const handName = payload.handName ? ` de tu ${payload.handName}` : "";
      this.dom.mascotSpeechText.innerHTML = formatDialogueText(`\xA1Bien! Siguiente tecla: [${keyName}] con tu ${fingerName}${handName}.`);
    }
    /**
     * Updates cockpit ambient backlight halo color according to active finger.
     * @param {string} key
     * @private
     */
    _updateAmbientBacklight(key) {
      if (typeof document === "undefined") return;
      const backlight = document.getElementById("cockpit-ambient-backlight");
      if (!backlight) return;
      let color = "#81C995";
      const k = String(key || "").toLowerCase();
      if ("qaz1".includes(k) || "p\xF1-0".includes(k)) {
        color = "#F538A0";
      } else if ("wsx2".includes(k) || "ol.9".includes(k)) {
        color = "#FA903E";
      } else if ("edc3".includes(k) || "ik,8".includes(k)) {
        color = "#FCC934";
      } else if ("rfvtgb45".includes(k)) {
        color = "#81C995";
      } else if ("yhnujm67".includes(k)) {
        color = "#12B5CB";
      } else if (k === " ") {
        color = "#1A73E8";
      }
      backlight.style.setProperty("--active-finger-color", color);
    }
    /**
     * Cycle lesson tips bar with typing teacher pedagogical guidance.
     * @param {boolean} speakIt
     */
    cycleTip(speakIt = false) {
      this.audio.playButtonClick();
      this._manualTipLockTime = Date.now() + 12e3;
      const tipObj = getNextPedagogicalTip();
      if (this.dom.tipIcon && tipObj.icon) {
        this.dom.tipIcon.textContent = tipObj.icon;
      }
      if (this.dom.mascotLessonTip) {
        this.dom.mascotLessonTip.textContent = tipObj.text;
        this.dom.mascotLessonTip.classList.remove("tip-flash");
        void this.dom.mascotLessonTip.offsetWidth;
        this.dom.mascotLessonTip.classList.add("tip-flash");
      }
      if (speakIt && this.voiceQueue) {
        const speech = tipObj.speechText || tipObj.text;
        this.voiceQueue.speak({ text: speech, priority: "NORMAL", emotion: "thinking" });
      }
    }
    /**
     * Toggle text zoom scale for accessibility across 3 distinct scales.
     */
    toggleTextZoom() {
      const scales = [
        { id: "", label: "\u{1F50D} Aa", mult: "1", title: "Tama\xF1o est\xE1ndar (1.0x)" },
        { id: "grande", label: "\u{1F50D} Aa+", mult: "1.50", title: "Tama\xF1o grande (1.5x)" },
        { id: "extra", label: "\u{1F50D} Aa++", mult: "2.00", title: "Tama\xF1o gigante (2.0x)" }
      ];
      const current = document.body.dataset.textScale || "";
      const currentIdx = scales.findIndex((s) => s.id === current);
      const nextIdx = (currentIdx + 1) % scales.length;
      const next = scales[nextIdx];
      if (next.id) {
        document.body.dataset.textScale = next.id;
        document.documentElement.dataset.textScale = next.id;
        document.documentElement.style.setProperty("--text-scale", next.mult);
      } else {
        delete document.body.dataset.textScale;
        delete document.documentElement.dataset.textScale;
        document.documentElement.style.setProperty("--text-scale", "1");
      }
      if (this.dom.targetWord) {
        this.dom.targetWord.style.setProperty("--text-scale", next.mult);
      }
      if (this.dom.wordPanel) {
        this.dom.wordPanel.style.setProperty("--text-scale", next.mult);
      }
      if (this.dom.zoomBtn) {
        this.dom.zoomBtn.textContent = next.label;
        this.dom.zoomBtn.title = `Tama\xF1o de texto: ${next.label} - ${next.title} (Clic para cambiar)`;
      }
      try {
        localStorage.setItem("mecano_text_zoom", next.id);
      } catch (e) {
      }
      this.updateWordDisplay();
    }
    /**
     * Populates the header voice selector with ranked neural/natural voices.
     * @private
     */
    _populateVoiceSelector() {
      if (!this.dom.voiceSelect || !this.voiceEngine) return;
      const voices = this.voiceEngine.getAvailableVoices();
      this.dom.voiceSelect.innerHTML = "";
      if (voices.length === 0) {
        const opt = document.createElement("option");
        opt.value = "";
        opt.textContent = "\u2728 \xC1lvaro (Neuronal HD)";
        this.dom.voiceSelect.appendChild(opt);
        return;
      }
      voices.forEach((v, idx) => {
        const opt = document.createElement("option");
        opt.value = v.id;
        opt.textContent = `${v.isNatural ? "\u2728 " : ""}${v.name}`;
        if (idx === 0) opt.selected = true;
        this.dom.voiceSelect.appendChild(opt);
      });
    }
    // --- Modal Helpers ---
    showStartScreen() {
      if (this.dom.startScreen) {
        this.renderLevelMap();
        this.updateBeltUI();
        this.dom.startScreen.classList.remove("hidden");
      }
    }
    hideStartScreen() {
      if (this.dom.startScreen) {
        this.dom.startScreen.classList.add("hidden");
      }
    }
    showLevelCompleteModal() {
      if (this.dom.levelComplete) {
        this.dom.levelComplete.classList.remove("hidden");
        applySquashAndStretch(this.dom.levelComplete.querySelector(".level-complete-box"), {
          preset: "happyBounce"
        });
      }
    }
    hideLevelCompleteModal() {
      if (this.dom.levelComplete) {
        this.dom.levelComplete.classList.add("hidden");
      }
    }
  };
  var app = new MecanoApp();
  if (typeof window !== "undefined") {
    window.app = app;
    window.MecanoApp = MecanoApp;
    if (typeof document !== "undefined") {
      if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", () => app.init());
      } else {
        app.init();
      }
    }
  }
})();
