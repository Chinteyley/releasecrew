# Before / after neatlogs traces

Two runs of the same goal (`honojs/hono@v4.13.12`).

- **Before:** `--demo-failures` on. First GitHub call 429s, first draft invents a feature, first ffmpeg encoder is fake. The crew recovers.
- **After:** same repo and tag, no injected faults.

Fill the table from `before.json` / `after.json` after the example run. Dashboard links are blank until the owner sets `NEATLOGS_API_KEY`.

| Metric | Before (sloppy) | After (clean) |
| --- | --- | --- |
| neatlogs dashboard | _pending API key_ | _pending API key_ |
| Local trace | `before.trace.jsonl` | `after.trace.jsonl` |
| Spans | _pending run_ | _pending run_ |
| Error spans | _pending run_ | _pending run_ |
| Retry / attempt spans | _pending run_ | _pending run_ |
| Total tokens (heuristic estimate or LLM) | _pending run_ | _pending run_ |
| Wall time (sum of span durations) | _pending run_ | _pending run_ |
| Verifier rejected claims | ≥1 (quantum teleportation) | 0 |
| Recovered failures | rate limit, bad draft, render | none injected |

What changed in the code between the two philosophies: the verifier is a `GUARDRAIL` span. The before run proves it fires. The after run proves a grounded writer never trips it.
