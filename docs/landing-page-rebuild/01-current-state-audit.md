# Current State Audit

**Date:** 2026-03-14
**Codebase lines:** ~14,196 (JS: 10,625 | CSS: 2,615 | HTML: 937)

---

## 1. src/site/index.js — 27 initX() Functions

### Complete Function Inventory

| # | Function | Lines | Pattern | Notes |
|---|---------|-------|---------|-------|
| 1 | `initLenis()` | 79–96 | N/A | Smooth scroll, GSAP ticker sync, 1.15s duration |
| 2 | `initHeroEntrance()` | 192–273 | Timeline stagger | 7-element stagger, 1.52s total — hero-specific, KEEP |
| 3 | `initHeroCtaWake()` | 275–298 | Event dispatch | Fires `hero:cta-wake` on CTA hover/focus — KEEP |
| 4 | `initHeroSectionTransitionSignal()` | 300–326 | Event dispatch | Fires `hero:section-transition` (0–1 progress) — KEEP |
| 5 | `initSectionReveals()` | 355–378 | **Generic** | `.reveal` class: `opacity+y(42px)` → `power2.out` |
| 6 | `initServiceCards()` | 386–414 | **Generic** | 3-col stagger `i%3*0.08s`, `opacity+y` |
| 7 | `initTestimonials()` | 421–443 | **Generic** | `i*0.12s` stagger, `opacity+y` |
| 8 | `initCountUp()` | 451–482 | Numeric | Count 0→target, 1.8s — logic distinct, reveal generic |
| 9 | `initPillars()` | 489–511 | **Generic** | `i*0.14s` stagger, `opacity+y` |
| 10 | `initCtaBand()` | 518–537 | **Generic** | `opacity+y`, 0.9s, `power2.out` |
| 11 | `initSectionTitleLines()` | 545–589 | SplitType | Words reveal — closest to authored, but single mode |
| 12 | `initAmbientGlow()` | 597–606 | **No-op** | Placeholder; does nothing |
| 13 | `initProcessSteps()` | 630–673 | **Partial** | Steps + connectors (`scaleX`), sequential — best existing pattern |
| 14 | `initGallery()` | 680–702 | **Generic** | `scale(0.97→1) + opacity`, column stagger |
| 15 | `initTrustBadges()` | 710–712 | **No-op** | CSS `@keyframes marquee` handles it |
| 16 | `initRhetoricalSection()` | 721–778 | **Best-in-class** | Scroll-triggered blur+opacity line reveals — strongest existing pattern |
| 17 | `initContactForm()` | 785–804 | **Generic** | `x:30 + opacity`, 0.9s |
| 18 | `initPreloader()` | 812–859 | Loading | 7s hard timeout + progress bar |
| 19 | `initCursor()` | 867–898 | Cursor | `gsap.quickTo` RAF cursor — KEEP as-is |
| 20 | `initSplitTextReveals()` | 906–944 | SplitType | Hero chars: `rotateX -90°` — hero-specific KEEP; section titles: word stagger (generic) |
| 21 | `initMagneticButtons()` | 952–968 | Magnetic | 0.35 offset, elastic snap-back — KEEP |
| 22 | `initGalleryTilt()` | 976–1005 | Tilt | 3D tilt on gallery cards — EXISTS but underused |
| 23 | `initServicesHScroll()` | 1014–1064 | H-scroll | Desktop-only (≥1024px) via `gsap.matchMedia` |
| 24 | `initNavHighlight()` | 1072–1137 | Nav | Viewport-center active link — KEEP |
| 25 | `initParallaxSections()` | 1145–1162 | Parallax | `backgroundPositionY 30%` on 3 sections |
| 26 | `initContactFormSubmission()` | 1169–1239 | Form | Validation + SMS URI generation |
| 27 | `initAll()` | 1242–1266 | Orchestrator | Calls all 26 init functions |

### The Single-Pattern Problem

Of 27 functions, **18 use the identical pattern:**

```js
gsap.fromTo(element,
  { opacity: 0, y: N },
  { opacity: 1, y: 0, duration: D, ease: 'power2.out',
    scrollTrigger: { start: 'top 82%', once: true } }
);
```

Where N ∈ {20, 30, 36, 42, 52} and D ∈ {0.7, 0.75, 0.8, 0.9}. The variation is purely parametric — there is no motion character differentiation.

### Functions That Work Well (Protect)

