# Workshop Scene Redesign — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the current scattered Three.js hero scene with a cohesive "dark forge workshop" art scene — three high-quality procedural tools in a triangular composition, a reflective floor, cinematic lighting, and a physics-driven magnetic particle field that responds to mouse/touch.

**Architecture:** All changes are in `three-scene.js` (single 1873-line vanilla JS IIFE, no build step). Tasks are ordered so each is a self-contained, visually-testable improvement. The particle physics system runs entirely on the CPU using `Float32Array` velocity buffers — no external physics library needed. Tool geometry is upgraded from box-primitive to `LatheGeometry` / `ExtrudeGeometry` profiles for the wrench and hammer.

**Tech Stack:** Three.js r134 (CDN, already loaded), vanilla JS, no build step, no new dependencies.

---

## Reference: Key line ranges in current `three-scene.js`

| Block | Lines |
|---|---|
| Renderer + RectAreaLight init | 20–37 |
| Scene + env cube | 46–68 |
| Lights block | 239–301 |
| Materials block | 321–379 |
| Debris group | 383–435 |
| Particle systems | 437–492 |
| Blueprint grids | 494–524 |
| Scan line + glow | 526–550 |
| Annotation stubs | 555–583 |
| Assembly helpers | 585–602 |
| Hammer group | 604–674 |
| Wrench group | 676–727 |
| Saw blade group | 729–841 |
| Screwdriver group | 843–898 |
| Hand level group | 900–970 |
| allToolParts line | 973 |
| toolInfo object | 999–1040 |
| Hover emissive loop | 1675–1687 |
| Spin animation loop | 1689–1699 |
| Disassembly loop | 1702–1726 |
| Idle rotation block | 1739–1755 |
| Tool float / parallax | 1757–1793 |
| Opacity/fade block | 1799–1820 |
| getToolGroup fn | 1259–1265 |
| hoverEmissive obj | 1257 |
| spinState obj | 1268–1274 |
| disassembleState obj | 1327–1333 |
| inertia obj | 1288 |
| getToolParts fn | 1336–1342 |
| raycaster traversal | 1308 |
| Touch traversal | 1433 |
| Animation loop end | 1854 |

---

## Task 1: Hard-delete screwdriver and hand level

**Files:**
- Modify: `three-scene.js`

This is a pure deletion task. Remove all code related to the screwdriver and hand level so subsequent tasks have no dead references.

**Step 1: Delete screwdriver group block**

Remove lines 843–898 entirely (from `/* ─── Screwdriver` through `screwdriverGroup.add(sdBounds);`).

**Step 2: Delete hand level group block**

Remove lines 900–970 (from `/* ─── Hand Level` through `levelGroup.add(lvBounds);`).

**Step 3: Update `allToolParts` line (~line 973)**

Change:
```js
const allToolParts = [...hammerParts, ...wrenchParts, ...sawParts, ...screwdriverParts, ...levelParts];
```
To:
```js
const allToolParts = [...hammerParts, ...wrenchParts, ...sawParts];
```

**Step 4: Update `toolInfo` object**

Remove the `screwdriver` and `level` keys from the `toolInfo` object (~lines 1024–1039).

**Step 5: Update `hoverEmissive` object (~line 1257)**

Change:
```js
const hoverEmissive = { hammer: 0, wrench: 0, saw: 0, screwdriver: 0, level: 0 };
```
To:
```js
const hoverEmissive = { hammer: 0, wrench: 0, saw: 0 };
```

**Step 6: Update `spinState` object**

Change:
```js
const spinState = {
  hammer:      { spinning: false, spinStart: 0, spinFrom: 0 },
  wrench:      { spinning: false, spinStart: 0, spinFrom: 0 },
  saw:         { spinning: false, spinStart: 0, spinFrom: 0 },
  screwdriver: { spinning: false, spinStart: 0, spinFrom: 0 },
  level:       { spinning: false, spinStart: 0, spinFrom: 0 },
};
```
To:
```js
const spinState = {
  hammer: { spinning: false, spinStart: 0, spinFrom: 0 },
  wrench: { spinning: false, spinStart: 0, spinFrom: 0 },
  saw:    { spinning: false, spinStart: 0, spinFrom: 0 },
};
```

**Step 7: Update `disassembleState` object**

Change to:
```js
const disassembleState = {
  hammer: { exploded: false, animating: false, startTime: 0, goingOut: false },
  wrench: { exploded: false, animating: false, startTime: 0, goingOut: false },
  saw:    { exploded: false, animating: false, startTime: 0, goingOut: false },
};
```

**Step 8: Update `inertia` object**

Change:
```js
const inertia = { hammer: 0, wrench: 0, saw: 0, screwdriver: 0, level: 0 };
```
To:
```js
const inertia = { hammer: 0, wrench: 0, saw: 0 };
```

**Step 9: Update `getToolGroup` function**

Change to:
```js
function getToolGroup(id) {
  if (id === 'hammer') return hammerGroup;
  if (id === 'wrench') return wrenchGroup;
  return sawGroup;
}
```

**Step 10: Update `getToolParts` function**

Change to:
```js
function getToolParts(id) {
  if (id === 'hammer') return hammerParts;
  if (id === 'wrench') return wrenchParts;
  return sawParts;
}
```

**Step 11: Update all `forEach` loops that reference the 5-tool array**

Find every occurrence of:
```js
[hammerGroup, wrenchGroup, sawGroup, screwdriverGroup, levelGroup].forEach(...)
```
Replace each with:
```js
[hammerGroup, wrenchGroup, sawGroup].forEach(...)
```
(There are 3 occurrences: raycaster traversal in mousemove, touch traversal in touchend, and responsive layout.)

**Step 12: Update hover emissive loop in animate (~line 1675)**

Change:
```js
['hammer', 'wrench', 'saw', 'screwdriver'].forEach(id => {
```
To:
```js
['hammer', 'wrench', 'saw'].forEach(id => {
```

**Step 13: Update spin animation loop**

Change:
```js
['hammer', 'wrench', 'saw', 'screwdriver'].forEach(id => {
```
To:
```js
['hammer', 'wrench', 'saw'].forEach(id => {
```

**Step 14: Update disassembly loop**

Same — change `['hammer', 'wrench', 'saw', 'screwdriver']` to `['hammer', 'wrench', 'saw']`.

