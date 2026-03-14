# PRD 06 — Typography-in-Motion & UI-to-3D Integration

**Amendment 4 applied:** Lenis exponential decay easing

## Objective

Elevate non-hero typography reveals into authored choreography. Strengthen the coupling between hero canvas events and DOM typography state.

## Lenis Configuration (Amendment 4)

```js
const lenis = new Lenis({
  duration: 1.2,
  easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), // exponential decay
  direction: 'vertical',
  gestureDirection: 'vertical',
  smooth: true,
  mouseMultiplier: 1.0,
  smoothTouch: false,    // native touch scroll (Mantis pattern)
  touchMultiplier: 2,
  infinite: false,
});
```

The exponential decay easing `1.001 - 2^(-10t)` creates a "coasting" deceleration curve — velocity starts high, drops exponentially, asymptotically approaches rest. This is what creates the tactile "weighty" scroll feel seen in nohero.studio and mantis.works.

## Typography System

### initSectionTitleReveal() — replaces per-section title code

```js
function initSectionTitleReveal(selectorOrEl, opts = {}) {
  const els = typeof selectorOrEl === 'string'
    ? document.querySelectorAll(selectorOrEl)
    : [selectorOrEl];

  els.forEach(el => {
    // 1. Preserve aria-label BEFORE split
    if (!el.getAttribute('aria-label')) {
      el.setAttribute('aria-label', el.textContent.trim());
    }

    // 2. SplitType word-level split
    const split = new SplitType(el, { types: 'words' });

    // 3. Wrap each word in overflow:hidden mask (DOM manipulation)
    wrapSplitWords(el);

    // 4. Set initial position (below mask)
    gsap.set(el.querySelectorAll('.split-word'), { y: '110%' });

    // 5. Animate on scroll entry
    ScrollTrigger.create({
      trigger: el,
      start: 'top 85%',
      once: true,
      onEnter: () => {
        gsap.to(el.querySelectorAll('.split-word'), {
          y: '0%',
          duration: opts.duration || 0.9,
          ease: opts.ease || 'power3.out',
          stagger: opts.stagger || 0.055,
        });
      }
    });
  });
}
```

### Rhetoric Section — Velocity-Biased Reveal

Lines reveal in sequence, each starting as the previous word completes. Velocity bias: if user is scrolling fast, duration compresses (0.6s vs 0.9s normal).

## UI-to-3D Coupling

| DOM Event | Scene Response |
|-----------|---------------|
| Hero CTA hover | `hero:cta-wake` → particle glow increase |
| Hero CTA click | `hero:magic-pulse` → particle energy burst |
| Scroll to services | `hero:section-transition` (0→1) → camera phase change |
| Section in viewport | CSS `--scene-warmth` drives overlay intensity |

## Acceptance

- All section titles use overflow mask reveal (NOT opacity fade)
- aria-label set before SplitType splits the DOM
- Lenis exponential decay easing creates perceptible coasting momentum
- `initSectionTitleReveal()` replaces all per-section title reveal code
