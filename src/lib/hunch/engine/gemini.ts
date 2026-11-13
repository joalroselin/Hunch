import { z } from "zod";

import type { AskResult, Effort, ImageInput } from "./claude";

// Gemini, for a deployment with a Google AI Studio key instead of an Anthropic one. Same contract as askClaude.
// Flash models get busy (503) or briefly go missing (404) under load, so a call moves down this list.
const MODELS = process.env.GEMINI_MODEL?.trim() ? [process.env.GEMINI_MODEL.trim()] : ["gemini-3.5-flash", "gemini-3.5-flash-lite", "gemini-3.8-flash", "gemini-flash-latest"];
const BUSY = new Set([404, 429, 500, 503, 504]);

export const hasGemini = () => !!process.env.GEMINI_API_KEY?.trim();

type Reply = {
  candidates?: { finishReason?: string; content?: { parts?: { text?: string; thought?: boolean }[] } }[];
  promptFeedback?: { blockReason?: string };
};

function schemaOf(schema: z.ZodType): Record<string, unknown> {
  const out = { ...(z.toJSONSchema(schema) as Record<string, unknown>) };
  delete out.$schema;
  return out;
}

async function post(model: string, body: unknown): Promise<Response | null> {
  try {
    return await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
      method: "POST",
      headers: { "content-type": "application/json", "x-goog-api-key": process.env.GEMINI_API_KEY?.trim() ?? "" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(60_000),
    });
  } catch {
    return null;
  }
}

// Tries each model in turn while the answer is busy, missing or timed out.
async function call(body: unknown): Promise<Response | null> {
  let last: Response | null = null;
  for (let i = 0; i < MODELS.length; i++) {
    last = await post(MODELS[i], body);
    if (last && !BUSY.has(last.status)) return last;
    await new Promise((r) => setTimeout(r, 400 * (i + 1)));
  }
  return last;
}

export async function askGemini<S extends z.ZodType>(opts: {
  schema: S;
  system: string;
  prompt: string;
  effort: Effort;
  image?: ImageInput;
}): Promise<AskResult<z.infer<S>>> {
  const parts: unknown[] = [];
  if (opts.image) parts.push({ inlineData: { mimeType: opts.image.mediaType, data: opts.image.data } });
  parts.push({ text: opts.prompt });
  const schema = schemaOf(opts.schema);
  const config = { responseMimeType: "application/json", maxOutputTokens: 16000 };

  let res = await call({
    systemInstruction: { parts: [{ text: opts.system }] },
    contents: [{ role: "user", parts }],
    generationConfig: { ...config, responseJsonSchema: schema },
  });
  // A schema the API will not take: ask for the same JSON in words instead.
  if (res?.status === 400 && /schema/i.test(await res.clone().text())) {
    res = await call({
      systemInstruction: { parts: [{ text: `${opts.system}\n\nReply with JSON only, matching this JSON Schema:\n${JSON.stringify(schema)}` }] },
      contents: [{ role: "user", parts }],
      generationConfig: config,
    });
  }
  if (!res) return { ok: false, reason: "Could not reach the model.", retryable: true };
  if (res.status === 401 || res.status === 403) return { ok: false, reason: "The API key did not work." };
  if (res.status === 429) return { ok: false, reason: "The model is busy right now.", retryable: true };
  if (!res.ok) return { ok: false, reason: `The model returned an error (${res.status}).`, retryable: res.status >= 500 };

  const data = (await res.json().catch(() => null)) as Reply | null;
  const c = data?.candidates?.[0];
  if (!c) return data?.promptFeedback?.blockReason ? { ok: false, reason: "The model declined this step." } : { ok: false, reason: "The reply could not be read.", retryable: true };
  if (c.finishReason === "MAX_TOKENS") return { ok: false, reason: "The reply was cut off.", retryable: true };
  if (c.finishReason && c.finishReason !== "STOP") return { ok: false, reason: "The model declined this step." };

  const text = (c.content?.parts ?? [])
    .filter((p) => !p.thought)
    .map((p) => p.text ?? "")
    .join("")
    .replace(/^```(?:json)?\s*|\s*```$/g, "");
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    return { ok: false, reason: "The reply could not be read.", retryable: true };
  }
  const parsed = opts.schema.safeParse(raw);
  if (!parsed.success) return { ok: false, reason: "The reply could not be read.", retryable: true };
  return { ok: true, data: parsed.data as z.infer<S> };
}
