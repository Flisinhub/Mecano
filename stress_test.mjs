/**
 * stress_test.mjs - Adversarial & Empirical Stress Test Suite for Mecano
 * 
 * Verifies:
 * 1. Mascot FSM state machine transitions under rapid, out-of-order, or conflicting events.
 * 2. Damped harmonic oscillator in SquashStretch.js: volume preservation and strict return to 1.0.
 * 3. Bézier trajectories in BezierProjectiles.js: endpoint convergence B(1)=P2 and numeric stability.
 * 4. Particle pool in ParticleEngine.js: zero memory leaks and proper recycling under 1000+ rapid spawns.
 * 5. EventBus concurrency: re-entrant emits, self-unsubscribing, sibling unsubscribing, and listener mutation.
 */

import assert from 'node:assert/strict';
import { EventBus } from './src/core/EventBus.js';
import { MascotFSM } from './src/mascot/MascotFSM.js';
import {
  calculateSquashAndStretch,
  generateSpringKeyframes,
  applySquashAndStretch,
  DEFAULT_SPRING_CONFIG,
  SQUASH_PRESETS
} from './src/vfx/SquashStretch.js';
import {
  calculateBezierPoint,
  calculateBezierTangent,
  computeControlPoint,
  BezierProjectiles,
  MagicProjectile
} from './src/vfx/BezierProjectiles.js';
import {
  ParticleEngine,
  ParticlePool,
  Particle,
  resolvePedagogicalColor
} from './src/vfx/ParticleEngine.js';

let passedTotal = 0;
let failedTotal = 0;
const failures = [];

function runTest(name, fn) {
  try {
    fn();
    console.log(`  ✔ [PASS] ${name}`);
    passedTotal++;
  } catch (err) {
    console.error(`  ✖ [FAIL] ${name}`);
    console.error(`    Error: ${err.message}`);
    console.error(err.stack);
    failedTotal++;
    failures.push({ name, error: err });
  }
}

async function runAsyncTest(name, fn) {
  try {
    await fn();
    console.log(`  ✔ [PASS] ${name}`);
    passedTotal++;
  } catch (err) {
    console.error(`  ✖ [FAIL] ${name}`);
    console.error(`    Error: ${err.message}`);
    console.error(err.stack);
    failedTotal++;
    failures.push({ name, error: err });
  }
}

console.log('================================================================');
console.log('       MECANO ADVERSARIAL & EMPIRICAL STRESS TEST SUITE         ');
console.log('================================================================\n');

// ============================================================================
// SUITE 1: Mascot FSM State Transitions & Concurrency
// ============================================================================
console.log('--- SUITE 1: Mascot FSM State Machine Stress Testing ---');

runTest('1.1 FSM Invariant under 10,000 rapid randomized events', () => {
  const bus = new EventBus();
  const fsm = new MascotFSM({ eventBus: bus, sleepTimeoutSec: 25 });
  const validStates = new Set(Object.values(MascotFSM.STATES));

  const events = [
    () => bus.emit('USER_STUCK', { expectedKey: 'f', finger: 'li', idleTimeMs: 2000 }),
    () => bus.emit('FEVER_MODE_CHANGED', { isActive: true, multiplier: 2 }),
    () => bus.emit('FEVER_MODE_CHANGED', { isActive: false, multiplier: 1 }),
    () => bus.emit('LEVEL_COMPLETED', { levelId: 1, stars: 3, accuracy: 98, wpm: 32 }),
    () => bus.emit('KEY_PRESSED_SUCCESS', { key: 'f', comboCount: 10, accuracy: 95, keyScreenPosition: { x: 200, y: 300 } }),
    () => bus.emit('KEY_PRESSED_FAIL', { pressedKey: 'd', expectedKey: 'f', consecutiveErrors: 1 }),
    () => fsm.handleKeystroke('a'),
    () => fsm.handleKeystroke(' '),
    () => fsm.handleIdleTime(Math.random() * 35)
  ];

  for (let i = 0; i < 10000; i++) {
    const pick = events[Math.floor(Math.random() * events.length)];
    pick();
    assert.ok(validStates.has(fsm.getState()), `FSM state invalid at step ${i}: ${fsm.getState()}`);
  }

  const history = fsm.getHistory();
  assert.ok(history.length > 1000 && history.length <= 10001, `History should record transitions: ${history.length}`);
  assert.equal(history[history.length - 1], fsm.getState(), 'Latest history entry must match currentState');
  fsm.destroy();
});

