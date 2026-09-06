import type { BusyInterval, ProgramVersion } from "./program-types";
export const overlaps = (a: BusyInterval, b: BusyInterval) =>
  Date.parse(a.start) < Date.parse(b.end) &&
  Date.parse(b.start) < Date.parse(a.end);
export function findSlots(
  program: ProgramVersion,
  busy: BusyInterval[],
  now = new Date(),
  checkIn = true,
) {
  const slots: BusyInterval[] = [];
  for (let offset = 0; offset < 7; offset++) {
    const day = new Date(now);
    day.setDate(day.getDate() + offset);
    if (!program.workDays.includes(day.getDay())) continue;
    const [sh, sm] = program.workStart.split(":").map(Number);
    const [eh, em] = program.workEnd.split(":").map(Number);
    const start = new Date(day);
    start.setHours(sh, sm, 0, 0);
    const end = new Date(day);
    end.setHours(eh, em, 0, 0);
    let offered = 0;
    for (
      let t = start.getTime();
      t + (program.sessionMinutes + (checkIn ? 5 : 0)) * 60000 <= end.getTime();
      t += 15 * 60000
    ) {
      if (t <= now.getTime() + 5 * 60000) continue;
      const slot = {
        start: new Date(t).toISOString(),
        end: new Date(t + program.sessionMinutes * 60000).toISOString(),
      };
      const includingCheckIn = {
        ...slot,
        end: new Date(
          Date.parse(slot.end) + (checkIn ? 5 : 0) * 60000,
        ).toISOString(),
      };
      if (!busy.some((b) => overlaps(b, includingCheckIn))) {
        slots.push(slot);
        offered++;
        t += program.sessionMinutes * 60000;
      }
      if (offered === 3) break;
    }
  }
  return slots;
}
