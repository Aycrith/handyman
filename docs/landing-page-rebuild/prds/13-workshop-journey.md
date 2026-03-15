# PRD 13 — Workshop Journey: Continuous Scroll 3D World

**Date:** 2026-03-15
**Status:** Planned — pending Phase A/B completion
**Depends on:** PRD 01 (scene), PRD 03 (camera), PRD 05 (env FX), PRD 07 (materials)

---

## Objective

Transform the landing page from a 3D hero + disconnected 2D sections into a **continuous 3D workshop environment** where the WebGL canvas never cuts. As the user scrolls through every section, the scene's ambient environment — background color, lighting, bloom strength, fog density, and particle behavior — morphs smoothly through themed workshop "zones". The camera makes a subtle content-first drift through the zones (±0.3z, ±0.15x, ±0.08y).

This is the handyman reimagining of the activetheory.net continuous-scroll 3D world concept: same architectural pattern, completely original workshop thematic applied.

---

## Design Principle: Content-First World

The 3D scene below the fold is **ambient and deferential**. It establishes atmosphere and spatial continuity; it does not compete with the HTML content. Unlike the hero zone where tools are the primary subject, the post-hero zones exist to:
- Create a sense of being inside a living workshop environment
- Give each content section a distinct emotional quality through lighting and color
- Eliminate the jarring transition between "3D hero" and "flat 2D page"

---

## Zone Architecture

Each page section corresponds to a workshop zone with its own environmental identity:

| Zone | Section | Lighting | Color Temperature | Feel |
|------|---------|----------|-------------------|------|
| `hero` | Hero | Key: 1.40, amber | Deep dark, warm center | Tools in orbit, amber glow |
| `services` | Services | Key: 0.82, cool-blue | Blueprint navy | Workshop wall, pegboard |
| `process` | How It Works | Key: 0.88, warm-work | Warm wood tones | Active workbench, dust |
| `gallery` | Recent Projects | Key: 0.60, dramatic | Near-black, high contrast | Evidence wall, display cases |
| `about` | About / Stats | Key: 0.92, intimate | Warm amber-soft | Coffee corner, intimate |
| `contact` | Contact | Key: 1.06, invitation | Warm ember glow | Front door, welcoming |

---

## Technical Architecture

### SCROLL_ZONES Constant (`src/scene/index.js`)

Additive constant — does NOT modify existing `DIRECTOR_PHASE_TO_PRESET` or any preset tables. Placed after `DIRECTOR_PHASE_TO_PRESET` declaration (~line 258).

Each zone entry contains:
```javascript
{
  id: string,
  selector: string,          // CSS selector for DOM boundary measurement
  scrollStart: number,       // 0–1 normalized (computed from DOM, not hardcoded)
  scrollEnd: number,         // 0–1 normalized
  lightRig: { key, fill, rim, ground },
  postFx: { bloomGain, thresholdBias },
  bgColor: { r, g, b },      // normalized 0–1
  fogDensity: number,
  particleStory: string,     // key into SCROLL_ZONE_PARTICLE_STORIES
  exposureBias: number,      // additive tone-mapping exposure offset
}
```

### Zone Boundary Resolution

Zone `scrollStart`/`scrollEnd` values are computed from live DOM rects at init and on resize (debounced 220ms). This prevents drift caused by:
- Viewport size changes
- Lenis horizontal scroll pin affecting effective document height
- Section height variability across devices

```javascript
function resolveZoneBoundaries() {
  const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
  ZONE_STATE.resolvedZones = SCROLL_ZONES.map(zone => {
    const el = document.querySelector(zone.selector);
    if (!el) return { ...zone };
    const top = el.getBoundingClientRect().top + window.scrollY;
    return {
      ...zone,
      scrollStart: Math.max(0, (top - window.innerHeight * 0.6) / maxScroll),
      scrollEnd: Math.max(0, (top + el.offsetHeight - window.innerHeight * 0.2) / maxScroll),
    };
  });
}
```

### Zone Interpolator

`updateScrollZone(scrollProg)` runs every frame in the animation loop. Returns blended zone params by lerping between active zone and next zone over a 0.04 scroll-unit crossfade window (≈1 viewport height at 25 scroll units per page).

