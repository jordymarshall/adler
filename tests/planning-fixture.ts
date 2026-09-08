import type { PlanningBasis } from "../shared/planning.ts";
import type { generate } from "../server/providers.ts";
import type { searchLiterature } from "../server/research.ts";

export const basis: PlanningBasis = {
  interpretation: "Publish two essays by the agreed deadline.",
  strategy: "Draft an outline, get feedback, then publish each essay.",
  outcomeRationale: "Published essays directly measure the requested result.",
  alternatives: [
    {
      option: "Minutes spent writing",
      tradeoff:
        "Useful for understanding effort, but does not verify publication.",
    },
  ],
  actionMeasure: {
    label: "Outline points drafted",
    unit: "points",
    period: "action",
    target: 5,
    rationale: "An observable output for the first drafting action.",
  },
  evidence: [
    {
      sourceId: "epmc:MED:26479070",
      finding:
        "Progress monitoring interventions improved goal attainment on average.",
      application: "Record draft output and separately check publication.",
      limitation:
        "The review does not establish an optimal metric for writing essays.",
    },
  ],
  assumptions: [
    "An outline is a useful next step; this has not been tested for this user.",
  ],
  uncertainty:
    "We have no personal outcome data yet. This approach is provisional.",
  review: {
    date: "2026-12-01",
    question: "Did the outline help produce a draft?",
    adaptation:
      "Keep the approach if useful; otherwise discuss the obstacle and revise the action.",
  },
};
export const literature: typeof searchLiterature = async (queries) => ({
  queries,
  unavailable: [],
  searchedAt: "2026-09-06T12:00:00.000Z",
  sources: [
    {
      id: "epmc:MED:26479070",
      title: "Does monitoring goal progress promote goal attainment?",
      authors: "Harkin et al.",
      year: "2016",
      url: "https://europepmc.org/article/MED/26479070",
      summary:
        "Across 138 experimental studies, progress monitoring interventions promoted goal attainment on average.",
      kind: "Meta-Analysis",
      access: "abstract",
      retrievedAt: "2026-09-06T12:00:00.000Z",
    },
  ],
});
// Existing protocol tests script the final reply; include the research tool turn.
export function reviewed(runner: typeof generate): typeof generate {
  return async (config, instructions, context: any, schema, tokens) => {
    if (context.task === "review-plan") return schema.parse({ issues: [] });
    return runner(config, instructions, context, schema, tokens);
  };
}
export function researched(runner: typeof generate): typeof generate {
  return async (config, instructions, context: any, schema, tokens) => {
    if (context.task === "review-plan") return schema.parse({ issues: [] });
    if (!context.researchSearches.length && !context.pendingProposals.length)
      return schema.parse({
        reply: "I’m checking research on monitoring written work.",
        summary: "Research",
        methods: [],
        changes: [],
        researchQueries: ["progress monitoring goal attainment"],
      });
    return runner(config, instructions, context, schema, tokens);
  };
}
