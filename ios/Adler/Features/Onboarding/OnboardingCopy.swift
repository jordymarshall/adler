import Foundation

/// Every app-owned string in the Welcome → goal → account → first-plan flow.
///
/// Keys mirror `ios/COPY.md` §2 (Welcome), §3 (Goal-first onboarding), §4 (Sign in / Create
/// account) and the `empty.*` / `error.*` families in §13. Strings marked **(new)** are not in
/// COPY.md yet: this flow needs sentences the copy deck did not cover (the staged progress, the
/// provider gate, the saved-goal summary and the contribution card). They follow the same rules —
/// no exclamation marks, no praise, no emoji, typographic apostrophes — and are listed in
/// `.context/notes/onboarding.md` so they can be folded into COPY.md.
///
/// Server-supplied strings are never in here. Validation failures, rate limits and coach errors
/// are printed exactly as the server wrote them.
nonisolated enum OnboardingCopy {
    // MARK: Welcome (COPY.md §2)

    static let appName = "Adler"
    static let welcomeHeadline = "Following through is the hard part."
    static let welcomeBody =
        "Adler is an AI goal coach. It turns your goal into work you can do today and learns what helps you."
    static let welcomePrimary = "Start with a goal"
    static let welcomeSignIn = "I already have an account"
    static let welcomeServer = "Server"
    static let welcomeServerField = "Server address"
    static let welcomeServerTest = "Test connection"
    static let welcomeServerOk = "Reached the server."
    /// (new) The disclosure that hides the server field on first run.
    static let welcomeAdvanced = "Advanced"
    /// (new) Shown under the field before any test has run.
    static let welcomeServerUntested = "Not tested yet."
    /// (new) The field will not parse as an address.
    static let welcomeServerInvalid = "That is not an address Adler can reach."

    // MARK: Goal-first onboarding (COPY.md §3)

    static let onboardingEyebrow = "ONE PLACE TO START"
    static let onboardingTitle = "What would you like to achieve?"
    static let onboardingBody =
        "Describe it in your own words. We’ll work out the next step together."
    static let onboardingPlaceholder = "Something you keep meaning to do…"
    static let onboardingContinue = "Continue"
    static let onboardingFieldLabel = "What do you want to achieve?"
    static func draftKept(_ text: String) -> String { "Your goal is saved: “\(text)”" }

    /// (new) Heading over the example chips.
    static let onboardingExamples = "FOR EXAMPLE"
    /// (new) Says plainly that a chip fills the field rather than sending anything.
    static let onboardingExamplesHint = "Tap one to fill the field, then make it yours."
    /// Fictional examples. They are illustrations of the shape of a useful goal — an outcome,
    /// an amount and a date — not claims about anyone's results.
    static let onboardingExampleGoals = [
        "Publish 3 portfolio case studies by December 15",
        "Run a 10k without walking by the end of April",
        "Read 12 books this year, 20 pages on weekday evenings",
    ]
    /// (new) Only announced within 100 characters of the limit.
    static func charactersLeft(_ count: Int) -> String { "\(count) characters left" }
    static let goalCharacterLimit = 1500

    // MARK: Sign in / Create account (COPY.md §4)

    static let authEyebrow = "YOUR ADLER ACCOUNT"
    static let authTitleRegister = "Create an account to save your goal."
    static let authTitleLogin = "Welcome back."
    static let authBody = "Save your goal, plan and conversations in one place."
    static let authTabRegister = "Create account"
    static let authTabLogin = "Sign in"
    static let authSegmentLabel = "Account"
    static let authUsername = "Username"
    static let authPassword = "Password"
    static let authHint =
        "Use at least 10 characters. Keep your password somewhere safe; email recovery is not configured."
    static let authBusy = "Opening…"
    static let authFailed = "Could not sign in."
    /// (new) The detected zone is shown, never silently assumed.
    static func authTimeZone(_ identifier: String) -> String {
        "Time zone · \(identifier), detected on this device. Change it in Settings."
    }
    /// (new) Username rules, stated before the server refuses.
    static let authUsernameHint = "Letters, numbers and . _ - @ — at least 3 characters."

    // MARK: First plan hand-off (new)

    static let planTitle = "Working out a first plan"
    static let planStageReading = "Reading your goal"
    static let planStageChecking = "Checking what fits"
    static let planStageDrafting = "Drafting a first plan"
    static let planUsualWait = "A first plan usually takes about half a minute."
    static let planStillWorking =
        "Still working. A first plan can take a minute or more when Adler checks the research."
    static let planCancel = "Finish in Coach"
    static let planContinueInCoach = "Continue in Coach"
    static let planAnswerPlaceholder = "Answer in your own words…"
    static let planAnswerSend = "Send"
    static let planYouLabel = "YOU"

    static let planSavedTitle = "Goal saved"
    static let planMilestones = "MILESTONES"
    static let planFirstAction = "FIRST ACTION"
    static let planNoPlanChip = "Goal saved · plan not started"
    static let planNoPlanBody =
        "Your outcome is saved. No milestones or actions were created, so there is nothing to do yet."
    static let planChooseFirstAction = "Choose the first action with Adler"
    /// COPY.md `goal.startPlan` / `goal.startingPlan`.
    static let planStartPlan = "Start plan"
    static let planStartingPlan = "Starting plan"
    /// (new) Why the control is here: a Draft plan puts nothing on Today.
    static let planNotStartedBody =
        "The plan is saved as a draft. Starting it schedules the actions, so today’s work appears on Today."
    static let planGoToToday = "Go to Today"
    static let planOpenGoal = "Open the goal"

    static let providerGateTitle = "No AI provider is configured on this server."
    static let providerGateBody =
        "Adler needs a model before it can read your goal. Your goal is kept — set a provider up and come back to it."
    static let providerGateAction = "Set up"
    static let providerGateSkip = "Not now"

    static let planFailedLong = "Adler couldn’t finish this request. Try again or adjust the request."
    static let planFailedDisclosure = "What happened"
    static let planRetry = "Retry"

    // MARK: What you contribute / what Adler manages (new)

    static let contributeTitle = "What you contribute, what Adler manages"
    static let contributeYou =
        "You: what you want, what actually happened, and what got in the way. Short and honest beats complete."
    static let contributeAdler =
        "Adler: the plan, the next action, the checkpoints, and a reason you can inspect for every change it proposes."
    static let contributeLimit =
        "Adler does not know anything you have not told it, and it never books time without asking."
    static let contributeDismiss = "Got it"
    /// Shown once. Stored under this key so Today can take the card over later.
    static let contributeSeenKey = "adler.onboarding.contributionSeen"
}
