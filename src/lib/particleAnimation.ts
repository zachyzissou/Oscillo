export interface ParticleAnimationInput {
  basePositions: Float32Array
  baseSizes: Float32Array
  phases: Float32Array
  outputPositions: Float32Array
  outputSizes: Float32Array
  count: number
  time: number
  audioEnergy: number
  isActive: boolean
  isPlaying: boolean
}

export const isPlaybackBoostActive = (nowMs: number, playbackBoostUntilMs: number) =>
  nowMs < playbackBoostUntilMs

export function animateParticleBuffers(input: ParticleAnimationInput) {
  const {
    basePositions,
    baseSizes,
    phases,
    outputPositions,
    outputSizes,
    count,
    time,
    audioEnergy,
    isActive,
    isPlaying,
  } = input

  const activeScale = isActive ? 1.5 : 1.0
  const playingScale = isPlaying ? 2.0 : 1.0
  const audioScale = 1 + audioEnergy * 0.6

  for (let i = 0; i < count; i += 1) {
    const i3 = i * 3

    const breathe = Math.sin(time * 2 + phases[i]) * 0.1
    const baseX = basePositions[i3]
    const baseY = basePositions[i3 + 1]
    const baseZ = basePositions[i3 + 2]

    const orbitRadius = 0.1 + breathe + audioEnergy * 0.2
    const orbitSpeed = time * (0.5 + i * 0.001 + audioEnergy * 0.5)

    outputPositions[i3] = baseX + Math.cos(orbitSpeed) * orbitRadius * activeScale * audioScale
    outputPositions[i3 + 1] =
      baseY + Math.sin(time * 1.5 + i * 0.01) * 0.2 * activeScale * audioScale
    outputPositions[i3 + 2] =
      baseZ + Math.sin(orbitSpeed) * orbitRadius * activeScale * audioScale

    const pulsation = Math.sin(time * 3 + phases[i]) * 0.5 + 0.5
    outputSizes[i] =
      baseSizes[i] * (1 + pulsation * 0.5 + audioEnergy * 0.8) * activeScale * playingScale
  }
}
