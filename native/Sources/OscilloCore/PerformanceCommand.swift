import Foundation

public enum PerformanceCommand: Equatable, Sendable {
    case togglePreview
    case toggleMicrophone
    case scene(SceneMode)
    case preset(PerformancePreset)

    public var title: String {
        switch self {
        case .togglePreview:
            "Toggle Preview"
        case .toggleMicrophone:
            "Toggle Microphone"
        case .scene(let sceneMode):
            sceneMode.displayName
        case .preset(let preset):
            preset.displayName
        }
    }

    public var keyEquivalent: Character {
        switch self {
        case .togglePreview:
            " "
        case .toggleMicrophone:
            "m"
        case .scene(let sceneMode):
            sceneMode.performanceKey
        case .preset(let preset):
            preset.performanceKey
        }
    }
}

public extension SceneMode {
    var performanceKey: Character {
        switch self {
        case .spectralTerrain:
            "1"
        case .tunnel:
            "2"
        case .constellation:
            "3"
        case .liquidSurface:
            "4"
        case .spectrogramStage:
            "5"
        }
    }
}

public extension PerformancePreset {
    var performanceKey: Character {
        switch self {
        case .drift:
            "q"
        case .pulse:
            "w"
        case .orbit:
            "e"
        case .surge:
            "r"
        }
    }
}
