import assert from "node:assert/strict";
import { test } from "node:test";
import { demoReply, platformPrompt, scenarios } from "../lib/demo-chat.ts";
import { mergeDemoPlatform, sampleWorkspacePosts } from "../lib/demo-workspace.ts";

test("each example shows all five roles and hands its own draft to the composer", () => {
  for (const scenario of scenarios) {
    const reply = demoReply(scenario.name, "Calendar");
    assert.deepEqual(reply.slice(1).map(message => message.role), ["Analyst", "Strategist", "Copywriter", "Skeptic", "Reviewer"]);
    assert.equal(reply[1].text, scenario.evidence);
    assert.equal(reply[4].text, scenario.caveat);
    assert.equal(reply.at(-1)?.draft, scenario.draft);
    assert.match(reply[0].text, /prewritten/);
  }
});

test("free text acknowledges the current screen without pretending to run live AI", () => {
  const reply = demoReply("Help me with a caption", "Analytics");
  assert.equal(reply.length, 1);
  assert.match(reply[0].text, /Analytics/);
  assert.match(reply[0].text, /Live chat isn’t connected/);
  assert.equal(reply[0].draft, undefined);
});

test("platform playback populates each channel before analyzing and drafting", () => {
  for (const question of [platformPrompt, "Sync my platforms", "Analyze my real results"]) {
    const reply = demoReply(question, "Home");
    assert.deepEqual(reply.filter(message => message.platform).map(message => message.platform), ["Instagram", "TikTok", "Facebook"]);
    assert.equal(reply[4].role, "Analyst");
    assert.ok(reply.at(-1).draft);
    assert.match(reply[0].text, /fictional data/);
  }
  const measured = sampleWorkspacePosts().filter(post => post.reach !== undefined);
  assert.equal(measured.reduce((sum, post) => sum + post.reach, 0), 5940);
  assert.equal(measured.reduce((sum, post) => sum + post.engagements, 0), 412);
});

test("replaying imports preserves personal posts and does not duplicate samples", () => {
  const personal = { id: "my-post", text: "Keep my work", channel: "TikTok", date: "", status: "Draft" };
  let posts = mergeDemoPlatform([personal, ...sampleWorkspacePosts()], null);
  assert.deepEqual(posts, [personal]);
  for (const channel of ["Instagram", "TikTok", "Facebook", "TikTok"]) posts = mergeDemoPlatform(posts, channel);
  assert.deepEqual(posts.find(post => post.id === personal.id), personal);
  assert.equal(posts.length, 7);
  assert.equal(new Set(posts.map(post => post.id)).size, 7);
});
