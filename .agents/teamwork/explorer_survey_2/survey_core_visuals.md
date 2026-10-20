# Technical Survey & Architecture Design: Core Systems, Live Scene & Interactive Mascot (R1, R2, R3)

**Author:** Explorer Survey 2 (Core & Visual Systems Analyst)  
**Date:** 2026-10-18  
**Scope:** Requirements R1 (Core Architecture, EventBus, Storage, Modules, Dev Server), R2 (Live Scene, Parallax, Particles, Lighting, Sprites, Bézier Projectiles, Squash & Stretch), R3 (Procedural Mascot, Lip-Sync, Speech Bubble, 6-State FSM, Accessories).

---

## 1. Executive Summary & Architectural Overview

The transformation of *Mecano Aventura Kids* from a monolithic procedural script (`main.js` at 2,310 lines) into a modern, decoupled educational video game requires an architecture built on a high-throughput Pub/Sub **EventBus**, an isolated **ES Modules** domain layout, a resilient **StorageManager**, and a GPU-accelerated **Live Scene & VFX Engine**.

### 1.1 Directory & Domain Layout
To prevent team collisions and circular dependencies, code must be divided into five isolated modules with strict unidirectional data flow mediated entirely by the EventBus:

```
c:\mecano\Mecano-main\Mecano-main\
├── index.html                     # Clean entry point, modern HTML5 shell
├── server.js                      # Zero-dependency local Node dev server
├── test_harness.js                # Programmatic headless verification harness (R6)
├── style.css                      # Global styles, variables, typography, layouts
├── assets/                        # Static audio, realistic hand vectors, icons
├── Sprites/                       # Main Scene.png, Sprites Global.png, poses
└── src/
    ├── core/                      # R1: Architecture, Bus, State, Storage, Constants
    │   ├── EventBus.js            # Typed Pub/Sub with 7 event contracts
    │   ├── StorageManager.js      # LocalStorage wrapper (stars, heatmap, accessories)
    │   ├── GameEngine.js          # Main game loop, word progression, combo tracking
    │   ├── LevelManager.js        # Level definitions, curriculum, grading rules
    │   └── Constants.js           # Finger colors, timing thresholds, belt tiers
    ├── vfx/                       # R2: Live Scene, Parallax, VFX, Sprites, Particles
    │   ├── LiveSceneContainer.js  # Layer compositing and resize handling
    │   ├── ParallaxScene.js       # Smooth mouse/ambient parallax on Main Scene.png
    │   ├── ParticleSystem.js      # Ambient bubbles, stars, sparkle pools
    │   ├── ProjectileManager.js   # Quadratic Bézier projectiles & finger bursts
    │   ├── FeverLighting.js       # Dynamic golden/rainbow ambient radiance
    │   ├── SquashStretch.js       # Damped spring harmonic elastic deformer
    │   └── SpriteProcessor.js     # 3px sticker outline & drop-shadow filter
    ├── mascot/                    # R3: Mascot, Emotional AI, Animation, Accessories
    │   ├── MascotFSM.js           # 6-state finite state machine
    │   ├── ProceduralAnimator.js  # Sinusoidal breathing, look-at tilt, combo hops
    │   ├── LipSync.js             # Syllable mouth bounce and voice indicator
    │   ├── SpeechBubble.js        # Comic balloon with typewriter and key highlight
    │   ├── AccessorySocket.js     # Hat, glasses, and crown attachment slots
    │   └── MascotView.js          # DOM coordinator for avatar, badge, and belt
    ├── keyboard/                  # R4: Ergonomic Keyboard & Ghost Hands
    │   ├── VirtualKeyboard.js     # 3D key rendering, tactile bumps on F & J
    │   ├── GhostHands.js          # SVG hand overlay, finger glow, 2s idle pulse
    │   └── PedagogicalEngine.js   # Anti-frustration feedback, benevolent error shake
    └── audio/                     # R5: Web Audio, VoiceQueue & Accessibility
        ├── AudioManager.js        # Web Audio API engine, procedural sound synthesis
        ├── PentatonicScale.js     # C-D-E-G-A procedural success scales & dull thuds
        ├── VoiceQueue.js          # Web Speech API anti-overlap and rate limiting
        └── AccessibilityPanel.js  # Dyslexia font toggle, high-contrast mode, sliders
```

---

## 2. Requirement R1: Core Architecture, Typed EventBus & Persistence

### 2.1 Typed EventBus Contract & Specification

The `EventBus` is the central nervous system of Mecano. No module directly invokes methods on another module. All communication occurs via typed event emissions and subscriptions.

#### 2.1.1 The 7 Mandatory Typed Events

