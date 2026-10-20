# Task Assignment: Test Writer M6 (E2E Verification Harness & Test Infra)
- Working directory: c:\mecano\Mecano-main\Mecano-main\.agents\teamwork\test_writer_m6\
- Project scope: c:\mecano\Mecano-main\Mecano-main\PROJECT.md
- Requirements: c:\mecano\Mecano-main\Mecano-main\.agents\teamwork\ORIGINAL_REQUEST.md
- Output: test_harness.js, TEST_INFRA.md, and handoff.md

## 2026-10-18T09:33:48Z
You are Test Writer M6 (E2E Verification Harness & Test Infrastructure).
Your working directory is:
c:\mecano\Mecano-main\Mecano-main\.agents\teamwork\test_writer_m6\

Mandatory reading:
1. Read the original user requirements in:
   c:\mecano\Mecano-main\Mecano-main\.agents\teamwork\ORIGINAL_REQUEST.md
2. Read the project architecture, feature inventory, and contracts in:
   c:\mecano\Mecano-main\Mecano-main\PROJECT.md
3. Read the specification report in:
   c:\mecano\Mecano-main\Mecano-main\.agents\teamwork\spec_miner_survey_3\survey_specs.md

File ownership:
You own exclusively:
- test_harness.js (at project root c:\mecano\Mecano-main\Mecano-main\test_harness.js)
- TEST_INFRA.md (at project root c:\mecano\Mecano-main\Mecano-main\TEST_INFRA.md)

Task instructions:
1. Create `TEST_INFRA.md` following the template in PROJECT.md and the Project Pattern.
2. Implement `test_harness.js` at project root using zero external npm dependencies (using Node built-ins: `node:assert`, `node:test` or custom runner).
3. The harness must execute cleanly with `node test_harness.js`, exit with code 0 on complete pass, and print clear assertion diagnostics on failure.
4. It must contain tests for:
   - Suite 1: EventBus - subscribe, emit all 7 typed events, unsubscribe, verify payloads and listeners.
   - Suite 2: StorageManager - stars per level, errorHeatmap per letter, accessories unlock/equip, resilience with fallback store in Node.
   - Suite 3: GameEngine - accuracy calculation, combo tracking, fever mode activation at combo >= 10.
   - Suite 4: Mascot FSM - transitions across all 6 states (IDLE -> FLOW_DANCE -> HELPER_POINTING -> SLEEPY -> HIGH_FIVE_WAIT -> CELEBRATING), handling USER_STUCK and LEVEL_COMPLETED.
   - Suite 5: Level Progression & Pedagogy - micro-level curriculum progression, non-punitive error handling.
5. The harness must gracefully import available modules as they are created (`src/core/EventBus.js`, etc.), providing mock environments for Web Audio / Web Speech when testing those components in headless Node.js.
6. Verify your test harness by running `node test_harness.js` and ensuring it executes.
7. Write `handoff.md` in your working directory with execution logs and coverage details.
8. Send completion message to orchestrator.
