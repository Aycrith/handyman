# PRD 10 — Mobile & Touch Interaction Strategy

**Amendment 6 applied:** Full motion-kill mode for low-end touch devices (Dogstudio pattern)

## Objective

Define mobile as a distinct experience tier, not a shrunken desktop.

## Device Detection

```js
const IS_TOUCH = window.matchMedia('(pointer: coarse)').matches;
const IS_LOW_END_TOUCH = IS_TOUCH && navigator.hardwareConcurrency <= 2;
const SHOULD_DISABLE_MOTION =
  window.matchMedia('(prefers-reduced-motion: reduce)').matches ||
  IS_LOW_END_TOUCH;
```

## Motion-Kill Mode (Amendment 6 — Dogstudio pattern)

```js
if (SHOULD_DISABLE_MOTION) {
  document.documentElement.classList.add('motion-disabled');
  // Only run minimal functions
  initLenis();         // smooth scroll still works
  initNavHighlight();  // nav active state
  initContactFormSubmission(); // form still functional
  return; // Skip all animation init
}
// Normal path
initAll();
```

```css
/* motion-disabled: all elements at final (visible) state */
.motion-disabled [data-animate],
.motion-disabled .split-word,
.motion-disabled .reveal,
.motion-disabled .split-line-wrap .split-word,
.motion-disabled .section-reveal-inner {
  opacity: 1 !important;
  transform: none !important;
  filter: none !important;
  clip-path: none !important;
}
```

## Mobile UX Tiers

### Services Section
- **Desktop (≥1024px):** Horizontal scroll (existing)
- **Mobile:** Vertical stack, touch accordion expansion
  ```js
  if (IS_TOUCH || window.innerWidth < 1024) {
    initServicesVerticalStack();
  } else {
    initServicesHScroll();
  }
  ```

### Gallery Section
- **Desktop:** 3D tilt on hover (existing `initGalleryTilt`)
- **Mobile:** 2-column CSS scroll-snap carousel, no tilt
  ```css
  @media (max-width: 768px) {
    .gallery-grid {
      display: flex;
      overflow-x: auto;
      scroll-snap-type: x mandatory;
      -webkit-overflow-scrolling: touch;
    }
    .gallery-card {
      flex: 0 0 80vw;
      scroll-snap-align: center;
    }
  }
  ```

### Typography
- Mobile: shorter reveal durations (0.6s vs 0.9s desktop)
- Larger fluid scale: `clamp(2.5rem, 8vw, 4rem)` for headlines
- Line-by-line stagger reduced (0.04s vs 0.08s)

### Cursor & Magnetic
- Touch: disabled entirely (no cursor, no magnetic, no tilt)

## Hero (Mobile)

- `crownMobile` composition: wrench centered top-third, no support props
- Touch-driven parallax: `deviceorientation` event (with permission on iOS 13+)
- Particle count: 42% of desktop count (already implemented in quality tier)

## Acceptance

- `IS_LOW_END_TOUCH` → `motion-disabled` class → functional static page
- Mobile services: vertical stack, not broken horizontal scroll
- Mobile gallery: scroll-snap carousel
- Touch devices: 0 hover/magnetic/tilt interactions triggered
- Viewport tests pass at 430×932 and 390×844
