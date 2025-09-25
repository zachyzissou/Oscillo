'use client'
import React, { Suspense, useRef, useState, useEffect } from 'react'
import { Canvas, useThree } from '@react-three/fiber'
import { Physics } from '@react-three/rapier'
import { 
  PerspectiveCamera, 
  OrbitControls, 
  Stats,
  Preload,
  AdaptiveDpr,
  AdaptiveEvents,
  PerformanceMonitor
} from '@react-three/drei'
import * as THREE from 'three'
import { webGPURenderer } from '@/lib/webgpu-enhanced'
import { ProceduralShape, NoteParticles } from './ProceduralMusicalShapes'
import EnhancedSceneLights from './EnhancedSceneLights'
import AdvancedShaderBackground from './AdvancedShaderBackground'
import EnhancedPostProcessing from './EnhancedPostProcessing'
import { useObjects } from '@/store/useObjects'
import { useSelectedShape } from '@/store/useSelectedShape'
import { usePerformanceSettings } from '@/store/usePerformanceSettings'
import { triggerSound } from '@/lib/soundTriggers'
import gsap from 'gsap'

// Loading component
function LoadingScreen() {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-black">
      <div className="text-center">
        <div className="w-20 h-20 mb-4 relative">
          <div className="absolute inset-0 border-4 border-cyan-500/30 rounded-full animate-pulse" />
          <div className="absolute inset-0 border-4 border-t-cyan-500 rounded-full animate-spin" />
        </div>
        <p className="text-cyan-400 text-lg font-medium">Initializing Audio-Visual Engine...</p>
      </div>
    </div>
  )
}

// Main scene content
function SceneContent() {
  const objects = useObjects(s => s.objects)
  const addObject = useObjects(s => s.add)
  const selectShape = useSelectedShape(s => s.selectShape)
  const [particles, setParticles] = useState<Array<{ id: string; position: THREE.Vector3; color: THREE.Color }>>([])
  
  // Handle object interactions
  const handleObjectClick = async (obj: any) => {
    selectShape(obj.id)
    const success = await triggerSound(obj.type, obj.id)
    
    if (success) {
      // Spawn particles at object position
      const position = new THREE.Vector3(obj.position.x, obj.position.y, obj.position.z)
      const color = new THREE.Color(
        obj.type === 'note' ? 0x00ffff :
        obj.type === 'chord' ? 0xff00ff :
        obj.type === 'beat' ? 0xffff00 : 0x00ff00
      )
      
      setParticles(prev => [...prev, { id: `${obj.id}-${Date.now()}`, position, color }])
      
      // Remove particles after animation
      setTimeout(() => {
        setParticles(prev => prev.filter(p => p.id !== `${obj.id}-${Date.now()}`))
      }, 2000)
    }
  }

  // Add floating animation to shapes
  useEffect(() => {
    objects.forEach((obj, index) => {
      const delay = index * 0.1
      gsap.to(obj.position, {
        y: obj.position.y + 0.2,
        duration: 2 + Math.random(),
        ease: "sine.inOut",
        repeat: -1,
        yoyo: true,
        delay
      })
    })
  }, [objects])

  // Create initial objects in a circle
  useEffect(() => {
    if (objects.length === 0) {
      const shapes: Array<'sphere' | 'torus' | 'icosahedron' | 'octahedron'> = ['sphere', 'torus', 'icosahedron', 'octahedron']
      const types: Array<'note' | 'chord' | 'beat' | 'loop'> = ['note', 'chord', 'beat', 'loop']
      const notes = ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5']
      
      for (let i = 0; i < 8; i++) {
        const angle = (i / 8) * Math.PI * 2
        const radius = 5
        const x = Math.cos(angle) * radius
        const z = Math.sin(angle) * radius
        const y = Math.sin(i * 0.5) * 0.5
        
        addObject({
          type: types[i % types.length],
          position: { x, y, z },
          shapeType: shapes[i % shapes.length],
          noteValue: notes[i % notes.length],
          id: `initial-${i}`
        })
      }
    }
  }, [objects.length, addObject])

  return (
    <>
      {/* Background */}
      <AdvancedShaderBackground />
      
      {/* Lighting */}
      <EnhancedSceneLights />
      
      {/* Musical objects */}
      {objects.map(obj => (
        <ProceduralShape
          key={obj.id}
          id={obj.id}
          type={obj.shapeType || 'sphere'}
          position={[obj.position.x, obj.position.y, obj.position.z]}
          soundType={obj.type}
          noteValue={obj.noteValue}
          onClick={() => handleObjectClick(obj)}
        />
      ))}
      
      {/* Particle effects */}
      {particles.map(particle => (
        <NoteParticles
          key={particle.id}
          position={particle.position}
          color={particle.color}
        />
      ))}
      
      {/* Interactive floor */}
      <mesh 
        rotation={[-Math.PI / 2, 0, 0]} 
        position={[0, -3, 0]}
        receiveShadow
      >
        <planeGeometry args={[50, 50, 50, 50]} />
        <meshStandardMaterial 
          color="#111122"
          metalness={0.9}
          roughness={0.1}
          envMapIntensity={0.5}
        />
      </mesh>
    </>
  )
}

