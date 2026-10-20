import assert from 'node:assert';
import { MascotAnimator } from './MascotAnimator.js';
import { LipSync } from './LipSync.js';
import { SpeechBubble, formatDialogueText, getFingerForKey, getKeyColor, FINGER_COLORS } from './SpeechBubble.js';
import { MascotFSM } from './MascotFSM.js';
import { AccessorySocket, MASCOT_SOCKETS, ACCESSORY_CATALOG } from './AccessorySocket.js';
import { EventBus } from '../core/EventBus.js';

console.log('====================================================');
console.log('   STARTING SUITE: MASCOT & EMOTIONAL AI (M3)       ');
console.log('====================================================\n');

// ============================================================================
// Test Suite 1: MascotAnimator (Procedural Animation & Physics)
// ============================================================================
console.log('[TEST] MascotAnimator: Sinusoidal breathing, tilt & combo hops...');
{
  const animator = new MascotAnimator({
    breathingPeriod: 2.6,
    breathingAmplitude: 4.0,
    breathingScaleAmp: 0.02,
    maxTiltDeg: 4.0,
    referenceCenterX: 500,
    referenceHalfWidth: 400
  });

  // 1. Initial State
  const initial = animator.getTransformState();
  assert.strictEqual(initial.translateY, 0);
  assert.strictEqual(initial.rotateDeg, 0);
  assert.strictEqual(initial.scaleX, 1.0);
  assert.strictEqual(initial.scaleY, 1.0);
  assert.strictEqual(initial.isHopping, false);

  // 2. Breathing oscillation after quarter period (2.6 / 4 = 0.65s = 650ms)
  animator.update(650);
  const quarterBreath = animator.getTransformState();
  // sin(PI/2) = 1.0 => translateY ~= 4.0px
  assert.ok(Math.abs(quarterBreath.translateY - 4.0) < 0.2, `Expected ~4.0px, got ${quarterBreath.translateY}`);
  assert.ok(quarterBreath.scaleY > 1.0, 'ScaleY should oscillate with breathing');

  // 3. Look-At Tilt Tracking
  // Target key on far left (X = 100, Center = 500 => delta = -400 => ratio = -1.0 => tilt = -4.0 deg)
  animator.setTargetKeyPosition({ x: 100, y: 300 });
  // Step simulation for 500ms to allow smooth lerp decay
  for (let i = 0; i < 10; i++) animator.update(50);
  const leftTilt = animator.getTransformState();
  assert.ok(leftTilt.rotateDeg <= -3.8 && leftTilt.rotateDeg >= -4.0, `Expected close to -4deg, got ${leftTilt.rotateDeg}`);

  // Target key on far right (X = 900, Center = 500 => delta = +400 => ratio = +1.0 => tilt = +4.0 deg)
  animator.setTargetKeyPosition({ x: 900, y: 300 });
  for (let i = 0; i < 15; i++) animator.update(50);
  const rightTilt = animator.getTransformState();
  assert.ok(rightTilt.rotateDeg >= 3.8 && rightTilt.rotateDeg <= 4.0, `Expected close to +4deg, got ${rightTilt.rotateDeg}`);

  // Clamping check
  animator.setTargetTilt(20); // should clamp to 4.0
  animator.setTargetTilt(-20); // should clamp to -4.0

  // 4. Combo Hops & Physics
  animator.triggerHop(3); // Micro hop
  assert.strictEqual(animator.getTransformState().isHopping, true);
  animator.update(100);
  const hopState = animator.getTransformState();
  assert.ok(hopState.hopY < 0, `Hop displacement should be upward (< 0), got ${hopState.hopY}`);

  // Power jump on combo multiple of 5
  animator.reset();
  animator.triggerHop(5); // Power jump
  assert.strictEqual(animator.getTransformState().isHopping, true);

  // Step until landing
  for (let i = 0; i < 20; i++) animator.update(50);
  assert.strictEqual(animator.getTransformState().isHopping, false);
  assert.strictEqual(animator.getTransformState().hopY, 0);

  // 5. EventBus wiring
  const bus = new EventBus();
  const eventAnimator = new MascotAnimator({ eventBus: bus });
  bus.emit('KEY_TARGET_CHANGED', { key: 'a', finger: 'lp', hand: 'left', screenPosition: { x: 100, y: 200 } });
  for (let i = 0; i < 10; i++) eventAnimator.update(50);
  assert.ok(eventAnimator.getTransformState().rotateDeg < 0, 'Should rotate left on key "a"');

  bus.emit('KEY_PRESSED_SUCCESS', { key: 'a', comboCount: 5, accuracy: 100, keyScreenPosition: { x: 100, y: 200 } });
  assert.strictEqual(eventAnimator.getTransformState().isHopping, true);

  animator.destroy();
  eventAnimator.destroy();
  console.log('  ✔ MascotAnimator passed all tests.');
}

