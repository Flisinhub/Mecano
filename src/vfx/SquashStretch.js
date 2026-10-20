/**
 * SquashStretch.js - Damped Harmonic Oscillator Squash & Stretch Engine
 * 
 * Implements physically-accurate damped harmonic deformation for interactive elements
 * (mascot, keys, badges) without permanent distortion or drift.
 * Fulfills Requirement R2 and PROJECT.md specifications.
 */

/**
 * Default harmonic oscillator physical parameters
 */
export const DEFAULT_SPRING_CONFIG = Object.freeze({
  amplitude: 0.20,       // Maximum deformation amplitude (20%)
  dampingRatio: 0.42,    // Damping factor zeta (settles in ~3 oscillations)
  naturalFreq: 26.0,     // Undamped angular frequency omega_n (rad/s)
  durationMs: 380,       // Total animation duration in milliseconds
  origin: '50% 85%'      // Transform origin (bottom-weighted for grounded bounce)
});

/**
 * Pre-calibrated deformation presets for different game events
 */
export const SQUASH_PRESETS = Object.freeze({
  impact: {
    amplitude: 0.22,
    dampingRatio: 0.42,
    naturalFreq: 26.0,
    durationMs: 380,
    origin: '50% 85%'
  },
  hop: {
    amplitude: 0.16,
    dampingRatio: 0.50,
    naturalFreq: 22.0,
    durationMs: 320,
    origin: '50% 90%'
  },
  keyPress: {
    amplitude: 0.12,
    dampingRatio: 0.55,
    naturalFreq: 30.0,
    durationMs: 220,
    origin: '50% 50%'
  },
  gentle: {
    amplitude: 0.08,
    dampingRatio: 0.45,
    naturalFreq: 20.0,
    durationMs: 300,
    origin: '50% 80%'
  }
});

/**
 * Calculates instantaneous scale factors at time t (in seconds)
 * using the damped harmonic oscillator equation:
 * 
 *   sx(t) = 1.0 + A * exp(-zeta * omega_n * t) * cos(omega_d * t)
 *   sy(t) = 1.0 / sx(t)  (preserves 2D volume/area)
 * 
 * @param {number} tSec - Time elapsed in seconds (>= 0)
 * @param {Object} [options]
 * @param {number} [options.amplitude=0.20]
 * @param {number} [options.dampingRatio=0.42]
 * @param {number} [options.naturalFreq=26.0]
 * @param {number} [options.intensity=1.0]
 * @param {'vertical'|'horizontal'} [options.direction='vertical']
 * @returns {{ scaleX: number, scaleY: number, displacement: number }}
 */
export function calculateSquashAndStretch(tSec, options = {}) {
  const intensity = typeof options.intensity === 'number' ? options.intensity : 1.0;
  const A = (options.amplitude ?? DEFAULT_SPRING_CONFIG.amplitude) * intensity;
  const zeta = options.dampingRatio ?? DEFAULT_SPRING_CONFIG.dampingRatio;
  const omegaN = options.naturalFreq ?? DEFAULT_SPRING_CONFIG.naturalFreq;
  const direction = options.direction || 'vertical';

  const t = Math.max(0, tSec);

  // Damped angular frequency: omega_d = omega_n * sqrt(1 - zeta^2)
  const underDamped = Math.max(0, 1 - (zeta * zeta));
  const omegaD = omegaN * Math.sqrt(underDamped);

  // Exponential decay envelope
  const decay = Math.exp(-zeta * omegaN * t);

  // Instantaneous displacement from rest (1.0)
  const displacement = A * decay * Math.cos(omegaD * t);

  let scaleX;
  let scaleY;

  if (direction === 'vertical') {
    // Vertical impact: widens on impact (scaleX > 1), compresses vertically (scaleY < 1)
    scaleX = 1.0 + displacement;
    // Volume preservation: scaleY compensates scaleX
    scaleY = scaleX > 0.01 ? (1.0 / scaleX) : 1.0;
  } else {
    // Horizontal deformation
    scaleY = 1.0 + displacement;
    scaleX = scaleY > 0.01 ? (1.0 / scaleY) : 1.0;
  }

  return {
    scaleX: Number(scaleX.toFixed(4)),
    scaleY: Number(scaleY.toFixed(4)),
    displacement: Number(displacement.toFixed(4))
  };
}

