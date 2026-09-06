import { createHmac, timingSafeEqual } from "node:crypto";
import type { IncomingHttpHeaders } from "node:http";
import { z } from "zod";
import { reactionTypes } from "../shared/workspace.ts";

const protocol = z.enum(["iMessage", "RCS", "SMS"]);
const id = z.string().min(1).max(100);
const phone = z.string().regex(/^\+[1-9]\d{7,14}$/);
const handle = z.object({ handle: phone, is_me: z.boolean() });
const message = z.object({
  id,
  chat: z.object({ id, is_group: z.boolean(), owner_handle: handle }),
  direction: z.enum(["inbound", "outbound"]),
  sender_handle: handle,
  parts: z
    .array(z.object({ type: z.string(), value: z.string().optional() }))
    .max(50),
  service: protocol,
  idempotency_key: z.string().max(255).nullish(),
  sent_at: z.string().nullish(),
  delivered_at: z.string().nullish(),
  read_at: z.string().nullish(),
});
export type LinqEvent =
  | {
      kind: "message";
      eventId: string;
      messageId: string;
      chatId: string;
      from: string;
      to: string;
      text: string;
      service: "iMessage" | "RCS" | "SMS";
    }
  | {
      kind: "reaction";
      eventId: string;
      messageId: string;
      chatId: string;
      from: string;
      own: boolean;
      reaction: (typeof reactionTypes)[number];
      remove: boolean;
      at: string;
    }
  | {
      kind: "status";
      eventId: string;
      messageId: string;
      chatId: string;
      status: string;
      deliveryId?: string;
      service?: string;
      error?: string;
    };

export function verifyLinq(raw: string, headers: IncomingHttpHeaders) {
  const secret = process.env.LINQ_WEBHOOK_SECRET;
  const eventId = headers["webhook-id"],
    timestamp = headers["webhook-timestamp"],
    signatures = headers["webhook-signature"];
  if (
    !secret ||
    typeof eventId !== "string" ||
    typeof timestamp !== "string" ||
    typeof signatures !== "string" ||
    !/^\d+$/.test(timestamp) ||
    Math.abs(Date.now() / 1000 - Number(timestamp)) > 300
  )
    return false;
  const key = Buffer.from(secret.replace(/^whsec_/, ""), "base64");
  if (key.length < 16) return false;
  const expected = createHmac("sha256", key)
    .update(`${eventId}.${timestamp}.${raw}`)
    .digest();
  return signatures.split(/\s+/).some((value) => {
    if (!value.startsWith("v1,")) return false;
    const supplied = Buffer.from(value.slice(3), "base64");
    return (
      supplied.length === expected.length && timingSafeEqual(supplied, expected)
    );
  });
}

// Pinned Linq webhook contract: https://docs.linqapp.com/channel/imessage/guides/webhooks/events/
export function parseLinq(raw: string): LinqEvent | null {
  const event = z
    .object({
      webhook_version: z.literal("2026-02-03"),
      event_type: z.string(),
      event_id: id,
      data: z.unknown(),
    })
    .parse(JSON.parse(raw));
  const common = { eventId: event.event_id };
  if (
    [
      "message.received",
      "message.sent",
      "message.delivered",
      "message.read",
    ].includes(event.event_type)
  ) {
    const data = message.parse(event.data);
    if (
      data.chat.is_group ||
      data.chat.owner_handle.handle !== process.env.LINQ_NUMBER ||
      !data.chat.owner_handle.is_me
    )
      return null;
    if (event.event_type === "message.received") {
      if (data.direction !== "inbound" || data.sender_handle.is_me) return null;
      const text = data.parts
        .filter((p) => p.type === "text")
        .map((p) => p.value ?? "")
        .join("\n")
        .trim();
      if (!text) return null;
      return {
        ...common,
        kind: "message",
        messageId: data.id,
        chatId: data.chat.id,
        from: data.sender_handle.handle,
        to: data.chat.owner_handle.handle,
        text,
        service: data.service,
      };
    }
    if (
      data.direction !== "outbound" ||
      !data.sender_handle.is_me ||
      data.sender_handle.handle !== process.env.LINQ_NUMBER
    )
      return null;
    return {
      ...common,
      kind: "status",
      messageId: data.id,
      chatId: data.chat.id,
      status: event.event_type.slice(8),
      deliveryId: data.idempotency_key ?? undefined,
      service: data.service,
    };
  }
  if (event.event_type === "message.failed") {
    const data = z
      .object({
        chat_id: id,
        message_id: id,
        code: z.number(),
        detail_code: z.number().nullish(),
      })
      .parse(event.data);
    return {
      ...common,
      kind: "status",
      chatId: data.chat_id,
      messageId: data.message_id,
      status: "failed",
      error: `Linq error ${data.code}${data.detail_code ? `/${data.detail_code}` : ""}`,
    };
  }
  if (["reaction.added", "reaction.removed"].includes(event.event_type)) {
    const data = z
      .object({
        chat_id: id,
        message_id: id,
        part_index: z.number().int(),
        reaction_type: z.string(),
        from: phone,
        is_from_me: z.boolean(),
        reacted_at: z.iso.datetime({ offset: true }),
      })
      .parse(event.data);
    if (
      data.part_index !== 0 ||
      !reactionTypes.includes(
        data.reaction_type as (typeof reactionTypes)[number],
      )
    )
      return null;
    return {
      ...common,
      kind: "reaction",
      chatId: data.chat_id,
      messageId: data.message_id,
      from: data.from,
      own: data.is_from_me,
      reaction: data.reaction_type as (typeof reactionTypes)[number],
      remove: event.event_type === "reaction.removed",
      at: data.reacted_at,
    };
  }
  return null;
}

async function request(path: string, body: unknown) {
  const response = await fetch(
    `https://api.linqapp.com/api/partner/v3${path}`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.LINQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(15000),
    },
  );
  if (!response.ok)
    throw Object.assign(
      new Error(`Linq request failed (${response.status}).`),
      { status: response.status },
    );
  return response;
}
export async function sendLinq(
  chatId: string,
  text: string,
  deliveryId: string,
) {
  const response = await request(
    `/chats/${encodeURIComponent(chatId)}/messages`,
    {
      message: {
        parts: [{ type: "text", value: text }],
        idempotency_key: deliveryId,
      },
    },
  );
  const result = z
    .object({ message: z.object({ id, service: protocol.optional() }) })
    .parse(await response.json());
  return {
    sid: result.message.id,
    status: "accepted",
    service: result.message.service,
  };
}
export async function reactLinq(
  messageId: string,
  reaction: (typeof reactionTypes)[number],
  remove = false,
) {
  await request(`/messages/${encodeURIComponent(messageId)}/reactions`, {
    operation: remove ? "remove" : "add",
    type: reaction,
    part_index: 0,
  });
}
