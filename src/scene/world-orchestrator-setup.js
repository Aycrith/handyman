/**
 * src/scene/world-orchestrator-setup.js
 *
 * Bridges the existing scene IIFE (src/scene/index.js) with the new world
 * system (ES modules). This module is imported by the scene IIFE and wires
 * the WorldOrchestrator into the existing render loop, lighting system,
 * camera system, and diagnostics.
 *
 * Integration points:
 *   1. initWorldOrchestrator() — Called after startScene(), registers all worlds + transitions
 *   2. updateWorldOrchestrator() — Called per-frame from animate(), drives world/transition logic
 *   3. getWorldDiagnostics() — Extends __sceneDiagnostics() with world state
 *   4. getWorldLightingOverride() — Returns lighting state from active world/transition
 */

import {
  orchestrator,
  LOAD_PRIORITY,
} from './world-manager.js';

import {
  createTechnique,
} from './transition-techniques.js';

import { ForgeWorld } from './worlds/forge.js';
import { BlueprintWorkshopWorld } from './worlds/blueprint-workshop.js';
import { StatementRoomWorld } from './worlds/statement-room.js';
import { PrecisionLineWorld } from './worlds/precision-line.js';
import { EvidenceRoomWorld } from './worlds/evidence-room.js';
import { OriginStoryWorld } from './worlds/origin-story.js';
import { TestimonySpaceWorld } from './worlds/testimony-space.js';
import { EmberThresholdWorld } from './worlds/ember-threshold.js';
import { WorkshopReturnWorld } from './worlds/workshop-return.js';

import { TransitionSeq } from './world-manager.js';

const THREE = window.THREE;

// ── World Instances (module-level for cross-function access) ───────────────
let forge = null;
let blueprintWorkshop = null;
let statementRoom = null;
let precisionLine = null;
let evidenceRoom = null;
let originStory = null;
let testimonySpace = null;
let emberThreshold = null;
let workshopReturn = null;

let initialized = false;

// ── Transition Technique Instances ─────────────────────────────────────────
let fogFlythrough1 = null;    // Transition 1→2
let wireframeMorph2 = null;   // Transition 2→3
let particleDissolve3 = null; // Transition 3→4
let wireframeConverge4 = null;// Transition 4→5
let emberDissolve5 = null;    // Transition 5→6
let pointCloudMorph6 = null;  // Transition 6→7
let bloomCrossfade7 = null;   // Transition 7→8
let fogFlythrough8 = null;    // Transition 8→9

/**
 * Initialize and register all worlds and transitions with the orchestrator.
 *
 * @param {object} params
 * @param {THREE.Scene} params.scene
 * @param {THREE.Camera} params.camera
 * @param {THREE.WebGLRenderer} params.renderer
 * @param {string} params.qualityTier — 'desktop' | 'mobile' | 'low'
 * @param {THREE.Group} [params.heroGroup] — Existing hero tools group
 * @param {THREE.Object3D} [params.workshopMesh] — Workshop mesh for silhouette
 */
