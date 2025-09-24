import { beforeEach, describe, expect, it } from 'vitest'
import { applyThemeTokens, THEME_CONFIGS, getThemeList } from '@/lib/theme-tokens'

describe('theme tokens', () => {
  beforeEach(() => {
    document.documentElement.removeAttribute('data-theme')
    document.documentElement.style.cssText = ''
  })

  it('exposes all themes through getThemeList', () => {
    const list = getThemeList()
    expect(list).toHaveLength(Object.keys(THEME_CONFIGS).length)
    const ids = list.map((theme) => theme.id)
    expect(ids.sort()).toEqual(Object.keys(THEME_CONFIGS).sort())
  })

  it('writes CSS variables and dataset when applying a theme', () => {
    const theme = THEME_CONFIGS.cyberpunk
    applyThemeTokens(theme)

    expect(document.documentElement.dataset.theme).toBe(theme.id)
    expect(document.documentElement.style.getPropertyValue('--primary')).not.toBe('')
    expect(document.documentElement.style.getPropertyValue('--surface')).not.toBe('')
    expect(document.documentElement.style.getPropertyValue('--surface-contrast')).not.toBe('')
    expect(document.documentElement.style.getPropertyValue('--glass-white')).toContain('rgba')
  })

  it('derives accessible foreground colors for bright palettes', () => {
    const theme = {
      ...THEME_CONFIGS.crystal,
      colors: {
        ...THEME_CONFIGS.crystal.colors,
        primary: '#fefefe',
        accent: '#ffffff',
      },
    }

    applyThemeTokens(theme)

    const primaryForeground = document.documentElement.style.getPropertyValue('--primary-foreground')
    const accentForeground = document.documentElement.style.getPropertyValue('--accent-foreground')

    expect(primaryForeground.trim()).toMatch(/\d+\s\d+%\s\d+%/)
    expect(accentForeground.trim()).toMatch(/\d+\s\d+%\s\d+%/)
  })
})
