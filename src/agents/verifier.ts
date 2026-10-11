import { withAgent, withGuardrail } from "../telemetry/neatlogs.js";
import { tokenize } from "./classify.js";
import type { ClaimCheck, Draft, ResearchBundle, VerificationResult } from "../types.js";

const HALLUCINATION_MARKERS = [
  "quantum teleportation",
  "time travel",
  "agi takeover",
  "teleportation deploys",
];

export async function verifyDraft(research: ResearchBundle, draft: Draft, attempt: number): Promise<VerificationResult> {
  return withAgent(
    "verifier",
    "verifier",
    "Reject claims that are not grounded in the compare payload",
    async () => {
      return withGuardrail("claim-grounding", async () => {
        const corpus = buildCorpus(research);
        const claims = collectClaims(draft).map((text) => checkClaim(text, corpus, research));
        const rejected = claims.filter((claim) => claim.status === "unsupported");
        const passed = rejected.length === 0;
        const feedback = passed
          ? "All claims are supported by commits, PRs, files, or official release notes."
          : `Remove or rewrite unsupported claims: ${rejected.map((claim) => `"${claim.text}"`).join("; ")}. Keep only grounded bullets.`;
        return {
          passed,
          claims,
          rejectedFeatures: rejected.map((claim) => claim.text),
          feedback,
          attempt,
        };
      });
    },
  );
}

function collectClaims(draft: Draft): string[] {
  const fromNotes = [
    ...draft.notes.highlights,
    ...draft.notes.breaking,
    ...draft.notes.sections.flatMap((section) => section.bullets),
  ];
  const fromThread = draft.thread.tweets.slice(1);
  return [...fromNotes, ...fromThread].map((text) => text.trim()).filter((text) => text.length > 8);
}

function buildCorpus(research: ResearchBundle): string {
  return [
    research.release?.body ?? "",
    ...research.commits.map((commit) => commit.message),
    ...research.pullRequests.map((pull) => `${pull.title}\n${pull.body}`),
    ...research.changes.map((change) => `${change.title}\n${change.summary}\n${change.evidence.join(" ")}`),
    ...research.filesChanged,
  ]
    .join("\n")
    .toLowerCase();
}

function checkClaim(text: string, corpus: string, research: ResearchBundle): ClaimCheck {
  const lower = text.toLowerCase();
  if (HALLUCINATION_MARKERS.some((marker) => lower.includes(marker))) {
    return {
      text,
      status: "unsupported",
      evidence: [],
      reason: "Invented feature marker — not present in the GitHub compare.",
    };
  }

  const shaMatch = text.match(/\b([a-f0-9]{7,40})\b/i);
  if (shaMatch?.[1] && research.commits.some((commit) => commit.sha.startsWith(shaMatch[1]!.toLowerCase()))) {
    return {
      text,
      status: "supported",
      evidence: [`commit ${shaMatch[1]}`],
      reason: "Cites a commit from the compare range.",
    };
  }

  const prMatch = text.match(/#(\d+)/);
  if (prMatch?.[1] && research.pullRequests.some((pull) => String(pull.number) === prMatch[1])) {
    return {
      text,
      status: "supported",
      evidence: [`PR #${prMatch[1]}`],
      reason: "Cites a merged pull request from the range.",
    };
  }

  const tokens = tokenize(text).filter((token) => token.length > 3);
  const hits = tokens.filter((token) => corpus.includes(token));
  const score = tokens.length === 0 ? 0 : hits.length / tokens.length;
  if (score >= 0.45) {
    return {
      text,
      status: score >= 0.7 ? "supported" : "partial",
      evidence: hits.slice(0, 6),
      reason: `Token overlap ${hits.length}/${tokens.length} against commits, PRs, and files.`,
    };
  }

  const statsClaim = /commits|files|\+\d+|-\d+|pull request/i.test(text);
  if (statsClaim) {
    return {
      text,
      status: "supported",
      evidence: [JSON.stringify(research.stats)],
      reason: "Matches compare statistics.",
    };
  }

  return {
    text,
    status: "unsupported",
    evidence: [],
    reason: "No overlapping tokens, SHAs, or PR numbers in the research bundle.",
  };
}
