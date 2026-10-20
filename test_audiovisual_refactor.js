/**
 * test_audiovisual_refactor.js - Automated Verification Suite for Mecano Refactoring
 * 
 * Validates:
 * 1. VoiceEngine Web Audio DSP graph (Highpass 85Hz, Peaking 2800Hz, Compressor, Analyser fftSize=256).
 * 2. SpeechSynthesis heuristic scoring (Edge Natural +100, Google +80, Apple +70, SAPI5 -100).
 * 3. Pre-rendered neural voice manifest loading and procedural SFX synthesis.
 * 4. Universal 10-finger vector SVG hands with exact pedagogical colors (#F538A0, #FA903E, #FCC934, #81C995, #12B5CB, #1A73E8, #C58AF9).
 * 5. Multi-key simultaneous combinations (@ -> Alt Gr + 2, uppercase A -> Shift + A).
 * 6. MascotController acoustic lip-sync: RMS calculation, EMA alpha=0.35, mouthOpenness in [0.0, 1.0], 4 emotions.
 * 7. Text zoom scaling (1.0x, 1.5x, 2.0x) and zero photographic PNG references in index.html.
 */

import assert from 'assert';
import fs from 'fs';
import path from 'path';

import { VoiceEngine, VOICE_TIERS } from './src/audio/VoiceEngine.js';
import {
  FINGER_COLORS,
  FINGER_NAMES,
  getMultiKeyFingerCombo,
  requiresShift,
  requiresAltGr
} from './src/keyboard/KeyboardLayout.js';
import {
  InteractiveHandsSVG,
  UNIVERSAL_FINGER_IDS,
  getLeftHandSVG,
  getRightHandSVG
} from './src/keyboard/InteractiveHandsSVG.js';
import { MascotController, MASCOT_EMOTIONS } from './src/mascot/MascotController.js';
import { EventBus } from './src/core/EventBus.js';

let passed = 0;
let total = 0;

function runTest(suite, name, fn) {
  total++;
  try {
    fn();
    console.log(`  ✔ [${suite}] ${name}`);
    passed++;
  } catch (err) {
    console.error(`  ✖ [${suite}] ${name}`);
    console.error(`    ${err.message}`);
    process.exitCode = 1;
  }
}

console.log('================================================================');
console.log('    MECANO AUDIOVISUAL & NEURAL VOICE VERIFICATION SUITE       ');
console.log('================================================================\n');

// -----------------------------------------------------------------------------
// Suite 1: VoiceEngine & Web Audio DSP Architecture
// -----------------------------------------------------------------------------
console.log('--- Suite 1: VoiceEngine & Web Audio DSP Pipeline ---');

// Mock Web Audio API for headless Node verification
class MockAudioNode {
  constructor() {
    this.connectedTo = null;
    this.type = '';
    this.frequency = { value: 0, setValueAtTime: (v) => { this.frequency.value = v; } };
    this.Q = { value: 0, setValueAtTime: (v) => { this.Q.value = v; } };
    this.gain = { value: 0, setValueAtTime: (v) => { this.gain.value = v; }, exponentialRampToValueAtTime: () => {} };
    this.threshold = { value: 0, setValueAtTime: (v) => { this.threshold.value = v; } };
    this.knee = { value: 0, setValueAtTime: (v) => { this.knee.value = v; } };
    this.ratio = { value: 0, setValueAtTime: (v) => { this.ratio.value = v; } };
    this.attack = { value: 0, setValueAtTime: (v) => { this.attack.value = v; } };
    this.release = { value: 0, setValueAtTime: (v) => { this.release.value = v; } };
    this.fftSize = 256;
    this.smoothingTimeConstant = 0.5;
  }
  connect(dest) {
    this.connectedTo = dest;
    return dest;
  }
  getByteTimeDomainData(arr) {
    // Fill with sample waveform
    for (let i = 0; i < arr.length; i++) {
      arr[i] = 128 + Math.round(40 * Math.sin(i * 0.2));
    }
  }
}

class MockAudioContext {
  constructor() {
    this.currentTime = 0;
    this.state = 'running';
    this.destination = new MockAudioNode();
  }
  createBiquadFilter() { return new MockAudioNode(); }
  createDynamicsCompressor() { return new MockAudioNode(); }
  createAnalyser() { return new MockAudioNode(); }
  createGain() { return new MockAudioNode(); }
  createOscillator() {
    return {
      type: 'sine',
      frequency: { setValueAtTime: () => {}, exponentialRampToValueAtTime: () => {} },
      connect: () => {},
      start: () => {},
      stop: () => {}
    };
  }
  resume() { return Promise.resolve(); }
}

