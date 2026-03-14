# PRD 02 — Motion System & Animation Grammar

**Status:** Planning
**Priority:** P0 — Critical Path (unlocks all section work)
**Files:** `src/site/index.js`, `styles.css`
**Depends on:** Nothing (builds on existing GSAP + ScrollTrigger setup)

---

## Objective

Replace the single-pattern reveal used across all 22 non-hero `initX()` functions with a vocabulary of 4 canonical motion modes. Every section should have a distinct kinetic identity without writing bespoke animation code for each.

---

## Current State Problem

Of 27 init functions, 18 use the identical pattern:

```js
gsap.fromTo(element,
  { opacity: 0, y: N },
  { opacity: 1, y: 0, duration: D, ease: 'power2.out',
    scrollTrigger: { start: 'top 82%', once: true } }
);
```

The only variation is `N` (y distance, range 20–52px) and `D` (duration, range 0.7–0.9s). There is no motion character — every section reveals identically. This is the most immediate quality deficit below the hero.

---

## Target State

A `motionMode(el, mode, opts)` dispatcher that:
1. Resolves which GSAP animation to create based on `mode`
2. Accepts `opts` for site-specific overrides (duration, stagger, start position)
3. Returns the ScrollTrigger instance for external management if needed
4. Integrates with `prefers-reduced-motion` check at the dispatcher level

---

## Motion Mode Definitions

### `cinematic-sweep`

**Intent:** "This is a statement. It deserves attention."
**Elements:** Section titles, CTA headings, rhetoric section
**Character:** Fast arrival, slow settle — exponential deceleration with skewY

```js
function cinematicSweep(el, opts = {}) {
  const words = splitToWords(el); // SplitType wrapper with aria preservation
  return gsap.fromTo(words,
    { opacity: 0, y: opts.y ?? 40, skewY: opts.skewY ?? 8 },
    {
      opacity: 1, y: 0, skewY: 0,
      duration: opts.duration ?? 0.9,
      ease: 'expo.out',
      stagger: opts.stagger ?? 0.055,
      scrollTrigger: {
        trigger: el,
        start: opts.start ?? 'top 85%',
        once: true
      }
    }
  );
}
```

**Reduced-motion fallback:** `gsap.set(words, { opacity: 1 })` — instant, no transform.

---

### `precision-stagger`

**Intent:** "These are items in a deliberate system."
**Elements:** Service cards, process steps, testimonials, pillars, stat cards
**Character:** Grid-aware entry with mass (scale + y), `power3.out` for landing feel

```js
function precisionStagger(els, opts = {}) {
  const cols = opts.cols ?? 3;
  return gsap.fromTo(els,
    { opacity: 0, y: opts.y ?? 28, scale: 0.97 },
    {
      opacity: 1, y: 0, scale: 1,
      duration: opts.duration ?? 0.75,
      ease: 'power3.out',
      stagger: {
        amount: opts.staggerAmount ?? 0.4,
        from: 'start',
        grid: [Math.ceil(els.length / cols), cols]
      },
      scrollTrigger: {
        trigger: els[0]?.closest('section') ?? els[0],
        start: opts.start ?? 'top 82%',
        once: true
      }
    }
  );
}
```

**Reduced-motion fallback:** `gsap.set(els, { opacity: 1, scale: 1 })`.

---

### `velocity-scrub`

**Intent:** "Your scrolling speed shapes the experience."
**Elements:** Rhetoric section lines, gallery cards (secondary)
**Character:** Lenis velocity biases blur and y-offset — faster scroll = more dramatic entry

```js
function velocityScrub(els, opts = {}) {
  // Base reveal: still scroll-triggered
  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: els[0]?.closest('section') ?? els[0],
      start: opts.start ?? 'top 80%',
      once: true,
      onEnter: () => tl.play()
    }
  });

  tl.fromTo(els,
    { opacity: 0, y: opts.y ?? 20, filter: 'blur(6px)' },
    { opacity: 1, y: 0, filter: 'blur(0px)',
      duration: opts.duration ?? 0.8,
      ease: 'power2.out',
      stagger: opts.stagger ?? 0.08
    }
  );

  // Velocity bias: Lenis scroll velocity adjusts blur intensity
  // (registered in initLenis; uses --reveal-intensity CSS var)
  return tl;
}
```

**Reduced-motion fallback:** No blur, no y-offset — `gsap.set(els, { opacity: 1 })`.

---

### `ambient-drift`

**Intent:** "This breathes. It exists in the world."
**Elements:** CSS particle system elements, ambient glow, background decorative elements
**Character:** Infinite gentle float — no scroll trigger, always active

