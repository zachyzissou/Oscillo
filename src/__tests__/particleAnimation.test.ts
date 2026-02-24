import { describe, expect, it } from 'vitest'
import { animateParticleBuffers, isPlaybackBoostActive } from '@/lib/particleAnimation'

describe('particleAnimation', () => {
  it('does not mutate base buffers when animating output buffers', () => {
    const basePositions = new Float32Array([1, 2, 3, 4, 5, 6])
    const baseSizes = new Float32Array([0.1, 0.2])
    const phases = new Float32Array([0, Math.PI / 3])
    const outputPositions = new Float32Array(basePositions)
    const outputSizes = new Float32Array(baseSizes)
    const basePositionsBefore = Array.from(basePositions)
    const baseSizesBefore = Array.from(baseSizes)

    animateParticleBuffers({
      basePositions,
      baseSizes,
      phases,
      outputPositions,
      outputSizes,
      count: 2,
      time: 1.25,
      audioEnergy: 0.6,
      isActive: true,
      isPlaying: true,
    })

    expect(Array.from(basePositions)).toEqual(basePositionsBefore)
    expect(Array.from(baseSizes)).toEqual(baseSizesBefore)
    expect(Array.from(outputPositions)).not.toEqual(basePositionsBefore)
    expect(Array.from(outputSizes)).not.toEqual(baseSizesBefore)
  })

  it('reports playback boost activity from wall-clock timestamps', () => {
    expect(isPlaybackBoostActive(1000, 1500)).toBe(true)
    expect(isPlaybackBoostActive(1500, 1500)).toBe(false)
    expect(isPlaybackBoostActive(2000, 1500)).toBe(false)
  })
})
