---
description: i18n slice of the tn-* migration review — runs only the i18n agent. Cheap, grep-and-diff. Use when you touched labels/strings and want to confirm translation survived.
argument-hint: "[component path(s) — optional; defaults to the branch's migration changes]"
---

Run the **i18n** slice of the Angular Material → `@truenas/ui-components` migration review
(Epic NAS-141021) on the current branch.

**Target:** $ARGUMENTS — if empty, review every migrated component on the branch
(`git diff master...HEAD --name-only`).

Launch the `tn-migration-i18n` agent (a single Agent tool call) and wait for it to return.
It produces the **i18n** section.

Render its section verbatim, then a one-line verdict for this dimension:

- **CLEAN** — every user-visible string is translated.
- **BLOCKED** — at least one previously-translated string now ships as a raw literal, or a
  new visible string was added without translation. (i18n findings are blockers by default.)

## Constraints

- Review only — do not edit any files.
- A finding without `file:line` and a concrete fix is not actionable. Drop vague findings.
- The agent must be a registered subagent type. If it is "not found", restart Claude Code
  and re-run.
- For the full multi-dimension review, use `/migration-review`.
