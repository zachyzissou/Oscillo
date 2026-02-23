import { startAudioContext, playSpawnSound } from '../audio'
import { useAudioEngine } from '../../store/useAudioEngine'
import { logger } from '@/lib/logger'

export async function startAudio(): Promise<boolean> {
  try {
    const started = await startAudioContext()
    if (started) {
      useAudioEngine.getState().setAudioReady(true)
      await playSpawnSound()
      return true
    }

    useAudioEngine
      .getState()
      .setError('Audio permission was not granted. You can continue visual-only or retry audio.')
    return false
  } catch (err) {
    logger.error({ event: 'audio.start-failed', error: err instanceof Error ? err.message : String(err) })
    useAudioEngine.getState().setError(String(err))
    return false
  }
}
