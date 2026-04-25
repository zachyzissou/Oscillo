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
        XCTAssertEqual(plist["CFBundleShortVersionString"] as? String, "0.1.8")
        XCTAssertEqual(plist["CFBundleVersion"] as? String, "9")
        XCTAssertEqual(
            plist["NSMicrophoneUsageDescription"] as? String,
            "Oscillo uses microphone input to drive real-time audio-reactive visuals."
        )
    }

    func testInfoPlistDeclaresSparkleUpdateFeed() throws {
        let plist = try appInfoPlist()

        XCTAssertEqual(
            plist["SUFeedURL"] as? String,
            "https://github.com/zachyzissou/Oscillo/releases/latest/download/oscillo-appcast.xml"
        )
        XCTAssertEqual(
            plist["SUPublicEDKey"] as? String,
            "uNFkgAKuoZBfQZT4YWBKbEJCZX8IDdUnk8Gwdkiv0xw="
        )
        XCTAssertEqual(plist["SUEnableAutomaticChecks"] as? Bool, true)
        XCTAssertEqual(plist["SUEnableInstallerLauncherService"] as? Bool, true)
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
        XCTAssertEqual(
            plist["com.apple.security.temporary-exception.mach-lookup.global-name"] as? [String],
            [
                "com.zachyzissou.oscillo.native.mac-spks",
                "com.zachyzissou.oscillo.native.mac-spki"
            ]
        )
    }

    private func appInfoPlist() throws -> [String: Any] {
        let plistURL = packageRoot()
            .appendingPathComponent("AppBundle")
            .appendingPathComponent("Info.plist")
        let data = try Data(contentsOf: plistURL)
        return try XCTUnwrap(
            PropertyListSerialization.propertyList(from: data, options: [], format: nil)
                as? [String: Any]
        )
    }

    private func packageRoot() -> URL {
        var url = URL(fileURLWithPath: #filePath)
        while url.lastPathComponent != "native" {
            url.deleteLastPathComponent()
        }
        return url
    }
}
