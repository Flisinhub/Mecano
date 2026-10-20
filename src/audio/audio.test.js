/**
 * audio.test.js - Comprehensive Test Suite for Procedural Audio & Accessibility (R5)
 * 
 * Verifies:
 * - ProceduralAudio: Pentatonic scale synthesis, ADSR envelopes, miss wood thud, volume/mute, EventBus binding.
 * - VoiceQueue: Priority scheduling (CRITICAL, HIGH, NORMAL, LOW), preemption, anti-overlap, rate throttling (>25 PPM), phonetic vs letter name modes.
 * - AccessibilityPanel: 3 independent volume channels, dyslexia typography toggle, high-contrast toggle, storage persistence.
 * - audio.css: Existence and CSS rule completeness.
 */

import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { ProceduralAudio, PENTATONIC_SCALE } from './ProceduralAudio.js';
import { VoiceQueue, VOICE_PRIORITIES, PRONUNCIATION_MODES, SPANISH_LETTER_NAMES, SPANISH_PHONETIC_SOUNDS } from './VoiceQueue.js';
import { AccessibilityPanel, DYSLEXIA_FONTS, DEFAULT_A11Y_SETTINGS, STORAGE_KEY_A11Y } from './AccessibilityPanel.js';
import { EventBus, EVENTS } from '../core/EventBus.js';
import { StorageManager } from '../core/StorageManager.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('--- STARTING COMPREHENSIVE M5 AUDIO & A11Y VERIFICATION ---');

// ============================================================================
// Mock Web Audio Context for Node.js Testing
// ============================================================================
class MockAudioParam {
  constructor(defaultValue = 0) {
    this.value = defaultValue;
    this.events = [];
  }

  setValueAtTime(val, time) {
    this.value = val;
    this.events.push({ type: 'setValueAtTime', value: val, time });
  }

  exponentialRampToValueAtTime(val, time) {
    this.value = val;
    this.events.push({ type: 'exponentialRampToValueAtTime', value: val, time });
  }
}

class MockAudioNode {
  constructor(type = 'generic') {
    this.nodeType = type;
    this.connectedTo = null;
  }

  connect(target) {
    this.connectedTo = target;
  }
}

class MockOscillatorNode extends MockAudioNode {
  constructor() {
    super('oscillator');
    this.type = 'sine';
    this.frequency = new MockAudioParam(440);
    this.startedAt = null;
    this.stoppedAt = null;
  }

  start(time) {
    this.startedAt = time;
  }

  stop(time) {
    this.stoppedAt = time;
  }
}

class MockGainNode extends MockAudioNode {
  constructor() {
    super('gain');
    this.gain = new MockAudioParam(1.0);
  }
}

class MockBiquadFilterNode extends MockAudioNode {
  constructor() {
    super('biquadFilter');
    this.type = 'lowpass';
    this.frequency = new MockAudioParam(350);
    this.Q = new MockAudioParam(1.0);
  }
}

class TestAudioContext {
  constructor() {
    this.currentTime = 0.5;
    this.state = 'suspended';
    this.destination = new MockAudioNode('destination');
    this.createdNodes = [];
    this.resumed = false;
  }

  createOscillator() {
    const node = new MockOscillatorNode();
    this.createdNodes.push(node);
    return node;
  }

  createGain() {
    const node = new MockGainNode();
    this.createdNodes.push(node);
    return node;
  }

  createBiquadFilter() {
    const node = new MockBiquadFilterNode();
    this.createdNodes.push(node);
    return node;
  }

  resume() {
    this.state = 'running';
    this.resumed = true;
    return Promise.resolve();
  }

  suspend() {
    this.state = 'suspended';
    this.resumed = false;
    return Promise.resolve();
  }

  close() {
    this.state = 'closed';
    return Promise.resolve();
  }
}

// ============================================================================
// Mock SpeechSynthesis for Node.js Testing
// ============================================================================
class TestSpeechSynthesisUtterance {
  constructor(text = '') {
    this.text = text;
    this.lang = 'es-ES';
    this.volume = 1.0;
    this.rate = 1.0;
    this.pitch = 1.0;
    this.voice = null;
    this.onstart = null;
    this.onend = null;
    this.onerror = null;
  }
}

