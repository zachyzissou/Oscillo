// Config file - no client components

// Define possible icon types
export type ShaderIconType = 
  | 'sparkles' 
  | 'bolt' 
  | 'fire' 
  | 'beaker'
  | 'eyeDropper'
  | 'swatch'
  | 'cube'
  | 'globeAlt'
  | 'squares2X2'
  | 'adjustmentsHorizontal'
  | 'cloudArrowUp'

export const SHADER_IDS = [
  'metaball',
  'proceduralNoise',
  'water',
  'rgbGlitch',
  'voronoi',
  'plasma',
  'noise',
  'ripple',
  'particleField',
] as const

export type ShaderId = (typeof SHADER_IDS)[number]

const shaderIdSet: ReadonlySet<string> = new Set(SHADER_IDS)

export function isShaderId(value: unknown): value is ShaderId {
  return typeof value === 'string' && shaderIdSet.has(value)
}

export function assertShaderId(value: unknown): ShaderId {
  if (!isShaderId(value)) {
    throw new Error(`Invalid shader id: ${String(value)}`)
  }
  return value
}

export interface ShaderConfig {
  id: ShaderId
  name: string
  iconType: ShaderIconType
  description?: string
  params: Record<
    string,
    {
      value: number
      min: number
      max: number
      step: number
      label: string
    }
  >
}

