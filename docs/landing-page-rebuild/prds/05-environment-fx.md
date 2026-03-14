# PRD 05 — Environmental FX / Particles / Atmospheric Layers

## Objective

Extend atmospheric presence below the hero fold using CSS-layer particle simulation and scroll-reactive depth fog.

## Current State

WebGL particles exist only in the hero canvas. Below the fold: no environmental depth.

## CSS Ambient Particle System

No additional WebGL canvas. Pure CSS keyframe animation.

```css
/* Particle base */
.ambient-particle {
  position: fixed;
  width: 2px;
  height: 2px;
  border-radius: 50%;
  background: var(--color-amber);
  opacity: 0;
  pointer-events: none;
  will-change: transform, opacity;
}

/* Individual particles with varied timing and positions */
.ambient-particle:nth-child(1) {
  left: 15%; top: 40%;
  animation: drift-1 8s 0s infinite;
}
/* ... 10-15 particles total */

@keyframes drift-1 {
  0%   { opacity: 0; transform: translate(0, 0); }
  20%  { opacity: 0.15; }
  80%  { opacity: 0.12; }
  100% { opacity: 0; transform: translate(20px, -60px); }
}
```

## Scroll-Driven CSS Variables

```js
// In Lenis scroll handler
lenis.on('scroll', ({ progress, velocity }) => {
  // Existing: --scene-warmth
  document.documentElement.style.setProperty('--scene-warmth', progress);

  // New: particle density by scroll position
  const density = progress < 0.3 ? 0 : Math.min(1, (progress - 0.3) / 0.4);
  document.documentElement.style.setProperty('--section-particle-density', density);

  // New: depth blur intensity
  const blur = Math.abs(velocity) * 0.3;
  document.documentElement.style.setProperty('--section-depth-blur', blur);
});
```

## Scroll-Position Color Breathing (Gap R5 — nohero.studio pattern)

```js
// Continuous background color shift — NOT discrete section snapping
lenis.on('scroll', ({ progress }) => {
  // Background warmth breathes with scroll position
  const stops = [10, 12, 10, 10, 14]; // R channel values per 5 scroll zones
  const stopG = [10, 11, 10, 10, 11]; // G channel
  const idx = Math.min(progress * 4, 3.99);
  const lo = Math.floor(idx), hi = lo + 1;
  const t = idx - lo;
  const r = stops[lo] + (stops[Math.min(hi, 4)] - stops[lo]) * t;
  const g = stopG[lo] + (stopG[Math.min(hi, 4)] - stopG[lo]) * t;
  document.documentElement.style.setProperty('--bg-breathe-r', r.toFixed(1));
  document.documentElement.style.setProperty('--bg-breathe-g', g.toFixed(1));
});
```

```css
body {
  background-color: rgb(
    calc(var(--bg-breathe-r, 10) * 1px),
    calc(var(--bg-breathe-g, 10) * 1px),
    10px
  );
}
```

## Acceptance

- Mid-page sections feel atmospheric without WebGL cost
- GPU budget unaffected (CSS only, no additional canvas)
- CSS particles visible in services/gallery/about sections
- Background color breathes continuously with scroll (not snapping)
- `--section-depth-blur` intensifies during fast scroll
