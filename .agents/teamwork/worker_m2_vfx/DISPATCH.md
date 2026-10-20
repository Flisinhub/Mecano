## 2026-10-18T09:41:02Z
You are Worker M2 (Agente 1: Escena Viva, Arte Técnico y Motor de Partículas VFX).
Your working directory is:
c:\mecano\Mecano-main\Mecano-main\.agents\teamwork\worker_m2_vfx\

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
- src/vfx/LiveScene.js
- src/vfx/ParticleEngine.js
- src/vfx/BezierProjectiles.js
- src/vfx/SquashStretch.js
- src/vfx/vfx.css

Task instructions:
1. Implement `src/vfx/LiveScene.js`:
   - Live scene container with smooth Parallax effect on `Main Scene.png` (or `assets/main_scene.png`) responding to mouse/time drift with smooth lerp.
   - Dynamic lighting filter for Fever Mode responding to `FEVER_MODE_CHANGED { isActive, multiplier }`.
   - Unified 3px sticker outline and drop-shadow styling for sprite elements.
2. Implement `src/vfx/ParticleEngine.js`:
   - Ambient floating particles (translucent bubbles, twinkling golden stars, motes) with an object pool.
   - Radial burst particle generator keyed to the 6 pedagogical finger colors upon key press or target impact.
3. Implement `src/vfx/BezierProjectiles.js`:
   - Quadratic Bézier magic projectile curve ($B(t) = (1-t)^2 P_0 + 2(1-t)t P_1 + t^2 P_2$) connecting pressed key position (`keyScreenPosition`) to target (mascot or progress bar).
   - Trail of glowing particles matching finger color.
4. Implement `src/vfx/SquashStretch.js`:
   - Damped harmonic oscillation `applySquashAndStretch(element, options)` for deformation and rebound without permanent distortion.
5. Create `src/vfx/vfx.css` with required animation keyframes, fever mode glow, and sticker outline filters.
6. Verify your code with `node --check` and verify module exports.
7. Write `handoff.md` in your working directory and send a completion message to the orchestrator.
