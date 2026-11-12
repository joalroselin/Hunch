import candlePosts from "./candle-posts.json" with { type: "json" };
import type { Post } from "./demo-workspace";

type Campaign = { spend: number; results: number; audience: string; code: string; source: "Sample" | "Entered"; followupId?: string; followupCaption?: string };

export function campaignFor(post: Post): Campaign | undefined {
  const sample = post.sample ? candlePosts.find(sample => post.id === sample.id || post.id.startsWith(`${sample.id}-`)) : undefined;
  if (post.status !== "Posted") return undefined;
  if (post.spend !== undefined || post.messages !== undefined) {
    if (post.spend !== undefined && post.messages !== undefined && Number.isFinite(post.spend) && post.spend >= 0 && Number.isInteger(post.messages) && post.messages >= 0) {
      return { spend: post.spend, results: post.messages, audience: sample?.campaign?.audience ?? post.text.split("\n")[0], code: sample?.campaign?.code ?? "Post", source: "Entered" };
    }
    return undefined;
  }
  return sample?.status === "Posted" && post.channel === sample.channel && post.reach === sample.reach && post.engagements === sample.engagements && sample.campaign ? { ...sample.campaign, source: "Sample" } : undefined;
}

const recorded = (value: number | undefined): value is number => value !== undefined && Number.isFinite(value) && value >= 0;

export function analyzePosts(posts: Post[], channel = "All") {
  const selected = posts.filter(post => post.status === "Posted" && (channel === "All" || post.channel === channel));
  const rows = selected.map(post => {
    const campaign = campaignFor(post);
    const messages = campaign?.results;
    const spend = campaign?.spend;
    return { post, campaign, messages, spend, costPerConversation: messages && recorded(spend) ? spend / messages : null };
  });
  const campaigns = rows.filter(row => row.campaign);
  const messages = campaigns.reduce((sum, row) => sum + (row.messages ?? 0), 0);
  const spend = campaigns.reduce((sum, row) => sum + (row.spend ?? 0), 0);
  const reachRows = rows.filter(row => recorded(row.post.reach));
  const engagementRows = rows.filter(row => recorded(row.post.engagements));
  const reach = reachRows.reduce((sum, row) => sum + row.post.reach!, 0);
  const engagements = engagementRows.reduce((sum, row) => sum + row.post.engagements!, 0);
  const complete = rows.filter(row => recorded(row.post.reach) && recorded(row.post.engagements));
  const completeReach = complete.reduce((sum, row) => sum + row.post.reach!, 0);
  const completeEngagements = complete.reduce((sum, row) => sum + row.post.engagements!, 0);
  const ranked = [...campaigns].sort((a, b) => (a.costPerConversation ?? Infinity) - (b.costPerConversation ?? Infinity));
  const channels = [...new Set(selected.map(post => post.channel))].map(name => {
    const group = campaigns.filter(row => row.post.channel === name);
    const groupSpend = group.reduce((sum, row) => sum + (row.spend ?? 0), 0);
    const groupMessages = group.reduce((sum, row) => sum + (row.messages ?? 0), 0);
    return { name, count: group.length, messages: groupMessages, spend: groupSpend, costPerConversation: groupMessages ? groupSpend / groupMessages : null };
  }).filter(group => group.count).sort((a, b) => (a.costPerConversation ?? Infinity) - (b.costPerConversation ?? Infinity));
  return { rows, campaigns, messages, spend, costPerConversation: messages ? spend / messages : null, reach, engagements, reachCount: reachRows.length, engagementCount: engagementRows.length, engagementRate: completeReach ? completeEngagements / completeReach * 100 : null, ranked, channels, missing: rows.filter(row => !recorded(row.post.reach) || !recorded(row.post.engagements)).length };
}
