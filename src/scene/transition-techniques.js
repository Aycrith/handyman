/**
 * src/scene/transition-techniques.js
 *
 * Reusable transition technique implementations.
 * Each technique is a factory that returns a techniqueImpl function
 * compatible with TransitionSeq.
 *
 * Techniques:
 *   1. FogFlythrough       — Fog wall sweeps between scenes (uses fog-plane shaders)
 *   2. ParticleDissolve    — Geometry dissolves to particles that reform
 *   3. WireframeMorph      — Surfaces crossfade to wireframe representation
 *   4. PointCloudMorph     — Point cloud position/color attribute morph
 *   5. BloomCrossfade      — Atmospheric bloom intensity ramp
 */

const THREE = window.THREE;

// Import shader sources inline (Vite handles ?raw imports but these are
// loaded at runtime inside the scene IIFE, so we inline the essentials).
// The full shaders live in src/scene/shaders/ — we reference their uniform
// interfaces here without duplicating the source.

import { clamp01, lerp, easeInOutPower2, easeOutExpo } from './world-manager.js';

// ── Shared Utilities ───────────────────────────────────────────────────────

/** Sample vertex positions from a Three.js mesh for particle targets */
function sampleMeshVertices(mesh, count) {
  const geometry = mesh.geometry;
  const posAttr = geometry.attributes.position;
  const totalVerts = posAttr.count;
  const positions = new Float32Array(count * 3);

  for (let i = 0; i < count; i++) {
    const srcIdx = (i * totalVerts / count) | 0;
    positions[i * 3] = posAttr.getX(srcIdx);
    positions[i * 3 + 1] = posAttr.getY(srcIdx);
    positions[i * 3 + 2] = posAttr.getZ(srcIdx);
  }
  return positions;
}

/** Collect all vertex positions from a Group's descendant meshes */
function collectGroupVertices(group, maxCount) {
  const allPositions = [];
  group.traverse((child) => {
    if (child.isMesh && child.geometry?.attributes?.position) {
      const pos = child.geometry.attributes.position;
      const worldMatrix = child.matrixWorld;
      const vec = new THREE.Vector3();
      for (let i = 0; i < pos.count; i++) {
        vec.set(pos.getX(i), pos.getY(i), pos.getZ(i));
        vec.applyMatrix4(worldMatrix);
        allPositions.push(vec.x, vec.y, vec.z);
      }
    }
  });

  const count = Math.min(maxCount, allPositions.length / 3);
  const result = new Float32Array(count * 3);
  const step = allPositions.length / 3 / count;
  for (let i = 0; i < count; i++) {
    const srcIdx = Math.floor(i * step) * 3;
    result[i * 3] = allPositions[srcIdx];
    result[i * 3 + 1] = allPositions[srcIdx + 1];
    result[i * 3 + 2] = allPositions[srcIdx + 2];
  }
  return result;
}

function getMaterialList(material) {
  if (Array.isArray(material)) return material.filter(Boolean);
  return material ? [material] : [];
}

function rememberMaterialStates(materialStateMap, material) {
  getMaterialList(material).forEach((entry) => {
    if (!materialStateMap.has(entry)) {
      materialStateMap.set(entry, {
        transparent: entry.transparent,
        opacity: typeof entry.opacity === 'number' ? entry.opacity : 1,
      });
    }
  });
}

function restoreMaterialStates(materialStateMap, material) {
  getMaterialList(material).forEach((entry) => {
    const state = materialStateMap.get(entry);
    if (!state) return;
    if ('transparent' in entry) entry.transparent = state.transparent;
    if ('opacity' in entry && typeof state.opacity === 'number') {
      entry.opacity = state.opacity;
    }
  });
}

function setMaterialOpacity(material, opacity) {
  getMaterialList(material).forEach((entry) => {
    if ('opacity' in entry) entry.opacity = opacity;
  });
}

