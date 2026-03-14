# PRD 07 — Shaders / Materials / Lighting Enhancement

**Status:** Planning
**Priority:** P2
**Files:** `src/scene/index.js`, `src/shaders/grain.glsl` (new), `src/shaders/grade.glsl` (new)
**Depends on:** D1 (Post-processing expansion) — EffectComposer chain must be extended first

---

## Objective

Introduce custom GLSL shaders for film grain and color grading. The current CSS film grain (static `feTurbulence` SVG) has no temporal variation — same grain pattern every frame, which breaks the cinematic illusion. The EffectComposer needs a custom color grade shader with configurable parameters per director phase.

---

## Current State

### EffectComposer Chain

```
RenderPass → UnrealBloomPass → CopyShader (renderToScreen)
```

### Film Grain

```css
/* styles.css ~line 193 — static SVG data URI */
.noise-overlay {
  background-image: url("data:image/svg+xml;base64,...feTurbulence...");
  opacity: 0.038;
  mix-blend-mode: overlay;
}
```

**Problem:** Static SVG feTurbulence generates the same grain pattern each frame. Real film grain changes every frame (temporal noise). This is immediately detectable and breaks cinematic quality.

### Color Grade

No custom color grade. `ACESFilmicToneMapping` is set on the renderer but there's no per-phase color control.

---

## Target EffectComposer Chain

```
RenderPass → BokehPass (DoF) → UnrealBloomPass → CaPass → GrainPass → GradePass → CopyShader
```

All new passes gated behind `CAN_RUN_DESKTOP_POST`.

---

## Shader Specifications

### grain.glsl

**Purpose:** Procedural temporal film grain — changes every frame via `uTime` uniform.

```glsl
// src/shaders/grain.glsl — vertex shader (standard fullscreen)
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
```

```glsl
// src/shaders/grain.glsl — fragment shader
uniform sampler2D tDiffuse;
uniform float uTime;
uniform float uStrength; // 0.028 baseline (subtle)

varying vec2 vUv;

float rand(vec2 co) {
  return fract(sin(dot(co, vec2(12.9898, 78.233))) * 43758.5453);
}

void main() {
  vec4 texel = texture2D(tDiffuse, vUv);

  // Temporal noise: multiply vUv by uTime so pattern changes each frame
  float noise = rand(vUv * uTime * 0.01);
  noise = (noise - 0.5) * uStrength; // center around 0

  gl_FragColor = vec4(texel.rgb + noise, texel.a);
}
```

**Uniforms:**
| Uniform | Type | Default | Range |
|---------|------|---------|-------|
| `tDiffuse` | sampler2D | (previous pass) | — |
| `uTime` | float | clock.getElapsedTime() | — |
| `uStrength` | float | 0.028 | 0.0 → 0.06 |

**Strength per phase:**
| Phase | `uStrength` |
|-------|------------|
| `pre-reveal` | 0.042 (heavy grain — atmospheric) |
| `reveal` | 0.032 |
| `lockup` | 0.025 (subtle — sharp hero tool) |
| `interactive-idle` | 0.022 |
| `scroll-transition` | 0.018 → 0 (fades as scene exits) |

---

### grade.glsl

**Purpose:** Custom color grade with toe (lift shadows), shoulder (compress highlights), and saturation control per director phase.

```glsl
// src/shaders/grade.glsl — fragment shader
uniform sampler2D tDiffuse;
uniform float uToe;        // Shadow lift: 0.0 baseline, 0.02 = warmer shadows
uniform float uShoulder;   // Highlight compression: 1.0 = none, 0.92 = compressed
uniform float uSaturation; // Saturation: 1.0 = native, 0.85 = desaturated
uniform float uWarmth;     // Warm color push (amber shift): 0.0 → 1.0

varying vec2 vUv;

vec3 adjustSaturation(vec3 color, float saturation) {
  float luma = dot(color, vec3(0.2126, 0.7152, 0.0722));
  return mix(vec3(luma), color, saturation);
}

void main() {
  vec4 texel = texture2D(tDiffuse, vUv);
  vec3 color = texel.rgb;

  // Toe: lift shadows (prevent pure black)
  color = color + uToe * (1.0 - color);

  // Shoulder: compress highlights
  color = 1.0 - (1.0 - color) * uShoulder;

  // Saturation
  color = adjustSaturation(color, uSaturation);

  // Warmth: push toward amber
  color.r = color.r + uWarmth * 0.04;
  color.g = color.g + uWarmth * 0.02;
  color.b = color.b - uWarmth * 0.03;

  gl_FragColor = vec4(clamp(color, 0.0, 1.0), texel.a);
}
```

