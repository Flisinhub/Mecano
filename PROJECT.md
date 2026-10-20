# Project: Mecano — Educational Typing Game for Children

## Architecture
Mecano is structured as an educational typing game for children (ages 6–11) using a modern, decoupled event-driven architecture.
The architecture replaces the previous monolithic `main.js` and dead background video with 5 independent ES modules communicating strictly through a typed Pub/Sub `EventBus`:

```
                 ┌────────────────────────────────────────────────────────┐
                 │                 src/core/EventBus.js                   │
                 └──────────────┬──────────────────┬──────────────┬───────┘
                                │                  │              │
           ┌────────────────────┼──────────────────┼──────────────┴──────────────────┐
           ▼                    ▼                  ▼                                 ▼
   ┌──────────────┐     ┌──────────────┐   ┌───────────────┐                  ┌─────────────┐
   │   src/vfx/   │     │ src/mascot/  │   │ src/keyboard/ │                  │ src/audio/  │
   │  LiveScene   │     │  MascotFSM   │   │  ToyKeyboard  │                  │ Procedural  │
   │  Particles   │     │  Animator    │   │  GhostHands   │                  │   Audio     │
   │  Projectiles │     │   LipSync    │   │   Pedagogy    │                  │ VoiceQueue  │
   │SquashStretch │     │ SpeechBubble │   │  LayoutDef    │                  │    A11y     │
   └──────────────┘     └──────────────┘   └───────────────┘                  └─────────────┘
           │                    │                  │                                 │
           └────────────────────┴──────────────────┴─────────────────────────────────┘
                                          │
                                          ▼
                               ┌──────────────────────┐
                               │     src/main.js      │
                               │      index.html      │
                               │      style.css       │
                               └──────────────────────┘
```

A standalone verification harness `test_harness.js` runs in headless Node.js (zero external dependencies) and validates all module contracts, FSM state transitions, persistence, and event flows.

---

## Feature Inventory
Every feature from the survey and requirements is assigned to a milestone:

| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| 1 | ES Modules Directory Layout | Isolated modules in `src/core/`, `src/vfx/`, `src/mascot/`, `src/keyboard/`, `src/audio/` | M1 | R1 |
| 2 | Typed EventBus | Pub/Sub event bus with 7 typed events and unsubscribe capability | M1 | R1 |
| 3 | StorageManager Persistence | Persist stars, unlocked accessories, and errorHeatmap per letter with fallback | M1 | R1 |
| 4 | Lightweight Node Dev Server | Zero-dependency HTTP server with ES module MIME types (`node server.js`) | M1 | R1 |
| 5 | Background Video Decoupling | Remove dead `animated_bg.mp4` dependency and replace with real-time scene | M1 | R1 |
| 6 | Live Scene Parallax Container | Reactive parallax layer on `Main Scene.png` with smooth lerp | M2 | R2 |
| 7 | Ambient Particle Engine | Object-pooled ambient particles (bubbles, golden stars, classroom motes) | M2 | R2 |
| 8 | Fever Mode Lighting Filter | Reactive golden/rainbow glow lighting overlay on `FEVER_MODE_CHANGED` | M2 | R2 |
| 9 | Unified Sticker Outline & Shadow | Clean 3px sticker outline and drop-shadow filter for sprite sheets/assets | M2 | R2 |
| 10 | Quadratic Bézier Projectiles | Magic projectile trail from pressed key to mascot with finger-color particles | M2 | R2 |
| 11 | Squash & Stretch Engine | Harmonic elastic `applySquashAndStretch` deformation without permanent distortion | M2 | R2 |
| 12 | Sinusoidal Resting Breathing | Continuous vertical & scale breathing animation on Roby mascot | M3 | R3 |
| 13 | Look-at Angular Tilt | Mascot tilts `-4deg` to `+4deg` following target key position on keyboard | M3 | R3 |
| 14 | Dynamic Lip-Sync & Comic Bubble | Syllable-cadence mouth opening and comic bubble with highlighted key names | M3 | R3 |
| 15 | Mascot 6-State FSM | `IDLE`, `FLOW_DANCE`, `HELPER_POINTING`, `SLEEPY`, `HIGH_FIVE_WAIT`, `CELEBRATING` | M3 | R3 |
| 16 | Idle Inactivity Timers | 2.0s idle triggers helper pointing; 25.0s idle triggers sleepy state | M3 | R3 |
| 17 | Accessory Socket System | Hats, glasses, crowns unlockable via stars at normalized socket anchors | M3 | R3 |
| 18 | 3D Toy-Style Tactile Buttons | Visual tactile keyboard keys with depth, squish, and F/J homemark bumps | M4 | R4 |
| 19 | Pedagogical Finger Colors | Coral/Soft Red, Warm Orange, Sun Yellow, Mint Green, Sky Blue, Magic Purple | M4 | R4 |
| 20 | Ghost Hands Overlay | Translucent hands over keyboard highlighting active finger + 2s idle hint | M4 | R4 |
| 21 | Anti-Frustrating Pedagogy | Soft shake on error, pulse on target, zero game-over screens, no point penalties | M4 | R4 |
| 22 | 8-Level Micro-Curriculum | Graded levels (home row, top, bottom, syllables, words with visual cues) | M4 | R4 |
| 23 | Procedural Pentatonic Audio | Web Audio API major pentatonic synthesizer (C4 to C6) rising on combos | M5 | R5 |
| 24 | Wood/Rubber Miss Sound | Procedural low acoustic thud (140Hz->55Hz sweep with 380Hz lowpass) on error | M5 | R5 |
| 25 | Intelligent VoiceQueue | Web Speech API queue with priority tiers, rate throttle (>25 PPM), anti-overlap | M5 | R5 |
| 26 | Accessibility Panel | 3 volume sliders (Music, SFX, Voice), OpenDyslexic font toggle, high-contrast CSS | M5 | R5 |
| 27 | Standalone Test Harness | Node.js script (`node test_harness.js`) validating 100% contracts with exit code 0 | M6 | R6 |
| 28 | System Integration & Polish | Complete wiring in `src/main.js`, `index.html`, and `style.css` | M7 | Acceptance |

---

## Milestones

| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| M1 | Core Architecture & EventBus | `src/core/EventBus.js`, `StorageManager.js`, `GameEngine.js`, `server.js` | none | DONE |
| M2 | Live Scene, Parallax & VFX Particles | `src/vfx/LiveScene.js`, `ParticleEngine.js`, `BezierProjectiles.js`, `SquashStretch.js` | M1 | DONE |
| M3 | Interactive Mascot & Emotional AI | `src/mascot/MascotAnimator.js`, `MascotFSM.js`, `LipSync.js`, `SpeechBubble.js`, `AccessorySocket.js` | M1 | DONE |
| M4 | Toy Keyboard, Ghost Hands & Pedagogy | `src/keyboard/ToyKeyboard.js`, `GhostHands.js`, `PedagogyEngine.js`, `KeyboardLayout.js` | M1 | DONE |
| M5 | Procedural Audio, VoiceQueue & A11y | `src/audio/ProceduralAudio.js`, `VoiceQueue.js`, `AccessibilityPanel.js` | M1 | DONE |
| M6 | Automated Verification Harness (Test Track) | `test_harness.js`, `TEST_INFRA.md`, `TEST_READY.md` | M1 | DONE |
| M7 | System Integration & Final Gate | `src/main.js`, `index.html`, `style.css`, full test_harness pass, audit | M2, M3, M4, M5, M6 | DONE |

---

## Interface Contracts

### EventBus Events & Payloads
The 7 mandatory events dispatched and subscribed via `EventBus`:

1. `KEY_TARGET_CHANGED`:
   ```js
   {
     key: string,            // e.g. "f", "j", " "
     finger: string,         // "l-index", "r-index", "l-pinky", etc.
     hand: string,           // "left", "right"
     screenPosition: { x: number, y: number } // coordinates of key center
   }
   ```

