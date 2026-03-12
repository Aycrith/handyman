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

  const SCENE_QUERY = new URLSearchParams(window.location.search);
  const parseQueryFlag = (value) => /^(1|true|yes|on)$/i.test(String(value || ''));
  const normalizeTierOverride = (value) => {
    const tier = String(value || '').toLowerCase();
    return ['desktop', 'mobile', 'low'].includes(tier) ? tier : null;
  };
  const SCENE_TEST_OVERRIDES = {
    sceneTier: normalizeTierOverride(SCENE_QUERY.get('sceneTier')),
    forceDesktopFX: parseQueryFlag(SCENE_QUERY.get('sceneForceDesktopFX')),
    disablePerfAutoDowngrade: parseQueryFlag(SCENE_QUERY.get('sceneDisablePerfAutoDowngrade')),
  };

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
  const _isMobileViewport = window.innerWidth < 768;
  const DEFAULT_QUALITY_TIER = _isLowEnd ? 'low' : (_isMobileViewport ? 'mobile' : 'desktop');
  const ALLOW_DESKTOP_FX_OVERRIDE = SCENE_TEST_OVERRIDES.forceDesktopFX || SCENE_TEST_OVERRIDES.sceneTier === 'desktop';
  const ACTIVE_QUALITY_TIER = SCENE_TEST_OVERRIDES.sceneTier || DEFAULT_QUALITY_TIER;
  const CAN_RUN_DESKTOP_POST = ACTIVE_QUALITY_TIER === 'desktop' && (!_isLowEnd || ALLOW_DESKTOP_FX_OVERRIDE);

  const SCENE_CONFIG = {
    qualityTier: ACTIVE_QUALITY_TIER,
    experimentalGestures: false,
    featureFlags: {
      shaderParticles: true,
      volumetricCards: !_isLowEnd || ALLOW_DESKTOP_FX_OVERRIDE,
      halfResScatterPass: CAN_RUN_DESKTOP_POST && !prefersReduced,
      contextualHint: true,
      splitToneOverlay: true,
      releaseTrails: !prefersReduced,
      densityDiagnostics: true,
      pointerTrail: !prefersReduced,
    },
    interaction: {
      moveBoost: 0.003,
      hoverBoost: 0.05,
      clickBoost: 0.08,
      toolClickBoost: 0.14,
      dragStartBoost: 0.12,
      dragMoveGain: 2.1,
      scrollBoost: 0.018,
      focusChargeThreshold: 0.54,
      chargedThreshold: 0.9,
      turbulenceChargeThreshold: 0.98,
      touchLongPressMs: 460,
    },
    readability: {
      padX: 56,
      padY: 42,
      energyClamp: 0.42,
      volumetricClamp: 0.58,
      bloomClamp: 0.16,
      densityBias: 0.78,
    },
    desktopFx: {
      softFrameBudgetMs: 18.5,
      softPostBudgetMs: 8.0,
      hardFrameBudgetMs: 21.5,
      hardPostBudgetMs: 10.5,
      upgradeFrameBudgetMs: 16.2,
      upgradePostBudgetMs: 6.8,
      recoverFrameBudgetMs: 15.4,
      recoverPostBudgetMs: 6.0,
      degradeHoldMs: 2200,
      disableHoldMs: 2600,
      upgradeHoldMs: 5200,
      recoverHoldMs: 6200,
      profiles: {
        'desktop-scatter': {
          sampleScale: 1.0,
          intensityScale: 1.0,
          pointOpacityScale: 1.0,
          shaftStepCount: 6,
          shaftStrength: 1.0,
        },
        'desktop-base': {
          sampleScale: 0.58,
          intensityScale: 0.66,
          pointOpacityScale: 0.74,
          shaftStepCount: 4,
          shaftStrength: 0.74,
        },
        disabled: {
          sampleScale: 0.0,
          intensityScale: 0.0,
          pointOpacityScale: 0.0,
          shaftStepCount: 0,
          shaftStrength: 0.0,
        },
      },
    },
    timing: {
      motionBands: {
        micro: { min: 400, max: 1500 },
        ambient: { min: 3000, max: 8000 },
        composition: { min: 12000, max: 20000 },
      },
      hintDelayMs: 3600,
      hintDismissMs: 5200,
      gatherMs: 180,
      releaseMs: 320,
      recoverMs: 920,
      settleMs: 760,
      fixedStepMs: 1000 / 60,
      maxStepAccumulationMs: 1000 / 15,
    },
    choreography: {
      laneRadius: 2.25,
      lanePull: 0.00098,
      laneFlow: 0.00118,
      bypassLift: 0.00086,
      orbitRadius: 2.35,
      orbitPull: 0.00108,
      orbitSpin: 0.00154,
      pointerTrailRadius: 1.55,
      pointerTrailPull: 0.00116,
      pointerTrailFlow: 0.00148,
      toolWakeStrength: 0.00122,
      floorRibbonStrength: 0.00112,
      atmosphericPulse: 0.00106,
    },
    tiers: {
      desktop: {
        speciesCounts: { flowRibbon: 320, cloudMote: 2400, microDust: 3400, sparkFilament: 260 },
        bloom: { strength: 0.27, radius: 0.40, threshold: 0.72 },
      },
      mobile: {
        speciesCounts: { flowRibbon: 80, cloudMote: 1260, microDust: 420, sparkFilament: 150 },
        bloom: { strength: 0.19, radius: 0.28, threshold: 0.79 },
      },
      low: {
        speciesCounts: { flowRibbon: 0, cloudMote: 520, microDust: 0, sparkFilament: 90 },
        bloom: { strength: 0.14, radius: 0.24, threshold: 0.83 },
      },
    },
  };

  const PARTICLE_SPECIES = [
    {
      id: 'flowRibbon',
      label: 'Flow Ribbon',
      renderPath: 'ribbon',
      fallbackTier: 'desktop',
      range: 9.5,
      baseSize: 0.16,
      lifetime: { min: 1400, max: 2600 },
      trailLength: 8,
      bloom: true,
      collisionMask: ['tools', 'title', 'floor'],
      colorRamp: ['#473119', '#d88d2c', '#fff0cc'],
      behavior: {
        stateEnvelope: { idle: 0.52, focus: 0.86, charged: 1.08, release: 1.24, recover: 0.76 },
        curl: 1.18,
        convection: 0.82,
        pointerWake: 0.42,
        entropy: 0.22,
        clump: 0.68,
        releaseSpread: 1.18,
        deflection: 1.22,
        opacity: 0.84,
        scale: 1.0,
        textGuard: 1.32,
      },
    },
    {
      id: 'cloudMote',
      label: 'Cloud Mote',
      renderPath: 'shader',
      fallbackTier: 'all',
      range: 14,
      baseSize: 0.070,
      lifetime: { min: 2600, max: 6200 },
      trailLength: 3,
      bloom: true,
      collisionMask: ['tools', 'title', 'floor'],
      colorRamp: ['#2d2014', '#c78e42', '#f4dfb7'],
      behavior: {
        stateEnvelope: { idle: 0.58, focus: 0.78, charged: 0.98, release: 1.08, recover: 0.74 },
        curl: 0.84,
        convection: 1.12,
        pointerWake: 0.28,
        entropy: 0.20,
        clump: 1.16,
        releaseSpread: 0.92,
        deflection: 1.04,
        opacity: 0.82,
        scale: 1.04,
        textGuard: 1.14,
      },
    },
    {
      id: 'microDust',
      label: 'Micro Dust',
      renderPath: 'shader',
      fallbackTier: 'desktop',
      range: 15,
      baseSize: 0.026,
      lifetime: { min: 2200, max: 5200 },
      trailLength: 2,
      bloom: false,
      collisionMask: ['tools', 'title'],
      colorRamp: ['#4b3825', '#dfb165', '#fff3d8'],
      behavior: {
        stateEnvelope: { idle: 0.44, focus: 0.70, charged: 0.92, release: 1.12, recover: 0.58 },
        curl: 1.28,
        convection: 0.54,
        pointerWake: 0.72,
        entropy: 0.18,
        clump: 0.52,
        releaseSpread: 1.14,
        deflection: 0.96,
        opacity: 0.68,
        scale: 0.96,
        textGuard: 0.78,
      },
    },
    {
      id: 'sparkFilament',
      label: 'Spark Filament',
      renderPath: 'points',
      fallbackTier: 'all',
      range: 7.5,
      baseSize: 0.036,
      lifetime: { min: 520, max: 1100 },
      trailLength: 2,
      bloom: true,
      collisionMask: ['tools', 'floor'],
      colorRamp: ['#5d6f96', '#ffd08e', '#ffffff'],
      behavior: {
        stateEnvelope: { idle: 0.28, focus: 0.58, charged: 1.02, release: 1.42, recover: 0.52 },
        curl: 1.06,
        convection: 0.48,
        pointerWake: 0.64,
        entropy: 0.16,
        clump: 0.32,
        releaseSpread: 1.52,
        deflection: 0.88,
        opacity: 0.88,
        scale: 1.10,
        textGuard: 0.42,
      },
    },
  ];
  const ACTIVE_SPECIES_COUNTS = SCENE_CONFIG.tiers[SCENE_CONFIG.qualityTier].speciesCounts;
  const ENERGY_STATES = { idle: 'idle', focus: 'focus', charged: 'charged', release: 'release', recover: 'recover' };
  const frameSamples = [];
  let energyState = ENERGY_STATES.idle;
  let energyReleaseAt = -Infinity;
  let energyRecoverUntil = -Infinity;
  let energyGatherUntil = -Infinity;
  let energySettleUntil = -Infinity;
  let interactionCharge = 0;
  let lastInteractionAt = performance.now();
  let hasSceneInteracted = false;
  let insideProtectedCorridor = false;
  let focusTarget = null;
  const speciesActivity = {};
  const readabilityWindow = { left: 0, top: 0, width: 0, height: 0, active: false };
  const SCENE_STATE = {
    focus: 0,
    gather: 0,
    release: 0,
    settle: 0,
    pointerWake: 0,
    scrollPhase: 0,
    readabilityBias: 0,
    interactionState: 'idle',
  };
  const LIGHT_CUES = {
    idle: { warm: 0.18, cool: 0.08, release: 0.0 },
    focus: { warm: 0.32, cool: 0.10, release: 0.0 },
    gather: { warm: 0.52, cool: 0.12, release: 0.06 },
    release: { warm: 0.74, cool: 0.34, release: 0.38 },
    settle: { warm: 0.38, cool: 0.12, release: 0.08 },
  };
  const simulationMetrics = { avgSimMs: 0, avgPostMs: 0 };
  let copyZoneDensity = 0;
  let volumetricScatterIntensity = 0;
  let volumetricScatterSamples = 0;
  const desktopFxState = {
    mode: 'disabled',
    overBudgetSince: 0,
    underBudgetSince: performance.now(),
    lastModeChangeAt: 0,
    active: false,
  };
  const atmosphereMetrics = {
    vortex: 0,
    titleHalo: 0,
    foreground: 0,
    floor: 0,
    sawWake: 0,
    copy: 0,
  };
  const toolWakeState = { hammer: 0, wrench: 0, saw: 0 };
  const POINTER_TRAIL_CAPACITY = SCENE_CONFIG.featureFlags.pointerTrail ? 7 : 0;
  const pointerTrail = Array.from({ length: POINTER_TRAIL_CAPACITY }, () => ({
    x: 0,
    y: 0,
    z: 0,
    dx: 0.01,
    dy: 0,
    dz: 0,
    strength: 0,
    age: 1,
  }));
  let pointerTrailHead = -1;
  let lastPointerTrailCommit = 0;

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
  const _isMobilePost = SCENE_CONFIG.qualityTier !== 'desktop';
  let composer = null;
  let bloomPass = null;
  let copyPass = null;
  let scatterPass = null;
  let densityRenderTarget = null;
  let densityScene = null;
  let densityCamera = null;
  let densityPoints = null;
  let densityPointMaterial = null;
  let densityPointPositions = null;
  let densityPointSizes = null;
  let densityPointColors = null;
  let densityPointCapacity = 0;

  const canvas = renderer.domElement;
  canvas.id = 'three-canvas';
  canvas.setAttribute('aria-hidden', 'true');
  canvas.style.cursor = 'default';
  document.body.insertBefore(canvas, document.body.firstChild);

  if (!(window.__sceneAssetsReady instanceof Promise)) {
    window.__sceneAssetsReady = new Promise((resolve) => {
      window.__resolveSceneAssetsReady = resolve;
    });
  }

  let bootHealthy = false;
  let renderedFrameCount = 0;
  let assetMode = 'procedural';

  /* ─── Scene ───────────────────────────────────────────── */
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x030405); // near-black — tools emerge from darkness
  scene.fog = new THREE.FogExp2(0x050810, 0.055); // raised density for depth separation — pushes bg debris into murk, slight blue tint matches fill light

  // Real IBL via PMREMGenerator — gradient equirectangular env map matching warm/cool palette
  const pmrem = new THREE.PMREMGenerator(renderer);
  pmrem.compileEquirectangularShader();

  const envCvs = document.createElement('canvas');
  envCvs.width = 1024; envCvs.height = 512;
  const ec = envCvs.getContext('2d');

  // Sky: deep dark blue-black gradient (top to horizon)
  const skyGrad = ec.createLinearGradient(0, 0, 0, 256);
  skyGrad.addColorStop(0, '#071018');
  skyGrad.addColorStop(1, '#0d1a2e');
  ec.fillStyle = skyGrad; ec.fillRect(0, 0, 1024, 256);

  // Floor: dark warm-brown gradient (horizon to bottom)
  const flrGrad = ec.createLinearGradient(0, 256, 0, 512);
  flrGrad.addColorStop(0, '#1a0d04');
  flrGrad.addColorStop(1, '#070503');
  ec.fillStyle = flrGrad; ec.fillRect(0, 256, 1024, 256);

  // Key light spot: warm amber radial blob — upper left (~camera key light position)
  const keySpot = ec.createRadialGradient(192, 128, 0, 192, 128, 280);
  keySpot.addColorStop(0,   'rgba(200,110,20,0.85)');
  keySpot.addColorStop(0.5, 'rgba(140,70,10,0.35)');
  keySpot.addColorStop(1,   'rgba(0,0,0,0)');
  ec.fillStyle = keySpot; ec.fillRect(0, 0, 1024, 512);

  // Fill light spot: cool blue radial blob — upper right
  const fillSpot = ec.createRadialGradient(840, 160, 0, 840, 160, 240);
  fillSpot.addColorStop(0,   'rgba(20,40,90,0.20)');
  fillSpot.addColorStop(1,   'rgba(0,0,0,0)');
  ec.fillStyle = fillSpot; ec.fillRect(0, 0, 1024, 512);

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
    #scene-grade {
      position: fixed; inset: 0; pointer-events: none; z-index: 1;
      background:
        radial-gradient(circle at 50% 46%, rgba(242,182,86,0.16), transparent 42%),
        linear-gradient(180deg, rgba(40,72,122,0.20) 0%, rgba(9,11,16,0) 30%, rgba(40,17,5,0.22) 100%);
      mix-blend-mode: screen;
      opacity: 0.72;
      transition: opacity 280ms ease;
    }
    #scene-copy-shield {
      position: fixed;
      left: 0;
      top: 0;
      width: 0;
      height: 0;
      pointer-events: none;
      z-index: 1;
      opacity: 0;
      border-radius: 36px;
      background:
        radial-gradient(ellipse at 40% 44%, rgba(7, 10, 16, 0.78) 0%, rgba(7, 10, 16, 0.38) 46%, rgba(7, 10, 16, 0) 86%),
        linear-gradient(135deg, rgba(8, 11, 18, 0.66), rgba(8, 11, 18, 0.06));
      box-shadow: inset 0 0 0 1px rgba(92, 132, 196, 0.08);
      transition: opacity 220ms ease, transform 260ms ease;
      transform: scale(0.98);
      backdrop-filter: blur(8px);
    }
    #scene-gesture-hint {
      position: fixed;
      left: 50%;
      bottom: 8.5%;
      transform: translate(-50%, 12px);
      z-index: 9;
      pointer-events: none;
      padding: 10px 16px;
      border: 1px solid rgba(104, 156, 212, 0.28);
      border-radius: 999px;
      background: rgba(6, 10, 18, 0.78);
      color: rgba(226, 236, 246, 0.86);
      font: 600 12px/1 "DM Sans", system-ui, sans-serif;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.24);
      opacity: 0;
      visibility: hidden;
      transition: opacity 260ms ease, transform 260ms ease;
      backdrop-filter: blur(14px);
    }
    #scene-gesture-hint.visible {
      opacity: 1;
      visibility: visible;
      transform: translate(-50%, 0);
    }
    #scene-charge-ring {
      position: fixed;
      left: 0;
      top: 0;
      width: 56px;
      height: 56px;
      margin-left: -28px;
      margin-top: -28px;
      border-radius: 50%;
      pointer-events: none;
      z-index: 8;
      border: 1px solid rgba(244, 204, 126, 0.58);
      box-shadow: 0 0 0 1px rgba(69, 136, 204, 0.14), 0 0 28px rgba(239, 176, 84, 0.22);
      background: radial-gradient(circle, rgba(241, 182, 92, 0.18) 0%, rgba(41, 86, 142, 0.06) 54%, rgba(0, 0, 0, 0) 72%);
      opacity: 0;
      transform: translate3d(-999px, -999px, 0) scale(0.55);
      transition: opacity 180ms ease;
    }
    #tool-info-panel {
      border-left: 1px solid rgba(241, 180, 88, 0.42) !important;
      box-shadow: -18px 0 48px rgba(0,0,0,0.32), inset 0 0 0 1px rgba(241, 180, 88, 0.05) !important;
      clip-path: none;
    }
    @keyframes panelBorderFill {
      from { background-size: 0% 2px; }
      to   { background-size: 100% 2px; }
    }
    #tool-info-panel::before {
      content:''; position:absolute; top:0; left:4px; right:0; height:2px;
      background: linear-gradient(90deg, rgba(241,180,88,0.78), rgba(96,128,172,0.18));
      background-size: 0% 2px; background-repeat: no-repeat;
      animation: panelBorderFill 0.35s ease 0.1s forwards;
    }
    @media print { #scene-vignette, #scene-grade, #scene-copy-shield, #scene-gesture-hint, #scene-charge-ring { display:none !important; } }
    @media (max-width: 767px) {
      #tool-info-panel { display: none !important; }
      #tool-tooltip { display: none !important; }
      #scene-gesture-hint {
        bottom: 11%;
        max-width: 90vw;
        text-align: center;
        letter-spacing: 0.08em;
      }
    }
  `;
  document.head.appendChild(vignetteStyle);

  const vignette = document.createElement('div');
  vignette.id = 'scene-vignette';
  document.body.insertBefore(vignette, document.body.firstChild);

  const sceneGrade = document.createElement('div');
  sceneGrade.id = 'scene-grade';
  document.body.insertBefore(sceneGrade, vignette.nextSibling);

  const copyShield = document.createElement('div');
  copyShield.id = 'scene-copy-shield';
  document.body.insertBefore(copyShield, sceneGrade.nextSibling);

  const gestureHint = document.createElement('div');
  gestureHint.id = 'scene-gesture-hint';
  gestureHint.textContent = 'Drag a tool or tap the dust field';
  document.body.appendChild(gestureHint);

  const chargeRing = document.createElement('div');
  chargeRing.id = 'scene-charge-ring';
  document.body.appendChild(chargeRing);

  /* ─── Camera ──────────────────────────────────────────── */
  const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 50);
  camera.position.set(0, 0, 6);
  const projectionScratch = new THREE.Vector3();
  const heroContent = document.querySelector('.hero__content');

  /* ─── EffectComposer + UnrealBloomPass (after camera) ─── */
  if (CAN_RUN_DESKTOP_POST && typeof THREE.EffectComposer !== 'undefined') {
    composer = new THREE.EffectComposer(renderer);
    composer.addPass(new THREE.RenderPass(scene, camera));

    bloomPass = new THREE.UnrealBloomPass(
      new THREE.Vector2(window.innerWidth, window.innerHeight),
      SCENE_CONFIG.tiers[SCENE_CONFIG.qualityTier].bloom.strength,
      SCENE_CONFIG.tiers[SCENE_CONFIG.qualityTier].bloom.radius,
      SCENE_CONFIG.tiers[SCENE_CONFIG.qualityTier].bloom.threshold
    );
    composer.addPass(bloomPass);
    copyPass = new THREE.ShaderPass(THREE.CopyShader);
    copyPass.renderToScreen = true; // direct canvas blit — eliminates extra FBO read-back that causes stripe artifacts
    composer.addPass(copyPass);
  }

  // The DOM hero content owns all messaging; the scene only owns visual overlays.

  /* ─── Lights ──────────────────────────────────────────── */
  // Minimal ambient — scene is dark, lights sculpt the form
  const ambientLight = new THREE.AmbientLight(0x06080e, 0.045);
  scene.add(ambientLight);

  // ── KEY LIGHT: large warm amber RectAreaLight — upper left, main sculpting light
  const keyLight = new THREE.RectAreaLight(0xf0920c, 0.22, 5.4, 4.8);
  keyLight.position.set(-4.6, 5.8, 5.2);
  keyLight.lookAt(-0.3, 0.6, 0.6);
  scene.add(keyLight);

  // ── FILL LIGHT: cool blue RectAreaLight — right side, lower intensity
  const fillLight = new THREE.RectAreaLight(0x2255bb, 0.17, 3.6, 5.6);
  fillLight.position.set(5.1, 0.2, 2.8);
  fillLight.lookAt(0.9, 0.4, 0.2);
  scene.add(fillLight);

  // ── RIM / BACK LIGHT: neutral cool, overhead-rear — edge separation
  const rimAreaLight = new THREE.RectAreaLight(0x7799cc, 0.14, 6.6, 1.9);
  rimAreaLight.position.set(0.2, 6.9, -4.1);
  rimAreaLight.lookAt(0, 0.4, 1.1);
  scene.add(rimAreaLight);

  // ── FLOOR BOUNCE: warm amber point from below — fills in under-shadows
  const groundGlow = new THREE.PointLight(0xb06010, 0.12, 12);
  groundGlow.position.set(-0.4, -2.2, 2.2);
  scene.add(groundGlow);

  // ── STATIC METAL ACCENT: warm amber point — keeps metals alive without flattening the scene
  const orbitLight = new THREE.PointLight(0xd4820a, 0.10, 18);
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

  // ── FLOOR RIM LIGHT: dramatic under-lighting burst on implosion ──
  const floorRimLight = new THREE.PointLight(0x4488cc, 0, 14);
  floorRimLight.position.set(0, -2.0, 1.5);
  scene.add(floorRimLight);

  /* ─── Helpers ─────────────────────────────────────────── */
  function rand(min, max) {
    return min + Math.random() * (max - min);
  }

  function clamp01(value) {
    return Math.max(0, Math.min(1, value));
  }

  function pulse(value, attack, decay) {
    return value < attack
      ? value / Math.max(attack, 0.0001)
      : Math.max(0, 1 - (value - attack) / Math.max(decay, 0.0001));
  }

  function markInteraction(boost) {
    lastInteractionAt = performance.now();
    interactionCharge = Math.min(1, interactionCharge + boost);
    if (boost >= 0.05) hasSceneInteracted = true;
    gestureHint.classList.remove('visible');
  }

  function getEnergyStateValue() {
    if (energyState === ENERGY_STATES.focus) return 0.34;
    if (energyState === ENERGY_STATES.charged) return 0.72;
    if (energyState === ENERGY_STATES.release) return 1.0;
    if (energyState === ENERGY_STATES.recover) return 0.4;
    return 0.12;
  }

  function getChargeLevel() {
    const wakeCharge = clamp01(VORTEX_PARAMS.pointerWake * 0.68);
    const turbulenceCharge = clamp01((VORTEX_PARAMS.turbulenceMode - 0.34) / 0.66) * 0.24;
    const stateBoost = energyState === ENERGY_STATES.release ? 0.18 : (energyState === ENERGY_STATES.recover ? 0.04 : 0);
    return clamp01(Math.max(interactionCharge, wakeCharge, turbulenceCharge) + stateBoost);
  }

  function getReleaseProgress(now) {
    if (now < energyReleaseAt || energyState !== ENERGY_STATES.release) return 0;
    return pulse((now - energyReleaseAt) / SCENE_CONFIG.timing.releaseMs, 0.18, 0.82);
  }

  function getGatherProgress(now) {
    if (energyGatherUntil <= 0 || now >= energyGatherUntil) return 0;
    const start = energyGatherUntil - SCENE_CONFIG.timing.gatherMs;
    return clamp01((now - start) / SCENE_CONFIG.timing.gatherMs);
  }

  function getSettleProgress(now) {
    if (energySettleUntil <= energyRecoverUntil || now < energyRecoverUntil || now > energySettleUntil) return 0;
    return clamp01(1 - (energySettleUntil - now) / SCENE_CONFIG.timing.settleMs);
  }

  function getLayerEnvelope(layer, releaseProgress = 0) {
    const envelope = layer.behavior?.stateEnvelope || {};
    if (energyState === ENERGY_STATES.release) {
      return THREE.MathUtils.lerp(envelope.recover || 0.6, envelope.release || 1.0, releaseProgress);
    }
    if (energyState === ENERGY_STATES.recover) return envelope.recover || 0.6;
    if (energyState === ENERGY_STATES.charged) return envelope.charged || 1.0;
    if (energyState === ENERGY_STATES.focus) return envelope.focus || 0.75;
    return envelope.idle || 0.5;
  }

  function getFocusTarget() {
    return dragTool || activePanelTool || hoveredTool || VORTEX_PARAMS.proximityTool || null;
  }

  function projectWorldToScreen(x, y, z = 0) {
    projectionScratch.set(x, y, z).project(camera);
    return {
      x: (projectionScratch.x + 1) * 0.5 * window.innerWidth,
      y: (-projectionScratch.y + 1) * 0.5 * window.innerHeight,
    };
  }

  function updateReadabilityWindow() {
    if (!heroContent) {
      readabilityWindow.left = 0;
      readabilityWindow.top = 0;
      readabilityWindow.width = 0;
      readabilityWindow.height = 0;
      readabilityWindow.active = false;
      return;
    }
    const rect = heroContent.getBoundingClientRect();
    const left = Math.max(0, rect.left - SCENE_CONFIG.readability.padX);
    const top = Math.max(0, rect.top - SCENE_CONFIG.readability.padY);
    const right = Math.min(window.innerWidth, rect.right + SCENE_CONFIG.readability.padX);
    const bottom = Math.min(window.innerHeight, rect.bottom + SCENE_CONFIG.readability.padY);
    readabilityWindow.left = Math.round(left);
    readabilityWindow.top = Math.round(top);
    readabilityWindow.width = Math.max(0, Math.round(right - left));
    readabilityWindow.height = Math.max(0, Math.round(bottom - top));
    readabilityWindow.active = rect.bottom > 0 && rect.top < window.innerHeight && readabilityWindow.width > 0 && readabilityWindow.height > 0;
  }

  function updateEnergyState(now) {
    if (now < energyGatherUntil) {
      energyState = ENERGY_STATES.charged;
      return;
    }
    if (now >= energyReleaseAt && now < energyReleaseAt + SCENE_CONFIG.timing.releaseMs) {
      energyState = ENERGY_STATES.release;
      return;
    }
    if (now < energySettleUntil) {
      energyState = ENERGY_STATES.recover;
      return;
    }
    const chargeLevel = getChargeLevel();
    if (
      dragTool
      || chargeLevel > SCENE_CONFIG.interaction.chargedThreshold
      || (VORTEX_PARAMS.pointerWake > 0.86 && interactionCharge > 0.52)
      || VORTEX_PARAMS.turbulenceMode > SCENE_CONFIG.interaction.turbulenceChargeThreshold
    ) {
      energyState = ENERGY_STATES.charged;
      return;
    }
    if (hoveredTool || activePanelTool || VORTEX_PARAMS.proximityStrength > 0.22 || chargeLevel > SCENE_CONFIG.interaction.focusChargeThreshold) {
      energyState = ENERGY_STATES.focus;
      return;
    }
    energyState = ENERGY_STATES.idle;
  }

  function triggerReleasePulse(boost, durationMs) {
    const now = performance.now();
    markInteraction(boost);
    energyGatherUntil = now + SCENE_CONFIG.timing.gatherMs;
    energyReleaseAt = energyGatherUntil;
    energyRecoverUntil = energyReleaseAt + SCENE_CONFIG.timing.releaseMs + (durationMs || SCENE_CONFIG.timing.recoverMs);
    energySettleUntil = energyRecoverUntil + SCENE_CONFIG.timing.settleMs;
    if (boost >= 0.4 && !prefersReduced) {
      cameraTrauma = Math.max(cameraTrauma, Math.min(0.14, boost * 0.15));
    }
  }

  function averageFrameMs() {
    if (!frameSamples.length) return 0;
    return frameSamples.reduce((sum, value) => sum + value, 0) / frameSamples.length;
  }

  function getDesktopFxProfile(mode = desktopFxState.mode) {
    return SCENE_CONFIG.desktopFx.profiles[mode] || SCENE_CONFIG.desktopFx.profiles.disabled;
  }

  function setDesktopFxMode(mode, nowMs) {
    if (desktopFxState.mode === mode) return;
    desktopFxState.mode = mode;
    desktopFxState.lastModeChangeAt = nowMs;
    desktopFxState.overBudgetSince = 0;
    desktopFxState.underBudgetSince = nowMs;
  }

  function updateDesktopFxMode(nowMs) {
    if (!scatterPass) {
      desktopFxState.mode = 'disabled';
      desktopFxState.active = false;
      return;
    }

    if (SCENE_TEST_OVERRIDES.disablePerfAutoDowngrade) {
      desktopFxState.mode = 'desktop-scatter';
      desktopFxState.active = true;
      return;
    }

    const frameMs = averageFrameMs();
    const postMs = simulationMetrics.avgPostMs;
    if (frameMs <= 0) return;

    const fxConfig = SCENE_CONFIG.desktopFx;
    const softOverBudget = frameMs > fxConfig.softFrameBudgetMs || postMs > fxConfig.softPostBudgetMs;
    const hardOverBudget = frameMs > fxConfig.hardFrameBudgetMs || postMs > fxConfig.hardPostBudgetMs;
    const upgradeBudget = frameMs < fxConfig.upgradeFrameBudgetMs && postMs < fxConfig.upgradePostBudgetMs;
    const recoverBudget = frameMs < fxConfig.recoverFrameBudgetMs && postMs < fxConfig.recoverPostBudgetMs;

    if (softOverBudget) {
      if (!desktopFxState.overBudgetSince) desktopFxState.overBudgetSince = nowMs;
      desktopFxState.underBudgetSince = 0;
    } else {
      desktopFxState.overBudgetSince = 0;
      if (!desktopFxState.underBudgetSince) desktopFxState.underBudgetSince = nowMs;
    }

    if (desktopFxState.mode === 'desktop-scatter') {
      if (softOverBudget && desktopFxState.overBudgetSince && nowMs - desktopFxState.overBudgetSince >= fxConfig.degradeHoldMs) {
        setDesktopFxMode('desktop-base', nowMs);
      }
      return;
    }

    if (desktopFxState.mode === 'desktop-base') {
      if (hardOverBudget && desktopFxState.overBudgetSince && nowMs - desktopFxState.overBudgetSince >= fxConfig.disableHoldMs) {
        setDesktopFxMode('disabled', nowMs);
        return;
      }
      if (upgradeBudget && desktopFxState.underBudgetSince && nowMs - desktopFxState.underBudgetSince >= fxConfig.upgradeHoldMs) {
        setDesktopFxMode('desktop-scatter', nowMs);
      }
      return;
    }

    if (recoverBudget && desktopFxState.underBudgetSince && nowMs - desktopFxState.underBudgetSince >= fxConfig.recoverHoldMs) {
      setDesktopFxMode('desktop-base', nowMs);
    }
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
  const steelMat = new THREE.MeshPhysicalMaterial({
    color: 0x5a5a62,
    roughness: 0.08,
    metalness: 0.97,
    envMapIntensity: 0.7,
    clearcoat: 0.24,
    clearcoatRoughness: 0.12,
  });

  // Dark rubber grip — hammer handle and wrench grip zones
  const darkMat = new THREE.MeshPhysicalMaterial({
    color: 0x181410,
    roughness: 0.75,
    metalness: 0.12,
    clearcoat: 0.04,
    clearcoatRoughness: 0.4,
  });

  // Polished chrome — wrench jaw and saw blade body
  const chromeMat = new THREE.MeshPhysicalMaterial({
    color: 0xf2f0ea,
    roughness: 0.02,
    metalness: 0.99,
    envMapIntensity: 0.8,
    clearcoat: 0.28,
    clearcoatRoughness: 0.08,
  });

  // Amber emissive — for saw blade hub and highlights
  const amberEmissiveMat = new THREE.MeshPhysicalMaterial({
    color: 0xff8800,
    roughness: 0.1,
    metalness: 0.0,
    emissive: new THREE.Color(0xff6600),
    emissiveIntensity: 1.4,   // bloom-safe sweet spot — hub glows hot amber, not blown white
    transparent: true,
    opacity: 1.0,
    clearcoat: 0.18,
    clearcoatRoughness: 0.18,
  });

  // Gunmetal — tape measure housing
  const gunmetalMat = new THREE.MeshPhysicalMaterial({
    color: 0x3a3830,
    roughness: 0.28,
    metalness: 0.82,
    transparent: true,
    opacity: 1.0,
    clearcoat: 0.22,
    clearcoatRoughness: 0.16,
  });
  gunmetalMat.envMapIntensity = 0.8;

  // Yellow tape — tape measure band
  const tapeBandMat = new THREE.MeshPhysicalMaterial({
    color: 0xd4a012,
    roughness: 0.55,
    metalness: 0.45,
    transparent: true,
    opacity: 1.0,
    clearcoat: 0.16,
    clearcoatRoughness: 0.22,
  });
  tapeBandMat.envMapIntensity = 0.4;

  // Warm wood — hammer handle
  const woodMat = new THREE.MeshPhysicalMaterial({
    color: 0xc8952a,
    roughness: 0.85,
    metalness: 0.0,
    transparent: true,
    opacity: 1.0,
    clearcoat: 0.08,
    clearcoatRoughness: 0.55,
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
  particleTex.minFilter = THREE.LinearFilter;
  particleTex.magFilter = THREE.LinearFilter;

  function getSpeciesDef(id) {
    return PARTICLE_SPECIES.find((species) => species.id === id);
  }

  function seeded01(seed) {
    const value = Math.sin(seed * 127.1 + 311.7) * 43758.5453123;
    return value - Math.floor(value);
  }

  function seededSigned(seed) {
    return seeded01(seed) * 2 - 1;
  }

  function seededRange(seed, min, max) {
    return min + (max - min) * seeded01(seed);
  }

  function createParticleShaderMaterial(species, config) {
    return new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uEnergy: { value: 0 },
        uPixelRatio: { value: renderer.getPixelRatio() },
        uOpacity: { value: config.opacity },
        uScale: { value: config.scale },
        uStretch: { value: config.stretch },
        uDepthFade: { value: config.depthFade },
        uRing: { value: config.ring },
        uCool: { value: new THREE.Color(species.colorRamp[0]) },
        uWarm: { value: new THREE.Color(species.colorRamp[1]) },
        uHot: { value: new THREE.Color(species.colorRamp[2]) },
      },
      vertexShader: `
        uniform float uTime;
        uniform float uEnergy;
        uniform float uPixelRatio;
        uniform float uScale;
        uniform float uStretch;
        uniform float uDepthFade;
        attribute float aSize;
        attribute float aPhase;
        attribute float aTemperature;
        attribute float aCharge;
        attribute vec3 aVelocity;
        varying float vAlpha;
        varying float vTemp;
        varying float vGlow;
        varying float vCharge;
        void main() {
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          float speed = length(aVelocity);
          float shimmer = 0.82 + 0.18 * sin(uTime * 1.4 + aPhase * 6.28318);
          float depthFactor = clamp(1.0 - max(0.0, -mvPosition.z - 1.0) * uDepthFade, 0.25, 1.0);
          float energyLift = uEnergy * (0.34 + speed * uStretch * 0.6) + aCharge * 0.32;
          float size = aSize * uScale * (1.0 + speed * uStretch + energyLift) * shimmer;
          gl_PointSize = max(1.0, size * uPixelRatio * (280.0 / max(1.0, -mvPosition.z)));
          gl_Position = projectionMatrix * mvPosition;
          vTemp = clamp(aTemperature + uEnergy * 0.18 + aCharge * 0.12, 0.0, 1.0);
          vGlow = clamp(speed * 8.0 + uEnergy * 0.8 + aCharge * 0.55, 0.0, 1.6);
          vAlpha = depthFactor;
          vCharge = aCharge;
        }
      `,
      fragmentShader: `
        uniform vec3 uCool;
        uniform vec3 uWarm;
        uniform vec3 uHot;
        uniform float uOpacity;
        uniform float uRing;
        varying float vAlpha;
        varying float vTemp;
        varying float vGlow;
        varying float vCharge;
        void main() {
          vec2 uv = gl_PointCoord * 2.0 - 1.0;
          float dist = dot(uv, uv);
          if (dist > 1.0) discard;
          float radial = pow(1.0 - dist, 1.55);
          float core = smoothstep(0.34, 0.0, dist);
          float halo = smoothstep(1.0, 0.12, dist) * (1.0 - core);
          vec3 baseColor = mix(uCool, uWarm, clamp(vTemp * 1.15, 0.0, 1.0));
          vec3 color = mix(baseColor, uHot, clamp(vTemp * 0.85 + vGlow * 0.12 + vCharge * 0.22, 0.0, 1.0));
          float alpha = (radial * 0.9 + halo * uRing + core * 0.35) * uOpacity * vAlpha * (0.88 + vCharge * 0.42);
          if (alpha < 0.01) discard;
          gl_FragColor = vec4(color * (0.7 + core * 0.8 + vGlow * 0.15), alpha);
        }
      `,
      transparent: true,
      depthWrite: false,
      depthTest: true,
      blending: THREE.AdditiveBlending,
    });
  }

  function createRibbonMaterial(species) {
    return new THREE.MeshBasicMaterial({
      map: particleTex,
      color: new THREE.Color(species.colorRamp[1]),
      transparent: true,
      opacity: species.behavior?.opacity || 0.78,
      depthWrite: false,
      depthTest: true,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      vertexColors: true,
    });
  }

  function initializeParticle(system, index) {
    const species = system.species;
    const ix = index * 3;
    const seed = index * 17.173 + species.range * 3.11 + species.baseSize * 41.0;
    const emitterX = seededRange(seed + 0.2, -4.2, -1.6);
    const emitterY = seededRange(seed + 0.6, 1.4, 4.1);
    const emitterZ = seededRange(seed + 1.1, -0.6, 1.5);

    if (species.id === 'flowRibbon') {
      system.positions[ix] = emitterX;
      system.positions[ix + 1] = emitterY;
      system.positions[ix + 2] = emitterZ;
      system.velocities[ix] = seededRange(seed + 1.8, 0.010, 0.026);
      system.velocities[ix + 1] = seededRange(seed + 2.2, -0.006, 0.012);
      system.velocities[ix + 2] = seededRange(seed + 2.8, -0.006, 0.006);
      system.charges[index] = seededRange(seed + 3.4, 0.18, 0.42);
      system.temperatures[index] = seededRange(seed + 3.8, 0.54, 0.92);
    } else if (species.id === 'sparkFilament') {
      system.positions[ix] = seededRange(seed + 0.4, -1.2, 1.5);
      system.positions[ix + 1] = seededRange(seed + 0.8, -1.0, 2.6);
      system.positions[ix + 2] = seededRange(seed + 1.2, -0.4, 1.4);
      system.velocities[ix] = seededRange(seed + 1.7, -0.008, 0.020);
      system.velocities[ix + 1] = seededRange(seed + 2.4, -0.010, 0.010);
      system.velocities[ix + 2] = seededRange(seed + 3.1, -0.006, 0.006);
      system.charges[index] = seededRange(seed + 3.7, 0.24, 0.58);
      system.temperatures[index] = seededRange(seed + 4.0, 0.72, 1.0);
    } else {
      const theta = seededRange(seed + 0.5, 0, Math.PI * 2);
      const phi = Math.acos(seededRange(seed + 1.1, -1, 1));
      const radius = seededRange(seed + 1.6, 0.8, Math.min(species.range, 12.4));
      system.positions[ix] = radius * Math.sin(phi) * Math.cos(theta) + seededRange(seed + 2.2, -0.8, 0.4);
      system.positions[ix + 1] = radius * Math.sin(phi) * Math.sin(theta) + seededRange(seed + 2.5, -0.2, 0.8);
      system.positions[ix + 2] = radius * Math.cos(phi) * 0.42;
      system.velocities[ix] = seededRange(seed + 3.1, -0.0014, 0.0018);
      system.velocities[ix + 1] = seededRange(seed + 3.5, -0.0010, 0.0016);
      system.velocities[ix + 2] = seededRange(seed + 4.0, -0.0006, 0.0008);
      system.charges[index] = seededRange(seed + 4.4, 0.02, 0.18);
      system.temperatures[index] = species.id === 'cloudMote'
        ? seededRange(seed + 4.8, 0.34, 0.74)
        : seededRange(seed + 4.8, 0.42, 0.94);
    }

    if (species.id !== 'sparkFilament') {
      const copyDx = system.positions[ix] + 0.35;
      const copyDy = system.positions[ix + 1] - 0.25;
      const copyDz = system.positions[ix + 2] - 0.65;
      if (Math.abs(copyDx) < 2.9 && Math.abs(copyDy) < 2.4 && Math.abs(copyDz) < 1.7) {
        const spawnSide = copyDx >= 0 ? 1 : -1;
        system.positions[ix] += spawnSide * seededRange(seed + 8.4, 1.4, 2.8);
        system.positions[ix + 1] += seededRange(seed + 8.8, 0.6, 1.6);
        system.positions[ix + 2] += seededRange(seed + 9.2, 0.2, 0.8);
        system.velocities[ix] += spawnSide * seededRange(seed + 9.5, 0.002, 0.006);
        system.velocities[ix + 1] += seededRange(seed + 9.8, 0.001, 0.004);
        system.velocities[ix + 2] += seededRange(seed + 10.1, 0.0004, 0.0018);
      }
    }

    system.positions[ix] = THREE.MathUtils.clamp(system.positions[ix], -14.2, 14.2);
    system.positions[ix + 1] = THREE.MathUtils.clamp(system.positions[ix + 1], -8.8, 8.8);
    system.positions[ix + 2] = THREE.MathUtils.clamp(system.positions[ix + 2], -4.4, 4.4);

    system.prevPositions[ix] = system.positions[ix];
    system.prevPositions[ix + 1] = system.positions[ix + 1];
    system.prevPositions[ix + 2] = system.positions[ix + 2];
    system.trailHeads[ix] = system.positions[ix];
    system.trailHeads[ix + 1] = system.positions[ix + 1];
    system.trailHeads[ix + 2] = system.positions[ix + 2];

    if (system.trailPositions) {
      const base = index * species.trailLength * 3;
      for (let t = 0; t < species.trailLength; t++) {
        const ti = base + t * 3;
        system.trailPositions[ti] = system.positions[ix];
        system.trailPositions[ti + 1] = system.positions[ix + 1];
        system.trailPositions[ti + 2] = system.positions[ix + 2];
      }
      system.trailHead[index] = 0;
    }

    system.sizes[index] = species.baseSize * seededRange(seed + 5.2, 0.72, 1.32);
    system.phases[index] = seeded01(seed + 5.7);
    system.lifetimes[index] = seededRange(seed + 6.2, species.lifetime.min, species.lifetime.max);
    system.ages[index] = seededRange(seed + 6.6, 0, system.lifetimes[index] * 0.85);
    system.speciesPhase[index] = seededRange(seed + 7.0, 0, Math.PI * 2);
    system.cohesion[index] = species.id === 'flowRibbon'
      ? seededRange(seed + 7.2, 0.58, 0.92)
      : (species.id === 'cloudMote' ? seededRange(seed + 7.2, 0.46, 0.82) : seededRange(seed + 7.2, 0.18, 0.54));
    system.adhesion[index] = species.id === 'cloudMote'
      ? seededRange(seed + 7.6, 0.22, 0.42)
      : (species.id === 'microDust' ? seededRange(seed + 7.6, 0.10, 0.22) : seededRange(seed + 7.6, 0.02, 0.14));
    system.wake[index] = seededRange(seed + 8.0, 0.04, 0.16);
  }

  function createParticleSystem(species, count) {
    if (!count) return null;

    const positions = new Float32Array(count * 3);
    const prevPositions = new Float32Array(count * 3);
    const trailHeads = new Float32Array(count * 3);
    const velocities = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    const phases = new Float32Array(count);
    const temperatures = new Float32Array(count);
    const charges = new Float32Array(count);
    const ages = new Float32Array(count);
    const lifetimes = new Float32Array(count);
    const speciesPhase = new Float32Array(count);
    const cohesion = new Float32Array(count);
    const adhesion = new Float32Array(count);
    const wake = new Float32Array(count);
    const trailHead = new Uint8Array(count);
    const trailPositions = species.trailLength > 1 ? new Float32Array(count * species.trailLength * 3) : null;

    const geo = species.renderPath === 'ribbon' ? null : new THREE.BufferGeometry();
    let material = null;
    let mesh = null;

    if (species.renderPath === 'ribbon') {
      material = createRibbonMaterial(species);
      mesh = new THREE.InstancedMesh(new THREE.PlaneGeometry(1, 1, 1, 1), material, count);
      mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
      mesh.frustumCulled = false;
      scene.add(mesh);
    } else {
      geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      geo.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));
      geo.setAttribute('aPhase', new THREE.BufferAttribute(phases, 1));
      geo.setAttribute('aTemperature', new THREE.BufferAttribute(temperatures, 1));
      geo.setAttribute('aVelocity', new THREE.BufferAttribute(velocities, 3));
      geo.setAttribute('aCharge', new THREE.BufferAttribute(charges, 1));

      if (species.renderPath === 'shader') {
        material = createParticleShaderMaterial(species, {
          opacity: (species.id === 'cloudMote' ? 0.36 : 0.22) * (species.behavior?.opacity || 1),
          scale: species.id === 'microDust' ? 0.92 : 1.0,
          stretch: species.id === 'microDust' ? 1.1 : 1.55,
          depthFade: species.id === 'microDust' ? 0.05 : 0.08,
          ring: species.id === 'microDust' ? 0.34 : 0.48,
        });
      } else {
        material = new THREE.PointsMaterial({
          map: particleTex,
          color: 0xffe7c1,
          size: species.baseSize,
          sizeAttenuation: true,
          transparent: true,
          opacity: 0.54,
          depthWrite: false,
          depthTest: true,
          alphaTest: 0.01,
          blending: THREE.AdditiveBlending,
        });
      }

      mesh = new THREE.Points(geo, material);
      mesh.frustumCulled = false;
      scene.add(mesh);
    }

    const system = {
      species,
      positions,
      prevPositions,
      trailHeads,
      velocities,
      sizes,
      phases,
      temperatures,
      charges,
      ages,
      lifetimes,
      speciesPhase,
      cohesion,
      adhesion,
      wake,
      trailHead,
      trailPositions,
      geo,
      material,
      mesh,
      count,
      velocityAttr: geo ? geo.getAttribute('aVelocity') : null,
      chargeAttr: geo ? geo.getAttribute('aCharge') : null,
      activity: 0,
      avgTrailLength: 0,
      bloomWeight: species.bloom ? 1 : 0,
      colorScratch: new THREE.Color(),
    };

    for (let i = 0; i < count; i++) {
      initializeParticle(system, i);
    }

    if (geo) {
      geo.attributes.position.needsUpdate = true;
      geo.attributes.aVelocity.needsUpdate = true;
      geo.attributes.aCharge.needsUpdate = true;
    }

    return system;
  }

  const flowRibbonSystem = createParticleSystem(getSpeciesDef('flowRibbon'), ACTIVE_SPECIES_COUNTS.flowRibbon);
  const cloudMoteSystem = createParticleSystem(getSpeciesDef('cloudMote'), ACTIVE_SPECIES_COUNTS.cloudMote);
  const microDustSystem = createParticleSystem(getSpeciesDef('microDust'), ACTIVE_SPECIES_COUNTS.microDust);
  const sparkFilamentSystem = createParticleSystem(getSpeciesDef('sparkFilament'), ACTIVE_SPECIES_COUNTS.sparkFilament);
  const simulatedParticleSystems = [flowRibbonSystem, cloudMoteSystem, microDustSystem, sparkFilamentSystem].filter(Boolean);
  const pulseParticleSystems = [flowRibbonSystem, cloudMoteSystem, microDustSystem, sparkFilamentSystem].filter(Boolean);
  const sparkMat = sparkFilamentSystem ? sparkFilamentSystem.material : null;
  const cloudParticleMat = cloudMoteSystem ? cloudMoteSystem.material : null;
  const microDustMat = microDustSystem ? microDustSystem.material : null;
  const VOLUMETRIC_SAMPLE_TARGETS = {
    flowRibbon: 54,
    cloudMote: 104,
    microDust: 72,
    sparkFilament: 40,
  };

  function clearVolumetricDensityPoints(fromIndex = 0) {
    if (!densityPointPositions || !densityPointSizes || !densityPointColors) return;
    for (let i = fromIndex; i < densityPointCapacity; i++) {
      const idx = i * 3;
      densityPointPositions[idx] = 3;
      densityPointPositions[idx + 1] = 3;
      densityPointPositions[idx + 2] = 0;
      densityPointSizes[i] = 0;
      densityPointColors[idx] = 0;
      densityPointColors[idx + 1] = 0;
      densityPointColors[idx + 2] = 0;
    }
  }

  function pushVolumetricDensityPoint(sampleIndex, ndcX, ndcY, size, warmWeight, coolWeight) {
    if (sampleIndex >= densityPointCapacity) return sampleIndex;
    const idx = sampleIndex * 3;
    densityPointPositions[idx] = ndcX;
    densityPointPositions[idx + 1] = ndcY;
    densityPointPositions[idx + 2] = 0;
    densityPointSizes[sampleIndex] = size;
    densityPointColors[idx] = warmWeight * 1.00 + coolWeight * 0.18;
    densityPointColors[idx + 1] = warmWeight * 0.62 + coolWeight * 0.46;
    densityPointColors[idx + 2] = warmWeight * 0.18 + coolWeight * 1.00;
    return sampleIndex + 1;
  }

  function setupVolumetricScatterPass() {
    if (
      !composer
      || !copyPass
      || !SCENE_CONFIG.featureFlags.halfResScatterPass
      || typeof THREE.WebGLRenderTarget === 'undefined'
      || typeof THREE.ShaderPass === 'undefined'
    ) return;

    const densityWidth = Math.max(160, Math.floor(window.innerWidth * 0.5));
    const densityHeight = Math.max(96, Math.floor(window.innerHeight * 0.5));
    densityRenderTarget = new THREE.WebGLRenderTarget(densityWidth, densityHeight, {
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
      format: THREE.RGBAFormat,
      depthBuffer: false,
      stencilBuffer: false,
    });
    densityRenderTarget.texture.name = 'HeroScatterDensity';

    densityScene = new THREE.Scene();
    densityCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    densityPointCapacity = Object.values(VOLUMETRIC_SAMPLE_TARGETS).reduce((sum, count) => sum + count, 0) + POINTER_TRAIL_CAPACITY + 12;
    densityPointPositions = new Float32Array(densityPointCapacity * 3);
    densityPointSizes = new Float32Array(densityPointCapacity);
    densityPointColors = new Float32Array(densityPointCapacity * 3);
    clearVolumetricDensityPoints(0);

    const densityGeo = new THREE.BufferGeometry();
    const densityPositionAttr = new THREE.BufferAttribute(densityPointPositions, 3);
    const densitySizeAttr = new THREE.BufferAttribute(densityPointSizes, 1);
    const densityColorAttr = new THREE.BufferAttribute(densityPointColors, 3);
    densityPositionAttr.setUsage(THREE.DynamicDrawUsage);
    densitySizeAttr.setUsage(THREE.DynamicDrawUsage);
    densityColorAttr.setUsage(THREE.DynamicDrawUsage);
    densityGeo.setAttribute('position', densityPositionAttr);
    densityGeo.setAttribute('aSize', densitySizeAttr);
    densityGeo.setAttribute('aColor', densityColorAttr);

    densityPointMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uPixelRatio: { value: renderer.getPixelRatio() },
        uOpacity: { value: 0.0 },
      },
      vertexShader: `
        uniform float uPixelRatio;
        attribute float aSize;
        attribute vec3 aColor;
        varying vec3 vColor;

        void main() {
          vColor = aColor;
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          gl_Position = projectionMatrix * mvPosition;
          gl_PointSize = aSize * uPixelRatio;
        }
      `,
      fragmentShader: `
        uniform float uOpacity;
        varying vec3 vColor;

        void main() {
          vec2 centered = gl_PointCoord * 2.0 - 1.0;
          float radius = dot(centered, centered);
          if (radius > 1.0) discard;
          float falloff = pow(max(0.0, 1.0 - radius), 1.8);
          gl_FragColor = vec4(vColor * falloff * uOpacity, falloff * uOpacity);
        }
      `,
      transparent: true,
      depthWrite: false,
      depthTest: false,
      blending: THREE.AdditiveBlending,
    });

    densityPoints = new THREE.Points(densityGeo, densityPointMaterial);
    densityPoints.frustumCulled = false;
    densityScene.add(densityPoints);

    scatterPass = new THREE.ShaderPass({
      uniforms: {
        tDiffuse: { value: null },
        tDensity: { value: densityRenderTarget.texture },
        uWarmOrigin: { value: new THREE.Vector2(0.22, 0.82) },
        uCoolOrigin: { value: new THREE.Vector2(0.56, 0.64) },
        uWarmColor: { value: new THREE.Color(0xffc56d) },
        uCoolColor: { value: new THREE.Color(0x6ea7ff) },
        uIntensity: { value: 0.0 },
        uShaftStepCount: { value: 6.0 },
        uShaftStrength: { value: 1.0 },
        uTime: { value: 0.0 },
        uReadabilityRect: { value: new THREE.Vector4(0.0, 1.0, 0.0, 1.0) },
        uReadabilityFade: { value: 0.0 },
      },
      vertexShader: `
        varying vec2 vUv;

        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform sampler2D tDiffuse;
        uniform sampler2D tDensity;
        uniform vec2 uWarmOrigin;
        uniform vec2 uCoolOrigin;
        uniform vec3 uWarmColor;
        uniform vec3 uCoolColor;
        uniform float uIntensity;
        uniform float uShaftStepCount;
        uniform float uShaftStrength;
        uniform float uTime;
        uniform vec4 uReadabilityRect;
        uniform float uReadabilityFade;
        varying vec2 vUv;

        float densityLuma(vec3 sampleColor) {
          return dot(sampleColor, vec3(0.24, 0.36, 0.40));
        }

        float corridorMask(vec2 uv) {
          float edge = 0.025;
          float maskX = smoothstep(uReadabilityRect.x, uReadabilityRect.x + edge, uv.x)
            * (1.0 - smoothstep(uReadabilityRect.y - edge, uReadabilityRect.y, uv.x));
          float maskY = smoothstep(uReadabilityRect.z, uReadabilityRect.z + edge, uv.y)
            * (1.0 - smoothstep(uReadabilityRect.w - edge, uReadabilityRect.w, uv.y));
          return maskX * maskY;
        }

        float shaft(vec2 uv, vec2 origin, float stretch) {
          vec2 delta = uv - origin;
          float dist = length(delta);
          vec2 stepVec = delta * stretch / 6.0;
          float weight = 1.0;
          float accum = 0.0;
          float stepCount = max(0.0, uShaftStepCount);

          for (int i = 0; i < 6; i++) {
            float gate = step(float(i), stepCount - 0.5);
            vec2 sampleUv = uv - stepVec * float(i);
            accum += densityLuma(texture2D(tDensity, sampleUv).rgb) * weight * gate;
            weight *= mix(1.0, 0.76, gate);
          }

          return accum * smoothstep(1.06, 0.04, dist) * uShaftStrength;
        }

        void main() {
          vec4 base = texture2D(tDiffuse, vUv);
          vec3 density = texture2D(tDensity, vUv).rgb;
          float warmDensity = dot(density, vec3(0.56, 0.34, 0.10));
          float coolDensity = dot(density, vec3(0.08, 0.22, 0.70));
          float warmShaft = shaft(vUv, uWarmOrigin, 0.18);
          float coolShaft = shaft(vUv, uCoolOrigin, 0.16);
          float shimmer = 0.92 + sin(uTime * 1.7 + vUv.y * 7.2 + vUv.x * 5.1) * 0.08;
          float guard = 1.0 - corridorMask(vUv) * uReadabilityFade;

          vec3 scatter = density * 0.10;
          scatter += uWarmColor * (warmDensity * 0.12 + warmShaft * 0.18);
          scatter += uCoolColor * (coolDensity * 0.10 + coolShaft * 0.16);
          scatter += mix(uWarmColor, uCoolColor, 0.24) * densityLuma(density) * 0.08;
          scatter *= uIntensity * shimmer * guard;

          gl_FragColor = vec4(base.rgb + scatter, base.a);
        }
      `,
    });

    composer.passes.pop();
    copyPass.renderToScreen = false;
    composer.addPass(scatterPass);
    copyPass.renderToScreen = true;
    composer.addPass(copyPass);
    desktopFxState.mode = 'desktop-scatter';
    desktopFxState.active = true;
    desktopFxState.underBudgetSince = performance.now();
  }

  function updateVolumetricScatterPass(nowMs, toolAlpha, readabilityClamp, releaseProgress, implPct) {
    if (!scatterPass || !densityRenderTarget || !densityPoints || !densityPointMaterial) return;

    updateDesktopFxMode(nowMs);
    const profile = getDesktopFxProfile();
    let pointerTrailEnergy = 0;
    for (let i = 0; i < pointerTrail.length; i++) {
      const node = pointerTrail[i];
      if (node.strength > 0.02 && node.age < 1.2) {
        pointerTrailEnergy += node.strength * Math.max(0.18, 1 - node.age / 1.2);
      }
    }
    pointerTrailEnergy = clamp01(pointerTrailEnergy * 0.24);
    const toolWakeEnergy = clamp01(
      toolWakeState.hammer * 0.18
      + toolWakeState.wrench * 0.16
      + toolWakeState.saw * 0.24
    );
    const densityEnergy = clamp01(
      atmosphereMetrics.vortex * 0.34
      + atmosphereMetrics.titleHalo * 0.28
      + atmosphereMetrics.foreground * 0.16
      + atmosphereMetrics.sawWake * 0.14
      + SCENE_STATE.focus * 0.14
      + SCENE_STATE.release * 0.24
      + implPct * 0.12
    );
    const interactionBoost = clamp01(
      (hoveredTool ? 0.10 : 0)
      + (dragTool ? 0.42 : 0)
      + (activePanelTool ? 0.10 : 0)
      + SCENE_STATE.focus * 0.38
      + SCENE_STATE.gather * 0.34
      + SCENE_STATE.release * 0.54
      + toolWakeEnergy * 0.72
      + pointerTrailEnergy * 0.58
    );
    const releaseScatterLift = clamp01(
      SCENE_STATE.release * 0.82
      + releaseProgress * 0.64
      + implPct * 0.24
    );
    const readabilityScatterClamp = Math.max(
      0.18,
      1 - readabilityClamp * (dragTool ? 0.22 : 0.42)
    );

    densityPointMaterial.uniforms.uOpacity.value = toolAlpha * (0.16 + densityEnergy * 0.50 + interactionBoost * 0.20 + releaseScatterLift * 0.10) * profile.pointOpacityScale;
    densityPoints.visible = profile.sampleScale > 0 && densityPointMaterial.uniforms.uOpacity.value > 0.01;
    scatterPass.uniforms.uIntensity.value = toolAlpha
      * (0.09 + densityEnergy * 0.32 + interactionBoost * 0.16 + releaseScatterLift * 0.08 + (dragTool ? 0.028 : 0))
      * readabilityScatterClamp
      * profile.intensityScale;
    scatterPass.uniforms.uShaftStepCount.value = profile.shaftStepCount;
    scatterPass.uniforms.uShaftStrength.value = profile.shaftStrength;
    scatterPass.uniforms.uTime.value = nowMs * 0.001;
    desktopFxState.active = densityPoints.visible && scatterPass.uniforms.uIntensity.value > 0.015;

    if (!densityPoints.visible) {
      clearVolumetricDensityPoints(0);
      densityPoints.geometry.attributes.position.needsUpdate = true;
      densityPoints.geometry.attributes.aSize.needsUpdate = true;
      densityPoints.geometry.attributes.aColor.needsUpdate = true;
      volumetricScatterSamples = 0;
      volumetricScatterIntensity = 0;
      const clearAlpha = renderer.getClearAlpha();
      renderer.setRenderTarget(densityRenderTarget);
      renderer.setClearColor(0x000000, 0);
      renderer.clear(true, true, true);
      renderer.setRenderTarget(null);
      renderer.setClearColor(scene.background, clearAlpha);
      return;
    }

    let sampleIndex = 0;
    for (const system of simulatedParticleSystems) {
      const speciesId = system.species.id;
      const targetCount = Math.round((VOLUMETRIC_SAMPLE_TARGETS[speciesId] || 0) * profile.sampleScale);
      if (!targetCount || !system.count) continue;
      const stride = Math.max(1, Math.floor(system.count / targetCount));

      for (let i = 0; i < system.count && sampleIndex < densityPointCapacity; i += stride) {
        const ix = i * 3;
        projectionScratch.set(system.positions[ix], system.positions[ix + 1], system.positions[ix + 2]).project(camera);
        if (
          projectionScratch.x < -1.2 || projectionScratch.x > 1.2
          || projectionScratch.y < -1.2 || projectionScratch.y > 1.2
        ) continue;

        const charge = system.charges[i] || 0;
        const wake = system.wake ? system.wake[i] : 0;
        const adhesion = system.adhesion ? system.adhesion[i] : 0;
        let size = 24;
        let warmWeight = 0.20;
        let coolWeight = 0.06;

        if (speciesId === 'flowRibbon') {
          size = 44 + wake * 28 + charge * 18 + releaseProgress * 10;
          warmWeight = 0.52 + charge * 0.34 + atmosphereMetrics.vortex * 0.24;
          coolWeight = 0.04 + SCENE_STATE.release * 0.18 + implPct * 0.12;
        } else if (speciesId === 'cloudMote') {
          size = 34 + charge * 18 + adhesion * 14 + atmosphereMetrics.titleHalo * 12;
          warmWeight = 0.36 + charge * 0.24 + atmosphereMetrics.titleHalo * 0.30;
          coolWeight = 0.05 + SCENE_STATE.release * 0.20 + atmosphereMetrics.foreground * 0.12;
        } else if (speciesId === 'microDust') {
          size = 18 + wake * 12 + charge * 8 + atmosphereMetrics.foreground * 6;
          warmWeight = 0.16 + atmosphereMetrics.foreground * 0.16 + charge * 0.08;
          coolWeight = 0.04 + wake * 0.08 + SCENE_STATE.release * 0.10;
        } else if (speciesId === 'sparkFilament') {
          size = 22 + charge * 16 + atmosphereMetrics.sawWake * 14;
          warmWeight = 0.64 + charge * 0.20 + SCENE_STATE.focus * 0.10;
          coolWeight = 0.08 + SCENE_STATE.release * 0.28 + atmosphereMetrics.sawWake * 0.26;
        }

        sampleIndex = pushVolumetricDensityPoint(
          sampleIndex,
          projectionScratch.x,
          projectionScratch.y,
          size,
          warmWeight,
          coolWeight
        );
      }
    }

    const activeTrailNodes = pointerTrail.filter((node) => node.strength > 0.02 && node.age < 1.2);
    for (let i = 0; i < activeTrailNodes.length && sampleIndex < densityPointCapacity; i++) {
      const node = activeTrailNodes[i];
      projectionScratch.set(node.x, node.y, node.z).project(camera);
      if (
        projectionScratch.x < -1.2 || projectionScratch.x > 1.2
        || projectionScratch.y < -1.2 || projectionScratch.y > 1.2
      ) continue;
      sampleIndex = pushVolumetricDensityPoint(
        sampleIndex,
        projectionScratch.x,
        projectionScratch.y,
        30 + node.strength * 34,
        0.22 + node.strength * 0.20,
        0.12 + node.strength * 0.44 + SCENE_STATE.release * 0.10
      );
    }

    const wakeAnchors = [
      { x: VORTEX_PARAMS.centerX * 0.62, y: VORTEX_PARAMS.centerY * 0.46 + 0.5, z: 1.0, size: 62, warm: 0.42 + atmosphereMetrics.vortex * 0.24, cool: 0.06 + SCENE_STATE.release * 0.18 },
      { x: sawGroup.position.x + 0.1, y: sawGroup.position.y + 0.44, z: sawGroup.position.z + 0.3, size: 56 + toolWakeState.saw * 40, warm: 0.36 + toolWakeState.saw * 0.16, cool: 0.12 + toolWakeState.saw * 0.42 + SCENE_STATE.release * 0.18 },
      { x: hammerGroup.position.x - 0.18, y: hammerGroup.position.y - 0.34, z: hammerGroup.position.z + 0.24, size: 40 + toolWakeState.hammer * 24, warm: 0.30 + toolWakeState.hammer * 0.22, cool: 0.04 + toolWakeState.hammer * 0.10 },
      { x: wrenchGroup.position.x + 0.12, y: wrenchGroup.position.y + 0.22, z: wrenchGroup.position.z + 0.28, size: 38 + toolWakeState.wrench * 22, warm: 0.24 + toolWakeState.wrench * 0.18, cool: 0.06 + toolWakeState.wrench * 0.16 },
    ];
    if (releaseScatterLift > 0.04) {
      wakeAnchors.push(
        {
          x: VORTEX_PARAMS.centerX * 0.82,
          y: VORTEX_PARAMS.centerY * 0.72 - 0.18,
          z: 0.86,
          size: 72 + releaseProgress * 46 + SCENE_STATE.release * 18,
          warm: 0.48 + SCENE_STATE.release * 0.26 + implPct * 0.08,
          cool: 0.14 + SCENE_STATE.release * 0.34 + implPct * 0.12,
        },
        {
          x: VORTEX_PARAMS.centerX * 0.58,
          y: VORTEX_PARAMS.centerY * 0.54 - 0.46,
          z: 0.74,
          size: 60 + SCENE_STATE.release * 38,
          warm: 0.30 + SCENE_STATE.release * 0.16,
          cool: 0.10 + SCENE_STATE.release * 0.18,
        }
      );
    }

    for (let i = 0; i < wakeAnchors.length && sampleIndex < densityPointCapacity; i++) {
      const anchor = wakeAnchors[i];
      projectionScratch.set(anchor.x, anchor.y, anchor.z).project(camera);
      if (
        projectionScratch.x < -1.2 || projectionScratch.x > 1.2
        || projectionScratch.y < -1.2 || projectionScratch.y > 1.2
      ) continue;
      sampleIndex = pushVolumetricDensityPoint(
        sampleIndex,
        projectionScratch.x,
        projectionScratch.y,
        anchor.size,
        anchor.warm,
        anchor.cool
      );
    }

    clearVolumetricDensityPoints(sampleIndex);
    densityPoints.geometry.attributes.position.needsUpdate = true;
    densityPoints.geometry.attributes.aSize.needsUpdate = true;
    densityPoints.geometry.attributes.aColor.needsUpdate = true;
    volumetricScatterSamples = sampleIndex;
    volumetricScatterIntensity = scatterPass.uniforms.uIntensity.value;

    projectionScratch.set(keyBeamCard.position.x, keyBeamCard.position.y, keyBeamCard.position.z).project(camera);
    scatterPass.uniforms.uWarmOrigin.value.set(
      clamp01((projectionScratch.x + 1) * 0.5),
      clamp01((projectionScratch.y + 1) * 0.5)
    );
    projectionScratch.set(sawBeamCard.position.x, sawBeamCard.position.y, sawBeamCard.position.z).project(camera);
    scatterPass.uniforms.uCoolOrigin.value.set(
      clamp01((projectionScratch.x + 1) * 0.5),
      clamp01((projectionScratch.y + 1) * 0.5)
    );

    scatterPass.uniforms.uReadabilityRect.value.set(
      readabilityWindow.left / window.innerWidth,
      (readabilityWindow.left + readabilityWindow.width) / window.innerWidth,
      1 - (readabilityWindow.top + readabilityWindow.height) / window.innerHeight,
      1 - (readabilityWindow.top / window.innerHeight)
    );
    scatterPass.uniforms.uReadabilityFade.value = readabilityWindow.active
      ? clamp01(readabilityClamp * 1.72 + SCENE_STATE.readabilityBias * 0.36 + atmosphereMetrics.copy * 0.18)
      : 0;

    const clearAlpha = renderer.getClearAlpha();
    renderer.setRenderTarget(densityRenderTarget);
    renderer.setClearColor(0x000000, 0);
    renderer.clear(true, true, true);
    if (densityPoints.visible) {
      renderer.render(densityScene, densityCamera);
    }
    renderer.setRenderTarget(null);
    renderer.setClearColor(scene.background, clearAlpha);
  }

  setupVolumetricScatterPass();

  // DEBUG-TELEMETRY: expose particle positions and scene state for validation
  window.__particleSnapshot = () => Float32Array.from((cloudMoteSystem || flowRibbonSystem || microDustSystem).positions);
  window.__vortexParams = () => ({ ...VORTEX_PARAMS });
  window.__sampleCanvasPixel = (x, y) => {
    const gl = renderer.getContext();
    const buf = new Uint8Array(4);
    gl.readPixels(x, gl.drawingBufferHeight - y, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, buf);
    return { r: buf[0], g: buf[1], b: buf[2], a: buf[3] };
  };

  /* ─── Vortex physics parameters ──────────────────────── */
  const VORTEX_PARAMS = {
    vortexRadius: 7.0,          // Wide cursor influence — more particles feel the cursor, better interaction
    coreRadius: 1.9,            // Loose core — particles gather into a broad knot instead of a tiny ring
    tangentialStrength: 0.0036, // Ambient orbit for the magical field
    radialStrength: 0.00072,    // Balanced pull that does not collapse the whole field
    baseRadialStrength: 0.00142,
    coreStrength: 0.0042,       // Soft core bounce — particles roll around the focus instead of snapping
    entropyStrength: 0.00036,   // Deterministic jitter amplitude
    upwardDrift: 0.00052,       // Slow ambient convection
    convectionStrength: 0.00036,
    curlStrength: 0.00062,
    clumpStrength: 0.00144,
    releaseSpread: 0.00114,
    damping: 0.960,             // Heavy drag — particles barely coast, linger like embers
    baseDamping: 0.960,
    velocityCap: 0.18,          // Allows shockwave blast, implosion snap; physics damping controls decay
    shockwaveRadius: 5.0,       // Click blast radius
    shockwaveImpulse: 0.86,     // Outward impulse strength on click
    implosionStrength: 0.18,    // Softer, more cinematic pull-back
    implosionDelay: 0.05,       // Fraction of implosion duration before pull starts (snappier)
    boundaryTop: 8.0,
    boundaryBottom: -6.5,
    // ── Mouse-driven physics fields ──
    centerX: 0, centerY: 0, centerZ: 0,   // Moveable vortex center (lerps to cursor)
    mouseVelocityX: 0, mouseVelocityY: 0,  // EMA-smoothed mouse velocity (NDC/frame)
    turbulenceMode: 0,                      // retained for compatibility with old diagnostics and tests
    velocityThreshold: 0.020,               // Raised — micro-jitter no longer triggers turbulence
    turbulenceStrength: 0.008,              // Gentle drift; main motion now comes from deterministic fields
    thermalDamping: 0.972,                  // Slightly looser damping under release
    proximityTool: null,                    // 'hammer'|'wrench'|'saw'|null
    proximityStrength: 0,                   // 0–1 smooth blend
    reverseGravity: false,                  // Right-click: all particles flee cursor
    toolFieldRadius: 2.35,
    toolDeflectStrength: 0.00148,
    titleRepelStrength: 0.0024,
    flowStrength: 0.00112,
    floorSkimStrength: 0.00072,
    floorHeight: -2.55,
    // ── Directional wind (mouse-velocity aligned force) ──
    windStrength: 0.012,                    // ambient directional wind — drag can still boost it
    baseWindStrength: 0.012,               // reset target for windStrength after drag boost
    windZBias: 0.42,                        // fraction of z-scatter aligned to mouse direction
    // ── Saw aerodynamic induction ──
    sawInductionStrength: 0.0010,           // tangential circulation per unit speedRatio — subtle stir
    sawInductionRadius: 2.1,              // smaller zone — saw stirs but doesn't dominate
    sawWorldX: 0, sawWorldY: 0, sawWorldZ: 0, // saw position — updated each frame
    sawSpeedRatio: 0,                       // 0–1 saw speed — updated each frame
    // ── Ambient breathing pulse ──
    breatheAmplitude: 0.0006,              // ±33% modulation of radialStrength
    breathePeriod: 4000,                   // ms per complete breath cycle
    pointerWake: 0,
  };

  window.__sceneDiagnostics = () => ({
    activeTier: SCENE_CONFIG.qualityTier,
    defaultTier: DEFAULT_QUALITY_TIER,
    environment: {
      lowEndGpu: _isLowEnd,
      mobileViewport: _isMobileViewport,
      canRunDesktopPost: CAN_RUN_DESKTOP_POST,
    },
    energyState,
    chargeLevel: Number(getChargeLevel().toFixed(3)),
    interactionState: SCENE_STATE.interactionState,
    focusTarget,
    hoverTarget: hoveredTool || null,
    dragTarget: dragTool || null,
    bootHealthy,
    assetMode,
    renderedFrameCount,
    avgFrameMs: Number(averageFrameMs().toFixed(2)),
    approxFps: Number((averageFrameMs() > 0 ? 1000 / averageFrameMs() : 0).toFixed(1)),
    particleCounts: simulatedParticleSystems.reduce((acc, system) => {
      acc[system.species.id] = system.count;
      return acc;
    }, {}),
    speciesCounts: simulatedParticleSystems.reduce((acc, system) => {
      acc[system.species.id] = system.count;
      return acc;
    }, {}),
    enabledLayers: simulatedParticleSystems.map((system) => system.species.id),
    enabledSpecies: simulatedParticleSystems.map((system) => system.species.id),
    layerActivity: simulatedParticleSystems.reduce((acc, system) => {
      acc[system.species.id] = Number((speciesActivity[system.species.id] || 0).toFixed(3));
      return acc;
    }, {}),
    avgSimMs: Number(simulationMetrics.avgSimMs.toFixed(2)),
    avgPostMs: Number(simulationMetrics.avgPostMs.toFixed(2)),
    queryOverrides: {
      sceneTier: SCENE_TEST_OVERRIDES.sceneTier,
      forceDesktopFX: SCENE_TEST_OVERRIDES.forceDesktopFX,
      disablePerfAutoDowngrade: SCENE_TEST_OVERRIDES.disablePerfAutoDowngrade,
    },
    desktopScatter: {
      configured: !!scatterPass,
      active: desktopFxState.active,
      mode: desktopFxState.mode,
      allowed: CAN_RUN_DESKTOP_POST,
      forced: ALLOW_DESKTOP_FX_OVERRIDE,
      autoDowngradeDisabled: SCENE_TEST_OVERRIDES.disablePerfAutoDowngrade,
      sampleScale: Number(getDesktopFxProfile().sampleScale.toFixed(2)),
      shaftStepCount: getDesktopFxProfile().shaftStepCount,
      intensityScale: Number(getDesktopFxProfile().intensityScale.toFixed(2)),
    },
    toolScreenPositions: {
      hammer: projectWorldToScreen(hammerGroup.position.x, hammerGroup.position.y, hammerGroup.position.z),
      wrench: projectWorldToScreen(wrenchGroup.position.x, wrenchGroup.position.y, wrenchGroup.position.z),
      saw: projectWorldToScreen(sawGroup.position.x, sawGroup.position.y, sawGroup.position.z),
    },
    hintVisible: gestureHint.classList.contains('visible')
      || (SCENE_CONFIG.featureFlags.contextualHint && performance.now() - lastInteractionAt > SCENE_CONFIG.timing.hintDelayMs),
    readabilityWindow: {
      left: readabilityWindow.left,
      top: readabilityWindow.top,
      width: readabilityWindow.width,
      height: readabilityWindow.height,
      active: readabilityWindow.active,
      insideProtectedCorridor,
    },
    densityMetrics: {
      vortex: Number(atmosphereMetrics.vortex.toFixed(3)),
      titleHalo: Number(atmosphereMetrics.titleHalo.toFixed(3)),
      foreground: Number(atmosphereMetrics.foreground.toFixed(3)),
      floor: Number(atmosphereMetrics.floor.toFixed(3)),
      sawWake: Number(atmosphereMetrics.sawWake.toFixed(3)),
      copy: Number(atmosphereMetrics.copy.toFixed(3)),
    },
    toolWakeState: {
      hammer: Number(toolWakeState.hammer.toFixed(3)),
      wrench: Number(toolWakeState.wrench.toFixed(3)),
      saw: Number(toolWakeState.saw.toFixed(3)),
    },
    visualMetrics: {
      sceneGradeOpacity: parseFloat(sceneGrade.style.opacity || '0'),
      chargeRingOpacity: parseFloat(chargeRing.style.opacity || '0'),
      copyShieldOpacity: Number(copyShield.style.opacity || '0'),
      vortexLightIntensity: Number(vortexLight.intensity.toFixed(3)),
      sawGlowIntensity: Number(sawParticleGlow.intensity.toFixed(3)),
      floorBurstIntensity: Number(floorRimLight.intensity.toFixed(3)),
      volumetricOpacity: Number((sparkAuraCard.material.opacity + cloudAuraCard.material.opacity + vortexGlowPlane.material.opacity).toFixed(3)),
      blueMix: Number((floorRimLight.color.b + vortexGlowPlane.material.color.b + sparkAuraCard.material.color.b).toFixed(3)),
      bloomLayerIntensity: Number(simulatedParticleSystems.reduce((sum, system) => sum + system.bloomWeight, 0).toFixed(3)),
      scatterPassIntensity: Number(volumetricScatterIntensity.toFixed(3)),
      scatterShaftStepCount: getDesktopFxProfile().shaftStepCount,
      densityInCopyZone: Number(copyZoneDensity.toFixed(3)),
      titleHaloDensity: Number(atmosphereMetrics.titleHalo.toFixed(3)),
      foregroundDensity: Number(atmosphereMetrics.foreground.toFixed(3)),
      activeTrailNodes: pointerTrail.filter((node) => node.strength > 0.02).length,
      volumetricScatterSamples,
    },
    featureFlags: {
      ...SCENE_CONFIG.featureFlags,
      experimentalGestures: SCENE_CONFIG.experimentalGestures,
      reducedMotion: prefersReduced,
    },
  });

  function sampleMacroFlow(x, y, z, time, phase) {
    const sx = 0.88 + Math.sin((y * 0.42 + time * 0.58 + phase) * 1.3) * 0.20;
    const sy = -0.20 + Math.cos((x * 0.26 + time * 0.41 + phase) * 1.4) * 0.11;
    const sz = Math.sin((x * 0.18 - y * 0.28 + z * 0.22 + time * 0.33 + phase) * 1.9) * 0.18;
    const len = Math.max(0.0001, Math.sqrt(sx * sx + sy * sy + sz * sz));
    return { x: sx / len, y: sy / len, z: sz / len };
  }

  function sampleLocalCurl(x, y, z, time, seed) {
    const sx = Math.sin(y * 0.92 + time * 0.76 + seed * 1.7) - Math.cos(z * 1.16 - time * 0.42 + seed);
    const sy = Math.sin(z * 0.74 + time * 0.56 + seed * 1.3) - Math.cos(x * 1.02 + time * 0.32 + seed * 0.7);
    const sz = Math.sin(x * 1.08 - time * 0.48 + seed * 1.1) - Math.cos(y * 0.82 - time * 0.26 + seed * 1.9);
    const len = Math.max(0.0001, Math.sqrt(sx * sx + sy * sy + sz * sz));
    return { x: sx / len, y: sy / len, z: sz / len };
  }

  function sampleEntropy(seed, time) {
    return {
      x: seededSigned(seed + time * 0.00073),
      y: seededSigned(seed * 1.3 + time * 0.00051),
      z: seededSigned(seed * 1.7 + time * 0.00037),
    };
  }

  function commitPointerTrailNode(x, y, z, dx, dy, dz, strength) {
    if (!pointerTrail.length) return;
    pointerTrailHead = (pointerTrailHead + 1) % pointerTrail.length;
    const node = pointerTrail[pointerTrailHead];
    const dirLen = Math.max(0.0001, Math.sqrt(dx * dx + dy * dy + dz * dz));
    node.x = x;
    node.y = y;
    node.z = z;
    node.dx = dx / dirLen;
    node.dy = dy / dirLen;
    node.dz = dz / dirLen;
    node.strength = Math.max(0.18, strength);
    node.age = 0;
  }

  function updatePointerTrail(deltaMs) {
    if (!pointerTrail.length) return;
    for (let i = 0; i < pointerTrail.length; i++) {
      const node = pointerTrail[i];
      node.age = Math.min(1.6, node.age + deltaMs * 0.0018);
      node.strength *= node.age > 0.9 ? 0.916 : 0.962;
      if (node.strength < 0.02) node.strength = 0;
    }
  }

  function samplePolylineField(px, py, pz, nodes, radius) {
    let best = null;
    let bestDistSq = radius * radius;
    for (let i = 0; i < nodes.length - 1; i++) {
      const a = nodes[i];
      const b = nodes[i + 1];
      const abx = b.x - a.x;
      const aby = b.y - a.y;
      const abz = b.z - a.z;
      const apx = px - a.x;
      const apy = py - a.y;
      const apz = pz - a.z;
      const abLenSq = Math.max(0.0001, abx * abx + aby * aby + abz * abz);
      const t = clamp01((apx * abx + apy * aby + apz * abz) / abLenSq);
      const qx = a.x + abx * t;
      const qy = a.y + aby * t;
      const qz = a.z + abz * t;
      const dx = px - qx;
      const dy = py - qy;
      const dz = pz - qz;
      const distSq = dx * dx + dy * dy + dz * dz;
      if (distSq >= bestDistSq) continue;
      const tangentLen = Math.max(0.0001, Math.sqrt(abx * abx + aby * aby + abz * abz));
      bestDistSq = distSq;
      best = {
        dx,
        dy,
        dz,
        tx: abx / tangentLen,
        ty: aby / tangentLen,
        tz: abz / tangentLen,
      };
    }
    if (!best) return null;
    const dist = Math.sqrt(bestDistSq);
    const safeDist = Math.max(0.0001, dist);
    return {
      influence: clamp01(1 - dist / radius),
      nx: best.dx / safeDist,
      ny: best.dy / safeDist,
      nz: best.dz / safeDist,
      tx: best.tx,
      ty: best.ty,
      tz: best.tz,
    };
  }

  function sampleOrbitCell(px, py, pz, cell) {
    const dx = px - cell.x;
    const dy = py - cell.y;
    const dz = pz - cell.z;
    const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
    if (dist <= 0.01 || dist > cell.radius) return null;
    const safeDist = Math.max(0.0001, dist);
    return {
      influence: clamp01(1 - dist / cell.radius),
      nx: dx / safeDist,
      ny: dy / safeDist,
      nz: dz / safeDist,
      tx: -dy / safeDist,
      ty: dx / safeDist,
      tz: cell.zLift || 0,
      pull: cell.pull || 1,
      spin: cell.spin || 1,
    };
  }

  function sdBox(dx, dy, dz, halfX, halfY, halfZ) {
    const qx = Math.abs(dx) - halfX;
    const qy = Math.abs(dy) - halfY;
    const qz = Math.abs(dz) - halfZ;
    const ox = Math.max(qx, 0);
    const oy = Math.max(qy, 0);
    const oz = Math.max(qz, 0);
    return Math.sqrt(ox * ox + oy * oy + oz * oz) + Math.min(Math.max(qx, Math.max(qy, qz)), 0);
  }

  function sampleBoxFieldNormal(dx, dy, dz, halfX, halfY, halfZ, falloff) {
    const sdf = sdBox(dx, dy, dz, halfX, halfY, halfZ);
    if (sdf > falloff) return null;
    let nx = 0;
    let ny = 0;
    let nz = 0;
    const ax = Math.abs(dx) - halfX;
    const ay = Math.abs(dy) - halfY;
    const az = Math.abs(dz) - halfZ;
    if (ax >= ay && ax >= az) nx = Math.sign(dx || 1);
    else if (ay >= ax && ay >= az) ny = Math.sign(dy || 1);
    else nz = Math.sign(dz || 1);
    return { influence: clamp01(1 - sdf / falloff), nx, ny, nz };
  }

  function sampleCapsuleField(px, py, pz, ax, ay, az, bx, by, bz, radius, falloff) {
    const abx = bx - ax;
    const aby = by - ay;
    const abz = bz - az;
    const apx = px - ax;
    const apy = py - ay;
    const apz = pz - az;
    const abLenSq = Math.max(0.0001, abx * abx + aby * aby + abz * abz);
    const t = clamp01((apx * abx + apy * aby + apz * abz) / abLenSq);
    const cx = ax + abx * t;
    const cy = ay + aby * t;
    const cz = az + abz * t;
    const dx = px - cx;
    const dy = py - cy;
    const dz = pz - cz;
    const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
    const sdf = dist - radius;
    if (sdf > falloff) return null;
    const safeDist = Math.max(0.0001, dist);
    return {
      influence: clamp01(1 - sdf / falloff),
      nx: dx / safeDist,
      ny: dy / safeDist,
      nz: dz / safeDist,
    };
  }

  const ribbonMatrix = new THREE.Matrix4();
  const ribbonWidthAxis = new THREE.Vector3();
  const ribbonLengthAxis = new THREE.Vector3();
  const ribbonFaceAxis = new THREE.Vector3();
  const ribbonCenter = new THREE.Vector3();

  function updateRibbonInstances(system) {
    if (!system || system.species.renderPath !== 'ribbon') return;
    let trailTotal = 0;
    for (let i = 0; i < system.count; i++) {
      const ix = i * 3;
      const tx = system.trailHeads[ix];
      const ty = system.trailHeads[ix + 1];
      const tz = system.trailHeads[ix + 2];
      ribbonCenter.set(system.positions[ix], system.positions[ix + 1], system.positions[ix + 2]);
      ribbonLengthAxis.set(
        system.positions[ix] - tx,
        system.positions[ix + 1] - ty,
        system.positions[ix + 2] - tz
      );
      let trailLen = ribbonLengthAxis.length();
      if (trailLen < 0.001) {
        ribbonLengthAxis.set(system.velocities[ix], system.velocities[ix + 1], system.velocities[ix + 2]);
        trailLen = ribbonLengthAxis.length();
      }
      if (trailLen < 0.001) ribbonLengthAxis.set(0.01, 0, 0);
      ribbonLengthAxis.normalize();
      ribbonFaceAxis.copy(camera.position).sub(ribbonCenter).normalize();
      ribbonWidthAxis.crossVectors(ribbonFaceAxis, ribbonLengthAxis).normalize();
      ribbonFaceAxis.crossVectors(ribbonLengthAxis, ribbonWidthAxis).normalize();

      const width = system.sizes[i] * (0.78 + system.charges[i] * 1.08 + system.wake[i] * 0.42 + SCENE_STATE.focus * 0.2);
      const length = Math.max(width * 3.2, trailLen * (1.45 + system.wake[i] * 0.38) + system.sizes[i] * (5.8 + system.adhesion[i] * 2.8));
      trailTotal += length;
      ribbonWidthAxis.multiplyScalar(width);
      ribbonLengthAxis.multiplyScalar(length);
      ribbonFaceAxis.multiplyScalar(width * 0.7);
      ribbonMatrix.makeBasis(ribbonWidthAxis, ribbonLengthAxis, ribbonFaceAxis);
      ribbonMatrix.setPosition(ribbonCenter);
      system.mesh.setMatrixAt(i, ribbonMatrix);
      system.colorScratch.setRGB(
        0.46 + system.charges[i] * 0.52 + system.wake[i] * 0.10 + SCENE_STATE.release * 0.10,
        0.26 + system.temperatures[i] * 0.38 + system.adhesion[i] * 0.08,
        0.06 + SCENE_STATE.release * 0.12 + system.wake[i] * 0.06
      );
      system.mesh.setColorAt(i, system.colorScratch);
    }
    system.avgTrailLength = system.count ? trailTotal / system.count : 0;
    system.mesh.instanceMatrix.needsUpdate = true;
    if (system.mesh.instanceColor) system.mesh.instanceColor.needsUpdate = true;
  }

  /* ─── Vortex physics update ──────────────────────────── */
  function updateVortexPhysics(system, mouseWorldPos, delta) {
    if (!system) return;

    const pos = system.positions;
    const prev = system.prevPositions;
    const vel = system.velocities;
    const count = system.count;
    const speciesId = system.species.id;
    const nowMs = performance.now();
    const now = nowMs * 0.001;
    const energyValue = getEnergyStateValue();
    const releaseProgress = getReleaseProgress(nowMs);
    const speciesBehavior = system.species.behavior || {};
    const stateEnvelope = getLayerEnvelope(system.species, releaseProgress);

    const cx = VORTEX_PARAMS.centerX;
    const cy = VORTEX_PARAMS.centerY;
    const cz = VORTEX_PARAMS.centerZ;
    const proxTool = VORTEX_PARAMS.proximityTool;
    const proxStr = VORTEX_PARAMS.proximityStrength;

    const speciesForce = (speciesId === 'microDust' ? 0.88 : (speciesId === 'sparkFilament' ? 1.26 : (speciesId === 'flowRibbon' ? 1.18 : 1.0))) * stateEnvelope;
    const speciesEntropy = (speciesBehavior.entropy || 0.2) * (speciesId === 'sparkFilament' ? 1.2 : 1.0);
    const speciesDamping = speciesId === 'microDust' ? 0.974 : (speciesId === 'sparkFilament' ? 0.946 : VORTEX_PARAMS.baseDamping);
    const effectiveDamping = THREE.MathUtils.lerp(speciesDamping, VORTEX_PARAMS.thermalDamping, SCENE_STATE.release * 0.22 + SCENE_STATE.gather * 0.12);
    const pointerWakeForce = (speciesBehavior.pointerWake || 1) * SCENE_STATE.pointerWake;
    const convectionForce = speciesBehavior.convection || 1;
    const curlForce = speciesBehavior.curl || 1;
    const deflectForce = speciesBehavior.deflection || 1;
    const clumpForce = speciesBehavior.clump || 1;
    const releaseForce = speciesBehavior.releaseSpread || 1;

    const mouseVelMag = Math.sqrt(VORTEX_PARAMS.mouseVelocityX ** 2 + VORTEX_PARAMS.mouseVelocityY ** 2);
    const windDirX = mouseVelMag > 0.0001 ? VORTEX_PARAMS.mouseVelocityX / mouseVelMag : 0;
    const windDirY = mouseVelMag > 0.0001 ? VORTEX_PARAMS.mouseVelocityY / mouseVelMag : 0;
    const windDirZ = (windDirX - windDirY * 0.35) * 0.22;
    const activityStride = Math.max(1, Math.floor(count / 72));
    let activitySum = 0;
    let activitySamples = 0;
    const choreography = SCENE_CONFIG.choreography;
    const atmosphericPulse = 0.5 + Math.sin(now * 0.38 + releaseProgress * Math.PI * 0.5) * 0.5;
    const entryLane = [
      { x: -4.7, y: 4.6, z: 1.3 },
      { x: -3.3, y: 3.1, z: 1.1 },
      { x: -1.5, y: 2.2 + SCENE_STATE.focus * 0.16, z: 1.0 },
      { x: 0.3 + cx * 0.14, y: 1.5 + SCENE_STATE.gather * 0.24, z: 0.7 },
      { x: 2.7 + cx * 0.08, y: 0.2, z: 0.4 },
    ];
    const crownLane = [
      { x: -3.2, y: 1.9, z: 1.8 },
      { x: -1.4, y: 2.6, z: 1.6 },
      { x: 0.5 + cx * 0.18, y: 2.3 + SCENE_STATE.focus * 0.18, z: 1.4 },
      { x: 2.8, y: 1.4, z: 0.9 },
    ];
    const floorLane = [
      { x: -4.8, y: VORTEX_PARAMS.floorHeight + 0.35, z: 0.6 },
      { x: -2.4, y: VORTEX_PARAMS.floorHeight + 0.42, z: 0.5 },
      { x: 0.6 + cx * 0.08, y: VORTEX_PARAMS.floorHeight + 0.36, z: 0.2 },
      { x: 3.8, y: VORTEX_PARAMS.floorHeight + 0.48, z: 0.6 },
    ];
    const readabilityPressure = clamp01(
      SCENE_STATE.readabilityBias * 0.78
      + copyZoneDensity * 1.28
      + (SCENE_CONFIG.qualityTier === 'desktop' ? 0.10 : 0)
      + (desktopFxState.active ? 0.14 : 0)
    );
    const bypassLaneLift = 0.20 + readabilityPressure * 0.44;
    const bypassLane = [
      { x: -3.8, y: 2.5 + bypassLaneLift, z: 1.52 + readabilityPressure * 0.08 },
      { x: -1.0, y: 2.95 + bypassLaneLift * 0.82, z: 1.76 + readabilityPressure * 0.10 },
      { x: 1.15, y: 2.34 + bypassLaneLift * 0.54, z: 1.48 + readabilityPressure * 0.06 },
      { x: 3.15, y: 1.22 + bypassLaneLift * 0.28, z: 1.04 },
    ];
    const orbitCells = [
      { x: cx * 0.54 - 1.05, y: 1.2 + atmosphericPulse * 0.55, z: 0.92, radius: choreography.orbitRadius, pull: 1.0, spin: 1.0, zLift: 0.05 },
      { x: cx * 0.34 + 1.3, y: 0.4 + SCENE_STATE.focus * 0.7, z: 0.64, radius: choreography.orbitRadius * 0.92, pull: 0.86, spin: -0.88, zLift: 0.03 },
      { x: cx * 0.22 + Math.sin(now * 0.9) * 0.8, y: 2.1 + Math.cos(now * 0.55) * 0.3, z: 1.1, radius: choreography.orbitRadius * 0.78, pull: 0.74, spin: 0.92, zLift: 0.06 },
    ];
    const activeTrailNodes = pointerTrail.filter((node) => node.strength > 0.02 && node.age < 1.25);

    const titleZone = window.innerWidth < 768
      ? { x: 0.0, y: 0.25, z: 0.65, halfX: 1.8 + readabilityPressure * 0.18, halfY: 2.2 + readabilityPressure * 0.12, halfZ: 1.3, falloff: 1.6 + readabilityPressure * 0.10 }
      : {
        x: -0.35,
        y: 0.28 + readabilityPressure * 0.06,
        z: 0.65,
        halfX: 3.0 + readabilityPressure * 0.54,
        halfY: 2.6 + readabilityPressure * 0.24,
        halfZ: 1.8 + readabilityPressure * 0.10,
        falloff: 2.1 + readabilityPressure * 0.24,
      };

    for (let i = 0; i < count; i++) {
      const ix = i * 3;
      const iy = ix + 1;
      const iz = ix + 2;
      let px = pos[ix];
      let py = pos[iy];
      let pz = pos[iz];
      let vx = vel[ix];
      let vy = vel[iy];
      let vz = vel[iz];

      const dx = px - cx;
      const dy = py - cy;
      const dz = pz - cz;
      const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
      const ageStep = delta;
      system.ages[i] += ageStep;
      if (system.ages[i] > system.lifetimes[i]) {
        initializeParticle(system, i);
        px = pos[ix];
        py = pos[iy];
        pz = pos[iz];
        vx = vel[ix];
        vy = vel[iy];
        vz = vel[iz];
      }
      const lifeNorm = clamp01(system.ages[i] / Math.max(1, system.lifetimes[i]));
      let cohesion = system.cohesion[i];
      let adhesion = system.adhesion[i];
      let wake = system.wake[i];
      let wakeTarget = wake * 0.92;
      let adhesionTarget = adhesion * 0.94;

      const macro = sampleMacroFlow(px, py, pz, now, system.speciesPhase[i]);
      vx += macro.x * VORTEX_PARAMS.flowStrength * speciesForce * (speciesId === 'flowRibbon' ? 1.55 : 0.72);
      vy += macro.y * VORTEX_PARAMS.flowStrength * speciesForce * (speciesId === 'flowRibbon' ? 1.28 : 0.52);
      vz += macro.z * VORTEX_PARAMS.flowStrength * speciesForce * 0.64;

      const curl = sampleLocalCurl(px * 0.38, py * 0.38, pz * 0.38, now, i * 0.0027 + speciesForce);
      vx += curl.x * VORTEX_PARAMS.curlStrength * speciesForce * curlForce;
      vy += curl.y * VORTEX_PARAMS.curlStrength * speciesForce * 0.72 * curlForce;
      vz += curl.z * VORTEX_PARAMS.curlStrength * speciesForce * 0.9 * curlForce;

      const heatRise = (0.55 + system.temperatures[i] * 0.85 + Math.sin(now * 0.7 + system.speciesPhase[i]) * 0.08);
      vy += (VORTEX_PARAMS.upwardDrift + VORTEX_PARAMS.convectionStrength * heatRise) * speciesForce * convectionForce;

      const entryField = samplePolylineField(px, py, pz, entryLane, choreography.laneRadius + (speciesId === 'flowRibbon' ? 0.65 : 0));
      if (entryField) {
        const laneFlow = choreography.laneFlow * speciesForce * (speciesId === 'flowRibbon' ? 1.42 : 0.84) * (0.72 + atmosphericPulse * 0.28);
        vx += entryField.tx * laneFlow * entryField.influence;
        vy += entryField.ty * laneFlow * entryField.influence;
        vz += entryField.tz * laneFlow * entryField.influence * 0.76;
        vx -= entryField.nx * choreography.lanePull * cohesion * entryField.influence;
        vy -= entryField.ny * choreography.lanePull * cohesion * entryField.influence * 0.84;
        vz -= entryField.nz * choreography.lanePull * cohesion * entryField.influence * 0.48;
        cohesion = clamp01(cohesion + entryField.influence * 0.014);
      }

      const crownField = samplePolylineField(px, py, pz, crownLane, choreography.laneRadius * 1.08);
      if (crownField) {
        const crownFlow = choreography.laneFlow * (0.62 + SCENE_STATE.focus * 0.34 + SCENE_STATE.gather * 0.28) * speciesForce;
        vx += crownField.tx * crownFlow * crownField.influence;
        vy += crownField.ty * crownFlow * crownField.influence;
        vz += crownField.tz * crownFlow * crownField.influence;
        vx -= crownField.nx * choreography.lanePull * 0.74 * crownField.influence;
        vy -= crownField.ny * choreography.lanePull * 0.62 * crownField.influence;
      }

      const floorLaneField = samplePolylineField(px, py, pz, floorLane, choreography.laneRadius * 0.9);
      if (floorLaneField && py < VORTEX_PARAMS.floorHeight + 1.2) {
        const floorFlow = choreography.floorRibbonStrength * (speciesId === 'flowRibbon' ? 1.24 : 0.78) * (0.58 + adhesion * 0.42 + SCENE_STATE.focus * 0.14);
        vx += floorLaneField.tx * floorFlow * floorLaneField.influence;
        vz += floorLaneField.tz * floorFlow * floorLaneField.influence * 0.92;
        vy += choreography.bypassLift * 0.36 * floorLaneField.influence;
        adhesionTarget = Math.max(adhesionTarget, floorLaneField.influence * 0.82);
      }

      for (let o = 0; o < orbitCells.length; o++) {
        const orbitField = sampleOrbitCell(px, py, pz, orbitCells[o]);
        if (!orbitField) continue;
        const orbitStrength = choreography.orbitSpin * orbitField.spin * orbitField.influence * (0.56 + cohesion * 0.42 + SCENE_STATE.gather * 0.22);
        vx += orbitField.tx * orbitStrength;
        vy += orbitField.ty * orbitStrength;
        vz += orbitField.tz * orbitStrength * 0.42;
        vx -= orbitField.nx * choreography.orbitPull * orbitField.pull * orbitField.influence * (0.44 + cohesion * 0.56);
        vy -= orbitField.ny * choreography.orbitPull * orbitField.pull * orbitField.influence * 0.84;
        vz -= orbitField.nz * choreography.orbitPull * orbitField.pull * orbitField.influence * 0.28;
      }

      for (let t = 0; t < activeTrailNodes.length; t++) {
        const node = activeTrailNodes[t];
        const ndx = px - node.x;
        const ndy = py - node.y;
        const ndz = pz - node.z;
        const nDist = Math.sqrt(ndx * ndx + ndy * ndy + ndz * ndz);
        if (nDist <= 0.01 || nDist > choreography.pointerTrailRadius) continue;
        const nInfluence = clamp01(1 - nDist / choreography.pointerTrailRadius) * node.strength * (1 - node.age * 0.5);
        vx += node.dx * choreography.pointerTrailFlow * nInfluence * (1.0 + pointerWakeForce * 0.8);
        vy += node.dy * choreography.pointerTrailFlow * nInfluence * (0.72 + pointerWakeForce * 0.4);
        vz += node.dz * choreography.pointerTrailFlow * nInfluence * 0.38;
        vx -= (ndx / nDist) * choreography.pointerTrailPull * nInfluence;
        vy -= (ndy / nDist) * choreography.pointerTrailPull * nInfluence * 0.82;
        wakeTarget = Math.max(wakeTarget, nInfluence * 1.85);
      }

      if (dist < VORTEX_PARAMS.vortexRadius && dist > 0.01) {
        const normDist = dist / VORTEX_PARAMS.vortexRadius;
        const falloff = 1 - normDist;
        const radialForce = (VORTEX_PARAMS.radialStrength + SCENE_STATE.gather * 0.0011 + SCENE_STATE.pointerWake * 0.00028) * speciesForce;
        const tangentialForce = VORTEX_PARAMS.tangentialStrength * (0.42 + SCENE_STATE.focus * 0.5 + SCENE_STATE.release * 0.28);

        if (dist < VORTEX_PARAMS.coreRadius) {
          const corePush = VORTEX_PARAMS.coreStrength * (1 - dist / VORTEX_PARAMS.coreRadius);
          vx += (dx / dist) * corePush;
          vy += (dy / dist) * corePush;
          vz += (dz / dist) * corePush * 0.5;
        } else {
          vx -= (dx / dist) * radialForce * falloff;
          vy -= (dy / dist) * radialForce * falloff;
          vz -= (dz / dist) * radialForce * falloff * 0.38;
        }

        vx += (-dy / dist) * tangentialForce * falloff;
        vy += (dx / dist) * tangentialForce * falloff;
        vx += (windDirX * VORTEX_PARAMS.windStrength) * pointerWakeForce * falloff;
        vy += (windDirY * VORTEX_PARAMS.windStrength) * pointerWakeForce * falloff;
        vz += windDirZ * VORTEX_PARAMS.windStrength * pointerWakeForce * falloff;
      }

      const titleField = sampleBoxFieldNormal(
        px - titleZone.x,
        py - titleZone.y,
        pz - titleZone.z,
        titleZone.halfX,
        titleZone.halfY,
        titleZone.halfZ,
        titleZone.falloff
      );
      if (titleField && speciesId !== 'sparkFilament') {
        const titleGuard = speciesBehavior.textGuard || 1;
        const readabilityDrive = 0.92 + SCENE_STATE.readabilityBias * 1.42 + copyZoneDensity * 0.72 + readabilityPressure * 0.48;
        const corridorLift = 0.84 + readabilityPressure * 0.74 + (speciesId === 'flowRibbon' ? 0.12 : 0);
        const repel = VORTEX_PARAMS.titleRepelStrength * titleGuard * titleField.influence * readabilityDrive * (1.08 + readabilityPressure * 0.68);
        vx += titleField.nx * repel;
        vy += titleField.ny * repel * (1.10 + readabilityPressure * 0.22);
        vz += titleField.nz * repel * (0.52 + readabilityPressure * 0.16);
        if (titleField.influence > 0.08) {
          const lateralSign = px >= titleZone.x ? 1 : -1;
          const corridorPush = titleField.influence * corridorLift;
          vx += lateralSign * choreography.laneFlow * (0.28 + readabilityPressure * 0.16) * corridorPush * readabilityDrive;
          vy += choreography.bypassLift * (0.74 + readabilityPressure * 0.62) * corridorPush * (0.92 + SCENE_STATE.readabilityBias * 0.42);
          vz += 0.00022 * corridorPush * (0.6 + readabilityPressure);
          wakeTarget = Math.max(wakeTarget, titleField.influence * (0.42 + readabilityPressure * 0.28));
          adhesionTarget *= THREE.MathUtils.lerp(0.95, 0.84, titleField.influence * (0.68 + readabilityPressure * 0.24));
          cohesion = Math.max(0.06, cohesion - titleField.influence * (0.032 + readabilityPressure * 0.018));
        }
        if (titleField.influence > 0.20 && copyZoneDensity > 0.22) {
          const evacuation = (copyZoneDensity - 0.22) * 3.2 * titleField.influence;
          vx += Math.sign(px - titleZone.x || 1) * 0.0012 * evacuation * titleGuard;
          vy += 0.00088 * evacuation;
          vz += 0.00024 * evacuation;
          adhesionTarget *= 0.82;
        }
        const bypassField = samplePolylineField(px, py, pz, bypassLane, choreography.laneRadius * (1.18 + readabilityPressure * 0.12));
        if (bypassField) {
          const bypassFlow = choreography.laneFlow * (0.84 + SCENE_STATE.readabilityBias * 0.72 + titleField.influence * 0.42 + copyZoneDensity * 0.34 + readabilityPressure * 0.28);
          vx += bypassField.tx * bypassFlow * bypassField.influence;
          vy += bypassField.ty * bypassFlow * bypassField.influence;
          vz += bypassField.tz * bypassFlow * bypassField.influence;
          vx -= bypassField.nx * choreography.lanePull * (0.24 + readabilityPressure * 0.20) * bypassField.influence;
          vy += choreography.bypassLift * (1.22 + readabilityPressure * 0.64) * bypassField.influence;
          vz += 0.00016 * bypassField.influence * (0.4 + readabilityPressure);
          wakeTarget = Math.max(wakeTarget, bypassField.influence * 0.66);
        }
      }

      if (speciesId !== 'sparkFilament') {
        const copyField = sampleBoxFieldNormal(
          px + 0.35,
          py - 0.25,
          pz - 0.65,
          2.85,
          2.4,
          1.65,
          1.0 + readabilityPressure * 0.28
        );
        if (copyField) {
          const titleGuard = speciesBehavior.textGuard || 1;
          const corridorSweep = (0.00084 + readabilityPressure * 0.00108) * copyField.influence * titleGuard;
          const lateralSign = px >= -0.35 ? 1 : -1;
          vx += lateralSign * corridorSweep * (speciesId === 'flowRibbon' ? 1.18 : 1.0);
          vy += corridorSweep * (0.92 + readabilityPressure * 0.72);
          vz += corridorSweep * (0.28 + readabilityPressure * 0.18);
          wakeTarget = Math.max(wakeTarget, copyField.influence * 0.78);
          adhesionTarget *= 0.72;
          cohesion = Math.max(0.04, cohesion - copyField.influence * (0.04 + readabilityPressure * 0.04));
        }
      }

      if (py < VORTEX_PARAMS.floorHeight + 1.0) {
        const floorLift = clamp01(1 - (py - VORTEX_PARAMS.floorHeight) / 1.0);
        vx += macro.x * VORTEX_PARAMS.floorSkimStrength * floorLift;
        vz += macro.z * VORTEX_PARAMS.floorSkimStrength * floorLift;
        vy += floorLift * 0.00048;
        adhesionTarget = Math.max(adhesionTarget, floorLift * 0.74);
      }

      const hammerField = sampleBoxFieldNormal(px - hammerGroup.position.x, py - hammerGroup.position.y, pz - hammerGroup.position.z, 0.42, 1.08, 0.34, 1.18);
      const hammerHandle = sampleCapsuleField(px, py, pz, hammerGroup.position.x - 0.10, hammerGroup.position.y - 1.22, hammerGroup.position.z, hammerGroup.position.x + 0.12, hammerGroup.position.y + 0.18, hammerGroup.position.z, 0.18, 0.92);
      const wrenchBody = sampleCapsuleField(px, py, pz, wrenchGroup.position.x, wrenchGroup.position.y - 1.12, wrenchGroup.position.z, wrenchGroup.position.x, wrenchGroup.position.y + 0.82, wrenchGroup.position.z, 0.22, 1.08);
      const wrenchJawA = sampleBoxFieldNormal(px - (wrenchGroup.position.x + 0.18), py - (wrenchGroup.position.y + 0.94), pz - wrenchGroup.position.z, 0.18, 0.22, 0.16, 0.66);
      const wrenchJawB = sampleBoxFieldNormal(px - (wrenchGroup.position.x - 0.16), py - (wrenchGroup.position.y + 0.82), pz - wrenchGroup.position.z, 0.16, 0.18, 0.16, 0.64);
      const sawBlade = sampleBoxFieldNormal(px - sawGroup.position.x, py - sawGroup.position.y, pz - sawGroup.position.z, 0.98, 0.16, 0.14, 0.92);
      const sawHandle = sampleCapsuleField(px, py, pz, sawGroup.position.x + 0.54, sawGroup.position.y - 0.30, sawGroup.position.z, sawGroup.position.x + 1.12, sawGroup.position.y + 0.22, sawGroup.position.z, 0.18, 0.72);
      const sdfFields = [hammerField, hammerHandle, wrenchBody, wrenchJawA, wrenchJawB, sawBlade, sawHandle];
      for (let f = 0; f < sdfFields.length; f++) {
        const field = sdfFields[f];
        if (!field) continue;
        const repel = VORTEX_PARAMS.toolDeflectStrength * deflectForce * field.influence;
        vx += field.nx * repel * 0.42;
        vy += field.ny * repel * 0.34;
        vz += field.nz * repel * 0.18;
        adhesionTarget = Math.max(adhesionTarget, field.influence * 0.66);
      }

      const hammerPlume = sampleOrbitCell(px, py, pz, {
        x: hammerGroup.position.x - 0.14,
        y: hammerGroup.position.y - 0.84,
        z: hammerGroup.position.z,
        radius: 1.7,
        pull: 0.72,
        spin: -0.72,
        zLift: 0.02,
      });
      if (hammerPlume && toolWakeState.hammer > 0.02) {
        const hammerWake = choreography.toolWakeStrength * toolWakeState.hammer * hammerPlume.influence;
        vx += hammerPlume.tx * hammerWake * 0.62;
        vy += hammerPlume.ty * hammerWake * 0.34;
        vy -= hammerWake * 0.88;
        vz += hammerPlume.nz * hammerWake * 0.18;
      }

      const wrenchWake = sampleOrbitCell(px, py, pz, {
        x: wrenchGroup.position.x + 0.18,
        y: wrenchGroup.position.y + 0.7,
        z: wrenchGroup.position.z,
        radius: 1.64,
        pull: 0.82,
        spin: 1.12,
        zLift: 0.03,
      });
      if (wrenchWake && toolWakeState.wrench > 0.02) {
        const wrenchTwist = choreography.toolWakeStrength * toolWakeState.wrench * wrenchWake.influence;
        vx += wrenchWake.tx * wrenchTwist;
        vy += wrenchWake.ty * wrenchTwist;
        vz += wrenchWake.nz * wrenchTwist * 0.24;
      }

      const sawWakeField = sampleOrbitCell(px, py, pz, {
        x: sawGroup.position.x + 0.18,
        y: sawGroup.position.y + 0.06,
        z: sawGroup.position.z + 0.12,
        radius: 1.92,
        pull: 0.9,
        spin: 1.28,
        zLift: 0.06,
      });
      if (sawWakeField && toolWakeState.saw > 0.02) {
        const sawWake = choreography.toolWakeStrength * toolWakeState.saw * sawWakeField.influence;
        vx += sawWakeField.tx * sawWake;
        vy += sawWakeField.ty * sawWake;
        vz += sawWakeField.tz * sawWake * 0.54;
        vx += sawWakeField.nx * sawWake * 0.16;
        wakeTarget = Math.max(wakeTarget, sawWakeField.influence * toolWakeState.saw);
      }

      if (proxTool && proxStr > 0.02 && dist > 0.01) {
        const proxForce = proxStr * (1 - Math.min(1, dist / VORTEX_PARAMS.vortexRadius));
        if (proxTool === 'hammer') {
          vy -= proxForce * 0.0022;
          vx += Math.sign(dx || 1) * proxForce * 0.0011;
        } else if (proxTool === 'wrench') {
          vx += (-dy / dist) * proxForce * 0.0036;
          vy += (dx / dist) * proxForce * 0.0036;
        } else if (proxTool === 'saw') {
          vx += (-dy / dist) * proxForce * 0.0044;
          vy += (dx / dist) * proxForce * 0.0044;
          vz += proxForce * 0.00062;
        }
      }

      if (VORTEX_PARAMS.sawSpeedRatio > 0.01) {
        const sdx = px - VORTEX_PARAMS.sawWorldX;
        const sdy = py - VORTEX_PARAMS.sawWorldY;
        const sdz = pz - VORTEX_PARAMS.sawWorldZ;
        const sdist = Math.sqrt(sdx * sdx + sdy * sdy + sdz * sdz);
        if (sdist < VORTEX_PARAMS.sawInductionRadius && sdist > 0.01) {
          const sf = 1 - sdist / VORTEX_PARAMS.sawInductionRadius;
          const tang = VORTEX_PARAMS.sawInductionStrength * (0.55 + SCENE_STATE.focus * 0.45) * VORTEX_PARAMS.sawSpeedRatio * sf;
          vx += (-sdy / sdist) * tang;
          vy += (sdx / sdist) * tang;
          vx += (sdx / sdist) * tang * 0.22;
          vy += (sdy / sdist) * tang * 0.18;
        }
      }

      if (SCENE_STATE.gather > 0 && dist < VORTEX_PARAMS.vortexRadius * 1.18 && dist > 0.01) {
        const clump = VORTEX_PARAMS.clumpStrength * clumpForce * SCENE_STATE.gather * (1 - dist / (VORTEX_PARAMS.vortexRadius * 1.18));
        vx -= (dx / dist) * clump;
        vy -= (dy / dist) * clump;
        vz -= (dz / dist) * clump * 0.28;
      } else if (SCENE_STATE.release > 0 && dist < VORTEX_PARAMS.shockwaveRadius * 2.6 && dist > 0.01) {
        vx += (dx / dist) * VORTEX_PARAMS.releaseSpread * releaseForce * SCENE_STATE.release * 1.22;
        vy += (dy / dist) * VORTEX_PARAMS.releaseSpread * releaseForce * SCENE_STATE.release * 1.05;
        vz += (dz / dist) * VORTEX_PARAMS.releaseSpread * releaseForce * SCENE_STATE.release * 0.55;
      }

      wake += (wakeTarget - wake) * 0.16;
      wake *= 0.992;
      cohesion += ((0.18 + SCENE_STATE.gather * 0.46 + wake * 0.18) - cohesion) * 0.08;
      adhesion += (adhesionTarget - adhesion) * 0.18;
      cohesion = clamp01(cohesion);
      adhesion = clamp01(adhesion * (lifeNorm > 0.92 ? 0.97 : 1.0));

      if (adhesion > 0.06) {
        const slip = choreography.floorRibbonStrength * adhesion * (speciesId === 'flowRibbon' ? 0.94 : 0.58);
        vx += macro.x * slip;
        vz += macro.z * slip * 0.88;
        vy += adhesion * 0.00012;
      }

      const entropy = sampleEntropy(i * 13.1 + system.speciesPhase[i] * 2.7, nowMs);
      vx += entropy.x * VORTEX_PARAMS.entropyStrength * speciesEntropy * (0.36 + pointerWakeForce * 0.28 + wake * 0.16);
      vy += entropy.y * VORTEX_PARAMS.entropyStrength * speciesEntropy * 0.54;
      vz += entropy.z * VORTEX_PARAMS.entropyStrength * speciesEntropy * (0.28 + wake * 0.08);

      vx += px * 0.000022;
      vy += py * 0.000010;
      vx *= effectiveDamping;
      vy *= effectiveDamping;
      vz *= effectiveDamping;

      if (pz < -1.8) vz += (-1.8 - pz) * 0.00016;
      if (pz > 2.9) vz -= (pz - 2.9) * 0.00010;

      const vmag = Math.sqrt(vx * vx + vy * vy + vz * vz);
      const velocityCap = speciesId === 'sparkFilament'
        ? VORTEX_PARAMS.velocityCap * 1.48
        : (speciesId === 'flowRibbon' ? VORTEX_PARAMS.velocityCap * 0.86 : VORTEX_PARAMS.velocityCap);
      if (vmag > velocityCap) {
        const scale = velocityCap / vmag;
        vx *= scale;
        vy *= scale;
        vz *= scale;
      }

      prev[ix] = px;
      prev[iy] = py;
      prev[iz] = pz;
      px += vx;
      py += vy;
      pz += vz;

      if (
        py > Math.min(VORTEX_PARAMS.boundaryTop, 8.8) ||
        py < Math.max(VORTEX_PARAMS.boundaryBottom, -8.8) ||
        Math.abs(px) > 14.2 ||
        Math.abs(pz) > 4.6
      ) {
        initializeParticle(system, i);
        px = pos[ix];
        py = pos[iy];
        pz = pos[iz];
        vx = vel[ix];
        vy = vel[iy];
        vz = vel[iz];
      }

      const chargeTarget = (
        SCENE_STATE.pointerWake * 0.18
        + SCENE_STATE.gather * 0.42
        + SCENE_STATE.release * 0.68
        + wake * 0.36
        + adhesion * 0.16
        + cohesion * 0.12
      );
      system.charges[i] += (chargeTarget - system.charges[i]) * (speciesId === 'sparkFilament' ? 0.16 : 0.09);
      system.charges[i] = clamp01(system.charges[i] * (lifeNorm > 0.82 ? 0.96 : 1.0));

      if (system.trailPositions) {
        const historyBase = i * system.species.trailLength * 3;
        const head = (system.trailHead[i] + 1) % system.species.trailLength;
        const historyIndex = historyBase + head * 3;
        system.trailPositions[historyIndex] = px;
        system.trailPositions[historyIndex + 1] = py;
        system.trailPositions[historyIndex + 2] = pz;
        system.trailHead[i] = head;
        const oldest = historyBase + ((head + 1) % system.species.trailLength) * 3;
        system.trailHeads[ix] = system.trailPositions[oldest];
        system.trailHeads[ix + 1] = system.trailPositions[oldest + 1];
        system.trailHeads[ix + 2] = system.trailPositions[oldest + 2];
      } else {
        const trailEase = 0.14 + wake * 0.12 + adhesion * 0.08;
        system.trailHeads[ix] += (px - system.trailHeads[ix]) * trailEase;
        system.trailHeads[ix + 1] += (py - system.trailHeads[ix + 1]) * trailEase;
        system.trailHeads[ix + 2] += (pz - system.trailHeads[ix + 2]) * trailEase;
      }

      system.cohesion[i] = cohesion;
      system.adhesion[i] = adhesion;
      system.wake[i] = wake;
      pos[ix] = px;
      pos[iy] = py;
      pos[iz] = pz;
      vel[ix] = vx;
      vel[iy] = vy;
      vel[iz] = vz;
      if (i % activityStride === 0) {
        activitySum += Math.min(1.8, Math.sqrt(vx * vx + vy * vy + vz * vz) * 31);
        activitySamples++;
      }
    }
    if (system.geo) {
      system.geo.attributes.position.needsUpdate = true;
      if (system.velocityAttr) system.velocityAttr.needsUpdate = true;
      if (system.chargeAttr) system.chargeAttr.needsUpdate = true;
    } else {
      updateRibbonInstances(system);
    }
    system.activity = activitySamples ? activitySum / activitySamples : 0;
    speciesActivity[speciesId] = system.activity;
  }

  function sampleZoneDensity(zone) {
    let sum = 0;
    let samples = 0;
    for (const system of simulatedParticleSystems) {
      const stride = Math.max(1, Math.floor(system.count / 160));
      const speciesWeight = system.species.id === 'flowRibbon'
        ? 1.18
        : (system.species.id === 'cloudMote' ? 1.0 : (system.species.id === 'sparkFilament' ? 1.12 : 0.72));
      for (let i = 0; i < system.count; i += stride) {
        const ix = i * 3;
        const dx = (system.positions[ix] - zone.x) / zone.rx;
        const dy = (system.positions[ix + 1] - zone.y) / zone.ry;
        const dz = (system.positions[ix + 2] - zone.z) / zone.rz;
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
        if (dist >= 1) continue;
        sum += (1 - dist) * speciesWeight;
        samples += speciesWeight;
      }
    }
    return samples ? clamp01(sum / Math.max(1, samples * 0.42)) : 0;
  }

  function updateAtmosphereMetrics() {
    atmosphereMetrics.vortex = sampleZoneDensity({
      x: VORTEX_PARAMS.centerX * 0.72,
      y: VORTEX_PARAMS.centerY * 0.72 + 0.4,
      z: 0.9,
      rx: 2.4,
      ry: 2.1,
      rz: 1.4,
    });
    atmosphereMetrics.titleHalo = sampleZoneDensity({
      x: -0.1,
      y: 1.6,
      z: 1.1,
      rx: 4.4,
      ry: 2.2,
      rz: 1.7,
    });
    atmosphereMetrics.foreground = sampleZoneDensity({
      x: 0.0,
      y: -1.0,
      z: 1.0,
      rx: 5.2,
      ry: 1.8,
      rz: 1.6,
    });
    atmosphereMetrics.floor = sampleZoneDensity({
      x: 0.2,
      y: VORTEX_PARAMS.floorHeight + 0.42,
      z: 0.4,
      rx: 5.8,
      ry: 0.9,
      rz: 1.4,
    });
    atmosphereMetrics.sawWake = sampleZoneDensity({
      x: sawGroup.position.x + 0.16,
      y: sawGroup.position.y + 0.18,
      z: sawGroup.position.z + 0.3,
      rx: 2.1,
      ry: 1.5,
      rz: 1.4,
    });
    atmosphereMetrics.copy = sampleZoneDensity({
      x: -0.25,
      y: 0.0,
      z: 0.8,
      rx: 3.8,
      ry: 2.5,
      rz: 1.9,
    });
  }

  /* ─── Vortex shockwave (click blast) ─────────────────── */
  function applyVortexShockwave(system, clickWorldPos) {
    if (!system) return;
    const pos = system.positions;
    const vel = system.velocities;
    const tierImpulseBoost = SCENE_CONFIG.qualityTier === 'low'
      ? 1.38
      : (SCENE_CONFIG.qualityTier === 'mobile' ? 1.14 : 1.0);
    const tierRadiusBoost = SCENE_CONFIG.qualityTier === 'low'
      ? 1.18
      : (SCENE_CONFIG.qualityTier === 'mobile' ? 1.08 : 1.0);
    const effectiveRadius = VORTEX_PARAMS.shockwaveRadius * tierRadiusBoost;
    const impulseScale = system.species?.id === 'flowRibbon'
      ? 1.18
      : (system.species?.id === 'microDust' ? 1.02 : (system.species?.id === 'cloudMote' ? 0.88 : 1.24));
    for (let i = 0; i < system.count; i++) {
      const ix = i * 3, iy = i * 3 + 1, iz = i * 3 + 2;
      const dx = pos[ix] - clickWorldPos.x;
      const dy = pos[iy] - clickWorldPos.y;
      const dz = pos[iz] - clickWorldPos.z;
      const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
      if (dist < effectiveRadius && dist > 0.01) {
        const impulse = VORTEX_PARAMS.shockwaveImpulse * tierImpulseBoost * impulseScale * (1 - dist / effectiveRadius);
        const displacement = Math.min(
          0.062,
          impulse * (SCENE_CONFIG.qualityTier === 'low' ? 0.042 : 0.026) * (system.species?.id === 'flowRibbon' ? 1.22 : 1.0)
        );
        pos[ix] += (dx / dist) * displacement;
        pos[iy] += (dy / dist) * displacement;
        pos[iz] += (dz / dist) * displacement * 0.42;
        vel[ix] += (dx / dist) * impulse;
        vel[iy] += (dy / dist) * impulse;
        vel[iz] += (dz / dist) * impulse;
        system.charges[i] = clamp01(system.charges[i] + 0.18 + impulseScale * 0.05);
        if (system.wake) system.wake[i] = clamp01(system.wake[i] + 0.30 + impulseScale * 0.09);
        if (system.cohesion) system.cohesion[i] = clamp01(system.cohesion[i] + 0.14);
      }
    }
  }

  function applyPulseShockwave(point) {
    for (const system of pulseParticleSystems) {
      applyVortexShockwave(system, point);
    }
  }

  function focusVortexAt(point) {
    VORTEX_PARAMS.centerX = point.x;
    VORTEX_PARAMS.centerY = point.y;
    VORTEX_PARAMS.centerZ = point.z || 0;
    if (pointerTrail.length) {
      const trailDX = Math.abs(VORTEX_PARAMS.mouseVelocityX) > 0.0001 ? VORTEX_PARAMS.mouseVelocityX * 5.5 : 0.12;
      const trailDY = Math.abs(VORTEX_PARAMS.mouseVelocityY) > 0.0001 ? -VORTEX_PARAMS.mouseVelocityY * 3.0 : -0.06;
      commitPointerTrailNode(point.x, point.y, point.z || 0.4, trailDX, trailDY, 0.08, 0.42);
      lastPointerTrailCommit = performance.now();
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

const beamCanvas = document.createElement('canvas');
beamCanvas.width = 128;
beamCanvas.height = 512;
const beamCtx = beamCanvas.getContext('2d');
const beamGrad = beamCtx.createLinearGradient(0, 0, 0, 512);
beamGrad.addColorStop(0.0, 'rgba(255, 216, 146, 0.0)');
beamGrad.addColorStop(0.18, 'rgba(255, 208, 132, 0.34)');
beamGrad.addColorStop(0.62, 'rgba(98, 136, 188, 0.16)');
beamGrad.addColorStop(1.0, 'rgba(0, 0, 0, 0.0)');
beamCtx.fillStyle = beamGrad;
beamCtx.fillRect(0, 0, 128, 512);
const beamTex = new THREE.CanvasTexture(beamCanvas);

function makeAuraCard(width, height, color, opacity) {
  return new THREE.Mesh(
    new THREE.PlaneGeometry(width, height),
    new THREE.MeshBasicMaterial({
      map: particleTex,
      color,
      transparent: true,
      opacity,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      depthTest: false,
    })
  );
}

function makeBeamCard(width, height, color, opacity) {
  return new THREE.Mesh(
    new THREE.PlaneGeometry(width, height),
    new THREE.MeshBasicMaterial({
      map: beamTex,
      color,
      transparent: true,
      opacity,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      depthTest: false,
      side: THREE.DoubleSide,
    })
  );
}

const sparkAuraCard = makeAuraCard(3.6, 3.6, 0x7fd3ff, 0.0);
sparkAuraCard.renderOrder = 998;
scene.add(sparkAuraCard);

const cloudAuraCard = makeAuraCard(7.8, 5.8, 0xffac57, 0.0);
cloudAuraCard.renderOrder = 997;
scene.add(cloudAuraCard);

const keyBeamCard = makeBeamCard(4.8, 11.5, 0xffc46f, SCENE_CONFIG.featureFlags.volumetricCards ? 0.09 : 0.0);
keyBeamCard.position.set(-3.0, 2.4, -0.4);
keyBeamCard.rotation.set(0.24, 0.28, -0.14);
scene.add(keyBeamCard);

const sawBeamCard = makeBeamCard(3.4, 7.4, 0xffa255, SCENE_CONFIG.featureFlags.volumetricCards ? 0.0 : 0.0);
sawBeamCard.position.set(0.2, 2.8, 0.8);
sawBeamCard.rotation.set(-0.2, 0.0, 0.06);
scene.add(sawBeamCard);

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

  async function getMeshoptDecoder() {
    const decoder = window.MeshoptDecoder;
    if (!decoder) return null;
    if (decoder.ready && typeof decoder.ready.then === 'function') {
      await decoder.ready;
    }
    return decoder;
  }

  async function loadGLBModels() {
    const loader = new THREE.GLTFLoader();
    const meshoptDecoder = await getMeshoptDecoder();
    if (meshoptDecoder && typeof loader.setMeshoptDecoder === 'function') {
      loader.setMeshoptDecoder(meshoptDecoder);
    }
    let loaded = 0;
    const total = 2;
    const load = url => new Promise((res, rej) => loader.load(url, (gltf) => {
      loaded++;
      window.__preloaderProgress?.(Math.round((loaded / total) * 90)); // 0–90%, leave 10% for fonts
      res(gltf);
    }, undefined, rej));
    window.__preloaderProgress?.(10); // signal start
    const [wrenchGltf, sawGltf] = await Promise.all([
      load('assets/models/pipe-wrench.glb'),
      load('assets/models/handsaw.glb'),
    ]);
    populateWrenchFromGLB(wrenchGltf);
    populateSawFromGLB(sawGltf);
    assetMode = 'glb';
  }


  /* ─── Tooltip overlay (opacity/visibility transition) ─── */
  const tooltip = document.createElement('div');
  tooltip.id = 'tool-tooltip';
  Object.assign(tooltip.style, {
    position: 'fixed',
    visibility: 'hidden',
    opacity: '0',
    pointerEvents: 'none',
    fontFamily: 'var(--font-mono)',
    fontSize: '11px',
    lineHeight: '1.65',
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    color: 'rgba(244, 213, 160, 0.94)',
    background: 'linear-gradient(180deg, rgba(25,18,13,0.95), rgba(12,10,8,0.92))',
    border: '1px solid rgba(221,165,88,0.34)',
    borderRadius: '14px',
    padding: '11px 13px',
    maxWidth: '216px',
    zIndex: '9999',
    boxShadow: '0 18px 44px rgba(0,0,0,0.34), inset 0 1px 0 rgba(255,231,191,0.05)',
    backdropFilter: 'blur(14px)',
    transition: 'opacity 0.18s ease',
  });
  document.body.appendChild(tooltip);

  let tooltipHideTimer = null;

  const toolInfo = {
    hammer: {
      title: 'FRAMING HAMMER', sub: '20 oz Milled Face',
      desc: 'Framing · Demolition\nNailing · Forming',
      hint: 'Click to inspect  ·  drag to stir the field',
      specs: { Weight: '20 oz', Handle: 'Hickory', Face: 'Milled', Length: '16 in' },
      apps: ['Framing & Demolition', 'Nailing & Forming'],
      cta: 'Get a Quote',
    },
    wrench: {
      title: 'ADJUSTABLE WRENCH', sub: '12" Chrome-Plated',
      desc: 'Fastening · Plumbing\nRepair · Installation',
      hint: 'Click to inspect  ·  drag to stir the field',
      specs: { Length: '12 in', Jaw: '35 mm max', Material: 'Chrome Steel', Finish: 'Polished' },
      apps: ['Fastening & Plumbing', 'Repair & Installation'],
      cta: 'Get a Quote',
    },
    saw: {
      title: 'CIRCULAR SAW BLADE', sub: '7-1/4" Carbide Tipped',
      desc: 'Framing · Decking\nDemolition · Finish Cuts',
      hint: 'Click to inspect  ·  drag to stir the field',
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
    width: '292px',
    background: 'linear-gradient(180deg, rgba(24,19,14,0.96), rgba(10,10,10,0.97))',
    border: '1px solid rgba(202,150,78,0.30)',
    borderRight: 'none',
    borderRadius: '20px 0 0 20px',
    padding: '0',
    zIndex: '9998',
    fontFamily: 'var(--font-body)',
    fontSize: '12px',
    lineHeight: '1.7',
    letterSpacing: '0.01em',
    color: 'rgba(237, 218, 188, 0.86)',
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
      background: 'linear-gradient(135deg, rgba(223,151,61,0.18) 0%, rgba(104,129,166,0.08) 100%)',
      borderBottom: '1px solid rgba(225,171,90,0.18)',
      padding: '18px 18px 14px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
    });

    const titleWrap = document.createElement('div');
    const diamond = document.createElement('span');
    diamond.textContent = '\u25C8 ';
    diamond.style.color = 'rgba(246, 193, 111, 0.84)';
    titleWrap.appendChild(diamond);
    const titleEl = document.createElement('strong');
    titleEl.textContent = info.title;
    titleEl.style.cssText = 'color:#f1d8a5;font-family:var(--font-display);font-size:22px;font-weight:700;letter-spacing:0.01em;line-height:1.05;';
    titleWrap.appendChild(titleEl);
    const subEl = document.createElement('div');
    subEl.textContent = info.sub;
    subEl.style.cssText = 'opacity:0.66;font-family:var(--font-mono);font-size:10px;letter-spacing:0.12em;text-transform:uppercase;margin-top:6px;';
    titleWrap.appendChild(subEl);
    header.appendChild(titleWrap);

    const closeBtn = document.createElement('button');
    closeBtn.textContent = '\u00D7';
    Object.assign(closeBtn.style, {
      background: 'rgba(255,255,255,0.02)',
      border: '1px solid rgba(225,171,90,0.22)',
      color: '#f3d19b',
      cursor: 'pointer',
      fontSize: '14px',
      lineHeight: '1',
      padding: '6px 9px',
      borderRadius: '999px',
      fontFamily: 'var(--font-mono)',
    });
    closeBtn.addEventListener('click', closePanel);
    header.appendChild(closeBtn);
    infoPanel.appendChild(header);

    // Body
    const body = document.createElement('div');
    body.style.padding = '16px 18px 18px';

    // Specs section
    const specsLabel = document.createElement('div');
    specsLabel.textContent = 'SPECIFICATIONS';
    specsLabel.style.cssText = 'color:rgba(241,190,109,0.82);font-family:var(--font-mono);font-size:10px;letter-spacing:0.16em;margin-bottom:8px;';
    body.appendChild(specsLabel);

    const specsTable = document.createElement('div');
    specsTable.style.marginBottom = '16px';
    Object.entries(info.specs).forEach(([k, v], idx) => {
      const row = document.createElement('div');
      const rowBg = idx % 2 === 0 ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.012)';
      row.style.cssText = `display:flex;justify-content:space-between;gap:16px;padding:6px 10px;border-radius:10px;background:${rowBg};`;
      const keyEl = document.createElement('span');
      keyEl.textContent = k;
      keyEl.style.cssText = 'opacity:0.56;font-family:var(--font-mono);font-size:10px;letter-spacing:0.08em;text-transform:uppercase;';
      const valEl = document.createElement('span');
      valEl.textContent = v;
      valEl.style.cssText = 'color:#f0d4a2;font-weight:500;text-align:right;';
      row.appendChild(keyEl);
      row.appendChild(valEl);
      specsTable.appendChild(row);
    });
    body.appendChild(specsTable);

    // Applications section
    const appsLabel = document.createElement('div');
    appsLabel.textContent = 'APPLICATIONS';
    appsLabel.style.cssText = 'color:rgba(241,190,109,0.82);font-family:var(--font-mono);font-size:10px;letter-spacing:0.16em;margin-bottom:8px;';
    body.appendChild(appsLabel);

    const appsList = document.createElement('div');
    appsList.style.marginBottom = '18px';
    info.apps.forEach(app => {
      const item = document.createElement('div');
      item.style.cssText = 'padding:4px 0;';
      const bullet = document.createElement('span');
      bullet.textContent = '\u25B8 ';
      bullet.style.color = '#dca157';
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
      width: '100%', padding: '12px 0',
      background: 'linear-gradient(135deg, #9f5f1d, #e0a14e)',
      border: 'none',
      borderRadius: '999px', color: '#17110b',
      fontFamily: 'var(--font-mono)', fontSize: '11px', fontWeight: '700',
      letterSpacing: '0.18em', cursor: 'pointer',
      boxShadow: '0 14px 28px rgba(159,95,29,0.28)',
      transition: 'box-shadow 0.18s ease, transform 0.12s ease',
    });
    cta.addEventListener('mouseenter', () => {
      cta.style.boxShadow = '0 18px 34px rgba(180,116,38,0.36)';
      cta.style.transform = 'translateY(-1px)';
    });
    cta.addEventListener('mouseleave', () => {
      cta.style.boxShadow = '0 14px 28px rgba(159,95,29,0.28)';
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
    titleEl.style.cssText = 'display:block;color:#f2dab0;font-family:var(--font-display);font-size:17px;line-height:1.05;letter-spacing:0.01em;';
    tooltip.appendChild(titleEl);

    const subEl = document.createElement('span');
    subEl.textContent = info.sub;
    subEl.style.cssText = 'display:block;margin-top:5px;opacity:0.66;font-family:var(--font-mono);font-size:9px;letter-spacing:0.14em;';
    tooltip.appendChild(subEl);

    const hr = document.createElement('hr');
    hr.style.cssText = 'border:none;border-top:1px solid rgba(221,165,88,0.24);margin:8px 0 7px';
    tooltip.appendChild(hr);

    const descEl = document.createElement('span');
    descEl.textContent = info.desc;
    descEl.style.cssText = 'display:block;opacity:0.84;white-space:pre-line;text-transform:none;letter-spacing:0.02em;';
    tooltip.appendChild(descEl);

    if (info.hint) {
      const hr2 = document.createElement('hr');
      hr2.style.cssText = 'border:none;border-top:1px solid rgba(221,165,88,0.16);margin:8px 0 5px';
      tooltip.appendChild(hr2);
      const hintEl = document.createElement('span');
      hintEl.textContent = info.hint;
      hintEl.style.cssText = 'display:block;opacity:0.5;font-family:var(--font-mono);font-size:9px;letter-spacing:0.08em;';
      tooltip.appendChild(hintEl);
    }

    // Clamp to viewport
    const x = Math.min(screenX + 18, window.innerWidth  - 228);
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

  let sceneReadySignaled = false;

  function signalSceneReady() {
    if (sceneReadySignaled) return;
    sceneReadySignaled = true;
    window.__preloaderProgress?.(100);
    if (typeof window.__resolveSceneAssetsReady === 'function') {
      window.__resolveSceneAssetsReady();
      window.__resolveSceneAssetsReady = null;
    }
    window.dispatchEvent(new CustomEvent('three-scene:ready'));
  }

  function markFrameRendered() {
    renderedFrameCount += 1;
    if (bootHealthy) return;
    bootHealthy = true;
    signalSceneReady();
  }

  function setObjectOpacity(object, opacity) {
    object.traverse((node) => {
      if (!node.material) return;
      const materials = Array.isArray(node.material) ? node.material : [node.material];
      materials.forEach((material) => {
        if (!material || typeof material.opacity !== 'number') return;
        if (opacity < 1 && !material.transparent) material.transparent = true;
        material.opacity = opacity;
      });
    });
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
    const moveDelta = Math.abs(e.clientX - rawMouseX) + Math.abs(e.clientY - rawMouseY);
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
        markInteraction(SCENE_CONFIG.interaction.hoverBoost);
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
    if (moveDelta > 5) markInteraction(SCENE_CONFIG.interaction.moveBoost);
  });

  /* ─── Touch interaction for mobile ─────────────────────── */
  let prevPinchDist = null;
  let longPressTimer = null;
  let swipeStartX = null, swipeStartY = null;
  let touchChargeArmed = false;
  let touchSceneDrag = false;

  canvas.addEventListener('touchstart', (e) => {
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      swipeStartX = e.touches[0].clientX;
      swipeStartY = e.touches[0].clientY;
      rawMouseX = touch.clientX;
      rawMouseY = touch.clientY;
      mouseX = (touch.clientX / window.innerWidth) * 2 - 1;
      mouseY = (touch.clientY / window.innerHeight) * 2 - 1;
      touchChargeArmed = false;
      const tx = (touch.clientX / window.innerWidth) * 2 - 1;
      const ty = (touch.clientY / window.innerHeight) * 2 - 1;
      mouseVec.set(tx, ty);
      raycaster.setFromCamera(mouseVec, camera);
      const touchTargets = [];
      [hammerGroup, wrenchGroup, sawGroup].forEach(grp => {
        grp.traverse(o => { if (o.userData.toolId) touchTargets.push(o); });
      });
      touchSceneDrag = raycaster.intersectObjects(touchTargets).length > 0;
      // Long-press arms a charged pulse on release.
      longPressTimer = setTimeout(() => {
        touchChargeArmed = true;
        interactionCharge = Math.max(interactionCharge, 0.85);
        markInteraction(0.32);
      }, SCENE_CONFIG.interaction.touchLongPressMs);
    } else if (e.touches.length === 2 && SCENE_CONFIG.experimentalGestures) {
      clearTimeout(longPressTimer);
      const t0 = e.touches[0], t1 = e.touches[1];
      prevPinchDist = Math.hypot(t1.clientX - t0.clientX, t1.clientY - t0.clientY);
    }
  }, { passive: true });

  canvas.addEventListener('touchmove', (event) => {
    clearTimeout(longPressTimer);
    if (event.touches.length === 1) {
      const touch = event.touches[0];
      if (Math.hypot(touch.clientX - (swipeStartX || touch.clientX), touch.clientY - (swipeStartY || touch.clientY)) > 10) {
        clearTimeout(longPressTimer);
      }
      if (!touchSceneDrag) return;
      event.preventDefault();
      mouseX = (touch.clientX / window.innerWidth) * 2 - 1;
      mouseY = (touch.clientY / window.innerHeight) * 2 - 1;
      rawMouseX = touch.clientX;
      rawMouseY = touch.clientY;
      markInteraction(SCENE_CONFIG.interaction.moveBoost);
    } else if (event.touches.length === 2 && SCENE_CONFIG.experimentalGestures) {
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
          applyVortexShockwave(flowRibbonSystem, { x: mwx, y: mwy, z: 0 });
          applyVortexShockwave(sparkFilamentSystem, { x: mwx, y: mwy, z: 0 });
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
    touchSceneDrag = false;
    if (swipeStartX === null) return;
    const t = e.changedTouches[0];
    const sdx = t.clientX - swipeStartX;
    const sdy = t.clientY - swipeStartY;
    const swipeDist = Math.hypot(sdx, sdy);
    swipeStartX = null; swipeStartY = null;
    if (touchChargeArmed) {
      touchChargeArmed = false;
      const wx = ((t.clientX / window.innerWidth) * 2 - 1) * 5.5;
      const wy = -((t.clientY / window.innerHeight) * 2 - 1) * 3.0;
      clickWorldPos = { x: wx, y: wy, z: 0 };
      focusVortexAt(clickWorldPos);
      emitSparks(wx, wy, 0xffd98a, 14);
      applyPulseShockwave(clickWorldPos);
      implosionActive = true;
      implosionStart = performance.now();
      triggerReleasePulse(0.62, 920);
    } else if (swipeDist > 60 && SCENE_CONFIG.experimentalGestures) {
      if (Math.abs(sdx) > Math.abs(sdy)) {
        // Horizontal swipe → spin all tools
        const rotDir = sdx > 0 ? 0.025 : -0.025;
        inertia.hammer += rotDir;
        inertia.wrench += rotDir;
      } else if (sdy < 0) {
        // Swipe up → scatter
        applyVortexShockwave(flowRibbonSystem, { x: 0, y: 0, z: 0 });
        applyVortexShockwave(sparkFilamentSystem, { x: 0, y: 0, z: 0 });
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
        focusVortexAt(clickWorldPos);
        applyPulseShockwave(clickWorldPos);
        implosionActive = true;
        implosionStart = performance.now();
        triggerReleasePulse(0.55, 900);
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
    if (SCENE_CONFIG.experimentalGestures && dt < 400 && lastClickTool === toolId) {
      triggerDisassemble(toolId);
      lastClickTime = 0;
      return;
    }
    lastClickTime = now;
    lastClickTool = toolId;
    markInteraction(SCENE_CONFIG.interaction.toolClickBoost);
    triggerReleasePulse(0.24, 680);

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
    emitSparks(getToolGroup(toolId).position.x, getToolGroup(toolId).position.y, toolId === 'wrench' ? 0x8bcfff : 0xffb25f, toolId === 'saw' ? 12 : 9);
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
      focusVortexAt(clickWorldPos);
      applyPulseShockwave(clickWorldPos);
      implosionActive = true;
      implosionStart = performance.now();
      triggerReleasePulse(0.62, 920);
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
      VORTEX_PARAMS.pointerWake = Math.min(1.0, VORTEX_PARAMS.pointerWake + 0.42);
      VORTEX_PARAMS.turbulenceMode = Math.min(1.0, VORTEX_PARAMS.turbulenceMode + 0.18);
      interactionCharge = Math.max(interactionCharge, 0.32);
      markInteraction(SCENE_CONFIG.interaction.dragStartBoost);
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
    VORTEX_PARAMS.pointerWake = Math.min(1.0, VORTEX_PARAMS.pointerWake + Math.min(0.18, Math.abs(dragVel) * 5.4));
    VORTEX_PARAMS.turbulenceMode = Math.min(1.0, VORTEX_PARAMS.turbulenceMode + 0.08);
    VORTEX_PARAMS.windStrength = Math.min(0.022, VORTEX_PARAMS.baseWindStrength + dragWindBoost);
    interactionCharge = Math.min(1.0, interactionCharge + Math.min(0.08, Math.abs(dragVel) * SCENE_CONFIG.interaction.dragMoveGain));
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
      applyPulseShockwave(lateralPos);
    }
    // Reset wind boost back to base after drag ends
    VORTEX_PARAMS.windStrength = VORTEX_PARAMS.baseWindStrength;
    triggerReleasePulse(0.72, 980);
    dragTool = null;
  });

  /* ─── Right-click: reverse gravity ────────────────────── */
  canvas.addEventListener('contextmenu', (e) => {
    if (!SCENE_CONFIG.experimentalGestures) {
      e.preventDefault();
      return;
    }
    e.preventDefault();
    VORTEX_PARAMS.reverseGravity = true;
    clearTimeout(reverseGravityTimer);
    reverseGravityTimer = setTimeout(() => { VORTEX_PARAMS.reverseGravity = false; }, 2500);
    // Visual feedback: small shockwave from cursor
    const rx = ((e.clientX / window.innerWidth) * 2 - 1) * 5.5;
    const ry = -((e.clientY / window.innerHeight) * 2 - 1) * 3.0;
    applyPulseShockwave({ x: rx, y: ry, z: 0 });
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
    if (!SCENE_CONFIG.experimentalGestures) {
      e.preventDefault();
      return;
    }
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
    if (!SCENE_CONFIG.experimentalGestures) return;
    if (e.button !== 1 || dragTool) return; // skip if not middle-click or already dragging
    e.preventDefault();
    VORTEX_PARAMS.damping = 0.940;
    clearTimeout(slingshotTimer);
    slingshotTimer = setTimeout(() => {
      VORTEX_PARAMS.damping = 0.982;
      VORTEX_PARAMS.shockwaveImpulse = 0.35;
      const wp = new THREE.Vector3(mouseX * 5.5, -mouseY * 3.0, 0);
      applyPulseShockwave(wp);
      setTimeout(() => { VORTEX_PARAMS.shockwaveImpulse = 0.45; }, 100);
    }, 600);
  });

  // Spacebar hold: Saw lock at max speed + suppress cursor vortex so saw induction dominates
  window.addEventListener('keydown', e => {
    if (!SCENE_CONFIG.experimentalGestures) return;
    if (e.code !== 'Space') return;
    const tag = e.target.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
    if (e.repeat) return; // prevent keydown repeat from re-firing burst
    e.preventDefault();
    sawLocked = true;
    // Visual lock signal: blue-white burst + shockwave from saw position
    const sp = sawGroup.position;
    emitSparks(sp.x, sp.y, 0xaaddff, 16);
    applyPulseShockwave({ x: sp.x, y: sp.y, z: 0 });
    VORTEX_PARAMS.turbulenceMode = 1.0;
  });
  window.addEventListener('keyup', e => {
    if (!SCENE_CONFIG.experimentalGestures) return;
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
    document.documentElement.style.setProperty('--scene-warmth', Math.min(1, scrollProgress / 0.6).toFixed(3));
    const scrollingDown = currentScrollY > prevY;
    VORTEX_PARAMS.upwardDrift = scrollingDown ? 0.00018 : 0.00072;
    interactionCharge = Math.min(1.0, interactionCharge + SCENE_CONFIG.interaction.scrollBoost * 0.35);
    clearTimeout(scrollSweepTimer);
    scrollSweepTimer = setTimeout(() => { VORTEX_PARAMS.upwardDrift = 0.00052; }, 240);
    updateReadabilityWindow();
  }

  window.addEventListener('scroll', updateScroll, { passive: true });

  /* ─── Camera state ────────────────────────────────────── */
  let camRotX = 0, camRotY = 0;
  // Spring physics for camera parallax — replaces exponential lerp for organic overshoot feel
  let camVelX = 0, camVelY = 0;
  let cameraTrauma = 0;
  const SPRING_K = 154, SPRING_C = 21;  // tighter damping keeps the hero premium instead of twitchy

  /* ─── Responsive layout ───────────────────────────────── */
  function applyResponsiveLayout() {
    const w = window.innerWidth;
    const isNarrow = w < 480;
    const isMobile = w < 768;

    if (isNarrow) {
      camera.fov = 52;
      [hammerGroup, wrenchGroup, sawGroup].forEach(g => g.scale.setScalar(0.58));
      hammerGroup.position.set(-0.86, 0.92, 1.94);
      wrenchGroup.position.set(0.82, 0.54, 1.38);
      sawGroup.position.set(0.08, 1.78, 0.18);
    } else if (isMobile) {
      camera.fov = 54;
      [hammerGroup, wrenchGroup, sawGroup].forEach(g => g.scale.setScalar(0.66));
      hammerGroup.position.set(-1.14, 0.68, 1.96);
      wrenchGroup.position.set(1.06, 0.58, 1.38);
      sawGroup.position.set(0.12, 1.84, 0.26);
    } else {
      camera.fov = 60;
      [hammerGroup, wrenchGroup].forEach(g => g.scale.setScalar(1.0));
      hammerGroup.position.set(-2.48, -0.26, 2.54);
      wrenchGroup.position.set(2.12, 0.48, 1.92);
      sawGroup.scale.setScalar(1.52);
      sawGroup.position.set(0.18, 2.02, 0.26);
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
      if (densityRenderTarget) densityRenderTarget.setSize(Math.max(160, Math.floor(window.innerWidth * 0.5)), Math.max(96, Math.floor(window.innerHeight * 0.5)));
      if (densityPointMaterial) densityPointMaterial.uniforms.uPixelRatio.value = renderer.getPixelRatio();
      simulatedParticleSystems.forEach((system) => {
        if (system.material.uniforms?.uPixelRatio) {
          system.material.uniforms.uPixelRatio.value = renderer.getPixelRatio();
        }
      });
      applyResponsiveLayout();
      updateReadabilityWindow();
    }, 150);
  });

  // applyResponsiveLayout() called inside startScene() after GLB load

  /* ─── Mouse physics updater ───────────────────────────── */
  // Called each frame before updateVortexPhysics.
  // Computes velocity, turbulence mode, moves vortex center to cursor,
  // and detects tool proximity for per-tool force signatures.
  function updateMousePhysics() {
    const nowMs = performance.now();
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
    VORTEX_PARAMS.pointerWake += (clamp01(velMag * 11.5) - VORTEX_PARAMS.pointerWake) * 0.065;

    if (!reverseGravityActive) {
      const normalizedWake = clamp01((velMag - VORTEX_PARAMS.velocityThreshold) / 0.060);
      const targetTurb = normalizedWake * 0.64;
      const turbRate = targetTurb > VORTEX_PARAMS.turbulenceMode ? 0.08 : 0.04;
      VORTEX_PARAMS.turbulenceMode += (targetTurb - VORTEX_PARAMS.turbulenceMode) * turbRate;
    }

    const targetCX = mouseX * 5.5;
    const targetCY = -mouseY * 3.0;
    const centerLerp = 0.010 + VORTEX_PARAMS.pointerWake * 0.022 + SCENE_STATE.release * 0.018;
    VORTEX_PARAMS.centerX += (targetCX - VORTEX_PARAMS.centerX) * centerLerp;
    VORTEX_PARAMS.centerY += (targetCY - VORTEX_PARAMS.centerY) * centerLerp;

    if (pointerTrail.length && velMag > 0.0045 && nowMs - lastPointerTrailCommit > 42) {
      commitPointerTrailNode(
        targetCX,
        targetCY,
        0.2 + VORTEX_PARAMS.pointerWake * 0.8,
        smoothVelX * 5.5,
        -smoothVelY * 3.0,
        (smoothVelX - smoothVelY) * 0.25,
        clamp01(0.24 + velMag * 8.2)
      );
      lastPointerTrailCommit = nowMs;
    }

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
    const hammerWakeTarget = clamp01(
      (hoveredTool === 'hammer' ? 0.34 : 0)
      + (dragTool === 'hammer' ? 0.62 : 0)
      + (activePanelTool === 'hammer' ? 0.22 : 0)
      + (closestId === 'hammer' ? closestStrength * 0.38 : 0)
      + SCENE_STATE.release * 0.12
    );
    const wrenchWakeTarget = clamp01(
      (hoveredTool === 'wrench' ? 0.34 : 0)
      + (dragTool === 'wrench' ? 0.58 : 0)
      + (activePanelTool === 'wrench' ? 0.22 : 0)
      + (closestId === 'wrench' ? closestStrength * 0.36 : 0)
      + SCENE_STATE.focus * 0.10
    );
    const sawWakeTarget = clamp01(
      (hoveredTool === 'saw' ? 0.28 : 0)
      + (dragTool === 'saw' ? 0.42 : 0)
      + (activePanelTool === 'saw' ? 0.18 : 0)
      + (closestId === 'saw' ? closestStrength * 0.32 : 0)
      + VORTEX_PARAMS.sawSpeedRatio * 0.74
      + SCENE_STATE.release * 0.16
    );
    toolWakeState.hammer += (hammerWakeTarget - toolWakeState.hammer) * 0.08;
    toolWakeState.wrench += (wrenchWakeTarget - toolWakeState.wrench) * 0.08;
    toolWakeState.saw += (sawWakeTarget - toolWakeState.saw) * 0.08;
    focusTarget = getFocusTarget();
  }

  function updateSceneState(now, readabilityClamp) {
    const gatherProgress = getGatherProgress(now);
    const releaseProgress = getReleaseProgress(now);
    const settleProgress = getSettleProgress(now);
    const focusProgress = clamp01(
      (hoveredTool ? 0.36 : 0)
      + (dragTool ? 0.34 : 0)
      + (activePanelTool ? 0.18 : 0)
      + VORTEX_PARAMS.proximityStrength * 0.64
      + interactionCharge * 0.18
    );

    SCENE_STATE.focus += (focusProgress - SCENE_STATE.focus) * 0.12;
    SCENE_STATE.gather += (gatherProgress - SCENE_STATE.gather) * 0.18;
    SCENE_STATE.release += (releaseProgress - SCENE_STATE.release) * 0.22;
    SCENE_STATE.settle += (settleProgress - SCENE_STATE.settle) * 0.12;
    SCENE_STATE.pointerWake += (VORTEX_PARAMS.pointerWake - SCENE_STATE.pointerWake) * 0.12;
    SCENE_STATE.scrollPhase += ((Math.min(1, scrollProgress / 0.6)) - SCENE_STATE.scrollPhase) * 0.08;
    SCENE_STATE.readabilityBias += ((readabilityClamp > 0 ? SCENE_CONFIG.readability.densityBias : 0) - SCENE_STATE.readabilityBias) * 0.10;

    if (SCENE_STATE.release > 0.04) SCENE_STATE.interactionState = 'release';
    else if (SCENE_STATE.gather > 0.04) SCENE_STATE.interactionState = 'gather';
    else if (SCENE_STATE.settle > 0.04) SCENE_STATE.interactionState = 'settle';
    else if (SCENE_STATE.focus > 0.08) SCENE_STATE.interactionState = 'focus';
    else SCENE_STATE.interactionState = 'idle';
  }

  /* ─── Animation loop ──────────────────────────────────── */
  let lastTime = 0;
  let edgeFade = 0; // declared here so scan + scroll blocks can both reference it
  let simAccumulator = 0;

  function animate(time) {
    requestAnimationFrame(animate);
    const nowMs = performance.now();
    const delta = Math.min(time - lastTime, 50);
    lastTime = time;
    if (delta > 0) {
      frameSamples.push(delta);
      if (frameSamples.length > 90) frameSamples.shift();
    }
    const chargeDecayRate = energyState === ENERGY_STATES.recover ? 0.00052 : 0.00044;
    interactionCharge = Math.max(0, interactionCharge - delta * chargeDecayRate);
    updatePointerTrail(delta);
    if (currentScrollY < window.innerHeight * 1.2) updateReadabilityWindow();
    updateEnergyState(nowMs);
    focusTarget = getFocusTarget();

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
      }
    }

    /* ── Metal accent light ── */
    orbitLight.position.set(-2.6 + Math.sin(time * 0.00011) * 0.18, 2.8, 4.2);

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
    const energyValue = getEnergyStateValue();
    const releaseProgress = getReleaseProgress(nowMs);
    VORTEX_PARAMS.radialStrength = VORTEX_PARAMS.baseRadialStrength
      + Math.sin(breathPhase * Math.PI * 2) * VORTEX_PARAMS.breatheAmplitude
      + energyValue * 0.00012;
    const breatheTarget = 0.0022 + Math.sin((breathPhase + 0.25) * Math.PI * 2) * (VORTEX_PARAMS.breatheAmplitude * 0.72);
    VORTEX_PARAMS.tangentialStrength = sawLocked ? 0.0008 : breatheTarget + energyValue * 0.00014;

    // Update mouse velocity, turbulence mode, vortex center, tool proximity
    updateMousePhysics();
    const vortexScreen = projectWorldToScreen(VORTEX_PARAMS.centerX, VORTEX_PARAMS.centerY, 1.2);
    insideProtectedCorridor = readabilityWindow.active
      && vortexScreen.x >= readabilityWindow.left
      && vortexScreen.x <= readabilityWindow.left + readabilityWindow.width
      && vortexScreen.y >= readabilityWindow.top
      && vortexScreen.y <= readabilityWindow.top + readabilityWindow.height;
    const readabilityClamp = insideProtectedCorridor ? SCENE_CONFIG.readability.energyClamp : 0;
    updateSceneState(nowMs, readabilityClamp);

    // ── PARTICLE COLOR STATE MACHINE (dark default, explosive on interaction) ──
    // impl/implPct declared in animate() scope so the light section below can reuse them
    let impl = implosionActive;
    let implPct = 0;
    if (impl) {
      const impT = (nowMs - implosionStart) / IMPLOSION_DURATION;
      implPct = Math.sin(Math.max(0, Math.min(1, impT)) * Math.PI); // 0→1→0 arc
    }
    {
      const turb = SCENE_STATE.pointerWake + SCENE_STATE.gather * 0.34;
      const revG = VORTEX_PARAMS.reverseGravity;
      const scatterCoupling = scatterPass ? clamp01(volumetricScatterIntensity * 1.8 + (desktopFxState.active ? 0.06 : 0)) : 0;
      const densityLift = Math.min(1, atmosphereMetrics.vortex * 0.44 + atmosphereMetrics.titleHalo * 0.36 + atmosphereMetrics.foreground * 0.24 + scatterCoupling * 0.18);
      const sceneEnergy = Math.min(1, energyValue * 0.64 + SCENE_STATE.gather * 0.30 + SCENE_STATE.release * 0.58 + SCENE_STATE.focus * 0.18 + implPct * 0.44 + densityLift * 0.26 + scatterCoupling * 0.12);
      for (const system of simulatedParticleSystems) {
        if (!system.material.uniforms) continue;
        const behavior = system.species.behavior || {};
        const layerEnvelope = getLayerEnvelope(system.species, releaseProgress);
        const textGuard = behavior.textGuard || 1;
        const guardedClamp = 1 - readabilityClamp * 0.28 * textGuard;
        system.material.uniforms.uTime.value = time * 0.001;
        system.material.uniforms.uEnergy.value = system.species.id === 'microDust' ? sceneEnergy * 0.84 : sceneEnergy;

        let opacityBase = system.species.id === 'cloudMote' ? 0.32 : 0.22;
        let scaleBase = 1.0;
        if (system.species.id === 'microDust') opacityBase = 0.22;
        if (system.species.id === 'flowRibbon') opacityBase = 0.28;
        const densityBias = system.species.id === 'cloudMote'
          ? atmosphereMetrics.titleHalo * 0.16 + atmosphereMetrics.vortex * 0.14
          : (system.species.id === 'microDust'
            ? atmosphereMetrics.foreground * 0.12 + atmosphereMetrics.copy * 0.04
            : atmosphereMetrics.vortex * 0.10 + atmosphereMetrics.sawWake * 0.12);

        system.material.uniforms.uOpacity.value = Math.min(0.78, (opacityBase + densityBias + SCENE_STATE.focus * 0.07 + SCENE_STATE.release * 0.10 + implPct * 0.12) * (behavior.opacity || 1) * guardedClamp);
        system.material.uniforms.uScale.value = (scaleBase + densityBias * 0.22 + SCENE_STATE.focus * 0.06 + SCENE_STATE.release * 0.08 + implPct * 0.06) * (behavior.scale || 1) * THREE.MathUtils.lerp(0.96, 1.10, layerEnvelope);

        if (impl) {
          system.material.uniforms.uCool.value.setRGB(0.08, 0.14 + implPct * 0.22, 0.24 + implPct * 0.55);
          system.material.uniforms.uWarm.value.lerpColors(new THREE.Color(system.species.colorRamp[1]), new THREE.Color(0x9ad6ff), implPct * 0.28);
        } else if (system.species.id === 'cloudMote') {
          system.material.uniforms.uCool.value.setRGB(0.16, 0.20 + SCENE_STATE.focus * 0.10, 0.12 + SCENE_STATE.release * 0.08);
          system.material.uniforms.uWarm.value.set(system.species.colorRamp[1]);
        } else {
          system.material.uniforms.uCool.value.set(system.species.colorRamp[0]);
          system.material.uniforms.uWarm.value.set(system.species.colorRamp[1]);
        }
      }

      if (sparkMat) {
        const sr = revG ? THREE.MathUtils.lerp(0.667, 0.8, VORTEX_PARAMS.proximityStrength || turb)
                        : THREE.MathUtils.lerp(0.72, 1.0, SCENE_STATE.release + SCENE_STATE.focus * 0.2);
        const sg = revG ? THREE.MathUtils.lerp(0.867, 0.1, VORTEX_PARAMS.proximityStrength || turb)
                        : THREE.MathUtils.lerp(0.82, 0.98, SCENE_STATE.release + SCENE_STATE.focus * 0.12);
        const sb = revG ? THREE.MathUtils.lerp(1.0, 1.0, VORTEX_PARAMS.proximityStrength || turb)
                        : THREE.MathUtils.lerp(0.90, 1.0, SCENE_STATE.release * 0.48 + implPct * 0.18);
        sparkMat.color.setRGB(sr, sg, sb);
        sparkMat.size = 0.034 + atmosphereMetrics.sawWake * 0.012 + SCENE_STATE.focus * 0.008 + SCENE_STATE.release * 0.022 + implPct * 0.014;
        sparkMat.opacity = Math.min(0.82, 0.40 + atmosphereMetrics.vortex * 0.10 + SCENE_STATE.focus * 0.10 + SCENE_STATE.release * 0.18 + implPct * 0.16 + scatterCoupling * 0.06);
      }
      if (flowRibbonSystem && flowRibbonSystem.material) {
        flowRibbonSystem.material.opacity = THREE.MathUtils.lerp(0.42, 0.78, Math.min(1, atmosphereMetrics.titleHalo * 0.44 + atmosphereMetrics.vortex * 0.30 + SCENE_STATE.focus + SCENE_STATE.release * 0.36 + SCENE_STATE.gather * 0.24 + scatterCoupling * 0.12));
      }
    }

    const simStartAt = performance.now();
    simAccumulator = Math.min(simAccumulator + delta, SCENE_CONFIG.timing.maxStepAccumulationMs);
    while (simAccumulator >= SCENE_CONFIG.timing.fixedStepMs) {
      // Implosion pull-back phase (pre-physics so pull affects this frame's position update)
      if (implosionActive) {
        const impElapsed = performance.now() - implosionStart;
        const impT = impElapsed / IMPLOSION_DURATION;
        if (impT >= 1.0) {
          implosionActive = false;
        } else if (impT > VORTEX_PARAMS.implosionDelay) {
          const normalizedT = (impT - VORTEX_PARAMS.implosionDelay) / (1.0 - VORTEX_PARAMS.implosionDelay);
          const pullStrength = VORTEX_PARAMS.implosionStrength * Math.sin(normalizedT * Math.PI);
          for (const system of pulseParticleSystems) {
            const pos = system.positions;
            const vel = system.velocities;
            const systemPull = pullStrength * (system.species.id === 'flowRibbon' ? 1.55 : (system.species.id === 'cloudMote' ? 1.28 : 1.12));
            for (let i = 0; i < system.count; i++) {
              const ix = i * 3, iy = i * 3 + 1, iz = i * 3 + 2;
              const dx = clickWorldPos.x - pos[ix];
              const dy = clickWorldPos.y - pos[iy];
              const dz = clickWorldPos.z - pos[iz];
              const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
              if (dist > 0.01 && dist < VORTEX_PARAMS.shockwaveRadius * 2.5) {
                vel[ix] += (dx / dist) * systemPull;
                vel[iy] += (dy / dist) * systemPull;
                vel[iz] += (dz / dist) * systemPull;
                vel[ix] *= 0.94;
                vel[iy] *= 0.94;
                vel[iz] *= 0.94;
                system.charges[i] = clamp01(system.charges[i] + 0.08);
              }
            }
          }
        }
      }

      updateVortexPhysics(flowRibbonSystem, mouseWorldPos, SCENE_CONFIG.timing.fixedStepMs);
      updateVortexPhysics(cloudMoteSystem, mouseWorldPos, SCENE_CONFIG.timing.fixedStepMs);
      updateVortexPhysics(microDustSystem, mouseWorldPos, SCENE_CONFIG.timing.fixedStepMs);
      updateVortexPhysics(sparkFilamentSystem, mouseWorldPos, SCENE_CONFIG.timing.fixedStepMs);
      simAccumulator -= SCENE_CONFIG.timing.fixedStepMs;
    }
    simulationMetrics.avgSimMs += (performance.now() - simStartAt - simulationMetrics.avgSimMs) * 0.12;
    const copySample = simulatedParticleSystems.reduce((acc, system) => {
      const stride = Math.max(1, Math.floor(system.count / 120));
      const obstructionWeight = system.species.id === 'flowRibbon'
        ? 1.0
        : (system.species.id === 'cloudMote' ? 0.72 : (system.species.id === 'microDust' ? 0.28 : 0.12));
      for (let i = 0; i < system.count; i += stride) {
        const ix = i * 3;
        const dx = Math.abs(system.positions[ix] + 0.35);
        const dy = Math.abs(system.positions[ix + 1] - 0.25);
        const dz = Math.abs(system.positions[ix + 2] - 0.65);
        const inTitle = dx < 3.0 && dy < 2.6 && dz < 1.8;
        acc.total += obstructionWeight;
        if (inTitle) {
          const centerBias = clamp01(1 - dx / 3.0) * 0.56 + clamp01(1 - dy / 2.6) * 0.24 + clamp01(1 - dz / 1.8) * 0.20;
          const frontBias = clamp01(1 - Math.max(0, system.positions[ix + 2] - 0.95) / 1.15);
          acc.hit += obstructionWeight * (0.52 + centerBias * 0.32 + frontBias * 0.16);
        }
      }
      return acc;
    }, { hit: 0, total: 0 });
    copyZoneDensity = copySample.total ? copySample.hit / copySample.total : 0;
    updateAtmosphereMetrics();

    /* ── Hub bloom pulse ── */
    // Will be calculated after sawSpinSpeed is set (see below)

    /* ── Scan line sweep ── */
    const scanRaw = (time * 0.00015) % 1.0;
    const scanEase = easeInOut(scanRaw);
    const scanHold = Math.sin(scanRaw * Math.PI * 6) * 0.008 * (1 - Math.abs(scanRaw * 2 - 1));
    const scanFrac = clamp01(scanEase + scanHold + Math.sin(time * 0.0016) * 0.008 + Math.sin(time * 0.00047) * 0.006);
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

    /* ── Hover emissive lerp — also driven by shared scene state ── */
    const scatterCoupling = scatterPass ? clamp01(volumetricScatterIntensity * 1.8 + (desktopFxState.active ? 0.06 : 0)) : 0;
    const particleEnergyBase = SCENE_STATE.focus * 0.14 + SCENE_STATE.release * 0.24 + implPct * 0.18 + scatterCoupling * 0.08;
    const sawEnergyBoost = (VORTEX_PARAMS.sawSpeedRatio || 0) * 0.12;
    const activeCue = SCENE_STATE.release > 0.04
      ? LIGHT_CUES.release
      : (SCENE_STATE.gather > 0.04
        ? LIGHT_CUES.gather
        : (SCENE_STATE.settle > 0.04 ? LIGHT_CUES.settle : (SCENE_STATE.focus > 0.06 ? LIGHT_CUES.focus : LIGHT_CUES.idle)));

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
      const elapsed = nowMs - st.spinStart;
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
      const elapsed = nowMs - ds.startTime;
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
      const elapsed = nowMs - ring.startTime;
      const t = Math.min(elapsed / 420, 1);
      const s = 0.2 + t * 1.3;
      ring.mesh.scale.set(s, s, s);
      ring.mesh.material.opacity = 0.65 * (1 - t);
      if (t >= 1) { ring.active = false; ring.mesh.visible = false; }
    }

    /* ── Idle rotation (when assembled + not spinning + not dragging) ── */
    if (assemblyDone) {
      if (!spinState.hammer.spinning && dragTool !== 'hammer') {
        hammerIdleY += 0.00012 * delta;
      }
      if (!spinState.wrench.spinning && dragTool !== 'wrench') {
        wrenchIdleY -= 0.00018 * delta;
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
      const compositionPulse = 0.5 + Math.sin(time * 0.00021) * 0.5;
      hammerGroup.position.x = window.toolBasePositions.hammer.x + camRotY * -1.68 + Math.sin(time * 0.00021) * (0.016 + toolWakeState.hammer * 0.034);
      hammerGroup.position.y = window.toolBasePositions.hammer.y + Math.sin(time * 0.00042) * 0.028 + Math.sin(time * 0.00118) * 0.010 - toolWakeState.hammer * 0.058 + SCENE_STATE.release * 0.042;
      hammerGroup.position.z = window.toolBasePositions.hammer.z + camRotX * -0.56 + Math.sin(time * 0.00033 + 0.9) * 0.028;

      wrenchGroup.position.x = window.toolBasePositions.wrench.x + camRotY * -1.34 + Math.sin(time * 0.00034 + 0.7) * (0.010 + toolWakeState.wrench * 0.026);
      wrenchGroup.position.y = window.toolBasePositions.wrench.y + Math.sin(time * 0.00054 + 1.2) * 0.022 + compositionPulse * 0.016 + toolWakeState.wrench * 0.032;
      wrenchGroup.position.z = window.toolBasePositions.wrench.z + camRotX * -0.44 + Math.sin(time * 0.00038 + 0.9) * 0.054 + toolWakeState.wrench * 0.036;

      sawGroup.position.x = window.toolBasePositions.saw.x + camRotY * -1.04 + Math.sin(time * 0.00062 + 2.1) * 0.056 + toolWakeState.saw * 0.086;
      sawGroup.position.y = window.toolBasePositions.saw.y + Math.cos(time * 0.00058 + 2.7) * 0.032 - compositionPulse * 0.020 + toolWakeState.saw * 0.040;
      sawGroup.position.z = window.toolBasePositions.saw.z + camRotX * -0.28 + Math.sin(time * 0.00074 + 2.7) * 0.102 + toolWakeState.saw * 0.026;
    }

    if (!spinState.hammer.spinning && dragTool !== 'hammer') {
      hammerGroup.rotation.y = hammerIdleY - 0.58 + camRotY * 0.24 + Math.sin(time * 0.00024) * 0.01 + toolWakeState.hammer * 0.08;
      hammerGroup.rotation.z = 0.22 + mouseX * -0.04 + Math.sin(time * 0.00072) * 0.010 - toolWakeState.hammer * 0.06;
    }

    if (!spinState.wrench.spinning && dragTool !== 'wrench') {
      wrenchGroup.rotation.y = wrenchIdleY + 0.50 + camRotY * 0.20 + Math.sin(time * 0.00042) * 0.08 - toolWakeState.wrench * 0.10;
      wrenchGroup.rotation.z = -0.18 + mouseX * 0.035 + Math.cos(time * 0.00058) * 0.028 + toolWakeState.wrench * 0.05;
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
    if (glbSawLoaded) {
      sawGroup.rotation.z = 0.18 + Math.sin(time * 0.00042 + 0.6) * 0.12 + toolWakeState.saw * 0.08;
      sawGroup.rotation.x = Math.sin(time * 0.00027 + 1.1) * 0.05;
      sawGroup.rotation.y = Math.sin(time * 0.00031 + 0.4) * 0.08;
    }
    // Hub bloom pulses dramatically with spin speed — from dim glow to blazing at full speed
    if (!glbSawLoaded && hubGlowMat)   hubGlowMat.opacity   = 0.12 + speedRatio * 0.20;
    if (!glbSawLoaded && hubCoronaMat) hubCoronaMat.opacity = 0.05 + speedRatio * 0.14;
    if (bladeMat) bladeMat.envMapIntensity = 0.46 + speedRatio * 0.44 + SCENE_STATE.focus * 0.10 + SCENE_STATE.release * 0.08;

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
    allToolParts.forEach((part) => setObjectOpacity(part, toolAlpha));
    floorGrid.material.opacity   = toolAlpha * (0.18 + SCENE_STATE.gather * 0.10 + SCENE_STATE.release * 0.14);
    wallGrid.material.opacity    = toolAlpha * (0.08 + SCENE_STATE.focus * 0.04 + SCENE_STATE.release * 0.08);
    horizonGrid.material.opacity = toolAlpha * (0.05 + SCENE_STATE.release * 0.06 + SCENE_STATE.focus * 0.02);
    orbitLight.intensity = toolAlpha * (0.05 + activeCue.warm * 0.16);
    // Floor glow breathes with particle pulse + flares on gather/release
    const breathPhaseGlow = (time % 4000) / 4000;
    const glowPulse = 0.06 + Math.sin(breathPhaseGlow * Math.PI * 2) * 0.02 + SCENE_STATE.gather * 0.04 + SCENE_STATE.release * 0.08;
    floorGlow.material.opacity  = toolAlpha * glowPulse;

    // ── PARTICLE LIGHT UPDATES: dynamic illumination from vortex + saw + floor burst ──

    // Ambient flash on implosion — subtle tint only, not a flood
    ambientLight.intensity = 0.030 + activeCue.warm * 0.10 + implPct * 0.04 + scatterCoupling * 0.026;
    ambientLight.color.setRGB(
      impl ? THREE.MathUtils.lerp(0.022, 0.06, implPct) : 0.022,
      impl ? THREE.MathUtils.lerp(0.026, 0.05, implPct) : 0.026,
      impl ? THREE.MathUtils.lerp(0.042, 0.08, implPct) : 0.042
    );

    // Vortex light tracks cursor center — warm core with transient cool release accent
    vortexLight.position.set(VORTEX_PARAMS.centerX, VORTEX_PARAMS.centerY, 1.5);
    const vBase = impl ? 0.65 * implPct : 0;
    const vTurb = toolAlpha * (0.14 + activeCue.warm * 0.92 + SCENE_STATE.pointerWake * 0.18 + atmosphereMetrics.vortex * 0.68 + atmosphereMetrics.titleHalo * 0.22 + scatterCoupling * 0.24);
    vortexLight.intensity = Math.min(1.85, Math.max(vBase, vTurb));
    vortexLight.color.setRGB(
      impl ? THREE.MathUtils.lerp(0.84, 0.56, implPct) : 0.80 + atmosphereMetrics.vortex * 0.08,
      impl ? THREE.MathUtils.lerp(0.46, 0.58, implPct) : 0.42 + atmosphereMetrics.titleHalo * 0.08,
      impl ? THREE.MathUtils.lerp(0.05, 0.28, implPct) : 0.05 + atmosphereMetrics.sawWake * 0.06
    );

    // Ground glow: subtle forge bounce with brief gather/release flare
    groundGlow.intensity = toolAlpha * (0.06 + activeCue.warm * 0.16 + atmosphereMetrics.floor * 0.28 + SCENE_STATE.release * 0.18 + implPct * 0.18 + scatterCoupling * 0.09);
    groundGlow.color.setRGB(
      impl ? THREE.MathUtils.lerp(0.66, 0.34, implPct) : 0.66,
      impl ? THREE.MathUtils.lerp(0.32, 0.36, implPct) : 0.32,
      impl ? THREE.MathUtils.lerp(0.04, 0.24, implPct) : 0.04 + atmosphereMetrics.floor * 0.08
    );

    // Saw particle glow: orange light from sparks + hub, scales with blade speed
    sawParticleGlow.position.set(sawGroup.position.x, sawGroup.position.y, sawGroup.position.z + 0.5);
    sawParticleGlow.intensity = toolAlpha * (0.08 + speedRatio * 0.88 + atmosphereMetrics.sawWake * 0.46 + SCENE_STATE.focus * 0.10 + SCENE_STATE.release * 0.14 + scatterCoupling * 0.06);

    // Floor rim light: fires on release/implosion for a readable cool under-light pulse
    floorRimLight.position.set(VORTEX_PARAMS.centerX * 0.3, -2.0, 1.5);
    floorRimLight.intensity = toolAlpha * (SCENE_STATE.release * 0.82 + implPct * 0.62);
    floorRimLight.color.setRGB(
      THREE.MathUtils.lerp(0.32, 0.20, Math.min(1, releaseProgress * 0.8 + implPct * 0.4)),
      THREE.MathUtils.lerp(0.40, 0.54, Math.min(1, releaseProgress + implPct * 0.4)),
      THREE.MathUtils.lerp(0.72, 0.98, Math.min(1, releaseProgress + implPct * 0.5))
    );
    const heroVisible = toolAlpha > 0.01;
    const volumetricGuard = 1 - readabilityClamp * SCENE_CONFIG.readability.volumetricClamp;

    sparkAuraCard.position.set(VORTEX_PARAMS.centerX * 0.72, VORTEX_PARAMS.centerY * 0.68 + 0.3, 1.2);
    sparkAuraCard.quaternion.copy(camera.quaternion);
    sparkAuraCard.material.opacity = toolAlpha * volumetricGuard * (0.01 + atmosphereMetrics.vortex * 0.10 + atmosphereMetrics.sawWake * 0.08 + SCENE_STATE.release * 0.16 + SCENE_STATE.focus * 0.04 + implPct * 0.12 + scatterCoupling * 0.05);
    sparkAuraCard.material.color.setRGB(
      THREE.MathUtils.lerp(0.28, 0.12, implPct + releaseProgress * 0.28),
      THREE.MathUtils.lerp(0.46, 0.72, SCENE_STATE.release + implPct * 0.20),
      THREE.MathUtils.lerp(0.12, 0.86, SCENE_STATE.release + implPct * 0.28)
    );

    cloudAuraCard.position.set(0.15 + VORTEX_PARAMS.centerX * 0.16, 1.28 + Math.sin(time * 0.00038) * 0.28, 0.9);
    cloudAuraCard.quaternion.copy(camera.quaternion);
    cloudAuraCard.material.opacity = toolAlpha * volumetricGuard * (0.04 + atmosphereMetrics.titleHalo * 0.18 + atmosphereMetrics.foreground * 0.06 + SCENE_STATE.gather * 0.08 + SCENE_STATE.release * 0.05 + scatterCoupling * 0.08);
    cloudAuraCard.material.color.setRGB(1.0, 0.56 + SCENE_STATE.focus * 0.06 + atmosphereMetrics.titleHalo * 0.08, 0.24 + atmosphereMetrics.foreground * 0.04);

    keyBeamCard.position.x = -2.8 + Math.sin(time * 0.00019) * 0.16;
    keyBeamCard.position.y = 2.5 + atmosphereMetrics.titleHalo * 0.36;
    keyBeamCard.material.opacity = toolAlpha * (SCENE_CONFIG.featureFlags.volumetricCards ? (0.022 + activeCue.warm * 0.04 + atmosphereMetrics.titleHalo * 0.07 + scatterCoupling * 0.05) * volumetricGuard : 0);
    sawBeamCard.position.x = sawGroup.position.x + 0.18;
    sawBeamCard.position.y = sawGroup.position.y + 1.2;
    sawBeamCard.material.opacity = toolAlpha * (SCENE_CONFIG.featureFlags.volumetricCards ? (speedRatio * 0.04 + atmosphereMetrics.sawWake * 0.09 + SCENE_STATE.release * 0.06 + scatterCoupling * 0.04) * volumetricGuard : 0);

    scanLineMat.opacity  = Math.min(edgeFade, 1) * (0.48 + energyValue * 0.14) * toolAlpha;
    scanGlowMat.opacity  = Math.min(edgeFade, 1) * (0.18 + energyValue * 0.12) * toolAlpha;
    // Saw spotlight: intensity scales with spin speed and gently follows the saw, not the cursor
    const spotIntensity = 0.26 + (speedRatio * 0.90) + SCENE_STATE.focus * 0.14 + SCENE_STATE.release * 0.08;
    sawSpot.intensity  = toolAlpha * spotIntensity;
    sawSpot.position.x += ((sawGroup.position.x - 0.12) - sawSpot.position.x) * 0.08;
    sawSpot.position.y += ((sawGroup.position.y + 2.2) - sawSpot.position.y) * 0.08;
    sawSpot.position.z += ((sawGroup.position.z + 4.2) - sawSpot.position.z) * 0.08;

    // Hero-scope: hide all fixed elements when scrolled past hero fold
    const copyShieldStrength = heroVisible && readabilityWindow.active
      ? Math.min(0.24, 0.02 + SCENE_STATE.readabilityBias * 0.10 + atmosphereMetrics.copy * 0.10 + SCENE_STATE.release * 0.03)
      : 0;
    canvas.style.visibility    = heroVisible ? 'visible' : 'hidden';
    canvas.style.pointerEvents = heroVisible ? 'auto'    : 'none';
    vignette.style.visibility  = heroVisible ? 'visible' : 'hidden';
    sceneGrade.style.visibility = heroVisible ? 'visible' : 'hidden';
    sceneGrade.style.opacity = heroVisible ? String(Math.max(0.24, 0.40 + activeCue.warm * 0.16 + atmosphereMetrics.titleHalo * 0.10 + scatterCoupling * 0.08 - readabilityClamp * 0.08)) : '0';
    sceneGrade.style.background = `radial-gradient(circle at 44% 38%, rgba(242, 182, 86, ${(0.06 + atmosphereMetrics.titleHalo * 0.12 + SCENE_STATE.gather * 0.06 + SCENE_STATE.release * 0.10).toFixed(3)}), transparent 44%), radial-gradient(circle at 62% 28%, rgba(104, 150, 212, ${(0.02 + atmosphereMetrics.sawWake * 0.10 + SCENE_STATE.release * 0.05).toFixed(3)}), transparent 30%), linear-gradient(180deg, rgba(28, 48, 82, ${(0.04 + SCENE_STATE.release * 0.08).toFixed(3)}) 0%, rgba(9, 11, 16, 0) 34%, rgba(255, 162, 75, ${(0.05 + activeCue.warm * 0.07 + atmosphereMetrics.floor * 0.05).toFixed(3)}) 100%)`;
    copyShield.style.opacity = heroVisible ? String(copyShieldStrength.toFixed(3)) : '0';
    copyShield.style.transform = heroVisible ? 'scale(1)' : 'scale(0.98)';
    if (readabilityWindow.active) {
      copyShield.style.left = `${readabilityWindow.left}px`;
      copyShield.style.top = `${readabilityWindow.top}px`;
      copyShield.style.width = `${readabilityWindow.width}px`;
      copyShield.style.height = `${readabilityWindow.height}px`;
      const copyFocusX = clamp01((VORTEX_PARAMS.centerX + 5.5) / 11);
      copyShield.style.background = `radial-gradient(ellipse at ${(28 + copyFocusX * 36).toFixed(1)}% 42%, rgba(6, 10, 16, ${(0.42 + copyShieldStrength * 0.7).toFixed(3)}) 0%, rgba(6, 10, 16, ${(0.18 + copyShieldStrength * 0.3).toFixed(3)}) 48%, rgba(6, 10, 16, 0) 88%), radial-gradient(ellipse at 62% 58%, rgba(34, 62, 104, ${(0.04 + atmosphereMetrics.titleHalo * 0.06).toFixed(3)}), rgba(6, 10, 16, 0) 72%), linear-gradient(135deg, rgba(8, 11, 18, ${(0.48 + copyShieldStrength * 0.4).toFixed(3)}), rgba(8, 11, 18, ${(0.06 + atmosphereMetrics.copy * 0.06).toFixed(3)}))`;
      copyShield.style.boxShadow = `inset 0 0 0 1px rgba(92, 132, 196, ${(0.04 + atmosphereMetrics.titleHalo * 0.05).toFixed(3)}), 0 32px 90px rgba(0, 0, 0, ${(0.10 + copyShieldStrength * 0.4).toFixed(3)})`;
      copyShield.style.borderRadius = `${Math.round(40 + atmosphereMetrics.titleHalo * 26)}px`;
    }
    // Info panel: restore CSS default when visible, force hidden when scrolled out
    infoPanel.style.visibility = heroVisible ? '' : 'hidden';
    if (!heroVisible && activePanelTool) closePanel();

    const shouldShowHint = SCENE_CONFIG.featureFlags.contextualHint
      && assemblyDone
      && heroVisible
      && !dragTool
      && !hoveredTool
      && !hasSceneInteracted
      && nowMs - lastInteractionAt > SCENE_CONFIG.timing.hintDelayMs;
    gestureHint.classList.toggle('visible', shouldShowHint);

    const ringVisible = heroVisible && (hoveredTool || dragTool || interactionCharge > 0.08 || energyState === ENERGY_STATES.release);
    const ringScale = 0.62 + interactionCharge * 0.95 + (energyState === ENERGY_STATES.release ? releaseProgress * 0.42 : 0);
    chargeRing.style.opacity = ringVisible ? String(Math.min(0.92, 0.18 + interactionCharge * 0.75 + releaseProgress * 0.28)) : '0';
    chargeRing.style.transform = ringVisible
      ? `translate3d(${rawMouseX}px, ${rawMouseY}px, 0) scale(${ringScale.toFixed(3)})`
      : 'translate3d(-999px, -999px, 0) scale(0.55)';
    chargeRing.style.borderColor = `rgba(${Math.round(170 + interactionCharge * 70)}, ${Math.round(170 + releaseProgress * 40)}, ${Math.round(110 + energyValue * 95)}, 0.62)`;

    /* ── Spark burst update ── */
    const sparkNow = nowMs;
    for (const sp of sparks) {
      if (!sp.active) continue;
      const elapsed = sparkNow - sp.startTime;
      const t = elapsed / sp.lifetime;
      if (t >= 1) {
        sp.active = false;
        sp.mesh.visible = false;
      } else {
        sp.vel.y -= 0.0016 * delta;  // gravity: arcs downward over lifetime
        sp.mesh.position.addScaledVector(sp.vel, delta);
        sp.mesh.material.opacity = (1 - t * t);  // quadratic fade — stays bright, drops fast at end
        const sparkSpeed = sp.vel.length();
        sp.mesh.scale.set(1 + sparkSpeed * 42, 1, 1);
        sp.mesh.rotation.z = Math.atan2(sp.vel.y, sp.vel.x);
      }
    }

    /* ── Camera spring physics + idle breathing sway ── */
    // Dual-frequency sway — irrational periods prevent mechanical feel, amplitudes stay restrained for a premium hero.
    const swayX = Math.sin(time * 0.00031) * 0.007 + Math.sin(time * 0.00071) * 0.003;
    const swayY = Math.cos(time * 0.00027) * 0.008 + Math.cos(time * 0.00059) * 0.004;

    // Semi-implicit Euler spring: K=180, C=18 → ~8% overshoot on fast sweeps, settles in ~0.5s
    const dt = delta / 1000;
    camVelX += (SPRING_K * (targetRotX + swayX - camRotX) - SPRING_C * camVelX) * dt;
    camVelY += (SPRING_K * (targetRotY + swayY - camRotY) - SPRING_C * camVelY) * dt;
    camRotX += camVelX * dt;
    camRotY += camVelY * dt;
    camRotX = THREE.MathUtils.clamp(camRotX, -0.24, 0.20);
    camRotY = THREE.MathUtils.clamp(camRotY, -0.24, 0.24);
    camera.rotation.x = camRotX;

    const scrollZ    = 6 + scrollProgress * 3;
    const scrollRotY = scrollProgress * 0.3;
    camera.position.z += (scrollZ - camera.position.z) * 0.06;
    camera.rotation.y  = camRotY + scrollRotY;
    cameraTrauma = Math.max(0, cameraTrauma - dt * 1.35);
    if (cameraTrauma > 0 && !prefersReduced) {
      const shake = cameraTrauma * cameraTrauma;
      camera.position.x += (Math.random() - 0.5) * shake * 0.12;
      camera.position.y += (Math.random() - 0.5) * shake * 0.08;
      camera.rotation.z = (Math.random() - 0.5) * shake * 0.03;
    } else {
      camera.rotation.z *= 0.82;
    }

    /* ── Vortex glow plane — billboard additive fake volumetric core ── */
    vortexGlowPlane.position.set(VORTEX_PARAMS.centerX * 0.5, VORTEX_PARAMS.centerY * 0.3, 1.0);
    vortexGlowPlane.quaternion.copy(camera.quaternion);
    const vgOpacity = SCENE_STATE.focus * 0.04 + SCENE_STATE.gather * 0.06 + SCENE_STATE.release * 0.14 + implPct * 0.16 + scatterCoupling * 0.08 + Math.sin(time * 0.00041) * 0.01;
    vortexGlowPlane.material.opacity = Math.max(0, vgOpacity) * toolAlpha;
    vortexGlowPlane.material.color.setRGB(
      impl ? THREE.MathUtils.lerp(0.20, 0.08, implPct) : THREE.MathUtils.lerp(0.20, 0.12, SCENE_STATE.release * 0.4),
      impl ? THREE.MathUtils.lerp(0.07, 0.14, implPct) : THREE.MathUtils.lerp(0.07, 0.12, SCENE_STATE.release * 0.4),
      impl ? THREE.MathUtils.lerp(0.00, 0.22, implPct) : THREE.MathUtils.lerp(0.00, 0.14, SCENE_STATE.release * 0.4)
    );

    /* ── Background breathes with particle energy ── */
    const bgBreath = Math.sin(time * 0.00031) * 0.5 + 0.5; // slow 0..1 pulse
    const bgR = impl ? THREE.MathUtils.lerp(0.010 + bgBreath*0.003, 0.001, implPct)
                     : 0.010 + SCENE_STATE.scrollPhase * 0.012 + bgBreath*0.003;
    const bgG = impl ? THREE.MathUtils.lerp(0.012 + bgBreath*0.002, 0.004, implPct)
                     : 0.012 + SCENE_STATE.focus * 0.003 + bgBreath*0.002;
    const bgB = impl ? THREE.MathUtils.lerp(0.017 + bgBreath*0.003, 0.032, implPct)
                     : 0.017 + SCENE_STATE.release * 0.010 + bgBreath*0.004;
    scene.background.setRGB(bgR, bgG, bgB);
    scene.fog.density += ((0.040 + SCENE_STATE.focus * 0.004 + SCENE_STATE.release * 0.006 + scatterCoupling * 0.004) - scene.fog.density) * 0.03;

    /* ── Dynamic bloom strength driven by vortex state ── */
    if (bloomPass) {
      const bloomBase = SCENE_CONFIG.tiers[SCENE_CONFIG.qualityTier].bloom;
      const bloomTarget = Math.min(
        bloomBase.strength + SCENE_STATE.focus * 0.03 + SCENE_STATE.release * 0.07 + implPct * 0.04 + scatterCoupling * 0.05 - readabilityClamp * SCENE_CONFIG.readability.bloomClamp,
        bloomBase.strength + 0.10
      );
      bloomPass.strength += (bloomTarget - bloomPass.strength) * 0.025; // slightly slower lerp + hard cap prevents mip-boundary banding
      bloomPass.threshold = bloomBase.threshold - SCENE_STATE.release * 0.05 - implPct * 0.03 + readabilityClamp * 0.04;
      bloomPass.radius = bloomBase.radius + SCENE_STATE.focus * 0.04 + SCENE_STATE.release * 0.06;
    }
    if (scatterPass) {
      updateVolumetricScatterPass(nowMs, toolAlpha, readabilityClamp, releaseProgress, implPct);
    }

    const postStartAt = performance.now();
    if (composer) {
      composer.render();
    } else {
      renderer.render(scene, camera);
    }
    simulationMetrics.avgPostMs += (performance.now() - postStartAt - simulationMetrics.avgPostMs) * 0.12;
    markFrameRendered();
  }

  function startScene() {
    applyResponsiveLayout();
    updateReadabilityWindow();
    if (prefersReduced) {
      allToolParts.forEach(mesh => {
        mesh.position.copy(mesh.userData.restPos);
        mesh.rotation.set(0, 0, 0);
      });
      renderer.render(scene, camera);
      markFrameRendered();
    } else {
      animate(0);
    }
  }

  loadGLBModels()
    .then(startScene)
    .catch(err => {
      assetMode = 'procedural';
      const reason = err && err.message ? ` Reason: ${err.message}` : '';
      console.info(`[three-scene] Using procedural tool fallback.${reason}`);
      buildProceduralWrench();
      buildProceduralSaw();
      startScene();
    });

  /* ─── Timer cleanup on unload ─────────────────────────── */
  window.addEventListener('beforeunload', () => {
    clearTimeout(scrollSweepTimer);
    clearTimeout(reverseGravityTimer);
    clearTimeout(slingshotTimer);
    clearTimeout(longPressTimer);
    if (densityRenderTarget) densityRenderTarget.dispose();
    if (densityPoints) densityPoints.geometry.dispose();
    if (densityPointMaterial) densityPointMaterial.dispose();
  });

  /* ─── Print: hide canvas ──────────────────────────────── */
  const printStyle = document.createElement('style');
  printStyle.textContent = '@media print { #three-canvas { display: none !important; } }';
  document.head.appendChild(printStyle);

}());
