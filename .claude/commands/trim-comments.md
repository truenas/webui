---
description: Trim a directory's comments to the max-comment-lines cap and add it to the enforced list
argument-hint: <directory, e.g. src/app/pages/vm>
---

`truenas/max-comment-lines` is enforced one directory at a time through `commentCappedPaths` in
`eslint.config.mjs`. Bring one more directory under the cap and add it to that list.

1. Read the directory from "$ARGUMENTS". Accept it with or without the `src/app/` prefix or a trailing
   slash, and normalize it to the `src/app/...` form the list uses. If it is blank, ask for one and stop.
   If it does not exist, or it or a parent is already in `commentCappedPaths`, say so and stop.
2. Add the directory to `commentCappedPaths`, keeping the list alphabetical.
3. Run `yarn lint <directory>` and collect the `truenas/max-comment-lines` errors. If there are more
   than about 30, suggest capping subdirectories one at a time instead and wait for an answer.
4. Rewrite each comment that is over the cap:
   - Keep the why: constraints, non-obvious reasons, what would break.
   - Drop text that restates the code, narrates history or the ticket backstory, or calls a check
     "defensive". Write it as plain prose and keep the comment's form (JSDoc stays JSDoc).
   - Change comments only, never code. Leave comments that are already under the cap alone.
   - Never add `eslint-disable` to get under the cap. If a comment really needs to be longer, show it
     to the user and ask.
5. Run `yarn lint <directory>` again and confirm it is clean.
6. Check `git diff` for the touched files to confirm only comments and the config list changed.
7. Commit only `eslint.config.mjs` and the files you touched, since the working tree may hold
   unrelated changes. Message: `Trim long comments in <directory> and cap it`. Do not push.
8. Report a table of each comment trimmed: file and symbol, lines before and after, and what was kept.