class TestSpeechSynthesis {
  constructor() {
    this.spokenUtterances = [];
    this.speaking = false;
    this.cancelled = false;
  }

  getVoices() {
    return [
      { name: 'Pablo Spanish', lang: 'es-ES' },
      { name: 'Laura Spanish', lang: 'es-MX' },
      { name: 'Alex English', lang: 'en-US' }
    ];
  }

  speak(utterance) {
    this.speaking = true;
    this.spokenUtterances.push(utterance);
    if (typeof utterance.onstart === 'function') {
      utterance.onstart();
    }
  }

  simulateEnd(index = null) {
    const target = index !== null ? this.spokenUtterances[index] : this.spokenUtterances[this.spokenUtterances.length - 1];
    if (target) {
      this.speaking = false;
      if (typeof target.onend === 'function') {
        target.onend();
      }
    }
  }

  cancel() {
    this.speaking = false;
    this.cancelled = true;
  }
}

// ============================================================================
// Mock DOM Document for Node.js Testing
// ============================================================================
class MockClassList {
  constructor() {
    this._classes = new Set();
  }
  add(...names) {
    names.forEach(n => this._classes.add(n));
  }
  remove(...names) {
    names.forEach(n => this._classes.delete(n));
  }
  toggle(name, force) {
    if (force !== undefined) {
      if (force) this._classes.add(name);
      else this._classes.delete(name);
      return force;
    }
    if (this._classes.has(name)) {
      this._classes.delete(name);
      return false;
    }
    this._classes.add(name);
    return true;
  }
  contains(name) {
    return this._classes.has(name);
  }
}

class MockElement {
  constructor(tagName = 'div') {
    this.tagName = tagName.toUpperCase();
    this.id = '';
    this.className = '';
    this.classList = new MockClassList();
    this.attributes = new Map();
    this.children = [];
    this.parentNode = null;
    this.innerHTML = '';
    this.textContent = '';
    this.value = '';
    this.eventListeners = new Map();
  }

  setAttribute(k, v) { this.attributes.set(k, String(v)); }
  getAttribute(k) { return this.attributes.get(k) || null; }
  hasAttribute(k) { return this.attributes.has(k); }
  removeAttribute(k) { this.attributes.delete(k); }

  appendChild(child) {
    child.parentNode = this;
    this.children.push(child);
    return child;
  }

  removeChild(child) {
    const idx = this.children.indexOf(child);
    if (idx !== -1) {
      this.children.splice(idx, 1);
      child.parentNode = null;
    }
    return child;
  }

  addEventListener(event, fn) {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event).push(fn);
  }

  querySelector(selector) {
    if (selector.startsWith('#')) {
      const targetId = selector.slice(1);
      if (this.id === targetId) return this;
      for (const ch of this.children) {
        if (ch.querySelector) {
          const res = ch.querySelector(selector);
          if (res) return res;
        }
      }
    }
    return new MockElement('mock');
  }

  querySelectorAll(selector) {
    return [new MockElement('mock')];
  }
}

// Attach minimal mock document for AccessibilityPanel testing
const mockBody = new MockElement('body');
globalThis.document = {
  body: mockBody,
  createElement(tag) { return new MockElement(tag); },
  getElementById(id) {
    if (id === 'a11y-backdrop') return null;
    return new MockElement('div');
  }
};
globalThis.window = {
  addEventListener() {},
  removeEventListener() {}
};

// ============================================================================
// TEST SUITE 1: ProceduralAudio.js
// ============================================================================
console.log('\n--- 1. Testing ProceduralAudio ---');

// 1.1 Scale Definition
assert.strictEqual(PENTATONIC_SCALE.length, 11, 'Pentatonic scale must contain 11 steps (C4 to C6)');
assert.strictEqual(PENTATONIC_SCALE[0], 261.63, 'Step 0 must be C4 = 261.63 Hz');
assert.strictEqual(PENTATONIC_SCALE[4], 440.00, 'Step 4 must be A4 = 440.00 Hz');
assert.strictEqual(PENTATONIC_SCALE[5], 523.25, 'Step 5 must be C5 = 523.25 Hz');
assert.strictEqual(PENTATONIC_SCALE[10], 1046.50, 'Step 10 must be C6 = 1046.50 Hz');
console.log('✓ Pentatonic scale frequencies verified.');

