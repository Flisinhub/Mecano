/**
 * AccessorySocket.js - Dynamic Mascot Customization & Wardrobe Socket System
 * 
 * Features:
 * 1. Normalized anchor positions for head, eyes, and neck sockets.
 * 2. Star-based progression unlocks (3 to 24 stars).
 * 3. Bidirectional slot alias normalization ('head' <-> 'hat', 'eyes' <-> 'glasses', 'neck' <-> 'crown').
 * 4. Procedural SVG/CSS visuals for hats, glasses, and royal crown.
 * 5. Full integration with StorageManager and persistence fallback.
 * 
 * Works in browser DOM and in headless Node.js environments.
 */

export const MASCOT_SOCKETS = Object.freeze({
  head: Object.freeze({
    id: 'head',
    alias: 'hat',
    top: '7%',
    left: '50%',
    transform: 'translate(-50%, -100%)',
    zIndex: 15
  }),
  eyes: Object.freeze({
    id: 'eyes',
    alias: 'glasses',
    top: '39%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    zIndex: 20
  }),
  neck: Object.freeze({
    id: 'neck',
    alias: 'crown',
    top: '74%',
    left: '50%',
    transform: 'translate(-50%, 0)',
    zIndex: 10
  })
});

export const ACCESSORY_CATALOG = Object.freeze([
  {
    id: 'hat-cap',
    slot: 'head',
    name: 'Gorra de Aventurero',
    starsRequired: 3,
    icon: '🧢',
    description: 'Gorra deportiva roja y blanca colocada hacia atrás.',
    svg: `<svg viewBox="0 0 100 60" width="100" height="60" class="acc-svg-cap">
      <ellipse cx="50" cy="40" rx="42" ry="18" fill="#e74c3c" />
      <path d="M 12 38 Q 50 10 88 38 Z" fill="#c0392b" />
      <ellipse cx="50" cy="18" rx="8" ry="4" fill="#ffffff" />
      <path d="M 65 38 C 75 42, 95 48, 98 42 C 92 36, 80 34, 65 38 Z" fill="#ffffff" />
    </svg>`
  },
  {
    id: 'glasses-nerd',
    slot: 'eyes',
    name: 'Gafas de Búho Sabio',
    starsRequired: 6,
    icon: '👓',
    description: 'Grandes lentes redondos de estudiante sabio.',
    svg: `<svg viewBox="0 0 120 50" width="120" height="50" class="acc-svg-nerd">
      <circle cx="32" cy="25" r="20" fill="rgba(255,255,255,0.3)" stroke="#2c3e50" stroke-width="5" />
      <circle cx="88" cy="25" r="20" fill="rgba(255,255,255,0.3)" stroke="#2c3e50" stroke-width="5" />
      <line x1="52" y1="25" x2="68" y2="25" stroke="#2c3e50" stroke-width="5" />
      <ellipse cx="26" cy="18" rx="6" ry="3" fill="#ffffff" opacity="0.8" />
      <ellipse cx="82" cy="18" rx="6" ry="3" fill="#ffffff" opacity="0.8" />
    </svg>`
  },
  {
    id: 'hat-wizard',
    slot: 'head',
    name: 'Sombrero de Mago',
    starsRequired: 10,
    icon: '🧙',
    description: 'Sombrero puntiagudo azul noche con estrellas mágicas.',
    svg: `<svg viewBox="0 0 120 100" width="120" height="100" class="acc-svg-wizard">
      <ellipse cx="60" cy="88" rx="55" ry="12" fill="#2c3e50" />
      <path d="M 18 86 Q 40 50 55 12 Q 68 50 102 86 Z" fill="#34495e" />
      <path d="M 28 85 Q 60 78 92 85" stroke="#f1c40f" stroke-width="8" fill="none" />
      <polygon points="56,35 58,40 63,40 59,43 61,48 56,45 52,48 54,43 50,40 55,40" fill="#f1c40f" />
      <polygon points="42,55 43,58 47,58 44,60 45,64 42,62 39,64 40,60 37,58 41,58" fill="#f1c40f" />
    </svg>`
  },
  {
    id: 'glasses-star',
    slot: 'eyes',
    name: 'Gafas Pop Estelares',
    starsRequired: 15,
    icon: '⭐',
    description: 'Gafas de sol con forma de estrella brillante.',
    svg: `<svg viewBox="0 0 130 55" width="130" height="55" class="acc-svg-star">
      <polygon points="35,5 42,20 58,20 45,30 50,46 35,36 20,46 25,30 12,20 28,20" fill="#f39c12" stroke="#d35400" stroke-width="2" />
      <polygon points="95,5 102,20 118,20 105,30 110,46 95,36 80,46 85,30 72,20 88,20" fill="#f39c12" stroke="#d35400" stroke-width="2" />
      <line x1="58" y1="24" x2="72" y2="24" stroke="#d35400" stroke-width="4" />
      <circle cx="35" cy="25" r="7" fill="rgba(255,255,255,0.7)" />
      <circle cx="95" cy="25" r="7" fill="rgba(255,255,255,0.7)" />
    </svg>`
  },
  {
    id: 'glasses-cool',
    slot: 'eyes',
    name: 'Gafas de Sol Pixel',
    starsRequired: 20,
    icon: '🕶️',
    description: 'Gafas oscuras estilo retro gamer.',
    svg: `<svg viewBox="0 0 120 40" width="120" height="40" class="acc-svg-cool">
      <rect x="15" y="10" width="40" height="24" rx="4" fill="#111111" />
      <rect x="65" y="10" width="40" height="24" rx="4" fill="#111111" />
      <rect x="52" y="14" width="16" height="6" fill="#111111" />
      <line x1="20" y1="14" x2="32" y2="30" stroke="#ffffff" stroke-width="3" opacity="0.6" />
      <line x1="70" y1="14" x2="82" y2="30" stroke="#ffffff" stroke-width="3" opacity="0.6" />
    </svg>`
  },
  {
    id: 'crown-gold',
    slot: 'head',
    name: 'Corona de Gran Maestro',
    starsRequired: 24,
    icon: '👑',
    description: 'Corona real dorada forjada con rubíes y esmeraldas.',
    svg: `<svg viewBox="0 0 120 70" width="120" height="70" class="acc-svg-crown">
      <path d="M 15 60 L 105 60 L 100 20 L 78 40 L 60 12 L 42 40 L 20 20 Z" fill="#f1c40f" stroke="#d68910" stroke-width="3" />
      <circle cx="60" cy="12" r="5" fill="#e74c3c" />
      <circle cx="20" cy="20" r="4" fill="#2ecc71" />
      <circle cx="100" cy="20" r="4" fill="#2ecc71" />
      <rect x="22" y="52" width="76" height="8" rx="2" fill="#d68910" />
      <circle cx="60" cy="56" r="3" fill="#e74c3c" />
      <circle cx="42" cy="56" r="2.5" fill="#3498db" />
      <circle cx="78" cy="56" r="2.5" fill="#3498db" />
    </svg>`
  }
]);

