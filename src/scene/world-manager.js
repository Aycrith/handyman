/**
 * src/scene/world-manager.js
 *
 * Cinematic World System — orchestrates distinct 3D environments per page section
 * with authored transitions between them. Replaces static zone-parameter shifting
 * with full geometry/material/lighting scene changes.
 *
 * Architecture:
 *   SceneWorld       — Base class for per-section 3D environments
 *   TransitionSeq    — Authored transition between two worlds
 *   WorldOrchestrator — Singleton managing lifecycle, loading, scroll coupling
 *
 * Integration:
 *   Called from src/scene/index.js via initWorldOrchestrator() after scene init.
 *   Reads scroll progress from the existing director phase system.
 *   Does NOT replace the hero director phases — those remain for ACT 1.
 */

const THREE = window.THREE;

// ── Priority Levels for Asset Loading ──────────────────────────────────────
const LOAD_PRIORITY = Object.freeze({
  CRITICAL: 0,  // ACT 1-2: loaded before startScene()
  HIGH: 1,      // ACT 3-5: loaded after first paint
  DEFERRED: 2,  // ACT 6-7: loaded on scroll or after idle timeout
  REUSE: 3,     // ACT 8-9: no new assets needed
});

// ── Easing Functions ───────────────────────────────────────────────────────
function easeInOutPower2(t) {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}
function easeOutExpo(t) {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
}
function easeInOutSine(t) {
  return -(Math.cos(Math.PI * t) - 1) / 2;
}
function clamp01(v) {
  return Math.max(0, Math.min(1, v));
}
function lerp(a, b, t) {
  return a + (b - a) * t;
}
function lerpColor(colorA, colorB, t) {
  return {
    r: lerp(colorA.r, colorB.r, t),
    g: lerp(colorA.g, colorB.g, t),
    b: lerp(colorA.b, colorB.b, t),
  };
}

function getMaterialList(material) {
  if (Array.isArray(material)) return material.filter(Boolean);
  return material ? [material] : [];
}

function summarizeWorldGroup(world) {
  const summary = {
    loaded: !!world.loaded,
    visible: !!world.group.visible,
    childCount: world.group.children.length,
    meshCount: 0,
    pointCount: 0,
    wireframeMeshCount: 0,
    transparentMeshCount: 0,
    dimmedMeshCount: 0,
    opacityFloor: 1,
    opacityCeiling: 0,
    opacityAverage: 1,
  };
  let opacitySampleCount = 0;
  let opacityTotal = 0;

  world.group.traverse((child) => {
    if (child.isMesh) summary.meshCount += 1;
    if (child.isPoints) summary.pointCount += 1;
    if (!child.isMesh && !child.isPoints) return;

    getMaterialList(child.material).forEach((material) => {
      if (child.isMesh && material.wireframe) summary.wireframeMeshCount += 1;
      if (material.transparent) summary.transparentMeshCount += 1;

      const opacity = typeof material.opacity === 'number' ? material.opacity : 1;
      if (opacity < 0.99) summary.dimmedMeshCount += 1;
      summary.opacityFloor = Math.min(summary.opacityFloor, opacity);
      summary.opacityCeiling = Math.max(summary.opacityCeiling, opacity);
      opacityTotal += opacity;
      opacitySampleCount += 1;
    });
  });

  summary.opacityFloor = Number((Number.isFinite(summary.opacityFloor) ? summary.opacityFloor : 1).toFixed(3));
  summary.opacityCeiling = Number((Number.isFinite(summary.opacityCeiling) ? summary.opacityCeiling : 1).toFixed(3));
  summary.opacityAverage = Number(((opacitySampleCount > 0 ? opacityTotal / opacitySampleCount : 1)).toFixed(3));
  return summary;
}

