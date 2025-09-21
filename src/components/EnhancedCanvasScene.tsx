'use client'
import React, { Suspense, useRef, useEffect, useState } from 'react'
import { Canvas, useThree, useFrame } from '@react-three/fiber'
import { PerspectiveCamera, AdaptiveDpr, OrbitControls } from '@react-three/drei'
import { Physics } from '@react-three/rapier'
import * as THREE from 'three'
import * as Tone from 'tone'
import { usePerformanceSettings } from '../store/usePerformanceSettings'
import { useAudioSettings } from '../store/useAudioSettings'
import { useShaderSettings } from '../store/useShaderSettings'
import { useObjects } from '../store/useObjects'
import { getAnalyserBands } from '../lib/analyser'
import PlusButton3D from './PlusButton3D'
import SingleMusicalObject from './SingleMusicalObject'
import { QUALITY_PROFILES } from '@/lib/quality'

// Enhanced Musical Object Component
function EnhancedMusicalObject({ 
  position, 
  color, 
  note, 
  type = 'synth',
  scale = 1,
  onInteraction,
  audioData 
}: {
  position: [number, number, number]
  color: number
  note: string
  type?: string
  scale?: number
  onInteraction?: (note: string) => void
  audioData?: { bass: number; mid: number; treble: number }
}) {
  const meshRef = useRef<THREE.Mesh>(null)
  const [synth] = useState(() => {
    const s = new Tone.Synth({
      oscillator: { type: 'triangle' },
      envelope: { attack: 0.02, decay: 0.2, sustain: 0.3, release: 1.2 }
    }).toDestination()
    s.volume.value = -12
    return s
  })
  
  const [hovered, setHovered] = useState(false)
  const [clicked, setClicked] = useState(false)

  // Audio-reactive scaling
  useFrame((state) => {
    if (meshRef.current && audioData) {
      const time = state.clock.getElapsedTime()
      
      // Base animation
      meshRef.current.rotation.x = time * 0.3
      meshRef.current.rotation.y = time * 0.2
      
      // Audio-reactive pulsing
      const audioScale = 1 + (audioData.bass + audioData.mid + audioData.treble) * 0.3
      const baseScale = clicked ? scale * 1.3 : scale
      meshRef.current.scale.setScalar(baseScale * audioScale)
      
      // Floating motion
      meshRef.current.position.y = position[1] + Math.sin(time * 2 + position[0]) * 0.5
    }
  })

  const handleClick = async () => {
    if (Tone.context.state !== 'running') {
      await Tone.start()
    }
    
    setClicked(true)
    synth.triggerAttackRelease(note, '8n')
    onInteraction?.(note)
    
    setTimeout(() => setClicked(false), 200)
  }

  return (
    <mesh
      ref={meshRef}
      position={position}
      onClick={handleClick}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
      castShadow
      receiveShadow
    >
      <boxGeometry args={[2, 2, 2]} />
      <meshStandardMaterial 
        color={hovered ? 0xffffff : color}
        emissive={color}
        emissiveIntensity={hovered ? 0.3 : 0.1}
        metalness={0.7}
        roughness={0.3}
        transparent
        opacity={0.9}
      />
    </mesh>
  )
}

// Enhanced Scene Lights with audio reactivity
function EnhancedSceneLights({ audioData }: { audioData?: { bass: number; mid: number; treble: number } }) {
  const light1Ref = useRef<THREE.PointLight>(null)
  const light2Ref = useRef<THREE.PointLight>(null)
  const light3Ref = useRef<THREE.PointLight>(null)

  useFrame((state) => {
    if (audioData && light1Ref.current && light2Ref.current && light3Ref.current) {
      const time = state.clock.getElapsedTime()
      
      // Audio-reactive lighting
      light1Ref.current.intensity = 1 + audioData.bass * 2
      light2Ref.current.intensity = 1 + audioData.mid * 2
      light3Ref.current.intensity = 1 + audioData.treble * 2
      
      // Moving lights
      light1Ref.current.position.x = Math.sin(time * 0.5) * 10
      light2Ref.current.position.z = Math.cos(time * 0.3) * 8
      light3Ref.current.position.y = 5 + Math.sin(time * 0.7) * 3
    }
  })

  return (
    <>
      <ambientLight intensity={0.4} />
      <directionalLight position={[10, 10, 5]} intensity={1} castShadow />
      <pointLight
        ref={light1Ref}
        position={[-8, 5, 0]}
        color={0xff0080}
        intensity={1}
        distance={20}
      />
      <pointLight
        ref={light2Ref}
        position={[8, 5, 0]}
        color={0x8000ff}
        intensity={1}
        distance={20}
      />
      <pointLight
        ref={light3Ref}
        position={[0, 8, -8]}
        color={0x00ff88}
        intensity={1}
        distance={20}
      />
    </>
  )
}

