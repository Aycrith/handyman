# World-Class 3D Hero Scene - Roadmap Plan

## Vision
Create a hero that feels like a cinematic product reveal for craftsmanship itself: physically grounded, emotionally legible, visually unforgettable, and performant across responsive tiers.

## Strategic Principle
Do not add effects indiscriminately. Replace lower-value complexity with higher-value authorship.

## Delivery Model
- **Phase 0**: quick wins with immediate visual payoff
- **Phase 1**: cinematic foundation
- **Phase 2**: hero-grade materials, geometry, and environmental storytelling
- **Phase 3**: advanced finishing and signature interactions
- **Phase 4**: later Three.js library upgrade and compatibility work

## Status Update (2026-03-14)
- The current branch already lands the Phase 0/1 baseline and the early Vite/ESM modernization.
- Implemented in the current milestone:
  - manifest-backed external three-tool hero pack with deterministic verification
  - authored scene phases for `pre-reveal`, `reveal`, `lockup`, `interactive-idle`, and `scroll-transition`
  - wrench-first composition with support props kept subordinate or hidden where the layout gates require it
  - stronger grounding/shadow treatment, bloom-first grading discipline, and a designed scroll handoff
  - validation gates for assets, UI smoke, multi-viewport layout/readability, and desktop lockup/interactivity
  - Vite + ESM runtime modernization with preserved scene/test globals
  - scene-level material token refinement plus additive diagnostics for `materialProfile`, `environmentCue`, `interactionCue`, and `postFxMode`
- Still pending after stabilization:
  - deeper Phase 2 asset/material/environment refinement
  - deeper Phase 3 finishing, particle storytelling, and interaction polish
  - any later Three.js library upgrade after the current module baseline proves stable
- Treat the roadmap sections below as the next-phase backlog, not as in-scope work for the stabilization milestone.

---

## Quick wins (1-3 days)

### QW-1 Recompose the hero shot
**Impact**: Very high
**Effort**: Low
**Files**: `src/scene/index.js`, `styles.css`

**Changes**
- Narrow the live focal zone so one hero object silhouette reads instantly.
- Reduce competing highlights near the copy corridor.
- Push the wrench into a clearer hero role and subordinate the support props.
- Re-tune camera, float amplitudes, and tool base positions for a cleaner triangular composition.

**Acceptance Criteria**
- [ ] Screenshot clearly communicates one dominant focal object.
- [ ] Headline and CTA remain the visual first read.

### QW-2 Upgrade shadow grounding
**Impact**: Very high
**Effort**: Low-to-medium
**Files**: `src/scene/index.js`

**Changes**
- Add a more deliberate shadow solution under hero props:
  - shadow-casting directional/spot support for the primary prop
  - soft fake contact shadow planes beneath hero tools
  - stronger floor occlusion near contact points
- Keep RectAreaLights for specular shaping, but do not rely on them for shadow definition.

**Acceptance Criteria**
- [ ] Props feel anchored to space rather than floating in undefined volume.
- [ ] Ground plane reads as intentional, not just reflective.

### QW-3 Make the intro an authored sequence
**Impact**: Very high
**Effort**: Medium
**Files**: `src/scene/index.js`, `src/site/index.js`

**Changes**
- Replace any remaining initialization feel with a directed sequence:
  1. dark idle
  2. atmospheric wake
  3. hero reveal sweep
  4. headline lock
  5. controlled settle
- Synchronize copy reveal timing with scene energy peaks.

**Acceptance Criteria**
- [ ] The first 2-3 seconds feel designed, not merely initialized.

### QW-4 Calibrate bloom and grading
**Impact**: High
**Effort**: Low
**Files**: `src/scene/index.js`

**Changes**
- Lower broad bloom spill.
- Concentrate bloom on emissive hubs, sparks, and selected particles.
- Add one restrained finishing pass or refined overlay logic for highlights, toe contrast, and cool shadow separation.

