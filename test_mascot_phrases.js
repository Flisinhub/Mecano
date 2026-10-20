/**
 * test_mascot_phrases.js - Verification Suite for Mascot Pedagogical Phrases Catalog
 */

import assert from 'node:assert';
import {
  PHRASE_CATEGORIES,
  POSTURE_TIPS,
  HOME_ROW_TIPS,
  TECHNIQUE_TIPS,
  ANTI_FRUSTRATION_TIPS,
  BREAK_EXERCISES,
  STREAK_CELEBRATIONS,
  STUCK_HINTS,
  LEVEL_VICTORY_PHRASES,
  MASCOT_GREETINGS,
  ALL_PEDAGOGICAL_TIPS,
  getNextPedagogicalTip,
  getRandomTip,
  getRandomStreakPhrase,
  getStuckHint,
  getVictoryPhrase,
  getRandomGreeting
} from './src/mascot/MascotPhrases.js';
import { cleanSpeechText } from './src/audio/VoiceQueue.js';

console.log('================================================================');
console.log('       MECANO MASCOT PEDAGOGICAL PHRASES TEST SUITE             ');
console.log('================================================================\n');

let passed = 0;
function test(name, fn) {
  try {
    fn();
    console.log(`  ✔ ${name}`);
    passed++;
  } catch (err) {
    console.error(`  ✖ ${name}:`, err);
    process.exit(1);
  }
}

test('Phrase categories are frozen and well-defined', () => {
  assert.ok(PHRASE_CATEGORIES.POSTURE);
  assert.ok(PHRASE_CATEGORIES.HOME_ROW);
  assert.ok(PHRASE_CATEGORIES.TECHNIQUE);
  assert.ok(PHRASE_CATEGORIES.ANTI_FRUSTRATION);
  assert.ok(PHRASE_CATEGORIES.BREAKS);
  assert.ok(PHRASE_CATEGORIES.STREAKS);
  assert.ok(PHRASE_CATEGORIES.STUCK);
  assert.ok(PHRASE_CATEGORIES.VICTORY);
  assert.ok(PHRASE_CATEGORIES.GREETINGS);
});

test('All pedagogical categories contain curated, high-quality tips', () => {
  assert.ok(POSTURE_TIPS.length >= 6, `Expected >= 6 posture tips, got ${POSTURE_TIPS.length}`);
  assert.ok(HOME_ROW_TIPS.length >= 6, `Expected >= 6 home row tips, got ${HOME_ROW_TIPS.length}`);
  assert.ok(TECHNIQUE_TIPS.length >= 6, `Expected >= 6 technique tips, got ${TECHNIQUE_TIPS.length}`);
  assert.ok(ANTI_FRUSTRATION_TIPS.length >= 6, `Expected >= 6 anti-frustration tips, got ${ANTI_FRUSTRATION_TIPS.length}`);
  assert.ok(BREAK_EXERCISES.length >= 5, `Expected >= 5 break exercises, got ${BREAK_EXERCISES.length}`);
  assert.ok(STREAK_CELEBRATIONS.length >= 5, `Expected >= 5 streak celebrations, got ${STREAK_CELEBRATIONS.length}`);
  assert.ok(STUCK_HINTS.length >= 5, `Expected >= 5 stuck hints, got ${STUCK_HINTS.length}`);
  assert.ok(LEVEL_VICTORY_PHRASES.length >= 5, `Expected >= 5 level victory phrases, got ${LEVEL_VICTORY_PHRASES.length}`);
  assert.ok(MASCOT_GREETINGS.length >= 5, `Expected >= 5 mascot greetings, got ${MASCOT_GREETINGS.length}`);
});

test('ALL_PEDAGOGICAL_TIPS combines all core categories with structured properties', () => {
  const expectedTotal = POSTURE_TIPS.length + HOME_ROW_TIPS.length + TECHNIQUE_TIPS.length + ANTI_FRUSTRATION_TIPS.length + BREAK_EXERCISES.length;
  assert.strictEqual(ALL_PEDAGOGICAL_TIPS.length, expectedTotal);

  for (const tip of ALL_PEDAGOGICAL_TIPS) {
    assert.ok(tip.id, 'Tip must have an id');
    assert.ok(tip.category, 'Tip must have a category');
    assert.ok(tip.categoryLabel, 'Tip must have a categoryLabel');
    assert.ok(tip.icon, 'Tip must have an icon');
    assert.ok(tip.title, 'Tip must have a title');
    assert.ok(tip.text, 'Tip must have display text');
    assert.ok(tip.speechText, 'Tip must have speechText for TTS');
  }
});

test('getNextPedagogicalTip cycles sequentially through all tips without error', () => {
  const seenIds = new Set();
  for (let i = 0; i < ALL_PEDAGOGICAL_TIPS.length; i++) {
    const tip = getNextPedagogicalTip();
    assert.ok(tip && tip.id, 'Cycled tip must be valid object');
    seenIds.add(tip.id);
  }
  assert.strictEqual(seenIds.size, ALL_PEDAGOGICAL_TIPS.length, 'Sequential cycle must visit every tip once');
});

test('getRandomTip supports category filtering', () => {
  const postureTip = getRandomTip('posture');
  assert.strictEqual(postureTip.category, 'posture');

  const breaksTip = getRandomTip('breaks');
  assert.strictEqual(breaksTip.category, 'breaks');
});

test('getStuckHint returns context-aware hints for F, J, Space and general keys', () => {
  const hintF = getStuckHint('f', 'dedo índice izquierdo', 'verde menta');
  assert.ok(hintF.includes('[F]'), 'Should mention [F]');
  assert.ok(hintF.toLowerCase().includes('montañita') || hintF.toLowerCase().includes('índice'));

  const hintJ = getStuckHint('j', 'dedo índice derecho', 'azul cielo');
  assert.ok(hintJ.includes('[J]'), 'Should mention [J]');
  assert.ok(hintJ.toLowerCase().includes('montañita') || hintJ.toLowerCase().includes('índice'));

  const hintSpace = getStuckHint(' ', 'dedo pulgar', 'violeta mágico');
  assert.ok(hintSpace.includes('pulgar') || hintSpace.includes('Espaciadora'));

  const hintA = getStuckHint('a', 'dedo meñique izquierdo', 'coral');
  assert.ok(hintA.includes('[A]'));
});

test('VoiceQueue cleanSpeechText strips emojis cleanly from all pedagogical phrases', () => {
  for (const tip of ALL_PEDAGOGICAL_TIPS) {
    const cleanSpeech = cleanSpeechText(tip.speechText);
    assert.ok(cleanSpeech.length > 10, 'Speech text should remain substantial after emoji removal');
    // Ensure no emojis or repetitive robot prefixes remain
    assert.ok(!cleanSpeech.includes('💡'), 'Should not contain lightbulb emoji');
    assert.ok(!cleanSpeech.includes('🧘'), 'Should not contain posture emoji');
    assert.ok(!cleanSpeech.includes('Consejo de Roby:'), 'Should strip robotic prefixes');
  }

  for (const phrase of STREAK_CELEBRATIONS) {
    const clean = cleanSpeechText(phrase);
    assert.ok(clean.length > 5);
    assert.ok(!clean.includes('🚀') && !clean.includes('🔥'));
  }
});

console.log(`\n✔ ALL ${passed} MASCOT PHRASE CHECKS PASSED!\n`);
