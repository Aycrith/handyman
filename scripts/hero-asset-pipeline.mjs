import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { Accessor, Document, NodeIO } from '@gltf-transform/core';

import { HERO_BUILD_ORDER } from '../assets/models/hero/source/index.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const HERO_DIR = path.join(ROOT_DIR, 'assets', 'models', 'hero');
const MANIFEST_PATH = path.join(HERO_DIR, 'HERO-ASSET-MANIFEST.json');
const CONTRACT_VERSION = 'hero-asset-contract-v3';
const ASSET_SET_VERSION = 'hero-pack-v4';
const FINAL_VARIANT = 'final';

const LEGACY_PATHS = Object.freeze({
  wrench: path.join(ROOT_DIR, 'assets', 'models', 'pipe-wrench.glb'),
  hammer: null,
  saw: path.join(ROOT_DIR, 'assets', 'models', 'handsaw.glb'),
});

const EXTERNAL_TOOLS = Object.freeze({
  hammer: {
    id: 'hammer',
    file: 'hero-claw-hammer.glb',
    sourceFile: path.join(HERO_DIR, 'external', 'wooden_hammer_01', 'wooden_hammer_01_1k.gltf'),
    processedFrom: 'assets/models/hero/external/wooden_hammer_01/wooden_hammer_01_1k.gltf',
    sourceUrl: 'https://polyhaven.com/a/wooden_hammer_01',
    license: 'CC0',
    attribution: 'Wooden Hammer 01 by James Ray Cock via Poly Haven',
    pivotOffset: [0, 0, 0],
    silhouetteProfile: 'wooden-hammer-orbit-support',
    materialTokens: ['steel', 'wood', 'accent'],
    dimensions: {
      width: 1.12,
      height: 2.36,
      depth: 0.34,
    },
    pivotOrigin: {
      mode: 'authored-origin',
      description: 'Authored origin preserved for balanced orbit support placement.',
      coordinates: [0, 0, 0],
    },
    calibration: {
      targetSize: 2.2,
      originMode: 'authored-origin',
      compositionRole: 'orbit-support',
      supportLightPrivilege: 0.76,
    },
    status: 'support-runtime',
    heroRole: 'support',
  },
  wrench: {
    id: 'wrench',
    file: 'hero-pipe-wrench.glb',
    sourceFile: path.join(HERO_DIR, 'external', 'pipe_wrench', 'pipe_wrench_1k.gltf'),
    processedFrom: 'assets/models/hero/external/pipe_wrench/pipe_wrench_1k.gltf',
    sourceUrl: 'https://polyhaven.com/a/pipe_wrench',
    license: 'CC0',
    attribution: 'Pipe Wrench by Will Evarts via Poly Haven',
    pivotOffset: [0.020, 0.108, 0.0],
    silhouetteProfile: 'pipe-wrench-workshop-hero',
    materialTokens: ['steel', 'dark_metal', 'accent', 'grip'],
    dimensions: {
      width: 0.457,
      height: 2.2,
      depth: 0.187,
    },
    pivotOrigin: {
      mode: 'grip-balance-point',
      description: 'Adjusted from the external source so the origin sits near the grip balance point.',
      coordinates: [0, 0, 0],
    },
    calibration: {
      targetSize: 2.2,
      originMode: 'authored-origin',
      compositionRole: 'hero-dominant',
      heroLightPrivilege: 1,
      seamAnchor: [0.02, 0.96, 0.05],
    },
    status: 'final-runtime',
    heroRole: 'primary',
  },
  saw: {
    id: 'saw',
    file: 'hero-handsaw.glb',
    sourceFile: path.join(HERO_DIR, 'external', 'handsaw_wood', 'handsaw_wood_1k.gltf'),
    processedFrom: 'assets/models/hero/external/handsaw_wood/handsaw_wood_1k.gltf',
    sourceUrl: 'https://polyhaven.com/a/handsaw_wood',
    license: 'CC0',
    attribution: 'Handsaw Wood by Konrad Szalankiewicz via Poly Haven',
    pivotOffset: [0, 0, 0],
    silhouetteProfile: 'handsaw-wood-orbit-support',
    materialTokens: ['steel', 'wood', 'accent'],
    dimensions: {
      width: 2.18,
      height: 0.92,
      depth: 0.12,
    },
    pivotOrigin: {
      mode: 'authored-origin',
      description: 'Authored origin preserved for tangential orbit alignment.',
      coordinates: [0, 0, 0],
    },
    calibration: {
      targetSize: 2.18,
      originMode: 'authored-origin',
      compositionRole: 'orbit-support',
      supportLightPrivilege: 0.70,
    },
    status: 'support-runtime',
    heroRole: 'support',
  },
});

