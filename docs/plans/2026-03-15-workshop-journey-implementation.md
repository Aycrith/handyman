# Workshop Journey — Implementation Plan

**Date:** 2026-03-15
**Branch:** `feat/workshop-journey`
**PRD:** `docs/landing-page-rebuild/prds/13-workshop-journey.md`
**Status:** ✅ COMPLETE — All phases A–F implemented 2026-03-15. Canvas visibility fix (E★) applied.

---

## Implementation Checklist (All Complete)

- [x] Branch `feat/workshop-journey` created and active
- [x] `src/site/index.js` has `cinematicSweep`, `precisionStagger`, `sectionFold`, `motionMode`
- [x] `src/scene/index.js` has `scrollHandoffMix` and `externalSectionTransition` wired
- [x] All 9 sessions executed (Phases A–F)
- [x] Canvas visibility fix applied (E★) — section backgrounds made transparent
- [x] `npm run build` passes cleanly (~907ms, no errors)

---

## Session 1 — Phase A: Motion Grammar Cleanup

**File:** `src/site/index.js`
**Goal:** Eliminate all remaining raw `opacity/y` tweens in section-level initX functions

### Functions to Refactor

**`initServiceCards()`** — currently: raw `gsap.to(cards, { opacity, y })`
Refactor to:
```javascript
ScrollTrigger.create({
  trigger: '.services__grid', start: 'top 82%', once: true,
  onEnter() {
    precisionStagger($$('.service-card'), { y: 40, scale: 0.97, stagger: 0.08, duration: 0.75 });
  },
});
```

**`initTestimonials()`** — same pattern with `.testimonial` elements, `.testimonials__grid` trigger

**`initProcessSteps()`** — same pattern with `.process-step` elements. Keep existing connector `scaleX` sub-animation as follow-up inside the same `onEnter`.

**`initGallery()`** — `precisionStagger($$('.gallery__item'), { y: 28, scale: 0.98, stagger: 0.06, duration: 0.60 })`

**`initPillars()`** — `precisionStagger($$('.pillar'), { y: 30, stagger: 0.08, duration: 0.65 })`

**`initRhetoricalSection()`** — add `sectionFold()` on `.rhetoric-inner` container entry. Keep existing blur/opacity on statement lines (they are the section identity).

### Verification
- No heading or card animates via `opacity: 0` as primary invisibility
- All section titles use overflow-mask (existing `initSplitTextReveals` handles this)
- Run `node tests/validate-sections.js` — all section visibility assertions pass

---

## Session 2 — Phase B: HTML + CSS Zone Tokens

**Files:** `index.html`, `styles.css`

### index.html Changes
Add `data-scene-zone` attribute to 7 section elements. Do not change existing IDs, classes, or structure. Pure attribute addition.

```
#services          → add data-scene-zone="services"
.rhetoric-section  → add data-scene-zone="rhetoric"
#process           → add data-scene-zone="process"
#gallery           → add data-scene-zone="gallery"
#about             → add data-scene-zone="about"
.testimonials      → add data-scene-zone="testimonials"
#contact           → add data-scene-zone="contact"
```

### styles.css Changes
Add zone CSS property blocks immediately after the existing `:root { }` token block:

```css
/* ── Zone Identity Tokens ──────────────────────────── */
[data-scene-zone="services"]    { --zone-bg-r: 10; --zone-bg-g: 11; --zone-bg-b: 14; }
[data-scene-zone="rhetoric"]    { --zone-bg-r: 12; --zone-bg-g: 10; --zone-bg-b: 10; }
[data-scene-zone="process"]     { --zone-bg-r: 13; --zone-bg-g: 11; --zone-bg-b: 9;  }
[data-scene-zone="gallery"]     { --zone-bg-r: 8;  --zone-bg-g: 8;  --zone-bg-b: 9;  }
[data-scene-zone="about"]       { --zone-bg-r: 13; --zone-bg-g: 11; --zone-bg-b: 10; }
[data-scene-zone="contact"]     { --zone-bg-r: 14; --zone-bg-g: 12; --zone-bg-b: 9;  }
```

