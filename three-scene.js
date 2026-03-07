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

  /* ─── Responsive particle counts ─────────────────────── */
  const isMobile = window.innerWidth < 768;
  const AMBER_COUNT = isMobile ? 800 : 2000;
  const SPARK_COUNT = isMobile ? 320 : 1100;

  /* ─── Particle physics system ────────────────────────── */
  function createParticleSystem(particleCount, positionRange) {
    const positions = new Float32Array(particleCount * 3);
    const velocities = new Float32Array(particleCount * 3);

    // Initialize positions in a cloud formation
    for (let i = 0; i < particleCount; i++) {
      const theta = rand(0, Math.PI * 2);
      const phi = Math.acos(rand(-1, 1));
      const r = rand(0, positionRange);
      positions[i * 3]     = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = r * Math.cos(phi);
      // Velocities initialized to zero
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    return { positions, velocities, geo, count: particleCount };
  }

  // Amber dust particles — main layer
  const amberSystem = createParticleSystem(AMBER_COUNT, 11);
  const amberParticleMat = new THREE.PointsMaterial({
    map: particleTex,
    color: 0xd4820a, size: 0.022, sizeAttenuation: true,
    transparent: true, opacity: 0.75,
    blending: THREE.AdditiveBlending, depthWrite: false,
  });
  const amberParticles = new THREE.Points(amberSystem.geo, amberParticleMat);
  scene.add(amberParticles);

  // Blue-white spark particles — secondary layer, smaller, brighter
  const sparkSystem = createParticleSystem(SPARK_COUNT, 9);
  const sparkMat = new THREE.PointsMaterial({
    map: particleTex,
    color: 0x99ddff, size: 0.018, sizeAttenuation: true,
    transparent: true, opacity: 0.68,
    blending: THREE.AdditiveBlending, depthWrite: false,
  });
  const sparkParticles = new THREE.Points(sparkSystem.geo, sparkMat);
  scene.add(sparkParticles);

  /* ─── Particle physics parameters ────────────────────── */
  const PHYSICS_PARAMS = {
    attractionRadius: 3.0,
    repulsionRadius: 1.0,
    attractionStrength: 0.0012,
    repulsionStrength: 0.008,
    upwardDrift: 0.0008,
    damping: 0.962,
    velocityCap: 0.035,
    shockwaveRadius: 2.0,
    shockwaveImpulse: 0.15,
    boundaryTop: 6.0,
    boundaryBottom: -5.0,
  };

  /* ─── Particle physics update ────────────────────────── */
  function updateParticlePhysics(system, mouseWorldPos, deltaTime) {
    const { positions, velocities, count } = system;
    const params = PHYSICS_PARAMS;

    for (let i = 0; i < count; i++) {
      const pi = i * 3;

      // Get particle position
      const px = positions[pi];
      const py = positions[pi + 1];
      const pz = positions[pi + 2];

      // Calculate distance to mouse (3D)
      const dx = px - mouseWorldPos.x;
      const dy = py - mouseWorldPos.y;
      const dz = pz - mouseWorldPos.z;
      const distSq = dx * dx + dy * dy + dz * dz;
      const dist = Math.sqrt(distSq);

      // Apply magnetic forces
      if (dist < params.attractionRadius && dist > 0.01) {
        if (dist < params.repulsionRadius) {
          // Repulsion: push away
          const force = (params.repulsionRadius - dist) * params.repulsionStrength;
          const nx = dx / dist;
          const ny = dy / dist;
          velocities[pi]     += nx * force;
          velocities[pi + 1] += ny * force;
        } else {
          // Attraction: pull toward
          const force = (params.attractionRadius - dist) / params.attractionRadius * params.attractionStrength;
          const nx = dx / dist;
          const ny = dy / dist;
          velocities[pi]     -= nx * force;
          velocities[pi + 1] -= ny * force;
        }
      }

      // Add upward drift
      velocities[pi + 1] += params.upwardDrift;

      // Clamp velocity magnitude
      const vx = velocities[pi];
      const vy = velocities[pi + 1];
      const vz = velocities[pi + 2];
      const vmag = Math.sqrt(vx * vx + vy * vy + vz * vz);
      if (vmag > params.velocityCap) {
        const scale = params.velocityCap / vmag;
        velocities[pi]     *= scale;
        velocities[pi + 1] *= scale;
        velocities[pi + 2] *= scale;
      }

      // Apply damping
      velocities[pi]     *= params.damping;
      velocities[pi + 1] *= params.damping;
      velocities[pi + 2] *= params.damping;

      // Update position
      positions[pi]     += velocities[pi];
      positions[pi + 1] += velocities[pi + 1];
      positions[pi + 2] += velocities[pi + 2];

      // Boundary recycling
      if (positions[pi + 1] > params.boundaryTop || positions[pi + 1] < params.boundaryBottom) {
        // Reset to bottom with random XZ spread
        positions[pi]     = rand(-2, 2);
        positions[pi + 1] = params.boundaryBottom + 0.5;
        positions[pi + 2] = rand(-2, 2);
        velocities[pi]     = 0;
        velocities[pi + 1] = 0;
        velocities[pi + 2] = 0;
      }
    }

    // Mark geometry as needing update
    system.geo.attributes.position.needsUpdate = true;
  }

  /* ─── Click shockwave ────────────────────────────────── */
  function applyShockwave(system, mouseWorldPos) {
    const { positions, velocities, count } = system;
    const params = PHYSICS_PARAMS;

    for (let i = 0; i < count; i++) {
      const pi = i * 3;
      const px = positions[pi];
      const py = positions[pi + 1];
      const pz = positions[pi + 2];

      const dx = px - mouseWorldPos.x;
      const dy = py - mouseWorldPos.y;
      const dz = pz - mouseWorldPos.z;
      const distSq = dx * dx + dy * dy + dz * dz;
      const dist = Math.sqrt(distSq);

      if (dist < params.shockwaveRadius && dist > 0.01) {
        const nx = dx / dist;
        const ny = dy / dist;
        const nz = dz / dist;
        velocities[pi]     += nx * params.shockwaveImpulse;
        velocities[pi + 1] += ny * params.shockwaveImpulse;
        velocities[pi + 2] += nz * params.shockwaveImpulse;
      }
    }
  }

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

  /* ─── Cordless Power Drill ────────────────────────────────── */
  const drillGroup = new THREE.Group();
  const drillParts = [];

  function addDrillPart(geo, mat, px, py, pz, sx, sy, sz) {
    const mesh = new THREE.Mesh(geo, mat);
    mesh.castShadow = true;
    mesh.position.set(px, py, pz);
    drillGroup.add(mesh);
    registerPart(mesh, sx, sy, sz, drillParts);
    return mesh;
  }

  // ── Body: pistol-grip profile via ExtrudeGeometry
  const barrelShape = new THREE.Shape();
  barrelShape.moveTo(-0.55, 0.10);
  barrelShape.lineTo( 0.55, 0.10);
  barrelShape.quadraticCurveTo(0.60, 0.10, 0.60, 0.16);
  barrelShape.lineTo( 0.60, 0.52);
  barrelShape.quadraticCurveTo(0.60, 0.58, 0.54, 0.58);
  barrelShape.lineTo(-0.42, 0.58);
  barrelShape.quadraticCurveTo(-0.55, 0.58, -0.60, 0.52);
  barrelShape.lineTo(-0.60, 0.16);
  barrelShape.quadraticCurveTo(-0.60, 0.10, -0.55, 0.10);
  barrelShape.closePath();

  const gripShape = new THREE.Shape();
  gripShape.moveTo(-0.10, 0);
  gripShape.lineTo( 0.10, 0);
  gripShape.lineTo( 0.14, -0.90);
  gripShape.quadraticCurveTo(0.14, -0.98, 0.06, -0.98);
  gripShape.lineTo(-0.06, -0.98);
  gripShape.quadraticCurveTo(-0.14, -0.98, -0.14, -0.90);
  gripShape.closePath();

  const extrudeOpts = { depth: 0.32, bevelEnabled: true, bevelThickness: 0.025, bevelSize: 0.022, bevelSegments: 3 };

  addDrillPart(
    new THREE.ExtrudeGeometry(barrelShape, extrudeOpts),
    darkMat.clone(), 0, 0.34, -0.16, -0.5, 0.8, 0.4
  );
  addDrillPart(
    new THREE.ExtrudeGeometry(gripShape, extrudeOpts),
    darkMat.clone(), 0, 0.10, -0.16, 0.3, -1.0, 0.3
  );

  // ── Motor housing (rear barrel) — tapered cylinder
  addDrillPart(
    new THREE.CylinderGeometry(0.26, 0.28, 0.55, 16),
    steelMat.clone(), -0.28, 0.34, 0, -1.2, 0.5, 0.3
  );

  // ── Chuck assembly (front)
  addDrillPart(
    new THREE.CylinderGeometry(0.14, 0.18, 0.30, 16),
    chromeMat.clone(), 0.70, 0.34, 0, 1.2, 0.4, 0.3
  );
  // Chuck tip opening
  const chuckTip = new THREE.Mesh(
    new THREE.CylinderGeometry(0.06, 0.06, 0.05, 12),
    new THREE.MeshStandardMaterial({ color: 0x020202, roughness: 1.0, metalness: 0.0 })
  );
  chuckTip.position.set(0.86, 0.34, 0);
  drillGroup.add(chuckTip);

  // Chuck key slots (3× at 120deg)
  for (let k = 0; k < 3; k++) {
    const angle = (k / 3) * Math.PI * 2;
    const slot = new THREE.Mesh(
      new THREE.BoxGeometry(0.036, 0.13, 0.025),
      chromeMat.clone()
    );
    slot.position.set(0.70, 0.34 + Math.sin(angle) * 0.10, Math.cos(angle) * 0.10);
    slot.rotation.x = angle;
    drillGroup.add(slot);
  }

  // ── Battery pack (bottom of grip)
  addDrillPart(
    new THREE.BoxGeometry(0.40, 0.28, 0.34),
    new THREE.MeshStandardMaterial({ color: 0x1a1814, roughness: 0.65, metalness: 0.05, transparent: true, opacity: 1 }),
    0, -1.02, -0.03, 0.3, -1.4, 0.5
  );
  // Battery rail connector
  addDrillPart(
    new THREE.BoxGeometry(0.42, 0.04, 0.36),
    new THREE.MeshStandardMaterial({ color: 0x0e0c0a, roughness: 0.55, metalness: 0.15, transparent: true, opacity: 1 }),
    0, -0.90, -0.03, 0.3, -1.0, 0.4
  );
  // Battery cell ridges (4×)
  for (let b = 0; b < 4; b++) {
    const bx = -0.15 + b * 0.10;
    const ridge = new THREE.Mesh(
      new THREE.BoxGeometry(0.06, 0.04, 0.30),
      new THREE.MeshStandardMaterial({ color: 0x121009, roughness: 0.6, metalness: 0.1 })
    );
    ridge.position.set(bx, -0.87, -0.03);
    drillGroup.add(ridge);
  }
  // Amber accent stripe on battery
  addDrillPart(
    new THREE.BoxGeometry(0.42, 0.03, 0.36),
    tapeBandMat.clone(), 0, -0.76, -0.03, 0.3, -0.8, 0.4
  );

  // ── Trigger
  addDrillPart(
    new THREE.BoxGeometry(0.06, 0.20, 0.09),
    new THREE.MeshStandardMaterial({ color: 0x141210, roughness: 0.82, metalness: 0.08, transparent: true, opacity: 1 }),
    0.10, -0.10, 0, 0.4, 0.5, 0.2
  );

  // ── Ventilation slots on motor housing (6×)
  for (let v = 0; v < 6; v++) {
    const angle = (v / 6) * Math.PI * 2;
    const vSlot = new THREE.Mesh(
      new THREE.BoxGeometry(0.008, 0.08, 0.36),
      new THREE.MeshStandardMaterial({ color: 0x020202, roughness: 1.0, metalness: 0.0 })
    );
    vSlot.position.set(-0.28 + Math.cos(angle) * 0.28, 0.34 + Math.sin(angle) * 0.28, 0);
    vSlot.rotation.z = angle;
    drillGroup.add(vSlot);
  }

  // ── Grip texture rings (5×)
  for (let g = 0; g < 5; g++) {
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(0.11, 0.007, 6, 18),
      new THREE.MeshStandardMaterial({ color: 0x0d0b08, roughness: 0.88, metalness: 0.15 })
    );
    ring.rotation.x = Math.PI / 2;
    ring.position.set(0, -0.25 - g * 0.12, 0);
    drillGroup.add(ring);
  }

  // ── Raycasting bounds
  const drillBounds = new THREE.Mesh(
    new THREE.BoxGeometry(1.8, 2.2, 0.7),
    new THREE.MeshBasicMaterial({ visible: false })
  );
  drillBounds.userData.toolId = 'drill';
  drillGroup.add(drillBounds);

  drillGroup.rotation.z = 0.18;
  drillGroup.rotation.y = -0.50;
  scene.add(drillGroup);

  /* ─── Angle Grinder ─────────────────────────────────────────── */
  const grinderGroup = new THREE.Group();
  const grinderParts = [];

  function addGrinderPart(geo, mat, px, py, pz, sx, sy, sz) {
    const mesh = new THREE.Mesh(geo, mat);
    mesh.castShadow = true;
    mesh.position.set(px, py, pz);
    grinderGroup.add(mesh);
    registerPart(mesh, sx, sy, sz, grinderParts);
    return mesh;
  }

  // ── Main barrel body (horizontal)
  const barrelMesh = addGrinderPart(
    new THREE.CylinderGeometry(0.22, 0.24, 1.30, 16),
    darkMat.clone(), 0, 0, 0, -0.5, 0.8, 0.4
  );
  barrelMesh.rotation.z = Math.PI / 2;

  // ── Gear head (front of barrel, disc side)
  const gearHead = addGrinderPart(
    new THREE.CylinderGeometry(0.30, 0.28, 0.28, 16),
    steelMat.clone(), 0.80, 0, 0, 1.0, 0.5, 0.3
  );
  gearHead.rotation.z = Math.PI / 2;

  // ── Disc guard (protective half-shield)
  const guardMesh = new THREE.Mesh(
    new THREE.CylinderGeometry(0.46, 0.46, 0.030, 32, 1, true, 0, Math.PI),
    steelMat.clone()
  );
  guardMesh.castShadow = true;
  guardMesh.rotation.z = Math.PI / 2;
  guardMesh.rotation.y = Math.PI / 2;
  guardMesh.position.set(1.00, 0, 0);
  grinderGroup.add(guardMesh);
  registerPart(guardMesh, 1.2, 0.5, 0.3, grinderParts);

  // Guard rim torus
  const guardRim = new THREE.Mesh(
    new THREE.TorusGeometry(0.46, 0.015, 8, 32),
    steelMat.clone()
  );
  guardRim.rotation.y = Math.PI / 2;
  guardRim.position.set(1.00, 0, 0);
  grinderGroup.add(guardRim);
  registerPart(guardRim, 1.2, 0.4, 0.3, grinderParts);

  // ── Grinding disc
  const discMat = new THREE.MeshStandardMaterial({
    color: 0x2a2620, roughness: 0.85, metalness: 0.20, transparent: true, opacity: 1.0
  });
  addGrinderPart(
    new THREE.CylinderGeometry(0.44, 0.44, 0.020, 36),
    discMat, 1.00, 0, 0, 1.2, 0.6, 0.3
  ).rotation.z = Math.PI / 2;

  // Disc radial scoring lines (8×)
  for (let s = 0; s < 8; s++) {
    const angle = (s / 8) * Math.PI * 2;
    const scoreMesh = new THREE.Mesh(
      new THREE.BoxGeometry(0.008, 0.020, 0.44),
      new THREE.MeshStandardMaterial({ color: 0x161412, roughness: 0.9, metalness: 0.1 })
    );
    scoreMesh.position.set(1.00, 0, 0);
    scoreMesh.rotation.x = angle;
    scoreMesh.rotation.z = Math.PI / 2;
    grinderGroup.add(scoreMesh);
  }

  // ── Rear end cap
  const rearCap = addGrinderPart(
    new THREE.CylinderGeometry(0.18, 0.16, 0.22, 14),
    steelMat.clone(), -0.75, 0, 0, -1.2, 0.4, 0.3
  );
  rearCap.rotation.z = Math.PI / 2;

  // ── Side handle (D-grip perpendicular to barrel)
  addGrinderPart(
    new THREE.CylinderGeometry(0.055, 0.060, 0.55, 12),
    new THREE.MeshStandardMaterial({ color: 0x151210, roughness: 0.80, metalness: 0.10, transparent: true, opacity: 1 }),
    0, 0.50, 0, 0.3, 1.2, 0.4
  );
  // Side handle end cap sphere
  const sideHandleEnd = new THREE.Mesh(
    new THREE.SphereGeometry(0.065, 10, 8),
    new THREE.MeshStandardMaterial({ color: 0x151210, roughness: 0.80, metalness: 0.10 })
  );
  sideHandleEnd.position.set(0, 0.80, 0);
  grinderGroup.add(sideHandleEnd);
  registerPart(sideHandleEnd, 0.3, 1.5, 0.4, grinderParts);

  // ── Grip texture rings on barrel (4×)
  for (let g = 0; g < 4; g++) {
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(0.23, 0.009, 6, 18),
      new THREE.MeshStandardMaterial({ color: 0x0d0b08, roughness: 0.88, metalness: 0.15 })
    );
    ring.position.set(-0.20 + g * 0.18, 0, 0);
    ring.rotation.y = Math.PI / 2;
    grinderGroup.add(ring);
    registerPart(ring, -0.4, 0.4, 0.3, grinderParts);
  }

  // ── Power cable stub (rear)
  const cableMat = new THREE.MeshStandardMaterial({ color: 0x120f0d, roughness: 0.82, metalness: 0.05 });
  const cable1 = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.028, 0.22, 8), cableMat.clone());
  cable1.position.set(-0.90, -0.10, 0);
  grinderGroup.add(cable1);
  registerPart(cable1, -1.2, -0.5, 0.3, grinderParts);

  // ── Raycasting bounds
  const grinderBounds = new THREE.Mesh(
    new THREE.BoxGeometry(1.8, 1.2, 0.7),
    new THREE.MeshBasicMaterial({ visible: false })
  );
  grinderBounds.userData.toolId = 'grinder';
  grinderGroup.add(grinderBounds);

  grinderGroup.rotation.z = 0.12;
  grinderGroup.rotation.y = 0.55;
  scene.add(grinderGroup);

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
  sawGroup.position.set(0, 1.9, -0.2);  // Triangular apex: raised and pushed back
  sawGroup.rotation.z = 0; // will spin in animation loop
  scene.add(sawGroup);

  // Invisible bounds for raycasting
  const sawBounds = new THREE.Mesh(
    new THREE.CylinderGeometry(1.1, 1.1, 0.2, 16),
    new THREE.MeshBasicMaterial({ visible: false })
  );
  sawBounds.userData.toolId = 'saw';
  sawGroup.add(sawBounds);

  // Store reference for spin animation (will be mouse-controlled)
  sawGroup.userData.baseSawSpeed = 0.003;
  sawGroup.userData.maxSawSpeed = 0.025;


  /* ─── All tool groups for traversal ──────────────────── */
  const allToolParts = [...drillParts, ...grinderParts, ...sawParts];

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
    drill: {
      title: 'CORDLESS POWER DRILL', sub: '18V Brushless',
      desc: 'Drilling · Driving\nFastening · Assembly',
      hint: '[H] panel  ·  drag to spin  ·  dbl-click burst',
      specs: { Voltage: '18V', Chuck: '13 mm Keyless', Torque: '65 Nm', Weight: '1.4 kg' },
      apps: ['Drilling & Driving', 'Fastening & Assembly'],
      cta: 'Get a Quote',
    },
    grinder: {
      title: 'ANGLE GRINDER', sub: '115mm 850W',
      desc: 'Grinding · Cutting\nPolishing · Finishing',
      hint: '[W] panel  ·  drag to spin  ·  dbl-click burst',
      specs: { Disc: '115 mm', Power: '850 W', Speed: '11000 RPM', Guard: 'Steel' },
      apps: ['Grinding & Cutting', 'Polishing & Finishing'],
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
  const hoverEmissive = { drill: 0, grinder: 0, saw: 0 };

  function getToolGroup(id) {
    if (id === 'drill') return drillGroup;
    if (id === 'grinder') return grinderGroup;
    return sawGroup;
  }

  /* ─── Spin animation state ────────────────────────────── */
  const spinState = {
    drill: { spinning: false, spinStart: 0, spinFrom: 0 },
    grinder: { spinning: false, spinStart: 0, spinFrom: 0 },
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
  let drillIdleY = 0;
  let grinderIdleY = 0;
  const inertia = { drill: 0, grinder: 0, saw: 0 };

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
    [drillGroup, grinderGroup, sawGroup].forEach(grp => {
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

  /* ─── Touch interaction for mobile ─────────────────────── */
  document.addEventListener('touchmove', (event) => {
    // Get touch position from first touch point
    const touch = event.touches[0];
    // Convert to normalized device coordinates (-1 to 1)
    // Use same formula as mouse handler for consistency
    mouseX = (touch.clientX / window.innerWidth) * 2 - 1;
    mouseY = (touch.clientY / window.innerHeight) * 2 - 1;
    // Physics loop will automatically respond since it reads mouseX/mouseY
  }, false);

  /* ─── Disassembly state ───────────────────────────────── */
  const disassembleState = {
    drill: { exploded: false, animating: false, startTime: 0, goingOut: false },
    grinder: { exploded: false, animating: false, startTime: 0, goingOut: false },
    saw:    { exploded: false, animating: false, startTime: 0, goingOut: false },
  };
  const DISASSEMBLE_DURATION = 900;

  function getToolParts(id) {
    if (id === 'drill') return drillParts;
    if (id === 'grinder') return grinderParts;
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
      // Apply particle shockwave
      applyShockwave(amberSystem, { x: clickX, y: clickY, z: 0 });
      applyShockwave(sparkSystem, { x: clickX, y: clickY, z: 0 });
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
    [drillGroup, grinderGroup, sawGroup].forEach(grp => {
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
    if (dragTool === 'drill') drillIdleY = drillGroup.rotation.y;
    if (dragTool === 'grinder') grinderIdleY = grinderGroup.rotation.y;
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
    if (key === 'H') { openPanel('drill'); hoverEmissive.drill = 0.38; }
    if (key === 'W') { openPanel('grinder'); hoverEmissive.grinder = 0.38; }
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
      [drillGroup, grinderGroup, sawGroup].forEach(g => g.scale.setScalar(0.72));
      drillGroup.position.set(0.9, 0.4, 2.1);    // left-front in triangle
      grinderGroup.position.set(-0.9, 0.6, 2.1);   // right-front in triangle
      // sawGroup position handled in animate loop for apex
    } else if (isMobile) {
      camera.fov = 52;
      [drillGroup, grinderGroup, sawGroup].forEach(g => g.scale.setScalar(0.82));
      drillGroup.position.set(1.1, 0.3, 2.0);    // left-front in triangle
      grinderGroup.position.set(-1.1, 0.5, 2.0);   // right-front in triangle
      // sawGroup position handled in animate loop for apex
    } else {
      camera.fov = 60;
      [drillGroup, grinderGroup, sawGroup].forEach(g => g.scale.setScalar(1.0));
      drillGroup.position.set(1.2, 0.4, 2.1);    // left-front in triangle
      grinderGroup.position.set(-1.2, 0.6, 2.1);   // right-front in triangle
      // sawGroup position handled in animate loop for apex
    }
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    // Store base positions for float animations to preserve responsive layout
    window.toolBasePositions = {
      drill: {
        x: drillGroup.position.x,
        y: drillGroup.position.y,
        z: drillGroup.position.z
      },
      grinder: {
        x: grinderGroup.position.x,
        y: grinderGroup.position.y,
        z: grinderGroup.position.z
      },
      saw: {
        x: sawGroup.position.x,
        y: sawGroup.position.y,
        z: sawGroup.position.z
      }
    };
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

    /* ── Particles (physics-driven) ── */
    const mouseWorldPos = {
      x: mouseX * 5.5,
      y: -mouseY * 3.0,
      z: 0
    };
    updateParticlePhysics(amberSystem, mouseWorldPos, delta);
    updateParticlePhysics(sparkSystem, mouseWorldPos, delta);

    /* ── Hub bloom pulse ── */
    // Will be calculated after sawSpinSpeed is set (see below)

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
    ['drill', 'grinder', 'saw'].forEach(id => {
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
    ['drill', 'grinder', 'saw'].forEach(id => {
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
    ['drill', 'grinder', 'saw'].forEach(id => {
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
      if (!spinState.drill.spinning && dragTool !== 'drill') {
        drillIdleY += 0.00018 * delta;
      }
      if (!spinState.grinder.spinning && dragTool !== 'grinder') {
        grinderIdleY -= 0.00014 * delta;
      }
    }
    // Inertia decay — continues spinning after drag release
    ['drill', 'grinder', 'saw'].forEach(id => {
      if (!inertia[id]) return;
      if (id === 'drill') drillIdleY += inertia[id] * delta;
      if (id === 'grinder') grinderIdleY += inertia[id] * delta;
      inertia[id] *= 0.92;
      if (Math.abs(inertia[id]) < 0.0001) inertia[id] = 0;
    });

    /* ── Tool float + proximity tilt + parallax ── */
    // Use stored responsive base positions and add float animation on top
    if (window.toolBasePositions) {
      drillGroup.position.x = window.toolBasePositions.drill.x + camRotY * -1.8;
      drillGroup.position.y = window.toolBasePositions.drill.y + Math.sin(time * 0.0006) * 0.10;
      drillGroup.position.z = window.toolBasePositions.drill.z + camRotX * -0.6;

      grinderGroup.position.x = window.toolBasePositions.grinder.x + camRotY * -1.6;
      grinderGroup.position.y = window.toolBasePositions.grinder.y + Math.sin(time * 0.0006 + 1.2) * 0.10;
      grinderGroup.position.z = window.toolBasePositions.grinder.z + camRotX * -0.5;

      // Saw blade apex positioning with corrected float frequency and parallax
      sawGroup.position.x = window.toolBasePositions.saw.x + camRotY * -1.4;
      sawGroup.position.y = window.toolBasePositions.saw.y + Math.cos(time * 0.0005) * 0.08;
      sawGroup.position.z = window.toolBasePositions.saw.z + camRotX * -0.4 + Math.sin(time * 0.0005) * 0.06;
    }

    if (!spinState.drill.spinning && dragTool !== 'drill') {
      drillGroup.rotation.y = drillIdleY + 0.60 + camRotY * 0.35;
      drillGroup.rotation.z = 0.30 + mouseX * -0.08;
    }

    if (!spinState.grinder.spinning && dragTool !== 'grinder') {
      grinderGroup.rotation.y = grinderIdleY + 0.55 + camRotY * 0.28;
      grinderGroup.rotation.z = 0.18 + mouseX * 0.06;
    }

    // Saw blade continuous spin (around its own Z axis after the X rotation)
    // Mouse-X driven speed: left (-1) = slow, right (1) = fast
    // mouseX is already normalized to -1...1 range by mouse/touch handlers
    const speedMultiplier = 0.5 + (mouseX * 0.5); // 0 to 1 range
    const sawSpinSpeed = THREE.MathUtils.lerp(sawGroup.userData.baseSawSpeed, sawGroup.userData.maxSawSpeed, speedMultiplier);
    sawGroup.rotation.z += sawSpinSpeed;

    // NOW calculate speedRatio using the current frame's sawSpinSpeed
    const baseSpeed = sawGroup.userData.baseSawSpeed;
    const maxSpeed = sawGroup.userData.maxSawSpeed;
    const speedRatio = (sawSpinSpeed - baseSpeed) / (maxSpeed - baseSpeed); // 0 to 1
    // Update both hub bloom and corona with speed feedback
    hubGlowMat.opacity = 0.30 + (speedRatio * 0.50); // Opacity from 0.3 to 0.8
    hubCoronaMat.opacity = 0.20 + (speedRatio * 0.30); // Slightly different range for visual distinction

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
    // Link saw spotlight intensity to spin speed for interactive feedback
    const spotIntensity = 4 + (speedRatio * 3); // Intensity from 4 to 7
    sawSpot.intensity  = toolAlpha * spotIntensity;
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