runTest('1.2 Conflicting state transitions (HIGH_FIVE_WAIT / CELEBRATING handling)', () => {
  const bus = new EventBus();
  const fsm = new MascotFSM({ eventBus: bus });

  // 1. Trigger LEVEL_COMPLETED -> HIGH_FIVE_WAIT
  bus.emit('LEVEL_COMPLETED', { levelId: 2, stars: 3, accuracy: 100, wpm: 40 });
  assert.equal(fsm.getState(), MascotFSM.STATES.HIGH_FIVE_WAIT);

  // While in HIGH_FIVE_WAIT, arbitrary keystroke should NOT leave HIGH_FIVE_WAIT
  fsm.handleKeystroke('x');
  assert.equal(fsm.getState(), MascotFSM.STATES.HIGH_FIVE_WAIT);
  fsm.handleKeystroke('Enter');
  assert.equal(fsm.getState(), MascotFSM.STATES.HIGH_FIVE_WAIT);

  // Inactivity while waiting for high-five must NOT trigger SLEEPY
  fsm.handleIdleTime(30);
  assert.equal(fsm.getState(), MascotFSM.STATES.HIGH_FIVE_WAIT);

  // Spacebar must trigger CELEBRATING
  fsm.handleKeystroke(' ');
  assert.equal(fsm.getState(), MascotFSM.STATES.CELEBRATING);

  // In CELEBRATING, idle time must NOT trigger SLEEPY
  fsm.handleIdleTime(50);
  assert.equal(fsm.getState(), MascotFSM.STATES.CELEBRATING);

  fsm.destroy();
});

runTest('1.3 Sleepy state transition boundary & immediate waking', () => {
  const fsm = new MascotFSM({ sleepTimeoutSec: 25 });
  assert.equal(fsm.getState(), MascotFSM.STATES.IDLE);

  // 24.9 seconds: should remain IDLE
  fsm.handleIdleTime(24.9);
  assert.equal(fsm.getState(), MascotFSM.STATES.IDLE);

  // 25.0 seconds: should enter SLEEPY
  fsm.handleIdleTime(25.0);
  assert.equal(fsm.getState(), MascotFSM.STATES.SLEEPY);

  // Subsequent idle time should not re-trigger transition or crash
  fsm.handleIdleTime(40.0);
  assert.equal(fsm.getState(), MascotFSM.STATES.SLEEPY);

  // Any keystroke should awaken to IDLE
  fsm.handleKeystroke('j');
  assert.equal(fsm.getState(), MascotFSM.STATES.IDLE);

  fsm.destroy();
});

runTest('1.4 Strict rejection of invalid states', () => {
  const fsm = new MascotFSM();
  const invalidTargets = ['DESTROYED', 'ATTACK', '', null, undefined, 42, {}, []];

  for (const target of invalidTargets) {
    assert.throws(
      () => fsm.transitionTo(target),
      /\[MascotFSM\] Invalid state transition target/,
      `Should reject invalid state: ${target}`
    );
  }
  assert.equal(fsm.getState(), MascotFSM.STATES.IDLE);
});

runTest('1.5 Resilience to throwing onStateChange callbacks', () => {
  let callCount = 0;
  const fsm = new MascotFSM({
    onStateChange: () => {
      callCount++;
      throw new Error('Exploding user callback!');
    }
  });

  // Must not throw despite callback throwing
  const changed = fsm.transitionTo(MascotFSM.STATES.FLOW_DANCE);
  assert.equal(changed, true);
  assert.equal(fsm.getState(), MascotFSM.STATES.FLOW_DANCE);
  assert.equal(callCount, 1);
});

