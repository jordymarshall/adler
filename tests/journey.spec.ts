import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { register, save, snapshot, synced, coachReply } from "./fixtures";
import { seedCoaching, reviewedProposal } from "./fixtures";
import { addDays, dateInZone, reviewBlock } from "../shared/journey";
import { createGoal } from "../shared/validation";
import { basis, literature } from "./planning-fixture";

test("one first goal starts locally and hands off checking in to shared Coach", async ({
  page,
}) => {
  await register(page);
  await page.goto("/app/today");
  await expect(
    page.getByRole("heading", { name: "What would you like to achieve?" }),
  ).toBeVisible();
  await page
    .getByText("Prefer to set it up yourself?", { exact: true })
    .click();
  await page.getByRole("link", { name: "Set up a goal manually" }).click();
  await page
    .getByLabel("What would you like to work toward?")
    .fill("Publish my illustration");
  await page
    .getByLabel("What would a good result look like?")
    .fill("One illustration published on my website");
  await page
    .getByLabel("Your next milestone")
    .fill("First illustration published");
  await page
    .getByLabel("One useful next action")
    .fill("Sketch three thumbnails");
  await page
    .getByLabel("This action is finished when")
    .fill("Three thumbnails are on paper");
  await page.getByRole("button", { name: "Review my plan" }).click();
  await page.getByRole("button", { name: "Save plan", exact: true }).click();
  await expect(
    page.locator(".selected-action .button.primary:visible"),
  ).toHaveCount(1);
  await expect(
    page.getByRole("navigation", { name: "Goal views" }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("heading", { name: "Milestones", exact: true }),
  ).not.toBeVisible();
  await page.getByRole("button", { name: "Start plan", exact: true }).click();
  await expect(page.getByRole("button", { name: "Done", exact: true })).toBeVisible();
  await page.getByRole("link", { name: /Discuss with Coach/ }).click();
  await expect(page).toHaveURL(/\/app\/check-in/);
  await expect(page.getByLabel("Message Adler")).toContainText("Sketch three thumbnails");
  const { data } = await snapshot(page);
  expect(data.actions).toHaveLength(1);
  expect(data.actions[0].startedAt).toBeUndefined();
  expect(data.actions[0].outcome).toBeUndefined();
  expect(data.goals[0].results.at(-1)?.value).toBe(0);
});

test("scheduling stays with the action and ends at a clear stopping point", async ({
  page,
}) => {
  await register(page, true);
  const state = await snapshot(page);
  state.data.actions[0].date = "";
  state.data.goals[0].plans[0].durationMinutes = 35;
  await save(page, state.data, state.revision);
  await page.goto("/app/goals/essays");
  await page.getByRole("button", { name: "Add to calendar", exact: true }).click();
  await expect(page.locator(".inline-scheduler")).toBeVisible();
  await expect(
    page.getByRole("combobox", { name: "Book in" }),
  ).not.toBeVisible();
  await page.getByText("Choose another time", { exact: true }).click();
  const date = addDays(dateInZone("America/Toronto"), 1);
  await page
    .locator(".custom-calendar-time")
    .getByLabel("Date", { exact: true })
    .fill(date);
  await page.getByLabel("Start time", { exact: true }).fill("10:00");
  await page.getByRole("button", { name: "Use this time" }).click();
  await page.getByRole("button", { name: "Save time", exact: true }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page.getByRole("region", { name: "Selected action" })).toContainText("Scheduled");
  await synced(page);
  const { data } = await snapshot(page);
  expect(data.actions).toHaveLength(1);
  expect(data.workBlocks).toHaveLength(1);
  expect(data.actions[0].id).toBe(data.workBlocks[0].id);
  expect(data.actions[0].date).toBe(date);
  expect(
    Date.parse(data.workBlocks[0].end) - Date.parse(data.workBlocks[0].start),
  ).toBe(35 * 60000);
  expect(data.actions[0].outcome).toBeUndefined();
  await page.goto("/app/calendar");
  await expect(page.getByRole("region", { name: "Your calendar" })).toBeVisible();
  await expect(
    page.getByRole("combobox", { name: "Goal to schedule" }),
  ).not.toBeVisible();
});

test("evidence is disclosed on request and action observations stay separate from outcomes", async ({
  page,
}) => {
  await register(page, true);
  const state = await snapshot(page);
  state.data.goals[0].plans[0].basis = {
    ...basis,
    sources: (await literature(["progress monitoring"])).sources,
  };
  await seedCoaching(page, state.data);
  await page.goto("/app/goals/essays");
  await expect(page.locator(".plan-explanation")).not.toBeVisible();
  await page.getByRole("button", { name: /Inspect reasoning/ }).click();
  await page.getByRole("dialog")
    .getByText("Alternatives Adler considered", { exact: true })
    .click();
  await expect(
    page.getByRole("dialog").getByText("Minutes spent writing", { exact: true }),
  ).toBeVisible();
  await page.getByRole("dialog")
    .getByText("Research & applicability · 1 sources", { exact: false })
    .click();
  await expect(page.getByRole("dialog").locator(".research-source")).toContainText(
    "does not establish an optimal metric",
  );
  await expect(page.getByRole("dialog").locator(".research-source a")).toHaveAttribute(
    "href",
    "https://europepmc.org/article/MED/26479070",
  );
  await page.keyboard.press("Escape");
  await coachReply(page, [{ entity: "action", operation: "update", id: state.data.actions[0].id, parentId: null, values: JSON.stringify({ outcome: "Done", amount: 4 }) }]);
  await page.getByRole("link", { name: /Discuss with Coach/ }).click();
  await page.getByLabel("Message Adler").fill("Done today, four outline points.");
  await page.getByRole("button", { name: "Send message" }).click();
  await expect(page.locator(".coach-thread")).toContainText("Your update is saved.");
  await expect(page.getByLabel("Message Adler")).toHaveValue("");
  const { data } = await snapshot(page);
  expect(data.actions[0].amount).toBe(4);
  expect(data.goals[0].results.at(-1)?.value).toBe(0);
});

test("conversations open on request, inherit the goal and can move to General", async ({
  page,
}) => {
  await register(page, true);
  await page.goto("/app/check-in?goal=essays");
  await expect(
    page.getByRole("button", { name: "New chat", exact: true }),
  ).not.toBeVisible();
  await page.locator(".chat-library-disclosure > summary").click();
  await page.getByRole("button", { name: "New chat", exact: true }).click();
  await page
    .getByRole("button", { name: "Edit chat: New conversation" })
    .click();
  await page
    .getByRole("combobox", { name: "Goal folder", exact: true })
    .selectOption("general");
  await page.getByRole("button", { name: "Save chat", exact: true }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  expect((await snapshot(page)).data.conversations[0].goalId).toBe("general");
});

test("opening a review in Coach preserves history and does not record an outcome", async ({ page }) => {
  await register(page, true);
  const state = await snapshot(page);
  state.data.reviews.push({ step: 3, note: "Old note", decision: "Keep", completedAt: "2026-01-04T20:00:00Z", periodStart: "2025-12-29", periodEnd: "2026-01-04" });
  await save(page, state.data, state.revision);
  await page.goto("/app/reviews/current");
  await expect(page.getByLabel("Message Adler")).toContainText("review");
  expect((await snapshot(page)).data.reviews).toHaveLength(1);
  expect((await snapshot(page)).data.reviews[0].note).toBe("Old note");
});

test("Today follows the account date and current scheduled work takes priority over old check-ins", async ({
  page,
}) => {
  await register(page, true);
  await page.clock.setFixedTime(new Date("2026-09-06T23:00:00Z"));
  const state = await snapshot(page);
  state.data.timeZone = "Asia/Tokyo";
  state.data.goals[0].results.forEach(result => { result.date = "2026-09-07"; });
  state.data.actions[0].date = "2026-09-07";
  state.data.actions.push({
    ...state.data.actions[0],
    id: "old",
    date: "2026-09-01",
    title: "An older action",
  });
  await save(page, state.data, state.revision);
  await page.goto("/app/today");
  await expect(page.locator(".next-step-card")).toContainText(
    "Draft five main points",
  );
  await page.getByRole("button", { name: "Start action", exact: true }).click();
  await expect(page.locator('[data-phase="working"]')).toBeVisible();
  expect((await snapshot(page)).data.actions[0].date).toBe("2026-09-07");
});

test("calendar reservations recur and controls cannot switch during availability checks", async ({
  page,
}) => {
  await register(page, true);
  const state = await snapshot(page);
  state.data.goals[0].startDate = "2026-01-01";
  await save(page, state.data, state.revision);
  await page.route("**/api/status", async (route) => {
    const response = await route.fetch();
    const status = await response.json();
    await route.fulfill({
      json: { ...status, google: { ...status.google, connected: true } },
    });
  });
  await page.route("**/api/calendars", (route) =>
    route.fulfill({
      json: {
        google: [{ id: "primary", name: "Test calendar", writable: true }],
        apple: [],
      },
    }),
  );
  let release!: () => void;
  const pending = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route("**/api/availability", async (route) => {
    await pending;
    await route.fulfill({
      json: { busy: [], checkedAt: new Date().toISOString() },
    });
  });
  await page.goto("/app/calendar");
  await page.getByRole("button", { name: "Week", exact: true }).click();
  await page.getByRole("button", { name: "Next week", exact: true }).click();
  await expect(page.locator(".calendar-entry.entry-review")).toHaveCount(1);
  await page.getByRole("button", { name: "Add time", exact: true }).click();
  await page.getByText("Choose another time", { exact: true }).click();
  const review = reviewBlock(
    state.data,
    addDays(dateInZone(state.data.timeZone), 1),
  )!;
  await page
    .locator(".custom-calendar-time")
    .getByLabel("Date", { exact: true })
    .fill(dateInZone(state.data.timeZone, new Date(review.start)));
  await page
    .getByLabel("Start time", { exact: true })
    .fill(state.data.automation.reviewTime);
  await page
    .getByRole("button", { name: "Use this time", exact: true })
    .click();
  await expect(page.getByRole("alert")).toContainText(
    "conflicts with a commitment",
  );
  await page.getByText("Connected calendars", { exact: true }).click();
  await page
    .getByRole("combobox", { name: "Book in", exact: true })
    .selectOption("google");
  await page
    .getByRole("button", { name: "Check availability", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Next week", exact: true }),
  ).toBeDisabled();
  await expect(
    page.getByRole("combobox", { name: "Book in", exact: true }),
  ).toBeDisabled();
  release();
  await expect(
    page.getByRole("button", { name: "Refresh availability", exact: false }),
  ).toBeEnabled();
});

test("the simplified journey works on a phone with accessible disclosure controls", async ({
  page,
}) => {
  await register(page, true);
  await page.setViewportSize({ width: 390, height: 844 });
  for (const route of [
    "/app/today",
    "/app/goals/essays",
    "/app/calendar",
    "/app/onboarding",
  ]) {
    await page.goto(route);
    await expect(page.locator("h1")).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth + 1,
      ),
    ).toBeTruthy();
    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  }
});

test("the landing uses Adler Warm throughout its connected goal journey", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator(".journey-introduction h1")).toHaveText("Reach your goals with a system that understands you.");
  const typography = await page.locator(".journey-introduction h1, .phone-story h2, .mountain-finale h2").evaluateAll(elements =>
    elements.map(el => ({ family: getComputedStyle(el).fontFamily, weight: getComputedStyle(el).fontWeight })),
  );
  expect(typography.every(font => font.family.includes("Adler Warm") && font.weight === "550")).toBeTruthy();
  await expect(page.locator(".hero-intro-v2 > p").first()).toHaveCSS("font-weight", "500");
  await expect(page.locator(".story-phone")).toHaveCount(1);
  await expect(page.locator(".phone-story-dots button")).toHaveCount(6);
  await expect(page.locator(".journey-connections")).toContainText("Apple Health");
  await expect(page.locator(".journey-connections .connections-upcoming")).toContainText("Shared goals & stakes");
  await expect(page.locator(".journey-connections .connections-upcoming")).toContainText("Coming soon");
  await page.setViewportSize({ width: 390, height: 844 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBeTruthy();
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
});

test("landing keeps one concise phone preview centered at desktop and phone sizes", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  const scenes = [
    ["Set a goal.", "Read 30 books"],
    ["Get a plan.", "Read 20 pages"],
    ["Report what happened.", "Office days are full of meetings"],
    ["Your plan adapts.", "Next test · Review Oct 22"],
    ["Make time for it.", "12:30–12:50 · Planned"],
    ["See your progress.", "First book finished"],
  ];
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 844 });
    await page.goto("/");
    const controls = page.locator(".phone-story-dots button");
    const phone = page.locator(".story-phone");
    let firstBounds: { y: number; height: number } | undefined;
    for (const [index, [heading, content]] of scenes.entries()) {
      await controls.nth(index).click();
      await expect(controls.nth(index)).toHaveAttribute("aria-current", "step");
      await expect(page.locator(".phone-story-copy h2")).toHaveText(heading);
      const preview = page.locator('.story-phone-frame[aria-hidden="false"]');
      await expect(preview).toHaveCount(1);
      await expect(preview).toContainText(content);
      expect((await preview.innerText()).split(/\s+/).length).toBeLessThan(45);
      expect((await page.locator(".phone-story-copy").innerText()).split(/\s+/).length).toBeLessThan(18);
      const bounds = (await phone.boundingBox())!;
      firstBounds ??= bounds;
      expect(Math.abs(bounds.x + bounds.width / 2 - width / 2)).toBeLessThan(1);
      expect(Math.abs(bounds.y - firstBounds.y)).toBeLessThan(1);
      expect(Math.abs(bounds.height - firstBounds.height)).toBeLessThan(1);
      expect(bounds.width).toBeGreaterThan(220);
      expect(bounds.y).toBeGreaterThan(100);
      expect(bounds.y + bounds.height).toBeLessThan(780);
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
  }
});

