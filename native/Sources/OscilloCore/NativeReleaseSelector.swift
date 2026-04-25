public struct NativeReleaseCandidate: Equatable, Sendable {
    public let tagName: String
    public let version: AppVersion

    public init?(tagName: String) {
        guard tagName.hasPrefix("native-v"),
              let version = AppVersion(tagName)
        else {
            return nil
        }

        self.tagName = tagName
        self.version = version
    }
}

public enum NativeReleaseSelector {
    public static func newest(in tagNames: [String]) -> NativeReleaseCandidate? {
        tagNames
            .compactMap { NativeReleaseCandidate(tagName: $0) }
            .max { $0.version < $1.version }
    }
}
