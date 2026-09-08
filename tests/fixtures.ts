import { Database } from "../server/database";
import { Service } from "../server/service";
import type { Change } from "../server/commands";
import { expect, type Page } from "@playwright/test";
import { initialData, localDate, type Data } from "../shared/workspace";
import { createGoal } from "../shared/validation";
export async function register(page: Page, seed = false) {
  const username = `user-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const response = await page.request.post("/api/auth/register", {
    data: {
      username,
      password: "a-test-password-123",
      timeZone: "America/Toronto",
    },
  });
  expect(response.ok()).toBeTruthy();
  const result = await response.json();
  if (seed) {
    const data = initialData();
    data.timeZone = "America/Toronto";
    createGoal(
      data,
      {
        title: "Publish two essays",
        kind: "project",
        why: "Explain my work clearly",
        success: "Two published essays with a clear problem and result",
        area: "Career",
        tags: ["Writing"],
        targetDate: localDate(28),
        milestones: [
          {
            title: "First essay published",
            criterion: "A published URL explaining the problem and result",
          },
          {
            title: "Second essay published",
            criterion: "A published URL explaining the problem and result",
          },
        ],
        assessmentTarget: 8,
        baseline: null,
        action: "Draft five main points",
        criterion: "Five main points on the page",
        timing: "Unscheduled",
      },
      localDate(),
      "essays",
    );
    data.actions[0].date = localDate();
    data.actions[0].timing = "After lunch · 25 min";
    data.programs.at(-1)!.workDays = [0, 1, 2, 3, 4, 5, 6];
    await save(page, data, result.revision);
  }
  return { username, password: "a-test-password-123" };
}
export async function snapshot(page: Page) {
  const response = await page.request.get("/api/workspace");
  expect(response.ok()).toBeTruthy();
  return (await response.json()) as { data: Data; revision: number };
}
export async function save(page: Page, data: Data, revision: number) {
  const response = await page.request.post("/api/workspace", {
    data: { data, revision, requestId: crypto.randomUUID() },
  });
  expect(await response.text()).not.toContain('"error"');
  return response;
}
export async function synced(page: Page) {
  await expect(page.getByText("Saving…", { exact: true })).toHaveCount(0);
  await expect(page.locator(".save-error")).toHaveCount(0);
}

// Exercise the real save/command paths while substituting a deterministic model reply.
export async function coachReply(page: Page, changes: import("../server/commands").Change[], reply = "Your update is saved.") {
  await page.route("**/api/status", async route => {
    const response = await route.fetch();
    await route.fulfill({ json: { ...await response.json(), coach: { configured: true, model: "fixture" } } });
  });
  await page.route("**/api/coach", async route => {
    const input = route.request().postDataJSON();
    const conversationId = input.conversationId ?? crypto.randomUUID();
    if (!input.conversationId) {
      const response = await page.request.post("/api/conversations", { data: { entity: "conversation", operation: "create", id: conversationId, parentId: null, values: JSON.stringify({ title: "Shared coaching", goalId: "general" }) } });
      expect(response.ok()).toBeTruthy();
    }
    if (changes.length) {
      const response = await page.request.post("/api/proposals", { data: { summary: reply, changes } });
      expect(response.ok()).toBeTruthy();
      const proposal = await response.json();
      const applied = await page.request.post(`/api/proposals/${proposal.id}/approve`, { data: {} });
      expect(applied.ok()).toBeTruthy();
    }
    const state = await snapshot(page);
    state.data.messages.push({ id: crypto.randomUUID(), conversationId, goalId: "general", role: "user", text: input.message }, { id: crypto.randomUUID(), conversationId, goalId: "general", role: "coach", text: reply });
    await save(page, state.data, state.revision);
    await route.fulfill({ json: { conversationId, data: state.data } });
  });
}

// Trusted, fictional coaching snapshots are test fixtures, never an HTTP bypass.
// User edits in these tests still use save(), and server tests exercise review.
export async function seedCoaching(page: Page, data: Data) {
  const auth = await (await page.request.get("/api/auth")).json();
  const db = new Database(process.env.ADLER_TEST_DATA_DIR!);
  try { const current = db.snapshot(auth.user.id); db.save(auth.user.id, data, current.revision, "web", "Fictional browser fixture"); }
  finally { db.close(); }
}
export async function reviewedProposal(page: Page, changes: Change[], summary: string) {
  const auth = await (await page.request.get("/api/auth")).json();
  const db = new Database(process.env.ADLER_TEST_DATA_DIR!);
  try { return new Service(db).propose(auth.user.id, changes, summary, "web", "general", undefined, true); }
  finally { db.close(); }
}
