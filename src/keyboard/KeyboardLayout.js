/**
 * KeyboardLayout.js - Spanish Standard QWERTY Layout Definitions & Pedagogical Color Mappings
 * 
 * Fulfills Requirement R4 and PROJECT.md specifications:
 * - Pinkies (Q, A, Z / P, Ñ, -): Coral / Soft Red (#ff6b81)
 * - Ring (W, S, X / O, L, .): Warm Orange (#ff9f43)
 * - Middle (E, D, C / I, K, ,): Sun Yellow (#ffd32a)
 * - Left Index (R, F, V, T, G, B): Mint Green (#2ed573)
 * - Right Index (Y, H, N, U, J, M): Sky Blue (#00d2d3)
 * - Thumbs (Espacio): Magic Purple (#9b59b6)
 * - Visual tactile homemark anchors on F and J
 * - Opposing hand Shift illumination for uppercase characters
 */

/**
 * Strict pedagogical finger color codes
 */
export const FINGER_COLORS = Object.freeze({
  lp: '#F538A0',        // Left Pinky: Magenta / Fucsia
  lr: '#FA903E',        // Left Ring: Mandarina cálido
  lm: '#FCC934',        // Left Middle: Ámbar luminoso
  li: '#81C995',        // Left Index: Verde Menta
  ri: '#12B5CB',        // Right Index: Cian / Turquesa
  rm: '#FCC934',        // Right Middle: Ámbar luminoso
  rr: '#FA903E',        // Right Ring: Mandarina cálido
  rp: '#F538A0',        // Right Pinky: Magenta / Fucsia
  thumb: '#1A73E8',     // Thumbs: Azul Intenso
  'thumb-l': '#1A73E8', // Left Thumb: Azul Intenso
  'thumb-r': '#1A73E8', // Right Thumb: Azul Intenso
  mod: '#C58AF9'        // Modifiers (Alt Gr, Shift): Lavanda
});

/**
 * Spanish human-friendly finger labels for visual hints and speech
 */
export const FINGER_NAMES = Object.freeze({
  lp: 'Meñique Izquierdo',
  lr: 'Anular Izquierdo',
  lm: 'Corazón Izquierdo',
  li: 'Índice Izquierdo',
  ri: 'Índice Derecho',
  rm: 'Corazón Derecho',
  rr: 'Anular Derecho',
  rp: 'Meñique Derecho',
  thumb: 'Pulgar',
  'thumb-l': 'Pulgar Izquierdo',
  'thumb-r': 'Pulgar Derecho'
});

/**
 * Child-friendly color names corresponding to the pedagogical standard
 */
export const FINGER_COLOR_NAMES = Object.freeze({
  lp: 'coral',
  lr: 'naranja cálido',
  lm: 'amarillo sol',
  li: 'verde menta',
  ri: 'azul cielo',
  rm: 'amarillo sol',
  rr: 'naranja cálido',
  rp: 'coral',
  thumb: 'violeta mágico',
  'thumb-l': 'violeta mágico',
  'thumb-r': 'violeta mágico'
});

/**
 * Returns human-friendly pedagogical guidance for any key
 * @param {string} charOrKey
 * @returns {{ key: string, keyName: string, finger: string, fingerName: string, hand: string, handName: string, colorName: string, color: string, tip: string }}
 */
export function getPedagogicalKeyHint(charOrKey) {
  if (!charOrKey) {
    return {
      key: ' ',
      keyName: 'Espacio',
      finger: 'thumb',
      fingerName: 'Pulgar',
      hand: 'both',
      handName: 'ambas manos',
      colorName: 'violeta mágico',
      color: FINGER_COLORS.thumb,
      tip: 'Pulsa [Espacio] con cualquiera de tus dos pulgares.'
    };
  }

  const base = getKeyBaseChar(charOrKey);
  const mapping = FINGER_MAP[base] || FINGER_MAP[charOrKey.toLowerCase()] || { finger: 'ri', hand: 'right' };
  const fingerId = mapping.finger || 'ri';
  const fingerName = FINGER_NAMES[fingerId] || 'Dedo índice';
  const colorName = FINGER_COLOR_NAMES[fingerId] || 'de color';
  const handName = mapping.hand === 'left' ? 'Mano Izquierda' : (mapping.hand === 'right' ? 'Mano Derecha' : 'ambas manos');

  let keyDisplay = charOrKey;
  if (charOrKey === ' ' || charOrKey === 'Space') keyDisplay = 'Espacio';
  else if (charOrKey === '\n' || charOrKey === 'Enter') keyDisplay = 'Intro';
  else keyDisplay = charOrKey.toUpperCase();

  const tip = `Pulsa la tecla [${keyDisplay}] con el ${fingerName} (${colorName}) de tu ${handName}.`;

  return {
    key: charOrKey,
    keyName: keyDisplay,
    finger: fingerId,
    fingerName,
    hand: mapping.hand || 'right',
    handName,
    colorName,
    color: FINGER_COLORS[fingerId] || FINGER_COLORS.ri,
    tip
  };
}