// ── SceneWorld Base Class ──────────────────────────────────────────────────
class SceneWorld {
  /**
   * @param {object} config
   * @param {string} config.id             — Unique world ID
   * @param {string} config.label          — Human-readable label
   * @param {number[]} config.scrollRange  — [start, end] in 0-1 scroll space
   * @param {string[]} config.assetPaths   — GLB URLs to load
   * @param {number} config.loadPriority   — LOAD_PRIORITY value
   * @param {object} config.lightingProfile
   * @param {string} config.particleStory
   * @param {object[]} config.cameraWaypoints
   */
  constructor(config) {
    this.id = config.id;
    this.label = config.label || config.id;
    this.scrollRange = config.scrollRange;
    this.assetPaths = config.assetPaths || [];
    this.loadPriority = config.loadPriority ?? LOAD_PRIORITY.HIGH;
    this.lightingProfile = config.lightingProfile || {};
    this.particleStory = config.particleStory || 'hero-orbit';
    this.cameraWaypoints = config.cameraWaypoints || [];

    this.group = new THREE.Group();
    this.group.name = `world_${this.id}`;
    this.group.visible = false;

    this.loaded = false;
    this.active = false;
    this.enterProgress = 0;
    this.exitProgress = 0;

    this._assets = {};
    this._disposed = false;
  }

  /** Scroll-normalized position within this world (0 at scrollRange[0], 1 at scrollRange[1]) */
  getLocalScroll(globalScroll) {
    const [start, end] = this.scrollRange;
    return clamp01((globalScroll - start) / Math.max(0.001, end - start));
  }

  /** Override in subclass: set up geometry/materials after assets load */
  onAssetsLoaded(assets) {
    this._assets = assets;
    this.loaded = true;
  }

  /** Called per-frame while transitioning IN (t: 0→1) */
  enter(t) {
    this.enterProgress = t;
    if (!this.group.visible && t > 0 && this.loaded) {
      this.group.visible = true;
    }
  }

  /** Called per-frame while this world is the active world */
  update(scrollT, deltaTime) {
    // Override in subclass for per-frame animation
  }

  /** Called per-frame while transitioning OUT (t: 0→1, where 1 = fully gone) */
  exit(t) {
    this.exitProgress = t;
    if (t >= 1) {
      this.group.visible = false;
    }
  }

  /** Get this world's lighting parameters (blended with transition) */
  getLightingState() {
    return { ...this.lightingProfile };
  }

  /** Get camera position for a given local scroll T */
  getCameraTarget(localT) {
    if (!this.cameraWaypoints.length) return null;
    if (this.cameraWaypoints.length === 1) return { ...this.cameraWaypoints[0] };

    const totalT = localT * (this.cameraWaypoints.length - 1);
    const idx = Math.min(Math.floor(totalT), this.cameraWaypoints.length - 2);
    const segT = totalT - idx;

    const a = this.cameraWaypoints[idx];
    const b = this.cameraWaypoints[idx + 1];

    return {
      x: lerp(a.x, b.x, segT),
      y: lerp(a.y, b.y, segT),
      z: lerp(a.z, b.z, segT),
    };
  }

  /** Subclass override: clean up GPU resources */
  dispose() {
    if (this._disposed) return;
    this._disposed = true;
    this.group.traverse((child) => {
      if (child.isMesh) {
        child.geometry?.dispose();
        if (child.material) {
          if (Array.isArray(child.material)) {
            child.material.forEach((m) => m.dispose());
          } else {
            child.material.dispose();
          }
        }
      }
      if (child.isPoints) {
        child.geometry?.dispose();
        child.material?.dispose();
      }
    });
    if (this.group.parent) {
      this.group.parent.remove(this.group);
    }
  }
}

// ── TransitionSeq Class ────────────────────────────────────────────────────
/**
 * Authored transition between two SceneWorlds.
 * Each transition owns its scroll range, technique, and optional camera spline.
 */
class TransitionSeq {
  /**
   * @param {object} config
   * @param {SceneWorld} config.from         — Exiting world
   * @param {SceneWorld} config.to           — Entering world
   * @param {number[]} config.scrollRange    — [start, end] in global scroll space
   * @param {string} config.technique        — Transition technique ID
   * @param {object} config.techniqueConfig  — Technique-specific parameters
   * @param {Function} config.techniqueImpl  — The technique update function
   * @param {object[]} config.cameraSpline   — Optional camera waypoints for this transition
   */
  constructor(config) {
    this.from = config.from;
    this.to = config.to;
    this.scrollRange = config.scrollRange;
    this.technique = config.technique;
    this.techniqueConfig = config.techniqueConfig || {};
    this.techniqueController = config.techniqueController || null;
    this.techniqueImpl = config.techniqueImpl || null;
    this.cameraSpline = config.cameraSpline || null;

    this.active = false;
    this.progress = 0;

    // Resources created by the technique (fog planes, particle systems, etc.)
    this._resources = null;
  }