test("scroll blends the phone contents without moving the phone, and reduced motion removes the blend", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/");
  await page.getByRole("button", { name: "Show your goal", exact: true }).click();
  const phone = page.locator(".story-phone");
  const before = (await phone.boundingBox())!;
  await page.locator(".phone-journey").evaluate(el => window.scrollTo({ top: scrollY + el.getBoundingClientRect().top + innerHeight * .85, behavior: "instant" }));
  const first = page.locator('[data-preview="goals"]');
  const next = page.locator('[data-preview="plan"]');
  await expect.poll(async () => Number(await next.evaluate(el => getComputedStyle(el).opacity))).toBeGreaterThan(.2);
  expect(Number(await first.evaluate(el => getComputedStyle(el).opacity))).toBeGreaterThan(.2);
  expect(Number(await next.evaluate(el => getComputedStyle(el).opacity))).toBeLessThan(.8);
  expect((await phone.boundingBox())!.x).toBe(before.x);
  expect((await phone.boundingBox())!.y).toBe(before.y);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(first).toHaveCSS("opacity", "1");
  await expect(next).toHaveCSS("opacity", "0");
  await expect(first).toHaveCSS("transform", "none");
  await expect(page.locator(".phone-story")).toHaveCSS("transition-duration", "0s");
});

