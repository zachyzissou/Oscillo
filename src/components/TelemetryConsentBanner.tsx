'use client'

import { useEffect } from 'react'
import { useTelemetryConsent } from '@/store/useTelemetryConsent'
import { useAudioEngine } from '@/store/useAudioEngine'
import styles from './TelemetryConsentBanner.module.css'

export function TelemetryConsentBanner() {
  const status = useTelemetryConsent((state) => state.status)
  const hydrated = useTelemetryConsent((state) => state.hydrated)
  const hydrate = useTelemetryConsent((state) => state.hydrate)
  const allowAnalytics = useTelemetryConsent((state) => state.allowAnalytics)
  const denyAnalytics = useTelemetryConsent((state) => state.denyAnalytics)
  const hasUserInteracted = useAudioEngine((state) => state.hasUserInteracted)

  useEffect(() => {
    hydrate()
  }, [hydrate])

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
          onClick={allowAnalytics}
          className={styles.allow}
          data-testid="telemetry-allow"
        >
          Allow
        </button>
        <button
          type="button"
          onClick={denyAnalytics}
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
