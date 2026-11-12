import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { test } from "node:test";
import { refreshSamplePosts, samplePhotoFor, sampleWorkspacePosts } from "../lib/demo-workspace.ts";

test("candle posts have distinct existing gallery photos, including browser-scoped IDs", () => {
  const posts = sampleWorkspacePosts();
  const planned = posts.filter(post => post.status === "Planned");
  assert.equal(planned.length, 7);
  assert.equal(new Set(planned.map(samplePhotoFor)).size, 7);
  for (const post of posts) {
    const photo = samplePhotoFor(post);
    assert.ok(photo?.startsWith("/sample/candles/"));
    assert.ok(existsSync(`public${photo}`));
    assert.equal(samplePhotoFor({ ...post, id: `${post.id}-browser` }), photo);
    assert.equal(samplePhotoFor({ ...post, sample: false }), undefined);
  }
});

test("old food samples are replaced while personal posts are preserved", () => {
  const personal = { id: "my-post", text: "My caption", channel: "Facebook", date: "", status: "Draft" };
  const updated = refreshSamplePosts([{ ...personal, id: "sample-plan", sample: true }, personal]);
  assert.deepEqual(updated.find(post => post.id === personal.id), personal);
  assert.equal(updated.length, sampleWorkspacePosts().length + 1);
  assert.ok(updated.filter(post => post.sample).every(post => post.id.startsWith("elle-")));
});
