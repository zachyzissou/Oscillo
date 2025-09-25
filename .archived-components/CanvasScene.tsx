'use client'
import React, { Suspense } from 'react'
import { Canvas, useThree } from '@react-three/fiber'
import { PerspectiveCamera, AdaptiveDpr } from '@react-three/drei'
import * as THREE from 'three'
import MusicalObject from './MusicalObject'
import PlusButton3D from './PlusButton3D'
import AudioReactiveShaderBackground from './AudioReactiveShaderBackground'
import SceneLights from './SceneLights'
import BottomDrawer from './BottomDrawer'
import ModernStartOverlay from './ui/ModernStartOverlay'
import { usePerformanceSettings } from '../store/usePerformanceSettings'
import { QUALITY_PROFILES, detectInitialQuality } from '@/lib/quality'

function ResizeHandler() {
  const { camera, gl, viewport } = useThree()
  React.useEffect(() => {
    const onResize = () => {
      const w = window.innerWidth
      const h = window.innerHeight
      
      // Ensure minimum dimensions and handle edge cases
      const minWidth = Math.max(w, 320)
      const minHeight = Math.max(h, 240)
      
      // Update camera aspect ratio
      if (camera instanceof THREE.PerspectiveCamera) {
        camera.aspect = minWidth / minHeight
        camera.updateProjectionMatrix()
      }
      
      // Force renderer size update
      gl.setSize(minWidth, minHeight, true)
      gl.setPixelRatio(Math.min(window.devicePixelRatio, 2))
      
      // Ensure canvas element has proper size
      const canvas = gl.domElement
      if (canvas) {
        canvas.style.width = '100%'
        canvas.style.height = '100%'
        canvas.style.display = 'block'
      }
    }
    
    // Delay initial resize to ensure DOM is ready
    const timeoutId = setTimeout(onResize, 100)
    
    window.addEventListener('resize', onResize, { passive: true })
    return () => {
      clearTimeout(timeoutId)
      window.removeEventListener('resize', onResize)
    }
  }, [camera, gl, viewport])
  return null
}

