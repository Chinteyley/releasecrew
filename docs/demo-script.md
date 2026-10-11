# Demo script — 3:00 or less

Record this as one take. Show the terminal, the kit folder, the two neatlogs dashboard traces (before: https://app.neatlogs.com/traces/3a283db3709a7bb09b0051a3d88e3e66 · after: https://app.neatlogs.com/traces/e7ffc0315da930b805121b7ed8f0d300), Entire graph output, and the cfo.ai plan (https://cfo.ai/s/ZbM2xk1moP4DNr2f). Say the tool names out loud.

Spoken words ≈ 390. Leave 10 seconds of silence at the end on the trailer.

---

## 0:00–0:20 — The problem

Open `examples/hono-v4.13.12/notes.md`.

> Every release I care about dies in a GitHub compare tab. I wanted an agent crew that reads the real diff, writes the launch story, and **refuses to invent features**. That’s ReleaseCrew. Repo plus tag in, verified kit out: notes, an X thread, and a trailer.

## 0:20–0:50 — Architecture (all three partners)

Show the mermaid diagram in the README.

> Six roles, one coordinator. A planner breaks the goal. A researcher hits the GitHub API. A writer, `claude-haiku` through the neatHack LiteLLM proxy, drafts. A verifier grounds every bullet in the compare. Media paints a storyboard and ffmpeg encodes it. State lives on disk, so a 429 or a bad draft does not throw the run away.
>
> **neatlogs** is the flight recorder. **Entire** is how I navigated this repo while I built it. **cfo.ai** is the business plan sitting next to the code.

## 0:50–1:25 — neatlogs

Open `src/telemetry/neatlogs.ts`, then the before trace in neatlogs (https://app.neatlogs.com/traces/3a283db3709a7bb09b0051a3d88e3e66), then the after trace (https://app.neatlogs.com/traces/e7ffc0315da930b805121b7ed8f0d300), then `evidence/neatlogs/comparison.md`.

> Architecture: every agent, tool, LLM call, retry, and guardrail is a neatlogs span. `init()` reads `NEATLOGS_API_KEY` and exports to the dashboard. Every run also writes a local JSONL trace and prints its neatlogs trace id.
>
> Implementation: `span({ kind: 'AGENT' })` around planner through media, `kind: 'TOOL'` on GitHub and ffmpeg, `kind: 'GUARDRAIL'` on the verifier, `kind: 'LLM'` on the AI SDK `wrapAISDK` path.
>
> Runtime: look at the before trace in the dashboard. Both runs use a real model, `claude-haiku`. First writer pass smuggles in “quantum teleportation deploys.” The guardrail rejects it. GitHub returns a demo 429. ffmpeg’s first encoder is fake. All three recover.
>
> Reasoning: I compared the two traces. Before: 23 spans, 3 retries, 1 error, 2 writer drafts, 7,989 real tokens, 20.8 seconds. After: 17 spans, no retries, no errors, 1 draft, 4,430 tokens, 17.6 seconds. One bad draft costs a whole extra LLM call, about 45% of the tokens.
>
> Result: two live neatlogs traces, `before.json` and `after.json`, and the comparison table in `evidence/neatlogs/comparison.md`.

## 1:25–1:55 — Entire

Open `evidence/entire/search-resume.json` and `impact-verifyDraft.txt`.

> Architecture: Entire checkpoints plus entire-graph. Checkpoints keep the context behind each commit. The graph is a local map of functions, callers, and types — no model, no network.
>
> Implementation: I installed the CLI, `entire enable --agent cursor`, `entire plugin install graph`, and `entire graph init-agents`. Then I actually used it: search for “persist run state,” impact on `verifyDraft`.
>
> Runtime: search ranked `saveState` and `runCrew` first. Impact said `verifyDraft` has three callers and five callees, including the neatlogs guardrail.
>
> Reasoning: that is how I kept the verifier a single function instead of scattering claim checks. The graph told me who would break.
>
> Result: `evidence/entire/snapshot.ndjson`, doctor JSON, and the checkpoint list from this repo’s commits.

## 1:55–2:25 — cfo.ai

Open the cfo.ai model (https://cfo.ai/s/ZbM2xk1moP4DNr2f), then `docs/business-plan.md`.

> Architecture: cfo.ai is not in the agent loop. It plans the business around the agent — pricing, COGS, revenue, runway.
>
> Implementation: I gave Ari the inputs in `docs/business-plan-inputs.md`: Indie $29, Team $149, Launch $499, about $0.24 COGS per kit, and four scenarios.
>
> Runtime: cfo.ai built the model: revenue from $2.7k a month to $36.9k a month over 18 months, 92 to 93% gross margin, LTV to CAC around 9 to 10x.
>
> Reasoning: a kit that costs cents in model and render time keeps margins above 90% if people pay for trust, not tokens. Cash never goes negative and ends at about $178k.
>
> Result: the public model, the PDF and the xlsx exports are in `evidence/cfo-ai/`.

## 2:25–2:50 — The run and the recovery

Play `examples/hono-v4.13.12/trailer.mp4`. Scroll `evidence.json` to `failures`.

> This kit is Hono `v4.13.12`, written by `claude-haiku`. Every highlight cites a PR or a SHA. The quantum teleportation line is gone — the verifier killed it and the writer retried. Rate limit and render failure are in the failure log with `recovered: true`.

## 2:50–3:00 — Close

> Repo is public. Commits are during neatHack. Real model, live neatlogs traces, Entire graph, cfo.ai plan: all linked in the README.

---

## B-roll checklist

- Terminal: `npx tsx src/cli.ts --repo honojs/hono --tag v4.13.12 --from v4.13.11 --out examples/hono-v4.13.12 --compare-baseline --run-id hono-llm`
- `examples/hono-v4.13.12/{notes.md,thread.txt,trailer.mp4,evidence.json}`
- neatlogs before trace https://app.neatlogs.com/traces/3a283db3709a7bb09b0051a3d88e3e66 and after trace https://app.neatlogs.com/traces/e7ffc0315da930b805121b7ed8f0d300, plus `evidence/neatlogs/comparison.md`
- `evidence/entire/impact-verifyDraft.txt`
- cfo.ai model https://cfo.ai/s/ZbM2xk1moP4DNr2f and `evidence/cfo-ai/` screenshots
