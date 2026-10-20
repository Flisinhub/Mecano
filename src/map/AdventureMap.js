/**
 * AdventureMap.js - Interactive Super Mario World Style Adventure Map for Mecano
 * 
 * Features:
 * - 8 Thematic Overworld Islands (Valle Fila Guía, Isla Fila Superior, etc.)
 * - 16-node winding S-curve golden path with smooth Catmull-Rom cubic Bézier splines
 * - Mario-style circular stone level nodes (Completed, Active with Mini-Roby, Locked)
 * - Grand Castle Fortress node for Level Mastery Examinations (🏰 Examen)
 * - Real-time progress synchronization with StorageManager & PedagogyEngine
 * - Smooth camera zoom, sound effects (Web Audio API), and instant lesson launcher
 */

export const ADVENTURE_WORLDS = [
  {
    id: 1,
    title: 'Mundo 1: Valle Fila Guía',
    subtitle: 'Los Centinelas de Casa (F, J y Espacio)',
    theme: 'valley',
    color: '#2ed573',
    banner: '🌿 Valle de los Centinelas (F y J)',
    bgImage: 'assets/maps/world_1_bg.jpg',
    scenery: {
      hillColor1: '#1b4d3e',
      hillColor2: '#13392f',
      skyGradient: 'linear-gradient(180deg, #0d2836 0%, #061826 100%)',
      accent: '#2ed573',
      emoji: '🎯'
    }
  },
  {
    id: 2,
    title: 'Mundo 2: Isla Fila Superior',
    subtitle: 'La Fila Guía Completa (A S D F / J K L Ñ)',
    theme: 'sky',
    color: '#00cec9',
    banner: '🏰 Reino de la Fila Guía Completa',
    scenery: {
      hillColor1: '#0f3c53',
      hillColor2: '#0b293a',
      skyGradient: 'linear-gradient(180deg, #091a2e 0%, #05101f 100%)',
      accent: '#00cec9',
      emoji: '☁️'
    }
  },
  {
    id: 3,
    title: 'Mundo 3: Selva Fila Inferior',
    subtitle: 'Vocales E/I y Primeras Palabras',
    theme: 'jungle',
    color: '#e17055',
    banner: '🌴 Selva Tropical de las Vocales',
    scenery: {
      hillColor1: '#472218',
      hillColor2: '#2c150e',
      skyGradient: 'linear-gradient(180deg, #1c111e 0%, #090a18 100%)',
      accent: '#e17055',
      emoji: '🌴'
    }
  },
  {
    id: 4,
    title: 'Mundo 4: Reino de las Vocales',
    subtitle: 'Expansión O/U y Consonantes (C, M, P, T)',
    theme: 'crystals',
    color: '#a29bfe',
    banner: '✨ Cavernas de Cristal y Vocales',
    scenery: {
      hillColor1: '#372b64',
      hillColor2: '#221944',
      skyGradient: 'linear-gradient(180deg, #16102b 0%, #080718 100%)',
      accent: '#a29bfe',
      emoji: '✨'
    }
  },
  {
    id: 5,
    title: 'Mundo 5: Montaña de Frases',
    subtitle: 'Frases y Espaciador (Graduación Primaria 🎓)',
    theme: 'mountain',
    color: '#fdcb6e',
    banner: '🏔️ Cumbre de la Gran Montaña (Diploma 🎓)',
    scenery: {
      hillColor1: '#4a3b1a',
      hillColor2: '#2c220c',
      skyGradient: 'linear-gradient(180deg, #1c1912 0%, #0a0b14 100%)',
      accent: '#fdcb6e',
      emoji: '🏔️'
    }
  },
  {
    id: 6,
    title: 'Mundo 6: Cueva de los Cuentos',
    subtitle: 'Historias y Aventuras sin Mirar el Teclado',
    theme: 'storybook',
    color: '#ff7675',
    banner: '📖 Fortaleza de los Cuentos Épicos',
    scenery: {
      hillColor1: '#4d1e2a',
      hillColor2: '#2e0f17',
      skyGradient: 'linear-gradient(180deg, #220f1a 0%, #0b0716 100%)',
      accent: '#ff7675',
      emoji: '🏰'
    }
  },
  {
    id: 7,
    title: 'Mundo 7: Club de Trabalenguas',
    subtitle: 'Velocidad, Agilidad y Retos Extremos',
    theme: 'circus',
    color: '#fd79a8',
    banner: '🎪 Carnaval de Alta Velocidad y Humor',
    scenery: {
      hillColor1: '#4c183f',
      hillColor2: '#2c0c24',
      skyGradient: 'linear-gradient(180deg, #220b24 0%, #080616 100%)',
      accent: '#fd79a8',
      emoji: '⚡'
    }
  },
  {
    id: 8,
    title: 'Mundo 8: Desafío Galáctico',
    subtitle: 'El Dragón Robot y el Título Maestro 🐉',
    theme: 'galaxy',
    color: '#ffd32a',
    banner: '🌌 Cosmos del Dragón Robot (Maestro Supremo)',
    scenery: {
      hillColor1: '#36225a',
      hillColor2: '#1a0f33',
      skyGradient: 'linear-gradient(180deg, #130f28 0%, #040310 100%)',
      accent: '#ffd32a',
      emoji: '🐉'
    }
  }
];

// Fixed 16-node winding trail coordinates on 1100 x 540 overworld canvas
export const MAP_NODE_COORDINATES = [
  // Fila 1: Lecciones 1 a 6 (Izquierda a Derecha)
  { x: 90,  y: 90 },
  { x: 230, y: 75 },
  { x: 380, y: 100 },
  { x: 530, y: 80 },
  { x: 680, y: 100 },
  { x: 820, y: 85 },
  // Curva de descenso este: Lección 7
  { x: 960, y: 165 },
  // Fila 2: Lecciones 8 a 12 (Derecha a Izquierda)
  { x: 880, y: 260 },
  { x: 730, y: 245 },
  { x: 580, y: 270 },
  { x: 430, y: 245 },
  { x: 280, y: 265 },
  // Curva de descenso oeste: Lección 13
  { x: 130, y: 340 },
  // Fila 3: Lecciones 14, 15 y Castillo Examen 16 (Izquierda a Derecha)
  { x: 200, y: 440 },
  { x: 440, y: 445 },
  { x: 790, y: 430 } // Nodo Castillo
];

export class AdventureMap {
  /**
   * @param {Object} options
   * @param {Object} options.pedagogy PedagogyEngine instance
   * @param {Object} options.storage StorageManager instance
   * @param {Object} [options.audio] ProceduralAudio instance
   * @param {Function} [options.onSelectLesson] Callback (worldId, lessonId) => void
   * @param {Function} [options.onSelectExam] Callback (worldId) => void
   * @param {string} [options.modalId='adventure-map-modal'] Modal element ID
   */
  constructor(options = {}) {
    this.pedagogy = options.pedagogy;
    this.storage = options.storage;
    this.audio = options.audio || null;
    this.onSelectLesson = options.onSelectLesson || (() => {});
    this.onSelectExam = options.onSelectExam || (() => {});
    this.modalId = options.modalId || 'adventure-map-modal';

    this.activeWorldId = 1;
    this.selectedNodeId = null;
    this.isOpen = false;
    this.nodes = [];

    this._modalEl = null;
    this._initialized = false;
  }

