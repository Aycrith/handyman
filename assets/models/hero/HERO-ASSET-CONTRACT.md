# Hero Asset Contract

Contract version: `hero-asset-contract-v3`

Current runtime variant: `final`

This folder now ships three external processed runtime assets: one primary hero object and two support props. Only externally sourced processed assets may claim the runtime `final` variant.

Runtime verification for this folder is stored in `HERO-ASSET-MANIFEST.json`. The manifest is the source of truth for:

- current pack variant
- contract version
- build stage
- per-tool SHA-256 fingerprints
- provenance and hero-role metadata
- source URL, license, attribution, and processed-from lineage

## Required Manifest Fields

Every `tools.*` entry must include:

- `variant` via the top-level manifest value
- `provenance`
- `sourceUrl`
- `license`
- `attribution`
- `processedFrom`
- `heroRole`

## Runtime Deliverables

- `hero-pipe-wrench.glb`
- `hero-claw-hammer.glb`
- `hero-handsaw.glb`

## Asset Roles

- `wrench`
  - `heroRole: primary`
  - `provenance: external-processed`
  - This is the only asset allowed to satisfy the runtime `final` hero requirement.
- `hammer`
  - `heroRole: support`
  - `provenance: external-processed`
  - This is a support-runtime asset for the assembly-orbit composition.
- `saw`
  - `heroRole: support`
  - `provenance: external-processed`
  - This is a support-runtime asset for the assembly-orbit composition.

## Runtime Expectations

- Units: meters
- Up axis: Y-up
- Forward axis: -Z facing camera by default
- Single root scene per GLB
- The wrench origin must sit near the grip balance point so the hero lockup remains stable
- Support assets may preserve authored origins so the orbit layout can place them by screen-space lanes
- Runtime material remapping is optional for fallback assets only; external runtime assets keep authored PBR material response

## Art Direction Requirements

- The wrench is the dominant shipped hero object in the default scene lockup.
- Support props are part of the default assembly-orbit composition and must remain visually subordinate to the wrench.
- The hero wrench must remain readable under a brighter workshop-grade light rig.
- External hero assets must prioritize visual quality, silhouette read, and believable material response over thematic exactness.

## Integration Notes

- Internal scene ids remain `wrench`, `hammer`, and `saw`.
- Asset generation is owned by `npm run build:hero-assets`.
- Deterministic verification is owned by `npm run verify:hero-assets`.
- Loader fallback order remains:
  1. preferred external processed wrench GLB
  2. legacy wrench GLB where available
  3. procedural wrench fallback
- Preferred support loader order is:
  1. preferred external processed support GLB
  2. legacy support GLB where available
  3. procedural support fallback
