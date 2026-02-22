'use client'
import React, { useMemo, useState, useCallback } from 'react'
import { Canvas } from '@react-three/fiber'
import { AdaptiveDpr } from '@react-three/drei'
import * as THREE from 'three'
import { QUALITY_PROFILES } from '@/lib/quality'
import { usePerformanceSettings } from '@/store/usePerformanceSettings'
import { WebGLFallbackRenderer } from '@/components/WebGLFallbackRenderer'
import { logger } from '@/lib/logger'

interface SceneManagerProps {
  children: React.ReactNode
}

/**
 * SceneManager handles Three.js canvas setup and configuration with error recovery.
 * Responsible for:
 * - Canvas initialization with performance-based settings
 * - Quality profile integration
 * - Scene-level configuration (tone mapping, color space, etc.)
 * - WebGL context recovery and fallback rendering
 */
const SceneManager = React.memo<SceneManagerProps>(({ children }) => {
  const perfLevel = usePerformanceSettings((s) => s.level)
  const profile = QUALITY_PROFILES[perfLevel]
  const [canvasError, setCanvasError] = useState<Error | null>(null)
  // Temporarily keep recovery logic as a stable no-op while fallback renderer matures.
  const webglRecovery = useMemo(() => ({
    contextLost: false,
    canRecover: false,
    handleContextLoss: () => {},
    resetState: () => {},
    attemptRecovery: async () => false,
  }), [])

  const handleCanvasCreated = useCallback((state: any) => {
    try {
      console.log('[SceneManager] ✅ Canvas created successfully')
      logger.info('Three.js canvas created successfully', {
        renderer: state.gl.capabilities?.renderer || 'Unknown',
        vendor: state.gl.capabilities?.vendor || 'Unknown'
      })
      setCanvasError(null)
      webglRecovery.resetState()
    } catch (error) {
      console.error('[SceneManager] ❌ Canvas creation error:', error)
      logger.error('Canvas creation error:', error)
      setCanvasError(error as Error)
    }
  }, [webglRecovery])

  const handleCanvasError = useCallback((error: Error) => {
    console.error('[SceneManager] ❌ Canvas error occurred:', error.message, error.stack)
    logger.error('Canvas error occurred:', error)
    setCanvasError(error)
    webglRecovery.handleContextLoss()
  }, [webglRecovery])

  const handleRetryCanvas = useCallback(async () => {
    setCanvasError(null)
    const recovered = await webglRecovery.attemptRecovery()
    if (!recovered) {
      logger.warn('Canvas recovery failed, maintaining fallback')
    }
  }, [webglRecovery])

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
    dpr: profile.dpr as [number, number],
    onCreated: handleCanvasCreated,
    onError: handleCanvasError
  }), [profile, perfLevel, handleCanvasCreated, handleCanvasError])

  // Show fallback if WebGL is unavailable or context is lost
  if (canvasError || webglRecovery.contextLost) {
    console.warn('[SceneManager] 🔄 Showing WebGL fallback', {
      hasCanvasError: !!canvasError,
      errorMessage: canvasError?.message,
      contextLost: webglRecovery.contextLost,
      canRecover: webglRecovery.canRecover
    })
    return (
      <WebGLFallbackRenderer
        message={canvasError ? 'WebGL encountered an error' : 'WebGL context was lost'}
        showRetry={webglRecovery.canRecover}
        onRetry={handleRetryCanvas}
      />
    )
  }

  console.log('[SceneManager] 🎨 Attempting to render Canvas component')

  try {
    return (
      <Canvas
        {...canvasSettings}
        style={{ width: '100%', height: '100%', display: 'block' }}
      >
        <AdaptiveDpr pixelated />
        <color attach="background" args={['#000011']} />
        <fog attach="fog" args={['#000033', 20, 60]} />
        {children}
      </Canvas>
    )
  } catch (error) {
    console.error('[SceneManager] ❌ Canvas render error:', error)
    logger.error('Canvas render error:', error)
    return (
      <WebGLFallbackRenderer
        message="Failed to initialize WebGL"
        showRetry={true}
        onRetry={() => window.location.reload()}
      />
    )
  }
})

SceneManager.displayName = 'SceneManager'

export default SceneManager
