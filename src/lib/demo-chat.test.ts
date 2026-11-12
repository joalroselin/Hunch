import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { test } from "vitest";
import { focus, report } from "@/components/hunch/home/data";
import { captionText } from "@/lib/hunch/language";
import { demoReply, importPrompt, manilaToday, requestedDay } from "./demo-chat";
import { mergeDemoPlatform, publishedPost, refreshSamples, resetSamplePosts, sampleWorkspacePosts, type Post } from "./demo-workspace";

const now = new Date("2026-11-12T04:00:00Z");
const samples = sampleWorkspacePosts(now);
const ask = (question: string) => demoReply(question, samples, undefined, now);
const suggestion = () => ask("What should I post?")[0].draft!;

test("sample results and week use the shared candle dataset", () => {
  const posted = samples.filter(post => post.status === "Posted");
  assert.equal(posted.length, report.metrics.length);
  for (const post of posted) {
    const metric = report.metrics.find(metric => metric.code === post.code)!;
    assert.equal(post.reach, metric.reach);
    assert.equal(post.engagements, metric.engagements);
    assert.ok(post.photo?.startsWith("/sample/candles/"));
  }
  assert.deepEqual(samples.filter(post => post.status === "Planned").map(post => post.date), ["2026-11-13", "2026-11-14", "2026-11-15", "2026-11-16", "2026-11-17", "2026-11-18", "2026-11-19"]);
});

test("all seven planned posts have distinct existing gallery assets", () => {
  const planned = samples.filter(post => post.status === "Planned");
  assert.equal(new Set(planned.map(post => post.photo)).size, 7);
  for (const post of planned) {
    assert.equal(post.photo, `/sample/candles/planned/${post.code}.jpg`);
    assert.ok(existsSync(`public${post.photo}`), post.photo);
  }
});

test("reset restores the sample week without touching personal work", () => {
  const personal: Post = { id: "personal", text: "My caption", channel: "Facebook", date: "2026-11-13", status: "Planned" };
  const reset = resetSamplePosts([personal, { ...samples[0], status: "Posted" }]);
  assert.deepEqual(reset.find(post => post.id === personal.id), personal);
  assert.equal(reset.filter(post => post.sample && post.status === "Planned").length, 7);
  assert.equal(reset.filter(post => post.sample && post.status === "Posted").length, 8);
});

test("marking a personal post published never invents platform metrics", () => {
  const personal: Post = { id: "personal", text: "My caption", channel: "Facebook", date: "2026-11-15", status: "Planned" };
  const published = publishedPost(personal, "2026-11-12");
  assert.equal(published.status, "Posted");
  assert.equal(published.date, "2026-11-12");
  assert.equal(published.reach, undefined);
  assert.equal(published.engagements, undefined);
  assert.equal(publishedPost(samples[0], "2026-11-12").reach, 0);
});

test("natural performance questions give one Hunch answer linked to a displayed post", () => {
  for (const question of ["What worked?", "How did my posts do?", "Show my performance", "Which post was best?"]) {
    const reply = ask(question);
    assert.equal(reply.length, 1);
    assert.equal(reply[0].role, "Hunch");
    const post = samples.find(post => post.id === reply[0].evidence?.postId)!;
    assert.ok(post);
    const metric = report.metrics.find(metric => metric.code === post.code)!;
    assert.ok(reply[0].text.includes(`${metric.results} messages`));
    assert.ok(reply[0].text.includes(post.reach!.toLocaleString("en-US")));
  }
});

test("analysis uses current posts, not the full sample or sample metrics on personal posts", () => {
  const personal: Post[] = [
    { id: "one", text: "My first post", status: "Posted", channel: "Instagram", date: "", reach: 100, engagements: 10, code: "A3" },
    { id: "two", text: "My second post", status: "Posted", channel: "TikTok", date: "", reach: 100, engagements: 20 },
  ];
  const response = demoReply("What worked?", personal)[0];
  assert.equal(response.evidence?.postId, "two");
  assert.match(response.text, /20.0% engagement/);
  assert.doesNotMatch(response.text, /messages|Elle/);
  const changed = samples.filter(post => post.status === "Posted").map(post => ({ ...post, engagements: 1 }));
  assert.doesNotMatch(demoReply("What worked?", changed)[0].text, /messages/);
});