| Event Name | Producer(s) | Consumer(s) | Full Payload Type Contract | Description |
|---|---|---|---|---|
| `KEY_TARGET_CHANGED` | `GameEngine.js`, `LevelManager.js` | `ProceduralAnimator.js` (tilt), `GhostHands.js` (glow), `SpeechBubble.js` | `{ key: string, finger: FingerId, hand: 'left' \| 'right', screenPosition: { x: number, y: number } }` | Fired when the active target key changes. Provides screen coordinates for visual targeting. |
| `KEY_PRESSED_SUCCESS` | `VirtualKeyboard.js`, `GameEngine.js` | `ProjectileManager.js` (Bézier), `SquashStretch.js`, `MascotFSM.js`, `AudioManager.js` | `{ key: string, comboCount: number, accuracy: number, keyScreenPosition: { x: number, y: number } }` | Fired on correct key press. Triggers magic projectile, combo increments, and audio pentatonic chime. |
| `KEY_PRESSED_FAIL` | `VirtualKeyboard.js`, `GameEngine.js` | `StorageManager.js` (heatmap), `PedagogicalEngine.js` (shake), `MascotFSM.js`, `AudioManager.js` | `{ pressedKey: string, expectedKey: string, consecutiveErrors: number }` | Fired on wrong key press. Non-punitive: logs error for reinforcement, shakes key, emits dull wood tone. |
| `USER_STUCK` | `GameEngine.js` (idle monitor) | `MascotFSM.js` (`HELPER_POINTING`), `SpeechBubble.js`, `GhostHands.js` | `{ expectedKey: string, finger: FingerId, idleTimeMs: number }` | Fired when player hesitates on a key for $\ge 2000\text{ ms}$. Activates helper pointing and finger cue. |
| `FEVER_MODE_CHANGED` | `GameEngine.js` (combo evaluator) | `FeverLighting.js` (glow), `MascotFSM.js` (`FLOW_DANCE`), `AudioManager.js` | `{ isActive: boolean, multiplier: number }` | Fired when combo enters or leaves fever threshold ($\ge 8$ hits). Multiplier scales from $2\times$ to $3\times$. |
| `MASCOT_SPEAK_REQUEST` | `GameEngine.js`, `MascotFSM.js` | `SpeechBubble.js` (UI), `LipSync.js` (mouth), `VoiceQueue.js` (TTS) | `{ text: string, audioId?: string, priority: 'low' \| 'normal' \| 'high', emotion?: 'happy' \| 'thinking' \| 'victory' \| 'error' \| 'sleepy' }` | Dispatches mascot speech. Priority guarantees high-priority cues preempt idle chit-chat. |
| `LEVEL_COMPLETED` | `LevelManager.js`, `GameEngine.js` | `StorageManager.js` (save stars), `MascotFSM.js` (`HIGH_FIVE_WAIT`), `ParticleSystem.js` (confetti) | `{ levelId: string \| number, stars: number, accuracy: number, wpm: number }` | Fired upon completing all words in a level. Triggers high-five waiting state and victory screen. |

#### 2.1.2 Finger Identifier Union (`FingerId`)
```typescript
type FingerId = 
  | 'lp'      // Left Pinky (Meñique izquierdo - Coral/Rojo suave)
  | 'lr'      // Left Ring (Anular izquierdo - Naranja cálido)
  | 'lm'      // Left Middle (Corazón izquierdo - Amarillo sol)
  | 'li'      // Left Index (Índice izquierdo - Verde menta)
  | 'ri'      // Right Index (Índice derecho - Azul cielo)
  | 'rm'      // Right Middle (Corazón derecho - Amarillo sol)
  | 'rr'      // Right Ring (Anular derecho - Naranja cálido)
  | 'rp'      // Right Pinky (Meñique derecho - Violeta mágico / Lila)
  | 'thumb';  // Thumbs (Pulgares - Violeta mágico)
```

#### 2.1.3 EventBus Class Implementation Blueprint
```javascript
export class EventBus {
  constructor() {
    this._listeners = new Map();
    this._validEvents = new Set([
      'KEY_TARGET_CHANGED',
      'KEY_PRESSED_SUCCESS',
      'KEY_PRESSED_FAIL',
      'USER_STUCK',
      'FEVER_MODE_CHANGED',
      'MASCOT_SPEAK_REQUEST',
      'LEVEL_COMPLETED'
    ]);
  }

  on(event, callback) {
    if (!this._validEvents.has(event)) {
      console.warn(`[EventBus] Unrecognized event registered: ${event}`);
    }
    if (!this._listeners.has(event)) {
      this._listeners.set(event, new Set());
    }
    this._listeners.get(event).add(callback);
    return () => this.off(event, callback);
  }

  off(event, callback) {
    if (this._listeners.has(event)) {
      this._listeners.get(event).delete(callback);
    }
  }

  once(event, callback) {
    const wrapper = (payload) => {
      this.off(event, wrapper);
      callback(payload);
    };
    return this.on(event, wrapper);
  }

  emit(event, payload) {
    if (!this._validEvents.has(event)) {
      throw new Error(`[EventBus] Attempted to emit invalid event: ${event}`);
    }
    if (!this._listeners.has(event)) return;

    for (const callback of this._listeners.get(event)) {
      try {
        callback(payload);
      } catch (err) {
        console.error(`[EventBus] Error in listener for event "${event}":`, err);
      }
    }
  }

  clear() {
    this._listeners.clear();
  }
}

export const globalBus = new EventBus();
```

---

### 2.2 StorageManager Specification & Persistence Schema

`StorageManager` manages local persistence using `window.localStorage` with an automatic, silent in-memory fallback when running under Node.js test harnesses, browser privacy modes, or restricted iframes.

#### 2.2.1 Data Schema

```json
{
  "mecano_stars": {
    "1-indices": 3,
    "2-filaguia": 2,
    "3-vocales-ei": 3
  },
  "mecano_accessories": {
    "unlocked": ["hat-cap", "glasses-nerd", "crown-gold"],
    "equipped": {
      "hat": "hat-cap",
      "glasses": "glasses-nerd",
      "crown": null
    }
  },
  "mecano_error_heatmap": {
    "f": 2,
    "j": 1,
    "p": 14,
    "q": 9
  },
  "mecano_settings": {
    "soundEnabled": true,
    "voiceEnabled": true,
    "animationEnabled": true,
    "font": "default",
    "contrast": "normal",
    "volumes": { "music": 0.7, "sfx": 0.85, "voice": 1.0 }
  }
}
```