  /**
   * Initializes DOM elements and event listeners.
   */
  init() {
    if (this._initialized) return;
    this._modalEl = document.getElementById(this.modalId);
    if (!this._modalEl) {
      this._createModalMarkup();
    }
    this._bindModalEvents();
    this._initialized = true;
  }

  /**
   * Creates the base HTML structure of the Super Mario World Adventure Map.
   * @private
   */
  _createModalMarkup() {
    const modal = document.createElement('div');
    modal.id = this.modalId;
    modal.className = 'adventure-map-modal hidden';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.setAttribute('aria-label', 'Mapa de Aventuras de Mecanografía');

    modal.innerHTML = `
      <div class="adventure-map-backdrop" id="adventure-map-backdrop"></div>
      <div class="adventure-map-dialog" id="adventure-map-dialog">
        <!-- Cabecera Superior del Mapa Overworld -->
        <header class="map-dialog-header">
          <div class="map-header-left">
            <span class="map-header-badge">🗺️ MODO AVENTURA</span>
            <h2 class="map-header-title" id="map-header-title">Mapa de Mundos Mecano</h2>
          </div>
          <div class="map-header-meta">
            <div class="map-stars-pill" id="map-stars-pill" title="Total de estrellas doradas acumuladas">
              ⭐ <span id="map-total-stars">0</span> Estrellas
            </div>
            <div class="map-belt-pill" id="map-belt-pill" title="Cinturón actual de mecanografía">
              🥋 Cinturón Blanco
            </div>
            <button class="map-close-btn" id="map-close-btn" title="Cerrar mapa (Esc)" aria-label="Cerrar mapa">✖</button>
          </div>
        </header>

        <!-- Selector de Islas / Mundos Temáticos (Mario World Tabs) -->
        <nav class="map-worlds-nav" id="map-worlds-nav" aria-label="Seleccionar Mundo o Isla Temática">
          <!-- Chips de mundos generados dinámicamente -->
        </nav>

        <!-- Tablero del Mundo con Sendero SVG y Nodos de Niveles -->
        <main class="adventure-map-board" id="adventure-map-board">
          <div class="map-board-background" id="map-board-background"></div>
          <svg class="map-trail-svg" id="map-trail-svg" viewBox="0 0 1100 540" preserveAspectRatio="xMidYMid meet">
            <defs>
              <!-- Filtros de sombra y resplandor -->
              <filter id="mario-node-shadow" x="-40%" y="-40%" width="180%" height="180%">
                <feDropShadow dx="0" dy="6" stdDeviation="5" flood-color="#050711" flood-opacity="0.75" />
              </filter>
              <filter id="mario-castle-shadow" x="-40%" y="-40%" width="180%" height="180%">
                <feDropShadow dx="0" dy="10" stdDeviation="8" flood-color="#050711" flood-opacity="0.85" />
              </filter>
              <filter id="mario-trail-glow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="4" result="blur" />
                <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
              </filter>
              <filter id="sparkle-glow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
              </filter>
              <filter id="portal-cyan-glow" x="-40%" y="-40%" width="180%" height="180%">
                <feGaussianBlur stdDeviation="5" result="blur" />
                <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
              </filter>
              <filter id="gold-coin-glow" x="-30%" y="-30%" width="160%" height="160%">
                <feDropShadow dx="0" dy="3" stdDeviation="4" flood-color="#f59e0b" flood-opacity="0.5" />
              </filter>

              <!-- Gradientes Metálicos para Monedas de Oro 3D -->
              <linearGradient id="gold-coin-rim" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stop-color="#fef08a" />
                <stop offset="40%" stop-color="#eab308" />
                <stop offset="85%" stop-color="#854d0e" />
                <stop offset="100%" stop-color="#ca8a04" />
              </linearGradient>
              <linearGradient id="gold-coin-face" x1="20%" y1="0%" x2="80%" y2="100%">
                <stop offset="0%" stop-color="#fffbeb" />
                <stop offset="25%" stop-color="#fde047" />
                <stop offset="70%" stop-color="#f59e0b" />
                <stop offset="100%" stop-color="#b45309" />
              </linearGradient>
              <linearGradient id="gold-bevel-light" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stop-color="rgba(255, 255, 255, 0.75)" />
                <stop offset="45%" stop-color="rgba(255, 255, 255, 0)" />
                <stop offset="100%" stop-color="rgba(0, 0, 0, 0.45)" />
              </linearGradient>

              <!-- Gradientes para Ficha de Piedra Bloqueada 3D -->
              <linearGradient id="stone-slab-grad" x1="20%" y1="0%" x2="80%" y2="100%">
                <stop offset="0%" stop-color="#64748b" />
                <stop offset="45%" stop-color="#334155" />
                <stop offset="100%" stop-color="#1e293b" />
              </linearGradient>
              <radialGradient id="stone-inner-grad" cx="50%" cy="40%" r="60%">
                <stop offset="0%" stop-color="#1e293b" />
                <stop offset="100%" stop-color="#0f172a" />
              </radialGradient>
              <linearGradient id="lock-body-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stop-color="#fef08a" />
                <stop offset="50%" stop-color="#f59e0b" />
                <stop offset="100%" stop-color="#92400e" />
              </linearGradient>
              <linearGradient id="lock-shackle-grad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stop-color="#fef3c7" />
                <stop offset="50%" stop-color="#b45309" />
                <stop offset="100%" stop-color="#fde68a" />
              </linearGradient>

              <!-- Gradientes para Plataforma Portal Cian (Nivel Actual) -->
              <linearGradient id="portal-outer-ring" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stop-color="#a5f3fc" />
                <stop offset="50%" stop-color="#06b6d4" />
                <stop offset="100%" stop-color="#0284c7" />
              </linearGradient>
              <radialGradient id="portal-core-glow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stop-color="rgba(103, 232, 249, 0.95)" />
                <stop offset="55%" stop-color="rgba(6, 182, 212, 0.45)" />
                <stop offset="100%" stop-color="rgba(15, 23, 42, 0)" />
              </radialGradient>

              <!-- Gradientes para Castillo Medieval 3D -->
              <linearGradient id="castle-wall-light" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stop-color="#94a3b8" />
                <stop offset="50%" stop-color="#64748b" />
                <stop offset="100%" stop-color="#475569" />
              </linearGradient>
              <linearGradient id="castle-roof-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stop-color="#a5b4fc" />
                <stop offset="50%" stop-color="#6366f1" />
                <stop offset="100%" stop-color="#312e81" />
              </linearGradient>
              <radialGradient id="castle-portal-fire" cx="50%" cy="85%" r="75%">
                <stop offset="0%" stop-color="#fef08a" />
                <stop offset="35%" stop-color="#f59e0b" />
                <stop offset="70%" stop-color="#ec4899" />
                <stop offset="100%" stop-color="#0f172a" />
              </radialGradient>
              <linearGradient id="flag-wave-grad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stop-color="#fde047" />
                <stop offset="50%" stop-color="#f59e0b" />
                <stop offset="100%" stop-color="#d97706" />
              </linearGradient>
            </defs>
            <g id="svg-scenery-layer" class="svg-scenery-layer"></g>
            <g id="svg-clouds-back-layer" class="svg-clouds-back-layer"></g>
            <g id="svg-trail-layer" class="svg-trail-layer"></g>
            <g id="svg-fireflies-layer" class="svg-fireflies-layer"></g>
            <g id="svg-nodes-layer" class="svg-nodes-layer"></g>
            <g id="svg-clouds-front-layer" class="svg-clouds-front-layer"></g>
          </svg>
        </main>

        <!-- Tarjeta de Información y Lanzador de Nivel (Course Card) -->
        <footer class="map-course-card" id="map-course-card">
          <div class="course-card-left">
            <div class="course-badge" id="course-badge">1.1</div>
            <div class="course-info">
              <h3 class="course-title" id="course-title">El hogar del índice izquierdo (F)</h3>
              <p class="course-desc" id="course-desc">Coloca tus dedos índices en la F y la J.</p>
            </div>
          </div>
          <div class="course-card-center">
            <div class="course-keys-row" id="course-keys-row">
              <span class="course-key-chip">F</span>
              <span class="course-key-chip">J</span>
            </div>
            <div class="course-stars-rating" id="course-stars-rating">
              <span class="star-on">⭐</span><span class="star-on">⭐</span><span class="star-on">⭐</span>
            </div>
          </div>
          <div class="course-card-right">
            <button class="pulse-button course-launch-btn" id="course-launch-btn">¡Entrar al Nivel! 🚀</button>
          </div>
        </footer>
      </div>
    `;

    document.body.appendChild(modal);
    this._modalEl = modal;
  }

