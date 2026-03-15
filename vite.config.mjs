import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    host: '127.0.0.1',
  },
  preview: {
    host: '127.0.0.1',
    port: 4173,
    strictPort: true,  // FAIL instead of auto-incrementing — forces the caller to kill the port first
  },
  build: {
    target: 'es2022',
    // Chunk size warning limit: 1200KB accounts for Three.js r134 core bundle
    // which is ~600KB on its own and cannot be reduced without refactoring imports.
    // See src/runtime-globals.js: `import * as ThreeCore` defeats tree-shaking.
    // Code-splitting strategy in manualChunks (D5 — Performance Budget):
    // - three-core: Three.js core (~560 KB) — unavoidable due to namespace spread
    // - three-extras: loaders, postproc JSM (~120 KB) — individually tree-shakeable
    // - scene-app: src/scene/index.js application code (~420 KB)
    // - vendor-motion: GSAP + Lenis + SplitType (~140 KB)
    chunkSizeWarningLimit: 1200,
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // Three.js core — split from extras to isolate the unavoidable namespace
          if (id.includes('node_modules/three/build') || id.includes('node_modules/three/src')) {
            return 'three-core';
          }
          // Three.js extras (loaders, postprocessing, shaders, lights)
          if (id.includes('node_modules/three/examples')) {
            return 'three-extras';
          }
          // Scene application code and initialization
          if (id.includes('src/scene')) {
            return 'scene-app';
          }
          // GSAP + motion vendor chunk
          if (id.includes('gsap') || id.includes('lenis') || id.includes('split-type')) {
            return 'vendor-motion';
          }
        },
      },
    },
  },
});