### Activation Gate

Zone system activates only after `DIRECTOR_STATE.phase === SCENE_DIRECTOR_STATE.scrollTransition`. This ensures the intro choreography sequence is unaffected. The blend-in ramps over the first 6% of scroll progress past `SHOT_CONFIG.scrollTransitionStart`.

### Render Loop Integration

Zone output feeds three existing update paths in `updateSceneState()`:
1. **Background color** (`scene.background.setRGB`) — lerps toward `bgColor` target
2. **Fog density** (`scene.fog.density`) — lerps toward `fogDensity` target
3. **Light intensities** (`keyLight.intensity`, etc.) — lerps toward `lightRig` targets
4. **Bloom pass** (`bloomPass.strength`, `bloomPass.threshold`) — lerps toward `postFx` targets
5. **Tone mapping exposure** — lerps `exposureBias` additive offset

All lerp at slow rates (0.02–0.05 per frame) to ensure smooth, imperceptible transitions.

---

## Environment Geometry

### Asset Processing Required First

Raw assets at `assets/3dmodels/` are too large for runtime. Must be processed with `@gltf-transform/core` (already in devDependencies) before use:

| Source Asset | Raw Size | Target Size | Processing |
|---|---|---|---|
| `workshop.glb` | 67 MB | ≤4 MB | Decimate to 15K tris, strip unused morph targets |
| `industrial_toolbox.glb` | ~2 MB | ≤500 KB | Decimate, merge materials |
| `tool--box-assy-33.glb` | 126 KB | Ready as-is | No processing needed |

**Processing script:** `scripts/process-environment-assets.mjs` (to be created)

### Deployment in Scene

`workshop.glb` (processed): Background environment mesh placed behind the hero tool composition.
- Position: `(0, -1.2, -4.0)`, slight Y rotation for depth
- Initial opacity: 0 (invisible during hero phases)
- Fade in: opacity 0 → 0.35 as `_zoneT` rises from 0 → 1
- Material: transparent, `depthWrite: false` to avoid z-fighting
- Fog naturally softens the edges — no need for custom fade shader

`industrial_toolbox.glb` (processed): Workbench anchor prop.
- Visible from `scrollProgress > 0.12`, positioned at scene center-low
- Provides spatial anchor for the workshop world as hero tools drift away

`tool--box-assy-33.glb`: Secondary prop, no processing needed.

### Device Tier Guards

| Asset | desktop | mobile | low |
|---|---|---|---|
| `workshop.glb` | ✓ | ✓ | ✗ |
| `industrial_toolbox.glb` | ✓ | ✗ | ✗ |
| `tool--box-assy-33.glb` | ✓ | ✓ | ✗ |

---

## Camera Journey Spline

`THREE.CatmullRomCurve3` path through 7 waypoints. Replaces the existing linear `scrollZ` calculation once `scrollProgress > scrollTransitionStart`.

**Amplitude (subtle/content-first mode):** ±0.3z, ±0.15x, ±0.08y

Waypoints (to be tuned empirically after implementation):
```
scrollProgress → camera (x, y, z)
0.00 → (-0.34, 0.00, 5.82)  hero interactive-idle
0.12 → (-0.30, 0.00, 6.10)  scroll-transition start
0.28 → (-0.22, 0.05, 5.94)  services
0.46 → (-0.28, 0.02, 5.88)  process
0.62 → (-0.20, -0.03, 6.02) gallery
0.76 → (-0.26, 0.04, 5.96)  about
1.00 → (-0.24, 0.02, 5.90)  contact
```

Camera lerps toward spline position at 0.04/frame rate — no snapping.

**Blend-in:** Spline weight ramps from 0 → 1 over first 8% of scroll past `scrollTransitionStart` to prevent camera jump from existing dolly logic.

**Reduced motion:** `initCameraJourneyCurve()` is skipped. Existing linear camera dolly takes over.

---

## Per-Zone Particle Stories

New `SCROLL_ZONE_PARTICLE_STORIES` constant maps zone IDs to particle parameter overrides. These override the existing `scrollTransition` particle story as scroll deepens.

