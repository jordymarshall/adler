// Live, fictional scenarios. No production accounts or records are used.
import { mkdtempSync, rmSync, writeFileSync, mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Database } from "../server/database.ts";
import { Service } from "../server/service.ts";
import { defaults, generate } from "../server/providers.ts";
import { dateInZone, addDays } from "../shared/journey.ts";

const directory = mkdtempSync(join(tmpdir(), "adler-live-evaluation-"));
const db = new Database(directory);
const provider =
  process.env.ADLER_EVAL_PROVIDER === "anthropic" ? "anthropic" : "gemini";
const model = process.env.ADLER_EVAL_MODEL ?? defaults[provider];
const key =
  process.env[provider === "gemini" ? "GEMINI_API_KEY" : "ANTHROPIC_API_KEY"];
if (!key)
  throw new Error(
    `Configure the ${provider} API key locally to run this evaluation.`,
  );
const results: object[] = [];
let calls = 0;
const service = new Service(db, async (...args) => {
  const started = Date.now();
  const context = args[2] as { task?: string; validationError?: string };
  const stage = context.task ?? "coach";
  if (context.validationError)
    console.log(
      `Correction requested: ${context.validationError.slice(0, 1600)}`,
    );
  console.log(
    `Provider call ${++calls}: ${stage}${context.validationError ? " (repair)" : ""}`,
  );
  const result = await generate(...args);
  console.log(
    `Completed ${stage} in ${Math.round((Date.now() - started) / 1000)}s`,
  );
  return result;
});
function account(username: string) {
  const user = db.createUser(username, "fictional-evaluation-password", "UTC");
  db.setSecret(user.id, "model-choice", { provider, model, useServer: false });
  db.setSecret(user.id, `model-${provider}`, { key });
  return user;
}
async function turn(
  userId: string,
  name: string,
  message: string,
  goalId = "general",
) {
  const started = Date.now();
  try {
    const result = await service.chat(userId, message, goalId, "web", name);
    results.push({
      name,
      passed: true,
      durationMs: Date.now() - started,
      reply: result.reply,
      goals: result.data.goals.map((goal) => ({
        title: goal.title,
        status: goal.status,
      })),
      learning: result.data.learning.map((record) => ({
        id: record.id,
        state: record.state,
        standing: record.standing,
      })),
      claims: result.data.decisions
        .at(-1)
        ?.researchClaims?.map((claim) => `${claim.id}@${claim.version}`),
      recommendations: result.data.decisions.at(-1)?.recommendations,
      review: result.data.decisions.at(-1)?.scientificReview,
      proposal: result.proposal?.status ?? null,
    });
    return result;
  } catch (error) {
    results.push({
      name,
      passed: false,
      durationMs: Date.now() - started,
      error: (error as Error).message,
    });
    console.log(
      `${name} did not complete: ${(error as Error).message.slice(0, 500)}`,
    );
    return null;
  } finally {
    mkdirSync(".context", { recursive: true });
    writeFileSync(
      ".context/live-coaching-evaluation.json",
      JSON.stringify(
        { at: new Date().toISOString(), provider, model, calls, results },
        null,
        2,
      ),
    );
  }
}
try {
  const reader = account("fictional-reader");
  const first = await turn(
    reader.id,
    "reading-first-plan",
    `Help me create a goal to read 30 books. I have finished zero so far. I want to try reading 20 pages after lunch each day, starting ${dateInZone("UTC")}, for enjoyment. Lunch at home usually leaves me 20 quiet minutes and I want to use that time. I can spare 140 minutes a week. Books vary, so 300 pages per book (range 200–400) is only a starting assumption. I have no fixed deadline. Let's review how starting after lunch feels on ${addDays(dateInZone("UTC"), 7)}. Please save a first plan for me to review.`,
  );
  if (first?.proposal?.status === "pending")
    await service.approve(reader.id, first.proposal.id, "web");
  const goal = db.snapshot(reader.id).data.goals[0];
  if (goal)
    await turn(
      reader.id,
      "reading-context-correction",
      "Correction: lunch is quiet only on weekends. I have meetings on weekdays. Keep the goal, but let's reconsider the lunch cue before I start. Don't assume I have tried it yet.",
      goal.id,
    );
  if (process.env.ADLER_EVAL_ONLY !== "reading") {
    const builder = account("fictional-builder");
    await turn(
      builder.id,
      "revenue-without-domain-strategy",
      "I want to make $100,000 in revenue from my business. Help me get started. I haven't decided which work to prioritize and I don't know my available time yet.",
    );
    await turn(
      builder.id,
      "advice-without-plan-commands",
      "Please don't change a plan yet. I keep missing work sessions because client calls take their place. What should I consider?",
    );
  }
} finally {
  db.close();
  rmSync(directory, { recursive: true, force: true });
}
if (results.some((result) => !(result as { passed: boolean }).passed))
  process.exitCode = 1;
