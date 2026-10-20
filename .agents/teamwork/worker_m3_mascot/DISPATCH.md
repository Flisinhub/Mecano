## 2026-10-18T09:41:02Z
You are Worker M3 (Agente 2: Mascota Interactiva, Animación Procedural e IA Emocional).
Your working directory is:
c:\mecano\Mecano-main\Mecano-main\.agents\teamwork\worker_m3_mascot\

Mandatory reading:
1. Read original requirements in:
   c:\mecano\Mecano-main\Mecano-main\.agents\teamwork\ORIGINAL_REQUEST.md
2. Read project architecture and contracts in:
   c:\mecano\Mecano-main\Mecano-main\PROJECT.md
3. Read the visual technical survey in:
   c:\mecano\Mecano-main\Mecano-main\.agents\teamwork\explorer_survey_2\survey_core_visuals.md

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

File ownership:
You own exclusively:
- src/mascot/MascotAnimator.js
- src/mascot/MascotFSM.js
- src/mascot/LipSync.js
- src/mascot/SpeechBubble.js
- src/mascot/AccessorySocket.js
- src/mascot/mascot.css

Task instructions:
1. Implement `src/mascot/MascotAnimator.js`:
   - Sinusoidal resting breathing animation (continuous vertical translation and subtle scale oscillation).
   - Look-at angular tilt (`-4deg` to `+4deg`) dynamically tracking target key position from `KEY_TARGET_CHANGED`.
   - Hop / jump animation on combo streaks.
2. Implement `src/mascot/LipSync.js`:
   - Simulated dynamic lip-sync mouth opening/bouncing synced with spoken dialogue text or syllable cadence.
3. Implement `src/mascot/SpeechBubble.js`:
   - Comic-style speech bubble with typewriter effect and automatic pedagogical key name highlighting (e.g. `[F]`).
4. Implement `src/mascot/MascotFSM.js`:
   - 6-state finite state machine: `IDLE`, `FLOW_DANCE`, `HELPER_POINTING`, `SLEEPY`, `HIGH_FIVE_WAIT`, `CELEBRATING`.
   - Transitions on `USER_STUCK` -> `HELPER_POINTING` (points toward target key/finger).
   - Inactivity timer at 25s -> `SLEEPY` ("Zzz...", wakes up cheerfully on any key press).
   - `LEVEL_COMPLETED` -> `HIGH_FIVE_WAIT` (prompts high-five with Spacebar, reacts with confetti/celebration).
   - High combo streaks -> `FLOW_DANCE`.
5. Implement `src/mascot/AccessorySocket.js`:
   - Accessory socket management (hats, glasses, crowns) with normalized anchor positions and star-based unlocks.
6. Create `src/mascot/mascot.css` with required styles and animations.
7. Verify your code with `node --check`, write `handoff.md` in your working directory and send a completion message to the orchestrator.