/**
 * Generates keyframe steps for Web Animations API
 * Samples the analytical damped spring formula at discrete intervals
 * 
 * @param {Object} [options]
 * @param {number} [samples=12]
 * @returns {Array<{ transform: string, offset: number }>}
 */
export function generateSpringKeyframes(options = {}, samples = 12) {
  const durationMs = options.durationMs ?? DEFAULT_SPRING_CONFIG.durationMs;
  const totalSec = durationMs / 1000;
  const keyframes = [];

  for (let i = 0; i <= samples; i++) {
    const fraction = i / samples;
    const tSec = fraction * totalSec;
    const { scaleX, scaleY } = calculateSquashAndStretch(tSec, options);

    keyframes.push({
      transform: `scale(${scaleX}, ${scaleY})`,
      offset: Number(fraction.toFixed(3))
    });
  }

  // Ensure strict rest condition at offset 1.0 (anti-drift guarantee)
  keyframes[keyframes.length - 1] = {
    transform: 'scale(1, 1)',
    offset: 1.0
  };

  return keyframes;
}

/**
 * Applies a damped harmonic squash & stretch animation to a DOM element.
 * Safe to call repeatedly: will cancel previous deformation and reset cleanly.
 * 
 * @param {HTMLElement|SVGElement} element - Target element to animate
 * @param {Object} [options]
 * @param {number} [options.intensity=1.0] - Scaling factor for amplitude
 * @param {number} [options.amplitude=0.20]
 * @param {number} [options.dampingRatio=0.42]
 * @param {number} [options.naturalFreq=26.0]
 * @param {number} [options.durationMs=380]
 * @param {string} [options.origin='50% 85%']
 * @param {'impact'|'hop'|'keyPress'|'gentle'} [options.preset]
 * @returns {Animation|{ cancel: Function, finish: Function, finished: Promise<void> }|null}
 */
export function applySquashAndStretch(element, options = {}) {
  if (!element || typeof element !== 'object') {
    return null;
  }

  // Merge preset if provided
  const presetConfig = options.preset && SQUASH_PRESETS[options.preset]
    ? SQUASH_PRESETS[options.preset]
    : {};

  const merged = {
    ...DEFAULT_SPRING_CONFIG,
    ...presetConfig,
    ...options
  };

  const origin = merged.origin || DEFAULT_SPRING_CONFIG.origin;
  const durationMs = merged.durationMs || DEFAULT_SPRING_CONFIG.durationMs;

  // Apply transform origin if style object exists
  if (element.style) {
    element.style.transformOrigin = origin;
  }

  // Cancel any ongoing squash animation on this element
  if (element._activeSquashAnimation && typeof element._activeSquashAnimation.cancel === 'function') {
    try {
      element._activeSquashAnimation.cancel();
    } catch (_) {
      // Ignore cancellation exceptions
    }
    element._activeSquashAnimation = null;
  }

  // Check for Web Animations API support
  if (typeof element.animate === 'function') {
    const keyframes = generateSpringKeyframes(merged, 12);

    const animation = element.animate(keyframes, {
      duration: durationMs,
      easing: 'linear',
      fill: 'none'
    });

    element._activeSquashAnimation = animation;

    const cleanup = () => {
      if (element._activeSquashAnimation === animation) {
        element._activeSquashAnimation = null;
      }
    };

    animation.onfinish = cleanup;
    animation.oncancel = cleanup;

    return animation;
  }

  // Fallback for headless environments or environments lacking Element.animate
  let isCancelled = false;
  let resolveFinished;
  const finishedPromise = new Promise((resolve) => {
    resolveFinished = resolve;
  });

  const timerId = setTimeout(() => {
    if (!isCancelled) {
      if (element.style) {
        element.style.transform = 'scale(1, 1)';
      }
      resolveFinished();
    }
  }, durationMs);

  const fallbackController = {
    cancel: () => {
      isCancelled = true;
      clearTimeout(timerId);
      if (element.style) {
        element.style.transform = 'scale(1, 1)';
      }
      resolveFinished();
    },
    finish: () => {
      isCancelled = true;
      clearTimeout(timerId);
      if (element.style) {
        element.style.transform = 'scale(1, 1)';
      }
      resolveFinished();
    },
    finished: finishedPromise
  };

  element._activeSquashAnimation = fallbackController;
  return fallbackController;
}

export default {
  applySquashAndStretch,
  calculateSquashAndStretch,
  generateSpringKeyframes,
  DEFAULT_SPRING_CONFIG,
  SQUASH_PRESETS
};