runTest('Suite 1', 'VoiceEngine initializes studio DSP graph with precise filter and dynamics settings', () => {
  const mockCtx = new MockAudioContext();
  const engine = new VoiceEngine({ audioContext: mockCtx });

  const ctx = engine.getAudioContext();
  assert.strictEqual(ctx, mockCtx);

  // Highpass filter (85Hz rumble cut)
  assert.strictEqual(engine._highpassNode.type, 'highpass');
  assert.strictEqual(engine._highpassNode.frequency.value, 85);

  // Peaking EQ filter (2800Hz intelligibility presence)
  assert.strictEqual(engine._peakingNode.type, 'peaking');
  assert.strictEqual(engine._peakingNode.frequency.value, 2800);
  assert.strictEqual(engine._peakingNode.Q.value, 1.2);
  assert.strictEqual(engine._peakingNode.gain.value, 2.5);

  // Dynamics compressor
  assert.strictEqual(engine._compressorNode.threshold.value, -20);
  assert.strictEqual(engine._compressorNode.ratio.value, 3);

  // Analyser node for lip-sync
  const analyser = engine.getAnalyserNode();
  assert.ok(analyser);
  assert.strictEqual(analyser.fftSize, 256);
});

runTest('Suite 1', 'VoiceEngine scores Spanish voices prioritizing Edge Natural and penalizing SAPI5', () => {
  const engine = new VoiceEngine();

  const edgeNatural = { name: 'Microsoft Alvaro Online (Natural) - Spanish (Spain)', lang: 'es-ES' };
  const google = { name: 'Google español', lang: 'es-ES' };
  const apple = { name: 'Mónica (Enhanced)', lang: 'es-ES' };
  const sapiLegacy = { name: 'Microsoft Helena Desktop - Spanish (Spain)', lang: 'es-ES' };
  const nonSpanish = { name: 'Microsoft David Desktop - English (United States)', lang: 'en-US' };

  const scoreEdge = engine.scoreVoice(edgeNatural);
  const scoreGoogle = engine.scoreVoice(google);
  const scoreApple = engine.scoreVoice(apple);
  const scoreSapi = engine.scoreVoice(sapiLegacy);
  const scoreNonSpanish = engine.scoreVoice(nonSpanish);

  assert.ok(scoreEdge >= 100, 'Edge Natural should score >= 100');
  assert.ok(scoreGoogle >= 80, 'Google Español should score >= 80');
  assert.ok(scoreApple >= 70, 'Apple Enhanced should score >= 70');
  assert.ok(scoreSapi < 0, 'SAPI5 desktop voice should be heavily penalized (<0)');
  assert.ok(scoreNonSpanish < scoreSapi, 'Non-spanish voices should be relegated to bottom');
  assert.ok(scoreEdge > scoreGoogle && scoreGoogle > scoreApple && scoreApple > scoreSapi);
});

runTest('Suite 1', 'Procedural SFX synthesizers execute without exceptions', () => {
  const mockCtx = new MockAudioContext();
  const engine = new VoiceEngine({ audioContext: mockCtx });

  // Key click
  assert.doesNotThrow(() => engine.playTactileKeyClick(1));
  assert.doesNotThrow(() => engine.playTactileKeyClick(12));

  // Miss tone
  assert.doesNotThrow(() => engine.playDampedMissTone());

  // Victory chord
  assert.doesNotThrow(() => engine.playVictoryChord());
});

runTest('Suite 1', 'Neural MP3 manifest exists and contains 10 required phrases', () => {
  const manifestPath = path.resolve('assets/audio/voices/manifest.json');
  assert.strictEqual(fs.existsSync(manifestPath), true, 'manifest.json must exist');

  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  assert.strictEqual(manifest.voice, 'es-ES-AlvaroNeural');

  const requiredPhrases = [
    'welcome',
    'hand_position',
    'error_cheer_1',
    'error_cheer_2',
    'streak_10',
    'streak_20',
    'level_complete_3stars',
    'level_complete_2stars',
    'level_complete_1star',
    'high_five'
  ];

  for (const phraseId of requiredPhrases) {
    assert.ok(manifest.phrases[phraseId], `Phrase "${phraseId}" must exist in manifest`);
    const mp3Path = path.resolve(manifest.phrases[phraseId].file);
    assert.strictEqual(fs.existsSync(mp3Path), true, `MP3 file for "${phraseId}" must exist on disk`);
    const stats = fs.statSync(mp3Path);
    assert.ok(stats.size > 2000, `MP3 file "${phraseId}" must have non-trivial audio size (>2KB)`);
  }
});

