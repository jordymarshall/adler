// Native-app routes. Every screen reads a typed view built by shared/app-views.ts from
// the same shared derivations the web renders, and every edit goes through the shared
// command catalog, so the phone never becomes a second coaching system.
import type { IncomingMessage, ServerResponse } from "node:http";
import { z } from "zod";
import type { Database } from "./database.ts";
import type { Service } from "./service.ts";
import type { CalendarAPI } from "./calendar-api.ts";
import type { Channels } from "./channels.ts";
import { changeSchema } from "./commands.ts";
import { configuration, providerStatus, serverKeysAllowed } from "./providers.ts";
import { body, json } from "./http.ts";
import { beginAction } from "../shared/next-step.ts";
import { currentPlan, startGoal, type Data } from "../shared/workspace.ts";
import type { ConnectionsView } from "../shared/app-views.ts";
import {
  calendarView,
  coachView,
  goalDetailView,
  goalsView,
  insightsView,
  learningDetailView,
  sessionView,
  settingsView,
  todayView,
} from "../shared/app-views.ts";

export interface AppDependencies {
  db: Database;
  service: Service;
  calendar: CalendarAPI;
  channels: Channels;
}

const changesInput = z
  .object({
    changes: z.array(changeSchema).min(1).max(50),
    requestId: z.string().min(8).max(100),
    revision: z.number().int().min(0),
    goalId: z.string().max(100).optional(),
  })
  .strict();
const startInput = z.object({ goalId: z.string().max(100).optional() }).strict();
const notFound = (message: string) => Object.assign(new Error(message), { status: 404 });

function coachStatus(db: Database, userId: string) {
  try {
    const config = configuration(db, userId);
    return { configured: true, provider: config.provider, model: config.model };
  } catch {
    return { configured: false, provider: "", model: "" };
  }
}
function account(db: Database, userId: string) {
  const row = db.sql.prepare("SELECT id,username FROM users WHERE id=?").get(userId) as
    | { id: string; username: string }
    | undefined;
  if (!row) throw notFound("Sign in to your workspace.");
  return row;
}

