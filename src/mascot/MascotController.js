/**
 * MascotController.js - Real-Time Acoustic Lip-Sync & Parametric Vector Mascot Avatar for Mecano
 * 
 * Fulfills Phase 2 & R3 specifications:
 * - Real-time acoustic envelope lip-sync via AnalyserNode (fftSize=256, RMS + EMA alpha=0.35, threshold=0.015).
 * - Continuous mouthOpenness [0.0 - 1.0] driving parametric SVG mouth geometry.
 * - Viseme & cadence fallback for SpeechSynthesis to ensure the mouth is never static during speech.
 * - Procedural micro-animations: organic eye blink every 3 to 6 seconds.
 * - Look-at tracking: pupils and head tilt (-4deg to +4deg) follow the active key's screen position.
 * - 4 Emotional States:
 *   1. idle: gentle breathing, organic blink, relaxed smile.
 *   2. speaking: real-time lip-sync, lively antenna bounce.
 *   3. streak: radiant star eyes (★ ★), wide joyful smile on combos (5, 10, 20).
 *   4. error: empathetic expression, small 'o' mouth, compassionate tilt (non-punitive).
 */

export const MASCOT_EMOTIONS = Object.freeze({
  IDLE: 'idle',
  SPEAKING: 'speaking',
  STREAK: 'streak',
  ERROR: 'error'
});

/**
 * Returns complete responsive SVG markup for Roby the Robot avatar.
 * ViewBox 0 0 240 240, clean vector geometry matching existing art style.
 */
