'use client'

import { useEffect } from 'react'
import { useTelemetryConsent } from '@/store/useTelemetryConsent'

export function TelemetryConsentBanner() {
  const status = useTelemetryConsent((state) => state.status)
  const hydrated = useTelemetryConsent((state) => state.hydrated)
  const hydrate = useTelemetryConsent((state) => state.hydrate)
  const allowAnalytics = useTelemetryConsent((state) => state.allowAnalytics)
  const denyAnalytics = useTelemetryConsent((state) => state.denyAnalytics)

  useEffect(() => {
    hydrate()
  }, [hydrate])

  if (!hydrated || status !== 'unknown') {
    return null
  }

  return (
    <div className="fixed bottom-4 right-4 z-[9999] max-w-sm rounded-2xl bg-black/80 p-4 text-white shadow-lg backdrop-blur-md border border-white/10">
      <h3 className="text-base font-semibold">Share Web Vitals telemetry?</h3>
      <p className="mt-2 text-sm text-white/70">
        Oscillo can send anonymized performance metrics when you opt in. This helps us spot
        regressions without collecting personal data.
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={allowAnalytics}
          className="rounded-full bg-cyan-500 px-4 py-2 text-sm font-medium text-black transition hover:bg-cyan-400"
        >
          Allow
        </button>
        <button
          type="button"
          onClick={denyAnalytics}
          className="rounded-full border border-white/40 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/10"
        >
          Not now
        </button>
      </div>
      <p className="mt-2 text-[11px] uppercase tracking-wide text-white/40">
        Change this later from the Settings panel.
      </p>
    </div>
  )
}

export default TelemetryConsentBanner
