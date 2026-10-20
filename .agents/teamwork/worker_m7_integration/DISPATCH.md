## 2026-10-18T09:50:58Z
You are Worker M7 (Integration & System Polish Worker).
Your working directory is:
c:\mecano\Mecano-main\Mecano-main\.agents\teamwork\worker_m7_integration\

Mandatory reading:
1. Read the original requirements in:
   c:\mecano\Mecano-main\Mecano-main\.agents\teamwork\ORIGINAL_REQUEST.md
2. Read the project architecture and milestone index in:
   c:\mecano\Mecano-main\Mecano-main\PROJECT.md
3. Review handoff reports from:
   - c:\mecano\Mecano-main\Mecano-main\.agents\teamwork\worker_m1_core\handoff.md
   - c:\mecano\Mecano-main\Mecano-main\.agents\teamwork\worker_m2_vfx\handoff.md
   - c:\mecano\Mecano-main\Mecano-main\.agents\teamwork\worker_m3_mascot\handoff.md
   - c:\mecano\Mecano-main\Mecano-main\.agents\teamwork\worker_m4_keyboard\handoff.md
   - c:\mecano\Mecano-main\Mecano-main\.agents\teamwork\worker_m5_audio\handoff.md

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

File ownership:
You own exclusively:
- src/main.js
- index.html
- style.css

Task instructions:
1. Review all implemented modules in `src/core/`, `src/vfx/`, `src/mascot/`, `src/keyboard/`, `src/audio/`.
2. Implement `src/main.js` as the modern ES module application bootstrap:
   - Import and wire together:
     - `EventBus`, `StorageManager`, `GameEngine` from `src/core/`
     - `LiveScene`, `ParticleEngine`, `BezierProjectiles`, `applySquashAndStretch` from `src/vfx/`
     - `MascotAnimator`, `MascotFSM`, `LipSync`, `SpeechBubble`, `AccessorySocket` from `src/mascot/`
     - `ToyKeyboard`, `GhostHands`, `PedagogyEngine` from `src/keyboard/`
     - `ProceduralAudio`, `VoiceQueue`, `AccessibilityPanel` from `src/audio/`
   - Handle key down events, wire EventBus subscriptions, and connect game UI (level progress, word display, stats, high-five interaction).
3. Refactor `index.html`:
   - Remove the dead video element (`assets/animated_bg.mp4`).
   - Add the living scene container `#live-scene-container` with canvas elements.
   - Link module stylesheets: `src/vfx/vfx.css`, `src/mascot/mascot.css`, `src/keyboard/keyboard.css`, `src/audio/audio.css`.
   - Mount `<script type="module" src="src/main.js"></script>`.
4. Refactor `style.css`:
   - Clean up dead video styles and connect unified theme styling.
   - Support `.font-dyslexic` and `.high-contrast` accessibility classes.
5. Verify integration:
   - Run `node --check src/main.js`
   - Run `node test_harness.js` (must pass 100% with exit code 0).
   - Verify that `node server.js` can serve the project.
6. Write `handoff.md` in your working directory and send a completion message to the orchestrator.
