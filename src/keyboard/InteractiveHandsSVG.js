/**
 * InteractiveHandsSVG.js - Pure Vector SVG Interactive Hands with Multi-Key Illumination
 * 
 * Fulfills Phase 3 & R4 specifications:
 * - 100% pure vector SVG hands: completely replaces realistic photographic PNGs.
 * - Universal 10-finger IDs:
 *   Left Hand:  finger-l-pinky, finger-l-ring, finger-l-middle, finger-l-index, finger-l-thumb
 *   Right Hand: finger-r-thumb, finger-r-index, finger-r-middle, finger-r-ring, finger-r-pinky
 * - Exact pedagogical palette:
 *   Pinkies (Q, A, Z / P, Ñ, -):   #F538A0 (Magenta / Fucsia)
 *   Ring (W, S, X / O, L, .):      #FA903E (Mandarina cálido)
 *   Middle (E, D, C / I, K, ,):    #FCC934 (Ámbar luminoso)
 *   Left Index (R, F, V, T, G, B): #81C995 (Verde Menta)
 *   Right Index (Y, H, N, U, J, M):#12B5CB (Cian / Turquesa)
 *   Thumbs (Espacio):              #1A73E8 (Azul Intenso)
 *   Modifiers (Alt Gr, Shift):     #C58AF9 (Lavanda)
 * - Multi-key simultaneous illumination (e.g. Alt Gr + 2 for @, Shift + letter for uppercase).
 * - Full-body finger elevation (translateY(-6px) scale(1.04)) with zero misaligned dots.
 * - 2-second idle cue bounce.
 */

import {
  FINGER_COLORS,
  FINGER_NAMES,
  getFingerForKey,
  getMultiKeyFingerCombo,
  requiresShift,
  requiresAltGr
} from './KeyboardLayout.js';

export const UNIVERSAL_FINGER_IDS = Object.freeze({
  LEFT_PINKY: 'finger-l-pinky',
  LEFT_RING: 'finger-l-ring',
  LEFT_MIDDLE: 'finger-l-middle',
  LEFT_INDEX: 'finger-l-index',
  LEFT_THUMB: 'finger-l-thumb',
  RIGHT_THUMB: 'finger-r-thumb',
  RIGHT_INDEX: 'finger-r-index',
  RIGHT_MIDDLE: 'finger-r-middle',
  RIGHT_RING: 'finger-r-ring',
  RIGHT_PINKY: 'finger-r-pinky'
});

const ANATOMICAL_HAND_PATH = 'M 92.6,449.6 L 83.2,426.7 L 75.9,398.6 L 64.5,334.2 L 59.8,284.8 L 48.4,236.4 L 41.1,189.6 L 40,164.6 L 41.6,148 L 43.7,142.3 L 46.8,139.2 L 52,137.6 L 60.8,139.2 L 68.6,147.5 L 74.4,163.1 L 80.6,203.1 L 96.7,259.8 L 100.4,267.1 L 104,267.6 L 105.6,266 L 106.6,263.4 L 106.6,239 L 100.4,187.5 L 100.9,98.6 L 102.4,77.8 L 106.1,69 L 110.8,63.2 L 120.1,59.1 L 129.5,61.2 L 135.2,66.4 L 139.9,76.2 L 144.6,160.5 L 150.3,203.6 L 151.8,227 L 153.4,231.7 L 156,234.3 L 159.1,230.7 L 160.2,219.8 L 160.7,149.6 L 166.4,109.5 L 168,61.7 L 169.5,48.2 L 173.7,37.8 L 181.5,30 L 185.6,28.9 L 191.4,30 L 199.2,33.6 L 203.8,37.8 L 209.6,50.8 L 211.1,77.3 L 210.1,134 L 211.6,150.1 L 210.1,173 L 210.1,227 L 213.2,232.8 L 220,232.2 L 223.1,229.1 L 224.6,224.4 L 230.4,182.3 L 240.2,135 L 243.4,97 L 248,76.8 L 252.7,68.4 L 259,62.7 L 263.6,60.6 L 268.3,60.6 L 273,62.7 L 279.2,70 L 284.4,83 L 285.5,119.4 L 282.9,139.7 L 281.3,180.8 L 273,244.2 L 273,284.2 L 277.2,314.9 L 280.8,324.3 L 285,320.6 L 294.8,299.3 L 301.6,283.2 L 303.7,271.8 L 308.9,257.7 L 316.2,244.2 L 324.5,232.8 L 333.8,223.4 L 343.7,218.7 L 356.2,219.2 L 361.9,221.8 L 364,226 L 363,235.4 L 354.1,261.9 L 351,293.1 L 332.3,340.4 L 325,374.7 L 302.1,417.9 L 286.5,444.9 L 281.3,451.2 L 93.6,451.2 L 92.6,450.1 Z';

