/**
 * LiveScene.js - Reactive Living Scene, Parallax Background & VFX Orchestrator
 * 
 * Coordinates:
 * - Multi-axis smooth Parallax camera on Main Scene.png with organic living drift & exponential lerp
 * - Ambient floating particles (bubbles, golden stars, motes) with ParticleEngine
 * - Dynamic radiant lighting filter for Fever Mode responding to FEVER_MODE_CHANGED
 * - Unified 3px sticker outline SVG filter & drop-shadow injector
 * - Quadratic Bézier magic projectiles and impact bursts via BezierProjectiles
 * Fulfills Requirement R2 and PROJECT.md specifications.
 */

import { ParticleEngine } from './ParticleEngine.js';
import { BezierProjectiles } from './BezierProjectiles.js';
import { applySquashAndStretch } from './SquashStretch.js';

/**
 * Pure mathematical computation of target parallax offset and exponential lerp
 * 
 * @param {number} normX - Normalized mouse X in [-1, 1]
 * @param {number} normY - Normalized mouse Y in [-1, 1]
 * @param {number} timeMs - Timestamp in milliseconds
 * @param {number} viewportWidth - Canvas / viewport width
 * @param {number} viewportHeight - Canvas / viewport height
 * @param {number} currentX - Current smoothed offset X
 * @param {number} currentY - Current smoothed offset Y
 * @param {number} dtSec - Delta time in seconds
 * @param {number} [scaleFactor=1.08] - Image overscan ratio
 * @param {number} [lambda=3.5] - Lerp exponential rate
 * @returns {{ targetX: number, targetY: number, nextX: number, nextY: number }}
 */
export function calculateParallaxOffset(
  normX,
  normY,
  timeMs,
  viewportWidth,
  viewportHeight,
  currentX,
  currentY,
  dtSec,
  scaleFactor = 1.08,
  lambda = 3.5
) {
  // Completely fixed, stationary background (prevents dizziness/motion sickness)
  return {
    targetX: 0,
    targetY: 0,
    nextX: 0,
    nextY: 0
  };
}

/**
 * Injects the SVG 3px sticker outline filter into the DOM if not already present
 * 
 * @param {Document} [doc]
 * @returns {SVGElement|null}
 */
export function injectStickerFilter(doc) {
  const targetDoc = doc || (typeof document !== 'undefined' ? document : null);
  if (!targetDoc || !targetDoc.createElementNS) return null;

  if (targetDoc.getElementById('sticker-outline-3px')) {
    return targetDoc.getElementById('sticker-outline-3px');
  }

  const svgNS = 'http://www.w3.org/2000/svg';
  const svg = targetDoc.createElementNS(svgNS, 'svg');
  svg.setAttribute('id', 'vfx-filter-defs');
  svg.setAttribute('style', 'position: absolute; width: 0; height: 0; overflow: hidden; pointer-events: none;');
  svg.setAttribute('aria-hidden', 'true');

  svg.innerHTML = `
    <defs>
      <filter id="sticker-outline-3px" x="-20%" y="-20%" width="140%" height="140%">
        <!-- 1. Dilate alpha mask outward by 3px -->
        <feMorphology in="SourceAlpha" operator="dilate" radius="3" result="dilatedAlpha" />
        <!-- 2. Flood dilated mask with pure white -->
        <feFlood flood-color="#ffffff" flood-opacity="1" result="whiteColor" />
        <feComposite in="whiteColor" in2="dilatedAlpha" operator="in" result="whiteOutline" />
        <!-- 3. Cast a smooth drop-shadow under the white outline -->
        <feDropShadow in="whiteOutline" dx="0" dy="5" stdDeviation="5" flood-color="rgba(15, 17, 35, 0.45)" result="dropShadow" />
        <!-- 4. Composite in order: Shadow -> White Outline -> Original Graphic -->
        <feMerge>
          <feMergeNode in="dropShadow" />
          <feMergeNode in="whiteOutline" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
    </defs>
  `;

  if (targetDoc.body) {
    targetDoc.body.appendChild(svg);
  }

  return svg;
}

/**
 * LiveScene Class
 */
