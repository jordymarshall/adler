import { createHash, randomUUID } from "node:crypto";
import type { Data } from "../shared/workspace.ts";
import type { CoachInsight } from "../src/program-types.ts";
import type { Change } from "./commands.ts";
import {
  currentLearningVersion,
  learningRecordSchema,
  type EvidenceRevision,
  type LearningRecord,
  type LearningTest,
} from "../shared/learning.ts";
import { dateInZone } from "../shared/journey.ts";
import type { AdaptivePlan } from "../shared/adaptive-plan.ts";
import type { Recommendation } from "../shared/behavioral-reasoning.ts";
import { RESEARCH_CLAIMS } from "../shared/research-claims.ts";

export function evidenceRevision(
  data: Data,
  id: string,
): EvidenceRevision | undefined {
  let value: unknown,
    kind: EvidenceRevision["kind"] = "report";
  let occurredAt: string | null = null,
    reportedAt: string | null = null;
  const message = data.messages.find(
    (m) =>
      m.id === id &&
      m.role === "user" &&
      m.channel !== "job" &&
      (!m.origin || m.origin === "user"),
  );
  const memory = data.memories.find((m) => m.id === id);
  const action = data.actions.find(
    (a) =>
      a.id === id &&
      (a.outcome ||
        a.note ||
        a.amount !== undefined ||
        a.actualMinutes !== undefined),
  );
  if (message) {
    value = {
      text: message.text,
      at: message.at,
      origin: message.origin ?? "user",
    };
    reportedAt = message.at ?? null;
  } else if (memory) {
    value = { text: memory.text };
    kind = "context";
    reportedAt = memory.date;
  } else if (action) {
    value = {
      goalId: action.goalId,
      date: action.date,
      outcome: action.outcome,
      amount: action.amount,
      actualMinutes: action.actualMinutes,
      note: action.note,
    };
    kind = "action";
    occurredAt = action.date || null;
    reportedAt = action.history.at(-1)?.at ?? null;
  } else {
    for (const goal of data.goals) {
      const result = goal.results.find((r) => r.id === id);
      if (result) {
        value = result;
        kind = "outcome";
        occurredAt = result.date;
        break;
      }
      if (`measurement:${goal.id}` === id) {
        value = {
          outcome: goal.measure,
          input: goal.plans
            .at(-1)
            ?.adaptive?.steps.map((s) => ({ id: s.id, measure: s.measure })),
        };
        kind = "measurement";
        break;
      }
    }
  }
  if (value === undefined) return;
  return {
    id,
    kind,
    occurredAt,
    reportedAt,
    version: createHash("sha256").update(JSON.stringify(value)).digest("hex"),
  };
}

export function reconcileLearning(
  data: Data,
  at = new Date().toISOString(),
  previous?: Data,
) {
  for (const correction of data.evidenceCorrections ?? [])
    correction.active =
      evidenceRevision(data, correction.source.id)?.version ===
      correction.source.version;
  for (const record of data.learning ?? []) {
    if (
      record.state === "suggested" &&
      record.goalIds.some(
        (id) =>
          previous?.goals.find((g) => g.id === id)?.status === "Draft" &&
          data.goals.find((g) => g.id === id)?.status === "Active",
      )
    ) {
      record.state = "agreed";
      record.activeVersion = currentLearningVersion(record).version;
      delete record.pendingVersion;
      record.events.push({
        at,
        state: "agreed",
        reason:
          "You started the proposed plan. No attempt has been reported yet.",
      });
    }
    const current = currentLearningVersion(record);
    if (
      record.invalidations.some(
        (invalidation) => invalidation.version === current.version,
      )
    )
      record.standing = "reconsider";
    for (const binding of current.reasoning.grounding ?? []) {
      const claim = RESEARCH_CLAIMS.find(
        (c) => c.id === binding.claimId && c.version === binding.version,
      );
      if (claim?.review.status === "source-checked") continue;
      record.standing = "reconsider";
      if (
        !record.invalidations.some(
          (i) =>
            i.sourceId === binding.claimId && i.version === current.version,
        )
      )
        record.invalidations.push({
          at,
          sourceId: binding.claimId,
          version: current.version,
          reason:
            "The research claim changed or is no longer eligible. Review this application.",
        });
    }
    const references = [
      ...current.sources,
      ...record.reviews
        .filter((r) => r.version === current.version)
        .flatMap((r) => r.sources),
    ];
    for (const source of references) {
      const now = evidenceRevision(data, source.id);
      if (
        source.kind === "measurement" &&
        record.state === "suggested" &&
        record.pendingVersion
      )
        continue;
      if (now?.version === source.version) continue;
      if (
        !record.invalidations.some(
          (i) => i.sourceId === source.id && i.version === current.version,
        )
      )
        record.invalidations.push({
          at,
          sourceId: source.id,
          version: current.version,
          reason: now
            ? "The source was corrected or its measurement changed."
            : "The source is no longer available.",
        });
      record.standing = "reconsider";
    }
    for (const goalId of record.goalIds) {
      const before = previous?.goals.find((g) => g.id === goalId)?.plans.at(-1);
      const after = data.goals.find((g) => g.id === goalId)?.plans.at(-1);
      if (!before || !after || record.state === "suggested") continue;
      if (
        before.action === after.action &&
        before.criterion === after.criterion &&
        before.timing === after.timing &&
        JSON.stringify(before.adaptive?.steps) ===
          JSON.stringify(after.adaptive?.steps)
      )
        continue;
      record.standing = "reconsider";
      if (
        !record.invalidations.some(
          (i) =>
            i.sourceId === `plan:${goalId}` && i.version === current.version,
        )
      )
        record.invalidations.push({
          at,
          sourceId: `plan:${goalId}`,
          version: current.version,
          reason:
            "The work or support being tried changed. Review which earlier observations still apply.",
        });
    }
  }
}

