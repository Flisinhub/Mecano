/**
 * ParticleEngine.js - High-Performance VFX Particle Engine for Mecano
 * 
 * Features:
 * - Pre-allocated Object Pool (zero runtime garbage collector spikes)
 * - Ambient floating particles: translucent bubbles, twinkling golden stars, motes
 * - Radial burst particle generator keyed to the 6 pedagogical finger colors
 * - Trail particle generation for projectile effects
 * - Dynamic Fever Mode scaling (rate, velocity, golden radiance)
 * - Multi-layer rendering on Canvas 2D
 * Fulfills Requirement R2 and PROJECT.md specifications.
 */

/**
 * 6 Pedagogical finger color definitions and visual accents
 */
export const PEDAGOGICAL_COLORS = Object.freeze({
  // Left Pinky (Meñique Izquierdo) - Coral / Soft Red
  lp: Object.freeze({ primary: '#ff6b81', glow: 'rgba(255, 107, 129, 0.65)', name: 'Coral' }),
  // Left Ring (Anular Izquierdo) - Warm Orange
  lr: Object.freeze({ primary: '#ff9f43', glow: 'rgba(255, 159, 67, 0.65)', name: 'Naranja' }),
  // Left Middle (Medio Izquierdo) - Sun Yellow
  lm: Object.freeze({ primary: '#ffd32a', glow: 'rgba(255, 211, 42, 0.70)', name: 'Amarillo' }),
  // Left Index (Índice Izquierdo) - Mint Green
  li: Object.freeze({ primary: '#2ed573', glow: 'rgba(46, 213, 115, 0.70)', name: 'Verde Menta' }),
  // Right Index (Índice Derecho) - Sky Blue
  ri: Object.freeze({ primary: '#54a0ff', glow: 'rgba(84, 160, 255, 0.70)', name: 'Azul Cielo' }),
  // Right Middle (Medio Derecho) - Sun Yellow
  rm: Object.freeze({ primary: '#ffd32a', glow: 'rgba(255, 211, 42, 0.70)', name: 'Amarillo' }),
  // Right Ring (Anular Derecho) - Warm Orange
  rr: Object.freeze({ primary: '#ff9f43', glow: 'rgba(255, 159, 67, 0.65)', name: 'Naranja' }),
  // Right Pinky (Meñique Derecho) - Magic Violet / Lilac
  rp: Object.freeze({ primary: '#a29bfe', glow: 'rgba(162, 155, 254, 0.70)', name: 'Violeta Mágico' }),
  // Thumbs (Pulgares / Espacio) - Cosmic Purple
  thumb: Object.freeze({ primary: '#9b59b6', glow: 'rgba(155, 89, 182, 0.70)', name: 'Púrpura Cósmico' }),
  // Golden Fever Accent
  fever: Object.freeze({ primary: '#f1c40f', glow: 'rgba(241, 196, 15, 0.85)', name: 'Oro Fiebre' })
});

/**
 * Resolves color definition from finger identifier, color hex, or default
 * @param {string} keyOrFinger
 * @returns {{ primary: string, glow: string, name: string }}
 */
export function resolvePedagogicalColor(keyOrFinger) {
  if (!keyOrFinger) {
    return PEDAGOGICAL_COLORS.thumb;
  }
  const clean = String(keyOrFinger).toLowerCase().trim();
  if (PEDAGOGICAL_COLORS[clean]) {
    return PEDAGOGICAL_COLORS[clean];
  }
  // If a raw hex or rgb was passed, construct color object
  if (clean.startsWith('#') || clean.startsWith('rgb')) {
    return { primary: clean, glow: clean, name: 'Custom' };
  }
  return PEDAGOGICAL_COLORS.thumb;
}

/**
 * Single Particle Instance for Object Pool reuse
 */
export class Particle {
  constructor() {
    this.reset();
  }

  reset() {
    this.active = false;
    this.kind = 'ambient'; // 'ambient' | 'burst' | 'trail' | 'confetti'
    this.subType = 'bubble'; // 'bubble' | 'star' | 'mote' | 'spark' | 'disc'
    this.x = 0;
    this.y = 0;
    this.startX = 0;
    this.vx = 0;
    this.vy = 0;
    this.radius = 4;
    this.color = '#ffffff';
    this.glow = 'rgba(255, 255, 255, 0.5)';
    this.alpha = 1.0;
    this.maxAlpha = 1.0;
    this.rotation = 0;
    this.angularVelocity = 0;
    this.lifespan = 1.0; // in seconds
    this.age = 0; // in seconds
    this.gravity = 0; // px/s^2
    this.drag = 0;
    this.wobbleFreq = 1.2;
    this.wobbleAmp = 20;
    this.phase = 0;
    this.scale = 1.0;
    this.width = 6;
    this.height = 6;
  }
}

