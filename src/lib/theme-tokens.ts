export type VisualTheme = 'cyberpunk' | 'organic' | 'crystal' | 'plasma' | 'ethereal'

export interface ThemeColors {
  primary: string
  secondary: string
  accent: string
  background: string
  surface: string
  surfaceContrast: string
}

export interface ThemeEffects {
  bloomIntensity: number
  chromaticAberration: number
  particleIntensity: number
  glitchEnabled: boolean
}

export interface ThemeMaterials {
  default: string
  metalness: number
  roughness: number
  transmission: number
}

export interface ThemeConfig {
  id: VisualTheme
  name: string
  colors: ThemeColors
  effects: ThemeEffects
  materials: ThemeMaterials
}

export const DEFAULT_THEME: VisualTheme = 'ethereal'

export const NEON_PALETTE = {
  cyan: '#00ffff',
  pink: '#ff00ff',
  green: '#4ade80',
  purple: '#9d00ff',
  orange: '#ff6600',
  blue: '#3b82f6',
  violet: '#8b5cf6',
}

export const GLASS_PALETTE = {
  white: 'rgba(255, 255, 255, 0.08)',
  dark: 'rgba(15, 15, 35, 0.28)',
  backdrop: 'rgba(15, 15, 35, 0.72)',
}

export const SURFACE_SHADES = {
  panel: '#111427',
  overlay: '#0b0d1a',
  border: '#1f243a',
}

export const THEME_CONFIGS: Record<VisualTheme, ThemeConfig> = {
  cyberpunk: {
    id: 'cyberpunk',
    name: 'Cyberpunk',
    colors: {
      primary: '#00ffff',
      secondary: '#ff00ff',
      accent: '#ffff00',
      background: '#05070f',
      surface: '#0d1022',
      surfaceContrast: '#e9ecff',
    },
    effects: {
      bloomIntensity: 2.5,
      chromaticAberration: 0.003,
      particleIntensity: 2.0,
      glitchEnabled: true,
    },
    materials: {
      default: 'holographic',
      metalness: 0.9,
      roughness: 0.08,
      transmission: 0.0,
    },
  },
  organic: {
    id: 'organic',
    name: 'Organic',
    colors: {
      primary: '#00ff88',
      secondary: '#88ff00',
      accent: '#00ffaa',
      background: '#0a150d',
      surface: '#122016',
      surfaceContrast: '#efffec',
    },
    effects: {
      bloomIntensity: 1.8,
      chromaticAberration: 0.001,
      particleIntensity: 1.5,
      glitchEnabled: false,
    },
    materials: {
      default: 'cymatic',
      metalness: 0.35,
      roughness: 0.68,
      transmission: 0.2,
    },
  },
  crystal: {
    id: 'crystal',
    name: 'Crystal',
    colors: {
      primary: '#c8f0ff',
      secondary: '#9ad9ff',
      accent: '#ffe7ff',
      background: '#0f1426',
      surface: '#162039',
      surfaceContrast: '#f7fbff',
    },
    effects: {
      bloomIntensity: 3.0,
      chromaticAberration: 0.004,
      particleIntensity: 2.8,
      glitchEnabled: false,
    },
    materials: {
      default: 'crystal',
      metalness: 0.05,
      roughness: 0.07,
      transmission: 0.92,
    },
  },
  plasma: {
    id: 'plasma',
    name: 'Plasma',
    colors: {
      primary: '#ff2d8d',
      secondary: '#7a1fff',
      accent: '#ff8240',
      background: '#190616',
      surface: '#250925',
      surfaceContrast: '#ffe3ff',
    },
    effects: {
      bloomIntensity: 2.8,
      chromaticAberration: 0.004,
      particleIntensity: 2.5,
      glitchEnabled: true,
    },
    materials: {
      default: 'plasma',
      metalness: 0.78,
      roughness: 0.22,
      transmission: 0.12,
    },
  },
  ethereal: {
    id: 'ethereal',
    name: 'Ethereal',
    colors: {
      primary: '#88aaff',
      secondary: '#aa88ff',
      accent: '#88ffaa',
      background: '#0f0f1a',
      surface: '#161629',
      surfaceContrast: '#f0f5ff',
    },
    effects: {
      bloomIntensity: 2.2,
      chromaticAberration: 0.002,
      particleIntensity: 1.8,
      glitchEnabled: false,
    },
    materials: {
      default: 'holographic',
      metalness: 0.5,
      roughness: 0.3,
      transmission: 0.3,
    },
  },
}

