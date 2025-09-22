// src/lib/webgpu-renderer.ts
/**
 * Advanced WebGPU Renderer Implementation
 * Next-generation GPU rendering with procedural shaders and particle systems
 */

import * as THREE from 'three'
import { getAnalyserBands } from './analyser'
import { logger } from './logger'

// WebGPU shader source imports
import vertexShaderSource from '../shaders/vertex.wgsl'
import fragmentShaderSource from '../shaders/fragment.wgsl'
import particleComputeSource from '../shaders/particle.wgsl'

// WebGPU type declarations (until @webgpu/types is available)
declare global {
  interface Navigator {
    gpu?: {
      requestAdapter(options?: any): Promise<any>
      getPreferredCanvasFormat(): string
    }
  }
  
  interface HTMLCanvasElement {
    getContext(contextId: 'webgpu'): any
  }
}

export interface WebGPUCapabilities {
  supported: boolean
  adapter: any
  device: any
  features: string[]
  limits: Record<string, number>
}

interface WebGPUUniforms {
  time: number
  audioLevel: number
  bass: number
  mid: number  
  treble: number
  beatIntensity: number
  colorHue: number
  materialMetalness: number
  materialRoughness: number
  emissionStrength: number
}

interface Light {
  position: [number, number, number]
  color: [number, number, number]
  intensity: number
}

export class WebGPURenderer {
  private device: GPUDevice | null = null
  private context: GPUCanvasContext | null = null
  private canvas: HTMLCanvasElement
  private renderPipeline: GPURenderPipeline | null = null
  private particleComputePipeline: GPUComputePipeline | null = null
  private particleRenderPipeline: GPURenderPipeline | null = null
  private uniformBuffer: GPUBuffer | null = null
  private cameraBuffer: GPUBuffer | null = null
  private lightBuffer: GPUBuffer | null = null
  private particleBuffer: GPUBuffer | null = null
  private particleUniformBuffer: GPUBuffer | null = null
  private isInitialized = false
  private fallbackRenderer: THREE.WebGLRenderer | null = null

  private lights: Light[] = [
    { position: [-8, 6, 8], color: [1.0, 0.42, 0.62], intensity: 2.0 },
    { position: [8, 6, 8], color: [0.31, 0.8, 0.77], intensity: 2.0 },
    { position: [0, 10, -8], color: [0.27, 0.72, 0.82], intensity: 2.0 },
    { position: [0, -5, 10], color: [0.98, 0.75, 0.14], intensity: 1.5 },
    { position: [-10, 2, -5], color: [0.55, 0.36, 0.96], intensity: 1.2 },
    { position: [10, 2, -5], color: [0.065, 0.725, 0.51], intensity: 1.2 }
  ]

