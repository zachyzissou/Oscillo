import XCTest
@testable import OscilloCore

final class AudioCalibrationTests: XCTestCase {
    func testClampsCalibrationControlsToSupportedRanges() {
        let calibration = AudioCalibration(
            sensitivity: 9,
            noiseFloor: -1
        )

        XCTAssertEqual(calibration.sensitivity, 3.0)
        XCTAssertEqual(calibration.noiseFloor, 0.0)

        let upperFloor = AudioCalibration(noiseFloor: 1)
        XCTAssertEqual(upperFloor.noiseFloor, 0.45)
    }

    func testStorePublishesThreadSafeSnapshots() {
        let store = AudioCalibrationStore()
        store.update(AudioCalibration(sensitivity: 1.5, noiseFloor: 0.12))

        let snapshot = store.snapshot()

        XCTAssertEqual(snapshot.sensitivity, 1.5)
        XCTAssertEqual(snapshot.noiseFloor, 0.12)
    }

    func testCalibratorAppliesNoiseFloorAndSensitivity() {
        let features = AudioFeatures(
            volume: 0.2,
            bands: AudioEnergyBands(bass: 0.1, mid: 0.5, treble: 0.8),
            peakFrequency: 440,
            spectralCentroid: 1_200,
            rms: 0.2,
            zeroCrossingRate: 0.04
        )

        let calibrated = AudioFeatureCalibrator.apply(
            features,
            calibration: AudioCalibration(sensitivity: 2.0, noiseFloor: 0.1)
        )

        XCTAssertEqual(calibrated.volume, 0.2222, accuracy: 0.0001)
        XCTAssertEqual(calibrated.bassEnergy, 0)
        XCTAssertEqual(calibrated.midEnergy, 0.8889, accuracy: 0.0001)
        XCTAssertEqual(calibrated.trebleEnergy, 1.0)
        XCTAssertEqual(calibrated.rms, 0.2222, accuracy: 0.0001)
        XCTAssertEqual(calibrated.peakFrequency, 440)
        XCTAssertEqual(calibrated.spectralCentroid, 1_200)
        XCTAssertEqual(calibrated.zeroCrossingRate, 0.04)
    }
}
