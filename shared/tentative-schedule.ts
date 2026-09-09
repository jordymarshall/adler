import type { Data } from "./workspace.ts";
import { actionReady, actionStep } from "./adaptive-plan.ts";
import { addDays, dateInZone, reviewBlock, zonedTime } from "./journey.ts";
import { findSlots } from "../src/scheduling.ts";
import type { BusyInterval } from "../src/program-types.ts";

export const calendarWeek = (date: string) => addDays(date, -((new Date(`${date}T12:00:00Z`).getUTCDay() + 6) % 7));
export type TentativeBlock = BusyInterval & { id: string; goalId: string; title: string };

// Placement is derived from the coach's saved work and capacity, never a booking
// or an observation. Both the harness and calendar consume this same result.
export function tentativeSchedule(data: Data, start: string, end: string, now = new Date(), checkedBusy?: BusyInterval[], placement?: TentativeBlock) {
  const today = dateInZone(data.timeZone, now), program = data.programs.at(-1)!;
  const snapshot = data.calendarSnapshot;
  const age = snapshot ? now.getTime() - Date.parse(snapshot.checkedAt) : Infinity;
  const fresh = snapshot && age >= 0 && age <= 300000 && Date.parse(snapshot.start) <= zonedTime(start, "00:00", data.timeZone)!.getTime() && Date.parse(snapshot.end) >= zonedTime(end, "00:00", data.timeZone)!.getTime();
  const external = checkedBusy ?? (fresh ? snapshot.busy : []);
  const occupied: BusyInterval[] = [...data.workBlocks, ...external, ...(placement ? [placement] : [])];
  const used = new Map<string, number>();
  for (let week = calendarWeek(start); week < end; week = addDays(week, 7)) {
    const review = reviewBlock(data, week);
    if (review) occupied.push(review);
  }
  for (const block of [...data.workBlocks, ...(placement ? [placement] : [])]) {
    const action = data.actions.find(action => action.id === block.id);
    const week = calendarWeek(dateInZone(data.timeZone, new Date(block.start)));
    const minutes = action?.actualMinutes ?? (action?.outcome === "Didn’t happen" ? 0 : (Date.parse(block.end) - Date.parse(block.start)) / 60000);
    used.set(week, (used.get(week) ?? 0) + minutes);
  }
  const booked = new Set(data.workBlocks.map(block => block.id));
  if (placement) booked.add(placement.id);
  for (const action of data.actions.filter(action => action.date && !booked.has(action.id) && (action.outcome || action.startedAt || !action.retiredAt && action.date < today))) {
    const minutes = action.actualMinutes ?? (action.outcome === "Didn’t happen" ? 0 : actionStep(data, action)?.durationMinutes ?? data.goals.find(goal => goal.id === action.goalId)?.plans.find(plan => plan.version === action.planVersion)?.durationMinutes ?? program.sessionMinutes);
    const week = calendarWeek(action.date);
    used.set(week, (used.get(week) ?? 0) + minutes);
  }
  const goals = data.goals.filter(goal => ["Draft", "Active"].includes(goal.status));
  const candidates = data.actions.filter(action => goals.some(goal => goal.id === action.goalId) && !action.retiredAt && !action.outcome && !action.startedAt && !booked.has(action.id) &&
    (!action.date || action.date >= start && action.date < end && action.date >= today))
    .sort((a, b) => Number(goals.find(goal => goal.id === b.goalId)?.status === "Active") - Number(goals.find(goal => goal.id === a.goalId)?.status === "Active") || (a.date || start).localeCompare(b.date || start) || Number(b.goalId === program.focusGoalId) - Number(a.goalId === program.focusGoalId) || a.id.localeCompare(b.id));
  const blocks: TentativeBlock[] = [], unplaced: { actionId: string; goalId: string; reason: string }[] = [];
  for (const action of candidates) {
    const goal = goals.find(goal => goal.id === action.goalId)!;
    const duration = actionStep(data, action)?.durationMinutes ?? goal.plans.find(plan => plan.version === action.planVersion)?.durationMinutes ?? program.sessionMinutes;
    if (!actionReady(data, action)) { unplaced.push({ actionId: action.id, goalId: goal.id, reason: "Waiting for a prerequisite" }); continue; }
    const date = action.date || (start > today ? start : today);
    const slots = findSlots({ ...program, sessionMinutes: duration }, occupied, now, false, data.timeZone, date)
      .filter(slot => { const day = dateInZone(data.timeZone, new Date(slot.start)); return day < end && (!action.date || day === action.date); });
    const slot = slots.find(slot => (used.get(calendarWeek(dateInZone(data.timeZone, new Date(slot.start)))) ?? 0) + duration <= program.weeklyMinutes);
    if (!slot) { unplaced.push({ actionId: action.id, goalId: goal.id, reason: slots.length ? "Weekly time budget is full" : "No room in the saved working hours" }); continue; }
    const week = calendarWeek(dateInZone(data.timeZone, new Date(slot.start)));
    used.set(week, (used.get(week) ?? 0) + duration);
    const block = { ...slot, id: action.id, goalId: goal.id, title: action.title };
    blocks.push(block); occupied.push(block);
  }
  const overBudget = [...used].filter(([week, minutes]) => week >= calendarWeek(start) && week < end && minutes > program.weeklyMinutes).map(([week, minutes]) => ({ week, minutes: minutes - program.weeklyMinutes }));
  return { blocks, unplaced, overBudget, busy: external, externalAvailability: checkedBusy !== undefined || fresh ? "checked" as const : "unknown" as const,
    basis: "Saved action dates and durations, working hours, weekly time budget and known busy time. Active work is placed before drafts; the focus goal is first when dates compete. Tentative placement is editable and is not a booking or an optimality claim." };
}
