'use client'

import { useEffect } from 'react'
import { useTelemetryConsent } from '@/store/useTelemetryConsent'
import { useAudioEngine } from '@/store/useAudioEngine'

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

  const containerStyle = {
    position: 'fixed',
    bottom: '16px',
    right: '16px',
    zIndex: 9999,
    width: 'min(360px, calc(100vw - 32px))',
    borderRadius: '16px',
    padding: '16px',
    color: '#fff',
    background: 'rgba(0, 0, 0, 0.82)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    boxShadow: '0 10px 24px rgba(0, 0, 0, 0.45)',
    backdropFilter: 'blur(10px)',
  }

  return (
    <div
      className="fixed bottom-4 right-4 z-[9999] max-w-sm rounded-2xl bg-black/80 p-4 text-white shadow-lg backdrop-blur-md border border-white/10"
      style={containerStyle}
      role="dialog"
      aria-live="polite"
      aria-labelledby="telemetry-consent-title"
      aria-describedby="telemetry-consent-description"
      data-testid="telemetry-banner"
    >
      <h3 id="telemetry-consent-title" style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>Share Web Vitals telemetry?</h3>
      <p id="telemetry-consent-description" style={{ marginTop: '8px', marginBottom: 0, fontSize: '14px', color: 'rgba(255, 255, 255, 0.75)' }}>
        Oscillo can send anonymized performance metrics when you opt in. This helps us spot
        regressions without collecting personal data.
      </p>
      <div style={{ marginTop: '12px', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
        <button
          type="button"
          onClick={allowAnalytics}
          className="rounded-full bg-cyan-500 px-4 py-2 text-sm font-medium text-black transition hover:bg-cyan-400"
          data-testid="telemetry-allow"
          style={{
            border: 'none',
            borderRadius: '9999px',
            padding: '8px 14px',
            fontSize: '14px',
            fontWeight: 600,
            color: '#001316',
            backgroundColor: '#22d3ee',
          }}
        >
          Allow
        </button>
        <button
          type="button"
          onClick={denyAnalytics}
          className="rounded-full border border-white/40 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/10"
          data-testid="telemetry-deny"
          style={{
            borderRadius: '9999px',
            border: '1px solid rgba(255, 255, 255, 0.45)',
            padding: '8px 14px',
            fontSize: '14px',
            fontWeight: 600,
            color: '#fff',
            backgroundColor: 'transparent',
          }}
        >
          Not now
        </button>
      </div>
      <p style={{ marginTop: '10px', marginBottom: 0, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'rgba(255, 255, 255, 0.45)' }}>
        Change this later from the Settings panel.
      </p>
    </div>
  )
}

export default TelemetryConsentBanner
