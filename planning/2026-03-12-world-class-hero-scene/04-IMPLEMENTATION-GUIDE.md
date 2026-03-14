# Implementation Guide for Coding Agents

## Objective
Upgrade the current hero in `src/scene/index.js` from a premium interactive background to a world-class cinematic hero experience without sacrificing readability, resilience, or responsive performance.

## Current Stabilization Note (2026-03-14)
- Tasks 1 through 4 now have a working baseline in the current branch and are covered by automated validation.
- The current milestone is not a new feature pass. It is a stabilization pass:
  - preserve the existing scene-director phases and diagnostics contract
  - keep the manifest-backed bespoke hero asset pack and pipeline as the source of truth
  - clean generated artifacts from the tracked diff
  - document the shipped baseline before deeper Phase 2 or Phase 3 work resumes
- The shipped hero baseline for this milestone is:
  - `assetSetVersion: hero-pack-v5`
  - `contractVersion: hero-asset-contract-v4`
  - `buildStage: assembly-orbit-bespoke-pack`
  - `materialProfile: precisionWorkshopBespoke`
- Canonical tracked evidence lives in `tests/evidence-desktop/`.
- Ad hoc captures in `artifacts/` and root-level `debug-*.png` files should be treated as generated output.
- Validation commands for this milestone:
  - `npm run build`
  - `npm run preview`
  - `npm run verify:hero-assets`
  - `npm test`

## Runtime Modernization Update (2026-03-14)
- The runtime is now Vite + ESM rather than CDN globals in `index.html`.
- Current integration points:
  - `src/main.js`
  - `src/runtime-globals.js`
  - `src/site/index.js`
  - `src/scene/index.js`
- Compatibility globals are intentionally preserved for validation and orchestration:
  - `window.__sceneDiagnostics`
  - `window.__setSceneDirectorPhaseForTest`
  - `window.__openToolPanelForTest`
  - `window.__captureSceneSnapshot`
  - `window.__sceneAssetsReady`
- Runtime commands now include:
  - `npm run dev`
  - `npm run build`
  - `npm run preview`

## Working constraints
- Current runtime is Vite + ESM while keeping the existing Three.js runtime level.
- Main scene logic is contained in `src/scene/index.js`.
- Scroll choreography is coordinated in `src/site/index.js`.
- Dependency wiring for the migrated global surface lives in `src/runtime-globals.js`.
- Readability and hero-layer UI are handled jointly by `src/scene/index.js`, `src/site/index.js`, and `styles.css`.
- Existing code already supports quality tiers and reduced-motion behavior; preserve and extend this rather than replacing it.

## Recommended execution sequence

### Task 1 - Recompose the hero frame
**Primary File**: `src/scene/index.js`
**Supporting File**: `styles.css`

**Changes Required**
1. Identify and consolidate the dominant hero prop.
2. Adjust tool base positions, group positions, and idle amplitudes so the composition forms a clear focal hierarchy.
3. Reduce competing light and particle density behind the copy corridor.
4. Keep the hero readable in both static and animated states.

**Acceptance Criteria**
- [ ] One clear hero object read exists in the opening frame.
- [ ] Headline remains dominant.

**Verification**
- Manual screenshot review at desktop width.

---

### Task 2 - Strengthen lighting and shadow coherence
**Primary File**: `src/scene/index.js`

**Changes Required**
1. Keep current RectAreaLight key/fill/rim philosophy.
2. Add or refine a shadow-casting light dedicated to hero grounding.
3. Add soft contact shadow logic under the main props.
4. Re-tune floor reflectivity so it supports the scene rather than flattening it.
5. Tie reactive lights to hero states with subtler falloff and more deliberate maxima.

**Acceptance Criteria**
- [ ] Props feel grounded.
- [ ] Light motivation reads clearly.
- [ ] Release pulses remain dramatic without clipping.

**Verification**
- Inspect hero object edges, floor contact, and shadow shape in stills.

---

### Task 3 - Replace initialization feel with an authored intro sequence
**Primary Files**: `src/scene/index.js`, `src/site/index.js`

**Changes Required**
1. Preserve and refine explicit scene phases:
   - `pre-reveal`
   - `reveal`
   - `lockup`
   - `interactive-idle`
2. Time the hero copy reveal against scene energy peaks.
3. Reduce random-feeling activity before the lockup moment.
4. Ease into interactivity after the reveal rather than exposing all behaviors immediately.

**Acceptance Criteria**
- [ ] The first 2.5 seconds feel cinematic and deliberate.
- [ ] The scene settles into a premium idle state after the reveal.

**Verification**
- Manual review of page load sequence.

