// src/lib/performance-monitor.ts
/**
 * Lightweight Performance Monitoring System
 * Tracks FPS, memory usage, audio latency, and WebGL/GPU performance
 */

export interface PerformanceMetrics {
  fps: number
  frameTime: number
  memoryUsed: number
  memoryTotal: number
  audioLatency: number
  gpuMemory?: number
  webglRenderer: string
  rafDrift: number
  timestamp: number
}

export interface PerformanceBudgets {
  minFps: number
  maxFrameTime: number
  maxMemoryUsage: number
  maxAudioLatency: number
}

class PerformanceMonitor {
  private metrics: PerformanceMetrics[] = []
  private rafId: number | null = null
  private lastFrameTime = 0
  private frameCount = 0
  private startTime = 0
  private isRunning = false
  
  // Budget thresholds
  private budgets: PerformanceBudgets = {
    minFps: 30, // Minimum acceptable FPS
    maxFrameTime: 33.33, // Max frame time for 30fps (ms)
    maxMemoryUsage: 200 * 1024 * 1024, // 200MB
    maxAudioLatency: 50, // 50ms
  }
  
  private observers: ((metrics: PerformanceMetrics) => void)[] = []

  start() {
    if (this.isRunning) return
    
    this.isRunning = true
    this.startTime = performance.now()
    this.lastFrameTime = this.startTime
    this.frameCount = 0
    
    this.measureFrame()
  }

  stop() {
    if (this.rafId) {
      cancelAnimationFrame(this.rafId)
      this.rafId = null
    }
    this.isRunning = false
  }

  private measureFrame = () => {
    const now = performance.now()
    const frameTime = now - this.lastFrameTime
    this.frameCount++
    
    // Calculate FPS over last second
    const elapsed = now - this.startTime
    const fps = elapsed > 0 ? (this.frameCount * 1000) / elapsed : 0
    
    // Reset counters every second
    if (elapsed >= 1000) {
      this.startTime = now
      this.frameCount = 0
    }
    
    const metrics: PerformanceMetrics = {
      fps: Math.round(fps),
      frameTime: Math.round(frameTime * 100) / 100,
      memoryUsed: this.getMemoryUsage(),
      memoryTotal: this.getTotalMemory(),
      audioLatency: this.getAudioLatency(),
      gpuMemory: this.getGPUMemory(),
      webglRenderer: this.getWebGLRenderer(),
      rafDrift: this.getRAFDrift(now),
      timestamp: now,
    }
    
    this.metrics.push(metrics)
    
    // Keep only last 60 measurements (1 second at 60fps)
    if (this.metrics.length > 60) {
      this.metrics.shift()
    }
    
    // Notify observers
    this.observers.forEach(callback => callback(metrics))
    
    this.lastFrameTime = now
    this.rafId = requestAnimationFrame(this.measureFrame)
  }

  private getMemoryUsage(): number {
    if ('memory' in performance) {
      const memory = (performance as any).memory
      return memory.usedJSHeapSize || 0
    }
    return 0
  }

  private getTotalMemory(): number {
    if ('memory' in performance) {
      const memory = (performance as any).memory
      return memory.totalJSHeapSize || 0
    }
    return 0
  }

