# PRD 01 — 3D Scene Art Direction & Redesign

**Status:** Planning
**Priority:** P0 (parallel with site work, extends existing roadmap)
**Files:** `src/scene/index.js`
**Depends on:** Existing hero roadmap `planning/2026-03-12-world-class-hero-scene/03-ROADMAP.md`

---

## Objective

Complete the existing hero roadmap Phase 3 items (particle storytelling, DoF, purposeful interactions) and extend with shader-level finishing. The hero scene must read as a cinematic product reveal in the first 3 seconds. Particles must have storytelling roles. Interactions must feel precise and authored.

---

## Current State

- Phase 0 (quality-tier detection) ✓ Shipped
- Phase 1 (bespoke GLB pack, director phases) ✓ Shipped
- Phase 2 (EffectComposer: bloom + copy) ✓ Shipped
- Phase 3 (particle transformation, DoF, purposeful interactions) ✗ **Pending**
- Phase 4 (Three.js upgrade) ✗ Deferred

### Existing EffectComposer Chain

```
RenderPass → UnrealBloomPass → CopyShader (renderToScreen)
```

Gate: `CAN_RUN_DESKTOP_POST` (desktop quality tier only)

### Director Phases (Current)

```
static-layout → pre-reveal (520ms) → reveal (960ms) → lockup (940ms) → interactive-idle → scroll-transition
```

---

## Target State

### Scene Quality

- First 3 seconds: staged cinematic sequence (dark → atmospheric → tool reveal)
- `pre-reveal` phase: atmospheric depth, subtle DoF, strong vignette
- `reveal` phase: tool materializes with particle convergence
- `lockup` phase: pin-sharp tool, no DoF, interactive-idle sway
- `scroll-transition` phase: camera dolly + particle divergence before fold-away

### Particle Storytelling Roles

| Species | Story Role |
|---------|-----------|
| `cloudMote` | Ambient workshop dust — always present, density varies by phase |
| `microDust` | Fine particulate — intensifies during `pre-reveal`, settles in `lockup` |
| `sparkFilament` | Tool energy — brief sparks during `reveal` transition |
| `flowRibbon` | Cinematic sweep paths — visible only in `pre-reveal`, dissolve in `reveal` |

### Interaction System

- **Hover on tool:** Local particle attraction toward cursor (gentle field)
- **Drag (pointer down + move):** Particle wake — trailing disturbance proportional to drag speed
- **CTA hover:** Fires `hero:cta-wake` → amber bloom pulse in scene
- **CTA click:** `hero:magic-pulse` → chromatic aberration burst (1 frame) + amber bloom spike

---

## Technical Requirements

### Phase 3.1 — Particle Storytelling

```js
// In src/scene/index.js, particle update loop:
// Phase-aware density multipliers
const PHASE_PARTICLE_MULTIPLIERS = {
  'pre-reveal': { cloudMote: 1.4, microDust: 1.8, sparkFilament: 0, flowRibbon: 1.0 },
  'reveal':     { cloudMote: 1.0, microDust: 0.6, sparkFilament: 1.0, flowRibbon: 0.3 },
  'lockup':     { cloudMote: 0.7, microDust: 0.4, sparkFilament: 0.1, flowRibbon: 0 },
  'interactive-idle': { cloudMote: 0.7, microDust: 0.4, sparkFilament: 0, flowRibbon: 0 },
  'scroll-transition': { cloudMote: 1.2, microDust: 1.0, sparkFilament: 0, flowRibbon: 0 }
};
```

### Phase 3.2 — Post-Processing Expansion

Add to EffectComposer chain (desktop tier only):

```
RenderPass → BokehPass (DoF) → UnrealBloomPass → ChromaticAberrationPass → GrainPass → GradePass → CopyShader
```

| Pass | Phase Gates | Parameters |
|------|------------|-----------|
| `BokehPass` | Active: pre-reveal, reveal. Off: lockup, idle | focus: 5.0, aperture: 0.025, maxblur: 0.01 |
| `ChromaticAberrationPass` | Fires only on `hero:magic-pulse` | strength: 0 normally, burst to 0.006 for 16ms |
| `GrainPass` | Always active (desktop only) | strength: 0.035, animated uTime uniform |
| `GradePass` | Always active (desktop only) | Phase-specific toe/shoulder uniforms |

### Phase 3.3 — Purposeful Interactions

```js
// Drag wake: pointer velocity → particle field disturbance
// Throttle to 1 update per RAF frame
let lastPointer = { x: 0, y: 0 };
renderer.domElement.addEventListener('pointermove', (e) => {
  const dx = e.clientX - lastPointer.x;
  const dy = e.clientY - lastPointer.y;
  const speed = Math.sqrt(dx*dx + dy*dy);
  dispatchDragWake(speed); // updates particle force field
  lastPointer = { x: e.clientX, y: e.clientY };
});
```

---

## Acceptance Criteria

- [ ] Director phase sequence feels staged in first 3 seconds (not just a reveal)
- [ ] Particles have distinct density per phase (visually perceptible change)
- [ ] `sparkFilament` fires and dissolves during `reveal` transition
- [ ] `flowRibbon` is visible in `pre-reveal`, fully gone in `lockup`
- [ ] DoF: noticeable depth blurring in `pre-reveal`, absent in `lockup`
- [ ] `hero:magic-pulse` triggers chromatic aberration burst (barely perceptible — premium not gimmick)
- [ ] Drag wake: particle disturbance proportional to drag speed
- [ ] Frame budget: ≤16.7ms desktop, ≤22ms mobile
- [ ] All new passes gated behind `CAN_RUN_DESKTOP_POST`
- [ ] Mobile/low tier: no regression (existing bloom-off behavior preserved)