- `initHeroEntrance()` — authored hero timeline, keep entirely
- `initRhetoricalSection()` — blur+opacity line reveal, strongest below-fold pattern
- `initProcessSteps()` — sequential + `scaleX` connector — good sectional logic
- `initCursor()` / `initMagneticButtons()` — already authored, keep
- `initServicesHScroll()` — horizontal scroll mechanic works, needs choreography

---

## 2. src/scene/index.js — Three.js Scene Architecture

### Director Phase State Machine

6 phases, transitions are one-directional during session:

```
static-layout → pre-reveal → reveal → lockup → interactive-idle → scroll-transition
```

| Phase | SHOT_CONFIG Preset | Purpose |
|-------|-------------------|---------|
| `static-layout` | lockup | DOM layout pre-scene boot |
| `pre-reveal` | preReveal | Dark atmospheric wake (520ms) |
| `reveal` | reveal | Tool reveal (960ms window) |
| `lockup` | lockup | Stable hero composition |
| `interactive-idle` | interactiveIdle | Pointer-driven sway |
| `scroll-transition` | scrollTransition | Camera compression on scroll |

SHOT_CONFIG timing:
- `introFallbackMs: 1700`
- `preRevealEndMs: 520`
- `revealEndMs: 1480`
- `lockupEndMs: 2420`

### Quality Tier System

| Tier | Trigger | Particle Multiplier | Post-Processing |
|------|---------|---------------------|----------------|
| `desktop` | GPU probe pass | 1.0× | UnrealBloom + CopyShader |
| `mobile` | `navigator.maxTouchPoints > 0` or GPU probe fail | 0.42× | None |
| `low` | WebGL context fail or low GPU score | 0.28× | None |

CSS variable `CAN_RUN_DESKTOP_POST` gates EffectComposer.

### Particle Species (per tier)

| Species | Desktop | Mobile | Low | Behavior |
|---------|---------|--------|-----|----------|
| `flowRibbon` | 2 | 0 | 0 | Cinematic ribbon paths |
| `cloudMote` | 420 | 180 | 120 | Ambient floating motes |
| `microDust` | 170 | 70 | 40 | Fine grain dust |
| `sparkFilament` | 6 | 2 | 0 | Bright spark traces |

### EffectComposer Pipeline

Current: `RenderPass → UnrealBloomPass → CopyShader (renderToScreen)`

Missing:
- Depth of field (no UnrealDOF or BokehPass)
- Chromatic aberration (no CA shader)
- Film grain (CSS static texture, not dynamic GLSL)
- Custom color grade (no toe/shoulder control)

### CSS Bridge

`--scene-warmth` CSS var is driven by Lenis scroll position (0→1) — elegant pattern that can be extended to add `--section-particle-density` and `--section-depth-blur`.

---

## 3. styles.css — Design System State

### CSS Custom Properties (50+ at :root)

**Color:**
- 5 background levels (`--color-bg` through `--color-bg-3`, `--color-surface`, `--color-surface-2`)
- 3 text levels (`--color-text`, `--color-text-muted`, `--color-text-dim`)
- 6 amber accent vars (from `--color-amber` dark to `--color-amber-glow-2` bright)
- 4 blue accent vars
- 5 gradient vars
- 4 glass vars (bg + border, normal + hover)
- 6 shadow vars

**Typography:**
- 3 font families: Fraunces (display), DM Sans (body), DM Mono (mono)
- 6 fluid scales via `clamp()`: hero (3.2–8rem), section (2–3.5rem), sub, body, sm, xs

**Animation:**
- 2 easing vars (`--ease-out`, `--ease-inout`)
- 3 transition speeds (160ms / 280ms / 480ms)

**Missing:**
- Per-section color theme overrides (all sections share global palette)
- `--section-depth` z-layer tokens
- Section-scoped gradient vocabularies

### Existing Animation

| Animation | Lines | Details |
|-----------|-------|---------|
| `@keyframes dotPulse` | ~557 | 2.5s pulse on eyebrow dots |
| `@keyframes scrollDotBounce` | ~664 | 1.8s bounce on scroll cue |
| `@keyframes marquee` | ~2239 | Trust badge continuous scroll |
| Button shimmer | ~432–444 | 0.5s gradient shimmer on hover |
| Film grain | ~193–205 | Static SVG feTurbulence overlay, not animated |

**Missing:**
- CSS particle system (for atmospheric mid-page sections)
- Section skeleton animations (loading phase)
- Velocity-responsive typography
- Per-section background theme overrides

---

## 4. index.html — Sections & Accessibility

### Section Structure

