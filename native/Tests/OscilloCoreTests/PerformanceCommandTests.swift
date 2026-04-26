import XCTest
@testable import OscilloCore

final class PerformanceCommandTests: XCTestCase {
    func testTransportCommandShortcutsAreStable() {
        XCTAssertEqual(String(PerformanceCommand.togglePreview.keyEquivalent), " ")
        XCTAssertEqual(String(PerformanceCommand.toggleMicrophone.keyEquivalent), "m")
    }

    func testSceneShortcutOrderMatchesSceneOrder() {
        let keys = SceneMode.allCases.map { String($0.performanceKey) }

        XCTAssertEqual(keys, ["1", "2", "3", "4", "5"])
    }

    func testPresetShortcutOrderMatchesPerformanceRail() {
        let keys = PerformancePreset.allCases.map { String($0.performanceKey) }

        XCTAssertEqual(keys, ["q", "w", "e", "r"])
    }

    func testCommandTitlesUseVisibleLabels() {
        XCTAssertEqual(PerformanceCommand.scene(.liquidSurface).title, "Liquid Surface")
        XCTAssertEqual(PerformanceCommand.preset(.surge).title, "Surge")
    }
}
