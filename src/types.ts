export type ChangeKind =
  | "feat"
  | "fix"
  | "breaking"
  | "perf"
  | "docs"
  | "chore"
  | "refactor"
  | "other";

export type StepName = "plan" | "research" | "write" | "verify" | "media" | "assemble";

export type FailureKind = "rate_limit" | "bad_model_output" | "render_failure" | "tool_error";

export interface Goal {
  repo: string;
  owner: string;
  name: string;
  tag: string;
  from?: string;
  outputDir: string;
}

export interface PlanStep {
  id: string;
  agent: Exclude<StepName, "assemble"> | "coordinator";
  title: string;
  detail: string;
}

export interface Plan {
  goal: string;
  steps: PlanStep[];
  risks: string[];
}

export interface CommitSummary {
  sha: string;
  message: string;
  author: string;
  url: string;
}

export interface PullSummary {
  number: number;
  title: string;
  body: string;
  url: string;
  files: string[];
}

export interface IssueSummary {
  number: number;
  title: string;
  url: string;
}

export interface ChangeItem {
  id: string;
  kind: ChangeKind;
  title: string;
  summary: string;
  prNumber?: number;
  commitShas: string[];
  files: string[];
  links: string[];
  evidence: string[];
}

export interface ResearchBundle {
  repo: string;
  tag: string;
  compareRange: string;
  previousTag?: string;
  release?: {
    name: string;
    body: string;
    url: string;
    publishedAt: string;
  };
  commits: CommitSummary[];
  pullRequests: PullSummary[];
  issues: IssueSummary[];
  filesChanged: string[];
  stats: {
    commits: number;
    files: number;
    additions: number;
    deletions: number;
    pullRequests: number;
  };
  changes: ChangeItem[];
}

export interface ReleaseNotes {
  title: string;
  highlights: string[];
  sections: Array<{ heading: string; bullets: string[] }>;
  breaking: string[];
  markdown: string;
}

export interface LaunchThread {
  tweets: string[];
}

export interface Draft {
  notes: ReleaseNotes;
  thread: LaunchThread;
  attempt: number;
  provider: string;
  model: string;
}

export type ClaimStatus = "supported" | "unsupported" | "partial";

export interface ClaimCheck {
  text: string;
  status: ClaimStatus;
  evidence: string[];
  reason: string;
}

export interface VerificationResult {
  passed: boolean;
  claims: ClaimCheck[];
  rejectedFeatures: string[];
  feedback: string;
  attempt: number;
}

export interface StoryboardFrame {
  index: number;
  title: string;
  body: string;
  durationMs: number;
}

export interface MediaKit {
  storyboard: StoryboardFrame[];
  frames: string[];
  videoPath: string;
  fallbackUsed: boolean;
  renderAttempts: number;
}

export interface RecordedFailure {
  step: StepName;
  kind: FailureKind;
  message: string;
  recovered: boolean;
  at: string;
}

export interface TokenUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

export interface SpanRecord {
  id: string;
  parentId?: string;
  kind: string;
  name: string;
  startedAt: string;
  endedAt?: string;
  durationMs?: number;
  status: "ok" | "error" | "retry";
  attributes: Record<string, string | number | boolean>;
  error?: string;
}

export interface RunState {
  runId: string;
  createdAt: string;
  updatedAt: string;
  goal: Goal;
  demoFailures: boolean;
  completed: StepName[];
  plan?: Plan;
  research?: ResearchBundle;
  draft?: Draft;
  verification?: VerificationResult;
  media?: MediaKit;
  failures: RecordedFailure[];
  usage: TokenUsage;
  localTracePath: string;
}

export interface ReleaseKitManifest {
  runId: string;
  repo: string;
  tag: string;
  notes: string;
  thread: string;
  trailer: string;
  evidence: string;
  recoveredFailures: RecordedFailure[];
  verification: {
    passed: boolean;
    supportedClaims: number;
    rejectedClaims: number;
  };
}

export function assertNever(value: never, label: string): never {
  throw new Error(`unhandled ${label}: ${String(value)}`);
}
