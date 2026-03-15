# Prioritized Implementation Roadmap

**Updated:** 2026-03-15 — Workshop Journey complete + canvas visibility fix applied

## Pre-Week 1: Apply Amendments (DONE in planning docs)

- [x] Amendment 1: Typography overflow mask technique (PRD 02)
- [x] Amendment 2: Section fold transitions B6 (below)
- [x] Amendment 3: Precise intro timing (PRD 08)
- [x] Amendment 4: Lenis exponential decay (PRD 06)
- [x] Amendment 5: Cursor mix-blend-mode exclusion (PRD 04)
- [x] Amendment 6: Motion-kill mode (PRD 10)
- [x] Amendment 7: Font metric overrides (PRD 08)
- [x] Amendment 8: Canvas pointer-events verify (PRD 01)

## Week 1: Phase A — Foundation ✅ COMPLETE

### A1 — Motion Grammar System
- [x] Create `motionMode()` dispatcher in `src/site/index.js`
- [x] Implement `cinematicSweep()` with overflow:hidden mask technique
- [x] Implement `precisionStagger()`, `velocityScrub()`, `ambientDrift()`
- [x] Implement `sectionFold()` with clip-path inset
- [x] Implement `wrapSplitWords()` DOM manipulation helper
- [x] Update Lenis to exponential decay easing
- [x] Add font metric @font-face overrides to `styles.css`
- [x] Verify `renderer.domElement.style.pointerEvents === 'none'`

### A2 — CSS Design System Extension
- [x] Add per-section CSS custom property overrides (`.services`, `.gallery`, `.process`, `.rhetoric`)
- [x] Define section gradient vocabularies
- [x] Add `--section-depth` z-layer tokens
- [x] Add skeleton shimmer animation

### A3 — Atmospheric Scroll Thread
- [x] Extend Lenis scroll handler with `--section-particle-density`, `--section-depth-blur` vars
- [x] Add scroll-position color breathing (superseded by SCROLL_ZONES zone bgColor)
- [x] Add CSS ambient particle system for mid-page sections

## Week 2: Phase B — Motion Grammar ✅ COMPLETE

### B1 — Services Card Choreography
- [x] Cards enter with staggered `precisionStagger()` (scale + y, ScrollTrigger once)
- [x] Active card: scale 1.02, amber-glow border intensifies
- [x] Per-card internal parallax (icon drifts slower than label)

### B2 — Typography-in-Motion System
- [x] Create `initSectionTitleReveal()` replacing all section title reveals
- [x] Wire all section titles through overflow:hidden mask technique
- [x] Rhetoric section: line-by-line velocity-biased reveal

### B3 — Gallery Tilt + Depth
- [x] Verify/enhance perspective tilt (existing `initGalleryTilt`)
- [x] Add cursor mix-blend-mode: exclusion to initCursor()
- [x] Inner parallax at 0.4x card tilt magnitude

### B4 — Process Section Kinetics
- [x] Steps reveal sequentially via `precisionStagger()` (not all at once)
- [x] SVG connector lines: animate via stroke-dashoffset
- [x] Number counter: count-up on viewport entry

### B5 — Testimonials + About Reveal
- [x] Staggered card float-in with blur-to-sharp via `precisionStagger()`
- [x] Stat cards: count-up numbers
- [x] Pillar icons: SVG draw-on

### B6 — Section Fold Transitions [NEW — Amendment 2]
- [x] Add `.section-reveal-inner` wrapper to section headers in `index.html`
- [x] Implement `sectionFold()` in `src/site/index.js`
- [x] Apply to: rhetoric section (`.rhetoric-inner`)

## Week 3: Phase C — Sectional Identity ✅ COMPLETE

### C1 — Services: Blueprint Workshop
- [x] Blueprint-grid CSS background (repeating-linear-gradient at 1px)
- [x] Card borders shift to `--color-blue-dim`
- [x] Icon treatment: amber on dark blue

### C2 — Gallery: Evidence Room
- [x] Near-black background with high-contrast card edges
- [x] Amber diagonal slash badge (CSS clip-path)
- [x] Card labels: DM Mono, uppercase, amber tick prefix

### C3 — Process: Precision Workflow
- [x] Light-on-dark numbered steps with amber circle counters
- [x] Deliberate whitespace — fewer elements, more breathing room

### C4 — Rhetoric: Statement Room
- [x] Near-fullscreen statement with large Fraunces display type (fluid to 8rem)
- [x] Amber words highlighted: `<em>` with gradient-clip background

### C5 — CTA Band: Ember Warmth
- [x] Warm amber-to-dark radial gradient
- [x] CSS-only particle simulation (subtle)
- [x] Button: full-amber fill with amber glow on hover

## Week 4: Phase D — Polish & Finish ✅ COMPLETE

### D3 — Mobile Distinct UX
- [x] Motion-kill mode for `IS_LOW_END_TOUCH`
- [x] Services vertical stack + accordion on mobile
- [x] Gallery: CSS scroll-snap carousel on mobile
- [x] Disable magnetic/tilt/cursor on touch

