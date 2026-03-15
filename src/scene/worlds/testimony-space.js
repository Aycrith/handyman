/**
 * src/scene/worlds/testimony-space.js
 *
 * ACT 7 — "The Testimony Space" (Testimonials Section)
 *
 * Intimate, hushed, reverent space where client voices dominate. Point cloud
 * studio with soft haze particle layer. Near-static camera — words are the focus.
 */

import { SceneWorld, LOAD_PRIORITY } from '../world-manager.js';
import { applyAssetScenes } from './asset-utils.js';

const THREE = window.THREE;

export class TestimonySpaceWorld extends SceneWorld {
  constructor(qualityTier) {
    const assetPaths = [
      new URL('../../../assets/models/environment/testimony-pointcloud-optimized.glb', import.meta.url).href,
    ];
    if (qualityTier === 'desktop') {
      assetPaths.push(new URL('../../../assets/models/environment/ambient-pointcloud-optimized.glb', import.meta.url).href);
    }

    super({
      id: 'testimony-space',
      label: 'The Testimony Space',
      scrollRange: [0.86, 0.92],
      assetPaths,
      loadPriority: LOAD_PRIORITY.DEFERRED,
      lightingProfile: {
        key: 0.60, fill: 0.50, rim: 0.32, ground: 0.35,
        bloomGain: 0.50, thresholdBias: 0.11,
        bgColor: { r: 0.006, g: 0.007, b: 0.010 },
        fogDensity: 0.008,
        exposureBias: -0.02,
      },
      particleStory: 'testimony-haze',
      cameraWaypoints: [
        { x: 0.0, y: 0.0, z: 5.8 },   // Near-static entry
        { x: 0.05, y: 0.0, z: 5.75 },  // Barely visible drift
      ],
    });

    this._studioCloud = null;
    this._ambientCloud = null;
  }

  onAssetsLoaded(assets) {
    super.onAssetsLoaded(assets);

    applyAssetScenes(assets, {
      'testimony-pointcloud-optimized.glb': (scene) => {
        scene.name = 'testimony_studio';
        scene.position.set(0, 0, 0);
        scene.scale.setScalar(1.0);
        // Soft neutral coloring
        scene.traverse((child) => {
          if (child.isPoints && child.material) {
            child.material.color = new THREE.Color(0.72, 0.72, 0.75);
            child.material.transparent = true;
            child.material.opacity = 0.65;
            child.material.sizeAttenuation = true;
            child.material.blending = THREE.AdditiveBlending;
            child.material.depthWrite = false;
          }
        });
        this.group.add(scene);
        this._studioCloud = scene;
      },
      'ambient-pointcloud-optimized.glb': (scene) => {
        scene.name = 'testimony_ambient';
        scene.position.set(3.0, 1.0, -4.0);
        scene.scale.setScalar(0.6);
        // Distant ambient — very faint
        scene.traverse((child) => {
          if (child.material) {
            child.material.transparent = true;
            child.material.opacity = 0.15;
            child.material.depthWrite = false;
          }
        });
        this.group.add(scene);
        this._ambientCloud = scene;
      },
    });
  }

  update(scrollT, deltaTime) {
    // Almost no movement — testimonial words are the star
    if (this._studioCloud) {
      this._studioCloud.rotation.y += deltaTime * 0.008;
    }
  }
}