#### 2.2.2 StorageManager API Contract
- `getLevelStars(levelId: string): number` — Returns 0 to 3.
- `setLevelStars(levelId: string, stars: number): boolean` — Updates stars if new score is higher.
- `getTotalStars(): number` — Sum of all stars earned across all levels.
- `getErrorHeatmap(): Record<string, number>` — Full map of error counts per character.
- `recordError(char: string): void` — Increments error count for character in heatmap.
- `getMostProblematicKeys(limit?: number): string[]` — Returns sorted array of keys with highest error counts for pedagogical reinforcement.
- `getAccessories(): { unlocked: string[], equipped: { hat: string|null, glasses: string|null, crown: string|null } }`
- `unlockAccessory(id: string): boolean`
- `equipAccessory(slot: 'hat' | 'glasses' | 'crown', id: string | null): boolean`
- `resetAll(): void` — Wipes storage back to fresh initial state.

---

### 2.3 Lightweight Node.js Dev Server (`server.js`)

The project requires a zero-dependency dev server to serve native ES modules without CORS errors or incorrect MIME types:

```javascript
// server.js - Native Node.js HTTP Server for Mecano ES Modules
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PORT = process.env.PORT || 3000;

const MIME_TYPES = {
  '.html': 'text/html; charset=UTF-8',
  '.js': 'application/javascript; charset=UTF-8',
  '.mjs': 'application/javascript; charset=UTF-8',
  '.css': 'text/css; charset=UTF-8',
  '.json': 'application/json; charset=UTF-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.wav': 'audio/wav',
  '.mp3': 'audio/mpeg',
  '.mp4': 'video/mp4'
};

const server = http.createServer((req, res) => {
  // Parse URL and sanitize path
  const parsedUrl = new URL(req.url, `http://${req.headers.host}`);
  let pathname = decodeURIComponent(parsedUrl.pathname);
  if (pathname === '/') pathname = '/index.html';

  const filePath = path.normalize(path.join(__dirname, pathname));

  // Security: prevent path traversal outside root
  if (!filePath.startsWith(__dirname)) {
    res.writeHead(403, { 'Content-Type': 'text/plain' });
    res.end('403 Forbidden');
    return;
  }

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end(`404 Not Found: ${pathname}`);
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    res.writeHead(200, {
      'Content-Type': contentType,
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Access-Control-Allow-Origin': '*'
    });

    const stream = fs.createReadStream(filePath);
    stream.pipe(res);
  });
});

server.listen(PORT, () => {
  console.log(`🚀 Mecano Aventura Kids server running at http://localhost:${PORT}/`);
});
```

---

### 2.4 Video Decoupling Strategy

#### Existing Code Defect
In `index.html`:
```html
<video id="background-video" class="background-video" autoplay muted loop playsinline preload="auto">
  <source src="assets/animated_bg.mp4" type="video/mp4" />
</video>
```
Investigation revealed that:
1. `assets/animated_bg.mp4` does not exist in `assets/` (only an unlinked file `Sprites/3BqzFY3HM4hQrosUUUpkNCSF90u.mp4` exists).
2. `style.css` hides the video with `display: none; opacity: 0;`.
3. The video element wastes DOM memory and attempts network requests that fail silently.

#### Modern Solution
Remove the `<video>` element entirely. Replace `.background-fallback` and `.background-video` with a dedicated `#live-scene-container` hosting three composited sub-layers:
1. `#parallax-canvas`: Hardware-accelerated canvas rendering `Main Scene.png` with smooth multi-axis parallax.
2. `#ambient-particles-canvas`: Floating bubbles and gentle golden stars.
3. `#fever-lighting-overlay`: Dynamic radiant lighting filter reacting to `FEVER_MODE_CHANGED`.

---

## 3. Requirement R2: Live Scene, Technical Art & VFX Engine

### 3.1 Live Scene Container Architecture & Layer Compositing

```
+-----------------------------------------------------------------------------------+
|  #live-scene-container (position: fixed; inset: 0; overflow: hidden;)             |
|                                                                                   |
|  [Layer 0 - z:0]  #parallax-canvas        (Main Scene.png at scale 1.08, lerp)    |
|  [Layer 1 - z:1]  #ambient-particles      (Soft bubbles, golden stars, dust)      |
|  [Layer 2 - z:2]  #fever-lighting-overlay (Dynamic radial glow & edge vignette)   |
|                                                                                   |
|  [Layer 3 - z:10] .overlay / UI Shell     (Top Bar, Mascot, Word Panel, Keyboard) |
|                                                                                   |
|  [Layer 4 - z:20] #projectile-vfx-canvas  (Bézier magic arcs & finger color bursts)|
|  [Layer 5 - z:30] #confetti-canvas        (High-five & level victory celebration) |
+-----------------------------------------------------------------------------------+
```

### 3.2 Parallax Effect on `Main Scene.png`

The background image is `Sprites/Main Scene.png` (exact resolution: $1408 \times 768\text{ px}$, identical copy at `assets/main_scene.png`).

#### 3.2.1 Motion Formulation & Smoothing

To ensure the image never exposes borders when shifted, the canvas renders the image with a scale factor $S = 1.08$, providing a movement gutter of:
$$\Delta X_{\text{max}} = \frac{W_{\text{viewport}} \cdot (S - 1)}{2} \approx 40\text{ px}$$
$$\Delta Y_{\text{max}} = \frac{H_{\text{viewport}} \cdot (S - 1)}{2} \approx 25\text{ px}$$

The instantaneous target offset combines user mouse position $(M_x, M_y)$ and an autonomous living sine-wave drift:

$$\text{normX} = \text{clamp}\left(\frac{M_x}{W_{\text{window}}} \cdot 2 - 1, -1, 1\right)$$
$$\text{normY} = \text{clamp}\left(\frac{M_y}{H_{\text{window}}} \cdot 2 - 1, -1, 1\right)$$

