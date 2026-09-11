import Foundation
import os

/// A small on-disk cache of the last successfully loaded views, so a cold start renders real
/// content instead of a blank tab. Everything it returns is marked **stale** until the matching
/// network load lands: cached numbers are last-known, not current (DESIGN.md §4.20).
///
/// It lives in `Caches/`, which the system may purge; that is fine, the app just refetches.
///
/// **Scoped by account.** Files live under `Caches/AdlerViews/<user id>/`, and the scope is
/// remembered across launches so `restoreFromCache()` — which runs before anyone knows who is
/// signed in — reads the right person's views and nobody else's. `clear()` removes every scope.
actor ViewCache {
    private let root: URL?
    private let scopeDefaultsKey: String
    private let defaults: UserDefaults
    private let fileManager = FileManager.default
    private let encoder = JSONEncoder()
    private let decoder = JSONDecoder()
    private let logger = Logger(subsystem: "com.withadler.app", category: "cache")

    /// The account whose views are cached, or `nil` when nobody is signed in.
    private(set) var scope: String?

    init(directoryName: String = "AdlerViews", defaults: UserDefaults = .standard) {
        root = FileManager.default
            .urls(for: .cachesDirectory, in: .userDomainMask).first?
            .appending(path: directoryName, directoryHint: .isDirectory)
        self.defaults = defaults
        scopeDefaultsKey = "adler.cacheScope.\(directoryName)"
        scope = defaults.string(forKey: scopeDefaultsKey)
    }

    /// Points the cache at one account. Switching accounts deletes what the previous one wrote:
    /// a session that ended without a `logout()` (an expired cookie, say) must not leave a
    /// readable workspace behind for whoever signs in next.
    func use(scope newScope: String?) {
        guard newScope != scope else { return }
        if scope != nil { removeEverything() }
        scope = newScope
        if let newScope {
            defaults.set(newScope, forKey: scopeDefaultsKey)
        } else {
            defaults.removeObject(forKey: scopeDefaultsKey)
        }
    }

    private var directory: URL? {
        guard let root else { return nil }
        guard let scope else { return root }
        return root.appending(path: Self.safe(scope), directoryHint: .isDirectory)
    }

    private func ensureDirectory() -> URL? {
        guard let directory else { return nil }
        if !fileManager.fileExists(atPath: directory.path(percentEncoded: false)) {
            try? fileManager.createDirectory(at: directory, withIntermediateDirectories: true)
        }
        return directory
    }

    private static func safe(_ key: String) -> String {
        key.unicodeScalars.map {
            CharacterSet.alphanumerics.contains($0) || $0 == "-" || $0 == "_"
                ? String($0) : "%\(String($0.value, radix: 16))"
        }.joined()
    }

    private func file(for key: String) -> URL? {
        ensureDirectory()?.appending(path: "\(Self.safe(key)).json")
    }

    func load<Value: Decodable & Sendable>(_ type: Value.Type, key: String) -> Value? {
        guard let url = file(for: key), let data = try? Data(contentsOf: url) else { return nil }
        return try? decoder.decode(Value.self, from: data)
    }

    func save<Value: Encodable & Sendable>(_ value: Value, key: String) {
        guard let url = file(for: key), let data = try? encoder.encode(value) else { return }
        do {
            try data.write(to: url, options: .atomic)
        } catch {
            logger.debug("cache write failed for \(key, privacy: .public)")
        }
    }

    func remove(key: String) {
        guard let url = file(for: key) else { return }
        try? fileManager.removeItem(at: url)
    }

    /// Called on sign-out: a cached workspace must not outlive the session that produced it.
    /// Every scope goes, not only the current one.
    func clear() {
        removeEverything()
        scope = nil
        defaults.removeObject(forKey: scopeDefaultsKey)
    }

    private func removeEverything() {
        guard let root else { return }
        try? fileManager.removeItem(at: root)
    }
}