// 1.2 Initialization & Autoplay Recovery
const mockAudioCtx = new TestAudioContext();
const audio = new ProceduralAudio({ audioContext: mockAudioCtx, volume: 0.8 });
assert.strictEqual(audio.getVolume(), 0.8);
assert.strictEqual(audio.isMuted(), false);

await audio.resume();
assert.strictEqual(mockAudioCtx.resumed, true, 'resume() should transition AudioContext to running');
console.log('✓ Initialization & autoplay recovery verified.');

// 1.3 Success Synthesizer & ADSR Envelope
const initialNodeCount = mockAudioCtx.createdNodes.length;
const freqCombo1 = audio.playSuccess(1);
assert.strictEqual(freqCombo1, 261.63, 'Combo 1 must synthesize C4 (261.63 Hz)');

const oscNode = mockAudioCtx.createdNodes.find(n => n.nodeType === 'oscillator' && n.frequency.value === 261.63);
assert.ok(oscNode, 'Oscillator node must be created with frequency 261.63 Hz');
assert.strictEqual(oscNode.type, 'sine', 'Success tone must use a sine wave');

const gainNode = mockAudioCtx.createdNodes.find(n => n.nodeType === 'gain');
assert.ok(gainNode, 'Gain node must be created');
const attackEvent = gainNode.gain.events.find(e => e.time === mockAudioCtx.currentTime + 0.008);
assert.ok(attackEvent, 'Gain must have 8ms attack exponential ramp');
const decayEvent = gainNode.gain.events.find(e => e.time === mockAudioCtx.currentTime + 0.14);
assert.ok(decayEvent, 'Gain must have 140ms decay exponential ramp');

// Ascending scale progression
const freqCombo5 = audio.playSuccess(5);
assert.strictEqual(freqCombo5, 440.00, 'Combo 5 must synthesize A4 (440.00 Hz)');

const freqCombo11 = audio.playSuccess(11);
assert.strictEqual(freqCombo11, 1046.50, 'Combo 11 must synthesize C6 (1046.50 Hz)');

// Clamp at C6 without piercing children's ears
const freqCombo20 = audio.playSuccess(20);
assert.strictEqual(freqCombo20, 1046.50, 'Combo > 11 must clamp at C6 (1046.50 Hz)');
console.log('✓ Ascending pentatonic scale & ADSR envelope verified.');

// 1.4 Dull Wood / Rubber Miss Tone
const missStartNodeCount = mockAudioCtx.createdNodes.length;
audio.playMiss();

const triangleOsc = mockAudioCtx.createdNodes.slice(missStartNodeCount).find(n => n.type === 'triangle');
assert.ok(triangleOsc, 'Miss sound must use triangle wave');
assert.strictEqual(triangleOsc.frequency.value, 55, 'Miss sound pitch must sweep down to 55 Hz');

const lowpassFilter = mockAudioCtx.createdNodes.slice(missStartNodeCount).find(n => n.nodeType === 'biquadFilter');
assert.ok(lowpassFilter, 'Miss sound must use lowpass biquad filter');
assert.strictEqual(lowpassFilter.frequency.value, 380, 'Lowpass cutoff must be 380 Hz');
assert.strictEqual(lowpassFilter.Q.value, 2.0, 'Resonance Q must be 2.0');
console.log('✓ Dull wood/rubber miss tone verified.');

// 1.5 Volume & Mute Control
audio.setVolume(0.5);
assert.strictEqual(audio.getVolume(), 0.5);
audio.setVolume(1.5); // Clamping
assert.strictEqual(audio.getVolume(), 1.0);
audio.setVolume(-0.5);
assert.strictEqual(audio.getVolume(), 0.0);

audio.setMuted(true);
assert.strictEqual(audio.isMuted(), true);
const mutedFreq = audio.playSuccess(1);
assert.strictEqual(mutedFreq, 0, 'Muted audio should synthesize nothing');
audio.setMuted(false);
audio.setVolume(0.8);
console.log('✓ Volume and mute controls verified.');

// 1.6 EventBus Integration
const bus = new EventBus();
const unbind = audio.bindEventBus(bus);

let lastCreated = mockAudioCtx.createdNodes.length;
bus.emit('KEY_PRESSED_SUCCESS', {
  key: 'f',
  comboCount: 3,
  accuracy: 100,
  keyScreenPosition: { x: 10, y: 10 }
});
assert.strictEqual(mockAudioCtx.createdNodes.length > lastCreated, true, 'KEY_PRESSED_SUCCESS must trigger synthesizer');

