# PRD 11 — Accessibility & Reduced-Motion Strategy

**Status:** Planning
**Priority:** P1 (skip link and aria-label fixes are quick wins)
**Files:** `index.html`, `styles.css`, `src/site/index.js`
**Depends on:** PRD 02 (motionMode dispatcher — reduced-motion integrated there)

---

## Objective

Harden accessibility beyond existing foundations. Add skip-to-content link. Ensure all SplitType splits preserve aria-label. Implement amber focus rings on all interactive elements. All new motion systems must have reduced-motion branches.

---

## Current State

### What Exists

- 109 ARIA attributes across sections
- All sections have `aria-label`
- Nav: `role="navigation"` + `aria-label`
- Scroll progress: `role="progressbar"` + `aria-hidden="true"`
- `prefers-reduced-motion` in CSS (disables Lenis, sets elements visible)
- `prefers-reduced-motion` in JS (hero entrance: instant reveal)

### Known Issues

| Issue | Severity | Fix Complexity |
|-------|---------|----------------|
| No skip-to-content link | Medium | Low (~30 min) |
| SplitType splits break aria-label on section titles | Medium | Low (~1 hour) |
| Focus rings inconsistent (not amber-unified) | Medium | Low (~1 hour) |
| No preloader live region | Low | Low (~20 min) |
| CSS grain overlay: no reduced-motion variant | Low | Low (~10 min) |
| New CSS particles: needs reduced-motion guard | Low | Needed before shipping |
| New ambient-drift animations: needs reduced-motion guard | Low | Needed before shipping |

---

## Implementation

### 1. Skip-to-Content Link

**HTML change (index.html — very top of `<body>`):**

```html
<body>
  <!-- Skip link: first focusable element -->
  <a href="#main" class="skip-link">Skip to content</a>

  <!-- ... rest of HTML ... -->

  <!-- Main content landmark -->
  <main id="main">
    <!-- sections go here -->
  </main>
```

Note: audit `index.html` — if sections are not already wrapped in `<main>`, add it. The `<nav>` should be before `<main>`.

**CSS:**

```css
/* Skip link — visually hidden until focused */
.skip-link {
  position: fixed;
  top: -100%;
  left: 16px;
  padding: 8px 16px;
  background: var(--color-bg);
  color: var(--color-amber);
  border: 2px solid var(--color-amber);
  border-radius: var(--radius-sm);
  font-family: var(--font-mono);
  font-size: var(--fluid-sm);
  text-decoration: none;
  z-index: 99999;
  transition: top 0.15s ease;
}

.skip-link:focus-visible {
  top: 16px; /* Slides into view on focus */
}
```

---

### 2. SplitType Aria-Label Preservation

All SplitType calls must be wrapped in the `splitToWords()` helper from PRD 02:

```js
// Wrapper function (centralized in src/site/index.js)
function splitToWords(el) {
  if (!window.SplitType) {
    console.warn('[splitToWords] SplitType not available');
    return [el];
  }
  // CRITICAL: preserve aria-label BEFORE split destroys text structure
  const text = el.textContent.trim();
  el.setAttribute('aria-label', text);
  const split = new SplitType(el, { types: 'words' });
  return split.words;
}

function splitToLines(el) {
  if (!window.SplitType) return [el];
  el.setAttribute('aria-label', el.textContent.trim());
  const split = new SplitType(el, { types: 'lines' });
  return split.lines;
}

function splitToChars(el) {
  if (!window.SplitType) return [el];
  el.setAttribute('aria-label', el.textContent.trim());
  const split = new SplitType(el, { types: 'chars,words' });
  return split.chars;
}
```

**Migration:** Replace all raw `new SplitType()` calls in `src/site/index.js` with these helpers.

---

### 3. Amber Focus Ring (All Interactive Elements)

```css
/* styles.css — universal focus ring */
/* Remove default focus styles */
*:focus { outline: none; }

/* Add amber focus ring for keyboard navigation */
*:focus-visible {
  outline: 2px solid var(--color-amber);
  outline-offset: 3px;
  border-radius: var(--radius-sm);
}

/* Gallery cards (not standard interactive but keyboard-accessible) */
.gallery-card:focus-visible,
.service-card:focus-visible {
  outline: 2px solid var(--color-amber);
  outline-offset: 4px;
}

/* Buttons: ring outside border */
.btn:focus-visible {
  outline: 2px solid var(--color-amber-light);
  outline-offset: 4px;
}

/* Nav links */
.nav-link:focus-visible {
  outline: 2px solid var(--color-amber);
  outline-offset: 2px;
  border-radius: 2px;
}
```

