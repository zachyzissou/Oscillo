import { describe, expect, it } from 'vitest'
import { SHADER_IDS, assertShaderId, isShaderId, shaderConfigurations } from '@/config/shaderConfigs'

describe('shader config ids', () => {
  it('accepts known ids and rejects invalid ids', () => {
    expect(isShaderId('metaball')).toBe(true)
    expect(isShaderId('rgbGlitch')).toBe(true)
    expect(isShaderId('glitch')).toBe(false)
    expect(isShaderId(42)).toBe(false)

    expect(assertShaderId('water')).toBe('water')
    expect(() => assertShaderId('glitch')).toThrow(/Invalid shader id: glitch/)
    expect(() => assertShaderId(42)).toThrow(/Invalid shader id: 42/)
  })

  it('keeps configured shader ids aligned with declared shader ids', () => {
    const configuredIds = shaderConfigurations.map((shader) => shader.id).sort()
    const declaredIds = [...SHADER_IDS].sort()

    expect(configuredIds).toEqual(declaredIds)
  })
})
