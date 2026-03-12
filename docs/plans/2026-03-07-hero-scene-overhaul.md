# Hero Scene Visual Overhaul — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the existing Three.js hero scene tools (spirit level + gear) with a Carpenter's Square, Circular Saw Blade, and Tape Measure, while upgrading all tool materials to near-photorealistic cinematic quality.

**Architecture:** All changes are contained in `three-scene.js`. The quality upgrade centers on replacing the current multi-point-light setup with a `RectAreaLight` array (warm key + cool fill + neutral top) which produces soft rectangular specular highlights on metallic surfaces — the hallmark of studio-quality product renders. Fake IBL is achieved by adding a `PMREMGenerator`-based environment from a procedural `DataTexture` cube. New tools use higher-segment geometries and more detailed part decomposition than the current tools.

**Tech Stack:** Three.js r134 (already loaded via CDN), vanilla JS, no build step. `RectAreaLightUniformsLib` must be initialized (included in r134 at `THREE.RectAreaLightUniformsLib`).

---

### Task 1: Add RectAreaLight studio lighting + fake env map

**Files:**
- Modify: `three-scene.js` — lighting section (lines ~197–232)

This is the single highest-impact change. Replace the current point-light-only setup with a studio RectAreaLight array and initialize a minimal procedural environment map so metallic materials have something to reflect.

**Step 1: Locate the existing lights block**

Find the block starting with `/* ─── Lights ` in `three-scene.js` (~line 197). It currently has: `ambientLight`, `orbitLight`, `coolFill`, `blueprintLight`, `rimLight`, `groundGlow`, `toolLight`.

**Step 2: Initialize RectAreaLightUniformsLib**

Add this immediately after the renderer is configured (after `renderer.shadowMap.type = ...`):

```js
// Required for RectAreaLight to render correctly
if (THREE.RectAreaLightUniformsLib) {
  THREE.RectAreaLightUniformsLib.init();
}
```

**Step 3: Add procedural env cube for metallic reflections**

Add this after the scene fog line (`scene.fog = ...`):

```js
// Fake IBL: procedural cube env so metalness > 0 materials have something to reflect
(function buildEnv() {
  const size = 4;
  const data = new Uint8Array(size * size * 6 * 4);
  // faces: right=warm amber, left=cool blue, top=soft white, bottom=dark, front=mid, back=dark
  const faceColors = [
    [80, 45, 8, 255],   // +X warm amber
    [12, 28, 55, 255],  // -X cool blue
    [38, 38, 38, 255],  // +Y soft neutral
    [4,  4,  4,  255],  // -Y dark floor
    [22, 22, 22, 255],  // +Z front mid
    [6,  6,  6,  255],  // -Z back dark
  ];
  for (let f = 0; f < 6; f++) {
    const c = faceColors[f];
    for (let p = 0; p < size * size; p++) {
      const idx = (f * size * size + p) * 4;
      data[idx]     = c[0];
      data[idx + 1] = c[1];
      data[idx + 2] = c[2];
      data[idx + 3] = c[3];
    }
  }
  const envTex = new THREE.DataTexture(data, size, size);
  envTex.format = THREE.RGBAFormat;
  envTex.type = THREE.UnsignedByteType;
  envTex.needsUpdate = true;
  const pmrem = new THREE.PMREMGenerator(renderer);
  // PMREMGenerator.fromEquirectangular won't work here; use scene env hack:
  // Apply as matcap-style via material.envMap on each material after creation (see Task 2)
  pmrem.dispose();
})();
```

> Note: r134 PMREMGenerator doesn't support raw DataTexture directly. Instead we'll apply the env via `scene.environment` using a WebGLCubeRenderTarget approach. Replace the above with:

```js
// Fake IBL via CubeCamera render of a colored box scene
const envScene = new THREE.Scene();
envScene.background = new THREE.Color(0x07090f);
// Colored panels around origin to give metallic surfaces something to reflect
const envColors = [0xc97512, 0x1a3366, 0x222222, 0x050505, 0x181818, 0x080808];
const envDirs   = [[1,0,0],[-1,0,0],[0,1,0],[0,-1,0],[0,0,1],[0,0,-1]];
envDirs.forEach(([x,y,z], i) => {
  const m = new THREE.Mesh(
    new THREE.PlaneGeometry(20, 20),
    new THREE.MeshBasicMaterial({ color: envColors[i], side: THREE.FrontSide })
  );
  m.position.set(x*8, y*8, z*8);
  m.lookAt(0, 0, 0);
  envScene.add(m);
});
const cubeRT = new THREE.WebGLCubeRenderTarget(64);
const cubeCamera = new THREE.CubeCamera(0.1, 100, cubeRT);
envScene.add(cubeCamera);
cubeCamera.update(renderer, envScene);
scene.environment = cubeRT.texture;
```

