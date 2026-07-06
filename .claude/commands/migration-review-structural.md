---
description: Structural-conformance slice of the tn-* migration review — runs only the structural agent (card/declarative-signal/side-panel/component-map/modern-Angular). The heavy slice; runs the install-freshness gate.
argument-hint: "[component path(s) — optional; defaults to the branch's migration changes]"
---

Run the **Structural conformance** slice of the Angular Material → `@truenas/ui-components`
migration review (Epic NAS-141021) on the current branch.

**Target:** $ARGUMENTS — if empty, review every migrated component on the branch
(`git diff master...HEAD --name-only`).

Launch the `tn-migration-structural` agent (a single Agent tool call) and wait for it to
return. It produces the **Structural conformance** section. This is the heaviest slice — it
reads the full `.ts`/`.html`/`.scss` triplet and runs the install-freshness gate before
making any `@truenas/ui-components` API claim.

Render its section verbatim, then a one-line verdict for this dimension:

- **CLEAN** — recipes applied correctly, only nits.
- **NEEDS CHANGES** — warnings (card-recipe deviations, `| async` instead of `toSignal()`,
  duplicated mappers).
- **BLOCKED** — at least one blocker (unsanctioned `::ng-deep` into a `tn-*`, side-panel
  dual-host contract violation, wrong tn-* replacement vs the mapping table).

If the agent returns `BLOCKED — install drift unresolved`, surface that as the sole finding
and stop — the review is invalid until the install/lockfile mismatch is reconciled.

## Constraints

- Review only — do not edit any files.
- A finding without `file:line` and a concrete fix is not actionable. Drop vague findings.
- The agent must be a registered subagent type. If it is "not found", restart Claude Code
  and re-run.
- For the full multi-dimension review, use `/migration-review`.
