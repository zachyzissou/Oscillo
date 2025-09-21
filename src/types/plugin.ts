// src/types/plugin.ts
export interface Plugin {
  name: string
  version?: string
  description?: string
  author?: string
  category?: 'instrument' | 'effect' | 'visual' | 'utility'
  
  // Lifecycle methods
  init?: () => void | Promise<void>
  destroy?: () => void | Promise<void>
  
  // Plugin capabilities
  instruments?: InstrumentDefinition[]
  effects?: EffectDefinition[]
  visuals?: VisualDefinition[]
  utilities?: UtilityDefinition[]
}

export interface InstrumentDefinition {
  id: string
  name: string
  description?: string
  parameters: ParameterDefinition[]
  
  // Audio synthesis
  createSynth: () => any // Tone.js synth instance
  triggerAttack: (note: string, time?: number) => void
  triggerRelease: (time?: number) => void
  
  // UI component (optional)
  component?: React.ComponentType<{ synthInstance: any }>
}

export interface EffectDefinition {
  id: string
  name: string
  description?: string
  parameters: ParameterDefinition[]
  
  // Audio processing
  createEffect: () => any // Tone.js effect instance
  
  // UI component (optional)
  component?: React.ComponentType<{ effectInstance: any }>
}

export interface VisualDefinition {
  id: string
  name: string
  description?: string
  parameters: ParameterDefinition[]
  
  // Shader source (GLSL/WGSL)
  vertexShader?: string
  fragmentShader?: string
  computeShader?: string
  
  // Uniform mappings for audio reactivity
  uniforms?: UniformMapping[]
  
  // Three.js material/geometry setup
  setup?: (audioData: any) => {
    material?: any
    geometry?: any
    mesh?: any
  }
  
  // Update function called each frame
  update?: (audioData: any, uniforms: any, time: number) => void
  
  // UI component (optional)
  component?: React.ComponentType<{ visualInstance: any }>
}

export interface UtilityDefinition {
  id: string
  name: string
  description?: string
  
  // Utility function
  execute: (...args: any[]) => any
  
  // UI component (optional)
  component?: React.ComponentType<any>
}

export interface ParameterDefinition {
  id: string
  name: string
  type: 'number' | 'boolean' | 'string' | 'select' | 'color'
  defaultValue: any
  min?: number
  max?: number
  step?: number
  options?: { label: string; value: any }[]
  description?: string
}

export interface UniformMapping {
  uniformName: string
  audioProperty: 'bass' | 'mid' | 'treble' | 'rms' | 'peak' | 'spectralCentroid'
  transform?: (value: number) => number
  range?: [number, number]
}

export interface PluginContext {
  // Audio system access
  audioContext: AudioContext
  toneInstance: any
  analyserData: any
  
  // Visual system access
  scene: any // Three.js scene
  renderer: any // Three.js renderer
  camera: any // Three.js camera
  
  // State management
  getState: (key: string) => any
  setState: (key: string, value: any) => void
  
  // Event system
  on: (event: PluginEvent, callback: Function) => void
  off: (event: PluginEvent, callback: Function) => void
  emit: (event: PluginEvent, data?: any) => void
}

export interface PluginManager {
  // Plugin lifecycle
  registerPlugin: (plugin: Plugin) => Promise<void>
  unregisterPlugin: (name: string) => Promise<void>
  
  // Plugin discovery
  getPlugin: (name: string) => Plugin | null
  getAllPlugins: () => Plugin[]
  getPluginsByCategory: (category: Plugin['category']) => Plugin[]
  
  // Plugin execution
  loadPlugin: (name: string) => Promise<void>
  unloadPlugin: (name: string) => Promise<void>
  
  // Context provision
  getContext: () => PluginContext
  setContext: (context: PluginContext) => void
  clearContext: () => void

  // State helpers
  getState: (key: string) => any
  setState: (key: string, value: any) => void

  // Events
  on: (event: PluginEvent, callback: Function) => void
  off: (event: PluginEvent, callback: Function) => void
  emit: (event: PluginEvent, data?: any) => void
}

// Plugin events
export type PluginEvent = 
  | 'plugin:registered'
  | 'plugin:unregistered'
  | 'plugin:loaded'
  | 'plugin:unloaded'
  | 'plugin:error'
  | 'audio:beat'
  | 'audio:note'
  | 'visual:frame'
  | 'scene:object-added'
  | 'scene:object-removed'
