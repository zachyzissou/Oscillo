import XCTest
@testable import OscilloCore

final class SceneSettingsTests: XCTestCase {
    func testClampsInteractiveControlsToSupportedRanges() {
        let settings = SceneSettings(
            visualGain: 4.5,
            particleDensity: -2,
            previewTempo: 4,
            palette: .solar,
            sceneMode: .liquidSurface
        )

        XCTAssertEqual(settings.visualGain, 2.0)
        XCTAssertEqual(settings.particleDensity, 0.15)
        XCTAssertEqual(settings.previewTempo, 2.0)
        XCTAssertEqual(settings.palette, .solar)
        XCTAssertEqual(settings.sceneMode, .liquidSurface)
    }

    func testStorePublishesThreadSafeSnapshots() {
        let store = SceneSettingsStore()
        store.update(SceneSettings(
            visualGain: 0.5,
            particleDensity: 0.8,
            previewTempo: 1.25,
            palette: .aurora,
            sceneMode: .constellation
        ))

        let snapshot = store.snapshot()

        XCTAssertEqual(snapshot.visualGain, 0.5)
        XCTAssertEqual(snapshot.particleDensity, 0.8)
        XCTAssertEqual(snapshot.previewTempo, 1.25)
        XCTAssertEqual(snapshot.palette, .aurora)
        XCTAssertEqual(snapshot.sceneMode, .constellation)
    }

    func testPaletteIndexIsStableForMetalUniforms() {
        XCTAssertEqual(ScenePalette.neon.uniformIndex, 0)
        XCTAssertEqual(ScenePalette.aurora.uniformIndex, 1)
        XCTAssertEqual(ScenePalette.solar.uniformIndex, 2)
        XCTAssertEqual(ScenePalette.mono.uniformIndex, 3)
    }

    func testSceneModeIndexIsStableForMetalUniforms() {
        XCTAssertEqual(SceneMode.spectralTerrain.uniformIndex, 0)
        XCTAssertEqual(SceneMode.tunnel.uniformIndex, 1)
        XCTAssertEqual(SceneMode.constellation.uniformIndex, 2)
        XCTAssertEqual(SceneMode.liquidSurface.uniformIndex, 3)
        XCTAssertEqual(SceneMode.spectrogramStage.uniformIndex, 4)
    }

    func testPerformancePresetsAreValidControlSnapshots() {
        XCTAssertEqual(PerformancePreset.allCases.count, 4)

        for preset in PerformancePreset.allCases {
            let settings = preset.settings
            XCTAssertEqual(settings.visualGain, settings.visualGain.clamped(to: 0.25...2.0))
            XCTAssertEqual(settings.particleDensity, settings.particleDensity.clamped(to: 0.15...1.5))
            XCTAssertEqual(settings.previewTempo, settings.previewTempo.clamped(to: 0.5...2.0))
        }
    }

    func testPerformancePresetsCoverDistinctScenesAndPalettes() {
        XCTAssertEqual(PerformancePreset.drift.settings.sceneMode, .spectralTerrain)
        XCTAssertEqual(PerformancePreset.pulse.settings.sceneMode, .tunnel)
        XCTAssertEqual(PerformancePreset.orbit.settings.sceneMode, .constellation)
        XCTAssertEqual(PerformancePreset.surge.settings.sceneMode, .spectrogramStage)

        XCTAssertEqual(PerformancePreset.drift.settings.palette, .aurora)
        XCTAssertEqual(PerformancePreset.pulse.settings.palette, .neon)
        XCTAssertEqual(PerformancePreset.orbit.settings.palette, .mono)
        XCTAssertEqual(PerformancePreset.surge.settings.palette, .solar)
    }
}

private extension Float {
    func clamped(to range: ClosedRange<Float>) -> Float {
        min(max(self, range.lowerBound), range.upperBound)
    }
}