**Step 4: Replace lights block**

Replace the entire existing lights block with:

```js
/* ─── Lights ──────────────────────────────────────────── */
// Ambient: very low — RectAreaLights provide the fill
const ambientLight = new THREE.AmbientLight(0x080808, 0.4);
scene.add(ambientLight);

// Studio key light — warm amber RectAreaLight (large softbox, upper-left)
const keyLight = new THREE.RectAreaLight(0xe8900a, 14, 4.0, 3.0);
keyLight.position.set(-3, 4, 5);
keyLight.lookAt(0, 0, 0);
scene.add(keyLight);

// Studio fill light — cool blue RectAreaLight (right side, lower intensity)
const fillLight = new THREE.RectAreaLight(0x3366cc, 6, 3.0, 4.0);
fillLight.position.set(4, 1, 3);
fillLight.lookAt(0, 0, 0);
scene.add(fillLight);

// Top neutral rim — RectAreaLight overhead for edge separation
const rimAreaLight = new THREE.RectAreaLight(0x8899bb, 4, 5.0, 1.5);
rimAreaLight.position.set(0, 6, -1);
rimAreaLight.lookAt(0, 0, 0);
scene.add(rimAreaLight);

// Orbiting point light — warm amber, animates in render loop (for dynamic highlights)
const orbitLight = new THREE.PointLight(0xd4820a, 5.0, 18);
orbitLight.castShadow = true;
orbitLight.shadow.mapSize.width = 1024;
orbitLight.shadow.mapSize.height = 1024;
scene.add(orbitLight);

// Blueprint accent — strong blue, illuminates grid
const blueprintLight = new THREE.PointLight(0x4488cc, 4.0, 22);
blueprintLight.position.set(-4, 3, -4);
scene.add(blueprintLight);

// Ground bounce — warm amber from below
const groundGlow = new THREE.PointLight(0xc97512, 2.2, 10);
groundGlow.position.set(0, -3, 2);
scene.add(groundGlow);

// Saw blade accent — tight spot on upper center where saw blade lives
const sawSpot = new THREE.SpotLight(0xffa040, 8, 12, Math.PI / 8, 0.4, 1.5);
sawSpot.position.set(0.5, 3.5, 4);
sawSpot.target.position.set(0.5, 1.8, 0.5);
scene.add(sawSpot);
scene.add(sawSpot.target);
```

**Step 5: Update all steelMat / darkMat / faceMat definitions**

Find `const steelMat` and replace the material definitions:

```js
// Studio steel — near-mirror, catches RectAreaLight as sharp rectangular reflections
const steelMat = new THREE.MeshStandardMaterial({
  color: 0xb8a882,
  roughness: 0.04,
  metalness: 0.97,
  transparent: true,
  opacity: 1.0,
});

// Dark handle — slightly metallic rubber-grip look
const darkMat = new THREE.MeshStandardMaterial({
  color: 0x1e1a14,
  roughness: 0.72,
  metalness: 0.18,
  transparent: true,
  opacity: 1.0,
});

// Chrome bright — for saw blade and carpenter's square
const chromeMat = new THREE.MeshStandardMaterial({
  color: 0xd4c898,
  roughness: 0.02,
  metalness: 0.99,
  transparent: true,
  opacity: 1.0,
});

// Amber emissive — for saw blade hub and highlights
const amberEmissiveMat = new THREE.MeshStandardMaterial({
  color: 0xff8800,
  roughness: 0.1,
  metalness: 0.0,
  emissive: new THREE.Color(0xff6600),
  emissiveIntensity: 1.8,
  transparent: true,
  opacity: 1.0,
});

// Gunmetal — tape measure housing
const gunmetalMat = new THREE.MeshStandardMaterial({
  color: 0x3a3830,
  roughness: 0.28,
  metalness: 0.82,
  transparent: true,
  opacity: 1.0,
});

// Yellow tape — tape measure band
const tapeBandMat = new THREE.MeshStandardMaterial({
  color: 0xd4a012,
  roughness: 0.55,
  metalness: 0.45,
  transparent: true,
  opacity: 1.0,
});
```

