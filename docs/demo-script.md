# Demo script — 3:00 or less

Record this as one take. Show the terminal, the kit folder, a neatlogs dashboard (or the committed local traces if the key is still missing), Entire graph output, and the cfo.ai inputs. Say the tool names out loud.

Spoken words ≈ 390. Leave 10 seconds of silence at the end on the trailer.

---

## 0:00–0:20 — The problem

Open `examples/hono-v4.13.12/notes.md`.

> Every release I care about dies in a GitHub compare tab. I wanted an agent crew that reads the real diff, writes the launch story, and **refuses to invent features**. That’s ReleaseCrew. Repo plus tag in, verified kit out: notes, an X thread, and a trailer.

## 0:20–0:50 — Architecture (all three partners)

Show the mermaid diagram in the README.

> Six roles, one coordinator. A planner breaks the goal. A researcher hits the GitHub API. A writer drafts. A verifier grounds every bullet in the compare. Media paints a storyboard and ffmpeg encodes it. State lives on disk, so a 429 or a bad draft does not throw the run away.
>
> **neatlogs** is the flight recorder. **Entire** is how I navigated this repo while I built it. **cfo.ai** is the business plan sitting next to the code.

## 0:50–1:25 — neatlogs

Open `src/telemetry/neatlogs.ts`, then `evidence/neatlogs/comparison.md`.

> Architecture: every agent, tool, LLM call, retry, and guardrail is a neatlogs span. `init()` reads `NEATLOGS_API_KEY`; if the key is missing, export is off and we still write a JSONL trace.
>
> Implementation: `span({ kind: 'AGENT' })` around planner through media, `kind: 'TOOL'` on GitHub and ffmpeg, `kind: 'GUARDRAIL'` on the verifier, `kind: 'LLM'` on the AI SDK `wrapAISDK` path.
>
> Runtime: look at the before trace. First writer pass smuggles in “quantum teleportation deploys.” The guardrail rejects it. GitHub returns a demo 429. ffmpeg’s first encoder is fake. All three recover.
>
> Reasoning: I compared span count, errors, retries, and tokens before versus after I trusted the verifier. After is quieter: no rejected claims, fewer retries, same kit.
>
> Result: `evidence/neatlogs/before.json` and `after.json`, plus this comparison table. With a live key the same spans land in the neatlogs dashboard.

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

Open `docs/business-plan-inputs.md`.

> Architecture: cfo.ai is not in the agent loop. It plans the business around the agent — pricing, COGS, revenue, runway.
>
> Implementation: I wrote paste-ready inputs. Indie $29, Team $149, Launch $499. COGS $0.24 a kit. Four scenarios: Base, Growth, price cut, hiring freeze.
>
> Runtime: the owner signs up, cancels billing immediately, pastes the prompt, exports the plan over `docs/business-plan.md`.
>
> Reasoning: a release kit that costs a quarter to render can hold 80% gross margin if people pay for trust, not tokens.
>
> Result: the input sheet is in the repo today; the exported plan is the last owner step.

## 2:25–2:50 — The run and the recovery

Play `examples/hono-v4.13.12/trailer.mp4`. Scroll `evidence.json` to `failures`.

> This kit is Hono `v4.13.12`. Every highlight cites a PR or a SHA. The quantum teleportation line is gone — the verifier killed it and the writer retried. Rate limit and render failure are in the failure log with `recovered: true`.

## 2:50–3:00 — Close

> Repo is public. Commits are during neatHack. Owner still needs a neatlogs key, a model key if you want the LLM writer, and the cfo.ai export. The crew already ships the kit without them.

---

## B-roll checklist

- Terminal: `npx tsx src/cli.ts --repo honojs/hono --tag v4.13.12 --from v4.13.11 --demo-failures`
- `examples/hono-v4.13.12/{notes.md,thread.txt,trailer.mp4,evidence.json}`
- neatlogs dashboard **or** `evidence/neatlogs/comparison.md`
- `evidence/entire/impact-verifyDraft.txt`
- `docs/business-plan-inputs.md`
