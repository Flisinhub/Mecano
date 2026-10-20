# Handoff Report: Spec Miner Survey 3 (Keyboard, Audio & Test Requirements)

**Agent**: Spec Miner Survey 3 (`spec_miner_survey_3`)  
**Parent Conversation ID**: `66c07542-af04-4ee8-8126-54789003be49`  
**Working Directory**: `c:\mecano\Mecano-main\Mecano-main\.agents\teamwork\spec_miner_survey_3\`  
**Date**: 2026-10-18T09:28:00Z  
**Handoff Type**: Hard Handoff (Task Complete)

---

## 1. Observation

1. **User Requirements (`c:\mecano\Mecano-main\Mecano-main\.agents\teamwork\ORIGINAL_REQUEST.md`)**:
   - Requirement R4 explicitly mandates:
     - "Teclado visual 3D estilo botón físico con marcas táctiles en `F` y `J`"
     - Standard pedagogical finger colors:
       - Meñiques (`Q,A,Z` / `P,Ñ,-`): Coral / Rojo suave.
       - Anulares (`W,S,X` / `O,L,.`): Naranja cálido.
       - Medios (`E,D,C` / `I,K,,`): Amarillo sol.
       - Índice Izquierdo (`R,F,V,T,G,B`): Verde menta.
       - Índice Derecho (`Y,H,N,U,J,M`): Azul cielo.
       - Pulgares (`Espacio`): Violeta mágico.
     - "Manos guía translúcidas (Ghost Hands) superpuestas con iluminación del dedo activo y animación indicativa si pasan más de 2 segundos."
     - "Lógica anti-frustración sin pantallas de Game Over ni deducción punitiva de puntos; la tecla errónea tiembla suavemente y la correcta resalta con un pulso luminoso."
     - "Progresión por micro-niveles estructurados (fila guía, superior, inferior, sílabas, palabras con imágenes)."
   - Requirement R5 explicitly mandates:
     - "Motor de sonido con Web Audio API: escala pentatónica mayor procedural para aciertos sucesivos (Do, Re, Mi, Sol, La) y tono sordo de goma/madera en fallos."
     - "Gestor inteligente de voz (`VoiceQueue`) con Web Speech API: prevención de solapamiento, interjecciones cortas en alta velocidad y alternancia entre modo fonético y nombre de tecla."
     - "Panel de accesibilidad con control de volúmenes independientes (Música, Efectos, Voz), tipografía para dislexia (OpenDyslexic / Comic Sans redondeada) y modo de alto contraste."
   - Requirement R6 explicitly mandates:
     - "Crear un script ejecutable de verificación con Node.js (`test_harness.js` o similar) que simule eventos del `EventBus`, transiciones de la máquina de estados de la mascota, cálculo de precisión, progresión de niveles y persistencia en `StorageManager` sin depender de interacción manual."
     - "La suite de pruebas automatizada (`node test_harness.js`) se ejecuta con código de salida 0 y valida el 100% de los módulos y contratos de eventos."

2. **Existing Codebase Analysis**:
   - `main.js:565-580`: Currently assigns `thumb` and `thumb-l` to Blue (`#70a1ff`, `#54a0ff`), right pinky `rp` to Lila (`#a29bfe`), and left pinky `lp` to Pink (`#ff6b81`). This deviates from the new requirement where thumbs must be Magic Purple, and pinkies are unified as Coral/Soft Red.
   - `main.js:130-146`: Relies on static audio files (`good.wav`, `error.wav`, `key-hit.wav`, `level-up.wav`, `button-click.wav`) using HTML5 `Audio()` rather than Web Audio API procedural synthesis.
   - `main.js:251-303`: Calls `window.speechSynthesis.cancel()` unconditionally before speaking, which causes abrupt voice clipping and does not queue utterances or throttle based on typing rate.
   - `style.css:1514-1536`: Implements `.key` with flat bottom border and subtle shadow, but lacks full 3D toy tactile button styling, squishy active depression, and high-contrast accessibility mode.
   - `words.js:50-307`: Contains 8 graded levels with rich visual metadata and belts (`blanco`, `amarillo`, `verde`, `negro`), perfectly matching the 8 micro-levels needed for R4.
   - Node.js runtime command `node --version` returned `v24.21.0` (exit code 0), confirming modern ES modules and `node:test` / `node:assert` support natively.

---

## 2. Logic Chain

1. **Finger Color Delta & Unification**:
   - Observation 1 defines the strict pedagogical standard for finger color coding.
   - Observation 2 reveals current code had divergence (thumbs blue instead of magic purple, pinkies mismatched).
   - Therefore, the implementation plan must update `--finger-color` CSS definitions and `LayoutDefinition.js` to strictly enforce:
     - Pinky = Coral/Soft Red (`#ff6b81`)
     - Ring = Warm Orange (`#ff9f43`)
     - Middle = Sun Yellow (`#ffd32a`)
     - Left Index = Mint Green (`#2ed573`)
     - Right Index = Sky Blue (`#00d2d3`)
     - Thumbs = Magic Purple (`#9b59b6`)