runTest('1.6 FSM Teardown & listener detachment', () => {
  const bus = new EventBus();
  const fsm = new MascotFSM({ eventBus: bus });
  assert.equal(bus.listenerCount(), 5);

  fsm.destroy();
  assert.equal(bus.listenerCount(), 0, 'Destroy must detach all event listeners');

  // Emitting events after destroy must not alter FSM
  bus.emit('USER_STUCK', { expectedKey: 'a', finger: 'lp', idleTimeMs: 2000 });
  bus.emit('FEVER_MODE_CHANGED', { isActive: true, multiplier: 2 });
  bus.emit('LEVEL_COMPLETED', { levelId: 1, stars: 3, accuracy: 100, wpm: 30 });
  assert.equal(fsm.getState(), MascotFSM.STATES.IDLE);
});

// ============================================================================
// SUITE 2: Damped Harmonic Oscillator (SquashStretch.js)
// ============================================================================
console.log('\n--- SUITE 2: Damped Harmonic Oscillator Stress Testing ---');

runTest('2.1 Volume preservation across 10,000 continuous time samples', () => {
  const presets = ['impact', 'hop', 'keyPress', 'gentle'];
  let maxAreaDeviation = 0;

  for (const presetName of presets) {
    const config = SQUASH_PRESETS[presetName];

    for (let i = 0; i < 2500; i++) {
      const t = i * 0.001; // 0 to 2.5 seconds
      // Test both vertical and horizontal
      const vResult = calculateSquashAndStretch(t, { ...config, direction: 'vertical' });
      const hResult = calculateSquashAndStretch(t, { ...config, direction: 'horizontal' });

      // Calculate area = scaleX * scaleY
      const vArea = vResult.scaleX * vResult.scaleY;
      const hArea = hResult.scaleX * hResult.scaleY;

      const vDev = Math.abs(vArea - 1.0);
      const hDev = Math.abs(hArea - 1.0);

      if (vDev > maxAreaDeviation) maxAreaDeviation = vDev;
      if (hDev > maxAreaDeviation) maxAreaDeviation = hDev;

      // With 4-decimal rounding (0.0001 resolution), deviation should never exceed 0.0005
      assert.ok(vDev < 0.001, `Vertical volume deviation too high at t=${t} (${presetName}): area=${vArea}`);
      assert.ok(hDev < 0.001, `Horizontal volume deviation too high at t=${t} (${presetName}): area=${hArea}`);
    }
  }

  console.log(`    Max area deviation across 10k samples: ${maxAreaDeviation.toFixed(6)} (Preserves 2D volume)`);
});

runTest('2.2 Scale returns strictly to 1.0 (Zero persistent distortion)', () => {
  // Test 1: Analytical decay at t = 5.0 seconds
  for (const presetName of Object.keys(SQUASH_PRESETS)) {
    const result = calculateSquashAndStretch(5.0, { preset: presetName });
    assert.equal(result.displacement, 0, `Displacement at t=5s must be 0 for ${presetName}`);
    assert.equal(result.scaleX, 1.0, `scaleX at t=5s must be 1.0 for ${presetName}`);
    assert.equal(result.scaleY, 1.0, `scaleY at t=5s must be 1.0 for ${presetName}`);
  }

  // Test 2: generateSpringKeyframes end offset is strictly scale(1, 1)
  const keyframes = generateSpringKeyframes({ durationMs: 380 }, 16);
  assert.equal(keyframes[keyframes.length - 1].offset, 1.0);
  assert.equal(keyframes[keyframes.length - 1].transform, 'scale(1, 1)');
});

