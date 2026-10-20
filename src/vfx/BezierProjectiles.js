/**
 * BezierProjectiles.js - Quadratic Bézier Magic Projectiles & Impact VFX
 * 
 * Generates arcing magic projectiles connecting pressed key screen coordinates
 * to the mascot target upon KEY_PRESSED_SUCCESS, trailing glowing pedagogical particles,
 * and triggering radial burst + harmonic squash & stretch on target impact.
 * Fulfills Requirement R2 and PROJECT.md specifications.
 */

import { applySquashAndStretch } from './SquashStretch.js';
import { ParticleEngine, resolvePedagogicalColor } from './ParticleEngine.js';

/**
 * Evaluates Quadratic Bézier point B(t) = (1-t)^2 P0 + 2(1-t)t P1 + t^2 P2
 * 
 * @param {{ x: number, y: number }} p0 - Origin point (pressed key)
 * @param {{ x: number, y: number }} p1 - Control point (high arch apex)
 * @param {{ x: number, y: number }} p2 - Destination point (mascot target)
 * @param {number} t - Progress in [0, 1]
 * @returns {{ x: number, y: number }}
 */
export function calculateBezierPoint(p0, p1, p2, t) {
  const clampedT = Math.max(0, Math.min(1, t));
  const oneMinusT = 1 - clampedT;
  const c0 = oneMinusT * oneMinusT;
  const c1 = 2 * oneMinusT * clampedT;
  const c2 = clampedT * clampedT;

  return {
    x: c0 * p0.x + c1 * p1.x + c2 * p2.x,
    y: c0 * p0.y + c1 * p1.y + c2 * p2.y
  };
}

/**
 * Calculates Quadratic Bézier tangent vector B'(t) = 2(1-t)(P1 - P0) + 2t(P2 - P1)
 * Used for aligning projectile orientation with flight path
 * 
 * @param {{ x: number, y: number }} p0
 * @param {{ x: number, y: number }} p1
 * @param {{ x: number, y: number }} p2
 * @param {number} t
 * @returns {{ vx: number, vy: number, angle: number }}
 */
export function calculateBezierTangent(p0, p1, p2, t) {
  const clampedT = Math.max(0, Math.min(1, t));
  const oneMinusT = 1 - clampedT;

  const vx = 2 * oneMinusT * (p1.x - p0.x) + 2 * clampedT * (p2.x - p1.x);
  const vy = 2 * oneMinusT * (p1.y - p0.y) + 2 * clampedT * (p2.y - p1.y);
  const angle = Math.atan2(vy, vx);

  return { vx, vy, angle };
}

/**
 * Computes an expressive control point P1 for the Bézier projectile arc
 * 
 * @param {{ x: number, y: number }} p0 - Origin
 * @param {{ x: number, y: number }} p2 - Destination
 * @param {'left'|'right'} [hand='left'] - Hand used to strike key
 * @returns {{ x: number, y: number }}
 */
export function computeControlPoint(p0, p2, hand = 'left') {
  const mx = (p0.x + p2.x) / 2;
  const my = (p0.y + p2.y) / 2;

  // Arch height scales with distance, with slight organic jitter
  const dx = Math.abs(p2.x - p0.x);
  const baseArc = Math.max(100, dx * 0.38);
  const arcJitter = (Math.random() - 0.5) * 20;
  const hArc = baseArc + arcJitter;

  // Lateral curve offset according to striking hand
  const lateralOffset = hand === 'left' ? -35 : 35;

  return {
    x: mx + lateralOffset,
    y: Math.min(p0.y, p2.y) - hArc
  };
}

/**
 * Single Active Magic Projectile
 */
export class MagicProjectile {
  /**
   * @param {Object} options
   */
  constructor(options = {}) {
    this.p0 = { x: options.p0?.x || 0, y: options.p0?.y || 0 };
    this.p2 = { x: options.p2?.x || 0, y: options.p2?.y || 0 };
    this.p1 = options.p1 || computeControlPoint(this.p0, this.p2, options.hand);
    this.key = options.key || '';
    this.finger = options.finger || 'li';
    this.hand = options.hand || 'left';
    this.colorDef = resolvePedagogicalColor(this.finger);

    this.duration = options.duration || (options.isFever ? 0.32 : 0.45); // seconds
    this.elapsed = 0;
    this.progress = 0; // t in [0, 1]
    this.currentPos = { ...this.p0 };
    this.angle = 0;
    this.radius = options.radius || 7.0;
    this.trailTimer = 0;
    this.trailInterval = 0.025; // 40 trail particles/second
    this.isDead = false;
    this.onImpact = options.onImpact || null;
  }

