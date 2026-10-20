# Authoritative Specification Survey: Keyboard, Audio, Accessibility & Test Harness (R4, R5, R6)

**Agent**: Spec Miner Survey 3 (`spec_miner_survey_3`)  
**Timestamp**: 2026-10-18T09:25:00Z  
**Target Systems**:
- **R4**: Ergonomic Toy-Style 3D Keyboard, Ghost Hands Overlay, Non-Punitive Feedback & Micro-Curriculum
- **R5**: Procedural Web Audio API Pentatonic Synthesizer, Intelligent VoiceQueue & Accessibility Suite
- **R6**: Headless Node.js Test Harness (`test_harness.js`) & Programmatic Verification Contracts

---

## Executive Summary

This specification mining report establishes the exact technical requirements, data structures, public interfaces, event contracts, mathematical formulas, synthesis parameters, and verification suites for requirements **R4**, **R5**, and **R6** of the *Mecano* educational typing platform.

Authoritative specification sources mined:
1. `c:\mecano\Mecano-main\Mecano-main\.agents\teamwork\ORIGINAL_REQUEST.md` (Primary Requirements R1-R6)
2. Existing codebase analysis:
   - `index.html` (DOM hierarchy for hands, keyboard, settings panel, and SVG finger units)
   - `main.js` (FINGER_MAP, keystroke handlers, speech synthesis, sound effects, stats calculation)
   - `style.css` (Keyboard layout, key press states, animations, responsive breakpoints)
   - `words.js` (KIDS_LEVELS 1-8 curriculum, belt tiers, visual word badges)
3. Standards & APIs:
   - W3C Web Audio API (OscillatorNode, GainNode, BiquadFilterNode, ADSR envelopes)
   - W3C Web Speech API (SpeechSynthesis, SpeechSynthesisUtterance)
   - Node.js v24 Test & Assertion APIs (`node:test`, `node:assert`, ES Modules)

---

## Features Discovered