export function getRobyAvatarSVG() {
  return `
<svg id="mascot-avatar-svg" class="mascot-svg-avatar" viewBox="0 0 240 240" aria-label="Roby el Robot" role="img">
  <defs>
    <!-- Soft chassis gradients -->
    <radialGradient id="roby-head-grad" cx="40%" cy="35%" r="65%">
      <stop offset="0%" stop-color="#ffe4e9" />
      <stop offset="60%" stop-color="#ffb8c6" />
      <stop offset="100%" stop-color="#f492a5" />
    </radialGradient>

    <radialGradient id="roby-mint-grad" cx="40%" cy="30%" r="70%">
      <stop offset="0%" stop-color="#c8f7e4" />
      <stop offset="70%" stop-color="#a8e6cf" />
      <stop offset="100%" stop-color="#7dd3b6" />
    </radialGradient>

    <linearGradient id="roby-screen-grad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#1e293b" />
      <stop offset="100%" stop-color="#0f172a" />
    </linearGradient>

    <linearGradient id="wing-grad-left" x1="100%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="rgba(168, 230, 207, 0.75)" />
      <stop offset="100%" stop-color="rgba(255, 184, 198, 0.35)" />
    </linearGradient>

    <linearGradient id="wing-grad-right" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="rgba(168, 230, 207, 0.75)" />
      <stop offset="100%" stop-color="rgba(255, 184, 198, 0.35)" />
    </linearGradient>

    <!-- Glow filters -->
    <filter id="eye-glow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="3.5" result="blur" />
      <feMerge>
        <feMergeNode in="blur" />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>

    <filter id="star-glow" x="-30%" y="-30%" width="160%" height="160%">
      <feGaussianBlur stdDeviation="4" result="blur" />
      <feMerge>
        <feMergeNode in="blur" />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>
  </defs>

  <!-- Root Animated Container (Breathing & Look-at Tilt) -->
  <g id="roby-root" class="roby-root-group" transform-origin="120 200">
    
    <!-- 1. Translucent Fairy Wings -->
    <g id="roby-wings" class="roby-wings">
      <!-- Left Wing -->
      <path id="roby-wing-left" class="roby-wing" d="M 68,140 C 20,130 5,85 25,60 C 50,30 85,90 78,135 Z"
            fill="url(#wing-grad-left)" stroke="#81e6d9" stroke-width="1.8" opacity="0.85" />
      <!-- Right Wing -->
      <path id="roby-wing-right" class="roby-wing" d="M 172,140 C 220,130 235,85 215,60 C 190,30 155,90 162,135 Z"
            fill="url(#wing-grad-right)" stroke="#81e6d9" stroke-width="1.8" opacity="0.85" />
    </g>

    <!-- 2. Bouncy Antennae with Glowing Stars -->
    <g id="roby-antennae" class="roby-antennae">
      <!-- Left Antenna -->
      <path id="roby-antenna-left" d="M 88,68 Q 72,40 68,26" fill="none" stroke="#a8e6cf" stroke-width="4.5" stroke-linecap="round" />
      <polygon id="roby-star-left" points="68,12 72,22 83,23 74,30 77,41 68,34 59,41 62,30 53,23 64,22"
               fill="#ffd32a" filter="url(#star-glow)" />

      <!-- Right Antenna -->
      <path id="roby-antenna-right" d="M 152,68 Q 168,40 172,26" fill="none" stroke="#a8e6cf" stroke-width="4.5" stroke-linecap="round" />
      <polygon id="roby-star-right" points="172,12 176,22 187,23 178,30 181,41 172,34 163,41 166,30 157,23 168,22"
               fill="#ffd32a" filter="url(#star-glow)" />
    </g>

    <!-- 3. Chibi Spherical Body & Head -->
    <g id="roby-body">
      <!-- Outer Spherical Chassis -->
      <circle cx="120" cy="130" r="76" fill="url(#roby-head-grad)" stroke="#f472b6" stroke-width="3" />
      
      <!-- Mint Goggles on Forehead -->
      <path d="M 70,82 C 70,68 170,68 170,82 C 170,92 155,94 120,94 C 85,94 70,92 70,82 Z"
            fill="url(#roby-mint-grad)" stroke="#38a169" stroke-width="2.5" />
      <ellipse cx="95" cy="80" rx="18" ry="8" fill="rgba(255, 255, 255, 0.45)" />
      <ellipse cx="145" cy="80" rx="18" ry="8" fill="rgba(255, 255, 255, 0.45)" />

      <!-- Dark Glossy Face Screen -->
      <rect x="62" y="96" width="116" height="84" rx="28" ry="28"
            fill="url(#roby-screen-grad)" stroke="#475569" stroke-width="2.5" />

      <!-- Screen reflection gloss -->
      <path d="M 72,106 Q 120,98 168,106 Q 120,114 72,106 Z" fill="rgba(255, 255, 255, 0.12)" />
    </g>

    <!-- 4. Interactive Expressive Eyes (Blinkable, Look-at Tracking, Star Eyes) -->
    <g id="roby-eyes" class="roby-eyes-group">
      <!-- Left Eye -->
      <g id="roby-eye-left" class="roby-eye" transform-origin="94 130">
        <!-- Normal LED Eye -->
        <circle id="roby-eye-left-base" cx="94" cy="130" r="14" fill="#00f2fe" filter="url(#eye-glow)" />
        <circle id="roby-pupil-left" cx="94" cy="130" r="8" fill="#0f172a" />
        <circle cx="91" cy="126" r="3" fill="#ffffff" />
        
        <!-- Star Eye for Streak (Initially Hidden) -->
        <polygon id="roby-star-eye-left" points="94,116 97,125 106,126 99,132 101,141 94,136 87,141 89,132 82,126 91,125"
                 fill="#ffd32a" filter="url(#star-glow)" style="display: none;" />
      </g>

      <!-- Right Eye -->
      <g id="roby-eye-right" class="roby-eye" transform-origin="146 130">
        <!-- Normal LED Eye -->
        <circle id="roby-eye-right-base" cx="146" cy="130" r="14" fill="#00f2fe" filter="url(#eye-glow)" />
        <circle id="roby-pupil-right" cx="146" cy="130" r="8" fill="#0f172a" />
        <circle cx="143" cy="126" r="3" fill="#ffffff" />

        <!-- Star Eye for Streak (Initially Hidden) -->
        <polygon id="roby-star-eye-right" points="146,116 149,125 158,126 151,132 153,141 146,136 139,141 141,132 134,126 143,125"
                 fill="#ffd32a" filter="url(#star-glow)" style="display: none;" />
      </g>

      <!-- Cute Blushing Cheeks -->
      <ellipse id="roby-blush-left" cx="76" cy="152" rx="7" ry="4" fill="#ff7675" opacity="0.65" />
      <ellipse id="roby-blush-right" cx="164" cy="152" rx="7" ry="4" fill="#ff7675" opacity="0.65" />
    </g>

    <!-- 5. Parametric Real-Time Lip-Sync Mouth -->
    <g id="roby-mouth-container">
      <!-- Reactive Mouth Path: morphs smoothly based on mouthOpenness -->
      <path id="roby-mouth" class="roby-mouth-path"
            d="M 104,158 Q 120,166 136,158"
            fill="none" stroke="#22d3ee" stroke-width="4.5" stroke-linecap="round" />
      <!-- Inner warm mouth background for when opened -->
      <ellipse id="roby-mouth-fill" cx="120" cy="162" rx="0" ry="0" fill="#e11d48" opacity="0" />
    </g>

  </g>
</svg>
`;
}

