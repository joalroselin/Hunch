import assert from "node:assert/strict";
import { test } from "node:test";
import { analyzePosts, campaignFor } from "../lib/analytics.ts";
import { sampleWorkspacePosts } from "../lib/demo-workspace.ts";

const samples = sampleWorkspacePosts();
const personal = (overrides = {}) => ({ id: "personal", text: "My candle post", channel: "Instagram", date: "2026-11-12", status: "Posted", ...overrides });

test("campaign totals, ranking and cost use the same eight recorded candle posts", () => {
  const data = analyzePosts(samples);
  assert.equal(data.rows.length, 8);
  assert.equal(data.messages, 52);
  assert.equal(data.spend, 792);
  assert.equal(data.costPerConversation, 792 / 52);
  assert.equal(data.reach, 18629);
  assert.equal(data.engagements, 657);
  assert.equal(data.ranked[0].campaign.code, "A3");
  assert.equal(data.ranked[0].costPerConversation, 99 / 14);
  assert.equal(data.ranked[1].campaign.code, "A6");
  assert.equal(data.ranked.at(-1).campaign.code, "A8");
  assert.equal(data.ranked[0].campaign.followupId, "elle-p1");
  assert.ok(samples.some(post => post.id === data.ranked[0].campaign.followupId && post.status === "Planned"));
});

test("channel filtering updates the same rows, totals and chart groups", () => {
  const data = analyzePosts(samples, "Facebook");
  assert.equal(data.rows.length, 3);
  assert.equal(data.messages, 25);
  assert.equal(data.spend, 297);
  assert.equal(data.costPerConversation, 297 / 25);
  assert.deepEqual(data.channels.map(group => group.name), ["Facebook"]);
  assert.equal(data.channels[0].costPerConversation, data.costPerConversation);
  assert.equal(analyzePosts(samples, "Unknown").rows.length, 0);
});

test("cost is weighted by conversations, not an average of per-post costs", () => {
  const data = analyzePosts([personal({ id:"one", spend:10, messages:1 }), personal({ id:"two", spend:90, messages:30 })]);
  assert.equal(data.costPerConversation, 100 / 31);
  assert.notEqual(data.costPerConversation, (10 + 3) / 2);
  assert.equal(data.campaigns.length, 2);
  assert.ok(data.campaigns.every(row => row.campaign.source === "Entered"));
});

test("unknown campaign metrics stay unknown and zero conversations have no unit cost", () => {
  const noCampaign = analyzePosts([personal({reach:100,engagements:15})]);
  assert.equal(noCampaign.campaigns.length, 0);
  assert.equal(noCampaign.costPerConversation, null);
  assert.equal(noCampaign.engagementRate, 15);
  const zero = analyzePosts([personal({spend:99,messages:0,reach:0,engagements:0})]);
  assert.equal(zero.messages, 0);
  assert.equal(zero.spend, 99);
  assert.equal(zero.costPerConversation, null);
  assert.equal(zero.engagementRate, null);
  assert.equal(zero.ranked[0].costPerConversation, null);
});

test("manual overrides take precedence; invalid or edited sample data never borrows old metrics", () => {
  const post = samples.find(post => post.status === "Posted");
  assert.equal(campaignFor({...post,id:`${post.id}-browser`}).source, "Sample");
  assert.equal(campaignFor({...post,sample:false}), undefined);
  assert.equal(campaignFor({...post,reach:1}), undefined);
  assert.equal(campaignFor({...post,channel:"Other"}), undefined);
  assert.equal(campaignFor({...post,spend:100,messages:20}).results, 20);
  for (const overrides of [{spend:-1,messages:1},{spend:10},{spend:Infinity,messages:1},{spend:10,messages:1.5}]) assert.equal(campaignFor({...post,...overrides}),undefined);
});

test("engagement rate uses complete pairs and preserves real zeros", () => {
  const data = analyzePosts([personal({id:"one",reach:100,engagements:0}),personal({id:"two",reach:300,engagements:40}),personal({id:"partial",engagements:50})]);
  assert.equal(data.engagementRate,10);
  assert.equal(data.reach,400);
  assert.equal(data.engagements,90);
  assert.equal(data.missing,1);
  const empty=analyzePosts([]);
  assert.equal(empty.costPerConversation,null);
  assert.equal(empty.rows.length,0);
  assert.equal(empty.ranked.length,0);
});
