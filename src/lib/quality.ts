import { getGPUTier } from 'detect-gpu'
import { usePerformanceSettings, type PerfLevel } from '@/store/usePerformanceSettings'

export type QualityProfile = {
  dpr: [number, number]
  starCountScale: number
  shadows: boolean
  postprocessing: boolean
}

export const QUALITY_PROFILES: Record<PerfLevel, QualityProfile> = {
  low: { dpr: [0.75, 1], starCountScale: 0.4, shadows: false, postprocessing: false },
  medium: { dpr: [1, 1.5], starCountScale: 0.7, shadows: true, postprocessing: true },
  high: { dpr: [1, 2], starCountScale: 1.0, shadows: true, postprocessing: true },
}

export async function detectInitialQuality(): Promise<PerfLevel> {
  try {
    const gpu = await getGPUTier()
    // gpu.tier: 0..3; isMobile true/false
    if (gpu.tier <= 1) return 'low'
    if (gpu.tier === 2) return 'medium'
    return 'high'
  } catch {
    return 'medium'
  }
}

export function applyQualityFromTier() {
  // Safe to call from client
  if (typeof window === 'undefined') return
  detectInitialQuality().then((lvl) => usePerformanceSettings.getState().setLevel(lvl))
}
