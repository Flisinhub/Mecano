# Handoff Report — Explorer Survey 2: Core & Visual Systems Analyst

## 1. Observation
- **Original Requirements (`ORIGINAL_REQUEST.md`)**:
  - R1 mandates modular ES structure (`src/core/`, `src/vfx/`, `src/mascot/`, `src/keyboard/`, `src/audio/`), typed `EventBus` with 7 specific events (`KEY_TARGET_CHANGED`, `KEY_PRESSED_SUCCESS`, `KEY_PRESSED_FAIL`, `USER_STUCK`, `FEVER_MODE_CHANGED`, `MASCOT_SPEAK_REQUEST`, `LEVEL_COMPLETED`), `StorageManager` (persisting stars, errorHeatmap, unlocked accessories), decoupling background video, and a lightweight Node.js dev server.
  - R2 mandates a live scene container with smooth Parallax on `Main Scene.png`, ambient particles (bubbles/stars), fever mode lighting filter, unified 3px sticker outline and drop-shadow on sprites (`Sprites Global.png`, `Gemini_Generated_Image_*.png`), quadratic Bézier magic projectiles from keys to mascot with finger-color particles, and elastic `applySquashAndStretch`.
  - R3 mandates procedural mascot animation (sinusoidal breathing, look-at tilt $\pm 4^\circ$, combo jumps), dynamic simulated lip-sync with comic speech bubble, 6-state FSM (`IDLE`, `FLOW_DANCE`, `HELPER_POINTING`, `SLEEPY`, `HIGH_FIVE_WAIT`, plus `CELEBRATING`), and star-unlocked accessory sockets (hats, glasses, crowns).
- **Existing Video Defect (`index.html:16-27` and `style.css:77-87`)**:
  - `index.html` lines 24-26 define: `<source src="assets/animated_bg.mp4" type="video/mp4" />`.
  - File system check via `list_dir(assets)` shows `assets/animated_bg.mp4` does not exist.
  - `style.css` lines 77-87 hide it completely: `display: none; opacity: 0; pointer-events: none;`.
- **Existing Asset Dimensions & Pixel Analysis**:
  - Tool execution via Node revealed:
    - `Sprites/Main Scene.png`: $1408 \times 768\text{ px}$, MD5 `a9d808cbd2da62af1c6ef5b792043a4a`.
    - `assets/main_scene.png`: $1408 \times 768\text{ px}$, MD5 `a9d808cbd2da62af1c6ef5b792043a4a` (identical).
    - `Sprites/Sprites Global.png`: $1408 \times 768\text{ px}$, $6 \times 3$ grid of 18 robot poses under a $60\text{ px}$ title header.
    - Pixel inspection confirmed all pixels in `Sprites Global.png` have opaque alpha ($255$) with white background ($R=255, G=255, B=255$) surrounding the robot figures, requiring chroma-keying and an outline filter.
- **Existing Monolith (`main.js`)**:
  - `main.js` is 2,310 lines long containing global state variables (`errors`, `level`, `currentCombo`, `mascotMood`) and direct DOM manipulation.
  - `MASCOT_SPRITES` is hardcoded at line 309 to 6 static image paths in `assets/`.
  - Mascot clicks and moods are set via `setMascotMood()` (lines 433-475) toggling CSS classes (`mascot-idle`, `mascot-thinking`, `mascot-comfort`, `mascot-cheering`, `mascot-sleeping`).

