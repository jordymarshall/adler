import type { Goal } from "./store";
import { formatDate, localDate } from "./store";

export function ProgressRecords({ goal, today = localDate() }: { goal: Goal; today?: string }) {
  const planned = goal.checkpoints ?? [];
  const actual = goal.results.filter(r => r.date <= today);
  return (
        <details className="chart-data">
          <summary>View checkpoints and evidence</summary>
          <p className="field-hint">
            Checkpoints are agreed targets. Recorded results are supporting evidence
            from your reports; completed actions do not imply an outcome.
          </p>
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Type</th>
                <th>Value</th>
                <th>Record</th>
              </tr>
            </thead>
            <tbody>
              {[
                ...planned.map((p) => ({
                  ...p,
                  type: "Planned",
                  source: p.label,
                })),
                ...actual.map((p) => ({ ...p, type: "Recorded" })),
              ]
                .sort((a, b) => a.date.localeCompare(b.date))
                .map((p) => (
                  <tr key={p.id} id={`record-${p.id}`}>
                    <td>{formatDate(p.date)}</td>
                    <td>{p.type}</td>
                    <td>{p.value}</td>
                    <td>{p.source}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </details>
  );
}
