// src/lib/audio.ts
import * as Tone from 'tone'
import { useAudioEngine } from '@/store/useAudioEngine'
import type {
  Chorus,
  FeedbackDelay,
  Reverb,
  Distortion,
  BitCrusher,
  AutoFilter,
  ToneAudioNode,
  Synth,
  PolySynth,
  MembraneSynth,
  Meter,
  Volume,
  Filter,
  Loop,
} from 'tone'
import { useAudioSettings } from '../store/useAudioSettings'
import { useEffectSettings, EffectParams } from '../store/useEffectSettings'
import { ObjectType } from '../store/useObjects'
import { useLoops } from '../store/useLoops'
import { logger } from './logger'
import { audioNodePool } from './audioNodePool'
import { presetConfigs } from './enhancedAudio'

import { beatBus } from "./events"
import {
  NOTE_ATTACK,
  NOTE_RELEASE,
  CHORD_ATTACK,
  CHORD_RELEASE,
  BEAT_PITCH_DECAY,
  BEAT_ATTACK,
  BEAT_DECAY,
  BEAT_SUSTAIN,
  BEAT_RELEASE,
} from '../config/constants'

// Type aliases
type AudioSynth = Synth | PolySynth | MembraneSynth

export function getTone() {
  return Tone
}
// Synth instances (initialized once)
let noteSynth: Synth
let chordSynth: PolySynth
let beatSynth: MembraneSynth
// Flag indicating if synthesis nodes have been created yet.
// This stays false until a user gesture triggers Tone.start().
let audioInitialized = false
let initPromise: Promise<void> | null = null
let retryTimer: ReturnType<typeof setTimeout> | null = null
let allowInit = false
const audioEvents = new EventTarget()

export function isAudioInitialized() {
  return audioInitialized
}

export function onAudioInit(cb: () => void) {
  audioEvents.addEventListener('init', cb)
  return () => audioEvents.removeEventListener('init', cb)
}

export function enableAudioInit() {
  allowInit = true
}

/**
 * Resume the AudioContext after a user gesture.
 */
export async function startAudioContext(): Promise<boolean> {
  enableAudioInit()
  const audioState = useAudioEngine.getState()
  audioState.setUserInteracted(true)
  audioState.setIsInitializing(true)

  try {
    await initAudioEngine()
    audioState.setAudioContext('running')
    audioState.setAudioReady(true)
    if (process.env.NODE_ENV !== 'production') {
      logger.debug('Audio context started')
    }
    return true
  } catch (error) {
    audioState.setAudioContext('suspended')
    audioState.setError(error instanceof Error ? error.message : String(error))
    throw error
  } finally {
    audioState.setIsInitializing(false)
  }
}
let masterVolumeNode: Volume

let chorus: Chorus
let delay: FeedbackDelay
let reverb: Reverb
let filter: AutoFilter
let distortion: Distortion
let bitcrusher: BitCrusher
let masterChain: ToneAudioNode

export function getMasterChain(): ToneAudioNode {
  return masterChain
}

async function initEffects() {
  if (chorus) return
  
  try {
    // Add timeout for effect initialization
    const effectTimeout = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Effect initialization timeout')), 2000)
    )
    
    await Promise.race([
      (async () => {
        // Ensure Tone.js context is ready before creating effects
        await Tone.start()
        await Tone.getContext().resume()
        
        // Create effects with careful parameter checking for WebKit compatibility
        chorus = new Tone.Chorus()
        delay = new Tone.FeedbackDelay()
        reverb = new Tone.Reverb()
        filter = new Tone.AutoFilter()
        distortion = new Tone.Distortion()
        bitcrusher = new Tone.BitCrusher(4)
        
        // Safe parameter assignment with WebKit compatibility
        try {
          if (bitcrusher.wet?.value !== undefined) {
            bitcrusher.wet.value = 0.3
          }
        } catch (error) {
          console.warn('BitCrusher wet parameter error (WebKit compatibility):', error)
        }
        
        // Chain effects together
        bitcrusher.connect(distortion)
        distortion.connect(filter)
        filter.connect(reverb)
        reverb.connect(delay)
        delay.connect(chorus)
        chorus.toDestination()
        
        masterChain = bitcrusher
      })(),
      effectTimeout
    ])
    if (typeof window !== 'undefined') {
      ;(window as any).__toneNodes__ = { chorus, delay, reverb, bitcrusher }
    }
  } catch (error) {
    console.error('Failed to initialize audio effects:', error)
    // Fallback: create a simple passthrough chain with proper destination
    try {
      masterChain = new Tone.Gain(1)
      masterChain.toDestination()
    } catch (fallbackError) {
      console.error('Fallback audio chain also failed:', fallbackError)
      // Last resort: use a dummy object that safely ignores calls
      masterChain = {
        connect: () => masterChain,
        toDestination: () => masterChain,
        disconnect: () => {},
        dispose: () => {}
      } as any
    }
  }
}
interface ObjectAudio {
  type: ObjectType
  synth: AudioSynth
  chain: EffectChain
  meter: Meter
  panner: PannerNode
}
const objectSynths = new Map<string, ObjectAudio>()

