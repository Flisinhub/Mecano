/**
 * test_edge_cases.js - Comprehensive Adversarial Stress & Edge Case Harness for Mecano
 * 
 * Verifies the 6 mandatory adversarial edge cases:
 * 1. Rapid repeat error suppression (<400ms motor hesitation filter in GameEngine/PedagogyEngine)
 * 2. Zero keystrokes accuracy calculation
 * 3. Spacebar reaction in HIGH_FIVE_WAIT state
 * 4. StorageManager corruption resilience (malformed / truncated JSON auto-recovery)
 * 5. VoiceQueue typing rate throttle (>25 PPM verbose speech drop vs short interjections)
 * 6. Pentatonic scale index wrap-around (> 10 combo count bounds & NaN protection)
 */

import assert from 'node:assert/strict';
import { EventBus, EVENTS } from './src/core/EventBus.js';
import { StorageManager } from './src/core/StorageManager.js';
import { GameEngine } from './src/core/GameEngine.js';
import { MascotFSM } from './src/mascot/MascotFSM.js';
import { PedagogyEngine } from './src/keyboard/PedagogyEngine.js';
import { ProceduralAudio, PENTATONIC_SCALE } from './src/audio/ProceduralAudio.js';
import { VoiceQueue, VOICE_PRIORITIES, SHORT_INTERJECTIONS } from './src/audio/VoiceQueue.js';

let passedTotal = 0;
let failedTotal = 0;

function runTest(suite, name, fn) {
  try {
    fn();
    console.log(`  ✔ [${suite}] ${name}`);
    passedTotal++;
  } catch (err) {
    console.error(`  ✖ [${suite}] ${name}`);
    console.error(`    Error: ${err.message}`);
    if (err.stack) console.error(`    ${err.stack.split('\n')[1]}`);
    failedTotal++;
  }
}

console.log('================================================================');
console.log('   CHALLENGER 2: ADVERSARIAL EDGE CASE & STRESS VERIFICATION    ');
console.log('================================================================\n');

// -----------------------------------------------------------------------------
// 1. Rapid repeat error suppression (<400ms motor hesitation filter)
// -----------------------------------------------------------------------------
console.log('--- Suite 1: Rapid Repeat Error Suppression (<400ms) ---');

runTest('Suite 1', 'GameEngine: accidental double-tap on same wrong key within 400ms is suppressed', () => {
  const bus = new EventBus();
  const errorsEmitted = [];
  bus.on(EVENTS.KEY_PRESSED_FAIL, (p) => errorsEmitted.push(p));

  const engine = new GameEngine({ eventBus: bus });
  engine.startLevel(1, 'hola');

  // First wrong keypress 'z' (target is 'h')
  const r1 = engine.handleKeyPress('z');
  assert.strictEqual(r1.success, false);
  assert.strictEqual(engine.totalKeystrokes, 1);
  assert.strictEqual(engine.consecutiveErrors, 1);
  assert.strictEqual(errorsEmitted.length, 1);

  // Accidental double-tap within 10ms (< 400ms)
  const r2 = engine.handleKeyPress('z');
  assert.strictEqual(r2.success, false);
  assert.strictEqual(engine.totalKeystrokes, 1, 'Keystroke count should not increase on rapid duplicate error');
  assert.strictEqual(engine.consecutiveErrors, 1, 'Consecutive errors should not increase on rapid duplicate error');
  assert.strictEqual(errorsEmitted.length, 1, 'KEY_PRESSED_FAIL should not emit again for rapid duplicate');

  // Triple-tap within 20ms (< 400ms from r2)
  const r3 = engine.handleKeyPress('z');
  assert.strictEqual(r3.success, false);
  assert.strictEqual(engine.totalKeystrokes, 1);
  assert.strictEqual(engine.consecutiveErrors, 1);
  assert.strictEqual(errorsEmitted.length, 1);
});

runTest('Suite 1', 'GameEngine: different wrong key within 400ms is NOT suppressed', () => {
  const bus = new EventBus();
  const errorsEmitted = [];
  bus.on(EVENTS.KEY_PRESSED_FAIL, (p) => errorsEmitted.push(p));

  const engine = new GameEngine({ eventBus: bus });
  engine.startLevel(1, 'hola');

  engine.handleKeyPress('z');
  assert.strictEqual(engine.totalKeystrokes, 1);

  // Deliberate different wrong key 'x' immediately after 'z'
  engine.handleKeyPress('x');
  assert.strictEqual(engine.totalKeystrokes, 2, 'Different wrong key must count as a keystroke');
  assert.strictEqual(engine.consecutiveErrors, 2, 'Different wrong key must increment consecutive errors');
  assert.strictEqual(errorsEmitted.length, 2, 'KEY_PRESSED_FAIL must emit for new key');
});

