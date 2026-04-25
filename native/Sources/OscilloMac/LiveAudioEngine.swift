import AVFoundation
import OscilloCore
import SwiftUI

@MainActor
final class LiveAudioEngine: ObservableObject {
    @Published private(set) var isRunning = false
    @Published private(set) var isPreviewing = false
    @Published private(set) var features = AudioFeatures.silence
    @Published private(set) var statusMessage = "Preview signal"

    let featureStore = AudioFeatureStore()

    private let sceneSettingsStore: SceneSettingsStore
    private let engine = AVAudioEngine()
    private let processor = AudioProcessor()
    private var previewTimer: Timer?
    private var publishTimer: Timer?
    private var previewPhase = Float(0)

    init(sceneSettingsStore: SceneSettingsStore = SceneSettingsStore()) {
        self.sceneSettingsStore = sceneSettingsStore
    }

    isolated deinit {
        previewTimer?.invalidate()
        publishTimer?.invalidate()
    }

    func startMicrophone() {
        stopPreview(resetFeatures: false)

        let input = engine.inputNode
        input.removeTap(onBus: 0)

        let format = input.outputFormat(forBus: 0)
        let processor = processor
        let featureStore = featureStore

        input.installTap(onBus: 0, bufferSize: 1_024, format: format) { buffer, _ in
            guard let features = processor.process(buffer: buffer) else {
                return
            }
            featureStore.update(features)
        }

        do {
            engine.prepare()
            try engine.start()
            isRunning = true
            statusMessage = "Microphone input"
            beginPublishing()
        } catch {
            input.removeTap(onBus: 0)
            isRunning = false
            statusMessage = "Microphone unavailable; using preview signal"
            startPreview()
        }
    }

    func stopMicrophone() {
        engine.inputNode.removeTap(onBus: 0)
        engine.stop()
        isRunning = false
        statusMessage = "Preview signal"
        startPreview()
    }

    func startPreview() {
        guard previewTimer == nil else { return }
        isPreviewing = true
        statusMessage = isRunning ? "Microphone input" : "Preview signal"
        beginPublishing()

        previewTimer = Timer.scheduledTimer(withTimeInterval: 1.0 / 60.0, repeats: true) { [weak self] _ in
            Task { @MainActor in
                self?.advancePreviewSignal()
            }
        }
    }

    func stopPreview(resetFeatures: Bool) {
        previewTimer?.invalidate()
        previewTimer = nil
        isPreviewing = false

        if resetFeatures, !isRunning {
            featureStore.update(.silence)
            features = .silence
            statusMessage = "Idle"
        }

        stopPublishingIfIdle()
    }

    private func beginPublishing() {
        guard publishTimer == nil else { return }

        publishTimer = Timer.scheduledTimer(withTimeInterval: 1.0 / 30.0, repeats: true) { [weak self] _ in
            Task { @MainActor in
                guard let self else { return }
                self.features = self.featureStore.snapshot()
            }
        }
    }

    private func stopPublishingIfIdle() {
        guard !isRunning, !isPreviewing else { return }

        publishTimer?.invalidate()
        publishTimer = nil
    }

    private func advancePreviewSignal() {
        guard !isRunning else { return }

        let settings = sceneSettingsStore.snapshot()
        previewPhase += (1.0 / 60.0) * settings.previewTempo
        let bass = normalizedWave(previewPhase * 0.7)
        let mid = normalizedWave(previewPhase * 1.1 + 1.4) * 0.72
        let treble = normalizedWave(previewPhase * 2.6 + 2.0) * 0.48
        let volume = min(1, 0.28 + bass * 0.44 + treble * 0.18)

        featureStore.update(AudioFeatures(
            volume: volume,
            bands: AudioEnergyBands(bass: bass, mid: mid, treble: treble),
            peakFrequency: 120 + mid * 2_800,
            spectralCentroid: 600 + treble * 7_500,
            rms: volume,
            zeroCrossingRate: 0.04 + treble * 0.16
        ))
    }

    private func normalizedWave(_ phase: Float) -> Float {
        (sin(phase * 2 * .pi) + 1) * 0.5
    }
}

private final class AudioProcessor: @unchecked Sendable {
    private let sampleCount = 1_024
    private let analyzer = VDSPFrequencyAnalyzer(sampleCount: 1_024)!

    func process(buffer: AVAudioPCMBuffer) -> AudioFeatures? {
        guard let channel = buffer.floatChannelData?[0] else {
            return nil
        }

        let frameCount = min(Int(buffer.frameLength), sampleCount)
        guard frameCount > 0 else {
            return nil
        }

        var samples = Array(UnsafeBufferPointer(start: channel, count: frameCount))
        if samples.count < sampleCount {
            samples.append(contentsOf: repeatElement(0, count: sampleCount - samples.count))
        }

        let magnitudes = analyzer.magnitudes(for: samples)

        return AudioFeatureExtractor.extract(
            frequencyMagnitudes: magnitudes,
            timeDomainSamples: samples,
            sampleRate: Float(buffer.format.sampleRate)
        )
    }
}
