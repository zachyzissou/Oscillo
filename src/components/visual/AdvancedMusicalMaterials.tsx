'use client'
import React, { useEffect, useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { MeshTransmissionMaterial } from '@react-three/drei'
import { useAudioEngine } from '@/store/useAudioEngine'
import { cymaticFluidShader } from '@/shaders/cymatic-fluid.frag'

interface AdvancedMaterialProps {
  type: 'cymatic' | 'holographic' | 'liquid-metal' | 'plasma' | 'crystal'
  soundType: 'note' | 'chord' | 'beat' | 'loop'
  audioReactive?: boolean
}

export function AdvancedMusicalMaterial({ type, soundType, audioReactive = true }: AdvancedMaterialProps) {
  const { fftData, volume } = useAudioEngine()
  const materialRef = useRef<any>(null)
  const { size } = useThree()

  // Audio analysis
  const audioData = useMemo(() => {
    if (!fftData || fftData.length === 0) return new Float32Array(256)
    
    // Downsample FFT to 256 bins for shader compatibility
    const bins = 256
    const binSize = Math.floor(fftData.length / bins)
    const processed = new Float32Array(bins)
    
    for (let i = 0; i < bins; i++) {
      let sum = 0
      for (let j = 0; j < binSize; j++) {
        const index = i * binSize + j
        if (index < fftData.length) {
          sum += fftData[index]
        }
      }
      processed[i] = sum / binSize
    }
    
    return processed
  }, [fftData])

  // Calculate frequency bands
  const frequencyBands = useMemo(() => {
    if (!audioData) return { bass: 0, mid: 0, treble: 0, amplitude: 0 }
    
    const bassEnd = Math.floor(audioData.length * 0.1)
    const midEnd = Math.floor(audioData.length * 0.5)
    
    const bass = audioData.slice(0, bassEnd).reduce((a, b) => a + b, 0) / bassEnd / 255
    const mid = audioData.slice(bassEnd, midEnd).reduce((a, b) => a + b, 0) / (midEnd - bassEnd) / 255
    const treble = audioData.slice(midEnd).reduce((a, b) => a + b, 0) / (audioData.length - midEnd) / 255
    const amplitude = (bass + mid + treble) / 3
    
    return { bass, mid, treble, amplitude }
  }, [audioData])

  const material = useMemo(() => {
    const colorMap = {
      note: [0.0, 1.0, 1.0], // Cyan
      chord: [1.0, 0.0, 1.0], // Magenta  
      beat: [1.0, 1.0, 0.0], // Yellow
      loop: [0.0, 1.0, 0.0], // Green
    }

    switch (type) {
      case 'cymatic':
        return new THREE.ShaderMaterial({
          ...cymaticFluidShader,
          uniforms: {
            ...cymaticFluidShader.uniforms,
            resolution: { value: [1, 1] },
            colorPrimary: { value: colorMap[soundType] },
            colorSecondary: { value: [1.0, 1.0, 1.0] },
          },
          transparent: true,
          side: THREE.DoubleSide,
        })

      case 'holographic':
        return new THREE.ShaderMaterial({
          uniforms: {
            time: { value: 0 },
            audioLevel: { value: 0 },
            colorShift: { value: 0 },
            iridescence: { value: 1.0 },
            baseColor: { value: new THREE.Color(...colorMap[soundType]) },
          },
          vertexShader: `
            varying vec2 vUv;
            varying vec3 vNormal;
            varying vec3 vPosition;
            
            void main() {
              vUv = uv;
              vNormal = normalize(normalMatrix * normal);
              vPosition = position;
              gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
          `,
          fragmentShader: `
            uniform float time;
            uniform float audioLevel;
            uniform float colorShift;
            uniform float iridescence;
            uniform vec3 baseColor;
            
            varying vec2 vUv;
            varying vec3 vNormal;
            varying vec3 vPosition;
            
            vec3 hsv2rgb(vec3 c) {
              vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
              vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
              return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
            }
            
            void main() {
              // Holographic interference patterns
              float interference = sin(vUv.x * 50.0 + time * 10.0) * 
                                  cos(vUv.y * 30.0 - time * 8.0) * 
                                  sin((vUv.x + vUv.y) * 40.0 + time * 12.0);
              
              // Audio-reactive color shift
              float hue = atan(baseColor.r, baseColor.g) / 6.28318 + colorShift + time * 0.2;
              float saturation = 0.8 + audioLevel * 0.2;
              float brightness = 0.7 + audioLevel * 0.3 + interference * 0.1;
              
              vec3 color = hsv2rgb(vec3(hue, saturation, brightness));
              
              // Iridescent rim effect
              vec3 viewDir = normalize(cameraPosition - vPosition);
              float fresnel = 1.0 - max(dot(vNormal, viewDir), 0.0);
              color += pow(fresnel, 2.0) * iridescence * vec3(1.0, 0.8, 0.6);
              
              // Holographic scanlines
              float scanlines = sin(vUv.y * 200.0 + time * 50.0) * 0.1;
              color += scanlines * audioLevel;
              
              gl_FragColor = vec4(color, 0.8 + fresnel * 0.2);
            }
          `,
          transparent: true,
          side: THREE.DoubleSide,
        })

      case 'liquid-metal':
        return new THREE.MeshStandardMaterial({
          color: new THREE.Color(...colorMap[soundType]),
          metalness: 0.9,
          roughness: 0.1,
        })

      case 'plasma':
        return new THREE.ShaderMaterial({
          uniforms: {
            time: { value: 0 },
            audioLevel: { value: 0 },
            plasmaIntensity: { value: 1.0 },
            baseColor: { value: new THREE.Color(...colorMap[soundType]) },
          },
          vertexShader: `
            varying vec2 vUv;
            varying vec3 vPosition;
            
            void main() {
              vUv = uv;
              vPosition = position;
              gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
          `,
          fragmentShader: `
            uniform float time;
            uniform float audioLevel;
            uniform float plasmaIntensity;
            uniform vec3 baseColor;
            
            varying vec2 vUv;
            varying vec3 vPosition;
            
            void main() {
              // Plasma effect
              float plasma1 = sin(vUv.x * 16.0 + time * 2.0);
              float plasma2 = sin(vUv.y * 10.0 - time * 1.5);
              float plasma3 = sin((vUv.x + vUv.y) * 8.0 + time * 3.0);
              float plasma4 = sin(sqrt(vUv.x * vUv.x + vUv.y * vUv.y) * 20.0 + time * 4.0);
              
              float plasma = (plasma1 + plasma2 + plasma3 + plasma4) * 0.25;
              plasma *= plasmaIntensity * (1.0 + audioLevel * 2.0);
              
              // Color cycling
              vec3 color1 = baseColor;
              vec3 color2 = vec3(1.0 - baseColor.r, 1.0 - baseColor.g, 1.0 - baseColor.b);
              vec3 color3 = vec3(baseColor.g, baseColor.b, baseColor.r);
              
              vec3 finalColor = mix(color1, color2, sin(plasma * 3.14159) * 0.5 + 0.5);
              finalColor = mix(finalColor, color3, cos(plasma * 2.0) * 0.5 + 0.5);
              
              // Brightness modulation
              finalColor *= 0.8 + plasma * 0.4 + audioLevel * 0.5;
              
              gl_FragColor = vec4(finalColor, 1.0);
            }
          `,
          transparent: true,
          blending: THREE.AdditiveBlending,
        })

      case 'crystal':
        return (
          <MeshTransmissionMaterial
            color={new THREE.Color(...colorMap[soundType])}
            transmission={0.95}
            thickness={0.2}
            roughness={0.0}
            chromaticAberration={0.8}
            anisotropy={0.5}
            distortion={0.3}
            distortionScale={0.3}
            temporalDistortion={0.1}
            ior={2.4}
            reflectivity={0.8}
          />
        )

      default:
        return new THREE.MeshStandardMaterial({ color: new THREE.Color(...colorMap[soundType]) })
    }
  }, [type, soundType])

  useEffect(() => {
    if (!(material instanceof THREE.Material)) return

    const uniforms = (material as THREE.ShaderMaterial).uniforms
    if (uniforms?.resolution) {
      uniforms.resolution.value = [size.width, size.height]
    }
  }, [material, size.width, size.height])

  useEffect(() => {
    if (!(material instanceof THREE.Material)) return

    return () => {
      material.dispose()
    }
  }, [material])

  // Update shader uniforms
  useFrame((state, delta) => {
    if (!materialRef.current || !audioReactive) return

    const { bass, mid, treble, amplitude } = frequencyBands

    if (materialRef.current.uniforms) {
      const uniforms = materialRef.current.uniforms
      
      if (uniforms.time) uniforms.time.value += delta
      if (uniforms.audioLevel) uniforms.audioLevel.value = amplitude
      if (uniforms.bassLevel) uniforms.bassLevel.value = bass
      if (uniforms.midLevel) uniforms.midLevel.value = mid
      if (uniforms.trebleLevel) uniforms.trebleLevel.value = treble
      if (uniforms.audioAmplitude) uniforms.audioAmplitude.value = amplitude
      if (uniforms.audioData) uniforms.audioData.value = audioData
      if (uniforms.colorShift) uniforms.colorShift.value = Math.sin(state.clock.elapsedTime * 0.5) * amplitude
      if (uniforms.plasmaIntensity) uniforms.plasmaIntensity.value = 1.0 + amplitude * 2.0
      if (uniforms.fluidIntensity) uniforms.fluidIntensity.value = 1.0 + bass * 3.0
      if (uniforms.cymaticFreq) uniforms.cymaticFreq.value = 440.0 + treble * 880.0
      if (uniforms.iridescence) uniforms.iridescence.value = 1.0 + mid * 0.5
    }

    // Update PBR material properties
    if (type === 'liquid-metal' && materialRef.current.metalness !== undefined) {
      materialRef.current.metalness = 0.9 + bass * 0.1
      materialRef.current.roughness = 0.1 - amplitude * 0.05
      materialRef.current.reflectivity = 1.0
    }
  })

  // Return JSX for non-shader materials
  if (React.isValidElement(material)) {
    return React.cloneElement(material, { ref: materialRef })
  }

  return <primitive object={material} ref={materialRef} />
}

// Export material types for easy reference
export const MaterialTypes = {
  CYMATIC: 'cymatic' as const,
  HOLOGRAPHIC: 'holographic' as const,
  LIQUID_METAL: 'liquid-metal' as const,
  PLASMA: 'plasma' as const,
  CRYSTAL: 'crystal' as const,
}
