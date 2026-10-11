import { assertNever, type ChangeKind } from "../types.js";

export function classifyCommit(message: string): ChangeKind {
  const first = message.split("\n")[0] ?? "";
  const lower = first.toLowerCase();
  if (
    /!$/.test(first.split(":")[0] ?? "") ||
    /break(ing)?(!|:)/i.test(first) ||
    lower.includes("breaking change")
  ) {
    return "breaking";
  }
  if (/^feat(\(|!|:|\/)/i.test(first) || lower.startsWith("add ") || lower.startsWith("introduce ")) return "feat";
  if (/^fix(\(|!|:|\/)/i.test(first) || lower.startsWith("fix ") || lower.includes("bug")) return "fix";
  if (/^perf(\(|!|:|\/)/i.test(first) || lower.includes("performance")) return "perf";
  if (/^docs(\(|!|:|\/)/i.test(first) || lower.startsWith("doc")) return "docs";
  if (/^refactor(\(|!|:|\/)/i.test(first)) return "refactor";
  if (/^(chore|ci|build|test)(\(|!|:|\/)/i.test(first)) return "chore";
  return "other";
}

export function sectionHeading(kind: ChangeKind): string {
  switch (kind) {
    case "feat":
      return "Features";
    case "fix":
      return "Fixes";
    case "breaking":
      return "Breaking changes";
    case "perf":
      return "Performance";
    case "docs":
      return "Docs";
    case "chore":
      return "Chores";
    case "refactor":
      return "Refactors";
    case "other":
      return "Other";
    default:
      return assertNever(kind, "ChangeKind");
  }
}

export function shortTitle(message: string): string {
  const first = (message.split("\n")[0] ?? "").trim();
  return first.replace(/^(feat|fix|perf|docs|chore|refactor|ci|build|test|breaking)(\(.+\))?(!)?:\s*/i, "");
}

export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[`*_#>[\]()]/g, " ")
    .split(/[^a-z0-9./-]+/)
    .map((token) => token.trim())
    .filter((token) => token.length > 2 && !STOP.has(token));
}

const STOP = new Set([
  "the",
  "and",
  "for",
  "with",
  "from",
  "this",
  "that",
  "into",
  "over",
  "added",
  "adds",
  "update",
  "updated",
  "version",
  "release",
  "changelog",
  "notes",
]);
