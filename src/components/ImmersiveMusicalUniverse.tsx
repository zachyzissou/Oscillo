'use client'
import React, { useRef, useState, useCallback, useMemo, useEffect } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { OrbitControls, Stars, Effects, Environment, PerspectiveCamera } from '@react-three/drei'
import * as THREE from 'three'
import * as Tone from 'tone'
import { extend } from '@react-three/fiber'
import { useMusicalPalette } from '../store/useMusicalPalette'
import ModernStartOverlay from './ui/ModernStartOverlay'

import { performanceMonitor } from '@/lib/performance-monitor'

// Extend the fiber catalog with post-processing effects
// extend({ EffectComposer, RenderPass, UnrealBloomPass, FilmPass, ShaderPass, GlitchPass })

// Advanced particle system for notes
const ParticleNoteSystem = React.memo(({ 
  position, 
  color, 
  note, 
  type,
  isActive 
}: { 
  position: [number, number, number]
  color: string
  note: string
  type: 'note' | 'chord' | 'beat'
  isActive: boolean
}) => {
  const particlesRef = useRef<THREE.Points>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  
  // Create thousands of particles
  const [particleData] = useMemo(() => {
    const count = type === 'chord' ? 2000 : type === 'beat' ? 5000 : 1500
    const positions = new Float32Array(count * 3)
    const velocities = new Float32Array(count * 3)
    const sizes = new Float32Array(count)
    const phases = new Float32Array(count)
    
    for (let i = 0; i < count; i++) {
      const i3 = i * 3
      
      // Spiral formation for chords, explosion for beats, orb for notes
      if (type === 'chord') {
        const t = i / count
        const radius = 2 + t * 3
        const angle = t * Math.PI * 8
        positions[i3] = Math.cos(angle) * radius + position[0]
        positions[i3 + 1] = (t - 0.5) * 4 + position[1]
        positions[i3 + 2] = Math.sin(angle) * radius + position[2]
      } else if (type === 'beat') {
        const phi = Math.acos(-1 + (2 * i) / count)
        const theta = Math.sqrt(count * Math.PI) * phi
        const radius = 1 + Math.random() * 3
        positions[i3] = radius * Math.cos(theta) * Math.sin(phi) + position[0]
        positions[i3 + 1] = radius * Math.cos(phi) + position[1]
        positions[i3 + 2] = radius * Math.sin(theta) * Math.sin(phi) + position[2]
      } else {
        // Spherical distribution for notes
        const phi = Math.acos(-1 + (2 * i) / count)
        const theta = Math.sqrt(count * Math.PI) * phi
        const radius = 1.5 + Math.random() * 0.5
        positions[i3] = radius * Math.cos(theta) * Math.sin(phi) + position[0]
        positions[i3 + 1] = radius * Math.cos(phi) + position[1]
        positions[i3 + 2] = radius * Math.sin(theta) * Math.sin(phi) + position[2]
      }
      
      velocities[i3] = (Math.random() - 0.5) * 0.02
      velocities[i3 + 1] = (Math.random() - 0.5) * 0.02
      velocities[i3 + 2] = (Math.random() - 0.5) * 0.02
      
      sizes[i] = Math.random() * 0.1 + 0.05
      phases[i] = Math.random() * Math.PI * 2
    }
    
    return [{
      positions,
      velocities,
      sizes,
      phases,
      count
    }]
  }, [position, type])
  
  // Synth for this particle system
  const synth = useMemo(() => {
    let synthType: Tone.ToneOscillatorType = 'sine'
    if (type === 'chord') synthType = 'triangle'
    if (type === 'beat') synthType = 'square'
    
    const s = new Tone.Synth({
      oscillator: { type: synthType },
      envelope: { 
        attack: type === 'beat' ? 0.01 : 0.02, 
        decay: type === 'chord' ? 0.4 : 0.2, 
        sustain: type === 'chord' ? 0.6 : 0.3, 
        release: type === 'chord' ? 2.0 : 1.2 
      }
    }).toDestination()
    s.volume.value = -8
    return s
  }, [type])
  
  const handleClick = useCallback(async () => {
    if (Tone.context.state !== 'running') {
      await Tone.start()
    }
    
    setIsPlaying(true)
    
    try {
      if (type === 'chord') {
        // Complex chord with harmonics
        const frequencies = [note, getInterval(note, 4), getInterval(note, 7), getInterval(note, 10)]
        frequencies.forEach((freq, index) => {
          setTimeout(() => {
            synth.triggerAttackRelease(freq, '1.5')
          }, index * 100)
        })
      } else if (type === 'beat') {
        // Percussive burst
        synth.triggerAttackRelease(note, '0.1')
        setTimeout(() => synth.triggerAttackRelease(getInterval(note, -12), '0.1'), 50)
      } else {
        synth.triggerAttackRelease(note, '1.0')
      }
    } catch (error) {
      console.error('Audio playback error:', error)
    }
    
    setTimeout(() => setIsPlaying(false), type === 'chord' ? 2000 : 1000)
  }, [synth, note, type])
  
  useFrame((state) => {
    if (!particlesRef.current) return
    
    const time = state.clock.elapsedTime
    const geometry = particlesRef.current.geometry
    const positionAttribute = geometry.attributes.position as THREE.BufferAttribute
    const sizeAttribute = geometry.attributes.size as THREE.BufferAttribute
    
    for (let i = 0; i < particleData.count; i++) {
      const i3 = i * 3
      
      // Breathing motion
      const breathe = Math.sin(time * 2 + particleData.phases[i]) * 0.1
      const activeScale = isActive ? 1.5 : 1.0
      const playingScale = isPlaying ? 2.0 : 1.0
      
      // Update positions with complex motion
      const baseX = particleData.positions[i3]
      const baseY = particleData.positions[i3 + 1]
      const baseZ = particleData.positions[i3 + 2]
      
      // Add orbital motion
      const orbitRadius = 0.1 + breathe
      const orbitSpeed = time * (0.5 + i * 0.001)
      
      positionAttribute.array[i3] = baseX + Math.cos(orbitSpeed) * orbitRadius * activeScale
      positionAttribute.array[i3 + 1] = baseY + Math.sin(time * 1.5 + i * 0.01) * 0.2 * activeScale
      positionAttribute.array[i3 + 2] = baseZ + Math.sin(orbitSpeed) * orbitRadius * activeScale
      
      // Update sizes
      const pulsation = Math.sin(time * 3 + particleData.phases[i]) * 0.5 + 0.5
      sizeAttribute.array[i] = particleData.sizes[i] * (1 + pulsation * 0.5) * activeScale * playingScale
    }
    
    positionAttribute.needsUpdate = true
    sizeAttribute.needsUpdate = true
    
    // Rotate the entire particle system
    if (type === 'chord') {
      particlesRef.current.rotation.y = time * 0.2
      particlesRef.current.rotation.x = Math.sin(time * 0.5) * 0.1
    } else if (type === 'beat') {
      particlesRef.current.rotation.x = time * 0.5
      particlesRef.current.rotation.z = time * 0.3
    } else {
      particlesRef.current.rotation.y = time * 0.1
    }
  })
  
  const threeColor = useMemo(() => new THREE.Color(color), [color])
  
  return (
    <points ref={particlesRef} onClick={handleClick}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[particleData.positions, 3]}
        />
        <bufferAttribute
          attach="attributes-size"
          args={[particleData.sizes, 1]}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.1}
        color={threeColor}
        transparent
        opacity={0.8}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
        vertexColors={false}
      />
    </points>
  )
})

