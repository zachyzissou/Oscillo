'use client'
import { useEffect, useRef } from 'react'
import { PluginManager, Plugin, PluginContext } from '@/types/plugin'
import { useAudioStore } from '@/store/useAudioStore'

// Utility function to sanitize storage keys
function sanitizeKey(key: string): string | null {
  if (typeof key !== 'string' || key.length === 0) {
    return null
  }
  
  // Remove any potentially dangerous characters and limit length
  const safe = key.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 50)
  return safe.length > 0 ? safe : null
}

class PluginManagerImpl implements PluginManager {
  private plugins = new Map<string, Plugin>()
  private loadedPlugins = new Set<string>()
  private eventListeners = new Map<string, Function[]>()
  private context: PluginContext | null = null

  async registerPlugin(plugin: Plugin): Promise<void> {
    if (this.plugins.has(plugin.name)) {
      throw new Error(`Plugin ${plugin.name} is already registered`)
    }

    // Validate plugin structure
    if (!plugin.name) {
      throw new Error('Plugin must have a name')
    }

    this.plugins.set(plugin.name, plugin)
    this.emit('plugin:registered', { plugin })

    // Auto-initialize if context is available
    if (this.context && plugin.init) {
      try {
        await plugin.init()
        this.emit('plugin:loaded', { plugin })
      } catch (error) {
        this.emit('plugin:error', { plugin, error })
        throw error
      }
    }
  }

  async unregisterPlugin(name: string): Promise<void> {
    const plugin = this.plugins.get(name)
    if (!plugin) return

    if (this.loadedPlugins.has(name)) {
      await this.unloadPlugin(name)
    }

    this.plugins.delete(name)
    this.emit('plugin:unregistered', { plugin })
  }

  getPlugin(name: string): Plugin | null {
    return this.plugins.get(name) || null
  }

  getAllPlugins(): Plugin[] {
    return Array.from(this.plugins.values())
  }

  getPluginsByCategory(category: Plugin['category']): Plugin[] {
    return this.getAllPlugins().filter(p => p.category === category)
  }

  async loadPlugin(name: string): Promise<void> {
    if (this.loadedPlugins.has(name)) return

    const plugin = this.plugins.get(name)
    if (!plugin) {
      throw new Error(`Plugin ${name} not found`)
    }

    if (!this.context) {
      throw new Error('Plugin context not initialized')
    }

    try {
      if (plugin.init) {
        await plugin.init()
      }
      this.loadedPlugins.add(name)
      this.emit('plugin:loaded', { plugin })
    } catch (error) {
      this.emit('plugin:error', { plugin, error })
      throw error
    }
  }

  async unloadPlugin(name: string): Promise<void> {
    if (!this.loadedPlugins.has(name)) return

    const plugin = this.plugins.get(name)
    if (!plugin) return

    try {
      if (plugin.destroy) {
        await plugin.destroy()
      }
      this.loadedPlugins.delete(name)
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
  }

  // Event system
  on(event: string, callback: Function) {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, [])
    }
    this.eventListeners.get(event)!.push(callback)
  }

  off(event: string, callback: Function) {
    const listeners = this.eventListeners.get(event)
    if (listeners) {
      const index = listeners.indexOf(callback)
      if (index > -1) {
        listeners.splice(index, 1)
      }
    }
  }

  emit(event: string, data?: any) {
    const listeners = this.eventListeners.get(event)
    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback(data)
        } catch (error) {
          console.error(`Error in plugin event listener for ${event}:`, error)
        }
      })
    }
  }
}

// Global plugin manager instance
const pluginManager = new PluginManagerImpl()

