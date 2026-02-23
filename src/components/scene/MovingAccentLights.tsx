'use client'

import React, { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

const MovingAccentLights = React.memo(() => {
  const lightRef = useRef<THREE.Group>(null)

  useFrame(state => {
    if (!lightRef.current) return

    const time = state.clock.elapsedTime
    lightRef.current.rotation.y = time * 0.5
    lightRef.current.rotation.z = Math.sin(time * 0.3) * 0.2
  })

  return (
    <group ref={lightRef}>
      <pointLight position={[8, 4, 8]} intensity={0.8} color="#ff006e" distance={20} />
      <pointLight position={[-8, -4, -8]} intensity={0.8} color="#00f5ff" distance={20} />
      <pointLight position={[0, 12, -10]} intensity={1.0} color="#ffbe0b" distance={25} />
    </group>
  )
})

MovingAccentLights.displayName = 'MovingAccentLights'

export default MovingAccentLights
