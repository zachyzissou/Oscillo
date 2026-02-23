'use client'

import React, { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { useMusicalPalette } from '@/store/useMusicalPalette'
import ParticleNoteSystem from '@/components/visual/ParticleNoteSystem'
import MorphingGeometry from '@/components/visual/MorphingGeometry'

type NoteObject = {
  id: string
  position: [number, number, number]
  note: string
  type: 'note' | 'chord' | 'beat'
}

const SpiralNoteField = React.memo(() => {
  const { scaleNotes } = useMusicalPalette()

  const objects = useMemo<NoteObject[]>(() => {
    const result: NoteObject[] = []
    const count = Math.min(scaleNotes.length, 12)

    for (let i = 0; i < count; i += 1) {
      const t = i / count
      const spiralRadius = 6 + Math.sin(t * Math.PI * 4) * 2
      const spiralHeight = (t - 0.5) * 8
      const angle = t * Math.PI * 6

      result.push({
        id: `${scaleNotes[i]}-${i}`,
        position: [Math.cos(angle) * spiralRadius, spiralHeight, Math.sin(angle) * spiralRadius],
        note: scaleNotes[i],
        type: (i % 4 === 0 ? 'chord' : i % 3 === 0 ? 'beat' : 'note') as 'note' | 'chord' | 'beat',
      })
    }

    return result
  }, [scaleNotes])

  const timeRef = useRef(0)
  useFrame(state => {
    timeRef.current = state.clock.getElapsedTime()
  })

  return (
    <group>
      {objects.map((obj, index) => {
        const t = index / objects.length
        const hue = (t * 360 + timeRef.current * 10) % 360
        const color = `hsl(${hue}, 85%, 65%)`

        return (
          <ParticleNoteSystem
            key={obj.id}
            id={obj.id}
            position={obj.position}
            color={color}
            note={obj.note}
            type={obj.type}
            isActive={false}
          />
        )
      })}

      <MorphingGeometry position={[0, 0, 0]} type="primary" />
      <MorphingGeometry position={[8, 4, -5]} type="secondary" />
      <MorphingGeometry position={[-8, -4, 5]} type="primary" />
    </group>
  )
})

SpiralNoteField.displayName = 'SpiralNoteField'

export default SpiralNoteField
