/**
 * scripts/process-all-environment-assets.mjs
 *
 * Batch GLB optimization pipeline for cinematic world system environment assets.
 * Uses @gltf-transform/core to simplify, deduplicate, and prune large source GLBs
 * into web-ready sizes suitable for progressive loading.
 *
 * Usage:
 *   node scripts/process-all-environment-assets.mjs [--dry-run] [--force]
 *
 * Output:
 *   assets/models/environment/<name>-optimized.glb
 *   assets/models/environment/environment-asset-manifest.json
 */

import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { NodeIO } from '@gltf-transform/core';
import { KHRONOS_EXTENSIONS } from '@gltf-transform/extensions';
import { dedup, prune, quantize } from '@gltf-transform/functions';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const SOURCE_DIR = path.join(ROOT_DIR, 'assets', '3dmodels');
const OUTPUT_DIR = path.join(ROOT_DIR, 'assets', 'models', 'environment');
const MANIFEST_PATH = path.join(OUTPUT_DIR, 'environment-asset-manifest.json');

const DRY_RUN = process.argv.includes('--dry-run');
const FORCE = process.argv.includes('--force');

/**
 * Asset processing specifications.
 * Each entry maps a source GLB to its target role and optimization parameters.
 */
const ASSET_SPECS = [
  {
    source: 'workshop.glb',
    output: 'workshop-optimized.glb',
    role: 'ACT 2 & 9: Workshop environment',
    targetSizeMB: 4,
    quantizeBits: 10,
  },
  {
    source: 'industrial_toolbox.glb',
    output: 'toolbox-optimized.glb',
    role: 'ACT 2: Detailed toolbox',
    targetSizeMB: 1,
    quantizeBits: 10,
  },
  {
    source: 'building_metallic_protective_fence_low_poly.glb',
    output: 'fence-optimized.glb',
    role: 'ACT 2: Structural framing',
    targetSizeMB: 1.5,
    quantizeBits: 10,
  },
  {
    source: 'pbr_rivet_gun.glb',
    output: 'rivet-gun-optimized.glb',
    role: 'ACT 4: Precision tool prop',
    targetSizeMB: 0.8,
    quantizeBits: 12,
  },
  {
    source: 'building_workshop_parking_workshop.glb',
    output: 'building-exterior-optimized.glb',
    role: 'ACT 5: Completed project exterior',
    targetSizeMB: 2,
    quantizeBits: 10,
  },
  {
    source: 'basement-studio_record3d_-_xars_hyperobjekt.glb',
    output: 'studio-pointcloud-optimized.glb',
    role: 'ACT 6: Origin story point cloud',
    targetSizeMB: 3,
    quantizeBits: 8,
  },
  {
    source: 'body_traces_-_warsaw_3d_map_xi.glb',
    output: 'body-traces-optimized.glb',
    role: 'ACT 6: Human element traces',
    targetSizeMB: 4,
    quantizeBits: 8,
  },
  {
    source: 'xr_studio_-_space_is_more_than_a_surface_v_point.glb',
    output: 'testimony-pointcloud-optimized.glb',
    role: 'ACT 7: Testimony ambient space',
    targetSizeMB: 6,
    quantizeBits: 8,
  },
  {
    source: 'every_point_studio_-_xars_hyperobjekt_231220.glb',
    output: 'ambient-pointcloud-optimized.glb',
    role: 'ACT 7: Secondary ambient',
    targetSizeMB: 5,
    quantizeBits: 8,
  },
];

// Lightweight assets that are already small enough — just copy with dedup/prune
const COPY_SPECS = [
  {
    source: 'wireframe_3d_globe.glb',
    output: 'wireframe-globe.glb',
    role: 'ACT 5: Gallery centerpiece',
  },
  {
    source: 'paradox_abstract_art_of_python.glb',
    output: 'abstract-geometry.glb',
    role: 'ACT 3: Rhetoric floating geometry',
  },
  {
    source: 'looking_glass_hologram_technology_meet_art.glb',
    output: 'hologram-form.glb',
    role: 'ACT 3: Rhetoric holographic element',
  },
  {
    source: 'downtown_chicago_wireframe_map.glb',
    output: 'wireframe-map.glb',
    role: 'ACT 4: Process blueprint wireframe',
  },
];

