uniform float time;
uniform float audioLevel;
uniform vec3 colorA;
uniform vec3 colorB;
uniform vec3 colorC;

varying vec2 vUv;
varying vec3 vPosition;

float noise(vec2 st) {
  return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
}

void main() {
  vec2 uv = vUv;

  // Create tunnel effect
  float dist = length(uv - 0.5);
  float tunnel = 1.0 / (dist * 8.0 + 0.1);

  // Audio-reactive rings
  float rings = sin(dist * 20.0 - time * 5.0 + audioLevel * 10.0) * 0.5 + 0.5;

  // Color mixing based on position and audio
  vec3 color1 = mix(colorA, colorB, sin(time * 0.5 + vPosition.y * 0.1) * 0.5 + 0.5);
  vec3 color2 = mix(color1, colorC, cos(time * 0.3 + vPosition.x * 0.1) * 0.5 + 0.5);

  // Add noise
  float n = noise(uv * 10.0 + time * 0.1);
  color2 = mix(color2, vec3(1.0), n * 0.1);

  float alpha = tunnel * rings * (0.3 + audioLevel * 0.7);

  gl_FragColor = vec4(color2 * alpha, alpha * 0.5);
}

