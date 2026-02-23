'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { startAudio } from '@/lib/audio/startAudio'
import { useAudioEngine } from '@/store/useAudioEngine'
import { useAccessibilityAnnouncements } from '@/store/useAccessibilityAnnouncements'
import { UIButton, UISurface } from '@/components/ui/primitives/UiPrimitives'
import styles from './AudioRecoveryBanner.module.css'

export default function AudioRecoveryBanner() {
  const hasUserInteracted = useAudioEngine(state => state.hasUserInteracted)
  const audioReady = useAudioEngine(state => state.audioReady)
  const lastError = useAudioEngine(state => state.lastError)
  const setAudioContext = useAudioEngine(state => state.setAudioContext)
  const setError = useAudioEngine(state => state.setError)
  const announcePolite = useAccessibilityAnnouncements(state => state.announcePolite)

  const [isRetrying, setIsRetrying] = useState(false)
  const [dismissedError, setDismissedError] = useState<string | null>(null)
  const retryButtonRef = useRef<HTMLButtonElement>(null)
  const shouldShow =
    hasUserInteracted && !audioReady && Boolean(lastError) && dismissedError !== lastError

  useEffect(() => {
    if (!audioReady) return
    setDismissedError(null)
  }, [audioReady])

  useEffect(() => {
    if (!shouldShow) return
    globalThis.requestAnimationFrame(() => {
      retryButtonRef.current?.focus()
      announcePolite('Audio unavailable. Retry audio or continue in visual-only mode.')
    })
  }, [announcePolite, shouldShow])

  const handleRetry = useCallback(async () => {
    if (isRetrying) return

    setIsRetrying(true)
    announcePolite('Retrying audio initialization.')

    try {
      const success = await startAudio()
      if (success) {
        setAudioContext('running')
        setError(null)
        announcePolite('Audio recovered. Live sound controls are available.')
        setDismissedError(null)
        return
      }

      setAudioContext('suspended')
      announcePolite('Audio is still unavailable. You can keep using visual-only mode.')
    } finally {
      setIsRetrying(false)
    }
  }, [announcePolite, isRetrying, setAudioContext, setError])

  const handleDismiss = useCallback(() => {
    if (!lastError) return
    setDismissedError(lastError)
    announcePolite('Continuing in visual-only mode.')
  }, [announcePolite, lastError])

  if (!shouldShow) return null

  return (
    <UISurface
      tone="banner"
      className={styles.banner}
      data-testid="audio-recovery-banner"
      role="alert"
      aria-live="polite"
      aria-labelledby="audio-recovery-title"
      aria-describedby="audio-recovery-description"
    >
      <h3 id="audio-recovery-title" className={styles.title}>
        Audio needs permission
      </h3>
      <p id="audio-recovery-description" className={styles.description}>
        Sound could not start. You can retry audio now or continue visual-only and keep creating.
      </p>
      <div className={styles.actions}>
        <UIButton
          ref={retryButtonRef}
          type="button"
          tone="primary"
          shape="pill"
          className={styles.retry}
          data-testid="audio-recovery-retry"
          onClick={handleRetry}
          disabled={isRetrying}
          aria-busy={isRetrying ? 'true' : 'false'}
        >
          {isRetrying ? 'Retrying...' : 'Retry audio'}
        </UIButton>
        <UIButton
          type="button"
          tone="secondary"
          shape="pill"
          className={styles.dismiss}
          data-testid="audio-recovery-dismiss"
          onClick={handleDismiss}
        >
          Continue visual-only
        </UIButton>
      </div>
    </UISurface>
  )
}
