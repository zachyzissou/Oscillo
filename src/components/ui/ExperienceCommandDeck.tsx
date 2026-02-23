'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useMusicalPalette } from '@/store/useMusicalPalette'
import { usePerformanceSettings } from '@/store/usePerformanceSettings'
import styles from './ExperienceCommandDeck.module.css'

const ONBOARDING_KEY = 'oscillo.v2.deck-onboarded'
const DECK_EXPANDED_KEY = 'oscillo.v2.deck-expanded'
const MOBILE_SNAP_KEY = 'oscillo.v2.deck-mobile-snap'
const MOBILE_BREAKPOINT = '(max-width: 900px)'

const KEY_OPTIONS = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'] as const
const SCALE_OPTIONS = ['major', 'minor', 'dorian', 'mixolydian', 'pentatonic', 'blues'] as const
const MODE_OPTIONS = ['play', 'edit', 'record', 'sequence'] as const
const PERF_OPTIONS = ['low', 'medium', 'high'] as const
const ONBOARDING_TOTAL_STEPS = 3
const MIN_TEMPO = 60
const MAX_TEMPO = 200
const TEMPO_STEP = 5

type MobileSnapPoint = 'collapsed' | 'peek' | 'full'

const readStoredDesktopExpanded = () => {
  if (!('localStorage' in globalThis)) return true
  return globalThis.localStorage.getItem(DECK_EXPANDED_KEY) !== 'false'
}

const clampTempo = (value: number) => Math.min(MAX_TEMPO, Math.max(MIN_TEMPO, value))
const isMobileSnapPoint = (value: string | null): value is MobileSnapPoint =>
  value === 'collapsed' || value === 'peek' || value === 'full'