$$\text{driftX}(t) = \sin(t \cdot 0.0006) \cdot 6.0\text{ px}$$
$$\text{driftY}(t) = \cos(t \cdot 0.0004) \cdot 4.0\text{ px}$$

$$\text{TargetX}(t) = -\text{normX} \cdot \Delta X_{\text{max}} + \text{driftX}(t)$$
$$\text{TargetY}(t) = -\text{normY} \cdot \Delta Y_{\text{max}} + \text{driftY}(t)$$

#### 3.2.2 Frame-Rate Independent Exponential Smoothing (Lerp)
$$\text{CurrentX}(t + \Delta t) = \text{CurrentX}(t) + (\text{TargetX} - \text{CurrentX}(t)) \cdot \left(1 - e^{-\lambda \cdot \Delta t}\right)$$
where $\lambda = 3.5\text{ s}^{-1}$. This produces ultra-smooth, buttery camera movement that gracefully recovers when the mouse leaves the viewport.

---

### 3.3 Ambient Particle System

The ambient particle system operates on an offscreen/onscreen canvas using an **Object Pool** of 50 pre-allocated particle structs (preventing garbage collector spikes):

```javascript
class AmbientParticle {
  constructor() {
    this.x = 0;
    this.y = 0;
    this.radius = 0;
    this.speedY = 0;
    this.wobbleFreq = 0;
    this.wobbleAmp = 0;
    this.phase = 0;
    this.color = '';
    this.type = 'bubble'; // 'bubble' | 'star' | 'dust'
    this.alpha = 0;
    this.maxAlpha = 0;
    this.lifetime = 0;
    this.age = 0;
    this.active = false;
  }
}
```

#### 3.3.1 Particle Types & Dynamics
1. **Gentle Bubbles**: Translucent circular orbs ($r = 6\text{ to }16\text{ px}$) with a specular highlight.
   - Speed: $v_y = -25\text{ to }-55\text{ px/s}$.
   - Horizontal sway: $x(t) = x_0 + \sin(\text{phase} + t \cdot \omega) \cdot A$ ($A = 15\text{ to }30\text{ px}$, $\omega = 1.2\text{ rad/s}$).
   - Color palette: `rgba(162, 155, 254, 0.45)`, `rgba(116, 185, 255, 0.40)`, `rgba(85, 239, 196, 0.35)`.
2. **Soft Golden Stars**: 4-point rotating diamond stars ($r = 4\text{ to }10\text{ px}$).
   - Twinkle formula: $\alpha(t) = \alpha_{\text{max}} \cdot \left(0.6 + 0.4 \sin(t \cdot 3.5 + \text{phase})\right)$.
   - Color palette: `#ffd32a`, `#ffeaa7`, `#fff`.
3. **Dust Motes**: Slow, minute glowing specks ($r = 1.5\text{ to }3\text{ px}$) simulating sunbeams in a classroom.

---

### 3.4 Fever Mode Lighting System

Triggered on `FEVER_MODE_CHANGED { isActive, multiplier }`:

```
Normal Mode                                Fever Mode Active (combo >= 8)
[ Main Scene + Particles ]  ---------->    [ Scene + Golden Radiance + Chromatic Aura + 2x Particles ]
```

#### 3.4.1 Lighting Shaders & Filters
- **Edge Radiance**: CSS dynamic box-shadow or canvas radial gradient:
  ```css
  .fever-active #fever-lighting-overlay {
    opacity: 1;
    background: radial-gradient(circle at 50% 40%, rgba(255, 215, 0, 0.22) 0%, rgba(255, 107, 129, 0.15) 60%, rgba(155, 89, 182, 0.35) 100%);
    box-shadow: inset 0 0 80px 25px rgba(255, 215, 0, 0.5), inset 0 0 150px rgba(255, 107, 129, 0.3);
    animation: feverPulse 1.4s ease-in-out infinite alternate;
  }
  @keyframes feverPulse {
    0% { filter: brightness(1.0) saturate(1.2); }
    100% { filter: brightness(1.15) saturate(1.45); }
  }
  ```
- **Particle Acceleration**: When fever mode is active, ambient particle emission doubles, horizontal wobble speed increases by $1.8\times$, and golden sparkle particles dominate the screen.

---

### 3.5 Unified 3px Sticker Outline & Drop-Shadow Filter

#### Problem Discovered in Assets
Pixel-level analysis of `Sprites Global.png` and `assets/robot_*.png` revealed that sprite illustrations have either solid white background pixels (`#ffffff`) or baked-in checkerboards. If rendered over `Main Scene.png`, raw rectangles or ragged edges would appear.

#### Technical Solution: Chroma-Keying + 3px Sticker Outline

```
[ Raw Sprite (White BG) ]
         │
         ▼ (Offscreen Canvas / ImageData Pipeline)
[ Chroma-Key Filter: (r>245 && g>245 && b>245) => alpha=0 ]
         │
         ▼ (Transparent PNG Sprite)
[ SVG / CSS 3px Sticker Dilation + Drop Shadow Filter ]
         │
         ▼
[ Clean Vinyl Toy Sticker Aesthetic with 3px White Outline & 6px Shadow ]
```

