import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { register, save, snapshot, synced } from "./fixtures";
import { addDays, dateInZone, reviewBlock } from "../shared/journey";
import { createGoal } from "../shared/validation";
import { basis, literature } from "./planning-fixture";

test("one first goal moves through starting, working and checking in without leaving its page", async ({
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
  const url = page.url();
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
  await page.getByRole("button", { name: "I’m finished", exact: true }).click();
  await page.getByRole("button", { name: "Done", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "That’s enough for now." }),
  ).toBeVisible();
  expect(page.url()).toBe(url);
  await synced(page);
  const { data } = await snapshot(page);
  expect(data.actions).toHaveLength(1);
  expect(data.actions[0].startedAt).toBeTruthy();
  expect(data.actions[0].outcome).toBe("Done");
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
  await page.getByRole("button", { name: "I’m finished", exact: true }).click();
  await page.getByRole("button", { name: "Done", exact: true }).click();
  await page.getByLabel("Outline points drafted (points) · optional").fill("4");
  await page
    .getByRole("button", { name: "Save check-in", exact: true })
    .click();
  await synced(page);
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

test("reviews keep prior history and ask for one piece of context in the same flow", async ({
  page,
}) => {
  await register(page, true);
  const state = await snapshot(page);
  state.data.review = {
    step: 3,
    note: "Old note",
    decision: "Keep",
    completedAt: "2026-01-04T20:00:00Z",
    periodStart: "2025-12-29",
    periodEnd: "2026-01-04",
  };
  state.data.reviews.push(state.data.review);
  await save(page, state.data, state.revision);
  await page.goto("/app/reviews/current");
  await page
    .getByLabel("What helped or got in the way?")
    .fill("My drafting time was interrupted.");
  await synced(page);
  await page.getByText("Other options", { exact: true }).click();
  await page
    .getByRole("button", { name: "Keep my current plans", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Your week is reviewed." }),
  ).toBeVisible();
  const { data } = await snapshot(page);
  expect(data.reviews.at(-1)?.note).toBe("My drafting time was interrupted.");
  expect(data.reviews[0].note).toBe("Old note");
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

test("the landing keeps the existing font and shows the detailed walkthrough below the core story", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.locator(".hero-intro-v2 h1")).toContainText("Big goals.");
  await expect(page.locator(".eyebrow")).toHaveCount(0);
  await expect(page.locator(".walkthrough-intro h2")).toHaveText(
    "Reach your goals with a planthat adapts to you.",
  );
  await expect(page.locator(".hero-assembled-title h2")).toHaveText(
    "Reach your goals with a planthat adapts to you.",
  );
  await expect(page.locator(".adapt-copy h2")).toHaveText(
    /Life moves\.Your planshould, too\./,
  );
  expect(
    await page
      .locator(".hero-intro-v2 h1")
      .evaluate((el) => getComputedStyle(el).fontFamily),
  ).toContain("DM Sans");
  await expect(page.locator(".walk-step")).toHaveCount(7);
  await expect(page.locator("#step-2")).toContainText("Start plan");
  expect(
    await page
      .locator(".landing-walkthrough")
      .evaluate((el) =>
        Boolean(
          document
            .querySelector(".adapt-section")!
            .compareDocumentPosition(el) & Node.DOCUMENT_POSITION_FOLLOWING,
        ),
      ),
  ).toBeTruthy();
  await page.setViewportSize({ width: 390, height: 844 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth + 1,
    ),
  ).toBeTruthy();
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
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
  await expect(page.locator(".coach-thread")).toContainText(
    "What would you like to publish?",
  );
  expect(requests).toHaveLength(1);
  await expect(page).toHaveURL(/\/app\/onboarding$/);
  await expect(page.getByLabel("Message Adler")).toHaveValue("");
  await page
    .getByLabel("Message Adler")
    .fill("An essay about my project, on my website.");
  await page.getByRole("button", { name: "Send message" }).click();
  await expect(page).toHaveURL(/\/app\/goals\/essay$/);
  await expect(
    page.getByRole("button", { name: "Start plan", exact: true }),
  ).toBeVisible();
  expect(requests).toHaveLength(2);
  expect((await snapshot(page)).data.conversations.at(-1)?.goalId).toBe(
    "essay",
  );
  await page.getByText("Questions & conversations", { exact: true }).click();
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

test("a directly applied action returns from inline coaching to the next step", async ({
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
    .locator(".embedded-coach:visible")
    .getByLabel("Message Adler")
    .fill("Make this three points instead of five.");
  await page.getByRole("button", { name: "Send message", exact: true }).click();
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

test("the three-part story follows normal scrolling and uses the app chart throughout", async ({
  page,
}) => {
  await page.goto("/");
  const panels = page.locator(".chapter-flow .chapter-panel");
  await expect(panels).toHaveCount(3);
  for (let index = 0; index < 3; index++) {
    const panel = panels.nth(index);
    await panel.evaluate((node) =>
      window.scrollTo({
        top: scrollY + node.getBoundingClientRect().top - innerHeight * 0.25,
        behavior: "instant",
      }),
    );
    await expect(panel.locator(".chapter-number")).toHaveAttribute(
      "aria-current",
      "step",
    );
    await expect(panel.locator(".chapter-visual")).toBeVisible();
  }
  const paths = await page
    .locator(".v2-landing .chart-actual")
    .evaluateAll((elements) => elements.map((el) => el.getAttribute("d")));
  expect(paths).toHaveLength(3);
  expect(new Set(paths).size).toBe(1);
  await page.goto("/#step-7");
  await expect(page.locator("#step-7")).toContainText("Adler remembers");
  await expect(page.locator(".remembered-context")).toBeInViewport();
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(panels.nth(1).locator(".chapter-visual")).toHaveCSS(
    "transform",
    "none",
  );
});
