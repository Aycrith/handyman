/**
 * src/scene/worlds/precision-line.js
 *
 * ACT 4 — "The Precision Line" (Process Section)
 *
 * Methodical, blueprint-precise environment. Wireframe city map scrolls like
 * a conveyor-belt blueprint. Rivet gun floats as precision tool prop.
 * Linear camera tracking matches the 3-step process narrative.
 */

import { SceneWorld, LOAD_PRIORITY } from '../world-manager.js';
import { applyAssetScenes } from './asset-utils.js';

const THREE = window.THREE;

export class PrecisionLineWorld extends SceneWorld {
  constructor() {
    super({
      id: 'precision-line',
      label: 'The Precision Line',
      scrollRange: [0.46, 0.56],
      assetPaths: [
        new URL('../../../assets/models/environment/wireframe-map.glb', import.meta.url).href,
        new URL('../../../assets/models/environment/rivet-gun-optimized.glb', import.meta.url).href,
      ],
      loadPriority: LOAD_PRIORITY.HIGH,
      lightingProfile: {
        key: 0.90, fill: 0.55, rim: 0.48, ground: 0.40,
        bloomGain: 0.56, thresholdBias: 0.09,
        bgColor: { r: 0.005, g: 0.005, b: 0.008 },
        fogDensity: 0.005,
        exposureBias: 0.04,
      },
      particleStory: 'dust-drift',
      cameraWaypoints: [
        { x: -1.4, y: 0.0, z: 5.2 },   // Start left
        { x: 0.0, y: 0.0, z: 5.2 },    // Center
        { x: 1.4, y: 0.0, z: 5.2 },    // End right
      ],
    });

    this._wireframeMap = null;
    this._rivetGun = null;
  }

  onAssetsLoaded(assets) {
    super.onAssetsLoaded(assets);

    applyAssetScenes(assets, {
      'wireframe-map.glb': (scene) => {
        scene.name = 'wireframe_map';
        scene.position.set(0, -0.5, -1.0);
        scene.scale.setScalar(1.2);
        // Force wireframe + emissive rendering
        scene.traverse((child) => {
          if (child.isMesh) {
            child.material = new THREE.MeshBasicMaterial({
              color: new THREE.Color(0.15, 0.65, 0.85),
              wireframe: true,
              transparent: true,
              opacity: 0.75,
            });
          }
        });
        this.group.add(scene);
        this._wireframeMap = scene;
      },
      'rivet-gun-optimized.glb': (scene) => {
        scene.name = 'rivet_gun_prop';
        scene.position.set(-1.2, 0.2, 1.0);
        scene.scale.setScalar(0.4);
        // Rim-lit amber for warmth
        scene.traverse((child) => {
          if (child.isMesh && child.material) {
            child.material.emissive = new THREE.Color(0.12, 0.08, 0.02);
            child.material.emissiveIntensity = 0.3;
          }
        });
        this.group.add(scene);
        this._rivetGun = scene;
      },
    });
  }

  update(scrollT, deltaTime) {
    // Wireframe map scrolls laterally (conveyor-belt effect)
    if (this._wireframeMap) {
      this._wireframeMap.position.x = -scrollT * 3.0 + 1.5;
    }

    // Rivet gun gentle idle float
    if (this._rivetGun) {
      this._rivetGun.position.y = 0.2 + Math.sin(performance.now() / 1000 * 0.5) * 0.05;
      this._rivetGun.rotation.y += deltaTime * 0.1;
    }
  }
}
