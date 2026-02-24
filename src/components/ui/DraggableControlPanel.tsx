'use client'
import { useState, useCallback } from 'react'
import { useObjects } from '@/store/useObjects'
import { useAudioSettings } from '@/store/useAudioSettings'
import { useSelectedShape } from '@/store/useSelectedShape'
import { usePerformanceSettings, PerfLevel } from '@/store/usePerformanceSettings'
import { triggerSound } from '@/lib/soundTriggers'
import FloatingPanel from './FloatingPanel'
import Knob from '../JSAudioKnobs'
import LiquidButton from '../LiquidButton'
import { objectTypes, ObjectType } from '@/config/objectTypes'

interface DraggableControlPanelProps {
  position?: [number, number, number]
  orbitRadius?: number
  orbitSpeed?: number
  theme?: 'cyber' | 'glass' | 'neon' | 'plasma'
  onClose?: () => void
}

export default function DraggableControlPanel({
  position = [2, 1, -3],
  orbitRadius = 0,
  orbitSpeed = 0,
  theme = 'cyber',
  onClose
}: DraggableControlPanelProps) {
  const objects = useObjects(useCallback(s => s.objects, []))
  const selected = useSelectedShape(useCallback(s => s.selected, []))
  const selectShape = useSelectedShape(useCallback(s => s.selectShape, []))
  
  const [mode, setMode] = useState<ObjectType>('note')
  const [playing, setPlaying] = useState(false)
  const [advanced, setAdvanced] = useState(false)

  const perfLevel = usePerformanceSettings(useCallback(s => s.level, []))
  const setPerfLevel = usePerformanceSettings(useCallback(s => s.setLevel, []))

  const volume = useAudioSettings(useCallback(s => s.volume, []))
  const setVolume = useAudioSettings(useCallback(s => s.setVolume, []))
  const chorusDepth = useAudioSettings(useCallback(s => s.chorusDepth, []))
  const setChorusDepth = useAudioSettings(useCallback(s => s.setChorusDepth, []))
  const delayFeedback = useAudioSettings(useCallback(s => s.delayFeedback, []))
  const setDelayFeedback = useAudioSettings(useCallback(s => s.setDelayFeedback, []))
  const reverbWet = useAudioSettings(useCallback(s => s.reverbWet, []))
  const setReverbWet = useAudioSettings(useCallback(s => s.setReverbWet, []))
  const bitcrusherBits = useAudioSettings(useCallback(s => s.bitcrusherBits, []))
  const setBitcrusherBits = useAudioSettings(useCallback(s => s.setBitcrusherBits, []))
  const filterFrequency = useAudioSettings(useCallback(s => s.filterFrequency, []))
  const setFilterFrequency = useAudioSettings(useCallback(s => s.setFilterFrequency, []))

  const togglePlay = useCallback(async () => {
    if (!selected) return
    
    const target = objects.find((o) => o.id === selected)
    if (!target) return
    
    if (playing && target.type === 'loop') {
      const { stopLoop } = require('@/lib/audio')
      stopLoop(selected)
      setPlaying(false)
    } else {
      const success = await triggerSound(mode as any, selected)
      setPlaying(success)
    }
  }, [selected, objects, playing, mode])

  const selectedObject = objects.find(o => o.id === selected)

  return (
    <FloatingPanel
      position={position}
      title="🎛️ Audio Controls"
      theme={theme}
      orbitRadius={orbitRadius}
      orbitSpeed={orbitSpeed}
      onClose={onClose}
      className="max-w-[380px]"
    >
      <div className="space-y-4">
        {/* Selected Object Info */}
        {selectedObject ? (
          <div className="text-center p-3 rounded-lg bg-white/10 border border-white/20">
            <div className="text-sm opacity-70">Selected Object</div>
            <div className="font-bold text-lg">{selectedObject.type.toUpperCase()}</div>
            <div className="text-xs opacity-50">ID: {selectedObject.id.slice(0, 8)}...</div>
          </div>
        ) : (
          <div className="text-center p-3 rounded-lg bg-red-500/20 border border-red-500/30">
            <div className="text-red-200">No object selected</div>
            <div className="text-xs opacity-70">Click a 3D shape to control it</div>
          </div>
        )}

        {selectedObject && (
          <>
            {/* Mode Selection */}
            <div className="space-y-2">
              <div className="text-sm font-semibold opacity-80">Sound Mode</div>
              <div className="grid grid-cols-2 gap-2">
                {objectTypes.map((t) => (
                  <LiquidButton
                    key={t}
                    onClick={() => setMode(t)}
                    variant={mode === t ? 'primary' : 'secondary'}
                    className={`px-3 py-2 text-sm ${
                      mode === t ? 'ring-1 ring-current' : ''
                    }`}
                  >
                    {t.toUpperCase()}
                  </LiquidButton>
                ))}
              </div>
            </div>

            {/* Play Controls */}
            <div className="flex justify-center">
              <LiquidButton
                onClick={togglePlay}
                variant="accent"
                className="px-6 py-3 text-base font-bold"
              >
                {playing ? '⏸️ PAUSE' : '▶️ PLAY'}
              </LiquidButton>
            </div>

            {/* Settings */}
            <div className="flex items-center justify-between py-2">
              <label className="flex items-center gap-2 text-sm">
                <input 
                  type="checkbox" 
                  checked={advanced} 
                  onChange={() => setAdvanced(a => !a)}
                  className="w-4 h-4 rounded border-2 border-current bg-transparent checked:bg-current"
                />
                <span>Advanced Controls</span>
              </label>
              
              <select 
                value={perfLevel} 
                onChange={e => setPerfLevel(e.target.value as PerfLevel)} 
                className="text-black rounded px-2 py-1 text-xs bg-white/90"
              >
                <option value="low">Eco Mode</option>
                <option value="medium">Balanced</option>
                <option value="high">Performance</option>
              </select>
            </div>

            {/* Audio Controls */}
            <div className="space-y-3">
              <div className="text-sm font-semibold opacity-80">Audio Controls</div>
              
              {/* Primary Controls */}
              <div className="grid grid-cols-2 gap-3">
                <Knob 
                  label="Volume" 
                  min={0} max={1} step={0.01} 
                  value={volume} 
                  onChange={(e) => setVolume(parseFloat(e.target.value))} 
                />
                <Knob 
                  label="Reverb" 
                  min={0} max={1} step={0.01} 
                  value={reverbWet} 
                  onChange={(e) => setReverbWet(parseFloat(e.target.value))} 
                />
              </div>

              {/* Filter */}
              <div className="w-full">
                <Knob 
                  label="Filter" 
                  min={20} max={1000} step={10} 
                  value={filterFrequency} 
                  onChange={(e) => setFilterFrequency(parseFloat(e.target.value))} 
                  className="w-full"
                />
              </div>

              {/* Advanced Controls */}
              {advanced && (
                <div className="space-y-3 pt-2 border-t border-white/20">
                  <div className="text-xs opacity-60">Advanced Effects</div>
                  <div className="grid grid-cols-2 gap-3">
                    <Knob 
                      label="Chorus" 
                      min={0} max={1} step={0.01} 
                      value={chorusDepth} 
                      onChange={(e) => setChorusDepth(parseFloat(e.target.value))} 
                    />
                    <Knob 
                      label="Delay" 
                      min={0} max={1} step={0.01} 
                      value={delayFeedback} 
                      onChange={(e) => setDelayFeedback(parseFloat(e.target.value))} 
                    />
                  </div>
                  <div className="w-full">
                    <Knob 
                      label="Bitcrusher" 
                      min={1} max={16} step={1} 
                      value={bitcrusherBits} 
                      onChange={(e) => setBitcrusherBits(parseInt(e.target.value, 10))} 
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Quick Actions */}
            <div className="flex gap-2 pt-2 border-t border-white/20">
              <button 
                onClick={() => selectShape(null)} 
                className="px-3 py-1 text-xs bg-white/10 hover:bg-white/20 rounded transition-colors"
              >
                Deselect
              </button>
              <div className="flex-1" />
              <div className="text-xs opacity-50">
                Drag to move • Click to minimize
              </div>
            </div>
          </>
        )}
      </div>
    </FloatingPanel>
  )
}
