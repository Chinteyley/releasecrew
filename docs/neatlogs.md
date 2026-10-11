# neatlogs

ReleaseCrew instruments the crew with the official TypeScript SDK ([docs](https://docs.neatlogs.com/sdk/typescript)).

## What we wrap

| Kind | Where |
| --- | --- |
| `WORKFLOW` | `runCrew` |
| `AGENT` | planner, researcher, writer, verifier, media |
| `TOOL` | GitHub requests, ffmpeg encode |
| `GUARDRAIL` | claim grounding |
| `LLM` | AI SDK `generateText` via `wrapAISDK` from `neatlogs/ai` |

Retries are child spans named `*.attempt_N`.

## Owner setup

1. Create a project at [app.neatlogs.com](https://app.neatlogs.com) (EU: [eu.app.neatlogs.com](https://eu.app.neatlogs.com)).
2. Settings → Project → API keys. Copy the key.
3. `export NEATLOGS_API_KEY=...` or put it in `.env`.
4. EU projects also set `NEATLOGS_ENDPOINT=https://eu.ingest.neatlogs.com`.
5. Run the crew. `await flush()` + `await shutdown()` run in `finally`.
6. Paste the dashboard URL for the before and after runs into `evidence/neatlogs/comparison.md`.

```bash
npx neatlogs doctor --local --json
NEATLOGS_API_KEY=... npx neatlogs doctor --probe --json
```

Without a key, `init()` still runs and **does not export**. Local traces remain under `.releasecrew/runs/<id>/trace.jsonl` and `evidence/neatlogs/`.
