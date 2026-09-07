import type { IncomingMessage, ServerResponse } from "node:http";
import { randomBytes, randomUUID } from "node:crypto";
import type { Plugin } from "vite";
import { z } from "zod";
import { Database, digest } from "./database.ts";
import { Service } from "./service.ts";
import { PlanWorker } from "./plan-worker.ts";
import { Channels, validateTwilio, messagingProvider } from "./channels.ts";
import { verifyLinq, parseLinq } from "./linq.ts";
import { reactionTypes } from "../shared/workspace.ts";
import { CalendarAPI } from "./calendar-api.ts";
import {
  configuration,
  defaults,
  providerNames,
  providerStatus,
  generate,
} from "./providers.ts";
import { changeSchema } from "./commands.ts";
import { handleMCP } from "./mcp.ts";
import { body, rawBody, json } from "./http.ts";
const credentials = z.object({
  username: z
    .string()
    .trim()
    .min(3)
    .max(80)
    .regex(/^[a-zA-Z0-9_.@-]+$/),
  password: z.string().min(10).max(200),
  timeZone: z
    .string()
    .default("UTC")
    .refine((s) => {
      try {
        new Intl.DateTimeFormat("en", { timeZone: s });
        return true;
      } catch {
        return false;
      }
    }, "Choose a valid time zone."),
});
const cookie = (req: IncomingMessage) =>
  req.headers.cookie?.match(
    /(?:^|;\s*)adler_session=([a-f0-9]{64})(?:;|$)/,
  )?.[1] ?? "";
