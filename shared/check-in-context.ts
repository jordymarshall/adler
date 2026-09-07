import type { Action, Data } from "./workspace.ts";
import { actionStep } from "./adaptive-plan.ts";

export function checkInContext(data: Data, action: Action, now = new Date()) {
  const context: { source: string; observedAt: string; text: string }[] = [];
  for (const id of actionStep(data, action)?.contextIds ?? []) {
    const memory = data.memories.find(m => m.id === id);
    if (memory) context.push({ source: "Confirmed by you", observedAt: memory.date, text: memory.text });
  }
  const snapshot = data.calendarSnapshot;
  const block = data.workBlocks.find(b => b.id === action.id);
  if (snapshot && block && Date.parse(snapshot.checkedAt) <= now.getTime() &&
    now.getTime() - Date.parse(snapshot.checkedAt) <= 86400000 &&
    Date.parse(block.start) >= Date.parse(snapshot.start) && Date.parse(block.end) <= Date.parse(snapshot.end)) {
    const busy = snapshot.busy.some(b => Date.parse(b.start) < Date.parse(block.end) && Date.parse(b.end) > Date.parse(block.start) &&
      !data.workBlocks.some(own => Date.parse(own.start) === Date.parse(b.start) && Date.parse(own.end) === Date.parse(b.end)));
    if (busy) context.push({ source: snapshot.provider, observedAt: snapshot.checkedAt,
      text: "Checked calendar data showed busy time overlapping this session. You can add whether it affected your work." });
  }
  return context;
}