| # | Category | Feature | Description | Inputs | Outputs | Error Behavior | Discovered Via |
|---|----------|---------|-------------|--------|---------|----------------|----------------|
| 1 | R4 Keyboard | 3D Physical Button Styling | Realistic physical button aesthetic with depth bevels, rounded corners (12px), active depression (`translateY(4px)`), and finger color accents. | CSS classes `.key`, `.key:active`, `--finger-color` | Visual 3D tactile button with shadow depression | Graceful fallback to flat buttons on low-spec GPU | ORIGINAL_REQUEST.md § R4, style.css:1514 |
| 2 | R4 Keyboard | Tactile Bumps on F and J | Visual and tactile homemark ridges on keys F and J to indicate home row anchor for index fingers. | CSS class `.key-homemark` | Embossed horizontal ridge (14px x 3px) beneath key label | Must persist across all key state changes | ORIGINAL_REQUEST.md § R4, style.css:1562 |
| 3 | R4 Keyboard | Standard Pedagogical Color Coding | Specific color assignment per finger: Pinky (Coral/Soft Red), Ring (Warm Orange), Middle (Sun Yellow), Left Index (Mint Green), Right Index (Sky Blue), Thumbs (Magic Purple). | Key character or key code | Hex color code and CSS variable `--finger-color` | Defaults to neutral `#232946` if unmapped key | ORIGINAL_REQUEST.md § R4, main.js:565 |
| 4 | R4 Keyboard | Opposing Hand Shift Illumination | When an uppercase letter or shifted character is required, the Shift key on the *opposite* hand is illuminated. | Target character | Target key + opposite Shift key illuminated | If thumb/neutral character, no Shift illuminated | main.js:1163 |
| 5 | R4 Ghost Hands | Translucent Hands Silhouette Overlay | Translucent visual guide hands positioned alongside or over the keyboard with illuminated fingertip pads. | Target finger ID (`lp`, `lr`, `lm`, `li`, `ri`, `rm`, `rr`, `rp`, `thumb`) | SVG pad glow (`.is-active-finger`), radar pulse animation | Falls back to static indicator if SVG missing | ORIGINAL_REQUEST.md § R4, index.html:121 |
| 6 | R4 Ghost Hands | 2-Second Idle Assistance Hint | If user is idle for > 2000 ms, initiates suggestive finger tap animation and fires `USER_STUCK` event. | Elapsed idle time (`idleTimeMs >= 2000`) | `USER_STUCK` event dispatched to EventBus, animated guide cue | Cleared immediately upon any keydown | ORIGINAL_REQUEST.md § R4, acceptance criteria |
| 7 | R4 Feedback | Non-Punitive Soft Error Feedback | Wrong keystrokes trigger soft wiggle/shake animation and pastel red flash without life loss or word reset. | Pressed key != expected key | Visual soft wiggle (`.key--wrong-soft`), dull miss audio | Never blocks input or resets cursor to start | ORIGINAL_REQUEST.md § R4, main.js:1508 |
| 8 | R4 Feedback | Target Key Luminous Pulse | Expected key continuously pulses with warm light and halo in the finger's color until pressed. | Expected character | `.key--target` pulse animation (`pulseGlow`) | Cleared when correct key is hit | ORIGINAL_REQUEST.md § R4, style.css:1617 |
| 9 | R4 Curriculum | 8 Micro-Level Progression | Structured curriculum from index anchors to galactic paragraphs (8 words per session for L1-L7, 3 for L8). | Completed words, accuracy % | Level completion, star rating (1-3 stars), belt promotion | User allowed to retry level without penalty | words.js:50, ORIGINAL_REQUEST.md § R4 |
| 10 | R5 Audio | Web Audio Procedural Pentatonic Engine | Synthesizes C Major pentatonic scale notes (C, D, E, G, A) on successive hits; pitch rises with combo streak. | Hit event, current `comboCount` | Synthesized sine/triangle bell tone via Web Audio API | Reconnects or resumes suspended AudioContext on gesture | ORIGINAL_REQUEST.md § R5, acceptance criteria |
| 11 | R5 Audio | Dull Wood / Rubber Miss Tone | Non-punitive percussive thud synthesized via downward pitch sweep (140Hz -> 55Hz) with lowpass damping. | Error event (`KEY_PRESSED_FAIL`) | Soft acoustic wood/rubber thud (120ms duration) | Suppressed if sound effects muted | ORIGINAL_REQUEST.md § R5 |
| 12 | R5 Audio | Independent Audio Volume Channels | Three independent volume channels: Music (`masterMusicVolume`), SFX (`sfxVolume`), Voice (`voiceVolume`). | Slider values `[0.0 - 1.0]` | GainNode gain values, `SpeechSynthesisUtterance.volume` | Persisted in StorageManager; clamps out of range | ORIGINAL_REQUEST.md § R5 |
| 13 | R5 Voice | Intelligent VoiceQueue with Anti-Overlap | Serialized utterance queue preventing overlapping robot voices; manages priority queues (Critical vs Low). | Utterance requests `{ text, priority, emotion }` | Dispatched speech with lip-sync synchronization | Replaces or queues based on priority tier | ORIGINAL_REQUEST.md § R5 |
| 14 | R5 Voice | Speed-Based Speech Throttling | Suppresses lengthy verbal praise when typing speed exceeds threshold (e.g. > 20 PPM), using short interjections. | Current WPM / PPM | Short cheer ("¡Bien!", "¡Eso!") or key sound | Prevents queue buildup during fast typing | ORIGINAL_REQUEST.md § R5 |
| 15 | R5 Voice | Phonetic vs Letter Name Modes | Toggle between speaking the formal letter name ("Efe", "Jota") or phonetic sound ("/fff/", "/jjj/"). | Target letter, mode setting | Spoken phonetic audio via SpeechSynthesis | Falls back to letter name if phoneme unsupported | ORIGINAL_REQUEST.md § R5 |
| 16 | R5 A11y | Dyslexia-Friendly Typography Toggle | Allows toggling between default Fredoka/Nunito and OpenDyslexic / Comic Sans MS for optimal readability. | Font selection in settings / header | CSS class applied to `document.body` (`.font-opendyslexic`) | Persists in StorageManager | ORIGINAL_REQUEST.md § R5 |
| 17 | R5 A11y | High-Contrast Mode CSS | High-contrast palette with pitch black background, thick high-contrast borders, neon finger colors. | High-contrast toggle switch | CSS class `body.high-contrast` (WCAG AAA >= 7:1) | Retains layout and element bounding boxes | ORIGINAL_REQUEST.md § R5 |
| 18 | R6 Harness | Headless Node.js Test Harness | Executable test script (`node test_harness.js`) running headless verification without browser dependencies. | CLI execution | Console test report, process exit code 0 or 1 | Fails fast with descriptive assertion trace | ORIGINAL_REQUEST.md § R6 |
| 19 | R6 Harness | EventBus Pub/Sub Contract Verification | Verifies dispatch and reception of all 7 typed EventBus events with full payload schema validation. | Mock EventBus instances, listener spies | Assertion pass/fail for all 7 event contracts | Throws error if payload schema invalid | ORIGINAL_REQUEST.md § R6, R1 |
| 20 | R6 Harness | Mascot FSM State Verification | Simulates all 6 mascot states (`IDLE`, `FLOW_DANCE`, `HELPER_POINTING`, `SLEEPY`, `HIGH_FIVE_WAIT`, etc.) and transitions. | Simulated time advancement, event dispatches | FSM state assertions | Catches invalid state transitions | ORIGINAL_REQUEST.md § R6, R3 |
| 21 | R6 Harness | Metric & Accuracy Calculation Tests | Programmatic verification of accuracy formula, hesitation filter (errors < 400ms counted once), and WPM. | Synthetic keystroke arrays (hits and errors) | Expected accuracy integer, PPM number | Flag calculation drift | ORIGINAL_REQUEST.md § R6 |
| 22 | R6 Harness | StorageManager Persistence Simulation | Headless verification of StorageManager CRUD operations, star counts, belt ranks, and error heatmap. | Mock storage reads/writes, corrupted JSON | Serialized string, parsed object integrity | Fallback to DEFAULT_PROGRESS on corrupt data | ORIGINAL_REQUEST.md § R6, R1 |

