/**
 * src/scene/worlds/blueprint-workshop.js
 *
 * ACT 2 — "The Blueprint Workshop" (Services Section)
 *
 * Full workshop environment with industrial toolbox and structural framing.
 * Blueprint grid overlay creates the organized, capable atmosphere.
 * Camera tracks laterally following service card scroll position.
 */

import { SceneWorld, LOAD_PRIORITY } from '../world-manager.js';
import { applyAssetScenes } from './asset-utils.js';

const THREE = window.THREE;

export class BlueprintWorkshopWorld extends SceneWorld {
  constructor() {
    super({
      id: 'blueprint-workshop',
      label: 'The Blueprint Workshop',
      scrollRange: [0.18, 0.30],
      assetPaths: [
        new URL('../../../assets/models/environment/workshop-optimized.glb', import.meta.url).href,
        new URL('../../../assets/models/environment/toolbox-optimized.glb', import.meta.url).href,
        new URL('../../../assets/models/environment/fence-optimized.glb', import.meta.url).href,
      ],
      loadPriority: LOAD_PRIORITY.CRITICAL,
      lightingProfile: {
        key: 0.82, fill: 0.48, rim: 0.64, ground: 0.60,
        bloomGain: 0.52, thresholdBias: 0.10,
        bgColor: { r: 0.006, g: 0.007, b: 0.011 },
        fogDensity: 0.009,
        exposureBias: -0.06,
      },
      particleStory: 'services-drift',
      cameraWaypoints: [
        { x: -0.5, y: 0.3, z: 5.4 },   // Entry (wide, slightly elevated)
        { x: 0.35, y: 0.15, z: 5.2 },   // Mid-section
        { x: 1.2, y: 0.1, z: 5.0 },     // End (lateral tracking right)
      ],
    });

    this._pendulumAngle = 0;
  }

  onAssetsLoaded(assets) {
    super.onAssetsLoaded(assets);

    applyAssetScenes(assets, {
      'workshop-optimized.glb': (scene) => {
        scene.name = 'workshop_env';
        scene.scale.setScalar(1.0);
        this.group.add(scene);
      },
      'toolbox-optimized.glb': (scene) => {
        scene.name = 'workshop_toolbox';
        scene.position.set(1.5, -0.3, 0.5);
        scene.scale.setScalar(0.6);
        this.group.add(scene);
      },
      'fence-optimized.glb': (scene) => {
        scene.name = 'workshop_fence';
        scene.position.set(-2.0, -0.5, -1.0);
        scene.scale.setScalar(0.8);
        this.group.add(scene);
      },
    });
  }

  update(scrollT, deltaTime) {
    // Gentle pendulum sway on Y-axis
    this._pendulumAngle += deltaTime * (Math.PI * 2) / 8; // 8s cycle
    const sway = Math.sin(this._pendulumAngle) * 0.08;
    this.group.rotation.y = sway;
  }

  exit(t) {
    super.exit(t);
    // On exit, begin wireframe morph (handled by transition technique)
  }
}
