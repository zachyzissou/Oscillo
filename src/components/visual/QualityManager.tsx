'use client'
import { useEffect } from 'react'
import { applyQualityFromTier } from '@/lib/quality'
import { usePerformanceSettings } from '@/store/usePerformanceSettings'

export default function QualityManager() {
  const setLevel = usePerformanceSettings((s) => s.setLevel)

  useEffect(() => {
    applyQualityFromTier()
  }, [])

  useEffect(() => {
    // Optionally respond to performance-adapt events
    const onAdapt = (e: Event) => {
      const detail = (e as CustomEvent).detail as { level?: number }
      if (typeof detail?.level === 'number') {
        // Map continuous level to our discrete buckets
        const lvl = detail.level >= 0.9 ? 'high' : detail.level >= 0.6 ? 'medium' : 'low'
        setLevel(lvl)
      }
    }
    window.addEventListener('performance-adapt' as any, onAdapt)
    return () => window.removeEventListener('performance-adapt' as any, onAdapt)
  }, [setLevel])

  return null
}