lastCreated = mockAudioCtx.createdNodes.length;
bus.emit('KEY_PRESSED_FAIL', {
  pressedKey: 'd',
  expectedKey: 'f',
  consecutiveErrors: 1
});
assert.strictEqual(mockAudioCtx.createdNodes.length > lastCreated, true, 'KEY_PRESSED_FAIL must trigger miss sound');

unbind();
audio.dispose();
console.log('✓ EventBus audio subscription verified.');

// ============================================================================
// TEST SUITE 2: VoiceQueue.js
// ============================================================================
console.log('\n--- 2. Testing VoiceQueue ---');

const mockSynth = new TestSpeechSynthesis();
const voiceQueue = new VoiceQueue({
  speechSynthesis: mockSynth,
  SpeechSynthesisUtterance: TestSpeechSynthesisUtterance,
  volume: 0.9
});

// 2.1 Priorities & Queuing
assert.strictEqual(VOICE_PRIORITIES.CRITICAL, 4);
assert.strictEqual(VOICE_PRIORITIES.HIGH, 3);
assert.strictEqual(VOICE_PRIORITIES.NORMAL, 2);
assert.strictEqual(VOICE_PRIORITIES.LOW, 1);

// Enqueue Normal and Low
voiceQueue.speak({ text: 'Frase normal 1', priority: 'NORMAL' });
assert.strictEqual(voiceQueue.isSpeaking(), true);
assert.strictEqual(mockSynth.spokenUtterances.length, 1);
assert.strictEqual(mockSynth.spokenUtterances[0].text, 'Frase normal 1');

voiceQueue.speak({ text: 'Frase baja 2', priority: 'LOW' });
assert.strictEqual(voiceQueue.getQueueLength(), 1);

// 2.2 Higher-Priority Preemption
// CRITICAL cancels ongoing speech and empties lower priority items
voiceQueue.speak({ text: '¡Victoria! ¡Nivel Completado!', priority: 'CRITICAL' });
assert.strictEqual(mockSynth.cancelled, true, 'CRITICAL must cancel ongoing utterance');
assert.strictEqual(voiceQueue.isSpeaking(), true);
assert.strictEqual(mockSynth.spokenUtterances[mockSynth.spokenUtterances.length - 1].text, '¡Victoria! ¡Nivel Completado!');
console.log('✓ Priority scheduling & CRITICAL preemption verified.');

// Simulate utterance finish
mockSynth.simulateEnd();

// 2.3 Speed Throttling (> 25 PPM)
voiceQueue.setTypingRate(15); // Normal speed
const normalAccepted = voiceQueue.speak({
  text: 'Recuerda mirar la pantalla y no el teclado',
  priority: 'NORMAL'
});
assert.strictEqual(normalAccepted, true);
assert.strictEqual(mockSynth.spokenUtterances[mockSynth.spokenUtterances.length - 1].text, 'Recuerda mirar la pantalla y no el teclado');
mockSynth.simulateEnd();

// High typing speed: PPM = 35 (> 25 PPM)
voiceQueue.setTypingRate(35);
voiceQueue.speak({
  text: 'Excelente progreso, sigue manteniendo los dedos relajados',
  priority: 'NORMAL'
});
const lastUtterance = mockSynth.spokenUtterances[mockSynth.spokenUtterances.length - 1];
// Must have replaced verbose commentary with short interjection
assert.ok(
  lastUtterance.text.startsWith('¡') && lastUtterance.text.endsWith('!'),
  `Verbose text must be throttled to short interjection when PPM > 25, got: "${lastUtterance.text}"`
);
assert.ok(lastUtterance.text.length < 15, 'Interjection must be short');
console.log('✓ Speed-based throttling (>25 PPM) verified.');
mockSynth.simulateEnd();

// 2.4 Phonetic Mode vs Letter Name Mode
voiceQueue.setPronunciationMode(PRONUNCIATION_MODES.LETTER_NAME);
voiceQueue.speakKey('f');
assert.strictEqual(
  mockSynth.spokenUtterances[mockSynth.spokenUtterances.length - 1].text,
  'efe',
  'Letter name mode must pronounce "efe" for key "f"'
);
mockSynth.simulateEnd();

