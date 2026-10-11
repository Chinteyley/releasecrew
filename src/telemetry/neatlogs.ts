import { envFlag, hasNeatlogsKey } from "../config.js";
import { traceSpan } from "./recorder.js";

type SpanKind = "WORKFLOW" | "AGENT" | "CHAIN" | "TOOL" | "RETRIEVER" | "GUARDRAIL";

interface NeatlogsApi {
  init: (options: {
    apiKey?: string;
    workflowName?: string;
    captureLogs?: boolean;
    tags?: string[];
    metadata?: Record<string, unknown>;
  }) => Promise<void>;
  span: <TArgs extends unknown[], TResult>(
    options: { kind: SpanKind; name?: string; role?: string; goal?: string; toolName?: string },
    fn: (...args: TArgs) => Promise<TResult> | TResult,
  ) => (...args: TArgs) => Promise<TResult>;
  trace: <T>(
    options: { name: string; kind?: string },
    fn: (span: { setAttribute: (key: string, value: string | number | boolean) => void }) => Promise<T> | T,
  ) => Promise<T>;
  log: (message: string, vars?: Record<string, unknown>) => void;
  flush: () => Promise<void>;
  shutdown: () => Promise<void>;
}

let sdk: NeatlogsApi | undefined;
let enabled = false;

export async function initTelemetry(workflowName: string): Promise<{ exported: boolean }> {
  try {
    if (sdk) {
      await sdk.flush().catch(() => undefined);
    }
    sdk = (await import("neatlogs")) as unknown as NeatlogsApi;
    await sdk.init({
      apiKey: envFlag("NEATLOGS_API_KEY"),
      workflowName,
      captureLogs: true,
      tags: ["releasecrew", "neathack"],
      metadata: { event: "neatHack-2026" },
    });
    enabled = true;
  } catch (error) {
    enabled = false;
    console.warn(
      `[neatlogs] SDK init skipped: ${error instanceof Error ? error.message : String(error)}. Local traces still record.`,
    );
  }
  return { exported: enabled && hasNeatlogsKey() };
}

export async function flushTelemetry(): Promise<void> {
  if (!sdk) return;
  await sdk.flush();
  await sdk.shutdown();
}

export function neatlog(message: string, vars?: Record<string, unknown>): void {
  sdk?.log(message, vars);
}

export async function withWorkflow<T>(name: string, fn: () => Promise<T>): Promise<T> {
  return wrap("WORKFLOW", name, fn);
}

export async function withAgent<T>(name: string, role: string, goal: string, fn: () => Promise<T>): Promise<T> {
  return wrap("AGENT", name, fn, { role, goal });
}

export async function withTool<T>(toolName: string, fn: () => Promise<T>): Promise<T> {
  return wrap("TOOL", toolName, fn, { toolName });
}

export async function withGuardrail<T>(name: string, fn: () => Promise<T>): Promise<T> {
  return wrap("GUARDRAIL", name, fn);
}

export async function withLlm<T>(name: string, fn: () => Promise<T>): Promise<T> {
  return traceSpan({ kind: "LLM", name }, async () => {
    if (!sdk) return fn();
    return sdk.trace({ name, kind: "LLM" }, fn);
  });
}

async function wrap<T>(
  kind: SpanKind,
  name: string,
  fn: () => Promise<T>,
  extra?: { role?: string; goal?: string; toolName?: string },
): Promise<T> {
  return traceSpan({ kind, name }, async () => {
    if (!sdk) return fn();
    const instrumented = sdk.span(
      { kind, name, role: extra?.role, goal: extra?.goal, toolName: extra?.toolName },
      fn,
    );
    return instrumented();
  });
}