/**
 * Returns anatomical SVG markup for Left Hand (Dorsal View).
 * Uses viewBox="0 0 400 480" for responsive high-definition scaling.
 */
export function getLeftHandSVG() {
  return generateAnatomicalHandSVG(false);
}

/**
 * Returns anatomical SVG markup for Right Hand (Dorsal View).
 * Symmetrical anatomical mirror with 10 universal finger IDs.
 */
export function getRightHandSVG() {
  return generateAnatomicalHandSVG(true);
}

/**
 * Generates true anatomical dorsal hand SVG markup with 10 universal IDs and seamless illuminated overlays.
 * @param {boolean} isRight
 */
function generateAnatomicalHandSVG(isRight = false) {
  const transform = isRight ? 'transform="translate(400, 0) scale(-1, 1)"' : '';
  const side = isRight ? 'r' : 'l';

  return `
<svg class="interactive-hand-svg natural-hand-dorsal" id="hand-svg-${isRight ? 'right' : 'left'}" viewBox="0 0 400 480" width="100%" height="100%" aria-label="Mano ${isRight ? 'Derecha' : 'Izquierda'} Guía" role="img" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <!-- Sombra profunda realista del contorno de la mano -->
    <filter id="hand-glow-drop-${side}" x="-25%" y="-20%" width="150%" height="140%">
      <feDropShadow dx="0" dy="10" stdDeviation="14" flood-color="#050711" flood-opacity="0.55" />
      <feDropShadow dx="0" dy="3" stdDeviation="5" flood-color="#050711" flood-opacity="0.35" />
    </filter>

    <!-- Gradiente de piel natural realista (dorso) -->
    <linearGradient id="skin-real-${side}" x1="20%" y1="0%" x2="80%" y2="100%">
      <stop offset="0%" stop-color="#FFEADE" />
      <stop offset="35%" stop-color="#F9CEAD" />
      <stop offset="75%" stop-color="#EDB388" />
      <stop offset="100%" stop-color="#DE9D6E" />
    </linearGradient>

    <!-- Gradiente de uña pulida con cutícula y brillo -->
    <linearGradient id="nail-real-${side}" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#FFFFFF" stop-opacity="0.95" />
      <stop offset="25%" stop-color="#FFF2F5" />
      <stop offset="65%" stop-color="#FCDCE5" />
      <stop offset="100%" stop-color="#F7BFCE" />
    </linearGradient>

    <!-- Gradientes de iluminación por dedo con desvanecimiento suave en el nudillo -->
    <linearGradient id="glow-grad-${side}-pinky" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#F538A0" stop-opacity="0.9" />
      <stop offset="75%" stop-color="#F538A0" stop-opacity="0.75" />
      <stop offset="100%" stop-color="#F538A0" stop-opacity="0.0" />
    </linearGradient>

    <linearGradient id="glow-grad-${side}-ring" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#FA903E" stop-opacity="0.9" />
      <stop offset="75%" stop-color="#FA903E" stop-opacity="0.75" />
      <stop offset="100%" stop-color="#FA903E" stop-opacity="0.0" />
    </linearGradient>

    <linearGradient id="glow-grad-${side}-middle" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#FCC934" stop-opacity="0.9" />
      <stop offset="75%" stop-color="#FCC934" stop-opacity="0.75" />
      <stop offset="100%" stop-color="#FCC934" stop-opacity="0.0" />
    </linearGradient>

    <linearGradient id="glow-grad-${side}-index" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="${isRight ? '#12B5CB' : '#81C995'}" stop-opacity="0.9" />
      <stop offset="75%" stop-color="${isRight ? '#12B5CB' : '#81C995'}" stop-opacity="0.75" />
      <stop offset="100%" stop-color="${isRight ? '#12B5CB' : '#81C995'}" stop-opacity="0.0" />
    </linearGradient>

    <linearGradient id="glow-grad-${side}-thumb" x1="50%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#1A73E8" stop-opacity="0.9" />
      <stop offset="75%" stop-color="#1A73E8" stop-opacity="0.75" />
      <stop offset="100%" stop-color="#1A73E8" stop-opacity="0.0" />
    </linearGradient>
  </defs>

  <g class="hand-scene" filter="url(#hand-glow-drop-${side})" ${transform}>

    <!-- ===================================================================
         1. SILUETA BASE COMPLETA Y CONTINUA DE LA MANO (100% Anatómica)
         =================================================================== -->
    <path class="hand-base-silhouette" d="${ANATOMICAL_HAND_PATH}"
          fill="url(#skin-real-${side})"
          stroke="#C57E4E"
          stroke-width="1.8"
          stroke-linejoin="round"
          stroke-linecap="round"
    />

    <!-- Sombra suave volumétrica del borde cubital (meñique) y muñeca -->
    <path d="M 92.6,449.6 C 80,410 70,350 62,290" fill="none" stroke="#B06536" stroke-width="3" stroke-linecap="round" opacity="0.25" />
    <path d="M 281.3,451.2 C 295,430 315,390 326,360" fill="none" stroke="#B06536" stroke-width="3" stroke-linecap="round" opacity="0.2" />

    <!-- Arcos suaves y naturales de los nudillos principales (MCP) -->
    <path d="M 66,268 Q 84,262 102,267" fill="none" stroke="#C57E4E" stroke-width="1.6" stroke-linecap="round" opacity="0.45" />
    <path d="M 112,240 Q 134,233 154,237" fill="none" stroke="#C57E4E" stroke-width="1.7" stroke-linecap="round" opacity="0.45" />
    <path d="M 166,235 Q 188,229 210,234" fill="none" stroke="#C57E4E" stroke-width="1.8" stroke-linecap="round" opacity="0.45" />
    <path d="M 220,237 Q 244,244 268,256" fill="none" stroke="#C57E4E" stroke-width="1.7" stroke-linecap="round" opacity="0.45" />
    <path d="M 115,442 C 160,452 220,452 265,442" fill="none" stroke="#C57E4E" stroke-width="1.8" stroke-linecap="round" opacity="0.3" />

    <!-- ===================================================================
         2. DEDOS INTERACTIVOS (Capas anatómicas de alta precisión)
         =================================================================== -->

    <!-- DEDO MEÑIQUE (Pinky) -->
    <g class="interactive-finger finger-unit" id="finger-${side}-pinky" data-finger="${isRight ? 'rp' : 'lp'}" data-finger-id="finger-${side}-pinky" style="--default-color: #F538A0; --glow-gradient: url(#glow-grad-${side}-pinky);">
      <path class="finger-body" d="
        M 56,275
        L 48.4,236.4 L 41.1,189.6 L 40,164.6 L 41.6,148 L 43.7,142.3 L 46.8,139.2 L 52,137.6 L 60.8,139.2 L 68.6,147.5 L 74.4,163.1 L 80.6,203.1 L 96.7,259.8 L 100.4,267.1
        Q 78,272 56,275 Z"
        fill="transparent"
      />
      <path class="finger-rim" d="
        M 56,275
        L 48.4,236.4 L 41.1,189.6 L 40,164.6 L 41.6,148 L 43.7,142.3 L 46.8,139.2 L 52,137.6 L 60.8,139.2 L 68.6,147.5 L 74.4,163.1 L 80.6,203.1 L 96.7,259.8 L 100.4,267.1"
        fill="none" stroke="transparent" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
      />
      <path class="finger-crease" d="M 45,202 Q 62,206 78,202" fill="none" stroke="#C57E4E" stroke-width="1.4" stroke-linecap="round" opacity="0.45" />
      <path class="finger-crease" d="M 43,168 Q 58,172 71,168" fill="none" stroke="#C57E4E" stroke-width="1.3" stroke-linecap="round" opacity="0.4" />

      <path class="finger-nail" d="
        M 45,156
        C 43,146 47,138 56,137
        C 65,138 69,146 67,156
        C 66,163 46,163 45,156 Z"
        fill="url(#nail-real-${side})"
        stroke="#E69CAE"
        stroke-width="0.9"
      />
      <path class="nail-shine" d="M 47,144 Q 56,140 64,144" fill="none" stroke="#FFFFFF" stroke-width="1.2" stroke-linecap="round" opacity="0.85" />

      <circle class="finger-pad" cx="56" cy="148" r="12" />
      <circle class="finger-pulse-ring" cx="56" cy="148" r="14" />
    </g>

    <!-- DEDO ANULAR (Ring) -->
    <g class="interactive-finger finger-unit" id="finger-${side}-ring" data-finger="${isRight ? 'rr' : 'lr'}" data-finger-id="finger-${side}-ring" style="--default-color: #FA903E; --glow-gradient: url(#glow-grad-${side}-ring);">
      <path class="finger-body" d="
        M 104,267.6
        L 106.6,263.4 L 106.6,239 L 100.4,187.5 L 100.9,98.6 L 102.4,77.8 L 106.1,69 L 110.8,63.2 L 120.1,59.1 L 129.5,61.2 L 135.2,66.4 L 139.9,76.2 L 144.6,160.5 L 150.3,203.6 L 151.8,227 L 156,234.3
        Q 130,248 104,267.6 Z"
        fill="transparent"
      />
      <path class="finger-rim" d="
        M 104,267.6
        L 106.6,263.4 L 106.6,239 L 100.4,187.5 L 100.9,98.6 L 102.4,77.8 L 106.1,69 L 110.8,63.2 L 120.1,59.1 L 129.5,61.2 L 135.2,66.4 L 139.9,76.2 L 144.6,160.5 L 150.3,203.6 L 151.8,227 L 156,234.3"
        fill="none" stroke="transparent" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
      />
      <path class="finger-crease" d="M 104,162 Q 124,167 146,162" fill="none" stroke="#C57E4E" stroke-width="1.6" stroke-linecap="round" opacity="0.45" />
      <path class="finger-crease" d="M 104,115 Q 123,119 142,115" fill="none" stroke="#C57E4E" stroke-width="1.5" stroke-linecap="round" opacity="0.4" />

      <path class="finger-nail" d="
        M 108,82
        C 106,70 110,60 122,59
        C 133,60 137,70 135,82
        C 134,90 109,90 108,82 Z"
        fill="url(#nail-real-${side})"
        stroke="#E69CAE"
        stroke-width="1"
      />
      <path class="nail-shine" d="M 111,68 Q 122,63 131,68" fill="none" stroke="#FFFFFF" stroke-width="1.3" stroke-linecap="round" opacity="0.85" />

      <circle class="finger-pad" cx="122" cy="72" r="14" />
      <circle class="finger-pulse-ring" cx="122" cy="72" r="16" />
    </g>

    <!-- DEDO CORAZÓN (Middle) -->
    <g class="interactive-finger finger-unit" id="finger-${side}-middle" data-finger="${isRight ? 'rm' : 'lm'}" data-finger-id="finger-${side}-middle" style="--default-color: #FCC934; --glow-gradient: url(#glow-grad-${side}-middle);">
      <path class="finger-body" d="
        M 156,234.3
        L 159.1,230.7 L 160.2,219.8 L 160.7,149.6 L 166.4,109.5 L 168,61.7 L 169.5,48.2 L 173.7,37.8 L 181.5,30 L 185.6,28.9 L 191.4,30 L 199.2,33.6 L 203.8,37.8 L 209.6,50.8 L 211.1,77.3 L 210.1,134 L 211.6,150.1 L 210.1,173 L 210.1,227 L 213.2,232.8
        Q 185,236 156,234.3 Z"
        fill="transparent"
      />
      <path class="finger-rim" d="
        M 156,234.3
        L 159.1,230.7 L 160.2,219.8 L 160.7,149.6 L 166.4,109.5 L 168,61.7 L 169.5,48.2 L 173.7,37.8 L 181.5,30 L 185.6,28.9 L 191.4,30 L 199.2,33.6 L 203.8,37.8 L 209.6,50.8 L 211.1,77.3 L 210.1,134 L 211.6,150.1 L 210.1,173 L 210.1,227 L 213.2,232.8"
        fill="none" stroke="transparent" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
      />
      <path class="finger-crease" d="M 166,140 Q 188,145 210,140" fill="none" stroke="#C57E4E" stroke-width="1.7" stroke-linecap="round" opacity="0.45" />
      <path class="finger-crease" d="M 168,84 Q 188,88 208,84" fill="none" stroke="#C57E4E" stroke-width="1.5" stroke-linecap="round" opacity="0.4" />

      <path class="finger-nail" d="
        M 172,52
        C 170,38 175,28 188,27
        C 201,28 206,38 204,52
        C 203,62 173,62 172,52 Z"
        fill="url(#nail-real-${side})"
        stroke="#E69CAE"
        stroke-width="1"
      />
      <path class="nail-shine" d="M 176,36 Q 188,30 198,36" fill="none" stroke="#FFFFFF" stroke-width="1.4" stroke-linecap="round" opacity="0.85" />

      <circle class="finger-pad" cx="188" cy="42" r="15" />
      <circle class="finger-pulse-ring" cx="188" cy="42" r="17" />
    </g>

    <!-- DEDO ÍNDICE (Index) -->
    <g class="interactive-finger finger-unit" id="finger-${side}-index" data-finger="${isRight ? 'ri' : 'li'}" data-finger-id="finger-${side}-index" style="--default-color: ${isRight ? '#12B5CB' : '#81C995'}; --glow-gradient: url(#glow-grad-${side}-index);">
      <path class="finger-body" d="
        M 213.2,232.8
        L 220,232.2 L 223.1,229.1 L 224.6,224.4 L 230.4,182.3 L 240.2,135 L 243.4,97 L 248,76.8 L 252.7,68.4 L 259,62.7 L 263.6,60.6 L 268.3,60.6 L 273,62.7 L 279.2,70 L 284.4,83 L 285.5,119.4 L 282.9,139.7 L 281.3,180.8 L 273,244.2
        Q 243,237 213.2,232.8 Z"
        fill="transparent"
      />
      <path class="finger-rim" d="
        M 213.2,232.8
        L 220,232.2 L 223.1,229.1 L 224.6,224.4 L 230.4,182.3 L 240.2,135 L 243.4,97 L 248,76.8 L 252.7,68.4 L 259,62.7 L 263.6,60.6 L 268.3,60.6 L 273,62.7 L 279.2,70 L 284.4,83 L 285.5,119.4 L 282.9,139.7 L 281.3,180.8 L 273,244.2"
        fill="none" stroke="transparent" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
      />
      <path class="finger-crease" d="M 234,152 Q 256,157 278,152" fill="none" stroke="#C57E4E" stroke-width="1.7" stroke-linecap="round" opacity="0.45" />
      <path class="finger-crease" d="M 242,102 Q 260,106 278,102" fill="none" stroke="#C57E4E" stroke-width="1.5" stroke-linecap="round" opacity="0.4" />

      <path class="finger-nail" d="
        M 250,84
        C 248,71 253,61 266,60
        C 278,61 282,71 280,84
        C 279,93 251,93 250,84 Z"
        fill="url(#nail-real-${side})"
        stroke="#E69CAE"
        stroke-width="1"
      />
      <path class="nail-shine" d="M 254,70 Q 266,65 275,70" fill="none" stroke="#FFFFFF" stroke-width="1.3" stroke-linecap="round" opacity="0.85" />

      <circle class="finger-pad" cx="266" cy="74" r="14" />
      <circle class="finger-pulse-ring" cx="266" cy="74" r="16" />
    </g>

    <!-- DEDO PULGAR (Thumb) -->
    <g class="interactive-finger finger-unit" id="finger-${side}-thumb" data-finger="thumb" data-finger-id="finger-${side}-thumb" style="--default-color: #1A73E8; --glow-gradient: url(#glow-grad-${side}-thumb);">
      <path class="finger-body" d="
        M 280.8,324.3
        L 285,320.6 L 294.8,299.3 L 301.6,283.2 L 303.7,271.8 L 308.9,257.7 L 316.2,244.2 L 324.5,232.8 L 333.8,223.4 L 343.7,218.7 L 356.2,219.2 L 361.9,221.8 L 364,226 L 363,235.4 L 354.1,261.9 L 351,293.1 L 332.3,340.4
        Q 306,332 280.8,324.3 Z"
        fill="transparent"
      />
      <path class="finger-rim" d="
        M 280.8,324.3
        L 285,320.6 L 294.8,299.3 L 301.6,283.2 L 303.7,271.8 L 308.9,257.7 L 316.2,244.2 L 324.5,232.8 L 333.8,223.4 L 343.7,218.7 L 356.2,219.2 L 361.9,221.8 L 364,226 L 363,235.4 L 354.1,261.9 L 351,293.1 L 332.3,340.4"
        fill="none" stroke="transparent" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
      />
      <path class="finger-crease" d="M 318,265 Q 334,275 352,260" fill="none" stroke="#C57E4E" stroke-width="1.6" stroke-linecap="round" opacity="0.45" />

      <path class="finger-nail" d="
        M 342,238
        C 344,226 353,222 362,231
        C 368,241 364,251 354,255
        C 348,258 340,249 342,238 Z"
        fill="url(#nail-real-${side})"
        stroke="#E69CAE"
        stroke-width="1"
      />
      <path class="nail-shine" d="M 348,230 Q 355,228 361,234" fill="none" stroke="#FFFFFF" stroke-width="1.3" stroke-linecap="round" opacity="0.85" />

      <circle class="finger-pad" cx="354" cy="238" r="14" />
      <circle class="finger-pulse-ring" cx="354" cy="238" r="16" />
    </g>

  </g>
</svg>
`;
}