  /**
   * @param {number} globalScroll — Current scroll position (0-1)
   * @returns {number} Normalized progress within this transition (0-1)
   */
  getProgress(globalScroll) {
    const [start, end] = this.scrollRange;
    return clamp01((globalScroll - start) / Math.max(0.001, end - start));
  }

  /**
   * Called per-frame when the transition is active.
   * @param {number} t — Normalized progress (0→1)
   * @param {object} context — { scene, camera, renderer, deltaTime }
   */
  update(t, context) {
    this.progress = t;
    this.active = t > 0 && t < 1;

    // Drive exit on the outgoing world
    if (this.from) {
      this.from.exit(t);
    }
    // Drive enter on the incoming world
    if (this.to) {
      this.to.enter(t);
    }
    // Run technique-specific update
    if (this.techniqueController?.update) {
      this.techniqueController.update(t, this, context);
    } else if (this.techniqueImpl) {
      this.techniqueImpl(t, this, context);
    }
  }

  reset(landingWorld = null) {
    if (this.techniqueController?.reset) {
      this.techniqueController.reset(this);
    }

    if (landingWorld === this.from) {
      this.from?.enter(1);
      this.to?.exit(1);
    } else if (landingWorld === this.to) {
      this.from?.exit(1);
      this.to?.enter(1);
    }

    this.active = false;
    this.progress = 0;
  }

  /** Get blended camera position during transition */
  getCameraTarget(t) {
    if (this.cameraSpline && this.cameraSpline.length >= 2) {
      const totalT = t * (this.cameraSpline.length - 1);
      const idx = Math.min(Math.floor(totalT), this.cameraSpline.length - 2);
      const segT = totalT - idx;
      const a = this.cameraSpline[idx];
      const b = this.cameraSpline[idx + 1];
      return {
        x: lerp(a.x, b.x, segT),
        y: lerp(a.y, b.y, segT),
        z: lerp(a.z, b.z, segT),
      };
    }
    // Fallback: blend from/to world camera targets
    const fromCam = this.from?.getCameraTarget(1) || { x: 0, y: 0, z: 6 };
    const toCam = this.to?.getCameraTarget(0) || { x: 0, y: 0, z: 6 };
    return {
      x: lerp(fromCam.x, toCam.x, easeInOutPower2(t)),
      y: lerp(fromCam.y, toCam.y, easeInOutPower2(t)),
      z: lerp(fromCam.z, toCam.z, easeInOutPower2(t)),
    };
  }

  /** Get blended lighting state during transition */
  getLightingState(t) {
    const fromLight = this.from?.getLightingState() || {};
    const toLight = this.to?.getLightingState() || {};
    const eased = easeInOutSine(t);
    const result = {};
    for (const key of new Set([...Object.keys(fromLight), ...Object.keys(toLight)])) {
      const a = fromLight[key];
      const b = toLight[key];
      if (typeof a === 'number' && typeof b === 'number') {
        result[key] = lerp(a, b, eased);
      } else if (a && b && typeof a === 'object' && typeof b === 'object') {
        result[key] = {};
        for (const subKey of new Set([...Object.keys(a), ...Object.keys(b)])) {
          result[key][subKey] = lerp(a[subKey] ?? 0, b[subKey] ?? 0, eased);
        }
      } else {
        result[key] = eased >= 0.5 ? b : a;
      }
    }
    return result;
  }

  dispose() {
    this.reset();

    if (this.techniqueController?.dispose) {
      this.techniqueController.dispose(this);
    } else if (this._resources && typeof this._resources.dispose === 'function') {
      this._resources.dispose();
    }

    this._resources = null;
  }
}

// ── WorldOrchestrator Singleton ────────────────────────────────────────────
/**
 * Manages all SceneWorlds and TransitionSeqs.
 * Receives scroll progress each frame and drives the appropriate world/transition.
 */
class WorldOrchestrator {
  constructor() {
    this.worlds = new Map();       // id → SceneWorld
    this.transitions = [];         // TransitionSeq[]
    this.loadQueue = [];           // { world, priority }

    this.activeWorld = null;       // Currently visible SceneWorld
    this.activeTransition = null;  // Currently playing TransitionSeq
    this.previousWorld = null;     // World that was just exited

    this.scrollProgress = 0;
    this.qualityTier = 'desktop';
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.enabled = false;

    this._loadedPriorities = new Set();
    this._loadingInProgress = false;
    this._scrollTriggerThresholds = new Map(); // priority → scroll threshold
    this._idleLoadTimer = null;
    this._onWorldLoadedCallbacks = []; // (worldId) => void
  }

