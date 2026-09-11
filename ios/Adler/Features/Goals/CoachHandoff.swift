import Foundation

/// How the two goal screens hand a conversation over to Coach.
///
/// A new goal, a discussion about an action and "What would make this possible?" all end in the
/// same place: the shared coach, with the composer **pre-filled** and nothing sent. The person
/// edits and sends it themselves (DESIGN.md §4.16 — a quick prompt never sends on their behalf).
///
/// The Coach feature owns the composer, so the opening text is left in `UserDefaults` under the
/// keys below — the same mechanism `PendingDraft` uses for the onboarding goal. Coach reads
/// ``take()`` once the conversation is on screen and clears it.
@MainActor
enum CoachHandoff {
    static let promptKey = "adler.coachPrefill"
    static let goalKey = "adler.coachPrefillGoalId"

    /// Stores the opening text and routes to Coach. `conversationId` opens that thread when the
    /// goal already has one; otherwise Coach opens its own list with the goal in context.
    static func open(
        _ router: AppRouter, prompt: String, goalId: String? = nil, conversationId: String? = nil
    ) {
        store(prompt: prompt, goalId: goalId)
        if let conversationId {
            router.openConversation(id: conversationId)
        } else {
            router.go(.coach(goalId: goalId))
        }
    }

    static func store(prompt: String, goalId: String?) {
        let defaults = UserDefaults.standard
        defaults.set(prompt, forKey: promptKey)
        if let goalId {
            defaults.set(goalId, forKey: goalKey)
        } else {
            defaults.removeObject(forKey: goalKey)
        }
    }

    /// Returns the stored opening once and forgets it.
    static func take() -> (prompt: String, goalId: String?)? {
        let defaults = UserDefaults.standard
        guard let prompt = defaults.string(forKey: promptKey), !prompt.isEmpty else { return nil }
        let goalId = defaults.string(forKey: goalKey)
        defaults.removeObject(forKey: promptKey)
        defaults.removeObject(forKey: goalKey)
        return (prompt, goalId)
    }

    // MARK: - Openings

    /// COPY.md `quick.newGoal`.
    static let newGoal = "I want to start a goal"

    static func discussAction(_ title: String, goal: String) -> String {
        "About “\(title)” for \(goal): "
    }

    static func planFirstAction(goal: String) -> String {
        "Help me choose the first useful work for \(goal)."
    }

    static func projectionHelp(goal: String) -> String {
        "What would make a finish estimate possible for \(goal)?"
    }

    static func milestoneActions(_ milestone: String, goal: String) -> String {
        "Help me plan the actions for “\(milestone)” in \(goal)."
    }
}
