import { z } from "zod";

// Historical snapshots remain readable; outcomes are no longer extrapolated.
export const forecastSchema = z.object({
  at: z.iso.datetime(), asOf: z.iso.date(), anchorDate: z.iso.date().optional(), planVersion: z.number().int(),
  status: z.enum(["unavailable", "provisional", "reached", "beyond-horizon"]),
  method: z.enum(["none", "observed-rate", "behavior-rate", "assumed-rate"]),
  reason: z.string().max(3000), inputKey: z.string().max(100000),
  sourceIds: z.array(z.string()).max(10000),
  inputs: z.array(z.object({ label: z.string(), value: z.string() }).strict()).max(20),
  current: z.number().nullable(), probability: z.null(),
  expectedDate: z.iso.date().optional(), earliestDate: z.iso.date().optional(), latestDate: z.iso.date().optional(),
  expectedValue: z.number().optional(), targetDate: z.iso.date().optional(),
  horizonDate: z.iso.date(),
  rates: z.object({ low: z.number(), typical: z.number(), high: z.number() }).strict().optional(),
}).strict();
export type Forecast = z.infer<typeof forecastSchema>;
