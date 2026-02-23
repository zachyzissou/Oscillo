// src/lib/audioNodePool.ts
// Removed unused ToneType import
import { logger } from '@/lib/logger'

interface PooledAudioNode {
  node: any
  inUse: boolean
  createdAt: number
}

function toErrorDetails(error: unknown): Record<string, string | undefined> {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
    }
  }

  return {
    message: String(error),
  }
}

class AudioNodePool {
  private readonly pools: Map<string, PooledAudioNode[]> = new Map()
  private readonly maxPoolSize = 10
  private readonly maxAge = 300000 // 5 minutes

  constructor() {
    // Cleanup old nodes periodically
    setInterval(() => this.cleanup(), 60000) // Every minute
  }

  async acquire(nodeType: string, createFn: () => any): Promise<any> {
    const pool = this.pools.get(nodeType) || []
    
    // Find available node
    const available = pool.find(item => !item.inUse)
    if (available) {
      available.inUse = true
      return available.node
    }

    // Create new node if pool not at capacity
    if (pool.length < this.maxPoolSize) {
      const node = createFn()
      const pooledNode: PooledAudioNode = {
        node,
        inUse: true,
        createdAt: Date.now()
      }
      pool.push(pooledNode)
      this.pools.set(nodeType, pool)
      return node
    }

    // Pool at capacity, create temporary node
    return createFn()
  }

  release(nodeType: string, node: any): void {
    const pool = this.pools.get(nodeType)
    if (!pool) return

    const pooledNode = pool.find(item => item.node === node)
    if (pooledNode) {
      pooledNode.inUse = false
      
      // Reset node to default state
      this.resetNode(node)
    }
  }

  private resetNode(node: any): void {
    try {
      // Reset common audio node properties
      if (node.volume && typeof node.volume.value === 'number') {
        node.volume.value = 0
      }
      if (node.wet && typeof node.wet.value === 'number') {
        node.wet.value = 0.5
      }
      if (node.frequency && typeof node.frequency.value === 'number') {
        node.frequency.value = 440
      }
      
      // Stop any active notes
      if (typeof node.releaseAll === 'function') {
        node.releaseAll()
      }
    } catch (error) {
      logger.warn({
        event: 'audio-node-pool.reset-failed',
        error: toErrorDetails(error),
      })
    }
  }

  private cleanup(): void {
    const now = Date.now()
    
    for (const [nodeType, pool] of Array.from(this.pools.entries())) {
      const cleaned = pool.filter(item => {
        const isOld = now - item.createdAt > this.maxAge
        const shouldRemove = !item.inUse && isOld
        
        if (shouldRemove) {
          try {
            // Dispose of old nodes
            if (typeof item.node.dispose === 'function') {
              item.node.dispose()
            }
          } catch (error) {
            logger.warn({
              event: 'audio-node-pool.cleanup-dispose-failed',
              nodeType,
              error: toErrorDetails(error),
            })
          }
        }
        
        return !shouldRemove
      })
      
      this.pools.set(nodeType, cleaned)
    }
  }

  getStats(): Record<string, { total: number, inUse: number, available: number }> {
    const stats: Record<string, { total: number, inUse: number, available: number }> = {}
    
    for (const [nodeType, pool] of Array.from(this.pools.entries())) {
      const inUse = pool.filter(item => item.inUse).length
      stats[nodeType] = {
        total: pool.length,
        inUse,
        available: pool.length - inUse
      }
    }
    
    return stats
  }

  dispose(): void {
    for (const [, pool] of Array.from(this.pools.entries())) {
      for (const item of pool) {
        try {
          if (typeof item.node.dispose === 'function') {
            item.node.dispose()
          }
        } catch (error) {
          logger.warn({
            event: 'audio-node-pool.dispose-failed',
            error: toErrorDetails(error),
          })
        }
      }
    }
    this.pools.clear()
  }
}

export const audioNodePool = new AudioNodePool()

// Cleanup on page unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    audioNodePool.dispose()
  })
}