export function disposeObjectAudio(id: string) {
  const audio = objectSynths.get(id)
  if (!audio) return

  try {
    audio.meter.dispose?.()
  } catch (error) {
    console.warn('Failed to dispose audio meter:', error)
  }

  try {
    audio.panner.disconnect?.()
  } catch (error) {
    console.warn('Failed to disconnect panner:', error)
  }

  try {
    audio.chain.hp.dispose?.()
    audio.chain.lp.dispose?.()
    audio.chain.delay.dispose?.()
    audio.chain.reverb.dispose?.()
  } catch (error) {
    console.warn('Failed to dispose effect chain:', error)
  }

  returnSynthToPool(audio.synth)
  objectSynths.delete(id)
}

export function disposeAllObjectAudio() {
  Array.from(objectSynths.keys()).forEach(disposeObjectAudio)
}

interface EffectChain {
  hp: Filter
  lp: Filter
  delay: FeedbackDelay
  reverb: Reverb
}

/**
 * Initialize the audio engine on first user interaction.
 * Calls Tone.start(), then creates and configures synths.
 */
export async function initAudioEngine() {
  if (audioInitialized) {
    const state = useAudioEngine.getState()
    state.setAudioReady(true)
    state.setAudioContext('running')
    return
  }
  if (!allowInit) return
  if (initPromise) return initPromise
  
  if (!window.AudioContext && !(window as any).webkitAudioContext) {
    const message = 'Web Audio API not supported on this browser'
    console.error(message)
    const state = useAudioEngine.getState()
    state.setError(message)
    state.setAudioContext('closed')
    audioEvents.dispatchEvent(new Event('init-failed'))
    throw new Error(message)
  }
  
  const isWebKit = typeof navigator !== 'undefined' && 
    /WebKit/i.test(navigator.userAgent) && 
    !/Chrome/i.test(navigator.userAgent)
  
  if (isWebKit) {
    console.warn('WebKit browser detected - using compatibility mode for audio initialization')
  }
  
  initPromise = (async () => {
    const state = useAudioEngine.getState()
    state.incrementInitAttempts()
    try {
      const initTimeout = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Audio initialization timeout')), 3000)
      )
      
      await Promise.race([
        (async () => {
          await Tone.start()
          await Tone.getContext().resume()
          await initEffects()
        })(),
        initTimeout
      ])
      
      if (!masterChain) {
        throw new Error('Failed to initialize audio effects chain')
      }
      
      masterVolumeNode = new Tone.Volume({ volume: 0 }).connect(masterChain)
      
      try {
        if (masterVolumeNode.volume?.value !== undefined) {
          masterVolumeNode.volume.value = useAudioSettings.getState().volume * 100 - 100
        }
      } catch (volumeError) {
        console.warn('Volume initialization error (WebKit compatibility):', volumeError)
      }
      
      noteSynth = new Tone.Synth().connect(masterVolumeNode)
      noteSynth.oscillator.type = 'sine'
      noteSynth.envelope.attack = NOTE_ATTACK
      noteSynth.envelope.release = NOTE_RELEASE
      
      chordSynth = new Tone.PolySynth({ voice: Tone.Synth }).connect(masterVolumeNode)
      chordSynth.set({ oscillator: { type: 'triangle' } })
      chordSynth.set({ envelope: { attack: CHORD_ATTACK, release: CHORD_RELEASE } })
      
      beatSynth = new Tone.MembraneSynth().connect(masterVolumeNode)
      beatSynth.pitchDecay = BEAT_PITCH_DECAY
      beatSynth.envelope.attack = BEAT_ATTACK
      beatSynth.envelope.decay = BEAT_DECAY
      beatSynth.envelope.sustain = BEAT_SUSTAIN
      beatSynth.envelope.release = BEAT_RELEASE
      
      audioInitialized = true
      if (retryTimer) {
        clearTimeout(retryTimer)
        retryTimer = null
      }
      
      const rawContext = Tone.getContext().rawContext as AudioContext
      const latency = ((rawContext.baseLatency || 0) + (rawContext.outputLatency || 0)) * 1000
      const bufferSize = Math.round((rawContext.baseLatency || 0.005) * rawContext.sampleRate) || 256
      state.setPerformanceMetrics(
        Number.isFinite(latency) ? latency : 0,
        rawContext.sampleRate || 44100,
        bufferSize
      )
      state.resetInitAttempts()
      state.setAudioContext('running')
      state.setAudioReady(true)
      state.setError(null)
      audioEvents.dispatchEvent(new Event('init'))
    } catch (error) {
      audioInitialized = false
      initPromise = null
      const errMessage = error instanceof Error ? error.message : String(error)
      const latest = useAudioEngine.getState()
      latest.setAudioReady(false)
      latest.setAudioContext('suspended')
      latest.setError(errMessage)
      disposeAllObjectAudio()
      console.error('Audio engine initialization failed:', errMessage)
      if (retryTimer) {
        clearTimeout(retryTimer)
        retryTimer = null
      }
      if (latest.shouldRetryInit()) {
        const attempt = latest.initAttempts
        const delay = Math.min(5000, 500 * Math.pow(2, Math.max(0, attempt - 1)))
        retryTimer = setTimeout(() => {
          initAudioEngine().catch((retryError) => {
            if (process.env.NODE_ENV !== 'production') {
              logger.error(`Audio engine retry failed: ${String(retryError)}`)
            }
          })
        }, delay)
      } else {
        audioEvents.dispatchEvent(new Event('init-failed'))
      }
      throw error
    }
  })()

  return initPromise
}

