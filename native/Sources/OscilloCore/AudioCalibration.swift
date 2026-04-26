import Foundation
import os

public struct AudioCalibration: Equatable, Sendable {
    private static let sensitivityRange: ClosedRange<Float> = 0.25...3.0
    private static let noiseFloorRange: ClosedRange<Float> = 0.0...0.45

    public let sensitivity: Float
    public let noiseFloor: Float

    public init(
        sensitivity: Float = 1.0,
        noiseFloor: Float = 0.03
    ) {
        self.sensitivity = sensitivity.clamped(to: Self.sensitivityRange)
        self.noiseFloor = noiseFloor.clamped(to: Self.noiseFloorRange)
    }

    public static let standard = AudioCalibration()
}

public final class AudioCalibrationStore: @unchecked Sendable {
    private let calibration: OSAllocatedUnfairLock<AudioCalibration>

    public init(initialCalibration: AudioCalibration = .standard) {
        self.calibration = OSAllocatedUnfairLock(initialState: initialCalibration)
    }

    public func update(_ calibration: AudioCalibration) {
        self.calibration.withLock { currentCalibration in
            currentCalibration = calibration
        }
    }

    public func snapshot() -> AudioCalibration {
        calibration.withLock { $0 }
    }
}

public enum AudioFeatureCalibrator {
    public static func apply(
        _ features: AudioFeatures,
        calibration: AudioCalibration
    ) -> AudioFeatures {
        AudioFeatures(
            volume: calibrated(features.volume, calibration: calibration),
            bands: AudioEnergyBands(
                bass: calibrated(features.bassEnergy, calibration: calibration),
                mid: calibrated(features.midEnergy, calibration: calibration),
                treble: calibrated(features.trebleEnergy, calibration: calibration)
            ),
            peakFrequency: features.peakFrequency,
            spectralCentroid: features.spectralCentroid,
            rms: calibrated(features.rms, calibration: calibration),
            zeroCrossingRate: features.zeroCrossingRate
        )
    }

    private static func calibrated(
        _ value: Float,
        calibration: AudioCalibration
    ) -> Float {
        guard value > calibration.noiseFloor else { return 0 }

        let usableRange = max(0.0001, 1.0 - calibration.noiseFloor)
        let normalized = (value - calibration.noiseFloor) / usableRange
        return (normalized * calibration.sensitivity).clamped(to: 0...1)
    }
}

private extension Float {
    func clamped(to range: ClosedRange<Float>) -> Float {
        min(max(self, range.lowerBound), range.upperBound)
    }
}