#### SVG Sticker Filter Definition
```xml
<svg style="position: absolute; width: 0; height: 0; overflow: hidden;" aria-hidden="true">
  <defs>
    <filter id="sticker-outline-3px" x="-20%" y="-20%" width="140%" height="140%">
      <!-- 1. Dilate alpha mask outward by 3px -->
      <feMorphology in="SourceAlpha" operator="dilate" radius="3" result="dilatedAlpha" />
      <!-- 2. Flood with pure white -->
      <feFlood flood-color="#ffffff" flood-opacity="1" result="whiteColor" />
      <feComposite in="whiteColor" in2="dilatedAlpha" operator="in" result="whiteOutline" />
      <!-- 3. Cast a smooth drop-shadow under the outline -->
      <feDropShadow in="whiteOutline" dx="0" dy="6" stdDeviation="6" flood-color="rgba(15, 17, 35, 0.45)" result="dropShadow" />
      <!-- 4. Composite: Shadow under Outline under Original Graphic -->
      <feMerge>
        <feMergeNode in="dropShadow" />
        <feMergeNode in="whiteOutline" />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>
  </defs>
</svg>
```

#### CSS Application
```css
.mascot-avatar,
.sticker-sprite {
  filter: url(#sticker-outline-3px);
  will-change: transform, filter;
}
```

---

### 3.6 Magic Projectiles on Quadratic Bézier Curves

On `KEY_PRESSED_SUCCESS { key, comboCount, accuracy, keyScreenPosition }`:

```
   P1 (Control Point: High Arch)
       * .  :  .
     *           .
    *             .  P2 (Target: Mascot Chest Socket)
   *                🤖
  *
 P0 (Source: Key Pressed Screen Position)
 ⌨️ [F]
```

#### 3.6.1 Mathematical Formulation

1. **Origin Point $P_0$**: Center of the pressed key:
   $$P_0 = (x_0, y_0) = \text{keyScreenPosition}$$

2. **Destination Point $P_2$**: Center of the mascot avatar:
   $$P_2 = (x_2, y_2) = \text{mascotScreenPosition}$$

3. **Control Point $P_1$**:
   - Midpoint: $M_x = \frac{x_0 + x_2}{2}, \quad M_y = \frac{y_0 + y_2}{2}$.
   - Arc Height ($H_{\text{arc}}$): Between $110\text{ px}$ and $160\text{ px}$ (proportional to horizontal distance):
     $$H_{\text{arc}} = \max\left(100, 0.35 \cdot |x_2 - x_0|\right) + \text{random}(-15, 15)$$
   - Lateral Curve Offset: Curves slightly outward depending on whether key was struck with left or right hand:
     $$\text{lateralOffset} = (\text{hand} === 'left') ? -35\text{ px} : +35\text{ px}$$
   - Resulting $P_1$:
     $$P_1 = (M_x + \text{lateralOffset}, \min(y_0, y_2) - H_{\text{arc}})$$

4. **Quadratic Bézier Trajectory**:
   $$B(t) = (1 - t)^2 P_0 + 2(1 - t)t P_1 + t^2 P_2, \quad t \in [0, 1]$$

5. **Timing & Easing**:
   - Total flight duration: $T = 450\text{ ms}$ (reduced to $320\text{ ms}$ during fever mode).
   - Easing: $t = \text{easeOutQuad}(\text{elapsed} / T) = 1 - (1 - \tau)^2$.

#### 3.6.2 Finger Color Palette Mapping
Every projectile and its trail sparkles adopt the pedagogical color of the striking finger:

| Finger ID | Finger Name | Hex Color | Projectile Trail Visual |
|---|---|---|---|
| `lp` | Left Pinky | `#ff6b81` | Coral / soft red glowing orb with star sparks |
| `lr` | Left Ring | `#ff9f43` | Warm orange flame sparkles |
| `lm` | Left Middle | `#ffd32a` | Sun yellow electric specks |
| `li` | Left Index | `#2ed573` | Mint green magic motes |
| `ri` | Right Index | `#00d2d3` / `#54a0ff` | Sky blue starlight |
| `rm` | Right Middle | `#ffd32a` | Sun yellow electric specks |
| `rr` | Right Ring | `#ff9f43` | Warm orange flame sparkles |
| `rp` | Right Pinky | `#a29bfe` | Magic violet / lilac fairy dust |
| `thumb` | Thumbs (Space) | `#9b59b6` | Cosmic purple energy rings |

#### 3.6.3 Impact Burst & Mascot Contact
When $t = 1.0$:
- Projectile detonates at $P_2$.
- Emits 18 radial burst particles with randomized velocity:
  $$v_x = \cos(\theta) \cdot v_0, \quad v_y = \sin(\theta) \cdot v_0, \quad v_0 \in [120, 260]\text{ px/s}$$
  $$\text{gravity } g = 320\text{ px/s}^2, \quad \text{lifespan } = 400\text{ to }650\text{ ms}$$
- Instantly triggers `applySquashAndStretch(mascotAvatar)`!

---

### 3.7 Damped Spring `applySquashAndStretch`

To give Roby tactile "game juice", every impact triggers an elastic deformation that preserves volume without permanent distortion:

#### 3.7.1 Physics Model: Damped Harmonic Oscillator
$$s_x(t) = 1.0 + A \cdot e^{-\zeta \omega_n t} \cos(\omega_d t)$$
$$s_y(t) = \frac{1.0}{s_x(t)} \approx 2.0 - s_x(t)$$

where:
- Initial Amplitude $A = 0.20$ (20% maximum deformation).
- Damping Ratio $\zeta = 0.42$ (fast settle, 3 visible oscillations).
- Natural Frequency $\omega_n = 26\text{ rad/s}$.
- Damped Frequency $\omega_d = \omega_n \sqrt{1 - \zeta^2} \approx 23.6\text{ rad/s}$.

