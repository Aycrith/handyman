# Gap Analysis — Prioritized by Impact × Effort

## Critical Gaps (P0) — All Resolved ✅

| Gap | Visual Impact | Complexity | Status |
|-----|--------------|------------|--------|
| Motion grammar + overflow mask typography | Very High | Medium | ✅ Done (Phase A/B) |
| Scroll continuity / atmospheric thread | Very High | Medium | ✅ Done (Phase E + E★) |
| Lenis exponential decay easing | High | Low | ✅ Done (Phase A) |

## High-Impact Gaps (P1) — All Resolved ✅

| Gap | Visual Impact | Complexity | Status |
|-----|--------------|------------|--------|
| Typography-in-motion (section titles via overflow mask) | High | Low-Medium | ✅ Done (Phase B2) |
| Sectional visual identities (4 rooms) | High | High | ✅ Done (Phase C1–C5) |
| Services card choreography | High | Medium | ✅ Done (Phase B1) |
| Gallery tilt + inner parallax | High | Medium | ✅ Done (Phase B3) |
| Loading / progressive enhancement | High | Medium | ✅ Done (Phase D4) |
| Section fold transitions (clip-path) | High | Low | ✅ Done (Phase B6) |
| Cursor mix-blend-mode: exclusion | Medium-High | Low | ✅ Done (Phase B3) |

## Medium-Impact Gaps (P2)

| Gap | Visual Impact | Complexity | Status |
|-----|--------------|------------|--------|
| Custom GLSL shaders (grain, grade) | Medium-High | Very High | Deferred — P3 |
| Post-processing expansion (DoF, CA) | Medium-High | High | Deferred — P3 |
| Mobile distinct UX tier | High | High | ✅ Done (Phase D3) |
| Environmental FX below fold | Medium | High | ✅ Done (Phase E + E★) |
| Scroll-position color breathing | Medium | Low | ✅ Superseded by SCROLL_ZONES zone bgColor |
| Font metric overrides (CLS prevention) | Medium | Low | ✅ Done (Phase A1) |
| Motion-kill mode for low-end touch | High | Low | ✅ Done (Phase D3) |

## New Gaps Added + Resolved 2026-03-15 (Phase E) ✅

> **Note (2026-03-16):** Items below were initially marked ✅ based on the zone system
> architecture being in place, but the rendering pipeline had 7 bugs preventing
> actual visual differentiation. All bugs fixed: zone lighting connected,
> `environmentAlpha` introduced, overlay handoff activated, camera spline Z enabled,
> workshop opacity raised to 60%.

| Gap | Visual Impact | Complexity | Status |
|-----|--------------|------------|--------|
| Continuous 3D world below hero fold | Very High | High | **✅ RESOLVED — Canvas visibility fix + SCROLL_ZONES + environmentAlpha** |
| Environment geometry in scene (workshop.glb) | High | Medium | **✅ RESOLVED — `_workshopEnv` loads, fades in via `_zoneT` at 60% max** |
| Per-zone lighting/bloom/fog interpolation | High | Medium | **✅ RESOLVED — Zone targets connected to keyLight/fillLight/rimLight/groundGlow/exposure** |
| Camera spline journey through zones | Medium | Medium | **✅ RESOLVED — `CatmullRomCurve3` 9-waypoint spline with X/Y/Z interpolation** |
| Per-zone particle story transitions | Medium | Medium | **✅ RESOLVED — `SCROLL_ZONE_PARTICLE_STORIES` + `_zoneT` lerp** |
| Environment asset processing pipeline | — | Low-Medium | **Deferred — raw GLBs used via URL; optimization optional** |
| Section backgrounds blocking canvas | Very High | Low | **✅ RESOLVED — Phase E★ CSS fix (2026-03-15)** |

## Lower-Impact / Deferred (P3-P4)

| Gap | Notes |
|-----|-------|
| Three.js upgrade (r134 → r170+) | Very High complexity, Phase 4 only |
| Bundle code-splitting | Medium complexity, can do in D5 |
| Contact form backend | Infrastructure work, out of scope |
| Audio reactivity | Optional/experimental |

## Phase F Gaps — Cinematic World System (NEW — 2026-03-15)

| Gap | Visual Impact | Complexity | Status |
|-----|--------------|------------|--------|
| 10-act cinematic world system architecture | Very High | Very High | **✅ RESOLVED — world-manager.js + world-orchestrator-setup.js + 9 worlds + 5 transition techniques** |
| Authored transition cinematics (8 transitions) | Very High | High | **✅ RESOLVED — fog-flythrough, particle-dissolve, wireframe-morph, point-cloud-morph, bloom-crossfade** |
| Custom GLSL shaders for fog + point clouds | High | High | **✅ RESOLVED — 4 shaders (fog-plane.frag/vert, point-cloud.frag/vert)** |
| Camera blending per-world targets | High | Medium | **✅ RESOLVED — getWorldCameraTarget() blended into spring physics** |
| Particle story blending per-world | Medium | Medium | **✅ RESOLVED — getWorldParticleStory() overrides zone stories** |
| Lighting override expansion (6 channels) | High | Medium | **✅ RESOLVED — key/fill/rim/ground/bloom/threshold/bgColor/fogDensity/exposure** |
| Mobile tier world filtering | High | Medium | **✅ RESOLVED — ACT 3-7 skipped on mobile, 4-world simplified path** |
| Debug overlay & diagnostics | Medium | Low | **✅ RESOLVED — world-debug-overlay.js + __sceneDiagnostics().worldState** |
| Optimized environment GLBs (asset pipeline) | Very High | Medium | **❌ OPEN — script exists but never run. Raw GLBs used (~300MB+ total). Requires gltf-transform.** |
| Post-processing extensions (DoF, CA) | Medium-High | High | **❌ OPEN — EffectComposer has bloom only. No bokeh or chromatic aberration.** |
| Scene event naming (zone→world) | Low | Low | **❌ OPEN — site/index.js still dispatches scene:zone-change** |
| CSS world tokens | Low | Low | **❌ OPEN — no --world-* custom properties** |
| World test integration | Medium | Low | **❌ OPEN — validate-worlds.js orphaned from test runner** |
| Timing/easing calibration | High | Medium | **❌ OPEN — blocked on optimized assets** |
| Quality tier end-to-end validation | High | Medium | **❌ OPEN — mobile filter done, full tier testing not done** |

## Reference-Site Research Gaps (from Gap Analysis section in plan)

| Gap | Technique | Source | Severity |
|-----|-----------|--------|----------|
| R1 — Overflow mask typography | `overflow:hidden` parent | sr-seventy.one, Dragonfly | CRITICAL |
| R2 — Section fold transitions | `clip-path: inset()` | Dragonfly | HIGH |
| R3 — Loading orchestration timing | Millisecond choreography | mont-fort, Adaline | REQUIRED |
| R4 — Lenis physics tuning | Exponential decay easing | nohero, mantis | MEDIUM |
| R5 — Scroll-position color breathing | Continuous CSS var | nohero | MEDIUM |
| R6 — Device-aware motion kill | Dogstudio pattern | Dogstudio | REQUIRED |
| R7 — Cursor exclusion blend | `mix-blend-mode: exclusion` | Multiple | MEDIUM |
| R8 — Font loading CLS prevention | `size-adjust` + metric overrides | Mantis | REQUIRED |
| R9 — Canvas pointer isolation | `pointer-events: none` | Heffernan | VERIFY |
