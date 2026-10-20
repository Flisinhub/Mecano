/**
 * SpeechBubble.js - Comic-Style Dialogue Bubble & Pedagogical Key Highlighter
 * 
 * Features:
 * 1. Comic balloon styling with triangular tail pointed toward Roby.
 * 2. Automatic parsing and pedagogical coloring of key tokens like [F], [J], [Espacio].
 * 3. Typewriter character-reveal effect with tag-safe parsing and skip support.
 * 4. Responsive emotions (happy, thinking, error, victory, sleepy).
 * 5. EventBus integration for MASCOT_SPEAK_REQUEST.
 * 
 * Safe for browser DOM and headless Node.js environments.
 */

// Finger pedagogical colors conforming to R4 / PROJECT.md
export const FINGER_COLORS = Object.freeze({
  'lp': '#ff6b81',  // Left Pinky: Coral / Soft Red
  'lr': '#ff9f43',  // Left Ring: Warm Orange
  'lm': '#ffd32a',  // Left Middle: Sun Yellow
  'li': '#2ed573',  // Left Index: Mint Green
  'ri': '#00d2d3',  // Right Index: Sky Blue
  'rm': '#ffd32a',  // Right Middle: Sun Yellow
  'rr': '#ff9f43',  // Right Ring: Warm Orange
  'rp': '#a29bfe',  // Right Pinky: Magic Violet / Lilac
  'thumb': '#9b59b6' // Thumbs: Cosmic Purple
});

// Map key character to finger ID
export const KEY_TO_FINGER_MAP = Object.freeze({
  // Left Hand
  'q': 'lp', 'a': 'lp', 'z': 'lp', '1': 'lp',
  'w': 'lr', 's': 'lr', 'x': 'lr', '2': 'lr',
  'e': 'lm', 'd': 'lm', 'c': 'lm', '3': 'lm',
  'r': 'li', 'f': 'li', 'v': 'li', 't': 'li', 'g': 'li', 'b': 'li', '4': 'li', '5': 'li',

  // Right Hand
  'y': 'ri', 'h': 'ri', 'n': 'ri', 'u': 'ri', 'j': 'ri', 'm': 'ri', '6': 'ri', '7': 'ri',
  'i': 'rm', 'k': 'rm', ',': 'rm', '8': 'rm',
  'o': 'rr', 'l': 'rr', '.': 'rr', '9': 'rr',
  'p': 'rp', 'ñ': 'rp', '-': 'rp', '0': 'rp', '´': 'rp', 'á': 'rp', 'é': 'rp', 'í': 'rp', 'ó': 'rp', 'ú': 'rp',

  // Thumbs
  ' ': 'thumb', 'space': 'thumb', 'espacio': 'thumb', 'spacebar': 'thumb'
});

/**
 * Get pedagogical finger identifier for any key character.
 * @param {string} key
 * @returns {string} finger ID (e.g. 'li', 'ri', 'thumb')
 */
export function getFingerForKey(key) {
  if (!key) return 'thumb';
  const str = String(key);
  if (str === ' ' || str.toLowerCase() === 'space' || str.toLowerCase() === 'espacio' || str.toLowerCase() === 'spacebar') {
    return 'thumb';
  }
  const clean = str.toLowerCase().trim();
  if (!clean) return 'thumb';
  return KEY_TO_FINGER_MAP[clean] || 'li';
}

/**
 * Get color hex code for a key.
 * @param {string} key
 * @returns {string} Hex color string
 */
export function getKeyColor(key) {
  const finger = getFingerForKey(key);
  return FINGER_COLORS[finger] || '#2ed573';
}

/**
 * Transform text tokens like [F] or [Espacio] into pedagogical HTML badges.
 * @param {string} rawText
 * @returns {string} HTML string with pedagogical key styling
 */
export function formatDialogueText(rawText) {
  if (!rawText || typeof rawText !== 'string') return '';

  return rawText.replace(/\[([^\]]+)\]/g, (_match, token) => {
    const finger = getFingerForKey(token);
    const color = FINGER_COLORS[finger] || '#2ed573';
    const displayKey = token.toUpperCase();
    return `<span class="bubble-key-highlight finger-${finger}" data-finger="${finger}" style="background-color: ${color}; color: #ffffff; padding: 2px 7px; border-radius: 6px; font-weight: bold; display: inline-block; box-shadow: 0 2px 5px rgba(0,0,0,0.2); margin: 0 2px;">${displayKey}</span>`;
  });
}

