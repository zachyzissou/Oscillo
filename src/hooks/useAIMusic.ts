/**
 * React Hook for AI Music Generation Integration
 * Provides seamless integration between AI models and the musical interface
 */

import { useState, useCallback, useRef, useEffect } from 'react'
import { AIMusicGenerator, AIGenerationConfig, AIMusicalPhrase } from '../lib/ai-music-generator'
import { getAnalyserBands } from '../lib/analyser'
import { useMusicalPalette } from '../store/useMusicalPalette'
import { logger } from '@/lib/logger'

export interface AIGenerationState {
  isGenerating: boolean
  lastGenerated: Date | null
  error: string | null
  modelStatus: Record<string, boolean>
}

export interface AIComposition {
  melody: AIMusicalPhrase | null
  harmony: AIMusicalPhrase | null  
  rhythm: AIMusicalPhrase | null
  texture: AIMusicalPhrase | null
  generatedAt: Date
  config: AIGenerationConfig
}

export interface AIGenerationOptions {
  temperature?: number
  steps?: number
  style?: 'classical' | 'jazz' | 'electronic' | 'ambient' | 'experimental'
  rhythmComplexity?: number
  harmonicComplexity?: number
  useAudioAnalysis?: boolean
}

const stringifyError = (error: unknown) =>
  error instanceof Error ? error.message : String(error)

