'use client'
import React, { useState, useEffect, useCallback } from 'react'
import { TacticalStartOverlay } from '@/components/ui/tactical/TacticalStartOverlay'
import HelpOverlay from '@/components/ui/HelpOverlay'
import MusicalInfoOverlay from '@/components/ui/MusicalInfoOverlay'
import { useAudioEngine } from '@/store/useAudioEngine'

/**
 * OverlayManager coordinates all UI overlays and their state.
 * Handles visibility logic, keyboard shortcuts, and overlay interactions.
 */
const OverlayManager = React.memo(() => {
  const [isStartVisible, setIsStartVisible] = useState(true)
  const [showHelp, setShowHelp] = useState(false)
  const [hasInteracted, setHasInteracted] = useState(false)

  const userInteracted = useAudioEngine((state) => state.hasUserInteracted)

  useEffect(() => {
    // For development and testing, always show the overlay initially
    const isDevelopment = process.env.NODE_ENV === 'development'
    const isTesting = process.env.NODE_ENV === 'test'
    const hasSeenOverlay = localStorage.getItem('hasSeenOverlay')

    // Always show in development or testing
    if (isDevelopment || isTesting) {
      setIsStartVisible(true)
    } else if (hasSeenOverlay === 'true') {
      setIsStartVisible(false)
    }
    
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
  
  const handleStartHide = useCallback(() => {
    setIsStartVisible(false)
    setHasInteracted(true)
  }, [])
  
  const handleShowHelp = useCallback(() => {
    setShowHelp(true)
  }, [])
  
  const handleHideHelp = useCallback(() => {
    setShowHelp(false)
  }, [])
  
  return (
    <>
      {/* Start Overlay - Tactical Style */}
      <TacticalStartOverlay
        isVisible={isStartVisible && !userInteracted}
        onHide={handleStartHide}
        onShowHelp={handleShowHelp}
      />
      
      {/* Help Overlay */}
      <HelpOverlay 
        isVisible={showHelp}
        onHide={handleHideHelp}
      />
      
      {/* Musical Info Overlay - only show after interaction */}
      <MusicalInfoOverlay 
        isVisible={userInteracted && hasInteracted}
      />
    </>
  )
})

OverlayManager.displayName = 'OverlayManager'

export default OverlayManager
