'use client'
import { useState, useEffect, useCallback, useRef } from 'react'
import { logger } from '@/lib/logger'

export interface WebGLRecoveryState {
  contextLost: boolean
  contextRestored: boolean
  recoveryAttempts: number
  canRecover: boolean
  lastError?: Error
}

export interface WebGLRecoveryActions {
  handleContextLoss: () => void
  handleContextRestoration: () => void
  attemptRecovery: () => Promise<boolean>
  resetState: () => void
}

const MAX_RECOVERY_ATTEMPTS = 3
const RECOVERY_DELAY = 1000

/**
 * Custom hook for WebGL context recovery and error management.
 * Provides state tracking and recovery mechanisms for WebGL context loss.
 */
export const useWebGLRecovery = (): WebGLRecoveryState & WebGLRecoveryActions => {
  const [state, setState] = useState<WebGLRecoveryState>({
    contextLost: false,
    contextRestored: false,
    recoveryAttempts: 0,
    canRecover: true
  })

  const recoveryTimeoutRef = useRef<NodeJS.Timeout>()

  const handleContextLoss = useCallback(() => {
    logger.warn('WebGL context lost detected')
    setState(prev => ({
      ...prev,
      contextLost: true,
      contextRestored: false,
      canRecover: prev.recoveryAttempts < MAX_RECOVERY_ATTEMPTS
    }))
  }, [])

  const handleContextRestoration = useCallback(() => {
    logger.info('WebGL context restored')
    setState(prev => ({
      ...prev,
      contextLost: false,
      contextRestored: true,
      recoveryAttempts: 0,
      canRecover: true,
      lastError: undefined
    }))
  }, [])

  const attemptRecovery = useCallback(async (): Promise<boolean> => {
    return new Promise((resolve) => {
      setState(prev => {
        const newAttempts = prev.recoveryAttempts + 1
        const canStillRecover = newAttempts < MAX_RECOVERY_ATTEMPTS

        logger.info(`WebGL recovery attempt ${newAttempts}/${MAX_RECOVERY_ATTEMPTS}`)

        return {
          ...prev,
          recoveryAttempts: newAttempts,
          canRecover: canStillRecover
        }
      })

      // Wait for recovery delay before resolving
      recoveryTimeoutRef.current = setTimeout(() => {
        const success = !state.contextLost || state.contextRestored

        if (success) {
          logger.info('WebGL recovery successful')
        } else {
          logger.error('WebGL recovery failed')
        }

        resolve(success)
      }, RECOVERY_DELAY)
    })
  }, [state.contextLost, state.contextRestored])

  const resetState = useCallback(() => {
    logger.info('WebGL recovery state reset')
    setState({
      contextLost: false,
      contextRestored: false,
      recoveryAttempts: 0,
      canRecover: true,
      lastError: undefined
    })
  }, [])

  // Setup WebGL context event listeners
  // DISABLED: These event listeners were causing false positive context loss detections
  // during normal Canvas creation. The Canvas component has its own error handling.
  // We can re-enable if we need explicit context recovery in the future.
  useEffect(() => {
    // Cleanup timeout on unmount
    return () => {
      if (recoveryTimeoutRef.current) {
        clearTimeout(recoveryTimeoutRef.current)
      }
    }
  }, [])

  return {
    ...state,
    handleContextLoss,
    handleContextRestoration,
    attemptRecovery,
    resetState
  }
}

/**
 * Hook for monitoring WebGL performance and capabilities.
 * Provides information about the current WebGL context state.
 */
export const useWebGLCapabilities = () => {
  const [capabilities, setCapabilities] = useState({
    webglSupported: true,
    maxTextureSize: 0,
    maxRenderBufferSize: 0,
    extensions: [] as string[],
    renderer: '',
    vendor: ''
  })

  useEffect(() => {
    if (typeof window === 'undefined') return

    const canvas = document.createElement('canvas')
    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl')

    if (!gl) {
      setCapabilities(prev => ({ ...prev, webglSupported: false }))
      return
    }

    try {
      const debugInfo = gl.getExtension('WEBGL_debug_renderer_info')
      const supportedExtensions = gl.getSupportedExtensions() || []

      setCapabilities({
        webglSupported: true,
        maxTextureSize: gl.getParameter(gl.MAX_TEXTURE_SIZE),
        maxRenderBufferSize: gl.getParameter(gl.MAX_RENDERBUFFER_SIZE),
        extensions: supportedExtensions,
        renderer: debugInfo ? gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) : 'Unknown',
        vendor: debugInfo ? gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) : 'Unknown'
      })

      logger.info('WebGL capabilities detected', {
        maxTextureSize: gl.getParameter(gl.MAX_TEXTURE_SIZE),
        extensions: supportedExtensions.length
      })
    } catch (error) {
      logger.error('Failed to detect WebGL capabilities', error)
      setCapabilities(prev => ({ ...prev, webglSupported: false }))
    }

    // Clean up
    canvas.remove()
  }, [])

  return capabilities
}