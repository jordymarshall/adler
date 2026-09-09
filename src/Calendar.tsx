import { actionReady, actionStep } from "../shared/adaptive-plan";
import { tentativeSchedule, type TentativeBlock } from "../shared/tentative-schedule";
import { WeekCalendar, weekOf, monthRange } from "./WeekCalendar";
import { addDays, dateInZone, reviewBlock, timeInZone, zonedTime } from "../shared/journey";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { CalendarDays, Check, RefreshCw } from "lucide-react";
import { api, type CalendarOption, type ServiceStatus } from "./api";
import { currentPlan, currentProgram, useStore } from "./store";
import { Modal } from "./components";
import { CalendarLogo } from "./CalendarLogo";
import { findSlots, overlaps } from "./scheduling";
import type { BusyInterval } from "./program-types";
type Provider = "local" | "google" | "apple";
interface BookingInput {
  id: string;
  goalId: string;
  provider: "google" | "apple";
  calendarId: string;
  conflictIds: string[];
  title: string;
  start: string;
  end: string;
  checkIn: boolean;
}
interface BookingResult {
  id: string;
  workDone: boolean;
  checkInDone: boolean;
  workId: string;
  checkInId: string;
  error?: string;
}
const pendingKey = "adler-pending-booking";
export function savedPending(): BookingInput | null {
  try {
    return JSON.parse(sessionStorage.getItem(pendingKey) ?? "null");
  } catch {
    return null;
  }
}
const displayTime = (date: string, timeZone?: string) =>
  new Date(date).toLocaleString(undefined, {
    timeZone,
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
export function Calendar({
  embedded = false,
  goalId,
  actionId,
  onDone,
}: {
  embedded?: boolean;
  goalId?: string;
  actionId?: string;
  onDone?: () => void;
}) {
  const { data, commit, flush, refresh: refreshWorkspace } = useStore();
  const baseProgram = currentProgram(data);
  const [calendarView, setCalendarView] = useState<"month" | "week">("week");
  const [month, setMonth] = useState(() => dateInZone(data.timeZone));
  const [week, setWeek] = useState(() =>
    weekOf(
      [data.actions.find((a) => a.id === actionId)?.date ?? "", dateInZone(data.timeZone)].sort().at(-1)!,
    ),
  );
  const [customDate, setCustomDate] = useState(
    data.actions.find((a) => a.id === actionId)?.date ||
      dateInZone(data.timeZone),
  );
  const [requestedDate, setRequestedDate] = useState("");
  const options = useRef<HTMLDetailsElement>(null);
  const [customTime, setCustomTime] = useState("09:00");
  const [params] = useSearchParams();
  const [choosing, setChoosing] = useState(
    embedded || Boolean(params.get("goal")),
  );
  const [service, setService] = useState<ServiceStatus | null>(null);
  const [calendars, setCalendars] = useState<{
    google: CalendarOption[];
    apple: CalendarOption[];
  }>({ google: [], apple: [] });
  const [provider, setProvider] = useState<Provider>("local");
  const [selected, setSelected] = useState(() => {
    const requested = goalId ?? params.get("goal");
    return data.goals.some((g) => g.id === requested && g.status === "Active")
      ? requested!
      : (data.goals.find(
          (g) => g.id === baseProgram.focusGoalId && g.status === "Active",
        )?.id ??
          data.goals.find((g) => g.status === "Active")?.id ??
          "");
  });
  const [chosenAction, setChosenAction] = useState(
    actionId ?? params.get("action") ?? "",
  );
  const [destination, setDestination] = useState("");
  const [conflicts, setConflicts] = useState<string[]>([]);
  const [busy, setBusy] = useState<BusyInterval[]>([]);
  const [checkedAt, setCheckedAt] = useState("");
  const [checkedRange, setCheckedRange] = useState<{ start: string; end: string }>();
  const [slot, setSlot] = useState<BusyInterval | null>(null);
  const [checkIn, setCheckIn] = useState(true);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState(params.get("error") ?? "");
  const [appleForm, setAppleForm] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState<BookingInput | null>(savedPending);
  const navigate = useNavigate();
  const goal = data.goals.find(
    (g) => g.id === selected && g.status === "Active",
  );
  const timezone = data.timeZone;
  const actions = data.actions
    .filter(
      (a) =>
        a.goalId === goal?.id &&
        actionReady(data, a) &&
        !a.outcome &&
        !a.startedAt &&
        !data.workBlocks.some((b) => b.id === a.id),
    )
    .sort((a, b) => (a.date || "9999").localeCompare(b.date || "9999"));
  const action = actions.find((a) => a.id === chosenAction) ?? actions[0];
  const actionPlan =
    goal?.plans.find((plan) => plan.version === action?.planVersion) ??
    (goal ? currentPlan(goal) : undefined);
  const program = {
    ...baseProgram,
    sessionMinutes: (action ? actionStep(data, action)?.durationMinutes : undefined) ?? actionPlan?.durationMinutes ?? baseProgram.sessionMinutes,
  };
  const actionTitle = action?.title ?? (goal ? currentPlan(goal).action : "");
  const review = reviewBlock(data, week);
  const localBusy = [
    ...data.workBlocks.map((b) => ({
      start: b.start,
      end: b.end,
    })),
    ...(review ? [review] : []),
  ];
  const range = !embedded && !choosing && calendarView === "month" ? monthRange(month) : { start: week, end: addDays(week, 7) };
  const checked = Boolean(checkedAt && checkedRange && checkedRange.start <= range.start && checkedRange.end >= range.end && Date.now() - Date.parse(checkedAt) <= 300000);
  const allocation = tentativeSchedule(data, range.start, range.end, new Date(), checked ? busy : undefined);
  const slots =
    provider === "local" || checked
      ? findSlots(
          program,
          [...allocation.busy, ...localBusy, ...allocation.blocks.filter(block => block.id !== action?.id)],
          new Date(),
          provider !== "local" && checkIn,
          timezone,
          requestedDate || (action?.date && action.date >= week && action.date < range.end && action.date > dateInZone(timezone) ? action.date : week),
        ).filter(
          (candidate) =>
            dateInZone(timezone, new Date(candidate.start)) < range.end && (!requestedDate ||
            dateInZone(timezone, new Date(candidate.start)) === requestedDate),
        )
      : [];
  const suggested = allocation.blocks.find(block => block.id === action?.id && (!requestedDate || dateInZone(timezone, new Date(block.start)) === requestedDate));
  const fallback = !allocation.unplaced.some(item => item.actionId === action?.id) ? slots[0] : undefined;
  const candidate = slot ?? (provider === "local" ? suggested : undefined) ?? fallback;
  const candidateFits = !candidate || !goal || tentativeSchedule(data, range.start, range.end, new Date(), checked ? busy : undefined, { ...candidate, id: action?.id ?? "placement-preview", goalId: goal.id, title: actionTitle }).overBudget.length === 0;
  const selectedSlot = candidateFits ? candidate : undefined;
  const preview: TentativeBlock | undefined = !pending && choosing && goal && selectedSlot ? { ...selectedSlot, id: action?.id ?? "placement-preview", goalId: goal.id, title: actionTitle } : undefined;
  const arranged = preview ? tentativeSchedule(data, range.start, range.end, new Date(), checked ? busy : undefined, preview) : allocation;
  async function refresh() {
    const status = await api<ServiceStatus>("status");
    setService(status);
    const lists = await api<typeof calendars>("calendars");
    setCalendars(lists);
  }
  useEffect(() => {
    refresh().catch((err) => setError(err.message));
  }, []);
  function chooseProvider(p: Provider) {
    setProvider(p);
    setBusy([]);
    setCheckedAt("");
    setSlot(null);
    setError("");
    const list = p === "local" ? [] : calendars[p];
    setDestination(list.find((c) => c.writable)?.id ?? "");
    setConflicts(list.map((c) => c.id));
  }
  async function connectApple(e: FormEvent) {
    e.preventDefault();
    setWorking(true);
    setError("");
    try {
      await api("calendar/apple/connect", { email, password });
      setPassword("");
      setAppleForm(false);
      await refresh();
    } catch (err) {
      setPassword("");
      setError(
        err instanceof Error ? err.message : "iCloud could not connect.",
      );
    } finally {
      setWorking(false);
    }
  }
  async function checkAvailability() {
    if (provider === "local") return;
    setWorking(true);
    setError("");
    setSlot(null);
    setCheckedAt("");
    try {
      const start = zonedTime(range.start, "00:00", timezone)!;
      const end = zonedTime(range.end, "00:00", timezone)!;
      const result = await api<{ busy: BusyInterval[]; checkedAt: string }>(
        "availability",
        {
          provider,
          calendarIds: [
            ...new Set([...conflicts, destination].filter(Boolean)),
          ],
          start: start.toISOString(),
          end: end.toISOString(),
        },
      );
      setBusy(result.busy);
      setCheckedAt(result.checkedAt);
      setCheckedRange(range);
      commit((d) => {
        d.calendarSnapshot = {
          busy: result.busy.map((b) => ({ start: b.start, end: b.end })),
          checkedAt: result.checkedAt,
          provider,
          start: start.toISOString(),
          end: end.toISOString(),
        };
      });
    } catch (err) {
      setBusy([]);
      setError(err instanceof Error ? err.message : "Availability is unknown.");
    } finally {
      setWorking(false);
    }
  }
  function saveBlock(
    input: {
      id: string;
      goalId: string;
      title: string;
      start: string;
      end: string;
      provider: Provider;
    },
    result?: BookingResult,
  ) {
    return commit(
      (d) => {
        const current = d.goals.find((g) => g.id === input.goalId)!;
        if (current.status !== "Active")
          throw new Error("Start this plan before scheduling work.");
        const scheduledReview = reviewBlock(
          d,
          dateInZone(d.timeZone, new Date(input.start)),
        );
        if (scheduledReview && overlaps(scheduledReview, input))
          throw new Error(
            "This time overlaps your weekly review. Choose another time or move the review.",
          );
        if (
          Date.parse(input.start) <= Date.now() ||
          d.workBlocks.some((b) => b.id !== input.id && overlaps(b, input))
        )
          throw new Error(
            "This time conflicts with saved work or is in the past. Choose another time.",
          );
        const existing = d.workBlocks.find((b) => b.id === input.id);
        if (existing) {
          existing.checkInId = result?.checkInDone
            ? result.checkInId
            : existing.checkInId;
          return;
        }
        d.workBlocks.push({
          id: input.id,
          goalId: input.goalId,
          action: input.title,
          start: input.start,
          end: input.end,
          provider: input.provider,
          status: "Scheduled",
          eventId: result?.workId,
          checkInId: result?.checkInDone ? result.checkInId : undefined,
        });
        const localDay = dateInZone(d.timeZone, new Date(input.start));
        const original = d.actions.find((a) => a.id === input.id);
        if (original) {
          original.date = localDay;
          original.timing = displayTime(input.start, timezone);
          return;
        }
        d.actions.push({
          id: input.id,
          goalId: input.goalId,
          title: input.title,
          criterion: currentPlan(current).criterion,
          timing: displayTime(input.start, timezone),
          date: localDay,
          planVersion: currentPlan(current).version,
          history: [],
        });
      },
      result ? "Calendar work block saved." : "Work block saved in Adler.",
    );
  }
  async function book(input: BookingInput) {
    setWorking(true);
    setError("");
    sessionStorage.setItem(pendingKey, JSON.stringify(input));
    setPending(input);
    try {
      await flush();
      const result = await api<BookingResult>("bookings", input);
      await refreshWorkspace();
      if (result.error)
        throw new Error(
          `${result.workDone ? "Work block created. Check-in is not yet confirmed. " : "Booking not confirmed. "}${result.error}`,
        );
      sessionStorage.removeItem(pendingKey);
      setPending(null);
      setSlot(null);
      setWeek(weekOf(dateInZone(timezone, new Date(input.start))));
      setCheckedAt("");
      setBusy([]);
      setChoosing(false);
      onDone?.();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "The booking could not be confirmed. Retry using the same booking.",
      );
    } finally {
      setWorking(false);
    }
  }
  function place(date: string, time: string) {
    const start = zonedTime(date, time, timezone);
    if (!start || start.getTime() <= Date.now()) { setError("Choose a valid future time in your timezone."); return false; }
    const candidate = { start: start.toISOString(), end: new Date(start.getTime() + program.sessionMinutes * 60000).toISOString() };
    const occupied = { ...candidate, end: new Date(Date.parse(candidate.end) + (provider !== "local" && checkIn ? 5 * 60000 : 0)).toISOString() };
    const customReview = reviewBlock(data, date);
    const placementRange = { start: weekOf(date), end: addDays(weekOf(date), 7) };
    const placementBusy = checked && checkedRange!.start <= placementRange.start && checkedRange!.end >= placementRange.end ? busy : undefined;
    const placed = tentativeSchedule(data, placementRange.start, placementRange.end, new Date(), placementBusy, { ...candidate, id: action?.id ?? "placement-preview", goalId: goal?.id ?? "", title: actionTitle });
    if ([...placed.busy, ...localBusy, ...(customReview ? [customReview] : [])].some(interval => overlaps(interval, occupied))) {
      setError("That time conflicts with a commitment. Choose another time."); return false;
    }
    if (placed.overBudget.length) { setError("That week is over your available time budget. Choose another week or adjust your available hours."); return false; }
    setError(""); setCustomDate(date); setCustomTime(time); setRequestedDate(date); setWeek(weekOf(date)); setSlot(candidate);
    return true;
  }
  function confirm() {
    if (!selectedSlot || !goal) return;
    const input = {
      id: action?.id ?? crypto.randomUUID(),
      goalId: goal.id,
      title: actionTitle,
      ...selectedSlot,
      provider,
    };
    if (provider === "local") {
      if (saveBlock(input)) {
        setSlot(null);
        setWeek(weekOf(dateInZone(timezone, new Date(input.start))));
        setChoosing(false);
        onDone?.();
      }
      return;
    }
    void book({
      ...input,
      provider,
      calendarId: destination,
      conflictIds: conflicts,
      checkIn,
    });
  }
  return (
    <div
      className={
        embedded ? "inline-scheduler" : "calendar-page journey-calendar"
      }
    >
      {!embedded && (
          <div className="page-heading">
            <h1>Your calendar</h1>
            {!choosing && !pending && (
              <button
                className="button primary"
                onClick={() => { setCalendarView("week"); setChoosing(true); }}
              >
                Add time <CalendarDays size={16} />
              </button>
            )}
          </div>
      )}
          <WeekCalendar
            month={month}
            view={embedded || choosing ? "week" : calendarView}
            onMonth={date => { setMonth(date); setWeek(weekOf(date)); setBusy([]); setCheckedAt(""); setRequestedDate(""); setSlot(null); }}
            onView={view => { setCalendarView(view); setBusy([]); setCheckedAt(""); setSlot(null); }}
            working={working}
            week={week}
            onWeek={(date) => {
              setWeek(date);
              setRequestedDate("");
              setSlot(null);
              setBusy([]);
              setCheckedAt("");
            }}
            busy={arranged.busy}
            checked={arranged.externalAvailability === "checked"}
            tentative={arranged.blocks}
            preview={preview}
            onPlace={choosing && !pending ? place : undefined}
            onSelectTentative={id => {
              const block = arranged.blocks.find(block => block.id === id)!;
              const date = dateInZone(timezone, new Date(block.start));
              if (data.goals.find(goal => goal.id === block.goalId)?.status === "Draft" || embedded && block.goalId !== goalId) { navigate(`/app/goals/${block.goalId}?action=${id}`); return; }
              setSelected(block.goalId); setChosenAction(id); setSlot(block); setWeek(weekOf(date)); setCustomDate(date); setCustomTime(timeInZone(timezone, new Date(block.start))); setCalendarView("week"); setRequestedDate(date); setChoosing(true); setError("");
            }}
            onRecord={action => navigate(`/app/check-in?goal=${action.goalId}&prompt=${encodeURIComponent(`I want to check in on ${action.title} (${action.date || "unscheduled"}).`)}`)}
            onCalendars={() => {
              if (options.current) {
                options.current.open = true;
                options.current.scrollIntoView({
                  block: "start",
                  behavior: "smooth",
                });
              }
            }}
            onChoose={(date) => {
              setWeek(weekOf(date));
              setCustomDate(date);
              setRequestedDate(date);
              setSlot(null);
              setCalendarView("week");
              setChoosing(true);
            }}
          />
      <p className="field-hint calendar-placement-hint">{preview ? "Choose a time in the week, or use Choose another time below. Other tentative blocks adjust around it." : "Dashed blocks make room for your planned actions. Select one to adjust or confirm its time."} Tentative blocks are only in Adler.</p>
      {arranged.unplaced.length > 0 && <details className="quiet-disclosure"><summary>{arranged.unplaced.length} action{arranged.unplaced.length === 1 ? " needs" : "s need"} room or a prerequisite</summary>{arranged.unplaced.map(item => <p key={item.actionId}><Link to={`/app/goals/${item.goalId}?action=${item.actionId}`}>{data.actions.find(action => action.id === item.actionId)?.title}</Link> · {item.reason}</p>)}<Link to="/app/check-in?prompt=Help%20me%20adjust%20my%20plan%20to%20fit%20my%20available%20time" className="text-link">Adjust with Coach ↗</Link></details>}
      {error && (
        <p role="alert" className="inline-error">
          {error}
        </p>
      )}
      {pending && (
        <section className="panel pending-booking">
          <h3>Finish confirming your time</h3>
          <p>
            {pending.title} · {displayTime(pending.start, timezone)}
          </p>
          <button
            className="button primary"
            disabled={working}
            onClick={() => void book(pending)}
          >
            Retry confirmation
          </button>
          <details className="quiet-disclosure">
            <summary>Booking details</summary>
            <p>Retry checks the existing booking to avoid duplicates.</p>
            <button
              className="text-link"
              disabled={working}
              onClick={() => {
                sessionStorage.removeItem(pendingKey);
                setPending(null);
                setCheckedAt("");
                setSlot(null);
                setChoosing(false);
                onDone?.();
              }}
            >
              I checked my calendar · close this booking
            </button>
          </details>
        </section>
      )}
      {!pending && (choosing || embedded) && (
        <section
          className={embedded ? "scheduler-form" : "panel scheduler-form"}
          id="calendar-planner"
          aria-label="Choose a time"
        >
          {!embedded && (
            <div className="list-heading">
              <h2>Make time for a step</h2>
              <button className="text-link" onClick={() => setChoosing(false)}>
                Close
              </button>
            </div>
          )}
          {!embedded && (
            <label>
              Goal
              <select
                aria-label="Goal to schedule"
                value={selected}
                disabled={working}
                onChange={(e) => {
                  setSelected(e.target.value);
                  setChosenAction("");
                  setSlot(null);
                }}
              >
                {data.goals
                  .filter((g) => g.status === "Active")
                  .map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.title}
                    </option>
                  ))}
              </select>
            </label>
          )}
          {!embedded && actions.length > 1 && (
            <label>
              Action to schedule
              <select
                value={action?.id ?? ""}
                disabled={working}
                onChange={(e) => {
                  setChosenAction(e.target.value);
                  setSlot(null);
                }}
              >
                {actions.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.title}
                  </option>
                ))}
              </select>
            </label>
          )}
          {!goal ? (
            <p>
              <Link className="text-link" to="/app/goals">
                Start a plan to schedule its first step →
              </Link>
            </p>
          ) : (
            <>
              {!embedded && <p>{actionTitle}</p>}
              {selectedSlot ? (
                <div className="suggested-time">
                  <CalendarDays size={19} />
                  <div>
                    <b>{displayTime(selectedSlot.start, timezone)}</b>
                    <span>
                      {program.sessionMinutes} minutes · {timezone}
                    </span>
                  </div>
                </div>
              ) : (
                <p>
                  {provider === "local"
                    ? "Choose a time that works for you."
                    : "Check your calendar to find a time."}
                </p>
              )}
              {provider !== "local" && !checked && (
                <button
                  className="button primary"
                  disabled={working || !destination}
                  onClick={() => void checkAvailability()}
                >
                  Check availability
                </button>
              )}
              {selectedSlot && (
                <button
                  className="button primary"
                  disabled={working || Boolean(pending)}
                  onClick={confirm}
                >
                  {working
                    ? "Confirming…"
                    : provider === "local"
                      ? "Save time"
                      : "Confirm booking"}{" "}
                  <Check size={16} />
                </button>
              )}
              <p className="field-hint">
                {provider === "local"
                  ? arranged.externalAvailability === "checked" ? "Saves in Adler. Uses recently checked calendar availability." : "Saves in Adler. External calendars haven’t been checked."
                  : checked
                    ? "Availability is checked again when you book."
                    : "Your selected calendars will be checked before booking."}
              </p>
              <details
                className="quiet-disclosure"
                open={(!selectedSlot && provider === "local") || undefined}
              >
                <summary>Choose another time</summary>
                <form
                  className="custom-calendar-time"
                  onSubmit={(event) => {
                    event.preventDefault();
                    if (!place(customDate, customTime)) return;
                    event.currentTarget
                      .closest("details")
                      ?.removeAttribute("open");
                  }}
                >
                  <label>
                    Date
                    <input
                      type="date"
                      required
                      min={dateInZone(timezone)}
                      value={customDate}
                      onChange={(e) => setCustomDate(e.target.value)}
                    />
                  </label>
                  <label>
                    Start time
                    <input
                      type="time"
                      required
                      value={customTime}
                      onChange={(e) => setCustomTime(e.target.value)}
                    />
                  </label>
                  <button
                    className="button secondary"
                    disabled={working || Boolean(pending)}
                  >
                    Use this time
                  </button>
                </form>
              </details>
            </>
          )}
        </section>
      )}
      <details ref={options} className="quiet-disclosure calendar-options">
        <summary>
          {embedded ? "Calendar options" : "Connected calendars"}
        </summary>
        <label>
          Save in
          <select
            aria-label="Book in"
            disabled={working}
            value={provider}
            onChange={(e) => {
              chooseProvider(e.target.value as Provider);
              if (!embedded) setChoosing(true);
            }}
          >
            <option value="local">Adler only</option>
            <option value="google" disabled={!service?.google.connected}>
              Google Calendar
              {!service?.google.connected ? " · connect first" : ""}
            </option>
            <option value="apple" disabled={!service?.apple.connected}>
              iCloud Calendar
              {!service?.apple.connected ? " · connect first" : ""}
            </option>
          </select>
        </label>
        {provider !== "local" && (
          <>
            <label>
              Destination calendar
              <select
                aria-label="Destination calendar"
                disabled={working}
                value={destination}
                onChange={(e) => {
                  setDestination(e.target.value);
                  setCheckedAt("");
                  setBusy([]);
                  setSlot(null);
                }}
              >
                {calendars[provider]
                  .filter((c) => c.writable)
                  .map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
              </select>
            </label>
            <fieldset className="calendar-checks">
              <legend>Check conflicts against</legend>
              {calendars[provider].map((c) => (
                <label key={c.id}>
                  <input
                    type="checkbox"
                    checked={conflicts.includes(c.id) || destination === c.id}
                    disabled={working || destination === c.id}
                    onChange={(e) => {
                      setConflicts(
                        e.target.checked
                          ? [...conflicts, c.id]
                          : conflicts.filter((id) => id !== c.id),
                      );
                      setCheckedAt("");
                      setBusy([]);
                      setSlot(null);
                    }}
                  />
                  {c.name}
                </label>
              ))}
            </fieldset>
            <label className="checkbox-line">
              <input
                type="checkbox"
                checked={checkIn}
                disabled={working}
                onChange={(e) => {
                  setCheckIn(e.target.checked);
                  setSlot(null);
                }}
              />
              Add a 5-minute check-in event
            </label>
            {checked && (
              <button
                className="button secondary"
                disabled={working}
                onClick={() => void checkAvailability()}
              >
                Refresh availability <RefreshCw size={15} />
              </button>
            )}
          </>
        )}
        <div className="calendar-connections">
          {(["google", "apple"] as const).map((p) => (
            <div className="connection-card" key={p}>
              <CalendarLogo provider={p} />
              <div>
                <b>{p === "google" ? "Google Calendar" : "iCloud Calendar"}</b>
                <p>{service?.[p].connected ? "Connected" : "Optional"}</p>
              </div>
              {service?.[p].connected ? (
                <button
                  className="text-link"
                  disabled={working}
                  onClick={async () => {
                    setWorking(true);
                    try {
                      await api("calendar/disconnect", { provider: p });
                      chooseProvider("local");
                      commit((d) => {
                        d.calendarSnapshot = undefined;
                      });
                      await refresh();
                    } catch (e) {
                      setError((e as Error).message);
                    } finally {
                      setWorking(false);
                    }
                  }}
                >
                  Disconnect
                </button>
              ) : p === "google" ? (
                service?.google.configured ? (
                  <a className="text-link" href="/api/calendar/google/connect">
                    Connect
                  </a>
                ) : (
                  <Link className="text-link" to="/app/integrations">
                    Set up
                  </Link>
                )
              ) : (
                <button
                  className="text-link"
                  onClick={() => setAppleForm(true)}
                >
                  Connect
                </button>
              )}
            </div>
          ))}
        </div>
        <Link className="text-link" to="/app/settings/coaching">
          Edit available hours
        </Link>
      </details>
      {appleForm && (
        <Modal
          title="Connect iCloud Calendar"
          onClose={() => setAppleForm(false)}
        >
          <form onSubmit={connectApple}>
            <label>
              Apple ID email
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </label>
            <label>
              App-specific password
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
              />
            </label>
            <p className="field-hint">
              Create an app-specific password in your Apple account’s Sign-In
              and Security settings.
            </p>
            <button className="button primary" disabled={working}>
              Connect calendar
            </button>
          </form>
        </Modal>
      )}
    </div>
  );
}
