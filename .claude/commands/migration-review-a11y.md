---
description: Accessibility slice of the tn-* migration review — runs only the a11y agent. Diff-driven. Use to confirm aria/role/tabindex, icon-button labels, and required indicators survived.
argument-hint: "[component path(s) — optional; defaults to the branch's migration changes]"
---

Run the **Accessibility** slice of the Angular Material → `@truenas/ui-components`
migration review (Epic NAS-141021) on the current branch.

**Target:** $ARGUMENTS — if empty, review every migrated component on the branch
(`git diff master...HEAD --name-only`).

Launch the `tn-migration-a11y` agent (a single Agent tool call) and wait for it to return.
It produces the **Accessibility** section.

Render its section verbatim, then a one-line verdict for this dimension:

- **CLEAN** — no a11y regressions.
- **NEEDS CHANGES** — warnings only (dropped required indicator, colour-only state,
  `tnTooltip`-only description, unverified `aria-live` removal).
- **BLOCKED** — at least one blocker (icon-only button with no accessible name, interactive
  banner that lost `role`/`tabindex`/keyboard handlers).

## Constraints

- Review only — do not edit any files.
- This slice is static analysis. It does not run jest-axe — that lives in `/migration-review-tests`.
- A finding without `file:line` and a concrete fix is not actionable. Drop vague findings.
- The agent must be a registered subagent type. If it is "not found", restart Claude Code
  and re-run.
- For the full multi-dimension review, use `/migration-review`.