export default function PluginLoader() {
  const contextRef = useRef<PluginContext | null>(null)
  const { analysisData } = useAudioStore()

  useEffect(() => {
    // Initialize plugin context
    const initContext = async () => {
      try {
        // Create audio context
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
        
        // Get Tone.js instance
        const Tone = await import('tone')
        
        // Create plugin context
        const context: PluginContext = {
          audioContext,
          toneInstance: Tone,
          analyserData: null, // Will be updated by separate useEffect
          
          // Visual system (would be populated with actual Three.js instances)
          scene: null,
          renderer: null,
          camera: null,
          
          // State management (sanitized)
          getState: (key: string) => {
            const safeKey = sanitizeKey(key);
            if (!safeKey) {
              console.warn('Invalid plugin state key:', key);
              return null;
            }
            try {
              return JSON.parse(localStorage.getItem(`plugin_${safeKey}`) || 'null');
            } catch {
              return null;
            }
          },
          setState: (key: string, value: any) => {
            const safeKey = sanitizeKey(key);
            if (!safeKey) {
              console.warn('Invalid plugin state key:', key);
              return;
            }
            try {
              localStorage.setItem(`plugin_${safeKey}`, JSON.stringify(value));
            } catch (error) {
              console.error('Failed to save plugin state:', error);
            }
          },
          
          // Event system
          on: pluginManager.on.bind(pluginManager),
          off: pluginManager.off.bind(pluginManager),
          emit: pluginManager.emit.bind(pluginManager),
        }
        
        contextRef.current = context
        pluginManager.setContext(context)
        
        // Register sample plugin
        await pluginManager.registerPlugin({
          name: 'Sample Visualizer',
          version: '1.0.0',
          description: 'A sample visual plugin that reacts to audio',
          category: 'visual',
          
          init: async () => {
            console.log('Sample Visualizer plugin initialized')
          },
          
          destroy: async () => {
            console.log('Sample Visualizer plugin destroyed')
          },
          
          visuals: [{
            id: 'sample-visual',
            name: 'Audio Reactive Sphere',
            description: 'A sphere that changes size based on audio level',
            parameters: [
              {
                id: 'sensitivity',
                name: 'Sensitivity',
                type: 'number',
                defaultValue: 1.0,
                min: 0.1,
                max: 3.0,
                step: 0.1,
                description: 'How much the sphere reacts to audio'
              },
              {
                id: 'color',
                name: 'Color',
                type: 'color',
                defaultValue: '#ff6b6b',
                description: 'Base color of the sphere'
              }
            ],
            
            uniforms: [
              {
                uniformName: 'u_audioLevel',
                audioProperty: 'rms',
                transform: (value: number) => value * 2.0,
                range: [0, 1]
              },
              {
                uniformName: 'u_bassLevel',
                audioProperty: 'bass',
                range: [0, 1]
              }
            ],
            
            fragmentShader: `
              uniform float u_audioLevel;
              uniform float u_bassLevel;
              uniform vec3 u_color;
              varying vec2 vUv;
              
              void main() {
                float intensity = u_audioLevel + u_bassLevel * 0.5;
                vec3 color = u_color * (1.0 + intensity);
                gl_FragColor = vec4(color, 1.0);
              }
            `,
            
            update: (audioData: any, uniforms: any, time: number) => {
              // Update uniforms based on audio data
              if (uniforms.u_audioLevel) {
                uniforms.u_audioLevel.value = audioData.rms || 0
              }
              if (uniforms.u_bassLevel) {
                uniforms.u_bassLevel.value = audioData.bassEnergy || 0
              }
            }
          }]
        })
        
      } catch (error) {
        console.error('Failed to initialize plugin system:', error)
      }
    }

    initContext()

    // Cleanup
    return () => {
      // Unload all plugins
      pluginManager.getAllPlugins().forEach(plugin => {
        pluginManager.unloadPlugin(plugin.name).catch(console.error)
      })
    }
  }, [])

  // Update analyser data in context when it changes
  useEffect(() => {
    if (contextRef.current) {
      contextRef.current.analyserData = analysisData
    }
  }, [analysisData])

  return null
}

// Export plugin manager for use by other components
export { pluginManager }
