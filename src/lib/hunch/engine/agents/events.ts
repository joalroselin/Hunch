import type { AgentName, CutCategory, IssueType, StudioEvent, StudioEventKind, TestEvent } from "../../types";

export type Emit = (e: TestEvent) => void | Promise<void>;

// Writes StudioEvents with ids e01.. and ms since the run started, and forwards each as an NDJSON line.
export class EventLog {
  readonly events: StudioEvent[] = [];
  private readonly start: number;
  constructor(
    private readonly emit: Emit,
    private readonly now: () => number = Date.now,
  ) {
    this.start = now();
  }
  async log(agent: AgentName, kind: StudioEventKind, text: string, refId?: string, detail?: string) {
    const event: StudioEvent = { id: `e${String(this.events.length + 1).padStart(2, "0")}`, at: Math.max(0, this.now() - this.start), agent, kind, text };
    if (refId) event.refId = refId;
    if (detail) event.detail = detail;
    this.events.push(event);
    await this.emit({ type: "event", event });
    return event;
  }
  async send(e: TestEvent) {
    await this.emit(e);
  }
}

export const CUT_PHRASE: Record<CutCategory, string> = {
  stereotype: "a stereotype, not a buying moment",
  duplicate: "same moment as another audience",
  too_broad: "too broad, it fits almost everyone",
  implausible: "not a likely buyer at this price or size",
  off_channel: "they can't buy where you sell",
};

export const ISSUE_PHRASE: Record<IssueType, string> = {
  cringe: "it reads like a hard sell",
  stereotype: "it leans on a stereotype",
  ad_policy: "it points at who the reader is",
  language: "the languages don't match",
  claim: "it makes a claim you didn't",
};

export const ISSUE_RULE: Record<IssueType, string> = {
  cringe: "No hype, caps or emoji",
  stereotype: "No stereotypes",
  ad_policy: "Nothing about the reader",
  language: "Same meaning in every language",
  claim: "Only the seller's facts",
};

export function issueSummary(types: IssueType[]) {
  const unique = [...new Set(types)].map((t) => ISSUE_PHRASE[t]);
  return unique.length > 1 ? `${unique.slice(0, -1).join(", ")} and ${unique[unique.length - 1]}` : (unique[0] ?? "it needs a fix");
}
