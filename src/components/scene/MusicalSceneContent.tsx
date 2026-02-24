'use client'

import React from 'react'
import { OrbitControls, Stars, Effects } from '@react-three/drei'
import AudioReactiveTunnel from '@/components/visual/AudioReactiveTunnel'
import MovingAccentLights from '@/components/scene/MovingAccentLights'
import SpiralNoteField from '@/components/scene/SpiralNoteField'
import type { PerfLevel } from '@/store/usePerformanceSettings'

interface MusicalSceneContentProps {
  perfLevel: PerfLevel
  starCountScale: number
  postprocessingEnabled: boolean
}

const ScenePostProcessing = React.memo(() => {
  return (
    <Effects>
      {/* Reserved for subtle post-processing upgrades. */}
    </Effects>
  )
})

ScenePostProcessing.displayName = 'ScenePostProcessing'

const MusicalSceneContent = React.memo<MusicalSceneContentProps>(
  ({ perfLevel, starCountScale, postprocessingEnabled }) => {
    return (
      <>
      <ambientLight intensity={0.2} color="#4a0e4e" />

      <pointLight
        position={[10, 10, 10]}
        intensity={2.0}
        color="#ff006e"
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
      />
      <pointLight position={[-10, 8, -5]} intensity={1.8} color="#00f5ff" castShadow />
      <pointLight position={[0, -8, 12]} intensity={1.5} color="#8338ec" castShadow />

      <MovingAccentLights />

      <directionalLight
        position={[20, 20, 20]}
        intensity={0.8}
        color="#ffffff"
        castShadow
        shadow-camera-near={0.1}
        shadow-camera-far={100}
        shadow-camera-left={-20}
        shadow-camera-right={20}
        shadow-camera-top={20}
        shadow-camera-bottom={-20}
      />

      <Stars
        radius={100}
        depth={50}
        count={Math.floor(5000 * starCountScale)}
        factor={perfLevel === 'low' ? 6 : 8}
        saturation={0.8}
        fade={true}
        speed={0.5}
      />

      <AudioReactiveTunnel />
      <SpiralNoteField />

      <OrbitControls
        enablePan={true}
        maxPolarAngle={Math.PI * 0.9}
        minDistance={8}
        maxDistance={30}
        enableDamping
        dampingFactor={0.02}
        autoRotate={true}
        autoRotateSpeed={0.5}
      />

        {postprocessingEnabled ? <ScenePostProcessing /> : null}
      </>
    )
  }
)

MusicalSceneContent.displayName = 'MusicalSceneContent'

export default MusicalSceneContent
