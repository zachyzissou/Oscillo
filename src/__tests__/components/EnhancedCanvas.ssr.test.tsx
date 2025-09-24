import { describe, it, expect } from 'vitest'

describe('EnhancedCanvas SSR safety', () => {
  it('imports without accessing browser globals', async () => {
    const originalWindow = globalThis.window
    const originalNavigator = globalThis.navigator

    // @ts-ignore
    globalThis.window = undefined
    // @ts-ignore
    globalThis.navigator = undefined

    try {
      const module = await import('@/components/EnhancedCanvas')
      expect(module).toHaveProperty('default')
    } finally {
      globalThis.window = originalWindow
      globalThis.navigator = originalNavigator
    }
  })
})
