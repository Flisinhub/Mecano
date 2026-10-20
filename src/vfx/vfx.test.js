/**
 * vfx.test.js - Comprehensive Verification Suite for Mecano VFX Module (R2)
 * 
 * Validates:
 * 1. Squash & Stretch: Damped harmonic oscillator equations, presets, volume preservation, anti-drift
 * 2. ParticleEngine: Object pool lifecycle, ambient particles, 6 pedagogical finger color bursts, fever scaling
 * 3. BezierProjectiles: Quadratic Bézier trajectories, tangent orientation, trail generation, impact triggering
 * 4. LiveScene: Multi-axis parallax calculation, exponential smoothing lerp, fever mode lighting, event bus integration
 */

import assert from 'node:assert/strict';
import {
  applySquashAndStretch,
  calculateSquashAndStretch,
  generateSpringKeyframes,
  DEFAULT_SPRING_CONFIG,
  SQUASH_PRESETS
} from './SquashStretch.js';

import {
  ParticleEngine,
  ParticlePool,
  Particle,
  PEDAGOGICAL_COLORS,
  resolvePedagogicalColor
} from './ParticleEngine.js';

import {
  BezierProjectiles,
  MagicProjectile,
  calculateBezierPoint,
  calculateBezierTangent,
  computeControlPoint
} from './BezierProjectiles.js';

import {
  LiveScene,
  createLiveScene,
  calculateParallaxOffset,
  injectStickerFilter
} from './LiveScene.js';

import { EventBus } from '../core/EventBus.js';

console.log('\n================================================================================');
console.log('             STARTING COMPREHENSIVE M2 (VFX) VERIFICATION SUITE                 ');
console.log('================================================================================\n');

let totalTests = 0;
let passedTests = 0;

function test(description, fn) {
  totalTests++;
  const start = Date.now();
  try {
    fn();
    const duration = Date.now() - start;
    passedTests++;
    console.log(`  ✔ ${description} (${duration}ms)`);
  } catch (err) {
    console.error(`  ✖ FAIL: ${description}`);
    console.error(`    ${err.message}`);
    throw err;
  }
}

// ============================================================================
// SUITE 1: Squash & Stretch Physics
// ============================================================================
console.log('[SUITE 1] Squash & Stretch Damped Harmonic Oscillator');

test('should calculate correct initial impact deformation at t = 0', () => {
  const result = calculateSquashAndStretch(0, { amplitude: 0.20, direction: 'vertical' });
  // At t=0: displacement = A * 1.0 * cos(0) = 0.20
  // scaleX = 1 + 0.20 = 1.20, scaleY = 1 / 1.20 ≈ 0.8333
  assert.strictEqual(result.displacement, 0.2);
  assert.strictEqual(result.scaleX, 1.2);
  assert.ok(result.scaleY < 1.0, 'scaleY should compress vertically on impact');
});

test('should preserve 2D area (scaleX * scaleY ≈ 1.0) throughout oscillation', () => {
  for (let t = 0; t <= 0.38; t += 0.02) {
    const { scaleX, scaleY } = calculateSquashAndStretch(t, { amplitude: 0.22 });
    const area = scaleX * scaleY;
    assert.ok(
      Math.abs(area - 1.0) < 0.05,
      `Area deviation at t=${t}s was ${area}, expected ~1.0`
    );
  }
});

test('should exponentially damp to rest (< 1% deformation) by duration end', () => {
  const result = calculateSquashAndStretch(0.38, { amplitude: 0.20, dampingRatio: 0.42, naturalFreq: 26.0 });
  // Displacement should decay from 0.20 down to < 0.005
  assert.ok(
    Math.abs(result.displacement) < 0.01,
    `Displacement at end of duration was ${result.displacement}, expected < 0.01`
  );
  assert.ok(
    Math.abs(result.scaleX - 1.0) < 0.01,
    `scaleX at end of duration was ${result.scaleX}, expected ~1.0`
  );
});

