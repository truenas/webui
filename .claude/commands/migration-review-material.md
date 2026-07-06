---
description: Leftover-Material slice of the tn-* migration review — runs only the material agent. Cheap, grep-first. Use when you just want to know if any Angular Material is still present.
argument-hint: "[component path(s) — optional; defaults to the branch's migration changes]"
---

Run the **Leftover Material** slice of the Angular Material → `@truenas/ui-components`
migration review (Epic NAS-141021) on the current branch.

**Target:** $ARGUMENTS — if empty, review every migrated component on the branch
(`git diff master...HEAD --name-only`).

Launch the `tn-migration-material` agent (a single Agent tool call) and wait for it to
return. It produces the **Leftover Material** section.

Render its section verbatim, then a one-line verdict for this dimension:

- **CLEAN** — no findings, or only informational staged-migration leftovers.
- **NEEDS CHANGES** — warnings (converted-surface misses, scope creep, unmapped surfaces).
- (This slice has no blocker tier — leftover Material is never a hard blocker.)

## Constraints

- Review only — do not edit any files.
- A finding without `file:line` and a concrete fix is not actionable. Drop vague findings.
- The agent must be a registered subagent type. If it is "not found", restart Claude Code
  and re-run.
- For the full multi-dimension review, use `/migration-review`.
