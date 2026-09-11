import Foundation

/// An opening message Today hands to the Coach tab.
///
/// Two of Today's routes carry a prompt the **server** wrote — `GoalProgressRow.prompt` and
/// `TodayLearningCard.prompt` — and the learning ones also carry the record and version the
/// conversation is about (FLOWS.md §4 step 5, §5 step 8, §7 step 5). The prompt is inserted
/// into the composer and never sent: the person edits it or deletes it (DESIGN.md §4.16).
nonisolated struct TodayCoachPrompt: Equatable, Sendable {
    let prompt: String
    var goalId: String?
    /// The learning record this conversation is about, when there is one.
    var recordId: String?
    /// The learning version the prompt quotes.
    var version: Int?

    init(prompt: String, goalId: String? = nil, recordId: String? = nil, version: Int? = nil) {
        self.prompt = prompt
        self.goalId = goalId
        self.recordId = recordId
        self.version = version
    }
}

/// Today reuses the Goals feature's `CoachHandoff` mailbox (`Features/Goals/CoachHandoff.swift`)
/// so there is one way into the coach, and adds the two identifiers a learning conversation
/// needs.
///
/// **Coach agent**: `CoachHandoff.take()` returns the prompt and goal as before. Call
/// ``CoachHandoff/takeRecordContext()`` alongside it and, when it returns a value, send
/// `recordId` and `version` in the `POST /api/coach` body so the turn is attached to the saved
/// record rather than starting a fresh, unanchored discussion.
extension CoachHandoff {
    static let recordKey = "adler.coachPrefillRecordId"
    static let recordVersionKey = "adler.coachPrefillRecordVersion"

    static func open(_ router: AppRouter, _ prompt: TodayCoachPrompt) {
        let defaults = UserDefaults.standard
        if let recordId = prompt.recordId {
            defaults.set(recordId, forKey: recordKey)
            defaults.set(prompt.version ?? 0, forKey: recordVersionKey)
        } else {
            defaults.removeObject(forKey: recordKey)
            defaults.removeObject(forKey: recordVersionKey)
        }
        open(router, prompt: prompt.prompt, goalId: prompt.goalId)
    }

    /// Returns the learning record context once and forgets it.
    static func takeRecordContext() -> (recordId: String, version: Int)? {
        let defaults = UserDefaults.standard
        guard let recordId = defaults.string(forKey: recordKey), !recordId.isEmpty else {
            return nil
        }
        let version = defaults.integer(forKey: recordVersionKey)
        defaults.removeObject(forKey: recordKey)
        defaults.removeObject(forKey: recordVersionKey)
        return (recordId, version)
    }
}
