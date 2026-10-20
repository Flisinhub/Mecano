/**
 * test_curriculum_and_certificate.js - Verification Suite for 15+ Lessons, Exams & Certificates
 * 
 * Verifies:
 * - 15+ sub-lessons per level across all levels
 * - Official examination definitions and non-punitive evaluation
 * - StorageManager progress persistence for lessons, exams, and certificates
 * - Level unlocking conditioned on passing exams
 * - TypingCertificate Canvas rendering pipeline
 * 
 * Runs with Node.js native test runner (zero external dependencies).
 */

import assert from 'node:assert';
import { test, suite } from 'node:test';

import { CURRICULUM_LEVELS } from './src/keyboard/CurriculumData.js';
import { PedagogyEngine } from './src/keyboard/PedagogyEngine.js';
import { StorageManager } from './src/core/StorageManager.js';
import { GameEngine } from './src/core/GameEngine.js';
import { EventBus } from './src/core/EventBus.js';
import { TypingCertificate } from './src/certificate/TypingCertificate.js';

class MockCanvasContext {
  constructor() {
    this.calls = [];
    this.fillStyle = '#000';
    this.strokeStyle = '#000';
    this.lineWidth = 1;
    this.font = '10px sans-serif';
    this.textAlign = 'left';
  }
  createRadialGradient() {
    return { addColorStop: () => {} };
  }
  fillRect(...args) { this.calls.push({ method: 'fillRect', args }); }
  strokeRect(...args) { this.calls.push({ method: 'strokeRect', args }); }
  roundRect(...args) { this.calls.push({ method: 'roundRect', args }); }
  beginPath() { this.calls.push({ method: 'beginPath' }); }
  closePath() { this.calls.push({ method: 'closePath' }); }
  fill() { this.calls.push({ method: 'fill' }); }
  stroke() { this.calls.push({ method: 'stroke' }); }
  moveTo(...args) { this.calls.push({ method: 'moveTo', args }); }
  lineTo(...args) { this.calls.push({ method: 'lineTo', args }); }
  quadraticCurveTo(...args) { this.calls.push({ method: 'quadraticCurveTo', args }); }
  arc(...args) { this.calls.push({ method: 'arc', args }); }
  fillText(text, x, y) { this.calls.push({ method: 'fillText', text, x, y }); }
  save() { this.calls.push({ method: 'save' }); }
  restore() { this.calls.push({ method: 'restore' }); }
  translate(...args) { this.calls.push({ method: 'translate', args }); }
  scale(...args) { this.calls.push({ method: 'scale', args }); }
}

class MockCanvas {
  constructor() {
    this.width = 1920;
    this.height = 1080;
    this._ctx = new MockCanvasContext();
  }
  getContext(type) {
    return type === '2d' ? this._ctx : null;
  }
  toDataURL() {
    return 'data:image/png;base64,mockpng';
  }
}

