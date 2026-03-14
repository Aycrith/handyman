# PRD 12 — Polish & QA Pass Strategy

## Objective

Define "done" acceptance bar and build test coverage for all new systems.

## New Test Files

### tests/validate-sections.js

```js
// Playwright test: scroll to each section, assert visibility
// Sections: services, rhetoric, process, gallery, about, testimonials, contact
// For each section:
//   1. page.evaluate(() => window.scrollTo(0, section.offsetTop))
//   2. wait 800ms for animations
//   3. screenshot to tests/evidence-desktop/section-{name}.png
//   4. assert computed opacity of key elements === '1'
//   5. assert computed transform includes 'none' or no y translation
```

### tests/validate-a11y.js

```js
// Playwright test: accessibility checks
// 1. Reduced-motion: page.emulateMedia({ reducedMotion: 'reduce' })
//    → assert all .split-word elements have opacity: '1'
// 2. Tab navigation: keyboard through all interactive elements
//    → count focusable elements, assert > 0
// 3. Focus ring: assert :focus-visible outline is amber
// 4. Skip link: Tab press → assert skip link is visible
// 5. aria-label: assert all SplitType containers have aria-label
```

## Visual Quality Gate Screenshots

Evidence captures required for:
- `services-blueprint.png` — blueprint grid visible, blue-dim borders
- `gallery-evidence.png` — editorial dark tone, monospace labels
- `process-precision.png` — amber circles, SVG connectors
- `rhetoric-statement.png` — 8rem type, amber-clipped words
- `cta-band-ember.png` — amber radial, CSS particles
- `mobile-430.png` — vertical services stack, carousel gallery
- `loading-sequence.png` — body fade entry (if capturable)

## Manual QA Checklist

- [ ] Visual inspection at 1440×900 (standard desktop)
- [ ] Visual inspection at 1280×800 (laptop)
- [ ] Visual inspection at 430×932 (iPhone 14 Pro Max)
- [ ] Visual inspection at 390×844 (iPhone 14)
- [ ] Chrome DevTools Performance: ≤16.7ms frame time desktop
- [ ] Reduced-motion media query: animations disabled, content readable
- [ ] Tab navigation: all CTAs, form fields, nav links reachable
- [ ] Screen reader (NVDA/VoiceOver): hero title text correct via aria-label

## Regression Gate

All 16 existing tests must pass before merge:
- `validate-hero-assets.js` (3 tests)
- `validate-ui.js` (UI smoke)
- `validate-effects.js` (post-processing)
- `validate-effects-desktop.js` (desktop effects)

## Acceptance

- `npm test` covers all original suites + validate-sections + validate-a11y
- Evidence screenshots committed to `tests/evidence-desktop/`
- 0 axe-core critical violations
- All 16 original tests passing (no regression)
