#!/usr/bin/env node
import { writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { config as loadEnv } from "dotenv";
import { integrationStatus, runCrew } from "./coordinator.js";
import type { CliOptions } from "./config.js";

loadEnv();

function printHelp(): void {
  console.log(`ReleaseCrew — ship a verified GitHub release kit

Usage:
  npx tsx src/cli.ts --repo owner/name --tag vX.Y.Z [options]

Options:
  --repo <owner/name>   GitHub repository
  --tag <tag>           Release tag to ship
  --from <tag>          Previous tag (default: previous GitHub release)
  --out <dir>           Output directory for the kit (default: ./output)
  --run-id <id>         Stable run id
  --resume <id>         Resume a previous run from .releasecrew/runs/<id>
  --demo-failures       Inject rate-limit, bad-draft, and render failures
  --compare-baseline    Also write a naive before-trace for neatlogs comparison
  --help                Show this help
`);
}

function parseArgs(argv: string[]): CliOptions & { help?: boolean } {
  const options: CliOptions = {
    repo: "",
    tag: "",
    out: "./output",
    demoFailures: false,
    compareBaseline: false,
  };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    const next = argv[i + 1];
    switch (arg) {
      case "--help":
      case "-h":
        return { ...options, help: true };
      case "--repo":
        options.repo = next ?? "";
        i += 1;
        break;
      case "--tag":
        options.tag = next ?? "";
        i += 1;
        break;
      case "--from":
        options.from = next;
        i += 1;
        break;
      case "--out":
        options.out = next ?? options.out;
        i += 1;
        break;
      case "--run-id":
        options.runId = next;
        i += 1;
        break;
      case "--resume":
        options.resume = next;
        i += 1;
        break;
      case "--demo-failures":
        options.demoFailures = true;
        break;
      case "--compare-baseline":
        options.compareBaseline = true;
        break;
      default:
        if (arg?.startsWith("-")) {
          throw new Error(`unknown flag ${arg}`);
        }
    }
  }
  return options;
}

async function main(): Promise<void> {
  const options = parseArgs(process.argv.slice(2));
  if (options.help) {
    printHelp();
    return;
  }
  if (!options.repo || !options.tag) {
    printHelp();
    process.exitCode = 1;
    return;
  }

  console.log("ReleaseCrew integrations:");
  for (const [name, status] of Object.entries(integrationStatus())) {
    console.log(`  ${name}: ${status}`);
  }

  if (options.compareBaseline) {
    const before = await runCrew({
      ...options,
      demoFailures: true,
      compareBaseline: false,
      out: join(options.out, "before"),
      runId: `${options.runId ?? "compare"}-before`,
    });
    writeComparisonSeed("before", before.summary);
  }

  const result = await runCrew({
    ...options,
    demoFailures: options.compareBaseline ? false : options.demoFailures,
  });
  if (options.compareBaseline) {
    writeComparisonSeed("after", result.summary);
  }

  console.log(`\nRun ${result.state.runId}`);
  console.log(`Kit: ${result.state.goal.outputDir}`);
  console.log(`Trace: ${result.state.localTracePath}`);
  console.log(
    `Spans ${result.summary.spans} · errors ${result.summary.errors} · retries ${result.summary.retries} · tokens ${result.summary.usage.totalTokens}`,
  );
  if (result.manifest) {
    console.log(`Recovered failures: ${result.manifest.recoveredFailures.length}`);
  }
}

function writeComparisonSeed(
  label: "before" | "after",
  summary: { spans: number; errors: number; retries: number; durationMs: number; usage: { totalTokens: number } },
): void {
  const dir = join(process.cwd(), "evidence", "neatlogs");
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, `${label}.json`), `${JSON.stringify({ label, ...summary }, null, 2)}\n`);
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.stack ?? error.message : error);
  process.exitCode = 1;
});
