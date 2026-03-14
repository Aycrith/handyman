# World-Class 3D Hero Scene - Research and Analysis

## Implementation Update (2026-03-14)
- The planning baseline below is now partially realized in the current branch.
- The shipped runtime baseline is a manifest-backed bespoke-authored hero pack with one primary wrench and two subordinate support props.
- The current asset baseline is `hero-pack-v5` on `hero-asset-contract-v4` with build stage `assembly-orbit-bespoke-pack`.
- The hero now runs through explicit director phases: `pre-reveal`, `reveal`, `lockup`, `interactive-idle`, and `scroll-transition`.
- Validation now includes:
  - deterministic asset pack verification
  - UI smoke checks
  - multi-viewport composition/readability gates
  - desktop lockup and interaction evidence
  - Vite build plus preview-backed browser execution
- Phase 2 material/environment refinement, Phase 3 finishing, and a later Three.js library upgrade remain intentionally pending after stabilization.

## Current Technical Baseline

### Stack in the live workspace
- `index.html`
  - serves as the Vite shell
  - loads the module entrypoint `/src/main.js`
- `src/main.js`
  - boots dependency wiring and both runtime modules
- `src/runtime-globals.js`
  - binds `three`, GSAP, Lenis, SplitType, and required Three example modules onto the existing global surface expected by the migrated runtime
- `src/scene/index.js`
  - fixed canvas hero scene
  - authored phase/director state handling
  - manifest-backed bespoke GLB hero pack with procedural fallback paths
  - custom particle systems with multiple species
  - ACES filmic tone mapping
  - Unreal Bloom pass
  - custom volumetric scatter pass
  - RectAreaLight-based key/fill/rim setup plus point/spot accents
  - scroll, pointer, drag, tooltip, panel, and state-based choreography
  - additive diagnostics for `materialProfile`, `environmentCue`, `interactionCue`, and `postFxMode`
- `src/site/index.js`
  - GSAP/ScrollTrigger and Lenis orchestration for page motion, preload handoff, and hero sequencing
- `styles.css`
  - strong art direction, readability overlays, hero typography, and cinematic UI layers

### Observed asset strategy
- Bespoke authored runtime assets live in `assets/models/hero/` and are tracked by `HERO-ASSET-MANIFEST.json`.
- `scripts/hero-asset-pipeline.mjs` owns deterministic hero asset generation and `tests/validate-hero-assets.js` verifies fingerprints and provenance.
- Procedural assets remain as fallbacks, but the stabilization baseline is the manifest-backed bespoke hero pack.

## Evidence-Based Scorecard

| Dimension | Current Score | Why it scores there |
|---|---:|---|
| Visual quality | 8/10 | Strong palette, premium typography integration, cinematic contrast, appealing particles, good compositing in screenshot |
| Animation sophistication | 8.5/10 | Authored state machine, pointer wake, shockwaves, drag response, release/recover states, ambient float, dynamic overlays |
| Performance architecture | 8/10 | Tiering, dynamic downgrade logic, fixed-step simulation, half-res scatter, density sampling, reduced-motion support |
| Lighting setup | 7.5/10 | Attractive key/fill/rim mix and stronger grounding, but final shadow coherence can still improve |
| Geometry complexity | 7/10 | The shipped hero pack improves silhouette quality, but material richness and microdetail are not final-tier yet |
| Shader usage | 8.5/10 | Custom particle shader plus custom scatter pass are advanced for a vanilla JS landing page |
| Camera language | 7/10 | Phased and more deliberate than before, but not yet fully developed into final cinematic shot design |
| Aesthetic impact | 8/10 | Memorable and premium, but not yet in the "award-site signature moment" tier |
| Storytelling cohesion | 6.5/10 | The mood is strong and the sequence is clearer, but the scene still has room to deepen its brand narrative |

## Screenshot-Based Visual Analysis

### What already works
1. **Premium tonal palette**
   - Warm amber against deep charcoal and blueprint blue gives the hero a strong luxury-industrial mood.
   - The palette is coherent with the ProCraft brand positioning and reads as high-end rather than generic contractor branding.

2. **Excellent typography-to-scene integration**
   - The serif headline, italic emphasis, and warm-to-light gradient on "Done Right" pair well with the atmospheric lighting.
   - Copy remains dominant enough in the current frame to work as a marketing hero.

3. **Strong atmosphere and perceived depth**
   - Dust/mote layering, grid perspective lines, vignette overlays, and the warm central bloom create real depth.
   - The scene avoids the flat "background animation wallpaper" look.

4. **Good premium cues**
   - Warm glow, subtle blueprint lines, soft lens-like bloom, and floating debris push the scene beyond a stock Three.js demo.

### What is still missing
1. **A single iconic hero object read**
   - The wrench now reads clearly as the primary hero, but the composition can still be pushed further toward instant iconic recognition.

2. **Stronger grounding and shadow logic**
   - The scene feels more anchored than before, but the physical relationship between tools, floor plane, shadows, and volumetric light is still somewhat stylized.

3. **A more authored lens language**
   - The frame is attractive, but it still reads more like a polished live 3D composition than a final motion-director shot.

## Code-Based Technical Analysis

### 1. Visual quality
**Strengths**
- `src/scene/index.js` already uses:
  - ACES filmic tone mapping
  - bloom
  - custom grade overlays
  - fog
  - PMREM-generated environment texture
  - billboard aura cards and beam cards
- The scene is designed together with the DOM, not as an isolated WebGL canvas.