/**
 * InteractiveHandsSVG - Manages the pure vector cartoon hands overlay and multi-key combos
 */
export class InteractiveHandsSVG {
  /**
   * @param {Object} [options]
   * @param {Object} [options.eventBus=null] EventBus instance
   * @param {string|Element} [options.leftContainer='#hand-card-left .hand-illustration']
   * @param {string|Element} [options.rightContainer='#hand-card-right .hand-illustration']
   * @param {string|Element} [options.hintContainer='#current-finger-hint']
   * @param {number} [options.idleThresholdMs=2000] Inactivity time before hint bounce
   */
  constructor(options = {}) {
    this.eventBus = options.eventBus || null;
    this.idleThresholdMs = options.idleThresholdMs || 2000;

    this.leftContainer = options.leftContainer || '#hand-card-left .hand-illustration';
    this.rightContainer = options.rightContainer || '#hand-card-right .hand-illustration';
    this.hintContainer = options.hintContainer || '#current-finger-hint';

    this.activeFingers = new Set(); // set of finger element IDs currently illuminated
    this.currentTargetKey = null;
    this.currentCombo = null;

    this._idleTimer = null;
    this._isIdleStuck = false;
    this._eventDisposers = [];

    // Inject SVG and bind
    this.init();
  }

  /**
   * Mounts SVG hands into the DOM and binds event listeners
   */
  init() {
    if (typeof document === 'undefined') return;

    this._mountSvgs();
    this._injectStyles();

    if (this.eventBus) {
      this.bindEventBus(this.eventBus);
    }
  }