function keyOffset(key: string): number {
  const map: Record<string, number> = { C: 0, 'C#': 1, D: 2, Eb: 3, E: 4, F: 5, 'F#': 6, G: 7, Ab: 8, A: 9, Bb: 10, B: 11 }
  return map[key] ?? 0
}

function transpose(note: string, key: string) {
  return Tone.Frequency(note).transpose(keyOffset(key)).toNote()
}

function createChain(): EffectChain {
  const hp = new Tone.Filter({ frequency: 0, type: 'highpass' })
  const lp = new Tone.Filter({ frequency: 20000, type: 'lowpass' })
  const delay = new Tone.FeedbackDelay({ delayTime: '8n', feedback: 0.5 })
  const reverb = new Tone.Reverb({ decay: 2 })
  hp.connect(lp)
  lp.connect(delay)
  delay.connect(reverb)
  return { hp, lp, delay, reverb }
}

async function getObjectSynth(id: string, type: ObjectType) {
  let os = objectSynths.get(id)
  if (!os) {
    const chain = createChain()
    const { synthPreset } = useAudioSettings.getState()
    const synth = await getPooledSynth(type, synthPreset)
    const meter = new Tone.Meter({ normalRange: true, smoothing: 0.8 })
    const ctx = Tone.getContext().rawContext
    const panner = ctx.createPanner()
    panner.panningModel = 'HRTF'
    panner.distanceModel = 'inverse'
    panner.refDistance = 1
    panner.maxDistance = 50
    panner.rolloffFactor = 1
    synth.connect(chain.hp)
    chain.reverb.connect(panner)
    Tone.connect(panner, meter)
    meter.connect(masterVolumeNode)
    os = { type, synth, chain, meter, panner }
    objectSynths.set(id, os)
  }
  return os
}

