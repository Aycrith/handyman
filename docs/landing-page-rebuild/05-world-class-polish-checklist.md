# World-Class Polish Checklist

**Date:** 2026-03-14
**Purpose:** Per-section acceptance criteria defining "done" for each part of the transformation.

---

## Global Standards (Apply to All Sections)

### Motion
- [ ] Every animated element uses a named motion mode (cinematic-sweep / precision-stagger / velocity-scrub / ambient-drift)
- [ ] No element uses raw `opacity+y power2.out` without motionMode dispatch (except hero, which is authored)
- [ ] All scroll-triggered animations use `once: true` to prevent re-fire
- [ ] All animations have `prefers-reduced-motion` fallback (instant reveal, no transform)
- [ ] Stagger timing feels deliberate — not too fast (robotic) or too slow (tedious)

### Typography
- [ ] Section titles use `cinematic-sweep` (word-level skewY clearing to 0)
- [ ] All SplitType containers have `aria-label` set before split
- [ ] Body copy reveals feel distinct from title reveals
- [ ] Fluid type scales work at all viewport widths (320px → 1440px+)

### Accessibility
- [ ] Skip-to-content link visible on focus, reaches `#main`
- [ ] Tab order is logical (top-to-bottom, left-to-right)
- [ ] All interactive elements have visible amber focus ring (`:focus-visible`)
- [ ] All ARIA labels are present and accurate
- [ ] Reduced-motion: page is fully readable, functional, and non-animated

### Performance
- [ ] Desktop frame time: ≤16.7ms (60fps)
- [ ] Mobile frame time: ≤22ms (~45fps)
- [ ] No GSAP animation causes layout thrashing (no `offsetHeight` reads inside animation callbacks)
- [ ] CSS `will-change` used sparingly (only on elements that actually animate)

---

## Section-by-Section Acceptance Criteria

---

### Hero Section
*Existing quality — protect and maintain*

- [ ] Director phase sequence completes in ≤2.5s on desktop
- [ ] Tool reveal feels cinematic (not just a fade-in)
- [ ] CTA hover triggers amber pulse in Three.js scene
- [ ] Scroll-out: feels like a camera move (not a dissolve)
- [ ] Mobile: `crownMobile` composition active, not shrunk desktop layout
- [ ] Particle species visible and distinct at desktop tier
- [ ] Custom cursor active, magnetic on CTA buttons

---

### Services Section
*Target: Blueprint Workshop*

**Visual Identity:**
- [ ] Blueprint grid background visible (subtle — 6% opacity max)
- [ ] Card borders use blueprint blue accent (not just global glass border)
- [ ] Service icon treatment: amber on deep blue background
- [ ] Eyebrow labels: DM Mono, uppercase

**Motion:**
- [ ] Cards enter with `precision-stagger` (scale + y, not just y)
- [ ] Horizontal scroll still works on desktop (≥1024px)
- [ ] Per-card internal parallax: icon moves slower than card label on horizontal scroll
- [ ] Active card has scale 1.02 + amber border glow

**Mobile:**
- [ ] Vertical stack with accordion tap-expand (not horizontal scroll)
- [ ] Accordion reveals card details without page jump
- [ ] Touch-friendly tap targets (≥44px)

---

### Rhetoric Section
*Target: Statement Room*

**Visual Identity:**
- [ ] Near-fullscreen (min-height: 90vh)
- [ ] Single large Fraunces statement (fluid 6–8rem)
- [ ] Amber word(s) highlighted via `background-clip: text`
- [ ] No decorative elements — text is the design

**Motion:**
- [ ] Lines reveal velocity-biased (fast scroll = dramatic, slow = gentle)
- [ ] Blur clears to sharp as lines enter viewport
- [ ] Amber accent word(s) light up after text settles
- [ ] Reduced-motion: text visible immediately, no blur transition

---

### Process Section
*Target: Precision Workflow*

**Visual Identity:**
- [ ] Amber circle counters for step numbers
- [ ] SVG connector lines between steps (thin amber stroke)
- [ ] Generous whitespace between steps
- [ ] Step numbers: large Fraunces numerals at 80% opacity

**Motion:**
- [ ] Steps reveal sequentially (each triggers when previous settles)
- [ ] Connector lines draw left-to-right via `stroke-dashoffset`
- [ ] Number count-up fires on step entry
- [ ] Connector draw and count-up are synchronized

