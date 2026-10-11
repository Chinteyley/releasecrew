import { z } from "zod";
import { detectedModelKeys, envFlag, hasModelKey } from "../config.js";
import { addUsage } from "../telemetry/recorder.js";
import { withLlm } from "../telemetry/neatlogs.js";
import { RecoverableError } from "../tools/retry.js";

export interface LlmCall<T> {
  name: string;
  system: string;
  user: string;
  schema: z.ZodType<T>;
}

export interface LlmResult<T> {
  value: T;
  provider: string;
  model: string;
  promptTokens: number;
  completionTokens: number;
}

export function describeLlm(): { provider: string; model: string; mode: "llm" | "heuristic" } {
  if (!hasModelKey()) {
    return { provider: "heuristic", model: "github-grounded-templates", mode: "heuristic" };
  }
  const keys = detectedModelKeys();
  if (envFlag("LITELLM_API_KEY")) {
    return { provider: "litellm", model: envFlag("RELEASECREW_MODEL") ?? "openai/gpt-4o-mini", mode: "llm" };
  }
  if (envFlag("OPENAI_API_KEY")) {
    return { provider: "openai", model: envFlag("RELEASECREW_MODEL") ?? "gpt-4o-mini", mode: "llm" };
  }
  if (envFlag("ANTHROPIC_API_KEY")) {
    return { provider: "anthropic", model: envFlag("RELEASECREW_MODEL") ?? "claude-sonnet-4-5", mode: "llm" };
  }
  if (envFlag("GOOGLE_GENERATIVE_AI_API_KEY")) {
    return { provider: "google", model: envFlag("RELEASECREW_MODEL") ?? "gemini-2.5-flash", mode: "llm" };
  }
  if (envFlag("AWS_ACCESS_KEY_ID")) {
    return { provider: "bedrock", model: envFlag("BEDROCK_MODEL_ID") ?? "anthropic.claude-sonnet-4-20250514-v1:0", mode: "llm" };
  }
  return { provider: keys[0] ?? "unknown", model: envFlag("RELEASECREW_MODEL") ?? "default", mode: "llm" };
}

export async function generateStructured<T>(call: LlmCall<T>): Promise<LlmResult<T>> {
  const info = describeLlm();
  return withLlm(call.name, async () => {
    if (info.mode === "heuristic") {
      throw new Error("heuristic mode does not call generateStructured");
    }
    const { generateText, Output } = await loadWrappedAi();
    const model = await resolveModel(info);
    const result = await generateText({
      model,
      system: call.system,
      prompt: `${call.user}\n\nRespond with JSON only.`,
      output: Output.object({ schema: call.schema }),
    });
    const usage = result.usage ?? {};
    const promptTokens = Number(usage.inputTokens ?? usage.promptTokens ?? 0);
    const completionTokens = Number(usage.outputTokens ?? usage.completionTokens ?? 0);
    addUsage({
      promptTokens,
      completionTokens,
      totalTokens: promptTokens + completionTokens,
    });
    const parsed = call.schema.parse(result.output ?? result.object ?? JSON.parse(result.text ?? "{}"));
    return {
      value: parsed,
      provider: info.provider,
      model: info.model,
      promptTokens,
      completionTokens,
    };
  });
}

export function estimateHeuristicUsage(chars: number): void {
  const promptTokens = Math.max(32, Math.round(chars / 8));
  const completionTokens = Math.max(16, Math.round(chars / 16));
  addUsage({ promptTokens, completionTokens, totalTokens: promptTokens + completionTokens });
}

async function loadWrappedAi(): Promise<{
  generateText: (options: Record<string, unknown>) => Promise<{
    text?: string;
    output?: unknown;
    object?: unknown;
    usage?: Record<string, number>;
  }>;
  Output: { object: (options: { schema: z.ZodType }) => unknown };
}> {
  const ai = await import("ai");
  try {
    const { wrapAISDK } = await import("neatlogs/ai");
    return wrapAISDK(ai) as never;
  } catch {
    return ai as never;
  }
}

async function resolveModel(info: { provider: string; model: string }): Promise<unknown> {
  switch (info.provider) {
    case "litellm": {
      const { createOpenAI } = await import("@ai-sdk/openai");
      const openai = createOpenAI({
        apiKey: envFlag("LITELLM_API_KEY"),
        baseURL: envFlag("LITELLM_BASE_URL") ?? "https://api.openai.com/v1",
      });
      return openai(info.model);
    }
    case "openai": {
      const { createOpenAI } = await import("@ai-sdk/openai");
      return createOpenAI({ apiKey: envFlag("OPENAI_API_KEY") })(info.model);
    }
    case "anthropic": {
      const { createAnthropic } = await import("@ai-sdk/anthropic");
      return createAnthropic({ apiKey: envFlag("ANTHROPIC_API_KEY") })(info.model);
    }
    case "google": {
      const { createGoogleGenerativeAI } = await import("@ai-sdk/google");
      return createGoogleGenerativeAI({ apiKey: envFlag("GOOGLE_GENERATIVE_AI_API_KEY") })(info.model);
    }
    case "bedrock": {
      const { createAmazonBedrock } = await import("@ai-sdk/amazon-bedrock");
      return createAmazonBedrock({
        region: envFlag("AWS_REGION") ?? "us-east-1",
      })(info.model);
    }
    default:
      throw new RecoverableError(`unsupported LLM provider: ${info.provider}`);
  }
}
