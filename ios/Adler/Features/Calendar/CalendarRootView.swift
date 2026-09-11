import SwiftUI

// Calendar week (DESIGN.md §5.9).
//
// Four kinds of time are on this screen and they are never conflated: a **booking** exists on a
// connected calendar; an **Adler plan** block is saved but external calendars know nothing about
// it; a **tentative** block is an editable suggestion; **other commitments** come from a
// connected calendar. When no calendar is connected there is no busy layer at all and the screen
// says availability is unknown — not free.

struct CalendarRootView: View {
    @Environment(WorkspaceStore.self) private var workspace
    @Environment(AppRouter.self) private var router
    @Environment(\.horizontalSizeClass) private var horizontalSizeClass
    @Environment(\.dynamicTypeSize) private var dynamicTypeSize

    @State private var selectedDay: YMD?
    @State private var placing: PlacementTarget?

    private var anchor: YMD {
        router.calendarWeekStart ?? YMD.today(in: workspace.timeZone)
    }

    private var weekStart: YMD { CalendarWeek.monday(of: anchor, in: workspace.timeZone) }

    private var week: CalendarView? {
        workspace.calendars[weekStart] ?? workspace.calendars[anchor]
    }

    private var state: LoadState { workspace.state(.calendar(anchor)) }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: AdlerLayout.sectionGap) {
                header
                if let week {
                    weekBody(week)
                } else if state.isLoading {
                    SkeletonChart()
                    SkeletonRow()
                } else if let error = state.error {
                    ErrorBanner(kind: .server(detail: error.serverMessage)) { Task { await load() } }
                }
            }
            .padding(AdlerLayout.screenMargin)
        }
        .background(Color.canvas)
        .overlay(alignment: .top) {
            if state.isLoading && state.hasContent { RefreshHairline() }
        }
        .toolbar {
            ToolbarItem(placement: .topBarTrailing) {
                Button(CalendarCopy.today) { goToday() }
                    .disabled(week?.days.contains { $0.isToday } ?? false)
            }
        }
        .task {
            workspace.markVisible(.calendar(anchor))
            await load()
        }
        .onDisappear { workspace.markHidden(.calendar(anchor)) }
        .onChange(of: weekStart) { previous, _ in
            workspace.markHidden(.calendar(previous))
            workspace.markVisible(.calendar(anchor))
            Task { await load() }
        }
        .sheet(item: $placing) { target in
            if let week {
                SchedulePlacementSheet(
                    target: target, week: week, palette: GoalPalette(workspace: workspace),
                    start: nil)
                    .presentationDetents([.large])
                    .presentationDragIndicator(.visible)
            }
        }
    }

    // MARK: Header

    private var header: some View {
        VStack(alignment: .leading, spacing: Space.xs) {
            HStack(spacing: Space.m) {
                Button { page(-1) } label: { Image(systemName: "chevron.left") }
                    .accessibilityLabel("Previous week")
                Text(rangeLabel)
                    .adlerText(.title3, numeric: true)
                    .foregroundStyle(Color.inkHeading)
                Button { page(1) } label: { Image(systemName: "chevron.right") }
                    .accessibilityLabel("Next week")
                Spacer(minLength: 0)
            }
            .buttonStyle(.plain)
            .tint(Color.accentInk)
            .frame(minHeight: AdlerLayout.minimumHitTarget)
            Text(week?.timeZone ?? workspace.timeZone.identifier)
                .adlerText(.footnote)
                .foregroundStyle(Color.inkMuted)
        }
    }

    private var rangeLabel: String {
        guard let week else {
            return CalendarWeek.rangeLabel(
                from: weekStart,
                to: CalendarWeek.advancing(weekStart, by: 1, in: workspace.timeZone)
                    .adding(days: -1, in: workspace.timeZone) ?? weekStart,
                in: workspace.timeZone, today: YMD.today(in: workspace.timeZone))
        }
        return CalendarWeek.rangeLabel(
            from: week.weekStart, to: week.weekEnd, in: week.resolvedTimeZone, today: week.today)
    }

    // MARK: Week

    @ViewBuilder private func weekBody(_ week: CalendarView) -> some View {
        let palette = GoalPalette(workspace: workspace)
        let entries = week.entries
        let zone = week.resolvedTimeZone
        let day = resolvedDay(week)

        CalendarLegend(goals: legendGoals(week, palette: palette), showsBusy: !week.busy.isEmpty)

        if week.isOverBudget {
            CalendarNote(text: CalendarCopy.overBudget, symbol: "exclamationmark.triangle")
        }

        weekStrip(week, entries: entries, selected: day)

        if !dynamicTypeSize.prefersSimplifiedCharts {
            CalendarWeekGrid(
                days: columnDays(week, selected: day),
                window: HourWindow.covering(
                    workingHours: week.workingHours, entries: entries, in: zone),
                entries: entries,
                workingHours: week.workingHours,
                timeZone: zone,
                palette: palette,
                onSelectEntry: { entry in open(entry, in: week) },
                onSelectDay: { router.push(.day(date: $0)) })
                .adlerCard(.flat)
        }

        CalendarSection(title: dayTitle(day, in: zone)) {
            AgendaList(
                day: day, entries: week.entries(on: day), timeZone: zone, palette: palette,
                onSelect: { entry in open(entry, in: week) })
        }

        availability(week)
        unplaced(week, palette: palette)
        CalendarNote(text: week.basis)
    }

    private func resolvedDay(_ week: CalendarView) -> YMD {
        if let selectedDay, week.days.contains(where: { $0.date == selectedDay }) {
            return selectedDay
        }
        return week.days.first(where: \.isToday)?.date ?? week.weekStart
    }

    private func columnDays(_ week: CalendarView, selected: YMD) -> [CalendarDay] {
        horizontalSizeClass == .compact ? week.days.filter { $0.date == selected } : week.days
    }

    private func legendGoals(_ week: CalendarView, palette: GoalPalette) -> [DisplayGoal] {
        var seen: [String: DisplayGoal] = [:]
        for entry in week.entries {
            guard let goal = palette.goal(id: entry.goalId, title: entry.goalTitle) else { continue }
            seen[goal.id] = goal
        }
        return seen.values.sorted { $0.title < $1.title }
    }

    private func dayTitle(_ day: YMD, in zone: TimeZone) -> String {
        guard let date = day.noon(in: zone) else { return day.raw }
        var calendar = YMD.calendar
        calendar.timeZone = zone
        return AdlerDate.weekdayShort(date, today: .now, calendar: calendar).uppercased()
    }

    /// The seven days with a count of what is on each, and the current selection.
    private func weekStrip(_ week: CalendarView, entries: [CalendarEntry], selected: YMD)
        -> some View
    {
        let zone = week.resolvedTimeZone
        return HStack(spacing: Space.xs) {
            ForEach(week.days) { day in
                let count = entries.filter { $0.day(in: zone) == day.date }.count
                Button { selectedDay = day.date } label: {
                    VStack(spacing: 1) {
                        Text(CalendarWeek.weekdayInitials(day.date, in: zone))
                            .adlerText(.caption)
                        Text(dayNumber(day.date, in: zone))
                            .adlerText(.subhead, numeric: true)
                        Text(count == 0 ? " " : "\(count)")
                            .adlerText(.caption, numeric: true)
                            .foregroundStyle(Color.inkMuted)
                    }
                    .frame(maxWidth: .infinity, minHeight: AdlerLayout.minimumHitTarget)
                    .foregroundStyle(day.date == selected ? Color.accentGreen : Color.ink)
                    .background(
                        day.date == selected ? Color.accentLime : Color.surfaceSunken,
                        in: .rect(cornerRadius: Radii.chip))
                    .opacity(day.working ? 1 : 0.6)
                    .overlay(alignment: .bottom) {
                        if day.isToday {
                            Rectangle().fill(Color.accentInk).frame(height: 2)
                        }
                    }
                }
                .buttonStyle(.plain)
                .accessibilityLabel(stripLabel(day, count: count, in: zone))
            }
        }
    }

    private func stripLabel(_ day: CalendarDay, count: Int, in zone: TimeZone) -> String {
        guard let date = day.date.noon(in: zone) else { return day.date.raw }
        var calendar = YMD.calendar
        calendar.timeZone = zone
        let name = AdlerDate.weekdayShort(date, today: .now, calendar: calendar)
        return count == 1 ? "\(name), 1 entry" : "\(name), \(count) entries"
    }

    private func dayNumber(_ day: YMD, in zone: TimeZone) -> String {
        guard let date = day.noon(in: zone) else { return day.raw }
        var calendar = YMD.calendar
        calendar.timeZone = zone
        return "\(calendar.component(.day, from: date))"
    }

    // MARK: Availability

    @ViewBuilder private func availability(_ week: CalendarView) -> some View {
        let status = AvailabilityStatus.read(week)
        CalendarSection(title: "Availability") {
            VStack(alignment: .leading, spacing: Space.xs) {
                Text(status.headline)
                    .adlerText(.subhead)
                    .foregroundStyle(status.isUnknown ? Color.warning : Color.ink)
                if let detail = status.detail { CalendarNote(text: detail) }
                if let checkedAt = week.availability.checkedAt?.date {
                    CalendarNote(
                        text: "Checked \(AdlerDate.time(checkedAt, calendar: zonedCalendar(week)))"
                            + (week.availability.provider.map { " · \($0)" } ?? ""))
                }
                AdlerSecondaryButton(title: CalendarCopy.manage) {
                    router.presentSettings(page: .connections)
                }
            }
        }
    }

    private func zonedCalendar(_ week: CalendarView) -> Calendar {
        var calendar = YMD.calendar
        calendar.timeZone = week.resolvedTimeZone
        return calendar
    }

    // MARK: Unplaced

    @ViewBuilder private func unplaced(_ week: CalendarView, palette: GoalPalette) -> some View {
        CalendarSection(title: CalendarCopy.unplacedTitle.uppercased()) {
            if week.unplaced.isEmpty {
                CalendarNote(text: CalendarCopy.noUnplaced)
            } else {
                VStack(alignment: .leading, spacing: Space.s) {
                    Text(CalendarCopy.unplaced(week.unplaced.count))
                        .adlerText(.subhead, numeric: true)
                        .foregroundStyle(Color.ink)
                    ForEach(week.unplaced) { item in
                        unplacedRow(item, week: week, palette: palette)
                    }
                }
            }
        }
    }

    private func unplacedRow(_ item: UnplacedWork, week: CalendarView, palette: GoalPalette)
        -> some View
    {
        HStack(alignment: .top, spacing: Space.m) {
            GoalRule(color: palette.color(item.goalId) ?? .fallback)
            VStack(alignment: .leading, spacing: Space.xxs) {
                Text(item.goalTitle).adlerText(.eyebrow).foregroundStyle(Color.inkMuted)
                Text(item.title).adlerText(.headline).foregroundStyle(Color.ink)
                    .fixedSize(horizontal: false, vertical: true)
                // The server's reason, verbatim.
                Text(item.reason).adlerText(.footnote).foregroundStyle(Color.inkMuted)
            }
            Spacer(minLength: 0)
            AdlerSecondaryButton(title: CalendarCopy.addTime) {
                placing = PlacementTarget(
                    actionId: item.actionId, goalId: item.goalId, goalTitle: item.goalTitle,
                    title: item.title, durationMinutes: week.workingHours.sessionMinutes)
            }
        }
        .padding(AdlerLayout.cardPadding)
        .frame(maxWidth: .infinity, alignment: .leading)
        .adlerCard()
    }

    // MARK: Actions

    private func open(_ entry: CalendarEntry, in week: CalendarView) {
        router.push(.day(date: entry.day(in: week.resolvedTimeZone)))
    }

    private func page(_ weeks: Int) {
        let next = CalendarWeek.advancing(weekStart, by: weeks, in: workspace.timeZone)
        selectedDay = nil
        router.calendarWeekStart = next
    }

    private func goToday() {
        selectedDay = nil
        router.calendarWeekStart = CalendarWeek.monday(
            of: YMD.today(in: workspace.timeZone), in: workspace.timeZone)
    }

    private func load() async {
        await workspace.loadCalendar(weekOf: anchor)
        // The week payload carries `goalId` but no goal colour, so the Goals view supplies the
        // palette. One request, then cached.
        if workspace.goals == nil && workspace.settings == nil {
            await workspace.loadGoals()
        }
    }
}
