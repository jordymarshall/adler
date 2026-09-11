import Foundation

/// Goal-first onboarding: the person types what they want to achieve **before** they have an
/// account, so the text has to survive register/login and a cold launch. It is also where a
/// deep link waits while someone signs in (FLOWS.md §12 step 8).
@MainActor
@Observable
final class PendingDraft {
    static let goalKey = "adler.firstGoal"
    static let routeKey = "adler.pendingRoute"

    private let defaults: UserDefaults

    init(defaults: UserDefaults = .standard) {
        self.defaults = defaults
        text = defaults.string(forKey: Self.goalKey) ?? ""
        pendingRoute = defaults.string(forKey: Self.routeKey).flatMap(AppRoute.init(string:))
    }

    /// Persisted on every keystroke.
    var text: String {
        didSet {
            if text.isEmpty {
                defaults.removeObject(forKey: Self.goalKey)
            } else {
                defaults.set(text, forKey: Self.goalKey)
            }
        }
    }

    var hasText: Bool { !text.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty }

    /// The opening message for `POST /api/coach` after sign-in, per FLOWS.md §1 step 9.
    var coachOpening: String? {
        let trimmed = text.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmed.isEmpty else { return nil }
        return "Help me develop this goal and a plan around how I work: \(trimmed)"
    }

    /// Only after the message was accepted — never before.
    func clear() {
        text = ""
    }

    // MARK: - Deferred deep link

    var pendingRoute: AppRoute? {
        didSet {
            if let pendingRoute {
                defaults.set(pendingRoute.url.absoluteString, forKey: Self.routeKey)
            } else {
                defaults.removeObject(forKey: Self.routeKey)
            }
        }
    }

    /// Returns the stored route once and forgets it.
    func takePendingRoute() -> AppRoute? {
        defer { pendingRoute = nil }
        return pendingRoute
    }
}