// Meters and panners are created on demand after audio init.
export function getObjectMeter(id: string): Meter | null {
  if (!audioInitialized) return null
  return objectSynths.get(id)?.meter ?? null
}

export function getObjectPanner(id: string): PannerNode | null {
  if (!audioInitialized) return null
  return objectSynths.get(id)?.panner ?? null
}

function applyParams(chain: EffectChain, params: EffectParams) {
  chain.reverb.wet.value = params.reverb
  chain.delay.wet.value = params.delay
  chain.lp.frequency.value = params.lowpass
  chain.hp.frequency.value = params.highpass
}

/**
 * Play a single note.
 * Ensures audio engine is initialized before scheduling.
 */
export async function playNote(id: string, note: string = 'C4'): Promise<boolean> {
  await initAudioEngine()
  if (!audioInitialized || !noteSynth) {
    console.warn('Cannot play note: audio not initialized or noteSynth missing')
    return false
  }
  
  try {
    const { key } = useAudioSettings.getState()
    const finalNote = transpose(note, key)
    const os = await getObjectSynth(id, 'note')
    const params = useEffectSettings.getState().getParams(id)
    applyParams(os.chain, params)
    ;(os.synth as Synth).triggerAttackRelease(finalNote, '8n', Tone.now() + 0.01)
    return true
  } catch (error) {
    console.error('Error playing note:', error)
    return false
  }
}

/**
 * Play a triad chord.
 */
export async function playChord(id: string, notes: string[] = ['C4', 'E4', 'G4']): Promise<boolean> {
  await initAudioEngine()
  if (!audioInitialized || !chordSynth) {
    console.warn('Cannot play chord: audio not initialized or chordSynth missing')
    return false
  }
  
  try {
    const { key } = useAudioSettings.getState()
    const final = notes.map((n) => transpose(n, key))
    const os = await getObjectSynth(id, 'chord')
    const params = useEffectSettings.getState().getParams(id)
    applyParams(os.chain, params)
    ;(os.synth as PolySynth).triggerAttackRelease(final, '4n', Tone.now() + 0.01)
    return true
  } catch (error) {
    console.error('Error playing chord:', error)
    return false
  }
}

/**
 * Play a beat kick.
 */
export async function playBeat(id: string): Promise<boolean> {
  beatBus.dispatchEvent(new Event("beat"));
  await initAudioEngine()
  if (!audioInitialized || !beatSynth) {
    console.warn('Cannot play beat: audio not initialized or beatSynth missing')
    return false
  }
  
  try {
    const { key } = useAudioSettings.getState()
    const note = transpose('C2', key)
    const os = await getObjectSynth(id, 'beat')
    const params = useEffectSettings.getState().getParams(id)
    applyParams(os.chain, params)
    ;(os.synth as MembraneSynth).triggerAttackRelease(note, '8n', Tone.now() + 0.01)
    return true
  } catch (error) {
    console.error('Error playing beat:', error)
    return false
  }
}

/**
 * Set global output volume (0 to 1)
 */
export async function setMasterVolume(vol: number) {
  await initAudioEngine()
  if (!audioInitialized) return
  // Map slider 0-1 to -100dB to 0dB for a perceptual volume curve
  try {
    if (masterVolumeNode.volume?.value !== undefined) {
      masterVolumeNode.volume.value = vol * 100 - 100
    }
  } catch (error) {
    console.warn('Master volume parameter error (WebKit compatibility):', error)
  }
}

export async function setChorusDepth(v: number) {
  await initEffects()
  chorus.depth = v
}
export async function setReverbWet(v: number) {
  await initEffects()
  try {
    if (reverb?.wet?.value !== undefined) {
      reverb.wet.value = v
    }
  } catch (error) {
    console.warn('Reverb wet parameter error (WebKit compatibility):', error)
  }
}
export async function setDelayFeedback(v: number) {
  await initEffects()
  try {
    if (delay?.feedback?.value !== undefined) {
      delay.feedback.value = v
    }
  } catch (error) {
    console.warn('Delay feedback parameter error (WebKit compatibility):', error)
  }
}
export async function setBitcrusherBits(v: number) {
  await initEffects()
  bitcrusher.set({ bits: v })
}
export async function setFilterFrequency(v: number) {
  await initEffects()
  filter.baseFrequency = v
}

