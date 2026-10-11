import { z } from "zod";
import { describeLlm, generateStructured, estimateHeuristicUsage } from "../llm/provider.js";
import { withAgent } from "../telemetry/neatlogs.js";
import type { Goal, Plan } from "../types.js";

const planSchema = z.object({
  goal: z.string(),
  steps: z.array(
    z.object({
      id: z.string(),
      agent: z.enum(["plan", "research", "write", "verify", "media", "coordinator"]),
      title: z.string(),
      detail: z.string(),
    }),
  ),
  risks: z.array(z.string()),
});

export async function planRelease(goal: Goal): Promise<Plan> {
  return withAgent(
    "planner",
    "planner",
    `Ship a verified release kit for ${goal.repo}@${goal.tag}`,
    async () => {
      const llm = describeLlm();
      if (llm.mode === "heuristic") {
        const plan = heuristicPlan(goal);
        estimateHeuristicUsage(JSON.stringify(plan).length);
        return plan;
      }
      const result = await generateStructured({
        name: "planner.decompose",
        schema: planSchema,
        system:
          "You are the planner for ReleaseCrew. Break a GitHub release-kit goal into concrete agent steps. Do not invent product features.",
        user: `Repo ${goal.repo}, tag ${goal.tag}, from ${goal.from ?? "previous release"}. Output a plan with research, write, verify, media, assemble.`,
      });
      return result.value;
    },
  );
}

function heuristicPlan(goal: Goal): Plan {
  return {
    goal: `Ship a verified changelog, X thread, and trailer for ${goal.repo} ${goal.tag}`,
    steps: [
      {
        id: "research",
        agent: "research",
        title: "Read the release range",
        detail: `Pull commits, compare ${goal.from ?? "previous tag"}...${goal.tag}, merged PRs, and linked issues via the GitHub API.`,
      },
      {
        id: "write",
        agent: "write",
        title: "Draft the release story",
        detail: "Turn the structured change list into notes.md and a launch thread. Every claim must cite a SHA or PR.",
      },
      {
        id: "verify",
        agent: "verify",
        title: "Ground every claim",
        detail: "Reject bullets that are not supported by the compare payload. Send the writer back if anything is invented.",
      },
      {
        id: "media",
        agent: "media",
        title: "Render the trailer",
        detail: "Storyboard verified copy into slides and encode trailer.mp4. Fall back if ffmpeg fails.",
      },
      {
        id: "assemble",
        agent: "coordinator",
        title: "Assemble the kit",
        detail: "Write notes.md, thread.txt, trailer.mp4, and evidence.json. Persist state so a failed run can resume.",
      },
    ],
    risks: [
      "GitHub API rate limits on unauthenticated compares",
      "Hallucinated features in the first writer pass",
      "ffmpeg encoder or font failures on the first render",
    ],
  };
}
