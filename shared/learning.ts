import type { Data, Goal } from "./workspace.ts";
import { z } from "zod";
import { behavioralReasoningSchema } from "./behavioral-reasoning.ts";

const text = z.string().trim().min(1).max(1800);
const id = z.string().min(1).max(150);
export const evidenceRevisionSchema = z
  .object({
    id,
    version: z.string().min(1).max(100),
    kind: z.enum(["report", "context", "action", "outcome", "measurement"]),
    occurredAt: z.string().nullable(),
    reportedAt: z.string().nullable(),
  })
  .strict();
export type EvidenceRevision = z.infer<typeof evidenceRevisionSchema>;
export const evidenceCorrectionSchema = z
  .object({
    id,
    at: z.iso.datetime(),
    source: evidenceRevisionSchema,
    replacements: z.array(evidenceRevisionSchema).min(1).max(10),
    reason: text,
    active: z.boolean(),
  })
  .strict();
export type EvidenceCorrection = z.infer<typeof evidenceCorrectionSchema>;

export const learningTestSchema = z
  .object({
    change: text,
    design: z.enum(["observation", "prospective", "comparison"]),
    prediction: text,
    comparison: text,
    start: z.iso.date().nullable(),
    reviewAfter: z.iso.date().nullable(),
    reviewRule: text,
    mechanismSignal: text.nullable(),
    behaviorSignal: text,
    inputStepIds: z.array(id).max(30).optional(),
    outcomeSignal: text.nullable(),
    alternatives: z.array(text).max(6),
  })
  .strict();
export const learningReviewInputSchema = z
  .object({
    exposure: z.enum(["unknown", "not-used", "used"]),
    mechanism: text.nullable(),
    behavior: text.nullable(),
    outcome: text.nullable(),
    confounds: z.array(text).max(6),
    decision: z.enum(["keep", "adjust", "clarify", "pause", "close"]),
    standing: z.enum(["insufficient", "consistent", "mixed", "inconsistent"]),
    nextReviewAfter: z.iso.date().nullable(),
  })
  .strict();
export const learningRecordSchema = z
  .object({
    id,
    goalIds: z.array(id).min(1).max(10),
    activeVersion: z.number().int().positive().optional(),
    pendingVersion: z.number().int().positive().optional(),
    state: z.enum([
      "suggested",
      "agreed",
      "paused",
      "reviewed",
      "closed",
      "declined",
    ]),
    standing: z.enum([
      "untested",
      "insufficient",
      "consistent",
      "mixed",
      "inconsistent",
      "reconsider",
    ]),
    versions: z
      .array(
        z
          .object({
            version: z.number().int().positive(),
            goalIds: z.array(id).min(1).max(10).optional(),
            decisionId: id,
            at: z.iso.datetime(),
            observation: text,
            hypothesis: text,
            reasoning: behavioralReasoningSchema,
            sources: z.array(evidenceRevisionSchema).max(30),
            test: learningTestSchema,
            transfer: text.nullable(),
            proposalId: id.nullable(),
          })
          .strict(),
      )
      .min(1)
      .max(200),
    reviews: z
      .array(
        learningReviewInputSchema
          .extend({
            id,
            version: z.number().int().positive(),
            goalIds: z.array(id).min(1).max(10).optional(),
            decisionId: id,
            at: z.iso.datetime(),
            sources: z.array(evidenceRevisionSchema).max(30),
            summary: text,
            implication: text.nullable(),
            nextQuestion: text.nullable(),
          })
          .strict(),
      )
      .max(300),
    events: z
      .array(
        z
          .object({
            at: z.iso.datetime(),
            state: z.enum([
              "suggested",
              "agreed",
              "paused",
              "reviewed",
              "closed",
              "declined",
            ]),
            reason: text,
          })
          .strict(),
      )
      .max(500),
    invalidations: z
      .array(
        z
          .object({
            at: z.iso.datetime(),
            sourceId: id,
            replacementSourceIds: z.array(id).max(10).optional(),
            reason: text,
            version: z.number().int().positive(),
          })
          .strict(),
      )
      .max(300),
  })
  .strict();
export type LearningRecord = z.infer<typeof learningRecordSchema>;
export type LearningTest = z.infer<typeof learningTestSchema>;

export function currentLearningVersion(record: LearningRecord) {
  return (
    record.versions.find(
      (version) => version.version === record.activeVersion,
    ) ?? record.versions[0]
  );
}

export function learningStatus(record: LearningRecord, today: string) {
  if (record.state === "suggested") return "Suggested";
  if (record.state === "declined") return "Declined";
  if (record.state === "closed") return "Finished";
  if (record.state === "paused") return "Paused";
  if (record.standing === "reconsider") return "Needs another look";
  const current = currentLearningVersion(record);
  const test = current.test;
  const latestReview = record.reviews
    .filter((r) => r.version === current.version)
    .at(-1);
  const reviewDate = latestReview?.nextReviewAfter ?? test.reviewAfter;
  if (record.state === "reviewed" && !latestReview?.nextReviewAfter)
    return "Reviewed";
  if (reviewDate && reviewDate <= today) return "Ready to review";
  if (test.start && test.start > today) return "Starting soon";
  return "Trying now";
}
export const learningStanding: Record<LearningRecord["standing"], string> = {
  untested: "Waiting to learn",
  insufficient: "More context needed",
  consistent: "Consistent so far",
  mixed: "Mixed observations",
  inconsistent: "Not supported in this context",
  reconsider: "Evidence has changed",
};

export function planNeedsReview(data: Data, goal: Goal) {
  const reasoning = goal.plans.at(-1)?.adaptive?.reasoning;
  return (
    !!reasoning &&
    (data.learning ?? []).some(
      (record) =>
        record.goalIds.includes(goal.id) &&
        record.standing === "reconsider" &&
        JSON.stringify(currentLearningVersion(record).reasoning) ===
          JSON.stringify(reasoning),
    )
  );
}
