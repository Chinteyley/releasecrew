# neatlogs evidence

Instrumentation lives in `src/telemetry/neatlogs.ts` and `src/telemetry/recorder.ts`.

| File | What it is |
| --- | --- |
| `before.json` | Summary of the sloppy run (`--demo-failures`): rate limit, hallucinated draft, fake encoder |
| `after.json` | Summary of the clean run |
| `comparison.md` | Side-by-side numbers judges can check |
| `before.trace.jsonl` / `after.trace.jsonl` | Full local span trees (copied from `.releasecrew/runs/`) |

Dashboard URLs go in `comparison.md` once `NEATLOGS_API_KEY` is set and the two runs are re-exported.
