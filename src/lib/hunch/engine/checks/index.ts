import type { Audience, CheckResult, Mode } from "../../types";
import { policyCheck } from "./policy";
import { duplicateCheck } from "./similar";
import { heuristicCritic, liveCritic } from "./stereotype";

export { policyCheck, lintText } from "./policy";
export { duplicateCheck, similarity } from "./similar";
export { heuristicCritic, liveCritic, CANARY } from "./stereotype";

export type Draft = { hook: string; slides: string[]; caption: string; hashtags?: string[]; cta?: string };
type Other = { hook: string; slides: string[]; code?: string; audienceName?: string };

export async function runChecks(opts: {
  draft: Draft;
  audience: Pick<Audience, "name" | "who">;
  others: Other[];
  mode: Mode;
  productName: string;
  stereotype?: CheckResult; // sample fixtures pass their verdict here
}): Promise<CheckResult[]> {
  const policy = policyCheck(opts.draft);
  const stereotype =
    opts.stereotype ??
    (opts.mode === "live"
      ? await liveCritic(opts.draft, opts.audience, opts.productName)
      : heuristicCritic([opts.draft.hook, ...opts.draft.slides, opts.draft.caption].join("\n")));
  const duplicate = duplicateCheck(opts.draft, opts.others);
  return [policy, stereotype, duplicate];
}

export const allPassed = (checks: CheckResult[]) => checks.every((c) => c.passed);
export const failedOnly = (checks: CheckResult[]) => checks.filter((c) => !c.passed);
