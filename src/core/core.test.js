import assert from 'node:assert';
import http from 'node:http';
import { EventBus, EVENTS, globalBus } from './EventBus.js';
import { StorageManager, globalStorage } from './StorageManager.js';
import { GameEngine, globalGameEngine, FINGER_MAP, getFingerForKey } from './GameEngine.js';
import { createServer, parsePort, MIME_TYPES } from '../../server.js';

console.log('--- STARTING COMPREHENSIVE M1 VERIFICATION ---');

// ==========================================
// Test Suite 1: EventBus
// ==========================================
console.log('Testing EventBus...');
const bus = new EventBus({ strict: true, validatePayloads: true });
let successPayload = null;
const unsubscribe = bus.on(EVENTS.KEY_PRESSED_SUCCESS, (data) => {
  successPayload = data;
});

assert.strictEqual(bus.listenerCount(EVENTS.KEY_PRESSED_SUCCESS), 1);
assert.strictEqual(bus.hasListeners(EVENTS.KEY_PRESSED_SUCCESS), true);

bus.emit(EVENTS.KEY_PRESSED_SUCCESS, {
  key: 'f',
  comboCount: 1,
  accuracy: 100,
  keyScreenPosition: { x: 100, y: 200 }
});
assert.deepStrictEqual(successPayload, {
  key: 'f',
  comboCount: 1,
  accuracy: 100,
  keyScreenPosition: { x: 100, y: 200 }
});

// Test unsubscribe
unsubscribe();
assert.strictEqual(bus.listenerCount(EVENTS.KEY_PRESSED_SUCCESS), 0);

// Test all 7 events
const eventsTested = [];
for (const eventName of Object.values(EVENTS)) {
  bus.once(eventName, (p) => eventsTested.push({ event: eventName, p }));
}

bus.emit(EVENTS.KEY_TARGET_CHANGED, { key: 'j', finger: 'ri', hand: 'right', screenPosition: { x: 500, y: 300 } });
bus.emit(EVENTS.KEY_PRESSED_SUCCESS, { key: 'j', comboCount: 2, accuracy: 100, keyScreenPosition: { x: 500, y: 300 } });
bus.emit(EVENTS.KEY_PRESSED_FAIL, { pressedKey: 'k', expectedKey: 'j', consecutiveErrors: 1 });
bus.emit(EVENTS.USER_STUCK, { expectedKey: 'j', finger: 'ri', idleTimeMs: 2000 });
bus.emit(EVENTS.FEVER_MODE_CHANGED, { isActive: true, multiplier: 2.0 });
bus.emit(EVENTS.MASCOT_SPEAK_REQUEST, { text: '¡Buen trabajo!', audioId: null, priority: 'NORMAL', emotion: 'happy' });
bus.emit(EVENTS.LEVEL_COMPLETED, { levelId: 1, stars: 3, accuracy: 98, wpm: 25 });

assert.strictEqual(eventsTested.length, 7, 'All 7 typed events must be emitted and received');
assert.throws(() => bus.emit('INVALID_EVENT', {}), /Unknown event/, 'Strict mode must reject invalid events');

bus.clear();
assert.strictEqual(bus.listenerCount(), 0);
console.log('✓ EventBus passed all checks.');

// ==========================================
// Test Suite 2: StorageManager
// ==========================================
console.log('Testing StorageManager...');
const storage = new StorageManager();
assert.strictEqual(storage.isPersistent(), false, 'Should use MemoryStorage in headless Node.js');

// Stars
storage.saveLevelStars(1, 2);
assert.strictEqual(storage.getLevelStars(1), 2);
storage.saveLevelStars(1, 3); // upgrades to 3
assert.strictEqual(storage.getLevelStars(1), 3);
storage.saveLevelStars(1, 1); // should not downgrade
assert.strictEqual(storage.getLevelStars(1), 3);
storage.saveLevelStars(2, 2);
assert.strictEqual(storage.getTotalStars(), 5);

// Error Heatmap
storage.recordError('f');
storage.recordError('f');
storage.recordError('p');
const heatmap = storage.getErrorHeatmap();
assert.strictEqual(heatmap.f, 2);
assert.strictEqual(heatmap.p, 1);
const problematic = storage.getMostProblematicKeys();
assert.strictEqual(problematic[0], 'f');

// Accessories
assert.strictEqual(storage.unlockAccessory('hat-cap'), true);
assert.strictEqual(storage.unlockAccessory('hat-cap'), false); // duplicate
assert.deepStrictEqual(storage.getUnlockedAccessories(), ['hat-cap']);
storage.equipAccessory('hat', 'hat-cap');
assert.strictEqual(storage.getEquippedAccessories().hat, 'hat-cap');
storage.equipAccessory('hat', null);
assert.strictEqual(storage.getEquippedAccessories().hat, null);

