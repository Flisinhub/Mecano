/**
 * src/main.js - Modern ES Module Bootstrap & Integration Engine for Mecano
 * 
 * Central application orchestrator wiring together all 5 modular subsystems via EventBus:
 * - src/core/: EventBus, StorageManager, GameEngine
 * - src/vfx/: LiveScene, ParticleEngine, BezierProjectiles, SquashStretch
 * - src/mascot/: MascotAnimator, MascotFSM, LipSync, SpeechBubble, AccessorySocket
 * - src/keyboard/: ToyKeyboard, GhostHands, PedagogyEngine
 * - src/audio/: ProceduralAudio, VoiceQueue, AccessibilityPanel
 * 
 * Fulfills Milestone M7, Requirement R1-R6, and Acceptance Criteria.
 */

// 1. Core Architecture & Persistence
import { EventBus } from './core/EventBus.js';
import { StorageManager } from './core/StorageManager.js';
import { GameEngine } from './core/GameEngine.js';

// 2. Technical Art, Living Scene & VFX Particles
import { LiveScene } from './vfx/LiveScene.js';
import { ParticleEngine } from './vfx/ParticleEngine.js';
import { BezierProjectiles } from './vfx/BezierProjectiles.js';
import { applySquashAndStretch } from './vfx/SquashStretch.js';

// 3. Interactive Mascot, Emotional AI & Customization
import { MascotAnimator } from './mascot/MascotAnimator.js';
import { MascotFSM } from './mascot/MascotFSM.js';
import { LipSync } from './mascot/LipSync.js';
import { MascotController, MASCOT_EMOTIONS } from './mascot/MascotController.js';
import { SpeechBubble, formatDialogueText } from './mascot/SpeechBubble.js';
import { AccessorySocket } from './mascot/AccessorySocket.js';
import { getNextPedagogicalTip, getRandomGreeting, getRandomTip } from './mascot/MascotPhrases.js';

// 4. Toy-Style Tactile Keyboard, Ghost Hands & Pedagogy
import { ToyKeyboard } from './keyboard/ToyKeyboard.js';
import { GhostHands } from './keyboard/GhostHands.js';
import { InteractiveHandsSVG } from './keyboard/InteractiveHandsSVG.js';
import { PedagogyEngine } from './keyboard/PedagogyEngine.js';
import { getPedagogicalKeyHint } from './keyboard/KeyboardLayout.js';

// 5. Procedural Audio, Intelligent Voice & Accessibility
import { ProceduralAudio } from './audio/ProceduralAudio.js';
import { VoiceEngine } from './audio/VoiceEngine.js';
import { VoiceQueue } from './audio/VoiceQueue.js';
import { AccessibilityPanel } from './audio/AccessibilityPanel.js';

// 6. Typing Diploma & Certification
import { TypingCertificate } from './certificate/TypingCertificate.js';

// 7. Interactive Super Mario World Style Adventure Map
import { AdventureMap } from './map/AdventureMap.js';

/**
 * Main Application Orchestrator Class
 */
export class MecanoApp {
  constructor() {
    // Subsystem instances
    this.eventBus = null;
    this.storage = null;
    this.audio = null;
    this.voiceEngine = null;
    this.voiceQueue = null;
    this.pedagogy = null;
    this.toyKeyboard = null;
    this.ghostHands = null;
    this.interactiveHands = null;
    this.liveScene = null;
    this.adventureMap = null;
    this.mascotAnimator = null;
    this.mascotController = null;
    this.mascotFSM = null;
    this.lipSync = null;
    this.speechBubble = null;
    this.accessorySocket = null;
    this.accessibilityPanel = null;
    this.gameEngine = null;

    // Runtime game state
    this.currentLevelId = 1;
    this.currentLevelData = null;
    this.levelWords = [];
    this.currentWordIndex = 0;
    this.wordsGoal = 8;
    this.isGameStarted = false;
    this.isPaused = false;
    this.unsubscribers = [];
    this._lastErrorCheerTime = 0;
    this._isStreakPlaying = false;

    // Cached DOM elements
    this.dom = {};
  }

  /**
   * Initializes and bootstraps the application in browser DOM.
   */
  init() {
    if (typeof document === 'undefined') return;

    this._cacheDom();
    this._initSubsystems();
    this._bindEventBus();
    this._bindDomListeners();
    this._initMascotAndAccessories();

    if (typeof window !== 'undefined') {
      window.__MECANO_APP__ = this;
    }

    // Restore saved text zoom scale for low-vision accessibility
    try {
      const savedZoom = localStorage.getItem('mecano_text_zoom');
      if (savedZoom === 'grande' || savedZoom === 'extra') {
        const mult = savedZoom === 'grande' ? '1.35' : '1.70';
        const label = savedZoom === 'grande' ? '🔍 Aa+' : '🔍 Aa++';
        const title = savedZoom === 'grande' ? 'Tamaño de texto: Grande (1.35x)' : 'Tamaño de texto: Gigante (1.70x)';
        document.body.dataset.textScale = savedZoom;
        document.documentElement.dataset.textScale = savedZoom;
        document.documentElement.style.setProperty('--text-scale', mult);
        if (this.dom.zoomBtn) {
          this.dom.zoomBtn.textContent = label;
          this.dom.zoomBtn.title = `${title} (Clic para cambiar)`;
        }
      }
    } catch (e) {}

    // Render initial map and belt UI
    this.renderLevelMap();
    this.updateBeltUI();

    // Check if start screen should be shown
    this.showStartScreen();
  }

  /**
   * Cache references to essential DOM elements.
   * @private
   */
  _cacheDom() {
    this.dom = {
      // Header & Stats
      levelNumber: document.getElementById('level'),
      levelTitle: document.getElementById('level-title-display'),
      wordsCount: document.getElementById('words-count'),
      wordsGoal: document.getElementById('words-goal'),
      ppm: document.getElementById('ppm'),
      errors: document.getElementById('errors'),
      accuracy: document.getElementById('accuracy'),
      comboCounter: document.getElementById('combo-counter'),
      comboNumber: document.getElementById('combo-number'),
      mapBtn: document.getElementById('map-btn'),
      worldMapBtn: document.getElementById('world-map-btn'),
      zoomBtn: document.getElementById('zoom-toggle-btn'),
      settingsBtn: document.getElementById('settings-btn'),
      voiceSelect: document.getElementById('voice-select'),
      voiceTestBtn: document.getElementById('voice-test-btn'),
      voiceMuteBtn: document.getElementById('voice-mute-btn'),
      toolsDrawerToggle: document.getElementById('tools-drawer-toggle'),
      toolsDrawer: document.getElementById('header-tools-drawer'),

      // Play Area & Target
      targetWord: document.getElementById('target-word'),
      wordPanel: document.getElementById('word-panel'),

      // Mascot & Stage
      mascotStage: document.getElementById('mascot-stage'),
      mascotWrapper: document.getElementById('mascot-avatar-wrapper'),
      mascotAvatar: document.getElementById('mascot-avatar'),
      mascotBadge: document.getElementById('mascot-badge'),
      mascotBeltTag: document.getElementById('mascot-belt-tag'),
      mascotBubble: document.getElementById('mascot-bubble'),
      mascotSpeechText: document.getElementById('mascot-speech-text'),
      mascotSpeakBtn: document.getElementById('mascot-speak-btn'),
      voiceWaveIndicator: document.getElementById('voice-wave-indicator'),
      mascotTipBar: document.getElementById('mascot-tip-bar'),
      tipIcon: document.getElementById('tip-icon'),
      mascotLessonTip: document.getElementById('mascot-lesson-tip'),
      tipNextBtn: document.getElementById('tip-next-btn'),

      // Keyboard & Hands
      keyboard: document.getElementById('keyboard'),
      handLeft: document.getElementById('hand-svg-left'),
      handRight: document.getElementById('hand-svg-right'),
      currentFingerHint: document.getElementById('current-finger-hint'),

      // Start Screen Modal & Map
      startScreen: document.getElementById('start-screen'),
      startRobyRank: document.getElementById('start-roby-rank'),
      levelsMapGrid: document.getElementById('levels-map-grid'),
      totalStarsCount: document.getElementById('total-stars-count'),
      startGameBtn: document.getElementById('start-game-btn'),
      resetProgressBtn: document.getElementById('reset-progress-btn'),
      startDifficultySelect: document.getElementById('start-difficulty-select'),
      startKeyboardSelect: document.getElementById('start-keyboard-select'),

      // Level Complete Modal
      levelComplete: document.getElementById('level-complete'),
      levelCompleteTitle: document.getElementById('level-complete-title'),
      levelCompleteCount: document.getElementById('level-complete-count'),
      levelCompleteStats: document.getElementById('level-complete-stats-summary'),
      levelCompleteSpeech: document.getElementById('level-complete-mascot-speech'),
      levelCompleteAvatar: document.getElementById('level-complete-avatar'),
      starsRating: document.getElementById('stars-rating'),
      nextLevelBtn: document.getElementById('next-level-btn'),
      retryLevelBtn: document.getElementById('retry-level-btn'),

      // Confetti canvas
      confettiCanvas: document.getElementById('confetti-canvas'),

      // Sublessons navigation
      sublessonsNav: document.getElementById('sublessons-nav'),
      sublessonsTitle: document.getElementById('sublessons-nav-title'),
      sublessonsStatus: document.getElementById('sublessons-nav-status'),
      sublessonsChips: document.getElementById('sublessons-chips-container'),

      // Diploma button & Modal
      diplomaBtn: document.getElementById('diploma-btn'),
      diplomaModal: document.getElementById('diploma-modal'),
      diplomaModalBackdrop: document.getElementById('diploma-modal-backdrop'),
      diplomaCloseBtn: document.getElementById('diploma-close-btn'),
      diplomaStudentName: document.getElementById('diploma-student-name'),
      diplomaSaveNameBtn: document.getElementById('diploma-save-name-btn'),
      diplomaCanvas: document.getElementById('diploma-canvas'),
      diplomaPrintBtn: document.getElementById('diploma-print-btn'),
      diplomaDownloadBtn: document.getElementById('diploma-download-btn'),

      // Exam Modal
      examModal: document.getElementById('exam-modal'),
      examBadgeIcon: document.getElementById('exam-badge-icon'),
      examModalTitle: document.getElementById('exam-modal-title'),
      examStarsRating: document.getElementById('exam-stars-rating'),
      examModalMessage: document.getElementById('exam-modal-message'),
      examModalStats: document.getElementById('exam-modal-stats'),
      examModalSpeech: document.getElementById('exam-modal-speech'),
      examRetryBtn: document.getElementById('exam-retry-btn'),
      examReviewLessonsBtn: document.getElementById('exam-review-lessons-btn'),
      examViewDiplomaBtn: document.getElementById('exam-view-diploma-btn'),
      examNextLevelBtn: document.getElementById('exam-next-level-btn'),

      // Video Intro Modal
      lessonVideoBtn: document.getElementById('lesson-video-btn'),
      videoIntroModal: document.getElementById('video-intro-modal'),
      videoIntroCard: document.querySelector('.video-intro-card'),
      videoIntroPlayer: document.getElementById('video-intro-player'),
      videoIntroTitle: document.getElementById('video-intro-title'),
      videoIntroCloseBtn: document.getElementById('video-intro-close-btn'),
      videoIntroSkipBtn: document.getElementById('video-intro-skip-btn'),
      videoPlaceholder: document.getElementById('video-intro-placeholder'),
      videoPlaceholderHeading: document.getElementById('video-placeholder-heading'),
      videoPlaceholderText: document.getElementById('video-placeholder-text')
    };
  }

