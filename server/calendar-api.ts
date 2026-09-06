import type { IncomingMessage, ServerResponse } from "node:http";
import { randomBytes } from "node:crypto";
import { z } from "zod";
import { createDAVClient } from "tsdav";
import { Database } from "./database.ts";
import { Service } from "./service.ts";
import {
  availability,
  listCalendars,
  finishBooking,
  newBooking,
  type Booking,
  type CalendarSession,
} from "./calendars.ts";
import { currentPlan, type Data } from "../shared/workspace.ts";
import type { Change } from "./commands.ts";
import { json } from "./http.ts";
const configuredGoogle = () =>
  Boolean(
    process.env.GOOGLE_CLIENT_ID &&
    process.env.GOOGLE_CLIENT_SECRET &&
    process.env.GOOGLE_REDIRECT_URI,
  );
const providerSchema = z.enum(["google", "apple"]);
const rangeSchema = z
  .object({
    provider: providerSchema,
    calendarIds: z.array(z.string().min(1).max(2000)).min(1).max(30),
    start: z.iso.datetime({ offset: true }),
    end: z.iso.datetime({ offset: true }),
  })
  .refine(
    (v) =>
      Date.parse(v.end) > Date.parse(v.start) &&
      Date.parse(v.end) - Date.parse(v.start) <= 14 * 86400000,
    "Choose a range of up to 14 days.",
  );
const bookingSchema = z
  .object({
    id: z.uuid(),
    provider: providerSchema,
    calendarId: z.string().min(1).max(2000),
    conflictIds: z.array(z.string().min(1).max(2000)).min(1).max(30),
    title: z.string().min(1).max(500),
    start: z.iso.datetime({ offset: true }),
    end: z.iso.datetime({ offset: true }),
    checkIn: z.boolean(),
  })
  .refine(
    (v) =>
      Date.parse(v.end) > Date.parse(v.start) &&
      Date.parse(v.end) - Date.parse(v.start) <= 4 * 3600000,
    "Work blocks must last between 1 minute and 4 hours.",
  );
