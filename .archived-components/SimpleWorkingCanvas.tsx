'use client'
import React, { useRef, useState, useCallback, useMemo } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import * as THREE from 'three'
import * as Tone from 'tone'
import { useMusicalPalette } from '../store/useMusicalPalette'
import { getInterval } from '@/lib/music'
import ModernStartOverlay from './ui/ModernStartOverlay'

// Simple musical object component
const MusicalObject = React.memo(({ 
  position, 
  color, 
  note, 
  type
}: { 
  position: [number, number, number]
  color: string
  note: string
  type: 'note' | 'chord' | 'beat'
}) => {
  const meshRef = useRef<THREE.Mesh>(null)
  const [hovered, setHovered] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  
  // Create synth only once and memoize it
  const synth = useMemo(() => {
    const s = new Tone.Synth({
      oscillator: { type: 'triangle' },
      envelope: { 
        attack: 0.02, 
        decay: 0.2, 
        sustain: 0.3, 
        release: 1.2 
      }
    }).toDestination()
    s.volume.value = -12
    return s
  }, [])

  // Memoized color
  const threeColor = useMemo(() => new THREE.Color(color), [color])
  
  useFrame((state) => {
    if (!meshRef.current) return
    
    const time = state.clock.elapsedTime
    
    // Smooth rotation animation
    meshRef.current.rotation.x = time * 0.3
    meshRef.current.rotation.y = time * 0.2
    
    // Enhanced scale animation
    const targetScale = isPlaying ? 1.8 : hovered ? 1.3 : 1.0
    meshRef.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.15)
    
    // Floating motion
    const baseY = position[1] + Math.sin(time * 1.5 + position[0]) * 0.3
    meshRef.current.position.y = baseY
  })

  const handleClick = useCallback(async () => {
    if (Tone.context.state !== 'running') {
      await Tone.start()
    }
    
    setIsPlaying(true)
    
    try {
      if (type === 'chord') {
        // Play a simple triad
        const chord = [note, getInterval(note, 4), getInterval(note, 7)]
        chord.forEach((n, index) => {
          setTimeout(() => synth.triggerAttackRelease(n, '0.8'), index * 50)
        })
      } else if (type === 'beat') {
        synth.oscillator.type = 'square'
        synth.triggerAttackRelease(note, '0.2')
        synth.oscillator.type = 'triangle'
      } else {
        synth.triggerAttackRelease(note, '0.6')
      }
    } catch (error) {
      console.error('Audio playback error:', error)
    }
    
    setTimeout(() => setIsPlaying(false), 600)
  }, [synth, note, type])

  const handlePointerOver = useCallback(() => setHovered(true), [])
  const handlePointerOut = useCallback(() => setHovered(false), [])

  // Simple geometry based on type
  const geometry = useMemo(() => {
    switch (type) {
      case 'chord':
        return <octahedronGeometry args={[1, 0]} />
      case 'beat':
        return <boxGeometry args={[1.2, 1.2, 1.2]} />
      default:
        return <sphereGeometry args={[1, 16, 16]} />
    }
  }, [type])

  return (
    <group>
      <mesh
        ref={meshRef}
        position={position}
        onClick={handleClick}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
      >
        {geometry}
        <meshStandardMaterial
          color={threeColor}
          emissive={threeColor}
          emissiveIntensity={isPlaying ? 1.2 : hovered ? 0.6 : 0.3}
          metalness={0.9}
          roughness={0.1}
          transparent={true}
          opacity={hovered ? 0.95 : 0.85}
        />
      </mesh>
      
      {/* Particle effects when playing */}
      {isPlaying && (
        <group>
          {Array.from({ length: 8 }).map((_, i) => (
            <mesh
              key={i}
              position={[
                position[0] + Math.sin(Date.now() * 0.01 + i) * 2,
                position[1] + Math.cos(Date.now() * 0.01 + i) * 1,
                position[2] + Math.sin(Date.now() * 0.015 + i) * 2
              ]}
              scale={[0.1, 0.1, 0.1]}
            >
              <sphereGeometry args={[1, 8, 8]} />
              <meshBasicMaterial
                color={threeColor}
                transparent={true}
                opacity={0.6}
              />
            </mesh>
          ))}
        </group>
      )}
    </group>
  )
})

MusicalObject.displayName = 'MusicalObject'