  /**
   * Replaces realistic image containers with pure vector SVGs
   * @private
   */
  _mountSvgs() {
    const leftEl = typeof this.leftContainer === 'string'
      ? document.querySelector(this.leftContainer)
      : this.leftContainer;

    const rightEl = typeof this.rightContainer === 'string'
      ? document.querySelector(this.rightContainer)
      : this.rightContainer;

    if (leftEl) {
      leftEl.innerHTML = getLeftHandSVG();
    }
    if (rightEl) {
      rightEl.innerHTML = getRightHandSVG();
    }
  }

  /**
   * Injects dynamic CSS rules for finger illumination, elevation and multi-key combos
   * @private
   */
  _injectStyles() {
    if (document.getElementById('interactive-hands-styles')) return;

    const style = document.createElement('style');
    style.id = 'interactive-hands-styles';
    style.textContent = `
      .interactive-hand-svg {
        width: 100%;
        height: 100%;
        max-height: 380px;
        display: block;
        overflow: visible;
        filter: drop-shadow(0 6px 14px rgba(0, 0, 0, 0.35));
      }

      .interactive-finger {
        cursor: pointer;
        transform-origin: 50% 80%;
        transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1),
                    filter 0.2s ease;
      }

      .interactive-finger .finger-body {
        transition: fill 0.2s ease, stroke 0.2s ease;
      }

      .interactive-finger .finger-rim {
        transition: stroke 0.2s ease;
      }

      .interactive-finger .finger-crease {
        transition: stroke 0.2s ease;
      }

      .interactive-finger .finger-nail {
        transition: fill 0.2s ease, filter 0.2s ease;
      }

      .interactive-finger .finger-pad {
        fill: transparent;
        stroke: transparent;
        transition: all 0.2s ease;
      }

      .interactive-finger .finger-pulse-ring {
        fill: none;
        stroke: transparent;
        transform-origin: center center;
      }

      /* ======================================================================
         Active Full-Body Illuminated Finger Elevation (Seamless & Natural)
         ====================================================================== */
      .interactive-finger.is-illuminated,
      .interactive-finger.is-active-finger {
        transform: translateY(-5px) scale(1.02);
        filter: drop-shadow(0 0 10px var(--finger-glow, var(--default-color)))
                drop-shadow(0 0 24px var(--finger-glow, var(--default-color)));
      }

      .interactive-finger.is-illuminated .finger-body,
      .interactive-finger.is-active-finger .finger-body {
        fill: var(--glow-gradient, var(--finger-color, var(--default-color))) !important;
        stroke: none !important;
      }

      .interactive-finger.is-illuminated .finger-rim,
      .interactive-finger.is-active-finger .finger-rim {
        stroke: #ffffff !important;
        stroke-width: 2.2px !important;
      }

      .interactive-finger.is-illuminated .finger-nail,
      .interactive-finger.is-active-finger .finger-nail {
        fill: #ffffff !important;
        stroke: #ffffff !important;
        filter: drop-shadow(0 0 6px #ffffff);
      }

      .interactive-finger.is-illuminated .finger-crease,
      .interactive-finger.is-active-finger .finger-crease {
        stroke: rgba(255, 255, 255, 0.8) !important;
      }

      .interactive-finger.is-illuminated .finger-pad,
      .interactive-finger.is-active-finger .finger-pad {
        fill: rgba(255, 255, 255, 0.85) !important;
        stroke: #ffffff !important;
        stroke-width: 2px !important;
        opacity: 0.95 !important;
      }

      .interactive-finger.is-illuminated .finger-pulse-ring,
      .interactive-finger.is-active-finger .finger-pulse-ring {
        stroke: #ffffff;
        animation: fingerRadarPulse 1.3s infinite ease-out;
      }

      @keyframes fingerRadarPulse {
        0% {
          r: 14px;
          opacity: 0.9;
          stroke-width: 3px;
        }
        100% {
          r: 32px;
          opacity: 0;
          stroke-width: 1px;
        }
      }

      /* 2-Second Idle Assistance Bounce */
      .interactive-finger.is-idle-stuck {
        animation: fingerIdleTap 0.65s infinite alternate ease-in-out !important;
      }

      @keyframes fingerIdleTap {
        0% {
          transform: translateY(-6px) scale(1.04);
        }
        50% {
          transform: translateY(-14px) scale(1.10);
        }
        100% {
          transform: translateY(-6px) scale(1.04);
        }
      }

      /* Multi-Key Modifier Badge */
      .combo-badge-tag {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 4px 10px;
        border-radius: 999px;
        font-weight: 800;
        background: #C58AF9;
        color: #1a1e36;
        box-shadow: 0 0 12px rgba(197, 138, 249, 0.7);
        animation: pulseTag 1s infinite alternate;
      }

      @keyframes pulseTag {
        from { transform: scale(1); }
        to { transform: scale(1.05); }
      }
    `;
    document.head.appendChild(style);
  }

