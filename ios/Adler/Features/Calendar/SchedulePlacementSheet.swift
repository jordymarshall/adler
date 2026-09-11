import SwiftUI

// SchedulePlacement (DESIGN.md §2.3, §5.9; FLOWS.md §6).
//
// Opens the week with the proposed placement visible, lets the person move it inside the saved
// working hours, and then offers two clearly different outcomes:
//
//   Save time      → a local work block. Adler-only. Books nothing.
//   Confirm booking → `POST /api/availability` then `POST /api/bookings`, naming the calendar.
//
// The booking controls appear only when a connected calendar can actually be written to.

// MARK: - What is being placed

nonisolated struct PlacementTarget: Identifiable, Equatable, Sendable {
    /// The action id. A work block created with this id moves that action rather than adding one.
    let actionId: String
    let goalId: String
    let goalTitle: String
    /// The saved action title. `POST /api/bookings` refuses a title that does not match it.
    let title: String
    let durationMinutes: Int

    var id: String { actionId }
}

// MARK: - The editable proposal

nonisolated struct PlacementDraft: Equatable, Sendable {
    var day: YMD
    var startMinute: Int
    var durationMinutes: Int

    var endMinute: Int { startMinute + durationMinutes }

    /// Keeps the block inside the saved working hours. A block longer than the whole window
    /// starts at the beginning of it rather than being silently shortened.
    func clamped(to hours: WorkingHours) -> PlacementDraft {
        guard let open = DayMinutes.parse(hours.start), let close = DayMinutes.parse(hours.end),
            close > open
        else { return self }
        var copy = self
        let latest = max(open, close - durationMinutes)
        copy.startMinute = min(max(startMinute, open), latest)
        return copy
    }

    func interval(in timeZone: TimeZone) -> (start: Date, end: Date)? {
        guard let start = DayMinutes.instant(day: day, minutes: startMinute, in: timeZone)
        else { return nil }
        return (start, start.addingTimeInterval(TimeInterval(durationMinutes * 60)))
    }

    /// The one sentence that stops the save, or `nil`. Only states this screen can check without
    /// the server: the past, a known external conflict, and a week already over budget.
    func problem(busy: [BusyInterval], isOverBudget: Bool, now: Date, in timeZone: TimeZone)
        -> String?
    {
        guard let span = interval(in: timeZone) else { return CalendarCopy.past }
        if span.start <= now { return CalendarCopy.past }
        if isOverBudget { return CalendarCopy.overBudget }
        for interval in busy {
            guard let from = interval.start.date, let to = interval.end.date else { continue }
            if span.start < to && from < span.end { return CalendarCopy.conflict }
        }
        return nil
    }

    func entry(target: PlacementTarget, in timeZone: TimeZone) -> CalendarEntry? {
        guard let span = interval(in: timeZone) else { return nil }
        return CalendarEntry(
            id: "placement",
            kind: .placement,
            title: target.title,
            goalId: target.goalId,
            goalTitle: target.goalTitle,
            start: span.start,
            end: span.end,
            actionId: target.actionId)
    }
}

// MARK: - Sheet

struct SchedulePlacementSheet: View {
    let target: PlacementTarget
    let week: CalendarView
    let palette: GoalPalette

    @Environment(WorkspaceStore.self) private var workspace
    @Environment(AppRouter.self) private var router
    @Environment(\.dismiss) private var dismiss
    @Environment(\.dynamicTypeSize) private var dynamicTypeSize
    @Environment(\.horizontalSizeClass) private var horizontalSizeClass

    @State private var draft: PlacementDraft
    @State private var writable: [(provider: CalendarProvider, calendar: ExternalCalendar)] = []
    @State private var selectedCalendarID: String?
    @State private var includesCheckIn = false
    @State private var checkedAt: Timestamp?
    @State private var checkedBusy: [BusyInterval] = []
    @State private var savedBlock: String?
    @State private var booking: BookingResponse?
    @State private var errorMessage: String?
    @State private var isWorking = false

