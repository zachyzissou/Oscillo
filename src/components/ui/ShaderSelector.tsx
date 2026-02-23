'use client'

import React from 'react'
import { 
  SparklesIcon, 
  BoltIcon, 
  FireIcon, 
  BeakerIcon,
  EyeDropperIcon,
  SwatchIcon,
  CubeIcon,
  GlobeAltIcon
} from '@heroicons/react/24/outline'
import type { ShaderConfig, ShaderIconType, ShaderId } from '@/config/shaderConfigs'

// Icon mapper function
const getIconComponent = (iconType: ShaderIconType): React.ReactNode => {
  switch (iconType) {
    case 'sparkles':
      return <SparklesIcon className="w-5 h-5" />
    case 'bolt':
      return <BoltIcon className="w-5 h-5" />
    case 'fire':
      return <FireIcon className="w-5 h-5" />
    case 'beaker':
      return <BeakerIcon className="w-5 h-5" />
    case 'eyeDropper':
      return <EyeDropperIcon className="w-5 h-5" />
    case 'swatch':
      return <SwatchIcon className="w-5 h-5" />
    case 'cube':
      return <CubeIcon className="w-5 h-5" />
    case 'globeAlt':
      return <GlobeAltIcon className="w-5 h-5" />
    default:
      return <SparklesIcon className="w-5 h-5" />
  }
}

interface ShaderSelectorProps {
  shaderConfigs: ShaderConfig[]
  currentShader: ShaderId
  onShaderChange: (shaderId: ShaderId) => void
}

const ShaderSelector: React.FC<ShaderSelectorProps> = ({
  shaderConfigs,
  currentShader,
  onShaderChange
}) => {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-gray-200 mb-3">Visual Shaders</h3>
      <div className="god-tier-shader-grid">
        {shaderConfigs.map((shader) => (
          <button
            key={shader.id}
            onClick={() => onShaderChange(shader.id)}
            className={`
              god-tier-shader-button
              ${currentShader === shader.id ? 'active' : 'inactive'}
            `}
            aria-label={`Select ${shader.name} shader`}
          >
            <div className="text-lg">{getIconComponent(shader.iconType)}</div>
            <span className="text-xs">{shader.name}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
export default ShaderSelector