  /**
   * Binds EventBus listeners
   * @param {Object} eventBus
   */
  bindEventBus(eventBus) {
    this.eventBus = eventBus;
    if (!this.eventBus || typeof this.eventBus.on !== 'function') return;

    // KEY_TARGET_CHANGED
    const unsubTarget = this.eventBus.on('KEY_TARGET_CHANGED', (payload) => {
      if (payload && payload.key !== undefined) {
        this.highlightKey(payload.key, payload.levelId !== undefined ? payload.levelId : this.currentLevelId);
      }
      this.resetIdleTimer();
    });

    // KEY_PRESSED_SUCCESS
    const unsubSuccess = this.eventBus.on('KEY_PRESSED_SUCCESS', () => {
      this.resetIdleTimer();
      this.stopIdleSuggestion();
    });

    // KEY_PRESSED_FAIL
    const unsubFail = this.eventBus.on('KEY_PRESSED_FAIL', () => {
      this.resetIdleTimer();
    });

    // USER_STUCK
    const unsubStuck = this.eventBus.on('USER_STUCK', () => {
      this.triggerIdleSuggestion();
    });

    this._eventDisposers.push(unsubTarget, unsubSuccess, unsubFail, unsubStuck);
  }

  /**
   * Sets the active level ID for modifier calculations
   * @param {number|string} levelId
   */
  setCurrentLevelId(levelId) {
    this.currentLevelId = levelId;
  }