**Step 6: Verify visually**

Open `index.html` in browser. Tools should now show bright rectangular highlight patches on their metal surfaces from the RectAreaLights. If tools look flat/black, the `RectAreaLightUniformsLib.init()` call is missing or failed.

**Step 7: Commit**

```bash
git add three-scene.js
git commit -m "feat: upgrade hero lighting to RectAreaLight studio setup + fake IBL env"
```

---

### Task 2: Replace spirit level + gear with Circular Saw Blade

**Files:**
- Modify: `three-scene.js` — spirit level section (~lines 534–611) and gear section (~lines 558–595)

The saw blade is the most visually dramatic new element. It lives upper center, face-on to camera, spinning continuously. It should look like a high-quality circular saw blade: flat disc body, 24 teeth around the perimeter, carbide-tip color differentiation, emissive amber hub.

**Step 1: Delete the spirit level + gear block**

Remove everything from `/* ─── Spirit Level` through `lvBounds` assignment (~lines 534–611).

Also remove `levelGroup` and `levelParts` from `const allToolParts = [...]` at the end.

**Step 2: Add the saw blade**

Add this in its place:

```js
/* ─── Circular Saw Blade ──────────────────────────────── */
const sawGroup = new THREE.Group();
const sawParts = [];

function addSawPart(geo, mat, px, py, pz, sx, sy, sz) {
  const mesh = new THREE.Mesh(geo, mat);
  mesh.castShadow = true;
  mesh.position.set(px, py, pz);
  sawGroup.add(mesh);
  registerPart(mesh, sx, sy, sz, sawParts);
  return mesh;
}

// Blade disc body — thin flat cylinder, face-on to camera (no X rotation needed, camera faces Z)
const bladeBody = addSawPart(
  new THREE.CylinderGeometry(0.88, 0.88, 0.055, 48),
  chromeMat.clone(), 0, 0, 0, 0, 0.6, 0.4
);

// Inner relief cutouts — 5 oval slots cut visually via dark overlay discs
for (let i = 0; i < 5; i++) {
  const angle = (i / 5) * Math.PI * 2;
  const slotMesh = new THREE.Mesh(
    new THREE.CylinderGeometry(0.09, 0.09, 0.06, 12),
    new THREE.MeshStandardMaterial({ color: 0x080808, roughness: 0.9, metalness: 0.1 })
  );
  slotMesh.position.set(Math.cos(angle) * 0.55, 0, Math.sin(angle) * 0.55);
  sawGroup.add(slotMesh);
}

// 24 teeth around perimeter
const TOOTH_COUNT = 24;
for (let t = 0; t < TOOTH_COUNT; t++) {
  const angle = (t / TOOTH_COUNT) * Math.PI * 2;
  const toothMat = (t % 3 === 0)
    // Every 3rd tooth: carbide tip (slightly different color)
    ? new THREE.MeshStandardMaterial({ color: 0x9a8060, roughness: 0.12, metalness: 0.88 })
    : chromeMat.clone();

  const tooth = new THREE.Mesh(
    new THREE.BoxGeometry(0.055, 0.12, 0.058),
    toothMat
  );
  tooth.castShadow = true;
  const r = 0.91;
  tooth.position.set(Math.cos(angle) * r, 0, Math.sin(angle) * r);
  tooth.rotation.y = -angle; // align tooth face tangentially
  sawGroup.add(tooth);
}

// Hub — large emissive amber center disc
const hubDisc = addSawPart(
  new THREE.CylinderGeometry(0.18, 0.18, 0.07, 24),
  amberEmissiveMat.clone(), 0, 0, 0, 0, 0.3, 0.2
);

// Arbor hole — tiny dark center
const arborMesh = new THREE.Mesh(
  new THREE.CylinderGeometry(0.045, 0.045, 0.08, 12),
  new THREE.MeshStandardMaterial({ color: 0x020202, roughness: 1.0, metalness: 0.0 })
);
sawGroup.add(arborMesh);

// Position: upper center, face-on (blade disc is XZ plane by default from CylinderGeometry)
// Rotate so blade faces camera (Y axis cylinder → rotate X 90deg so flat disc faces Z)
sawGroup.rotation.x = Math.PI / 2;
sawGroup.position.set(0.4, 1.85, 0.8);
sawGroup.rotation.z = 0; // will spin in animation loop
scene.add(sawGroup);

// Invisible bounds for raycasting
const sawBounds = new THREE.Mesh(
  new THREE.CylinderGeometry(1.1, 1.1, 0.2, 16),
  new THREE.MeshBasicMaterial({ visible: false })
);
sawBounds.userData.toolId = 'saw';
sawGroup.add(sawBounds);

// Store reference for spin animation
sawGroup.userData.spinSpeed = 0.004; // radians per frame, slow majestic spin
```

