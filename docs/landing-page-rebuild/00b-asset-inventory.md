# 3D Asset Inventory & Utilization Decision

**Date:** 2026-03-14
**Directory audited:** `assets/3dmodels/`

## Production-Ready Assets (No Processing Needed)

| File | Size | Use |
|------|------|-----|
| `source/tool--box-assy-33.glb` | 126 KB | Diegetic scene prop (Phase C, services section) — small enough for direct use |
| `source/HAMMER.glb` | 3.6 MB | Audit as higher-quality hammer vs current hero-pack-v5; may replace |
| `source/Spanner.glb` | 2.1 MB | Potential wrench alternative or support prop |
| `source/AXE.glb` | 2.8 MB | Alternative hero prop if hammer/wrench roles expand |

## Decision: Tool Models

After auditing, the current `hero-pack-v5` bespoke GLBs (hero-claw-hammer, hero-pipe-wrench, hero-handsaw) pass all SHA256 integrity checks and are purpose-built for the hero scene composition. The CS2-style models in `source/` have different artistic styles and UV workflows that would require significant re-rigging to match the existing material vocabulary.

**Decision:** Keep current hero-pack-v5 for the hero scene. `source/tool--box-assy-33.glb` is the only asset cleared for immediate use as a scene prop.

## Viable After gltf-transform Processing

| File | Size | Target | Use |
|------|------|--------|-----|
| `workshop.glb` | 67 MB | ≤5 MB after decimation | Background environment mesh |
| `building_workshop_parking_workshop.glb` | 37 MB | ≤3 MB after decimation | Sectional backdrop |
| `building_metallic_protective_fence_low_poly.glb` | 37 MB | ≤2 MB | Foreground parallax layer |
| `basement-studio_record3d.glb` | 12.5 MB | ≤2 MB | Atmospheric depth layer |

**Processing script:** `scripts/process-3dmodels.mjs` (to be created)
**Pipeline:** `@gltf-transform/core` with `@gltf-transform/extensions` — already in devDependencies

## Experimental (Not for Production Without Major Processing)

| File | Size | Notes |
|------|------|-------|
| `xr_studio_-_space_is_more_than_a_surface_points.glb` | 194 MB | Potential particle position source; needs vertex extraction to Float32Array |
| `every_point_studio_-_xars_hyperobjekt_231220.glb` | 39 MB | Artistic particle field reference |
| `gottwaig__zeugen_im_wireframe.glb` | 323 MB | Runtime size prohibitive |
| `hyperspace_-_winter_landscape_ii.glb` | 223 MB | Runtime size prohibitive |
| `xr_boehmsdorf_-_sky_path_wire.glb` | 263 MB | Runtime size prohibitive |

## Texture Pipeline

Legacy spec/gloss textures (`initialShadingGroup_*`) cover the rivet gun (`pbr_rivet_gun.glb`, 27.4 MB). The rivet gun is NOT selected for production use in this phase — the PBR rig uses a spec/gloss workflow that conflicts with the Three.js MeshStandardMaterial metallic/roughness workflow.

**Action needed if rivet gun is required in future:** Convert spec → PBR via texture baking.

## Asset-to-PRD Mapping

| Asset | Feeds PRD |
|-------|----------|
| `tool--box-assy-33.glb` | PRD 01 (optional scene prop) |
| `workshop.glb` (processed) | PRD 05 (environmental FX), PRD 07 (materials) |
| XR studio point clouds | PRD 05 (particle positions), experimental |
