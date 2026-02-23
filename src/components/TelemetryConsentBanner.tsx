'use client'

import { useCallback, useEffect, useRef } from 'react'
import { useTelemetryConsent } from '@/store/useTelemetryConsent'
import { useAudioEngine } from '@/store/useAudioEngine'
import { useAccessibilityAnnouncements } from '@/store/useAccessibilityAnnouncements'
import styles from './TelemetryConsentBanner.module.css'

export function TelemetryConsentBanner() {
  const status = useTelemetryConsent((state) => state.status)
  const hydrated = useTelemetryConsent((state) => state.hydrated)
  const hydrate = useTelemetryConsent((state) => state.hydrate)
  const allowAnalytics = useTelemetryConsent((state) => state.allowAnalytics)
  const denyAnalytics = useTelemetryConsent((state) => state.denyAnalytics)
  const hasUserInteracted = useAudioEngine((state) => state.hasUserInteracted)
  const announcePolite = useAccessibilityAnnouncements((state) => state.announcePolite)
  const allowButtonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    hydrate()
  }, [hydrate])

  useEffect(() => {
    if (!hasUserInteracted || !hydrated || status !== 'unknown') return
    globalThis.requestAnimationFrame(() => {
      allowButtonRef.current?.focus()
      announcePolite('Telemetry choice available. Allow or choose Not now.')
    })
  }, [announcePolite, hasUserInteracted, hydrated, status])

  const focusPersistentControl = useCallback(() => {
    globalThis.requestAnimationFrame(() => {
      const railToggle = document.querySelector(
        '[data-testid="deck-rail-toggle"]'
      ) as HTMLButtonElement | null
      if (railToggle) {
        railToggle.focus()
        return
      }

      const mainContent = document.querySelector('#main-content') as HTMLElement | null
      mainContent?.focus()
    })
  }, [])

  const handleAllow = useCallback(() => {
    announcePolite('Telemetry sharing enabled.')
    allowAnalytics()
    focusPersistentControl()
  }, [allowAnalytics, announcePolite, focusPersistentControl])

  const handleDeny = useCallback(() => {
    announcePolite('Telemetry sharing disabled.')
    denyAnalytics()
    focusPersistentControl()
  }, [announcePolite, denyAnalytics, focusPersistentControl])

  // Avoid stacking multiple overlays before the user starts the experience.
  if (!hasUserInteracted || !hydrated || status !== 'unknown') {
    return null
  }

  return (
    <div
      className={styles.banner}
      role="dialog"
      aria-live="polite"
      aria-labelledby="telemetry-consent-title"
      aria-describedby="telemetry-consent-description"
      data-testid="telemetry-banner"
    >
      <h3 id="telemetry-consent-title" className={styles.title}>
        Share Web Vitals telemetry?
      </h3>
      <p id="telemetry-consent-description" className={styles.description}>
        Oscillo can send anonymized performance metrics when you opt in. This helps us spot
        regressions without collecting personal data.
      </p>
      <div className={styles.actions}>
        <button
          type="button"
          ref={allowButtonRef}
          onClick={handleAllow}
          className={styles.allow}
          data-testid="telemetry-allow"
        >
          Allow
        </button>
        <button
          type="button"
          onClick={handleDeny}
          className={styles.deny}
          data-testid="telemetry-deny"
        >
          Not now
        </button>
      </div>
      <p className={styles.footnote}>
        Change this later from the Settings panel.
      </p>
    </div>
  )
}

export default TelemetryConsentBanner
