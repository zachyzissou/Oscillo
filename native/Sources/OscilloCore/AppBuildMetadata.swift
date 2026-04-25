import Foundation

public struct AppBuildMetadata: Equatable, Sendable {
    public let shortVersion: String
    public let buildNumber: String

    public init(shortVersion: String, buildNumber: String) {
        self.shortVersion = shortVersion
        self.buildNumber = buildNumber
    }

    public init(bundleInfo: [String: Any]) {
        self.init(
            shortVersion: bundleInfo["CFBundleShortVersionString"] as? String ?? "unknown",
            buildNumber: bundleInfo["CFBundleVersion"] as? String ?? "unknown"
        )
    }

    public var visibleBuildMarker: String {
        "v\(shortVersion) build \(buildNumber)"
    }
}