export function setLearningAgreement(
  data: Data,
  proposalId: string,
  accepted: boolean,
  at = new Date().toISOString(),
) {
  for (const record of data.learning ?? []) {
    const proposed =
      record.versions.find(
        (version) => version.version === record.pendingVersion,
      ) ?? (record.state === "suggested" ? record.versions.at(-1) : undefined);
    if (proposed?.proposalId !== proposalId) continue;
    if (accepted) {
      record.activeVersion = proposed.version;
      record.goalIds = proposed.goalIds ?? record.goalIds;
      record.state = record.goalIds.some(
        (id) => data.goals.find((goal) => goal.id === id)?.status === "Draft",
      )
        ? "suggested"
        : "agreed";
      record.standing = "untested";
    } else if (!record.activeVersion) record.state = "declined";
    delete record.pendingVersion;
    record.events.push({
      at,
      state: record.state,
      reason: accepted
        ? "You agreed to try this change. No attempt has been reported yet."
        : "You declined this suggestion. Its effectiveness has not been tested.",
    });
  }
}

function testFromPlan(plan: AdaptivePlan): LearningTest {
  const reasoning = plan.reasoning!;
  return {
    change: plan.approach,
    design: plan.experiment ? "prospective" : "observation",
    prediction: reasoning.prediction,
    comparison:
      plan.experiment?.comparison ?? "No comparison has been established.",
    start: plan.window.start,
    reviewAfter: plan.assessment.at?.slice(0, 10) ?? null,
    reviewRule: reasoning.reviewRule,
    mechanismSignal: null,
    behaviorSignal: plan.steps
      .map((s) => s.criterion)
      .join("; ")
      .slice(0, 1800),
    inputStepIds: plan.experiment?.inputStepIds ?? plan.steps.map((s) => s.id),
    outcomeSignal: plan.experiment?.outcomeSignal ?? null,
    alternatives: plan.experiment?.alternativeExplanations ?? [
      reasoning.limitation,
    ],
  };
}

