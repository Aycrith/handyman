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

## Workshop Journey (Phase E — PRD 13)

- [ ] Background color shifts noticeably but imperceptibly across all 6 zones (hero → services → process → gallery → about → contact)
- [ ] Workshop environment geometry visible as ambient background — not competing with content
- [ ] Camera makes a barely-perceptible drift through zones — environmental change is more prominent than camera movement
- [ ] `window.__sceneDiagnostics().zoneState.activeId` updates correctly on scroll
- [ ] `body.dataset.sceneZone` updates to match active section within one scroll step
- [ ] Particles visibly quieter below hero fold (orbit energy drops in services zone)
- [ ] Gallery zone: noticeably darker/higher contrast than adjacent zones
- [ ] Contact zone: warmest, most inviting color temperature on the page
- [ ] Hero intro choreography unaffected — zone system invisible at scrollProgress < 0.12
- [ ] Low-end devices: workshop geometry not loaded, no broken state, no console errors

## Cinematic World System (Phase F)

- [ ] All 9 worlds boot and activate at their correct scroll ranges
- [ ] 8 transitions fire at correct scroll ranges with distinct cinematic character
- [ ] Signature transition (Hero→Services fog flythrough) is the most dramatic moment on the page
- [ ] No geometry "pops" in — every transition is visually continuous
- [ ] No more than 2 world groups visible simultaneously (current + transition target)
- [ ] World camera targets blend smoothly with existing spring physics
- [ ] World particle stories visibly change atmosphere per section
- [ ] Lighting overrides produce distinct color temperatures per world
- [ ] `?sceneDebug=1` overlay shows live world state, scroll progress, transition info
- [ ] `__sceneDiagnostics().worldState` returns accurate `activeWorld`, `transitionProgress`, `loadedWorlds`
- [ ] Mobile: 4-world simplified path (forge → workshop → ember → return), no ACT 3-7 geometry
- [ ] Low-tier: world system disabled entirely, existing zone behavior preserved
- [ ] Optimized GLBs load within performance budget (<350MB GPU, <16.7ms/frame desktop)
- [ ] `prefers-reduced-motion`: no transitions, static world states, page fully functional
- [ ] DoF active in ACT 3 (Statement Room) and ACT 7 (Testimony Space) only
- [ ] Chromatic aberration burst fires only during transitions
- [ ] Reduced-motion: page fully readable, zone color shifts still occur (not motion), no zone driver side effects