  /**
   * Highlights the appropriate finger(s) for the target character.
   * Supports multi-key combinations illuminating BOTH primary and modifier fingers!
   * 
   * @param {string} charOrKey
   * @param {number|string} [levelId=null]
   */
  highlightKey(charOrKey, levelId = null) {
    this.clearHighlights();
    this.currentTargetKey = charOrKey;

    const effectiveLevel = levelId !== null ? levelId : this.currentLevelId;
    const combo = getMultiKeyFingerCombo(charOrKey, effectiveLevel);
    this.currentCombo = combo;

    // 1. Highlight Primary Finger
    if (combo.primaryFinger) {
      this._activateFinger(combo.primaryFinger, combo.primaryColor);
    }

    // 2. Highlight Modifier Finger if combo (e.g. Alt Gr with right thumb, Shift with opposite pinky)
    if (combo.isCombo && combo.modifierFinger) {
      this._activateFinger(combo.modifierFinger, combo.modifierColor || '#C58AF9');
    }

    // 3. Update dynamic hint banner in UI
    this._updateHintBanner(combo);
  }

  /**
   * Highlights an individual finger by its SVG element ID
   * @private
   * @param {string} fingerId
   * @param {string} color
   */
  _activateFinger(fingerId, color) {
    if (!fingerId) return;
    const el = document.getElementById(fingerId);
    if (!el) return;

    el.classList.add('is-illuminated', 'is-active-finger');
    el.style.setProperty('--finger-color', color);
    el.style.setProperty('--finger-glow', color);
    this.activeFingers.add(fingerId);
  }