export const shaderConfigurations: ShaderConfig[] = [
  {
    id: 'metaball',
    name: 'Metaballs',
    iconType: 'sparkles',
    params: {
      metaballCount: {
        value: 3,
        min: 1,
        max: 8,
        step: 1,
        label: 'Count'
      },
      glowIntensity: {
        value: 1.2,
        min: 0.1,
        max: 3.0,
        step: 0.1,
        label: 'Glow'
      },
      colorPrimaryR: {
        value: 0.2,
        min: 0.0,
        max: 1.0,
        step: 0.01,
        label: 'Color R'
      },
      colorPrimaryG: {
        value: 0.8,
        min: 0.0,
        max: 1.0,
        step: 0.01,
        label: 'Color G'
      },
      colorPrimaryB: {
        value: 1.0,
        min: 0.0,
        max: 1.0,
        step: 0.01,
        label: 'Color B'
      },
      animationSpeed: {
        value: 1.0,
        min: 0.1,
        max: 3.0,
        step: 0.1,
        label: 'Speed'
      }
    }
  },
  {
    id: 'proceduralNoise',
    name: 'Noise',
    iconType: 'beaker',
    params: {
      noiseScale: {
        value: 3.0,
        min: 0.5,
        max: 10.0,
        step: 0.1,
        label: 'Scale'
      },
      distortionAmount: {
        value: 0.5,
        min: 0.0,
        max: 2.0,
        step: 0.05,
        label: 'Distortion'
      },
      colorAR: {
        value: 0.1,
        min: 0.0,
        max: 1.0,
        step: 0.01,
        label: 'Color A-R'
      },
      colorAG: {
        value: 0.2,
        min: 0.0,
        max: 1.0,
        step: 0.01,
        label: 'Color A-G'
      },
      colorAB: {
        value: 0.8,
        min: 0.0,
        max: 1.0,
        step: 0.01,
        label: 'Color A-B'
      },
      colorBR: {
        value: 0.8,
        min: 0.0,
        max: 1.0,
        step: 0.01,
        label: 'Color B-R'
      },
      colorBG: {
        value: 0.3,
        min: 0.0,
        max: 1.0,
        step: 0.01,
        label: 'Color B-G'
      },
      colorBB: {
        value: 0.1,
        min: 0.0,
        max: 1.0,
        step: 0.01,
        label: 'Color B-B'
      }
    }
  },
  {
    id: 'water',
    name: 'Ripples',
    iconType: 'globeAlt',
    params: {
      rippleSpeed: {
        value: 2.0,
        min: 0.1,
        max: 5.0,
        step: 0.1,
        label: 'Speed'
      },
      rippleStrength: {
        value: 0.8,
        min: 0.1,
        max: 2.0,
        step: 0.05,
        label: 'Strength'
      },
      centerX: {
        value: 0.5,
        min: 0.0,
        max: 1.0,
        step: 0.01,
        label: 'Center X'
      },
      centerY: {
        value: 0.5,
        min: 0.0,
        max: 1.0,
        step: 0.01,
        label: 'Center Y'
      },
      colorIntensity: {
        value: 1.0,
        min: 0.1,
        max: 3.0,
        step: 0.1,
        label: 'Intensity'
      }
    }
  },
  {
    id: 'rgbGlitch',
    name: 'RGB Glitch',
    iconType: 'bolt',
    params: {
      glitchIntensity: {
        value: 0.5,
        min: 0.0,
        max: 2.0,
        step: 0.05,
        label: 'Intensity'
      },
      colorSeparation: {
        value: 0.02,
        min: 0.0,
        max: 0.1,
        step: 0.001,
        label: 'Separation'
      },
      scanlineFreq: {
        value: 100.0,
        min: 10.0,
        max: 500.0,
        step: 10.0,
        label: 'Scanlines'
      },
      noiseAmount: {
        value: 0.1,
        min: 0.0,
        max: 1.0,
        step: 0.01,
        label: 'Noise'
      },
      flickerSpeed: {
        value: 10.0,
        min: 1.0,
        max: 50.0,
        step: 1.0,
        label: 'Flicker'
      }
    }
  },
  {
    id: 'voronoi',
    name: 'Voronoi',
    iconType: 'cube',
    params: {
      cellCount: {
        value: 8,
        min: 3,
        max: 20,
        step: 1,
        label: 'Cells'
      },
      animationSpeed: {
        value: 1.0,
        min: 0.1,
        max: 3.0,
        step: 0.1,
        label: 'Speed'
      },
      edgeWidth: {
        value: 0.05,
        min: 0.01,
        max: 0.2,
        step: 0.01,
        label: 'Edge Width'
      },
      colorVariation: {
        value: 0.7,
        min: 0.0,
        max: 2.0,
        step: 0.1,
        label: 'Color Variation'
      },
      brightness: {
        value: 1.2,
        min: 0.1,
        max: 3.0,
        step: 0.1,
        label: 'Brightness'
      }
    }
  },
  {
    id: 'plasma',
    name: 'Plasma',
    iconType: 'fire',
    params: {
      frequency1: {
        value: 2.0,
        min: 0.5,
        max: 10.0,
        step: 0.1,
        label: 'Freq 1'
      },
      frequency2: {
        value: 3.0,
        min: 0.5,
        max: 10.0,
        step: 0.1,
        label: 'Freq 2'
      },
      phase1: {
        value: 0.0,
        min: 0.0,
        max: 6.28,
        step: 0.1,
        label: 'Phase 1'
      },
      phase2: {
        value: 1.57,
        min: 0.0,
        max: 6.28,
        step: 0.1,
        label: 'Phase 2'
      },
      colorShift: {
        value: 0.5,
        min: 0.0,
        max: 1.0,
        step: 0.01,
        label: 'Color Shift'
      },
      intensity: {
        value: 1.5,
        min: 0.1,
        max: 3.0,
        step: 0.1,
        label: 'Intensity'
      }
    }
  },
  {
    id: 'noise',
    name: 'Procedural Noise',
    iconType: 'cloudArrowUp',
    description: 'Advanced multi-octave noise with domain warping',
    params: {
      noiseScale: {
        value: 4.0,
        min: 0.5,
        max: 12.0,
        step: 0.1,
        label: 'Scale'
      },
      octaves: {
        value: 6,
        min: 1,
        max: 8,
        step: 1,
        label: 'Octaves'
      },
      warpAmount: {
        value: 0.5,
        min: 0.0,
        max: 2.0,
        step: 0.05,
        label: 'Warp'
      },
      timeScale: {
        value: 0.2,
        min: 0.05,
        max: 1.0,
        step: 0.05,
        label: 'Time Scale'
      },
      colorMix: {
        value: 0.8,
        min: 0.0,
        max: 1.0,
        step: 0.01,
        label: 'Color Mix'
      },
      edgeEnhancement: {
        value: 20.0,
        min: 0.0,
        max: 50.0,
        step: 1.0,
        label: 'Edge Enhance'
      }
    }
  },
  {
    id: 'ripple',
    name: 'Advanced Ripples',
    iconType: 'adjustmentsHorizontal',
    description: 'Multi-layered interference ripple patterns',
    params: {
      rippleCount: {
        value: 4,
        min: 1,
        max: 8,
        step: 1,
        label: 'Sources'
      },
      frequency: {
        value: 25.0,
        min: 5.0,
        max: 50.0,
        step: 1.0,
        label: 'Frequency'
      },
      amplitude: {
        value: 0.3,
        min: 0.1,
        max: 1.0,
        step: 0.05,
        label: 'Amplitude'
      },
      decay: {
        value: 3.0,
        min: 1.0,
        max: 8.0,
        step: 0.1,
        label: 'Decay'
      },
      interferenceStrength: {
        value: 1.0,
        min: 0.0,
        max: 2.0,
        step: 0.1,
        label: 'Interference'
      },
      causticsIntensity: {
        value: 0.3,
        min: 0.0,
        max: 1.0,
        step: 0.05,
        label: 'Caustics'
      }
    }
  },
  {
    id: 'particleField',
    name: 'Particle Field',
    iconType: 'squares2X2',
    description: 'Dynamic particle system with connections',
    params: {
      particleDensity: {
        value: 20.0,
        min: 5.0,
        max: 40.0,
        step: 1.0,
        label: 'Density'
      },
      particleSize: {
        value: 0.02,
        min: 0.005,
        max: 0.05,
        step: 0.001,
        label: 'Size'
      },
      connectionDistance: {
        value: 0.8,
        min: 0.2,
        max: 1.5,
        step: 0.05,
        label: 'Connections'
      },
      flowStrength: {
        value: 0.01,
        min: 0.0,
        max: 0.05,
        step: 0.001,
        label: 'Flow'
      },
      trailLength: {
        value: 5,
        min: 1,
        max: 10,
        step: 1,
        label: 'Trails'
      },
      colorVariation: {
        value: 1.0,
        min: 0.0,
        max: 2.0,
        step: 0.1,
        label: 'Color Var'
      }
    }
  }
]

export default shaderConfigurations
