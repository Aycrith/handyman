# Implementation Guide — Landing Page Remediation

## Objective
Execute the remaining remediation work for the landing page using the findings from `docs/plans/2026-03-11-landing-page-remediation-plan.md`.

## Prerequisites
- Workspace root: `C:\Dev\handyman`
- Primary validation command:
  - `npm test`

## Execution Sequence

### Task 1 — Fix hero visibility on load
**Files**:
- `main.js`
- `styles.css`

**Actions**:
1. Review `initHeroEntrance()` and `initSplitTextReveals()`.
2. Remove the state conflict that leaves `.hero__title`, `.hero__sub`, and `.hero__ctas` at `opacity: 0`.
3. Add a guard/fallback that forces hero parent wrappers visible once initialization completes.
4. Keep SplitType character animation, but do not depend on it for parent visibility.

**Verification**:
- Load the page and confirm hero copy and CTA are visible.
- Add/adjust test in `tests/validate-ui.js` to assert visible hero elements.
- Run `npm test`.

### Task 2 — Rebuild Services interaction budget
**Files**:
- `main.js`
- `styles.css`
- `index.html` if wrapper structure needs refinement

**Actions**:
1. Measure the current Services section height budget using DOM values.
2. Refactor `initServicesHScroll()` so the pin distance is capped.
3. Add a fallback mode that disables pinning when the horizontal rail would create excessive blank vertical space.
4. Ensure the visible Services content block remains visually dense.

**Verification**:
- Confirm `#services` does not create a dead dark band before `#process`.
- Add a test that fails if the section-height budget exceeds the allowed threshold.
- Run `npm test`.

### Task 3 — Make Services visually intentional if pinned mode remains enabled
**Files**:
- `index.html`
- `styles.css`
- `main.js`

**Actions**:
1. If pinned mode remains, add explicit visual usage for the vertical interaction:
   - sticky copy/progress
   - card state changes
   - stronger compositional framing
2. If pinned mode does not materially improve the section, keep the static grid fallback as the default desktop layout.

**Verification**:
- Full-page screenshot shows no empty band.
- Services reads clearly in both static screenshot and interactive scrolling.

### Task 4 — Remove placeholder-grade gallery presentation
**Files**:
- `index.html`
- `styles.css`

**Actions**:
1. Replace or redesign the current placeholder gallery cards.
2. Remove the rendered “Photos coming soon” placeholder note in production mode.
3. Strengthen project metadata so the gallery builds trust.

**Verification**:
- Full-page screenshot shows a proof-oriented gallery section.
- UI smoke tests remain green.

### Task 5 — Add regression-proof tests
**Files**:
- `tests/validate-ui.js`
- optional `tests/run-all.js`

**Actions**:
1. Add a hero-visibility assertion.
2. Add a Services section layout-budget assertion.
3. Keep thresholds robust enough to avoid false positives.

**Verification**:
- `npm test` passes consistently.
- `tests/evidence/results.json` reflects the new checks if applicable.

### Task 6 — Final review pass
**Files**:
- none required unless fixes arise

**Actions**:
1. Capture a fresh full-page screenshot.
2. Review Hero, Services, Process, Gallery, About, Testimonials, Contact, Footer.
3. Confirm there are no hidden/transparent primary content blocks.
4. Confirm there are no oversized dark spacer bands.

**Final Verification**:
- `npm test`
- desktop screenshot review
- reduced-motion/manual spot check

## Common Failure Cases

### Failure: Hero text still invisible
**Likely cause**: parent wrappers remain at `opacity: 0` while child chars animate.
**Fix**: make parent wrapper visibility explicit and decouple it from SplitType child tween state.

### Failure: Services still creates a huge dark band
**Likely cause**: pin distance based only on `scrollWidth` with no layout budget guard.
**Fix**: cap or disable pinning; move to a grid fallback when overflow is not worth the reserved height.

### Failure: Tests pass but screenshot still looks unfinished
**Likely cause**: current tests validate behavior but not content density/composition.
**Fix**: add at least one screenshot-oriented sanity assertion or reviewer checklist for hero readability and Services continuity.

## Completion Checklist
- [ ] Hero content visible after load
- [ ] Services blank spacer removed or fully utilized
- [ ] Services fallback mode implemented
- [ ] Gallery no longer presents as placeholder content
- [ ] New UI regression tests added
- [ ] `npm test` passes
- [ ] Fresh full-page screenshot approved