### Verification
- Open in browser, inspect `[data-scene-zone]` elements in DevTools — confirm CSS vars are scoped
- No visual change yet (these are data attributes only at this stage)

---

## Session 3 — Phase C1/C2: SCROLL_ZONES + Zone State

**File:** `src/scene/index.js`

### Add SCROLL_ZONES Constant
Insert after `DIRECTOR_PHASE_TO_PRESET` declaration (~line 258). See PRD 13 for full data values.

Six zone objects: `hero`, `services`, `process`, `gallery`, `about`, `contact`.

### Add Module-Level State Vars
Insert near line 1540 with other state variable declarations:
```javascript
const _zoneLightTarget = { key: 1.40, fill: 0.72, rim: 1.00, ground: 0.98 };
const _zoneBgTarget = { r: 0.007, g: 0.009, b: 0.012 };
let _zoneFogTarget = 0.011;
let _zoneExposureTarget = 0.0;
let _zoneActive = false;
let _zoneT = 0;
let _workshopEnv = null;
let zoneResizeTimer = null;

const ZONE_STATE = {
  activeId: 'hero',
  nextId: null,
  blendProgress: 0,
  resolvedZones: [],
};
```

### Add resolveZoneBoundaries()
Insert in scene initialization section (~line 1777, after `const scene = new THREE.Scene()`). See PRD 13 for full implementation. Call at init and wire to resize event (debounced 220ms).

### Verification
- `console.log(ZONE_STATE.resolvedZones)` in browser console — should show 6 zones with DOM-computed `scrollStart`/`scrollEnd`
- Resize window — zones should recompute

---

## Session 4 — Phase C3/C4: Zone Interpolator + Render Loop Wiring

**File:** `src/scene/index.js`

### Add updateScrollZone() Function
Add alongside other scene update functions. Runs per-frame, returns blended zone params. See PRD 13 for full logic.

Key behavior:
- Finds active zone by `scrollStart <= scrollProg`
- Cross-fades over 0.04 scroll units at zone boundary
- Returns lerped `lightRig`, `postFx`, `bgColor`, `fogDensity`, `exposureBias`

### Wire into updateSceneState()
In `updateSceneState()` (~line 8642), after existing phase preset fetch:
- Gate on `phase === scrollTransition`
- Compute `_zoneT = clamp01((scrollProgress - scrollTransitionStart) / 0.06)`
- Set `_zone*Target` vars from `updateScrollZone()` return value
- Set `_zoneActive = true`

### Wire into Render Loop
In background/fog/light update paths (~line 9800):
```javascript
// Background color
const heroBgR = existing_hero_bg_calculation;
const finalBgR = _zoneActive ? lerp(heroBgR, _zoneBgTarget.r, _zoneT) : heroBgR;
scene.background.setRGB(finalBgR, finalBgG, finalBgB);

// Fog density — same lerp pattern
// Key/fill/rim lights — same lerp pattern toward _zoneLightTarget
// Bloom strength — same lerp toward postFx targets
```

### Verification
- Scroll past hero: background should shift subtly toward cooler blue (services zone)
- Continue scrolling: near-black at gallery (~46–62%), warm at contact
- `window.__sceneDiagnostics().zoneState.activeId` should update on scroll

---

## Session 5 — Phase C5: Workshop Environment Geometry

**File:** `src/scene/index.js`
**Pre-req:** Process `workshop.glb` and `industrial_toolbox.glb` with gltf-transform script

### Process Assets First
Run (or create) `scripts/process-environment-assets.mjs`:
```bash
node scripts/process-environment-assets.mjs
# Output: assets/models/environment/workshop-optimized.glb (≤4 MB)
#         assets/models/environment/toolbox-optimized.glb (≤500 KB)
```

If script doesn't exist, create it using `@gltf-transform/core` simplify + dedup + prune pipeline.

### Load workshop-optimized.glb
After hero tools finish loading (or in a separate non-blocking load):
```javascript
if (quality !== 'low') {
  gltfLoader.load('assets/models/environment/workshop-optimized.glb', (gltf) => {
    _workshopEnv = gltf.scene;
    _workshopEnv.scale.setScalar(0.8);
    _workshopEnv.position.set(0, -1.2, -4.0);
    _workshopEnv.rotation.y = Math.PI * 0.1;
    _workshopEnv.traverse(child => {
      if (child.isMesh) {
        child.material.transparent = true;
        child.material.opacity = 0;
        child.material.depthWrite = false;
      }
    });
    scene.add(_workshopEnv);
  });
}
```