/**
 * Object Pool for Particles
 */
export class ParticlePool {
  /**
   * @param {number} initialSize
   */
  constructor(initialSize = 100) {
    this.pool = [];
    this.activeList = [];
    for (let i = 0; i < initialSize; i++) {
      this.pool.push(new Particle());
    }
  }

  /**
   * Obtains an inactive particle from the pool, expanding if exhausted
   * @returns {Particle}
   */
  acquire() {
    let p;
    if (this.pool.length > 0) {
      p = this.pool.pop();
    } else {
      p = new Particle();
    }
    p.reset();
    p.active = true;
    this.activeList.push(p);
    return p;
  }

  /**
   * Returns a dead particle back to the pool
   * @param {Particle} p
   * @param {number} activeIndex
   */
  releaseAt(activeIndex) {
    const p = this.activeList[activeIndex];
    p.active = false;
    // Swap and pop for O(1) removal
    const last = this.activeList.pop();
    if (activeIndex < this.activeList.length) {
      this.activeList[activeIndex] = last;
    }
    this.pool.push(p);
  }

  /**
   * Deactivates and reclaims all particles
   */
  clear() {
    while (this.activeList.length > 0) {
      const p = this.activeList.pop();
      p.active = false;
      this.pool.push(p);
    }
  }

  get activeCount() {
    return this.activeList.length;
  }

  get poolCapacity() {
    return this.pool.length + this.activeList.length;
  }
}

/**
 * ParticleEngine
 * Manages ambient floating particles, burst explosions, and projectile trails
 */
export class ParticleEngine {
  /**
   * @param {Object} [options]
   * @param {number} [options.width=800]
   * @param {number} [options.height=600]
   * @param {number} [options.maxAmbient=50]
   * @param {number} [options.maxPool=300]
   */
  constructor(options = {}) {
    this.width = options.width || 800;
    this.height = options.height || 600;
    this.maxAmbient = options.maxAmbient || 50;
    this.pool = new ParticlePool(options.maxPool || 300);

    this.feverActive = false;
    this.feverMultiplier = 1.0;
    this.ambientTimer = 0;
    this.ambientInterval = 0.15; // spawn ambient particle every 150ms

    // Pre-populate ambient background particles
    this.seedAmbientParticles(Math.floor(this.maxAmbient * 0.7));
  }

  /**
   * Sets canvas dimensions
   * @param {number} w
   * @param {number} h
   */
  resize(w, h) {
    this.width = Math.max(10, Number(w) || 800);
    this.height = Math.max(10, Number(h) || 600);
  }

  /**
   * Toggles or adjusts fever mode
   * @param {boolean} isActive
   * @param {number} [multiplier=2.0]
   */
  setFeverMode(isActive, multiplier = 2.0) {
    this.feverActive = Boolean(isActive);
    this.feverMultiplier = this.feverActive ? Math.max(1.0, Number(multiplier) || 2.0) : 1.0;
    this.ambientInterval = this.feverActive ? 0.08 : 0.15;
  }

  /**
   * Pre-populates ambient particles distributed across the screen
   * @param {number} count
   */
  seedAmbientParticles(count) {
    for (let i = 0; i < count; i++) {
      const p = this.spawnAmbientParticle();
      if (p) {
        // Disperse initial y across entire height
        p.y = Math.random() * this.height;
        p.age = Math.random() * p.lifespan * 0.8;
      }
    }
  }

