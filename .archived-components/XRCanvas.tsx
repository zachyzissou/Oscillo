'use client'
// src/components/XRCanvas.tsx
// XR-Ready Canvas with future WebXR integration
import React, { Suspense, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, Environment, ContactShadows } from '@react-three/drei'
import { usePerformanceSettings } from '../store/usePerformanceSettings'
import CanvasScene from './CanvasScene'
import ErrorBoundary from './ErrorBoundary'
import { logger } from '@/lib/logger'

interface XRCanvasProps {
  enableVR?: boolean
  enableAR?: boolean
  className?: string
}

export default function XRCanvas({ enableVR = true, enableAR = true, className = '' }: Readonly<XRCanvasProps>) {
  const { level } = usePerformanceSettings()
  const [xrSupported, setXRSupported] = useState(false)

  // Check XR support
  React.useEffect(() => {
    if (typeof navigator !== 'undefined' && 'xr' in navigator) {
      navigator.xr?.isSessionSupported('immersive-vr').then(setXRSupported).catch(() => setXRSupported(false))
    }
  }, [])

  const canvasProps = {
    shadows: level === 'high',
    camera: { 
      position: [0, 1.6, 5] as [number, number, number], 
      fov: 75,
      near: 0.1,
      far: 1000
    },
    gl: {
      antialias: level !== 'low',
      alpha: true,
      powerPreference: level === 'high' ? 'high-performance' as const : 'default' as const,
      stencil: false,
      depth: true
    },
    frameloop: 'demand' as const,
    className: `w-full h-full ${className}`
  }

  return (
    <ErrorBoundary>
      <div className="relative w-full h-full">
        {/* Future XR Controls - Currently preparing for WebXR integration */}
        {xrSupported && (
          <div className="absolute top-4 right-4 z-10 flex gap-2">
            {enableVR && (
              <button
                className="px-4 py-2 bg-black/80 border border-white/20 rounded-lg text-white cursor-pointer hover:bg-white/10 transition-colors"
                onClick={() => {
                  if (process.env.NODE_ENV === 'development') {
                    logger.info('VR mode - Coming soon!')
                  }
                }}
              >
                🥽 VR
              </button>
            )}
            {enableAR && (
              <button
                className="px-4 py-2 bg-black/80 border border-white/20 rounded-lg text-white cursor-pointer hover:bg-white/10 transition-colors"
                onClick={() => {
                  if (process.env.NODE_ENV === 'development') {
                    logger.info('AR mode - Coming soon!')
                  }
                }}
              >
                📱 AR
              </button>
            )}
          </div>
        )}

        <Canvas {...canvasProps}>
          <Suspense fallback={null}>
            {/* Enhanced scene with XR preparation */}
            <CanvasScene />
            
            {/* Environment and lighting optimized for XR */}
            {level !== 'low' && (
              <>
                <Environment preset="sunset" environmentIntensity={0.4} />
                <ContactShadows 
                  position={[0, -1, 0]} 
                  opacity={0.4} 
                  scale={10} 
                  blur={2} 
                  far={4} 
                />
              </>
            )}
            
            {/* Enhanced controls for better navigation */}
            <OrbitControls 
              enablePan={true}
              enableZoom={true}
              enableRotate={true}
              minDistance={2}
              maxDistance={20}
              target={[0, 0, 0]}
              dampingFactor={0.05}
              enableDamping={true}
            />
          </Suspense>
        </Canvas>
      </div>
    </ErrorBoundary>
  )
}
