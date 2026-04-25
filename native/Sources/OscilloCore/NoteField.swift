import simd

public enum NoteKind: String, Equatable, Sendable {
    case note
    case chord
    case beat
}

public struct NoteNode: Equatable, Sendable, Identifiable {
    public let id: String
    public let position: SIMD3<Float>
    public let note: String
    public let hueDegrees: Float
    public let kind: NoteKind

    public init(
        id: String,
        position: SIMD3<Float>,
        note: String,
        hueDegrees: Float,
        kind: NoteKind
    ) {
        self.id = id
        self.position = position
        self.note = note
        self.hueDegrees = hueDegrees
        self.kind = kind
    }
}

public enum NoteField {
    public static func generate(scaleNotes: [String], maxCount: Int = 12) -> [NoteNode] {
        let count = min(scaleNotes.count, maxCount)
        guard count > 0 else { return [] }

        return (0..<count).map { index in
            let t = Float(index) / Float(count)
            let spiralRadius = Float(6) + sin(t * .pi * 4) * 2
            let spiralHeight = (t - 0.5) * 8
            let angle = t * .pi * 6

            return NoteNode(
                id: "\(scaleNotes[index])-\(index)",
                position: SIMD3<Float>(
                    cos(angle) * spiralRadius,
                    spiralHeight,
                    sin(angle) * spiralRadius
                ),
                note: scaleNotes[index],
                hueDegrees: t * 360,
                kind: kind(for: index)
            )
        }
    }

    private static func kind(for index: Int) -> NoteKind {
        if index.isMultiple(of: 4) {
            return .chord
        }

        if index.isMultiple(of: 3) {
            return .beat
        }

        return .note
    }
}