| Zone | Story ID | wrenchAttractor | hazeScale | sparkGate | Feel |
|------|----------|----------------|-----------|-----------|------|
| hero | `hero-orbit` | 0.72 | 1.00 | 1.00 | Full orbit |
| services | `services-drift` | 0.20 | 0.48 | 0.20 | Quiet background drift |
| process | `dust-drift` | 0.28 | 0.64 | 0.30 | Workshop dust in light |
| gallery | `ember-scatter` | 0.16 | 0.22 | 0.50 | Dark, minimal scatter |
| about | `ember-low` | 0.34 | 0.52 | 0.36 | Warm settle |
| contact | `ember-invitation` | 0.42 | 0.72 | 0.44 | Warm invitation |

Zone story lerps into the phase `storyPreset` — not a hard replacement. The existing story provides base values; zone story provides the target.

**Low-tier guard:** Particle story overrides skip on `quality === 'low'`.

---

## Site-Layer Zone Driver (`src/site/index.js`)

`initScrollZoneDriver()` function handles the HTML side of zone detection:

1. Measures `[data-scene-zone]` element DOM rects at init and on resize
2. On each Lenis scroll event: determines active zone (section whose top is below viewport midpoint)
3. On zone change:
   - Dispatches `scene:zone-change` CustomEvent (for 3D scene supplementary hints)
   - Sets `document.body.dataset.sceneZone = zoneId` (for CSS zone targeting)

**Guard:** `if (prefersReducedMotion) return`

---

## HTML Data Attributes

Add `data-scene-zone` to each section in `index.html`:

```html
<section id="services" data-scene-zone="services">
<section class="rhetoric-section" data-scene-zone="rhetoric">
<section id="process" data-scene-zone="process">
<section id="gallery" data-scene-zone="gallery">
<section id="about" data-scene-zone="about">
<section class="testimonials" data-scene-zone="testimonials">
<section id="contact" data-scene-zone="contact">
```

---

## CSS Zone Tokens

Add zone-scoped custom properties after `:root` block in `styles.css`:

```css
[data-scene-zone="services"]    { --zone-bg-r: 10; --zone-bg-g: 11; --zone-bg-b: 14; }
[data-scene-zone="rhetoric"]    { --zone-bg-r: 12; --zone-bg-g: 10; --zone-bg-b: 10; }
[data-scene-zone="process"]     { --zone-bg-r: 13; --zone-bg-g: 11; --zone-bg-b: 9;  }
[data-scene-zone="gallery"]     { --zone-bg-r: 8;  --zone-bg-g: 8;  --zone-bg-b: 9;  }
[data-scene-zone="about"]       { --zone-bg-r: 13; --zone-bg-g: 11; --zone-bg-b: 10; }
[data-scene-zone="contact"]     { --zone-bg-r: 14; --zone-bg-g: 12; --zone-bg-b: 9;  }
```

These are consumed by `body.dataset.sceneZone` CSS targeting and `background-color` breathing.

---

## Diagnostics

Extend `window.__sceneDiagnostics()` with:
```javascript
zoneState: {
  activeId: string,
  nextId: string | null,
  blendProgress: number,   // 0–1
  zoneCount: number,       // should be 6 after resolve
}
```

---

## Acceptance Criteria

- [ ] Scrolling from hero to contact: background color shifts noticeably but not jarringly through 6 zones
- [ ] `body.dataset.sceneZone` updates to match active section within one scroll step
- [ ] Workshop environment mesh visible at 30–40% opacity once past hero
- [ ] Camera position drifts imperceptibly between zones — no jump or snap
- [ ] `particleCue` in diagnostics changes as user scrolls through zones
- [ ] Hero intro choreography unaffected (zone system inactive at `scrollProgress < 0.12`)
- [ ] `prefers-reduced-motion`: zone driver skips, camera stays on existing linear dolly, env assets still load
- [ ] Low-end devices: environment geometry not loaded, no degradation
- [ ] Existing Playwright tests pass without regression

---

## Implementation Order

See `docs/plans/2026-03-15-workshop-journey-implementation.md` for session-by-session plan.
