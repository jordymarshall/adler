import Foundation

// Wire primitives shared by every view payload.
//
// The server keeps dates as strings (`YYYY-MM-DD` for account-local days, ISO-8601 with
// fractional seconds for instants). We keep the raw string verbatim so a value round-trips
// unchanged, and expose parsing helpers that need the workspace time zone supplied by
// `GET /api/app/session` — a day boundary only means something in that zone.
//
// Every model type in Core/Models is `nonisolated`. The target builds with
// SWIFT_DEFAULT_ACTOR_ISOLATION=MainActor, which would otherwise give each type a
// main-actor-isolated `Codable` conformance that the (nonisolated) APIClient cannot use.

// MARK: - YMD

/// An account-local calendar day, `YYYY-MM-DD`. Never validated on decode: an unparseable
/// value still renders, it just has no `Date`.
nonisolated struct YMD: Codable, Sendable, Hashable, Comparable, CustomStringConvertible,
    ExpressibleByStringLiteral
{
    let raw: String

    init(_ raw: String) { self.raw = raw }
    init(stringLiteral value: StringLiteralType) { self.raw = value }

    init(from decoder: any Decoder) throws {
        raw = try decoder.singleValueContainer().decode(String.self)
    }

    func encode(to encoder: any Encoder) throws {
        var container = encoder.singleValueContainer()
        try container.encode(raw)
    }

    var description: String { raw }

    /// ISO day strings sort lexicographically, which is how the server orders them too.
    static func < (lhs: YMD, rhs: YMD) -> Bool { lhs.raw < rhs.raw }

    /// `year`/`month`/`day` only — no time zone attached.
    var dateComponents: DateComponents? {
        let parts = raw.split(separator: "-", omittingEmptySubsequences: false)
        guard parts.count == 3,
            let year = Int(parts[0]), let month = Int(parts[1]), let day = Int(parts[2]),
            parts[0].count == 4, parts[1].count == 2, parts[2].count == 2
        else { return nil }
        return DateComponents(year: year, month: month, day: day)
    }

    /// Midnight at the start of this day in the workspace time zone.
    func date(in timeZone: TimeZone) -> Date? {
        guard var components = dateComponents else { return nil }
        components.timeZone = timeZone
        return Self.calendar.date(from: components)
    }

    /// Midday, which is the anchor the web uses when it formats a bare day for display.
    func noon(in timeZone: TimeZone) -> Date? {
        guard var components = dateComponents else { return nil }
        components.timeZone = timeZone
        components.hour = 12
        return Self.calendar.date(from: components)
    }

    func adding(days: Int, in timeZone: TimeZone) -> YMD? {
        guard let start = date(in: timeZone),
            let moved = Self.calendar.date(byAdding: .day, value: days, to: start)
        else { return nil }
        return YMD(moved, in: timeZone)
    }

    /// Whole days from this day to `other`, both read in the workspace time zone.
    func days(until other: YMD, in timeZone: TimeZone) -> Int? {
        guard let from = date(in: timeZone), let to = other.date(in: timeZone) else { return nil }
        var calendar = Self.calendar
        calendar.timeZone = timeZone
        return calendar.dateComponents([.day], from: from, to: to).day
    }

    init(_ date: Date, in timeZone: TimeZone) {
        var calendar = Self.calendar
        calendar.timeZone = timeZone
        let parts = calendar.dateComponents([.year, .month, .day], from: date)
        raw = String(
            format: "%04d-%02d-%02d", parts.year ?? 0, parts.month ?? 0, parts.day ?? 0)
    }

    static func today(in timeZone: TimeZone, now: Date = Date()) -> YMD {
        YMD(now, in: timeZone)
    }

    static let calendar: Calendar = {
        var calendar = Calendar(identifier: .gregorian)
        calendar.locale = Locale(identifier: "en_US_POSIX")
        return calendar
    }()
}

// MARK: - Timestamp

/// An ISO-8601 instant such as `2026-09-11T05:53:54.561Z`. Fractional seconds are optional;
/// an explicit UTC offset (`-04:00`) parses too.
nonisolated struct Timestamp: Codable, Sendable, Hashable, Comparable, CustomStringConvertible,
    ExpressibleByStringLiteral
{
    let raw: String

    init(_ raw: String) { self.raw = raw }
    init(stringLiteral value: StringLiteralType) { self.raw = value }

    init(from decoder: any Decoder) throws {
        raw = try decoder.singleValueContainer().decode(String.self)
    }

    func encode(to encoder: any Encoder) throws {
        var container = encoder.singleValueContainer()
        try container.encode(raw)
    }

    var description: String { raw }

    /// Compare instants when both parse, otherwise fall back to string order so sorts stay total.
    static func < (lhs: Timestamp, rhs: Timestamp) -> Bool {
        if let left = lhs.date, let right = rhs.date { return left < right }
        return lhs.raw < rhs.raw
    }

    var date: Date? { try? Self.style.parse(raw) }

    /// The account-local day this instant falls on.
    func day(in timeZone: TimeZone) -> YMD? {
        date.map { YMD($0, in: timeZone) }
    }

    init(_ date: Date) {
        raw = date.formatted(Self.style)
    }

    private static let style = Date.ISO8601FormatStyle(includingFractionalSeconds: true)
}

// MARK: - Unknown-tolerant enums