**Step 3: Add saw to animation loop spin**

In the render loop (find `fragmentData.forEach` or the `animate` function), add after the existing tool animations:

```js
// Saw blade continuous spin (around its own Z axis after the X rotation)
sawGroup.rotation.z += sawGroup.userData.spinSpeed;
```

**Step 4: Add saw tooltip info**

Find the `toolInfo` object and add:

```js
saw: {
  title: 'CIRCULAR SAW BLADE', sub: '7-1/4" Carbide Tipped',
  desc: 'Framing · Decking\nDemolition · Finish Cuts',
  hint: '[S] panel  ·  drag to spin  ·  dbl-click burst',
  specs: { Diameter: '184 mm', Teeth: '24T', Bore: '15.88 mm', Coating: 'Anti-Stick' },
  apps: ['Framing & Decking', 'Demolition & Finish Cuts'],
  cta: 'Get a Quote',
},
```

**Step 5: Add saw to allToolParts**

```js
const allToolParts = [...hammerParts, ...wrenchParts, ...sawParts];
```

**Step 6: Verify visually**

Saw blade should appear upper center, face-on (flat disc visible), spinning slowly. Hub should glow amber. Teeth should be clearly visible around the perimeter.

**Step 7: Commit**

```bash
git add three-scene.js
git commit -m "feat: add circular saw blade replacing spirit level, face-on spin animation"
```

---

### Task 3: Add Carpenter's Square

**Files:**
- Modify: `three-scene.js` — after wrench block, before allToolParts line

The carpenter's square (speed square) is two arms at 90°, angled toward camera, with engraved measurement markings simulated by thin dark strip geometry along each arm.

**Step 1: Add the carpenter's square block**

After the wrench `wrBounds` assignment, add:

```js
/* ─── Carpenter's Square ──────────────────────────────── */
const squareGroup = new THREE.Group();
const squareParts = [];

function addSquarePart(geo, mat, px, py, pz, sx, sy, sz) {
  const mesh = new THREE.Mesh(geo, mat);
  mesh.castShadow = true;
  mesh.position.set(px, py, pz);
  squareGroup.add(mesh);
  registerPart(mesh, sx, sy, sz, squareParts);
  return mesh;
}

// Arm A — long arm (horizontal), 2.6 units wide, 0.18 tall, 0.08 deep
addSquarePart(
  new THREE.BoxGeometry(2.6, 0.18, 0.08), chromeMat.clone(),
  0, 0, 0,    // position
  0.5, 1.2, 0.4  // spread
);

// Arm B — short arm (vertical), perpendicular, at left end of arm A
addSquarePart(
  new THREE.BoxGeometry(0.18, 1.8, 0.08), chromeMat.clone(),
  -1.21, 0.81, 0,   // offset so it meets arm A at corner
  -1.0, 0.8, -0.4
);

// Corner reinforcement — small square block at the 90° joint
addSquarePart(
  new THREE.BoxGeometry(0.22, 0.22, 0.10), darkMat.clone(),
  -1.21, 0, 0,
  -0.5, -0.3, 0.3
);

// Measurement marks on arm A — 8 thin dark notch strips
for (let m = 0; m < 8; m++) {
  const markMesh = new THREE.Mesh(
    new THREE.BoxGeometry(0.012, 0.10 + (m % 4 === 0 ? 0.06 : 0), 0.009),
    new THREE.MeshStandardMaterial({ color: 0x0a0808, roughness: 0.9, metalness: 0.05 })
  );
  markMesh.position.set(-1.0 + m * 0.28, 0.01, 0.041);
  squareGroup.add(markMesh);
}

// Measurement marks on arm B — 5 marks
for (let m = 0; m < 5; m++) {
  const markMesh = new THREE.Mesh(
    new THREE.BoxGeometry(0.10 + (m % 3 === 0 ? 0.05 : 0), 0.012, 0.009),
    new THREE.MeshStandardMaterial({ color: 0x0a0808, roughness: 0.9, metalness: 0.05 })
  );
  markMesh.position.set(-1.21, 0.25 + m * 0.28, 0.041);
  squareGroup.add(markMesh);
}

// Position: lower-center, slightly in front, angled so both arms are visible
squareGroup.position.set(-0.5, -0.8, 1.2);
squareGroup.rotation.z = 0.18;   // slight tilt
squareGroup.rotation.y = 0.25;   // angled to show depth of both arms
scene.add(squareGroup);

const sqBounds = new THREE.Mesh(
  new THREE.BoxGeometry(3.0, 2.2, 0.3),
  new THREE.MeshBasicMaterial({ visible: false })
);
sqBounds.userData.toolId = 'square';
squareGroup.add(sqBounds);
```