const readStoredMobileSnap = (): MobileSnapPoint => {
  if (!('localStorage' in globalThis)) return 'collapsed'
  const storedValue = globalThis.localStorage.getItem(MOBILE_SNAP_KEY)
  return isMobileSnapPoint(storedValue) ? storedValue : 'collapsed'
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
  const [desktopExpanded, setDesktopExpanded] = useState(true)
  const [mobileSnap, setMobileSnap] = useState<MobileSnapPoint>('collapsed')
  const [viewportReady, setViewportReady] = useState(false)
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [onboardingStep, setOnboardingStep] = useState(0)
  const openButtonRef = useRef<HTMLButtonElement>(null)
  const keySelectRef = useRef<HTMLSelectElement>(null)
  const isExpanded = isMobile ? mobileSnap !== 'collapsed' : desktopExpanded

  useEffect(() => {
    if (!('localStorage' in globalThis)) return

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
    if ('localStorage' in globalThis) {
      globalThis.localStorage.setItem(ONBOARDING_KEY, 'true')
    }
  }, [])

  const wrapperClass = `${styles.deck} ${isMobile ? styles.mobile : styles.desktop} ${
    viewportReady ? '' : styles.unresolved
  }`

  const queueFocus = useCallback((target: 'open' | 'primary') => {
    if (!('requestAnimationFrame' in globalThis)) return
    globalThis.requestAnimationFrame(() => {
      if (target === 'open') {
        openButtonRef.current?.focus()
        return
      }

      keySelectRef.current?.focus()
    })
  }, [])

  const setMobileSnapPoint = useCallback(
    (nextSnap: MobileSnapPoint) => {
      setMobileSnap(nextSnap)
      queueFocus(nextSnap === 'collapsed' ? 'open' : 'primary')
    },
    [queueFocus]
  )

  const handleExpand = useCallback(() => {
    if (isMobile) {
      const nextSnap = mobileSnap === 'collapsed' ? 'peek' : mobileSnap
      setMobileSnapPoint(nextSnap)
      return
    }

    setDesktopExpanded(true)
    queueFocus('primary')
  }, [isMobile, mobileSnap, queueFocus, setMobileSnapPoint])

  const handleCollapse = useCallback(() => {
    if (isMobile) {
      setMobileSnapPoint('collapsed')
      return
    }

    setDesktopExpanded(false)
    queueFocus('open')
  }, [isMobile, queueFocus, setMobileSnapPoint])

  const adjustTempo = useCallback(
    (delta: number) => {
      setTempo(clampTempo(tempo + delta))
    },
    [setTempo, tempo]
  )

  const cycleMode = useCallback(() => {
    const currentIndex = MODE_OPTIONS.indexOf(mode)
    const nextIndex = (currentIndex + 1) % MODE_OPTIONS.length
    setMode(MODE_OPTIONS[nextIndex])
  }, [mode, setMode])

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
  const adjustedTempo = tempo >= 188 ? clampTempo(tempo - 12) : clampTempo(tempo + 12)
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
    if (!('matchMedia' in globalThis)) return

    const media = globalThis.matchMedia(MOBILE_BREAKPOINT)
    const applyMode = (matches: boolean) => {
      setIsMobile(matches)
      if (matches) {
        setMobileSnap(readStoredMobileSnap())
        return
      }

      setDesktopExpanded(readStoredDesktopExpanded())
    }

    applyMode(media.matches)
    setViewportReady(true)
    const onChange = (event: MediaQueryListEvent) => applyMode(event.matches)
    media.addEventListener('change', onChange)

    return () => media.removeEventListener('change', onChange)
  }, [])

  useEffect(() => {
    if (!('localStorage' in globalThis) || isMobile || !viewportReady) return
    globalThis.localStorage.setItem(DECK_EXPANDED_KEY, String(desktopExpanded))
  }, [desktopExpanded, isMobile, viewportReady])

  useEffect(() => {
    if (!('localStorage' in globalThis) || !isMobile || !viewportReady) return
    globalThis.localStorage.setItem(MOBILE_SNAP_KEY, mobileSnap)
  }, [isMobile, mobileSnap, viewportReady])

  useEffect(() => {
    if (!('addEventListener' in globalThis)) return

    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null
      const isTypingContext =
        target?.tagName === 'INPUT' ||
        target?.tagName === 'TEXTAREA' ||
        target?.tagName === 'SELECT' ||
        target?.isContentEditable

      if (isTypingContext) return

      if (event.key === 'Escape') {
        if (!isExpanded) return
        if (isMobile) {
          setMobileSnapPoint('collapsed')
          return
        }

        setDesktopExpanded(false)
        queueFocus('open')
        return
      }

      if (event.key.toLowerCase() === 'm') {
        event.preventDefault()
        cycleMode()
        return
      }

      if (event.key === '[') {
        event.preventDefault()
        adjustTempo(-TEMPO_STEP)
        return
      }

      if (event.key === ']') {
        event.preventDefault()
        adjustTempo(TEMPO_STEP)
        return
      }

      if (event.key.toLowerCase() === 't') {
        event.preventDefault()
        if (isMobile) {
          setMobileSnapPoint(isExpanded ? 'collapsed' : 'peek')
          return
        }

        setDesktopExpanded(prev => {
          const next = !prev
          queueFocus(next ? 'primary' : 'open')
          return next
        })
      }
    }

    globalThis.addEventListener('keydown', onKeyDown)
    return () => globalThis.removeEventListener('keydown', onKeyDown)
  }, [adjustTempo, cycleMode, isExpanded, isMobile, queueFocus, setMobileSnapPoint])

  const shellClass = `${styles.shell} ${
    isMobile ? (mobileSnap === 'full' ? styles.shellFull : styles.shellPeek) : ''
  }`

  return (
    <aside
      className={wrapperClass}
      data-testid="experience-deck"
      aria-label="Experience controls"
      hidden={!viewportReady}
    >
      <div
        className={styles.actionRail}
        data-testid="deck-action-rail"
        role="toolbar"
        aria-label="Persistent quick controls"
      >
        <button
          type="button"
          data-testid="deck-rail-toggle"
          className={`${styles.railButton} ${styles.railPrimary}`}
          aria-expanded={isExpanded}
          aria-controls="experience-deck-shell"
          onClick={isExpanded ? handleCollapse : handleExpand}
        >
          {isExpanded
            ? isMobile
              ? 'Hide sheet'
              : 'Hide controls'
            : isMobile
              ? 'Show sheet'
              : 'Show controls'}
        </button>
        <button
          type="button"
          data-testid="deck-rail-tempo-down"
          className={styles.railButton}
          onClick={() => adjustTempo(-TEMPO_STEP)}
          aria-label="Decrease tempo by 5 BPM"
        >
          -5 BPM
        </button>
        <button
          type="button"
          data-testid="deck-rail-tempo-up"
          className={styles.railButton}
          onClick={() => adjustTempo(TEMPO_STEP)}
          aria-label="Increase tempo by 5 BPM"
        >
          +5 BPM
        </button>
        <button
          type="button"
          data-testid="deck-rail-mode-cycle"
          className={styles.railButton}
          onClick={cycleMode}
          aria-label={`Cycle mode. Current mode ${modeLabel}`}
        >
          Mode: {modeLabel}
        </button>
      </div>

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
        <div className={shellClass} id="experience-deck-shell">
          {isMobile && (
            <div className={styles.sheetControls}>
              <span className={styles.sheetHandle} aria-hidden="true" />
              <div
                className={styles.snapPoints}
                role="group"
                aria-label="Bottom sheet snap points"
                data-testid="deck-snap-points"
              >
                <button
                  type="button"
                  data-testid="deck-snap-collapsed"
                  className={mobileSnap === 'collapsed' ? styles.snapActive : ''}
                  onClick={() => setMobileSnapPoint('collapsed')}
                >
                  Hide
                </button>
                <button
                  type="button"
                  data-testid="deck-snap-peek"
                  className={mobileSnap === 'peek' ? styles.snapActive : ''}
                  onClick={() => setMobileSnapPoint('peek')}
                >
                  Peek
                </button>
                <button
                  type="button"
                  data-testid="deck-snap-full"
                  className={mobileSnap === 'full' ? styles.snapActive : ''}
                  onClick={() => setMobileSnapPoint('full')}
                >
                  Full
                </button>
              </div>
            </div>
          )}
          <header className={styles.header}>
            <div className={styles.titleWrap}>
              <span
                className={styles.pulse}
                data-testid="deck-pulse-indicator"
                aria-hidden="true"
              />
              <div>
                <h2 className={styles.title}>Command Deck</h2>
                <p className={styles.subtitle}>{modeLabel} mode | T toggle | M mode | [ ] tempo</p>
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
