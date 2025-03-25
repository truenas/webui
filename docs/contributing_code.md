# Contributing Code

TrueNAS is an open-source project, and we welcome contributions from the community.\
Our code is licensed under GPL-3 license.

We've created this document to explain how to contribute to the project.

## How To Contribute

### Select An Issue

We maintain a [Help Wanted list](https://ixsystems.atlassian.net/issues/?filter=12107) – a list of tasks that are easier to get started with.

- Pick an issue from the [Help Wanted list.](https://ixsystems.atlassian.net/issues/?filter=12107)
- Assign it to yourself, so that no one else works on it. 

Feel free to assign any one issue from the queue, regardless of current assignee.

### Update The code
- Fork the repo.

- Set up development environment by following the [Setup Guide.](https://github.com/truenas/webui/blob/master/docs/setup.md)

- Fix the issue.

### Add Tests If Necessary

If you are fixing a small styling issue, adding test may not be necessary. 

However, for a bigger change, adding or updating test may be required.\
We have a minimum coverage requirement that is automatically enforced by our CI.

A good rule of thumb is to cover all happy paths in the code you are changing.

It's inadvisable to run all tests locally, as it takes too much time.\
As an alternative you can:

- Run a specific test suite using your IDE or via `yarn test <src/app/path to the test file>`.
- Run tests in folders that have changes using `yarn test:changed`.

Please see other `.spec.ts` files in the repo for examples.

> [!NOTE]
> If you have trouble writing tests, create a PR without them and we'll help.

### Open The PR

Our CI will make sure that your code matches our code style, but it may be a good idea to run linter locally first:

- `yarn lint`

- Please name your branch `NAS-<issue number>`, e.g. `NAS-12345`.

- Commit description should be in the format `NAS-<issue number>: <description>`, e.g. `NAS-12345: Fix the issue with ...`.

- Push changes to your fork.

- Open a PR against our repo.

### Wait For Changes To Be Merged

After you open a PR, a member of the UI team will be automatically asked to review it.

Once your PR is merged, it will appear in the next nightly build. :tada:

We appreciate your contribution.

### Get [Forum](https://forums.truenas.com) Contributor Credit!

Once you have successfully had your pull-request merged into the TrueNAS repository, you are eligible for an exclusive forum badge and group to highlight your contributor status!

To claim your contributor badge, please include a `TrueNAS Forums Username: <name>` on your pull request description. Once the pull request merges, message the forum moderators with a link to the PR and your will be granted membership to the contributors group.

