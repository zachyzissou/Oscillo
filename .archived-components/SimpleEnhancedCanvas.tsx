'use client'
import React, { Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import { PerspectiveCamera, AdaptiveDpr, Stars } from '@react-three/drei'
import { usePerformanceSettings } from '../store/usePerformanceSettings'

// Core components
import SceneLights from './SceneLights'
import AnimatedGradient from './AnimatedGradient'
import MusicalObject from './MusicalObject'
import PlusButton3D from './PlusButton3D'
import AudioReactivePostProcess from './AudioReactivePostProcess'
import PostProcessErrorBoundary from './PostProcessErrorBoundary'

// Simplified floating panels
import FloatingPanelManager from './ui/FloatingPanelManager'

function SceneContents() {
  const perfLevel = usePerformanceSettings(s => s.level)

  return (
    <>
      <color attach="background" args={['#0a0a0f']} />
      
      {perfLevel !== 'low' && (
        <Stars 
          radius={100} 
          depth={50} 
          count={perfLevel === 'high' ? 2000 : 1000} 
          factor={4} 
          saturation={0} 
          fade 
        />
      )}
      
      <SceneLights />
      <AnimatedGradient />
      
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
      
      <Suspense fallback={null}>
        <FloatingPanelManager />
      </Suspense>
      
      {perfLevel !== 'low' && (
        <PostProcessErrorBoundary>
          <AudioReactivePostProcess 
            intensity={0.8}
            enableGlitch={perfLevel === 'high'}
            enableBloom={true}
            enableChromatic={perfLevel === 'high'}
            performanceLevel={perfLevel}
          />
        </PostProcessErrorBoundary>
      )}
    </>
  )
}

export default function SimpleEnhancedCanvas() {
  const perfLevel = usePerformanceSettings(s => s.level)
  const [contextLost, setContextLost] = React.useState(false)

  const canvasProps = React.useMemo(() => {
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    )

    return {
      className: "absolute inset-0",
      shadows: perfLevel !== 'low' && !contextLost,
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
      frameloop: contextLost ? 'never' as const : 'always' as const,
      onCreated: ({ gl }: { gl: any }) => {
        gl.domElement.setAttribute('data-testid', 'webgl-canvas')
      },
    }
  }, [perfLevel, contextLost])

  if (contextLost) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-b from-red-900/20 to-black">
        <div className="text-center p-8 bg-black/50 backdrop-blur-sm rounded-xl border border-red-500/30">
          <h3 className="text-red-400 text-xl font-bold mb-4">WebGL Context Lost</h3>
          <p className="text-white/80 mb-6">
            The 3D graphics context has been lost. This usually happens when the GPU is overloaded.
          </p>
          <button 
            onClick={() => window.location.reload()} 
            className="bg-gradient-to-r from-red-500 to-pink-500 text-white px-6 py-3 rounded-lg font-medium hover:shadow-lg transition-all duration-300"
          >
            Reload Application
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 w-full h-full" style={{ zIndex: 0 }}>
      <Canvas {...canvasProps}>
        <AdaptiveDpr pixelated />
        <SceneContents />
      </Canvas>
    </div>
  )
}