'use client'

import { Plugin, PluginContext, PluginEvent, PluginManager as PluginManagerType } from '@/types/plugin'
import { safeStringify } from '@/lib/safeStringify'
import { logger } from '@/lib/logger'

function sanitizeKey(key: string): string | null {
  if (typeof key !== 'string') return null
  const trimmed = key.trim()
  if (!trimmed) return null
  const safe = trimmed.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 64)
  return safe.length ? safe : null
}

class PluginManagerImpl implements PluginManagerType {
  private plugins = new Map<string, Plugin>()
  private loaded = new Set<string>()
  private listeners = new Map<PluginEvent, Set<Function>>()
  private context: PluginContext | null = null

  async registerPlugin(plugin: Plugin): Promise<void> {
    if (this.plugins.has(plugin.name)) {
      throw new Error(`Plugin ${plugin.name} is already registered`)
    }

    this.plugins.set(plugin.name, plugin)
    this.emit('plugin:registered', { plugin })

    if (this.context) {
      await this.loadPlugin(plugin.name)
    }
  }

  async unregisterPlugin(name: string): Promise<void> {
    const plugin = this.plugins.get(name)
    if (!plugin) return

    await this.unloadPlugin(name)
    this.plugins.delete(name)
    this.emit('plugin:unregistered', { plugin })
  }

  getPlugin(name: string): Plugin | null {
    return this.plugins.get(name) ?? null
  }

  getAllPlugins(): Plugin[] {
    return Array.from(this.plugins.values())
  }

  getPluginsByCategory(category: Plugin['category']): Plugin[] {
    return this.getAllPlugins().filter((plugin) => plugin.category === category)
  }

  async loadPlugin(name: string): Promise<void> {
    const plugin = this.plugins.get(name)
    if (!plugin) {
      throw new Error(`Plugin ${name} not registered`)
    }
    if (this.loaded.has(name)) return
    if (!this.context) {
      throw new Error('Plugin context not initialized')
    }

    try {
      await plugin.init?.()
      this.loaded.add(name)
      this.emit('plugin:loaded', { plugin })
      logger.info(`Plugin loaded: ${safeStringify({ name: plugin.name, version: plugin.version })}`)
    } catch (error) {
      this.emit('plugin:error', { plugin, error })
      throw error
    }
  }

  async unloadPlugin(name: string): Promise<void> {
    if (!this.loaded.has(name)) return
    const plugin = this.plugins.get(name)
    if (!plugin) return

    try {
      await plugin.destroy?.()
      this.loaded.delete(name)
      this.emit('plugin:unloaded', { plugin })
    } catch (error) {
      this.emit('plugin:error', { plugin, error })
      throw error
    }
  }

  getContext(): PluginContext {
    if (!this.context) {
      throw new Error('Plugin context not initialized')
    }
    return this.context
  }

  setContext(context: PluginContext) {
    this.context = context
    this.plugins.forEach((plugin) => {
      if (!this.loaded.has(plugin.name)) {
        this.loadPlugin(plugin.name).catch((error) => {
          logger.error(`Failed to load plugin ${plugin.name}: ${String(error)}`)
        })
      }
    })
  }

  clearContext() {
    this.context = null
    this.loaded.clear()
  }

  on(event: PluginEvent, callback: Function) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set())
    }
    this.listeners.get(event)!.add(callback)
  }

  off(event: PluginEvent, callback: Function) {
    const callbacks = this.listeners.get(event)
    if (!callbacks) return
    callbacks.delete(callback)
  }

  emit(event: PluginEvent, data?: any) {
    const callbacks = this.listeners.get(event)
    if (!callbacks) return
    callbacks.forEach((cb) => {
      try {
        cb(data)
      } catch (error) {
        logger.error(`Plugin event listener error for ${event}: ${String(error)}`)
      }
    })
  }

  getState(key: string) {
    const safe = sanitizeKey(key)
    if (!safe || typeof window === 'undefined') return null
    try {
      const raw = localStorage.getItem(`plugin_${safe}`)
      return raw ? JSON.parse(raw) : null
    } catch (error) {
      logger.warn(`Failed to read plugin state: ${String(error)}`)
      return null
    }
  }

  setState(key: string, value: any) {
    const safe = sanitizeKey(key)
    if (!safe || typeof window === 'undefined') return
    try {
      localStorage.setItem(`plugin_${safe}`, JSON.stringify(value))
    } catch (error) {
      logger.error(`Failed to persist plugin state: ${String(error)}`)
    }
  }

  async disposeAll() {
    for (const name of Array.from(this.loaded)) {
      await this.unloadPlugin(name).catch((error) => {
        logger.error(`Failed to unload plugin ${name}: ${String(error)}`)
      })
    }
    this.loaded.clear()
    this.plugins.clear()
    this.listeners.clear()
    this.clearContext()
  }
}

const pluginManager = new PluginManagerImpl()
export default pluginManager