export class LiveScene {
  /**
   * @param {Object} [options]
   * @param {HTMLElement|string} [options.container] - Container element or selector
   * @param {import('../core/EventBus.js').EventBus|null} [options.eventBus]
   * @param {HTMLElement|null} [options.mascotElement]
   * @param {string} [options.backgroundImageUrl='assets/main_scene.png']
   * @param {boolean} [options.autoStart=true]
   * @param {boolean} [options.headless=false]
   */
  constructor(options = {}) {
    this.options = options;
    this.eventBus = options.eventBus || null;
    this.mascotElement = options.mascotElement || null;
    this.backgroundImageUrl = options.backgroundImageUrl || 'assets/main_scene.png';
    this.isHeadless = Boolean(options.headless || typeof window === 'undefined');

    // Viewport dimensions
    this.width = typeof window !== 'undefined' ? window.innerWidth : 1024;
    this.height = typeof window !== 'undefined' ? window.innerHeight : 768;

    // Parallax state
    this.scaleFactor = 1.08;
    this.normX = 0;
    this.normY = 0;
    this.currentX = 0;
    this.currentY = 0;
    this.targetX = 0;
    this.targetY = 0;
    this.lastTime = 0;

    // Fever Mode state
    this.feverActive = false;
    this.feverMultiplier = 1.0;

    // Particle & Projectile engines
    this.ambientParticleEngine = new ParticleEngine({
      width: this.width,
      height: this.height,
      maxAmbient: 50
    });

    this.projectiles = new BezierProjectiles({
      particleEngine: this.ambientParticleEngine,
      mascotElement: this.mascotElement,
      eventBus: this.eventBus
    });

    // Subsystems & DOM refs
    this.container = null;
    this.parallaxCanvas = null;
    this.parallaxCtx = null;
    this.ambientCanvas = null;
    this.ambientCtx = null;
    this.feverOverlay = null;
    this.projectileCanvas = null;
    this.projectileCtx = null;

    this.backgroundImage = null;
    this.isImageLoaded = false;
    this.rafId = null;
    this.isRunning = false;
    this.unsubscribers = [];

    // Bound handlers for clean removal
    this._onMouseMove = this.handleMouseMove.bind(this);
    this._onMouseLeave = this.handleMouseLeave.bind(this);
    this._onResize = this.handleResize.bind(this);
    this._loop = this.loop.bind(this);

    if (!this.isHeadless) {
      this.initDom();
      this.initBackground();
      injectStickerFilter();
    }

    if (this.eventBus) {
      this.bindEvents(this.eventBus);
    }

    if (options.autoStart && !this.isHeadless) {
      this.start();
    }
  }

  /**
   * Builds or mounts required DOM canvases and layers
   */
  initDom() {
    if (typeof document === 'undefined') return;

    let containerEl = null;
    if (typeof this.options.container === 'string') {
      containerEl = document.querySelector(this.options.container);
    } else if (this.options.container && this.options.container.nodeType) {
      containerEl = this.options.container;
    }

    if (!containerEl) {
      // Find or create #live-scene-container
      containerEl = document.getElementById('live-scene-container');
      if (!containerEl) {
        containerEl = document.createElement('div');
        containerEl.id = 'live-scene-container';
        containerEl.className = 'live-scene-container';
        document.body.insertBefore(containerEl, document.body.firstChild);
      }
    }
    this.container = containerEl;

    // 1. Parallax Canvas
    this.parallaxCanvas = this.container.querySelector('#parallax-canvas');
    if (!this.parallaxCanvas) {
      this.parallaxCanvas = document.createElement('canvas');
      this.parallaxCanvas.id = 'parallax-canvas';
      this.parallaxCanvas.className = 'parallax-canvas';
      this.container.appendChild(this.parallaxCanvas);
    }
    this.parallaxCtx = this.parallaxCanvas.getContext('2d');

    // 2. Ambient Particles Canvas
    this.ambientCanvas = this.container.querySelector('#ambient-particles-canvas');
    if (!this.ambientCanvas) {
      this.ambientCanvas = document.createElement('canvas');
      this.ambientCanvas.id = 'ambient-particles-canvas';
      this.ambientCanvas.className = 'ambient-particles-canvas';
      this.container.appendChild(this.ambientCanvas);
    }
    this.ambientCtx = this.ambientCanvas.getContext('2d');

    // 3. Fever Lighting Overlay
    this.feverOverlay = this.container.querySelector('#fever-lighting-overlay');
    if (!this.feverOverlay) {
      this.feverOverlay = document.createElement('div');
      this.feverOverlay.id = 'fever-lighting-overlay';
      this.feverOverlay.className = 'fever-lighting-overlay';
      this.container.appendChild(this.feverOverlay);
    }

    // 4. Projectile Canvas
    this.projectileCanvas = document.getElementById('projectile-vfx-canvas');
    if (!this.projectileCanvas) {
      this.projectileCanvas = document.createElement('canvas');
      this.projectileCanvas.id = 'projectile-vfx-canvas';
      this.projectileCanvas.className = 'projectile-vfx-canvas';
      document.body.appendChild(this.projectileCanvas);
    }
    this.projectileCtx = this.projectileCanvas.getContext('2d');

    this.handleResize();

    // Attach event listeners
    window.addEventListener('mousemove', this._onMouseMove, { passive: true });
    window.addEventListener('mouseleave', this._onMouseLeave, { passive: true });
    window.addEventListener('resize', this._onResize, { passive: true });
  }

