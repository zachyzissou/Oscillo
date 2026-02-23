'use client'

import { useEffect, useMemo, useState } from 'react'
import { useMusicalPalette } from '@/store/useMusicalPalette'
import { usePerformanceSettings } from '@/store/usePerformanceSettings'
import styles from './ExperienceCommandDeck.module.css'

const ONBOARDING_KEY = 'oscillo.v2.deck-onboarded'
const DECK_EXPANDED_KEY = 'oscillo.v2.deck-expanded'
const MOBILE_BREAKPOINT = '(max-width: 900px)'

const KEY_OPTIONS = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'] as const
const SCALE_OPTIONS = ['major', 'minor', 'dorian', 'mixolydian', 'pentatonic', 'blues'] as const
const MODE_OPTIONS = ['play', 'edit', 'record', 'sequence'] as const
const PERF_OPTIONS = ['low', 'medium', 'high'] as const

export default function ExperienceCommandDeck() {
  const key = useMusicalPalette((s) => s.key)
  const scale = useMusicalPalette((s) => s.scale)
  const tempo = useMusicalPalette((s) => s.tempo)
  const mode = useMusicalPalette((s) => s.mode)
  const setKey = useMusicalPalette((s) => s.setKey)
  const setScale = useMusicalPalette((s) => s.setScale)
  const setTempo = useMusicalPalette((s) => s.setTempo)
  const setMode = useMusicalPalette((s) => s.setMode)

  const perfLevel = usePerformanceSettings((s) => s.level)
  const setPerfLevel = usePerformanceSettings((s) => s.setLevel)

  const [isMobile, setIsMobile] = useState(false)
  const [isExpanded, setIsExpanded] = useState(true)
  const [showHint, setShowHint] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const seen = window.localStorage.getItem(ONBOARDING_KEY)
    if (!seen) {
      setShowHint(true)
    }
  }, [])

  const modeLabel = useMemo(() => mode.charAt(0).toUpperCase() + mode.slice(1), [mode])

  const dismissHint = () => {
    setShowHint(false)
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(ONBOARDING_KEY, 'true')
    }
  }

  const readStoredDesktopExpanded = () => {
    if (typeof window === 'undefined') return true
    return window.localStorage.getItem(DECK_EXPANDED_KEY) !== 'false'
  }

  const wrapperClass = `${styles.deck} ${isMobile ? styles.mobile : styles.desktop}`

  useEffect(() => {
    if (typeof window === 'undefined') return

    const media = window.matchMedia(MOBILE_BREAKPOINT)
    const applyMode = (matches: boolean) => {
      setIsMobile(matches)
      setIsExpanded(matches ? false : readStoredDesktopExpanded())
    }

    applyMode(media.matches)
    const onChange = (event: MediaQueryListEvent) => applyMode(event.matches)
    media.addEventListener('change', onChange)

    return () => media.removeEventListener('change', onChange)
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined' || isMobile) return
    window.localStorage.setItem(DECK_EXPANDED_KEY, String(isExpanded))
  }, [isExpanded, isMobile])

  useEffect(() => {
    if (typeof window === 'undefined') return

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() !== 't') return

      const target = event.target as HTMLElement | null
      const isTypingContext =
        target?.tagName === 'INPUT' ||
        target?.tagName === 'TEXTAREA' ||
        target?.tagName === 'SELECT' ||
        target?.isContentEditable

      if (isTypingContext) return
      event.preventDefault()
      setIsExpanded((prev) => !prev)
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  return (
    <aside className={wrapperClass} data-testid="experience-deck" aria-label="Experience controls">
      {!isExpanded && (
        <div className={styles.floatingOpen}>
          <button
            type="button"
            data-testid="deck-open-button"
            className={styles.openButton}
            onClick={() => setIsExpanded(true)}
            aria-expanded={isExpanded}
            aria-controls="experience-deck-shell"
            aria-label="Open command deck"
          >
            Open Deck
          </button>
        </div>
      )}

      {isExpanded && (
        <div className={styles.shell} id="experience-deck-shell">
          <header className={styles.header}>
            <div className={styles.titleWrap}>
              <span className={styles.pulse} aria-hidden="true" />
              <div>
                <h2 className={styles.title}>Command Deck</h2>
                <p className={styles.subtitle}>{modeLabel} mode | Press T to toggle</p>
              </div>
            </div>
            <div className={styles.headerActions}>
              <button
                type="button"
                data-testid="deck-collapse-button"
                className={styles.iconButton}
                onClick={() => setIsExpanded(false)}
                aria-label="Collapse command deck"
              >
                -
              </button>
            </div>
          </header>

          <div className={styles.body}>
            <div className={styles.row}>
              <label className={styles.field}>
                <span className={styles.label}>Key</span>
                <select
                  value={key}
                  className={styles.select}
                  data-testid="key-select"
                  onChange={(event) => setKey(event.target.value as (typeof KEY_OPTIONS)[number])}
                >
                  {KEY_OPTIONS.map((value) => (
                    <option key={value} value={value}>
                      {value}
                    </option>
                  ))}
                </select>
              </label>

              <label className={styles.field}>
                <span className={styles.label}>Scale</span>
                <select
                  value={scale}
                  className={styles.select}
                  data-testid="scale-select"
                  onChange={(event) => setScale(event.target.value as (typeof SCALE_OPTIONS)[number])}
                >
                  {SCALE_OPTIONS.map((value) => (
                    <option key={value} value={value}>
                      {value.charAt(0).toUpperCase() + value.slice(1)}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className={styles.field}>
              <div className={styles.tempoMeta}>
                <span className={styles.label}>Tempo</span>
                <span>{tempo} BPM</span>
              </div>
              <input
                type="range"
                min={60}
                max={200}
                step={1}
                value={tempo}
                data-testid="tempo-slider"
                className={styles.slider}
                onChange={(event) => setTempo(Number(event.target.value))}
                aria-label="Tempo"
              />
            </div>

            <div className={styles.field}>
              <span className={styles.label}>Performance Profile</span>
              <select
                value={perfLevel}
                data-testid="performance-level"
                className={styles.select}
                aria-label="Performance level"
                onChange={(event) => setPerfLevel(event.target.value as (typeof PERF_OPTIONS)[number])}
              >
                {PERF_OPTIONS.map((value) => (
                  <option key={value} value={value}>
                    {value.charAt(0).toUpperCase() + value.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            <div className={styles.field}>
              <span className={styles.label}>Quick Quality Switch</span>
              <div className={styles.segment}>
                {PERF_OPTIONS.map((value) => (
                  <button
                    key={value}
                    type="button"
                    data-testid={`quality-${value}`}
                    className={perfLevel === value ? styles.active : ''}
                    onClick={() => setPerfLevel(value)}
                  >
                    {value}
                  </button>
                ))}
              </div>
            </div>

            <div className={styles.field}>
              <span className={styles.label}>Mode</span>
              <div className={styles.modePills}>
                {MODE_OPTIONS.map((value) => (
                  <button
                    key={value}
                    type="button"
                    data-testid={`mode-${value}`}
                    className={mode === value ? styles.active : ''}
                    onClick={() => setMode(value)}
                    aria-label={`Switch to ${value} mode`}
                  >
                    {value}
                  </button>
                ))}
              </div>
            </div>

            {showHint && (
              <div className={styles.hint} role="status" aria-live="polite">
                <strong>First move:</strong> click a few particles, then switch scale and tempo to hear the
                scene evolve in real time.
                <div className={styles.hintActions}>
                  <button type="button" className={styles.linkButton} onClick={dismissHint}>
                    Got it
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </aside>
  )
}
