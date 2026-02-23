'use client'
import React from 'react'
import TelemetryConsentBanner from '@/components/TelemetryConsentBanner'
import AccessibilityAnnouncer from '@/components/ui/AccessibilityAnnouncer'
import AudioRecoveryBanner from '@/components/AudioRecoveryBanner'

export default function ClientLayout({ children }: { readonly children: React.ReactNode }) {
  return (
    <div className="min-h-full">
      <AccessibilityAnnouncer />
      {children}
      <AudioRecoveryBanner />
      <TelemetryConsentBanner />
    </div>
  )
}
