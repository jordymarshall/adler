import type { IncomingMessage, ServerResponse } from "node:http";
export async function rawBody(req: IncomingMessage, limit = 2_000_000) {
  let result = "";
  for await (const chunk of req) {
    result += chunk;
    if (Buffer.byteLength(result) > limit)
      throw new Error("This request is too large.");
  }
  return result;
}
export async function body(req: IncomingMessage) {
  if (!req.headers["content-type"]?.startsWith("application/json"))
    throw new Error("Expected JSON.");
  return JSON.parse((await rawBody(req)) || "{}");
}
export function json(res: ServerResponse, value: unknown, status = 200) {
  res.writeHead(status, {
    "Content-Type": "application/json",
    "Cache-Control": "private, no-store",
  });
  res.end(JSON.stringify(value));
}
