import assert from "node:assert/strict";
import { test } from "node:test";
import { verifyDraft } from "./verifier.js";
import type { Draft, ResearchBundle } from "../types.js";

function bundle(): ResearchBundle {
  return {
    repo: "acme/widget",
    tag: "v2.0.0",
    compareRange: "v1.9.0...v2.0.0",
    commits: [
      {
        sha: "abcdef1234567890",
        message: "feat: add cookie jar",
        author: "ada",
        url: "https://example.com/abcdef1",
      },
    ],
    pullRequests: [{ number: 42, title: "Add cookie jar", body: "Stores cookies", url: "https://example.com/42", files: [] }],
    issues: [],
    filesChanged: ["src/cookie.ts"],
    stats: { commits: 1, files: 1, additions: 10, deletions: 1, pullRequests: 1 },
    changes: [
      {
        id: "pr-42",
        kind: "feat",
        title: "Add cookie jar",
        summary: "Stores cookies",
        prNumber: 42,
        commitShas: ["abcdef1234567890"],
        files: ["src/cookie.ts"],
        links: ["https://example.com/42"],
        evidence: ["PR #42: Add cookie jar"],
      },
    ],
  };
}

function draft(highlights: string[]): Draft {
  return {
    attempt: 1,
    provider: "heuristic",
    model: "test",
    notes: {
      title: "v2",
      highlights,
      sections: [],
      breaking: [],
      markdown: highlights.join("\n"),
    },
    thread: { tweets: ["acme/widget v2.0.0 is out."] },
  };
}

test("accepts grounded claims", async () => {
  const result = await verifyDraft(bundle(), draft(["Add cookie jar (#42)"]), 1);
  assert.equal(result.passed, true);
  assert.equal(result.claims[0]?.status, "supported");
});

test("rejects hallucinated features and asks the writer to retry", async () => {
  const result = await verifyDraft(
    bundle(),
    draft(["Added one-click quantum teleportation deploys to every region"]),
    1,
  );
  assert.equal(result.passed, false);
  assert.match(result.feedback, /quantum teleportation/i);
});