In render loop, update workshop env opacity:
```javascript
if (_workshopEnv) {
  const targetOpacity = _zoneActive ? 0.35 * _zoneT : 0;
  _workshopEnv.traverse(child => {
    if (child.isMesh) child.material.opacity += (targetOpacity - child.material.opacity) * 0.04;
  });
}
```

Mobile: skip `industrial_toolbox.glb`, still load workshop for environment.

### Verification
- Scroll past hero: faint workshop structure visible in background
- Does not obscure hero tools at scrollProgress 0 (opacity 0 during hero phase)
- No z-fighting or depth artifacts

---

## Session 6 — Phase C6: Camera Journey Spline

**File:** `src/scene/index.js`

### Add CAMERA_JOURNEY_WAYPOINTS + initCameraJourneyCurve()
Constants and initialization function. See PRD 13 for waypoints.

Call `initCameraJourneyCurve()` after scene init. Skip if `prefersReducedMotion`.

### Wire into Camera Update
In camera position update (~line 9767), when `scrollProgress > scrollTransitionStart`:

```javascript
if (!prefersReducedMotion && _cameraJourneyCurve) {
  const splineWeight = clamp01((scrollProgress - SHOT_CONFIG.scrollTransitionStart) / 0.08);
  const journeyPos = getCameraJourneyPosition(scrollProgress);
  if (journeyPos && splineWeight > 0) {
    const lerpRate = 0.04 * splineWeight;
    camera.position.x += (journeyPos.x - camera.position.x) * lerpRate;
    camera.position.y += (journeyPos.y - camera.position.y) * lerpRate;
    // z handled by existing scrollZ calculation blended with spline
    const splineZ = journeyPos.z;
    const linearZ = shotPreset.z + scrollHandoffMix * 2.4;
    scrollZ = lerp(linearZ, splineZ, splineWeight);
  }
}
```

### Tuning Session
After wiring: scroll through page and adjust waypoints empirically. The camera movement should be barely noticeable — the environment change should be more prominent than camera movement.

---

## Session 7 — Phase D: Site-Layer Zone Driver

**File:** `src/site/index.js`

### Add initScrollZoneDriver()
New function, wired into `initAll()` at the end:

```javascript
function initScrollZoneDriver() {
  if (prefersReducedMotion) return;
  const zoneEls = Array.from($$('[data-scene-zone]')).map(el => ({
    id: el.dataset.sceneZone, el, top: 0
  }));
  if (!zoneEls.length) return;

  let lastZone = null;
  let resizeTimer = null;

  function measure() {
    zoneEls.forEach(z => { z.top = z.el.getBoundingClientRect().top + window.scrollY; });
  }

  function onScroll() {
    const mid = window.scrollY + window.innerHeight * 0.4;
    let active = zoneEls[0];
    for (const z of zoneEls) { if (mid >= z.top) active = z; }
    if (active.id !== lastZone) {
      lastZone = active.id;
      document.body.dataset.sceneZone = active.id;
      window.dispatchEvent(new CustomEvent('scene:zone-change', { detail: { zoneId: active.id } }));
    }
  }

  measure();
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(measure, 200);
  });
  lenis ? lenis.on('scroll', onScroll) : window.addEventListener('scroll', onScroll, { passive: true });
}
```

Also add `scene:zone-change` listener in `src/scene/index.js` (~line 1766) for supplementary debug hints.

### Verification
- Open DevTools, scroll page — `document.body.dataset.sceneZone` updates
- Dispatched events visible in console if `window.addEventListener('scene:zone-change', console.log)`

---

## Session 8 — Phase E: Per-Zone Particle Stories

**File:** `src/scene/index.js`

### Add SCROLL_ZONE_PARTICLE_STORIES Constant
After existing `ACTIVE_PARTICLE_STORY` block. See PRD 13 for full table.

