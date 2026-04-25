import OscilloCore
import SwiftUI

struct ContentView: View {
    @ObservedObject var audioEngine: LiveAudioEngine
    @ObservedObject var sceneController: SceneController
    @StateObject private var updateController = UpdateController()

    var body: some View {
        ZStack {
            OscilloMetalSurface(
                featureStore: audioEngine.featureStore,
                settingsStore: sceneController.settingsStore,
                isActive: audioEngine.isRunning || audioEngine.isPreviewing
            )
            .ignoresSafeArea()

            LinearGradient(
                colors: [
                    SignalTheme.voidBlack.opacity(0.72),
                    .clear,
                    SignalTheme.voidBlack.opacity(0.54)
                ],
                startPoint: .leading,
                endPoint: .trailing
            )
            .allowsHitTesting(false)
            .ignoresSafeArea()

            GeometryReader { proxy in
                InstrumentOverlayLayout(
                    audioEngine: audioEngine,
                    sceneController: sceneController,
                    updateController: updateController,
                    availableSize: proxy.size
                )
            }
        }
        .background(SignalTheme.voidBlack)
        .task {
            audioEngine.startPreview()
            updateController.checkAutomaticallyOnLaunch()
        }
    }
}

private struct InstrumentOverlayLayout: View {
    @ObservedObject var audioEngine: LiveAudioEngine
    @ObservedObject var sceneController: SceneController
    @ObservedObject var updateController: UpdateController
    let availableSize: CGSize

    private let edgePadding: CGFloat = 18
    private let controlRailWidth: CGFloat = 302
    private let overlayGap: CGFloat = 14
    private let minimumRailHeight: CGFloat = 360

    var body: some View {
        if usesCompactLayout {
            compactLayout
        } else {
            performanceLayout
        }
    }

    private var usesCompactLayout: Bool {
        availableSize.width < 980 || availableSize.height < 620
    }

    private var railMaxHeight: CGFloat {
        max(
            minimumRailHeight,
            availableSize.height - edgePadding * 2 - BottomSignalConsole.minimumHeight - overlayGap
        )
    }

    private var compactWidth: CGFloat {
        min(controlRailWidth, max(260, availableSize.width - edgePadding * 2))
    }

    private var performanceLayout: some View {
        VStack(alignment: .leading, spacing: overlayGap) {
            HStack(alignment: .top, spacing: overlayGap) {
                InstrumentSpine(
                    audioEngine: audioEngine,
                    sceneController: sceneController,
                    updateController: updateController
                )
                .frame(width: controlRailWidth)
                .frame(maxHeight: railMaxHeight, alignment: .topLeading)

                Spacer(minLength: 24)
            }

            Spacer(minLength: 0)

            HStack(alignment: .bottom, spacing: overlayGap) {
                Color.clear
                    .frame(width: controlRailWidth)

                BottomSignalConsole(audioEngine: audioEngine, sceneController: sceneController)
                    .frame(maxWidth: .infinity, alignment: .bottom)
            }
        }
        .padding(edgePadding)
    }

    private var compactLayout: some View {
        ScrollView(.vertical) {
            VStack(alignment: .leading, spacing: overlayGap) {
                InstrumentSpine(
                    audioEngine: audioEngine,
                    sceneController: sceneController,
                    updateController: updateController,
                    scrollsInternally: false
                )
                .frame(width: compactWidth)

                BottomSignalConsole(audioEngine: audioEngine, sceneController: sceneController)
                    .frame(width: max(260, availableSize.width - edgePadding * 2), alignment: .leading)
            }
            .padding(edgePadding)
            .frame(maxWidth: .infinity, alignment: .leading)
        }
        .scrollIndicators(.never)
    }
}

private struct InstrumentSpine: View {
    @ObservedObject var audioEngine: LiveAudioEngine
    @ObservedObject var sceneController: SceneController
    @ObservedObject var updateController: UpdateController
    var scrollsInternally = true
    private let buildMetadata = AppBuildMetadata(bundleInfo: Bundle.main.infoDictionary ?? [:])

    var body: some View {
        Group {
            if scrollsInternally {
                ScrollView(.vertical) {
                    spineContent
                }
                .scrollIndicators(.never)
            } else {
                spineContent
            }
        }
        .frame(alignment: .topLeading)
        .signalPanel(cornerRadius: 10)
    }