export async function handleAppApi(
  req: IncomingMessage,
  res: ServerResponse,
  url: URL,
  userId: string,
  deps: AppDependencies,
) {
  const { db, service, calendar, channels } = deps;
  db.limit(`app:${userId}`, 600);
  const route = url.pathname.split("/").slice(3).map(decodeURIComponent);
  const method = req.method ?? "GET";
  // Every write returns the views the client needs next, so one round trip refreshes the screen.
  const edited = (
    result: { revision: number; data: Data },
    goalId?: string,
    now = new Date(),
  ) =>
    json(res, {
      revision: result.revision,
      today: todayView(result.data, { revision: result.revision, now }),
      goal:
        goalId && result.data.goals.some((goal) => goal.id === goalId)
          ? goalDetailView(result.data, {
              revision: result.revision,
              goalId,
              now,
              proposals: service.listProposals(userId),
            })
          : undefined,
    });

  if (method === "GET" && route[0] === "session" && route.length === 1) {
    const snapshot = db.snapshot(userId);
    return json(
      res,
      sessionView(snapshot.data, {
        revision: snapshot.revision,
        user: account(db, userId),
        coach: coachStatus(db, userId),
        calendars: calendar.status(userId),
        serverKeysAllowed: serverKeysAllowed(),
      }),
    );
  }
  if (method === "GET" && route[0] === "today" && route.length === 1) {
    const snapshot = await service.refreshPlanning(userId);
    return json(res, todayView(snapshot.data, { revision: snapshot.revision }));
  }
  if (method === "GET" && route[0] === "goals" && route.length === 1) {
    const snapshot = await service.refreshPlanning(userId);
    return json(
      res,
      goalsView(snapshot.data, {
        revision: snapshot.revision,
        weeks: Number(url.searchParams.get("weeks")) || undefined,
      }),
    );
  }
  if (method === "GET" && route[0] === "goals" && route.length === 2) {
    const snapshot = await service.refreshPlanning(userId);
    const plan = Number(url.searchParams.get("plan"));
    return json(
      res,
      goalDetailView(snapshot.data, {
        revision: snapshot.revision,
        goalId: route[1],
        planVersion: Number.isInteger(plan) && plan > 0 ? plan : undefined,
        stepId: url.searchParams.get("step") ?? undefined,
        milestoneId: url.searchParams.get("milestone") ?? undefined,
        proposals: service.listProposals(userId),
      }),
    );
  }
  if (method === "GET" && route[0] === "coach" && route.length <= 2) {
    const snapshot = db.snapshot(userId);
    return json(
      res,
      coachView(snapshot.data, {
        revision: snapshot.revision,
        conversationId: route[1],
        proposals: service.listProposals(userId),
        model: coachStatus(db, userId),
      }),
    );
  }
  if (method === "GET" && route[0] === "insights" && route.length === 1) {
    const snapshot = db.snapshot(userId);
    return json(
      res,
      insightsView(snapshot.data, {
        revision: snapshot.revision,
        goalId: url.searchParams.get("goal") ?? undefined,
        proposals: service.listProposals(userId),
      }),
    );
  }
  if (method === "GET" && route[0] === "insights" && route.length === 2) {
    const snapshot = db.snapshot(userId);
    return json(
      res,
      learningDetailView(snapshot.data, { revision: snapshot.revision, recordId: route[1] }),
    );
  }
  if (method === "GET" && route[0] === "calendar" && route.length === 1) {
    const snapshot = db.snapshot(userId);
    return json(
      res,
      calendarView(snapshot.data, {
        revision: snapshot.revision,
        start: url.searchParams.get("start") ?? undefined,
        calendars: calendar.status(userId),
      }),
    );
  }
  if (method === "GET" && route[0] === "settings" && route.length === 1) {
    const snapshot = db.snapshot(userId);
    const status = channels.status(userId);
    return json(
      res,
      settingsView(snapshot.data, {
        revision: snapshot.revision,
        user: account(db, userId),
        coach: coachStatus(db, userId),
        calendars: calendar.status(userId),
        serverKeysAllowed: serverKeysAllowed(),
        provider: providerStatus(db, userId),
        // channels.status reads SQLite rows, so its row types are widened here only.
        connections: status as unknown as ConnectionsView,
        tokens: db.sql
          .prepare("SELECT id,name,scope,expires FROM tokens WHERE user_id=?")
          .all(userId) as { id: string; name: string; scope: string; expires: number }[],
        publicUrl: process.env.PUBLIC_URL ?? null,
      }),
    );
  }
  if (method === "POST" && route[0] === "changes" && route.length === 1) {
    const input = changesInput.parse(await body(req));
    try {
      return edited(
        await service.applyAppChanges(userId, input.changes, input.revision, input.requestId),
        input.goalId,
      );
    } catch (error) {
      if ((error as { status?: number }).status !== 409) throw error;
      return json(
        res,
        {
          error: (error as Error).message,
          revision: (error as { revision?: number }).revision ?? db.snapshot(userId).revision,
        },
        409,
      );
    }
  }
  if (method === "POST" && route[0] === "actions" && route[2] === "start" && route.length === 3) {
    const input = startInput.parse(await body(req));
    const now = new Date();
    const result = await service.workspaceEdit(userId, "Action started.", (data) => {
      const action = data.actions.find((item) => item.id === route[1]);
      if (!action) throw notFound("That action isn’t here.");
      if (action.startedAt) throw new Error("This action already started.");
      beginAction(data, action.id, now);
      if (!action.startedAt)
        throw new Error(
          "This action can’t start yet. Its goal must be active, the action unreported, and any earlier work finished.",
        );
    });
    return edited(result, input.goalId, now);
  }
  if (method === "POST" && route[0] === "goals" && route[2] === "start" && route.length === 3) {
    const result = await service.workspaceEdit(userId, "Plan started.", (data) => {
      const goal = data.goals.find((item) => item.id === route[1]);
      if (!goal) throw notFound("This goal isn’t here.");
      if (goal.status !== "Draft") throw new Error("Only a draft plan can be started.");
      if (!currentPlan(goal).action.trim())
        throw new Error("Choose a first action before starting this goal’s plan.");
      startGoal(data, goal.id);
    });
    return edited(result, route[1]);
  }
  return json(res, { error: "App route not found." }, 404);
}