---

## Edge Cases

| # | Feature | Input / Condition | Observed Behavior | Required Specification Handling |
|---|---------|-------------------|-------------------|---------------------------------|
| 1 | R4 Keyboard | Dead key accent (´) for accented vowels (`á`, `é`, `í`, `ó`, `ú`) | Keydown event receives `event.key === "Dead"` | Two-step indicator: illuminates Accent key (`rp`) AND vowel key (`baseFinger`), updates guidance badge to `1º Tilde ´ ➔ 2º Vocal`. |
| 2 | R4 Keyboard | Diéresis (`ü`, `Ü`) | Combined key: Shift + Dead key + U | Guides 3-step sequence: `1º Mayús + ¨ ➔ 2º U`. |
| 3 | R4 Keyboard | Alt Gr special characters (`@`, `#`, `€`, `~`, `\|`) | Requires holding Alt Gr key (`thumb-r`) | Highlights Alt Gr with thumb color and primary key with its finger color. |
| 4 | R4 Keyboard | Spacebar character (`" "`) | Next target character is space | Both thumbs or either thumb (`thumb-l` and `thumb-r`) highlighted in Magic Purple; Spacebar receives `.key--target`. |
| 5 | R4 Feedback | Motor hesitation (repeated wrong keys within 400ms) | User rapidly taps wrong key 3 times in 250ms | Hesitation filter: count as 1 mistake (`errors++` once), flash key, do not double-increment total keystrokes or penalize combo repeatedly. |
| 6 | R4 Ghost Hands | User paused mid-word for exactly 2000ms | Idle timer expires at 2.0s without keydown | Dispatches `USER_STUCK { expectedKey, finger, idleTimeMs: 2000 }` to EventBus; ghost hand triggers suggestive wiggle; mascot moves to `HELPER_POINTING`. |
| 7 | R4 Curriculum | Level 8 multi-line paragraph text | Text contains embedded newlines (`\n`) and over 200 characters | Container enables smooth auto-scroll (`scrollTargetIntoView`); Enter key highlighted in right pinky color when `\n` is reached. |
| 8 | R5 Audio | Browser AudioContext suspended state | Page loaded without prior user interaction | AudioContext initialized in `suspended` state. Engine must hook first click or keydown to execute `audioCtx.resume()`. |
| 9 | R5 Audio | Pentatonic combo overflow (> 10 consecutive hits) | Streak reaches note beyond octave 5 (A5, C6) | Wrap octave cleanly or trigger celebratory arpeggio; never generate frequencies > 1200 Hz that sound piercing to children. |
| 10 | R5 Audio | Error occurs during active pentatonic scale | User hits wrong key at combo 8 | Synthesize dull wood/rubber miss sound; reset pentatonic pitch index back to 0 (C4) for next correct key. |
| 11 | R5 Voice | Typing burst exceeds rate threshold (> 20 PPM) | User rapidly types 5 letters in 2 seconds | Drop verbose commentary; queue only ultra-short interjections ("¡Bien!", "¡Fuego!") or silent phonetic sounds to prevent speech queue pileup. |
| 12 | R5 Voice | No Spanish voices loaded in Web Speech API | `speechSynthesis.getVoices()` is empty or lacks `es-*` | Fall back gracefully to `voices[0]` or silent lip-sync animation without throwing unhandled exceptions. |
| 13 | R5 Voice | Level complete audio while mascot is speaking | Critical victory message dispatched during tip readout | Cancel low-priority tip immediately; flush queue; execute critical level complete cheer. |
| 14 | R5 A11y | Volume slider set to 0.0 | User drags SFX slider to minimum | GainNode set to 0.0 (or muted); no sound output; zero CPU overhead. |
| 15 | R6 Harness | Headless execution without `window` or `document` | `node test_harness.js` executed in CLI | All core modules (`EventBus`, `StorageManager`, `FSM`, `VoiceQueue`) must be decoupled from DOM or operate via clean dependency injection / mocks. |
| 16 | R6 Harness | Corrupted JSON in StorageManager | Mock storage contains `"{\"unlockedLevel\": invalid...}"` | StorageManager catches JSON parse error, logs warning, returns `DEFAULT_PROGRESS` without terminating process. |
| 17 | R6 Harness | Division by zero in accuracy calculation | Keystroke count is 0 (`totalKeystrokes === 0`) | Accuracy helper returns `100`% (not `NaN` or `Infinity`). |