runTest('Suite 1', 'GameEngine: repeated wrong key AFTER 400ms counts as separate error', () => {
  const bus = new EventBus();
  const errorsEmitted = [];
  bus.on(EVENTS.KEY_PRESSED_FAIL, (p) => errorsEmitted.push(p));

  const engine = new GameEngine({ eventBus: bus });
  engine.startLevel(1, 'hola');

  engine.handleKeyPress('z');
  assert.strictEqual(engine.totalKeystrokes, 1);

  // Simulate time passage > 400ms
  engine.lastErrorTime = Date.now() - 450;

  engine.handleKeyPress('z');
  assert.strictEqual(engine.totalKeystrokes, 2, 'Error after 400ms should count as separate error');
  assert.strictEqual(engine.consecutiveErrors, 2);
  assert.strictEqual(errorsEmitted.length, 2);
});

runTest('Suite 1', 'GameEngine: correct keystroke in between resets hesitation suppression', () => {
  const engine = new GameEngine();
  engine.startLevel(1, 'hola');

  // Error 1: 'z'
  engine.handleKeyPress('z');
  assert.strictEqual(engine.totalKeystrokes, 1);

  // Correct hit: 'h'
  engine.handleKeyPress('h');
  assert.strictEqual(engine.totalKeystrokes, 2);
  assert.strictEqual(engine.correctHits, 1);

  // Error 2 on 'z' immediately after 'h': must count as error because 'h' intervened
  engine.handleKeyPress('z');
  assert.strictEqual(engine.totalKeystrokes, 3);
  assert.strictEqual(engine.consecutiveErrors, 1);
});

runTest('Suite 1', 'PedagogyEngine: shouldFilterHesitation boundary checks', () => {
  const ped = new PedagogyEngine();

  // Exactly within threshold
  assert.strictEqual(ped.shouldFilterHesitation(1000, 1200, 'a', 'a'), true);
  assert.strictEqual(ped.shouldFilterHesitation(1000, 1399, 'a', 'a'), true);

  // At or beyond 400ms boundary
  assert.strictEqual(ped.shouldFilterHesitation(1000, 1400, 'a', 'a'), false);
  assert.strictEqual(ped.shouldFilterHesitation(1000, 1500, 'a', 'a'), false);

  // Different character
  assert.strictEqual(ped.shouldFilterHesitation(1000, 1200, 'a', 'b'), false);

  // Case insensitivity
  assert.strictEqual(ped.shouldFilterHesitation(1000, 1200, 'a', 'A'), true);
  assert.strictEqual(ped.shouldFilterHesitation(1000, 1200, 'F', 'f'), true);

  // Falsy inputs
  assert.strictEqual(ped.shouldFilterHesitation(0, 1000, 'a', 'a'), false);
  assert.strictEqual(ped.shouldFilterHesitation(null, 1000, 'a', 'a'), false);
});

// -----------------------------------------------------------------------------
// 2. Zero keystrokes accuracy calculation
// -----------------------------------------------------------------------------
console.log('\n--- Suite 2: Zero Keystrokes Accuracy Calculation ---');

runTest('Suite 2', 'GameEngine: accuracy defaults to 100% on 0 total keystrokes without NaN', () => {
  const engine = new GameEngine();

  // Fresh engine instance
  assert.strictEqual(engine.totalKeystrokes, 0);
  assert.strictEqual(engine.correctHits, 0);
  assert.strictEqual(engine.getAccuracy(), 100, 'Fresh engine accuracy must be 100');
  assert.strictEqual(Number.isNaN(engine.getAccuracy()), false, 'Accuracy must not be NaN');

  // Started level with 0 keystrokes
  engine.startLevel(1, 'mecanografia');
  assert.strictEqual(engine.totalKeystrokes, 0);
  assert.strictEqual(engine.getAccuracy(), 100, 'Started level accuracy must be 100 before any keystroke');

  const stats = engine.getStats();
  assert.strictEqual(stats.accuracy, 100);
  assert.strictEqual(Number.isNaN(stats.accuracy), false);
  assert.strictEqual(stats.wpm, 0);
  assert.strictEqual(stats.ppm, 0);
  assert.strictEqual(Number.isNaN(stats.wpm), false);
  assert.strictEqual(Number.isNaN(stats.ppm), false);
});

