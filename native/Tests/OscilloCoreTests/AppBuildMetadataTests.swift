import XCTest
@testable import OscilloCore

final class AppBuildMetadataTests: XCTestCase {
    func testFormatsVisibleVersionAndBuildMarker() {
        let metadata = AppBuildMetadata(
            bundleInfo: [
                "CFBundleShortVersionString": "0.1.5",
                "CFBundleVersion": "6"
            ]
        )

        XCTAssertEqual(metadata.visibleBuildMarker, "v0.1.5 build 6")
    }
}
