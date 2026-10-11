import { z } from "zod";
import { describeLlm, estimateHeuristicUsage, generateStructured } from "../llm/provider.js";
import { withAgent } from "../telemetry/neatlogs.js";
import { sectionHeading } from "./classify.js";
import type { ChangeItem, ChangeKind, Draft, Goal, LaunchThread, ReleaseNotes, ResearchBundle } from "../types.js";

const draftSchema = z.object({
  title: z.string(),
  highlights: z.array(z.string()),
  sections: z.array(z.object({ heading: z.string(), bullets: z.array(z.string()) })),
  breaking: z.array(z.string()),
  tweets: z.array(z.string()),
});

export async function writeReleaseStory(
  goal: Goal,
  research: ResearchBundle,
  feedback?: string,
  attempt = 1,
  injectHallucination = false,
): Promise<Draft> {
  return withAgent(
    "writer",
    "writer",
    `Draft release notes and a launch thread for ${goal.repo}@${goal.tag}`,
    async () => {
      const llm = describeLlm();
      const base =
        llm.mode === "llm"
          ? await llmDraft(goal, research, feedback)
          : heuristicDraft(goal, research, feedback);
      const notes = injectHallucination ? poisonNotes(base.notes) : base.notes;
      const thread = injectHallucination ? poisonThread(base.thread) : base.thread;
      estimateHeuristicUsage(notes.markdown.length + thread.tweets.join("").length);
      return {
        notes,
        thread,
        attempt,
        provider: llm.provider,
        model: llm.model,
      };
    },
  );
}

async function llmDraft(
  goal: Goal,
  research: ResearchBundle,
  feedback?: string,
): Promise<{ notes: ReleaseNotes; thread: LaunchThread }> {
  const result = await generateStructured({
    name: "writer.draft",
    schema: draftSchema,
    system:
      "You write release notes. Only mention changes that appear in the structured change list. Cite PR numbers or short SHAs. No invented features.",
    user: JSON.stringify({
      repo: goal.repo,
      tag: goal.tag,
      range: research.compareRange,
      stats: research.stats,
      changes: research.changes.slice(0, 30),
      officialRelease: research.release?.body?.slice(0, 2000),
      verifierFeedback: feedback ?? null,
    }),
  });
  return {
    notes: toNotes(goal, research, result.value),
    thread: { tweets: result.value.tweets.map(trimTweet) },
  };
}

function heuristicDraft(
  goal: Goal,
  research: ResearchBundle,
  feedback?: string,
): { notes: ReleaseNotes; thread: LaunchThread } {
  const allowed = research.changes.filter((change) => change.title.trim().length > 0);
  const filtered = feedback
    ? allowed.filter((change) => !feedback.toLowerCase().includes(change.title.toLowerCase()) || /keep|supported/.test(feedback))
    : allowed;
  const source = filtered.length > 0 ? filtered : allowed;
  const grouped = groupByKind(source);
  const highlights = source.slice(0, 4).map((change) => formatBullet(change));
  const sections = [...grouped.entries()]
    .filter(([, items]) => items.length > 0)
    .map(([kind, items]) => ({
      heading: sectionHeading(kind),
      bullets: items.slice(0, 8).map(formatBullet),
    }));
  const breaking = source.filter((change) => change.kind === "breaking").map(formatBullet);
  const notes = toNotes(goal, research, {
    title: `${goal.name} ${goal.tag}`,
    highlights,
    sections,
    breaking,
    tweets: [],
  });
  const thread = {
    tweets: [
      `${goal.repo} ${goal.tag} is out. ${research.stats.commits} commits, ${research.stats.files} files, +${research.stats.additions}/-${research.stats.deletions}.`,
      ...highlights.slice(0, 3).map((line) => trimTweet(line)),
      `Notes, thread, and trailer were assembled by ReleaseCrew from ${research.compareRange}.`,
    ].map(trimTweet),
  };
  return { notes, thread };
}

function toNotes(
  goal: Goal,
  research: ResearchBundle,
  draft: { title: string; highlights: string[]; sections: Array<{ heading: string; bullets: string[] }>; breaking: string[]; tweets: string[] },
): ReleaseNotes {
  const lines = [
    `# ${draft.title}`,
    "",
    `Source: [${goal.repo}](https://github.com/${goal.repo}) \`${research.compareRange}\``,
    research.release?.url ? `Official release: ${research.release.url}` : "",
    "",
    "## Highlights",
    ...draft.highlights.map((item) => `- ${item}`),
    "",
    ...draft.sections.flatMap((section) => [`## ${section.heading}`, ...section.bullets.map((item) => `- ${item}`), ""]),
  ];
  if (draft.breaking.length > 0) {
    lines.push("## Breaking changes", ...draft.breaking.map((item) => `- ${item}`), "");
  }
  lines.push(
    "## Stats",
    `- Commits: ${research.stats.commits}`,
    `- Files: ${research.stats.files}`,
    `- Diff: +${research.stats.additions} / -${research.stats.deletions}`,
    `- Pull requests: ${research.stats.pullRequests}`,
    "",
  );
  return {
    title: draft.title,
    highlights: draft.highlights,
    sections: draft.sections,
    breaking: draft.breaking,
    markdown: lines.filter((line, index, all) => !(line === "" && all[index - 1] === "")).join("\n"),
  };
}

function groupByKind(changes: ChangeItem[]): Map<ChangeKind, ChangeItem[]> {
  const map = new Map<ChangeKind, ChangeItem[]>();
  for (const change of changes) {
    const list = map.get(change.kind) ?? [];
    list.push(change);
    map.set(change.kind, list);
  }
  return map;
}

function formatBullet(change: ChangeItem): string {
  const cite = change.prNumber
    ? `(#${change.prNumber})`
    : change.commitShas[0]
      ? `(${change.commitShas[0].slice(0, 7)})`
      : "";
  return `${change.title} ${cite}`.trim();
}

function trimTweet(text: string): string {
  return text.length <= 270 ? text : `${text.slice(0, 267)}...`;
}

function poisonNotes(notes: ReleaseNotes): ReleaseNotes {
  const fake = "Added one-click quantum teleportation deploys to every region";
  return {
    ...notes,
    highlights: [fake, ...notes.highlights],
    markdown: `${notes.markdown}\n\n- ${fake}\n`,
  };
}

function poisonThread(thread: LaunchThread): LaunchThread {
  return {
    tweets: ["We also shipped quantum teleportation deploys. No, really.", ...thread.tweets],
  };
}
