# Reference Site Synthesis

**Analyzed:** 11 world-class landing pages (2026-03-14)

## Typography: sr-seventy.one, Dragonfly

**Technique:** Characters/words rise from *below an overflow:hidden parent container*.
- Parent: `overflow: hidden; display: inline-block; vertical-align: bottom; padding-bottom: 0.08em`
- Word: `y: '110%'` → `y: '0%'` — travels through invisible zone, emerges dramatically
- **No opacity animation** — the mask provides invisibility until motion brings word into view

The "printing press" emergence. Zero opacity fade = perceived as premium. This is the single most impactful technique gap.

## Loading: mont-fort.com, Adaline

**mont-fort:** 0.4s linear body opacity fade. No preloader spinner. Entry choreography IS the loading experience.
**Adaline:** `loading-screen-lock` body class enables precise entry choreography timed to asset completion.

Key insight: the intro sequence is the preloader. Total to interactive: ~2.0s.

## Scroll Physics: nohero.studio, mantis.works

**Lenis inertia pattern:** Exponential decay easing `1.001 - 2^(-10t)`. Creates "coasting" deceleration — velocity starts high, drops exponentially, asymptotically approaches rest. Perceptible momentum on fast-then-release scroll creates tactile quality that signals premium craftsmanship.

**smoothTouch: false** — native touch scroll on mobile (Mantis pattern). Desktop gets the inertia; mobile gets native speed.

## Scroll Color: nohero.studio

Background gradient/color shifts tied to scroll position (not section-boundary). Colors breathe continuously, not snap at borders. Implemented via `rgb(calc(var(--bg-r) * 1px))` CSS variable from scroll handler.

## Section Entry: Dragonfly.xyz

`clip-path: inset(50% 0% 50% 0%)` → `inset(0%)`. Content collapses from center outward, "fold open" effect on scroll entry. Applied to section inner containers, not individual elements.

## Cursor: Multiple Sites

`mix-blend-mode: exclusion` or `difference` — cursor color inverts against dark/light content, always visible regardless of background. White cursor in exclusion mode = inverts dark bg to appear light. Amber only for CTA state (blend mode disabled in that state).

## Performance: Dogstudio

`disable-dog` flag on low-end touch — complete removal of animation framework, not just particle reduction. Core functionality preserved. Static-but-beautiful fallback. This is progressive enhancement: high-end gets the full experience, low-end gets a functional, attractive page.

## Font Loading: mantis.works

`size-adjust`, `ascent-override`, `descent-override` on fallback fonts. Prevents layout reflow during font swap. Fallback metrics tuned to match actual font metrics — text doesn't jump when real font loads.

## Canvas Isolation: henryheffernan.com

`pointer-events: none` on WebGL canvas. DOM UI layer has `pointer-events: auto` only on interactive elements. Prevents cursor capture bugs. The cursor operates entirely in DOM space.

## Key Takeaway

The difference between "nice website" and "world-class" is largely **3 techniques**:
1. Overflow mask typography (vs opacity fade)
2. Exponential decay scroll physics (vs linear or default)
3. Clip-path section folds (vs element-level fades)

Everything else (cursor blend, color breathing, font metrics) enhances but these 3 are transformative.