### Wire into updateSceneState()
After `let storyPreset = getParticleStoryPreset()` (change `const` → `let`):
```javascript
if (_zoneActive && ZONE_STATE.resolvedZones.length && quality !== 'low') {
  const activeZone = ZONE_STATE.resolvedZones.find(z => z.id === ZONE_STATE.activeId);
  const zoneStory = activeZone && SCROLL_ZONE_PARTICLE_STORIES[activeZone.particleStory];
  if (zoneStory) {
    Object.keys(zoneStory).forEach(key => {
      if (typeof storyPreset[key] === 'number' && typeof zoneStory[key] === 'number') {
        storyPreset = { ...storyPreset, [key]: THREE.MathUtils.lerp(storyPreset[key], zoneStory[key], _zoneT) };
      }
    });
  }
}
```

### Verification
- `window.__sceneDiagnostics().particleCue` changes as you scroll through zones
- Particles visibly calm down below the hero fold (wrenchAttractor 0.72 → 0.20 in services)

---

## Session 9 — Phase F: Diagnostics + Tests

**Files:** `src/scene/index.js`, `tests/validate-zones.js`

### Extend __sceneDiagnostics()
Add to the diagnostics return object:
```javascript
zoneState: {
  activeId: ZONE_STATE.activeId,
  nextId: ZONE_STATE.nextId,
  blendProgress: Number(ZONE_STATE.blendProgress.toFixed(3)),
  zoneCount: ZONE_STATE.resolvedZones.length,
},
```

### Create tests/validate-zones.js
Six Playwright assertions:
1. `scrollProgress=0`: `zoneState.activeId === 'hero'`
2. Scroll to `#services`: `body.dataset.sceneZone === 'services'` within 500ms
3. Background color RGB differs between hero and services zones (sample and compare)
4. Camera position changes smoothly over 10 scroll steps — no delta > 0.5 units
5. `particleCue` label in diagnostics differs between hero and gallery zones
6. With `prefers-reduced-motion`: zone driver skips, `body.dataset.sceneZone` never set

### Run Full Test Suite
```bash
node tests/run-all.js
```
All existing tests must pass. New zone tests must pass.

---

## Environment Asset Processing Script

Create `scripts/process-environment-assets.mjs` using `@gltf-transform/core`:

```javascript
import { NodeIO } from '@gltf-transform/core';
import { dedup, prune, simplify } from '@gltf-transform/functions';
import { MeshoptSimplifier } from 'meshopt-decoder';

const io = new NodeIO();
const doc = await io.read('assets/3dmodels/workshop.glb');
await doc.transform(
  dedup(),
  prune(),
  simplify({ simplifier: MeshoptSimplifier, ratio: 0.05, error: 0.001 }),
);
await io.write('assets/models/environment/workshop-optimized.glb', doc);
```

Target: ≤4 MB output. Adjust `ratio` until size target met with acceptable visual quality.

---

## Key Files Summary

| File | Changes |
|---|---|
| `src/scene/index.js` | +SCROLL_ZONES, +ZONE_STATE, +resolveZoneBoundaries, +updateScrollZone, +_zone* state vars, +workshop env loading, +camera spline, +particle story overrides, +diagnostics extension |
| `src/site/index.js` | Refactor 5 initX functions + add initScrollZoneDriver |
| `index.html` | Add data-scene-zone to 7 sections |
| `styles.css` | Add zone CSS property blocks |
| `tests/validate-zones.js` | New (6 zone assertions) |
| `scripts/process-environment-assets.mjs` | New (gltf-transform processing pipeline) |
| `assets/models/environment/` | New directory for processed environment GLBs |

---

## Reduced Motion + Device Guard Summary

| Feature | prefers-reduced-motion | quality=low | mobile |
|---|---|---|---|
| Camera spline | Skip (linear dolly only) | N/A | Run (subtle enough) |
| Zone env shifts (light/fog/bloom) | Run (not motion) | Run at reduced delta | Run |
| Zone particle stories | Run | Skip override | Run |
| Workshop env geometry | Run | Skip | workshop.glb only |
| Site zone driver | Skip entirely | N/A | Run |
| Zone CSS vars | Run | Run | Run |
