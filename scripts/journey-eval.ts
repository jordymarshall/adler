// Live end-to-end check of the landing-page journey through the shared coach.
// Fictional account, temporary database, no production records. Billable: the
// script runs the real provider and prints a bounded call count.
//
// Usage: npx tsx scripts/journey-eval.ts
// Output: .context/agent-system/journey-transcript.json and journey-report.md
import { mkdtempSync, rmSync, writeFileSync, mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Database } from "../server/database.ts";
import { Service, type Proposal } from "../server/service.ts";
import { defaults, generate } from "../server/providers.ts";
import { dateInZone, addDays } from "../shared/journey.ts";
import { todayStep } from "../shared/next-step.ts";
import { todayActivity } from "../shared/today.ts";
import { currentLearningVersion, learningActionVersion, learningStatus, type LearningRecord } from "../shared/learning.ts";
import { RESEARCH_CLAIMS } from "../shared/research-claims.ts";
import type { Data } from "../shared/workspace.ts";
import type { Change } from "../server/commands.ts";

const provider = process.env.ADLER_EVAL_PROVIDER === "anthropic" ? "anthropic" : "gemini";
const model = process.env.ADLER_EVAL_MODEL ?? defaults[provider];
const budget = Number(process.env.ADLER_JOURNEY_BUDGET ?? 40);
const directory = mkdtempSync(join(tmpdir(), "adler-journey-"));
const db = new Database(directory);

interface StepResult {
  step: string;
  title: string;
  passed: boolean;
  durationMs: number;
  providerCalls: number;
  notes: string[];
  issues: string[];
  reply?: string;
  detail?: unknown;
}
const steps: StepResult[] = [];
const providerLog: { step: string; task: string; repair: boolean; durationMs: number }[] = [];
let calls = 0;
let currentStep = "setup";

const service = new Service(db, async (...args) => {
  if (++calls > budget)
    throw new Error(`Provider budget of ${budget} calls exhausted; stopping the evaluation.`);
  const context = args[2] as { task?: string; validationError?: string };
  const task = context.task ?? "coach";
  const repair = Boolean(context.validationError);
  const started = Date.now();
  console.log(`  provider call ${calls} (${currentStep}): ${task}${repair ? " [repair]" : ""}`);
  if (repair) console.log(`    correction: ${context.validationError!.slice(0, 300)}`);
  try {
    return await generate(...args);
  } finally {
    const durationMs = Date.now() - started;
    providerLog.push({ step: currentStep, task, repair, durationMs });
    console.log(`    completed in ${Math.round(durationMs / 1000)}s`);
  }
});

const user = db.createUser("fictional-portfolio-writer", "fictional-journey-password", "UTC");
db.setSecret(user.id, "model-choice", { provider, model, useServer: true });
const snapshot = () => db.snapshot(user.id).data as Data;
const today = () => dateInZone(snapshot().timeZone);

function writeTranscript() {
  mkdirSync(".context/agent-system", { recursive: true });
  writeFileSync(
    ".context/agent-system/journey-transcript.json",
    JSON.stringify({ at: new Date().toISOString(), provider, model, calls, steps, providerLog }, null, 2),
  );
}

