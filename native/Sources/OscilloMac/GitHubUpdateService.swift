import Foundation
import OscilloCore

struct AvailableUpdate: Equatable {
    let version: AppVersion
    let tagName: String
    let releaseURL: URL
    let downloadURL: URL?
}

enum UpdateCheckResult: Equatable {
    case noRelease
    case current
    case updateAvailable(AvailableUpdate)
}

enum GitHubUpdateServiceError: Error {
    case invalidResponse
    case invalidCurrentVersion
}

final class GitHubUpdateService: @unchecked Sendable {
    private let releaseURL = URL(string: "https://api.github.com/repos/zachyzissou/Oscillo/releases/latest")!
    private let session: URLSession

    init(session: URLSession = .shared) {
        self.session = session
    }

    func checkForUpdates(currentVersionString: String) async throws -> UpdateCheckResult {
        guard let currentVersion = AppVersion(currentVersionString) else {
            throw GitHubUpdateServiceError.invalidCurrentVersion
        }

        var request = URLRequest(url: releaseURL)
        request.setValue("application/vnd.github+json", forHTTPHeaderField: "Accept")
        request.setValue("OscilloNative", forHTTPHeaderField: "User-Agent")

        let (data, response) = try await session.data(for: request)
        guard let httpResponse = response as? HTTPURLResponse else {
            throw GitHubUpdateServiceError.invalidResponse
        }

        if httpResponse.statusCode == 404 {
            return .noRelease
        }

        guard 200..<300 ~= httpResponse.statusCode else {
            throw GitHubUpdateServiceError.invalidResponse
        }

        let release = try JSONDecoder().decode(GitHubRelease.self, from: data)
        guard let remoteVersion = AppVersion(release.tagName) else {
            return .current
        }

        guard remoteVersion > currentVersion else {
            return .current
        }

        return .updateAvailable(AvailableUpdate(
            version: remoteVersion,
            tagName: release.tagName,
            releaseURL: release.htmlURL,
            downloadURL: release.assets.first { asset in
                asset.name.hasSuffix(".zip") && asset.name.contains("Oscillo-macOS")
            }?.browserDownloadURL
        ))
    }
}

private struct GitHubRelease: Decodable {
    let tagName: String
    let htmlURL: URL
    let assets: [GitHubReleaseAsset]

    enum CodingKeys: String, CodingKey {
        case tagName = "tag_name"
        case htmlURL = "html_url"
        case assets
    }
}

private struct GitHubReleaseAsset: Decodable {
    let name: String
    let browserDownloadURL: URL

    enum CodingKeys: String, CodingKey {
        case name
        case browserDownloadURL = "browser_download_url"
    }
}
