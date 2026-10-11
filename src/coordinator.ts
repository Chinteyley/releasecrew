import { join } from "node:path";
import { planRelease } from "./agents/planner.js";
import { produceMedia } from "./agents/media.js";
import { researchRelease } from "./agents/researcher.js";
import { verifyDraft } from "./agents/verifier.js";
import { writeReleaseStory } from "./agents/writer.js";
import { hasModelKey, hasNeatlogsKey, type CliOptions, buildGoal } from "./config.js";
import { writeKit } from "./kit/write.js";
import { describeLlm } from "./llm/provider.js";
import { isComplete, loadState, markComplete, newRunId, recordFailure, runDir, saveState } from "./state/store.js";
import { currentUsage, startLocalTrace, summarizeTrace } from "./telemetry/recorder.js";
import { flushTelemetry, initTelemetry, neatlog, withWorkflow } from "./telemetry/neatlogs.js";
import type { ReleaseKitManifest, RunState } from "./types.js";

export interface RunResult {
  state: RunState;
  manifest?: ReleaseKitManifest;
  summary: ReturnType<typeof summarizeTrace>;
}

export async function runCrew(options: CliOptions): Promise<RunResult> {
  const goal = buildGoal(options);
  const existing = options.resume
    ? loadState(options.resume)
    : options.runId
      ? loadState(options.runId)
      : undefined;
  const runId = existing?.runId ?? options.runId ?? newRunId();
  const localTracePath = join(runDir(runId), "trace.jsonl");
  startLocalTrace(localTracePath);

  const exported = await initTelemetry("releasecrew");
  const llm = describeLlm();

  const state: RunState =
    existing ??
    {
      runId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      goal,
      demoFailures: options.demoFailures,
      completed: [],
      failures: [],
      usage: currentUsage(),
      localTracePath,
    };

  state.goal = goal;
  state.demoFailures = options.demoFailures;
  saveState(state);

  try {
    const result = await withWorkflow("releasecrew.run", async () => {
      neatlog("Starting ReleaseCrew {repo} {tag} llm={llm} neatlogs={neatlogs}", {
        repo: goal.repo,
        tag: goal.tag,
        llm: llm.mode,
        neatlogs: exported.exported ? "exporting" : "local-only",
      });

      if (!isComplete(state, "plan")) {
        state.plan = await planRelease(goal);
        markComplete(state, "plan");
      }

      if (!isComplete(state, "research")) {
        try {
          state.research = await researchRelease(goal, options.demoFailures);
          if (options.demoFailures) {
            recordFailure(state, {
              step: "research",
              kind: "rate_limit",
              message: "GitHub API rate limit (demo 429) — retried and recovered",
              recovered: true,
            });
          }
          markComplete(state, "research");
        } catch (error) {
          recordFailure(state, {
            step: "research",
            kind: "rate_limit",
            message: error instanceof Error ? error.message : String(error),
            recovered: false,
          });
          throw error;
        }
      }

      if (!state.research) throw new Error("research bundle missing");

      if (!isComplete(state, "write") || !isComplete(state, "verify")) {
        let attempt = state.draft?.attempt ?? 0;
        let passed = false;
        while (!passed && attempt < 3) {
          attempt += 1;
          const inject = options.demoFailures && attempt === 1;
          state.draft = await writeReleaseStory(
            goal,
            state.research,
            state.verification?.feedback,
            attempt,
            inject,
          );
          state.verification = await verifyDraft(state.research, state.draft, attempt);
          passed = state.verification.passed;
          if (!passed) {
            recordFailure(state, {
              step: "verify",
              kind: "bad_model_output",
              message: state.verification.feedback,
              recovered: attempt < 3,
            });
          }
        }
        if (!state.verification?.passed) {
          throw new Error(`verifier rejected the draft after ${attempt} attempts`);
        }
        markComplete(state, "write");
        markComplete(state, "verify");
      }

      if (!isComplete(state, "media")) {
        if (!state.draft || !state.verification) throw new Error("draft or verification missing");
        try {
          state.media = await produceMedia(
            goal,
            state.research,
            state.draft,
            state.verification,
            runDir(runId),
            options.demoFailures,
          );
          if (options.demoFailures) {
            recordFailure(state, {
              step: "media",
              kind: "render_failure",
              message: "ffmpeg encoder failed on first attempt — recovered with retry/fallback",
              recovered: true,
            });
          }
          markComplete(state, "media");
        } catch (error) {
          recordFailure(state, {
            step: "media",
            kind: "render_failure",
            message: error instanceof Error ? error.message : String(error),
            recovered: false,
          });
          throw error;
        }
      }

      const manifest = writeKit(state);
      markComplete(state, "assemble");
      state.usage = currentUsage();
      saveState(state);
      return { state, manifest, summary: summarizeTrace() };
    });
    return result;
  } finally {
    await flushTelemetry();
  }
}

export function integrationStatus(): Record<string, string> {
  return {
    neatlogs: hasNeatlogsKey() ? "api-key-present" : "local-traces-only (set NEATLOGS_API_KEY)",
    llm: hasModelKey() ? describeLlm().provider : "heuristic fallback (no model key)",
    github: process.env.GITHUB_TOKEN || process.env.GH_TOKEN ? "authenticated" : "public-unauthenticated",
    cfo: "docs/business-plan-inputs.md ready; paste into cfo.ai after owner signup",
    entire: "dev-workflow + evidence/entire (see README)",
  };
}
