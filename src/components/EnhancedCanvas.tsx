'use client'
import React, { Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import { Physics } from '@react-three/rapier'
import { PerspectiveCamera, AdaptiveDpr, Stars, KeyboardControls } from '@react-three/drei'
import { usePerformanceSettings } from '../store/usePerformanceSettings'
import { useThemeSettings } from '../store/useThemeSettings'
import { applyThemeTokens } from '@/lib/theme-tokens'

// Enhanced components
import SceneLights from './SceneLights'
import AnimatedGradient from './AnimatedGradient'
import MusicalObject from './MusicalObject'
import PlusButton3D from './PlusButton3D'
import XRButtons from './XRButtons'
import AudioReactivePostProcess from './AudioReactivePostProcess'
import PostProcessErrorBoundary from './PostProcessErrorBoundary'

// New visual system components
import FloatingPanelManager from './ui/FloatingPanelManager'
import ThemeCustomizer from './ui/ThemeCustomizer'
import { InteractionFeedback } from './ui/InteractionFeedback'
import { AccessibilityProvider, AudioAccessibility } from './ui/AccessibilityEnhancements'
import AdaptiveQualityManager, { PerformanceMonitor } from './visual/AdaptiveQualityManager'
import CinematicPostProcessing from './visual/CinematicPostProcessing'
import ParticleManager from './visual/ParticleManager'
import { useInteractionFeedback, useHapticFeedback } from '../hooks/useInteractionFeedback'

const keyboardMap = [
  { name: 'forward', keys: ['ArrowUp', 'KeyW'] },
  { name: 'backward', keys: ['ArrowDown', 'KeyS'] },
  { name: 'left', keys: ['ArrowLeft', 'KeyA'] },
  { name: 'right', keys: ['ArrowRight', 'KeyD'] },
  { name: 'jump', keys: ['Space'] },
  { name: 'toggleUI', keys: ['KeyH'] },
  { name: 'screenshot', keys: ['KeyP'] }
]

function SceneContents() {
  const perfLevel = usePerformanceSettings(s => s.level)
  const { getCurrentConfig } = useThemeSettings()
  const { feedbacks } = useInteractionFeedback()
  
  const themeConfig = getCurrentConfig()

  React.useEffect(() => {
    applyThemeTokens(themeConfig)
  }, [themeConfig])

  return (
    <AdaptiveQualityManager>
      <color attach="background" args={[themeConfig.colors.background]} />
      
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
      
      <Physics>
        <Suspense fallback={null}>
          <MusicalObject />
        </Suspense>
        
        <PlusButton3D />
        <XRButtons />
        
        <Suspense fallback={null}>
          <FloatingPanelManager />
        </Suspense>
        
        <Suspense fallback={null}>
          <ThemeCustomizer />
        </Suspense>
      </Physics>
      
      <Suspense fallback={null}>
        <ParticleManager 
          theme={themeConfig.id}
          maxParticles={perfLevel === 'high' ? 50000 : perfLevel === 'medium' ? 25000 : 10000}
        />
      </Suspense>
      
      {feedbacks.map(feedback => (
        <InteractionFeedback
          key={feedback.id}
          position={feedback.position}
          type={feedback.type}
          color={feedback.color}
          duration={feedback.duration}
        />
      ))}
      
      {perfLevel !== 'low' && (
        <PostProcessErrorBoundary>
          <CinematicPostProcessing
            theme={themeConfig.id}
            intensity={themeConfig.effects.bloomIntensity}
          />
        </PostProcessErrorBoundary>
      )}
      
      <PerformanceMonitor />
    </AdaptiveQualityManager>
  )
}

export default function EnhancedCanvas() {
  const perfLevel = usePerformanceSettings(s => s.level)
  const [contextLost, setContextLost] = React.useState(false)
  const [isInitialized, setIsInitialized] = React.useState(true)

  const canvasProps = React.useMemo(() => {
    const hasWindow = typeof window !== 'undefined'
    const userAgent = hasWindow && typeof window.navigator !== 'undefined'
      ? window.navigator.userAgent
      : ''
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent)
    const devicePixelRatio = hasWindow && typeof window.devicePixelRatio === 'number'
      ? window.devicePixelRatio
      : 1

    return {
      className: "absolute inset-0",
      shadows: perfLevel !== 'low' && !contextLost,
      gl: {
        antialias: perfLevel !== 'low' && hasWindow && !isMobile,
        alpha: true,
        powerPreference: perfLevel === 'high' ? 'high-performance' as const : 'default' as const,
        failIfMajorPerformanceCaveat: false,
        preserveDrawingBuffer: false,
        stencil: false,
        depth: true
      },
      camera: false,
      style: { width: '100vw', height: '100vh' },
      dpr: Math.min(devicePixelRatio || 1, perfLevel === 'high' ? 2 : 1),
      performance: {
        min: 0.5,
        max: perfLevel === 'high' ? 1 : 0.8,
        debounce: 200,
      },
      frameloop: contextLost ? 'never' as const : 'always' as const,
      onCreated: ({ gl }: { gl: any }) => {
        gl.domElement.setAttribute('data-testid', 'webgl-canvas')
        setIsInitialized(true)
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
            onClick={() => {
              if (typeof window !== 'undefined') {
                window.location.reload()
              }
            }} 
            className="bg-gradient-to-r from-red-500 to-pink-500 text-white px-6 py-3 rounded-lg font-medium hover:shadow-lg transition-all duration-300"
          >
            Reload Application
          </button>
        </div>
      </div>
    )
  }

  return (
    <AccessibilityProvider>
      <div className="fixed inset-0 w-full h-full" style={{ zIndex: 0 }}>
        <KeyboardControls map={keyboardMap}>
          <Canvas {...canvasProps}>
            <AdaptiveDpr pixelated />
            <SceneContents />
          </Canvas>
        </KeyboardControls>
        
        <AudioAccessibility />
        
        {!isInitialized && (
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-b from-black via-gray-900 to-black z-50">
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin mb-4" />
              <p className="text-white font-medium">Loading Enhanced Experience...</p>
              <p className="text-white/60 text-sm mt-2">Optimizing for your device</p>
            </div>
          </div>
        )}
      </div>
    </AccessibilityProvider>
  )
}