---

### Task 4 - Upgrade camera behavior into shot design
**Primary File**: `src/scene/index.js`

**Changes Required**
1. Convert the current reactive camera into a small state machine with per-state motion rules.
2. Add a restrained dolly-in or lens push during reveal.
3. Reduce idle camera drift after lockup.
4. Reserve micro-shake or trauma for high-energy moments only.
5. Keep scroll handoff elegant and readable.

**Acceptance Criteria**
- [ ] Camera no longer feels like a pointer-driven utility.
- [ ] Camera movement contributes to story beats.

---

### Task 5 - Unify asset and material quality
**Primary Files**: `src/scene/index.js`, `assets/models/hero/*`, optionally `assets/textures/*`

**Changes Required**
1. Audit all visible tools for silhouette quality, bevel richness, and material coherence.
2. Keep the current manifest-backed pack stable unless a later phase explicitly changes that contract.
   - Current baseline: `hero-pack-v5` on `hero-asset-contract-v4`
   - If provenance or shipping semantics change again, introduce a new explicit contract/manifest version rather than overloading the current one.
3. Improve materials with:
   - roughness variation
   - differentiated metal/wood/rubber response
   - restrained emissive use
4. Remove any prop treatment that lowers the overall hero standard.

**Acceptance Criteria**
- [ ] All props feel like one curated art direction.
- [ ] No object looks noticeably cheaper than the others.

---

### Task 6 - Transform particles into environmental storytelling
**Primary File**: `src/scene/index.js`

**Changes Required**
1. Keep the current species architecture.
2. Reassign species roles:
   - hero framing ribbons
   - ambient depth motes
   - edge sparkle micro-dust
   - punctuation sparks
3. Increase obstacle-aware behavior around hero props.
4. Add stronger moment-based clustering, dispersal, and trails.
5. Reduce background busyness when the copy or hero object needs priority.

**Acceptance Criteria**
- [ ] Particles feel alive and purposeful.
- [ ] Motion supports focal hierarchy instead of flattening it.

---

### Task 7 - Expand post-processing with discipline
**Primary File**: `src/scene/index.js`

**Changes Required**
1. Keep bloom, but narrow its visual role.
2. Add only the highest-value additional passes for the current architecture:
   - subtle depth of field during intro/hold states
   - mild chromatic aberration during release pulses only
   - refined grading pass or controlled color transform
3. Gate all additional passes by quality tier.
4. Measure the cost of each addition before stacking another.

**Acceptance Criteria**
- [ ] The post stack enhances realism and cinematic feel without haze or mush.
- [ ] Readability remains intact.

---

### Task 8 - Make interactions purposeful
**Primary Files**: `src/scene/index.js`, `src/site/index.js`

**Changes Required**
1. Simplify interaction semantics:
   - hover = awaken material/specular detail
   - drag = local environmental disturbance
   - click = premium energy pulse
   - scroll = hero narrative transition
2. Remove or reduce behaviors that do not read clearly.
3. Tie one subtle scene response to CTA focus/hover for brand cohesion.

**Acceptance Criteria**
- [ ] Interactions feel premium and meaningful.
- [ ] The scene never becomes noisy or toy-like.

---

## Optional runtime additions
If implementation resumes on the current Vite architecture, add passes conservatively through ESM imports from `three/examples/jsm` or local lightweight shader utilities. Candidate additions:
- `BokehPass` for intro-only depth of field
- `AfterimagePass` only if very restrained and only for high-energy pulses
- a lightweight `ShaderPass` for chromatic aberration or grading

Avoid adding multiple expensive fullscreen passes before profiling.

## Suggested internal constants to add in `src/scene/index.js`
- `SCENE_DIRECTOR_STATE`
- `SHOT_CONFIG`
- `LIGHT_RIG_PRESETS`
- `POST_FX_PRESETS`
- `PARTICLE_ROLE_WEIGHTS`
- `QUALITY_BUDGETS`

These should separate art-direction tuning from simulation code.

## Validation checklist
- [ ] Hero remains readable behind copy
- [ ] One dominant hero object read exists
- [ ] Lighting has clear shadow grounding
- [ ] Intro sequence feels authored
- [ ] Idle state feels controlled and premium
- [ ] Interactions are legible and brand-aligned
- [ ] Mobile/low/reduced-motion modes still feel intentional
- [ ] No errors in `src/scene/index.js`, `src/site/index.js`, `src/main.js`, `index.html`, or `styles.css`

## Final note for implementers
The biggest quality gain will come from editing and directing the experience, not from endlessly adding more simulation. Treat every frame like a poster frame and every interaction like a narrative beat.