export class CalendarAPI {
  sessions = new Map<string, CalendarSession>();
  constructor(
    public db: Database,
    public service: Service,
  ) {}
  async session(userId: string) {
    let session = this.sessions.get(userId);
    if (!session) {
      session = {
        google: this.db.secret(userId, "calendar-google"),
        state: this.db.secret(userId, "calendar-state"),
      };
      this.sessions.set(userId, session);
    }
    const apple = this.db.secret<{ email: string; password: string }>(
      userId,
      "calendar-apple",
    );
    if (apple && !session.apple) {
      session.apple = await createDAVClient({
        serverUrl: "https://caldav.icloud.com",
        credentials: { username: apple.email, password: apple.password },
        authMethod: "Basic",
        defaultAccountType: "caldav",
      });
      session.appleCalendars = await session.apple.fetchCalendars();
    }
    return session;
  }
  status(userId: string) {
    return {
      google: {
        configured: configuredGoogle(),
        connected: Boolean(this.db.secret(userId, "calendar-google")),
      },
      apple: { connected: Boolean(this.db.secret(userId, "calendar-apple")) },
    };
  }
  async readAvailability(userId: string, input: unknown) {
    const value = rangeSchema.parse(input);
    const session = await this.session(userId);
    try {
      return {
        busy: await availability(
          session,
          value.provider,
          value.calendarIds,
          value.start,
          value.end,
        ),
        checkedAt: new Date().toISOString(),
      };
    } finally {
      this.persistSession(userId, session);
    }
  }
  persistSession(userId: string, session: CalendarSession) {
    for (const [name, value] of [
      ["google", session.google],
      ["state", session.state],
    ] as const) {
      if (value) this.db.setSecret(userId, `calendar-${name}`, value);
      else this.db.removeSecret(userId, `calendar-${name}`);
    }
  }
  async context(userId: string) {
    const session = await this.session(userId);
    try {
      const calendars = await listCalendars(session);
      const start = new Date().toISOString(),
        end = new Date(Date.now() + 7 * 86400000).toISOString();
      const providers = [];
      for (const provider of ["google", "apple"] as const) {
        const list = calendars[provider];
        if (!list.length) continue;
        if (list.length > 30) {
          providers.push({
            provider,
            calendars: list,
            error: "Choose up to 30 conflict calendars in Calendar.",
          });
          continue;
        }
        try {
          providers.push({
            provider,
            calendars: list,
            busy: await availability(
              session,
              provider,
              list.map((c) => c.id),
              start,
              end,
            ),
            start,
            end,
            checkedAt: new Date().toISOString(),
          });
        } catch {
          providers.push({
            provider,
            calendars: list,
            error:
              "Availability is unknown. Reconnect or check Calendar before booking.",
          });
        }
      }
      return providers;
    } finally {
      this.persistSession(userId, session);
    }
  }
  async applyExternal(userId: string, changes: Change[], data: Data) {
    const bookings = changes.filter(
      (c) =>
        c.entity === "workBlock" &&
        c.operation === "create" &&
        ["google", "apple"].includes(JSON.parse(c.values).provider),
    );
    if (!bookings.length) return;
    const session = await this.session(userId);
    try {
      for (const change of bookings) {
        const value = JSON.parse(change.values);
        const result = await this.book(
          session,
          userId,
          bookingSchema.parse({
            id: change.id,
            provider: value.provider,
            calendarId: value.calendarId,
            conflictIds: value.conflictIds,
            title: value.action,
            start: value.start,
            end: value.end,
            checkIn: value.checkIn,
          }),
        );
        if (!result.workDone || (value.checkIn && !result.checkInDone))
          throw new Error(
            result.error ??
              "The calendar booking is incomplete. Retry the same proposal to finish the missing event.",
          );
        const block = data.workBlocks.find((b) => b.id === change.id)!;
        block.eventId = result.workId;
        if (result.checkInId) block.checkInId = result.checkInId;
      }
    } finally {
      this.persistSession(userId, session);
    }
  }
  async handle(
    req: IncomingMessage,
    res: ServerResponse,
    url: URL,
    userId: string,
    inputBody: unknown,
  ) {
    return this.service.locked(userId, async () => {
      const session = await this.session(userId);
      try {
        if (req.method === "GET" && url.pathname === "/api/calendars")
          return json(res, await listCalendars(session));
        if (
          req.method === "GET" &&
          url.pathname === "/api/calendar/google/connect"
        ) {
          if (!configuredGoogle())
            throw new Error(
              "Set GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET and GOOGLE_REDIRECT_URI on the server first.",
            );
          session.state = {
            value: randomBytes(32).toString("hex"),
            expires: Date.now() + 600000,
          };
          const target = new URL(
            "https://accounts.google.com/o/oauth2/v2/auth",
          );
          target.search = new URLSearchParams({
            client_id: process.env.GOOGLE_CLIENT_ID!,
            redirect_uri: process.env.GOOGLE_REDIRECT_URI!,
            response_type: "code",
            access_type: "offline",
            prompt: "consent",
            state: session.state.value,
            scope: [
              "calendar.calendarlist.readonly",
              "calendar.events.freebusy",
              "calendar.events.owned",
            ]
              .map((s) => `https://www.googleapis.com/auth/${s}`)
              .join(" "),
          }).toString();
          res.writeHead(302, { Location: target.toString() });
          return res.end();
        }
        if (
          req.method === "GET" &&
          url.pathname === "/api/calendar/google/callback"
        ) {
          const state = session.state;
          session.state = undefined;
          if (
            !state ||
            state.expires < Date.now() ||
            state.value !== url.searchParams.get("state")
          )
            throw new Error(
              "Google sign-in expired or could not be verified. Start the connection again.",
            );
          if (!url.searchParams.get("code"))
            throw new Error("Google Calendar access was not granted.");
          const response = await fetch("https://oauth2.googleapis.com/token", {
            method: "POST",
            body: new URLSearchParams({
              client_id: process.env.GOOGLE_CLIENT_ID!,
              client_secret: process.env.GOOGLE_CLIENT_SECRET!,
              redirect_uri: process.env.GOOGLE_REDIRECT_URI!,
              code: url.searchParams.get("code")!,
              grant_type: "authorization_code",
            }),
          });
          const tokens = await response.json();
          if (!response.ok)
            throw new Error(
              "Google could not complete the connection. Check the OAuth configuration.",
            );
          session.google = {
            access_token: tokens.access_token,
            refresh_token:
              tokens.refresh_token || session.google?.refresh_token,
            expires_at: Date.now() + tokens.expires_in * 1000,
          };
          res.writeHead(302, { Location: "/app/calendar?connected=google" });
          return res.end();
        }
        if (
          req.method === "POST" &&
          url.pathname === "/api/calendar/apple/connect"
        ) {
          const input = z
            .object({
              email: z.email(),
              password: z
                .string()
                .regex(
                  /^[a-z]{4}(?:-[a-z]{4}){3}$/,
                  "Use an Apple app-specific password, not your account password.",
                ),
            })
            .parse(inputBody);
          const client = await createDAVClient({
            serverUrl: "https://caldav.icloud.com",
            credentials: { username: input.email, password: input.password },
            authMethod: "Basic",
            defaultAccountType: "caldav",
          });
          const calendars = await client.fetchCalendars();
          if (!calendars.length)
            throw new Error(
              "No iCloud calendars were returned. Check that iCloud Calendar is enabled.",
            );
          this.db.setSecret(userId, "calendar-apple", input);
          session.apple = client;
          session.appleCalendars = calendars;
          return json(res, { connected: true });
        }
        if (
          req.method === "POST" &&
          url.pathname === "/api/calendar/disconnect"
        ) {
          const { provider } = z
            .object({ provider: providerSchema })
            .parse(inputBody);
          if (provider === "google") {
            if (session.google)
              await fetch("https://oauth2.googleapis.com/revoke", {
                method: "POST",
                headers: {
                  "Content-Type": "application/x-www-form-urlencoded",
                },
                body: new URLSearchParams({
                  token:
                    session.google.refresh_token || session.google.access_token,
                }),
              });
            session.google = undefined;
          } else {
            this.db.removeSecret(userId, "calendar-apple");
            session.apple = undefined;
            session.appleCalendars = undefined;
          }
          return json(res, { connected: false });
        }
        if (req.method === "POST" && url.pathname === "/api/availability") {
          const input = rangeSchema.parse(inputBody);
          return json(res, {
            busy: await availability(
              session,
              input.provider,
              input.calendarIds,
              input.start,
              input.end,
            ),
            checkedAt: new Date().toISOString(),
          });
        }
        if (req.method === "POST" && url.pathname === "/api/bookings") {
          const input = bookingSchema.parse(inputBody);
          const { goalId } = z
            .object({ goalId: z.string().min(1) })
            .parse(inputBody);
          const snapshot = this.db.snapshot(userId),
            goal = snapshot.data.goals.find((g) => g.id === goalId);
          if (!goal || goal.status !== "Active")
            throw new Error("Choose an active goal before booking.");
          const result = await this.book(session, userId, input);
          if (result.workDone) {
            const existing = snapshot.data.workBlocks.find(
              (b) => b.id === input.id,
            );
            if (existing) {
              if (result.checkInDone) existing.checkInId = result.checkInId;
            } else {
              snapshot.data.workBlocks.push({
                id: input.id,
                goalId,
                action: input.title,
                start: input.start,
                end: input.end,
                provider: input.provider,
                status: "Scheduled",
                eventId: result.workId,
                ...(result.checkInDone ? { checkInId: result.checkInId } : {}),
              });
              snapshot.data.actions = snapshot.data.actions.filter(
                (a) =>
                  a.goalId !== goalId ||
                  a.date ||
                  a.outcome ||
                  a.title !== input.title,
              );
              snapshot.data.actions.push({
                id: input.id,
                goalId,
                title: input.title,
                criterion: currentPlan(goal).criterion,
                timing: input.start,
                date: new Intl.DateTimeFormat("en-CA", {
                  timeZone: snapshot.data.timeZone,
                  year: "numeric",
                  month: "2-digit",
                  day: "2-digit",
                }).format(new Date(input.start)),
                planVersion: currentPlan(goal).version,
                history: [],
              });
            }
            this.db.transaction(() =>
              this.db.save(
                userId,
                snapshot.data,
                snapshot.revision,
                "web",
                "Calendar booking recorded.",
              ),
            );
            this.service.changed(userId);
          }
          return json(res, result);
        }
        return json(res, { error: "Calendar route not found." }, 404);
      } finally {
        this.persistSession(userId, session);
      }
    });
  }
  async book(
    session: CalendarSession,
    sessionId: string,
    input: z.infer<typeof bookingSchema>,
  ) {
    const row = this.db.sql
      .prepare("SELECT json FROM bookings WHERE id=? AND user_id=?")
      .get(input.id, sessionId) as { json: string } | undefined;
    let booking: Booking | undefined = row ? JSON.parse(row.json) : undefined;
    const persist = async () => {
      this.db.sql
        .prepare(
          "INSERT INTO bookings VALUES(?,?,?) ON CONFLICT(id) DO UPDATE SET json=excluded.json WHERE bookings.user_id=excluded.user_id",
        )
        .run(input.id, sessionId, JSON.stringify(booking));
    };
    if (
      booking &&
      ["provider", "calendarId", "title", "start", "end", "checkIn"].some(
        (key) =>
          booking![key as keyof Booking] !== input[key as keyof typeof input],
      )
    )
      throw new Error(
        "This booking changed. Choose a new slot before confirming.",
      );
    if (!booking) {
      if (
        this.db.sql.prepare("SELECT id FROM bookings WHERE id=?").get(input.id)
      )
        throw new Error("Choose a new booking ID.");
      if (Date.parse(input.start) <= Date.now())
        throw new Error("Choose a future time slot.");
      booking = newBooking({ ...input, sessionId });
      await persist();
    }
    const current = booking;
    if (current.workDone && (!current.checkIn || current.checkInDone))
      return {
        id: current.id,
        workDone: true,
        checkInDone: current.checkInDone,
        workId: current.workId,
        checkInId: current.checkInId,
      };
    await finishBooking(session, current, persist);
    return {
      id: current.id,
      workDone: current.workDone,
      checkInDone: current.checkInDone,
      workId: current.workId,
      checkInId: current.checkInId,
      error: current.error,
    };
  }
}
