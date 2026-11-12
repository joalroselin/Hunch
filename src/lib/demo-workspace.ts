import { focus, photoUrlOf, report, run } from "@/components/hunch/home/data";

export type Post = {
  id: string;
  text: string;
  channel: string;
  date: string;
  status: "Draft" | "Planned" | "Posted";
  reach?: number;
  engagements?: number;
  sample?: boolean;
  // Sample posts only; never sent to Supabase.
  photo?: string;
  audience?: string;
  code?: string;
};

// Where each of Elle's 8 test posts ran, and next week's 7 days in order.
const TEST_CHANNELS: Record<string, string> = { A1: "Instagram", A2: "Instagram", A3: "Facebook", A4: "TikTok", A5: "TikTok", A6: "Facebook", A7: "TikTok", A8: "Facebook" };
const WEEK_CHANNELS = ["Facebook", "Instagram", "TikTok", "Facebook", "Instagram", "Facebook", "TikTok"];
const OLD_SAMPLE_IDS = new Set(["sample-plan", "sample-plan-2", "sample-posted", "sample-posted-2", "sample-posted-3", "sample-draft"]);

export const weekChannel = (index: number) => WEEK_CHANNELS[index % WEEK_CHANNELS.length];
export const channelOfAudience = (audienceId: string) => TEST_CHANNELS[run.versions.find(v => v.audienceId === audienceId)?.code ?? ""] ?? "Facebook";

const manilaDay = (offset: number, from: Date) =>
  new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Manila" }).format(new Date(from.getTime() + offset * 86400000));

// Per-browser id suffix, so two visitors never claim the same Supabase row.
function deviceTag() {
  if (typeof window === "undefined") return "";
  try {
    const key = "hunch.sample.tag";
    let tag = window.localStorage.getItem(key);
    if (!tag) {
      tag = Math.random().toString(36).slice(2, 8);
      window.localStorage.setItem(key, tag);
    }
    return `-${tag}`;
  } catch {
    return "";
  }
}

export const sampleWorkspacePosts = (from = new Date()): Post[] => {
  const tag = deviceTag();
  const id = (code: string) => `elle-${code.toLowerCase()}${tag}`;
  const week = focus.posts.map((post, i): Post => ({
    id: id(post.code), text: post.hook, channel: weekChannel(i), date: manilaDay(i + 1, from), status: "Planned",
    sample: true, photo: photoUrlOf(post), audience: post.audienceName, code: post.code,
  }));
  const tested = report.metrics.flatMap((metric): Post[] => {
    const index = run.versions.findIndex(v => v.code === metric.code);
    const version = run.versions[index];
    if (!version) return [];
    return [{
      id: id(version.code), text: version.hook, channel: TEST_CHANNELS[version.code] ?? "Facebook",
      date: manilaDay(-3 + Math.floor((index * 3) / run.versions.length), from), status: "Posted",
      reach: metric.reach, engagements: metric.engagements,
      sample: true, photo: photoUrlOf(version), audience: version.audienceName, code: version.code,
    }];
  });
  return [...week, ...tested];
};

export function mergeDemoPlatform(posts: Post[], platform: string | null): Post[] {
  if (platform === null) return posts.filter(post => !post.sample);
  return [...posts.filter(post => !post.sample || post.channel !== platform), ...sampleWorkspacePosts().filter(post => post.channel === platform && !posts.some(existing => !existing.sample && existing.id === post.id))];
}

// For stored rows: drops older sample sets and restores the fields Supabase does not keep.
export function refreshSamples(posts: Post[]): Post[] {
  const fresh = new Map(sampleWorkspacePosts().map(post => [post.id, post]));
  const kept = posts.flatMap((post): Post[] => {
    const now = fresh.get(post.id);
    if (now) return [{ ...post, photo: now.photo, audience: now.audience, code: now.code }];
    return post.sample || OLD_SAMPLE_IDS.has(post.id) ? [] : [post];
  });
  return kept.length < posts.length && !kept.some(post => post.sample) ? [...kept, ...fresh.values()] : kept;
}
