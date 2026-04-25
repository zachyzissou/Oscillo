import Foundation

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
        bassEnergy: Float,
        midEnergy: Float,
        trebleEnergy: Float,
        peakFrequency: Float,
        spectralCentroid: Float,
        rms: Float,
        zeroCrossingRate: Float
    ) {
        self.volume = volume
        self.bassEnergy = bassEnergy
        self.midEnergy = midEnergy
        self.trebleEnergy = trebleEnergy
        self.peakFrequency = peakFrequency
        self.spectralCentroid = spectralCentroid
        self.rms = rms
        self.zeroCrossingRate = zeroCrossingRate
    }

    public static let silence = AudioFeatures(
        volume: 0,
        bassEnergy: 0,
        midEnergy: 0,
        trebleEnergy: 0,
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
            bassEnergy: bands.bass,
            midEnergy: bands.mid,
            trebleEnergy: bands.treble,
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
    ) -> (bass: Float, mid: Float, treble: Float) {
        guard !magnitudes.isEmpty, sampleRate > 0 else {
            return (0, 0, 0)
        }

        var bass: [Float] = []
        var mid: [Float] = []
        var treble: [Float] = []

        for (index, magnitude) in magnitudes.enumerated() {
            let frequency = frequencyForBin(index, binCount: magnitudes.count, sampleRate: sampleRate)
            let normalized = min(max(magnitude, 0), 1)

            if frequency < 250 {
                bass.append(normalized)
            } else if frequency < 4_000 {
                mid.append(normalized)
            } else {
                treble.append(normalized)
            }
        }

        return (
            average(bass),
            average(mid),
            average(treble)
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

    private static func average(_ values: [Float]) -> Float {
        guard !values.isEmpty else { return 0 }
        return values.reduce(0, +) / Float(values.count)
    }
}