runTest('2.3 Extreme intensity & damping ratio numeric stability', () => {
  const extremeParams = [
    { intensity: 0.0 },
    { intensity: 5.0 },
    { intensity: 10.0 },
    { dampingRatio: 0.0 }, // Undamped
    { dampingRatio: 1.0 }, // Critically damped
    { dampingRatio: 2.5 }, // Overdamped
    { naturalFreq: 0.1 },
    { naturalFreq: 500.0 }
  ];

  for (const opt of extremeParams) {
    for (let t = 0; t <= 1.0; t += 0.1) {
      const res = calculateSquashAndStretch(t, opt);
      assert.ok(Number.isFinite(res.scaleX), `scaleX must be finite for ${JSON.stringify(opt)}`);
      assert.ok(Number.isFinite(res.scaleY), `scaleY must be finite for ${JSON.stringify(opt)}`);
      assert.ok(Number.isFinite(res.displacement), `displacement must be finite for ${JSON.stringify(opt)}`);
      assert.ok(res.scaleX > 0, `scaleX must remain positive`);
      assert.ok(res.scaleY > 0, `scaleY must remain positive`);
    }
  }
});

runTest('2.4 Rapid consecutive calls on DOM element reset cleanly without drift', () => {
  const mockElement = {
    style: { transformOrigin: '', transform: '' }
  };

  // Trigger 1,000 rapid animations
  for (let i = 0; i < 1000; i++) {
    applySquashAndStretch(mockElement, { preset: 'impact', intensity: 1.0 });
  }

  assert.ok(mockElement._activeSquashAnimation !== null);
  // Cancel active animation
  mockElement._activeSquashAnimation.cancel();
  assert.equal(mockElement.style.transform, 'scale(1, 1)', 'Element must reset to scale(1, 1) upon cancel');
});

// ============================================================================
// SUITE 3: Quadratic Bézier Trajectories (BezierProjectiles.js)
// ============================================================================
console.log('\n--- SUITE 3: Quadratic Bézier Trajectories Stress Testing ---');

runTest('3.1 Endpoint convergence B(1) == P2 across 1,000 arbitrary coordinate sets', () => {
  for (let i = 0; i < 1000; i++) {
    const p0 = { x: (Math.random() - 0.5) * 20000, y: (Math.random() - 0.5) * 20000 };
    const p1 = { x: (Math.random() - 0.5) * 20000, y: (Math.random() - 0.5) * 20000 };
    const p2 = { x: (Math.random() - 0.5) * 20000, y: (Math.random() - 0.5) * 20000 };

    const atEnd = calculateBezierPoint(p0, p1, p2, 1.0);
    assert.equal(atEnd.x, p2.x, `B(1).x must strictly equal P2.x (i=${i})`);
    assert.equal(atEnd.y, p2.y, `B(1).y must strictly equal P2.y (i=${i})`);

    const atStart = calculateBezierPoint(p0, p1, p2, 0.0);
    assert.equal(atStart.x, p0.x, `B(0).x must strictly equal P0.x (i=${i})`);
    assert.equal(atStart.y, p0.y, `B(0).y must strictly equal P0.y (i=${i})`);
  }
});

runTest('3.2 Range clamping of progress parameter t in [-100, 100]', () => {
  const p0 = { x: 10, y: 20 };
  const p1 = { x: 50, y: 150 };
  const p2 = { x: 100, y: 300 };

  const under = calculateBezierPoint(p0, p1, p2, -50.0);
  assert.equal(under.x, p0.x, 't < 0 must clamp to P0');
  assert.equal(under.y, p0.y, 't < 0 must clamp to P0');

  const over = calculateBezierPoint(p0, p1, p2, 999.0);
  assert.equal(over.x, p2.x, 't > 1 must clamp to P2');
  assert.equal(over.y, p2.y, 't > 1 must clamp to P2');
});