  /**
   * Updates projectile progress
   * @param {number} dt
   * @param {ParticleEngine} [particleEngine]
   * @returns {boolean} True if still active, false if reached target
   */
  update(dt, particleEngine) {
    if (this.isDead) return false;

    this.elapsed += dt;
    const rawProgress = Math.min(1.0, this.elapsed / this.duration);

    // Ease-out quadratic smoothing for dynamic feel
    this.progress = 1 - (1 - rawProgress) * (1 - rawProgress);

    // Calculate current coordinates and tangent angle
    this.currentPos = calculateBezierPoint(this.p0, this.p1, this.p2, this.progress);
    const tangent = calculateBezierTangent(this.p0, this.p1, this.p2, this.progress);
    this.angle = tangent.angle;

    // Spawn trail particles
    if (particleEngine) {
      this.trailTimer += dt;
      if (this.trailTimer >= this.trailInterval) {
        this.trailTimer = 0;
        particleEngine.spawnTrailParticle(this.currentPos.x, this.currentPos.y, this.finger, 2);
      }
    }

    if (rawProgress >= 1.0) {
      this.isDead = true;
      if (typeof this.onImpact === 'function') {
        this.onImpact(this.p2, this.finger, this);
      }
      return false;
    }

    return true;
  }

  /**
   * Renders projectile onto Canvas 2D
   * @param {CanvasRenderingContext2D} ctx
   */
  render(ctx) {
    if (this.isDead || !ctx) return;

    ctx.save();
    ctx.translate(this.currentPos.x, this.currentPos.y);
    ctx.rotate(this.angle);

    // Outer glow
    ctx.shadowColor = this.colorDef.glow;
    ctx.shadowBlur = 12;

    // Outer energy corona
    ctx.fillStyle = this.colorDef.primary;
    ctx.beginPath();
    ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
    ctx.fill();

    // Inner bright core
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(0, 0, this.radius * 0.55, 0, Math.PI * 2);
    ctx.fill();

    // Trailing comet tail
    ctx.fillStyle = this.colorDef.glow;
    ctx.beginPath();
    ctx.moveTo(-this.radius * 2.2, 0);
    ctx.lineTo(0, -this.radius * 0.8);
    ctx.lineTo(0, this.radius * 0.8);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  }
}

/**
 * BezierProjectiles Manager
 * Coordinates spawning, physics updates, canvas drawing, and EventBus integration
 */
export class BezierProjectiles {
  /**
   * @param {Object} [options]
   * @param {ParticleEngine} [options.particleEngine]
   * @param {HTMLElement|null} [options.mascotElement]
   * @param {import('../core/EventBus.js').EventBus|null} [options.eventBus]
   * @param {Function} [options.targetResolver] () => { x, y }
   */
  constructor(options = {}) {
    this.particleEngine = options.particleEngine || new ParticleEngine();
    this.mascotElement = options.mascotElement || null;
    this.eventBus = options.eventBus || null;
    this.targetResolver = options.targetResolver || null;

    this.projectiles = [];
    this.feverActive = false;
    this.feverMultiplier = 1.0;
    this.unsubscribers = [];

    if (this.eventBus) {
      this.bindEvents(this.eventBus);
    }
  }

  /**
   * Sets target coordinate resolver callback (e.g. mascot avatar center)
   * @param {Function} resolver - Returns { x: number, y: number }
   */
  setTargetResolver(resolver) {
    this.targetResolver = resolver;
  }

  /**
   * Sets mascot DOM element for squash & stretch deformation
   * @param {HTMLElement} element
   */
  setMascotElement(element) {
    this.mascotElement = element;
  }

  /**
   * Resolves target position for the projectile landing
   * @returns {{ x: number, y: number }}
   */
  resolveTarget() {
    if (typeof this.targetResolver === 'function') {
      try {
        const res = this.targetResolver();
        if (res && typeof res.x === 'number' && typeof res.y === 'number') {
          return res;
        }
      } catch (_) {
        // Fallback below
      }
    }

    if (this.mascotElement && typeof this.mascotElement.getBoundingClientRect === 'function') {
      try {
        const rect = this.mascotElement.getBoundingClientRect();
        return {
          x: rect.left + rect.width / 2,
          y: rect.top + rect.height * 0.55
        };
      } catch (_) {
        // Fallback below
      }
    }

    // Default target screen position (mascot stage default)
    return { x: 260, y: 220 };
  }

