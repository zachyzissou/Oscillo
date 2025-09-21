'use client'
import React, { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import tunnelVert from '@/shaders/audioReactiveTunnel.vert.glsl'
import tunnelFrag from '@/shaders/audioReactiveTunnel.frag.glsl'
import { useAudioStore } from '@/store/useAudioStore'

export default function AudioReactiveTunnel() {
  const tunnelRef = useRef<THREE.Mesh>(null)
  const materialRef = useRef<THREE.ShaderMaterial>(null)

  const tunnelMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        audioLevel: { value: 0 },
        colorA: { value: new THREE.Color(0x0066ff) },
        colorB: { value: new THREE.Color(0xff0066) },
        colorC: { value: new THREE.Color(0x66ff00) }
      },
      vertexShader: tunnelVert,
      fragmentShader: tunnelFrag,
      transparent: true,
      side: THREE.BackSide
    })
  }, [])

  useFrame((state) => {
    const { analysisData } = useAudioStore.getState()
    const { bassEnergy, midEnergy, trebleEnergy, volume } = analysisData
    const audioLevel = Math.min(1, (bassEnergy + midEnergy + trebleEnergy) / 3 || volume)

    if (materialRef.current) {
      const uniforms = materialRef.current.uniforms
      uniforms.time.value = state.clock.elapsedTime
      uniforms.audioLevel.value = THREE.MathUtils.lerp(uniforms.audioLevel.value, audioLevel, 0.1)

      const hueOffset = (bassEnergy + trebleEnergy) * 0.3
      ;(uniforms.colorA.value as THREE.Color).setHSL(0.58 + hueOffset, 0.7, 0.5)
      ;(uniforms.colorB.value as THREE.Color).setHSL(0.95 - hueOffset, 0.7, 0.5)
      ;(uniforms.colorC.value as THREE.Color).setHSL(0.33 + midEnergy * 0.2, 0.7, 0.6)
    }
    if (tunnelRef.current) {
      const rotationSpeed = 0.05 + trebleEnergy * 0.3
      tunnelRef.current.rotation.z += rotationSpeed * state.clock.getDelta()
      const baseScale = 40 + bassEnergy * 10
      tunnelRef.current.scale.set(50 + bassEnergy * 15, 50 + midEnergy * 12, baseScale)
    }
  })

  return (
    <mesh ref={tunnelRef} position={[0, 0, -20]} scale={[50, 50, 40]}>
      <cylinderGeometry args={[1, 1, 1, 32, 1, true]} />
      <primitive object={tunnelMaterial} ref={materialRef} />
    </mesh>
  )
}
