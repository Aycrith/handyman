# World-Class 3D Hero Scene Transformation - PRD

## Overview
- **Goal**: Transform the current Three.js hero scene into a world-class, production-grade animated experience that feels cinematic, premium, responsive, and unmistakably intentional.
- **Status**: Vite/ESM baseline implemented; stabilization milestone packaging in progress
- **Owner**: Workspace user
- **Created**: 2026-03-12
- **Agent-Ready**: Yes
- **Primary Surface**: `src/scene/index.js` integrated through `src/main.js` behind the hero in `index.html`

## Implementation Update (2026-03-14)
- The current branch ships a manifest-backed three-tool hero pack in `assets/models/hero/`:
  - `hero-pipe-wrench.glb` as the primary runtime hero asset
  - `hero-claw-hammer.glb` and `hero-handsaw.glb` as support-runtime assets
- The runtime now boots through Vite + ESM using:
  - `src/main.js`
  - `src/runtime-globals.js`
  - `src/site/index.js`
  - `src/scene/index.js`
- `src/scene/index.js` now exposes authored hero states for `pre-reveal`, `reveal`, `lockup`, `interactive-idle`, and `scroll-transition`.
- Validation now covers asset verification, UI smoke, multi-viewport layout/readability gates, and canonical desktop lockup/interactivity evidence.
- This milestone is stabilization-only: preserve the current baseline, clean generated artifacts, and align docs before any deeper Phase 2, Phase 3, or later Three.js-upgrade work.

## Problem Statement
The existing hero scene already exceeds a typical marketing-site WebGL background, but it still lands in the category of "impressive interactive backdrop" rather than "signature hero experience."

Current limitations:
1. The scene is visually strong in a single frame but not yet authored as a complete cinematic sequence.
2. Lighting is attractive but not fully coherent: specular response is strong, while shadow logic and contact grounding remain limited.
3. Geometry quality is improved by the shipped hero pack, but material and world response are not yet at the final hero-grade standard.
4. The particle system is sophisticated, but its behavior is more reactive than narratively purposeful.
5. The post-processing chain is disciplined, but still lighter than the final intended finishing pass.
6. Camera behavior is responsive and phase-aware, but not yet fully developed into final shot language.
7. The scene tells "premium tools in atmospheric workshop space," but not yet the full story of craftsmanship, precision, trust, and transformation.

## Success Metrics
- [ ] First 2.5 seconds of hero load communicate a clear cinematic story arc: reveal, lockup, and settle.
- [ ] Hero scene remains readable behind copy, with no readability failures in the content corridor.
- [ ] Desktop frame pacing target: average frame time <= 16.7ms on mainstream discrete GPUs and <= 22ms on integrated GPUs in standard mode.
- [ ] Mobile/low-tier modes preserve the same mood and composition with graceful degradation.
- [ ] Scene gains at least 3 premium perception markers: coherent shadow grounding, richer material response, and authored animation sequencing.
- [ ] Scroll or pointer interaction feels purposeful and brand-aligned rather than merely reactive.
- [ ] The hero creates a memorable first impression in both motion and screenshot form.

## User Stories
1. As a first-time visitor, I want the hero to immediately signal premium craftsmanship so that I trust the brand within seconds.
   - **Acceptance Criteria**:
     - [ ] The scene has a recognizable focal point within 500ms after preloader exit.
     - [ ] The eye is guided toward hero copy and CTA, not away from them.

2. As a visitor interacting with the hero, I want motion to feel fluid and intentional so that the experience feels polished and expensive.
   - **Acceptance Criteria**:
     - [ ] Pointer, scroll, and click interactions have distinct visual meaning.
     - [ ] Motion curves avoid abrupt or game-like jitter in default state.

3. As a user on a lower-power device, I want the hero to stay performant and stable so that the site still feels premium.
   - **Acceptance Criteria**:
     - [ ] Feature tiers reduce cost without collapsing the composition.
     - [ ] Reduced-motion users receive a visually rich but calmer presentation.

