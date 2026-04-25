import XCTest
@testable import OscilloCore

final class AppVersionTests: XCTestCase {
    func testParsesNativeReleaseTags() throws {
        let version = try XCTUnwrap(AppVersion("native-v1.2.3"))

        XCTAssertEqual(version.major, 1)
        XCTAssertEqual(version.minor, 2)
        XCTAssertEqual(version.patch, 3)
    }

    func testComparesSemanticVersions() throws {
        XCTAssertTrue(try XCTUnwrap(AppVersion("0.2.0")) > XCTUnwrap(AppVersion("0.1.9")))
        XCTAssertTrue(try XCTUnwrap(AppVersion("1.0.0")) > XCTUnwrap(AppVersion("0.9.9")))
        XCTAssertFalse(try XCTUnwrap(AppVersion("0.1.0")) > XCTUnwrap(AppVersion("0.1.0")))
    }

    func testRejectsInvalidVersions() {
        XCTAssertNil(AppVersion("release-candidate"))
        XCTAssertNil(AppVersion("1.2"))
    }
}