    private var spineContent: some View {
        VStack(alignment: .leading, spacing: 14) {
                VStack(alignment: .leading, spacing: 6) {
                    HStack(alignment: .firstTextBaseline) {
                        Text("OSCILLO")
                            .font(.system(size: 22, weight: .black, design: .rounded))
                            .foregroundStyle(SignalTheme.softWhite)
                        Spacer(minLength: 12)
                        Text(buildMetadata.visibleBuildMarker.uppercased())
                            .font(.system(size: 10, weight: .semibold, design: .monospaced))
                            .foregroundStyle(SignalTheme.mutedSteel)
                    }

                    Text(sceneController.settings.sceneMode.displayName.uppercased())
                        .font(.system(size: 11, weight: .semibold, design: .monospaced))
                        .foregroundStyle(SignalTheme.signalTeal)

                    Text(audioEngine.statusMessage)
                        .font(.system(size: 11, weight: .medium, design: .monospaced))
                        .foregroundStyle(SignalTheme.mutedSteel)
                        .lineLimit(2)
                }

                Divider()
                    .overlay(SignalTheme.gridLine.opacity(0.9))

                VStack(alignment: .leading, spacing: 8) {
                    ModuleLabel("INPUT")
                    HStack(spacing: 8) {
                        SignalActionButton(
                            title: audioEngine.isRunning ? "STOP" : "MIC",
                            systemImage: audioEngine.isRunning ? "stop.fill" : "waveform",
                            isActive: audioEngine.isRunning,
                            action: toggleMicrophone
                        )

                        SignalActionButton(
                            title: audioEngine.isPreviewing ? "PAUSE" : "PREVIEW",
                            systemImage: audioEngine.isPreviewing ? "pause.fill" : "play.fill",
                            isActive: audioEngine.isPreviewing,
                            action: togglePreview
                        )
                    }
                }

                VStack(alignment: .leading, spacing: 8) {
                    ModuleLabel("SCENE")
                    LazyVGrid(columns: [
                        GridItem(.flexible(), spacing: 6),
                        GridItem(.flexible(), spacing: 6)
                    ], spacing: 6) {
                        ForEach(SceneMode.allCases) { mode in
                            SceneModePill(
                                mode: mode,
                                isSelected: mode == sceneController.settings.sceneMode
                            ) {
                                sceneController.setSceneMode(mode)
                            }
                        }
                    }
                }

                VStack(alignment: .leading, spacing: 8) {
                    ModuleLabel("PALETTE")
                    Picker("Palette", selection: Binding(
                        get: { sceneController.settings.palette },
                        set: { sceneController.setPalette($0) }
                    )) {
                        ForEach(ScenePalette.allCases) { palette in
                            Text(palette.displayName).tag(palette)
                        }
                    }
                    .pickerStyle(.segmented)
                    .controlSize(.small)
                }

                VStack(spacing: 12) {
                    SignalSlider(
                        title: "INTENSITY",
                        value: Binding(
                            get: { sceneController.settings.visualGain },
                            set: { sceneController.setVisualGain($0) }
                        ),
                        range: 0.25...2.0,
                        accent: SignalTheme.signalTeal
                    )

                    SignalSlider(
                        title: "PARTICLES",
                        value: Binding(
                            get: { sceneController.settings.particleDensity },
                            set: { sceneController.setParticleDensity($0) }
                        ),
                        range: 0.15...1.5,
                        accent: SignalTheme.transientCoral
                    )

                    SignalSlider(
                        title: "TEMPO",
                        value: Binding(
                            get: { sceneController.settings.previewTempo },
                            set: { sceneController.setPreviewTempo($0) }
                        ),
                        range: 0.5...2.0,
                        accent: SignalTheme.warmPeak
                    )
                }

                Divider()
                    .overlay(SignalTheme.gridLine.opacity(0.9))

                UpdateRackModule(updateController: updateController)
        }
        .padding(16)
    }

    private func toggleMicrophone() {
        if audioEngine.isRunning {
            audioEngine.stopMicrophone()
        } else {
            audioEngine.startMicrophone()
        }
    }

    private func togglePreview() {
        if audioEngine.isPreviewing {
            audioEngine.stopPreview(resetFeatures: true)
        } else {
            audioEngine.startPreview()
        }
    }
}

private struct BottomSignalConsole: View {
    static let minimumHeight: CGFloat = 96

    @ObservedObject var audioEngine: LiveAudioEngine
    @ObservedObject var sceneController: SceneController

    var body: some View {
        ViewThatFits(in: .horizontal) {
            expandedConsole
            compactConsole
        }
        .padding(.horizontal, 16)
        .padding(.vertical, 12)
        .frame(maxWidth: .infinity, minHeight: Self.minimumHeight, alignment: .leading)
        .signalPanel(cornerRadius: 12)
    }

    private var expandedConsole: some View {
        HStack(alignment: .center, spacing: 18) {
            consoleTitle
                .frame(width: 190, alignment: .leading)

            meterBank

            Divider()
                .frame(height: 62)
                .overlay(SignalTheme.gridLine)

            Spacer(minLength: 12)

            statusBadges
        }
    }

