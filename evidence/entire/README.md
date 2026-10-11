# Entire evidence

Entire is how this repo was built, not a runtime call inside a release kit.

## What we ran

```bash
curl -fsSL https://entire.io/install.sh | bash   # Entire CLI 0.11.4
entire enable --yes --agent cursor --project --checkpoint-backend refs --skip-push-sessions
entire plugin install graph
entire graph init-agents
entire graph search --repo . --profile full --query "where does the coordinator persist run state so failed releases can resume"
entire graph impact --symbol verifyDraft --repo .
entire graph snapshot --repo . --format ndjson
```

## Files

| File | What it is |
| --- | --- |
| `cli-version.txt` | Entire CLI 0.11.4 |
| `status.txt` | Enabled on this branch, Cursor agent, git-refs checkpoints |
| `doctor.json` | entire-graph v0.4.0, `no_egress: true` |
| `capabilities.json` | Languages and relation types the graph parsed |
| `search-resume.json` | Search that ranked `saveState` / `runCrew` |
| `impact-verifyDraft.txt` | Callers, callees, types for the guardrail |
| `impact-runCrew.txt` | Blast radius of the coordinator |
| `snapshot.ndjson` | Full local graph of this repository |
| `checkpoints.txt` | `entire checkpoint list` after hackathon commits |

`AGENTS.md`, `CLAUDE.md`, and `.entire/graph-agent.md` are the agent guide `init-agents` dropped so later sessions keep using the graph first.
