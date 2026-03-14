# PRD 02 — Motion System & Animation Grammar

**Amendment 1 applied:** Typography reveals use overflow:hidden mask technique — NOT opacity fades.

## Objective

Replace the single-pattern reveal used across all 22 `initX()` functions with a vocabulary of 4 canonical motion modes + 1 section-fold mode.

## Current State

Every section uses `fromTo({opacity:0, y:N}, {opacity:1, y:0})`. SplitType is imported but underused below the hero. No motion grammar exists.

## The Critical Difference: Overflow Mask vs Opacity Fade

**Generic (current):** `gsap.fromTo(word, {opacity:0, y:40}, {opacity:1, y:0})`
**World-class (target):**

```css
/* Parent wrap — the "stage curtain" */
.split-line-wrap {
  overflow: hidden;
  display: inline-block;
  vertical-align: bottom;
  padding-bottom: 0.08em;  /* Prevent descender clipping */
}
```

```js
/* Word RISES FROM BELOW the mask — no opacity needed */
gsap.fromTo(word,
  { y: '110%' },           /* Below the overflow:hidden mask = invisible */
  { y: '0%', duration: 0.9, ease: 'power3.out', stagger: 0.055 }
);
```

The overflow mask provides invisibility. The word travels from beneath the "curtain" into view. This is the "printing press" / "theatrical emergence" technique used on sr-seventy.one, Dragonfly, and every Awwwards site. **Opacity fade = generic. Overflow mask = world-class.**

## Motion Modes

### Mode 1: `cinematic-sweep`
For hero titles, rhetoric statements — single words rise through overflow:hidden mask. No opacity.

```js
// SplitType word-level split
// Wrap each .split-word in .split-line-wrap via DOM (not innerHTML)
// Animate y: '110%' → '0%', stagger: 0.055s, ease: power3.out
```

### Mode 2: `precision-stagger`
For service cards, process steps, gallery cards — elements enter with staggered delay and mild y-offset.

```js
gsap.fromTo(els,
  { opacity: 0, y: 24, scale: 0.97 },
  { opacity: 1, y: 0, scale: 1, stagger: 0.08, ease: 'expo.out' }
);
```

### Mode 3: `velocity-scrub`
For rhetoric lines, scroll-driven parallax — position tied directly to scroll progress.

```js
gsap.to(el, {
  y: (i, el) => -parseFloat(el.dataset.speed || 0.5) * 80,
  ease: 'none',
  scrollTrigger: { scrub: 1.2, start: 'top bottom', end: 'bottom top' }
});
```

### Mode 4: `ambient-drift`
For background elements, CSS particles — slow continuous float, no scroll trigger.

```js
gsap.to(el, { y: -20, duration: 4 + Math.random() * 2, yoyo: true, repeat: -1, ease: 'sine.inOut' });
```

### Mode 5: `section-fold` (Amendment 2)
For section entry — clip-path collapses from center outward.

```js
gsap.fromTo('.section-reveal-inner',
  { clipPath: 'inset(8% 0% 8% 0%)' },
  { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.2, ease: 'expo.out',
    scrollTrigger: { trigger: el, start: 'top 80%', once: true } }
);
```

## Motion Dispatcher

```js
function motionMode(els, mode, opts = {}) {
  switch(mode) {
    case 'cinematic-sweep': return cinematicSweep(els, opts);
    case 'precision-stagger': return precisionStagger(els, opts);
    case 'velocity-scrub': return velocityScrub(els, opts);
    case 'ambient-drift': return ambientDrift(els, opts);
    case 'section-fold': return sectionFold(els, opts);
  }
}
```

## SplitType Wrap Technique

```js
function wrapSplitWords(container) {
  // MUST use DOM manipulation, not innerHTML, to preserve aria-label
  const words = container.querySelectorAll('.split-word');
  words.forEach(word => {
    const wrap = document.createElement('span');
    wrap.className = 'split-line-wrap';
    word.parentNode.insertBefore(wrap, word);
    wrap.appendChild(word);
  });
}
```

## Acceptance

- Visual inspection shows distinct motion character per section
- No section uses bare opacity fade for titles
- Section titles have overflow:hidden parent wrap — words rise from below
- No regression on hero entrance (hero uses its own reveal logic)
- `prefers-reduced-motion`: all animations disabled, elements at final state
