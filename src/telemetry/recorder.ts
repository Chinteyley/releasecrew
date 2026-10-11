import { appendFileSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import type { SpanRecord, TokenUsage } from "../types.js";

interface ActiveSpan {
  record: SpanRecord;
}

const stack: ActiveSpan[] = [];
let records: SpanRecord[] = [];
let usage: TokenUsage = { promptTokens: 0, completionTokens: 0, totalTokens: 0 };
let tracePath = "";
let sequence = 0;

export function startLocalTrace(path: string): void {
  records = [];
  usage = { promptTokens: 0, completionTokens: 0, totalTokens: 0 };
  sequence = 0;
  tracePath = path;
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, "");
}

export function addUsage(delta: Partial<TokenUsage>): void {
  usage = {
    promptTokens: usage.promptTokens + (delta.promptTokens ?? 0),
    completionTokens: usage.completionTokens + (delta.completionTokens ?? 0),
    totalTokens: usage.totalTokens + (delta.totalTokens ?? 0),
  };
}

export function currentUsage(): TokenUsage {
  return { ...usage };
}

export function currentSpans(): SpanRecord[] {
  return [...records];
}

export function summarizeTrace(): {
  spans: number;
  errors: number;
  retries: number;
  durationMs: number;
  usage: TokenUsage;
} {
  const durationMs = records.reduce((sum, span) => sum + (span.durationMs ?? 0), 0);
  return {
    spans: records.length,
    errors: records.filter((span) => span.status === "error").length,
    retries: records.filter((span) => {
      const attempt = span.name.match(/attempt_(\d+)/);
      return span.status === "retry" || (attempt !== null && Number(attempt[1]) > 1);
    }).length,
    durationMs,
    usage: currentUsage(),
  };
}

export async function traceSpan<T>(
  options: {
    kind: string;
    name: string;
    attributes?: Record<string, string | number | boolean>;
  },
  fn: () => Promise<T>,
): Promise<T> {
  const parent = stack.at(-1);
  const id = `span_${++sequence}`;
  const record: SpanRecord = {
    id,
    parentId: parent?.record.id,
    kind: options.kind,
    name: options.name,
    startedAt: new Date().toISOString(),
    status: "ok",
    attributes: options.attributes ?? {},
  };
  stack.push({ record });
  const started = Date.now();
  try {
    const result = await fn();
    finish(record, started, "ok");
    return result;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    record.error = message;
    finish(record, started, /retry|rate limit|attempt/i.test(message) ? "retry" : "error");
    throw error;
  } finally {
    stack.pop();
  }
}

function finish(record: SpanRecord, started: number, status: SpanRecord["status"]): void {
  record.endedAt = new Date().toISOString();
  record.durationMs = Date.now() - started;
  record.status = status;
  records.push(record);
  if (tracePath) {
    appendFileSync(tracePath, `${JSON.stringify(record)}\n`);
  }
}
