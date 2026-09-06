import type { IncomingMessage, ServerResponse } from "node:http";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { z } from "zod";
import { Service } from "./service.ts";
import { changeSchema, commandCatalog } from "./commands.ts";
import { reactionTypes } from "../shared/workspace.ts";
import type { CalendarAPI } from "./calendar-api.ts";
export async function handleMCP(
  req: IncomingMessage,
  res: ServerResponse,
  input: unknown,
  userId: string,
  service: Service,
  calendar: CalendarAPI,
) {
  const server = new McpServer({ name: "adler", version: "0.2.0" });
  const tool = (
    name: string,
    description: string,
    inputSchema: Record<string, z.ZodType>,
    readOnly: boolean,
    fn: (args: any) => unknown,
  ) =>
    server.registerTool(
      name,
      {
        description,
        inputSchema,
        annotations: {
          readOnlyHint: readOnly,
          destructiveHint: !readOnly,
          idempotentHint: readOnly,
          openWorldHint: false,
        },
      },
      async (args) => {
        try {
          const value = await fn(args);
          return {
            content: [{ type: "text" as const, text: JSON.stringify(value) }],
          };
        } catch (error) {
          return {
            isError: true,
            content: [
              {
                type: "text" as const,
                text:
                  error instanceof Error
                    ? error.message
                    : "The operation failed.",
              },
            ],
          };
        }
      },
    );
  tool(
    "get_workspace",
    "Read your goals, program, records, conversation, reviews, and pending proposals.",
    {},
    true,
    () => ({
      ...service.db.snapshot(userId),
      proposals: service.listProposals(userId),
    }),
  );
  tool(
    "get_command_catalog",
    "Read the validated fields for every editable workspace feature. Never send credentials through these tools.",
    {},
    true,
    () => commandCatalog,
  );
  tool(
    "propose_changes",
    "Prepare explicit record edits requested by the user. For goal setup or coaching, call coach_message so Adler uses its shared program and methodology. Does not apply changes. Show the complete proposal and obtain user confirmation before calling apply_proposal.",
    {
      changes: z.array(changeSchema).min(1).max(20),
      summary: z.string().min(1).max(1200),
    },
    false,
    (args) =>
      service.locked(userId, () => {
        const proposal = service.propose(
          userId,
          args.changes,
          args.summary,
          "mcp",
        );
        service.changed(userId);
        return proposal;
      }),
  );
  tool(
    "apply_proposal",
    "Apply a previously reviewed proposal only after the user explicitly confirms its changes. Rejects stale proposals.",
    { id: z.string().min(1).max(50), confirmed: z.literal(true) },
    false,
    (args) => service.approve(userId, args.id, "mcp"),
  );
  tool(
    "dismiss_proposal",
    "Dismiss a proposal at the user’s request.",
    { id: z.string().min(1).max(50) },
    false,
    (args) => service.reject(userId, args.id, "mcp"),
  );
  tool(
    "coach_message",
    "Route goal setup and all coaching conversations to the same Adler agent used by web chat and texting. It loads the user's current program, goals, memory, conversation, and calendar context, using their configured model and API credits. Relay its response instead of inventing a separate coaching method. Explicit creation and edits are saved; recommendations, deletions and external bookings return a reviewable proposal.",
    {
      message: z.string().min(1).max(5000),
      goalId: z.string().default("general"),
      conversationId: z.string().max(100).optional(),
      requestId: z.string().min(8).max(100),
    },
    false,
    (args) =>
      service.chat(
        userId,
        args.message,
        args.goalId,
        "mcp",
        args.requestId,
        undefined,
        args.conversationId,
      ),
  );
  tool(
    "react_to_message",
    "Add or remove Adler's reaction to a user message. Reactions are feedback; they never record goal progress or approve proposals. A reaction to a linked iMessage is also queued for native delivery.",
    {
      messageId: z.string().min(1).max(100),
      reaction: z.enum(reactionTypes),
      remove: z.boolean().default(false),
    },
    false,
    (args) =>
      service.react(
        userId,
        args.messageId,
        args.reaction,
        "coach",
        args.remove,
      ),
  );
  tool(
    "connected_calendars",
    "Read connected calendar identifiers and checked availability for the next seven days, for an approved workBlock booking proposal.",
    {},
    true,
    () => service.locked(userId, () => calendar.context(userId)),
  );
  tool(
    "calendar_availability",
    "Read free/busy times from an already connected calendar. No event titles or credentials are returned.",
    {
      provider: z.enum(["google", "apple"]),
      calendarIds: z.array(z.string()).min(1).max(30),
      start: z.iso.datetime({ offset: true }),
      end: z.iso.datetime({ offset: true }),
    },
    true,
    (args) =>
      service.locked(userId, () => calendar.readAvailability(userId, args)),
  );
  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
    enableJsonResponse: true,
  });
  res.on("close", () => {
    void transport.close();
    void server.close();
  });
  await server.connect(transport);
  await transport.handleRequest(req, res, input);
}
