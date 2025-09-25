'use client'
import { useRef, useMemo } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { useAudioStore } from '@/store/useAudioEngine'

const vertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const fragmentShader = `
  uniform float time;
  uniform vec2 resolution;
  uniform float audioData[32];
  uniform float bassLevel;
  uniform float midLevel;
  uniform float trebleLevel;
  uniform vec3 color1;
  uniform vec3 color2;
  uniform vec3 color3;
  
  varying vec2 vUv;
  
  // Noise functions
  vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
  vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }
  
  float snoise(vec3 v) {
    const vec2 C = vec2(1.0/6.0, 1.0/3.0);
    const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
    
    vec3 i = floor(v + dot(v, C.yyy));
    vec3 x0 = v - i + dot(i, C.xxx);
    
    vec3 g = step(x0.yzx, x0.xyz);
    vec3 l = 1.0 - g;
    vec3 i1 = min(g.xyz, l.zxy);
    vec3 i2 = max(g.xyz, l.zxy);
    
    vec3 x1 = x0 - i1 + C.xxx;
    vec3 x2 = x0 - i2 + C.yyy;
    vec3 x3 = x0 - D.yyy;
    
    i = mod289(i);
    vec4 p = permute(permute(permute(
      i.z + vec4(0.0, i1.z, i2.z, 1.0))
      + i.y + vec4(0.0, i1.y, i2.y, 1.0))
      + i.x + vec4(0.0, i1.x, i2.x, 1.0));
      
    float n_ = 0.142857142857;
    vec3 ns = n_ * D.wyz - D.xzx;
    
    vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
    
    vec4 x_ = floor(j * ns.z);
    vec4 y_ = floor(j - 7.0 * x_);
    
    vec4 x = x_ *ns.x + ns.yyyy;
    vec4 y = y_ *ns.x + ns.yyyy;
    vec4 h = 1.0 - abs(x) - abs(y);
    
    vec4 b0 = vec4(x.xy, y.xy);
    vec4 b1 = vec4(x.zw, y.zw);
    
    vec4 s0 = floor(b0)*2.0 + 1.0;
    vec4 s1 = floor(b1)*2.0 + 1.0;
    vec4 sh = -step(h, vec4(0.0));
    
    vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
    vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;
    
    vec3 p0 = vec3(a0.xy, h.x);
    vec3 p1 = vec3(a0.zw, h.y);
    vec3 p2 = vec3(a1.xy, h.z);
    vec3 p3 = vec3(a1.zw, h.w);
    
    vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
    p0 *= norm.x;
    p1 *= norm.y;
    p2 *= norm.z;
    p3 *= norm.w;
    
    vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
    m = m * m;
    return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
  }
  
  // Fractal Brownian Motion
  float fbm(vec3 p) {
    float value = 0.0;
    float amplitude = 0.5;
    float frequency = 1.0;
    
    for (int i = 0; i < 6; i++) {
      value += amplitude * snoise(p * frequency);
      amplitude *= 0.5;
      frequency *= 2.0;
    }
    
    return value;
  }
  
  void main() {
    vec2 uv = vUv;
    vec2 p = (uv - 0.5) * 2.0;
    
    // Audio-reactive parameters
    float audioAvg = 0.0;
    for (int i = 0; i < 32; i++) {
      audioAvg += audioData[i];
    }
    audioAvg /= 32.0;
    
    // Complex noise patterns
    vec3 noisePos = vec3(p * 3.0, time * 0.1);
    float n1 = fbm(noisePos + vec3(0.0, 0.0, bassLevel * 2.0));
    float n2 = fbm(noisePos * 1.5 + vec3(time * 0.05, 0.0, midLevel));
    float n3 = fbm(noisePos * 2.0 + vec3(0.0, time * 0.03, trebleLevel));
    
    // Voronoi-like pattern
    vec2 cell = floor(p * 5.0 + n1 * 2.0);
    vec2 cellUv = fract(p * 5.0 + n1 * 2.0);
    float cellDist = length(cellUv - 0.5);
    
    // Color mixing
    vec3 col1 = mix(color1, color2, n1 * 0.5 + 0.5);
    vec3 col2 = mix(color2, color3, n2 * 0.5 + 0.5);
    vec3 finalColor = mix(col1, col2, n3 * 0.5 + 0.5);
    
    // Audio-reactive brightness
    float brightness = 0.3 + audioAvg * 0.7;
    finalColor *= brightness;
    
    // Cell highlights
    float cellHighlight = smoothstep(0.4, 0.2, cellDist) * (0.5 + bassLevel);
    finalColor += vec3(cellHighlight) * color2;
    
    // Wave distortion
    float wave = sin(p.x * 10.0 + time + bassLevel * 5.0) * 
                 cos(p.y * 8.0 - time * 0.7 + midLevel * 3.0);
    finalColor += wave * 0.1 * color3;
    
    // Radial gradient
    float radialGrad = length(p) * 0.5;
    finalColor *= 1.0 - radialGrad * 0.3;
    
    // Energy pulses
    float pulse = sin(time * 2.0 + length(p) * 10.0) * audioAvg;
    finalColor += pulse * 0.2 * color1;
    
    gl_FragColor = vec4(finalColor, 1.0);
  }
`

export default function AdvancedShaderBackground() {
  const meshRef = useRef<THREE.Mesh>(null)
  const { size, viewport } = useThree()
  const { fftData } = useAudioStore()
  
  const uniforms = useMemo(() => ({
    time: { value: 0 },
    resolution: { value: new THREE.Vector2(size.width, size.height) },
    audioData: { value: new Float32Array(32) },
    bassLevel: { value: 0 },
    midLevel: { value: 0 },
    trebleLevel: { value: 0 },
    color1: { value: new THREE.Color(0x0066ff) }, // Blue
    color2: { value: new THREE.Color(0xff0066) }, // Pink
    color3: { value: new THREE.Color(0x00ffff) }, // Cyan
  }), [size])

  useFrame((state, delta) => {
    if (!meshRef.current) return

    uniforms.time.value += delta
    uniforms.resolution.value.set(size.width, size.height)

    // Update audio data
    if (fftData && fftData.length > 0) {
      // Downsample to 32 bins
      const binSize = Math.floor(fftData.length / 32)
      for (let i = 0; i < 32; i++) {
        let sum = 0
        for (let j = 0; j < binSize; j++) {
          sum += fftData[i * binSize + j]
        }
        uniforms.audioData.value[i] = sum / binSize / 255
      }

      // Calculate frequency bands
      const bassEnd = 4
      const midEnd = 16
      
      let bass = 0, mid = 0, treble = 0
      for (let i = 0; i < bassEnd; i++) bass += uniforms.audioData.value[i]
      for (let i = bassEnd; i < midEnd; i++) mid += uniforms.audioData.value[i]
      for (let i = midEnd; i < 32; i++) treble += uniforms.audioData.value[i]
      
      uniforms.bassLevel.value = bass / bassEnd
      uniforms.midLevel.value = mid / (midEnd - bassEnd)
      uniforms.trebleLevel.value = treble / (32 - midEnd)
    }

    // Subtle camera-based parallax
    const camera = state.camera
    meshRef.current.position.z = -10
    meshRef.current.position.x = camera.position.x * 0.1
    meshRef.current.position.y = camera.position.y * 0.1
  })

  return (
    <mesh ref={meshRef} scale={[viewport.width * 2, viewport.height * 2, 1]}>
      <planeGeometry args={[1, 1, 1, 1]} />
      <shaderMaterial
        uniforms={uniforms}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        depthWrite={false}
        transparent
      />
    </mesh>
  )
}