export class MascotController {
  /**
   * @param {Object} [options]
   * @param {Object} [options.voiceEngine=null] VoiceEngine instance supplying Web Audio AnalyserNode
   * @param {Object} [options.eventBus=null] EventBus instance
   * @param {string|Element} [options.container='#mascot-avatar-wrapper'] Container to mount or wrap avatar
   */
  constructor(options = {}) {
    this.voiceEngine = options.voiceEngine || null;
    this.eventBus = options.eventBus || null;
    this.container = options.container || '#mascot-avatar-wrapper';

    // Lip-Sync Acoustic State
    this.mouthOpenness = 0.0;     // Normalized [0.0 - 1.0]
    this._smoothRMS = 0.0;
    this._alpha = 0.35;            // Exponential smoothing alpha
    this._silenceThreshold = 0.015; // Silence floor threshold
    this._dataArray = null;

    // Simulation & Micro-animations
    this.emotion = MASCOT_EMOTIONS.IDLE;
    this._isSpeaking = false;
    this._time = 0;
    this._headTilt = 0;
    this._targetTilt = 0;
    this._breathingOffset = 0;
    this._pupilOffset = { x: 0, y: 0 };
    this._isBlinking = false;
    this._nextBlinkTime = 3.5; // Next blink in seconds

    // Cached SVG Elements
    this.dom = {};

    // 3D Pixar Sprites & Hologram Canvas Renderer
    this.sprites = {
      idle: null,
      speaking: null,
      streak: null,
      error: null
    };
    this._spritesLoaded = false;
    this.canvas = null;
    this.ctx = null;
    this.particles = [];

    this._rafId = null;
    this._lastTimestamp = 0;
    this._eventDisposers = [];

    this.init();
  }

  /**
   * Initialize avatar DOM, load 3D sprites, and start 60 FPS animation loop
   */
  init() {
    if (typeof document === 'undefined') return;

    this._mountAvatar();
    this._cacheElements();
    this._initPixarCanvas();

    if (this.eventBus) {
      this._bindEventBus();
    }

    this.start();
  }

  /**
   * Mounts the vector SVG avatar into the mascot avatar wrapper
   * @private
   */
  _mountAvatar() {
    const containerEl = typeof this.container === 'string'
      ? document.querySelector(this.container)
      : this.container;

    if (!containerEl) return;

    // Replace static <img> if present or inject SVG
    const existingImg = containerEl.querySelector('#mascot-avatar');
    if (existingImg && existingImg.tagName.toLowerCase() === 'img') {
      const wrapper = document.createElement('div');
      wrapper.id = 'mascot-avatar';
      wrapper.className = 'mascot-avatar mascot-vector-avatar';
      wrapper.innerHTML = getRobyAvatarSVG();
      existingImg.replaceWith(wrapper);
    } else if (!containerEl.querySelector('#mascot-avatar-svg')) {
      const div = document.createElement('div');
      div.id = 'mascot-avatar';
      div.className = 'mascot-avatar mascot-vector-avatar';
      div.innerHTML = getRobyAvatarSVG();
      containerEl.prepend(div);
    }
  }

