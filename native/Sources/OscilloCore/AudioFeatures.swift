import Foundation

public struct AudioEnergyBands: Equatable, Sendable {
    public var bass: Float
    public var mid: Float
    public var treble: Float

    public init(bass: Float, mid: Float, treble: Float) {
        self.bass = bass
        self.mid = mid
        self.treble = treble
    }

    public static let silence = AudioEnergyBands(bass: 0, mid: 0, treble: 0)
}

public struct AudioFeatures: Equatable, Sendable {
    public var volume: Float
    public var bassEnergy: Float
    public var midEnergy: Float
    public var trebleEnergy: Float
    public var peakFrequency: Float
    public var spectralCentroid: Float
    public var rms: Float
    public var zeroCrossingRate: Float

    public init(
        volume: Float,
        bands: AudioEnergyBands,
        peakFrequency: Float,
        spectralCentroid: Float,
        rms: Float,
        zeroCrossingRate: Float
    ) {
        self.volume = volume
        self.bassEnergy = bands.bass
        self.midEnergy = bands.mid
        self.trebleEnergy = bands.treble
        self.peakFrequency = peakFrequency
        self.spectralCentroid = spectralCentroid
        self.rms = rms
        self.zeroCrossingRate = zeroCrossingRate
    }

    public static let silence = AudioFeatures(
        volume: 0,
        bands: .silence,
        peakFrequency: 0,
        spectralCentroid: 0,
        rms: 0,
        zeroCrossingRate: 0
    )
}

public enum AudioFeatureExtractor {
    public static func extract(
        frequencyMagnitudes: [Float],
        timeDomainSamples: [Float],
        sampleRate: Float
    ) -> AudioFeatures {
        let rms = calculateRMS(timeDomainSamples)
        let bands = calculateBands(frequencyMagnitudes, sampleRate: sampleRate)

        return AudioFeatures(
            volume: rms,
            bands: bands,
            peakFrequency: calculatePeakFrequency(frequencyMagnitudes, sampleRate: sampleRate),
            spectralCentroid: calculateSpectralCentroid(frequencyMagnitudes, sampleRate: sampleRate),
            rms: rms,
            zeroCrossingRate: calculateZeroCrossingRate(timeDomainSamples)
        )
    }

    private static func calculateRMS(_ samples: [Float]) -> Float {
        guard !samples.isEmpty else { return 0 }

        let sum = samples.reduce(Float(0)) { partial, sample in
            partial + sample * sample
        }

        return sqrt(sum / Float(samples.count))
    }

    private static func calculateBands(
        _ magnitudes: [Float],
        sampleRate: Float
    ) -> AudioEnergyBands {
        guard !magnitudes.isEmpty, sampleRate > 0 else {
            return .silence
        }

        var bassSum = Float(0)
        var bassCount = 0
        var midSum = Float(0)
        var midCount = 0
        var trebleSum = Float(0)
        var trebleCount = 0

        for (index, magnitude) in magnitudes.enumerated() {
            let frequency = frequencyForBin(index, binCount: magnitudes.count, sampleRate: sampleRate)
            let normalized = min(max(magnitude, 0), 1)

            if frequency < 250 {
                bassSum += normalized
                bassCount += 1
            } else if frequency < 4_000 {
                midSum += normalized
                midCount += 1
            } else {
                trebleSum += normalized
                trebleCount += 1
            }
        }

        return AudioEnergyBands(
            bass: average(sum: bassSum, count: bassCount),
            mid: average(sum: midSum, count: midCount),
            treble: average(sum: trebleSum, count: trebleCount)
        )
    }

    private static func calculatePeakFrequency(
        _ magnitudes: [Float],
        sampleRate: Float
    ) -> Float {
        guard !magnitudes.isEmpty, sampleRate > 0 else { return 0 }

        var peakIndex = 0
        var peakMagnitude = Float.leastNormalMagnitude

        for (index, magnitude) in magnitudes.enumerated() where magnitude > peakMagnitude {
            peakIndex = index
            peakMagnitude = magnitude
        }

        return peakMagnitude > 0
            ? frequencyForBin(peakIndex, binCount: magnitudes.count, sampleRate: sampleRate)
            : 0
    }

    private static func calculateSpectralCentroid(
        _ magnitudes: [Float],
        sampleRate: Float
    ) -> Float {
        guard !magnitudes.isEmpty, sampleRate > 0 else { return 0 }

        var weightedSum = Float(0)
        var magnitudeSum = Float(0)

        for (index, magnitude) in magnitudes.enumerated() {
            let normalized = max(magnitude, 0)
            let frequency = frequencyForBin(index, binCount: magnitudes.count, sampleRate: sampleRate)
            weightedSum += frequency * normalized
            magnitudeSum += normalized
        }

        return magnitudeSum > 0 ? weightedSum / magnitudeSum : 0
    }

    private static func calculateZeroCrossingRate(_ samples: [Float]) -> Float {
        guard samples.count > 1 else { return 0 }

        var crossings = 0
        for index in 1..<samples.count {
            if samples[index - 1] * samples[index] < 0 {
                crossings += 1
            }
        }

        return Float(crossings) / Float(samples.count)
    }

    private static func frequencyForBin(
        _ index: Int,
        binCount: Int,
        sampleRate: Float
    ) -> Float {
        guard binCount > 0 else { return 0 }
        return Float(index) * (sampleRate / 2) / Float(binCount)
    }

    private static func average(sum: Float, count: Int) -> Float {
        guard count > 0 else { return 0 }
        return sum / Float(count)
    }
}