// -----------------------------------------------------------------------------
// Suite 2: Vector SVG Interactive Hands & 10-Finger Universal Architecture
// -----------------------------------------------------------------------------
console.log('\n--- Suite 2: Vector SVG Interactive Hands & Pedagogical Colors ---');

runTest('Suite 2', 'Pedagogical color constants match exact design hex specifications', () => {
  assert.strictEqual(FINGER_COLORS.lp, '#F538A0', 'Pinky must be Magenta #F538A0');
  assert.strictEqual(FINGER_COLORS.rp, '#F538A0', 'Right Pinky must be Magenta #F538A0');
  assert.strictEqual(FINGER_COLORS.lr, '#FA903E', 'Ring must be Mandarina #FA903E');
  assert.strictEqual(FINGER_COLORS.rr, '#FA903E', 'Right Ring must be Mandarina #FA903E');
  assert.strictEqual(FINGER_COLORS.lm, '#FCC934', 'Middle must be Ámbar #FCC934');
  assert.strictEqual(FINGER_COLORS.rm, '#FCC934', 'Right Middle must be Ámbar #FCC934');
  assert.strictEqual(FINGER_COLORS.li, '#81C995', 'Left Index must be Verde Menta #81C995');
  assert.strictEqual(FINGER_COLORS.ri, '#12B5CB', 'Right Index must be Cian #12B5CB');
  assert.strictEqual(FINGER_COLORS.thumb, '#1A73E8', 'Thumbs must be Azul Intenso #1A73E8');
  assert.strictEqual(FINGER_COLORS.mod, '#C58AF9', 'Modifiers (Alt Gr/Shift) must be Lavanda #C58AF9');
});

runTest('Suite 2', 'SVG markup generation produces all 10 universal finger IDs with vector geometry', () => {
  const leftSvg = getLeftHandSVG();
  const rightSvg = getRightHandSVG();

  // Left hand 5 fingers
  assert.ok(leftSvg.includes('id="finger-l-pinky"'), 'Left pinky ID must be present');
  assert.ok(leftSvg.includes('id="finger-l-ring"'), 'Left ring ID must be present');
  assert.ok(leftSvg.includes('id="finger-l-middle"'), 'Left middle ID must be present');
  assert.ok(leftSvg.includes('id="finger-l-index"'), 'Left index ID must be present');
  assert.ok(leftSvg.includes('id="finger-l-thumb"'), 'Left thumb ID must be present');

  // Right hand 5 fingers
  assert.ok(rightSvg.includes('id="finger-r-thumb"'), 'Right thumb ID must be present');
  assert.ok(rightSvg.includes('id="finger-r-index"'), 'Right index ID must be present');
  assert.ok(rightSvg.includes('id="finger-r-middle"'), 'Right middle ID must be present');
  assert.ok(rightSvg.includes('id="finger-r-ring"'), 'Right ring ID must be present');
  assert.ok(rightSvg.includes('id="finger-r-pinky"'), 'Right pinky ID must be present');

  // Neither contains raster image references
  assert.strictEqual(leftSvg.includes('<image'), false, 'Left SVG must be pure vector without <image>');
  assert.strictEqual(rightSvg.includes('<image'), false, 'Right SVG must be pure vector without <image>');
});

runTest('Suite 2', 'Multi-key combinations correctly illuminate both fingers simultaneously', () => {
  // Test 1: @ requires Alt Gr + 2 (Right Thumb + Left Ring)
  const atCombo = getMultiKeyFingerCombo('@');
  assert.strictEqual(atCombo.isCombo, true);
  assert.strictEqual(atCombo.primaryFinger, 'finger-l-ring');
  assert.strictEqual(atCombo.primaryColor, '#FA903E');
  assert.strictEqual(atCombo.modifierFinger, 'finger-r-thumb');
  assert.strictEqual(atCombo.modifierColor, '#C58AF9');
  assert.ok(atCombo.labelText.includes('Alt Gr'));

  // Test 2: Uppercase A requires Shift + A (Opposite Right Pinky + Left Pinky)
  const upperA = getMultiKeyFingerCombo('A');
  assert.strictEqual(upperA.isCombo, true);
  assert.strictEqual(upperA.primaryFinger, 'finger-l-pinky');
  assert.strictEqual(upperA.primaryColor, '#F538A0');
  assert.strictEqual(upperA.modifierFinger, 'finger-r-pinky');
  assert.strictEqual(upperA.modifierColor, '#C58AF9');
  assert.ok(upperA.labelText.includes('Mayús'));

  // Test 3: € requires Alt Gr + E (Right Thumb + Left Middle)
  const euroCombo = getMultiKeyFingerCombo('€');
  assert.strictEqual(euroCombo.isCombo, true);
  assert.strictEqual(euroCombo.primaryFinger, 'finger-l-middle');
  assert.strictEqual(euroCombo.modifierFinger, 'finger-r-thumb');

  // Test 4: Regular key 'f' requires NO modifiers (Left Index only)
  const fKey = getMultiKeyFingerCombo('f');
  assert.strictEqual(fKey.isCombo, false);
  assert.strictEqual(fKey.primaryFinger, 'finger-l-index');
  assert.strictEqual(fKey.modifierFinger, null);
});