  /**
   * Initialize the orchestrator.
   * @param {object} params
   * @param {THREE.Scene} params.scene
   * @param {THREE.Camera} params.camera
   * @param {THREE.WebGLRenderer} params.renderer
   * @param {string} params.qualityTier
   */
  init({ scene, camera, renderer, qualityTier }) {
    this.scene = scene;
    this.camera = camera;
    this.renderer = renderer;
    this.qualityTier = qualityTier;
    this.enabled = true;

    // Set up progressive loading thresholds
    this._scrollTriggerThresholds.set(LOAD_PRIORITY.HIGH, 0.05);
    this._scrollTriggerThresholds.set(LOAD_PRIORITY.DEFERRED, 0.15);

    // Start idle load timer for DEFERRED assets (in case user doesn't scroll)
    this._idleLoadTimer = setTimeout(() => {
      this._triggerLoad(LOAD_PRIORITY.DEFERRED);
    }, 8000);
  }

  /** Register a world with the orchestrator */
  registerWorld(world) {
    this.worlds.set(world.id, world);
    this.scene.add(world.group);
    this.loadQueue.push({ world, priority: world.loadPriority });
  }

  /** Register a transition */
  registerTransition(transition) {
    this.transitions.push(transition);
    // Sort by scroll range start for efficient lookup
    this.transitions.sort((a, b) => a.scrollRange[0] - b.scrollRange[0]);
  }

  _findActiveWorld(scrollProgress) {
    for (const [, world] of this.worlds) {
      const [start, end] = world.scrollRange;
      if (scrollProgress >= start && scrollProgress < end) {
        return world;
      }
    }
    return null;
  }

  /**
   * Load assets for worlds at a given priority level.
   * @param {number} priority — LOAD_PRIORITY value
   */
  async _triggerLoad(priority) {
    if (this._loadedPriorities.has(priority)) return;
    this._loadedPriorities.add(priority);

    const worldsAtPriority = this.loadQueue
      .filter((q) => q.priority === priority)
      .map((q) => q.world);

    for (const world of worldsAtPriority) {
      if (world.loaded || world._disposed) continue;

      try {
        const assets = await this._loadWorldAssets(world);
        world.onAssetsLoaded(assets);
        // Notify callbacks that a world finished loading
        for (const cb of this._onWorldLoadedCallbacks) {
          try { cb(world.id); } catch (_) { /* ignore */ }
        }
      } catch (err) {
        console.info(`[world-manager] Failed to load world "${world.id}":`, err?.message || err);
        // World remains unloaded — will render as atmospheric fallback
      }
    }
  }

  /**
   * Load GLBs for a single world.
   * @returns {Object} Map of asset paths → loaded GLTF scenes
   */
  async _loadWorldAssets(world) {
    const loader = new THREE.GLTFLoader();
    const assets = {};

    for (const assetPath of world.assetPaths) {
      try {
        const gltf = await new Promise((resolve, reject) => {
          loader.load(assetPath, resolve, undefined, reject);
        });
        assets[assetPath] = gltf;
      } catch (err) {
        console.info(`[world-manager] Asset skipped: ${assetPath}`, err?.message || err);
      }
    }

    return assets;
  }

