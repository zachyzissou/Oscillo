'use client'
import React from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { useRef, useState, useCallback, useMemo } from 'react'
import * as THREE from 'three'
import * as Tone from 'tone'
import { useMusicalPalette } from '../store/useMusicalPalette'
import { getInterval } from '@/lib/music'
import { getAnalyserBands } from '../lib/analyser'
import AIMusicPanel from './AIMusicPanel'
import FluidBlobGeometry from './FluidBlobGeometry'
import ArtisticLighting from './ArtisticLighting'
import ArtisticPostProcessing from './ArtisticPostProcessing'
import ImmersiveUI from './ImmersiveUI'
import ArtisticInteractions, { withArtisticInteractions } from './ArtisticInteractions'
import ArtisticThemeSelector from './ArtisticThemeSelector'
import { useArtisticTheme } from '../store/useArtisticTheme'
import PerformanceDebugPanel, { PerformanceMonitor } from './PerformanceDebugPanel'
import { useArtisticPerformance, qualitySettings } from '../lib/artisticPerformance'
import ArtisticExportPanel, { ExportMonitor } from './ArtisticExportPanel'

// Memoized musical object component for better performance
const MusicalObject = React.memo(({ 
  position, 
  color, 
  note, 
  type,
  qualityConfig
}: { 
  position: [number, number, number]
  color: string
  note: string
  type: 'note' | 'chord' | 'beat'
  qualityConfig: any
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
    s.volume.value = -12 // Set a reasonable volume
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
    
    // Enhanced scale animation with more dramatic effects
    const targetScale = isPlaying ? 1.8 : hovered ? 1.3 : 1.0
    meshRef.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.15)
    
    // More dynamic floating motion with audio-reactive height
    const baseY = position[1] + Math.sin(time * 1.5 + position[0]) * 0.3
    try {
      const { bass, mid, treble } = getAnalyserBands()
      const audioLevel = (bass + mid + treble) / (3 * 255)
      meshRef.current.position.y = baseY + audioLevel * 0.5
    } catch (error) {
      meshRef.current.position.y = baseY
    }
    
    // Audio-reactive emissive intensity
    try {
      const { bass, mid, treble } = getAnalyserBands()
      const audioLevel = (bass + mid + treble) / (3 * 255)
      const material = meshRef.current.material as THREE.MeshStandardMaterial
      material.emissiveIntensity = 0.2 + audioLevel * 0.6
    } catch (error) {
      // Fallback to static glow if audio analysis fails
      const material = meshRef.current.material as THREE.MeshStandardMaterial
      material.emissiveIntensity = 0.2
    }
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
        // Use a different waveform for beats
        synth.oscillator.type = 'square'
        synth.triggerAttackRelease(note, '0.2')
        synth.oscillator.type = 'triangle' // Reset
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

  // Fluid blob geometry based on type with organic shapes and quality scaling
  const fluidGeometry = useMemo(() => {
    const baseComplexity = type === 'chord' ? 3 : type === 'beat' ? 2 : 1
    const adjustedComplexity = Math.max(1, baseComplexity - qualityConfig.geometryLOD)
    
    const props = {
      complexity: adjustedComplexity,
      viscosity: (type === 'chord' ? 1.5 : type === 'beat' ? 0.8 : 1.0) * qualityConfig.shaderComplexity,
      wobbliness: (type === 'chord' ? 1.2 : type === 'beat' ? 1.8 : 1.0) * qualityConfig.shaderComplexity,
      blobIntensity: (isPlaying ? 2.0 : hovered ? 1.5 : 1.0) * qualityConfig.shaderComplexity,
      size: type === 'beat' ? 1.2 : 1.0
    }
    return <FluidBlobGeometry {...props} />
  }, [type, isPlaying, hovered, qualityConfig])

  // Advanced material properties
  const materialProps = useMemo(() => {
    const baseIntensity = isPlaying ? 1.2 : hovered ? 0.6 : 0.3
    return {
      color: threeColor,
      emissive: threeColor,
      emissiveIntensity: baseIntensity,
      metalness: 0.9,
      roughness: 0.1,
      transparent: true,
      opacity: hovered ? 0.95 : 0.85,
      clearcoat: 1.0,
      clearcoatRoughness: 0.1,
      reflectivity: 1.0,
      envMapIntensity: 2.0,
    }
  }, [threeColor, isPlaying, hovered])

  // Enhanced musical object with artistic interactions
  const EnhancedMusicalObject = useMemo(() => 
    withArtisticInteractions(() => (
      <group
        ref={meshRef as any}
        onClick={handleClick}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
      >
        {fluidGeometry}
      </group>
    )), [fluidGeometry, handleClick, handlePointerOver, handlePointerOut]
  )

  return (
    <group>
      {/* Main object with enhanced materials and artistic interactions */}
      <EnhancedMusicalObject position={position} />
      
      
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

// Audio-reactive lighting component
const AudioLights = React.memo(() => {
  const light1Ref = useRef<THREE.PointLight>(null)
  const light2Ref = useRef<THREE.PointLight>(null)
  const light3Ref = useRef<THREE.PointLight>(null)
  
  useFrame(() => {
    try {
      const { bass, mid, treble } = getAnalyserBands()
      
      if (light1Ref.current) {
        light1Ref.current.intensity = 1 + (bass / 255) * 1.5
      }
      if (light2Ref.current) {
        light2Ref.current.intensity = 1 + (mid / 255) * 1.5
      }
      if (light3Ref.current) {
        light3Ref.current.intensity = 1 + (treble / 255) * 1.5
      }
    } catch (error) {
      // Graceful fallback to static lighting
      if (light1Ref.current) light1Ref.current.intensity = 1
      if (light2Ref.current) light2Ref.current.intensity = 1
      if (light3Ref.current) light3Ref.current.intensity = 1
    }
  })
  
  return (
    <>
      <ambientLight intensity={0.4} />
      <directionalLight 
        position={[10, 10, 5]} 
        intensity={2.0}
        castShadow
        shadow-mapSize-width={4096}
        shadow-mapSize-height={4096}
        shadow-camera-near={0.5}
        shadow-camera-far={50}
        shadow-camera-left={-10}
        shadow-camera-right={10}
        shadow-camera-top={10}
        shadow-camera-bottom={-10}
      />
      
      {/* Enhanced audio-reactive lighting */}
      <pointLight ref={light1Ref} position={[-8, 6, 8]} color="#ff6b9d" intensity={2} castShadow />
      <pointLight ref={light2Ref} position={[8, 6, 8]} color="#4ecdc4" intensity={2} castShadow />
      <pointLight ref={light3Ref} position={[0, 10, -8]} color="#45b7d1" intensity={2} castShadow />
      
      {/* Additional rim lighting for dramatic effect */}
      <pointLight position={[0, -5, 10]} color="#fbbf24" intensity={1.5} />
      <pointLight position={[-10, 2, -5]} color="#8b5cf6" intensity={1.2} />
      <pointLight position={[10, 2, -5]} color="#10b981" intensity={1.2} />
      
      {/* Subtle fill light */}
      <hemisphereLight 
        args={["#87ceeb", "#2d1b69", 0.3]} 
      />
    </>
  )
})

AudioLights.displayName = 'AudioLights'

// Musical grid component
const MusicalGrid = React.memo(() => {
  const { scaleNotes } = useMusicalPalette()
  const { currentQuality } = useArtisticPerformance()
  const qualityConfig = qualitySettings[currentQuality]
  
  // Memoize the object layout to prevent unnecessary recalculations
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
          qualityConfig={qualityConfig}
        />
      ))}
    </>
  )
})

