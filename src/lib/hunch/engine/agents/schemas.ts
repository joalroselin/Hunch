import { z } from "zod";

// Zod schemas for every agent's output. Shapes only; each agent checks the counts and rules in code.

export const ChannelSchema = z.enum(["shopee", "facebook", "instagram", "tiktok", "offline"]);
export const MotiveSchema = z.enum(["self_use", "gifting", "sharing", "resale_bulk", "occasion"]);

export const CandidateSchema = z.object({
  label: z.string().describe("Max 6 words, sentence case"),
  who: z.string().describe("One sentence naming a concrete situation"),
  buyingMoment: z.string(),
  angle: z.string(),
  motive: MotiveSchema,
  bestChannel: ChannelSchema,
  whereTheyAre: z.array(z.string()),
  tone: z.string(),
});
export const StrategistSchema = z.object({ candidates: z.array(CandidateSchema) });

export const CutCategorySchema = z.enum(["stereotype", "duplicate", "too_broad", "implausible", "off_channel"]);
export const SkepticSchema = z.object({
  kept: z.array(z.object({ id: z.string(), reason: z.string() })),
  cuts: z.array(z.object({ id: z.string(), category: CutCategorySchema, reason: z.string() })),
});

export const LangCopySchema = z.object({
  hook: z.string().describe("First line, max 90 characters"),
  slides: z.array(z.string()).describe("1 to 3 short lines; the first is the hook"),
  caption: z.string().describe("Hook plus caption max 600 characters"),
  cta: z.string(),
});
export const CopywriterSchema = z.object({
  taglish: LangCopySchema,
  english: LangCopySchema,
  tagalog: LangCopySchema,
  hashtags: z.array(z.string()),
  style: z.enum(["bold", "soft", "note"]),
});

export const IssueTypeSchema = z.enum(["cringe", "stereotype", "ad_policy", "language", "claim"]);
export const ReviewerSchema = z.object({
  decision: z.enum(["approve", "revise"]),
  issues: z.array(
    z.object({
      type: IssueTypeSchema,
      quote: z.string(),
      note: z.string(),
      language: z.enum(["taglish", "english", "tagalog"]).optional(),
    }),
  ),
});

export const AnalystSchema = z.object({ explanation: z.string(), caveats: z.array(z.string()) });

export const PlannerSchema = z.object({
  days: z.array(z.object({ day: z.number().int(), purpose: z.enum(["winner", "runner_up_test"]), theme: z.string() })),
});

export type StrategistOut = z.infer<typeof StrategistSchema>;
export type SkepticOut = z.infer<typeof SkepticSchema>;
export type CopywriterOut = z.infer<typeof CopywriterSchema>;
export type ReviewerOut = z.infer<typeof ReviewerSchema>;
export type AnalystOut = z.infer<typeof AnalystSchema>;
export type PlannerOut = z.infer<typeof PlannerSchema>;