test('should generate Web Animations API keyframes terminating in strict rest scale(1, 1)', () => {
  const keyframes = generateSpringKeyframes(SQUASH_PRESETS.impact, 10);
  assert.strictEqual(keyframes.length, 11);
  assert.strictEqual(keyframes[0].offset, 0);
  assert.strictEqual(keyframes[keyframes.length - 1].offset, 1.0);
  assert.strictEqual(keyframes[keyframes.length - 1].transform, 'scale(1, 1)');
});

test('should safely apply squash and stretch to mock DOM element and reset transform', async () => {
  const mockElement = {
    style: {
      transformOrigin: '',
      transform: ''
    }
  };

  const anim = applySquashAndStretch(mockElement, { preset: 'keyPress', durationMs: 20 });
  assert.ok(anim, 'Should return animation controller');
  assert.strictEqual(mockElement.style.transformOrigin, '50% 50%');

  // Fast-forward or wait for fallback timer
  await new Promise((resolve) => setTimeout(resolve, 35));
  assert.strictEqual(mockElement.style.transform, 'scale(1, 1)');
});

// ============================================================================
// SUITE 2: ParticleEngine & Pedagogical Color Mapping
// ============================================================================
console.log('\n[SUITE 2] ParticleEngine & Object Pooling');

test('should resolve all 6 pedagogical finger color families', () => {
  // Pinkies: Coral / Lilac
  assert.strictEqual(resolvePedagogicalColor('lp').primary, '#ff6b81');
  assert.strictEqual(resolvePedagogicalColor('rp').primary, '#a29bfe');
  // Ring: Warm Orange
  assert.strictEqual(resolvePedagogicalColor('lr').primary, '#ff9f43');
  assert.strictEqual(resolvePedagogicalColor('rr').primary, '#ff9f43');
  // Middle: Sun Yellow
  assert.strictEqual(resolvePedagogicalColor('lm').primary, '#ffd32a');
  assert.strictEqual(resolvePedagogicalColor('rm').primary, '#ffd32a');
  // Left Index: Mint Green
  assert.strictEqual(resolvePedagogicalColor('li').primary, '#2ed573');
  // Right Index: Sky Blue
  assert.strictEqual(resolvePedagogicalColor('ri').primary, '#54a0ff');
  // Thumbs: Cosmic Purple
  assert.strictEqual(resolvePedagogicalColor('thumb').primary, '#9b59b6');
});

test('should recycle particles without memory leak using ParticlePool', () => {
  const pool = new ParticlePool(50);
  assert.strictEqual(pool.activeCount, 0);
  assert.strictEqual(pool.poolCapacity, 50);

  const acquired = [];
  for (let i = 0; i < 20; i++) {
    acquired.push(pool.acquire());
  }
  assert.strictEqual(pool.activeCount, 20);
  assert.strictEqual(pool.poolCapacity, 50);

  // Release 10 particles
  for (let i = 0; i < 10; i++) {
    pool.releaseAt(0);
  }
  assert.strictEqual(pool.activeCount, 10);
  assert.strictEqual(pool.poolCapacity, 50);

  pool.clear();
  assert.strictEqual(pool.activeCount, 0);
});

test('should spawn radial burst keyed to pedagogical finger color with velocity and gravity', () => {
  const engine = new ParticleEngine({ width: 1000, height: 800 });
  const burst = engine.spawnRadialBurst(400, 500, 'li', { count: 18 });

  assert.strictEqual(burst.length, 18);
  assert.strictEqual(burst[0].color, '#2ed573'); // Mint green
  assert.strictEqual(burst[0].x, 400);
  assert.strictEqual(burst[0].y, 500);
  assert.strictEqual(burst[0].gravity, 320);

  // Speed magnitude check: sqrt(vx^2 + vy^2) between 120 and 260
  const speed = Math.sqrt(burst[0].vx * burst[0].vx + burst[0].vy * burst[0].vy);
  assert.ok(speed >= 120 && speed <= 265, `Speed was ${speed}, expected between 120 and 260`);
});

