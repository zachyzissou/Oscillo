'use client'
import { useState, useMemo, useCallback } from 'react'
import { useObjects } from '@/store/useObjects'
import { useAudioSettings } from '@/store/useAudioSettings'
import { useEffectSettings } from '@/store/useEffectSettings'
import { useSelectedShape } from '@/store/useSelectedShape'
import { triggerSound } from '@/lib/soundTriggers'
import Knob from './JSAudioKnobs'
import LiquidButton from './LiquidButton'
import { objectTypes, ObjectType } from '@/config/objectTypes'
import { usePerformanceSettings, PerfLevel } from '@/store/usePerformanceSettings'
import MagicMelodyButton from './MagicMelodyButton'
import JamSessionButton from './JamSessionButton'
import GenerativeMusicEngine from './GenerativeMusicEngine'
import { GlassPanel, NeonButton } from './ui/ModernUITheme'

export default function BottomDrawer() {
  // Use stable selectors to prevent infinite re-renders
  const objects = useObjects(useCallback(s => s.objects, []))
  const selected = useSelectedShape(useCallback(s => s.selected, []))
  const selectShape = useSelectedShape(useCallback(s => s.selectShape, []))
  
  const obj = useMemo(() => objects.find(o => o.id === selected), [objects, selected])
  const [mode, setMode] = useState<ObjectType>('note')
  const [playing, setPlaying] = useState(false)
  const [advanced, setAdvanced] = useState(false)
  const [showGenerative, setShowGenerative] = useState(false)
  
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

  const setEffect = useEffectSettings(useCallback(s => s.setEffect, []))
  const getParams = useEffectSettings(useCallback(s => s.getParams, []))
  const params = useMemo(() => selected ? getParams(selected) : null, [selected, getParams])


  const togglePlay = useCallback(async () => {
    if (!selected) {
      console.warn('🎵 BottomDrawer: No shape selected')
      return
    }
    const target = objects.find((o) => o.id === selected)
    if (!target) {
      console.warn('🎵 BottomDrawer: Selected object not found:', selected)
      return
    }
    
    
    if (playing && target.type === 'loop') {
      const { stopLoop } = require('@/lib/audio')
      stopLoop(selected)
      setPlaying(false)
    } else {
      const success = await triggerSound(mode as any, selected)
      setPlaying(success)
    }
  }, [selected, objects, playing, mode])

  return (
    <div className="pointer-events-none">
      <div
        className={`fixed bottom-6 left-1/2 z-40 w-full max-w-5xl -translate-x-1/2 pointer-events-auto transition-transform duration-300 ease-out px-4 sm:px-6 ${
          selected ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
        }`}
      >
        {selected && obj && (
          <GlassPanel
            variant="neon"
            glow
            className="relative flex flex-col gap-5 overflow-hidden border-white/10 bg-black/70 text-white"
          >
            <header className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-5 py-4">
              <div>
                <p className="text-xs uppercase tracking-widest text-white/60">Active Shape</p>
                <p className="text-lg font-semibold">{obj.type.toUpperCase()} · {obj.id}</p>
              </div>
              <div className="flex items-center gap-2 text-xs text-white/70">
                <span>Performance</span>
                <select 
                  value={perfLevel} 
                  onChange={e => setPerfLevel(e.target.value as PerfLevel)} 
                  className="rounded bg-white/10 px-2 py-1 text-white outline-none backdrop-blur"
                  title="Performance Level"
                >
                  <option value="low">Eco</option>
                  <option value="medium">Balanced</option>
                  <option value="high">Performance</option>
                </select>
              </div>
            </header>
            {/* Mode Selection with Liquid Buttons */}
            <div className="flex flex-wrap items-center justify-center gap-3 px-5">
              {objectTypes.map((t) => (
                <LiquidButton
                  key={t}
                  onClick={() => setMode(t)}
                  variant={mode === t ? 'primary' : 'secondary'}
                  className={`px-4 py-2 text-sm ${mode === t ? 'ring-2 ring-white/50' : ''}`}
                >
                  {t.toUpperCase()}
                </LiquidButton>
              ))}
            </div>

            {/* Play/Pause Button */}
            <div className="flex justify-center px-5">
              <NeonButton
                onClick={togglePlay}
                variant={playing ? 'secondary' : 'primary'}
                size="lg"
                className="min-w-[180px]"
              >
                {playing ? 'Pause' : 'Play'}
              </NeonButton>
            </div>

            {/* Enhanced Feature Toggle Row */}
            <div className="flex flex-wrap items-center justify-between gap-4 border-y border-white/10 px-5 py-3 text-sm">
              <div className="flex items-center gap-4 text-white/80">
                <label className="flex items-center gap-2 text-sm">
                  <input 
                    type="checkbox" 
                    checked={advanced} 
                    onChange={() => setAdvanced(a => !a)}
                    className="w-4 h-4 rounded border-2 border-purple-500 bg-transparent checked:bg-purple-500"
                    title="Advanced Controls"
                  />
                  <span className="text-purple-200">Advanced</span>
                </label>
                
                <label className="flex items-center gap-2 text-sm">
                  <input 
                    type="checkbox" 
                    checked={showGenerative} 
                    onChange={() => setShowGenerative(g => !g)}
                    className="w-4 h-4 rounded border-2 border-blue-500 bg-transparent checked:bg-blue-500"
                    title="AI Generative Music"
                  />
                  <span className="text-blue-200">🎼 AI Music</span>
                </label>
              </div>
            </div>
            <div className="flex gap-4 overflow-x-auto px-5 py-2">
              <Knob label="Vol" min={0} max={1} step={0.01} value={volume} onChange={(e) => setVolume(parseFloat(e.target.value))} />
              {advanced && (
                <>
                  <Knob label="Chorus" min={0} max={1} step={0.01} value={chorusDepth} onChange={(e) => setChorusDepth(parseFloat(e.target.value))} />
                  <Knob label="Delay" min={0} max={1} step={0.01} value={delayFeedback} onChange={(e) => setDelayFeedback(parseFloat(e.target.value))} />
                  <Knob label="Bits" min={1} max={16} step={1} value={bitcrusherBits} onChange={(e) => setBitcrusherBits(parseInt(e.target.value, 10))} />
                </>
              )}
              <Knob label="Reverb" min={0} max={1} step={0.01} value={reverbWet} onChange={(e) => setReverbWet(parseFloat(e.target.value))} />
              <Knob label="Filter" min={20} max={1000} step={10} value={filterFrequency} onChange={(e) => setFilterFrequency(parseFloat(e.target.value))} />
            </div>
            {params && selected && (
              <div className="flex gap-4 overflow-x-auto px-5 pb-2">
                <Knob label="Reverb" min={0} max={1} step={0.01} value={params.reverb} onChange={(e) => setEffect(selected, { reverb: parseFloat(e.target.value) })} />
                <Knob label="Delay" min={0} max={1} step={0.01} value={params.delay} onChange={(e) => setEffect(selected, { delay: parseFloat(e.target.value) })} />
                <Knob label="Lowpass" min={100} max={20000} step={100} value={params.lowpass} onChange={(e) => setEffect(selected, { lowpass: parseFloat(e.target.value) })} />
                <Knob label="Highpass" min={0} max={1000} step={10} value={params.highpass} onChange={(e) => setEffect(selected, { highpass: parseFloat(e.target.value) })} />
              </div>
            )}
            
            {/* Generative Music Engine */}
            {showGenerative && (
              <div className="px-5">
                <GenerativeMusicEngine isPlaying={playing} />
              </div>
            )}
            
            <div className="flex flex-wrap items-center justify-between gap-3 px-5 pb-4">
              <div className="flex items-center gap-3">
                <MagicMelodyButton />
                <JamSessionButton />
              </div>
              <div className="flex items-center gap-2">
                <NeonButton variant="secondary" size="sm" onClick={togglePlay}>
                  {playing ? 'Pause Playback' : 'Preview Note'}
                </NeonButton>
                <NeonButton variant="accent" size="sm" onClick={() => selectShape(null)}>
                  Close
                </NeonButton>
              </div>
            </div>
          </GlassPanel>
        )}
      </div>
    </div>
  )
}
