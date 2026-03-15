/**
 * src/scene/worlds/evidence-room.js
 *
 * ACT 5 — "The Evidence Room" (Gallery Section)
 *
 * Documentary, editorial, high-contrast dark room. Wireframe globe slowly
 * rotates as centerpiece. Building backdrop provides architectural context.
 * Darkest scene on the page — crisp and editorial.
 */

import { SceneWorld, LOAD_PRIORITY } from '../world-manager.js';
import { applyAssetScenes } from './asset-utils.js';

const THREE = window.THREE;

export class EvidenceRoomWorld extends SceneWorld {
  constructor() {
    super({
      id: 'evidence-room',
      label: 'The Evidence Room',
      scrollRange: [0.60, 0.70],
      assetPaths: [
        new URL('../../../assets/models/environment/wireframe-globe.glb', import.meta.url).href,
        new URL('../../../assets/models/environment/building-exterior-optimized.glb', import.meta.url).href,
      ],
      loadPriority: LOAD_PRIORITY.HIGH,
      lightingProfile: {
        key: 0.55, fill: 0.20, rim: 0.82, ground: 0.15,
        bloomGain: 0.35, thresholdBias: 0.14,
        bgColor: { r: 0.005, g: 0.005, b: 0.007 },
        fogDensity: 0.006,
        exposureBias: -0.12,
      },
      particleStory: 'ember-scatter',
      cameraWaypoints: [
        { x: 0.0, y: 0.0, z: 5.4 },   // Entry (deep pullback)
        { x: 0.8, y: 0.0, z: 7.2 },   // Full reveal orbit
      ],
    });

    this._globe = null;
    this._building = null;
    this._orbitAngle = 0;
  }

  onAssetsLoaded(assets) {
    super.onAssetsLoaded(assets);

    applyAssetScenes(assets, {
      'wireframe-globe.glb': (scene) => {
        scene.name = 'evidence_globe';
        scene.position.set(0, 0, 0);
        scene.scale.setScalar(1.0);
        // Amber rim-lit edges (Fresnel-like emissive)
        scene.traverse((child) => {
          if (child.isMesh) {
            child.material = new THREE.MeshBasicMaterial({
              color: new THREE.Color(0.85, 0.65, 0.25),
              wireframe: true,
              transparent: true,
              opacity: 0.8,
            });
          }
        });
        this.group.add(scene);
        this._globe = scene;
      },
      'building-exterior-optimized.glb': (scene) => {
        scene.name = 'evidence_building_backdrop';
        scene.position.set(0, -1.0, -5.0);
        scene.scale.setScalar(0.5);
        // Barely visible moonlit backdrop
        scene.traverse((child) => {
          if (child.isMesh && child.material) {
            child.material.transparent = true;
            child.material.opacity = 0.15;
            child.material.depthWrite = false;
          }
        });
        this.group.add(scene);
        this._building = scene;
      },
    });
  }

  update(scrollT, deltaTime) {
    // Globe slow rotation
    if (this._globe) {
      this._globe.rotation.y += deltaTime * 0.105; // ~6°/s
    }

    // Camera orbits the globe (~8° per viewport scroll → rotation is proportional to scrollT)
    this._orbitAngle = scrollT * 0.14; // radians across full section
    this.group.rotation.y = this._orbitAngle;
  }
}
