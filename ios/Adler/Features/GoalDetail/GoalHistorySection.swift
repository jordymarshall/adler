import SwiftUI

/// Conversations for this goal, then `History & settings`: the plan version picker, every
/// action with its reports, and the goal's lifecycle controls.
struct GoalHistorySection: View {
    let detail: GoalDetailView
    let timeZone: TimeZone
    var onOpenConversation: (String) -> Void
    var onOpenActionHistory: (String) -> Void
    var onSelectPlanVersion: (Int) -> Void
    let selectedVersion: Int
    var onEdit: () -> Void
    var onPause: () -> Void
    var onResume: () -> Void
    var onSetAside: () -> Void
    var onComplete: () -> Void
    var onDelete: () -> Void

    @State private var isExpanded = false

    var body: some View {
        VStack(alignment: .leading, spacing: AdlerLayout.sectionGap) {
            conversations
            history
        }
    }

    // MARK: - Conversations

    @ViewBuilder
    private var conversations: some View {
        if !detail.conversations.isEmpty {
            VStack(alignment: .leading, spacing: Space.s) {
                Text(GoalCopy.conversations.uppercased())
                    .adlerText(.eyebrow)
                    .foregroundStyle(Color.inkMuted)
                    .accessibilityAddTraits(.isHeader)
                ForEach(detail.conversations) { conversation in
                    Button {
                        onOpenConversation(conversation.id)
                    } label: {
                        HStack(alignment: .top, spacing: Space.s) {
                            VStack(alignment: .leading, spacing: Space.xxs) {
                                Text(conversation.title)
                                    .adlerText(.subhead)
                                    .foregroundStyle(Color.ink)
                                if let last = conversation.lastMessage {
                                    Text(last)
                                        .adlerText(.footnote)
                                        .foregroundStyle(Color.inkMuted)
                                        .lineLimit(2)
                                }
                                Text("\(conversation.messageCount) messages")
                                    .adlerText(.caption, numeric: true)
                                    .foregroundStyle(Color.inkMuted)
                            }
                            Spacer(minLength: 0)
                            Image(systemName: "chevron.right")
                                .font(.caption)
                                .foregroundStyle(Color.inkMuted)
                                .accessibilityHidden(true)
                        }
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .contentShape(.rect)
                    }
                    .buttonStyle(.plain)
                    .accessibilityElement(children: .combine)
                }
            }
            .frame(maxWidth: .infinity, alignment: .leading)
            .padding(AdlerLayout.cardPadding)
            .adlerCard()
        }
    }

    // MARK: - History & settings

