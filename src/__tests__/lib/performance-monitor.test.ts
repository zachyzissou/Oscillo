// src/__tests__/lib/performance-monitor.test.ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { performanceMonitor } from '@/lib/performance-monitor'

describe('PerformanceMonitor', () => {
  beforeEach(() => {
    performanceMonitor.stop()
    vi.clearAllMocks()
  })

  afterEach(() => {
    performanceMonitor.stop()
  })

  it('should start and stop monitoring', () => {
    expect(performanceMonitor['isRunning']).toBe(false)
    
    performanceMonitor.start()
    expect(performanceMonitor['isRunning']).toBe(true)
    
    performanceMonitor.stop()
    expect(performanceMonitor['isRunning']).toBe(false)
  })

  it('should collect performance metrics', async () => {
    performanceMonitor.start()
    
    // Wait for a few frames
    await new Promise(resolve => setTimeout(resolve, 100))
    
    const metrics = performanceMonitor.getLatestMetrics()
    expect(metrics).toBeTruthy()
    if (metrics) {
      expect(metrics.fps).toBeGreaterThan(0)
      expect(metrics.frameTime).toBeGreaterThan(0)
      expect(metrics.memoryUsed).toBeGreaterThan(0)
      expect(metrics.timestamp).toBeGreaterThan(0)
    }
  })

  it('should calculate average metrics', async () => {
    performanceMonitor.start()
    
    // Wait for multiple frames
    await new Promise(resolve => setTimeout(resolve, 200))
    
    const averages = performanceMonitor.getAverageMetrics()
    expect(averages.fps).toBeGreaterThan(0)
    expect(averages.frameTime).toBeGreaterThan(0)
    expect(averages.memoryUsed).toBeGreaterThan(0)
  })

  it('should check performance budgets', async () => {
    performanceMonitor.start()
    await new Promise(resolve => setTimeout(resolve, 100))
    
    const budgetCheck = performanceMonitor.checkBudgets()
    expect(budgetCheck).toHaveProperty('passed')
    expect(budgetCheck).toHaveProperty('violations')
    expect(Array.isArray(budgetCheck.violations)).toBe(true)
  })

  it('should notify observers of metrics updates', async () => {
    const mockCallback = vi.fn()
    const unsubscribe = performanceMonitor.onMetricsUpdate(mockCallback)
    
    performanceMonitor.start()
    await new Promise(resolve => setTimeout(resolve, 100))
    
    expect(mockCallback).toHaveBeenCalled()
    unsubscribe()
  })

  it('should export performance report', async () => {
    performanceMonitor.start()
    await new Promise(resolve => setTimeout(resolve, 100))
    
    const report = performanceMonitor.exportReport()
    expect(typeof report).toBe('string')
    
    const parsed = JSON.parse(report)
    expect(parsed).toHaveProperty('timestamp')
    expect(parsed).toHaveProperty('latest')
    expect(parsed).toHaveProperty('averages')
    expect(parsed).toHaveProperty('budgetCheck')
    expect(parsed).toHaveProperty('history')
  })

  it('should set custom budgets', () => {
    const customBudgets = {
      minFps: 60,
      maxFrameTime: 16.67,
      maxMemoryUsage: 100 * 1024 * 1024,
      maxAudioLatency: 20,
    }
    
    performanceMonitor.setBudgets(customBudgets)
    
    // Access private property for testing
    const budgets = (performanceMonitor as any).budgets
    expect(budgets.minFps).toBe(60)
    expect(budgets.maxFrameTime).toBe(16.67)
    expect(budgets.maxMemoryUsage).toBe(100 * 1024 * 1024)
    expect(budgets.maxAudioLatency).toBe(20)
  })

  it('should limit metrics history', async () => {
    performanceMonitor.start()
    
    // Wait for more than 60 frames worth of data
    await new Promise(resolve => setTimeout(resolve, 1200))
    
    const history = performanceMonitor.getMetricsHistory()
    expect(history.length).toBeLessThanOrEqual(60)
  })
})