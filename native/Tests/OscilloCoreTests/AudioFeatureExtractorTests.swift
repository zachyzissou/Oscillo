import XCTest
@testable import OscilloCore

final class AudioFeatureExtractorTests: XCTestCase {
    func testExtractsEnergyBandsAndPeakFrequency() {
        var magnitudes = Array(repeating: Float(0), count: 1_024)
        magnitudes[10] = 1.0
        magnitudes[100] = 0.5
        magnitudes[500] = 0.25

        let features = AudioFeatureExtractor.extract(
            frequencyMagnitudes: magnitudes,
            timeDomainSamples: Array(repeating: 0, count: 1_024),
            sampleRate: 44_100
        )

        XCTAssertGreaterThan(features.bassEnergy, features.midEnergy)
        XCTAssertGreaterThan(features.midEnergy, features.trebleEnergy)
        XCTAssertEqual(features.peakFrequency, 215.33, accuracy: 22.0)
    }

    func testComputesRMSAndZeroCrossingRate() {
        let features = AudioFeatureExtractor.extract(
            frequencyMagnitudes: Array(repeating: 0, count: 8),
            timeDomainSamples: [-1, 1, -1, 1],
            sampleRate: 44_100
        )

        XCTAssertEqual(features.rms, 1.0, accuracy: 0.0001)
        XCTAssertEqual(features.zeroCrossingRate, 0.75, accuracy: 0.0001)
    }
}