test("scrolling advances one pinned phone scene and its background at a time, in both directions", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/");
  await page.getByRole("link", { name: "A look inside Adler" }).click();
  const story = page.locator(".phone-story");
  const colors = new Set<string>();
  for (const screen of ["goals", "plan", "checkin", "insights", "calendar", "progress"]) {
    await expect(story).toHaveAttribute("data-screen", screen);
    await expect(page.locator('.story-phone-frame[aria-hidden="false"]')).toHaveCount(1);
    await expect.poll(async () => Math.abs((await story.boundingBox())!.y)).toBeLessThan(2);
    expect((await story.boundingBox())!.height).toBe(1000);
    colors.add(await story.evaluate(el => getComputedStyle(el).getPropertyValue("--story-bg")));
    if (screen !== "progress") await page.mouse.wheel(0, 1001);
  }
  expect(colors.size).toBe(6);
  await page.mouse.wheel(0, -1001);
  await expect(story).toHaveAttribute("data-screen", "calendar");
  await page.getByRole("button", { name: "Show your progress", exact: true }).click();
  await page.getByRole("button", { name: "Continue past the story" }).click();
  await expect(page.locator(".journey-connections")).toBeInViewport();
});

test("landing phone screenshots enlarge with the keyboard and restore focus", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 1050 });
    await page.goto("/");
    await page.getByRole("button", { name: "Show your progress", exact: true }).click();
    const opener = page.getByRole("button", { name: "Open full Goal progress screen" });
    await opener.focus();
    await page.keyboard.press("Enter");
    const dialog = page.getByRole("dialog", { name: "Goal progress" });
    await expect(dialog).toBeVisible();
    await expect.poll(() => dialog.locator("img").evaluate((el: HTMLImageElement) => el.complete && el.naturalWidth > 0)).toBe(true);
    await expect(dialog.locator("img")).toHaveAttribute("src", /hero-progress-mobile.webp/);
    expect((await dialog.boundingBox())!.width).toBeGreaterThan(340);
    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
    await page.keyboard.press("Escape");
    await expect(dialog).toHaveCount(0);
    await expect(opener).toBeFocused();
  }
});