```js
function ambientDrift(els, opts = {}) {
  // Assign CSS custom properties for infinite CSS animation
  els.forEach((el, i) => {
    el.style.setProperty('--drift-duration', `${(opts.baseDuration ?? 7) + Math.random() * 5}s`);
    el.style.setProperty('--drift-delay', `${-(Math.random() * 8)}s`); // negative delay = pre-started
    el.classList.add('ambient-drift');
  });
  // CSS @keyframes ambientDrift handles the actual animation
  // JS only assigns per-element timing variables
}
```

**Reduced-motion fallback:** `ambient-drift` class not added (CSS uses `@media (prefers-reduced-motion: no-preference)` guard).

---

## Dispatcher

```js
// src/site/index.js — top-level dispatcher
function motionMode(el, mode, opts = {}) {
  // Global reduced-motion check
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    // For ambient-drift: skip entirely
    if (mode === 'ambient-drift') return;
    // For others: instant reveal
    const targets = Array.isArray(el) ? el : [el];
    gsap.set(targets, { opacity: 1, y: 0, scale: 1, skewY: 0 });
    return;
  }

  switch (mode) {
    case 'cinematic-sweep':   return cinematicSweep(el, opts);
    case 'precision-stagger': return precisionStagger(Array.isArray(el) ? el : [el], opts);
    case 'velocity-scrub':    return velocityScrub(Array.isArray(el) ? el : [el], opts);
    case 'ambient-drift':     return ambientDrift(Array.isArray(el) ? el : [el], opts);
    default:
      console.warn(`[motionMode] Unknown mode: ${mode}`);
  }
}
```

---

## SplitType Helper with Aria Preservation

```js
// Wraps SplitType to always preserve aria-label
function splitToWords(el) {
  if (!window.SplitType) return [el]; // graceful degradation
  // Preserve accessible text BEFORE split destroys DOM
  el.setAttribute('aria-label', el.textContent.trim());
  const split = new SplitType(el, { types: 'words' });
  return split.words;
}
```

---

## Migration Plan

| Current Function | New Mode | Notes |
|-----------------|----------|-------|
| `initSectionTitleLines()` | `cinematic-sweep` | Replace SplitType words reveal |
| `initServiceCards()` | `precision-stagger` | cols: 3 (or 2 on tablet) |
| `initTestimonials()` | `precision-stagger` | cols: 3 |
| `initPillars()` | `precision-stagger` | cols: 3 |
| `initCtaBand()` | `cinematic-sweep` | On heading element |
| `initSectionReveals()` | Dispatch from `data-motion` attr | Elements opt-in via HTML |
| `initContactForm()` | `precision-stagger` | cols: 1 (vertical form) |
| `initRhetoricalSection()` | `velocity-scrub` | Extend existing blur pattern |
| `initGallery()` | `precision-stagger` | cols: 2 or 3 |
| `initProcessSteps()` | `precision-stagger` + SVG connectors | Sequential, not simultaneous |
| `initAmbientGlow()` | `ambient-drift` | Currently no-op — make real |
| `initHeroEntrance()` | **KEEP UNCHANGED** | Authored timeline, not grammar |
| `initCursor()` | **KEEP UNCHANGED** | Not an animation |
| `initMagneticButtons()` | **KEEP UNCHANGED** | Not a reveal animation |
| `initServicesHScroll()` | **KEEP UNCHANGED** | H-scroll mechanic |

---

## CSS Support Classes

Add to `styles.css`:

```css
/* Ambient drift keyframes */
@keyframes ambientDrift {
  0%, 100% { transform: translateY(0) rotate(0deg); opacity: 0.4; }
  33%       { transform: translateY(-8px) rotate(1.2deg); opacity: 0.6; }
  66%       { transform: translateY(4px) rotate(-0.8deg); opacity: 0.5; }
}

.ambient-drift {
  animation: ambientDrift var(--drift-duration, 8s) ease-in-out infinite;
  animation-delay: var(--drift-delay, 0s);
}

/* Velocity scrub support */
.velocity-line {
  --reveal-intensity: 0;
  filter: blur(calc(var(--reveal-intensity, 0) * 4px));
  transition: filter 0.35s ease;
}

/* Reduced motion: override all CSS animations */
@media (prefers-reduced-motion: reduce) {
  .ambient-drift { animation: none; }
  .velocity-line { filter: none; transition: none; }
}
```

---

## Acceptance Criteria

- [ ] `motionMode()` dispatcher exists and handles all 4 modes
- [ ] All 18 generic `initX()` functions migrated to dispatcher calls
- [ ] `initHeroEntrance()` untouched — hero timeline unaffected
- [ ] Visual inspection: clear motion character difference between cinematic-sweep (section titles) and precision-stagger (cards)
- [ ] SplitType splits always preceded by `aria-label` preservation
- [ ] Reduced-motion: all animations instant-reveal, page fully readable
- [ ] `npm test` passes with zero regressions on existing suites
- [ ] No console warnings in browser during normal navigation