**Step 15: Update inertia decay loop**

Same — change to `['hammer', 'wrench', 'saw']`.

**Step 16: Remove screwdriver/level float blocks from animate loop**

Remove:
```js
// Screwdriver float
screwdriverGroup.position.y = ...
...
// Level float
levelGroup.position.y = ...
...
```

**Step 17: Update responsive layout function**

Remove all `screwdriverGroup` and `levelGroup` references from `applyResponsiveLayout()`.

**Step 18: Update keyboard shortcuts**

Change `'Q'` to open nothing (or remove), keep `'T'` only if desired. Simplest: remove `Q` and `T` cases, keep `H`, `W`, `S`.

**Step 19: Verify**

Open `index.html` in browser. Scene should show hammer, wrench, saw blade only. No JS errors in console.

**Step 20: Commit**

```bash
git add three-scene.js
git commit -m "refactor: hard-delete screwdriver and hand level, scene now has 3 tools"
```

---

## Task 2: Replace annotation stubs with true zero-opacity removal

**Files:**
- Modify: `three-scene.js` — lines ~555–583 and animate loop references

The current annotation code creates 4 LineSegments objects with opacity 0. They still consume draw calls. Remove them entirely.

**Step 1: Delete annotation block**

Remove lines ~555–583 (from `/* ─── Dimension annotation lines` through the four `scene.add(annot*Glow)` calls).

**Step 2: Remove annotation opacity lines from animate loop**

Find and delete:
```js
annot1.material.opacity     = toolAlpha * 0.65;
annot2.material.opacity     = toolAlpha * 0.65;
annot1Glow.material.opacity = toolAlpha * 0.22;
annot2Glow.material.opacity = toolAlpha * 0.22;
```

**Step 3: Commit**

```bash
git add three-scene.js
git commit -m "refactor: remove zero-opacity annotation line geometry"
```

---

## Task 3: Add dark reflective floor plane

**Files:**
- Modify: `three-scene.js` — add after blueprint grids block (~line 524)

A MeshStandardMaterial plane with very low roughness + a MirrorReflection-like effect is too heavy for r134 without extra imports. Instead: use a dark plane with `roughness: 0.08, metalness: 0.9` and a second identical plane below it with `blending: THREE.AdditiveBlending` and low opacity to simulate a soft reflection glow. This is the standard faked-reflection technique used in product renders.

**Step 1: Add floor plane after the `scene.add(horizonGrid)` line**

```js
/* ─── Reflective floor plane ──────────────────────────── */
const floorPlane = new THREE.Mesh(
  new THREE.PlaneGeometry(28, 28, 1, 1),
  new THREE.MeshStandardMaterial({
    color: 0x080a0f,
    roughness: 0.08,
    metalness: 0.92,
    envMapIntensity: 1.4,
  })
);
floorPlane.rotation.x = -Math.PI / 2;
floorPlane.position.y = -2.55;
floorPlane.receiveShadow = true;
scene.add(floorPlane);

// Soft glow bloom on floor — additive overlay plane slightly above floor
const floorGlow = new THREE.Mesh(
  new THREE.PlaneGeometry(14, 14, 1, 1),
  new THREE.MeshBasicMaterial({
    color: 0x1a0e04,
    transparent: true,
    opacity: 0.28,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  })
);
floorGlow.rotation.x = -Math.PI / 2;
floorGlow.position.y = -2.50;
scene.add(floorGlow);
```

**Step 2: Add floor fade to opacity/scroll block in animate loop**

Find `floorGrid.material.opacity = toolAlpha * 0.55;` and add below it:
```js
floorPlane.material.opacity = toolAlpha; // MeshStandardMaterial supports opacity if transparent:true — but here we just show/hide
floorGlow.material.opacity  = toolAlpha * 0.28;
```
> Note: `floorPlane` doesn't need `transparent: true` — it stays opaque. Only `floorGlow` needs to fade. Remove the `floorPlane.material.opacity` line and just leave the `floorGlow` fade.

**Step 3: Verify**

A dark reflective floor should appear at y = -2.55, catching the amber key light as a subtle highlight.

**Step 4: Commit**

```bash
git add three-scene.js
git commit -m "feat: add dark reflective floor plane with additive glow overlay"
```

---

## Task 4: Rebuild hammer with LatheGeometry handle + ExtrudeGeometry head

**Files:**
- Modify: `three-scene.js` — replace entire hammer block (~lines 604–674)

This replaces the box-primitive hammer with a proper procedural model. The handle uses `LatheGeometry` for a smooth hickory-profile taper. The head uses `ExtrudeGeometry` from a `THREE.Shape` for a proper rectangular-with-chamfer silhouette. The claw uses two `ExtrudeGeometry` curved prong shapes.

**Step 1: Replace the entire hammer block**

Delete everything from `/* ─── Hammer` through `hammerGroup.add(hmBounds);` and replace with:

```js
/* ─── Hammer ─────────────────────────────────────────── */
const hammerGroup = new THREE.Group();
const hammerParts = [];

function addHammerPart(geo, mat, px, py, pz, sx, sy, sz) {
  const mesh = new THREE.Mesh(geo, mat);
  mesh.castShadow = true;
  mesh.position.set(px, py, pz);
  hammerGroup.add(mesh);
  registerPart(mesh, sx, sy, sz, hammerParts);
  return mesh;
}

// ── Handle: LatheGeometry — hickory profile, tapered with ergonomic waist
const handlePoints = [
  new THREE.Vector2(0.055, 0.00),   // pommel base
  new THREE.Vector2(0.072, 0.08),   // pommel flare
  new THREE.Vector2(0.068, 0.18),
  new THREE.Vector2(0.058, 0.55),   // upper grip
  new THREE.Vector2(0.052, 0.90),   // waist
  new THREE.Vector2(0.058, 1.20),
  new THREE.Vector2(0.062, 1.55),
  new THREE.Vector2(0.072, 1.85),   // shoulder
  new THREE.Vector2(0.078, 2.00),   // neck transition
];
const handleGeo = new THREE.LatheGeometry(handlePoints, 20);
const handleMesh = addHammerPart(handleGeo, darkMat.clone(), 0, -0.82, 0, -0.5, -1.2, 0.3);

// Handle grip rings — 5 torus rings on lower third for texture
for (let k = 0; k < 5; k++) {
  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(0.082, 0.007, 6, 18),
    new THREE.MeshStandardMaterial({ color: 0x0d0b08, roughness: 0.88, metalness: 0.15 })
  );
  ring.rotation.x = Math.PI / 2;
  ring.position.set(0, -1.55 + k * 0.18, 0);
  hammerGroup.add(ring);
  registerPart(ring, 0, -0.9 - k * 0.2, 0.2, hammerParts);
}

// ── Head: ExtrudeGeometry — proper rectangular head with chamfered corners
const headShape = new THREE.Shape();
const hw = 0.72, hh = 0.26, chamfer = 0.04;
headShape.moveTo(-hw + chamfer, -hh);
headShape.lineTo( hw - chamfer, -hh);
headShape.quadraticCurveTo( hw, -hh,  hw, -hh + chamfer);
headShape.lineTo( hw,  hh - chamfer);
headShape.quadraticCurveTo( hw,  hh,  hw - chamfer,  hh);
headShape.lineTo(-hw + chamfer,  hh);
headShape.quadraticCurveTo(-hw,  hh, -hw,  hh - chamfer);
headShape.lineTo(-hw, -hh + chamfer);
headShape.quadraticCurveTo(-hw, -hh, -hw + chamfer, -hh);

const headGeo = new THREE.ExtrudeGeometry(headShape, {
  depth: 0.48,
  bevelEnabled: true,
  bevelThickness: 0.025,
  bevelSize: 0.022,
  bevelSegments: 3,
});
const headMesh = addHammerPart(headGeo, steelMat.clone(), -hw, 0.78, -0.24, 1.4, 0.7, 0.3);

// Face plate — striking face disc, polished
addHammerPart(
  new THREE.CylinderGeometry(0.20, 0.20, 0.06, 20),
  new THREE.MeshStandardMaterial({ color: 0xe0d8c0, roughness: 0.03, metalness: 0.99 }),
  hw + 0.03, 0.78, 0, 0.3, 0.5, 0.8
);

// Face concentric rings — embossed detail on striking face
for (let r = 1; r <= 3; r++) {
  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(r * 0.055, 0.006, 5, 18),
    new THREE.MeshStandardMaterial({ color: 0xb8b090, roughness: 0.12, metalness: 0.95 })
  );
  ring.rotation.y = Math.PI / 2;
  ring.position.set(hw + 0.06, 0.78, 0);
  hammerGroup.add(ring);
}

// ── Claw: two ExtrudeGeometry curved prongs
for (let side of [-1, 1]) {
  const clawShape = new THREE.Shape();
  // Curved prong profile — narrows to a point
  clawShape.moveTo(0, 0);
  clawShape.lineTo(0.045, 0);
  clawShape.quadraticCurveTo(0.05, 0.18, 0.02, 0.40);
  clawShape.quadraticCurveTo(0.01, 0.48, 0, 0.50);
  clawShape.quadraticCurveTo(-0.01, 0.48, -0.02, 0.40);
  clawShape.quadraticCurveTo(-0.015, 0.18, -0.045, 0);
  clawShape.lineTo(0, 0);

  const clawGeo = new THREE.ExtrudeGeometry(clawShape, {
    depth: 0.08,
    bevelEnabled: true,
    bevelThickness: 0.008,
    bevelSize: 0.007,
    bevelSegments: 2,
  });
  const clawMesh = new THREE.Mesh(clawGeo, steelMat.clone());
  clawMesh.castShadow = true;
  // Position at rear of head, angled back and outward
  clawMesh.position.set(-hw - 0.44, 0.68, side * 0.14 - 0.04);
  clawMesh.rotation.z = -0.30; // angle upward
  clawMesh.rotation.y = side * 0.12;
  hammerGroup.add(clawMesh);
  registerPart(clawMesh, -1.8, 0.5, side * 0.5, hammerParts);
}

// ── Neck connector
addHammerPart(
  new THREE.BoxGeometry(0.22, 0.32, 0.26),
  steelMat.clone(),
  0, 0.30, 0, 0, -0.4, 0.3
);

// Amber bevel strip on top of head
addHammerPart(
  new THREE.BoxGeometry(1.48, 0.04, 0.50),
  new THREE.MeshStandardMaterial({ color: 0xe8a040, roughness: 0.10, metalness: 0.96 }),
  0, 1.06, 0, 1.2, 1.0, 0.4
);

// Position + orient: right-front of composition, tilted toward viewer
hammerGroup.position.set(1.4, 0.3, 2.0);
hammerGroup.rotation.z = 0.22;
hammerGroup.rotation.y = -0.55; // jaw faces left-inward toward wrench
scene.add(hammerGroup);

const hmBounds = new THREE.Mesh(
  new THREE.BoxGeometry(2.0, 3.2, 0.9),
  new THREE.MeshBasicMaterial({ visible: false })
);
hmBounds.userData.toolId = 'hammer';
hammerGroup.add(hmBounds);
```

**Step 2: Verify**

Hammer should appear right-front. Handle should be visibly smooth/curved (no facets). Head should have crisp chamfered edges. Two curved claw prongs visible at rear.

**Step 3: Commit**

```bash
git add three-scene.js
git commit -m "feat: rebuild hammer with LatheGeometry handle and ExtrudeGeometry head/claws"
```

---

## Task 5: Rebuild wrench with LatheGeometry handle + Shape-extruded jaw

**Files:**
- Modify: `three-scene.js` — replace entire wrench block (~lines 676–727)

**Step 1: Replace the entire wrench block**

Delete everything from `/* ─── Wrench` through `wrenchGroup.add(wrBounds);` and replace with:

```js
/* ─── Wrench ─────────────────────────────────────────── */
const wrenchGroup = new THREE.Group();
const wrenchParts = [];

function addWrenchPart(geo, mat, px, py, pz, sx, sy, sz) {
  const mesh = new THREE.Mesh(geo, mat);
  mesh.castShadow = true;
  mesh.position.set(px, py, pz);
  wrenchGroup.add(mesh);
  registerPart(mesh, sx, sy, sz, wrenchParts);
  return mesh;
}

// ── Handle: LatheGeometry — smooth machined taper, slight ergonomic waist
const wrHandlePoints = [
  new THREE.Vector2(0.060, 0.00),
  new THREE.Vector2(0.075, 0.10),
  new THREE.Vector2(0.070, 0.40),
  new THREE.Vector2(0.062, 0.85),   // waist
  new THREE.Vector2(0.068, 1.25),
  new THREE.Vector2(0.078, 1.65),
  new THREE.Vector2(0.092, 2.00),
  new THREE.Vector2(0.105, 2.30),   // shoulder toward jaw body
];
const wrHandleGeo = new THREE.LatheGeometry(wrHandlePoints, 22);
addWrenchPart(wrHandleGeo, steelMat.clone(), 0, -0.65, 0, -1.0, -1.6, 0.2);

// Knurl band — grip section, 4 torus rings
for (let k = 0; k < 4; k++) {
  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(0.074, 0.009, 6, 18),
    new THREE.MeshStandardMaterial({ color: 0x0e0c09, roughness: 0.85, metalness: 0.2 })
  );
  ring.rotation.x = Math.PI / 2;
  ring.position.set(0, -1.30 + k * 0.22, 0);
  wrenchGroup.add(ring);
  registerPart(ring, -0.4, -0.8 - k * 0.2, 0.2, wrenchParts);
}

// ── Jaw body: ExtrudeGeometry — adjustable wrench C-jaw profile
const jawShape = new THREE.Shape();
// Outer jaw envelope — the wide bridge + two jaw arms
jawShape.moveTo(-0.50, 0);
jawShape.lineTo( 0.50, 0);
jawShape.lineTo( 0.50, 0.30); // bottom of bridge
// Right (adjustable) jaw arm — shorter, inner face angled
jawShape.lineTo( 0.25, 0.30);
jawShape.lineTo( 0.25, 0.82);  // jaw tip
jawShape.lineTo( 0.10, 0.82);
jawShape.lineTo( 0.10, 0.30);
// Jaw gap — inner channel
jawShape.lineTo(-0.10, 0.30);
// Left (fixed) jaw arm — taller
jawShape.lineTo(-0.10, 0.95);
jawShape.lineTo(-0.25, 0.95);
jawShape.lineTo(-0.25, 0.30);
// Close bottom left
jawShape.lineTo(-0.50, 0.30);
jawShape.lineTo(-0.50, 0);

const jawGeo = new THREE.ExtrudeGeometry(jawShape, {
  depth: 0.26,
  bevelEnabled: true,
  bevelThickness: 0.018,
  bevelSize: 0.015,
  bevelSegments: 2,
});
addWrenchPart(jawGeo, chromeMat.clone(), -0.50, 1.30, -0.13, 0.6, 0.9, 0.3);

// Worm adjuster wheel — cylindrical roller between jaw arms
const wormGeo = new THREE.CylinderGeometry(0.062, 0.062, 0.32, 14);
const wormMesh = new THREE.Mesh(wormGeo, new THREE.MeshStandardMaterial({
  color: 0xd8d0b8, roughness: 0.06, metalness: 0.98
}));
wormMesh.castShadow = true;
wormMesh.rotation.z = Math.PI / 2;
wormMesh.position.set(0.18, 1.58, 0);
wrenchGroup.add(wormMesh);
registerPart(wormMesh, 0.6, 0.8, -0.5, wrenchParts);

// Worm knurling rings — 8 thin rings along roller
for (let k = 0; k < 8; k++) {
  const kr = new THREE.Mesh(
    new THREE.TorusGeometry(0.064, 0.005, 5, 14),
    new THREE.MeshStandardMaterial({ color: 0x0e0c09, roughness: 0.9, metalness: 0.1 })
  );
  kr.rotation.y = Math.PI / 2;
  kr.position.set(0.18, 1.58, -0.14 + k * 0.04);
  wrenchGroup.add(kr);
}

// Position + orient: left-front of composition, jaw opening faces inward toward hammer
wrenchGroup.position.set(-1.6, 0.5, 2.0);
wrenchGroup.rotation.z = 0.15;
wrenchGroup.rotation.y = 0.60; // jaw opening angled toward viewer
scene.add(wrenchGroup);

const wrBounds = new THREE.Mesh(
  new THREE.BoxGeometry(1.2, 3.4, 0.6),
  new THREE.MeshBasicMaterial({ visible: false })
);
wrBounds.userData.toolId = 'wrench';
wrenchGroup.add(wrBounds);
```

**Step 2: Verify**

Wrench left-front. Handle visibly smooth/cylindrical. Jaw has clear C-opening with two arms of different height. Worm roller clearly visible between arms.

**Step 3: Commit**

```bash
git add three-scene.js
git commit -m "feat: rebuild wrench with LatheGeometry handle and ExtrudeGeometry jaw profile"
```

---

## Task 6: Reposition all three tools into triangular composition + update saw blade

**Files:**
- Modify: `three-scene.js` — position/rotation values and saw blade position

The triangular composition: saw blade is the apex (center, back, elevated), hammer is right-front, wrench is left-front. All three face slightly inward. The saw blade spins at a rate controlled by horizontal mouse position.

**Step 1: Verify hammer and wrench positions**

From Task 4, hammer is at `(1.4, 0.3, 2.0)` and wrench at `(-1.6, 0.5, 2.0)`. These are correct for the triangle base.

**Step 2: Reposition saw blade to apex**

Find `sawGroup.position.set(0, 1.7, 0.6);` and change to:
```js
sawGroup.position.set(0, 1.9, -0.2); // apex: center, elevated, pushed back
```

**Step 3: Replace saw spin speed with mouse-driven control**

Find in the animate loop:
```js
// Saw blade continuous spin
sawGroup.rotation.z += sawGroup.userData.spinSpeed;
```
Replace with:
```js
// Saw blade spin speed driven by horizontal mouse position
// mouseX is already normalised −1..+1 (updated in mousemove handler)
// Base speed 0.003, max speed 0.025 when mouse is at far right
const sawTargetSpeed = 0.003 + Math.max(0, mouseX) * 0.022;
sawGroup.userData.currentSpeed = (sawGroup.userData.currentSpeed || 0.003) * 0.96
  + sawTargetSpeed * 0.04; // smooth lerp
sawGroup.rotation.z += sawGroup.userData.currentSpeed;
```

**Step 4: Update saw float in animate loop**

Find the existing saw float (if any) or add after wrench float:
```js
// Saw blade float — gentle vertical oscillation, apex position
sawGroup.position.y = 1.9 + Math.sin(time * 0.0005 + 0.4) * 0.08;
sawGroup.position.x = camRotY * -1.2;
```