  /**
   * Spawns a single ambient particle (bubble, golden star, or dust mote)
   * @returns {Particle|null}
   */
  spawnAmbientParticle() {
    const activeAmbient = this.pool.activeList.filter(p => p.kind === 'ambient').length;
    const limit = this.feverActive ? Math.floor(this.maxAmbient * 1.6) : this.maxAmbient;
    if (activeAmbient >= limit) {
      return null;
    }

    const p = this.pool.acquire();
    p.kind = 'ambient';

    const randType = Math.random();
    if (this.feverActive || randType < 0.35) {
      // Golden / Starlight Star
      p.subType = 'star';
      p.radius = 4 + Math.random() * 6; // 4 to 10px
      p.color = this.feverActive
        ? (Math.random() < 0.6 ? '#ffd32a' : '#ffeaa7')
        : '#ffeaa7';
      p.glow = 'rgba(255, 211, 42, 0.6)';
      p.maxAlpha = 0.5 + Math.random() * 0.45;
      p.alpha = 0;
      p.lifespan = 3.5 + Math.random() * 3.0; // 3.5 - 6.5s
      p.vy = -(15 + Math.random() * 25);
      p.vx = (Math.random() - 0.5) * 10;
      p.rotation = Math.random() * Math.PI * 2;
      p.angularVelocity = (Math.random() - 0.5) * 1.5;
    } else if (randType < 0.75) {
      // Gentle Translucent Bubble
      p.subType = 'bubble';
      p.radius = 6 + Math.random() * 10; // 6 to 16px
      const bubbleColors = [
        'rgba(162, 155, 254, 0.45)', // Lilac
        'rgba(116, 185, 255, 0.40)', // Sky
        'rgba(85, 239, 196, 0.35)',  // Mint
        'rgba(255, 234, 167, 0.40)'   // Soft gold
      ];
      p.color = bubbleColors[Math.floor(Math.random() * bubbleColors.length)];
      p.glow = 'rgba(255, 255, 255, 0.3)';
      p.maxAlpha = 0.4 + Math.random() * 0.35;
      p.alpha = 0;
      p.lifespan = 5.0 + Math.random() * 4.0;
      p.vy = -(25 + Math.random() * 30);
      p.wobbleFreq = 1.0 + Math.random() * 0.8;
      p.wobbleAmp = 15 + Math.random() * 20;
      p.phase = Math.random() * Math.PI * 2;
    } else {
      // Dust Mote / Classroom Sparkle
      p.subType = 'mote';
      p.radius = 1.5 + Math.random() * 2;
      p.color = '#ffffff';
      p.glow = 'rgba(255, 255, 255, 0.5)';
      p.maxAlpha = 0.3 + Math.random() * 0.35;
      p.alpha = 0;
      p.lifespan = 4.0 + Math.random() * 3.0;
      p.vy = -(10 + Math.random() * 18);
      p.vx = (Math.random() - 0.5) * 15;
    }

    p.startX = Math.random() * this.width;
    p.x = p.startX;
    p.y = this.height + p.radius + Math.random() * 30;
    p.age = 0;

    return p;
  }

  /**
   * Spawns a radial burst of particles matching the finger's pedagogical color
   * Fired on key press or target impact
   * 
   * @param {number} x - Center X coordinate
   * @param {number} y - Center Y coordinate
   * @param {string} [fingerOrColor='li'] - Finger ID ('lp','lr','lm','li','ri','rm','rr','rp','thumb') or color
   * @param {Object} [options]
   * @param {number} [options.count=18]
   * @param {number} [options.minSpeed=120]
   * @param {number} [options.maxSpeed=260]
   * @param {number} [options.gravity=320]
   * @param {number} [options.duration=0.55]
   * @returns {Array<Particle>}
   */
  spawnRadialBurst(x, y, fingerOrColor = 'li', options = {}) {
    const colorDef = resolvePedagogicalColor(fingerOrColor);
    const count = options.count || (this.feverActive ? 26 : 18);
    const minSpeed = options.minSpeed || 120;
    const maxSpeed = options.maxSpeed || 260;
    const gravity = options.gravity !== undefined ? options.gravity : 320;
    const baseDuration = options.duration || 0.55;

    const spawned = [];

    for (let i = 0; i < count; i++) {
      const p = this.pool.acquire();
      p.kind = 'burst';
      p.subType = Math.random() < 0.3 ? 'star' : 'spark';
      p.x = x;
      p.y = y;
      p.startX = x;

      // Golden sparkle blend during fever mode
      if (this.feverActive && Math.random() < 0.4) {
        p.color = '#ffd32a';
        p.glow = 'rgba(255, 211, 42, 0.8)';
      } else {
        p.color = colorDef.primary;
        p.glow = colorDef.glow;
      }

      // Full circle angle distribution with jitter
      const angle = (i / count) * Math.PI * 2 + (Math.random() - 0.5) * 0.3;
      const speed = minSpeed + Math.random() * (maxSpeed - minSpeed);

      p.vx = Math.cos(angle) * speed;
      p.vy = Math.sin(angle) * speed;
      p.gravity = gravity;
      p.drag = 1.2;
      p.radius = 3 + Math.random() * 4;
      p.maxAlpha = 0.95;
      p.alpha = 0.95;
      p.lifespan = baseDuration * (0.75 + Math.random() * 0.5);
      p.age = 0;
      p.rotation = Math.random() * Math.PI * 2;
      p.angularVelocity = (Math.random() - 0.5) * 6;

      spawned.push(p);
    }

    return spawned;
  }

