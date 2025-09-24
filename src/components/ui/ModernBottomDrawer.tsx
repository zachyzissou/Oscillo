'use client'
import { useState, useEffect, useRef } from 'react'
import { useObjects } from '@/store/useObjects'
import { useAudioSettings } from '@/store/useAudioSettings'
import { useSelectedShape } from '@/store/useSelectedShape'
import { usePerformanceSettings } from '@/store/usePerformanceSettings'
import { triggerSound } from '@/lib/soundTriggers'
import { useTelemetryConsent } from '@/store/useTelemetryConsent'
import { GlassPanel, NeonButton, NeonSlider, NeonToggle, Tooltip } from './ModernUITheme'
import { Music, Volume2, Sliders, Cpu, Sparkles, Grid3X3, Headphones, Mic } from 'lucide-react'
import gsap from 'gsap'
import { cn } from '@/lib/utils'

// Tab navigation
const tabs = [
  { id: 'play', label: 'Play', icon: Music },
  { id: 'effects', label: 'Effects', icon: Sparkles },
  { id: 'mix', label: 'Mix', icon: Sliders },
  { id: 'settings', label: 'Settings', icon: Cpu },
]

export default function ModernBottomDrawer() {
  const objects = useObjects(s => s.objects)
  const selected = useSelectedShape(s => s.selected)
  const selectShape = useSelectedShape(s => s.selectShape)
  const selectedObject = objects.find(o => o.id === selected)
  
  const [activeTab, setActiveTab] = useState('play')
  const [isExpanded, setIsExpanded] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const drawerRef = useRef<HTMLDivElement>(null)
  
  // Audio settings
  const { volume, key, bpm, scale } = useAudioSettings()
  const setVolume = useAudioSettings(s => s.setVolume)
  const setKey = useAudioSettings(s => s.setKey)
  const setBpm = useAudioSettings(s => s.setBpm)
  const setScale = useAudioSettings(s => s.setScale)
  
  // Performance settings
  const perfLevel = usePerformanceSettings(s => s.level)
  const setPerfLevel = usePerformanceSettings(s => s.setLevel)

  const telemetryHydrate = useTelemetryConsent((s) => s.hydrate)
  const telemetryHydrated = useTelemetryConsent((s) => s.hydrated)
  const analyticsEnabled = useTelemetryConsent((s) => s.analyticsEnabled)
  const allowAnalytics = useTelemetryConsent((s) => s.allowAnalytics)
  const denyAnalytics = useTelemetryConsent((s) => s.denyAnalytics)
  
  // Animate drawer on selection change
  useEffect(() => {
    if (drawerRef.current) {
      if (selected) {
        gsap.to(drawerRef.current, {
          y: 0,
          duration: 0.5,
          ease: 'power3.out'
        })
      } else {
        gsap.to(drawerRef.current, {
          y: '100%',
          duration: 0.3,
          ease: 'power3.in'
        })
      }
    }
  }, [selected])

  useEffect(() => {
    telemetryHydrate()
  }, [telemetryHydrate])
  
  const handlePlay = async () => {
    if (!selectedObject) return
    
    const success = await triggerSound(selectedObject.type, selectedObject.id)
    if (success) {
      setIsPlaying(true)
      // Visual feedback
      const button = document.getElementById('play-button')
      if (button) {
        gsap.to(button, {
          scale: 1.2,
          duration: 0.1,
          yoyo: true,
          repeat: 1,
          ease: 'power2.inOut'
        })
      }
    }
  }
  
  const handleExpand = () => {
    setIsExpanded(!isExpanded)
    if (drawerRef.current) {
      gsap.to(drawerRef.current, {
        height: isExpanded ? '200px' : '400px',
        duration: 0.3,
        ease: 'power2.inOut'
      })
    }
  }

  if (!selected || !selectedObject) return null

  return (
    <div
      ref={drawerRef}
      className="fixed bottom-0 left-0 right-0 z-50 transform translate-y-full"
      style={{ height: '200px' }}
    >
      <GlassPanel variant="neon" className="h-full rounded-t-3xl border-t-2" glow>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-white/10">
            <div className="flex items-center space-x-3">
              <div className={cn(
                "w-3 h-3 rounded-full animate-pulse",
                selectedObject.type === 'note' ? 'bg-cyan-500' :
                selectedObject.type === 'chord' ? 'bg-purple-500' :
                selectedObject.type === 'beat' ? 'bg-yellow-500' : 'bg-green-500'
              )} />
              <h3 className="text-lg font-bold text-white">
                {selectedObject.type.charAt(0).toUpperCase() + selectedObject.type.slice(1)}
                {selectedObject.noteValue && ` - ${selectedObject.noteValue}`}
              </h3>
            </div>
            
            <div className="flex items-center space-x-2">
              <Tooltip content={isExpanded ? "Collapse" : "Expand"}>
                <button
                  onClick={handleExpand}
                  className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
                >
                  <Grid3X3 className="w-4 h-4 text-white" />
                </button>
              </Tooltip>
              
              <Tooltip content="Close">
                <button
                  onClick={() => selectShape(null)}
                  className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
                >
                  ×
                </button>
              </Tooltip>
            </div>
          </div>
          
          {/* Tab Navigation */}
          <div className="flex border-b border-white/10">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex-1 flex items-center justify-center space-x-2 py-3 transition-all duration-300",
                  activeTab === tab.id
                    ? "bg-gradient-to-t from-cyan-500/20 to-transparent text-cyan-400 border-b-2 border-cyan-400"
                    : "text-white/60 hover:text-white hover:bg-white/5"
                )}
              >
                <tab.icon className="w-4 h-4" />
                <span className="text-sm font-medium">{tab.label}</span>
              </button>
            ))}
          </div>
          
          {/* Content */}
          <div className="flex-1 p-4 overflow-y-auto">
            {activeTab === 'play' && (
              <div className="space-y-4">
                <div className="flex justify-center">
                  <NeonButton
                    id="play-button"
                    variant="primary"
                    size="lg"
                    onClick={handlePlay}
                    className="min-w-[200px]"
                  >
                    {isPlaying ? '⏸ Pause' : '▶️ Play'}
                  </NeonButton>
                </div>
                
                {isExpanded && (
                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <NeonButton variant="secondary" size="md">
                      <Headphones className="w-4 h-4 mr-2 inline" />
                      Solo
                    </NeonButton>
                    <NeonButton variant="accent" size="md">
                      <Mic className="w-4 h-4 mr-2 inline" />
                      Record
                    </NeonButton>
                  </div>
                )}
              </div>
            )}
            
            {activeTab === 'effects' && (
              <div className="space-y-4">
                <NeonSlider
                  label="Reverb"
                  value={0.3}
                  onChange={() => {}}
                  color="#ff00ff"
                />
                <NeonSlider
                  label="Delay"
                  value={0.2}
                  onChange={() => {}}
                  color="#00ffff"
                />
                <NeonSlider
                  label="Distortion"
                  value={0}
                  onChange={() => {}}
                  color="#ffff00"
                />
                {isExpanded && (
                  <>
                    <NeonSlider
                      label="Chorus"
                      value={0.1}
                      onChange={() => {}}
                      color="#00ff00"
                    />
                    <NeonSlider
                      label="Filter Cutoff"
                      value={0.7}
                      onChange={() => {}}
                      min={0}
                      max={1}
                      color="#ff6600"
                    />
                  </>
                )}
              </div>
            )}
            
            {activeTab === 'mix' && (
              <div className="space-y-4">
                <NeonSlider
                  label="Master Volume"
                  value={volume}
                  onChange={setVolume}
                  color="#ffffff"
                  unit="%"
                />
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-white/60 mb-1 block">Key</label>
                    <select
                      value={key}
                      onChange={(e) => setKey(e.target.value)}
                      className="w-full bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg px-3 py-2 text-white"
                    >
                      {['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'].map(k => (
                        <option key={k} value={k}>{k}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-sm text-white/60 mb-1 block">Scale</label>
                    <select
                      value={scale}
                      onChange={(e) => setScale(e.target.value as any)}
                      className="w-full bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg px-3 py-2 text-white"
                    >
                      <option value="major">Major</option>
                      <option value="minor">Minor</option>
                      <option value="pentatonic">Pentatonic</option>
                      <option value="blues">Blues</option>
                    </select>
                  </div>
                </div>
                <NeonSlider
                  label="BPM"
                  value={bpm}
                  onChange={setBpm}
                  min={60}
                  max={200}
                  step={1}
                  color="#ff00ff"
                />
              </div>
            )}
            
            {activeTab === 'settings' && (
              <div className="space-y-4">
                <div>
                  <label className="text-sm text-white/60 mb-2 block">Performance</label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['low', 'medium', 'high'] as const).map(level => (
                      <NeonButton
                        key={level}
                        variant={perfLevel === level ? 'primary' : 'secondary'}
                        size="sm"
                        onClick={() => setPerfLevel(level)}
                      >
                        {level.charAt(0).toUpperCase() + level.slice(1)}
                      </NeonButton>
                    ))}
                  </div>
                </div>
                
                <div className="space-y-2">
                  <NeonToggle
                    label="Haptic Feedback"
                    checked={false}
                    onChange={() => {}}
                    color="#00ffff"
                  />
                  <NeonToggle
                    label="Share anonymous telemetry"
                    checked={analyticsEnabled}
                    disabled={!telemetryHydrated}
                    onChange={(value) => {
                      if (value) allowAnalytics()
                      else denyAnalytics()
                    }}
                    color="#00ff00"
                  />
                  <NeonToggle
                    label="Show FPS"
                    checked={false}
                    onChange={() => {}}
                    color="#ffff00"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </GlassPanel>
    </div>
  )
}
