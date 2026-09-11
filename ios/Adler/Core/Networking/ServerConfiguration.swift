import Foundation

/// Where the app talks to. Editable in Settings › Server so a phone on the LAN can reach a Mac
/// running `npm run dev -- --port 8080`, and so the simulator works with no setup at all.
///
/// The server accepts `localhost`, `127.0.0.1`, `[::1]` and — only outside production — RFC1918
/// private IPv4 hosts. Any other `Host` is refused with 403 `Unrecognized host.`
nonisolated struct ServerConfiguration: Sendable, Equatable, Codable {
    var baseURL: URL

    static let defaultBaseURL = URL(string: "http://localhost:8080")!
    static let `default` = ServerConfiguration(baseURL: defaultBaseURL)

    static let storageKey = "adler.serverBaseURL"

    init(baseURL: URL) {
        self.baseURL = baseURL
    }

    /// Accepts a bare host (`192.168.1.24:8080`) as well as a full URL, and drops a trailing slash.
    init?(text: String) {
        let trimmed = text.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmed.isEmpty else { return nil }
        let withScheme =
            trimmed.contains("://") ? trimmed : "http://\(trimmed)"
        var cleaned = withScheme
        while cleaned.hasSuffix("/") { cleaned.removeLast() }
        guard let url = URL(string: cleaned), let scheme = url.scheme, url.host != nil,
            scheme == "http" || scheme == "https"
        else { return nil }
        self.baseURL = url
    }

    static func load(from defaults: UserDefaults = .standard) -> ServerConfiguration {
        guard let stored = defaults.string(forKey: storageKey),
            let configuration = ServerConfiguration(text: stored)
        else { return .default }
        return configuration
    }

    func save(to defaults: UserDefaults = .standard) {
        defaults.set(baseURL.absoluteString, forKey: Self.storageKey)
    }

    var displayText: String { baseURL.absoluteString }

    /// True for a plain-HTTP private/loopback host, which is the only case ATS lets through
    /// via `NSAllowsLocalNetworking`.
    var isLocalNetwork: Bool {
        guard let host = baseURL.host else { return false }
        if host == "localhost" || host == "127.0.0.1" || host == "::1" || host.hasSuffix(".local") {
            return true
        }
        let parts = host.split(separator: ".").compactMap { Int($0) }
        guard parts.count == 4 else { return false }
        if parts[0] == 10 { return true }
        if parts[0] == 192 && parts[1] == 168 { return true }
        if parts[0] == 172 && (16...31).contains(parts[1]) { return true }
        return false
    }
}