function hexToRgb(hex: string) {
  let cleaned = hex.replace('#', '')
  if (cleaned.length === 3) {
    cleaned = cleaned
      .split('')
      .map((char) => char + char)
      .join('')
  }
  const bigint = parseInt(cleaned, 16)
  const r = (bigint >> 16) & 255
  const g = (bigint >> 8) & 255
  const b = bigint & 255
  return { r, g, b }
}

function rgbToHsl(r: number, g: number, b: number) {
  r /= 255
  g /= 255
  b /= 255

  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  let h = 0
  let s = 0
  const l = (max + min) / 2

  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0)
        break
      case g:
        h = (b - r) / d + 2
        break
      case b:
        h = (r - g) / d + 4
        break
      default:
        break
    }
    h /= 6
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  }
}

function hexToHslString(hex: string) {
  const { r, g, b } = hexToRgb(hex)
  const { h, s, l } = rgbToHsl(r, g, b)
  return `${h} ${s}% ${l}%`
}

function preferredForeground(hex: string) {
  const { r, g, b } = hexToRgb(hex)
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  return luminance > 0.55 ? '222 47% 11%' : '210 40% 96%'
}

export function applyThemeTokens(config: ThemeConfig) {
  if (typeof document === 'undefined') return
  const root = document.documentElement

  root.dataset.theme = config.id

  const primaryHsl = hexToHslString(config.colors.primary)
  const secondaryHsl = hexToHslString(config.colors.secondary)
  const accentHsl = hexToHslString(config.colors.accent)
  const backgroundHsl = hexToHslString(config.colors.background)
  const surfaceHsl = hexToHslString(config.colors.surface)
  const contrastHsl = hexToHslString(config.colors.surfaceContrast)

  root.style.setProperty('--background', backgroundHsl)
  root.style.setProperty('--foreground', contrastHsl)
  root.style.setProperty('--surface', surfaceHsl)
  root.style.setProperty('--surface-contrast', contrastHsl)
  root.style.setProperty('--card', surfaceHsl)
  root.style.setProperty('--card-foreground', contrastHsl)
  root.style.setProperty('--popover', surfaceHsl)
  root.style.setProperty('--popover-foreground', contrastHsl)
  root.style.setProperty('--muted', '223 47% 20%')
  root.style.setProperty('--muted-foreground', '215 20% 72%')
  root.style.setProperty('--accent', accentHsl)
  root.style.setProperty('--accent-foreground', preferredForeground(config.colors.accent))
  root.style.setProperty('--border', hexToHslString(SURFACE_SHADES.border))
  root.style.setProperty('--input', hexToHslString(SURFACE_SHADES.overlay))
  root.style.setProperty('--ring', primaryHsl)
  root.style.setProperty('--destructive', '0 84% 60%')
  root.style.setProperty('--destructive-foreground', '210 40% 96%')
  root.style.setProperty('--primary', primaryHsl)
  root.style.setProperty('--primary-foreground', preferredForeground(config.colors.primary))
  root.style.setProperty('--secondary', secondaryHsl)
  root.style.setProperty('--secondary-foreground', preferredForeground(config.colors.secondary))
  root.style.setProperty('--radius', '1rem')

  root.style.setProperty('--oscillo-bg', hexToHslString('#0f0f23'))
  root.style.setProperty('--oscillo-surface', hexToHslString(SURFACE_SHADES.panel))
  root.style.setProperty('--oscillo-accent', hexToHslString('#4ade80'))
  root.style.setProperty('--oscillo-secondary', hexToHslString('#3b82f6'))
  root.style.setProperty('--oscillo-warning', hexToHslString('#f59e0b'))
  root.style.setProperty('--oscillo-danger', hexToHslString('#ef4444'))

  Object.entries(NEON_PALETTE).forEach(([key, value]) => {
    root.style.setProperty(`--neon-${key}`, hexToHslString(value))
  })

  root.style.setProperty('--glass-white', GLASS_PALETTE.white)
  root.style.setProperty('--glass-dark', GLASS_PALETTE.dark)
  root.style.setProperty('--glass-backdrop', GLASS_PALETTE.backdrop)
}

export const getThemeList = () => Object.values(THEME_CONFIGS)
