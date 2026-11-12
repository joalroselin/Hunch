import { channelsOf, normalizeLanguage } from "../language";
import { normalizeRun } from "../normalize";
import type { ProductInput, TestRun } from "../types";

export function bad(message: string, status = 400, extra: Record<string, unknown> = {}) {
  return Response.json({ type: "error", message, ...extra }, { status });
}

export async function readJson<T>(req: Request): Promise<T | null> {
  try {
    return (await req.json()) as T;
  } catch {
    return null;
  }
}

export function isRun(x: unknown): x is TestRun {
  const r = x as TestRun | undefined;
  return !!r && typeof r.id === "string" && Array.isArray(r.versions) && r.versions.length > 0 && Array.isArray(r.chosen) && !!r.product;
}

// Accepts runs saved by older versions (H codes, "filipino").
export function runFrom(x: unknown): TestRun | null {
  return isRun(x) ? normalizeRun(x) : null;
}

const str = (x: unknown, max: number) => (typeof x === "string" ? x.trim().slice(0, max) : "");

export function productFrom(body: Partial<ProductInput> | null): ProductInput | null {
  if (!body) return null;
  const name = str(body.name, 80);
  const description = str(body.description, 280);
  if (!name && !description) return null;
  const whereSold = str(body.whereSold, 120) || undefined;
  const channels = Array.isArray(body.channels) ? body.channels.filter((c) => ["shopee", "facebook", "instagram", "tiktok", "offline"].includes(c)) : undefined;
  return {
    name: name || description.split(/[,.]/)[0].slice(0, 80),
    description: description || name,
    price: str(body.price, 60) || undefined,
    whereSold,
    goal: str(body.goal, 200) || undefined,
    language: normalizeLanguage(body.language),
    channels: channelsOf({ channels, whereSold }),
    photo: typeof body.photo === "string" && body.photo.length < 600_000 ? body.photo : undefined,
  };
}
