/**
 * src/scene/shaders/point-cloud.vert
 *
 * Vertex shader for the cinematic point cloud system used in ACT 6-7.
 * Supports: distance-based point sizing, position morphing between two
 * point clouds, and per-point color interpolation.
 *
 * Attributes:
 *   position     — Current point position (or source position during morph)
 *   targetPos    — Target position for morphing transitions
 *   aColor       — Per-point color
 *   aTargetColor — Target color for morphing
 *
 * Uniforms:
 *   uMorphT      — Morph blend factor (0 = source, 1 = target)
 *   uPointSize   — Base point size before distance attenuation
 *   uMinSize     — Minimum point size (prevents vanishing at distance)
 *   uMaxSize     — Maximum point size (prevents giant near-points)
 *   uOpacity     — Global opacity multiplier
 *   uNearFade    — Distance at which near-points begin fading (prevents z-fighting)
 *   uFarFade     — Distance beyond which points fade to zero
 *   uTime        — Time uniform for subtle animation
 */

attribute vec3 targetPos;
attribute vec3 aColor;
attribute vec3 aTargetColor;

uniform float uMorphT;
uniform float uPointSize;
uniform float uMinSize;
uniform float uMaxSize;
uniform float uOpacity;
uniform float uNearFade;
uniform float uFarFade;
uniform float uTime;

varying float vOpacity;
varying vec3 vColor;

// Smooth cubic interpolation
float smoothT(float t) {
  return t * t * (3.0 - 2.0 * t);
}

void main() {
  // Morph between source and target positions
  float t = smoothT(clamp(uMorphT, 0.0, 1.0));
  vec3 morphedPos = mix(position, targetPos, t);

  // Add subtle per-point animation (breathing effect)
  float pointSeed = dot(position, vec3(12.9898, 78.233, 45.164));
  float breathe = sin(uTime * 0.8 + pointSeed) * 0.02;
  morphedPos += normalize(morphedPos) * breathe;

  // Color interpolation
  vColor = mix(aColor, aTargetColor, t);

  vec4 mvPosition = modelViewMatrix * vec4(morphedPos, 1.0);
  float dist = -mvPosition.z;

  // Distance-based point size (near = large, far = small)
  float size = uPointSize / max(dist, 0.1);
  size = clamp(size, uMinSize, uMaxSize);
  gl_PointSize = size;

  // Distance-based opacity with near/far fade
  float nearFade = smoothstep(uNearFade * 0.5, uNearFade, dist);
  float farFade = 1.0 - smoothstep(uFarFade * 0.7, uFarFade, dist);
  vOpacity = uOpacity * nearFade * farFade;

  gl_Position = projectionMatrix * mvPosition;
}
