import { z } from "zod";

const explanation = z.string().trim().min(1).max(1800);
export const behavioralReasoningSchema = z.object({
  principleIds: z.array(z.string().regex(/^P[0-9]+$/)).min(1).max(4),
  goalRoute: z.enum(["habit-shaped", "structural", "session", "campaign", "dyadic", "uncertain"]),
  ruleExceptions: z.array(explanation).max(4),
  barrier: z.object({
    domain: z.enum(["capability", "opportunity", "motivation", "uncertain"]),
    status: z.enum(["reported", "tentative", "unknown"]),
    explanation,
    sourceIds: z.array(z.string().min(1).max(150)).max(10),
  }).strict(),
  methodId: z.string().min(1).max(80),
  researchSourceIds: z.array(z.string().min(1).max(150)).min(1).max(8),
  mechanism: explanation,
  fit: explanation,
  prediction: explanation,
  reviewRule: explanation,
  limitation: explanation,
}).strict();
export type BehavioralReasoning = z.infer<typeof behavioralReasoningSchema>;
