'use client'
import { useState } from 'react'
import { startAudio } from '@/lib/audio/startAudio'
import { useAudioEngine } from '@/store/useAudioEngine'

export default function SimpleStartOverlay() {
  const [isVisible, setIsVisible] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const setUserInteracted = useAudioEngine((s) => s.setUserInteracted)
  const setAudioContextState = useAudioEngine((s) => s.setAudioContext)

  const handleStart = async () => {
    if (isLoading) return
    setIsLoading(true)
    setUserInteracted(true)

    try {
      const success = await startAudio()
      if (success) {
        setAudioContextState('running')
        setIsVisible(false)
        localStorage.setItem('hasSeenOverlay', 'true')
      }
    } catch (error) {
      console.error('Audio init failed:', error)
      setAudioContextState('suspended')
    }

    setIsLoading(false)
  }

  if (!isVisible) return null

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 999999
      }}
    >
      <div
        style={{
          backgroundColor: 'rgba(30, 30, 50, 0.9)',
          border: '2px solid #00ffff',
          borderRadius: '20px',
          padding: '40px',
          maxWidth: '500px',
          textAlign: 'center',
          boxShadow: '0 0 40px rgba(0, 255, 255, 0.5)'
        }}
      >
        <h1 style={{ color: 'white', fontSize: '28px', marginBottom: '20px' }}>
          🎵 Interactive 3D Music
        </h1>
        <p style={{ color: 'rgba(255, 255, 255, 0.8)', marginBottom: '30px' }}>
          Click to start your musical journey
        </p>
        <button
          onClick={handleStart}
          disabled={isLoading}
          style={{
            backgroundColor: '#00ffff',
            color: '#000',
            border: 'none',
            borderRadius: '10px',
            padding: '15px 40px',
            fontSize: '18px',
            fontWeight: 'bold',
            cursor: isLoading ? 'wait' : 'pointer',
            opacity: isLoading ? 0.5 : 1,
            transition: 'all 0.3s ease'
          }}
        >
          {isLoading ? 'Starting...' : 'Start Creating'}
        </button>
      </div>
    </div>
  )
}