  /**
   * Cache references to parametric SVG nodes
   * @private
   */
  _cacheElements() {
    this.dom = {
      rootGroup: document.getElementById('roby-root'),
      wings: document.getElementById('roby-wings'),
      mouth: document.getElementById('roby-mouth'),
      mouthFill: document.getElementById('roby-mouth-fill'),
      eyeLeft: document.getElementById('roby-eye-left'),
      eyeRight: document.getElementById('roby-eye-right'),
      pupilLeft: document.getElementById('roby-pupil-left'),
      pupilRight: document.getElementById('roby-pupil-right'),
      eyeLeftBase: document.getElementById('roby-eye-left-base'),
      eyeRightBase: document.getElementById('roby-eye-right-base'),
      starEyeLeft: document.getElementById('roby-star-eye-left'),
      starEyeRight: document.getElementById('roby-star-eye-right'),
      wingLeft: document.getElementById('roby-wing-left'),
      wingRight: document.getElementById('roby-wing-right')
    };
  }

  /**
   * Subscribes to EventBus events
   * @private
   */
  _bindEventBus() {
    if (!this.eventBus || typeof this.eventBus.on !== 'function') return;

    // KEY_TARGET_CHANGED: Update pupil look-at and head tilt
    const unsubTarget = this.eventBus.on('KEY_TARGET_CHANGED', (payload) => {
      if (payload && payload.screenPosition) {
        this.lookAt(payload.screenPosition);
      }
    });

    // KEY_PRESSED_SUCCESS: Check combo streak for star eyes and victory celebration
    const unsubSuccess = this.eventBus.on('KEY_PRESSED_SUCCESS', (payload) => {
      const combo = (payload && payload.comboCount) || 0;
      if (combo >= 20) {
        this.setEmotion(MASCOT_EMOTIONS.STREAK, 3800);
      } else if (combo >= 10) {
        this.setEmotion(MASCOT_EMOTIONS.STREAK, 3200);
      } else if (combo >= 5) {
        this.setEmotion(MASCOT_EMOTIONS.STREAK, 2000);
      }
    });

    // KEY_PRESSED_FAIL: Empathetic encouragement
    const unsubFail = this.eventBus.on('KEY_PRESSED_FAIL', () => {
      this.setEmotion(MASCOT_EMOTIONS.ERROR, 1800);
    });

    // MASCOT_SPEAK_REQUEST: Start speaking state
    const unsubSpeak = this.eventBus.on('MASCOT_SPEAK_REQUEST', () => {
      this.setEmotion(MASCOT_EMOTIONS.SPEAKING);
    });

    this._eventDisposers.push(unsubTarget, unsubSuccess, unsubFail, unsubSpeak);
  }

  /**
   * Sets active emotional state with optional auto-reset duration in ms
   * @param {string} emotion 'idle' | 'speaking' | 'streak' | 'error'
   * @param {number} [durationMs=0]
   */
  setEmotion(emotion, durationMs = 0) {
    this.emotion = emotion;
    this._applyEmotionVisuals(emotion);

    if (durationMs > 0) {
      if (this._emotionTimer) clearTimeout(this._emotionTimer);
      this._emotionTimer = setTimeout(() => {
        this.setEmotion(MASCOT_EMOTIONS.IDLE);
      }, durationMs);
    }
  }

