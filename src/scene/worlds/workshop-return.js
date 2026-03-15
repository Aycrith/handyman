/**
 * src/scene/worlds/workshop-return.js
 *
 * ACT 9 — "The Workshop Return" (Contact Section)
 *
 * Circle closes: the workshop from ACT 2 returns warm-lit. Same geometry,
 * different lighting profile. Intimate camera — closest on the entire page.
 * The contact form IS the workshop. Filling it out = starting the project.
 */

import { SceneWorld, LOAD_PRIORITY } from '../world-manager.js';

const THREE = window.THREE;

export class WorkshopReturnWorld extends SceneWorld {
  constructor() {
    super({
      id: 'workshop-return',
      label: 'The Workshop Return',
      scrollRange: [0.98, 1.00],
      assetPaths: [], // Reuses workshop geometry from ACT 2
      loadPriority: LOAD_PRIORITY.REUSE,
      lightingProfile: {
        key: 0.80, fill: 0.55, rim: 0.48, ground: 0.72,
        bloomGain: 0.62, thresholdBias: 0.07,
        bgColor: { r: 0.014, g: 0.012, b: 0.009 },
        fogDensity: 0.012,
        exposureBias: 0.06,
        // Warm gold-amber
        keyColor: { r: 0.95, g: 0.88, b: 0.72 },
      },
      particleStory: 'ember-invitation',
      cameraWaypoints: [
        { x: 0.0, y: 0.0, z: 4.8 },   // Intimate close-up
        { x: 0.0, y: 0.0, z: 4.5 },   // Slowly approaching
      ],
    });

    this._workshopGroup = null;
  }

  /**
   * Reuse the workshop group from BlueprintWorkshopWorld (ACT 2).
   * This avoids loading the geometry twice.
   * @param {THREE.Group} workshopGroup — The workshop group from ACT 2
   */
  attachWorkshopGroup(workshopGroup) {
    if (!workshopGroup) return;
    this._workshopGroup = workshopGroup;
    // Re-color for warm lighting (applied in enter/update, not here)
    this.loaded = true;
  }

  enter(t) {
    super.enter(t);
    if (this._workshopGroup && t > 0.1) {
      this._workshopGroup.visible = true;
      // Apply warm tint to materials
      this._workshopGroup.traverse((child) => {
        if (child.isMesh && child.material) {
          if (child.material.emissive) {
            child.material.emissive.setRGB(0.06, 0.04, 0.02);
          }
        }
      });
    }
  }

  update(scrollT, deltaTime) {
    // Gentle warming drift — camera slowly moves closer
    // (handled by camera waypoints)
  }

  exit(t) {
    super.exit(t);
    // Fade to silhouette (ACT 10 — footer fade)
    if (this._workshopGroup) {
      this._workshopGroup.traverse((child) => {
        if (child.isMesh && child.material) {
          child.material.transparent = true;
          child.material.opacity = Math.max(0.08, 1 - t);
        }
      });
    }
  }
}
