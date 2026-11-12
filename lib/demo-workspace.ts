export type Post = { id: string; text: string; channel: string; date: string; status: "Draft" | "Planned" | "Posted"; reach?: number; engagements?: number; sample?: boolean };

export const sampleWorkspacePosts = (): Post[] => {
  const day = (offset: number) => { const value = new Date(); value.setDate(value.getDate() + offset); return value.toISOString().slice(0,10); };
  return [
    { id: "sample-plan", text: "A 20-minute tapsilog breakfast at home", channel: "Instagram", date: day(1), status: "Planned", sample: true },
    { id: "sample-plan-2", text: "The chili oil I put on absolutely everything", channel: "TikTok", date: day(3), status: "Planned", sample: true },
    { id: "sample-posted", text: "Three-ingredient garlic rice for busy mornings", channel: "TikTok", date: day(-1), status: "Posted", reach: 2680, engagements: 215, sample: true },
    { id: "sample-posted-2", text: "Behind the scenes: our Sunday market haul", channel: "Instagram", date: day(-4), status: "Posted", reach: 1840, engagements: 126, sample: true },
    { id: "sample-posted-3", text: "Quick merienda: chili garlic toast", channel: "Facebook", date: day(-2), status: "Posted", reach: 1420, engagements: 71, sample: true },
    { id: "sample-draft", text: "Budget lunch series: what ₱100 gets this week", channel: "Facebook", date: "", status: "Draft", sample: true }
  ];
};

export function mergeDemoPlatform(posts: Post[], platform: string | null): Post[] {
  if (platform === null) return posts.filter(post => !post.sample);
  return [...posts.filter(post => !post.sample || post.channel !== platform), ...sampleWorkspacePosts().filter(post => post.channel === platform && !posts.some(existing => !existing.sample && existing.id === post.id))];
}