  /**
   * Updates eye styles and base mouth cues per emotion
   * @private
   */
  _applyEmotionVisuals(emotion) {
    const { eyeLeftBase, eyeRightBase, starEyeLeft, starEyeRight, mouth } = this.dom;
    if (!eyeLeftBase || !starEyeLeft) return;

    if (emotion === MASCOT_EMOTIONS.STREAK) {
      // Star Eyes (★ ★)
      eyeLeftBase.style.display = 'none';
      eyeRightBase.style.display = 'none';
      starEyeLeft.style.display = 'block';
      starEyeRight.style.display = 'block';
      if (mouth) mouth.setAttribute('stroke', '#ffd32a');
    } else {
      // Normal LED Crescent/Circular Eyes
      eyeLeftBase.style.display = 'block';
      eyeRightBase.style.display = 'block';
      starEyeLeft.style.display = 'none';
      starEyeRight.style.display = 'none';
      if (mouth) {
        mouth.setAttribute('stroke', emotion === MASCOT_EMOTIONS.ERROR ? '#ff7675' : '#22d3ee');
      }
    }
  }

  /**
   * Updates look-at direction toward target key screen coordinates
   * @param {{ x: number, y?: number }} screenPos
   */
  lookAt(screenPos) {
    if (!screenPos || typeof screenPos.x !== 'number') return;
    const windowWidth = (typeof window !== 'undefined' ? window.innerWidth : 1000) || 1000;
    const center = windowWidth / 2;
    const offsetRatio = Math.max(-1, Math.min(1, (screenPos.x - center) / (windowWidth * 0.4)));

    // Subtle look-at tilt (-4deg to +4deg)
    this._targetTilt = offsetRatio * 4.0;

    // Pupil shift (+-4px)
    this._pupilOffset = {
      x: offsetRatio * 4.5,
      y: 1.5
    };
  }

  /**
   * Connects or updates VoiceEngine instance
   * @param {Object} voiceEngine
   */
  connectVoiceEngine(voiceEngine) {
    this.voiceEngine = voiceEngine;
  }

  /**
   * Starts the 60 FPS animation loop
   */
  start() {
    if (this._rafId) return;
    this._lastTimestamp = (typeof performance !== 'undefined' ? performance.now() : Date.now());

    const loop = (timestamp) => {
      const dt = Math.min((timestamp - this._lastTimestamp) / 1000, 0.1);
      this._lastTimestamp = timestamp;

      this.update(dt);
      this._rafId = requestAnimationFrame(loop);
    };

    if (typeof requestAnimationFrame !== 'undefined') {
      this._rafId = requestAnimationFrame(loop);
    }
  }

  /**
   * Stops the animation loop
   */
  stop() {
    if (this._rafId && typeof cancelAnimationFrame !== 'undefined') {
      cancelAnimationFrame(this._rafId);
      this._rafId = null;
    }
  }

  /**
   * Core animation tick: extracts audio RMS, updates lip-sync, blink, and parametric mouth
   * @param {number} dt Delta time in seconds
   */
  update(dt = 0.016) {
    this._time += dt;

    // 1. Acoustic Lip-Sync Processing
    this._processAcousticLipSync(dt);

    // 2. Head Tilt Smoothing (Exponential Decay)
    this._headTilt += (this._targetTilt - this._headTilt) * Math.min(1, dt * 8.0);

    // 3. Resting Sinusoidal Breathing & Wing Flutter
    this._breathingOffset = Math.sin(this._time * 2.4) * 3.5;
    const wingAngle = Math.sin(this._time * 4.0) * 6.0;

    // 4. Organic Eye Blink Timer (every 3 to 6 seconds)
    if (this._time >= this._nextBlinkTime) {
      this._isBlinking = true;
      this._nextBlinkTime = this._time + 3.0 + Math.random() * 3.0; // random 3-6s
      setTimeout(() => { this._isBlinking = false; }, 140);
    }

    // 5. Render Parametric SVG Updates
    this._renderSvgUpdates(wingAngle);

    // 6. Render 3D Pixar Canvas Engine (when sprites are loaded)
    if (this._spritesLoaded && this.ctx) {
      this._renderPixarCanvas(dt);
    }
  }