**Step 5: Update tool float positions in animate loop**

Find the hammer and wrench float blocks and update:

Hammer float:
```js
hammerGroup.position.y = 0.3 + Math.sin(time * 0.0006) * 0.10;
hammerGroup.position.x =  1.4 + camRotY * -1.8;
hammerGroup.position.z =  2.0 + camRotX * -0.5;
if (!spinState.hammer.spinning && dragTool !== 'hammer') {
  hammerGroup.rotation.y = hammerIdleY + (-0.55) + camRotY * 0.32;
  hammerGroup.rotation.z = 0.22 + mouseX * -0.06;
}
```

Wrench float:
```js
wrenchGroup.position.y = 0.5 + Math.sin(time * 0.0006 + 1.2) * 0.10;
wrenchGroup.position.x = -1.6 + camRotY * -1.6;
wrenchGroup.position.z =  2.0 + camRotX * -0.5;
if (!spinState.wrench.spinning && dragTool !== 'wrench') {
  wrenchGroup.rotation.y = wrenchIdleY + 0.60 + camRotY * 0.28;
  wrenchGroup.rotation.z = 0.15 + mouseX * 0.05;
}
```

**Step 6: Update responsive layout**

In `applyResponsiveLayout`, update the positions used for mobile/narrow:
```js
if (isNarrow) {
  camera.fov = 48;
  [hammerGroup, wrenchGroup].forEach(g => g.scale.setScalar(0.72));
  sawGroup.scale.setScalar(0.85);
  hammerGroup.position.set( 1.0, 0.2, 1.8);
  wrenchGroup.position.set(-1.1, 0.4, 1.6);
  sawGroup.position.set(0, 1.6, -0.1);
} else if (isMobile) {
  camera.fov = 52;
  [hammerGroup, wrenchGroup].forEach(g => g.scale.setScalar(0.82));
  sawGroup.scale.setScalar(0.90);
  hammerGroup.position.set( 1.2, 0.2, 1.9);
  wrenchGroup.position.set(-1.3, 0.4, 1.8);
  sawGroup.position.set(0, 1.7, -0.1);
} else {
  camera.fov = 60;
  [hammerGroup, wrenchGroup, sawGroup].forEach(g => g.scale.setScalar(1.0));
}
```

**Step 7: Verify**

Three tools should form a clear triangular arrangement. Saw blade apex center-back, elevated. Hammer right-front, wrench left-front. Moving mouse left-to-right speeds up the saw blade noticeably.

**Step 8: Commit**

```bash
git add three-scene.js
git commit -m "feat: triangular composition + mouse-driven saw blade speed"
```

---

## Task 7: Replace particle system with physics-driven magnetic dust

**Files:**
- Modify: `three-scene.js` — replace particle block (~lines 437–492) and add physics update to animate loop

This is the core interactivity upgrade. Replace the passive rotating `THREE.Points` clouds with a CPU-physics particle system where each particle has a velocity vector updated each frame based on mouse proximity.

**Design:**
- **2000 particles** (desktop), **800** (mobile — detected by `window.innerWidth < 768`)
- Each particle: position (3 floats) + velocity (3 floats) stored in two `Float32Array`s
- **Outer zone** (squared radius 9.0 = 3 units): mild attraction toward cursor — `vel += (mouseWorld - pos).normalize() * 0.0008`
- **Inner zone** (squared radius 1.0 = 1 unit): strong repulsion away from cursor — `vel += (pos - mouseWorld).normalize() * 0.006`
- **Velocity cap**: 0.035 per axis to prevent tunnelling
- **Damping**: multiply vel by 0.96 each frame (brings particles back to gentle drift)
- **Upward drift**: permanent `vel.y += 0.00008` per frame (workshop extractor effect)
- **Boundary**: if particle drifts beyond radius 11 from origin, teleport to a random position on the opposite side (soft recycling)
- **Click shockwave**: on canvas click, add a large radial repulsion impulse to all particles within radius 5

Two particle types:
1. **Amber metallic dust** (~70% of count): color `0xd4820a`, size `0.018`, opacity `0.72`
2. **Blue-white sparks** (~30% of count): color `0x99ddff`, size `0.012`, opacity `0.55`

Both use `AdditiveBlending`. Both share the same soft-glow `particleTex`.

**Step 1: Delete old particle block**

Remove lines ~437–492 (from `/* ─── Particle Systems` through `scene.add(sparkParticles);`).

**Step 2: Add new particle system**

In the same location, insert:

```js
/* ─── Magnetic Particle System ────────────────────────── */
const isMobileParticle = window.innerWidth < 768;
const PARTICLE_COUNT = isMobileParticle ? 800 : 2000;
const AMBER_COUNT_P  = Math.floor(PARTICLE_COUNT * 0.70);
const SPARK_COUNT_P  = PARTICLE_COUNT - AMBER_COUNT_P;

// Flat typed arrays: positions and velocities for all particles
const pPos = new Float32Array(PARTICLE_COUNT * 3); // xyz
const pVel = new Float32Array(PARTICLE_COUNT * 3); // vx vy vz

// Separate geometry buffers for the two visual types
const amberPosArr = new Float32Array(AMBER_COUNT_P * 3);
const sparkPosArr = new Float32Array(SPARK_COUNT_P  * 3);

// Initialise positions randomly in a sphere of radius 10
for (let i = 0; i < PARTICLE_COUNT; i++) {
  const theta = rand(0, Math.PI * 2);
  const phi   = Math.acos(rand(-1, 1));
  const r     = rand(1.5, 10);
  pPos[i * 3]     = r * Math.sin(phi) * Math.cos(theta);
  pPos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
  pPos[i * 3 + 2] = r * Math.cos(phi);
  // Initial velocity: zero
  pVel[i * 3] = pVel[i * 3 + 1] = pVel[i * 3 + 2] = 0;
}

// Three.js geometry objects
const amberParticleGeo = new THREE.BufferGeometry();
const sparkGeo         = new THREE.BufferGeometry();
amberParticleGeo.setAttribute('position', new THREE.BufferAttribute(amberPosArr, 3));
sparkGeo.setAttribute('position',         new THREE.BufferAttribute(sparkPosArr, 3));

const amberParticleMat = new THREE.PointsMaterial({
  map: particleTex, color: 0xd4820a, size: 0.018, sizeAttenuation: true,
  transparent: true, opacity: 0.72,
  blending: THREE.AdditiveBlending, depthWrite: false,
});
const sparkMat = new THREE.PointsMaterial({
  map: particleTex, color: 0x99ddff, size: 0.012, sizeAttenuation: true,
  transparent: true, opacity: 0.55,
  blending: THREE.AdditiveBlending, depthWrite: false,
});

const amberParticles = new THREE.Points(amberParticleGeo, amberParticleMat);
const sparkParticles = new THREE.Points(sparkGeo,         sparkMat);
scene.add(amberParticles);
scene.add(sparkParticles);

// Shockwave state — triggered on canvas click
let shockwaveActive    = false;
let shockwaveX         = 0;
let shockwaveY         = 0;
```

