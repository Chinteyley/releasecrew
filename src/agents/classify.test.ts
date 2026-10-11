import assert from "node:assert/strict";
import { test } from "node:test";
import { classifyCommit, sectionHeading, shortTitle } from "./classify.js";

test("classifies conventional commits", () => {
  assert.equal(classifyCommit("feat: add cookies"), "feat");
  assert.equal(classifyCommit("fix(router): handle slash"), "fix");
  assert.equal(classifyCommit("feat!: drop v1 API"), "breaking");
  assert.equal(classifyCommit("docs: readme"), "docs");
  assert.equal(classifyCommit("totally random"), "other");
});

test("section headings cover every kind", () => {
  for (const kind of ["feat", "fix", "breaking", "perf", "docs", "chore", "refactor", "other"] as const) {
    assert.ok(sectionHeading(kind).length > 0);
  }
});

test("strips conventional prefixes", () => {
  assert.equal(shortTitle("feat(http): stream bodies"), "stream bodies");
});
