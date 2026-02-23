'use client'

import React, { useMemo } from 'react'
import { Canvas } from '@react-three/fiber'
import { AdaptiveDpr } from '@react-three/drei'
import * as THREE from 'three'
import type { PerfLevel } from '@/store/usePerformanceSettings'
import type { QualityProfile } from '@/lib/quality'

interface MusicalCanvasProps {
  perfLevel: PerfLevel
  profile: QualityProfile
  children: React.ReactNode
}

const MusicalCanvas = React.memo<MusicalCanvasProps>(({ perfLevel, profile, children }) => {
  const canvasSettings = useMemo(
    () => ({
      camera: { position: [0, 5, 15] as [number, number, number], fov: 75 },
      shadows: profile.shadows,
      gl: {
        antialias: true,
        alpha: false,
        powerPreference: 'high-performance' as const,
        toneMapping: THREE.ACESFilmicToneMapping,
        toneMappingExposure: perfLevel === 'low' ? 1.2 : 1.4,
        outputColorSpace: THREE.SRGBColorSpace,
      },
      dpr: profile.dpr as [number, number],
    }),
    [perfLevel, profile]
  )

  return (
    <Canvas data-testid="webgl-canvas" {...canvasSettings}>
      <AdaptiveDpr pixelated />
      <color attach="background" args={['#000011']} />
      <fog attach="fog" args={['#000033', 20, 60]} />
      {children}
    </Canvas>
  )
})

MusicalCanvas.displayName = 'MusicalCanvas'

export default MusicalCanvas