**Step 2: Add square tooltip info**

```js
square: {
  title: "CARPENTER'S SQUARE", sub: 'Chrome Plated Steel',
  desc: 'Layout · Framing\nAlignment · Marking',
  hint: '[Q] panel  ·  drag to spin  ·  dbl-click burst',
  specs: { 'Long Arm': '600 mm', 'Short Arm': '400 mm', Material: 'Chrome Steel', Accuracy: '±0.2 mm' },
  apps: ['Layout & Framing', 'Alignment & Marking'],
  cta: 'Get a Quote',
},
```

**Step 3: Add to allToolParts**

```js
const allToolParts = [...hammerParts, ...wrenchParts, ...sawParts, ...squareParts];
```

**Step 4: Verify visually**

Carpenter's square should appear lower-center, two perpendicular chrome arms clearly visible, with dark measurement tick marks along each arm. Both arms should catch rectangular RectAreaLight highlights.

**Step 5: Commit**

```bash
git add three-scene.js
git commit -m "feat: add carpenter's square with measurement mark geometry"
```

---

### Task 4: Add Tape Measure

**Files:**
- Modify: `three-scene.js` — after carpenter's square block

The tape measure has a compact cylindrical housing, a partial extended band (thin flat geometry), and a thumb-lock detail.

**Step 1: Add the tape measure block**

```js
/* ─── Tape Measure ────────────────────────────────────── */
const tapeGroup = new THREE.Group();
const tapeParts = [];

function addTapePart(geo, mat, px, py, pz, sx, sy, sz) {
  const mesh = new THREE.Mesh(geo, mat);
  mesh.castShadow = true;
  mesh.position.set(px, py, pz);
  tapeGroup.add(mesh);
  registerPart(mesh, sx, sy, sz, tapeParts);
  return mesh;
}

// Main housing — rounded box (simulate with CylinderGeometry squished via scale)
addTapePart(
  new THREE.BoxGeometry(0.72, 0.72, 0.38), gunmetalMat.clone(),
  0, 0, 0,  0.5, 0.8, 0.3
);

// Belt clip — thin rectangle on back
addTapePart(
  new THREE.BoxGeometry(0.08, 0.55, 0.06), darkMat.clone(),
  0.38, 0.05, -0.19,  0.8, 0.3, -0.3
);

// Lock button — small raised rectangle on top
addTapePart(
  new THREE.BoxGeometry(0.22, 0.09, 0.16), darkMat.clone(),
  0, 0.405, 0,  0.0, 0.6, 0.2
);

// Tape exit slot — dark rectangle on front face
const slotMesh = new THREE.Mesh(
  new THREE.BoxGeometry(0.28, 0.06, 0.01),
  new THREE.MeshStandardMaterial({ color: 0x020202, roughness: 1.0, metalness: 0.0 })
);
slotMesh.position.set(0, -0.10, 0.19);
tapeGroup.add(slotMesh);

// Extended band — thin flat box extruding from slot, slightly curved suggestion via rotation
addTapePart(
  new THREE.BoxGeometry(0.26, 0.04, 0.85), tapeBandMat.clone(),
  0, -0.10, 0.61,  0.2, -0.3, 0.8
);

// End hook — small L-shaped dark piece at tape tip
addTapePart(
  new THREE.BoxGeometry(0.28, 0.07, 0.06), darkMat.clone(),
  0, -0.10, 1.035,  0.2, -0.4, 1.0
);

// ProCraft label face — slightly lighter panel on front
const labelFace = new THREE.Mesh(
  new THREE.BoxGeometry(0.50, 0.38, 0.005),
  new THREE.MeshStandardMaterial({ color: 0x2a2418, roughness: 0.6, metalness: 0.3 })
);
labelFace.position.set(0, 0.06, 0.192);
tapeGroup.add(labelFace);

// Position: mid-right, between hammer and saw blade
tapeGroup.position.set(1.8, 0.5, 1.0);
tapeGroup.rotation.z = -0.2;
tapeGroup.rotation.y = -0.4;  // show front face + slight side depth
scene.add(tapeGroup);

const tpBounds = new THREE.Mesh(
  new THREE.BoxGeometry(0.9, 0.9, 1.2),
  new THREE.MeshBasicMaterial({ visible: false })
);
tpBounds.userData.toolId = 'tape';
tapeGroup.add(tpBounds);

// Tape band subtle pulse animation data
tapeGroup.userData.bandPulse = 0;
```

