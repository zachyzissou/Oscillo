'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useTelemetryConsent } from '@/store/useTelemetryConsent'
import { useAudioEngine } from '@/store/useAudioEngine'
import { useAccessibilityAnnouncements } from '@/store/useAccessibilityAnnouncements'
import { UIButton, UISurface } from '@/components/ui/primitives/UiPrimitives'
import styles from './TelemetryConsentBanner.module.css'

const BANNER_REVEAL_DELAY_MS = 900

export function TelemetryConsentBanner() {
  const status = useTelemetryConsent((state) => state.status)
  const hydrated = useTelemetryConsent((state) => state.hydrated)
  const hydrate = useTelemetryConsent((state) => state.hydrate)
  const allowAnalytics = useTelemetryConsent((state) => state.allowAnalytics)
  const denyAnalytics = useTelemetryConsent((state) => state.denyAnalytics)
  const hasUserInteracted = useAudioEngine((state) => state.hasUserInteracted)
  const announcePolite = useAccessibilityAnnouncements((state) => state.announcePolite)
  const [isVisible, setIsVisible] = useState(false)
  const [detailsOpen, setDetailsOpen] = useState(false)
  const allowButtonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    hydrate()
  }, [hydrate])

  useEffect(() => {
    if (!hasUserInteracted || !hydrated || status !== 'unknown') {
      setIsVisible(false)
      setDetailsOpen(false)
      return
    }

    const timer = globalThis.setTimeout(() => setIsVisible(true), BANNER_REVEAL_DELAY_MS)
    return () => globalThis.clearTimeout(timer)
  }, [hasUserInteracted, hydrated, status])

  useEffect(() => {
    if (!isVisible) return
    globalThis.requestAnimationFrame(() => {
      allowButtonRef.current?.focus()
      announcePolite('Telemetry choice available. Allow or choose Not now.')
    })
  }, [announcePolite, isVisible])

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
    setIsVisible(false)
    focusPersistentControl()
  }, [allowAnalytics, announcePolite, focusPersistentControl])

  const handleDeny = useCallback(() => {
    announcePolite('Telemetry sharing disabled.')
    denyAnalytics()
    setIsVisible(false)
    focusPersistentControl()
  }, [announcePolite, denyAnalytics, focusPersistentControl])

  // Avoid stacking multiple overlays before the user starts the experience.
  if (!hasUserInteracted || !hydrated || status !== 'unknown' || !isVisible) {
    return null
  }

  return (
    <UISurface
      tone="banner"
      className={styles.banner}
      role="dialog"
      aria-live="polite"
      aria-labelledby="telemetry-consent-title"
      aria-describedby="telemetry-consent-description"
      data-testid="telemetry-banner"
    >
      <h3 id="telemetry-consent-title" className={styles.title}>
        Share anonymous performance signals?
      </h3>
      <p id="telemetry-consent-description" className={styles.description}>
        Help us catch regressions faster with Web Vitals only.
      </p>
      <div className={styles.actions}>
        <UIButton
          type="button"
          ref={allowButtonRef}
          onClick={handleAllow}
          tone="primary"
          shape="pill"
          className={styles.allow}
          data-testid="telemetry-allow"
        >
          Allow
        </UIButton>
        <UIButton
          type="button"
          onClick={handleDeny}
          tone="secondary"
          shape="pill"
          className={styles.deny}
          data-testid="telemetry-deny"
        >
          Not now
        </UIButton>
        <UIButton
          type="button"
          tone="ghost"
          shape="pill"
          className={styles.details}
          data-testid="telemetry-details-toggle"
          aria-expanded={detailsOpen}
          aria-controls="telemetry-consent-details"
          onClick={() => setDetailsOpen(current => !current)}
        >
          {detailsOpen ? 'Hide details' : 'Why this helps'}
        </UIButton>
      </div>
      {detailsOpen && (
        <div id="telemetry-consent-details" className={styles.detailsPanel}>
          <p className={styles.footnote}>
            Oscillo only sends anonymized Core Web Vitals diagnostics. No account profile, no
            personal content.
          </p>
          <p className={styles.footnote}>You can change this later from the Settings panel.</p>
        </div>
      )}
    </UISurface>
  )
}

export default TelemetryConsentBanner
