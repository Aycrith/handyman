# PRD 01 — 3D Scene Art Direction & Redesign

**Amendment 8:** Verify `renderer.domElement.style.pointerEvents === 'none'`

## Objective

Complete Phase 3 hero roadmap items and extend with shader-level finishing. Scene reads as cinematic product reveal in first 3 seconds.

## Current State

Phase 0/1/2 shipped (director phases, quality-tier system, bespoke GLB pack). Phase 3 pending:
- 3.1 Particle storytelling — particles have narrative roles per director phase
- 3.2 Post-processing expansion — DoF, chromatic aberration
- 3.3 Purposeful interactions — hover states with authored feedback

## Canvas Pointer-Events Verification (Amendment 8)

```js
// In src/scene/index.js, after renderer setup:
renderer.domElement.style.pointerEvents = 'none';
// Also verify: UI interactive elements have pointer-events: auto
// The canvas must NOT capture pointer events — interaction layer is DOM only
```

Check that `#ui-interactive` layer (hero CTAs, scroll cue) has `pointer-events: auto` in CSS.

## Phase 3 Implementation

### 3.1 Particle Storytelling
- `pre-reveal`: particles scattered, low energy
- `reveal`: particles converge toward tools (choreography beat)
- `lockup`: particles settle into stable ambient orbit
- `interactive-idle`: particles respond to cursor proximity (already started)
- `scroll-transition`: particles disperse as hero exits viewport

### 3.2 Post-Processing Expansion (D1)
- Selective DoF: active during `pre-reveal` and `reveal` only
- Chromatic aberration: single burst on CTA click (1 frame)
- Vignette: state-aware (stronger in pre-reveal, removed in lockup)
- All conditional on quality tier ≥ desktop

### 3.3 Purposeful Interactions
- Tool hover: subtle material brightening (emissive bump)
- Drag: particle wake trails behind tool
- Click: `hero:magic-pulse` (already implemented) triggers particle burst

## Asset Notes

Per `00b-asset-inventory.md`:
- Hero pack v5 (claw-hammer, pipe-wrench, handsaw) — keep, verified SHA256
- `tool--box-assy-33.glb` (126KB) — optional scene prop in services section
- No other 3dmodels assets added to production pipeline this phase

## Acceptance

- Director phase screenshots match reference quality bar
- Frame budget: ≤16.7ms desktop, ≤22ms mobile
- `renderer.domElement.style.pointerEvents === 'none'` confirmed
- First 3 seconds staged — tool reveal has weight and ceremony
