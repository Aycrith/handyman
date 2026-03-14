# Reference Synthesis — Motion Grammar & World-Class Benchmarks

**Date:** 2026-03-14

---

## Motion Grammar Principles

World-class web experiences don't have "animations" — they have a **motion grammar**: a defined vocabulary of movement types that each carry semantic meaning, and are applied consistently based on what a piece of content *means* to the reader, not just where it is on the page.

### The 4-Mode Vocabulary

Based on the content structure of this handyman landing page, 4 canonical motion modes are defined:

---

### Mode 1: `cinematic-sweep`

**What it communicates:** "This is a statement. It matters. Pause and read."

**When to use:**
- Section titles (Fraunces display type)
- The rhetoric section's central statement
- CTA band heading

**Technical signature:**
```js
// Words rise from y: 40 with skewY: 8deg clearing to 0
// Each word staggered 0.055s
// Easing: expo.out (fast in, slow settle)
// Duration: 0.9s per word
gsap.fromTo(words,
  { opacity: 0, y: 40, skewY: 8 },
  { opacity: 1, y: 0, skewY: 0, duration: 0.9, ease: 'expo.out',
    stagger: 0.055 }
);
```

**Why expo.out:** The exponential deceleration mimics the feel of a shutter snap — fast arrival, slow settle. This is the easing used by high-end editorial typography (e.g., Apple, Awwwards-winning studio sites).

---

### Mode 2: `precision-stagger`

**What it communicates:** "These are items in a system. Each one is deliberate."

**When to use:**
- Service cards (the 6 service offerings)
- Process steps (numbered sequence)
- Testimonial cards
- Trust badges (if animated)
- Stat count-up cards

**Technical signature:**
```js
// Cards enter with perspective-informed entrance
// Stagger based on grid position (i % cols * rowDelay + i * baseDelay)
// Scale from 0.97 to 1 + y-shift + opacity
// Duration: 0.75s, ease: power3.out
gsap.fromTo(cards,
  { opacity: 0, y: 28, scale: 0.97 },
  { opacity: 1, y: 0, scale: 1, duration: 0.75, ease: 'power3.out',
    stagger: { amount: 0.4, from: 'start' } }
);
```

**Why power3.out over power2.out:** Slightly more pronounced deceleration creates the feeling of mass — each card "lands" rather than just appearing.

---

### Mode 3: `velocity-scrub`

**What it communicates:** "This responds to your intention. Speed shapes the experience."

**When to use:**
- Rhetoric section body lines (scroll velocity biases reveal intensity)
- Gallery cards (subtle response to scroll speed)
- Any element that should feel "alive" to scrolling

**Technical signature:**
```js
// ScrollTrigger scrub with velocity sampling
// Lenis velocity (from 'scroll' event) biases the animation playhead
// Fast scroll: element arrives more dramatically (larger blur-in)
// Slow scroll: element arrives gently

const lenis = getLenis();
lenis.on('scroll', ({ velocity }) => {
  const intensity = Math.min(Math.abs(velocity) / 10, 1); // 0→1
  gsap.quickSetter(rhetoricLines, '--reveal-intensity')(intensity);
});
```

**CSS coupling:**
```css
.rhetoric-line {
  filter: blur(calc(var(--reveal-intensity, 0) * 4px));
  transform: translateY(calc(var(--reveal-intensity, 0) * 12px));
  transition: filter 0.4s ease, transform 0.4s ease;
}
```

---

### Mode 4: `ambient-drift`

**What it communicates:** "This exists in the world. It breathes."

**When to use:**
- Background decorative elements
- CSS particle system in mid-page sections
- Section ambient glow elements
- `initAmbientGlow()` (currently a no-op)

**Technical signature:**
```css
/* Gentle infinite float — no scroll trigger, always active */
@keyframes ambientDrift {
  0%, 100% { transform: translateY(0) rotate(0deg); opacity: 0.4; }
  33%       { transform: translateY(-8px) rotate(1.2deg); opacity: 0.6; }
  66%       { transform: translateY(4px) rotate(-0.8deg); opacity: 0.5; }
}
.ambient-particle {
  animation: ambientDrift var(--drift-duration, 8s) ease-in-out infinite;
  animation-delay: var(--drift-delay, 0s);
}
```

---

## Section Identity References

### Blueprint Workshop (Services)

**Inspiration:** Technical blueprint drawings, architectural schematics, precision drafting
**Visual markers:**
- Grid background via `repeating-linear-gradient` at 1px lines (20px/100px grid)
- Color shift: `--color-amber` accents → `--color-blue-dim` (blueprint blue)
- Monospace DM Mono for card eyebrow labels
- Fine border lines instead of glass cards

**Implementation anchor:** CSS background on `.services` section:
```css
.services {
  --section-theme: blueprint;
  background-image:
    repeating-linear-gradient(0deg, transparent, transparent 19px, rgba(80,120,200,0.06) 20px),
    repeating-linear-gradient(90deg, transparent, transparent 19px, rgba(80,120,200,0.06) 20px);
}
```

---

### Evidence Room (Gallery)

**Inspiration:** Crime scene documentation, journalism photo evidence boards, editorial photography exhibits
**Visual markers:**
- Near-black background (`--color-bg` deepened, not glass)
- Amber diagonal slash badge on cards: CSS `clip-path` amber corner accent
- Monospace uppercase labels, amber tick `✓` prefix
- High-contrast card edges
- Images: slight desaturation until hover

**Implementation anchor:**
```css
.gallery {
  --section-theme: evidence;
  background: #0a0a0a;
}
.gallery-card::after {
  content: '';
  position: absolute;
  top: 0; right: 0;
  width: 0; height: 0;
  border-style: solid;
  border-width: 0 40px 40px 0;
  border-color: transparent var(--color-amber) transparent transparent;
}
```

