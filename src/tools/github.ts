import { envFlag } from "../config.js";
import { withTool } from "../telemetry/neatlogs.js";
import { RecoverableError, isRateLimitError, withRetry } from "./retry.js";

export interface CompareFile {
  filename: string;
  status: string;
  additions: number;
  deletions: number;
}

export interface CompareResult {
  commits: Array<{ sha: string; message: string; author: string; url: string }>;
  files: CompareFile[];
  additions: number;
  deletions: number;
  htmlUrl: string;
}

export interface ReleaseInfo {
  tag: string;
  name: string;
  body: string;
  url: string;
  publishedAt: string;
}

interface GithubClientOptions {
  demoFailures?: boolean;
}

export class GithubClient {
  private readonly token?: string;
  private demoRateLimitPending: boolean;

  constructor(options: GithubClientOptions = {}) {
    this.token = envFlag("GITHUB_TOKEN") ?? envFlag("GH_TOKEN");
    this.demoRateLimitPending = Boolean(options.demoFailures);
  }

  async releaseByTag(owner: string, repo: string, tag: string): Promise<ReleaseInfo | undefined> {
    const encoded = encodeURIComponent(tag);
    const data = await this.request<Record<string, unknown> | undefined>(
      `/repos/${owner}/${repo}/releases/tags/${encoded}`,
      { optional: true },
    );
    if (!data) return undefined;
    return {
      tag,
      name: String(data.name ?? tag),
      body: String(data.body ?? ""),
      url: String(data.html_url ?? `https://github.com/${owner}/${repo}/releases/tag/${tag}`),
      publishedAt: String(data.published_at ?? ""),
    };
  }

  async listReleases(owner: string, repo: string): Promise<ReleaseInfo[]> {
    const data = await this.request<Array<Record<string, unknown>>>(`/repos/${owner}/${repo}/releases?per_page=20`);
    return data.map((item) => ({
      tag: String(item.tag_name ?? ""),
      name: String(item.name ?? item.tag_name ?? ""),
      body: String(item.body ?? ""),
      url: String(item.html_url ?? ""),
      publishedAt: String(item.published_at ?? ""),
    }));
  }

  async compare(owner: string, repo: string, base: string, head: string): Promise<CompareResult> {
    const data = await this.request<Record<string, unknown>>(
      `/repos/${owner}/${repo}/compare/${encodeURIComponent(base)}...${encodeURIComponent(head)}?per_page=100`,
    );
    const commits = Array.isArray(data.commits) ? data.commits : [];
    const files = Array.isArray(data.files) ? data.files : [];
    const stats = (data as { stats?: { additions?: number; deletions?: number } }).stats;
    return {
      commits: commits.map((commit) => {
        const row = commit as {
          sha: string;
          html_url?: string;
          commit?: { message?: string; author?: { name?: string } };
        };
        return {
          sha: row.sha,
          message: row.commit?.message ?? "",
          author: row.commit?.author?.name ?? "unknown",
          url: row.html_url ?? `https://github.com/${owner}/${repo}/commit/${row.sha}`,
        };
      }),
      files: files.map((file) => {
        const row = file as CompareFile;
        return {
          filename: row.filename,
          status: row.status,
          additions: row.additions,
          deletions: row.deletions,
        };
      }),
      additions: stats?.additions ?? files.reduce((sum, file) => sum + Number((file as CompareFile).additions ?? 0), 0),
      deletions: stats?.deletions ?? files.reduce((sum, file) => sum + Number((file as CompareFile).deletions ?? 0), 0),
      htmlUrl: String(data.html_url ?? ""),
    };
  }

  async searchPulls(owner: string, repo: string, queryExtra: string): Promise<Array<Record<string, unknown>>> {
    const q = encodeURIComponent(`repo:${owner}/${repo} is:pr is:merged ${queryExtra}`);
    const data = await this.request<{ items?: Array<Record<string, unknown>> }>(
      `/search/issues?q=${q}&per_page=20`,
    );
    return data.items ?? [];
  }

  private async request<T>(path: string, options: { optional?: boolean } = {}): Promise<T> {
    return withTool(`github ${path.split("?")[0]}`, () =>
      withRetry(
        {
          name: `github${path.split("?")[0]?.replaceAll("/", "_")}`,
          attempts: 4,
          baseDelayMs: 250,
          retryOn: isRateLimitError,
        },
        async (attempt) => {
          if (this.demoRateLimitPending && attempt === 1) {
            this.demoRateLimitPending = false;
            throw new RecoverableError("GitHub API rate limit (demo 429)", 200);
          }
          const headers: Record<string, string> = {
            Accept: "application/vnd.github+json",
            "User-Agent": "releasecrew-neathack",
            "X-GitHub-Api-Version": "2022-11-28",
          };
          if (this.token) headers.Authorization = `Bearer ${this.token}`;
          const response = await fetch(`https://api.github.com${path}`, { headers });
          if (response.status === 404 && options.optional) {
            return undefined as T;
          }
          if (response.status === 403 || response.status === 429) {
            const retryAfter = Number(response.headers.get("retry-after") ?? "1") * 1000;
            throw new RecoverableError(`GitHub API rate limit ${response.status}`, retryAfter || 1000);
          }
          if (!response.ok) {
            const body = await response.text();
            throw new Error(`GitHub ${response.status} ${path}: ${body.slice(0, 240)}`);
          }
          return (await response.json()) as T;
        },
      ),
    );
  }
}