export class SpeechBubble {
  /**
   * @param {Object} [options]
   * @param {HTMLElement} [options.container=null] Parent DOM element to mount the speech bubble
   * @param {Object} [options.eventBus=null] EventBus instance
   * @param {number} [options.charDelayMs=22] Typing interval in milliseconds per character
   * @param {number} [options.autoHideDelayMs=5000] Time to remain visible after typing finishes
   */
  constructor(options = {}) {
    this.container = options.container || null;
    this.eventBus = options.eventBus || null;
    this.charDelayMs = options.charDelayMs || 22;
    this.autoHideDelayMs = options.autoHideDelayMs || 5000;

    // State
    this.rawText = '';
    this.formattedHtml = '';
    this._isVisible = false;
    this._isTyping = false;
    this._currentEmotion = 'happy';

    // Typewriter tokens
    this._tokens = [];
    this._currentTokenIndex = 0;
    this._typewriterInterval = null;
    this._autoHideTimer = null;
    this._unsubscribers = [];

    // DOM Elements
    this.bubbleElement = null;
    this.contentElement = null;

    if (typeof document !== 'undefined') {
      this._buildDOM();
    }

    if (this.eventBus) {
      this._setupListeners();
    }
  }

  /**
   * Create DOM elements for the comic speech bubble if document is available.
   * @private
   */
  _buildDOM() {
    if (typeof document === 'undefined') return;

    this.bubbleElement = document.createElement('div');
    this.bubbleElement.className = 'mascot-speech-bubble comic-bubble bubble-hidden';
    this.bubbleElement.setAttribute('role', 'status');
    this.bubbleElement.setAttribute('aria-live', 'polite');

    this.contentElement = document.createElement('div');
    this.contentElement.className = 'bubble-content';

    const tailElement = document.createElement('div');
    tailElement.className = 'bubble-tail';

    this.bubbleElement.appendChild(this.contentElement);
    this.bubbleElement.appendChild(tailElement);

    // Clicking bubble instantly skips typing
    this.bubbleElement.addEventListener('click', () => this.skip());

    if (this.container) {
      this.container.appendChild(this.bubbleElement);
    }
  }

  /**
   * Mount bubble into target container.
   * @param {HTMLElement} container
   */
  mount(container) {
    this.container = container;
    if (this.bubbleElement && this.container && !this.container.contains(this.bubbleElement)) {
      this.container.appendChild(this.bubbleElement);
    }
  }

  /**
   * Setup EventBus subscription for MASCOT_SPEAK_REQUEST.
   * @private
   */
  _setupListeners() {
    if (!this.eventBus || typeof this.eventBus.on !== 'function') return;

    const unsub = this.eventBus.on('MASCOT_SPEAK_REQUEST', (payload) => {
      if (payload && payload.text) {
        this.show(payload.text, {
          emotion: payload.emotion || 'happy',
          priority: payload.priority || 'normal'
        });
      }
    });
    this._unsubscribers.push(unsub);

    // Stop typewriter immediately when player strikes correct key
    const unsubSuccess = this.eventBus.on('KEY_PRESSED_SUCCESS', () => {
      this.stopTypewriter();
    });
    this._unsubscribers.push(unsubSuccess);
  }

  /**
   * Split formatted HTML string into tag-safe typewriter tokens.
   * HTML tags are preserved as complete atomic units.
   * @param {string} html
   * @returns {string[]}
   */
  tokenize(html) {
    const tokens = [];
    let i = 0;
    while (i < html.length) {
      if (html[i] === '<') {
        // Find closing tag bracket
        const endTag = html.indexOf('>', i);
        if (endTag !== -1) {
          tokens.push(html.slice(i, endTag + 1));
          i = endTag + 1;
          continue;
        }
      }
      tokens.push(html[i]);
      i++;
    }
    return tokens;
  }