4. As an implementation agent, I want explicit file-level changes and rollout order so that the scene can be upgraded incrementally without regressions.
   - **Acceptance Criteria**:
     - [ ] Each phase specifies the runtime entrypoints, tasks, and verification criteria.

## Functional Requirements
- **REQ-001**: Preserve the existing hero copy corridor and readability shielding behavior.
- **REQ-002**: Introduce and preserve a cinematic hero entrance sequence with an authored timeline.
- **REQ-003**: Maintain the upgraded lighting model with better shadow grounding and coherent key/fill/rim logic.
- **REQ-004**: Keep the manifest-backed hero pack and scene-level material token layer as the runtime source of truth unless a later phase explicitly changes that contract.
- **REQ-005**: Evolve the particle field from ambient activity into layered environmental storytelling in later phases without regressing readability.
- **REQ-006**: Keep post-processing disciplined and quality-tier aware.
- **REQ-007**: Preserve scroll- and interaction-driven state changes with clear narrative purpose.
- **REQ-008**: Maintain responsive quality tiers for desktop, mobile, low-end, and reduced-motion contexts.
- **REQ-009**: Preserve the current page architecture: `index.html` as the Vite shell, `src/main.js` as the entrypoint, `src/runtime-globals.js` for dependency wiring, `src/site/index.js` for page orchestration, `src/scene/index.js` for hero runtime, and `styles.css` for shared presentation.
- **REQ-010**: Keep graceful fallback behavior when WebGL, post FX, or hero assets are unavailable.

## Non-Functional Requirements
- **PERF-001**: Desktop hero scene target <= 16.7ms average frame time in standard mode.
- **PERF-002**: Fallback desktop mode target <= 22ms average frame time with reduced scatter and reduced particle density.
- **PERF-003**: Avoid increasing layout shift or delaying hero text visibility.
- **VIS-001**: Screenshot quality must improve as much as motion quality.
- **A11Y-001**: Honor `prefers-reduced-motion` and maintain CTA readability.
- **A11Y-002**: Interactivity cannot block hero CTAs or primary page navigation.
- **ROBUST-001**: The hero must not fail hard when hero assets or optional post-processing features are unavailable.

## In Scope
- Hero scene composition
- Lighting and shadow system redesign
- Material and geometry fidelity upgrades
- Particle/environmental FX redesign
- Post-processing stack tuning
- Camera and animation choreography
- Performance tiering
- Scroll and pointer interaction design
- Visual storytelling pass
- Vite/ESM runtime modernization and validation parity

## Out of Scope
- Full site redesign outside the hero
- CMS/media pipeline for non-hero sections
- Backend/API changes
- A Three.js version upgrade during the stabilization milestone

## Dependencies
- External runtime libraries now bundled through Vite ESM:
  - `three` at the current runtime version
  - `gsap` + `ScrollTrigger`
  - `lenis`
  - `split-type`
- Internal dependencies:
  - `src/main.js`
  - `src/runtime-globals.js`
  - `src/site/index.js`
  - `src/scene/index.js`
  - `styles.css`
  - `index.html`
- Optional future dependencies:
  - additional `three/examples/jsm` post-processing passes if a later phase justifies them
  - compressed texture / KTX2 pipeline if higher-fidelity materials are introduced

## Open Questions
- [ ] Should the final hero remain "stylized premium workshop" or move toward "near-photoreal product render in atmosphere"?
- [ ] Is asset creation available for bespoke GLBs/textures in later phases, or should near-term refinement stay scene-level around the current shipped pack?
- [ ] When the current Vite baseline is stable, is a later Three.js library upgrade acceptable as a dedicated follow-on milestone?

## Agent Implementation Notes
- Preserve the current hero readability corridor and CTA dominance.
- Do not treat this as a pure effects upgrade; it is a composition, storytelling, and interaction upgrade.
- Prioritize changes that improve both motion and screenshot quality.
- Keep tasks incremental: entrance choreography, lighting/shadow coherence, asset/material refinement, particle evolution, post stack finishing, and performance tuning should ship in phases rather than as one risky rewrite.
