uniform float time;
uniform float colorShift;

varying vec2 vUv;
varying vec3 vNormalVarying;
varying vec3 vPositionVarying;

vec3 hsv2rgb(vec3 c) {
  vec4 K = vec4(1.0, 2.0/3.0, 1.0/3.0, 3.0);
  vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
  return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}

void main() {
  float fresnel = pow(1.0 - dot(normalize(vNormalVarying), vec3(0.0, 0.0, 1.0)), 2.0);

  float hue = colorShift + time * 0.1 + fresnel * 0.3;
  vec3 color = hsv2rgb(vec3(hue, 0.8, 0.9));

  color += vec3(fresnel * 0.5);

  gl_FragColor = vec4(color, 0.9);
}

