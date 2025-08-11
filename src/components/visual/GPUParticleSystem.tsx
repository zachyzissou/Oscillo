'use client'
import { useRef, useMemo, useCallback } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { useAudioStore } from '@/store/useAudioEngine'
import { createNoise3D } from 'simplex-noise'

interface GPUParticleSystemProps {
  count?: number
  type: 'cymatic' | 'explosive' | 'flow' | 'spiral' | 'organic'
  audioReactive?: boolean
  color?: THREE.Color
  position?: [number, number, number]
  intensity?: number
}

export function GPUParticleSystem({
  count = 10000,
  type = 'cymatic',
  audioReactive = true,
  color = new THREE.Color(0x00ffff),
  position = [0, 0, 0],
  intensity = 1.0
}: GPUParticleSystemProps) {
  const pointsRef = useRef<THREE.Points>(null)
  const materialRef = useRef<THREE.ShaderMaterial>(null)
  const { fftData, volume } = useAudioStore()
  const { gl } = useThree()
  
  const noise3D = createNoise3D()

  // Audio analysis
  const audioData = useMemo(() => {
    if (!fftData || fftData.length === 0) {
      return { bass: 0, mid: 0, treble: 0, amplitude: 0, spectrum: new Float32Array(256) }
    }
    
    const bassEnd = Math.floor(fftData.length * 0.1)
    const midEnd = Math.floor(fftData.length * 0.5)
    
    const bass = fftData.slice(0, bassEnd).reduce((a, b) => a + b, 0) / bassEnd / 255
    const mid = fftData.slice(bassEnd, midEnd).reduce((a, b) => a + b, 0) / (midEnd - bassEnd) / 255  
    const treble = fftData.slice(midEnd).reduce((a, b) => a + b, 0) / (fftData.length - midEnd) / 255
    const amplitude = (bass + mid + treble) / 3

    // Downsample FFT for shader
    const spectrum = new Float32Array(256)
    const binSize = Math.floor(fftData.length / 256)
    
    for (let i = 0; i < 256; i++) {
      let sum = 0
      for (let j = 0; j < binSize; j++) {
        const index = i * binSize + j
        if (index < fftData.length) sum += fftData[index]
      }
      spectrum[i] = sum / binSize / 255
    }

    return { bass, mid, treble, amplitude, spectrum }
  }, [fftData])

  // Generate particle positions and attributes
  const { positions, velocities, phases, sizes } = useMemo(() => {
    const pos = new Float32Array(count * 3)
    const vel = new Float32Array(count * 3) 
    const phase = new Float32Array(count)
    const size = new Float32Array(count)

    for (let i = 0; i < count; i++) {
      const i3 = i * 3
      
      switch (type) {
        case 'cymatic':
          // Arrange in cymatic patterns
          const radius = Math.sqrt(Math.random()) * 5
          const angle = Math.random() * Math.PI * 2
          const height = (Math.random() - 0.5) * 0.5
          
          pos[i3] = Math.cos(angle) * radius + position[0]
          pos[i3 + 1] = height + position[1]
          pos[i3 + 2] = Math.sin(angle) * radius + position[2]
          
          vel[i3] = 0
          vel[i3 + 1] = 0
          vel[i3 + 2] = 0
          break

        case 'explosive':
          // Start from center, explode outward
          pos[i3] = position[0] + (Math.random() - 0.5) * 0.1
          pos[i3 + 1] = position[1] + (Math.random() - 0.5) * 0.1
          pos[i3 + 2] = position[2] + (Math.random() - 0.5) * 0.1
          
          const explosionSpeed = 5 + Math.random() * 10
          const theta = Math.random() * Math.PI * 2
          const phi = Math.acos(2 * Math.random() - 1)
          
          vel[i3] = Math.sin(phi) * Math.cos(theta) * explosionSpeed
          vel[i3 + 1] = Math.sin(phi) * Math.sin(theta) * explosionSpeed
          vel[i3 + 2] = Math.cos(phi) * explosionSpeed
          break

        case 'flow':
          // Flowing stream particles
          pos[i3] = position[0] + (Math.random() - 0.5) * 10
          pos[i3 + 1] = position[1] + Math.random() * 8 - 4
          pos[i3 + 2] = position[2] + (Math.random() - 0.5) * 10
          
          vel[i3] = (Math.random() - 0.5) * 2
          vel[i3 + 1] = -1 - Math.random() * 2
          vel[i3 + 2] = (Math.random() - 0.5) * 2
          break

        case 'spiral':
          // Spiral formation
          const spiralRadius = (i / count) * 8
          const spiralAngle = (i / count) * Math.PI * 8
          const spiralHeight = (i / count) * 6 - 3
          
          pos[i3] = Math.cos(spiralAngle) * spiralRadius + position[0]
          pos[i3 + 1] = spiralHeight + position[1]
          pos[i3 + 2] = Math.sin(spiralAngle) * spiralRadius + position[2]
          
          vel[i3] = -Math.sin(spiralAngle) * 0.5
          vel[i3 + 1] = 0.2
          vel[i3 + 2] = Math.cos(spiralAngle) * 0.5
          break

        case 'organic':
          // Organic cloud formation
          const cloudRadius = Math.pow(Math.random(), 0.3) * 6
          const cloudAngle = Math.random() * Math.PI * 2
          const cloudPhi = Math.acos(2 * Math.random() - 1)
          
          pos[i3] = Math.sin(cloudPhi) * Math.cos(cloudAngle) * cloudRadius + position[0]
          pos[i3 + 1] = Math.cos(cloudPhi) * cloudRadius + position[1]
          pos[i3 + 2] = Math.sin(cloudPhi) * Math.sin(cloudAngle) * cloudRadius + position[2]
          
          vel[i3] = (Math.random() - 0.5) * 0.1
          vel[i3 + 1] = (Math.random() - 0.5) * 0.1
          vel[i3 + 2] = (Math.random() - 0.5) * 0.1
          break
      }
      
      phase[i] = Math.random() * Math.PI * 2
      size[i] = 0.1 + Math.random() * 0.3
    }

    return { positions: pos, velocities: vel, phases: phase, sizes: size }
  }, [count, type, position])

  // Custom shader material for particles
  const particleMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        audioData: { value: audioData.spectrum },
        bassLevel: { value: 0 },
        midLevel: { value: 0 },
        trebleLevel: { value: 0 },
        amplitude: { value: 0 },
        color: { value: color },
        intensity: { value: intensity },
        resolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
      },
      
      vertexShader: `
        uniform float time;
        uniform float[256] audioData;
        uniform float bassLevel;
        uniform float midLevel;
        uniform float trebleLevel;
        uniform float amplitude;
        uniform float intensity;
        
        attribute float phase;
        attribute float size;
        attribute vec3 velocity;
        
        varying float vAlpha;
        varying vec3 vColor;
        varying float vSize;
        
        void main() {
          vec3 pos = position;
          
          // Audio-reactive movement
          float audioIndex = clamp(floor((pos.x + 10.0) / 20.0 * 256.0), 0.0, 255.0);
          float audioValue = audioData[int(audioIndex)];
          
          // Apply velocity and audio forces
          pos += velocity * time;
          
          // Audio-reactive displacement
          pos.y += sin(phase + time * 5.0) * audioValue * intensity * 2.0;
          pos.x += cos(phase * 1.3 + time * 3.0) * bassLevel * intensity;
          pos.z += sin(phase * 0.7 + time * 4.0) * trebleLevel * intensity;
          
          // Particle size based on audio
          vSize = size * (1.0 + audioValue * 2.0) * intensity;
          
          // Alpha based on distance and audio
          float distanceFromCenter = length(pos);
          vAlpha = 1.0 - smoothstep(0.0, 20.0, distanceFromCenter);
          vAlpha *= 0.5 + amplitude * 0.5;
          
          // Color variation
          vColor = vec3(
            0.5 + bassLevel * 0.5,
            0.5 + midLevel * 0.5, 
            0.5 + trebleLevel * 0.5
          );
          
          vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
          gl_Position = projectionMatrix * mvPosition;
          gl_PointSize = vSize * (100.0 / -mvPosition.z);
        }
      `,
      
      fragmentShader: `
        uniform vec3 color;
        uniform float time;
        uniform vec2 resolution;
        
        varying float vAlpha;
        varying vec3 vColor;
        varying float vSize;
        
        void main() {
          // Circular particle shape with soft edges
          vec2 center = gl_PointCoord - vec2(0.5);
          float dist = length(center);
          
          if (dist > 0.5) discard;
          
          // Soft circular falloff
          float alpha = 1.0 - smoothstep(0.2, 0.5, dist);
          alpha *= vAlpha;
          
          // Energy core effect
          float core = 1.0 - smoothstep(0.0, 0.3, dist);
          vec3 coreColor = color + vColor;
          
          // Outer glow
          float glow = 1.0 - smoothstep(0.3, 0.5, dist);
          vec3 glowColor = color * 0.5;
          
          vec3 finalColor = mix(glowColor, coreColor, core);
          
          // Add some sparkle
          float sparkle = sin(time * 20.0 + gl_FragCoord.x * 0.1) * 
                         cos(time * 15.0 + gl_FragCoord.y * 0.1);
          finalColor += sparkle * 0.1 * vColor;
          
          gl_FragColor = vec4(finalColor, alpha);
        }
      `,
      
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthTest: false,
      vertexColors: false,
    })
  }, [color, intensity, audioData.spectrum])

  // Update particle system
  useFrame((state, delta) => {
    if (!materialRef.current) return

    const { bass, mid, treble, amplitude, spectrum } = audioData
    
    // Update shader uniforms
    materialRef.current.uniforms.time.value += delta
    materialRef.current.uniforms.audioData.value = spectrum
    materialRef.current.uniforms.bassLevel.value = bass
    materialRef.current.uniforms.midLevel.value = mid
    materialRef.current.uniforms.trebleLevel.value = treble
    materialRef.current.uniforms.amplitude.value = amplitude

    // Update particle positions for certain types
    if (pointsRef.current && type === 'cymatic') {
      const geometry = pointsRef.current.geometry
      const positions = geometry.attributes.position as THREE.BufferAttribute
      
      for (let i = 0; i < count; i++) {
        const i3 = i * 3
        const originalX = positions.array[i3]
        const originalZ = positions.array[i3 + 2]
        
        // Create cymatic standing wave patterns
        const waveFreq = 440 + treble * 880 // Musical frequency
        const waveLength = 2 * Math.PI / waveFreq * 100 // Scale for visibility
        
        const distance = Math.sqrt(originalX * originalX + originalZ * originalZ)
        const waveHeight = Math.sin(distance / waveLength + state.clock.elapsedTime * 2) * 
                          Math.cos(originalX / waveLength * 2 + state.clock.elapsedTime) *
                          amplitude * 2
        
        positions.array[i3 + 1] = waveHeight + position[1]
      }
      
      positions.needsUpdate = true
    }

    // Reset explosive particles when bass hits
    if (type === 'explosive' && bass > 0.8 && pointsRef.current) {
      const geometry = pointsRef.current.geometry
      const positions = geometry.attributes.position as THREE.BufferAttribute
      const velocities = geometry.attributes.velocity as THREE.BufferAttribute
      
      // Reset random particles for continuous explosion effect
      const resetCount = Math.floor(count * 0.1)
      for (let i = 0; i < resetCount; i++) {
        const randomIndex = Math.floor(Math.random() * count)
        const i3 = randomIndex * 3
        
        positions.array[i3] = position[0]
        positions.array[i3 + 1] = position[1] 
        positions.array[i3 + 2] = position[2]
      }
      
      positions.needsUpdate = true
    }
  })

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-velocity"
          count={count}
          array={velocities}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-phase"
          count={count}
          array={phases}
          itemSize={1}
        />
        <bufferAttribute
          attach="attributes-size"
          count={count}
          array={sizes}
          itemSize={1}
        />
      </bufferGeometry>
      <primitive object={particleMaterial} ref={materialRef} />
    </points>
  )
}