  /**
   * Binds UI click, touch, and keyboard events.
   * @private
   */
  _bindModalEvents() {
    if (!this._modalEl) return;

    // Close buttons & backdrop
    const closeBtn = this._modalEl.querySelector('#map-close-btn');
    const backdrop = this._modalEl.querySelector('#adventure-map-backdrop');

    if (closeBtn) closeBtn.addEventListener('click', () => this.close());
    if (backdrop) backdrop.addEventListener('click', () => this.close());

    // Launch course button
    const launchBtn = this._modalEl.querySelector('#course-launch-btn');
    if (launchBtn) {
      launchBtn.addEventListener('click', () => {
        this._launchCurrentSelection();
      });
    }

    // Keyboard navigation
    window.addEventListener('keydown', (e) => {
      if (!this.isOpen) return;

      if (e.key === 'Escape') {
        e.preventDefault();
        this.close();
      } else if (e.key === 'Enter') {
        e.preventDefault();
        this._launchCurrentSelection();
      } else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault();
        this._stepNodeSelection(1);
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault();
        this._stepNodeSelection(-1);
      }
    });
  }

  /**
   * Opens the interactive adventure map.
   * @param {Object} [options]
   * @param {number} [options.worldId] Default world to display (defaults to current or 1)
   */
  open(options = {}) {
    this.init();
    if (!this._modalEl) return;

    if (this.audio) this.audio.playButtonClick();

    const highestUnlocked = this._getHighestUnlockedLevel();
    const requestedWorld = Number(options.worldId) || this.activeWorldId || 1;
    this.activeWorldId = Math.min(requestedWorld, highestUnlocked);

    this.isOpen = true;
    this._modalEl.classList.remove('hidden');
    this._modalEl.classList.add('map-entering');
    setTimeout(() => this._modalEl.classList.remove('map-entering'), 350);

    this.render();
  }

  /**
   * Closes the interactive adventure map with a smooth zoom transition.
   */
  close() {
    if (!this.isOpen || !this._modalEl) return;
    if (this.audio) this.audio.playButtonClick();

    this._modalEl.classList.add('map-leaving');
    setTimeout(() => {
      this._modalEl.classList.add('hidden');
      this._modalEl.classList.remove('map-leaving');
      this.isOpen = false;
    }, 250);
  }

  /**
   * Toggles the map open/closed.
   */
  toggle() {
    if (this.isOpen) {
      this.close();
    } else {
      this.open();
    }
  }

  /**
   * Changes the active world tab.
   * @param {number} worldId 1 to 8
   */
  setWorld(worldId) {
    const id = Math.max(1, Math.min(8, Number(worldId) || 1));
    const highestUnlocked = this._getHighestUnlockedLevel();

    if (id > highestUnlocked) {
      if (this.audio) this.audio.playLockedShake();
      this._flashLockedNotice(`¡Supera el Castillo Examen del Mundo ${id - 1} para navegar a esta Isla! 🔒`);
      return;
    }

    if (this.audio) this.audio.playMapNodeSelect();
    this.activeWorldId = id;
    this.selectedNodeId = null;
    this.render();
  }

  /**
   * Re-renders the complete map dialog (Header, World Tabs, Overworld Trail & Course Card).
   */
  render() {
    if (!this._modalEl) return;

    this._renderHeaderMeta();
    this._renderWorldTabs();
    this._renderMapBoard();
  }

  /**
   * Updates global star totals and belt ranks in header.
   * @private
   */
  _renderHeaderMeta() {
    const totalStars = this.storage ? this.storage.getTotalStars() : 0;
    const starsEl = this._modalEl.querySelector('#map-total-stars');
    if (starsEl) starsEl.textContent = String(totalStars);

    const beltEl = this._modalEl.querySelector('#map-belt-pill');
    if (beltEl && this.pedagogy && this.storage) {
      const beltKey = this.storage.getBelt();
      const highestUnlocked = this._getHighestUnlockedLevel();
      const currentBelt = this.pedagogy.calculateBelt(highestUnlocked, totalStars);
      const tierObj = this.pedagogy.getBeltTier ? this.pedagogy.getBeltTier(currentBelt) : null;
      beltEl.textContent = tierObj ? `${tierObj.emoji} ${tierObj.title}` : `🥋 Cinturón ${currentBelt.toUpperCase()}`;
    }
  }

  /**
   * Renders the 8 World Tabs along the top.
   * @private
   */
  _renderWorldTabs() {
    const nav = this._modalEl.querySelector('#map-worlds-nav');
    if (!nav) return;

    nav.innerHTML = '';
    const highestUnlocked = this._getHighestUnlockedLevel();

    ADVENTURE_WORLDS.forEach((world) => {
      const isUnlocked = world.id <= highestUnlocked;
      const isActive = world.id === this.activeWorldId;

      const tab = document.createElement('button');
      tab.className = `map-world-tab ${isActive ? 'is-active' : ''} ${!isUnlocked ? 'is-locked' : 'is-unlocked'}`;
      tab.style.setProperty('--world-theme-color', world.color);
      tab.setAttribute('role', 'tab');
      tab.setAttribute('aria-selected', isActive ? 'true' : 'false');
      tab.title = isUnlocked ? world.title : `${world.title} (Bloqueado)`;

      const completedLessons = this.storage ? this.storage.getCompletedLessons(world.id).length : 0;
      const examPassed = this.storage ? this.storage.isExamPassed(world.id) : false;

      tab.innerHTML = `
        <span class="world-tab-icon">${isUnlocked ? world.scenery.emoji : '🔒'}</span>
        <div class="world-tab-texts">
          <span class="world-tab-name">${world.title.split(':')[1] || world.title}</span>
          <span class="world-tab-prog">${isUnlocked ? (examPassed ? '👑 Superado' : `${completedLessons}/15`) : 'Bloqueado'}</span>
        </div>
      `;

      tab.addEventListener('click', () => {
        this.setWorld(world.id);
      });

      nav.appendChild(tab);
    });
  }

  /**
   * Renders the SVG Trail, Nodes, Scenery, and updates Course Card.
   * @private
   */
  _renderMapBoard() {
    const world = ADVENTURE_WORLDS.find(w => w.id === this.activeWorldId) || ADVENTURE_WORLDS[0];
    const boardBg = this._modalEl.querySelector('#map-board-background');
    if (boardBg) {
      if (world.bgImage) {
        boardBg.style.background = `linear-gradient(rgba(10, 15, 30, 0.4), rgba(10, 15, 30, 0.7)), url('${world.bgImage}') center/cover no-repeat`;
      } else {
        boardBg.style.background = world.scenery.skyGradient;
      }
    }

    const titleEl = this._modalEl.querySelector('#map-header-title');
    if (titleEl) {
      titleEl.textContent = world.banner;
    }

    // Build node data for this world
    this._buildNodesForWorld(world.id);

    // Draw SVG Scenery, Atmosphere, Trail, Fireflies & Nodes
    this._drawScenery(world);
    this._drawAtmosphere(world);
    this._drawTrail();
    this._drawFireflies();
    this._drawNodes();

    // Select active node for preview card
    if (!this.selectedNodeId) {
      const activeNode = this.nodes.find(n => n.isActive) || this.nodes.find(n => n.isUnlocked) || this.nodes[0];
      this.selectedNodeId = activeNode ? activeNode.id : null;
    }
    this._updateCourseCard();
  }

  /**
   * Builds the 16 nodes definition for the current world.
   * @private
   */
  _buildNodesForWorld(worldId) {
    const lessons = this.pedagogy ? this.pedagogy.getLessonsForLevel(worldId) : [];
    const examDef = this.pedagogy ? this.pedagogy.getExamForLevel(worldId) : null;
    const highestUnlocked = this._getHighestUnlockedLevel();
    const isWorldUnlocked = worldId <= highestUnlocked;

    const completedLessons = this.storage ? this.storage.getCompletedLessons(worldId) : [];
    const isExamPassed = this.storage ? this.storage.isExamPassed(worldId) : false;

    this.nodes = [];

    // Nodos 1 a 15 (Micro-lecciones)
    for (let i = 0; i < 15; i++) {
      const lesson = lessons[i] || {
        id: `${worldId}.${i + 1}`,
        title: `Lección ${worldId}.${i + 1}`,
        words: [{ text: 'f j', label: 'Inicio' }]
      };

      const coord = MAP_NODE_COORDINATES[i] || { x: 100 + i * 50, y: 100 };
      const isCompleted = completedLessons.includes(lesson.id);

      // Desbloqueado si: mundo desbloqueado Y (es la lección 1 O la lección anterior está completada O ya la completó)
      let isUnlocked = false;
      if (isWorldUnlocked) {
        if (i === 0) {
          isUnlocked = true;
        } else {
          const prevLesson = lessons[i - 1];
          const prevCompleted = prevLesson && completedLessons.includes(prevLesson.id);
          isUnlocked = prevCompleted || isCompleted;
        }
      }

      // Stars
      const stars = this.storage ? this.storage.getLessonStars(worldId, lesson.id) : (isCompleted ? 3 : 0);

      this.nodes.push({
        id: lesson.id,
        index: i,
        type: 'lesson',
        worldId,
        number: lesson.id,
        title: lesson.title,
        tip: lesson.tip || (lesson.words && lesson.words[0] ? lesson.words[0].label : ''),
        words: lesson.words || [],
        x: coord.x,
        y: coord.y,
        isCompleted,
        isUnlocked,
        isActive: false, // Calculated next
        stars
      });
    }

    // Nodo 16: El Gran Castillo Examen
    const castleCoord = MAP_NODE_COORDINATES[15] || { x: 790, y: 430 };
    const canTakeExam = isWorldUnlocked && (completedLessons.length >= 15 || isExamPassed);

    this.nodes.push({
      id: `${worldId}-exam`,
      index: 15,
      type: 'castle',
      worldId,
      number: `Castillo ${worldId}`,
      title: examDef ? examDef.title : `Examen de Maestría del Mundo ${worldId}`,
      tip: examDef ? examDef.description : '¡Demuestra tu dominio para desbloquear el siguiente mundo!',
      words: examDef ? examDef.words : [],
      x: castleCoord.x,
      y: castleCoord.y,
      isCompleted: isExamPassed,
      isUnlocked: canTakeExam,
      isActive: false,
      stars: isExamPassed ? 3 : 0
    });

    // Mark current active node (first unlocked & uncompleted node)
    let foundActive = false;
    for (const node of this.nodes) {
      if (node.isUnlocked && !node.isCompleted) {
        node.isActive = true;
        foundActive = true;
        break;
      }
    }
    // If all completed, active node is the Castle
    if (!foundActive && this.nodes.length > 0) {
      this.nodes[this.nodes.length - 1].isActive = true;
    }
  }

  /**
   * Draws decorative Mario World scenery elements (clouds, hills, question blocks).
   * @private
   */
  _drawScenery(world) {
    const layer = this._modalEl.querySelector('#svg-scenery-layer');
    if (!layer) return;

    layer.innerHTML = `
      <!-- Colinas onduladas de fondo -->
      <path d="M -20,400 Q 220,290 480,360 T 1120,320 L 1120,560 L -20,560 Z" fill="${world.scenery.hillColor1}" opacity="0.6" />
      <path d="M -20,440 Q 300,350 640,410 T 1120,380 L 1120,560 L -20,560 Z" fill="${world.scenery.hillColor2}" opacity="0.8" />

      <!-- Nubes sonrientes estilo Super Mario -->
      <g class="mario-cloud" transform="translate(140, 40)" opacity="0.45">
        <ellipse cx="60" cy="30" rx="36" ry="18" fill="#ffffff" />
        <ellipse cx="40" cy="32" rx="22" ry="14" fill="#ffffff" />
        <ellipse cx="80" cy="32" rx="22" ry="14" fill="#ffffff" />
        <circle cx="52" cy="30" r="2.2" fill="#1e293b" />
        <circle cx="68" cy="30" r="2.2" fill="#1e293b" />
      </g>
      <g class="mario-cloud" transform="translate(680, 30)" opacity="0.35">
        <ellipse cx="60" cy="30" rx="42" ry="20" fill="#ffffff" />
        <ellipse cx="38" cy="32" rx="26" ry="16" fill="#ffffff" />
        <ellipse cx="82" cy="32" rx="26" ry="16" fill="#ffffff" />
        <circle cx="52" cy="30" r="2.2" fill="#1e293b" />
        <circle cx="68" cy="30" r="2.2" fill="#1e293b" />
      </g>

      <!-- Bloques misteriosos flotantes [?] -->
      <g class="mario-block" transform="translate(470, 40)">
        <rect x="0" y="0" width="28" height="28" rx="6" fill="#f59e0b" stroke="#ffd32a" stroke-width="2" />
        <text x="14" y="20" font-family="'Nunito', sans-serif" font-weight="900" font-size="16" fill="#ffffff" text-anchor="middle">?</text>
      </g>
      <g class="mario-block" transform="translate(860, 200)">
        <rect x="0" y="0" width="28" height="28" rx="6" fill="#f59e0b" stroke="#ffd32a" stroke-width="2" />
        <text x="14" y="20" font-family="'Nunito', sans-serif" font-weight="900" font-size="16" fill="#ffffff" text-anchor="middle">?</text>
      </g>
    `;
  }

  /**
   * Draws multi-layer drifting clouds for Parallax depth.
   * @private
   */
  _drawAtmosphere(world) {
    const backCloudsLayer = this._modalEl.querySelector('#svg-clouds-back-layer');
    const frontCloudsLayer = this._modalEl.querySelector('#svg-clouds-front-layer');

    if (backCloudsLayer) {
      backCloudsLayer.innerHTML = `
        <!-- Capa de nubes de fondo más lentas y etéreas -->
        <g class="drifting-clouds-back">
          <g class="fluffy-cloud c1" transform="translate(180, 50)" opacity="0.45">
            <ellipse cx="60" cy="30" rx="46" ry="22" fill="#ffffff" />
            <ellipse cx="36" cy="32" rx="28" ry="17" fill="#ffffff" />
            <ellipse cx="84" cy="32" rx="28" ry="17" fill="#ffffff" />
          </g>
          <g class="fluffy-cloud c2" transform="translate(620, 35)" opacity="0.4">
            <ellipse cx="70" cy="30" rx="52" ry="24" fill="#ffffff" />
            <ellipse cx="42" cy="32" rx="32" ry="18" fill="#ffffff" />
            <ellipse cx="98" cy="32" rx="32" ry="18" fill="#ffffff" />
          </g>
          <g class="fluffy-cloud c3" transform="translate(950, 65)" opacity="0.35">
            <ellipse cx="50" cy="25" rx="38" ry="18" fill="#ffffff" />
            <ellipse cx="30" cy="26" rx="22" ry="14" fill="#ffffff" />
            <ellipse cx="70" cy="26" rx="22" ry="14" fill="#ffffff" />
          </g>
        </g>
      `;
    }

    if (frontCloudsLayer) {
      frontCloudsLayer.innerHTML = `
        <!-- Capa de nubes frontales translúcidas con desplazamiento suave -->
        <g class="drifting-clouds-front">
          <g class="wispy-cloud w1" transform="translate(80, 190)" opacity="0.22">
            <ellipse cx="90" cy="20" rx="80" ry="18" fill="#ffffff" filter="blur(3px)" />
            <ellipse cx="50" cy="22" rx="45" ry="14" fill="#ffffff" filter="blur(3px)" />
            <ellipse cx="130" cy="22" rx="45" ry="14" fill="#ffffff" filter="blur(3px)" />
          </g>
          <g class="wispy-cloud w2" transform="translate(720, 360)" opacity="0.25">
            <ellipse cx="110" cy="24" rx="95" ry="20" fill="#ffffff" filter="blur(4px)" />
            <ellipse cx="65" cy="26" rx="55" ry="16" fill="#ffffff" filter="blur(4px)" />
            <ellipse cx="155" cy="26" rx="55" ry="16" fill="#ffffff" filter="blur(4px)" />
          </g>
        </g>
      `;
    }
  }

  /**
   * Generates and draws the golden Mario Overworld path through all 16 nodes.
   * @private
   */
  _drawTrail() {
    const layer = this._modalEl.querySelector('#svg-trail-layer');
    if (!layer || !this.nodes.length) return;

    const splineD = this._generateSplinePath(this.nodes);

    layer.innerHTML = `
      <!-- Sombra profunda del sendero -->
      <path class="map-trail-shadow" d="${splineD}" fill="none" stroke="rgba(0, 0, 0, 0.55)" stroke-width="16" stroke-linecap="round" stroke-linejoin="round" />
      <!-- Calzada dorada de piedra con brillo -->
      <path class="map-trail-line map-trail-road" d="${splineD}" fill="none" stroke="#eab308" stroke-width="9" stroke-linecap="round" stroke-linejoin="round" filter="url(#mario-trail-glow)" />
      <!-- Línea discontinua blanca estilo Super Mario World -->
      <path class="map-trail-dashes" d="${splineD}" fill="none" stroke="#ffffff" stroke-width="3" stroke-linecap="round" stroke-dasharray="6 12" opacity="0.9" />
    `;
  }

  /**
   * Draws glowing animated magical fireflies / sparkles along the golden trail.
   * @private
   */
  _drawFireflies() {
    const layer = this._modalEl.querySelector('#svg-fireflies-layer');
    if (!layer || this.nodes.length < 2) return;

    let firefliesHTML = '';
    for (let i = 0; i < this.nodes.length - 1; i++) {
      const p1 = this.nodes[i];
      const p2 = this.nodes[i + 1];
      const midX = Math.round((p1.x + p2.x) / 2 + (i % 2 === 0 ? 12 : -12));
      const midY = Math.round((p1.y + p2.y) / 2 + (i % 3 === 0 ? -16 : 14));
      const isGold = i % 2 === 0;
      const color = isGold ? '#ffd32a' : '#67e8f9';
      const delay = (i * 0.35).toFixed(2);

      firefliesHTML += `
        <g class="trail-sparkle-group" transform="translate(${midX}, ${midY})">
          <circle cx="0" cy="0" r="3" fill="${color}" filter="url(#sparkle-glow)" class="sparkle-dot sparkle-anim-${(i % 4) + 1}" style="animation-delay: ${delay}s;" />
          <polygon points="0,-4 1,-1 4,0 1,1 0,4 -1,1 -4,0 -1,-1" fill="#ffffff" opacity="0.8" class="sparkle-star" style="animation-delay: ${delay}s;" />
        </g>
      `;
    }
    layer.innerHTML = firefliesHTML;
  }

  /**
   * Draws the 16 interactive nodes on the map.
   * @private
   */
  _drawNodes() {
    const layer = this._modalEl.querySelector('#svg-nodes-layer');
    if (!layer || !this.nodes.length) return;

    layer.innerHTML = '';

    this.nodes.forEach((node) => {
      const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      const isSelected = node.id === this.selectedNodeId;
      const classes = [
        'map-node',
        'map-node-group',
        `node-${node.type}`,
        node.type === 'castle' ? 'mario-castle-3d' : '',
        node.isUnlocked ? 'is-unlocked' : 'is-locked',
        node.isCompleted ? 'is-completed' : '',
        node.isActive ? 'is-active' : '',
        isSelected ? 'is-selected' : ''
      ].filter(Boolean).join(' ');

      g.setAttribute('class', classes);
      g.setAttribute('data-node-id', node.id);
      g.setAttribute('transform', `translate(${node.x}, ${node.y})`);
      g.setAttribute('role', 'button');
      g.setAttribute('tabindex', node.isUnlocked ? '0' : '-1');
      g.setAttribute('aria-label', `${node.number}: ${node.title}`);

      // Generous invisible static hitbox that NEVER shifts or animates
      const hitboxRadius = node.type === 'castle' ? 52 : 36;
      const hitboxMarkup = `<circle cx="0" cy="0" r="${hitboxRadius}" fill="transparent" class="map-node-hitbox" />`;

      const innerContent = node.type === 'castle'
        ? this._getCastleNodeMarkup(node)
        : this._getLessonNodeMarkup(node);

      g.innerHTML = `
        ${hitboxMarkup}
        <g class="map-node-body">
          ${innerContent}
        </g>
      `;

      // Add click / touch handlers
      g.addEventListener('click', (e) => {
        e.stopPropagation();
        this._handleNodeClick(node);
      });

      layer.appendChild(g);
    });
  }

  /**
   * Markup for a 3D physical level token (Gold Coin, Launchpad Platform, or Ancient Stone Tablet).
   * @private
   */
  _getLessonNodeMarkup(node) {
    const isCompleted = node.isCompleted;
    const isUnlocked = node.isUnlocked;
    const isActive = node.isActive;
    const labelText = node.number.split('.')[1] || node.number;

    // Mini Roby Mascot bouncing on active node
    const robyMarker = isActive ? `
      <g class="mario-roby-wrapper mario-roby-marker" transform="translate(0, -32)">
        <image href="assets/mascot/mascot_idle.png" x="-26" y="-36" width="52" height="52" class="mario-roby-sprite" />
        <ellipse cx="0" cy="18" rx="14" ry="4" fill="rgba(0,0,0,0.5)" />
      </g>
    ` : '';

    // 1. NIVEL SUPERADO: Moneda de Oro 3D en relieve con flotación suave
    if (isCompleted) {
      const starCount = Math.max(1, node.stars || 3);
      const starGlyphs = '⭐'.repeat(starCount);

      return `
        <g class="coin-token-3d">
          <!-- Sombra de contacto 3D -->
          <ellipse cx="0" cy="24" rx="22" ry="7" fill="rgba(0,0,0,0.55)" filter="blur(3px)" />

          <!-- Borde estriado exterior de la moneda -->
          <circle cx="0" cy="0" r="23" fill="url(#gold-coin-rim)" filter="url(#mario-node-shadow)" />
          <!-- Bisel de profundidad 3D -->
          <circle cx="0" cy="1" r="21" fill="url(#gold-coin-face)" />
          <!-- Anillo acanalado interior -->
          <circle cx="0" cy="1" r="17.5" fill="none" stroke="#b45309" stroke-width="1.2" stroke-dasharray="2.5 1.5" opacity="0.65" />
          <circle cx="0" cy="1" r="16" fill="url(#gold-coin-face)" />

          <!-- Brillo especular superior -->
          <path d="M -15,-6 A 17 17 0 0 1 15,-6 A 15 13 0 0 0 -15,-6 Z" fill="rgba(255,255,255,0.45)" />

          <!-- Número de nivel en relieve 3D con doble sombra -->
          <text cx="0" y="7" font-family="'Fredoka', 'Nunito', sans-serif" font-weight="900" font-size="14.5" fill="#78350f" text-anchor="middle" dy="1">${labelText}</text>
          <text cx="0" y="6" font-family="'Fredoka', 'Nunito', sans-serif" font-weight="900" font-size="14.5" fill="#ffffff" text-anchor="middle" filter="drop-shadow(0 1px 1px rgba(0,0,0,0.5))">${labelText}</text>

          <!-- Destello de estrella en esquina -->
          <polygon points="12,-12 14,-15 17,-12 14,-9" fill="#ffffff" opacity="0.9" filter="drop-shadow(0 0 2px #fff)" />

          <!-- Estrellas doradas 3D obtenidas -->
          <g class="node-stars" transform="translate(0, 33)">
            <text x="0" y="0" font-size="12" text-anchor="middle" fill="#ffd32a" filter="drop-shadow(0 1px 2px rgba(0,0,0,0.8))">
              ${starGlyphs}
            </text>
          </g>
        </g>
      `;
    }

    // 2. NIVEL ACTUAL: Plataforma de Lanzamiento Holográfica Cian con Ondas de Energía
    if (isActive) {
      return `
        <g class="launchpad-platform-3d">
          <!-- Halo de ondas de energía concéntricas en expansión -->
          <circle cx="0" cy="0" r="34" class="launchpad-energy-ring r1" />
          <circle cx="0" cy="0" r="28" class="launchpad-energy-ring r2" />

          <!-- Base de sombra profunda -->
          <ellipse cx="0" cy="18" rx="28" ry="10" fill="rgba(0,0,0,0.6)" filter="blur(4px)" />

          <!-- Pedestal cilíndrico de la plataforma arcade -->
          <path d="M -24,4 L -24,10 C -24,18 24,18 24,10 L 24,4 Z" fill="#0f172a" stroke="#0284c7" stroke-width="1.5" />

          <!-- Superficie superior con anillo de neón y núcleo de energía -->
          <ellipse cx="0" cy="3" rx="24" ry="14" fill="#0f172a" stroke="url(#portal-outer-ring)" stroke-width="3" filter="url(#portal-cyan-glow)" />
          <ellipse cx="0" cy="3" rx="18" ry="10" fill="url(#portal-core-glow)" />

          <!-- Emisores LED perimetrales luminosos -->
          <circle cx="-16" cy="3" r="2" fill="#67e8f9" filter="drop-shadow(0 0 3px #67e8f9)" />
          <circle cx="16" cy="3" r="2" fill="#67e8f9" filter="drop-shadow(0 0 3px #67e8f9)" />
          <circle cx="0" cy="-7" r="2" fill="#67e8f9" filter="drop-shadow(0 0 3px #67e8f9)" />
          <circle cx="0" cy="13" r="2" fill="#67e8f9" filter="drop-shadow(0 0 3px #67e8f9)" />

          <!-- Número de lección en neón cian -->
          <text cx="0" y="8" font-family="'Fredoka', 'Nunito', sans-serif" font-weight="900" font-size="13.5" fill="#67e8f9" text-anchor="middle" filter="drop-shadow(0 0 4px #00cec9)">${labelText}</text>

          <!-- Roby posado y saltando en la plataforma -->
          ${robyMarker}
        </g>
      `;
    }

    // 3. NIVEL BLOQUEADO: Placa de Piedra Antigua con Candado Dorado en Relieve
    if (!isUnlocked) {
      return `
        <g class="stone-token-3d">
          <!-- Sombra en el terreno -->
          <ellipse cx="0" cy="22" rx="20" ry="6" fill="rgba(0,0,0,0.5)" filter="blur(2px)" />

          <!-- Losa de piedra 3D biselada -->
          <circle cx="0" cy="2" r="21" fill="#0f172a" />
          <circle cx="0" cy="0" r="21" fill="url(#stone-slab-grad)" stroke="#475569" stroke-width="2" filter="url(#mario-node-shadow)" />
          <!-- Hendidura circular interior -->
          <circle cx="0" cy="0" r="17" fill="url(#stone-inner-grad)" stroke="#0f172a" stroke-width="1.5" />

          <!-- Candado dorado en relieve 3D -->
          <path d="M -6,-3 L -6,-8 C -6,-13 6,-13 6,-8 L 6,-3" fill="none" stroke="url(#lock-shackle-grad)" stroke-width="3" stroke-linecap="round" />
          <rect x="-8" y="-3" width="16" height="13" rx="3" fill="url(#lock-body-grad)" stroke="#78350f" stroke-width="1" filter="drop-shadow(0 2px 3px rgba(0,0,0,0.5))" />
          <circle cx="0" cy="2" r="2" fill="#451a03" />
          <polygon points="-1,2 1,2 1.5,6 -1.5,6" fill="#451a03" />
        </g>
      `;
    }

    // 4. NIVEL DESBLOQUEADO (Disponible para jugar): Ficha 3D Turquesa/Cian
    return `
      <g class="unlocked-token-3d">
        <!-- Sombra en el terreno -->
        <ellipse cx="0" cy="22" rx="21" ry="6" fill="rgba(0,0,0,0.5)" filter="blur(2.5px)" />

        <circle cx="0" cy="0" r="22" fill="#00cec9" stroke="#ffffff" stroke-width="3" filter="url(#mario-node-shadow)" />
        <circle cx="0" cy="1" r="17.5" fill="none" stroke="#0984e3" stroke-width="1.5" opacity="0.6" />
        <path d="M -15,-6 A 16 16 0 0 1 15,-6 A 14 12 0 0 0 -15,-6 Z" fill="rgba(255,255,255,0.4)" />
        <text cx="0" y="6" font-family="'Fredoka', 'Nunito', sans-serif" font-weight="900" font-size="15" fill="#ffffff" text-anchor="middle" filter="drop-shadow(0 1px 2px rgba(0,0,0,0.5))">${labelText}</text>
      </g>
    `;
  }

  /**
   * Markup for the final Castle / Fortress Examination node in stylized 3D.
   * @private
   */
  _getCastleNodeMarkup(node) {
    const isCompleted = node.isCompleted;
    const isUnlocked = node.isUnlocked;
    const isActive = node.isActive;

    const robyMarker = isActive ? `
      <g class="mario-roby-wrapper mario-roby-marker" transform="translate(0, -42)">
        <image href="assets/mascot/mascot_idle.png" x="-30" y="-38" width="60" height="60" class="mario-roby-sprite" />
        <ellipse cx="0" cy="22" rx="16" ry="5" fill="rgba(0,0,0,0.55)" />
      </g>
    ` : '';

    return `
      <!-- Halo aura mística del castillo -->
      ${isActive ? '<ellipse cx="0" cy="0" rx="46" ry="38" class="castle-aura-halo" />' : ''}

      <!-- Sombra de la fortaleza en el terreno -->
      <ellipse cx="0" cy="34" rx="42" ry="12" fill="rgba(0,0,0,0.65)" filter="blur(5px)" />

      <!-- Base de roca de la colina del castillo -->
      <path d="M -40,32 Q 0,22 40,32 L 44,40 Q 0,46 -44,40 Z" fill="#1e293b" stroke="#334155" stroke-width="1.5" />

      <!-- Cuerpo principal de muralla de piedra -->
      <rect x="-32" y="-4" width="64" height="34" rx="2" fill="url(#castle-wall-light)" stroke="#1e293b" stroke-width="2" />

      <!-- Líneas de cantería de sillares -->
      <line x1="-32" y1="8" x2="32" y2="8" stroke="#1e293b" stroke-width="1" opacity="0.4" />
      <line x1="-32" y1="20" x2="32" y2="20" stroke="#1e293b" stroke-width="1" opacity="0.4" />
      <line x1="-12" y1="8" x2="-12" y2="20" stroke="#1e293b" stroke-width="1" opacity="0.3" />
      <line x1="12" y1="8" x2="12" y2="20" stroke="#1e293b" stroke-width="1" opacity="0.3" />
      <line x1="0" y1="-4" x2="0" y2="8" stroke="#1e293b" stroke-width="1" opacity="0.3" />

      <!-- Torre Izquierda con almenas -->
      <rect x="-36" y="-18" width="16" height="38" rx="2" fill="url(#castle-wall-light)" stroke="#1e293b" stroke-width="1.8" />
      <!-- Almenas torre izquierda -->
      <path d="M -37,-24 L -37,-18 L -20,-18 L -20,-24 L -23,-24 L -23,-21 L -27,-21 L -27,-24 L -31,-24 L -31,-21 L -34,-21 L -34,-24 Z" fill="#64748b" stroke="#1e293b" stroke-width="1.2" />
      <!-- Mástil y bandera torre izquierda -->
      <line x1="-28" y1="-24" x2="-28" y2="-36" stroke="#d97706" stroke-width="2" />
      <path d="M -28,-36 Q -22,-39 -16,-34 Q -22,-29 -28,-32 Z" class="castle-banner-wave b1" fill="url(#flag-wave-grad)" />

      <!-- Torre Derecha con almenas -->
      <rect x="20" y="-18" width="16" height="38" rx="2" fill="url(#castle-wall-light)" stroke="#1e293b" stroke-width="1.8" />
      <!-- Almenas torre derecha -->
      <path d="M 19,-24 L 19,-18 L 36,-18 L 36,-24 L 33,-24 L 33,-21 L 29,-21 L 29,-24 L 25,-24 L 25,-21 L 22,-21 L 22,-24 Z" fill="#64748b" stroke="#1e293b" stroke-width="1.2" />
      <!-- Mástil y bandera torre derecha -->
      <line x1="28" y1="-24" x2="28" y2="-36" stroke="#d97706" stroke-width="2" />
      <path d="M 28,-36 Q 34,-39 40,-34 Q 34,-29 28,-32 Z" class="castle-banner-wave b2" fill="url(#flag-wave-grad)" />

      <!-- Torre Central Gran Torreón (más alta) -->
      <rect x="-14" y="-28" width="28" height="42" rx="2" fill="url(#castle-wall-light)" stroke="#1e293b" stroke-width="2" />
      <!-- Tejado cónico piramidal imperial de la torre central -->
      <polygon points="0,-46 -17,-28 17,-28" fill="url(#castle-roof-grad)" stroke="#1e1b4b" stroke-width="1.5" />
      <!-- Gran Bandera Real en torre central -->
      <line x1="0" y1="-46" x2="0" y2="-58" stroke="#ffd32a" stroke-width="2.2" />
      <path d="M 0,-58 Q 10,-62 18,-55 Q 10,-48 0,-52 Z" class="castle-banner-wave b-center" fill="url(#flag-wave-grad)" filter="drop-shadow(0 1px 3px rgba(0,0,0,0.6))" />
      <!-- Corona dorada en torre central -->
      <polygon points="-5,-24 -7,-20 -3,-21 0,-26 3,-21 7,-20 5,-24" fill="#ffd32a" stroke="#b45309" stroke-width="0.8" />

      <!-- Portal Arqueado de la Fortaleza -->
      <path d="M -11,30 L -11,14 A 11 11 0 0 1 11,14 L 11,30 Z" fill="#090d16" stroke="#1e293b" stroke-width="2" />
      <!-- Fuego mágico / Luz interior cálida del portal -->
      <path d="M -9,30 L -9,15 A 9 9 0 0 1 9,15 L 9,30 Z" fill="url(#castle-portal-fire)" opacity="${isUnlocked ? '0.9' : '0.2'}" />
      <!-- Verja levadiza medieval dorada -->
      <line x1="-9" y1="18" x2="9" y2="18" stroke="#d97706" stroke-width="1.2" />
      <line x1="-9" y1="23" x2="9" y2="23" stroke="#d97706" stroke-width="1.2" />
      <line x1="-5" y1="14" x2="-5" y2="30" stroke="#d97706" stroke-width="1.2" />
      <line x1="0" y1="12" x2="0" y2="30" stroke="#d97706" stroke-width="1.2" />
      <line x1="5" y1="14" x2="5" y2="30" stroke="#d97706" stroke-width="1.2" />

      <!-- Ventanillas de tiro iluminadas en torres -->
      <rect x="-30" y="-10" width="4" height="10" rx="2" fill="${isUnlocked ? '#ffd32a' : '#0f172a'}" />
      <rect x="26" y="-10" width="4" height="10" rx="2" fill="${isUnlocked ? '#ffd32a' : '#0f172a'}" />

      <!-- Placa de texto Examen / Corona final -->
      <g transform="translate(0, 39)">
        <rect x="-32" y="-7" width="64" height="16" rx="7" fill="${isCompleted ? '#f59e0b' : (isUnlocked ? '#6366f1' : '#334155')}" stroke="#ffffff" stroke-width="1.5" filter="drop-shadow(0 2px 4px rgba(0,0,0,0.6))" />
        <text x="0" y="5" font-family="'Fredoka', 'Nunito', sans-serif" font-weight="900" font-size="9.5" fill="#ffffff" text-anchor="middle">
          ${isCompleted ? '👑 SUPERADO' : (isUnlocked ? '🏰 EXAMEN' : '🔒 BLOQUEADO')}
        </text>
      </g>

      <!-- Roby saltando en el castillo si está activo -->
      ${robyMarker}
    `;
  }

  /**
   * Catmull-Rom cubic Bézier spline calculation connecting points smoothly.
   * @private
   */
  _generateSplinePath(pts) {
    if (!pts || pts.length < 2) return '';
    let d = `M ${pts[0].x},${pts[0].y}`;

    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = i > 0 ? pts[i - 1] : pts[i];
      const p1 = pts[i];
      const p2 = pts[i + 1];
      const p3 = i < pts.length - 2 ? pts[i + 2] : p2;

      const cp1x = Math.round(p1.x + (p2.x - p0.x) / 6);
      const cp1y = Math.round(p1.y + (p2.y - p0.y) / 6);
      const cp2x = Math.round(p2.x - (p3.x - p1.x) / 6);
      const cp2y = Math.round(p2.y - (p3.y - p1.y) / 6);

      d += ` C ${cp1x},${cp1y} ${cp2x},${cp2y} ${p2.x},${p2.y}`;
    }
    return d;
  }

  /**
   * Handles user clicking a node on the map.
   * @private
   */
  _handleNodeClick(node) {
    if (!node.isUnlocked) {
      if (this.audio) this.audio.playLockedShake();
      this._flashLockedNotice(
        node.type === 'castle'
          ? `🔒 ¡Debes completar las 15 lecciones del Mundo ${node.worldId} para retar el Castillo!`
          : `🔒 ¡Completa la lección anterior para desbloquear el camino a la lección ${node.number}!`
      );
      return;
    }

    if (this.audio) this.audio.playMapNodeSelect();

    // If already selected, double clicking directly launches!
    if (this.selectedNodeId === node.id) {
      this._launchCurrentSelection();
      return;
    }

    this.selectedNodeId = node.id;
    this._drawNodes();
    this._updateCourseCard();
  }

  /**
   * Steps through nodes with keyboard arrows.
   * @private
   */
  _stepNodeSelection(delta) {
    if (!this.nodes.length) return;
    const curIdx = this.nodes.findIndex(n => n.id === this.selectedNodeId);
    let nextIdx = curIdx + delta;
    if (nextIdx < 0) nextIdx = 0;
    if (nextIdx >= this.nodes.length) nextIdx = this.nodes.length - 1;

    const target = this.nodes[nextIdx];
    if (target) {
      this.selectedNodeId = target.id;
      this._drawNodes();
      this._updateCourseCard();
      if (this.audio) this.audio.playButtonClick();
    }
  }

  /**
   * Updates the Course Preview Card at the bottom.
   * @private
   */
  _updateCourseCard() {
    const card = this._modalEl.querySelector('#map-course-card');
    if (!card) return;

    const node = this.nodes.find(n => n.id === this.selectedNodeId) || this.nodes[0];
    if (!node) return;

    const badgeEl = card.querySelector('#course-badge');
    const titleEl = card.querySelector('#course-title');
    const descEl = card.querySelector('#course-desc');
    const keysRow = card.querySelector('#course-keys-row');
    const starsRow = card.querySelector('#course-stars-rating');
    const launchBtn = card.querySelector('#course-launch-btn');

    if (badgeEl) badgeEl.textContent = node.type === 'castle' ? '🏰' : node.number;
    if (titleEl) titleEl.textContent = node.title;
    if (descEl) descEl.textContent = node.tip || (node.isUnlocked ? '¡Pulsa para jugar y ganar estrellas!' : 'Bloqueado');

    // Target keys chips
    if (keysRow) {
      keysRow.innerHTML = '';
      const sampleWords = node.words && node.words[0] ? node.words[0].text : '';
      const uniqueKeys = Array.from(new Set(sampleWords.toUpperCase().replace(/\s+/g, '').split(''))).slice(0, 4);
      if (uniqueKeys.length > 0) {
        uniqueKeys.forEach(k => {
          const chip = document.createElement('span');
          chip.className = 'course-key-chip';
          chip.textContent = k;
          keysRow.appendChild(chip);
        });
      } else {
        const chip = document.createElement('span');
        chip.className = 'course-key-chip';
        chip.textContent = node.type === 'castle' ? 'EXAMEN' : 'TECLADO';
        keysRow.appendChild(chip);
      }
    }

    // Stars
    if (starsRow) {
      const s = Math.max(0, node.stars || (node.isCompleted ? 3 : 0));
      starsRow.innerHTML = `
        <span class="${s >= 1 ? 'star-on' : 'star-off'}">⭐</span>
        <span class="${s >= 2 ? 'star-on' : 'star-off'}">⭐</span>
        <span class="${s >= 3 ? 'star-on' : 'star-off'}">⭐</span>
      `;
    }

    // Launch button
    if (launchBtn) {
      if (node.isUnlocked) {
        launchBtn.disabled = false;
        launchBtn.className = 'pulse-button course-launch-btn';
        launchBtn.textContent = node.type === 'castle' ? '¡Entrar al Castillo! 🏰' : '¡Jugar Lección! 🚀';
      } else {
        launchBtn.disabled = true;
        launchBtn.className = 'course-launch-btn is-disabled';
        launchBtn.textContent = '🔒 Bloqueado';
      }
    }
  }

  /**
   * Launches the currently selected level or exam and smoothly closes the map.
   * @private
   */
  _launchCurrentSelection() {
    const node = this.nodes.find(n => n.id === this.selectedNodeId);
    if (!node || !node.isUnlocked) return;

    if (this.audio) this.audio.playMapNodeSelect();

    // Trigger zoom animation
    const dialog = this._modalEl.querySelector('#adventure-map-dialog');
    if (dialog) {
      dialog.classList.add('map-zooming-into-node');
    }

    setTimeout(() => {
      this.close();
      if (dialog) dialog.classList.remove('map-zooming-into-node');

      if (node.type === 'castle') {
        this.onSelectExam(node.worldId);
      } else {
        this.onSelectLesson(node.worldId, node.id);
      }
    }, 280);
  }

  /**
   * Flashes a temporary notification when clicking a locked node.
   * @private
   */
  _flashLockedNotice(text) {
    const descEl = this._modalEl.querySelector('#course-desc');
    if (!descEl) return;
    const old = descEl.textContent;
    descEl.textContent = text;
    descEl.classList.add('desc-locked-alert');
    setTimeout(() => {
      descEl.textContent = old;
      descEl.classList.remove('desc-locked-alert');
    }, 3200);
  }

  /**
   * Helper to retrieve highest unlocked level ID.
   * @private
   */
  _getHighestUnlockedLevel() {
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
}
