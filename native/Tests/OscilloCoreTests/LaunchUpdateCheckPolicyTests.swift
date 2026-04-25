import XCTest
@testable import OscilloCore

final class LaunchUpdateCheckPolicyTests: XCTestCase {
    func testAllowsAutomaticCheckOnlyOnce() {
        var policy = LaunchUpdateCheckPolicy()

        XCTAssertTrue(policy.shouldStartAutomaticCheck())
        XCTAssertFalse(policy.shouldStartAutomaticCheck())
    }
}
