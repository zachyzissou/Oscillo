import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useAudioEngine } from '@/store/useAudioEngine'
import { startAudio } from '@/lib/audio/startAudio'

const { startAudioContextMock, playSpawnSoundMock, loggerErrorMock } = vi.hoisted(() => ({
  startAudioContextMock: vi.fn(),
  playSpawnSoundMock: vi.fn(),
  loggerErrorMock: vi.fn(),
}))

vi.mock('@/lib/audio', () => ({
  startAudioContext: startAudioContextMock,
  playSpawnSound: playSpawnSoundMock,
}))

vi.mock('@/lib/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
    error: loggerErrorMock,
  },
}))

const resetAudioEngineState = () => {
  useAudioEngine.setState({
    audioReady: false,
    audioContext: 'unknown',
    isInitializing: false,
    hasUserInteracted: false,
    lastError: null,
    initAttempts: 0,
    maxInitAttempts: 3,
    latency: 0,
    sampleRate: 44100,
    bufferSize: 256,
  })
}

describe('startAudio', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    resetAudioEngineState()
  })

  it('marks audio ready when startup succeeds', async () => {
    startAudioContextMock.mockResolvedValue(true)
    playSpawnSoundMock.mockResolvedValue(undefined)

    await expect(startAudio()).resolves.toBe(true)
    expect(useAudioEngine.getState().audioReady).toBe(true)
    expect(useAudioEngine.getState().lastError).toBeNull()
    expect(playSpawnSoundMock).toHaveBeenCalledTimes(1)
  })

  it('records a recovery-friendly error when permission is denied', async () => {
    startAudioContextMock.mockResolvedValue(false)

    await expect(startAudio()).resolves.toBe(false)
    expect(useAudioEngine.getState().audioReady).toBe(false)
    expect(useAudioEngine.getState().lastError).toContain(
      'Audio permission was not granted. You can continue visual-only or retry audio.'
    )
  })

  it('logs and stores thrown startup errors', async () => {
    startAudioContextMock.mockRejectedValue(new Error('Audio subsystem unavailable'))

    await expect(startAudio()).resolves.toBe(false)
    expect(useAudioEngine.getState().audioReady).toBe(false)
    expect(useAudioEngine.getState().lastError).toContain('Audio subsystem unavailable')
    expect(loggerErrorMock).toHaveBeenCalledTimes(1)
  })
})
