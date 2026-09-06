import type { IncomingMessage, ServerResponse } from "node:http";
import { randomBytes } from "node:crypto";
import { mkdir, readFile, writeFile, rename } from "node:fs/promises";
import type { Plugin } from "vite";
import { z } from "zod";
import { createDAVClient } from "tsdav";
import { coachTurn, modelName } from "./coach.ts";
import {
  availability,
  listCalendars,
  finishBooking,
  newBooking,
  type Booking,
  type CalendarSession,
} from "./calendars.ts";
const sessions = new Map<string, CalendarSession>();
const bookingFile = ".context/calendar-bookings.json";
let bookings: Booking[] = [];
const loaded = readFile(bookingFile, "utf8")
  .then((text) => {
    bookings = JSON.parse(text);
  })
  .catch((error: NodeJS.ErrnoException) => {
    if (error.code !== "ENOENT") throw error;
  });
let queue = Promise.resolve();
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
async function body(req: IncomingMessage) {
  if (!req.headers["content-type"]?.startsWith("application/json"))
    throw new Error("Expected a JSON request.");
  let value = "";
  for await (const chunk of req) {
    value += chunk;
    if (Buffer.byteLength(value) > 150000)
      throw new Error("This request is too large.");
  }
  return JSON.parse(value || "{}");
}
function json(res: ServerResponse, value: unknown, status = 200) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Cache-Control", "no-store");
  res.end(JSON.stringify(value));
}
async function persist() {
  await mkdir(".context", { recursive: true });
  await writeFile(`${bookingFile}.tmp`, JSON.stringify(bookings), {
    mode: 0o600,
  });
  await rename(`${bookingFile}.tmp`, bookingFile);
}
async function book(
  session: CalendarSession,
  sessionId: string,
  input: z.infer<typeof bookingSchema>,
) {
  await loaded;
  let booking = bookings.find(
    (b) => b.id === input.id && b.sessionId === sessionId,
  );
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
    if (Date.parse(input.start) <= Date.now())
      throw new Error("Choose a future time slot.");
    booking = newBooking({ ...input, sessionId });
    bookings.push(booking);
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
async function handle(
  req: IncomingMessage,
  res: ServerResponse,
  next: () => void,
) {
  if (/\/(?:\.|%2e)context(?:\/|%2f)/i.test(req.url ?? ""))
    return json(res, { error: "Private workspace files are not served." }, 403);
  if (!req.url?.startsWith("/api/")) return next();
  const host = req.headers.host ?? "";
  if (
    !/^(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/.test(host) ||
    (req.headers.origin &&
      req.headers.origin !== `http://${host}` &&
      req.headers.origin !== `https://${host}`)
  )
    return json(
      res,
      { error: "Adler’s local API is available only on this computer." },
      403,
    );
  if (req.method === "POST" && req.headers["sec-fetch-site"] === "cross-site")
    return json(res, { error: "Cross-site request refused." }, 403);
  const url = new URL(req.url, `http://${host}`);
  let sessionId = req.headers.cookie?.match(
    /(?:^|; )adler_session=([a-f0-9]{48})(?:;|$)/,
  )?.[1];
  if (!sessionId) {
    sessionId = randomBytes(24).toString("hex");
    res.setHeader(
      "Set-Cookie",
      `adler_session=${sessionId}; HttpOnly; SameSite=Lax; Path=/; Max-Age=2592000`,
    );
  }
  const session = sessions.get(sessionId) ?? {};
  sessions.set(sessionId, session);
  try {
    if (req.method === "GET" && url.pathname === "/api/status")
      return json(res, {
        coach: {
          configured: Boolean(process.env.ANTHROPIC_API_KEY),
          model: modelName(),
        },
        google: {
          configured: configuredGoogle(),
          connected: Boolean(session.google),
        },
        apple: { connected: Boolean(session.apple) },
      });
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
      const target = new URL("https://accounts.google.com/o/oauth2/v2/auth");
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
        refresh_token: tokens.refresh_token || session.google?.refresh_token,
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
        .parse(await body(req));
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
      session.apple = client;
      session.appleCalendars = calendars;
      return json(res, { connected: true });
    }
    if (req.method === "POST" && url.pathname === "/api/calendar/disconnect") {
      const { provider } = z
        .object({ provider: providerSchema })
        .parse(await body(req));
      if (provider === "google") {
        if (session.google)
          await fetch("https://oauth2.googleapis.com/revoke", {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams({
              token:
                session.google.refresh_token || session.google.access_token,
            }),
          });
        session.google = undefined;
      } else {
        session.apple = undefined;
        session.appleCalendars = undefined;
      }
      return json(res, { connected: false });
    }
    if (req.method === "POST" && url.pathname === "/api/availability") {
      const input = rangeSchema.parse(await body(req));
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
      const input = bookingSchema.parse(await body(req));
      const result = queue.then(() => book(session, sessionId!, input));
      queue = result.then(
        () => {},
        () => {},
      );
      return json(res, await result);
    }
    if (req.method === "POST" && url.pathname === "/api/coach") {
      const input = z
        .object({
          consent: z.literal(true),
          context: z.record(z.string(), z.unknown()),
        })
        .parse(await body(req));
      return json(res, await coachTurn(input.context));
    }
    return json(res, { error: "API route not found." }, 404);
  } catch (error) {
    const message =
      error instanceof z.ZodError
        ? error.issues.map((i) => i.message).join(" ")
        : error instanceof Error
          ? error.message
          : "The request could not be completed.";
    // Provider errors may contain request metadata; never forward raw SDK error objects.
    if (url.pathname === "/api/coach")
      return json(
        res,
        {
          error:
            message.includes("API key") ||
            message.includes("authentication") ||
            message.includes("401")
              ? "The model provider rejected the configured API key. Update ANTHROPIC_API_KEY on the server."
              : message.includes("credit") || message.includes("balance")
                ? "The model provider account needs API credits before live coaching can run."
                : "Live coaching could not complete. Check the server’s model configuration and provider access, then retry. Your plan is unchanged.",
        },
        502,
      );
    if (url.pathname.endsWith("/callback")) {
      res.writeHead(302, {
        Location: `/app/calendar?error=${encodeURIComponent(message)}`,
      });
      return res.end();
    }
    return json(res, { error: message }, 400);
  }
}
export function adlerApi(): Plugin {
  return {
    name: "adler-local-api",
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        void handle(req, res, next);
      });
    },
    configurePreviewServer(server) {
      server.middlewares.use((req, res, next) => {
        void handle(req, res, next);
      });
    },
  };
}
