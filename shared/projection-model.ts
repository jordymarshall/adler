import { z } from "zod";

export const projectionModelSchema = z.object({
  kind: z.enum(["direct", "learned"]),
  driverStepId: z.string().min(1).max(80),
  inputMetric: z.enum(["amount", "hours"]),
  outcomeUnit: z.string().min(1).max(50),
  observationStart: z.iso.date(),
  horizonDays: z.number().int().min(7).max(3660),
  feedbackDelayDays: z.number().int().min(0).max(366),
  inputPerOutcome: z.object({
    low: z.number().positive(), expected: z.number().positive(), high: z.number().positive(),
  }).strict().optional(),
  rationale: z.string().trim().min(1).max(1800),
}).strict();
export type ProjectionModel = z.infer<typeof projectionModelSchema>;
