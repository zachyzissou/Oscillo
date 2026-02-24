import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import {
  setMasterVolume as setMasterVolumeAudio,
  setChorusDepth as setChorusDepthAudio,
  setReverbWet as setReverbWetAudio,
  setDelayFeedback as setDelayFeedbackAudio,
  setBitcrusherBits as setBitcrusherBitsAudio,
  setFilterFrequency as setFilterFrequencyAudio,
} from '../lib/audio'
import { logger } from '@/lib/logger'

/**
 * Audio settings store with modern Zustand patterns.
 * Only simple primitives are persisted here to keep the state serializable.
 * Do not store Three.js, Tone.js or DOM objects.
 */

export type ScaleType = 'major' | 'minor'
export type SynthPreset = 'lead' | 'pad' | 'bass' | 'pluck'

export interface AudioSettingsState {
  // Audio parameters (primitives only)
  key: string
  scale: ScaleType
  volume: number
  bpm: number
  synthPreset: SynthPreset
  
  // Effect parameters with validation ranges
  chorusDepth: number    // 0.0 - 1.0
  reverbWet: number      // 0.0 - 1.0  
  delayFeedback: number  // 0.0 - 0.95
  bitcrusherBits: number // 2 - 16
  filterFrequency: number // 20 - 20000
  
  // Actions
  setScale: (key: string, scale: ScaleType) => void
  setVolume: (volume: number) => void
  setBpm: (bpm: number) => void
  setSynthPreset: (preset: SynthPreset) => void
  setChorusDepth: (depth: number) => void
  setReverbWet: (wet: number) => void
  setDelayFeedback: (feedback: number) => void
  setBitcrusherBits: (bits: number) => void
  setFilterFrequency: (frequency: number) => void
}

const logSettingApplyError = (setting: string, value: number, error: unknown) => {
  logger.warn({
    event: 'audio-settings.apply-failed',
    setting,
    value,
    error: error instanceof Error ? error.message : String(error),
  })
}

export const useAudioSettings = create<AudioSettingsState>()(
  subscribeWithSelector((set) => ({
    // Default values
    key: 'C',
    scale: 'major',
    volume: 0.8,
    bpm: 120,
    synthPreset: 'lead',
    chorusDepth: 0.7,
    reverbWet: 0.5,
    delayFeedback: 0.4,
    bitcrusherBits: 4,
    filterFrequency: 200,

    setScale: (key: string, scale: ScaleType) => {
      // Validate key format (A-G with optional #)
      const validKeys = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
      const validatedKey = validKeys.includes(key) ? key : 'C'
      set({ key: validatedKey, scale })
    },

    setVolume: (volume: number) => {
      const clampedVolume = Math.max(0, Math.min(1, volume))
      set({ volume: clampedVolume })
      setMasterVolumeAudio(clampedVolume).catch(error =>
        logSettingApplyError('volume', clampedVolume, error)
      )
    },

    setBpm: (bpm: number) => {
      const clampedBpm = Math.max(60, Math.min(200, bpm))
      set({ bpm: clampedBpm })
    },

    setSynthPreset: (preset: SynthPreset) => {
      set({ synthPreset: preset })
    },

    setChorusDepth: (depth: number) => {
      const clampedDepth = Math.max(0, Math.min(1, depth))
      set({ chorusDepth: clampedDepth })
      setChorusDepthAudio(clampedDepth).catch(error =>
        logSettingApplyError('chorusDepth', clampedDepth, error)
      )
    },

    setReverbWet: (wet: number) => {
      const clampedWet = Math.max(0, Math.min(1, wet))
      set({ reverbWet: clampedWet })
      setReverbWetAudio(clampedWet).catch(error =>
        logSettingApplyError('reverbWet', clampedWet, error)
      )
    },

    setDelayFeedback: (feedback: number) => {
      const clampedFeedback = Math.max(0, Math.min(0.95, feedback))
      set({ delayFeedback: clampedFeedback })
      setDelayFeedbackAudio(clampedFeedback).catch(error =>
        logSettingApplyError('delayFeedback', clampedFeedback, error)
      )
    },

    setBitcrusherBits: (bits: number) => {
      const clampedBits = Math.max(2, Math.min(16, Math.round(bits)))
      set({ bitcrusherBits: clampedBits })
      setBitcrusherBitsAudio(clampedBits).catch(error =>
        logSettingApplyError('bitcrusherBits', clampedBits, error)
      )
    },

    setFilterFrequency: (frequency: number) => {
      const clampedFrequency = Math.max(20, Math.min(20000, frequency))
      set({ filterFrequency: clampedFrequency })
      setFilterFrequencyAudio(clampedFrequency).catch(error =>
        logSettingApplyError('filterFrequency', clampedFrequency, error)
      )
    },
  }))
)
