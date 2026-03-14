import * as ThreeCore from 'three';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import SplitType from 'split-type';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { CopyShader } from 'three/examples/jsm/shaders/CopyShader.js';
import { LuminosityHighPassShader } from 'three/examples/jsm/shaders/LuminosityHighPassShader.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js';
import { RectAreaLightUniformsLib } from 'three/examples/jsm/lights/RectAreaLightUniformsLib.js';
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js';

const THREE = {
  ...ThreeCore,
  EffectComposer,
  RenderPass,
  ShaderPass,
  UnrealBloomPass,
  CopyShader,
  LuminosityHighPassShader,
  GLTFLoader,
  RGBELoader,
  RectAreaLightUniformsLib,
};

globalThis.THREE = THREE;
globalThis.MeshoptDecoder = MeshoptDecoder;
globalThis.gsap = gsap;
globalThis.ScrollTrigger = ScrollTrigger;
globalThis.Lenis = Lenis;
globalThis.SplitType = SplitType;

export { THREE, gsap, ScrollTrigger, Lenis, SplitType, MeshoptDecoder };