function setMaterialTransparent(material, transparent) {
  getMaterialList(material).forEach((entry) => {
    if ('transparent' in entry) entry.transparent = transparent;
  });
}

// ── 1. Fog Flythrough Transition ───────────────────────────────────────────
/**
 * Creates a fog wall that sweeps between scenes.
 *
 * @param {object} config
 * @param {THREE.Color|object} config.fogColor — Fog color {r,g,b} or THREE.Color
 * @param {number} config.maxDensity — Peak fog density (0-1, default 0.92)
 * @param {number} config.noiseScale — Noise pattern scale (default 3.5)
 * @param {number} config.noiseSpeed — Noise animation speed (default 0.4)
 * @param {number} config.fadeEdge — Edge feathering width (default 0.08)
 * @param {number} config.fogPlaneZ — Z position of fog plane (default 2.0)
 * @returns {object} { init, update, dispose }
 */
function createFogFlythrough(config = {}) {
  const fogColor = config.fogColor || { r: 0.03, g: 0.04, b: 0.06 };
  const maxDensity = config.maxDensity ?? 0.92;
  const noiseScale = config.noiseScale ?? 3.5;
  const noiseSpeed = config.noiseSpeed ?? 0.4;
  const fadeEdge = config.fadeEdge ?? 0.08;
  const fogPlaneZ = config.fogPlaneZ ?? 2.0;

  let fogMesh = null;
  let fogMaterial = null;
  let startTime = 0;

  function init(scene) {
    const geometry = new THREE.PlaneGeometry(20, 12);

    fogMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uDensity: { value: 0.0 },
        uColor: { value: new THREE.Vector3(fogColor.r, fogColor.g, fogColor.b) },
        uScrollT: { value: 0.0 },
        uNoiseScale: { value: noiseScale },
        uNoiseSpeed: { value: noiseSpeed },
        uTime: { value: 0.0 },
        uFadeEdge: { value: fadeEdge },
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float uDensity;
        uniform vec3 uColor;
        uniform float uScrollT;
        uniform float uNoiseScale;
        uniform float uNoiseSpeed;
        uniform float uTime;
        uniform float uFadeEdge;
        varying vec2 vUv;

        vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
        vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
        vec3 permute(vec3 x) { return mod289(((x * 34.0) + 1.0) * x); }

        float snoise(vec2 v) {
          const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
          vec2 i = floor(v + dot(v, C.yy));
          vec2 x0 = v - i + dot(i, C.xx);
          vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
          vec4 x12 = x0.xyxy + C.xxzz;
          x12.xy -= i1;
          i = mod289(i);
          vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
          vec3 m = max(0.5 - vec3(dot(x0, x0), dot(x12.xy, x12.xy), dot(x12.zw, x12.zw)), 0.0);
          m = m * m; m = m * m;
          vec3 x = 2.0 * fract(p * C.www) - 1.0;
          vec3 h = abs(x) - 0.5;
          vec3 ox = floor(x + 0.5);
          vec3 a0 = x - ox;
          m *= 1.79284291400159 - 0.85373472095314 * (a0 * a0 + h * h);
          vec3 g;
          g.x = a0.x * x0.x + h.x * x0.y;
          g.yz = a0.yz * x12.xz + h.yz * x12.yw;
          return 130.0 * dot(m, g);
        }

        float fbm(vec2 p) {
          float sum = 0.0; float amp = 0.5; float freq = 1.0;
          for (int i = 0; i < 4; i++) {
            sum += amp * snoise(p * freq);
            amp *= 0.5; freq *= 2.0;
          }
          return sum;
        }

        void main() {
          vec2 nc = vUv * uNoiseScale + vec2(uTime * uNoiseSpeed * 0.3, uTime * uNoiseSpeed * 0.15);
          float noise = fbm(nc) * 0.5 + 0.5;
          float vertGrad = 1.0 - vUv.y * 0.3;
          float sweepDist = abs(vUv.x - uScrollT);
          float sweepMask = smoothstep(0.6, 0.0, sweepDist);
          float density = uDensity * noise * vertGrad * sweepMask;
          float edge = smoothstep(0.0, uFadeEdge, vUv.x)
                     * smoothstep(0.0, uFadeEdge, 1.0 - vUv.x)
                     * smoothstep(0.0, uFadeEdge, vUv.y)
                     * smoothstep(0.0, uFadeEdge, 1.0 - vUv.y);
          density *= edge;
          density = clamp(density, 0.0, 1.0);
          gl_FragColor = vec4(uColor, density);
        }
      `,
      transparent: true,
      depthWrite: false,
      depthTest: false,
      side: THREE.DoubleSide,
    });

    fogMesh = new THREE.Mesh(geometry, fogMaterial);
    fogMesh.name = 'transition_fog_plane';
    fogMesh.renderOrder = 999;
    fogMesh.position.z = fogPlaneZ;
    fogMesh.visible = false;
    scene.add(fogMesh);

    startTime = performance.now() / 1000;

    return { fogMesh, fogMaterial };
  }

  /**
   * Per-frame update.
   * @param {number} t — Transition progress (0→1)
   * @param {TransitionSeq} transition
   * @param {object} context — { scene, camera, deltaTime }
   */
  function update(t, transition, context) {
    if (!fogMesh) {
      const resources = init(context.scene);
      transition._resources = resources;
    }

    fogMesh.visible = t > 0.01 && t < 0.99;

    if (!fogMesh.visible) return;

    const elapsed = performance.now() / 1000 - startTime;
    fogMaterial.uniforms.uTime.value = elapsed;

    // Fog density bell curve: peaks at t=0.5
    const densityCurve = t < 0.5
      ? easeInOutPower2(t * 2) * maxDensity
      : easeInOutPower2((1 - t) * 2) * maxDensity;
    fogMaterial.uniforms.uDensity.value = densityCurve;

    // Sweep position tracks scroll
    fogMaterial.uniforms.uScrollT.value = easeOutExpo(t);

    // Position fog plane relative to camera
    if (context.camera) {
      fogMesh.position.z = context.camera.position.z - fogPlaneZ;
      fogMesh.position.x = context.camera.position.x;
      fogMesh.position.y = context.camera.position.y;
      fogMesh.quaternion.copy(context.camera.quaternion);
    }
  }

  function reset() {
    if (!fogMesh || !fogMaterial) return;
    fogMesh.visible = false;
    fogMaterial.uniforms.uDensity.value = 0.0;
    fogMaterial.uniforms.uScrollT.value = 0.0;
  }

  function dispose() {
    reset();
    if (fogMesh) {
      fogMesh.geometry?.dispose();
      fogMaterial?.dispose();
      if (fogMesh.parent) fogMesh.parent.remove(fogMesh);
      fogMesh = null;
      fogMaterial = null;
    }
  }

  return { init, update, reset, dispose };
}

// ── 2. Particle Dissolve Transition ────────────────────────────────────────
/**
 * Geometry dissolves into particles that reform at target positions.
 * Uses InstancedBufferGeometry for GPU-driven position lerp.
 *
 * @param {object} config
 * @param {number} config.particleCount — Number of particles (default 5000)
 * @param {THREE.Color|object} config.startColor — Particle start color
 * @param {THREE.Color|object} config.endColor — Particle end color
 * @param {number} config.particleSize — Base particle size (default 3.0)
 * @param {number} config.scatterRadius — How far particles scatter (default 2.0)
 * @returns {object} { init, update, dispose }
 */
function createParticleDissolve(config = {}) {
  const particleCount = config.particleCount ?? 5000;
  const startColor = config.startColor || { r: 1.0, g: 0.8, b: 0.4 };
  const endColor = config.endColor || { r: 0.4, g: 0.7, b: 1.0 };
  const particleSize = config.particleSize ?? 3.0;
  const scatterRadius = config.scatterRadius ?? 2.0;

  let points = null;
  let material = null;
  let geometry = null;
  let startPositions = null;
  let endPositions = null;
  let scatterOffsets = null;
  let initialized = false;

  function init(fromGroup, toGroup, scene) {
    // Sample vertex positions from source and target geometry
    startPositions = fromGroup
      ? collectGroupVertices(fromGroup, particleCount)
      : new Float32Array(particleCount * 3);
    endPositions = toGroup
      ? collectGroupVertices(toGroup, particleCount)
      : new Float32Array(particleCount * 3);

    // Generate random scatter offsets for the mid-transition explosion
    scatterOffsets = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount * 3; i++) {
      scatterOffsets[i] = (Math.random() - 0.5) * 2 * scatterRadius;
    }

    geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(
      new Float32Array(startPositions), 3
    ));

    material = new THREE.PointsMaterial({
      size: particleSize,
      color: new THREE.Color(startColor.r, startColor.g, startColor.b),
      transparent: true,
      opacity: 0.85,
      depthWrite: false,
      sizeAttenuation: true,
      blending: THREE.AdditiveBlending,
    });

    points = new THREE.Points(geometry, material);
    points.name = 'transition_particle_dissolve';
    points.visible = false;
    points.renderOrder = 990;
    scene.add(points);

    initialized = true;
    return { points, material, geometry };
  }

  function update(t, transition, context) {
    if (!initialized) {
      const fromGroup = transition.from?.group;
      const toGroup = transition.to?.group;
      const resources = init(fromGroup, toGroup, context.scene);
      transition._resources = resources;
    }

    points.visible = t > 0.01 && t < 0.99;
    if (!points.visible) return;

    const posArr = geometry.attributes.position.array;

    // Three-phase motion: gather → scatter → reform
    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;
      let px, py, pz;

      if (t < 0.33) {
        // Phase 1: Start positions → drift outward
        const phase = t / 0.33;
        const eased = easeInOutPower2(phase);
        px = lerp(startPositions[i3], startPositions[i3] + scatterOffsets[i3], eased);
        py = lerp(startPositions[i3 + 1], startPositions[i3 + 1] + scatterOffsets[i3 + 1], eased);
        pz = lerp(startPositions[i3 + 2], startPositions[i3 + 2] + scatterOffsets[i3 + 2], eased);
      } else if (t < 0.67) {
        // Phase 2: Scattered → begin converging to target
        const phase = (t - 0.33) / 0.34;
        const eased = easeInOutPower2(phase);
        const midX = startPositions[i3] + scatterOffsets[i3];
        const midY = startPositions[i3 + 1] + scatterOffsets[i3 + 1];
        const midZ = startPositions[i3 + 2] + scatterOffsets[i3 + 2];
        px = lerp(midX, endPositions[i3], eased);
        py = lerp(midY, endPositions[i3 + 1], eased);
        pz = lerp(midZ, endPositions[i3 + 2], eased);
      } else {
        // Phase 3: Settling into target positions
        const phase = (t - 0.67) / 0.33;
        const eased = easeOutExpo(phase);
        px = lerp(endPositions[i3], endPositions[i3], eased);
        py = lerp(endPositions[i3 + 1], endPositions[i3 + 1], eased);
        pz = lerp(endPositions[i3 + 2], endPositions[i3 + 2], eased);
      }

      posArr[i3] = px;
      posArr[i3 + 1] = py;
      posArr[i3 + 2] = pz;
    }

    geometry.attributes.position.needsUpdate = true;

    // Color interpolation
    const colorT = clamp01(t);
    material.color.r = lerp(startColor.r, endColor.r, colorT);
    material.color.g = lerp(startColor.g, endColor.g, colorT);
    material.color.b = lerp(startColor.b, endColor.b, colorT);

    // Opacity: full during middle, fade in/out at edges
    material.opacity = t < 0.1 ? t / 0.1 * 0.85
      : t > 0.9 ? (1 - t) / 0.1 * 0.85
      : 0.85;
  }

  function reset() {
    if (!points || !material) return;
    points.visible = false;
    material.opacity = 0.0;
  }

  function dispose() {
    reset();
    if (points) {
      geometry?.dispose();
      material?.dispose();
      if (points.parent) points.parent.remove(points);
      points = null;
      material = null;
      geometry = null;
    }
    initialized = false;
  }

  return { init, update, reset, dispose };
}

// ── 3. Wireframe Morph Transition ──────────────────────────────────────────
/**
 * Cross-fades between solid surface materials and wireframe representation.
 * Works by swapping material properties on existing meshes.
 *
 * @param {object} config
 * @param {THREE.Color|object} config.wireframeColor — Wireframe line color
 * @param {number} config.wireframeOpacity — Final wireframe opacity (default 0.6)
 * @returns {object} { init, update, dispose }
 */
function createWireframeMorph(config = {}) {
  const wireframeColor = config.wireframeColor || { r: 0.2, g: 0.8, b: 1.0 };
  const wireframeOpacity = config.wireframeOpacity ?? 0.6;

  let originalMaterials = new Map(); // mesh → original material
  let materialStates = new Map(); // material → original transparent/opacity
  let wireframeMaterials = new Map(); // mesh → wireframe material
  let targetGroup = null;

  function createWireframeMaterial() {
    return new THREE.MeshBasicMaterial({
      color: new THREE.Color(wireframeColor.r, wireframeColor.g, wireframeColor.b),
      wireframe: true,
      transparent: true,
      opacity: 0.0,
      depthWrite: false,
    });
  }

  function createWireframeMaterialSet(material) {
    if (Array.isArray(material)) {
      return material.map(() => createWireframeMaterial());
    }
    return createWireframeMaterial();
  }

  function init(group) {
    targetGroup = group;
    group.traverse((child) => {
      if (child.isMesh && child.material) {
        const origMat = child.material;
        originalMaterials.set(child, origMat);
        rememberMaterialStates(materialStates, origMat);
        wireframeMaterials.set(child, createWireframeMaterialSet(origMat));
      }
    });
  }

  function update(t, transition, context) {
    if (!targetGroup && transition.from?.group) {
      init(transition.from.group);
    }
    if (!targetGroup) return;

    const eased = easeInOutPower2(t);

    targetGroup.traverse((child) => {
      if (!child.isMesh) return;

      const origMat = originalMaterials.get(child);
      const wireMat = wireframeMaterials.get(child);
      if (!origMat || !wireMat) return;

      if (eased < 0.5) {
        // First half: solid fades out
        child.material = origMat;
        setMaterialTransparent(origMat, true);
        setMaterialOpacity(origMat, 1.0 - eased * 2);
      } else {
        // Second half: wireframe fades in
        child.material = wireMat;
        setMaterialOpacity(wireMat, (eased - 0.5) * 2 * wireframeOpacity);
      }
    });
  }

  function reset() {
    for (const [mesh, origMat] of originalMaterials) {
      if (!mesh.isMesh) continue;
      mesh.material = origMat;
      restoreMaterialStates(materialStates, origMat);
    }

    for (const [, wireMat] of wireframeMaterials) {
      setMaterialOpacity(wireMat, 0.0);
    }
  }

  function dispose() {
    reset();
    for (const [, wireMat] of wireframeMaterials) {
      getMaterialList(wireMat).forEach((entry) => entry.dispose());
    }
    originalMaterials.clear();
    materialStates.clear();
    wireframeMaterials.clear();
    targetGroup = null;
  }

  return { init, update, reset, dispose };
}

// ── 4. Point Cloud Morph Transition ────────────────────────────────────────
/**
 * Morphs one point cloud into another by lerping position and color attributes.
 * Uses the custom point-cloud shaders for soft rendering.
 *
 * @param {object} config
 * @param {number} config.maxPoints — Max point count (default 50000)
 * @param {number} config.pointSize — Display size (default 2.0)
 * @param {object} config.startColor — {r,g,b} start color
 * @param {object} config.endColor — {r,g,b} end color
 * @returns {object} { init, update, dispose }
 */
function createPointCloudMorph(config = {}) {
  const maxPoints = config.maxPoints ?? 50000;
  const pointSize = config.pointSize ?? 2.0;
  const startColorCfg = config.startColor || { r: 0.95, g: 0.85, b: 0.70 };
  const endColorCfg = config.endColor || { r: 0.60, g: 0.65, b: 0.72 };

  let points = null;
  let material = null;
  let geometry = null;
  let sourcePositions = null;
  let targetPositions = null;
  let initialized = false;

  function init(fromPointCloud, toPointCloud, scene) {
    // Extract positions from source/target point clouds
    sourcePositions = extractPointPositions(fromPointCloud, maxPoints);
    targetPositions = extractPointPositions(toPointCloud, maxPoints);

    const count = Math.min(sourcePositions.length / 3, targetPositions.length / 3);

    geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(
      new Float32Array(sourcePositions.slice(0, count * 3)), 3
    ));
    geometry.setAttribute('targetPos', new THREE.BufferAttribute(
      new Float32Array(targetPositions.slice(0, count * 3)), 3
    ));

    const colors = new Float32Array(count * 3);
    const targetColors = new Float32Array(count * 3);
    const phases = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      colors[i * 3] = startColorCfg.r;
      colors[i * 3 + 1] = startColorCfg.g;
      colors[i * 3 + 2] = startColorCfg.b;
      targetColors[i * 3] = endColorCfg.r;
      targetColors[i * 3 + 1] = endColorCfg.g;
      targetColors[i * 3 + 2] = endColorCfg.b;
      phases[i] = (i % 1024) / 1024;
    }
    geometry.setAttribute('aColor', new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute('aTargetColor', new THREE.BufferAttribute(targetColors, 3));
    geometry.setAttribute('aPhase', new THREE.BufferAttribute(phases, 1));

    material = new THREE.ShaderMaterial({
      uniforms: {
        uMorphT: { value: 0.0 },
        uPointSize: { value: pointSize },
        uMinSize: { value: 1.0 },
        uMaxSize: { value: 8.0 },
        uOpacity: { value: 0.75 },
        uNearFade: { value: 0.5 },
        uFarFade: { value: 30.0 },
        uTime: { value: 0.0 },
      },
      vertexShader: `
        attribute vec3 targetPos;
        attribute vec3 aColor;
        attribute vec3 aTargetColor;
        attribute float aPhase;

        uniform float uMorphT;
        uniform float uPointSize;
        uniform float uMinSize;
        uniform float uMaxSize;
        uniform float uOpacity;
        uniform float uNearFade;
        uniform float uFarFade;
        uniform float uTime;

        varying vec3 vColor;
        varying float vDistOpacity;

        void main() {
          float t = uMorphT * uMorphT * (3.0 - 2.0 * uMorphT);
          vec3 pos = mix(position, targetPos, t);
          pos += sin(uTime * 0.5 + aPhase * 6.28318530718) * 0.01;
          vColor = mix(aColor, aTargetColor, t);

          vec4 mvPos = modelViewMatrix * vec4(pos, 1.0);
          float dist = -mvPos.z;
          float sizeFactor = uPointSize / max(dist, 0.1);
          gl_PointSize = clamp(sizeFactor * uMaxSize, uMinSize, uMaxSize);
          gl_Position = projectionMatrix * mvPos;

          float nearFade = smoothstep(0.0, uNearFade, dist);
          float farFade = smoothstep(uFarFade, uFarFade * 0.7, dist);
          vDistOpacity = nearFade * farFade * uOpacity;
        }
      `,
      fragmentShader: `
        varying vec3 vColor;
        varying float vDistOpacity;

        void main() {
          float d = length(gl_PointCoord - vec2(0.5));
          if (d > 0.5) discard;
          float alpha = smoothstep(0.5, 0.2, d) * vDistOpacity;
          if (alpha < 0.01) discard;
          gl_FragColor = vec4(vColor, alpha);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

    points = new THREE.Points(geometry, material);
    points.name = 'transition_point_cloud_morph';
    points.visible = false;
    points.renderOrder = 985;
    scene.add(points);

    initialized = true;
    return { points, material, geometry };
  }

  function update(t, transition, context) {
    if (!initialized) {
      const fromPC = findPointCloud(transition.from?.group);
      const toPC = findPointCloud(transition.to?.group);
      const resources = init(fromPC, toPC, context.scene);
      transition._resources = resources;
    }

    points.visible = t > 0.01 && t < 0.99;
    if (!points.visible) return;

    material.uniforms.uMorphT.value = t;
    material.uniforms.uTime.value = performance.now() / 1000;

    // Fade in/out at boundaries
    material.uniforms.uOpacity.value = t < 0.1
      ? (t / 0.1) * 0.75
      : t > 0.9
        ? ((1 - t) / 0.1) * 0.75
        : 0.75;
  }

  function reset() {
    if (!points || !material) return;
    points.visible = false;
    material.uniforms.uMorphT.value = 0.0;
    material.uniforms.uOpacity.value = 0.0;
  }

  function dispose() {
    reset();
    if (points) {
      geometry?.dispose();
      material?.dispose();
      if (points.parent) points.parent.remove(points);
      points = null;
      material = null;
      geometry = null;
    }
    initialized = false;
  }

  return { init, update, reset, dispose };
}

/** Extract positions from a mesh/points in a group */
function extractPointPositions(obj, maxCount) {
  if (!obj) return new Float32Array(maxCount * 3);

  const positions = [];
  const target = obj.isGroup ? obj : (obj.parent || obj);

  target.traverse((child) => {
    const posAttr = child.geometry?.attributes?.position;
    if (posAttr) {
      const worldMatrix = child.matrixWorld;
      const vec = new THREE.Vector3();
      for (let i = 0; i < posAttr.count; i++) {
        vec.set(posAttr.getX(i), posAttr.getY(i), posAttr.getZ(i));
        vec.applyMatrix4(worldMatrix);
        positions.push(vec.x, vec.y, vec.z);
      }
    }
  });

  const count = Math.min(maxCount, positions.length / 3);
  const result = new Float32Array(count * 3);
  const step = Math.max(1, positions.length / 3 / count);
  for (let i = 0; i < count; i++) {
    const srcIdx = Math.floor(i * step) * 3;
    result[i * 3] = positions[srcIdx] || 0;
    result[i * 3 + 1] = positions[srcIdx + 1] || 0;
    result[i * 3 + 2] = positions[srcIdx + 2] || 0;
  }
  return result;
}

/** Find a Points object in a group hierarchy */
function findPointCloud(group) {
  if (!group) return null;
  let found = null;
  group.traverse((child) => {
    if (!found && child.isPoints) found = child;
  });
  return found || group;
}

// ── 5. Bloom Crossfade Transition ──────────────────────────────────────────
/**
 * Atmospheric transition using bloom intensity ramp.
 * No new geometry — purely post-processing mood shift.
 *
 * @param {object} config
 * @param {number} config.peakBloom — Peak bloom gain (default 0.85)
 * @param {number} config.startBloom — Starting bloom (default 0.35)
 * @param {number} config.endBloom — Ending bloom (default 0.45)
 * @param {object} config.warmShift — Color temp shift {r,g,b} additive
 * @returns {object} { update, dispose }
 */
function createBloomCrossfade(config = {}) {
  const peakBloom = config.peakBloom ?? 0.85;
  const startBloom = config.startBloom ?? 0.35;
  const endBloom = config.endBloom ?? 0.45;
  const warmShift = config.warmShift || { r: 0.04, g: 0.02, b: -0.02 };

  // State for external consumers
  let currentBloom = startBloom;
  let currentWarmth = 0;
  let materialStates = new Map();

  function rememberGroupMaterialStates(group) {
    group?.traverse((child) => {
      if (!child.isMesh && !child.isPoints) return;
      rememberMaterialStates(materialStates, child.material);
    });
  }

  function restoreGroupMaterialStates(group) {
    group?.traverse((child) => {
      if (!child.isMesh && !child.isPoints) return;
      restoreMaterialStates(materialStates, child.material);
    });
  }

  function update(t, transition, context) {
    // Bell curve bloom with peak at t=0.5
    if (t < 0.5) {
      currentBloom = lerp(startBloom, peakBloom, easeInOutPower2(t * 2));
    } else {
      currentBloom = lerp(peakBloom, endBloom, easeInOutPower2((t - 0.5) * 2));
    }

    // Warm shift follows t linearly
    currentWarmth = t;

    // Drive world visibility
    if (transition.from) {
      rememberGroupMaterialStates(transition.from.group);
      transition.from.group.traverse((child) => {
        if (child.isMesh && child.material) {
          setMaterialOpacity(child.material, Math.max(0, 1 - t * 1.5));
          setMaterialTransparent(child.material, true);
        }
        if (child.isPoints && child.material) {
          setMaterialOpacity(child.material, Math.max(0, 1 - t * 1.5));
        }
      });
    }

    if (transition.to) {
      rememberGroupMaterialStates(transition.to.group);
      transition.to.group.traverse((child) => {
        if (child.isMesh && child.material) {
          setMaterialOpacity(child.material, Math.max(0, t * 1.5 - 0.5));
          setMaterialTransparent(child.material, true);
        }
        if (child.isPoints && child.material) {
          setMaterialOpacity(child.material, Math.max(0, t * 1.5 - 0.5));
        }
      });
    }
  }

  function getBloomState() {
    return {
      bloomGain: currentBloom,
      warmShift: {
        r: warmShift.r * currentWarmth,
        g: warmShift.g * currentWarmth,
        b: warmShift.b * currentWarmth,
      },
    };
  }

  function dispose() {
    currentBloom = startBloom;
    currentWarmth = 0;
    materialStates.clear();
  }

  function reset(transition) {
    restoreGroupMaterialStates(transition?.from?.group);
    restoreGroupMaterialStates(transition?.to?.group);
    currentBloom = startBloom;
    currentWarmth = 0;
  }

  return { update, reset, getBloomState, dispose };
}

// ── Technique Registry ─────────────────────────────────────────────────────
const TECHNIQUES = {
  'fog-flythrough': createFogFlythrough,
  'particle-dissolve': createParticleDissolve,
  'wireframe-morph': createWireframeMorph,
  'point-cloud-morph': createPointCloudMorph,
  'bloom-crossfade': createBloomCrossfade,
};

/**
 * Create a technique instance by name.
 * @param {string} name — Technique identifier
 * @param {object} config — Technique-specific configuration
 * @returns {object} Technique instance with { update, reset, dispose }
 */
function createTechnique(name, config = {}) {
  const factory = TECHNIQUES[name];
  if (!factory) {
    console.info(`[transition-techniques] Unknown technique: "${name}"`);
    return { update() {}, reset() {}, dispose() {} };
  }
  return factory(config);
}

export {
  createFogFlythrough,
  createParticleDissolve,
  createWireframeMorph,
  createPointCloudMorph,
  createBloomCrossfade,
  createTechnique,
  TECHNIQUES,
  sampleMeshVertices,
  collectGroupVertices,
};
