# Landing Page Remediation Plan — Full-Page Audit Follow-up

- **Goal**: Remove the remaining visual regressions, eliminate dead/blank space, restore core hero messaging, and close the remaining polish/content/robustness gaps visible in the current landing-page screenshot.
- **Status**: Planning
- **Created**: 2026-03-11
- **Scope**: `index.html`, `styles.css`, `main.js`, `three-scene.js`, `tests/validate-ui.js`, `tests/validate-effects.js`
- **Agent-Ready**: Yes

## Problem Statement

The current landing page passes the automated checks added in the last iteration, but the full-page screenshot and live geometry review show that the page still has production-facing UX regressions:

1. **Hero messaging is visually missing** even though the hero scene renders.
2. **A large blank band still exists under Services** because the horizontal-pin implementation reserves far more vertical space than the visible content uses.
3. **Recent Projects still presents as placeholder content** rather than proof-heavy portfolio content.
4. **Several sections remain visually under-utilized** compared with the intended premium, cinematic single-page experience.

## Evidence Collected

### Screenshot-based findings
- The hero scene is visible, but the main value proposition is effectively absent in the screenshot, making the top of the page feel like a background-only scene instead of a conversion-oriented landing page.
- The `Services` section shows a row of cards followed by a very large empty dark block before `How It Works`.
- `Recent Projects` still reads as a placeholder gallery rather than a finished portfolio section.
- Lower sections are structurally present, but the page rhythm is uneven because the Services dead zone breaks the narrative flow.

### Live page diagnostics
- `#services` current height: **3292px**
- `#servicesPin` visible pinned area height: **~435px**
- Horizontal rail computed travel distance: **~2601px**
- Result: **~2600px of vertical spacer / unused band inside the Services section**
- Hero content diagnostics show:
  - `.hero__title` opacity: **0**
  - `.hero__sub` opacity: **0**
  - `.hero__ctas` opacity: **0**
- `Recent Projects` still includes visible placeholder note text: **"Photos coming soon — real project photos will replace these placeholders."**

## Root Causes

### RC-001 — Hero reveal system leaves parent hero content invisible
**Files**: `main.js`, `styles.css`

The hero title/sub/CTA containers are initialized with `opacity: 0` in CSS and are expected to be restored by GSAP timelines. The current animation layering between `initHeroEntrance()` and `initSplitTextReveals()` is not reliably bringing the parent containers back to visible state. The characters may animate, but the parent wrappers remain hidden.

### RC-002 — Services horizontal pin consumes space without enough visual payoff
**Files**: `main.js`, `styles.css`, `index.html`

The Services section uses a pinned horizontal rail that reserves vertical scroll distance based on `grid.scrollWidth - window.innerWidth + 120`. In the current content/layout, that creates roughly 2600px of pin travel inside a section whose visible content block is only about 435px tall. The section therefore renders a large dark spacer below the visible cards.

### RC-003 — Services section lacks a proper desktop/mobile/fallback content strategy
**Files**: `main.js`, `styles.css`, `index.html`

The current implementation assumes the horizontal scrollytelling treatment is always the correct presentation on desktop. There is no threshold to disable pinning when the interaction cost exceeds the value, and there is no richer use of the pinned space (progress, sticky copy, visual transitions, second content column, or card state changes).

### RC-004 — Gallery remains in placeholder mode
**Files**: `index.html`, `styles.css`

The `Recent Projects` section still communicates “coming soon” instead of real trust-building proof. This weakens the middle of the page, especially after the Services / Process sections.

### RC-005 — Screenshot/readability flow is not yet publication-grade
**Files**: `index.html`, `styles.css`, `main.js`

Even after the feature implementation work, the page still needs a final visual-composition pass to ensure that every major section communicates clearly in a static screenshot and in motion.

## Success Metrics

- [ ] Hero title, supporting copy, and CTAs are visible on first load within 1 second after the preloader dismisses.
- [ ] Services section contains **no visually empty spacer band larger than 25vh** beneath the visible card rail.
- [ ] Services desktop behavior degrades gracefully to a grid when the horizontal-scroll payoff is insufficient.
- [ ] Full-page screenshot shows a continuous narrative flow from Hero → Services → Process with no dead visual zone.
- [ ] Gallery no longer displays placeholder messaging in production.
- [ ] New automated tests fail if hero content stays hidden or if Services grows into another oversized spacer.