runTest('Suite 2', 'PedagogyEngine: calculateStars and evaluateSession with 0 or edge accuracy', () => {
  const ped = new PedagogyEngine();

  // 100% accuracy -> 3 stars
  assert.strictEqual(ped.calculateStars(100), 3);

  // 0% accuracy -> 1 star (non-punitive minimum, never 0)
  assert.strictEqual(ped.calculateStars(0), 1);
  assert.strictEqual(ped.calculateStars(undefined), 1);
  assert.strictEqual(ped.calculateStars(null), 1);
  assert.strictEqual(ped.calculateStars(NaN), 1);

  // evaluateSession with missing/zero accuracy
  const evalEmpty = ped.evaluateSession({});
  assert.strictEqual(evalEmpty.accuracy, 100);
  assert.strictEqual(evalEmpty.stars, 3);
  assert.strictEqual(evalEmpty.passed, true);

  const evalZero = ped.evaluateSession({ accuracy: 0 });
  assert.strictEqual(evalZero.accuracy, 0);
  assert.strictEqual(evalZero.stars, 1);
  assert.strictEqual(evalZero.passed, true);
});

// -----------------------------------------------------------------------------
// 3. Spacebar reaction in HIGH_FIVE_WAIT state
// -----------------------------------------------------------------------------
console.log('\n--- Suite 3: Spacebar reaction in HIGH_FIVE_WAIT state ---');

runTest('Suite 3', 'MascotFSM: Space key completes high-five and transitions to CELEBRATING', () => {
  const bus = new EventBus();
  const fsm = new MascotFSM(bus);

  assert.strictEqual(fsm.getState(), 'IDLE');

  // Trigger LEVEL_COMPLETED
  bus.emit(EVENTS.LEVEL_COMPLETED, { levelId: 1, stars: 3, accuracy: 100, wpm: 30 });
  assert.strictEqual(fsm.getState(), 'HIGH_FIVE_WAIT');

  // Pressing random letters must NOT break HIGH_FIVE_WAIT
  fsm.handleKeystroke('a');
  assert.strictEqual(fsm.getState(), 'HIGH_FIVE_WAIT', 'Letter a must not leave HIGH_FIVE_WAIT');

  fsm.handleKeystroke('Enter');
  assert.strictEqual(fsm.getState(), 'HIGH_FIVE_WAIT', 'Enter key must not leave HIGH_FIVE_WAIT');

  // Idle timeout of 30s must NOT put it to sleep during HIGH_FIVE_WAIT
  fsm.handleIdleTime(30);
  assert.strictEqual(fsm.getState(), 'HIGH_FIVE_WAIT', 'High-five must not be interrupted by idle timer');

  // Pressing Space (' ') must transition to CELEBRATING
  fsm.handleKeystroke(' ');
  assert.strictEqual(fsm.getState(), 'CELEBRATING', 'Spacebar must trigger CELEBRATING');
  assert.strictEqual(fsm.getPreviousState(), 'HIGH_FIVE_WAIT');
});

runTest('Suite 3', 'MascotFSM: accepts "Space" and "Spacebar" variants in HIGH_FIVE_WAIT', () => {
  const fsm1 = new MascotFSM();
  fsm1.transitionTo('HIGH_FIVE_WAIT');
  fsm1.handleKeystroke('Space');
  assert.strictEqual(fsm1.getState(), 'CELEBRATING', 'Key "Space" must trigger celebration');

  const fsm2 = new MascotFSM();
  fsm2.transitionTo('HIGH_FIVE_WAIT');
  fsm2.handleKeystroke('Spacebar');
  assert.strictEqual(fsm2.getState(), 'CELEBRATING', 'Key "Spacebar" must trigger celebration');
});

