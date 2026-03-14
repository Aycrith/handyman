# Prioritized Implementation Roadmap

**Updated:** 2026-03-14 (with all 8 amendments applied)

## Pre-Week 1: Apply Amendments (DONE in planning docs)

- [x] Amendment 1: Typography overflow mask technique (PRD 02)
- [x] Amendment 2: Section fold transitions B6 (below)
- [x] Amendment 3: Precise intro timing (PRD 08)
- [x] Amendment 4: Lenis exponential decay (PRD 06)
- [x] Amendment 5: Cursor mix-blend-mode exclusion (PRD 04)
- [x] Amendment 6: Motion-kill mode (PRD 10)
- [x] Amendment 7: Font metric overrides (PRD 08)
- [x] Amendment 8: Canvas pointer-events verify (PRD 01)

## Week 1: Phase A — Foundation

### A1 — Motion Grammar System
- [ ] Create `motionMode()` dispatcher in `src/site/index.js`
- [ ] Implement `cinematicSweep()` with overflow:hidden mask technique
- [ ] Implement `precisionStagger()`, `velocityScrub()`, `ambientDrift()`
- [ ] Implement `sectionFold()` with clip-path inset
- [ ] Implement `wrapSplitWords()` DOM manipulation helper
- [ ] Update Lenis to exponential decay easing
- [ ] Add font metric @font-face overrides to `styles.css`
- [ ] Verify `renderer.domElement.style.pointerEvents === 'none'`

### A2 — CSS Design System Extension
- [ ] Add per-section CSS custom property overrides (`.services`, `.gallery`, `.process`, `.rhetoric`)
- [ ] Define section gradient vocabularies
- [ ] Add `--section-depth` z-layer tokens
- [ ] Add skeleton shimmer animation

### A3 — Atmospheric Scroll Thread
- [ ] Extend Lenis scroll handler with `--section-particle-density`, `--section-depth-blur` vars
- [ ] Add scroll-position color breathing (Gap R5)
- [ ] Add CSS ambient particle system for mid-page sections

## Week 2: Phase B — Motion Grammar

### B1 — Services Card Choreography
- [ ] Cards enter with staggered perspective-flips (not y-shifts)
- [ ] Active card: scale 1.02, amber-glow border intensifies
- [ ] Per-card internal parallax (icon drifts slower than label)

### B2 — Typography-in-Motion System
- [ ] Create `initSectionTitleReveal()` replacing all section title reveals
- [ ] Wire all section titles through overflow:hidden mask technique
- [ ] Rhetoric section: line-by-line velocity-biased reveal

### B3 — Gallery Tilt + Depth
- [ ] Verify/enhance perspective tilt (existing `initGalleryTilt`)
- [ ] Add cursor mix-blend-mode: exclusion to initCursor()
- [ ] Inner parallax at 0.4x card tilt magnitude

### B4 — Process Section Kinetics
- [ ] Steps reveal sequentially (not all at once)
- [ ] SVG connector lines: animate via stroke-dashoffset
- [ ] Number counter: count-up on viewport entry

### B5 — Testimonials + About Reveal
- [ ] Staggered card float-in with blur-to-sharp
- [ ] Stat cards: count-up numbers
- [ ] Pillar icons: SVG draw-on

### B6 — Section Fold Transitions [NEW — Amendment 2]
- [ ] Add `.section-reveal-inner` wrapper to section headers in `index.html`
- [ ] Implement `initSectionFolds()` in `src/site/index.js`
- [ ] Apply to: services, rhetoric, gallery header, about section

## Week 3: Phase C — Sectional Identity

### C1 — Services: Blueprint Workshop
- [ ] Blueprint-grid CSS background (repeating-linear-gradient at 1px)
- [ ] Card borders shift to `--color-blue-dim`
- [ ] Icon treatment: amber on dark blue

### C2 — Gallery: Evidence Room
- [ ] Near-black background with high-contrast card edges
- [ ] Amber diagonal slash badge (CSS clip-path)
- [ ] Card labels: DM Mono, uppercase, amber tick prefix

### C3 — Process: Precision Workflow
- [ ] Light-on-dark numbered steps with amber circle counters
- [ ] Deliberate whitespace — fewer elements, more breathing room

### C4 — Rhetoric: Statement Room
- [ ] Near-fullscreen statement with large Fraunces display type (fluid to 8rem)
- [ ] Amber words highlighted: `<em>` with gradient-clip background

### C5 — CTA Band: Ember Warmth
- [ ] Warm amber-to-dark radial gradient
- [ ] CSS-only particle simulation (subtle)
- [ ] Button: full-amber fill with amber glow on hover

## Week 4: Phase D — Polish & Finish

### D3 — Mobile Distinct UX
- [ ] Motion-kill mode for `IS_LOW_END_TOUCH`
- [ ] Services vertical stack + accordion on mobile
- [ ] Gallery: CSS scroll-snap carousel on mobile
- [ ] Disable magnetic/tilt/cursor on touch

### D4 — Loading / Progressive Enhancement
- [ ] Precise intro timing orchestration (Amendment 3)
- [ ] Skeleton content for hero + sections
- [ ] Replace 7s timeout with `document.fonts.ready` + `__sceneAssetsReady`

### D5 — Performance Budget
- [ ] Vite `manualChunks`: scene vs site split
- [ ] `chunkSizeWarningLimit: 700`
- [ ] RAF suppression when `document.hidden`

### D6 — Accessibility Hardening
- [ ] Skip-to-content link in `index.html`
- [ ] Amber focus ring on all interactive elements
- [ ] `role="status"` live region for preloader
- [ ] SplitType: aria-label preserved on split containers

### D7 — QA Pass
- [ ] `tests/validate-sections.js`: scroll-to-section + visibility assertions
- [ ] `tests/validate-a11y.js`: reduced-motion, focus ring visibility
- [ ] Evidence screenshots for all new section states