runTest('3.3 Numeric stability of calculateBezierTangent under degenerate coordinates', () => {
  // Test identical points P0 == P1 == P2
  const pSame = { x: 150, y: 200 };
  const tangentSame = calculateBezierTangent(pSame, pSame, pSame, 0.5);
  assert.ok(Number.isFinite(tangentSame.vx), 'vx must be finite');
  assert.ok(Number.isFinite(tangentSame.vy), 'vy must be finite');
  assert.ok(Number.isFinite(tangentSame.angle), 'angle must be finite');
  assert.equal(tangentSame.vx, 0);
  assert.equal(tangentSame.vy, 0);
  assert.equal(tangentSame.angle, 0);

  // Collinear horizontal
  const tanH = calculateBezierTangent({ x: 0, y: 0 }, { x: 50, y: 0 }, { x: 100, y: 0 }, 0.5);
  assert.equal(tanH.angle, 0);

  // Collinear vertical
  const tanV = calculateBezierTangent({ x: 0, y: 0 }, { x: 0, y: 50 }, { x: 0, y: 100 }, 0.5);
  assert.ok(Math.abs(tanV.angle - Math.PI / 2) < 1e-6);
});

runTest('3.4 Concurrent simulation of 500 MagicProjectiles lifecycle', () => {
  const particleEngine = new ParticleEngine();
  const manager = new BezierProjectiles({ particleEngine });

  let impactsCount = 0;
  const totalSpawns = 500;

  for (let i = 0; i < totalSpawns; i++) {
    manager.spawnProjectile({
      p0: { x: Math.random() * 800, y: 500 },
      p2: { x: 260, y: 220 },
      finger: ['li', 'ri', 'lp', 'rp', 'thumb'][i % 5],
      onImpact: () => {
        impactsCount++;
      }
    });
  }

  assert.equal(manager.projectiles.length, totalSpawns);

  // Step simulation forward until all projectiles hit
  // Typical projectile duration is 0.45s; step for 1.0s in 16ms increments
  const dt = 0.016;
  for (let step = 0; step < 70; step++) {
    manager.update(dt);
  }

  assert.equal(manager.projectiles.length, 0, 'All projectiles must complete and be removed');
  assert.equal(impactsCount, totalSpawns, `All ${totalSpawns} projectiles must trigger onImpact callback`);

  manager.dispose();
});

// ============================================================================
// SUITE 4: Particle Pool & Memory Management (ParticleEngine.js)
// ============================================================================
console.log('\n--- SUITE 4: Particle Pool & Memory Leak Stress Testing ---');

runTest('4.1 Pool Conservation Invariant: activeCount + pool.length === poolCapacity', () => {
  const engine = new ParticleEngine({ maxPool: 150 });
  const pool = engine.pool;

  assert.equal(pool.activeCount + pool.pool.length, pool.poolCapacity);

  // Spawn radial bursts
  engine.spawnRadialBurst(400, 300, 'li', { count: 30 });
  assert.equal(pool.activeCount + pool.pool.length, pool.poolCapacity);

  // Spawn trails
  engine.spawnTrailParticle(400, 300, 'ri', 10);
  assert.equal(pool.activeCount + pool.pool.length, pool.poolCapacity);

  // Spawn confetti
  engine.spawnConfetti(400, 300, 40);
  assert.equal(pool.activeCount + pool.pool.length, pool.poolCapacity);

  engine.dispose();
});

runTest('4.2 Stress recycling: 1,500 particles spawn and decay cleanly', () => {
  const engine = new ParticleEngine({ maxPool: 200 });

  // Spawn 1,500 burst & confetti particles
  for (let i = 0; i < 50; i++) {
    engine.spawnRadialBurst(200 + i * 5, 300, 'lm', { count: 20 });
    engine.spawnConfetti(200 + i * 5, 200, 10);
  }

  const peakActive = engine.pool.activeCount;
  assert.ok(peakActive >= 1500, `Active particles should accommodate 1500 spawns: got ${peakActive}`);
  const peakCapacity = engine.pool.poolCapacity;

  // Advance time by 3.0 seconds (lifespan of burst particles is ~0.55s, confetti ~1.2s)
  const dt = 0.05;
  for (let step = 0; step < 60; step++) {
    engine.update(dt);
  }

  // Active particles should now only be ambient particles
  const remainingActive = engine.pool.activeList;
  const nonAmbient = remainingActive.filter(p => p.kind !== 'ambient');
  assert.equal(nonAmbient.length, 0, `All non-ambient particles must be recycled: found ${nonAmbient.length}`);
  assert.ok(engine.pool.activeCount <= engine.maxAmbient * 2, 'Ambient particles must stay within cap');

  // Invariant check: activeCount + pool.length must always strictly equal poolCapacity
  assert.equal(engine.pool.activeCount + engine.pool.pool.length, engine.pool.poolCapacity);
  // Capacity should be bounded (peak active + at most a few ambient spawns before bursts decayed)
  assert.ok(
    engine.pool.poolCapacity <= peakCapacity + 10,
    `Pool capacity should stay bounded near peak (got ${engine.pool.poolCapacity}, peak was ${peakCapacity})`
  );

  engine.dispose();
});