runTest('Suite 3', 'MascotFSM: Space pressed in other states does NOT trigger CELEBRATING', () => {
  const fsm = new MascotFSM();
  assert.strictEqual(fsm.getState(), 'IDLE');

  // Space pressed in IDLE
  fsm.handleKeystroke(' ');
  assert.strictEqual(fsm.getState(), 'IDLE', 'Space in IDLE must not enter CELEBRATING');

  // Space pressed in SLEEPY
  fsm.transitionTo('SLEEPY');
  fsm.handleKeystroke(' ');
  assert.strictEqual(fsm.getState(), 'IDLE', 'Space in SLEEPY must wake up to IDLE');
});

// -----------------------------------------------------------------------------
// 4. StorageManager corruption resilience
// -----------------------------------------------------------------------------
console.log('\n--- Suite 4: StorageManager Corruption Resilience ---');

class MockBackendStore {
  constructor(initial = {}) {
    this._map = new Map(Object.entries(initial));
  }
  getItem(k) { return this._map.has(k) ? this._map.get(k) : null; }
  setItem(k, v) { this._map.set(k, String(v)); }
  removeItem(k) { this._map.delete(k); }
  clear() { this._map.clear(); }
  get length() { return this._map.size; }
}

runTest('Suite 4', 'StorageManager: gracefully auto-recovers from truncated and malformed JSON', () => {
  const malformedEntries = [
    ['mecano_stars', '{"1": 3, "2": '],                  // Truncated JSON
    ['mecano_accessories', '<<<MALFORMED XML>>>'],       // Non-JSON string
    ['mecano_error_heatmap', 'undefined'],               // Javascript token
    ['mecano_settings', '{ bad: json }'],                // Unquoted keys syntax error
    ['mecano_progress', '']                              // Empty string
  ];

  const mock = new MockBackendStore(Object.fromEntries(malformedEntries));
  const storage = new StorageManager({ storage: mock });

  // Suppress expected console.warn during test
  const origWarn = console.warn;
  console.warn = () => {};

  try {
    // 1. Reading corrupted stars
    const stars = storage.getLevelStars(1);
    assert.strictEqual(stars, 0, 'Corrupted stars should default to 0');
    assert.strictEqual(storage.getTotalStars(), 0, 'Total stars on corrupt storage should be 0');

    // 2. Reading corrupted accessories
    const unlocked = storage.getUnlockedAccessories();
    assert.deepStrictEqual(unlocked, [], 'Corrupted accessories should default to empty array');
    const equipped = storage.getEquippedAccessories();
    assert.strictEqual(equipped.hat, null);

    // 3. Reading corrupted heatmap
    const heatmap = storage.getErrorHeatmap();
    assert.deepStrictEqual(heatmap, {}, 'Corrupted heatmap should default to empty object');
    assert.deepStrictEqual(storage.getMostProblematicKeys(), []);

    // 4. Reading corrupted progress
    assert.strictEqual(storage.getUnlockedLevel(), 1, 'Corrupted progress level should default to 1');
    assert.strictEqual(storage.getBelt(), 'blanco', 'Corrupted belt should default to blanco');

    // 5. Reading corrupted settings
    const settings = storage.getSettings();
    assert.strictEqual(settings.soundEnabled, true);
    assert.strictEqual(settings.volumes.voice, 1.0);

    // 6. Overwriting and recovering: verify storage heals
    storage.saveLevelStars(1, 3);
    assert.strictEqual(storage.getLevelStars(1), 3, 'Healed stars key should retain saved value');

    storage.recordError('f');
    assert.strictEqual(storage.getErrorHeatmap().f, 1, 'Healed heatmap key should retain recorded error');

    storage.unlockAccessory('hat-crown');
    assert.strictEqual(storage.getUnlockedAccessories().includes('hat-crown'), true);

    storage.setUnlockedLevel(3);
    assert.strictEqual(storage.getUnlockedLevel(), 3);
  } finally {
    console.warn = origWarn;
  }
});

runTest('Suite 4', 'StorageManager: monotonic improvement retains higher star count', () => {
  const storage = new StorageManager();
  storage.saveLevelStars(1, 3);
  assert.strictEqual(storage.getLevelStars(1), 3);

  // Subsequent replay with 1 star must NOT downgrade existing 3 stars
  storage.saveLevelStars(1, 1);
  assert.strictEqual(storage.getLevelStars(1), 3, 'Stars must be monotonically non-decreasing');
});

