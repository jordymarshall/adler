import SwiftUI

/// One question, one field, one control (DESIGN.md §5.2).
///
/// No goal-type picker, no category chips, no target or deadline fields: the coach asks only
/// what changes the next decision. The draft is written to `PendingDraft` on every keystroke, so
/// it survives backgrounding, termination and authentication, and it is cleared only after
/// `POST /api/coach` has accepted it.
struct GoalInputView: View {
    @Environment(SessionStore.self) private var session
    @FocusState private var isFocused: Bool

    var body: some View {
        @Bindable var draft = session.draft

        ScrollView {
            VStack(alignment: .leading, spacing: Space.l) {
                Text(OnboardingCopy.onboardingEyebrow)
                    .adlerText(.eyebrow)
                    .foregroundStyle(Color.inkMuted)

                Text(OnboardingCopy.onboardingTitle)
                    .adlerText(.title1)
                    .foregroundStyle(Color.inkHeading)
                    .fixedSize(horizontal: false, vertical: true)
                    .accessibilityAddTraits(.isHeader)

                Text(OnboardingCopy.onboardingBody)
                    .adlerText(.callout)
                    .foregroundStyle(Color.inkMuted)
                    .fixedSize(horizontal: false, vertical: true)

                field(text: $draft.text)

                examples(text: $draft.text)

                NavigationLink(value: OnboardingStep.auth(.register)) {
                    HStack(spacing: Space.s) {
                        Text(OnboardingCopy.onboardingContinue)
                            .adlerText(.headline)
                        Image(systemName: "arrow.right")
                    }
                    .frame(maxWidth: .infinity, minHeight: 52 - Space.xl)
                }
                .buttonStyle(.glassProminent)
                .tint(Color.accentGreen)
                .disabled(!OnboardingValidation.isGoalAcceptable(draft.text))
                .padding(.top, Space.s)
            }
            .padding(.horizontal, AdlerLayout.screenMargin)
            .padding(.bottom, AdlerLayout.screenMargin)
            .frame(maxWidth: .infinity, alignment: .leading)
        }
        .scrollDismissesKeyboard(.interactively)
        .background(Color.canvas)
        .navigationBarTitleDisplayMode(.inline)
        .onAppear { isFocused = true }
    }

    @ViewBuilder
    private func field(text: Binding<String>) -> some View {
        VStack(alignment: .leading, spacing: Space.xs) {
            ZStack(alignment: .topLeading) {
                if text.wrappedValue.isEmpty {
                    Text(OnboardingCopy.onboardingPlaceholder)
                        .adlerText(.body)
                        .foregroundStyle(Color.inkMuted)
                        .padding(.horizontal, Space.s)
                        .padding(.vertical, Space.s)
                        .allowsHitTesting(false)
                }
                TextEditor(text: text)
                    .adlerText(.body)
                    .scrollContentBackground(.hidden)
                    .frame(minHeight: 118)
                    .padding(.horizontal, Space.xs)
                    .padding(.vertical, Space.xs)
                    .focused($isFocused)
                    .accessibilityLabel(OnboardingCopy.onboardingFieldLabel)
                    .accessibilityIdentifier("Goal field")
                    .onChange(of: text.wrappedValue) { _, value in
                        if value.count > OnboardingCopy.goalCharacterLimit {
                            text.wrappedValue = String(value.prefix(OnboardingCopy.goalCharacterLimit))
                        }
                    }
            }
            .padding(Space.s)
            .background(Color.surface, in: .rect(cornerRadius: Radii.control))
            .overlay {
                RoundedRectangle(cornerRadius: Radii.control)
                    .strokeBorder(Color.separator, lineWidth: 1)
            }

            // Announced only within 100 characters of the limit (DESIGN.md §5.2).
            if let remaining = OnboardingValidation.remainingCharactersToAnnounce(text.wrappedValue) {
                Text(OnboardingCopy.charactersLeft(remaining))
                    .adlerText(.footnote, numeric: true)
                    .foregroundStyle(remaining == 0 ? Color.warning : Color.inkMuted)
            }
        }
    }

    @ViewBuilder
    private func examples(text: Binding<String>) -> some View {
        VStack(alignment: .leading, spacing: Space.s) {
            Text(OnboardingCopy.onboardingExamples)
                .adlerText(.eyebrow)
                .foregroundStyle(Color.inkMuted)
            FlowLayout(spacing: Space.s, lineSpacing: Space.s) {
                ForEach(OnboardingCopy.onboardingExampleGoals, id: \.self) { example in
                    Button {
                        // Fills the field so it can be edited; it never submits on the
                        // person's behalf (the quick-prompt rule, DESIGN.md §4.16).
                        text.wrappedValue = example
                        isFocused = true
                    } label: {
                        Text(example)
                            .adlerText(.caption)
                            .foregroundStyle(Color.ink)
                            .multilineTextAlignment(.leading)
                            .padding(.horizontal, Space.m)
                            .padding(.vertical, Space.s)
                            .background(Color.surfaceSunken, in: .capsule)
                    }
                    .buttonStyle(.plain)
                    .accessibilityHint(OnboardingCopy.onboardingExamplesHint)
                }
            }
            Text(OnboardingCopy.onboardingExamplesHint)
                .adlerText(.footnote)
                .foregroundStyle(Color.inkMuted)
        }
    }
}

#Preview {
    NavigationStack { GoalInputView() }
        .environment(SessionStore(client: APIClient()))
}
