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
    // Raise chunk size warning to 700KB — the bundle includes Three.js which is large by design
    // Code-splitting is handled via manualChunks below (D5 — Performance Budget)
    chunkSizeWarningLimit: 700,
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // Separate Three.js + scene from site/UI code
          if (id.includes('three') || id.includes('src/scene')) {
            return 'scene';
          }
          // GSAP + Lenis vendor chunk
          if (id.includes('gsap') || id.includes('lenis') || id.includes('split-type')) {
            return 'vendor-motion';
          }
        },
      },
    },
  },
});
