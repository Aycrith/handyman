# PRD 08 — Loading / Streaming / Progressive Enhancement

**Amendment 3 applied:** Precise millisecond orchestration — no spinner.
**Amendment 7 applied:** Font metric overrides prevent CLS during swap.

## Objective

Replace the 7-second hard timeout with a 3-stage progressive reveal and skeleton content strategy. The loading choreography IS the experience.

## Absolute Timing Orchestration (Amendment 3)

```
t=0ms:    HTML parses → body opacity: 0 (CSS default via .page-loading class)
t=0ms:    Amber progress bar begins (no spinner — NEVER a spinner)
t=400ms:  Fonts loaded → body fades from 0→1 (0.4s, linear, mont-fort pattern)
t=600ms:  Navigation slides in from top (y: -20 → 0, 0.3s, power2.out)
t=800ms:  Hero eyebrow text rises through overflow:hidden mask (0.4s, char-by-char)
t=1000ms: Hero title lines emerge through overflow:hidden mask (stagger 0.08s/line)
t=1400ms: Hero sub-copy fades + slides (0.5s, power2.out)
t=1600ms: CTA buttons enter with scale bounce (0.8→1.05→1.0, back.out easing)
t=1800ms: Three.js canvas fades in — if ready. If not, blank canvas until ready.
t=1800ms+: Scene director phases begin (pre-reveal → reveal → lockup)
```

**Total to interactive: ~2.0s. This is the film sequence. No spinner.**

## 3-Stage Progressive Reveal

### Stage 1: Immediate (0ms — HTML parses)
- Skeleton content renders: nav skeleton bar, hero text placeholder lines
- Body at opacity 0 (CSS `.page-loading` class on `<html>`)
- Amber preloader bar visible at 0% progress

### Stage 2: Fonts Ready (400ms)
- `document.fonts.ready` resolves
- Body opacity transitions 0→1 (0.4s linear)
- Nav and hero text placeholders replaced by real content
- Typography entrance begins (eyebrow → title → subtitle)

### Stage 3: Scene Ready (1800ms)
- `window.__sceneAssetsReady` resolves
- Three.js canvas fades in from opacity 0
- Director phases begin
- Preloader bar completes and fades

## Font Metric Overrides (Amendment 7)

In `styles.css`, before Fraunces/DM Sans declarations:

```css
@font-face {
  font-family: 'Fraunces-fallback';
  src: local('Georgia'), local('Times New Roman');
  size-adjust: 96.5%;
  ascent-override: 92%;
  descent-override: 22%;
  line-gap-override: 0%;
}

@font-face {
  font-family: 'DM-Sans-fallback';
  src: local('Arial'), local('Helvetica Neue');
  size-adjust: 100.3%;
  ascent-override: 94%;
  descent-override: 21%;
}

body {
  font-family: 'DM Sans', 'DM-Sans-fallback', sans-serif;
}

.hero__title,
.rhetoric-line,
h1, h2 {
  font-family: 'Fraunces', 'Fraunces-fallback', serif;
}
```

## Skeleton Content Strategy

Add to `index.html`:
- `.hero-skeleton` — 3 lines of different widths (60%, 90%, 70%) with shimmer animation
- Nav skeleton — full-width bar at 8px height
- Section skeletons: 2 headline lines per section

```css
.skeleton-line {
  background: linear-gradient(90deg, rgba(255,255,255,0.04) 25%, rgba(255,255,255,0.1) 50%, rgba(255,255,255,0.04) 75%);
  background-size: 200% 100%;
  animation: skeleton-shimmer 1.5s infinite;
  border-radius: 4px;
  height: 1em;
}
@keyframes skeleton-shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
```

## WebGL Failure Fallback

If Three.js fails to initialize (no WebGL, error):
- Canvas remains hidden (`opacity: 0`)
- Static SVG workshop illustration shows behind hero text
- All text/CTA functionality remains intact

## Acceptance

- LCP-eligible content (hero title) visible within 1s
- No spinner ever shown
- `document.fonts.ready` triggers body reveal, not arbitrary timeout
- WebGL failure → graceful static fallback
- Font swap produces zero visible layout shift (metric overrides)
