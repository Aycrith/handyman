# PRD 08 — Loading / Streaming / Progressive Enhancement

**Status:** Planning
**Priority:** P1
**Files:** `src/site/index.js` (lines 812–859), `index.html`, `styles.css`
**Depends on:** Nothing (standalone loading system)

---

## Objective

Replace the 7-second hard timeout preloader with a 3-stage progressive reveal and skeleton content strategy. LCP-eligible content must be visible within 1 second. WebGL failure must degrade gracefully.

---

## Current State

```js
// src/site/index.js lines 812–859 — current initPreloader()
const fontsReady = document.fonts.ready;
const sceneReady = new Promise(resolve => {
  window.addEventListener('scene:ready', resolve, { once: true });
});

Promise.race([
  Promise.all([fontsReady, sceneReady]),
  new Promise(resolve => setTimeout(resolve, 7000)) // hard timeout
]).then(() => {
  gsap.to('.preloader', { opacity: 0, duration: 0.6, onComplete: () => {
    document.querySelector('.preloader')?.remove();
  }});
});
```

**Problems:**
1. 7s timeout means visitors wait up to 7s before seeing any content
2. If scene takes >7s, raw unstyled HTML appears — visual flash
3. No skeleton content — preloader is blocking black screen
4. No staged reveals — everything appears at once
5. No WebGL failure fallback

---

## Target State

### 3-Stage Progressive Reveal

**Stage 1 — Immediate (0ms, HTML parse)**
- Skeleton content renders in all sections
- Navigation is visible and functional
- Page is readable (skeleton indicates content shape)
- CSS animations for skeleton shimmer active

**Stage 2 — Typography Ready (fonts loaded)**
- `document.fonts.ready` resolves
- Skeleton content replaced with real text content
- Section reveals begin for above-fold content
- Below-fold content: skeleton persists until Stage 3 or scroll entry

**Stage 3 — Scene Ready (WebGL loaded)**
- Hero canvas fades in (opacity 0 → 1)
- Preloader bar reaches 100% and dismisses
- Full site is interactive

### WebGL Failure Path

If Three.js fails to initialize (WebGL not supported, GPU error):
- Static hero image renders in place of canvas
- All DOM sections still work (no dependency on scene events)
- Preloader dismisses after fonts ready (skips scene wait)

---

## Technical Implementation

### Stage 1 — Skeleton HTML

Add to each section in `index.html`:

```html
<!-- Example: services section skeleton -->
<section class="section services">
  <div class="skeleton-layer" aria-hidden="true">
    <div class="skeleton-eyebrow"></div>
    <div class="skeleton-title"></div>
    <div class="skeleton-title skeleton-title--short"></div>
    <div class="skeleton-cards">
      <div class="skeleton-card"></div>
      <div class="skeleton-card"></div>
      <div class="skeleton-card"></div>
    </div>
  </div>
  <!-- Real content hidden during load -->
  <div class="section-content" data-content-state="hidden">
    <!-- ... existing HTML ... -->
  </div>
</section>
```

Skeleton layers are `aria-hidden="true"` — screen readers see real content (not skeleton).

### Stage 1 — Skeleton CSS

```css
/* Skeleton shimmer animation */
@keyframes skeletonShimmer {
  0%   { background-position: -200% center; }
  100% { background-position: 200% center; }
}

.skeleton-layer {
  position: absolute;
  inset: 0;
  padding: inherit; /* Match parent section padding */
}

.skeleton-eyebrow,
.skeleton-title,
.skeleton-card {
  background: linear-gradient(
    90deg,
    var(--color-surface) 25%,
    var(--color-surface-2) 50%,
    var(--color-surface) 75%
  );
  background-size: 200% 100%;
  animation: skeletonShimmer 1.8s ease-in-out infinite;
  border-radius: var(--radius-sm);
}

.skeleton-eyebrow { height: 14px; width: 80px; margin-bottom: 16px; }
.skeleton-title   { height: 48px; width: 60%; margin-bottom: 12px; }
.skeleton-title--short { width: 40%; }
.skeleton-card    { height: 200px; border-radius: var(--radius-md); }
.skeleton-cards   { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; margin-top: 48px; }

/* Reduced motion: no shimmer, use static color */
@media (prefers-reduced-motion: reduce) {
  .skeleton-eyebrow,
  .skeleton-title,
  .skeleton-card { animation: none; }
}
```