  /**
   * Extracts RMS audio energy from Web Audio AnalyserNode or viseme cadence fallback
   * @private
   */
  _processAcousticLipSync(dt) {
    let currentRMS = 0;
    let hasAudioNode = false;

    if (this.voiceEngine) {
      const analyser = this.voiceEngine.getAnalyserNode();
      if (analyser) {
        hasAudioNode = true;
        if (!this._dataArray || this._dataArray.length !== analyser.fftSize) {
          this._dataArray = new Uint8Array(analyser.fftSize);
        }
        analyser.getByteTimeDomainData(this._dataArray);

        // Instantaneous RMS calculation
        let sumSquares = 0;
        const len = this._dataArray.length;
        for (let i = 0; i < len; i++) {
          const norm = (this._dataArray[i] - 128) / 128;
          sumSquares += norm * norm;
        }
        currentRMS = Math.sqrt(sumSquares / len);
      }
    }

    // Smooth RMS with Exponential Moving Average (EMA alpha=0.35, threshold=0.015)
    if (hasAudioNode && currentRMS >= this._silenceThreshold) {
      this._smoothRMS = this._alpha * currentRMS + (1 - this._alpha) * this._smoothRMS;
      // Normalization: voice RMS typically reaches 0.18 peak after dynamics compression
      const normalized = Math.max(0, Math.min(1, (this._smoothRMS - this._silenceThreshold) / 0.16));
      this.mouthOpenness = normalized;
      if (!this._emotionTimer) {
        this.emotion = MASCOT_EMOTIONS.SPEAKING;
      }
    } else if (this.voiceEngine && this.voiceEngine.isSpeaking()) {
      // SpeechSynthesis Cadence Fallback (when speaking without direct Web Audio PCM buffer)
      // Natural Spanish speech cadence: ~4.8 Hz sinusoidal opening
      const cadence = Math.abs(Math.sin(this._time * Math.PI * 4.8)) * 0.75 + 0.15;
      this.mouthOpenness = cadence;
      if (!this._emotionTimer) {
        this.emotion = MASCOT_EMOTIONS.SPEAKING;
      }
    } else {
      // Silence / Closed Mouth
      this._smoothRMS *= (1 - Math.min(1, dt * 10.0));
      this.mouthOpenness = Math.max(0, this.mouthOpenness - dt * 8.0);
      if (this.emotion === MASCOT_EMOTIONS.SPEAKING && this.mouthOpenness <= 0.05) {
        if (!this._emotionTimer) {
          this.emotion = MASCOT_EMOTIONS.IDLE;
        }
      }
    }
  }

