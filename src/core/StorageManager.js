/**
 * StorageManager.js - Resilient Persistence System for Mecano
 * 
 * Provides unified storage for level stars, unlocked/equipped accessories,
 * error heatmap per letter, and settings.
 * Seamlessly falls back to an in-memory store in headless Node.js environments
 * or when localStorage is inaccessible.
 * Fulfills Requirement R1 and PROJECT.md specifications.
 */

const STORAGE_KEYS = {
  STARS: 'mecano_stars',
  ACCESSORIES: 'mecano_accessories',
  HEATMAP: 'mecano_error_heatmap',
  SETTINGS: 'mecano_settings',
  PROGRESS: 'mecano_progress',
  LESSONS: 'mecano_lessons_progress',
  EXAMS: 'mecano_exams_progress',
  STUDENT_NAME: 'mecano_student_name',
  CERTIFICATES: 'mecano_certificates'
};

const DEFAULT_STATE = Object.freeze({
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
    font: 'default',
    contrast: 'normal',
    volumes: {
      music: 0.7,
      sfx: 0.85,
      voice: 1.0
    }
  },
  progress: {
    unlockedLevel: 1,
    currentBelt: 'blanco'
  },
  lessons: {},
  exams: {},
  studentName: 'Campeón/a del Teclado',
  certificates: []
});

class MemoryStorage {
  constructor() {
    this._store = new Map();
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
}

export class StorageManager {
  /**
   * @param {Object} [options]
   * @param {Object} [options.storage] Custom storage implementation (defaults to localStorage with fallback)
   */
  constructor(options = {}) {
    this._backend = options.storage || this._detectStorageBackend();
    this._isMemory = !(typeof window !== 'undefined' && window.localStorage && this._backend === window.localStorage);
  }

  /**
   * Detect and test availability of localStorage, falling back to MemoryStorage.
   * @private
   */
  _detectStorageBackend() {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const testKey = '__mecano_storage_test__';
        window.localStorage.setItem(testKey, '1');
        window.localStorage.removeItem(testKey);
        return window.localStorage;
      }
    } catch {
      // In private browsing or sandboxed iframe, localStorage may throw
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
      if (raw === null || raw === undefined) {
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
    if (!letter || typeof letter !== 'string') return 0;
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
    return Object.entries(heatmap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([k]) => k);
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
    if (!accessoryId || typeof accessoryId !== 'string') return false;
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
    if (!slot || typeof slot !== 'string') return false;
    const acc = this.getAccessories();
    if (!acc.equipped) {
      acc.equipped = { hat: null, glasses: null, crown: null };
    }

    if (accessoryId === null || accessoryId === '') {
      acc.equipped[slot] = null;
      this._writeJson(STORAGE_KEYS.ACCESSORIES, acc);
      return true;
    }

    // Auto-unlock if equipping a valid accessory
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
    return prog.currentBelt || 'blanco';
  }

  /**
   * Update current martial arts belt rank.
   * @param {string} belt
   */
  setBelt(belt) {
    if (!belt || typeof belt !== 'string') return;
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
        ...(partialSettings.volumes || {})
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
    
    // Maintain highest accuracy & passed status
    const passed = Boolean(examResult.passed || existing.passed);
    const accuracy = Math.max(existing.accuracy || 0, Math.round(Number(examResult.accuracy) || 0));
    const wpm = Math.max(existing.wpm || 0, Math.round(Number(examResult.wpm) || 0));
    const stars = Math.max(existing.stars || 0, Math.round(Number(examResult.stars) || 0));
    const date = examResult.date || existing.date || new Date().toISOString();

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
      return (raw && raw.trim()) ? raw.trim() : DEFAULT_STATE.studentName;
    } catch {
      return DEFAULT_STATE.studentName;
    }
  }

  /**
   * Save student name for certificates.
   * @param {string} name
   */
  setStudentName(name) {
    const cleanName = (typeof name === 'string' && name.trim()) ? name.trim() : DEFAULT_STATE.studentName;
    try {
      this._backend.setItem(STORAGE_KEYS.STUDENT_NAME, cleanName);
    } catch {}
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
    const existingIdx = certs.findIndex(c => c.id === cert.id);
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
    return certs.find(c => c.id === certId) || null;
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
    } catch {}
  }

  /**
   * Alias for resetAll.
   */
  clear() {
    this.resetAll();
  }
}

export const globalStorage = new StorageManager();
export default globalStorage;