function initWorldOrchestrator({ scene, camera, renderer, qualityTier, heroGroup, workshopMesh }) {
  if (initialized) return;
  if (qualityTier === 'low') {
    // Low tier: no world system — existing zone fallback only
    return;
  }

  orchestrator.init({ scene, camera, renderer, qualityTier });

  const isMobile = qualityTier === 'mobile';

  // ── Create Worlds ──────────────────────────────────────────────────────
  forge = new ForgeWorld();
  forge.attachExistingHero(heroGroup, workshopMesh);
  orchestrator.registerWorld(forge);

  blueprintWorkshop = new BlueprintWorkshopWorld();
  orchestrator.registerWorld(blueprintWorkshop);

  // Middle worlds: desktop only. Mobile uses existing zone color/particle shifts.
  if (!isMobile) {
    statementRoom = new StatementRoomWorld();
    orchestrator.registerWorld(statementRoom);

    precisionLine = new PrecisionLineWorld();
    orchestrator.registerWorld(precisionLine);

    evidenceRoom = new EvidenceRoomWorld();
    orchestrator.registerWorld(evidenceRoom);

    originStory = new OriginStoryWorld(qualityTier);
    orchestrator.registerWorld(originStory);

    testimonySpace = new TestimonySpaceWorld(qualityTier);
    orchestrator.registerWorld(testimonySpace);
  }

  emberThreshold = new EmberThresholdWorld();
  emberThreshold.onAssetsLoaded({}); // No assets — mark loaded
  orchestrator.registerWorld(emberThreshold);

  workshopReturn = new WorkshopReturnWorld();
  orchestrator.registerWorld(workshopReturn);

  // Mobile: widen scroll ranges so the 4 worlds cover the full page
  if (isMobile) {
    blueprintWorkshop.scrollRange = [0.18, 0.55];
    emberThreshold.scrollRange = [0.65, 0.85];
    workshopReturn.scrollRange = [0.95, 1.00];
  }

  // ── Create Transition Techniques ───────────────────────────────────────
  fogFlythrough1 = createTechnique('fog-flythrough', {
    fogColor: { r: 0.03, g: 0.04, b: 0.06 },
    maxDensity: 0.92,
    noiseScale: 3.5,
    noiseSpeed: 0.4,
  });

  if (!isMobile) {
    wireframeMorph2 = createTechnique('wireframe-morph', {
      wireframeColor: { r: 0.2, g: 0.8, b: 1.0 },
      wireframeOpacity: 0.6,
    });

    particleDissolve3 = createTechnique('particle-dissolve', {
      particleCount: qualityTier === 'desktop' ? 5000 : 2000,
      startColor: { r: 0.5, g: 0.4, b: 0.8 },
      endColor: { r: 0.85, g: 0.65, b: 0.25 },
      scatterRadius: 2.5,
    });

    wireframeConverge4 = createTechnique('wireframe-morph', {
      wireframeColor: { r: 0.85, g: 0.65, b: 0.25 },
      wireframeOpacity: 0.8,
    });

    emberDissolve5 = createTechnique('particle-dissolve', {
      particleCount: qualityTier === 'desktop' ? 4000 : 1500,
      startColor: { r: 0.85, g: 0.65, b: 0.25 },
      endColor: { r: 0.95, g: 0.85, b: 0.70 },
      scatterRadius: 1.8,
    });

    if (qualityTier === 'desktop') {
      pointCloudMorph6 = createTechnique('point-cloud-morph', {
        maxPoints: 50000,
        pointSize: 2.0,
        startColor: { r: 0.95, g: 0.85, b: 0.70 },
        endColor: { r: 0.72, g: 0.72, b: 0.75 },
      });
    }
  }

  bloomCrossfade7 = createTechnique('bloom-crossfade', {
    peakBloom: 0.85,
    startBloom: 0.50,
    endBloom: 0.62,
    warmShift: { r: 0.06, g: 0.04, b: -0.02 },
  });

  fogFlythrough8 = createTechnique('fog-flythrough', {
    fogColor: { r: 0.10, g: 0.07, b: 0.04 }, // Amber fog variant
    maxDensity: 0.80,
    noiseScale: 3.0,
    noiseSpeed: 0.3,
  });

  // ── Register Transitions ───────────────────────────────────────────────

  // Transition 1→2: Fog Flythrough "Entering the Workshop" ★ SIGNATURE ★
  orchestrator.registerTransition(new TransitionSeq({
    from: forge,
    to: blueprintWorkshop,
    scrollRange: [0.08, 0.18],
    technique: 'fog-flythrough',
    techniqueController: fogFlythrough1,
    cameraSpline: [
      { x: 0.0, y: 0.0, z: 5.5 },
      { x: 0.0, y: 0.1, z: 4.5 },
      { x: 0.0, y: 0.2, z: 3.0 },
      { x: -0.3, y: 0.3, z: 4.0 },
      { x: -0.5, y: 0.3, z: 5.4 },
    ],
  }));

  if (!isMobile) {
    // Transition 2→3: Wireframe Morph "Rising Through the Roof"
    orchestrator.registerTransition(new TransitionSeq({
      from: blueprintWorkshop,
      to: statementRoom,
      scrollRange: [0.28, 0.34],
      technique: 'wireframe-morph',
      techniqueController: wireframeMorph2,
      cameraSpline: [
        { x: 1.2, y: 0.1, z: 5.0 },
        { x: 0.6, y: 1.5, z: 5.2 },
        { x: 0.0, y: 2.5, z: 5.6 },
      ],
    }));

    // Transition 3→4: Particle Dissolve "Scattering to Structure"
    orchestrator.registerTransition(new TransitionSeq({
      from: statementRoom,
      to: precisionLine,
      scrollRange: [0.40, 0.46],
      technique: 'particle-dissolve',
      techniqueController: particleDissolve3,
    }));

    // Transition 4→5: Wireframe Convergence
    orchestrator.registerTransition(new TransitionSeq({
      from: precisionLine,
      to: evidenceRoom,
      scrollRange: [0.54, 0.60],
      technique: 'wireframe-morph',
      techniqueController: wireframeConverge4,
    }));

    // Transition 5→6: Ember Dissolution
    orchestrator.registerTransition(new TransitionSeq({
      from: evidenceRoom,
      to: originStory,
      scrollRange: [0.68, 0.74],
      technique: 'particle-dissolve',
      techniqueController: emberDissolve5,
    }));

    // Transition 6→7: Point Cloud Compression (desktop only)
    if (qualityTier === 'desktop' && pointCloudMorph6) {
      orchestrator.registerTransition(new TransitionSeq({
        from: originStory,
        to: testimonySpace,
        scrollRange: [0.80, 0.86],
        technique: 'point-cloud-morph',
        techniqueController: pointCloudMorph6,
      }));
    }

    // Transition 7→8: Bloom Crossfade "Warmth Approaching"
    orchestrator.registerTransition(new TransitionSeq({
      from: testimonySpace,
      to: emberThreshold,
      scrollRange: [0.90, 0.94],
      technique: 'bloom-crossfade',
      techniqueController: bloomCrossfade7,
    }));

    // Transition 8→9: Fog Flythrough "Workshop Return" (amber variant)
    orchestrator.registerTransition(new TransitionSeq({
      from: emberThreshold,
      to: workshopReturn,
      scrollRange: [0.94, 0.98],
      technique: 'fog-flythrough',
      techniqueController: fogFlythrough8,
    }));
  } else {
    // Mobile: simplified 4-world journey with 3 transitions
    // Workshop → Ember (bloom crossfade)
    orchestrator.registerTransition(new TransitionSeq({
      from: blueprintWorkshop,
      to: emberThreshold,
      scrollRange: [0.55, 0.65],
      technique: 'bloom-crossfade',
      techniqueController: bloomCrossfade7,
    }));

    // Ember → Workshop Return (amber fog flythrough)
    orchestrator.registerTransition(new TransitionSeq({
      from: emberThreshold,
      to: workshopReturn,
      scrollRange: [0.85, 0.95],
      technique: 'fog-flythrough',
      techniqueController: fogFlythrough8,
    }));
  }

  // ── Workshop Return: Link geometry after BlueprintWorkshop loads ─────────
  orchestrator._onWorldLoadedCallbacks.push((worldId) => {
    if (worldId === 'blueprint-workshop' && blueprintWorkshop && workshopReturn) {
      workshopReturn.attachWorkshopGroup(blueprintWorkshop.group);
    }
  });

  // ── Trigger Critical Asset Loading ─────────────────────────────────────
  orchestrator._triggerLoad(LOAD_PRIORITY.CRITICAL);

  initialized = true;
  console.info('[world-orchestrator] Initialized with', orchestrator.worlds.size, 'worlds and', orchestrator.transitions.length, 'transitions.');
}

