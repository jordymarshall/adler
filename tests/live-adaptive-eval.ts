import { mkdirSync, writeFileSync } from "node:fs";
import { Database } from "../server/database.ts";
import { Service } from "../server/service.ts";
import { generate, defaults } from "../server/providers.ts";
import { dateInZone, addDays } from "../shared/journey.ts";
import { adaptiveFixture, adaptiveWorkspace } from "./adaptive-fixture.ts";
if (process.env.ADLER_LIVE_EVAL !== "true") throw new Error("Set ADLER_LIVE_EVAL=true to run these billable, synthetic model checks.");
const today = dateInZone("UTC");
const cases = [
  { id: "learning-relationship", prompt: `Help me create a small plan toward CAD 100,000 collected business revenue by ${addDays(today, 365)}, a flexible target. My last reported total was CAD 20,000 yesterday. I already chose to follow up on existing client requests: two 20-minute sessions per week after breakfast. I have 40 minutes per week for this goal. Replies often take 7–14 days and revenue can take two months. I want to learn whether a reliable start helps me follow through and whether those follow-ups are helping, without pretending we know a revenue-per-session rate. Create a two-week trial with a useful comparison, an outcome signal, and a review rule.` },
  { id: "competing-goals", prompt: "I have only 90 minutes per week across ALL my goals, including the existing essay plan. I want to start an ongoing reading practice after dinner. I have not started it yet. Fit any proposed reading work within the remaining time; if the goals compete, show a reviewable reprioritization rather than raising my budget." },
  { id: "ambiguous-revenue", prompt: "I want to make 100k revenue. Help me set this up." },
  { id: "one-day", prompt: `Help me create a goal to email my existing one-page proposal PDF to my manager by tonight (${today}), a firm deadline. The file is ready; I just need to check the numbers and send it. I have 20 minutes today. No recurring habit is needed. Please make a usable draft.` },
  { id: "no-baseline", prompt: `Create a goal to collect CAD 100,000 in total business revenue by ${addDays(today, 365)}, a flexible target. I have 120 minutes a week. I have not reconciled my current revenue, have no proven offer yet, and no conversion data. I want a small discovery experiment first; keep the starting revenue unknown.` },
  { id: "acquisition", prompt: `Create a goal to collect CAD 100,000 total by ${addDays(today, 365)}, a preferred target. I've collected CAD 20,000. I sell a proven CAD 2,000 design service, have delivery capacity for two more clients this month, but not enough qualified conversations. I can spend 90 minutes weekly on acquisition. No reliable conversion rate yet. Choose a short useful plan and review window.` },
  { id: "one-week", prompt: `Create a goal to publish my finished essay by ${addDays(today, 7)}, a flexible date. Only proofreading and uploading to my site remain. I have 60 minutes total over the next seven days. Keep it proportionate and choose when to review.` },
  { id: "ongoing", prompt: "Create an ongoing practice of reading for enjoyment after dinner, with no finish date. I've not established a baseline. I can commit 45 minutes a week, split as useful, and want to notice whether it is enjoyable enough to continue. Choose a sensible experiment and check-in rhythm." },
  { id: "strong-execution-poor-response", prompt: `Create a replacement approach for my outreach goal: collect CAD 100,000 total by ${addDays(today, 180)} (preferred). Current revenue CAD 20,000. I sent 40 relevant outreach messages in each of the last three weeks, exactly as planned, and got zero replies. Messages are over two weeks old. I have 90 minutes a week and a proven design offer. I want to learn whether the targeting or pitch is wrong before sending more.` },
  { id: "reported-timing-conflict", prompt: `Create a plan for publishing my draft essay by ${addDays(today, 21)}, flexible. My last two lunch editing sessions didn't happen because scheduled meetings displaced them; that's what I experienced. The draft exists. I have 60 minutes per week and 20-minute windows after breakfast on Monday, Wednesday, and Friday. Choose a useful adjustment; do not increase the workload.` },
  { id: "missing-reports-delayed-feedback", prompt: `Create a plan for collecting CAD 100,000 by ${addDays(today, 365)}, preferred. I last reported CAD 20,000 ten days ago. I haven't logged the last three outreach sessions, so their outcomes are unknown. Replies normally take two weeks. I have 90 minutes a week. Help establish the next informative action without assuming that I failed or that my offer is bad.` },
  { id: "firm-deadline-capacity", prompt: `Create a goal to publish a polished 10,000-word report by ${addDays(today, 2)}, a firm deadline. I have not started; I have only 30 minutes available total before the deadline. The report needs original research and editing. Help me make an honest executable plan and identify the tradeoff. Do not assume extra time or fabricate odds.` },
];
mkdirSync(".context/live-adaptive", { recursive: true });
const db = new Database(".context/live-adaptive");
const selected = process.argv.slice(2);
try {
  for (const scenario of cases.filter(c => !selected.length || selected.includes(c.id))) {
    const user = db.createUser(`eval-${scenario.id}-${Date.now()}`, "isolated-evaluation-password", "UTC");
    db.setSecret(user.id, "model-choice", { provider: "gemini", model: defaults.gemini, useServer: true });
    if (scenario.id === "competing-goals") {
      const data = adaptiveWorkspace(adaptiveFixture(today, addDays(today, 4)));
      data.programs.at(-1)!.weeklyMinutes = 90;
      db.save(user.id, data, db.snapshot(user.id).revision, "web", "Existing 75-minute essay commitment");
    }
    const turns: unknown[] = [];
    const service = new Service(db, async (config, instructions, context: any, schema, tokens) => {
      const result = await generate(config, instructions, context, schema, tokens);
      turns.push({ task: context.task ?? "coach", validationError: context.validationError, result });
      return result;
    });
    const started = Date.now();
    try {
      const result = await service.chat(user.id, scenario.prompt, "general", "web", `eval-${scenario.id}`);
      writeFileSync(`.context/live-adaptive/${scenario.id}.json`, JSON.stringify({ scenario, turns, result }, null, 2));
      console.log(JSON.stringify({ id: scenario.id, seconds: Math.round((Date.now()-started)/1000), turns: turns.length, goals: result.data.goals.length, proposal: result.proposal?.status, reply: result.reply }));
    } catch (error) {
      writeFileSync(`.context/live-adaptive/${scenario.id}.json`, JSON.stringify({ scenario, turns, error: error instanceof Error ? error.message : "Evaluation failed" }, null, 2));
      console.log(JSON.stringify({ id: scenario.id, error: error instanceof Error ? error.message : "Evaluation failed", turns: turns.length }));
    }
  }
} finally { db.close(); }