#### 3.7.2 Web Animations API Implementation
```javascript
export function applySquashAndStretch(element, intensity = 1.0) {
  if (!element) return;

  const amp = 0.18 * intensity;
  
  // Transform origin set to bottom center so mascot stays grounded
  element.style.transformOrigin = '50% 85%';

  element.animate([
    { transform: 'scale(1.0, 1.0)', offset: 0 },
    // 1. Initial Impact Squash (widens and compresses)
    { transform: `scale(${1 + amp * 1.1}, ${1 - amp * 0.9})`, offset: 0.18 },
    // 2. Elastic Stretch Recoil (shoots tall and thin)
    { transform: `scale(${1 - amp * 0.65}, ${1 + amp * 0.75})`, offset: 0.42 },
    // 3. Secondary Damped Rebound
    { transform: `scale(${1 + amp * 0.3}, ${1 - amp * 0.35})`, offset: 0.68 },
    // 4. Settle back to rest
    { transform: 'scale(1.0, 1.0)', offset: 1.0 }
  ], {
    duration: 380,
    easing: 'cubic-bezier(0.25, 1, 0.5, 1)',
    fill: 'none'
  });
}
```

---

## 4. Requirement R3: Interactive Mascot, Procedural Animation & Emotional AI

### 4.1 Procedural Mascot Animator

Roby is animated procedurally via continuous mathematical equations layered over CSS transforms:

$$\text{Transform}_{\text{total}} = \text{TranslateY}(\text{breathing} + \text{jump}) \times \text{Rotate}(\text{tilt}) \times \text{Scale}(\text{squash})$$

#### 4.1.1 Sinusoidal Breathing Equation
During `IDLE`, Roby gently bobs up and down:
$$Y_{\text{breath}}(t) = A_b \cdot \sin\left(\frac{2\pi \cdot t}{T_b}\right)$$
$$\text{ScaleY}_{\text{breath}}(t) = 1.0 + A_{\text{scale}} \cdot \sin\left(\frac{2\pi \cdot t}{T_b} - \frac{\pi}{4}\right)$$
where:
- Period $T_b = 2.6\text{ seconds}$ (calm, resting respiratory rate).
- Vertical Amplitude $A_b = 4.0\text{ px}$.
- Scale Amplitude $A_{\text{scale}} = 0.02$ (2% subtle chest expansion).

#### 4.1.2 Look-At Tilt ($-4^\circ$ to $+4^\circ$)
When `KEY_TARGET_CHANGED { screenPosition }` fires:
1. Calculate horizontal difference between key center $X_{\text{key}}$ and keyboard center $X_{\text{keyboard}}$:
   $$\text{ratio} = \text{clamp}\left(\frac{X_{\text{key}} - X_{\text{keyboard}}}{\text{keyboardHalfWidth}}, -1.0, 1.0\right)$$
2. Compute target tilt angle:
   $$\theta_{\text{target}} = \text{ratio} \cdot 4.0^\circ$$
3. Smoothly interpolate current tilt angle:
   $$\theta(t + \Delta t) = \theta(t) + (\theta_{\text{target}} - \theta(t)) \cdot \left(1 - e^{-8.0 \cdot \Delta t}\right)$$
Result: Roby leans curiously left by up to $-4^\circ$ when the child needs to press `A`, `S`, `D`, `F`, and leans right by up to $+4^\circ$ for `J`, `K`, `L`, `Ñ`.

#### 4.1.3 Combo Jumps
- **Micro-Hop** (Combo $\ge 3$): Instantaneous vertical velocity impulse $v_y = -120\text{ px/s}$, gravity $g = 600\text{ px/s}^2$ ($8\text{ px}$ height, $220\text{ ms}$ duration).
- **Power Jump** (Combo is multiple of 5): $v_y = -220\text{ px/s}$ ($24\text{ px}$ height, $380\text{ ms}$ duration) accompanied by excited wing vibration.

---

### 4.2 Simulated Dynamic Lip-Sync & Comic Speech Bubble

#### 4.2.1 Lip-Sync Engine
Whenever Roby is speaking (`isSpeaking === true` or Web Speech API active):
- Procedural mouth oscillation:
  $$S_{\text{mouth}}(t) = 1.0 + A_{\text{talk}} \cdot \left|\sin(2\pi \cdot f_{\text{talk}} \cdot t)\right|$$
  where $f_{\text{talk}} = 4.8\text{ Hz}$ (approx. 4 to 5 syllables per second) and $A_{\text{talk}} = 0.22$.
- Voice wave indicator: Three animated SVG bars in `#voice-wave-indicator` scale dynamically with amplitude.

#### 4.2.2 Comic Speech Bubble Architecture
- **Bubble Geometry**: Rounded cartoon speech bubble with an SVG pointer anchor directed at Roby's antenna.
- **Pedagogical Key Highlighter**: A text parser parses tokens like `[F]` or `[J]` in dialogue strings and transforms them into colored pill badges matching the target finger color:
  ```javascript
  export function formatDialogueText(rawText) {
    return rawText.replace(/\[([A-Z0-9,\.\- ])\]/g, (match, key) => {
      const finger = getFingerForKey(key);
      return `<span class="bubble-key-highlight finger-${finger}">${key}</span>`;
    });
  }
  ```
- **Typewriter Effect**: Emits characters at 20ms intervals with audio bleeps, skippable if the child starts typing.

---

### 4.3 6-State Mascot Finite State Machine (FSM)

