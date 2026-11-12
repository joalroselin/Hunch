import assert from "node:assert/strict";
import { test } from "vitest";
import snapshot from "@/components/hunch/screens/demo-snapshot.json";
import { captionText } from "@/lib/hunch/language";
import type { Version } from "@/lib/hunch/types";
import { demoReply, platformPrompt, roleActivity, scenarios, type ChatMessage } from "./demo-chat";
import { mergeDemoPlatform, refreshSamples, sampleWorkspacePosts, type Post } from "./demo-workspace";

const { run, report, focus } = snapshot;
const metric = (code: string) => report.metrics.find(m => m.code === code)!;
const testPostOf = (audienceId: string) => run.versions.find(v => v.audienceId === audienceId)!;
const realPosts = [...focus.posts, ...focus.tests] as unknown as Version[];
const channels = ["Instagram", "TikTok", "Facebook"];
const roles = ["Analyst", "Strategist", "Copywriter", "Skeptic", "Reviewer"];
const num = (n: number) => n.toLocaleString("en-US");
const sum = (list: number[]) => list.reduce((a, b) => a + b, 0);

// Noon in Manila on Nov 12, 2026.
const now = new Date("2026-11-12T04:00:00Z");
const samples = sampleWorkspacePosts(now);
const replay = demoReply(platformPrompt);

test("the posted samples are Elle's 8 test posts with their real numbers, over the last 3 days", () => {
  const posted = samples.filter(post => post.status === "Posted");
  assert.deepEqual(posted.map(post => post.code).sort(), run.versions.map(v => v.code).sort());
  for (const post of posted) {
    const version = run.versions.find(v => v.code === post.code)!;
    assert.equal(post.text, version.hook);
    assert.equal(post.audience, version.audienceName);
    assert.equal(post.photo, `/sample/candles/${version.code}.jpg`);
    assert.equal(post.reach, metric(version.code).reach);
    assert.equal(post.engagements, metric(version.code).engagements);
    assert.ok(["2026-11-09", "2026-11-10", "2026-11-11"].includes(post.date), post.date);
    assert.ok(channels.includes(post.channel));
  }
  assert.deepEqual(new Set(posted.map(post => post.channel)), new Set(channels));
  assert.equal(new Set(posted.map(post => post.date)).size, 3);
  assert.equal(sum(posted.map(post => post.reach ?? 0)), sum(report.metrics.map(m => m.reach)));
  assert.equal(sum(posted.map(post => post.engagements ?? 0)), sum(report.metrics.map(m => m.engagements)));
});

test("the planned samples are next week's 7 posts, one a day from tomorrow", () => {
  const planned = samples.filter(post => post.status === "Planned");
  assert.deepEqual(planned.map(post => post.text), focus.posts.map(post => post.hook));
  assert.deepEqual(planned.map(post => post.date), ["2026-11-13", "2026-11-14", "2026-11-15", "2026-11-16", "2026-11-17", "2026-11-18", "2026-11-19"]);
  for (const [i, post] of planned.entries()) {
    assert.equal(post.audience, focus.posts[i].audienceName);
    assert.equal(post.photo, `/sample/candles/${testPostOf(focus.posts[i].audienceId).code}.jpg`);
    assert.equal(post.reach, undefined);
  }
  assert.equal(samples.length, run.versions.length + focus.posts.length);
  assert.ok(samples.every(post => post.sample));
});

test("sample ids are new, so stored chili oil samples are dropped", () => {
  const ids = samples.map(post => post.id);
  assert.equal(new Set(ids).size, ids.length);
  assert.ok(ids.every(id => id.startsWith("elle-")));
  const personal: Post = { id: "my-post", text: "Keep my work", channel: "TikTok", date: "", status: "Draft" };
  const old: Post = { id: "sample-plan", text: "The chili oil I put on absolutely everything", channel: "TikTok", date: "", status: "Planned", sample: true };
  const edited: Post = { id: "sample-draft", text: "Budget lunch series", channel: "Facebook", date: "", status: "Draft" };
  const fromCloud: Post = { ...samples[0], photo: undefined, audience: undefined, code: undefined };
  const kept = refreshSamples([old, edited, personal, fromCloud]);
  assert.deepEqual(kept.map(post => post.id), [personal.id, fromCloud.id]);
  assert.equal(kept[1].photo, samples[0].photo);
  assert.equal(kept[1].audience, samples[0].audience);
  const replaced = refreshSamples([old, personal]);
  assert.equal(replaced.length, 1 + samples.length);
  assert.ok(replaced.every(post => !/chili|garlic/i.test(post.text)));
  assert.equal(refreshSamples(sampleWorkspacePosts()).length, samples.length);
});

