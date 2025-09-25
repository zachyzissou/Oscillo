'use client'
import React, { Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import { PerspectiveCamera, AdaptiveDpr, Stars } from '@react-three/drei'
import * as THREE from 'three'
import { usePerformanceSettings } from '../store/usePerformanceSettings'

// Core working components
import SceneLights from './SceneLights'
import MusicalObject from './MusicalObject'
import PlusButton3D from './PlusButton3D'

function SceneContents() {
  const perfLevel = usePerformanceSettings(s => s.level)

  return (
    <>
      <color attach="background" args={['#0a0a0f']} />
      
      {perfLevel !== 'low' && (
        <Stars 
          radius={100} 
          depth={50} 
          count={1000} 
          factor={4} 
          saturation={0} 
          fade 
        />
      )}
      
      <SceneLights />
      
      <PerspectiveCamera 
        makeDefault 
        fov={75} 
        position={[0, 0, 10]} 
        near={0.1} 
        far={1000} 
      />
      
      <Suspense fallback={null}>
        <MusicalObject />
      </Suspense>
      
      <PlusButton3D />
      
      {/* Simple floating UI panel placeholder */}
      <mesh position={[3, 2, -2]}>
        <boxGeometry args={[1, 0.5, 0.1]} />
        <meshBasicMaterial color="#333" transparent opacity={0.8} />
      </mesh>
    </>
  )
}

export default function MinimalCanvas() {
  const perfLevel = usePerformanceSettings(s => s.level)

  const canvasProps = React.useMemo(() => {
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    )

    return {
      className: "absolute inset-0",
      shadows: perfLevel !== 'low',
      gl: {
        antialias: perfLevel !== 'low' && !isMobile,
        alpha: true,
        powerPreference: perfLevel === 'high' ? 'high-performance' as const : 'default' as const,
        failIfMajorPerformanceCaveat: false,
        preserveDrawingBuffer: false,
        stencil: false,
        depth: true
      },
      camera: false,
      style: { width: '100vw', height: '100vh' },
      dpr: Math.min(window.devicePixelRatio || 1, perfLevel === 'high' ? 2 : 1),
      performance: {
        min: 0.5,
        max: perfLevel === 'high' ? 1 : 0.8,
        debounce: 200,
      },
      onCreated: ({ gl }: { gl: any }) => {
        gl.domElement.setAttribute('data-testid', 'webgl-canvas')
      },
    }
  }, [perfLevel])

  return (
    <div className="fixed inset-0 w-full h-full" style={{ zIndex: 0 }}>
      <Canvas {...canvasProps}>
        <AdaptiveDpr pixelated />
        <SceneContents />
      </Canvas>
      
      {/* Simple UI overlay */}
      <div className="fixed top-4 right-4 z-50">
        <div className="bg-black/50 backdrop-blur-md rounded-lg p-3 border border-white/20 text-white">
          <div className="text-sm">Interactive Music 3D</div>
          <div className="text-xs opacity-60">Enhanced Edition</div>
        </div>
      </div>
    </div>
  )
}