export class AccessorySocket {
  /**
   * @param {Object} [options]
   * @param {Object} [options.storageManager=null] StorageManager instance
   * @param {HTMLElement} [options.container=null] Mascot container DOM element
   */
  constructor(options = {}) {
    this.storageManager = options.storageManager || null;
    this.container = options.container || null;

    // Fallback internal storage if storageManager not supplied
    this._fallbackStore = {
      unlocked: [],
      equipped: {
        head: null,
        eyes: null,
        neck: null,
        hat: null,
        glasses: null,
        crown: null
      }
    };

    // DOM socket elements map
    this._socketElements = new Map();

    if (this.container && typeof document !== 'undefined') {
      this.renderSockets(this.container);
    }
  }

  /**
   * Normalize slot name across aliases ('hat' <-> 'head', 'glasses' <-> 'eyes', 'crown' <-> 'neck').
   * @param {string} slot
   * @returns {string} Standard socket id: 'head', 'eyes', or 'neck'
   */
  normalizeSlot(slot) {
    if (!slot) return 'head';
    const s = String(slot).toLowerCase().trim();
    if (s === 'hat' || s === 'head') return 'head';
    if (s === 'glasses' || s === 'eyes') return 'eyes';
    if (s === 'crown' || s === 'neck') return 'neck';
    return s;
  }