---

## Detailed Specification: Requirement R4 (Keyboard & Micro-Curriculum)

### 1. 3D Toy-Style Button Architecture & Visual Styling
- **Visual Aesthetic**: Physical toy button style reminiscent of durable arcade or LEGO/chunky educational hardware.
- **Key Dimensions**:
  - Desktop standard: `48px` x `48px` (minimum `36px` x `36px` on compact screens).
  - Border radius: `12px` (heavily rounded pill aesthetic).
  - Raised depth: `border-bottom: 4px solid var(--key-shadow)` and `box-shadow: 0 4px 0 rgba(0, 0, 0, 0.28)`.
  - Pressed state (`:active`, `.key--hit`):
    ```css
    transform: translateY(3px);
    box-shadow: 0 1px 0 rgba(0, 0, 0, 0.28);
    ```
- **Tactile Bumps (F and J)**:
  - Both keys `F` (`left index`) and `J` (`right index`) must display prominent tactile homemark indicators:
  - CSS implementation:
    ```css
    .key-homemark::after {
      content: "";
      position: absolute;
      bottom: 5px;
      width: 14px;
      height: 3.5px;
      border-radius: 2px;
      background: #ffd32a;
      box-shadow: 0 1px 2px rgba(0,0,0,0.5);
    }
    ```

### 2. Standard Pedagogical Finger Color Assignment (Mandatory Spec)
The following finger color mapping is authoritative and supersedes any prior inconsistent codebase values:

| Finger ID | Hand | Finger | Pedagogical Color | Hex Code | Assigned Keys |
|-----------|------|--------|-------------------|----------|---------------|
| `lp` | Left | Pinky (Meñique) | Coral / Soft Red | `#ff6b81` (`#ff7675`) | `1`, `Q`, `A`, `Z`, `Left Shift`, `Left Ctrl` |
| `lr` | Left | Ring (Anular) | Warm Orange | `#ff9f43` (`#e17055`) | `2`, `W`, `S`, `X` |
| `lm` | Left | Middle (Corazón) | Sun Yellow | `#ffd32a` (`#f9ca24`) | `3`, `E`, `D`, `C` |
| `li` | Left | Index (Índice) | Mint Green | `#2ed573` (`#55efc4`) | `4`, `5`, `R`, `T`, `F`, `G`, `V`, `B` |
| `ri` | Right | Index (Índice) | Sky Blue | `#00d2d3` (`#70a1ff`) | `6`, `7`, `Y`, `U`, `H`, `J`, `N`, `M` |
| `rm` | Right | Middle (Corazón) | Sun Yellow | `#ffd32a` (`#f9ca24`) | `8`, `I`, `K`, `,` |
| `rr` | Right | Ring (Anular) | Warm Orange | `#ff9f43` (`#e17055`) | `9`, `O`, `L`, `.` |
| `rp` | Right | Pinky (Meñique) | Coral / Soft Red | `#ff6b81` (`#ff7675`) | `0`, `¿`, `?`, `P`, `´`, `Ç`, `Enter`, `Ñ`, `-`, `Right Shift`, `Right Ctrl` |
| `thumb` | Both | Thumbs (Pulgares) | Magic Purple | `#9b59b6` (`#a29bfe`) | `Spacebar (" ")`, `Alt`, `Alt Gr` |

*Note on delta*: Thumbs MUST use **Magic Purple** (`#9b59b6` / `#a29bfe`), and Pinkies MUST use **Coral / Soft Red** (`#ff6b81` / `#ff7675`), aligning both hands consistently.

### 3. Ghost Hands Overlay & 2-Second Idle Hint
- **Overlay Rendering**:
  - Translucent SVG hands positioned to the left and right of the keyboard or superposed with 75% opacity.
  - Each finger contains an interactive SVG pad with `finger-pulse-ring` and `finger-tip-pad`.
  - When a target key is active, the corresponding fingertip pad lights up in that finger's pedagogical color.
- **2-Second Idle Assistance Timer**:
  - Timer duration: Exactly `2000 ms` of continuous inactivity while a key is expected.
  - Idle Trigger Behavior:
    1. Dispatches EventBus event:
       ```javascript
       EventBus.emit('USER_STUCK', {
         expectedKey: currentExpectedChar,
         finger: fingerData.id,
         idleTimeMs: 2000
       });
       ```
    2. Activates visual hint animation on the ghost hand (`@keyframes activeFingerRadarWave` and suggestive finger bouncing).
    3. Mascot transitions to `HELPER_POINTING` and displays spoken tip pointing to the key.
    4. Canceled immediately upon receiving any valid `keydown` event.

### 4. Non-Punitive Feedback System
- **No Penalties**: No lives, no hearts, no score subtraction, no Game Over screen.
- **Wrong Key Feedback (`KEY_PRESSED_FAIL`)**:
  - Key shakes gently (`animation: softWiggle 0.22s ease-in-out`).
  - Brief pastel red flash (`#ff7675`).
  - Target key remains illuminated with prompt pulse; text cursor does NOT reset.
  - Hesitation guard: Duplicate errors for the same key within `400 ms` do not trigger multiple error penalties.
- **Target Key Pulse (`KEY_TARGET_CHANGED`)**:
  - High-visibility golden/finger-colored halo (`animation: targetKeyPulse 1.2s infinite alternate`).

### 5. Micro-Curriculum Progression (8 Micro-Levels)
1. **Level 1 — Los Índices en Casa (F y J)**:
   - Keys: `F`, `J`, `Spacebar`.
   - Pedagogical goal: Index home rest anchors and basic thumb rhythm.
2. **Level 2 — La Fila Guía Básica (A S D F / J K L Ñ)**:
   - Keys: Home row anchors for all 8 fingers.
   - Pedagogical goal: Full home row hand resting posture.
3. **Level 3 — Vocales Superiores (E, I) y Palabras Cortas**:
   - Keys: Home row + `E`, `I`.
   - Pedagogical goal: Short upward reach of middle fingers while keeping hand anchored.
4. **Level 4 — Expansión de Vocales (O, U) y Consonantes (C, M, P, T)**:
   - Keys: Upper and lower row reaches.
   - Pedagogical goal: Multi-row reach without lifting wrists.
5. **Level 5 — Frases Cortas y Barra Espaciadora**:
   - Short 2-3 word phrases with spacebar pauses.
   - Pedagogical goal: Word separation and thumb coordination.
