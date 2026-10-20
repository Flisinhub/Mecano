/**
 * MascotAnimator.js - Procedural Mascot Animation Engine for Mecano
 * 
 * Implements:
 * 1. Continuous sinusoidal resting breathing (vertical translation & volume-preserving scale).
 * 2. Look-at angular tilt (-4deg to +4deg) tracking target key position from KEY_TARGET_CHANGED.
 * 3. Combo streak micro-hops and power jumps with physics simulation.
 * 
 * Works in browser DOM and in headless Node.js environments.
 */

export class MascotAnimator {
  /**
   * @param {Object} [options]
   * @param {HTMLElement} [options.element=null] Target DOM element for transforms
   * @param {Object} [options.eventBus=null] EventBus instance for automatic event subscriptions
   * @param {number} [options.breathingPeriod=2.6] Resting breathing cycle period in seconds
   * @param {number} [options.breathingAmplitude=4.0] Peak vertical breathing translation in pixels
   * @param {number} [options.breathingScaleAmp=0.02] Peak scale oscillation
   * @param {number} [options.maxTiltDeg=4.0] Maximum look-at angular tilt in degrees
   * @param {number} [options.tiltResponsiveness=8.0] Exponential decay smoothing rate for tilt
   * @param {number} [options.referenceCenterX=null] Center X coordinate for keyboard look-at calculation
   * @param {number} [options.referenceHalfWidth=350] Expected half-width of keyboard spread
   */
  constructor(options = {}) {
    this.element = options.element || null;
    this.eventBus = options.eventBus || null;

    // Configurable parameters
    this.breathingPeriod = options.breathingPeriod || 2.6; // seconds
    this.breathingAmplitude = options.breathingAmplitude !== undefined ? options.breathingAmplitude : 4.0; // px
    this.breathingScaleAmp = options.breathingScaleAmp !== undefined ? options.breathingScaleAmp : 0.02;
    this.maxTiltDeg = options.maxTiltDeg !== undefined ? options.maxTiltDeg : 0;
    this.tiltResponsiveness = options.tiltResponsiveness || 8.0;
    this.referenceCenterX = options.referenceCenterX || null;
    this.referenceHalfWidth = options.referenceHalfWidth || 350;

    // Internal simulation state
    this._time = 0; // elapsed seconds
    this._currentTiltDeg = 0;
    this._targetTiltDeg = 0;
    this._currentYBreath = 0;
    this._currentScaleY = 1.0;
    this._currentScaleX = 1.0;

    // Hop / Jump physics simulation
    this._hopVelocity = 0; // px/s (negative is upward)
    this._hopY = 0; // current vertical offset from hop
    this._gravity = 650; // px/s^2
    this._isHopping = false;

    // Active lifecycle
    this._isRunning = false;
    this._rafId = null;
    this._lastTimestamp = 0;
    this._unsubscribers = [];

    if (this.eventBus) {
      this._setupListeners();
    }
  }

  /**
   * Bind or change the target DOM element.
   * @param {HTMLElement|null} el
   */
  bindElement(el) {
    this.element = el;
    if (this.element && this.element.style) {
      this.element.style.transformOrigin = '50% 85%';
    }
  }

  /**
   * Register EventBus listeners for target key updates and combos.
   * @private
   */
  _setupListeners() {
    if (!this.eventBus || typeof this.eventBus.on !== 'function') return;

    // KEY_TARGET_CHANGED { screenPosition, key, finger, hand }
    const unsubTarget = this.eventBus.on('KEY_TARGET_CHANGED', (payload) => {
      if (payload && payload.screenPosition) {
        this.setTargetKeyPosition(payload.screenPosition);
      }
    });
    this._unsubscribers.push(unsubTarget);

    // KEY_PRESSED_SUCCESS { key, comboCount }
    const unsubSuccess = this.eventBus.on('KEY_PRESSED_SUCCESS', (payload) => {
      if (payload && typeof payload.comboCount === 'number') {
        this.triggerHop(payload.comboCount);
      }
    });
    this._unsubscribers.push(unsubSuccess);
  }

  /**
   * Update look-at target angle based on screen coordinate of expected key.
   * @param {{ x: number, y?: number }} screenPosition
   */
  setTargetKeyPosition(screenPosition) {
    if (!screenPosition || typeof screenPosition.x !== 'number') return;

    // Determine reference keyboard center X
    let centerX = this.referenceCenterX;
    if (centerX === null) {
      if (typeof window !== 'undefined' && window.innerWidth) {
        centerX = window.innerWidth / 2;
      } else {
        centerX = 500;
      }
    }

    const deltaX = screenPosition.x - centerX;
    const ratio = Math.max(-1.0, Math.min(1.0, deltaX / this.referenceHalfWidth));
    this._targetTiltDeg = ratio * this.maxTiltDeg;
  }

  /**
   * Directly set target tilt in degrees (clamped to [-maxTiltDeg, +maxTiltDeg]).
   * @param {number} degrees
   */
  setTargetTilt(degrees) {
    const d = Number(degrees) || 0;
    this._targetTiltDeg = Math.max(-this.maxTiltDeg, Math.min(this.maxTiltDeg, d));
  }

