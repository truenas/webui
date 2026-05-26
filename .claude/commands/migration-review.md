---
description: Fan-out review of a tn-* migration branch across all four specialized agents.
argument-hint: "[component path(s) — optional; defaults to the branch's migration changes]"
---

Run the full conformance review for the Angular Material → `@truenas/ui-components`
migration (Epic NAS-141021) on the current branch.

**Target:** $ARGUMENTS — if empty, review every migrated component on the branch
(`git diff master...HEAD --name-only`).

Launch these four specialized agents **in parallel** — a single message with four Agent
tool calls — and wait for all to return:

1. `tn-migration-conformance` — structural recipe conformance.
2. `tn-migration-testid` — test-ID preservation.
3. `tn-migration-harness` — spec / test-harness correctness.
4. `tn-migration-visual` — browser visual smoke. Pass it the migrated area's route; it may
   report "not testable", which is fine.

Give each agent the same target scope and tell it to follow its own standard process.

Then aggregate the four reports into **one** report:
- A single overall verdict: **READY TO PR / NEEDS CHANGES / BLOCKED**.
- Findings merged across agents, grouped by severity (Blockers, Warnings, Nits), each
  tagged with the agent that raised it. De-duplicate where two agents flagged the same
  thing.
- Preserve each finding's `file:line` and concrete fix.
- If the visual agent reported "not testable", state that plainly — it does not block the
  verdict on its own.

This is review only — do not fix anything. Present the aggregated report.

Note: the four agents must be registered (a Claude Code session restart after they were
added). If an agent type is "not found", restart the session and re-run.