**Step 2: Add tape band subtle loop animation**

In the render loop, add:

```js
// Tape band subtle extend/retract pulse
tapeGroup.userData.bandPulse += 0.008;
const bandScale = 1.0 + Math.sin(tapeGroup.userData.bandPulse) * 0.12;
// scale the extended band along Z
const bandMesh = tapeGroup.children.find(c => c.geometry && c.geometry.parameters && c.geometry.parameters.depth > 0.8);
if (bandMesh) bandMesh.scale.z = bandScale;
```

**Step 3: Add tape tooltip info**

```js
tape: {
  title: 'TAPE MEASURE', sub: '25 ft / 7.5 m',
  desc: 'Measuring · Layout\nMarking · Estimation',
  hint: '[T] panel  ·  drag to spin  ·  dbl-click burst',
  specs: { Length: '7.5 m / 25 ft', Width: '28 mm', 'Blade': 'Nylon Coated', Accuracy: 'Class II' },
  apps: ['Measuring & Layout', 'Marking & Estimation'],
  cta: 'Get a Quote',
},
```

**Step 4: Add to allToolParts**

```js
const allToolParts = [...hammerParts, ...wrenchParts, ...sawParts, ...squareParts, ...tapeParts];
```

**Step 5: Verify visually**

Tape measure should appear mid-right, compact housing visible, yellow band extending forward from the slot, end hook at tip. Band should gently pulse in/out.

**Step 6: Commit**

```bash
git add three-scene.js
git commit -m "feat: add tape measure with extending band animation"
```

---

### Task 5: Upgrade hammer + wrench geometry fidelity

**Files:**
- Modify: `three-scene.js` — hammer section (~lines 457–494), wrench section (~lines 496–532)

Higher segment counts and additional detail parts make the existing tools match the quality level of the new ones.

**Step 1: Upgrade hammer handle**

Find the hammer handle shaft line:
```js
addHammerPart(new THREE.CylinderGeometry(0.075, 0.075, 2.05, 8), ...)
```
Change `8` segments to `16`:
```js
addHammerPart(new THREE.CylinderGeometry(0.075, 0.085, 2.05, 16), steelMat.clone(), 0, -0.80, 0, -0.5, -1.2, 0.2);
```

**Step 2: Add knurling to hammer handle**

After the grip part, add 6 knurl rings:
```js
// Knurling rings on handle — darker bands spaced along grip zone
for (let k = 0; k < 6; k++) {
  const knurl = new THREE.Mesh(
    new THREE.TorusGeometry(0.102, 0.008, 6, 16),
    new THREE.MeshStandardMaterial({ color: 0x0f0d0a, roughness: 0.85, metalness: 0.2 })
  );
  knurl.castShadow = true;
  knurl.rotation.x = Math.PI / 2;
  knurl.position.set(0, -1.25 - k * 0.09, 0);
  hammerGroup.add(knurl);
}
```

