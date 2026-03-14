# World-Class Polish Checklist

Reference sites: activetheory.net, dogstudio.co, henryheffernan.com, dragonfly.xyz, lhbzr.com, mantis.works, tplh.net, nohero.studio, mont-fort.com, sr-seventy.one, adaline.ai

## Typography

- [ ] All section title reveals use overflow:hidden mask — words rise from below curtain
- [ ] NO bare opacity fade on any heading visible to the user
- [ ] SplitType containers have `aria-label` set BEFORE split
- [ ] Descenders not clipped (padding-bottom: 0.08em on .split-line-wrap)
- [ ] Font swap: zero visible layout shift (metric overrides applied)

## Loading & Entry Sequence

- [ ] No spinner ever shown (amber progress bar only)
- [ ] Body opacity: 0 until `document.fonts.ready` (400ms)
- [ ] Navigation slides in at t=600ms
- [ ] Hero text entrance begins at t=800ms
- [ ] Three.js canvas fades in at t=1800ms (if ready)
- [ ] Choreography feels like a directed film sequence

## Scroll Physics

- [ ] Lenis uses exponential decay easing (not linear)
- [ ] Perceptible "coasting" momentum on fast-then-release scroll
- [ ] `smoothTouch: false` (native mobile touch)

## Cursor

- [ ] `mix-blend-mode: exclusion` on dot and ring (default/hover states)
- [ ] Cursor always visible on both dark and light sections
- [ ] CTA state: amber (exclusion disabled)
- [ ] Touch devices: cursor disabled entirely

## Section Entry

- [ ] ≥4 sections have `section-fold` clip-path inset reveal
- [ ] Services section: cards enter with perspective-flips
- [ ] Gallery section: tilt + inner parallax
- [ ] Process section: sequential reveal + SVG connector draw-on
- [ ] Rhetoric section: lines rise through overflow mask

## Sectional Identity

- [ ] Services feels like a "Blueprint Workshop" (grid overlay, blue-dim accents)
- [ ] Gallery feels like an "Evidence Room" (editorial dark, monospace labels)
- [ ] Process feels like "Precision Workflow" (amber circles, breathing space)
- [ ] Rhetoric feels like a "Statement Room" (8rem type, amber-clipped words)
- [ ] CTA band has "Ember Warmth" (amber radial, CSS particles)

## Mobile & Accessibility

- [ ] Low-end touch devices: `motion-disabled` class → functional static page
- [ ] Mobile services: vertical stack (not horizontal scroll)
- [ ] Mobile gallery: CSS scroll-snap carousel
- [ ] Skip-to-content link present and functional
- [ ] Amber focus ring on ALL interactive elements
- [ ] Tab navigation reaches all interactive elements
- [ ] Reduced-motion: page fully readable and functional

## Performance

- [ ] Build produces no chunk warnings (limit raised to 700KB or code-split)
- [ ] `document.hidden` suppresses RAF loop
- [ ] Frame time ≤16.7ms desktop, ≤22ms mobile
- [ ] Canvas has `pointer-events: none`

## 3D Hero

- [ ] Director phase screenshots match reference quality bar
- [ ] First 3 seconds feel staged — tool reveal has weight and ceremony
- [ ] Scroll-out feels like a camera move, not a dissolve
