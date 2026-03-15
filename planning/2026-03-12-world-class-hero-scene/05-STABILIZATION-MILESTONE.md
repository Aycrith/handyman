# Hero Stabilization Milestone

Date: `2026-03-14`

## Current shipped baseline
- `assets/models/hero/` is the runtime source of truth for the shipped hero pack.
- The shipped hero pack baseline is:
  - `assetSetVersion: hero-pack-v5`
  - `contractVersion: hero-asset-contract-v4`
  - `buildStage: assembly-orbit-bespoke-pack`
  - `provenance: bespoke-authored`
- The runtime now boots through Vite + ESM using:
  - `src/main.js`
  - `src/runtime-globals.js`
  - `src/site/index.js`
  - `src/scene/index.js`
- The default runtime composition is wrench-first:
  - `hero-pipe-wrench.glb` is the dominant hero object
  - `hero-claw-hammer.glb` and `hero-handsaw.glb` are support-runtime props
- `src/scene/index.js` ships authored director phases:
  - `pre-reveal`
  - `reveal`
  - `lockup`
  - `interactive-idle`
  - `scroll-transition`
- The current branch also ships:
  - layout-specific composition presets and responsive quality-tier handling
  - scene-level material token refinement for the shipped hero pack through `precisionWorkshopBespoke`
  - additive diagnostics for `materialProfile`, `environmentCue`, `interactionCue`, and `postFxMode`
  - preserved compatibility globals for tests and orchestration:
    - `window.__sceneDiagnostics`
    - `window.__setSceneDirectorPhaseForTest`
    - `window.__openToolPanelForTest`
    - `window.__captureSceneSnapshot`
    - `window.__sceneAssetsReady`

## Validation commands
- `npm run dev`
- `npm run build`
- `npm run preview`
- `npm run build:hero-assets`
- `npm run verify:hero-assets`
- `npm test`

## Preview-backed test flow
- Browser validation now runs against the built Vite app.
- `tests/run-all.js` builds first, then the test helpers start `vite preview --strictPort`.
- Raw static-file serving is no longer the source of truth for validation.

## Canonical evidence policy
- Keep canonical hero evidence in `tests/evidence-desktop/`.
- Keep the validation-generated desktop states that represent the shipped experience:
  - `desktop-static-layout.png`
  - `desktop-reveal.png`
  - `desktop-lockup.png`
  - `desktop-interactive-idle.png`
  - `desktop-scroll-transition.png`
- Retain the existing `desktop-copy-clean.png`, `desktop-drag-wake.png`, `desktop-idle.png`, and `desktop-release-lift.png` images as part of the broader UI/effects regression baseline.
- Treat `artifacts/` and root-level `debug-*.png` captures as generated output. They should not be committed.

## Commit boundary for this milestone
- Include:
  - Vite + ESM runtime files
  - dependency and script updates in `package.json` / lockfile
  - hero asset pipeline, manifest, and processed runtime assets
  - updated Playwright validation and preview server helpers
  - canonical tracked evidence in `tests/evidence-desktop/`
  - planning docs that describe the shipped baseline
- Exclude:
  - ad hoc screenshots or debug captures
  - non-canonical evidence outside the tracked desktop baseline
  - new feature work beyond the current shipped hero/runtime behavior

## Review framing
- Describe the milestone as: `runtime modernization + current hero baseline stabilization`.
- Review it as one coherent migration from the root `main.js` / `three-scene.js` runtime to the current Vite + ESM structure, not as a new Phase 2 or Phase 3 feature pass.
- Treat the hero asset pack, diagnostics globals, and preview-backed Playwright flow as part of the shipped baseline for this milestone.

## Automated coverage now in place
- Hero asset pipeline verification with manifest fingerprint checks and provenance assertions

## Post-Stabilization: Phase F — Cinematic World System (2026-03-15)

After stabilization, a full cinematic 10-act world system was built on top of the stabilized baseline:
- 9 worlds, 8 authored transitions, 5 transition techniques, 4 custom shaders
- World manager (`src/scene/world-manager.js`), orchestrator bridge, debug overlay
- Integrated into scene/index.js via 7 edits (camera, lighting, particles, diagnostics)
- Mobile tier filtering (4-world simplified path)
- Build passes, runtime zero errors, tests pass across all viewports
- Asset pipeline script exists but not yet run (optimized GLBs pending)

**Note:** The world system is additive — it does not modify the hero stabilization baseline. The existing director phases, hero pack, and diagnostics globals continue to function unchanged.
- UI smoke checks for scene boot, hero copy visibility, composition diagnostics, and core page behavior
- Multi-viewport layout and readability gates across desktop, tablet, mobile, and narrow viewports
- Desktop lockup/interactivity validation for reveal, lockup, idle, drag response, and callout safety

## Current diagnostics baseline
- The active layout/readability baseline is encoded in `tests/validate-effects.js` and `tests/validate-effects-desktop.js`.
- The current bespoke-pack baseline accepts:
  - desktop 1440 overlap up to `0.12` while holding art-lane occupancy in the `0.30..0.35` band
  - tablet hero height in the `0.46..0.51` band
- Treat these ranges as the regression envelope for the shipped `hero-pack-v5` scene until a later milestone intentionally re-baselines them with new evidence.

## Explicitly pending after this milestone
- Further Phase 3 finishing and deeper particle storytelling beyond the current directed baseline
- Any future Three.js version upgrade after the current Vite/ESM baseline is stable

## Known non-blocking follow-up
- Real-hardware perf capture against the desktop `<=16.7ms` and integrated/mobile `<=22ms` budgets still needs to happen outside software-rendered CI.
- Vite currently reports a chunk-size warning for the main JavaScript bundle during `npm run build`.
- Keep it logged as a follow-up for later optimization; it is not part of this stabilization milestone unless it starts causing a functional regression.
