import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import type { RecordedFailure, RunState, StepName } from "../types.js";

export function runDir(runId: string): string {
  return join(process.cwd(), ".releasecrew", "runs", runId);
}

export function statePath(runId: string): string {
  return join(runDir(runId), "state.json");
}

export function loadState(runId: string): RunState | undefined {
  try {
    return JSON.parse(readFileSync(statePath(runId), "utf8")) as RunState;
  } catch {
    return undefined;
  }
}

export function saveState(state: RunState): void {
  state.updatedAt = new Date().toISOString();
  const path = statePath(state.runId);
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, `${JSON.stringify(state, null, 2)}\n`);
}

export function markComplete(state: RunState, step: StepName): void {
  if (!state.completed.includes(step)) {
    state.completed.push(step);
  }
  saveState(state);
}

export function recordFailure(
  state: RunState,
  failure: Omit<RecordedFailure, "at"> & { at?: string },
): void {
  state.failures.push({
    ...failure,
    at: failure.at ?? new Date().toISOString(),
  });
  saveState(state);
}

export function isComplete(state: RunState, step: StepName): boolean {
  return state.completed.includes(step);
}

export function newRunId(): string {
  const stamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d+Z$/, "Z");
  const rand = Math.random().toString(36).slice(2, 8);
  return `rc-${stamp}-${rand}`;
}
