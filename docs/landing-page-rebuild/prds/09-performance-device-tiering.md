# PRD 09 — Performance Budget & Device-Tier Adaptation

**Status:** Planning
**Priority:** P2
**Files:** `vite.config.mjs`, `src/scene/index.js`
**Depends on:** Nothing (standalone optimizations)

---

## Objective

Fix Vite bundle size warning. Add code-splitting. Tighten frame budget enforcement with tab-hidden RAF suppression and a documented performance budget.

---

## Current State

### Bundle Analysis

```js
// vite.config.mjs — current (minimal)
export default defineConfig({
  server: { host: '127.0.0.1' },
  preview: { host: '127.0.0.1' },
  build: { target: 'es2022' }
});
```

- No `manualChunks` — Vite's default heuristic splits `node_modules` but not app code
- Default `chunkSizeWarningLimit: 500 KB` — main bundle exceeds this
- `src/scene/index.js` (9,359 lines) and `src/site/index.js` (1,266 lines) in same entry bundle

### Frame Budget

- Desktop target: ≤16.7ms (60fps)
- Mobile target: ≤22ms (~45fps)
- No RAF suppression when tab is hidden
- No automatic downgrade trigger if frame budget is exceeded

---

## Target State

### Bundle Architecture

```
Entry (index.html)
├── chunk-scene.js     → src/scene/index.js (heavy Three.js usage)
├── chunk-site.js      → src/site/index.js (GSAP-heavy, lighter)
└── chunk-vendor.js    → three, gsap, lenis, split-type
```

Each chunk loads in parallel. `chunk-scene.js` can be dynamically imported (deferred until scene init).

### Frame Budget Table

| Metric | Desktop Target | Mobile Target | Current Status |
|--------|---------------|---------------|----------------|
| RAF frame time | ≤16.7ms | ≤22ms | ~14ms desktop (est.) |
| JS parse time | ≤500ms | ≤1000ms | Unknown |
| Bundle: vendor | ≤400 KB gz | ≤400 KB gz | Unknown |
| Bundle: scene | ≤200 KB gz | ≤200 KB gz | Unknown |
| Bundle: site | ≤50 KB gz | ≤50 KB gz | Unknown |
| Hidden tab CPU | ~0% | ~0% | Unknown (no suppression) |

---

## Technical Implementation

### vite.config.mjs — Code Splitting

```js
import { defineConfig } from 'vite';

export default defineConfig({
  server: { host: '127.0.0.1' },
  preview: { host: '127.0.0.1' },
  build: {
    target: 'es2022',
    chunkSizeWarningLimit: 700, // raise from 500 to 700 KB
    rollupOptions: {
      output: {
        manualChunks: {
          // Three.js and its ecosystem
          'vendor-three': ['three'],
          // GSAP ecosystem
          'vendor-gsap': ['gsap'],
          // Utility libs
          'vendor-utils': ['lenis', 'split-type'],
        }
      }
    }
  }
});
```

Note: `src/scene/index.js` and `src/site/index.js` are internal modules, not npm packages — they'll be split by Rollup's default heuristic based on the `manualChunks` vendor separation. To force them into separate chunks, use dynamic import:

```js
// In main entry (or index.html script):
// Scene loads first (needs canvas ready)
import('./src/scene/index.js').then(module => {
  // site.js loads in parallel after scene starts
  import('./src/site/index.js');
});
```

### Tab-Hidden RAF Suppression

```js
// In src/scene/index.js — in the RAF tick() function:

let isHidden = false;

document.addEventListener('visibilitychange', () => {
  isHidden = document.hidden;
  if (!isHidden) {
    // Resume: reset clock to prevent time jump
    clock.getDelta(); // consume elapsed time since hidden
  }
});

function tick() {
  rafId = requestAnimationFrame(tick);

  if (isHidden) {
    // Minimal maintenance render: update context without full draw
    // Prevents WebGL context loss on some browsers
    if (frameCount % 60 === 0) { // every 60 frames ~= 1s
      renderer.render(scene, camera);
    }
    frameCount++;
    return; // Skip full render
  }

  // ... existing render code ...
}
```

### Runtime Frame Budget Monitor (Debug Mode)

```js
// Only active in development (import.meta.env.DEV)
if (import.meta.env.DEV) {
  let lastTime = performance.now();
  let slowFrames = 0;

  const origTick = tick;
  tick = function() {
    const now = performance.now();
    const dt = now - lastTime;
    lastTime = now;

    if (dt > 16.7) { // Over budget
      slowFrames++;
      if (slowFrames > 10) { // Sustained slow frames
        console.warn(`[perf] ${slowFrames} slow frames (${dt.toFixed(1)}ms) — consider downgrade`);
        slowFrames = 0;
      }
    } else {
      slowFrames = Math.max(0, slowFrames - 1);
    }

    origTick.apply(this, arguments);
  };
}
```

### Battery API (Optional Enhancement)

```js
// If navigator.getBattery is available, reduce quality on battery with low charge
if ('getBattery' in navigator) {
  navigator.getBattery().then(battery => {
    if (!battery.charging && battery.level < 0.2) {
      // Suggest downgrade to mobile tier
      console.info('[perf] Low battery detected — reducing render quality');
      setQualityTier('mobile'); // if tier switching is supported
    }
  });
}
```

---

## Acceptance Criteria

- [ ] `npm run build` produces no chunk-size warnings
- [ ] `vendor-three`, `vendor-gsap`, `vendor-utils` chunks in build output
- [ ] Tab-hidden: RAF loop skips full render (confirmed via DevTools Performance)
- [ ] `document.visibilitychange` handler attached in `src/scene/index.js`
- [ ] No WebGL context loss during 60-second tab-hidden test
- [ ] `import.meta.env.DEV` guard on perf monitor (not in production bundle)
- [ ] `vite.config.mjs` `chunkSizeWarningLimit: 700`
- [ ] After splitting: no individual chunk exceeds 700 KB uncompressed
