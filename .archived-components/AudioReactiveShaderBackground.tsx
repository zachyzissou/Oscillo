'use client'
import React, { useRef, useEffect, useState, useMemo } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { gsap } from 'gsap'
import { voronoiFragmentShader } from '../shaders/advancedEffects.frag'

interface AudioReactiveBackgroundProps {
  readonly bassLevel: number
  readonly midLevel: number
  readonly highLevel: number
  readonly activeShader: 'metaball' | 'noise' | 'water' | 'voronoi' | 'rgbGlitch' | 'proceduralNoise' | 'plasma'
  readonly glitchIntensity: number
  readonly enabled: boolean
  readonly audioSensitivity: {
    readonly bass: number
    readonly mid: number
    readonly high: number
  }
  readonly position?: number[]
  readonly scale?: number[]
}

// Enhanced metaball fragment shader
const metaballFragmentShader = /* glsl */ `
precision highp float;

uniform float uTime;
uniform float uBassLevel;
uniform float uMidLevel;  
uniform float uHighLevel;
uniform vec2 uResolution;
uniform vec3 uColorPrimary;
uniform vec3 uColorSecondary;
uniform float uMetaballCount;
uniform float uGlowIntensity;

varying vec2 vUv;

float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    
    float a = dot(i, vec2(12.9898, 78.233));
    float b = dot(i + vec2(1.0, 0.0), vec2(12.9898, 78.233));
    float c = dot(i + vec2(0.0, 1.0), vec2(12.9898, 78.233));
    float d = dot(i + vec2(1.0, 1.0), vec2(12.9898, 78.233));
    
    vec2 u = f * f * (3.0 - 2.0 * f);
    
    return mix(
        mix(fract(sin(a) * 43758.5453), fract(sin(b) * 43758.5453), u.x),
        mix(fract(sin(c) * 43758.5453), fract(sin(d) * 43758.5453), u.x),
        u.y
    );
}

float metaball(vec2 uv, vec2 center, float radius, float audioLevel) {
    vec2 pos = center + vec2(
        noise(center * 3.0 + uTime * 0.5) * 0.2 * audioLevel,
        noise(center * 2.0 + uTime * 0.3) * 0.15 * audioLevel
    );
    
    float dist = length(uv - pos);
    float organicRadius = radius * (1.0 + audioLevel * 0.3 + noise(uv * 8.0 + uTime) * 0.1);
    
    return organicRadius / (dist + 0.001);
}

void main() {
    vec2 uv = vUv;
    vec2 center = uv - 0.5;
    
    float field = 0.0;
    
    // Primary metaball (bass-reactive)
    field += metaball(uv, vec2(0.5 + sin(uTime * 0.5) * 0.3, 0.5), 
                     0.15 + uBassLevel * 0.1, uBassLevel);
    
    // Secondary metaballs (mid/high frequency reactive)
    field += metaball(uv, vec2(0.3 + cos(uTime * 0.8) * 0.2, 0.7), 
                     0.1 + uMidLevel * 0.08, uMidLevel);
                     
    field += metaball(uv, vec2(0.7 + sin(uTime * 1.2) * 0.25, 0.3), 
                     0.08 + uHighLevel * 0.06, uHighLevel);
    
    // Additional dynamic metaballs
    for (float i = 0.0; i < uMetaballCount; i++) {
        float angle = i * 6.28318 / uMetaballCount + uTime * 0.3;
        vec2 pos = vec2(cos(angle), sin(angle)) * 0.3 + vec2(0.5);
        field += metaball(uv, pos, 0.05, (uBassLevel + uMidLevel) * 0.5);
    }
    
    // Color mixing with audio reactivity
    vec3 color1 = uColorPrimary * (1.0 + uBassLevel);
    vec3 color2 = uColorSecondary * (1.0 + uHighLevel);
    
    float intensity = smoothstep(0.5, 1.5, field);
    vec3 finalColor = mix(color1, color2, intensity);
    
    // Neon glow effect
    float glow = exp(-length(center) * (2.0 - uGlowIntensity));
    finalColor += vec3(0.0, 0.8, 1.0) * glow * uMidLevel * 0.5;
    
    // Audio-reactive edge enhancement
    float edge = fwidth(field) * 10.0;
    finalColor += vec3(1.0, 0.2, 0.8) * edge * uHighLevel;
    
    gl_FragColor = vec4(finalColor, intensity);
}
`;

