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

  /* ─── WebGL Feature Detection ─────────────────────────── */
  (function detectAndFallback() {
    const probe = document.createElement('canvas');
    const gl = probe.getContext('webgl2') || probe.getContext('webgl') || probe.getContext('experimental-webgl');
    if (!gl) {
      document.documentElement.classList.add('no-webgl');
      const hero = document.querySelector('.hero');
      if (hero) {
        const banner = document.createElement('p');
        banner.className = 'webgl-unsupported-banner';
        banner.setAttribute('role', 'status');
        banner.textContent = 'For the best visual experience, try Chrome or Firefox with hardware acceleration enabled.';
        hero.prepend(banner);
      }
    }
  })();

  /* ─── GPU tier detection (for low-end throttling) ─────── */
  const _gpuProbe = (function () {
    const probe = document.createElement('canvas');
    const gl = probe.getContext('webgl2') || probe.getContext('webgl');
    if (!gl) return { lowEnd: false };
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    const renderer = ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : '';
    const isSoftware = /SwiftShader|llvmpipe|softpipe/i.test(renderer);
    const lowMem = (navigator.deviceMemory || 4) < 2;
    return { lowEnd: isSoftware || lowMem };
  })();
  const _isLowEnd = _gpuProbe.lowEnd;

  /* ─── Reduced motion check ────────────────────────────── */
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ─── Renderer + Canvas ───────────────────────────────── */
  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: false,
    powerPreference: 'high-performance',
    // preserveDrawingBuffer removed — not needed (no canvas export), caused double-buffer banding during additive particle rendering
  });

  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.VSMShadowMap;  // Gaussian blur penumbra — smoother than PCFSoft
  renderer.outputEncoding      = THREE.sRGBEncoding;
  renderer.toneMapping         = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.82;  // blade darkened + sawSpot reduced; scene self-compensates

  // Required for RectAreaLight to render correctly
  if (THREE.RectAreaLightUniformsLib) {
    THREE.RectAreaLightUniformsLib.init();
  }

  /* ─── Post-processing: declarations (initialized after camera) ─── */
  const _isMobilePost = window.innerWidth < 768;
  let composer = null;
  let bloomPass = null;

  const canvas = renderer.domElement;
  canvas.id = 'three-canvas';
  canvas.setAttribute('aria-hidden', 'true');
  canvas.style.cursor = 'default';
  document.body.insertBefore(canvas, document.body.firstChild);

  /* ─── Scene ───────────────────────────────────────────── */
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x030405); // near-black — tools emerge from darkness
  scene.fog = new THREE.FogExp2(0x050810, 0.055); // raised density for depth separation — pushes bg debris into murk, slight blue tint matches fill light

  // Real IBL via PMREMGenerator — gradient equirectangular env map matching warm/cool palette
  const pmrem = new THREE.PMREMGenerator(renderer);
  pmrem.compileEquirectangularShader();

  const envCvs = document.createElement('canvas');
  envCvs.width = 512; envCvs.height = 256;
  const ec = envCvs.getContext('2d');

  // Sky: deep dark blue-black gradient (top to horizon)
  const skyGrad = ec.createLinearGradient(0, 0, 0, 128);
  skyGrad.addColorStop(0, '#071018');
  skyGrad.addColorStop(1, '#0d1a2e');
  ec.fillStyle = skyGrad; ec.fillRect(0, 0, 512, 128);

  // Floor: dark warm-brown gradient (horizon to bottom)
  const flrGrad = ec.createLinearGradient(0, 128, 0, 256);
  flrGrad.addColorStop(0, '#1a0d04');
  flrGrad.addColorStop(1, '#070503');
  ec.fillStyle = flrGrad; ec.fillRect(0, 128, 512, 128);

  // Key light spot: warm amber radial blob — upper left (~camera key light position)
  const keySpot = ec.createRadialGradient(96, 64, 0, 96, 64, 140);
  keySpot.addColorStop(0,   'rgba(200,110,20,0.85)');
  keySpot.addColorStop(0.5, 'rgba(140,70,10,0.35)');
  keySpot.addColorStop(1,   'rgba(0,0,0,0)');
  ec.fillStyle = keySpot; ec.fillRect(0, 0, 512, 256);

  // Fill light spot: cool blue radial blob — upper right
  const fillSpot = ec.createRadialGradient(420, 80, 0, 420, 80, 120);
  fillSpot.addColorStop(0,   'rgba(20,40,90,0.20)');
  fillSpot.addColorStop(1,   'rgba(0,0,0,0)');
  ec.fillStyle = fillSpot; ec.fillRect(0, 0, 512, 256);

  const envTex = new THREE.CanvasTexture(envCvs);
  envTex.mapping = THREE.EquirectangularReflectionMapping;
  const envMap = pmrem.fromEquirectangular(envTex);
  scene.environment = envMap.texture;
  pmrem.dispose();

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

  /* ─── EffectComposer + UnrealBloomPass (after camera) ─── */
  if (!_isMobilePost && !_isLowEnd && typeof THREE.EffectComposer !== 'undefined') {
    composer = new THREE.EffectComposer(renderer);
    composer.addPass(new THREE.RenderPass(scene, camera));

    bloomPass = new THREE.UnrealBloomPass(
      new THREE.Vector2(window.innerWidth, window.innerHeight),
      0.40,   // strength — reduced from 0.55; lower baseline, dynamic formula handles peaks
      0.22,   // radius — tight halo eliminates mip-boundary step artifact; was 0.40
      0.55    // threshold — only saw disc emissive + spark mesh bright spots bloom; was 0.45
    );
    composer.addPass(bloomPass);
    const copyPass = new THREE.ShaderPass(THREE.CopyShader);
    copyPass.renderToScreen = true; // direct canvas blit — eliminates extra FBO read-back that causes stripe artifacts
    composer.addPass(copyPass);
  }

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
  const ambientLight = new THREE.AmbientLight(0x06080e, 0.04);
  scene.add(ambientLight);

  // ── KEY LIGHT: large warm amber RectAreaLight — upper left, main sculpting light
  const keyLight = new THREE.RectAreaLight(0xf0920c, 0.18, 5.0, 4.0);
  keyLight.position.set(-4.0, 5.5, 5.5);
  keyLight.lookAt(0, 0.5, 0);
  scene.add(keyLight);

  // ── FILL LIGHT: cool blue RectAreaLight — right side, lower intensity
  const fillLight = new THREE.RectAreaLight(0x2255bb, 0.15, 3.5, 5.0);
  fillLight.position.set(5.0, 0.5, 3.0);
  fillLight.lookAt(0, 0.5, 0);
  scene.add(fillLight);

  // ── RIM / BACK LIGHT: neutral cool, overhead-rear — edge separation
  const rimAreaLight = new THREE.RectAreaLight(0x7799cc, 0.12, 6.0, 1.8);
  rimAreaLight.position.set(0, 7.0, -4.5);
  rimAreaLight.lookAt(0, 0, 1);
  scene.add(rimAreaLight);

  // ── FLOOR BOUNCE: warm amber point from below — fills in under-shadows
  const groundGlow = new THREE.PointLight(0xb06010, 0.18, 12);
  groundGlow.position.set(0, -2.2, 2.5);
  scene.add(groundGlow);

  // ── ORBITING DYNAMIC LIGHT: warm amber point, animates — keeps metals alive
  const orbitLight = new THREE.PointLight(0xd4820a, 0.25, 20);
  orbitLight.castShadow = false; // VSM pass omitted — orbiting light shadow not visually significant; reduces GPU load during particle peaks
  const shadowRes = window.innerWidth < 768 ? 1024 : 2048;
  orbitLight.shadow.mapSize.width  = shadowRes;
  orbitLight.shadow.mapSize.height = shadowRes;
  orbitLight.shadow.radius = 4;  // VSM blur radius — wider = softer penumbra
  orbitLight.shadow.camera.near = 0.5;
  orbitLight.shadow.camera.far  = 22;
  orbitLight.shadow.bias = -0.0005;
  scene.add(orbitLight);

  // ── SAW SPOT: tight amber spotlight on saw blade apex
  const sawSpot = new THREE.SpotLight(0xffa040, 0.6, 14, Math.PI / 14, 0.45, 1.8);
  sawSpot.position.set(0.2, 5.0, 4.5);
  sawSpot.target.position.set(0, 2.2, -0.5);
  sawSpot.castShadow = true;
  sawSpot.shadow.mapSize.width  = shadowRes;
  sawSpot.shadow.mapSize.height = shadowRes;
  sawSpot.shadow.radius = 3;
  sawSpot.shadow.camera.near = 1;
  sawSpot.shadow.camera.far  = 16;
  sawSpot.shadow.bias = -0.0003;
  scene.add(sawSpot);
  scene.add(sawSpot.target);

  // ── VORTEX PARTICLE LIGHT: warm amber point that follows cursor vortex center ──
  // Gives tools physically correct illumination from the particle cloud
  const vortexLight = new THREE.PointLight(0xd4820a, 0, 10);
  vortexLight.position.set(0, 0, 1.5);
  scene.add(vortexLight);

  // ── SAW PARTICLE GLOW: orange light from spinning blade sparks / hub bloom ──
  const sawParticleGlow = new THREE.PointLight(0xff6600, 0, 8);
  scene.add(sawParticleGlow);

  // ── SPARK LIGHT: warm gold light from secondary particle system during turbulence ──
  const sparkLight = new THREE.PointLight(0xffcc66, 0, 8);
  scene.add(sparkLight);

  // ── CLOUD KEY LIGHT: wide-radius amber fill covering all 3 tools ──
  const cloudKeyLight = new THREE.PointLight(0xff9933, 0, 18);
  cloudKeyLight.position.set(0, 0.5, 2.0);
  scene.add(cloudKeyLight);

  // ── FLOOR RIM LIGHT: dramatic under-lighting burst on implosion ──
  const floorRimLight = new THREE.PointLight(0x4488cc, 0, 14);
  floorRimLight.position.set(0, -2.0, 1.5);
  scene.add(floorRimLight);

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
    envMapIntensity: 0.7,
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
    envMapIntensity: 0.8,
  });

  // Amber emissive — for saw blade hub and highlights
  const amberEmissiveMat = new THREE.MeshStandardMaterial({
    color: 0xff8800,
    roughness: 0.1,
    metalness: 0.0,
    emissive: new THREE.Color(0xff6600),
    emissiveIntensity: 1.4,   // bloom-safe sweet spot — hub glows hot amber, not blown white
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

  // Warm wood — hammer handle
  const woodMat = new THREE.MeshStandardMaterial({
    color: 0xc8952a,
    roughness: 0.85,
    metalness: 0.0,
    transparent: true,
    opacity: 1.0,
  });

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
  // Create ember-quality particle texture — 128px with corona ring for depth
  const particleCanvas = document.createElement('canvas');
  particleCanvas.width = particleCanvas.height = 128;
  const pCtx = particleCanvas.getContext('2d');
  const cx = 64, cy = 64, r = 62;

  const grad = pCtx.createRadialGradient(cx, cy, 0, cx, cy, r);
  grad.addColorStop(0,    'rgba(255,255,255,1.0)');  // white-hot core
  grad.addColorStop(0.08, 'rgba(255,230,140,0.95)'); // inner amber halo
  grad.addColorStop(0.25, 'rgba(255,170,50,0.70)');  // orange mid glow
  grad.addColorStop(0.55, 'rgba(220,100,20,0.28)');  // ember outer glow
  grad.addColorStop(1.0,  'rgba(180,60,5,0.00)');    // transparent edge
  pCtx.fillStyle = grad;
  pCtx.fillRect(0, 0, 128, 128);

  // Wider luminous corona ring — bloom-enhanced; broader halo makes particles read as light sources
  const ring = pCtx.createRadialGradient(cx, cy, r*0.25, cx, cy, r*0.65);
  ring.addColorStop(0,   'rgba(255,200,80,0.0)');
  ring.addColorStop(0.5, 'rgba(255,180,60,0.22)');
  ring.addColorStop(1,   'rgba(255,160,40,0.0)');
  pCtx.fillStyle = ring;
  pCtx.fillRect(0, 0, 128, 128);

  const particleTex = new THREE.CanvasTexture(particleCanvas);

  /* ─── Responsive particle counts ─────────────────────── */
  const isMobile = window.innerWidth < 768;
  const AMBER_COUNT = _isLowEnd ? 600  : (isMobile ? 1200 : 6000);  // Dense golden ember cloud
  const SPARK_COUNT = _isLowEnd ? 250  : (isMobile ? 500  : 2800);  // Warm gold secondary layer

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

  // Amber dust particles — main layer with per-particle vertex colors for temperature variation
  const amberSystem = createParticleSystem(AMBER_COUNT, 11);
  // Vertex colors: white-hot to red-orange based on per-particle temperature
  const amberColors = new Float32Array(AMBER_COUNT * 3);
  for (let i = 0; i < AMBER_COUNT; i++) {
    const temp = Math.random();
    amberColors[i*3]   = 1.0;
    amberColors[i*3+1] = 0.30 + temp * 0.40;
    amberColors[i*3+2] = temp * 0.15;
  }
  amberSystem.geo.setAttribute('color', new THREE.BufferAttribute(amberColors, 3));
  const amberParticleMat = new THREE.PointsMaterial({
    map: particleTex,
    color: 0xffffff, size: 0.060, sizeAttenuation: true,  // white base — vertex colors drive hue
    vertexColors: true,
    transparent: true, opacity: 0.60,
    blending: THREE.AdditiveBlending, depthWrite: false,
  });
  const amberParticles = new THREE.Points(amberSystem.geo, amberParticleMat);
  amberParticles.frustumCulled = false;
  scene.add(amberParticles);

  // DEBUG-TELEMETRY: expose particle positions for Playwright validation (removable)
  window.__particleSnapshot = () => Float32Array.from(amberSystem.positions);
  window.__vortexParams = () => ({ ...VORTEX_PARAMS });
  window.__sampleCanvasPixel = (x, y) => {
    const gl = renderer.getContext();
    const buf = new Uint8Array(4);
    gl.readPixels(x, gl.drawingBufferHeight - y, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, buf);
    return { r: buf[0], g: buf[1], b: buf[2], a: buf[3] };
  };

  // Blue-white spark particles — secondary layer, smaller, brighter
  const sparkSystem = createParticleSystem(SPARK_COUNT, 6);
  const sparkMat = new THREE.PointsMaterial({
    map: particleTex,
    color: 0xffeedd, size: 0.045, sizeAttenuation: true,
    transparent: true, opacity: 0.72,
    blending: THREE.AdditiveBlending, depthWrite: false,
  });
  const sparkParticles = new THREE.Points(sparkSystem.geo, sparkMat);
  sparkParticles.frustumCulled = false;
  scene.add(sparkParticles);

  // Fine sand haze — ultra-small particles at high count, fills the volume with luminous mist
  const HAZE_COUNT = _isLowEnd ? 400 : (isMobile ? 800 : 4000);
  const hazeSystem = createParticleSystem(HAZE_COUNT, 18);  // wider spread than other layers
  const hazeMat = new THREE.PointsMaterial({
    map: particleTex,
    color: 0xaa9977, size: 0.045, sizeAttenuation: true,  // warm taupe — blends with amber palette, not blue
    transparent: true, opacity: 0.42,
    blending: THREE.AdditiveBlending, depthWrite: false,
  });
  const hazeParticles = new THREE.Points(hazeSystem.geo, hazeMat);
  hazeParticles.frustumCulled = false;
  scene.add(hazeParticles);

  /* ─── Vortex physics parameters ──────────────────────── */
  const VORTEX_PARAMS = {
    vortexRadius: 7.0,          // Wide cursor influence — more particles feel the cursor, better interaction
    coreRadius: 1.8,            // Wide dead zone — equilibrium ring is large and loose, not a tight halo
    tangentialStrength: 0.0042, // Spiral force — raised for visible ambient swirl at rest
    radialStrength: 0.00075,    // Balanced pull — competes with scene pressure, doesn't dominate
    coreStrength: 0.005,        // Soft core bounce — light spring effect at center
    entropyStrength: 0.00055,   // ~0.73× radialStrength — entropy and pull roughly equal, no ring forms
    upwardDrift: 0.00085,       // Moderate convection — embers rise slowly, center stays populated
    damping: 0.960,             // Heavy drag — particles barely coast, linger like embers
    velocityCap: 0.18,          // Allows shockwave blast, implosion snap; physics damping controls decay
    shockwaveRadius: 4.5,       // Click blast radius
    shockwaveImpulse: 0.45,     // Outward impulse strength on click
    implosionStrength: 0.14,    // Crisp rubber-band snap-back; matches raised velocityCap
    implosionDelay: 0.05,       // Fraction of implosion duration before pull starts (snappier)
    boundaryTop: 8.0,
    boundaryBottom: -6.5,
    // ── Mouse-driven physics fields ──
    centerX: 0, centerY: 0, centerZ: 0,   // Moveable vortex center (lerps to cursor)
    mouseVelocityX: 0, mouseVelocityY: 0,  // EMA-smoothed mouse velocity (NDC/frame)
    turbulenceMode: 0,                      // 0=gravity well, 1=thermal scatter
    velocityThreshold: 0.020,               // Raised — micro-jitter no longer triggers turbulence
    turbulenceStrength: 0.014,              // Stronger scatter — visceral cursor interaction
    thermalDamping: 0.970,                  // Looser damping when turbulent
    proximityTool: null,                    // 'hammer'|'wrench'|'saw'|null
    proximityStrength: 0,                   // 0–1 smooth blend
    reverseGravity: false,                  // Right-click: all particles flee cursor
    // ── Directional wind (mouse-velocity aligned force) ──
    windStrength: 0.020,                    // stronger directional wind — particles trail cursor visibly
    baseWindStrength: 0.020,               // reset target for windStrength after drag boost
    windZBias: 0.55,                        // fraction of z-scatter aligned to mouse direction
    // ── Saw aerodynamic induction ──
    sawInductionStrength: 0.0012,           // tangential circulation per unit speedRatio — subtle stir
    sawInductionRadius: 2.2,              // smaller zone — saw stirs but doesn't dominate
    sawWorldX: 0, sawWorldY: 0, sawWorldZ: 0, // saw position — updated each frame
    sawSpeedRatio: 0,                       // 0–1 saw speed — updated each frame
    // ── Ambient breathing pulse ──
    breatheAmplitude: 0.0006,              // ±33% modulation of radialStrength
    breathePeriod: 4000,                   // ms per complete breath cycle
  };

  /* ─── Vortex physics update ──────────────────────────── */
  function updateVortexPhysics(system, mouseWorldPos, delta) {
    const pos = system.positions;
    const vel = system.velocities;
    const count = system.count;

    // Read moveable center (lerped toward cursor by updateMousePhysics)
    const cx = VORTEX_PARAMS.centerX;
    const cy = VORTEX_PARAMS.centerY;
    const cz = VORTEX_PARAMS.centerZ;

    const turbBlend = VORTEX_PARAMS.turbulenceMode;          // 0..1
    const isTurbulent = turbBlend > 0.3;
    const gravSign = VORTEX_PARAMS.reverseGravity ? -1.0 : 1.0;
    const proxTool = VORTEX_PARAMS.proximityTool;
    const proxStr  = VORTEX_PARAMS.proximityStrength;

    // Dynamic damping: blend toward looser thermalDamping when turbulent
    const effectiveDamping = VORTEX_PARAMS.damping + (VORTEX_PARAMS.thermalDamping - VORTEX_PARAMS.damping) * turbBlend;

    // Wind direction: unit vector along mouse velocity (used in turbulence branch)
    const velMag = Math.sqrt(VORTEX_PARAMS.mouseVelocityX ** 2 + VORTEX_PARAMS.mouseVelocityY ** 2);
    const windDirX = velMag > 0.0001 ? VORTEX_PARAMS.mouseVelocityX / velMag : 0;
    const windDirY = velMag > 0.0001 ? VORTEX_PARAMS.mouseVelocityY / velMag : 0;
    const windDirZ = windDirX * 0.4;  // depth component: rightward motion → slight backward push

    for (let i = 0; i < count; i++) {
      const ix = i * 3, iy = i * 3 + 1, iz = i * 3 + 2;
      let px = pos[ix], py = pos[iy], pz = pos[iz];
      let vx = vel[ix], vy = vel[iy], vz = vel[iz];

      const dx = px - cx;
      const dy = py - cy;
      const dz = pz - cz;
      const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

      if (dist < VORTEX_PARAMS.vortexRadius && dist > 0.01) {
        const normDist = dist / VORTEX_PARAMS.vortexRadius;

        if (!isTurbulent) {
          // ── GRAVITY WELL: spiral inward toward cursor ──
          const tx = -dz / dist;
          const tz =  dx / dist;
          // Tangential force scaled by turbBlend — zero at rest, full when mouse is moving
          // This prevents the spiral orbit ring from forming when the cursor is stationary
          const tangentialForce = VORTEX_PARAMS.tangentialStrength * (1.0 - normDist * 0.6) * (0.35 + turbBlend * 0.65);
          vx += tx * tangentialForce;
          vz += tz * tangentialForce;

          // Core repulsion: invert force inside equilibrium radius — creates orbital ring not collapsed point
          const equilibriumRadius = VORTEX_PARAMS.coreRadius * 2.0;
          let radialForce;
          if (dist < VORTEX_PARAMS.coreRadius) {
            // Inside core: strong outward push — particles bounce off the center
            radialForce = -VORTEX_PARAMS.coreStrength * (1.0 - dist / VORTEX_PARAMS.coreRadius);
          } else if (dist < equilibriumRadius) {
            // Transition zone: blend from repulsion to gentle attraction
            const t = (dist - VORTEX_PARAMS.coreRadius) / (equilibriumRadius - VORTEX_PARAMS.coreRadius);
            radialForce = VORTEX_PARAMS.coreStrength * 0.3 * (t * 2.0 - 1.0);
          } else {
            // Outer vortex: gentle inward pull that fades at radius edge
            radialForce = VORTEX_PARAMS.radialStrength * (1.0 - normDist);
          }
          vx -= (dx / dist) * radialForce * gravSign;
          vy -= (dy / dist) * radialForce * gravSign;
          vz -= (dz / dist) * radialForce * gravSign;
        } else {
          // ── THERMAL TURBULENCE: directional scatter — particles trail cursor motion ──
          const scatterX = VORTEX_PARAMS.mouseVelocityX * 5.5;
          const scatterY = VORTEX_PARAMS.mouseVelocityY * -3.0;
          const falloff = 1.0 - normDist;
          vx += scatterX * VORTEX_PARAMS.turbulenceStrength * falloff;
          vy += scatterY * VORTEX_PARAMS.turbulenceStrength * falloff;
          // Directional wind boost — pushes particles in the cursor's travel direction
          vx += windDirX * velMag * 80.0 * VORTEX_PARAMS.windStrength * falloff;
          vy += windDirY * velMag * 80.0 * VORTEX_PARAMS.windStrength * falloff;
          // 70/30 directional jitter — streak along mouse axis, not symmetric blob
          const jitterMag = VORTEX_PARAMS.turbulenceStrength * 0.8 * falloff;
          const jitterAlong = (Math.random() - 0.5) * jitterMag;
          vx += windDirX * jitterAlong * 0.70 + (Math.random() - 0.5) * jitterMag * 0.30;
          vy += windDirY * jitterAlong * 0.70 + (Math.random() - 0.5) * jitterMag * 0.30;
          vz += windDirZ * jitterAlong * 0.70 + (Math.random() - 0.5) * jitterMag * 0.15;
          // Outward wind pressure — fast cursor movement pushes particles away like disturbing sand
          const outwardForce = velMag * 0.010 * falloff;
          vx += (dx / dist) * outwardForce;
          vy += (dy / dist) * outwardForce;
        }

        // ── TOOL PROXIMITY PHYSICS: each tool has a distinct force signature ──
        if (proxTool !== null && proxStr > 0.05) {
          const falloff = 1.0 - normDist;
          if (proxTool === 'hammer') {
            // "Nail driving" — strong downward column, particles pile up below hammer
            const horzDist = Math.sqrt(dx * dx + dz * dz);
            if (horzDist < 2.0) {
              const colFalloff = (1.0 - horzDist / 2.0) * falloff;
              vy -= 0.0040 * colFalloff * proxStr;  // Stronger downward pull
              vx -= (dx / Math.max(dist, 0.1)) * 0.0010 * colFalloff * proxStr;
              vz -= (dz / Math.max(dist, 0.1)) * 0.0010 * colFalloff * proxStr;
            }
          } else if (proxTool === 'wrench') {
            // "Tightening" — tight vortex spiral that really grabs particles, high tangential
            const tx = -dz / dist;
            const tz =  dx / dist;
            vx += tx * VORTEX_PARAMS.tangentialStrength * 7.0 * falloff * proxStr;
            vz += tz * VORTEX_PARAMS.tangentialStrength * 7.0 * falloff * proxStr;
            vx -= (dx / dist) * VORTEX_PARAMS.coreStrength * 3.5 * proxStr;
            vz -= (dz / dist) * VORTEX_PARAMS.coreStrength * 3.5 * proxStr;
          } else if (proxTool === 'saw') {
            // "Cutting" — strong fan scatter radiating outward from blade center
            const arcAngle = Math.atan2(dz, dx);
            const fanForce = 0.0045 * falloff * proxStr;  // Stronger scatter
            vx += Math.cos(arcAngle) * fanForce;
            vz += Math.sin(arcAngle) * fanForce;
            vy *= 0.95;  // Harder suppression — saw keeps things horizontal
          }
        }

        // ── SAW INDUCTION: spinning blade creates tangential air circulation ──
        if (VORTEX_PARAMS.sawSpeedRatio > 0.15) {
          const sdx = px - VORTEX_PARAMS.sawWorldX;
          const sdz = pz - VORTEX_PARAMS.sawWorldZ;
          const sawDist = Math.sqrt(sdx * sdx + sdz * sdz);
          if (sawDist > 0.05 && sawDist < VORTEX_PARAMS.sawInductionRadius) {
            const sawFalloff = 1.0 - (sawDist / VORTEX_PARAMS.sawInductionRadius);
            const stx = -sdz / sawDist;
            const stz =  sdx / sawDist;
            const induction = VORTEX_PARAMS.sawInductionStrength * VORTEX_PARAMS.sawSpeedRatio * sawFalloff;
            vx += stx * induction;
            vz += stz * induction;
          }
        }
      }

      // Upward drift + gentle lateral desert wind (always active)
      vy += VORTEX_PARAMS.upwardDrift;
      vx += 0.00008;  // slow persistent drift — desert breeze pushes dust rightward

      // ── ENTROPY: per-particle random walk — prevents static equilibrium, keeps cloud alive ──
      // Applied to ALL particles every frame regardless of vortex distance
      // Strength (0.00085) is ~2× radialStrength — entropy WINS over attraction, breaking orbits
      const entropyScale = VORTEX_PARAMS.entropyStrength;
      vx += (Math.random() - 0.5) * entropyScale;
      vy += (Math.random() - 0.5) * entropyScale * 0.6;  // less vertical entropy — embers mostly drift up
      vz += (Math.random() - 0.5) * entropyScale * 0.4;  // minimal depth entropy

      // ── SCENE PRESSURE: gentle push away from world origin — prevents cloud from re-collapsing ──
      // Half strength from before — nudge not push, center stays populated
      vx += px * 0.000040;
      vy += py * 0.000018;

      // Dynamic damping
      vx *= effectiveDamping;
      vy *= effectiveDamping;
      vz *= effectiveDamping;

      // ── Z-GRAVITY: restore deep-background particles toward foreground ──
      if (pz < -2.0) { vz += (-2.0 - pz) * 0.00018; }
      if (pz >  2.5) { vz -= (pz - 2.5) * 0.00009; }

      // Velocity magnitude cap
      const vmag = Math.sqrt(vx * vx + vy * vy + vz * vz);
      if (vmag > VORTEX_PARAMS.velocityCap) {
        const scale = VORTEX_PARAMS.velocityCap / vmag;
        vx *= scale; vy *= scale; vz *= scale;
      }

      // Position update
      px += vx; py += vy; pz += vz;

      // Boundary recycling
      if (py > VORTEX_PARAMS.boundaryTop || py < VORTEX_PARAMS.boundaryBottom) {
        px = (Math.random() - 0.5) * 22;
        py = VORTEX_PARAMS.boundaryBottom + Math.random() * 2.5;
        pz = (Math.random() - 0.5) * 22;
        vx = 0; vy = 0; vz = 0;
      }

      pos[ix] = px; pos[iy] = py; pos[iz] = pz;
      vel[ix] = vx; vel[iy] = vy; vel[iz] = vz;
    }
    system.geo.attributes.position.needsUpdate = true;
  }

  /* ─── Vortex shockwave (click blast) ─────────────────── */
  function applyVortexShockwave(system, clickWorldPos) {
    const pos = system.positions;
    const vel = system.velocities;
    for (let i = 0; i < system.count; i++) {
      const ix = i * 3, iy = i * 3 + 1, iz = i * 3 + 2;
      const dx = pos[ix] - clickWorldPos.x;
      const dy = pos[iy] - clickWorldPos.y;
      const dz = pos[iz] - clickWorldPos.z;
      const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
      if (dist < VORTEX_PARAMS.shockwaveRadius && dist > 0.01) {
        const impulse = VORTEX_PARAMS.shockwaveImpulse * (1 - dist / VORTEX_PARAMS.shockwaveRadius);
        vel[ix] += (dx / dist) * impulse;
        vel[iy] += (dy / dist) * impulse;
        vel[iz] += (dz / dist) * impulse;
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

// Additive vortex glow plane — billboard at vortex origin creates "light volume" illusion
const vortexGlowPlane = new THREE.Mesh(
  new THREE.PlaneGeometry(6.0, 6.0),
  new THREE.MeshBasicMaterial({
    color: 0x331100, transparent: true, opacity: 0.0,
    blending: THREE.AdditiveBlending, depthWrite: false, depthTest: false,
  })
);
vortexGlowPlane.renderOrder = 999;
scene.add(vortexGlowPlane);

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

  /* ─── Framing Hammer ─────────────────────────────────────── */
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

  // ── Handle — long tapered cylinder (wood)
  addHammerPart(
    new THREE.CylinderGeometry(0.055, 0.090, 2.20, 12),
    woodMat.clone(), 0, -0.85, 0, 0, -1.4, 0.3
  );

  // ── Grip wrap rings (8×) — dark bands showing grip texture
  for (let g = 0; g < 8; g++) {
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(0.100, 0.008, 6, 16),
      new THREE.MeshStandardMaterial({ color: 0x0f0d0a, roughness: 0.88, metalness: 0.15 })
    );
    ring.castShadow = true;
    ring.rotation.x = Math.PI / 2;
    ring.position.set(0, -1.30 - g * 0.07, 0);
    hammerGroup.add(ring);
  }

  // ── Head body — large rectangular steel block
  addHammerPart(
    new THREE.BoxGeometry(1.20, 0.42, 0.38),
    steelMat.clone(), 0, 0.55, 0, 0, 1.0, 0.4
  );

  // ── Face strike plate — flat disc on front face of head
  addHammerPart(
    new THREE.BoxGeometry(0.42, 0.42, 0.025),
    chromeMat.clone(), 0.60, 0.55, 0, 1.0, 0.8, 0.5
  );

  // ── Poll (rear flat face of head)
  addHammerPart(
    new THREE.BoxGeometry(0.18, 0.38, 0.34),
    steelMat.clone(), -0.68, 0.55, 0, -1.0, 0.8, 0.4
  );

  // ── Claw — two diverging prongs from rear of head
  // Left prong
  const clawL = new THREE.Mesh(
    new THREE.BoxGeometry(0.10, 0.38, 0.055),
    steelMat.clone()
  );
  clawL.castShadow = true;
  clawL.position.set(-0.72, 0.62, 0.11);
  clawL.rotation.z = -0.32;
  hammerGroup.add(clawL);
  registerPart(clawL, -1.2, 1.0, 0.5, hammerParts);

  // Right prong
  const clawR = new THREE.Mesh(
    new THREE.BoxGeometry(0.10, 0.38, 0.055),
    steelMat.clone()
  );
  clawR.castShadow = true;
  clawR.position.set(-0.72, 0.62, -0.11);
  clawR.rotation.z = -0.32;
  hammerGroup.add(clawR);
  registerPart(clawR, -1.2, 1.0, -0.5, hammerParts);

  // ── Neck — steel cylinder connecting handle to head
  addHammerPart(
    new THREE.CylinderGeometry(0.068, 0.068, 0.28, 10),
    steelMat.clone(), 0, 0.23, 0, 0, 0.5, 0.2
  );

  // ── Amber accent bevel on top of head — catches key light
  addHammerPart(
    new THREE.BoxGeometry(1.22, 0.030, 0.40),
    new THREE.MeshStandardMaterial({ color: 0xe8a040, roughness: 0.10, metalness: 0.95, transparent: true, opacity: 1.0 }),
    0, 0.77, 0, 0, 1.2, 0.4
  );

  // ── Raycasting bounds
  const hammerBounds = new THREE.Mesh(
    new THREE.BoxGeometry(1.6, 2.6, 0.6),
    new THREE.MeshBasicMaterial({ visible: false })
  );
  hammerBounds.userData.toolId = 'hammer';
  hammerGroup.add(hammerBounds);

  hammerGroup.rotation.z = 0.22;
  hammerGroup.rotation.y = -0.55;
  scene.add(hammerGroup);

  /* ─── All tool groups for traversal (wrench+saw parts pushed in after GLB load) ── */
  const allToolParts = [...hammerParts];

  /* ─── Wrench + Saw groups (populated after GLB load) ────── */
  const wrenchGroup = new THREE.Group();
  const wrenchParts = [];
  wrenchGroup.rotation.z = -0.15;
  wrenchGroup.rotation.y = 0.60;
  wrenchGroup.visible = false;  // hidden until GLB/procedural content is loaded
  scene.add(wrenchGroup);

  const sawGroup = new THREE.Group();
  const sawParts = [];
  let sawSpinGroup = null;      // assigned in buildProceduralSaw or populateSawFromGLB
  let hubGlowMat = null;        // referenced in animate loop for opacity pulse
  let hubCoronaMat = null;
  let bladeMat = null;          // hoisted for envMapIntensity pulse in animate
  let glbSawLoaded = false;     // true when handsaw GLB loaded; disables blade spin + hub glow
  // sawGroup.rotation.x set by populateSawFromGLB (handsaw) or buildProceduralSaw (blade)
  sawGroup.position.set(0, 2.2, -0.5);
  sawGroup.userData.baseSawSpeed = 0.008;
  sawGroup.userData.maxSawSpeed  = 0.045;
  sawGroup.visible = false;  // hidden until GLB/procedural content is loaded
  scene.add(sawGroup);

  /* ─── Procedural fallback builders ───────────────────── */
  function buildProceduralWrench() {
    function addWrenchPart(geo, mat, px, py, pz, sx, sy, sz) {
      const mesh = new THREE.Mesh(geo, mat);
      mesh.castShadow = true;
      mesh.position.set(px, py, pz);
      wrenchGroup.add(mesh);
      registerPart(mesh, sx, sy, sz, wrenchParts);
      return mesh;
    }

    // ── Handle — long tapered cylinder (chrome steel)
    addWrenchPart(
      new THREE.CylinderGeometry(0.095, 0.130, 2.50, 16),
      steelMat.clone(), 0, -0.70, 0, 0, -1.6, 0.3
    );

    // ── Knurl rings on handle (5×)
    for (let k = 0; k < 5; k++) {
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(0.140, 0.009, 6, 16),
        new THREE.MeshStandardMaterial({ color: 0x3a3830, roughness: 0.55, metalness: 0.92 })
      );
      ring.castShadow = true;
      ring.rotation.x = Math.PI / 2;
      ring.position.set(0, -1.20 - k * 0.10, 0);
      wrenchGroup.add(ring);
    }

    // ── Jaw body (throat connecting handle to jaws)
    addWrenchPart(
      new THREE.BoxGeometry(0.55, 0.20, 0.16),
      steelMat.clone(), 0, 0.65, 0, 0, 0.8, 0.3
    );

    // ── Fixed jaw arm (upper — top of the C)
    addWrenchPart(
      new THREE.BoxGeometry(0.20, 0.65, 0.16),
      steelMat.clone(), 0.30, 1.02, 0, 0.8, 1.0, 0.4
    );

    // ── Movable jaw arm (lower — bottom of the C)
    addWrenchPart(
      new THREE.BoxGeometry(0.20, 0.55, 0.16),
      steelMat.clone(), 0.30, 0.28, 0, 0.8, -0.5, 0.4
    );

    // ── Jaw opening gap indicator
    const jawGap = new THREE.Mesh(
      new THREE.BoxGeometry(0.28, 0.32, 0.18),
      new THREE.MeshStandardMaterial({ color: 0x030303, roughness: 1.0, metalness: 0.0 })
    );
    jawGap.position.set(0.46, 0.65, 0);
    wrenchGroup.add(jawGap);

    // ── Worm adjuster — cylinder perpendicular to handle at jaw base
    const wormAdj = new THREE.Mesh(
      new THREE.CylinderGeometry(0.065, 0.065, 0.34, 14),
      new THREE.MeshStandardMaterial({ color: 0xc8c0a0, roughness: 0.06, metalness: 0.97 })
    );
    wormAdj.castShadow = true;
    wormAdj.rotation.z = Math.PI / 2;
    wormAdj.position.set(0, 0.40, 0);
    wrenchGroup.add(wormAdj);
    registerPart(wormAdj, 0.5, -0.3, 0.5, wrenchParts);

    // Adjuster knurl rings (3×)
    for (let a = 0; a < 3; a++) {
      const ar = new THREE.Mesh(
        new THREE.TorusGeometry(0.068, 0.007, 6, 14),
        new THREE.MeshStandardMaterial({ color: 0x2a2820, roughness: 0.55, metalness: 0.90 })
      );
      ar.rotation.x = Math.PI / 2;
      ar.position.set(-0.06 + a * 0.06, 0.40, 0);
      wrenchGroup.add(ar);
    }

    // ── Amber accent line on handle
    addWrenchPart(
      new THREE.BoxGeometry(0.020, 1.60, 0.14),
      new THREE.MeshStandardMaterial({ color: 0xe8a040, roughness: 0.10, metalness: 0.95, transparent: true, opacity: 1.0 }),
      0.098, -0.50, 0, 0.5, -1.0, 0.3
    );

    // ── Raycasting bounds
    const wrenchBounds = new THREE.Mesh(
      new THREE.BoxGeometry(0.8, 2.8, 0.4),
      new THREE.MeshBasicMaterial({ visible: false })
    );
    wrenchBounds.userData.toolId = 'wrench';
    wrenchGroup.add(wrenchBounds);

    wrenchParts.forEach(m => allToolParts.push(m));
    wrenchGroup.visible = true;
  }

  function buildProceduralSaw() {
    sawGroup.rotation.x = Math.PI / 2;  // tilt flat blade to face camera
    sawSpinGroup = new THREE.Group();
    sawGroup.add(sawSpinGroup);

    function addSawPart(geo, mat, px, py, pz, sx, sy, sz) {
      const mesh = new THREE.Mesh(geo, mat);
      mesh.castShadow = true;
      mesh.position.set(px, py, pz);
      sawSpinGroup.add(mesh);
      registerPart(mesh, sx, sy, sz, sawParts);
      return mesh;
    }

    // Blade disc — MeshPhysicalMaterial with clearcoat for Fresnel rim brightening during spin
    bladeMat = new THREE.MeshPhysicalMaterial({
      color: 0x7a7a7a,          // slightly darker steel — prevents luminance clip
      roughness: 0.30,          // was 0.18 — further scatter breaks hotspot
      metalness: 0.92,
      envMapIntensity: 0.8,     // was 1.2 — reduce reflection contribution
      clearcoat: 0.35,          // was 0.5 — smaller secondary specular lobe
      clearcoatRoughness: 0.20, // was 0.12 — wider scatter
      reflectivity: 0.70,       // was 0.85
    });
    addSawPart(
      new THREE.CylinderGeometry(0.88, 0.88, 0.055, 48),
      bladeMat, 0, 0, 0, 0, 0.6, 0.4
    );

    // Inner relief cutouts
    for (let i = 0; i < 5; i++) {
      const angle = (i / 5) * Math.PI * 2;
      const slotMesh = new THREE.Mesh(
        new THREE.CylinderGeometry(0.09, 0.09, 0.06, 12),
        new THREE.MeshStandardMaterial({ color: 0x080808, roughness: 0.9, metalness: 0.1 })
      );
      slotMesh.position.set(Math.cos(angle) * 0.55, 0, Math.sin(angle) * 0.55);
      sawSpinGroup.add(slotMesh);
    }

    // 24 teeth
    const TOOTH_COUNT = 24;
    for (let t = 0; t < TOOTH_COUNT; t++) {
      const angle = (t / TOOTH_COUNT) * Math.PI * 2;
      const cosA = Math.cos(angle), sinA = Math.sin(angle);
      const toothMat = (t % 3 === 0)
        ? new THREE.MeshStandardMaterial({ color: 0x9a8060, roughness: 0.12, metalness: 0.88 })
        : chromeMat.clone();

      const base = new THREE.Mesh(new THREE.BoxGeometry(0.065, 0.07, 0.058), toothMat);
      base.castShadow = true;
      const r = 0.91;
      base.position.set(cosA * r, 0, sinA * r);
      base.rotation.y = -angle;
      sawSpinGroup.add(base);

      const tip = new THREE.Mesh(new THREE.BoxGeometry(0.038, 0.055, 0.048), toothMat);
      tip.castShadow = true;
      tip.position.set(cosA * (r + 0.058), 0, sinA * (r + 0.058));
      tip.rotation.y = -angle;
      sawSpinGroup.add(tip);
    }

    // Hub — emissive amber center disc
    addSawPart(
      new THREE.CylinderGeometry(0.18, 0.18, 0.07, 24),
      amberEmissiveMat.clone(), 0, 0, 0, 0, 0.3, 0.2
    );

    // Arbor hole
    const arborMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(0.045, 0.045, 0.08, 12),
      new THREE.MeshStandardMaterial({ color: 0x020202, roughness: 1.0, metalness: 0.0 })
    );
    sawSpinGroup.add(arborMesh);

    // Hub bloom sprites
    hubGlowMat = new THREE.SpriteMaterial({
      map: particleTex, color: 0xff7700,
      transparent: true, opacity: 0.40,
      blending: THREE.AdditiveBlending, depthWrite: false,
    });
    const hubGlowSprite = new THREE.Sprite(hubGlowMat);
    hubGlowSprite.scale.set(0.90, 0.90, 1.0);
    hubGlowSprite.position.set(0, 0, 0);
    sawGroup.add(hubGlowSprite);

    hubCoronaMat = new THREE.SpriteMaterial({
      map: particleTex, color: 0xff5500,
      transparent: true, opacity: 0.18,
      blending: THREE.AdditiveBlending, depthWrite: false,
    });
    const hubCorona = new THREE.Sprite(hubCoronaMat);
    hubCorona.scale.set(1.6, 1.6, 1.0);
    sawGroup.add(hubCorona);

    // Invisible bounds for raycasting
    const sawBounds = new THREE.Mesh(
      new THREE.CylinderGeometry(1.1, 1.1, 0.2, 16),
      new THREE.MeshBasicMaterial({ visible: false })
    );
    sawBounds.userData.toolId = 'saw';
    sawGroup.add(sawBounds);

    sawParts.forEach(m => allToolParts.push(m));
    sawGroup.visible = true;
  }

  /* ─── GLB loaders ─────────────────────────────────────── */
  function registerGLBPart(mesh, partsArr) {
    const rest = mesh.position.clone();
    mesh.userData.restPos = rest;
    mesh.userData.spreadPos = rest.clone().add(
      new THREE.Vector3((Math.random() - 0.5) * 2, (Math.random() - 0.5) * 2.5, (Math.random() - 0.5) * 1)
    );
    mesh.userData.spreadRot = { x: Math.random() * Math.PI, y: Math.random() * Math.PI, z: 0 };
    mesh.userData.assemblyDelay = Math.random() * 800;
    mesh.position.copy(mesh.userData.spreadPos);
    partsArr.push(mesh);
    allToolParts.push(mesh);
  }

  function _addGLBToGroup(gltf, targetGroup, partsList, targetSize) {
    const model = gltf.scene;

    // Scale to fit targetSize in the largest dimension
    const box = new THREE.Box3().setFromObject(model);
    const size = box.getSize(new THREE.Vector3());
    model.scale.setScalar(targetSize / Math.max(size.x, size.y, size.z));

    // Center the model within the group (offset from bounding box center)
    box.setFromObject(model);
    const center = box.getCenter(new THREE.Vector3());
    model.position.sub(center);   // shifts model so its center sits at group origin

    // Enable shadows; hide LOD duplicates exported from modelling software
    model.traverse(obj => {
      if (!obj.isMesh) return;
      if (/_lod[1-9]|_low|_duplicate|_copy/i.test(obj.name)) {
        obj.visible = false;
        return;
      }
      obj.castShadow = true;
      obj.receiveShadow = true;
    });

    // Treat the whole model as one assembly part.
    // restPos = (0,0,0) relative to group — the model is centered there.
    model.userData.restPos = new THREE.Vector3(0, 0, 0);
    model.userData.spreadPos = new THREE.Vector3(
      (Math.random() - 0.5) * 3,
      (Math.random() - 0.5) * 3,
      (Math.random() - 0.5) * 1.5
    );
    model.userData.spreadRot = { x: Math.random() * Math.PI, y: Math.random() * Math.PI, z: 0 };
    model.userData.assemblyDelay = Math.random() * 400;
    model.position.copy(model.userData.spreadPos);

    targetGroup.add(model);
    partsList.push(model);
    allToolParts.push(model);
  }

  function populateWrenchFromGLB(gltf) {
    _addGLBToGroup(gltf, wrenchGroup, wrenchParts, 2.2);
    wrenchGroup.visible = true;

    const bounds = new THREE.Mesh(
      new THREE.BoxGeometry(1.2, 2.5, 0.6),
      new THREE.MeshBasicMaterial({ visible: false })
    );
    bounds.userData.toolId = 'wrench';
    wrenchGroup.add(bounds);
  }

  function populateSawFromGLB(gltf) {
    _addGLBToGroup(gltf, sawGroup, sawParts, 2.0);
    sawGroup.visible = true;

    // Handsaw sits upright — no PI/2 blade tilt, slight lean for visual interest
    sawGroup.rotation.x = 0;
    sawGroup.rotation.z = 0.2;

    const bounds = new THREE.Mesh(
      new THREE.BoxGeometry(2.5, 1.0, 0.3),
      new THREE.MeshBasicMaterial({ visible: false })
    );
    bounds.userData.toolId = 'saw';
    sawGroup.add(bounds);

    glbSawLoaded = true;
  }

  function loadGLBModels() {
    const loader = new THREE.GLTFLoader();
    let loaded = 0;
    const total = 2;
    const load = url => new Promise((res, rej) => loader.load(url, (gltf) => {
      loaded++;
      window.__preloaderProgress?.(Math.round((loaded / total) * 90)); // 0–90%, leave 10% for fonts
      res(gltf);
    }, undefined, rej));
    window.__preloaderProgress?.(10); // signal start
    return Promise.all([
      load('assets/models/pipe-wrench.glb'),
      load('assets/models/handsaw.glb'),
    ]).then(([wrenchGltf, sawGltf]) => {
      populateWrenchFromGLB(wrenchGltf);
      populateSawFromGLB(sawGltf);
    });
  }


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
      title: 'FRAMING HAMMER', sub: '20 oz Milled Face',
      desc: 'Framing · Demolition\nNailing · Forming',
      hint: '[H] panel  ·  drag to spin  ·  dbl-click burst',
      specs: { Weight: '20 oz', Handle: 'Hickory', Face: 'Milled', Length: '16 in' },
      apps: ['Framing & Demolition', 'Nailing & Forming'],
      cta: 'Get a Quote',
    },
    wrench: {
      title: 'ADJUSTABLE WRENCH', sub: '12" Chrome-Plated',
      desc: 'Fastening · Plumbing\nRepair · Installation',
      hint: '[W] panel  ·  drag to spin  ·  dbl-click burst',
      specs: { Length: '12 in', Jaw: '35 mm max', Material: 'Chrome Steel', Finish: 'Polished' },
      apps: ['Fastening & Plumbing', 'Repair & Installation'],
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

  // Vortex implosion state (click shockwave → delayed pull-back)
  let implosionActive = false;
  let implosionStart = 0;
  let clickWorldPos = { x: 0, y: 0, z: 0 };
  const IMPLOSION_DURATION = 1200;
  function easeOut(t) { return 1 - Math.pow(1 - t, 3); }
  // Spring easing for assembly — underdamped: ~12% overshoot, parts snap together with mechanical weight
  function easeOutSpring(t) {
    const decay = Math.exp(-6.5 * t);
    return 1 - decay * Math.cos(Math.PI * 2.2 * t);
  }

  /* ─── Idle rotation accumulators + drag inertia ──────── */
  let hammerIdleY = 0;
  let wrenchIdleY = 0;
  const inertia = { hammer: 0, wrench: 0, saw: 0 };

  /* ─── Mouse tracking ──────────────────────────────────── */
  let mouseX = 0, mouseY = 0;
  let rawMouseX = 0, rawMouseY = 0;
  let targetRotX = 0, targetRotY = 0;
  // Velocity tracking for turbulence physics
  let prevMouseX = 0, prevMouseY = 0;
  let smoothVelX = 0, smoothVelY = 0;
  let reverseGravityTimer = null;

  window.addEventListener('mousemove', (e) => {
    rawMouseX = e.clientX;
    rawMouseY = e.clientY;
    mouseX = (e.clientX / window.innerWidth)  * 2 - 1;
    mouseY = (e.clientY / window.innerHeight) * 2 - 1;
    // Cubic parallax: low sensitivity at center, pronounced tilt at viewport edges
    targetRotY =  (mouseX * mouseX * mouseX) * 0.12;
    targetRotX = -(mouseY * mouseY * mouseY) * 0.10;

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
      if (id !== hoveredTool) {
        emitRipple(id); // ripple on enter
      }
      hoveredTool = id;
      canvas.style.cursor = 'pointer';
      showTooltip(id, rawMouseX, rawMouseY);
    } else {
      if (hoveredTool !== null) {
        // Clear proximity physics on hover exit (strength lerps back to 0)
        VORTEX_PARAMS.proximityTool = null;
      }
      hoveredTool = null;
      canvas.style.cursor = 'default';
      hideTooltip();
    }
  });

  /* ─── Touch interaction for mobile ─────────────────────── */
  let prevPinchDist = null;
  let longPressTimer = null;
  let swipeStartX = null, swipeStartY = null;

  canvas.addEventListener('touchstart', (e) => {
    if (e.touches.length === 1) {
      swipeStartX = e.touches[0].clientX;
      swipeStartY = e.touches[0].clientY;
      // Long-press (600ms) → reverse gravity
      longPressTimer = setTimeout(() => {
        VORTEX_PARAMS.reverseGravity = true;
        clearTimeout(reverseGravityTimer);
        reverseGravityTimer = setTimeout(() => { VORTEX_PARAMS.reverseGravity = false; }, 2500);
      }, 600);
    } else if (e.touches.length === 2) {
      clearTimeout(longPressTimer);
      const t0 = e.touches[0], t1 = e.touches[1];
      prevPinchDist = Math.hypot(t1.clientX - t0.clientX, t1.clientY - t0.clientY);
    }
  }, { passive: true });

  canvas.addEventListener('touchmove', (event) => {
    clearTimeout(longPressTimer);
    // Prevent browser scroll only while touch is inside the hero — preserves normal page scroll elsewhere
    const heroEl = document.querySelector('.hero');
    if (heroEl && event.touches[0].clientY <= heroEl.getBoundingClientRect().bottom) {
      event.preventDefault();
    }
    if (event.touches.length === 1) {
      // Single touch: gravity well (existing behavior)
      const touch = event.touches[0];
      mouseX = (touch.clientX / window.innerWidth) * 2 - 1;
      mouseY = (touch.clientY / window.innerHeight) * 2 - 1;
      rawMouseX = touch.clientX;
      rawMouseY = touch.clientY;
    } else if (event.touches.length === 2) {
      // Two-finger pinch / expand
      const t0 = event.touches[0], t1 = event.touches[1];
      const curDist = Math.hypot(t1.clientX - t0.clientX, t1.clientY - t0.clientY);
      const delta = curDist - (prevPinchDist || curDist);
      prevPinchDist = curDist;
      if (Math.abs(delta) > 4) {
        const midX = (t0.clientX + t1.clientX) / 2;
        const midY = (t0.clientY + t1.clientY) / 2;
        const mwx = ((midX / window.innerWidth) * 2 - 1) * 5.5;
        const mwy = -((midY / window.innerHeight) * 2 - 1) * 3.0;
        if (delta > 0) {
          // Pinch out → explosion
          applyVortexShockwave(amberSystem, { x: mwx, y: mwy, z: 0 });
          applyVortexShockwave(sparkSystem, { x: mwx, y: mwy, z: 0 });
          emitSparks(mwx, mwy, 0xffa040, 10);
        } else {
          // Pinch in → implosion pull
          VORTEX_PARAMS.centerX = mwx;
          VORTEX_PARAMS.centerY = mwy;
          const savedCore = VORTEX_PARAMS.coreStrength;
          VORTEX_PARAMS.coreStrength = 0.018;
          setTimeout(() => { VORTEX_PARAMS.coreStrength = savedCore; }, 400);
        }
      }
    }
  }, { passive: false });

  canvas.addEventListener('touchend', (e) => {
    clearTimeout(longPressTimer);
    prevPinchDist = null;
    if (swipeStartX === null) return;
    const t = e.changedTouches[0];
    const sdx = t.clientX - swipeStartX;
    const sdy = t.clientY - swipeStartY;
    const swipeDist = Math.hypot(sdx, sdy);
    swipeStartX = null; swipeStartY = null;
    if (swipeDist > 60) {
      if (Math.abs(sdx) > Math.abs(sdy)) {
        // Horizontal swipe → spin all tools
        const rotDir = sdx > 0 ? 0.025 : -0.025;
        inertia.hammer += rotDir;
        inertia.wrench += rotDir;
      } else if (sdy < 0) {
        // Swipe up → scatter
        applyVortexShockwave(amberSystem, { x: 0, y: 0, z: 0 });
        applyVortexShockwave(sparkSystem, { x: 0, y: 0, z: 0 });
      } else {
        // Swipe down → gather/implosion
        VORTEX_PARAMS.centerX = 0;
        VORTEX_PARAMS.centerY = 0;
        const savedCore = VORTEX_PARAMS.coreStrength;
        VORTEX_PARAMS.coreStrength = 0.022;
        setTimeout(() => { VORTEX_PARAMS.coreStrength = savedCore; }, 600);
      }
    } else {
      // Tap — raycast for tool click or emit shockwave
      e.preventDefault();
      const tx = (t.clientX / window.innerWidth) * 2 - 1;
      const ty = -((t.clientY / window.innerHeight) * 2 - 1);
      mouseVec.set(tx, ty);
      raycaster.setFromCamera(mouseVec, camera);
      const tgts = [];
      [hammerGroup, wrenchGroup, sawGroup].forEach(grp => {
        grp.traverse(o => { if (o.userData.toolId) tgts.push(o); });
      });
      const hits = raycaster.intersectObjects(tgts);
      if (hits.length > 0) {
        handleToolClick(hits[0].object.userData.toolId, t.clientX, t.clientY);
      } else {
        closePanel();
        const wx = ((t.clientX / window.innerWidth) * 2 - 1) * 5.5;
        const wy = -((t.clientY / window.innerHeight) * 2 - 1) * 3.0;
        emitSparks(wx, wy);
        clickWorldPos = { x: wx, y: wy, z: 0 };
        applyVortexShockwave(amberSystem, clickWorldPos);
        applyVortexShockwave(sparkSystem, clickWorldPos);
        applyVortexShockwave(hazeSystem,  clickWorldPos);
        implosionActive = true;
        implosionStart = performance.now();
      }
    }
  }, false);

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

  let canvasLastClickTime = 0;
  canvas.addEventListener('click', (e) => {
    const now = performance.now();
    if (hoveredTool) {
      handleToolClick(hoveredTool, e.clientX, e.clientY);
      canvasLastClickTime = now;
      return;
    }
    // Guard only for empty-space shockwaves — absorbs synthetic click from dblclick
    if (now - canvasLastClickTime < 350) return;
    canvasLastClickTime = now;
    {
      closePanel();
      // Spark burst at click world position
      const clickX = ((e.clientX / window.innerWidth)  * 2 - 1) * 5.5;
      const clickY = -((e.clientY / window.innerHeight) * 2 - 1) * 3.0;
      emitSparks(clickX, clickY);
      // Apply vortex shockwave + implosion pull-back
      clickWorldPos = { x: clickX, y: clickY, z: 0 };
      applyVortexShockwave(amberSystem, clickWorldPos);
      applyVortexShockwave(sparkSystem, clickWorldPos);
      applyVortexShockwave(hazeSystem,  clickWorldPos);
      implosionActive = true;
      implosionStart = performance.now();
    }
  });

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
      // Drag-grab burst: sparks fly from tool + immediate turbulence spike
      const grp = getToolGroup(dragTool);
      emitSparks(grp.position.x, grp.position.y, 0xffcc66, 10);
      VORTEX_PARAMS.turbulenceMode = Math.min(1.0, VORTEX_PARAMS.turbulenceMode + 0.6);
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
    // Boost particle turbulence + wind during drag proportional to drag speed
    const dragWindBoost = Math.abs(e.clientX - dragLastX) * 0.00012;
    VORTEX_PARAMS.turbulenceMode = Math.min(1.0, VORTEX_PARAMS.turbulenceMode + 0.25);
    VORTEX_PARAMS.windStrength = Math.min(0.022, VORTEX_PARAMS.baseWindStrength + dragWindBoost);
    dragLastX = e.clientX; dragLastT = nowT;
  });

  window.addEventListener('mouseup', () => {
    clearTimeout(slingshotTimer); // prevent deferred slingshot after middle-click release
    if (!dragTool) return;
    canvas.style.cursor = hoveredTool ? 'pointer' : 'default';
    // Sync idle accumulator to current rotation so idle resumes seamlessly
    if (dragTool === 'hammer') hammerIdleY = hammerGroup.rotation.y;
    if (dragTool === 'wrench') wrenchIdleY = wrenchGroup.rotation.y;
    // Store drag velocity for inertia decay
    inertia[dragTool] = dragVel;
    // Release burst: size proportional to drag velocity
    const burstCount = Math.min(20, Math.floor(Math.abs(dragVel) * 3000) + 6);
    const grpR = getToolGroup(dragTool);
    emitSparks(grpR.position.x, grpR.position.y, 0xffa040, burstCount);
    if (Math.abs(dragVel) > 0.002) {
      const lateralPos = {
        x: grpR.position.x + (dragVel > 0 ? 1.5 : -1.5),
        y: grpR.position.y, z: 0
      };
      applyVortexShockwave(amberSystem, lateralPos);
      applyVortexShockwave(sparkSystem, lateralPos);
    }
    // Reset wind boost back to base after drag ends
    VORTEX_PARAMS.windStrength = VORTEX_PARAMS.baseWindStrength;
    dragTool = null;
  });

  /* ─── Right-click: reverse gravity ────────────────────── */
  canvas.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    VORTEX_PARAMS.reverseGravity = true;
    clearTimeout(reverseGravityTimer);
    reverseGravityTimer = setTimeout(() => { VORTEX_PARAMS.reverseGravity = false; }, 2500);
    // Visual feedback: small shockwave from cursor
    const rx = ((e.clientX / window.innerWidth) * 2 - 1) * 5.5;
    const ry = -((e.clientY / window.innerHeight) * 2 - 1) * 3.0;
    applyVortexShockwave(amberSystem, { x: rx, y: ry, z: 0 });
    applyVortexShockwave(sparkSystem, { x: rx, y: ry, z: 0 });
    applyVortexShockwave(hazeSystem,  { x: rx, y: ry, z: 0 });
    emitSparks(rx, ry, 0x88ccff, 10);
    // Implosion pull-back from right-click position
    clickWorldPos = { x: rx, y: ry, z: 0 };
    implosionActive = true;
    implosionStart = performance.now();
  });

  /* ─── Extended Interaction Events ────────────────────────── */

  // State variables for new interactions (reverseGravityTimer already declared above)
  let reverseGravityActive = false;
  let slingshotTimer = null;
  let sawLocked = false;

  // Double-click: Detonation burst — particles explode outward then snap back via implosion
  canvas.addEventListener('dblclick', (e) => {
    VORTEX_PARAMS.reverseGravity = true;
    VORTEX_PARAMS.turbulenceMode = 1.0;
    reverseGravityActive = true;
    clearTimeout(reverseGravityTimer);
    reverseGravityTimer = setTimeout(() => {
      VORTEX_PARAMS.reverseGravity = false;
      reverseGravityActive = false;
    }, 800);
    // Delayed snap-back implosion — starts 300ms in so blast peaks first
    const dbx = ((e.clientX / window.innerWidth) * 2 - 1) * 5.5;
    const dby = -((e.clientY / window.innerHeight) * 2 - 1) * 3.0;
    clickWorldPos = { x: dbx, y: dby, z: 0 };
    implosionActive = true;
    implosionStart = performance.now() - IMPLOSION_DURATION * VORTEX_PARAMS.implosionDelay;
  });

  // Middle-click: Freeze + Slingshot — particles decelerate to near-stop, then blast outward
  canvas.addEventListener('mousedown', e => {
    if (e.button !== 1 || dragTool) return; // skip if not middle-click or already dragging
    e.preventDefault();
    VORTEX_PARAMS.damping = 0.940;
    clearTimeout(slingshotTimer);
    slingshotTimer = setTimeout(() => {
      VORTEX_PARAMS.damping = 0.982;
      VORTEX_PARAMS.shockwaveImpulse = 0.35;
      const wp = new THREE.Vector3(mouseX * 5.5, -mouseY * 3.0, 0);
      applyVortexShockwave(amberSystem, wp);
      applyVortexShockwave(sparkSystem, wp);
      applyVortexShockwave(hazeSystem,  wp);
      setTimeout(() => { VORTEX_PARAMS.shockwaveImpulse = 0.45; }, 100);
    }, 600);
  });

  // Spacebar hold: Saw lock at max speed + suppress cursor vortex so saw induction dominates
  window.addEventListener('keydown', e => {
    if (e.code !== 'Space') return;
    const tag = e.target.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
    if (e.repeat) return; // prevent keydown repeat from re-firing burst
    e.preventDefault();
    sawLocked = true;
    // Visual lock signal: blue-white burst + shockwave from saw position
    const sp = sawGroup.position;
    emitSparks(sp.x, sp.y, 0xaaddff, 16);
    applyVortexShockwave(amberSystem, { x: sp.x, y: sp.y, z: 0 });
    applyVortexShockwave(sparkSystem, { x: sp.x, y: sp.y, z: 0 });
    applyVortexShockwave(hazeSystem,  { x: sp.x, y: sp.y, z: 0 });
    VORTEX_PARAMS.turbulenceMode = 1.0;
  });
  window.addEventListener('keyup', e => {
    if (e.code !== 'Space') return;
    sawLocked = false;
    VORTEX_PARAMS.tangentialStrength = 0.0032;  // restore cursor vortex strength
    // Unlock burst: smaller orange release from saw
    const sp = sawGroup.position;
    emitSparks(sp.x, sp.y, 0xff8800, 10);
  });

  /* ─── Spark burst pool ─────────────────────────────────── */
  // 28 total: first 16 reserved for saw sparks, last 12 for tool-click sparks.
  // Smaller radius (0.018) so they look like actual spark particles, not golf balls.
  const sparks = [];
  for (let s = 0; s < 28; s++) {
    const sm = new THREE.Mesh(
      new THREE.SphereGeometry(0.018, 4, 3),
      new THREE.MeshBasicMaterial({
        color: 0xffa040, transparent: true, opacity: 0,
        blending: THREE.AdditiveBlending, depthWrite: false,
      })
    );
    sm.frustumCulled = false;
    sm.visible = false;
    scene.add(sm);
    sparks.push({ mesh: sm, active: false, vel: new THREE.Vector3(), startTime: 0, lifetime: 600 });
  }

  // Generic radial burst — used for tool clicks, pinch gestures, shockwaves
  function emitSparks(worldX, worldY, color = 0xffa040, count = 8) {
    // Use slots 12–27 (last 16 of pool) so saw sparks (0–15) aren't clobbered
    const startSlot = 12;
    let filled = 0;
    for (let i = startSlot; i < sparks.length && filled < count; i++) {
      const sp = sparks[i];
      if (sp.active) continue;  // skip busy sparks
      const angle = (filled / count) * Math.PI * 2 + rand(0, 0.5);
      const speed = rand(0.005, 0.016);
      sp.mesh.material.color.setHex(color);
      sp.mesh.position.set(worldX, worldY, 1.5);
      sp.vel.set(Math.cos(angle) * speed, Math.sin(angle) * speed, rand(-0.002, 0.002));
      sp.mesh.material.opacity = 0.9;
      sp.mesh.visible = true;
      sp.active = true;
      sp.startTime = performance.now();
      sp.lifetime = 600;
      filled++;
    }
  }

  // Saw-specific sparks — tangential arc from blade contact point, with gravity
  function emitSawSparks(sawPos, speedRatio) {
    const count = Math.ceil(1 + speedRatio * 4);  // 1–5 sparks
    // Contact point: bottom of blade (y - blade radius), slightly forward
    const contactX = sawPos.x;
    const contactY = sawPos.y - 0.88;
    const contactZ = sawPos.z + 0.15;
    // CW rotation (positive rotation.y in sawSpinGroup whose local Y points toward camera):
    // At the bottom of the blade (6 o'clock), tangent velocity points rightward (+X).
    // Sparks fly right and slightly downward with natural gravity arc.
    // BASE_ANGLE ≈ -0.25 rad = rightward with slight downward bias for realism.
    const BASE_ANGLE = -0.25;  // ~355° = right + slight down
    let filled = 0;
    for (let i = 0; i < sparks.length && filled < count; i++) {
      const sp = sparks[i];
      if (sp.active) continue;
      const angle = BASE_ANGLE + (Math.random() - 0.5) * 0.55;  // ±16° spread
      const speed = 0.022 + Math.random() * 0.030 * speedRatio;
      // Color: white-hot → amber → orange as speed drops
      const color = speedRatio > 0.75 ? 0xffffff
                  : speedRatio > 0.45 ? 0xffdd66
                  :                     0xff6600;
      sp.mesh.material.color.setHex(color);
      sp.mesh.position.set(contactX, contactY, contactZ);
      sp.vel.set(
        Math.cos(angle) * speed,
        Math.sin(angle) * speed,
        (Math.random() - 0.5) * 0.005
      );
      sp.mesh.material.opacity = 1.0;
      sp.mesh.visible = true;
      sp.active = true;
      sp.startTime = performance.now();
      sp.lifetime = 380 + Math.random() * 280;  // shorter-lived than click sparks
      filled++;
    }
  }

  /* ─── Keyboard shortcuts ───────────────────────────────── */
  window.addEventListener('keydown', (e) => {
    const key = e.key.toUpperCase();
    if (key === 'H') {
      openPanel('hammer'); hoverEmissive.hammer = 0.38;
      const hp = hammerGroup.position;
      applyVortexShockwave(amberSystem, { x: hp.x, y: hp.y, z: 0 });
      applyVortexShockwave(sparkSystem, { x: hp.x, y: hp.y, z: 0 });
      applyVortexShockwave(hazeSystem,  { x: hp.x, y: hp.y, z: 0 });
      emitSparks(hp.x, hp.y, 0xffaa40, 14);
    }
    if (key === 'W') {
      openPanel('wrench'); hoverEmissive.wrench = 0.38;
      const wp = wrenchGroup.position;
      applyVortexShockwave(amberSystem, { x: wp.x, y: wp.y, z: 0 });
      applyVortexShockwave(sparkSystem, { x: wp.x, y: wp.y, z: 0 });
      applyVortexShockwave(hazeSystem,  { x: wp.x, y: wp.y, z: 0 });
      emitSparks(wp.x, wp.y, 0x88ddff, 14);
    }
    if (key === 'S') {
      openPanel('saw'); hoverEmissive.saw = 0.38;
      const sp = sawGroup.position;
      applyVortexShockwave(amberSystem, { x: sp.x, y: sp.y, z: 0 });
      applyVortexShockwave(sparkSystem, { x: sp.x, y: sp.y, z: 0 });
      applyVortexShockwave(hazeSystem,  { x: sp.x, y: sp.y, z: 0 });
      emitSparks(sp.x, sp.y, 0xff6600, 18);
    }
    if (e.key === 'Escape') { closePanel(); }
  });

  /* ─── Scroll tracking ─────────────────────────────────── */
  let scrollProgress  = 0;  // 0–1 across full page — used for camera pull-back
  let currentScrollY  = 0;  // raw px — used for hero fade threshold

  let lastScrollY = 0;
  let scrollSweepTimer = null;
  function updateScroll() {
    const prevY = lastScrollY;
    currentScrollY = window.scrollY;
    lastScrollY = currentScrollY;
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    scrollProgress  = maxScroll > 0 ? currentScrollY / maxScroll : 0;
    const overlayAlpha = Math.min(scrollProgress * 2, 1);
    document.documentElement.style.setProperty('--overlay-alpha', overlayAlpha.toFixed(3));
    document.documentElement.style.setProperty('--scene-warmth', scrollProgress.toFixed(3));
    // Scale bloom strength with scroll warmth
    if (bloomPass) bloomPass.strength = 0.40 + scrollProgress * 0.25;
    // Particle vertical sweep on scroll
    const scrollingDown = currentScrollY > prevY;
    VORTEX_PARAMS.turbulenceMode = 1.0;
    VORTEX_PARAMS.upwardDrift = scrollingDown ? -0.003 : 0.003;
    clearTimeout(scrollSweepTimer);
    scrollSweepTimer = setTimeout(() => { VORTEX_PARAMS.upwardDrift = 0.00085; }, 400);
  }

  window.addEventListener('scroll', updateScroll, { passive: true });

  /* ─── Camera state ────────────────────────────────────── */
  let camRotX = 0, camRotY = 0;
  // Spring physics for camera parallax — replaces exponential lerp for organic overshoot feel
  let camVelX = 0, camVelY = 0;
  const SPRING_K = 180, SPRING_C = 18;  // K=180 → ~2.1 Hz natural freq, C=18 → damping ratio ~0.67

  /* ─── Responsive layout ───────────────────────────────── */
  function applyResponsiveLayout() {
    const w = window.innerWidth;
    const isNarrow = w < 480;
    const isMobile = w < 768;

    if (isNarrow) {
      camera.fov = 52;
      [hammerGroup, wrenchGroup, sawGroup].forEach(g => g.scale.setScalar(0.55));
      hammerGroup.position.set(-0.6, 0.8, 1.5);   // upper left
      wrenchGroup.position.set( 0.6, 0.6, 1.5);   // upper right
      sawGroup.position.set(0, 1.2, -0.5);         // upper center-back
    } else if (isMobile) {
      camera.fov = 54;
      [hammerGroup, wrenchGroup, sawGroup].forEach(g => g.scale.setScalar(0.65));
      hammerGroup.position.set(-0.8, 0.7, 1.6);   // upper left
      wrenchGroup.position.set( 0.8, 0.5, 1.5);   // upper right
      sawGroup.position.set(0, 1.0, -0.5);         // upper center-back
    } else {
      camera.fov = 60;
      [hammerGroup, wrenchGroup].forEach(g => g.scale.setScalar(1.0));
      hammerGroup.position.set(-1.8, 0.2, 2.0);   // left-front in triangle
      wrenchGroup.position.set( 1.6, 0.4, 1.8);   // right-front in triangle
      sawGroup.scale.setScalar(1.3);
      sawGroup.position.set(0, 2.2, -0.5);
    }
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    // Store base positions for float animations to preserve responsive layout
    window.toolBasePositions = {
      hammer: {
        x: hammerGroup.position.x,
        y: hammerGroup.position.y,
        z: hammerGroup.position.z
      },
      wrench: {
        x: wrenchGroup.position.x,
        y: wrenchGroup.position.y,
        z: wrenchGroup.position.z
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
      if (composer) composer.setSize(window.innerWidth, window.innerHeight);
      if (bloomPass) bloomPass.resolution.set(window.innerWidth, window.innerHeight);
      applyResponsiveLayout();
    }, 150);
  });

  // applyResponsiveLayout() called inside startScene() after GLB load

  /* ─── Mouse physics updater ───────────────────────────── */
  // Called each frame before updateVortexPhysics.
  // Computes velocity, turbulence mode, moves vortex center to cursor,
  // and detects tool proximity for per-tool force signatures.
  function updateMousePhysics() {
    // ── Step 1: EMA-smoothed mouse velocity (NDC/frame) ──
    const rawVX = mouseX - prevMouseX;
    const rawVY = mouseY - prevMouseY;
    prevMouseX = mouseX;
    prevMouseY = mouseY;
    smoothVelX = smoothVelX * 0.72 + rawVX * 0.28;
    smoothVelY = smoothVelY * 0.72 + rawVY * 0.28;
    const velMag = Math.sqrt(smoothVelX * smoothVelX + smoothVelY * smoothVelY);
    VORTEX_PARAMS.mouseVelocityX = smoothVelX;
    VORTEX_PARAMS.mouseVelocityY = smoothVelY;

    // ── Step 2: Turbulence mode (asymmetric lerp — fast attack, slow decay) ──
    // Double-click detonation overrides turbulence — skip the lerp during that event
    if (!reverseGravityActive) {
      const targetTurb = velMag > VORTEX_PARAMS.velocityThreshold ? 1.0 : 0.0;
      const turbRate = targetTurb > VORTEX_PARAMS.turbulenceMode ? 0.18 : 0.040;
      VORTEX_PARAMS.turbulenceMode += (targetTurb - VORTEX_PARAMS.turbulenceMode) * turbRate;
    }

    // ── Step 3: Lerp vortex center to cursor world position ──
    const targetCX = mouseX * 5.5;
    const targetCY = -mouseY * 3.0;
    const centerLerp = 0.022 + VORTEX_PARAMS.turbulenceMode * 0.04;  // slower follow — particles spread before center catches up
    VORTEX_PARAMS.centerX += (targetCX - VORTEX_PARAMS.centerX) * centerLerp;
    VORTEX_PARAMS.centerY += (targetCY - VORTEX_PARAMS.centerY) * centerLerp;
    // centerZ stays 0 (tools are at z≈0–2, particles fill the z range)

    // ── Step 4: Tool proximity (screen-space pixel distance) ──
    const toolDefs = [
      { id: 'hammer', group: hammerGroup, threshold: 140 },
      { id: 'wrench', group: wrenchGroup, threshold: 140 },
      { id: 'saw',    group: sawGroup,    threshold: 110 },
    ];
    let closestId = null;
    let closestDist = Infinity;
    let closestStrength = 0;
    for (const t of toolDefs) {
      const wp = t.group.position.clone();
      wp.project(camera);
      const sx = (wp.x  + 1) / 2 * window.innerWidth;
      const sy = (-wp.y + 1) / 2 * window.innerHeight;
      const pd = Math.sqrt((rawMouseX - sx) * (rawMouseX - sx) + (rawMouseY - sy) * (rawMouseY - sy));
      if (pd < t.threshold && pd < closestDist) {
        closestDist = pd;
        closestId = t.id;
        closestStrength = 1.0 - pd / t.threshold;
      }
    }
    if (closestId !== VORTEX_PARAMS.proximityTool) {
      VORTEX_PARAMS.proximityTool = closestId;
      VORTEX_PARAMS.proximityStrength = 0;
    } else {
      const targetStr = closestId !== null ? closestStrength : 0;
      VORTEX_PARAMS.proximityStrength += (targetStr - VORTEX_PARAMS.proximityStrength) * 0.08;
    }
  }

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
        const partT = easeOutSpring(Math.min(partElapsed / (ASSEMBLY_DURATION * 0.72), 1));
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
    // Ambient breathing pulse — modulate radial + tangential with slow sine (~4s period)
    // Radial and tangential are 90° out of phase: when pulling in, spiral tightens; when pushing out, spiral loosens
    const breathPhase = (time % VORTEX_PARAMS.breathePeriod) / VORTEX_PARAMS.breathePeriod;
    VORTEX_PARAMS.radialStrength = 0.0018 + Math.sin(breathPhase * Math.PI * 2) * VORTEX_PARAMS.breatheAmplitude;
    const breatheTarget = 0.0028 + Math.sin((breathPhase + 0.25) * Math.PI * 2) * (VORTEX_PARAMS.breatheAmplitude * 0.8);
    VORTEX_PARAMS.tangentialStrength = sawLocked ? 0.0008 : breatheTarget;

    // Update mouse velocity, turbulence mode, vortex center, tool proximity
    updateMousePhysics();

    // ── PARTICLE COLOR STATE MACHINE (dark default, explosive on interaction) ──
    // impl/implPct declared in animate() scope so the light section below can reuse them
    let impl = implosionActive;
    let implPct = 0;
    if (impl) {
      const impT = (performance.now() - implosionStart) / IMPLOSION_DURATION;
      implPct = Math.sin(Math.max(0, Math.min(1, impT)) * Math.PI); // 0→1→0 arc
    }
    {
      const turb = VORTEX_PARAMS.turbulenceMode;
      const revG = VORTEX_PARAMS.reverseGravity;

      // Amber layer: deep ember red → white-hot blast → electric blue implosion
      const ar = impl ? THREE.MathUtils.lerp(1.0,  0.1,  implPct)
                      : THREE.MathUtils.lerp(1.0,  1.0,  turb);
      const ag = impl ? THREE.MathUtils.lerp(0.333, 0.3,  implPct)
                      : THREE.MathUtils.lerp(0.333, 1.0,  turb);
      const ab = impl ? THREE.MathUtils.lerp(0.0,  1.0,  implPct)
                      : THREE.MathUtils.lerp(0.0,  1.0,  turb);
      amberParticleMat.color.setRGB(ar, ag, ab);

      // Spark layer: cool steel-blue → arc-white on turbulence / violet on reverse gravity
      const sr = revG ? THREE.MathUtils.lerp(0.667, 0.8,  VORTEX_PARAMS.proximityStrength || turb)
                      : THREE.MathUtils.lerp(0.667, 1.0,  turb);
      const sg = revG ? THREE.MathUtils.lerp(0.867, 0.1,  VORTEX_PARAMS.proximityStrength || turb)
                      : THREE.MathUtils.lerp(0.867, 1.0,  turb);
      const sb = revG ? THREE.MathUtils.lerp(1.0,   1.0,  VORTEX_PARAMS.proximityStrength || turb)
                      : THREE.MathUtils.lerp(1.0,   1.0,  turb);
      sparkMat.color.setRGB(sr, sg, sb);

      // Haze layer: teal mist → white corona on turb, magenta on revG
      const hr = revG ? THREE.MathUtils.lerp(0.133, 1.0, turb) : THREE.MathUtils.lerp(0.133, 1.0, turb);
      const hg = revG ? THREE.MathUtils.lerp(1.0,   0.0, turb) : THREE.MathUtils.lerp(1.0,   1.0, turb);
      const hb = revG ? THREE.MathUtils.lerp(0.667, 0.8, turb) : THREE.MathUtils.lerp(0.667, 1.0, turb);
      hazeMat.color.setRGB(hr, hg, hb);

      // Particle size swells dramatically on blast, shrinks on implosion
      amberParticleMat.size    = 0.048 + turb * 0.055 + implPct * 0.020;
      amberParticleMat.opacity = Math.min(0.65, 0.38 + turb * 0.20 + implPct * 0.15);
      sparkMat.size            = 0.036 + turb * 0.030 + implPct * 0.014;
      sparkMat.opacity         = Math.min(0.60, 0.42 + turb * 0.14 + implPct * 0.12);
      hazeMat.size             = 0.038 + turb * 0.028;
      hazeMat.opacity          = Math.min(0.48, 0.28 + turb * 0.18 + implPct * 0.14);
    }

    // Implosion pull-back phase (pre-physics so pull affects this frame's position update)
    if (implosionActive) {
      const impElapsed = performance.now() - implosionStart;
      const impT = impElapsed / IMPLOSION_DURATION;
      if (impT >= 1.0) {
        implosionActive = false;
      } else if (impT > VORTEX_PARAMS.implosionDelay) {
        const normalizedT = (impT - VORTEX_PARAMS.implosionDelay) / (1.0 - VORTEX_PARAMS.implosionDelay);
        const pullStrength = VORTEX_PARAMS.implosionStrength * Math.sin(normalizedT * Math.PI);
        for (const system of [amberSystem, sparkSystem, hazeSystem]) {
          const pos = system.positions;
          const vel = system.velocities;
          for (let i = 0; i < system.count; i++) {
            const ix = i * 3, iy = i * 3 + 1, iz = i * 3 + 2;
            const dx = clickWorldPos.x - pos[ix];
            const dy = clickWorldPos.y - pos[iy];
            const dz = clickWorldPos.z - pos[iz];
            const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
            if (dist > 0.01 && dist < VORTEX_PARAMS.shockwaveRadius * 2.5) {
              vel[ix] += (dx / dist) * pullStrength;
              vel[iy] += (dy / dist) * pullStrength;
              vel[iz] += (dz / dist) * pullStrength;
            }
          }
        }
      }
    }

    updateVortexPhysics(amberSystem, mouseWorldPos, delta);
    updateVortexPhysics(sparkSystem, mouseWorldPos, delta);
    updateVortexPhysics(hazeSystem,  mouseWorldPos, delta);

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

    /* ── Hover emissive lerp — also driven by vortex turbulence + implosion ── */
    const particleEnergyBase = VORTEX_PARAMS.turbulenceMode * 0.18 + implPct * 0.28;
    const sawEnergyBoost = (VORTEX_PARAMS.sawSpeedRatio || 0) * 0.12;

    const lerpE = 1 - Math.pow(0.04, delta / 16);
    ['hammer', 'wrench', 'saw'].forEach(id => {
      const hoverTarget = (hoveredTool === id || activePanelTool === id) ? 0.38 : 0;
      const particleTarget = particleEnergyBase + (id === 'saw' ? sawEnergyBoost : 0);
      const target = Math.max(hoverTarget, particleTarget);
      hoverEmissive[id] += (target - hoverEmissive[id]) * lerpE;
      const ev = hoverEmissive[id];
      getToolGroup(id).traverse(obj => {
        if (obj.isMesh && obj.material && obj.material.emissive) {
          // Don't override bubble's own emissive — only change non-emissive parts
          if (obj.material.emissiveIntensity < 0.5) {
            // Amber-orange at rest/turbulence; shifts blue on implosion
            const rC = impl ? THREE.MathUtils.lerp(0.95, 0.2, implPct) : 0.95;
            const gC = impl ? THREE.MathUtils.lerp(0.52, 0.4, implPct) : 0.52;
            const bC = impl ? THREE.MathUtils.lerp(0.05, 1.0, implPct) : 0.05;
            obj.material.emissive.setRGB(ev * rC, ev * gC, ev * bC);
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
    // Use stored responsive base positions and add float animation on top
    if (window.toolBasePositions) {
      // Differentiated float periods prevent synchronized bobbing — 3.2s / 4.1s / 5.0s
      hammerGroup.position.x = window.toolBasePositions.hammer.x + camRotY * -1.8;
      hammerGroup.position.y = window.toolBasePositions.hammer.y + Math.sin(time * 0.00098) * 0.065;  // 3.2s period
      hammerGroup.position.z = window.toolBasePositions.hammer.z + camRotX * -0.6;

      wrenchGroup.position.x = window.toolBasePositions.wrench.x + camRotY * -1.6;
      wrenchGroup.position.y = window.toolBasePositions.wrench.y + Math.sin(time * 0.00076 + 1.2) * 0.048;  // 4.1s period
      wrenchGroup.position.z = window.toolBasePositions.wrench.z + camRotX * -0.5;

      // Saw blade apex positioning with corrected float frequency and parallax
      sawGroup.position.x = window.toolBasePositions.saw.x + camRotY * -1.4;
      sawGroup.position.y = window.toolBasePositions.saw.y + Math.cos(time * 0.00063 + 2.7) * 0.038;  // 5.0s period
      sawGroup.position.z = window.toolBasePositions.saw.z + camRotX * -0.4 + Math.sin(time * 0.00063 + 2.7) * 0.06;
    }

    if (!spinState.hammer.spinning && dragTool !== 'hammer') {
      hammerGroup.rotation.y = hammerIdleY - 0.55 + camRotY * 0.35;
      hammerGroup.rotation.z = 0.22 + mouseX * -0.06;
    }

    if (!spinState.wrench.spinning && dragTool !== 'wrench') {
      wrenchGroup.rotation.y = wrenchIdleY + 0.60 + camRotY * 0.28;
      wrenchGroup.rotation.z = -0.15 + mouseX * 0.05;
    }

    // sawSpinGroup is inside sawGroup (which has rotation.x = PI/2).
    // The inner group's local Y-axis therefore points toward the camera (world -Z).
    // Spinning sawSpinGroup.rotation.y rotates the blade around its own face-normal = correct saw spin.
    // Mouse-X driven speed: left (-1) = slow, right (1) = fast
    // Spacebar lock overrides to max speed and suppresses cursor vortex
    const speedMultiplier = 0.5 + (mouseX * 0.5); // 0 to 1 range
    const sawSpinSpeed = sawLocked
      ? sawGroup.userData.maxSawSpeed
      : THREE.MathUtils.lerp(sawGroup.userData.baseSawSpeed, sawGroup.userData.maxSawSpeed, speedMultiplier);
    if (!glbSawLoaded && sawSpinGroup) sawSpinGroup.rotation.y += sawSpinSpeed;

    // NOW calculate speedRatio using the current frame's sawSpinSpeed
    const baseSpeed = sawGroup.userData.baseSawSpeed;
    const maxSpeed = sawGroup.userData.maxSawSpeed;
    const speedRatio = (sawSpinSpeed - baseSpeed) / (maxSpeed - baseSpeed); // 0 to 1
    // Propagate saw state to VORTEX_PARAMS for induction physics
    VORTEX_PARAMS.sawSpeedRatio = speedRatio;
    VORTEX_PARAMS.sawWorldX = sawGroup.position.x;
    VORTEX_PARAMS.sawWorldY = sawGroup.position.y;
    VORTEX_PARAMS.sawWorldZ = sawGroup.position.z;
    // Hub bloom pulses dramatically with spin speed — from dim glow to blazing at full speed
    if (!glbSawLoaded && hubGlowMat)   hubGlowMat.opacity   = 0.12 + speedRatio * 0.20;
    if (!glbSawLoaded && hubCoronaMat) hubCoronaMat.opacity = 0.05 + speedRatio * 0.14;
    if (bladeMat) bladeMat.envMapIntensity = 0.5 + speedRatio * 0.5 + VORTEX_PARAMS.turbulenceMode * 0.2;

    // Saw blade sparks — tangential arc from blade contact point, always active above idle
    if (speedRatio > 0.12 && Math.random() < 0.18 + speedRatio * 0.35) {
      emitSawSparks(sawGroup.position, speedRatio);
    }
    // At very high speed, burst sparks also fly off from the side of the blade
    if (speedRatio > 0.80 && Math.random() < 0.30) {
      const sideAngle = (Math.random() - 0.5) * 1.2;  // random point on rim
      const rp = sawGroup.position;
      emitSparks(
        rp.x + Math.cos(sideAngle) * 0.88,
        rp.y + Math.sin(sideAngle) * 0.88,
        0xffffff, 2
      );
    }

    /* ── Floor grid parallax ── */
    floorGrid.position.x = camRotY * -0.8;
    floorGrid.position.z = 1.0 + camRotX * 0.4;

    /* ── Opacity / fade on scroll ── */
    allToolParts.forEach(m => { m.material.opacity = toolAlpha; });
    floorGrid.material.opacity   = toolAlpha * 0.55;
    wallGrid.material.opacity    = toolAlpha * 0.22;
    orbitLight.intensity = toolAlpha * 0.3;
    // Floor glow breathes with particle pulse + flares on turbulence
    const breathPhaseGlow = (time % 4000) / 4000;
    const glowPulse = 0.12 + Math.sin(breathPhaseGlow * Math.PI * 2) * 0.04 + VORTEX_PARAMS.turbulenceMode * 0.05;
    floorGlow.material.opacity  = toolAlpha * glowPulse;

    // ── PARTICLE LIGHT UPDATES: dynamic illumination from vortex + saw + sparks ──

    // Ambient flash on implosion — subtle tint only, not a flood
    ambientLight.intensity = 0.04 + implPct * 0.10;
    ambientLight.color.setRGB(
      impl ? THREE.MathUtils.lerp(0.024, 0.08, implPct) : 0.024,
      impl ? THREE.MathUtils.lerp(0.031, 0.07, implPct) : 0.031,
      impl ? THREE.MathUtils.lerp(0.055, 0.09, implPct) : 0.055
    );

    // Vortex light tracks cursor center — amber idle, blue-white on implosion
    vortexLight.position.set(VORTEX_PARAMS.centerX, VORTEX_PARAMS.centerY, 1.5);
    const vBase = impl ? 1.5 * implPct : 0;
    const vTurb = toolAlpha * (0.4 + VORTEX_PARAMS.turbulenceMode * 1.6);
    vortexLight.intensity = Math.min(2.0, Math.max(vBase, vTurb));
    vortexLight.color.setRGB(
      impl ? THREE.MathUtils.lerp(0.83, 0.5, implPct) : 0.83,
      impl ? THREE.MathUtils.lerp(0.51, 0.6, implPct) : 0.51,
      impl ? THREE.MathUtils.lerp(0.04, 1.0, implPct) : 0.04
    );

    // Spark light: intensifies AND goes cyan on high turbulence
    sparkLight.position.set(VORTEX_PARAMS.centerX * 0.8, VORTEX_PARAMS.centerY * 0.8 + 0.5, 1.0);
    sparkLight.intensity = toolAlpha * (VORTEX_PARAMS.turbulenceMode * 1.2 + implPct * 1.5);
    sparkLight.color.setRGB(
      THREE.MathUtils.lerp(1.0, 0.0, VORTEX_PARAMS.turbulenceMode),
      THREE.MathUtils.lerp(0.8, 0.93, VORTEX_PARAMS.turbulenceMode),
      THREE.MathUtils.lerp(0.4, 1.0, VORTEX_PARAMS.turbulenceMode)
    );

    // Ground glow: reacts to implosion — brief blue-white flood from floor
    groundGlow.intensity = impl ? implPct * 1.2 : VORTEX_PARAMS.turbulenceMode * 0.3;
    groundGlow.color.setRGB(
      impl ? THREE.MathUtils.lerp(0.69, 0.3, implPct) : 0.69,
      impl ? THREE.MathUtils.lerp(0.38, 0.4, implPct) : 0.38,
      impl ? THREE.MathUtils.lerp(0.06, 1.0, implPct) : 0.06
    );

    // Saw particle glow: orange light from sparks + hub, scales with blade speed
    sawParticleGlow.position.set(sawGroup.position.x, sawGroup.position.y, sawGroup.position.z + 0.5);
    sawParticleGlow.intensity = toolAlpha * speedRatio * 1.2;

    // Cloud key light: wide amber fill that breathes with particle energy
    const cloudBreath = 0.5 + Math.sin(time * 0.00038) * 0.5;
    cloudKeyLight.position.set(VORTEX_PARAMS.centerX * 0.6, VORTEX_PARAMS.centerY * 0.4 + cloudBreath * 0.8, 2.2);
    cloudKeyLight.intensity = toolAlpha * (VORTEX_PARAMS.turbulenceMode * 1.5 + implPct * 1.8);
    // Base is now 0 at idle — light only activates when particles are actually turbulent
    cloudKeyLight.color.setRGB(
      impl ? THREE.MathUtils.lerp(1.0, 0.3, implPct) : 1.0,
      impl ? THREE.MathUtils.lerp(0.6, 0.5, implPct) : 0.6,
      impl ? THREE.MathUtils.lerp(0.2, 1.0, implPct) : 0.2
    );

    // Floor rim light: fires on implosion for dramatic under-lighting burst
    floorRimLight.position.set(VORTEX_PARAMS.centerX * 0.3, -2.0, 1.5);
    floorRimLight.intensity = toolAlpha * (impl ? implPct * 0.8 : 0);
    floorRimLight.color.setRGB(0.4, 0.5, 0.9); // softer cool — was pure 0.2,0.4,1.0 blue

    horizonGrid.material.opacity = toolAlpha * 0.14;
    scanLineMat.opacity  = Math.min(edgeFade, 1) * 0.55 * toolAlpha;
    scanGlowMat.opacity  = Math.min(edgeFade, 1) * 0.22 * toolAlpha;
    // Saw spotlight: intensity scales with spin speed, position tracks mouse X for drama
    const spotIntensity = 0.5 + (speedRatio * 1.2); // 0.5 idle → 1.7 at max speed
    sawSpot.intensity  = toolAlpha * spotIntensity;
    sawSpot.position.x = mouseX * 1.8 + camRotY * -1.5;  // follows cursor left/right

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
      const t = elapsed / sp.lifetime;
      if (t >= 1) {
        sp.active = false;
        sp.mesh.visible = false;
      } else {
        sp.vel.y -= 0.0016 * delta;  // gravity: arcs downward over lifetime
        sp.mesh.position.addScaledVector(sp.vel, delta);
        sp.mesh.material.opacity = (1 - t * t);  // quadratic fade — stays bright, drops fast at end
      }
    }

    /* ── Camera spring physics + idle breathing sway ── */
    // Dual-frequency sway — irrational periods prevent mechanical feel, amplitudes ~0.5° (subliminal)
    const swayX = Math.sin(time * 0.00031) * 0.009 + Math.sin(time * 0.00071) * 0.005;
    const swayY = Math.cos(time * 0.00027) * 0.011 + Math.cos(time * 0.00059) * 0.006;

    // Semi-implicit Euler spring: K=180, C=18 → ~8% overshoot on fast sweeps, settles in ~0.5s
    const dt = delta / 1000;
    camVelX += (SPRING_K * (targetRotX + swayX - camRotX) - SPRING_C * camVelX) * dt;
    camVelY += (SPRING_K * (targetRotY + swayY - camRotY) - SPRING_C * camVelY) * dt;
    camRotX += camVelX * dt;
    camRotY += camVelY * dt;
    camera.rotation.x = camRotX;

    const scrollZ    = 6 + scrollProgress * 3;
    const scrollRotY = scrollProgress * 0.3;
    camera.position.z += (scrollZ - camera.position.z) * 0.06;
    camera.rotation.y  = camRotY + scrollRotY;

    /* ── Vortex glow plane — billboard additive fake volumetric core ── */
    vortexGlowPlane.position.set(VORTEX_PARAMS.centerX * 0.5, VORTEX_PARAMS.centerY * 0.3, 1.0);
    vortexGlowPlane.quaternion.copy(camera.quaternion);
    const vgOpacity = VORTEX_PARAMS.turbulenceMode * 0.08 + implPct * 0.18 + Math.sin(time * 0.00041) * 0.02;
    vortexGlowPlane.material.opacity = Math.max(0, vgOpacity) * toolAlpha;
    vortexGlowPlane.material.color.setRGB(
      impl ? THREE.MathUtils.lerp(0.20, 0.05, implPct) : 0.20,
      impl ? THREE.MathUtils.lerp(0.07, 0.15, implPct) : 0.07,
      impl ? THREE.MathUtils.lerp(0.00, 0.30, implPct) : 0.00
    );

    /* ── Background breathes with particle energy ── */
    const bgBreath = Math.sin(time * 0.00031) * 0.5 + 0.5; // slow 0..1 pulse
    const bgR = impl ? THREE.MathUtils.lerp(0.012 + bgBreath*0.004, 0.001, implPct)
                     : 0.012 + VORTEX_PARAMS.turbulenceMode*0.018 + bgBreath*0.004;
    const bgG = impl ? THREE.MathUtils.lerp(0.016 + bgBreath*0.003, 0.004, implPct)
                     : 0.016 + VORTEX_PARAMS.turbulenceMode*0.008 + bgBreath*0.003;
    const bgB = impl ? THREE.MathUtils.lerp(0.020 + bgBreath*0.004, 0.040, implPct)
                     : 0.020 + VORTEX_PARAMS.turbulenceMode*0.006 + bgBreath*0.006;
    scene.background.setRGB(bgR, bgG, bgB);

    /* ── Dynamic bloom strength driven by vortex state ── */
    if (bloomPass) {
      const bloomTarget = Math.min(
        0.30 + VORTEX_PARAMS.turbulenceMode * 0.08 + implPct * 0.07,
        0.45  // hard cap — keeps bloom within mip levels 1-2 for radius=0.22; was 0.57 peak (crossed mip-3 boundary causing stripes)
      );
      bloomPass.strength += (bloomTarget - bloomPass.strength) * 0.025; // slightly slower lerp + hard cap prevents mip-boundary banding
    }

    if (composer) {
      composer.render();
    } else {
      renderer.render(scene, camera);
    }
  }

  function startScene() {
    applyResponsiveLayout();
    if (prefersReduced) {
      allToolParts.forEach(mesh => {
        mesh.position.copy(mesh.userData.restPos);
        mesh.rotation.set(0, 0, 0);
      });
      renderer.render(scene, camera);
    } else {
      animate(0);
    }
  }

  loadGLBModels()
    .then(startScene)
    .catch(err => {
      console.warn('[three-scene] GLB load failed, using procedural fallback:', err);
      buildProceduralWrench();
      buildProceduralSaw();
      startScene();
    });

  /* ─── Timer cleanup on unload ─────────────────────────── */
  window.addEventListener('beforeunload', () => {
    clearTimeout(scrollSweepTimer);
    clearTimeout(reverseGravityTimer);
    clearTimeout(slingshotTimer);
  });

  /* ─── Print: hide canvas ──────────────────────────────── */
  const printStyle = document.createElement('style');
  printStyle.textContent = '@media print { #three-canvas { display: none !important; } }';
  document.head.appendChild(printStyle);

}());