// Truthfulness invariants from docs/method/adler-method.md and the product principles.
function invariants(data: Data, reply?: string) {
  const issues: string[] = [];
  if (reply) {
    if (/\b\d{1,3}(\.\d+)?\s*%\s*(chance|probability|likel)/i.test(reply) || /\bprobabilit(y|ies)\b/i.test(reply))
      issues.push("Reply states a probability of success.");
    if (/\b(guarantee|guaranteed|will definitely|proven to work for you)\b/i.test(reply))
      issues.push("Reply claims a guaranteed result.");
  }
  for (const decision of data.decisions) {
    for (const claim of decision.researchClaims ?? []) {
      const known = RESEARCH_CLAIMS.find(c => c.id === claim.id && c.version === claim.version);
      if (!known || known.review.status !== "source-checked")
        issues.push(`Decision ${decision.id} cites an ineligible claim ${claim.id}@${claim.version}.`);
    }
    for (const recommendation of decision.recommendations ?? []) {
      const reasoning = recommendation.reasoning;
      if (!recommendation.observation || !recommendation.interpretation || !recommendation.expectedEffect)
        issues.push(`Recommendation "${recommendation.action.slice(0, 50)}" is missing a displayed rationale field.`);
      if (!reasoning?.principleIds?.length) issues.push(`Recommendation "${recommendation.action.slice(0, 50)}" saved no principle IDs.`);
      if (!reasoning?.grounding?.length) issues.push(`Recommendation "${recommendation.action.slice(0, 50)}" saved no claim grounding.`);
      if (!recommendation.goalIds?.length && data.goals.length)
        issues.push(`Recommendation "${recommendation.action.slice(0, 50)}" has no goalIds; the app cannot attach it to a goal.`);
      for (const binding of reasoning?.grounding ?? []) {
        const known = RESEARCH_CLAIMS.find(c => c.id === binding.claimId && c.version === binding.version);
        if (!known) issues.push(`Recommendation grounding cites unknown claim ${binding.claimId}@${binding.version}.`);
      }
      if (reasoning && !decision.researchSources?.some(source => reasoning.researchSourceIds.includes(source.id)))
        issues.push(`Recommendation "${recommendation.action.slice(0, 50)}" saved no matching research source snapshot.`);
    }
    const review = decision.scientificReview;
    if ((decision.recommendations?.length || decision.insights?.some(i => i.learning)) && !review)
      issues.push(`Decision ${decision.id} has grounded content but no semantic review provenance.`);
    if (review && (!review.at || !review.provider || !review.model || !review.policy || !review.status))
      issues.push(`Decision ${decision.id} has an incomplete scientificReview record.`);
  }
  for (const record of data.learning ?? []) {
    const current = currentLearningVersion(record);
    // Acceptance is not exposure: agreeing to try a change cannot create evidence.
    if (record.state === "agreed" && !record.reviews.length && !["untested", "insufficient", "reconsider"].includes(record.standing))
      issues.push(`Learning ${record.id} is "${record.standing}" with no review; acceptance is not evidence.`);
    for (const entry of record.reviews) {
      if (entry.exposure === "used" && !entry.sources.length)
        issues.push(`Review of ${record.id} claims the change was used without cited reports.`);
      if (entry.standing === "consistent" && entry.exposure !== "used")
        issues.push(`Review of ${record.id} concluded "consistent" without reported use.`);
    }
    if (!current.test.prediction) issues.push(`Learning ${record.id} has no saved prediction.`);
    if (!record.goalIds.length) issues.push(`Learning ${record.id} is not linked to a goal.`);
  }
  return issues;
}

async function step(id: string, title: string, run: () => Promise<{ notes: string[]; reply?: string; detail?: unknown; extraIssues?: string[] }>) {
  currentStep = id;
  const before = calls;
  const started = Date.now();
  console.log(`\n== ${id}: ${title}`);
  try {
    const outcome = await run();
    const issues = [...invariants(snapshot(), outcome.reply), ...(outcome.extraIssues ?? [])];
    steps.push({ step: id, title, passed: issues.length === 0, durationMs: Date.now() - started, providerCalls: calls - before, notes: outcome.notes, issues, reply: outcome.reply, detail: outcome.detail });
    console.log(issues.length ? `  ISSUES: ${issues.join(" | ")}` : "  ok");
    for (const note of outcome.notes) console.log(`  - ${note}`);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    steps.push({ step: id, title, passed: false, durationMs: Date.now() - started, providerCalls: calls - before, notes: [], issues: [`Threw: ${message}`] });
    console.log(`  FAILED: ${message}`);
  }
  writeTranscript();
}

interface ChatResult { conversationId: string; reply: string; proposal: Proposal | null; revision: number; data: Data }

// Deterministic edits use the shared command catalog, exactly as POST /api/app/changes will.
async function command(changes: Change[], summary: string) {
  const proposal = await service.locked(user.id, () => service.propose(user.id, changes, summary, "web"));
  const result = (await service.approve(user.id, proposal.id, "web")) as { revision: number; data: Data; summary: string };
  return { proposal, result };
}

let conversationId: string | undefined;
let goalId: string | undefined;
let learningId: string | undefined;
let agreedPrediction: string | undefined;
let agreedVersion: number | undefined;

