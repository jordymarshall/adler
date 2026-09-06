import type { Data, Review } from "./workspace.ts";

export function dateInZone(timeZone: string, now = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}
export function addDays(date: string, days: number) {
  const value = new Date(`${date}T12:00:00Z`);
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10);
}
export function timeInZone(timeZone: string, now: Date) {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(now);
}

// Resolve a wall-clock time without depending on the browser/server timezone.
// Skipped DST times return null; repeated times choose the earlier occurrence.
export function zonedTime(
  date: string,
  time: string,
  timeZone: string,
): Date | null {
  const guess = Date.parse(`${date}T${time}:00Z`);
  const offsets = new Set<number>();
  for (const delta of [-86400000, 0, 86400000]) {
    const sample = new Date(guess + delta);
    const local = Date.parse(
      `${dateInZone(timeZone, sample)}T${timeInZone(timeZone, sample)}:00Z`,
    );
    offsets.add(local - sample.getTime());
  }
  const matches = [...offsets]
    .map((offset) => new Date(guess - offset))
    .filter(
      (candidate) =>
        dateInZone(timeZone, candidate) === date &&
        timeInZone(timeZone, candidate) === time,
    )
    .sort((a, b) => a.getTime() - b.getTime());
  return matches[0] ?? null;
}

export function reviewSchedule(data: Data, now = new Date()) {
  const today = dateInZone(data.timeZone, now);
  const days = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];
  const weekday = new Date(`${today}T12:00:00Z`).getUTCDay();
  const periodEnd = addDays(
    today,
    (days.indexOf(data.reviewDay) - weekday + 7) % 7,
  );
  const periodStart = addDays(periodEnd, -6);
  const belongs = (review: Review) =>
    review.periodEnd
      ? review.periodEnd === periodEnd
      : Boolean(
          review.completedAt &&
            dateInZone(data.timeZone, new Date(review.completedAt)) >=
              periodStart &&
            dateInZone(data.timeZone, new Date(review.completedAt)) <=
              periodEnd,
        );
  const completed =
    data.review.periodEnd === periodEnd && !data.review.completedAt
      ? undefined
      : [...data.reviews, data.review].find(
          (review) => review.completedAt && belongs(review),
        );
  const current =
    belongs(data.review) || (!data.review.completedAt && !data.review.periodEnd)
      ? data.review
      : { step: 0, note: "", decision: "" };
  const active = data.goals.filter((goal) => goal.status === "Active");
  const firstDay = active.length > 0 && active.every((goal) => goal.startDate === today) && !data.actions.some((action) => action.outcome);
  const deferFirstReview = firstDay && today === periodEnd;
  return {
    today,
    periodStart,
    periodEnd,
    completed,
    current: { ...current, periodStart, periodEnd },
    nextDate: completed || deferFirstReview ? addDays(periodEnd, 7) : periodEnd,
    due: !completed && !deferFirstReview && today === periodEnd,
  };
}
