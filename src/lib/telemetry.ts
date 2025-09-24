import type { Metric } from 'next/app'

export const TELEMETRY_STORAGE_KEY = 'oscillo.analytics-consent'

const defaultEndpoint = '/api/metrics/web-vitals'

function hasConsent(): boolean {
  if (typeof window === 'undefined') return false
  try {
    return window.localStorage.getItem(TELEMETRY_STORAGE_KEY) === 'granted'
  } catch {
    return false
  }
}

type MetricPayload = Metric & {
  timestamp: string
  url: string
}

function buildPayload(metric: Metric): MetricPayload {
  return {
    ...metric,
    timestamp: new Date().toISOString(),
    url: typeof window !== 'undefined' ? window.location.href : '',
  }
}

function sendPayload(payload: MetricPayload) {
  if (typeof navigator === 'undefined') return

  const endpoint = process.env.NEXT_PUBLIC_WEB_VITALS_ENDPOINT || defaultEndpoint
  const body = JSON.stringify(payload)

  if (typeof navigator.sendBeacon === 'function') {
    try {
      const blob = new Blob([body], { type: 'application/json' })
      navigator.sendBeacon(endpoint, blob)
      return
    } catch {
      // fall back to fetch
    }
  }

  fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body,
    keepalive: true,
  }).catch(() => {
    // Swallow network errors; telemetry should never break UX
  })
}

export function reportMetric(metric: Metric) {
  if (!hasConsent()) return
  sendPayload(buildPayload(metric))
}

export function optOutTelemetry() {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(TELEMETRY_STORAGE_KEY, 'denied')
  } catch {
    // ignore
  }
}

export function optInTelemetry() {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(TELEMETRY_STORAGE_KEY, 'granted')
  } catch {
    // ignore
  }
}