export function createRuntime(directory?: string) {
  const db = new Database(directory),
    service = new Service(db),
    channels = new Channels(db, service),
    calendar = new CalendarAPI(db, service),
    planner = new PlanWorker(service);
  service.onChanged = (userId) => { channels.ensureJobs(userId); planner.ensureJobs(userId); };
  service.onReaction = (...args) => channels.queueReaction(...args);
  service.calendarContext = (userId) => calendar.context(userId);
  service.externalApply = (userId, changes, data) =>
    calendar.applyExternal(userId, changes, data);
  function sessionCookie(res: ServerResponse, value: string) {
    res.setHeader(
      "Set-Cookie",
      `adler_session=${value}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${value ? 2592000 : 0}${process.env.PUBLIC_URL?.startsWith("https:") ? "; Secure" : ""}`,
    );
  }
  function bearer(req: IncomingMessage, scope: string) {
    const token =
      req.headers.authorization?.match(/^Bearer ([a-zA-Z0-9_-]+)$/)?.[1] ?? "";
    return db.sql
      .prepare(
        "SELECT user_id FROM tokens WHERE hash=? AND scope=? AND expires>?",
      )
      .get(digest(token), scope, Date.now()) as { user_id: string } | undefined;
  }
  async function handle(
    req: IncomingMessage,
    res: ServerResponse,
    next: () => void,
  ) {
    if (/\/(?:\.|%2e)(?:context|data|env)(?:\/|%2f|\.|$)/i.test(req.url ?? ""))
      return json(res, { error: "Private files are not served." }, 403);
    if (!req.url?.startsWith("/api/") && req.url?.split("?")[0] !== "/mcp")
      return next();
    const host = req.headers.host ?? "",
      publicOrigin = process.env.PUBLIC_URL
        ? new URL(process.env.PUBLIC_URL).origin
        : undefined,
      frontendOrigin = process.env.FRONTEND_ORIGIN
        ? new URL(process.env.FRONTEND_ORIGIN).origin
        : undefined;
    if (
      publicOrigin
        ? host !== new URL(publicOrigin).host
        : !/^(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/.test(host)
    )
      return json(res, { error: "Unrecognized host." }, 403);
    const url = new URL(req.url, publicOrigin ?? `http://${host}`);
    const twilioSigned = url.pathname.startsWith("/api/webhooks/twilio/");
    const linqSigned = url.pathname === "/api/webhooks/linq";
    const signed = twilioSigned || linqSigned;
    if (
      !signed &&
      ((req.headers.origin &&
        req.headers.origin !== (publicOrigin ?? `http://${host}`) &&
        req.headers.origin !== `https://${host}` &&
        req.headers.origin !== frontendOrigin) ||
        req.headers["sec-fetch-site"] === "cross-site")
    )
      return json(res, { error: "Cross-site request refused." }, 403);
    try {
      if (req.method === "GET" && url.pathname === "/api/health") {
        db.sql.prepare("SELECT 1").get();
        return json(res, { ok: true });
      }
      if (linqSigned) {
        if (
          req.method !== "POST" ||
          !req.headers["content-type"]?.startsWith("application/json")
        )
          return json(res, { error: "Expected a signed JSON POST." }, 405);
        const raw = await rawBody(req, 100000);
        if (messagingProvider() !== "linq" || !verifyLinq(raw, req.headers))
          return json(res, { error: "Invalid webhook signature." }, 403);
        const event = parseLinq(raw);
        if (event) channels.acceptLinq(event);
        return json(res, { received: true });
      }
      if (twilioSigned) {
        if (
          req.method !== "POST" ||
          !req.headers["content-type"]?.startsWith(
            "application/x-www-form-urlencoded",
          )
        )
          return json(res, { error: "Expected a signed form POST." }, 405);
        const form = Object.fromEntries(
          new URLSearchParams(await rawBody(req, 50000)),
        );
        if (
          messagingProvider() !== "twilio" ||
          !validateTwilio(
            req.url,
            String(req.headers["x-twilio-signature"] ?? ""),
            form,
          )
        )
          return json(res, { error: "Invalid webhook signature." }, 403);
        if (url.pathname === "/api/webhooks/twilio/inbound")
          channels.inbound(form);
        else if (url.pathname === "/api/webhooks/twilio/status")
          channels.callback(form, url.searchParams.get("delivery") ?? "");
        else return json(res, { error: "Webhook not found." }, 404);
        res.writeHead(200, { "Content-Type": "text/xml" });
        return res.end("<Response/>");
      }
      if (url.pathname === "/mcp") {
        const token = bearer(req, "mcp");
        if (!token)
          return json(
            res,
            {
              error:
                "Use an active personal MCP bearer token from Connections.",
            },
            401,
          );
        if (req.method !== "POST") {
          res.setHeader("Allow", "POST");
          return json(res, { error: "Use stateless MCP POST." }, 405);
        }
        db.limit(`mcp:${token.user_id}`, 100);
        return await handleMCP(
          req,
          res,
          await body(req),
          token.user_id,
          service,
          calendar,
        );
      }
      if (url.pathname === "/api/webhooks/events") {
        const token = bearer(req, "webhook");
        if (!token) return json(res, { error: "Webhook token required." }, 401);
        if (req.method !== "POST")
          return json(res, { error: "Use POST." }, 405);
        db.limit(`webhook:${token.user_id}`, 20);
        const input = z
          .object({
            id: z.string().min(8).max(100),
            message: z.string().min(1).max(5000),
          })
          .strict()
          .parse(await body(req));
        const id = `webhook:${token.user_id}:${input.id}`;
        const old = db.sql
          .prepare("SELECT json FROM jobs WHERE id=?")
          .get(id) as { json: string } | undefined;
        const payload = { message: input.message };
        if (old && old.json !== JSON.stringify(payload))
          throw new Error(
            "This event ID was already used with different content.",
          );
        db.enqueue(id, token.user_id, "webhook", payload);
        return json(res, { accepted: true, id }, 202);
      }
      if (
        req.method === "POST" &&
        ["/api/auth/register", "/api/auth/login"].includes(url.pathname)
      ) {
        db.limit(
          `auth:${req.socket.remoteAddress}`,
          process.env.NODE_ENV === "test" ? 1000 : 15,
          15 * 60000,
        );
        const input = credentials.parse(await body(req));
        let user;
        if (url.pathname.endsWith("/register")) {
          if (process.env.ADLER_REGISTRATION === "closed")
            throw new Error("Registration is closed on this server.");
          if (
            db.sql
              .prepare("SELECT id FROM users WHERE username=?")
              .get(input.username.toLowerCase())
          )
            throw new Error("That username is unavailable.");
          user = db.createUser(input.username, input.password, input.timeZone);
        } else user = db.login(input.username, input.password);
        sessionCookie(res, db.session(user.id));
        return json(res, { user, ...db.snapshot(user.id) });
      }
      const user = db.authenticate(cookie(req));
      if (req.method === "GET" && url.pathname === "/api/auth")
        return json(res, {
          user: user ?? null,
          ...(user ? db.snapshot(user.id) : {}),
        });
      if (!user) return json(res, { error: "Sign in to your workspace." }, 401);
      if (req.method === "POST" && url.pathname === "/api/auth/logout") {
        db.sql
          .prepare("DELETE FROM sessions WHERE hash=?")
          .run(digest(cookie(req)));
        sessionCookie(res, "");
        db.changed(user.id);
        return json(res, { signedOut: true });
      }
      const id = user.id;
      if (req.method === "POST" && /^\/api\/proposals\/[^/]+\/preview$/.test(url.pathname))
        return json(res, service.previewPlan(id, url.pathname.split("/")[3]));
      if (
        req.method === "POST" &&
        /^\/api\/messages\/[^/]+\/reaction$/.test(url.pathname)
      ) {
        const input = z
          .object({
            reaction: z.enum(reactionTypes),
            remove: z.boolean().default(false),
          })
          .strict()
          .parse(await body(req));
        return json(
          res,
          await service.react(
            id,
            decodeURIComponent(url.pathname.split("/")[3]),
            input.reaction,
            "user",
            input.remove,
          ),
        );
      }
      if (req.method === "GET" && url.pathname === "/api/events") {
        res.writeHead(200, {
          "Content-Type": "text/event-stream",
          "Cache-Control": "private, no-store, no-transform",
          Connection: "keep-alive",
          "X-Accel-Buffering": "no",
        });
        const send = () => {
          if (!db.authenticate(cookie(req))) {
            res.end();
            return;
          }
          res.write(
            `data: ${JSON.stringify({ revision: db.snapshot(id).revision })}\n\n`,
          );
        };
        send();
        db.events.on(id, send);
        const timer = setInterval(send, 25000);
        res.on("close", () => {
          clearInterval(timer);
          db.events.off(id, send);
        });
        return;
      }
      if (req.method === "GET" && url.pathname === "/api/workspace")
        return json(res, await service.refreshPlanning(id));
      if (req.method === "GET" && url.pathname === "/api/planning/status")
        return json(res, planner.status(id));
      if (req.method === "POST" && url.pathname === "/api/workspace") {
        const input = z
          .object({
            data: z.unknown(),
            revision: z.number().int().min(0),
            requestId: z.string().min(8).max(100),
          })
          .parse(await body(req));
        return json(
          res,
          await service.update(id, input.data, input.revision, input.requestId),
        );
      }
      if (req.method === "GET" && url.pathname === "/api/status") {
        let coach = { configured: false, provider: "", model: "" };
        try {
          const config = configuration(db, id);
          coach = {
            configured: true,
            provider: config.provider,
            model: config.model,
          };
        } catch {}
        return json(res, { coach, ...calendar.status(id) });
      }
      if (req.method === "GET" && url.pathname === "/api/provider")
        return json(res, providerStatus(db, id));
      if (req.method === "POST" && url.pathname === "/api/provider") {
        const input = z
          .object({
            provider: z.enum(providerNames),
            model: z
              .string()
              .trim()
              .min(1)
              .max(100)
              .regex(/^[a-zA-Z0-9_.:/-]+$/),
            useServer: z.boolean(),
            key: z.string().trim().max(500).optional(),
            removeKey: z.boolean().optional(),
          })
          .strict()
          .parse(await body(req));
        if (input.removeKey) db.removeSecret(id, `model-${input.provider}`);
        else if (input.key)
          db.setSecret(id, `model-${input.provider}`, { key: input.key });
        db.setSecret(id, "model-choice", {
          provider: input.provider,
          model: input.model || defaults[input.provider],
          useServer: input.useServer,
        });
        return json(res, providerStatus(db, id));
      }
      if (req.method === "POST" && url.pathname === "/api/provider/test") {
        db.limit(`model-test:${id}`, 5);
        const config = configuration(db, id);
        await generate(
          config,
          "Return exactly the requested status as JSON.",
          { status: "connected" },
          z.object({ status: z.literal("connected") }).strict(),
          250,
        );
        const testedAt = new Date().toISOString();
        if (config.source === "personal")
          db.setSecret(id, `model-${config.provider}`, {
            key: config.key,
            testedAt,
          });
        return json(res, {
          connected: true,
          provider: config.provider,
          model: config.model,
          testedAt,
        });
      }
      if (req.method === "POST" && url.pathname === "/api/conversations") {
        const change = changeSchema.parse(await body(req));
        return json(res, await service.editConversation(id, change));
      }
      if (req.method === "POST" && url.pathname === "/api/coach") {
        const input = z
          .object({
            message: z.string().trim().min(1).max(5000),
            goalId: z.string().max(100).default("general"),
            conversationId: z.string().max(100).optional(),
            requestId: z.string().min(8).max(100),
          })
          .strict()
          .parse(await body(req));
        return json(
          res,
          await service.chat(
            id,
            input.message,
            input.goalId,
            "web",
            input.requestId,
            undefined,
            input.conversationId,
          ),
        );
      }
      if (req.method === "GET" && url.pathname === "/api/proposals")
        return json(res, service.listProposals(id));
      if (req.method === "POST" && url.pathname === "/api/proposals") {
        const input = z
          .object({
            changes: z.array(changeSchema).min(1).max(20),
            summary: z.string().min(1).max(1200),
          })
          .parse(await body(req));
        return json(
          res,
          await service.locked(id, () => {
            const p = service.propose(id, input.changes, input.summary, "web");
            service.changed(id);
            return p;
          }),
        );
      }
      if (
        req.method === "POST" &&
        /^\/api\/proposals\/[^/]+\/(approve|dismiss)$/.test(url.pathname)
      ) {
        const [, , , proposalId, action] = url.pathname.split("/");
        if (action === "approve")
          return json(res, await service.approve(id, proposalId, "web"));
        await service.reject(id, proposalId);
        return json(res, { dismissed: true });
      }
      if (req.method === "GET" && url.pathname === "/api/connections")
        return json(res, {
          ...channels.status(id),
          publicUrl: process.env.PUBLIC_URL ?? null,
          tokens: db.sql
            .prepare("SELECT id,name,scope,expires FROM tokens WHERE user_id=?")
            .all(id),
        });
      if (req.method === "POST" && url.pathname === "/api/connections/pair") {
        const input = z
          .object({ address: z.string().max(50) })
          .parse(await body(req));
        return json(res, channels.pair(id, input.address, "sms"));
      }
      if (req.method === "POST" && url.pathname === "/api/connections/unlink") {
        channels.unlink(id);
        return json(res, { unlinked: true });
      }
      if (req.method === "POST" && url.pathname === "/api/tokens") {
        db.limit(`token:${id}`, 10);
        const input = z
          .object({
            name: z.string().trim().min(1).max(100),
            scope: z.enum(["mcp", "webhook"]),
            days: z.number().int().min(1).max(365),
          })
          .parse(await body(req));
        const token = randomBytes(32).toString("base64url"),
          tokenId = randomUUID(),
          expires = Date.now() + input.days * 86400000;
        db.sql
          .prepare("INSERT INTO tokens VALUES(?,?,?,?,?,?)")
          .run(digest(token), tokenId, id, input.name, input.scope, expires);
        return json(res, { id: tokenId, token, expires });
      }
      if (req.method === "POST" && url.pathname === "/api/tokens/revoke") {
        const input = z.object({ id: z.string() }).parse(await body(req));
        db.sql
          .prepare("DELETE FROM tokens WHERE id=? AND user_id=?")
          .run(input.id, id);
        return json(res, { revoked: true });
      }
      if (
        ["/api/calendars", "/api/availability", "/api/bookings"].includes(
          url.pathname,
        ) ||
        url.pathname.startsWith("/api/calendar/")
      )
        return await calendar.handle(
          req,
          res,
          url,
          id,
          req.method === "POST" ? await body(req) : undefined,
        );
      return json(res, { error: "API route not found." }, 404);
    } catch (error) {
      const message =
        error instanceof z.ZodError
          ? error.issues
              .map((i) => `${i.path.join(".")}: ${i.message}`)
              .join(" ")
          : error instanceof Error
            ? error.message
            : "The request could not complete.";
      if (res.headersSent) {
        res.end();
        return;
      }
      if (url.pathname.endsWith("/callback")) {
        res.writeHead(302, {
          Location: `/app/calendar?error=${encodeURIComponent(message)}`,
        });
        return res.end();
      }
      return json(
        res,
        { error: message },
        (error as { status?: number })?.status ?? 400,
      );
    }
  }
  return {
    db,
    service,
    channels,
    calendar,
    planner,
    handle,
    start: () => { channels.start(); if (process.env.NODE_ENV !== "test") planner.start(); },
    close: () => {
      channels.stop();
      planner.stop();
      db.close();
    },
  };
}
export function adlerApi(): Plugin {
  let runtime: ReturnType<typeof createRuntime> | undefined;
  return {
    name: "adler-server",
    configureServer(server) {
      runtime = createRuntime();
      runtime.start();
      server.middlewares.use((req, res, next) => {
        void runtime!.handle(req, res, next);
      });
      server.httpServer?.once("close", () => runtime?.close());
    },
    configurePreviewServer(server) {
      runtime = createRuntime();
      runtime.start();
      server.middlewares.use((req, res, next) => {
        void runtime!.handle(req, res, next);
      });
      server.httpServer.once("close", () => runtime?.close());
    },
  };
}