  /**
   * Get storage slot alias ('head' -> 'hat', 'eyes' -> 'glasses', 'neck' -> 'crown').
   * @param {string} slot
   * @returns {string}
   */
  getStorageSlot(slot) {
    const norm = this.normalizeSlot(slot);
    if (norm === 'head') return 'hat';
    if (norm === 'eyes') return 'glasses';
    if (norm === 'neck') return 'crown';
    return norm;
  }

  /**
   * Find accessory definition in catalog by ID.
   * @param {string} id
   * @returns {Object|null}
   */
  getAccessory(id) {
    return ACCESSORY_CATALOG.find((acc) => acc.id === id) || null;
  }

  /**
   * Return full accessory catalog.
   * @returns {Object[]}
   */
  getAllAccessories() {
    return [...ACCESSORY_CATALOG];
  }

  /**
   * Return all accessories compatible with a socket slot.
   * @param {string} slot
   * @returns {Object[]}
   */
  getAccessoriesForSlot(slot) {
    const norm = this.normalizeSlot(slot);
    return ACCESSORY_CATALOG.filter((acc) => this.normalizeSlot(acc.slot) === norm);
  }

  /**
   * Check whether an accessory is currently unlocked.
   * @param {string} id
   * @returns {boolean}
   */
  isUnlocked(id) {
    if (this.storageManager && typeof this.storageManager.isAccessoryUnlocked === 'function') {
      return this.storageManager.isAccessoryUnlocked(id);
    }
    if (this.storageManager && typeof this.storageManager.getUnlockedAccessories === 'function') {
      return this.storageManager.getUnlockedAccessories().includes(id);
    }
    return this._fallbackStore.unlocked.includes(id);
  }

  /**
   * Check if player has sufficient stars to unlock the item.
   * @param {string} id
   * @param {number} [totalStars] Optional stars count (queried from storageManager if omitted)
   * @returns {boolean}
   */
  canUnlock(id, totalStars) {
    const acc = this.getAccessory(id);
    if (!acc) return false;
    if (this.isUnlocked(id)) return false;

    let stars = totalStars;
    if (typeof stars !== 'number' && this.storageManager && typeof this.storageManager.getTotalStars === 'function') {
      stars = this.storageManager.getTotalStars();
    }
    const currentStars = Number(stars) || 0;
    return currentStars >= acc.starsRequired;
  }

  /**
   * Unlock an accessory.
   * @param {string} id
   * @param {number} [totalStars]
   * @returns {{ success: boolean, reason?: string }}
   */
  unlock(id, totalStars) {
    const acc = this.getAccessory(id);
    if (!acc) {
      return { success: false, reason: 'Accesorios no encontrados' };
    }
    if (this.isUnlocked(id)) {
      return { success: false, reason: 'Ya desbloqueado' };
    }
    if (!this.canUnlock(id, totalStars)) {
      return { success: false, reason: `Requiere ${acc.starsRequired} estrellas` };
    }

    if (this.storageManager && typeof this.storageManager.unlockAccessory === 'function') {
      this.storageManager.unlockAccessory(id);
    } else {
      this._fallbackStore.unlocked.push(id);
    }

    return { success: true };
  }

  /**
   * Equip an accessory in a designated slot.
   * @param {string} slot 'head' | 'eyes' | 'neck' | 'hat' | 'glasses' | 'crown'
   * @param {string|null} id Accessory ID to equip, or null to unequip
   * @returns {boolean} True if successfully equipped
   */
  equip(slot, id) {
    const norm = this.normalizeSlot(slot);
    const storageKey = this.getStorageSlot(slot);

    if (id === null || id === '') {
      return this.unequip(norm);
    }

    const acc = this.getAccessory(id);
    if (!acc) return false;

    // Validate slot compatibility
    if (this.normalizeSlot(acc.slot) !== norm) {
      console.warn(`[AccessorySocket] Accessory "${id}" (${acc.slot}) not compatible with slot "${norm}"`);
      return false;
    }

    // Persist to storageManager if available
    if (this.storageManager && typeof this.storageManager.equipAccessory === 'function') {
      this.storageManager.equipAccessory(storageKey, id);
    }

    // Update fallback store for both slot variants
    this._fallbackStore.equipped[norm] = id;
    this._fallbackStore.equipped[storageKey] = id;
    if (!this._fallbackStore.unlocked.includes(id)) {
      this._fallbackStore.unlocked.push(id);
    }

    this.updateEquippedVisuals();
    return true;
  }