voiceQueue.setPronunciationMode(PRONUNCIATION_MODES.PHONETIC);
voiceQueue.speakKey('f');
assert.strictEqual(
  mockSynth.spokenUtterances[mockSynth.spokenUtterances.length - 1].text,
  'fff',
  'Phonetic mode must pronounce "fff" for key "f"'
);
mockSynth.simulateEnd();

voiceQueue.speakKey('j');
assert.strictEqual(
  mockSynth.spokenUtterances[mockSynth.spokenUtterances.length - 1].text,
  'jjj',
  'Phonetic mode must pronounce "jjj" for key "j"'
);
mockSynth.simulateEnd();
console.log('✓ Letter name and phonetic pronunciation modes verified.');

// 2.5 EventBus Integration
voiceQueue.setTypingRate(0); // Reset typing rate so general mascot dialogue is not throttled
const voiceBus = new EventBus();
voiceQueue.bindEventBus(voiceBus);

voiceBus.emit('MASCOT_SPEAK_REQUEST', {
  text: '¡Hola pequeño mecanógrafo!',
  priority: 'NORMAL',
  emotion: 'happy'
});
assert.strictEqual(mockSynth.spokenUtterances[mockSynth.spokenUtterances.length - 1].text, '¡Hola pequeño mecanógrafo!');
mockSynth.simulateEnd();

voiceBus.emit('USER_STUCK', {
  expectedKey: 'j',
  finger: 'ri',
  idleTimeMs: 2000
});
assert.ok(
  mockSynth.spokenUtterances[mockSynth.spokenUtterances.length - 1].text.includes('jota') ||
  mockSynth.spokenUtterances[mockSynth.spokenUtterances.length - 1].text.includes('j'),
  'USER_STUCK must advise on expected key'
);
mockSynth.simulateEnd();

voiceBus.emit('LEVEL_COMPLETED', {
  levelId: 1,
  stars: 3,
  accuracy: 100,
  wpm: 30
});
assert.ok(
  mockSynth.spokenUtterances[mockSynth.spokenUtterances.length - 1].text.includes('estrellas') ||
  mockSynth.spokenUtterances[mockSynth.spokenUtterances.length - 1].text.includes('completado'),
  'LEVEL_COMPLETED must speak victory congratulations'
);

voiceQueue.dispose();
console.log('✓ VoiceQueue EventBus integration verified.');

// ============================================================================
// TEST SUITE 3: AccessibilityPanel.js
// ============================================================================
console.log('\n--- 3. Testing AccessibilityPanel ---');

const storage = new StorageManager();
const a11yPanel = new AccessibilityPanel({
  storage,
  proceduralAudio: audio,
  voiceQueue: voiceQueue
});

// 3.1 Initial Settings
const initialSettings = a11yPanel.getSettings();
assert.strictEqual(initialSettings.musicVolume, DEFAULT_A11Y_SETTINGS.musicVolume);
assert.strictEqual(initialSettings.sfxVolume, DEFAULT_A11Y_SETTINGS.sfxVolume);
assert.strictEqual(initialSettings.voiceVolume, DEFAULT_A11Y_SETTINGS.voiceVolume);
assert.strictEqual(initialSettings.highContrast, false);
assert.strictEqual(initialSettings.dyslexiaFont, DYSLEXIA_FONTS.DEFAULT);

// 3.2 Volume Sliders & Engine Synchronization
a11yPanel.setMusicVolume(0.65);
assert.strictEqual(a11yPanel.getMusicVolume(), 0.65);

a11yPanel.setSfxVolume(0.45);
assert.strictEqual(a11yPanel.getSfxVolume(), 0.45);
assert.strictEqual(audio.getVolume(), 0.45, 'ProceduralAudio volume must synchronize with SFX slider');

a11yPanel.setVoiceVolume(0.75);
assert.strictEqual(a11yPanel.getVoiceVolume(), 0.75);
assert.strictEqual(voiceQueue.getVolume(), 0.75, 'VoiceQueue volume must synchronize with Voice slider');
console.log('✓ 3-channel independent volume sliders & engine synchronization verified.');

