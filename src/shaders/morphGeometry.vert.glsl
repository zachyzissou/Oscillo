uniform float time;
uniform float morphFactor;

varying vec2 vUv;
varying vec3 vNormalVarying;
varying vec3 vPositionVarying;

float noise(vec3 p) {
  return fract(sin(dot(p, vec3(12.9898, 78.233, 37.719))) * 43758.5453);
}

void main() {
  vUv = uv;
  vNormalVarying = normal;
  vPositionVarying = position;

  vec3 pos = position;

  // Morphing between sphere and complex shape
  vec3 spherePos = normalize(pos) * 1.0;

  // Complex deformation
  float deform = sin(pos.x * 3.0 + time) * cos(pos.y * 3.0 + time * 0.7) * sin(pos.z * 3.0 + time * 1.3);
  vec3 deformedPos = pos + normal * deform * 0.3;

  // Morph between shapes
  pos = mix(spherePos, deformedPos, morphFactor);

  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}