function sha256(buffer) {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

async function processAsset(spec, io) {
  const sourcePath = path.join(SOURCE_DIR, spec.source);
  const outputPath = path.join(OUTPUT_DIR, spec.output);

  // Check source exists
  try {
    await fs.access(sourcePath);
  } catch {
    console.warn(`  ⚠ Source not found: ${spec.source} — skipping`);
    return null;
  }

  // Check if output already exists (skip unless --force)
  if (!FORCE) {
    try {
      await fs.access(outputPath);
      const stat = await fs.stat(outputPath);
      console.log(`  ✓ Already exists: ${spec.output} (${formatBytes(stat.size)}) — use --force to rebuild`);
      const data = await fs.readFile(outputPath);
      return {
        file: spec.output,
        role: spec.role,
        size: stat.size,
        sha256: sha256(data),
      };
    } catch { /* doesn't exist — proceed */ }
  }

  if (DRY_RUN) {
    const stat = await fs.stat(sourcePath);
    console.log(`  [DRY RUN] Would process: ${spec.source} (${formatBytes(stat.size)}) → ${spec.output}`);
    return null;
  }

  console.log(`  Processing: ${spec.source} → ${spec.output}`);
  const startTime = Date.now();

  const doc = await io.read(sourcePath);
  const transforms = [dedup(), prune()];

  if (spec.quantizeBits) {
    transforms.push(quantize({ quantizePosition: spec.quantizeBits, quantizeNormal: 8 }));
  }

  await doc.transform(...transforms);
  await io.write(outputPath, doc);

  const outputData = await fs.readFile(outputPath);
  const elapsed = Date.now() - startTime;
  const sourceStat = await fs.stat(sourcePath);

  console.log(
    `  ✓ ${spec.output}: ${formatBytes(sourceStat.size)} → ${formatBytes(outputData.length)} ` +
    `(${((1 - outputData.length / sourceStat.size) * 100).toFixed(1)}% reduction) [${elapsed}ms]`
  );

  if (spec.targetSizeMB && outputData.length > spec.targetSizeMB * 1024 * 1024) {
    console.warn(
      `  ⚠ Output (${formatBytes(outputData.length)}) exceeds target (${spec.targetSizeMB} MB) — ` +
      `may need manual simplification or meshopt compression`
    );
  }

  return {
    file: spec.output,
    role: spec.role,
    size: outputData.length,
    sha256: sha256(outputData),
    sourceSize: sourceStat.size,
    reductionPct: ((1 - outputData.length / sourceStat.size) * 100).toFixed(1),
    processedAt: new Date().toISOString(),
  };
}

async function copyAsset(spec, io) {
  const sourcePath = path.join(SOURCE_DIR, spec.source);
  const outputPath = path.join(OUTPUT_DIR, spec.output);

  try {
    await fs.access(sourcePath);
  } catch {
    console.warn(`  ⚠ Source not found: ${spec.source} — skipping`);
    return null;
  }

  if (!FORCE) {
    try {
      await fs.access(outputPath);
      const stat = await fs.stat(outputPath);
      console.log(`  ✓ Already exists: ${spec.output} (${formatBytes(stat.size)})`);
      const data = await fs.readFile(outputPath);
      return { file: spec.output, role: spec.role, size: stat.size, sha256: sha256(data) };
    } catch { /* proceed */ }
  }

  if (DRY_RUN) {
    console.log(`  [DRY RUN] Would copy+optimize: ${spec.source} → ${spec.output}`);
    return null;
  }

  console.log(`  Copying: ${spec.source} → ${spec.output}`);
  const doc = await io.read(sourcePath);
  await doc.transform(dedup(), prune());
  await io.write(outputPath, doc);

  const data = await fs.readFile(outputPath);
  return { file: spec.output, role: spec.role, size: data.length, sha256: sha256(data) };
}

async function main() {
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║  Environment Asset Pipeline — Cinematic World System        ║');
  console.log('╚══════════════════════════════════════════════════════════════╝');
  console.log();

  // Ensure output directory exists
  await fs.mkdir(OUTPUT_DIR, { recursive: true });

  // Also copy the lightweight source toolbox assembly
  const toolboxSourcePath = path.join(ROOT_DIR, 'assets', '3dmodels', 'source', 'tool--box-assy-33.glb');
  const toolboxOutputPath = path.join(OUTPUT_DIR, 'toolbox-assembly.glb');

  const io = new NodeIO().registerExtensions(KHRONOS_EXTENSIONS);
  const manifest = { version: 'environment-v1', processedAt: new Date().toISOString(), assets: [] };

  // Process heavy assets
  console.log('━━ Heavy Assets (dedup + prune + quantize) ━━');
  for (const spec of ASSET_SPECS) {
    try {
      const result = await processAsset(spec, io);
      if (result) manifest.assets.push(result);
    } catch (err) {
      console.error(`  ✗ Failed: ${spec.source} — ${err.message}`);
    }
  }

  console.log();
  console.log('━━ Lightweight Assets (dedup + prune) ━━');
  for (const spec of COPY_SPECS) {
    try {
      const result = await copyAsset(spec, io);
      if (result) manifest.assets.push(result);
    } catch (err) {
      console.error(`  ✗ Failed: ${spec.source} — ${err.message}`);
    }
  }

  // Copy toolbox assembly if it exists
  try {
    await fs.access(toolboxSourcePath);
    if (!DRY_RUN) {
      await fs.copyFile(toolboxSourcePath, toolboxOutputPath);
      const data = await fs.readFile(toolboxOutputPath);
      manifest.assets.push({
        file: 'toolbox-assembly.glb',
        role: 'ACT 9: Workshop intimate prop',
        size: data.length,
        sha256: sha256(data),
      });
      console.log(`  ✓ Copied: tool--box-assy-33.glb → toolbox-assembly.glb (${formatBytes(data.length)})`);
    }
  } catch {
    console.warn('  ⚠ tool--box-assy-33.glb not found — skipping');
  }

  // Write manifest
  if (!DRY_RUN) {
    await fs.writeFile(MANIFEST_PATH, JSON.stringify(manifest, null, 2));
    console.log();
    console.log(`✓ Manifest written: ${MANIFEST_PATH}`);
    console.log(`  ${manifest.assets.length} assets processed`);
    const totalSize = manifest.assets.reduce((sum, a) => sum + (a.size || 0), 0);
    console.log(`  Total output: ${formatBytes(totalSize)}`);
  }
}

main().catch(err => {
  console.error('Pipeline failed:', err);
  process.exit(1);
});