/**
 * Character to Finger and Hand assignment map
 */
export const FINGER_MAP = Object.freeze({
  // Left Pinky (lp) - Coral / Soft Red
  '1': { finger: 'lp', hand: 'left' },
  '!': { finger: 'lp', hand: 'left', requiresShift: true, baseKey: '1' },
  '|': { finger: 'lp', hand: 'left', requiresAltGr: true, baseKey: '1' },
  'q': { finger: 'lp', hand: 'left' },
  'a': { finger: 'lp', hand: 'left' },
  'z': { finger: 'lp', hand: 'left' },
  'shift-left': { finger: 'lp', hand: 'left' },
  'ctrl-left': { finger: 'lp', hand: 'left' },

  // Left Ring (lr) - Warm Orange
  '2': { finger: 'lr', hand: 'left' },
  '"': { finger: 'lr', hand: 'left', requiresShift: true, baseKey: '2' },
  '@': { finger: 'lr', hand: 'left', requiresAltGr: true, baseKey: '2' },
  'w': { finger: 'lr', hand: 'left' },
  's': { finger: 'lr', hand: 'left' },
  'x': { finger: 'lr', hand: 'left' },

  // Left Middle (lm) - Sun Yellow
  '3': { finger: 'lm', hand: 'left' },
  '·': { finger: 'lm', hand: 'left', requiresShift: true, baseKey: '3' },
  '#': { finger: 'lm', hand: 'left', requiresAltGr: true, baseKey: '3' },
  'e': { finger: 'lm', hand: 'left' },
  'd': { finger: 'lm', hand: 'left' },
  'c': { finger: 'lm', hand: 'left' },
  '€': { finger: 'lm', hand: 'left', requiresAltGr: true, baseKey: 'e' },

  // Left Index (li) - Mint Green
  '4': { finger: 'li', hand: 'left' },
  '$': { finger: 'li', hand: 'left', requiresShift: true, baseKey: '4' },
  '~': { finger: 'li', hand: 'left', requiresAltGr: true, baseKey: '4' },
  '5': { finger: 'li', hand: 'left' },
  '%': { finger: 'li', hand: 'left', requiresShift: true, baseKey: '5' },
  'r': { finger: 'li', hand: 'left' },
  't': { finger: 'li', hand: 'left' },
  'f': { finger: 'li', hand: 'left', homemark: true },
  'g': { finger: 'li', hand: 'left' },
  'v': { finger: 'li', hand: 'left' },
  'b': { finger: 'li', hand: 'left' },

  // Right Index (ri) - Sky Blue
  '6': { finger: 'ri', hand: 'right' },
  '&': { finger: 'ri', hand: 'right', requiresShift: true, baseKey: '6' },
  '7': { finger: 'ri', hand: 'right' },
  '/': { finger: 'ri', hand: 'right', requiresShift: true, baseKey: '7' },
  'y': { finger: 'ri', hand: 'right' },
  'u': { finger: 'ri', hand: 'right' },
  'h': { finger: 'ri', hand: 'right' },
  'j': { finger: 'ri', hand: 'right', homemark: true },
  'n': { finger: 'ri', hand: 'right' },
  'm': { finger: 'ri', hand: 'right' },

  // Right Middle (rm) - Sun Yellow
  '8': { finger: 'rm', hand: 'right' },
  '(': { finger: 'rm', hand: 'right', requiresShift: true, baseKey: '8' },
  'i': { finger: 'rm', hand: 'right' },
  'k': { finger: 'rm', hand: 'right' },
  ',': { finger: 'rm', hand: 'right' },
  ';': { finger: 'rm', hand: 'right', requiresShift: true, baseKey: ',' },

  // Right Ring (rr) - Warm Orange
  '9': { finger: 'rr', hand: 'right' },
  ')': { finger: 'rr', hand: 'right', requiresShift: true, baseKey: '9' },
  'o': { finger: 'rr', hand: 'right' },
  'l': { finger: 'rr', hand: 'right' },
  '.': { finger: 'rr', hand: 'right' },
  ':': { finger: 'rr', hand: 'right', requiresShift: true, baseKey: '.' },

  // Right Pinky (rp) - Coral / Soft Red
  '0': { finger: 'rp', hand: 'right' },
  '=': { finger: 'rp', hand: 'right', requiresShift: true, baseKey: '0' },
  '?': { finger: 'rp', hand: 'right', requiresShift: true, baseKey: "'" },
  '¿': { finger: 'rp', hand: 'right' },
  '¡': { finger: 'rp', hand: 'right' },
  'p': { finger: 'rp', hand: 'right' },
  'ñ': { finger: 'rp', hand: 'right' },
  '-': { finger: 'rp', hand: 'right' },
  '_': { finger: 'rp', hand: 'right', requiresShift: true, baseKey: '-' },
  '´': { finger: 'rp', hand: 'right', isAccent: true },
  '¨': { finger: 'rp', hand: 'right', requiresShift: true, isAccent: true },
  '{': { finger: 'rp', hand: 'right', requiresAltGr: true, baseKey: '´' },
  '}': { finger: 'rp', hand: 'right', requiresAltGr: true, baseKey: 'ç' },
  'ç': { finger: 'rp', hand: 'right' },
  'enter': { finger: 'rp', hand: 'right' },
  '\n': { finger: 'rp', hand: 'right', baseKey: 'Enter' },
  'shift-right': { finger: 'rp', hand: 'right' },
  'ctrl-right': { finger: 'rp', hand: 'right' },

  // Thumbs (thumb) - Magic Purple
  ' ': { finger: 'thumb', hand: 'both', baseKey: ' ' },
  'space': { finger: 'thumb', hand: 'both', baseKey: ' ' },
  'alt-left': { finger: 'thumb-l', hand: 'left', baseKey: 'Alt' },
  'alt-right': { finger: 'thumb-r', hand: 'right', baseKey: 'AltGraph' }
});