**Current limiters**
- The environment map and world response are stronger than the original baseline, but still below final HDR-driven product-lighting ambition.
- The post stack stays intentionally disciplined and has room for one later finishing pass.
- Some object surfaces still read as "good real-time materials" instead of "hero-render materials."

### 2. Animation sophistication
**Strengths**
- The scene contains a real choreography system:
  - authored reveal flow
  - pointer trail
  - vortex forces
  - drag and hover wake
  - release and recover states
  - tool wake states
  - camera trauma and shake
- This is already substantially more advanced than a typical landing page background.

**Current limiters**
- The sequence is more deliberate than before, but not yet fully tuned into the final narrative timeline of reveal, introduction, lockup, and premium idle.
- Motion is rich, but it can still read as continuously reactive rather than fully staged.

### 3. Performance considerations
**Strengths**
- Strong tiering architecture already exists:
  - `desktop`, `mobile`, `low`
  - frame budget monitoring
  - soft/hard downgrade thresholds
  - half-resolution scatter pass
  - species-specific particle counts
- Simulation uses a fixed-step accumulation approach, which is a solid production choice.
- The test harness now validates the built Vite app through preview instead of a raw static-file server.

**Current limiters**
- The scene is already carrying a lot of moving parts: multiple particle layers, volumetric cards, bloom, custom scatter, GLB assets, raycasting, DOM overlays, and dynamic lighting.
- The next visual leap cannot come only from "add more effects." It must come from replacing lower-value complexity with higher-value composition.

### 4. Lighting setup
**Strengths**
- RectAreaLights create high-quality studio-like specular sweeps.
- Warm/cool separation is strong and aesthetically successful.
- Accent lights tied to wake/release states create responsive drama.

**Current limiters**
- RectAreaLights do not provide premium shadow behavior by themselves.
- Much of the drama still lives in highlights and glows, not deep shadow composition.
- The current shadow strategy is stronger than the old baseline, but still lighter than the ambition of the scene.

### 5. Geometry complexity
**Strengths**
- The manifest-backed bespoke hero pack improves the main silhouette and fidelity consistency.
- Support props now read as deliberate subordinate tools rather than equal-weight hero objects.

**Current limiters**
- Bevel quality, micro-surface breakup, and texture richness are still below top-tier product visualization standards.
- Some surfaces read well in motion but not yet as fully portfolio-grade object art.

### 6. Shader usage
**Strengths**
- This remains one of the strongest areas of the implementation.
- The custom particle shader supports temperature, charge, velocity, halo/ring logic, and additive blending.
- The custom volumetric scatter pass remains a strong upgrade over bloom-only treatment.

**Current limiters**
- The scene still does not use a more advanced material/shader strategy for hero props themselves.
- Particles are expressive, but not yet deeply integrated with collision-aware accumulation or selective refractive/forward-scattering behavior.

### 7. Camera positioning and shot design
**Current implementation**
- Perspective camera at 60 degrees FOV
- phased reveal/lockup/idle behavior
- scroll pushes camera deeper
- pointer influences camera spring rotation
- optional trauma shake

**Strengths**
- Responsive, stable, and integrated with page scroll.
- Enough motion to avoid static hero syndrome.

**Current limiters**
- No fully cinematic shot progression yet.
- No focal hierarchy changes beyond the authored reveal and subtle parallax.
- No final hero-framing language such as a stronger push-in, reveal orbit, or counter-move against object animation.

### 8. Overall aesthetic impact
**Current read**
- This is already a premium handcrafted interactive hero.
- It absolutely looks bespoke.
- It does not yet feel like a signature, award-caliber opening scene from a top-tier creative studio.

**Why**
- The remaining gap is no longer basic technical competence.
- The remaining gap is authored art direction, sequence design, and final-stage polish.

## Key Strategic Insight
The scene does not need a total rewrite. It needs a shift from feature richness to directed experience design around the current shipped baseline.

In practice that means:
1. Make every effect serve a cinematic story beat.
2. Refine prop material response and world integration around the current bespoke hero pack.
3. Replace generic interactivity with purposeful interactions.
4. Strengthen lighting, grounding, and post finishing.
5. Treat the hero like a short film shot, not a reactive background.

## Recommended Creative Direction

### Best-fit direction for this brand
**Precision workshop ritual**

This direction fits the current palette and codebase better than a fully mystical fantasy approach.

Desired mood:
- forged craftsmanship
- premium industrial elegance
- controlled power
- meticulous precision
- trustworthy execution

### Narrative shape
1. **Dormant field**
   - the hero opens with low embers, faint blueprint lines, barely visible silhouettes
2. **Assembly ignition**
   - dust converges, light wakes, tool geometry resolves into view
3. **Hero lockup**
   - the wrench settles into an iconic composition as the headline completes
4. **Interactive mastery**
   - user input stirs the environment but never breaks the premium restraint
5. **Scroll handoff**
   - the hero gracefully yields to page narrative with a deliberate cinematic fade

## High-Value Gaps to Address First
1. **Hero object clarity and composition**
2. **Shadow/contact grounding**
3. **Material/world integration around the shipped pack**
4. **Authored entrance and interaction choreography**
5. **Expanded but disciplined finishing**
6. **Narrative-driven particle behavior**

## Reference Pattern Notes
- Three.js best practices support EffectComposer-based bloom, ACES tone mapping, and carefully tuned pass chains.
- Vite + ESM keeps the runtime maintainable while preserving the current validation/test globals.
- GSAP/ScrollTrigger best practices favor responsive enable/disable logic and guarded scroll orchestration rather than unconditional scrub-heavy behavior.
- The current codebase already follows this mindset technically; the next step is to apply the same discipline artistically.
