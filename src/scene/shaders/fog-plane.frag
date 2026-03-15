/**
 * src/scene/shaders/fog-plane.frag
 *
 * Fragment shader for cinematic fog plane transitions.
 * Creates a noise-modulated volumetric fog wall that sweeps through the scene.
 * Used for Transition 1→2 (hero→services) and Transition 8→9 (CTA→contact).
 *
 * Uniforms:
 *   uDensity    — Overall fog density (0→1, scroll-driven)
 *   uColor      — Fog color (vec3)
 *   uScrollT    — Normalized scroll progress through the transition
 *   uNoiseScale — Scale of the noise pattern
 *   uNoiseSpeed — Animation speed of noise drift
 *   uTime       — Global time for noise animation
 *   uFadeEdge   — Soft edge feathering width
 */

uniform float uDensity;
uniform vec3 uColor;
uniform float uScrollT;
uniform float uNoiseScale;
uniform float uNoiseSpeed;
uniform float uTime;
uniform float uFadeEdge;

varying vec2 vUv;

// Simplex-style 2D noise (hash-based, no texture lookup)
vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec3 permute(vec3 x) { return mod289(((x * 34.0) + 1.0) * x); }

float snoise(vec2 v) {
  const vec4 C = vec4(
    0.211324865405187,   // (3.0 - sqrt(3.0)) / 6.0
    0.366025403784439,   // 0.5 * (sqrt(3.0) - 1.0)
    -0.577350269189626,  // -1.0 + 2.0 * C.x
    0.024390243902439    // 1.0 / 41.0
  );
  vec2 i  = floor(v + dot(v, C.yy));
  vec2 x0 = v - i + dot(i, C.xx);
  vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;
  i = mod289(i);
  vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
  vec3 m = max(0.5 - vec3(dot(x0, x0), dot(x12.xy, x12.xy), dot(x12.zw, x12.zw)), 0.0);
  m = m * m;
  m = m * m;
  vec3 x = 2.0 * fract(p * C.www) - 1.0;
  vec3 h = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;
  m *= 1.79284291400159 - 0.85373472095314 * (a0 * a0 + h * h);
  vec3 g;
  g.x = a0.x * x0.x + h.x * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130.0 * dot(m, g);
}

// Fractal Brownian Motion for richer noise
float fbm(vec2 p) {
  float sum = 0.0;
  float amp = 0.5;
  float freq = 1.0;
  for (int i = 0; i < 4; i++) {
    sum += amp * snoise(p * freq);
    amp *= 0.5;
    freq *= 2.0;
  }
  return sum;
}

void main() {
  // Animated noise coordinates
  vec2 noiseCoord = vUv * uNoiseScale + vec2(uTime * uNoiseSpeed * 0.3, uTime * uNoiseSpeed * 0.15);
  float noise = fbm(noiseCoord) * 0.5 + 0.5; // remap to 0–1

  // Vertical gradient — fog is denser at bottom, thinner at top
  float verticalGrad = 1.0 - vUv.y * 0.3;

  // Horizontal sweep — fog moves across screen with scroll
  float sweepCenter = uScrollT;
  float sweepDist = abs(vUv.x - sweepCenter);
  float sweepMask = smoothstep(0.6, 0.0, sweepDist);

  // Combine density factors
  float density = uDensity * noise * verticalGrad * sweepMask;

  // Soft edge feathering at the edges of the fog plane
  float edgeFade = smoothstep(0.0, uFadeEdge, vUv.x)
                 * smoothstep(0.0, uFadeEdge, 1.0 - vUv.x)
                 * smoothstep(0.0, uFadeEdge, vUv.y)
                 * smoothstep(0.0, uFadeEdge, 1.0 - vUv.y);

  density *= edgeFade;

  // Clamp to valid range
  density = clamp(density, 0.0, 1.0);

  gl_FragColor = vec4(uColor, density);
}