  private getAudioLatency(): number {
    // Measure audio context latency if available
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      const latency = audioContext.baseLatency * 1000 + (audioContext.outputLatency || 0) * 1000
      audioContext.close()
      return Math.round(latency * 100) / 100
    } catch {
      return 0
    }
  }

  private getGPUMemory(): number | undefined {
    // Try to get WebGL memory info if available
    try {
      const canvas = document.createElement('canvas')
      const gl = canvas.getContext('webgl2') || canvas.getContext('webgl')
      if (gl) {
        const ext = gl.getExtension('WEBGL_debug_renderer_info')
        if (ext) {
          const renderer = gl.getParameter(ext.UNMASKED_RENDERER_WEBGL)
          // Extract memory from renderer string if available
          const memMatch = renderer.match(/(\d+)MB/i)
          if (memMatch) {
            return parseInt(memMatch[1]) * 1024 * 1024
          }
        }
      }
    } catch {
      // Ignore errors
    }
    return undefined
  }

  private getWebGLRenderer(): string {
    try {
      const canvas = document.createElement('canvas')
      const gl = canvas.getContext('webgl2') || canvas.getContext('webgl')
      if (gl) {
        const ext = gl.getExtension('WEBGL_debug_renderer_info')
        if (ext) {
          return gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) || 'Unknown'
        }
        return gl.getParameter(gl.RENDERER) || 'WebGL'
      }
    } catch {
      // Ignore errors
    }
    return 'Unknown'
  }

  private getRAFDrift(now: number): number {
    // Calculate drift from expected 16.67ms (60fps)
    const expectedInterval = 1000 / 60
    const actualInterval = now - this.lastFrameTime
    return Math.abs(actualInterval - expectedInterval)
  }

  // Public API
  getLatestMetrics(): PerformanceMetrics | null {
    return this.metrics[this.metrics.length - 1] || null
  }

  getMetricsHistory(): PerformanceMetrics[] {
    return [...this.metrics]
  }

  getAverageMetrics(samples = 30): Partial<PerformanceMetrics> {
    if (this.metrics.length === 0) return {}
    
    const recent = this.metrics.slice(-samples)
    const avg = {
      fps: recent.reduce((sum, m) => sum + m.fps, 0) / recent.length,
      frameTime: recent.reduce((sum, m) => sum + m.frameTime, 0) / recent.length,
      memoryUsed: recent.reduce((sum, m) => sum + m.memoryUsed, 0) / recent.length,
      audioLatency: recent.reduce((sum, m) => sum + m.audioLatency, 0) / recent.length,
      rafDrift: recent.reduce((sum, m) => sum + m.rafDrift, 0) / recent.length,
    }
    
    return {
      fps: Math.round(avg.fps),
      frameTime: Math.round(avg.frameTime * 100) / 100,
      memoryUsed: Math.round(avg.memoryUsed),
      audioLatency: Math.round(avg.audioLatency * 100) / 100,
      rafDrift: Math.round(avg.rafDrift * 100) / 100,
    }
  }

  checkBudgets(): { passed: boolean; violations: string[] } {
    const latest = this.getLatestMetrics()
    if (!latest) return { passed: true, violations: [] }
    
    const violations: string[] = []
    
    if (latest.fps < this.budgets.minFps) {
      violations.push(`FPS too low: ${latest.fps} < ${this.budgets.minFps}`)
    }
    
    if (latest.frameTime > this.budgets.maxFrameTime) {
      violations.push(`Frame time too high: ${latest.frameTime}ms > ${this.budgets.maxFrameTime}ms`)
    }
    
    if (latest.memoryUsed > this.budgets.maxMemoryUsage) {
      violations.push(`Memory usage too high: ${Math.round(latest.memoryUsed / 1024 / 1024)}MB > ${Math.round(this.budgets.maxMemoryUsage / 1024 / 1024)}MB`)
    }
    
    if (latest.audioLatency > this.budgets.maxAudioLatency) {
      violations.push(`Audio latency too high: ${latest.audioLatency}ms > ${this.budgets.maxAudioLatency}ms`)
    }
    
    return {
      passed: violations.length === 0,
      violations,
    }
  }

  setBudgets(budgets: Partial<PerformanceBudgets>) {
    this.budgets = { ...this.budgets, ...budgets }
  }

  onMetricsUpdate(callback: (metrics: PerformanceMetrics) => void) {
    this.observers.push(callback)
    return () => {
      const index = this.observers.indexOf(callback)
      if (index > -1) {
        this.observers.splice(index, 1)
      }
    }
  }

  exportReport(): string {
    const latest = this.getLatestMetrics()
    const averages = this.getAverageMetrics()
    const budgetCheck = this.checkBudgets()
    
    return JSON.stringify({
      timestamp: new Date().toISOString(),
      latest,
      averages,
      budgetCheck,
      history: this.metrics,
    }, null, 2)
  }
}

// Global instance
export const performanceMonitor = new PerformanceMonitor()

// Auto-start in development or when ?perf=1 is present
if (typeof window !== 'undefined') {
  const params = new URLSearchParams(window.location.search)
  if (params.get('perf') === '1' || process.env.NODE_ENV === 'development') {
    performanceMonitor.start()
  }
}