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
    page.locator(".next-step-card .button.primary:visible"),
  ).toHaveCount(1);
  await expect(
    page.getByRole("navigation", { name: "Goal views" }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("heading", { name: "Milestones", exact: true }),
  ).not.toBeVisible();
  await page.getByRole("button", { name: "Start plan", exact: true }).click();
  await expect(page.locator('[data-phase="schedule"]')).toBeVisible();
  await page
    .getByRole("button", { name: "I’ll do it now", exact: true })
    .click();
  await expect(page.locator('[data-phase="working"]')).toBeVisible();
  await page.locator(".next-step-card").getByRole("link", { name: "Continue in Check-in" }).click();
  await expect(page).toHaveURL(/\/app\/check-in/);
  await expect(page.getByLabel("Message Adler")).toContainText("Sketch three thumbnails");
  const { data } = await snapshot(page);
  expect(data.actions).toHaveLength(1);
  expect(data.actions[0].startedAt).toBeTruthy();
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
  await expect(page.locator('[data-phase="waiting"]')).toContainText(
    "You can leave things here",
  );
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
  await page.getByRole("button", { name: "Start action", exact: true }).click();
  await coachReply(page, [{ entity: "action", operation: "update", id: state.data.actions[0].id, parentId: null, values: JSON.stringify({ outcome: "Done", amount: 4 }) }]);
  await page.locator(".next-step-card").getByRole("link", { name: "Continue in Check-in" }).click();
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
  const typography = await page.locator(".journey-introduction h1, .journey-step-heading h2, .mountain-finale h2").evaluateAll(elements =>
    elements.map(el => ({ family: getComputedStyle(el).fontFamily, weight: getComputedStyle(el).fontWeight })),
  );
  expect(typography.every(font => font.family.includes("Adler Warm") && font.weight === "550")).toBeTruthy();
  await expect(page.locator(".hero-intro-v2 > p").first()).toHaveCSS("font-weight", "500");
  await expect(page.locator(".journey-step")).toHaveCount(5);
  await expect(page.getByRole("navigation", { name: "Your goal journey" }).getByRole("link")).toHaveCount(5);
  await expect(page.locator("#step-4")).toContainText("Apple Health");
  await expect(page.locator("#step-4 .connections-upcoming")).toContainText("Shared goals & stakes");
  await expect(page.locator("#step-4 .connections-upcoming")).toContainText("Coming soon");
  await page.setViewportSize({ width: 390, height: 844 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBeTruthy();
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
});

test("landing app captures load the desktop and native mobile screens", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 1050 });
    await page.goto("/");
    for (const screen of ["goals", "plan", "checkin", "calendar", "progress", "insights"]) {
      const details = page.locator(`[data-screen="${screen}"]`);
      if (screen === "calendar") await details.locator("summary").first().click();
      const capture = details.locator(".app-capture-window .capture-still img");
      await capture.scrollIntoViewIfNeeded();
      await expect.poll(() => capture.evaluate((el: HTMLImageElement) => el.complete && el.naturalWidth > 0)).toBe(true);
      const image = await capture.evaluate((el: HTMLImageElement) => ({ src: el.currentSrc, pixels: el.naturalWidth, width: el.getBoundingClientRect().width }));
      expect(image.src).toContain(`/media/app/${screen}-${width === 390 ? "mobile" : "desktop"}.webp`);
      expect(image.pixels).toBe(width === 390 ? 780 : ["goals", "calendar"].includes(screen) ? 2000 : 1680);
      expect(image.width).toBeGreaterThan(width === 390 ? 300 : 600);
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
  }
});

test("landing capture interactions pause and respect reduced motion", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/");
  const preview = page.locator('[data-screen="insights"] .app-capture-preview');
  await preview.getByRole("button", { name: "Pause Insights animation" }).scrollIntoViewIfNeeded();
  await expect(page.locator("#step-4")).toHaveClass(/is-current/);
  const cursor = preview.locator(".capture-cursor");
  await expect(cursor).toHaveCSS("animation-play-state", "running");
  await expect(page.locator("#step-1 .capture-cursor")).toHaveCSS("animation-play-state", "paused");
  await preview.getByRole("button", { name: "Pause Insights animation" }).click();
  await expect(cursor).toHaveCSS("animation-play-state", "paused");
  await preview.getByRole("button", { name: "Play Insights animation" }).click();
  await expect(cursor).toHaveCSS("animation-play-state", "running");
  await preview.locator(".capture-detail img").evaluate((el: HTMLImageElement) => el.decode());
  await preview.locator(".capture-animation").evaluateAll(elements => elements.forEach(el => el.getAnimations().forEach(animation => { animation.currentTime = 9000; })));
  await expect(preview.locator(".capture-detail")).toHaveCSS("opacity", "1");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(cursor).toHaveCSS("display", "none");
  await expect(preview.locator(".capture-detail")).toHaveCSS("display", "none");
  await expect(preview.locator(".capture-still")).toBeVisible();
});