### Stage 2 — Font Ready Reveal

```js
// In initPreloader() — revised
async function initPreloader() {
  const bar = document.querySelector('.preloader-bar');

  // Stage 1: immediate — skeleton visible, bar at 10%
  updateProgress(0.1);

  // Stage 2: fonts
  await document.fonts.ready;
  updateProgress(0.4);

  // Reveal real content (above fold first)
  revealContentStage2();

  // Stage 3: scene ready (with 4s timeout as backstop — not 7s)
  const sceneReady = new Promise((resolve) => {
    window.addEventListener('scene:ready', resolve, { once: true });
    // Check WebGL failure flag
    window.addEventListener('scene:failed', () => {
      activateWebGLFallback();
      resolve();
    }, { once: true });
    setTimeout(resolve, 4000); // 4s backstop (not 7s)
  });

  await sceneReady;
  updateProgress(1.0);

  // Dismiss preloader
  gsap.to('.preloader', {
    opacity: 0, duration: 0.5,
    onComplete: () => {
      document.querySelector('.preloader')?.remove();
      // Remove skeleton layers
      document.querySelectorAll('.skeleton-layer').forEach(el => el.remove());
    }
  });
}

function updateProgress(fraction) {
  const bar = document.querySelector('.preloader-bar');
  if (bar) gsap.to(bar, { scaleX: fraction, duration: 0.3, ease: 'power2.out' });

  // Announce to screen readers
  const status = document.getElementById('preloader-status');
  if (status) status.textContent = `Loading... ${Math.round(fraction * 100)}%`;
}

function revealContentStage2() {
  // Swap skeleton → real content for above-fold sections
  document.querySelectorAll('[data-content-state="hidden"]').forEach(el => {
    el.dataset.contentState = 'ready';
  });
  // ScrollTrigger will handle reveals as user scrolls
  ScrollTrigger.refresh();
}

function activateWebGLFallback() {
  // Replace canvas with static hero image
  const canvas = document.querySelector('#hero canvas');
  if (canvas) {
    const fallback = document.createElement('img');
    fallback.src = '/assets/hero-fallback.jpg'; // needs to exist
    fallback.alt = 'Precision craft tools';
    fallback.className = 'hero-fallback-img';
    canvas.replaceWith(fallback);
  }
}
```

### Scene Failure Signal

```js
// In src/scene/index.js — add to WebGL init error handling
try {
  // ... existing Three.js init ...
} catch (err) {
  console.warn('[scene] WebGL init failed:', err);
  window.dispatchEvent(new CustomEvent('scene:failed', { detail: { error: err.message } }));
}
```

### HTML Additions

```html
<!-- In index.html: preloader status for screen readers -->
<div class="preloader">
  <div class="preloader-bar"></div>
  <div id="preloader-status" role="status" aria-live="polite" class="sr-only">Loading...</div>
</div>

<!-- Hero WebGL fallback (hidden until needed) -->
<style>
  .hero-fallback-img {
    position: absolute; inset: 0;
    width: 100%; height: 100%;
    object-fit: cover;
    z-index: 0;
  }
</style>
```

---

## Acceptance Criteria

- [ ] Stage 1: Skeleton content renders within 200ms of HTML parse
- [ ] Stage 2: Font ready triggers real content reveal (not waiting for scene)
- [ ] Stage 3: Hero canvas fades in when scene is ready (not on timeout)
- [ ] Timeout reduced from 7s to 4s backstop
- [ ] WebGL failure: fallback image renders, page is functional
- [ ] `scene:failed` event dispatched on Three.js init error
- [ ] `role="status"` live region announces loading progress
- [ ] Skeleton layers removed after preloader dismisses
- [ ] `prefers-reduced-motion`: skeleton has no shimmer (static fill)
- [ ] `validate-ui.js` tests updated to match new 3-stage behavior
- [ ] LCP-eligible content (above fold text) visible within 1s in Lighthouse test
