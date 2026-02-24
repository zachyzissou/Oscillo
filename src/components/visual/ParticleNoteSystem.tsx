'use client'
import React, { useMemo, useRef, useCallback, useEffect } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { playNote, playChord, playBeat } from '@/lib/audio'
import { getInterval } from '@/lib/music'
import { usePerformanceSettings } from '@/store/usePerformanceSettings'
import { useAudioStore } from '@/store/useAudioStore'
import { animateParticleBuffers, isPlaybackBoostActive } from '@/lib/particleAnimation'

export type ParticleType = 'note' | 'chord' | 'beat'

const deterministicUnitNoise = (seed: number) => {
  const value = Math.sin(seed * 12.9898 + 78.233) * 43758.5453
  return value - Math.floor(value)
}

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
  const playbackBoostUntilRef = useRef(0)

  const level = usePerformanceSettings((s) => s.level)
  const scale = level === 'high' ? 1.0 : level === 'medium' ? 0.7 : 0.4

  const [particleData] = useMemo(() => {
    const base = type === 'chord' ? 2000 : type === 'beat' ? 5000 : 1500
    const count = Math.max(300, Math.floor(base * scale))
    const basePositions = new Float32Array(count * 3)
    const baseSizes = new Float32Array(count)
    const phases = new Float32Array(count)

    for (let i = 0; i < count; i++) {
      const i3 = i * 3

      if (type === 'chord') {
        const t = i / count
        const radius = 2 + t * 3
        const angle = t * Math.PI * 8
        basePositions[i3] = Math.cos(angle) * radius + position[0]
        basePositions[i3 + 1] = (t - 0.5) * 4 + position[1]
        basePositions[i3 + 2] = Math.sin(angle) * radius + position[2]
      } else if (type === 'beat') {
        const phi = Math.acos(-1 + (2 * i) / count)
        const theta = Math.sqrt(count * Math.PI) * phi
        const radius = 1 + deterministicUnitNoise(i + 11) * 3
        basePositions[i3] = radius * Math.cos(theta) * Math.sin(phi) + position[0]
        basePositions[i3 + 1] = radius * Math.cos(phi) + position[1]
        basePositions[i3 + 2] = radius * Math.sin(theta) * Math.sin(phi) + position[2]
      } else {
        const phi = Math.acos(-1 + (2 * i) / count)
        const theta = Math.sqrt(count * Math.PI) * phi
        const radius = 1.5 + deterministicUnitNoise(i + 23) * 0.5
        basePositions[i3] = radius * Math.cos(theta) * Math.sin(phi) + position[0]
        basePositions[i3 + 1] = radius * Math.cos(phi) + position[1]
        basePositions[i3 + 2] = radius * Math.sin(theta) * Math.sin(phi) + position[2]
      }

      baseSizes[i] = deterministicUnitNoise(i + 37) * 0.1 + 0.05
      phases[i] = deterministicUnitNoise(i + 53) * Math.PI * 2
    }

    const renderPositions = new Float32Array(basePositions)
    const renderSizes = new Float32Array(baseSizes)

    return [
      {
        basePositions,
        renderPositions,
        baseSizes,
        renderSizes,
        phases,
        count,
      },
    ] as const
  }, [position, type, scale])

  const handleClick = useCallback(async () => {
    const boostDurationMs = type === 'chord' ? 2000 : 1000
    playbackBoostUntilRef.current = globalThis.performance.now() + boostDurationMs
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
  }, [id, note, type])

  useFrame(state => {
    if (!particlesRef.current) return

    const time = state.clock.elapsedTime
    const nowMs = globalThis.performance.now()
    const isPlaying = isPlaybackBoostActive(nowMs, playbackBoostUntilRef.current)
    const { analysisData } = useAudioStore.getState()
    const averagedEnergy =
      (analysisData.bassEnergy + analysisData.midEnergy + analysisData.trebleEnergy) / 3
    const audioEnergy = Math.min(1, averagedEnergy || analysisData.volume)
    const geometry = particlesRef.current.geometry
    const positionAttribute = geometry.getAttribute('position')
    const sizeAttribute = geometry.getAttribute('size')
    if (!(positionAttribute instanceof THREE.BufferAttribute)) return
    if (!(sizeAttribute instanceof THREE.BufferAttribute)) return
    if (!(positionAttribute.array instanceof Float32Array)) return
    if (!(sizeAttribute.array instanceof Float32Array)) return

    animateParticleBuffers({
      basePositions: particleData.basePositions,
      baseSizes: particleData.baseSizes,
      phases: particleData.phases,
      outputPositions: positionAttribute.array,
      outputSizes: sizeAttribute.array,
      count: particleData.count,
      time,
      audioEnergy,
      isActive,
      isPlaying,
    })

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
  const geometry = useMemo(() => {
    const bufferGeometry = new THREE.BufferGeometry()
    bufferGeometry.setAttribute('position', new THREE.BufferAttribute(particleData.renderPositions, 3))
    bufferGeometry.setAttribute('size', new THREE.BufferAttribute(particleData.renderSizes, 1))
    return bufferGeometry
  }, [particleData.renderPositions, particleData.renderSizes])

  useEffect(() => {
    if (!particlesRef.current) return
    const previousGeometry = particlesRef.current.geometry
    particlesRef.current.geometry = geometry
    const isDefaultPlaceholder = Object.keys(previousGeometry.attributes).length === 0
    if (previousGeometry !== geometry && isDefaultPlaceholder) {
      previousGeometry.dispose()
    }
  }, [geometry])

  useEffect(() => {
    return () => {
      geometry.dispose()
    }
  }, [geometry])

  return (
    <points ref={particlesRef} onClick={handleClick}>
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
