Commit changes and create a PR. Use with ticket number and title, e.g. `NAS-12345: Fix important issue`.

1. Make sure that ticket number and ticket tile are correct here: "$ARGUMENTS". Example: NAS-12345: Fix important issue.
   If the string before is empty or doesn't match format, stop execution and ask for ticket number and title.
2. If there are uncommitted changes, run tests on changed files with `yarn test:changed`.
3. If the tests pass, switch to the branching using ticket number from: $ARGUMENTS. Create branch if necessary.
4. Commit the changes with the ticket number and title: "$ARGUMENTS". 
5. Check if there are any uncommitted changes. If there are, run `git add .` and commit again.
6. Push the branch to the remote repository.
7. Open browser window with the link to create a pull request for the branch.