When merging upstream TrueNAS code with `git merge`, handle the i18n JSON files as follows:

1. Accept all TrueNAS translation files in full.
2. Run `yarn tsx scripts/i18n-merge.ts --source-ref <harboros-commit>`.

The `i18n-merge.ts` script logic:

1. Maintains a list of HarborOS-specific keys; for each language file it fetches the corresponding values from a HarborOS commit and appends them to the new translation file.
2. Replaces any empty value with its key.
3. Applies special handling for links such as forums, repositories, and documentation.
4. Globally replaces “TrueNAS” with “HarborOS” in all values.
