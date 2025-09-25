'use client'
import { useRef, useMemo } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { 
  EffectComposer, 
  Bloom, 
  ChromaticAberration,
  DepthOfField,
  Noise,
  Vignette,
  Glitch,
  ColorAverage,
  DotScreen,
  HueSaturation,
  BrightnessContrast,
  ToneMapping
} from '@react-three/postprocessing'
import { BlendFunction, GlitchMode, ToneMappingMode } from 'postprocessing'
import * as THREE from 'three'
import { useAudioStore } from '@/store/useAudioEngine'
import { usePerformanceSettings } from '@/store/usePerformanceSettings'

export default function EnhancedPostProcessing() {
  const { fftData } = useAudioStore()
  const { level: perfLevel } = usePerformanceSettings()
  const { camera } = useThree()
  
  const bloomRef = useRef<any>(null)
  const chromaticRef = useRef<any>(null)
  const glitchRef = useRef<any>(null)
  const hueSatRef = useRef<any>(null)
  const brightnessRef = useRef<any>(null)

  // Audio-reactive parameters
  const audioParams = useMemo(() => ({
    bass: 0,
    mid: 0,
    treble: 0,
    average: 0,
  }), [])

  useFrame((state, delta) => {
    if (!fftData || fftData.length === 0) return

    // Calculate frequency bands
    const bassEnd = Math.floor(fftData.length * 0.1)
    const midEnd = Math.floor(fftData.length * 0.5)
    
    audioParams.bass = fftData.slice(0, bassEnd).reduce((a, b) => a + b, 0) / bassEnd / 255
    audioParams.mid = fftData.slice(bassEnd, midEnd).reduce((a, b) => a + b, 0) / (midEnd - bassEnd) / 255
    audioParams.treble = fftData.slice(midEnd).reduce((a, b) => a + b, 0) / (fftData.length - midEnd) / 255
    audioParams.average = (audioParams.bass + audioParams.mid + audioParams.treble) / 3

    // Update bloom intensity based on bass
    if (bloomRef.current) {
      bloomRef.current.intensity = 1.5 + audioParams.bass * 2
      bloomRef.current.luminanceThreshold = 0.6 - audioParams.bass * 0.2
    }

    // Update chromatic aberration based on treble
    if (chromaticRef.current) {
      const offset = new THREE.Vector2(
        audioParams.treble * 0.002,
        audioParams.treble * 0.002
      )
      chromaticRef.current.offset = offset
    }

    // Trigger glitch on bass hits
    if (glitchRef.current && audioParams.bass > 0.8) {
      glitchRef.current.delay.x = Math.random() * 2
      glitchRef.current.delay.y = Math.random() * 2
    }

    // Hue shift based on time and audio
    if (hueSatRef.current) {
      hueSatRef.current.hue = Math.sin(state.clock.elapsedTime * 0.5) * 0.2 * audioParams.mid
      hueSatRef.current.saturation = -0.1 + audioParams.average * 0.2
    }

    // Brightness pulsing
    if (brightnessRef.current) {
      brightnessRef.current.brightness = audioParams.average * 0.1
      brightnessRef.current.contrast = audioParams.bass * 0.2
    }
  })

  // Adjust effects based on performance level
  const effects = useMemo(() => {
    const baseEffects = [
      <Bloom
        ref={bloomRef}
        key="bloom"
        intensity={1.5}
        luminanceThreshold={0.6}
        luminanceSmoothing={0.9}
        blendFunction={BlendFunction.ADD}
        radius={0.8}
        levels={5}
        mipmapBlur
      />,
      <Vignette
        key="vignette"
        darkness={0.5}
        offset={0.5}
        blendFunction={BlendFunction.NORMAL}
      />,
      <ToneMapping
        key="toneMapping"
        mode={ToneMappingMode.ACES_FILMIC}
        resolution={256}
        whitePoint={4.0}
        middleGrey={0.6}
        minLuminance={0.01}
        averageLuminance={1.0}
        adaptationRate={1.0}
      />
    ]

    if (perfLevel === 'high') {
      return [
        ...baseEffects,
        <ChromaticAberration
          ref={chromaticRef}
          key="chromatic"
          blendFunction={BlendFunction.NORMAL}
          offset={new THREE.Vector2(0.001, 0.001)}
        />,
        <DepthOfField
          key="dof"
          focusDistance={0.02}
          focalLength={0.05}
          bokehScale={3}
          height={480}
        />,
        <Glitch
          ref={glitchRef}
          key="glitch"
          delay={new THREE.Vector2(5, 7)}
          duration={new THREE.Vector2(0.1, 0.2)}
          strength={new THREE.Vector2(0.2, 0.3)}
          mode={GlitchMode.SPORADIC}
          active
          ratio={0.1}
        />,
        <HueSaturation
          ref={hueSatRef}
          key="hueSat"
          hue={0}
          saturation={0}
          blendFunction={BlendFunction.NORMAL}
        />,
        <BrightnessContrast
          ref={brightnessRef}
          key="brightness"
          brightness={0}
          contrast={0}
          blendFunction={BlendFunction.NORMAL}
        />,
        <Noise
          key="noise"
          opacity={0.02}
          blendFunction={BlendFunction.ADD}
        />
      ]
    } else if (perfLevel === 'medium') {
      return [
        ...baseEffects,
        <ChromaticAberration
          ref={chromaticRef}
          key="chromatic"
          blendFunction={BlendFunction.NORMAL}
          offset={new THREE.Vector2(0.0005, 0.0005)}
        />,
        <HueSaturation
          ref={hueSatRef}
          key="hueSat"
          hue={0}
          saturation={0}
          blendFunction={BlendFunction.NORMAL}
        />
      ]
    }

    return baseEffects
  }, [perfLevel])

  return (
    <EffectComposer multisampling={perfLevel === 'high' ? 4 : 0}>
      {effects}
    </EffectComposer>
  )
}