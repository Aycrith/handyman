# Landing Page World-Class Transformation — Executive Summary

**Date:** 2026-03-15 (last updated)
**Branch:** feat/workshop-journey (active)
**Goal:** Transform the Handyman landing page from a technically capable 3D hero with generic 2D sections into a fully authored, world-class immersive web experience.

## Implementation Status

| Phase | Status | Completed |
|-------|--------|-----------|
| A — Motion Grammar | ✅ DONE | 2026-03-15 |
| B — Motion Grammar per-section | ✅ DONE | 2026-03-15 |
| C — Sectional Worlds | ✅ DONE | 2026-03-15 |
| D — Polish & Finish | ✅ DONE | 2026-03-15 |
| E — Workshop Journey (backend) | ✅ DONE | 2026-03-15 |
| E★ — Canvas Visibility Fix | ✅ DONE | 2026-03-15 |
| F — Cinematic World System | 🔧 IN PROGRESS | Code complete, asset pipeline + polish remaining |

**Current state:** The cinematic 10-act world system architecture is fully implemented — 9 worlds, 8 authored transitions (fog flythrough, particle dissolve, wireframe morph, point cloud morph, bloom crossfade), 4 custom shaders, progressive asset loading, mobile tier filtering, and full diagnostic overlay. Build passes, runtime has zero errors, tests pass across all viewports. Remaining: asset pipeline execution (optimized GLBs), post-processing extensions (DoF, chromatic aberration), integration cleanup, and timing calibration.

## Quality Bar

Benchmarked against: activetheory.net, dogstudio.co, henryheffernan.com, dragonfly.xyz, lhbzr.com, mantis.works, tplh.net, nohero.studio, mont-fort.com, sr-seventy.one, adaline.ai.

## Architecture (Unchanged)

Vanilla JS + Three.js r134 + GSAP 3 + Lenis + SplitType + Vite. Single HTML, monolithic `src/scene/index.js`, `src/site/index.js` (1,285 lines), `styles.css` (2,300 lines). Phase F adds modular world system alongside: `src/scene/world-manager.js`, `src/scene/transition-techniques.js`, `src/scene/world-orchestrator-setup.js`, `src/scene/worlds/` (9 modules), `src/scene/shaders/` (4 files).

## Core Problem

The 3D hero quality ceiling is world-class, but everything below the fold is generic. Non-hero sections use a single reveal pattern (opacity 0→1, y N→0). There is no motion grammar, no sectional world-building, no environmental continuity, no authored mobile tier.

## Transformation Phases

| Phase | Name | Deliverable |
|-------|------|-------------|
| A | Foundation | Motion grammar system, Lenis physics, CSS design system, atmospheric scroll thread |
| B | Motion Grammar | Per-section authored animation identities |
| C | Sectional Worlds | Blueprint/Evidence/Precision/Statement visual rooms |
| D | Polish & Finish | Loading choreography, mobile tier, accessibility, performance |
| E | Workshop Journey | Continuous 3D world — SCROLL_ZONES, environment geometry, camera spline, per-zone particles (PRD 13) |
| F | Cinematic World System | 10-act scroll journey — 9 worlds, 8 transition techniques, 4 shaders, progressive loading, mobile tier filtering |

## Phase E★: Canvas Visibility Fix (Critical — 2026-03-15)