test("progress assumptions and saved learning stay available without motion", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 1050 });
    await page.goto("/");
    await page.getByRole("button", { name: "Show your progress", exact: true }).click();
    await expect(page.locator(".phone-story")).toHaveCSS("transition-duration", "0s");
    await page.getByRole("button", { name: "Open full Goal progress screen" }).click();
    const dialog = page.getByRole("dialog");
    await dialog.getByRole("button", { name: "Inputs & assumptions" }).click();
    await expect(dialog.locator("img")).toHaveAttribute("src", /progress-mobile-detail.webp/);
    await dialog.getByRole("button", { name: "Goal projection", exact: true }).click();
    await expect(dialog.locator("img")).toHaveAttribute("src", /hero-progress-mobile.webp/);
    await page.keyboard.press("Escape");
    await page.getByRole("button", { name: "Show your learning", exact: true }).click();
    await expect(page.locator('.story-phone-frame[aria-hidden="false"]')).toContainText("Next test · Review Oct 22");
    await page.getByRole("button", { name: "Open full Insights screen" }).click();
    await dialog.getByRole("button", { name: "Why this test?" }).click();
    await expect(dialog.locator("img")).toHaveAttribute("src", /insights-mobile-reasoning.webp/);
    await expect.poll(() => dialog.locator("img").evaluate((el: HTMLImageElement) => el.complete && el.naturalWidth > 0)).toBe(true);
    await page.keyboard.press("Escape");
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
  }
});

