import assert from "node:assert/strict";
import { test } from "node:test";
import { demoReply, platformPrompt, scenarios } from "../lib/demo-chat.ts";
import { mergeDemoPlatform, sampleWorkspacePosts } from "../lib/demo-workspace.ts";

test("each example gives one Hunch response with evidence limits and an editable draft", () => {
  for (const scenario of scenarios) {
    const reply = demoReply(scenario.name, "Calendar");
    assert.equal(reply.length, 1);
    assert.equal(reply[0].role, "Hunch");
    assert.ok(reply[0].text.includes(scenario.insight));
    assert.ok(reply[0].text.includes(scenario.caveat));
    assert.equal(reply[0].draft, scenario.draft);
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
    const visibleMessages = reply.filter(message => !message.platform);
    assert.equal(visibleMessages.length, 1);
    assert.equal(visibleMessages[0].role, "Hunch");
    assert.ok(reply.at(-1).draft);
    assert.equal(reply.at(-1).channel, "TikTok");
    assert.match(reply.at(-1).text, /in this sample/);
  }
  const measured = sampleWorkspacePosts().filter(post => post.reach !== undefined);
  assert.equal(measured.reduce((sum, post) => sum + post.reach, 0), 18629);
  assert.equal(measured.reduce((sum, post) => sum + post.engagements, 0), 657);
});

test("replaying imports preserves personal posts and does not duplicate samples", () => {
  const personal = { id: "my-post", text: "Keep my work", channel: "TikTok", date: "", status: "Draft" };
  let posts = mergeDemoPlatform([personal, ...sampleWorkspacePosts()], null);
  assert.deepEqual(posts, [personal]);
  for (const channel of ["Instagram", "TikTok", "Facebook", "TikTok"]) posts = mergeDemoPlatform(posts, channel);
  assert.deepEqual(posts.find(post => post.id === personal.id), personal);
  assert.equal(posts.length, 16);
  assert.equal(new Set(posts.map(post => post.id)).size, 16);
});