6. **Level 6 — El Reino de los Cuentos y Aventuras**:
   - Sentences with accents (`´`), periods, and full abecedario.
   - Pedagogical goal: Dead-key accent timing (`´ + vocal`).
7. **Level 7 — Club de Chistes y Trabalenguas**:
   - Punctuation (`!`, `?`, `:`, `;`), uppercase with Shift.
   - Pedagogical goal: Two-hand Shift coordination.
8. **Level 8 — Desafío Galáctico del Dragón Robot**:
   - Multiline paragraphs (3 story paragraphs).
   - Pedagogical goal: Typing stamina, text scrolling, and Enter key line breaks.

---

## Detailed Specification: Requirement R5 (Audio, Voice & Accessibility)

### 1. Web Audio API Procedural Major Pentatonic Synthesizer
- **Rationale**: Real-time synthesis ensures instant response (< 5ms), zero loading lag, zero missing audio asset failures, and pitch accuracy.
- **Major Pentatonic Scale Frequencies (C Major)**:
  - Base: C4 (Do) = `261.63 Hz`
  - Notes:
    - Step 0 (Combo 1): **C4** = `261.63 Hz`
    - Step 1 (Combo 2): **D4** = `293.66 Hz`
    - Step 2 (Combo 3): **E4** = `329.63 Hz`
    - Step 3 (Combo 4): **G4** = `392.00 Hz`
    - Step 4 (Combo 5): **A4** = `440.00 Hz`
    - Step 5 (Combo 6): **C5** = `523.25 Hz`
    - Step 6 (Combo 7): **D5** = `587.33 Hz`
    - Step 7 (Combo 8): **E5** = `659.25 Hz`
    - Step 8 (Combo 9): **G5** = `783.99 Hz`
    - Step 9 (Combo 10): **A5** = `880.00 Hz`
    - Step 10 (Combo 11+): **C6** = `1046.50 Hz`
- **Synthesis Synthesis Algorithm (Correct Key Press)**:
  ```javascript
  function playPentatonicSuccess(comboCount, sfxVolume = 1.0) {
    const scale = [261.63, 293.66, 329.63, 392.00, 440.00, 523.25, 587.33, 659.25, 783.99, 880.00, 1046.50];
    const noteIndex = Math.min(comboCount, scale.length - 1);
    const freq = scale[noteIndex];
    
    const now = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    
    osc.type = "sine"; // Warm toy glockenspiel / marimba tone
    osc.frequency.setValueAtTime(freq, now);
    
    // ADSR Envelope
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.exponentialRampToValueAtTime(0.4 * sfxVolume, now + 0.008); // 8ms attack
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);          // 140ms decay
    
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    
    osc.start(now);
    osc.stop(now + 0.15);
  }
  ```
- **Dull Wood / Rubber Miss Tone (Error Press)**:
  - Non-punitive, acoustic damping:
  ```javascript
  function playWoodMiss(sfxVolume = 1.0) {
    const now = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    const filter = audioCtx.createBiquadFilter();
    
    osc.type = "triangle";
    // Pitch drops rapidly from 140Hz down to 55Hz
    osc.frequency.setValueAtTime(140, now);
    osc.frequency.exponentialRampToValueAtTime(55, now + 0.10);
    
    // Damping filter for hollow wood/rubber feel
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(380, now);
    filter.Q.setValueAtTime(2.0, now);
    
    gain.gain.setValueAtTime(0.35 * sfxVolume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
    
    osc.connect(filter);
    filter.connect(gain);
    gain.connect(audioCtx.destination);
    
    osc.start(now);
    osc.stop(now + 0.13);
  }
  ```

### 2. Intelligent VoiceQueue (Web Speech API)
- **Architecture**:
  - Class `VoiceQueue` managing `window.speechSynthesis`.
  - Queue item structure:
    ```typescript
    interface SpeechRequest {
      text: string;
      priority: 'CRITICAL' | 'HIGH' | 'NORMAL' | 'LOW';
      emotion?: 'happy' | 'thinking' | 'victory' | 'error' | 'reading';
      rate?: number;
      pitch?: number;
      onStart?: () => void;
      onEnd?: () => void;
    }
    ```