/**
 * Spanish standard keyboard row definition matrix
 */
export const SPANISH_KEYBOARD_LAYOUT = [
  // Fila 0: Números y símbolos superiores
  [
    { key: '1', primary: '1', secondary: '!', tertiary: '|', finger: 'lp', hand: 'left' },
    { key: '2', primary: '2', secondary: '"', tertiary: '@', finger: 'lr', hand: 'left' },
    { key: '3', primary: '3', secondary: '·', tertiary: '#', finger: 'lm', hand: 'left' },
    { key: '4', primary: '4', secondary: '$', tertiary: '~', finger: 'li', hand: 'left' },
    { key: '5', primary: '5', secondary: '%', finger: 'li', hand: 'left' },
    { key: '6', primary: '6', secondary: '&', finger: 'ri', hand: 'right' },
    { key: '7', primary: '7', secondary: '/', finger: 'ri', hand: 'right' },
    { key: '8', primary: '8', secondary: '(', finger: 'rm', hand: 'right' },
    { key: '9', primary: '9', secondary: ')', finger: 'rr', hand: 'right' },
    { key: '0', primary: '0', secondary: '=', finger: 'rp', hand: 'right' },
    { key: "'", primary: "'", secondary: '?', finger: 'rp', hand: 'right' },
    { key: '¡', primary: '¡', secondary: '¿', finger: 'rp', hand: 'right' }
  ],
  // Fila 1: Superior (QWERTY...)
  [
    { key: 'q', primary: 'Q', finger: 'lp', hand: 'left' },
    { key: 'w', primary: 'W', finger: 'lr', hand: 'left' },
    { key: 'e', primary: 'E', tertiary: '€', finger: 'lm', hand: 'left' },
    { key: 'r', primary: 'R', finger: 'li', hand: 'left' },
    { key: 't', primary: 'T', finger: 'li', hand: 'left' },
    { key: 'y', primary: 'Y', finger: 'ri', hand: 'right' },
    { key: 'u', primary: 'U', finger: 'ri', hand: 'right' },
    { key: 'i', primary: 'I', finger: 'rm', hand: 'right' },
    { key: 'o', primary: 'O', finger: 'rr', hand: 'right' },
    { key: 'p', primary: 'P', finger: 'rp', hand: 'right' },
    { key: '`', primary: '`', secondary: '^', tertiary: '[', finger: 'rp', hand: 'right' },
    { key: '+', primary: '+', secondary: '*', tertiary: ']', finger: 'rp', hand: 'right' }
  ],
  // Fila 2: Fila Guía Central (ASDF / JKLÑ)
  [
    { key: 'a', primary: 'A', finger: 'lp', hand: 'left' },
    { key: 's', primary: 'S', finger: 'lr', hand: 'left' },
    { key: 'd', primary: 'D', finger: 'lm', hand: 'left' },
    { key: 'f', primary: 'F', finger: 'li', hand: 'left', homemark: true },
    { key: 'g', primary: 'G', finger: 'li', hand: 'left' },
    { key: 'h', primary: 'H', finger: 'ri', hand: 'right' },
    { key: 'j', primary: 'J', finger: 'ri', hand: 'right', homemark: true },
    { key: 'k', primary: 'K', finger: 'rm', hand: 'right' },
    { key: 'l', primary: 'L', finger: 'rr', hand: 'right' },
    { key: 'ñ', primary: 'Ñ', finger: 'rp', hand: 'right' },
    { key: '´', primary: '´', secondary: '¨', tertiary: '{', finger: 'rp', hand: 'right', isAccent: true },
    { key: 'ç', primary: 'Ç', secondary: '}', finger: 'rp', hand: 'right' },
    { key: 'Enter', primary: 'Intro', finger: 'rp', hand: 'right', isAction: true, width: 1.6 }
  ],
  // Fila 3: Inferior (ZXCVBNM)
  [
    { key: 'Shift', primary: 'Mayús', finger: 'lp', hand: 'left', isModifier: true, width: 1.4, side: 'left' },
    { key: 'z', primary: 'Z', finger: 'lp', hand: 'left' },
    { key: 'x', primary: 'X', finger: 'lr', hand: 'left' },
    { key: 'c', primary: 'C', finger: 'lm', hand: 'left' },
    { key: 'v', primary: 'V', finger: 'li', hand: 'left' },
    { key: 'b', primary: 'B', finger: 'li', hand: 'left' },
    { key: 'n', primary: 'N', finger: 'ri', hand: 'right' },
    { key: 'm', primary: 'M', finger: 'ri', hand: 'right' },
    { key: ',', primary: ',', secondary: ';', finger: 'rm', hand: 'right' },
    { key: '.', primary: '.', secondary: ':', finger: 'rr', hand: 'right' },
    { key: '-', primary: '-', secondary: '_', finger: 'rp', hand: 'right' },
    { key: 'Shift', primary: 'Mayús', finger: 'rp', hand: 'right', isModifier: true, width: 1.5, side: 'right' }
  ],
  // Fila 4: Barra espaciadora y modificadores de pulgar
  [
    { key: 'Control', primary: 'Ctrl', finger: 'lp', hand: 'left', isModifier: true, width: 1.2, side: 'left' },
    { key: 'Alt', primary: 'Alt', finger: 'thumb-l', hand: 'left', isModifier: true, width: 1.2, side: 'left' },
    { key: ' ', primary: 'Espacio', finger: 'thumb', hand: 'both', isSpace: true, width: 5.0 },
    { key: 'AltGraph', primary: 'Alt Gr', finger: 'thumb-r', hand: 'right', isModifier: true, width: 1.2, side: 'right' },
    { key: 'Control', primary: 'Ctrl', finger: 'rp', hand: 'right', isModifier: true, width: 1.2, side: 'right' }
  ]
];

