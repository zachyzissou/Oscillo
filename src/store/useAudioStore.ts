import { create } from 'zustand'
import { getTone, isAudioInitialized, startAudioContext } from '../lib/audio'

interface AudioAnalysisData {
  frequencyData: Uint8Array
  timeDomainData: Uint8Array
  volume: number
  bassEnergy: number
  midEnergy: number
  trebleEnergy: number
  peakFrequency: number
  spectralCentroid: number
  rms: number
  zcr: number
  mfccs: Float32Array
}

interface AudioStoreState {
  isPlaying: boolean
  audioContext: AudioContext | null
  analyser: AnalyserNode | null
  sourceNode: AudioNode | null
  analysisData: AudioAnalysisData
  isInitialized: boolean
  
  // Actions
  initializeAudio: () => Promise<void>
  setIsPlaying: (playing: boolean) => void
  updateAnalysisData: (data: Partial<AudioAnalysisData>) => void
  connectSource: (source: AudioNode) => void
  dispose: () => void
}

const defaultAnalysisData: AudioAnalysisData = {
  frequencyData: new Uint8Array(1024),
  timeDomainData: new Uint8Array(1024),
  volume: 0,
  bassEnergy: 0,
  midEnergy: 0,
  trebleEnergy: 0,
  peakFrequency: 0,
  spectralCentroid: 0,
  rms: 0,
  zcr: 0,
  mfccs: new Float32Array(13)
}

export const useAudioStore = create<AudioStoreState>((set, get) => ({
  isPlaying: false,
  audioContext: null,
  analyser: null,
  sourceNode: null,
  analysisData: defaultAnalysisData,
  isInitialized: false,

  initializeAudio: async () => {
    if (typeof window === 'undefined') return

    try {
      if (!isAudioInitialized()) {
        await startAudioContext()
      }

      const Tone = getTone?.()
      const ctx = Tone?.getContext()?.rawContext as AudioContext | undefined

      if (!ctx) {
        throw new Error('Tone.js audio context unavailable')
      }

      const analyser = ctx.createAnalyser()
      analyser.fftSize = 2048
      analyser.smoothingTimeConstant = 0.8

      set({
        audioContext: ctx,
        analyser,
        isInitialized: true
      })

      startAnalysisLoop(analyser)
    } catch (error) {
      console.error('Failed to initialize audio:', error)
      set({ isInitialized: false, analyser: null, audioContext: null })
    }
  },

  setIsPlaying: (playing: boolean) => {
    set({ isPlaying: playing })
  },

  updateAnalysisData: (data: Partial<AudioAnalysisData>) => {
    set(state => ({
      analysisData: { ...state.analysisData, ...data }
    }))
  },

  connectSource: (source: AudioNode) => {
    const { analyser } = get()
    if (!analyser || !source) return

    try {
      source.connect(analyser)
      set({ sourceNode: source })
    } catch (error) {
      console.warn('Failed to connect audio source to analyser:', error)
    }
  },

  dispose: () => {
    const { analyser } = get()
    if (analyser) {
      try {
        analyser.disconnect()
      } catch {/* noop */}
    }
    stopAnalysisLoop()
    set({
      audioContext: null,
      analyser: null,
      sourceNode: null,
      isInitialized: false,
      isPlaying: false,
      analysisData: defaultAnalysisData
    })
  }
}))

let analysisRaf: number | null = null
let frequencyBuffer: Uint8Array | null = null
let timeDomainBuffer: Uint8Array | null = null

