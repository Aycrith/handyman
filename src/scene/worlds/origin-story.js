/**
 * src/scene/worlds/origin-story.js
 *
 * ACT 6 — "The Origin Story" (About Section)
 *
 * Personal, warm, contemplative. Point cloud studio space as primary element.
 * Desktop-only: ghostly body traces as subliminal human presence behind the
 * point cloud. Warmest non-CTA scene.
 */

import { SceneWorld, LOAD_PRIORITY } from '../world-manager.js';
import { applyAssetScenes } from './asset-utils.js';

const THREE = window.THREE;

export class OriginStoryWorld extends SceneWorld {
  constructor(qualityTier) {
    const assetPaths = [
      new URL('../../../assets/models/environment/studio-pointcloud-optimized.glb', import.meta.url).href,
    ];
    // Body traces desktop-only
    if (qualityTier === 'desktop') {
      assetPaths.push(new URL('../../../assets/models/environment/body-traces-optimized.glb', import.meta.url).href);
    }

    super({
      id: 'origin-story',
      label: 'The Origin Story',
      scrollRange: [0.74, 0.82],
      assetPaths,
      loadPriority: LOAD_PRIORITY.DEFERRED,
      lightingProfile: {
        key: 0.72, fill: 0.45, rim: 0.38, ground: 0.50,
        bloomGain: 0.58, thresholdBias: 0.08,
        bgColor: { r: 0.009, g: 0.007, b: 0.006 },
        fogDensity: 0.010,
        exposureBias: 0.02,
        // Warm amber tint
        keyColor: { r: 0.95, g: 0.85, b: 0.70 },
      },
      particleStory: 'ember-low',
      cameraWaypoints: [
        { x: 0.0, y: -0.1, z: 6.2 },   // Entry (gentle forward lean)
        { x: 0.0, y: 0.15, z: 5.8 },    // Exit (intimate, uplifting)
      ],
    });

    this._studioCloud = null;
    this._bodyTraces = null;
    this._qualityTier = qualityTier;
  }

  onAssetsLoaded(assets) {
    super.onAssetsLoaded(assets);

    applyAssetScenes(assets, {
      'studio-pointcloud-optimized.glb': (scene) => {
        scene.name = 'origin_studio_cloud';
        scene.position.set(0, 0, 0);
        scene.scale.setScalar(1.0);
        // Point clouds are self-illuminated warm amber
        scene.traverse((child) => {
          if (child.isPoints && child.material) {
            child.material.color = new THREE.Color(0.95, 0.85, 0.70);
            child.material.transparent = true;
            child.material.opacity = 0.8;
            child.material.sizeAttenuation = true;
            child.material.blending = THREE.AdditiveBlending;
            child.material.depthWrite = false;
          }
        });
        this.group.add(scene);
        this._studioCloud = scene;
      },
      'body-traces-optimized.glb': (scene) => {
        scene.name = 'origin_body_traces';
        scene.position.set(0, 0, -1.5);
        scene.scale.setScalar(0.8);
        // Ghostly, low opacity human presence
        scene.traverse((child) => {
          if (child.material) {
            child.material.transparent = true;
            child.material.opacity = 0.25;
            child.material.depthWrite = false;
            if (child.material.color) {
              child.material.color.setRGB(0.85, 0.75, 0.65);
            }
          }
        });
        this.group.add(scene);
        this._bodyTraces = scene;
      },
    });
  }

  update(scrollT, deltaTime) {
    // Very gentle drift — barely perceptible
    if (this._studioCloud) {
      this._studioCloud.rotation.y += deltaTime * 0.02;
    }
    if (this._bodyTraces) {
      this._bodyTraces.rotation.y -= deltaTime * 0.01;
    }
  }
}