// -----------------------------------------------------------------------------
// 5. VoiceQueue typing rate throttle (>25 PPM)
// -----------------------------------------------------------------------------
console.log('\n--- Suite 5: VoiceQueue Typing Rate Throttle (>25 PPM) ---');

class MockSynth {
  constructor() {
    this.spokenUtterances = [];
    this.speaking = false;
  }
  speak(u) {
    this.speaking = true;
    this.spokenUtterances.push(u);
    if (u.onstart) u.onstart();
    // Complete synchronously in mock
    this.speaking = false;
    if (u.onend) u.onend();
  }
  cancel() {
    this.speaking = false;
  }
  getVoices() {
    return [{ name: 'Test Spanish', lang: 'es-ES' }];
  }
}

class MockUtterance {
  constructor(text) {
    this.text = text;
    this.lang = 'es-ES';
    this.volume = 1;
    this.rate = 1;
    this.pitch = 1;
  }
}

runTest('Suite 5', 'VoiceQueue: throttles verbose speeches at > 25 PPM in favor of short interjections', () => {
  const synth = new MockSynth();
  const vq = new VoiceQueue({
    speechSynthesis: synth,
    SpeechSynthesisUtterance: MockUtterance,
    rateThrottleThreshold: 25
  });

  // 1. At normal rate (PPM = 15 <= 25), verbose speech is accepted as-is
  vq.setTypingRate(15);
  const acceptedSlow = vq.speak({
    text: '¡Muy bien hecho! Recuerda mantener la postura.',
    priority: 'NORMAL'
  });
  assert.strictEqual(acceptedSlow, true);
  assert.strictEqual(synth.spokenUtterances.length, 1);
  assert.strictEqual(synth.spokenUtterances[0].text, '¡Muy bien hecho! Recuerda mantener la postura.');

  // 2. At high rate (PPM = 40 > 25), verbose sentence is substituted with short interjection
  vq.setTypingRate(40);
  const acceptedFast1 = vq.speak({
    text: 'Esta es una frase larga y explicativa de ayuda para la tecla.',
    priority: 'NORMAL'
  });
  assert.strictEqual(acceptedFast1, true);
  assert.strictEqual(synth.spokenUtterances.length, 2);

  const fastUtteranceText = synth.spokenUtterances[1].text;
  assert.strictEqual(
    SHORT_INTERJECTIONS.includes(fastUtteranceText),
    true,
    `Spoken text "${fastUtteranceText}" must be one of the short punchy interjections`
  );

  // 3. Rapid subsequent verbose speech within 2500ms cooldown is DROPPED to avoid breaking flow
  const acceptedFast2 = vq.speak({
    text: 'Otra frase larga inmediata que no debe interrumpir el tecleo.',
    priority: 'NORMAL'
  });
  assert.strictEqual(acceptedFast2, false, 'Rapid verbose speech must be dropped during fast typing');
  assert.strictEqual(synth.spokenUtterances.length, 2, 'No new utterance should have been enqueued');

  // 4. CRITICAL priority speech (e.g. LEVEL_COMPLETED) is NEVER throttled or dropped
  const acceptedCritical = vq.speak({
    text: '¡Nivel completado! ¡Tres estrellas perfectas! ¡Choca esos cinco!',
    priority: 'CRITICAL'
  });
  assert.strictEqual(acceptedCritical, true);
  assert.strictEqual(synth.spokenUtterances.length, 3);
  assert.strictEqual(
    synth.spokenUtterances[2].text,
    '¡Nivel completado! ¡Tres estrellas perfectas! ¡Choca esos cinco!'
  );
});

runTest('Suite 5', 'VoiceQueue: single key name speech is not replaced by interjection during fast typing', () => {
  const synth = new MockSynth();
  const vq = new VoiceQueue({
    speechSynthesis: synth,
    SpeechSynthesisUtterance: MockUtterance,
    rateThrottleThreshold: 25
  });
  vq.setTypingRate(50); // fast typing

  // speakKey('f') produces "efe" (short word, no spaces, <= 16 chars)
  const spoken = vq.speakKey('f');
  assert.strictEqual(spoken, true);
  assert.strictEqual(synth.spokenUtterances.length, 1);
  assert.strictEqual(synth.spokenUtterances[0].text, 'efe');
});

