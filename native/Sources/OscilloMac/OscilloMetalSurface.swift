import MetalKit
import OscilloCore
import SwiftUI

struct OscilloMetalSurface: NSViewRepresentable {
    let featureStore: AudioFeatureStore
    let settingsStore: SceneSettingsStore
    var isActive: Bool

    func makeCoordinator() -> OscilloRenderer {
        OscilloRenderer(featureStore: featureStore, settingsStore: settingsStore)
    }

    func makeNSView(context: Context) -> MTKView {
        let view = MTKView()
        view.device = MTLCreateSystemDefaultDevice()
        view.colorPixelFormat = .bgra8Unorm
        view.clearColor = MTLClearColor(red: 0, green: 0, blue: 0.07, alpha: 1)
        view.preferredFramesPerSecond = 60
        view.enableSetNeedsDisplay = false
        view.isPaused = false
        view.delegate = context.coordinator
        context.coordinator.configure(view: view)
        return view
    }

    func updateNSView(_: MTKView, context: Context) {
        context.coordinator.isActive = isActive
    }
}