/// Server enums grow. Every `String`-backed enum in this module adopts this so an unrecognised
/// value decodes to `.unknown` instead of failing the whole payload.
///
/// Where `unknown` is already a real domain value (`ExecutionStatus`, `ActivityState`,
/// availability `coverage`, review `exposure`, streak day `status`, barrier `status`) the
/// fallback case *is* that value, which is the honest reading either way.
nonisolated protocol UnknownTolerantEnum: RawRepresentable, Codable, Sendable, Hashable,
    CaseIterable
where RawValue == String {
    static var unknown: Self { get }
}

// A protocol extension does not inherit the conforming type's `nonisolated`, so each member
// says so itself; otherwise the synthesized conformance is main-actor isolated.
extension UnknownTolerantEnum {
    nonisolated init(from decoder: any Decoder) throws {
        let raw = try decoder.singleValueContainer().decode(String.self)
        self = Self(rawValue: raw) ?? .unknown
    }

    nonisolated func encode(to encoder: any Encoder) throws {
        var container = encoder.singleValueContainer()
        try container.encode(rawValue)
    }

    nonisolated var isUnknown: Bool { self == .unknown }
}

// MARK: - Opaque JSON

/// `Change.values` is a JSON *string*, and `ProposalView.before[]` is opaque JSON in the
/// command catalog's shape. Neither has a fixed schema, so they decode lazily into this.
nonisolated enum JSONValue: Codable, Sendable, Hashable {
    case null
    case bool(Bool)
    case number(Double)
    case string(String)
    case array([JSONValue])
    case object([String: JSONValue])

    init(from decoder: any Decoder) throws {
        let container = try decoder.singleValueContainer()
        if container.decodeNil() {
            self = .null
        } else if let value = try? container.decode(Bool.self) {
            self = .bool(value)
        } else if let value = try? container.decode(Double.self) {
            self = .number(value)
        } else if let value = try? container.decode(String.self) {
            self = .string(value)
        } else if let value = try? container.decode([JSONValue].self) {
            self = .array(value)
        } else if let value = try? container.decode([String: JSONValue].self) {
            self = .object(value)
        } else {
            throw DecodingError.dataCorruptedError(
                in: container, debugDescription: "Unsupported JSON value.")
        }
    }

    func encode(to encoder: any Encoder) throws {
        var container = encoder.singleValueContainer()
        switch self {
        case .null: try container.encodeNil()
        case .bool(let value): try container.encode(value)
        case .number(let value): try container.encode(value)
        case .string(let value): try container.encode(value)
        case .array(let value): try container.encode(value)
        case .object(let value): try container.encode(value)
        }
    }

    subscript(key: String) -> JSONValue? {
        if case .object(let fields) = self { return fields[key] }
        return nil
    }

    var stringValue: String? { if case .string(let value) = self { return value }; return nil }
    var doubleValue: Double? { if case .number(let value) = self { return value }; return nil }
    var intValue: Int? { doubleValue.map(Int.init) }
    var boolValue: Bool? { if case .bool(let value) = self { return value }; return nil }
    var arrayValue: [JSONValue]? { if case .array(let value) = self { return value }; return nil }
    var objectValue: [String: JSONValue]? {
        if case .object(let value) = self { return value }
        return nil
    }
    var isNull: Bool { self == .null }

    /// Decode a JSON *string* field (`Change.values`) into a tree.
    static func decoding(jsonString: String) -> JSONValue? {
        guard let data = jsonString.data(using: .utf8) else { return nil }
        return try? JSONDecoder().decode(JSONValue.self, from: data)
    }

    /// Compact JSON with sorted keys, written here rather than by `JSONEncoder` so the exact
    /// bytes are predictable: whole numbers stay integers (`25`, not `25.0`) and non-ASCII text
    /// such as the `Didn’t happen` apostrophe is not escaped. `Change.values` is this string.
    var serialized: String {
        switch self {
        case .null:
            "null"
        case .bool(let value):
            value ? "true" : "false"
        case .number(let value):
            Self.number(value)
        case .string(let value):
            Self.quote(value)
        case .array(let values):
            "[" + values.map(\.serialized).joined(separator: ",") + "]"
        case .object(let fields):
            "{"
                + fields.keys.sorted()
                .map { "\(Self.quote($0)):\(fields[$0]!.serialized)" }
                .joined(separator: ",") + "}"
        }
    }

    private static func number(_ value: Double) -> String {
        guard value.isFinite else { return "null" }
        if value == value.rounded(), abs(value) < 1e15 {
            return String(Int64(value))
        }
        return String(value)
    }

    private static func quote(_ value: String) -> String {
        var out = "\""
        for character in value.unicodeScalars {
            switch character {
            case "\"": out += "\\\""
            case "\\": out += "\\\\"
            case "\n": out += "\\n"
            case "\r": out += "\\r"
            case "\t": out += "\\t"
            default:
                if character.value < 0x20 {
                    out += String(format: "\\u%04x", character.value)
                } else {
                    out.unicodeScalars.append(character)
                }
            }
        }
        return out + "\""
    }
}

nonisolated extension JSONValue {
    /// Convenience builders so call sites read like the command catalog.
    static func of(_ value: String) -> JSONValue { .string(value) }
    static func of(_ value: Int) -> JSONValue { .number(Double(value)) }
    static func of(_ value: Double) -> JSONValue { .number(value) }
    static func of(_ value: Bool) -> JSONValue { .bool(value) }
    static func of(_ value: YMD) -> JSONValue { .string(value.raw) }
    static func of(_ value: Timestamp) -> JSONValue { .string(value.raw) }
    static func of(_ values: [String]) -> JSONValue { .array(values.map(JSONValue.string)) }
    static func of(_ values: [Int]) -> JSONValue {
        .array(values.map { .number(Double($0)) })
    }
}
