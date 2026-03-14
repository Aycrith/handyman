# Prioritized Roadmap — Landing Page Transformation

**Date:** 2026-03-14
**Branch:** feat/landing-page-rebuild
**Total estimated scope:** 5–6 weeks (parallel tracks where indicated)

---

## Implementation Philosophy

1. **Motion grammar first** — A1 (motion grammar) unlocks everything. Until it's built, every section animation is a one-off. Build once, apply everywhere.
2. **Section identity is cheap CSS** — Phase C section identities are mostly CSS + minor HTML. High visual payoff for low effort. Don't defer these.
3. **Don't break the hero** — Every change must leave `initHeroEntrance()`, `initHeroCtaWake()`, `initHeroSectionTransitionSignal()`, and the director phase state machine intact.
4. **Tests after each phase** — `npm run build && npm test` after every phase completion. No accumulated debt.
5. **GLSL shaders last** — Shaders are high-effort, high-risk. Only after section structure is stable.

---

## Week 0 — Asset Pre-Work

Goal: Understand which 3D assets can be used and how.

| Task | Files | Owner | Acceptance |
|------|-------|-------|-----------|
| A0-1: Load HAMMER, AXE, Spanner in Three.js dev scene | `source/HAMMER.glb`, `source/AXE.glb`, `source/Spanner.glb` | Dev | Quality comparison doc |
| A0-2: Process `workshop.glb` via gltf-transform | `workshop.glb` → `assets/3dmodels/processed/workshop-bg.glb` | Dev | ≤5 MB output |
| A0-3: Extract vertex positions from `xr_studio_*_v_point.glb` | `xr_studio_*_v_point.glb` | Dev | Float32Array JSON or "procedural preferred" decision |
| A0-4: Convert rivet gun spec/gloss textures to metallic/roughness | `textures/initialShadingGroup_*` | Dev | PBR-ready texture set |
| A0-5: Asset inventory document | `docs/landing-page-rebuild/00b-asset-inventory.md` | Dev | ✓ Complete |

**Deliverable:** `docs/landing-page-rebuild/00b-asset-inventory.md` with go/no-go per asset.

---

## Week 1 — Phase A: Foundation

Goal: Motion grammar, design system, atmospheric scroll thread. Everything else depends on this.

### A1 — Motion Grammar System ★ CRITICAL PATH

**Files:** `src/site/index.js`, `styles.css`

**Steps:**
- [ ] A1.1 — Define `motionMode(el, mode, opts)` dispatcher function at top of `src/site/index.js`
- [ ] A1.2 — Implement `cinematic-sweep` mode: SplitType word-level, `skewY: 8 → 0`, `expo.out`, stagger 0.055s
- [ ] A1.3 — Implement `precision-stagger` mode: `scale: 0.97 → 1`, `y: 28 → 0`, `power3.out`, grid-aware stagger
- [ ] A1.4 — Implement `velocity-scrub` mode: Lenis velocity sampling → `--reveal-intensity` CSS var
- [ ] A1.5 — Implement `ambient-drift` mode: CSS `@keyframes ambientDrift`, JS assigns `--drift-duration/delay`
- [ ] A1.6 — Refactor `initSectionTitleLines()` → calls `motionMode(title, 'cinematic-sweep')`
- [ ] A1.7 — Refactor `initServiceCards()` → calls `motionMode(cards, 'precision-stagger')`
- [ ] A1.8 — Refactor `initTestimonials()` → calls `motionMode(cards, 'precision-stagger')`
- [ ] A1.9 — Refactor `initPillars()` → calls `motionMode(cards, 'precision-stagger')`
- [ ] A1.10 — Refactor `initCtaBand()` → calls `motionMode(el, 'cinematic-sweep')`
- [ ] A1.11 — Refactor `initSectionReveals()` → dispatches mode based on data attribute
- [ ] A1.12 — Refactor `initContactForm()` → `precision-stagger`
- [ ] A1.13 — Keep `initHeroEntrance()` untouched — hero timeline is authored, not grammar-dispatched
- [ ] A1.14 — Keep `initRhetoricalSection()` largely intact — extend with velocity-scrub bias