  /**
   * Trigger a procedural hop/jump based on combo count.
   * - Combo multiples of 5: Power jump (higher impulse)
   * - Combo >= 3 or single hits: Micro hop
   * @param {number} comboCount
   */
  triggerHop(comboCount = 1) {
    const combo = Math.max(1, Number(comboCount) || 1);
    if (combo % 5 === 0) {
      // Power Jump
      this._hopVelocity = -220;
      this._isHopping = true;
    } else if (combo >= 3) {
      // Micro Hop
      this._hopVelocity = -120;
      this._isHopping = true;
    } else {
      // Gentle bounce on initial hits
      this._hopVelocity = -75;
      this._isHopping = true;
    }
  }

  /**
   * Step the procedural simulation by delta time in milliseconds.
   * Uses fixed sub-stepping to guarantee physical stability without truncating time.
   * @param {number} deltaTimeMs
   */
  update(deltaTimeMs) {
    const totalDt = Math.max(0, Math.min(2000, deltaTimeMs)) / 1000;
    const maxSubStep = 0.05; // 50ms sub-steps
    let remaining = totalDt;

    while (remaining > 0) {
      const dt = Math.min(maxSubStep, remaining);
      this._time += dt;

      // 1. Sinusoidal Resting Breathing calculation
      const angularFreq = (2 * Math.PI) / this.breathingPeriod;
      this._currentYBreath = this.breathingAmplitude * Math.sin(angularFreq * this._time);

      const scaleYOffset = this.breathingScaleAmp * Math.sin(angularFreq * this._time - Math.PI / 4);
      this._currentScaleY = 1.0 + scaleYOffset;
      this._currentScaleX = 1.0 / this._currentScaleY;

      // 2. Smooth Look-At Tilt interpolation (exponential decay lerp)
      const decayFactor = 1.0 - Math.exp(-this.tiltResponsiveness * dt);
      this._currentTiltDeg += (this._targetTiltDeg - this._currentTiltDeg) * decayFactor;

      // 3. Hop / Jump vertical physics
      if (this._isHopping) {
        this._hopVelocity += this._gravity * dt;
        this._hopY += this._hopVelocity * dt;

        // Check ground landing
        if (this._hopY >= 0) {
          this._hopY = 0;
          this._hopVelocity = 0;
          this._isHopping = false;
        }
      }

      remaining -= dt;
    }

    // Apply calculated transforms to element if bound
    if (this.element && this.element.style) {
      const state = this.getTransformState();
      this.element.style.transform = state.transformString;
    }
  }

  /**
   * Get current transform matrix / values for inspection, rendering, or testing.
   * @returns {{
   *   translateY: number,
   *   rotateDeg: number,
   *   scaleX: number,
   *   scaleY: number,
   *   hopY: number,
   *   breathY: number,
   *   transformString: string,
   *   isHopping: boolean
   * }}
   */
  getTransformState() {
    const totalY = this._currentYBreath + this._hopY;
    const rotate = this._currentTiltDeg;
    const sx = this._currentScaleX;
    const sy = this._currentScaleY;

    const transformString = `translateY(${totalY.toFixed(2)}px) rotate(${rotate.toFixed(2)}deg) scale(${sx.toFixed(3)}, ${sy.toFixed(3)})`;

    return {
      translateY: Number(totalY.toFixed(2)),
      rotateDeg: Number(rotate.toFixed(2)),
      scaleX: Number(sx.toFixed(3)),
      scaleY: Number(sy.toFixed(3)),
      hopY: Number(this._hopY.toFixed(2)),
      breathY: Number(this._currentYBreath.toFixed(2)),
      transformString,
      isHopping: this._isHopping
    };
  }

  /**
   * Start autonomous requestAnimationFrame render loop (browser environment).
   */
  start() {
    if (this._isRunning) return;
    this._isRunning = true;
    this._lastTimestamp = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();

    const loop = (timestamp) => {
      if (!this._isRunning) return;
      const now = timestamp || ((typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now());
      const delta = now - this._lastTimestamp;
      this._lastTimestamp = now;

      this.update(delta);

      if (typeof requestAnimationFrame === 'function') {
        this._rafId = requestAnimationFrame(loop);
      }
    };

    if (typeof requestAnimationFrame === 'function') {
      this._rafId = requestAnimationFrame(loop);
    }
  }

  /**
   * Stop autonomous animation loop.
   */
  stop() {
    this._isRunning = false;
    if (this._rafId && typeof cancelAnimationFrame === 'function') {
      cancelAnimationFrame(this._rafId);
      this._rafId = null;
    }
  }

  /**
   * Reset simulation state back to zero / rest.
   */
  reset() {
    this._time = 0;
    this._currentTiltDeg = 0;
    this._targetTiltDeg = 0;
    this._currentYBreath = 0;
    this._currentScaleY = 1.0;
    this._currentScaleX = 1.0;
    this._hopVelocity = 0;
    this._hopY = 0;
    this._isHopping = false;
  }

  /**
   * Teardown and unsubscribe from all events.
   */
  destroy() {
    this.stop();
    for (const unsub of this._unsubscribers) {
      if (typeof unsub === 'function') unsub();
    }
    this._unsubscribers = [];
    this.element = null;
  }
}
