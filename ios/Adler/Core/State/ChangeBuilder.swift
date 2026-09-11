import Foundation

/// Builds the exact `Change` payloads the shared command catalog accepts
/// (`server/commands.ts` `commandCatalog`). Feature code should never hand-write the JSON.
///
/// Two rules this type exists to enforce:
/// 1. **An unknown amount is omitted, never sent as `0`.** `amount: null` means unknown; `0`
///    means measured zero. Sending `0` for "didn't record it" would falsify the input series.
/// 2. **Outcome strings are exactly `Done`, `Partly`, `Didn’t happen`** — the third with the
///    typographic apostrophe (U+2019) `shared/workspace.ts` uses. `Outcome.rawValue` guarantees it.
nonisolated enum ChangeBuilder {

    // MARK: - Actions

    /// Report an action outcome. `Didn’t happen` may legitimately carry `amount: 0` and
    /// `actualMinutes: 0` — pass them explicitly; omitting them leaves the value unknown.
    static func reportAction(
        id: String,
        goalId: String,
        outcome: Outcome,
        amount: Double? = nil,
        minutes: Double? = nil,
        note: String? = nil,
        reason: String? = nil
    ) -> Change {
        // `.unknown` is a decode fallback, not a value the server accepts. `WorkspaceStore`
        // refuses it before it gets here; this is the tripwire if a new caller forgets.
        assert(!outcome.isUnknown, "an unknown Outcome must never be written back to the server")
        var values: [String: JSONValue] = ["outcome": .of(outcome.rawValue)]
        if let amount { values["amount"] = .of(amount) }
        if let minutes { values["actualMinutes"] = .of(minutes) }
        if let note, !note.isEmpty { values["note"] = .of(note) }
        return change(.action, .update, id: id, parentId: goalId, reason: reason, values: values)
    }

    /// Create an action the person chose themselves. An empty `date` means unscheduled.
    static func createAction(
        goalId: String,
        title: String,
        criterion: String,
        timing: String,
        date: YMD?,
        reason: String? = nil
    ) -> Change {
        change(
            .action, .create, id: nil, parentId: goalId, reason: reason,
            values: [
                "title": .of(title), "criterion": .of(criterion), "timing": .of(timing),
                "date": .of(date?.raw ?? ""),
            ])
    }

    static func rescheduleAction(id: String, goalId: String, date: YMD?, reason: String? = nil)
        -> Change
    {
        change(
            .action, .update, id: id, parentId: goalId, reason: reason,
            values: ["date": .of(date?.raw ?? "")])
    }

    static func deleteAction(id: String, goalId: String, reason: String? = nil) -> Change {
        change(.action, .delete, id: id, parentId: goalId, reason: reason, values: [:])
    }

    // MARK: - Milestones

    /// Toggling `done` records a separately verified outcome — completing actions never does it.
    static func setMilestoneDone(
        goalId: String, milestoneId: String, done: Bool, reason: String? = nil
    ) -> Change {
        change(
            .milestone, .update, id: milestoneId, parentId: goalId, reason: reason,
            values: ["done": .of(done)])
    }

    static func updateMilestone(
        goalId: String,
        milestoneId: String?,
        title: String? = nil,
        criterion: String? = nil,
        done: Bool? = nil,
        dueDate: YMD?? = nil,
        reason: String? = nil
    ) -> Change {
        var values: [String: JSONValue] = [:]
        if let title { values["title"] = .of(title) }
        if let criterion { values["criterion"] = .of(criterion) }
        if let done { values["done"] = .of(done) }
        // `dueDate: null` clears the target date; omitting it leaves it alone.
        if let dueDate { values["dueDate"] = dueDate.map(JSONValue.of) ?? .null }
        return change(
            .milestone, milestoneId == nil ? .create : .update, id: milestoneId,
            parentId: goalId, reason: reason, values: values)
    }

    // MARK: - Results

    /// The only way an outcome is recorded, alongside verifying a milestone.
    static func addResult(
        goalId: String, value: Double, date: YMD, source: String, reason: String? = nil
    ) -> Change {
        change(
            .result, .create, id: nil, parentId: goalId, reason: reason,
            values: ["value": .of(value), "date": .of(date), "source": .of(source)])
    }

    static func updateResult(
        goalId: String,
        resultId: String,
        value: Double? = nil,
        date: YMD? = nil,
        source: String? = nil,
        reason: String? = nil
    ) -> Change {
        var values: [String: JSONValue] = [:]
        if let value { values["value"] = .of(value) }
        if let date { values["date"] = .of(date) }
        if let source { values["source"] = .of(source) }
        return change(
            .result, .update, id: resultId, parentId: goalId, reason: reason, values: values)
    }

    static func deleteResult(goalId: String, resultId: String, reason: String? = nil) -> Change {
        change(.result, .delete, id: resultId, parentId: goalId, reason: reason, values: [:])
    }

    // MARK: - Checkpoints

    static func addCheckpoint(
        goalId: String, date: YMD, value: Double, label: String, reason: String? = nil
    ) -> Change {
        change(
            .checkpoint, .create, id: nil, parentId: goalId, reason: reason,
            values: ["date": .of(date), "value": .of(value), "label": .of(label)])
    }

    // MARK: - Goals

    /// `Active` also starts a draft plan; prefer `POST /api/app/goals/:id/start`, which runs the
    /// review guard and reports why a plan cannot start.
    /// An unrecognised server status decodes to `.unknown`, and `statusOptions[]` is exactly the
    /// list a picker binds to — so a status added server-side could be selected and sent back as
    /// the literal `"unknown"`, which is a 400. `WorkspaceStore.setGoalStatus` refuses it.
    static func setGoalStatus(id: String, status: GoalStatus, reason: String? = nil) -> Change {
        assert(!status.isUnknown, "an unknown GoalStatus must never be written back")
        return change(
            .goal, .update, id: id, parentId: nil, reason: reason,
            values: ["status": .of(status.rawValue)])
    }

    static func updateGoal(
        id: String,
        title: String? = nil,
        why: String? = nil,
        success: String? = nil,
        area: GoalArea? = nil,
        tags: [String]? = nil,
        priority: GoalPriority?? = nil,
        targetDate: YMD?? = nil,
        target: Double? = nil,
        reason: String? = nil
    ) -> Change {
        var values: [String: JSONValue] = [:]
        if let title { values["title"] = .of(title) }
        if let why { values["why"] = .of(why) }
        if let success { values["success"] = .of(success) }
        if let area { values["area"] = .of(area.rawValue) }
        if let tags { values["tags"] = .of(tags) }
        if let priority { values["priority"] = priority.map { .of($0.rawValue) } ?? .null }
        if let targetDate { values["targetDate"] = targetDate.map(JSONValue.of) ?? .null }
        if let target { values["target"] = .of(target) }
        return change(.goal, .update, id: id, parentId: nil, reason: reason, values: values)
    }

    /// A goal with no chosen work is a valid Draft: `action`, `criterion` and `timing` stay empty
    /// and no first action is created.
    static func createDraftGoal(
        id: String? = nil,
        title: String,
        kind: GoalKind,
        why: String,
        success: String,
        area: GoalArea = .unassigned,
        tags: [String] = [],
        targetDate: YMD? = nil,
        reason: String? = nil
    ) -> Change {
        change(
            .goal, .create, id: id, parentId: nil, reason: reason,
            values: [
                "title": .of(title),
                "kind": .of(kind.rawValue),
                "why": .of(why),
                "success": .of(success),
                "area": .of(area.rawValue),
                "tags": .of(tags),
                "targetDate": .of(targetDate?.raw ?? ""),
                "status": .of(GoalStatus.draft.rawValue),
                "milestones": .array([]),
                "assessmentTarget": .of(8),
                "baseline": .null,
                "action": .of(""),
                "criterion": .of(""),
                "timing": .of(""),
            ])
    }

    static func deleteGoal(id: String, reason: String? = nil) -> Change {
        change(.goal, .delete, id: id, parentId: nil, reason: reason, values: [:])
    }

    // MARK: - Memories

    static func saveMemory(id: String? = nil, text: String, reason: String? = nil) -> Change {
        change(
            .memory, id == nil ? .create : .update, id: id, parentId: nil, reason: reason,
            values: ["text": .of(text)])
    }

    static func deleteMemory(id: String, reason: String? = nil) -> Change {
        change(.memory, .delete, id: id, parentId: nil, reason: reason, values: [:])
    }

    // MARK: - Preferences and program

    static func updatePreferences(
        theme: Theme? = nil,
        timeZone: String? = nil,
        automation: AutomationView? = nil,
        reason: String? = nil
    ) -> Change {
        var values: [String: JSONValue] = [:]
        if let theme { values["theme"] = .of(theme.rawValue) }
        if let timeZone { values["timeZone"] = .of(timeZone) }
        if let automation {
            values["automation"] = .object([
                "enabled": .of(automation.enabled),
                "checkInMode": .of(automation.checkInMode.rawValue),
                "checkInTime": .of(automation.checkInTime),
                "reviewTime": .of(automation.reviewTime),
                "quietStart": .of(automation.quietStart),
                "quietEnd": .of(automation.quietEnd),
            ])
        }
        return change(
            .preferences, .update, id: nil, parentId: nil, reason: reason, values: values)
    }

    /// A program revision always needs a `reason` — the server refuses one without it.
    static func updateProgram(
        reason: String,
        focusGoalId: String? = nil,
        weeklyMinutes: Int? = nil,
        workStart: String? = nil,
        workEnd: String? = nil,
        workDays: [Int]? = nil,
        sessionMinutes: Int? = nil,
        reviewDay: Weekday? = nil,
        enabledMethods: [String]? = nil,
        approach: String? = nil,
        sprintStart: YMD? = nil,
        sprintEnd: YMD? = nil,
        sprintResult: String? = nil
    ) -> Change {
        var values: [String: JSONValue] = ["reason": .of(reason)]
        if let focusGoalId { values["focusGoalId"] = .of(focusGoalId) }
        if let weeklyMinutes { values["weeklyMinutes"] = .of(weeklyMinutes) }
        if let workStart { values["workStart"] = .of(workStart) }
        if let workEnd { values["workEnd"] = .of(workEnd) }
        if let workDays { values["workDays"] = .of(workDays) }
        if let sessionMinutes { values["sessionMinutes"] = .of(sessionMinutes) }
        if let reviewDay { values["reviewDay"] = .of(reviewDay.rawValue) }
        if let enabledMethods { values["enabledMethods"] = .of(enabledMethods) }
        if let approach { values["approach"] = .of(approach) }
        if let sprintStart { values["sprintStart"] = .of(sprintStart) }
        if let sprintEnd { values["sprintEnd"] = .of(sprintEnd) }
        if let sprintResult { values["sprintResult"] = .of(sprintResult) }
        return change(.program, .update, id: nil, parentId: nil, reason: reason, values: values)
    }

    // MARK: - Work blocks

    /// Adler-only time. This books nothing on an external calendar — that is `POST /api/bookings`.
    static func createLocalWorkBlock(
        goalId: String,
        actionTitle: String,
        start: Timestamp,
        end: Timestamp,
        id: String? = nil,
        reason: String? = nil
    ) -> Change {
        change(
            .workBlock, .create, id: id, parentId: goalId, reason: reason,
            values: ["action": .of(actionTitle), "start": .of(start), "end": .of(end)])
    }

    static func updateWorkBlock(
        id: String, goalId: String, start: Timestamp, end: Timestamp, reason: String? = nil
    ) -> Change {
        change(
            .workBlock, .update, id: id, parentId: goalId, reason: reason,
            values: ["start": .of(start), "end": .of(end)])
    }

    static func deleteWorkBlock(id: String, goalId: String, reason: String? = nil) -> Change {
        change(.workBlock, .delete, id: id, parentId: goalId, reason: reason, values: [:])
    }

    // MARK: - Conversations

    static func createConversation(title: String, goalId: String, reason: String? = nil) -> Change {
        change(
            .conversation, .create, id: nil, parentId: nil, reason: reason,
            values: ["title": .of(title), "goalId": .of(goalId)])
    }

    static func renameConversation(id: String, title: String, reason: String? = nil) -> Change {
        change(
            .conversation, .update, id: id, parentId: nil, reason: reason,
            values: ["title": .of(title)])
    }

    static func deleteConversation(id: String, reason: String? = nil) -> Change {
        change(.conversation, .delete, id: id, parentId: nil, reason: reason, values: [:])
    }

    // MARK: - Weekly review

    static func updateReview(
        note: String? = nil, decision: String? = nil, complete: Bool? = nil,
        reason: String? = nil
    ) -> Change {
        var values: [String: JSONValue] = [:]
        if let note { values["note"] = .of(note) }
        if let decision { values["decision"] = .of(decision) }
        if let complete { values["complete"] = .of(complete) }
        return change(.review, .update, id: nil, parentId: nil, reason: reason, values: values)
    }

    // MARK: - Assembly

    /// `values` is a JSON *string*; `{}` for a deletion.
    static func change(
        _ entity: ChangeEntity,
        _ operation: ChangeOperation,
        id: String?,
        parentId: String?,
        reason: String?,
        values: [String: JSONValue]
    ) -> Change {
        Change(
            entity: entity,
            operation: operation,
            id: id,
            parentId: parentId,
            reason: Self.trimmed(reason),
            values: JSONValue.object(values).serialized)
    }

    /// `changeSchema` applies `z.string().trim().min(1)`, so a whitespace-only reason becomes
    /// `""` server-side and is refused with `changes.0.reason: Too small`. Nothing is a reason.
    private static func trimmed(_ reason: String?) -> String? {
        guard let reason else { return nil }
        let value = reason.trimmingCharacters(in: .whitespacesAndNewlines)
        return value.isEmpty ? nil : value
    }
}
