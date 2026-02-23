'use client'

import { useEffect } from 'react'
import { useAudioEngine } from '@/store/useAudioEngine'
import { usePerformanceSettings } from '@/store/usePerformanceSettings'
import { QUALITY_PROFILES } from '@/lib/quality'
import { performanceMonitor } from '@/lib/performance-monitor'
import SimpleStartOverlay from '@/components/ui/SimpleStartOverlay'
import QualityManager from '@/components/visual/QualityManager'
import AudioDebugPanel from '@/components/AudioDebugPanel'
import PluginLoader from '@/plugins/PluginLoader'
import ExperienceCommandDeck from '@/components/ui/ExperienceCommandDeck'
import MusicalCanvas from '@/components/scene/MusicalCanvas'
import MusicalSceneContent from '@/components/scene/MusicalSceneContent'

const containerStyle = {
  width: '100vw',
  height: '100vh',
  position: 'fixed',
  top: 0,
  left: 0,
  backgroundColor: '#000011',
  zIndex: 1,
} as const

const placeholderStyle = {
  width: '100%',
  height: '100%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: 'linear-gradient(135deg, #000011 0%, #001122 100%)',
} as const

const bootstrapPerformanceMonitor = () => {
  if (typeof window === 'undefined') return

  ;(window as typeof window & { performanceMonitor?: typeof performanceMonitor }).performanceMonitor =
    performanceMonitor

  const params = new URLSearchParams(window.location.search)
  if (params.get('perf') === '1') {
    performanceMonitor.start()
  }
}

export default function ImmersiveMusicalUniverse() {
  const hasUserInteracted = useAudioEngine(state => state.hasUserInteracted)
  const perfLevel = usePerformanceSettings(s => s.level)
  const profile = QUALITY_PROFILES[perfLevel]

  useEffect(() => {
    bootstrapPerformanceMonitor()
  }, [])

  return (
    <div data-testid="canvas-container" style={containerStyle}>
      {hasUserInteracted ? (
        <MusicalCanvas perfLevel={perfLevel} profile={profile}>
          <MusicalSceneContent perfLevel={perfLevel} starCountScale={profile.starCountScale} />
        </MusicalCanvas>
      ) : (
        <div style={placeholderStyle}>
          {/* Placeholder while waiting for user interaction */}
        </div>
      )}

      <SimpleStartOverlay />
      <QualityManager />
      <PluginLoader />
      {process.env.NODE_ENV === 'development' && <AudioDebugPanel />}

      {hasUserInteracted && <ExperienceCommandDeck />}
    </div>
  )
}
