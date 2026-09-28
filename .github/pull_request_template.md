<!--
A PR can be opened without a Jira ticket, but it cannot be merged without one:
the `check-ticket` check stays red until the title references a ticket, for example:
  NAS-12345: Fix broken thing
  NAS-12345 / 27.0.0-BETA.1 / Fix broken thing
No ticket yet? Add the `jira` label and bugclerk creates one; then put its key
in the title before merging.
-->

**Changes:**

<!-- Briefly describe what changed. -->

**Testing:**

<!-- If necessary provide testing instructions or refer reviewer to ticket. -->
<!--
  Touching a table, list or form? Say what happened to its `data-test` values.
  Removing one that already resolved is a breaking change for the downstream
  suites and needs a replacement in this PR — see "Addressing a table row" in
  e2e/CLAUDE.md.
-->

### Downstream
<!--- Note downstream areas that can be affected with a brief reasoning after "|" of each -->

|Affects         |Reasoning
|----------------|-------------------------------
|Documentation   |
|Testing         |