**Problem diagnosed:** The entire Workshop Journey backend was functional but invisible. All `.section` elements had `background-color: var(--color-bg)` (#0a0c12 opaque) covering the fixed canvas. Users saw no change below the fold because section backgrounds acted as a solid wall over the 3D world.

**Fix applied (`styles.css`):**
- Removed `background-color` from `.section` and `.section:nth-of-type(even)`
- Changed `.rhetoric-section`, `.stats-section`, `.contact-section` to `background: transparent`
- Removed solid `var(--color-bg)` fallback from `.cta-band` gradient
- Added per-zone atmospheric `::before` radial gradient overlays (40–60% opacity, fading to transparent) so text stays readable while the canvas breathes through
- Added `[data-scene-zone] > .container { position: relative; z-index: 1 }` stacking context fix

Card-level elements (`.service-card`, `.testimonial`, `.process-step`) already had glass morphism (`backdrop-filter: blur` + `rgba(255,255,255,0.035)`) so they remain readable without changes.

## Phase E: Workshop Journey (Added 2026-03-15)

The landing page evolves beyond a 3D hero + 2D sections into a **continuous 3D workshop environment**. Inspired by the activetheory.net scroll-driven world concept, reimagined with handyman workshop themes.

**Core concept:** The WebGL canvas never cuts after the hero. As users scroll, the scene's ambient environment — background color, lighting, fog, bloom, and particles — morphs continuously through 6 themed workshop zones. An actual 3D workshop structure (`workshop.glb`, processed to ≤4 MB) fades in as background environment geometry.

**Available assets:** `assets/3dmodels/workshop.glb`, `industrial_toolbox.glb`, `tool--box-assy-33.glb` (requires gltf-transform processing — see `docs/landing-page-rebuild/00b-asset-inventory.md`).

**Key technical components:**
- `SCROLL_ZONES` constant in `src/scene/index.js` (additive, no existing tables modified)
- DOM-based zone boundary resolution (not hardcoded ratios)
- `THREE.CatmullRomCurve3` camera spline (subtle ±0.3z amplitude)
- `SCROLL_ZONE_PARTICLE_STORIES` for per-zone particle behavior
- `initScrollZoneDriver()` in `src/site/index.js`

**Implementation plan:** `docs/plans/2026-03-15-workshop-journey-implementation.md`

## Critical Amendments Applied (from reference-site research)

1. **Typography reveals** use overflow:hidden mask technique (NOT opacity fade)
2. **Section fold transitions** via clip-path inset
3. **Loading orchestration** with precise millisecond timing (no spinner)
4. **Lenis physics** with exponential decay easing
5. **Cursor** with mix-blend-mode: exclusion
6. **Motion-kill mode** for low-end touch devices (Dogstudio pattern)
7. **Font metric overrides** to prevent layout reflow during swap
8. **Canvas pointer-events: none** verified (Heffernan pattern)

## World-Class Quality Checks

| Check | Pass Condition |
|-------|---------------|
| Typography reveal | Words rise from below overflow mask — NO opacity fade visible |
| Loading sequence | No spinner; body fade + choreographed stagger feels like directed film |
| Scroll physics | Perceptible momentum "coasting" on fast-then-release scroll |
| Cursor | Always visible via exclusion blend on dark/light backgrounds |
| Section entry | ≥4 sections have clip-path fold-in |
| Section identity | Each of 4 themed sections feels like a distinct room |
| Mobile on low-end | Static page served, no broken animations |
| 3D hero timing | First 3 seconds staged; tool reveal has weight and ceremony |
| Font loading | No visible layout jump when fonts swap from fallback |

## Phase F: Cinematic World System (Active Theory-Inspired) — IN PROGRESS

**Master plan:** 660-line session plan covering 10 acts, 8 transitions, 20 implementation steps across 6 sub-phases. Inspired by activetheory.net's scroll-driven environmental storytelling.

**Concept:** Rearchitect the 3D experience from a static background into a continuous camera journey through interconnected visual worlds. Each page section owns a distinct 3D world. Transitions between worlds are authored cinematic moments (fog flythrough, wireframe morph, particle dissolve, point cloud morph, bloom crossfade). The hero-to-services handoff is the signature ★ moment.

**Completed (code architecture):**
- `src/scene/world-manager.js` (771 lines) — SceneWorld base, TransitionSeq, WorldOrchestrator singleton
- `src/scene/transition-techniques.js` (798 lines) — 5 technique factories
- `src/scene/world-orchestrator-setup.js` (430 lines) — Bridge wiring all 9 worlds + 8 transitions
- 9 world modules in `src/scene/worlds/` (forge through workshop-return)
- 4 custom GLSL shaders (fog-plane, point-cloud)
- Camera blending, lighting/particle/fog override integration into scene/index.js
- Mobile tier: 4-world simplified path (ACT 3-7 skipped)
- Debug overlay with `?sceneDebug=1`
- Build: 41 modules, 0 errors. Runtime: 0 errors, 0 warnings.

**Remaining:**
- Asset pipeline execution (produces optimized GLBs from raw 3D models)
- Post-processing extensions (DoF, chromatic aberration)
- Integration cleanup (event rename, CSS tokens, test wiring)
- Timing/easing calibration and quality tier validation

See `docs/landing-page-rebuild/04-prioritized-roadmap.md` Phase F for detailed checklist.