  /**
   * Instantiate all 5 decoupled architecture subsystems.
   * @private
   */
  _initSubsystems() {
    // 1. Core Pub/Sub & Persistence
    this.eventBus = new EventBus();
    this.storage = new StorageManager();

    // 2. Procedural Web Audio Synthesizer, High-Fidelity Voice Engine & Intelligent Voice Queue
    this.voiceEngine = new VoiceEngine({ eventBus: this.eventBus });
    this.audio = new ProceduralAudio({ eventBus: this.eventBus });
    this.audio.bindEventBus(this.eventBus);

    this.voiceQueue = new VoiceQueue({
      eventBus: this.eventBus,
      voiceEngine: this.voiceEngine
    });
    this.voiceQueue.bindEventBus(this.eventBus);

    // 3. Pedagogy & Micro-Curriculum Engine
    this.pedagogy = new PedagogyEngine();

    // 4. Reactive Living Scene, Parallax & Particle VFX Stack
    this.liveScene = new LiveScene({
      container: '#live-scene-container',
      eventBus: this.eventBus,
      mascotElement: this.dom.mascotAvatar,
      autoStart: true
    });

    // 5. 3D Toy Tactile Keyboard, Interactive Vector Hands & Ghost Hands
    this.toyKeyboard = new ToyKeyboard({
      container: this.dom.keyboard || '#keyboard',
      eventBus: this.eventBus,
      onKeyPress: (key) => this.handleKeystrokeInput(key)
    });

    this.interactiveHands = new InteractiveHandsSVG({
      eventBus: this.eventBus,
      leftContainer: '#hand-card-left .hand-illustration',
      rightContainer: '#hand-card-right .hand-illustration',
      hintContainer: this.dom.currentFingerHint || '#current-finger-hint'
    });

    this.ghostHands = new GhostHands({
      eventBus: this.eventBus,
      leftHand: this.dom.handLeft || '#hand-svg-left',
      rightHand: this.dom.handRight || '#hand-svg-right',
      hintContainer: this.dom.currentFingerHint || '#current-finger-hint'
    });

    // 6. Mascot Parametric Controller, Emotional AI & Accessories
    this.mascotController = new MascotController({
      voiceEngine: this.voiceEngine,
      eventBus: this.eventBus,
      container: this.dom.mascotWrapper || '#mascot-avatar-wrapper'
    });

    this.mascotFSM = new MascotFSM({
      eventBus: this.eventBus,
      sleepTimeoutSec: 25,
      onStateChange: (newState, oldState) => this.handleMascotStateChange(newState, oldState)
    });

    this.mascotAnimator = new MascotAnimator({
      element: this.dom.mascotAvatar,
      eventBus: this.eventBus
    });
    this.mascotAnimator.start();

    const waveBars = this.dom.voiceWaveIndicator
      ? Array.from(this.dom.voiceWaveIndicator.querySelectorAll('span'))
      : [];
    this.lipSync = new LipSync({
      mouthElement: this.dom.mascotAvatar,
      waveBars,
      indicatorElement: this.dom.voiceWaveIndicator,
      eventBus: this.eventBus
    });

    this.speechBubble = new SpeechBubble({
      container: document.querySelector('.mascot-speech-container'),
      eventBus: this.eventBus
    });

    this.accessorySocket = new AccessorySocket({
      storageManager: this.storage,
      container: this.dom.mascotWrapper
    });

    // 7. Full Accessibility Panel (Independent 3-channel audio, font, contrast)
    this.accessibilityPanel = new AccessibilityPanel({
      storage: this.storage,
      proceduralAudio: this.audio,
      voiceQueue: this.voiceQueue,
      voiceEngine: this.voiceEngine,
      container: document.body
    });

    // 8. Core Typing Game Loop Engine
    this.gameEngine = new GameEngine({
      eventBus: this.eventBus,
      storage: this.storage,
      feverThreshold: 10,
      idleStuckThresholdMs: 2000,
      keyPositionResolver: (key) => this.toyKeyboard.getKeyScreenPosition(key)
    });

    // 9. Interactive Super Mario World Style Adventure Map
    this.adventureMap = new AdventureMap({
      pedagogy: this.pedagogy,
      storage: this.storage,
      audio: this.audio,
      onSelectLesson: (worldId, lessonId) => {
        this.startLesson(worldId, lessonId);
      },
      onSelectExam: (worldId) => {
        this.startExam(worldId);
      }
    });
  }

  /**
   * Wire EventBus subscriptions to handle reactive gameplay changes.
   * @private
   */
  _bindEventBus() {
    // 1. Target Key Changed
    this.unsubscribers.push(
      this.eventBus.on('KEY_TARGET_CHANGED', (payload) => {
        this.updateWordDisplay();
        this._updateTargetKeyTip(payload);
        this._updateMascotSpeechBubbleForTarget(payload);
        this._updateAmbientBacklight(payload && payload.key);
      })
    );

    // 2. Keystroke Hit Success
    this.unsubscribers.push(
      this.eventBus.on('KEY_PRESSED_SUCCESS', (payload) => {
        // 🛑 Si no hay una locución especial de racha sonando, detener consejos anteriores
        if (!this._isStreakPlaying) {
          if (this.voiceQueue) this.voiceQueue.cancel();
          if (this.voiceEngine) this.voiceEngine.stop();
          if (this.lipSync) this.lipSync.stopSpeaking();
          if (this.dom.voiceWaveIndicator) {
            this.dom.voiceWaveIndicator.classList.remove('is-speaking');
          }
        }

        // Desbloquear inmediatamente el tip fijado para avanzar al siguiente
        this._manualTipLockTime = 0;

        this.updateStats();
        this.updateWordDisplay();

        // Check streak milestones (10 and 20) for celebration audio and mascot streak sprite
        const combo = (payload && payload.comboCount) || 0;
        if (combo === 10 || combo === 20) {
          this._isStreakPlaying = true;
          if (this.mascotController) {
            this.mascotController.setEmotion(MASCOT_EMOTIONS.STREAK, combo === 20 ? 3800 : 3200);
          }
          const streakId = combo === 20 ? 'streak_20' : 'streak_10';
          const streakText = combo === 20
            ? '¡Sensacional! ¡Veinte aciertos seguidos! ¡Eres el rey del teclado!'
            : '¡Increíble racha de diez aciertos seguidos! ¡Tus dedos vuelan como un cohete!';

          if (this.voiceEngine) {
            this.voiceEngine.speak({
              audioId: streakId,
              text: streakText,
              priority: 'CRITICAL',
              onEnd: () => {
                this._isStreakPlaying = false;
              }
            }).catch(() => {
              this._isStreakPlaying = false;
            });
          } else {
            setTimeout(() => { this._isStreakPlaying = false; }, 3000);
          }
        }

        // Check if current word finished and advance word index
        this._checkWordAdvance();
      })
    );

    // 3. Keystroke Fail
    this.unsubscribers.push(
      this.eventBus.on('KEY_PRESSED_FAIL', (payload) => {
        this.updateStats();
        if (payload && payload.pressedKey) {
          this.toyKeyboard.flashKeyError(payload.pressedKey);
        }

        // Activate mascot error sprite
        if (this.mascotController) {
          this.mascotController.setEmotion(MASCOT_EMOTIONS.ERROR, 1800);
        }

        // Play empathetic encouragement audio cheer with gentle 6-second cooldown
        const now = Date.now();
        if (now - this._lastErrorCheerTime > 6000 && this.voiceEngine && !this.voiceEngine.isSpeaking() && !this._isStreakPlaying) {
          this._lastErrorCheerTime = now;
          const cheerId = Math.random() < 0.5 ? 'error_cheer_1' : 'error_cheer_2';
          const cheerText = cheerId === 'error_cheer_1'
            ? '¡No te preocupes! Equivocarse es el truco secreto para aprender. ¡Prueba otra vez!'
            : '¡Respira hondo y busca la tecla iluminada! ¡Tú tienes superpoderes!';

          this.voiceEngine.speak({
            audioId: cheerId,
            text: cheerText,
            priority: 'HIGH'
          }).catch(() => {});
        }
      })
    );

    // 4. Fever Mode Active / Inactive
    this.unsubscribers.push(
      this.eventBus.on('FEVER_MODE_CHANGED', (payload) => {
        const isActive = Boolean(payload && payload.isActive);
        if (this.dom.comboCounter) {
          if (isActive) {
            this.dom.comboCounter.classList.add('fever-glow');
            this.dom.comboCounter.classList.remove('hidden');
          } else {
            this.dom.comboCounter.classList.remove('fever-glow');
          }
        }
        if (document.body) {
          document.body.classList.toggle('fever-active', isActive);
        }
        const backlight = document.getElementById('cockpit-ambient-backlight');
        if (backlight) {
          backlight.classList.toggle('fever-active', isActive);
        }
      })
    );

    // 5. Inactivity User Stuck
    this.unsubscribers.push(
      this.eventBus.on('USER_STUCK', (payload) => {
        // Voice assistance and visual bounce triggered via GhostHands & MascotFSM
      })
    );

    // 6. Mascot Speak Request
    this.unsubscribers.push(
      this.eventBus.on('MASCOT_SPEAK_REQUEST', (payload) => {
        if (!payload || !payload.text) return;
        if (this.dom.mascotSpeechText) {
          this.dom.mascotSpeechText.innerHTML = formatDialogueText(payload.text);
        }
        if (this.dom.mascotBubble) {
          this.dom.mascotBubble.classList.remove('bubble-pop');
          void this.dom.mascotBubble.offsetWidth;
          this.dom.mascotBubble.classList.add('bubble-pop');
        }
      })
    );

    // 7. Level Completed
    this.unsubscribers.push(
      this.eventBus.on('LEVEL_COMPLETED', (payload) => {
        this.handleLevelCompleted(payload);
      })
    );
  }

