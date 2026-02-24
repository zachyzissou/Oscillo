'use client'
import { useState, useCallback, useEffect } from 'react'
import { logger } from '@/lib/logger'

interface RetryOptions {
  maxAttempts?: number
  baseDelay?: number
  exponentialBackoff?: boolean
  onRetry?: (attempt: number, error: Error) => void
  onMaxAttemptsReached?: (error: Error) => void
}

interface RetryState {
  isLoading: boolean
  error: Error | null
  attempt: number
  canRetry: boolean
}

export function useRetryLogic<T>(
  asyncFn: () => Promise<T>,
  options: RetryOptions = {}
) {
  const {
    maxAttempts = 3,
    baseDelay = 1000,
    exponentialBackoff = true,
    onRetry,
    onMaxAttemptsReached
  } = options

  const [state, setState] = useState<RetryState>({
    isLoading: false,
    error: null,
    attempt: 0,
    canRetry: true
  })

  const [data, setData] = useState<T | null>(null)

  const execute = useCallback(async (isRetry = false): Promise<T | null> => {
    if (!isRetry) {
      setState(prev => ({
        ...prev,
        isLoading: true,
        error: null,
        attempt: 0
      }))
    } else {
      setState(prev => ({
        ...prev,
        isLoading: true,
        attempt: prev.attempt + 1
      }))
    }

    try {
      const result = await asyncFn()
      setData(result)
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: null,
        canRetry: true
      }))
      return result
    } catch (error) {
      const currentAttempt = state.attempt + (isRetry ? 1 : 1)
      const canRetryAgain = currentAttempt < maxAttempts
      
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error as Error,
        attempt: currentAttempt,
        canRetry: canRetryAgain
      }))

      if (canRetryAgain) {
        onRetry?.(currentAttempt, error as Error)
      } else {
        onMaxAttemptsReached?.(error as Error)
      }

      return null
    }
  }, [asyncFn, maxAttempts, onRetry, onMaxAttemptsReached, state.attempt])

  const retry = useCallback(async (): Promise<T | null> => {
    if (!state.canRetry) {
      return null
    }

    const delay = exponentialBackoff 
      ? baseDelay * Math.pow(2, state.attempt)
      : baseDelay

    // Wait before retrying
    await new Promise(resolve => setTimeout(resolve, delay))
    
    return execute(true)
  }, [execute, state.canRetry, state.attempt, baseDelay, exponentialBackoff])

  const reset = useCallback(() => {
    setState({
      isLoading: false,
      error: null,
      attempt: 0,
      canRetry: true
    })
    setData(null)
  }, [])

  return {
    execute,
    retry,
    reset,
    data,
    isLoading: state.isLoading,
    error: state.error,
    attempt: state.attempt,
    canRetry: state.canRetry,
    attemptsRemaining: maxAttempts - state.attempt
  }
}

// Specialized hook for network requests
export function useNetworkRetry<T>(
  networkFn: () => Promise<T>,
  options: RetryOptions = {}
) {
  return useRetryLogic(networkFn, {
    maxAttempts: 5,
    baseDelay: 2000,
    exponentialBackoff: true,
    ...options,
    onRetry: (attempt, error) => {
      logger.warn({
        event: 'retry.network.attempt-failed',
        attempt,
        error: error.message,
      })
      options.onRetry?.(attempt, error)
    }
  })
}

// Specialized hook for WebGL operations
export function useWebGLRetry<T>(
  webglFn: () => Promise<T>,
  options: RetryOptions = {}
) {
  return useRetryLogic(webglFn, {
    maxAttempts: 3,
    baseDelay: 1000,
    exponentialBackoff: false,
    ...options,
    onRetry: (attempt, error) => {
      logger.warn({
        event: 'retry.webgl.attempt-failed',
        attempt,
        error: error.message,
      })
      options.onRetry?.(attempt, error)
    },
    onMaxAttemptsReached: (error) => {
      logger.error({
        event: 'retry.webgl.max-attempts-reached',
        error: error.message,
      })
      options.onMaxAttemptsReached?.(error)
    }
  })
}

// Hook for chunk loading errors (common in deployments)
export function useChunkRetry<T>(
  chunkFn: () => Promise<T>,
  options: RetryOptions = {}
) {
  return useRetryLogic(chunkFn, {
    maxAttempts: 5,
    baseDelay: 500,
    exponentialBackoff: true,
    ...options,
    onRetry: (attempt, error) => {
      logger.warn({
        event: 'retry.chunk.attempt-failed',
        attempt,
        error: error.message,
      })
      options.onRetry?.(attempt, error)
    },
    onMaxAttemptsReached: (error) => {
      logger.error({
        event: 'retry.chunk.max-attempts-reached',
        error: error.message,
        action: 'reload-page',
      })
      // Auto-reload page for chunk errors
      setTimeout(() => window.location.reload(), 1000)
      options.onMaxAttemptsReached?.(error)
    }
  })
}