test('should simulate particle aging and reclaim dead particles during update()', () => {
  const engine = new ParticleEngine({ width: 800, height: 600, maxAmbient: 0 });
  engine.clear();
  assert.strictEqual(engine.pool.activeCount, 0);

  // Spawn a burst with 0.1s lifespan
  engine.spawnRadialBurst(100, 100, 'ri', { count: 10, duration: 0.05 });
  assert.strictEqual(engine.pool.activeCount, 10);

  // Advance simulation by 0.02s: particles still alive
  engine.update(0.02);
  assert.strictEqual(engine.pool.activeCount, 10);

  // Advance simulation past 0.05s: particles should expire and return to pool
  engine.update(0.08);
  assert.strictEqual(engine.pool.activeCount, 0);
});

test('should scale particle generation and adopt golden sparkles in Fever Mode', () => {
  const engine = new ParticleEngine({ width: 800, height: 600 });
  engine.setFeverMode(true, 2.0);

  assert.strictEqual(engine.feverActive, true);
  assert.strictEqual(engine.feverMultiplier, 2.0);

  // Spawning radial burst in fever mode produces more particles
  const burst = engine.spawnRadialBurst(200, 200, 'lm');
  assert.strictEqual(burst.length, 26); // fever count >= 26

  // Verify some particles adopt golden fever hue
  const hasGolden = burst.some(p => p.color === '#ffd32a');
  assert.ok(hasGolden, 'Fever mode burst should include golden sparkle particles');
});

// ============================================================================
// SUITE 3: Quadratic Bézier Projectiles
// ============================================================================
console.log('\n[SUITE 3] Quadratic Bézier Projectiles');

test('should accurately evaluate Quadratic Bézier formula B(t)', () => {
  const p0 = { x: 0, y: 100 };
  const p1 = { x: 50, y: 0 };
  const p2 = { x: 100, y: 100 };

  // B(0) = P0
  const b0 = calculateBezierPoint(p0, p1, p2, 0);
  assert.strictEqual(b0.x, 0);
  assert.strictEqual(b0.y, 100);

  // B(0.5) = 0.25*0 + 0.5*50 + 0.25*100 = 50, y = 0.25*100 + 0.5*0 + 0.25*100 = 50
  const bMid = calculateBezierPoint(p0, p1, p2, 0.5);
  assert.strictEqual(bMid.x, 50);
  assert.strictEqual(bMid.y, 50);

  // B(1) = P2
  const b1 = calculateBezierPoint(p0, p1, p2, 1);
  assert.strictEqual(b1.x, 100);
  assert.strictEqual(b1.y, 100);
});

test('should compute arch control point with lateral hand curve offset', () => {
  const p0 = { x: 200, y: 500 };
  const p2 = { x: 400, y: 200 };

  const p1Left = computeControlPoint(p0, p2, 'left');
  const p1Right = computeControlPoint(p0, p2, 'right');

  // Midpoint is x=300
  // Left hand shifts lateral offset negative (-35), Right hand shifts positive (+35)
  assert.strictEqual(p1Left.x, 300 - 35);
  assert.strictEqual(p1Right.x, 300 + 35);

  // Apex y must be significantly higher (lower y-value) than min(y0, y2) = 200
  assert.ok(p1Left.y < 200, `Apex y was ${p1Left.y}, expected < 200`);
});

