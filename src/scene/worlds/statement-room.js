/**
 * src/scene/worlds/statement-room.js
 *
 * ACT 3 — "The Statement Room" (Rhetoric Section)
 *
 * Abstract, minimal space where words dominate. Holographic forms float in a
 * deep void with dramatic single-source lighting and elevated bloom.
 */

import { SceneWorld, LOAD_PRIORITY } from '../world-manager.js';
import { applyAssetScenes } from './asset-utils.js';

const THREE = window.THREE;

export class StatementRoomWorld extends SceneWorld {
  constructor() {
    super({
      id: 'statement-room',
      label: 'The Statement Room',
      scrollRange: [0.34, 0.42],
      assetPaths: [
        new URL('../../../assets/models/environment/hologram-form.glb', import.meta.url).href,
        new URL('../../../assets/models/environment/abstract-geometry.glb', import.meta.url).href,
      ],
      loadPriority: LOAD_PRIORITY.HIGH,
      lightingProfile: {
        key: 0.65, fill: 0.20, rim: 0.50, ground: 0.15,
        bloomGain: 0.78, thresholdBias: 0.04,
        bgColor: { r: 0.004, g: 0.003, b: 0.006 },
        fogDensity: 0.004,
        exposureBias: -0.08,
      },
      particleStory: 'statement-drift',
      cameraWaypoints: [
        { x: 0.0, y: 0.0, z: 5.6 },   // Entry
        { x: 0.0, y: 0.1, z: 5.5 },   // Near-static center
      ],
    });

    this._orbitAngle = 0;
    this._colorCycleT = 0;
  }

  onAssetsLoaded(assets) {
    super.onAssetsLoaded(assets);

    applyAssetScenes(assets, {
      'hologram-form.glb': (scene) => {
        scene.name = 'holographic_form';
        scene.position.set(0, 0, 0);
        scene.scale.setScalar(0.8);
        // Apply emissive material for holographic effect
        scene.traverse((child) => {
          if (child.isMesh && child.material) {
            child.material.emissive = new THREE.Color(0.15, 0.12, 0.20);
            child.material.emissiveIntensity = 0.6;
            child.material.transparent = true;
            child.material.opacity = 0.85;
          }
        });
        this.group.add(scene);
        this._holoForm = scene;
      },
      'abstract-geometry.glb': (scene) => {
        scene.name = 'abstract_satellite';
        scene.position.set(1.8, 0.5, -0.5);
        scene.scale.setScalar(0.5);
        scene.traverse((child) => {
          if (child.isMesh && child.material) {
            child.material.emissive = new THREE.Color(0.10, 0.15, 0.18);
            child.material.emissiveIntensity = 0.4;
          }
        });
        this.group.add(scene);
        this._satellite = scene;
      },
    });
  }

  update(scrollT, deltaTime) {
    // Slow holographic form rotation
    if (this._holoForm) {
      this._holoForm.rotation.y += deltaTime * 0.15;
    }

    // Satellite orbits around center
    if (this._satellite) {
      this._orbitAngle += deltaTime * 0.3;
      this._satellite.position.x = Math.cos(this._orbitAngle) * 1.8;
      this._satellite.position.z = Math.sin(this._orbitAngle) * 1.2 - 0.5;
      this._satellite.rotation.y += deltaTime * 0.4;
    }

    // Subtle emissive color cycling on holographic surfaces
    this._colorCycleT += deltaTime * 0.08;
    if (this._holoForm) {
      this._holoForm.traverse((child) => {
        if (child.isMesh && child.material?.emissive) {
          const r = 0.12 + Math.sin(this._colorCycleT) * 0.05;
          const g = 0.12 + Math.sin(this._colorCycleT + 2.09) * 0.05;
          const b = 0.18 + Math.sin(this._colorCycleT + 4.19) * 0.05;
          child.material.emissive.setRGB(r, g, b);
        }
      });
    }
  }
}