async function say(message: string): Promise<ChatResult> {
  const requestId = `journey-${currentStep}-${Date.now()}`;
  const send = () => service.chat(user.id, message, goalId ?? "general", "web", requestId, undefined, conversationId, undefined, goalId) as Promise<ChatResult>;
  let result: ChatResult;
  try {
    result = await send();
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    // A transient provider failure is retried with the SAME requestId, exactly as the app does.
    if (!/\(5\d\d\)|rate limit|invalid response|was incomplete/.test(message)) throw error;
    console.log(`  transient provider failure, retrying with the same requestId: ${message}`);
    result = await send();
  }
  conversationId = result.conversationId;
  return result;
}

const phoneTest = (data: Data) => learningFor(data).find(record => {
  const current = currentLearningVersion(record);
  return /phone|kitchen/i.test(`${current.hypothesis} ${current.test.change} ${current.test.prediction}`);
});

const learningFor = (data: Data) => (data.learning ?? []).filter(record => !goalId || record.goalIds.includes(goalId));
const describeLearning = (records: LearningRecord[], day: string) =>
  records.map(record => ({ id: record.id, state: record.state, standing: record.standing, status: learningStatus(record, day), goalIds: record.goalIds, activeVersion: record.activeVersion, pendingVersion: record.pendingVersion, prediction: currentLearningVersion(record).test.prediction, change: currentLearningVersion(record).test.change, reviewAfter: currentLearningVersion(record).test.reviewAfter, reviews: record.reviews.length }));