export default function CanvasScene() {
  const rendererRef = React.useRef<THREE.WebGLRenderer | null>(null)
  const contextLostRef = React.useRef(false)
  const [webglError, setWebglError] = React.useState<string | null>(null)
  const [isInitializing, setIsInitializing] = React.useState(true) // RESTORE INITIALIZATION
  const setPerf = usePerformanceSettings((s) => s.setLevel)
  const perfLevel = usePerformanceSettings((s) => s.level)
  const profile = QUALITY_PROFILES[perfLevel] ?? QUALITY_PROFILES.medium
  
  React.useEffect(() => {
    let cancelled = false

    const initializeGPU = async () => {
      try {
        setIsInitializing(true)
        setWebglError(null)

        const level = await detectInitialQuality()
        if (!cancelled) {
          setPerf(level)
        }
      } catch (error) {
        console.error('GPU initialization failed:', error)
        if (!cancelled) {
          setPerf('medium')
          setWebglError(`WebGL initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
        }
      } finally {
        if (!cancelled) {
          setIsInitializing(false)
        }
      }
    }

    initializeGPU()

    return () => {
      cancelled = true
    }
  }, [setPerf])

  const canvasProps = React.useMemo(() => {
    // Enhanced Safari compatibility
    const isSafari = typeof navigator !== 'undefined' && /^((?!chrome|android).)*safari/i.test(navigator.userAgent)
    const isWebKit = typeof navigator !== 'undefined' && /webkit/i.test(navigator.userAgent) && !/chrome/i.test(navigator.userAgent)
    
    // Don't render if WebGL failed
    if (webglError && !isInitializing) {
      return null
    }
    
    return {
      className: "absolute inset-0",
      shadows: profile.shadows && !contextLostRef.current && !isSafari,
      gl: rendererRef.current ?? {
        antialias: profile.postprocessing && !isSafari,
        alpha: true,
        powerPreference: (perfLevel === 'high' && !isWebKit) ? 'high-performance' as const : 'default' as const,
        failIfMajorPerformanceCaveat: false,
        preserveDrawingBuffer: isSafari, // Safari sometimes needs this
        stencil: false,
        depth: true,
        // Safari-specific WebGL context attributes
        ...(isSafari && {
          premultipliedAlpha: false,
          desynchronized: false,
        }),
      },
      camera: { fov: 75, position: [0, 0, 10] as [number, number, number] },
      style: { width: '100vw', height: '100vh' },
      resize: { scroll: false, debounce: { scroll: 0, resize: 0 } },
      dpr: profile.dpr,
      performance: {
        min: 0.5,
        max: profile.postprocessing && !isSafari ? 1 : 0.8,
        debounce: 200,
      },
      frameloop: contextLostRef.current ? 'never' as const : 'always' as const,
      // Enhanced canvas creation with error handling
      onCreated: ({ gl }: { gl: any; scene: any; camera: any }) => {
        // Immediate canvas setup for test compatibility
        gl.domElement.setAttribute('data-testid', 'webgl-canvas')
        
        // Set up additional WebGL error monitoring
        const canvas = gl.domElement
        const handleWebGLError = (event: Event) => {
          console.error('WebGL error detected:', event)
          setWebglError('WebGL rendering error detected')
        }
        
        canvas.addEventListener('webglcontextlost', handleWebGLError)
        
        // Canvas created and ready for rendering
      },
    }
  }, [perfLevel, profile, webglError, isInitializing]) // Add error state dependencies

  // Show error state if WebGL failed
  if (webglError && !isInitializing) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-b from-red-900/20 to-black">
        <div className="text-center p-8 bg-black/50 backdrop-blur-sm rounded-xl border border-red-500/30">
          <h3 className="text-red-400 text-xl font-bold mb-4">WebGL Error</h3>
          <p className="text-white/80 mb-6">{webglError}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="bg-gradient-to-r from-red-500 to-pink-500 text-white px-6 py-3 rounded-lg font-medium hover:shadow-lg transition-all duration-300"
          >
            Retry
          </button>
          <p className="text-white/60 text-sm mt-4">
            This application requires WebGL support. Please update your browser or enable hardware acceleration.
          </p>
        </div>
      </div>
    )
  }

  // Show loading state during initialization
  if (isInitializing) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-b from-black via-gray-900 to-black">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin mb-4" />
          <p className="text-white font-medium">Initializing WebGL...</p>
        </div>
      </div>
    )
  }

  if (!canvasProps) {
    return null
  }

  return (
    <div className="fixed inset-0 w-full h-full" style={{ zIndex: 0 }}>
      <Canvas {...canvasProps}>
        <color attach="background" args={['#0a0a0f']} />
        <AdaptiveDpr pixelated />
        
        <Suspense fallback={null}>
          <SceneLights />
          <MusicalObject />
          <PlusButton3D />
          <AudioReactiveShaderBackground
            bassLevel={0}
            midLevel={0}
            highLevel={0}
            activeShader="metaball"
            glitchIntensity={0.5}
            enabled={profile.postprocessing}
            audioSensitivity={{ bass: 1, mid: 1, high: 1 }}
          />
          {/* Post-processing temporarily disabled for stability */}
        </Suspense>
      </Canvas>
      <div className="pointer-events-none absolute top-4 left-4 text-xs font-mono bg-black/60 text-white px-3 py-2 rounded-md border border-white/10 shadow-lg">
        <div>Performance: {perfLevel.toUpperCase()}</div>
        <div className="text-white/70">
          DPR {profile.dpr[0]}–{profile.dpr[1]} · Shadows {profile.shadows ? 'ON' : 'OFF'}
        </div>
      </div>
      <BottomDrawer />
      <ModernStartOverlay />
    </div>
  )
}
