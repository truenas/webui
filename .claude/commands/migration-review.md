---
description: Full fan-out review of a tn-* migration branch across six specialized agents, aggregated into a single report with a per-section scorecard and merge-readiness verdict. For a single dimension, use the cheaper /migration-review-{material,i18n,a11y,structural,testid,tests}.
argument-hint: "[component path(s) — optional; defaults to the branch's migration changes]"
---

Run the **full** conformance review for the Angular Material → `@truenas/ui-components`
migration (Epic NAS-141021) on the current branch.

**Target:** $ARGUMENTS — if empty, review every migrated component on the branch
(`git diff master...HEAD --name-only`).

> This is the heavy, all-dimensions review. If you only need one dimension, the narrow
> commands are far cheaper — `/migration-review-material`, `/migration-review-i18n`,
> `/migration-review-a11y`, `/migration-review-structural`, `/migration-review-testid`,
> `/migration-review-tests`. Each runs a single agent and renders just its section.

## Fan-out

Launch these six specialized agents **in parallel** — a single message with six Agent tool
calls — and wait for all to return. Each maps 1:1 to a report section:

1. `tn-migration-material` — **Leftover Material** (Section 1). Lean, grep-first.
2. `tn-migration-testid` — **Test ID consistency** (Section 2).
3. `tn-migration-i18n` — **i18n** (Section 3). Lean, grep-and-diff.
4. `tn-migration-a11y` — **Accessibility** (Section 4). Diff-driven.
5. `tn-migration-harness` — **Test migrations** (Section 5). Runs the specs.
6. `tn-migration-structural` — **Structural conformance** (Section 6). The heavy slice;
   reads full triplets, runs the install gate.

Each agent already outputs a self-titled section. Your job is to concatenate them in the
order below, de-duplicate cross-lane overlap, and render the scorecard + verdict.

(Browser-driven visual smoke is not part of this fan-out — the dedicated `tn-migration-visual`
agent was retired after two consecutive blocked runs. If a visual concern needs hands-on
verification, the dev should drive Playwright themselves.)

## Aggregation rules

- For each content section, take the owning agent's findings verbatim. Where two agents
  flag the same `(file:line, finding-summary)` — e.g. structural and harness both flag the
  same library-API issue — keep one entry tagged with both agents.
- Preserve each agent's severity labels exactly. Do not promote or demote on aggregation.
- Fold every agent's "Notes for sibling agents" appendix back into the appropriate section
  once during aggregation — then drop the appendix itself from the final output.
- If any agent returned `BLOCKED — install drift unresolved`, surface that as the sole
  finding and stop; the review is invalid until the user reconciles the install/lockfile
  mismatch. (Only `tn-migration-structural` and `tn-migration-harness` run that gate.)

## Final report structure

Render the sections that have findings, in this order:

1. **Leftover Material** — Info-default, occasionally Warning. Code snippets where useful.
2. **Test ID consistency** — Blocker-default, with the before/after table from testid.
3. **i18n** — Blockers for untranslated visible strings.
4. **Accessibility** — Blockers (icon-button labels, interactive-banner keyboard); Warnings
   (required indicator, colour-only state, tooltip-only descriptions).
5. **Test migrations** — Blockers for harness-replaceable CSS queries; spec-run table.
6. **Structural conformance** — mixed severities per playbook (card recipe, declarative
   signal, side-panel dual-host, component-map, modern-Angular hygiene).

Then **always** render the scorecard, followed by the verdict.

## Scorecard

```
| Section                    | Status | Counts                     | One-line note                                  |
|----------------------------|--------|----------------------------|------------------------------------------------|
| 1. Leftover Material       | ✓/⚠/✗  | N infos, M warnings        | e.g. "3 stale Mat imports — likely staged"     |
| 2. Test IDs                | ✓/⚠/✗  | B blockers, W warnings     | e.g. "4 IDs renamed — see test.directive fix"  |
| 3. i18n                    | ✓/⚠/✗  | B blockers                 | e.g. "Start/Stop labels lost translation"      |
| 4. Accessibility           | ✓/⚠/✗  | B blockers, W warnings     | e.g. "tn-select lost [required] indicator"     |
| 5. Test migrations         | ✓/⚠/✗  | B blockers, W warnings     | e.g. "2 specs query DOM instead of harness"    |
| 6. Structural conformance  | ✓/⚠/✗  | B blockers, W warnings     | e.g. "::ng-deep into tn-table missing //TEMP"  |
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

Follow the verdict with **at most three** "top things to address" bullets — the highest-severity
findings, in priority order. If the verdict is BLOCKED, the bullets must call out the blockers
specifically. If NEEDS CHANGES, surface the most consequential warnings. If READY TO MERGE,
omit the bullets.

## Constraints

- Review only — do not edit any files.
- A finding without `file:line` and a concrete fix is not actionable. Do not aggregate vague
  findings into the final report.
- The six agents must be registered subagent types. If an agent type is "not found", restart
  Claude Code and re-run.