test("empty, zero reach and incomplete results never create a fake winner", () => {
  for (const posts of [[], [{ ...samples[0], status: "Posted" as const, reach: 0, engagements: 10 }], [{ ...samples[0], status: "Posted" as const, reach: 100 }]]) {
    const response = demoReply("What worked?", posts)[0];
    assert.equal(response.evidence, undefined);
    assert.equal(response.draft, undefined);
  }
  const one = demoReply("What worked?", [samples.find(post => post.status === "Posted")!])[0];
  assert.match(one.text, /One post isn’t enough/);
});

test("a recommendation uses existing copy and keeps the same source and planned post", () => {
  const result = ask("What should I post?")[0];
  const source = samples.find(post => post.id === result.evidence?.postId)!;
  const version = focus.posts.find(version => version.code === result.draft?.code)!;
  assert.ok(source && version);
  assert.equal(result.draft?.text, captionText(version, "english"));
  assert.equal(result.draft?.postId, samples.find(post => post.code === version.code)?.id);
});

test("language and shortening follow-ups preserve the draft identity and product facts", () => {
  const draft = suggestion();
  const version = focus.posts.find(version => version.code === draft.code)!;
  const revised = demoReply("Make it more Taglish", samples, draft, now)[0].draft!;
  assert.equal(revised.text, captionText(version, "taglish"));
  assert.notEqual(revised.text, draft.text);
  assert.equal(revised.postId, draft.postId);
  const shorter = demoReply("Make it shorter", samples, revised, now)[0].draft!;
  assert.ok(shorter.text.length < revised.text.length);
  assert.match(shorter.text, /350/);
  assert.equal(shorter.channel, draft.channel);
  assert.equal(demoReply("Make it English", samples, revised, now)[0].draft?.text, draft.text);
});

test("planning uses the latest revision with a Manila calendar day", () => {
  const revised = demoReply("Make it more Taglish", samples, suggestion(), now)[0].draft!;
  const result = demoReply("Plan this for Friday", samples, revised, now)[0];
  assert.equal(result.planDate, "2026-11-13");
  assert.deepEqual(result.draft, revised);
  assert.match(result.text, /Friday, Nov 13/);
  assert.equal(demoReply("Plan this for Friday", samples, undefined, now)[0].planDate, undefined);
});

test("dates handle Manila midnight, future weekdays, and invalid dates", () => {
  assert.equal(manilaToday(new Date("2026-11-12T17:00:00Z")), "2026-11-13");
  assert.equal(requestedDay("tomorrow", now), "2026-11-13");
  assert.equal(requestedDay("today", now), "2026-11-12");
  assert.equal(requestedDay("Friday", new Date("2026-11-13T04:00:00Z")), "2026-11-20");
  assert.equal(requestedDay("2026-11-15", now), "2026-11-15");
  for (const input of ["2026-02-30", "2026-11-01", "next week", "whenever"]) assert.equal(requestedDay(input, now), null);
});

test("imports are explicit and personal work survives replay", () => {
  const personal: Post = { id: "personal", text: "Keep my work", channel: "TikTok", date: "", status: "Draft" };
  let posts = mergeDemoPlatform([personal, ...samples], null);
  assert.deepEqual(posts, [personal]);
  const sequence = demoReply(importPrompt, posts, undefined, now);
  assert.deepEqual(sequence.filter(message => message.platform).map(message => message.platform), ["Instagram", "TikTok", "Facebook"]);
  assert.equal(sequence.filter(message => !message.platform).length, 1);
  for (const platform of ["Instagram", "TikTok", "Facebook", "TikTok"]) posts = mergeDemoPlatform(posts, platform);
  assert.equal(posts.length, samples.length + 1);
  assert.equal(new Set(posts.map(post => post.id)).size, posts.length);
  assert.deepEqual(posts.find(post => post.id === personal.id), personal);
  assert.ok(ask("How did my posts do?").every(message => !message.platform));
  assert.equal(refreshSamples(samples).length, samples.length);
});

test("unsupported requests offer the supported path without inventing a draft or action", () => {
  const reply = ask("Book a flight")[0];
  assert.match(reply.text, /What worked/);
  assert.equal(reply.draft, undefined);
  assert.equal(reply.planDate, undefined);
});