**Acceptance:** Visual inspection shows distinct motion character per section. `npm test` still passes.

### A2 — CSS Design System Extension

**Files:** `styles.css`

**Steps:**
- [ ] A2.1 — Add per-section CSS token block for each of 4 themed sections:
  - `.services { --section-theme: blueprint; --section-grid-color: ... }`
  - `.gallery { --section-theme: evidence; --section-bg: ... }`
  - `.process { --section-theme: precision; }`
  - `.rhetoric-section { --section-theme: statement; }`
- [ ] A2.2 — Add `--section-depth-N` z-layer tokens (depth-1 through depth-4) for parallax stacking
- [ ] A2.3 — Add `--section-particle-density` CSS var with default 0 (populated by Lenis scroll)
- [ ] A2.4 — Add `--section-depth-blur` CSS var with default 0 (populated by Lenis scroll)
- [ ] A2.5 — Define section-level gradient vocabulary tokens (not overwrite global ones)

**Acceptance:** `styles.css` lint passes. No existing tests broken.

### A3 — Atmospheric Scroll Thread

**Files:** `src/site/index.js`, `styles.css`

**Steps:**
- [ ] A3.1 — Extend `initLenis()` scroll handler to set `--section-particle-density` and `--section-depth-blur` CSS vars based on scroll position (in addition to existing `--scene-warmth`)
- [ ] A3.2 — Add CSS ambient particle system: 15 `.ambient-particle` divs injected into mid-page sections, animated via `@keyframes ambientDrift`
- [ ] A3.3 — Wire `--section-particle-density` to particle opacity/size (CSS `calc()`)
- [ ] A3.4 — Wire `--section-depth-blur` to section background depth (CSS `backdrop-filter` or `filter: blur()`)
- [ ] A3.5 — Gate CSS particles behind `@media (prefers-reduced-motion: no-preference)` and `@media (min-width: 768px)`

**Acceptance:** Mid-page sections show subtle atmospheric particles. No performance regression (CSS-only, no additional WebGL).

---

## Week 2 — Phase B: Motion Grammar Applied

Goal: Every section below the hero has a designed, distinct motion identity.

### B1 — Services Section Choreography

**Files:** `src/site/index.js` (initServicesHScroll), `styles.css`

- [ ] B1.1 — Cards enter with perspective-informed entrance: `perspective(1200px) rotateY(-15deg) → rotateY(0)`
- [ ] B1.2 — Active card in viewport: scale 1.02, border amber-glow intensifies, amber shadow lift
- [ ] B1.3 — Per-card internal parallax during horizontal scroll: icon drifts at 0.7× card speed, label at 1× speed
- [ ] B1.4 — Add `data-motion="precision-stagger"` to service cards, wire to A1 motionMode

### B2 — Typography-in-Motion System

**Files:** `src/site/index.js` (lines 545–589, 906–944)

- [ ] B2.1 — Replace all section title SplitType reveals with `cinematic-sweep` mode (A1.6 in progress, refine here)
- [ ] B2.2 — Hero body-copy: line-by-line velocity-biased reveal (extend `initRhetoricalSection()` pattern)
- [ ] B2.3 — Rhetoric section: velocity scrub mode (fast scroll = more dramatic blur-in)
- [ ] B2.4 — Add aria-label before all SplitType splits: `el.setAttribute('aria-label', el.textContent)` before `new SplitType(el)`
- [ ] B2.5 — Verify screen readers get full text content despite DOM split

### B3 — Gallery Tilt + Depth

**Files:** `src/site/index.js` (initGallery, initGalleryTilt), `styles.css`

