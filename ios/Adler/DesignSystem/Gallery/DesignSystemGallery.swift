#if DEBUG
import SwiftUI

/// A DEBUG-only catalogue of every design-system component and its states,
/// so they can be reviewed and screenshotted on a simulator.
///
/// Reached with `adler://gallery`, or straight to one entry with
/// `adler://gallery?item=recommendation-card`. It ships only in DEBUG builds
/// and is not reachable from the app's own navigation.
struct DesignSystemGallery: View {
    var initialItem: GalleryItem?
    /// Start at `.accessibility3` — the screenshot route for the
    /// accessibility-size pass.
    var startsLarge: Bool = false

    @State private var path: [GalleryItem] = []
    @State private var largeText: Bool
    @Environment(\.dismiss) private var dismiss

    init(initialItem: GalleryItem? = nil, startsLarge: Bool = false) {
        self.initialItem = initialItem
        self.startsLarge = startsLarge
        _largeText = State(initialValue: startsLarge)
    }

    var body: some View {
        NavigationStack(path: $path) {
            List {
                ForEach(GallerySection.allCases) { section in
                    Section(section.title) {
                        ForEach(GalleryItem.allCases.filter { $0.section == section }) { item in
                            NavigationLink(value: item) {
                                VStack(alignment: .leading, spacing: 2) {
                                    Text(item.title).adlerText(.headline)
                                    Text(item.states).adlerText(.footnote).foregroundStyle(Color.inkMuted)
                                }
                            }
                        }
                    }
                }
            }
            .scrollContentBackground(.hidden)
            .background(Color.canvas)
            .navigationTitle("Design system")
            .navigationDestination(for: GalleryItem.self) { item in
                GalleryDetail(item: item)
            }
            .toolbar { toolbarContent }
        }
        // Only override when the toggle is on; otherwise the system's own
        // Dynamic Type setting has to come through.
        .modifier(GalleryTypeSize(large: largeText))
        .onAppear {
            if let initialItem, path.isEmpty { path = [initialItem] }
        }
        // A second `adler://gallery?item=…` while the gallery is already
        // open re-navigates, so screenshots can be driven without relaunching.
        .onChange(of: initialItem) { _, item in
            if let item { path = [item] }
        }
    }

    @ToolbarContentBuilder
    private var toolbarContent: some ToolbarContent {
        ToolbarItem(placement: .topBarLeading) {
            Button("Close") { dismiss() }
        }
        ToolbarItem(placement: .topBarTrailing) {
            Button(largeText ? "AX3" : "Large") { largeText.toggle() }
                .accessibilityLabel("Toggle Dynamic Type size")
        }
    }
}

private struct GalleryTypeSize: ViewModifier {
    let large: Bool

    @ViewBuilder
    func body(content: Content) -> some View {
        if large {
            content.dynamicTypeSize(.accessibility3)
        } else {
            content
        }
    }
}

private struct GalleryDetail: View {
    let item: GalleryItem

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: AdlerLayout.sectionGap) {
                item.content
            }
            .frame(maxWidth: .infinity, alignment: .leading)
            .padding(AdlerLayout.screenMargin)
        }
        .background(Color.canvas)
        .navigationTitle(item.title)
        .navigationBarTitleDisplayMode(.inline)
    }
}

// MARK: - Catalogue

enum GallerySection: String, CaseIterable, Identifiable {
    case tokens
    case decisions
    case work
    case evidence
    case charts
    case shell

    var id: String { rawValue }

    var title: String {
        switch self {
        case .tokens: "Tokens"
        case .decisions: "Decisions"
        case .work: "Work and progress"
        case .evidence: "Learning and evidence"
        case .charts: "Charts"
        case .shell: "Shell, states and art"
        }
    }
}

enum GalleryItem: String, CaseIterable, Identifiable, Hashable {
    case tokens = "tokens"
    case typography = "typography"
    case actionCard = "action-card"
    case reportSheet = "report-sheet"
    case recommendationCard = "recommendation-card"
    case proposalCard = "proposal-card"
    case learningTimeline = "learning-timeline"
    case statusChips = "status-chips"
    case evidenceDisclosure = "evidence-disclosure"
    case reasoningDiagram = "reasoning-diagram"
    case goalRow = "goal-row"
    case activityGrid = "activity-grid"
    case streakLane = "streak-lane"
    case weeklyBudget = "weekly-budget"
    case milestoneRail = "milestone-rail"
    case inputChart = "input-chart"
    case outcomeChart = "outcome-chart"
    case outcomeChartUnavailable = "outcome-chart-unavailable"
    case progressRing = "progress-ring"
    case cardDeck = "card-deck"
    case conversation = "conversation"
    case composer = "composer"
    case emptyStates = "empty-states"
    case banners = "banners"
    case skeletons = "skeletons"
    case fans = "fans"

    var id: String { rawValue }

    var section: GallerySection {
        switch self {
        case .tokens, .typography: .tokens
        case .actionCard, .reportSheet, .recommendationCard, .proposalCard: .decisions
        case .goalRow, .activityGrid, .streakLane, .weeklyBudget, .milestoneRail, .progressRing: .work
        case .learningTimeline, .statusChips, .evidenceDisclosure, .reasoningDiagram: .evidence
        case .inputChart, .outcomeChart, .outcomeChartUnavailable: .charts
        case .cardDeck, .conversation, .composer, .emptyStates, .banners, .skeletons, .fans: .shell
        }
    }