  /**
   * Clears all highlighted fingers
   */
  clearHighlights() {
    this.activeFingers.forEach((fingerId) => {
      const el = document.getElementById(fingerId);
      if (el) {
        el.classList.remove('is-illuminated', 'is-active-finger', 'is-idle-stuck');
        el.style.removeProperty('--finger-color');
        el.style.removeProperty('--finger-glow');
      }
    });
    this.activeFingers.clear();
  }

  /**
   * Updates the on-screen hint banner (#current-finger-hint)
   * @private
   */
  _updateHintBanner(combo) {
    if (typeof document === 'undefined') return;

    const bannerEl = document.getElementById('current-finger-hint');
    if (!bannerEl) return;

    const badgeEl = document.getElementById('hint-finger-badge');
    const handNameEl = document.getElementById('hint-hand-name');
    const visualHelperEl = document.getElementById('hint-visual-helper');
    const arrowLeft = document.getElementById('hint-arrow-left');
    const arrowRight = document.getElementById('hint-arrow-right');

    if (combo.isCombo) {
      // Multi-key banner
      if (badgeEl) {
        badgeEl.textContent = `Combo: ${combo.labelText}`;
        badgeEl.style.backgroundColor = combo.modifierColor || '#C58AF9';
        badgeEl.style.color = '#12162a';
      }
      if (handNameEl) {
        handNameEl.textContent = '¡Usa ambas manos!';
      }
      if (arrowLeft) arrowLeft.style.opacity = '1';
      if (arrowRight) arrowRight.style.opacity = '1';
      if (visualHelperEl) {
        visualHelperEl.innerHTML = `⭐ Mantén <strong>${combo.combinationKeyName}</strong> y pulsa <strong>${combo.char}</strong>`;
      }
    } else {
      // Single key banner
      if (badgeEl) {
        badgeEl.textContent = combo.labelText;
        badgeEl.style.backgroundColor = combo.primaryColor;
        badgeEl.style.color = '#ffffff';
      }
      const hand = combo.primaryFinger.includes('-l-') ? 'Mano Izquierda' : 'Mano Derecha';
      if (handNameEl) {
        handNameEl.textContent = hand;
      }
      if (arrowLeft) arrowLeft.style.opacity = hand === 'Mano Izquierda' ? '1' : '0.2';
      if (arrowRight) arrowRight.style.opacity = hand === 'Mano Derecha' ? '1' : '0.2';
      if (visualHelperEl) {
        visualHelperEl.textContent = `⭐ Mira el dedo que brilla en tu ${hand}`;
      }
    }
  }