  /**
   * Show speech bubble with typewriter effect and key highlighting.
   * @param {string} text
   * @param {Object} [options]
   * @param {string} [options.emotion='happy'] Emotion style
   * @param {number} [options.charDelayMs] Custom typewriter delay
   * @param {boolean} [options.immediate=false] If true, skips typewriter
   */
  show(text, options = {}) {
    this.stopTypewriter();
    this.rawText = String(text || '');
    this.formattedHtml = formatDialogueText(this.rawText);
    this._currentEmotion = options.emotion || 'happy';
    const delay = options.charDelayMs !== undefined ? options.charDelayMs : this.charDelayMs;

    this._isVisible = true;

    // Update DOM class for emotion
    if (this.bubbleElement) {
      this.bubbleElement.className = `mascot-speech-bubble comic-bubble bubble-emotion-${this._currentEmotion}`;
    }

    if (options.immediate) {
      this.skip();
      return;
    }

    // Start tag-safe typewriter reveal
    this._tokens = this.tokenize(this.formattedHtml);
    this._currentTokenIndex = 0;
    this._isTyping = true;

    let buffer = '';
    if (this.contentElement) {
      this.contentElement.innerHTML = '';
    }

    if (typeof setInterval === 'function') {
      this._typewriterInterval = setInterval(() => {
        if (this._currentTokenIndex >= this._tokens.length) {
          this._finishTypewriter();
          return;
        }

        // Advance through any HTML tags immediately
        while (
          this._currentTokenIndex < this._tokens.length &&
          this._tokens[this._currentTokenIndex].startsWith('<')
        ) {
          buffer += this._tokens[this._currentTokenIndex];
          this._currentTokenIndex++;
        }

        if (this._currentTokenIndex < this._tokens.length) {
          buffer += this._tokens[this._currentTokenIndex];
          this._currentTokenIndex++;
        }

        if (this.contentElement) {
          this.contentElement.innerHTML = buffer;
        }
      }, delay);
    } else {
      // Headless / immediate fallback
      this.skip();
    }
  }

  /**
   * Complete typewriter immediately, revealing full text.
   */
  skip() {
    this.stopTypewriter();
    this._isTyping = false;
    if (this.contentElement) {
      this.contentElement.innerHTML = this.formattedHtml;
    }
    this._scheduleAutoHide();
  }

  /**
   * Called internally when typewriter naturally reaches end.
   * @private
   */
  _finishTypewriter() {
    this.stopTypewriter();
    this._isTyping = false;
    if (this.contentElement) {
      this.contentElement.innerHTML = this.formattedHtml;
    }
    this._scheduleAutoHide();
  }

  /**
   * Stop active typewriter interval.
   */
  stopTypewriter() {
    if (this._typewriterInterval) {
      clearInterval(this._typewriterInterval);
      this._typewriterInterval = null;
    }
    if (this._autoHideTimer) {
      clearTimeout(this._autoHideTimer);
      this._autoHideTimer = null;
    }
  }

  /**
   * Schedule automatic hide after configured timeout.
   * @private
   */
  _scheduleAutoHide() {
    if (this.autoHideDelayMs > 0 && typeof setTimeout === 'function') {
      this._autoHideTimer = setTimeout(() => {
        this.hide();
      }, this.autoHideDelayMs);
    }
  }

  /**
   * Hide the speech bubble.
   */
  hide() {
    this.stopTypewriter();
    this._isVisible = false;
    this._isTyping = false;

    if (this.bubbleElement) {
      this.bubbleElement.classList.add('bubble-hidden');
    }
  }

  /**
   * Clear content and hide bubble.
   */
  clear() {
    this.hide();
    this.rawText = '';
    this.formattedHtml = '';
    if (this.contentElement) {
      this.contentElement.innerHTML = '';
    }
  }

  /**
   * Check if bubble is currently visible.
   * @returns {boolean}
   */
  isVisible() {
    return this._isVisible;
  }

  /**
   * Check if bubble is actively typing text.
   * @returns {boolean}
   */
  isTyping() {
    return this._isTyping;
  }

  /**
   * Get current raw dialogue text.
   * @returns {string}
   */
  getText() {
    return this.rawText;
  }

  /**
   * Get current formatted HTML string.
   * @returns {string}
   */
  getFormattedHtml() {
    return this.formattedHtml;
  }

  /**
   * Teardown and cleanup.
   */
  destroy() {
    this.stopTypewriter();
    for (const unsub of this._unsubscribers) {
      if (typeof unsub === 'function') unsub();
    }
    this._unsubscribers = [];

    if (this.bubbleElement && this.bubbleElement.parentNode) {
      this.bubbleElement.parentNode.removeChild(this.bubbleElement);
    }
    this.bubbleElement = null;
    this.contentElement = null;
  }
}