Note: `initGalleryTilt()` already exists (lines 976–1005) but is basic. Enhance:
- [ ] B3.1 — Add inner parallax: image translates at 0.4× card-tilt magnitude
- [ ] B3.2 — Hover state: card "lifts" with amber-glow shadow + micro-scale (1.02)
- [ ] B3.3 — Gallery entrance: stagger `precision-stagger` mode with column-aware delay
- [ ] B3.4 — Disable tilt on touch devices (`'(pointer:coarse)'` media query check)

### B4 — Process Section Kinetics

**Files:** `src/site/index.js`, `index.html`, `styles.css`

- [ ] B4.1 — Add SVG connector lines between process steps in `index.html` (absolute positioned `<svg>` overlay)
- [ ] B4.2 — Animate connectors: `stroke-dasharray + stroke-dashoffset` draw animation on scroll entry
- [ ] B4.3 — Sequential step reveal: each step triggers only when previous step is fully visible (not simultaneous)
- [ ] B4.4 — Number counter: count-up trigger on viewport entry (already exists in `initCountUp()`, ensure timing syncs with B4.3)

### B5 — Testimonials + About Reveal

**Files:** `src/site/index.js`, `styles.css`

- [ ] B5.1 — Testimonials: `precision-stagger` entrance with subtle blur (0.5px) clearing to 0
- [ ] B5.2 — About stat cards: count-up with eased reveal (`initCountUp()` already works, add visual entrance)
- [ ] B5.3 — Pillar icons: SVG draw-on animation on scroll entry (if icons are SVG — audit `index.html`)

---

## Week 3 — Phase C: Sectional World-Building

Goal: Each section feels like a different room in the same architectural world.

### C1 — Services: Blueprint Workshop

**Files:** `styles.css`, `index.html`

- [ ] C1.1 — Blueprint grid background on `.services` section
- [ ] C1.2 — Card borders: shift to `--color-blue-dim` (blueprint accent) via section theme var
- [ ] C1.3 — Service card eyebrow labels: DM Mono, uppercase, amber tick prefix
- [ ] C1.4 — Section eyebrow: update text/styling if needed

### C2 — Gallery: Evidence Room

**Files:** `styles.css`, `index.html`

- [ ] C2.1 — Near-black section background
- [ ] C2.2 — Amber corner slash badge on each card via CSS `::after` clip-path
- [ ] C2.3 — Card labels: DM Mono, uppercase, amber tick `✓` prefix
- [ ] C2.4 — Image hover: desaturation → color transition

### C3 — Process: Precision Workflow

**Files:** `styles.css`, `index.html`

- [ ] C3.1 — Amber circle counters for step numbers (replace existing numeric style)
- [ ] C3.2 — SVG connectors styled: thin amber stroke (from B4.1)
- [ ] C3.3 — Increased whitespace: expand step padding, reduce density

### C4 — Rhetoric: Statement Room ★ EASIEST / HIGHEST PAYOFF

**Files:** `styles.css`, `index.html`

- [ ] C4.1 — Near-fullscreen section (min-height: 90vh, grid place-items: center)
- [ ] C4.2 — Large Fraunces display type (fluid 6–8rem)
- [ ] C4.3 — Amber word(s) in statement text via `<em>` + `background-clip: text` gradient
- [ ] C4.4 — Minimal decoration — no cards, no borders, just type + space

### C5 — CTA Band: Ember Warmth

**Files:** `styles.css`

- [ ] C5.1 — Warm amber-to-dark radial gradient (`radial-gradient(ellipse at center, ...)`)
- [ ] C5.2 — 10–15 CSS ambient particle dots (reuse A3 particle system)
- [ ] C5.3 — Button: full-amber fill, amber `box-shadow` glow on hover

---

## Week 4 — Phase D: Finishing

Goal: Shaders, mobile, loading, a11y, performance, QA.

### D1 — Post-Processing Expansion

**Files:** `src/scene/index.js`

