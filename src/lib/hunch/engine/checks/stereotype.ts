import { z } from "zod";
import type { Audience, CheckResult } from "../../types";
import { askClaude } from "../claude";

const SLANG = [
  "lodi", "petmalu", "werpa", "sana all", "charot", "chz", "char", "beshie", "besh", "mumshie", "mars", "pars",
  "keri", "bongga", "lit", "periodt", "slay", "sheesh", "yarn", "awit", "sanaol", "nakakaloka", "omsim", "jowa",
  "ganern", "edi wow", "lodicakes", "petmalung",
];

const CLICHES = [
  /\blaging (?:gutom|puyat|broke|walang pera|pagod)\b/i,
  /\bwalang pera\b/i,
  /\b(?:typical|classic) (?:pinoy|filipino|tita|nanay|estudyante|student)\b/i,
  /\bbilang (?:isang )?(?:nanay|ina|estudyante|ofw)\b/i,
  /\bmga (?:nanay|estudyante|ofw|bakla) talaga\b/i,
];

export function heuristicCritic(text: string): CheckResult {
  const lower = ` ${text.toLowerCase().replace(/[^\p{L}\s']/gu, " ")} `;
  const slangHits = SLANG.filter((w) => lower.includes(` ${w} `));
  if (slangHits.length >= 3) {
    return {
      kind: "stereotype",
      passed: false,
      rule: "Slang overload",
      note: `Too much slang (${slangHits.slice(0, 3).join(", ")}). It reads like a parody of how people talk, not like a real seller.`,
    };
  }
  const cliche = CLICHES.find((re) => re.test(text));
  if (cliche) {
    return {
      kind: "stereotype",
      passed: false,
      rule: "Identity as the joke",
      note: `The joke is about the people ("${text.match(cliche)?.[0]}"), not about the product.`,
    };
  }
  return { kind: "stereotype", passed: true, rule: "Stereotype check", note: "Talks about the moment and the product, not about who people are." };
}

const Verdict = z.object({
  passed: z.boolean(),
  reason: z.string().describe("One plain sentence, under 25 words, no em dashes."),
  rule: z.enum(["Identity as the hook", "Cliche", "Slang overload", "Not about the product", "Fine"]),
});

const RUBRIC = `You review social media posts written by small Filipino sellers for one audience each.
Fail the post if any of these is true:
1. Identity as the hook: the post leans on who the audience is (their job, age, gender, family role, region, money) as the joke or the pitch, instead of a moment they are in.
2. Cliche: tired jokes about the group, like broke students, tired moms, drunk barkada, homesick OFWs crying.
3. Slang overload: more than one or two trendy slang words, or slang that reads like a parody of how Filipinos talk.
4. Not about the product: the product is missing or is an afterthought.
Pass posts that speak to a real moment in plain Taglish or English and are clearly about the product.
Give one short plain reason. Never use em dashes.`;

export async function liveCritic(
  draft: { hook: string; slides: string[]; caption: string },
  audience: Pick<Audience, "name" | "who">,
  productName: string,
): Promise<CheckResult> {
  const res = await askClaude({
    schema: Verdict,
    effort: "low",
    system: RUBRIC,
    prompt: `Product: ${productName}\nAudience: ${audience.name}. ${audience.who}\n\nHook: ${draft.hook}\nSlides:\n${draft.slides.join("\n")}\nCaption:\n${draft.caption}`,
  });
  if (!res.ok) return heuristicCritic([draft.hook, ...draft.slides, draft.caption].join("\n"));
  return {
    kind: "stereotype",
    passed: res.data.passed,
    rule: res.data.passed ? "Stereotype check" : res.data.rule,
    note: res.data.reason.replace(/\u2014/g, ", "),
  };
}

// Known-bad draft; the critic should always reject it.
export const CANARY = {
  hook: "Typical Pinoy tita? This is for you, mars!",
  slides: ["Typical Pinoy tita? This is for you, mars!", "Bongga, keri, charot!"],
  caption: "Mga tita talaga, laging chismis at kain. Lodi, petmalu, sana all may snack. Charot!",
};