// Procedural noise shader
const proceduralNoiseFragmentShader = /* glsl */ `
precision highp float;

uniform float uTime;
uniform float uBassLevel;
uniform float uMidLevel;
uniform float uHighLevel;
uniform vec2 uResolution;
uniform float uNoiseScale;
uniform float uDistortionAmount;
uniform vec3 uColorA;
uniform vec3 uColorB;
uniform vec3 uColorC;

varying vec2 vUv;

float random(vec2 st) {
    return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
}

float noise(vec2 st) {
    vec2 i = floor(st);
    vec2 f = fract(st);
    
    float a = random(i);
    float b = random(i + vec2(1.0, 0.0));
    float c = random(i + vec2(0.0, 1.0));
    float d = random(i + vec2(1.0, 1.0));
    
    vec2 u = f * f * (3.0 - 2.0 * f);
    
    return mix(a, b, u.x) + (c - a)* u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
}

float fbm(vec2 st, int octaves) {
    float value = 0.0;
    float amplitude = 0.5;
    float frequency = 0.0;
    
    for (int i = 0; i < octaves; i++) {
        value += amplitude * noise(st);
        st *= 2.0;
        amplitude *= 0.5;
    }
    return value;
}

void main() {
    vec2 uv = vUv;
    vec2 st = uv * uNoiseScale;
    
    float timeScale = uTime + uBassLevel * 2.0;
    
    float noise1 = fbm(st + timeScale * 0.1, 4);
    float noise2 = fbm(st * 2.0 + timeScale * 0.2, 3);
    float noise3 = fbm(st * 4.0 + timeScale * 0.3, 2);
    
    vec3 color = mix(uColorA, uColorB, noise1 + uBassLevel * 0.3);
    color = mix(color, uColorC, noise2 + uMidLevel * 0.2);
    
    float pattern = sin(st.x * 10.0 + noise3 * 20.0) * cos(st.y * 8.0 + noise1 * 15.0);
    color += vec3(pattern * 0.1 * uHighLevel);
    
    float brightness = 1.0 + (uBassLevel + uMidLevel + uHighLevel) * 0.2;
    color *= brightness;
    
    gl_FragColor = vec4(color, 1.0);
}
`;

// Water ripple shader
const waterRippleFragmentShader = /* glsl */ `
precision highp float;

uniform float uTime;
uniform float uBassLevel;
uniform float uMidLevel;
uniform vec2 uMouse;
uniform vec2 uResolution;
uniform float uRippleSpeed;
uniform float uRippleStrength;

varying vec2 vUv;

void main() {
    vec2 uv = vUv;
    vec2 center = vec2(0.5) + (uMouse - 0.5) * 0.3;
    
    float dist = length(uv - center);
    
    float ripple1 = sin(dist * 40.0 - uTime * uRippleSpeed) * 
                   exp(-dist * 8.0) * uRippleStrength * uBassLevel;
    
    float ripple2 = sin(dist * 60.0 - uTime * uRippleSpeed * 1.5) * 
                   exp(-dist * 12.0) * uRippleStrength * 0.5 * uMidLevel;
    
    vec2 distortedUV = uv + vec2(ripple1 + ripple2) * 0.02;
    
    vec3 deepWater = vec3(0.0, 0.2, 0.4);
    vec3 shallowWater = vec3(0.3, 0.7, 1.0);
    
    float depth = 1.0 - dist;
    vec3 waterColor = mix(deepWater, shallowWater, depth);
    
    float reflection = pow(1.0 - dist, 2.0) * 0.3;
    waterColor += vec3(reflection);
    
    float foam = step(0.95, sin(distortedUV.x * 100.0) * cos(distortedUV.y * 100.0) + uBassLevel);
    waterColor += vec3(foam * 0.5);
    
    gl_FragColor = vec4(waterColor, 1.0);
}
`;