---

### Precision Workflow (Process)

**Inspiration:** CNC machining workflows, ISO certification documentation, precision manufacturing runsheets
**Visual markers:**
- Light-on-dark numbered steps with amber circle counter
- SVG connector lines between steps (existing in `initProcessSteps()` scaleX animation — extend this)
- Deliberate whitespace — fewer elements, breathing room
- Step numbers: large Fraunces numerals, 80% opacity

---

### Statement Room (Rhetoric)

**Inspiration:** Museum statement walls, luxury brand manifestos, editorial magazine full-spreads
**Visual markers:**
- Near-fullscreen single statement
- Large Fraunces display type (fluid 6–8rem)
- One or two amber words highlighted via `background-clip: text`
- No decoration — the text IS the design

**Implementation anchor:**
```css
.rhetoric-section {
  --section-theme: statement;
  min-height: 90vh;
  display: grid;
  place-items: center;
}
.rhetoric-section em {
  background: var(--gradient-amber);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  font-style: normal;
}
```

---

### Ember Warmth (CTA Band)

**Inspiration:** Forge glow, ember cooling, warm craft atmosphere
**Visual markers:**
- Warm amber-to-dark radial gradient (from center outward)
- Subtle CSS-only particle simulation (10–20 glowing dots)
- Button: full-amber fill with `box-shadow` amber glow on hover

---

## Typography in Motion — Editorial References

The gap between the hero title reveal and section titles is the most immediately perceptible quality deficit. World-class references:

**Word reveal with skewY:** Used by Locomotive Scroll demos, Bureau Borsche projects, many Awwwards SOTD sites. The skewY clears to 0 simultaneously with y-rise, creating a "printing press" register feel.

**Blur-to-sharp:** The `initRhetoricalSection()` already uses this. Extend it: fast scroll increases blur intensity, slow scroll allows sharp reveal. This creates kinetic feedback.

**Line-by-line velocity bias:** Each line's reveal timing shifts based on Lenis `velocity` at the moment it enters the viewport. Fast scroller sees lines snap in; slow scroller sees them drift in. Same content, different experience — responsive to user intent.

---

## Post-Processing References

### Depth of Field (DoF)

**Pattern:** Selective DoF — active only in `pre-reveal` and `reveal` director phases, where it adds cinematic depth. Off in `interactive-idle` (tool should be pin-sharp in hero lockup).

**Implementation approach in Three.js r134:**
```js
// BokehPass from three/examples/jsm/postprocessing/BokehPass.js
import { BokehPass } from 'three/examples/jsm/postprocessing/BokehPass.js';
const bokehPass = new BokehPass(scene, camera, {
  focus: 5.0,   // matches lockup camera z (~6.5)
  aperture: 0.025,
  maxblur: 0.01
});
// Add to composer after UnrealBloomPass
// Remove/set maxblur=0 during interactive-idle phase
```

### Chromatic Aberration (CA)

**Pattern:** One-frame burst on CTA click. Not a permanent effect. Fires via `hero:magic-pulse` event. Adds premium camera-lens feel to CTA feedback.

**Implementation approach:**
```glsl
// Simple CA shader: offset R, G, B channels by small UV amounts
uniform float uStrength; // 0.0 normally, 1.0 on pulse
vec2 rOffset = vec2(uStrength * 0.004, 0.0);
vec4 r = texture2D(tDiffuse, vUv + rOffset);
vec4 g = texture2D(tDiffuse, vUv);
vec4 b = texture2D(tDiffuse, vUv - rOffset);
gl_FragColor = vec4(r.r, g.g, b.b, 1.0);
```

### Film Grain (GLSL vs CSS)

**Current:** Static SVG `feTurbulence` overlay — no temporal variation. Same grain pattern every frame.

**Target:** Dynamic GLSL grain that changes each frame (temporal noise). Much more cinematic.

```glsl
// grain.glsl fragment
uniform float uTime;
uniform float uStrength; // 0.035 baseline
float noise = fract(sin(dot(vUv * uTime, vec2(12.9898, 78.233))) * 43758.5453);
gl_FragColor = tBase + vec4(vec3((noise - 0.5) * uStrength), 0.0);
```

---

## Performance Benchmarks

| Metric | Target | Current Status |
|--------|--------|---------------|
| Frame time (desktop) | ≤16.7ms (60fps) | ~14ms (Three.js RAF) |
| Frame time (mobile) | ≤22ms (~45fps acceptable) | Unknown |
| Bundle size (main chunk) | ≤700 KB gzipped | Exceeds 500 KB warning |
| LCP | ≤2.5s (Good) | Unknown (7s preloader blocks) |
| CLS | ≤0.1 | Likely 0 (skeleton would confirm) |
| Hidden-tab CPU | ~0% | Unknown (no RAF suppression) |

---

## Competitive Analysis

### What world-class handyman/craft sites do

1. **Tools as art objects:** High-end tradesperson brands (like premium knife makers, Leatherman flagship) treat their tools as photography subjects. The hero's cinematic reveal pattern is already aligned — extend this language below the fold.

2. **Process as narrative:** Premium services sites don't just list steps — they *narrate* a journey. Each step feels like a chapter. The connector lines + count-up already gesture toward this.

3. **Craft signals in typography:** Fraunces (serif) for display + DM Mono for labels creates a "precision craft" typographic voice — play this up in section identities (especially Blueprint Workshop).

4. **Social proof with editorial weight:** Testimonials should feel like bylines in a magazine, not star-rating form fields.