test("onboarding submits once, clarifies in place, then opens the researched draft", async ({
  page,
}) => {
  await register(page);
  await page.route("**/api/status", async (route) => {
    const response = await route.fetch();
    const status = await response.json();
    await route.fulfill({
      json: { ...status, coach: { configured: true, model: "fixture" } },
    });
  });
  const requests: string[] = [];
  await page.route("**/api/coach", async (route) => {
    const input = route.request().postDataJSON();
    requests.push(input.message);
    const state = await snapshot(page);
    input.conversationId ??= crypto.randomUUID();
    if (!state.data.conversations.some(c => c.id === input.conversationId)) state.data.conversations.push({ id: input.conversationId, title: "Shared coaching", goalId: "general", createdAt: new Date().toISOString() });
    const now = new Date().toISOString();
    state.data.messages.push({
      id: crypto.randomUUID(),
      role: "user",
      text: input.message,
      at: now,
      conversationId: input.conversationId,
      goalId: "general",
    });
    if (requests.length === 1) {
      state.data.messages.push({
        id: crypto.randomUUID(),
        role: "coach",
        text: "What would you like to publish?",
        at: now,
        conversationId: input.conversationId,
        goalId: "general",
      });
    } else {
      createGoal(
        state.data,
        {
          title: "Publish my essay",
          kind: "project",
          why: "Share an idea",
          success: "One published essay",
          area: "Unassigned",
          tags: [],
          targetDate: "2027-12-31",
          milestones: [{ title: "Published", criterion: "A public URL" }],
          assessmentTarget: 8,
          baseline: null,
          action: "Draft five points",
          criterion: "Five points are on paper",
          timing: "Unscheduled",
          durationMinutes: 25,
          status: "Draft",
          basis,
        },
        dateInZone(state.data.timeZone),
        "essay",
      );
    }
    await seedCoaching(page, state.data);
    await route.fulfill({
      json: { conversationId: input.conversationId, data: state.data },
    });
  });
  await page.goto("/app/onboarding");
  await page
    .getByLabel("What do you want to achieve?")
    .fill("I want to publish something.");
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page.getByRole("button", { name: "Send message", exact: true }).click();
  await expect(page.locator(".coach-thread")).toContainText(
    "What would you like to publish?",
  );
  expect(requests).toHaveLength(1);
  await expect(page).toHaveURL(/\/app\/check-in/);
  await expect(page.getByLabel("Message Adler")).toHaveValue("");
  await page
    .getByLabel("Message Adler")
    .fill("An essay about my project, on my website.");
  await page.getByRole("button", { name: "Send message" }).click();
  await expect.poll(async () => (await snapshot(page)).data.goals.length).toBe(1);
  await page.goto("/app/goals/essay");
  await expect(
    page.getByRole("button", { name: "Start plan", exact: true }),
  ).toBeVisible();
  expect(requests).toHaveLength(2);
  expect((await snapshot(page)).data.conversations.at(-1)?.goalId).toBe(
    "general",
  );
  await page.goto("/app/check-in");
  await expect(page.locator(".coach-thread:visible")).toContainText(
    "What would you like to publish?",
  );
  expect((await snapshot(page)).data.actions).toHaveLength(1);
});