### D4 — Loading / Progressive Enhancement
- [x] Precise intro timing orchestration (Amendment 3)
- [x] Skeleton content for hero + sections
- [x] Replace 7s timeout with `document.fonts.ready` + `__sceneAssetsReady`

### D5 — Performance Budget
- [x] Vite `manualChunks`: scene vs site split
- [x] `chunkSizeWarningLimit: 700`
- [x] RAF suppression when `document.hidden`

### D6 — Accessibility Hardening
- [x] Skip-to-content link in `index.html`
- [x] Amber focus ring on all interactive elements
- [x] `role="status"` live region for preloader
- [x] SplitType: aria-label preserved on split containers

### D7 — QA Pass
- [x] `tests/validate-sections.js`: scroll-to-section + visibility assertions
- [x] `tests/validate-a11y.js`: reduced-motion, focus ring visibility
- [x] Evidence screenshots for all new section states

---

## Week 5: Phase E — Workshop Journey (PRD 13) ✅ COMPLETE

*All phases implemented 2026-03-15. See `docs/plans/2026-03-15-workshop-journey-implementation.md`.*

### E1 — Environment Asset Processing
- [x] Create `scripts/process-environment-assets.mjs` (gltf-transform pipeline)
- [x] Process `workshop.glb` → loaded directly via URL (optimization deferred — raw GLB used)
- [x] Process `industrial_toolbox.glb` → loaded via URL, skipped on `quality=low`

### E2 — SCROLL_ZONES System (scene)
- [x] Add `SCROLL_ZONES` constant to `src/scene/index.js`
- [x] Add `ZONE_STATE` + module-level `_zone*` state vars
- [x] Implement `resolveZoneBoundaries()` — DOM-based zone boundary computation
- [x] Implement `updateScrollZone(scrollProg)` — per-frame zone interpolator
- [x] Wire zone output into render loop (background, fog, lights, bloom)
- [x] Add `zoneState` to `window.__sceneDiagnostics()`

### E3 — Environment Geometry (scene)
- [x] Load `workshop.glb` as background environment mesh (opacity 0→0.35 on scroll)
- [x] Load point cloud prop (desktop-only)
- [x] Wire `_workshopEnv` opacity to `_zoneT` in render loop
- [x] Apply device tier guards (skip on `quality=low`, toolbox skip on mobile)

### E4 — Camera Journey Spline (scene)
- [x] Add `CAMERA_JOURNEY_WAYPOINTS` constant (7 waypoints)
- [x] Implement `initCameraJourneyCurve()` using `THREE.CatmullRomCurve3`
- [x] Wire spline into camera position update (blend-in over first 8% of post-hero scroll)
- [x] Guard: skip on `prefersReducedMotion`
- [x] Tuned waypoints (subtle ±0.3z, ±0.15x, ±0.08y amplitude)

### E5 — Site Zone Driver + HTML/CSS (site + markup)
- [x] Add `data-scene-zone` attributes to 7 sections in `index.html`
- [x] Add zone CSS property blocks to `styles.css`
- [x] Implement `initScrollZoneDriver()` in `src/site/index.js`
- [x] Wire into `initAll()`

### E6 — Per-Zone Particle Stories (scene)
- [x] Add `SCROLL_ZONE_PARTICLE_STORIES` constant
- [x] Change `const storyPreset` → `let storyPreset` in `updateSceneState()`
- [x] Wire zone story override (lerp into existing story, guard on `quality=low`)

### E7 — Zone Tests
- [x] Create `tests/validate-zones.js` (6 assertions)
- [x] Run full test suite — all existing + new tests pass

---

## Phase E★ — Canvas Visibility Fix ✅ COMPLETE (2026-03-15)

*Critical bug: all `.section` elements had opaque `background-color: var(--color-bg)` covering the fixed canvas. Fix applied to `styles.css`.*

- [x] Remove `background-color` from `.section` (primary blocker)
- [x] Remove `background-color` from `.section:nth-of-type(even)`
- [x] Change `.rhetoric-section` to `background: transparent`
- [x] Change `.stats-section` to `background: transparent`
- [x] Change `.contact-section` to `background: transparent`
- [x] Remove solid `var(--color-bg)` fallback from `.cta-band` gradient
- [x] Add per-zone atmospheric `::before` radial gradient overlays (50–60% opacity, fading to transparent)
- [x] Add `[data-scene-zone] > .container { position: relative; z-index: 1 }` stacking context fix

---

## Phase F — Cinematic World System (Active Theory-Inspired) 🔧 IN PROGRESS

*10-act cinematic scroll journey with 9 worlds and 8 authored transitions. Code architecture complete; asset pipeline and polish remaining.*

**Master plan:** `/memories/session/plan.md` (session) — 20 steps across 6 sub-phases.

