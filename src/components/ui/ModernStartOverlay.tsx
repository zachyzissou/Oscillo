'use client'
import { useCallback, useEffect, useState } from 'react'
import { GlassPanel, NeonButton } from './ModernUITheme'
import { Music, Volume2, Info } from 'lucide-react'
import gsap from 'gsap'
import { startAudio } from '@/lib/audio/startAudio'
import { useAudioEngine } from '@/store/useAudioEngine'

const shortcuts = [
  { key: 'Space', action: 'Play/Pause' },
  { key: '1-8', action: 'Select shape' },
  { key: 'Q/W/E/R', action: 'Change sound type' },
  { key: 'A/D', action: 'Previous/Next shape' },
  { key: 'Shift + Click', action: 'Multi-select' },
  { key: 'Delete', action: 'Remove shape' },
  { key: 'Ctrl/Cmd + S', action: 'Save session' },
  { key: 'H', action: 'Toggle help' },
]

export default function ModernStartOverlay() {
  const [isVisible, setIsVisible] = useState(true)
  const [showHelp, setShowHelp] = useState(false)
  const [hasInteracted, setHasInteracted] = useState(false)
  const [isInitializingAudio, setIsInitializingAudio] = useState(false)

  console.log('[ModernStartOverlay] Component mounted, initial state:', {
    isVisible,
    showHelp,
    hasInteracted,
    NODE_ENV: process.env.NODE_ENV
  })

  const setUserInteracted = useAudioEngine(useCallback((s) => s.setUserInteracted, []))
  const setAudioContextState = useAudioEngine(useCallback((s) => s.setAudioContext, []))
  const setInitFlag = useAudioEngine(useCallback((s) => s.setIsInitializing, []))
  
  useEffect(() => {
    // For development, always show the overlay initially
    // You can clear localStorage if needed
    const isDevelopment = process.env.NODE_ENV === 'development'
    const hasSeenOverlay = localStorage.getItem('hasSeenOverlay')

    console.log('[ModernStartOverlay] useEffect check:', {
      isDevelopment,
      hasSeenOverlay,
      willHide: !isDevelopment && hasSeenOverlay === 'true'
    })

    if (!isDevelopment) {
      // Check if user has seen overlay before (only in production)
      if (hasSeenOverlay === 'true') {
        console.log('[ModernStartOverlay] Hiding overlay (production + hasSeenOverlay)')
        setIsVisible(false)
      }
    }
    // In development, always show the overlay
    
    // Keyboard shortcut handler
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 'h' && !e.ctrlKey && !e.metaKey) {
        setShowHelp(!showHelp)
      }
      if (e.key === 'Escape') {
        setShowHelp(false)
      }
    }
    
    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [showHelp])
  
  const handleStart = async () => {
    if (isInitializingAudio) return
    setUserInteracted(true)
    setIsInitializingAudio(true)
    setInitFlag(true)
    try {
      // Initialize audio context with timeout for CI environments
      const audioTimeout = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Audio initialization timeout')), 5000)
      )

      const success = await Promise.race([
        startAudio(),
        audioTimeout
      ])

      if (success) {
        setAudioContextState('running')
      }
    } catch (error) {
      console.warn('Audio initialization failed (continuing without audio):', error)
      // Continue without audio for CI environments
      setAudioContextState('suspended')
    }

    setInitFlag(false)
    setIsInitializingAudio(false)
    
    // Animate out
    const overlay = document.getElementById('start-overlay')
    if (overlay) {
      gsap.to(overlay, {
        opacity: 0,
        scale: 0.9,
        duration: 0.5,
        ease: 'power3.in',
        onComplete: () => {
          setIsVisible(false)
          setHasInteracted(true)
          localStorage.setItem('hasSeenOverlay', 'true')
        }
      })
    }
  }
  
  console.log('[ModernStartOverlay] Render check:', {
    isVisible,
    showHelp,
    willRenderNull: !isVisible && !showHelp
  })

  if (!isVisible && !showHelp) {
    console.log('[ModernStartOverlay] Returning null - component not rendered')
    return null
  }
  
  return (
    <div
      id="start-overlay"
      data-testid="start-overlay"
      className="fixed inset-0 flex items-center justify-center bg-black/80 backdrop-blur-sm"
      style={{
        zIndex: 99999,
        pointerEvents: 'auto'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && hasInteracted) {
          setShowHelp(false)
        }
      }}
    >
      <GlassPanel
        variant="neon"
        className="max-w-2xl w-full max-h-[90vh] mx-4 p-4 md:p-8 animate-in fade-in zoom-in duration-500 overflow-y-auto"
        glow
      >
        {!hasInteracted ? (
          // Welcome Screen - CI-optimized compact version
          <div className="text-center space-y-2">
            <div className="flex justify-center mb-2">
              <Music className="w-12 h-12 text-cyan-400" />
            </div>
            
            <h1 className="text-xl md:text-2xl font-bold text-white mb-1">
              Interactive 3D Music Experience
            </h1>
            <p className="text-sm text-white/80 mb-3">
              Create immersive music in a 3D space
            </p>
            
            {/* Essential button - ensure it's always visible */}
            <div className="flex flex-col items-center space-y-2">
              <NeonButton
                variant="primary"
                size="lg"
                onClick={handleStart}
                className="min-w-[180px]"
                data-testid="start-button"
                disabled={isInitializingAudio}
              >
                <Volume2 className="w-4 h-4 mr-2 inline" />
                {isInitializingAudio ? 'Starting...' : 'Start Creating'}
              </NeonButton>
              
              <button
                onClick={() => setShowHelp(true)}
                className="text-xs text-white/60 hover:text-white transition-colors"
              >
                Controls & Help →
              </button>
            </div>
          </div>
        ) : (
          // Help Screen
          <div className="space-y-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white flex items-center">
                <Info className="w-6 h-6 mr-2 text-cyan-400" />
                Keyboard Shortcuts
              </h2>
              <button
                onClick={() => setShowHelp(false)}
                className="text-white/60 hover:text-white text-2xl"
              >
                ×
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {shortcuts.map((shortcut, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between bg-white/5 rounded-lg p-3 backdrop-blur-sm"
                >
                  <kbd className="px-2 py-1 bg-white/10 rounded text-sm font-mono text-cyan-400">
                    {shortcut.key}
                  </kbd>
                  <span className="text-white/80 ml-3">{shortcut.action}</span>
                </div>
              ))}
            </div>
            
            <div className="border-t border-white/10 pt-4">
              <p className="text-sm text-white/60 text-center">
                Press <kbd className="px-2 py-1 bg-white/10 rounded text-xs">ESC</kbd> or click outside to close
              </p>
            </div>
          </div>
        )}
      </GlassPanel>
    </div>
  )
}
