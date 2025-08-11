import '@testing-library/jest-dom'
import { vi } from 'vitest'

// Mock Web Audio API
Object.defineProperty(window, 'AudioContext', {
  writable: true,
  value: vi.fn().mockImplementation(() => ({
    createOscillator: vi.fn().mockReturnValue({
      connect: vi.fn(),
      start: vi.fn(),
      stop: vi.fn(),
      frequency: { value: 440 },
    }),
    createGain: vi.fn().mockReturnValue({
      connect: vi.fn(),
      gain: { value: 1 },
    }),
    createAnalyser: vi.fn().mockReturnValue({
      connect: vi.fn(),
      getByteFrequencyData: vi.fn(),
      frequencyBinCount: 1024,
      fftSize: 2048,
    }),
    destination: {},
    close: vi.fn(),
    resume: vi.fn(),
    suspend: vi.fn(),
    state: 'running',
    sampleRate: 44100,
    baseLatency: 0.01,
    outputLatency: 0.01,
  })),
})

// Mock WebGL context
Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
  writable: true,
  value: vi.fn().mockImplementation((contextType) => {
    if (contextType === 'webgl' || contextType === 'webgl2') {
      return {
        canvas: {},
        drawingBufferWidth: 300,
        drawingBufferHeight: 150,
        getParameter: vi.fn().mockReturnValue('WebGL Mock'),
        getExtension: vi.fn().mockReturnValue(null),
        createShader: vi.fn(),
        shaderSource: vi.fn(),
        compileShader: vi.fn(),
        createProgram: vi.fn(),
        attachShader: vi.fn(),
        linkProgram: vi.fn(),
        useProgram: vi.fn(),
        createBuffer: vi.fn(),
        bindBuffer: vi.fn(),
        bufferData: vi.fn(),
        enableVertexAttribArray: vi.fn(),
        vertexAttribPointer: vi.fn(),
        drawArrays: vi.fn(),
        clear: vi.fn(),
        clearColor: vi.fn(),
        viewport: vi.fn(),
      }
    }
    return null
  }),
})

// Mock requestAnimationFrame
Object.defineProperty(window, 'requestAnimationFrame', {
  writable: true,
  value: vi.fn().mockImplementation((callback) => {
    return setTimeout(callback, 16)
  }),
})

Object.defineProperty(window, 'cancelAnimationFrame', {
  writable: true,
  value: vi.fn().mockImplementation((id) => {
    clearTimeout(id)
  }),
})

// Mock performance.memory
Object.defineProperty(performance, 'memory', {
  writable: true,
  value: {
    usedJSHeapSize: 50 * 1024 * 1024, // 50MB
    totalJSHeapSize: 100 * 1024 * 1024, // 100MB
    jsHeapSizeLimit: 2 * 1024 * 1024 * 1024, // 2GB
  },
})

// Mock URL.createObjectURL
Object.defineProperty(URL, 'createObjectURL', {
  writable: true,
  value: vi.fn().mockReturnValue('blob:mock-url'),
})

Object.defineProperty(URL, 'revokeObjectURL', {
  writable: true,
  value: vi.fn(),
})

// Mock navigator.gpu (WebGPU)
Object.defineProperty(navigator, 'gpu', {
  writable: true,
  value: {
    requestAdapter: vi.fn().mockResolvedValue(null),
    getPreferredCanvasFormat: vi.fn().mockReturnValue('bgra8unorm'),
  },
})

// Mock Three.js WebGLRenderer
vi.mock('three', async () => {
  const actual = await vi.importActual('three')
  return {
    ...actual,
    WebGLRenderer: vi.fn().mockImplementation(() => ({
      setSize: vi.fn(),
      render: vi.fn(),
      dispose: vi.fn(),
      domElement: document.createElement('canvas'),
      capabilities: {
        isWebGL2: true,
        maxTextureSize: 4096,
      },
      info: {
        memory: {
          geometries: 0,
          textures: 0,
        },
        render: {
          calls: 0,
          triangles: 0,
        },
      },
    })),
  }
})

// Mock Tone.js
vi.mock('tone', () => ({
  start: vi.fn(),
  now: vi.fn().mockReturnValue(0),
  Transport: {
    start: vi.fn(),
    stop: vi.fn(),
    pause: vi.fn(),
    bpm: { value: 120 },
  },
  Synth: vi.fn().mockImplementation(() => ({
    toDestination: vi.fn().mockReturnThis(),
    triggerAttackRelease: vi.fn(),
    dispose: vi.fn(),
  })),
  PolySynth: vi.fn().mockImplementation(() => ({
    toDestination: vi.fn().mockReturnThis(),
    triggerAttackRelease: vi.fn(),
    dispose: vi.fn(),
  })),
  MembraneSynth: vi.fn().mockImplementation(() => ({
    toDestination: vi.fn().mockReturnThis(),
    triggerAttackRelease: vi.fn(),
    dispose: vi.fn(),
  })),
  Meter: vi.fn().mockImplementation(() => ({
    toDestination: vi.fn().mockReturnThis(),
    getValue: vi.fn().mockReturnValue(-30),
    dispose: vi.fn(),
  })),
  Analyser: vi.fn().mockImplementation(() => ({
    toDestination: vi.fn().mockReturnThis(),
    getValue: vi.fn().mockReturnValue(new Float32Array(1024)),
    dispose: vi.fn(),
  })),
  Reverb: vi.fn().mockImplementation(() => ({
    toDestination: vi.fn().mockReturnThis(),
    wet: { value: 0.3 },
    roomSize: { value: 0.8 },
    dispose: vi.fn(),
  })),
  FeedbackDelay: vi.fn().mockImplementation(() => ({
    toDestination: vi.fn().mockReturnThis(),
    delayTime: { value: 0.25 },
    feedback: { value: 0.3 },
    wet: { value: 0.2 },
    dispose: vi.fn(),
  })),
  Chorus: vi.fn().mockImplementation(() => ({
    toDestination: vi.fn().mockReturnThis(),
    frequency: { value: 1.5 },
    delayTime: { value: 3.5 },
    depth: { value: 0.7 },
    wet: { value: 0.3 },
    dispose: vi.fn(),
  })),
  Distortion: vi.fn().mockImplementation(() => ({
    toDestination: vi.fn().mockReturnThis(),
    distortion: { value: 0.8 },
    wet: { value: 0.2 },
    dispose: vi.fn(),
  })),
  BitCrusher: vi.fn().mockImplementation(() => ({
    toDestination: vi.fn().mockReturnThis(),
    bits: { value: 4 },
    wet: { value: 0.2 },
    dispose: vi.fn(),
  })),
  context: {
    state: 'running',
    sampleRate: 44100,
    baseLatency: 0.01,
    outputLatency: 0.01,
  },
}))

// Global test utilities
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))

global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))