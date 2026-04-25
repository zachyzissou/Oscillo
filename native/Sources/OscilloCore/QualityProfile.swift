public enum QualityLevel: String, CaseIterable, Equatable, Sendable {
    case low
    case medium
    case high
}

public struct QualityProfile: Equatable, Sendable {
    public let level: QualityLevel
    public let starCountScale: Float
    public let particleScale: Float
    public let shadowsEnabled: Bool
    public let postProcessingEnabled: Bool

    public init(
        level: QualityLevel,
        starCountScale: Float,
        particleScale: Float,
        shadowsEnabled: Bool,
        postProcessingEnabled: Bool
    ) {
        self.level = level
        self.starCountScale = starCountScale
        self.particleScale = particleScale
        self.shadowsEnabled = shadowsEnabled
        self.postProcessingEnabled = postProcessingEnabled
    }

    public static let low = QualityProfile(
        level: .low,
        starCountScale: 0.4,
        particleScale: 0.4,
        shadowsEnabled: false,
        postProcessingEnabled: false
    )

    public static let medium = QualityProfile(
        level: .medium,
        starCountScale: 0.7,
        particleScale: 0.7,
        shadowsEnabled: true,
        postProcessingEnabled: true
    )

    public static let high = QualityProfile(
        level: .high,
        starCountScale: 1.0,
        particleScale: 1.0,
        shadowsEnabled: true,
        postProcessingEnabled: true
    )

    public static func profile(for level: QualityLevel) -> QualityProfile {
        switch level {
        case .low:
            low
        case .medium:
            medium
        case .high:
            high
        }
    }
}
