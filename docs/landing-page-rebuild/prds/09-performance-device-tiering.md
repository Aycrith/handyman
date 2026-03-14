# PRD 09 — Performance Budget & Device-Tier Adaptation

## Objective

Fix Vite bundle size warning. Add code-splitting. Tighten frame budget enforcement.

## Vite Configuration

```js
// vite.config.mjs
export default defineConfig({
  build: {
    chunkSizeWarningLimit: 700,
    rollupOptions: {
      output: {
        manualChunks: {
          'scene': ['./src/scene/index.js'],
          'vendor': ['three', 'gsap'],
        }
      }
    }
  }
});
```

## RAF Suppression (Hidden Tab)

```js
// In src/scene/index.js RAF loop
function animate() {
  if (document.hidden) {
    requestAnimationFrame(animate);
    return; // Skip render when tab hidden
  }
  // ... normal render
  requestAnimationFrame(animate);
}

// Also pause Lenis when hidden
document.addEventListener('visibilitychange', () => {
  if (document.hidden) lenis.stop();
  else lenis.start();
});
```

## Frame Budget Enforcement

The existing quality tier system already implements runtime downgrade. Extend:
- If 5 consecutive frames exceed 22ms → downgrade to `low` tier
- Low tier: disable scatter pass, reduce particles to 25% count

## CSS Variable Caps

```css
:root {
  --max-fps: 60; /* Can be reduced programmatically */
}
```

## Acceptance

- `vite build` produces no chunk-size warnings
- Hidden tab: RAF renders at 0 fps (effectively paused)
- Frame budget: ≤16.7ms desktop, ≤22ms mobile (existing monitoring)
- Build: scene and site in separate chunks
