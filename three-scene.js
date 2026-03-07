/**
 * three-scene.js — Blueprint Engineering Hero (Round 2)
 *
 * Self-initializing. Creates a fixed WebGL canvas behind all page content.
 * Requires Three.js r134 loaded before this script.
 */

(function () {
  'use strict';

  if (typeof THREE === 'undefined') {
    console.warn('[three-scene] THREE not found — skipping 3D background.');
    return;
  }

  /* ─── Reduced motion check ────────────────────────────── */
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ─── Renderer + Canvas ───────────────────────────────── */
  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: false,
    powerPreference: 'high-performance',
  });

  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputEncoding      = THREE.sRGBEncoding;
  renderer.toneMapping         = THREE.CineonToneMapping;
  renderer.toneMappingExposure = 0.90;

  // Required for RectAreaLight to render correctly
  if (THREE.RectAreaLightUniformsLib) {
    THREE.RectAreaLightUniformsLib.init();
  }

  const canvas = renderer.domElement;
  canvas.id = 'three-canvas';
  canvas.setAttribute('aria-hidden', 'true');
  canvas.style.cursor = 'default';
  document.body.insertBefore(canvas, document.body.firstChild);

  /* ─── Scene ───────────────────────────────────────────── */
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x07090f); // deep blue-black, not pure brown-black
  scene.fog = new THREE.FogExp2(0x04060c, 0.024); // blue-tinted atmospheric fog, denser for intimacy

  // Fake IBL via CubeCamera — gives metallic materials something to reflect
  const envScene = new THREE.Scene();
  envScene.background = new THREE.Color(0x07090f);
  // +X warm amber, -X cool blue, +Y neutral top, -Y dark floor, +Z front, -Z back dark
  const envColors = [0xb06010, 0x1a3d88, 0x1a2030, 0x050508, 0x120e08, 0x040508];
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
  const cubeRT = new THREE.WebGLCubeRenderTarget(512);
  const cubeCamera = new THREE.CubeCamera(0.1, 100, cubeRT);
  envScene.add(cubeCamera);
  cubeCamera.update(renderer, envScene);
  scene.environment = cubeRT.texture;

  // Cinematic overlays — injected above canvas, below page content
  const vignetteStyle = document.createElement('style');
  vignetteStyle.textContent = `
    #scene-vignette {
      position:fixed; inset:0; pointer-events:none; z-index:1;
      background:
        radial-gradient(ellipse 90% 70% at 50% 45%, transparent 40%, rgba(3,4,8,0.45) 72%, rgba(0,0,0,0.92) 100%),
        linear-gradient(to top, rgba(0,0,0,0.90) 0%, transparent 38%),
        linear-gradient(to bottom, rgba(1,2,5,0.55) 0%, transparent 22%);
    }
    #hero-copy {
      position:fixed; top:50%; left:50%;
      transform:translate(-50%, 20%);
      text-align:center; z-index:10; pointer-events:none;
      width:min(680px, 90vw);
      opacity:0; visibility:hidden;
      transition: opacity 0.85s ease, transform 0.85s ease;
      background: radial-gradient(ellipse 640px 300px at 50% 50%, rgba(1,2,4,0.48), transparent);
    }
    #hero-copy.visible {
      opacity:1; visibility:visible;
      transform:translate(-50%, 20%);
    }
    /* Scroll-out override — wins over .visible due to higher specificity */
    #hero-copy.visible.scrolled-out {
      opacity:0; visibility:hidden;
      transition: opacity 0.35s ease;
    }
    #hero-copy .hero-headline {
      font-family: 'Fraunces', Georgia, serif;
      font-size: clamp(28px, 4.0vw, 54px);
      font-weight: 800;
      letter-spacing: 0.04em;
      line-height: 1.1;
      color: #e8a840;
      text-shadow: 0 0 40px rgba(210,140,20,0.55), 0 2px 8px rgba(0,0,0,0.7);
      margin: 0 0 4px;
    }
    #hero-copy .hero-tagline {
      font-family: 'DM Sans', system-ui, sans-serif;
      font-size: clamp(12px, 1.5vw, 17px);
      font-weight: 400;
      color: #c8aa78;
      opacity: 0.7;
      letter-spacing: 0.07em;
      margin: 0 0 12px;
    }
    #hero-copy .hero-divider {
      width: 100%; height: 1px;
      background: linear-gradient(90deg, transparent, rgba(68,136,204,0.5) 30%, rgba(200,130,20,0.4) 70%, transparent);
      margin: 10px 0;
    }
    #hero-copy .hero-sub {
      font-family: "Courier New", monospace;
      font-size: clamp(10px, 1.1vw, 13px);
      color: #7a9bb8;
      letter-spacing: 0.18em;
      text-transform: uppercase;
      margin: 0 0 18px;
    }
    #hero-copy .hero-ctas {
      display: flex; gap: 14px; justify-content: center; pointer-events: auto;
    }
    #hero-copy .hero-btn-primary {
      font-family: system-ui, sans-serif;
      font-size: clamp(11px, 1.2vw, 14px);
      font-weight: 600; letter-spacing: 0.08em;
      padding: 11px 24px; cursor: pointer;
      background: linear-gradient(135deg, #c97512, #e8a840);
      color: #0d0a06; border: none; border-radius: 4px;
      box-shadow: 0 0 22px rgba(200,130,20,0.45), 0 2px 6px rgba(0,0,0,0.5);
      transition: box-shadow 0.2s ease, transform 0.15s ease;
    }
    #hero-copy .hero-btn-primary:hover {
      box-shadow: 0 0 36px rgba(200,140,20,0.7), 0 2px 8px rgba(0,0,0,0.5);
      transform: translateY(-1px);
    }
    #hero-copy .hero-btn-secondary {
      font-family: system-ui, sans-serif;
      font-size: clamp(11px, 1.2vw, 14px);
      font-weight: 500; letter-spacing: 0.08em;
      padding: 11px 24px; cursor: pointer;
      background: rgba(68,136,204,0.10);
      color: #7aaddd; border: 1px solid rgba(68,136,204,0.45);
      border-radius: 4px;
      transition: background 0.2s ease, border-color 0.2s ease;
    }
    #hero-copy .hero-btn-secondary:hover {
      background: rgba(68,136,204,0.22);
      border-color: rgba(68,136,204,0.75);
    }
    #tool-info-panel {
      border-left: 4px solid rgba(68,136,204,0.75) !important;
      box-shadow: -4px 0 32px rgba(68,136,204,0.22), inset 3px 0 14px rgba(68,136,204,0.08) !important;
      clip-path: polygon(0 0, calc(100% - 14px) 0, 100% 14px, 100% 100%, 0 100%);
    }
    @keyframes panelBorderFill {
      from { background-size: 0% 2px; }
      to   { background-size: 100% 2px; }
    }
    #tool-info-panel::before {
      content:''; position:absolute; top:0; left:4px; right:0; height:2px;
      background: linear-gradient(90deg, rgba(68,136,204,0.8), rgba(200,130,20,0.6));
      background-size: 0% 2px; background-repeat: no-repeat;
      animation: panelBorderFill 0.35s ease 0.1s forwards;
    }
    @media print { #scene-vignette, #hero-copy { display:none !important; } }
    @media (max-width: 767px) {
      #hero-copy {
        top: auto !important;
        bottom: 14% !important;
        transform: translate(-50%, 0) !important;
        width: min(92vw, 480px) !important;
      }
      #hero-copy.visible { transform: translate(-50%, 0) !important; }
      #hero-copy.visible.scrolled-out { opacity:0 !important; visibility:hidden !important; }
      #tool-info-panel { display: none !important; }
      #tool-tooltip { display: none !important; }
    }
  `;
  document.head.appendChild(vignetteStyle);

  const vignette = document.createElement('div');
  vignette.id = 'scene-vignette';
  document.body.insertBefore(vignette, document.body.firstChild);

  /* ─── Camera ──────────────────────────────────────────── */
  const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 50);
  camera.position.set(0, 0, 6);

  // Hero copy — headline, tagline, CTAs (fades in after assembly completes)
  const heroCopy = document.createElement('div');
  heroCopy.id = 'hero-copy';

  const headline1 = document.createElement('div');
  headline1.className = 'hero-headline';
  headline1.textContent = 'EXPERT CRAFTSMANSHIP';
  heroCopy.appendChild(headline1);

  const headline2 = document.createElement('div');
  headline2.className = 'hero-tagline';
  headline2.textContent = 'Every Project · On Time · Done Right';
  heroCopy.appendChild(headline2);

  const divider = document.createElement('div');
  divider.className = 'hero-divider';
  heroCopy.appendChild(divider);

  const subTag = document.createElement('div');
  subTag.className = 'hero-sub';
  subTag.textContent = 'General Construction & Handyman Services';
  heroCopy.appendChild(subTag);

  const ctaRow = document.createElement('div');
  ctaRow.className = 'hero-ctas';

  const ctaPrimary = document.createElement('button');
  ctaPrimary.className = 'hero-btn-primary';
  ctaPrimary.textContent = 'BOOK A FREE ESTIMATE \u2192';
  ctaRow.appendChild(ctaPrimary);

  const ctaSecondary = document.createElement('button');
  ctaSecondary.className = 'hero-btn-secondary';
  ctaSecondary.textContent = 'VIEW SERVICES';
  ctaRow.appendChild(ctaSecondary);

  heroCopy.appendChild(ctaRow);
  document.body.appendChild(heroCopy);

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

  /* ─── Helpers ─────────────────────────────────────────── */
  function rand(min, max) {
    return min + Math.random() * (max - min);
  }

  function makeMaterial(colorHex) {
    const variant = Math.random();
    const roughness = variant < 0.33 ? rand(0.55, 0.70)
                    : variant < 0.66 ? rand(0.12, 0.28)
                    :                  rand(0.72, 0.88);
    const metalness = variant < 0.33 ? rand(0.75, 0.92)
                    : variant < 0.66 ? rand(0.88, 0.98)
                    :                  rand(0.25, 0.45);
    const baseColor = new THREE.Color(colorHex);
    baseColor.multiplyScalar(rand(0.75, 1.15));
    return new THREE.MeshStandardMaterial({ color: baseColor, roughness, metalness });
  }

  // Gunmetal — hammer head, deep dark metal
  const steelMat = new THREE.MeshStandardMaterial({
    color: 0x5a5a62,
    roughness: 0.08,
    metalness: 0.97,
    envMapIntensity: 1.2,
  });

  // Dark rubber grip — hammer handle and wrench grip zones
  const darkMat = new THREE.MeshStandardMaterial({
    color: 0x181410,
    roughness: 0.75,
    metalness: 0.12,
  });

  // Polished chrome — wrench jaw and saw blade body
  const chromeMat = new THREE.MeshStandardMaterial({
    color: 0xf2f0ea,
    roughness: 0.02,
    metalness: 0.99,
    envMapIntensity: 1.4,
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
  gunmetalMat.envMapIntensity = 0.8;

  // Yellow tape — tape measure band
  const tapeBandMat = new THREE.MeshStandardMaterial({
    color: 0xd4a012,
    roughness: 0.55,
    metalness: 0.45,
    transparent: true,
    opacity: 1.0,
  });
  tapeBandMat.envMapIntensity = 0.4;

  const panelColors = [0x2e2a22, 0x38332a, 0x403b30, 0x4a4438, 0x352f26, 0x3d3830];

  /* ─── Debris group ────────────────────────────────────── */
  const fragmentGroup = new THREE.Group();
  scene.add(fragmentGroup);
  const fragmentData = [];

  // Girder bars — strictly behind tools, slower rotation = atmospheric not distracting
  for (let i = 0; i < 8; i++) {
    const geo = new THREE.BoxGeometry(0.08, rand(1.8, 3.2), 0.08);
    const mat = makeMaterial(panelColors[Math.floor(Math.random() * panelColors.length)]);
    const mesh = new THREE.Mesh(geo, mat);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.position.set(rand(-9, 9), rand(-5, 5), rand(-18, -6));
    mesh.rotation.set(rand(-0.4, 0.4), rand(-Math.PI, Math.PI), rand(-0.3, 0.3));
    fragmentGroup.add(mesh);
    fragmentData.push({ mesh, rotX: rand(0.000025, 0.0001), rotY: rand(0.000025, 0.0001), rotZ: rand(0.000015, 0.00005) });
  }

  // Hex bolt heads — behind tools
  for (let i = 0; i < 5; i++) {
    const geo = new THREE.CylinderGeometry(0.12, 0.12, 0.08, 6);
    const mat = makeMaterial(panelColors[Math.floor(Math.random() * panelColors.length)]);
    const mesh = new THREE.Mesh(geo, mat);
    mesh.castShadow = true;
    mesh.position.set(rand(-8, 8), rand(-4, 4), rand(-16, -6));
    mesh.rotation.set(rand(-Math.PI, Math.PI), rand(-Math.PI, Math.PI), 0);
    fragmentGroup.add(mesh);
    fragmentData.push({ mesh, rotX: rand(0.000025, 0.0001), rotY: rand(0.00003, 0.000125), rotZ: rand(0.000015, 0.00005) });
  }

  // Washer rings — behind tools
  for (let i = 0; i < 4; i++) {
    const geo = new THREE.TorusGeometry(0.18, 0.045, 8, 14);
    const mat = makeMaterial(panelColors[Math.floor(Math.random() * panelColors.length)]);
    const mesh = new THREE.Mesh(geo, mat);
    mesh.castShadow = true;
    mesh.position.set(rand(-8, 8), rand(-4, 4), rand(-16, -6));
    mesh.rotation.set(rand(-Math.PI, Math.PI), rand(-Math.PI, Math.PI), rand(-Math.PI, Math.PI));
    fragmentGroup.add(mesh);
    fragmentData.push({ mesh, rotX: rand(0.00003, 0.00011), rotY: rand(0.00003, 0.00011), rotZ: rand(0.000015, 0.00006) });
  }

  // Pipe sections — behind tools
  for (let i = 0; i < 4; i++) {
    const geo = new THREE.CylinderGeometry(0.07, 0.07, rand(0.35, 0.65), 8);
    const mat = makeMaterial(panelColors[Math.floor(Math.random() * panelColors.length)]);
    const mesh = new THREE.Mesh(geo, mat);
    mesh.castShadow = true;
    mesh.position.set(rand(-8, 8), rand(-4, 4), rand(-16, -6));
    mesh.rotation.set(rand(-Math.PI, Math.PI), rand(-Math.PI, Math.PI), rand(-Math.PI, Math.PI));
    fragmentGroup.add(mesh);
    fragmentData.push({ mesh, rotX: rand(0.000025, 0.0001), rotY: rand(0.000025, 0.0001), rotZ: rand(0.000015, 0.00005) });
  }

  /* ─── Particle Systems ─────────────────────────────────── */
  // Create soft-glow particle texture (radial gradient)
  const particleCanvas = document.createElement('canvas');
  particleCanvas.width = particleCanvas.height = 32;
  const pCtx = particleCanvas.getContext('2d');
  const grad = pCtx.createRadialGradient(16, 16, 0, 16, 16, 16);
  grad.addColorStop(0,   'rgba(255,255,255,1.0)');
  grad.addColorStop(0.3, 'rgba(255,255,255,0.6)');
  grad.addColorStop(1.0, 'rgba(255,255,255,0.0)');
  pCtx.fillStyle = grad;
  pCtx.fillRect(0, 0, 32, 32);
  const particleTex = new THREE.CanvasTexture(particleCanvas);

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
    map: particleTex,
    color: 0xd4820a, size: 0.022, sizeAttenuation: true,
    transparent: true, opacity: 0.75,
    blending: THREE.AdditiveBlending, depthWrite: false,
  });
  const amberParticles = new THREE.Points(amberParticleGeo, amberParticleMat);
  scene.add(amberParticles);

  // Blue-white spark particles — secondary layer, smaller, brighter
  const SPARK_COUNT = 1100;
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
    map: particleTex,
    color: 0x99ddff, size: 0.018, sizeAttenuation: true,
    transparent: true, opacity: 0.68,
    blending: THREE.AdditiveBlending, depthWrite: false,
  });
  const sparkParticles = new THREE.Points(sparkGeo, sparkMat);
  scene.add(sparkParticles);

  /* ─── Blueprint Grids ─────────────────────────────────── */
  function makeGrid(cols, rows, cell, color, opacity) {
    const verts = [];
    for (let c = 0; c <= cols; c++) {
      const x = (c - cols / 2) * cell;
      verts.push(x, 0, 0,  x, rows * cell, 0);
    }
    for (let r = 0; r <= rows; r++) {
      const y = r * cell;
      verts.push(-(cols / 2) * cell, y, 0,  (cols / 2) * cell, y, 0);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(verts), 3));
    const mat = new THREE.LineBasicMaterial({ color, transparent: true, opacity });
    return new THREE.LineSegments(geo, mat);
  }

  const floorGrid = makeGrid(28, 20, 0.6, 0x1a44aa, 0.55); // more saturated blue, clearly visible
  floorGrid.rotation.x = -1.05;
  floorGrid.position.set(0, -3.2, 1.0);
  scene.add(floorGrid);

  const wallGrid = makeGrid(14, 9, 0.55, 0xe8900a, 0.22); // warm amber wall grid, visible
  wallGrid.position.set(0, -0.5, -3.8);
  scene.add(wallGrid);

  // Horizon depth grid — creates vanishing-point perspective illusion
  const horizonGrid = makeGrid(22, 12, 0.7, 0x2255cc, 0.14);
  horizonGrid.rotation.x = -1.35;
  horizonGrid.position.set(0, -2.8, -2.0);
  scene.add(horizonGrid);

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

  /* ─── Scan-line + glow layer ──────────────────────────── */
  const scanLineVerts = new Float32Array(6);
  const scanLineGeo = new THREE.BufferGeometry();
  scanLineGeo.setAttribute('position', new THREE.BufferAttribute(scanLineVerts, 3));

  const scanLineMat = new THREE.LineBasicMaterial({
    color: 0x55aaff, transparent: true, opacity: 1.0,
  });
  const scanLine = new THREE.Line(scanLineGeo, scanLineMat);
  scanLine.rotation.x = -1.05;
  scanLine.position.set(0, -3.2, 1.0);
  scene.add(scanLine);

  // Additive glow duplicate — same geometry, wider apparent spread via blending
  const scanGlowMat = new THREE.LineBasicMaterial({
    color: 0x88ccff,
    transparent: true,
    opacity: 0.45,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const scanGlow = new THREE.Line(scanLineGeo, scanGlowMat);
  scanGlow.rotation.x = -1.05;
  scanGlow.position.set(0, -3.2, 1.0);
  scene.add(scanGlow);

  const SCAN_GRID_W = 28 * 0.6;
  const SCAN_GRID_H = 20 * 0.6;


  /* ─── Assembly helpers ────────────────────────────────── */
  let partCounter = 0;

  function registerPart(mesh, spreadX, spreadY, spreadZ, partList) {
    mesh.userData.restPos   = mesh.position.clone();
    mesh.userData.spreadPos = new THREE.Vector3(
      mesh.position.x + spreadX,
      mesh.position.y + spreadY,
      mesh.position.z + spreadZ
    );
    mesh.userData.spreadRot   = new THREE.Euler(rand(-1.4, 1.4), rand(-1.4, 1.4), rand(-1.4, 1.4));
    mesh.userData.assemblyDelay = partCounter * 85; // 85 ms stagger
    partCounter++;
    partList.push(mesh);
    // Start in spread position
    mesh.position.copy(mesh.userData.spreadPos);
    mesh.rotation.copy(mesh.userData.spreadRot);
  }

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
    new THREE.Vector2(0.055, 0.00),
    new THREE.Vector2(0.072, 0.08),
    new THREE.Vector2(0.068, 0.18),
    new THREE.Vector2(0.058, 0.55),
    new THREE.Vector2(0.052, 0.90),
    new THREE.Vector2(0.058, 1.20),
    new THREE.Vector2(0.062, 1.55),
    new THREE.Vector2(0.072, 1.85),
    new THREE.Vector2(0.078, 2.00),
  ];
  const handleGeo = new THREE.LatheGeometry(handlePoints, 20);
  addHammerPart(handleGeo, darkMat.clone(), 0, -0.82, 0, -0.5, -1.2, 0.3);

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

  // ── Head: ExtrudeGeometry — rectangular head with chamfered corners
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
  addHammerPart(headGeo, steelMat.clone(), -hw, 0.78, -0.24, 1.4, 0.7, 0.3);

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
    clawMesh.position.set(-hw - 0.44, 0.68, side * 0.14 - 0.04);
    clawMesh.rotation.z = -0.30;
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

  hammerGroup.position.set(1.4, 0.3, 2.0);
  hammerGroup.rotation.z = 0.22;
  hammerGroup.rotation.y = -0.55;
  scene.add(hammerGroup);

  const hmBounds = new THREE.Mesh(
    new THREE.BoxGeometry(2.0, 3.2, 0.9),
    new THREE.MeshBasicMaterial({ visible: false })
  );
  hmBounds.userData.toolId = 'hammer';
  hammerGroup.add(hmBounds);

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
    new THREE.Vector2(0.062, 0.85),
    new THREE.Vector2(0.068, 1.25),
    new THREE.Vector2(0.078, 1.65),
    new THREE.Vector2(0.092, 2.00),
    new THREE.Vector2(0.105, 2.30),
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
  jawShape.moveTo(-0.50, 0);
  jawShape.lineTo( 0.50, 0);
  jawShape.lineTo( 0.50, 0.30);
  jawShape.lineTo( 0.25, 0.30);
  jawShape.lineTo( 0.25, 0.82);
  jawShape.lineTo( 0.10, 0.82);
  jawShape.lineTo( 0.10, 0.30);
  jawShape.lineTo(-0.10, 0.30);
  jawShape.lineTo(-0.10, 0.95);
  jawShape.lineTo(-0.25, 0.95);
  jawShape.lineTo(-0.25, 0.30);
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

  wrenchGroup.position.set(-1.6, 0.5, 2.0);
  wrenchGroup.rotation.z = 0.15;
  wrenchGroup.rotation.y = 0.60;
  scene.add(wrenchGroup);

  const wrBounds = new THREE.Mesh(
    new THREE.BoxGeometry(1.2, 3.4, 0.6),
    new THREE.MeshBasicMaterial({ visible: false })
  );
  wrBounds.userData.toolId = 'wrench';
  wrenchGroup.add(wrBounds);

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

  // 24 teeth around perimeter — two-box trapezoid profile (base + tip)
  const TOOTH_COUNT = 24;
  for (let t = 0; t < TOOTH_COUNT; t++) {
    const angle = (t / TOOTH_COUNT) * Math.PI * 2;
    const cosA = Math.cos(angle), sinA = Math.sin(angle);
    const toothMat = (t % 3 === 0)
      // Every 3rd tooth: carbide tip (slightly different color)
      ? new THREE.MeshStandardMaterial({ color: 0x9a8060, roughness: 0.12, metalness: 0.88 })
      : chromeMat.clone();

    // Base block — wider
    const base = new THREE.Mesh(
      new THREE.BoxGeometry(0.065, 0.07, 0.058),
      toothMat
    );
    base.castShadow = true;
    const r = 0.91;
    base.position.set(cosA * r, 0, sinA * r);
    base.rotation.y = -angle;
    sawGroup.add(base);

    // Tip block — narrower, offset outward
    const tip = new THREE.Mesh(
      new THREE.BoxGeometry(0.038, 0.055, 0.048),
      toothMat
    );
    tip.castShadow = true;
    tip.position.set(cosA * (r + 0.058), 0, sinA * (r + 0.058));
    tip.rotation.y = -angle;
    sawGroup.add(tip);
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

  // Hub bloom sprites (inner glow + corona)
  // Hub bloom sprites (inner glow + corona) — kept tight so they don't flood the blade
  const hubGlowMat = new THREE.SpriteMaterial({
    map: particleTex, color: 0xff7700,
    transparent: true, opacity: 0.40,
    blending: THREE.AdditiveBlending, depthWrite: false,
  });
  const hubGlowSprite = new THREE.Sprite(hubGlowMat);
  hubGlowSprite.scale.set(0.65, 0.65, 1.0);
  hubGlowSprite.position.set(0, 0, 0.04);
  sawGroup.add(hubGlowSprite);

  const hubCoronaMat = new THREE.SpriteMaterial({
    map: particleTex, color: 0xff5500,
    transparent: true, opacity: 0.14,
    blending: THREE.AdditiveBlending, depthWrite: false,
  });
  const hubCorona = new THREE.Sprite(hubCoronaMat);
  hubCorona.scale.set(1.1, 1.1, 1.0);
  sawGroup.add(hubCorona);

  // Position: upper center, face-on (blade disc is XZ plane by default from CylinderGeometry)
  // Rotate so blade faces camera (Y axis cylinder → rotate X 90deg so flat disc faces Z)
  sawGroup.rotation.x = Math.PI / 2;
  sawGroup.position.set(0, 1.7, 0.6);
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
  sawGroup.userData.spinSpeed = 0.007; // radians per frame, ~15s per rotation


  /* ─── All tool groups for traversal ──────────────────── */
  const allToolParts = [...hammerParts, ...wrenchParts, ...sawParts];

  /* ─── Tooltip overlay (opacity/visibility transition) ─── */
  const tooltip = document.createElement('div');
  tooltip.id = 'tool-tooltip';
  Object.assign(tooltip.style, {
    position: 'fixed',
    visibility: 'hidden',
    opacity: '0',
    pointerEvents: 'none',
    fontFamily: '"Courier New", Courier, monospace',
    fontSize: '11px',
    lineHeight: '1.6',
    letterSpacing: '0.05em',
    color: '#c97512',
    background: 'rgba(6,5,4,0.88)',
    border: '1px solid rgba(180,100,18,0.55)',
    padding: '9px 12px',
    maxWidth: '192px',
    zIndex: '9999',
    transition: 'opacity 0.18s ease',
  });
  document.body.appendChild(tooltip);

  let tooltipHideTimer = null;

  const toolInfo = {
    hammer: {
      title: 'FRAMING HAMMER', sub: 'Drop Forged Steel',
      desc: 'Framing · Demolition\nFastening · Finishing',
      hint: '[H] panel  ·  drag to spin  ·  dbl-click burst',
      specs: { Weight: '1.8 kg', Head: 'Drop Forged', Handle: 'Fibreglass', Length: '380 mm' },
      apps: ['Framing & Demolition', 'Fastening & Finishing'],
      cta: 'Get a Quote',
    },
    wrench: {
      title: 'ADJUSTABLE WRENCH', sub: 'Chrome Vanadium',
      desc: 'Plumbing · Fixtures\nMechanical · Assembly',
      hint: '[W] panel  ·  drag to spin  ·  dbl-click burst',
      specs: { Range: '0–32 mm', Drive: 'Chrome Vanadium', Finish: 'Mirror Polish', Length: '250 mm' },
      apps: ['Plumbing & Fixtures', 'Mechanical Assembly'],
      cta: 'Get a Quote',
    },
    saw: {
      title: 'CIRCULAR SAW BLADE', sub: '7-1/4" Carbide Tipped',
      desc: 'Framing · Decking\nDemolition · Finish Cuts',
      hint: '[S] panel  ·  drag to spin  ·  dbl-click burst',
      specs: { Diameter: '184 mm', Teeth: '24T', Bore: '15.88 mm', Coating: 'Anti-Stick' },
      apps: ['Framing & Decking', 'Demolition & Finish Cuts'],
      cta: 'Get a Quote',
    },
  };

  /* ─── Blueprint info panel ────────────────────────────── */
  const infoPanel = document.createElement('div');
  infoPanel.id = 'tool-info-panel';
  Object.assign(infoPanel.style, {
    position: 'fixed',
    top: '50%',
    right: '0',
    transform: 'translateY(-50%) translateX(100%)',
    width: '260px',
    background: 'rgba(4,8,14,0.94)',
    border: '1px solid rgba(68,136,204,0.45)',
    borderRight: 'none',
    borderRadius: '6px 0 0 6px',
    padding: '0',
    zIndex: '9998',
    fontFamily: '"Courier New", Courier, monospace',
    fontSize: '11px',
    lineHeight: '1.7',
    letterSpacing: '0.05em',
    color: '#c8aa78',
    background: 'rgba(4,8,16,0.96)',
    transition: 'transform 0.28s cubic-bezier(0.22,1,0.36,1)',
    pointerEvents: 'auto',
    overflow: 'hidden',
    position: 'relative',
  });
  document.body.appendChild(infoPanel);

  let activePanelTool = null;

  function openPanel(toolId) {
    const info = toolInfo[toolId];
    if (!info) return;
    activePanelTool = toolId;

    while (infoPanel.firstChild) infoPanel.removeChild(infoPanel.firstChild);

    // Header bar
    const header = document.createElement('div');
    Object.assign(header.style, {
      background: 'linear-gradient(135deg, rgba(200,120,20,0.18) 0%, rgba(68,136,204,0.08) 100%)',
      borderBottom: '1px solid rgba(68,136,204,0.3)',
      padding: '14px 14px 11px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
    });

    const titleWrap = document.createElement('div');
    const diamond = document.createElement('span');
    diamond.textContent = '\u25C8 ';
    diamond.style.color = '#4488cc';
    titleWrap.appendChild(diamond);
    const titleEl = document.createElement('strong');
    titleEl.textContent = info.title;
    titleEl.style.color = '#e8a840';
    titleWrap.appendChild(titleEl);
    const subEl = document.createElement('div');
    subEl.textContent = info.sub;
    subEl.style.cssText = 'opacity:0.5;font-size:10px;margin-top:2px;';
    titleWrap.appendChild(subEl);
    header.appendChild(titleWrap);

    const closeBtn = document.createElement('button');
    closeBtn.textContent = '\u00D7';
    Object.assign(closeBtn.style, {
      background: 'none', border: '1px solid rgba(68,136,204,0.4)',
      color: '#4488cc', cursor: 'pointer', fontSize: '14px',
      lineHeight: '1', padding: '2px 6px', borderRadius: '3px',
      fontFamily: 'inherit',
    });
    closeBtn.addEventListener('click', closePanel);
    header.appendChild(closeBtn);
    infoPanel.appendChild(header);

    // Body
    const body = document.createElement('div');
    body.style.padding = '12px 14px';

    // Specs section
    const specsLabel = document.createElement('div');
    specsLabel.textContent = 'SPECIFICATIONS';
    specsLabel.style.cssText = 'color:#4488cc;font-size:9px;letter-spacing:0.12em;margin-bottom:6px;';
    body.appendChild(specsLabel);

    const specsTable = document.createElement('div');
    specsTable.style.marginBottom = '12px';
    Object.entries(info.specs).forEach(([k, v], idx) => {
      const row = document.createElement('div');
      const rowBg = idx % 2 === 0 ? 'rgba(255,255,255,0.025)' : 'transparent';
      row.style.cssText = `display:flex;justify-content:space-between;padding:4px 6px;border-radius:2px;background:${rowBg};`;
      const keyEl = document.createElement('span');
      keyEl.textContent = k;
      keyEl.style.opacity = '0.55';
      const valEl = document.createElement('span');
      valEl.textContent = v;
      valEl.style.color = '#e8a840';
      row.appendChild(keyEl);
      row.appendChild(valEl);
      specsTable.appendChild(row);
    });
    body.appendChild(specsTable);

    // Applications section
    const appsLabel = document.createElement('div');
    appsLabel.textContent = 'APPLICATIONS';
    appsLabel.style.cssText = 'color:#4488cc;font-size:9px;letter-spacing:0.12em;margin-bottom:6px;';
    body.appendChild(appsLabel);

    const appsList = document.createElement('div');
    appsList.style.marginBottom = '14px';
    info.apps.forEach(app => {
      const item = document.createElement('div');
      item.style.cssText = 'padding:2px 0;';
      const bullet = document.createElement('span');
      bullet.textContent = '\u25B8 ';
      bullet.style.color = '#4488cc';
      item.appendChild(bullet);
      const appText = document.createTextNode(app);
      item.appendChild(appText);
      appsList.appendChild(item);
    });
    body.appendChild(appsList);

    // CTA button
    const cta = document.createElement('button');
    cta.textContent = info.cta.toUpperCase();
    Object.assign(cta.style, {
      width: '100%', padding: '11px 0',
      background: 'linear-gradient(135deg, #c97512, #e8a840)',
      border: 'none',
      borderRadius: '4px', color: '#0d0a06',
      fontFamily: 'inherit', fontSize: '11px', fontWeight: '700',
      letterSpacing: '0.14em', cursor: 'pointer',
      boxShadow: '0 0 18px rgba(200,130,20,0.4)',
      transition: 'box-shadow 0.18s ease, transform 0.12s ease',
    });
    cta.addEventListener('mouseenter', () => {
      cta.style.boxShadow = '0 0 32px rgba(200,140,20,0.65)';
      cta.style.transform = 'translateY(-1px)';
    });
    cta.addEventListener('mouseleave', () => {
      cta.style.boxShadow = '0 0 18px rgba(200,130,20,0.4)';
      cta.style.transform = 'translateY(0)';
    });
    body.appendChild(cta);

    infoPanel.appendChild(body);

    // Slide in
    infoPanel.style.transform = 'translateY(-50%) translateX(0)';
  }

  function closePanel() {
    activePanelTool = null;
    infoPanel.style.transform = 'translateY(-50%) translateX(100%)';
  }

  function showTooltip(toolId, screenX, screenY) {
    const info = toolInfo[toolId];
    if (!info) return;
    clearTimeout(tooltipHideTimer);

    while (tooltip.firstChild) tooltip.removeChild(tooltip.firstChild);

    const titleEl = document.createElement('strong');
    titleEl.textContent = info.title;
    tooltip.appendChild(titleEl);
    tooltip.appendChild(document.createElement('br'));

    const subEl = document.createElement('span');
    subEl.textContent = info.sub;
    subEl.style.opacity = '0.55';
    tooltip.appendChild(subEl);

    const hr = document.createElement('hr');
    hr.style.cssText = 'border:none;border-top:1px solid rgba(200,120,20,0.3);margin:5px 0';
    tooltip.appendChild(hr);

    const descEl = document.createElement('span');
    descEl.textContent = info.desc;
    descEl.style.cssText = 'opacity:0.8;white-space:pre-line';
    tooltip.appendChild(descEl);

    if (info.hint) {
      const hr2 = document.createElement('hr');
      hr2.style.cssText = 'border:none;border-top:1px solid rgba(200,120,20,0.2);margin:5px 0 4px';
      tooltip.appendChild(hr2);
      const hintEl = document.createElement('span');
      hintEl.textContent = info.hint;
      hintEl.style.cssText = 'opacity:0.35;font-size:9px;letter-spacing:0.04em';
      tooltip.appendChild(hintEl);
    }

    // Clamp to viewport
    const x = Math.min(screenX + 18, window.innerWidth  - 210);
    const y = Math.max(screenY - 20, 8);
    tooltip.style.left = x + 'px';
    tooltip.style.top  = y + 'px';
    tooltip.style.visibility = 'visible';
    tooltip.style.opacity = '1';
  }

  function hideTooltip() {
    tooltip.style.opacity = '0';
    clearTimeout(tooltipHideTimer);
    tooltipHideTimer = setTimeout(() => {
      tooltip.style.visibility = 'hidden';
    }, 200);
  }

  /* ─── Raycaster ───────────────────────────────────────── */
  const raycaster = new THREE.Raycaster();
  const mouseVec  = new THREE.Vector2();
  let hoveredTool = null;
  const hoverEmissive = { hammer: 0, wrench: 0, saw: 0 };

  function getToolGroup(id) {
    if (id === 'hammer') return hammerGroup;
    if (id === 'wrench') return wrenchGroup;
    return sawGroup;
  }

  /* ─── Spin animation state ────────────────────────────── */
  const spinState = {
    hammer: { spinning: false, spinStart: 0, spinFrom: 0 },
    wrench: { spinning: false, spinStart: 0, spinFrom: 0 },
    saw:    { spinning: false, spinStart: 0, spinFrom: 0 },
  };
  const SPIN_DURATION = 820;
  function easeInOut(t) { return t < 0.5 ? 2*t*t : -1+(4-2*t)*t; }

  /* ─── Assembly intro ──────────────────────────────────── */
  let assemblyDone      = false;
  let assemblyStartTime = null;
  let heroCopyShown     = false; // guard: only add .visible class once
  const ASSEMBLY_DURATION = 1800;
  function easeOut(t) { return 1 - Math.pow(1 - t, 3); }

  /* ─── Idle rotation accumulators + drag inertia ──────── */
  let hammerIdleY = 0;
  let wrenchIdleY = 0;
  const inertia = { hammer: 0, wrench: 0, saw: 0 };

  /* ─── Mouse tracking ──────────────────────────────────── */
  let mouseX = 0, mouseY = 0;
  let rawMouseX = 0, rawMouseY = 0;
  let targetRotX = 0, targetRotY = 0;

  window.addEventListener('mousemove', (e) => {
    rawMouseX = e.clientX;
    rawMouseY = e.clientY;
    mouseX = (e.clientX / window.innerWidth)  * 2 - 1;
    mouseY = (e.clientY / window.innerHeight) * 2 - 1;
    targetRotY =  mouseX * 0.08;
    targetRotX = -mouseY * 0.08;

    // Fix: correct NDC Y — no sign flip needed here
    mouseVec.set(mouseX, mouseY);
    raycaster.setFromCamera(mouseVec, camera);

    const targets = [];
    [hammerGroup, wrenchGroup, sawGroup].forEach(grp => {
      grp.traverse(o => { if (o.userData.toolId) targets.push(o); });
    });
    const hits = raycaster.intersectObjects(targets);

    if (hits.length > 0) {
      const id = hits[0].object.userData.toolId;
      if (id !== hoveredTool) emitRipple(id); // ripple on enter
      hoveredTool = id;
      canvas.style.cursor = 'pointer';
      showTooltip(id, rawMouseX, rawMouseY);
    } else {
      hoveredTool = null;
      canvas.style.cursor = 'default';
      hideTooltip();
    }
  });

  /* ─── Disassembly state ───────────────────────────────── */
  const disassembleState = {
    hammer: { exploded: false, animating: false, startTime: 0, goingOut: false },
    wrench: { exploded: false, animating: false, startTime: 0, goingOut: false },
    saw:    { exploded: false, animating: false, startTime: 0, goingOut: false },
  };
  const DISASSEMBLE_DURATION = 900;

  function getToolParts(id) {
    if (id === 'hammer') return hammerParts;
    if (id === 'wrench') return wrenchParts;
    return sawParts;
  }

  function triggerDisassemble(id) {
    const ds = disassembleState[id];
    ds.animating = true;
    ds.startTime = performance.now();
    ds.goingOut  = !ds.exploded;
    // Burst at tool world position — blue-white for disassembly, amber for reassembly
    const grp = getToolGroup(id);
    const burstColor = ds.goingOut ? 0x88ccff : 0xffa040;
    emitSparks(grp.position.x, grp.position.y, burstColor, sparks.length);
  }

  /* ─── Hover ripple rings ───────────────────────────────── */
  const rippleRings = [];
  for (let r = 0; r < 3; r++) {
    const rMat = new THREE.MeshBasicMaterial({
      color: 0x4488cc, transparent: true, opacity: 0,
      side: THREE.FrontSide, blending: THREE.AdditiveBlending, depthWrite: false,
    });
    const rMesh = new THREE.Mesh(new THREE.TorusGeometry(0.5, 0.025, 6, 24), rMat);
    rMesh.visible = false;
    scene.add(rMesh);
    rippleRings.push({ mesh: rMesh, active: false, startTime: 0 });
  }
  let rippleIdx = 0;

  function emitRipple(toolId) {
    const grp = getToolGroup(toolId);
    const ring = rippleRings[rippleIdx % 3];
    rippleIdx++;
    ring.mesh.position.copy(grp.position);
    ring.mesh.scale.set(0.2, 0.2, 0.2);
    ring.mesh.material.opacity = 0.65;
    ring.mesh.visible = true;
    ring.active = true;
    ring.startTime = performance.now();
  }

  /* ─── Click: open panel OR spin (single) ──────────────── */
  let lastClickTime = 0;
  let lastClickTool = null;

  function handleToolClick(toolId, screenX, screenY) {
    const now = performance.now();
    const dt  = now - lastClickTime;
    // Double-click detection (≤ 400 ms)
    if (dt < 400 && lastClickTool === toolId) {
      triggerDisassemble(toolId);
      lastClickTime = 0;
      return;
    }
    lastClickTime = now;
    lastClickTool = toolId;

    // Panel toggle
    if (activePanelTool === toolId) {
      closePanel();
    } else {
      openPanel(toolId);
      // Single click also spins
      const st = spinState[toolId];
      if (!st.spinning) {
        st.spinning  = true;
        st.spinStart = performance.now();
        st.spinFrom  = getToolGroup(toolId).rotation.y;
      }
    }
  }

  canvas.addEventListener('click', (e) => {
    if (hoveredTool) {
      handleToolClick(hoveredTool, e.clientX, e.clientY);
    } else {
      closePanel();
      // Spark burst at click world position
      const clickX = ((e.clientX / window.innerWidth)  * 2 - 1) * 5.5;
      const clickY = -((e.clientY / window.innerHeight) * 2 - 1) * 3.0;
      emitSparks(clickX, clickY);
    }
  });

  // Touch support — touchend mirrors click for mobile
  canvas.addEventListener('touchend', (e) => {
    e.preventDefault();
    const touch = e.changedTouches[0];
    const tx = (touch.clientX / window.innerWidth)  * 2 - 1;
    const ty = (touch.clientY / window.innerHeight) * 2 - 1;
    mouseVec.set(tx, ty);
    raycaster.setFromCamera(mouseVec, camera);
    const targets = [];
    [hammerGroup, wrenchGroup, sawGroup].forEach(grp => {
      grp.traverse(o => { if (o.userData.toolId) targets.push(o); });
    });
    const hits = raycaster.intersectObjects(targets);
    if (hits.length > 0) {
      handleToolClick(hits[0].object.userData.toolId, touch.clientX, touch.clientY);
    } else {
      closePanel();
    }
  }, { passive: false });

  /* ─── Drag-to-rotate tools ────────────────────────────── */
  let dragTool = null, dragStartX = 0, dragBaseRotY = 0;
  let dragVel = 0, dragLastX = 0, dragLastT = 0;

  canvas.addEventListener('mousedown', (e) => {
    if (hoveredTool) {
      dragTool     = hoveredTool;
      dragStartX   = e.clientX;
      dragBaseRotY = getToolGroup(hoveredTool).rotation.y;
      dragVel = 0; dragLastX = e.clientX; dragLastT = performance.now();
      canvas.style.cursor = 'grabbing';
      e.preventDefault();
    }
  });

  window.addEventListener('mousemove', (e) => {
    if (!dragTool) return;
    const dx = (e.clientX - dragStartX) / window.innerWidth;
    getToolGroup(dragTool).rotation.y = dragBaseRotY + dx * Math.PI * 2.5;
    // Track velocity for inertia on release
    const nowT = performance.now();
    dragVel = (e.clientX - dragLastX) / Math.max(1, nowT - dragLastT) * 0.003;
    dragLastX = e.clientX; dragLastT = nowT;
  });

  window.addEventListener('mouseup', () => {
    if (!dragTool) return;
    canvas.style.cursor = hoveredTool ? 'pointer' : 'default';
    // Sync idle accumulator to current rotation so idle resumes seamlessly
    if (dragTool === 'hammer') hammerIdleY = hammerGroup.rotation.y;
    if (dragTool === 'wrench') wrenchIdleY = wrenchGroup.rotation.y;
    // Store drag velocity for inertia decay
    inertia[dragTool] = dragVel;
    dragTool = null;
  });

  /* ─── Spark burst pool ─────────────────────────────────── */
  const sparks = [];
  for (let s = 0; s < 12; s++) {
    const sm = new THREE.Mesh(
      new THREE.SphereGeometry(0.04, 5, 4),
      new THREE.MeshBasicMaterial({
        color: 0xffa040, transparent: true, opacity: 0,
        blending: THREE.AdditiveBlending, depthWrite: false,
      })
    );
    sm.visible = false;
    scene.add(sm);
    sparks.push({ mesh: sm, active: false, vel: new THREE.Vector3(), startTime: 0 });
  }

  function emitSparks(worldX, worldY, color = 0xffa040, count = 12) {
    const useCount = Math.min(count, sparks.length);
    for (let i = 0; i < useCount; i++) {
      const sp = sparks[i];
      const angle = (i / useCount) * Math.PI * 2 + rand(0, 0.5);
      const speed = rand(0.004, 0.014);
      sp.mesh.material.color.setHex(color);
      sp.mesh.position.set(worldX, worldY, 1.5);
      sp.vel.set(Math.cos(angle) * speed, Math.sin(angle) * speed, rand(-0.002, 0.002));
      sp.mesh.material.opacity = 0.9;
      sp.mesh.visible = true;
      sp.active = true;
      sp.startTime = performance.now();
    }
  }

  /* ─── Keyboard shortcuts ───────────────────────────────── */
  window.addEventListener('keydown', (e) => {
    const key = e.key.toUpperCase();
    if (key === 'H') { openPanel('hammer'); hoverEmissive.hammer = 0.38; }
    if (key === 'W') { openPanel('wrench'); hoverEmissive.wrench = 0.38; }
    if (key === 'S') { openPanel('saw');  hoverEmissive.saw  = 0.38; }
    if (e.key === 'Escape') { closePanel(); }
  });

  /* ─── Scroll tracking ─────────────────────────────────── */
  let scrollProgress  = 0;  // 0–1 across full page — used for camera pull-back
  let currentScrollY  = 0;  // raw px — used for hero fade threshold

  function updateScroll() {
    currentScrollY = window.scrollY;
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    scrollProgress  = maxScroll > 0 ? currentScrollY / maxScroll : 0;
    const overlayAlpha = Math.min(scrollProgress * 2, 1);
    document.documentElement.style.setProperty('--overlay-alpha', overlayAlpha.toFixed(3));
  }

  window.addEventListener('scroll', updateScroll, { passive: true });

  /* ─── Camera state ────────────────────────────────────── */
  let camRotX = 0, camRotY = 0;

  /* ─── Responsive layout ───────────────────────────────── */
  function applyResponsiveLayout() {
    const w = window.innerWidth;
    const isNarrow = w < 480;
    const isMobile = w < 768;

    if (isNarrow) {
      camera.fov = 48;
      [hammerGroup, wrenchGroup, sawGroup].forEach(g => g.scale.setScalar(0.72));
      hammerGroup.position.set(-0.15, 0.3, 2.2);
      wrenchGroup.position.set(-1.2, 0.5, 1.4);
    } else if (isMobile) {
      camera.fov = 52;
      [hammerGroup, wrenchGroup, sawGroup].forEach(g => g.scale.setScalar(0.82));
      hammerGroup.position.set(-0.15, 0.3, 2.0);
      wrenchGroup.position.set(-1.5, 0.5, 1.4);
    } else {
      camera.fov = 60;
      [hammerGroup, wrenchGroup, sawGroup].forEach(g => g.scale.setScalar(1.0));
    }
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
  }

  /* ─── Resize handler ──────────────────────────────────── */
  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      renderer.setSize(window.innerWidth, window.innerHeight);
      applyResponsiveLayout();
    }, 150);
  });

  // Apply on init
  applyResponsiveLayout();

  /* ─── Animation loop ──────────────────────────────────── */
  let lastTime = 0;
  let edgeFade = 0; // declared here so scan + scroll blocks can both reference it

  function animate(time) {
    requestAnimationFrame(animate);
    const delta = Math.min(time - lastTime, 50);
    lastTime = time;

    /* ── Staggered assembly intro ── */
    if (!assemblyDone) {
      if (assemblyStartTime === null) assemblyStartTime = time;
      const elapsed = time - assemblyStartTime;
      let allDone = true;

      allToolParts.forEach(mesh => {
        const partElapsed = Math.max(0, elapsed - mesh.userData.assemblyDelay);
        const partT = easeOut(Math.min(partElapsed / (ASSEMBLY_DURATION * 0.72), 1));
        mesh.position.lerpVectors(mesh.userData.spreadPos, mesh.userData.restPos, partT);
        // Tumble rotation lerps to zero
        mesh.rotation.x = mesh.userData.spreadRot.x * (1 - partT);
        mesh.rotation.y = mesh.userData.spreadRot.y * (1 - partT);
        mesh.rotation.z = mesh.userData.spreadRot.z * (1 - partT);
        if (partT < 1) allDone = false;
      });

      if (allDone) {
        assemblyDone = true;
        allToolParts.forEach(mesh => { mesh.rotation.set(0, 0, 0); });
        // Add .visible exactly once — CSS transition fires from this single state change
        if (!heroCopyShown) {
          heroCopyShown = true;
          heroCopy.classList.add('visible');
        }
      }
    }

    /* ── Orbit light ── */
    const lightAngle = time * 0.0004 + 0.8;
    orbitLight.position.set(
      Math.cos(lightAngle) * 7,
      2.5 + Math.sin(lightAngle * 0.5) * 2.5,
      Math.sin(lightAngle) * 5
    );

    /* ── Fragment debris + mouse proximity reaction ── */
    const mouseWorldX = mouseX * 5.5;
    const mouseWorldY = -mouseY * 3.0;
    for (const fd of fragmentData) {
      const dx = fd.mesh.position.x - mouseWorldX;
      const dy = fd.mesh.position.y - mouseWorldY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const proximity = Math.max(0, 1 - dist / 2.5);
      // Boost rotation near cursor
      fd.mesh.rotation.x += fd.rotX * delta * (1 + proximity * 8);
      fd.mesh.rotation.y += fd.rotY * delta * (1 + proximity * 8);
      fd.mesh.rotation.z += fd.rotZ * delta * (1 + proximity * 6);
      // Gentle drift away from cursor
      if (proximity > 0.1 && dist > 0.01) {
        fd.mesh.position.x += (dx / dist) * proximity * 0.0008 * delta;
        fd.mesh.position.y += (dy / dist) * proximity * 0.0008 * delta;
      }
    }

    /* ── Particles ── */
    amberParticles.rotation.y += 0.00012 * delta;
    amberParticles.rotation.x += 0.000045 * delta;
    sparkParticles.rotation.y -= 0.00018 * delta; // counter-rotate for depth complexity
    sparkParticles.rotation.z += 0.000055 * delta;

    /* ── Hub bloom pulse ── */
    hubGlowMat.opacity = 0.40 + Math.sin(time * 0.004) * 0.12;

    /* ── Scan line sweep ── */
    const scanFrac = (time * 0.00028) % 1.0;
    const scanY    = scanFrac * SCAN_GRID_H;
    const sw       = SCAN_GRID_W / 2;
    scanLineVerts[0] = -sw; scanLineVerts[1] = scanY; scanLineVerts[2] = 0;
    scanLineVerts[3] =  sw; scanLineVerts[4] = scanY; scanLineVerts[5] = 0;
    scanLineGeo.attributes.position.needsUpdate = true;
    edgeFade = Math.min(scanFrac, 1 - scanFrac) * 2; // 0 at edges, 1 in middle

    /* ── Hero-only fade — viewport-relative, works on any page length ── */
    const heroFadeStart = window.innerHeight * 0.15; // start fading at 15vh scroll
    const heroFadeEnd   = window.innerHeight * 0.55; // fully gone at 55vh scroll
    const toolAlpha     = Math.max(0, 1 - Math.max(0, currentScrollY - heroFadeStart) / (heroFadeEnd - heroFadeStart));

    /* ── Hover emissive lerp ── */
    const lerpE = 1 - Math.pow(0.04, delta / 16);
    ['hammer', 'wrench', 'saw'].forEach(id => {
      const target = (hoveredTool === id || activePanelTool === id) ? 0.38 : 0;
      hoverEmissive[id] += (target - hoverEmissive[id]) * lerpE;
      const ev = hoverEmissive[id];
      getToolGroup(id).traverse(obj => {
        if (obj.isMesh && obj.material && obj.material.emissive) {
          // Don't override bubble's own emissive — only change non-emissive parts
          if (obj.material.emissiveIntensity < 0.5) {
            obj.material.emissive.setRGB(ev * 0.95, ev * 0.52, ev * 0.05);
          }
        }
      });
    });
    /* ── Spin animation ── */
    ['hammer', 'wrench', 'saw'].forEach(id => {
      const st = spinState[id];
      if (!st.spinning || dragTool === id) return;
      const elapsed = performance.now() - st.spinStart;
      if (elapsed >= SPIN_DURATION) {
        getToolGroup(id).rotation.y = st.spinFrom;
        st.spinning = false;
      } else {
        getToolGroup(id).rotation.y = st.spinFrom + easeInOut(elapsed / SPIN_DURATION) * Math.PI * 2;
      }
    });

    /* ── Disassembly animation ── */
    ['hammer', 'wrench', 'saw'].forEach(id => {
      const ds = disassembleState[id];
      if (!ds.animating) return;
      const elapsed = performance.now() - ds.startTime;
      const t = easeOut(Math.min(elapsed / DISASSEMBLE_DURATION, 1));
      const parts = getToolParts(id);
      parts.forEach(mesh => {
        if (ds.goingOut) {
          mesh.position.lerpVectors(mesh.userData.restPos, mesh.userData.spreadPos, t);
          mesh.rotation.x = mesh.userData.spreadRot.x * t;
          mesh.rotation.y = mesh.userData.spreadRot.y * t;
          mesh.rotation.z = mesh.userData.spreadRot.z * t;
        } else {
          mesh.position.lerpVectors(mesh.userData.spreadPos, mesh.userData.restPos, t);
          mesh.rotation.x = mesh.userData.spreadRot.x * (1 - t);
          mesh.rotation.y = mesh.userData.spreadRot.y * (1 - t);
          mesh.rotation.z = mesh.userData.spreadRot.z * (1 - t);
        }
      });
      if (t >= 1) {
        ds.animating = false;
        ds.exploded  = ds.goingOut;
        if (!ds.exploded) parts.forEach(m => m.rotation.set(0, 0, 0));
      }
    });

    /* ── Hover ripple rings ── */
    for (const ring of rippleRings) {
      if (!ring.active) continue;
      const elapsed = performance.now() - ring.startTime;
      const t = Math.min(elapsed / 420, 1);
      const s = 0.2 + t * 1.3;
      ring.mesh.scale.set(s, s, s);
      ring.mesh.material.opacity = 0.65 * (1 - t);
      if (t >= 1) { ring.active = false; ring.mesh.visible = false; }
    }

    /* ── Idle rotation (when assembled + not spinning + not dragging) ── */
    if (assemblyDone) {
      if (!spinState.hammer.spinning && dragTool !== 'hammer') {
        hammerIdleY += 0.00018 * delta;
      }
      if (!spinState.wrench.spinning && dragTool !== 'wrench') {
        wrenchIdleY -= 0.00014 * delta;
      }
    }
    // Inertia decay — continues spinning after drag release
    ['hammer', 'wrench', 'saw'].forEach(id => {
      if (!inertia[id]) return;
      if (id === 'hammer') hammerIdleY += inertia[id] * delta;
      if (id === 'wrench') wrenchIdleY += inertia[id] * delta;
      inertia[id] *= 0.92;
      if (Math.abs(inertia[id]) < 0.0001) inertia[id] = 0;
    });

    /* ── Tool float + proximity tilt + parallax ── */
    hammerGroup.position.y = 0.4 + Math.sin(time * 0.0006) * 0.10;
    hammerGroup.position.x = -0.2 + camRotY * -1.8;
    hammerGroup.position.z = 2.2 + camRotX * -0.6;
    if (!spinState.hammer.spinning && dragTool !== 'hammer') {
      hammerGroup.rotation.y = hammerIdleY + 0.60 + camRotY * 0.35;
      hammerGroup.rotation.z = 0.30 + mouseX * -0.08;
    }

    wrenchGroup.position.y = 0.6 + Math.sin(time * 0.0006 + 1.2) * 0.10;
    wrenchGroup.position.x = -1.8 + camRotY * -1.6;
    wrenchGroup.position.z = 1.6 + camRotX * -0.5;
    if (!spinState.wrench.spinning && dragTool !== 'wrench') {
      wrenchGroup.rotation.y = wrenchIdleY + 0.55 + camRotY * 0.28;
      wrenchGroup.rotation.z = 0.18 + mouseX * 0.06;
    }

    // Saw blade continuous spin (around its own Z axis after the X rotation)
    sawGroup.rotation.z += sawGroup.userData.spinSpeed;


    /* ── Floor grid parallax ── */
    floorGrid.position.x = camRotY * -0.8;
    floorGrid.position.z = 1.0 + camRotX * 0.4;

    /* ── Opacity / fade on scroll ── */
    allToolParts.forEach(m => { m.material.opacity = toolAlpha; });
    floorGrid.material.opacity   = toolAlpha * 0.55;
    wallGrid.material.opacity    = toolAlpha * 0.22;
    floorGlow.material.opacity  = toolAlpha * 0.28;
    horizonGrid.material.opacity = toolAlpha * 0.14;
    scanLineMat.opacity  = Math.min(edgeFade, 1) * 1.0 * toolAlpha;
    scanGlowMat.opacity  = Math.min(edgeFade, 1) * 0.50 * toolAlpha;
    sawSpot.intensity  = toolAlpha * 6;
    sawSpot.position.x = 0.2 + camRotY * -2.0;

    // Hero-scope: hide all fixed elements when scrolled past hero fold
    const heroVisible = toolAlpha > 0.01;
    canvas.style.visibility    = heroVisible ? 'visible' : 'hidden';
    canvas.style.pointerEvents = heroVisible ? 'auto'    : 'none';
    vignette.style.visibility  = heroVisible ? 'visible' : 'hidden';
    // Info panel: restore CSS default when visible, force hidden when scrolled out
    infoPanel.style.visibility = heroVisible ? '' : 'hidden';
    if (!heroVisible && activePanelTool) closePanel();

    // Hero copy: class-only approach — no inline opacity/visibility fights
    // .visible added once on assemblyDone; .scrolled-out toggled by scroll state
    if (heroCopyShown) {
      heroCopy.classList.toggle('scrolled-out', !heroVisible);
    }

    /* ── Spark burst update ── */
    const now = performance.now();
    for (const sp of sparks) {
      if (!sp.active) continue;
      const elapsed = now - sp.startTime;
      const t = elapsed / 600; // 600ms lifetime
      if (t >= 1) {
        sp.active = false;
        sp.mesh.visible = false;
      } else {
        sp.mesh.position.addScaledVector(sp.vel, delta);
        sp.mesh.material.opacity = 0.9 * (1 - t);
      }
    }

    /* ── Camera lerp ── */
    const lerpFactor = 1 - Math.pow(0.05, delta / 16);
    camRotX += (targetRotX - camRotX) * lerpFactor;
    camRotY += (targetRotY - camRotY) * lerpFactor;
    camera.rotation.x = camRotX;

    const scrollZ    = 6 + scrollProgress * 3;
    const scrollRotY = scrollProgress * 0.3;
    camera.position.z += (scrollZ - camera.position.z) * 0.06;
    camera.rotation.y  = camRotY + scrollRotY;

    renderer.render(scene, camera);
  }

  if (prefersReduced) {
    allToolParts.forEach(mesh => {
      mesh.position.copy(mesh.userData.restPos);
      mesh.rotation.set(0, 0, 0);
    });
    renderer.render(scene, camera);
  } else {
    animate(0);
  }

  /* ─── Print: hide canvas ──────────────────────────────── */
  const printStyle = document.createElement('style');
  printStyle.textContent = '@media print { #three-canvas { display: none !important; } }';
  document.head.appendChild(printStyle);

}());