---

### Gallery Section
*Target: Evidence Room*

**Visual Identity:**
- [ ] Near-black section background
- [ ] Amber corner slash badge on each card (CSS `::after`)
- [ ] Card labels: DM Mono, uppercase, amber tick prefix
- [ ] Image desaturation → color on hover

**Motion:**
- [ ] Cards enter with `precision-stagger` (column-aware)
- [ ] 3D tilt active on hover (desktop only)
- [ ] Inner parallax: image translates at 0.4× card-tilt magnitude
- [ ] Hover: card lifts (scale 1.02) + amber glow shadow

**Mobile:**
- [ ] 2-column CSS scroll-snap carousel
- [ ] No tilt (touch device detection)
- [ ] Swipe gesture moves naturally between columns

---

### About / Stats Section

**Visual Identity:**
- [ ] Stat cards feel distinct from service cards
- [ ] Large Fraunces numbers for stats (same language as process steps)

**Motion:**
- [ ] Stat numbers count up from 0 on scroll entry
- [ ] Cards enter with `precision-stagger`
- [ ] Pillar icons animate on entry (draw-on if SVG, fade-scale if not)

---

### Testimonials Section

**Visual Identity:**
- [ ] Cards feel editorial (not generic review widget)
- [ ] Quote marks styled (Fraunces, oversized, amber-tinted)
- [ ] Attribution: DM Mono, small, subdued

**Motion:**
- [ ] Cards enter with `precision-stagger` + subtle blur clearing
- [ ] No simultaneous reveal — stagger creates reading rhythm

---

### CTA Band Section
*Target: Ember Warmth*

**Visual Identity:**
- [ ] Warm amber-to-dark radial gradient (not linear)
- [ ] CSS ambient particles visible (10–15, subtle)
- [ ] Button: full-amber fill, amber glow on hover

**Motion:**
- [ ] Heading: `cinematic-sweep`
- [ ] Button entrance: slight scale from 0.97 + opacity
- [ ] Particles: `ambient-drift` (always active, not scroll-triggered)

---

### Contact Section

**Functionality:**
- [ ] Form validation works before SMS URI generation
- [ ] Error states have clear visual indication
- [ ] Required field indicators accessible (not color-only)
- [ ] SMS URI generates correctly for mobile users

**Motion:**
- [ ] Form slides in with `precision-stagger` (fields stagger sequentially)
- [ ] Contact info block enters from right (existing pattern is good)

---

## Loading Experience

- [ ] Stage 1: Skeleton content renders within 200ms of HTML parse
- [ ] Stage 2: Typography reveals when `document.fonts.ready` resolves
- [ ] Stage 3: Hero canvas fades in when GLB assets loaded
- [ ] WebGL failure: static image fallback renders, page is fully readable
- [ ] No flash of unstyled content (FOUC) at any stage
- [ ] Progress bar reflects actual 3-stage loading state

---

## Performance Checklist

- [ ] `npm run build` produces no chunk-size warnings
- [ ] Main bundle: scene and site JS in separate chunks
- [ ] Three.js and GSAP in vendor chunk
- [ ] Hidden tab: CPU drops to near-zero (RAF suppressed)
- [ ] No `requestAnimationFrame` loops running when Three.js scene is disposed
- [ ] GSAP `ScrollTrigger.refresh()` called after layout shifts (fonts load, skeleton dissolves)

---

## Test Suite Checklist

Before shipping:

- [ ] `validate-hero-assets.js` — passes (GLB integrity)
- [ ] `validate-ui.js` — passes (preloader, scene boot, scroll, viewport)
- [ ] `validate-effects.js` — passes (mobile/low tier effects)
- [ ] `validate-effects-desktop.js` — passes (desktop effects)
- [ ] `validate-sections.js` — **NEW** passes (section reveals, 6 sections)
- [ ] `validate-a11y.js` — **NEW** passes (focus ring, skip link, reduced-motion)

---

## Subjective Quality Bar

> "Does this feel like a different page than when we started?"

For each section, ask:
1. **Would a visitor notice the section if they screenshotted it?** (Identity test)
2. **Does the entrance feel earned?** (Motion test)
3. **Does the typography hierarchy communicate clearly at first glance?** (Hierarchy test)
4. **Does this section feel like it belongs in the same world as the hero?** (Continuity test)

If any section fails one of these four questions, it's not done.
