import { z } from "zod";

const explanation = z.string().trim().min(1).max(1800);
export const researchSourceSchema = z
  .object({
    id: z.string().min(1).max(150),
    title: z.string().max(1000),
    authors: z.string().max(1500),
    year: z.string().max(10),
    doi: z.string().max(300).optional(),
    url: z.url().refine((url) => url.startsWith("https://")),
    summary: z.string().max(9000),
    kind: z.string().max(500),
    access: z.enum(["abstract", "method summary", "full text excerpt"]),
    retrievedAt: z.iso.datetime(),
  })
  .strict();
export type ResearchSource = z.infer<typeof researchSourceSchema>;

export const researchSearchSchema = z
  .object({
    queries: z.array(z.string().max(300)).max(3),
    sources: z.array(researchSourceSchema).max(18),
    unavailable: z.array(z.string().max(400)).max(6),
    searchedAt: z.iso.datetime(),
  })
  .strict();
export type ResearchSearch = z.infer<typeof researchSearchSchema>;

export const planningBasisSchema = z
  .object({
    interpretation: explanation,
    decisionNote: z.string().trim().min(1).max(320).optional(),
    strategy: explanation,
    outcomeRationale: explanation,
    alternatives: z
      .array(
        z
          .object({
            option: z.string().trim().min(1).max(300),
            tradeoff: explanation,
          })
          .strict(),
      )
      .min(1)
      .max(4),
    actionMeasure: z
      .object({
        label: z.string().trim().min(1).max(150),
        unit: z.string().trim().min(1).max(50),
        period: z.enum(["action", "day", "week"]),
        target: z.number().positive().max(1000000).nullable(),
        rationale: explanation,
      })
      .strict()
      .nullable(),
    evidence: z
      .array(
        z
          .object({
            sourceId: z.string().min(1).max(150),
            finding: explanation,
            application: explanation,
            limitation: explanation,
          })
          .strict(),
      )
      .max(8),
    assumptions: z.array(explanation).max(6),
    uncertainty: explanation,
    review: z
      .object({
        date: z.iso.date(),
        question: explanation,
        adaptation: explanation,
      })
      .strict(),
    sources: z.array(researchSourceSchema).max(8).optional(),
  })
  .strict();
export type PlanningBasis = z.infer<typeof planningBasisSchema>;