// Musical grid component
const MusicalGrid = React.memo(() => {
  const { scaleNotes } = useMusicalPalette()
  
  // Memoize the object layout
  const objects = useMemo(() => {
    const result = []
    const count = Math.min(scaleNotes.length, 8)
    
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2
      const radius = 4
      
      result.push({
        id: `${scaleNotes[i]}-${i}`,
        position: [
          Math.cos(angle) * radius,
          0,
          Math.sin(angle) * radius
        ] as [number, number, number],
        note: scaleNotes[i],
        type: (i % 3 === 0 ? 'chord' : i % 2 === 0 ? 'beat' : 'note') as 'note' | 'chord' | 'beat',
        color: `hsl(${(i * 45) % 360}, 70%, 60%)`
      })
    }
    
    return result
  }, [scaleNotes])
  
  return (
    <>
      {objects.map((obj) => (
        <MusicalObject
          key={obj.id}
          position={obj.position}
          color={obj.color}
          note={obj.note}
          type={obj.type}
        />
      ))}
    </>
  )
})

MusicalGrid.displayName = 'MusicalGrid'

// Ground plane component
const GroundPlane = React.memo(() => (
  <group>
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2, 0]} receiveShadow>
      <planeGeometry args={[30, 30]} />
      <meshPhysicalMaterial 
        color="#0f0f23"
        roughness={0.1}
        metalness={0.9}
        transparent={true}
        opacity={0.9}
      />
    </mesh>
    
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.99, 0]}>
      <planeGeometry args={[30, 30]} />
      <meshBasicMaterial 
        color="#2d1b69"
        transparent={true}
        opacity={0.1}
        wireframe={true}
      />
    </mesh>
    
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.98, 0]}>
      <ringGeometry args={[4, 6, 32]} />
      <meshBasicMaterial 
        color="#4ade80"
        transparent={true}
        opacity={0.2}
      />
    </mesh>
  </group>
))

GroundPlane.displayName = 'GroundPlane'

// Main canvas component
export default function SimpleWorkingCanvas() {
  const { key, scale, tempo } = useMusicalPalette()
  
  // Canvas settings
  const canvasSettings = useMemo(() => ({
    camera: { position: [0, 5, 10] as [number, number, number], fov: 60 },
    shadows: true,
    gl: { 
      antialias: true, 
      alpha: false,
      powerPreference: 'high-performance' as const,
      toneMapping: THREE.ACESFilmicToneMapping,
      toneMappingExposure: 1.2,
      outputColorSpace: THREE.SRGBColorSpace
    }
  }), [])
  
  return (
    <div style={{ 
      width: '100vw', 
      height: '100vh', 
      position: 'fixed', 
      top: 0, 
      left: 0,
      backgroundColor: '#0f0f23'
    }}>
      <Canvas {...canvasSettings}>
        <color attach="background" args={['#0f0f23']} />
        <fog attach="fog" args={['#0f0f23', 15, 35]} />
        
        {/* Lighting */}
        <ambientLight intensity={0.4} />
        <directionalLight 
          position={[10, 10, 5]} 
          intensity={2.0}
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
          shadow-camera-near={0.5}
          shadow-camera-far={50}
          shadow-camera-left={-10}
          shadow-camera-right={10}
          shadow-camera-top={10}
          shadow-camera-bottom={-10}
        />
        
        {/* Enhanced lighting */}
        <pointLight position={[-8, 6, 8]} color="#ff6b9d" intensity={2} castShadow />
        <pointLight position={[8, 6, 8]} color="#4ecdc4" intensity={2} castShadow />
        <pointLight position={[0, 10, -8]} color="#45b7d1" intensity={2} castShadow />
        
        <pointLight position={[0, -5, 10]} color="#fbbf24" intensity={1.5} />
        <pointLight position={[-10, 2, -5]} color="#8b5cf6" intensity={1.2} />
        <pointLight position={[10, 2, -5]} color="#10b981" intensity={1.2} />
        
        <hemisphereLight 
          args={["#87ceeb", "#2d1b69", 0.3]} 
        />
        
        <MusicalGrid />
        <GroundPlane />
        
        <OrbitControls 
          enablePan={false} 
          maxPolarAngle={Math.PI * 0.8}
          minDistance={5}
          maxDistance={15}
          enableDamping
          dampingFactor={0.05}
        />
      </Canvas>
      
      <ModernStartOverlay />
      
      {/* Simple controls */}
      <div style={{
        position: 'fixed',
        top: '20px',
        right: '20px',
        color: 'white',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '14px',
        zIndex: 1000
      }}>
        <div>Key: {key}</div>
        <div>Scale: {scale}</div>
        <div>Tempo: {tempo}</div>
      </div>
    </div>
  )
}