for (const finish of ["retry", "dismiss"] as const)
  test(`an inline partial booking returns to its action after ${finish}`, async ({
    page,
  }) => {
    await register(page, true);
    const state = await snapshot(page);
    state.data.actions[0].date = addDays(dateInZone(state.data.timeZone), 1);
    await seedCoaching(page, state.data);
    await page.route("**/api/status", async (route) => {
      const response = await route.fetch();
      const status = await response.json();
      await route.fulfill({
        json: { ...status, google: { ...status.google, connected: true } },
      });
    });
    await page.route("**/api/calendars", (route) =>
      route.fulfill({
        json: {
          google: [{ id: "primary", name: "Test calendar", writable: true }],
          apple: [],
        },
      }),
    );
    await page.route("**/api/availability", (route) =>
      route.fulfill({
        json: { busy: [], checkedAt: new Date().toISOString() },
      }),
    );
    let attempts = 0;
    let releaseBooking!: () => void;
    const bookingResponse = new Promise<void>(resolve => { releaseBooking = resolve; });
    let bookingId = "";
    await page.route("**/api/bookings", async (route) => {
      const input = route.request().postDataJSON();
      const current = await snapshot(page);
      if (!attempts++) {
        await bookingResponse;
        bookingId = input.id;
        current.data.workBlocks.push({
          id: input.id,
          goalId: "essays",
          action: input.title,
          start: input.start,
          end: input.end,
          provider: "google",
          status: "Scheduled",
          eventId: "work-event",
        });
        current.data.actions[0].date = dateInZone(
          current.data.timeZone,
          new Date(input.start),
        );
      } else {
        expect(input.id).toBe(bookingId);
        current.data.workBlocks[0].checkInId = "check-in-event";
      }
      await seedCoaching(page, current.data);
      await route.fulfill({
        json: {
          id: input.id,
          workDone: true,
          checkInDone: attempts > 1,
          workId: "work-event",
          checkInId: "check-in-event",
          ...(attempts === 1
            ? { error: "Check-in event could not be confirmed." }
            : {}),
        },
      });
    });
    await page.goto("/app/goals/essays");
    await page.getByRole("button", { name: "Add to calendar", exact: true }).click();
    await page.getByText("Calendar options", { exact: true }).click();
    await page
      .getByRole("combobox", { name: "Book in", exact: true })
      .selectOption("google");
    await page
      .getByRole("button", { name: "Check availability", exact: true })
      .click();
    await page
      .getByRole("button", { name: "Confirm booking", exact: true })
      .click();
    const retry = page.getByRole("button", { name: "Retry confirmation", exact: true });
    await expect(retry).toBeDisabled();
    releaseBooking();
    await expect(retry).toBeEnabled();
    await expect(page.locator('[data-phase="waiting"]')).toHaveCount(0);
    const partial = await snapshot(page);
    await page.clock.setFixedTime(
      new Date(Date.parse(partial.data.workBlocks[0].end) + 60000),
    );
    await page.reload();
    await expect(
      page.getByRole("button", { name: "Retry confirmation", exact: true }),
    ).toBeVisible();
    if (finish === "retry") {
      await page
        .getByRole("button", { name: "Retry confirmation", exact: true })
        .click();
    } else {
      await page.getByText("Booking details", { exact: true }).click();
      await page
        .getByRole("button", {
          name: "I checked my calendar · close this booking",
          exact: true,
        })
        .click();
    }
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Done", exact: true })).toBeVisible();
    const saved = (await snapshot(page)).data;
    expect(saved.workBlocks).toHaveLength(1);
    expect(saved.actions).toHaveLength(1);
    expect(saved.workBlocks[0].checkInId).toBe(
      finish === "retry" ? "check-in-event" : undefined,
    );
  });