- [ ] D1.1 — Add `BokehPass` (DoF): active in `pre-reveal` and `reveal` phases, off in `interactive-idle`
- [ ] D1.2 — Add chromatic aberration ShaderPass: fires on `hero:magic-pulse`, duration 1 frame (16ms burst, then lerp to 0)
- [ ] D1.3 — Refine vignette: state-aware (stronger in `pre-reveal`, clears in `lockup`)
- [ ] D1.4 — Gate all new passes behind `CAN_RUN_DESKTOP_POST` quality check

### D2 — Custom Shader Passes

**Files:** `src/scene/index.js`, `src/shaders/grain.glsl`, `src/shaders/grade.glsl`

- [ ] D2.1 — Create `src/shaders/grain.glsl`: procedural temporal film grain (frame-based noise)
- [ ] D2.2 — Create `src/shaders/grade.glsl`: color grade with `uToe`, `uShoulder`, `uSaturation` uniforms
- [ ] D2.3 — Integrate as ShaderPass in EffectComposer after bloom
- [ ] D2.4 — Wire grade uniforms to director phase state machine (phase-specific color grade)
- [ ] D2.5 — Remove CSS `feTurbulence` grain overlay (replaced by GLSL)

### D3 — Mobile Distinct UX

**Files:** `src/site/index.js`, `styles.css`, `src/scene/index.js`

- [ ] D3.1 — Services: `gsap.matchMedia('(max-width: 1023px)')` → vertical stack with accordion tap-expand
- [ ] D3.2 — Gallery: 2-column CSS scroll-snap carousel on touch devices
- [ ] D3.3 — Gallery tilt: fully disabled on `pointer:coarse` (B3.4 prerequisite)
- [ ] D3.4 — Touch-specific parallax: touch-move event drives subtle parallax instead of mouse
- [ ] D3.5 — Magnetic cursor: already detection-gated; verify clean disable on touch

### D4 — Loading / Progressive Enhancement

**Files:** `src/site/index.js`, `index.html`, `styles.css`

- [ ] D4.1 — Add skeleton markup to `index.html` for each section (animated shimmer placeholders)
- [ ] D4.2 — Add `@keyframes skeletonShimmer` to `styles.css`
- [ ] D4.3 — Refactor `initPreloader()`: replace 7s timeout with 3-stage:
  1. Stage 1: HTML renders → skeleton visible immediately
  2. Stage 2: `document.fonts.ready` → typography reveals
  3. Stage 3: GLB ready → hero canvas fades in
- [ ] D4.4 — Add static image fallback for WebGL failure (CSS background or `<img>`)
- [ ] D4.5 — Update `validate-ui.js` Playwright tests to expect new 3-stage preloader behavior

### D5 — Performance Budget

**Files:** `vite.config.mjs`, `src/scene/index.js`

- [ ] D5.1 — Add `build.rollupOptions.output.manualChunks`: `{ scene: ['src/scene/index.js'], vendor: ['three', 'gsap'] }`
- [ ] D5.2 — Add `build.chunkSizeWarningLimit: 700`
- [ ] D5.3 — Add `document.hidden` check in scene RAF loop: skip full render when tab hidden
- [ ] D5.4 — Add `--max-fps` CSS var that JS reads to cap RAF (default 60, reduces to 30 on battery API signal)

### D6 — Accessibility Hardening

**Files:** `index.html`, `styles.css`, `src/site/index.js`

- [ ] D6.1 — Add skip-to-content link: `<a class="skip-link" href="#main">Skip to content</a>` in `index.html`
- [ ] D6.2 — Style `.skip-link`: visually hidden until focused (`:focus-visible` reveals it above nav)
- [ ] D6.3 — Add amber focus ring to all interactive elements in `styles.css` via `:focus-visible`
- [ ] D6.4 — Add `role="status"` live region for preloader announcements in `index.html`
- [ ] D6.5 — Audit all SplitType calls: ensure aria-label set before split (B2.4 prerequisite)
- [ ] D6.6 — Verify tab-navigation reaches all interactive elements in correct order

