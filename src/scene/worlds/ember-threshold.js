/**
 * src/scene/worlds/ember-threshold.js
 *
 * ACT 8 — "The Ember Threshold" (CTA Band + Trust Badges)
 *
 * Pure atmospheric act — no new geometry. Amber radial bloom creates warmth
 * and invitation. Particles concentrate in center-bottom (CTA button area).
 * Static camera. The warmth IS the experience.
 */

import { SceneWorld, LOAD_PRIORITY } from '../world-manager.js';

export class EmberThresholdWorld extends SceneWorld {
  constructor() {
    super({
      id: 'ember-threshold',
      label: 'The Ember Threshold',
      scrollRange: [0.92, 0.95],
      assetPaths: [], // No geometry — pure atmosphere
      loadPriority: LOAD_PRIORITY.REUSE,
      lightingProfile: {
        key: 0.45, fill: 0.60, rim: 0.35, ground: 0.65,
        bloomGain: 0.85, thresholdBias: 0.04,
        bgColor: { r: 0.012, g: 0.008, b: 0.005 },
        fogDensity: 0.015,
        exposureBias: 0.06,
        // Warm amber fill dominates
        fillColor: { r: 0.95, g: 0.80, b: 0.55 },
      },
      particleStory: 'ember-invitation',
      cameraWaypoints: [
        { x: 0.0, y: 0.0, z: 5.5 },  // Static
      ],
    });
  }

  onAssetsLoaded() {
    this.loaded = true; // No assets to load
  }

  update(scrollT, deltaTime) {
    // No geometry to update — particles and bloom handle the atmosphere
  }
}