**Step 3: Add shockwave trigger to canvas click handler**

Find the `canvas.addEventListener('click', ...)` block. Inside the `else` branch (when no tool is hovered), after `emitSparks(...)`, add:
```js
// Trigger magnetic shockwave
shockwaveActive = true;
shockwaveX = ((e.clientX / window.innerWidth) * 2 - 1) * 5.5;
shockwaveY = -(((e.clientY / window.innerHeight) * 2 - 1)) * 3.0;
```

**Step 4: Replace old particle rotation in animate loop with physics update**

Find the old particle rotation lines:
```js
amberParticles.rotation.y += 0.00012 * delta;
amberParticles.rotation.x += 0.000045 * delta;
sparkParticles.rotation.y -= 0.00018 * delta;
sparkParticles.rotation.z += 0.000055 * delta;
```
Replace with the full physics update:

```js
/* ── Magnetic particle physics ── */
// Mouse world position (Z=0 plane for interaction)
const mwx = mouseX * 5.5;
const mwy = -mouseY * 3.0;

// One-frame shockwave impulse application
if (shockwaveActive) {
  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const px = pPos[i*3], py = pPos[i*3+1];
    const dx = px - shockwaveX, dy = py - shockwaveY;
    const d2 = dx*dx + dy*dy;
    if (d2 < 25 && d2 > 0.001) {
      const d = Math.sqrt(d2);
      const impulse = 0.06 * (1 - d / 5);
      pVel[i*3]   += (dx/d) * impulse;
      pVel[i*3+1] += (dy/d) * impulse;
    }
  }
  shockwaveActive = false;
}

// Physics integration
for (let i = 0; i < PARTICLE_COUNT; i++) {
  const i3 = i * 3;
  const px = pPos[i3], py = pPos[i3+1], pz = pPos[i3+2];

  // Mouse interaction — XY plane only (cursor lives in XY)
  const dx = mwx - px, dy = mwy - py;
  const d2 = dx*dx + dy*dy;

  if (d2 < 9.0 && d2 > 0.001) {      // outer zone: attraction
    const d = Math.sqrt(d2);
    const force = 0.0008 * (1 - d / 3);
    pVel[i3]   += (dx/d) * force;
    pVel[i3+1] += (dy/d) * force;
  }
  if (d2 < 1.0 && d2 > 0.001) {      // inner zone: repulsion override
    const d = Math.sqrt(d2);
    const force = 0.006 * (1 - d);
    pVel[i3]   -= (dx/d) * force;
    pVel[i3+1] -= (dy/d) * force;
  }

  // Upward workshop drift
  pVel[i3+1] += 0.00008;

  // Damping
  pVel[i3]   *= 0.962;
  pVel[i3+1] *= 0.962;
  pVel[i3+2] *= 0.962;

  // Velocity cap
  const cap = 0.035;
  if (pVel[i3]   >  cap) pVel[i3]   =  cap;
  if (pVel[i3]   < -cap) pVel[i3]   = -cap;
  if (pVel[i3+1] >  cap) pVel[i3+1] =  cap;
  if (pVel[i3+1] < -cap) pVel[i3+1] = -cap;

  // Integrate
  pPos[i3]   += pVel[i3];
  pPos[i3+1] += pVel[i3+1];
  pPos[i3+2] += pVel[i3+2];

  // Boundary recycle — soft sphere of radius 11
  const r2 = px*px + py*py + pz*pz;
  if (r2 > 121) {
    // Teleport to random position on inner surface of sphere
    const theta = rand(0, Math.PI * 2);
    const phi   = Math.acos(rand(-1, 1));
    const nr    = rand(1.5, 7);
    pPos[i3]   = nr * Math.sin(phi) * Math.cos(theta);
    pPos[i3+1] = nr * Math.sin(phi) * Math.sin(theta);
    pPos[i3+2] = nr * Math.cos(phi);
    pVel[i3] = pVel[i3+1] = pVel[i3+2] = 0;
  }

  // Copy updated position to the correct geometry buffer
  if (i < AMBER_COUNT_P) {
    const ai = i * 3;
    amberPosArr[ai]   = pPos[i3];
    amberPosArr[ai+1] = pPos[i3+1];
    amberPosArr[ai+2] = pPos[i3+2];
  } else {
    const si = (i - AMBER_COUNT_P) * 3;
    sparkPosArr[si]   = pPos[i3];
    sparkPosArr[si+1] = pPos[i3+1];
    sparkPosArr[si+2] = pPos[i3+2];
  }
}

// Tell Three.js buffers are dirty
amberParticleGeo.attributes.position.needsUpdate = true;
sparkGeo.attributes.position.needsUpdate = true;
```

**Step 5: Add particle opacity fade on scroll (alongside other tool fades)**

Find `floorGlow.material.opacity = ...` and add:
```js
amberParticleMat.opacity = toolAlpha * 0.72;
sparkMat.opacity         = toolAlpha * 0.55;
```

**Step 6: Verify**

Move mouse slowly across scene — particles should visibly drift toward cursor from a distance, then scatter when cursor gets very close. Click on empty space — particles should blast outward from click point and drift back. On a 768px or narrower viewport, particle count should be 800 (check `PARTICLE_COUNT` in console).

**Step 7: Performance check**

Open browser DevTools → Performance tab. Record 3 seconds. Frame time should be under 16ms on desktop. If over, reduce `PARTICLE_COUNT` constant from 2000 → 1400.

**Step 8: Commit**

```bash
git add three-scene.js
git commit -m "feat: replace passive particles with CPU-physics magnetic dust field"
```