/**
 * Checks if a key character is one of the tactile homemark anchors (F or J)
 * @param {string} keyChar
 * @returns {boolean}
 */
export function isHomemarkKey(keyChar) {
  if (!keyChar) return false;
  const lower = String(keyChar).toLowerCase();
  return lower === 'f' || lower === 'j';
}

/**
 * Checks if a character has a Spanish dead-key accent (tilde)
 * @param {string} char
 * @returns {boolean}
 */
export function hasAccent(char) {
  return typeof char === 'string' && /[áéíóúÁÉÍÓÚ]/.test(char);
}

/**
 * Checks if a character has a Spanish diéresis (¨)
 * @param {string} char
 * @returns {boolean}
 */
export function hasDiaeresis(char) {
  return typeof char === 'string' && /[üÜ]/.test(char);
}

/**
 * Resolves base unaccented key for character
 * @param {string} char
 * @returns {string}
 */
export function getKeyBaseChar(char) {
  if (!char) return '';
  if (char === ' ') return ' ';
  if (char === '\n' || char === 'Enter') return 'Enter';

  // Accented vowels
  const accentMap = {
    'á': 'a', 'é': 'e', 'í': 'i', 'ó': 'o', 'ú': 'u',
    'Á': 'a', 'É': 'e', 'Í': 'i', 'Ó': 'o', 'Ú': 'u',
    'ü': 'u', 'Ü': 'u'
  };
  if (accentMap[char]) return accentMap[char];

  // Shifted punctuation / symbols
  const symbolMap = {
    '!': '1', '"': '2', '·': '3', '$': '4', '%': '5',
    '&': '6', '/': '7', '(': '8', ')': '9', '=': '0',
    '?': "'", '¿': '¡', ';': ',', ':': '.', '_': '-',
    '|': '1', '@': '2', '#': '3', '~': '4', '€': 'e',
    '{': '´', '}': 'ç', '[': '`', ']': '+'
  };
  if (symbolMap[char]) return symbolMap[char];

  return char.toLowerCase();
}