test("landing app screenshots enlarge with the keyboard and restore focus", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 1050 });
    await page.goto("/");
      const opener = page.getByRole("button", { name: "Enlarge Goal progress screenshot" });
    await opener.focus();
    await page.keyboard.press("Enter");
    const dialog = page.getByRole("dialog", { name: "Goal progress" });
    await expect(dialog).toBeVisible();
    await expect.poll(() => dialog.locator("img").evaluate((el: HTMLImageElement) => el.complete && el.naturalWidth > 0)).toBe(true);
    expect((await dialog.boundingBox())!.width).toBeGreaterThan(width === 390 ? 340 : 1200);
    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
    await page.keyboard.press("Escape");
    await expect(dialog).toHaveCount(0);
    await expect(opener).toBeFocused();
  }
});

test("progress and insights frames remain readable on demand with reduced motion", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 1050 });
    await page.goto("/");
      const progress = page.locator('[data-screen="progress"] .app-capture-preview');
    await progress.getByRole("button", { name: "2 Inputs & assumptions" }).click();
    await expect(progress.locator(".capture-detail")).toBeVisible();
    await expect(progress.locator(".capture-detail")).toHaveCSS("opacity", "1");
    await progress.getByRole("button", { name: "Enlarge Goal progress screenshot" }).click();
    await expect(page.getByRole("dialog").locator("img")).toHaveAttribute("src", /progress-desktop-detail.webp/);
    await page.keyboard.press("Escape");
    await progress.getByRole("button", { name: "1 Goal projection" }).click();
    await expect(progress.locator(".capture-detail")).toBeHidden();
      const insights = page.locator('[data-screen="insights"] .app-capture-preview');
    for (const [label, selector] of [["2 The learning journey", ".capture-detail"], ["3 Why this test?", ".capture-followup"]]) {
      const control = insights.getByRole("button", { name: label });
      await control.focus();
      await page.keyboard.press("Enter");
      await expect(control).toHaveAttribute("aria-pressed", "true");
      await expect(insights.locator(selector)).toHaveCSS("opacity", "1");
      await expect(insights.locator(selector)).toBeVisible();
      await expect.poll(() => insights.locator(`${selector} img`).evaluate((el: HTMLImageElement) => el.complete && el.naturalWidth > 0)).toBe(true);
    }
    await expect(insights.locator(".capture-cursor")).toBeHidden();
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
    await expect(page.locator('[data-phase="checkin"]')).toBeVisible();
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
  await expect(page.locator('[data-phase="waiting"]')).toContainText(
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
  await page.getByText("Something doesn’t fit?", { exact: true }).click();
  await page
    .locator(".step-options")
    .getByRole("button", { name: "Ask Adler", exact: true })
    .click();
  await page
    .locator(".focused-coach")
    .getByLabel("Message Adler")
    .fill("Make this three points instead of five.");
  await page.getByRole("button", { name: "Send message", exact: true }).click();
  await expect.poll(async () => (await snapshot(page)).data.actions[0].title).toBe("Draft three main points");
  await page.goto("/app/goals/essays");
  await expect(page.locator('[data-phase="ready"]')).toContainText(
    "Draft three main points",
  );
  await expect(
    page.getByRole("button", { name: "Start action", exact: true }),
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

test("the journey index follows the reader and lets them choose a step", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 960 });
  await page.goto("/");
  const index = page.getByRole("navigation", { name: "Your goal journey" });
  for (let i = 0; i < 5; i++) {
    await index.getByRole("link").nth(i).click();
    await expect(index.getByRole("link").nth(i)).toHaveAttribute("aria-current", "step");
    await expect(page.locator(`#step-${i + 1} h2`).first()).toBeInViewport();
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(index).toHaveCSS("position", "static");
});

test("the first screen leads straight into the story without a mandatory animation", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 960 });
  await page.goto("/");
  await page.getByRole("link", { name: "Follow one goal" }).click();
  await expect(page.locator(".journey-opening h2")).toBeInViewport();
  await expect(page.locator(".journey-goal-anchor")).toContainText("Read 30 books");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(page.locator(".journey-hero")).not.toHaveCSS("position", "sticky");
  await expect(page.locator(".hero-float")).toHaveCount(0);
});

test("three real mobile screens and coming-soon store buttons lead into the immersive graph", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/");
  const hero = page.getByRole("region", { name: "A system that understands you" });
  await expect(hero.locator(".hero-mobile-phone")).toHaveCount(3);
  for (const img of await hero.locator(".hero-mobile-phone img").all()) {
    await expect.poll(() => img.evaluate((el: HTMLImageElement) => el.complete && el.naturalWidth === 780)).toBe(true);
  }
  await hero.getByRole("button", { name: "Download on the App Store" }).click();
  await expect(hero.getByRole("status")).toContainText("App Store version is coming soon");
  await hero.getByRole("button", { name: "Get it on Google Play" }).click();
  await expect(hero.getByRole("status")).toContainText("Google Play version is coming soon");
  await expect(hero.getByRole("link", { name: "Get started on web" })).toHaveAttribute("href", "/app/goals/new");
  const opener = hero.getByRole("button", { name: "Enlarge Check in with Adler" });
  await opener.focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("dialog", { name: "Check in with Adler" })).toBeVisible();
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
