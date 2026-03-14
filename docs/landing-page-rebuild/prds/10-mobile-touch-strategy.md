# PRD 10 — Mobile & Touch Interaction Strategy

**Status:** Planning
**Priority:** P2
**Files:** `src/site/index.js`, `styles.css`, `src/scene/index.js`
**Depends on:** Phase B (section content must be stable), Phase C (visual identity established)

---

## Objective

Define mobile as a distinct experience tier, not a shrunken desktop. Services switch from horizontal scroll to accordion. Gallery becomes a swipe carousel. No tilt or magnetic cursor on touch devices. Touch parallax replaces mouse parallax.

---

## Current State

### Mobile-Specific Code

- `crownMobile` Three.js composition: exists for hero (good)
- Quality tier: `mobile` reduces particle counts to 42%
- `initServicesHScroll()`: uses `gsap.matchMedia('(min-width: 1024px)')` — correctly gates horizontal scroll on desktop
- `initGalleryTilt()`: no touch device guard
- `initMagneticButtons()`: no touch device guard
- Custom cursor: partially guarded (no cursor on touch devices)

### Missing Mobile Patterns

| Section | Desktop | Mobile (current) | Mobile (target) |
|---------|---------|-----------------|----------------|
| Services | Horizontal scroll | Vertical stack (CSS responsive) | Vertical stack + accordion tap-expand |
| Gallery | Grid + tilt | Grid, no tilt | 2-column swipe carousel |
| Process | Horizontal steps | Stacked (CSS) | Same, sequential reveal |
| Typography | Desktop scale | Fluid-scaled (good) | Same |
| Cursor | Amber dot + ring | Hidden | Removed from DOM |
| Magnetic | Active | Active (bug) | Disabled |
| Tilt | Active | Active (bug) | Disabled |

---

## Target State

### Touch Detection Strategy

Single detection point, used everywhere:

```js
// In src/site/index.js — at module scope
const IS_TOUCH = window.matchMedia('(pointer:coarse)').matches;
const IS_MOBILE = window.matchMedia('(max-width: 1023px)').matches;

// Responsive — listen for changes (tablet connecting keyboard, etc.)
const touchMQ = window.matchMedia('(pointer:coarse)');
touchMQ.addEventListener('change', () => {
  location.reload(); // Simple: reload on input type change
});
```

---

## Services: Accordion on Mobile

On mobile (`IS_MOBILE || IS_TOUCH`), the services section switches from horizontal scroll to a vertical list with tap-expand detail:

```js
// In initServicesHScroll() — extend with mobile branch
function initServicesHScroll() {
  // Existing desktop code in gsap.matchMedia block (keep)

  if (IS_TOUCH || IS_MOBILE) {
    initServicesMobileAccordion();
    return;
  }
}

function initServicesMobileAccordion() {
  const cards = document.querySelectorAll('.service-card');

  cards.forEach((card) => {
    card.setAttribute('role', 'button');
    card.setAttribute('aria-expanded', 'false');
    card.setAttribute('tabindex', '0');

    const details = card.querySelector('.service-card__details');
    if (details) {
      details.style.height = '0';
      details.style.overflow = 'hidden';
    }

    const toggle = () => {
      const isOpen = card.dataset.open === 'true';
      // Close all
      cards.forEach(c => {
        c.dataset.open = 'false';
        c.setAttribute('aria-expanded', 'false');
        const d = c.querySelector('.service-card__details');
        if (d) gsap.to(d, { height: 0, duration: 0.3, ease: 'power2.inOut' });
      });
      // Open clicked if was closed
      if (!isOpen) {
        card.dataset.open = 'true';
        card.setAttribute('aria-expanded', 'true');
        if (details) {
          gsap.to(details, { height: 'auto', duration: 0.4, ease: 'power3.out' });
        }
      }
    };

    card.addEventListener('click', toggle);
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); }
    });
  });
}
```

---

## Gallery: Swipe Carousel

Replace grid with CSS scroll-snap carousel on mobile:

```css
/* styles.css — gallery mobile */
@media (max-width: 767px) {
  .gallery-grid {
    display: flex;
    overflow-x: scroll;
    scroll-snap-type: x mandatory;
    gap: 16px;
    padding: 0 16px;
    scrollbar-width: none;
  }

  .gallery-grid::-webkit-scrollbar { display: none; }

  .gallery-card {
    flex: 0 0 calc(50% - 8px); /* 2 cards visible */
    scroll-snap-align: start;
    max-width: 280px;
  }
}
```

JS snap listener (optional indicators):

```js
// In initGallery() — add mobile snap indicators
if (IS_TOUCH) {
  const grid = document.querySelector('.gallery-grid');
  const dots = createCarouselDots(grid.children.length / 2);

  grid.addEventListener('scrollend', () => {
    const activeIndex = Math.round(grid.scrollLeft / grid.clientWidth);
    updateCarouselDots(dots, activeIndex);
  }, { passive: true });
}
```

---

## Touch Parallax (Replaces Mouse Parallax)

On touch devices, device tilt / touch-move drives subtle parallax instead of mouse position:

```js
// In initParallaxSections() — add touch branch
if (IS_TOUCH) {
  // DeviceOrientation (if permitted) or touch-move parallax
  let touchStartX = 0, touchStartY = 0;

  document.addEventListener('touchmove', (e) => {
    const touch = e.touches[0];
    const dx = (touch.clientX - window.innerWidth / 2) / window.innerWidth;
    const dy = (touch.clientY - window.innerHeight / 2) / window.innerHeight;

    gsap.to('.parallax-section', {
      backgroundPositionX: `calc(50% + ${dx * 10}px)`,
      backgroundPositionY: `calc(50% + ${dy * 5}px)`,
      duration: 0.5,
      ease: 'power1.out'
    });
  }, { passive: true });
}
```

---

## Mobile Typography Scale

Fluid typography already uses `clamp()` — verify at 375px, 430px viewports that:

| Element | Current Min | Check |
|---------|------------|-------|
| Hero title | 3.2rem (clamp min) | Verify not truncated at 375px |
| Section titles | 2rem (clamp min) | Should be legible |
| Body | ~1rem | Fine |

Add mobile-specific reduction if needed:

```css
@media (max-width: 480px) {
  /* If clamp mins are still too large */
  :root {
    --fluid-hero: clamp(2.4rem, 8vw, 8rem); /* slightly smaller floor */
  }
}
```

---

## Mobile Reveal Timing Adjustments

On mobile, reduce animation durations by ~20% to feel snappier (phone users scan faster):

```js
// In motionMode dispatcher (PRD 02):
const durationMultiplier = IS_MOBILE ? 0.8 : 1.0;
// Apply to all mode duration opts
opts.duration = (opts.duration ?? DEFAULT_DURATION) * durationMultiplier;
```

---

## Guards to Add

| Function | Guard to Add |
|----------|-------------|
| `initMagneticButtons()` | `if (IS_TOUCH) return;` at top |
| `initGalleryTilt()` | `if (IS_TOUCH) return;` at top |
| `initCursor()` | `if (IS_TOUCH) { removeCursorDom(); return; }` at top |
| `initParallaxSections()` | Branch: desktop uses `backgroundPosition`, mobile uses touch-move |

---

## Acceptance Criteria

- [ ] Services: accordion visible on mobile, horizontal scroll on desktop
- [ ] Accordion: tap-expand works, ARIA expanded/collapsed state correct
- [ ] Gallery: CSS scroll-snap carousel on mobile (width ≤767px)
- [ ] Gallery: tilt disabled on touch devices
- [ ] Magnetic buttons: disabled on touch devices
- [ ] Custom cursor: DOM elements removed on touch devices
- [ ] Touch parallax: subtle section background movement on touch-move
- [ ] Typography: legible at 375px (iPhone SE size)
- [ ] Playwright: mobile tests pass at 430×932 and 390×844 viewports
- [ ] No horizontal overflow on any section at mobile widths