export function saveLearning(
  data: Data,
  decisionId: string,
  insights: CoachInsight[],
  changes: Change[],
  proposalId: string | null,
  applied: boolean,
  at = new Date().toISOString(),
  recommendations: Recommendation[] = [],
  plannedData: Data = data,
) {
  data.learning ??= [];
  const candidates: CoachInsight[] = [...insights];
  for (const [index, change] of changes.entries()) {
    if (change.entity !== "goal" && change.entity !== "plan") continue;
    const plan = JSON.parse(change.values).adaptive as AdaptivePlan | undefined;
    if (
      !plan?.reasoning ||
      candidates.some((i) => i.learning && i.changeIndexes.includes(index))
    )
      continue;
    const goalId = change.entity === "goal" ? change.id : change.parentId;
    if (!goalId) continue;
    candidates.push({
      finding: plan.reasoning.barrier.explanation,
      status: "To test",
      sourceIds: plan.reasoning.barrier.sourceIds,
      changeIndexes: [index],
      learning: {
        goalIds: [goalId],
        reasoning: plan.reasoning,
        hypothesis: plan.experiment?.hypothesis ?? plan.reasoning.fit,
        experiment: plan.approach,
        test: testFromPlan(plan),
        result: null,
        insight: null,
        nextHypothesis: null,
        previousInsightId: null,
        researchSourceIds: plan.reasoning.researchSourceIds,
      },
    });
  }
  for (const recommendation of recommendations) {
    if (
      !recommendation.goalIds.length ||
      candidates.some(
        (i) =>
          i.learning &&
          (JSON.stringify(i.learning.reasoning) ===
            JSON.stringify(recommendation.reasoning) ||
            i.changeIndexes.some((index) =>
              recommendation.changeIndexes.includes(index),
            )),
      )
    )
      continue;
    candidates.push({
      finding: recommendation.observation,
      status: "To test",
      sourceIds: recommendation.sourceIds,
      changeIndexes: recommendation.changeIndexes,
      learning: {
        goalIds: recommendation.goalIds,
        reasoning: recommendation.reasoning,
        hypothesis: recommendation.interpretation,
        experiment: recommendation.action,
        result: null,
        insight: null,
        nextHypothesis: null,
        previousInsightId: null,
        researchSourceIds: recommendation.reasoning.researchSourceIds,
      },
    });
  }
  for (const insight of candidates) {
    const loop = insight.learning;
    if (!loop?.reasoning) continue;
    const previous = loop.recordId
      ? data.learning.find((r) => r.id === loop.recordId)
      : undefined;
    if (loop.recordId && !previous)
      throw new Error(
        "Review an existing learning record; do not invent its ID.",
      );
    const changedGoals = insight.changeIndexes.flatMap((index) => {
      const c = changes[index];
      const goalId = c?.entity === "goal" ? c.id : c?.parentId;
      return goalId ? [goalId] : [];
    });
    const citedGoals = insight.sourceIds.flatMap((id) => {
      const goalId =
        data.actions.find((a) => a.id === id)?.goalId ??
        data.messages.find((m) => m.id === id)?.goalId ??
        data.goals.find((g) => g.results.some((r) => r.id === id))?.id;
      return goalId && goalId !== "general" ? [goalId] : [];
    });
    const goalIds = [
      ...new Set(
        loop.goalIds ?? previous?.goalIds ?? [...changedGoals, ...citedGoals],
      ),
    ];
    if (!goalIds.length)
      throw new Error(
        "Link a learning hypothesis to its relevant goalIds; general observations need no hypothesis.",
      );
    if (
      goalIds.some(
        (id) =>
          !data.goals.some((g) => g.id === id) &&
          !changes.some(
            (c) =>
              c.entity === "goal" && c.id === id && c.operation === "create",
          ),
      )
    )
      throw new Error(
        "Learning must refer to actual goals in this workspace or the proposed bundle.",
      );
    if (
      previous &&
      goalIds.some((id) => !previous.goalIds.includes(id)) &&
      !loop.transfer
    )
      throw new Error(
        "Cross-goal learning needs a scoped transfer rationale, not a global personal rule.",
      );
    const sourceIds = [
      ...new Set([...insight.sourceIds, ...loop.reasoning.barrier.sourceIds]),
    ];
    const sources = sourceIds.flatMap((id) => {
      const source = evidenceRevision(data, id);
      return source ? [source] : [];
    });
    const test = loop.test ?? {
      change: loop.experiment,
      design: "prospective" as const,
      prediction: loop.reasoning.prediction,
      comparison: "No comparable starting observations have been established.",
      start: null,
      reviewAfter: null,
      reviewRule: loop.reasoning.reviewRule,
      mechanismSignal: null,
      behaviorSignal: loop.reasoning.prediction,
      outcomeSignal: null,
      alternatives: [loop.reasoning.limitation],
    };
    if (test.start && test.reviewAfter && test.reviewAfter < test.start)
      throw new Error("Review timing cannot precede the planned test window.");
    if (loop.result && previous) {
      if (!loop.review)
        throw new Error(
          "A learning review needs exposure, separate mechanism/behaviour/outcome, confounds, a practical decision and evidence standing.",
        );
      const reviewSources = loop.result.sourceIds.map((id) =>
        evidenceRevision(data, id),
      );
      if (
        reviewSources.some((source) => !source || source.kind === "measurement")
      )
        throw new Error("Review actual reported feedback, not scheduled work.");
      if (previous.state === "suggested" || previous.state === "declined")
        throw new Error(
          "An unagreed or declined test cannot be reviewed as an intervention result.",
        );
      if (
        loop.review.exposure !== "used" &&
        ["consistent", "inconsistent"].includes(loop.review.standing)
      )
        throw new Error(
          "Without use of the change, review feasibility; the mechanism remains untested.",
        );
      const original = currentLearningVersion(previous);
      if (
        reviewSources.some((source) =>
          original.sources.some(
            (before) =>
              before.id === source!.id && before.version === source!.version,
          ),
        )
      )
        throw new Error(
          "The observations that created the hypothesis cannot also count as new prospective test results.",
        );
      const alreadyReviewed = previous.reviews
        .filter((review) => review.version === original.version)
        .flatMap((review) => review.sources);
      if (
        reviewSources.every((source) =>
          alreadyReviewed.some(
            (before) =>
              before.id === source!.id && before.version === source!.version,
          ),
        )
      )
        throw new Error(
          "This feedback has already been reviewed. Use a new or corrected report rather than counting the same evidence again.",
        );
      if (
        original.test.start &&
        reviewSources.some(
          (source) =>
            source?.occurredAt &&
            source.occurredAt.slice(0, 10) < original.test.start!,
        )
      )
        throw new Error(
          "Feedback from before this test started is starting evidence, not a prospective result.",
        );
      previous.reviews.push({
        ...loop.review,
        id: randomUUID(),
        version: original.version,
        decisionId,
        at,
        sources: reviewSources as EvidenceRevision[],
        summary: loop.result.summary,
        implication: loop.insight,
        nextQuestion: loop.nextHypothesis,
      });
      previous.standing = loop.review.standing;
      previous.state =
        loop.review.decision === "pause"
          ? "paused"
          : loop.review.decision === "close"
            ? "closed"
            : "reviewed";
      previous.events.push({
        at,
        state: previous.state,
        reason: loop.result.summary,
      });
      // A new question is retained in the review; it never rewrites the prediction that was tested.
      continue;
    }
    if (loop.result)
      throw new Error(
        "Save retrospective observations as observations. A prospective result must reference the earlier learning recordId.",
      );
    if (previous && !loop.test)
      throw new Error(
        "Revising a hypothesis needs an explicit new test. Keep the earlier prediction intact.",
      );
    if (test.start && test.start < dateInZone(data.timeZone, new Date(at)))
      throw new Error(
        "A new prospective test cannot be backdated; preserve earlier reports as its starting evidence.",
      );
    if (previous?.pendingVersion)
      throw new Error(
        "A revision is already pending for this hypothesis. Review or decline that suggestion before proposing another version.",
      );
    const version = (previous?.versions.at(-1)?.version ?? 0) + 1;
    const record: LearningRecord = previous ?? {
      id: randomUUID(),
      goalIds,
      state: "suggested",
      standing: "untested",
      versions: [],
      reviews: [],
      events: [],
      invalidations: [],
    };
    if (!previous || applied) record.goalIds = goalIds;
    record.versions.push({
      version,
      goalIds,
      decisionId,
      at,
      observation: insight.finding,
      hypothesis: loop.hypothesis,
      reasoning: loop.reasoning,
      sources: [
        ...sources,
        ...goalIds.flatMap((id) => {
          const source = evidenceRevision(plannedData, `measurement:${id}`);
          return source ? [source] : [];
        }),
      ],
      test,
      transfer: loop.transfer ?? null,
      proposalId,
    });
    if (applied) {
      record.activeVersion = version;
      record.state = goalIds.some(
        (id) => data.goals.find((g) => g.id === id)?.status === "Draft",
      )
        ? "suggested"
        : "agreed";
      record.standing = "untested";
    } else record.pendingVersion = version;
    record.events.push({
      at,
      state: record.state,
      reason:
        record.state === "agreed"
          ? "The requested change is saved. Its effect has not been observed."
          : "A change to consider; it has not been tried yet.",
    });
    learningRecordSchema.parse(record);
    if (!previous) data.learning.push(record);
  }
}

