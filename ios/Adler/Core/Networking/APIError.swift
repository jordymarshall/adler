import Foundation

nonisolated enum TransportKind: String, Sendable, Equatable {
    case offline
    case timeout
    case cancelled
    case other
}

/// The single error type every Core call throws. The UI maps these onto the ErrorBanner
/// variants in DESIGN.md §4.18; `server` messages are user-facing prose and are shown verbatim.
nonisolated enum APIError: Error, Sendable, Equatable {
    /// 401. The session cookie expired or was never set.
    case unauthenticated
    /// 409. The workspace moved on; refetch, then retry with `current` and the same requestId.
    case staleRevision(current: Int)
    /// Any other non-2xx with an `{ "error": … }` body. Show `message` as written.
    case server(message: String, status: Int)
    /// No response: offline, timed out, or cancelled.
    case transport(message: String, kind: TransportKind)
    /// A 2xx body that did not match the contract.
    case decoding(message: String)
    /// The request could not be formed (usually a bad server URL).
    case invalidRequest(message: String)

    /// A timed-out write may still have been applied. Retry with the **same** requestId.
    var isRetryableWithSameRequestID: Bool {
        if case .transport(_, let kind) = self { return kind == .timeout || kind == .offline }
        return false
    }

    var isOffline: Bool {
        if case .transport(_, let kind) = self { return kind == .offline }
        return false
    }

    /// 404 — the record is gone. DESIGN.md §4.19 turns this into `error.recordGone`.
    var isNotFound: Bool {
        if case .server(_, let status) = self { return status == 404 }
        return false
    }

    var isRateLimited: Bool {
        if case .server(_, let status) = self { return status == 429 }
        return false
    }

    /// The server's own wording where there is one, otherwise a plain fallback. The UI should
    /// prefer this over inventing copy.
    var serverMessage: String? {
        if case .server(let message, _) = self { return message }
        return nil
    }
}

nonisolated extension APIError: LocalizedError {
    var errorDescription: String? {
        switch self {
        case .unauthenticated:
            "Sign in to your workspace."
        case .staleRevision:
            "This workspace changed in another channel. Review the latest records and retry."
        case .server(let message, _):
            message
        case .transport(let message, _):
            message
        case .decoding(let message):
            message
        case .invalidRequest(let message):
            message
        }
    }
}
