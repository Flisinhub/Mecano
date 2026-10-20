## 2026-10-18T09:41:02Z
You are Worker M4 (Agente 3: Teclado Ergonómico "Toy-Style", Manos Guía y Pedagogía Anti-Frustración).
Your working directory is:
c:\mecano\Mecano-main\Mecano-main\.agents\teamwork\worker_m4_keyboard\

Mandatory reading:
1. Read original requirements in:
   c:\mecano\Mecano-main\Mecano-main\.agents\teamwork\ORIGINAL_REQUEST.md
2. Read project architecture and contracts in:
   c:\mecano\Mecano-main\Mecano-main\PROJECT.md
3. Read the specification report in:
   c:\mecano\Mecano-main\Mecano-main\.agents\teamwork\spec_miner_survey_3\survey_specs.md

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

File ownership:
You own exclusively:
- src/keyboard/ToyKeyboard.js
- src/keyboard/GhostHands.js
- src/keyboard/PedagogyEngine.js
- src/keyboard/KeyboardLayout.js
- src/keyboard/keyboard.css

Task instructions:
1. Implement `src/keyboard/KeyboardLayout.js`:
   - Spanish standard QWERTY layout definitions with coordinates and strict pedagogical finger color mappings:
     - Pinkies (Q, A, Z / P, Ñ, -): Coral / Soft Red (`#ff6b81`)
     - Ring (W, S, X / O, L, .): Warm Orange (`#ff9f43`)
     - Middle (E, D, C / I, K, ,): Sun Yellow (`#ffd32a`)
     - Left Index (R, F, V, T, G, B): Mint Green (`#2ed573`)
     - Right Index (Y, H, N, U, J, M): Sky Blue (`#00d2d3`)
     - Thumbs (Espacio): Magic Purple (`#9b59b6`)
2. Implement `src/keyboard/ToyKeyboard.js`:
   - 3D tactile button styling with realistic depth, squishy depression, and visual tactile bump markers on `F` and `J`.
   - Key screen position reporting for projectile targeting.
   - Non-punitive feedback: wrong key gently shakes (`applySquashAndStretch` or shake CSS), target key pulses luminously.
3. Implement `src/keyboard/GhostHands.js`:
   - Translucent hands overlay placed above keyboard with illuminated active finger corresponding to target key.
   - Idle suggestion animation starting after 2 seconds of inactivity (`USER_STUCK`).
4. Implement `src/keyboard/PedagogyEngine.js`:
   - 8-level micro-curriculum based on `words.js` (home row, top row, bottom row, syllables, visual words).
   - Zero game over screens, zero point penalties, celebratory milestone completion.
5. Create `src/keyboard/keyboard.css` with 3D button depths, bumps, hand glow, and finger color variables.
6. Verify your code with `node --check`, write `handoff.md` in your working directory and send a completion message to the orchestrator.
