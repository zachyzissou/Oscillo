'use client'
import { useEffect, useState } from 'react'
import { performanceMonitor, PerformanceMetrics } from '@/lib/performance-monitor'

interface PerformanceOverlayProps {
  visible?: boolean
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
}

export function PerformanceOverlay({ 
  visible = true, 
  position = 'top-right' 
}: PerformanceOverlayProps) {
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null)
  const [averages, setAverages] = useState<Partial<PerformanceMetrics>>({})
  const [budgetStatus, setBudgetStatus] = useState(performanceMonitor.getBudgetStatus())

  useEffect(() => {
    if (!visible) return

    const unsubscribe = performanceMonitor.onMetricsUpdate((newMetrics) => {
      setMetrics(newMetrics)
      setAverages(performanceMonitor.getAverageMetrics())
      const status = performanceMonitor.checkBudgets()
      setBudgetStatus(status)
      if (!status.passed) {
        console.warn('Performance budgets violated', status)
      }
    })

    return unsubscribe
  }, [visible])

  if (!visible || !metrics) return null

  const positionClasses = {
    'top-left': 'top-4 left-4',
    'top-right': 'top-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'bottom-right': 'bottom-4 right-4',
  }

  const formatMemory = (bytes: number) => {
    return `${Math.round(bytes / 1024 / 1024)}MB`
  }

  const getFPSColor = (fps: number) => {
    if (fps >= 55) return 'text-green-400'
    if (fps >= 30) return 'text-yellow-400'
    return 'text-red-400'
  }

  const getLatencyColor = (latency: number) => {
    if (latency <= 20) return 'text-green-400'
    if (latency <= 50) return 'text-yellow-400'
    return 'text-red-400'
  }

  return (
    <div className={`fixed ${positionClasses[position]} z-50 pointer-events-none`}>
      <div className="bg-black/80 backdrop-blur-sm text-white text-xs font-mono p-3 rounded-lg border border-white/20 min-w-[200px]">
        <div className="flex items-center justify-between mb-2">
          <span className="text-gray-300">Performance</span>
          <button 
            className="text-gray-400 hover:text-white pointer-events-auto"
            onClick={() => {
              const report = performanceMonitor.exportReport()
              const blob = new Blob([report], { type: 'application/json' })
              const url = URL.createObjectURL(blob)
              const a = document.createElement('a')
              a.href = url
              a.download = `perf-report-${Date.now()}.json`
              a.click()
              URL.revokeObjectURL(url)
            }}
            title="Export Performance Report"
          >
            ↓
          </button>
        </div>

        <div className="space-y-1">
          {!budgetStatus.passed && (
            <div className="flex items-start gap-2 rounded-md border border-red-500/40 bg-red-500/10 px-2 py-2 text-red-300">
              <span className="font-semibold">Budgets</span>
              <span className="text-[10px] leading-tight">
                {budgetStatus.violations.join(' • ')}
              </span>
            </div>
          )}

          <div className="flex justify-between">
            <span>FPS:</span>
            <span className={getFPSColor(metrics.fps)}>
              {metrics.fps} <span className="text-gray-400">({averages.fps})</span>
            </span>
          </div>
          
          <div className="flex justify-between">
            <span>Frame:</span>
            <span className={metrics.frameTime > 33 ? 'text-red-400' : 'text-green-400'}>
              {metrics.frameTime}ms
            </span>
          </div>
          
          <div className="flex justify-between">
            <span>Memory:</span>
            <span className={metrics.memoryUsed > 200 * 1024 * 1024 ? 'text-red-400' : 'text-green-400'}>
              {formatMemory(metrics.memoryUsed)}
            </span>
          </div>
          
          <div className="flex justify-between">
            <span>Audio:</span>
            <span className={getLatencyColor(metrics.audioLatency)}>
              {metrics.audioLatency}ms
            </span>
          </div>
          
          <div className="flex justify-between">
            <span>RAF Drift:</span>
            <span className={metrics.rafDrift > 5 ? 'text-yellow-400' : 'text-green-400'}>
              {metrics.rafDrift}ms
            </span>
          </div>
          
          {metrics.gpuMemory && (
            <div className="flex justify-between">
              <span>GPU:</span>
              <span className="text-blue-400">
                {formatMemory(metrics.gpuMemory)}
              </span>
            </div>
          )}
          
          <div className="border-t border-white/20 pt-1 mt-2">
            <div className="text-gray-400 text-[10px] truncate" title={metrics.webglRenderer}>
              {metrics.webglRenderer}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Hook for performance data
export function usePerformanceData() {
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null)
  const [isRunning, setIsRunning] = useState(false)

  useEffect(() => {
    const unsubscribe = performanceMonitor.onMetricsUpdate(setMetrics)
    return unsubscribe
  }, [])

  const start = () => {
    performanceMonitor.start()
    setIsRunning(true)
  }

  const stop = () => {
    performanceMonitor.stop()
    setIsRunning(false)
  }

  const exportReport = () => {
    return performanceMonitor.exportReport()
  }

  const checkBudgets = () => {
    return performanceMonitor.checkBudgets()
  }

  return {
    metrics,
    isRunning,
    start,
    stop,
    exportReport,
    checkBudgets,
    averages: performanceMonitor.getAverageMetrics(),
  }
}