## 2. Logic Chain
1. *From Observation of `index.html` and `style.css`*: The existing background video is broken, points to a missing file, and is styled `display: none`. Replacing it with a canvas-based `#live-scene-container` eliminates phantom network errors, reduces DOM overhead, and fulfills R2 requirements for smooth parallax and ambient particles.
2. *From Observation of `Sprites Global.png` and `assets/robot_*.png`*: Because sprite sheets and avatar assets have opaque white backgrounds, simply setting them as image sources causes ugly white bounding boxes over the classroom scene. An offscreen chroma-key pipeline combined with an SVG `<feMorphology operator="dilate" radius="3">` filter or CSS drop-shadow filter guarantees a clean 3px sticker outline with a 6px drop shadow, creating a coherent, tactile toy aesthetic.
3. *From Observation of R1 EventBus Requirements*: The 7 events defined in R1 span every stage of interaction (target change, success, fail, stuck, fever, speech, level completion). By structuring these into an explicit Pub/Sub contract with typed payloads and zero external dependencies, every downstream agent can develop their module (`src/vfx/`, `src/mascot/`, `src/keyboard/`, `src/audio/`) independently without merge conflicts or cyclic imports.
4. *From Observation of R2 VFX Requirements*: Calculating Bézier control points $P_1$ using midpoint lateral displacement and an upward arc $H_{\text{arc}} \approx 120\text{ px}$ creates high-arcing parabolic trails that connect key hits with Roby. Coupling the projectile arrival ($t=1$) with a damped harmonic oscillator model ($A=0.20, \zeta=0.42$) for `applySquashAndStretch` provides tactile, juicy feedback for every success.
5. *From Observation of R3 Mascot FSM Requirements*: While R3's text list includes 5 states (`IDLE`, `FLOW_DANCE`, `HELPER_POINTING`, `SLEEPY`, `HIGH_FIVE_WAIT`), the prompt and gameplay flow dictate a 6-state FSM where pressing `Space` during `HIGH_FIVE_WAIT` transitions into `CELEBRATING` (high-five burst, confetti, victory dance) before returning to `IDLE` or level selection.
6. *From Observation of Node environment*: Node v24.21.0 is installed, allowing a zero-dependency ES module dev server (`server.js`) using native `http`, `fs`, and `path`, with proper `application/javascript` MIME headers for instant local development and test harness execution.

## 3. Caveats
- No changes to source code were made (in adherence to the read-only explorer constraint).
- The detailed keyboard layout coordinates (R4) and Web Audio pentatonic frequency calculations (R5) were not deeply mined here, as they are specifically assigned to Spec Miner Survey 3.
- The SVG sticker outline filter performance on lower-end mobile devices can be heavier than pure CSS drop-shadows; a CSS fallback (`drop-shadow(...)` cascade) is documented in `survey_core_visuals.md`.

## 4. Conclusion
The technical architecture, module boundaries, mathematical formulas, and data contracts for R1, R2, and R3 are completely specified and ready for implementation.
The findings have been compiled into `survey_core_visuals.md` at:
`c:\mecano\Mecano-main\Mecano-main\.agents\teamwork\explorer_survey_2\survey_core_visuals.md`.
The implementation can proceed across dedicated milestone tracks:
- **M1 (Core Architecture & EventBus)**: Create `server.js`, `src/core/EventBus.js`, and `src/core/StorageManager.js`.
- **M2 (Live Scene & VFX Engine)**: Create `src/vfx/` live scene, parallax, ambient particles, Bézier projectiles, and sticker filter.
- **M3 (Interactive Mascot & FSM)**: Create `src/mascot/` FSM, procedural breathing/tilt/jumps, lip-sync, and accessory sockets.

## 5. Verification Method
1. **Inspection of Survey Document**:
   Verify that `c:\mecano\Mecano-main\Mecano-main\.agents\teamwork\explorer_survey_2\survey_core_visuals.md` exists and contains:
   - Full code blueprints for `EventBus.js` and `server.js`.
   - Exact payload definitions for all 7 typed events.
   - Exact mathematical equations for Parallax, Ambient Particles, Quadratic Bézier curves, Squash & Stretch harmonic oscillator, and Sinusoidal Breathing / Tilt.
   - 6-state Mascot FSM transition table.
   - Pixel coordinates for all 18 poses in `Sprites Global.png`.
   - Accessory socket definitions and star unlock tiers.
2. **Dev Server Verification**:
   When `server.js` is implemented by the developer agent, run:
   ```powershell
   node server.js
   ```
   Confirm that the server starts on `http://localhost:3000/` and returns `200 OK` with `Content-Type: application/javascript; charset=UTF-8` for ES modules.
3. **Invalidation Conditions**:
   - If any module imports another module directly instead of communicating through `EventBus`, the decoupling contract is violated.
   - If `applySquashAndStretch` permanently distorts the element dimensions ($S_x \cdot S_y \neq 1$ at rest), the animation formula is invalid.
   - If the Mascot FSM fails to transition to `HELPER_POINTING` on `USER_STUCK` or to `SLEEPY` after 25s idle, acceptance criteria are unmet.
