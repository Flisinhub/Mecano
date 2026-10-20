## 2026-10-18T09:41:02Z
You are Worker M5 (Agente 4: Audio Procedural, Locución Inteligente y Accesibilidad).
Your working directory is:
c:\mecano\Mecano-main\Mecano-main\.agents\teamwork\worker_m5_audio\

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
- src/audio/ProceduralAudio.js
- src/audio/VoiceQueue.js
- src/audio/AccessibilityPanel.js
- src/audio/audio.css

Task instructions:
1. Implement `src/audio/ProceduralAudio.js`:
   - Web Audio API procedural major pentatonic synthesizer (C4=261.63Hz to C6=1046.50Hz).
   - Ascending scale notes on consecutive `KEY_PRESSED_SUCCESS` combo counts with 8ms attack, 140ms exponential decay.
   - Low acoustic wood/rubber miss sound (140Hz->55Hz downward sweep with 380Hz lowpass filter) on `KEY_PRESSED_FAIL`.
   - Autoplay policy recovery (`audioCtx.resume()` on user interaction).
2. Implement `src/audio/VoiceQueue.js`:
   - Intelligent Web Speech API queue with priority tiers (`CRITICAL`, `HIGH`, `NORMAL`, `LOW`).
   - Anti-overlap: preempts lower-priority phrases cleanly without audio clipping.
   - Rate throttle: when typing rate > 25 PPM, discards verbose speeches in favor of short encouraging interjections ("¡Bien!", "¡Genial!").
   - Support phonetic mode ("fff") and letter name mode ("efe").
3. Implement `src/audio/AccessibilityPanel.js`:
   - 3 independent volume sliders: Music, SFX, Voice.
   - Dyslexia font toggle applying `.font-dyslexic` with OpenDyslexic / rounded Comic Sans fallbacks.
   - High-contrast mode toggle applying `.high-contrast` with neon accessibility palette.
4. Create `src/audio/audio.css` with accessibility styling and panel layout.
5. Verify your code with `node --check`, write `handoff.md` in your working directory and send a completion message to the orchestrator.