const MATERIAL_SWATCHES = Object.freeze({
  steel: { baseColor: [0.78, 0.80, 0.82, 1.0], metallic: 1.0, roughness: 0.34 },
  blackened_steel: { baseColor: [0.19, 0.20, 0.23, 1.0], metallic: 1.0, roughness: 0.52 },
  rubber: { baseColor: [0.08, 0.08, 0.09, 1.0], metallic: 0.02, roughness: 0.92 },
  brass: { baseColor: [0.69, 0.54, 0.29, 1.0], metallic: 1.0, roughness: 0.40 },
  ember_core: { baseColor: [0.20, 0.10, 0.05, 1.0], metallic: 0.04, roughness: 0.32, emissive: [0.95, 0.56, 0.17] },
});

function round(value, digits = 6) {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function toArrayBufferView(value) {
  if (value instanceof Uint8Array) return value;
  if (Buffer.isBuffer(value)) return new Uint8Array(value.buffer, value.byteOffset, value.byteLength);
  return new Uint8Array(value);
}

function sha256Hex(value) {
  return crypto.createHash('sha256').update(toArrayBufferView(value)).digest('hex');
}

async function fileSha256(filePath) {
  try {
    const data = await fs.readFile(filePath);
    return sha256Hex(data);
  } catch {
    return '';
  }
}

function stableJson(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function eulerToQuaternion([x, y, z]) {
  const cx = Math.cos(x * 0.5);
  const sx = Math.sin(x * 0.5);
  const cy = Math.cos(y * 0.5);
  const sy = Math.sin(y * 0.5);
  const cz = Math.cos(z * 0.5);
  const sz = Math.sin(z * 0.5);
  return [
    round(sx * cy * cz - cx * sy * sz),
    round(cx * sy * cz + sx * cy * sz),
    round(cx * cy * sz - sx * sy * cz),
    round(cx * cy * cz + sx * sy * sz),
  ];
}

function subtract(a, b) {
  return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
}

function cross(a, b) {
  return [
    a[1] * b[2] - a[2] * b[1],
    a[2] * b[0] - a[0] * b[2],
    a[0] * b[1] - a[1] * b[0],
  ];
}

function normalize(vector) {
  const length = Math.hypot(vector[0], vector[1], vector[2]) || 1;
  return [vector[0] / length, vector[1] / length, vector[2] / length];
}

function buildFaceGeometry(faces) {
  const positions = [];
  const normals = [];
  const indices = [];
  let cursor = 0;

  for (const face of faces) {
    if (!Array.isArray(face) || face.length < 3) continue;
    const normal = normalize(cross(subtract(face[1], face[0]), subtract(face[2], face[0])));
    for (let index = 1; index < face.length - 1; index += 1) {
      const triangle = [face[0], face[index], face[index + 1]];
      for (const vertex of triangle) {
        positions.push(round(vertex[0]), round(vertex[1]), round(vertex[2]));
        normals.push(round(normal[0]), round(normal[1]), round(normal[2]));
        indices.push(cursor);
        cursor += 1;
      }
    }
  }

  return {
    positions: new Float32Array(positions),
    normals: new Float32Array(normals),
    indices: new Uint16Array(indices),
  };
}

function boxFaces(width, height, depth) {
  const hw = width / 2;
  const hh = height / 2;
  const hd = depth / 2;
  const ftl = [-hw, hh, hd];
  const ftr = [hw, hh, hd];
  const fbl = [-hw, -hh, hd];
  const fbr = [hw, -hh, hd];
  const btl = [-hw, hh, -hd];
  const btr = [hw, hh, -hd];
  const bbl = [-hw, -hh, -hd];
  const bbr = [hw, -hh, -hd];
  return [
    [ftl, ftr, fbr, fbl],
    [btr, btl, bbl, bbr],
    [btl, ftl, fbl, bbl],
    [ftr, btr, bbr, fbr],
    [btl, btr, ftr, ftl],
    [fbl, fbr, bbr, bbl],
  ];
}

function taperedBoxFaces(widthBottom, widthTop, depthBottom, depthTop, height) {
  const yTop = height / 2;
  const yBottom = -height / 2;
  const bottom = [
    [-widthBottom / 2, yBottom, depthBottom / 2],
    [widthBottom / 2, yBottom, depthBottom / 2],
    [widthBottom / 2, yBottom, -depthBottom / 2],
    [-widthBottom / 2, yBottom, -depthBottom / 2],
  ];
  const top = [
    [-widthTop / 2, yTop, depthTop / 2],
    [widthTop / 2, yTop, depthTop / 2],
    [widthTop / 2, yTop, -depthTop / 2],
    [-widthTop / 2, yTop, -depthTop / 2],
  ];
  return [
    [top[0], top[1], bottom[1], bottom[0]],
    [top[1], top[2], bottom[2], bottom[1]],
    [top[2], top[3], bottom[3], bottom[2]],
    [top[3], top[0], bottom[0], bottom[3]],
    [top[3], top[2], top[1], top[0]],
    [bottom[0], bottom[1], bottom[2], bottom[3]],
  ];
}

function cylinderFaces(radiusTop, radiusBottom, height, segments) {
  const yTop = height / 2;
  const yBottom = -height / 2;
  const top = [];
  const bottom = [];
  for (let index = 0; index < segments; index += 1) {
    const angle = (index / segments) * Math.PI * 2;
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    top.push([round(cos * radiusTop), yTop, round(sin * radiusTop)]);
    bottom.push([round(cos * radiusBottom), yBottom, round(sin * radiusBottom)]);
  }

  const faces = [];
  for (let index = 0; index < segments; index += 1) {
    const next = (index + 1) % segments;
    faces.push([top[index], top[next], bottom[next], bottom[index]]);
  }
  faces.push([...top].reverse());
  faces.push([...bottom]);
  return faces;
}

function extrudedPolygonFaces(points, depth) {
  const halfDepth = depth / 2;
  const front = points.map(([x, y]) => [x, y, halfDepth]);
  const back = points.map(([x, y]) => [x, y, -halfDepth]);
  const faces = [front, [...back].reverse()];
  for (let index = 0; index < points.length; index += 1) {
    const next = (index + 1) % points.length;
    faces.push([front[index], front[next], back[next], back[index]]);
  }
  return faces;
}

function createGeometry(part) {
  switch (part.kind) {
    case 'box':
      return buildFaceGeometry(boxFaces(part.size[0], part.size[1], part.size[2]));
    case 'taperedBox':
      return buildFaceGeometry(
        taperedBoxFaces(part.widthBottom, part.widthTop, part.depthBottom, part.depthTop, part.height)
      );
    case 'cylinder':
      return buildFaceGeometry(cylinderFaces(part.radiusTop, part.radiusBottom, part.height, part.segments || 12));
    case 'extrudedPolygon':
      return buildFaceGeometry(extrudedPolygonFaces(part.points, part.depth));
    default:
      throw new Error(`Unsupported geometry kind: ${part.kind}`);
  }
}

function createAccessor(doc, buffer, name, type, array) {
  return doc.createAccessor(name, buffer).setType(type).setArray(array);
}

function createMaterial(doc, role) {
  const swatch = MATERIAL_SWATCHES[role] || MATERIAL_SWATCHES.steel;
  const material = doc.createMaterial(role);
  material.setBaseColorFactor(swatch.baseColor);
  material.setMetallicFactor(swatch.metallic);
  material.setRoughnessFactor(swatch.roughness);
  if (swatch.emissive) {
    material.setEmissiveFactor(swatch.emissive);
  }
  return material;
}

async function buildDescriptorGlb(descriptor) {
  const doc = new Document();
  doc.getRoot().getAsset().generator = 'handyman-hero-asset-pipeline';
  const buffer = doc.createBuffer('hero-buffer');
  const materials = new Map();
  const rootNode = doc.createNode(`hero_${descriptor.id}_root`);
  const scene = doc.createScene(`hero_${descriptor.id}_scene`);
  scene.addChild(rootNode);
  doc.getRoot().setDefaultScene(scene);

  for (const part of descriptor.parts) {
    const geometry = createGeometry(part);
    const primitive = doc.createPrimitive();
    primitive.setAttribute('POSITION', createAccessor(doc, buffer, `${part.name}_positions`, Accessor.Type.VEC3, geometry.positions));
    primitive.setAttribute('NORMAL', createAccessor(doc, buffer, `${part.name}_normals`, Accessor.Type.VEC3, geometry.normals));
    primitive.setIndices(createAccessor(doc, buffer, `${part.name}_indices`, Accessor.Type.SCALAR, geometry.indices));
    if (!materials.has(part.role)) {
      materials.set(part.role, createMaterial(doc, part.role));
    }
    primitive.setMaterial(materials.get(part.role));

    const mesh = doc.createMesh(part.name);
    mesh.addPrimitive(primitive);

    const node = doc.createNode(part.name);
    node.setMesh(mesh);
    if (part.translation) {
      node.setTranslation(part.translation.map((value) => round(value)));
    }
    if (part.rotationEuler) {
      node.setRotation(eulerToQuaternion(part.rotationEuler));
    }
    if (part.scale) {
      node.setScale(part.scale.map((value) => round(value)));
    }
    rootNode.addChild(node);
  }

  const io = new NodeIO();
  return io.writeBinary(doc);
}

async function buildExternalToolGlb(toolConfig) {
  const io = new NodeIO();
  const doc = await io.read(toolConfig.sourceFile);
  const root = doc.getRoot();
  root.getAsset().generator = 'handyman-hero-asset-pipeline';
  const scene = root.getDefaultScene() || root.listScenes()[0];
  if (!scene) throw new Error(`Missing default scene in external ${toolConfig.id} source.`);

  const nodes = scene.listChildren();
  if (!nodes.length) throw new Error(`Missing mesh node in external ${toolConfig.id} source.`);

  const primaryNode = nodes[0];
  primaryNode.setName(`hero_${toolConfig.id}`);
  primaryNode.setTranslation(toolConfig.pivotOffset.map((value) => round(value)));
  primaryNode.setRotation([0, 0, 0, 1]);
  primaryNode.setScale([1, 1, 1]);

  if (primaryNode.getMesh()) {
    primaryNode.getMesh().setName(`hero_${toolConfig.id}_mesh`);
  }

  root.listMaterials().forEach((material, index) => {
    material.setName(index === 0 ? `${toolConfig.id}_material_1` : `${toolConfig.id}_material_${index + 1}`);
  });

  return io.writeBinary(doc);
}

function buildStageFromTools(tools) {
  const allExternal = HERO_BUILD_ORDER.every((toolId) => tools[toolId]?.provenance === 'external-processed');
  if (allExternal) {
    return 'assembly-orbit-external-support';
  }
  const primary = tools.wrench;
  if (primary?.provenance === 'external-processed') {
    return 'single-hero-external';
  }
  return 'fallback';
}

async function buildManifest(outputs) {
  const tools = {};
  for (const toolId of HERO_BUILD_ORDER) {
    const output = outputs[toolId];
    const legacySha256 = LEGACY_PATHS[toolId] ? await fileSha256(LEGACY_PATHS[toolId]) : '';
    const toolConfig = EXTERNAL_TOOLS[toolId];
    const entry = {
      file: toolConfig.file,
      sha256: output.sha256,
      status: toolConfig.status,
      provenance: 'external-processed',
      sourceUrl: toolConfig.sourceUrl,
      license: toolConfig.license,
      attribution: toolConfig.attribution,
      processedFrom: toolConfig.processedFrom,
      heroRole: toolConfig.heroRole,
      silhouetteProfile: toolConfig.silhouetteProfile,
      dimensions: toolConfig.dimensions,
      materialTokens: toolConfig.materialTokens,
      pivotOrigin: toolConfig.pivotOrigin,
      calibration: toolConfig.calibration,
    };

    if (legacySha256) {
      entry.legacySha256 = legacySha256;
    }
    tools[toolId] = entry;
  }

  return {
    assetSetVersion: ASSET_SET_VERSION,
    variant: FINAL_VARIANT,
    contractVersion: CONTRACT_VERSION,
    buildStage: buildStageFromTools(tools),
    tools,
  };
}

export async function generateHeroPack({ write = false } = {}) {
  const outputs = {};
  for (const toolId of HERO_BUILD_ORDER) {
    const toolConfig = EXTERNAL_TOOLS[toolId];
    const buffer = await buildExternalToolGlb(toolConfig);

    outputs[toolId] = {
      file: toolConfig.file,
      buffer,
      sha256: sha256Hex(buffer),
    };
  }

  const manifest = await buildManifest(outputs);
  const manifestText = stableJson(manifest);

  if (write) {
    await fs.mkdir(HERO_DIR, { recursive: true });
    for (const toolId of HERO_BUILD_ORDER) {
      const output = outputs[toolId];
      await fs.writeFile(path.join(HERO_DIR, output.file), Buffer.from(output.buffer));
    }
    await fs.writeFile(MANIFEST_PATH, manifestText, 'utf8');
  }

  return { outputs, manifest, manifestText };
}

function compareObjects(a, b) {
  return stableJson(a) === stableJson(b);
}

export async function verifyHeroPack() {
  const generated = await generateHeroPack({ write: false });
  let existingManifest = null;
  try {
    existingManifest = JSON.parse(await fs.readFile(MANIFEST_PATH, 'utf8'));
  } catch {
    existingManifest = null;
  }

  const toolResults = {};
  let filesMatch = true;
  for (const toolId of HERO_BUILD_ORDER) {
    const output = generated.outputs[toolId];
    const file = output.file;
    const filePath = path.join(HERO_DIR, file);
    let actualBuffer = null;
    try {
      actualBuffer = await fs.readFile(filePath);
    } catch {
      actualBuffer = null;
      filesMatch = false;
    }

    const actualSha = actualBuffer ? sha256Hex(actualBuffer) : '';
    const expectedSha = output.sha256;
    const fileMatches = !!actualBuffer && actualSha === expectedSha;
    filesMatch &&= fileMatches;

    toolResults[toolId] = {
      expectedSha256: expectedSha,
      actualSha256: actualSha,
      fileMatches,
      provenance: generated.manifest.tools[toolId].provenance,
      heroRole: generated.manifest.tools[toolId].heroRole,
      license: generated.manifest.tools[toolId].license,
    };
  }

  const manifestMatches = !!existingManifest && compareObjects(existingManifest, generated.manifest);
  return {
    ok: filesMatch && manifestMatches,
    stage: generated.manifest.buildStage,
    variant: generated.manifest.variant,
    manifestMatches,
    toolResults,
    manifest: generated.manifest,
  };
}

export { ASSET_SET_VERSION, CONTRACT_VERSION, FINAL_VARIANT, MANIFEST_PATH, HERO_DIR };
