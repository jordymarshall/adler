import SwiftUI

/// Edit goal (DESIGN.md §5.6 sub-sheets): the fields the shared command catalog accepts as a
/// plain goal patch. Plan, milestone and action edits that need reconciliation go through the
/// coach instead (FLOWS.md §8 step 6).
///
/// Only changed fields are sent.
struct EditGoalSheet: View {
    let detail: GoalDetailView
    let timeZone: TimeZone
    var onCancel: () -> Void
    var onSave: ([Change]) -> Void

    @State private var title: String
    @State private var why: String
    @State private var success: String
    @State private var area: GoalArea
    @State private var priority: GoalPriority
    @State private var deadline: DeadlineFlexibility
    @State private var hasTargetDate: Bool
    @State private var targetDate: Date

    init(
        detail: GoalDetailView, timeZone: TimeZone, onCancel: @escaping () -> Void,
        onSave: @escaping ([Change]) -> Void
    ) {
        self.detail = detail
        self.timeZone = timeZone
        self.onCancel = onCancel
        self.onSave = onSave
        _title = State(initialValue: detail.goal.title)
        _why = State(initialValue: detail.why)
        _success = State(initialValue: detail.success)
        _area = State(initialValue: GoalArea(rawValue: detail.area) ?? .unassigned)
        _priority = State(initialValue: detail.priority ?? .maintain)
        _deadline = State(initialValue: detail.deadline == .unknown ? .none : detail.deadline)
        _hasTargetDate = State(initialValue: detail.targetDate != nil)
        _targetDate = State(
            initialValue: detail.targetDate.flatMap { GoalPresentation.date($0, in: timeZone) }
                ?? Date())
    }

    var body: some View {
        NavigationStack {
            Form {
                Section("Goal") {
                    TextField("Title", text: $title, axis: .vertical)
                        .lineLimit(1...3)
                    TextField("Why this matters", text: $why, axis: .vertical)
                        .lineLimit(1...4)
                    TextField("What counts as success", text: $success, axis: .vertical)
                        .lineLimit(1...4)
                }

                Section("Timing") {
                    Toggle("Has a target date", isOn: $hasTargetDate)
                    if hasTargetDate {
                        DatePicker(
                            "Target date", selection: $targetDate, displayedComponents: .date)
                    }
                    Picker("Deadline", selection: $deadline) {
                        Text("Firm deadline").tag(DeadlineFlexibility.firm)
                        Text("Flexible timeline").tag(DeadlineFlexibility.preferred)
                        Text("No deadline").tag(DeadlineFlexibility.none)
                    }
                    Text("A target date is a commitment you chose. It is not a forecast.")
                        .adlerText(.footnote)
                        .foregroundStyle(Color.inkMuted)
                }

                Section("Organisation") {
                    Picker("Priority", selection: $priority) {
                        Text("Focus").tag(GoalPriority.focus)
                        Text("Maintain").tag(GoalPriority.maintain)
                        Text("Later").tag(GoalPriority.later)
                    }
                    Picker("Area", selection: $area) {
                        Text("Unassigned").tag(GoalArea.unassigned)
                        Text("Career").tag(GoalArea.career)
                        Text("Learning").tag(GoalArea.learning)
                        Text("Personal").tag(GoalArea.personal)
                    }
                }

                Section {
                    Text(
                        "Changing what this goal measures, its plan, its milestones or its actions goes through your coach, so the reasoning stays consistent."
                    )
                    .adlerText(.footnote)
                    .foregroundStyle(Color.inkMuted)
                }
            }
            .navigationTitle(GoalCopy.editGoal)
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel", action: onCancel)
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button("Save") { onSave(changes) }
                        .disabled(changes.isEmpty || title.trimmed.isEmpty)
                }
            }
        }
    }

    /// Only the fields that actually moved.
    private var changes: [Change] {
        var values: [String: JSONValue] = [:]
        if title.trimmed != detail.goal.title { values["title"] = .of(title.trimmed) }
        if why.trimmed != detail.why { values["why"] = .of(why.trimmed) }
        if success.trimmed != detail.success { values["success"] = .of(success.trimmed) }
        if area.rawValue != detail.area { values["area"] = .of(area.rawValue) }
        if priority != detail.priority { values["priority"] = .of(priority.rawValue) }

        let day = hasTargetDate ? YMD(targetDate, in: timeZone) : nil
        if day != detail.targetDate {
            // The catalog clears a target date with an empty string, not with null.
            values["targetDate"] = .of(day?.raw ?? "")
        }
        let savedDeadline = detail.deadline == .unknown ? DeadlineFlexibility.none : detail.deadline
        if deadline != savedDeadline { values["deadline"] = .of(deadline.rawValue) }

        guard !values.isEmpty else { return [] }
        return [
            ChangeBuilder.change(
                .goal, .update, id: detail.goal.id, parentId: nil,
                reason: "Edited in the app.", values: values)
        ]
    }
}

extension String {
    fileprivate var trimmed: String { trimmingCharacters(in: .whitespacesAndNewlines) }
}