**Acceptance Criteria**
- [ ] Scene looks richer, not hazier.
- [ ] Highlights feel premium instead of simply bright.

---

## Phase 1 - Cinematic foundation (3-5 days)

### 1.1 Shot design and camera dramaturgy
**Files**: `src/scene/index.js`
**Effort**: 6-8h

**Implementation**
- Introduce or refine camera states:
  - `intro`
  - `hold`
  - `interactive-idle`
  - `scroll-transition`
- Add subtle dolly-in during intro.
- Use lower-amplitude idle motion after settle.
- Reserve camera trauma for rare interaction peaks only.

**Acceptance Criteria**
- [ ] Camera movement has distinct phases.
- [ ] Idle state feels composed and premium, not restless.

### 1.2 Lighting redesign
**Files**: `src/scene/index.js`
**Effort**: 8-10h

**Implementation**
- Keep warm/cool duality, but formalize it into a cinematic rig:
  - hero key
  - fill with motivated color temperature
  - rim/separation
  - practical accent/emissive contribution
  - grounded shadow source
- Increase shadow intentionality around the hero prop.
- Re-balance light intensities per state so release pulses feel like light events, not just particle events.

**Acceptance Criteria**
- [ ] Lighting remains beautiful in stills and motion.
- [ ] Primary prop gains clear face, edge, and contact separation.

### 1.3 Scroll handoff sequence
**Files**: `src/scene/index.js`, `src/site/index.js`
**Effort**: 4-6h

**Implementation**
- Replace simple fade-out behavior with a designed scroll transition.
- Use scroll to compress atmosphere, flatten finishing, and hand off visual emphasis to the next section.

**Acceptance Criteria**
- [ ] The hero exits gracefully instead of merely disappearing.

---

## Phase 2 - Asset, material, and environment upgrade (1-2 weeks)

### 2.1 Unify asset fidelity
**Files**: `src/scene/index.js`, `assets/models/hero/*`
**Effort**: 10-16h depending on asset availability

**Implementation**
- Keep the current manifest-backed pack as the baseline.
- Improve visible tool fidelity through either:
  - bespoke GLB refinements with consistent art direction, bevel density, texel density, and material authoring, or
  - scene-level refinement that masks remaining fidelity gaps without changing manifest semantics.
- Eliminate mixed-quality reads between the hero wrench and support props.

**Acceptance Criteria**
- [ ] All visible tools feel like they belong to the same world and same render standard.

### 2.2 PBR material pass
**Files**: `src/scene/index.js`, `assets/textures/*` if used
**Effort**: 8-12h

**Implementation**
- Replace flat-ish metal response with richer physically based surfaces:
  - micro-roughness variation
  - brushed feel where appropriate
  - edge wear or subtle patina
  - controlled accent highlights only where justified
- Improve wood/rubber/plastic response to avoid "all materials are shiny metal" syndrome.

**Acceptance Criteria**
- [ ] Materials read distinctly under the same light rig.
- [ ] Metallic surfaces produce believable hero highlights without clipping.

### 2.3 Environmental storytelling pass
**Files**: `src/scene/index.js`, `styles.css`
**Effort**: 8-10h

**Implementation**
- Evolve the environment from generic atmospheric volume into a cohesive scene world:
  - workshop haze lanes
  - directional particulate flow tied to composition
  - subtle environmental planes or silhouette set pieces
  - stronger parallax depth layers

**Acceptance Criteria**
- [ ] The world feels designed, not just filled.

---

## Phase 3 - Signature animation and premium finishing (1-2 weeks)

### 3.1 Particle system transformation
**Files**: `src/scene/index.js`
**Effort**: 12-16h

**Implementation**
- Keep the current species architecture, but give each layer a storytelling role:
  - **hero ribbons**: directional flow that frames object reveal
  - **warm motes**: depth and atmosphere
  - **micro-dust**: edge sparkle and fine air movement
  - **filament sparks**: high-energy interaction punctuation