  /**
   * Loads background image for parallax canvas
   */
  initBackground() {
    if (typeof Image === 'undefined') return;

    const img = new Image();
    img.src = this.backgroundImageUrl;
    img.onload = () => {
      this.backgroundImage = img;
      this.isImageLoaded = true;
    };
    img.onerror = () => {
      // Fallback try Sprites/Main Scene.png
      if (this.backgroundImageUrl !== 'Sprites/Main Scene.png') {
        img.src = 'Sprites/Main Scene.png';
      }
    };
  }

  /**
   * Binds EventBus listeners
   * @param {import('../core/EventBus.js').EventBus} bus
   */
  bindEvents(bus) {
    if (!bus || typeof bus.on !== 'function') return;

    // FEVER_MODE_CHANGED: dynamic lighting and particle boost
    const unsubFever = bus.on('FEVER_MODE_CHANGED', (payload) => {
      this.setFeverMode(payload && payload.isActive, payload ? payload.multiplier : 1.0);
    });
    this.unsubscribers.push(unsubFever);

    // LEVEL_COMPLETED: confetti celebration
    const unsubLevel = bus.on('LEVEL_COMPLETED', () => {
      this.triggerConfetti();
    });
    this.unsubscribers.push(unsubLevel);
  }

  /**
   * Sets or clears fever mode lighting and particle intensity
   * @param {boolean} isActive
   * @param {number} [multiplier=2.0]
   */
  setFeverMode(isActive, multiplier = 2.0) {
    this.feverActive = Boolean(isActive);
    this.feverMultiplier = this.feverActive ? Math.max(1.0, Number(multiplier) || 2.0) : 1.0;

    if (this.feverOverlay) {
      if (this.feverActive) {
        this.feverOverlay.classList.add('active');
        if (this.container) this.container.classList.add('fever-active');
      } else {
        this.feverOverlay.classList.remove('active');
        if (this.container) this.container.classList.remove('fever-active');
      }
    }

    this.ambientParticleEngine.setFeverMode(this.feverActive, this.feverMultiplier);
  }

  /**
   * Handles mouse motion across the viewport
   * @param {MouseEvent|{ clientX: number, clientY: number }} e
   */
  handleMouseMove(e) {
    if (!e) return;
    const clientX = e.clientX || 0;
    const clientY = e.clientY || 0;
    this.normX = (clientX / this.width) * 2 - 1;
    this.normY = (clientY / this.height) * 2 - 1;
  }

  /**
   * Gracefully re-centers parallax when mouse exits window
   */
  handleMouseLeave() {
    this.normX = 0;
    this.normY = 0;
  }

  /**
   * Updates canvas buffers upon viewport resize
   */
  handleResize() {
    if (typeof window === 'undefined') return;

    this.width = window.innerWidth;
    this.height = window.innerHeight;

    const dpr = window.devicePixelRatio || 1;

    [this.parallaxCanvas, this.ambientCanvas, this.projectileCanvas].forEach((canvas) => {
      if (!canvas) return;
      canvas.width = Math.floor(this.width * dpr);
      canvas.height = Math.floor(this.height * dpr);
      canvas.style.width = `${this.width}px`;
      canvas.style.height = `${this.height}px`;

      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.resetTransform();
        ctx.scale(dpr, dpr);
      }
    });

