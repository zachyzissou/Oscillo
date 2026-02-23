'use client'
import { useState } from 'react'
import { startAudio } from '@/lib/audio/startAudio'
import { useAudioEngine } from '@/store/useAudioEngine'
import styles from './SimpleStartOverlay.module.css'

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
      } else {
        setAudioContextState('suspended')
      }
    } catch (error) {
      console.error('Audio init failed:', error)
      setAudioContextState('suspended')
    }

    setIsVisible(false)
    localStorage.setItem('hasSeenOverlay', 'true')
    setIsLoading(false)
  }

  if (!isVisible) return null

  return (
    <div
      id="start-overlay"
      data-testid="start-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="start-overlay-title"
      aria-describedby="start-overlay-description"
      className={styles.overlay}
    >
      <div className={styles.panel}>
        <div className={styles.eyebrow} aria-hidden="true">
          live audiovisual playground
        </div>
        <h1 id="start-overlay-title" className={styles.title}>
          🎵 Interactive 3D Music
        </h1>
        <p id="start-overlay-description" className={styles.description}>
          Build sound-reactive scenes in seconds. Start instantly, then shape key, scale,
          tempo, and quality from the live command deck.
        </p>
        <ul className={styles.hints} aria-hidden="true">
          <li>
            <span>01</span> Click particles to play notes.
          </li>
          <li>
            <span>02</span> Drag to orbit, scroll to zoom.
          </li>
          <li>
            <span>03</span> Tune sound and visual quality live.
          </li>
        </ul>
        <button
          onClick={handleStart}
          disabled={isLoading}
          data-testid="start-button"
          aria-label="Start creating music"
          className={styles.cta}
        >
          {isLoading ? 'Starting...' : 'Start Creating'}
        </button>
        <p className={styles.footer}>Works best with headphones and a track playing nearby.</p>
      </div>
    </div>
  )
}
