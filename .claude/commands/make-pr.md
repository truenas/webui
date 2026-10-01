Commit changes and create a PR. Use with a title, optionally prefixed by a ticket, e.g. `NAS-12345: Fix important issue` or `Fix important issue`.

1. Read the title from: "$ARGUMENTS". A Jira ticket key (e.g. `NAS-12345`) is optional.
   If the string is empty, read the changes (`git diff` / `git diff --cached`, and any commits not on master) and
   propose a title that summarizes them — short, imperative, the way a ticket title reads, since bugclerk reuses it.
   Wait for the user to confirm or edit it before continuing.
   If it has no ticket key, ask the user whether to apply the `jira` label to the PR, so bugclerk creates the ticket
   and adds its key to the PR title. Remind them that without the label the `check-ticket` check stays red until
   they put a ticket key in the PR title themselves, which is required before merge.
2. If there are uncommitted changes, run tests on changed files with `yarn test:changed`.
3. If the tests pass, switch to a branch named after the ticket number in the confirmed title from step 1 if it has one,
   otherwise a short kebab-case name derived from that title. Create the branch if necessary.
4. Commit the changes with the confirmed title from step 1.
5. Check if there are any uncommitted changes. If there are, run `git add .` and commit again.
6. Push the branch to the remote repository.
7. Open browser window with the link to create a pull request for the branch
   (`https://github.com/truenas/webui/compare/master...<branch>?expand=1&title=<url-encoded confirmed title>`).
   Passing the title matters: GitHub only prefills it from the commit message when the branch has a single commit,
   and falls back to the branch name otherwise. If the user chose the `jira` label in step 1, append `&labels=jira`
   so the new PR form has it applied.