  /**
   * Unequip accessory from a slot.
   * @param {string} slot
   * @returns {boolean}
   */
  unequip(slot) {
    const norm = this.normalizeSlot(slot);
    const storageKey = this.getStorageSlot(slot);

    if (this.storageManager && typeof this.storageManager.equipAccessory === 'function') {
      this.storageManager.equipAccessory(storageKey, null);
    }

    this._fallbackStore.equipped[norm] = null;
    this._fallbackStore.equipped[storageKey] = null;

    this.updateEquippedVisuals();
    return true;
  }

  /**
   * Get equipped accessory ID for a slot.
   * @param {string} slot
   * @returns {string|null}
   */
  getEquipped(slot) {
    const norm = this.normalizeSlot(slot);
    const storageKey = this.getStorageSlot(slot);

    if (this.storageManager && typeof this.storageManager.getEquippedAccessories === 'function') {
      const equipped = this.storageManager.getEquippedAccessories();
      return equipped[storageKey] || equipped[norm] || null;
    }

    return this._fallbackStore.equipped[norm] || this._fallbackStore.equipped[storageKey] || null;
  }

  /**
   * Get all currently equipped accessories across all slots.
   * @returns {{ head: string|null, eyes: string|null, neck: string|null }}
   */
  getAllEquipped() {
    return {
      head: this.getEquipped('head'),
      eyes: this.getEquipped('eyes'),
      neck: this.getEquipped('neck')
    };
  }

  /**
   * Build and mount socket container elements into mascot DOM container.
   * @param {HTMLElement} container
   */
  renderSockets(container) {
    if (!container || typeof document === 'undefined') return;
    this.container = container;

    // Clear previous sockets
    this._socketElements.forEach((el) => {
      if (el && el.parentNode) el.parentNode.removeChild(el);
    });
    this._socketElements.clear();

    // Create a socket element for each normalized anchor
    for (const [key, cfg] of Object.entries(MASCOT_SOCKETS)) {
      const socketEl = document.createElement('div');
      socketEl.className = `accessory-socket socket-${key}`;
      socketEl.style.position = 'absolute';
      socketEl.style.top = cfg.top;
      socketEl.style.left = cfg.left;
      socketEl.style.transform = cfg.transform;
      socketEl.style.zIndex = String(cfg.zIndex);
      socketEl.style.pointerEvents = 'none';

      container.appendChild(socketEl);
      this._socketElements.set(key, socketEl);
    }

    this.updateEquippedVisuals();
  }

  /**
   * Refresh visual DOM elements of equipped accessories.
   */
  updateEquippedVisuals() {
    if (this._socketElements.size === 0 || typeof document === 'undefined') return;

    for (const [slotKey, socketEl] of this._socketElements.entries()) {
      socketEl.innerHTML = '';
      const equippedId = this.getEquipped(slotKey);
      if (!equippedId) continue;

      const acc = this.getAccessory(equippedId);
      if (!acc) continue;

      const itemEl = document.createElement('div');
      itemEl.className = `accessory-item accessory-${acc.id}`;
      itemEl.innerHTML = acc.svg || acc.icon;
      socketEl.appendChild(itemEl);
    }
  }

  /**
   * Teardown sockets and clean up references.
   */
  destroy() {
    this._socketElements.forEach((el) => {
      if (el && el.parentNode) el.parentNode.removeChild(el);
    });
    this._socketElements.clear();
    this.container = null;
    this.storageManager = null;
  }
}
