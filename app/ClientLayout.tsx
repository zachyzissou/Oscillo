'use client'
import React from 'react'
import TelemetryConsentBanner from '@/components/TelemetryConsentBanner'

export default function ClientLayout({ children }: { readonly children: React.ReactNode }) {
  return (
    <div className="min-h-full">
      {children}
      <TelemetryConsentBanner />
    </div>
  )
}
