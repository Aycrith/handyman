# PRD 07 — Shaders / Materials / Lighting Enhancement

## Objective

Introduce custom GLSL shaders for film grain and color grading. Improve material differentiation between hero tools.

## Custom Shader Passes

### grain.glsl (replaces CSS film grain)

```glsl
// src/shaders/grain.glsl
uniform sampler2D tDiffuse;
uniform float time;
uniform float amount;
varying vec2 vUv;

float rand(vec2 co) {
  return fract(sin(dot(co.xy, vec2(12.9898, 78.233))) * 43758.5453);
}

void main() {
  vec4 color = texture2D(tDiffuse, vUv);
  float grain = rand(vUv + time * 0.001) * amount;
  gl_FragColor = vec4(color.rgb + grain - amount * 0.5, color.a);
}
```

### grade.glsl (custom color grade)

```glsl
// src/shaders/grade.glsl
uniform sampler2D tDiffuse;
uniform float toe;       // Lift blacks (0.0 - 0.1)
uniform float shoulder;  // Compress highlights (0.9 - 1.0)
uniform float warmth;    // Amber tint amount
varying vec2 vUv;

void main() {
  vec4 color = texture2D(tDiffuse, vUv);
  // S-curve: toe lifts blacks, shoulder compresses highlights
  vec3 graded = smoothstep(vec3(toe), vec3(shoulder), color.rgb);
  // Amber warmth: nudge red+green, suppress blue
  graded.r += warmth * 0.04;
  graded.g += warmth * 0.02;
  graded.b -= warmth * 0.03;
  gl_FragColor = vec4(clamp(graded, 0.0, 1.0), color.a);
}
```

## EffectComposer Integration

```js
// In src/scene/index.js, EffectComposer chain:
// 1. RenderPass
// 2. UnrealBloomPass (existing)
// 3. ShaderPass(grainShader)    — NEW
// 4. ShaderPass(gradeShader)    — NEW (replaces existing grade pass)
// 5. VolumetricScatterPass      — existing (quality tier dependent)
```

## Material Enhancement (Roadmap Item 2.2)

Per existing roadmap, PBR material pass:
- Increase roughness differentiation between tools (wrench: 0.4, hammer: 0.6, saw: 0.3)
- Add subtle clearcoat to wrench (MeshPhysicalMaterial clearcoat: 0.3)
- Verify HDRI-lit materials display correctly with ACESFilmic tone mapping

## Three.js Version

r134 → upgrade planned as Phase 4 ONLY after shader work stabilizes. The shader code above is compatible with r134.

## Acceptance

- Grain pass adds cinematic texture without noise artifact
- Grade shader: controllable by director phase (warmth varies per phase)
- CSS film grain disabled when shader grain active
- PBR materials show differentiation in lockup screenshots
