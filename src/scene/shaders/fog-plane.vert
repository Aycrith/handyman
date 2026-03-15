/**
 * src/scene/shaders/fog-plane.vert
 *
 * Vertex shader for the cinematic fog plane used in world transitions.
 * Simple fullscreen quad — all the magic is in the fragment shader.
 */

varying vec2 vUv;

void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
