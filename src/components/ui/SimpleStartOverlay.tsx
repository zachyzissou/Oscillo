'use client'
import { useEffect, useRef, useState } from 'react'
import { startAudio } from '@/lib/audio/startAudio'
import { useAudioEngine } from '@/store/useAudioEngine'
import { useAccessibilityAnnouncements } from '@/store/useAccessibilityAnnouncements'
import { UIButton, UIOverlay, UISurface } from '@/components/ui/primitives/UiPrimitives'
import styles from './SimpleStartOverlay.module.css'
import { logger } from '@/lib/logger'

const MIN_STARTUP_FEEDBACK_MS = 480
const FINALIZE_FEEDBACK_MS = 140
const FOCUS_RESTORE_RETRY_MS = 50
const MAX_FOCUS_RESTORE_RETRIES = 20
const FOCUSABLE_SELECTOR =
  'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
const POST_START_FOCUS_TARGETS = [
  '[data-testid="telemetry-allow"]',
  '[data-testid="deck-rail-toggle"]',
  '[data-testid="deck-open-button"]',
]
const FINAL_FOCUS_FALLBACK_SELECTOR = '#main-content'

const now = () => (typeof performance !== 'undefined' ? performance.now() : Date.now())

const wait = (durationMs: number) =>
  new Promise<void>(resolve => {
    globalThis.setTimeout(resolve, durationMs)
  })

const isVisibleAndFocusable = (element: HTMLElement | null) => {
  if (!element || typeof element.focus !== 'function') return false
  const computed = globalThis.getComputedStyle(element)
  if (computed.visibility === 'hidden' || computed.display === 'none') return false
  return !element.hasAttribute('hidden') && !element.hasAttribute('disabled')
}

const getFocusableElements = (container: HTMLElement | null) => {
  if (!container) return []
  return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
    isVisibleAndFocusable
  )
}

const findPostStartFocusTarget = () => {
  for (const selector of POST_START_FOCUS_TARGETS) {
    const candidate = globalThis.document.querySelector(selector) as HTMLElement | null
    if (isVisibleAndFocusable(candidate)) {
      return candidate
    }
  }
  return null
}

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
  const overlayRef = useRef<HTMLDivElement>(null)
  const preOverlayFocusedElementRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    // A user gesture is required on every fresh page load to unlock audio.
    // Keep the start gate visible regardless of prior visits to avoid dead-end blank states.
    setIsVisible(true)
    setIsHydrated(true)
  }, [])

  useEffect(() => {
    if (isHydrated && isVisible) {
      preOverlayFocusedElementRef.current =
        globalThis.document.activeElement instanceof HTMLElement
          ? globalThis.document.activeElement
          : null
      globalThis.requestAnimationFrame(() => {
        startButtonRef.current?.focus()
      })
      announcePolite('Start overlay ready. Press Start Creating to begin.')
    }
  }, [announcePolite, isHydrated, isVisible])

  useEffect(() => {
    if (!isVisible) return

    const handleKeyDown = (event: KeyboardEvent) => {
      const overlayElement = overlayRef.current
      if (!overlayElement) return

      if (event.key === 'Escape') {
        event.preventDefault()
        event.stopPropagation()
        event.stopImmediatePropagation()
        if (isLoading) {
          announcePolite('Startup in progress. Please wait.')
          return
        }
        announcePolite('Start overlay remains open. Press Start Creating to continue.')
        startButtonRef.current?.focus()
        return
      }

      if (event.key !== 'Tab') return

      const focusableElements = getFocusableElements(overlayElement)
      if (focusableElements.length === 0) {
        event.preventDefault()
        return
      }

      const firstElement = focusableElements[0]
      const lastElement = focusableElements[focusableElements.length - 1]
      const activeElement = globalThis.document.activeElement as HTMLElement | null
      const activeInsideOverlay = !!activeElement && overlayElement.contains(activeElement)

      if (event.shiftKey) {
        if (!activeInsideOverlay || activeElement === firstElement) {
          event.preventDefault()
          lastElement.focus()
        }
        return
      }

      if (!activeInsideOverlay || activeElement === lastElement) {
        event.preventDefault()
        firstElement.focus()
      }
    }

    globalThis.document.addEventListener('keydown', handleKeyDown, true)
    return () => globalThis.document.removeEventListener('keydown', handleKeyDown, true)
  }, [announcePolite, isLoading, isVisible])

  const restoreFocusAfterOverlayClose = () => {
    let attempts = 0

    const attemptFocusRestore = () => {
      const target = findPostStartFocusTarget()
      if (target) {
        target.focus()
        return
      }

      if (attempts < MAX_FOCUS_RESTORE_RETRIES) {
        attempts += 1
        globalThis.setTimeout(() => {
          globalThis.requestAnimationFrame(attemptFocusRestore)
        }, FOCUS_RESTORE_RETRY_MS)
        return
      }

      if (
        isVisibleAndFocusable(preOverlayFocusedElementRef.current) &&
        preOverlayFocusedElementRef.current?.isConnected
      ) {
        preOverlayFocusedElementRef.current.focus()
        return
      }

      const fallbackTarget = globalThis.document.querySelector(
        FINAL_FOCUS_FALLBACK_SELECTOR
      ) as HTMLElement | null
      if (isVisibleAndFocusable(fallbackTarget)) {
        fallbackTarget.focus()
      }
    }

    globalThis.requestAnimationFrame(attemptFocusRestore)
  }

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

    // Close the modal first, then unlock consent surfaces on the next frame
    // so users never see overlapping startup + telemetry dialogs.
    setIsVisible(false)
    globalThis.requestAnimationFrame(() => {
      setUserInteracted(true)
    })
    restoreFocusAfterOverlayClose()
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
    <UIOverlay
      ref={overlayRef}
      id="start-overlay"
      data-testid="start-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="start-overlay-title"
      aria-describedby="start-overlay-description"
      className={styles.overlay}
    >
      <UISurface tone="dialog" className={styles.panel}>
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
        <UIButton
          ref={startButtonRef}
          onClick={handleStart}
          disabled={isLoading}
          data-testid="start-button"
          aria-label="Start creating music"
          aria-busy={isLoading ? 'true' : 'false'}
          tone="primary"
          shape="rounded"
          className={styles.cta}
        >
          {isLoading ? 'Starting...' : 'Start Creating'}
        </UIButton>
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
      </UISurface>
    </UIOverlay>
  )
}
