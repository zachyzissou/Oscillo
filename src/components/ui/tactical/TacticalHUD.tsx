'use client'
import React, { useState, useEffect } from 'react'
import { useAudioEngine } from '@/store/useAudioEngine'
import {
  TacticalPanel,
  MetricDisplay,
  StatusIndicator,
  NeonDivider,
  TacticalButton,
  MetricGrid,
  TacticalProgress
} from './TacticalPrimitives'
import { Play, Pause, Square, Volume2, VolumeX, Settings } from 'lucide-react'

// ============================================================================
// METRICS BAR (Top bar with main audio metrics)
// ============================================================================

export const MetricsBar: React.FC = () => {
  const hasUserInteracted = useAudioEngine((s) => s.hasUserInteracted)
  const audioContext = useAudioEngine((s) => s.audioContext)
  const [bpm, setBpm] = useState(120)
  const [activeVoices, setActiveVoices] = useState(0)
  const [cpuLoad, setCpuLoad] = useState(0)

  // Simulate metrics (replace with real audio engine data)
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveVoices(Math.floor(Math.random() * 8))
      setCpuLoad(Math.random() * 45 + 10)
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  const status = audioContext === 'running' ? 'success' :
                audioContext === 'suspended' ? 'warning' : 'error'

  return (
    <TacticalPanel className="fixed top-0 left-0 right-0 z-50 border-b border-t-0 border-x-0 pointer-events-auto">
      <div className="flex items-center justify-between px-4 py-3">
        {/* Left: System Status */}
        <div className="flex items-center gap-6">
          <div className="tactical-text-display text-lg text-neon-cyan">
            OSCILLO
          </div>
          <StatusIndicator
            status={status}
            label={hasUserInteracted ? 'ACTIVE' : 'STANDBY'}
          />
          <NeonDivider vertical className="h-8" />
        </div>

        {/* Center: Main Metrics */}
        <div className="flex items-center gap-8">
          <MetricDisplay value={bpm} label="BPM" unit="♪" color="cyan" />
          <MetricDisplay value={activeVoices} label="VOICES" color="green" />
          <MetricDisplay value={cpuLoad.toFixed(1)} label="CPU" unit="%" color="yellow" />
        </div>

        {/* Right: Secondary Info */}
        <div className="flex items-center gap-4">
          <div className="text-xs tactical-text-mono text-secondary">
            {new Date().toLocaleTimeString('en-US', {
              hour12: false,
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit'
            })}
          </div>
        </div>
      </div>
    </TacticalPanel>
  )
}

// ============================================================================
// MASTER CONTROL PANEL (Bottom bar)
// ============================================================================

export const MasterControlPanel: React.FC = () => {
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [volume, setVolume] = useState(75)

  return (
    <TacticalPanel className="fixed bottom-0 left-0 right-0 z-50 border-t border-b-0 border-x-0 pointer-events-auto">
      <div className="flex items-center justify-between px-6 py-4">
        {/* Left: Playback Controls */}
        <div className="flex items-center gap-3">
          <TacticalButton
            variant="primary"
            onClick={() => setIsPlaying(!isPlaying)}
            className="px-6"
          >
            {isPlaying ? (
              <><Pause className="w-4 h-4 inline mr-2" />PAUSE</>
            ) : (
              <><Play className="w-4 h-4 inline mr-2" />PLAY</>
            )}
          </TacticalButton>

          <TacticalButton onClick={() => setIsPlaying(false)}>
            <Square className="w-4 h-4 inline mr-2" />STOP
          </TacticalButton>

          <NeonDivider vertical className="h-8 mx-2" />

          <TacticalButton onClick={() => setIsMuted(!isMuted)}>
            {isMuted ? (
              <VolumeX className="w-4 h-4 inline" />
            ) : (
              <Volume2 className="w-4 h-4 inline" />
            )}
          </TacticalButton>

          {/* Volume Slider */}
          <div className="flex items-center gap-2 min-w-[120px]">
            <div className="text-xs tactical-text-mono text-neon-cyan">{volume}%</div>
            <TacticalProgress value={volume} className="flex-1" />
          </div>
        </div>

        {/* Center: Status Message */}
        <div className="terminal-text text-neon-green text-xs">
          <span className="text-neon-cyan">&gt;</span> SYSTEM READY - AWAITING INPUT
        </div>

        {/* Right: Settings */}
        <div className="flex items-center gap-3">
          <TacticalButton>
            <Settings className="w-4 h-4 inline mr-2" />SETTINGS
          </TacticalButton>
        </div>
      </div>
    </TacticalPanel>
  )
}

// ============================================================================
// SIDE PANEL - Activity Monitor
// ============================================================================

interface ActivityLog {
  timestamp: string
  message: string
  type: 'info' | 'success' | 'warning' | 'error'
}

export const ActivityMonitor: React.FC = () => {
  const [logs, setLogs] = useState<ActivityLog[]>([
    { timestamp: '14:23:45', message: 'Audio engine initialized', type: 'success' },
    { timestamp: '14:23:46', message: 'Loading preset: Ambient Pad', type: 'info' },
    { timestamp: '14:23:48', message: 'MIDI device connected', type: 'success' },
  ])

  const colorMap = {
    info: 'text-neon-cyan',
    success: 'text-neon-green',
    warning: 'text-neon-yellow',
    error: 'text-neon-red'
  }

  return (
    <TacticalPanel framed className="h-full overflow-hidden flex flex-col">
      <div className="tactical-text-display text-sm mb-4 text-neon-cyan">
        ACTIVITY LOG
      </div>

      <div className="flex-1 overflow-y-auto space-y-2">
        {logs.map((log, i) => (
          <div key={i} className="flex gap-3 text-xs tactical-text-mono">
            <span className="text-secondary">{log.timestamp}</span>
            <span className={colorMap[log.type]}>{log.message}</span>
          </div>
        ))}
      </div>
    </TacticalPanel>
  )
}

// ============================================================================
// MAIN HUD CONTAINER
// ============================================================================

export const TacticalHUDContainer: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="fixed inset-0 pointer-events-none" style={{ width: '100vw', height: '100vh', zIndex: 40 }}>
      {/* Metrics Bar - Fixed at top with z-50 from component */}
      <MetricsBar />

      {/* Main Content Area - 3D Canvas fills space between top and bottom bars */}
      <div
        className="absolute left-0 right-0 pointer-events-auto"
        style={{
          top: '72px',
          bottom: '88px',
          width: '100vw',
          height: 'calc(100vh - 160px)',
          zIndex: 10
        }}
      >
        {children}
      </div>

      {/* Master Control Panel - Fixed at bottom with z-50 from component */}
      <MasterControlPanel />

      {/* Activity Monitor - Absolute positioned on right side with z-50 from component */}
      <div className="absolute right-4 top-[88px] w-80 h-96 pointer-events-auto z-50">
        <ActivityMonitor />
      </div>
    </div>
  )
}
