import AppKit
import Foundation
import OscilloCore

@MainActor
final class UpdateController: ObservableObject {
    @Published private(set) var isChecking = false
    @Published private(set) var statusText = "No update check yet."
    @Published private(set) var releaseURL: URL?

    private let service: GitHubUpdateService

    init(service: GitHubUpdateService = GitHubUpdateService()) {
        self.service = service
    }

    func checkNow() {
        guard !isChecking else { return }

        isChecking = true
        statusText = "Checking GitHub Releases..."
        releaseURL = nil

        Task {
            defer { isChecking = false }

            do {
                let result = try await service.checkForUpdates(
                    currentVersionString: Bundle.main.infoDictionary?["CFBundleShortVersionString"] as? String ?? "0.1.0"
                )
                apply(result)
            } catch {
                statusText = "Update check failed: \(error.localizedDescription)"
            }
        }
    }

    func openReleasePage() {
        guard let releaseURL else { return }
        NSWorkspace.shared.open(releaseURL)
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
