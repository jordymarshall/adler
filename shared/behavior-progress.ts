import type { Data } from "./workspace.ts";
import { addDays, dateInZone } from "./journey.ts";

export function behaviorProgress(
  data: Data,
  today = dateInZone(data.timeZone),
) {
  const dates = Array.from({ length: 28 }, (_, index) =>
    addDays(today, index - 27),
  );
  const series = data.goals.map((goal) => {
    const actions = data.actions.filter(
      (a) =>
        a.goalId === goal.id &&
        a.date &&
        a.date <= today &&
        (!a.retiredAt || a.outcome),
    );
    function rate(start: string, end: string) {
      const due = actions.filter((a) => a.date >= start && a.date <= end);
      const reported = due.filter((a) => a.outcome);
      const done = reported.filter((a) => a.outcome === "Done").length;
      return {
        rate: reported.length ? (done / reported.length) * 100 : null,
        done,
        reported: reported.length,
        unknown: due.length - reported.length,
      };
    }
    return {
      goalId: goal.id,
      title: goal.title,
      ...rate(dates[0], today),
      points: dates.map((date) => ({ date, ...rate(addDays(date, -6), date) })),
    };
  });
  const mean = (values: (number | null)[]) => {
    const known = values.filter((v): v is number => v !== null);
    return known.length
      ? known.reduce((sum, v) => sum + v, 0) / known.length
      : null;
  };
  return {
    dates,
    series,
    rate: mean(series.map((s) => s.rate)),
    reported: series.reduce((sum, s) => sum + s.reported, 0),
    unknown: series.reduce((sum, s) => sum + s.unknown, 0),
    average: dates.map((date, index) => ({
      date,
      rate: mean(series.map((s) => s.points[index].rate)),
    })),
  };
}
