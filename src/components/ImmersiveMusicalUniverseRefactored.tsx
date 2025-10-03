'use client'
import React, { useEffect, Suspense } from 'react'
import { useAudioEngine } from '../store/useAudioEngine'
import { performanceMonitor } from '@/lib/performance-monitor'
import WebGLErrorBoundary from '@/components/WebGLErrorBoundary'
import EnhancedErrorBoundary from '@/components/EnhancedErrorBoundary'

// Import refactored components
import SceneManager from '@/components/scene/SceneManager'
import LightingController from '@/components/scene/LightingController'
import CameraController from '@/components/scene/CameraController'
import MusicalGrid from '@/components/scene/MusicalGrid'
import EnvironmentManager from '@/components/scene/EnvironmentManager'
import VisualEffectsManager from '@/components/visual/VisualEffectsManager'
import OverlayManager from '@/components/managers/OverlayManager'

// Tactical UI components
import { TacticalHUDContainer } from '@/components/ui/tactical/TacticalHUD'

// Legacy components (will be refactored later)
import QualityManager from '@/components/visual/QualityManager'
import AudioDebugPanel from './AudioDebugPanel'
import PluginLoader from '@/plugins/PluginLoader'
import { ErrorBoundaryTestUtils, FallbackTester } from '@/components/scene/ErrorBoundaryTestUtils'

/**
 * Scene content component that wraps all 3D elements with error boundaries.
 * Each major component group is wrapped for granular error recovery.
 */
const SceneContent = React.memo(() => {
  return (
    <>
      <WebGLErrorBoundary
        onError={(error, errorInfo) => {
          performanceMonitor.logError('LightingController error', { error, errorInfo })
        }}
      >
        <LightingController />
      </WebGLErrorBoundary>

      <WebGLErrorBoundary
        onError={(error, errorInfo) => {
          performanceMonitor.logError('EnvironmentManager error', { error, errorInfo })
        }}
      >
        <EnvironmentManager />
      </WebGLErrorBoundary>

      <WebGLErrorBoundary
        onError={(error, errorInfo) => {
          performanceMonitor.logError('MusicalGrid error', { error, errorInfo })
        }}
      >
        <MusicalGrid />
      </WebGLErrorBoundary>

      <WebGLErrorBoundary
        onError={(error, errorInfo) => {
          performanceMonitor.logError('CameraController error', { error, errorInfo })
        }}
      >
        <CameraController />
      </WebGLErrorBoundary>

      <WebGLErrorBoundary
        onError={(error, errorInfo) => {
          performanceMonitor.logError('VisualEffectsManager error', { error, errorInfo })
        }}
      >
        <VisualEffectsManager />
      </WebGLErrorBoundary>
    </>
  )
})

SceneContent.displayName = 'SceneContent'

/**
 * Refactored ImmersiveMusicalUniverse component.
 * Now uses composition of smaller, focused components for better maintainability.
 *
 * Architecture:
 * - SceneManager: Handles Canvas setup and performance configuration
 * - SceneContent: Wraps all 3D scene elements with Suspense boundary
 * - OverlayManager: Coordinates all UI overlays and interactions
 * - Legacy components: Maintained during transition phase
 */
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

  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      position: 'fixed',
      top: 0,
      left: 0,
      backgroundColor: '#000011',
      zIndex: 1
    }}>
      {/* Tactical HUD Wrapper */}
      <TacticalHUDContainer>
        {hasUserInteracted ? (
          <WebGLErrorBoundary
            onError={(error, errorInfo) => {
              performanceMonitor.logError('SceneManager error', { error, errorInfo })
            }}
          >
            <SceneManager>
              <Suspense fallback={null}>
                <SceneContent />
              </Suspense>
            </SceneManager>
          </WebGLErrorBoundary>
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
      </TacticalHUDContainer>

      {/* Overlay Management */}
      <OverlayManager />

      {/* Legacy Components - To be refactored in future phases */}
      <EnhancedErrorBoundary context="QualityManager">
        <QualityManager />
      </EnhancedErrorBoundary>
      <EnhancedErrorBoundary context="PluginLoader">
        <PluginLoader />
      </EnhancedErrorBoundary>
      <EnhancedErrorBoundary context="AudioDebugPanel">
        <AudioDebugPanel />
      </EnhancedErrorBoundary>

      {/* Development-only error boundary testing utilities */}
      {process.env.NODE_ENV === 'development' && (
        <>
          <ErrorBoundaryTestUtils />
          <FallbackTester />
        </>
      )}
    </div>
  )
}