    this.ambientParticleEngine.resize(this.width, this.height);
  }

  /**
   * Triggers screen celebration confetti
   * @param {number} [x]
   * @param {number} [y]
   * @param {number} [count=45]
   */
  triggerConfetti(x, y, count = 45) {
    const targetX = x !== undefined ? x : this.width / 2;
    const targetY = y !== undefined ? y : this.height * 0.45;
    this.ambientParticleEngine.spawnConfetti(targetX, targetY, count);
  }

  /**
   * Starts the animation loop
   */
  start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.lastTime = typeof performance !== 'undefined' ? performance.now() : Date.now();
    this.loop(this.lastTime);
  }

  /**
   * Stops the animation loop
   */
  stop() {
    this.isRunning = false;
    if (this.rafId && typeof cancelAnimationFrame === 'function') {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  /**
   * Main render/update loop
   * @param {number} now
   */
  loop(now) {
    if (!this.isRunning) return;

    const dt = (now - (this.lastTime || now)) / 1000;
    this.lastTime = now;

    this.update(dt, now);
    this.render();

    if (typeof requestAnimationFrame === 'function') {
      this.rafId = requestAnimationFrame(this._loop);
    }
  }

  /**
   * Updates parallax physics, particles, and projectiles
   * 
   * @param {number} dt
   * @param {number} [now]
   */
  update(dt, now) {
    const timeMs = now !== undefined ? now : (typeof performance !== 'undefined' ? performance.now() : Date.now());

    // Update parallax offsets
    const { nextX, nextY, targetX, targetY } = calculateParallaxOffset(
      this.normX,
      this.normY,
      timeMs,
      this.width,
      this.height,
      this.currentX,
      this.currentY,
      dt,
      this.scaleFactor
    );

    this.targetX = targetX;
    this.targetY = targetY;
    this.currentX = nextX;
    this.currentY = nextY;

    // Update VFX engines
    this.ambientParticleEngine.update(dt);
    this.projectiles.update(dt);
  }

  /**
   * Renders all layers to their respective canvases
   */
  render() {
    // 1. Render Parallax Canvas
    if (this.parallaxCtx) {
      this.renderParallax(this.parallaxCtx);
    }

    // 2. Render Ambient Particles
    if (this.ambientCtx) {
      this.ambientCtx.clearRect(0, 0, this.width, this.height);
      this.ambientParticleEngine.render(this.ambientCtx);
    }

    // 3. Render Projectiles & Bursts
    if (this.projectileCtx) {
      this.projectileCtx.clearRect(0, 0, this.width, this.height);
      this.projectiles.render(this.projectileCtx);
    }
  }

  /**
   * Draws the smooth parallax background image
   * @param {CanvasRenderingContext2D} ctx
   */
  renderParallax(ctx) {
    ctx.clearRect(0, 0, this.width, this.height);

    if (this.isImageLoaded && this.backgroundImage) {
      const renderW = this.width * this.scaleFactor;
      const renderH = this.height * this.scaleFactor;
      const drawX = (this.width - renderW) / 2 + this.currentX;
      const drawY = (this.height - renderH) / 2 + this.currentY;

      ctx.drawImage(this.backgroundImage, drawX, drawY, renderW, renderH);
    } else {
      // Fallback stylized gradient if image is still loading or unavailable
      const grad = ctx.createLinearGradient(0, 0, 0, this.height);
      grad.addColorStop(0, '#1a1d36');
      grad.addColorStop(0.5, '#2e3860');
      grad.addColorStop(1, '#1e2440');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, this.width, this.height);
    }
  }

  /**
   * Cleans up all DOM nodes, listeners, and timers
   */
  dispose() {
    this.stop();

    if (typeof window !== 'undefined') {
      window.removeEventListener('mousemove', this._onMouseMove);
      window.removeEventListener('mouseleave', this._onMouseLeave);
      window.removeEventListener('resize', this._onResize);
    }

    while (this.unsubscribers.length > 0) {
      const unsub = this.unsubscribers.pop();
      try {
        if (typeof unsub === 'function') unsub();
      } catch (_) {}
    }

    if (this.ambientParticleEngine) this.ambientParticleEngine.dispose();
    if (this.projectiles) this.projectiles.dispose();

    if (this.container && this.container.parentNode && !this.options.container) {
      this.container.parentNode.removeChild(this.container);
    }
    if (this.projectileCanvas && this.projectileCanvas.parentNode) {
      this.projectileCanvas.parentNode.removeChild(this.projectileCanvas);
    }
  }
}

/**
 * Convenience factory
 * @param {HTMLElement|string} [container]
 * @param {Object} [options]
 * @returns {LiveScene}
 */
export function createLiveScene(container, options = {}) {
  return new LiveScene({
    container,
    ...options
  });
}

export default {
  LiveScene,
  createLiveScene,
  calculateParallaxOffset,
  injectStickerFilter
};
