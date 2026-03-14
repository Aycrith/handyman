# PRD 05 — Environmental FX / Particles / Atmospheric Layers

**Status:** Planning
**Priority:** P2
**Files:** `src/site/index.js`, `styles.css`
**Depends on:** A3 (Atmospheric scroll thread), A2 (CSS design system)

---

## Objective

Extend atmospheric presence below the hero fold using CSS-layer particle simulation and scroll-reactive depth fog. No additional WebGL canvas — purely CSS + Lenis scroll variable.

---

## Current State

WebGL particles exist only in the hero canvas. Below the fold: no environmental depth. The site has `--scene-warmth` as a scroll-driven CSS variable — the pattern for extending this exists, just not applied yet.

---

## Target State

### CSS Ambient Particle System

10–20 pure CSS particles per atmospheric section. They:
- Are always active (not scroll-triggered)
- Respond to `--section-particle-density` CSS variable
- Use amber-tinted color at low opacity (0.2–0.5)
- Are removed entirely when `prefers-reduced-motion: reduce` is active

### Sections That Get Particles

| Section | Particle Count | Color | Density |
|---------|---------------|-------|---------|
| Services | 12 | Amber `--color-amber` | 0.3 base |
| Rhetoric | 15 | Amber, large (8–16px) | 0.5 base |
| CTA Band | 18 | Amber, varied size | 0.6 base |

Gallery (Evidence Room) and Process (Precision Workflow) intentionally have NO atmospheric particles — their darker, crisper visual identity is incompatible with ambient particles.

### Scroll-Reactive Depth Variables

Two new CSS variables driven by Lenis scroll position:

| Variable | Range | Effect |
|----------|-------|--------|
| `--section-particle-density` | 0→1 | Particle opacity multiplier via `calc()` |
| `--section-depth-blur` | 0→8px | `backdrop-filter: blur()` on section backgrounds |

---

## Technical Implementation

### CSS Particle System

#### HTML Injection

```js
// In src/site/index.js — new function initAtmosphericParticles()
function initAtmosphericParticles() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const particleSections = [
    { selector: '.services', count: 12 },
    { selector: '.rhetoric-section', count: 15 },
    { selector: '.cta-band', count: 18 }
  ];

  particleSections.forEach(({ selector, count }) => {
    const section = document.querySelector(selector);
    if (!section) return;

    const container = document.createElement('div');
    container.className = 'ambient-particle-layer';
    container.setAttribute('aria-hidden', 'true');

    for (let i = 0; i < count; i++) {
      const p = document.createElement('span');
      p.className = 'ambient-particle';
      p.style.cssText = [
        `--px: ${Math.random() * 100}%`,
        `--py: ${Math.random() * 100}%`,
        `--size: ${4 + Math.random() * 8}px`,
        `--drift-duration: ${6 + Math.random() * 8}s`,
        `--drift-delay: ${-(Math.random() * 10)}s`, // pre-started
        `--drift-opacity: ${0.15 + Math.random() * 0.25}`
      ].join(';');
      container.appendChild(p);
    }

    section.appendChild(container);
  });
}
```

#### CSS

```css
/* Ambient particle layer container */
.ambient-particle-layer {
  position: absolute;
  inset: 0;
  overflow: hidden;
  pointer-events: none;
  z-index: 0;
}

/* Individual particle */
.ambient-particle {
  position: absolute;
  left: var(--px);
  top: var(--py);
  width: var(--size, 6px);
  height: var(--size, 6px);
  border-radius: 50%;
  background: var(--color-amber);
  opacity: calc(var(--drift-opacity, 0.2) * var(--section-particle-density, 1));
  animation: ambientDrift var(--drift-duration, 8s) ease-in-out infinite;
  animation-delay: var(--drift-delay, 0s);
}

/* Drift animation */
@keyframes ambientDrift {
  0%, 100% {
    transform: translate(0, 0) scale(1);
    opacity: calc(var(--drift-opacity, 0.2) * var(--section-particle-density, 0.5));
  }
  25% {
    transform: translate(-6px, -10px) scale(1.1);
    opacity: calc(var(--drift-opacity, 0.2) * var(--section-particle-density, 1));
  }
  50% {
    transform: translate(8px, -6px) scale(0.9);
    opacity: calc(var(--drift-opacity, 0.2) * var(--section-particle-density, 0.7));
  }
  75% {
    transform: translate(-4px, 8px) scale(1.05);
    opacity: calc(var(--drift-opacity, 0.2) * var(--section-particle-density, 0.8));
  }
}

/* Depth blur on section backgrounds */
.services::before,
.rhetoric-section::before,
.cta-band::before {
  content: '';
  position: absolute;
  inset: 0;
  backdrop-filter: blur(calc(var(--section-depth-blur, 0) * 0.3px));
  pointer-events: none;
  z-index: 0;
}

/* Reduced motion: disable entirely */
@media (prefers-reduced-motion: reduce) {
  .ambient-particle-layer { display: none; }
}
```

### Lenis Scroll Extension

```js
// In initLenis() — extend existing scroll handler
lenis.on('scroll', ({ progress, velocity }) => {
  // Existing: scene warmth
  document.documentElement.style.setProperty('--scene-warmth', progress);

  // NEW: section particle density (peaks at mid-scroll)
  const density = Math.sin(progress * Math.PI); // 0→1→0 arc over full scroll
  document.documentElement.style.setProperty('--section-particle-density', density.toFixed(3));

  // NEW: depth blur (increases as user scrolls deeper, max at 60% scroll)
  const blur = Math.min(progress * 1.6, 1.0); // 0→1, reaches 1 at 62.5%
  document.documentElement.style.setProperty('--section-depth-blur', (blur * 8).toFixed(2));
});
```

---

## Performance Considerations

- Pure CSS animations: no JS RAF overhead after injection
- CSS `will-change: transform, opacity` on `.ambient-particle` (justified — continuous animation)
- `pointer-events: none` on particle layer — no interaction overhead
- Max 18 particles per section × 3 sections = 54 DOM elements total — negligible
- Depth blur via `backdrop-filter`: only applies to `.section::before` pseudo-elements, not the entire section content — GPU compositing layer is isolated

---

## Acceptance Criteria

- [ ] Ambient particles visible in services, rhetoric, and CTA band sections
- [ ] Particles do NOT appear in gallery, process, testimonials sections
- [ ] `--section-particle-density` drives particle opacity (particles fade with scroll)
- [ ] `--section-depth-blur` applies subtle depth effect to section backgrounds
- [ ] Reduced-motion: particle layer not rendered
- [ ] GPU: no measurable frame time increase (CSS-only, no WebGL)
- [ ] Particles are `aria-hidden="true"` and `pointer-events: none`
- [ ] Visual: particles are subtle (0.15–0.4 opacity range) — atmospheric, not distracting
