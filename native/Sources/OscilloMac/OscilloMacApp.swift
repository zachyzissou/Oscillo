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
        .commands {
            CommandMenu("Perform") {
                Button(PerformanceCommand.togglePreview.title) {
                    audioEngine.togglePreview()
                }
                .keyboardShortcut(.space, modifiers: [])

                Button(PerformanceCommand.toggleMicrophone.title) {
                    audioEngine.toggleMicrophone()
                }
                .keyboardShortcut("m", modifiers: [])

                Divider()

                ForEach(PerformancePreset.allCases) { preset in
                    Button(PerformanceCommand.preset(preset).title) {
                        sceneController.applyPreset(preset)
                    }
                    .keyboardShortcut(
                        KeyEquivalent(Character(preset.performanceKey)),
                        modifiers: []
                    )
                }

                Divider()

                ForEach(SceneMode.allCases) { sceneMode in
                    Button(PerformanceCommand.scene(sceneMode).title) {
                        sceneController.setSceneMode(sceneMode)
                    }
                    .keyboardShortcut(
                        KeyEquivalent(Character(sceneMode.performanceKey)),
                        modifiers: []
                    )
                }
            }
        }
    }
}
