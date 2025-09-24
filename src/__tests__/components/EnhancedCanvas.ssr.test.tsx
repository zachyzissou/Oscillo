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
      const imported = await import('@/components/EnhancedCanvas')
      expect(imported).toHaveProperty('default')
    } finally {
      globalThis.window = originalWindow
      globalThis.navigator = originalNavigator
    }
  })
})