// 3.3 High-Contrast Mode & DOM Class Toggling
assert.strictEqual(mockBody.classList.contains('high-contrast'), false);
a11yPanel.setHighContrast(true);
assert.strictEqual(a11yPanel.getHighContrast(), true);
assert.strictEqual(mockBody.classList.contains('high-contrast'), true, 'body must contain .high-contrast');

a11yPanel.toggleHighContrast();
assert.strictEqual(a11yPanel.getHighContrast(), false);
assert.strictEqual(mockBody.classList.contains('high-contrast'), false);
console.log('✓ High-contrast mode toggle verified.');

// 3.4 Dyslexia Typography Toggle
a11yPanel.setDyslexiaFont(DYSLEXIA_FONTS.OPENDYSLEXIC);
assert.strictEqual(a11yPanel.getDyslexiaFont(), 'opendyslexic');
assert.strictEqual(mockBody.classList.contains('font-dyslexic'), true, 'body must contain .font-dyslexic');
assert.strictEqual(mockBody.classList.contains('font-opendyslexic'), true, 'body must contain .font-opendyslexic');

a11yPanel.setDyslexiaFont(DYSLEXIA_FONTS.COMICSANS);
assert.strictEqual(a11yPanel.getDyslexiaFont(), 'comicsans');
assert.strictEqual(mockBody.classList.contains('font-dyslexic'), true);
assert.strictEqual(mockBody.classList.contains('font-comicsans'), true);
assert.strictEqual(mockBody.classList.contains('font-opendyslexic'), false);

a11yPanel.setDyslexiaFont(DYSLEXIA_FONTS.DEFAULT);
assert.strictEqual(mockBody.classList.contains('font-dyslexic'), false);
console.log('✓ Dyslexia typography toggle verified.');

// 3.5 Storage Persistence
a11yPanel.updateSettings({
  musicVolume: 0.9,
  sfxVolume: 0.85,
  highContrast: true,
  dyslexiaFont: DYSLEXIA_FONTS.OPENDYSLEXIC
});

// Create fresh instance loading from same storage
const restoredPanel = new AccessibilityPanel({ storage });
const restoredSettings = restoredPanel.getSettings();
assert.strictEqual(restoredSettings.musicVolume, 0.9);
assert.strictEqual(restoredSettings.sfxVolume, 0.85);
assert.strictEqual(restoredSettings.highContrast, true);
assert.strictEqual(restoredSettings.dyslexiaFont, 'opendyslexic');
console.log('✓ Settings persistence across sessions verified.');

// 3.6 Modal UI Operations
const container = new MockElement('div');
a11yPanel.mount(container);
assert.strictEqual(a11yPanel.isOpen(), false);
a11yPanel.open();
assert.strictEqual(a11yPanel.isOpen(), true);
a11yPanel.close();
assert.strictEqual(a11yPanel.isOpen(), false);
a11yPanel.destroy();
console.log('✓ AccessibilityPanel modal lifecycle verified.');

// ============================================================================
// TEST SUITE 4: audio.css Verification
// ============================================================================
console.log('\n--- 4. Testing audio.css ---');
const cssPath = path.resolve(__dirname, 'audio.css');
assert.strictEqual(fs.existsSync(cssPath), true, 'audio.css must exist');
const cssContent = fs.readFileSync(cssPath, 'utf-8');

assert.ok(cssContent.includes('.font-dyslexic'), 'audio.css must contain .font-dyslexic');
assert.ok(cssContent.includes('.font-opendyslexic'), 'audio.css must contain .font-opendyslexic');
assert.ok(cssContent.includes('.font-comicsans'), 'audio.css must contain .font-comicsans');
assert.ok(cssContent.includes('.high-contrast'), 'audio.css must contain .high-contrast');
assert.ok(cssContent.includes('--color-pinky'), 'audio.css must define high contrast neon finger colors');
assert.ok(cssContent.includes('--color-thumb'), 'audio.css must define high contrast thumb color');
assert.ok(cssContent.includes('.a11y-panel'), 'audio.css must style .a11y-panel');
assert.ok(cssContent.includes('.a11y-slider-row'), 'audio.css must style sliders');
console.log('✓ audio.css completeness verified.');

console.log('\n================================================================================');
console.log('✔ ALL M5 AUDIO & ACCESSIBILITY TESTS PASSED WITH 100% SUCCESS');
console.log('================================================================================\n');