export function correctLearningEvidence(
  data: Data,
  corrections: {
    sourceId: string;
    replacementSourceIds: string[];
    reason: string;
  }[],
  baseline: Data = data,
  at = new Date().toISOString(),
) {
  data.evidenceCorrections ??= [];
  for (const correction of corrections) {
    const source = evidenceRevision(baseline, correction.sourceId);
    const replacements = correction.replacementSourceIds.flatMap((id) => {
      const item = evidenceRevision(data, id);
      return item ? [item] : [];
    });
    if (
      !source ||
      replacements.length !== correction.replacementSourceIds.length
    )
      throw new Error(
        "Preserve the actual earlier source and correcting user reports.",
      );
    if (
      !data.evidenceCorrections.some(
        (item) =>
          item.source.id === source.id &&
          item.source.version === source.version &&
          JSON.stringify(item.replacements) === JSON.stringify(replacements),
      )
    )
      data.evidenceCorrections.push({
        id: randomUUID(),
        source,
        replacements,
        at,
        reason: correction.reason,
        active: true,
      });
    for (const record of data.learning ?? []) {
      const current = currentLearningVersion(record);
      if (
        ![
          ...current.sources,
          ...record.reviews
            .filter((review) => review.version === current.version)
            .flatMap((review) => review.sources),
        ].some((source) => source.id === correction.sourceId)
      )
        continue;
      if (
        !record.invalidations.some(
          (item) =>
            item.sourceId === correction.sourceId &&
            item.version === current.version,
        )
      )
        record.invalidations.push({
          at,
          sourceId: correction.sourceId,
          version: current.version,
          replacementSourceIds: correction.replacementSourceIds,
          reason: correction.reason,
        });
      record.standing = "reconsider";
    }
  }
}
