import candlePosts from "./candle-posts.json" with { type: "json" };

export type Post = { id: string; text: string; channel: string; date: string; status: "Draft" | "Planned" | "Posted"; reach?: number; engagements?: number; spend?: number; messages?: number; sample?: boolean };

export const sampleWorkspacePosts = (): Post[] => candlePosts.map(post => {
  const day = new Date(); day.setDate(day.getDate() + post.offset);
  return { id: post.id, text: post.text, channel: post.channel, date: day.toISOString().slice(0,10), status: post.status as Post["status"], reach: "reach" in post ? post.reach : undefined, engagements: "engagements" in post ? post.engagements : undefined, sample: true };
});

export function refreshSamplePosts(posts: Post[]): Post[] {
  // Replace the old food fixtures, preserving every personal post.
  if (posts.some(post => post.sample && post.id.startsWith("sample-"))) return [...posts.filter(post => !post.sample), ...sampleWorkspacePosts()];
  return posts;
}

export function mergeDemoPlatform(posts: Post[], platform: string | null): Post[] {
  if (platform === null) return posts.filter(post => !post.sample);
  return [...posts.filter(post => !post.sample || post.channel !== platform), ...sampleWorkspacePosts().filter(post => post.channel === platform && !posts.some(existing => !existing.sample && existing.id === post.id))];
}

export function samplePhotoFor(post: Post): string | undefined {
  return post.sample ? candlePosts.find(sample => post.id === sample.id || post.id.startsWith(`${sample.id}-`))?.photo : undefined;
}
