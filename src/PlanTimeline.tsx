import { useId, useState } from "react";
import { CalendarDays, Flag, RefreshCw } from "lucide-react";
import { currentProgram, formatDate, localDate, type Data } from "./store";

export type TimelineEvent = {
  id: string;
  date: string;
  kind: "work" | "checkpoint" | "review";
  title: string;
  detail: string;
};
const lanes = [
  { kind: "work", label: "Do the work", Icon: CalendarDays },
  { kind: "checkpoint", label: "Check the result", Icon: Flag },
  { kind: "review", label: "Review & adjust", Icon: RefreshCw },
] as const;

export function programTimeline(
  data: Data,
  today = localDate(),
): TimelineEvent[] {
  const program = currentProgram(data);
  const goal = data.goals.find((g) => g.id === program.focusGoalId);
  if (!goal) return [];
  const events: TimelineEvent[] = (goal.checkpoints ?? []).map((point) => ({
    id: point.id,
    date: point.date,
    kind: "checkpoint",
    title: point.label,
    detail: `Planned result: ${point.value} ${goal.unit ?? "milestones complete"}. ${goal.success}`,
  }));
  for (const milestone of goal.milestones.filter((m) => m.dueDate && !m.done)) {
    if (
      !events.some(
        (e) => e.date === milestone.dueDate && e.title === milestone.title,
      )
    )
      events.push({
        id: milestone.id,
        date: milestone.dueDate!,
        kind: "checkpoint",
        title: milestone.title,
        detail: `Finished when: ${milestone.criterion}`,
      });
  }
  if (goal.targetDate && !events.some((e) => e.date === goal.targetDate))
    events.push({
      id: `${goal.id}-deadline`,
      date: goal.targetDate,
      kind: "checkpoint",
      title: "Goal deadline",
      detail: goal.success,
    });
  for (const block of data.workBlocks.filter((b) => b.goalId === goal.id)) {
    const date = new Intl.DateTimeFormat("en-CA", {
      timeZone: data.timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date(block.start));
    const time = new Intl.DateTimeFormat(undefined, {
      timeZone: data.timeZone,
      hour: "numeric",
      minute: "2-digit",
    });
    events.push({
      id: block.id,
      date,
      kind: "work",
      title: block.action,
      detail: `${time.format(new Date(block.start))}–${time.format(new Date(block.end))} · ${block.status} · ${data.timeZone}`,
    });
  }
  events.push({
    id: `sprint-${program.version}`,
    date: program.sprintEnd,
    kind: "review",
    title: "Review this sprint",
    detail: `Compare your result with: ${program.sprintResult}. Choose what to keep or adjust.`,
  });
  return events.filter((e) => e.date >= today);
}

export function PlanTimeline({
  events,
  today = localDate(),
}: {
  events: TimelineEvent[];
  today?: string;
}) {
  const id = useId();
  const [selected, setSelected] = useState<string | null>(null);
  const dates = [
    ...new Set(events.map((event) => event.date).concat(today)),
  ].sort();
  const groups = lanes.flatMap((lane, laneIndex) =>
    dates.flatMap((date) => {
      const items = events.filter(
        (event) => event.date === date && event.kind === lane.kind,
      );
      return items.length
        ? [{ key: `${lane.kind}-${date}`, date, lane, laneIndex, items }]
        : [];
    }),
  );
  const active =
    groups.find((group) => group.key === selected) ??
    [...groups].sort((a, b) => a.date.localeCompare(b.date))[0];
  const width = Math.max(680, dates.length * 110 + 135);
  const x = (date: string) =>
    135 + (dates.indexOf(date) / Math.max(1, dates.length - 1)) * (width - 215);
  return (
    <div className="plan-timeline">
      <div className="timeline-heading">
        <div>
          <span className="section-kicker">YOUR PLAN AT A GLANCE</span>
          <h3>How your next steps connect</h3>
        </div>
        <span>
          {formatDate(dates[0])}–{formatDate(dates.at(-1)!)}
        </span>
      </div>
      {events.length ? (
        <>
          <div
            className="timeline-scroll"
            role="region"
            aria-label="Plan timeline; scroll horizontally on small screens"
            tabIndex={0}
          >
            <svg
              viewBox={`0 0 ${width} 260`}
              style={{ minWidth: Math.max(470, width * 0.7) }}
              role="group"
              aria-labelledby={`${id}-title`}
            >
              <title id={`${id}-title`}>
                Scheduled work, result checkpoints, and reviews in date order.
                Select a marker for details.
              </title>
              {lanes.map((lane, i) => (
                <g key={lane.kind}>
                  <rect
                    x="125"
                    y={43 + i * 62}
                    width={width - 160}
                    height="46"
                    rx="8"
                    className={`timeline-lane ${lane.kind}`}
                  />
                  <text x="5" y={71 + i * 62}>
                    {lane.label}
                  </text>
                </g>
              ))}
              <line
                x1={x(today)}
                x2={x(today)}
                y1="30"
                y2="217"
                className="chart-today"
              />
              <text x={x(today)} y="19" textAnchor="middle">
                Today
              </text>
              {groups.map((group) => {
                const chosen = active?.key === group.key;
                return (
                  <g
                    key={group.key}
                    className={`timeline-marker ${group.lane.kind}`}
                    role="button"
                    tabIndex={0}
                    aria-pressed={chosen}
                    aria-label={`${formatDate(group.date)}: ${group.items.map((item) => item.title).join(", ")}`}
                    aria-controls={`${id}-detail`}
                    onClick={() => setSelected(group.key)}
                    onKeyDown={(event) => {
                      if (["Enter", " "].includes(event.key)) {
                        event.preventDefault();
                        setSelected(group.key);
                      }
                    }}
                  >
                    <circle
                      cx={x(group.date)}
                      cy={66 + group.laneIndex * 62}
                      r="20"
                      className="timeline-hit"
                    />
                    <circle
                      cx={x(group.date)}
                      cy={66 + group.laneIndex * 62}
                      r={chosen ? 14 : 11}
                    />
                    <text
                      x={x(group.date)}
                      y={70 + group.laneIndex * 62}
                      textAnchor="middle"
                    >
                      {group.items.length > 1
                        ? group.items.length
                        : group.lane.kind === "work"
                          ? "•"
                          : group.lane.kind === "review"
                            ? "↻"
                            : "◆"}
                    </text>
                    <text
                      className="timeline-event-label"
                      x={x(group.date)}
                      y={94 + group.laneIndex * 62}
                      textAnchor="middle"
                    >
                      {group.items.length > 1
                        ? `${group.items.length} ${group.lane.kind === "work" ? "work blocks" : "checkpoints"}`
                        : group.items[0].title.length > 19
                          ? `${group.items[0].title.slice(0, 18).trim()}…`
                          : group.items[0].title}
                    </text>
                    <title>
                      {group.items.map((item) => item.title).join(" · ")}
                    </title>
                  </g>
                );
              })}
              {dates.map((date) => (
                <text key={date} x={x(date)} y="253" textAnchor="middle">
                  {formatDate(date)}
                </text>
              ))}
            </svg>
          </div>
          <div
            className="timeline-detail"
            id={`${id}-detail`}
            aria-live="polite"
          >
            {active && (
              <>
                <active.lane.Icon size={17} />
                <div>
                  <span>
                    {formatDate(active.date)} · {active.lane.label}
                  </span>
                  {active.items.map((event) => (
                    <div key={event.id}>
                      <b>{event.title}</b>
                      <p>{event.detail}</p>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
          <p className="timeline-hint">
            Dates run left to right. Select a marker for the full task and
            finish criterion.
            {!events.some((e) => e.kind === "work") &&
              " No upcoming work blocks yet—add time to your calendar to connect the plan to your week."}
          </p>
        </>
      ) : (
        <p className="timeline-hint">
          Choose a focus goal and add dated checkpoints. Your scheduled work and
          review will appear alongside them.
        </p>
      )}
    </div>
  );
}