// ============================================================================
// Test Suite 2: LipSync (Syllable Cadence & Voice Indicator)
// ============================================================================
console.log('\n[TEST] LipSync: Syllable timing, mouth bounce & wave visualizer...');
{
  const lips = new LipSync({
    cadenceFreq: 4.8,
    mouthAmp: 0.25,
    msPerSyllable: 180
  });

  assert.strictEqual(lips.isSpeaking(), false);
  assert.strictEqual(lips.getMouthScale(), 1.0);
  assert.deepStrictEqual(lips.getWaveAmplitudes(), [0, 0, 0]);

  // Syllable estimation
  const count1 = lips.estimateSyllables('hola');
  assert.strictEqual(count1, 2, 'hola has 2 syllables');
  const count2 = lips.estimateSyllables('mecanografía');
  assert.ok(count2 >= 5, 'mecanografía has at least 5 syllables');

  // Trigger speech
  lips.speak('¡Excelente trabajo, amigo!', 600); // 600ms duration
  assert.strictEqual(lips.isSpeaking(), true);

  // Step simulation during speech
  lips.update(100);
  const scale = lips.getMouthScale();
  assert.ok(scale >= 1.0 && scale <= 1.25, `Mouth scale should be within [1.0, 1.25], got ${scale}`);

  const waves = lips.getWaveAmplitudes();
  assert.strictEqual(waves.length, 3);
  assert.ok(waves.some(w => w > 0), 'At least one waveform bar should be active');

  // Stop speaking
  lips.stopSpeaking();
  assert.strictEqual(lips.isSpeaking(), false);
  assert.strictEqual(lips.getMouthScale(), 1.0);
  assert.deepStrictEqual(lips.getWaveAmplitudes(), [0, 0, 0]);

  // EventBus subscription
  const bus = new EventBus();
  const eventLips = new LipSync({ eventBus: bus });
  bus.emit('MASCOT_SPEAK_REQUEST', { text: '¡Vamos!', priority: 'NORMAL', emotion: 'happy' });
  assert.strictEqual(eventLips.isSpeaking(), true);

  lips.destroy();
  eventLips.destroy();
  console.log('  ✔ LipSync passed all tests.');
}

// ============================================================================
// Test Suite 3: SpeechBubble (Formatting & Typewriter)
// ============================================================================
console.log('\n[TEST] SpeechBubble: Pedagogical highlights & typewriter...');
{
  // 1. Key to finger and color mapping
  assert.strictEqual(getFingerForKey('f'), 'li');
  assert.strictEqual(getFingerForKey('j'), 'ri');
  assert.strictEqual(getFingerForKey('a'), 'lp');
  assert.strictEqual(getFingerForKey(' '), 'thumb');
  assert.strictEqual(getFingerForKey('espacio'), 'thumb');

  assert.strictEqual(getKeyColor('f'), FINGER_COLORS['li']);
  assert.strictEqual(getKeyColor(' '), FINGER_COLORS['thumb']);

  // 2. formatDialogueText key replacement
  const raw = 'Pulsa la tecla [F] con tu dedo índice y luego [Espacio].';
  const formatted = formatDialogueText(raw);
  assert.ok(formatted.includes('bubble-key-highlight finger-li'), 'Should contain highlighted li tag for F');
  assert.ok(formatted.includes('finger-thumb'), 'Should contain highlighted thumb tag for Espacio');
  assert.ok(formatted.includes('>F</span>'), 'Key text should be uppercase');
  assert.ok(formatted.includes('>ESPACIO</span>'), 'Key token should be uppercase');

  // 3. SpeechBubble instance
  const bubble = new SpeechBubble({ charDelayMs: 10 });
  const tokens = bubble.tokenize('Hola <span class="tag">amigo</span>!');
  assert.strictEqual(tokens[0], 'H');
  assert.ok(tokens.includes('<span class="tag">'), 'Tags must be kept as atomic tokens');
  assert.ok(tokens.includes('</span>'), 'Closing tags must be atomic tokens');

  bubble.show('¡Hola [J]!', { immediate: true });
  assert.strictEqual(bubble.isVisible(), true);
  assert.strictEqual(bubble.getText(), '¡Hola [J]!');
  assert.ok(bubble.getFormattedHtml().includes('finger-ri'));

  bubble.hide();
  assert.strictEqual(bubble.isVisible(), false);

  bubble.destroy();
  console.log('  ✔ SpeechBubble passed all tests.');
}

