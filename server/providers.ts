import { z } from "zod";
import type { Database } from "./database.ts";
export const providerNames = ["gemini", "openai", "anthropic"] as const;
export type Provider = (typeof providerNames)[number];
export const defaults: Record<Provider, string> = {
  gemini: "gemini-3.8-flash",
  openai: "gpt-5.6-luna",
  anthropic: "claude-sonnet-5",
};
export interface ModelConfig {
  provider: Provider;
  model: string;
  key: string;
  source: "personal" | "server";
  testedAt?: string;
}
const environmentKey = (provider: Provider) =>
  process.env[
    `${provider === "openai" ? "OPENAI" : provider === "gemini" ? "GEMINI" : "ANTHROPIC"}_API_KEY`
  ];
export const serverKeysAllowed = () =>
  process.env.ADLER_ALLOW_SERVER_KEYS === "true" ||
  (process.env.NODE_ENV !== "production" && !process.env.PUBLIC_URL);
export function configuration(db: Database, userId: string): ModelConfig {
  const choice = db.secret<{
    provider: Provider;
    model: string;
    useServer: boolean;
  }>(userId, "model-choice") ?? {
    provider: "gemini" as const,
    model: defaults.gemini,
    useServer: true,
  };
  const personal = db.secret<{ key: string; testedAt?: string }>(
    userId,
    `model-${choice.provider}`,
  );
  const key = choice.useServer
    ? serverKeysAllowed()
      ? environmentKey(choice.provider)
      : undefined
    : personal?.key;
  if (!key)
    throw new Error(
      "Choose a provider and add an API key in Settings → AI provider.",
    );
  return {
    provider: choice.provider,
    model: choice.model,
    key,
    source: choice.useServer ? "server" : "personal",
    testedAt: personal?.testedAt,
  };
}
export function providerStatus(db: Database, userId: string) {
  const choice = db.secret<{
    provider: Provider;
    model: string;
    useServer: boolean;
  }>(userId, "model-choice") ?? {
    provider: "gemini",
    model: defaults.gemini,
    useServer: true,
  };
  return {
    selected: choice,
    providers: providerNames.map((provider) => {
      const saved = db.secret<{ key: string; testedAt?: string }>(
        userId,
        `model-${provider}`,
      );
      return {
        provider,
        defaultModel: defaults[provider],
        personalConfigured: Boolean(saved?.key),
        serverAvailable:
          serverKeysAllowed() && Boolean(environmentKey(provider)),
        testedAt: saved?.testedAt ?? null,
      };
    }),
  };
}
function jsonSchema(schema: z.ZodType) {
  const clean = (v: unknown): unknown =>
    Array.isArray(v)
      ? v.map(clean)
      : v && typeof v === "object"
        ? Object.fromEntries(
            Object.entries(v)
              .filter(
                ([k]) =>
                  ![
                    "$schema",
                    "default",
                    "minLength",
                    "maxLength",
                    "minimum",
                    "maximum",
                    "maxItems",
                    "minItems",
                    "format",
                  ].includes(k),
              )
              .map(([k, value]) => [k, clean(value)]),
          )
        : v;
  return clean(z.toJSONSchema(schema)) as Record<string, unknown>;
}
function providerError(
  provider: Provider,
  status: number,
  code: string,
  message: string,
) {
  if (
    /credit|billing|balance|insufficient_quota|spend_limit|quota_exceeded/i.test(
      `${code} ${message}`,
    )
  )
    return `${provider}: the account needs available API credits or billing quota. Check the provider’s API billing settings.`;
  if (
    status === 401 ||
    /authentication|api.key.not.valid/i.test(`${code} ${message}`)
  )
    return `${provider}: the API key was rejected. Replace it in AI provider settings.`;
  if (status === 404 || /model_not_found/i.test(code))
    return `${provider}: this model is unavailable to the account. Check the selected model name.`;
  if (status === 429)
    return `${provider}: rate limit reached. Wait before trying again.`;
  if (status === 403)
    return `${provider}: this account does not have access to the selected model or API.`;
  return `${provider}: the request could not complete (${status}). Check the model and account configuration.`;
}
export async function generate<T>(
  config: ModelConfig,
  instructions: string,
  context: unknown,
  validator: z.ZodType<T>,
  maxTokens = 3200,
): Promise<T> {
  const schema = jsonSchema(validator);
  const input = JSON.stringify(context);
  let url: string;
  let headers: Record<string, string>;
  let body: unknown;
  if (config.provider === "openai") {
    url = "https://api.openai.com/v1/responses";
    headers = { Authorization: `Bearer ${config.key}` };
    body = {
      model: config.model,
      instructions,
      input,
      store: false,
      max_output_tokens: maxTokens,
      reasoning: { effort: "low" },
      text: {
        format: {
          type: "json_schema",
          name: "adler_response",
          strict: true,
          schema,
        },
      },
    };
  } else if (config.provider === "gemini") {
    url = "https://generativelanguage.googleapis.com/v1beta/interactions";
    headers = { "x-goog-api-key": config.key };
    body = {
      model: config.model,
      input,
      system_instruction: instructions,
      store: false,
      generation_config: {
        max_output_tokens: maxTokens,
        thinking_level: "low",
        thinking_summaries: "none",
      },
      response_format: { type: "text", mime_type: "application/json", schema },
    };
  } else {
    url = "https://api.anthropic.com/v1/messages";
    headers = { "x-api-key": config.key, "anthropic-version": "2023-06-01" };
    body = {
      model: config.model,
      max_tokens: maxTokens,
      system: instructions,
      messages: [{ role: "user", content: input }],
      output_config: { format: { type: "json_schema", schema } },
    };
  }
  const response = await fetch(url, {
    method: "POST",
    headers: { ...headers, "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(60000),
  });
  const result = await response.json();
  if (!response.ok)
    throw new Error(
      providerError(
        config.provider,
        response.status,
        String(result.error?.code ?? result.error?.type ?? ""),
        String(result.error?.message ?? ""),
      ),
    );
  let text = "";
  if (config.provider === "openai") {
    if (result.status !== "completed")
      throw new Error(
        "The model response was incomplete. Nothing was changed.",
      );
    text = (result.output ?? [])
      .filter((x: { type: string }) => x.type === "message")
      .flatMap((x: { content: unknown[] }) => x.content)
      .filter((x: { type: string }) => x.type === "output_text")
      .map((x: { text: string }) => x.text)
      .join("");
  } else if (config.provider === "gemini") {
    if (result.status !== "completed")
      throw new Error(
        "The model response was incomplete. Nothing was changed.",
      );
    text = (result.steps ?? [])
      .filter((x: { type: string }) => x.type === "model_output")
      .flatMap((x: { content: unknown[] }) => x.content)
      .filter((x: { type: string }) => x.type === "text")
      .map((x: { text: string }) => x.text)
      .join("");
  } else {
    if (result.stop_reason !== "end_turn")
      throw new Error(
        "The model response was incomplete or declined. Nothing was changed.",
      );
    text = (result.content ?? [])
      .filter((x: { type: string }) => x.type === "text")
      .map((x: { text: string }) => x.text)
      .join("");
  }
  if (!text)
    throw new Error(
      "The provider returned no usable response. Nothing was changed.",
    );
  try {
    return validator.parse(JSON.parse(text));
  } catch {
    throw new Error(
      "The provider returned an invalid response. Nothing was changed. Please retry.",
    );
  }
}