**Step 3: Add chamfer detail to hammer head**

Add a thin bevel strip along the top edge of the head:
```js
// Head top bevel strip — thin amber highlight strip
addHammerPart(
  new THREE.BoxGeometry(1.45, 0.03, 0.54),
  new THREE.MeshStandardMaterial({ color: 0xe8a040, roughness: 0.12, metalness: 0.95 }),
  0, 1.045, 0,  1.2, 1.0, 0.4
);
```

**Step 4: Upgrade wrench handle segments**

Find wrench handle:
```js
addWrenchPart(new THREE.CylinderGeometry(0.10, 0.13, 2.4, 10), ...)
```
Change to `20` segments:
```js
addWrenchPart(new THREE.CylinderGeometry(0.10, 0.13, 2.4, 20), steelMat.clone(), 0, -0.55, 0, -1.0, -1.5, 0.2);
```

**Step 5: Add adjustment worm screw detail to wrench**

```js
// Worm screw / adjuster detail — small cylinder perpendicular to handle
const wormScrew = new THREE.Mesh(
  new THREE.CylinderGeometry(0.06, 0.06, 0.30, 12),
  new THREE.MeshStandardMaterial({ color: 0xc8b878, roughness: 0.08, metalness: 0.96 })
);
wormScrew.castShadow = true;
wormScrew.rotation.z = Math.PI / 2;
wormScrew.position.set(0, 0.55, 0);
wrenchGroup.add(wormScrew);
```

**Step 6: Verify visually**

Hammer should show visible knurl bands on grip. Wrench should have the small adjuster wheel detail on the side.

**Step 7: Commit**

```bash
git add three-scene.js
git commit -m "feat: upgrade hammer and wrench geometry with knurling and detail parts"
```

---

### Task 6: Mixed amber + blue-white particle system + fog density

**Files:**
- Modify: `three-scene.js` — particle section (~lines 321–338) and fog line (~line 40)

**Step 1: Update fog density**

Find: `scene.fog = new THREE.FogExp2(0x05070d, 0.018);`
Replace with: `scene.fog = new THREE.FogExp2(0x04060c, 0.024);`

**Step 2: Replace single particle system with two layered systems**

Find the entire `/* ─── Amber particles` block and replace with:

```js
/* ─── Particle Systems ─────────────────────────────────── */
// Amber dust particles — main layer
const AMBER_COUNT = 1800;
const amberPositions = new Float32Array(AMBER_COUNT * 3);
for (let i = 0; i < AMBER_COUNT; i++) {
  const theta = rand(0, Math.PI * 2);
  const phi = Math.acos(rand(-1, 1));
  const r = rand(0, 11);
  amberPositions[i * 3]     = r * Math.sin(phi) * Math.cos(theta);
  amberPositions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
  amberPositions[i * 3 + 2] = r * Math.cos(phi);
}
const amberParticleGeo = new THREE.BufferGeometry();
amberParticleGeo.setAttribute('position', new THREE.BufferAttribute(amberPositions, 3));
const amberParticleMat = new THREE.PointsMaterial({
  color: 0xd4820a, size: 0.016, sizeAttenuation: true,
  transparent: true, opacity: 0.75,
  blending: THREE.AdditiveBlending, depthWrite: false,
});
const amberParticles = new THREE.Points(amberParticleGeo, amberParticleMat);
scene.add(amberParticles);

// Blue-white spark particles — secondary layer, smaller, brighter
const SPARK_COUNT = 900;
const sparkPositions = new Float32Array(SPARK_COUNT * 3);
for (let i = 0; i < SPARK_COUNT; i++) {
  const theta = rand(0, Math.PI * 2);
  const phi = Math.acos(rand(-1, 1));
  const r = rand(1, 9);
  sparkPositions[i * 3]     = r * Math.sin(phi) * Math.cos(theta);
  sparkPositions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
  sparkPositions[i * 3 + 2] = r * Math.cos(phi);
}
const sparkGeo = new THREE.BufferGeometry();
sparkGeo.setAttribute('position', new THREE.BufferAttribute(sparkPositions, 3));
const sparkMat = new THREE.PointsMaterial({
  color: 0x88ccff, size: 0.010, sizeAttenuation: true,
  transparent: true, opacity: 0.55,
  blending: THREE.AdditiveBlending, depthWrite: false,
});
const sparkParticles = new THREE.Points(sparkGeo, sparkMat);
scene.add(sparkParticles);
```

