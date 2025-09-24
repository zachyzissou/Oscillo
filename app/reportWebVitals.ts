'use client'

import type { NextWebVitalsMetric } from 'next/app'
import { reportMetric } from '@/lib/telemetry'

export function reportWebVitals(metric: NextWebVitalsMetric) {
  reportMetric(metric)
}
