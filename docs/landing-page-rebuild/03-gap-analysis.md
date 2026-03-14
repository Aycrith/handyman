# Gap Analysis — Prioritized by Impact × Effort

## Critical Gaps (P0)

| Gap | Visual Impact | Complexity | Priority |
|-----|--------------|------------|----------|
| Motion grammar + overflow mask typography | Very High | Medium | P0 |
| Scroll continuity / atmospheric thread | Very High | Medium | P0 |
| Lenis exponential decay easing | High | Low | P0 |

## High-Impact Gaps (P1)

| Gap | Visual Impact | Complexity | Priority |
|-----|--------------|------------|----------|
| Typography-in-motion (section titles via overflow mask) | High | Low-Medium | P1 |
| Sectional visual identities (4 rooms) | High | High | P1 |
| Services card choreography | High | Medium | P1 |
| Gallery tilt + inner parallax | High | Medium | P1 |
| Loading / progressive enhancement | High | Medium | P1 |
| Section fold transitions (clip-path) | High | Low | P1 |
| Cursor mix-blend-mode: exclusion | Medium-High | Low | P1 |

## Medium-Impact Gaps (P2)

| Gap | Visual Impact | Complexity | Priority |
|-----|--------------|------------|----------|
| Custom GLSL shaders (grain, grade) | Medium-High | Very High | P2 |
| Post-processing expansion (DoF, CA) | Medium-High | High | P2 |
| Mobile distinct UX tier | High | High | P2 |
| Environmental FX below fold | Medium | High | P2 |
| Scroll-position color breathing | Medium | Low | P2 |
| Font metric overrides (CLS prevention) | Medium | Low | P2 |
| Motion-kill mode for low-end touch | High | Low | P2 |

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
