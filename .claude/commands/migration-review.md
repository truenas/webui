---
description: Fan-out review of a tn-* migration branch across three specialized agents, aggregated into a single report with a per-section scorecard and merge-readiness verdict.
argument-hint: "[component path(s) — optional; defaults to the branch's migration changes]"
---

Run the full conformance review for the Angular Material → `@truenas/ui-components`
migration (Epic NAS-141021) on the current branch.

**Target:** $ARGUMENTS — if empty, review every migrated component on the branch
(`git diff master...HEAD --name-only`).

## Fan-out

Launch these three specialized agents **in parallel** — a single message with three Agent
tool calls — and wait for all to return:

1. `tn-migration-conformance` — produces Section 1 (Leftover Material), Section 3 (i18n
   & a11y), Section 5 (Other structural findings).
2. `tn-migration-testid` — produces Section 2 (Test ID consistency).
3. `tn-migration-harness` — produces Section 4 (Test migrations).

Each agent already outputs section-structured findings. Your job is to concatenate them
into a single report, de-duplicate cross-lane overlap, and render the scorecard + verdict.

(Browser-driven visual smoke is not part of this fan-out — the dedicated `tn-migration-visual`
agent was retired after two consecutive blocked runs. If a visual concern needs hands-on
verification, the dev should drive Playwright themselves.)

## Aggregation rules

- For each content section, concatenate the agents' findings. De-duplicate by
  `(file:line, finding-summary)` — if conformance and harness both flagged the same
  library-API issue, keep one entry tagged with both agents.
- Preserve each agent's severity labels exactly. Do not promote or demote on aggregation.
- Fold "Notes for sibling agents" appendices back into the appropriate sections once
  during aggregation — drop the appendix itself from the final output.
- If an agent returned `BLOCKED — install drift unresolved`, surface that as the sole
  finding and stop; the review is invalid until the user reconciles.

## Final report structure

Render the sections that have findings, in this order:

1. **Leftover Material** — Info-default, occasionally Warning. Code snippets where useful.
2. **Test ID consistency** — Blocker-default, with the before/after table from testid.
3. **i18n & a11y regressions** — i18n Blockers; a11y Warnings. Code snippets where useful.
4. **Test migrations** — Blockers for harness-replaceable CSS queries; spec-run table.
5. **Other structural findings** — mixed severities per playbook.

Then **always** render the scorecard, followed by the verdict.

## Scorecard

```
| Section                    | Status | Counts                     | One-line note                                  |
|----------------------------|--------|----------------------------|------------------------------------------------|
| 1. Leftover Material       | ✓/⚠/✗  | N infos, M warnings        | e.g. "3 stale Mat imports — likely staged"     |
| 2. Test IDs                | ✓/⚠/✗  | B blockers, W warnings     | e.g. "4 IDs renamed — see test.directive fix"  |
| 3. i18n & a11y             | ✓/⚠/✗  | B i18n blockers, W a11y    | e.g. "tn-select lost [required] indicator"     |
| 4. Test migrations         | ✓/⚠/✗  | B blockers, W warnings     | e.g. "2 specs query DOM instead of harness"    |
| 5. Other structural        | ✓/⚠/✗  | B blockers, W warnings     | e.g. "::ng-deep into tn-table missing //TEMP"  |
```

Status icons:
- ✓ — no findings, or only nits / informational items.
- ⚠ — warnings (and/or infos), no blockers.
- ✗ — at least one blocker.

## Verdict

Single bold line, one of:

- **READY TO MERGE** — every section ✓.
- **NEEDS CHANGES** — at least one ⚠ but no ✗.
- **BLOCKED** — at least one ✗ in any section.

Follow the verdict with **at most three** "top things to address" bullets — the
highest-severity findings, in priority order. If the verdict is BLOCKED, the bullets
must call out the blockers specifically. If NEEDS CHANGES, surface the most consequential
warnings. If READY TO MERGE, omit the bullets.

## Constraints

- Review only — do not edit any files.
- A finding without `file:line` and a concrete fix is not actionable. Do not aggregate
  vague findings into the final report.
- The three agents must be registered subagent types. If an agent type is "not found",
  restart Claude Code and re-run.