  private particleCount = 1024
  private lastTime = 0
  private capabilities: WebGPUCapabilities = {
    supported: false,
    adapter: null,
    device: null,
    features: [],
    limits: {}
  }

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas
  }

  async initialize(): Promise<boolean> {
    try {
      // Check WebGPU support
      if (!navigator.gpu) {
        console.warn('WebGPU not supported, falling back to WebGL')
        return this.initializeFallback()
      }

      const adapter = await navigator.gpu.requestAdapter({
        powerPreference: 'high-performance'
      })

      if (!adapter) {
        console.warn('WebGPU adapter not available, falling back to WebGL')
        return this.initializeFallback()
      }

      this.device = await adapter.requestDevice({
        requiredFeatures: ['texture-compression-bc'] as any,
        requiredLimits: {
          maxStorageBufferBindingSize: adapter.limits.maxStorageBufferBindingSize,
          maxComputeWorkgroupSizeX: 256,
        }
      })

      this.context = this.canvas.getContext('webgpu') as GPUCanvasContext
      if (!this.context) {
        throw new Error('Failed to get WebGPU context')
      }

      const format = navigator.gpu.getPreferredCanvasFormat()
      this.context.configure({
        device: this.device,
        format,
        alphaMode: 'premultiplied',
        usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.COPY_SRC
      })

      await this.createBuffers()
      await this.createPipelines()
      
      this.isInitialized = true
      this.capabilities = {
        supported: true,
        adapter,
        device: this.device,
        features: Array.from(adapter.features || []),
        limits: adapter.limits ? 
          Object.fromEntries(
            Object.entries(adapter.limits).map(([key, value]) => [key, Number(value)])
          ) : {}
      }

      logger.info('WebGPU renderer initialized successfully')
      return true

    } catch (error) {
      console.warn('WebGPU initialization failed:', error)
      return this.initializeFallback()
    }
  }

  private async initializeFallback(): Promise<boolean> {
    try {
      this.fallbackRenderer = new THREE.WebGLRenderer({
        canvas: this.canvas,
        antialias: true,
        alpha: false,
        powerPreference: 'high-performance'
      })
      
      this.fallbackRenderer.setSize(this.canvas.width, this.canvas.height)
      this.fallbackRenderer.shadowMap.enabled = true
      this.fallbackRenderer.shadowMap.type = THREE.PCFSoftShadowMap
      this.fallbackRenderer.toneMapping = THREE.ACESFilmicToneMapping
      this.fallbackRenderer.toneMappingExposure = 1.2
      this.fallbackRenderer.outputColorSpace = THREE.SRGBColorSpace
      
      console.log('WebGL fallback renderer initialized')
      return true
    } catch (error) {
      console.error('Failed to initialize fallback renderer:', error)
      return false
    }
  }

  private async createBuffers() {
    if (!this.device) throw new Error('Device not initialized')

    // Uniform buffer for main scene
    this.uniformBuffer = this.device.createBuffer({
      size: 48, // 12 floats * 4 bytes = 48 bytes
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
      label: 'Main Uniforms'
    })

    // Camera buffer
    this.cameraBuffer = this.device.createBuffer({
      size: 208, // 3 mat4x4 + vec3 + padding = 208 bytes
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
      label: 'Camera Uniforms'
    })

    // Light buffer
    this.lightBuffer = this.device.createBuffer({
      size: 384, // 6 lights * 64 bytes = 384 bytes
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
      label: 'Light Data'
    })

    // Particle storage buffer
    const particleSize = 48 // position(12) + velocity(12) + color(12) + life(4) + size(4) + padding(12) = 56 bytes
    this.particleBuffer = this.device.createBuffer({
      size: this.particleCount * particleSize,
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
      label: 'Particle Data'
    })

    // Particle uniform buffer
    this.particleUniformBuffer = this.device.createBuffer({
      size: 48, // 12 floats * 4 bytes
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
      label: 'Particle Uniforms'
    })

    // Initialize particles
    const particleData = new Float32Array(this.particleCount * (particleSize / 4))
    for (let i = 0; i < this.particleCount; i++) {
      const offset = i * (particleSize / 4)
      // Set initial particle data
      particleData[offset + 0] = (Math.random() - 0.5) * 10 // position.x
      particleData[offset + 1] = Math.random() * 5 // position.y
      particleData[offset + 2] = (Math.random() - 0.5) * 10 // position.z
      particleData[offset + 9] = Math.random() * 3 // life
      particleData[offset + 10] = 0.1 + Math.random() * 0.2 // size
    }

    this.device.queue.writeBuffer(this.particleBuffer, 0, particleData)
  }

  private async createPipelines() {
    if (!this.device) throw new Error('Device not initialized')

    // Create environment cube texture (placeholder)
    const envTexture = this.device.createTexture({
      size: [256, 256, 6],
      format: 'rgba8unorm',
      usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST,
      dimension: '2d',
      viewFormats: ['rgba8unorm']
    })

    const envTextureView = envTexture.createView({
      dimension: 'cube'
    })

    const sampler = this.device.createSampler({
      magFilter: 'linear',
      minFilter: 'linear',
      mipmapFilter: 'linear'
    })

    // Main render pipeline
    const shaderModule = this.device.createShaderModule({
      code: vertexShaderSource + '\n\n' + fragmentShaderSource,
      label: 'Main Shader'
    })

    this.renderPipeline = this.device.createRenderPipeline({
      label: 'Main Render Pipeline',
      layout: 'auto',
      vertex: {
        module: shaderModule,
        entryPoint: 'vs_main',
        buffers: [
          {
            arrayStride: 32, // position(12) + normal(12) + uv(8) = 32 bytes
            attributes: [
              { shaderLocation: 0, offset: 0, format: 'float32x3' },  // position
              { shaderLocation: 1, offset: 12, format: 'float32x3' }, // normal
              { shaderLocation: 2, offset: 24, format: 'float32x2' }  // uv
            ]
          }
        ]
      },
      fragment: {
        module: shaderModule,
        entryPoint: 'fs_main',
        targets: [{
          format: navigator.gpu.getPreferredCanvasFormat(),
          blend: {
            color: {
              srcFactor: 'src-alpha',
              dstFactor: 'one-minus-src-alpha'
            },
            alpha: {
              srcFactor: 'one',
              dstFactor: 'one-minus-src-alpha'
            }
          }
        }]
      },
      primitive: {
        topology: 'triangle-list',
        cullMode: 'back'
      },
      depthStencil: {
        depthWriteEnabled: true,
        depthCompare: 'less',
        format: 'depth24plus'
      }
    })

    // Particle compute pipeline
    const particleComputeModule = this.device.createShaderModule({
      code: particleComputeSource,
      label: 'Particle Compute Shader'
    })

    this.particleComputePipeline = this.device.createComputePipeline({
      label: 'Particle Compute Pipeline',
      layout: 'auto',
      compute: {
        module: particleComputeModule,
        entryPoint: 'cs_main'
      }
    })

    // Particle render pipeline
    this.particleRenderPipeline = this.device.createRenderPipeline({
      label: 'Particle Render Pipeline', 
      layout: 'auto',
      vertex: {
        module: particleComputeModule,
        entryPoint: 'vs_particle'
      },
      fragment: {
        module: particleComputeModule,
        entryPoint: 'fs_particle',
        targets: [{
          format: navigator.gpu.getPreferredCanvasFormat(),
          blend: {
            color: {
              srcFactor: 'src-alpha',
              dstFactor: 'one'
            },
            alpha: {
              srcFactor: 'one',
              dstFactor: 'one'
            }
          }
        }]
      },
      primitive: {
        topology: 'triangle-list'
      },
      depthStencil: {
        depthWriteEnabled: false,
        depthCompare: 'less',
        format: 'depth24plus'
      }
    })
  }

  render(scene: THREE.Scene, camera: THREE.Camera, uniforms: WebGPUUniforms) {
    if (!this.isInitialized) return

    if (this.fallbackRenderer) {
      // Use WebGL fallback
      this.fallbackRenderer.render(scene, camera)
      return
    }

    if (!this.device || !this.context) return

    try {
      const currentTime = performance.now() / 1000
      const deltaTime = currentTime - this.lastTime
      this.lastTime = currentTime

      // Update audio analysis
      let audioData = { bass: 0, mid: 0, treble: 0 }
      try {
        audioData = getAnalyserBands()
      } catch (error) {
        // Fallback to default values if audio analysis fails
      }

      // Update uniforms
      this.updateUniforms(uniforms, audioData, deltaTime)
      this.updateCameraUniforms(camera)
      this.updateLightUniforms()

      const commandEncoder = this.device.createCommandEncoder()

      // Particle compute pass
      if (this.particleComputePipeline && this.particleBuffer) {
        const computePass = commandEncoder.beginComputePass()
        computePass.setPipeline(this.particleComputePipeline)
        
        const computeBindGroup = this.device.createBindGroup({
          layout: this.particleComputePipeline.getBindGroupLayout(0),
          entries: [
            { binding: 0, resource: { buffer: this.cameraBuffer! } },
            { binding: 1, resource: { buffer: this.particleUniformBuffer! } },
            { binding: 2, resource: { buffer: this.particleBuffer } }
          ]
        })
        
        computePass.setBindGroup(0, computeBindGroup)
        computePass.dispatchWorkgroups(Math.ceil(this.particleCount / 64))
        computePass.end()
      }

      // Create depth texture
      const depthTexture = this.device.createTexture({
        size: [this.canvas.width, this.canvas.height],
        format: 'depth24plus',
        usage: GPUTextureUsage.RENDER_ATTACHMENT
      })

      // Main render pass
      const renderPassDescriptor: GPURenderPassDescriptor = {
        colorAttachments: [{
          view: this.context.getCurrentTexture().createView(),
          clearValue: { r: 0.039, g: 0.039, b: 0.102, a: 1.0 },
          loadOp: 'clear',
          storeOp: 'store'
        }],
        depthStencilAttachment: {
          view: depthTexture.createView(),
          depthClearValue: 1.0,
          depthLoadOp: 'clear',
          depthStoreOp: 'store'
        }
      }

      const renderPass = commandEncoder.beginRenderPass(renderPassDescriptor)

      // Render main geometry (placeholder - would need actual geometry data)
      if (this.renderPipeline) {
        renderPass.setPipeline(this.renderPipeline)
        // Would set vertex buffers and bind groups here
        // renderPass.draw(vertexCount, instanceCount)
      }

      // Render particles
      if (this.particleRenderPipeline && this.particleBuffer) {
        renderPass.setPipeline(this.particleRenderPipeline)
        
        const particleBindGroup = this.device.createBindGroup({
          layout: this.particleRenderPipeline.getBindGroupLayout(0),
          entries: [
            { binding: 0, resource: { buffer: this.cameraBuffer! } },
            { binding: 1, resource: { buffer: this.particleUniformBuffer! } },
            { binding: 2, resource: { buffer: this.particleBuffer } }
          ]
        })
        
        renderPass.setBindGroup(0, particleBindGroup)
        renderPass.draw(6, this.particleCount) // 6 vertices per particle quad
      }

      renderPass.end()
      this.device.queue.submit([commandEncoder.finish()])

    } catch (error) {
      console.error('WebGPU render error:', error)
    }
  }

  private updateUniforms(uniforms: WebGPUUniforms, audioData: any, deltaTime: number) {
    if (!this.device || !this.uniformBuffer) return

    const data = new Float32Array([
      uniforms.time,
      uniforms.audioLevel,
      audioData.bass / 255,
      audioData.mid / 255,
      audioData.treble / 255,
      uniforms.beatIntensity,
      uniforms.colorHue,
      uniforms.materialMetalness,
      uniforms.materialRoughness,
      uniforms.emissionStrength,
      0, 0 // padding
    ])

    this.device.queue.writeBuffer(this.uniformBuffer, 0, data)

    // Update particle uniforms
    if (this.particleUniformBuffer) {
      const particleData = new Float32Array([
        uniforms.time,
        deltaTime,
        uniforms.audioLevel,
        audioData.bass / 255,
        audioData.mid / 255,
        audioData.treble / 255,
        uniforms.beatIntensity,
        1.0, // spawn rate
        this.particleCount,
        0, 0, 0 // padding
      ])

      this.device.queue.writeBuffer(this.particleUniformBuffer, 0, particleData)
    }
  }

  private updateCameraUniforms(camera: THREE.Camera) {
    if (!this.device || !this.cameraBuffer) return

    camera.updateMatrixWorld()
    const viewMatrix = new THREE.Matrix4().copy(camera.matrixWorldInverse)
    const projMatrix = new THREE.Matrix4().copy(camera.projectionMatrix)
    const viewProjMatrix = new THREE.Matrix4().multiplyMatrices(projMatrix, viewMatrix)

    const data = new Float32Array(52) // 3 * 16 + 4 = 52 floats
    
    // View-projection matrix
    viewProjMatrix.toArray(data, 0)
    // View matrix  
    viewMatrix.toArray(data, 16)
    // Projection matrix
    projMatrix.toArray(data, 32)
    // Camera position
    camera.position.toArray(data, 48)

    this.device.queue.writeBuffer(this.cameraBuffer, 0, data)
  }

  private updateLightUniforms() {
    if (!this.device || !this.lightBuffer) return

    const data = new Float32Array(this.lights.length * 16) // 16 floats per light (with padding)
    
    this.lights.forEach((light, i) => {
      const offset = i * 16
      data[offset + 0] = light.position[0]
      data[offset + 1] = light.position[1] 
      data[offset + 2] = light.position[2]
      data[offset + 3] = 0 // padding
      data[offset + 4] = light.color[0]
      data[offset + 5] = light.color[1]
      data[offset + 6] = light.color[2]
      data[offset + 7] = light.intensity
    })

    this.device.queue.writeBuffer(this.lightBuffer, 0, data)
  }

  resize(width: number, height: number) {
    this.canvas.width = width
    this.canvas.height = height
    
    if (this.fallbackRenderer) {
      this.fallbackRenderer.setSize(width, height)
    }

    if (this.context && this.device) {
      this.context.configure({
        device: this.device,
        format: navigator.gpu.getPreferredCanvasFormat(),
        alphaMode: 'premultiplied',
        usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.COPY_SRC
      })
    }
  }

  getCapabilities(): WebGPUCapabilities {
    return { ...this.capabilities }
  }

  dispose() {
    if (this.fallbackRenderer) {
      this.fallbackRenderer.dispose()
    }

    // Dispose WebGPU resources
    this.uniformBuffer?.destroy()
    this.cameraBuffer?.destroy()
    this.lightBuffer?.destroy()
    this.particleBuffer?.destroy()
    this.particleUniformBuffer?.destroy()

    this.device = null
    this.context = null
    this.isInitialized = false
    this.capabilities = {
      supported: false,
      adapter: null,
      device: null,
      features: [],
      limits: {}
    }
  }

  get isWebGPU(): boolean {
    return this.device !== null && !this.fallbackRenderer
  }

  get renderer(): THREE.WebGLRenderer | null {
    return this.fallbackRenderer
  }

  // Utility methods
  static async isSupported(): Promise<boolean> {
    if (!navigator.gpu) return false
    
    try {
      const adapter = await navigator.gpu.requestAdapter()
      return !!adapter
    } catch {
      return false
    }
  }

  static getPreferredFormat(): string {
    return navigator.gpu?.getPreferredCanvasFormat?.() || 'bgra8unorm'
  }
}

export default WebGPURenderer
export { WebGPUUniforms }