## Scope

### In Scope
- Hero reveal reliability and fallback visibility
- Services section architecture and blank-space elimination
- Screenshot-driven layout polish
- Gallery placeholder remediation plan
- Additional automated checks for layout regressions

### Out of Scope
- Complete rebrand or rewrite of the page structure
- CMS integration
- Backend submission workflow for the contact form
- Major 3D scene redesign beyond what is needed for hero readability and composition

## Recommended Direction

### Preferred solution for Services
Do **not** keep the current horizontal pin exactly as-is.

Use a **hybrid services presentation**:
1. Keep the horizontal rail **only when** the viewport width and card count create a meaningful interactive sequence.
2. Add a **minimum-overflow threshold**. If the rail overflow is below that threshold or the resulting spacer exceeds a safe ratio, disable pinning and render a standard multi-column grid.
3. If the rail remains pinned, the pinned area must become a real storytelling module:
   - sticky section header / progress indicator
   - card state transitions while scrolling
   - better vertical composition so the pinned duration feels intentionally “used”
4. Add a hard guardrail so Services cannot reserve a spacer band larger than the designed interaction budget.

## Phase Breakdown

### Phase 1 — Fix critical above-the-fold and Services regressions
**Priority**: Highest
**Status**: Not Started

#### Task 1.1 — Repair hero visibility contract
- **Files**: `main.js`, `styles.css`
- **Estimate**: 30–45 min
- **Implementation**:
  - Make hero parent containers visible independent of SplitType child animation.
  - Ensure `initHeroEntrance()` and `initSplitTextReveals()` do not compete over opacity state.
  - Add a no-animation fallback that forces `.hero__title`, `.hero__sub`, `.hero__ctas`, `.hero__trust`, and `#scrollCue` visible if GSAP/SplitType is unavailable or skipped.
- **Success**:
  - Hero content opacity is `1` after load.
  - Screenshot shows clear headline + CTA hierarchy.

#### Task 1.2 — Remove oversized Services spacer
- **Files**: `main.js`, `styles.css`, `index.html`
- **Estimate**: 45–60 min
- **Implementation**:
  - Rework `initServicesHScroll()` to compute a capped interaction distance.
  - Disable pinning when overflow is too small or when pin distance creates a section-height-to-content-height ratio above the allowed threshold.
  - If needed, move pin responsibility from the full Services wrapper to a tighter inner rail so the spacer is constrained to the actual interaction region.
- **Success**:
  - No dead dark band remains below the visible Services content.
  - `How It Works` follows naturally after Services.

#### Task 1.3 — Add a Services fallback mode
- **Files**: `main.js`, `styles.css`
- **Estimate**: 30–45 min
- **Implementation**:
  - Introduce a desktop-only decision branch:
    - `mode = pinned-rail`
    - `mode = static-grid`
  - Base mode on measured overflow, section height budget, reduced motion, and breakpoint.
- **Success**:
  - Layout remains polished across desktop sizes without manual tuning.

### Phase 2 — Improve screenshot-grade composition and content density
**Priority**: High
**Status**: Not Started

#### Task 2.1 — Tune hero composition against scene contrast
- **Files**: `styles.css`, `three-scene.js`
- **Estimate**: 30–45 min
- **Implementation**:
  - Review text contrast, overlay warmth, and scene framing so the text remains legible over the 3D canvas.
  - Ensure the sphere/tool cluster does not visually overpower the headline block.
- **Success**:
  - Hero reads as a landing page first, scene second.

#### Task 2.2 — Replace placeholder gallery mode
- **Files**: `index.html`, `styles.css`
- **Estimate**: 45–60 min
- **Implementation**:
  - Replace placeholder note and generic gradient cards with either:
    - real project images, or
    - a more explicit “featured work” placeholder system with labeled before/after states and stronger metadata.
- **Success**:
  - Gallery communicates proof, not temporary scaffolding.

