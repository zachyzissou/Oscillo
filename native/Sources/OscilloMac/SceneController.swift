import OscilloCore
import SwiftUI

@MainActor
final class SceneController: ObservableObject {
    @Published private(set) var settings: SceneSettings

    let settingsStore: SceneSettingsStore

    init(settingsStore: SceneSettingsStore = SceneSettingsStore()) {
        self.settingsStore = settingsStore
        self.settings = settingsStore.snapshot()
    }

    func setVisualGain(_ value: Float) {
        update(
            visualGain: value,
            particleDensity: settings.particleDensity,
            previewTempo: settings.previewTempo,
            palette: settings.palette,
            sceneMode: settings.sceneMode
        )
    }

    func setParticleDensity(_ value: Float) {
        update(
            visualGain: settings.visualGain,
            particleDensity: value,
            previewTempo: settings.previewTempo,
            palette: settings.palette,
            sceneMode: settings.sceneMode
        )
    }

    func setPreviewTempo(_ value: Float) {
        update(
            visualGain: settings.visualGain,
            particleDensity: settings.particleDensity,
            previewTempo: value,
            palette: settings.palette,
            sceneMode: settings.sceneMode
        )
    }

    func setPalette(_ palette: ScenePalette) {
        update(
            visualGain: settings.visualGain,
            particleDensity: settings.particleDensity,
            previewTempo: settings.previewTempo,
            palette: palette,
            sceneMode: settings.sceneMode
        )
    }

    func setSceneMode(_ sceneMode: SceneMode) {
        update(
            visualGain: settings.visualGain,
            particleDensity: settings.particleDensity,
            previewTempo: settings.previewTempo,
            palette: settings.palette,
            sceneMode: sceneMode
        )
    }

    func applyPreset(_ preset: PerformancePreset) {
        settings = preset.settings
        settingsStore.update(preset.settings)
    }

    private func update(
        visualGain: Float,
        particleDensity: Float,
        previewTempo: Float,
        palette: ScenePalette,
        sceneMode: SceneMode
    ) {
        let next = SceneSettings(
            visualGain: visualGain,
            particleDensity: particleDensity,
            previewTempo: previewTempo,
            palette: palette,
            sceneMode: sceneMode
        )
        settings = next
        settingsStore.update(next)
    }
}
