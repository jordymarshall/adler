import { assessmentDue } from "../shared/adaptive-plan.ts";
import { digest } from "./database.ts";
import { configuration } from "./providers.ts";
import type { Service } from "./service.ts";

export class PlanWorker {
  private timer?: ReturnType<typeof setInterval>;
  private running = false;
  private stopped = false;
  constructor(private service: Service) {}

  ensureJobs(userId: string) {
    const { db } = this.service;
    let configured = true;
    try { configuration(db, userId); } catch { configured = false; }
    const { data } = db.snapshot(userId);
    const pending = this.service.listProposals(userId).filter(p => p.status === "pending" && p.expires > Date.now());
    const keep = new Set<string>();
    for (const goal of data.goals) {
      const need = assessmentDue(data, goal.id);
      if (!configured || !need || pending.some(p => p.goalId === goal.id || p.changes.some(c => c.parentId === goal.id))) continue;
      const id = `plan:${userId}:${goal.id}:${digest(need.key)}`;
      keep.add(id);
      db.enqueue(id, userId, "plan-review", { goalId: goal.id, key: need.key, reason: need.reason });
      db.sql.prepare("UPDATE jobs SET status='pending',due=? WHERE id=? AND status='cancelled'").run(Date.now(), id);
    }
    for (const job of db.sql.prepare("SELECT id FROM jobs WHERE user_id=? AND kind='plan-review' AND status='pending'").all(userId) as { id: string }[]) {
      if (!keep.has(job.id)) db.sql.prepare("UPDATE jobs SET status='cancelled' WHERE id=?").run(job.id);
    }
  }

  status(userId: string) {
    return (this.service.db.sql.prepare("SELECT id,json,status,error FROM jobs WHERE user_id=? AND kind='plan-review' ORDER BY rowid DESC LIMIT 100")
      .all(userId) as { id: string; json: string; status: string; error?: string }[])
      .map(job => ({ id: job.id, goalId: JSON.parse(job.json).goalId as string, status: job.status, error: job.error }));
  }

  async tick() {
    if (this.running || this.stopped) return;
    this.running = true;
    const { db } = this.service;
    try {
      for (const user of db.sql.prepare("SELECT id FROM users").all() as { id: string }[]) {
        await this.service.refreshPlanning(user.id);
        this.ensureJobs(user.id);
      }
      const job = db.sql.prepare("UPDATE jobs SET status='running',attempts=attempts+1,lease=? WHERE id=(SELECT id FROM jobs WHERE kind='plan-review' AND status='pending' AND due<=? ORDER BY due LIMIT 1) RETURNING *")
        .get(Date.now(), Date.now()) as { id: string; user_id: string; json: string; attempts: number } | undefined;
      if (!job) return;
      const payload = JSON.parse(job.json) as { goalId: string; key: string; reason: string };
      try {
        await this.service.chat(job.user_id, payload.reason, payload.goalId, "job", job.id, undefined, undefined, { key: payload.key });
        if (!this.stopped) db.sql.prepare("UPDATE jobs SET status='done',lease=NULL,error=NULL WHERE id=?").run(job.id);
      } catch (error) {
        if (this.stopped) return;
        const stale = (error as { status?: number }).status === 409;
        db.sql.prepare("UPDATE jobs SET status=?,lease=NULL,error=?,due=? WHERE id=?").run(
          stale ? "cancelled" : job.attempts < 3 ? "pending" : "failed",
          error instanceof Error ? error.message : "Assessment could not finish.",
          Date.now() + job.attempts * 60000, job.id,
        );
      }
    } finally { this.running = false; }
  }

  start() {
    if (this.timer) return;
    this.stopped = false;
    const run = () => { void this.tick().catch(error => console.error("Plan assessment worker:", error instanceof Error ? error.message : error)); };
    run();
    this.timer = setInterval(run, 15000);
    this.timer.unref();
  }

  stop() {
    this.stopped = true;
    clearInterval(this.timer);
    this.timer = undefined;
  }
}
