'use client'
import { useEffect, useRef, useState } from 'react'
import { startAudio } from '@/lib/audio/startAudio'
import { useAudioEngine } from '@/store/useAudioEngine'
import { useAccessibilityAnnouncements } from '@/store/useAccessibilityAnnouncements'
import styles from './SimpleStartOverlay.module.css'
import { logger } from '@/lib/logger'

const MIN_STARTUP_FEEDBACK_MS = 480
const FINALIZE_FEEDBACK_MS = 140

const now = () => (typeof performance !== 'undefined' ? performance.now() : Date.now())

const wait = (durationMs: number) =>
  new Promise<void>(resolve => {
    globalThis.setTimeout(resolve, durationMs)
  })

export default function SimpleStartOverlay() {
  const [isHydrated, setIsHydrated] = useState(false)
  const [isVisible, setIsVisible] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [startupMessage, setStartupMessage] = useState(
    'Audio starts after you press Start Creating.'
  )
  const [startupProgress, setStartupProgress] = useState(0)
  const setUserInteracted = useAudioEngine((s) => s.setUserInteracted)
  const setAudioContextState = useAudioEngine((s) => s.setAudioContext)
  const announcePolite = useAccessibilityAnnouncements((state) => state.announcePolite)
  const startButtonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    let hasSeenOverlay = false
    try {
      hasSeenOverlay = localStorage.getItem('hasSeenOverlay') === 'true'
    } catch {
      hasSeenOverlay = false
    }

    const shouldShowOverlay = process.env.NODE_ENV === 'development' || !hasSeenOverlay
    setIsVisible(shouldShowOverlay)
    setIsHydrated(true)
  }, [])

  useEffect(() => {
    if (isHydrated && isVisible) {
      startButtonRef.current?.focus()
      announcePolite('Start overlay ready. Press Start Creating to begin.')
    }
  }, [announcePolite, isHydrated, isVisible])

  const handleStart = async () => {
    if (isLoading) return

    const startupBeganAt = now()
    let startedWithAudio = false
    setIsLoading(true)
    setStartupProgress(22)
    setStartupMessage('Requesting browser permission for audio...')
    announcePolite('Starting audio and opening the experience.')

    try {
      const success = await startAudio()
      if (success) {
        startedWithAudio = true
        setStartupProgress(72)
        setStartupMessage('Audio initialized. Finalizing scene...')
        setAudioContextState('running')
        announcePolite('Audio initialized. Experience started.')
      } else {
        setStartupProgress(72)
        setStartupMessage('Audio unavailable. Launching visual-only mode.')
        setAudioContextState('suspended')
        announcePolite('Experience started with audio unavailable.')
      }
    } catch (error) {
      logger.error({
        event: 'start-overlay.audio-init-failed',
        error: error instanceof Error ? error.message : String(error),
      })
      setStartupProgress(72)
      setStartupMessage('Audio initialization failed. Launching visual-only mode.')
      setAudioContextState('suspended')
      announcePolite('Experience started with audio unavailable.')
    }

    const elapsed = now() - startupBeganAt
    if (elapsed < MIN_STARTUP_FEEDBACK_MS) {
      await wait(MIN_STARTUP_FEEDBACK_MS - elapsed)
    }

    setStartupProgress(100)
    setStartupMessage(
      startedWithAudio ? 'Ready. Opening your instrument.' : 'Visual-only mode ready. Opening now.'
    )
    await wait(FINALIZE_FEEDBACK_MS)

    setUserInteracted(true)
    setIsVisible(false)
    try {
      localStorage.setItem('hasSeenOverlay', 'true')
    } catch {
      // Ignore localStorage failures in private/restricted browsing contexts.
    }
    setIsLoading(false)
    setStartupProgress(0)
    setStartupMessage('Audio starts after you press Start Creating.')
  }

  if (!isHydrated) return null
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
          ref={startButtonRef}
          onClick={handleStart}
          disabled={isLoading}
          data-testid="start-button"
          aria-label="Start creating music"
          aria-busy={isLoading ? 'true' : 'false'}
          className={styles.cta}
        >
          {isLoading ? 'Starting...' : 'Start Creating'}
        </button>
        <div className={styles.statusRegion} role="status" aria-live="polite" data-testid="start-status">
          <div className={styles.statusMeta}>
            <span>{startupMessage}</span>
            {isLoading && <span className={styles.statusPercent}>{startupProgress}%</span>}
          </div>
          <div
            className={styles.progressTrack}
            role="progressbar"
            aria-label="Startup progress"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={isLoading ? startupProgress : 0}
            aria-valuetext={startupMessage}
          >
            <span
              className={styles.progressFill}
              style={{ width: `${isLoading ? startupProgress : 0}%` }}
            />
          </div>
        </div>
        <p className={styles.footer}>Works best with headphones and a track playing nearby.</p>
      </div>
    </div>
  )
}