  /**
   * Spawns trail particles along a projectile arc
   * 
   * @param {number} x
   * @param {number} y
   * @param {string} fingerOrColor
   * @param {number} [count=2]
   * @returns {Array<Particle>}
   */
  spawnTrailParticle(x, y, fingerOrColor = 'li', count = 2) {
    const colorDef = resolvePedagogicalColor(fingerOrColor);
    const spawned = [];

    for (let i = 0; i < count; i++) {
      const p = this.pool.acquire();
      p.kind = 'trail';
      p.subType = Math.random() < 0.4 ? 'star' : 'disc';
      p.x = x + (Math.random() - 0.5) * 8;
      p.y = y + (Math.random() - 0.5) * 8;
      p.vx = (Math.random() - 0.5) * 30;
      p.vy = (Math.random() - 0.5) * 30 - 15;
      p.gravity = 40;
      p.drag = 0.8;
      p.radius = 2.5 + Math.random() * 3.5;
      p.color = colorDef.primary;
      p.glow = colorDef.glow;
      p.maxAlpha = 0.85;
      p.alpha = 0.85;
      p.lifespan = 0.32 + Math.random() * 0.25;
      p.age = 0;
      p.rotation = Math.random() * Math.PI * 2;
      p.angularVelocity = (Math.random() - 0.5) * 4;

      spawned.push(p);
    }

    return spawned;
  }

  /**
   * Spawns victory celebration confetti pieces
   * 
   * @param {number} x
   * @param {number} y
   * @param {number} [count=45]
   * @returns {Array<Particle>}
   */
  spawnConfetti(x, y, count = 45) {
    const palette = ['#ff6b81', '#ff9f43', '#ffd32a', '#2ed573', '#54a0ff', '#a29bfe', '#ffffff'];
    const spawned = [];

    for (let i = 0; i < count; i++) {
      const p = this.pool.acquire();
      p.kind = 'confetti';
      p.subType = 'ribbon';
      p.x = x + (Math.random() - 0.5) * 40;
      p.y = y + (Math.random() - 0.5) * 20;

      const angle = -Math.PI / 2 + (Math.random() - 0.5) * 1.8;
      const speed = 180 + Math.random() * 260;

      p.vx = Math.cos(angle) * speed;
      p.vy = Math.sin(angle) * speed;
      p.gravity = 280;
      p.drag = 0.9;
      p.width = 6 + Math.random() * 5;
      p.height = 10 + Math.random() * 6;
      p.color = palette[Math.floor(Math.random() * palette.length)];
      p.glow = 'transparent';
      p.maxAlpha = 1.0;
      p.alpha = 1.0;
      p.lifespan = 1.2 + Math.random() * 0.8;
      p.age = 0;
      p.rotation = Math.random() * Math.PI * 2;
      p.angularVelocity = (Math.random() - 0.5) * 8;

      spawned.push(p);
    }

    return spawned;
  }

