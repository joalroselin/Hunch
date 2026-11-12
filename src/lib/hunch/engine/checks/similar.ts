import type { CheckResult } from "../../types";

export const SIMILAR_THRESHOLD = 0.5;

function trigrams(text: string) {
  const words = text.toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, " ").split(/\s+/).filter(Boolean);
  const set = new Set<string>();
  if (words.length < 3) {
    if (words.length) set.add(words.join(" "));
    return set;
  }
  for (let i = 0; i < words.length - 2; i++) set.add(`${words[i]} ${words[i + 1]} ${words[i + 2]}`);
  return set;
}

// Overlap coefficient on word trigrams: shared / size of the smaller set.
export function similarity(a: string, b: string) {
  const A = trigrams(a);
  const B = trigrams(b);
  if (!A.size || !B.size) return 0;
  let shared = 0;
  for (const t of A) if (B.has(t)) shared++;
  return shared / Math.min(A.size, B.size);
}

type Draftish = { hook: string; slides: string[]; code?: string; audienceName?: string };

const textOf = (d: Draftish) => [d.hook, ...d.slides.filter((s) => s !== d.hook)].join(" ");

export function duplicateCheck(draft: Draftish, others: Draftish[]): CheckResult {
  let worst = 0;
  let worstOf: Draftish | undefined;
  for (const o of others) {
    const s = Math.max(similarity(textOf(draft), textOf(o)), similarity(draft.hook, o.hook));
    if (s > worst) {
      worst = s;
      worstOf = o;
    }
  }
  if (worst > SIMILAR_THRESHOLD && worstOf) {
    const name = worstOf.code ? `${worstOf.code} (${worstOf.audienceName ?? "another version"})` : "another version";
    return {
      kind: "duplicate",
      passed: false,
      rule: "Too similar",
      note: `Reads almost the same as ${name}, ${Math.round(worst * 100)}% of the phrases match. Each version needs its own hook so the test can tell them apart.`,
    };
  }
  return { kind: "duplicate", passed: true, rule: "Too similar", note: "Different enough from the other versions." };
}