    private var history: some View {
        VStack(alignment: .leading, spacing: Space.m) {
            DisclosureGroup(isExpanded: $isExpanded) {
                VStack(alignment: .leading, spacing: AdlerLayout.sectionGap) {
                    planVersions
                    actionHistory
                    settings
                }
                .padding(.top, Space.m)
            } label: {
                Text(GoalCopy.historyAndSettings)
                    .adlerText(.title3)
                    .foregroundStyle(Color.inkHeading)
            }
            .tint(Color.accentInk)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(AdlerLayout.cardPadding)
        .adlerCard()
    }

    private var planVersions: some View {
        VStack(alignment: .leading, spacing: Space.s) {
            Text("PLAN VERSIONS")
                .adlerText(.eyebrow)
                .foregroundStyle(Color.inkMuted)
                .accessibilityAddTraits(.isHeader)
            ForEach(detail.plans.reversed()) { plan in
                Button {
                    onSelectPlanVersion(plan.version)
                } label: {
                    HStack(spacing: Space.s) {
                        Text("v\(plan.version)")
                            .adlerText(.subhead, numeric: true)
                            .foregroundStyle(Color.ink)
                            .frame(width: 32, alignment: .leading)
                        Text(
                            GoalPresentation.date(plan.date, in: timeZone)
                                .map { AdlerDate.short($0) } ?? plan.date.raw
                        )
                        .adlerText(.caption, numeric: true)
                        .foregroundStyle(Color.inkMuted)
                        Text(plan.action)
                            .adlerText(.footnote)
                            .foregroundStyle(Color.inkMuted)
                            .lineLimit(1)
                        Spacer(minLength: Space.s)
                        if plan.current { AdlerChip(label: "Current") }
                        if plan.version == selectedVersion {
                            Image(systemName: "checkmark")
                                .font(.caption)
                                .foregroundStyle(Color.accentInk)
                                .accessibilityHidden(true)
                        }
                    }
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .padding(.vertical, Space.xs)
                    .contentShape(.rect)
                }
                .buttonStyle(.plain)
                .accessibilityElement(children: .combine)
                .accessibilityAddTraits(
                    plan.version == selectedVersion ? [.isButton, .isSelected] : .isButton)
            }
            Text("Choose an earlier version to read the plan as it was saved. It cannot be edited.")
                .adlerText(.caption)
                .foregroundStyle(Color.inkMuted)
                .fixedSize(horizontal: false, vertical: true)
        }
    }

    private var actionHistory: some View {
        VStack(alignment: .leading, spacing: Space.s) {
            Text("EVERY ACTION · \(detail.actions.count)")
                .adlerText(.eyebrow, numeric: true)
                .foregroundStyle(Color.inkMuted)
                .accessibilityAddTraits(.isHeader)
            ForEach(detail.actions.prefix(12)) { action in
                Button {
                    onOpenActionHistory(action.id)
                } label: {
                    HStack(spacing: Space.s) {
                        Text(
                            action.date.flatMap { GoalPresentation.date($0, in: timeZone) }
                                .map { AdlerDate.short($0) } ?? "No date"
                        )
                        .adlerText(.caption, numeric: true)
                        .foregroundStyle(Color.inkMuted)
                        .frame(width: 54, alignment: .leading)
                        Text(action.title)
                            .adlerText(.footnote)
                            .foregroundStyle(Color.ink)
                            .lineLimit(1)
                        Spacer(minLength: Space.s)
                        if action.history.count > 1 {
                            Text("\(action.history.count) reports")
                                .adlerText(.caption, numeric: true)
                                .foregroundStyle(Color.warning)
                        } else {
                            Text(action.executionLabel)
                                .adlerText(.caption)
                                .foregroundStyle(Color.inkMuted)
                        }
                        Image(systemName: "chevron.right")
                            .font(.caption)
                            .foregroundStyle(Color.inkMuted)
                            .accessibilityHidden(true)
                    }
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .padding(.vertical, Space.xs)
                    .contentShape(.rect)
                }
                .buttonStyle(.plain)
                .accessibilityElement(children: .combine)
            }
            if detail.actions.count > 12 {
                Text("Showing the 12 most recent. Open one to read its corrections.")
                    .adlerText(.caption, numeric: true)
                    .foregroundStyle(Color.inkMuted)
            }
        }
    }

    private var settings: some View {
        VStack(alignment: .leading, spacing: Space.s) {
            Text("SETTINGS")
                .adlerText(.eyebrow)
                .foregroundStyle(Color.inkMuted)
                .accessibilityAddTraits(.isHeader)
            AdlerSecondaryButton(title: GoalCopy.editGoal, action: onEdit)
            if detail.goal.status == .paused || detail.goal.status == .setAside {
                AdlerSecondaryButton(title: GoalCopy.resume, action: onResume)
            } else if detail.statusOptions.contains(.paused) {
                AdlerSecondaryButton(title: GoalCopy.pause, action: onPause)
            }
            if detail.statusOptions.contains(.setAside) {
                AdlerQuietButton(title: GoalCopy.setAside, action: onSetAside)
            }
            if detail.statusOptions.contains(.completed) {
                AdlerQuietButton(title: GoalCopy.complete, action: onComplete)
            }
            AdlerQuietButton(title: GoalCopy.delete, role: .destructive, action: onDelete)
            Text(GoalCopy.deleteConfirm)
                .adlerText(.caption)
                .foregroundStyle(Color.inkMuted)
                .fixedSize(horizontal: false, vertical: true)
        }
    }
}
