/**
 * src/scene/index.js - Blueprint Engineering hero runtime.
 *
 * Self-initializing. Creates a fixed WebGL canvas behind all page content.
 * Runtime globals are prepared by src/runtime-globals.js before this module runs.
 */

const THREE = window.THREE;
const HERO_RUNTIME_ASSETS = Object.freeze({
  manifest: new URL('../../assets/models/hero/HERO-ASSET-MANIFEST.json', import.meta.url).href,
  preferred: {
    wrench: new URL('../../assets/models/hero/hero-pipe-wrench.glb', import.meta.url).href,
    hammer: new URL('../../assets/models/hero/hero-claw-hammer.glb', import.meta.url).href,
    saw: new URL('../../assets/models/hero/hero-handsaw.glb', import.meta.url).href,
  },
  legacy: {
    wrench: new URL('../../assets/models/pipe-wrench.glb', import.meta.url).href,
    hammer: null,
    saw: new URL('../../assets/models/handsaw.glb', import.meta.url).href,
  },
  hdr: new URL('../../assets/textures/hero/university_workshop_1k.hdr', import.meta.url).href,
});

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
  const normalizeFreezePhase = (value) => {
    const phase = String(value || '').trim().toLowerCase();
    const map = {
      staticlayout: 'static-layout',
      'static-layout': 'static-layout',
      prereveal: 'pre-reveal',
      'pre-reveal': 'pre-reveal',
      reveal: 'reveal',
      lockup: 'lockup',
      interactiveidle: 'interactive-idle',
      'interactive-idle': 'interactive-idle',
      scrolltransition: 'scroll-transition',
      'scroll-transition': 'scroll-transition',
    };
    return map[phase] || null;
  };
  const SCENE_TEST_OVERRIDES = {
    sceneTier: normalizeTierOverride(SCENE_QUERY.get('sceneTier')),
    forceDesktopFX: parseQueryFlag(SCENE_QUERY.get('sceneForceDesktopFX')),
    disablePerfAutoDowngrade: parseQueryFlag(SCENE_QUERY.get('sceneDisablePerfAutoDowngrade')),
    debug: parseQueryFlag(SCENE_QUERY.get('sceneDebug')),
    freezePhase: normalizeFreezePhase(SCENE_QUERY.get('sceneFreeze')),
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
    if (!gl) {
      return {
        lowEnd: false,
        renderer: 'unavailable',
        softwareRenderer: false,
        lowMemory: false,
      };
    }
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    const renderer = ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : '';
    const isSoftware = /SwiftShader|llvmpipe|softpipe/i.test(renderer);
    const lowMem = (navigator.deviceMemory || 4) < 2;
    return {
      lowEnd: isSoftware || lowMem,
      renderer,
      softwareRenderer: isSoftware,
      lowMemory: lowMem,
    };
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
        upgradeHoldMs: 4200,
        recoverHoldMs: 3200,
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
        speciesCounts: { flowRibbon: 2, cloudMote: 420, microDust: 170, sparkFilament: 6 },
        bloom: { strength: 0.18, radius: 0.26, threshold: 0.82 },
      },
      mobile: {
        speciesCounts: { flowRibbon: 0, cloudMote: 180, microDust: 70, sparkFilament: 2 },
        bloom: { strength: 0.14, radius: 0.21, threshold: 0.86 },
      },
      low: {
        speciesCounts: { flowRibbon: 0, cloudMote: 120, microDust: 40, sparkFilament: 0 },
        bloom: { strength: 0.09, radius: 0.18, threshold: 0.90 },
      },
    },
  };

  const HERO_FOCUS_TOOL = 'wrench';
  const SUPPORT_PROPS_ACTIVE = true;
  const REQUIRED_HERO_TOOL_IDS = [HERO_FOCUS_TOOL];
  const SCENE_DIRECTOR_STATE = Object.freeze({
    staticLayout: 'static-layout',
    preReveal: 'pre-reveal',
    reveal: 'reveal',
    lockup: 'lockup',
    interactiveIdle: 'interactive-idle',
    scrollTransition: 'scroll-transition',
  });
  const DIRECTOR_PHASE_TO_PRESET = Object.freeze({
    [SCENE_DIRECTOR_STATE.staticLayout]: 'lockup',
    [SCENE_DIRECTOR_STATE.preReveal]: 'preReveal',
    [SCENE_DIRECTOR_STATE.reveal]: 'reveal',
    [SCENE_DIRECTOR_STATE.lockup]: 'lockup',
    [SCENE_DIRECTOR_STATE.interactiveIdle]: 'interactiveIdle',
    [SCENE_DIRECTOR_STATE.scrollTransition]: 'scrollTransition',
  });
  const SHOT_CONFIG = Object.freeze({
    introFallbackMs: 1700,
    preRevealEndMs: 520,
    revealEndMs: 1480,
    lockupEndMs: 2420,
    scrollTransitionStart: 0.12,
    camera: {
      desktop: {
        preReveal: { z: 6.64, fov: 57, targetRotX: -0.024, targetRotY: 0.012, pointerGain: 0.04, sway: 0.042 },
        reveal: { z: 5.80, fov: 52, targetRotX: -0.012, targetRotY: 0.010, pointerGain: 0.08, sway: 0.060 },
        lockup: { z: 5.74, fov: 51, targetRotX: -0.003, targetRotY: -0.006, pointerGain: 0.05, sway: 0.008 },
        interactiveIdle: { z: 5.82, fov: 51, targetRotX: 0.000, targetRotY: 0.000, pointerGain: 0.09, sway: 0.006 },
        scrollTransition: { z: 6.18, fov: 54, targetRotX: 0.006, targetRotY: 0.096, pointerGain: 0.05, sway: 0.015 },
      },
      mobile: {
        preReveal: { z: 6.18, fov: 54, targetRotX: -0.015, targetRotY: 0.010, pointerGain: 0.03, sway: 0.030 },
        reveal: { z: 5.76, fov: 50, targetRotX: -0.007, targetRotY: 0.004, pointerGain: 0.05, sway: 0.040 },
        lockup: { z: 5.72, fov: 49, targetRotX: -0.001, targetRotY: -0.003, pointerGain: 0.04, sway: 0.007 },
        interactiveIdle: { z: 5.80, fov: 49, targetRotX: 0.000, targetRotY: 0.000, pointerGain: 0.06, sway: 0.005 },
        scrollTransition: { z: 6.00, fov: 52, targetRotX: 0.004, targetRotY: 0.046, pointerGain: 0.04, sway: 0.012 },
      },
      low: {
        preReveal: { z: 6.12, fov: 54, targetRotX: -0.009, targetRotY: 0.007, pointerGain: 0.02, sway: 0.023 },
        reveal: { z: 5.78, fov: 50, targetRotX: -0.004, targetRotY: 0.002, pointerGain: 0.04, sway: 0.028 },
        lockup: { z: 5.78, fov: 49, targetRotX: -0.001, targetRotY: -0.002, pointerGain: 0.03, sway: 0.006 },
        interactiveIdle: { z: 5.84, fov: 49, targetRotX: 0.000, targetRotY: 0.000, pointerGain: 0.05, sway: 0.004 },
        scrollTransition: { z: 6.00, fov: 52, targetRotX: 0.004, targetRotY: 0.042, pointerGain: 0.04, sway: 0.011 },
      },
    },
  });
  const COMPOSITION_PRESETS = Object.freeze({
    desktop: {
      hammer: { position: { x: 0.86, y: 0.72, z: 0.88 }, scale: 0.72, opacity: 0.00, motion: 0.00 },
      wrench: { position: { x: 1.52, y: 0.36, z: 1.20 }, scale: 1.44, opacity: 1.00, motion: 0.10 },
      saw: { position: { x: 0.52, y: -0.42, z: 1.12 }, scale: 0.40, opacity: 0.00, motion: 0.00 },
    },
    tablet: {
      hammer: { position: { x: 0.80, y: 0.64, z: 0.88 }, scale: 0.64, opacity: 0.00, motion: 0.00 },
      wrench: { position: { x: 1.28, y: 0.28, z: 1.18 }, scale: 1.20, opacity: 1.00, motion: 0.08 },
      saw: { position: { x: 0.42, y: -0.38, z: 1.10 }, scale: 0.38, opacity: 0.00, motion: 0.00 },
    },
    mobile: {
      hammer: { position: { x: 0.62, y: 0.38, z: 0.92 }, scale: 0.40, opacity: 0.00, motion: 0.00 },
      wrench: { position: { x: 1.10, y: 1.18, z: 1.20 }, scale: 1.02, opacity: 1.00, motion: 0.05 },
      saw: { position: { x: 0.28, y: 0.16, z: 1.08 }, scale: 0.32, opacity: 0.00, motion: 0.00 },
    },
    narrow: {
      hammer: { position: { x: 0.56, y: 0.34, z: 0.92 }, scale: 0.34, opacity: 0.00, motion: 0.00 },
      wrench: { position: { x: 0.98, y: 1.02, z: 1.18 }, scale: 0.88, opacity: 1.00, motion: 0.04 },
      saw: { position: { x: 0.18, y: 0.06, z: 1.08 }, scale: 0.30, opacity: 0.00, motion: 0.00 },
    },
    low: {
      hammer: { position: { x: 0.56, y: 0.38, z: 0.92 }, scale: 0.34, opacity: 0.00, motion: 0.00 },
      wrench: { position: { x: 1.00, y: 1.00, z: 1.18 }, scale: 0.84, opacity: 1.00, motion: 0.04 },
      saw: { position: { x: 0.20, y: 0.06, z: 1.08 }, scale: 0.30, opacity: 0.00, motion: 0.00 },
    },
  });
  const ORBIT_LAYOUT_PRESETS = Object.freeze({
    desktop: {
      compositionMode: 'stillLifeDesktop',
      anchor: { x: 0.63, y: 0.52 },
      heroPlaneZ: 1.16,
      heroScreenHeightRatio: 0.60,
      heroScale: 0.92,
      heroScaleBias: 1.0,
      heroMargins: { top: 0.07, right: 0.06, bottom: 0.11 },
      heroPose: { pitch: -0.122, yaw: 0.175, roll: -0.244 },
      heroIdle: { yaw: 0.031, roll: 0.010 },
      hammer: { radiusPx: { x: 144, y: 112 }, zOffset: -0.12, angleDeg: 146, angularVelocity: 0.0, revealAngleOffset: 14, sizeRatio: 0.20, scale: 0.19, scaleBias: 1.0, opacity: 0.00 },
      saw: { radiusPx: { x: 160, y: 118 }, zOffset: 0.00, angleDeg: 208, angularVelocity: 0.0, revealAngleOffset: -12, sizeRatio: 0.14, scale: 0.16, scaleBias: 1.0, opacity: 0.00 },
    },
    tablet: {
      compositionMode: 'tabletCluster',
      anchor: { x: 0.62, y: 0.47 },
      heroPlaneZ: 1.20,
      heroScreenHeightRatio: 0.47,
      heroScale: 0.73,
      heroScaleBias: 1.0,
      heroMargins: { top: 0.07, right: 0.06, bottom: 0.11 },
      heroPose: { pitch: -0.105, yaw: 0.157, roll: -0.209 },
      heroIdle: { yaw: 0.026, roll: 0.009 },
      hammer: { radiusPx: { x: 116, y: 92 }, zOffset: -0.10, angleDeg: 148, angularVelocity: 0.0, revealAngleOffset: 14, sizeRatio: 0.19, scale: 0.16, scaleBias: 1.0, opacity: 0.00 },
      saw: { radiusPx: { x: 128, y: 96 }, zOffset: 0.00, angleDeg: 210, angularVelocity: 0.0, revealAngleOffset: -12, sizeRatio: 0.13, scale: 0.14, scaleBias: 1.0, opacity: 0.00 },
    },
    mobile: {
      compositionMode: 'crownMobile',
      anchor: { x: 0.57, y: 0.26 },
      heroPlaneZ: 1.32,
      heroScreenHeightRatio: 0.38,
      heroScale: 0.54,
      heroScaleBias: 1.0,
      heroMargins: { top: 0.02, right: 0.04, bottom: 0.40 },
      heroPose: { pitch: -0.070, yaw: 0.122, roll: -0.175 },
      heroIdle: { yaw: 0.014, roll: 0.004 },
      hammer: { radiusPx: { x: 54, y: 76 }, zOffset: -0.08, angleDeg: 204, angularVelocity: 0.0, revealAngleOffset: 8, sizeRatio: 0.11, scale: 0.16, scaleBias: 1.0, opacity: 0.00 },
      saw: { radiusPx: { x: 68, y: 88 }, zOffset: 0.00, angleDeg: 238, angularVelocity: 0.0, revealAngleOffset: -8, sizeRatio: 0.10, scale: 0.14, scaleBias: 1.0, opacity: 0.00 },
    },
    narrow: {
      compositionMode: 'wrenchOnlyNarrow',
      anchor: { x: 0.55, y: 0.25 },
      heroPlaneZ: 1.36,
      heroScreenHeightRatio: 0.34,
      heroScale: 0.50,
      heroScaleBias: 1.0,
      heroMargins: { top: 0.02, right: 0.04, bottom: 0.38 },
      heroPose: { pitch: -0.070, yaw: 0.105, roll: -0.157 },
      heroIdle: { yaw: 0.012, roll: 0.004 },
      hammer: { radiusPx: { x: 40, y: 52 }, zOffset: -0.10, angleDeg: 204, angularVelocity: 0.0, revealAngleOffset: 8, sizeRatio: 0.10, scale: 0.40, scaleBias: 1.0, opacity: 0.0 },
      saw: { radiusPx: { x: 54, y: 66 }, zOffset: 0.00, angleDeg: 238, angularVelocity: 0.0, revealAngleOffset: -8, sizeRatio: 0.10, scale: 0.38, scaleBias: 1.0, opacity: 0.0 },
    },
    low: {
      compositionMode: 'wrenchOnlyNarrow',
      anchor: { x: 0.55, y: 0.25 },
      heroPlaneZ: 1.32,
      heroScreenHeightRatio: 0.34,
      heroScale: 0.48,
      heroScaleBias: 1.0,
      heroMargins: { top: 0.02, right: 0.04, bottom: 0.36 },
      heroPose: { pitch: -0.070, yaw: 0.105, roll: -0.157 },
      heroIdle: { yaw: 0.010, roll: 0.003 },
      hammer: { radiusPx: { x: 36, y: 48 }, zOffset: -0.10, angleDeg: 204, angularVelocity: 0.0, revealAngleOffset: 8, sizeRatio: 0.10, scale: 0.34, scaleBias: 1.0, opacity: 0.0 },
      saw: { radiusPx: { x: 50, y: 60 }, zOffset: 0.00, angleDeg: 238, angularVelocity: 0.0, revealAngleOffset: -8, sizeRatio: 0.10, scale: 0.34, scaleBias: 1.0, opacity: 0.0 },
    },
  });
  const COMPOSITION_LANE_PRESETS = Object.freeze({
    desktop: {
      artLane: { left: 0.36, top: 0.04, right: 0.95, bottom: 0.88 },
      contentLane: { left: 0.04, top: 0.18, right: 0.66, bottom: 0.80 },
    },
    tablet: {
      artLane: { left: 0.28, top: 0.04, right: 0.94, bottom: 0.84 },
      contentLane: { left: 0.04, top: 0.18, right: 0.68, bottom: 0.82 },
    },
    mobile: {
      artLane: { left: 0.26, top: 0.00, right: 0.96, bottom: 0.44 },
      contentLane: { left: 0.04, top: 0.34, right: 0.96, bottom: 0.76 },
    },
    narrow: {
      artLane: { left: 0.24, top: 0.00, right: 0.96, bottom: 0.42 },
      contentLane: { left: 0.04, top: 0.35, right: 0.96, bottom: 0.78 },
    },
    low: {
      artLane: { left: 0.24, top: 0.02, right: 0.96, bottom: 0.40 },
      contentLane: { left: 0.04, top: 0.35, right: 0.96, bottom: 0.78 },
    },
  });
  const LIGHT_RIG_PRESETS = Object.freeze({
    preReveal: { key: 0.88, fill: 0.54, rim: 0.70, heroShadow: 0.64, ground: 0.72, orbit: 0.00, sawSpot: 0.00 },
    reveal: { key: 1.32, fill: 0.72, rim: 1.02, heroShadow: 1.14, ground: 1.00, orbit: 0.00, sawSpot: 0.00 },
    lockup: { key: 1.48, fill: 0.76, rim: 1.08, heroShadow: 1.32, ground: 1.04, orbit: 0.00, sawSpot: 0.00 },
    interactiveIdle: { key: 1.40, fill: 0.72, rim: 1.00, heroShadow: 1.22, ground: 0.98, orbit: 0.00, sawSpot: 0.00 },
    scrollTransition: { key: 0.96, fill: 0.58, rim: 0.80, heroShadow: 0.72, ground: 0.74, orbit: 0.00, sawSpot: 0.00 },
  });
  const POST_FX_PRESETS = Object.freeze({
    preReveal: { bloomGain: 0.62, thresholdBias: 0.04, radiusBias: -0.06, gradeFloor: 0.26, copyShieldBoost: 0.03 },
    reveal: { bloomGain: 0.74, thresholdBias: 0.03, radiusBias: -0.04, gradeFloor: 0.32, copyShieldBoost: 0.05 },
    lockup: { bloomGain: 0.70, thresholdBias: 0.05, radiusBias: -0.06, gradeFloor: 0.36, copyShieldBoost: 0.06 },
    interactiveIdle: { bloomGain: 0.68, thresholdBias: 0.06, radiusBias: -0.08, gradeFloor: 0.34, copyShieldBoost: 0.07 },
    scrollTransition: { bloomGain: 0.60, thresholdBias: 0.08, radiusBias: -0.08, gradeFloor: 0.26, copyShieldBoost: 0.08 },
  });
  const CINEMATIC_FINISH_PRESETS = Object.freeze({
    restrainedWorkshop: {
      id: 'restrained-workshop-finish',
      negativeFill: 0.32,
      heroPriority: 1.12,
      supportSuppression: 0.76,
      copyHighlightClamp: 0.84,
      warmCoreBias: 0.96,
      coolShadowBias: 1.14,
      heroShadowGrip: 1.08,
      lensPulseDesktop: 1.0,
      lensPulseLow: 0.0,
    },
    hybridEmberSignature: {
      id: 'hybrid-ember-signature-finish',
      negativeFill: 0.38,
      heroPriority: 1.18,
      supportSuppression: 0.82,
      copyHighlightClamp: 0.80,
      warmCoreBias: 1.08,
      coolShadowBias: 1.22,
      heroShadowGrip: 1.12,
      lensPulseDesktop: 1.0,
      lensPulseLow: 0.0,
    },
  });
  const SHOT_BEAT_PRESETS = Object.freeze({
    restrainedWorkshop: {
      preReveal: {
        label: 'forge-silhouette',
        cameraZBias: 0.22,
        cameraXBias: -0.08,
        cameraYBias: -0.04,
        heroLift: 0.02,
        heroMotionScale: 0.84,
        supportMotionScale: 0.0,
        supportOpacityScale: 0.0,
        supportSceneEnergyScale: 0.0,
      },
      reveal: {
        label: 'reveal-sweep',
        cameraZBias: -0.06,
        cameraXBias: -0.04,
        cameraYBias: -0.02,
        heroLift: 0.14,
        heroMotionScale: 1.00,
        supportMotionScale: 0.0,
        supportOpacityScale: 0.0,
        supportSceneEnergyScale: 0.0,
      },
      lockup: {
        label: 'hero-lockup',
        cameraZBias: -0.12,
        cameraXBias: 0.03,
        cameraYBias: -0.01,
        heroLift: 0.10,
        heroMotionScale: 0.88,
        supportMotionScale: 0.0,
        supportOpacityScale: 0.0,
        supportSceneEnergyScale: 0.0,
      },
      interactiveIdle: {
        label: 'interactive-hold',
        cameraZBias: -0.03,
        cameraXBias: 0.01,
        cameraYBias: 0.00,
        heroLift: 0.06,
        heroMotionScale: 0.90,
        supportMotionScale: 0.0,
        supportOpacityScale: 0.0,
        supportSceneEnergyScale: 0.0,
      },
      scrollTransition: {
        label: 'scroll-handoff',
        cameraZBias: 0.14,
        cameraXBias: -0.08,
        cameraYBias: 0.02,
        heroLift: 0.02,
        heroMotionScale: 0.78,
        supportMotionScale: 0.0,
        supportOpacityScale: 0.0,
        supportSceneEnergyScale: 0.0,
      },
    },
    hybridEmberSignature: {
      preReveal: {
        label: 'forge-silhouette',
        cameraZBias: 0.24,
        cameraXBias: -0.08,
        cameraYBias: -0.04,
        heroLift: 0.05,
        heroMotionScale: 0.84,
        supportMotionScale: 0.14,
        supportOpacityScale: 0.0,
        supportSceneEnergyScale: 0.12,
      },
      reveal: {
        label: 'reveal-sweep',
        cameraZBias: -0.02,
        cameraXBias: -0.03,
        cameraYBias: -0.01,
        heroLift: 0.14,
        heroMotionScale: 1.02,
        supportMotionScale: 0.62,
        supportOpacityScale: 0.74,
        supportSceneEnergyScale: 0.46,
      },
      lockup: {
        label: 'hero-lockup',
        cameraZBias: -0.12,
        cameraXBias: 0.00,
        cameraYBias: -0.02,
        heroLift: 0.10,
        heroMotionScale: 0.86,
        supportMotionScale: 0.82,
        supportOpacityScale: 0.88,
        supportSceneEnergyScale: 0.64,
      },
      interactiveIdle: {
        label: 'interactive-hold',
        cameraZBias: -0.04,
        cameraXBias: 0.00,
        cameraYBias: 0.00,
        heroLift: 0.08,
        heroMotionScale: 0.88,
        supportMotionScale: 0.92,
        supportOpacityScale: 0.96,
        supportSceneEnergyScale: 0.76,
      },
      scrollTransition: {
        label: 'scroll-handoff',
        cameraZBias: 0.16,
        cameraXBias: -0.10,
        cameraYBias: 0.02,
        heroLift: 0.01,
        heroMotionScale: 0.72,
        supportMotionScale: 0.38,
        supportOpacityScale: 0.46,
        supportSceneEnergyScale: 0.30,
      },
    },
  });
  const LENS_FINISH_PRESETS = Object.freeze({
    restrainedWorkshop: {
      preReveal: {
        label: 'obsidian-blueprint',
        vignetteStrength: 0.92,
        vignetteFocus: 0.82,
        bloomDiscipline: 0.88,
        beamDiscipline: 0.68,
        hazeScale: 0.76,
        coolShadowLift: 0.16,
        warmCoreLift: 0.08,
        pulseHalo: 0.00,
      },
      reveal: {
        label: 'forged-arc',
        vignetteStrength: 0.80,
        vignetteFocus: 0.92,
        bloomDiscipline: 0.96,
        beamDiscipline: 0.84,
        hazeScale: 0.90,
        coolShadowLift: 0.22,
        warmCoreLift: 0.14,
        pulseHalo: 0.10,
      },
      lockup: {
        label: 'hero-grade-lockup',
        vignetteStrength: 0.86,
        vignetteFocus: 1.00,
        bloomDiscipline: 0.92,
        beamDiscipline: 0.76,
        hazeScale: 0.82,
        coolShadowLift: 0.26,
        warmCoreLift: 0.12,
        pulseHalo: 0.08,
      },
      interactiveIdle: {
        label: 'quiet-lens-hold',
        vignetteStrength: 0.84,
        vignetteFocus: 0.96,
        bloomDiscipline: 0.86,
        beamDiscipline: 0.72,
        hazeScale: 0.78,
        coolShadowLift: 0.22,
        warmCoreLift: 0.10,
        pulseHalo: 0.06,
      },
      scrollTransition: {
        label: 'handoff-compression',
        vignetteStrength: 0.72,
        vignetteFocus: 0.78,
        bloomDiscipline: 0.76,
        beamDiscipline: 0.58,
        hazeScale: 0.62,
        coolShadowLift: 0.16,
        warmCoreLift: 0.04,
        pulseHalo: 0.00,
      },
    },
    hybridEmberSignature: {
      preReveal: {
        label: 'obsidian-blueprint',
        vignetteStrength: 0.96,
        vignetteFocus: 0.86,
        bloomDiscipline: 0.78,
        beamDiscipline: 0.76,
        hazeScale: 0.70,
        coolShadowLift: 0.22,
        warmCoreLift: 0.10,
        pulseHalo: 0.00,
      },
      reveal: {
        label: 'forged-arc',
        vignetteStrength: 0.82,
        vignetteFocus: 0.96,
        bloomDiscipline: 0.90,
        beamDiscipline: 0.90,
        hazeScale: 0.96,
        coolShadowLift: 0.28,
        warmCoreLift: 0.18,
        pulseHalo: 0.14,
      },
      lockup: {
        label: 'hero-grade-lockup',
        vignetteStrength: 0.90,
        vignetteFocus: 1.04,
        bloomDiscipline: 0.84,
        beamDiscipline: 0.80,
        hazeScale: 0.76,
        coolShadowLift: 0.30,
        warmCoreLift: 0.16,
        pulseHalo: 0.10,
      },
      interactiveIdle: {
        label: 'quiet-lens-hold',
        vignetteStrength: 0.88,
        vignetteFocus: 0.98,
        bloomDiscipline: 0.78,
        beamDiscipline: 0.76,
        hazeScale: 0.72,
        coolShadowLift: 0.26,
        warmCoreLift: 0.14,
        pulseHalo: 0.08,
      },
      scrollTransition: {
        label: 'handoff-compression',
        vignetteStrength: 0.74,
        vignetteFocus: 0.80,
        bloomDiscipline: 0.68,
        beamDiscipline: 0.62,
        hazeScale: 0.54,
        coolShadowLift: 0.18,
        warmCoreLift: 0.06,
        pulseHalo: 0.02,
      },
    },
  });
  const LIGHTING_CUE_PRESETS = Object.freeze({
    restrainedWorkshop: {
      preReveal: {
        label: 'negative-fill-veil',
        keyScale: 0.92,
        fillScale: 0.66,
        rimScale: 0.76,
        supportLightScale: 0.0,
        shadowGrip: 1.08,
      },
      reveal: {
        label: 'wrench-reveal-sweep',
        keyScale: 1.06,
        fillScale: 0.72,
        rimScale: 0.92,
        supportLightScale: 0.0,
        shadowGrip: 1.12,
      },
      lockup: {
        label: 'hero-key-lock',
        keyScale: 1.12,
        fillScale: 0.68,
        rimScale: 0.96,
        supportLightScale: 0.0,
        shadowGrip: 1.18,
      },
      interactiveIdle: {
        label: 'calm-hero-hold',
        keyScale: 1.02,
        fillScale: 0.70,
        rimScale: 0.90,
        supportLightScale: 0.0,
        shadowGrip: 1.10,
      },
      scrollTransition: {
        label: 'compressed-exit-rig',
        keyScale: 0.88,
        fillScale: 0.62,
        rimScale: 0.74,
        supportLightScale: 0.0,
        shadowGrip: 0.94,
      },
    },
    hybridEmberSignature: {
      preReveal: {
        label: 'negative-fill-veil',
        keyScale: 0.88,
        fillScale: 0.58,
        rimScale: 0.80,
        supportLightScale: 0.0,
        shadowGrip: 1.10,
      },
      reveal: {
        label: 'wrench-reveal-sweep',
        keyScale: 1.10,
        fillScale: 0.68,
        rimScale: 0.98,
        supportLightScale: 0.0,
        shadowGrip: 1.18,
      },
      lockup: {
        label: 'hero-key-lock',
        keyScale: 1.16,
        fillScale: 0.62,
        rimScale: 1.00,
        supportLightScale: 0.0,
        shadowGrip: 1.22,
      },
      interactiveIdle: {
        label: 'calm-hero-hold',
        keyScale: 1.04,
        fillScale: 0.64,
        rimScale: 0.92,
        supportLightScale: 0.0,
        shadowGrip: 1.14,
      },
      scrollTransition: {
        label: 'compressed-exit-rig',
        keyScale: 0.86,
        fillScale: 0.56,
        rimScale: 0.74,
        supportLightScale: 0.0,
        shadowGrip: 0.96,
      },
    },
  });
  const WORLD_CUE_PRESETS = Object.freeze({
    hybridEmberSignature: {
      preReveal: {
        label: 'forge-silhouette-world',
        rearForge: 0.18,
        backscatter: 0.08,
        silhouette: 0.52,
        benchOcclusion: 0.34,
        hangingDepth: 0.40,
        copyBias: 0.14,
      },
      reveal: {
        label: 'seam-sweep-countercue',
        rearForge: 0.54,
        backscatter: 0.34,
        silhouette: 0.46,
        benchOcclusion: 0.30,
        hangingDepth: 0.48,
        copyBias: 0.10,
      },
      lockup: {
        label: 'depth-lockup-world',
        rearForge: 0.34,
        backscatter: 0.18,
        silhouette: 0.60,
        benchOcclusion: 0.42,
        hangingDepth: 0.52,
        copyBias: 0.06,
      },
      interactiveIdle: {
        label: 'quiet-forge-hold',
        rearForge: 0.26,
        backscatter: 0.12,
        silhouette: 0.52,
        benchOcclusion: 0.36,
        hangingDepth: 0.44,
        copyBias: 0.08,
      },
      scrollTransition: {
        label: 'scroll-evacuation-world',
        rearForge: 0.12,
        backscatter: 0.06,
        silhouette: 0.30,
        benchOcclusion: 0.22,
        hangingDepth: 0.20,
        copyBias: 0.02,
      },
    },
  });
  const ENVIRONMENT_DEPTH_PRESETS = Object.freeze({
    hybridEmberSignature: {
      preReveal: {
        total: 0.34,
        rearForgeMix: 0.30,
        silhouetteMix: 0.52,
        occluderMix: 0.40,
        hangingMix: 0.42,
        hazeLaneMix: 0.18,
        separationBias: 0.44,
      },
      reveal: {
        total: 0.58,
        rearForgeMix: 0.74,
        silhouetteMix: 0.58,
        occluderMix: 0.46,
        hangingMix: 0.54,
        hazeLaneMix: 0.44,
        separationBias: 0.60,
      },
      lockup: {
        total: 0.70,
        rearForgeMix: 0.50,
        silhouetteMix: 0.72,
        occluderMix: 0.58,
        hangingMix: 0.60,
        hazeLaneMix: 0.52,
        separationBias: 0.74,
      },
      interactiveIdle: {
        total: 0.62,
        rearForgeMix: 0.40,
        silhouetteMix: 0.64,
        occluderMix: 0.50,
        hangingMix: 0.52,
        hazeLaneMix: 0.46,
        separationBias: 0.66,
      },
      scrollTransition: {
        total: 0.42,
        rearForgeMix: 0.22,
        silhouetteMix: 0.38,
        occluderMix: 0.28,
        hangingMix: 0.26,
        hazeLaneMix: 0.20,
        separationBias: 0.48,
      },
    },
  });
  const PARALLAX_LAYER_PRESETS = Object.freeze({
    hybridEmberSignature: {
      rearForge: { xGain: -1.26, yGain: 0.46, drift: 0.26, scrollX: -0.30, scrollY: -0.08 },
      backscatter: { xGain: -0.74, yGain: 0.58, drift: 0.18, scrollX: -0.18, scrollY: -0.04 },
      silhouettePrimary: { xGain: -0.34, yGain: 0.12, drift: 0.08, scrollX: -0.12, scrollY: -0.02 },
      silhouetteSecondary: { xGain: -0.28, yGain: 0.10, drift: 0.06, scrollX: -0.10, scrollY: -0.02 },
      benchOccluder: { xGain: -0.18, yGain: 0.06, drift: 0.04, scrollX: -0.08, scrollY: -0.03 },
      hangingDepth: { xGain: -0.42, yGain: 0.26, drift: 0.14, scrollX: -0.18, scrollY: -0.06 },
    },
  });
  const LENS_EVENT_PRESETS = Object.freeze({
    hybridEmberSignature: {
      preReveal: { label: 'lens-quiet', accentGain: 0.00, chromaSplit: 0.00, pulseThreshold: 0.42, worldGlow: 0.10 },
      reveal: { label: 'lens-reveal', accentGain: 0.18, chromaSplit: 0.08, pulseThreshold: 0.18, worldGlow: 0.24 },
      lockup: { label: 'lens-lockup', accentGain: 0.12, chromaSplit: 0.05, pulseThreshold: 0.22, worldGlow: 0.18 },
      interactiveIdle: { label: 'lens-idle', accentGain: 0.10, chromaSplit: 0.04, pulseThreshold: 0.24, worldGlow: 0.12 },
      scrollTransition: { label: 'lens-handoff', accentGain: 0.04, chromaSplit: 0.02, pulseThreshold: 0.40, worldGlow: 0.06 },
    },
  });
  const ASSET_PROFILE_PRESETS = Object.freeze({
    heroPack: {
      version: 'hero-pack-v5',
      variant: 'final',
      contractVersion: 'hero-asset-contract-v4',
      manifest: HERO_RUNTIME_ASSETS.manifest,
      preferred: {
        wrench: HERO_RUNTIME_ASSETS.preferred.wrench,
        hammer: HERO_RUNTIME_ASSETS.preferred.hammer,
        saw: HERO_RUNTIME_ASSETS.preferred.saw,
      },
      legacy: {
        wrench: HERO_RUNTIME_ASSETS.legacy.wrench,
        hammer: HERO_RUNTIME_ASSETS.legacy.hammer,
        saw: HERO_RUNTIME_ASSETS.legacy.saw,
      },
    },
  });
  const MATERIAL_PROFILE_PRESETS = Object.freeze({
    forgedMagicHybrid: {
      steel: {
        color: 0xbec4c8,
        roughness: 0.24,
        metalness: 0.96,
        envMapIntensity: 0.92,
        clearcoat: 0.18,
        clearcoatRoughness: 0.24,
        reflectivity: 0.62,
      },
      blackened_steel: {
        color: 0x353841,
        roughness: 0.48,
        metalness: 0.88,
        envMapIntensity: 0.66,
        clearcoat: 0.14,
        clearcoatRoughness: 0.34,
        reflectivity: 0.48,
      },
      rubber: {
        color: 0x131313,
        roughness: 0.86,
        metalness: 0.04,
        envMapIntensity: 0.18,
        clearcoat: 0.04,
        clearcoatRoughness: 0.48,
        reflectivity: 0.16,
      },
      wood: {
        color: 0x8a6434,
        roughness: 0.82,
        metalness: 0.02,
        envMapIntensity: 0.16,
        clearcoat: 0.06,
        clearcoatRoughness: 0.48,
        reflectivity: 0.18,
      },
      brass: {
        color: 0xae8147,
        roughness: 0.34,
        metalness: 0.86,
        envMapIntensity: 0.74,
        clearcoat: 0.12,
        clearcoatRoughness: 0.26,
        reflectivity: 0.52,
      },
      ember_core: {
        color: 0x32180c,
        roughness: 0.28,
        metalness: 0.06,
        envMapIntensity: 0.20,
        emissive: 0xf18f2d,
        emissiveIntensity: 0.52,
        clearcoat: 0.10,
        clearcoatRoughness: 0.24,
        reflectivity: 0.24,
      },
      floor: {
        color: 0x090b11,
        roughness: 0.46,
        metalness: 0.26,
        envMapIntensity: 0.60,
      },
    },
    precisionWorkshopBespoke: {
      steel: {
        color: 0xc6ccd0,
        roughness: 0.18,
        metalness: 0.98,
        envMapIntensity: 1.04,
        clearcoat: 0.20,
        clearcoatRoughness: 0.18,
        reflectivity: 0.68,
      },
      blackened_steel: {
        color: 0x2a2f38,
        roughness: 0.30,
        metalness: 0.90,
        envMapIntensity: 0.78,
        clearcoat: 0.18,
        clearcoatRoughness: 0.24,
        reflectivity: 0.56,
      },
      rubber: {
        color: 0x0d0f12,
        roughness: 0.84,
        metalness: 0.03,
        envMapIntensity: 0.12,
        clearcoat: 0.02,
        clearcoatRoughness: 0.54,
        reflectivity: 0.10,
      },
      wood: {
        color: 0x7c5931,
        roughness: 0.72,
        metalness: 0.02,
        envMapIntensity: 0.14,
        clearcoat: 0.05,
        clearcoatRoughness: 0.42,
        reflectivity: 0.16,
      },
      brass: {
        color: 0xca8f3b,
        roughness: 0.26,
        metalness: 0.92,
        envMapIntensity: 0.88,
        clearcoat: 0.12,
        clearcoatRoughness: 0.18,
        reflectivity: 0.62,
      },
      ember_core: {
        color: 0x2d1409,
        roughness: 0.24,
        metalness: 0.04,
        envMapIntensity: 0.18,
        emissive: 0xf29e2f,
        emissiveIntensity: 0.58,
        clearcoat: 0.08,
        clearcoatRoughness: 0.20,
        reflectivity: 0.22,
      },
      floor: {
        color: 0x070910,
        roughness: 0.40,
        metalness: 0.32,
        envMapIntensity: 0.72,
      },
    },
  });
  const ENVIRONMENT_MAGIC_PRESETS = Object.freeze({
    forgedMagicHybrid: {
      wrenchRibbonBias: 1.22,
      sawSparkBias: 0.72,
      copyCorridorCalm: 0.82,
      emberAccentGain: 0.20,
      floorReflectivityCut: 0.16,
      ctaWakePull: 0.30,
      ctaWakeWrench: 0.32,
      hazeCompression: 0.34,
      scrollEmberDrain: 0.26,
      toolWrapStrength: 1.18,
    },
    precisionWorkshopBespoke: {
      wrenchRibbonBias: 1.14,
      sawSparkBias: 0.52,
      copyCorridorCalm: 0.92,
      emberAccentGain: 0.16,
      floorReflectivityCut: 0.20,
      ctaWakePull: 0.26,
      ctaWakeWrench: 0.28,
      hazeCompression: 0.42,
      scrollEmberDrain: 0.30,
      toolWrapStrength: 1.26,
    },
  });
  const SCROLL_HANDOFF_PRESETS = Object.freeze({
    idle: { hazeScale: 1.0, emberDrain: 0.0, copyCalm: 0.0, gradeLift: 1.0 },
    compressing: { hazeScale: 0.78, emberDrain: 0.22, copyCalm: 0.14, gradeLift: 0.88 },
    handedOff: { hazeScale: 0.62, emberDrain: 0.38, copyCalm: 0.24, gradeLift: 0.74 },
  });
  const PARTICLE_STORY_PRESETS = Object.freeze({
    mysticalWrench: {
      preReveal: {
        cue: 'pre-reveal-whisper',
        speciesBias: { flowRibbon: 0.24, cloudMote: 0.52, microDust: 0.38, sparkFilament: 0.06 },
        forceScale: 0.48,
        copyCalm: 1.28,
        ribbonOrbit: 0.42,
        wrenchAttractor: 0.36,
        sparkGate: 0.08,
        ambientMotion: 0.20,
        supportMotion: 0.16,
        localEddy: 0.18,
        hazeScale: 0.76,
      },
      reveal: {
        cue: 'reveal-convergence',
        speciesBias: { flowRibbon: 1.08, cloudMote: 0.86, microDust: 0.62, sparkFilament: 0.24 },
        forceScale: 0.96,
        copyCalm: 1.10,
        ribbonOrbit: 1.12,
        wrenchAttractor: 0.94,
        sparkGate: 0.28,
        ambientMotion: 0.34,
        supportMotion: 0.22,
        localEddy: 0.44,
        hazeScale: 0.94,
      },
      lockup: {
        cue: 'lockup-orbit',
        speciesBias: { flowRibbon: 1.00, cloudMote: 0.88, microDust: 0.74, sparkFilament: 0.16 },
        forceScale: 0.90,
        copyCalm: 1.04,
        ribbonOrbit: 1.18,
        wrenchAttractor: 1.00,
        sparkGate: 0.18,
        ambientMotion: 0.30,
        supportMotion: 0.20,
        localEddy: 0.34,
        hazeScale: 0.90,
      },
      interactiveIdle: {
        cue: 'interactive-local-eddy',
        speciesBias: { flowRibbon: 0.90, cloudMote: 0.80, microDust: 0.72, sparkFilament: 0.12 },
        forceScale: 0.82,
        copyCalm: 1.08,
        ribbonOrbit: 0.94,
        wrenchAttractor: 0.84,
        sparkGate: 0.16,
        ambientMotion: 0.26,
        supportMotion: 0.18,
        localEddy: 0.62,
        hazeScale: 0.84,
      },
      scrollTransition: {
        cue: 'scroll-drift',
        speciesBias: { flowRibbon: 0.52, cloudMote: 0.56, microDust: 0.38, sparkFilament: 0.05 },
        forceScale: 0.52,
        copyCalm: 1.34,
        ribbonOrbit: 0.54,
        wrenchAttractor: 0.44,
        sparkGate: 0.04,
        ambientMotion: 0.16,
        supportMotion: 0.10,
        localEddy: 0.18,
        hazeScale: 0.66,
      },
    },
    hybridEmberSignature: {
      preReveal: {
        cue: 'pre-reveal-ember-whisper',
        speciesBias: { flowRibbon: 0.62, cloudMote: 1.18, microDust: 0.48, sparkFilament: 0.04 },
        hoverSparkGate: [0, 0, 0.12, 0.42, 0],
        dragWakeSpecies: ['flowRibbon', 'flowRibbon', null, 'microDust', null],
        forceScale: 0.44,
        copyCalm: 1.34,
        ribbonOrbit: 0.28,
        wrenchAttractor: 0.42,
        sparkGate: 0.04,
        ambientMotion: 0.16,
        supportMotion: 0.12,
        localEddy: 0.14,
        hazeScale: 0.70,
      },
      reveal: {
        cue: 'reveal-ember-convergence',
        speciesBias: { flowRibbon: 1.42, cloudMote: 0.72, microDust: 0.44, sparkFilament: 0.08 },
        hoverSparkGate: [0, 0, 0.12, 0.42, 0],
        dragWakeSpecies: ['flowRibbon', 'flowRibbon', null, 'microDust', null],
        forceScale: 1.04,
        copyCalm: 1.22,
        ribbonOrbit: 1.10,
        wrenchAttractor: 1.12,
        sparkGate: 0.20,
        ambientMotion: 0.30,
        supportMotion: 0.18,
        localEddy: 0.34,
        hazeScale: 0.90,
      },
      lockup: {
        cue: 'lockup-ember-orbit',
        speciesBias: { flowRibbon: 0.96, cloudMote: 0.94, microDust: 0.82, sparkFilament: 0.14 },
        hoverSparkGate: [0, 0, 0.12, 0.42, 0],
        dragWakeSpecies: ['flowRibbon', 'flowRibbon', null, 'microDust', null],
        forceScale: 0.96,
        copyCalm: 1.18,
        ribbonOrbit: 1.24,
        wrenchAttractor: 1.06,
        sparkGate: 0.14,
        ambientMotion: 0.24,
        supportMotion: 0.16,
        localEddy: 0.26,
        hazeScale: 0.76,
      },
      interactiveIdle: {
        cue: 'interactive-ember-eddy',
        speciesBias: { flowRibbon: 0.82, cloudMote: 0.88, microDust: 0.78, sparkFilament: 0.22 },
        hoverSparkGate: [0, 0, 0.12, 0.42, 0],
        dragWakeSpecies: ['flowRibbon', 'flowRibbon', null, 'microDust', null],
        forceScale: 0.88,
        copyCalm: 1.16,
        ribbonOrbit: 0.98,
        wrenchAttractor: 0.92,
        sparkGate: 0.12,
        ambientMotion: 0.22,
        supportMotion: 0.16,
        localEddy: 0.48,
        hazeScale: 0.72,
      },
      scrollTransition: {
        cue: 'scroll-ember-drain',
        speciesBias: { flowRibbon: 0.46, cloudMote: 0.76, microDust: 0.52, sparkFilament: 0.03 },
        hoverSparkGate: [0, 0, 0.12, 0.42, 0],
        dragWakeSpecies: ['flowRibbon', 'flowRibbon', null, 'microDust', null],
        forceScale: 0.46,
        copyCalm: 1.46,
        ribbonOrbit: 0.38,
        wrenchAttractor: 0.34,
        sparkGate: 0.03,
        ambientMotion: 0.12,
        supportMotion: 0.08,
        localEddy: 0.12,
        hazeScale: 0.52,
      },
    },
  });
  const FORCE_FIELD_PRESETS = Object.freeze({
    mysticalWrench: {
      globalWindShear: { x: 0.00026, y: 0.00006, z: 0.00008, pointerGain: 0.00036, maxWind: 0.019 },
      layeredCurl: { primary: 0.00034, secondary: 0.00024, tertiary: 0.00014 },
      floorDrag: { gravity: 0.00012, drag: 0.012, lift: 0.00018 },
      wrenchAttractor: { strength: 0.00124, pull: 0.00092, radius: 2.35 },
      toolDeflector: { strength: 0.00152, wrap: 1.16 },
      copyRepeller: { strength: 0.00148, lift: 0.00112 },
      localEddy: { hover: 0.00062, drag: 0.00114, pulse: 0.00088 },
    },
  });
  const VORTEX_FIELD_PRESETS = Object.freeze({
    mysticalWrench: {
      seamOrbit: { offset: { x: 0.12, y: 0.82, z: 0.11 }, radius: 1.46, spin: 1.22, pull: 0.86, zLift: 0.05 },
      counterPair: [
        { offset: { x: 0.30, y: 0.98, z: 0.12 }, radius: 0.96, spin: 1.30, pull: 0.74, zLift: 0.05 },
        { offset: { x: -0.16, y: 0.64, z: 0.08 }, radius: 0.84, spin: -1.18, pull: 0.68, zLift: 0.04 },
      ],
    },
  });
  const MAGIC_INTENSITY_PRESETS = Object.freeze({
    mysticalWrench: {
      preReveal: { base: 0.18, focusGain: 0.08, releaseGain: 0.12, pulseGain: 0.18, ctaGain: 0.10, handoffDrop: 0.08 },
      reveal: { base: 0.52, focusGain: 0.10, releaseGain: 0.18, pulseGain: 0.20, ctaGain: 0.12, handoffDrop: 0.10 },
      lockup: { base: 0.66, focusGain: 0.10, releaseGain: 0.20, pulseGain: 0.18, ctaGain: 0.10, handoffDrop: 0.12 },
      interactiveIdle: { base: 0.58, focusGain: 0.12, releaseGain: 0.18, pulseGain: 0.22, ctaGain: 0.18, handoffDrop: 0.16 },
      scrollTransition: { base: 0.34, focusGain: 0.06, releaseGain: 0.10, pulseGain: 0.12, ctaGain: 0.08, handoffDrop: 0.28 },
    },
    hybridEmberSignature: {
      preReveal: { base: 0.16, focusGain: 0.06, releaseGain: 0.10, pulseGain: 0.20, ctaGain: 0.08, handoffDrop: 0.06 },
      reveal: { base: 0.56, focusGain: 0.10, releaseGain: 0.16, pulseGain: 0.24, ctaGain: 0.14, handoffDrop: 0.10 },
      lockup: { base: 0.62, focusGain: 0.08, releaseGain: 0.18, pulseGain: 0.22, ctaGain: 0.12, handoffDrop: 0.12 },
      interactiveIdle: { base: 0.56, focusGain: 0.10, releaseGain: 0.18, pulseGain: 0.24, ctaGain: 0.18, handoffDrop: 0.16 },
      scrollTransition: { base: 0.26, focusGain: 0.04, releaseGain: 0.08, pulseGain: 0.12, ctaGain: 0.06, handoffDrop: 0.32 },
    },
  });
  const LIGHT_SCATTER_PRESETS = Object.freeze({
    mysticalWrench: {
      preReveal: { scatterGain: 0.74, shaftTightness: 0.82, wrenchAnchorGain: 0.44, warmBias: 0.76, coolBias: 0.32, rimTightness: 0.82 },
      reveal: { scatterGain: 1.06, shaftTightness: 1.10, wrenchAnchorGain: 0.98, warmBias: 1.08, coolBias: 0.42, rimTightness: 0.98 },
      lockup: { scatterGain: 1.00, shaftTightness: 1.04, wrenchAnchorGain: 1.08, warmBias: 1.04, coolBias: 0.40, rimTightness: 1.04 },
      interactiveIdle: { scatterGain: 0.92, shaftTightness: 0.94, wrenchAnchorGain: 0.92, warmBias: 0.96, coolBias: 0.40, rimTightness: 1.08 },
      scrollTransition: { scatterGain: 0.70, shaftTightness: 0.78, wrenchAnchorGain: 0.54, warmBias: 0.78, coolBias: 0.34, rimTightness: 0.90 },
    },
    hybridEmberSignature: {
      preReveal: { scatterGain: 0.62, shaftTightness: 0.96, wrenchAnchorGain: 0.52, warmBias: 0.84, coolBias: 0.38, rimTightness: 0.88 },
      reveal: { scatterGain: 1.10, shaftTightness: 1.18, wrenchAnchorGain: 1.12, warmBias: 1.18, coolBias: 0.62, rimTightness: 1.02 },
      lockup: { scatterGain: 0.90, shaftTightness: 1.10, wrenchAnchorGain: 1.18, warmBias: 1.10, coolBias: 0.46, rimTightness: 1.06 },
      interactiveIdle: { scatterGain: 0.82, shaftTightness: 0.98, wrenchAnchorGain: 1.00, warmBias: 1.00, coolBias: 0.42, rimTightness: 1.08 },
      scrollTransition: { scatterGain: 0.56, shaftTightness: 0.82, wrenchAnchorGain: 0.48, warmBias: 0.74, coolBias: 0.36, rimTightness: 0.92 },
    },
  });
  const COPY_CORRIDOR_GUARDS = Object.freeze({
    mysticalWrench: {
      densityTarget: 0.22,
      repellerScale: 1.22,
      evacuationThreshold: 0.18,
      lateralSweep: 1.16,
      scatterFade: 0.34,
    },
    hybridEmberSignature: {
      densityTarget: 0.18,
      repellerScale: 1.38,
      evacuationThreshold: 0.14,
      lateralSweep: 1.30,
      scatterFade: 0.42,
    },
  });
  const PARTICLE_SIGNATURE_PRESETS = Object.freeze({
    hybridEmberSignature: {
      preReveal: {
        label: 'ember-whisper',
        seamLanePull: 0.30,
        orbitLane: 0.22,
        upliftColumn: 0.24,
        corridorEvacuation: 0.20,
        ribbonPersistence: 0.18,
        trailDecay: 0.86,
        releaseFan: 0.18,
        deflectorBoost: 1.04,
        laneSweep: 0.24,
        heroEmberBase: 0.18,
      },
      reveal: {
        label: 'ember-convergence',
        seamLanePull: 1.12,
        orbitLane: 0.64,
        upliftColumn: 0.82,
        corridorEvacuation: 0.40,
        ribbonPersistence: 0.48,
        trailDecay: 0.92,
        releaseFan: 0.42,
        deflectorBoost: 1.18,
        laneSweep: 0.98,
        heroEmberBase: 0.56,
      },
      lockup: {
        label: 'ember-orbit-lock',
        seamLanePull: 0.82,
        orbitLane: 1.10,
        upliftColumn: 0.90,
        corridorEvacuation: 0.56,
        ribbonPersistence: 0.56,
        trailDecay: 0.90,
        releaseFan: 0.48,
        deflectorBoost: 1.16,
        laneSweep: 0.52,
        heroEmberBase: 0.64,
      },
      interactiveIdle: {
        label: 'ember-local-eddy',
        seamLanePull: 0.70,
        orbitLane: 0.86,
        upliftColumn: 0.68,
        corridorEvacuation: 0.50,
        ribbonPersistence: 0.44,
        trailDecay: 0.88,
        releaseFan: 0.54,
        deflectorBoost: 1.10,
        laneSweep: 0.38,
        heroEmberBase: 0.58,
      },
      scrollTransition: {
        label: 'ember-drain',
        seamLanePull: 0.24,
        orbitLane: 0.30,
        upliftColumn: 0.26,
        corridorEvacuation: 0.92,
        ribbonPersistence: 0.18,
        trailDecay: 0.76,
        releaseFan: 0.22,
        deflectorBoost: 1.14,
        laneSweep: 0.14,
        heroEmberBase: 0.24,
      },
    },
  });
  const RELEASE_ENVELOPE_PRESETS = Object.freeze({
    hybridEmberSignature: {
      preReveal: { attack: 0.18, decay: 0.08, emberBoost: 0.22, fanGain: 0.18, ribbonHold: 0.22 },
      reveal: { attack: 0.34, decay: 0.14, emberBoost: 0.46, fanGain: 0.36, ribbonHold: 0.48 },
      lockup: { attack: 0.30, decay: 0.18, emberBoost: 0.42, fanGain: 0.42, ribbonHold: 0.56 },
      interactiveIdle: { attack: 0.28, decay: 0.20, emberBoost: 0.44, fanGain: 0.50, ribbonHold: 0.52 },
      scrollTransition: { attack: 0.12, decay: 0.24, emberBoost: 0.16, fanGain: 0.18, ribbonHold: 0.18 },
    },
  });
  const VOLUME_SHAFT_PRESETS = Object.freeze({
    hybridEmberSignature: {
      preReveal: { warmSeam: 0.42, coolBackscatter: 0.24, upliftColumn: 0.28, hazeClamp: 0.82 },
      reveal: { warmSeam: 1.04, coolBackscatter: 0.62, upliftColumn: 0.92, hazeClamp: 0.96 },
      lockup: { warmSeam: 0.90, coolBackscatter: 0.40, upliftColumn: 0.84, hazeClamp: 0.80 },
      interactiveIdle: { warmSeam: 0.76, coolBackscatter: 0.36, upliftColumn: 0.62, hazeClamp: 0.72 },
      scrollTransition: { warmSeam: 0.40, coolBackscatter: 0.28, upliftColumn: 0.24, hazeClamp: 0.56 },
    },
  });
  const ACTIVE_ASSET_PROFILE = ASSET_PROFILE_PRESETS.heroPack;
  const ACTIVE_MATERIAL_PROFILE = 'precisionWorkshopBespoke';
  const ACTIVE_CINEMATIC_FINISH = CINEMATIC_FINISH_PRESETS.restrainedWorkshop;
  const ACTIVE_SHOT_BEATS = SHOT_BEAT_PRESETS.restrainedWorkshop;
  const ACTIVE_LENS_FINISH = LENS_FINISH_PRESETS.restrainedWorkshop;
  const ACTIVE_LIGHTING_CUES = LIGHTING_CUE_PRESETS.restrainedWorkshop;
  const ACTIVE_WORLD_CUES = WORLD_CUE_PRESETS.hybridEmberSignature;
  const ACTIVE_ENVIRONMENT_DEPTH = ENVIRONMENT_DEPTH_PRESETS.hybridEmberSignature;
  const ACTIVE_PARALLAX_LAYERS = PARALLAX_LAYER_PRESETS.hybridEmberSignature;
  const ACTIVE_LENS_EVENTS = LENS_EVENT_PRESETS.hybridEmberSignature;
  const ACTIVE_ENVIRONMENT_MAGIC = ENVIRONMENT_MAGIC_PRESETS.precisionWorkshopBespoke;
  const ACTIVE_PARTICLE_STORY = PARTICLE_STORY_PRESETS.hybridEmberSignature;
  const ACTIVE_PARTICLE_SIGNATURE = PARTICLE_SIGNATURE_PRESETS.hybridEmberSignature;
  const ACTIVE_RELEASE_ENVELOPE = RELEASE_ENVELOPE_PRESETS.hybridEmberSignature;
  const ACTIVE_VOLUME_SHAFT = VOLUME_SHAFT_PRESETS.hybridEmberSignature;
  const ACTIVE_FORCE_FIELDS = FORCE_FIELD_PRESETS.mysticalWrench;
  const ACTIVE_VORTEX_FIELDS = VORTEX_FIELD_PRESETS.mysticalWrench;
  const ACTIVE_MAGIC_INTENSITY = MAGIC_INTENSITY_PRESETS.hybridEmberSignature;
  const ACTIVE_LIGHT_SCATTER = LIGHT_SCATTER_PRESETS.hybridEmberSignature;
  const ACTIVE_COPY_CORRIDOR_GUARD = COPY_CORRIDOR_GUARDS.hybridEmberSignature;

  const PARTICLE_SPECIES = [
    {
      id: 'flowRibbon',
      label: 'Flow Ribbon',
      renderPath: 'ribbon',
      fallbackTier: 'desktop',
      range: 5.4,
      baseSize: 0.10,
      lifetime: { min: 920, max: 1500 },
      trailLength: 4,
      bloom: true,
      collisionMask: ['tools', 'title', 'floor'],
      colorRamp: ['#473119', '#d88d2c', '#fff0cc'],
      behavior: {
        stateEnvelope: { idle: 0.02, focus: 0.10, charged: 0.26, release: 1.08, recover: 0.08 },
        curl: 0.82,
        convection: 0.54,
        pointerWake: 0.16,
        entropy: 0.10,
        clump: 0.42,
        releaseSpread: 0.62,
        deflection: 1.34,
        opacity: 0.18,
        scale: 0.54,
        textGuard: 1.64,
      },
    },
    {
      id: 'cloudMote',
      label: 'Cloud Mote',
      renderPath: 'shader',
      fallbackTier: 'all',
      range: 6.6,
      baseSize: 0.072,
      lifetime: { min: 2400, max: 5200 },
      trailLength: 3,
      bloom: true,
      collisionMask: ['tools', 'title', 'floor'],
      colorRamp: ['#2d2014', '#c78e42', '#f4dfb7'],
      behavior: {
        stateEnvelope: { idle: 0.58, focus: 0.78, charged: 0.98, release: 1.08, recover: 0.74 },
        curl: 1.12,
        convection: 0.92,
        pointerWake: 0.18,
        entropy: 0.16,
        clump: 1.34,
        releaseSpread: 0.68,
        deflection: 1.26,
        opacity: 0.58,
        scale: 0.88,
        textGuard: 1.36,
      },
    },
    {
      id: 'microDust',
      label: 'Micro Dust',
      renderPath: 'shader',
      fallbackTier: 'desktop',
      range: 5.2,
      baseSize: 0.020,
      lifetime: { min: 1800, max: 3800 },
      trailLength: 2,
      bloom: false,
      collisionMask: ['tools', 'title'],
      colorRamp: ['#4b3825', '#dfb165', '#fff3d8'],
      behavior: {
        stateEnvelope: { idle: 0.44, focus: 0.70, charged: 0.92, release: 1.12, recover: 0.58 },
        curl: 1.02,
        convection: 0.46,
        pointerWake: 0.34,
        entropy: 0.12,
        clump: 0.42,
        releaseSpread: 0.74,
        deflection: 1.10,
        opacity: 0.26,
        scale: 0.72,
        textGuard: 1.30,
      },
    },
    {
      id: 'sparkFilament',
      label: 'Spark Filament',
      renderPath: 'points',
      fallbackTier: 'all',
      range: 4.2,
      baseSize: 0.018,
      lifetime: { min: 420, max: 760 },
      trailLength: 1,
      bloom: true,
      collisionMask: ['tools', 'floor'],
      colorRamp: ['#5d6f96', '#ffd08e', '#ffffff'],
      behavior: {
        stateEnvelope: { idle: 0.28, focus: 0.58, charged: 1.02, release: 1.42, recover: 0.52 },
        curl: 0.82,
        convection: 0.24,
        pointerWake: 0.30,
        entropy: 0.10,
        clump: 0.18,
        releaseSpread: 0.74,
        deflection: 1.18,
        opacity: 0.10,
        scale: 0.42,
        textGuard: 1.40,
      },
    },
  ];
  function getInitialSpeciesCounts() {
    if (_isLowEnd || SCENE_CONFIG.qualityTier === 'low') {
      return { ...SCENE_CONFIG.tiers.low.speciesCounts };
    }
    if (window.innerWidth < 480) {
      return { flowRibbon: 0, cloudMote: 120, microDust: 40, sparkFilament: 0 };
    }
    if (window.innerWidth < 768) {
      return { flowRibbon: 0, cloudMote: 180, microDust: 70, sparkFilament: 2 };
    }
    if (window.innerWidth < 1280) {
      return { flowRibbon: 1, cloudMote: 320, microDust: 120, sparkFilament: 4 };
    }
    return { flowRibbon: 2, cloudMote: 420, microDust: 170, sparkFilament: 6 };
  }
  const ACTIVE_SPECIES_COUNTS = getInitialSpeciesCounts();
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
  const DIRECTOR_STATE = {
    started: prefersReduced,
    startAt: prefersReduced ? performance.now() : null,
    phase: SCENE_DIRECTOR_STATE.preReveal,
    cameraState: SCENE_DIRECTOR_STATE.preReveal,
    heroFocusTool: HERO_FOCUS_TOOL,
    elapsedMs: prefersReduced ? SHOT_CONFIG.lockupEndMs : 0,
    revealMix: prefersReduced ? 1 : 0,
    lockupMix: prefersReduced ? 1 : 0,
    interactiveMix: prefersReduced ? 1 : 0,
    heroShadowIntensity: 0,
    contactShadowOpacity: 0,
  };
  let frozenDirectorPhase = SCENE_TEST_OVERRIDES.freezePhase || null;
  let directorFallbackTimer = null;
  let scrollHandoffState = 'idle';
  const HERO_TOOL_IDS = ['hammer', 'wrench', 'saw'];
  const toolAssetSource = {
    hammer: SUPPORT_PROPS_ACTIVE ? 'procedural' : 'disabled',
    wrench: 'pending',
    saw: SUPPORT_PROPS_ACTIVE ? 'pending' : 'disabled',
  };
  const toolAssetProfile = {
    hammer: SUPPORT_PROPS_ACTIVE ? 'procedural' : 'disabled',
    wrench: 'legacy',
    saw: SUPPORT_PROPS_ACTIVE ? 'legacy' : 'disabled',
  };
  const toolAssetFingerprint = { hammer: null, wrench: null, saw: null };
  let assetSetVersion = ACTIVE_ASSET_PROFILE.version;
  let assetContractVersion = ACTIVE_ASSET_PROFILE.contractVersion || 'unknown';
  let heroAssetVariant = ACTIVE_ASSET_PROFILE.variant || 'final';
  let heroAssetBuildStage = 'placeholder';
  let heroAssetVerificationState = 'manifest-unloaded';
  let heroAssetManifest = null;
  const heroAssetVerification = {
    manifestLoaded: false,
    packVerified: false,
    finalReady: false,
    manifestVariant: ACTIVE_ASSET_PROFILE.variant || 'final',
    manifestMatch: { hammer: false, wrench: false, saw: false },
    distinctFromLegacy: { hammer: false, wrench: false, saw: false },
  };
  const FINAL_HERO_PROVENANCE = new Set(['external-processed', 'bespoke-authored']);
  let shotBeat = ACTIVE_SHOT_BEATS.preReveal.label;
  let lightingCue = ACTIVE_LIGHTING_CUES.preReveal.label;
  let gradePreset = ACTIVE_LENS_FINISH.preReveal.label;
  const heroReadMetrics = {
    focalContrast: 0,
    supportSuppression: 0,
    copyCalm: 0,
    highlightSpill: 0,
  };
  const toolContrastMetrics = {
    hammer: 0,
    wrench: 0,
    saw: 0,
  };
  let gridLuminanceUnderCopy = 0;
  const particleStrokeCrossings = {
    total: 0,
    eyebrowZone: 0,
    headlineZone: 0,
    bodyZone: 0,
    ctaZone: 0,
    ctaStackZone: 0,
    trustRowZone: 0,
    scrollCueZone: 0,
  };
  let heroBacklightCoverage = 0;
  let heroShadowCoverage = 0;
  let heroHeadlineOverlapRatio = 0;
  let heroArtLaneOccupancy = 0;
  let worldCue = prefersReduced ? ACTIVE_WORLD_CUES.lockup.label : ACTIVE_WORLD_CUES.preReveal.label;
  const depthLayerMix = {
    total: 0,
    rearForge: 0,
    silhouettes: 0,
    occluders: 0,
    hangingDepth: 0,
    hazeLanes: 0,
  };
  let lensEvent = prefersReduced ? 'disabled' : 'idle';
  const worldReadMetrics = {
    backgroundSeparation: 0,
    copyContamination: 0,
    heroWorldBalance: 0,
  };
  let particleLongStrokeCount = 0;
  let particleRodCount = 0;
  let particleOutOfHeroLaneCount = 0;
  let ctaWakeActive = false;
  let ctaWakeStrength = 0;
  let ctaWakeEmissivePulse = 0;
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
  const activeForceFields = {
    windShear: 0,
    layeredCurl: 0,
    floorDrag: 0,
    wrenchAttractor: 0,
    vortexPair: 0,
    toolDeflectors: 0,
    copyRepeller: 0,
  };
  const toolInfluenceState = {
    hammer: 0,
    wrench: 0,
    saw: 0,
    heroOrbit: 0,
    copyRepeller: 0,
  };
  let particleCue = prefersReduced ? ACTIVE_PARTICLE_STORY.lockup.cue : ACTIVE_PARTICLE_STORY.preReveal.cue;
  let signatureCue = prefersReduced ? ACTIVE_PARTICLE_SIGNATURE.lockup.label : ACTIVE_PARTICLE_SIGNATURE.preReveal.label;
  let magicIntensity = prefersReduced ? ACTIVE_MAGIC_INTENSITY.lockup.base : 0;
  let releaseEnvelope = 0;
  let corridorEvacuation = 0;
  let heroEmberLevel = prefersReduced ? ACTIVE_PARTICLE_SIGNATURE.lockup.heroEmberBase : 0;
  let magicPulseStrength = 0;
  let magicPulsePeak = 0;
  let magicPulseStartAt = -Infinity;
  let magicPulseDurationMs = 720;
  let magicPulseSource = 'idle';
  let lastMagicPulseUpdateAt = performance.now();
  const externalSectionTransition = { state: 'idle', progress: 0, source: 'scene' };
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

  renderer.setPixelRatio(Math.min(window.devicePixelRatio, SCENE_CONFIG.qualityTier === 'desktop' ? 1.25 : 1.0));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.VSMShadowMap;  // Gaussian blur penumbra — smoother than PCFSoft
  renderer.outputEncoding      = THREE.sRGBEncoding;
  renderer.toneMapping         = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.26;

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

  if (window.__heroIntroStarted) {
    startSceneDirector(window.__heroIntroStartedAt || performance.now());
  } else {
    window.addEventListener('hero:intro-start', (event) => {
      startSceneDirector(event.detail?.startedAt || performance.now());
    }, { once: true });
  }
  window.addEventListener('hero:cta-wake', (event) => {
    const active = !!event.detail?.active;
    ctaWakeActive = active;
    if (active) {
      ctaWakeStrength = Math.max(ctaWakeStrength, 0.24);
      ctaWakeEmissivePulse = 0.62;
      queueMagicPulse({ strength: 0.14, durationMs: 940, source: 'cta-wake-material', anchorTool: 'wrench', sparkCount: 3 });
      markInteraction(0.03);
    }
  });
  window.addEventListener('hero:magic-pulse', (event) => {
    const detail = event.detail || {};
    queueMagicPulse({
      strength: clamp01(Number(detail.strength ?? 0.18)),
      durationMs: Number(detail.durationMs ?? 760),
      source: String(detail.source || 'external-pulse'),
      anchorTool: detail.anchorTool || HERO_FOCUS_TOOL,
      sparkCount: Number(detail.sparkCount ?? 6),
    });
  });
  window.addEventListener('hero:section-transition', (event) => {
    const detail = event.detail || {};
    externalSectionTransition.state = ['idle', 'compressing', 'handedOff'].includes(detail.state) ? detail.state : 'idle';
    externalSectionTransition.progress = clamp01(Number(detail.progress ?? 0));
    externalSectionTransition.source = String(detail.source || 'main');
  });

  let bootHealthy = false;
  let renderedFrameCount = 0;
  let assetMode = 'procedural';

  /* ─── Scene ───────────────────────────────────────────── */
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0b0d10);
  scene.fog = new THREE.FogExp2(0x141214, 0.026);

  function applyFallbackEnvironment() {
    const pmrem = new THREE.PMREMGenerator(renderer);
    pmrem.compileEquirectangularShader();

    const envCvs = document.createElement('canvas');
    envCvs.width = 1024;
    envCvs.height = 512;
    const ec = envCvs.getContext('2d');

    const skyGrad = ec.createLinearGradient(0, 0, 0, 256);
    skyGrad.addColorStop(0, '#181a1d');
    skyGrad.addColorStop(1, '#3a3026');
    ec.fillStyle = skyGrad;
    ec.fillRect(0, 0, 1024, 256);

    const flrGrad = ec.createLinearGradient(0, 256, 0, 512);
    flrGrad.addColorStop(0, '#4a3320');
    flrGrad.addColorStop(1, '#17110d');
    ec.fillStyle = flrGrad;
    ec.fillRect(0, 256, 1024, 256);

    const keySpot = ec.createRadialGradient(220, 156, 0, 220, 156, 300);
    keySpot.addColorStop(0, 'rgba(255,172,87,0.85)');
    keySpot.addColorStop(0.56, 'rgba(210,118,40,0.30)');
    keySpot.addColorStop(1, 'rgba(0,0,0,0)');
    ec.fillStyle = keySpot;
    ec.fillRect(0, 0, 1024, 512);

    const fillSpot = ec.createRadialGradient(816, 148, 0, 816, 148, 260);
    fillSpot.addColorStop(0, 'rgba(108,148,215,0.24)');
    fillSpot.addColorStop(1, 'rgba(0,0,0,0)');
    ec.fillStyle = fillSpot;
    ec.fillRect(0, 0, 1024, 512);

    const envTex = new THREE.CanvasTexture(envCvs);
    envTex.mapping = THREE.EquirectangularReflectionMapping;
    const envMap = pmrem.fromEquirectangular(envTex);
    scene.environment = envMap.texture;
    envTex.dispose();
    pmrem.dispose();
  }

  function loadWorkshopEnvironment() {
    if (typeof THREE.RGBELoader === 'undefined') {
      applyFallbackEnvironment();
      return;
    }

    const pmrem = new THREE.PMREMGenerator(renderer);
    pmrem.compileEquirectangularShader();
    const hdrLoader = new THREE.RGBELoader();
    hdrLoader.setDataType(THREE.UnsignedByteType);
    hdrLoader.load(
      HERO_RUNTIME_ASSETS.hdr,
      (texture) => {
        const envMap = pmrem.fromEquirectangular(texture);
        scene.environment = envMap.texture;
        texture.dispose();
        pmrem.dispose();
      },
      undefined,
      () => {
        pmrem.dispose();
        applyFallbackEnvironment();
      }
    );
  }

  loadWorkshopEnvironment();

  // Cinematic overlays — injected above canvas, below page content
  const vignetteStyle = document.createElement('style');
  vignetteStyle.textContent = `
    #scene-vignette {
      position:fixed; inset:0; pointer-events:none; z-index:1;
      will-change: filter;
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
    #scene-lens-accent {
      position: fixed;
      inset: 0;
      pointer-events: none;
      z-index: 1;
      opacity: 0;
      mix-blend-mode: screen;
      filter: blur(12px) saturate(118%);
      transform: scale(1.01);
      transition: opacity 140ms ease, transform 180ms ease;
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
      box-shadow: 0 22px 56px rgba(0,0,0,0.34), inset 0 0 0 1px rgba(241, 180, 88, 0.05) !important;
      clip-path: none;
      transform-origin: top left;
      will-change: left, top, transform, opacity;
    }
    #scene-orbit-debug {
      position: fixed;
      inset: 0;
      z-index: 7;
      pointer-events: none;
      opacity: ${SCENE_TEST_OVERRIDES.debug ? '1' : '0'};
      transition: opacity 180ms ease;
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
    @media print { #scene-vignette, #scene-grade, #scene-lens-accent, #scene-copy-shield, #scene-gesture-hint, #scene-charge-ring, #scene-orbit-debug { display:none !important; } }
    @media (max-width: 767px) {
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

  const sceneLensAccent = document.createElement('div');
  sceneLensAccent.id = 'scene-lens-accent';
  document.body.insertBefore(sceneLensAccent, sceneGrade.nextSibling);

  const sceneCAAccent = document.createElement('div');
  sceneCAAccent.id = 'scene-ca-accent';
  sceneCAAccent.style.cssText = 'position: fixed; inset: 0; pointer-events: none; z-index: 1; mix-blend-mode: overlay; opacity: 0; background: linear-gradient(to right, rgba(255, 140, 50, 0.15) 0%, transparent 50%, rgba(50, 120, 255, 0.15) 100%);';
  document.body.insertBefore(sceneCAAccent, sceneLensAccent.nextSibling);

  const copyShield = document.createElement('div');
  copyShield.id = 'scene-copy-shield';
  document.body.insertBefore(copyShield, sceneLensAccent.nextSibling);

  const gestureHint = document.createElement('div');
  gestureHint.id = 'scene-gesture-hint';
  gestureHint.textContent = 'Drag a tool or tap the dust field';
  document.body.appendChild(gestureHint);

  const chargeRing = document.createElement('div');
  chargeRing.id = 'scene-charge-ring';
  document.body.appendChild(chargeRing);
  const orbitDebug = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  orbitDebug.setAttribute('id', 'scene-orbit-debug');
  orbitDebug.setAttribute('viewBox', `0 0 ${window.innerWidth} ${window.innerHeight}`);
  orbitDebug.setAttribute('preserveAspectRatio', 'none');
  orbitDebug.innerHTML = `
    <ellipse id="orbit-debug-hammer" fill="none" stroke="rgba(133, 205, 255, 0.72)" stroke-width="1.5" stroke-dasharray="8 6" />
    <ellipse id="orbit-debug-saw" fill="none" stroke="rgba(255, 165, 104, 0.72)" stroke-width="1.5" stroke-dasharray="8 6" />
    <rect id="orbit-debug-readability" fill="none" stroke="rgba(255, 110, 110, 0.48)" stroke-width="1.25" stroke-dasharray="6 6" />
    <rect id="orbit-debug-hero-target" fill="rgba(245, 193, 110, 0.03)" stroke="rgba(245, 193, 110, 0.58)" stroke-width="1.2" stroke-dasharray="12 8" />
    <rect id="orbit-debug-backlight" fill="rgba(255, 198, 118, 0.05)" stroke="rgba(255, 198, 118, 0.60)" stroke-width="1.1" stroke-dasharray="10 6" />
    <rect id="orbit-debug-shadow" fill="rgba(26, 28, 35, 0.08)" stroke="rgba(124, 152, 208, 0.48)" stroke-width="1.0" stroke-dasharray="8 6" />
    <rect id="orbit-debug-emission-volume" fill="rgba(255, 148, 84, 0.03)" stroke="rgba(255, 148, 84, 0.54)" stroke-width="1.0" stroke-dasharray="6 6" />
    <rect id="orbit-debug-art-lane" fill="rgba(225, 171, 90, 0.05)" stroke="rgba(225, 171, 90, 0.44)" stroke-width="1.1" stroke-dasharray="10 8" />
    <rect id="orbit-debug-content-lane" fill="rgba(92, 132, 196, 0.04)" stroke="rgba(92, 132, 196, 0.44)" stroke-width="1.1" stroke-dasharray="10 8" />
    <rect id="orbit-debug-particle-exclusion" fill="rgba(255, 96, 96, 0.05)" stroke="rgba(255, 110, 110, 0.44)" stroke-width="1.0" stroke-dasharray="6 5" />
    <rect id="orbit-debug-grid-mask" fill="rgba(10, 14, 24, 0.10)" stroke="rgba(110, 145, 205, 0.36)" stroke-width="1.0" stroke-dasharray="4 8" />
    <rect id="orbit-debug-nav" fill="none" stroke="rgba(255, 110, 110, 0.48)" stroke-width="1.25" />
    <rect id="orbit-debug-zone-eyebrow" fill="none" stroke="rgba(244, 190, 82, 0.6)" stroke-width="1" />
    <rect id="orbit-debug-zone-headline" fill="none" stroke="rgba(255, 245, 232, 0.7)" stroke-width="1" />
    <rect id="orbit-debug-zone-headline-soft" fill="rgba(245, 193, 110, 0.06)" stroke="rgba(245, 193, 110, 0.64)" stroke-width="1" stroke-dasharray="5 5" />
    <rect id="orbit-debug-zone-body" fill="none" stroke="rgba(180, 201, 234, 0.62)" stroke-width="1" />
    <rect id="orbit-debug-zone-cta" fill="none" stroke="rgba(255, 168, 70, 0.72)" stroke-width="1" />
    <rect id="orbit-debug-zone-trust" fill="none" stroke="rgba(120, 208, 176, 0.62)" stroke-width="1" />
    <rect id="orbit-debug-zone-scroll" fill="none" stroke="rgba(160, 160, 160, 0.52)" stroke-width="1" />
    <rect id="orbit-debug-bounds-hammer" fill="none" stroke="rgba(255, 227, 176, 0.58)" stroke-width="1" />
    <rect id="orbit-debug-bounds-wrench" fill="none" stroke="rgba(245, 193, 110, 0.92)" stroke-width="1" />
    <rect id="orbit-debug-bounds-saw" fill="none" stroke="rgba(255, 227, 176, 0.58)" stroke-width="1" />
    <circle id="orbit-debug-anchor" r="4" fill="rgba(245, 193, 110, 0.92)" />
  `;
  document.body.appendChild(orbitDebug);

  /* ─── Camera ──────────────────────────────────────────── */
  const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 50);
  camera.position.set(0, 0, 6);
  const projectionScratch = new THREE.Vector3();
  const wrenchSeamAnchorScratch = new THREE.Vector3();
  const wrenchStoryAnchorScratch = new THREE.Vector3();
  const wrenchOrbitScratch = new THREE.Vector3();
  const wrenchPairScratchA = new THREE.Vector3();
  const wrenchPairScratchB = new THREE.Vector3();
  const layoutPlaneScratchA = new THREE.Vector3();
  const layoutPlaneScratchB = new THREE.Vector3();
  const layoutPlaneScratchC = new THREE.Vector3();
  const projectedBoundsBox = new THREE.Box3();
  const projectedBoundsSize = new THREE.Vector3();
  const projectedBoundsCenter = new THREE.Vector3();
  const projectedCornerScratch = new THREE.Vector3();
  const ORBIT_DEBUG_COLORS = Object.freeze({
    anchor: 'rgba(245, 193, 110, 0.92)',
    hammer: 'rgba(133, 205, 255, 0.72)',
    saw: 'rgba(255, 165, 104, 0.72)',
    bounds: 'rgba(255, 227, 176, 0.58)',
    safe: 'rgba(255, 110, 110, 0.48)',
  });
  const EMPTY_SCREEN_RECT = Object.freeze({ left: 0, top: 0, right: 0, bottom: 0, width: 0, height: 0, active: false });
  const PROTECTED_ZONE_KEYS = Object.freeze([
    'navZone',
    'topBarZone',
    'eyebrowZone',
    'headlineZone',
    'bodyZone',
    'ctaZone',
    'ctaStackZone',
    'trustRowZone',
    'scrollCueZone',
  ]);
  const zoneToolBooleans = () => ({ hammer: false, wrench: false, saw: false });
  const supportDisplayState = {
    hammer: { visible: false, reason: 'hidden-art-direction' },
    saw: { visible: false, reason: 'hidden-art-direction' },
  };
  const orbitLayoutState = {
    key: 'desktop',
    layout: ORBIT_LAYOUT_PRESETS.desktop,
    compositionMode: 'stillLifeDesktop',
    centerScreen: { x: 0, y: 0 },
    heroScreenHeightPx: window.innerHeight * ORBIT_LAYOUT_PRESETS.desktop.heroScreenHeightRatio,
    supportScreenHeights: {
      hammer: window.innerHeight * ORBIT_LAYOUT_PRESETS.desktop.heroScreenHeightRatio * ORBIT_LAYOUT_PRESETS.desktop.hammer.sizeRatio,
      saw: window.innerHeight * ORBIT_LAYOUT_PRESETS.desktop.heroScreenHeightRatio * ORBIT_LAYOUT_PRESETS.desktop.saw.sizeRatio,
    },
    supportAnglesDeg: { hammer: 42, saw: 222 },
    projectedToolBounds: {
      hammer: { left: 0, top: 0, right: 0, bottom: 0, width: 0, height: 0 },
      wrench: { left: 0, top: 0, right: 0, bottom: 0, width: 0, height: 0 },
      saw: { left: 0, top: 0, right: 0, bottom: 0, width: 0, height: 0 },
    },
    safeZoneViolations: {
      nav: { hammer: false, wrench: false, saw: false },
      readability: { hammer: false, wrench: false, saw: false },
      viewport: { hammer: false, wrench: false, saw: false },
    },
  };
  const protectedZoneState = {
    activeZoneKeys: [],
    zones: Object.fromEntries(PROTECTED_ZONE_KEYS.map((key) => [key, { ...EMPTY_SCREEN_RECT }])),
    artLane: { ...EMPTY_SCREEN_RECT },
    contentLane: { ...EMPTY_SCREEN_RECT },
    headlineSoftBand: { ...EMPTY_SCREEN_RECT },
    heroTargetFrame: { ...EMPTY_SCREEN_RECT },
    heroBacklightRect: { ...EMPTY_SCREEN_RECT },
    heroShadowRect: { ...EMPTY_SCREEN_RECT },
    particleEmissionRect: { ...EMPTY_SCREEN_RECT },
    particleExclusionLane: { ...EMPTY_SCREEN_RECT },
    gridMaskRect: { ...EMPTY_SCREEN_RECT },
    contentZoneIntrusions: zoneToolBooleans(),
    ctaLaneIntrusions: zoneToolBooleans(),
    trustRowIntrusions: zoneToolBooleans(),
    scrollCueIntrusions: zoneToolBooleans(),
    particleZoneIntrusions: {
      total: 0,
      headlineZone: 0,
      bodyZone: 0,
      ctaZone: 0,
      ctaStackZone: 0,
      trustRowZone: 0,
      scrollCueZone: 0,
    },
    mobileSupportState: {
      hammer: 'hidden-art-direction',
      saw: 'hidden-art-direction',
    },
  };
  const heroContent = document.querySelector('.hero__content');
  const heroEyebrow = document.querySelector('.hero__eyebrow');
  const heroTitle = document.querySelector('.hero__title');
  const heroSub = document.querySelector('.hero__sub');
  const heroCtas = document.querySelector('.hero__ctas');
  const heroTrust = document.querySelector('.hero__trust');
  const heroScrollCue = document.getElementById('scrollCue');

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
  const ambientLight = new THREE.AmbientLight(0x6d5a45, 0.22);
  scene.add(ambientLight);

  const keyLight = new THREE.RectAreaLight(0xffb25a, 1.68, 6.4, 5.0);
  keyLight.position.set(-5.0, 5.1, 6.6);
  keyLight.lookAt(2.3, 0.55, 1.5);
  scene.add(keyLight);

  const fillLight = new THREE.RectAreaLight(0x7ea4d8, 0.62, 4.2, 5.2);
  fillLight.position.set(6.0, 1.8, 3.4);
  fillLight.lookAt(2.7, 0.5, 1.4);
  scene.add(fillLight);

  const rimAreaLight = new THREE.RectAreaLight(0xc1d5f0, 0.68, 5.6, 2.0);
  rimAreaLight.position.set(2.8, 6.0, -3.6);
  rimAreaLight.lookAt(2.4, 0.6, 1.4);
  scene.add(rimAreaLight);

  const groundGlow = new THREE.PointLight(0xd27a2f, 0.42, 14);
  groundGlow.position.set(2.2, -2.10, 2.0);
  scene.add(groundGlow);

  const shadowRes = window.innerWidth < 768 ? 1024 : 2048;

  // ── HERO SHADOW LIGHT: dedicated shadow source for wrench grounding
  const heroShadowLight = new THREE.SpotLight(0xffe3b4, 1.62, 20, Math.PI / 7.2, 0.52, 1.0);
  heroShadowLight.position.set(3.6, 5.2, 6.0);
  heroShadowLight.target.position.set(2.5, -2.2, 1.4);
  heroShadowLight.castShadow = true;
  heroShadowLight.shadow.mapSize.width = shadowRes;
  heroShadowLight.shadow.mapSize.height = shadowRes;
  heroShadowLight.shadow.radius = 5.2;
  heroShadowLight.shadow.camera.near = 0.6;
  heroShadowLight.shadow.camera.far = 20;
  heroShadowLight.shadow.bias = -0.00042;
  scene.add(heroShadowLight);
  scene.add(heroShadowLight.target);

  // ── STATIC METAL ACCENT: warm amber point — keeps metals alive without flattening the scene
  const orbitLight = new THREE.PointLight(0xffb14a, 0.12, 16);
  orbitLight.castShadow = false; // VSM pass omitted — orbiting light shadow not visually significant; reduces GPU load during particle peaks
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

  function normalizeSha256(value) {
    return typeof value === 'string' ? value.trim().toLowerCase() : '';
  }

  async function digestSha256Hex(buffer) {
    if (!window.crypto?.subtle || !(buffer instanceof ArrayBuffer)) return '';
    const digest = await window.crypto.subtle.digest('SHA-256', buffer);
    return Array.from(new Uint8Array(digest)).map((part) => part.toString(16).padStart(2, '0')).join('');
  }

  async function fetchJsonSafe(url) {
    try {
      const response = await fetch(url, { cache: 'no-store' });
      if (!response.ok) return null;
      return response.json();
    } catch {
      return null;
    }
  }

  function getManifestToolEntry(toolId) {
    return heroAssetManifest?.tools?.[toolId] || null;
  }

  function computeHeroAssetBuildStage() {
    if (!heroAssetManifest) return 'placeholder';
    const primaryReady = REQUIRED_HERO_TOOL_IDS.every((toolId) => (
      toolAssetSource[toolId] === 'hero-glb' && heroAssetVerification.manifestMatch[toolId] === true
    ));
    if (primaryReady) {
      return heroAssetManifest.buildStage || 'hero-primary';
    }
    return heroAssetManifest.buildStage ? `${heroAssetManifest.buildStage}-fallback` : 'fallback';
  }

  function syncHeroAssetVerification() {
    assetContractVersion = heroAssetManifest?.contractVersion || ACTIVE_ASSET_PROFILE.contractVersion || 'unknown';
    heroAssetVerification.manifestLoaded = !!heroAssetManifest;
    heroAssetVerification.packVerified = false;
    heroAssetVerification.finalReady = false;
    heroAssetVerification.manifestVariant = heroAssetManifest?.variant || ACTIVE_ASSET_PROFILE.variant || 'final';

    HERO_TOOL_IDS.forEach((toolId) => {
      const manifestEntry = getManifestToolEntry(toolId);
      const actualHash = normalizeSha256(toolAssetFingerprint[toolId]);
      const manifestHash = normalizeSha256(manifestEntry?.sha256);
      const legacyHash = normalizeSha256(manifestEntry?.legacySha256);
      heroAssetVerification.manifestMatch[toolId] = !!actualHash && !!manifestHash && actualHash === manifestHash;
      heroAssetVerification.distinctFromLegacy[toolId] = legacyHash ? (!!actualHash && actualHash !== legacyHash) : !!actualHash;
    });
    heroAssetBuildStage = computeHeroAssetBuildStage();

    if (!heroAssetVerification.manifestLoaded) {
      heroAssetBuildStage = 'placeholder';
      heroAssetVerificationState = 'manifest-missing';
      return;
    }

    const requiredHeroAssetsLoaded = REQUIRED_HERO_TOOL_IDS.every((toolId) => toolAssetSource[toolId] === 'hero-glb');
    if (!requiredHeroAssetsLoaded) {
      heroAssetVerificationState = 'fallback';
      return;
    }

    const packVerified = REQUIRED_HERO_TOOL_IDS.every((toolId) => heroAssetVerification.manifestMatch[toolId]);
    heroAssetVerification.packVerified = packVerified;
    if (!packVerified) {
      heroAssetVerificationState = 'hash-mismatch';
      return;
    }

    const primaryManifestEntry = getManifestToolEntry(HERO_FOCUS_TOOL);
    const wantsFinalVariant = heroAssetVerification.manifestVariant === 'final'
      && FINAL_HERO_PROVENANCE.has(primaryManifestEntry?.provenance)
      && primaryManifestEntry?.heroRole === 'primary';
    const distinctFromLegacy = REQUIRED_HERO_TOOL_IDS.every((toolId) => heroAssetVerification.distinctFromLegacy[toolId]);
    heroAssetVerification.finalReady = wantsFinalVariant && distinctFromLegacy;
    if (wantsFinalVariant && !distinctFromLegacy) {
      heroAssetVerificationState = 'final-variant-invalid';
      return;
    }
    heroAssetVerificationState = heroAssetVerification.finalReady ? 'final-ready' : 'verified-primary';
  }

  async function loadGltfAsset(loader, url) {
    const response = await fetch(url, { cache: 'no-store' });
    if (!response.ok) {
      throw new Error(`Failed to load ${url}: ${response.status}`);
    }
    const buffer = await response.arrayBuffer();
    const fingerprint = await digestSha256Hex(buffer);
    const resourcePath = url.includes('/') ? url.slice(0, url.lastIndexOf('/') + 1) : '';
    const gltf = await new Promise((resolve, reject) => {
      loader.parse(buffer.slice(0), resourcePath, resolve, reject);
    });
    return { gltf, fingerprint, byteLength: buffer.byteLength };
  }

  function pulse(value, attack, decay) {
    return value < attack
      ? value / Math.max(attack, 0.0001)
      : Math.max(0, 1 - (value - attack) / Math.max(decay, 0.0001));
  }

  function getCompositionPresetKey() {
    if (SCENE_CONFIG.qualityTier === 'low') return 'low';
    if (window.innerWidth < 400) return 'narrow';
    if (window.innerWidth < 768) return 'mobile';
    if (window.innerWidth < 1024) return 'tablet';
    return 'desktop';
  }

  function getCompositionPreset() {
    return COMPOSITION_PRESETS[getCompositionPresetKey()] || COMPOSITION_PRESETS.desktop;
  }

  function getCameraTierKey() {
    if (SCENE_CONFIG.qualityTier === 'low') return 'low';
    if (window.innerWidth < 768) return 'mobile';
    return 'desktop';
  }

  function getOrbitLayoutPresetKey() {
    if (SCENE_CONFIG.qualityTier === 'low') return 'low';
    if (window.innerWidth < 400) return 'narrow';
    if (window.innerWidth < 768) return 'mobile';
    if (window.innerWidth < 1024) return 'tablet';
    return 'desktop';
  }

  function getDirectorPresetKey(phase = DIRECTOR_STATE.cameraState) {
    return DIRECTOR_PHASE_TO_PRESET[phase] || 'interactiveIdle';
  }

  function getShotPreset(phase = DIRECTOR_STATE.cameraState) {
    const tier = getCameraTierKey();
    const presetKey = getDirectorPresetKey(phase);
    return SHOT_CONFIG.camera[tier][presetKey] || SHOT_CONFIG.camera[tier].interactiveIdle;
  }

  function getLightRigPreset(phase = DIRECTOR_STATE.phase) {
    return LIGHT_RIG_PRESETS[getDirectorPresetKey(phase)] || LIGHT_RIG_PRESETS.interactiveIdle;
  }

  function getPostFxPreset(phase = DIRECTOR_STATE.phase) {
    return POST_FX_PRESETS[getDirectorPresetKey(phase)] || POST_FX_PRESETS.interactiveIdle;
  }

  function getCinematicFinishPreset() {
    return ACTIVE_CINEMATIC_FINISH;
  }

  function getShotBeatPreset(phase = DIRECTOR_STATE.phase) {
    return ACTIVE_SHOT_BEATS[getDirectorPresetKey(phase)] || ACTIVE_SHOT_BEATS.interactiveIdle;
  }

  function getLensFinishPreset(phase = DIRECTOR_STATE.phase) {
    return ACTIVE_LENS_FINISH[getDirectorPresetKey(phase)] || ACTIVE_LENS_FINISH.interactiveIdle;
  }

  function getLightingCuePreset(phase = DIRECTOR_STATE.phase) {
    return ACTIVE_LIGHTING_CUES[getDirectorPresetKey(phase)] || ACTIVE_LIGHTING_CUES.interactiveIdle;
  }

  function getWorldCuePreset(phase = DIRECTOR_STATE.phase) {
    return ACTIVE_WORLD_CUES[getDirectorPresetKey(phase)] || ACTIVE_WORLD_CUES.interactiveIdle;
  }

  function getEnvironmentDepthPreset(phase = DIRECTOR_STATE.phase) {
    return ACTIVE_ENVIRONMENT_DEPTH[getDirectorPresetKey(phase)] || ACTIVE_ENVIRONMENT_DEPTH.interactiveIdle;
  }

  function getParallaxLayerPreset() {
    return ACTIVE_PARALLAX_LAYERS;
  }

  function getLensEventPreset(phase = DIRECTOR_STATE.phase) {
    return ACTIVE_LENS_EVENTS[getDirectorPresetKey(phase)] || ACTIVE_LENS_EVENTS.interactiveIdle;
  }

  function getParticleStoryPreset(phase = DIRECTOR_STATE.phase) {
    return ACTIVE_PARTICLE_STORY[getDirectorPresetKey(phase)] || ACTIVE_PARTICLE_STORY.interactiveIdle;
  }

  function getMagicIntensityPreset(phase = DIRECTOR_STATE.phase) {
    return ACTIVE_MAGIC_INTENSITY[getDirectorPresetKey(phase)] || ACTIVE_MAGIC_INTENSITY.interactiveIdle;
  }

  function getLightScatterPreset(phase = DIRECTOR_STATE.phase) {
    return ACTIVE_LIGHT_SCATTER[getDirectorPresetKey(phase)] || ACTIVE_LIGHT_SCATTER.interactiveIdle;
  }

  function getEnvironmentCue() {
    return getWorldCuePreset(DIRECTOR_STATE.phase)?.label || worldCue || 'world-unknown';
  }

  function getInteractionCue() {
    if (dragTool) return 'drag-local-disturbance';
    if (magicPulseSource !== 'idle' && /click|touch|drag-release/.test(magicPulseSource)) return 'click-premium-pulse';
    if (hoveredTool || activePanelTool || ctaWakeActive) return 'hover-spec-awaken';
    if (scrollHandoffState !== 'idle') return `scroll-${scrollHandoffState}`;
    return `composed-${SCENE_STATE.interactionState}`;
  }

  function getPostFxMode() {
    const scatterMode = desktopFxState.active ? 'bloom-scatter' : 'bloom-base';
    const pulseMode = magicPulseSource !== 'idle' || /pulse-/.test(lensEvent) ? 'pulse' : 'steady';
    return `${scatterMode}-grade-${pulseMode}`;
  }

  function getParticleSignaturePreset(phase = DIRECTOR_STATE.phase) {
    return ACTIVE_PARTICLE_SIGNATURE[getDirectorPresetKey(phase)] || ACTIVE_PARTICLE_SIGNATURE.interactiveIdle;
  }

  function getReleaseEnvelopePreset(phase = DIRECTOR_STATE.phase) {
    return ACTIVE_RELEASE_ENVELOPE[getDirectorPresetKey(phase)] || ACTIVE_RELEASE_ENVELOPE.interactiveIdle;
  }

  function getVolumeShaftPreset(phase = DIRECTOR_STATE.phase) {
    return ACTIVE_VOLUME_SHAFT[getDirectorPresetKey(phase)] || ACTIVE_VOLUME_SHAFT.interactiveIdle;
  }

  function getToolLocalAnchor(group, x, y, z, target) {
    return group.localToWorld(target.set(x, y, z));
  }

  function isDirectorInteractive() {
    return prefersReduced || DIRECTOR_STATE.phase === SCENE_DIRECTOR_STATE.interactiveIdle || DIRECTOR_STATE.phase === SCENE_DIRECTOR_STATE.scrollTransition;
  }

  function getFrozenPhaseSnapshot(phase) {
    switch (phase) {
      case SCENE_DIRECTOR_STATE.staticLayout:
        return { elapsedMs: 2360, revealMix: 1, lockupMix: 1, interactiveMix: 0 };
      case SCENE_DIRECTOR_STATE.reveal:
        return { elapsedMs: 800, revealMix: 0.55, lockupMix: 0, interactiveMix: 0 };
      case SCENE_DIRECTOR_STATE.lockup:
        return { elapsedMs: 2440, revealMix: 1, lockupMix: 1, interactiveMix: 0 };
      case SCENE_DIRECTOR_STATE.interactiveIdle:
        return { elapsedMs: 2860, revealMix: 1, lockupMix: 1, interactiveMix: 0.85 };
      case SCENE_DIRECTOR_STATE.scrollTransition:
        return { elapsedMs: 3060, revealMix: 1, lockupMix: 1, interactiveMix: 1 };
      case SCENE_DIRECTOR_STATE.preReveal:
      default:
        return { elapsedMs: 140, revealMix: 0, lockupMix: 0, interactiveMix: 0 };
    }
  }

  function applyDirectorSnapshot(phase) {
    const snapshot = getFrozenPhaseSnapshot(phase);
    DIRECTOR_STATE.started = true;
    DIRECTOR_STATE.elapsedMs = snapshot.elapsedMs;
    DIRECTOR_STATE.phase = phase;
    DIRECTOR_STATE.cameraState = phase;
    DIRECTOR_STATE.revealMix = snapshot.revealMix;
    DIRECTOR_STATE.lockupMix = snapshot.lockupMix;
    DIRECTOR_STATE.interactiveMix = snapshot.interactiveMix;
  }

  function getEffectiveScrollProgress() {
    if (frozenDirectorPhase === SCENE_DIRECTOR_STATE.scrollTransition) {
      return Math.max(scrollProgress, SHOT_CONFIG.scrollTransitionStart + 0.12);
    }
    return frozenDirectorPhase ? 0 : scrollProgress;
  }

  function startSceneDirector(startAt) {
    if (DIRECTOR_STATE.started) return;
    DIRECTOR_STATE.started = true;
    DIRECTOR_STATE.startAt = startAt || performance.now();
    clearTimeout(directorFallbackTimer);
    directorFallbackTimer = null;
  }

  function restartSceneDirectorForTest(startAt = performance.now()) {
    DIRECTOR_STATE.started = false;
    DIRECTOR_STATE.startAt = null;
    DIRECTOR_STATE.elapsedMs = 0;
    DIRECTOR_STATE.phase = SCENE_DIRECTOR_STATE.preReveal;
    DIRECTOR_STATE.cameraState = SCENE_DIRECTOR_STATE.preReveal;
    DIRECTOR_STATE.revealMix = 0;
    DIRECTOR_STATE.lockupMix = 0;
    DIRECTOR_STATE.interactiveMix = 0;
    magicPulseStrength = 0;
    magicPulsePeak = 0;
    magicPulseSource = 'idle';
    magicPulseStartAt = Number.NEGATIVE_INFINITY;
    releaseEnvelope = 0;
    corridorEvacuation = 0;
    heroEmberLevel = prefersReduced ? ACTIVE_PARTICLE_SIGNATURE.lockup.heroEmberBase : 0;
    worldCue = prefersReduced ? ACTIVE_WORLD_CUES.lockup.label : ACTIVE_WORLD_CUES.preReveal.label;
    depthLayerMix.total = 0;
    depthLayerMix.rearForge = 0;
    depthLayerMix.silhouettes = 0;
    depthLayerMix.occluders = 0;
    depthLayerMix.hangingDepth = 0;
    lensEvent = prefersReduced ? 'disabled' : 'idle';
    worldReadMetrics.backgroundSeparation = 0;
    worldReadMetrics.copyContamination = 0;
    worldReadMetrics.heroWorldBalance = 0;
    clearTimeout(directorFallbackTimer);
    directorFallbackTimer = null;
    startSceneDirector(startAt);
  }

  function queueSceneDirectorFallback() {
    if (prefersReduced || DIRECTOR_STATE.started || directorFallbackTimer) return;
    directorFallbackTimer = setTimeout(() => {
      startSceneDirector(performance.now());
    }, SHOT_CONFIG.introFallbackMs);
  }

  function updateSceneDirector(nowMs) {
    if (frozenDirectorPhase) {
      applyDirectorSnapshot(frozenDirectorPhase);
      return;
    }

    if (!DIRECTOR_STATE.started || DIRECTOR_STATE.startAt === null) {
      DIRECTOR_STATE.elapsedMs = 0;
      DIRECTOR_STATE.phase = SCENE_DIRECTOR_STATE.preReveal;
      DIRECTOR_STATE.cameraState = SCENE_DIRECTOR_STATE.preReveal;
      DIRECTOR_STATE.revealMix = 0;
      DIRECTOR_STATE.lockupMix = 0;
      DIRECTOR_STATE.interactiveMix = 0;
      return;
    }

    const elapsed = Math.max(0, nowMs - DIRECTOR_STATE.startAt);
    DIRECTOR_STATE.elapsedMs = elapsed;
    DIRECTOR_STATE.revealMix = clamp01((elapsed - SHOT_CONFIG.preRevealEndMs) / (SHOT_CONFIG.revealEndMs - SHOT_CONFIG.preRevealEndMs));
    DIRECTOR_STATE.lockupMix = clamp01((elapsed - SHOT_CONFIG.revealEndMs) / (SHOT_CONFIG.lockupEndMs - SHOT_CONFIG.revealEndMs));
    DIRECTOR_STATE.interactiveMix = clamp01((elapsed - SHOT_CONFIG.lockupEndMs) / 700);

    let phase = SCENE_DIRECTOR_STATE.preReveal;
    if (getEffectiveScrollProgress() > SHOT_CONFIG.scrollTransitionStart) {
      phase = SCENE_DIRECTOR_STATE.scrollTransition;
    } else if (elapsed >= SHOT_CONFIG.lockupEndMs) {
      phase = SCENE_DIRECTOR_STATE.interactiveIdle;
    } else if (elapsed >= SHOT_CONFIG.revealEndMs) {
      phase = SCENE_DIRECTOR_STATE.lockup;
    } else if (elapsed >= SHOT_CONFIG.preRevealEndMs) {
      phase = SCENE_DIRECTOR_STATE.reveal;
    }

    const previousPhase = DIRECTOR_STATE.phase;
    DIRECTOR_STATE.phase = phase;
    DIRECTOR_STATE.cameraState = phase;
    if (phase !== previousPhase) {
      handleDirectorPhaseTransition(previousPhase, phase);
    }
  }

  function markInteraction(boost) {
    lastInteractionAt = performance.now();
    interactionCharge = Math.min(1, interactionCharge + boost);
    if (boost >= 0.05) hasSceneInteracted = true;
    gestureHint.classList.remove('visible');
  }

  function getWrenchStoryAnchor(target = wrenchSeamAnchorScratch) {
    const seamAnchor = getManifestToolEntry(HERO_FOCUS_TOOL)?.calibration?.seamAnchor;
    if (Array.isArray(seamAnchor) && seamAnchor.length === 3) {
      return getToolLocalAnchor(wrenchGroup, seamAnchor[0], seamAnchor[1], seamAnchor[2], target);
    }
    return getToolLocalAnchor(wrenchGroup, 0.12, 0.82, 0.11, target);
  }

  function queueMagicPulse(options = {}) {
    const {
      strength = 0.18,
      durationMs = 760,
      source = 'scene',
      anchorTool = HERO_FOCUS_TOOL,
      sparkCount = 6,
    } = options;
    const pulseStrength = clamp01(strength);
    magicPulseStartAt = performance.now();
    magicPulseDurationMs = Math.max(220, durationMs);
    magicPulsePeak = Math.max(magicPulsePeak * 0.72, pulseStrength);
    magicPulseSource = source;
    lastMagicPulseUpdateAt = magicPulseStartAt;

    if (!/director-/.test(source)) {
      markInteraction(Math.min(0.05, pulseStrength * 0.22));
    }

    if (!prefersReduced && sparkCount > 0) {
      const anchorGroup = anchorTool === 'hammer'
        ? hammerGroup
        : (anchorTool === 'saw' ? sawGroup : wrenchGroup);
      if (anchorGroup) {
        const anchor = anchorTool === 'wrench'
          ? getWrenchStoryAnchor()
          : getToolLocalAnchor(anchorGroup, 0, 0, 0.08, wrenchOrbitScratch);
        emitSparks(anchor.x, anchor.y, 0xffc070, sparkCount);
      }
    }
  }

  function updateMagicPulse(nowMs) {
    const dtMs = Math.min(96, Math.max(16, nowMs - lastMagicPulseUpdateAt));
    lastMagicPulseUpdateAt = nowMs;
    const attackLerp = 1 - Math.pow(0.82, dtMs / 16.6667);
    const decayLerp = 1 - Math.pow(0.88, dtMs / 16.6667);
    if (!isFinite(magicPulseStartAt) || nowMs < magicPulseStartAt) {
      magicPulseStrength *= Math.pow(0.92, dtMs / 16.6667);
      return;
    }
    const progress = clamp01((nowMs - magicPulseStartAt) / Math.max(1, magicPulseDurationMs));
    const target = progress >= 1
      ? 0
      : Math.sin(progress * Math.PI) * magicPulsePeak;
    magicPulseStrength += (target - magicPulseStrength) * (target > magicPulseStrength ? attackLerp : decayLerp);
    if (progress >= 1) {
      magicPulsePeak *= 0.66;
      if (magicPulsePeak < 0.03) {
        magicPulsePeak = 0;
        magicPulseSource = 'idle';
      }
    }
  }

  function handleDirectorPhaseTransition(previousPhase, nextPhase) {
    if (previousPhase === nextPhase) return;
    if (nextPhase === SCENE_DIRECTOR_STATE.reveal) {
      queueMagicPulse({ strength: 0.14, durationMs: 880, source: 'director-reveal', sparkCount: 0 });
    } else if (nextPhase === SCENE_DIRECTOR_STATE.lockup) {
      queueMagicPulse({ strength: 0.08, durationMs: 620, source: 'director-lockup', sparkCount: 0 });
    }
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
    return dragTool || activePanelTool || hoveredTool || (ctaWakeActive ? HERO_FOCUS_TOOL : null) || VORTEX_PARAMS.proximityTool || null;
  }

  function projectWorldToScreen(x, y, z = 0) {
    projectionScratch.set(x, y, z).project(camera);
    return {
      x: (projectionScratch.x + 1) * 0.5 * window.innerWidth,
      y: (-projectionScratch.y + 1) * 0.5 * window.innerHeight,
    };
  }

  function screenToPlanePoint(screenX, screenY, planeZ, target = layoutPlaneScratchA) {
    const ndcX = (screenX / window.innerWidth) * 2 - 1;
    const ndcY = -((screenY / window.innerHeight) * 2 - 1);
    projectionScratch.set(ndcX, ndcY, 0.5).unproject(camera);
    layoutPlaneScratchB.copy(projectionScratch).sub(camera.position);
    const dz = Math.abs(layoutPlaneScratchB.z) < 0.00001 ? (layoutPlaneScratchB.z >= 0 ? 0.00001 : -0.00001) : layoutPlaneScratchB.z;
    const t = (planeZ - camera.position.z) / dz;
    return target.copy(camera.position).addScaledVector(layoutPlaneScratchB, t);
  }

  function getManifestToolMaxDimension(toolId) {
    const dims = getManifestToolEntry(toolId)?.dimensions;
    if (!dims) return toolId === 'wrench' ? 2.2 : 2.0;
    return Math.max(dims.width || 0, dims.height || 0, dims.depth || 0, 0.001);
  }

  function getOrbitLayoutPreset() {
    const key = getOrbitLayoutPresetKey();
    return ORBIT_LAYOUT_PRESETS[key] || ORBIT_LAYOUT_PRESETS.desktop;
  }

  function getCompositionModeForKey(key = getOrbitLayoutPresetKey()) {
    if (key === 'desktop') return 'stillLifeDesktop';
    if (key === 'tablet') return 'tabletCluster';
    if (key === 'mobile') return 'crownMobile';
    if (key === 'narrow') return 'wrenchOnlyNarrow';
    if (window.innerWidth < 480) return 'wrenchOnlyNarrow';
    if (window.innerWidth < 768) return 'crownMobile';
    return 'tabletCluster';
  }

  function emptyScreenRect() {
    return { ...EMPTY_SCREEN_RECT };
  }

  function rectFromLTRB(left, top, right, bottom) {
    const normalizedLeft = Number.isFinite(left) ? left : 0;
    const normalizedTop = Number.isFinite(top) ? top : 0;
    const normalizedRight = Number.isFinite(right) ? right : normalizedLeft;
    const normalizedBottom = Number.isFinite(bottom) ? bottom : normalizedTop;
    return {
      left: normalizedLeft,
      top: normalizedTop,
      right: normalizedRight,
      bottom: normalizedBottom,
      width: Math.max(0, normalizedRight - normalizedLeft),
      height: Math.max(0, normalizedBottom - normalizedTop),
      active: normalizedRight > normalizedLeft && normalizedBottom > normalizedTop,
    };
  }

  function expandScreenRect(rect, padX = 0, padY = padX) {
    if (!rect || !Number.isFinite(rect.width) || rect.width <= 0 || !Number.isFinite(rect.height) || rect.height <= 0) {
      return emptyScreenRect();
    }
    return rectFromLTRB(
      Math.max(0, rect.left - padX),
      Math.max(0, rect.top - padY),
      Math.min(window.innerWidth, rect.right + padX),
      Math.min(window.innerHeight, rect.bottom + padY)
    );
  }

  function unionScreenRects(rects) {
    const activeRects = rects.filter((rect) => rect && rect.active && rect.width > 0 && rect.height > 0);
    if (!activeRects.length) return emptyScreenRect();
    return rectFromLTRB(
      Math.min(...activeRects.map((rect) => rect.left)),
      Math.min(...activeRects.map((rect) => rect.top)),
      Math.max(...activeRects.map((rect) => rect.right)),
      Math.max(...activeRects.map((rect) => rect.bottom))
    );
  }

  function rectFromNode(node, padX = 0, padY = padX) {
    if (!node) return emptyScreenRect();
    const rect = node.getBoundingClientRect();
    return expandScreenRect({
      left: rect.left,
      top: rect.top,
      right: rect.right,
      bottom: rect.bottom,
      width: rect.width,
      height: rect.height,
      active: rect.width > 0 && rect.height > 0,
    }, padX, padY);
  }

  function rectFromRatios(spec) {
    if (!spec) return emptyScreenRect();
    return rectFromLTRB(
      window.innerWidth * spec.left,
      window.innerHeight * spec.top,
      window.innerWidth * spec.right,
      window.innerHeight * spec.bottom
    );
  }

  function rectContainsRect(outer, inner, padding = 0) {
    if (!outer?.active || !inner?.width || !inner?.height) return false;
    return inner.left >= outer.left + padding
      && inner.top >= outer.top + padding
      && inner.right <= outer.right - padding
      && inner.bottom <= outer.bottom - padding;
  }

  function getOrbitAssemblyProgress() {
    if (prefersReduced || frozenDirectorPhase === SCENE_DIRECTOR_STATE.staticLayout) return 1;
    if (DIRECTOR_STATE.phase === SCENE_DIRECTOR_STATE.preReveal) return 0;
    if (DIRECTOR_STATE.phase === SCENE_DIRECTOR_STATE.reveal) {
      return clamp01((DIRECTOR_STATE.elapsedMs - SHOT_CONFIG.preRevealEndMs) / Math.max(1, SHOT_CONFIG.revealEndMs - SHOT_CONFIG.preRevealEndMs));
    }
    return 1;
  }

  function resolveScaleForScreenHeight(toolId, screenX, screenY, screenHeightPx, planeZ) {
    const top = screenToPlanePoint(screenX, screenY - screenHeightPx * 0.5, planeZ, layoutPlaneScratchA);
    const bottom = screenToPlanePoint(screenX, screenY + screenHeightPx * 0.5, planeZ, layoutPlaneScratchB);
    const worldSpan = top.distanceTo(bottom);
    return worldSpan / getManifestToolMaxDimension(toolId);
  }

  function resolveOrbitLayoutSnapshot(nowMs = performance.now()) {
    const layout = getOrbitLayoutPreset();
    const compositionMode = getCompositionModeForKey(getOrbitLayoutPresetKey());
    const centerScreen = {
      x: window.innerWidth * layout.anchor.x,
      y: window.innerHeight * layout.anchor.y,
    };
    const assemblyProgress = getOrbitAssemblyProgress();
    const orbitEnergy = 0;
    const supportWidthBoost = 0;
    const heroScreenHeightPx = window.innerHeight * layout.heroScreenHeightRatio;
    const centerWorld = screenToPlanePoint(centerScreen.x, centerScreen.y, layout.heroPlaneZ, layoutPlaneScratchA).clone();
    const heroScale = layout.heroScale;
    const support = {};
    const sharedOrbitDriftDeg = orbitEnergy * ((nowMs * 0.001) * THREE.MathUtils.radToDeg(layout.hammer.angularVelocity));
    const sharedPhaseOffsetDeg = (VORTEX_PARAMS.proximityStrength || 0) * (compositionMode === 'stillLifeDesktop' ? 4 : 2.2) + (dragTool ? 2 : 0);
    const hammerAngleDeg = layout.hammer.angleDeg
      + layout.hammer.revealAngleOffset * (1 - assemblyProgress)
      + sharedOrbitDriftDeg
      + sharedPhaseOffsetDeg;
    const supportSeparationDeg = (layout.saw.angleDeg - layout.hammer.angleDeg)
      + (layout.saw.revealAngleOffset - layout.hammer.revealAngleOffset) * (1 - assemblyProgress);
    const supportAnglesDeg = {
      hammer: hammerAngleDeg,
      saw: hammerAngleDeg + supportSeparationDeg,
    };

    ['hammer', 'saw'].forEach((toolId) => {
      const supportLayout = layout[toolId];
      const supportPlaneZ = layout.heroPlaneZ + supportLayout.zOffset;
      const radiusScale = THREE.MathUtils.lerp(1.18 + supportWidthBoost, 1.0 + supportWidthBoost, assemblyProgress);
      const orbitAngleDeg = supportAnglesDeg[toolId];
      const orbitAngleRad = THREE.MathUtils.degToRad(orbitAngleDeg);
      const planeCenter = screenToPlanePoint(centerScreen.x, centerScreen.y, supportPlaneZ, layoutPlaneScratchA).clone();
      const xVec = screenToPlanePoint(centerScreen.x + supportLayout.radiusPx.x * radiusScale, centerScreen.y, supportPlaneZ, layoutPlaneScratchB).sub(planeCenter);
      const yVec = screenToPlanePoint(centerScreen.x, centerScreen.y - supportLayout.radiusPx.y * radiusScale, supportPlaneZ, layoutPlaneScratchC).sub(planeCenter);
      const opacityLift = toolId === 'saw' && layout === ORBIT_LAYOUT_PRESETS.narrow && DIRECTOR_STATE.phase === SCENE_DIRECTOR_STATE.interactiveIdle
        ? 1
        : supportLayout.opacity;
      support[toolId] = {
        planeZ: supportPlaneZ,
        angleDeg: orbitAngleDeg,
        position: planeCenter.clone()
          .addScaledVector(xVec, Math.cos(orbitAngleRad))
          .addScaledVector(yVec, Math.sin(orbitAngleRad)),
        scale: supportLayout.scale,
        opacity: opacityLift * assemblyProgress,
      };
    });

    orbitLayoutState.key = getOrbitLayoutPresetKey();
    orbitLayoutState.layout = layout;
    orbitLayoutState.compositionMode = compositionMode;
    orbitLayoutState.centerScreen = centerScreen;
    orbitLayoutState.heroScreenHeightPx = heroScreenHeightPx;
    orbitLayoutState.supportScreenHeights = {
      hammer: heroScreenHeightPx * layout.hammer.sizeRatio,
      saw: heroScreenHeightPx * layout.saw.sizeRatio,
    };
    orbitLayoutState.supportAnglesDeg = {
      hammer: Number(support.hammer.angleDeg.toFixed(3)),
      saw: Number(support.saw.angleDeg.toFixed(3)),
    };

    return {
      layout,
      centerScreen,
      centerWorld,
      heroScale,
      heroScreenHeightPx,
      supportAnglesDeg: { ...orbitLayoutState.supportAnglesDeg },
      support,
    };
  }

  function getProjectedBoundsForObject(object3D) {
    if (!object3D) {
      return { left: 0, top: 0, right: 0, bottom: 0, width: 0, height: 0 };
    }
    object3D.updateWorldMatrix(true, true);
    projectedBoundsBox.setFromObject(object3D);
    if (projectedBoundsBox.isEmpty()) {
      return { left: 0, top: 0, right: 0, bottom: 0, width: 0, height: 0 };
    }
    const { min, max } = projectedBoundsBox;
    const corners = [
      [min.x, min.y, min.z],
      [min.x, min.y, max.z],
      [min.x, max.y, min.z],
      [min.x, max.y, max.z],
      [max.x, min.y, min.z],
      [max.x, min.y, max.z],
      [max.x, max.y, min.z],
      [max.x, max.y, max.z],
    ];
    let left = Number.POSITIVE_INFINITY;
    let top = Number.POSITIVE_INFINITY;
    let right = Number.NEGATIVE_INFINITY;
    let bottom = Number.NEGATIVE_INFINITY;

    for (const [x, y, z] of corners) {
      projectedCornerScratch.set(x, y, z).project(camera);
      if (!Number.isFinite(projectedCornerScratch.x) || !Number.isFinite(projectedCornerScratch.y)) continue;
      const screenX = (projectedCornerScratch.x + 1) * 0.5 * window.innerWidth;
      const screenY = (-projectedCornerScratch.y + 1) * 0.5 * window.innerHeight;
      left = Math.min(left, screenX);
      top = Math.min(top, screenY);
      right = Math.max(right, screenX);
      bottom = Math.max(bottom, screenY);
    }

    if (!Number.isFinite(left) || !Number.isFinite(top) || !Number.isFinite(right) || !Number.isFinite(bottom)) {
      return { left: 0, top: 0, right: 0, bottom: 0, width: 0, height: 0 };
    }
    left -= 6;
    top -= 6;
    right += 6;
    bottom += 6;
    return {
      left,
      top,
      right,
      bottom,
      width: Math.max(0, right - left),
      height: Math.max(0, bottom - top),
    };
  }

  function getProjectedBoundsForTool(toolId) {
    return getProjectedBoundsForObject(getToolGroup(toolId));
  }

  function getNavSafeZoneRect() {
    const navParts = [
      document.querySelector('.nav__brand'),
      document.querySelector('.nav__links'),
      document.querySelector('.nav__cta'),
    ]
      .filter(Boolean)
      .map((node) => node.getBoundingClientRect())
      .filter((rect) => rect.width > 0 && rect.height > 0);
    if (!navParts.length) {
      const navEl = document.querySelector('.nav__inner') || document.getElementById('nav');
      return expandScreenRect(navEl?.getBoundingClientRect?.() || null, 8, 14);
    }
    return expandScreenRect(unionScreenRects(navParts.map((rect) => ({
      left: rect.left,
      top: rect.top,
      right: rect.right,
      bottom: rect.bottom,
      width: rect.width,
      height: rect.height,
      active: true,
    }))), 8, 14);
  }

  function intersectsScreenRect(a, b, padding = 0) {
    if (!a?.width || !a?.height || !b?.width || !b?.height) return false;
    return !(a.right < b.left - padding || a.left > b.right + padding || a.bottom < b.top - padding || a.top > b.bottom + padding);
  }

  function getCompositionLanePreset(layoutKey = getOrbitLayoutPresetKey()) {
    return COMPOSITION_LANE_PRESETS[layoutKey] || COMPOSITION_LANE_PRESETS.desktop;
  }

  function getProtectedZonePadding(layoutKey = getOrbitLayoutPresetKey()) {
    if (layoutKey === 'mobile' || layoutKey === 'narrow' || layoutKey === 'low') {
      return {
        eyebrow: { x: 18, y: 12 },
        headline: { x: 18, y: 16 },
        body: { x: 18, y: 16 },
        cta: { x: 20, y: 16 },
        trust: { x: 16, y: 14 },
        scroll: { x: 16, y: 14 },
      };
    }
    return {
      eyebrow: { x: 24, y: 12 },
      headline: { x: 24, y: 18 },
      body: { x: 24, y: 18 },
      cta: { x: 20, y: 16 },
      trust: { x: 18, y: 14 },
      scroll: { x: 16, y: 14 },
    };
  }

  function updateProtectedZones() {
    const layoutKey = getOrbitLayoutPresetKey();
    const lanePreset = getCompositionLanePreset(layoutKey);
    const layout = getOrbitLayoutPreset();
    const padding = getProtectedZonePadding(layoutKey);
    const navRect = getNavSafeZoneRect();
    const isMobileComposition = layoutKey === 'mobile' || layoutKey === 'narrow' || layoutKey === 'low';
    const rawHeadlineRect = rectFromNode(heroTitle, 0, 0);

    protectedZoneState.zones.navZone = navRect;
    protectedZoneState.zones.topBarZone = isMobileComposition ? expandScreenRect(navRect, 8, 10) : emptyScreenRect();
    protectedZoneState.zones.eyebrowZone = rectFromNode(heroEyebrow, padding.eyebrow.x, padding.eyebrow.y);
    protectedZoneState.zones.headlineZone = rectFromNode(heroTitle, padding.headline.x, padding.headline.y);
    protectedZoneState.zones.bodyZone = rectFromNode(heroSub, padding.body.x, padding.body.y);
    protectedZoneState.zones.ctaZone = !isMobileComposition ? rectFromNode(heroCtas, padding.cta.x, padding.cta.y) : emptyScreenRect();
    protectedZoneState.zones.ctaStackZone = isMobileComposition ? rectFromNode(heroCtas, padding.cta.x, padding.cta.y) : emptyScreenRect();
    protectedZoneState.zones.trustRowZone = rectFromNode(heroTrust, padding.trust.x, padding.trust.y);
    protectedZoneState.zones.scrollCueZone = rectFromNode(heroScrollCue, padding.scroll.x, padding.scroll.y);
    protectedZoneState.artLane = rectFromRatios(lanePreset.artLane);
    protectedZoneState.contentLane = unionScreenRects([
      rectFromRatios(lanePreset.contentLane),
      protectedZoneState.zones.eyebrowZone,
      protectedZoneState.zones.headlineZone,
      protectedZoneState.zones.bodyZone,
      isMobileComposition ? protectedZoneState.zones.ctaStackZone : protectedZoneState.zones.ctaZone,
      protectedZoneState.zones.trustRowZone,
    ]);
    protectedZoneState.particleExclusionLane = unionScreenRects([
      protectedZoneState.zones.headlineZone,
      protectedZoneState.zones.bodyZone,
      isMobileComposition ? protectedZoneState.zones.ctaStackZone : protectedZoneState.zones.ctaZone,
      protectedZoneState.zones.trustRowZone,
    ]);
    protectedZoneState.headlineSoftBand = !isMobileComposition && rawHeadlineRect.active
      ? rectFromLTRB(
          rawHeadlineRect.right - rawHeadlineRect.width * 0.18,
          rawHeadlineRect.top,
          rawHeadlineRect.right,
          rawHeadlineRect.bottom
        )
      : emptyScreenRect();
    protectedZoneState.gridMaskRect = unionScreenRects([
      protectedZoneState.contentLane,
      isMobileComposition ? protectedZoneState.zones.trustRowZone : emptyScreenRect(),
    ]);
    protectedZoneState.heroTargetFrame = isMobileComposition
      ? expandScreenRect(protectedZoneState.artLane, -16, -16)
      : {
          left: Math.round(window.innerWidth * lanePreset.artLane.left),
          top: Math.round(window.innerHeight * layout.heroMargins.top),
          right: Math.round(window.innerWidth * (1 - layout.heroMargins.right)),
          bottom: Math.round(window.innerHeight * (1 - layout.heroMargins.bottom)),
          width: Math.max(0, Math.round(window.innerWidth * (1 - layout.heroMargins.right) - window.innerWidth * lanePreset.artLane.left)),
          height: Math.max(0, Math.round(window.innerHeight * (1 - layout.heroMargins.bottom) - window.innerHeight * layout.heroMargins.top)),
          active: true,
        };
    protectedZoneState.activeZoneKeys = PROTECTED_ZONE_KEYS.filter((key) => protectedZoneState.zones[key]?.active);
  }

  function getRelevantProtectedZoneRects() {
    const compositionMode = orbitLayoutState.compositionMode || getCompositionModeForKey();
    const zoneKeys = compositionMode === 'stillLifeDesktop' || compositionMode === 'tabletCluster'
      ? ['navZone', 'eyebrowZone', 'headlineZone', 'bodyZone', 'ctaZone']
      : ['topBarZone', 'eyebrowZone', 'headlineZone', 'bodyZone', 'ctaStackZone', 'trustRowZone', 'scrollCueZone'];
    return zoneKeys
      .map((key) => [key, protectedZoneState.zones[key] || emptyScreenRect()])
      .filter(([, rect]) => rect.active);
  }

  function isDesktopLikeComposition() {
    const compositionMode = orbitLayoutState.compositionMode || getCompositionModeForKey();
    return compositionMode === 'stillLifeDesktop' || compositionMode === 'tabletCluster';
  }

  function getHeroHeadlineOverlapMetrics(rect) {
    const collisionRect = getHeroCollisionRect(rect);
    const headlineZone = protectedZoneState.zones.headlineZone;
    const softBand = protectedZoneState.headlineSoftBand;
    if (!collisionRect?.width || !collisionRect?.height || !headlineZone?.active || !softBand?.active || !isDesktopLikeComposition()) {
      return {
        softRatio: 0,
        softOverlapArea: 0,
        disallowedOverlapArea: 0,
      };
    }
    const headlineOverlapArea = overlapArea(collisionRect, headlineZone);
    const softOverlapArea = overlapArea(collisionRect, softBand);
    return {
      softRatio: softOverlapArea / Math.max(1, headlineZone.width * headlineZone.height),
      softBandFillRatio: softOverlapArea / Math.max(1, softBand.width * softBand.height),
      softOverlapArea,
      disallowedOverlapArea: Math.max(0, headlineOverlapArea - softOverlapArea),
    };
  }

  function getHeroCollisionRect(rect) {
    if (!rect?.width || !rect?.height) return rect || EMPTY_SCREEN_RECT;
    return rectFromLTRB(
      rect.left + rect.width * 0.24,
      rect.top + rect.height * 0.04,
      rect.right - rect.width * 0.22,
      rect.bottom - rect.height * 0.08
    );
  }

  function hasReadableIntrusion(toolId, rect) {
    if (!rect?.width || !rect?.height) return false;
    const collisionRect = toolId === HERO_FOCUS_TOOL ? getHeroCollisionRect(rect) : rect;
    const relevantZones = getRelevantProtectedZoneRects();
    const isHero = toolId === HERO_FOCUS_TOOL;
    const headlineMetrics = isHero ? getHeroHeadlineOverlapMetrics(rect) : null;
    for (const [key, zone] of relevantZones) {
      if (!zone?.active) continue;
      const overlap = overlapArea(collisionRect, zone);
      if (overlap <= 0) continue;
      if (isHero && key === 'headlineZone' && isDesktopLikeComposition()) {
        if ((headlineMetrics?.disallowedOverlapArea || 0) > 1) return true;
        if ((headlineMetrics?.softBandFillRatio || 0) > 0.92) return true;
        continue;
      }
      return true;
    }
    return false;
  }

  function hasContentLaneIntrusion(toolId, rect) {
    if (!rect?.width || !rect?.height || !protectedZoneState.contentLane.active) return false;
    const collisionRect = toolId === HERO_FOCUS_TOOL ? getHeroCollisionRect(rect) : rect;
    if (!intersectsScreenRect(collisionRect, protectedZoneState.contentLane, 0)) return false;
    if (toolId !== HERO_FOCUS_TOOL || !isDesktopLikeComposition()) return true;
    return hasReadableIntrusion(toolId, rect);
  }

  function updateOrbitDiagnostics() {
    const navSafeZone = getNavSafeZoneRect();
    const readabilityRect = expandScreenRect(readabilityWindow, 24, 24);
    const relevantZones = Object.fromEntries(getRelevantProtectedZoneRects());
    protectedZoneState.contentZoneIntrusions = zoneToolBooleans();
    protectedZoneState.ctaLaneIntrusions = zoneToolBooleans();
    protectedZoneState.trustRowIntrusions = zoneToolBooleans();
    protectedZoneState.scrollCueIntrusions = zoneToolBooleans();

    HERO_TOOL_IDS.forEach((toolId) => {
      const rect = getProjectedBoundsForTool(toolId);
      const collisionRect = toolId === HERO_FOCUS_TOOL ? getHeroCollisionRect(rect) : rect;
      const isVisibleTool = toolId === HERO_FOCUS_TOOL
        ? true
        : !!supportDisplayState[toolId]?.visible;
      orbitLayoutState.projectedToolBounds[toolId] = rect;
      orbitLayoutState.safeZoneViolations.nav[toolId] = isVisibleTool && intersectsScreenRect(rect, navSafeZone, 0);
      orbitLayoutState.safeZoneViolations.readability[toolId] = isVisibleTool
        && readabilityWindow.active
        && intersectsScreenRect(collisionRect, readabilityRect, 0)
        && hasReadableIntrusion(toolId, rect);
      orbitLayoutState.safeZoneViolations.viewport[toolId] = isVisibleTool && (rect.left < 0 || rect.top < 0 || rect.right > window.innerWidth || rect.bottom > window.innerHeight);
      protectedZoneState.contentZoneIntrusions[toolId] = isVisibleTool && hasContentLaneIntrusion(toolId, rect);
      protectedZoneState.ctaLaneIntrusions[toolId] = isVisibleTool
        && Object.entries(relevantZones).some(
          ([key, zone]) => /cta/i.test(key) && overlapArea(collisionRect, zone) > Math.max(3200, collisionRect.width * collisionRect.height * (toolId === HERO_FOCUS_TOOL && isDesktopLikeComposition() ? 0.18 : 0.08))
        );
      protectedZoneState.trustRowIntrusions[toolId] = isVisibleTool
        && overlapArea(collisionRect, protectedZoneState.zones.trustRowZone) > Math.max(1400, collisionRect.width * collisionRect.height * 0.05);
      protectedZoneState.scrollCueIntrusions[toolId] = isVisibleTool
        && overlapArea(collisionRect, protectedZoneState.zones.scrollCueZone) > Math.max(900, collisionRect.width * collisionRect.height * 0.04);
    });
  }

  function applyRectAttributes(node, rect) {
    if (!node) return;
    node.setAttribute('x', rect.left);
    node.setAttribute('y', rect.top);
    node.setAttribute('width', Math.max(0, rect.width));
    node.setAttribute('height', Math.max(0, rect.height));
  }

  function updateOrbitDebugOverlay() {
    if (!SCENE_TEST_OVERRIDES.debug || !orbitDebug) return;
    orbitDebug.setAttribute('viewBox', `0 0 ${window.innerWidth} ${window.innerHeight}`);
    orbitDebug.setAttribute('width', window.innerWidth);
    orbitDebug.setAttribute('height', window.innerHeight);
    const layout = orbitLayoutState.layout;
    const anchor = orbitLayoutState.centerScreen;
    const hammerEllipse = orbitDebug.querySelector('#orbit-debug-hammer');
    const sawEllipse = orbitDebug.querySelector('#orbit-debug-saw');
    const anchorNode = orbitDebug.querySelector('#orbit-debug-anchor');
    const readabilityNode = orbitDebug.querySelector('#orbit-debug-readability');
    const heroTargetNode = orbitDebug.querySelector('#orbit-debug-hero-target');
    const backlightNode = orbitDebug.querySelector('#orbit-debug-backlight');
    const shadowNode = orbitDebug.querySelector('#orbit-debug-shadow');
    const emissionNode = orbitDebug.querySelector('#orbit-debug-emission-volume');
    const artLaneNode = orbitDebug.querySelector('#orbit-debug-art-lane');
    const contentLaneNode = orbitDebug.querySelector('#orbit-debug-content-lane');
    const particleExclusionNode = orbitDebug.querySelector('#orbit-debug-particle-exclusion');
    const gridMaskNode = orbitDebug.querySelector('#orbit-debug-grid-mask');
    const navNode = orbitDebug.querySelector('#orbit-debug-nav');
    const eyebrowNode = orbitDebug.querySelector('#orbit-debug-zone-eyebrow');
    const headlineNode = orbitDebug.querySelector('#orbit-debug-zone-headline');
    const headlineSoftNode = orbitDebug.querySelector('#orbit-debug-zone-headline-soft');
    const bodyNode = orbitDebug.querySelector('#orbit-debug-zone-body');
    const ctaNode = orbitDebug.querySelector('#orbit-debug-zone-cta');
    const trustNode = orbitDebug.querySelector('#orbit-debug-zone-trust');
    const scrollNode = orbitDebug.querySelector('#orbit-debug-zone-scroll');
    const hammerBounds = orbitDebug.querySelector('#orbit-debug-bounds-hammer');
    const wrenchBounds = orbitDebug.querySelector('#orbit-debug-bounds-wrench');
    const sawBounds = orbitDebug.querySelector('#orbit-debug-bounds-saw');
    if (hammerEllipse) {
      hammerEllipse.setAttribute('cx', anchor.x);
      hammerEllipse.setAttribute('cy', anchor.y);
      hammerEllipse.setAttribute('rx', layout.hammer.radiusPx.x);
      hammerEllipse.setAttribute('ry', layout.hammer.radiusPx.y);
    }
    if (sawEllipse) {
      sawEllipse.setAttribute('cx', anchor.x);
      sawEllipse.setAttribute('cy', anchor.y);
      sawEllipse.setAttribute('rx', layout.saw.radiusPx.x);
      sawEllipse.setAttribute('ry', layout.saw.radiusPx.y);
    }
    if (anchorNode) {
      anchorNode.setAttribute('cx', anchor.x);
      anchorNode.setAttribute('cy', anchor.y);
    }
    applyRectAttributes(readabilityNode, {
      left: readabilityWindow.left,
      top: readabilityWindow.top,
      width: readabilityWindow.width,
      height: readabilityWindow.height,
    });
    applyRectAttributes(heroTargetNode, protectedZoneState.heroTargetFrame);
    applyRectAttributes(backlightNode, protectedZoneState.heroBacklightRect || EMPTY_SCREEN_RECT);
    applyRectAttributes(shadowNode, protectedZoneState.heroShadowRect || EMPTY_SCREEN_RECT);
    applyRectAttributes(emissionNode, protectedZoneState.particleEmissionRect || EMPTY_SCREEN_RECT);
    applyRectAttributes(artLaneNode, protectedZoneState.artLane);
    applyRectAttributes(contentLaneNode, protectedZoneState.contentLane);
    applyRectAttributes(particleExclusionNode, protectedZoneState.particleExclusionLane);
    applyRectAttributes(gridMaskNode, protectedZoneState.gridMaskRect);
    applyRectAttributes(navNode, getNavSafeZoneRect());
    applyRectAttributes(eyebrowNode, protectedZoneState.zones.eyebrowZone);
    applyRectAttributes(headlineNode, protectedZoneState.zones.headlineZone);
    applyRectAttributes(headlineSoftNode, protectedZoneState.headlineSoftBand || EMPTY_SCREEN_RECT);
    applyRectAttributes(bodyNode, protectedZoneState.zones.bodyZone);
    applyRectAttributes(ctaNode, protectedZoneState.zones.ctaZone.active ? protectedZoneState.zones.ctaZone : protectedZoneState.zones.ctaStackZone);
    applyRectAttributes(trustNode, protectedZoneState.zones.trustRowZone);
    applyRectAttributes(scrollNode, protectedZoneState.zones.scrollCueZone);
    applyRectAttributes(hammerBounds, orbitLayoutState.projectedToolBounds.hammer);
    applyRectAttributes(wrenchBounds, orbitLayoutState.projectedToolBounds.wrench);
    applyRectAttributes(sawBounds, orbitLayoutState.projectedToolBounds.saw);
  }

  function resolveSupportVisibilityState(toolId) {
    return { visible: false, reason: 'hidden-art-direction' };
  }

  function refreshSupportVisibilityState() {
    const hammerState = resolveSupportVisibilityState('hammer');
    const sawState = resolveSupportVisibilityState('saw');
    supportDisplayState.hammer = hammerState;
    supportDisplayState.saw = sawState;
    protectedZoneState.mobileSupportState.hammer = hammerState.reason;
    protectedZoneState.mobileSupportState.saw = sawState.reason;
  }

  function isToolDraggable(toolId) {
    return toolId === HERO_FOCUS_TOOL;
  }

  function getToolDragLimit(toolId) {
    const compositionMode = orbitLayoutState.compositionMode || getCompositionModeForKey();
    if (toolId !== HERO_FOCUS_TOOL) return compositionMode === 'stillLifeDesktop' ? THREE.MathUtils.degToRad(20) : THREE.MathUtils.degToRad(16);
    if (compositionMode === 'crownMobile' || compositionMode === 'wrenchOnlyNarrow') return THREE.MathUtils.degToRad(8);
    return THREE.MathUtils.degToRad(14);
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
    updateProtectedZones();
    const sourceRect = unionScreenRects([
      protectedZoneState.zones.eyebrowZone,
      protectedZoneState.zones.headlineZone,
      protectedZoneState.zones.bodyZone,
      protectedZoneState.zones.ctaZone,
      protectedZoneState.zones.ctaStackZone,
      protectedZoneState.zones.trustRowZone,
    ]);
    const fallbackRect = rectFromNode(heroContent, SCENE_CONFIG.readability.padX, SCENE_CONFIG.readability.padY);
    const rect = sourceRect.active ? sourceRect : fallbackRect;
    readabilityWindow.left = Math.round(rect.left);
    readabilityWindow.top = Math.round(rect.top);
    readabilityWindow.width = Math.max(0, Math.round(rect.width));
    readabilityWindow.height = Math.max(0, Math.round(rect.height));
    readabilityWindow.active = rect.active && rect.bottom > 0 && rect.top < window.innerHeight;
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
    if (boost >= 0.4 && !prefersReduced && isDirectorInteractive()) {
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

  function createProfileMaterial(role, overrides = {}) {
    const preset = MATERIAL_PROFILE_PRESETS[ACTIVE_MATERIAL_PROFILE]?.[role]
      || MATERIAL_PROFILE_PRESETS[ACTIVE_MATERIAL_PROFILE]?.steel
      || MATERIAL_PROFILE_PRESETS.forgedMagicHybrid.steel;
    const config = { ...preset, opacity: 1.0, ...overrides };
    config.transparent = config.opacity < 1;
    if (preset.emissive && !config.emissive) {
      config.emissive = new THREE.Color(preset.emissive);
    } else if (typeof config.emissive === 'number') {
      config.emissive = new THREE.Color(config.emissive);
    }
    const mat = new THREE.MeshPhysicalMaterial(config);

    // Step 8.3 — Assign PBR variation maps
    if (PBR_VARIATION_MAPS) {
      const mapKey = role === 'blackened_steel' ? 'steel' : role === 'ember_core' ? 'brass' : role;
      const variationMap = PBR_VARIATION_MAPS[mapKey] || null;
      if (variationMap) {
        mat.roughnessMap = variationMap;
        // Only assign metalnessMap for metallic roles
        if (['steel', 'blackened_steel', 'brass', 'chrome'].includes(role)) {
          mat.metalnessMap = variationMap;
        }
        mat.needsUpdate = true;
      }
    }

    return mat;
  }

  function inferMaterialRole(mesh, toolId) {
    const meshName = `${mesh.name || ''} ${mesh.parent?.name || ''}`.toLowerCase();
    mesh.geometry?.computeBoundingBox?.();
    const bbox = mesh.geometry?.boundingBox || null;
    const center = bbox ? bbox.getCenter(new THREE.Vector3()) : new THREE.Vector3();

    if (/ember|core|glow/.test(meshName)) return 'ember_core';
    if (/wood|grain|timber/.test(meshName)) return 'wood';
    if (/rubber|grip|wrap/.test(meshName)) return 'rubber';
    if (/accent|paint|stripe|marking/.test(meshName)) return 'brass';
    if (/brass|rivet|bolt|fastener/.test(meshName)) return 'brass';
    if (/black|oxide|housing|worm|adjust|gear|claw|head/.test(meshName)) return 'blackened_steel';

    if (toolId === 'hammer') {
      return center.y < -0.25 ? 'wood' : 'blackened_steel';
    }
    if (toolId === 'wrench') {
      return center.y > 0.22 && Math.abs(center.x) < 0.18 ? 'rubber' : 'steel';
    }
    if (toolId === 'saw') {
      return center.x > 0.12 ? 'wood' : 'steel';
    }
    return 'steel';
  }

  function getManifestMaterialTokenSet(assetMeta) {
    return new Set((assetMeta?.manifestEntry?.materialTokens || []).map((token) => String(token).toLowerCase()));
  }

  function resolveImportedMaterialRole(mesh, toolId, materialTokens) {
    const inferredRole = inferMaterialRole(mesh, toolId);
    if (!materialTokens || materialTokens.size === 0) return inferredRole;

    if (inferredRole === 'wood' && materialTokens.has('wood')) return 'wood';
    if (inferredRole === 'rubber' && materialTokens.has('grip')) return 'rubber';
    if (inferredRole === 'blackened_steel' && materialTokens.has('dark_metal')) return 'blackened_steel';
    if (inferredRole === 'brass' && materialTokens.has('accent')) return 'brass';
    if (inferredRole === 'steel' && materialTokens.has('steel')) return 'steel';
    if (materialTokens.has('dark_metal')) return inferredRole === 'steel' ? 'blackened_steel' : inferredRole;
    if (materialTokens.has('wood') && toolId !== 'wrench') return inferredRole === 'rubber' ? 'wood' : inferredRole;
    if (materialTokens.has('grip') && toolId === 'wrench') return inferredRole === 'wood' ? 'rubber' : inferredRole;
    if (materialTokens.has('accent') && /accent|rivet|bolt|fastener/.test(`${mesh.name || ''} ${mesh.parent?.name || ''}`.toLowerCase())) return 'brass';
    return inferredRole;
  }

  function retuneAuthoredMaterial(material, role = 'steel', materialTokens = null) {
    if (!material || !material.isMaterial) return material;
    const next = material.clone();
    const preset = MATERIAL_PROFILE_PRESETS[ACTIVE_MATERIAL_PROFILE]?.[role] || null;
    if (typeof next.envMapIntensity === 'number') {
      const envTarget = preset?.envMapIntensity ?? 1.04;
      next.envMapIntensity = THREE.MathUtils.lerp(next.envMapIntensity || 1.0, Math.max(1.02, envTarget), 0.58);
    }
    if (typeof next.roughness === 'number') {
      const roughnessTarget = preset?.roughness ?? next.roughness * 0.92;
      next.roughness = THREE.MathUtils.clamp(THREE.MathUtils.lerp(next.roughness, roughnessTarget, 0.42), 0.12, 0.98);
    }
    if (typeof next.metalness === 'number') {
      const metalnessTarget = preset?.metalness ?? next.metalness * 1.02;
      next.metalness = THREE.MathUtils.clamp(THREE.MathUtils.lerp(next.metalness, metalnessTarget, 0.34), 0.0, 1.0);
    }
    if (preset?.clearcoat != null && 'clearcoat' in next) {
      next.clearcoat = THREE.MathUtils.lerp(next.clearcoat || 0, preset.clearcoat, 0.36);
    }
    if (preset?.clearcoatRoughness != null && 'clearcoatRoughness' in next) {
      next.clearcoatRoughness = THREE.MathUtils.lerp(next.clearcoatRoughness || 0, preset.clearcoatRoughness, 0.36);
    }
    if (preset?.color != null && next.color?.lerp) {
      next.color.lerp(new THREE.Color(preset.color), 0.24);
    }
    if (materialTokens?.has('accent') && role === 'brass' && next.color?.offsetHSL) {
      next.color.offsetHSL(0.01, 0.04, 0.02);
    }
    if (materialTokens?.has('dark_metal') && role === 'blackened_steel' && next.color?.multiplyScalar) {
      next.color.multiplyScalar(0.94);
    }
    if (next.normalScale?.multiplyScalar) {
      next.normalScale = next.normalScale.clone().multiplyScalar(0.92);
    }

    // Step 8.4 — Assign PBR variation maps to imported GLB meshes
    if (PBR_VARIATION_MAPS && !next.roughnessMap) {
      const mapKey = role === 'blackened_steel' ? 'steel' : role === 'ember_core' ? 'brass' : role;
      const variationMap = PBR_VARIATION_MAPS[mapKey] || null;
      if (variationMap) {
        next.roughnessMap = variationMap;
        if (['steel', 'blackened_steel', 'brass'].includes(role)) {
          next.metalnessMap = variationMap;
        }
      }
    }

    next.needsUpdate = true;
    return next;
  }

  function applyImportedToolMaterials(root, toolId, assetMeta = null) {
    if (FINAL_HERO_PROVENANCE.has(assetMeta?.manifestEntry?.provenance)) {
      const materialTokens = getManifestMaterialTokenSet(assetMeta);
      root.traverse((obj) => {
        if (!obj.isMesh) return;
        const role = resolveImportedMaterialRole(obj, toolId, materialTokens);
        obj.castShadow = true;
        obj.receiveShadow = true;
        obj.userData.materialRole = role;
        obj.material = Array.isArray(obj.material)
          ? obj.material.map((material) => retuneAuthoredMaterial(material, role, materialTokens))
          : retuneAuthoredMaterial(obj.material, role, materialTokens);
      });
      toolAssetProfile[toolId] = `${ACTIVE_MATERIAL_PROFILE}-tokens`;
      return;
    }

    root.traverse((obj) => {
      if (!obj.isMesh) return;
      const role = inferMaterialRole(obj, toolId);
      const overrides = {};
      if (toolId === 'wrench') {
        if (role === 'steel') {
          overrides.roughness = 0.18;
          overrides.envMapIntensity = 1.14;
          overrides.clearcoat = 0.24;
          overrides.clearcoatRoughness = 0.16;
        } else if (role === 'blackened_steel') {
          overrides.roughness = 0.40;
          overrides.envMapIntensity = 0.78;
          overrides.clearcoat = 0.18;
          overrides.clearcoatRoughness = 0.22;
        } else if (role === 'ember_core') {
          overrides.emissiveIntensity = 0.68;
          overrides.opacity = 0.92;
        }
      } else if (role === 'steel') {
        overrides.roughness = 0.34;
        overrides.envMapIntensity = 0.78;
      }
      obj.userData.materialRole = role;
      obj.castShadow = true;
      obj.receiveShadow = true;
      obj.material = createProfileMaterial(role, overrides);
    });
    toolAssetProfile[toolId] = ACTIVE_MATERIAL_PROFILE;
  }

  function addHeroToolAccents(toolId) {
    const group = getToolGroup(toolId);
    if (!group || group.userData.heroAccentsReady) return;

    if (toolId === 'wrench') {
      const emberSeam = new THREE.Mesh(
        new THREE.BoxGeometry(0.07, 0.56, 0.03),
        createProfileMaterial('ember_core', { opacity: 0.90, emissiveIntensity: 0.64 })
      );
      emberSeam.name = 'heroWrenchEmberSeam';
      emberSeam.position.set(0.12, 0.82, 0.11);
      emberSeam.castShadow = false;
      group.add(emberSeam);
      group.userData.emberSeam = emberSeam;
    }

    if (toolId === 'hammer') {
      const edgeAccent = new THREE.Mesh(
        new THREE.BoxGeometry(0.86, 0.03, 0.12),
        createProfileMaterial('brass', { opacity: 0.72, envMapIntensity: 0.46, roughness: 0.42 })
      );
      edgeAccent.name = 'heroHammerEdgeAccent';
      edgeAccent.position.set(-0.02, 0.54, 0.0);
      edgeAccent.castShadow = false;
      group.add(edgeAccent);
      group.userData.edgeAccent = edgeAccent;
    }

    if (toolId === 'saw') {
      for (let i = 0; i < 3; i++) {
        const rivet = new THREE.Mesh(
          new THREE.CylinderGeometry(0.04, 0.04, 0.03, 18),
          createProfileMaterial('brass', { roughness: 0.28, envMapIntensity: 0.62 })
        );
        rivet.name = `heroSawRivet${i}`;
        rivet.rotation.z = Math.PI / 2;
        rivet.position.set(0.34 + i * 0.18, -0.10 + i * 0.03, 0.05);
        rivet.castShadow = false;
        group.add(rivet);
      }
      group.userData.rivetAccentCount = 3;
    }

    group.userData.heroAccentsReady = true;
  }

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
    const seamAnchor = { x: 1.34, y: 0.88, z: 1.12 };
    const handleAnchor = { x: 1.04, y: -0.64, z: 1.04 };
    const axisBlend = seeded01(seed + 0.14);
    const localEmitter = {
      x: THREE.MathUtils.lerp(handleAnchor.x, seamAnchor.x, axisBlend),
      y: THREE.MathUtils.lerp(handleAnchor.y, seamAnchor.y, axisBlend),
      z: THREE.MathUtils.lerp(handleAnchor.z, seamAnchor.z, axisBlend),
    };
    const emitterX = localEmitter.x + seededRange(seed + 0.2, -0.46, 0.42);
    const emitterY = localEmitter.y + seededRange(seed + 0.6, -0.34, 0.56);
    const emitterZ = localEmitter.z + seededRange(seed + 1.1, -0.28, 0.24);

    if (species.id === 'flowRibbon') {
      system.positions[ix] = emitterX;
      system.positions[ix + 1] = emitterY;
      system.positions[ix + 2] = emitterZ;
      system.velocities[ix] = seededRange(seed + 1.8, -0.002, 0.005);
      system.velocities[ix + 1] = seededRange(seed + 2.2, -0.002, 0.006);
      system.velocities[ix + 2] = seededRange(seed + 2.8, -0.002, 0.003);
      system.charges[index] = seededRange(seed + 3.4, 0.18, 0.42);
      system.temperatures[index] = seededRange(seed + 3.8, 0.54, 0.92);
    } else if (species.id === 'sparkFilament') {
      system.positions[ix] = seamAnchor.x + seededRange(seed + 0.4, -0.18, 0.18);
      system.positions[ix + 1] = seamAnchor.y + seededRange(seed + 0.8, -0.12, 0.24);
      system.positions[ix + 2] = seamAnchor.z + seededRange(seed + 1.2, -0.08, 0.18);
      system.velocities[ix] = seededRange(seed + 1.7, -0.0015, 0.004);
      system.velocities[ix + 1] = seededRange(seed + 2.4, -0.001, 0.004);
      system.velocities[ix + 2] = seededRange(seed + 3.1, -0.001, 0.002);
      system.charges[index] = seededRange(seed + 3.7, 0.24, 0.58);
      system.temperatures[index] = seededRange(seed + 4.0, 0.72, 1.0);
    } else {
      system.positions[ix] = emitterX + seededRange(seed + 2.2, -0.9, 0.8);
      system.positions[ix + 1] = emitterY + seededRange(seed + 2.5, -0.7, 0.9);
      system.positions[ix + 2] = emitterZ + seededRange(seed + 2.9, -0.4, 0.4);
      system.velocities[ix] = seededRange(seed + 3.1, -0.0006, 0.0008);
      system.velocities[ix + 1] = seededRange(seed + 3.5, -0.0004, 0.0008);
      system.velocities[ix + 2] = seededRange(seed + 4.0, -0.0004, 0.0006);
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
        material = createParticleShaderMaterial(species, {
          opacity: 0.14,
          scale: 0.42,
          stretch: 2.2,
          depthFade: 0.04,
          ring: 0.62,
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
    flowRibbon: 20,
    cloudMote: 46,
    microDust: 32,
    sparkFilament: 18,
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
    desktopFxState.mode = SCENE_TEST_OVERRIDES.disablePerfAutoDowngrade ? 'desktop-scatter' : 'disabled';
    desktopFxState.active = false;
    desktopFxState.underBudgetSince = performance.now();
  }

  function updateVolumetricScatterPass(nowMs, toolAlpha, readabilityClamp, releaseProgress, implPct) {
    if (!scatterPass || !densityRenderTarget || !densityPoints || !densityPointMaterial) return;

    updateDesktopFxMode(nowMs);
    const profile = getDesktopFxProfile();
    const storyPreset = getParticleStoryPreset();
    const signaturePreset = getParticleSignaturePreset();
    const releasePreset = getReleaseEnvelopePreset();
    const scatterPreset = getLightScatterPreset();
    const shaftPreset = getVolumeShaftPreset();
    const seamAnchor = getWrenchStoryAnchor();
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
      + toolWakeState.wrench * 0.12
      + SCENE_STATE.focus * 0.14
      + SCENE_STATE.release * 0.24
      + magicIntensity * 0.18
      + implPct * 0.12
    );
    const interactionBoost = clamp01(
      (hoveredTool ? 0.10 : 0)
      + (dragTool ? 0.42 : 0)
      + (activePanelTool ? 0.10 : 0)
      + SCENE_STATE.focus * 0.38
      + SCENE_STATE.gather * 0.34
      + SCENE_STATE.release * 0.54
      + magicPulseStrength * 0.22
      + toolWakeEnergy * 0.72
      + pointerTrailEnergy * 0.58
    );
    const burstScatterPulse = /click|touch|drag-release/.test(magicPulseSource)
      ? clamp01(1 - (nowMs - magicPulseStartAt) / Math.max(260, magicPulseDurationMs * 0.82))
      : 0;
    const releaseScatterLift = clamp01(
      SCENE_STATE.release * 1.12
      + releaseProgress * 0.90
      + implPct * 0.30
      + magicPulseStrength * 0.34
      + burstScatterPulse * 0.86
    );
    const emberScatterLead = clamp01(
      heroEmberLevel * 0.44
      + releaseEnvelope * 0.52
      + magicPulseStrength * 0.22
      + DIRECTOR_STATE.revealMix * 0.16
    );
    const readabilityScatterClamp = Math.max(
      0.18,
      1 - readabilityClamp * (dragTool ? 0.18 : ACTIVE_COPY_CORRIDOR_GUARD.scatterFade)
    );

    densityPointMaterial.uniforms.uOpacity.value = toolAlpha
      * (0.15 + densityEnergy * 0.44 + interactionBoost * 0.16 + releaseScatterLift * 0.14 + burstScatterPulse * 0.08 + emberScatterLead * 0.12)
      * profile.pointOpacityScale
      * (0.82 + shaftPreset.hazeClamp * 0.18);
    densityPoints.visible = profile.sampleScale > 0 && densityPointMaterial.uniforms.uOpacity.value > 0.01;
    scatterPass.uniforms.uIntensity.value = toolAlpha
      * (0.08 + densityEnergy * 0.26 + interactionBoost * 0.12 + releaseScatterLift * 0.16 + magicPulseStrength * 0.08 + burstScatterPulse * 0.14 + emberScatterLead * 0.18 + (dragTool ? 0.024 : 0) + (energyState === ENERGY_STATES.release ? 0.02 : 0))
      * readabilityScatterClamp
      * scatterPreset.scatterGain
      * (0.78 + shaftPreset.hazeClamp * 0.22)
      * profile.intensityScale;
    scatterPass.uniforms.uShaftStepCount.value = profile.shaftStepCount;
    scatterPass.uniforms.uShaftStrength.value = profile.shaftStrength
      * scatterPreset.shaftTightness
      * (0.72 + shaftPreset.warmSeam * 0.18 + shaftPreset.coolBackscatter * 0.08 + emberScatterLead * 0.12);
    scatterPass.uniforms.uTime.value = nowMs * 0.001;
    scatterPass.uniforms.uWarmColor.value.setRGB(
      0.86 + shaftPreset.warmSeam * 0.10,
      0.62 + heroEmberLevel * 0.10 + releaseEnvelope * 0.04,
      0.30 + releaseEnvelope * 0.04
    );
    scatterPass.uniforms.uCoolColor.value.setRGB(
      0.34 + shaftPreset.coolBackscatter * 0.10,
      0.52 + releaseEnvelope * 0.04,
      0.80 + shaftPreset.coolBackscatter * 0.12 + releaseEnvelope * 0.06
    );
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
          warmWeight = 0.50 + charge * 0.30 + atmosphereMetrics.vortex * 0.22 + toolWakeState.wrench * 0.14 * scatterPreset.wrenchAnchorGain + heroEmberLevel * 0.16;
          coolWeight = 0.04 + SCENE_STATE.release * 0.16 + implPct * 0.10 + shaftPreset.coolBackscatter * 0.06;
        } else if (speciesId === 'cloudMote') {
          size = 34 + charge * 18 + adhesion * 14 + atmosphereMetrics.titleHalo * 12;
          warmWeight = 0.34 + charge * 0.22 + atmosphereMetrics.titleHalo * 0.22 + heroEmberLevel * 0.10;
          coolWeight = 0.05 + SCENE_STATE.release * 0.18 + atmosphereMetrics.foreground * 0.10 + shaftPreset.coolBackscatter * 0.08;
        } else if (speciesId === 'microDust') {
          size = 18 + wake * 12 + charge * 8 + atmosphereMetrics.foreground * 6;
          warmWeight = 0.16 + atmosphereMetrics.foreground * 0.16 + charge * 0.08;
          coolWeight = 0.04 + wake * 0.08 + SCENE_STATE.release * 0.10;
        } else if (speciesId === 'sparkFilament') {
          size = 22 + charge * 16 + atmosphereMetrics.sawWake * 14;
          warmWeight = 0.60 + charge * 0.18 + SCENE_STATE.focus * 0.08 + releaseEnvelope * 0.12;
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
        0.20 + node.strength * 0.16 + heroEmberLevel * 0.06,
        0.10 + node.strength * 0.34 + SCENE_STATE.release * 0.08 + shaftPreset.coolBackscatter * 0.04
      );
    }

    const wakeAnchors = [
      { x: seamAnchor.x, y: seamAnchor.y, z: seamAnchor.z + 0.08, size: 76 + toolWakeState.wrench * 48 + heroEmberLevel * 28, warm: 0.56 + atmosphereMetrics.vortex * 0.20 + magicPulseStrength * 0.14 + shaftPreset.warmSeam * 0.12 + heroEmberLevel * 0.16, cool: 0.04 + SCENE_STATE.release * 0.06 + shaftPreset.coolBackscatter * 0.04 },
      { x: seamAnchor.x - 0.14, y: seamAnchor.y + 0.54, z: seamAnchor.z + 0.06, size: 58 + signaturePreset.laneSweep * 10, warm: 0.34 + atmosphereMetrics.vortex * 0.12 + heroEmberLevel * 0.12, cool: 0.04 + SCENE_STATE.release * 0.10 + shaftPreset.coolBackscatter * 0.04 },
      { x: seamAnchor.x + 0.04, y: seamAnchor.y + 1.12, z: seamAnchor.z - 0.24, size: 68 + shaftPreset.upliftColumn * 18, warm: 0.30 + shaftPreset.warmSeam * 0.14, cool: 0.06 + shaftPreset.coolBackscatter * 0.16 + releaseEnvelope * 0.10 },
    ];
    if (releaseScatterLift > 0.04) {
      wakeAnchors.push(
        {
          x: seamAnchor.x + 0.34,
          y: seamAnchor.y + 0.18,
          z: seamAnchor.z + 0.10,
          size: 74 + releaseProgress * 42 + releaseEnvelope * 24,
          warm: 0.50 + releaseEnvelope * 0.24 + shaftPreset.warmSeam * 0.08,
          cool: 0.12 + SCENE_STATE.release * 0.22 + shaftPreset.coolBackscatter * 0.12,
        },
        {
          x: seamAnchor.x + 0.92,
          y: seamAnchor.y + 0.54,
          z: seamAnchor.z + 0.28,
          size: 58 + releaseEnvelope * 34,
          warm: 0.28 + releaseEnvelope * 0.16 + signaturePreset.releaseFan * 0.10,
          cool: 0.10 + SCENE_STATE.release * 0.14 + shaftPreset.coolBackscatter * 0.10,
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

    projectionScratch.copy(seamAnchor).project(camera);
    scatterPass.uniforms.uWarmOrigin.value.set(
      clamp01((projectionScratch.x + 1) * 0.5),
      clamp01((projectionScratch.y + 1) * 0.5)
    );
    projectionScratch.set(keyBeamCard.position.x, keyBeamCard.position.y, keyBeamCard.position.z).project(camera);
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
  window.__restartSceneDirectorForTest = () => {
    frozenDirectorPhase = null;
    restartSceneDirectorForTest();
    return window.__sceneDiagnostics?.() || null;
  };
  window.__setSceneDirectorPhaseForTest = (phase) => {
    const normalized = normalizeFreezePhase(phase);
    frozenDirectorPhase = normalized;
    if (normalized) {
      applyDirectorSnapshot(normalized);
    }
    return window.__sceneDiagnostics?.() || null;
  };
  window.__openToolPanelForTest = (toolId = HERO_FOCUS_TOOL) => {
    const targetId = HERO_TOOL_IDS.includes(toolId) ? toolId : HERO_FOCUS_TOOL;
    const targetScreen = window.__sceneDiagnostics?.().toolScreenPositions?.[targetId] || orbitLayoutState.centerScreen;
    panelTestLock = true;
    openPanel(targetId, targetScreen.x, targetScreen.y);
    return window.__sceneDiagnostics?.() || null;
  };
  window.__closeToolPanelForTest = () => {
    panelTestLock = false;
    closePanel(true);
    return window.__sceneDiagnostics?.() || null;
  };
  window.__captureSceneSnapshot = (label = 'scene-snapshot', options = {}) => {
    let imageDataUrl = null;
    if (SCENE_TEST_OVERRIDES.debug && options && options.includeImage) {
      try {
        imageDataUrl = renderer.domElement.toDataURL('image/png');
      } catch {
        imageDataUrl = null;
      }
    }
    return {
      label: String(label),
      capturedAt: new Date().toISOString(),
      imageDataUrl,
      diagnostics: window.__sceneDiagnostics?.() || null,
    };
  };
  window.__sampleCanvasPixel = (x, y) => {
    const gl = renderer.getContext();
    const buf = new Uint8Array(4);
    gl.readPixels(x, gl.drawingBufferHeight - y, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, buf);
    return { r: buf[0], g: buf[1], b: buf[2], a: buf[3] };
  };

  function sampleParticleZoneMetrics() {
    const relevantZones = getRelevantProtectedZoneRects()
      .filter(([key]) => key !== 'navZone' && key !== 'topBarZone');
    const heroLaneRect = protectedZoneState.heroTargetFrame.active ? protectedZoneState.heroTargetFrame : protectedZoneState.artLane;
    const mobileComposition = orbitLayoutState.compositionMode === 'crownMobile' || orbitLayoutState.compositionMode === 'wrenchOnlyNarrow';
    const hits = {
      total: 0,
      eyebrowZone: 0,
      headlineZone: 0,
      bodyZone: 0,
      ctaZone: 0,
      ctaStackZone: 0,
      trustRowZone: 0,
      scrollCueZone: 0,
    };
    if (!relevantZones.length) {
      return {
        ratios: Object.fromEntries(Object.keys(hits).map((key) => [key, 0])),
        counts: { ...hits },
        longStrokeCount: 0,
        rodCount: 0,
        outOfHeroLaneCount: 0,
      };
    }
    let samples = 0;
    let rodCount = 0;
    let outOfHeroLaneCount = 0;
    for (const system of simulatedParticleSystems) {
      if (!['flowRibbon', 'sparkFilament'].includes(system.species.id)) continue;
      const materialOpacity = system.species.id === 'flowRibbon' || system.species.id === 'sparkFilament'
        ? (system.material?.opacity || 0)
        : (system.material?.uniforms?.uOpacity?.value || system.material?.opacity || 0);
      const longStrokeGate = system.species.id === 'flowRibbon' ? 0.05 : 0.06;
      if (materialOpacity <= longStrokeGate) continue;
      const stride = Math.max(1, Math.floor(system.count / 48));
      for (let i = 0; i < system.count; i += stride) {
        const index = i * 3;
        const velocityIndex = i * 3;
        const speed = Math.hypot(
          system.velocities?.[velocityIndex] || 0,
          system.velocities?.[velocityIndex + 1] || 0,
          system.velocities?.[velocityIndex + 2] || 0
        );
        const speedThreshold = system.species.id === 'flowRibbon' ? 0.022 : 0.028;
        if (speed < speedThreshold) {
          continue;
        }
        const screen = projectWorldToScreen(system.positions[index], system.positions[index + 1], system.positions[index + 2]);
        if (!Number.isFinite(screen.x) || !Number.isFinite(screen.y)) continue;

        let projectedLength = 0;
        if (system.trailHeads) {
          const tailScreen = projectWorldToScreen(
            system.trailHeads[index],
            system.trailHeads[index + 1],
            system.trailHeads[index + 2]
          );
          if (Number.isFinite(tailScreen.x) && Number.isFinite(tailScreen.y)) {
            projectedLength = Math.hypot(screen.x - tailScreen.x, screen.y - tailScreen.y);
          }
        } else {
          projectedLength = speed * (mobileComposition ? 140 : 180);
        }
        const rodThreshold = mobileComposition ? 6 : 10;
        if (projectedLength >= rodThreshold) {
          rodCount += 1;
        }
        if (heroLaneRect?.active && !intersectsScreenRect(
          { left: screen.x, top: screen.y, right: screen.x, bottom: screen.y, width: 1, height: 1 },
          heroLaneRect,
          0
        )) {
          outOfHeroLaneCount += 1;
        }
        const sampleRect = { left: screen.x, top: screen.y, right: screen.x, bottom: screen.y, width: 1, height: 1 };
        let sampleHit = false;
        for (const [key, zone] of relevantZones) {
          if (intersectsScreenRect(sampleRect, zone, 0)) {
            hits[key] += 1;
            sampleHit = true;
          }
        }
        if (sampleHit) hits.total += 1;
        samples += 1;
      }
    }
    return {
      ratios: samples
        ? Object.fromEntries(
            Object.entries(hits).map(([key, value]) => [key, Number((value / samples).toFixed(3))])
          )
        : Object.fromEntries(Object.keys(hits).map((key) => [key, 0])),
      counts: { ...hits },
      longStrokeCount: rodCount,
      rodCount,
      outOfHeroLaneCount,
    };
  }

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
    curlStrength: 0.00076,
    clumpStrength: 0.00144,
    releaseSpread: 0.00086,
    damping: 0.968,             // Heavy drag — particles barely coast, linger like embers
    baseDamping: 0.968,
    velocityCap: 0.14,          // Allows shockwave blast, implosion snap; physics damping controls decay
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
    toolDeflectStrength: 0.00120,
    titleRepelStrength: 0.0024,
    flowStrength: 0.00078,
    floorSkimStrength: 0.00072,
    floorHeight: -2.55,
    dragSpeciesBoost: null,         // Per-tool species multiplier table on drag
    // ── Directional wind (mouse-velocity aligned force) ──
    windStrength: 0.007,                    // ambient directional wind — drag can still boost it
    baseWindStrength: 0.007,               // reset target for windStrength after drag boost
    windZBias: 0.24,                        // fraction of z-scatter aligned to mouse direction
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

  window.__sceneDiagnostics = () => {
    const particleZoneMetrics = sampleParticleZoneMetrics();
    const particleZoneIntrusions = particleZoneMetrics.ratios;
    protectedZoneState.particleZoneIntrusions = { ...particleZoneIntrusions };
    Object.assign(particleStrokeCrossings, particleZoneMetrics.counts);
    particleLongStrokeCount = particleZoneMetrics.longStrokeCount || 0;
    particleRodCount = particleZoneMetrics.rodCount || 0;
    particleOutOfHeroLaneCount = particleZoneMetrics.outOfHeroLaneCount || 0;
    const heroBounds = orbitLayoutState.projectedToolBounds.wrench || EMPTY_SCREEN_RECT;
    const heroCenterX = (heroBounds.left + heroBounds.right) * 0.5;
    const heroHeadlineOverlapMetrics = getHeroHeadlineOverlapMetrics(heroBounds);
    heroHeadlineOverlapRatio = heroHeadlineOverlapMetrics.softRatio || 0;
    const heroAreaRect = (orbitLayoutState.compositionMode === 'stillLifeDesktop')
      ? expandScreenRect(heroBounds, 24, 30)
      : (orbitLayoutState.compositionMode === 'tabletCluster'
        ? expandScreenRect(heroBounds, 14, 18)
        : heroBounds);
    const heroViewportAreaRatio = ((heroAreaRect.width || 0) * (heroAreaRect.height || 0)) / Math.max(1, window.innerWidth * window.innerHeight);
    heroArtLaneOccupancy = protectedZoneState.artLane.width > 0
      ? (heroViewportAreaRatio / Math.max(0.001, protectedZoneState.artLane.width / Math.max(1, window.innerWidth)))
      : 0;
    const supportVisibleCount = ['hammer', 'saw'].reduce((count, toolId) => count + (supportDisplayState[toolId]?.visible ? 1 : 0), 0);
    return {
    activeTier: SCENE_CONFIG.qualityTier,
    particleBudgetTier: SCENE_CONFIG.qualityTier,
    defaultTier: DEFAULT_QUALITY_TIER,
    directorPhase: DIRECTOR_STATE.phase,
    compositionMode: orbitLayoutState.compositionMode || getCompositionModeForKey(),
    heroFocusTool: DIRECTOR_STATE.heroFocusTool,
    cameraState: DIRECTOR_STATE.cameraState,
    shotBeat,
    lightingCue,
    gradePreset,
    environmentCue: getEnvironmentCue(),
    assetSetVersion,
    assetContractVersion,
    heroAssetVariant,
    heroAssetBuildStage,
    heroAssetVerificationState,
    heroAssetVerification: {
      manifestLoaded: heroAssetVerification.manifestLoaded,
      packVerified: heroAssetVerification.packVerified,
      finalReady: heroAssetVerification.finalReady,
      manifestVariant: heroAssetVerification.manifestVariant,
      manifestMatch: { ...heroAssetVerification.manifestMatch },
      distinctFromLegacy: { ...heroAssetVerification.distinctFromLegacy },
    },
    materialProfile: ACTIVE_MATERIAL_PROFILE,
    interactionCue: getInteractionCue(),
    postFxMode: getPostFxMode(),
    particleCue,
    signatureCue,
    worldCue,
    depthLayerMix: {
      total: Number(depthLayerMix.total.toFixed(3)),
      rearForge: Number(depthLayerMix.rearForge.toFixed(3)),
      silhouettes: Number(depthLayerMix.silhouettes.toFixed(3)),
      occluders: Number(depthLayerMix.occluders.toFixed(3)),
      hangingDepth: Number(depthLayerMix.hangingDepth.toFixed(3)),
    },
    lensEvent,
    magicIntensity: Number(magicIntensity.toFixed(3)),
    releaseEnvelope: Number(releaseEnvelope.toFixed(3)),
    corridorEvacuation: Number(corridorEvacuation.toFixed(3)),
    heroEmberLevel: Number(heroEmberLevel.toFixed(3)),
    activeForceFields: Object.fromEntries(Object.entries(activeForceFields).map(([key, value]) => [key, Number(value.toFixed(3))])),
    copyCorridorDensity: Number(copyZoneDensity.toFixed(3)),
    toolInfluenceState: Object.fromEntries(Object.entries(toolInfluenceState).map(([key, value]) => [key, Number(value.toFixed(3))])),
    worldReadMetrics: {
      backgroundSeparation: Number(worldReadMetrics.backgroundSeparation.toFixed(3)),
      copyContamination: Number(worldReadMetrics.copyContamination.toFixed(3)),
      heroWorldBalance: Number(worldReadMetrics.heroWorldBalance.toFixed(3)),
    },
    scrollHandoffState,
    perfAuthority: (_gpuProbe.softwareRenderer || navigator.webdriver) ? 'software-ci' : 'local-hardware',
    assetLicense: getManifestToolEntry(HERO_FOCUS_TOOL)?.license || null,
    environment: {
      lowEndGpu: _isLowEnd,
      softwareRenderer: _gpuProbe.softwareRenderer,
      renderer: _gpuProbe.renderer,
      lowMemory: _gpuProbe.lowMemory,
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
    toolAssetSource: { ...toolAssetSource },
    toolAssetProfile: { ...toolAssetProfile },
    assemblyStatus: {
      done: assemblyDone,
      startTime: assemblyStartTime,
      wrenchPartOffset: wrenchParts[0]?.position?.toArray?.() || null,
      hammerPartOffset: hammerParts[0]?.position?.toArray?.() || null,
      sawPartOffset: sawParts[0]?.position?.toArray?.() || null,
    },
    toolTransforms: Object.fromEntries(HERO_TOOL_IDS.map((toolId) => {
      const group = getToolGroup(toolId);
      return [toolId, {
        position: group.position.toArray(),
        rotation: [group.rotation.x, group.rotation.y, group.rotation.z],
        scale: group.scale.toArray(),
      }];
    })),
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
      debug: SCENE_TEST_OVERRIDES.debug,
      freezePhase: frozenDirectorPhase,
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
    orbitLayout: {
      key: orbitLayoutState.key,
      compositionMode: orbitLayoutState.compositionMode,
      heroAnchor: { ...orbitLayoutState.layout.anchor },
      heroPlaneZ: orbitLayoutState.layout.heroPlaneZ,
      heroScreenHeightRatio: orbitLayoutState.layout.heroScreenHeightRatio,
      hammer: {
        radiusPx: { ...orbitLayoutState.layout.hammer.radiusPx },
        zOffset: orbitLayoutState.layout.hammer.zOffset,
        angularVelocity: orbitLayoutState.layout.hammer.angularVelocity,
      },
      saw: {
        radiusPx: { ...orbitLayoutState.layout.saw.radiusPx },
        zOffset: orbitLayoutState.layout.saw.zOffset,
        angularVelocity: orbitLayoutState.layout.saw.angularVelocity,
      },
    },
    orbitCenterScreen: {
      x: Number(orbitLayoutState.centerScreen.x.toFixed(2)),
      y: Number(orbitLayoutState.centerScreen.y.toFixed(2)),
    },
    supportAnglesDeg: { ...orbitLayoutState.supportAnglesDeg },
    toolScreenPositions: {
      hammer: projectWorldToScreen(hammerGroup.position.x, hammerGroup.position.y, hammerGroup.position.z),
      wrench: projectWorldToScreen(wrenchGroup.position.x, wrenchGroup.position.y, wrenchGroup.position.z),
      saw: projectWorldToScreen(sawGroup.position.x, sawGroup.position.y, sawGroup.position.z),
    },
    projectedToolBounds: {
      hammer: { ...orbitLayoutState.projectedToolBounds.hammer },
      wrench: { ...orbitLayoutState.projectedToolBounds.wrench },
      saw: { ...orbitLayoutState.projectedToolBounds.saw },
    },
    safeZoneViolations: {
      nav: { ...orbitLayoutState.safeZoneViolations.nav },
      readability: { ...orbitLayoutState.safeZoneViolations.readability },
      viewport: { ...orbitLayoutState.safeZoneViolations.viewport },
    },
    protectedZones: Object.fromEntries(Object.entries(protectedZoneState.zones).map(([key, rect]) => [key, { ...rect }])),
    artLane: { ...protectedZoneState.artLane },
    contentLane: { ...protectedZoneState.contentLane },
    headlineSoftBand: { ...protectedZoneState.headlineSoftBand },
    heroTargetFrame: { ...protectedZoneState.heroTargetFrame },
    heroBacklightRect: { ...protectedZoneState.heroBacklightRect },
    heroShadowRect: { ...protectedZoneState.heroShadowRect },
    particleEmissionRect: { ...protectedZoneState.particleEmissionRect },
    particleExclusionLane: { ...protectedZoneState.particleExclusionLane },
    gridMaskRect: { ...protectedZoneState.gridMaskRect },
    ctaLaneIntrusions: { ...protectedZoneState.ctaLaneIntrusions },
    trustRowIntrusions: { ...protectedZoneState.trustRowIntrusions },
    particleZoneIntrusions,
    particleStrokeCrossings: { ...particleStrokeCrossings },
    mobileSupportState: { ...protectedZoneState.mobileSupportState },
    supportPolicy: { ...protectedZoneState.mobileSupportState },
    heroViewportHeightRatio: Number(((orbitLayoutState.projectedToolBounds.wrench.height || 0) / Math.max(1, window.innerHeight)).toFixed(3)),
    heroViewportAreaRatio: Number(heroViewportAreaRatio.toFixed(3)),
    heroHeadlineOverlapRatio: Number(heroHeadlineOverlapRatio.toFixed(3)),
    heroArtLaneOccupancy: Number(heroArtLaneOccupancy.toFixed(3)),
    heroClearancePx: {
      top: Number((orbitLayoutState.projectedToolBounds.wrench.top || 0).toFixed(1)),
      right: Number((window.innerWidth - (orbitLayoutState.projectedToolBounds.wrench.right || window.innerWidth)).toFixed(1)),
      bottom: Number((window.innerHeight - (orbitLayoutState.projectedToolBounds.wrench.bottom || window.innerHeight)).toFixed(1)),
      left: Number((orbitLayoutState.projectedToolBounds.wrench.left || 0).toFixed(1)),
    },
    heroRightThirdOffsetPx: Number((heroCenterX - window.innerWidth * 0.67).toFixed(1)),
    supportProjectedHeightRatio: {
      hammer: Number((((orbitLayoutState.projectedToolBounds.hammer.height || 0) / Math.max(1, orbitLayoutState.projectedToolBounds.wrench.height || 1))).toFixed(3)),
      saw: Number((((orbitLayoutState.projectedToolBounds.saw.height || 0) / Math.max(1, orbitLayoutState.projectedToolBounds.wrench.height || 1))).toFixed(3)),
    },
    supportVisibleCount,
    gridLuminanceUnderCopy: Number(gridLuminanceUnderCopy.toFixed(3)),
    particleLongStrokeCount,
    particleRodCount,
    particleOutOfHeroLaneCount,
    heroBacklightCoverage: Number(heroBacklightCoverage.toFixed(3)),
    heroShadowCoverage: Number(heroShadowCoverage.toFixed(3)),
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
    heroReadMetrics: Object.fromEntries(Object.entries(heroReadMetrics).map(([key, value]) => [key, Number(value.toFixed(3))])),
    toolContrast: Object.fromEntries(Object.entries(toolContrastMetrics).map(([key, value]) => [key, Number(value.toFixed(3))])),
    visualMetrics: {
      sceneGradeOpacity: parseFloat(sceneGrade.style.opacity || '0'),
      chargeRingOpacity: parseFloat(chargeRing.style.opacity || '0'),
      copyShieldOpacity: Number(copyShield.style.opacity || '0'),
      heroShadowIntensity: Number(DIRECTOR_STATE.heroShadowIntensity.toFixed(3)),
      contactShadowOpacity: Number(DIRECTOR_STATE.contactShadowOpacity.toFixed(3)),
      vortexLightIntensity: Number(vortexLight.intensity.toFixed(3)),
      sawGlowIntensity: Number(sawParticleGlow.intensity.toFixed(3)),
      floorBurstIntensity: Number(floorRimLight.intensity.toFixed(3)),
      volumetricOpacity: Number((sparkAuraCard.material.opacity + cloudAuraCard.material.opacity + vortexGlowPlane.material.opacity).toFixed(3)),
      blueMix: Number((floorRimLight.color.b + vortexGlowPlane.material.color.b + sparkAuraCard.material.color.b).toFixed(3)),
      bloomLayerIntensity: Number(simulatedParticleSystems.reduce((sum, system) => sum + system.bloomWeight, 0).toFixed(3)),
      scatterPassIntensity: Number(volumetricScatterIntensity.toFixed(3)),
      scatterShaftStepCount: getDesktopFxProfile().shaftStepCount,
      densityInCopyZone: Number(copyZoneDensity.toFixed(3)),
      magicPulseStrength: Number(magicPulseStrength.toFixed(3)),
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
  };
  };

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
    const storyPreset = getParticleStoryPreset();
    const signaturePreset = getParticleSignaturePreset();
    const releasePreset = getReleaseEnvelopePreset();
    const forcePreset = ACTIVE_FORCE_FIELDS;
    const vortexPreset = ACTIVE_VORTEX_FIELDS;

    const cx = VORTEX_PARAMS.centerX;
    const cy = VORTEX_PARAMS.centerY;
    const cz = VORTEX_PARAMS.centerZ;
    const proxTool = VORTEX_PARAMS.proximityTool;
    const proxStr = VORTEX_PARAMS.proximityStrength;

    const dragBoost = VORTEX_PARAMS.dragSpeciesBoost?.[speciesId] ?? 1;
    const speciesStoryBias = (storyPreset.speciesBias[speciesId] || 1) * dragBoost;
    const speciesForce = (speciesId === 'microDust' ? 0.88 : (speciesId === 'sparkFilament' ? 1.26 : (speciesId === 'flowRibbon' ? 1.18 : 1.0)))
      * stateEnvelope
      * speciesStoryBias
      * (0.84 + magicIntensity * 0.32);
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
    const seamOrbitAnchor = getToolLocalAnchor(
      wrenchGroup,
      vortexPreset.seamOrbit.offset.x,
      vortexPreset.seamOrbit.offset.y,
      vortexPreset.seamOrbit.offset.z,
      wrenchOrbitScratch
    );
    const counterPairA = getToolLocalAnchor(
      wrenchGroup,
      vortexPreset.counterPair[0].offset.x,
      vortexPreset.counterPair[0].offset.y,
      vortexPreset.counterPair[0].offset.z,
      wrenchPairScratchA
    );
    const counterPairB = getToolLocalAnchor(
      wrenchGroup,
      vortexPreset.counterPair[1].offset.x,
      vortexPreset.counterPair[1].offset.y,
      vortexPreset.counterPair[1].offset.z,
      wrenchPairScratchB
    );
    const seamStoryAnchor = getWrenchStoryAnchor(wrenchStoryAnchorScratch);
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
    const seamLane = [
      { x: seamStoryAnchor.x - 2.20, y: seamStoryAnchor.y + 1.68, z: seamStoryAnchor.z + 0.52 },
      { x: seamStoryAnchor.x - 1.18, y: seamStoryAnchor.y + 1.02, z: seamStoryAnchor.z + 0.32 },
      { x: seamStoryAnchor.x - 0.34, y: seamStoryAnchor.y + 0.38, z: seamStoryAnchor.z + 0.14 },
      { x: seamStoryAnchor.x, y: seamStoryAnchor.y, z: seamStoryAnchor.z },
    ];
    const seamOrbitLane = {
      x: seamStoryAnchor.x + 0.04,
      y: seamStoryAnchor.y + 0.06,
      z: seamStoryAnchor.z + 0.02,
      radius: 1.04 + signaturePreset.orbitLane * 0.18,
      pull: 0.92 + signaturePreset.seamLanePull * 0.10,
      spin: 1.18,
      zLift: 0.08,
    };
    const orbitCells = [
      { x: cx * 0.54 - 1.05, y: 1.2 + atmosphericPulse * 0.55, z: 0.92, radius: choreography.orbitRadius, pull: 1.0, spin: 1.0, zLift: 0.05 },
      { x: seamOrbitAnchor.x, y: seamOrbitAnchor.y, z: seamOrbitAnchor.z, radius: vortexPreset.seamOrbit.radius, pull: vortexPreset.seamOrbit.pull, spin: vortexPreset.seamOrbit.spin, zLift: vortexPreset.seamOrbit.zLift },
      { x: counterPairA.x, y: counterPairA.y, z: counterPairA.z, radius: vortexPreset.counterPair[0].radius, pull: vortexPreset.counterPair[0].pull, spin: vortexPreset.counterPair[0].spin, zLift: vortexPreset.counterPair[0].zLift },
      { x: counterPairB.x, y: counterPairB.y, z: counterPairB.z, radius: vortexPreset.counterPair[1].radius, pull: vortexPreset.counterPair[1].pull, spin: vortexPreset.counterPair[1].spin, zLift: vortexPreset.counterPair[1].zLift },
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

       vx += (forcePreset.globalWindShear.x + windDirX * forcePreset.globalWindShear.pointerGain * (0.52 + pointerWakeForce * 0.48)) * speciesForce * storyPreset.forceScale;
       vy += (forcePreset.globalWindShear.y + windDirY * forcePreset.globalWindShear.pointerGain * 0.22) * speciesForce * storyPreset.forceScale;
       vz += (forcePreset.globalWindShear.z + windDirZ * forcePreset.globalWindShear.pointerGain) * speciesForce * storyPreset.forceScale;

      const curl = sampleLocalCurl(px * 0.38, py * 0.38, pz * 0.38, now, i * 0.0027 + speciesForce);
      vx += curl.x * VORTEX_PARAMS.curlStrength * speciesForce * curlForce;
      vy += curl.y * VORTEX_PARAMS.curlStrength * speciesForce * 0.72 * curlForce;
      vz += curl.z * VORTEX_PARAMS.curlStrength * speciesForce * 0.9 * curlForce;

      const secondaryCurl = sampleLocalCurl(px * 0.18 + 2.4, py * 0.22 - 1.6, pz * 0.22, now * 0.92, i * 0.0013 + magicIntensity);
      vx += secondaryCurl.x * forcePreset.layeredCurl.secondary * speciesForce * (0.62 + storyPreset.ribbonOrbit * 0.28);
      vy += secondaryCurl.y * forcePreset.layeredCurl.secondary * speciesForce * 0.74;
      vz += secondaryCurl.z * forcePreset.layeredCurl.secondary * speciesForce * 0.82;
      const tertiaryCurl = sampleLocalCurl(px * 0.64 - 1.8, py * 0.14 + 0.8, pz * 0.44, now * 1.12, i * 0.0008 + SCENE_STATE.release);
      vx += tertiaryCurl.x * forcePreset.layeredCurl.tertiary * speciesForce * 0.82;
      vy += tertiaryCurl.y * forcePreset.layeredCurl.tertiary * speciesForce * 0.54;
      vz += tertiaryCurl.z * forcePreset.layeredCurl.tertiary * speciesForce * 0.74;

      const heatRise = (0.55 + system.temperatures[i] * 0.85 + Math.sin(now * 0.7 + system.speciesPhase[i]) * 0.08);
      vy += (VORTEX_PARAMS.upwardDrift + VORTEX_PARAMS.convectionStrength * heatRise) * speciesForce * convectionForce;
      vy -= forcePreset.floorDrag.gravity * speciesForce * (speciesId === 'sparkFilament' ? 0.52 : 1.0);

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
        const orbitStrength = choreography.orbitSpin * orbitField.spin * orbitField.influence * (0.42 + cohesion * 0.38 + SCENE_STATE.gather * 0.18 + storyPreset.ribbonOrbit * 0.34);
        vx += orbitField.tx * orbitStrength;
        vy += orbitField.ty * orbitStrength;
        vz += orbitField.tz * orbitStrength * 0.42;
        vx -= orbitField.nx * choreography.orbitPull * orbitField.pull * orbitField.influence * (0.34 + cohesion * 0.46 + storyPreset.wrenchAttractor * 0.24);
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
        const corridorLift = (0.84 + readabilityPressure * 0.74 + (speciesId === 'flowRibbon' ? 0.12 : 0)) * ACTIVE_COPY_CORRIDOR_GUARD.lateralSweep;
        const repel = VORTEX_PARAMS.titleRepelStrength * titleGuard * titleField.influence * readabilityDrive * (1.08 + readabilityPressure * 0.68) * ACTIVE_COPY_CORRIDOR_GUARD.repellerScale * storyPreset.copyCalm;
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
        if (titleField.influence > ACTIVE_COPY_CORRIDOR_GUARD.evacuationThreshold && copyZoneDensity > ACTIVE_COPY_CORRIDOR_GUARD.densityTarget) {
          const evacuation = (copyZoneDensity - ACTIVE_COPY_CORRIDOR_GUARD.densityTarget) * 3.2 * titleField.influence;
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
          const corridorSweep = (0.00084 + readabilityPressure * 0.00108 + corridorEvacuation * 0.00092 + signaturePreset.laneSweep * 0.00042)
            * copyField.influence
            * titleGuard
            * ACTIVE_COPY_CORRIDOR_GUARD.repellerScale
            * storyPreset.copyCalm;
          const lateralSign = px >= -0.35 ? 1 : -1;
          vx += lateralSign * corridorSweep * (speciesId === 'flowRibbon' ? 1.18 : 1.0);
          vy += corridorSweep * (0.92 + readabilityPressure * 0.72 + corridorEvacuation * 0.48);
          vz += corridorSweep * (0.28 + readabilityPressure * 0.18);
          vx += lateralSign * corridorSweep * signaturePreset.laneSweep * 0.64;
          wakeTarget = Math.max(wakeTarget, copyField.influence * 0.78);
          adhesionTarget *= 0.72;
          cohesion = Math.max(0.04, cohesion - copyField.influence * (0.04 + readabilityPressure * 0.04));
        }
      }

      if (speciesId !== 'sparkFilament') {
        const seamLaneField = samplePolylineField(
          px,
          py,
          pz,
          seamLane,
          choreography.laneRadius * (0.74 + signaturePreset.seamLanePull * 0.18 + (speciesId === 'flowRibbon' ? 0.18 : 0))
        );
        if (seamLaneField) {
          const laneFlow = choreography.laneFlow
            * speciesForce
            * (0.34 + signaturePreset.laneSweep * 0.58 + heroEmberLevel * 0.24)
            * (speciesId === 'flowRibbon' ? 1.22 : 0.88);
          vx += seamLaneField.tx * laneFlow * seamLaneField.influence;
          vy += seamLaneField.ty * laneFlow * seamLaneField.influence * (0.92 + signaturePreset.upliftColumn * 0.18);
          vz += seamLaneField.tz * laneFlow * seamLaneField.influence * 0.72;
          vx -= seamLaneField.nx * choreography.lanePull * (0.18 + signaturePreset.seamLanePull * 0.42) * seamLaneField.influence;
          vy -= seamLaneField.ny * choreography.lanePull * 0.72 * seamLaneField.influence;
          vz -= seamLaneField.nz * choreography.lanePull * 0.22 * seamLaneField.influence;
          wakeTarget = Math.max(wakeTarget, seamLaneField.influence * (0.64 + heroEmberLevel * 0.18));
          cohesion = clamp01(cohesion + seamLaneField.influence * 0.020);
        }

        const seamOrbitField = sampleOrbitCell(px, py, pz, seamOrbitLane);
        if (seamOrbitField) {
          const seamOrbitStrength = choreography.orbitSpin
            * seamOrbitField.spin
            * seamOrbitField.influence
            * (0.22 + signaturePreset.orbitLane * 0.56 + releaseEnvelope * 0.28)
            * (speciesId === 'flowRibbon' ? 1.18 : 0.86);
          vx += seamOrbitField.tx * seamOrbitStrength;
          vy += seamOrbitField.ty * seamOrbitStrength * 0.82;
          vz += seamOrbitField.tz * seamOrbitStrength * 0.46;
          vx -= seamOrbitField.nx * choreography.orbitPull * seamOrbitField.pull * seamOrbitField.influence * (0.18 + signaturePreset.seamLanePull * 0.34);
          vy -= seamOrbitField.ny * choreography.orbitPull * seamOrbitField.pull * seamOrbitField.influence * 0.74;
          vz -= seamOrbitField.nz * choreography.orbitPull * seamOrbitField.pull * seamOrbitField.influence * 0.24;
          wakeTarget = Math.max(wakeTarget, seamOrbitField.influence * (0.48 + signaturePreset.ribbonPersistence * 0.20));
        }

        const upliftColumn = sampleCapsuleField(
          px,
          py,
          pz,
          seamStoryAnchor.x + 0.06,
          seamStoryAnchor.y - 0.08,
          seamStoryAnchor.z - 0.30,
          seamStoryAnchor.x + 0.10,
          seamStoryAnchor.y + 2.18,
          seamStoryAnchor.z - 0.18,
          0.42,
          1.08
        );
        if (upliftColumn) {
          const upliftStrength = (0.00018 + signaturePreset.upliftColumn * 0.00054 + heroEmberLevel * 0.00016)
            * upliftColumn.influence
            * (speciesId === 'microDust' ? 0.92 : 1.0);
          vx += Math.sign(px - seamStoryAnchor.x || 1) * upliftStrength * 0.22;
          vy += upliftStrength * (1.12 + signaturePreset.upliftColumn * 0.26);
          vz -= upliftColumn.nz * upliftStrength * 0.18;
          wakeTarget = Math.max(wakeTarget, upliftColumn.influence * 0.52);
        }
      }

      if (py < VORTEX_PARAMS.floorHeight + 1.0) {
        const floorLift = clamp01(1 - (py - VORTEX_PARAMS.floorHeight) / 1.0);
        vx += macro.x * VORTEX_PARAMS.floorSkimStrength * floorLift;
        vz += macro.z * VORTEX_PARAMS.floorSkimStrength * floorLift;
        vy += floorLift * (0.00048 + forcePreset.floorDrag.lift);
        vx *= 1 - floorLift * forcePreset.floorDrag.drag;
        vz *= 1 - floorLift * forcePreset.floorDrag.drag * 0.82;
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
        const repel = forcePreset.toolDeflector.strength
          * deflectForce
          * field.influence
          * forcePreset.toolDeflector.wrap
          * ACTIVE_ENVIRONMENT_MAGIC.toolWrapStrength
          * signaturePreset.deflectorBoost;
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
        const hammerWake = choreography.toolWakeStrength * toolWakeState.hammer * hammerPlume.influence * 0.92;
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
        const wrenchBias = speciesId === 'flowRibbon' ? ACTIVE_ENVIRONMENT_MAGIC.wrenchRibbonBias : 1;
        const wrenchTwist = choreography.toolWakeStrength * toolWakeState.wrench * wrenchWake.influence * wrenchBias * (1 + ctaWakeStrength * ACTIVE_ENVIRONMENT_MAGIC.ctaWakePull);
        vx += wrenchWake.tx * wrenchTwist;
        vy += wrenchWake.ty * wrenchTwist;
        vz += wrenchWake.nz * wrenchTwist * 0.24;
        const seamPull = forcePreset.wrenchAttractor.pull
          * storyPreset.wrenchAttractor
          * wrenchWake.influence
          * (0.58 + magicIntensity * 0.38 + magicPulseStrength * 0.22 + heroEmberLevel * 0.18 + releaseEnvelope * 0.18);
        vx -= wrenchWake.nx * seamPull;
        vy -= wrenchWake.ny * seamPull * 0.82;
        vz -= wrenchWake.nz * seamPull * 0.22;
        wakeTarget = Math.max(wakeTarget, wrenchWake.influence * (0.54 + magicPulseStrength * 0.26));
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
        const sawWake = choreography.toolWakeStrength * toolWakeState.saw * sawWakeField.influence * ACTIVE_ENVIRONMENT_MAGIC.sawSparkBias;
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
      const seamFanDx = px - seamStoryAnchor.x;
      const seamFanDy = py - seamStoryAnchor.y;
      const seamFanDz = pz - seamStoryAnchor.z;
      const seamFanDist = Math.sqrt(seamFanDx * seamFanDx + seamFanDy * seamFanDy + seamFanDz * seamFanDz);
      if ((SCENE_STATE.release > 0.02 || releaseEnvelope > 0.06) && seamFanDist > 0.01 && seamFanDist < 2.5) {
        const seamFanInfluence = clamp01(1 - seamFanDist / 2.5);
        let fanDirX = seamFanDx / seamFanDist + 0.72;
        let fanDirY = seamFanDy / seamFanDist + 0.44 + signaturePreset.upliftColumn * 0.20;
        let fanDirZ = seamFanDz / seamFanDist + 0.18;
        const fanDirMag = Math.sqrt(fanDirX * fanDirX + fanDirY * fanDirY + fanDirZ * fanDirZ) || 1;
        fanDirX /= fanDirMag;
        fanDirY /= fanDirMag;
        fanDirZ /= fanDirMag;
        const releaseFanStrength = VORTEX_PARAMS.releaseSpread
          * releaseForce
          * seamFanInfluence
          * (0.32 + releaseEnvelope * (0.56 + releasePreset.fanGain) + signaturePreset.releaseFan * 0.32)
          * (speciesId === 'flowRibbon' ? 1.10 : (speciesId === 'sparkFilament' ? 1.24 : 0.92));
        vx += fanDirX * releaseFanStrength;
        vy += fanDirY * releaseFanStrength;
        vz += fanDirZ * releaseFanStrength * 0.72;
        wakeTarget = Math.max(wakeTarget, seamFanInfluence * (0.66 + releaseEnvelope * 0.22));
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
        const ribbonDrag = system.species.id === 'flowRibbon'
          ? THREE.MathUtils.lerp(1.0, 0.70, Math.min(1, signaturePreset.trailDecay + releaseEnvelope * 0.22))
          : 1.0;
        const trailEase = (0.14 + wake * 0.12 + adhesion * 0.08) * ribbonDrag;
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
    const storyPreset = getParticleStoryPreset();
    const seamAnchor = getWrenchStoryAnchor();
    const vortexBlend = clamp01(0.46 + DIRECTOR_STATE.revealMix * 0.26 + DIRECTOR_STATE.lockupMix * 0.18 - SCENE_STATE.pointerWake * 0.18 + magicPulseStrength * 0.12);
    atmosphereMetrics.vortex = sampleZoneDensity({
      x: THREE.MathUtils.lerp(VORTEX_PARAMS.centerX * 0.72, seamAnchor.x, vortexBlend),
      y: THREE.MathUtils.lerp(VORTEX_PARAMS.centerY * 0.72 + 0.4, seamAnchor.y + 0.08, vortexBlend),
      z: THREE.MathUtils.lerp(0.9, seamAnchor.z, vortexBlend * 0.72),
      rx: 2.0 + storyPreset.ribbonOrbit * 0.34,
      ry: 1.7 + storyPreset.wrenchAttractor * 0.28,
      rz: 1.2 + storyPreset.ribbonOrbit * 0.12,
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
function makeWorkshopSurfaceTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 256;
  const ctx = canvas.getContext('2d');
  const image = ctx.createImageData(256, 256);
  for (let i = 0; i < image.data.length; i += 4) {
    const noise = 176 + Math.floor(Math.random() * 44);
    const streak = (Math.floor((i / 4) / 256) % 17 === 0) ? 18 : 0;
    image.data[i] = noise + streak;
    image.data[i + 1] = noise + streak;
    image.data[i + 2] = noise + streak;
    image.data[i + 3] = 255;
  }
  ctx.putImageData(image, 0, 0);
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(10, 10);
  return texture;
}

// PBR Variation Texture Factories (Step 8.1)
function makeBrushedMetalTexture(size = 256) {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d');

  // Base gunmetal fill
  ctx.fillStyle = '#b4b8bc';
  ctx.fillRect(0, 0, size, size);

  // Horizontal streaks simulating directional brushing
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.08)';
  for (let i = 0; i < 70; i++) {
    const y = Math.random() * size;
    const width = 1 + Math.random() * 2;
    const alpha = 0.04 + Math.random() * 0.14;
    ctx.globalAlpha = alpha;
    ctx.lineWidth = width;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(size, y);
    ctx.stroke();
  }

  // Subtle radial vignette (darker toward edges)
  const gradient = ctx.createRadialGradient(size / 2, size / 2, size * 0.2, size / 2, size / 2, size * 0.8);
  gradient.addColorStop(0, 'rgba(255, 255, 255, 0)');
  gradient.addColorStop(1, 'rgba(0, 0, 0, 0.12)');
  ctx.globalAlpha = 1;
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(4, 4);
  return texture;
}

function makePatinaTexture(size = 256) {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d');

  // Dark oxidized base
  ctx.fillStyle = '#3c3c3c';
  ctx.fillRect(0, 0, size, size);

  // Patina spots (oxidation patches)
  for (let i = 0; i < 15; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    const radius = 8 + Math.random() * 14;
    const hue = 25 + Math.random() * 35; // copper to teal range
    const sat = 45 + Math.random() * 45;
    const light = 35 + Math.random() * 25;
    const alpha = 0.06 + Math.random() * 0.08;

    const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
    gradient.addColorStop(0, `hsla(${hue}, ${sat}%, ${light}%, ${alpha})`);
    gradient.addColorStop(1, `hsla(${hue}, ${sat}%, ${light - 10}%, 0)`);
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
  }

  // Coarse noise overlay
  const image = ctx.getImageData(0, 0, size, size);
  for (let i = 0; i < image.data.length; i += 4) {
    const noiseVal = (Math.random() - 0.5) * 16;
    image.data[i] += noiseVal;
    image.data[i + 1] += noiseVal;
    image.data[i + 2] += noiseVal;
  }
  ctx.putImageData(image, 0, 0);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(6, 6);
  return texture;
}

function makeRubberGripTexture(size = 256) {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d');

  // Base rubber gray
  ctx.fillStyle = '#505050';
  ctx.fillRect(0, 0, size, size);

  // Vertical knurl bands
  for (let x = 0; x < size; x += 8) {
    const isDark = Math.floor(x / 8) % 2 === 0;
    ctx.fillStyle = isDark ? '#474747' : '#585858';
    ctx.fillRect(x, 0, 8, size);
  }

  // Horizontal ridges (crosshatch knurl effect)
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.12)';
  ctx.lineWidth = 0.5;
  for (let y = 0; y < size; y += 14) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(size, y);
    ctx.stroke();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(2, 3);
  return texture;
}

function makeWoodGrainTexture(size = 256) {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d');

  // Base warm wood color
  ctx.fillStyle = '#6b4423';
  ctx.fillRect(0, 0, size, size);

  // Horizontal wood grain lines with noise
  for (let y = 0; y < size; y++) {
    const offset = Math.sin(y * 0.08 + Math.random() * 0.5) * 12;
    const lineColor = (y % 2 === 0) ? 180 : 200;
    ctx.fillStyle = `rgb(${lineColor}, ${lineColor * 0.8}, ${lineColor * 0.7})`;
    ctx.globalAlpha = 0.08;
    ctx.fillRect(offset, y, size - Math.abs(offset), 1);
  }

  // Darker vertical grain lines
  ctx.globalAlpha = 0.18;
  ctx.strokeStyle = '#3d2415';
  ctx.lineWidth = 0.8;
  for (let x = 0; x < size; x += 18 + Math.random() * 10) {
    const wobble = Math.sin(x * 0.05) * 8;
    ctx.beginPath();
    ctx.moveTo(x + wobble, 0);
    ctx.lineTo(x + wobble, size);
    ctx.stroke();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(1, 2);
  return texture;
}

// PBR Variation Maps Registry (Step 8.2)
const PBR_VARIATION_MAPS = {
  steel: null,
  chrome: null,
  rubber: null,
  wood: null,
  brass: null,
};

// Step 8.6 — Deferred assignment of variation maps to inline materials
function applyPBRVariationToInlineMaterials() {
  if (!PBR_VARIATION_MAPS || !PBR_VARIATION_MAPS.steel) return;

  // Steel roles
  if (PBR_VARIATION_MAPS.steel) {
    steelMat.roughnessMap = PBR_VARIATION_MAPS.steel;
    steelMat.metalnessMap = PBR_VARIATION_MAPS.steel;
    steelMat.roughness = 0.06;
    steelMat.needsUpdate = true;

    chromeMat.roughnessMap = PBR_VARIATION_MAPS.chrome;
    chromeMat.metalnessMap = PBR_VARIATION_MAPS.chrome;
    chromeMat.roughness = 0.01;
    chromeMat.needsUpdate = true;

    gunmetalMat.roughnessMap = PBR_VARIATION_MAPS.steel;
    gunmetalMat.needsUpdate = true;
  }

  // Rubber grip
  if (PBR_VARIATION_MAPS.rubber) {
    darkMat.roughnessMap = PBR_VARIATION_MAPS.rubber;
    darkMat.roughness = 0.68;
    darkMat.needsUpdate = true;
  }

  // Wood handle
  if (PBR_VARIATION_MAPS.wood) {
    woodMat.roughnessMap = PBR_VARIATION_MAPS.wood;
    woodMat.roughness = 0.78;
    woodMat.needsUpdate = true;
  }
}

function buildPBRVariationMaps() {
  if (!PBR_VARIATION_MAPS) return;
  PBR_VARIATION_MAPS.steel = makeBrushedMetalTexture(256);
  PBR_VARIATION_MAPS.chrome = makeBrushedMetalTexture(256);
  PBR_VARIATION_MAPS.rubber = makeRubberGripTexture(256);
  PBR_VARIATION_MAPS.wood = makeWoodGrainTexture(256);
  PBR_VARIATION_MAPS.brass = makePatinaTexture(256);
  applyPBRVariationToInlineMaterials();
}

// Gate PBR maps to desktop/mobile tiers only
if (SCENE_CONFIG.qualityTier !== 'low') {
  buildPBRVariationMaps();
}

const workshopSurfaceTex = makeWorkshopSurfaceTexture();
const floorPlane = new THREE.Mesh(
  new THREE.PlaneGeometry(28, 28, 1, 1),
  new THREE.MeshStandardMaterial({
    ...MATERIAL_PROFILE_PRESETS[ACTIVE_MATERIAL_PROFILE].floor,
    roughnessMap: workshopSurfaceTex,
    metalnessMap: workshopSurfaceTex,
    bumpMap: workshopSurfaceTex,
    bumpScale: 0.018,
  })
);
floorPlane.rotation.x = -Math.PI / 2;
floorPlane.position.y = -2.55;
floorPlane.receiveShadow = true;
scene.add(floorPlane);

const contactShadowCanvas = document.createElement('canvas');
contactShadowCanvas.width = contactShadowCanvas.height = 256;
const contactShadowCtx = contactShadowCanvas.getContext('2d');
const contactShadowGradient = contactShadowCtx.createRadialGradient(128, 128, 12, 128, 128, 114);
contactShadowGradient.addColorStop(0.0, 'rgba(8, 9, 12, 0.78)');
contactShadowGradient.addColorStop(0.38, 'rgba(8, 9, 12, 0.44)');
contactShadowGradient.addColorStop(0.72, 'rgba(8, 9, 12, 0.14)');
contactShadowGradient.addColorStop(1.0, 'rgba(8, 9, 12, 0.0)');
contactShadowCtx.fillStyle = contactShadowGradient;
contactShadowCtx.fillRect(0, 0, 256, 256);
const contactShadowTex = new THREE.CanvasTexture(contactShadowCanvas);

function makeContactShadow(width, height) {
  return new THREE.Mesh(
    new THREE.PlaneGeometry(width, height),
    new THREE.MeshBasicMaterial({
      map: contactShadowTex,
      color: 0x050608,
      transparent: true,
      opacity: 0,
      depthWrite: false,
    })
  );
}

const wrenchContactShadow = makeContactShadow(4.2, 2.6);
wrenchContactShadow.rotation.x = -Math.PI / 2;
wrenchContactShadow.position.set(2.15, -2.50, 1.95);
scene.add(wrenchContactShadow);

const hammerContactShadow = makeContactShadow(2.8, 1.8);
hammerContactShadow.rotation.x = -Math.PI / 2;
hammerContactShadow.position.set(-3.0, -2.50, 1.2);
scene.add(hammerContactShadow);

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

function makeWorldMaskTexture(mode = 'silhouette') {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 256;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, 256, 256);
  if (mode === 'silhouette') {
    const base = ctx.createRadialGradient(128, 162, 28, 128, 162, 118);
    base.addColorStop(0.0, 'rgba(255,255,255,0.96)');
    base.addColorStop(0.38, 'rgba(255,255,255,0.68)');
    base.addColorStop(0.74, 'rgba(255,255,255,0.20)');
    base.addColorStop(1.0, 'rgba(255,255,255,0.0)');
    ctx.fillStyle = base;
    ctx.fillRect(0, 0, 256, 256);
    const topFade = ctx.createLinearGradient(0, 0, 0, 256);
    topFade.addColorStop(0.0, 'rgba(255,255,255,0.0)');
    topFade.addColorStop(0.48, 'rgba(255,255,255,0.12)');
    topFade.addColorStop(1.0, 'rgba(255,255,255,0.52)');
    ctx.fillStyle = topFade;
    ctx.fillRect(0, 0, 256, 256);
  } else if (mode === 'hanging') {
    const shaft = ctx.createLinearGradient(0, 0, 0, 256);
    shaft.addColorStop(0.0, 'rgba(255,255,255,0.02)');
    shaft.addColorStop(0.16, 'rgba(255,255,255,0.36)');
    shaft.addColorStop(0.82, 'rgba(255,255,255,0.72)');
    shaft.addColorStop(1.0, 'rgba(255,255,255,0.06)');
    ctx.fillStyle = shaft;
    ctx.fillRect(90, 0, 76, 256);
    const halo = ctx.createRadialGradient(128, 94, 12, 128, 94, 72);
    halo.addColorStop(0.0, 'rgba(255,255,255,0.58)');
    halo.addColorStop(0.58, 'rgba(255,255,255,0.22)');
    halo.addColorStop(1.0, 'rgba(255,255,255,0.0)');
    ctx.fillStyle = halo;
    ctx.fillRect(0, 0, 256, 170);
  } else {
    const occluder = ctx.createLinearGradient(0, 0, 0, 256);
    occluder.addColorStop(0.0, 'rgba(255,255,255,0.0)');
    occluder.addColorStop(0.30, 'rgba(255,255,255,0.28)');
    occluder.addColorStop(0.76, 'rgba(255,255,255,0.86)');
    occluder.addColorStop(1.0, 'rgba(255,255,255,0.98)');
    ctx.fillStyle = occluder;
    ctx.fillRect(0, 0, 256, 256);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  return texture;
}

const silhouetteTex = makeWorldMaskTexture('silhouette');
const hangingDepthTex = makeWorldMaskTexture('hanging');
const occluderTex = makeWorldMaskTexture('occluder');

// Step 9.1 — Haze lane textures and cards
function makeHazeLaneTexture(angle = 'left') {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');

  // Base transparent background
  ctx.fillStyle = 'rgba(0, 0, 0, 0)';
  ctx.fillRect(0, 0, 128, 512);

  // Directional linear gradient along the long axis
  const gradient = ctx.createLinearGradient(0, 0, 0, 512);
  const amberColor = 'rgba(255, 200, 140, ';
  gradient.addColorStop(0, amberColor + '0)');
  gradient.addColorStop(0.4, amberColor + '0.18)');
  gradient.addColorStop(0.5, amberColor + '0.28)');
  gradient.addColorStop(0.6, amberColor + '0.18)');
  gradient.addColorStop(1, amberColor + '0)');

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 128, 512);

  // Inner core lane (narrower, higher alpha)
  const coreGradient = ctx.createLinearGradient(0, 0, 0, 512);
  coreGradient.addColorStop(0.2, 'rgba(255, 220, 160, 0)');
  coreGradient.addColorStop(0.35, 'rgba(255, 220, 160, 0.32)');
  coreGradient.addColorStop(0.65, 'rgba(255, 220, 160, 0.32)');
  coreGradient.addColorStop(0.8, 'rgba(255, 220, 160, 0)');

  ctx.fillStyle = coreGradient;
  ctx.fillRect(32, 0, 64, 512);

  // Horizontal noise streaks to break up banding
  for (let i = 0; i < 7; i++) {
    const y = Math.random() * 512;
    ctx.strokeStyle = `rgba(255, 255, 255, ${0.02 + Math.random() * 0.03})`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(128, y);
    ctx.stroke();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  return texture;
}

const hazeLaneLeftTex = makeHazeLaneTexture('left');
const hazeLaneRightTex = makeHazeLaneTexture('right');

// Step 9.2 — Particulate stream texture
function makeParticulateStreamTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 256;
  const ctx = canvas.getContext('2d');

  // Base transparent
  ctx.fillStyle = 'rgba(0, 0, 0, 0)';
  ctx.fillRect(0, 0, 256, 256);

  // Scattered warm-gray dots with directional streaks
  ctx.fillStyle = 'rgba(220, 200, 170, ';
  for (let i = 0; i < 250; i++) {
    const x = Math.random() * 256;
    const y = Math.random() * 256;
    const size = 1.5 + Math.random() * 1;
    const alpha = 0.08 + Math.random() * 0.14;

    ctx.globalAlpha = alpha;
    // Dot
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fill();

    // Directional streak (motion blur simulation)
    ctx.globalAlpha = alpha * 0.5;
    ctx.fillRect(x, y - 2, 1, 4);
  }

  ctx.globalAlpha = 1;
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(1.5, 3);
  return texture;
}

const particulateStreamTex = makeParticulateStreamTexture();

function makeWorldCard(width, height, {
  map = null,
  color = 0xffffff,
  opacity = 0,
  blending = THREE.NormalBlending,
  renderOrder = 990,
  depthTest = false,
} = {}) {
  const mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(width, height),
    new THREE.MeshBasicMaterial({
      map,
      color,
      transparent: true,
      opacity,
      blending,
      depthWrite: false,
      depthTest,
      side: THREE.DoubleSide,
    })
  );
  mesh.renderOrder = renderOrder;
  return mesh;
}

const rearForgeHazeCard = makeWorldCard(10.8, 7.2, {
  map: beamTex,
  color: 0xff9554,
  blending: THREE.AdditiveBlending,
  renderOrder: 992,
});
rearForgeHazeCard.position.set(2.2, 1.1, -3.8);
scene.add(rearForgeHazeCard);

const coolBackscatterCard = makeWorldCard(8.4, 6.8, {
  map: beamTex,
  color: 0x6b9df4,
  blending: THREE.AdditiveBlending,
  renderOrder: 991,
});
coolBackscatterCard.position.set(1.0, 1.9, -4.2);
scene.add(coolBackscatterCard);

const rearSilhouettePrimary = makeWorldCard(5.2, 4.8, {
  map: silhouetteTex,
  color: 0x05070b,
  renderOrder: 986,
});
rearSilhouettePrimary.position.set(2.9, -0.34, -3.3);
rearSilhouettePrimary.rotation.set(0.04, -0.18, 0.03);
scene.add(rearSilhouettePrimary);

const rearSilhouetteSecondary = makeWorldCard(3.4, 3.4, {
  map: silhouetteTex,
  color: 0x06080d,
  renderOrder: 985,
});
rearSilhouetteSecondary.position.set(1.3, 0.26, -4.1);
rearSilhouetteSecondary.rotation.set(-0.02, 0.10, -0.02);
scene.add(rearSilhouetteSecondary);

const benchOccluderCard = makeWorldCard(9.2, 2.6, {
  map: occluderTex,
  color: 0x05070b,
  renderOrder: 984,
});
benchOccluderCard.position.set(2.5, -1.88, -2.8);
benchOccluderCard.rotation.set(-0.10, -0.08, 0.0);
scene.add(benchOccluderCard);

const hangingDepthCard = makeWorldCard(1.2, 6.8, {
  map: hangingDepthTex,
  color: 0x101722,
  renderOrder: 987,
});
hangingDepthCard.position.set(3.85, 1.52, -3.1);
hangingDepthCard.rotation.set(0.02, -0.14, 0.02);
scene.add(hangingDepthCard);

// Step 9.1 — Haze lane depth cards
const hazeLaneLeft = makeWorldCard(3.2, 9.4, {
  map: hazeLaneLeftTex,
  color: 0xffa86a,
  blending: THREE.AdditiveBlending,
  renderOrder: 989,
});
hazeLaneLeft.position.set(-1.8, 0.8, -2.6);
hazeLaneLeft.rotation.set(0.06, 0.22, -0.12);
scene.add(hazeLaneLeft);

const hazeLaneRight = makeWorldCard(2.6, 8.2, {
  map: hazeLaneRightTex,
  color: 0xffb880,
  blending: THREE.AdditiveBlending,
  renderOrder: 988,
});
hazeLaneRight.position.set(3.4, 1.2, -3.0);
hazeLaneRight.rotation.set(-0.04, -0.18, 0.08);
scene.add(hazeLaneRight);

// Step 9.2 — Particulate stream card
const particulateStreamCard = makeWorldCard(8, 10, {
  map: particulateStreamTex,
  color: 0xd4c8b8,
  blending: THREE.NormalBlending,
  renderOrder: 985,
});
particulateStreamCard.position.set(0.2, 1.4, -2.2);
scene.add(particulateStreamCard);

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
  hammerGroup.visible = SUPPORT_PROPS_ACTIVE;
  scene.add(hammerGroup);

  /* ─── All tool groups for traversal (wrench+saw parts pushed in after GLB load) ── */
  const allToolParts = [...hammerParts];
  const proceduralHammerParts = hammerParts.slice();
  toolAssetProfile.hammer = SUPPORT_PROPS_ACTIVE ? 'procedural' : 'disabled';

  /* ─── Wrench + Saw groups (populated after GLB load) ────── */
  const wrenchGroup = new THREE.Group();
  const wrenchParts = [];
  wrenchGroup.rotation.z = -0.15;
  wrenchGroup.rotation.y = 0.18;
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
    toolAssetSource.wrench = 'procedural';
    toolAssetFingerprint.wrench = null;
    toolAssetProfile.wrench = 'procedural';
    updateAssetMode();
    addHeroToolAccents('wrench');
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
    toolAssetSource.saw = 'procedural';
    toolAssetFingerprint.saw = null;
    toolAssetProfile.saw = 'procedural';
    updateAssetMode();
    addHeroToolAccents('saw');
    sawGroup.visible = SUPPORT_PROPS_ACTIVE;
  }

  /* ─── GLB loaders ─────────────────────────────────────── */
  function updateAssetMode() {
    syncHeroAssetVerification();
    const sources = Object.values(toolAssetSource);
    const heroCount = sources.filter((source) => source === 'hero-glb').length;
    const legacyCount = sources.filter((source) => source === 'legacy-glb').length;
    const proceduralCount = sources.filter((source) => source === 'procedural').length;
    const primaryHeroLoaded = REQUIRED_HERO_TOOL_IDS.every((toolId) => toolAssetSource[toolId] === 'hero-glb');

    if (primaryHeroLoaded) {
      assetMode = 'hero-primary';
      assetSetVersion = heroAssetManifest?.assetSetVersion || ACTIVE_ASSET_PROFILE.version;
      if (heroAssetVerification.finalReady) {
        heroAssetVariant = heroAssetVerification.manifestVariant || ACTIVE_ASSET_PROFILE.variant || 'final';
      } else if (heroAssetVerification.packVerified) {
        heroAssetVariant = heroAssetVerification.manifestVariant || ACTIVE_ASSET_PROFILE.variant || 'final';
      } else {
        heroAssetVariant = 'unverified-primary';
      }
      return;
    }
    if (heroCount > 0) {
      assetMode = 'hero-hybrid';
      assetSetVersion = `${heroAssetManifest?.assetSetVersion || ACTIVE_ASSET_PROFILE.version}-fallback`;
      heroAssetVariant = `${heroAssetVerification.manifestVariant || ACTIVE_ASSET_PROFILE.variant || 'final'}-fallback`;
      return;
    }
    if (legacyCount > 0 && proceduralCount === 0) {
      assetMode = 'legacy-glb';
      assetSetVersion = 'legacy-glb';
      heroAssetVariant = 'legacy-fallback';
      return;
    }
    if (legacyCount > 0 || proceduralCount > 0) {
      assetMode = 'fallback-hybrid';
      assetSetVersion = `${ACTIVE_ASSET_PROFILE.version}-fallback`;
      heroAssetVariant = 'mixed-fallback';
      return;
    }
    assetMode = 'procedural';
    assetSetVersion = 'procedural';
    heroAssetVariant = 'procedural-fallback';
  }

  function hideProceduralParts(parts) {
    parts.forEach((mesh) => {
      mesh.visible = false;
    });
  }

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

  function _addGLBToGroup(gltf, targetGroup, partsList, targetSize, assetMeta = null) {
    const model = gltf.scene;
    const calibration = assetMeta?.manifestEntry?.calibration || null;
    const preserveAuthoredOrigin = calibration?.originMode === 'authored-origin';
    const resolvedTargetSize = calibration?.targetSize || targetSize;

    // Scale to fit targetSize in the largest dimension
    const box = new THREE.Box3().setFromObject(model);
    const size = box.getSize(new THREE.Vector3());
    model.scale.setScalar(resolvedTargetSize / Math.max(size.x, size.y, size.z));

    if (!preserveAuthoredOrigin) {
      // Center legacy/fallback imports within the group.
      box.setFromObject(model);
      const center = box.getCenter(new THREE.Vector3());
      model.position.sub(center);
    } else {
      model.position.set(0, 0, 0);
    }

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
    const isHeroWrench = targetGroup === wrenchGroup;
    model.userData.spreadPos = new THREE.Vector3(
      (Math.random() - 0.5) * (isHeroWrench ? 1.5 : 2.8),
      (Math.random() - 0.5) * (isHeroWrench ? 1.8 : 2.8),
      (Math.random() - 0.5) * (isHeroWrench ? 0.8 : 1.3)
    );
    model.userData.spreadRot = { x: Math.random() * Math.PI, y: Math.random() * Math.PI, z: 0 };
    model.userData.assemblyDelay = isHeroWrench ? 40 : 160 + Math.random() * 120;
    model.position.copy(model.userData.spreadPos);

    targetGroup.add(model);
    partsList.push(model);
    allToolParts.push(model);
    return model;
  }

  function populateHammerFromGLB(gltf, sourceLabel = 'hero-glb', assetMeta = null) {
    hideProceduralParts(proceduralHammerParts);
    const model = _addGLBToGroup(gltf, hammerGroup, hammerParts, 2.2, assetMeta);
    applyImportedToolMaterials(model, 'hammer', assetMeta);
    addHeroToolAccents('hammer');
    hammerGroup.visible = SUPPORT_PROPS_ACTIVE;
    toolAssetSource.hammer = sourceLabel;
    toolAssetFingerprint.hammer = assetMeta?.fingerprint || null;
    updateAssetMode();
  }

  function populateWrenchFromGLB(gltf, sourceLabel = 'hero-glb', assetMeta = null) {
    const model = _addGLBToGroup(gltf, wrenchGroup, wrenchParts, 2.2, assetMeta);
    applyImportedToolMaterials(model, 'wrench', assetMeta);
    if (assetMeta?.manifestEntry?.provenance !== 'external-processed') {
      addHeroToolAccents('wrench');
    }
    wrenchGroup.visible = true;
    toolAssetSource.wrench = sourceLabel;
    toolAssetFingerprint.wrench = assetMeta?.fingerprint || null;

    const bounds = new THREE.Mesh(
      new THREE.BoxGeometry(1.2, 2.5, 0.6),
      new THREE.MeshBasicMaterial({ visible: false })
    );
    bounds.userData.toolId = 'wrench';
    wrenchGroup.add(bounds);
    updateAssetMode();
  }

  function populateSawFromGLB(gltf, sourceLabel = 'hero-glb', assetMeta = null) {
    const model = _addGLBToGroup(gltf, sawGroup, sawParts, 2.0, assetMeta);
    applyImportedToolMaterials(model, 'saw', assetMeta);
    addHeroToolAccents('saw');
    sawGroup.visible = SUPPORT_PROPS_ACTIVE;
    toolAssetFingerprint.saw = assetMeta?.fingerprint || null;

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
    toolAssetSource.saw = sourceLabel;
    updateAssetMode();
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
    heroAssetManifest = await fetchJsonSafe(ACTIVE_ASSET_PROFILE.manifest);
    syncHeroAssetVerification();
    let loaded = 0;
    const loadPlan = SUPPORT_PROPS_ACTIVE
      ? ['hammer', 'wrench', 'saw']
      : ['wrench'];
    const total = loadPlan.length;
    const commitLoad = () => {
      loaded += 1;
      window.__preloaderProgress?.(Math.round(10 + (loaded / total) * 80));
    };
    window.__preloaderProgress?.(10); // signal start
    const loadHeroTool = async (toolId, onPopulate, fallbackBuilder) => {
      const preferredUrl = ACTIVE_ASSET_PROFILE.preferred[toolId];
      const legacyUrl = ACTIVE_ASSET_PROFILE.legacy[toolId];
      const manifestEntry = getManifestToolEntry(toolId);
      try {
        const heroAsset = await loadGltfAsset(loader, preferredUrl);
        onPopulate(heroAsset.gltf, 'hero-glb', { ...heroAsset, manifestEntry });
      } catch (heroErr) {
        if (legacyUrl) {
          try {
            const legacyAsset = await loadGltfAsset(loader, legacyUrl);
            onPopulate(legacyAsset.gltf, 'legacy-glb', { ...legacyAsset, manifestEntry: null });
          } catch (legacyErr) {
            fallbackBuilder?.();
          }
        } else {
          fallbackBuilder?.();
        }
      } finally {
        commitLoad();
      }
    };

    const tasks = [loadHeroTool('wrench', populateWrenchFromGLB, buildProceduralWrench)];
    if (SUPPORT_PROPS_ACTIVE) {
      tasks.push(loadHeroTool('hammer', populateHammerFromGLB, null));
      tasks.push(loadHeroTool('saw', populateSawFromGLB, buildProceduralSaw));
    }

    await Promise.all(tasks);
    updateAssetMode();
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
      title: 'FORGED CLAW HAMMER', sub: '20 oz Blackened Steel',
      desc: 'Framing · Finish Work\nNailing · Pulling',
      hint: 'Click to inspect  ·  drag to stir the field',
      specs: { Weight: '20 oz', Handle: 'Oil-dark Grip', Head: 'Forged Steel', Length: '16 in' },
      apps: ['Framing & Finish Work', 'Nailing & Pulling'],
      cta: 'Get a Quote',
    },
    wrench: {
      title: 'PIPE WRENCH', sub: '14" Forged Body',
      desc: 'Plumbing · Fastening\nRepair · Installation',
      hint: 'Click to inspect  ·  drag to stir the field',
      specs: { Length: '14 in', Jaw: 'Serrated Steel', Material: 'Forged Alloy', Finish: 'Brushed Chrome' },
      apps: ['Plumbing & Fastening', 'Repair & Installation'],
      cta: 'Get a Quote',
    },
    saw: {
      title: 'HANDSAW', sub: 'Crosscut Workshop Finish',
      desc: 'Trim · Carpentry\nRepair · Fine Cuts',
      hint: 'Click to inspect  ·  drag to stir the field',
      specs: { Length: '20 in', Teeth: 'Hardened Steel', Grip: 'Oil-dark Handle', Finish: 'Satin Blade' },
      apps: ['Trim & Carpentry', 'Repair & Fine Cuts'],
      cta: 'Get a Quote',
    },
  };

  /* ─── Blueprint info panel ────────────────────────────── */
  const infoPanel = document.createElement('div');
  infoPanel.id = 'tool-info-panel';
  Object.assign(infoPanel.style, {
    position: 'fixed',
    left: '0',
    top: '0',
    transform: 'translate3d(-999px, -999px, 0) scale(0.92)',
    width: '292px',
    maxWidth: 'min(292px, calc(100vw - 20px))',
    background: 'linear-gradient(180deg, rgba(24,19,14,0.96), rgba(10,10,10,0.97))',
    border: '1px solid rgba(202,150,78,0.30)',
    borderRadius: '20px',
    padding: '0',
    zIndex: '9998',
    fontFamily: 'var(--font-body)',
    fontSize: '12px',
    lineHeight: '1.7',
    letterSpacing: '0.01em',
    color: 'rgba(237, 218, 188, 0.86)',
    transition: 'none',
    pointerEvents: 'auto',
    overflow: 'hidden',
    opacity: '0',
    visibility: 'hidden',
  });
  document.body.appendChild(infoPanel);

  let activePanelTool = null;
  let activePanelAnchor = { x: 0, y: 0 };
  let panelTestLock = false;

  function panelRect(left, top, width, height) {
    return { left, top, right: left + width, bottom: top + height, width, height };
  }

  function overlapArea(a, b) {
    const width = Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left));
    const height = Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top));
    return width * height;
  }

  function positionInfoPanel(toolId, screenX, screenY) {
    const fallbackX = Number.isFinite(screenX) ? screenX : (orbitLayoutState.centerScreen.x || window.innerWidth * 0.72);
    const fallbackY = Number.isFinite(screenY) ? screenY : (orbitLayoutState.centerScreen.y || window.innerHeight * 0.5);
    const bounds = orbitLayoutState.projectedToolBounds[toolId] || panelRect(fallbackX - 40, fallbackY - 40, 80, 80);
    const navRect = getNavSafeZoneRect();
    const readabilityRect = readabilityWindow.active
      ? panelRect(readabilityWindow.left, readabilityWindow.top, readabilityWindow.width, readabilityWindow.height)
      : panelRect(-9999, -9999, 0, 0);
    const protectedRects = getRelevantProtectedZoneRects().map(([, zone]) => zone);
    const viewportPad = 12;
    const panelWidth = Math.min(window.innerWidth - viewportPad * 2, infoPanel.offsetWidth || 292);
    const panelHeight = Math.min(window.innerHeight - viewportPad * 2, infoPanel.offsetHeight || 320);
    const isMobilePanel = window.innerWidth < 768;

    if (isMobilePanel) {
      const left = Math.max(viewportPad, (window.innerWidth - panelWidth) * 0.5);
      const top = Math.max(viewportPad, window.innerHeight - panelHeight - 14);
      infoPanel.style.left = `${left}px`;
      infoPanel.style.top = `${top}px`;
      infoPanel.style.width = `${panelWidth}px`;
      infoPanel.style.maxWidth = `${panelWidth}px`;
      infoPanel.style.transform = 'translate3d(0, 0, 0) scale(1)';
      infoPanel.style.opacity = '1';
      infoPanel.style.visibility = 'visible';
      return;
    }

    const candidates = [
      { left: bounds.right + 28, top: bounds.top - panelHeight * 0.10 },
      { left: bounds.left - panelWidth - 28, top: bounds.top - panelHeight * 0.10 },
      { left: bounds.left + (bounds.width - panelWidth) * 0.5, top: bounds.top - panelHeight - 24 },
      { left: bounds.left + (bounds.width - panelWidth) * 0.5, top: bounds.bottom + 24 },
      { left: bounds.right + 22, top: bounds.bottom - panelHeight },
      { left: bounds.left - panelWidth - 22, top: bounds.bottom - panelHeight },
    ];
    let best = null;
    let bestClear = null;
    let bestPenalty = Number.POSITIVE_INFINITY;
    let bestClearPenalty = Number.POSITIVE_INFINITY;

    for (const candidate of candidates) {
      const left = THREE.MathUtils.clamp(candidate.left, viewportPad, window.innerWidth - panelWidth - viewportPad);
      const top = THREE.MathUtils.clamp(candidate.top, viewportPad, window.innerHeight - panelHeight - viewportPad);
      const rect = panelRect(left, top, panelWidth, panelHeight);
      const objectOverlap = overlapArea(rect, bounds);
      const navOverlap = overlapArea(rect, navRect);
      const readabilityOverlap = overlapArea(rect, readabilityRect);
      const protectedOverlap = protectedRects.reduce((sum, zone) => sum + overlapArea(rect, zone), 0);
      const penalty = objectOverlap * 5200 + navOverlap * 3200 + readabilityOverlap * 180 + protectedOverlap * 220;
      if (objectOverlap === 0 && navOverlap === 0) {
        if (penalty < bestClearPenalty) {
          bestClearPenalty = penalty;
          bestClear = rect;
        }
      }
      if (penalty < bestPenalty) {
        bestPenalty = penalty;
        best = rect;
      }
    }

    const targetRect = bestClear || best || panelRect(
      THREE.MathUtils.clamp(fallbackX + 18, viewportPad, window.innerWidth - panelWidth - viewportPad),
      THREE.MathUtils.clamp(fallbackY - panelHeight * 0.15, viewportPad, window.innerHeight - panelHeight - viewportPad),
      panelWidth,
      panelHeight
    );
    infoPanel.style.left = `${targetRect.left}px`;
    infoPanel.style.top = `${targetRect.top}px`;
    infoPanel.style.width = `${targetRect.width}px`;
    infoPanel.style.maxWidth = `${targetRect.width}px`;
    infoPanel.style.transform = 'translate3d(0, 0, 0) scale(1)';
    infoPanel.style.opacity = '1';
    infoPanel.style.visibility = 'visible';
  }

  function updateActivePanelPosition() {
    if (!activePanelTool) return;
    const screen = projectWorldToScreen(
      getToolGroup(activePanelTool).position.x,
      getToolGroup(activePanelTool).position.y,
      getToolGroup(activePanelTool).position.z
    );
    activePanelAnchor = screen;
    positionInfoPanel(activePanelTool, screen.x, screen.y);
  }

  function openPanel(toolId, screenX, screenY) {
    if (!panelTestLock && !isDirectorInteractive()) return;
    const info = toolInfo[toolId];
    if (!info) return;
    activePanelTool = toolId;
    activePanelAnchor = {
      x: Number.isFinite(screenX) ? screenX : (orbitLayoutState.centerScreen.x || window.innerWidth * 0.72),
      y: Number.isFinite(screenY) ? screenY : (orbitLayoutState.centerScreen.y || window.innerHeight * 0.5),
    };

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
      window.dispatchEvent(new CustomEvent('hero:cta-wake', { detail: { active: true, source: 'tool-panel' } }));
    });
    cta.addEventListener('mouseleave', () => {
      cta.style.boxShadow = '0 14px 28px rgba(159,95,29,0.28)';
      cta.style.transform = 'translateY(0)';
      window.dispatchEvent(new CustomEvent('hero:cta-wake', { detail: { active: false, source: 'tool-panel' } }));
    });
    cta.addEventListener('focus', () => {
      window.dispatchEvent(new CustomEvent('hero:cta-wake', { detail: { active: true, source: 'tool-panel' } }));
    });
    cta.addEventListener('blur', () => {
      window.dispatchEvent(new CustomEvent('hero:cta-wake', { detail: { active: false, source: 'tool-panel' } }));
    });
    cta.addEventListener('click', () => {
      window.dispatchEvent(new CustomEvent('hero:magic-pulse', {
        detail: { source: 'tool-panel-cta', strength: 0.20, durationMs: 760, anchorTool: HERO_FOCUS_TOOL, sparkCount: 0 },
      }));
    });
    body.appendChild(cta);

    infoPanel.appendChild(body);

    positionInfoPanel(toolId, activePanelAnchor.x, activePanelAnchor.y);
  }

  function closePanel(force = false) {
    if (panelTestLock && !force) return;
    activePanelTool = null;
    infoPanel.style.opacity = '0';
    infoPanel.style.visibility = 'hidden';
    infoPanel.style.transform = 'translate3d(-999px, -999px, 0) scale(0.92)';
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
  const hoverEnvBoost = { hammer: 0, wrench: 0, saw: 0 };

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
    queueSceneDirectorFallback();
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
    const canInteractNow = isDirectorInteractive();
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

    if (!canInteractNow) {
      hoveredTool = null;
      canvas.style.cursor = 'default';
      hideTooltip();
    } else if (hits.length > 0) {
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
    if (moveDelta > 5 && canInteractNow) markInteraction(SCENE_CONFIG.interaction.moveBoost);
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
      queueMagicPulse({ strength: 0.22, durationMs: 820, source: 'touch-charge', sparkCount: 0 });
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
        queueMagicPulse({ strength: 0.20, durationMs: 760, source: 'touch-tap', sparkCount: 0 });
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
  function handleToolClick(toolId, screenX, screenY) {
    if (!isDirectorInteractive()) return;
    markInteraction(SCENE_CONFIG.interaction.toolClickBoost);
    triggerReleasePulse(0.24, 680);
    queueMagicPulse({ strength: 0.20, durationMs: 760, source: `tool-click:${toolId}`, anchorTool: toolId === 'wrench' ? 'wrench' : HERO_FOCUS_TOOL, sparkCount: 0 });

    // Panel toggle
    if (activePanelTool === toolId) {
      closePanel();
    } else {
      openPanel(toolId, screenX, screenY);
    }
    emitSparks(getToolGroup(toolId).position.x, getToolGroup(toolId).position.y, toolId === 'wrench' ? 0x8bcfff : 0xffb25f, toolId === 'saw' ? 12 : 9);
  }

  let canvasLastClickTime = 0;
  canvas.addEventListener('click', (e) => {
    if (!isDirectorInteractive()) {
      closePanel();
      return;
    }
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
      // Seam-anchored click pulse — focus energy at wrench anchor
      const anchor = getWrenchStoryAnchor();
      emitSparks(anchor.x, anchor.y);
      // Apply vortex shockwave + implosion pull-back
      clickWorldPos = anchor;
      focusVortexAt(anchor);
      applyPulseShockwave(anchor);
      implosionActive = true;
      implosionStart = performance.now();
      triggerReleasePulse(0.62, 920);
      queueMagicPulse({ strength: 0.34, durationMs: 1100, source: 'canvas-click', anchorTool: 'wrench', sparkCount: 8 });
    }
  });

  /* ─── Drag-to-rotate tools ────────────────────────────── */
  let dragTool = null, dragStartX = 0, dragBaseRotY = 0;
  let dragVel = 0, dragLastX = 0, dragLastT = 0;

  canvas.addEventListener('mousedown', (e) => {
    if (!isDirectorInteractive() || e.button !== 0) return;
    if (hoveredTool && isToolDraggable(hoveredTool)) {
      dragTool     = hoveredTool;
      dragStartX   = e.clientX;
      dragBaseRotY = getToolGroup(hoveredTool).rotation.y;
      dragVel = 0; dragLastX = e.clientX; dragLastT = performance.now();
      canvas.style.cursor = 'grabbing';
      // Tool-specific drag species boost
      VORTEX_PARAMS.dragSpeciesBoost = {
        wrench: { flowRibbon: 1.44, cloudMote: 0.88, microDust: 0.72, sparkFilament: 0.62 },
        hammer: { flowRibbon: 0.72, cloudMote: 1.22, microDust: 1.34, sparkFilament: 0.44 },
        saw:    { flowRibbon: 0.62, cloudMote: 0.72, microDust: 0.88, sparkFilament: 1.62 },
      }[dragTool] || null;
      // Drag-grab burst: localized wake instead of a full-scene hit.
      const grp = getToolGroup(dragTool);
      emitSparks(grp.position.x, grp.position.y, 0xffcc66, 6);
      VORTEX_PARAMS.pointerWake = Math.min(1.0, VORTEX_PARAMS.pointerWake + 0.26);
      VORTEX_PARAMS.turbulenceMode = Math.min(1.0, VORTEX_PARAMS.turbulenceMode + 0.10);
      interactionCharge = Math.max(interactionCharge, 0.24);
      markInteraction(SCENE_CONFIG.interaction.dragStartBoost);
      e.preventDefault();
    }
  });

  window.addEventListener('mousemove', (e) => {
    if (!dragTool) return;
    const dx = (e.clientX - dragStartX) / window.innerWidth;
    const dragLimit = getToolDragLimit(dragTool);
    getToolGroup(dragTool).rotation.y = THREE.MathUtils.clamp(
      dragBaseRotY + dx * Math.PI * 2.5,
      dragBaseRotY - dragLimit,
      dragBaseRotY + dragLimit
    );
    // Track velocity for inertia on release
    const nowT = performance.now();
    dragVel = (e.clientX - dragLastX) / Math.max(1, nowT - dragLastT) * 0.003;
    // Keep drag energy local and capped.
    const dragWindBoost = Math.abs(e.clientX - dragLastX) * 0.00012;
    VORTEX_PARAMS.pointerWake = Math.min(1.0, VORTEX_PARAMS.pointerWake + Math.min(0.12, Math.abs(dragVel) * 4.2));
    VORTEX_PARAMS.turbulenceMode = Math.min(1.0, VORTEX_PARAMS.turbulenceMode + 0.05);
    VORTEX_PARAMS.windStrength = Math.min(ACTIVE_FORCE_FIELDS.globalWindShear.maxWind, VORTEX_PARAMS.baseWindStrength + dragWindBoost);
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
    queueMagicPulse({ strength: 0.16, durationMs: 720, source: 'drag-release', anchorTool: dragTool, sparkCount: 0 });
    if (Math.abs(dragVel) > 0.002) {
      const lateralPos = {
        x: grpR.position.x + (dragVel > 0 ? 1.5 : -1.5),
        y: grpR.position.y, z: 0
      };
      applyPulseShockwave(lateralPos);
    }
    // Reset wind boost back to base after drag ends
    VORTEX_PARAMS.windStrength = VORTEX_PARAMS.baseWindStrength;
    VORTEX_PARAMS.dragSpeciesBoost = null;
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

  // Double-click: Detonation burst — particles explode outward then snap back via implosion
  canvas.addEventListener('dblclick', (e) => {
    e.preventDefault();
    if (!isDirectorInteractive() || prefersReduced) return;
    const anchor = getWrenchStoryAnchor();
    triggerReleasePulse(0.88, 1400);
    [flowRibbonSystem, cloudMoteSystem, microDustSystem, sparkFilamentSystem].forEach(s =>
      applyVortexShockwave(s, { x: anchor.x, y: anchor.y, z: anchor.z })
    );
    queueMagicPulse({ strength: 0.56, durationMs: 1600, source: 'canvas-dblclick', anchorTool: 'wrench', sparkCount: 16 });
    implosionActive = true;
    implosionStart = performance.now() + 280;  // delayed gather-then-explode beat
    clickWorldPos = { x: anchor.x, y: anchor.y, z: anchor.z };
    canvasLastClickTime = performance.now();  // absorb the preceding single-click
  });

  // Middle-click: Freeze + Slingshot — particles decelerate to near-stop, then blast outward
  canvas.addEventListener('mousedown', e => {
    if (e.button !== 1) return;
    e.preventDefault();
  });

  /* ─── Spark burst pool ─────────────────────────────────── */
  // 28 total pooled embers for tool clicks, pulses, and shockwaves.
  // Smaller radius (0.018) so they read as hot particulate rather than bulbs.
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
    const startSlot = 0;
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
    const effectiveScrollProgress = getEffectiveScrollProgress();
    const overlayAlpha = Math.min(effectiveScrollProgress * 2, 1);
    document.documentElement.style.setProperty('--overlay-alpha', overlayAlpha.toFixed(3));
    document.documentElement.style.setProperty('--scene-warmth', Math.min(1, effectiveScrollProgress / 0.6).toFixed(3));

    // Step 9.4 — Wire --section-depth-blur CSS var
    const depthBlurValue = clamp01(
      depthLayerMix.total * 0.6
      + depthLayerMix.rearForge * 0.4
    ).toFixed(3);
    document.documentElement.style.setProperty('--section-depth-blur', depthBlurValue);

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
    const shotPreset = getShotPreset(DIRECTOR_STATE.cameraState);

    camera.fov = shotPreset.fov;
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    const orbitSnapshot = resolveOrbitLayoutSnapshot(performance.now());

    hammerGroup.scale.setScalar(orbitSnapshot.support.hammer.scale);
    wrenchGroup.scale.setScalar(orbitSnapshot.heroScale);
    sawGroup.scale.setScalar(orbitSnapshot.support.saw.scale);

    hammerGroup.position.copy(orbitSnapshot.support.hammer.position);
    wrenchGroup.position.copy(orbitSnapshot.centerWorld);
    sawGroup.position.copy(orbitSnapshot.support.saw.position);

    hammerGroup.visible = SUPPORT_PROPS_ACTIVE;
    sawGroup.visible = SUPPORT_PROPS_ACTIVE;

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
    updateReadabilityWindow();
    updateOrbitDiagnostics();
    updateOrbitDebugOverlay();
    if (activePanelTool) updateActivePanelPosition();
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
    const canInteractNow = isDirectorInteractive();
    const storyPreset = getParticleStoryPreset();
    const pointerWakeEnvelope = canInteractNow
      ? (0.62 + storyPreset.localEddy * 0.38)
      : (0.12 + DIRECTOR_STATE.revealMix * 0.16 + DIRECTOR_STATE.lockupMix * 0.08);
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
    VORTEX_PARAMS.pointerWake += ((clamp01(velMag * 11.5) * pointerWakeEnvelope) - VORTEX_PARAMS.pointerWake) * (canInteractNow ? 0.065 : 0.040);

    if (!reverseGravityActive) {
      const normalizedWake = clamp01((velMag - VORTEX_PARAMS.velocityThreshold) / 0.060);
      const targetTurb = normalizedWake * 0.64 * (canInteractNow ? 1 : 0.20);
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
      if (t.id !== HERO_FOCUS_TOOL && !supportDisplayState[t.id]?.visible) continue;
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
    const supportInteractionScale = (canInteractNow ? 1 : 0.18) * (0.52 + storyPreset.supportMotion * 0.48);
    const heroDirectorWake = clamp01(
      DIRECTOR_STATE.revealMix * 0.40
      + DIRECTOR_STATE.lockupMix * 0.24
      + DIRECTOR_STATE.interactiveMix * 0.10
      + magicPulseStrength * 0.16
    );
    const hammerWakeTarget = clamp01(
      ((hoveredTool === 'hammer' ? 0.26 : 0)
      + (dragTool === 'hammer' ? 0.44 : 0)
      + (activePanelTool === 'hammer' ? 0.22 : 0)
      + (closestId === 'hammer' ? closestStrength * 0.26 : 0)) * supportInteractionScale
      + SCENE_STATE.release * 0.10
    );
    const wrenchWakeTarget = clamp01(
      ((hoveredTool === 'wrench' ? 0.32 : 0)
      + (dragTool === 'wrench' ? 0.48 : 0)
      + (activePanelTool === 'wrench' ? 0.22 : 0)
      + (closestId === 'wrench' ? closestStrength * 0.34 : 0)) * (canInteractNow ? 0.94 : 0.30)
      + SCENE_STATE.focus * 0.10
      + ctaWakeStrength * ACTIVE_ENVIRONMENT_MAGIC.ctaWakeWrench
      + magicPulseStrength * 0.18
      + heroDirectorWake * (0.64 + storyPreset.wrenchAttractor * 0.36)
    );
    const sawWakeTarget = clamp01(
      ((hoveredTool === 'saw' ? 0.22 : 0)
      + (dragTool === 'saw' ? 0.34 : 0)
      + (activePanelTool === 'saw' ? 0.18 : 0)
      + (closestId === 'saw' ? closestStrength * 0.24 : 0)) * supportInteractionScale
      + VORTEX_PARAMS.sawSpeedRatio * 0.64
      + SCENE_STATE.release * 0.10
      + DIRECTOR_STATE.revealMix * 0.06
    );
    toolWakeState.hammer += (hammerWakeTarget - toolWakeState.hammer) * 0.08;
    toolWakeState.wrench += (wrenchWakeTarget - toolWakeState.wrench) * 0.08;
    toolWakeState.saw += (sawWakeTarget - toolWakeState.saw) * 0.08;
    focusTarget = canInteractNow ? getFocusTarget() : HERO_FOCUS_TOOL;
  }

  function updateSceneState(now, readabilityClamp) {
    const storyPreset = getParticleStoryPreset();
    const signaturePreset = getParticleSignaturePreset();
    const intensityPreset = getMagicIntensityPreset();
    const releasePreset = getReleaseEnvelopePreset();
    const worldCuePreset = getWorldCuePreset();
    const gatherProgress = getGatherProgress(now);
    const releaseProgress = getReleaseProgress(now);
    const settleProgress = getSettleProgress(now);
    const sceneScrollTransitionMix = DIRECTOR_STATE.phase === SCENE_DIRECTOR_STATE.scrollTransition
      ? clamp01((getEffectiveScrollProgress() - SHOT_CONFIG.scrollTransitionStart) / 0.14)
      : 0;
    const scrollTransitionMix = Math.max(
      sceneScrollTransitionMix,
      externalSectionTransition.state === 'idle' ? 0 : externalSectionTransition.progress
    );
    const focusProgress = clamp01(
      (hoveredTool ? 0.36 : 0)
      + (dragTool ? 0.34 : 0)
      + (activePanelTool ? 0.18 : 0)
      + VORTEX_PARAMS.proximityStrength * 0.64
      + interactionCharge * 0.18
      + ctaWakeStrength * 0.20
      + magicPulseStrength * 0.18
    );

    ctaWakeStrength += (((ctaWakeActive && isDirectorInteractive()) ? 1 : 0) - ctaWakeStrength) * 0.18;
    ctaWakeEmissivePulse *= 0.94;
    SCENE_STATE.focus += (focusProgress - SCENE_STATE.focus) * 0.12;
    SCENE_STATE.gather += (gatherProgress - SCENE_STATE.gather) * 0.18;
    SCENE_STATE.release += (releaseProgress - SCENE_STATE.release) * 0.22;
    SCENE_STATE.settle += (settleProgress - SCENE_STATE.settle) * 0.12;
    SCENE_STATE.pointerWake += (VORTEX_PARAMS.pointerWake - SCENE_STATE.pointerWake) * 0.12;
    SCENE_STATE.scrollPhase += ((Math.min(1, getEffectiveScrollProgress() / 0.6)) - SCENE_STATE.scrollPhase) * 0.08;
    SCENE_STATE.readabilityBias += ((readabilityClamp > 0 ? SCENE_CONFIG.readability.densityBias : 0) - SCENE_STATE.readabilityBias) * 0.10;
    if (DIRECTOR_STATE.phase !== SCENE_DIRECTOR_STATE.scrollTransition && externalSectionTransition.state === 'idle') scrollHandoffState = 'idle';
    else if (externalSectionTransition.state === 'handedOff' || scrollTransitionMix > 0.56) scrollHandoffState = 'handedOff';
    else scrollHandoffState = 'compressing';

    if (SCENE_STATE.release > 0.04) SCENE_STATE.interactionState = 'release';
    else if (SCENE_STATE.gather > 0.04) SCENE_STATE.interactionState = 'gather';
    else if (SCENE_STATE.settle > 0.04) SCENE_STATE.interactionState = 'settle';
    else if (SCENE_STATE.focus > 0.08) SCENE_STATE.interactionState = 'focus';
    else SCENE_STATE.interactionState = 'idle';
    worldCue = worldCuePreset.label;

    magicIntensity = clamp01(
      intensityPreset.base
      + SCENE_STATE.focus * intensityPreset.focusGain
      + SCENE_STATE.release * intensityPreset.releaseGain
      + magicPulseStrength * intensityPreset.pulseGain
      + ctaWakeStrength * intensityPreset.ctaGain
      + DIRECTOR_STATE.revealMix * 0.08
      + DIRECTOR_STATE.lockupMix * 0.06
      - scrollTransitionMix * intensityPreset.handoffDrop
      - Math.max(0, copyZoneDensity - ACTIVE_COPY_CORRIDOR_GUARD.densityTarget) * 0.24
    );
    const pulseCueActive = magicPulseSource !== 'idle'
      && magicPulsePeak >= 0.08
      && (now - magicPulseStartAt) <= Math.min(420, magicPulseDurationMs * 0.7);
    particleCue = pulseCueActive ? `${storyPreset.cue}-pulse` : storyPreset.cue;
    signatureCue = pulseCueActive ? `${signaturePreset.label}-pulse` : signaturePreset.label;

    activeForceFields.windShear = clamp01((0.28 + SCENE_STATE.pointerWake * 0.34 + magicIntensity * 0.24) * storyPreset.forceScale);
    activeForceFields.layeredCurl = clamp01((0.24 + magicIntensity * 0.34 + SCENE_STATE.gather * 0.22 + SCENE_STATE.release * 0.18 + releaseEnvelope * 0.12) * storyPreset.forceScale);
    activeForceFields.floorDrag = clamp01(0.18 + SCENE_STATE.scrollPhase * 0.14 + DIRECTOR_STATE.lockupMix * 0.10);
    activeForceFields.wrenchAttractor = clamp01((storyPreset.wrenchAttractor * 0.42) + signaturePreset.seamLanePull * 0.18 + toolWakeState.wrench * 0.30 + magicPulseStrength * 0.16);
    activeForceFields.vortexPair = clamp01((storyPreset.ribbonOrbit * 0.38) + signaturePreset.orbitLane * 0.20 + DIRECTOR_STATE.revealMix * 0.22 + DIRECTOR_STATE.lockupMix * 0.18);
    activeForceFields.toolDeflectors = clamp01((0.22 + magicIntensity * 0.26 + SCENE_STATE.focus * 0.18) * signaturePreset.deflectorBoost);
    activeForceFields.copyRepeller = clamp01((storyPreset.copyCalm * 0.22) + signaturePreset.corridorEvacuation * 0.20 + SCENE_STATE.readabilityBias * 0.38 + Math.max(0, copyZoneDensity - ACTIVE_COPY_CORRIDOR_GUARD.densityTarget) * 1.4);

    const corridorTarget = clamp01(
      signaturePreset.corridorEvacuation * 0.42
      + activeForceFields.copyRepeller * 0.40
      + scrollTransitionMix * 0.28
      + Math.max(0, copyZoneDensity - ACTIVE_COPY_CORRIDOR_GUARD.evacuationThreshold) * 2.0
    );
    corridorEvacuation += (corridorTarget - corridorEvacuation) * 0.12;
    const releaseTarget = clamp01(
      magicPulseStrength * (0.56 + releasePreset.attack)
      + SCENE_STATE.release * (0.54 + releasePreset.fanGain)
      + ctaWakeStrength * 0.10
      + DIRECTOR_STATE.revealMix * 0.08
    );
    releaseEnvelope += (releaseTarget - releaseEnvelope) * (releaseTarget > releaseEnvelope ? (0.14 + releasePreset.attack * 0.16) : (0.08 + releasePreset.decay * 0.08));
    const emberTarget = clamp01(
      signaturePreset.heroEmberBase
      + magicIntensity * 0.34
      + releaseEnvelope * releasePreset.emberBoost
      + toolWakeState.wrench * 0.18
      + ctaWakeStrength * 0.10
      + DIRECTOR_STATE.revealMix * 0.08
      + DIRECTOR_STATE.lockupMix * 0.06
      - scrollTransitionMix * 0.16
    );
    heroEmberLevel += (emberTarget - heroEmberLevel) * (emberTarget > heroEmberLevel ? 0.14 : 0.09);

    toolInfluenceState.hammer = toolWakeState.hammer;
    toolInfluenceState.wrench = toolWakeState.wrench + activeForceFields.wrenchAttractor * 0.18 + heroEmberLevel * 0.08;
    toolInfluenceState.saw = toolWakeState.saw;
    toolInfluenceState.heroOrbit = activeForceFields.vortexPair + signaturePreset.orbitLane * 0.06;
    toolInfluenceState.copyRepeller = activeForceFields.copyRepeller + corridorEvacuation * 0.08;
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
    updateSceneDirector(nowMs);
    updateMagicPulse(nowMs);
    updateEnergyState(nowMs);
    focusTarget = isDirectorInteractive() ? getFocusTarget() : HERO_FOCUS_TOOL;

    /* ── Staggered assembly intro ── */
    if (!assemblyDone) {
      let allDone = true;
      const assemblyElapsed = Math.max(0, DIRECTOR_STATE.elapsedMs - SHOT_CONFIG.preRevealEndMs);

      allToolParts.forEach(mesh => {
        const partElapsed = Math.max(0, assemblyElapsed - (mesh.userData.assemblyDelay || 0));
        const partT = DIRECTOR_STATE.started && assemblyElapsed > 0
          ? easeOutSpring(Math.min(partElapsed / (ASSEMBLY_DURATION * 0.72), 1))
          : 0;
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
    VORTEX_PARAMS.tangentialStrength = breatheTarget + energyValue * 0.00014;

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
    const handoffPreset = SCROLL_HANDOFF_PRESETS[scrollHandoffState] || SCROLL_HANDOFF_PRESETS.idle;
    const magicPreset = ACTIVE_ENVIRONMENT_MAGIC;
    const storyPreset = getParticleStoryPreset();
    const signaturePreset = getParticleSignaturePreset();
    const releasePreset = getReleaseEnvelopePreset();
    const scatterPreset = getLightScatterPreset();
    const shaftPreset = getVolumeShaftPreset();

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
        const speciesStoryBias = storyPreset.speciesBias[system.species.id] || 1;
        const sparkGate = system.species.id === 'sparkFilament'
          ? clamp01(storyPreset.sparkGate + SCENE_STATE.release * 0.34 + magicPulseStrength * 0.30 + toolWakeState.saw * 0.08 + releaseEnvelope * 0.34)
          : 1;
        system.material.uniforms.uTime.value = time * 0.001;
        system.material.uniforms.uEnergy.value = system.species.id === 'microDust' ? sceneEnergy * 0.84 : sceneEnergy;

        let opacityBase = system.species.id === 'cloudMote' ? 0.28 : 0.18;
        let scaleBase = 1.0;
        if (system.species.id === 'microDust') opacityBase = 0.16;
        if (system.species.id === 'flowRibbon') opacityBase = 0.18;
        const densityBias = system.species.id === 'cloudMote'
          ? atmosphereMetrics.titleHalo * 0.18 + atmosphereMetrics.vortex * 0.10
          : (system.species.id === 'microDust'
            ? atmosphereMetrics.foreground * 0.14 + atmosphereMetrics.copy * 0.02 + toolWakeState.wrench * 0.05
            : atmosphereMetrics.vortex * 0.12 + atmosphereMetrics.sawWake * 0.10 + toolWakeState.wrench * 0.08);

        system.material.uniforms.uOpacity.value = Math.min(
          0.52,
          (opacityBase + densityBias + SCENE_STATE.focus * 0.06 + SCENE_STATE.release * 0.08 + implPct * 0.12 + magicIntensity * 0.06 + heroEmberLevel * 0.04 + releaseEnvelope * releasePreset.ribbonHold * (system.species.id === 'flowRibbon' ? 0.18 : 0.06))
          * (behavior.opacity || 1)
          * guardedClamp
          * handoffPreset.hazeScale
          * storyPreset.hazeScale
          * speciesStoryBias
          * sparkGate
        );
        system.material.uniforms.uScale.value = (scaleBase + densityBias * 0.22 + SCENE_STATE.focus * 0.06 + SCENE_STATE.release * 0.08 + implPct * 0.06 + magicPulseStrength * 0.04 + releaseEnvelope * releasePreset.ribbonHold * 0.08)
          * (behavior.scale || 1)
          * THREE.MathUtils.lerp(0.96, 1.10, layerEnvelope)
          * (0.92 + speciesStoryBias * 0.12);

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
        if (sparkMat.uniforms) {
          sparkMat.uniforms.uCool.value.setRGB(sr, sg, sb);
          sparkMat.uniforms.uWarm.value.setRGB(sr, sg, sb);
          sparkMat.uniforms.uOpacity.value = Math.min(0.12, (0.02 + SCENE_STATE.release * 0.04 + implPct * 0.05 + scatterCoupling * 0.01 + magicPulseStrength * 0.02) * storyPreset.sparkGate);
        } else {
          sparkMat.color.setRGB(sr, sg, sb);
          sparkMat.size = 0.012 + SCENE_STATE.focus * 0.001 + SCENE_STATE.release * 0.006 + implPct * 0.005 + magicPulseStrength * 0.003;
          sparkMat.opacity = Math.min(0.12, (0.02 + SCENE_STATE.release * 0.04 + implPct * 0.05 + scatterCoupling * 0.01 + magicPulseStrength * 0.02) * storyPreset.sparkGate);
        }
      }
      if (flowRibbonSystem && flowRibbonSystem.material) {
        const ribbonPhaseGate = DIRECTOR_STATE.phase === SCENE_DIRECTOR_STATE.reveal ? 1 : 0;
        flowRibbonSystem.material.opacity = THREE.MathUtils.lerp(
          0.0,
          orbitLayoutState.compositionMode === 'crownMobile' || orbitLayoutState.compositionMode === 'wrenchOnlyNarrow' ? 0.03 : 0.10,
          Math.min(
            1,
            atmosphereMetrics.titleHalo * 0.20
            + atmosphereMetrics.vortex * 0.34
            + toolWakeState.wrench * 0.34 * magicPreset.wrenchRibbonBias
            + ctaWakeStrength * 0.12
            + magicPulseStrength * 0.20
            + releaseEnvelope * signaturePreset.ribbonPersistence
            + SCENE_STATE.focus
            + SCENE_STATE.release * 0.28
            + SCENE_STATE.gather * 0.18
            + scatterCoupling * 0.10
          )
        ) * handoffPreset.hazeScale * storyPreset.hazeScale * ribbonPhaseGate;
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
    const heroFadeStart = window.innerHeight * 0.12; // start fading at 12vh scroll
    const heroFadeEnd   = window.innerHeight * 0.50; // fully gone at 50vh scroll
    const scrollToolAlpha = Math.max(0, 1 - Math.max(0, currentScrollY - heroFadeStart) / (heroFadeEnd - heroFadeStart));
    const directorToolAlpha = prefersReduced
      ? 1
      : (DIRECTOR_STATE.phase === SCENE_DIRECTOR_STATE.preReveal
        ? (0.06 + clamp01(DIRECTOR_STATE.elapsedMs / SHOT_CONFIG.preRevealEndMs) * 0.10)
        : (DIRECTOR_STATE.phase === SCENE_DIRECTOR_STATE.reveal
          ? (0.26 + DIRECTOR_STATE.revealMix * 0.74)
          : 1));
    const toolAlpha = scrollToolAlpha * directorToolAlpha;
    const compositionPreset = getCompositionPreset();
    const orbitSnapshot = resolveOrbitLayoutSnapshot(time);
    const shotPreset = getShotPreset();
    const lightRig = getLightRigPreset();
    const postFxPreset = getPostFxPreset();
    const finishPreset = getCinematicFinishPreset();
    const shotBeatPreset = getShotBeatPreset();
    const lensFinishPreset = getLensFinishPreset();
    const lightingCuePreset = getLightingCuePreset();
    const worldCuePreset = getWorldCuePreset();
    const depthPreset = getEnvironmentDepthPreset();
    const parallaxPreset = getParallaxLayerPreset();
    const lensEventPreset = getLensEventPreset();
    shotBeat = shotBeatPreset.label;
    lightingCue = lightingCuePreset.label;
    gradePreset = lensFinishPreset.label;
    worldCue = worldCuePreset.label;

    /* ── Hover emissive lerp — also driven by shared scene state ── */
    const scatterCoupling = scatterPass ? clamp01(volumetricScatterIntensity * 1.8 + (desktopFxState.active ? 0.06 : 0)) : 0;
    const particleEnergyBase = SCENE_STATE.focus * 0.14 + SCENE_STATE.release * 0.24 + implPct * 0.18 + scatterCoupling * 0.08 + DIRECTOR_STATE.revealMix * 0.08 + DIRECTOR_STATE.lockupMix * 0.06 + magicIntensity * 0.10 + magicPulseStrength * 0.12;
    const sawEnergyBoost = (VORTEX_PARAMS.sawSpeedRatio || 0) * 0.12;
    const pulseWindow = magicPulseSource === 'idle'
      ? 0
      : clamp01(1 - (time - magicPulseStartAt) / Math.max(220, magicPulseDurationMs * 0.7));
    const burstPulseWindow = /click|touch|drag-release/.test(magicPulseSource) ? pulseWindow : 0;
    const releaseAtmosphericLift = clamp01(
      SCENE_STATE.release * 0.44
      + releaseProgress * 0.36
      + magicPulseStrength * 0.38
      + burstPulseWindow * 0.92
    );
    const scrollCopyCompression = clamp01(
      handoffPreset.copyCalm * (scrollHandoffState === 'handedOff' ? 2.34 : 1.42)
    );
    const lensPulseScale = SCENE_CONFIG.qualityTier === 'low' ? finishPreset.lensPulseLow : finishPreset.lensPulseDesktop;
    const activeCue = SCENE_STATE.release > 0.04
      ? LIGHT_CUES.release
      : (SCENE_STATE.gather > 0.04
        ? LIGHT_CUES.gather
        : (SCENE_STATE.settle > 0.04 ? LIGHT_CUES.settle : (SCENE_STATE.focus > 0.06 ? LIGHT_CUES.focus : LIGHT_CUES.idle)));
    const lensPulseEnergy = Math.max(
      magicPulseStrength * 0.92,
      releaseEnvelope,
      burstPulseWindow * 1.12,
      SCENE_STATE.release * 0.70
    );
    if (SCENE_CONFIG.qualityTier !== 'desktop' || prefersReduced || lensPulseScale <= 0) {
      lensEvent = 'disabled';
    } else if (scrollHandoffState !== 'idle') {
      lensEvent = 'scroll-compression';
    } else if (magicPulseSource === 'director-intro-prepulse' || magicPulseSource === 'director-reveal') {
      lensEvent = 'intro-prepulse';
    } else if (magicPulseSource !== 'idle' || (ctaWakeActive && ctaWakeStrength > 0.06)) {
      lensEvent = `pulse-${magicPulseSource !== 'idle' ? magicPulseSource : 'cta-wake'}`;
    } else {
      lensEvent = 'idle';
    }

    const lerpE = 1 - Math.pow(0.04, delta / 16);
    ['hammer', 'wrench', 'saw'].forEach(id => {
      const hoverTarget = (hoveredTool === id || activePanelTool === id) ? 0.38 : 0;
      const directorFocusBoost = id === HERO_FOCUS_TOOL
        ? (DIRECTOR_STATE.revealMix * 0.18 + DIRECTOR_STATE.lockupMix * 0.10 + magicPulseStrength * 0.12)
        : (DIRECTOR_STATE.revealMix * 0.03 * shotBeatPreset.supportSceneEnergyScale);
      const supportSceneScale = id === HERO_FOCUS_TOOL ? 1 : shotBeatPreset.supportSceneEnergyScale;
      const particleTarget = particleEnergyBase * supportSceneScale + directorFocusBoost + (id === 'saw' ? sawEnergyBoost * supportSceneScale : 0);
      const target = Math.max(hoverTarget, particleTarget) + (id === 'wrench' ? ctaWakeEmissivePulse * 0.24 : 0);
      hoverEmissive[id] += (target - hoverEmissive[id]) * lerpE;
      const ev = hoverEmissive[id];
      // Per-tool emissive color lookup
      const hoverColors = {
        wrench: { r: 0.95, g: 0.52, b: 0.05 },  // Amber
        hammer: { r: 0.72, g: 0.78, b: 0.96 },  // Steel blue
        saw: { r: 0.96, g: 0.96, b: 0.88 },     // Cool highlight white
      };
      const toolColor = hoverColors[id] || hoverColors.wrench;
      getToolGroup(id).traverse(obj => {
        if (obj.isMesh && obj.material && obj.material.emissive) {
          // Don't override bubble's own emissive — only change non-emissive parts
          if (obj.material.emissiveIntensity < 0.5) {
            // Tool-specific color; shifts blue on implosion
            const rC = impl ? THREE.MathUtils.lerp(toolColor.r, 0.2, implPct) : toolColor.r;
            const gC = impl ? THREE.MathUtils.lerp(toolColor.g, 0.4, implPct) : toolColor.g;
            const bC = impl ? THREE.MathUtils.lerp(toolColor.b, 1.0, implPct) : toolColor.b;
            obj.material.emissive.setRGB(ev * rC, ev * gC, ev * bC);
          }
        }
      });
      // envMapIntensity boost for specular awakening
      hoverEnvBoost[id] += (hoverTarget * 0.48 - hoverEnvBoost[id]) * lerpE * 1.4;
      getToolGroup(id).traverse(obj => {
        if (obj.isMesh && obj.material && typeof obj.material.envMapIntensity === 'number') {
          obj.material.envMapIntensity = Math.max(0, obj.material.envMapIntensity + hoverEnvBoost[id] * 0.5);
        }
      });
    });
    if (wrenchGroup.userData.emberSeam?.material) {
      const seamMat = wrenchGroup.userData.emberSeam.material;
      seamMat.emissiveIntensity = 0.22
        + heroEmberLevel * 0.34
        + toolWakeState.wrench * 0.26
        + releaseEnvelope * 0.56
        + magicPulseStrength * 0.26
        + shaftPreset.warmSeam * 0.10
        + SCENE_STATE.release * 0.12;
      seamMat.opacity = THREE.MathUtils.lerp(
        0.38,
        0.96,
        clamp01(heroEmberLevel * 0.54 + releaseEnvelope * 0.40 + DIRECTOR_STATE.revealMix * 0.16 + shaftPreset.warmSeam * 0.10)
      );
    }
    if (hammerGroup.userData.edgeAccent?.material) {
      hammerGroup.userData.edgeAccent.material.envMapIntensity = 0.42 + toolWakeState.hammer * 0.18 + SCENE_STATE.focus * 0.08;
    }
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
    const layout = orbitSnapshot.layout;
    const mobileComposition = orbitLayoutState.compositionMode === 'crownMobile' || orbitLayoutState.compositionMode === 'wrenchOnlyNarrow';
    const compositionPulse = 0.5 + Math.sin(time * 0.00021) * 0.5;
    const supportMotionScale = (0.06 + storyPreset.supportMotion * 0.08) * shotBeatPreset.supportMotionScale * finishPreset.supportSuppression;
    const hammerMotion = compositionPreset.hammer.motion * supportMotionScale;
    const wrenchMotion = compositionPreset.wrench.motion * shotBeatPreset.heroMotionScale * (0.92 + magicIntensity * 0.08) * finishPreset.heroPriority;
    const sawMotion = 0;
    const heroLift = DIRECTOR_STATE.revealMix * 0.03 + DIRECTOR_STATE.lockupMix * 0.015 + shotBeatPreset.heroLift * 0.28;

    wrenchGroup.scale.setScalar(orbitSnapshot.heroScale);
    hammerGroup.scale.setScalar(orbitSnapshot.support.hammer.scale);
    sawGroup.scale.setScalar(orbitSnapshot.support.saw.scale);

    window.toolBasePositions = {
      hammer: { x: orbitSnapshot.support.hammer.position.x, y: orbitSnapshot.support.hammer.position.y, z: orbitSnapshot.support.hammer.position.z },
      wrench: { x: orbitSnapshot.centerWorld.x, y: orbitSnapshot.centerWorld.y, z: orbitSnapshot.centerWorld.z },
      saw: { x: orbitSnapshot.support.saw.position.x, y: orbitSnapshot.support.saw.position.y, z: orbitSnapshot.support.saw.position.z },
    };

    hammerGroup.position.x = window.toolBasePositions.hammer.x + camRotY * -0.12 + Math.sin(time * 0.00028) * (0.003 * hammerMotion + toolWakeState.hammer * 0.003);
    hammerGroup.position.y = window.toolBasePositions.hammer.y + Math.sin(time * 0.00042) * 0.004 * hammerMotion + toolWakeState.hammer * 0.003;
    hammerGroup.position.z = window.toolBasePositions.hammer.z + camRotX * -0.04 + Math.sin(time * 0.00031 + 0.9) * 0.004 * hammerMotion;

    wrenchGroup.position.x = window.toolBasePositions.wrench.x + camRotY * -0.08 + Math.sin(time * 0.00034 + 0.7) * (0.0014 * wrenchMotion + toolWakeState.wrench * 0.0028);
    wrenchGroup.position.y = window.toolBasePositions.wrench.y + Math.sin(time * 0.00054 + 1.2) * 0.0018 * wrenchMotion + compositionPulse * 0.001 + toolWakeState.wrench * 0.0026 + heroLift;
    wrenchGroup.position.z = window.toolBasePositions.wrench.z + camRotX * -0.02 + Math.sin(time * 0.00038 + 0.9) * 0.0022 * wrenchMotion + toolWakeState.wrench * 0.0035 + DIRECTOR_STATE.revealMix * 0.006;

    sawGroup.position.x = window.toolBasePositions.saw.x;
    sawGroup.position.y = window.toolBasePositions.saw.y;
    sawGroup.position.z = window.toolBasePositions.saw.z;

    if (!spinState.hammer.spinning && dragTool !== 'hammer') {
      const hammerAngle = THREE.MathUtils.degToRad(orbitSnapshot.supportAnglesDeg.hammer);
      hammerGroup.rotation.x = -0.12 + Math.cos(hammerAngle) * 0.02 + Math.sin(time * 0.00028) * 0.003;
      hammerGroup.rotation.y = hammerIdleY - 0.24 + camRotY * 0.03 + Math.cos(hammerAngle) * 0.04 + toolWakeState.hammer * 0.01;
      hammerGroup.rotation.z = 0.06 + Math.sin(hammerAngle) * 0.05 + mouseX * -0.003 - toolWakeState.hammer * 0.008;
    }

    if (!spinState.wrench.spinning && dragTool !== 'wrench') {
      wrenchGroup.rotation.x = layout.heroPose.pitch + Math.sin(time * 0.00042) * (layout.heroIdle.roll * 0.20) + camRotX * 0.014;
      wrenchGroup.rotation.y = wrenchIdleY + layout.heroPose.yaw + camRotY * (mobileComposition ? 0.016 : 0.020) + Math.sin(time * 0.00036) * layout.heroIdle.yaw - toolWakeState.wrench * 0.014;
      wrenchGroup.rotation.z = layout.heroPose.roll + Math.cos(time * 0.00058) * layout.heroIdle.roll + mouseX * (mobileComposition ? 0.0018 : 0.0024) + toolWakeState.wrench * 0.006;
    }

    const sawSupportActive = SUPPORT_PROPS_ACTIVE;
    const speedRatio = 0;
    VORTEX_PARAMS.sawSpeedRatio = 0;
    VORTEX_PARAMS.sawWorldX = sawGroup.position.x;
    VORTEX_PARAMS.sawWorldY = sawGroup.position.y;
    VORTEX_PARAMS.sawWorldZ = sawGroup.position.z;
    if (sawSupportActive && !spinState.saw.spinning && dragTool !== 'saw') {
      const sawAngle = THREE.MathUtils.degToRad(orbitSnapshot.supportAnglesDeg.saw);
      sawGroup.rotation.x = -0.08 + Math.cos(sawAngle) * 0.02;
      sawGroup.rotation.y = 0.04 + Math.sin(sawAngle) * 0.02;
      sawGroup.rotation.z = 0.18 + sawAngle + Math.PI * 0.48;
    }
    if (!glbSawLoaded && sawSpinGroup) sawSpinGroup.rotation.y += 0;
    if (!glbSawLoaded && hubGlowMat)   hubGlowMat.opacity   = sawSupportActive ? 0.06 + toolWakeState.saw * 0.08 : 0;
    if (!glbSawLoaded && hubCoronaMat) hubCoronaMat.opacity = sawSupportActive ? 0.03 + toolWakeState.saw * 0.05 : 0;
    if (bladeMat) bladeMat.envMapIntensity = sawSupportActive ? (0.46 + toolWakeState.saw * 0.14 + SCENE_STATE.focus * 0.08 + SCENE_STATE.release * 0.04) : 0.12;
    hammerGroup.visible = SUPPORT_PROPS_ACTIVE;
    sawGroup.visible = SUPPORT_PROPS_ACTIVE;
    refreshSupportVisibilityState();
    hammerGroup.visible = SUPPORT_PROPS_ACTIVE && supportDisplayState.hammer.visible;
    sawGroup.visible = SUPPORT_PROPS_ACTIVE && supportDisplayState.saw.visible;
    if (activePanelTool && activePanelTool !== HERO_FOCUS_TOOL && !supportDisplayState[activePanelTool]?.visible) {
      closePanel(true);
    }
    updateOrbitDiagnostics();
    updateOrbitDebugOverlay();
    if (activePanelTool) updateActivePanelPosition();

    /* ── Floor grid parallax ── */
    floorGrid.position.x = camRotY * -0.8;
    floorGrid.position.z = 1.0 + camRotX * 0.4;

    /* ── Opacity / fade on scroll ── */
    const hammerOpacity = toolAlpha * compositionPreset.hammer.opacity * orbitSnapshot.support.hammer.opacity * shotBeatPreset.supportOpacityScale * finishPreset.supportSuppression * 0.76 * (supportDisplayState.hammer.visible ? 1 : 0);
    const wrenchOpacity = toolAlpha * compositionPreset.wrench.opacity;
    const sawOpacity = 0;
    setObjectOpacity(hammerGroup, hammerOpacity);
    setObjectOpacity(wrenchGroup, wrenchOpacity);
    setObjectOpacity(sawGroup, sawOpacity);
    const floorGridScale = mobileComposition ? 0.20 : (orbitLayoutState.compositionMode === 'tabletCluster' ? 0.34 : 0.42);
    const wallGridScale = mobileComposition ? 0.10 : (orbitLayoutState.compositionMode === 'tabletCluster' ? 0.18 : 0.22);
    const horizonGridScale = mobileComposition ? 0.08 : (orbitLayoutState.compositionMode === 'tabletCluster' ? 0.14 : 0.18);
    const gridCopySuppression = mobileComposition ? 0.20 : 0.36;
    floorGrid.material.opacity = toolAlpha * (0.10 + SCENE_STATE.gather * 0.03 + SCENE_STATE.release * 0.04) * lensFinishPreset.hazeScale * floorGridScale * gridCopySuppression;
    wallGrid.material.opacity = toolAlpha * (0.03 + SCENE_STATE.focus * 0.01 + SCENE_STATE.release * 0.02) * wallGridScale * gridCopySuppression;
    horizonGrid.material.opacity = toolAlpha * (0.02 + SCENE_STATE.release * 0.02 + SCENE_STATE.focus * 0.008) * lensFinishPreset.hazeScale * horizonGridScale * gridCopySuppression;
    gridLuminanceUnderCopy = Math.max(floorGrid.material.opacity, wallGrid.material.opacity, horizonGrid.material.opacity);
    orbitLight.intensity = toolAlpha * lightRig.orbit * lightingCuePreset.supportLightScale * (0.02 + activeCue.warm * 0.06 + magicIntensity * 0.02);
    // Floor glow breathes with particle pulse + flares on gather/release
    const breathPhaseGlow = (time % 4000) / 4000;
    const glowPulse = 0.04 + Math.sin(breathPhaseGlow * Math.PI * 2) * 0.014 + SCENE_STATE.gather * 0.03 + SCENE_STATE.release * 0.06;
    floorGlow.material.opacity  = toolAlpha * glowPulse;
    wrenchContactShadow.position.set(wrenchGroup.position.x + 0.04, -2.50, wrenchGroup.position.z + 0.04);
    hammerContactShadow.position.set(hammerGroup.position.x - 0.12, -2.50, hammerGroup.position.z - 0.06);
    wrenchContactShadow.material.opacity = wrenchOpacity * (0.36 + lightRig.heroShadow * 0.38 + DIRECTOR_STATE.lockupMix * 0.12);
    hammerContactShadow.material.opacity = hammerOpacity * (0.16 + lightRig.heroShadow * 0.22);
    DIRECTOR_STATE.contactShadowOpacity = Math.max(wrenchContactShadow.material.opacity, hammerContactShadow.material.opacity);
    const hammerRead = hammerOpacity * (0.76 + toolWakeState.hammer * 0.18 + lightingCuePreset.supportLightScale * 0.14);
    const sawRead = sawOpacity * (0.78 + toolWakeState.saw * 0.18 + lightingCuePreset.supportLightScale * 0.14);
    const supportRead = Math.max(hammerRead, sawRead);
    const heroRead = wrenchOpacity * (finishPreset.heroPriority + lightRig.key * 0.14 + DIRECTOR_STATE.lockupMix * 0.18 + magicIntensity * 0.10 + keyBeamCard.material.opacity * 0.60);
    const contrastFloor = Math.max(0.12, copyZoneDensity * 1.4 + atmosphereMetrics.copy * 0.22 + 0.08);
    toolContrastMetrics.hammer = hammerRead / contrastFloor;
    toolContrastMetrics.wrench = heroRead / contrastFloor;
    toolContrastMetrics.saw = sawRead / contrastFloor;

    // ── PARTICLE LIGHT UPDATES: dynamic illumination from vortex + saw + floor burst ──

    // Ambient flash on implosion — subtle tint only, not a flood
    const targetExposure = orbitLayoutState.compositionMode === 'tabletCluster'
      ? 1.30
      : (mobileComposition ? 1.26 : 1.34);
    renderer.toneMappingExposure += (targetExposure - renderer.toneMappingExposure) * 0.05;
    ambientLight.intensity = 0.05 + activeCue.warm * 0.02 * scatterPreset.warmBias + implPct * 0.015 + scatterCoupling * 0.008 + magicIntensity * 0.008 + shaftPreset.coolBackscatter * 0.006;
    ambientLight.color.setRGB(
      impl ? THREE.MathUtils.lerp(0.022, 0.06, implPct) : 0.022,
      impl ? THREE.MathUtils.lerp(0.026, 0.05, implPct) : 0.026,
      impl ? THREE.MathUtils.lerp(0.042, 0.08, implPct) : 0.042
    );
    const lightTighten = mobileComposition ? 0.86 : 0.96;
    keyLight.intensity = 1.26 * lightRig.key * lightingCuePreset.keyScale * finishPreset.heroPriority * (1 + activeCue.warm * 0.03 * scatterPreset.warmBias + DIRECTOR_STATE.revealMix * 0.04 + heroEmberLevel * 0.02 + shaftPreset.warmSeam * 0.05) * lightTighten;
    fillLight.intensity = 0.54 * lightRig.fill * lightingCuePreset.fillScale * (1 - finishPreset.negativeFill * 0.05) * (1 + activeCue.cool * 0.02 + shaftPreset.coolBackscatter * 0.03) * (mobileComposition ? 0.90 : 0.96);
    rimAreaLight.intensity = 0.52 * lightRig.rim * scatterPreset.rimTightness * lightingCuePreset.rimScale * (1 + SCENE_STATE.release * 0.04 + magicIntensity * 0.015 + shaftPreset.coolBackscatter * 0.03) * (mobileComposition ? 0.98 : 1.02);
    heroShadowLight.position.x += ((wrenchGroup.position.x + 0.86) - heroShadowLight.position.x) * 0.08;
    heroShadowLight.position.y += ((4.7 + DIRECTOR_STATE.revealMix * 0.3) - heroShadowLight.position.y) * 0.08;
    heroShadowLight.position.z += ((wrenchGroup.position.z + 3.4) - heroShadowLight.position.z) * 0.08;
    heroShadowLight.target.position.x += ((wrenchGroup.position.x - 0.18) - heroShadowLight.target.position.x) * 0.12;
    heroShadowLight.target.position.y += ((-2.18) - heroShadowLight.target.position.y) * 0.12;
    heroShadowLight.target.position.z += ((wrenchGroup.position.z - 0.08) - heroShadowLight.target.position.z) * 0.12;
    heroShadowLight.intensity = toolAlpha * lightRig.heroShadow * lightingCuePreset.shadowGrip * finishPreset.heroShadowGrip * (0.84 + activeCue.warm * 0.18 + DIRECTOR_STATE.lockupMix * 0.12);
    DIRECTOR_STATE.heroShadowIntensity = heroShadowLight.intensity;

    // Vortex light tracks cursor center — warm core with transient cool release accent
    vortexLight.position.set(VORTEX_PARAMS.centerX, VORTEX_PARAMS.centerY, 1.5);
    const vBase = impl ? 0.65 * implPct : 0;
    const vTurb = toolAlpha * (0.06 + activeCue.warm * 0.54 + SCENE_STATE.focus * 0.20 + SCENE_STATE.release * 0.22 + SCENE_STATE.pointerWake * 0.14 + atmosphereMetrics.vortex * 0.60 + atmosphereMetrics.titleHalo * 0.08 + toolWakeState.wrench * 0.18 + scatterCoupling * 0.14 + magicPulseStrength * 0.18 + burstPulseWindow * 0.18 + (dragTool ? 0.08 : 0));
    vortexLight.intensity = Math.min(1.85, Math.max(vBase, vTurb + ctaWakeStrength * 0.08 + releaseEnvelope * 0.18));
    vortexLight.color.setRGB(
      impl ? THREE.MathUtils.lerp(0.84, 0.56, implPct) : 0.80 + atmosphereMetrics.vortex * 0.08,
      impl ? THREE.MathUtils.lerp(0.46, 0.58, implPct) : 0.42 + atmosphereMetrics.titleHalo * 0.08,
      impl ? THREE.MathUtils.lerp(0.05, 0.28, implPct) : 0.05 + atmosphereMetrics.sawWake * 0.06 + SCENE_STATE.release * 0.18 + magicPulseStrength * 0.22 + pulseWindow * 0.12
    );

    // Ground glow: subtle forge bounce with brief gather/release flare
    groundGlow.intensity = toolAlpha * lightRig.ground * (0.05 + activeCue.warm * 0.14 + atmosphereMetrics.floor * 0.24 + SCENE_STATE.release * 0.14 + implPct * 0.18 + scatterCoupling * 0.08 + shaftPreset.warmSeam * 0.04);
    groundGlow.color.setRGB(
      impl ? THREE.MathUtils.lerp(0.66, 0.34, implPct) : 0.66,
      impl ? THREE.MathUtils.lerp(0.32, 0.36, implPct) : 0.32,
      impl ? THREE.MathUtils.lerp(0.04, 0.24, implPct) : 0.04 + atmosphereMetrics.floor * 0.08
    );

    // Saw particle glow: orange light from sparks + hub, scales with blade speed
    sawParticleGlow.position.set(sawGroup.position.x, sawGroup.position.y, sawGroup.position.z + 0.5);
    sawParticleGlow.intensity = toolAlpha * lightingCuePreset.supportLightScale * (0.06 + speedRatio * 0.82 + atmosphereMetrics.sawWake * 0.42 + SCENE_STATE.focus * 0.08 + SCENE_STATE.release * 0.14 + scatterCoupling * 0.05);

    // Floor rim light: fires on release/implosion for a readable cool under-light pulse
    floorRimLight.position.set(VORTEX_PARAMS.centerX * 0.3, -2.0, 1.5);
    floorRimLight.intensity = toolAlpha * Math.max(
      SCENE_STATE.release * 1.12 + implPct * 0.74 + releaseAtmosphericLift * 0.30,
      magicPulseStrength * 1.8,
      pulseWindow * 0.28 + burstPulseWindow * 1.02
    );
    floorRimLight.color.setRGB(
      THREE.MathUtils.lerp(0.32, 0.20, Math.min(1, releaseProgress * 0.8 + implPct * 0.4)),
      THREE.MathUtils.lerp(0.40, 0.54, Math.min(1, releaseProgress + implPct * 0.4)),
      THREE.MathUtils.lerp(0.72, 0.98, Math.min(1, releaseProgress + implPct * 0.5))
    );
    const heroVisible = toolAlpha > 0.01;
    const volumetricGuard = 1 - readabilityClamp * SCENE_CONFIG.readability.volumetricClamp;

    sparkAuraCard.position.set(
      wrenchGroup.position.x + 0.04,
      wrenchGroup.position.y + (mobileComposition ? 0.36 : 0.48),
      wrenchGroup.position.z + 0.10
    );
    sparkAuraCard.quaternion.copy(camera.quaternion);
    sparkAuraCard.material.opacity = toolAlpha * volumetricGuard * handoffPreset.hazeScale * (0.001 + atmosphereMetrics.vortex * 0.014 + SCENE_STATE.release * 0.05 + SCENE_STATE.focus * 0.012 + implPct * 0.05 + scatterCoupling * 0.015 + magicPulseStrength * 0.028 + releaseEnvelope * 0.06 + releaseAtmosphericLift * 0.08) * storyPreset.sparkGate;
    sparkAuraCard.material.color.setRGB(
      THREE.MathUtils.lerp(0.28, 0.12, implPct + releaseProgress * 0.28),
      THREE.MathUtils.lerp(0.46, 0.72, SCENE_STATE.release + implPct * 0.20),
      THREE.MathUtils.lerp(0.12, 0.86, SCENE_STATE.release + implPct * 0.28)
    );

    cloudAuraCard.position.set(
      wrenchGroup.position.x - (mobileComposition ? 0.02 : 0.08),
      wrenchGroup.position.y + (mobileComposition ? 0.12 : 0.22) + Math.sin(time * 0.00038) * (mobileComposition ? 0.025 : 0.05),
      wrenchGroup.position.z - 0.18
    );
    cloudAuraCard.quaternion.copy(camera.quaternion);
    cloudAuraCard.material.opacity = toolAlpha * volumetricGuard * handoffPreset.hazeScale * storyPreset.hazeScale * lensFinishPreset.hazeScale * (1 - scrollCopyCompression * 0.56) * (0.010 + atmosphereMetrics.titleHalo * 0.024 + atmosphereMetrics.foreground * 0.012 + SCENE_STATE.gather * 0.016 + SCENE_STATE.release * 0.014 + magicIntensity * 0.014 + shaftPreset.hazeClamp * 0.016);
    cloudAuraCard.material.color.setRGB(0.98, 0.46 + heroEmberLevel * 0.06, 0.20 + atmosphereMetrics.foreground * 0.03);

    keyBeamCard.position.x = wrenchGroup.position.x + (mobileComposition ? 0.04 : 0.08) + Math.sin(time * 0.00019) * 0.03;
    keyBeamCard.position.y = wrenchGroup.position.y + (mobileComposition ? 0.74 : 0.94);
    keyBeamCard.position.z = wrenchGroup.position.z - 0.26;
    keyBeamCard.material.opacity = toolAlpha * (SCENE_CONFIG.featureFlags.volumetricCards ? (0.044 + shaftPreset.warmSeam * 0.10 + heroEmberLevel * 0.03 + releaseEnvelope * 0.03) * volumetricGuard * handoffPreset.hazeScale * lensFinishPreset.beamDiscipline * (1 - scrollCopyCompression * 0.76) : 0);
    sawBeamCard.position.x = sawGroup.position.x + 0.18;
    sawBeamCard.position.y = sawGroup.position.y + 1.2;
    sawBeamCard.material.opacity = toolAlpha * lightingCuePreset.supportLightScale * (SCENE_CONFIG.featureFlags.volumetricCards ? (speedRatio * 0.04 + atmosphereMetrics.sawWake * 0.09 * magicPreset.sawSparkBias + SCENE_STATE.release * 0.06 + scatterCoupling * 0.04) * volumetricGuard * handoffPreset.hazeScale * lensFinishPreset.beamDiscipline : 0);

    const worldHandoffMix = DIRECTOR_STATE.phase === SCENE_DIRECTOR_STATE.scrollTransition
      ? Math.max(getEffectiveScrollProgress(), externalSectionTransition.progress)
      : 0;
    const worldCopyGuard = 1 - (readabilityClamp * (0.30 + worldCuePreset.copyBias * 0.40));
    const rearForgeTarget = toolAlpha
      * depthPreset.total
      * depthPreset.rearForgeMix
      * worldCuePreset.rearForge
      * handoffPreset.hazeScale
      * lensFinishPreset.hazeScale
      * worldCopyGuard
      * (1 - scrollCopyCompression * 0.62)
      * 1.42;
    const silhouetteTarget = toolAlpha
      * depthPreset.total
      * depthPreset.silhouetteMix
      * worldCuePreset.silhouette
      * worldCopyGuard
      * (0.82 + DIRECTOR_STATE.lockupMix * 0.16)
      * (1 - scrollCopyCompression * 0.32)
      * 1.26;
    const occluderTarget = toolAlpha
      * depthPreset.total
      * depthPreset.occluderMix
      * worldCuePreset.benchOcclusion
      * worldCopyGuard
      * (1 - scrollCopyCompression * 0.26)
      * 1.12;
    const hangingTarget = toolAlpha
      * depthPreset.total
      * depthPreset.hangingMix
      * worldCuePreset.hangingDepth
      * worldCopyGuard
      * (1 - scrollCopyCompression * 0.30)
      * 1.20;
    // Step 9.3 — Haze lane target
    const hazeLaneTarget = toolAlpha
      * depthPreset.total
      * (depthPreset.hazeLaneMix || 0.30)
      * worldCuePreset.rearForge  // borrow rearForge cue since it's the same light source
      * handoffPreset.hazeScale
      * worldCopyGuard
      * (1 - scrollCopyCompression * 0.58);
    const depthResponse = DIRECTOR_STATE.phase === SCENE_DIRECTOR_STATE.reveal
      ? 0.22
      : (DIRECTOR_STATE.phase === SCENE_DIRECTOR_STATE.lockup
        ? 0.18
        : (DIRECTOR_STATE.phase === SCENE_DIRECTOR_STATE.scrollTransition ? 0.16 : 0.12));
    depthLayerMix.rearForge += (clamp01(rearForgeTarget) - depthLayerMix.rearForge) * depthResponse;
    depthLayerMix.silhouettes += (clamp01(silhouetteTarget) - depthLayerMix.silhouettes) * depthResponse;
    depthLayerMix.occluders += (clamp01(occluderTarget) - depthLayerMix.occluders) * depthResponse;
    depthLayerMix.hangingDepth += (clamp01(hangingTarget) - depthLayerMix.hangingDepth) * depthResponse;
    depthLayerMix.hazeLanes += (clamp01(hazeLaneTarget) - depthLayerMix.hazeLanes) * depthResponse;
    depthLayerMix.total = clamp01(
      depthLayerMix.rearForge * 0.34
      + depthLayerMix.silhouettes * 0.38
      + depthLayerMix.occluders * 0.18
      + depthLayerMix.hangingDepth * 0.18
      + depthPreset.separationBias * 0.12
    );

    rearForgeHazeCard.position.set(
      wrenchGroup.position.x + (mobileComposition ? 0.16 : 0.28) + camRotY * parallaxPreset.rearForge.xGain * 0.24,
      wrenchGroup.position.y + (mobileComposition ? 0.20 : 0.32) + camRotX * parallaxPreset.rearForge.yGain * 0.18,
      wrenchGroup.position.z - 2.9
    );
    rearForgeHazeCard.quaternion.copy(camera.quaternion);
    rearForgeHazeCard.material.opacity = depthLayerMix.rearForge * (0.22 + shaftPreset.upliftColumn * 0.08 + worldCuePreset.rearForge * 0.04);

    coolBackscatterCard.position.set(
      wrenchGroup.position.x - (mobileComposition ? 0.46 : 0.74) + camRotY * parallaxPreset.backscatter.xGain * 0.14,
      wrenchGroup.position.y + (mobileComposition ? 0.62 : 0.84) + camRotX * parallaxPreset.backscatter.yGain * 0.14,
      wrenchGroup.position.z - 3.3
    );
    coolBackscatterCard.quaternion.copy(camera.quaternion);
    coolBackscatterCard.material.opacity = toolAlpha
      * depthPreset.total
      * worldCuePreset.backscatter
      * (0.08 + shaftPreset.coolBackscatter * 0.14 + worldCuePreset.backscatter * 0.05)
      * (1 - scrollCopyCompression * 0.70)
      * worldCopyGuard;

    rearSilhouettePrimary.position.set(
      wrenchGroup.position.x + (mobileComposition ? 0.44 : 0.66),
      wrenchGroup.position.y - (mobileComposition ? 0.18 : 0.26),
      wrenchGroup.position.z - 2.3
    );
    rearSilhouettePrimary.material.opacity = depthLayerMix.silhouettes * 0.58;

    rearSilhouetteSecondary.position.set(
      wrenchGroup.position.x - (mobileComposition ? 0.28 : 0.42),
      wrenchGroup.position.y + (mobileComposition ? 0.10 : 0.18),
      wrenchGroup.position.z - 3.4
    );
    rearSilhouetteSecondary.material.opacity = depthLayerMix.silhouettes * 0.34;

    benchOccluderCard.position.set(
      wrenchGroup.position.x + (mobileComposition ? 0.40 : 0.66),
      -1.92 + camRotX * parallaxPreset.benchOccluder.yGain * 0.10,
      wrenchGroup.position.z - 2.2
    );
    benchOccluderCard.material.opacity = depthLayerMix.occluders * 0.52;

    hangingDepthCard.position.set(
      wrenchGroup.position.x + (mobileComposition ? 0.78 : 1.04),
      wrenchGroup.position.y + (mobileComposition ? 0.70 : 0.92),
      wrenchGroup.position.z - 2.6
    );
    hangingDepthCard.material.opacity = depthLayerMix.hangingDepth * 0.42;

    // Step 9.1 & 9.2 — Haze lanes and particulate stream opacity + drift
    hazeLaneLeft.material.opacity = depthLayerMix.hazeLanes * 0.32;
    hazeLaneRight.material.opacity = depthLayerMix.hazeLanes * 0.24;
    particulateStreamCard.material.opacity = toolAlpha
      * (depthPreset.hazeLaneMix || 0.30)
      * 0.18
      * handoffPreset.hazeScale
      * worldCopyGuard
      * (SCENE_CONFIG.qualityTier !== 'low' ? 1 : 0);

    // UV drift for particulate stream
    if (particulateStreamCard?.material?.map) {
      particulateStreamCard.material.map.offset.y += delta * 0.000012;
      particulateStreamCard.material.map.offset.x += Math.sin(time * 0.00008) * 0.000004;
    }

    const heroLaneRect = protectedZoneState.heroTargetFrame.active ? protectedZoneState.heroTargetFrame : protectedZoneState.artLane;
    const heroBoundsRect = orbitLayoutState.projectedToolBounds.wrench;
    const heroWidth = heroBoundsRect.width || 0;
    const heroHeight = heroBoundsRect.height || 0;
    protectedZoneState.heroBacklightRect = rectFromLTRB(
      heroBoundsRect.left - heroWidth * (mobileComposition ? 0.05 : 0.06),
      heroBoundsRect.top - heroHeight * (mobileComposition ? 0.10 : 0.12),
      heroBoundsRect.right + heroWidth * (mobileComposition ? 0.14 : 0.18),
      heroBoundsRect.bottom - heroHeight * (mobileComposition ? 0.18 : 0.24)
    );
    protectedZoneState.heroShadowRect = rectFromLTRB(
      heroBoundsRect.left - heroWidth * (mobileComposition ? 0.02 : 0.04),
      heroBoundsRect.bottom - heroHeight * (mobileComposition ? 0.12 : 0.16),
      heroBoundsRect.right + heroWidth * (mobileComposition ? 0.10 : 0.22),
      heroBoundsRect.bottom + heroHeight * (mobileComposition ? 0.04 : 0.10)
    );
    protectedZoneState.particleEmissionRect = expandScreenRect(
      heroBoundsRect,
      Math.round(heroWidth * (mobileComposition ? 0.15 : 0.20)),
      Math.round(heroHeight * (mobileComposition ? 0.22 : 0.30))
    );
    heroBacklightCoverage = protectedZoneState.heroBacklightRect.width > 0 && heroLaneRect.active
      ? overlapArea(protectedZoneState.heroBacklightRect, heroLaneRect) / Math.max(1, protectedZoneState.heroBacklightRect.width * protectedZoneState.heroBacklightRect.height)
      : 0;
    heroShadowCoverage = protectedZoneState.heroShadowRect.width > 0 && heroLaneRect.active
      ? overlapArea(protectedZoneState.heroShadowRect, heroLaneRect) / Math.max(1, protectedZoneState.heroShadowRect.width * protectedZoneState.heroShadowRect.height)
      : 0;
    updateOrbitDebugOverlay();

    scanLineMat.opacity  = Math.min(edgeFade, 1) * (0.48 + energyValue * 0.14) * toolAlpha;
    scanGlowMat.opacity  = Math.min(edgeFade, 1) * (0.18 + energyValue * 0.12) * toolAlpha;
    // Saw spotlight: intensity scales with spin speed and gently follows the saw, not the cursor
    const spotIntensity = (0.20 + (speedRatio * 0.72) + SCENE_STATE.focus * 0.10 + SCENE_STATE.release * 0.06) * lightRig.sawSpot * lightingCuePreset.supportLightScale;
    sawSpot.intensity  = toolAlpha * spotIntensity;
    sawSpot.position.x += ((sawGroup.position.x - 0.12) - sawSpot.position.x) * 0.08;
    sawSpot.position.y += ((sawGroup.position.y + 2.2) - sawSpot.position.y) * 0.08;
    sawSpot.position.z += ((sawGroup.position.z + 4.2) - sawSpot.position.z) * 0.08;

    // Hero-scope: hide all fixed elements when scrolled past hero fold
    const copyShieldStrength = heroVisible && readabilityWindow.active
      ? Math.min(scrollHandoffState === 'idle' ? 0.28 : 0.40, 0.02 + postFxPreset.copyShieldBoost + handoffPreset.copyCalm + scrollCopyCompression * 0.14 + SCENE_STATE.readabilityBias * 0.10 + atmosphereMetrics.copy * 0.10 + SCENE_STATE.release * 0.03)
      : 0;
    // Step 9.6 — Update worldEnergy to include new depth cards
    const worldEnergy = (
      rearForgeHazeCard.material.opacity * 1.8
      + coolBackscatterCard.material.opacity * 1.4
      + rearSilhouettePrimary.material.opacity * 1.0
      + rearSilhouetteSecondary.material.opacity * 0.8
      + benchOccluderCard.material.opacity * 0.9
      + hangingDepthCard.material.opacity * 0.8
      + hazeLaneLeft.material.opacity * 0.6
      + hazeLaneRight.material.opacity * 0.5
      + particulateStreamCard.material.opacity * 0.4
    );
    heroReadMetrics.focalContrast = heroRead / Math.max(0.05, supportRead);
    heroReadMetrics.supportSuppression = clamp01(1 - (supportRead / Math.max(0.08, heroRead)));
    heroReadMetrics.copyCalm = clamp01(1 - (copyZoneDensity * 2.2 + copyShieldStrength * 1.4 + scatterCoupling * 0.12));
    heroReadMetrics.highlightSpill = clamp01(copyZoneDensity * 1.4 + scatterCoupling * 0.08 + keyBeamCard.material.opacity * 2.2 - copyShieldStrength * 0.60);
    worldReadMetrics.backgroundSeparation = clamp01(
      depthPreset.separationBias * 0.38
      + depthLayerMix.total * 0.46
      + depthLayerMix.silhouettes * 0.22
      + depthLayerMix.hangingDepth * 0.16
      - copyZoneDensity * 0.28
      - scrollCopyCompression * 0.08
    );
    worldReadMetrics.copyContamination = clamp01(
      copyZoneDensity * 1.46
      + rearForgeHazeCard.material.opacity * 0.34
      + coolBackscatterCard.material.opacity * 0.26
      + worldCuePreset.copyBias * 0.22
      - copyShieldStrength * 0.80
    );
    worldReadMetrics.heroWorldBalance = clamp01(
      heroRead / Math.max(0.08, heroRead + supportRead * 0.22 + worldEnergy)
    );
    canvas.style.visibility    = heroVisible ? 'visible' : 'hidden';
    canvas.style.pointerEvents = heroVisible ? 'auto'    : 'none';
    vignette.style.visibility  = heroVisible ? 'visible' : 'hidden';
    vignette.style.opacity = heroVisible ? String(Math.min(1, lensFinishPreset.vignetteStrength + readabilityClamp * 0.08)) : '0';
    vignette.style.background = `radial-gradient(ellipse ${(86 + lensFinishPreset.vignetteFocus * 8).toFixed(1)}% ${(68 + lensFinishPreset.vignetteFocus * 6).toFixed(1)}% at ${(50 + shotBeatPreset.cameraXBias * -44).toFixed(1)}% ${(45 + shotBeatPreset.cameraYBias * -38).toFixed(1)}%, transparent ${(38 + lensFinishPreset.vignetteFocus * 4).toFixed(1)}%, rgba(3,4,8, ${(0.42 + finishPreset.negativeFill * 0.18).toFixed(3)}) ${(70 + lensFinishPreset.vignetteStrength * 3).toFixed(1)}%, rgba(0,0,0, ${(0.88 + lensFinishPreset.vignetteStrength * 0.08).toFixed(3)}) 100%), linear-gradient(to top, rgba(0,0,0, ${(0.84 + finishPreset.negativeFill * 0.10).toFixed(3)}) 0%, transparent 38%), linear-gradient(to bottom, rgba(1,2,5, ${(0.48 + lensFinishPreset.coolShadowLift * 0.26).toFixed(3)}) 0%, transparent 22%)`;
    // CSS-layer depth of field: blur during reveal phases only
    const dofPhaseActive = DIRECTOR_STATE.phase === SCENE_DIRECTOR_STATE.preReveal
      || (DIRECTOR_STATE.phase === SCENE_DIRECTOR_STATE.reveal && DIRECTOR_STATE.revealMix < 0.7);
    const dofStrength = (dofPhaseActive && !prefersReduced && SCENE_CONFIG.qualityTier === 'desktop')
      ? THREE.MathUtils.lerp(4.2, 0.0, DIRECTOR_STATE.revealMix * 1.4)
      : 0;
    vignette.style.backdropFilter = dofStrength > 0.3 ? `blur(${dofStrength.toFixed(1)}px)` : '';
    sceneGrade.style.visibility = heroVisible ? 'visible' : 'hidden';
    sceneGrade.style.opacity = heroVisible ? String(Math.max(postFxPreset.gradeFloor * handoffPreset.gradeLift * (1 - scrollCopyCompression * 0.12), postFxPreset.gradeFloor * handoffPreset.gradeLift + activeCue.warm * 0.08 + atmosphereMetrics.titleHalo * 0.04 + scatterCoupling * 0.04 + magicIntensity * 0.03 + heroEmberLevel * 0.04 + releaseEnvelope * 0.10 + pulseWindow * 0.08 * lensPulseScale + lensFinishPreset.coolShadowLift * 0.08 - readabilityClamp * 0.08 - scrollCopyCompression * 0.18)) : '0';
    // Grade warm spot tracks wrench position for dynamic parallax
    const gradeWarmX = (clamp01((wrenchGroup.position.x + 5.5) / 11) * 100).toFixed(1);
    const gradeWarmY = (clamp01(1 - (wrenchGroup.position.y + 4.5) / 9) * 100).toFixed(1);
    sceneGrade.style.background = `radial-gradient(circle at ${gradeWarmX}% ${gradeWarmY}%, rgba(242, 182, 86, ${(0.016 + shaftPreset.warmSeam * 0.030 + heroEmberLevel * 0.040 + releaseEnvelope * 0.060 + DIRECTOR_STATE.lockupMix * 0.020 - handoffPreset.emberDrain * 0.030 - scrollCopyCompression * 0.042).toFixed(3)}), transparent 30%), radial-gradient(circle at 24% 24%, rgba(92, 132, 196, ${(0.018 + shaftPreset.coolBackscatter * 0.040 + SCENE_STATE.release * 0.050 + magicPulseStrength * 0.060 + pulseWindow * 0.16 * lensPulseScale + lensFinishPreset.coolShadowLift * 0.08 - scrollCopyCompression * 0.052).toFixed(3)}), transparent 28%), linear-gradient(180deg, rgba(18, 32, 60, ${(0.028 + shaftPreset.coolBackscatter * 0.040 + SCENE_STATE.release * 0.060 + magicPulseStrength * 0.050 + lensFinishPreset.coolShadowLift * 0.10 - scrollCopyCompression * 0.062).toFixed(3)}) 0%, rgba(9, 11, 16, 0) 34%, rgba(255, 156, 68, ${(0.016 + shaftPreset.warmSeam * 0.024 + atmosphereMetrics.floor * 0.02 + heroEmberLevel * 0.026 + releaseEnvelope * 0.034 - handoffPreset.emberDrain * 0.02 - scrollCopyCompression * 0.030).toFixed(3)}) 100%)`;
    sceneLensAccent.style.visibility = heroVisible ? 'visible' : 'hidden';
    sceneLensAccent.style.opacity = heroVisible
      ? String(
          Math.max(
            0,
            (lensEvent === 'disabled' || lensEvent === 'idle' ? 0 : 0.02)
            + lensEventPreset.accentGain * 0.16
            + lensEventPreset.worldGlow * depthLayerMix.total * 0.20
            + pulseWindow * 0.18 * lensPulseScale
            + burstPulseWindow * 0.22 * lensPulseScale
            + magicPulseStrength * 0.12 * lensPulseScale
            - scrollCopyCompression * 0.10
            - readabilityClamp * 0.06
          ).toFixed(3)
        )
      : '0';
    sceneLensAccent.style.transform = heroVisible
      ? `scale(${(1.008 + Math.max(0, lensEventPreset.chromaSplit * 0.20 + burstPulseWindow * 0.02)).toFixed(4)})`
      : 'scale(1.0)';
    sceneLensAccent.style.background = `radial-gradient(circle at ${(62 + shotBeatPreset.cameraXBias * -16).toFixed(1)}% ${(42 + shotBeatPreset.cameraYBias * -12).toFixed(1)}%, rgba(248, 176, 92, ${(0.012 + pulseWindow * 0.10 * lensPulseScale + lensEventPreset.accentGain * 0.08 + depthLayerMix.rearForge * 0.04).toFixed(3)}), transparent 28%), radial-gradient(circle at ${(34 + lensEventPreset.chromaSplit * 20 + burstPulseWindow * 10).toFixed(1)}% ${(28 + lensEventPreset.chromaSplit * 10).toFixed(1)}%, rgba(102, 152, 236, ${(0.008 + pulseWindow * 0.08 * lensPulseScale + lensEventPreset.chromaSplit * 0.06 + coolBackscatterCard.material.opacity * 0.18).toFixed(3)}), transparent 22%), linear-gradient(115deg, rgba(255, 180, 90, ${(0.004 + burstPulseWindow * 0.05 * lensPulseScale).toFixed(3)}), rgba(255, 180, 90, 0) 22%), linear-gradient(102deg, rgba(92, 144, 228, ${(0.004 + burstPulseWindow * 0.04 * lensPulseScale + lensEventPreset.chromaSplit * 0.04).toFixed(3)}), rgba(92, 144, 228, 0) 16%)`;
    sceneCAAccent.style.opacity = (burstPulseWindow * 0.28 * (CAN_RUN_DESKTOP_POST ? 1 : 0)).toFixed(3);
    copyShield.style.opacity = heroVisible ? String(copyShieldStrength.toFixed(3)) : '0';
    copyShield.style.transform = heroVisible ? 'scale(1)' : 'scale(0.98)';
    if (readabilityWindow.active) {
      copyShield.style.left = `${readabilityWindow.left}px`;
      copyShield.style.top = `${readabilityWindow.top}px`;
      copyShield.style.width = `${readabilityWindow.width}px`;
      copyShield.style.height = `${readabilityWindow.height}px`;
      const copyFocusX = clamp01((VORTEX_PARAMS.centerX + 5.5) / 11);
      copyShield.style.background = `radial-gradient(ellipse at ${(28 + copyFocusX * 36).toFixed(1)}% 42%, rgba(6, 10, 16, ${(0.42 + copyShieldStrength * 0.7 + scrollCopyCompression * 0.42).toFixed(3)}) 0%, rgba(6, 10, 16, ${(0.18 + copyShieldStrength * 0.3 + scrollCopyCompression * 0.24).toFixed(3)}) 48%, rgba(6, 10, 16, 0) 88%), radial-gradient(ellipse at 62% 58%, rgba(34, 62, 104, ${(0.04 + atmosphereMetrics.titleHalo * 0.06 - scrollCopyCompression * 0.030).toFixed(3)}), rgba(6, 10, 16, 0) 72%), linear-gradient(135deg, rgba(8, 11, 18, ${(0.48 + copyShieldStrength * 0.4 + scrollCopyCompression * 0.38).toFixed(3)}), rgba(8, 11, 18, ${(0.06 + atmosphereMetrics.copy * 0.06 + scrollCopyCompression * 0.16).toFixed(3)}))`;
      copyShield.style.boxShadow = `inset 0 0 0 1px rgba(92, 132, 196, ${(0.04 + atmosphereMetrics.titleHalo * 0.05 - scrollCopyCompression * 0.018).toFixed(3)}), 0 32px 90px rgba(0, 0, 0, ${(0.12 + copyShieldStrength * 0.46 + scrollCopyCompression * 0.38).toFixed(3)})`;
      copyShield.style.borderRadius = `${Math.round(40 + atmosphereMetrics.titleHalo * 26)}px`;
    }
    if (!panelTestLock && activePanelTool && !isDirectorInteractive()) {
      closePanel(true);
    }
    infoPanel.style.visibility = heroVisible && activePanelTool ? 'visible' : 'hidden';
    if (!heroVisible && activePanelTool) closePanel();

    const shouldShowHint = SCENE_CONFIG.featureFlags.contextualHint
      && assemblyDone
      && heroVisible
      && isDirectorInteractive()
      && !dragTool
      && !hoveredTool
      && !hasSceneInteracted
      && nowMs - lastInteractionAt > SCENE_CONFIG.timing.hintDelayMs;
    gestureHint.classList.toggle('visible', shouldShowHint);

    const ringVisible = heroVisible && isDirectorInteractive() && (hoveredTool || dragTool || interactionCharge > 0.08 || energyState === ENERGY_STATES.release);
    const ringBurstLift = Math.max(
      energyState === ENERGY_STATES.release ? releaseProgress * 0.42 : 0,
      burstPulseWindow * 0.88
    );
    const ringScale = 0.62 + interactionCharge * 0.95 + ringBurstLift * 0.74;
    chargeRing.style.opacity = ringVisible ? String(Math.min(0.96, 0.18 + interactionCharge * 0.75 + releaseProgress * 0.28 + burstPulseWindow * 0.34)) : '0';
    chargeRing.style.transform = ringVisible
      ? `translate3d(${rawMouseX}px, ${rawMouseY}px, 0) scale(${ringScale.toFixed(3)})`
      : 'translate3d(-999px, -999px, 0) scale(0.55)';
    chargeRing.style.borderColor = `rgba(${Math.round(170 + interactionCharge * 70)}, ${Math.round(170 + releaseProgress * 40)}, ${Math.round(110 + energyValue * 95)}, 0.62)`;
    chargeRing.style.background = `radial-gradient(circle, rgba(241, 182, 92, ${(0.18 + ringBurstLift * 0.30).toFixed(3)}) 0%, rgba(41, 86, 142, ${(0.06 + burstPulseWindow * 0.18).toFixed(3)}) 54%, rgba(0, 0, 0, 0) 72%)`;
    chargeRing.style.boxShadow = `0 0 0 1px rgba(69, 136, 204, ${(0.14 + burstPulseWindow * 0.12).toFixed(3)}), 0 0 ${Math.round(28 + ringBurstLift * 42)}px rgba(239, 176, 84, ${(0.22 + ringBurstLift * 0.24).toFixed(3)}), 0 0 ${Math.round(16 + burstPulseWindow * 30)}px rgba(84, 148, 220, ${(0.10 + burstPulseWindow * 0.18).toFixed(3)})`;

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
    const cinematicSway = shotPreset.sway * (DIRECTOR_STATE.phase === SCENE_DIRECTOR_STATE.scrollTransition ? 0.60 : (DIRECTOR_STATE.phase === SCENE_DIRECTOR_STATE.interactiveIdle ? 0.72 : 0.90));
    const swayX = (Math.sin(time * 0.00031) * 0.007 + Math.sin(time * 0.00071) * 0.003) * cinematicSway;
    const swayY = (Math.cos(time * 0.00027) * 0.008 + Math.cos(time * 0.00059) * 0.004) * cinematicSway;
    const phaseTargetX = shotPreset.targetRotX + targetRotX * shotPreset.pointerGain;
    const phaseTargetY = shotPreset.targetRotY + targetRotY * shotPreset.pointerGain;

    // Semi-implicit Euler spring: K=180, C=18 → ~8% overshoot on fast sweeps, settles in ~0.5s
    const dt = delta / 1000;
    camVelX += (SPRING_K * (phaseTargetX + swayX - camRotX) - SPRING_C * camVelX) * dt;
    camVelY += (SPRING_K * (phaseTargetY + swayY - camRotY) - SPRING_C * camVelY) * dt;
    camRotX += camVelX * dt;
    camRotY += camVelY * dt;
    camRotX = THREE.MathUtils.clamp(camRotX, -0.18, 0.16);
    camRotY = THREE.MathUtils.clamp(camRotY, -0.18, 0.20);
    camera.rotation.x = camRotX;

    const scrollHandoffMix = DIRECTOR_STATE.phase === SCENE_DIRECTOR_STATE.scrollTransition
      ? Math.max(getEffectiveScrollProgress(), externalSectionTransition.progress)
      : 0;
    const scrollZ = shotPreset.z + shotBeatPreset.cameraZBias + (DIRECTOR_STATE.phase === SCENE_DIRECTOR_STATE.scrollTransition ? scrollHandoffMix * 2.4 : 0);
    const scrollRotY = DIRECTOR_STATE.phase === SCENE_DIRECTOR_STATE.scrollTransition ? scrollHandoffMix * 0.22 : 0;
    camera.position.x += (((DIRECTOR_STATE.phase === SCENE_DIRECTOR_STATE.scrollTransition ? -0.30 : -0.34 - DIRECTOR_STATE.revealMix * 0.10 - DIRECTOR_STATE.lockupMix * 0.14) + shotBeatPreset.cameraXBias + shotPreset.targetRotY * 0.18) - camera.position.x) * 0.05;
    camera.position.y += ((shotPreset.targetRotX * -0.24 + shotBeatPreset.cameraYBias) - camera.position.y) * 0.05;
    camera.position.z += (scrollZ - camera.position.z) * 0.06;
    camera.rotation.y  = camRotY + scrollRotY;
    camera.fov += (shotPreset.fov - camera.fov) * 0.08;
    camera.updateProjectionMatrix();
    cameraTrauma = Math.max(0, cameraTrauma - dt * 1.35);
    if (cameraTrauma > 0 && !prefersReduced) {
      const shake = cameraTrauma * cameraTrauma;
      camera.position.x += (Math.random() - 0.5) * shake * 0.08;
      camera.position.y += (Math.random() - 0.5) * shake * 0.06;
      camera.rotation.z = (Math.random() - 0.5) * shake * 0.02;
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
    const bgR = impl ? THREE.MathUtils.lerp(0.007 + bgBreath*0.0015, 0.001, implPct)
                     : 0.007 + SCENE_STATE.scrollPhase * 0.006 + bgBreath*0.0015;
    const bgG = impl ? THREE.MathUtils.lerp(0.009 + bgBreath*0.001, 0.003, implPct)
                     : 0.009 + SCENE_STATE.focus * 0.0015 + bgBreath*0.001;
    const bgB = impl ? THREE.MathUtils.lerp(0.012 + bgBreath*0.002, 0.020, implPct)
                     : 0.012 + SCENE_STATE.release * 0.004 + bgBreath*0.002;
    scene.background.setRGB(bgR, bgG, bgB);
    const fogScale = orbitLayoutState.compositionMode === 'crownMobile' || orbitLayoutState.compositionMode === 'wrenchOnlyNarrow'
      ? 0.46
      : (orbitLayoutState.compositionMode === 'tabletCluster' ? 0.58 : 0.60);
    scene.fog.density += (((0.011 + SCENE_STATE.focus * 0.0006 + SCENE_STATE.release * 0.0012 + scatterCoupling * 0.0007 + DIRECTOR_STATE.revealMix * 0.0005 + magicIntensity * 0.0004) * handoffPreset.hazeScale * storyPreset.hazeScale * lensFinishPreset.hazeScale * fogScale) - scene.fog.density) * 0.03;
    floorPlane.material.roughness += ((0.52 + DIRECTOR_STATE.lockupMix * 0.08 + SCENE_STATE.release * 0.02 + finishPreset.negativeFill * 0.04) - floorPlane.material.roughness) * 0.08;
    floorPlane.material.metalness += ((0.16 + DIRECTOR_STATE.revealMix * 0.02) - floorPlane.material.metalness) * 0.08;
    floorPlane.material.envMapIntensity += ((0.42 + DIRECTOR_STATE.revealMix * 0.04 + activeCue.warm * 0.03 - magicPreset.floorReflectivityCut * 0.18) - floorPlane.material.envMapIntensity) * 0.08;

    /* ── Dynamic bloom strength driven by vortex state ── */
    if (bloomPass) {
      const bloomBase = SCENE_CONFIG.tiers[SCENE_CONFIG.qualityTier].bloom;
      const bloomTarget = Math.min(
        bloomBase.strength * postFxPreset.bloomGain * lensFinishPreset.bloomDiscipline + SCENE_STATE.focus * 0.01 + SCENE_STATE.release * 0.04 + implPct * 0.03 + scatterCoupling * 0.03 + magicPulseStrength * 0.02 - readabilityClamp * SCENE_CONFIG.readability.bloomClamp * finishPreset.copyHighlightClamp,
        bloomBase.strength + 0.02
      );
      bloomPass.strength += (bloomTarget - bloomPass.strength) * 0.025; // slightly slower lerp + hard cap prevents mip-boundary banding
      bloomPass.threshold = bloomBase.threshold + postFxPreset.thresholdBias + 0.04 - lensFinishPreset.bloomDiscipline * 0.02 - SCENE_STATE.release * 0.02 - implPct * 0.02 + readabilityClamp * 0.04 * finishPreset.copyHighlightClamp;
      bloomPass.radius = Math.max(0.1, bloomBase.radius + postFxPreset.radiusBias - 0.05 + SCENE_STATE.focus * 0.02 + SCENE_STATE.release * 0.03 - finishPreset.supportSuppression * 0.01);
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
