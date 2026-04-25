import XCTest
@testable import OscilloCore

final class NativeReleaseSelectorTests: XCTestCase {
    func testSelectsNewestNativeReleaseTag() throws {
        let release = try XCTUnwrap(NativeReleaseSelector.newest(in: [
            "v9.9.9",
            "native-v0.1.1",
            "native-v0.1.3",
            "native-v0.1.2"
        ]))

        XCTAssertEqual(release.tagName, "native-v0.1.3")
        XCTAssertEqual(release.version, AppVersion("0.1.3"))
    }

    func testIgnoresNonNativeReleaseTags() {
        XCTAssertNil(NativeReleaseSelector.newest(in: [
            "v1.0.0",
            "web-v2.0.0",
            "release-candidate"
        ]))
    }
}
