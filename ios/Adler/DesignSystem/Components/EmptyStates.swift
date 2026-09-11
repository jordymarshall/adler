import SwiftUI

/// One shape for every empty state (DESIGN.md §4.17): a `title3` heading, a
/// `callout` body explaining **what evidence is missing**, and at most one
/// control.
///
/// Never an illustration that implies data. Never invented scaffolding — an
/// observation with no test shows no hypothesis, test or result stage.
struct EmptyStateView: View {
    let title: String
    var message: String?
    var actionTitle: String?
    var action: (() -> Void)?

    var body: some View {
        VStack(alignment: .leading, spacing: Space.s) {
            Text(title)
                .adlerText(.title3)
                .foregroundStyle(Color.inkHeading)
            if let message {
                Text(message)
                    .adlerText(.callout)
                    .foregroundStyle(Color.inkMuted)
                    .fixedSize(horizontal: false, vertical: true)
            }
            if let actionTitle, let action {
                Button(actionTitle, action: action)
                    .buttonStyle(.bordered)
                    .tint(Color.accentInk)
                    .padding(.top, Space.xs)
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(AdlerLayout.cardPadding)
        .adlerCard()
        .accessibilityElement(children: .contain)
    }
}

/// The COPY.md `empty.*` strings, so feature code never re-words them.
nonisolated enum EmptyStateCopy {
    static let noGoals = (
        title: "Start with a goal.",
        body: "Tell Adler what you want to achieve. It will work out the first useful step with you."
    )
    static let draftNoPlan = (
        title: "Goal saved",
        body: "Your outcome and target are saved. Choose the first useful work with your coach."
    )
    static let noActionsToday = (
        title: "Nothing scheduled for today. Your next step is here when you need it.",
        body: String?.none
    )
    static let restDay = (
        title: "A little space for what’s next.",
        body: "Your goals are complete or on hold."
    )
    static let noOutcomeMeasure = (
        title: "No outcome measure saved.",
        body: "Adler compares reported results with your plan once you choose what to measure."
    )
    static let noProjection = (title: "No finish estimate yet.", body: String?.none)
    static let noLearning = (
        title: "The next clue comes from you.",
        body: "A useful detail from your day helps Adler understand what fits. No experiment is needed to check in."
    )
    static let noConversations = (title: "No conversations yet.", body: String?.none)
    static let calendarNotConnected = (
        title: "No calendar connected.",
        body: "Adler can still plan tentative blocks. External busy time stays unknown until you connect a calendar."
    )
    static let noUnplaced = (title: "All planned work has a place this week.", body: String?.none)
}

/// Fictional design data.
#Preview("Empty states") {
    ScrollView {
        VStack(spacing: Space.l) {
            EmptyStateView(
                title: EmptyStateCopy.noGoals.title,
                message: EmptyStateCopy.noGoals.body,
                actionTitle: "Start with a goal",
                action: {}
            )
            EmptyStateView(
                title: EmptyStateCopy.noLearning.title,
                message: EmptyStateCopy.noLearning.body,
                actionTitle: "Share how it went",
                action: {}
            )
            EmptyStateView(
                title: EmptyStateCopy.noOutcomeMeasure.title,
                message: EmptyStateCopy.noOutcomeMeasure.body
            )
            EmptyStateView(title: EmptyStateCopy.restDay.title, message: EmptyStateCopy.restDay.body, actionTitle: "Choose a goal", action: {})
        }
        .padding(AdlerLayout.screenMargin)
    }
    .background(Color.canvas)
}