MusicalGrid.displayName = 'MusicalGrid'

// Enhanced ground plane component
const GroundPlane = React.memo(() => (
  <group>
    {/* Main reflective ground */}
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2, 0]} receiveShadow>
      <planeGeometry args={[30, 30]} />
      <meshPhysicalMaterial 
        color="#0f0f23"
        roughness={0.1}
        metalness={0.9}
        envMapIntensity={1.5}
        transparent={true}
        opacity={0.9}
      />
    </mesh>
    
    {/* Subtle grid pattern */}
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.99, 0]}>
      <planeGeometry args={[30, 30]} />
      <meshBasicMaterial 
        color="#2d1b69"
        transparent={true}
        opacity={0.1}
        wireframe={true}
      />
    </mesh>
    
    {/* Circular accent around center */}
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
export default function WorkingMusicalCanvas() {
  const { key, scale, tempo, setKey, setScale, setTempo } = useMusicalPalette()
  const [showAIPanel, setShowAIPanel] = useState(false)
  const [showThemeSelector, setShowThemeSelector] = useState(false)
  const [showExportPanel, setShowExportPanel] = useState(false)
  const { getCurrentConfig } = useArtisticTheme()
  const themeConfig = getCurrentConfig()
  const { currentQuality } = useArtisticPerformance()
  const qualityConfig = qualitySettings[currentQuality]
  
  // Enhanced canvas settings
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
        <color attach="background" args={[themeConfig.colors.background]} />
        <fog attach="fog" args={[themeConfig.colors.background, 15 * themeConfig.lightingConfig.fogDensity, 35 * themeConfig.lightingConfig.fogDensity]} />
        
        <ArtisticLighting />
        <MusicalGrid />
        <GroundPlane />
        <ImmersiveUI />
        <ArtisticInteractions />
        <PerformanceMonitor />
        <ExportMonitor />
        
        <OrbitControls 
          enablePan={false} 
          maxPolarAngle={Math.PI * 0.8}
          minDistance={5}
          maxDistance={15}
          enableDamping
          dampingFactor={0.05}
        />
        
        {qualityConfig.postProcessing && <ArtisticPostProcessing />}
      </Canvas>
      
      {/* Performance Debug Panel */}
      <PerformanceDebugPanel />
      
      
      

      {/* Top Control Buttons */}
      <div style={{
        position: 'fixed',
        top: '20px',
        right: '20px',
        display: 'flex',
        gap: '12px',
        zIndex: 1000
      }}>
        {/* Theme Selector Button */}
        <button
          onClick={() => setShowThemeSelector(true)}
          style={{
            background: `linear-gradient(135deg, ${themeConfig.colors.primary}, ${themeConfig.colors.secondary})`,
            border: 'none',
            borderRadius: '50px',
            padding: '12px 16px',
            color: 'white',
            fontSize: '12px',
            fontWeight: '500',
            cursor: 'pointer',
            boxShadow: `0 4px 12px ${themeConfig.colors.primary}40`,
            transition: 'all 0.3s ease',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.05)'
            e.currentTarget.style.boxShadow = `0 6px 16px ${themeConfig.colors.primary}60`
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)'
            e.currentTarget.style.boxShadow = `0 4px 12px ${themeConfig.colors.primary}40`
          }}
        >
          🎨 <span>{themeConfig.name}</span>
        </button>

        {/* Export Button */}
        <button
          onClick={() => setShowExportPanel(true)}
          style={{
            background: 'linear-gradient(135deg, #10b981, #059669)',
            border: 'none',
            borderRadius: '50px',
            padding: '12px 16px',
            color: 'white',
            fontSize: '12px',
            fontWeight: '500',
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(16, 185, 129, 0.4)',
            transition: 'all 0.3s ease',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.05)'
            e.currentTarget.style.boxShadow = '0 6px 16px rgba(16, 185, 129, 0.6)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)'
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(16, 185, 129, 0.4)'
          }}
        >
          📱 Export
        </button>
      </div>

      {/* Theme Selector Modal */}
      <ArtisticThemeSelector
        isVisible={showThemeSelector}
        onClose={() => setShowThemeSelector(false)}
      />

      {/* Export Panel Modal */}
      <ArtisticExportPanel
        isVisible={showExportPanel}
        onClose={() => setShowExportPanel(false)}
      />

      {/* AI Music Panel */}
      <AIMusicPanel 
        isVisible={showAIPanel}
        onToggle={() => setShowAIPanel(false)}
      />
    </div>
  )
}
