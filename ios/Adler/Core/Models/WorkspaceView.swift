import Foundation

/// Every `/api/app/*` read carries the workspace `revision` and the account-local `today`.
/// Writes send back the last `revision` they saw; a mismatch is a 409.
nonisolated protocol WorkspaceView: Codable, Sendable {
    var revision: Int { get }
    var today: YMD { get }
}

/// The response shared by `POST /api/app/changes`, `/api/app/actions/:id/start` and
/// `/api/app/goals/:id/start`. `goal` is **omitted** (not null) when no `goalId` was sent or the
/// goal no longer exists — the one documented exception to the null-not-missing convention.
nonisolated struct WriteResult: Codable, Sendable, Equatable {
    let revision: Int
    let today: TodayView
    let goal: GoalDetailView?
}
