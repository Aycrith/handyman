# Hero Stabilization Milestone

Date: `2026-03-14`

## Current shipped baseline
- `assets/models/hero/` is the runtime source of truth for the shipped hero pack.
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
  - scene-level material token refinement for the shipped hero pack
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
- UI smoke checks for scene boot, hero copy visibility, composition diagnostics, and core page behavior
- Multi-viewport layout and readability gates across desktop, tablet, mobile, and narrow viewports
- Desktop lockup/interactivity validation for reveal, lockup, idle, drag response, and callout safety

## Explicitly pending after this milestone
- Further Phase 2 asset/material/environment refinement beyond the current scene-level material-token pass
- Further Phase 3 finishing and deeper particle storytelling beyond the current additive interaction/post diagnostics
- Any future Three.js version upgrade after the current Vite/ESM baseline is stable

## Known non-blocking follow-up
- Vite currently reports a chunk-size warning for the main JavaScript bundle during `npm run build`.
- Keep it logged as a follow-up for later optimization; it is not part of this stabilization milestone unless it starts causing a functional regression.