| # | Section | ID | ARIA Label | Key Children |
|---|---------|----|-----------:|-------------|
| 1 | Hero | `hero` | "Hero" | Title, CTAs, scroll cue |
| 2 | Services | `services` | "Services" | Horizontal scroll track + 6 cards |
| 3 | Rhetoric | — | "Our commitment" | Statement paragraph + accents |
| 4 | Process | `process` | "How it works" | 4 steps, connector lines |
| 5 | Gallery | `gallery` | "Project gallery" | Grid of project cards |
| 6 | About/Stats | `about` | "About us" | 3 stat cards + pillars |
| 7 | Testimonials | `testimonials` | "Customer reviews" | 3 testimonial cards |
| 8 | Trust | — | "Trust and credentials" | Marquee badges |
| 9 | CTA Band | — | "Service area" | CTA + service area list |
| 10 | Contact | `contact` | "Contact form" | Form + contact info |

### Accessibility State

**Present:**
- 109 ARIA attributes across sections
- All sections `aria-label`'d
- Nav has `role="navigation"` + `aria-label`
- Scroll progress: `role="progressbar"` + `aria-hidden="true"`
- Form inputs have `autocomplete` attributes

**Missing:**
- **No skip-to-content link** — tab-first users must navigate entire nav
- SplitType splits break `aria-label` on section titles (no preservation code)
- Focus ring styles are inconsistent (not amber-unified)

---

## 5. vite.config.mjs — Build Config

**Current (minimal):**
```js
export default defineConfig({
  server: { host: '127.0.0.1' },
  preview: { host: '127.0.0.1' },
  build: { target: 'es2022' }
});
```

**Missing:**
- `build.rollupOptions.output.manualChunks` for scene/site code splitting
- `build.chunkSizeWarningLimit` (currently 500 KB default, main bundle exceeds it)
- No dynamic import() calls in codebase — all code is in one chunk

---

## 6. Tests — Coverage Map

| File | Coverage |
|------|---------|
| `validate-hero-assets.js` | GLB asset integrity (wrench, hammer, saw + manifest) |
| `validate-ui.js` | Preloader dismiss, scene boot, canvas, scroll, multi-viewport |
| `validate-effects.js` | Mobile/low-end: particles disabled, bloom disabled |
| `validate-effects-desktop.js` | Desktop: particles + bloom enabled |
| `run-all.js` | Pipeline orchestrator |

**Not covered:**
- Section reveal animations (services, gallery, process, about, testimonials)
- Reduced-motion preference behavior
- Mobile viewport section layout (430×932, 390×844)
- Accessibility (tab order, focus ring, aria-label preservation)
- Progressive loading stages

---

## 7. What Works Well — Protect These

| System | Why It Works |
|--------|-------------|
| Director phase state machine | Clean separation of concerns; `SHOT_CONFIG` drives all phases |
| `gsap.quickTo` RAF cursor | Frame-perfect without jank |
| Lenis + `ScrollTrigger.scrollerProxy` | Correct integration pattern; no scroll conflicts |
| `--scene-warmth` CSS variable | Elegant CSS-JS bridge via Lenis scroll |
| Quality-tier detection | GPU probing + automatic downgrade — robust |
| `prefers-reduced-motion` branches | Both CSS and JS branches exist |
| SplitType hero title (chars) | `rotateX -90°` clear is premium feel |
| Custom cursor magnetic buttons | Authored interaction vocabulary |
| Fluid typography `clamp()` | Scale works across all viewports |
| Playwright test harness | Multi-viewport, evidence capture — keep structure |

---

## 8. What Is Weak — Prioritized

| Weakness | Impact | Effort | Priority |
|---------|--------|--------|----------|
| 18/27 initX() using identical pattern | Critical | Medium | P0 |
| No per-section visual identity | Critical | Medium | P0 |
| SplitType underused below hero | High | Low | P1 |
| Gallery tilt exists but no depth | High | Low | P1 |
| `initAmbientGlow()` is a no-op | High | Medium | P1 |
| Film grain is static (not dynamic GLSL) | Medium | High | P2 |
| No skip link | Medium | Low | P1 |
| Hard 7s preloader timeout | Medium | Medium | P2 |
| No code splitting | Medium | Low | P2 |
| SplitType breaks aria-label | Medium | Low | P1 |
| No section-scoped CSS themes | High | Medium | P1 |
| Zero custom GLSL shaders | Medium | Very High | P2 |
| Mobile is shrunk desktop | High | High | P2 |