  /**
   * Resets the 2-second idle timer
   */
  resetIdleTimer() {
    if (this._idleTimer) {
      clearTimeout(this._idleTimer);
      this._idleTimer = null;
    }
    this.stopIdleSuggestion();

    if (this.currentTargetKey !== null) {
      this._idleTimer = setTimeout(() => {
        if (this.eventBus && typeof this.eventBus.emit === 'function') {
          this.eventBus.emit('USER_STUCK', {
            expectedKey: this.currentTargetKey,
            finger: this.currentCombo ? this.currentCombo.primaryFinger : null,
            idleTimeMs: this.idleThresholdMs
          });
        }
        this.triggerIdleSuggestion();
      }, this.idleThresholdMs);
    }
  }

  /**
   * Triggers the suggestive idle bounce animation on active fingers
   */
  triggerIdleSuggestion() {
    this._isIdleStuck = true;
    this.activeFingers.forEach((fingerId) => {
      const el = document.getElementById(fingerId);
      if (el) el.classList.add('is-idle-stuck');
    });
  }

  /**
   * Stops the suggestive bounce animation
   */
  stopIdleSuggestion() {
    this._isIdleStuck = false;
    this.activeFingers.forEach((fingerId) => {
      const el = document.getElementById(fingerId);
      if (el) el.classList.remove('is-idle-stuck');
    });
  }

  /**
   * Cleanup and unmount
   */
  dispose() {
    if (this._idleTimer) clearTimeout(this._idleTimer);
    this._eventDisposers.forEach(unsub => unsub());
    this._eventDisposers = [];
    this.clearHighlights();
  }
}
