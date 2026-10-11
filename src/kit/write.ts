import { copyFileSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import type { ReleaseKitManifest, RunState } from "../types.js";
import { currentSpans, summarizeTrace } from "../telemetry/recorder.js";

export function writeKit(state: RunState): ReleaseKitManifest {
  if (!state.draft || !state.verification || !state.media || !state.research || !state.plan) {
    throw new Error("cannot assemble kit until plan, research, draft, verify, and media are complete");
  }
  mkdirSync(state.goal.outputDir, { recursive: true });
  const notes = join(state.goal.outputDir, "notes.md");
  const thread = join(state.goal.outputDir, "thread.txt");
  const trailer = join(state.goal.outputDir, "trailer.mp4");
  const evidence = join(state.goal.outputDir, "evidence.json");
  const storyboard = join(state.goal.outputDir, "storyboard.md");

  writeFileSync(notes, `${state.draft.notes.markdown}\n`);
  writeFileSync(thread, `${state.draft.thread.tweets.map((tweet, index) => `${index + 1}/ ${tweet}`).join("\n\n")}\n`);
  copyFileSync(state.media.videoPath, trailer);
  writeFileSync(
    storyboard,
    state.media.storyboard
      .map((frame) => `## ${frame.index + 1}. ${frame.title}\n\n${frame.body}\n`)
      .join("\n"),
  );

  const summary = summarizeTrace();
  const manifest: ReleaseKitManifest = {
    runId: state.runId,
    repo: state.goal.repo,
    tag: state.goal.tag,
    notes: "notes.md",
    thread: "thread.txt",
    trailer: "trailer.mp4",
    evidence: "evidence.json",
    recoveredFailures: state.failures.filter((failure) => failure.recovered),
    verification: {
      passed: state.verification.passed,
      supportedClaims: state.verification.claims.filter((claim) => claim.status !== "unsupported").length,
      rejectedClaims: state.verification.rejectedFeatures.length,
    },
  };

  writeFileSync(
    evidence,
    `${JSON.stringify(
      {
        manifest,
        plan: state.plan,
        research: {
          compareRange: state.research.compareRange,
          stats: state.research.stats,
          changeCount: state.research.changes.length,
          officialRelease: state.research.release,
        },
        draft: {
          attempt: state.draft.attempt,
          provider: state.draft.provider,
          model: state.draft.model,
        },
        verification: state.verification,
        media: {
          fallbackUsed: state.media.fallbackUsed,
          renderAttempts: state.media.renderAttempts,
          storyboard: state.media.storyboard,
        },
        failures: state.failures,
        usage: state.usage,
        trace: summary,
        spans: currentSpans(),
      },
      null,
      2,
    )}\n`,
  );
  return manifest;
}
