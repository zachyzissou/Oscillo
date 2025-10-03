'use client'
import { useCallback } from 'react'
import { startAudio } from '@/lib/audio/startAudio'
import { useAudioEngine } from '@/store/useAudioEngine'

/**
 * Custom hook for audio context initialization.
 * Handles the complex audio setup logic separate from UI concerns.
 */
export const useAudioInitializer = () => {
  const setUserInteracted = useAudioEngine((s) => s.setUserInteracted)
  const setAudioContextState = useAudioEngine((s) => s.setAudioContext)
  const setInitFlag = useAudioEngine((s) => s.setIsInitializing)

  const initializeAudio = useCallback(async () => {
    setUserInteracted(true)
    setInitFlag(true)
    
    try {
      // Initialize audio context with timeout for CI environments
      const audioTimeout = new Promise<boolean>((_, reject) =>
        setTimeout(() => reject(new Error('Audio initialization timeout')), 5000)
      )

      const success = await Promise.race([
        startAudio(),
        audioTimeout
      ])

      if (success) {
        setAudioContextState('running')
      }
      
      return success
    } catch (error) {
      console.warn('Audio initialization failed (continuing without audio):', error)
      // Continue without audio for CI environments
      setAudioContextState('suspended')
      return false
    } finally {
      setInitFlag(false)
    }
  }, [setUserInteracted, setAudioContextState, setInitFlag])
  
  return { initializeAudio }
}
