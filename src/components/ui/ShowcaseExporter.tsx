'use client'
import { useState, useRef, useCallback, useMemo } from 'react'
import { useThree, useFrame } from '@react-three/fiber'
import { useThemeSettings } from '@/store/useThemeSettings'
import { useAudioStore } from '@/store/useAudioEngine'
import FloatingPanel from './FloatingPanel'
import LiquidButton from '../LiquidButton'
import * as THREE from 'three'

interface ShowcaseExporterProps {
  position?: [number, number, number]
  orbitRadius?: number
  orbitSpeed?: number
  theme?: 'cyber' | 'glass' | 'neon' | 'plasma'
  onClose?: () => void
}

export default function ShowcaseExporter({
  position = [-3, 1, -2],
  orbitRadius = 0,
  orbitSpeed = 0,
  theme = 'cyber',
  onClose
}: ShowcaseExporterProps) {
  const { gl, scene, camera } = useThree()
  const { getCurrentConfig } = useThemeSettings()
  const { fftData } = useAudioStore()
  
  const [isRecording, setIsRecording] = useState(false)
  const [recordingFormat, setRecordingFormat] = useState<'image' | 'gif' | 'video'>('image')
  const [exportQuality, setExportQuality] = useState<'1080p' | '4K' | '8K'>('1080p')
  const [captureAudio, setCaptureAudio] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const recordedChunksRef = useRef<Blob[]>([])
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  
  const themeConfig = getCurrentConfig()

  // Quality settings (memoized to prevent recreating on every render)
  const qualitySettings = useMemo(() => ({
    '1080p': { width: 1920, height: 1080, scale: 1 },
    '4K': { width: 3840, height: 2160, scale: 2 },
    '8K': { width: 7680, height: 4320, scale: 4 }
  }), [])

  // Screenshot capture
  const captureScreenshot = useCallback(() => {
    const { width, height } = qualitySettings[exportQuality]
    
    // Temporarily resize for high-quality capture
    const originalSize = gl.getSize(new THREE.Vector2())
    const originalPixelRatio = gl.getPixelRatio()
    
    gl.setSize(width, height, false)
    gl.setPixelRatio(1)
    gl.render(scene, camera)
    
    // Create download link
    const canvas = gl.domElement
    const link = document.createElement('a')
    link.download = `music-visualizer-${Date.now()}.png`
    link.href = canvas.toDataURL('image/png')
    link.click()
    
    // Restore original size
    gl.setSize(originalSize.x, originalSize.y, false)
    gl.setPixelRatio(originalPixelRatio)
  }, [gl, scene, camera, exportQuality, qualitySettings])

  // GIF recording
  const startGifRecording = useCallback(async () => {
    try {
      const { default: GIF } = await import('gif.js')
      const { width, height } = qualitySettings[exportQuality]
      
      const gif = new GIF({
        workers: 2,
        quality: 10,
        width: width / 2, // Reduce for GIF
        height: height / 2
      })

      let frameCount = 0
      const maxFrames = 120 // 4 seconds at 30fps

      const captureFrame = () => {
        if (frameCount >= maxFrames) {
          gif.render()
          setIsRecording(false)
          return
        }

        // Capture frame
        gl.render(scene, camera)
        const canvas = gl.domElement
        const ctx = canvas.getContext('2d')
        
        if (ctx) {
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
          gif.addFrame(imageData, { delay: 33 }) // ~30fps
        }

        frameCount++
        requestAnimationFrame(captureFrame)
      }

      gif.on('finished', (blob) => {
        const link = document.createElement('a')
        link.download = `music-visualizer-${Date.now()}.gif`
        link.href = URL.createObjectURL(blob)
        link.click()
        URL.revokeObjectURL(link.href)
      })

      setIsRecording(true)
      captureFrame()
    } catch (error) {
      console.error('GIF recording failed:', error)
      setIsRecording(false)
    }
  }, [gl, scene, camera, exportQuality, qualitySettings])

  // Video recording
  const startVideoRecording = useCallback(async () => {
    try {
      const canvas = gl.domElement
      const stream = canvas.captureStream(30) // 30fps
      
      // Add audio stream if requested
      if (captureAudio && fftData) {
        // Note: This is simplified - real audio capture would need Web Audio API
        console.log('Audio capture requested but not fully implemented')
      }

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'video/webm;codecs=vp9'
      })

      recordedChunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, {
          type: 'video/webm'
        })
        const link = document.createElement('a')
        link.download = `music-visualizer-${Date.now()}.webm`
        link.href = URL.createObjectURL(blob)
        link.click()
        URL.revokeObjectURL(link.href)
        setIsRecording(false)
      }

      mediaRecorderRef.current = mediaRecorder
      mediaRecorder.start()
      setIsRecording(true)

      // Auto-stop after 30 seconds
      setTimeout(() => {
        if (mediaRecorder.state === 'recording') {
          mediaRecorder.stop()
        }
      }, 30000)
    } catch (error) {
      console.error('Video recording failed:', error)
      setIsRecording(false)
    }
  }, [gl, captureAudio, fftData])

  // Stop recording
  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop()
    }
    setIsRecording(false)
  }, [])

  // Export theme configuration
  const exportTheme = useCallback(() => {
    const config = getCurrentConfig()
    const dataStr = JSON.stringify(config, null, 2)
    const blob = new Blob([dataStr], { type: 'application/json' })
    const link = document.createElement('a')
    link.download = `theme-${config.name.toLowerCase()}-${Date.now()}.json`
    link.href = URL.createObjectURL(blob)
    link.click()
    URL.revokeObjectURL(link.href)
  }, [getCurrentConfig])

  // Generate shareable link
  const generateShareLink = useCallback(() => {
    const config = getCurrentConfig()
    const shareData = {
      theme: config.id,
      effects: config.effects,
      timestamp: Date.now()
    }
    
    const encoded = btoa(JSON.stringify(shareData))
    const shareUrl = `${window.location.origin}${window.location.pathname}?share=${encoded}`
    
    navigator.clipboard.writeText(shareUrl).then(() => {
      console.log('Share link copied to clipboard')
    })
    
    return shareUrl
  }, [getCurrentConfig])

  // Handle export
  const handleExport = useCallback(async () => {
    switch (recordingFormat) {
      case 'image':
        captureScreenshot()
        break
      case 'gif':
        if (isRecording) {
          stopRecording()
        } else {
          await startGifRecording()
        }
        break
      case 'video':
        if (isRecording) {
          stopRecording()
        } else {
          await startVideoRecording()
        }
        break
    }
  }, [recordingFormat, isRecording, captureScreenshot, startGifRecording, startVideoRecording, stopRecording])

  return (
    <FloatingPanel
      position={position}
      title="📸 Showcase & Export"
      theme={theme}
      orbitRadius={orbitRadius}
      orbitSpeed={orbitSpeed}
      onClose={onClose}
      className="max-w-[380px]"
    >
      <div className="space-y-4">
        {/* Export Format Selection */}
        <div className="space-y-2">
          <div className="text-sm font-semibold opacity-80">Export Format</div>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'image', label: '📷 Photo', desc: 'High-res screenshot' },
              { id: 'gif', label: '🎞️ GIF', desc: '4s animation' },
              { id: 'video', label: '🎥 Video', desc: '30s recording' }
            ].map((format) => (
              <LiquidButton
                key={format.id}
                onClick={() => setRecordingFormat(format.id as any)}
                variant={recordingFormat === format.id ? 'primary' : 'secondary'}
                className={`px-2 py-2 text-xs ${
                  recordingFormat === format.id ? 'ring-1 ring-current' : ''
                }`}
              >
                <div className="flex flex-col items-center gap-1">
                  <div>{format.label}</div>
                  <div className="opacity-60">{format.desc}</div>
                </div>
              </LiquidButton>
            ))}
          </div>
        </div>

        {/* Quality Settings */}
        <div className="space-y-2">
          <div className="text-sm font-semibold opacity-80">Export Quality</div>
          <div className="grid grid-cols-3 gap-2">
            {Object.entries(qualitySettings).map(([key, { width, height }]) => (
              <LiquidButton
                key={key}
                onClick={() => setExportQuality(key as any)}
                variant={exportQuality === key ? 'primary' : 'secondary'}
                className={`px-2 py-1 text-xs ${
                  exportQuality === key ? 'ring-1 ring-current' : ''
                }`}
              >
                <div className="flex flex-col items-center gap-1">
                  <div className="font-bold">{key}</div>
                  <div className="opacity-60">{width}×{height}</div>
                </div>
              </LiquidButton>
            ))}
          </div>
        </div>

        {/* Options */}
        <div className="space-y-2">
          <div className="text-sm font-semibold opacity-80">Options</div>
          
          {recordingFormat !== 'image' && (
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={captureAudio}
                onChange={(e) => setCaptureAudio(e.target.checked)}
                className="w-4 h-4 rounded border-2 border-current bg-transparent checked:bg-current"
              />
              <span>Include Audio</span>
              <span className="text-xs opacity-60">(experimental)</span>
            </label>
          )}

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={showPreview}
              onChange={(e) => setShowPreview(e.target.checked)}
              className="w-4 h-4 rounded border-2 border-current bg-transparent checked:bg-current"
            />
            <span>Show Preview</span>
          </label>
        </div>

        {/* Export Button */}
        <div className="space-y-2">
          <LiquidButton
            onClick={handleExport}
            variant={isRecording ? 'accent' : 'primary'}
            className="w-full px-4 py-3 text-base font-bold"
            disabled={recordingFormat === 'gif' && isRecording} // GIF can't be stopped manually
          >
            {isRecording ? (
              recordingFormat === 'video' ? (
                <>⏹️ Stop Recording</>
              ) : (
                <>⏺️ Recording...</>
              )
            ) : (
              <>🚀 Export {recordingFormat.toUpperCase()}</>
            )}
          </LiquidButton>

          {isRecording && recordingFormat === 'video' && (
            <div className="text-xs text-center opacity-60">
              Recording will auto-stop in 30s
            </div>
          )}
        </div>

        {/* Sharing Options */}
        <div className="space-y-2 pt-2 border-t border-white/20">
          <div className="text-sm font-semibold opacity-80">Sharing</div>
          
          <div className="grid grid-cols-2 gap-2">
            <LiquidButton
              onClick={generateShareLink}
              variant="secondary"
              className="px-3 py-2 text-xs"
            >
              🔗 Copy Link
            </LiquidButton>
            
            <LiquidButton
              onClick={exportTheme}
              variant="secondary"
              className="px-3 py-2 text-xs"
            >
              💾 Export Theme
            </LiquidButton>
          </div>
        </div>

        {/* Current Theme Info */}
        <div className="pt-2 border-t border-white/20 text-xs opacity-60">
          <div className="flex justify-between">
            <span>Current Theme:</span>
            <span className="capitalize">{themeConfig.name}</span>
          </div>
          <div className="flex justify-between">
            <span>Export Size:</span>
            <span>{qualitySettings[exportQuality].width}×{qualitySettings[exportQuality].height}</span>
          </div>
          {isRecording && (
            <div className="flex justify-between text-red-400">
              <span>Status:</span>
              <span className="animate-pulse">● RECORDING</span>
            </div>
          )}
        </div>

        {/* Watermark Notice */}
        <div className="pt-2 border-t border-white/20 text-xs opacity-50 text-center">
          Exports include subtle "Interactive Music 3D" watermark
        </div>
      </div>
    </FloatingPanel>
  )
}