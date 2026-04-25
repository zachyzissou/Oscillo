import Foundation

public enum ScenePalette: String, CaseIterable, Equatable, Identifiable, Sendable {
    case neon
    case aurora
    case solar
    case mono

    public var id: String { rawValue }

    public var displayName: String {
        switch self {
        case .neon:
            "Neon"
        case .aurora:
            "Aurora"
        case .solar:
            "Solar"
        case .mono:
            "Mono"
        }
    }

    public var uniformIndex: Int32 {
        switch self {
        case .neon:
            0
        case .aurora:
            1
        case .solar:
            2
        case .mono:
            3
        }
    }
}

public enum SceneMode: String, CaseIterable, Equatable, Identifiable, Sendable {
    case spectralTerrain
    case tunnel
    case constellation
    case liquidSurface
    case spectrogramStage

    public var id: String { rawValue }

    public var displayName: String {
        switch self {
        case .spectralTerrain:
            "Spectral Terrain"
        case .tunnel:
            "Tunnel"
        case .constellation:
            "Constellation"
        case .liquidSurface:
            "Liquid Surface"
        case .spectrogramStage:
            "Spectrogram Stage"
        }
    }

    public var shortName: String {
        switch self {
        case .spectralTerrain:
            "Terrain"
        case .tunnel:
            "Tunnel"
        case .constellation:
            "Stars"
        case .liquidSurface:
            "Liquid"
        case .spectrogramStage:
            "Spectrum"
        }
    }

    public var uniformIndex: Int32 {
        switch self {
        case .spectralTerrain:
            0
        case .tunnel:
            1
        case .constellation:
            2
        case .liquidSurface:
            3
        case .spectrogramStage:
            4
        }
    }
}

public struct SceneSettings: Equatable, Sendable {
    public var visualGain: Float
    public var particleDensity: Float
    public var previewTempo: Float
    public var palette: ScenePalette
    public var sceneMode: SceneMode

    public init(
        visualGain: Float,
        particleDensity: Float,
        previewTempo: Float,
        palette: ScenePalette,
        sceneMode: SceneMode
    ) {
        self.visualGain = visualGain.clamped(to: 0.25...2.0)
        self.particleDensity = particleDensity.clamped(to: 0.15...1.5)
        self.previewTempo = previewTempo.clamped(to: 0.5...2.0)
        self.palette = palette
        self.sceneMode = sceneMode
    }

    public static let standard = SceneSettings(
        visualGain: 1.0,
        particleDensity: 0.9,
        previewTempo: 1.0,
        palette: .neon,
        sceneMode: .spectralTerrain
    )
}

public final class SceneSettingsStore: @unchecked Sendable {
    private let lock = NSLock()
    private var currentSettings: SceneSettings

    public init(initialSettings: SceneSettings = .standard) {
        self.currentSettings = initialSettings
    }

    public func update(_ settings: SceneSettings) {
        lock.lock()
        currentSettings = settings
        lock.unlock()
    }

    public func snapshot() -> SceneSettings {
        lock.lock()
        let settings = currentSettings
        lock.unlock()
        return settings
    }
}

private extension Float {
    func clamped(to range: ClosedRange<Float>) -> Float {
        min(max(self, range.lowerBound), range.upperBound)
    }
}