test("calendar day selection books that day and a block opens its own action", async ({
  page,
}) => {
  await register(page, true);
  await page.goto("/app/calendar");
  await page
    .getByRole("button", {
      name: "Manage calendars",
      exact: false,
    })
    .click();
  await expect(
    page.getByRole("combobox", { name: "Book in", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Week", exact: true }).click();
  await page.getByRole("button", { name: "Next week", exact: true }).click();
  const today = dateInZone("America/Toronto");
  const day = addDays(
    today,
    9 - ((new Date(`${today}T12:00:00Z`).getUTCDay() + 6) % 7),
  );
  await page
    .getByRole("button", { name: `Schedule on ${day}`, exact: true })
    .click();
  await page.getByRole("button", { name: "Save time", exact: true }).click();
  await synced(page);
  const saved = await snapshot(page);
  expect(
    dateInZone(saved.data.timeZone, new Date(saved.data.workBlocks[0].start)),
  ).toBe(day);
  const original = saved.data.actions[0];
  saved.data.actions.push({
    ...original,
    id: "other-action",
    title: "Other work due today",
    date: dateInZone(saved.data.timeZone),
  });
  await save(page, saved.data, saved.revision);
  await page.locator(".calendar-entry.entry-work button").click();
  await page.getByRole("dialog").getByRole("link", { name: /↗/ }).click();
  await expect(page).toHaveURL(new RegExp(`action=${original.id}`));
  await expect(page.getByRole("region", { name: "Selected action" })).toContainText(
    original.title,
  );
});

test("a change discussed in shared Coach updates the next step", async ({
  page,
}) => {
  await register(page, true);
  await page.route("**/api/status", async (route) => {
    const response = await route.fetch();
    const status = await response.json();
    await route.fulfill({
      json: { ...status, coach: { configured: true, model: "fixture" } },
    });
  });
  await page.route("**/api/coach", async (route) => {
    const current = await snapshot(page);
    current.data.actions[0].title = "Draft three main points";
    await save(page, current.data, current.revision);
    await route.fulfill({
      json: {
        data: current.data,
        conversationId: "direct-action",
        proposal: {
          status: "applied",
          changes: [
            {
              entity: "action",
              operation: "update",
              id: current.data.actions[0].id,
            },
          ],
        },
      },
    });
  });
  await page.goto("/app/goals/essays");
  await page.getByRole("link", { name: /Discuss with Coach/ }).click();
  await page
    .locator(".focused-coach")
    .getByLabel("Message Adler")
    .fill("Make this three points instead of five.");
  await page.getByRole("button", { name: "Send message", exact: true }).click();
  await expect.poll(async () => (await snapshot(page)).data.actions[0].title).toBe("Draft three main points");
  await page.goto("/app/goals/essays");
  await expect(page.getByRole("region", { name: "Selected action" })).toContainText(
    "Draft three main points",
  );
  await expect(
    page.getByRole("button", { name: "Done", exact: true }),
  ).toBeVisible();
});

test("latest action observations use the last check-in when records share a date", async ({
  page,
}) => {
  await register(page, true);
  const current = await snapshot(page);
  current.data.goals[0].plans[0].basis = basis;
  const action = current.data.actions[0];
  action.outcome = "Done";
  action.amount = 2;
  action.history = [{ outcome: "Done", amount: 2, at: "2026-09-01T12:00:00Z" }];
  current.data.actions.push({
    ...action,
    id: "latest",
    amount: 4,
    history: [{ outcome: "Done", amount: 4, at: "2026-09-01T15:00:00Z" }],
  });
  await seedCoaching(page, current.data);
  await page.goto("/app/goals/essays/progress");
  await expect(page.locator(".action-observations")).toContainText(
    "4 points recorded",
  );
});

test("the phone story supports direct selection and keyboard navigation", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 960 });
  await page.goto("/");
  const dots = page.locator(".phone-story-dots button");
  for (let i = 0; i < 6; i++) {
    await dots.nth(i).click();
    await expect(dots.nth(i)).toHaveAttribute("aria-current", "step");
    await expect(page.locator(".phone-story h2")).toBeInViewport();
  }
  await page.locator(".phone-story").focus();
  await page.keyboard.press("Home");
  await expect(dots.nth(0)).toHaveAttribute("aria-current", "step");
  await page.keyboard.press("ArrowRight");
  await expect(dots.nth(1)).toHaveAttribute("aria-current", "step");
  await page.keyboard.press("ArrowLeft");
  await expect(dots.nth(0)).toHaveAttribute("aria-current", "step");
  await page.keyboard.press("End");
  await expect(dots.nth(5)).toHaveAttribute("aria-current", "step");
});

