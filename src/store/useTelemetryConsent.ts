import { create } from 'zustand'
import { TELEMETRY_STORAGE_KEY } from '@/lib/telemetry'

type ConsentStatus = 'unknown' | 'granted' | 'denied'

type TelemetryState = {
  status: ConsentStatus
  analyticsEnabled: boolean
  hydrated: boolean
  hydrate: () => void
  allowAnalytics: () => void
  denyAnalytics: () => void
}

function persist(status: ConsentStatus) {
  if (typeof window === 'undefined') return
  const value = status === 'granted' ? 'granted' : status === 'denied' ? 'denied' : ''
  if (!value) {
    window.localStorage.removeItem(TELEMETRY_STORAGE_KEY)
    return
  }
  window.localStorage.setItem(TELEMETRY_STORAGE_KEY, value)
}

const toStatus = (value: string | null): ConsentStatus => {
  if (value === 'granted') return 'granted'
  if (value === 'denied') return 'denied'
  return 'unknown'
}

export const useTelemetryConsent = create<TelemetryState>((set, get) => ({
  status: 'unknown',
  analyticsEnabled: false,
  hydrated: false,
  hydrate: () => {
    if (typeof window === 'undefined' || get().hydrated) return
    const stored = toStatus(window.localStorage.getItem(TELEMETRY_STORAGE_KEY))
    set({
      status: stored,
      analyticsEnabled: stored === 'granted',
      hydrated: true,
    })
  },
  allowAnalytics: () => {
    persist('granted')
    set({ status: 'granted', analyticsEnabled: true })
  },
  denyAnalytics: () => {
    persist('denied')
    set({ status: 'denied', analyticsEnabled: false })
  },
}))
