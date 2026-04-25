import AppKit
import Foundation
import OscilloCore
import Sparkle

@MainActor
final class UpdateController: ObservableObject {
    @Published private(set) var isChecking = false
    @Published private(set) var statusText = "No update check yet."
    @Published private(set) var releaseURL: URL?

    private let service: GitHubUpdateService
    private let sparkleUpdaterController: SPUStandardUpdaterController
    private var launchUpdateCheckPolicy = LaunchUpdateCheckPolicy()

    init(
        service: GitHubUpdateService = GitHubUpdateService(),
        sparkleUpdaterController: SPUStandardUpdaterController = SPUStandardUpdaterController(
            startingUpdater: true,
            updaterDelegate: nil,
            userDriverDelegate: nil
        )
    ) {
        self.service = service
        self.sparkleUpdaterController = sparkleUpdaterController
    }

    func checkNow() {
        statusText = "Opening in-app update check..."
        releaseURL = nil
        installUpdates()
    }

    func installUpdates() {
        sparkleUpdaterController.checkForUpdates(nil)
    }

    func checkAutomaticallyOnLaunch() {
        guard launchUpdateCheckPolicy.shouldStartAutomaticCheck() else {
            return
        }

        startCheck(
            statusText: "Checking for updates...",
            failurePrefix: "Automatic update check failed"
        )
    }

    private func startCheck(statusText: String, failurePrefix: String) {
        guard !isChecking else { return }

        isChecking = true
        self.statusText = statusText
        releaseURL = nil

        Task {
            defer { isChecking = false }

            do {
                let result = try await service.checkForUpdates(
                    currentVersionString: Self.bundleShortVersion
                )
                apply(result)
            } catch {
                self.statusText = "\(failurePrefix): \(error.localizedDescription)"
            }
        }
    }

    func openReleasePage() {
        guard let releaseURL else { return }
        NSWorkspace.shared.open(releaseURL)
    }

    private static var bundleShortVersion: String {
        Bundle.main.infoDictionary?["CFBundleShortVersionString"] as? String ?? ""
    }

    private func apply(_ result: UpdateCheckResult) {
        switch result {
        case .noRelease:
            statusText = "No native release has been published yet."
        case .current:
            statusText = "You are running the latest published native build."
        case .updateAvailable(let update):
            releaseURL = update.releaseURL
            if update.downloadURL != nil {
                statusText = "Update \(update.tagName) is available."
            } else {
                statusText = "Update \(update.tagName) is available, but no macOS zip asset was found."
            }
        }
    }
}
