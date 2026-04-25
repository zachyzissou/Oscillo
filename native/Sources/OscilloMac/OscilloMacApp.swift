import OscilloCore
import SwiftUI

@main
struct OscilloMacApp: App {
    @StateObject private var audioEngine: LiveAudioEngine
    @StateObject private var sceneController: SceneController

    init() {
        let settingsStore = SceneSettingsStore()
        _audioEngine = StateObject(wrappedValue: LiveAudioEngine(sceneSettingsStore: settingsStore))
        _sceneController = StateObject(wrappedValue: SceneController(settingsStore: settingsStore))
    }

    var body: some Scene {
        WindowGroup("Oscillo") {
            ContentView(audioEngine: audioEngine, sceneController: sceneController)
                .frame(minWidth: 960, minHeight: 640)
        }
        .windowStyle(.hiddenTitleBar)
    }
}
