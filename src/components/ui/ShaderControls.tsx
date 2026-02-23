'use client'

import React from 'react'
import type { ShaderConfig, ShaderId } from '@/config/shaderConfigs'

interface ShaderControlsProps {
  shaderConfigs: ShaderConfig[]
  currentShader: ShaderId
  onParamChange: (shaderId: ShaderId, paramName: string, value: number) => void
}

const ShaderControls: React.FC<ShaderControlsProps> = ({
  shaderConfigs,
  currentShader,
  onParamChange
}) => {
  const activeShaderConfig = shaderConfigs.find(s => s.id === currentShader)
  
  if (!activeShaderConfig) {
    return (
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-gray-200">No Shader Selected</h3>
        <p className="text-xs text-gray-400">Please select a shader to see controls.</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-gray-200 mb-3">
        {activeShaderConfig.name} Controls
      </h3>
      {Object.entries(activeShaderConfig.params).map(([paramName, param]) => (
        <div key={`${currentShader}-${paramName}`} className="space-y-2">
          <div className="flex justify-between text-xs text-gray-400">
            <label htmlFor={`${currentShader}-${paramName}-slider`}>
              {param.label}
            </label>
            <span>{param.value.toFixed(2)}</span>
          </div>
          <input
            id={`${currentShader}-${paramName}-slider`}
            type="range"
            min={param.min}
            max={param.max}
            step={param.step}
            value={param.value}
            onChange={(e) => onParamChange(currentShader, paramName, parseFloat(e.target.value))}
            className="w-full god-tier-slider"
            aria-label={`${param.label} control`}
          />
        </div>
      ))}
    </div>
  )
}

export default ShaderControls
