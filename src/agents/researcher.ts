import { GithubClient } from "../tools/github.js";
import { withAgent, withTool } from "../telemetry/neatlogs.js";
import { classifyCommit, shortTitle } from "./classify.js";
import type { ChangeItem, Goal, ResearchBundle } from "../types.js";

export async function researchRelease(goal: Goal, demoFailures: boolean): Promise<ResearchBundle> {
  return withAgent(
    "researcher",
    "researcher",
    `Build a structured change list for ${goal.repo}@${goal.tag}`,
    async () => {
      const github = new GithubClient({ demoFailures });
      const release = await github.releaseByTag(goal.owner, goal.name, goal.tag);
      const previousTag = goal.from ?? (await inferPreviousTag(github, goal, release?.tag ?? goal.tag));
      const compare = previousTag
        ? await github.compare(goal.owner, goal.name, previousTag, goal.tag)
        : { commits: [], files: [], additions: 0, deletions: 0, htmlUrl: "" };

      const pulls = await withTool("github.searchPulls", async () => {
        if (!previousTag) return [];
        return github.searchPulls(goal.owner, goal.name, `${previousTag}..${goal.tag}`);
      }).catch(() => []);

      const changes = buildChanges(goal, compare.commits, pulls);
      const issues = pulls
        .flatMap((pull) => {
          const body = String(pull.body ?? "");
          const matches = body.match(/#(\d+)/g) ?? [];
          return matches.slice(0, 3).map((match) => ({
            number: Number(match.slice(1)),
            title: `Linked from PR #${pull.number}`,
            url: `https://github.com/${goal.repo}/issues/${match.slice(1)}`,
          }));
        })
        .slice(0, 12);

      return {
        repo: goal.repo,
        tag: goal.tag,
        compareRange: previousTag ? `${previousTag}...${goal.tag}` : goal.tag,
        previousTag,
        release,
        commits: compare.commits.map((commit) => ({
          sha: commit.sha,
          message: commit.message,
          author: commit.author,
          url: commit.url,
        })),
        pullRequests: pulls.map((pull) => ({
          number: Number(pull.number),
          title: String(pull.title ?? ""),
          body: String(pull.body ?? "").slice(0, 1200),
          url: String(pull.html_url ?? `https://github.com/${goal.repo}/pull/${pull.number}`),
          files: [],
        })),
        issues,
        filesChanged: compare.files.map((file) => file.filename),
        stats: {
          commits: compare.commits.length,
          files: compare.files.length,
          additions: compare.additions,
          deletions: compare.deletions,
          pullRequests: pulls.length,
        },
        changes,
      };
    },
  );
}

async function inferPreviousTag(
  github: GithubClient,
  goal: Goal,
  currentTag: string,
): Promise<string | undefined> {
  const releases = await github.listReleases(goal.owner, goal.name);
  const index = releases.findIndex((item) => item.tag === currentTag);
  if (index >= 0) return releases[index + 1]?.tag;
  return releases.find((item) => item.tag !== currentTag)?.tag;
}

function buildChanges(
  goal: Goal,
  commits: Array<{ sha: string; message: string; url: string }>,
  pulls: Array<Record<string, unknown>>,
): ChangeItem[] {
  const fromCommits: ChangeItem[] = commits.slice(0, 40).map((commit) => ({
    id: `c-${commit.sha.slice(0, 7)}`,
    kind: classifyCommit(commit.message),
    title: shortTitle(commit.message),
    summary: (commit.message.split("\n")[0] ?? "").trim(),
    commitShas: [commit.sha],
    files: [],
    links: [commit.url],
    evidence: [`commit ${commit.sha.slice(0, 7)}: ${(commit.message.split("\n")[0] ?? "").trim()}`],
  }));

  const fromPulls: ChangeItem[] = pulls.slice(0, 20).map((pull) => {
    const number = Number(pull.number);
    const title = String(pull.title ?? "");
    return {
      id: `pr-${number}`,
      kind: classifyCommit(title),
      title,
      summary: String(pull.body ?? title).split("\n")[0] ?? title,
      prNumber: number,
      commitShas: [],
      files: [],
      links: [String(pull.html_url ?? `https://github.com/${goal.repo}/pull/${number}`)],
      evidence: [`PR #${number}: ${title}`],
    };
  });

  const merged = [...fromPulls, ...fromCommits];
  const seen = new Set<string>();
  return merged.filter((item) => {
    const key = item.title.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
