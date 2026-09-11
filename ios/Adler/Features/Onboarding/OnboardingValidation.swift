import Foundation

/// What the client checks before it spends a request, and nothing more.
///
/// The server owns the wording of every failure (`server/api.ts` `credentials`): username 3–80
/// characters matching `[a-zA-Z0-9_.@-]+`, password 10–200. These rules exist only so the
/// primary button is disabled while the request is certain to be refused — the person still
/// reads the server's own sentence when a request is refused for any other reason (taken
/// username, wrong password, rate limit).
nonisolated enum OnboardingValidation {
    static let usernameMinimum = 3
    static let usernameMaximum = 80
    static let passwordMinimum = 10
    static let passwordMaximum = 200

    /// The server trims the username before validating, so the client compares the trimmed form.
    static func normalisedUsername(_ raw: String) -> String {
        raw.trimmingCharacters(in: .whitespacesAndNewlines)
    }

    static func isUsernameAcceptable(_ raw: String) -> Bool {
        let username = normalisedUsername(raw)
        guard (usernameMinimum...usernameMaximum).contains(username.count) else { return false }
        let allowed = CharacterSet(charactersIn: "abcdefghijklmnopqrstuvwxyz")
            .union(CharacterSet(charactersIn: "ABCDEFGHIJKLMNOPQRSTUVWXYZ"))
            .union(CharacterSet(charactersIn: "0123456789"))
            .union(CharacterSet(charactersIn: "_.@-"))
        return username.unicodeScalars.allSatisfy { allowed.contains($0) }
    }

    /// The password is never trimmed: a trailing space is a character the person chose.
    static func isPasswordAcceptable(_ password: String) -> Bool {
        (passwordMinimum...passwordMaximum).contains(password.count)
    }

    static func canSubmit(username: String, password: String) -> Bool {
        isUsernameAcceptable(username) && isPasswordAcceptable(password)
    }

    /// Whether the goal draft is long enough to send.
    static func isGoalAcceptable(_ text: String) -> Bool {
        !text.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty
    }

    /// The counter is announced only inside the last 100 characters (DESIGN.md §5.2).
    static func remainingCharactersToAnnounce(
        _ text: String, limit: Int = OnboardingCopy.goalCharacterLimit
    ) -> Int? {
        let remaining = limit - text.count
        guard remaining <= 100 else { return nil }
        return max(0, remaining)
    }
}
