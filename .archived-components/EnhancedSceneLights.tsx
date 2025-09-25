'use client'
import { useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { useAudioStore } from '@/store/useAudioEngine'
import { Environment, Lightformer } from '@react-three/drei'

export default function EnhancedSceneLights() {
  const { fftData } = useAudioStore()
  const spotLight1Ref = useRef<THREE.SpotLight>(null)
  const spotLight2Ref = useRef<THREE.SpotLight>(null)
  const pointLight1Ref = useRef<THREE.PointLight>(null)
  const pointLight2Ref = useRef<THREE.PointLight>(null)
  const { scene } = useThree()

  // Configure shadows
  useFrame((state, delta) => {
    if (!fftData || fftData.length === 0) return

    // Calculate audio levels
    const bass = fftData.slice(0, 10).reduce((a, b) => a + b, 0) / 10 / 255
    const mid = fftData.slice(10, 50).reduce((a, b) => a + b, 0) / 40 / 255
    const treble = fftData.slice(50, 100).reduce((a, b) => a + b, 0) / 50 / 255

    // Animate spot lights
    if (spotLight1Ref.current) {
      spotLight1Ref.current.intensity = 2 + bass * 3
      spotLight1Ref.current.angle = Math.PI / 6 + bass * 0.1
      spotLight1Ref.current.color.setHSL(0.6 + bass * 0.1, 0.8, 0.5)
    }

    if (spotLight2Ref.current) {
      spotLight2Ref.current.intensity = 2 + treble * 3
      spotLight2Ref.current.angle = Math.PI / 6 + treble * 0.1
      spotLight2Ref.current.color.setHSL(0.1 + treble * 0.1, 0.8, 0.5)
    }

    // Animate point lights position
    const time = state.clock.elapsedTime
    if (pointLight1Ref.current) {
      pointLight1Ref.current.position.x = Math.sin(time * 0.5) * 10
      pointLight1Ref.current.position.z = Math.cos(time * 0.5) * 10
      pointLight1Ref.current.intensity = 1 + mid * 2
      pointLight1Ref.current.color.setHSL(0.3 + mid * 0.2, 0.7, 0.6)
    }

    if (pointLight2Ref.current) {
      pointLight2Ref.current.position.x = Math.sin(time * 0.7 + Math.PI) * 8
      pointLight2Ref.current.position.z = Math.cos(time * 0.7 + Math.PI) * 8
      pointLight2Ref.current.intensity = 1 + mid * 2
      pointLight2Ref.current.color.setHSL(0.8 + mid * 0.2, 0.7, 0.6)
    }
  })

  return (
    <>
      {/* Ambient lighting */}
      <ambientLight intensity={0.2} color="#4a00ff" />
      
      {/* Fog for atmosphere */}
      <fog attach="fog" args={['#020207', 10, 100]} />
      
      {/* Main directional light with shadows */}
      <directionalLight
        position={[10, 20, 10]}
        intensity={1}
        color="#ffffff"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-near={0.1}
        shadow-camera-far={50}
        shadow-camera-left={-20}
        shadow-camera-right={20}
        shadow-camera-top={20}
        shadow-camera-bottom={-20}
        shadow-bias={-0.001}
      />
      
      {/* Audio-reactive spot lights */}
      <spotLight
        ref={spotLight1Ref}
        position={[-10, 15, 5]}
        angle={Math.PI / 6}
        penumbra={0.5}
        intensity={2}
        color="#00ffff"
        castShadow
        shadow-mapSize={[1024, 1024]}
        target-position={[0, 0, 0]}
      />
      
      <spotLight
        ref={spotLight2Ref}
        position={[10, 15, -5]}
        angle={Math.PI / 6}
        penumbra={0.5}
        intensity={2}
        color="#ff00ff"
        castShadow
        shadow-mapSize={[1024, 1024]}
        target-position={[0, 0, 0]}
      />
      
      {/* Moving point lights */}
      <pointLight
        ref={pointLight1Ref}
        position={[5, 5, 5]}
        intensity={1}
        color="#ffaa00"
        distance={20}
        decay={2}
      />
      
      <pointLight
        ref={pointLight2Ref}
        position={[-5, 5, -5]}
        intensity={1}
        color="#00aaff"
        distance={20}
        decay={2}
      />
      
      {/* HDR Environment (requires @react-three/drei) */}
      <Environment preset="night" background={false}>
        {/* Custom light formers for artistic lighting */}
        <Lightformer
          intensity={2}
          rotation-x={Math.PI / 2}
          position={[0, 5, -9]}
          scale={[10, 10, 1]}
        />
        <Lightformer
          intensity={1}
          rotation-y={Math.PI / 2}
          position={[-5, 1, -1]}
          scale={[10, 2, 1]}
          color="pink"
        />
        <Lightformer
          intensity={1}
          rotation-y={-Math.PI / 2}
          position={[10, 1, 0]}
          scale={[20, 2, 1]}
          color="cyan"
        />
      </Environment>
      
      {/* Rim light for better object definition */}
      <directionalLight
        position={[-5, -5, -5]}
        intensity={0.5}
        color="#8800ff"
      />
    </>
  )
}