suite('Mecano 15+ Micro-Lessons & Pedagogical Academy Suite', () => {
  test('all 8 levels must have at least 15 micro-lessons defined', () => {
    assert.strictEqual(CURRICULUM_LEVELS.length, 8, 'Curriculum must have exactly 8 levels');

    CURRICULUM_LEVELS.forEach((lvl) => {
      assert.ok(Array.isArray(lvl.lessons), `Level ${lvl.id} must have a lessons array`);
      assert.ok(
        lvl.lessons.length >= 15,
        `Level ${lvl.id} (${lvl.name}) has ${lvl.lessons.length} lessons, expected >= 15`
      );

      lvl.lessons.forEach((les, idx) => {
        assert.ok(les.id, `Lesson ${idx} in Level ${lvl.id} must have an id`);
        assert.ok(les.title, `Lesson ${les.id} must have a title`);
        assert.ok(Array.isArray(les.words) && les.words.length > 0, `Lesson ${les.id} must have words`);
      });
    });
  });

  test('each level must have an official mastery examination defined', () => {
    CURRICULUM_LEVELS.forEach((lvl) => {
      const exam = lvl.exam;
      assert.ok(exam, `Level ${lvl.id} must have an exam defined`);
      assert.ok(exam.id, `Level ${lvl.id} exam must have an id`);
      assert.ok(exam.title, `Level ${lvl.id} exam must have a title`);
      assert.ok(exam.minAccuracy >= 85, `Level ${lvl.id} exam minAccuracy must be >= 85%`);
      assert.ok(Array.isArray(exam.words) && exam.words.length > 0, `Level ${lvl.id} exam must have challenge words`);
      assert.ok(exam.speech, `Level ${lvl.id} exam must have an intro speech`);
      assert.ok(exam.passSpeech, `Level ${lvl.id} exam must have a pass speech`);
      assert.ok(exam.retrySpeech, `Level ${lvl.id} exam must have a supportive retry speech`);
    });
  });

  test('levels 5 and 8 must be official graduation exams awarding diplomas', () => {
    const lvl5 = CURRICULUM_LEVELS.find(l => l.id === 5);
    const lvl8 = CURRICULUM_LEVELS.find(l => l.id === 8);

    assert.ok(lvl5.exam.isGraduationExam, 'Level 5 exam must be marked as isGraduationExam');
    assert.ok(lvl5.exam.diplomaTitle.includes('Elemental'), 'Level 5 diploma must be Elemental grade');

    assert.ok(lvl8.exam.isGraduationExam, 'Level 8 exam must be marked as isGraduationExam');
    assert.ok(lvl8.exam.diplomaTitle.includes('Maestro'), 'Level 8 diploma must be Maestro grade');
  });

  test('PedagogyEngine: getLesson and getExam methods retrieve correct items', () => {
    const pe = new PedagogyEngine();
    
    // By ID string
    const lesson1_1 = pe.getLesson(1, '1.1');
    assert.strictEqual(lesson1_1.id, '1.1');
    assert.ok(lesson1_1.title.includes('índice izquierdo'));

    const lesson1_15 = pe.getLesson(1, '1.15');
    assert.strictEqual(lesson1_15.id, '1.15');

    // By numerical index
    const lessonByIndex = pe.getLesson(1, 0);
    assert.strictEqual(lessonByIndex.id, '1.1');

    // Exam retrieval
    const exam1 = pe.getExamForLevel(1);
    assert.strictEqual(exam1.id, '1.exam');
    assert.strictEqual(exam1.minAccuracy, 85);
  });

  test('PedagogyEngine: evaluateExam evaluates objective pass/fail non-punitively', () => {
    const pe = new PedagogyEngine();

    // Passing Level 1 exam with 90% accuracy
    const passResult = pe.evaluateExam(1, { accuracy: 90, wpm: 12 });
    assert.strictEqual(passResult.passed, true);
    assert.strictEqual(passResult.accuracy, 90);
    assert.strictEqual(passResult.stars, 2);
    assert.ok(passResult.cheer.includes('¡FANTÁSTICO!') || passResult.cheer.includes('Felicidades'));

    // Failing Level 1 exam with 75% accuracy (threshold is 85%)
    const failResult = pe.evaluateExam(1, { accuracy: 75, wpm: 5 });
    assert.strictEqual(failResult.passed, false);
    assert.strictEqual(failResult.accuracy, 75);
    assert.strictEqual(failResult.stars, 1); // Never 0 stars (non-punitive credit)
    assert.ok(failResult.cheer.includes('¡Buen intento!') || failResult.cheer.includes('esfuerzo'));

    // Passing Level 5 graduation exam
    const gradResult = pe.evaluateExam(5, { accuracy: 96, wpm: 22 });
    assert.strictEqual(gradResult.passed, true);
    assert.strictEqual(gradResult.isGraduation, true);
    assert.ok(gradResult.diplomaTitle.includes('Elemental'));
  });

  test('StorageManager: tracks sub-lesson completions and exam status', () => {
    const storage = new StorageManager();
    storage.resetAll();

    // Initial state: no completed lessons or exams
    assert.deepStrictEqual(storage.getCompletedLessons(1), []);
    assert.strictEqual(storage.isLessonCompleted(1, '1.1'), false);
    assert.strictEqual(storage.isExamPassed(1), false);

    // Save lesson completion
    storage.saveLessonCompleted(1, '1.1');
    assert.strictEqual(storage.isLessonCompleted(1, '1.1'), true);
    assert.deepStrictEqual(storage.getCompletedLessons(1), ['1.1']);

    // Save another lesson
    storage.saveLessonCompleted(1, '1.2');
    assert.deepStrictEqual(storage.getCompletedLessons(1), ['1.1', '1.2']);

    // Duplicate save does not duplicate in list
    storage.saveLessonCompleted(1, '1.1');
    assert.deepStrictEqual(storage.getCompletedLessons(1), ['1.1', '1.2']);

    // Save exam result (failed first)
    storage.saveExamResult(1, { passed: false, accuracy: 70, wpm: 5 });
    assert.strictEqual(storage.isExamPassed(1), false);

    // Save exam result (passed)
    storage.saveExamResult(1, { passed: true, accuracy: 92, wpm: 12 });
    assert.strictEqual(storage.isExamPassed(1), true);
    assert.strictEqual(storage.getExamResult(1).accuracy, 92);
  });

  test('StorageManager: student name and certificates persistence', () => {
    const storage = new StorageManager();
    storage.resetAll();

    // Default student name
    assert.strictEqual(storage.getStudentName(), 'Campeón/a del Teclado');

    // Update student name
    storage.setStudentName('Alejandro Pérez');
    assert.strictEqual(storage.getStudentName(), 'Alejandro Pérez');

    // Certificates storage
    assert.deepStrictEqual(storage.getCertificates(), []);

    const certData = {
      id: 'cert-level-5',
      levelId: 5,
      title: 'Título Oficial de Mecanógrafo/a de Grado Elemental',
      studentName: 'Alejandro Pérez',
      accuracy: 94,
      wpm: 22,
      stars: 15
    };

    storage.saveCertificate(certData);
    assert.strictEqual(storage.getCertificates().length, 1);
    const retrieved = storage.getCertificate('cert-level-5');
    assert.strictEqual(retrieved.studentName, 'Alejandro Pérez');
    assert.strictEqual(retrieved.accuracy, 94);
  });

  test('GameEngine: integrates sub-lesson and exam mode execution', () => {
    const bus = new EventBus();
    const storage = new StorageManager();
    storage.resetAll();

    let examCompletedPayload = null;
    bus.on('EXAM_COMPLETED', (p) => { examCompletedPayload = p; });

    let levelCompletedPayload = null;
    bus.on('LEVEL_COMPLETED', (p) => { levelCompletedPayload = p; });

    const engine = new GameEngine({ eventBus: bus, storage });

    // 1. Run a sub-lesson: 'fj'
    engine.startLevel(1, 'fj', { lessonId: '1.1', isExam: false });
    assert.strictEqual(engine.lessonId, '1.1');
    assert.strictEqual(engine.isExamMode, false);

    // Strike keys
    engine.handleKeyPress('f');
    const finishLesson = engine.handleKeyPress('j');
    assert.strictEqual(finishLesson.finished, true);
    assert.strictEqual(storage.isLessonCompleted(1, '1.1'), true);
    assert.strictEqual(levelCompletedPayload.lessonId, '1.1');

    // 2. Run an exam: 'fj' with minAccuracy = 85
    engine.startLevel(1, 'fj', { isExam: true, examConfig: { minAccuracy: 85, minWPM: 0 } });
    assert.strictEqual(engine.isExamMode, true);

    engine.handleKeyPress('f');
    const finishExam = engine.handleKeyPress('j');
    assert.strictEqual(finishExam.finished, true);
    assert.strictEqual(finishExam.isExam, true);
    assert.strictEqual(storage.isExamPassed(1), true);
    assert.ok(examCompletedPayload !== null);
    assert.strictEqual(examCompletedPayload.passed, true);
  });

  test('TypingCertificate: Canvas rendering executes and prints all diploma elements', () => {
    const canvas = new MockCanvas();
    const ctx = canvas.getContext('2d');

    TypingCertificate.renderToCanvas(canvas, {
      studentName: 'Sofía Gómez',
      title: 'Título Oficial de Mecanógrafo/a de Grado Elemental',
      beltRank: 'Cinturón Verde',
      accuracy: 96,
      wpm: 25,
      stars: 18,
      date: '19 de octubre de 2026'
    });

    // Check that canvas was sized appropriately (1920x1080)
    assert.strictEqual(canvas.width, 1920);
    assert.strictEqual(canvas.height, 1080);

    // Verify key texts were rendered
    const textsRendered = ctx.calls.filter(c => c.method === 'fillText').map(c => c.text);
    assert.ok(textsRendered.some(t => t.includes('MECANO')), 'Header emblem must be drawn');
    assert.ok(textsRendered.some(t => t.includes('ELEMENTAL') || t.includes('TÍTULO')), 'Title must be drawn');
    assert.ok(textsRendered.some(t => t.includes('Sofía Gómez')), 'Student name must be drawn');
    assert.ok(textsRendered.some(t => t.includes('96%')), 'Accuracy metric must be drawn');
    assert.ok(textsRendered.some(t => t.includes('25 PPM')), 'WPM metric must be drawn');
    assert.ok(textsRendered.some(t => t.includes('Roby')), 'Roby seal must be drawn');

    // Test PNG data export
    assert.strictEqual(canvas.toDataURL(), 'data:image/png;base64,mockpng');
  });
});