2. `KEY_PRESSED_SUCCESS`:
   ```js
   {
     key: string,
     comboCount: number,     // consecutive hits (1, 2, 3...)
     accuracy: number,       // 0 to 100
     keyScreenPosition: { x: number, y: number }
   }
   ```

3. `KEY_PRESSED_FAIL`:
   ```js
   {
     pressedKey: string,
     expectedKey: string,
     consecutiveErrors: number
   }
   ```

4. `USER_STUCK`:
   ```js
   {
     expectedKey: string,
     finger: string,
     idleTimeMs: number      // e.g. 2000
   }
   ```

5. `FEVER_MODE_CHANGED`:
   ```js
   {
     isActive: boolean,
     multiplier: number      // e.g. 1.0 or 2.0
   }
   ```

6. `MASCOT_SPEAK_REQUEST`:
   ```js
   {
     text: string,
     audioId: string | null,
     priority: string,       // "CRITICAL", "HIGH", "NORMAL", "LOW"
     emotion: string         // "happy", "thinking", "error", "victory"
   }
   ```

7. `LEVEL_COMPLETED`:
   ```js
   {
     levelId: number | string,
     stars: number,          // 1, 2, or 3
     accuracy: number,       // 0 to 100
     wpm: number
   }
   ```

### StorageManager API
- `saveLevelStars(levelId, stars)`
- `getLevelStars(levelId)`
- `recordError(letter)`
- `getErrorHeatmap()` -> `{ [letter: string]: count }`
- `unlockAccessory(accessoryId)`
- `getUnlockedAccessories()` -> `string[]`
- `equipAccessory(slot, accessoryId)`
- `getEquippedAccessories()` -> `{ [slot: string]: string }`
- Note: Must work seamlessly in Node.js environments (fallback to memory store when `localStorage` is undefined).

---

## Code Layout & Write Ownership

| Path | Owner Milestone | Role / Purpose |
|------|-----------------|----------------|
| `src/core/EventBus.js` | M1 | Pub/Sub typed event dispatcher |
| `src/core/StorageManager.js` | M1 | LocalStorage & memory fallback persistence |
| `src/core/GameEngine.js` | M1 | Core game logic, stats, combo, fever calculations |
| `server.js` | M1 | Zero-dependency Node.js HTTP server |
| `src/vfx/LiveScene.js` | M2 | Live scene parallax & lighting filters |
| `src/vfx/ParticleEngine.js` | M2 | Ambient and radial burst particle engine |
| `src/vfx/BezierProjectiles.js` | M2 | Quadratic Bézier projectile trail generator |
| `src/vfx/SquashStretch.js` | M2 | Damped harmonic squash & stretch animation helper |
| `src/mascot/MascotAnimator.js` | M3 | Sinusoidal breathing, look-at tilt, hop animations |
| `src/mascot/MascotFSM.js` | M3 | 6-state finite state machine with transitions |
| `src/mascot/LipSync.js` | M3 | Syllable-cadence mouth bounce animation |
| `src/mascot/SpeechBubble.js` | M3 | Comic speech bubble with pedagogical key tags |
| `src/mascot/AccessorySocket.js` | M3 | Accessory socket and unlock manager |
| `src/keyboard/ToyKeyboard.js` | M3 (layout) / M4 | 3D visual keyboard with bumps and feedback |
| `src/keyboard/GhostHands.js` | M4 | Translucent hands overlay with idle hint |
| `src/keyboard/PedagogyEngine.js` | M4 | Non-punitive micro-level curriculum & anti-frustration |
| `src/keyboard/KeyboardLayout.js` | M4 | Finger color assignments & keyboard definitions |
| `src/audio/ProceduralAudio.js` | M5 | Web Audio API pentatonic scale & miss thud |
| `src/audio/VoiceQueue.js` | M5 | Web Speech API prioritized utterance queue |
| `src/audio/AccessibilityPanel.js` | M5 | A11y controls (volumes, font, contrast) |
| `test_harness.js` | M6 | Node.js programmatic test runner |
| `src/main.js` | M7 | Application integration bootstrap |
| `index.html` | M7 | HTML DOM integration |
| `style.css` | M7 | CSS styles and visual theme integration |
