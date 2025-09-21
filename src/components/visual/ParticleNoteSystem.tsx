'use client'
import React, { useMemo, useRef, useState, useCallback } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { playNote, playChord, playBeat } from '@/lib/audio'
import { getInterval } from '@/lib/music'
import { usePerformanceSettings } from '@/store/usePerformanceSettings'
import { useAudioStore } from '@/store/useAudioStore'

export type ParticleType = 'note' | 'chord' | 'beat'

export default function ParticleNoteSystem({
  id,
  position,
  color,
  note,
  type,
  isActive,
}: {
  id: string
  position: [number, number, number]
  color: string
  note: string
  type: ParticleType
  isActive: boolean
}) {
  const particlesRef = useRef<THREE.Points>(null)
  const [isPlaying, setIsPlaying] = useState(false)

  const level = usePerformanceSettings((s) => s.level)
  const scale = level === 'high' ? 1.0 : level === 'medium' ? 0.7 : 0.4

  const [particleData] = useMemo(() => {
    const base = type === 'chord' ? 2000 : type === 'beat' ? 5000 : 1500
    const count = Math.max(300, Math.floor(base * scale))
    const positions = new Float32Array(count * 3)
    const velocities = new Float32Array(count * 3)
    const sizes = new Float32Array(count)
    const phases = new Float32Array(count)

    for (let i = 0; i < count; i++) {
      const i3 = i * 3

      if (type === 'chord') {
        const t = i / count
        const radius = 2 + t * 3
        const angle = t * Math.PI * 8
        positions[i3] = Math.cos(angle) * radius + position[0]
        positions[i3 + 1] = (t - 0.5) * 4 + position[1]
        positions[i3 + 2] = Math.sin(angle) * radius + position[2]
      } else if (type === 'beat') {
        const phi = Math.acos(-1 + (2 * i) / count)
        const theta = Math.sqrt(count * Math.PI) * phi
        const radius = 1 + Math.random() * 3
        positions[i3] = radius * Math.cos(theta) * Math.sin(phi) + position[0]
        positions[i3 + 1] = radius * Math.cos(phi) + position[1]
        positions[i3 + 2] = radius * Math.sin(theta) * Math.sin(phi) + position[2]
      } else {
        const phi = Math.acos(-1 + (2 * i) / count)
        const theta = Math.sqrt(count * Math.PI) * phi
        const radius = 1.5 + Math.random() * 0.5
        positions[i3] = radius * Math.cos(theta) * Math.sin(phi) + position[0]
        positions[i3 + 1] = radius * Math.cos(phi) + position[1]
        positions[i3 + 2] = radius * Math.sin(theta) * Math.sin(phi) + position[2]
      }

      velocities[i3] = (Math.random() - 0.5) * 0.02
      velocities[i3 + 1] = (Math.random() - 0.5) * 0.02
      velocities[i3 + 2] = (Math.random() - 0.5) * 0.02

      sizes[i] = Math.random() * 0.1 + 0.05
      phases[i] = Math.random() * Math.PI * 2
    }

    return [
      {
        positions,
        velocities,
        sizes,
        phases,
        count,
      },
    ] as const
  }, [position, type, scale])

  const handleClick = useCallback(async () => {
    setIsPlaying(true)
    try {
      if (type === 'chord') {
        const notes = [note, getInterval(note, 4), getInterval(note, 7), getInterval(note, 10)]
        await playChord(id, notes)
      } else if (type === 'beat') {
        await playBeat(id)
      } else {
        await playNote(id, note)
      }
    } catch (error) {
      console.error('Audio playback error:', error)
    }
    setTimeout(() => setIsPlaying(false), type === 'chord' ? 2000 : 1000)
  }, [id, note, type])

  useFrame((state) => {
    if (!particlesRef.current) return

    const time = state.clock.elapsedTime
    const { analysisData } = useAudioStore.getState()
    const averagedEnergy = (analysisData.bassEnergy + analysisData.midEnergy + analysisData.trebleEnergy) / 3
    const audioEnergy = Math.min(1, averagedEnergy || analysisData.volume)
    const geometry = particlesRef.current.geometry
    const positionAttribute = geometry.attributes.position as THREE.BufferAttribute
    const sizeAttribute = geometry.attributes.size as THREE.BufferAttribute

    for (let i = 0; i < particleData.count; i++) {
      const i3 = i * 3

      const breathe = Math.sin(time * 2 + particleData.phases[i]) * 0.1
      const activeScale = isActive ? 1.5 : 1.0
      const playingScale = isPlaying ? 2.0 : 1.0
      const audioScale = 1 + audioEnergy * 0.6

      const baseX = particleData.positions[i3]
      const baseY = particleData.positions[i3 + 1]
      const baseZ = particleData.positions[i3 + 2]

      const orbitRadius = 0.1 + breathe + audioEnergy * 0.2
      const orbitSpeed = time * (0.5 + i * 0.001 + audioEnergy * 0.5)

      positionAttribute.array[i3] = baseX + Math.cos(orbitSpeed) * orbitRadius * activeScale * audioScale
      positionAttribute.array[i3 + 1] = baseY + Math.sin(time * 1.5 + i * 0.01) * 0.2 * activeScale * audioScale
      positionAttribute.array[i3 + 2] = baseZ + Math.sin(orbitSpeed) * orbitRadius * activeScale * audioScale

      const pulsation = Math.sin(time * 3 + particleData.phases[i]) * 0.5 + 0.5
      sizeAttribute.array[i] = particleData.sizes[i] * (1 + pulsation * 0.5 + audioEnergy * 0.8) * activeScale * playingScale
    }

    positionAttribute.needsUpdate = true
    sizeAttribute.needsUpdate = true

    if (type === 'chord') {
      particlesRef.current.rotation.y = time * (0.2 + audioEnergy * 0.3)
      particlesRef.current.rotation.x = Math.sin(time * 0.5) * 0.1
    } else if (type === 'beat') {
      particlesRef.current.rotation.x = time * (0.5 + audioEnergy * 0.5)
      particlesRef.current.rotation.z = time * (0.3 + audioEnergy * 0.4)
    } else {
      particlesRef.current.rotation.y = time * (0.1 + audioEnergy * 0.2)
    }

    const material = particlesRef.current.material as THREE.PointsMaterial
    if (material) {
      material.opacity = 0.6 + Math.min(0.4, audioEnergy)
    }
  })

  const threeColor = useMemo(() => new THREE.Color(color), [color])

  return (
    <points ref={particlesRef} onClick={handleClick}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[particleData.positions, 3]} />
        <bufferAttribute attach="attributes-size" args={[particleData.sizes, 1]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.1}
        color={threeColor}
        transparent
        opacity={0.8}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
        vertexColors={false}
      />
    </points>
  )
}
