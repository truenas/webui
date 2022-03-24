# Contributing

Anyone is free to help us build and maintain this project. If you see an issue that needs working on because it's important to you, you can contribute to the code by
- First fork the repo, and then clone it locally.
- Create a new branch.
- Review the [README](https://github.com/truenas/webui/blob/master/README.md) file to learn how to build and run the project as well as connect it to your TrueNAS
- Make the required changes.

ESLint is setup to ensure that the code is up to the format standards that we would like to keep in our project. If the linter sees issues in your project, it might ask you to fix those issues before you can make a commit. A set of precommit commands will run to extract new text into translation files and check linter for any issues.

If you want to contribute to the translation of our UI, you can do so by editing one of the `[language_name].json` files under `src\assets\i18n\`. In each of those files, text strings and their translations in the relevant language are kept as key/value pairs.

`
{
  ...,
  "Translate this text": "[Translation]",
  ...
}
`

## Tests

We recommend that any new code that you add, you should also add unit tests for it. Covering it also reported on the PRs by the `codecov` bot.

## Raise a Pull Request

Pull requests required at least one approved review from one of the members of the UI team before they can be merged. When you create a new PR, a member of the UI team will be automatically asked to review it. Alternatively, you can ask for review from @truenas/ui_team.

Once we have reviewed your PR, we will provide any feedback that needs addressing. If you feel a requested change is wrong, don't be afraid to discuss with us in the comments. Once the feedback is addressed, and the PR is reviewed, we'll ensure the branch is up to date with target, and merge it for you. Depending on the status of the project, somtimes only authorized members of the UI team can merge PRs. In which case, it might take a bit more time for it to be merged.