---

### 4. Preloader Live Region

```html
<!-- In index.html, inside .preloader -->
<div class="preloader">
  <div class="preloader-bar" role="progressbar"
       aria-valuemin="0" aria-valuemax="100" aria-valuenow="0"
       aria-label="Loading page"></div>
  <div id="preloader-status" role="status" aria-live="polite" class="sr-only">
    Loading...
  </div>
</div>
```

```js
// In initPreloader() — update aria-valuenow and status text
function updateProgress(fraction) {
  const bar = document.querySelector('.preloader-bar');
  const status = document.getElementById('preloader-status');

  if (bar) {
    gsap.to(bar, { scaleX: fraction, duration: 0.3 });
    bar.setAttribute('aria-valuenow', Math.round(fraction * 100));
  }
  if (status) {
    status.textContent = fraction < 1
      ? `Loading: ${Math.round(fraction * 100)}%`
      : 'Page loaded.';
  }
}
```

---

### 5. Reduced-Motion — Comprehensive Audit

All new animation systems must have `prefers-reduced-motion` guards:

| System | Guard Location | What Happens |
|--------|---------------|-------------|
| `motionMode()` dispatcher | Top of dispatcher | Instant reveal via `gsap.set()`, return early |
| CSS `ambientDrift` | `styles.css` media query | `animation: none` |
| CSS `skeletonShimmer` | `styles.css` media query | `animation: none` (static color) |
| CSS ambient particles | `styles.css` media query | `.ambient-particle-layer { display: none }` |
| Velocity-scrub blur | `styles.css` media query | `filter: none` |
| GSAP grain pass | `src/scene/index.js` | `uStrength = 0` |
| CSS film grain overlay | `styles.css` | Already handled (opacity 0) |
| Horizontal scroll | No change | Native scroll is fine |
| Lenis | `src/site/index.js` | Already disabled on reduced-motion (existing) |

```css
/* styles.css — reduced-motion block (extend existing) */
@media (prefers-reduced-motion: reduce) {
  /* Existing */
  .animate-*, [data-animate] { transition: none !important; }

  /* New systems */
  .ambient-drift { animation: none !important; }
  .skeleton-eyebrow,
  .skeleton-title,
  .skeleton-card { animation: none !important; }
  .ambient-particle-layer { display: none !important; }
  .velocity-line { filter: none !important; transition: none !important; }

  /* Ensure all text is visible (no opacity 0 stuck) */
  .split-word,
  .split-char,
  .split-line { opacity: 1 !important; transform: none !important; }
}
```

---

### 6. Tab Order Audit

Verify tab order is logical through the full page. Key checkpoints:

1. Skip link → focuses `#main` (bypasses nav)
2. Navigation links (left to right)
3. Hero CTAs (primary first)
4. Services section (if accordion: each card is focusable, expanded card reveals details)
5. Gallery (each card focusable)
6. Process steps (not interactive — only visual)
7. About stats (not interactive)
8. Testimonials (not interactive)
9. CTA band button
10. Contact form (fields in logical order)

---

## Acceptance Criteria

- [ ] Skip link visible on first Tab press, hidden otherwise
- [ ] Skip link focuses `#main` element (keyboard users bypass nav)
- [ ] All SplitType calls use `splitToWords()` / `splitToChars()` / `splitToLines()` helpers
- [ ] Every split container has `aria-label` set to full original text
- [ ] Screen reader reads "Precision craft for London homes" not "p r e c i s i o n ..."
- [ ] All interactive elements have visible amber focus ring on `:focus-visible`
- [ ] Preloader has `role="progressbar"` with `aria-valuenow` updated
- [ ] Preloader has `role="status"` live region with loading announcements
- [ ] Reduced-motion: page fully readable (all text opacity: 1)
- [ ] Reduced-motion: no CSS animations running
- [ ] Reduced-motion: no GSAP ScrollTrigger animations (instant reveals)
- [ ] `tests/validate-a11y.js` passes all checks
- [ ] Tab order: all 10 checkpoints reachable in logical order