// Vertex shader for all effects
const vertexShader = /* glsl */ `
varying vec2 vUv;
varying vec3 vPosition;

void main() {
  vUv = uv;
  vPosition = position;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

export function AudioReactiveShaderBackground({
  bassLevel = 0,
  midLevel = 0,
  highLevel = 0,
  activeShader = 'metaball',
  glitchIntensity = 0,
  enabled = true,
  audioSensitivity = { bass: 1, mid: 1, high: 1 },
  position = [0, 0, -10],
  scale = [20, 20, 1]
}: AudioReactiveBackgroundProps) {
  const meshRef = useRef<THREE.Mesh>(null)
  const materialRef = useRef<THREE.ShaderMaterial>(null)
  const { size } = useThree()
  const [mouse, setMouse] = useState({ x: 0.5, y: 0.5 })
  const timeRef = useRef(0)

  // Shader configurations
  const shaderConfigs = useMemo(() => ({
    metaball: {
      fragmentShader: metaballFragmentShader,
      uniforms: {
        uTime: { value: 0 },
        uBassLevel: { value: 0 },
        uMidLevel: { value: 0 },
        uHighLevel: { value: 0 },
        uResolution: { value: [size.width, size.height] },
        uColorPrimary: { value: new THREE.Color(0x00ffff) },
        uColorSecondary: { value: new THREE.Color(0xff0080) },
        uMetaballCount: { value: 6.0 },
        uGlowIntensity: { value: 1.0 }
      }
    },
    
    noise: {
      fragmentShader: proceduralNoiseFragmentShader,
      uniforms: {
        uTime: { value: 0 },
        uBassLevel: { value: 0 },
        uMidLevel: { value: 0 },
        uHighLevel: { value: 0 },
        uResolution: { value: [size.width, size.height] },
        uNoiseScale: { value: 3.0 },
        uDistortionAmount: { value: 0.1 },
        uColorA: { value: new THREE.Color(0x9d00ff) },
        uColorB: { value: new THREE.Color(0x00ffff) },
        uColorC: { value: new THREE.Color(0xff4081) }
      }
    },

    water: {
      fragmentShader: waterRippleFragmentShader,
      uniforms: {
        uTime: { value: 0 },
        uBassLevel: { value: 0 },
        uMidLevel: { value: 0 },
        uMouse: { value: [0.5, 0.5] },
        uResolution: { value: [size.width, size.height] },
        uRippleSpeed: { value: 5.0 },
        uRippleStrength: { value: 1.0 }
      }
    },
    
    voronoi: {
      fragmentShader: voronoiFragmentShader, // Using proper voronoi shader
      uniforms: {
        uTime: { value: 0 },
        uBassLevel: { value: 0 },
        uMidLevel: { value: 0 },
        uHighLevel: { value: 0 },
        uResolution: { value: [size.width, size.height] },
        uColorPrimary: { value: new THREE.Color(0x00ffff) },
        uColorSecondary: { value: new THREE.Color(0xff0080) },
        uMetaballCount: { value: 6.0 },
        uGlowIntensity: { value: 1.0 }
      }
    },
    
    rgbGlitch: {
      fragmentShader: metaballFragmentShader, // Placeholder - should use actual glitch shader
      uniforms: {
        uTime: { value: 0 },
        uBassLevel: { value: 0 },
        uMidLevel: { value: 0 },
        uHighLevel: { value: 0 },
        uResolution: { value: [size.width, size.height] },
        uColorPrimary: { value: new THREE.Color(0x00ffff) },
        uColorSecondary: { value: new THREE.Color(0xff0080) },
        uMetaballCount: { value: 6.0 },
        uGlowIntensity: { value: 1.0 }
      }
    },
    
    proceduralNoise: {
      fragmentShader: proceduralNoiseFragmentShader,
      uniforms: {
        uTime: { value: 0 },
        uBassLevel: { value: 0 },
        uMidLevel: { value: 0 },
        uHighLevel: { value: 0 },
        uResolution: { value: [size.width, size.height] },
        uNoiseScale: { value: 3.0 },
        uDistortionAmount: { value: 0.1 },
        uColorA: { value: new THREE.Color(0x9d00ff) },
        uColorB: { value: new THREE.Color(0x00ffff) },
        uColorC: { value: new THREE.Color(0xff4081) }
      }
    },
    
    plasma: {
      fragmentShader: metaballFragmentShader, // Placeholder - should use actual plasma shader
      uniforms: {
        uTime: { value: 0 },
        uBassLevel: { value: 0 },
        uMidLevel: { value: 0 },
        uHighLevel: { value: 0 },
        uResolution: { value: [size.width, size.height] },
        uColorPrimary: { value: new THREE.Color(0x00ffff) },
        uColorSecondary: { value: new THREE.Color(0xff0080) },
        uMetaballCount: { value: 6.0 },
        uGlowIntensity: { value: 1.0 }
      }
    }
  } as const), [size])

  // Mouse tracking for interactive effects
  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      setMouse({
        x: event.clientX / window.innerWidth,
        y: 1.0 - event.clientY / window.innerHeight
      })
    }

    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  // Initialize material once with default shader
  useEffect(() => {
    // This effect runs only once to create the initial material
    if (!meshRef.current || !size) return

    // Use a safe default configuration that doesn't depend on dynamic size
    const initialConfig = {
      fragmentShader: metaballFragmentShader,
      uniforms: {
        uTime: { value: 0 },
        uBassLevel: { value: 0 },
        uMidLevel: { value: 0 },
        uHighLevel: { value: 0 },
        uResolution: { value: [size.width || 1920, size.height || 1080] },
        uColorPrimary: { value: new THREE.Color(0x00ffff) },
        uColorSecondary: { value: new THREE.Color(0xff0080) },
        uMetaballCount: { value: 6.0 },
        uGlowIntensity: { value: 1.0 }
      }
    }
    
    const material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader: initialConfig.fragmentShader,
      uniforms: { ...initialConfig.uniforms },
      transparent: true,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide
    })
    
    meshRef.current.material = material
    materialRef.current = material
    
    return () => {
      if (material) {
        material.dispose()
      }
    }
  }, [size]) // Depend on size instead of shaderConfigs
  
  // Update material properties when shader changes
  useEffect(() => {
    if (!materialRef.current || !meshRef.current || !shaderConfigs) return
    
    try {
      const config = shaderConfigs[activeShader] || shaderConfigs.metaball
      
      if (!config || !config.fragmentShader) {
        console.warn(`Shader config not found for: ${activeShader}`)
        return
      }

      // For shader changes, we need to create a new material since fragmentShader can't be updated
      const newMaterial = new THREE.ShaderMaterial({
        vertexShader,
        fragmentShader: config.fragmentShader,
        uniforms: { ...config.uniforms },
        transparent: true,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide
      })
      
      // Dispose old material and assign new one
      if (materialRef.current) {
        materialRef.current.dispose()
      }
      
      meshRef.current.material = newMaterial
      materialRef.current = newMaterial
      
      // Animate shader transition
      gsap.fromTo(newMaterial, 
        { opacity: 0 },
        { 
          opacity: enabled ? 0.8 : 0,
          duration: 0.5,
          ease: "power2.out"
        }
      )
    } catch (error) {
      console.error('Error updating shader material:', error)
    }
  }, [activeShader, enabled, shaderConfigs])

  // Animation loop
  useFrame((state, delta) => {
    if (!materialRef.current || !enabled) return

    timeRef.current += delta

    // Update common uniforms
    const uniforms = materialRef.current.uniforms
    
    if (uniforms.uTime) uniforms.uTime.value = timeRef.current
    if (uniforms.uResolution) uniforms.uResolution.value = [size.width, size.height]
    
    // Audio-reactive updates with sensitivity
    if (uniforms.uBassLevel) {
      uniforms.uBassLevel.value = THREE.MathUtils.lerp(
        uniforms.uBassLevel.value,
        bassLevel * audioSensitivity.bass,
        0.1
      )
    }
    
    if (uniforms.uMidLevel) {
      uniforms.uMidLevel.value = THREE.MathUtils.lerp(
        uniforms.uMidLevel.value,
        midLevel * audioSensitivity.mid,
        0.1
      )
    }
    
    if (uniforms.uHighLevel) {
      uniforms.uHighLevel.value = THREE.MathUtils.lerp(
        uniforms.uHighLevel.value,
        highLevel * audioSensitivity.high,
        0.1
      )
    }

    // Mouse interaction
    if (uniforms.uMouse) {
      uniforms.uMouse.value = [
        THREE.MathUtils.lerp(uniforms.uMouse.value[0], mouse.x, 0.05),
        THREE.MathUtils.lerp(uniforms.uMouse.value[1], mouse.y, 0.05)
      ]
    }

    // Dynamic color shifting based on audio
    if (uniforms.uColorPrimary && uniforms.uColorSecondary) {
      const hueShift = (bassLevel + midLevel) * 0.1
      uniforms.uColorPrimary.value.setHSL(
        (0.5 + hueShift) % 1,
        1.0,
        0.5 + highLevel * 0.2
      )
      uniforms.uColorSecondary.value.setHSL(
        (0.8 + hueShift) % 1,
        1.0,
        0.5 + bassLevel * 0.2
      )
    }

    // Scale mesh based on bass
    if (meshRef.current) {
      const scale = 1 + bassLevel * audioSensitivity.bass * 0.05
      meshRef.current.scale.setScalar(scale)
    }
  })

  if (!enabled) return null

  return (
    <mesh 
      ref={meshRef}
      position={position ? [position[0], position[1], position[2]] : [0, 0, 0]}
      scale={scale ? [scale[0], scale[1], scale[2]] : [1, 1, 1]}
    >
      <planeGeometry args={[1, 1, 64, 64]} />
      {/* Material will be set dynamically */}
    </mesh>
  )
}

export default AudioReactiveShaderBackground