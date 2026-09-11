import Foundation

/// App-owned strings for the Coach tab, transcribed from `ios/COPY.md` §8 (recommendation,
/// proposal, evidence), §9 (Conversation), §10 (Insights) and the §1/§13 keys this feature uses.
///
/// Server-supplied prose — workflow states, evidence standing, timing labels, rationale,
/// proposal consequences, error bodies — is **never** in here. It is printed verbatim from the
/// payload (COPY.md conventions).
nonisolated enum CoachCopy {
    // MARK: §1 Global

    static let cancel = "Cancel"
    static let save = "Save"
    static let close = "Close"
    static let retry = "Retry"
    static let refresh = "Refresh"
    static let edit = "Edit"
    static let delete = "Delete"
    static let confirm = "Confirm"
    static let whyThis = "Why this?"
    static let whyThisTest = "Why this test?"
    static let history = "History & settings"

    // MARK: §8 Recommendation, proposal, evidence

    static let tryThis = "Try this"
    static let noThanks = "No thanks"
    static let discuss = "Discuss"
    static let correctThis = "Correct this"
    /// `rec.editPrefill` — `%@` is the recommended action.
    static func editPrefill(_ action: String) -> String {
        "I’d like to edit “\(action)”. Change this: "
    }
    /// `rec.discussPrefill` — `%@` is the recommended action.
    static func discussPrefill(_ action: String) -> String {
        "Let’s discuss “\(action)” before I decide."
    }
    static let proposalEyebrow = "A CHANGE TO CONSIDER"
    static let reviewChanges = "Review changes"
    static let approve = "Approve"
    static let dismiss = "Dismiss"
    static func approved(_ date: String) -> String { "Approved \(date)" }
    static let viewPlan = "View the plan"
    static func affects(actions: Int, planVersions: Int) -> String {
        "Affects \(actions) actions · \(planVersions) plan version(s)"
    }
    static let consequence = "Accepting this saves the plan. It does not book anything."
    /// `proposal.consequenceBooking` — `%1$@` the time, `%2$@` the calendar.
    static func consequenceBooking(time: String, calendar: String) -> String {
        "Accepting this also books \(time) in \(calendar)."
    }
    static func expires(_ date: String) -> String {
        "Expires \(date). If your workspace has changed, Adler will need to make an updated proposal."
    }
    static let noReason = "No reason was saved with this proposal."
    static let compareCurrent = "Current"
    static let compareSuggested = "Suggested"
    static let compareNoChange = "(no change)"
    static let compareNotAdded = "Not added yet"
    static let compareRemoved = "Removed from your workspace"
    static let compareNotSet = "Not set"
    static let compareWhy = "Why this change"

    static let evidenceTitle = "Why this?"
    static let evidencePrediction = "What we predicted"
    static let evidenceReviewRule = "How we’ll review it"
    static let evidenceClaims = "Claims"
    static let evidenceSources = "Sources"
    static let evidenceGrade = "Grade"
    static let evidenceLimitation = "What remains uncertain"
    static let evidenceVersions = "Versions and history"
    static func evidenceChecked(at: String, provider: String, model: String) -> String {
        "Checked \(at) · \(provider) \(model)"
    }
    static func evidenceCorrected(_ date: String) -> String { "Corrected \(date)" }
    static let evidenceClaimMissing =
        "This earlier claim version is unavailable here. The saved explanation remains historical."
    static let evidenceNoClaims =
        "This earlier explanation has no specific claim links. Its original sources are below."
    static let evidenceReadSource = "Read source"

    // MARK: §9 Coach — Conversation

    static let title = "Coach"
    static let segConversation = "Conversation"
    static let segInsights = "Insights"
    static let conversations = "Conversations"
    static let general = "General"
    static let welcomeGoals = "What would you like to work through?"
    static let welcomeBody =
        "Share what happened, check in on your week, or work through a blocker. Your goals and what you’ve shared are already here."
    static func welcomeGoal(_ goal: String) -> String {
        "We’re working toward: \(goal). Tell me what happened or what needs to change."
    }
    static let composerPlaceholder = "A goal, an update, or something to work through…"
    static let thinking = "Thinking with you…"
    static let longError = "Adler couldn’t finish this request. Try again or adjust the request."
    static let whatHappened = "What happened"
    static let threadLabel = "Conversation with Adler"
    static let openPlan = "Open plan"
    static let viewProgress = "View progress"

    // MARK: §10 Coach — Insights

    static let tryingNow = "Trying now"
    static let learned = "What we’ve learned"
    static let insightsHistory = "Earlier attempts & history"
    static let memories = "Saved context & preferences"
    static let filterAll = "All goals"
    static func attempts(_ count: Int) -> String { "\(count) attempts reported" }
    static let noAttempts = "No attempts reported yet"
    static let reviewWhenUseful = "Review after useful feedback"
    static let told = "What you told Adler"
    static let shapes = "How this shapes your plan"
    static let noChange =
        "Keep this in view at the next review. No changes were attached to this observation."

    static let recordObservation = "Observation"
    static let recordInterpretation = "Behavioural interpretation"
    static let recordChange = "Hypothesis and change"
    static let recordReports = "Dated reports"
    static let recordReview = "Review"
    static let recordUnderstanding = "Updated understanding"
    static let recordExpectedEffect = "Expected effect"
    static let recordWhatToNotice = "What to notice"
    static let recordComparison = "A fair comparison"
    static let recordWasUsed = "Was the change used?"
    static let recordForPlan = "For your plan:"
    static let recordNextQuestion = "Next question:"
    static let recordOtherExplanations = "What else could explain this?"
    static let recordOriginalPrediction = "Original prediction:"
    static let recordAgreementNote =
        "Agreeing to try a change does not establish that you used it or that it caused a result."

    // MARK: §5c Today — Learn (the learning controls are shared with this feature)

    static let pause = "Pause"
    static let resume = "Resume"
    static let finish = "Finish trying this"
    static let discussWithAdler = "Discuss with Adler"
    static let reconsider = "The evidence changed. Review this explanation before using it."
    static let paused = "Paused. Resume when this fits your life again."
    static let pendingDecision = "A revision is awaiting your choice. The agreed test is shown."
    static let suggestionOnly = "A suggestion to consider. Nothing has started yet."
    static let notAResult = "A review date is not a result."
    static let revision = "A revised suggestion"
    static let revisionNote =
        "Your agreed test below remains current until you accept this suggestion."

    // MARK: §13 Empty, loading, error

    static let emptyNoInsights = "Start with what happened."
    static let emptyNoInsightsBody =
        "Tell Adler about a session, result or obstacle. Useful observations appear here with their sources and any changes to your plan."
    static let emptyNoConversations = "No conversations yet."
    static let errorRecordGone = "This record is no longer here."
    static let errorTimeout = "This is taking longer than expected."
    static let errorNoProvider = "No AI provider is configured on this server."
    static let errorNoProviderAction = "Set up"

    // MARK: Strings this screen needs that COPY.md does not list
    //
    // Flagged in `.context/notes/coach.md` for the copy owner. Each states a fact about the
    // saved workspace or the server's limits — none of them characterises a result.

    /// `POST /api/coach` is limited to 20 messages per 60s (`server/database.ts` `limit`), and
    /// the limit is consumed before the idempotency check, so a retry storm locks the person
    /// out of their own coach. The server's own 429 sentence is shown above this.
    static let rateLimitWait = "Wait about a minute before sending again."
    /// Shown beside the in-progress indicator once a turn passes the first stage. One coach
    /// turn makes several provider calls in sequence and can legitimately exceed 60s.
    static let stillWorking = "Still working. A coaching turn can take a minute."
    /// Stopping only stops waiting: the turn keeps running on the server and its answer is
    /// saved. Retrying reuses the same `requestId`, so the saved answer is replayed rather than
    /// generated again.
    static let stoppedWaiting =
        "Adler is still working on this turn. Retry shows its answer without asking again."
    static let newConversation = "New conversation"
    static let renameConversation = "Rename conversation"
    static let deleteConversation = "Delete conversation"
    static let deleteConversationConfirm =
        "Delete this conversation? Its messages are removed. Saved plans, reports and learning records stay."
    static let conversationTitle = "Title"
    static let needsYourInput = "Needs your input"
    static let observations = "Observations"
    static let addMemory = "Add saved context"
    static let deleteMemoryConfirm =
        "Delete this saved context? Adler stops using it when suggesting plans. Records that already cite it keep their history."
    static let evidenceChanged = "Evidence has changed"
    static let sendFailed = "Your message was not sent. It is still in the field."
}
