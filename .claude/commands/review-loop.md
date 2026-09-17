---
description: Loop a CI-style reviewer over the branch until nothing at MEDIUM or above remains
argument-hint: [max-iterations]
---

Spawn a reviewer agent. Have the reviewer do a code review in a loop, using the same
prompts our CI does. Commit on each iteration but do not push. Close the loop when the
reviewer finds no >= MEDIUM issues.

CI's prompt is `.claude/review-prompt.md` followed by the shared severity rubric, which
defines MEDIUM and is not in this repo. Fetch `review/rubric.md` from
`iXsystems/ux-github-workflows` (e.g. with `gh api`) and give the reviewer both.

Maximum iterations: "$1". If that is blank, use 3. Never exceed it, even if findings
remain; when it is reached with findings still open, report them and stop.