// Progression & Belts
storage.setUnlockedLevel(3);
assert.strictEqual(storage.getUnlockedLevel(), 3);
storage.setBelt('amarillo');
assert.strictEqual(storage.getBelt(), 'amarillo');

// Settings
storage.saveSettings({ font: 'opendyslexic', volumes: { music: 0.5 } });
const settings = storage.getSettings();
assert.strictEqual(settings.font, 'opendyslexic');
assert.strictEqual(settings.volumes.music, 0.5);
assert.strictEqual(settings.volumes.sfx, 0.85); // preserved default

// Corrupted data resilience
const corruptStorage = new StorageManager({
  storage: {
    getItem: () => '{ corrupt json ...',
    setItem: () => {},
    removeItem: () => {},
    clear: () => {}
  }
});
assert.strictEqual(corruptStorage.getLevelStars(1), 0); // Graceful recovery
console.log('✓ StorageManager passed all checks.');

// ==========================================
// Test Suite 3: GameEngine
// ==========================================
console.log('Testing GameEngine...');
const testBus = new EventBus();
const testStorage = new StorageManager();
const engine = new GameEngine({
  eventBus: testBus,
  storage: testStorage,
  feverThreshold: 10,
  idleStuckThresholdMs: 50
});

let lastTarget = null;
let feverEvents = [];
let levelCompleteData = null;

testBus.on(EVENTS.KEY_TARGET_CHANGED, (d) => { lastTarget = d; });
testBus.on(EVENTS.FEVER_MODE_CHANGED, (d) => { feverEvents.push(d); });
testBus.on(EVENTS.LEVEL_COMPLETED, (d) => { levelCompleteData = d; });

engine.startLevel(1, 'ffffffffff'); // 10 f's
assert.strictEqual(lastTarget.key, 'f');
assert.strictEqual(lastTarget.finger, 'li');
assert.strictEqual(lastTarget.hand, 'left');

// Hit 9 times
for (let i = 0; i < 9; i++) {
  engine.handleKeyPress('f');
}
assert.strictEqual(engine.comboCount, 9);
assert.strictEqual(engine.feverActive, false);

// 10th hit triggers Fever Mode and completes level
const finalResult = engine.handleKeyPress('f');
assert.strictEqual(finalResult.finished, true);
assert.strictEqual(finalResult.stars, 3);
assert.strictEqual(finalResult.accuracy, 100);
assert.strictEqual(feverEvents.length, 1);
assert.strictEqual(feverEvents[0].isActive, true);
assert.strictEqual(feverEvents[0].multiplier, 2.0);
assert.ok(levelCompleteData);
assert.strictEqual(levelCompleteData.stars, 3);
assert.strictEqual(testStorage.getLevelStars(1), 3);

// Test errors and hesitation guard
engine.startLevel(2, 'abc');
engine.handleKeyPress('z'); // wrong key
assert.strictEqual(engine.consecutiveErrors, 1);
assert.strictEqual(engine.totalKeystrokes, 1);

// Immediate duplicate wrong key (< 400ms)
engine.handleKeyPress('z');
assert.strictEqual(engine.totalKeystrokes, 1, 'Hesitation guard should suppress duplicate stroke count');

// Idle stuck test
engine.triggerIdleStuck();
engine.dispose();
console.log('✓ GameEngine passed all checks.');

// ==========================================
// Test Suite 4: server.js
// ==========================================
console.log('Testing server.js...');
assert.strictEqual(parsePort(['node', 'server.js', '9090']), 9090);
assert.strictEqual(parsePort(['node', 'server.js', '--port', '8081']), 8081);
assert.strictEqual(parsePort([], '4000'), 4000);
assert.strictEqual(parsePort([], undefined), 3000);

const testServer = createServer();
testServer.listen(0, '127.0.0.1', () => {
  const port = testServer.address().port;
  http.get(`http://127.0.0.1:${port}/`, (res) => {
    assert.strictEqual(res.statusCode, 200);
    assert.ok(res.headers['content-type'].includes('text/html'));
    
    http.get(`http://127.0.0.1:${port}/src/core/EventBus.js`, (res2) => {
      assert.strictEqual(res2.statusCode, 200);
      assert.ok(res2.headers['content-type'].includes('application/javascript'));
      
      http.get(`http://127.0.0.1:${port}/non_existent_file.xyz`, (res3) => {
        assert.strictEqual(res3.statusCode, 404);
        testServer.close(() => {
          console.log('✓ server.js passed all checks.');
          console.log('\n=== ALL M1 VERIFICATION CHECKS PASSED WITH 0 ERRORS ===\n');
          process.exit(0);
        });
      });
    });
  });
});
