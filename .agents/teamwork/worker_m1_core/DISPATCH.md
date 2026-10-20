# Task Assignment: Worker M1 (Agente 0: Core Architecture, EventBus & Persistence)
- Working directory: c:\mecano\Mecano-main\Mecano-main\.agents\teamwork\worker_m1_core\
- Project scope: c:\mecano\Mecano-main\Mecano-main\PROJECT.md
- Requirements: c:\mecano\Mecano-main\Mecano-main\.agents\teamwork\ORIGINAL_REQUEST.md
- Output: src/core/EventBus.js, src/core/StorageManager.js, src/core/GameEngine.js, server.js, and handoff.md
## 2026-10-18T09:33:48Z
You are Worker M1 (Agente 0: Core Architecture, EventBus & Persistence).
Your working directory is:
c:\mecano\Mecano-main\Mecano-main\.agents\teamwork\worker_m1_core\

Mandatory reading:
1. Read the original user requirements in:
   c:\mecano\Mecano-main\Mecano-main\.agents\teamwork\ORIGINAL_REQUEST.md
2. Read the project architecture, feature inventory, and contracts in:
   c:\mecano\Mecano-main\Mecano-main\PROJECT.md
3. Read the technical survey in:
   c:\mecano\Mecano-main\Mecano-main\.agents\teamwork\explorer_survey_2\survey_core_visuals.md

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

File ownership:
You own exclusively:
- src/core/EventBus.js
- src/core/StorageManager.js
- src/core/GameEngine.js
- server.js

Task instructions:
1. Create directory structure: `src/core/`, `src/vfx/`, `src/mascot/`, `src/keyboard/`, `src/audio/`.
2. Implement `src/core/EventBus.js` as an ES module:
   - Pub/Sub system with `on(event, handler)`, `off(event, handler)`, `emit(event, data)`.
   - Complete support for the 7 typed events specified in PROJECT.md:
     `KEY_TARGET_CHANGED`, `KEY_PRESSED_SUCCESS`, `KEY_PRESSED_FAIL`, `USER_STUCK`, `FEVER_MODE_CHANGED`, `MASCOT_SPEAK_REQUEST`, `LEVEL_COMPLETED`.
   - Provide `clear()` and helper inspection methods for testing.
3. Implement `src/core/StorageManager.js` as an ES module:
   - Persistent storage for level stars (`saveLevelStars`, `getLevelStars`), unlocked accessories (`unlockAccessory`, `getUnlockedAccessories`), equipped accessories (`equipAccessory`, `getEquippedAccessories`), and letter error heatmap (`recordError`, `getErrorHeatmap`).
   - Seamless fallback to internal memory store when running headlessly in Node.js where `localStorage` is not defined.
4. Implement `src/core/GameEngine.js` as an ES module:
   - Manages typing state, active level, current target key, accuracy calculation `(correctHits / totalKeystrokes) * 100`, combo count, and fever mode multiplier.
   - Emits and handles events through EventBus.
5. Implement `server.js` at project root:
   - Lightweight, zero-dependency Node.js HTTP server.
   - Serves static files with correct MIME types (`application/javascript` for `.js` ES modules, `text/html`, `text/css`, `image/png`, `audio/wav`, etc.).
   - Support port configuration (default 3000).
6. Verify your implementation by running syntax/execution checks (`node --check` or quick node verification of modules).
7. Write `handoff.md` in your working directory with verification commands, outputs, and status.
8. Send completion message to orchestrator.
