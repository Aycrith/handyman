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

| Gap | Visual Impact | Complexity | Status |
|-----|--------------|------------|--------|
| Continuous 3D world below hero fold | Very High | High | **✅ RESOLVED — Canvas visibility fix + SCROLL_ZONES** |
| Environment geometry in scene (workshop.glb) | High | Medium | **✅ RESOLVED — `_workshopEnv` loads, fades in via `_zoneT`** |
| Per-zone lighting/bloom/fog interpolation | High | Medium | **✅ RESOLVED — `updateScrollZone()` lerps all render params** |
| Camera spline journey through zones | Medium | Medium | **✅ RESOLVED — `CatmullRomCurve3` 7-waypoint spline** |
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