runTest('4.3 50 successive waves of 1,000 particle spawns (50,000 particles total)', () => {
  const engine = new ParticleEngine({ maxPool: 500 });

  for (let wave = 0; wave < 50; wave++) {
    // Spawn 1,000 particles
    for (let j = 0; j < 40; j++) {
      engine.spawnRadialBurst(300, 300, 'lp', { count: 25 });
    }

    // Step 1.5s forward to let them expire
    for (let step = 0; step < 30; step++) {
      engine.update(0.05);
    }
  }

  // Verify pool integrity
  assert.equal(engine.pool.activeCount + engine.pool.pool.length, engine.pool.poolCapacity);
  const nonAmbient = engine.pool.activeList.filter(p => p.kind !== 'ambient');
  assert.equal(nonAmbient.length, 0, 'No non-ambient particles should linger after 50 waves');

  console.log(`    Recycled 50,000 particles across 50 waves. Final pool capacity: ${engine.pool.poolCapacity}`);

  engine.dispose();
});

runTest('4.4 Ambient particle generation respects maxAmbient ceiling', () => {
  const engine = new ParticleEngine({ maxAmbient: 30 });

  // Run update 500 times with no bursts
  for (let i = 0; i < 500; i++) {
    engine.update(0.05);
  }

  const ambientCount = engine.pool.activeList.filter(p => p.kind === 'ambient').length;
  assert.ok(ambientCount <= 30, `Ambient particles (${ambientCount}) exceeded maxAmbient (30)`);

  // Activate fever mode (limit becomes maxAmbient * 1.6 = 48)
  engine.setFeverMode(true, 2.0);
  for (let i = 0; i < 500; i++) {
    engine.update(0.05);
  }

  const feverAmbientCount = engine.pool.activeList.filter(p => p.kind === 'ambient').length;
  assert.ok(feverAmbientCount <= 48, `Fever ambient count (${feverAmbientCount}) exceeded fever limit (48)`);

  engine.dispose();
});

// ============================================================================
// SUITE 5: EventBus Concurrency & Listener Mutation
// ============================================================================
console.log('\n--- SUITE 5: EventBus Concurrency Stress Testing ---');

runTest('5.1 Synchronous re-entrant emit of different events', () => {
  const bus = new EventBus();
  const executionOrder = [];

  bus.on('EVENT_A', () => {
    executionOrder.push('A_START');
    bus.emit('EVENT_B');
    executionOrder.push('A_END');
  });

  bus.on('EVENT_B', () => {
    executionOrder.push('B');
  });

  bus.emit('EVENT_A');

  assert.deepEqual(executionOrder, ['A_START', 'B', 'A_END']);
});

runTest('5.2 Recursive emit with bounded depth', () => {
  const bus = new EventBus();
  const depths = [];

  bus.on('RECURSIVE', (data) => {
    depths.push(data.depth);
    if (data.depth < 5) {
      bus.emit('RECURSIVE', { depth: data.depth + 1 });
    }
  });

  bus.emit('RECURSIVE', { depth: 1 });
  assert.deepEqual(depths, [1, 2, 3, 4, 5]);
});

