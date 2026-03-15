/**
 * src/scene/shaders/point-cloud.frag
 *
 * Fragment shader for cinematic point cloud rendering.
 * Renders soft circular points with distance-modulated opacity.
 */

varying float vOpacity;
varying vec3 vColor;

void main() {
  // Circular point shape with soft edge
  vec2 center = gl_PointCoord - vec2(0.5);
  float dist = length(center);
  if (dist > 0.5) discard;

  // Soft falloff from center to edge
  float alpha = 1.0 - smoothstep(0.2, 0.5, dist);
  alpha *= vOpacity;

  if (alpha < 0.003) discard;

  gl_FragColor = vec4(vColor, alpha);
}
