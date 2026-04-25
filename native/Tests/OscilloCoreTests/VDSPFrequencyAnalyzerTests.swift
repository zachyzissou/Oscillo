import XCTest
@testable import OscilloCore

final class VDSPFrequencyAnalyzerTests: XCTestCase {
    func testDetectsPeakFrequencyForSineWave() throws {
        let sampleRate: Float = 44_100
        let sampleCount = 2_048
        let targetFrequency: Float = 440
        let analyzer = try XCTUnwrap(VDSPFrequencyAnalyzer(sampleCount: sampleCount))
        let samples = (0..<sampleCount).map { index in
            sin(2 * Float.pi * targetFrequency * Float(index) / sampleRate)
        }

        let magnitudes = analyzer.magnitudes(for: samples)
        let features = AudioFeatureExtractor.extract(
            frequencyMagnitudes: magnitudes,
            timeDomainSamples: samples,
            sampleRate: sampleRate
        )

        XCTAssertEqual(magnitudes.count, sampleCount / 2)
        XCTAssertEqual(features.peakFrequency, targetFrequency, accuracy: 24)
        XCTAssertGreaterThan(features.midEnergy, features.bassEnergy)
    }

    func testPadsShortInputToConfiguredSize() throws {
        let analyzer = try XCTUnwrap(VDSPFrequencyAnalyzer(sampleCount: 1_024))

        let magnitudes = analyzer.magnitudes(for: [0, 0.5, -0.5, 0])

        XCTAssertEqual(magnitudes.count, 512)
    }
}