runTest('Suite 5', 'VoiceQueue: EventBus binding computes PPM dynamically from KEY_PRESSED_SUCCESS', () => {
  const bus = new EventBus();
  const synth = new MockSynth();
  const vq = new VoiceQueue({
    speechSynthesis: synth,
    SpeechSynthesisUtterance: MockUtterance,
    rateThrottleThreshold: 25
  });
  vq.bindEventBus(bus);

  // Simulate typing burst of 10 keys across 2 seconds (300 PPM)
  const now = Date.now();
  vq._recentKeystrokes = [now - 2000]; // first stroke 2s ago
  for (let i = 0; i < 9; i++) {
    bus.emit(EVENTS.KEY_PRESSED_SUCCESS, { key: 'f', comboCount: i + 1, accuracy: 100 });
  }

  // PPM must have been updated to > 25
  assert.strictEqual(vq.getTypingRate() > 25, true, `PPM (${vq.getTypingRate()}) should be > 25`);
});

// -----------------------------------------------------------------------------
// 6. Pentatonic scale index wrap-around (> 10 combo count)
// -----------------------------------------------------------------------------
console.log('\n--- Suite 6: Pentatonic Scale Index Bounds & Wrap-Around ---');

class MockAudioContextForBounds {
  constructor() {
    this.currentTime = 0;
    this.state = 'running';
    this.destination = {};
  }
  createOscillator() {
    return {
      type: 'sine',
      frequency: {
        value: 440,
        setValueAtTime(v) { this.value = v; }
      },
      connect() {},
      start() {},
      stop() {}
    };
  }
  createGain() {
    return {
      gain: {
        setValueAtTime() {},
        exponentialRampToValueAtTime() {}
      },
      connect() {}
    };
  }
}

runTest('Suite 6', 'ProceduralAudio: combo count > 10 does not cause out of bounds or frequency NaN', () => {
  const mockCtx = new MockAudioContextForBounds();
  const audio = new ProceduralAudio({ audioContext: mockCtx });

  const maxNoteIndex = PENTATONIC_SCALE.length - 1; // 10
  const highestFreq = PENTATONIC_SCALE[maxNoteIndex]; // 1046.50 Hz (C6)
  const lowestFreq = PENTATONIC_SCALE[0]; // 261.63 Hz (C4)

  // Test combos from 1 to 11
  for (let c = 1; c <= 11; c++) {
    const freq = audio.playSuccess(c);
    assert.strictEqual(typeof freq, 'number');
    assert.strictEqual(Number.isNaN(freq), false, `Freq for combo ${c} must not be NaN`);
    assert.strictEqual(freq > 0, true);
  }

  // Extreme combo counts: combo = 12, 15, 20, 50, 100, 1000, Infinity
  const testCombos = [12, 15, 25, 50, 100, 999, 10000];
  for (const combo of testCombos) {
    const freq = audio.playSuccess(combo);
    assert.strictEqual(typeof freq, 'number');
    assert.strictEqual(Number.isNaN(freq), false, `Freq for combo ${combo} must not be NaN`);
    assert.strictEqual(freq, highestFreq, `Combo ${combo} must safely clamp to top note (1046.50Hz) without crashing`);
  }

  // playPentatonicSuccess direct index method
  for (const idx of [0, 5, 10, 11, 25, 100]) {
    const freq = audio.playPentatonicSuccess(idx);
    assert.strictEqual(typeof freq, 'number');
    assert.strictEqual(Number.isNaN(freq), false);
    assert.strictEqual(freq > 0, true);
  }

  // Boundary inputs: 0, negative numbers, NaN, null
  const freqZero = audio.playSuccess(0);
  assert.strictEqual(freqZero, lowestFreq, 'Combo 0 should return lowest note C4');
  assert.strictEqual(Number.isNaN(freqZero), false);

  const freqNeg = audio.playSuccess(-5);
  assert.strictEqual(Number.isNaN(freqNeg), false);

  const freqNaN = audio.playSuccess(NaN);
  assert.strictEqual(Number.isNaN(freqNaN), false);
});

console.log('\n================================================================');
if (failedTotal === 0) {
  console.log(`✔ ALL ADVERSARIAL CHECKS PASSED: ${passedTotal} / ${passedTotal} tests passed.`);
} else {
  console.log(`✖ ADVERSARIAL CHECKS FAILED: ${failedTotal} failed, ${passedTotal} passed.`);
}
console.log('================================================================');

process.exit(failedTotal === 0 ? 0 : 1);
