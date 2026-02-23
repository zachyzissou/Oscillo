'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
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
const ONBOARDING_TOTAL_STEPS = 3

const readStoredDesktopExpanded = () => {
  if (typeof globalThis === 'undefined' || !('localStorage' in globalThis)) return true
  return globalThis.localStorage.getItem(DECK_EXPANDED_KEY) !== 'false'
}

interface OnboardingStep {
  id: 'scene' | 'palette' | 'tempo'
  title: string
  description: string
}

export default function ExperienceCommandDeck() {
  const key = useMusicalPalette(s => s.key)
  const scale = useMusicalPalette(s => s.scale)
  const tempo = useMusicalPalette(s => s.tempo)
  const mode = useMusicalPalette(s => s.mode)
  const setKey = useMusicalPalette(s => s.setKey)
  const setScale = useMusicalPalette(s => s.setScale)
  const setTempo = useMusicalPalette(s => s.setTempo)
  const setMode = useMusicalPalette(s => s.setMode)

  const perfLevel = usePerformanceSettings(s => s.level)
  const setPerfLevel = usePerformanceSettings(s => s.setLevel)

  const [isMobile, setIsMobile] = useState(false)
  const [isExpanded, setIsExpanded] = useState(true)
  const [viewportReady, setViewportReady] = useState(false)
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [onboardingStep, setOnboardingStep] = useState(0)
  const openButtonRef = useRef<HTMLButtonElement>(null)
  const keySelectRef = useRef<HTMLSelectElement>(null)

  useEffect(() => {
    if (typeof globalThis === 'undefined' || !('localStorage' in globalThis)) return

    const params = new URLSearchParams(globalThis.location.search)
    if (params.get('onboarding') === 'reset') {
      globalThis.localStorage.removeItem(ONBOARDING_KEY)
    }

    const seen = globalThis.localStorage.getItem(ONBOARDING_KEY) === 'true'
    if (!seen) {
      setShowOnboarding(true)
      setOnboardingStep(0)
    }
  }, [])

  const modeLabel = useMemo(() => mode.charAt(0).toUpperCase() + mode.slice(1), [mode])

  const completeOnboarding = useCallback(() => {
    setShowOnboarding(false)
    setOnboardingStep(0)
    if (typeof globalThis !== 'undefined' && 'localStorage' in globalThis) {
      globalThis.localStorage.setItem(ONBOARDING_KEY, 'true')
    }
  }, [])

  const wrapperClass = `${styles.deck} ${isMobile ? styles.mobile : styles.desktop} ${
    viewportReady ? '' : styles.unresolved
  }`

  const queueFocus = useCallback((target: 'open' | 'primary') => {
    if (typeof globalThis === 'undefined') return
    globalThis.requestAnimationFrame(() => {
      if (target === 'open') {
        openButtonRef.current?.focus()
        return
      }

      keySelectRef.current?.focus()
    })
  }, [])

  const handleExpand = () => {
    setIsExpanded(true)
    queueFocus('primary')
  }

  const handleCollapse = () => {
    setIsExpanded(false)
    queueFocus('open')
  }

  const onboardingSteps = useMemo<OnboardingStep[]>(
    () => [
      {
        id: 'scene',
        title: 'Step 1: Trigger the scene',
        description: isMobile
          ? 'Tap glowing particles to hear notes and wake the atmosphere.'
          : 'Click glowing particles to hear notes and wake the atmosphere.',
      },
      {
        id: 'palette',
        title: 'Step 2: Shape harmony',
        description: isExpanded
          ? 'Use Key and Scale controls to instantly shift the tonal mood.'
          : 'Open the deck, then use Key and Scale to shift the tonal mood.',
      },
      {
        id: 'tempo',
        title: 'Step 3: Set momentum',
        description: isExpanded
          ? 'Adjust Tempo and performance profile to match your device and vibe.'
          : 'Open the deck, then adjust Tempo and performance profile to lock your groove.',
      },
    ],
    [isExpanded, isMobile]
  )

  const currentOnboardingStep = onboardingSteps[onboardingStep]
  const needsExpandedDeckForStep =
    currentOnboardingStep?.id === 'palette' || currentOnboardingStep?.id === 'tempo'
  const adjustedTempo = tempo >= 188 ? Math.max(60, tempo - 12) : Math.min(200, tempo + 12)
  const tempoNudgeLabel =
    adjustedTempo > tempo ? `Boost to ${adjustedTempo} BPM` : `Ease to ${adjustedTempo} BPM`

  const handleOnboardingNext = () => {
    if (onboardingStep >= ONBOARDING_TOTAL_STEPS - 1) {
      completeOnboarding()
      return
    }
    setOnboardingStep(prev => Math.min(prev + 1, ONBOARDING_TOTAL_STEPS - 1))
  }

  useEffect(() => {
    if (typeof globalThis === 'undefined') return

    const media = globalThis.matchMedia(MOBILE_BREAKPOINT)
    const applyMode = (matches: boolean) => {
      setIsMobile(matches)
      setIsExpanded(matches ? false : readStoredDesktopExpanded())
    }

    applyMode(media.matches)
    setViewportReady(true)
    const onChange = (event: MediaQueryListEvent) => applyMode(event.matches)
    media.addEventListener('change', onChange)

    return () => media.removeEventListener('change', onChange)
  }, [])

  useEffect(() => {
    if (
      typeof globalThis === 'undefined' ||
      !('localStorage' in globalThis) ||
      isMobile ||
      !viewportReady
    )
      return
    globalThis.localStorage.setItem(DECK_EXPANDED_KEY, String(isExpanded))
  }, [isExpanded, isMobile, viewportReady])

  useEffect(() => {
    if (typeof globalThis === 'undefined') return

    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null
      const isTypingContext =
        target?.tagName === 'INPUT' ||
        target?.tagName === 'TEXTAREA' ||
        target?.tagName === 'SELECT' ||
        target?.isContentEditable

      if (event.key === 'Escape') {
        if (isTypingContext) return
        setIsExpanded(prev => {
          if (!prev) return prev
          queueFocus('open')
          return false
        })
        return
      }

      if (event.key.toLowerCase() !== 't') return

      if (isTypingContext) return
      event.preventDefault()
      setIsExpanded(prev => {
        const next = !prev
        queueFocus(next ? 'primary' : 'open')
        return next
      })
    }

    globalThis.addEventListener('keydown', onKeyDown)
    return () => globalThis.removeEventListener('keydown', onKeyDown)
  }, [queueFocus])

  return (
    <aside
      className={wrapperClass}
      data-testid="experience-deck"
      aria-label="Experience controls"
      hidden={!viewportReady}
    >
      {!isExpanded && (
        <div className={styles.floatingOpen}>
          <button
            type="button"
            ref={openButtonRef}
            data-testid="deck-open-button"
            className={styles.openButton}
            onClick={handleExpand}
            aria-expanded={isExpanded}
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
              <span
                className={styles.pulse}
                data-testid="deck-pulse-indicator"
                aria-hidden="true"
              />
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
                onClick={handleCollapse}
                aria-expanded={isExpanded}
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
                  ref={keySelectRef}
                  value={key}
                  className={styles.select}
                  data-testid="key-select"
                  onChange={event => setKey(event.target.value as (typeof KEY_OPTIONS)[number])}
                >
                  {KEY_OPTIONS.map(value => (
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
                  onChange={event => setScale(event.target.value as (typeof SCALE_OPTIONS)[number])}
                >
                  {SCALE_OPTIONS.map(value => (
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
                onChange={event => setTempo(Number(event.target.value))}
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
                onChange={event =>
                  setPerfLevel(event.target.value as (typeof PERF_OPTIONS)[number])
                }
              >
                {PERF_OPTIONS.map(value => (
                  <option key={value} value={value}>
                    {value.charAt(0).toUpperCase() + value.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            <div className={styles.field}>
              <span className={styles.label}>Quick Quality Switch</span>
              <div className={styles.segment}>
                {PERF_OPTIONS.map(value => (
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
                {MODE_OPTIONS.map(value => (
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

            {showOnboarding && currentOnboardingStep && (
              <output className={styles.hint} aria-live="polite" data-testid="deck-onboarding">
                <div className={styles.hintTop}>
                  <strong>{currentOnboardingStep.title}</strong>
                  <span className={styles.hintProgress}>
                    {onboardingStep + 1}/{ONBOARDING_TOTAL_STEPS}
                  </span>
                </div>
                <p className={styles.hintCopy}>{currentOnboardingStep.description}</p>
                <div className={styles.hintActions}>
                  <button
                    type="button"
                    className={styles.linkButton}
                    data-testid="deck-onboarding-skip"
                    onClick={completeOnboarding}
                  >
                    Skip
                  </button>
                  {needsExpandedDeckForStep && !isExpanded && (
                    <button
                      type="button"
                      className={styles.linkButton}
                      data-testid="deck-onboarding-open-controls"
                      onClick={handleExpand}
                    >
                      Open controls
                    </button>
                  )}
                  {currentOnboardingStep.id === 'palette' && isExpanded && (
                    <button
                      type="button"
                      className={styles.linkButton}
                      data-testid="deck-onboarding-focus-key"
                      onClick={() => keySelectRef.current?.focus()}
                    >
                      Focus key
                    </button>
                  )}
                  {currentOnboardingStep.id === 'tempo' && isExpanded && (
                    <button
                      type="button"
                      className={styles.linkButton}
                      data-testid="deck-onboarding-tempo-nudge"
                      onClick={() => setTempo(adjustedTempo)}
                    >
                      {tempoNudgeLabel}
                    </button>
                  )}
                  <button
                    type="button"
                    className={styles.linkButton}
                    data-testid="deck-onboarding-next"
                    onClick={handleOnboardingNext}
                  >
                    {onboardingStep >= ONBOARDING_TOTAL_STEPS - 1 ? 'Finish' : 'Next'}
                  </button>
                </div>
              </output>
            )}
          </div>
        </div>
      )}
    </aside>
  )
}