    init(target: PlacementTarget, week: CalendarView, palette: GoalPalette, start: Date?) {
        self.target = target
        self.week = week
        self.palette = palette
        let zone = week.resolvedTimeZone
        // `week.today` is the account's actual today, which is only inside `week.days` when this
        // is the current week. Opening the sheet without a `start` (the Unplaced-work "Add time"
        // row) on any other week must still land on a day that week actually has, or the compact
        // preview grid has nothing to draw and the day picker shows no selection.
        let day =
            start.map { YMD($0, in: zone) }
            ?? week.days.first(where: \.isToday)?.date
            ?? week.weekStart
        let minute = start.map { DayMinutes.of($0, in: zone) }
            ?? DayMinutes.parse(week.workingHours.start) ?? 9 * 60
        _draft = State(
            initialValue: PlacementDraft(
                day: day, startMinute: minute, durationMinutes: target.durationMinutes)
                .clamped(to: week.workingHours))
    }

    private var timeZone: TimeZone { week.resolvedTimeZone }

    private var entries: [CalendarEntry] {
        var all = week.entries.filter { $0.actionId != target.actionId }
        if let preview = draft.entry(target: target, in: timeZone) { all.append(preview) }
        return all
    }

    private var problem: String? {
        draft.problem(
            // `checkedBusy` is empty both before any check and after a check that finds nothing
            // busy; `checkedAt` is what actually distinguishes "not checked yet" (fall back to
            // the week's cached busy list) from "checked and clear" (trust the fresh result).
            busy: checkedAt != nil ? checkedBusy : week.busy,
            isOverBudget: week.isOverBudget, now: .now, in: timeZone)
    }

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: AdlerLayout.sectionGap) {
                    heading
                    if let savedBlock { savedReceipt(savedBlock) }
                    if let booking { bookingReceipt(booking) }
                    if let errorMessage {
                        ErrorBanner(kind: .server(detail: errorMessage)) { self.errorMessage = nil }
                    }
                    preview
                    controls
                    if let problem {
                        CalendarNote(text: problem, symbol: "exclamationmark.triangle")
                    }
                    saveControls
                    bookingControls
                }
                .padding(AdlerLayout.screenMargin)
            }
            .background(Color.canvas)
            .navigationTitle("Schedule")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Close") { dismiss() }
                }
            }
        }
        .task { await loadCalendars() }
    }

    // MARK: Sections

    private var heading: some View {
        VStack(alignment: .leading, spacing: Space.xs) {
            Text(target.goalTitle)
                .adlerText(.eyebrow)
                .foregroundStyle(Color.inkMuted)
            Text(target.title)
                .adlerText(.title3)
                .foregroundStyle(Color.inkHeading)
                .fixedSize(horizontal: false, vertical: true)
            Text(CalendarCopy.placementHint)
                .adlerText(.footnote)
                .foregroundStyle(Color.inkMuted)
                .fixedSize(horizontal: false, vertical: true)
        }
    }

    @ViewBuilder private var preview: some View {
        if !dynamicTypeSize.prefersSimplifiedCharts {
            let window = HourWindow.covering(
                workingHours: week.workingHours, entries: entries, in: timeZone)
            CalendarSection(title: CalendarWeek.rangeLabel(
                from: week.weekStart, to: week.weekEnd, in: timeZone, today: week.today)) {
                CalendarWeekGrid(
                    days: columnDays,
                    window: window,
                    entries: entries,
                    workingHours: week.workingHours,
                    timeZone: timeZone,
                    palette: palette,
                    selectedEntryID: "placement")
                .adlerCard(.flat)
            }
        }
    }

    private var columnDays: [CalendarDay] {
        horizontalSizeClass == .compact
            ? week.days.filter { $0.date == draft.day }
            : week.days
    }

    private var controls: some View {
        VStack(alignment: .leading, spacing: Space.m) {
            dayPicker
            HStack {
                Text("Start")
                    .adlerText(.subhead)
                    .foregroundStyle(Color.ink)
                Spacer()
                DatePicker(
                    "Start",
                    selection: startBinding,
                    displayedComponents: .hourAndMinute)
                    .labelsHidden()
                    .environment(\.timeZone, timeZone)
            }
            Stepper(value: $draft.durationMinutes, in: 5...240, step: 5) {
                Text("\(draft.durationMinutes) minutes")
                    .adlerText(.subhead, numeric: true)
                    .foregroundStyle(Color.ink)
            }
            CalendarNote(text: workingHoursNote)
        }
        .padding(AdlerLayout.cardPadding)
        .adlerCard()
    }

    private var workingHoursNote: String {
        "Within your saved working hours, \(week.workingHours.start)–\(week.workingHours.end)."
    }

    private var dayPicker: some View {
        ScrollView(.horizontal) {
            HStack(spacing: Space.xs) {
                ForEach(week.days) { day in
                    Button {
                        draft.day = day.date
                        draft = draft.clamped(to: week.workingHours)
                    } label: {
                        VStack(spacing: 1) {
                            Text(CalendarWeek.weekdayInitials(day.date, in: timeZone))
                                .adlerText(.caption)
                            Text(dayNumber(day.date))
                                .adlerText(.subhead, numeric: true)
                        }
                        .frame(minWidth: 40, minHeight: AdlerLayout.minimumHitTarget)
                        .foregroundStyle(day.date == draft.day ? Color.accentGreen : Color.ink)
                        .background(
                            day.date == draft.day ? Color.accentLime : Color.surfaceSunken,
                            in: .rect(cornerRadius: Radii.chip))
                        .opacity(day.working ? 1 : 0.55)
                    }
                    .buttonStyle(.plain)
                    .accessibilityLabel(daySpoken(day))
                }
            }
        }
        .scrollIndicators(.hidden)
    }

    private var startBinding: Binding<Date> {
        Binding(
            get: {
                DayMinutes.instant(day: draft.day, minutes: draft.startMinute, in: timeZone)
                    ?? .now
            },
            set: { newValue in
                draft.startMinute = DayMinutes.of(newValue, in: timeZone)
                draft = draft.clamped(to: week.workingHours)
            })
    }

    // MARK: Saving

    private var saveControls: some View {
        VStack(alignment: .leading, spacing: Space.s) {
            AdlerPrimaryButton(title: CalendarCopy.saveTime) { Task { await saveLocal() } }
                .disabled(isWorking || problem != nil)
            CalendarNote(text: CalendarCopy.localOnly)
        }
    }

    @ViewBuilder private var bookingControls: some View {
        CalendarSection(title: CalendarCopy.confirmBooking.uppercased()) {
            if writable.isEmpty {
                VStack(alignment: .leading, spacing: Space.s) {
                    CalendarNote(text: CalendarCopy.noCalendarWritable)
                    AdlerSecondaryButton(title: CalendarCopy.manage) {
                        dismiss()
                        router.presentSettings(page: .connections)
                    }
                }
            } else {
                VStack(alignment: .leading, spacing: Space.m) {
                    Picker("Calendar", selection: calendarSelection) {
                        ForEach(writable, id: \.calendar.id) { option in
                            Text(option.calendar.name).tag(option.calendar.id)
                        }
                    }
                    .pickerStyle(.menu)
                    Toggle(CalendarCopy.withCheckIn, isOn: $includesCheckIn)
                        .adlerText(.subhead)
                    if let checkedAt, let date = checkedAt.date {
                        CalendarNote(
                            text: "Availability checked \(AdlerDate.time(date, calendar: zonedCalendar)).")
                    } else {
                        CalendarNote(text: CalendarCopy.notChecked)
                    }
                    if let selected = selectedOption {
                        Text(CalendarCopy.bookInto(selected.calendar.name))
                            .adlerText(.footnote)
                            .foregroundStyle(Color.inkMuted)
                    }
                    HStack(spacing: Space.s) {
                        AdlerSecondaryButton(
                            title: checkedAt == nil
                                ? CalendarCopy.checkAvailability : CalendarCopy.refreshAvailability
                        ) { Task { await check() } }
                        AdlerPrimaryButton(
                            title: isWorking ? CalendarCopy.confirming : CalendarCopy.confirmBooking
                        ) { Task { await confirmBooking() } }
                        .disabled(isWorking || problem != nil || checkedAt == nil)
                    }
                    CalendarNote(text: CalendarCopy.retryNote)
                }
                .padding(AdlerLayout.cardPadding)
                .adlerCard()
            }
        }
    }

    private var selectedOption: (provider: CalendarProvider, calendar: ExternalCalendar)? {
        writable.first { $0.calendar.id == selectedCalendarID } ?? writable.first
    }

    private var calendarSelection: Binding<String> {
        Binding(
            get: { selectedCalendarID ?? writable.first?.calendar.id ?? "" },
            set: { selectedCalendarID = $0 })
    }

    private var zonedCalendar: Calendar {
        var calendar = YMD.calendar
        calendar.timeZone = timeZone
        return calendar
    }

    private func dayNumber(_ day: YMD) -> String {
        guard let date = day.noon(in: timeZone) else { return day.raw }
        return "\(zonedCalendar.component(.day, from: date))"
    }

    private func daySpoken(_ day: CalendarDay) -> String {
        guard let date = day.date.noon(in: timeZone) else { return day.date.raw }
        return AdlerDate.weekdayShort(date, today: .now, calendar: zonedCalendar)
    }

    // MARK: Receipts

    private func savedReceipt(_ text: String) -> some View {
        VStack(alignment: .leading, spacing: Space.xs) {
            Text(text).adlerText(.subhead).foregroundStyle(Color.ink)
            Text(CalendarCopy.localOnly).adlerText(.footnote).foregroundStyle(Color.inkMuted)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .adlerWell()
    }

    @ViewBuilder private func bookingReceipt(_ response: BookingResponse) -> some View {
        VStack(alignment: .leading, spacing: Space.s) {
            if response.isComplete {
                Text(
                    CalendarCopy.bookInto(selectedOption?.calendar.name ?? "your calendar")
                        + (response.checkInDone == true ? " · \(CalendarCopy.withCheckIn)" : ""))
                    .adlerText(.subhead)
                    .foregroundStyle(Color.ink)
            } else {
                Text(CalendarCopy.pendingTitle)
                    .adlerText(.headline)
                    .foregroundStyle(Color.inkHeading)
                if let error = response.error {
                    Text(error).adlerText(.footnote).foregroundStyle(Color.ink)
                }
                Text(CalendarCopy.retryNote)
                    .adlerText(.footnote)
                    .foregroundStyle(Color.inkMuted)
                HStack(spacing: Space.s) {
                    AdlerSecondaryButton(title: CalendarCopy.retryBooking) {
                        Task { await confirmBooking() }
                    }
                    AdlerQuietButton(title: CalendarCopy.closeBooking) { booking = nil }
                }
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .adlerWell()
    }

    // MARK: Calls

    private func loadCalendars() async {
        guard week.isAnyCalendarConnected else { return }
        do {
            let list = try await workspace.externalCalendars()
            writable =
                list.google.filter(\.writable).map { (CalendarProvider.google, $0) }
                + list.apple.filter(\.writable).map { (CalendarProvider.apple, $0) }
            selectedCalendarID = writable.first?.calendar.id
        } catch {
            errorMessage = error.serverMessage ?? error.errorDescription
        }
    }

    private func saveLocal() async {
        guard let span = draft.interval(in: timeZone) else { return }
        isWorking = true
        defer { isWorking = false }
        errorMessage = nil
        do {
            try await workspace.createLocalWorkBlock(
                goalId: target.goalId,
                actionTitle: target.title,
                start: Timestamp(span.start),
                end: Timestamp(span.end),
                blockId: target.actionId)
            savedBlock =
                "Saved \(AdlerDate.weekdayShort(span.start, today: .now, calendar: zonedCalendar)) · "
                + "\(AdlerDate.time(span.start, calendar: zonedCalendar))–\(AdlerDate.time(span.end, calendar: zonedCalendar))"
        } catch {
            errorMessage = error.serverMessage ?? error.errorDescription
        }
    }

    private func check() async {
        guard let option = selectedOption, let span = draft.interval(in: timeZone) else { return }
        isWorking = true
        defer { isWorking = false }
        errorMessage = nil
        do {
            let response = try await workspace.checkAvailability(
                provider: option.provider.rawValue,
                calendarIds: writable.filter { $0.provider == option.provider }.map(\.calendar.id),
                start: Timestamp(span.start.addingTimeInterval(-3600)),
                end: Timestamp(span.end.addingTimeInterval(3600)))
            checkedBusy = response.busy
            checkedAt = response.checkedAt
        } catch {
            errorMessage = error.serverMessage ?? error.errorDescription
        }
    }

    private func confirmBooking() async {
        guard let option = selectedOption, let span = draft.interval(in: timeZone) else { return }
        isWorking = true
        defer { isWorking = false }
        errorMessage = nil
        do {
            booking = try await workspace.book(
                BookingRequest(
                    id: target.actionId,
                    goalId: target.goalId,
                    provider: option.provider.rawValue,
                    calendarId: option.calendar.id,
                    conflictIds: writable.filter { $0.provider == option.provider }
                        .map(\.calendar.id),
                    title: target.title,
                    start: Timestamp(span.start),
                    end: Timestamp(span.end),
                    checkIn: includesCheckIn))
        } catch {
            errorMessage = error.serverMessage ?? error.errorDescription
        }
    }
}
