'use client'
import React, { useState } from 'react'
import { useAudioEngine } from '@/store/useAudioEngine'
import { startAudioContext, playNote, playChord, playBeat, isAudioInitialized } from '@/lib/audio'
import * as Tone from 'tone'

export default function AudioDebugPanel() {
  const [logs, setLogs] = useState<string[]>([])
  const [overlayDebug, setOverlayDebug] = useState<any>({})
  const audioReady = useAudioEngine((s) => s.audioReady)
  const audioContext = useAudioEngine((s) => s.audioContext)
  const error = useAudioEngine((s) => s.lastError)

  // Check overlay state
  React.useEffect(() => {
    const checkOverlay = () => {
      const overlayElement = document.getElementById('start-overlay')
      const localStorage_hasSeenOverlay = localStorage.getItem('hasSeenOverlay')
      setOverlayDebug({
        overlayElementExists: !!overlayElement,
        overlayElementDisplay: overlayElement?.style?.display,
        localStorage_hasSeenOverlay,
        NODE_ENV: process.env.NODE_ENV
      })
    }
    checkOverlay()
    const interval = setInterval(checkOverlay, 1000)
    return () => clearInterval(interval)
  }, [])

  const addLog = (message: string) => {
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`])
  }

  const handleInitAudio = async () => {
    addLog('Starting audio initialization...')
    try {
      const success = await startAudioContext()
      addLog(`Audio init result: ${success}`)
      addLog(`Audio initialized flag: ${isAudioInitialized()}`)
      addLog(`Tone.js state: ${Tone.getContext().state}`)
    } catch (error) {
      addLog(`Error: ${error}`)
    }
  }

  const handleTestNote = async () => {
    addLog('Testing note playback...')
    const success = await playNote('test-note', 'C4')
    addLog(`Note played: ${success}`)
  }

  const handleTestChord = async () => {
    addLog('Testing chord playback...')
    const success = await playChord('test-chord', ['C4', 'E4', 'G4'])
    addLog(`Chord played: ${success}`)
  }

  const handleTestBeat = async () => {
    addLog('Testing beat playback...')
    const success = await playBeat('test-beat')
    addLog(`Beat played: ${success}`)
  }

  const handleSimpleToneTest = async () => {
    addLog('Simple Tone.js test...')
    try {
      await Tone.start()
      const synth = new Tone.Synth().toDestination()
      synth.triggerAttackRelease('C4', '8n')
      addLog('Simple tone triggered successfully')
    } catch (error) {
      addLog(`Simple tone error: ${error}`)
    }
  }

  const handleClearLocalStorage = () => {
    localStorage.removeItem('hasSeenOverlay')
    addLog('Cleared localStorage - reload page to see start overlay')
    window.location.reload()
  }

  return (
    <div className="fixed top-4 right-4 z-50 bg-black/90 text-white p-4 rounded-lg max-w-md">
      <h3 className="text-lg font-bold mb-2">🔊 Audio Debug Panel</h3>

      <div className="mb-3 text-sm">
        <div className="font-bold text-yellow-400 mb-2">Overlay Debug:</div>
        <div>Overlay Element: {overlayDebug.overlayElementExists ? '✅ EXISTS' : '❌ NOT FOUND'}</div>
        <div>localStorage hasSeenOverlay: {overlayDebug.localStorage_hasSeenOverlay || 'null'}</div>
        <div>NODE_ENV: {overlayDebug.NODE_ENV}</div>
        <hr className="my-2 border-gray-600" />
        <div>Audio Ready: {audioReady ? '✅' : '❌'}</div>
        <div>Context State: {audioContext}</div>
        <div>Initialized: {isAudioInitialized() ? '✅' : '❌'}</div>
        {error && <div className="text-red-400">Error: {error}</div>}
      </div>

      <div className="flex flex-col gap-2 mb-3">
        <button
          onClick={handleClearLocalStorage}
          className="px-3 py-1 bg-yellow-600 hover:bg-yellow-700 rounded text-sm"
        >
          Show Start Overlay (Reload)
        </button>
        <button
          onClick={handleInitAudio}
          className="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-sm"
        >
          Initialize Audio
        </button>
        <button
          onClick={handleSimpleToneTest}
          className="px-3 py-1 bg-green-600 hover:bg-green-700 rounded text-sm"
        >
          Simple Tone Test
        </button>
        <button
          onClick={handleTestNote}
          className="px-3 py-1 bg-purple-600 hover:bg-purple-700 rounded text-sm"
          disabled={!audioReady}
        >
          Test Note
        </button>
        <button
          onClick={handleTestChord}
          className="px-3 py-1 bg-purple-600 hover:bg-purple-700 rounded text-sm"
          disabled={!audioReady}
        >
          Test Chord
        </button>
        <button
          onClick={handleTestBeat}
          className="px-3 py-1 bg-purple-600 hover:bg-purple-700 rounded text-sm"
          disabled={!audioReady}
        >
          Test Beat
        </button>
      </div>

      <div className="bg-black/50 p-2 rounded max-h-40 overflow-y-auto text-xs font-mono">
        {logs.length === 0 ? (
          <div className="text-gray-400">No logs yet...</div>
        ) : (
          logs.map((log, i) => (
            <div key={i} className="mb-1">{log}</div>
          ))
        )}
      </div>
    </div>
  )
}
