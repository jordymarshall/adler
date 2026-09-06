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
