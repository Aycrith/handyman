/**
 * src/scene/worlds/forge.js
 *
 * ACT 1 — "The Forge" (Hero Section)
 *
 * Wraps the existing hero tool scene. Adds workshop silhouette background at
 * low opacity and idle auto-rotation. Integrates with the existing director
 * phase state machine — ForgeWorld is active from pre-reveal through scroll-transition.
 */

import { SceneWorld, LOAD_PRIORITY } from '../world-manager.js';

const THREE = window.THREE;

export class ForgeWorld extends SceneWorld {
  constructor() {
    super({
      id: 'forge',
      label: 'The Forge',
      scrollRange: [0.00, 0.12],
      assetPaths: [], // Hero tools loaded by existing pipeline
      loadPriority: LOAD_PRIORITY.REUSE,
      lightingProfile: {
        key: 1.40, fill: 0.72, rim: 1.00, ground: 0.98,
        bloomGain: 0.68, thresholdBias: 0.06,
        bgColor: { r: 0.007, g: 0.009, b: 0.012 },
        fogDensity: 0.011,
        exposureBias: 0.0,
      },
      particleStory: 'hero-orbit',
      cameraWaypoints: [
        { x: 0.0, y: 0.0, z: 6.2 },  // Pre-reveal
        { x: 0.0, y: 0.0, z: 5.8 },  // Reveal
        { x: 0.0, y: 0.0, z: 5.5 },  // Lockup settled
      ],
    });

    this._idleAngle = 0;
    this._idleActive = true;
    this._workshopSilhouette = null;
  }

  onAssetsLoaded(assets) {
    super.onAssetsLoaded(assets);
    this.loaded = true; // Already loaded by existing hero pipeline
  }

  /**
   * Attach the existing hero group and optionally add workshop silhouette.
   * @param {THREE.Group} heroGroup — The existing hero tools group
   * @param {THREE.Object3D} workshopMesh — Optional workshop mesh for background
   */
  attachExistingHero(heroGroup, workshopMesh) {
    if (heroGroup && !this.group.children.includes(heroGroup)) {
      // Don't re-parent — just track it
      this._heroGroup = heroGroup;
    }

    if (workshopMesh) {
      this._workshopSilhouette = workshopMesh.clone();
      this._workshopSilhouette.traverse((child) => {
        if (child.isMesh) {
          child.material = child.material.clone();
          child.material.transparent = true;
          child.material.opacity = 0.08;
          child.material.depthWrite = false;
        }
      });
      this._workshopSilhouette.position.z = -4.0;
      this._workshopSilhouette.name = 'forge_workshop_silhouette';
      this.group.add(this._workshopSilhouette);
    }

    this.loaded = true;
  }

  enter(t) {
    super.enter(t);
    // Reset hero transform when re-entering (scroll back up)
    if (this._heroGroup) {
      this._heroGroup.scale.setScalar(1.0);
      this._heroGroup.position.z = 0;
    }
  }

  update(scrollT, deltaTime) {
    // Idle auto-rotation when at top of page
    if (this._idleActive && scrollT < 0.05) {
      this._idleAngle += deltaTime * (Math.PI * 2) / 20; // 20s full cycle
      const sway = Math.sin(this._idleAngle) * 0.052; // ±3° in radians
      this.group.rotation.y = sway;
    } else {
      // Smoothly return to center as user scrolls
      this.group.rotation.y *= 0.95;
    }
  }

  exit(t) {
    super.exit(t);
    // Scale and drift hero tools backward for the fog transition
    if (this._heroGroup) {
      const scale = 1.0 - t * 0.3; // 1.0 → 0.7
      this._heroGroup.scale.setScalar(Math.max(0.7, scale));
      this._heroGroup.position.z = t * 2.0; // Drift backward
    }
  }

  dispose() {
    if (this._workshopSilhouette) {
      this._workshopSilhouette.traverse((child) => {
        if (child.isMesh) {
          child.material?.dispose();
          child.geometry?.dispose();
        }
      });
    }
    super.dispose();
  }
}
