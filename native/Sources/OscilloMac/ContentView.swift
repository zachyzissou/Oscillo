import OscilloCore
import SwiftUI

struct ContentView: View {
    @ObservedObject var audioEngine: LiveAudioEngine
    @ObservedObject var sceneController: SceneController
    @StateObject private var updateController = UpdateController()

    var body: some View {
        ZStack(alignment: .topLeading) {
            OscilloMetalSurface(
                featureStore: audioEngine.featureStore,
                settingsStore: sceneController.settingsStore,
                isActive: audioEngine.isRunning || audioEngine.isPreviewing
            )
            .ignoresSafeArea()

            ControlPanel(
                audioEngine: audioEngine,
                sceneController: sceneController,
                updateController: updateController
            )
                .padding(18)
        }
        .task {
            audioEngine.startPreview()
            updateController.checkAutomaticallyOnLaunch()
        }
    }
}

private struct ControlPanel: View {
    @ObservedObject var audioEngine: LiveAudioEngine
    @ObservedObject var sceneController: SceneController
    @ObservedObject var updateController: UpdateController

    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            VStack(alignment: .leading, spacing: 4) {
                Text("Oscillo")
                    .font(.system(size: 20, weight: .semibold, design: .rounded))
                Text(audioEngine.statusMessage)
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }

            HStack(spacing: 10) {
                Button(audioEngine.isRunning ? "Stop Input" : "Use Microphone") {
                    if audioEngine.isRunning {
                        audioEngine.stopMicrophone()
                    } else {
                        audioEngine.startMicrophone()
                    }
                }
                .buttonStyle(.borderedProminent)

                Button(audioEngine.isPreviewing ? "Pause Preview" : "Preview") {
                    if audioEngine.isPreviewing {
                        audioEngine.stopPreview(resetFeatures: true)
                    } else {
                        audioEngine.startPreview()
                    }
                }
                .buttonStyle(.bordered)
            }

            Picker("Palette", selection: Binding(
                get: { sceneController.settings.palette },
                set: { sceneController.setPalette($0) }
            )) {
                ForEach(ScenePalette.allCases) { palette in
                    Text(palette.displayName).tag(palette)
                }
            }
            .pickerStyle(.segmented)

            ControlSlider(
                title: "Intensity",
                value: Binding(
                    get: { sceneController.settings.visualGain },
                    set: { sceneController.setVisualGain($0) }
                ),
                range: 0.25...2.0
            )

            ControlSlider(
                title: "Particles",
                value: Binding(
                    get: { sceneController.settings.particleDensity },
                    set: { sceneController.setParticleDensity($0) }
                ),
                range: 0.15...1.5
            )

            ControlSlider(
                title: "Preview Tempo",
                value: Binding(
                    get: { sceneController.settings.previewTempo },
                    set: { sceneController.setPreviewTempo($0) }
                ),
                range: 0.5...2.0
            )

            Divider()
                .overlay(.white.opacity(0.16))

            FeatureMeter(title: "Level", value: audioEngine.features.volume)
            FeatureMeter(title: "Bass", value: audioEngine.features.bassEnergy)
            FeatureMeter(title: "Mid", value: audioEngine.features.midEnergy)
            FeatureMeter(title: "Treble", value: audioEngine.features.trebleEnergy)

            Divider()
                .overlay(.white.opacity(0.16))

            VStack(alignment: .leading, spacing: 8) {
                HStack(spacing: 10) {
                    Button(updateController.isChecking ? "Checking..." : "Check Updates") {
                        updateController.checkNow()
                    }
                    .disabled(updateController.isChecking)

                    Button("Open Release") {
                        updateController.openReleasePage()
                    }
                    .disabled(updateController.releaseURL == nil)
                }

                Text(updateController.statusText)
                    .font(.caption)
                    .foregroundStyle(.secondary)
                    .fixedSize(horizontal: false, vertical: true)
            }
        }
        .padding(18)
        .frame(width: 312, alignment: .leading)
        .background(.black.opacity(0.58), in: RoundedRectangle(cornerRadius: 8))
        .overlay(
            RoundedRectangle(cornerRadius: 8)
                .stroke(.white.opacity(0.14), lineWidth: 1)
        )
    }
}

private struct ControlSlider: View {
    let title: String
    @Binding var value: Float
    let range: ClosedRange<Float>

    var body: some View {
        VStack(alignment: .leading, spacing: 6) {
            HStack {
                Text(title)
                Spacer()
                Text(value.formatted(.number.precision(.fractionLength(2))))
                    .monospacedDigit()
                    .foregroundStyle(.secondary)
            }
            .font(.caption)

            Slider(
                value: Binding(
                    get: { Double(value) },
                    set: { value = Float($0) }
                ),
                in: Double(range.lowerBound)...Double(range.upperBound)
            )
        }
        .foregroundStyle(.white)
    }
}

private struct FeatureMeter: View {
    let title: String
    let value: Float

    var body: some View {
        VStack(alignment: .leading, spacing: 5) {
            HStack {
                Text(title)
                Spacer()
                Text(value.formatted(.number.precision(.fractionLength(2))))
                    .monospacedDigit()
            }
            .font(.caption)

            GeometryReader { proxy in
                RoundedRectangle(cornerRadius: 2)
                    .fill(.white.opacity(0.14))
                    .overlay(alignment: .leading) {
                        RoundedRectangle(cornerRadius: 2)
                            .fill(LinearGradient(
                                colors: [.cyan, .pink],
                                startPoint: .leading,
                                endPoint: .trailing
                            ))
                            .frame(width: proxy.size.width * CGFloat(min(max(value, 0), 1)))
                    }
            }
            .frame(height: 5)
        }
        .foregroundStyle(.white)
    }
}