---

## Task 8: Cinematic lighting overhaul — single amber key + cool fill + floor spot

**Files:**
- Modify: `three-scene.js` — lights block (~lines 239–301)

Replace the current 7-light setup with a tighter 5-light cinematic rig focused on the triangular tool composition. Fewer lights = clearer shadows = more dramatic product-photography look.

**Step 1: Replace entire lights block**

Delete lines 239–301 and replace with:

```js
/* ─── Lights ──────────────────────────────────────────── */
// Minimal ambient — scene is dark, lights sculpt the form
const ambientLight = new THREE.AmbientLight(0x06080e, 0.35);
scene.add(ambientLight);

// ── KEY LIGHT: large warm amber RectAreaLight — upper left, main sculpting light
const keyLight = new THREE.RectAreaLight(0xf0920c, 16, 5.0, 4.0);
keyLight.position.set(-4.0, 5.5, 5.5);
keyLight.lookAt(0, 0.5, 0);
scene.add(keyLight);

// ── FILL LIGHT: cool blue RectAreaLight — right side, lower intensity
const fillLight = new THREE.RectAreaLight(0x2255bb, 7, 3.5, 5.0);
fillLight.position.set(5.0, 0.5, 3.0);
fillLight.lookAt(0, 0.5, 0);
scene.add(fillLight);

// ── RIM / BACK LIGHT: neutral cool, overhead-rear — edge separation
const rimAreaLight = new THREE.RectAreaLight(0x7799cc, 5, 6.0, 1.8);
rimAreaLight.position.set(0, 7.0, -4.5);
rimAreaLight.lookAt(0, 0, 1);
scene.add(rimAreaLight);

// ── FLOOR BOUNCE: warm amber point from below — fills in under-shadows
const groundGlow = new THREE.PointLight(0xb06010, 2.8, 12);
groundGlow.position.set(0, -2.2, 2.5);
scene.add(groundGlow);

// ── ORBITING DYNAMIC LIGHT: warm amber point, animates — keeps metals alive
const orbitLight = new THREE.PointLight(0xd4820a, 4.5, 20);
orbitLight.castShadow = true;
orbitLight.shadow.mapSize.width  = 1024;
orbitLight.shadow.mapSize.height = 1024;
orbitLight.shadow.camera.near = 0.5;
orbitLight.shadow.camera.far  = 22;
orbitLight.shadow.bias = -0.0005;
scene.add(orbitLight);

// ── SAW SPOT: tight amber spotlight on saw blade apex
const sawSpot = new THREE.SpotLight(0xffa040, 6, 14, Math.PI / 9, 0.35, 1.8);
sawSpot.position.set(0.2, 5.0, 4.5);
sawSpot.target.position.set(0, 1.9, -0.2);
sawSpot.castShadow = true;
sawSpot.shadow.mapSize.width  = 1024;
sawSpot.shadow.mapSize.height = 1024;
sawSpot.shadow.camera.near = 1;
sawSpot.shadow.camera.far  = 16;
sawSpot.shadow.bias = -0.0003;
scene.add(sawSpot);
scene.add(sawSpot.target);
```

**Step 2: Remove blueprintLight from animate loop**

Find and delete:
```js
blueprintLight.position.x = -4 + Math.sin(time * 0.00025) * 1.5;
blueprintLight.position.y =  3 + Math.cos(time * 0.00018) * 1.0;
```

**Step 3: Update sawSpot intensity fade in animate loop**

Find `sawSpot.intensity = toolAlpha * 3.5;` and change to:
```js
sawSpot.intensity  = toolAlpha * 6;
sawSpot.position.x = 0.2 + camRotY * -2.0;
```

**Step 4: Verify**

Tools should have dramatically more contrast — bright warm highlights on left face, cool blue fill on right, sharp cast shadows on floor plane. The saw blade should have a concentrated hot spot from the spot light.

**Step 5: Commit**

```bash
git add three-scene.js
git commit -m "feat: cinematic 5-light rig — amber key, cool fill, rim, floor bounce, saw spot"
```

---

## Task 9: Update env cube colors to match new lighting palette

**Files:**
- Modify: `three-scene.js` — env cube block (~lines 51–68)

The fake IBL env cube should reflect the new lighting palette so metallic reflections show amber and blue, not the old brownish tones.

**Step 1: Update envColors array**

Find:
```js
const envColors = [0x8f5510, 0x2255aa, 0x334455, 0x0a0a14, 0x1a1408, 0x060810];
```
Replace with:
```js
// +X warm amber, -X cool blue, +Y neutral top, -Y dark floor, +Z front, -Z back dark
const envColors = [0xb06010, 0x1a3d88, 0x1a2030, 0x050508, 0x120e08, 0x040508];
```

**Step 2: Commit**

```bash
git add three-scene.js
git commit -m "feat: update fake IBL env cube to amber/blue cinematic palette"
```

---

## Task 10: Update tool materials for differentiated palette

**Files:**
- Modify: `three-scene.js` — materials block (~lines 321–379)

Currently everything is one warm tone. The new palette differentiates: hammer head = dark gunmetal, wrench jaw = bright polished chrome, saw blade = medium steel with carbide accent.

**Step 1: Update steelMat**

```js
// Gunmetal — hammer head, deep dark metal
const steelMat = new THREE.MeshStandardMaterial({
  color: 0x5a5a62,
  roughness: 0.08,
  metalness: 0.97,
  envMapIntensity: 1.2,
});
```

**Step 2: Update chromeMat**

```js
// Polished chrome — wrench jaw and saw blade body
const chromeMat = new THREE.MeshStandardMaterial({
  color: 0xf2f0ea,
  roughness: 0.02,
  metalness: 0.99,
  envMapIntensity: 1.4,
});
```

**Step 3: Update darkMat**

```js
// Dark rubber grip — hammer handle and wrench grip zones
const darkMat = new THREE.MeshStandardMaterial({
  color: 0x181410,
  roughness: 0.75,
  metalness: 0.12,
});
```

**Step 4: Verify**

Hammer head should appear dark silver/gunmetal. Wrench jaw should be bright near-mirror chrome. Saw blade body bright chrome. Handles stay near-black rubber. With the new lighting rig these will look completely different to the old uniform amber.

**Step 5: Commit**

```bash
git add three-scene.js
git commit -m "feat: differentiated tool material palette — gunmetal hammer, chrome wrench/saw"
```

