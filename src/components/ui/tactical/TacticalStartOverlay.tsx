'use client'
import React, { useState } from 'react'
import { TacticalPanel, CornerBrackets, TacticalButton, StatusIndicator, NeonDivider } from './TacticalPrimitives'
import { useAudioInitializer } from '@/components/audio/AudioInitializer'
import { Play, HelpCircle } from 'lucide-react'

interface TacticalStartOverlayProps {
  isVisible: boolean
  onHide: () => void
  onShowHelp: () => void
}

export const TacticalStartOverlay: React.FC<TacticalStartOverlayProps> = ({
  isVisible,
  onHide,
  onShowHelp
}) => {
  const [isInitializing, setIsInitializing] = useState(false)
  const { initializeAudio } = useAudioInitializer()

  const handleStart = async () => {
    if (isInitializing) return

    setIsInitializing(true)
    await initializeAudio()
    setIsInitializing(false)

    // Fade out
    const overlay = document.getElementById('tactical-start-overlay')
    if (overlay) {
      overlay.style.transition = 'opacity 0.5s ease'
      overlay.style.opacity = '0'
      setTimeout(() => {
        onHide()
        localStorage.setItem('hasSeenOverlay', 'true')
      }, 500)
    }
  }

  if (!isVisible) return null

  return (
    <div
      id="tactical-start-overlay"
      data-testid="start-overlay"
      className="fixed inset-0 z-[99999] bg-black bg-tactical-primary flex items-center justify-center"
      style={{ pointerEvents: 'auto' }}
    >
      {/* Background Grid */}
      <div className="absolute inset-0 tactical-grid opacity-20" />

      {/* Scan Lines */}
      <div className="absolute inset-0 scanlines opacity-30" />

      {/* Main Panel */}
      <div className="relative z-10 w-full max-w-3xl mx-4">
        <CornerBrackets>
          <TacticalPanel className="p-12" scanlines>
            {/* Header */}
            <div className="text-center mb-8">
              <div className="tactical-text-display text-4xl text-neon-cyan mb-2 glow-md">
                OSCILLO
              </div>
              <div className="tactical-text-mono text-sm text-secondary tracking-wider">
                INTERACTIVE MUSIC SYNTHESIS PLATFORM
              </div>
              <div className="mt-4">
                <StatusIndicator status="info" label="SYSTEM STANDBY" />
              </div>
            </div>

            <NeonDivider className="my-8" />

            {/* System Info */}
            <div className="tactical-text-mono text-xs text-secondary space-y-2 mb-8">
              <div className="flex justify-between">
                <span>Audio Engine:</span>
                <span className="text-neon-green">Web Audio API</span>
              </div>
              <div className="flex justify-between">
                <span>Rendering:</span>
                <span className="text-neon-green">WebGL 2.0</span>
              </div>
              <div className="flex justify-between">
                <span>Synthesis:</span>
                <span className="text-neon-green">Tone.js v15</span>
              </div>
              <div className="flex justify-between">
                <span>Status:</span>
                <span className="text-neon-cyan">READY</span>
              </div>
            </div>

            <NeonDivider className="my-8" />

            {/* Notice */}
            <div className="bg-tactical-tertiary border border-neon-yellow/30 p-4 mb-8">
              <div className="tactical-text-mono text-xs text-neon-yellow">
                <div className="flex items-start gap-2">
                  <span className="mt-0.5">⚠</span>
                  <div>
                    <div className="font-bold mb-1">AUDIO INITIALIZATION REQUIRED</div>
                    <div className="text-secondary">
                      User interaction needed to start audio context due to browser autoplay policies.
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-center gap-4">
              <TacticalButton
                variant="primary"
                onClick={handleStart}
                disabled={isInitializing}
                className="px-12 py-4 text-lg"
                data-testid="start-button"
              >
                <Play className="w-5 h-5 inline mr-3" />
                {isInitializing ? 'INITIALIZING...' : 'INITIALIZE SYSTEM'}
              </TacticalButton>

              <TacticalButton onClick={onShowHelp}>
                <HelpCircle className="w-4 h-4 inline mr-2" />
                HELP
              </TacticalButton>
            </div>

            {/* Footer */}
            <div className="mt-8 text-center">
              <div className="tactical-text-mono text-xs text-dim">
                v2.0.0 | EXPERIMENTAL BUILD
              </div>
            </div>
          </TacticalPanel>
        </CornerBrackets>
      </div>
    </div>
  )
}