// Audio Analysis Hook - uses central analyser system
function useAudioAnalysis() {
  const [audioData, setAudioData] = useState({ bass: 0, mid: 0, treble: 0 })
  
  useEffect(() => {
    let animationId: number
    
    const updateAudioData = () => {
      try {
        const bands = getAnalyserBands()
        setAudioData({
          bass: bands.bass / 255,
          mid: bands.mid / 255, 
          treble: bands.treble / 255
        })
      } catch (error) {
        // Keep previous values on error
      }
      
      animationId = requestAnimationFrame(updateAudioData)
    }
    
    updateAudioData()
    
    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId)
      }
    }
  }, [])
  
  return audioData
}

// Resize Handler
function ResizeHandler() {
  const { camera, gl, viewport } = useThree()
  
  useEffect(() => {
    const onResize = () => {
      const w = window.innerWidth
      const h = window.innerHeight
      
      if (camera instanceof THREE.PerspectiveCamera) {
        camera.aspect = w / h
        camera.updateProjectionMatrix()
      }
      
      gl.setSize(w, h, true)
      gl.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    }
    
    window.addEventListener('resize', onResize, { passive: true })
    return () => window.removeEventListener('resize', onResize)
  }, [camera, gl, viewport])
  
  return null
}

// Main Enhanced Canvas Scene
export default function EnhancedCanvasScene() {
  const [webglError, setWebglError] = useState<string | null>(null)
  const [isInitializing, setIsInitializing] = useState(false) // Changed to false for immediate render
  const perfLevel = usePerformanceSettings((s) => s.level)
  const volume = useAudioSettings((s) => s.volume)
  const bassSensitivity = useShaderSettings((s) => s.bassSensitivity)
  const profile = QUALITY_PROFILES[perfLevel] ?? QUALITY_PROFILES.medium
  
  const audioData = useAudioAnalysis()
  const objects = useObjects((s) => s.objects)

  // Initialize objects from storage on mount
  useEffect(() => {
    const { loadObjectsFromStorage } = require('../store/useObjects')
    loadObjectsFromStorage()
  }, [])

  const canvasProps = React.useMemo(() => {
    return {
      className: "absolute inset-0",
      shadows: profile.shadows,
      gl: {
        antialias: profile.postprocessing,
        alpha: false,
        powerPreference: 'high-performance' as const,
        failIfMajorPerformanceCaveat: false,
      },
      camera: { fov: 75, position: [0, 2, 15] as [number, number, number] },
      style: { width: '100vw', height: '100vh' },
      dpr: profile.dpr,
      onCreated: ({ gl }: { gl: any }) => {
        gl.domElement.setAttribute('data-testid', 'webgl-canvas')
        console.warn('Three.js Canvas created successfully')
      },
    }
  }, [profile])

  // Always render the canvas - remove blocking conditions

  return (
    <div className="fixed inset-0 w-full h-full" style={{ zIndex: 0 }}>
      <Canvas {...canvasProps}>
        <color attach="background" args={['#1a1a2e']} />
        <AdaptiveDpr pixelated />
        
        <ResizeHandler />
        <PerspectiveCamera makeDefault fov={75} position={[0, 2, 15]} near={0.1} far={1000} />
        <OrbitControls 
          enableDamping 
          dampingFactor={0.05}
          minDistance={3}
          maxDistance={25}
          maxPolarAngle={Math.PI * 0.8}
        />
        
        <EnhancedSceneLights audioData={audioData} />
        
        <Physics>
          <Suspense fallback={null}>
            {/* Interactive Plus Button for spawning objects */}
            <PlusButton3D />
            
            {/* Always visible test cubes to ensure scene is working */}
            <mesh position={[-4, 0, 0]}>
              <boxGeometry args={[1, 1, 1]} />
              <meshStandardMaterial color="#ff4444" />
            </mesh>
            <mesh position={[0, 0, 0]}>
              <boxGeometry args={[1, 1, 1]} />
              <meshStandardMaterial color="#44ff44" />
            </mesh>
            <mesh position={[4, 0, 0]}>
              <boxGeometry args={[1, 1, 1]} />
              <meshStandardMaterial color="#4444ff" />
            </mesh>
            
            {/* Dynamic Musical Objects from store */}
            {objects.map((obj) => (
              <SingleMusicalObject
                key={obj.id}
                id={obj.id}
                type={obj.type}
                position={obj.position}
              />
            ))}
          </Suspense>
        </Physics>
        
        {/* Ground plane */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -3, 0]} receiveShadow>
          <planeGeometry args={[50, 50]} />
          <meshStandardMaterial color={0x111111} roughness={0.8} metalness={0.2} />
        </mesh>
      </Canvas>
      
      {/* Debug info */}
      <div className="absolute bottom-4 left-4 text-white text-sm font-mono bg-black/50 p-2 rounded">
        Audio: Bass {(audioData.bass * 100).toFixed(0)}% · Mid {(audioData.mid * 100).toFixed(0)}% · Treble {(audioData.treble * 100).toFixed(0)}%
        <br />
        Perf: {perfLevel.toUpperCase()} (DPR {profile.dpr[0]}–{profile.dpr[1]} · Shadows {profile.shadows ? 'ON' : 'OFF'})
        <br />
        Volume: {(volume * 100).toFixed(0)}%
      </div>
    </div>
  )
}
