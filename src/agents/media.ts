import { join } from "node:path";
import { withAgent } from "../telemetry/neatlogs.js";
import { buildStoryboard, writePpmFrames } from "../media/frames.js";
import { renderTrailer } from "../media/render.js";
import type { Draft, Goal, MediaKit, ResearchBundle, VerificationResult } from "../types.js";

export async function produceMedia(
  goal: Goal,
  research: ResearchBundle,
  draft: Draft,
  verification: VerificationResult,
  workDir: string,
  demoFailures: boolean,
): Promise<MediaKit> {
  return withAgent("media", "media", "Turn verified copy into a launch trailer", async () => {
    const storyboard = buildStoryboard(goal, research, draft, verification);
    const frameDir = join(workDir, "frames");
    const frames = writePpmFrames(frameDir, storyboard);
    const videoPath = join(workDir, "trailer.mp4");
    const result = await renderTrailer(frames, storyboard, videoPath, demoFailures);
    return {
      storyboard,
      frames,
      videoPath,
      fallbackUsed: result.fallbackUsed || demoFailures,
      renderAttempts: result.attempts,
    };
  });
}
