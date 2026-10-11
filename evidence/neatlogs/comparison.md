# Before / after neatlogs traces

Two runs of the same goal: `honojs/hono@v4.13.12` (`v4.13.11...v4.13.12`).

- **Before:** `--demo-failures`. First GitHub call 429s, first draft invents “quantum teleportation deploys”, first ffmpeg encoder is fake. The crew recovers and still writes a kit.
- **After:** same repo and tag, no injected faults. Writer attempt 1 is already grounded.

Dashboard links stay blank until the owner sets `NEATLOGS_API_KEY` and re-runs. The local JSONL trees are the checkable record.

| Metric | Before (sloppy) | After (clean) | Delta |
| --- | --- | --- | --- |
| neatlogs dashboard | _pending `NEATLOGS_API_KEY`_ | _pending `NEATLOGS_API_KEY`_ | — |
| Local trace | [`before.trace.jsonl`](./before.trace.jsonl) | [`after.trace.jsonl`](./after.trace.jsonl) | — |
| Spans | 21 | 16 | −5 |
| Error spans | 1 | 0 | −1 |
| Retry / extra-attempt spans | 3 | 0 | −3 |
| Total tokens (heuristic estimate) | 819 | 509 | −310 |
| Sum of span durations | 7.6s | 5.9s | −1.7s |
| Writer attempts | 2 | 1 | −1 |
| Verifier rejected claims | 1 (quantum teleportation) | 0 | −1 |
| Recovered failures | rate limit, bad draft, render | none injected | — |

What changed: the verifier is a `GUARDRAIL` span. Before proves it fires and the writer retries. After proves a grounded writer never trips it. GitHub and ffmpeg retries are child spans named `*.attempt_N`.

Kits: [`examples/hono-v4.13.12/before`](../../examples/hono-v4.13.12/before) vs [`examples/hono-v4.13.12`](../../examples/hono-v4.13.12).