/**
 * Per-frame update. Call from animate() after updateSceneState().
 * @param {number} scrollProgress — Normalized scroll (0-1)
 * @param {number} deltaTime — Frame delta in seconds
 */
function updateWorldOrchestrator(scrollProgress, deltaTime) {
  if (!initialized) return;
  orchestrator.update(scrollProgress, deltaTime);
}

/**
 * Get current world lighting override for the zone system.
 * Returns null if no world override is active (fall back to zone system).
 */
function getWorldLightingOverride() {
  if (!initialized) return null;
  return orchestrator.getCurrentLighting();
}

/**
 * Get current world camera target.
 * Returns null if no world camera is active.
 */
function getWorldCameraTarget() {
  if (!initialized) return null;
  return orchestrator.getCurrentCameraTarget();
}

/**
 * Get current world particle story ID.
 */
function getWorldParticleStory() {
  if (!initialized) return null;
  return orchestrator.getCurrentParticleStory();
}

/**
 * Get diagnostics for __sceneDiagnostics() extension.
 */
function getWorldDiagnostics() {
  if (!initialized) return { enabled: false };
  return {
    enabled: true,
    ...orchestrator.getDiagnostics(),
  };
}

/**
 * Link the workshop return world to reuse ACT 2 workshop geometry.
 * Called after BlueprintWorkshopWorld's assets have loaded.
 */
function linkWorkshopReturn() {
  if (!initialized || !blueprintWorkshop || !workshopReturn) return;
  workshopReturn.attachWorkshopGroup(blueprintWorkshop.group);
}

/**
 * Dispose of all world system resources.
 */
function disposeWorldOrchestrator() {
  if (!initialized) return;

  orchestrator.dispose();
  fogFlythrough1 = null;
  wireframeMorph2 = null;
  particleDissolve3 = null;
  wireframeConverge4 = null;
  emberDissolve5 = null;
  pointCloudMorph6 = null;
  bloomCrossfade7 = null;
  fogFlythrough8 = null;
  initialized = false;
}

export {
  initWorldOrchestrator,
  updateWorldOrchestrator,
  getWorldLightingOverride,
  getWorldCameraTarget,
  getWorldParticleStory,
  getWorldDiagnostics,
  linkWorkshopReturn,
  disposeWorldOrchestrator,
};