ParticleNoteSystem.displayName = 'ParticleNoteSystem'

// Audio-reactive tunnel environment
const AudioReactiveTunnel = React.memo(() => {
  const tunnelRef = useRef<THREE.Mesh>(null)
  const materialRef = useRef<THREE.ShaderMaterial>(null)
  
  const tunnelMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        audioLevel: { value: 0 },
        colorA: { value: new THREE.Color(0x0066ff) },
        colorB: { value: new THREE.Color(0xff0066) },
        colorC: { value: new THREE.Color(0x66ff00) }
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
      `,
      transparent: true,
      side: THREE.BackSide
    })
  }, [])
  
  useFrame((state) => {
    if (materialRef.current) {
      materialRef.current.uniforms.time.value = state.clock.elapsedTime
      
      // Simulate audio level (in real app, this would come from audio analysis)
      const fakeAudio = Math.sin(state.clock.elapsedTime * 2) * 0.5 + 0.5
      materialRef.current.uniforms.audioLevel.value = fakeAudio
    }
    
    if (tunnelRef.current) {
      tunnelRef.current.rotation.z = state.clock.elapsedTime * 0.1
    }
  })
  
  return (
    <mesh ref={tunnelRef} position={[0, 0, -20]} scale={[50, 50, 40]}>
      <cylinderGeometry args={[1, 1, 1, 32, 1, true]} />
      <primitive object={tunnelMaterial} ref={materialRef} />
    </mesh>
  )
})

AudioReactiveTunnel.displayName = 'AudioReactiveTunnel'

// Morphing geometric shapes
const MorphingGeometry = React.memo(({ position, type }: { 
  position: [number, number, number], 
  type: 'primary' | 'secondary' 
}) => {
  const meshRef = useRef<THREE.Mesh>(null)
  const materialRef = useRef<THREE.ShaderMaterial>(null)
  
  const morphMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        morphFactor: { value: 0 },
        colorShift: { value: 0 }
      },
      vertexShader: `
        uniform float time;
        uniform float morphFactor;
        
        varying vec2 vUv;
        varying vec3 vNormal;
        varying vec3 vPosition;
        
        // Noise function
        float noise(vec3 p) {
          return fract(sin(dot(p, vec3(12.9898, 78.233, 37.719))) * 43758.5453);
        }
        
        void main() {
          vUv = uv;
          vNormal = normal;
          vPosition = position;
          
          vec3 pos = position;
          
          // Morphing between sphere and complex shape
          float sphereRadius = length(pos);
          vec3 spherePos = normalize(pos) * 1.0;
          
          // Complex deformation
          float deform = sin(pos.x * 3.0 + time) * cos(pos.y * 3.0 + time * 0.7) * sin(pos.z * 3.0 + time * 1.3);
          vec3 deformedPos = pos + normal * deform * 0.3;
          
          // Morph between shapes
          pos = mix(spherePos, deformedPos, morphFactor);
          
          gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
        }
      `,
      fragmentShader: `
        uniform float time;
        uniform float colorShift;
        
        varying vec2 vUv;
        varying vec3 vNormal;
        varying vec3 vPosition;
        
        vec3 hsv2rgb(vec3 c) {
          vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
          vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
          return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
        }
        
        void main() {
          float fresnel = pow(1.0 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.0);
          
          float hue = colorShift + time * 0.1 + fresnel * 0.3;
          vec3 color = hsv2rgb(vec3(hue, 0.8, 0.9));
          
          color += vec3(fresnel * 0.5);
          
          gl_FragColor = vec4(color, 0.9);
        }
      `,
      transparent: true,
      side: THREE.DoubleSide
    })
  }, [])
  
  useFrame((state) => {
    if (!materialRef.current || !meshRef.current) return
    
    const time = state.clock.elapsedTime
    materialRef.current.uniforms.time.value = time
    
    // Animate morphing
    materialRef.current.uniforms.morphFactor.value = Math.sin(time * 0.5) * 0.5 + 0.5
    materialRef.current.uniforms.colorShift.value = type === 'primary' ? 0.0 : 0.3
    
    // Complex rotation
    meshRef.current.rotation.x = time * 0.3
    meshRef.current.rotation.y = time * 0.2
    meshRef.current.rotation.z = Math.sin(time * 0.4) * 0.5
    
    // Floating motion
    meshRef.current.position.y = position[1] + Math.sin(time * 0.7 + position[0]) * 0.5
  })
  
  return (
    <mesh ref={meshRef} position={position}>
      <icosahedronGeometry args={[1.5, 2]} />
      <primitive object={morphMaterial} ref={materialRef} />
    </mesh>
  )
})

MorphingGeometry.displayName = 'MorphingGeometry'

// Simple glow effect using built-in Three.js features
// Main musical grid with advanced particles
const AdvancedMusicalGrid = React.memo(() => {
  const { scaleNotes } = useMusicalPalette()
  const [activeNote, setActiveNote] = useState<string | null>(null)
  
  const objects = useMemo(() => {
    const result = []
    const count = Math.min(scaleNotes.length, 12)
    
    // Create spiral formation
    for (let i = 0; i < count; i++) {
      const t = i / count
      const spiralRadius = 6 + Math.sin(t * Math.PI * 4) * 2
      const spiralHeight = (t - 0.5) * 8
      const angle = t * Math.PI * 6
      
      result.push({
        id: `${scaleNotes[i]}-${i}`,
        position: [
          Math.cos(angle) * spiralRadius,
          spiralHeight,
          Math.sin(angle) * spiralRadius
        ] as [number, number, number],
        note: scaleNotes[i],
        type: (i % 4 === 0 ? 'chord' : i % 3 === 0 ? 'beat' : 'note') as 'note' | 'chord' | 'beat'
        // color property removed
      })
    }
    
    return result
  }, [scaleNotes])

  // Animation time for color calculation
  const timeRef = useRef(0)
  useFrame((state) => {
    timeRef.current = state.clock.getElapsedTime()
  })

  return (
    <group>
      {objects.map((obj, i) => {
        const t = i / objects.length
        const hue = (t * 360 + timeRef.current * 10) % 360
        const color = `hsl(${hue}, 85%, 65%)`
        return (
          <ParticleNoteSystem
            key={obj.id}
            position={obj.position}
            color={color}
            note={obj.note}
            type={obj.type}
            isActive={activeNote === obj.id}
          />
        )
      })}
      
      {/* Add morphing geometries */}
      <MorphingGeometry position={[0, 0, 0]} type="primary" />
      <MorphingGeometry position={[8, 4, -5]} type="secondary" />
      <MorphingGeometry position={[-8, -4, 5]} type="primary" />
    </group>
  )
})

AdvancedMusicalGrid.displayName = 'AdvancedMusicalGrid'

// Moving accent lights component
const MovingAccentLights = React.memo(() => {
  const lightRef = useRef<THREE.Group>(null)
  
  useFrame((state) => {
    if (!lightRef.current) return
    
    const time = state.clock.elapsedTime
    lightRef.current.rotation.y = time * 0.5
    lightRef.current.rotation.z = Math.sin(time * 0.3) * 0.2
  })
  
  return (
    <group ref={lightRef}>
      <pointLight 
        position={[8, 4, 8]} 
        intensity={0.8} 
        color="#ff006e"
        distance={20}
      />
      <pointLight 
        position={[-8, -4, -8]} 
        intensity={0.8} 
        color="#00f5ff"
        distance={20}
      />
      <pointLight 
        position={[0, 12, -10]} 
        intensity={1.0} 
        color="#ffbe0b"
        distance={25}
      />
    </group>
  )
})

MovingAccentLights.displayName = 'MovingAccentLights'

// Simple post-processing effects
const SimplePostProcessing = React.memo(() => {
  return (
    <Effects>
      {/* Add subtle bloom effect when postprocessing is available */}
    </Effects>
  )
})

SimplePostProcessing.displayName = 'SimplePostProcessing'

// Main immersive canvas
export default function ImmersiveMusicalUniverse() {
  const { key, scale, tempo } = useMusicalPalette()
  
  // Setup performance monitoring
  useEffect(() => {
    // Expose performance monitor globally for tests
    if (typeof window !== 'undefined') {
      (window as any).performanceMonitor = performanceMonitor
      
      // Auto-start performance monitoring based on URL params
      const params = new URLSearchParams(window.location.search)
      if (params.get('perf') === '1') {
        performanceMonitor.start()
      }
    }
  }, [])
  
  const canvasSettings = useMemo(() => ({
    camera: { position: [0, 5, 15] as [number, number, number], fov: 75 },
    shadows: true,
    gl: { 
      antialias: true, 
      alpha: false,
      powerPreference: 'high-performance' as const,
      toneMapping: THREE.ACESFilmicToneMapping,
      toneMappingExposure: 1.4,
      outputColorSpace: THREE.SRGBColorSpace
    },
    dpr: [1, 2] as [number, number]
  }), [])
  
  return (
    <div style={{ 
      width: '100vw', 
      height: '100vh', 
      position: 'fixed', 
      top: 0, 
      left: 0,
      backgroundColor: '#000011'
    }}>
      <Canvas {...canvasSettings}>
        <color attach="background" args={['#000011']} />
        <fog attach="fog" args={['#000033', 20, 60]} />
        
        {/* Advanced lighting setup */}
        <ambientLight intensity={0.2} color="#4a0e4e" />
        
        {/* Dynamic main lights */}
        <pointLight 
          position={[10, 10, 10]} 
          intensity={2.0} 
          color="#ff006e" 
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
        />
        <pointLight 
          position={[-10, 8, -5]} 
          intensity={1.8} 
          color="#00f5ff" 
          castShadow
        />
        <pointLight 
          position={[0, -8, 12]} 
          intensity={1.5} 
          color="#8338ec" 
          castShadow
        />
        
        {/* Moving accent lights */}
        <MovingAccentLights />
        
        {/* Directional rim lighting */}
        <directionalLight
          position={[20, 20, 20]}
          intensity={0.8}
          color="#ffffff"
          castShadow
          shadow-camera-near={0.1}
          shadow-camera-far={100}
          shadow-camera-left={-20}
          shadow-camera-right={20}
          shadow-camera-top={20}
          shadow-camera-bottom={-20}
        />
        
        {/* Environment and stars */}
        <Stars 
          radius={100} 
          depth={50} 
          count={5000} 
          factor={8} 
          saturation={0.8} 
          fade={true}
          speed={0.5}
        />
        
        {/* Audio-reactive tunnel background */}
        <AudioReactiveTunnel />
        
        {/* Main musical content */}
        <AdvancedMusicalGrid />
        
        {/* Enhanced camera controls */}
        <OrbitControls 
          enablePan={true} 
          maxPolarAngle={Math.PI * 0.9}
          minDistance={8}
          maxDistance={30}
          enableDamping
          dampingFactor={0.02}
          autoRotate={true}
          autoRotateSpeed={0.5}
        />
        
        {/* Simple glow effects */}
        <SimplePostProcessing />
      </Canvas>
      
      <ModernStartOverlay />
      
      {/* Enhanced UI overlay */}
      <div style={{
        position: 'fixed',
        top: '20px',
        right: '20px',
        color: 'white',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '16px',
        zIndex: 1000,
        textShadow: '0 0 10px rgba(255,255,255,0.3)',
        background: 'rgba(0,0,0,0.3)',
        backdropFilter: 'blur(10px)',
        padding: '15px',
        borderRadius: '10px',
        border: '1px solid rgba(255,255,255,0.1)'
      }}>
        <div style={{ marginBottom: '8px', fontSize: '18px', fontWeight: 'bold' }}>🎵 Musical Universe</div>
        <div>Key: <span style={{ color: '#ff006e' }}>{key}</span></div>
        <div>Scale: <span style={{ color: '#00f5ff' }}>{scale}</span></div>
        <div>Tempo: <span style={{ color: '#8338ec' }}>{tempo}</span></div>
        <div style={{ marginTop: '10px', fontSize: '12px', opacity: 0.8 }}>
          Click particles to play notes<br/>
          Drag to explore • Scroll to zoom
        </div>
      </div>
    </div>
  )
}

// Helper function for chord intervals
function getInterval(note: string, semitones: number): string {
  const noteMap = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
  const match = note.match(/^([A-G]#?)(\d+)$/)
  if (!match) return note
  
  const [, noteName, octaveStr] = match
  const octave = parseInt(octaveStr)
  const noteIndex = noteMap.indexOf(noteName)
  
  const newNoteIndex = (noteIndex + semitones) % 12
  const newOctave = octave + Math.floor((noteIndex + semitones) / 12)
  
  return `${noteMap[newNoteIndex]}${newOctave}`
}