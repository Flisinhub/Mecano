# Handoff Report — Explorer Survey 1 (Codebase & Asset Auditor)

## 1. Observation

A direct, read-only audit of the repository `c:\mecano\Mecano-main\Mecano-main` yielded the following concrete observations:

1. **File Inventory & Tree**:
   - Total files cataloged: 35 repository files across root, `assets/`, and `Sprites/`.
   - Key source files: `index.html` (28.599 B, 547 lines), `main.js` (84.774 B, 2.310 lines), `style.css` (52.543 B, 2.673 lines), `words.js` (17.685 B, 349 lines).
   - Missing infrastructure: No `package.json`, no `server.js`, no `test_harness.js`, and no `src/` directory exists.

2. **Video & Background Handling**:
   - In `index.html` lines 24-27:
     ```html
     <source src="assets/animated_bg.mp4" type="video/mp4" />
     ```
   - Tool verification via `node -e "fs.existsSync('assets/animated_bg.mp4')"` returned `false`.
   - In `main.js` lines 972-982:
     ```javascript
     function handleVideoFallback() {
       backgroundVideo.addEventListener("error", () => {
         backgroundVideo.style.display = "none";
       });
       ...
     }
     ```
   - In `style.css` lines 67-75: `.background-fallback` displays `assets/kids_world_bg.jpg`.
   - In `Sprites/3BqzFY3HM4hQrosUUUpkNCSF90u.mp4`: a 464.2 KB MP4 video exists but is never referenced in code.
   - In `assets/Robot_typing_and_waving_20261001161235.gif`: a 9.9 MB GIF file exists with 0 occurrences in any source code.

3. **Graphic Assets & Sprite Comparisons**:
   - `assets/main_scene.png` and `Sprites/Main Scene.png`: Both 1408x768 PNGs, SHA-256 hash `30804f588bd4fd8c2961e6c9ea0eae807038ea37d23aef6aa03f329164b0741a` (exact byte-for-byte duplicate).
   - `Sprites/Sprites Global.png`: 1408x768 PNG containing an 18-pose character sprite sheet titled "HOJA DE SPRITES DEL PERSONAJE: ROBOT DE MECANOGRAFÍA".
   - `Sprites/robot_error.png`, `Sprites/robot_sleeping.png`, `Sprites/robot_victory.png`: Images in `Sprites/` have a faux-checkerboard pattern baked into the pixel RGB channels.
   - `assets/robot_happy.png`, `assets/robot_reading.png`, `assets/robot_thinking.png`, `assets/robot_error.png`, `assets/robot_sleeping.png`, `assets/robot_victory.png`: High-resolution (1024x1024) PNGs with true RGBA transparency and clean white sticker outlines.
   - Realistic dorsal hand graphics: `assets/hand_left_realistic.png` (670x850) and `assets/hand_right_realistic.png` (670x850), mapped to SVG interactive touch sensors in `index.html:126-165` and `337-375`.

4. **Sound Effects (`assets/sounds/`)**:
   - `button-click.wav` (44.1kHz, 16bit stereo, 0.50s)
   - `error.wav` (44.1kHz, 16bit mono, 0.29s)
   - `good.wav` (44.1kHz, 16bit stereo, 0.30s)
   - `key-hit.wav` (44.1kHz, 24bit stereo, 0.71s)
   - `level-up.wav` (44.1kHz, 16bit stereo, 3.54s)
   - Played via HTML5 `new Audio(...)` in `main.js:130-146`. No Web Audio API or procedural pentatonic synthesizers currently present.

5. **Runtime Architecture & Couplings**:
   - `EventBus`: 0 references across the entire codebase.
   - `StorageManager`: 0 references across the entire codebase. Currently uses `localStorage.getItem("mecano_kids_progress")` with keys for stars and belt only (`main.js:1571-1638`).
   - `VoiceQueue`: 0 references across the entire codebase. Currently uses direct `window.speechSynthesis.speak(...)` and `cancel()` in `main.js:251-303`.
   - `applySquashAndStretch`: 0 references across the entire codebase.
   - `FEVER_MODE_CHANGED`: 0 references across the entire codebase.

---

## 2. Logic Chain

1. **Premise 1 (Obs 1, 5)**: `main.js` is a monolithic 2.310-line script that directly binds DOM elements, coordinates global game state, handles keyboard listeners, manages sound playback, and updates the UI procedurally without an event dispatcher.
   - *Inference*: To satisfy R1, R2, R3, R4, and R5 without regressions or file conflicts between 4 parallel specialist agents, `main.js` must be replaced by ES modules distributed under `src/core/`, `src/vfx/`, `src/mascot/`, `src/keyboard/`, and `src/audio/`, coordinated by a typed `EventBus`.