// Trail particle system for note feedback
export function ParticleTrail({ 
  startPosition, 
  endPosition, 
  color = new THREE.Color(0x00ffff),
  duration = 2000,
  particleCount = 100 
}: {
  startPosition: THREE.Vector3
  endPosition: THREE.Vector3  
  color?: THREE.Color
  duration?: number
  particleCount?: number
}) {
  const trailRef = useRef<THREE.Points>(null)
  const startTime = useRef(Date.now())

  const { positions, sizes, alphas } = useMemo(() => {
    const pos = new Float32Array(particleCount * 3)
    const size = new Float32Array(particleCount)
    const alpha = new Float32Array(particleCount)
    
    const direction = endPosition.clone().sub(startPosition)
    
    for (let i = 0; i < particleCount; i++) {
      const t = i / particleCount
      const i3 = i * 3
      
      // Interpolate along path with some randomness
      const currentPos = startPosition.clone().add(direction.clone().multiplyScalar(t))
      currentPos.add(new THREE.Vector3(
        (Math.random() - 0.5) * 0.5,
        (Math.random() - 0.5) * 0.5,
        (Math.random() - 0.5) * 0.5
      ))
      
      pos[i3] = currentPos.x
      pos[i3 + 1] = currentPos.y
      pos[i3 + 2] = currentPos.z
      
      size[i] = 0.05 + Math.random() * 0.1
      alpha[i] = 1.0 - t // Fade out along trail
    }
    
    return { positions: pos, sizes: size, alphas: alpha }
  }, [startPosition, endPosition, particleCount])

  useFrame(() => {
    if (!trailRef.current) return
    
    const elapsed = Date.now() - startTime.current
    const progress = elapsed / duration
    
    if (progress > 1) {
      trailRef.current.visible = false
      return
    }
    
    // Fade out over time
    const material = trailRef.current.material as THREE.PointsMaterial
    material.opacity = 1 - progress
    
    // Animate trail particles
    const geometry = trailRef.current.geometry
    const positions = geometry.attributes.position as THREE.BufferAttribute
    
    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3
      const t = i / particleCount
      
      // Add some movement
      positions.array[i3 + 1] += Math.sin(Date.now() * 0.01 + t * Math.PI * 2) * 0.01
    }
    
    positions.needsUpdate = true
  })

  return (
    <points ref={trailRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={particleCount}
          array={positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-size"
          count={particleCount}
          array={sizes}
          itemSize={1}
        />
        <bufferAttribute
          attach="attributes-alpha"
          count={particleCount}
          array={alphas}
          itemSize={1}
        />
      </bufferGeometry>
      <pointsMaterial
        color={color}
        size={0.1}
        transparent
        opacity={1}
        blending={THREE.AdditiveBlending}
        sizeAttenuation
      />
    </points>
  )
}