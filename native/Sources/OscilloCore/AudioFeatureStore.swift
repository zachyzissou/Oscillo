import Foundation

public final class AudioFeatureStore: @unchecked Sendable {
    private let lock = NSLock()
    private var currentFeatures = AudioFeatures.silence

    public init() {
        // Public initializer exposes the store outside the module.
    }

    public func update(_ features: AudioFeatures) {
        lock.lock()
        currentFeatures = features
        lock.unlock()
    }

    public func snapshot() -> AudioFeatures {
        lock.lock()
        let features = currentFeatures
        lock.unlock()
        return features
    }
}