test("the opening leads into the phone story and lets the reader skip ahead", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 960 });
  await page.goto("/");
  await page.getByRole("link", { name: "A look inside Adler" }).click();
  await expect(page.locator(".phone-story h2")).toBeInViewport();
  await expect(page.locator(".phone-story-copy")).toContainText("Read 30 books");
  await expect(page.locator(".journey-index, .journey-step, .hero-mobile-screens")).toHaveCount(0);
  await page.getByRole("link", { name: "Skip the story" }).click();
  await expect(page.locator("#approach h2")).toBeInViewport();
});

test("the phone story and coming-soon store buttons lead into the immersive graph", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/");
  const hero = page.getByRole("region", { name: "A system that understands you" });
  await expect(page.locator(".story-phone")).toHaveCount(1);
  await hero.getByRole("button", { name: "Download on the App Store" }).click();
  await expect(hero.getByRole("status")).toContainText("App Store version is coming soon");
  await hero.getByRole("button", { name: "Get it on Google Play" }).click();
  await expect(hero.getByRole("status")).toContainText("Google Play version is coming soon");
  await expect(hero.getByRole("link", { name: "Get started on web" })).toHaveAttribute("href", "/app/goals/new");
  await page.getByRole("button", { name: "Show your check-in", exact: true }).click();
  const opener = page.getByRole("button", { name: "Open full Check-in screen" });
  await opener.focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("dialog", { name: "Check-in" })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(opener).toBeFocused();
  const graph = page.getByRole("region", { name: "From scattered goals to a plan that learns" });
  const move = async (progress: number) => graph.evaluate((el, p) => window.scrollTo({ top: scrollY + el.getBoundingClientRect().top + (el.clientHeight - innerHeight) * p, behavior: "instant" }), progress);
  await move(.52);
  await expect(graph.locator(".learning-preview")).toHaveAttribute("data-stage", "2");
  const viewport = (await graph.locator(".learning-chart-viewport").boundingBox())!;
  const camera = graph.locator(".learning-chart-world");
  expect((await camera.boundingBox())!.width / viewport.width).toBeGreaterThan(3);
  const before = (await camera.boundingBox())!.x;
  await move(.7);
  await expect(graph.locator(".learning-preview")).toHaveAttribute("data-stage", "4");
  expect((await camera.boundingBox())!.x).toBeLessThan(before);
  await move(1);
  await expect(graph.locator(".learning-preview")).toHaveAttribute("data-stage", "5");
  expect(Math.abs((await camera.boundingBox())!.width - viewport.width)).toBeLessThan(2);
  await expect(graph.locator(".learning-example-note")).toContainText("illustration");
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(graph).toHaveAttribute("data-scene", "static");
  await expect(graph.locator(".hero-sticky")).not.toHaveCSS("position", "sticky");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
});