  /**
   * Subscribes to relevant EventBus events
   * @param {import('../core/EventBus.js').EventBus} bus
   */
  bindEvents(bus) {
    if (!bus || typeof bus.on !== 'function') return;

    // KEY_PRESSED_SUCCESS: instantiate projectile
    const unsubSuccess = bus.on('KEY_PRESSED_SUCCESS', (payload) => {
      this.handleSuccessKeyPress(payload);
    });
    this.unsubscribers.push(unsubSuccess);

    // FEVER_MODE_CHANGED: accelerate projectiles
    const unsubFever = bus.on('FEVER_MODE_CHANGED', (payload) => {
      this.feverActive = Boolean(payload && payload.isActive);
      this.feverMultiplier = this.feverActive ? (payload.multiplier || 2.0) : 1.0;
    });
    this.unsubscribers.push(unsubFever);
  }

  /**
   * Handles KEY_PRESSED_SUCCESS payload to spawn a projectile
   * @param {Object} payload
   */
  handleSuccessKeyPress(payload) {
    if (!payload) return;

    const key = payload.key || '';
    const p0 = payload.keyScreenPosition || { x: 400, y: 550 };
    const p2 = this.resolveTarget();

    // Determine hand and finger from payload or fallback
    const finger = payload.finger || 'li';
    const hand = payload.hand || (p0.x < (typeof window !== 'undefined' ? window.innerWidth / 2 : 500) ? 'left' : 'right');

    this.spawnProjectile({
      p0,
      p2,
      key,
      finger,
      hand,
      isFever: this.feverActive
    });
  }

  /**
   * Spawns a new magic projectile
   * @param {Object} options
   * @returns {MagicProjectile}
   */
  spawnProjectile(options = {}) {
    const p0 = options.p0 || { x: 400, y: 500 };
    const p2 = options.p2 || this.resolveTarget();
    const finger = options.finger || 'li';
    const hand = options.hand || 'left';

    const projectile = new MagicProjectile({
      p0,
      p2,
      key: options.key || '',
      finger,
      hand,
      isFever: options.isFever !== undefined ? options.isFever : this.feverActive,
      onImpact: (impactPos, impactFinger, proj) => {
        this.handleImpact(impactPos, impactFinger);
        if (typeof options.onImpact === 'function') {
          options.onImpact(impactPos, impactFinger, proj);
        }
      }
    });

    this.projectiles.push(projectile);
    return projectile;
  }

  /**
   * Detonation on projectile impact:
   * 1. Radial burst of pedagogical particles
   * 2. Damped harmonic squash & stretch on target
   * 
   * @param {{ x: number, y: number }} impactPos
   * @param {string} finger
   */
  handleImpact(impactPos, finger) {
    // 1. Radial burst
    if (this.particleEngine) {
      this.particleEngine.spawnRadialBurst(impactPos.x, impactPos.y, finger, {
        count: this.feverActive ? 24 : 16,
        minSpeed: 110,
        maxSpeed: 240
      });
    }

    // 2. Harmonic Squash & Stretch
    if (this.mascotElement) {
      applySquashAndStretch(this.mascotElement, {
        preset: 'impact',
        intensity: this.feverActive ? 1.3 : 1.0
      });
    }
  }

  /**
   * Updates all active projectiles
   * @param {number} dt
   * @returns {number} Active projectile count
   */
  update(dt) {
    const safeDt = Math.max(0.001, Math.min(2.0, dt || 0.016));

    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const proj = this.projectiles[i];
      const isActive = proj.update(safeDt, this.particleEngine);
      if (!isActive) {
        this.projectiles.splice(i, 1);
      }
    }

    return this.projectiles.length;
  }

  /**
   * Renders all active projectiles onto Canvas 2D
   * @param {CanvasRenderingContext2D} ctx
   */
  render(ctx) {
    if (!ctx || this.projectiles.length === 0) return;

    for (let i = 0; i < this.projectiles.length; i++) {
      this.projectiles[i].render(ctx);
    }
  }

  /**
   * Cleans up all projectiles and event listeners
   */
  dispose() {
    this.projectiles = [];
    while (this.unsubscribers.length > 0) {
      const unsub = this.unsubscribers.pop();
      try {
        if (typeof unsub === 'function') unsub();
      } catch (_) {}
    }
  }
}

export default {
  BezierProjectiles,
  MagicProjectile,
  calculateBezierPoint,
  calculateBezierTangent,
  computeControlPoint
};