export function useAIMusic() {
  const { key, scale } = useMusicalPalette()
  const generatorRef = useRef<AIMusicGenerator | null>(null)
  const [state, setState] = useState<AIGenerationState>({
    isGenerating: false,
    lastGenerated: null,
    error: null,
    modelStatus: {}
  })
  
  const [currentComposition, setCurrentComposition] = useState<AIComposition | null>(null)
  const [generationHistory, setGenerationHistory] = useState<AIComposition[]>([])

  // Initialize AI generator
  useEffect(() => {
    const initGenerator = async () => {
      if (!generatorRef.current) {
        generatorRef.current = new AIMusicGenerator()
        const success = await generatorRef.current.initialize()
        
        if (success) {
          setState(prev => ({
            ...prev,
            modelStatus: generatorRef.current!.getModelStatus()
          }))
        } else {
          setState(prev => ({
            ...prev,
            error: 'Failed to initialize AI music generator'
          }))
        }
      }
    }

    initGenerator()

    return () => {
      if (generatorRef.current) {
        generatorRef.current.dispose()
      }
    }
  }, [])

  // Generate a single musical phrase
  const generatePhrase = useCallback(async (
    type: 'melody' | 'harmony' | 'rhythm' | 'texture',
    options: AIGenerationOptions = {}
  ): Promise<AIMusicalPhrase | null> => {
    if (!generatorRef.current) return null

    setState(prev => ({ ...prev, isGenerating: true, error: null }))

    try {
      // Get current audio analysis if requested
      let audioAnalysis = undefined
      if (options.useAudioAnalysis) {
        try {
          const bands = getAnalyserBands()
          audioAnalysis = {
            bass: bands.bass,
            mid: bands.mid,
            treble: bands.treble,
            energy: (bands.bass + bands.mid + bands.treble) / (3 * 255)
          }
        } catch (error) {
          logger.warn({
            event: 'ai-music.audio-analysis-unavailable',
            context: 'generate-phrase',
            error: stringifyError(error),
          })
        }
      }

      const config: AIGenerationConfig = {
        temperature: options.temperature ?? 0.7,
        steps: options.steps ?? 16,
        keySignature: key,
        scaleType: scale as any,
        style: options.style ?? 'electronic',
        rhythmComplexity: options.rhythmComplexity ?? 0.5,
        harmonicComplexity: options.harmonicComplexity ?? 0.5,
        audioAnalysis
      }

      const phrase = await generatorRef.current.generatePhrase(type, config)
      
      setState(prev => ({
        ...prev,
        isGenerating: false,
        lastGenerated: new Date()
      }))

      return phrase
    } catch (error) {
      setState(prev => ({
        ...prev,
        isGenerating: false,
        error: error instanceof Error ? error.message : 'Generation failed'
      }))
      return null
    }
  }, [key, scale])

  // Generate a complete composition
  const generateComposition = useCallback(async (
    options: AIGenerationOptions = {}
  ): Promise<AIComposition | null> => {
    if (!generatorRef.current) return null

    setState(prev => ({ ...prev, isGenerating: true, error: null }))

    try {
      // Get current audio analysis if requested
      let audioAnalysis = undefined
      if (options.useAudioAnalysis) {
        try {
          const bands = getAnalyserBands()
          audioAnalysis = {
            bass: bands.bass,
            mid: bands.mid,
            treble: bands.treble,
            energy: (bands.bass + bands.mid + bands.treble) / (3 * 255)
          }
        } catch (error) {
          logger.warn({
            event: 'ai-music.audio-analysis-unavailable',
            context: 'generate-composition',
            error: stringifyError(error),
          })
        }
      }

      const config: AIGenerationConfig = {
        temperature: options.temperature ?? 0.7,
        steps: options.steps ?? 16,
        keySignature: key,
        scaleType: scale as any,
        style: options.style ?? 'electronic',
        rhythmComplexity: options.rhythmComplexity ?? 0.5,
        harmonicComplexity: options.harmonicComplexity ?? 0.5,
        audioAnalysis
      }

      const result = await generatorRef.current.generateComposition(config)
      
      const composition: AIComposition = {
        ...result,
        generatedAt: new Date(),
        config
      }

      setCurrentComposition(composition)
      setGenerationHistory(prev => [composition, ...prev.slice(0, 9)]) // Keep last 10

      setState(prev => ({
        ...prev,
        isGenerating: false,
        lastGenerated: new Date()
      }))

      return composition
    } catch (error) {
      setState(prev => ({
        ...prev,
        isGenerating: false,
        error: error instanceof Error ? error.message : 'Generation failed'
      }))
      return null
    }
  }, [key, scale])

  // Play a generated phrase
  const playPhrase = useCallback(async (
    phrase: AIMusicalPhrase,
    type: 'melody' | 'harmony' | 'rhythm' | 'texture'
  ) => {
    if (!generatorRef.current || !phrase) return

    try {
      await generatorRef.current.playPhrase(phrase, type)
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Playback failed'
      }))
    }
  }, [])

  // Play entire composition
  const playComposition = useCallback(async (composition?: AIComposition) => {
    const comp = composition || currentComposition
    if (!comp || !generatorRef.current) return

    try {
      // Play all parts simultaneously
      const playPromises = []
      
      if (comp.melody) {
        playPromises.push(generatorRef.current.playPhrase(comp.melody, 'melody'))
      }
      if (comp.harmony) {
        playPromises.push(generatorRef.current.playPhrase(comp.harmony, 'harmony'))
      }
      if (comp.rhythm) {
        playPromises.push(generatorRef.current.playPhrase(comp.rhythm, 'rhythm'))
      }
      if (comp.texture) {
        playPromises.push(generatorRef.current.playPhrase(comp.texture, 'texture'))
      }

      await Promise.all(playPromises)
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Composition playback failed'
      }))
    }
  }, [currentComposition])

  // Generate audio-reactive composition in real-time
  const generateRealtimeComposition = useCallback(async (
    options: Omit<AIGenerationOptions, 'useAudioAnalysis'> = {}
  ) => {
    return generateComposition({
      ...options,
      useAudioAnalysis: true,
      steps: 8, // Shorter for real-time generation
      temperature: 0.8 // More responsive to audio
    })
  }, [generateComposition])

  // Generate variations of the current composition
  const generateVariation = useCallback(async (
    baseComposition?: AIComposition,
    variationStrength: number = 0.3
  ): Promise<AIComposition | null> => {
    const comp = baseComposition || currentComposition
    if (!comp) return null

    const variationConfig: AIGenerationConfig = {
      ...comp.config,
      temperature: Math.min(2.0, comp.config.temperature + variationStrength),
      seedSequence: comp.melody?.notes.slice(0, 4).map(n => n.pitch % 12)
    }

    return await generateComposition({
      temperature: variationConfig.temperature,
      steps: variationConfig.steps,
      style: variationConfig.style,
      rhythmComplexity: Math.min(1.0, comp.config.rhythmComplexity + variationStrength * 0.5),
      harmonicComplexity: Math.min(1.0, comp.config.harmonicComplexity + variationStrength * 0.5)
    })
  }, [currentComposition, generateComposition])

  // Clear error state
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }))
  }, [])

  // Get generation statistics
  const getStats = useCallback(() => {
    const totalGenerations = generationHistory.length
    const styleDistribution = generationHistory.reduce((acc, comp) => {
      acc[comp.config.style] = (acc[comp.config.style] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const averageTemperature = generationHistory.length > 0 
      ? generationHistory.reduce((sum, comp) => sum + comp.config.temperature, 0) / generationHistory.length
      : 0

    return {
      totalGenerations,
      styleDistribution,
      averageTemperature,
      lastGenerated: state.lastGenerated
    }
  }, [generationHistory, state.lastGenerated])

  return {
    // State
    ...state,
    currentComposition,
    generationHistory,

    // Actions
    generatePhrase,
    generateComposition,
    generateRealtimeComposition,
    generateVariation,
    playPhrase,
    playComposition,
    clearError,

    // Utils
    getStats,
    isReady: Object.values(state.modelStatus).every(Boolean)
  }
}