- Add more purposeful behaviors:
  - obstacle deflection around props
  - stronger curl-noise corridors
  - release trails
  - temporary clustering into patterns before dispersal

**Acceptance Criteria**
- [ ] The dust feels alive and intelligent, not just reactive.

### 3.2 Post-processing expansion
**Files**: `src/scene/index.js`
**Effort**: 8-12h

**Implementation**
- Add selective and state-aware finishing:
  - selective bloom discipline
  - subtle depth of field during intro/hold states only
  - light chromatic aberration on high-energy pulses only
  - refined vignette/grade shaping
  - final tone-shaping pass
- Keep these effects conditional by tier.

**Acceptance Criteria**
- [ ] Post stack adds polish without muddying readability or blowing the frame budget.

### 3.3 Purposeful interactions
**Files**: `src/scene/index.js`, `src/site/index.js`
**Effort**: 8-10h

**Implementation**
- Simplify and deepen interaction design:
  - pointer hover = local material/specular awakening
  - drag = tool-specific environmental wake
  - click = one premium pulse event
  - scroll = cinematic transition states
- Tie CTA hover or focus to subtle hero-state feedback.

**Acceptance Criteria**
- [ ] Users feel influence, not chaotic control.
- [ ] Interactions reinforce the brand promise of precision.

---

## Phase 4 - Later library upgrade (optional)

### 4.1 Upgrade Three.js runtime version
**Impact**: Medium-to-high long term
**Effort**: 1-2 weeks
**Files**: `package.json`, `src/runtime-globals.js`, `src/scene/index.js`, test harness files

**Implementation**
- Upgrade Three.js only after the current module baseline is stable.
- Use the phase for API modernization, pass cleanup, and compatibility fixes only.
- Do not mix the library upgrade with new art-direction work.

**Acceptance Criteria**
- [ ] Hero scene behavior is preserved or improved after the upgrade.

### 4.2 Add compressed textures / asset pipeline
**Impact**: Medium
**Effort**: Variable
**Files**: `assets/*`, `scripts/*`, project setup

**Implementation**
- Add KTX2 or optimized texture formats if higher-fidelity materials are introduced.
- Keep runtime memory within budget.

---

## Prioritized Task Table

| Priority | Task | Files | Effort | Why first |
|---|---|---|---:|---|
| P0 | Recompose hero shot | `src/scene/index.js`, `styles.css` | 4h | Highest screenshot payoff |
| P0 | Strengthen shadow grounding | `src/scene/index.js` | 6h | Biggest realism gap |
| P0 | Author intro sequence | `src/scene/index.js`, `src/site/index.js` | 6h | Converts scene from reactive to cinematic |
| P1 | Retune bloom/grading | `src/scene/index.js` | 3h | Immediate premium polish |
| P1 | Camera state system | `src/scene/index.js` | 6h | Enables filmic pacing |
| P1 | Lighting redesign | `src/scene/index.js` | 8h | Supports all later upgrades |
| P1 | Scroll handoff redesign | `src/scene/index.js`, `src/site/index.js` | 4h | Improves page continuity |
| P2 | Unify assets | `src/scene/index.js`, `assets/models/hero/*` | 12h | Removes fidelity mismatch |
| P2 | PBR material pass | `src/scene/index.js`, `assets/textures/*` | 10h | Raises object quality ceiling |
| P2 | Environmental storytelling pass | `src/scene/index.js`, `styles.css` | 8h | Makes world cohesive |
| P3 | Particle transformation | `src/scene/index.js` | 14h | Signature motion layer |
| P3 | Expanded post stack | `src/scene/index.js` | 10h | Filmic finish |
| P3 | Purposeful interaction pass | `src/scene/index.js`, `src/site/index.js` | 8h | Makes interactivity meaningful |
| P4 | Upgrade Three.js runtime version | `package.json`, `src/runtime-globals.js`, `src/scene/index.js` | 20h | Long-term maintainability |