```
                       ┌──────────────┐
                       │    SLEEPY    │
                       └──────┬───────┘
          idle >= 25s         │ keydown (wake up)
         ┌────────────────────┼───────────────────┐
         ▼                    ▼                   │
    ┌─────────┐   combo >= 8   ┌────────────┐     │
    │         ├───────────────►│ FLOW_DANCE │     │
    │  IDLE   │◄───────────────┤            │     │
    │         │  combo reset   └────────────┘     │
    └────┬────┘                                   │
         │ USER_STUCK (idle 2s)                   │
         ├───────────────────┐                    │
         ▼                   ▼                    │
┌─────────────────┐  LEVEL_COMPLETED              │
│ HELPER_POINTING │          │                    │
└────────┬────────┘          ▼                    │
         │            ┌─────────────────┐         │
         │ key press  │ HIGH_FIVE_WAIT  │         │
         └───────────►└──────┬──────────┘         │
                             │ Spacebar pressed   │
                             ▼                    │
                      ┌───────────────┐           │
                      │  CELEBRATING  │───────────┘
                      └───────────────┘ next level / map
```

#### 4.3.1 Detailed State Inventory

| State Name | Trigger Condition | Visual Pose / Sprite Frame | Procedural Behavior | Dialogue / Speech Cue |
|---|---|---|---|---|
| `IDLE` | Default state, active typing | `Neutral` (`Sprites Global [0, 0]` or `assets/robot_happy.png`) | Sinusoidal breathing, blinking every 3.5s, look-at tilt $\pm 4^\circ$ tracking target key. | Friendly encouraging remarks. |
| `FLOW_DANCE` | `FEVER_MODE_CHANGED { isActive: true }` or `comboCount >= 8` | `Happy` (`Sprites Global [0, 1]`) / `Typing Combo` (`[2, 4]`) | Rhythmic lateral dance sway ($\pm 6^\circ$, $1.8\text{ Hz}$), floating heart-eyes, rainbow aura. | *"¡Tus dedos vuelan como cohetes! 🚀"* |
| `HELPER_POINTING` | `USER_STUCK` ($\ge 2000\text{ ms}$ idle on same target key) | `Front-Right Pointing` (`Sprites Global [1, 3]` or `assets/robot_reading.png`) | Roby points right arm toward the target key; ghost hands pulse simultaneously. | *"¡Prueba con el dedo [fingerName] en la tecla [Key]! 💡"* |
| `SLEEPY` | 25 seconds of continuous user inactivity | `Sleeping` (`Sprites Global [2, 3]` or `assets/robot_sleeping.png`) | Roby drops down $15\text{ px}$, eyes close, floating "Zzz..." particles rise slowly. | *"Zzz... ¿Te has dormido? Pulsa cualquier tecla para jugar."* |
| `HIGH_FIVE_WAIT` | `LEVEL_COMPLETED` event | `Victory High Five` (`Sprites Global [2, 0]` or `assets/robot_victory.png`) | Roby raises glowing palm high in the air, bouncing expectantly. | *"¡Choca esos cinco! ¡Pulsa la tecla ESPACIO! ✋⭐"* |
| `CELEBRATING` | Spacebar pressed during `HIGH_FIVE_WAIT` | `Victory Celebration` (`Sprites Global [2, 2]` with trophy) | High-five sound effect, $360^\circ$ victory flip, screen-wide confetti explosion. | *"¡Yuhuuu! ¡Misión completada, campeón! 🎉"* |

---

### 4.4 Accessory Socket System

Roby features a dynamic accessory socket system that allows hats, glasses, and crowns to be attached directly to the mascot container and inherit all procedural rotations, tilts, and squash & stretch deformations:

```
        [ Head Socket ]  ──> Hats (Wizard Hat, Baseball Cap, Crown)
             \
              🤖  ──> [ Eyes Socket ] ──> Glasses (Cool Sunglasses, Nerd Glasses, Star Glasses)
             /
        [ Neck Socket ]  ──> Belts & Medals (White, Yellow, Green, Black Belt & Corona)
```

#### 4.4.1 Socket Relative Anchors (Normalized Coordinates)
```javascript
export const MASCOT_SOCKETS = {
  head: {
    top: '7%',
    left: '50%',
    transform: 'translate(-50%, -100%)'
  },
  eyes: {
    top: '39%',
    left: '50%',
    transform: 'translate(-50%, -50%)'
  },
  neck: {
    top: '74%',
    left: '50%',
    transform: 'translate(-50%, 0)'
  }
};
```

#### 4.4.2 Accessory Catalog & Star Unlock Progression
All unlocks are persisted in `StorageManager` under `mecano_accessories`:

| Accessory ID | Slot | Name | Star Cost | Visual Description |
|---|---|---|---|---|
| `hat-cap` | `head` | Gorra de Aventurero | 3 ⭐ | Red and white sporty cap turned backward |
| `glasses-nerd` | `eyes` | Gafas de Búho Sabio | 6 ⭐ | Large round scholarly glasses with cute shine |
| `hat-wizard` | `head` | Sombrero de Mago | 10 ⭐ | Pointy midnight blue wizard hat with yellow stars |
| `glasses-star` | `eyes` | Gafas Pop Estelares | 15 ⭐ | Star-shaped funky sunglasses |
| `glasses-cool` | `eyes` | Gafas de Sol Pixel | 20 ⭐ | Black 8-bit retro sunglasses |
| `crown-gold` | `head` | Corona de Gran Maestro | 24 ⭐ | Radiant gold royal crown with rubies & emeralds |

---

## 5. Sprite Coordinates & Asset Mapping Reference

### 5.1 `Sprites Global.png` Grid Map ($1408 \times 768\text{ px}$)
`Sprites Global.png` is organized into a header bar ($60\text{ px}$ height) followed by a $6 \times 3$ grid of 18 distinct poses ($234.66\text{ px}$ cell width, $236\text{ px}$ cell height):

