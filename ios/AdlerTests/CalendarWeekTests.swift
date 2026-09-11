import XCTest

@testable import Adler

/// Week paging, hour-grid geometry, entry layout and the honest reading of availability.
/// All pure value code — no view, no store, no network.
nonisolated final class CalendarWeekTests: XCTestCase {
    private let zone = TimeZone(identifier: "America/Toronto")!

    // MARK: Week arithmetic

    func testMondayOfEachDayInTheSameWeek() {
        // 2026-09-07 is a Monday.
        for (offset, day) in [
            "2026-09-07", "2026-09-08", "2026-09-09", "2026-09-10", "2026-09-11", "2026-09-12",
            "2026-09-13",
        ].enumerated() {
            XCTAssertEqual(
                CalendarWeek.monday(of: YMD(day), in: zone).raw, "2026-09-07",
                "day \(offset) (\(day)) belongs to the week starting 2026-09-07")
        }
        XCTAssertEqual(CalendarWeek.monday(of: "2026-09-14", in: zone).raw, "2026-09-14")
        XCTAssertEqual(CalendarWeek.monday(of: "2026-09-06", in: zone).raw, "2026-08-31")
    }

    func testPagingMovesWholeWeeks() {
        let start = YMD("2026-09-07")
        XCTAssertEqual(CalendarWeek.advancing(start, by: 1, in: zone).raw, "2026-09-14")
        XCTAssertEqual(CalendarWeek.advancing(start, by: -1, in: zone).raw, "2026-08-31")
        XCTAssertEqual(CalendarWeek.advancing(start, by: 3, in: zone).raw, "2026-09-28")
    }

    func testPagingAcrossADaylightSavingChangeStaysOnMonday() {
        // Toronto leaves DST on 2026-11-01, inside this week.
        let week = YMD("2026-10-26")
        let next = CalendarWeek.advancing(week, by: 1, in: zone)
        XCTAssertEqual(next.raw, "2026-11-02")
        XCTAssertEqual(CalendarWeek.monday(of: next, in: zone).raw, "2026-11-02")
    }

    func testRangeLabel() {
        XCTAssertEqual(
            CalendarWeek.rangeLabel(
                from: "2026-10-13", to: "2026-10-19", in: zone, today: "2026-10-13"),
            "13–19 Oct")
        XCTAssertEqual(
            CalendarWeek.rangeLabel(
                from: "2026-09-28", to: "2026-10-04", in: zone, today: "2026-09-28"),
            "28 Sep – 4 Oct")
        XCTAssertEqual(
            CalendarWeek.rangeLabel(
                from: "2025-12-29", to: "2026-01-04", in: zone, today: "2026-09-11"),
            "29 Dec 2025 – 4 Jan 2026")
    }

    // MARK: Times

    func testDayMinutesParsing() {
        XCTAssertEqual(DayMinutes.parse("09:00"), 540)
        XCTAssertEqual(DayMinutes.parse("00:00"), 0)
        XCTAssertEqual(DayMinutes.parse("23:59"), 1439)
        XCTAssertNil(DayMinutes.parse("9:00"))
        XCTAssertNil(DayMinutes.parse("24:00"))
        XCTAssertNil(DayMinutes.parse(""))
        XCTAssertEqual(DayMinutes.text(540), "09:00")
        XCTAssertEqual(DayMinutes.text(1439), "23:59")
    }

    func testInstantIsReadInTheWorkspaceZone() throws {
        let instant = try XCTUnwrap(
            DayMinutes.instant(day: "2026-09-11", minutes: 9 * 60, in: zone))
        XCTAssertEqual(DayMinutes.of(instant, in: zone), 9 * 60)
        // 09:00 in Toronto is 13:00 UTC in September.
        XCTAssertEqual(DayMinutes.of(instant, in: TimeZone(identifier: "UTC")!), 13 * 60)
    }

    // MARK: The hour window

    func testWindowUsesWorkingHoursWhenNothingFallsOutside() {
        let window = HourWindow.covering(
            workingHours: WorkingHours(start: "09:00", end: "17:00", days: [1], sessionMinutes: 25),
            entries: [], in: zone)
        XCTAssertEqual(window.startMinute, 9 * 60)
        XCTAssertEqual(window.endMinute, 17 * 60)
        XCTAssertEqual(window.hours, Array(9...17))
        XCTAssertEqual(window.height, 8 * 72, accuracy: 0.001)
    }

    func testWindowWidensForAnEntryOutsideWorkingHours() throws {
        let start = try XCTUnwrap(DayMinutes.instant(day: "2026-09-11", minutes: 7 * 60 + 30, in: zone))
        let entry = CalendarEntry(
            id: "a", kind: .busy(provider: "google"), title: "Standup", start: start,
            end: start.addingTimeInterval(1800))
        let window = HourWindow.covering(
            workingHours: WorkingHours(start: "09:00", end: "17:00", days: [1], sessionMinutes: 25),
            entries: [entry], in: zone)
        XCTAssertEqual(window.startMinute, 7 * 60)
        XCTAssertEqual(window.endMinute, 17 * 60)
    }

    func testWindowIsNeverNarrowerThanFourHours() {
        let window = HourWindow.covering(
            workingHours: WorkingHours(start: "09:00", end: "10:00", days: [1], sessionMinutes: 25),
            entries: [], in: zone)
        XCTAssertEqual(window.endMinute - window.startMinute, 4 * 60)
    }

    func testSpanClampsToTheWindowAndKeepsALegibleMinimum() {
        let window = HourWindow(startMinute: 9 * 60, endMinute: 17 * 60)
        let inside = window.span(fromMinute: 10 * 60, toMinute: 11 * 60)
        XCTAssertEqual(inside?.top ?? -1, 72, accuracy: 0.001)
        XCTAssertEqual(inside?.height ?? -1, 72, accuracy: 0.001)

        let clipped = window.span(fromMinute: 8 * 60, toMinute: 10 * 60)
        XCTAssertEqual(clipped?.top ?? -1, 0, accuracy: 0.001)
        XCTAssertEqual(clipped?.height ?? -1, 72, accuracy: 0.001)

        let tiny = window.span(fromMinute: 10 * 60, toMinute: 10 * 60 + 5)
        XCTAssertEqual(tiny?.height ?? -1, 18, accuracy: 0.001)

        XCTAssertNil(window.span(fromMinute: 18 * 60, toMinute: 19 * 60))
        XCTAssertNil(window.span(fromMinute: 6 * 60, toMinute: 7 * 60))
    }

    // MARK: Lane packing

    private func entry(_ id: String, _ from: Int, _ to: Int) -> CalendarEntry {
        CalendarEntry(
            id: id, kind: .tentative, title: id,
            start: DayMinutes.instant(day: "2026-09-11", minutes: from, in: zone)!,
            end: DayMinutes.instant(day: "2026-09-11", minutes: to, in: zone)!)
    }

    func testSequentialEntriesEachGetTheFullWidth() {
        let placed = EntryLayout.place([
            entry("a", 540, 570), entry("b", 600, 630), entry("c", 660, 690),
        ])
        XCTAssertEqual(placed.map(\.lane), [0, 0, 0])
        XCTAssertEqual(placed.map(\.laneCount), [1, 1, 1])
    }

    func testOverlappingEntriesSplitTheColumn() {
        let placed = EntryLayout.place([entry("a", 540, 620), entry("b", 570, 660)])
        XCTAssertEqual(placed.map(\.lane), [0, 1])
        XCTAssertEqual(Set(placed.map(\.laneCount)), [2])
    }

    func testAClusterReportsOneLaneCountAndTheNextClusterResets() {
        let placed = EntryLayout.place([
            entry("a", 540, 600), entry("b", 550, 610), entry("c", 560, 620),
            entry("d", 700, 730),
        ])
        let byID = Dictionary(uniqueKeysWithValues: placed.map { ($0.entry.id, $0) })
        XCTAssertEqual(byID["a"]?.laneCount, 3)
        XCTAssertEqual(byID["c"]?.lane, 2)
        XCTAssertEqual(byID["d"]?.laneCount, 1)
        XCTAssertEqual(byID["d"]?.lane, 0)
    }

    func testAFreedLaneIsReused() {
        // b ends before c starts, so c takes lane 1 again rather than opening a third.
        let placed = EntryLayout.place([
            entry("a", 540, 720), entry("b", 550, 580), entry("c", 600, 640),
        ])
        let byID = Dictionary(uniqueKeysWithValues: placed.map { ($0.entry.id, $0) })
        XCTAssertEqual(byID["b"]?.lane, 1)
        XCTAssertEqual(byID["c"]?.lane, 1)
        XCTAssertEqual(byID["a"]?.laneCount, 2)
    }

    // MARK: Entries from the payload

    private func fixtureWeek() throws -> CalendarView {
        try Fixtures.load(CalendarView.self, "calendar").response
    }

    func testFixtureWeekBuildsTentativeEntriesAndNoBookings() throws {
        let week = try fixtureWeek()
        let entries = week.entries
        XCTAssertEqual(entries.count, week.tentative.count)
        XCTAssertTrue(entries.allSatisfy { $0.kind == .tentative })
        // A suggestion is never a booking and never carries a reported status.
        XCTAssertTrue(entries.allSatisfy { $0.statusLabel == nil })
        XCTAssertEqual(entries.compactMap(\.goalId).count, entries.count)
    }

    func testEntriesAreGroupedByTheWorkspaceDay() throws {
        let week = try fixtureWeek()
        let today = week.today
        XCTAssertEqual(week.entries(on: today).count, week.tentative.count)
        XCTAssertTrue(week.entries(on: week.weekStart).isEmpty)
    }

    func testWeekStartAndEndSpanSevenDays() throws {
        let week = try fixtureWeek()
        XCTAssertEqual(week.days.count, 7)
        XCTAssertEqual(
            week.weekStart.days(until: week.weekEnd, in: week.resolvedTimeZone), 6)
        XCTAssertEqual(
            CalendarWeek.monday(of: week.today, in: week.resolvedTimeZone), week.weekStart)
    }

    func testABookingAndALocalBlockAreDifferentKinds() throws {
        let week = try fixtureWeek()
        let start = Timestamp("2026-09-11T13:00:00.000Z")
        let end = Timestamp("2026-09-11T13:25:00.000Z")
        func block(_ id: String, _ provider: CalendarProvider, eventId: String?) -> CalendarBlockView {
            CalendarBlockView(
                id: id, goalId: "guide", action: "Write 400 words", start: start, end: end,
                provider: provider, status: .scheduled, eventId: eventId, checkInId: nil,
                goalTitle: "Write the onboarding guide", actionOutcome: nil)
        }
        let patched = CalendarView(
            revision: week.revision, today: week.today, weekStart: week.weekStart,
            weekEnd: week.weekEnd, days: week.days, tentative: week.tentative,
            blocks: [block("local-1", .local, eventId: nil), block("booked-1", .google, eventId: "e1")],
            busy: week.busy, availability: week.availability, unplaced: week.unplaced,
            overBudget: week.overBudget, review: week.review, workingHours: week.workingHours,
            timeZone: week.timeZone, basis: week.basis, calendars: week.calendars)

        let kinds = patched.entries.map(\.kind)
        XCTAssertTrue(kinds.contains(.adlerBlock))
        XCTAssertTrue(kinds.contains(.booking(provider: .google)))
        XCTAssertEqual(
            patched.entries.filter { $0.kind == .adlerBlock }.first?.statusLabel, "Scheduled")
    }

    func testATentativeBlockIsDroppedOnceItsActionIsBooked() throws {
        let week = try fixtureWeek()
        let suggestion = try XCTUnwrap(week.tentative.first)
        let booked = CalendarBlockView(
            id: suggestion.id, goalId: suggestion.goalId, action: suggestion.title,
            start: suggestion.start, end: suggestion.end, provider: .google, status: .scheduled,
            eventId: "event", checkInId: nil, goalTitle: suggestion.goalTitle, actionOutcome: nil)
        let patched = CalendarView(
            revision: week.revision, today: week.today, weekStart: week.weekStart,
            weekEnd: week.weekEnd, days: week.days, tentative: week.tentative, blocks: [booked],
            busy: week.busy, availability: week.availability, unplaced: week.unplaced,
            overBudget: week.overBudget, review: week.review, workingHours: week.workingHours,
            timeZone: week.timeZone, basis: week.basis, calendars: week.calendars)
        XCTAssertFalse(
            patched.entries.contains { $0.kind == .tentative && $0.actionId == suggestion.id })
    }

    // MARK: Availability

    func testAvailabilityIsUnknownWithNoConnectedCalendar() throws {
        let week = try fixtureWeek()
        let status = AvailabilityStatus.read(week)
        XCTAssertTrue(status.isUnknown)
        XCTAssertEqual(status.headline, CalendarCopy.unknownAvailability)
        XCTAssertEqual(status.detail, CalendarCopy.notConnected)
    }

    func testConnectedButUncheckedIsStillUnknown() throws {
        let week = try fixtureWeek()
        let patched = week.replacingCalendars(
            CalendarStatus(
                google: GoogleCalendarStatus(configured: true, connected: true),
                apple: AppleCalendarStatus(connected: false)))
        let status = AvailabilityStatus.read(patched)
        XCTAssertTrue(status.isUnknown)
        XCTAssertEqual(status.detail, CalendarCopy.notChecked)
    }

    func testFreshAndStaleCoverageReadDifferently() throws {
        let week = try fixtureWeek()
        let now = Date()
        let connected = CalendarStatus(
            google: GoogleCalendarStatus(configured: true, connected: true),
            apple: AppleCalendarStatus(connected: false))

        let fresh = week
            .replacingCalendars(connected)
            .replacingAvailability(
                CalendarAvailability(
                    coverage: .checked, checkedAt: Timestamp(now.addingTimeInterval(-60)),
                    provider: "google", start: nil, end: nil))
        XCTAssertFalse(AvailabilityStatus.read(fresh, now: now).isUnknown)
        XCTAssertNil(AvailabilityStatus.read(fresh, now: now).detail)

        let stale = week
            .replacingCalendars(connected)
            .replacingAvailability(
                CalendarAvailability(
                    coverage: .checked, checkedAt: Timestamp(now.addingTimeInterval(-600)),
                    provider: "google", start: nil, end: nil))
        XCTAssertEqual(AvailabilityStatus.read(stale, now: now).detail, CalendarCopy.recheck)
    }

    // MARK: Placement

    func testPlacementIsClampedIntoTheWorkingWindow() {
        let hours = WorkingHours(start: "09:00", end: "17:00", days: [1], sessionMinutes: 25)
        let early = PlacementDraft(day: "2026-09-11", startMinute: 6 * 60, durationMinutes: 25)
        XCTAssertEqual(early.clamped(to: hours).startMinute, 9 * 60)

        let late = PlacementDraft(day: "2026-09-11", startMinute: 16 * 60 + 50, durationMinutes: 25)
        XCTAssertEqual(late.clamped(to: hours).startMinute, 17 * 60 - 25)

        let huge = PlacementDraft(day: "2026-09-11", startMinute: 12 * 60, durationMinutes: 600)
        XCTAssertEqual(huge.clamped(to: hours).startMinute, 9 * 60)
    }

    func testPlacementRefusesThePastAConflictAndAnOverBudgetWeek() throws {
        let now = try XCTUnwrap(DayMinutes.instant(day: "2026-09-11", minutes: 10 * 60, in: zone))
        let future = PlacementDraft(day: "2026-09-11", startMinute: 14 * 60, durationMinutes: 25)

        XCTAssertNil(future.problem(busy: [], isOverBudget: false, now: now, in: zone))

        let past = PlacementDraft(day: "2026-09-11", startMinute: 9 * 60, durationMinutes: 25)
        XCTAssertEqual(
            past.problem(busy: [], isOverBudget: false, now: now, in: zone), CalendarCopy.past)

        XCTAssertEqual(
            future.problem(busy: [], isOverBudget: true, now: now, in: zone),
            CalendarCopy.overBudget)

        let overlap = BusyInterval(
            start: Timestamp(DayMinutes.instant(day: "2026-09-11", minutes: 14 * 60 + 10, in: zone)!),
            end: Timestamp(DayMinutes.instant(day: "2026-09-11", minutes: 15 * 60, in: zone)!),
            provider: "google")
        XCTAssertEqual(
            future.problem(busy: [overlap], isOverBudget: false, now: now, in: zone),
            CalendarCopy.conflict)

        let adjacent = BusyInterval(
            start: Timestamp(DayMinutes.instant(day: "2026-09-11", minutes: 14 * 60 + 25, in: zone)!),
            end: Timestamp(DayMinutes.instant(day: "2026-09-11", minutes: 15 * 60, in: zone)!),
            provider: "google")
        XCTAssertNil(future.problem(busy: [adjacent], isOverBudget: false, now: now, in: zone))
    }

    func testPlacementPreviewIsAPlacementEntryNotABooking() throws {
        let draft = PlacementDraft(day: "2026-09-11", startMinute: 14 * 60, durationMinutes: 25)
        let target = PlacementTarget(
            actionId: "action-1", goalId: "guide", goalTitle: "Write the onboarding guide",
            title: "Write 400 words of the guide", durationMinutes: 25)
        let entry = try XCTUnwrap(draft.entry(target: target, in: zone))
        XCTAssertEqual(entry.kind, .placement)
        XCTAssertNil(entry.statusLabel)
        XCTAssertEqual(entry.end.timeIntervalSince(entry.start), 25 * 60)
        XCTAssertEqual(CalendarEntryStyle.badge(entry.kind), CalendarCopy.placeHere)
        XCTAssertTrue(CalendarEntryStyle.isDashed(entry.kind))
    }

    // MARK: Encodings

    func testOnlySuggestionsAndPreviewsAreDashed() {
        XCTAssertTrue(CalendarEntryStyle.isDashed(.tentative))
        XCTAssertTrue(CalendarEntryStyle.isDashed(.placement))
        XCTAssertFalse(CalendarEntryStyle.isDashed(.adlerBlock))
        XCTAssertFalse(CalendarEntryStyle.isDashed(.booking(provider: .google)))
        XCTAssertFalse(CalendarEntryStyle.isDashed(.busy(provider: nil)))
    }

    func testBusyTimeNamesItsProviderWhenTheServerSuppliesOne() {
        XCTAssertEqual(
            CalendarEntryStyle.kindLabel(.busy(provider: "google")),
            "\(CalendarCopy.otherCommitment) · google")
        XCTAssertEqual(
            CalendarEntryStyle.kindLabel(.busy(provider: nil)), CalendarCopy.otherCommitment)
    }

    func testUnplacedSentenceAgrees() {
        XCTAssertEqual(CalendarCopy.unplaced(1), "1 action needs room or a prerequisite")
        XCTAssertEqual(CalendarCopy.unplaced(2), "2 actions need room or a prerequisite")
    }
}

// MARK: - Test helpers

extension CalendarView {
    fileprivate func replacingCalendars(_ calendars: CalendarStatus) -> CalendarView {
        CalendarView(
            revision: revision, today: today, weekStart: weekStart, weekEnd: weekEnd, days: days,
            tentative: tentative, blocks: blocks, busy: busy, availability: availability,
            unplaced: unplaced, overBudget: overBudget, review: review,
            workingHours: workingHours, timeZone: timeZone, basis: basis, calendars: calendars)
    }

    fileprivate func replacingAvailability(_ availability: CalendarAvailability) -> CalendarView {
        CalendarView(
            revision: revision, today: today, weekStart: weekStart, weekEnd: weekEnd, days: days,
            tentative: tentative, blocks: blocks, busy: busy, availability: availability,
            unplaced: unplaced, overBudget: overBudget, review: review,
            workingHours: workingHours, timeZone: timeZone, basis: basis, calendars: calendars)
    }
}
