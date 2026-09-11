import Foundation

/// The staged wait while the first coaching turn runs.
///
/// A first goal turn takes a median of 27 s and can pass 60 s (`.context/notes/agent-system.md`
/// §3) because one `POST /api/coach` makes several provider calls in sequence. There is no
/// progress to report — the server sends nothing until the turn finishes — so this is a **time**
/// based description of what is happening, never a percentage and never a bar that fills. Each
/// stage names a real phase of the turn (read the goal, check feasibility and the literature,
/// draft the plan) in the order `Service.chat` performs them.
///
/// Nothing here claims the turn is nearly done. Past the last stage the label simply stays put
/// and a notice says it is still running.
nonisolated struct OnboardingProgressStage: Equatable, Sendable, Identifiable {
    let label: String
    /// Seconds after the request started at which this stage begins.
    let startsAt: TimeInterval

    var id: String { label }
}

nonisolated enum OnboardingProgress {
    static let stages: [OnboardingProgressStage] = [
        .init(label: OnboardingCopy.planStageReading, startsAt: 0),
        .init(label: OnboardingCopy.planStageChecking, startsAt: 12),
        .init(label: OnboardingCopy.planStageDrafting, startsAt: 30),
    ]

    /// Past this the wait is longer than the observed median run, so the app says so rather
    /// than letting the same three words sit there silently.
    static let patienceNoticeAt: TimeInterval = 75

    static func index(atElapsed elapsed: TimeInterval) -> Int {
        var current = 0
        for (offset, stage) in stages.enumerated() where elapsed >= stage.startsAt {
            current = offset
        }
        return current
    }

    static func stage(atElapsed elapsed: TimeInterval) -> OnboardingProgressStage {
        stages[index(atElapsed: elapsed)]
    }

    /// The sentence under the stage label: the usual wait, then — once it is unusual — the
    /// honest admission that it is still running.
    static func notice(atElapsed elapsed: TimeInterval) -> String {
        elapsed >= patienceNoticeAt ? OnboardingCopy.planStillWorking : OnboardingCopy.planUsualWait
    }

    /// `Reading your goal · step 1 of 3` for VoiceOver, so the stage is a position and not a
    /// promise about how much is left.
    static func accessibilityLabel(atElapsed elapsed: TimeInterval) -> String {
        let index = index(atElapsed: elapsed)
        return "\(stages[index].label) · step \(index + 1) of \(stages.count). \(notice(atElapsed: elapsed))"
    }
}
