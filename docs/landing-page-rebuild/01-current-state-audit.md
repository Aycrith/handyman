# Current State Audit

**Audited:** 2026-03-14
**Files audited:** `src/site/index.js` (1,286 lines), `src/scene/index.js` (~9,000+ lines), `styles.css` (2,615 lines), `index.html` (937 lines)

## What Works (Protect These)

| System | Location | Status |
|--------|----------|--------|
| Director phase state machine (6 phases) | scene/index.js | ✓ Ship as-is |
| Quality-tier detection (desktop/mobile/low) + GPU probing | scene/index.js | ✓ Ship as-is |
| GSAP `quickTo` + ScrollTrigger.scrollerProxy for Lenis | site/index.js | ✓ Ship as-is |
| Particle species architecture with per-tier counts | scene/index.js | ✓ Ship as-is |
| `--scene-warmth` CSS variable from Lenis scroll | site/index.js | ✓ Ship as-is |
| `prefers-reduced-motion` in CSS and JS | styles.css, site/index.js | ✓ Ship as-is |
| Playwright test harness (16 tests) | tests/ | ✓ Must not regress |
| Custom cursor with `gsap.quickTo` RAF batching | site/index.js:867 | ✓ Extend only |
| Fluid typography with `clamp()` | styles.css | ✓ Ship as-is |
| HDRI-lit scene with ACESFilmic tone mapping | scene/index.js | ✓ Ship as-is |
| Hero director phases (SHA256 verified bespoke GLB pack) | scene/index.js | ✓ Ship as-is |

## What Is Weak

| Issue | Location | Impact |
|-------|----------|--------|
| 22 `initX()` functions all use same `fromTo(opacity,y)` pattern | site/index.js | Very High |
| SplitType imported but underused below hero | site/index.js:906 | High |
| Services horizontal scroll: no per-card choreography | site/index.js:1014 | High |
| Gallery: no inner parallax, no editorial voice | site/index.js:680 | High |
| No scroll continuity — world "ends" at hero scroll-out | site/index.js | High |
| Post-processing: bloom + grade only (no DoF, CA) | scene/index.js | Medium |
| Three.js r134 (~35 versions behind) | package.json | Low (deferred) |
| Preloader: 7s hard timeout, no skeleton strategy | site/index.js:812 | Medium |

## What Is Missing Entirely

| Feature | PRD |
|---------|-----|
| Motion grammar / overflow mask typography | PRD 02 |
| Sectional visual identities (4 distinct "rooms") | PRD sections C1-C5 |
| Environmental FX continuity below fold | PRD 05 |
| Custom GLSL shaders | PRD 07 |
| Mobile as distinct UX tier | PRD 10 |
| Progressive asset streaming / skeleton content | PRD 08 |
| Section fold transitions (clip-path inset) | PRD 02 amendment |
| Cursor mix-blend-mode: exclusion | PRD 04 |
| Font metric overrides (prevent CLS) | PRD 08 |
| Motion-kill mode for low-end touch | PRD 10 |
| Skip-to-content link | PRD 11 |
| Section-level Playwright tests | PRD 12 |

## initX() Function Inventory (22 functions)

All using same reveal pattern — targets for Phase B refactor:

| Function | Line | Current Pattern | Target Mode |
|----------|------|----------------|-------------|
| `initSectionReveals` | 355 | opacity/y fade | precision-stagger |
| `initServiceCards` | 386 | col-stagger opacity/y | precision-stagger + perspective-flip |
| `initTestimonials` | 421 | opacity/y stagger | precision-stagger + blur |
| `initCountUp` | 451 | opacity reveal | precision-stagger (keep count-up) |
| `initPillars` | 489 | i×0.14s opacity/y | precision-stagger |
| `initCtaBand` | 518 | opacity/y | section-fold + ambient-drift |
| `initSectionTitleLines` | 545 | SplitType word opacity/y | cinematic-sweep (overflow mask) |
| `initProcessSteps` | 630 | stagger opacity/y | precision-stagger + SVG connectors |
| `initGallery` | 680 | i%3×0.1s scale/opacity | precision-stagger |
| `initRhetoricalSection` | 721 | opacity/blur stagger | cinematic-sweep (line-by-line) |
| `initContactForm` | 785 | opacity/y slide-right | precision-stagger |