  /**
   * Main per-frame update. Called from the scene render loop.
   * @param {number} scrollProgress — Normalized scroll (0-1)
   * @param {number} deltaTime — Frame delta in seconds
   */
  update(scrollProgress, deltaTime) {
    if (!this.enabled) return;

    this.scrollProgress = scrollProgress;
    const previousTransition = this.activeTransition;

    // Check if scroll has crossed a loading threshold
    for (const [priority, threshold] of this._scrollTriggerThresholds) {
      if (scrollProgress >= threshold && !this._loadedPriorities.has(priority)) {
        this._triggerLoad(priority);
      }
    }

    // Find active transition (if any)
    let activeTransition = null;
    for (const trans of this.transitions) {
      const [start, end] = trans.scrollRange;
      if (scrollProgress >= start && scrollProgress <= end) {
        activeTransition = trans;
        break;
      }
    }

    const newActiveWorld = activeTransition ? null : this._findActiveWorld(scrollProgress);

    if (previousTransition && previousTransition !== activeTransition) {
      previousTransition.reset(newActiveWorld);
    }

    // If we're in a transition, drive it
    if (activeTransition) {
      const t = activeTransition.getProgress(scrollProgress);
      const context = {
        scene: this.scene,
        camera: this.camera,
        renderer: this.renderer,
        deltaTime,
        scrollProgress,
        qualityTier: this.qualityTier,
      };
      activeTransition.update(t, context);
      this.activeTransition = activeTransition;
      this.activeWorld = null; // World is handled by transition
      return;
    }

    this.activeTransition = null;

    // Handle world change
    if (newActiveWorld && newActiveWorld !== this.activeWorld) {
      if (this.activeWorld) {
        this.activeWorld.active = false;
        this.activeWorld.group.visible = false;
        this.previousWorld = this.activeWorld;
      }
      newActiveWorld.active = true;
      if (newActiveWorld.loaded) {
        newActiveWorld.group.visible = true;
      }
      this.activeWorld = newActiveWorld;
    }

    // Update the active world
    if (this.activeWorld && this.activeWorld.loaded) {
      const localT = this.activeWorld.getLocalScroll(scrollProgress);
      this.activeWorld.update(localT, deltaTime);
    }
  }

  /**
   * Get the current lighting state (from active world or transition).
   * Used by the main scene render loop to set lights/fog/bloom.
   */
  getCurrentLighting() {
    if (this.activeTransition) {
      return this.activeTransition.getLightingState(this.activeTransition.progress);
    }
    if (this.activeWorld) {
      return this.activeWorld.getLightingState();
    }
    return null;
  }

  /**
   * Get the current camera target (from active world or transition).
   * Returns null if no world system camera target is available.
   */
  getCurrentCameraTarget() {
    if (this.activeTransition) {
      return this.activeTransition.getCameraTarget(this.activeTransition.progress);
    }
    if (this.activeWorld) {
      const localT = this.activeWorld.getLocalScroll(this.scrollProgress);
      return this.activeWorld.getCameraTarget(localT);
    }
    return null;
  }

  /**
   * Get the current particle story ID.
   */
  getCurrentParticleStory() {
    if (this.activeTransition) {
      const t = this.activeTransition.progress;
      // Blend particle story: use from-world story when entering, to-world story as we exit
      if (t < 0.5) return this.activeTransition.from?.particleStory || 'hero-orbit';
      return this.activeTransition.to?.particleStory || 'hero-orbit';
    }
    if (this.activeWorld) {
      return this.activeWorld.particleStory;
    }
    return null;
  }

  /**
   * Diagnostics output for __sceneDiagnostics.
   */
  getDiagnostics() {
    return {
      activeWorld: this.activeWorld?.id || null,
      activeTechniqueId: this.activeTransition?.technique || null,
      activeTransition: this.activeTransition
        ? {
            from: this.activeTransition.from?.id,
            to: this.activeTransition.to?.id,
            technique: this.activeTransition.technique,
            progress: Number(this.activeTransition.progress.toFixed(3)),
          }
        : null,
      loadedWorlds: Array.from(this.worlds.entries())
        .filter(([, w]) => w.loaded)
        .map(([id]) => id),
      visibleWorlds: Array.from(this.worlds.entries())
        .filter(([, w]) => w.group.visible)
        .map(([id]) => id),
      worldSummaries: Object.fromEntries(
        Array.from(this.worlds.entries()).map(([id, world]) => [id, summarizeWorldGroup(world)])
      ),
      totalWorlds: this.worlds.size,
      transitionCount: this.transitions.length,
      scrollProgress: Number(this.scrollProgress.toFixed(4)),
    };
  }

  dispose() {
    if (this._idleLoadTimer) {
      clearTimeout(this._idleLoadTimer);
    }
    this.activeTransition?.reset();
    for (const [, world] of this.worlds) {
      world.dispose();
    }
    for (const trans of this.transitions) {
      trans.dispose();
    }
    this.worlds.clear();
    this.transitions.length = 0;
    this.enabled = false;
  }
}

// ── Singleton Export ───────────────────────────────────────────────────────
const orchestrator = new WorldOrchestrator();

export {
  SceneWorld,
  TransitionSeq,
  WorldOrchestrator,
  orchestrator,
  LOAD_PRIORITY,
  clamp01,
  lerp,
  lerpColor,
  easeInOutPower2,
  easeOutExpo,
  easeInOutSine,
};
