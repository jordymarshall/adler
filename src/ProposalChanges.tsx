import { PlanExplanation } from "./PlanExplanation";
import type { PlanningBasis } from "../shared/planning";
import { currentRecord } from "../shared/change-record";
import { ChevronDown } from "lucide-react";
import { formatDate, type Data } from "./store";
import type { Change } from "../server/commands";
import { METHODS } from "./methods";
import { ChangeComparison, ChangeReason } from "./ChangeComparison";
import type { AdaptivePlan } from "../shared/adaptive-plan";

const recordLabels: Record<Change["entity"], string> = {
  goal: "Goal",
  plan: "Plan",
  milestone: "Milestone",
  checkpoint: "Progress check",
  action: "Action",
  result: "Recorded result",
  memory: "Saved information",
  program: "Weekly plan",
  review: "Review",
  preferences: "Preferences",
  workBlock: "Calendar",
  conversation: "Chat",
};
const fieldLabels: Record<string, string> = {
  targetDate: "Goal deadline",
  dueDate: "Milestone date",
  success: "A successful result",
  why: "Why it matters",
  criterion: "Finished when",
  action: "Next action",
  timing: "When to do it",
  text: "Personal context",
  approach: "Approach to try",
  sprintResult: "Sprint result",
  sprintStart: "Sprint starts",
  sprintEnd: "Sprint ends",
  weeklyMinutes: "Minutes per week",
  sessionMinutes: "Minutes per session",
  workStart: "Available from",
  workEnd: "Available until",
  workDays: "Available days",
  reviewDay: "Weekly review day",
  enabledMethods: "Coaching methods",
  focusGoalId: "Focus goal",
  calendarId: "Destination calendar",
  conflictIds: "Calendars checked for conflicts",
  checkIn: "Include a check-in",
  start: "Starts",
  end: "Ends",
  baseline: "Starting score",
  assessmentTarget: "Target score",
  done: "Verified complete",
  source: "Evidence",
  value: "Result",
  complete: "Finish this review",
};
function label(key: string) {
  return fieldLabels[key] ?? key.replace(/([A-Z])/g, " $1");
}
function Value({
  value,
  field,
  data,
}: {
  value: unknown;
  field?: string;
  data: Data;
}) {
  if (field === "focusGoalId")
    return (
      <>{data.goals.find((g) => g.id === value)?.title ?? "New focus goal"}</>
    );
  if (field === "enabledMethods" && Array.isArray(value))
    return (
      <>
        {value
          .map((id) => METHODS.find((m) => m.id === id)?.name ?? id)
          .join(" · ")}
      </>
    );
  if (field === "workDays" && Array.isArray(value))
    return (
      <>
        {[...value]
          .sort()
          .map((day) => ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][day])
          .join(" · ")}
      </>
    );
  if (Array.isArray(value))
    return (
      <ul>
        {value.map((entry, i) => (
          <li key={i}>
            <Value value={entry} data={data} />
          </li>
        ))}
      </ul>
    );
  if (value && typeof value === "object")
    return (
      <dl>
        {Object.entries(value).map(([key, entry]) => (
          <div key={key}>
            <dt>{label(key)}</dt>
            <dd>
              <Value value={entry} field={key} data={data} />
            </dd>
          </div>
        ))}
      </dl>
    );
  if (
    typeof value === "string" &&
    ["targetDate", "dueDate", "date", "sprintStart", "sprintEnd"].includes(
      field ?? "",
    ) &&
    /^\d{4}-\d{2}-\d{2}$/.test(value)
  )
    return (
      <>
        {formatDate(value, { month: "short", day: "numeric", year: "numeric" })}
      </>
    );
  if ((field === "start" || field === "end") && typeof value === "string")
    return (
      <>
        {new Date(value).toLocaleString(undefined, {
          timeZone: data.timeZone,
          month: "short",
          day: "numeric",
          hour: "numeric",
          minute: "2-digit",
          timeZoneName: "short",
        })}
      </>
    );
  return (
    <>
      {value === null
        ? "Not known yet"
        : typeof value === "boolean"
          ? value
            ? "Yes"
            : "No"
          : String(value)}
    </>
  );
}
export function ProposalChanges({
  changes,
  data,
  beforeRecords,
}: {
  beforeRecords?: (Record<string, unknown> | null)[];
  changes: Change[];
  data: Data;
}) {
  return (
    <ol className="adjustment-changes" aria-label="Proposed changes">
      {changes.map((change, i) => {
        const values = JSON.parse(change.values) as Record<string, unknown>;
        const adaptive = values.adaptive as AdaptivePlan | undefined;
        const before = beforeRecords
          ? (beforeRecords[i] ?? undefined)
          : currentRecord(change, data);
        const goal = data.goals.find(
          (g) =>
            g.id === (change.entity === "goal" ? change.id : change.parentId),
        );
        const title = String(
          values.title ??
            (change.entity === "plan"
              ? "Plan"
              : change.entity === "memory"
                ? change.operation === "create"
                  ? "Save what you told Adler"
                  : change.operation === "delete"
                    ? "Remove saved information"
                    : "Update your saved information"
                : change.entity === "program"
                  ? "Coaching program"
                  : (before?.title ?? goal?.title ?? label(change.entity))),
        );
        const fields = Object.entries(values).filter(
          ([key, value]) =>
            key !== "reason" &&
            key !== "basis" &&
            key !== "adaptive" &&
            !(
              change.entity === "goal" &&
              change.operation === "create" &&
              values.kind !== "learning" &&
              ["assessmentTarget", "baseline"].includes(key)
            ) &&
            !(
              change.operation === "update" &&
              JSON.stringify(before?.[key]) === JSON.stringify(value)
            ),
        );
        const reason =
          change.reason ??
          (typeof values.reason === "string"
            ? values.reason
            : "No reason was saved with this proposal.");
        return (
          <li key={`${change.entity}-${change.id ?? "new"}-${i}`}>
            <details className="adjustment-record" open>
              <summary>
                <div>
                  <span>
                    {String(i + 1).padStart(2, "0")} ·{" "}
                    {recordLabels[change.entity]} ·{" "}
                    {change.operation === "create"
                      ? "Add"
                      : change.operation === "delete"
                        ? "Remove"
                        : "Update"}
                    {goal ? ` · ${goal.title}` : ""}
                  </span>
                  <b>{title}</b>
                </div>
                <ChevronDown size={14} />
              </summary>
              {change.entity === "memory" && (
                <p className="adjustment-context-note">
                  This updates the information Adler uses when suggesting plans.
                </p>
              )}
              {change.operation === "delete" ? (
                <div className="adjustment-removal">
                  <ChangeComparison
                    before={
                      <Value
                        value={
                          before?.title ??
                          before?.text ??
                          before?.action ??
                          title
                        }
                        data={data}
                      />
                    }
                    after="Removed from your workspace"
                  />
                </div>
              ) : change.operation === "create" ? (
                <div className="adjustment-creation">
                  <ChangeComparison
                    before="Not added yet"
                    after={
                      <Value value={Object.fromEntries(fields)} data={data} />
                    }
                  />
                </div>
              ) : (
                <dl className="adjustment-fields">
                  {fields.map(([key, value]) => (
                    <div key={key}>
                      <dt>{label(key)}</dt>
                      <dd>
                        <ChangeComparison
                          before={
                            before?.[key] === undefined ? (
                              "Not set"
                            ) : (
                              <Value
                                value={before[key]}
                                field={key}
                                data={data}
                              />
                            )
                          }
                          after={
                            <Value value={value} field={key} data={data} />
                          }
                        />
                      </dd>
                    </div>
                  ))}
                </dl>
              )}
              <ChangeReason>{reason}</ChangeReason>
              {adaptive && <div className="adaptive-proposal">
                <p><b>Approach:</b> {adaptive.approach}</p>
                <p><b>{adaptive.window.label}</b> · {formatDate(adaptive.window.start)}–{formatDate(adaptive.window.end)} · {adaptive.window.capacityMinutes} minutes available</p>
                <p>{adaptive.window.rationale}</p>
                <ol>{adaptive.steps.map(step => <li key={step.id}><b>{step.title}</b><p>{step.criterion}</p>
                  <p>{step.durationMinutes} minutes · {step.cue} · From {formatDate(step.scheduledDate)}{step.recurrence ? `, every ${step.recurrence.everyDays} day${step.recurrence.everyDays === 1 ? "" : "s"} until ${formatDate(step.recurrence.until)}` : ""}</p>
                  <p>{step.reason}</p>{step.recurrence?.weekdays && <p>On {step.recurrence.weekdays.map(day => ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][day]).join(", ")}</p>}{step.dependsOn.length > 0 && <p>After: {step.dependsOn.map(id => adaptive.steps.find(s => s.id === id)?.title ?? id).join(", ")}</p>}{step.fallback && <p>Smaller option: {step.fallback}</p>}{step.measure && <p>{step.measure.label}{step.measure.target !== null ? `: ${step.measure.target} ${step.measure.unit} per occurrence` : ` (${step.measure.unit})`}</p>}
                </li>)}</ol>
                <p><b>Next assessment:</b> {new Date(adaptive.assessment.at).toLocaleString(undefined, { timeZone: data.timeZone })} · {adaptive.assessment.question}</p>
                <p>{adaptive.assessment.adaptation}</p>
                {adaptive.experiment && <><p><b>What we’re testing:</b> {adaptive.experiment.hypothesis}</p><p><b>Signal to watch:</b> {adaptive.experiment.outcomeSignal}</p><p><b>Starting comparison{adaptive.experiment.comparisonStatus === "unknown" ? " · not yet known" : " · reported"}:</b> {adaptive.experiment.comparison}</p><p><b>Review rule:</b> {adaptive.experiment.decisionRule}</p><p><b>Other explanations:</b> {adaptive.experiment.alternativeExplanations.join("; ") || "To establish together"}</p></>}
              </div>}
              {Boolean(values.basis) && (
                <PlanExplanation basis={values.basis as PlanningBasis} />
              )}
            </details>
          </li>
        );
      })}
    </ol>
  );
}
export function ProposalEssentials({
  changes,
  data,
}: {
  changes: Change[];
  data: Data;
}) {
  return (
    <div className="proposal-essentials">
      {changes.map((change, index) => {
        const values = JSON.parse(change.values) as Record<string, unknown>;
        const before = currentRecord(change, data);
        const basis = values.basis as PlanningBasis | undefined;
        if (change.operation === "delete")
          return (
            <p key={index}>
              Remove {recordLabels[change.entity].toLowerCase()}:{" "}
              {String(
                before?.title ??
                  before?.action ??
                  before?.text ??
                  recordLabels[change.entity],
              )}
              .
              {change.entity === "goal" &&
                " This also removes its plans and recorded history."}
            </p>
          );
        if (change.entity === "workBlock")
          return (
            <p key={index}>
              {change.operation === "create" ? "Book" : "Update"}:{" "}
              {String(values.action ?? before?.action ?? "Work session")} ·{" "}
              <Value
                value={values.start ?? before?.start}
                field="start"
                data={data}
              />
              –
              <Value
                value={values.end ?? before?.end}
                field="end"
                data={data}
              />{" "}
              · {String(values.provider ?? before?.provider ?? "local")}{" "}
              calendar{values.checkIn === true ? " · with a check-in" : ""}
            </p>
          );
        if (change.entity === "goal" || change.entity === "plan")
          return (
            <div key={index}>
              {typeof values.action === "string" && (
                <p>Next step: {values.action}</p>
              )}
              {basis && <p>{basis.decisionNote ?? basis.uncertainty}</p>}
            </div>
          );
        return null;
      })}
    </div>
  );
}