**Step 3: Update particle rotation in render loop**

Find where `particles.rotation.y +=` is updated and replace with:

```js
amberParticles.rotation.y += 0.00012;
amberParticles.rotation.x += 0.000045;
sparkParticles.rotation.y -= 0.00018; // counter-rotate for depth complexity
sparkParticles.rotation.z += 0.000055;
```

**Step 4: Verify visually**

Should see both amber dust and blue-white spark particles. The counter-rotation of spark particles creates a layered depth effect. Fog should be slightly denser, making background girder debris fade faster.

**Step 5: Commit**

```bash
git add three-scene.js
git commit -m "feat: dual particle system (amber + blue-white sparks), denser fog"
```

---

### Task 7: Update annotation lines + final polish

**Files:**
- Modify: `three-scene.js` — annotation section (~lines 424–436) and keyboard shortcuts in event listeners

**Step 1: Update annotation positions to match new tool layout**

Find `const annotGeo1` and `const annotGeo2`. Update to span the new tool positions:

```js
// Annot 1: spans from saw blade (upper center) to hammer (right) — diagonal suggestion
const annotGeo1 = makeAnnotation(0.5, 1.85, 2.4, 0.2, 1.8, 0.16);
const annot1     = makeAnnotMesh(annotGeo1, 0x4488cc, 0.60, false);
const annot1Glow = makeAnnotMesh(makeAnnotation(0.5, 1.85, 2.4, 0.2, 1.8, 0.24), 0x88ccff, 0.20, true);
scene.add(annot1);
scene.add(annot1Glow);

// Annot 2: vertical on left, near wrench + carpenter's square
const annotGeo2 = makeAnnotation(-2.6, -0.8, -2.6, 0.3, 1.2, 0.16);
const annot2     = makeAnnotMesh(annotGeo2, 0x4488cc, 0.60, false);
const annot2Glow = makeAnnotMesh(makeAnnotation(-2.6, -0.8, -2.6, 0.3, 1.2, 0.24), 0x88ccff, 0.20, true);
scene.add(annot2);
scene.add(annot2Glow);
```

**Step 2: Add keyboard shortcuts for new tools**

Find the `keydown` event listener. Add cases for new tool IDs:

```js
case 's': case 'S': openPanel('saw'); break;
case 'q': case 'Q': openPanel('square'); break;
case 't': case 'T': openPanel('tape'); break;
```

Remove or repurpose the old `'l'` / `'L'` level shortcut.

**Step 3: Verify the full scene end-to-end**

Open `index.html`. Check:
- [ ] Saw blade spins, hub glows amber
- [ ] Carpenter's square shows both arms with tick marks
- [ ] Tape measure shows housing + yellow band + end hook
- [ ] Hammer has visible knurl rings
- [ ] Wrench has worm screw detail
- [ ] All tools show RectAreaLight rectangular highlights on metal surfaces
- [ ] Both amber + blue-white particle layers visible
- [ ] Assembly animation plays on load (all parts fly in)
- [ ] Hover tooltip works on all 5 tools
- [ ] Keyboard shortcuts S, Q, T open info panels
- [ ] Fog is visibly denser than before

**Step 4: Commit**

```bash
git add three-scene.js
git commit -m "feat: update annotations for new tool positions, add keyboard shortcuts for new tools"
```

---

## Notes for Implementer

- **r134 constraint:** `RectAreaLight` works in r134 but requires `THREE.RectAreaLightUniformsLib.init()`. If that property doesn't exist on the global THREE object, fall back to a strong `SpotLight` array instead.
- **CubeCamera env:** The env map setup must happen before any materials are created (or materials must be created after and assigned `scene.environment` propagates). If env isn't visible, add `material.needsUpdate = true` after scene environment is set.
- **Position tuning:** The exact `position.set()` values in this plan are starting points — visually tune each tool's position after adding it so the composition feels balanced. The screenshot shows hammer right, wrench left, tools filling the frame without overlapping the hero copy text area.
- **Performance:** Total draw calls will increase. If frame rate drops, reduce `TOOTH_COUNT` from 24→16 on the saw blade and reduce `AMBER_COUNT` from 1800→1200.