2. **Ghost Hands and 2-Second Idle Timer**:
   - Observation 1 requires a 2-second idle trigger (`USER_STUCK`).
   - In `main.js:503-507`, the previous idle timer was set to 14 seconds to trigger `sleeping`.
   - The new architecture requires two distinct timers:
     - 2.0s idle: triggers `USER_STUCK` event, ghost hand suggestion pulse, and mascot `HELPER_POINTING`.
     - 25.0s idle: triggers mascot `SLEEPY` state.
   - Both timers must reset on any valid keystroke.

3. **Web Audio API Procedural Synthesis Architecture**:
   - Observation 1 requires major pentatonic scale (C, D, E, G, A) on success and a dull wood/rubber sound on miss.
   - Observation 2 shows reliance on static `.wav` files.
   - By calculating C Major pentatonic frequencies across octaves 4 and 5 (C4=261.63Hz, D4=293.66Hz, E4=329.63Hz, G4=392.00Hz, A4=440.00Hz, C5=523.25Hz, etc.), the audio engine will synthesize sine tones with quick attack (8ms) and exponential decay (140ms), rising on consecutive hits (`comboCount`).
   - For miss sounds, a triangle oscillator rapidly dropping from 140Hz to 55Hz with a 380Hz lowpass filter creates the exact dull acoustic wood/rubber thud requested.

4. **Intelligent VoiceQueue Architecture**:
   - Observation 1 requires anti-overlap, typing rate throttling, and phonetic vs letter name modes.
   - The new `VoiceQueue` class will serialize utterances by priority (`CRITICAL`, `HIGH`, `NORMAL`, `LOW`), preventing overlapping speech.
   - When PPM > 25, verbose speeches are discarded in favor of short interjections ("¡Bien!", "¡Fuego!"), protecting child concentration.

5. **Headless Test Harness Architecture (`node test_harness.js`)**:
   - Observation 1 requires `node test_harness.js` exiting with 0, validating EventBus events, mascot FSM states, accuracy calculations, level progression, and StorageManager persistence.
   - Observation 2 confirms Node.js v24.21.0 is installed and functional.
   - Because no `package.json` exists, building `test_harness.js` using Node's standard library (`node:assert`, zero npm dependencies) guarantees instant execution, zero installation steps, and maximum portability.

---

## 3. Caveats

- **Web Audio Autoplay Policy**: Web browsers require user interaction before `AudioContext.state` transitions from `suspended` to `running`. The audio engine must attach an interaction listener on the first user click or keydown to call `audioCtx.resume()`. The headless test harness will mock `AudioContext` so browser policies do not block CLI tests.
- **Web Speech API Availability in Headless Node**: Node.js does not have a native `window.speechSynthesis`. The test harness must provide a clean mock of `SpeechSynthesis` to verify that `VoiceQueue` schedules, prioritizes, and discards utterances correctly without requiring a browser window.
- **Physical Bumps on Keyboards**: Web applications cannot produce physical tactile sensation on plastic hardware; the "tactile bumps on F and J" requirement refers to prominent visual tactile homemark indicators (embossed ridges) replicating physical keyboard homemarks for sight-guided finger placement.

---

## 4. Conclusion

The authoritative specifications for R4, R5, and R6 have been comprehensively mined, reconciled with the existing codebase, and formally documented in:
`c:\mecano\Mecano-main\Mecano-main\.agents\teamwork\spec_miner_survey_3\survey_specs.md`

All mathematical parameters (pentatonic scale frequencies, ADSR envelopes, accuracy formulas, hesitation windows), CSS visual rules (3D button depths, bumps, neon high-contrast palette, exact finger color hex codes), and test harness contracts are finalized and ready for the Orchestrator to decompose into milestones M4, M5, and M6.

---

## 5. Verification Method

To independently verify the findings of this survey:
1. **Inspect Survey Document**:
   - View `c:\mecano\Mecano-main\Mecano-main\.agents\teamwork\spec_miner_survey_3\survey_specs.md`
   - Confirm presence of Features Discovered table (22 features), Edge Cases table (17 edge cases), exact pentatonic frequencies table, finger color assignment table, and R6 test suite contracts.
2. **Verify Node.js Version**:
   - Run `node --version` in workspace root. (Expected: `v24.21.0`).
3. **Verify Color Definitions Against Requirements**:
   - Compare `survey_specs.md § Standard Pedagogical Finger Color Assignment` with `ORIGINAL_REQUEST.md § R4` to confirm exact alignment:
     - Pinky = Coral/Soft Red
     - Ring = Warm Orange
     - Middle = Sun Yellow
     - Left Index = Mint Green
     - Right Index = Sky Blue
     - Thumbs = Magic Purple
