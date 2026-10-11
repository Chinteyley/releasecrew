import { spawn } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { withTool } from "../telemetry/neatlogs.js";
import { RecoverableError, withRetry } from "../tools/retry.js";
import type { StoryboardFrame } from "../types.js";

export async function renderTrailer(
  frames: string[],
  storyboard: StoryboardFrame[],
  outputPath: string,
  forceFirstFailure: boolean,
): Promise<{ fallbackUsed: boolean; attempts: number }> {
  mkdirSync(join(outputPath, ".."), { recursive: true });
  let attempts = 0;
  let fallbackUsed = false;
  await withRetry(
    {
      name: "ffmpeg.render",
      attempts: 3,
      baseDelayMs: 100,
      retryOn: (error) => error instanceof RecoverableError,
      kind: "TOOL",
    },
    async (attempt) => {
      attempts = attempt;
      if (forceFirstFailure && attempt === 1) {
        throw new RecoverableError("ffmpeg encoder 'neat-nonexistent' not found (demo render failure)");
      }
      try {
        await withTool("ffmpeg.encode", () => encode(frames, storyboard, outputPath, attempt === 3));
      } catch (error) {
        if (attempt < 3) {
          fallbackUsed = true;
          throw new RecoverableError(error instanceof Error ? error.message : String(error));
        }
        throw error;
      }
    },
  );
  return { fallbackUsed, attempts };
}

async function encode(
  frames: string[],
  storyboard: StoryboardFrame[],
  outputPath: string,
  simple: boolean,
): Promise<void> {
  const listPath = `${outputPath}.concat.txt`;
  const lines = frames.flatMap((frame, index) => {
    const duration = (storyboard[index]?.durationMs ?? 2500) / 1000;
    return [`file '${frame.replaceAll("'", "'\\''")}'`, `duration ${duration}`];
  });
  const last = frames.at(-1);
  if (last) lines.push(`file '${last.replaceAll("'", "'\\''")}'`);
  writeFileSync(listPath, `${lines.join("\n")}\n`);

  const args = simple
    ? ["-y", "-f", "concat", "-safe", "0", "-i", listPath, "-pix_fmt", "yuv420p", outputPath]
    : [
        "-y",
        "-f",
        "concat",
        "-safe",
        "0",
        "-i",
        listPath,
        "-c:v",
        "libx264",
        "-pix_fmt",
        "yuv420p",
        "-movflags",
        "+faststart",
        outputPath,
      ];
  await runFfmpeg(args);
}

function runFfmpeg(args: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn("ffmpeg", args, { stdio: ["ignore", "pipe", "pipe"] });
    let stderr = "";
    child.stderr.on("data", (chunk) => {
      stderr += String(chunk);
    });
    child.on("error", (error) => reject(error));
    child.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`ffmpeg exited ${code}: ${stderr.slice(-400)}`));
    });
  });
}