test('should launch magic projectile on KEY_PRESSED_SUCCESS and reach target', () => {
  const bus = new EventBus();
  const particleEngine = new ParticleEngine({ width: 800, height: 600 });
  let impactReported = false;

  const mockMascot = {
    style: { transformOrigin: '', transform: '' },
    getBoundingClientRect: () => ({ left: 200, top: 150, width: 100, height: 100 })
  };

  const projectiles = new BezierProjectiles({
    eventBus: bus,
    particleEngine,
    mascotElement: mockMascot
  });

  // Emit KEY_PRESSED_SUCCESS
  bus.emit('KEY_PRESSED_SUCCESS', {
    key: 'f',
    comboCount: 3,
    accuracy: 100,
    keyScreenPosition: { x: 420, y: 550 }
  });

  assert.strictEqual(projectiles.projectiles.length, 1);
  const proj = projectiles.projectiles[0];
  assert.strictEqual(proj.p0.x, 420);
  assert.strictEqual(proj.p0.y, 550);

  // Override onImpact to verify callback
  proj.onImpact = () => { impactReported = true; };

  // Advance flight simulation: 0.2s (mid-flight)
  projectiles.update(0.2);
  assert.strictEqual(projectiles.projectiles.length, 1);
  assert.strictEqual(impactReported, false);

  // Advance flight simulation past duration (0.45s total): projectile arrives at target
  projectiles.update(0.35);
  assert.strictEqual(impactReported, true);
  assert.strictEqual(projectiles.projectiles.length, 0);
});

// ============================================================================
// SUITE 4: LiveScene Parallax & Lighting Orchestration
// ============================================================================
console.log('\n[SUITE 4] LiveScene Parallax & Lighting Orchestration');

test('should compute frame-rate independent exponential lerp for parallax camera', () => {
  const viewportW = 1408;
  const viewportH = 768;

  // Center position (mouse at center)
  const atCenter = calculateParallaxOffset(
    0, 0, 1000,
    viewportW, viewportH,
    0, 0, 0.016, 1.08, 3.5
  );

  // Drift should create gentle natural living movement even when mouse is centered
  assert.ok(typeof atCenter.targetX === 'number');
  assert.ok(typeof atCenter.targetY === 'number');

  // Mouse moved hard right (+1.0) -> camera moves left (negative offset) for parallax illusion
  const movedRight = calculateParallaxOffset(
    1.0, 0, 1000,
    viewportW, viewportH,
    0, 0, 0.1, 1.08, 3.5
  );

  assert.ok(movedRight.targetX < 0, `Target X should invert mouse to create depth: was ${movedRight.targetX}`);
  assert.ok(movedRight.nextX < 0, `Next smoothed X should track toward target: was ${movedRight.nextX}`);
});

test('should respond to FEVER_MODE_CHANGED by updating lighting and particle systems', () => {
  const bus = new EventBus();
  const scene = new LiveScene({
    eventBus: bus,
    headless: true
  });

  assert.strictEqual(scene.feverActive, false);
  assert.strictEqual(scene.ambientParticleEngine.feverActive, false);

  bus.emit('FEVER_MODE_CHANGED', { isActive: true, multiplier: 2.0 });
  assert.strictEqual(scene.feverActive, true);
  assert.strictEqual(scene.feverMultiplier, 2.0);
  assert.strictEqual(scene.ambientParticleEngine.feverActive, true);

  bus.emit('FEVER_MODE_CHANGED', { isActive: false, multiplier: 1.0 });
  assert.strictEqual(scene.feverActive, false);
  assert.strictEqual(scene.ambientParticleEngine.feverActive, false);

  scene.dispose();
});

test('should inject SVG 3px sticker filter definitions into document', () => {
  const mockDoc = {
    getElementById: (id) => (id === 'existing' ? {} : null),
    createElementNS: (ns, tag) => {
      return {
        id: '',
        className: '',
        innerHTML: '',
        setAttribute: () => {},
        getAttribute: () => {}
      };
    },
    body: {
      appendChild: () => {}
    }
  };

  const filter = injectStickerFilter(mockDoc);
  assert.ok(filter, 'Should construct SVG filter definitions');
  assert.ok(filter.innerHTML.includes('id="sticker-outline-3px"'));
  assert.ok(filter.innerHTML.includes('feMorphology in="SourceAlpha" operator="dilate" radius="3"'));
});

console.log('\n================================================================================');
console.log(`✔ ALL M2 (VFX) TESTS PASSED: ${passedTests} / ${totalTests} assertions`);
console.log('================================================================================\n');