test("the replay loads Instagram, TikTok and Facebook, then the five roles, with the test's numbers", () => {
  for (const question of [platformPrompt, "Sync my platforms", "Analyze my real results"]) {
    const reply = demoReply(question);
    assert.deepEqual(reply.map(message => message.role), ["Hunch", ...channels, ...roles]);
    assert.deepEqual(reply.filter(message => message.platform).map(message => message.platform), channels);
    assert.match(reply[0].text, /replay of Elle's sample/);
  }
  for (const message of replay.filter(m => m.platform)) {
    const posts = sampleWorkspacePosts().filter(post => post.status === "Posted" && post.channel === message.platform);
    assert.ok(message.text.includes(`${posts.length} test posts`), message.text);
    assert.ok(message.text.includes(`${num(sum(posts.map(post => post.reach ?? 0)))} people`), message.text);
    assert.ok(message.text.includes(`${sum(posts.map(post => metric(post.code!).results))} messages`), message.text);
  }
  const winner = metric(report.verdict.winnerCode);
  const runnerUp = metric(report.verdict.runnerUpCode);
  const [analyst, strategist, copywriter, skeptic, reviewer] = replay.slice(4);
  assert.ok(analyst.text.includes(winner.audienceName) && analyst.text.includes(`${winner.results} messages`) && analyst.text.includes(`${winner.engagements} engagements`), analyst.text);
  assert.ok(strategist.text.includes(`give them ${focus.posts.filter(p => p.purpose === "winner").length} posts`), strategist.text);
  assert.ok(strategist.text.includes(`day ${focus.posts.findIndex(p => p.purpose === "runner_up_test") + 1}`) && strategist.text.includes(runnerUp.audienceName) && strategist.text.includes(`${runnerUp.results} messages`), strategist.text);
  assert.equal(copywriter.text, focus.posts[0].hook);
  assert.ok(skeptic.text.includes(`${report.days} days`), skeptic.text);
  assert.equal(reviewer.draft, captionText(focus.posts[0] as unknown as Version, "taglish"));
  assert.equal(reviewer.channel, samples.find(post => post.code === focus.posts[0].code)?.channel);
});

test("each question runs the five roles and hands a real post to the composer", () => {
  const drafts = new Set([replay.at(-1)?.draft]);
  for (const scenario of scenarios) {
    const reply = demoReply(scenario.name);
    assert.deepEqual(reply.map(message => message.role), ["Hunch", ...roles]);
    assert.match(reply[0].text, /Elle's sample/);
    assert.equal(reply[1].text, scenario.evidence);
    assert.equal(reply[4].text, scenario.caveat);
    const post = realPosts.find(p => p.hook === reply[3].text);
    assert.ok(post, reply[3].text);
    assert.equal(reply.at(-1)?.draft, captionText(post, "taglish"));
    assert.ok(channels.includes(reply.at(-1)?.channel ?? ""));
    assert.equal(reply.filter(message => message.draft).length, 1);
    drafts.add(reply.at(-1)?.draft);
  }
  assert.equal(drafts.size, scenarios.length + 1);
  assert.equal(scenarios[0].name, `Is ${metric(report.verdict.winnerCode).results} messages enough?`);
});

test("typed questions get one honest line and no draft", () => {
  const reply = demoReply("Help me with a caption");
  assert.equal(reply.length, 1);
  assert.equal(reply[0].role, "Hunch");
  assert.match(reply[0].text, /can't answer typed questions yet/);
  assert.equal(reply[0].draft, undefined);
});

test("replaying imports keeps personal posts and never duplicates samples", () => {
  const personal: Post = { id: "my-post", text: "Keep my work", channel: "TikTok", date: "", status: "Draft" };
  let posts = mergeDemoPlatform([personal, ...sampleWorkspacePosts()], null);
  assert.deepEqual(posts, [personal]);
  for (const channel of ["Instagram", "TikTok", "Facebook", "TikTok"]) posts = mergeDemoPlatform(posts, channel);
  assert.deepEqual(posts.find(post => post.id === personal.id), personal);
  assert.equal(posts.length, 1 + samples.length);
  assert.equal(new Set(posts.map(post => post.id)).size, posts.length);
});

test("no food samples and no em dashes anywhere in the chat or the samples", () => {
  const lines: ChatMessage[] = [...replay, ...scenarios.flatMap(s => demoReply(s.name)), ...demoReply("hello")];
  const words = [platformPrompt, ...Object.values(roleActivity), ...scenarios.map(s => s.name), ...lines.map(m => `${m.text} ${m.draft ?? ""}`), ...samples.map(p => p.text)];
  for (const text of words) assert.doesNotMatch(text, /chili|garlic|noodle|recipe|merienda|food creator|Elle Reyes|fictional|\u2014/i);
});