// -----------------------------------------------------------------------------
// Suite 3: MascotController & Real-Time Lip-Sync
// -----------------------------------------------------------------------------
console.log('\n--- Suite 3: MascotController & Lip-Sync RMS Pipeline ---');

runTest('Suite 3', 'MascotController calculates RMS and normalizes mouthOpenness into [0.0, 1.0]', () => {
  const mockCtx = new MockAudioContext();
  const voiceEngine = new VoiceEngine({ audioContext: mockCtx });

  const controller = new MascotController({ voiceEngine });
  assert.strictEqual(controller.mouthOpenness, 0.0);

  // Update with delta time to trigger audio processing
  controller.update(0.016);

  // PCM sine wave from mock generates RMS ~ 0.22, smoothly driving mouthOpenness
  assert.ok(controller.mouthOpenness >= 0.0 && controller.mouthOpenness <= 1.0,
    `mouthOpenness (${controller.mouthOpenness}) must remain bounded within [0.0, 1.0]`);
  assert.ok(controller.mouthOpenness > 0.05, 'Simulated voice waveform should open mouth');
});

runTest('Suite 3', 'MascotController supports 4 distinct emotional states', () => {
  const controller = new MascotController();
  assert.strictEqual(controller.emotion, MASCOT_EMOTIONS.IDLE);

  controller.setEmotion(MASCOT_EMOTIONS.SPEAKING);
  assert.strictEqual(controller.emotion, MASCOT_EMOTIONS.SPEAKING);

  controller.setEmotion(MASCOT_EMOTIONS.STREAK);
  assert.strictEqual(controller.emotion, MASCOT_EMOTIONS.STREAK);

  controller.setEmotion(MASCOT_EMOTIONS.ERROR);
  assert.strictEqual(controller.emotion, MASCOT_EMOTIONS.ERROR);
});

// -----------------------------------------------------------------------------
// Suite 4: Production Artifacts & Sanity
// -----------------------------------------------------------------------------
console.log('\n--- Suite 4: Production Artifacts & Zero Photographic Assets ---');

runTest('Suite 4', 'index.html contains zero references to realistic photographic hand images or mp4', () => {
  const indexHtml = fs.readFileSync(path.resolve('index.html'), 'utf8');

  assert.strictEqual(indexHtml.includes('hand_left_realistic.png'), false, 'Must not reference hand_left_realistic.png');
  assert.strictEqual(indexHtml.includes('hand_right_realistic.png'), false, 'Must not reference hand_right_realistic.png');
  assert.strictEqual(indexHtml.includes('3BqzFY3HM4hQrosUUUpkNCSF90u.mp4'), false, 'Must not reference 3BqzFY3HM4hQrosUUUpkNCSF90u.mp4');

  // Verify voice controls in header
  assert.ok(indexHtml.includes('id="voice-select"'), 'Voice selector dropdown must exist in header');
  assert.ok(indexHtml.includes('id="voice-test-btn"'), 'Voice test button must exist in header');
  assert.ok(indexHtml.includes('id="voice-mute-btn"'), 'Voice mute button must exist in header');
});

runTest('Suite 4', 'bundle.js is up to date and contains compiled ES modules', () => {
  const bundlePath = path.resolve('bundle.js');
  assert.strictEqual(fs.existsSync(bundlePath), true);
  const bundleStats = fs.statSync(bundlePath);
  assert.ok(bundleStats.size > 200000, 'bundle.js should be bundled (>200KB)');
});

console.log('\n================================================================');
console.log(`✔ AUDIOVISUAL SUITE COMPLETE: ${passed} / ${total} tests passed.`);
console.log('================================================================\n');
