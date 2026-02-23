'use client'
import React, { useState, useEffect, useCallback } from 'react'
import { gsap } from 'gsap'
import type { ShaderId } from '@/config/shaderConfigs'
import styles from './AudioControls.module.css'

const SHADER_OPTIONS: ReadonlyArray<{ id: ShaderId; label: string }> = [
  { id: 'metaball', label: 'Metaball' },
  { id: 'voronoi', label: 'Voronoi' },
  { id: 'water', label: 'Water' },
  { id: 'rgbGlitch', label: 'RGB Glitch' },
]

interface AudioControlsProps {
  readonly onBassChange: (value: number) => void
  readonly onMidChange: (value: number) => void
  readonly onHighChange: (value: number) => void
  readonly onShaderChange: (shader: ShaderId) => void
  readonly onGlitchIntensityChange: (value: number) => void
}

export function AudioControls({
  onBassChange,
  onMidChange,
  onHighChange,
  onShaderChange,
  onGlitchIntensityChange
}: AudioControlsProps) {
  const [bassSensitivity, setBassSensitivity] = useState(1.0)
  const [midSensitivity, setMidSensitivity] = useState(1.0)
  const [highSensitivity, setHighSensitivity] = useState(1.0)
  const [activeShader, setActiveShader] = useState<ShaderId>('metaball')
  const [glitchIntensity, setGlitchIntensity] = useState(0.0)
  const [isVisible, setIsVisible] = useState(false)

  // Animation refs
  const panelRef = React.useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Animate panel entrance with GSAP
    if (panelRef.current) {
      gsap.fromTo(panelRef.current, 
        { 
          opacity: 0, 
          y: 50,
          scale: 0.9
        },
        { 
          opacity: 1, 
          y: 0,
          scale: 1,
          duration: 0.8,
          ease: "back.out(1.7)"
        }
      )
    }
  }, [])

  const handleBassChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value)
    setBassSensitivity(value)
    onBassChange(value)
    
    // Visual feedback with GSAP
    gsap.to(e.target, { scale: 1.1, duration: 0.1, yoyo: true, repeat: 1 })
  }, [onBassChange])

  const handleMidChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value)
    setMidSensitivity(value)
    onMidChange(value)
    
    gsap.to(e.target, { scale: 1.1, duration: 0.1, yoyo: true, repeat: 1 })
  }, [onMidChange])

  const handleHighChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value)
    setHighSensitivity(value)
    onHighChange(value)
    
    gsap.to(e.target, { scale: 1.1, duration: 0.1, yoyo: true, repeat: 1 })
  }, [onHighChange])

  const handleShaderChange = useCallback((shader: ShaderId) => {
    setActiveShader(shader)
    onShaderChange(shader)
    
    // Animate shader button
    const button = document.querySelector(`[data-shader="${shader}"]`)
    if (button) {
      gsap.fromTo(button, 
        { scale: 1 },
        { scale: 1.2, duration: 0.2, yoyo: true, repeat: 1, ease: "power2.out" }
      )
    }
  }, [onShaderChange])

  const handleGlitchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value)
    setGlitchIntensity(value)
    onGlitchIntensityChange(value)
  }, [onGlitchIntensityChange])

  const toggleVisibility = useCallback(() => {
    setIsVisible(!isVisible)
    
    if (panelRef.current) {
      gsap.to(panelRef.current, {
        opacity: isVisible ? 0 : 1,
        x: isVisible ? -300 : 0,
        duration: 0.5,
        ease: "power3.out"
      })
    }
  }, [isVisible])

  return (
    <>
      {/* Toggle Button */}
      <button
        onClick={toggleVisibility}
        className={styles.toggleButton}
        aria-label="Toggle audio controls panel"
      >
        🎛️
      </button>

      {/* Audio Controls Panel */}
      <section
        ref={panelRef}
        data-testid="audio-controls"
        className={styles.controlPanel}
        aria-label="Audio reactive controls"
      >
        <h3 className={styles.title}>
          Audio Reactive Controls
        </h3>

        {/* Bass Sensitivity */}
        <div className={styles.controlGroup}>
          <label htmlFor="bass-slider" className={styles.label}>
            Bass Sensitivity: {bassSensitivity.toFixed(2)}
          </label>
          <input
            id="bass-slider"
            type="range"
            min="0"
            max="3"
            step="0.01"
            value={bassSensitivity}
            onChange={handleBassChange}
            className={`${styles.slider} ${styles.sliderPink}`}
            aria-label={`Bass sensitivity: ${bassSensitivity.toFixed(2)}`}
          />
        </div>

        {/* Mid Sensitivity */}
        <div className={styles.controlGroup}>
          <label htmlFor="mid-slider" className={styles.label}>
            Mid Sensitivity: {midSensitivity.toFixed(2)}
          </label>
          <input
            id="mid-slider"
            type="range"
            min="0"
            max="3"
            step="0.01"
            value={midSensitivity}
            onChange={handleMidChange}
            className={`${styles.slider} ${styles.sliderCyan}`}
            aria-label={`Mid frequency sensitivity: ${midSensitivity.toFixed(2)}`}
          />
        </div>

        {/* High Sensitivity */}
        <div className={styles.controlGroup}>
          <label htmlFor="high-slider" className={styles.label}>
            High Sensitivity: {highSensitivity.toFixed(2)}
          </label>
          <input
            id="high-slider"
            type="range"
            min="0"
            max="3"
            step="0.01"
            value={highSensitivity}
            onChange={handleHighChange}
            className={`${styles.slider} ${styles.sliderYellow}`}
            aria-label={`High frequency sensitivity: ${highSensitivity.toFixed(2)}`}
          />
        </div>

        {/* Shader Selection */}
        <div className={styles.controlGroup}>
          <fieldset className={styles.fieldset}>
            <legend className={`${styles.label} ${styles.legend}`}>
              Visual Effect
            </legend>
            <div className={styles.shaderGrid}>
              {SHADER_OPTIONS.map((shaderOption) => (
                <button
                  key={shaderOption.id}
                  data-shader={shaderOption.id}
                  onClick={() => handleShaderChange(shaderOption.id)}
                  className={`${styles.shaderButton} ${
                    activeShader === shaderOption.id ? styles.shaderButtonActive : styles.shaderButtonInactive
                  }`}
                  aria-pressed={activeShader === shaderOption.id ? 'true' : 'false'}
                  aria-label={`Select ${shaderOption.label} visual effect`}
                >
                  {shaderOption.label}
                </button>
              ))}
            </div>
          </fieldset>
        </div>

        {/* Glitch Intensity */}
        <div className={styles.controlGroup}>
          <label htmlFor="glitch-slider" className={styles.label}>
            Glitch Intensity: {glitchIntensity.toFixed(2)}
          </label>
          <input
            id="glitch-slider"
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={glitchIntensity}
            onChange={handleGlitchChange}
            className={`${styles.slider} ${styles.sliderRed}`}
            aria-label={`Glitch effect intensity: ${glitchIntensity.toFixed(2)}`}
          />
        </div>
      </section>
    </>
  )
}
