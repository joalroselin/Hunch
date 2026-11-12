export type ChatMessage = { role: string; text: string; draft?: string; platform?: string; channel?: string };

export const platformPrompt = "Show me how my channels are doing";
export const roleActivity: Record<string, string> = {
  Hunch: "Preparing the walkthrough",
  Instagram: "Loading Instagram example posts",
  TikTok: "Loading TikTok example metrics",
  Facebook: "Loading Facebook example results",
  Analyst: "Comparing the evidence",
  Strategist: "Choosing the next experiment",
  Copywriter: "Shaping a caption",
  Skeptic: "Checking the assumptions",
  Reviewer: "Preparing your draft for review"
};

export const scenarios = [
  { id: "saves", name: "Recipe videos earn saves", evidence: "Example dataset: 6 recipe videos averaged 8.1% saves per reach; 5 product-only posts averaged 4.9%.", insight: "Practical recipe videos appear to earn more saves in this sample.", next: "Try one more 20–30 second recipe video, then compare saves per reach.", draft: "POV: you have 10 minutes and one spoon of chili oil. Here’s my go-to noodle bowl…", caveat: "This is a small sample. Topic, timing, and format may all be contributing; it does not prove recipes caused the lift." },
  { id: "comments", name: "Behind-the-scenes sparks replies", evidence: "Example dataset: 4 process clips averaged 31 comments; 5 polished product shots averaged 14.", insight: "Process clips may be prompting more conversation than polished product shots.", next: "Share one short making-of clip and ask a specific question about the process.", draft: "The part you don’t see: every batch gets taste-tested. Would you go extra garlicky or extra spicy?", caveat: "Comments are not the same as sales or reach. Check whether this pattern repeats before changing your content mix." },
  { id: "low-data", name: "Not enough data yet", evidence: "Example dataset: one post with reach and engagement recorded.", insight: "There is not enough evidence to call a winning format.", next: "Post two different formats this week and record the same metrics for each.", draft: "Try a simple recipe clip and a behind-the-scenes clip; keep the caption style similar so the comparison is easier.", caveat: "One post is too little to separate a real pattern from normal variation." }
];

// shortcut: scripted examples only; replace with a model endpoint for live chat.
export function demoReply(question: string, view: string): ChatMessage[] {
  const scenario = scenarios.find(item => item.name === question);
  if (!scenario && (question === platformPrompt || /\b(sync|import|platforms?|channels?|analytics|performance|results)\b/i.test(question))) return [
    { role: "Hunch", text: "I’ll replay a sample channel import, fill the analytics table, and work through a next post. This uses fictional data; no platform connection is being made." },
    { role: "Instagram", text: "Instagram example loaded: 2 posts, including a market-haul clip with 1,840 reach and 126 engagements.", platform: "Instagram" },
    { role: "TikTok", text: "TikTok example loaded: 2 posts, including a garlic-rice recipe with 2,680 reach and 215 engagements.", platform: "TikTok" },
    { role: "Facebook", text: "Facebook example loaded: 2 posts, including chili garlic toast with 1,420 reach and 71 engagements.", platform: "Facebook" },
    { role: "Analyst", text: "Across these three example posts: 5,940 reach and 412 engagements. The TikTok recipe has an 8.0% engagement rate, versus 6.8% on the Instagram clip and 5.0% on Facebook." },
    { role: "Strategist", text: "The recipe is a promising next test. Try a short noodle-bowl video on TikTok, keeping the chili oil part of the recipe rather than the whole pitch." },
    { role: "Copywriter", text: scenarios[0].draft },
    { role: "Skeptic", text: "Hold on: these are different topics on different platforms. Three posts cannot establish a winning format. Frame this as a test, not a proven strategy." },
    { role: "Reviewer", text: "Recommendation revised: test one more quick recipe and compare it with your previous TikTok recipe. Track engagement rate again. Here’s a draft you can edit before planning it.", draft: scenarios[0].draft, channel: "TikTok" }
  ];
  if (!scenario) return [{ role: "Hunch", text: `You’re on ${view}. Live chat isn’t connected yet. Choose an example below to see the five roles work through a sample question. These examples don’t analyze your saved posts.` }];
  return [
    { role: "Hunch", text: "Let’s walk through this example together. The following evidence and responses are prewritten, separate from your saved posts." },
    { role: "Analyst", text: scenario.evidence },
    { role: "Strategist", text: scenario.next },
    { role: "Copywriter", text: scenario.draft },
    { role: "Skeptic", text: scenario.caveat },
    { role: "Reviewer", text: "Keep the limitation in mind before using this idea. Review and edit the draft before adding it to your plan.", draft: scenario.draft }
  ];
}