// Camera controller
function CameraController() {
  const { camera } = useThree()
  const controlsRef = useRef<any>(null)
  
  useEffect(() => {
    // Smooth camera introduction
    gsap.from(camera.position, {
      z: 30,
      y: 20,
      duration: 3,
      ease: "power3.out"
    })
  }, [camera])
  
  return (
    <OrbitControls
      ref={controlsRef}
      enableDamping
      dampingFactor={0.05}
      rotateSpeed={0.5}
      zoomSpeed={0.5}
      minDistance={5}
      maxDistance={30}
      maxPolarAngle={Math.PI / 2 + 0.1}
      makeDefault
    />
  )
}

export default function ModernCanvasScene() {
  const [dpr, setDpr] = useState(1.5)
  const [isInitialized, setIsInitialized] = useState(false)
  const perfLevel = usePerformanceSettings(s => s.level)
  const setPerfLevel = usePerformanceSettings(s => s.setLevel)
  
  // Initialize WebGPU renderer
  useEffect(() => {
    const initRenderer = async () => {
      try {
        const canvas = document.createElement('canvas')
        await webGPURenderer.initialize(canvas)
        setIsInitialized(true)
      } catch (error) {
        console.error('Renderer initialization failed:', error)
        setIsInitialized(true) // Continue with WebGL fallback
      }
    }
    initRenderer()
    
    return () => {
      webGPURenderer.dispose()
    }
  }, [])

  if (!isInitialized) {
    return <LoadingScreen />
  }

  return (
    <div className="fixed inset-0 bg-black">
      <Canvas
        shadows
        dpr={dpr}
        gl={{
          antialias: perfLevel !== 'low',
          toneMapping: THREE.ACESFilmicToneMapping,
          outputColorSpace: THREE.SRGBColorSpace,
          powerPreference: perfLevel === 'high' ? 'high-performance' : 'default',
        }}
        camera={{ position: [0, 5, 15], fov: 60 }}
      >
        {/* Performance monitoring */}
        <PerformanceMonitor
          onIncline={() => setDpr(2)}
          onDecline={() => setDpr(1)}
          flipflops={3}
          onFallback={() => setPerfLevel('low')}
        />
        
        {/* Adaptive quality */}
        <AdaptiveDpr pixelated />
        <AdaptiveEvents />
        
        {/* Camera controls */}
        <CameraController />
        
        {/* Main scene */}
        <Suspense fallback={null}>
          <Physics gravity={[0, -9.81, 0]}>
            <SceneContent />
          </Physics>
          
          {/* Post-processing */}
          {perfLevel !== 'low' && <EnhancedPostProcessing />}
        </Suspense>
        
        {/* Performance stats in development */}
        {process.env.NODE_ENV === 'development' && <Stats />}
        
        {/* Preload assets */}
        <Preload all />
      </Canvas>
    </div>
  )
}