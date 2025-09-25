'use client'
import React, { useCallback, useEffect, useRef, useState } from 'react'

interface WorkingCanvasSceneProps {
  className?: string
}

export default function WorkingCanvasScene({ className }: WorkingCanvasSceneProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const sceneRef = useRef<any>(null)
  const rendererRef = useRef<any>(null)
  const cameraRef = useRef<any>(null)
  const cubesRef = useRef<any[]>([])
  const audioContextRef = useRef<AudioContext | null>(null)
  const animationIdRef = useRef<number>(0)
  
  const [isLoaded, setIsLoaded] = useState(false)
  const [debugInfo, setDebugInfo] = useState('')

  // Initialize audio context
  const initAudio = () => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)()
    }
  }

  // Play musical note
  const playBeep = useCallback((frequency: number = 440, duration: number = 0.3) => {
    if (!audioContextRef.current) initAudio()
    
    const audioContext = audioContextRef.current!
    const oscillator = audioContext.createOscillator()
    const gainNode = audioContext.createGain()
    
    oscillator.connect(gainNode)
    gainNode.connect(audioContext.destination)
    
    oscillator.frequency.value = frequency
    oscillator.type = 'sine'
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration)
    
    oscillator.start()
    oscillator.stop(audioContext.currentTime + duration)
    
  }, [])

  // Initialize Three.js scene
  const initThreeJS = useCallback(async () => {
    if (!containerRef.current) return

    try {
      // Dynamically import Three.js
      const THREE = await import('three')
      

      // Create scene
      const scene = new THREE.Scene()
      scene.background = new THREE.Color(0x111111)
      sceneRef.current = scene

      // Create camera
      const camera = new THREE.PerspectiveCamera(
        75, 
        window.innerWidth / window.innerHeight, 
        0.1, 
        1000
      )
      camera.position.set(0, 0, 15)
      cameraRef.current = camera

      // Create renderer
      const renderer = new THREE.WebGLRenderer({ antialias: true })
      renderer.setSize(window.innerWidth, window.innerHeight)
      renderer.setPixelRatio(window.devicePixelRatio)
      containerRef.current.appendChild(renderer.domElement)
      rendererRef.current = renderer

      // Add lighting
      const ambientLight = new THREE.AmbientLight(0x404040, 0.6)
      scene.add(ambientLight)

      const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8)
      directionalLight.position.set(1, 1, 1)
      scene.add(directionalLight)

      // Create musical cubes
      const cubeData = [
        { color: 0xff4444, note: 261.63, name: 'C' }, // Red - C
        { color: 0x44ff44, note: 329.63, name: 'E' }, // Green - E  
        { color: 0x4444ff, note: 392.00, name: 'G' }, // Blue - G
        { color: 0xffff44, note: 493.88, name: 'B' }, // Yellow - B
        { color: 0xff44ff, note: 587.33, name: 'D' }  // Magenta - D
      ]

      const cubes: any[] = []

      cubeData.forEach((data, i) => {
        const geometry = new THREE.BoxGeometry(3, 3, 3)
        const material = new THREE.MeshLambertMaterial({ 
          color: data.color,
          transparent: true,
          opacity: 0.9
        })
        const cube = new THREE.Mesh(geometry, material)
        
        cube.position.x = (i - 2) * 6
        cube.position.y = 0
        cube.position.z = 0
        
        // Store musical data
        cube.userData = {
          note: data.note,
          name: data.name,
          originalColor: data.color,
          index: i
        }
        
        scene.add(cube)
        cubes.push(cube)
        
      })

      cubesRef.current = cubes

      // Add mouse click handler
      const handleClick = (event: MouseEvent) => {
        const mouse = new THREE.Vector2()
        mouse.x = (event.clientX / window.innerWidth) * 2 - 1
        mouse.y = -(event.clientY / window.innerHeight) * 2 + 1
        
        const raycaster = new THREE.Raycaster()
        raycaster.setFromCamera(mouse, camera)
        
        const intersects = raycaster.intersectObjects(cubes)
        
        if (intersects.length > 0) {
          const cube = intersects[0].object as any
          const userData = cube.userData
          
          // Play the note
          playBeep(userData.note, 0.5)
          
          // Visual feedback
          cube.scale.set(1.2, 1.2, 1.2)
          setTimeout(() => {
            cube.scale.set(1, 1, 1)
          }, 200)
          
        }
      }

      renderer.domElement.addEventListener('click', handleClick)

      setIsLoaded(true)
      updateDebugInfo()

    } catch (error) {
      console.error('Failed to initialize Three.js:', error)
      setDebugInfo('ERROR: Failed to load Three.js')
    }
  }, [playBeep]) // eslint-disable-line react-hooks/exhaustive-deps

  // Animation loop
  const animate = useCallback(() => {
    if (!sceneRef.current || !rendererRef.current || !cameraRef.current) return

    animationIdRef.current = requestAnimationFrame(animate)
    
    // Rotate cubes
    cubesRef.current.forEach((cube: any, i: number) => {
      cube.rotation.x += 0.01
      cube.rotation.y += 0.01
      
      // Float up and down
      cube.position.y = Math.sin(Date.now() * 0.001 + i) * 2
    })
    
    rendererRef.current.render(sceneRef.current, cameraRef.current)
  }, [])

  // Update debug information
  const updateDebugInfo = useCallback(() => {
    const info = [
      `Scene objects: ${sceneRef.current?.children.length || 0}`,
      `Cubes: ${cubesRef.current.length}`,
      `Audio: ${audioContextRef.current ? 'Ready' : 'Click to enable'}`,
      `Status: ${isLoaded ? 'Loaded' : 'Loading...'}`
    ]
    setDebugInfo(info.join(' | '))
  }, [isLoaded])

  // Handle window resize
  const handleResize = useCallback(() => {
    if (!cameraRef.current || !rendererRef.current) return
    
    cameraRef.current.aspect = window.innerWidth / window.innerHeight
    cameraRef.current.updateProjectionMatrix()
    rendererRef.current.setSize(window.innerWidth, window.innerHeight)
    updateDebugInfo()
  }, [updateDebugInfo])

  useEffect(() => {
    initThreeJS()
    
    window.addEventListener('resize', handleResize)
    
    return () => {
      // Cleanup
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current)
      }
      window.removeEventListener('resize', handleResize)
      
      // Dispose Three.js objects
      if (rendererRef.current) {
        rendererRef.current.dispose()
      }
    }
  }, [initThreeJS, handleResize])

  useEffect(() => {
    if (isLoaded) {
      animate()
    }
  }, [isLoaded, animate])

  // Update debug info periodically
  useEffect(() => {
    const interval = setInterval(updateDebugInfo, 1000)
    return () => clearInterval(interval)
  }, [updateDebugInfo])

  return (
    <div className={`fixed inset-0 w-full h-full ${className || ''}`}>
      <div 
        ref={containerRef} 
        className="w-full h-full"
        style={{ background: 'black' }}
      />
      
      {/* Debug Info */}
      <div className="absolute bottom-4 left-4 text-white text-sm font-mono bg-black/50 p-2 rounded">
        {debugInfo || 'Initializing...'}
      </div>
      
      {/* Info */}
      <div className="absolute top-4 left-4 text-white text-xl font-bold">
        🎵 Interactive 3D Music - Click cubes to play notes!
      </div>
      
      {/* Test Button */}
      <div className="absolute top-4 right-4">
        <button 
          onClick={() => playBeep(440, 0.5)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
        >
          Test Sound
        </button>
      </div>
    </div>
  )
}