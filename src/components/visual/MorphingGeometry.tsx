'use client'
import React, { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import morphVert from '@/shaders/morphGeometry.vert.glsl'
import morphFrag from '@/shaders/morphGeometry.frag.glsl'

export default function MorphingGeometry({ position, type }: { position: [number, number, number]; type: 'primary' | 'secondary' }) {
  const meshRef = useRef<THREE.Mesh>(null)
  const materialRef = useRef<THREE.ShaderMaterial>(null)

  const morphMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        morphFactor: { value: 0 },
        colorShift: { value: 0 }
      },
      vertexShader: morphVert,
      fragmentShader: morphFrag,
      transparent: true,
      side: THREE.DoubleSide
    })
  }, [])

  useFrame((state) => {
    if (!materialRef.current || !meshRef.current) return
    const time = state.clock.elapsedTime
    materialRef.current.uniforms.time.value = time
    materialRef.current.uniforms.morphFactor.value = Math.sin(time * 0.5) * 0.5 + 0.5
    materialRef.current.uniforms.colorShift.value = type === 'primary' ? 0.0 : 0.3

    meshRef.current.rotation.x = time * 0.3
    meshRef.current.rotation.y = time * 0.2
    meshRef.current.rotation.z = Math.sin(time * 0.4) * 0.5
    meshRef.current.position.y = position[1] + Math.sin(time * 0.7 + position[0]) * 0.5
  })

  return (
    <mesh ref={meshRef} position={position}>
      <icosahedronGeometry args={[1.5, 2]} />
      <primitive object={morphMaterial} ref={materialRef} />
    </mesh>
  )
}

