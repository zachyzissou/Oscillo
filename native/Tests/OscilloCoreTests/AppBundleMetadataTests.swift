import Foundation
import XCTest

final class AppBundleMetadataTests: XCTestCase {
    func testInfoPlistDeclaresMacAppAndMicrophoneUsage() throws {
        let plistURL = packageRoot()
            .appendingPathComponent("AppBundle")
            .appendingPathComponent("Info.plist")
        let data = try Data(contentsOf: plistURL)
        let plist = try XCTUnwrap(
            PropertyListSerialization.propertyList(from: data, options: [], format: nil)
                as? [String: Any]
        )

        XCTAssertEqual(plist["CFBundleExecutable"] as? String, "OscilloMac")
        XCTAssertEqual(plist["CFBundlePackageType"] as? String, "APPL")
        XCTAssertEqual(plist["CFBundleIdentifier"] as? String, "com.zachyzissou.oscillo.native.mac")
        XCTAssertEqual(plist["CFBundleShortVersionString"] as? String, "0.1.1")
        XCTAssertEqual(plist["CFBundleVersion"] as? String, "2")
        XCTAssertEqual(
            plist["NSMicrophoneUsageDescription"] as? String,
            "Oscillo uses microphone input to drive real-time audio-reactive visuals."
        )
    }

    func testEntitlementsAllowSandboxedAudioInput() throws {
        let plistURL = packageRoot()
            .appendingPathComponent("AppBundle")
            .appendingPathComponent("OscilloMac.entitlements")
        let data = try Data(contentsOf: plistURL)
        let plist = try XCTUnwrap(
            PropertyListSerialization.propertyList(from: data, options: [], format: nil)
                as? [String: Any]
        )

        XCTAssertEqual(plist["com.apple.security.app-sandbox"] as? Bool, true)
        XCTAssertEqual(plist["com.apple.security.device.audio-input"] as? Bool, true)
        XCTAssertEqual(plist["com.apple.security.network.client"] as? Bool, true)
    }

    private func packageRoot() -> URL {
        var url = URL(fileURLWithPath: #filePath)
        while url.lastPathComponent != "native" {
            url.deleteLastPathComponent()
        }
        return url
    }
}
