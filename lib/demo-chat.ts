export type ChatMessage = { role: string; text: string; draft?: string; platform?: string; channel?: string };

export const platformPrompt = "Show me how my channels are doing";
export const scenarios = [
  { id: "saves", name: "Recipe videos earn saves", evidence: "Example dataset: 6 recipe videos averaged 8.1% saves per reach; 5 product-only posts averaged 4.9%.", insight: "Practical recipe videos appear to earn more saves in this sample.", next: "Try one more 20–30 second recipe video, then compare saves per reach.", draft: "POV: you have 10 minutes and one spoon of chili oil. Here’s my go-to noodle bowl…", caveat: "This is a small sample. Topic, timing, and format may all be contributing; it does not prove recipes caused the lift." },
  { id: "comments", name: "Behind-the-scenes sparks replies", evidence: "Example dataset: 4 process clips averaged 31 comments; 5 polished product shots averaged 14.", insight: "Process clips may be prompting more conversation than polished product shots.", next: "Share one short making-of clip and ask a specific question about the process.", draft: "The part you don’t see: every batch gets taste-tested. Would you go extra garlicky or extra spicy?", caveat: "Comments are not the same as sales or reach. Check whether this pattern repeats before changing your content mix." },
  { id: "low-data", name: "Not enough data yet", evidence: "Example dataset: one post with reach and engagement recorded.", insight: "There is not enough evidence to call a winning format.", next: "Post two different formats this week and record the same metrics for each.", draft: "Try a simple recipe clip and a behind-the-scenes clip; keep the caption style similar so the comparison is easier.", caveat: "One post is too little to separate a real pattern from normal variation." }
];

// shortcut: scripted examples only; replace with a model endpoint for live chat.
export function demoReply(question: string, view: string): ChatMessage[] {
  const scenario = scenarios.find(item => item.name === question);
  if (!scenario && (question === platformPrompt || /\b(sync|import|platforms?|channels?|analytics|performance|results)\b/i.test(question))) return [
    { role: "Hunch", text: "Loading Instagram example data…", platform: "Instagram" },
    { role: "Hunch", text: "Loading TikTok example data…", platform: "TikTok" },
    { role: "Hunch", text: "Loading Facebook example data…", platform: "Facebook" },
    { role: "Hunch", text: "Your TikTok recipe is worth another test: 8.0% engagement, compared with 6.8% on Instagram and 5.0% on Facebook in this sample.\n\nTry another quick recipe on TikTok. These are different topics on different platforms, so three posts don’t prove a winning format.\n\nHere’s a caption to start with:", draft: scenarios[0].draft, channel: "TikTok" }
  ];
  if (!scenario) return [{ role: "Hunch", text: `You’re on ${view}. Live chat isn’t connected yet. Try an example to explore a recommendation. These examples don’t analyze your saved posts.` }];
  return [{ role: "Hunch", text: `${scenario.insight}\n\n${scenario.next}\n\n${scenario.caveat}`, draft: scenario.draft }];
}