2. **Premise 2 (Obs 2)**: The background video (`assets/animated_bg.mp4`) fails to load on every startup because the file does not exist, triggering an error event that hides the video and displays a static JPG.
   - *Inference*: Decoupling the video tag and replacing it with a canvas- or CSS-based living scene layered over `Main Scene.png` (with Parallax and ambient particles as specified in R2) will remove a broken dependency and eliminate an unnecessary video tag.

3. **Premise 3 (Obs 3)**: `Sprites/` contains raw/unprocessed images with baked checkerboards, while `assets/` already contains 6 clean 1024x1024 transparent stickers (`happy`, `reading`, `thinking`, `error`, `sleeping`, `victory`) and `Sprites Global.png` contains 18 discrete poses.
   - *Inference*: Agent 2 (Mascot) and Agent 1 (VFX) can immediately use the clean transparent PNGs from `assets/` for all primary FSM states (`IDLE`, `HELPER_POINTING`, `SLEEPY`, `HIGH_FIVE_WAIT`, etc.), while referencing `Sprites Global.png` for sprite-sheet animations or auxiliary poses.

4. **Premise 4 (Obs 4)**: The current sound implementation relies on `new Audio()` element instances, which causes latency and prevents pitch modulation.
   - *Inference*: Agent 4 must replace this with a Web Audio API audio graph generating the procedural pentatonic scale (Do, Re, Mi, Sol, La) upon consecutive correct keypresses, retaining the WAV files for UI clicks and level-up celebrations.

5. **Premise 5 (Obs 1)**: There is currently no `server.js` or `package.json`, and running ES modules in modern browsers requires an HTTP/HTTPS origin (not `file://`).
   - *Inference*: Agent 0 must provide a zero-dependency Node.js HTTP server (`server.js`) so that `index.html` can load `src/main.js` as an ES module (`<script type="module" src="src/main.js"></script>`).

---

## 3. Caveats

- **Network Mode**: The investigation was conducted locally in the codebase.
- **Node.js Environment**: Windows PowerShell requires `npm.cmd` instead of `npm.ps1` due to PowerShell script execution policies, but standard `node` commands execute cleanly without restrictions.
- **Unused Heavy Assets**: `assets/Robot_typing_and_waving_20261001161235.gif` (9.9 MB) and `Sprites/3BqzFY3HM4hQrosUUUpkNCSF90u.mp4` (475 KB) are unreferenced. They should be preserved or safely archived without affecting gameplay.

---

## 4. Conclusion

The Mecano repository has a solid pedagogical foundation in `words.js` (8 well-structured levels and belt progression), high-quality graphic assets in `assets/` and `Sprites/Main Scene.png`, and functional audio samples. However, its software architecture is completely monolithic, tightly coupled, and lacks the requested `EventBus`, procedural Web Audio engine, Mascot FSM, 3D toy-style keyboard with superimposed Ghost Hands, and automated test harness.

The audit report `survey_codebase.md` provides all architectural specifications, asset coordinates, and refactoring guidelines needed by Agent 0 (Core/Architecture), Agent 1 (VFX/Scene), Agent 2 (Mascot/AI), Agent 3 (Keyboard/Pedagogy), and Agent 4 (Audio/Accessibility) to execute their tasks cleanly and without mutual interference.

---

## 5. Verification Method

To independently verify the observations and conclusions in this report:

1. **Verify Asset Inventory & Existence**:
   ```powershell
   node -e "const fs = require('fs'); console.log('assets:', fs.readdirSync('assets')); console.log('sprites:', fs.readdirSync('Sprites')); console.log('sounds:', fs.readdirSync('assets/sounds'));"
   ```
2. **Verify Missing Video File**:
   ```powershell
   node -e "const fs = require('fs'); console.log('animated_bg.mp4 exists:', fs.existsSync('assets/animated_bg.mp4'));"
   ```
   *(Expected output: `false`)*
3. **Verify SHA-256 Identity of Main Scene**:
   ```powershell
   node -e "const fs = require('fs'), c = require('crypto'); const h1 = c.createHash('sha256').update(fs.readFileSync('assets/main_scene.png')).digest('hex'); const h2 = c.createHash('sha256').update(fs.readFileSync('Sprites/Main Scene.png')).digest('hex'); console.log('Matches:', h1 === h2);"
   ```
   *(Expected output: `true`)*
4. **Verify Absence of ES Modules / Architecture**:
   ```powershell
   node -e "const fs = require('fs'); console.log('src exists:', fs.existsSync('src')); console.log('server.js exists:', fs.existsSync('server.js')); console.log('test_harness exists:', fs.existsSync('test_harness.js'));"
   ```
   *(Expected output: all `false`)*