---

## Task 11: Debris cleanup — reduce count, push further back

**Files:**
- Modify: `three-scene.js` — debris group (~lines 383–435)

The background debris competes with the tools at the moment. Reduce density and push all debris strictly behind z = -6.

**Step 1: Reduce girder count and push back**

Find `for (let i = 0; i < 12; i++)` (girder bars) and change the z range:
```js
mesh.position.set(rand(-9, 9), rand(-5, 5), rand(-18, -6));
```
And reduce count from `12` to `8`.

**Step 2: Reduce bolt/washer/pipe counts and push back**

For hex bolts (`i < 8`): change to `i < 5`, z range `rand(-16, -6)`.
For washers (`i < 4`): keep count, z range `rand(-16, -6)`.
For pipes (`i < 4`): keep count, z range `rand(-16, -6)`.

**Step 3: Commit**

```bash
git add three-scene.js
git commit -m "refactor: push debris further back, reduce density to stop competing with tools"
```

---

## Task 12: Final polish — hub bloom + scan line + touch interaction

**Files:**
- Modify: `three-scene.js` — misc small fixes

**Step 1: Hub bloom pulse tied to saw speed**

Find `hubGlowMat.opacity = 0.40 + Math.sin(time * 0.004) * 0.12;` and change to:
```js
// Hub glows brighter as saw spins faster
const sawSpeed = sawGroup.userData.currentSpeed || 0.003;
const speedNorm = Math.min((sawSpeed - 0.003) / 0.022, 1); // 0=slow, 1=fast
hubGlowMat.opacity = 0.35 + speedNorm * 0.45 + Math.sin(time * 0.004) * 0.08;
```

**Step 2: Saw spot intensity also driven by spin speed**

Find `sawSpot.intensity = toolAlpha * 6;` and change to:
```js
const sawSpeed2 = sawGroup.userData.currentSpeed || 0.003;
const sn2 = Math.min((sawSpeed2 - 0.003) / 0.022, 1);
sawSpot.intensity = toolAlpha * (4.5 + sn2 * 4.0);
```

**Step 3: Touch: add touchmove listener for particle physics**

The `mouseX`/`mouseY` values used by the particle physics are only updated by `mousemove`. Add a `touchmove` listener so mobile users also drive the magnetic field:

```js
canvas.addEventListener('touchmove', (e) => {
  e.preventDefault();
  const touch = e.touches[0];
  mouseX = (touch.clientX / window.innerWidth)  * 2 - 1;
  mouseY = (touch.clientY / window.innerHeight) * 2 - 1;
  rawMouseX = touch.clientX;
  rawMouseY = touch.clientY;
  targetRotY =  mouseX * 0.08;
  targetRotX = -mouseY * 0.08;
  mouseVec.set(mouseX, mouseY);
  raycaster.setFromCamera(mouseVec, camera);
  // Re-run hover detection
  const targets = [];
  [hammerGroup, wrenchGroup, sawGroup].forEach(grp => {
    grp.traverse(o => { if (o.userData.toolId) targets.push(o); });
  });
  const hits = raycaster.intersectObjects(targets);
  if (hits.length > 0) {
    hoveredTool = hits[0].object.userData.toolId;
    showTooltip(hoveredTool, rawMouseX, rawMouseY);
  } else {
    hoveredTool = null;
    hideTooltip();
  }
}, { passive: false });
```

**Step 4: Keyboard shortcuts — update T/Q to close (or open new tools)**

In the keydown listener, replace the full block with:
```js
window.addEventListener('keydown', (e) => {
  const key = e.key.toUpperCase();
  if (key === 'H') { openPanel('hammer'); hoverEmissive.hammer = 0.38; }
  if (key === 'W') { openPanel('wrench'); hoverEmissive.wrench = 0.38; }
  if (key === 'S') { openPanel('saw');    hoverEmissive.saw    = 0.38; }
  if (e.key === 'Escape') { closePanel(); }
});
```

**Step 5: Final end-to-end verification checklist**

Open `index.html` in a modern browser. Verify:
- [ ] Only 3 tools visible: hammer (right), wrench (left), saw blade (center-apex)
- [ ] Hammer handle is visibly smooth/curved, not faceted
- [ ] Wrench jaw has clear C-profile with two arm heights
- [ ] Saw blade spins — faster as mouse moves right, slower as mouse moves left
- [ ] Particles drift toward cursor from a distance, scatter when cursor is very close
- [ ] Click on empty scene space: particles blast outward radially then drift back
- [ ] Dark reflective floor plane visible at bottom of scene
- [ ] Tool materials differentiated: hammer=gunmetal, wrench=bright chrome, saw=chrome
- [ ] Assembly animation still plays on load
- [ ] Hero copy text fades in after assembly completes
- [ ] Drag to rotate still works on hammer and wrench
- [ ] Double-click disassembly explosion still works
- [ ] Hover tooltip appears on each tool
- [ ] Click opens info panel
- [ ] Scroll fades scene out
- [ ] No JS errors in console
- [ ] On mobile: only 800 particles, touch drag works, touchmove drives magnetic field

**Step 6: Commit**

```bash
git add three-scene.js
git commit -m "feat: hub bloom driven by saw speed, touch magnetic particles, polish pass"
```

---

## Notes for Implementer

- **Tasks 1–2** are pure deletions and take ~5 minutes each. Do them first — they clean the slate.
- **Tasks 4–5** (geometry rebuild) are the longest. Work on one tool at a time and check visually before moving on.
- **Task 7** (magnetic particles) is the most performance-sensitive. Always test frame rate after adding it.
- **`rand()`** helper is defined at line ~304 as `function rand(min, max) { return min + Math.random() * (max - min); }` — it's available everywhere inside the IIFE.
- **`registerPart()`** is defined at line ~588 — every new mesh that should participate in the assembly animation must go through it.
- **`steelMat`, `chromeMat`, `darkMat`** are defined before the tool blocks so clones (`.clone()`) work in later tasks. Task 10 updates the base materials — any `.clone()` calls after that point inherit the new values automatically.
- **r134 constraint**: `RectAreaLight` requires `THREE.RectAreaLightUniformsLib.init()` (already present at line 35). No new imports needed.
- **No external assets**: every texture is generated from a `<canvas>` element at runtime. Keep it that way.