// ============================================================================
// Test Suite 4: MascotFSM (6 States & Transition Mechanics)
// ============================================================================
console.log('\n[TEST] MascotFSM: 6 states, event transitions, and sleep timers...');
{
  const bus = new EventBus();
  const fsm = new MascotFSM({ eventBus: bus });

  // 1. Initial State
  assert.strictEqual(fsm.getState(), 'IDLE');

  // 2. USER_STUCK -> HELPER_POINTING
  let speechRequestReceived = null;
  bus.on('MASCOT_SPEAK_REQUEST', (p) => { speechRequestReceived = p; });

  bus.emit('USER_STUCK', { expectedKey: 'f', finger: 'li', idleTimeMs: 2000 });
  assert.strictEqual(fsm.getState(), 'HELPER_POINTING');
  assert.ok(speechRequestReceived !== null, 'Speech request should be dispatched on USER_STUCK');
  assert.ok(speechRequestReceived.text.includes('[f]'), 'Prompt should highlight key [f]');

  // 3. Keystroke clears helper mode back to IDLE
  fsm.handleKeystroke('f');
  assert.strictEqual(fsm.getState(), 'IDLE');

  // 4. Inactivity at 25s triggers SLEEPY
  fsm.handleIdleTime(24);
  assert.strictEqual(fsm.getState(), 'IDLE');
  fsm.handleIdleTime(25);
  assert.strictEqual(fsm.getState(), 'SLEEPY');

  // 5. Any key wakes up SLEEPY back to IDLE
  fsm.handleKeystroke('z');
  assert.strictEqual(fsm.getState(), 'IDLE');

  // 6. FEVER_MODE_CHANGED -> FLOW_DANCE
  bus.emit('FEVER_MODE_CHANGED', { isActive: true, multiplier: 2.0 });
  assert.strictEqual(fsm.getState(), 'FLOW_DANCE');

  bus.emit('FEVER_MODE_CHANGED', { isActive: false, multiplier: 1.0 });
  assert.strictEqual(fsm.getState(), 'IDLE');

  // 7. LEVEL_COMPLETED -> HIGH_FIVE_WAIT
  bus.emit('LEVEL_COMPLETED', { levelId: 1, stars: 3, accuracy: 100, wpm: 30 });
  assert.strictEqual(fsm.getState(), 'HIGH_FIVE_WAIT');

  // Non-space keys do not celebrate
  fsm.handleKeystroke('a');
  assert.strictEqual(fsm.getState(), 'HIGH_FIVE_WAIT');

  // Spacebar triggers CELEBRATING
  fsm.handleKeystroke(' ');
  assert.strictEqual(fsm.getState(), 'CELEBRATING');

  // 8. Reject invalid states
  assert.throws(() => {
    fsm.transitionTo('FLYING_STATE');
  }, /Invalid state/);

  fsm.destroy();
  console.log('  ✔ MascotFSM passed all tests.');
}

// ============================================================================
// Test Suite 5: AccessorySocket (Sockets & Wardrobe Catalog)
// ============================================================================
console.log('\n[TEST] AccessorySocket: Sockets, star unlocks & slot aliasing...');
{
  const socketSystem = new AccessorySocket();

  // 1. Normalized socket anchors definition
  assert.strictEqual(MASCOT_SOCKETS.head.top, '7%');
  assert.strictEqual(MASCOT_SOCKETS.eyes.top, '39%');
  assert.strictEqual(MASCOT_SOCKETS.neck.top, '74%');

  // 2. Catalog inspection
  assert.strictEqual(ACCESSORY_CATALOG.length, 6);
  const cap = socketSystem.getAccessory('hat-cap');
  assert.strictEqual(cap.name, 'Gorra de Aventurero');
  assert.strictEqual(cap.starsRequired, 3);

  const crown = socketSystem.getAccessory('crown-gold');
  assert.strictEqual(crown.starsRequired, 24);

  // 3. Slot aliasing normalization
  assert.strictEqual(socketSystem.normalizeSlot('hat'), 'head');
  assert.strictEqual(socketSystem.normalizeSlot('head'), 'head');
  assert.strictEqual(socketSystem.normalizeSlot('glasses'), 'eyes');
  assert.strictEqual(socketSystem.normalizeSlot('eyes'), 'eyes');
  assert.strictEqual(socketSystem.normalizeSlot('crown'), 'neck');
  assert.strictEqual(socketSystem.normalizeSlot('neck'), 'neck');

  // 4. Star unlocks
  assert.strictEqual(socketSystem.isUnlocked('hat-cap'), false);
  assert.strictEqual(socketSystem.canUnlock('hat-cap', 2), false); // Needs 3
  assert.strictEqual(socketSystem.canUnlock('hat-cap', 3), true);

  const resFail = socketSystem.unlock('hat-cap', 2);
  assert.strictEqual(resFail.success, false);

  const resOk = socketSystem.unlock('hat-cap', 3);
  assert.strictEqual(resOk.success, true);
  assert.strictEqual(socketSystem.isUnlocked('hat-cap'), true);

  // 5. Equipping across slots
  assert.strictEqual(socketSystem.getEquipped('head'), null);
  socketSystem.equip('head', 'hat-cap');
  assert.strictEqual(socketSystem.getEquipped('head'), 'hat-cap');
  // Alias query should yield same item
  assert.strictEqual(socketSystem.getEquipped('hat'), 'hat-cap');

  // Unequip
  socketSystem.unequip('head');
  assert.strictEqual(socketSystem.getEquipped('head'), null);

  // Incompatible slot rejection
  const equipWrong = socketSystem.equip('eyes', 'hat-cap');
  assert.strictEqual(equipWrong, false);

  socketSystem.destroy();
  console.log('  ✔ AccessorySocket passed all tests.');
}

console.log('\n====================================================');
console.log('  ALL MASCOT (M3) UNIT TESTS PASSED SUCCESSFULLY!   ');
console.log('====================================================\n');
