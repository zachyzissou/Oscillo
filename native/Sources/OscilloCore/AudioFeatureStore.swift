import os

public final class AudioFeatureStore: @unchecked Sendable {
    private let features = OSAllocatedUnfairLock(initialState: AudioFeatures.silence)

    public init() {
        // Public initializer exposes the store outside the module.
    }

    public func update(_ features: AudioFeatures) {
        self.features.withLock { currentFeatures in
            currentFeatures = features
        }
    }

    public func snapshot() -> AudioFeatures {
        features.withLock { $0 }
    }
}