### D7 — QA Pass

**Files:** `tests/`

- [ ] D7.1 — Create `tests/validate-sections.js`: scroll to each section, screenshot, assert element visibility
- [ ] D7.2 — Create `tests/validate-a11y.js`: tab order, focus ring visibility, reduced-motion branch
- [ ] D7.3 — Add `tests/validate-sections.js` and `tests/validate-a11y.js` to `run-all.js`
- [ ] D7.4 — Run full suite against `vite preview`: all 6 suites pass (4 existing + 2 new)
- [ ] D7.5 — Capture and commit evidence screenshots for all new section states to `tests/evidence-desktop/`

---

## Week 5+ — Hero Scene Phase 3 (Parallel Track)

Follows existing roadmap `planning/2026-03-12-world-class-hero-scene/03-ROADMAP.md` items 3.1, 3.2, 3.3.
Can begin in parallel with Week 4 Phase D work.

| Item | Description |
|------|-------------|
| 3.1 | Particle storytelling: species transform through director phases |
| 3.2 | Post-processing expansion (D1 above is aligned) |
| 3.3 | Purposeful interactions: drag wake, hover lift, precision haptics |

---

## Phase Dependency Graph

```
Phase 0 (Asset inventory)
    ↓
Phase A (Foundation)
    A1 (Motion grammar) ──────────────┐
    A2 (CSS design system) ──────────┐│
    A3 (Atmospheric thread) ────────┐││
                                    ↓↓↓
Phase B (Motion applied) ←─────────────┤
    B1 Services choreography          │
    B2 Typography-in-motion           │
    B3 Gallery tilt                   │
    B4 Process kinetics               │
    B5 Testimonials                   │
                                      ↓
Phase C (Section identities) ←─────────┤
    C1 Blueprint (Services)            │
    C2 Evidence (Gallery)              │
    C3 Precision (Process)             │
    C4 Statement (Rhetoric) ← easiest │
    C5 Ember (CTA Band)               │
                                      ↓
Phase D (Finishing) ←──────────────────┘
    D1 Post-processing
    D2 Custom shaders
    D3 Mobile UX
    D4 Progressive loading
    D5 Performance budget
    D6 Accessibility
    D7 QA pass
```

---

## Verification Checkpoints

After each phase:

1. `npm run dev` — visual inspection at `http://127.0.0.1:5173`
2. `npm run build && npm test` — full validation suite must pass
3. Screenshot evidence captures for new section states
4. Manual a11y check: tab through full page, test reduced-motion
5. Mobile: test at 430×932 and 390×844 viewports
6. Performance: Chrome DevTools Performance tab, confirm ≤16.7ms frame time on desktop

---

## Files Created or Modified

| File | Action | Phase |
|------|--------|-------|
| `src/site/index.js` | Major refactor: motion grammar + all initX rewrites | A1, B* |
| `src/scene/index.js` | Post-processing expansion, shader passes | D1, D2 |
| `styles.css` | Section themes, design tokens, CSS particles, skeleton | A2, A3, C* |
| `index.html` | SVG connectors, skip link, section ARIA, skeleton markup | B4, C3, D4, D6 |
| `vite.config.mjs` | Code-splitting configuration | D5 |
| `src/shaders/grain.glsl` | **NEW** — procedural film grain shader | D2 |
| `src/shaders/grade.glsl` | **NEW** — custom color grading shader | D2 |
| `tests/validate-sections.js` | **NEW** — section reveal Playwright tests | D7 |
| `tests/validate-a11y.js` | **NEW** — accessibility regression tests | D7 |
| `scripts/process-3dmodels.mjs` | **NEW** — gltf-transform processing script | A0-2 |
| `docs/landing-page-rebuild/` | **NEW** — all planning documents | Planning |