  /**
   * Updates all active particles by dt seconds
   * Reclaims dead particles to the pool
   * 
   * @param {number} dt - Delta time in seconds (clamped to 0.1s max to prevent tunneling)
   * @returns {number} Active particle count
   */
  update(dt) {
    const safeDt = Math.min(0.1, Math.max(0.001, dt || 0.016));

    // Ambient spawn cycle
    this.ambientTimer += safeDt;
    if (this.ambientTimer >= this.ambientInterval) {
      this.ambientTimer = 0;
      this.spawnAmbientParticle();
    }

    const activeList = this.pool.activeList;
    // Iterate backward to allow safe releaseAt swap-and-pop
    for (let i = activeList.length - 1; i >= 0; i--) {
      const p = activeList[i];
      p.age += safeDt;

      if (p.age >= p.lifespan) {
        this.pool.releaseAt(i);
        continue;
      }

      const progress = p.age / p.lifespan;

      // Update alpha envelopes
      if (p.kind === 'ambient') {
        // Fade in first 20%, hold, fade out last 20%
        if (progress < 0.2) {
          p.alpha = (progress / 0.2) * p.maxAlpha;
        } else if (progress > 0.8) {
          p.alpha = ((1 - progress) / 0.2) * p.maxAlpha;
        } else {
          p.alpha = p.maxAlpha;
        }

        // Ambient calm vertical drift (zero horizontal sway/wobble to prevent motion sickness)
        p.x += (p.vx || 0) * safeDt;
        p.y += p.vy * safeDt;

        // If particle floated above screen, reclaim early
        if (p.y < -30) {
          this.pool.releaseAt(i);
          continue;
        }
      } else {
        // Burst, trail, confetti: linear or quadratic alpha decay
        p.alpha = (1.0 - progress) * p.maxAlpha;

        // Physics integration
        if (p.drag > 0) {
          p.vx *= Math.max(0, 1 - p.drag * safeDt);
          p.vy *= Math.max(0, 1 - p.drag * safeDt);
        }
        if (p.gravity > 0) {
          p.vy += p.gravity * safeDt;
        }

        p.x += p.vx * safeDt;
        p.y += p.vy * safeDt;
      }

      // Angular rotation
      if (p.angularVelocity !== 0) {
        p.rotation += p.angularVelocity * safeDt;
      }
    }

    return this.pool.activeCount;
  }

  /**
   * Renders all active particles onto Canvas 2D context
   * @param {CanvasRenderingContext2D} ctx
   */
  render(ctx) {
    if (!ctx) return;

    const activeList = this.pool.activeList;
    if (activeList.length === 0) return;

    ctx.save();

    for (let i = 0; i < activeList.length; i++) {
      const p = activeList[i];
      if (p.alpha <= 0.01) continue;

      ctx.save();
      ctx.globalAlpha = Math.max(0, Math.min(1, p.alpha));
      ctx.translate(p.x, p.y);

      if (p.rotation !== 0) {
        ctx.rotate(p.rotation);
      }

      if (p.subType === 'star') {
        this._renderStar(ctx, p.radius, p.color, p.glow);
      } else if (p.subType === 'bubble') {
        this._renderBubble(ctx, p.radius, p.color);
      } else if (p.subType === 'ribbon') {
        // Confetti piece with 3D flip effect
        const flip = Math.cos(p.age * 12);
        ctx.scale(1.0, flip);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.width / 2, -p.height / 2, p.width, p.height);
      } else {
        // Disc / Spark / Mote
        ctx.fillStyle = p.color;
        if (p.glow && p.glow !== 'transparent') {
          ctx.shadowColor = p.glow;
          ctx.shadowBlur = 6;
        }
        ctx.beginPath();
        ctx.arc(0, 0, Math.max(1, p.radius), 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    }

    ctx.restore();
  }

  /**
   * Helper to draw a 4-point diamond star
   * @private
   */
  _renderStar(ctx, radius, color, glow) {
    if (glow) {
      ctx.shadowColor = glow;
      ctx.shadowBlur = 8;
    }
    ctx.fillStyle = color;
    ctx.beginPath();
    const rOuter = radius;
    const rInner = radius * 0.32;
    for (let i = 0; i < 4; i++) {
      const outerAngle = (i * Math.PI) / 2;
      const innerAngle = outerAngle + Math.PI / 4;
      if (i === 0) {
        ctx.moveTo(Math.cos(outerAngle) * rOuter, Math.sin(outerAngle) * rOuter);
      } else {
        ctx.lineTo(Math.cos(outerAngle) * rOuter, Math.sin(outerAngle) * rOuter);
      }
      ctx.lineTo(Math.cos(innerAngle) * rInner, Math.sin(innerAngle) * rInner);
    }
    ctx.closePath();
    ctx.fill();
  }

  /**
   * Helper to draw a translucent bubble with a specular reflection
   * @private
   */
  _renderBubble(ctx, radius, color) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.fill();

    // Subtle specular highlight on top-left of bubble
    ctx.fillStyle = 'rgba(255, 255, 255, 0.65)';
    ctx.beginPath();
    ctx.arc(-radius * 0.35, -radius * 0.35, radius * 0.22, 0, Math.PI * 2);
    ctx.fill();
  }

  /**
   * Clears all active particles
   */
  clear() {
    this.pool.clear();
  }

  /**
   * Disposes the engine
   */
  dispose() {
    this.clear();
  }
}

export default {
  ParticleEngine,
  ParticlePool,
  Particle,
  PEDAGOGICAL_COLORS,
  resolvePedagogicalColor
};
