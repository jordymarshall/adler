import { useEffect, useState, type FormEvent } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  ArrowRight,
  CalendarDays,
  Check,
  Clock3,
  Link2,
  RefreshCw,
} from "lucide-react";
import { api, type CalendarOption, type ServiceStatus } from "./api";
import { currentPlan, currentProgram, useStore, type Action } from "./store";
import { Modal } from "./components";
import { CalendarLogo } from "./CalendarLogo";
import { RecordAction } from "./Workspace";
import { findSlots } from "./scheduling";
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
function savedPending(): BookingInput | null {
  try {
    return JSON.parse(sessionStorage.getItem(pendingKey) ?? "null");
  } catch {
    return null;
  }
}
const displayTime = (date: string) =>
  new Date(date).toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
export function Calendar() {
  const { data, commit, flush, refresh: refreshWorkspace } = useStore();
  const program = currentProgram(data);
  const [params] = useSearchParams();
  const [service, setService] = useState<ServiceStatus | null>(null);
  const [calendars, setCalendars] = useState<{
    google: CalendarOption[];
    apple: CalendarOption[];
  }>({ google: [], apple: [] });
  const [provider, setProvider] = useState<Provider>("local");
  const [selected, setSelected] = useState(() => {
    const requested = params.get("goal");
    return data.goals.some((g) => g.id === requested && g.status === "Active")
      ? requested!
      : program.focusGoalId;
  });
  const [destination, setDestination] = useState("");
  const [conflicts, setConflicts] = useState<string[]>([]);
  const [busy, setBusy] = useState<BusyInterval[]>([]);
  const [checkedAt, setCheckedAt] = useState("");
  const [slot, setSlot] = useState<BusyInterval | null>(null);
  const [checkIn, setCheckIn] = useState(true);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState(params.get("error") ?? "");
  const [appleForm, setAppleForm] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState<BookingInput | null>(savedPending);
  const [recording, setRecording] = useState<Action | null>(null);
  const goal = data.goals.find(
    (g) => g.id === selected && g.status === "Active",
  );
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const localBusy = data.workBlocks.map((b) => ({
    start: b.start,
    end: b.end,
  }));
  const slots =
    provider === "local" || checkedAt
      ? findSlots(program, [...busy, ...localBusy], new Date(), checkIn)
      : [];
  const weeklyScheduled = data.workBlocks
    .filter(
      (b) =>
        Date.parse(b.start) >= Date.now() &&
        Date.parse(b.start) < Date.now() + 7 * 86400000,
    )
    .reduce((s, b) => s + (Date.parse(b.end) - Date.parse(b.start)) / 60000, 0);
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
      const start = new Date();
      const end = new Date(start);
      end.setDate(end.getDate() + 7);
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
        const date = new Date(input.start);
        const localDay = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
        d.actions = d.actions.filter(
          (a) =>
            a.goalId !== input.goalId ||
            a.date ||
            a.outcome ||
            a.title !== input.title,
        );
        d.actions.push({
          id: input.id,
          goalId: input.goalId,
          title: input.title,
          criterion: currentPlan(current).criterion,
          timing: displayTime(input.start),
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
      setCheckedAt("");
      setBusy([]);
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
  function confirm() {
    if (!slot || !goal) return;
    const input = {
      id: crypto.randomUUID(),
      goalId: goal.id,
      title: currentPlan(goal).action,
      ...slot,
      provider,
    };
    if (provider === "local") {
      if (saveBlock(input)) setSlot(null);
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
    <div className="calendar-page">
      <div className="page-heading">
        <div>
          <span className="section-kicker">
            GIVE THE WORK A PLACE IN YOUR WEEK
          </span>
          <h1>Make time for your goals.</h1>
          <p>
            Find a gap, book a specific action, and check what happened
            afterward.
          </p>
        </div>
        <Link className="button secondary" to="/app/coach/program">
          Edit work hours <ArrowRight size={15} />
        </Link>
      </div>
      <div className="calendar-connections">
        {(["google", "apple"] as const).map((p) => (
          <section className="panel connection-card" key={p}>
            <span className={`calendar-brand ${p}`}>
              <CalendarLogo provider={p} />
            </span>
            <div>
              <h3>
                {p === "google" ? "Google Calendar" : "Apple · iCloud Calendar"}
              </h3>
              <p>
                {service?.[p].connected
                  ? "Connected for this server session"
                  : p === "google"
                    ? service?.google.configured
                      ? "Ready to connect your account"
                      : "OAuth setup required"
                    : "Connect with an app-specific password"}
              </p>
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
                  } catch (err) {
                    setError((err as Error).message);
                  } finally {
                    setWorking(false);
                  }
                }}
              >
                Disconnect
              </button>
            ) : p === "google" && service?.google.configured ? (
              <a
                className="button secondary"
                href="/api/calendar/google/connect"
              >
                Connect
              </a>
            ) : p === "apple" ? (
              <button
                className="button secondary"
                onClick={() => setAppleForm(true)}
              >
                Connect
              </button>
            ) : (
              <a className="text-link" href="#calendar-setup">
                View setup
              </a>
            )}
          </section>
        ))}
      </div>
      {error && (
        <p role="alert" className="inline-error">
          {error}
        </p>
      )}
      {pending && (
        <section className="panel pending-booking">
          <h3>Finish confirming this booking</h3>
          <p>
            {pending.title} · {displayTime(pending.start)}
          </p>
          <p>
            Retry checks the existing event IDs to avoid duplicates. Review your
            calendar before choosing a different booking.
          </p>
          <button
            className="button primary"
            disabled={working}
            onClick={() => void book(pending)}
          >
            Retry confirmation <RefreshCw size={15} />
          </button>
          <button
            className="button text-button"
            disabled={working}
            onClick={() => {
              sessionStorage.removeItem(pendingKey);
              setPending(null);
              setCheckedAt("");
              setSlot(null);
            }}
          >
            I’ve checked my calendar · close this booking
          </button>
        </section>
      )}
      <div className="calendar-layout">
        <section className="panel calendar-planner">
          <div className="section-kicker">01 · CHOOSE THE WORK</div>
          <label>
            Goal
            <select
              aria-label="Goal to schedule"
              value={selected}
              onChange={(e) => {
                setSelected(e.target.value);
                setSlot(null);
              }}
            >
              {data.goals
                .filter((g) => g.status === "Active")
                .map((g) => (
                  <option value={g.id} key={g.id}>
                    {g.title}
                  </option>
                ))}
            </select>
          </label>
          {goal && (
            <div className="calendar-action">
              <b>{currentPlan(goal).action}</b>
              <p>Finished when: {currentPlan(goal).criterion}</p>
            </div>
          )}
          <label>
            Book in
            <select
              aria-label="Book in"
              value={provider}
              onChange={(e) => chooseProvider(e.target.value as Provider)}
            >
              <option value="local">Adler only · no external calendar</option>
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
                  value={destination}
                  onChange={(e) => {
                    setDestination(e.target.value);
                    setCheckedAt("");
                    setSlot(null);
                  }}
                >
                  {calendars[provider]
                    .filter((c) => c.writable)
                    .map((c) => (
                      <option value={c.id} key={c.id}>
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
                      disabled={destination === c.id}
                      onChange={(e) => {
                        setConflicts(
                          e.target.checked
                            ? [...conflicts, c.id]
                            : conflicts.filter((id) => id !== c.id),
                        );
                        setCheckedAt("");
                        setSlot(null);
                      }}
                    />
                    {c.name}
                  </label>
                ))}
              </fieldset>
            </>
          )}
          <label className="checkbox-line">
            <input
              type="checkbox"
              checked={checkIn}
              disabled={provider === "local"}
              onChange={(e) => {
                setCheckIn(e.target.checked);
                setSlot(null);
              }}
            />
            {provider === "local"
              ? "Check in from Today after the session"
              : "Add a 5-minute check-in after the work block"}
          </label>
          <div className="capacity-meter">
            <span>
              {weeklyScheduled} / {program.weeklyMinutes} min scheduled in the
              next 7 days
            </span>
            <progress max={program.weeklyMinutes} value={weeklyScheduled} />
            <p>
              {weeklyScheduled + program.sessionMinutes > program.weeklyMinutes
                ? "This session would exceed your weekly time budget. Review your priorities before adding it."
                : `${program.weeklyMinutes - weeklyScheduled} minutes remain in your weekly budget.`}
            </p>
          </div>
        </section>
        <section className="panel calendar-slots">
          <div className="calendar-slots-heading">
            <div>
              <span className="section-kicker">02 · CHOOSE A TIME</span>
              <h2>{program.sessionMinutes} minutes for the next step.</h2>
              <p>
                {timezone} · {program.workStart}–{program.workEnd}
              </p>
            </div>
            {provider !== "local" && (
              <button
                className="button secondary"
                disabled={working || !destination}
                onClick={() => void checkAvailability()}
              >
                <RefreshCw size={15} />
                {checkedAt ? "Refresh" : "Check availability"}
              </button>
            )}
          </div>
          <p className="calendar-availability-note">
            {provider === "local"
              ? "Suggestions use your work hours and Adler blocks. External calendar conflicts have not been checked."
              : checkedAt
                ? `Selected calendars checked at ${new Date(checkedAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}. Rechecked when you book.`
                : "Check availability to see suggested slots from your selected calendars."}
          </p>
          {!!slots.length && (
            <div className="slot-grid">
              {slots.slice(0, 12).map((s) => (
                <button
                  key={s.start}
                  className={slot?.start === s.start ? "selected" : ""}
                  aria-pressed={slot?.start === s.start}
                  onClick={() => setSlot(s)}
                  disabled={working || Boolean(pending)}
                >
                  <CalendarDays size={17} />
                  <span>
                    {new Date(s.start).toLocaleDateString(undefined, {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                    })}
                    <b>
                      {new Date(s.start).toLocaleTimeString([], {
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                    </b>
                  </span>
                  {slot?.start === s.start && <Check size={16} />}
                </button>
              ))}
            </div>
          )}
          {!slots.length && (provider === "local" || checkedAt) && (
            <p>
              No open slots fit this week. Edit your work hours or session
              length in the program.
            </p>
          )}
          {slot && (
            <div className="booking-confirmation">
              <h3>Confirm the time block</h3>
              <p>{goal && currentPlan(goal).action}</p>
              <p>
                <Clock3 size={15} />
                {displayTime(slot.start)} · {program.sessionMinutes} min
                {provider !== "local" && checkIn ? " + 5 min check-in" : ""}
              </p>
              <button
                className="button primary"
                disabled={working || !goal || Boolean(pending)}
                onClick={confirm}
              >
                {working
                  ? "Confirming…"
                  : provider === "local"
                    ? "Save in Adler"
                    : "Book in my calendar"}
                <Check size={15} />
              </button>
            </div>
          )}
        </section>
      </div>
      <section className="scheduled-work">
        <h2>Your scheduled work</h2>
        {data.workBlocks.length ? (
          [...data.workBlocks]
            .sort((a, b) => a.start.localeCompare(b.start))
            .map((block) => {
              const action = data.actions.find((a) => a.id === block.id);
              return (
                <article className="panel work-block" key={block.id}>
                  <div className="work-block-date">
                    <CalendarDays size={20} />
                    <b>{displayTime(block.start)}</b>
                  </div>
                  <div>
                    <h3>{block.action}</h3>
                    <p>
                      {data.goals.find((g) => g.id === block.goalId)?.title} ·{" "}
                      {block.provider === "local"
                        ? "Adler only"
                        : block.provider === "google"
                          ? "Google Calendar"
                          : "iCloud Calendar"}
                    </p>
                  </div>
                  {action?.outcome ? (
                    <span className="pace-badge positive">
                      {action.outcome}
                    </span>
                  ) : action && Date.parse(block.end) <= Date.now() ? (
                    <button
                      className="button secondary"
                      onClick={() => setRecording(action)}
                    >
                      Check in
                    </button>
                  ) : (
                    <span className="pace-badge neutral">Scheduled</span>
                  )}
                </article>
              );
            })
        ) : (
          <div className="panel">
            <p>No time blocks yet. Choose a goal and a slot above.</p>
          </div>
        )}
      </section>
      <details className="panel calendar-setup" id="calendar-setup">
        <summary>
          <Link2 size={16} /> Calendar setup & connection details
        </summary>
        <h3>Google Calendar</h3>
        <p>
          Create a Google OAuth Web client with Calendar API enabled. Configure
          GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and GOOGLE_REDIRECT_URI on the
          server, then restart Adler. Register this exact callback:{" "}
          <code>{window.location.origin}/api/calendar/google/callback</code>.
        </p>
        <h3>Apple Calendar</h3>
        <p>
          This connects iCloud-backed calendars using CalDAV. Local-only,
          Google, and Exchange calendars shown inside Apple Calendar need their
          own connection. Shared calendars may be read-only; a rejected write is
          shown as a failed booking.
        </p>
        <p>
          Connections and credentials are kept in server memory; reconnect after
          a server restart. Google disconnect requests token revocation. Revoke
          an Apple app-specific password in your Apple Account to remove its
          access. Existing events remain in your calendar.
        </p>
        <p>
          iCloud recurring events must be expanded successfully before slots are
          offered. All-day events block a conservative full-day range. Calendar
          event details are processed on the server for availability; they are
          not sent to the coach. Check-in events use your calendar’s
          notifications. Adler does not send background messages while closed.
        </p>
      </details>
      {appleForm && (
        <Modal
          title="Connect iCloud Calendar"
          onClose={() => {
            if (!working) {
              setAppleForm(false);
              setPassword("");
            }
          }}
        >
          <form className="program-form" onSubmit={connectApple}>
            <p>
              Use an app-specific password generated in your Apple Account. It
              is sent to this local server and kept only for the server session.
            </p>
            <a
              className="text-link"
              href="https://support.apple.com/en-us/102654"
              target="_blank"
              rel="noreferrer"
            >
              How to generate an app-specific password ↗
            </a>
            <label>
              Apple Account email
              <input
                type="email"
                required
                autoComplete="username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </label>
            <label>
              App-specific password
              <input
                type="password"
                required
                autoComplete="off"
                pattern="[a-z]{4}(-[a-z]{4}){3}"
                placeholder="xxxx-xxxx-xxxx-xxxx"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </label>
            <button className="button primary" disabled={working}>
              {working ? "Connecting…" : "Connect iCloud"}
            </button>
          </form>
        </Modal>
      )}
      {recording && (
        <RecordAction action={recording} onClose={() => setRecording(null)} />
      )}
    </div>
  );
}