/**
 * Start a sustained note used for intro cues.
 */
export async function startNote(note: string = 'C4') {
  await initAudioEngine()
  if (!audioInitialized) return
  const { key } = useAudioSettings.getState()
  const finalNote = transpose(note, key)
  noteSynth.triggerAttackRelease(finalNote, '1n', Tone.now())
}

/**
 * Stop the sustained note.
 */
export function stopNote() {
  if (noteSynth) {
    noteSynth.triggerRelease(Tone.now() + 0.01)
  }
}

interface LoopInfo {
  loop: Loop
  start: number
  duration: number
}

const loops = new Map<string, LoopInfo>()

export function getLoopProgress(id: string): number {
  const info = loops.get(id)
  if (!info) return 0
  const transport = Tone.getTransport()
  const now = transport.seconds
  const elapsed = (now - info.start) % info.duration
  return elapsed / info.duration
}

export async function startLoop(id: string, interval: string = '1m'): Promise<boolean> {
  await initAudioEngine()
  if (!audioInitialized) {
    console.warn('Cannot start loop: audio not initialized')
    return false
  }
  if (loops.has(id)) {
    return true
  }
  
  try {
    const bpm = useAudioSettings.getState().bpm
    const transport = Tone.getTransport()
    transport.bpm.value = bpm
    const dur = Tone.Time(interval).toSeconds()
    const start = transport.seconds
    const loop = new Tone.Loop(() => {
      playBeat(id)
    }, interval).start(0)
    loops.set(id, { loop, start, duration: dur })
    if (transport.state !== 'started') transport.start()
    useLoops.getState().start(id)
    return true
  } catch (error) {
    console.error('Error starting loop:', error)
    return false
  }
}

export function stopLoop(id: string) {
  const info = loops.get(id)
  if (info) {
    info.loop.stop()
    info.loop.dispose()
    loops.delete(id)
  }
  useLoops.getState().stop(id)
}

let spawnSynth: Synth | null = null
export async function playSpawnSound() {
  await initAudioEngine()
  if (!audioInitialized) return
  spawnSynth ??= new Tone.Synth({
    oscillator: { type: 'sine' },
    envelope: { attack: 0.01, decay: 0.2, sustain: 0, release: 0.3 }
  }).connect(masterVolumeNode)
  spawnSynth.triggerAttackRelease('C6', '16n', Tone.now())
}

// Audio node pool integration
async function getPooledSynth(type: ObjectType, preset?: keyof typeof presetConfigs): Promise<AudioSynth> {
  return audioNodePool.acquire('synth', () => {
    if (type === 'chord') {
      const config = preset ? presetConfigs[preset] : presetConfigs.pad
      // For chords, create a PolySynth with enhanced voice
      return new Tone.PolySynth({ 
        voice: class extends Tone.Synth {
          constructor() {
            super()
            // Apply enhanced config to this synth
            this.oscillator.type = config.waveform
            this.envelope.attack = config.attack
            this.envelope.decay = config.decay
            this.envelope.sustain = config.sustain
            this.envelope.release = config.release
          }
        }
      })
    } else if (type === 'beat') {
      return new Tone.MembraneSynth()
    } else {
      const config = preset ? presetConfigs[preset] : presetConfigs.lead
      const synth = new Tone.Synth()
      synth.oscillator.type = config.waveform
      synth.envelope.attack = config.attack
      synth.envelope.decay = config.decay
      synth.envelope.sustain = config.sustain
      synth.envelope.release = config.release
      return synth
    }
  })
}

function returnSynthToPool(synth: AudioSynth) {
  try {
    // Stop all notes and reset
    if ('releaseAll' in synth) {
      synth.releaseAll()
    } else if ('triggerRelease' in synth) {
      synth.triggerRelease()
    }
    
    // Return to pool
    audioNodePool.release('synth', synth)
  } catch (error) {
    logger.error('Failed to return synth to pool: ' + String(error))
  }
}
