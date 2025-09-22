'use client'

import { useEffect, useRef } from 'react'
import pluginManager from './PluginManager'
import { useAudioEngine } from '@/store/useAudioEngine'
import { useAudioStore } from '@/store/useAudioStore'
import { getTone } from '@/lib/audio'
import type { PluginContext } from '@/types/plugin'
import { logger } from '@/lib/logger'

const STORAGE_CACHE: Record<string, any> = {}

function sanitizeKey(key: string): string | null {
  if (typeof key !== 'string') return null
  const trimmed = key.trim()
  if (!trimmed) return null
  const safe = trimmed.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 64)
  return safe.length ? safe : null
}

export default function PluginLoader() {
  const audioReady = useAudioEngine((s) => s.audioReady)
  const analysisData = useAudioStore((s) => s.analysisData)
  const contextRef = useRef<PluginContext | null>(null)

  // Initialize plugin context once audio is ready
  useEffect(() => {
    if (!audioReady || contextRef.current) return

    try {
      const Tone = getTone()
      const toneContext = Tone?.getContext()
      const rawContext = toneContext?.rawContext as AudioContext | undefined

      if (!rawContext) {
        logger.warn('PluginLoader: audio context unavailable, skipping plugin init')
        return
      }

      const getState = (key: string) => {
        const safe = sanitizeKey(key)
        if (!safe) return null
        if (STORAGE_CACHE[safe]) return STORAGE_CACHE[safe]
        if (typeof window === 'undefined') return null
        try {
          const raw = localStorage.getItem(`plugin_${safe}`)
          const parsed = raw ? JSON.parse(raw) : null
          STORAGE_CACHE[safe] = parsed
          return parsed
        } catch (error) {
          logger.warn(`Plugin state read failed: ${String(error)}`)
          return null
        }
      }

      const setState = (key: string, value: any) => {
        const safe = sanitizeKey(key)
        if (!safe || typeof window === 'undefined') return
        STORAGE_CACHE[safe] = value
        try {
          localStorage.setItem(`plugin_${safe}`, JSON.stringify(value))
        } catch (error) {
          logger.error(`Plugin state write failed: ${String(error)}`)
        }
      }

      const context: PluginContext = {
        audioContext: rawContext,
        toneInstance: Tone,
        analyserData: analysisData,
        scene: null,
        renderer: null,
        camera: null,
        getState,
        setState,
        on: pluginManager.on.bind(pluginManager),
        off: pluginManager.off.bind(pluginManager),
        emit: pluginManager.emit.bind(pluginManager),
      }

      pluginManager.setContext(context)
      contextRef.current = context
    } catch (error) {
      logger.error(`PluginLoader failed: ${String(error)}`)
    }
  }, [audioReady, analysisData])

  // Keep analyser data fresh for plugins
  useEffect(() => {
    if (!contextRef.current) return
    contextRef.current.analyserData = analysisData
    pluginManager.emit('visual:frame', analysisData)
  }, [analysisData])

  useEffect(() => {
    return () => {
      pluginManager.disposeAll().catch((error) => {
        logger.error(`PluginManager dispose failed: ${String(error)}`)
      })
      contextRef.current = null
    }
  }, [])

  return null
}