  /**
   * Bind DOM event listeners for buttons, windows, and keyboard inputs.
   * @private
   */
  _bindDomListeners() {
    // Window global key listener
    window.addEventListener('keydown', (e) => this.handleKeyDown(e));

    // Desbloqueo seguro de AudioContext en el primer gesto de usuario
    const unlockAudio = () => {
      if (this.voiceEngine) {
        this.voiceEngine.getAudioContext();
        this.voiceEngine.resume();
      }
      if (this.audio && typeof this.audio.unlock === 'function') {
        this.audio.unlock();
      }
    };
    window.addEventListener('pointerdown', unlockAudio, { once: true, passive: true });
    window.addEventListener('keydown', unlockAudio, { once: true, passive: true });

    // Header buttons
    if (this.dom.worldMapBtn) {
      this.dom.worldMapBtn.addEventListener('click', () => {
        this.audio.playButtonClick();
        if (this.adventureMap) {
          this.adventureMap.open({ worldId: this.currentLevelId });
        }
      });
    }

    if (this.dom.mapBtn) {
      this.dom.mapBtn.addEventListener('click', () => {
        this.audio.playButtonClick();
        if (this.adventureMap) {
          this.adventureMap.open({ worldId: this.currentLevelId });
        } else {
          this.showStartScreen();
        }
      });
    }

    if (this.dom.zoomBtn) {
      this.dom.zoomBtn.addEventListener('click', () => {
        this.audio.playButtonClick();
        this.toggleTextZoom();
      });
    }

    if (this.dom.settingsBtn) {
      this.dom.settingsBtn.addEventListener('click', () => {
        this.audio.playButtonClick();
        this.accessibilityPanel.toggle();
      });
    }

    // Controles de Voz Neuronal en Cabecera
    if (this.dom.voiceSelect) {
      this._populateVoiceSelector();
      this.dom.voiceSelect.addEventListener('change', (e) => {
        if (this.voiceEngine) {
          this.voiceEngine.setVoice(e.target.value);
        }
      });
    }

    if (this.dom.voiceTestBtn) {
      this.dom.voiceTestBtn.addEventListener('click', () => {
        if (this.voiceEngine) {
          this.voiceEngine.getAudioContext();
          this.voiceEngine.speak({
            audioId: 'welcome',
            text: '¡Hola! Soy Roby. ¡Tus dedos se mueven genial por el teclado!',
            priority: 'HIGH'
          });
        }
      });
    }

    if (this.dom.voiceMuteBtn) {
      this.dom.voiceMuteBtn.addEventListener('click', () => {
        if (this.voiceEngine) {
          const nowMuted = !this.voiceEngine._muted;
          this.voiceEngine.setMuted(nowMuted);
          this.voiceQueue.setMuted(nowMuted);
          this.dom.voiceMuteBtn.textContent = nowMuted ? '🔇' : '🔊';
          this.dom.voiceMuteBtn.title = nowMuted ? 'Activar voz' : 'Silenciar voz';
        }
      });
    }

    // Expandable Tools Drawer Toggle
    if (this.dom.toolsDrawerToggle && this.dom.toolsDrawer) {
      this.dom.toolsDrawerToggle.addEventListener('click', (e) => {
        e.stopPropagation();
        this.dom.toolsDrawer.classList.toggle('is-open');
        const isOpen = this.dom.toolsDrawer.classList.contains('is-open');
        this.dom.toolsDrawerToggle.setAttribute('aria-expanded', String(isOpen));
      });

      document.addEventListener('click', (e) => {
        if (!this.dom.toolsDrawer.contains(e.target)) {
          this.dom.toolsDrawer.classList.remove('is-open');
          this.dom.toolsDrawerToggle.setAttribute('aria-expanded', 'false');
        }
      });
    }

    // Mascot interactive click
    if (this.dom.mascotWrapper) {
      this.dom.mascotWrapper.addEventListener('click', () => {
        this.handleMascotClick();
      });
    }
    if (this.dom.mascotAvatar && this.dom.mascotAvatar !== this.dom.mascotWrapper) {
      this.dom.mascotAvatar.addEventListener('click', (e) => {
        e.stopPropagation();
        this.handleMascotClick();
      });
    }

    // Tip cycling button
    if (this.dom.tipNextBtn) {
      this.dom.tipNextBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.cycleTip(true);
      });
    }
    if (this.dom.mascotTipBar) {
      this.dom.mascotTipBar.addEventListener('click', () => {
        this.cycleTip(false);
      });
    }

    // Mascot speak audio replay button
    if (this.dom.mascotSpeakBtn) {
      this.dom.mascotSpeakBtn.addEventListener('click', () => {
        this.audio.playButtonClick();

        // Ensure voice is audible when child clicks mini speaker
        if (this.voiceQueue) {
          if (this.voiceQueue._volume <= 0) this.voiceQueue.setVolume(0.85);
          if (this.voiceQueue._muted) this.voiceQueue.setMuted(false);
        }
        if (this.voiceEngine) {
          if (this.voiceEngine._volume <= 0) this.voiceEngine.setVolume(0.85);
          if (this.voiceEngine._muted) this.voiceEngine.setMuted(false);
        }
        if (this.dom.voiceMuteBtn) {
          this.dom.voiceMuteBtn.textContent = '🔊';
          this.dom.voiceMuteBtn.title = 'Silenciar voz';
        }

        const text = this.dom.mascotSpeechText?.textContent;
        if (text) {
          if (this.lipSync) this.lipSync.speak(text);
          this.voiceQueue.speak({
            text,
            priority: 'CRITICAL',
            emotion: 'happy',
            onStart: () => {
              if (this.dom.voiceWaveIndicator) {
                this.dom.voiceWaveIndicator.classList.add('is-speaking');
              }
            },
            onEnd: () => {
              if (this.dom.voiceWaveIndicator) {
                this.dom.voiceWaveIndicator.classList.remove('is-speaking');
              }
            }
          });
        }
      });
    }

    // Start Screen buttons
    if (this.dom.startGameBtn) {
      this.dom.startGameBtn.addEventListener('click', () => {
        this.audio.playButtonClick();
        this.startLevel(this.currentLevelId);
      });
    }

    if (this.dom.resetProgressBtn) {
      this.dom.resetProgressBtn.addEventListener('click', () => {
        if (confirm('¿Quieres reiniciar todas tus estrellas y volver a empezar?')) {
          this.audio.playButtonClick();
          this.storage.resetAll();
          this.renderLevelMap();
          this.updateBeltUI();
          this._initMascotAndAccessories();
        }
      });
    }

    // Level Complete Modal buttons
    if (this.dom.nextLevelBtn) {
      this.dom.nextLevelBtn.addEventListener('click', () => {
        this.audio.playButtonClick();
        this.advanceToNextLessonOrExam();
      });
    }

    if (this.dom.retryLevelBtn) {
      this.dom.retryLevelBtn.addEventListener('click', () => {
        this.audio.playButtonClick();
        this.hideLevelCompleteModal();
        if (this.currentLessonId) {
          this.startLesson(this.currentLevelId, this.currentLessonId);
        } else {
          this.startLevel(this.currentLevelId);
        }
      });
    }

    // Video Intro Modal triggers
    if (this.dom.lessonVideoBtn) {
      this.dom.lessonVideoBtn.addEventListener('click', () => {
        this.audio.playButtonClick();
        this.showLessonVideoIntro(this.currentLevelId, this.currentLessonId, true);
      });
    }
    if (this.dom.videoIntroCloseBtn) {
      this.dom.videoIntroCloseBtn.addEventListener('click', () => {
        this.audio.playButtonClick();
        this.closeLessonVideoIntro();
      });
    }
    if (this.dom.videoIntroSkipBtn) {
      this.dom.videoIntroSkipBtn.addEventListener('click', () => {
        this.audio.playButtonClick();
        this.closeLessonVideoIntro();
      });
    }

    // Diploma Modal triggers
    if (this.dom.diplomaBtn) {
      this.dom.diplomaBtn.addEventListener('click', () => {
        this.audio.playButtonClick();
        this.showDiplomaModal();
      });
    }

    if (this.dom.diplomaCloseBtn) {
      this.dom.diplomaCloseBtn.addEventListener('click', () => {
        this.audio.playButtonClick();
        this.hideDiplomaModal();
      });
    }

    if (this.dom.diplomaModalBackdrop) {
      this.dom.diplomaModalBackdrop.addEventListener('click', () => {
        this.hideDiplomaModal();
      });
    }

    if (this.dom.diplomaStudentName) {
      this.dom.diplomaStudentName.addEventListener('input', () => {
        const val = this.dom.diplomaStudentName.value;
        if (this.storage) this.storage.setStudentName(val);
        this._refreshDiplomaCanvas();
      });
    }

    if (this.dom.diplomaSaveNameBtn) {
      this.dom.diplomaSaveNameBtn.addEventListener('click', () => {
        this.audio.playButtonClick();
        const val = this.dom.diplomaStudentName?.value;
        if (val && this.storage) {
          this.storage.setStudentName(val);
          this._refreshDiplomaCanvas();
        }
      });
    }

    if (this.dom.diplomaPrintBtn) {
      this.dom.diplomaPrintBtn.addEventListener('click', () => {
        this.audio.playButtonClick();
        TypingCertificate.printCertificate(this.dom.diplomaCanvas);
      });
    }

    if (this.dom.diplomaDownloadBtn) {
      this.dom.diplomaDownloadBtn.addEventListener('click', () => {
        this.audio.playButtonClick();
        const studentName = this.storage ? this.storage.getStudentName() : 'Campeon';
        const cleanName = studentName.replace(/\s+/g, '_');
        TypingCertificate.downloadPNG(this.dom.diplomaCanvas, `Diploma_Mecanografia_${cleanName}.png`);
      });
    }

    // Exam Modal actions
    if (this.dom.examRetryBtn) {
      this.dom.examRetryBtn.addEventListener('click', () => {
        this.audio.playButtonClick();
        this.hideExamModal();
        this.startExam(this.currentLevelId);
      });
    }

    if (this.dom.examReviewLessonsBtn) {
      this.dom.examReviewLessonsBtn.addEventListener('click', () => {
        this.audio.playButtonClick();
        this.hideExamModal();
        this.startLesson(this.currentLevelId, 0);
      });
    }

    if (this.dom.examViewDiplomaBtn) {
      this.dom.examViewDiplomaBtn.addEventListener('click', () => {
        this.audio.playButtonClick();
        this.hideExamModal();
        this.showDiplomaModal();
      });
    }

    if (this.dom.examNextLevelBtn) {
      this.dom.examNextLevelBtn.addEventListener('click', () => {
        this.audio.playButtonClick();
        this.hideExamModal();
        const nextId = Math.min(8, Number(this.currentLevelId) + 1);
        this.startLevel(nextId);
      });
    }
  }

  /**
   * Initialize Roby mascot accessories and belt rank.
   * @private
   */
  _initMascotAndAccessories() {
    if (!this.accessorySocket) return;

    const totalStars = this.storage.getTotalStars();
    const catalog = this.accessorySocket.getAllAccessories();

    // Auto-unlock any accessories earned by star count
    for (const acc of catalog) {
      if (totalStars >= acc.starsRequired && !this.accessorySocket.isUnlocked(acc.id)) {
        this.accessorySocket.unlock(acc.id, totalStars);
      }
    }

    // Auto-equip unlocked items if slots are empty
    const equipped = this.accessorySocket.getAllEquipped();
    if (!equipped.head && this.accessorySocket.isUnlocked('hat-cap')) {
      this.accessorySocket.equip('head', 'hat-cap');
    }
    if (!equipped.eyes && this.accessorySocket.isUnlocked('glasses-nerd')) {
      this.accessorySocket.equip('eyes', 'glasses-nerd');
    }

    this.accessorySocket.updateEquippedVisuals();
  }

  /**
   * Handle physical keydown events.
   * @param {KeyboardEvent} e
   */
  handleKeyDown(e) {
    // Ignore meta/control shortcuts
    if (e.ctrlKey || e.altKey || e.metaKey || e.key === 'F11' || e.key === 'F12' || e.key === 'Tab') {
      return;
    }

    // Escape toggles map screen
    if (e.key === 'Escape') {
      if (this.dom.startScreen && !this.dom.startScreen.classList.contains('hidden')) {
        this.hideStartScreen();
      } else {
        this.showStartScreen();
      }
      return;
    }

    // Video Intro Modal shortcuts
    if (this.dom.videoIntroModal && !this.dom.videoIntroModal.classList.contains('hidden')) {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'Escape') {
        e.preventDefault();
        this.closeLessonVideoIntro();
        return;
      }
    }

    // High-Five Interaction with Spacebar
    if (this.mascotFSM && this.mascotFSM.getState() === MascotFSM.STATES.HIGH_FIVE_WAIT) {
      if (e.key === ' ' || e.key === 'Spacebar' || e.key === 'Enter') {
        e.preventDefault();
        this.triggerHighFiveCelebration();
        return;
      }
    }

    // If start screen is open, Enter starts game
    if (this.dom.startScreen && !this.dom.startScreen.classList.contains('hidden')) {
      if (e.key === 'Enter') {
        e.preventDefault();
        this.startLevel(this.currentLevelId);
      }
      return;
    }

    // If level complete modal is open, Space or Enter advances to next lesson/exam
    if (this.dom.levelComplete && !this.dom.levelComplete.classList.contains('hidden')) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        this.audio.playButtonClick();
        this.advanceToNextLessonOrExam();
      }
      return;
    }

    // If exam modal is open, Space or Enter advances to next level or retries
    if (this.dom.examModal && !this.dom.examModal.classList.contains('hidden')) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        if (this.dom.examNextLevelBtn && !this.dom.examNextLevelBtn.classList.contains('hidden')) {
          this.dom.examNextLevelBtn.click();
        } else if (this.dom.examRetryBtn) {
          this.dom.examRetryBtn.click();
        }
      }
      return;
    }

    // Prevent spacebar scrolling in active game
    if (e.key === ' ') {
      e.preventDefault();
    }

    this.handleKeystrokeInput(e.key);
  }

  /**
   * Central keystroke input pipeline (shared by physical keyboard and virtual buttons).
   * @param {string} rawKey
   */
  handleKeystrokeInput(rawKey) {
    if (!this.isGameStarted || this.isPaused) return;

    // Wake mascot from SLEEPY state
    if (this.mascotFSM) {
      this.mascotFSM.handleKeystroke(rawKey);
    }

    // Resolve screen coordinates of struck key
    const screenPos = this.toyKeyboard.getKeyScreenPosition(rawKey);

    // Pass to core GameEngine
    const result = this.gameEngine.handleKeyPress(rawKey, screenPos);

    if (result.success) {
      this.toyKeyboard.flashKeyHit(rawKey);
    }
  }

  /**
   * Triggers the high-five celebration and confettis.
   */
  triggerHighFiveCelebration() {
    if (!this.mascotFSM) return;

    this.mascotFSM.handleKeystroke(' '); // Transition to CELEBRATING
    this.audio.playCelebration();
    applySquashAndStretch(this.dom.mascotAvatar, { preset: 'happyBounce' });

    // Spawn rich celebratory confetti burst
    if (this.liveScene && this.liveScene.ambientParticleEngine) {
      const cx = typeof window !== 'undefined' ? window.innerWidth / 2 : 500;
      const cy = typeof window !== 'undefined' ? window.innerHeight * 0.45 : 300;
      this.liveScene.ambientParticleEngine.spawnConfetti(cx, cy, 75);
    }

    // Speak cheer
    this.voiceQueue.speak({
      text: '¡Choca esos cinco! ¡Eres un as del teclado!',
      priority: 'CRITICAL',
      emotion: 'victory'
    });

    // Show level complete modal after brief celebratory pause
    setTimeout(() => {
      this.showLevelCompleteModal();
    }, 700);
  }

  /**
   * Starts a curriculum level by ID (1 to 8), starting at the first uncompleted micro-lesson.
   * @param {number|string} levelId
   */
  startLevel(levelId) {
    const numericId = Math.max(1, Math.min(8, parseInt(levelId, 10) || 1));
    this.currentLevelId = numericId;
    this.currentLevelData = this.pedagogy.getLevel(numericId);

    const lessons = this.pedagogy.getLessonsForLevel(numericId);
    if (lessons && lessons.length > 0) {
      const completed = this.storage ? this.storage.getCompletedLessons(numericId) : [];
      const firstUncompleted = lessons.find(l => !completed.includes(l.id));
      if (firstUncompleted) {
        return this.startLesson(numericId, firstUncompleted.id);
      } else {
        return this.startLesson(numericId, lessons[0].id);
      }
    }

    // Fallback if level has no sub-lessons
    this.currentLessonId = null;
    this.isExamMode = false;
    this.levelWords = (this.currentLevelData && this.currentLevelData.words)
      ? [...this.currentLevelData.words]
      : [{ text: 'f j', icon: '🎯', label: 'Inicio' }];

    this.currentWordIndex = 0;
    this.wordsGoal = Math.min(this.levelWords.length, 8);
    const targetTexts = this.levelWords.slice(0, this.wordsGoal).map(w => w.text);

    if (this.interactiveHands) this.interactiveHands.setCurrentLevelId(this.currentLevelId);
    if (this.toyKeyboard) this.toyKeyboard.setCurrentLevelId(this.currentLevelId);

    this.gameEngine.startLevel(this.currentLevelId, targetTexts);

    if (this.dom.levelNumber) this.dom.levelNumber.textContent = String(this.currentLevelId);
    if (this.dom.levelTitle) this.dom.levelTitle.textContent = this.currentLevelData.name;
    if (this.dom.tipIcon) this.dom.tipIcon.textContent = '💡';
    if (this.dom.mascotLessonTip) this.dom.mascotLessonTip.textContent = this.currentLevelData.tip.replace(/^💡\s*/, '');
    this._manualTipLockTime = Date.now() + 6000;
    if (this.dom.wordsGoal) this.dom.wordsGoal.textContent = String(this.wordsGoal);
    if (this.dom.wordsCount) this.dom.wordsCount.textContent = '0';

    this.eventBus.emit('MASCOT_SPEAK_REQUEST', {
      text: this.currentLevelData.speech,
      priority: 'HIGH',
      emotion: 'happy'
    });

    this.renderSublessonsBar();
    this.hideStartScreen();
    this.hideLevelCompleteModal();
    this.hideExamModal();

    this.isGameStarted = true;
    this.isPaused = false;

    this.updateStats();
    this.updateWordDisplay();
    this.updateBeltUI();
  }

  /**
   * Starts a specific micro-lesson within a level.
   * @param {number|string} levelId
   * @param {string|number} lessonIdOrIndex
   */
  startLesson(levelId, lessonIdOrIndex) {
    const numericId = Math.max(1, Math.min(8, parseInt(levelId, 10) || 1));
    this.currentLevelId = numericId;
    this.currentLevelData = this.pedagogy.getLevel(numericId);
    this.isExamMode = false;

    const lesson = this.pedagogy.getLesson(numericId, lessonIdOrIndex) || {
      id: `${numericId}.1`,
      title: 'Lección Inicial',
      tip: this.currentLevelData.tip,
      speech: this.currentLevelData.speech,
      words: this.currentLevelData.words
    };

    this.currentLessonId = lesson.id;
    this.levelWords = (lesson.words && lesson.words.length > 0)
      ? [...lesson.words]
      : [{ text: 'f j', icon: '🎯', label: 'Inicio' }];

    this.currentWordIndex = 0;
    this.wordsGoal = this.levelWords.length;
    const targetTexts = this.levelWords.map(w => w.text);

    if (this.interactiveHands) this.interactiveHands.setCurrentLevelId(this.currentLevelId);
    if (this.toyKeyboard) this.toyKeyboard.setCurrentLevelId(this.currentLevelId);

    this.gameEngine.startLevel(this.currentLevelId, targetTexts, {
      lessonId: lesson.id,
      isExam: false
    });

    // Update Header and UI
    if (this.dom.levelNumber) this.dom.levelNumber.textContent = `${this.currentLevelId}.${lesson.id.split('.')[1] || '1'}`;
    if (this.dom.levelTitle) this.dom.levelTitle.textContent = `${this.currentLevelData.shortName} • ${lesson.title}`;
    if (this.dom.tipIcon) this.dom.tipIcon.textContent = '💡';
    if (this.dom.mascotLessonTip) this.dom.mascotLessonTip.textContent = (lesson.tip || this.currentLevelData.tip).replace(/^💡\s*/, '');
    this._manualTipLockTime = Date.now() + 6000;
    if (this.dom.wordsGoal) this.dom.wordsGoal.textContent = String(this.wordsGoal);
    if (this.dom.wordsCount) this.dom.wordsCount.textContent = '0';

    this.eventBus.emit('MASCOT_SPEAK_REQUEST', {
      text: lesson.speech || this.currentLevelData.speech,
      priority: 'HIGH',
      emotion: 'happy'
    });

    this.renderSublessonsBar();
    this.hideStartScreen();
    this.hideLevelCompleteModal();
    this.hideExamModal();

    this.isGameStarted = true;
    this.isPaused = false;

    this.updateStats();
    this.updateWordDisplay();
    this.updateBeltUI();

    // Check for introductory video (auto mode: plays if file exists in assets/videos/)
    this.showLessonVideoIntro(numericId, lesson.id, false);
  }

  /**
   * Starts the official level examination.
   * @param {number|string} levelId
   */
  startExam(levelId) {
    const numericId = Math.max(1, Math.min(8, parseInt(levelId, 10) || 1));
    this.currentLevelId = numericId;
    this.currentLevelData = this.pedagogy.getLevel(numericId);
    this.currentLessonId = null;
    this.isExamMode = true;

    const exam = this.pedagogy.getExamForLevel(numericId) || {
      id: `${numericId}.exam`,
      title: `Examen de Nivel ${numericId}`,
      words: [{ text: 'f j', icon: '🎯', label: 'Examen' }],
      minAccuracy: 85,
      minWPM: 6
    };

    this.levelWords = [...exam.words];
    this.currentWordIndex = 0;
    this.wordsGoal = this.levelWords.length;
    const targetTexts = this.levelWords.map(w => w.text);

    if (this.interactiveHands) this.interactiveHands.setCurrentLevelId(this.currentLevelId);
    if (this.toyKeyboard) this.toyKeyboard.setCurrentLevelId(this.currentLevelId);

    this.gameEngine.startLevel(this.currentLevelId, targetTexts, {
      isExam: true,
      examConfig: exam
    });

    // Update Header
    if (this.dom.levelNumber) this.dom.levelNumber.textContent = `${this.currentLevelId}.E`;
    if (this.dom.levelTitle) this.dom.levelTitle.textContent = `📋 ${exam.title}`;
    if (this.dom.tipIcon) this.dom.tipIcon.textContent = '📋';
    if (this.dom.mascotLessonTip) this.dom.mascotLessonTip.textContent = `Examen de Maestría: Mantén una precisión mayor o igual al ${exam.minAccuracy}%. ¡Tú puedes!`;
    this._manualTipLockTime = Date.now() + 7000;
    if (this.dom.wordsGoal) this.dom.wordsGoal.textContent = String(this.wordsGoal);
    if (this.dom.wordsCount) this.dom.wordsCount.textContent = '0';

    this.eventBus.emit('MASCOT_SPEAK_REQUEST', {
      text: exam.speech || '¡Comienza el examen! Respira y demuestra todo lo que has aprendido.',
      priority: 'HIGH',
      emotion: 'happy'
    });

    this.renderSublessonsBar();
    this.hideStartScreen();
    this.hideLevelCompleteModal();
    this.hideExamModal();

    this.isGameStarted = true;
    this.isPaused = false;

    this.updateStats();
    this.updateWordDisplay();
    this.updateBeltUI();
  }

  /**
   * Renders the interactive sub-lessons chip navigation bar.
   */
  renderSublessonsBar() {
    if (!this.dom.sublessonsChips || !this.pedagogy || !this.storage) return;

    const levelId = this.currentLevelId || 1;
    const level = this.pedagogy.getLevel(levelId);
    const lessons = this.pedagogy.getLessonsForLevel(levelId);
    const completed = this.storage.getCompletedLessons(levelId);
    const isExamPassed = this.storage.isExamPassed(levelId);

    if (this.dom.sublessonsTitle) {
      this.dom.sublessonsTitle.textContent = `📚 ${level.shortName || level.name}`;
    }
    if (this.dom.sublessonsStatus) {
      const examBadge = isExamPassed ? ' • 🏅 Aprobado' : '';
      this.dom.sublessonsStatus.textContent = `Completadas: ${completed.length}/${lessons.length}${examBadge}`;
    }

    this.dom.sublessonsChips.innerHTML = '';

    lessons.forEach((les) => {
      const chip = document.createElement('button');
      chip.type = 'button';
      const isDone = completed.includes(les.id);
      const isCurrent = (!this.isExamMode && this.currentLessonId === les.id);

      chip.className = `sublesson-chip ${isCurrent ? 'is-current' : ''} ${isDone ? 'is-completed' : ''}`;
      chip.dataset.lessonId = les.id;
      chip.title = `${les.id}: ${les.title}`;
      chip.innerHTML = `${les.id} ${isDone ? '✓' : ''}`;

      chip.addEventListener('click', () => {
        this.audio.playButtonClick();
        this.startLesson(levelId, les.id);
      });

      this.dom.sublessonsChips.appendChild(chip);
    });

    // Add Exam Chip
    const examChip = document.createElement('button');
    examChip.type = 'button';
    const isExamReady = completed.length >= lessons.length || completed.length >= 15;
    const isCurrentExam = this.isExamMode;

    examChip.className = `sublesson-chip exam-chip ${isCurrentExam ? 'is-current' : ''} ${isExamReady ? 'is-ready' : ''} ${isExamPassed ? 'is-passed' : ''}`;
    examChip.title = `Examen Oficial de Nivel ${levelId}`;
    examChip.innerHTML = isExamPassed ? `🏅 Examen ✓` : `📋 Examen`;

    examChip.addEventListener('click', () => {
      this.audio.playButtonClick();
      this.startExam(levelId);
    });

    this.dom.sublessonsChips.appendChild(examChip);
  }

  /**
   * Check if the child just finished typing the current word and advance.
   * @private
   */
  _checkWordAdvance() {
    if (!this.gameEngine || !this.levelWords) return;

    // Calculate which word we are currently on based on targetIndex
    let accumulatedChars = 0;
    let computedWordIdx = 0;

    for (let i = 0; i < this.wordsGoal; i++) {
      const wordLen = this.levelWords[i].text.length;
      if (this.gameEngine.targetIndex < accumulatedChars + wordLen) {
        computedWordIdx = i;
        break;
      }
      accumulatedChars += wordLen + 1; // +1 for the separating space
      computedWordIdx = i + 1;
    }

    this.currentWordIndex = Math.min(this.wordsGoal, computedWordIdx);
    if (this.dom.wordsCount) {
      this.dom.wordsCount.textContent = String(this.currentWordIndex);
    }
  }

  /**
   * Renders the active word and visual icon in #target-word and #word-visual-badge.
   */
  updateWordDisplay() {
    if (!this.gameEngine || !this.dom.targetWord) return;

    const fullText = this.gameEngine.levelText;
    const targetIdx = this.gameEngine.targetIndex;

    // Find active word metadata
    let accumulated = 0;
    let activeWordObj = this.levelWords[0] || { text: '', icon: '🎯', label: 'Escribe' };

    for (let i = 0; i < this.wordsGoal; i++) {
      const w = this.levelWords[i];
      if (!w) break;
      const wLen = w.text.length;
      if (targetIdx < accumulated + wLen + 1) {
        activeWordObj = w;
        break;
      }
      accumulated += wLen + 1;
    }

    // Update icon & label badge
    if (this.dom.wordVisualIcon && this.dom.wordVisualLabel) {
      this.dom.wordVisualIcon.textContent = activeWordObj.icon || '🎯';
      this.dom.wordVisualLabel.textContent = activeWordObj.label || '¡Tú puedes!';
      if (this.dom.wordVisualBadge) {
        this.dom.wordVisualBadge.classList.remove('hidden');
      }
    }

    // Dynamic sizing based on length
    const len = fullText.length;
    this.dom.targetWord.className = 'target-word unified-text';
    if (len <= 10) {
      this.dom.targetWord.classList.add('text--short');
    } else if (len <= 28) {
      this.dom.targetWord.classList.add('text--medium');
    } else if (len <= 65) {
      this.dom.targetWord.classList.add('text--long');
    } else if (len <= 130) {
      this.dom.targetWord.classList.add('text--paragraph');
    } else {
      this.dom.targetWord.classList.add('text--story');
    }

    // Format characters with safe HTML
    const correctPart = fullText.slice(0, targetIdx);
    const nextChar = fullText[targetIdx] || '';
    const remaining = fullText.slice(targetIdx + 1);

    const escapeHtml = (t) => t
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');

    // Use special visible glyph for Space
    const displayNext = nextChar === ' ' ? '␣' : escapeHtml(nextChar);

    this.dom.targetWord.innerHTML = `
      <span class="typed-correct char-done">${escapeHtml(correctPart)}</span><span id="current-target-char" class="typed-next char-current">${displayNext}</span><span class="char-pending">${escapeHtml(remaining)}</span>
    `;

    // Calm autoscroll only for long overflowing stories (no jumpy animated jitter)
    const targetCharEl = document.getElementById('current-target-char');
    if (targetCharEl && len > 40 && this.dom.targetWord && this.dom.targetWord.scrollHeight > this.dom.targetWord.clientHeight) {
      const charTop = targetCharEl.offsetTop;
      const containerHeight = this.dom.targetWord.clientHeight;
      if (charTop > containerHeight * 0.75) {
        this.dom.targetWord.scrollTop = Math.max(0, charTop - (containerHeight / 2));
      }
    }
  }

  /**
   * Updates all header stats (Accuracy, PPM, Errors, Combo).
   */
  updateStats() {
    if (!this.gameEngine) return;

    if (this.dom.accuracy) {
      this.dom.accuracy.textContent = String(this.gameEngine.getAccuracy());
    }
    if (this.dom.errors) {
      this.dom.errors.textContent = String(this.gameEngine.totalKeystrokes - this.gameEngine.correctHits);
    }
    if (this.dom.ppm) {
      this.dom.ppm.textContent = String(this.gameEngine.getPPM());
    }

    // Combo counter badge
    if (this.dom.comboCounter && this.dom.comboNumber) {
      this.dom.comboNumber.textContent = String(this.gameEngine.comboCount);
      if (this.gameEngine.comboCount >= 3) {
        this.dom.comboCounter.classList.remove('hidden');
      } else {
        this.dom.comboCounter.classList.add('hidden');
      }
    }
  }

  /**
   * Updates Roby's belt rank tag and start screen rank badge.
   */
  updateBeltUI() {
    if (!this.pedagogy || !this.storage) return;

    const highestUnlocked = this.getHighestUnlockedLevel();
    const totalStars = this.storage.getTotalStars();
    const beltId = this.pedagogy.calculateBelt(highestUnlocked, totalStars);

    const beltTier = PedagogyEngine.BELT_TIERS.find(t => t.belt === beltId) || PedagogyEngine.BELT_TIERS[0];

    if (this.dom.mascotBeltTag) {
      this.dom.mascotBeltTag.textContent = `${beltTier.emoji} ${beltTier.title}`;
      this.dom.mascotBeltTag.className = `mascot-belt-tag belt-${beltId}`;
    }

    if (this.dom.startRobyRank) {
      this.dom.startRobyRank.textContent = `${beltTier.emoji} ${beltTier.title}`;
    }
  }

  /**
   * Renders the 8 levels map grid with stars, locks, and click listeners.
   */
  renderLevelMap() {
    if (!this.dom.levelsMapGrid || !this.pedagogy || !this.storage) return;

    const totalStars = this.storage.getTotalStars();
    if (this.dom.totalStarsCount) {
      this.dom.totalStarsCount.textContent = String(totalStars);
    }

    this.dom.levelsMapGrid.innerHTML = '';
    const highestUnlocked = this.getHighestUnlockedLevel();

    PedagogyEngine.RICH_LEVELS.forEach((lvl) => {
      const card = document.createElement('div');
      const isUnlocked = lvl.id <= highestUnlocked;
      const starsEarned = this.storage.getLevelStars(lvl.id);
      const completed = this.storage.getCompletedLessons(lvl.id);
      const totalLessons = (lvl.lessons && lvl.lessons.length) ? lvl.lessons.length : 15;
      const examPassed = this.storage.isExamPassed(lvl.id);

      card.className = `level-map-card ${isUnlocked ? 'unlocked' : 'locked'} ${lvl.id === this.currentLevelId ? 'current-active' : ''}`;
      card.setAttribute('role', 'button');
      card.setAttribute('tabindex', isUnlocked ? '0' : '-1');

      // Star string
      let starIcons = '';
      for (let s = 1; s <= 3; s++) {
        starIcons += s <= starsEarned ? '⭐' : '☆';
      }

      const examStatusText = examPassed
        ? '<div class="card-exam-badge passed">🏅 Examen Aprobado</div>'
        : (completed.length >= totalLessons
          ? '<div class="card-exam-badge ready">📋 ¡Examen Disponible!</div>'
          : `<div class="card-exam-badge locked">🔒 Examen (${completed.length}/${totalLessons})</div>`);

      card.innerHTML = `
        <div class="card-level-num">Nivel ${lvl.id}</div>
        <div class="card-level-icon">${lvl.words && lvl.words[0] ? lvl.words[0].icon : '🎯'}</div>
        <div class="card-level-name">${lvl.shortName || lvl.name}</div>
        <div class="card-lessons-count">📝 ${completed.length}/${totalLessons} Lecciones</div>
        <div class="card-stars-row">${starIcons}</div>
        ${examStatusText}
        ${!isUnlocked ? '<div class="card-lock-badge">🔒 Bloqueado</div>' : ''}
      `;

      if (isUnlocked) {
        card.addEventListener('click', () => {
          this.audio.playButtonClick();
          this.startLevel(lvl.id);
        });
      }

      this.dom.levelsMapGrid.appendChild(card);
    });
  }

  /**
   * Determines the highest unlocked level based on passed examinations.
   * Level N+1 is unlocked only when Exam N is passed (or progress unlocked).
   * @returns {number} 1 to 8
   */
  getHighestUnlockedLevel() {
    if (!this.storage) return 1;
    let unlocked = 1;
    for (let i = 1; i <= 7; i++) {
      if (this.storage.isExamPassed(i)) {
        unlocked = i + 1;
      } else {
        break;
      }
    }
    const stored = this.storage.getUnlockedLevel() || 1;
    return Math.min(8, Math.max(unlocked, stored));
  }

  /**
   * Handle level completed event payload.
   * Dispatches between sub-lesson completion and official exam evaluation.
   * @param {Object} payload { levelId, lessonId, isExam, stars, accuracy, wpm, examResult }
   */
  handleLevelCompleted(payload) {
    this.isGameStarted = false;
    this.audio.playCelebration();

    // Re-check accessory unlocks and belt rank
    this._initMascotAndAccessories();
    this.updateBeltUI();
    this.renderLevelMap();
    this.renderSublessonsBar();

    if (payload && payload.isExam) {
      this.showExamResultModal(payload);
      return;
    }

    // Regular sub-lesson completed
    const stars = payload && typeof payload.stars === 'number' ? payload.stars : 1;
    if (this.currentLessonId && this.storage) {
      this.storage.saveLessonCompleted(this.currentLevelId, this.currentLessonId);
      this.storage.saveLessonStars(this.currentLevelId, this.currentLessonId, stars);
      if (this.adventureMap) {
        this.adventureMap.render();
      }
    }
    this.renderSublessonsBar();

    if (this.dom.levelCompleteTitle) {
      this.dom.levelCompleteTitle.textContent = `¡Lección Completada! 🌟`;
    }
    if (this.dom.levelCompleteCount) {
      this.dom.levelCompleteCount.textContent = String(this.wordsGoal);
    }

    if (this.dom.levelCompleteStats) {
      const accuracy = payload && typeof payload.accuracy === 'number' ? payload.accuracy : this.gameEngine.getAccuracy();
      const wpm = payload && typeof payload.wpm === 'number' ? payload.wpm : this.gameEngine.getWPM();
      this.dom.levelCompleteStats.innerHTML = `
        <div class="stat-pill"><strong>Acierto:</strong> ${accuracy}%</div>
        <div class="stat-pill"><strong>Velocidad:</strong> ${wpm} WPM</div>
        <div class="stat-pill"><strong>Racha:</strong> ${this.gameEngine.maxCombo}</div>
      `;
    }

    if (this.dom.starsRating) {
      const starSpans = this.dom.starsRating.querySelectorAll('.star');
      starSpans.forEach((sp, idx) => {
        sp.textContent = idx < stars ? '⭐' : '☆';
        sp.className = `star ${idx < stars ? 'filled pulse' : 'empty'}`;
      });
    }

    const lessons = this.pedagogy.getLessonsForLevel(this.currentLevelId);
    const currIdx = lessons.findIndex(l => l.id === this.currentLessonId);
    const hasNextLesson = (currIdx >= 0 && currIdx + 1 < lessons.length);

    if (this.dom.nextLevelBtn) {
      if (hasNextLesson) {
        this.dom.nextLevelBtn.textContent = `¡Siguiente Lección (${lessons[currIdx + 1].id})! 🚀`;
      } else {
        this.dom.nextLevelBtn.textContent = `¡Presentarse al Examen de Nivel ${this.currentLevelId}! 📋`;
      }
      this.dom.nextLevelBtn.onclick = () => {
        this.audio.playButtonClick();
        this.advanceToNextLessonOrExam();
      };
    }

    if (this.dom.retryLevelBtn) {
      this.dom.retryLevelBtn.classList.remove('hidden');
      this.dom.retryLevelBtn.onclick = () => {
        this.audio.playButtonClick();
        this.hideLevelCompleteModal();
        this.startLesson(this.currentLevelId, this.currentLessonId);
      };
    }

    if (this.dom.levelCompleteSpeech) {
      this.dom.levelCompleteSpeech.textContent = `"¡Buen trabajo con esta lección! ¡Tus deditos van a toda velocidad!"`;
    }

    // Celebración visual con confeti
    if (this.liveScene && this.liveScene.ambientParticleEngine) {
      const cx = typeof window !== 'undefined' ? window.innerWidth / 2 : 500;
      const cy = typeof window !== 'undefined' ? window.innerHeight * 0.45 : 300;
      this.liveScene.ambientParticleEngine.spawnConfetti(cx, cy, 80);
    }

    // Roby celebra
    if (this.mascotFSM) {
      this.mascotFSM.transitionTo(MascotFSM.STATES.CELEBRATING);
    }
    applySquashAndStretch(this.dom.mascotAvatar, { preset: 'happyBounce' });

    // Mostrar siempre el modal de lección completada tras una breve pausa festiva
    setTimeout(() => {
      this.showLevelCompleteModal();
    }, 450);
  }

  /**
   * Advances smoothly to the next sequential micro-lesson or to the level mastery exam.
   */
  advanceToNextLessonOrExam() {
    this.hideLevelCompleteModal();
    const lessons = this.pedagogy.getLessonsForLevel(this.currentLevelId);
    const currIdx = lessons.findIndex(l => l.id === this.currentLessonId);
    if (currIdx >= 0 && currIdx + 1 < lessons.length) {
      this.startLesson(this.currentLevelId, lessons[currIdx + 1].id);
    } else {
      this.startExam(this.currentLevelId);
    }
  }

  /**
   * Displays the video intro modal for the current lesson.
   * Looks for assets/videos/intro_{levelId}_{subLessonNum}.mp4 or assets/videos/intro_level_{levelId}.mp4.
   * @param {number|string} levelId
   * @param {string} [lessonId]
   * @param {boolean} [isManual=false]
   */
  showLessonVideoIntro(levelId, lessonId, isManual = false) {
    if (!this.dom.videoIntroModal || !this.dom.videoIntroPlayer) return;

    const subNum = lessonId ? String(lessonId).replace(/^.*\./, '') : '1';
    const lessonVideoPath = `assets/videos/intro_${levelId}_${subNum}.mp4`;
    const levelVideoPath = `assets/videos/intro_level_${levelId}.mp4`;

    const lessonData = this.pedagogy.getLesson(levelId, lessonId);
    const titleText = lessonData
      ? `Lección ${lessonData.id}: ${lessonData.title}`
      : `Nivel ${levelId}`;

    if (this.dom.videoIntroTitle) {
      this.dom.videoIntroTitle.textContent = titleText;
    }

    const player = this.dom.videoIntroPlayer;
    const placeholder = this.dom.videoPlaceholder;

    // Reset player
    player.pause();
    player.removeAttribute('src');

    const tryLoadVideo = (src, onFail) => {
      let resolved = false;
      player.onloadedmetadata = () => {
        if (!resolved) {
          resolved = true;
          player.classList.remove('hidden');
          if (placeholder) placeholder.classList.add('hidden');
          this.dom.videoIntroModal.classList.remove('hidden');
          player.play().catch(() => {});
        }
      };
      player.onerror = () => {
        if (!resolved) {
          resolved = true;
          onFail();
        }
      };
      player.src = src;
    };

    // Try specific lesson video first, then level video, then placeholder
    tryLoadVideo(lessonVideoPath, () => {
      tryLoadVideo(levelVideoPath, () => {
        if (isManual) {
          player.classList.add('hidden');
          if (placeholder) {
            placeholder.classList.remove('hidden');
            if (this.dom.videoPlaceholderHeading) {
              this.dom.videoPlaceholderHeading.textContent = `Vídeo de la Lección ${lessonId || levelId}`;
            }
            if (this.dom.videoPlaceholderText) {
              this.dom.videoPlaceholderText.innerHTML = `Coloca tu clip de vídeo en <code>${lessonVideoPath}</code> para reproducirlo aquí.`;
            }
          }
          this.dom.videoIntroModal.classList.remove('hidden');
        } else {
          // Automatic mode: do not block if video does not exist yet
          this.closeLessonVideoIntro();
        }
      });
    });
  }

  /**
   * Closes the video intro modal and starts or resumes gameplay.
   */
  closeLessonVideoIntro() {
    if (this.dom.videoIntroPlayer) {
      this.dom.videoIntroPlayer.pause();
      this.dom.videoIntroPlayer.removeAttribute('src');
    }
    if (this.dom.videoIntroModal) {
      this.dom.videoIntroModal.classList.add('hidden');
    }
    this.isGameStarted = true;
    this.isPaused = false;
    this.updateWordDisplay();
  }

  /**
   * Display the official examination results modal with non-punitive feedback.
   * @param {Object} payload
   */
  showExamResultModal(payload) {
    if (!this.dom.examModal) return;

    const evaluation = this.pedagogy.evaluateExam(this.currentLevelId, payload);
    const passed = evaluation.passed;

    if (this.dom.examBadgeIcon) {
      this.dom.examBadgeIcon.textContent = passed ? '🏅' : '💡';
    }
    if (this.dom.examModalTitle) {
      this.dom.examModalTitle.textContent = passed ? `¡Examen de Nivel ${this.currentLevelId} Aprobado!` : `Examen de Nivel ${this.currentLevelId}`;
    }
    if (this.dom.examModalMessage) {
      this.dom.examModalMessage.textContent = passed
        ? `¡Enhorabuena! Has demostrado maestría en este nivel.`
        : `¡Buen esfuerzo! Recuerda que para la medalla se requiere al menos un ${evaluation.requiredAccuracy}% de acierto.`;
    }

    if (this.dom.examModalStats) {
      this.dom.examModalStats.innerHTML = `
        <div class="exam-stat-pill">
          <div class="exam-stat-pill-label">Precisión</div>
          <div class="exam-stat-pill-val">${evaluation.accuracy}%</div>
        </div>
        <div class="exam-stat-pill">
          <div class="exam-stat-pill-label">Velocidad</div>
          <div class="exam-stat-pill-val">${evaluation.wpm} WPM</div>
        </div>
        <div class="exam-stat-pill">
          <div class="exam-stat-pill-label">Requerido</div>
          <div class="exam-stat-pill-val">≥${evaluation.requiredAccuracy}%</div>
        </div>
      `;
    }

    if (this.dom.examStarsRating) {
      const starSpans = this.dom.examStarsRating.querySelectorAll('.star');
      starSpans.forEach((sp, idx) => {
        sp.textContent = idx < evaluation.stars ? '⭐' : '☆';
        sp.className = `star ${idx < evaluation.stars ? 'filled pulse' : 'empty'}`;
      });
    }

    if (this.dom.examModalSpeech) {
      this.dom.examModalSpeech.textContent = `"${evaluation.cheer}"`;
    }

    if (passed) {
      this.storage.saveExamPassed(this.currentLevelId, true);
      const nextLvl = Math.min(8, Number(this.currentLevelId) + 1);
      this.storage.setUnlockedLevel(nextLvl);
      this.updateBeltUI();
      this.renderLevelMap();
      if (this.adventureMap) {
        this.adventureMap.render();
      }

      // Check graduation certificate unlock (Level 5 or Level 8)
      if (this.currentLevelId === 5 || this.currentLevelId === 8 || evaluation.isGraduation) {
        const studentName = this.storage.getStudentName();
        this.storage.saveCertificate({
          id: `cert-level-${this.currentLevelId}`,
          levelId: this.currentLevelId,
          title: evaluation.diplomaTitle,
          accuracy: evaluation.accuracy,
          wpm: evaluation.wpm,
          stars: this.storage.getTotalStars(),
          studentName,
          date: new Date().toISOString()
        });

        if (this.dom.examViewDiplomaBtn) {
          this.dom.examViewDiplomaBtn.classList.remove('hidden');
        }
      } else if (this.dom.examViewDiplomaBtn) {
        this.dom.examViewDiplomaBtn.classList.add('hidden');
      }

      if (this.dom.examNextLevelBtn) {
        this.dom.examNextLevelBtn.classList.remove('hidden');
      }
    } else {
      if (this.dom.examNextLevelBtn) {
        this.dom.examNextLevelBtn.classList.add('hidden');
      }
      if (this.dom.examViewDiplomaBtn) {
        this.dom.examViewDiplomaBtn.classList.add('hidden');
      }
    }

    this.dom.examModal.classList.remove('hidden');
    this.voiceQueue.speak({
      text: evaluation.cheer,
      priority: 'CRITICAL',
      emotion: passed ? 'victory' : 'happy'
    });
  }

  /**
   * Hide the examination modal.
   */
  hideExamModal() {
    if (this.dom.examModal) {
      this.dom.examModal.classList.add('hidden');
    }
  }

  /**
   * Show the diploma modal and render high-resolution canvas.
   */
  showDiplomaModal() {
    if (!this.dom.diplomaModal) return;
    if (this.dom.diplomaStudentName) {
      this.dom.diplomaStudentName.value = this.storage ? this.storage.getStudentName() : 'Campeón/a del Teclado';
    }
    this._refreshDiplomaCanvas();
    this.dom.diplomaModal.classList.remove('hidden');
  }

  /**
   * Hide the diploma modal.
   */
  hideDiplomaModal() {
    if (this.dom.diplomaModal) {
      this.dom.diplomaModal.classList.add('hidden');
    }
  }

  /**
   * Re-draw the official diploma onto the modal canvas.
   * @private
   */
  _refreshDiplomaCanvas() {
    if (!this.dom.diplomaCanvas) return;
    const studentName = this.dom.diplomaStudentName?.value?.trim() || (this.storage ? this.storage.getStudentName() : 'Campeón/a del Teclado');
    const unlockedLevel = this.getHighestUnlockedLevel();
    const totalStars = this.storage ? this.storage.getTotalStars() : 15;
    const beltRank = this.pedagogy ? this.pedagogy.calculateBelt(unlockedLevel, totalStars) : 'blanco';
    const beltTitle = PedagogyEngine.BELT_TIERS.find(b => b.belt === beltRank)?.title || 'Cinturón Blanco';

    const title = (unlockedLevel >= 8 || this.storage?.isExamPassed(8))
      ? 'Título Superior Oficial de Gran Maestro Mecanógrafo'
      : 'Título Oficial de Mecanógrafo/a de Grado Elemental';

    TypingCertificate.renderToCanvas(this.dom.diplomaCanvas, {
      studentName,
      title,
      beltRank: beltTitle,
      accuracy: Math.max(90, Math.round(this.gameEngine?.getAccuracy() || 95)),
      wpm: Math.max(15, Math.round(this.gameEngine?.getWPM() || 24)),
      stars: totalStars
    });
  }

  /**
   * Handle Mascot FSM state change visual and avatar sprite updates.
   * @param {string} newState
   * @param {string} oldState
   */
  handleMascotStateChange(newState, oldState) {
    if (!this.dom.mascotAvatar) return;

    const sprites = {
      IDLE: 'assets/robot_happy.png',
      FLOW_DANCE: 'assets/robot_flow_dance.jpg',
      HELPER_POINTING: 'assets/robot_thinking.png',
      SLEEPY: 'assets/robot_sleeping.png',
      HIGH_FIVE_WAIT: 'assets/robot_victory.png',
      CELEBRATING: 'assets/robot_victory.png'
    };

    if (sprites[newState]) {
      this.dom.mascotAvatar.src = sprites[newState];
    }

    // Apply state classes to mascot containers to trigger Flow CSS animations
    const stateSuffix = newState.toLowerCase().replace(/_/g, '-');
    const stateClass = `mascot-state-${stateSuffix}`;
    const allStateClasses = [
      'mascot-state-idle',
      'mascot-state-flow-dance',
      'mascot-state-helper-pointing',
      'mascot-state-sleepy',
      'mascot-state-high-five-wait',
      'mascot-state-celebrating',
      'mascot-idle',
      'mascot-flow-dance',
      'mascot-helper-pointing',
      'mascot-sleepy',
      'mascot-high-five-wait',
      'mascot-celebrating'
    ];

    const mascotTargets = [this.dom.mascotAvatar];
    mascotTargets.forEach(el => {
      if (el && el.classList) {
        allStateClasses.forEach(cls => el.classList.remove(cls));
        el.classList.add(stateClass);
      }
    });

    // Trigger juicy squash and stretch on mascot avatar
    if (this.dom.mascotAvatar) {
      applySquashAndStretch(this.dom.mascotAvatar, {
        preset: newState === MascotFSM.STATES.FLOW_DANCE || newState === MascotFSM.STATES.CELEBRATING
          ? 'happyBounce'
          : 'gentlePulse'
      });
    }

    // Update Mascot Badge
    if (this.dom.mascotBadge) {
      switch (newState) {
        case MascotFSM.STATES.FLOW_DANCE:
          this.dom.mascotBadge.textContent = 'Roby 🔥 ¡En Racha!';
          this.dom.mascotBadge.className = 'mascot-badge badge-combo';
          break;
        case MascotFSM.STATES.HELPER_POINTING:
          this.dom.mascotBadge.textContent = 'Roby 💡 ¡Consejo!';
          this.dom.mascotBadge.className = 'mascot-badge badge-tip';
          break;
        case MascotFSM.STATES.SLEEPY:
          this.dom.mascotBadge.textContent = 'Roby 💤 Zzz...';
          this.dom.mascotBadge.className = 'mascot-badge badge-sleeping';
          break;
        case MascotFSM.STATES.HIGH_FIVE_WAIT:
          this.dom.mascotBadge.textContent = 'Roby ✋ ¡Choca esos 5!';
          this.dom.mascotBadge.className = 'mascot-badge badge-victory';
          break;
        case MascotFSM.STATES.CELEBRATING:
          this.dom.mascotBadge.textContent = 'Roby 🏆 ¡Genial!';
          this.dom.mascotBadge.className = 'mascot-badge badge-victory';
          break;
        case MascotFSM.STATES.IDLE:
        default:
          this.dom.mascotBadge.textContent = 'Roby 🤖';
          this.dom.mascotBadge.className = 'mascot-badge badge-happy';
          break;
      }
    }
  }

  /**
   * Mascot Avatar click interaction.
   */
  handleMascotClick() {
    this.audio.playButtonClick();
    applySquashAndStretch(this.dom.mascotAvatar, { preset: 'happyBounce' });

    // Ensure voice is audible when child clicks mascot
    if (this.voiceQueue) {
      if (this.voiceQueue._volume <= 0) this.voiceQueue.setVolume(0.85);
      if (this.voiceQueue._muted) this.voiceQueue.setMuted(false);
    }
    if (this.voiceEngine) {
      if (this.voiceEngine._volume <= 0) this.voiceEngine.setVolume(0.85);
      if (this.voiceEngine._muted) this.voiceEngine.setMuted(false);
    }
    if (this.dom.voiceMuteBtn) {
      this.dom.voiceMuteBtn.textContent = '🔊';
      this.dom.voiceMuteBtn.title = 'Silenciar voz';
    }

    const phrase = getRandomGreeting();

    this.eventBus.emit('MASCOT_SPEAK_REQUEST', {
      text: phrase,
      priority: 'CRITICAL',
      emotion: 'happy'
    });
  }

  /**
   * Update the lesson tip bar in real time with the active key and assigned finger.
   * @param {Object} payload { key, keyName, finger, fingerName, handName, colorName }
   * @private
   */
  _updateTargetKeyTip(payload) {
    if (!payload || !this.dom.mascotLessonTip) return;

    // Keep active pedagogical teacher tip locked for reading
    if (this._manualTipLockTime && Date.now() < this._manualTipLockTime) {
      return;
    }

    const keyName = payload.keyName || (payload.key === ' ' ? 'Espacio' : (payload.key || '').toUpperCase());
    const fingerName = payload.fingerName || 'el dedo asignado';
    const colorName = payload.colorName ? ` (${payload.colorName})` : '';
    const handName = payload.handName ? ` de tu ${payload.handName}` : '';

    if (this.dom.tipIcon) this.dom.tipIcon.textContent = '🎯';
    this.dom.mascotLessonTip.textContent = `Pulsa [${keyName}] con el ${fingerName}${colorName}${handName}.`;
  }

  /**
   * Updates mascot speech bubble to guide player to the next target key.
   * @param {Object} payload { key, keyName, finger, fingerName, handName }
   * @private
   */
  _updateMascotSpeechBubbleForTarget(payload) {
    if (!payload || !this.dom.mascotSpeechText || !payload.key) return;
    const keyName = payload.keyName || (payload.key === ' ' ? 'Espacio' : (payload.key || '').toUpperCase());
    const fingerName = payload.fingerName || 'el dedo asignado';
    const handName = payload.handName ? ` de tu ${payload.handName}` : '';

    this.dom.mascotSpeechText.innerHTML = formatDialogueText(`¡Bien! Siguiente tecla: [${keyName}] con tu ${fingerName}${handName}.`);
  }

  /**
   * Updates cockpit ambient backlight halo color according to active finger.
   * @param {string} key
   * @private
   */
  _updateAmbientBacklight(key) {
    if (typeof document === 'undefined') return;
    const backlight = document.getElementById('cockpit-ambient-backlight');
    if (!backlight) return;

    let color = '#81C995'; // Left index default mint
    const k = String(key || '').toLowerCase();

    if ('qaz1'.includes(k) || 'pñ-0'.includes(k)) {
      color = '#F538A0'; // Pinkies (Coral / Magenta)
    } else if ('wsx2'.includes(k) || 'ol.9'.includes(k)) {
      color = '#FA903E'; // Ring fingers (Mandarina)
    } else if ('edc3'.includes(k) || 'ik,8'.includes(k)) {
      color = '#FCC934'; // Middle fingers (Ámbar)
    } else if ('rfvtgb45'.includes(k)) {
      color = '#81C995'; // Left index (Menta)
    } else if ('yhnujm67'.includes(k)) {
      color = '#12B5CB'; // Right index (Cian)
    } else if (k === ' ') {
      color = '#1A73E8'; // Thumbs (Azul)
    }

    backlight.style.setProperty('--active-finger-color', color);
  }

  /**
   * Cycle lesson tips bar with typing teacher pedagogical guidance.
   * @param {boolean} speakIt
   */
  cycleTip(speakIt = false) {
    this.audio.playButtonClick();

    // Lock manual tip for 12s so user can read typing teacher advice undisturbed
    this._manualTipLockTime = Date.now() + 12000;

    const tipObj = getNextPedagogicalTip();

    if (this.dom.tipIcon && tipObj.icon) {
      this.dom.tipIcon.textContent = tipObj.icon;
    }

    if (this.dom.mascotLessonTip) {
      this.dom.mascotLessonTip.textContent = tipObj.text;
      this.dom.mascotLessonTip.classList.remove('tip-flash');
      void this.dom.mascotLessonTip.offsetWidth; // force DOM reflow
      this.dom.mascotLessonTip.classList.add('tip-flash');
    }

    if (speakIt && this.voiceQueue) {
      const speech = tipObj.speechText || tipObj.text;
      this.voiceQueue.speak({ text: speech, priority: 'NORMAL', emotion: 'thinking' });
    }
  }

  /**
   * Toggle text zoom scale for accessibility across 3 distinct scales.
   */
  toggleTextZoom() {
    const scales = [
      { id: '', label: '🔍 Aa', mult: '1', title: 'Tamaño estándar (1.0x)' },
      { id: 'grande', label: '🔍 Aa+', mult: '1.50', title: 'Tamaño grande (1.5x)' },
      { id: 'extra', label: '🔍 Aa++', mult: '2.00', title: 'Tamaño gigante (2.0x)' }
    ];
    const current = document.body.dataset.textScale || '';
    const currentIdx = scales.findIndex(s => s.id === current);
    const nextIdx = (currentIdx + 1) % scales.length;
    const next = scales[nextIdx];

    if (next.id) {
      document.body.dataset.textScale = next.id;
      document.documentElement.dataset.textScale = next.id;
      document.documentElement.style.setProperty('--text-scale', next.mult);
    } else {
      delete document.body.dataset.textScale;
      delete document.documentElement.dataset.textScale;
      document.documentElement.style.setProperty('--text-scale', '1');
    }

    if (this.dom.targetWord) {
      this.dom.targetWord.style.setProperty('--text-scale', next.mult);
    }
    if (this.dom.wordPanel) {
      this.dom.wordPanel.style.setProperty('--text-scale', next.mult);
    }

    if (this.dom.zoomBtn) {
      this.dom.zoomBtn.textContent = next.label;
      this.dom.zoomBtn.title = `Tamaño de texto: ${next.label} - ${next.title} (Clic para cambiar)`;
    }

    try {
      localStorage.setItem('mecano_text_zoom', next.id);
    } catch (e) {}

    this.updateWordDisplay();
  }

  /**
   * Populates the header voice selector with ranked neural/natural voices.
   * @private
   */
  _populateVoiceSelector() {
    if (!this.dom.voiceSelect || !this.voiceEngine) return;
    const voices = this.voiceEngine.getAvailableVoices();
    this.dom.voiceSelect.innerHTML = '';

    if (voices.length === 0) {
      const opt = document.createElement('option');
      opt.value = '';
      opt.textContent = '✨ Álvaro (Neuronal HD)';
      this.dom.voiceSelect.appendChild(opt);
      return;
    }

    voices.forEach((v, idx) => {
      const opt = document.createElement('option');
      opt.value = v.id;
      opt.textContent = `${v.isNatural ? '✨ ' : ''}${v.name}`;
      if (idx === 0) opt.selected = true;
      this.dom.voiceSelect.appendChild(opt);
    });
  }

  // --- Modal Helpers ---

  showStartScreen() {
    if (this.dom.startScreen) {
      this.renderLevelMap();
      this.updateBeltUI();
      this.dom.startScreen.classList.remove('hidden');
    }
  }

  hideStartScreen() {
    if (this.dom.startScreen) {
      this.dom.startScreen.classList.add('hidden');
    }
  }

  showLevelCompleteModal() {
    if (this.dom.levelComplete) {
      this.dom.levelComplete.classList.remove('hidden');
      applySquashAndStretch(this.dom.levelComplete.querySelector('.level-complete-box'), {
        preset: 'happyBounce'
      });
    }
  }

  hideLevelCompleteModal() {
    if (this.dom.levelComplete) {
      this.dom.levelComplete.classList.add('hidden');
    }
  }
}

// ============================================================================
// Auto-bootstrap when loaded in browser
// ============================================================================
export const app = new MecanoApp();

if (typeof window !== 'undefined') {
  window.app = app;
  window.MecanoApp = MecanoApp;
  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => app.init());
    } else {
      app.init();
    }
  }
}