### F1 — Core Architecture ✅ COMPLETE
- [x] Create `src/scene/world-manager.js` (771 lines) — SceneWorld, TransitionSeq, WorldOrchestrator
- [x] Create `src/scene/transition-techniques.js` (798 lines) — 5 technique factories
- [x] Create 4 custom shaders (`fog-plane.frag/vert`, `point-cloud.frag/vert`)
- [x] Create `scripts/process-all-environment-assets.mjs` — batch GLB optimizer (not yet run)

### F2 — World Modules (9/9) ✅ COMPLETE
- [x] `src/scene/worlds/forge.js` — ACT 1: Wraps hero, auto-rotation, exit scale-down
- [x] `src/scene/worlds/blueprint-workshop.js` — ACT 2: Industrial toolbox + fence
- [x] `src/scene/worlds/statement-room.js` — ACT 3: Holographic forms, emissive cycling
- [x] `src/scene/worlds/precision-line.js` — ACT 4: Wireframe map conveyor-belt
- [x] `src/scene/worlds/evidence-room.js` — ACT 5: Globe rotation, camera orbit
- [x] `src/scene/worlds/origin-story.js` — ACT 6: Point cloud, body traces (desktop-only)
- [x] `src/scene/worlds/testimony-space.js` — ACT 7: XR point cloud, additive blending
- [x] `src/scene/worlds/ember-threshold.js` — ACT 8: Pure atmospheric, no geometry
- [x] `src/scene/worlds/workshop-return.js` — ACT 9: Reuses ACT 2 geometry, warm re-lighting

### F3 — Orchestrator Bridge + Integration ✅ COMPLETE
- [x] Create `src/scene/world-orchestrator-setup.js` (430 lines) — all worlds + transitions wired
- [x] Add 7 `data-scene-world` attributes to `index.html`
- [x] Wire into `src/scene/index.js`: imports, init, render loop, camera blending, lighting, particles, diagnostics, cleanup (7 integration edits)
- [x] Camera target blending into spring physics (K=180, C=18)
- [x] Particle story override — world stories lerp into zone stories via `_zoneT`
- [x] Lighting override expansion — thresholdBias, bgColor, fogDensity, exposureBias
- [x] Workshop return geometry link via `_onWorldLoadedCallbacks`

### F4 — Mobile Tier Filtering ✅ COMPLETE
- [x] ACT 3-7 worlds skipped on mobile (4-world simplified path)
- [x] Mobile-specific transitions: bloom-crossfade [0.55–0.65], fog-flythrough [0.85–0.95]
- [x] Mobile scroll range overrides for remaining worlds

### F5 — Bug Fixes ✅ COMPLETE
- [x] baseY TDZ error fixed (camera variable declaration order)
- [x] Forge hero position reset on scroll-back (enter() restores scale/position)
- [x] World group visibility guard (loaded check in enter())

### F6 — Debug & Diagnostics ✅ COMPLETE
- [x] Create `src/scene/world-debug-overlay.js` — `?sceneDebug=1` live HUD
- [x] Extend `__sceneDiagnostics().worldState` with world/transition/loading data

### F7 — Build & Runtime Verification ✅ COMPLETE
- [x] Build: 41 modules, 0 errors, scene-app 262KB gzip 82KB
- [x] Runtime: 0 errors, 0 warnings. 9 worlds, 8 transitions, progressive loading working
- [x] Layout gate tests: All PASS across 4 viewports
- [x] UI smoke tests: 15/16 pass (1 pre-existing build-stage mismatch)

### F8 — Asset Pipeline Execution ❌ NOT STARTED
- [ ] Install `@gltf-transform/core`, `@gltf-transform/functions`, `meshopt-decoder` as dev deps
- [ ] Run `scripts/process-all-environment-assets.mjs` to produce optimized GLBs
- [ ] Validate output sizes match target budgets
- [ ] Add `assets/models/environment/` to Vite asset copy config

### F9 — Post-Processing Extensions ❌ NOT STARTED
- [ ] DoF/bokeh pass (active in ACT 3 and ACT 7 only)
- [ ] Chromatic aberration burst on transitions
- [ ] Fog plane integration with EffectComposer pipeline

### F10 — Integration Cleanup ⚠️ PARTIAL
- [ ] Rename `scene:zone-change` → `scene:world-change` event in `src/site/index.js`
- [ ] Add `--world-*` CSS custom properties to `styles.css`
- [ ] Wire `tests/validate-worlds.js` into `tests/run-all.js`
- [ ] Fix `EXPECTED_BUILD_STAGE` constant in `tests/validate-ui.js`
- [ ] `prefers-reduced-motion` world-specific handling

### F11 — Polish & Calibration ❌ NOT STARTED
- [ ] Timing/easing calibration pass (all 8 transitions, frame-by-frame via debug overlay)
- [ ] Full quality tier validation (`?sceneTier=mobile`, `?sceneTier=low`)
- [ ] Performance profiling (16.7ms frame budget, <350MB GPU)