**Uniforms per director phase:**

| Phase | `uToe` | `uShoulder` | `uSaturation` | `uWarmth` |
|-------|--------|------------|--------------|----------|
| `pre-reveal` | 0.0 | 0.88 | 0.80 | 0.2 (cool, dark) |
| `reveal` | 0.01 | 0.91 | 0.90 | 0.5 |
| `lockup` | 0.02 | 0.94 | 1.00 | 0.8 (warm, full) |
| `interactive-idle` | 0.02 | 0.95 | 1.00 | 0.8 |
| `scroll-transition` | 0.01 | 0.92 | 0.85 | 0.4 (cools as exits) |

---

## Integration in src/scene/index.js

### Loading GLSL as Text

```js
// Vite handles ?raw imports natively
import grainVert from '../shaders/grain.glsl?raw'; // if combined
// OR split into separate vert/frag files:
import grainFrag from '../shaders/grain.frag.glsl?raw';
import stdVert from '../shaders/std.vert.glsl?raw';
```

### ShaderPass Creation

```js
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';

// Grain pass
const grainPass = new ShaderPass({
  uniforms: {
    tDiffuse: { value: null },
    uTime: { value: 0 },
    uStrength: { value: 0.028 }
  },
  vertexShader: stdVert,
  fragmentShader: grainFrag
});

// Grade pass
const gradePass = new ShaderPass({
  uniforms: {
    tDiffuse: { value: null },
    uToe:         { value: 0.02 },
    uShoulder:    { value: 0.94 },
    uSaturation:  { value: 1.0 },
    uWarmth:      { value: 0.8 }
  },
  vertexShader: stdVert,
  fragmentShader: gradeFrag
});

// Add to composer (after bloom, before CopyShader)
composer.addPass(grainPass);
composer.addPass(gradePass);
```

### RAF Update

```js
// In tick() / animation loop:
grainPass.uniforms.uTime.value = clock.getElapsedTime();
```

### Phase Change Handler

```js
// When director phase changes:
function updateShaderGrade(phase) {
  const cfg = GRADE_CONFIG[phase];
  if (!cfg || !gradePass) return;
  gsap.to(gradePass.uniforms.uToe, { value: cfg.toe, duration: 0.8 });
  gsap.to(gradePass.uniforms.uShoulder, { value: cfg.shoulder, duration: 0.8 });
  gsap.to(gradePass.uniforms.uSaturation, { value: cfg.saturation, duration: 0.8 });
  gsap.to(gradePass.uniforms.uWarmth, { value: cfg.warmth, duration: 0.8 });

  const grainTarget = GRAIN_CONFIG[phase];
  gsap.to(grainPass.uniforms.uStrength, { value: grainTarget, duration: 0.5 });
}
```

---

## CSS Cleanup

When GLSL grain is active, remove CSS film grain:

```css
/* styles.css — disable when scene loads */
.scene-loaded .noise-overlay {
  display: none; /* JS adds .scene-loaded to <html> after scene boots */
}
```

---

## Material Improvements

Per existing roadmap item 2.2, PBR material pass for hero tools:

- Verify `envMapIntensity` per tool (hammer vs wrench may need different values)
- Add `metalness` fine-tuning (current values from GLB may not read correctly under HDRI)
- `normalScale` adjustment for sharper surface detail in lockup view

These are `src/scene/index.js` material setup adjustments, no GLSL required.

---

## Acceptance Criteria

- [ ] `src/shaders/grain.frag.glsl` exists and compiles without errors
- [ ] `src/shaders/grade.frag.glsl` exists and compiles without errors
- [ ] Film grain changes every frame (temporal noise — not static)
- [ ] Grain strength transitions per director phase (heavy in pre-reveal, light in idle)
- [ ] Color grade warms visibly from `pre-reveal` (cool) to `lockup` (warm amber)
- [ ] CSS `.noise-overlay` hidden when scene is loaded (no double grain)
- [ ] Both passes gated behind `CAN_RUN_DESKTOP_POST` — mobile/low: no passes
- [ ] Frame time: ≤16.7ms with all passes active (grain + grade are very cheap)
- [ ] No visible banding, clipping, or color artifacts on the final grade output