/**
 * Determines whether the character requires Shift to type
/**
 * Determines whether the character requires Shift to type.
 * In levels 1 to 6 (levelId < 7), basic letters are displayed in uppercase
 * to match physical keyboard keycaps, but do NOT require pressing Shift.
 * 
 * @param {string} char
 * @param {number|string} [levelId=null]
 * @returns {boolean}
 */
export function requiresShift(char, levelId = null) {
  if (!char || char.length !== 1) return false;
  // Diéresis requires Shift + ´
  if (hasDiaeresis(char)) return true;
  // Shifted punctuation / symbols on Spanish keyboard
  if (/[!"·$%&/()=?¿:;_¨*]/.test(char)) return true;

  // In early levels (1-6), uppercase letters match physical keycaps directly without Shift
  if (levelId !== null && Number(levelId) < 7) {
    if (char !== char.toLowerCase() && char === char.toUpperCase() && !/[0-9]/.test(char)) {
      return false;
    }
  }

  // Uppercase letters (Level 7+ or standard typing)
  if (char !== char.toLowerCase() && char === char.toUpperCase() && !/[0-9]/.test(char)) {
    return true;
  }
  return false;
}

/**
 * Determines whether the character requires Alt Gr to type
 * @param {string} char
 * @returns {boolean}
 */
export function requiresAltGr(char) {
  if (!char) return false;
  return /[@#~|€{}\[\]\\]/.test(char);
}

/**
 * Returns pedagogical finger details and color for any character
 * @param {string} charOrKey
 * @returns {{ finger: string, hand: string, color: string, name: string, isHomemark: boolean }}
 */
export function getFingerForKey(charOrKey) {
  if (!charOrKey) {
    return {
      finger: 'thumb',
      hand: 'right',
      color: FINGER_COLORS.thumb,
      name: FINGER_NAMES.thumb,
      isHomemark: false
    };
  }

  const base = getKeyBaseChar(charOrKey);
  const mapping = FINGER_MAP[base] || FINGER_MAP[charOrKey.toLowerCase()] || { finger: 'ri', hand: 'right' };
  const fingerId = mapping.finger || 'ri';
  const hand = mapping.hand || 'right';
  const color = FINGER_COLORS[fingerId] || FINGER_COLORS.ri;
  const name = FINGER_NAMES[fingerId] || 'Dedo Guía';

  return {
    finger: fingerId,
    hand,
    color,
    name,
    isHomemark: isHomemarkKey(base)
  };
}

/**
 * Implements standard ergonomic touch-typing rule:
 * When a character requires Shift, illuminate the Shift key on the OPPOSITE hand.
 * @param {string} char
 * @param {number|string} [levelId=null]
 * @returns {'left' | 'right' | null} Hand of the Shift key to illuminate
 */
export function getShiftHandForChar(char, levelId = null) {
  if (!requiresShift(char, levelId)) return null;
  const fingerData = getFingerForKey(char);
  // If target letter is pressed with left hand, use Right Shift
  if (fingerData.hand === 'left') {
    return 'right';
  }
  // If target letter is pressed with right hand, use Left Shift
  if (fingerData.hand === 'right') {
    return 'left';
  }
  return 'left';
}

/**
 * Returns multi-key combination information for characters requiring Alt Gr or Shift.
 * Illuminates both the primary finger and the modifier finger simultaneously.
 * 
 * @param {string} charOrKey
 * @param {number|string} [levelId=null]
 * @returns {{
 *   char: string,
 *   primaryFinger: string,
 *   primaryFingerName: string,
 *   primaryColor: string,
 *   modifierFinger: string|null,
 *   modifierFingerName: string|null,
 *   modifierColor: string|null,
 *   isCombo: boolean,
 *   combinationKeyName: string|null,
 *   labelText: string
 * }}
 */
export function getMultiKeyFingerCombo(charOrKey, levelId = null) {
  if (!charOrKey) {
    return {
      char: ' ',
      primaryFinger: 'finger-r-thumb',
      primaryFingerName: 'Pulgar',
      primaryColor: FINGER_COLORS.thumb,
      modifierFinger: null,
      modifierFingerName: null,
      modifierColor: null,
      isCombo: false,
      combinationKeyName: null,
      labelText: 'Pulsa [Espacio] con cualquiera de tus pulgares'
    };
  }

  const base = getKeyBaseChar(charOrKey);
  const mapping = FINGER_MAP[base] || FINGER_MAP[charOrKey.toLowerCase()] || { finger: 'ri', hand: 'right' };
  const rawFinger = mapping.finger || 'ri';

  // Map legacy finger codes to universal SVG finger IDs
  const fingerIdMap = {
    lp: 'finger-l-pinky',
    lr: 'finger-l-ring',
    lm: 'finger-l-middle',
    li: 'finger-l-index',
    ri: 'finger-r-index',
    rm: 'finger-r-middle',
    rr: 'finger-r-ring',
    rp: 'finger-r-pinky',
    thumb: mapping.hand === 'left' ? 'finger-l-thumb' : 'finger-r-thumb',
    'thumb-l': 'finger-l-thumb',
    'thumb-r': 'finger-r-thumb'
  };

  const primaryFingerId = fingerIdMap[rawFinger] || 'finger-r-index';
  const primaryFingerName = FINGER_NAMES[rawFinger] || 'Dedo Guía';
  const primaryColor = FINGER_COLORS[rawFinger] || '#12B5CB';

  let modifierFingerId = null;
  let modifierColor = null;
  let modifierName = null;
  let combinationKeyName = null;

  if (requiresAltGr(charOrKey)) {
    // Alt Gr is pressed with Right Thumb
    modifierFingerId = 'finger-r-thumb';
    modifierColor = FINGER_COLORS.mod;
    modifierName = 'Pulgar Derecho';
    combinationKeyName = 'Alt Gr';
  } else if (requiresShift(charOrKey, levelId)) {
    // Opposite pinky for Shift
    const shiftHand = getShiftHandForChar(charOrKey, levelId);
    if (shiftHand === 'right') {
      modifierFingerId = 'finger-r-pinky';
      modifierName = 'Meñique Derecho';
    } else {
      modifierFingerId = 'finger-l-pinky';
      modifierName = 'Meñique Izquierdo';
    }
    modifierColor = FINGER_COLORS.mod;
    combinationKeyName = 'Mayús';
  }

  let labelText = '';
  if (combinationKeyName && modifierFingerId) {
    const keySymbol = charOrKey;
    labelText = `Pulsa ${combinationKeyName} + ${keySymbol} (${modifierName} + ${primaryFingerName})`;
  } else {
    const keySymbol = charOrKey === ' ' ? 'Espacio' : (charOrKey === '\n' ? 'Intro' : charOrKey.toUpperCase());
    labelText = `Pulsa [${keySymbol}] con el ${primaryFingerName}`;
  }

  return {
    char: charOrKey,
    primaryFinger: primaryFingerId,
    primaryFingerName,
    primaryColor,
    modifierFinger: modifierFingerId,
    modifierFingerName: modifierName,
    modifierColor,
    isCombo: Boolean(modifierFingerId),
    combinationKeyName,
    labelText
  };
}