    private var compactConsole: some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack(alignment: .firstTextBaseline, spacing: 12) {
                consoleTitle
                Spacer(minLength: 12)
                SignalBadge(sceneController.settings.sceneMode.shortName)
            }

            meterBank
            statusBadges
        }
    }

    private var consoleTitle: some View {
        VStack(alignment: .leading, spacing: 6) {
            Text("SIGNAL CONSOLE")
                .font(.system(size: 11, weight: .bold, design: .monospaced))
                .foregroundStyle(SignalTheme.signalTeal)
            Text(sceneController.settings.sceneMode.displayName)
                .font(.system(size: 18, weight: .semibold, design: .rounded))
                .foregroundStyle(SignalTheme.softWhite)
                .lineLimit(1)
                .minimumScaleFactor(0.78)
        }
    }

    private var meterBank: some View {
        HStack(spacing: 12) {
            HardwareMeter(title: "LVL", value: audioEngine.features.volume, accent: SignalTheme.meterGreen)
            HardwareMeter(title: "BASS", value: audioEngine.features.bassEnergy, accent: SignalTheme.signalTeal)
            HardwareMeter(title: "MID", value: audioEngine.features.midEnergy, accent: SignalTheme.oscillatorCyan)
            HardwareMeter(title: "HI", value: audioEngine.features.trebleEnergy, accent: SignalTheme.warmPeak)
        }
    }

    private var statusBadges: some View {
        HStack(spacing: 8) {
            SignalBadge("METAL LIVE")
            SignalBadge("QUALITY AUTO")
            SignalBadge("OUTPUT LIVE")
        }
    }
}

private struct SignalSlider: View {
    let title: String
    @Binding var value: Float
    let range: ClosedRange<Float>
    let accent: Color

    var body: some View {
        VStack(alignment: .leading, spacing: 6) {
            HStack {
                Text(title)
                Spacer()
                Text(value.formatted(.number.precision(.fractionLength(2))))
                    .monospacedDigit()
            }
            .font(.system(size: 10, weight: .bold, design: .monospaced))
            .foregroundStyle(SignalTheme.mutedSteel)

            GeometryReader { proxy in
                ZStack(alignment: .leading) {
                    RoundedRectangle(cornerRadius: 2)
                        .fill(SignalTheme.raisedGraphite)
                    RoundedRectangle(cornerRadius: 2)
                        .fill(accent)
                        .frame(width: proxy.size.width * normalizedValue)
                    RoundedRectangle(cornerRadius: 2)
                        .stroke(SignalTheme.gridLine, lineWidth: 1)
                }
            }
            .frame(height: 6)

            Slider(
                value: Binding(
                    get: { Double(value) },
                    set: { value = Float($0) }
                ),
                in: Double(range.lowerBound)...Double(range.upperBound)
            )
            .controlSize(.small)
            .tint(accent)
        }
    }

    private var normalizedValue: CGFloat {
        let span = range.upperBound - range.lowerBound
        guard span > 0 else { return 0 }
        return CGFloat((value - range.lowerBound) / span)
    }
}

private struct HardwareMeter: View {
    let title: String
    let value: Float
    let accent: Color

    var body: some View {
        VStack(spacing: 5) {
            HStack(spacing: 3) {
                ForEach(0..<12, id: \.self) { index in
                    RoundedRectangle(cornerRadius: 1)
                        .fill(segmentColor(index: index))
                        .frame(width: 7, height: 26)
                }
            }

            HStack(spacing: 5) {
                Text(title)
                    .font(.system(size: 10, weight: .bold, design: .monospaced))
                Text(value.formatted(.number.precision(.fractionLength(2))))
                    .font(.system(size: 10, weight: .medium, design: .monospaced))
                    .monospacedDigit()
                    .foregroundStyle(SignalTheme.mutedSteel)
            }
        }
        .frame(width: 108)
        .foregroundStyle(SignalTheme.softWhite)
    }

    private func segmentColor(index: Int) -> Color {
        let normalized = CGFloat(min(max(value, 0), 1))
        let threshold = CGFloat(index + 1) / 12.0
        guard normalized >= threshold else {
            return SignalTheme.panelCarbon
        }
        if index > 9 {
            return SignalTheme.transientCoral
        }
        if index > 7 {
            return SignalTheme.warmPeak
        }
        return accent
    }
}

private struct SceneModePill: View {
    let mode: SceneMode
    let isSelected: Bool
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            Text(mode.shortName.uppercased())
                .font(.system(size: 10, weight: .bold, design: .monospaced))
                .frame(maxWidth: .infinity)
                .padding(.vertical, 7)
        }
        .buttonStyle(.plain)
        .foregroundStyle(isSelected ? SignalTheme.voidBlack : SignalTheme.mutedSteel)
        .background(isSelected ? SignalTheme.signalTeal : SignalTheme.raisedGraphite, in: RoundedRectangle(cornerRadius: 5))
        .overlay(
            RoundedRectangle(cornerRadius: 5)
                .stroke(isSelected ? SignalTheme.signalTeal : SignalTheme.gridLine, lineWidth: 1)
        )
    }
}

