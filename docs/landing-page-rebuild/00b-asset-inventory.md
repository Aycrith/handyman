# Phase 0 — 3D Asset Inventory & Utilization Analysis

**Date:** 2026-03-14
**Status:** Assessment Complete (static analysis) | Runtime Quality Check: Pending

---

## Assets Assessed

Full directory: `assets/3dmodels/`
Total on-disk: ~1.3 GB across 40+ files

---

## Category 1: Tool Models (Immediately Usable / Near-Ready)

These are production-quality props directly relevant to the handyman brand. Assessment is based on file integrity and metadata — runtime quality check (polycount, UV quality, material fidelity) must be performed in a Three.js dev scene before final selection.

| File | Size | Format | Status | Decision |
|------|------|--------|--------|----------|
| `source/HAMMER.glb` | 3.5 MB | GLB + PBR | **Audit required** | Compare vs `hero-pack-v5` hammer; may replace or supplement |
| `source/AXE.glb` | 2.7 MB | GLB + diffuse/roughness | **Audit required** | Alternative hero prop; distinct silhouette |
| `source/Spanner.glb` | 2.1 MB | GLB + diffuse | **Audit required** | Support prop or wrench supplement |
| `pbr_rivet_gun.glb` | 27 MB | GLB + PBR (spec/gloss) | **Texture conversion required** | High-fidelity industrial tool; texture workflow is legacy spec/gloss — must convert to metallic/roughness before use |
| `source/tool--box-assy-33.glb` | 123 KB | GLB (simple) | **Production-ready** | Immediate use as diegetic set prop (foreground, contact-shadow element) |

### Texture Inventory for Tool Models

| Texture | Coverage | Notes |
|---------|----------|-------|
| `axe_color_psd_*.png` | AXE diffuse + roughness | PBR-ready |
| `hammer_color_psd_*.png` | HAMMER diffuse + roughness | PBR-ready |
| `spanner_color_psd_*.png` | Spanner diffuse | Missing roughness — needs authoring or default |
| `initialShadingGroup_*` | Rivet gun diffuse/gloss/normal/specular | Legacy spec/gloss workflow; convert to metallic/roughness via texture baking |

---

## Category 2: Environmental / Atmospheric Assets (Processing Required)

These assets can contribute to environmental storytelling but require gltf-transform processing to reach production-viable file sizes.

| File | Size | Runtime Target | Processing Needed | Potential Use |
|------|------|---------------|-------------------|---------------|
| `workshop.glb` | 64 MB | ≤5 MB | Aggressive mesh decimation + KTX2 texture compression | Background environment mesh, services section backdrop |
| `building_workshop_parking_workshop.glb` | 16 MB | ≤3 MB | Decimation + material simplification | Sectional silhouette backdrop |
| `building_metallic_protective_fence_low_poly.glb` | 35 MB | ≤2 MB | Texture compression (already low-poly mesh) | Foreground parallax layer |
| `basement_studio_record3d_-_xars_hyperobjekt.glb` | 12 MB | ≤2 MB | Photogrammetry mesh cleanup + texture compression | Atmospheric depth layer |

### Processing Pipeline

```
@gltf-transform/core pipeline:
  1. weld() — merge duplicate vertices
  2. simplify() — mesh decimation (Meshoptimizer)
  3. compress() — KTX2 texture compression (Basis Universal)
  4. prune() — remove unused nodes/materials

Target script: scripts/process-3dmodels.mjs
```

---

## Category 3: Experimental Point-Cloud & Wireframe Assets

These are artistically interesting but require significant research and processing before any production consideration. **Do not include in production pipeline without separate research sprint.**

| File | Size | Assessment | Decision |
|------|------|-----------|----------|
| `xr_studio_-_space_is_more_than_a_surface_points.glb` | 186 MB | XR studio point cloud — vertex positions could feed custom particle system | Experimental: extract vertex positions to Float32Array; evaluate vs procedural |
| `xr_studio_-_space_is_more_than_a_surface_v_point.glb` | 47 MB | Studio variant points | Experimental: smaller, better candidate for vertex extraction |
| `every_point_studio_-_xars_hyperobjekt_231220.glb` | 37 MB | Artistic particle field | Experimental: artistic reference only |
| `body_traces_-_warsaw_3d_map_xi.glb` | 23 MB | City wireframe map | Experimental: abstract wireframe depth layer |
| `xr_studio_-_space_is_more_than_a_surface.glb` | 80 MB | Full studio mesh | Experimental: requires aggressive LOD |

### Flagged as Production-Prohibitive (Size)