  /**
   * Applies transforms and geometry morphing to the SVG avatar nodes
   * @private
   */
  _renderSvgUpdates(wingAngle) {
    const { rootGroup, mouth, mouthFill, eyeLeft, eyeRight, pupilLeft, pupilRight, wingLeft, wingRight } = this.dom;

    // 1. Root Group Translation & Head Tilt
    if (rootGroup) {
      rootGroup.setAttribute('transform', `translate(0, ${this._breathingOffset.toFixed(2)}) rotate(${this._headTilt.toFixed(2)} 120 130)`);
    }

    // 2. Wings Flutter
    if (wingLeft && wingRight) {
      wingLeft.setAttribute('transform', `rotate(${-wingAngle.toFixed(1)} 68 140)`);
      wingRight.setAttribute('transform', `rotate(${wingAngle.toFixed(1)} 172 140)`);
    }

    // 3. Eye Blinking & Pupil Look-at Tracking
    const blinkScale = this._isBlinking ? 0.08 : 1.0;
    if (eyeLeft) eyeLeft.setAttribute('transform', `scale(1, ${blinkScale})`);
    if (eyeRight) eyeRight.setAttribute('transform', `scale(1, ${blinkScale})`);

    if (pupilLeft && pupilRight) {
      const px = this._pupilOffset.x.toFixed(2);
      const py = this._pupilOffset.y.toFixed(2);
      pupilLeft.setAttribute('transform', `translate(${px}, ${py})`);
      pupilRight.setAttribute('transform', `translate(${px}, ${py})`);
    }

    // 4. Parametric Mouth Lip-Sync Morphing
    if (mouth) {
      const openness = this.mouthOpenness;
      if (this.emotion === MASCOT_EMOTIONS.ERROR) {
        // Empathetic small 'o' mouth
        mouth.setAttribute('d', 'M 112,156 Q 120,166 128,156 Q 120,148 112,156');
        mouth.setAttribute('fill', '#ffeaa7');
      } else if (openness > 0.04) {
        // Dynamic Lip-Sync Open Mouth
        // Upper curve drops slightly, lower jaw descends proportionally to openness
        const dropY = (162 + openness * 18).toFixed(1);
        const topY = (156 - openness * 4).toFixed(1);
        const d = `M 102,156 Q 120,${topY} 138,156 Q 120,${dropY} 102,156`;
        mouth.setAttribute('d', d);
        mouth.setAttribute('fill', '#e11d48');
        mouth.setAttribute('stroke-width', '2.5');

        if (mouthFill) {
          mouthFill.setAttribute('rx', (openness * 16).toFixed(1));
          mouthFill.setAttribute('ry', (openness * 10).toFixed(1));
          mouthFill.setAttribute('opacity', (openness * 0.9).toFixed(2));
        }
      } else {
        // Resting Gentle Smile
        mouth.setAttribute('d', 'M 104,158 Q 120,166 136,158');
        mouth.setAttribute('fill', 'none');
        mouth.setAttribute('stroke-width', '4.5');
        if (mouthFill) mouthFill.setAttribute('opacity', '0');
      }
    }
  }

  /**
   * Initializes the 3D Pixar sprite canvas and preloads assets.
   * @private
   */
  _initPixarCanvas() {
    if (typeof document === 'undefined') return;

    // Look for existing canvas or mount in portal frame / avatar wrapper
    let canvasEl = document.getElementById('mascot-canvas');
    const containerEl = typeof this.container === 'string'
      ? document.querySelector(this.container)
      : this.container;

    const portalFrame = document.getElementById('hologram-portal-frame') || containerEl;

    if (!canvasEl && portalFrame) {
      canvasEl = document.createElement('canvas');
      canvasEl.id = 'mascot-canvas';
      canvasEl.className = 'mascot-canvas';
      canvasEl.width = 280;
      canvasEl.height = 280;
      portalFrame.prepend(canvasEl);
    }

    if (canvasEl && canvasEl.getContext) {
      this.canvas = canvasEl;
      this.ctx = canvasEl.getContext('2d');
    }

    // Preload Pixar sprites
    if (typeof Image !== 'undefined') {
      const spritePaths = {
        idle: 'assets/mascot/mascot_idle.png',
        speaking: 'assets/mascot/mascot_speaking.png',
        streak: 'assets/mascot/mascot_streak.png',
        error: 'assets/mascot/mascot_error.png'
      };

      let loadedCount = 0;
      const totalCount = Object.keys(spritePaths).length;

      Object.entries(spritePaths).forEach(([key, src]) => {
        const img = new Image();
        img.onload = () => {
          this.sprites[key] = img;
          loadedCount++;
          if (loadedCount >= 2 && this.sprites.idle) {
            this._spritesLoaded = true;
            if (portalFrame) {
              portalFrame.classList.add('has-canvas');
            }
          }
        };
        img.onerror = () => {
          // Keep SVG fallback visible if image loading fails
        };
        img.src = src;
      });
    }
  }