- **Anti-Overlap Engine**:
  - If `priority === 'CRITICAL'` (e.g. `LEVEL_COMPLETED`): cancels ongoing low-priority utterances immediately and plays critical text.
  - If speaking and another request of equal or lower priority arrives, it queues without overlapping audio.
- **Speed-Based Throttling**:
  - Monitors keystrokes per minute (PPM).
  - If PPM > 25 (child typing fast and in "the zone"):
    - Discards wordy motivational speeches.
    - Replaces with short interjections ("¡Bien!", "¡Genial!", "¡Sigue!") or stays silent to respect the child's focus flow.
- **Phonetic vs. Key Name Modes**:
  - Configurable in accessibility settings:
    - `KEY_NAME`: "Letra Efe", "Letra Jota", "Barra Espaciadora".
    - `PHONETIC`: Sounds the phonetic letter: "/f-f-f/", "/j-j-j/", "/m-m-m/".

### 3. Accessibility Suite & Theme Controls
- **Independent 3-Channel Volume Controls**:
  - Music Volume slider: `0.0 - 1.0` (Controls background ambient/music gain).
  - SFX Volume slider: `0.0 - 1.0` (Controls Web Audio hit/miss oscillator gain).
  - Voice Volume slider: `0.0 - 1.0` (Controls `SpeechSynthesisUtterance.volume`).
  - Persisted in `StorageManager` under `mecano_a11y_settings`.
- **Dyslexia Typography Toggle**:
  - Modes: `default`, `opendyslexic`, `comicsans`.
  - Applied via CSS classes on `document.body`:
    - `.font-opendyslexic`: Uses `OpenDyslexic`, sans-serif; increases letter spacing by `0.06em`, line height to `1.55`.
    - `.font-comicsans`: Uses `'Comic Sans MS'`, `'Comic Neue'`, cursive, sans-serif (scientifically recognized for distinct b/d/p/q glyph forms).
- **High-Contrast Mode (`body.high-contrast`)**:
  - Background: `#000000` (Pure Black).
  - Card containers: `#0a0c1a` with `3px solid #ffffff` borders.
  - Key borders: `3px solid #ffffff`.
  - Active key target: Neon Yellow `#ffff00` with high-contrast black text.
  - Saturated neon finger mapping:
    - Pinky: Neon Coral `#ff3366`
    - Ring: Neon Orange `#ff9900`
    - Middle: Neon Yellow `#ffff00`
    - Left Index: Neon Green `#00ff66`
    - Right Index: Neon Cyan `#00ffff`
    - Thumbs: Neon Purple `#cc66ff`
  - Guarantees WCAG AAA contrast ratio >= 7:1 for all text.

---

## Detailed Specification: Requirement R6 (Automated Test Harness)

### 1. Harness Execution Contract
- **CLI Command**: `node test_harness.js`
- **Exit Code**:
  - Exit `0`: All tests passed.
  - Exit `1`: Any assertion failed.
- **Independence**:
  - Headless Node.js execution. Zero third-party npm dependencies required.
  - Uses Node built-in `node:assert` and `node:test` or a clean lightweight runner.

### 2. Required Test Suites & Verification Contracts

#### Suite 1: EventBus Pub/Sub Contracts (7 Events)
Verify that each of the 7 typed events can be subscribed to, published, and validates its payload:
1. `KEY_TARGET_CHANGED`: `{ key: string, finger: string, hand: string, screenPosition: { x: number, y: number } }`
2. `KEY_PRESSED_SUCCESS`: `{ key: string, comboCount: number, accuracy: number, keyScreenPosition: { x: number, y: number } }`
3. `KEY_PRESSED_FAIL`: `{ pressedKey: string, expectedKey: string, consecutiveErrors: number }`
4. `USER_STUCK`: `{ expectedKey: string, finger: string, idleTimeMs: number }`
5. `FEVER_MODE_CHANGED`: `{ isActive: boolean, multiplier: number }`
6. `MASCOT_SPEAK_REQUEST`: `{ text: string, audioId?: string, priority: string, emotion: string }`
7. `LEVEL_COMPLETED`: `{ levelId: string, stars: number, accuracy: number, wpm: number }`