private struct SignalActionButton: View {
    let title: String
    let systemImage: String
    let isActive: Bool
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            Label(title, systemImage: systemImage)
                .font(.system(size: 11, weight: .bold, design: .monospaced))
                .labelStyle(.titleAndIcon)
                .frame(maxWidth: .infinity)
                .padding(.vertical, 8)
                .padding(.horizontal, 9)
        }
        .buttonStyle(.plain)
        .foregroundStyle(isActive ? SignalTheme.voidBlack : SignalTheme.softWhite)
        .background(isActive ? SignalTheme.signalTeal : SignalTheme.raisedGraphite, in: RoundedRectangle(cornerRadius: 7))
        .overlay(
            RoundedRectangle(cornerRadius: 7)
                .stroke(isActive ? SignalTheme.signalTeal : SignalTheme.gridLine, lineWidth: 1)
        )
    }
}

private struct UpdateRackModule: View {
    @ObservedObject var updateController: UpdateController

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            ModuleLabel("RELEASE")
            HStack(spacing: 8) {
                SignalActionButton(
                    title: updateController.isChecking ? "CHECKING" : "CHECK",
                    systemImage: "arrow.triangle.2.circlepath",
                    isActive: updateController.isChecking
                ) {
                    updateController.checkNow()
                }
                .disabled(updateController.isChecking)

                SignalActionButton(
                    title: "OPEN",
                    systemImage: "arrow.up.forward.app",
                    isActive: updateController.releaseURL != nil
                ) {
                    updateController.openReleasePage()
                }
                .disabled(updateController.releaseURL == nil)
            }

            Text(updateController.statusText)
                .font(.system(size: 10, weight: .medium, design: .monospaced))
                .foregroundStyle(SignalTheme.mutedSteel)
                .fixedSize(horizontal: false, vertical: true)
        }
    }
}

private struct SignalBadge: View {
    let text: String

    init(_ text: String) {
        self.text = text
    }

    var body: some View {
        Text(text.uppercased())
            .font(.system(size: 10, weight: .bold, design: .monospaced))
            .foregroundStyle(SignalTheme.signalTeal)
            .padding(.horizontal, 9)
            .padding(.vertical, 5)
            .background(SignalTheme.panelCarbon, in: RoundedRectangle(cornerRadius: 5))
            .overlay(
                RoundedRectangle(cornerRadius: 5)
                    .stroke(SignalTheme.gridLine, lineWidth: 1)
            )
    }
}

private struct ModuleLabel: View {
    let title: String

    init(_ title: String) {
        self.title = title
    }

    var body: some View {
        Text(title)
            .font(.system(size: 10, weight: .bold, design: .monospaced))
            .foregroundStyle(SignalTheme.mutedSteel)
            .tracking(1.2)
    }
}

private extension View {
    func signalPanel(cornerRadius: CGFloat) -> some View {
        background(
            SignalTheme.panelCarbon.opacity(0.82),
            in: RoundedRectangle(cornerRadius: cornerRadius, style: .continuous)
        )
        .overlay(
            RoundedRectangle(cornerRadius: cornerRadius, style: .continuous)
                .stroke(SignalTheme.gridLine.opacity(0.92), lineWidth: 1)
        )
        .shadow(color: SignalTheme.signalTeal.opacity(0.12), radius: 28, x: 0, y: 18)
    }
}

private enum SignalTheme {
    static let voidBlack = Color(red: 0.02, green: 0.025, blue: 0.035)
    static let panelCarbon = Color(red: 0.045, green: 0.052, blue: 0.065)
    static let raisedGraphite = Color(red: 0.078, green: 0.094, blue: 0.122)
    static let gridLine = Color(red: 0.18, green: 0.23, blue: 0.28)
    static let signalTeal = Color(red: 0.13, green: 0.90, blue: 0.76)
    static let oscillatorCyan = Color(red: 0.22, green: 0.74, blue: 0.97)
    static let transientCoral = Color(red: 1.0, green: 0.30, blue: 0.43)
    static let warmPeak = Color(red: 0.97, green: 0.84, blue: 0.43)
    static let meterGreen = Color(red: 0.49, green: 1.0, blue: 0.42)
    static let softWhite = Color(red: 0.95, green: 0.97, blue: 0.98)
    static let mutedSteel = Color(red: 0.60, green: 0.66, blue: 0.71)
}
