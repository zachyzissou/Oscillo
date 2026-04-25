import XCTest
@testable import OscilloCore

final class SceneSettingsTests: XCTestCase {
    func testClampsInteractiveControlsToSupportedRanges() {
        let settings = SceneSettings(
            visualGain: 4.5,
            particleDensity: -2,
            previewTempo: 4,
            palette: .solar
        )

        XCTAssertEqual(settings.visualGain, 2.0)
        XCTAssertEqual(settings.particleDensity, 0.15)
        XCTAssertEqual(settings.previewTempo, 2.0)
        XCTAssertEqual(settings.palette, .solar)
    }

    func testStorePublishesThreadSafeSnapshots() {
        let store = SceneSettingsStore()
        store.update(SceneSettings(
            visualGain: 0.5,
            particleDensity: 0.8,
            previewTempo: 1.25,
            palette: .aurora
        ))

        let snapshot = store.snapshot()

        XCTAssertEqual(snapshot.visualGain, 0.5)
        XCTAssertEqual(snapshot.particleDensity, 0.8)
        XCTAssertEqual(snapshot.previewTempo, 1.25)
        XCTAssertEqual(snapshot.palette, .aurora)
    }

    func testPaletteIndexIsStableForMetalUniforms() {
        XCTAssertEqual(ScenePalette.neon.uniformIndex, 0)
        XCTAssertEqual(ScenePalette.aurora.uniformIndex, 1)
        XCTAssertEqual(ScenePalette.solar.uniformIndex, 2)
        XCTAssertEqual(ScenePalette.mono.uniformIndex, 3)
    }
}