```
       Col 0        Col 1        Col 2        Col 3        Col 4        Col 5
     (0-234px)   (235-469px)  (470-704px)  (705-938px)  (939-1173px) (1174-1408px)
   +------------+------------+------------+------------+------------+------------+
R0 |  Neutral   |   Happy    | Thoughtful |   Error    |   Neutro   | Front-Tie  |
   | (60-296px) |            |            |            |            |            |
   +------------+------------+------------+------------+------------+------------+
R1 | Front-Left |Front-Right |Typing Fast |Pointing R. |Left Neutro |Right Flying|
   |(296-532px) |            |            |            |            |            |
   +------------+------------+------------+------------+------------+------------+
R2 |Exito Hands |Right Flying|Victory Cele|  Sleeping  |Typing Combo|  Reading   |
   |(532-768px) |            |            |            |            |            |
   +------------+------------+------------+------------+------------+------------+
```

### 5.2 Exact Pixel Rectangles for CSS Spritesheet Clipping

```javascript
export const SPRITE_SHEET_COORDINATES = {
  // Row 0
  neutral:       { x: 0,    y: 60,  w: 234, h: 236 },
  happy:         { x: 235,  y: 60,  w: 234, h: 236 },
  thoughtful:    { x: 470,  y: 60,  w: 234, h: 236 },
  error:         { x: 705,  y: 60,  w: 234, h: 236 },
  neutroAngled:  { x: 939,  y: 60,  w: 234, h: 236 },
  frontTie:      { x: 1174, y: 60,  w: 234, h: 236 },

  // Row 1
  frontLeft:     { x: 0,    y: 296, w: 234, h: 236 },
  frontRight:    { x: 235,  y: 296, w: 234, h: 236 },
  typingFast:    { x: 470,  y: 296, w: 234, h: 236 },
  pointingRight: { x: 705,  y: 296, w: 234, h: 236 },
  leftNeutro:    { x: 939,  y: 296, w: 234, h: 236 },
  rightFlying1:  { x: 1174, y: 296, w: 234, h: 236 },

  // Row 2
  highFiveExito: { x: 0,    y: 532, w: 234, h: 236 },
  rightFlying2:  { x: 235,  y: 532, w: 234, h: 236 },
  victoryCeleb:  { x: 470,  y: 532, w: 234, h: 236 },
  sleeping:      { x: 705,  y: 532, w: 234, h: 236 },
  typingCombo:   { x: 939,  y: 532, w: 234, h: 236 },
  reading:       { x: 1174, y: 532, w: 234, h: 236 }
};
```

### 5.3 FSM State to Sprite Mapping

| FSM State | Primary Sprite Source | Fallback High-Res Asset |
|---|---|---|
| `IDLE` | `SPRITE_SHEET_COORDINATES.neutral` | `assets/robot_happy.png` |
| `FLOW_DANCE` | `SPRITE_SHEET_COORDINATES.typingCombo` / `happy` | `assets/robot_happy.png` |
| `HELPER_POINTING` | `SPRITE_SHEET_COORDINATES.pointingRight` | `assets/robot_reading.png` |
| `SLEEPY` | `SPRITE_SHEET_COORDINATES.sleeping` | `assets/robot_sleeping.png` |
| `HIGH_FIVE_WAIT` | `SPRITE_SHEET_COORDINATES.highFiveExito` | `assets/robot_victory.png` |
| `CELEBRATING` | `SPRITE_SHEET_COORDINATES.victoryCeleb` | `assets/robot_victory.png` |

---

## 6. Data Flow & Inter-Module Communication Architecture

```
                    ┌─────────────────────────┐
                    │      Browser DOM        │
                    │   Keyboard / Pointer    │
                    └────────────┬────────────┘
                                 │ keydown
                                 ▼
                    ┌─────────────────────────┐
                    │   VirtualKeyboard.js    │ (R4)
                    └────────────┬────────────┘
                                 │
           ┌─────────────────────┴─────────────────────┐
           │                                           │
           ▼                                           ▼
 [ KEY_PRESSED_SUCCESS ]                     [ KEY_PRESSED_FAIL ]
           │                                           │
           ├──────────────────────────────┐            ├────────────────────────┐
           ▼                              ▼            ▼                        ▼
┌──────────────────────┐      ┌──────────────────────┐┌──────────────────────┐ ┌──────────────────────┐
│  ProjectileManager   │ (R2) │      MascotFSM       ││  StorageManager.js   │ │  PedagogicalEngine   │
│ Bézier Arc to Mascot │      │   Hop / Flow Dance   ││   Record Heatmap     │ │  Non-punitive Shake  │
└──────────┬───────────┘      └──────────────────────┘└──────────────────────┘ └──────────────────────┘
           │ on arrival (t=1)
           ▼
┌──────────────────────┐
│ SquashStretch (R2)   │
│ Roby bounces 380ms   │
└──────────────────────┘
```

---

## 7. Recommendations for Milestone Implementation

1. **Phase 1 (Core & Bus)**: Implement `src/core/EventBus.js` and `src/core/StorageManager.js` with comprehensive standalone unit tests. Create `server.js`.
2. **Phase 2 (Visual Scene & VFX)**: Implement `src/vfx/ParallaxScene.js`, `src/vfx/ParticleSystem.js`, and `src/vfx/ProjectileManager.js`. Connect projectile emission to `KEY_PRESSED_SUCCESS`. Add the SVG sticker filter.
3. **Phase 3 (Mascot & State Machine)**: Implement `src/mascot/MascotFSM.js`, `src/mascot/ProceduralAnimator.js`, `src/mascot/LipSync.js`, and `src/mascot/AccessorySocket.js`. Wire up transitions for `USER_STUCK` and `LEVEL_COMPLETED`.
4. **Phase 4 (Automated Harness Readiness)**: Ensure all classes can run headlessly in Node.js (mocking `window`, `document`, and `localStorage` when absent) so `node test_harness.js` executes with 100% pass rate.
