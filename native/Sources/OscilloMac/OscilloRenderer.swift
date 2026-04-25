import MetalKit
import OscilloCore
import simd

final class OscilloRenderer: NSObject, MTKViewDelegate {
    var isActive = true

    private let featureStore: AudioFeatureStore
    private let settingsStore: SceneSettingsStore
    private var commandQueue: MTLCommandQueue?
    private var pipelineState: MTLRenderPipelineState?
    private var startTime = CFAbsoluteTimeGetCurrent()

    init(featureStore: AudioFeatureStore, settingsStore: SceneSettingsStore) {
        self.featureStore = featureStore
        self.settingsStore = settingsStore
        super.init()
    }

    @MainActor
    func configure(view: MTKView) {
        guard let device = view.device else {
            return
        }

        commandQueue = device.makeCommandQueue()

        do {
            let library = try device.makeLibrary(source: MetalShaderSource.fullScreenTunnel, options: nil)
            let descriptor = MTLRenderPipelineDescriptor()
            descriptor.vertexFunction = library.makeFunction(name: "oscilloVertex")
            descriptor.fragmentFunction = library.makeFunction(name: "oscilloFragment")
            descriptor.colorAttachments[0].pixelFormat = view.colorPixelFormat
            pipelineState = try device.makeRenderPipelineState(descriptor: descriptor)
        } catch {
            assertionFailure("Failed to compile Oscillo Metal pipeline: \(error)")
        }
    }

    func mtkView(_: MTKView, drawableSizeWillChange _: CGSize) {
        // The renderer reads drawableSize each frame when building shader uniforms.
    }

    func draw(in view: MTKView) {
        guard
            let drawable = view.currentDrawable,
            let descriptor = view.currentRenderPassDescriptor,
            let commandQueue,
            let pipelineState,
            let commandBuffer = commandQueue.makeCommandBuffer(),
            let encoder = commandBuffer.makeRenderCommandEncoder(descriptor: descriptor)
        else {
            return
        }

        var uniforms = makeUniforms(for: view.drawableSize)

        encoder.setRenderPipelineState(pipelineState)
        encoder.setFragmentBytes(
            &uniforms,
            length: MemoryLayout<ShaderUniforms>.stride,
            index: 0
        )
        encoder.drawPrimitives(type: .triangle, vertexStart: 0, vertexCount: 3)
        encoder.endEncoding()

        commandBuffer.present(drawable)
        commandBuffer.commit()
    }

    private func makeUniforms(for size: CGSize) -> ShaderUniforms {
        let elapsed = Float(CFAbsoluteTimeGetCurrent() - startTime)
        let features = isActive ? featureStore.snapshot() : .silence
        let settings = settingsStore.snapshot()
        let level = min(1, max(features.volume, (features.bassEnergy + features.midEnergy + features.trebleEnergy) / 3))

        return ShaderUniforms(
            time: elapsed,
            audioLevel: level,
            bassEnergy: features.bassEnergy,
            midEnergy: features.midEnergy,
            trebleEnergy: features.trebleEnergy,
            visualGain: settings.visualGain,
            particleDensity: settings.particleDensity,
            paletteIndex: settings.palette.uniformIndex,
            sceneModeIndex: settings.sceneMode.uniformIndex,
            padding: 0,
            resolution: SIMD2<Float>(Float(max(size.width, 1)), Float(max(size.height, 1)))
        )
    }
}

private struct ShaderUniforms {
    var time: Float
    var audioLevel: Float
    var bassEnergy: Float
    var midEnergy: Float
    var trebleEnergy: Float
    var visualGain: Float
    var particleDensity: Float
    var paletteIndex: Int32
    var sceneModeIndex: Int32
    var padding: Float
    var resolution: SIMD2<Float>
}
