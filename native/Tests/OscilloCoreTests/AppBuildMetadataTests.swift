import XCTest
@testable import OscilloCore

final class AppBuildMetadataTests: XCTestCase {
    func testFormatsVisibleVersionAndBuildMarker() {
        let metadata = AppBuildMetadata(
            bundleInfo: [
                "CFBundleShortVersionString": "1.2.3",
                "CFBundleVersion": "456"
            ]
        )

        XCTAssertEqual(metadata.visibleBuildMarker, "v1.2.3 build 456")
    }
}