| File | Size | Verdict |
|------|------|---------|
| `gottwaig__zeugen_im_wireframe.glb` | 308 MB | Do not use without extreme LOD. Runtime size prohibitive. |
| `hyperspace_-_winter_landscape_ii.glb` | 213 MB | Do not use without extreme LOD. Runtime size prohibitive. |
| `xr_boehmsdorf_-_sky_path_wire.glb` | 251 MB | Do not use without extreme LOD. Runtime size prohibitive. |

---

## Category 4: Legacy / Source Assets

| File | Notes | Decision |
|------|-------|----------|
| `source/model.obj` + `materials.mtl` | Legacy OBJ format | Superseded by GLB equivalents. Convert only if GLB is missing. |
| `source/Rivet Gun.obj` | Raw rivet gun mesh | Superseded by `pbr_rivet_gun.glb`. Skip. |
| `source/bMMbKP7AsZM_obj.zip` | Unknown origin zip | Audit contents before use. |
| `zips/vendels-workshop.zip` | Likely source for `workshop.glb` | No action needed if `workshop.glb` is processed. |

---

## Utilization Roadmap

### Tier 1 — Immediately Viable (No Processing)

| Asset | Target Use | Phase |
|-------|-----------|-------|
| `source/tool--box-assy-33.glb` (123 KB) | Diegetic foreground prop in services/process sections | Phase C |

### Tier 2 — Viable After Quality Audit (src/scene/index.js integration)

| Asset | Condition | Target Use | Phase |
|-------|-----------|-----------|-------|
| `source/HAMMER.glb` | Pass quality audit vs hero-pack-v5 | Hero prop replacement/supplement | Phase A0 |
| `source/AXE.glb` | Pass quality audit | Alternative hero prop | Phase A0 |
| `source/Spanner.glb` | Pass quality audit (missing roughness texture) | Support prop | Phase A0 |
| `pbr_rivet_gun.glb` | Texture conversion (spec/gloss → metallic/roughness) | Industrial focal prop, services section | Phase B |

### Tier 3 — Viable After gltf-transform Processing

| Asset | Processing Target | Target Use | Phase |
|-------|------------------|-----------|-------|
| `workshop.glb` → `workshop-bg.glb` | ≤5 MB | Background environment, services section | Phase C |
| `building_workshop_parking_workshop.glb` → processed | ≤3 MB | Sectional backdrop silhouette | Phase C |
| `building_metallic_protective_fence_low_poly.glb` → processed | ≤2 MB | Foreground parallax layer | Phase C |
| `basement_studio_record3d.glb` → processed | ≤2 MB | Atmospheric depth layer | Phase D |

### Tier 4 — Experimental Research Only

| Asset | Feasibility Check | Target |
|-------|-------------------|--------|
| `xr_studio_*_v_point.glb` (47 MB) | Vertex position extraction | Particle system positions source |
| `body_traces_warsaw.glb` (23 MB) | LOD reduction | Abstract wireframe depth |

### Tier 5 — Do Not Use in Production

- `gottwaig` (308 MB), `hyperspace` (213 MB), `xr_boehmsdorf` (251 MB)
- May be referenced as artistic inspiration only.

---

## Asset Analysis Tasks

- [ ] **A0-1** — Load HAMMER, AXE, Spanner in Three.js dev scene. Compare quality vs hero-pack-v5 GLBs. Determine replacement or supplemental role.
- [ ] **A0-2** — Process `workshop.glb` via `scripts/process-3dmodels.mjs` targeting ≤5 MB. Assess `building_workshop_parking_workshop.glb` for backdrop.
- [ ] **A0-3** — Extract vertex positions from `xr_studio_*_v_point.glb` (47 MB variant, smaller) to JSON/Float32Array. Compare vs procedural particle generation tradeoff.
- [ ] **A0-4** — Convert rivet gun textures from spec/gloss to metallic/roughness. Assess KTX2 compression for all PBR textures.
- [ ] **A0-5** — *(This document)* — Asset utilization decision document. ✓ Complete (pending A0-1 through A0-4 runtime verification).

---

## File Size Budget

| Category | Budget |
|----------|--------|
| Hero tool models (combined) | ≤12 MB (current bespoke pack baseline) |
| Environmental background (processed) | ≤5 MB per section |
| Foreground props | ≤1 MB each |
| Point-cloud particle data (JSON) | ≤2 MB |
| All runtime 3D assets combined | ≤25 MB |

---

## Notes

- The `@gltf-transform/core` and `@gltf-transform/extensions` packages are already installed as devDependencies — no new tooling required.
- Texture compression to KTX2 requires Basis Universal encoder (`ktx2-encoder` or `@gltf-transform/extensions` KHR_texture_basisu).
- All processing scripts go in `scripts/process-3dmodels.mjs`.