#### Task 2.3 — Tighten section rhythm and transitions
- **Files**: `styles.css`, `main.js`
- **Estimate**: 30–45 min
- **Implementation**:
  - Audit inter-section spacing, separators, and reveal pacing from Services through Contact.
  - Reduce any oversized dark padding bands that do not carry content or motion.
- **Success**:
  - Full-page capture reads as a cohesive narrative stack.

### Phase 3 — Harden automated coverage for the newly fixed regressions
**Priority**: High
**Status**: Not Started

#### Task 3.1 — Add hero-visibility test coverage
- **Files**: `tests/validate-ui.js`
- **Estimate**: 20–30 min
- **Implementation**:
  - Assert that hero title, subcopy, and CTA containers become visible after preloader dismissal.
  - Fail if computed opacity remains `0` or if bounding boxes collapse.
- **Success**:
  - Hidden hero regressions are caught automatically.

#### Task 3.2 — Add Services section height budget check
- **Files**: `tests/validate-ui.js`
- **Estimate**: 20–30 min
- **Implementation**:
  - Measure `#services` height, visible pinned area height, and overflow distance.
  - Fail if Services reserves blank vertical space beyond a defined budget.
- **Success**:
  - Oversized spacer regressions are caught automatically.

#### Task 3.3 — Add screenshot sanity notes to evidence output
- **Files**: `tests/run-all.js`, optionally `tests/evidence/results.json` producer
- **Estimate**: 15–25 min
- **Implementation**:
  - Include a small summary for hero visibility and Services blank-space budget in results output.
- **Success**:
  - Reviewers can spot layout failures quickly from the evidence bundle.

### Phase 4 — Content and production hardening
**Priority**: Medium
**Status**: Not Started

#### Task 4.1 — Replace remaining production-facing placeholder comments/content
- **Files**: `index.html`
- **Estimate**: 20–30 min
- **Implementation**:
  - Remove or resolve remaining user-facing placeholder hints that are still meaningful to production review.
- **Success**:
  - Source and rendered content better match a production-ready landing page.

#### Task 4.2 — Final full-page review on desktop and reduced-motion mode
- **Files**: none / validation pass
- **Estimate**: 20–30 min
- **Implementation**:
  - Generate final screenshots at desktop and reduced-motion states.
  - Validate hero, Services, Process, Gallery, About, Testimonials, Contact, and Footer continuity.
- **Success**:
  - The page is visually complete in both static and interactive review contexts.

## Testing Strategy

### Automated
- Existing: `npm test`
- Add:
  - hero content visibility assertions
  - Services height/spacer budget assertions
  - optional screenshot evidence annotations

### Manual visual verification
1. Hard refresh desktop viewport.
2. Confirm hero copy is visible immediately after preloader exit.
3. Scroll through Services slowly.
4. Verify either:
   - pinned rail uses the vertical distance intentionally, or
   - layout falls back to a static grid with no dead band.
5. Capture a full-page screenshot and confirm there is no blank band between Services and Process.
6. Confirm gallery no longer communicates placeholder status.

## Risks and Mitigations

- **Risk**: Fixing hero opacity may break SplitType timing.
  - **Mitigation**: Make wrapper visibility explicit before child char animation starts.
- **Risk**: Removing/capping Services pinning may weaken the “premium” feel.
  - **Mitigation**: Keep the rail only when it earns its space budget; otherwise prefer a dense, elegant grid.
- **Risk**: Adding layout assertions could be flaky across machines.
  - **Mitigation**: Base thresholds on ratios and section budgets, not exact pixel-perfect absolute values alone.

## Execution Order

1. Fix hero visibility contract.
2. Remove/cap Services blank-space behavior.
3. Add Services fallback mode.
4. Add tests for hero visibility and Services layout budget.
5. Tune gallery/content polish.
6. Run final screenshot review.

## Approval Gate

Proceed with implementation only after confirming this direction:
- **Services strategy**: keep a smarter/capped horizontal rail, not the current unrestricted pin spacer.
- **Hero strategy**: prioritize readable conversion copy over purely cinematic scene presentation.