try {
  await step("a", "First rough goal becomes a saved goal or a clarifying question", async () => {
    const result = await say(
      `I want to publish 3 portfolio case studies by ${addDays(today(), 95)}; I can write Tuesdays and Thursdays at 8:30 for 25 minutes.`,
    );
    const notes: string[] = [];
    let data = result.data;
    if (result.proposal?.status === "pending") {
      // The app's Approve button on the proposal card.
      const approved = (await service.approve(user.id, result.proposal.id, "web")) as { data: Data };
      data = approved.data;
      notes.push(`The coach proposed the goal rather than applying it; approved proposal ${result.proposal.id}.`);
    }
    let goal = data.goals[0];
    if (!goal) {
      notes.push("The coach asked a clarifying question instead of saving a goal; answering it and continuing.");
      const answered = await say(
        "Yes, please save it. Success is three published case studies on my personal site, each with a public URL. I have no case studies published yet, and 50 minutes a week is my whole budget for this.",
      );
      data = answered.data;
      if (answered.proposal?.status === "pending") {
        const approved = (await service.approve(user.id, answered.proposal.id, "web")) as { data: Data };
        data = approved.data;
        notes.push(`Approved proposal ${answered.proposal.id} from the answering turn.`);
      }
      goal = data.goals[0];
      notes.push(`Second reply: ${answered.reply}`);
    } else notes.push("The coach saved a goal on the first message.");
    if (!goal) return { notes, reply: result.reply, extraIssues: ["No goal was saved after two turns."] };
    goalId = goal.id;
    if (!goal.plans.at(-1)!.adaptive) {
      // A requested goal can be saved before the work is chosen. Continue by supplying the work,
      // which is what the app's Draft card asks for next.
      notes.push("The coach saved the goal before choosing the work; supplying the sessions and asking for a plan.");
      const planned = await say("Please plan the work: 25-minute writing sessions on Tuesdays and Thursdays at 08:30, 50 minutes a week in total.");
      data = planned.data;
      if (planned.proposal?.status === "pending") data = ((await service.approve(user.id, planned.proposal.id, "web")) as { data: Data }).data;
      goal = data.goals.find(item => item.id === goalId) ?? goal;
      notes.push(`Planning reply: ${planned.reply}`);
    }
    const plan = goal.plans.at(-1)!;
    notes.push(`Goal "${goal.title}" saved as ${goal.status} with ${goal.milestones.length} milestones and ${data.actions.filter(a => a.goalId === goal.id).length} actions.`);
    notes.push(`Proposal: ${result.proposal?.status ?? "none"}; plan basis saved: ${Boolean(plan.basis)}; adaptive reasoning saved: ${Boolean(plan.adaptive?.reasoning)}.`);
    const extraIssues: string[] = [];
    if (!["Draft", "Active"].includes(goal.status)) extraIssues.push(`Goal status ${goal.status} is neither Draft nor Active.`);
    if (!plan.basis) extraIssues.push("The saved plan has no research basis.");
    if (!plan.adaptive) extraIssues.push("The saved plan has no adaptive structure.");
    if (!plan.adaptive?.projection && !plan.adaptive?.projectionUnavailableReason) extraIssues.push("The plan makes no projection decision.");
    return { notes, reply: result.reply, extraIssues, detail: { goal: { id: goal.id, title: goal.title, status: goal.status, measure: goal.measure, targetDate: goal.targetDate, milestones: goal.milestones }, basis: plan.basis, adaptive: plan.adaptive, decision: data.decisions.at(-1) } };
  });

  await step("b", "Start plan activates the Draft through the command path", async () => {
    const data = snapshot();
    const goal = data.goals.find(g => g.id === goalId);
    if (!goal) throw new Error("No goal to start.");
    if (goal.status === "Active") return { notes: ["The goal was already Active; no activation needed."] };
    const { result } = await command([{ entity: "goal", operation: "update", id: goal.id, parentId: null, values: JSON.stringify({ status: "Active" }), reason: "You chose to start the plan." }], "Start the portfolio plan");
    const started = result.data.goals.find(g => g.id === goalId)!;
    const actions = result.data.actions.filter(a => a.goalId === goalId);
    return {
      notes: [`Status ${started.status}; ${actions.length} actions materialised; first action "${actions[0]?.title ?? "none"}" on ${actions[0]?.date ?? "unscheduled"}.`],
      extraIssues: started.status === "Active" ? [] : [`startGoal left the goal ${started.status}.`],
      detail: { actions: actions.slice(0, 6).map(a => ({ id: a.id, title: a.title, criterion: a.criterion, timing: a.timing, date: a.date })) },
    };
  });

  await step("c", "Today exposes an action", async () => {
    const data = snapshot();
    const next = todayStep(data);
    const activity = todayActivity(data);
    const fallback = data.actions.find(a => a.goalId === goalId && !a.outcome);
    const action = next.step?.action ?? activity.actions[0] ?? fallback;
    const extraIssues: string[] = [];
    if (!action) extraIssues.push("No action is available for Today or later.");
    if (!next.step?.action && action) extraIssues.push(`todayStep exposes no action (phase ${next.step?.phase ?? "none"}); the next action is dated ${action.date || "unscheduled"}.`);
    return {
      notes: [`todayStep phase ${next.step?.phase ?? "none"}; ${activity.actions.length} actions dated today (${activity.today}); next action "${action?.title ?? "none"}" on ${action?.date || "unscheduled"}.`],
      extraIssues,
      detail: { phase: next.step?.phase, reviewDue: next.review, today: activity.today, todayActions: activity.actions.map(a => a.id), chosen: action && { id: action.id, title: action.title, criterion: action.criterion, timing: action.timing, date: action.date } },
    };
  });

  await step("d", "Reporting an action Done saves history through applyChanges", async () => {
    const data = snapshot();
    const action = todayActivity(data).actions.find(a => !a.outcome) ?? data.actions.find(a => a.goalId === goalId && !a.outcome);
    if (!action) throw new Error("No open action to report.");
    const notes: string[] = [];
    if (action.date > today()) {
      await command([{ entity: "action", operation: "update", id: action.id, parentId: null, values: JSON.stringify({ date: today(), timing: "Started now" }), reason: "You chose to do this session today instead of waiting." }], "Move the first session to today");
      notes.push(`The first session was dated ${action.date}; moved it to ${today()} before reporting, as "I'll do it now" does in the app.`);
    }
    const { result } = await command([{ entity: "action", operation: "update", id: action.id, parentId: null, values: JSON.stringify({ outcome: "Done", actualMinutes: 25, note: "Drafted the opening of the first case study." }), reason: "You reported finishing this session." }], "Record a finished writing session");
    const saved = result.data.actions.find(a => a.id === action.id)!;
    const extraIssues: string[] = [];
    if (saved.outcome !== "Done") extraIssues.push(`Outcome saved as ${saved.outcome ?? "nothing"}.`);
    if (!saved.history?.length) extraIssues.push("No history entry was recorded for the report.");
    const goal = result.data.goals.find(g => g.id === goalId)!;
    if (goal.milestones.some(m => m.done)) extraIssues.push("Recording an action completed a milestone; action completion is not an outcome.");
    notes.push(`Action ${saved.id} outcome ${saved.outcome}, ${saved.actualMinutes} minutes, ${saved.history?.length ?? 0} history entries; milestones done: ${goal.milestones.filter(m => m.done).length}.`);
    return { notes, extraIssues, detail: { action: saved } };
  });

  await step("e", "Reported barrier produces a grounded recommendation and a learning record", async () => {
    const result = await say("I had time to write on Tuesday but spent it scrolling on my phone.");
    const data = result.data;
    const records = learningFor(data);
    const decision = data.decisions.at(-1)!;
    learningId = phoneTest(data)?.id ?? records.at(-1)?.id;
    const notes = [
      `Proposal: ${result.proposal?.status ?? "none"}; decision status ${decision.status}; recommendations ${decision.recommendations?.length ?? 0}; insights ${decision.insights?.length ?? 0}.`,
      `Learning records for this goal: ${JSON.stringify(describeLearning(records, today()))}`,
      `planCheck/feasibility calls this step: ${providerLog.filter(entry => entry.step === "e").map(entry => entry.task).join(", ")}`,
    ];
    const extraIssues: string[] = [];
    const suggested = records.some(r => r.state === "suggested" || r.pendingVersion);
    if (!suggested && !result.proposal) extraIssues.push("No suggested learning record and no proposal followed the reported barrier.");
    if (!decision.recommendations?.length) extraIssues.push("No recommendation with observation/interpretation/expectedEffect was saved.");
    if (!decision.researchSources?.length) extraIssues.push("No research source snapshots were saved with the decision.");
    return { notes, reply: result.reply, extraIssues, detail: { proposal: result.proposal, decision } };
  });

  await step("f", "Answering the coach's question keeps the same thread", async () => {
    const before = snapshot();
    const beforeRecords = learningFor(before);
    const result = await say("No, I don't need the phone; I can leave it in the kitchen.");
    const records = learningFor(result.data);
    learningId = phoneTest(result.data)?.id ?? learningId;
    return {
      notes: [`Proposal: ${result.proposal?.status ?? "none"}; learning records ${beforeRecords.length} -> ${records.length}.`, `Learning: ${JSON.stringify(describeLearning(records, today()))}`],
      reply: result.reply,
      detail: { proposal: result.proposal, decision: result.data.decisions.at(-1) },
    };
  });

  await step("g", "Agreeing to the test sets state agreed and preserves the prediction", async () => {
    let data = snapshot();
    let record = phoneTest(data) ?? learningFor(data).find(r => r.state === "suggested" || r.pendingVersion) ?? learningFor(data).at(-1);
    if (!record) throw new Error("No learning record to agree to.");
    learningId = record.id;
    const target = record.versions.find(v => v.version === (record!.pendingVersion ?? record!.activeVersion)) ?? record.versions.at(-1)!;
    agreedPrediction = target.test.prediction;
    agreedVersion = target.version;
    const notes: string[] = [];
    const pending = service.listProposals(user.id).find((p: Proposal) => p.id === target.proposalId && p.status === "pending");
    if (pending) {
      await service.approve(user.id, pending.id, "web");
      notes.push(`Approved the linked proposal ${pending.id} so the plan and the test are accepted together.`);
    } else if (record.state === "suggested" || record.pendingVersion) {
      await service.learningAction(user.id, record.id, learningActionVersion(record, "agree"), "agree", `journey-agree-${Date.now()}`);
      notes.push("Agreed through the learningAction command (the same call the app's Try this button makes).");
    } else notes.push(`The coach already recorded agreement from the conversation (state ${record.state}); the app must render the actual saved state rather than assume Try this is the only route.`);
    data = snapshot();
    record = data.learning!.find(r => r.id === learningId)!;
    const current = currentLearningVersion(record);
    const extraIssues: string[] = [];
    if (record.state !== "agreed") extraIssues.push(`Learning state is ${record.state}, not agreed.`);
    if (record.standing !== "untested") extraIssues.push(`Standing is ${record.standing}; agreement is not evidence.`);
    if (agreedPrediction && current.test.prediction !== agreedPrediction) extraIssues.push("The saved prediction changed when the test was accepted.");
    notes.push(`State ${record.state}, standing ${record.standing}, status ${learningStatus(record, today())}, active version ${record.activeVersion}, reviewAfter ${current.test.reviewAfter ?? "none"}.`);
    return { notes, extraIssues, detail: { record } };
  });

  await step("h", "Two trial reports attach as evidence without rewriting the prediction", async () => {
    const first = await say("Phone stayed in the kitchen, I didn't check it and wrote 25 minutes.");
    const second = await say("Second session done too: phone in the kitchen, no checking, another 25 minutes of writing.");
    const data = second.data;
    const record = (data.learning ?? []).find(r => r.id === learningId);
    if (!record) return { notes: [`Reply 1: ${first.reply}`], reply: second.reply, extraIssues: ["No learning record exists to attach the trial reports to."] };
    const version = record.versions.find(v => v.version === agreedVersion);
    const extraIssues: string[] = [];
    if (agreedPrediction && version && version.test.prediction !== agreedPrediction)
      extraIssues.push("The original prediction was rewritten while reports were attached.");
    if (record.versions.length > 1 && version && record.versions.filter(v => v.version === agreedVersion).length !== 1)
      extraIssues.push("The original version was duplicated instead of preserved.");
    const revisions = data.decisions.slice(-2).flatMap(d => d.evidenceRevisions ?? []);
    if (!revisions.length) extraIssues.push("The reports saved no evidence revisions for later review.");
    return {
      notes: [
        `Reply 1: ${first.reply}`,
        `Learning after both reports: ${JSON.stringify(describeLearning([record], today()))}`,
        `Evidence revisions attached: ${revisions.length}; reviews recorded: ${record.reviews.length}.`,
      ],
      reply: second.reply,
      extraIssues,
      detail: { record, decisions: data.decisions.slice(-2) },
    };
  });

  await step("i", "A progress question invents no publication and no causal rule", async () => {
    const result = await say("Am I on track with my portfolio?");
    const data = result.data;
    const goal = data.goals.find(g => g.id === goalId);
    const extraIssues: string[] = [];
    if (!goal) return { notes: ["No goal exists, so progress could not be checked."], reply: result.reply, extraIssues: ["No goal to check progress against."] };
    if (goal.milestones.some(m => m.done)) extraIssues.push("A milestone is marked done although nothing was published.");
    if (goal.results.some(r => r.value > 0)) extraIssues.push("A non-zero outcome result exists although nothing was published.");
    if (/\b(you (have )?published|case stud(y|ies) (is|are) (now )?live|first case study is published)\b/i.test(result.reply))
      extraIssues.push("The reply asserts a publication that was never reported.");
    if (/\b(because|proves|shows) (the|your) phone .{0,40}(caused|made|increased)\b/i.test(result.reply))
      extraIssues.push("The reply states a personal causal rule from two reports.");
    return { notes: [`Milestones done: ${goal.milestones.filter(m => m.done).length}; results: ${JSON.stringify(goal.results.map(r => ({ date: r.date, value: r.value })))}.`], reply: result.reply, extraIssues, detail: { decision: data.decisions.at(-1) } };
  });

  await step("j", "A review records exposure, behaviour, decision and standing", async () => {
    const notes: string[] = [];
    let record = (snapshot().learning ?? []).find(r => r.id === learningId);
    if (!record) {
      const result = await say("Let's review the phone-in-kitchen test.");
      return { notes: ["No learning record existed, so the review could not target a saved test."], reply: result.reply, extraIssues: ["No learning record to review."] };
    }
    const due = currentLearningVersion(record).test.reviewAfter;
    if (due && due > today()) {
      // Simulate the review date arriving. Only the saved review timing moves;
      // reports, predictions and versions stay exactly as the coach saved them.
      const state = db.snapshot(user.id);
      const target = state.data.learning!.find(r => r.id === learningId)!;
      currentLearningVersion(target).test.reviewAfter = today();
      db.save(user.id, state.data, state.revision, "system", "Simulated the review date arriving for this evaluation.");
      notes.push(`Advanced the saved review date from ${due} to ${today()} to reach the review.`);
    }
    const result = await say("Let's review the phone-in-kitchen test.");
    record = (result.data.learning ?? []).find(r => r.id === learningId)!;
    if (!record) return { notes, reply: result.reply, extraIssues: ["The learning record disappeared during the review."] };
    const review = record.reviews.at(-1);
    const extraIssues: string[] = [];
    if (!review) extraIssues.push("No review was saved for the test.");
    else {
      if (!review.exposure || !review.decision || !review.standing) extraIssues.push("The review is missing exposure, decision or standing.");
      if (review.version !== agreedVersion) notes.push(`The review targets version ${review.version} (agreed version ${agreedVersion}).`);
    }
    const original = record.versions.find(v => v.version === agreedVersion);
    if (agreedPrediction && original && original.test.prediction !== agreedPrediction)
      extraIssues.push("The review rewrote the original prediction.");
    if (!original) extraIssues.push("The originally agreed version no longer exists.");
    notes.push(`State ${record.state}, standing ${record.standing}, status ${learningStatus(record, today())}, versions ${record.versions.length}, reviews ${record.reviews.length}.`);
    notes.push(`Review: ${JSON.stringify(review ?? null)}`);
    notes.push(`Next plan proposal: ${result.proposal?.status ?? "none"} (${result.proposal?.summary ?? ""}).`);
    return { notes, reply: result.reply, extraIssues, detail: { record, proposal: result.proposal, decision: result.data.decisions.at(-1) } };
  });
} finally {
  writeTranscript();
  const data = snapshot();
  const latency = (task: string) => {
    const values = providerLog.filter(entry => entry.task === task).map(entry => entry.durationMs).sort((a, b) => a - b);
    return values.length ? { count: values.length, medianMs: values[Math.floor(values.length / 2)], maxMs: values.at(-1)! } : null;
  };
  const report = [
    "# Landing journey through the shared coach (live)",
    "",
    `Run ${new Date().toISOString()} with ${provider} \`${model}\`, fictional account, temporary database. ${calls} provider calls.`,
    "",
    "| Step | Result | Wall time | Provider calls | Issues |",
    "| --- | --- | --- | --- | --- |",
    ...steps.map(s => `| ${s.step} ${s.title} | ${s.passed ? "pass" : "FAIL"} | ${(s.durationMs / 1000).toFixed(1)}s | ${s.providerCalls} | ${s.issues.join("; ") || "none"} |`),
    "",
    "## Provider latency by task",
    "",
    "| Task | Calls | Median | Max |",
    "| --- | --- | --- | --- |",
    ...["coach", "review-plan"].map(task => { const value = latency(task); return value ? `| ${task} | ${value.count} | ${(value.medianMs / 1000).toFixed(1)}s | ${(value.maxMs / 1000).toFixed(1)}s |` : `| ${task} | 0 | – | – |`; }),
    "",
    "## Steps",
    ...steps.flatMap(s => [
      "",
      `### ${s.step}. ${s.title} — ${s.passed ? "pass" : "FAIL"}`,
      "",
      `Wall time ${(s.durationMs / 1000).toFixed(1)}s across ${s.providerCalls} provider calls.`,
      ...(s.issues.length ? ["", "Issues:", ...s.issues.map(i => `- ${i}`)] : []),
      ...(s.notes.length ? ["", ...s.notes.map(n => `- ${n}`)] : []),
      ...(s.reply ? ["", "Coach reply (verbatim):", "", "```", s.reply, "```"] : []),
    ]),
    "",
    "## Final workspace",
    "",
    "```json",
    JSON.stringify({ goals: data.goals.map(g => ({ id: g.id, title: g.title, status: g.status, measure: g.measure, milestones: g.milestones.map(m => ({ title: m.title, done: m.done })) })), actions: data.actions.map(a => ({ id: a.id, title: a.title, date: a.date, outcome: a.outcome })), learning: (data.learning ?? []).map(r => ({ id: r.id, state: r.state, standing: r.standing, versions: r.versions.length, reviews: r.reviews.length })) }, null, 2),
    "```",
    "",
  ].join("\n");
  mkdirSync(".context/agent-system", { recursive: true });
  writeFileSync(".context/agent-system/journey-report.md", report);
  db.close();
  rmSync(directory, { recursive: true, force: true });
  console.log(`\n${steps.filter(s => s.passed).length}/${steps.length} steps passed in ${calls} provider calls.`);
  if (steps.some(s => !s.passed)) process.exitCode = 1;
}