runTest('5.3 Self-unsubscribe during emit', () => {
  const bus = new EventBus();
  let calls = 0;

  const unsub = bus.on('TEST_EVENT', () => {
    calls++;
    unsub();
  });

  assert.equal(bus.listenerCount('TEST_EVENT'), 1);

  // First emit: executes and unregisters
  bus.emit('TEST_EVENT');
  assert.equal(calls, 1);
  assert.equal(bus.listenerCount('TEST_EVENT'), 0);

  // Second emit: listener must not be called
  bus.emit('TEST_EVENT');
  assert.equal(calls, 1);
});

runTest('5.4 Sibling unsubscription during emit', () => {
  const bus = new EventBus();
  const called = [];
  let unsub2;

  bus.on('EVENT_X', () => {
    called.push('H1');
    if (unsub2) unsub2(); // Unregister H2 while emitting
  });

  unsub2 = bus.on('EVENT_X', () => {
    called.push('H2');
  });

  bus.on('EVENT_X', () => {
    called.push('H3');
  });

  // First emit: H2 was in snapshot when emit started
  bus.emit('EVENT_X');
  assert.deepEqual(called, ['H1', 'H2', 'H3']);

  // Second emit: H2 must no longer be called
  called.length = 0;
  bus.emit('EVENT_X');
  assert.deepEqual(called, ['H1', 'H3']);
});

runTest('5.5 Listener addition during emit', () => {
  const bus = new EventBus();
  const called = [];

  bus.on('EVENT_Y', () => {
    called.push('ORIGINAL');
    bus.on('EVENT_Y', () => {
      called.push('LATE_ADDED');
    });
  });

  // First emit: LATE_ADDED must NOT be called in this turn
  bus.emit('EVENT_Y');
  assert.deepEqual(called, ['ORIGINAL']);

  // Second emit: LATE_ADDED must now be called
  called.length = 0;
  bus.emit('EVENT_Y');
  assert.ok(called.includes('ORIGINAL'));
  assert.ok(called.includes('LATE_ADDED'));
});

runTest('5.6 bus.clear() invoked inside listener during emit', () => {
  const bus = new EventBus();
  const called = [];

  bus.on('EV_CLEAR', () => {
    called.push('FIRST');
    bus.clear();
  });

  bus.on('EV_CLEAR', () => {
    called.push('SECOND');
  });

  // Must not throw error
  bus.emit('EV_CLEAR');
  assert.ok(called.includes('FIRST'));
  assert.equal(bus.listenerCount(), 0, 'Bus must be empty after clear()');

  // Next emit has 0 listeners
  called.length = 0;
  bus.emit('EV_CLEAR');
  assert.equal(called.length, 0);
});

runTest('5.7 Error isolation with concurrent listeners', () => {
  const bus = new EventBus();
  const executed = [];

  bus.on('SAFE_EVENT', () => {
    executed.push('H1');
    throw new Error('Fatal error in H1');
  });

  bus.on('SAFE_EVENT', () => {
    executed.push('H2');
  });

  bus.on('SAFE_EVENT', () => {
    executed.push('H3');
    throw new Error('Fatal error in H3');
  });

  bus.on('SAFE_EVENT', () => {
    executed.push('H4');
  });

  // Emit should not throw and should execute all 4 handlers
  const invoked = bus.emit('SAFE_EVENT');
  assert.equal(invoked, 2); // 2 non-throwing returned by invokedCount counter
  assert.deepEqual(executed, ['H1', 'H2', 'H3', 'H4']);
});

// ============================================================================
// STRESS TEST SUMMARY & VERDICT
// ============================================================================
console.log('\n================================================================');
console.log(`STRESS TEST RESULTS: ${passedTotal} passed, ${failedTotal} failed`);
console.log('================================================================');

if (failedTotal > 0) {
  console.error('\nFAILURES:');
  for (const f of failures) {
    console.error(`- ${f.name}: ${f.error.message}`);
  }
  process.exit(1);
} else {
  console.log('\n✔ ALL 22 STRESS & CONCURRENCY TESTS PASSED WITH 100% SUCCESS.');
  process.exit(0);
}