    var title: String {
        switch self {
        case .tokens: "Colour tokens"
        case .typography: "Type scale"
        case .actionCard: "ActionCard"
        case .reportSheet: "ReportSheet"
        case .recommendationCard: "RecommendationCard"
        case .proposalCard: "ProposalCard"
        case .learningTimeline: "LearningSummaryRow + Timeline"
        case .statusChips: "StatusChips"
        case .evidenceDisclosure: "EvidenceDisclosure"
        case .reasoningDiagram: "ReasoningDiagram"
        case .goalRow: "GoalSummaryRow"
        case .activityGrid: "ActivityGrid"
        case .streakLane: "StreakLane"
        case .weeklyBudget: "WeeklyBudgetBar"
        case .milestoneRail: "MilestoneRail"
        case .inputChart: "InputChart"
        case .outcomeChart: "OutcomeChart + ProjectionBand"
        case .outcomeChartUnavailable: "OutcomeChart — unavailable"
        case .progressRing: "ProgressRing"
        case .cardDeck: "CardDeck + PageIndicator"
        case .conversation: "ConversationBubble"
        case .composer: "Composer"
        case .emptyStates: "EmptyStates"
        case .banners: "ErrorBanner + StaleRevision"
        case .skeletons: "LoadingSkeletons"
        case .fans: "GeometricFans"
        }
    }

    var states: String {
        switch self {
        case .tokens: "light and dark, goal colours"
        case .typography: "display → eyebrow, tabular numerals"
        case .actionCard: "planned · started · reported · scheduled · draft · retired"
        case .reportSheet: "empty · partly · saved receipt"
        case .recommendationCard: "pending · agreed · declined · applied"
        case .proposalCard: "pending · booking · approved · dismissed"
        case .learningTimeline: "running · not started · evidence changed"
        case .statusChips: "workflow · evidence standing · single purpose"
        case .evidenceDisclosure: "full record · sparse record"
        case .reasoningDiagram: "with feedback · no feedback yet"
        case .goalRow: "active · no measure · draft"
        case .activityGrid: "4 weeks · 14 weeks · no check-ins"
        case .streakLane: "with rest days · single day"
        case .weeklyBudget: "within budget · over budget"
        case .milestoneRail: "verified · open · review · no date"
        case .inputChart: "bars + plan rules · missing reports · one-time · sparkline"
        case .outcomeChart: "observed · checkpoints · target · today · scenario band"
        case .outcomeChartUnavailable: "reason verbatim · stale · undated completions"
        case .progressRing: "partial · complete · nothing scheduled"
        case .cardDeck: "three Today cards"
        case .conversation: "user · coach · channel · in progress"
        case .composer: "quick prompts · attached context · responding"
        case .emptyStates: "no goals · no learning · no measure · rest day"
        case .banners: "offline · server · stale revision · record gone"
        case .skeletons: "row · card · chart · refresh hairline"
        case .fans: "three seeds behind text"
        }
    }

    @ViewBuilder
    var content: some View {
        switch self {
        case .tokens: GalleryTokens()
        case .typography: GalleryTypography()
        case .actionCard: GalleryActionCards()
        case .reportSheet: GalleryReportSheet()
        case .recommendationCard: GalleryRecommendations()
        case .proposalCard: GalleryProposals()
        case .learningTimeline: GalleryLearning()
        case .statusChips: GalleryChips()
        case .evidenceDisclosure: GalleryEvidence()
        case .reasoningDiagram: GalleryReasoning()
        case .goalRow: GalleryGoalRows()
        case .activityGrid: GalleryActivity()
        case .streakLane: GalleryStreak()
        case .weeklyBudget: GalleryBudget()
        case .milestoneRail: GalleryMilestones()
        case .inputChart: GalleryInputChart()
        case .outcomeChart: GalleryOutcomeChart(unavailable: false)
        case .outcomeChartUnavailable: GalleryOutcomeChart(unavailable: true)
        case .progressRing: GalleryProgressRing()
        case .cardDeck: GalleryCardDeck()
        case .conversation: GalleryConversation()
        case .composer: GalleryComposer()
        case .emptyStates: GalleryEmpty()
        case .banners: GalleryBanners()
        case .skeletons: GallerySkeletons()
        case .fans: GalleryFans()
        }
    }
}

// MARK: - Deep-link presentation

/// Holds the DEBUG gallery's presentation state so `AdlerApp` can open it
/// from `adler://gallery` with a two-line hook in `RootView`.
@Observable
final class GalleryPresentation {
    static let shared = GalleryPresentation()

    var isPresented = false
    var item: GalleryItem?
    /// Set by `-galleryAX` so a screenshot can capture an accessibility size.
    var largeText = false

    private init() {
        // `xcrun simctl launch --terminate-running-process <udid>
        //  com.withadler.app -gallery outcome-chart` opens the gallery
        // straight to one entry. `simctl openurl` shows a system
        // confirmation dialog that cannot be tapped from a script, so the
        // screenshot pipeline uses this route; `adler://gallery` remains the
        // interactive one.
        let arguments = ProcessInfo.processInfo.arguments
        largeText = arguments.contains("-galleryAX")
        guard let flag = arguments.firstIndex(of: "-gallery") else { return }
        if arguments.indices.contains(flag + 1) {
            item = GalleryItem(rawValue: arguments[flag + 1])
        }
        isPresented = true
    }

    /// Returns `true` when the URL was a gallery link and was handled.
    @discardableResult
    func handle(_ url: URL) -> Bool {
        guard url.scheme == "adler", url.host() == "gallery" else { return false }
        let components = URLComponents(url: url, resolvingAgainstBaseURL: false)
        let raw = components?.queryItems?.first(where: { $0.name == "item" })?.value
        item = raw.flatMap(GalleryItem.init(rawValue:))
        isPresented = true
        return true
    }
}
#endif