function startAnalysisLoop(analyser: AnalyserNode) {
  if (analysisRaf) return

  frequencyBuffer = frequencyBuffer ?? new Uint8Array(analyser.frequencyBinCount)
  timeDomainBuffer = timeDomainBuffer ?? new Uint8Array(analyser.fftSize)

  const tick = () => {
    if (!frequencyBuffer || !timeDomainBuffer) return

    analyser.getByteFrequencyData(frequencyBuffer)
    analyser.getByteTimeDomainData(timeDomainBuffer)

    const features = calculateAudioFeatures(frequencyBuffer, timeDomainBuffer, analyser.context.sampleRate)

    useAudioStore.setState((state) => ({
      analysisData: {
        ...state.analysisData,
        frequencyData: new Uint8Array(frequencyBuffer!),
        timeDomainData: new Uint8Array(timeDomainBuffer!),
        volume: features.volume ?? state.analysisData.volume,
        bassEnergy: features.bassEnergy ?? state.analysisData.bassEnergy,
        midEnergy: features.midEnergy ?? state.analysisData.midEnergy,
        trebleEnergy: features.trebleEnergy ?? state.analysisData.trebleEnergy,
        peakFrequency: features.peakFrequency ?? state.analysisData.peakFrequency,
        spectralCentroid: features.spectralCentroid ?? state.analysisData.spectralCentroid,
        rms: features.rms ?? state.analysisData.rms,
        zcr: features.zcr ?? state.analysisData.zcr,
      },
    }))

    analysisRaf = requestAnimationFrame(tick)
  }

  analysisRaf = requestAnimationFrame(tick)
}

function stopAnalysisLoop() {
  if (analysisRaf) {
    cancelAnimationFrame(analysisRaf)
    analysisRaf = null
  }
}

// Audio analysis utilities
export const calculateAudioFeatures = (
  frequencyData: Uint8Array,
  timeDomainData: Uint8Array,
  sampleRate: number = 44100
): Partial<AudioAnalysisData> => {
  const bufferLength = frequencyData.length
  
  // Calculate volume (RMS)
  let rms = 0
  for (let i = 0; i < timeDomainData.length; i++) {
    const sample = (timeDomainData[i] - 128) / 128
    rms += sample * sample
  }
  rms = Math.sqrt(rms / timeDomainData.length)
  const volume = rms

  // Calculate frequency band energies
  const bassEnd = Math.floor((250 / (sampleRate / 2)) * bufferLength)
  const midEnd = Math.floor((4000 / (sampleRate / 2)) * bufferLength)
  
  let bassEnergy = 0
  let midEnergy = 0
  let trebleEnergy = 0
  
  for (let i = 0; i < bassEnd; i++) {
    bassEnergy += frequencyData[i] / 255
  }
  for (let i = bassEnd; i < midEnd; i++) {
    midEnergy += frequencyData[i] / 255
  }
  for (let i = midEnd; i < bufferLength; i++) {
    trebleEnergy += frequencyData[i] / 255
  }
  
  bassEnergy /= bassEnd
  midEnergy /= (midEnd - bassEnd)
  trebleEnergy /= (bufferLength - midEnd)

  // Find peak frequency
  let maxMagnitude = 0
  let peakFrequency = 0
  for (let i = 0; i < bufferLength; i++) {
    if (frequencyData[i] > maxMagnitude) {
      maxMagnitude = frequencyData[i]
      peakFrequency = (i * sampleRate) / (2 * bufferLength)
    }
  }

  // Calculate spectral centroid
  let weightedSum = 0
  let magnitudeSum = 0
  for (let i = 0; i < bufferLength; i++) {
    const frequency = (i * sampleRate) / (2 * bufferLength)
    const magnitude = frequencyData[i] / 255
    weightedSum += frequency * magnitude
    magnitudeSum += magnitude
  }
  const spectralCentroid = magnitudeSum > 0 ? weightedSum / magnitudeSum : 0

  // Calculate zero crossing rate
  let zeroCrossings = 0
  for (let i = 1; i < timeDomainData.length; i++) {
    if ((timeDomainData[i-1] - 128) * (timeDomainData[i] - 128) < 0) {
      zeroCrossings++
    }
  }
  const zcr = zeroCrossings / timeDomainData.length

  return {
    volume,
    bassEnergy,
    midEnergy,
    trebleEnergy,
    peakFrequency,
    spectralCentroid,
    rms,
    zcr
  }
}
