/**
 * PedagogyEngine.js - Non-Punitive 8-Level Micro-Curriculum & Anti-Frustration System
 * 
 * Fulfills Requirement R4, R6 and PROJECT.md specifications:
 * - 8-level structured micro-curriculum with 15+ micro-lessons per level based on CurriculumData.js
 * - Mandatory Level Mastery Examinations with objective thresholds (≥85%-90% accuracy)
 * - Official Typing Certificate milestones (Junior in Level 5, Grand Master in Level 8)
 * - Non-punitive grading formula: minimum 1 star, never 0, zero lives/game-over screens
 * - Belt rank progression: White -> Yellow -> Green -> Black & Crown
 * - Motor hesitation error filter (<400ms duplicate error guard)
 * - Celebratory milestone achievements
 */

import { CURRICULUM_LEVELS } from './CurriculumData.js';

export class PedagogyEngine {
  /**
   * Authoritative belt progression requirements
   */
  static BELT_TIERS = [
    { belt: 'blanco', minLevel: 1, minStars: 0, title: 'Cinturón Blanco', emoji: '🥋⚪' },
    { belt: 'amarillo', minLevel: 3, minStars: 5, title: 'Cinturón Amarillo', emoji: '🥋🟡' },
    { belt: 'verde', minLevel: 5, minStars: 11, title: 'Cinturón Verde', emoji: '🥋🟢' },
    { belt: 'negro', minLevel: 7, minStars: 18, title: 'Cinturón Negro & Corona', emoji: '🥋⚫👑' }
  ];

  /**
   * Canonical 8-level micro-curriculum specification (tested by test_harness.js)
   */
  static CURRICULUM = [
    { id: 1, name: 'Los Índices en Casa (F y J)', keys: ['f', 'j', ' '] },
    { id: 2, name: 'La Fila Guía Básica', keys: ['a', 's', 'd', 'f', 'j', 'k', 'l', 'ñ'] },
    { id: 3, name: 'Vocales Superiores (E, I)', keys: ['e', 'i'] },
    { id: 4, name: 'Expansión de Vocales y Consonantes', keys: ['o', 'u', 'c', 'm', 'p', 't'] },
    { id: 5, name: 'Frases Cortas y Barra Espaciadora', keys: [' '] },
    { id: 6, name: 'Cuentos y Aventuras (Tildes)', keys: ['´', 'á', 'é', 'í', 'ó', 'ú'] },
    { id: 7, name: 'Mayúsculas y Puntuación', keys: ['Shift', '!', '?'] },
    { id: 8, name: 'Desafío Galáctico', keys: ['\n'] }
  ];

  /**
   * Complete rich pedagogical levels database (from CurriculumData.js with flattened fallback words)
   */
  static RICH_LEVELS = CURRICULUM_LEVELS.map(lvl => {
    const flattenedWords = Array.isArray(lvl.lessons)
      ? lvl.lessons.flatMap(lesson => lesson.words || [])
      : (lvl.words || []);
    return {
      ...lvl,
      words: flattenedWords
    };
  });

  constructor() {
    this._richLevels = PedagogyEngine.RICH_LEVELS;
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
    const acc = typeof accuracy === 'number' ? accuracy : 0;
    if (acc >= 95) return 3;
    if (acc >= 90) return 2;
    return 1; // Non-punitive minimum
  }

  /**
   * Calculates belt promotion based on unlocked level number and total stars
   * 
   * @param {number} unlockedLevel - Highest unlocked level (1..8)
   * @param {number} totalStars - Sum of stars accumulated
   * @returns {string} Belt ID ('blanco', 'amarillo', 'verde', 'negro')
   */
  calculateBelt(unlockedLevel, totalStars) {
    let currentBelt = 'blanco';
    const level = Number(unlockedLevel) || 1;
    const stars = Number(totalStars) || 0;

    for (const tier of PedagogyEngine.BELT_TIERS) {
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
      const match = this._richLevels.find(l => l.id === numericId);
      if (match) return match;
    }

    const slugMatch = this._richLevels.find(l => l.slug === String(levelId));
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
    return (level && Array.isArray(level.lessons)) ? level.lessons : [];
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

    if (typeof lessonIdOrIndex === 'string') {
      const match = lessons.find(l => l.id === lessonIdOrIndex);
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
    return (level && level.exam) ? level.exam : null;
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
    const totalLessons = (level && Array.isArray(level.lessons)) ? level.lessons.length : 15;
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
    const passed = (accuracy >= requiredAccuracy) && (wpm >= requiredWPM);
    const stars = this.calculateStars(accuracy);
    const isGraduation = Boolean(exam.isGraduationExam);
    const diplomaTitle = exam.diplomaTitle || (level.id === 5 ? 'Título Oficial de Mecanógrafo/a de Grado Elemental' : (level.id === 8 ? 'Título Superior de Gran Maestro Mecanógrafo' : ''));

    let cheer = '';
    if (passed) {
      if (isGraduation) {
        cheer = `¡GLORIOSO! ¡Has aprobado el Examen Oficial de Graduación! ¡Tu ${diplomaTitle} está listo para ser impreso!`;
      } else {
        cheer = exam.passSpeech || `¡Felicidades! Has aprobado el examen con un ${accuracy}% de precisión. ¡Nivel superado!`;
      }
    } else {
      cheer = exam.retrySpeech || `¡Buen intento! Has logrado un ${accuracy}% de precisión. Para la medalla necesitamos un ${requiredAccuracy}%. ¡Repasa un poco o inténtalo de nuevo!`;
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
    const nextUnlockedLevel = Math.max(session.unlockedLevel || 1, (level.id < 8 ? level.id + 1 : 8));
    const newBelt = this.calculateBelt(nextUnlockedLevel, totalStars);
    const isNewBelt = newBelt !== (session.currentBelt || 'blanco');

    let cheer = '¡Sensacional trabajo! ¡Has completado la lección!';
    if (stars === 3) cheer = '¡Impresionante! ¡3 estrellas doradas de maestría!';
    else if (stars === 2) cheer = '¡Muy bien hecho! ¡Tus deditos van a toda velocidad!';

    return {
      levelId: level.id,
      stars,
      accuracy,
      wpm,
      passed: true, // Non-punitive: always passes upon finishing words
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
}

export default PedagogyEngine;
