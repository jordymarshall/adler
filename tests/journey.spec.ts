import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { register, save, snapshot, synced, coachReply } from "./fixtures";
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
  await page.locator(".next-step-card").getByRole("link", { name: "Continue in Coach" }).click();
  await expect(page).toHaveURL(/\/app\/coach/);
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
  await expect(page.getByRole("region", { name: "Your week" })).toBeVisible();
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
  await save(page, state.data, state.revision);
  await page.goto("/app/goals/essays");
  await expect(page.locator(".plan-explanation")).not.toBeVisible();
  await page
    .locator(".journey-disclosure > summary")
    .filter({ hasText: /^Why this plan\?$/ })
    .click();
  await page
    .getByText("Alternatives Adler considered", { exact: true })
    .click();
  await expect(
    page.getByText("Minutes spent writing", { exact: true }),
  ).toBeVisible();
  await page
    .getByText("Research & applicability · 1 sources", { exact: false })
    .click();
  await expect(page.locator(".research-source")).toContainText(
    "does not establish an optimal metric",
  );
  await expect(page.locator(".research-source a")).toHaveAttribute(
    "href",
    "https://europepmc.org/article/MED/26479070",
  );
  await page.getByRole("button", { name: "Start action", exact: true }).click();
  await coachReply(page, [{ entity: "action", operation: "update", id: state.data.actions[0].id, parentId: null, values: JSON.stringify({ outcome: "Done", amount: 4 }) }]);
  await page.locator(".next-step-card").getByRole("link", { name: "Continue in Coach" }).click();
  await page.getByLabel("Message Adler").fill("Done today, four outline points.");
  await page.getByRole("button", { name: "Send message" }).click();
  await expect(page.locator(".coach-thread")).toContainText("Your update is saved.");
  const { data } = await snapshot(page);
  expect(data.actions[0].amount).toBe(4);
  expect(data.goals[0].results.at(-1)?.value).toBe(0);
});

test("conversations open on request, inherit the goal and can move to General", async ({
  page,
}) => {
  await register(page, true);
  await page.goto("/app/coach?goal=essays");
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

test("the landing uses Adler Warm and five focused chapters on desktop and mobile", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator(".adaptive-hero h1")).toHaveText("Reach your goals with a plan that adapts to you.");
  expect(await page.locator(".adaptive-hero h1").evaluate(el => getComputedStyle(el).fontFamily)).toContain("Adler Warm");
  await expect(page.locator(".focus-chapter")).toHaveCount(5);
  await expect(page.locator(".hero-assembled")).toHaveCount(0);
  await expect(page.locator("#step-5")).toContainText("Apple Health");
  await expect(page.locator("#step-5 .connection-availability").filter({ hasText: "Coming soon" })).toHaveCount(2);
  await page.setViewportSize({ width: 390, height: 844 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBeTruthy();
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
});

test("the progress and proposal graph fills its container and has readable labels on desktop and phone", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 1050 });
    await page.goto("/");
    await page.evaluate(() => document.fonts.ready);
    const chart = page.locator(
      ".progress-proposal-preview .progress-viz > svg",
    );
    const size = await chart.evaluate((el) => {
      const svg = el as unknown as SVGSVGElement;
      const box = svg.getBoundingClientRect();
      const plot = svg.querySelector(".chart-grid")!.getBoundingClientRect();
      return {
        coverage: plot.width / box.width,
        labelPixels:
          parseFloat(getComputedStyle(svg.querySelector("text")!).fontSize) *
          svg.getScreenCTM()!.a,
      };
    });
    expect(size.coverage).toBeGreaterThan(0.8);
    expect(size.labelPixels).toBeGreaterThanOrEqual(8.5);
    const graphBottom =
      (await chart.boundingBox())!.y + (await chart.boundingBox())!.height;
    const nextRow = await page
      .locator(".preview-chat")
      .boundingBox();
    expect(nextRow!.y).toBeGreaterThan(graphBottom);
  }
});

test("landing chart details stay available while hovered or keyboard focused", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await page.evaluate(() => document.fonts.ready);
  const chart = page.locator(".progress-proposal-preview .graph-only");
  const graph = chart.locator("svg");
  const details = chart.locator(".chart-tooltip");
  await graph.hover();
  await expect(details).toBeVisible();
  const bounds = (await details.boundingBox())!;
  await page.mouse.move(
    bounds.x + bounds.width / 2,
    bounds.y + bounds.height / 2,
  );
  await expect(details).toBeVisible();
  await graph.focus();
  await page.mouse.move(0, 0);
  await expect(details).toBeVisible();
  await page.keyboard.press("Tab");
  await expect(details).toHaveCount(0);
  await graph.hover();
  await page.mouse.move(0, 0);
  await expect(details).toHaveCount(0);
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
    await save(page, state.data, state.revision);
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
  await expect(page).toHaveURL(/\/app\/coach/);
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
  await page.goto("/app/coach");
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
    await page.route("**/api/availability", (route) =>
      route.fulfill({
        json: { busy: [], checkedAt: new Date().toISOString() },
      }),
    );
    let attempts = 0;
    let bookingId = "";
    await page.route("**/api/bookings", async (route) => {
      const input = route.request().postDataJSON();
      const current = await snapshot(page);
      if (!attempts++) {
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
      await save(page, current.data, current.revision);
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
    await expect(
      page.getByRole("button", { name: "Retry confirmation", exact: true }),
    ).toBeVisible();
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
      name: "Choose calendars & check availability",
      exact: false,
    })
    .click();
  await expect(
    page.getByRole("combobox", { name: "Book in", exact: true }),
  ).toBeVisible();
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
  await page.locator(".calendar-entry.entry-work a").click();
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
  await save(page, current.data, current.revision);
  await page.goto("/app/goals/essays/progress");
  await expect(page.locator(".action-observations")).toContainText(
    "4 points recorded",
  );
});

test("each of the five chapters holds its own viewport and remains readable without motion", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 960 });
  await page.goto("/");
  const panels = page.locator(".focus-chapter");
  for (let i = 0; i < 5; i++) {
    const panel = panels.nth(i);
    await panel.evaluate(node => window.scrollTo({ top: scrollY + node.getBoundingClientRect().top + 20, behavior: "instant" }));
    await expect(panel).toHaveClass(/is-current/);
    await expect(panel.locator(".chapter-stage")).toHaveCSS("position", "sticky");
    await expect(panel.locator(".chapter-copy h2")).toBeInViewport();
  }
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(panels.nth(1).locator(".chapter-stage")).toHaveCSS("position", "static");
});

test("the opening animation uses a concrete nonfitness goal and respects reduced motion", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator(".hero-plan-story")).toContainText("Publish my portfolio");
  await expect(page.locator(".hero-plan-story")).toContainText("25 minutes after breakfast");
  await expect(page.locator(".hero-story-card")).toHaveCount(3);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(page.locator(".hero-story-card").first()).toHaveCSS("animation-name", "none");
  await expect(page.getByRole("heading", { name: "A clear next step." })).toHaveCount(0);
});
