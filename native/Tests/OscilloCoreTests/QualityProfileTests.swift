import XCTest
@testable import OscilloCore

final class QualityProfileTests: XCTestCase {
    func testProfilesMatchNativePerformanceTiers() {
        XCTAssertEqual(QualityProfile.low.starCountScale, 0.4)
        XCTAssertFalse(QualityProfile.low.shadowsEnabled)
        XCTAssertTrue(QualityProfile.medium.postProcessingEnabled)
        XCTAssertEqual(QualityProfile.high.particleScale, 1.0)
    }
}
