import Foundation

nonisolated enum AppTab: String, Sendable, Hashable, CaseIterable {
    case today
    case goals
    case coach
    case calendar
}

nonisolated enum TodayCard: String, Sendable, Hashable, CaseIterable {
    case doNext = "do"
    case progress
    case learn
}

nonisolated enum SettingsPage: String, Sendable, Hashable, CaseIterable {
    case provider
    case checkIns = "check-ins"
    case connections
    case program
    case server
    case about
}

/// The `adler://` destinations, parsed from a URL and buildable back into one.
///
/// Two spellings are accepted for the same place because two documents generate them:
/// DESIGN.md §2.4 (what the app's own links use) writes `adler://goal/<id>` and
/// `adler://coach/insights?record=<id>`, while the contract §7 (what the *server* puts in
/// `SourceView.deepLink`) writes `adler://goals/<id>` and `adler://insights/<id>`. Both resolve.
/// `url` emits the server's spelling so a link copied out of the app matches saved records.
nonisolated enum AppRoute: Sendable, Hashable {
    case today(card: TodayCard)
    case goals
    case goal(id: String, recordId: String?)
    /// The conversation list, optionally scoped to a goal's folder.
    case coach(goalId: String?)
    case conversation(id: String, messageId: String?)
    case insights(recordId: String?, decisionId: String?, memoryId: String?)
    case calendar(start: YMD?, goalId: String?)
    case settings(page: SettingsPage?)

    static let scheme = "adler"

    // MARK: - Parsing

    init?(url: URL) {
        guard let components = URLComponents(url: url, resolvingAgainstBaseURL: false),
            components.scheme?.lowercased() == Self.scheme
        else { return nil }

        // `adler://today?card=learn` puts "today" in `host`; `adler:///today` puts it in `path`.
        var segments = (components.host.map { [$0] } ?? []) + components.path
            .split(separator: "/").map(String.init)
        segments = segments.compactMap {
            $0.removingPercentEncoding ?? $0
        }
        guard let root = segments.first?.lowercased() else { return nil }
        let rest = Array(segments.dropFirst())
        let query = components.queryItems ?? []
        func value(_ name: String) -> String? {
            query.first { $0.name == name }?.value.flatMap { $0.isEmpty ? nil : $0 }
        }

        switch root {
        case "today":
            self = .today(card: value("card").flatMap(TodayCard.init(rawValue:)) ?? .doNext)
        case "goal", "goals":
            if let id = rest.first {
                self = .goal(id: id, recordId: value("record"))
            } else if let id = value("goal") {
                self = .goal(id: id, recordId: value("record"))
            } else {
                self = .goals
            }
        case "coach":
            if let first = rest.first {
                if first.lowercased() == "insights" {
                    self = .insights(
                        recordId: value("record") ?? rest.dropFirst().first,
                        decisionId: value("decision"), memoryId: value("memory"))
                } else {
                    self = .conversation(id: first, messageId: value("message"))
                }
            } else {
                self = .coach(goalId: value("goal"))
            }
        case "insights":
            self = .insights(
                recordId: rest.first ?? value("record"),
                decisionId: value("decision"), memoryId: value("memory"))
        case "calendar":
            self = .calendar(start: value("start").map { YMD($0) }, goalId: value("goal"))
        case "settings":
            self = .settings(page: rest.first.flatMap { SettingsPage(rawValue: $0.lowercased()) })
        default:
            return nil
        }
    }

    init?(string: String) {
        guard let url = URL(string: string) else { return nil }
        self.init(url: url)
    }

    // MARK: - Building

    var url: URL {
        var components = URLComponents()
        components.scheme = Self.scheme
        var query: [URLQueryItem] = []

        switch self {
        case .today(let card):
            components.host = "today"
            if card != .doNext { query.append(URLQueryItem(name: "card", value: card.rawValue)) }
        case .goals:
            components.host = "goals"
        case .goal(let id, let recordId):
            components.host = "goals"
            components.path = "/\(id)"
            if let recordId { query.append(URLQueryItem(name: "record", value: recordId)) }
        case .coach(let goalId):
            components.host = "coach"
            if let goalId { query.append(URLQueryItem(name: "goal", value: goalId)) }
        case .conversation(let id, let messageId):
            components.host = "coach"
            components.path = "/\(id)"
            if let messageId { query.append(URLQueryItem(name: "message", value: messageId)) }
        case .insights(let recordId, let decisionId, let memoryId):
            components.host = "insights"
            if let recordId { components.path = "/\(recordId)" }
            if let decisionId { query.append(URLQueryItem(name: "decision", value: decisionId)) }
            if let memoryId { query.append(URLQueryItem(name: "memory", value: memoryId)) }
        case .calendar(let start, let goalId):
            components.host = "calendar"
            if let start { query.append(URLQueryItem(name: "start", value: start.raw)) }
            if let goalId { query.append(URLQueryItem(name: "goal", value: goalId)) }
        case .settings(let page):
            components.host = "settings"
            if let page { components.path = "/\(page.rawValue)" }
        }

        components.queryItems = query.isEmpty ? nil : query
        return components.url ?? URL(string: "\(Self.scheme)://today")!
    }

    /// Which tab to select. `nil` for Settings, which is a sheet over whichever tab is showing.
    var tab: AppTab? {
        switch self {
        case .today: .today
        case .goals, .goal: .goals
        case .coach, .conversation, .insights: .coach
        case .calendar: .calendar
        case .settings: nil
        }
    }

    /// Coach is segmented; Insights is the second segment.
    var showsInsightsSegment: Bool {
        if case .insights = self { return true }
        return false
    }
}
