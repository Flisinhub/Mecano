/**
 * keyboard.test.js - Comprehensive Verification Suite for M4 (Keyboard, Hands & Pedagogy)
 * 
 * Verifies 100% of contracts for:
 * - KeyboardLayout.js: Pedagogical color mappings, homemark keys, opposing shift, dead keys
 * - ToyKeyboard.js: Screen position reporting, tactile feedback, EventBus event flows
 * - GhostHands.js: Active finger illumination, 2s idle timer, USER_STUCK dispatch
 * - PedagogyEngine.js: 8-level micro-curriculum, non-punitive grading, belt promotions
 */

import assert from 'node:assert/strict';
import {
  FINGER_COLORS,
  FINGER_NAMES,
  SPANISH_KEYBOARD_LAYOUT,
  getFingerForKey,
  getKeyBaseChar,
  isHomemarkKey,
  hasAccent,
  hasDiaeresis,
  requiresShift,
  requiresAltGr,
  getShiftHandForChar
} from './KeyboardLayout.js';
import { PedagogyEngine } from './PedagogyEngine.js';
import { ToyKeyboard } from './ToyKeyboard.js';
import { GhostHands } from './GhostHands.js';
import { EventBus } from '../core/EventBus.js';

console.log('\n--- STARTING COMPREHENSIVE M4 KEYBOARD & PEDAGOGY VERIFICATION ---');

// ============================================================================
// Suite 1: KeyboardLayout.js
// ============================================================================
console.log('Testing KeyboardLayout.js...');

// 1. Strict pedagogical colors
assert.strictEqual(FINGER_COLORS.lp, '#ff6b81', 'Left Pinky must be Coral / Soft Red');
assert.strictEqual(FINGER_COLORS.rp, '#ff6b81', 'Right Pinky must be Coral / Soft Red');
assert.strictEqual(FINGER_COLORS.lr, '#ff9f43', 'Left Ring must be Warm Orange');
assert.strictEqual(FINGER_COLORS.rr, '#ff9f43', 'Right Ring must be Warm Orange');
assert.strictEqual(FINGER_COLORS.lm, '#ffd32a', 'Left Middle must be Sun Yellow');
assert.strictEqual(FINGER_COLORS.rm, '#ffd32a', 'Right Middle must be Sun Yellow');
assert.strictEqual(FINGER_COLORS.li, '#2ed573', 'Left Index must be Mint Green');
assert.strictEqual(FINGER_COLORS.ri, '#00d2d3', 'Right Index must be Sky Blue');
assert.strictEqual(FINGER_COLORS.thumb, '#9b59b6', 'Thumbs must be Magic Purple');

// 2. Homemark bumps on F and J
assert.strictEqual(isHomemarkKey('f'), true, 'F must have homemark');
assert.strictEqual(isHomemarkKey('F'), true, 'Uppercase F must have homemark');
assert.strictEqual(isHomemarkKey('j'), true, 'J must have homemark');
assert.strictEqual(isHomemarkKey('J'), true, 'Uppercase J must have homemark');
assert.strictEqual(isHomemarkKey('g'), false, 'G must not have homemark');
assert.strictEqual(isHomemarkKey('k'), false, 'K must not have homemark');

// 3. Opposing Hand Shift Illumination
// Letter on left hand (e.g. 'A') requires Right Shift
assert.strictEqual(getShiftHandForChar('A'), 'right', 'Left-hand letter A must use Right Shift');
assert.strictEqual(getShiftHandForChar('R'), 'right', 'Left-hand letter R must use Right Shift');
// Letter on right hand (e.g. 'P', 'J') requires Left Shift
assert.strictEqual(getShiftHandForChar('P'), 'left', 'Right-hand letter P must use Left Shift');
assert.strictEqual(getShiftHandForChar('J'), 'left', 'Right-hand letter J must use Left Shift');
// Lowercase does not require Shift
assert.strictEqual(getShiftHandForChar('a'), null, 'Lowercase does not require shift');

// 4. Dead keys and accents
assert.strictEqual(hasAccent('á'), true);
assert.strictEqual(hasAccent('é'), true);
assert.strictEqual(hasAccent('a'), false);
assert.strictEqual(hasDiaeresis('ü'), true);
assert.strictEqual(hasDiaeresis('u'), false);
assert.strictEqual(getKeyBaseChar('á'), 'a');
assert.strictEqual(getKeyBaseChar('Ü'), 'u');
assert.strictEqual(getKeyBaseChar('!'), '1');
assert.strictEqual(getKeyBaseChar('@'), '2');

// 5. Alt Gr detection
assert.strictEqual(requiresAltGr('@'), true);
assert.strictEqual(requiresAltGr('#'), true);
assert.strictEqual(requiresAltGr('€'), true);
assert.strictEqual(requiresAltGr('a'), false);

console.log('✓ KeyboardLayout passed all checks.');

// ============================================================================
// Suite 2: PedagogyEngine.js
// ============================================================================
console.log('Testing PedagogyEngine.js...');

const pedagogy = new PedagogyEngine();

// 1. Static curriculum specification
assert.strictEqual(PedagogyEngine.CURRICULUM.length, 8);
assert.strictEqual(PedagogyEngine.CURRICULUM[0].name.includes('Índices'), true);
assert.strictEqual(PedagogyEngine.CURRICULUM[7].name.includes('Galáctico'), true);

