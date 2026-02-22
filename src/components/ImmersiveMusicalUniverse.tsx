'use client'
import React, { useRef, useState, useMemo, useEffect } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Stars, Effects, AdaptiveDpr } from '@react-three/drei'
import * as THREE from 'three'
import { useMusicalPalette } from '../store/useMusicalPalette'
import { useAudioEngine } from '../store/useAudioEngine'
import SimpleStartOverlay from './ui/SimpleStartOverlay'
import QualityManager from '@/components/visual/QualityManager'
import { usePerformanceSettings } from '@/store/usePerformanceSettings'
import { QUALITY_PROFILES } from '@/lib/quality'
import AudioDebugPanel from './AudioDebugPanel'

import { performanceMonitor } from '@/lib/performance-monitor'

// Extend the fiber catalog with post-processing effects
// extend({ EffectComposer, RenderPass, UnrealBloomPass, FilmPass, ShaderPass, GlitchPass })

import ParticleNoteSystem from '@/components/visual/ParticleNoteSystem'

// Audio-reactive tunnel environment
import AudioReactiveTunnel from '@/components/visual/AudioReactiveTunnel'

// Morphing geometric shapes
import MorphingGeometry from '@/components/visual/MorphingGeometry'
import PluginLoader from '@/plugins/PluginLoader'
import ExperienceCommandDeck from '@/components/ui/ExperienceCommandDeck'

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
            id={obj.id}
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
  const hasUserInteracted = useAudioEngine((state) => state.hasUserInteracted)

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
  
  const perfLevel = usePerformanceSettings((s) => s.level)
  const profile = QUALITY_PROFILES[perfLevel]

  const canvasSettings = useMemo(() => ({
    camera: { position: [0, 5, 15] as [number, number, number], fov: 75 },
    shadows: profile.shadows,
    gl: { 
      antialias: true, 
      alpha: false,
      powerPreference: 'high-performance' as const,
      toneMapping: THREE.ACESFilmicToneMapping,
      toneMappingExposure: perfLevel === 'low' ? 1.2 : 1.4,
      outputColorSpace: THREE.SRGBColorSpace
    },
    dpr: profile.dpr as [number, number]
  }), [profile, perfLevel])
  
  return (
    <div
      data-testid="canvas-container"
      style={{
      width: '100vw',
      height: '100vh',
      position: 'fixed',
      top: 0,
      left: 0,
      backgroundColor: '#000011',
      zIndex: 1
    }}
    >
      {hasUserInteracted ? (
        <Canvas data-testid="webgl-canvas" {...canvasSettings}>
        <AdaptiveDpr pixelated />
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
          count={Math.floor(5000 * profile.starCountScale)} 
          factor={perfLevel === 'low' ? 6 : 8} 
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
      ) : (
        <div style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #000011 0%, #001122 100%)'
        }}>
          {/* Placeholder while waiting for user interaction */}
        </div>
      )}
      
      <SimpleStartOverlay />
      <QualityManager />
      <PluginLoader />
      {process.env.NODE_ENV === 'development' && <AudioDebugPanel />}

      {/* Cohesive command deck UI - only show after interaction */}
      {hasUserInteracted && (
        <ExperienceCommandDeck />
      )}
    </div>
  )
}

// Interval helper moved to src/lib/music.ts
