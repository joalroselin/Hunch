import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import type { z } from "zod";

// One model for every agent; swap it with MODEL_ID. Opus 5.5 takes no temperature, so agents tune effort instead.
export const MODEL = process.env.MODEL_ID?.trim() || "claude-opus-5-5";

let client: Anthropic | null = null;
function getClient() {
  if (!client) client = new Anthropic({ maxRetries: 1, timeout: 180_000 });
  return client;
}

export type AskResult<T> = { ok: true; data: T } | { ok: false; reason: string; retryable?: boolean };
export type Effort = "low" | "medium" | "high";

export type ImageInput = { mediaType: "image/jpeg" | "image/png" | "image/webp" | "image/gif"; data: string };

export function parseDataUrl(url?: string): ImageInput | undefined {
  const m = url?.match(/^data:(image\/(?:jpeg|png|webp|gif));base64,(.+)$/);
  if (!m) return undefined;
  return { mediaType: m[1] as ImageInput["mediaType"], data: m[2] };
}

export async function askClaude<S extends z.ZodType>(opts: {
  schema: S;
  system: string;
  prompt: string;
  effort: Effort;
  image?: ImageInput;
}): Promise<AskResult<z.infer<S>>> {
  const content: Anthropic.Beta.BetaContentBlockParam[] = [];
  if (opts.image) {
    content.push({ type: "image", source: { type: "base64", media_type: opts.image.mediaType, data: opts.image.data } });
  }
  content.push({ type: "text", text: opts.prompt });

  try {
    const res = await getClient().beta.messages.parse({
      model: MODEL,
      max_tokens: 16000,
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      output_config: { effort: opts.effort, format: betaZodOutputFormat(opts.schema) },
      system: opts.system,
      messages: [{ role: "user", content }],
    });
    if (res.stop_reason === "refusal") return { ok: false, reason: "Claude declined this step." };
    if (res.stop_reason === "max_tokens") return { ok: false, reason: "The reply was cut off.", retryable: true };
    if (res.parsed_output == null) return { ok: false, reason: "The reply could not be read.", retryable: true };
    return { ok: true, data: res.parsed_output as z.infer<S> };
  } catch (e) {
    if (e instanceof Anthropic.AuthenticationError) return { ok: false, reason: "The API key did not work." };
    if (e instanceof Anthropic.RateLimitError) return { ok: false, reason: "Claude is busy right now.", retryable: true };
    if (e instanceof Anthropic.APIConnectionError) return { ok: false, reason: "Could not reach Claude.", retryable: true };
    if (e instanceof Anthropic.APIError) return { ok: false, reason: `Claude returned an error (${e.status ?? "unknown"}).`, retryable: (e.status ?? 500) >= 500 };
    return { ok: false, reason: "Something went wrong with Claude.", retryable: true };
  }
}