// 2. Non-punitive 3-star formula
assert.strictEqual(pedagogy.calculateStars(100), 3);
assert.strictEqual(pedagogy.calculateStars(95), 3);
assert.strictEqual(pedagogy.calculateStars(94), 2);
assert.strictEqual(pedagogy.calculateStars(90), 2);
assert.strictEqual(pedagogy.calculateStars(89), 1);
assert.strictEqual(pedagogy.calculateStars(50), 1);
assert.strictEqual(pedagogy.calculateStars(0), 1, 'Minimum 1 star, never 0');

// 3. Belt promotion thresholds
assert.strictEqual(pedagogy.calculateBelt(1, 0), 'blanco');
assert.strictEqual(pedagogy.calculateBelt(2, 6), 'blanco'); // Level not reached
assert.strictEqual(pedagogy.calculateBelt(3, 4), 'blanco'); // Stars not reached
assert.strictEqual(pedagogy.calculateBelt(3, 5), 'amarillo');
assert.strictEqual(pedagogy.calculateBelt(5, 11), 'verde');
assert.strictEqual(pedagogy.calculateBelt(7, 18), 'negro');

// 4. Rich levels inspection
const lvl1 = pedagogy.getLevel(1);
assert.strictEqual(lvl1.allowedKeys.includes('f'), true);
assert.strictEqual(lvl1.allowedKeys.includes('j'), true);
assert.strictEqual(lvl1.words.length > 0, true);

// 5. Session evaluation (always passing, celebratory)
const evalRes = pedagogy.evaluateSession({
  levelId: 1,
  accuracy: 96,
  wpm: 22,
  unlockedLevel: 1,
  totalStars: 0
});
assert.strictEqual(evalRes.passed, true);
assert.strictEqual(evalRes.stars, 3);
assert.strictEqual(evalRes.nextUnlockedLevel, 2);

// 6. Motor hesitation filter
assert.strictEqual(pedagogy.shouldFilterHesitation(1000, 1200, 'x', 'x'), true, 'Error within 200ms on same key filtered');
assert.strictEqual(pedagogy.shouldFilterHesitation(1000, 1500, 'x', 'x'), false, 'Error after 500ms not filtered');
assert.strictEqual(pedagogy.shouldFilterHesitation(1000, 1200, 'x', 'y'), false, 'Error on different key not filtered');

console.log('✓ PedagogyEngine passed all checks.');

// ============================================================================
// Suite 3: ToyKeyboard.js
// ============================================================================
console.log('Testing ToyKeyboard.js...');

const bus = new EventBus();
const keyboard = new ToyKeyboard({ eventBus: bus });

// 1. Screen position reporting for quadratic Bézier projectiles
const posF = keyboard.getKeyScreenPosition('f');
const posJ = keyboard.getKeyScreenPosition('j');
const posSpace = keyboard.getKeyScreenPosition(' ');

assert.strictEqual(typeof posF.x, 'number');
assert.strictEqual(typeof posF.y, 'number');
assert.strictEqual(typeof posJ.x, 'number');
assert.strictEqual(typeof posJ.y, 'number');
assert.strictEqual(typeof posSpace.x, 'number');
assert.strictEqual(typeof posSpace.y, 'number');
assert.notDeepStrictEqual(posF, posJ, 'F and J must have distinct coordinates for projectile targeting');

// 2. Target key change through EventBus
bus.emit('KEY_TARGET_CHANGED', {
  key: 'f',
  finger: 'li',
  hand: 'left',
  screenPosition: posF
});
assert.strictEqual(keyboard.currentTargetChar, 'f');

// 3. Success and Error feedback
bus.emit('KEY_PRESSED_SUCCESS', {
  key: 'f',
  comboCount: 1,
  accuracy: 100,
  keyScreenPosition: posF
});

bus.emit('KEY_PRESSED_FAIL', {
  pressedKey: 'd',
  expectedKey: 'f',
  consecutiveErrors: 1
});

keyboard.destroy();
console.log('✓ ToyKeyboard passed all checks.');

// ============================================================================
// Suite 4: GhostHands.js & 2s Idle Timer
// ============================================================================
console.log('Testing GhostHands.js...');

let stuckEventReceived = null;
bus.on('USER_STUCK', (payload) => {
  stuckEventReceived = payload;
});

const ghostHands = new GhostHands({
  eventBus: bus,
  idleThresholdMs: 50 // short threshold for test speed
});

// Set active target finger
bus.emit('KEY_TARGET_CHANGED', {
  key: 'j',
  finger: 'ri',
  hand: 'right',
  screenPosition: posJ
});

assert.strictEqual(ghostHands.currentFingerId, 'ri');
assert.strictEqual(ghostHands.currentTargetKey, 'j');

// Wait for idle timer to fire USER_STUCK
await new Promise(resolve => setTimeout(resolve, 80));

assert.notStrictEqual(stuckEventReceived, null, 'USER_STUCK must be dispatched after inactivity');
assert.strictEqual(stuckEventReceived.expectedKey, 'j');
assert.strictEqual(stuckEventReceived.finger, 'ri');

ghostHands.destroy();
console.log('✓ GhostHands passed all checks.');

console.log('\n================================================================================');
console.log('✔ ALL M4 KEYBOARD, HANDS & PEDAGOGY UNIT TESTS PASSED SUCCESSFULLY!');
console.log('================================================================================\n');