  /**
   * Renders 60 FPS 3D Pixar avatar with lip-sync cross-fade, breathing, and look-at tracking.
   * @param {number} dt Delta time in seconds
   * @private
   */
  _renderPixarCanvas(dt) {
    const { ctx, canvas } = this;
    if (!ctx || !canvas) return;
    const w = canvas.width;
    const h = canvas.height;

    ctx.clearRect(0, 0, w, h);

    ctx.save();
    // Center coordinate origin
    ctx.translate(w / 2, h / 2);

    // Apply look-at head tilt (smoothened _headTilt in degrees)
    ctx.rotate((this._headTilt * Math.PI) / 180);

    // Apply resting sinusoidal breathing float
    ctx.translate(0, this._breathingOffset);

    // 1. Joyful Jumping Celebration Bounce when in STREAK
    if (this.emotion === MASCOT_EMOTIONS.STREAK) {
      const jumpY = -Math.abs(Math.sin(this._time * 8.5)) * 14;
      ctx.translate(0, jumpY);
    } else if (this.emotion === MASCOT_EMOTIONS.ERROR) {
      const errorBob = Math.sin(this._time * 4.0) * 3;
      ctx.translate(0, errorBob);
    }

    // 2. Elastic syllable squashing & stretching on spoken syllables (RMS amplitude)
    if (this.mouthOpenness > 0.04) {
      const scaleY = 1.0 + Math.min(0.08, this.mouthOpenness * 0.075);
      const scaleX = 1.0 - Math.min(0.03, this.mouthOpenness * 0.025);
      ctx.scale(scaleX, scaleY);
    }

    // Determine active sprites based on emotional state
    let baseImg = this.sprites.idle;
    let overlayImg = null;
    let overlayAlpha = 0;

    if (this.emotion === MASCOT_EMOTIONS.STREAK && this.sprites.streak) {
      baseImg = this.sprites.streak;
    } else if (this.emotion === MASCOT_EMOTIONS.ERROR && this.sprites.error) {
      baseImg = this.sprites.error;
    } else if (this.sprites.speaking && (this.emotion === MASCOT_EMOTIONS.SPEAKING || this.mouthOpenness > 0.05)) {
      baseImg = this.sprites.idle;
      overlayImg = this.sprites.speaking;
      overlayAlpha = Math.min(1.0, Math.max(0, this.mouthOpenness * 1.65));
    }

    // Draw base sprite
    if (baseImg) {
      ctx.drawImage(baseImg, -w / 2, -h / 2, w, h);
    }

    // Draw speaking overlay with real-time lip-sync cross-fade and syllable bounce
    if (overlayImg && overlayAlpha > 0.02) {
      ctx.save();
      ctx.globalAlpha = overlayAlpha;
      ctx.drawImage(overlayImg, -w / 2, -h / 2, w, h);
      ctx.restore();
    }

    // Draw streak sparkle particles if in streak emotion
    if (this.emotion === MASCOT_EMOTIONS.STREAK) {
      this._updateAndDrawParticles(ctx, dt, w, h);
    }

    ctx.restore();
  }

  /**
   * Updates and renders magical sparks around Roby during streak celebrations.
   * @private
   */
  _updateAndDrawParticles(ctx, dt, w, h) {
    // Spawn sparkling particles (up to 24)
    if (this.particles.length < 24 && Math.random() < 0.38) {
      const angle = Math.random() * Math.PI * 2;
      const dist = 60 + Math.random() * 55;
      this.particles.push({
        x: Math.cos(angle) * dist,
        y: Math.sin(angle) * dist,
        vx: (Math.random() - 0.5) * 35,
        vy: -20 - Math.random() * 40,
        size: 2.5 + Math.random() * 4.5,
        alpha: 1.0,
        color: Math.random() > 0.45 ? '#ffd32a' : '#22d3ee'
      });
    }

    // Render & animate particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.alpha -= dt * 1.35;
      if (p.alpha <= 0) {
        this.particles.splice(i, 1);
        continue;
      }
      ctx.save();
      ctx.globalAlpha = Math.max(0, p.alpha);
      ctx.fillStyle = p.color;
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  /**
   * Cleanup resources
   */
  dispose() {
    this.stop();
    this._eventDisposers.forEach(unsub => unsub());
    this._eventDisposers = [];
  }
}
