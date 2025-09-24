import { describe, it, expect, beforeEach, afterEach, afterAll, vi } from 'vitest'
import { reportMetric, TELEMETRY_STORAGE_KEY } from '@/lib/telemetry'
import { useTelemetryConsent } from '@/store/useTelemetryConsent'

const metric = {
  id: 'abc',
  name: 'CLS',
  label: 'web-vital',
  value: 0.12,
  delta: 0.01,
}

const originalNavigator = globalThis.navigator
const originalFetch = globalThis.fetch

beforeEach(() => {
  window.localStorage.clear()
  useTelemetryConsent.setState({ status: 'unknown', analyticsEnabled: false, hydrated: false })
  vi.restoreAllMocks()
  if (originalNavigator) {
    Object.defineProperty(globalThis, 'navigator', {
      value: originalNavigator,
      configurable: true,
      writable: true,
    })
  }
  if (originalFetch) {
    globalThis.fetch = originalFetch
  }
})

afterEach(() => {
  vi.restoreAllMocks()
})

afterAll(() => {
  if (originalNavigator) {
    Object.defineProperty(globalThis, 'navigator', {
      value: originalNavigator,
      configurable: true,
      writable: true,
    })
  }
  if (originalFetch) {
    globalThis.fetch = originalFetch
  }
})

describe('telemetry consent store', () => {
  it('persists allow/deny decisions', () => {
    const { allowAnalytics, denyAnalytics } = useTelemetryConsent.getState()

    allowAnalytics()
    expect(window.localStorage.getItem(TELEMETRY_STORAGE_KEY)).toBe('granted')
    expect(useTelemetryConsent.getState().analyticsEnabled).toBe(true)
    expect(useTelemetryConsent.getState().status).toBe('granted')

    denyAnalytics()
    expect(window.localStorage.getItem(TELEMETRY_STORAGE_KEY)).toBe('denied')
    expect(useTelemetryConsent.getState().analyticsEnabled).toBe(false)
    expect(useTelemetryConsent.getState().status).toBe('denied')
  })

  it('hydrates consent state from localStorage', () => {
    window.localStorage.setItem(TELEMETRY_STORAGE_KEY, 'granted')
    const { hydrate } = useTelemetryConsent.getState()
    hydrate()

    expect(useTelemetryConsent.getState().hydrated).toBe(true)
    expect(useTelemetryConsent.getState().analyticsEnabled).toBe(true)
    expect(useTelemetryConsent.getState().status).toBe('granted')
  })
})

describe('reportMetric', () => {
  it('does nothing when consent is missing', () => {
    const sendBeacon = vi.fn()
    Object.defineProperty(globalThis, 'navigator', {
      value: { sendBeacon },
      configurable: true,
    })

    reportMetric(metric)
    expect(sendBeacon).not.toHaveBeenCalled()
  })

  it('uses sendBeacon when available after consent', () => {
    const sendBeacon = vi.fn(() => true)
    Object.defineProperty(globalThis, 'navigator', {
      value: { sendBeacon },
      configurable: true,
    })
    window.localStorage.setItem(TELEMETRY_STORAGE_KEY, 'granted')

    reportMetric(metric)
    expect(sendBeacon).toHaveBeenCalledTimes(1)

    const [endpoint, blob] = sendBeacon.mock.calls[0]
    expect(endpoint).toBe('/api/metrics/web-vitals')
    expect(blob).toBeInstanceOf(Blob)
  })

  it('falls back to fetch when sendBeacon is unavailable', async () => {
    Object.defineProperty(globalThis, 'navigator', {
      value: {},
      configurable: true,
    })
    const fetchMock = vi.fn(() => Promise.resolve({ ok: true }))
    ;(globalThis as any).fetch = fetchMock
    window.localStorage.setItem(TELEMETRY_STORAGE_KEY, 'granted')

    reportMetric(metric)
    await new Promise((resolve) => setTimeout(resolve, 0))

    expect(fetchMock).toHaveBeenCalledTimes(1)
    const [endpoint, options] = fetchMock.mock.calls[0]
    expect(endpoint).toBe('/api/metrics/web-vitals')
    expect(options?.method).toBe('POST')
  })
})
