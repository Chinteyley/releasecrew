import { mkdirSync } from "node:fs";
import { resolve } from "node:path";
import type { Goal } from "./types.js";

export interface CliOptions {
  repo: string;
  tag: string;
  from?: string;
  out: string;
  runId?: string;
  resume?: string;
  demoFailures: boolean;
  compareBaseline: boolean;
}

export function parseRepo(repo: string): { owner: string; name: string } {
  const cleaned = repo.replace(/^https?:\/\/github\.com\//, "").replace(/\.git$/, "");
  const [owner, name] = cleaned.split("/");
  if (!owner || !name) {
    throw new Error(`repo must look like owner/name, got ${repo}`);
  }
  return { owner, name };
}

export function buildGoal(options: CliOptions): Goal {
  const { owner, name } = parseRepo(options.repo);
  const outputDir = resolve(options.out);
  mkdirSync(outputDir, { recursive: true });
  return {
    repo: `${owner}/${name}`,
    owner,
    name,
    tag: options.tag,
    from: options.from,
    outputDir,
  };
}

export function envFlag(name: string): string | undefined {
  const value = process.env[name]?.trim();
  return value ? value : undefined;
}

export function detectedModelKeys(): string[] {
  const keys = [
    "OPENAI_API_KEY",
    "ANTHROPIC_API_KEY",
    "GOOGLE_GENERATIVE_AI_API_KEY",
    "LITELLM_API_KEY",
    "AWS_ACCESS_KEY_ID",
  ] as const;
  return keys.filter((key) => Boolean(envFlag(key)));
}

export function hasModelKey(): boolean {
  return detectedModelKeys().length > 0;
}

export function hasNeatlogsKey(): boolean {
  return Boolean(envFlag("NEATLOGS_API_KEY"));
}
