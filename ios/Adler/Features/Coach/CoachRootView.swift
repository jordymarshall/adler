import SwiftUI

/// One Coach with two views (DESIGN.md §5.7–5.8). The segment is `AppRouter.coachSegment`, so a
/// deep link to `adler://insights` lands on the right one.
struct CoachRootView: View {
    @Environment(AppRouter.self) private var router
    @Environment(WorkspaceStore.self) private var workspace

    /// The conversation the inline thread is showing. `nil` is the General view: the coach list
    /// route, its welcome block and any proposal not attached to a conversation.
    @State private var selection: String?
    @State private var hasChosen = false

    var body: some View {
        @Bindable var router = router
        VStack(spacing: 0) {
            Picker(CoachCopy.title, selection: $router.coachSegment) {
                Text(CoachCopy.segConversation).tag(CoachSegment.conversation)
                Text(CoachCopy.segInsights).tag(CoachSegment.insights)
            }
            .pickerStyle(.segmented)
            .labelsHidden()
            .padding(.horizontal, AdlerLayout.screenMargin)
            .padding(.bottom, Space.s)

            switch router.coachSegment {
            case .conversation:
                ConversationPicker(selection: $selection)
                ConversationSurface(conversationId: selection)
            case .insights:
                CoachInsightsSurface()
            }
        }
        .background(Color.canvas)
        .onChange(of: workspace.coach?.conversations.map(\.id) ?? []) { _, ids in
            // Open the most recent conversation the first time the list arrives; afterwards the
            // person's own choice stands, unless the conversation they were reading was deleted.
            if !hasChosen, let first = ids.first {
                selection = first
                hasChosen = true
            } else if let current = selection, !ids.contains(current) {
                selection = ids.first
            }
        }
    }
}

// MARK: - Conversation picker

/// Per-goal conversations plus General, each with its last message, and the create/rename/delete
/// controls (DESIGN.md §5.7). Renaming and deleting are `conversation` commands through
/// `POST /api/app/changes`; deleting asks first.
struct ConversationPicker: View {
    @Binding var selection: String?

    @Environment(WorkspaceStore.self) private var workspace

    @State private var renaming: ConversationRef?
    @State private var deleting: ConversationRef?
    @State private var title = ""
    @State private var newGoalId: String?
    @State private var isCreating = false
    @State private var error: String?

    private var conversations: [ConversationRef] { workspace.coach?.conversations ?? [] }
    private var goals: [GoalRef] { workspace.coach?.goals ?? [] }
    private var current: ConversationRef? { conversations.first { $0.id == selection } }

    var body: some View {
        VStack(alignment: .leading, spacing: Space.xs) {
            HStack(spacing: Space.s) {
                Menu {
                    Section(CoachCopy.conversations) {
                        ForEach(conversations) { conversation in
                            Button {
                                selection = conversation.id
                            } label: {
                                Text(conversation.title)
                                Text(subtitle(conversation))
                            }
                        }
                        Button(CoachCopy.general) { selection = nil }
                    }
                    Section {
                        Menu(CoachCopy.newConversation) {
                            ForEach(goals) { goal in
                                Button(goal.title) { startCreating(goalId: goal.id) }
                            }
                            Button(CoachCopy.general) { startCreating(goalId: "general") }
                        }
                        if let current {
                            Button(CoachCopy.renameConversation) {
                                title = current.title
                                renaming = current
                            }
                            Button(CoachCopy.deleteConversation, role: .destructive) {
                                deleting = current
                            }
                        }
                    }
                } label: {
                    HStack(spacing: Space.xs) {
                        Text(current?.title ?? CoachCopy.general)
                            .adlerText(.headline)
                            .foregroundStyle(Color.inkHeading)
                            .lineLimit(1)
                        Image(systemName: "chevron.down").font(.caption2)
                            .foregroundStyle(Color.inkMuted)
                    }
                    .frame(minHeight: AdlerLayout.minimumHitTarget, alignment: .leading)
                    .contentShape(.rect)
                }
                .accessibilityLabel(CoachCopy.conversations)
                .accessibilityValue(current?.title ?? CoachCopy.general)
                Spacer(minLength: Space.s)
            }
            if let subtitle = current.map(subtitle) {
                Text(subtitle)
                    .adlerText(.footnote)
                    .foregroundStyle(Color.inkMuted)
                    .lineLimit(1)
            }
            if let error {
                Text(error).adlerText(.footnote).foregroundStyle(Color.warning)
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(.horizontal, AdlerLayout.screenMargin)
        .padding(.bottom, Space.s)
        .alert(
            isCreating ? CoachCopy.newConversation : CoachCopy.renameConversation,
            isPresented: Binding(
                get: { renaming != nil || isCreating },
                set: { if !$0 { renaming = nil; isCreating = false } })
        ) {
            TextField(CoachCopy.conversationTitle, text: $title)
            Button(CoachCopy.cancel, role: .cancel) { renaming = nil; isCreating = false }
            Button(CoachCopy.save) { Task { await commitTitle() } }
        }
        .confirmationDialog(
            CoachCopy.deleteConversationConfirm,
            isPresented: Binding(get: { deleting != nil }, set: { if !$0 { deleting = nil } }),
            titleVisibility: .visible
        ) {
            Button(CoachCopy.delete, role: .destructive) { Task { await commitDelete() } }
            Button(CoachCopy.cancel, role: .cancel) { deleting = nil }
        }
    }

    private func subtitle(_ conversation: ConversationRef) -> String {
        conversation.lastMessage ?? conversation.goalTitle
    }

    private func startCreating(goalId: String) {
        newGoalId = goalId
        title = ""
        isCreating = true
    }

    private func commitTitle() async {
        let text = title.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !text.isEmpty else { return }
        do {
            if isCreating {
                try await workspace.apply(
                    changes: [
                        ChangeBuilder.createConversation(title: text, goalId: newGoalId ?? "general")
                    ])
                await workspace.loadCoach()
                selection = workspace.coach?.conversations.first { $0.title == text }?.id ?? selection
            } else if let renaming {
                try await workspace.apply(
                    changes: [ChangeBuilder.renameConversation(id: renaming.id, title: text)])
                await workspace.loadCoach()
            }
            error = nil
        } catch {
            self.error = error.serverMessage ?? error.errorDescription
        }
        renaming = nil
        isCreating = false
    }

    private func commitDelete() async {
        guard let deleting else { return }
        do {
            try await workspace.apply(
                changes: [ChangeBuilder.deleteConversation(id: deleting.id)])
            await workspace.loadCoach()
            if selection == deleting.id { selection = workspace.coach?.conversations.first?.id }
            error = nil
        } catch {
            self.error = error.serverMessage ?? error.errorDescription
        }
        self.deleting = nil
    }
}