#### Suite 2: Mascot Finite State Machine (6 States)
Verify all 6 states and transitions:
- States: `IDLE`, `FLOW_DANCE`, `HELPER_POINTING`, `SLEEPY`, `HIGH_FIVE_WAIT`, `TALKING`.
- Transitions:
  - Initial state is `IDLE`.
  - Combo streak >= 4 transitions from `IDLE` to `FLOW_DANCE`.
  - `USER_STUCK` event transitions state to `HELPER_POINTING`.
  - Inactivity of 25 seconds transitions state to `SLEEPY`.
  - Any keypress while `SLEEPY` transitions state to `IDLE`.
  - `LEVEL_COMPLETED` transitions state to `HIGH_FIVE_WAIT`.
  - Spacebar press while `HIGH_FIVE_WAIT` celebrates and transitions back to `IDLE`.

#### Suite 3: Accuracy & Metric Calculation Formula Tests
- **Accuracy Formula**:
  ```javascript
  accuracy = totalKeystrokes > 0 ? Math.round((correctKeystrokes / totalKeystrokes) * 100) : 100;
  ```
- **Hesitation Filter Contract**:
  - A wrong keypress with timestamp difference `< 400ms` from previous wrong key of same character increments neither `errors` nor `totalKeystrokes` a second time.
- **Words Per Minute (WPM / PPM)**:
  - `PPM = Math.round(totalKeystrokes / (elapsedSeconds / 60))`.

#### Suite 4: Level Progression & Star Thresholds
- **Star Calculation**:
  - Accuracy >= 95%: 3 Stars (`⭐⭐⭐`)
  - Accuracy >= 90%: 2 Stars (`⭐⭐`)
  - Accuracy >= 80%: 1 Star (`⭐`)
  - Accuracy < 80%: 1 Star (no zero stars, non-punitive completion).
- **Belt Promotion**:
  - White belt (`blanco`): Default start.
  - Yellow belt (`amarillo`): Unlocked level >= 3 and total stars >= 5.
  - Green belt (`verde`): Unlocked level >= 5 and total stars >= 11.
  - Black belt & Crown (`negro`): Unlocked level >= 7 and total stars >= 18.

#### Suite 5: StorageManager Persistence & Error Recovery
- Tests storage serialization of:
  - `unlockedLevel` (1 to 8)
  - `stars` map (`{ 1: 3, 2: 3, ... }`)
  - `currentBelt` string
  - `errorHeatmap` map (`{ 'f': 2, 'p': 5, ... }`)
  - Unlocked mascot accessories list (`['hat_wizard', 'glasses_cool']`)
- Verifies recovery from corrupt / non-JSON data without process crash.

---

## Cross-Module Integration Contracts & Directory Structure

To fulfill requirement R1 and avoid merge collisions between specialists, all code must reside in these isolated directories:

```
src/
├── core/
│   ├── EventBus.js          # Typed Pub/Sub with 7 events
│   ├── StorageManager.js    # Persistence for stars, belts, heatmap, accessories
│   └── GameState.js         # Central game metrics (accuracy, combo, WPM, levels)
├── keyboard/
│   ├── KeyboardEngine.js    # Keydown handling, dead keys, hesitation filter
│   ├── FingerGuide.js       # Ghost hands overlay, 2s idle timer, finger mappings
│   └── LayoutDefinition.js  # Color codes (Pinky Coral, Ring Orange, Middle Yellow, Left Index Mint, Right Index Sky Blue, Thumbs Purple)
├── audio/
│   ├── AudioEngine.js       # Web Audio API procedural pentatonic & miss sound
│   ├── VoiceQueue.js        # Web Speech API intelligent queue, rate throttling
│   └── Accessibility.js     # Volume channels, font toggles, high-contrast CSS
├── mascot/
│   ├── MascotFSM.js         # 6 states finite state machine
│   ├── ProceduralAnim.js    # Sinusoidal breath, head tilt, lip-sync
│   └── Accessories.js       # Accessory sockets (hats, glasses)
├── vfx/
│   ├── ParticleEngine.js    # Magical Bezier projectiles and finger color sparks
│   ├── SquashStretch.js     # Elastic deformation functions
│   └── ParallaxScene.js     # Parallax background and fever mode lighting
test_harness.js              # Executable verification test harness
```

---

*Survey and specification mining completed by Spec Miner Survey 3.*
