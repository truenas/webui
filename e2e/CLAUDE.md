# E2E suite — working notes

Playwright tests driving a real browser against a real TrueNAS appliance. Run
everything from the repository root. `e2e/README.md` covers setup and commands;
this file covers the conventions and the traps.

## The one rule

**The UI does the thing; the API sets up and cleans up.**

A test must never use the API to perform the action it is testing — that is the
line between testing the UI and testing middleware. It *should* use the API for
state it merely depends on: driving the pool wizard in order to test a *share*
makes one broken wizard fail six unrelated tests.

Verifying through the API afterwards is fine and often valuable — it asks
whether the appliance is really in the intended state, which is a different
question from whether the screens said so.

## Navigate like a user

**Click through the sidebar. Do not `page.goto()` a feature page.**

Use the helpers in `flows/navigation.ts`. `page.goto()` is correct only for
*entering* the app (the sign-in page) and for the token setup project — neither
of which a person reaches by clicking.

This is not pedantry. Deep-linking to `/sharing/smb` reached a page users do not
arrive at that way, and the test ended up driving the wrong "Add" button: the
Shares dashboard card uses `smb-share-add`, the standalone list page uses
`add-smb-share`. Navigating properly surfaced it immediately.

**Never use an auth token to skip a UI step.** The token exists to skip the ~15
second *login cost* in tests that are not about logging in. It is not a
shortcut past steps of a journey. Tests covering sign-in, sign-out or session
identity live in `tests/unauthenticated/`, which has no token and no dependency
on the setup project — precisely so the bypass cannot hide a broken login.

## Finding a `data-test` value

Selectors are `[data-test="…"]` only. No CSS classes, no text matching, no
XPath, no nth-child.

Search the component template for `testId` or `ixTest`, then work out what is
actually emitted — **components prefix the value with their element type**:

| Template | Emitted |
|---|---|
| `<tn-input [testId]="'username'">` | `input-username` |
| `<tn-button testId="save">` | `button-save` |
| `<tn-icon-button testId="user-menu">` | `button-user-menu` |
| `<tn-menu-item [testId]="'log-out'">` | `button-log-out` |
| `<tn-checkbox formControlName="create_smb">` | `checkbox-create-smb` |
| `<tn-select [testId]="'role'">` | `select-role` + `option-role-full-admin` |
| `<tn-tree-node [testId]="['dataset', name]">` | `dataset-<name>` — no prefix |

Three things that will catch you out:

1. **An unset `testId` falls back to the bound control name.** `<tn-input
   formControlName="name">` emits `input-name` with nothing in the template.
2. **Two kebab-casers are in play and they disagree.** The library's
   `kebabTestSegment` turns `RAIDZ2` into `raidz2`; a control declaring
   `[optionTestIdKey]="optionTestIdByKebabLabel"` runs lodash `kebabCase` first,
   which yields `raidz-2`. Derive option ids from the extractor the control
   actually declares, not from the default.
3. **A few components write the value verbatim**, with no type prefix — those
   applying the directive via `hostDirectives` without `tnTestIdType`.

When unsure, `yarn e2e:ui` and use the locator picker. It is faster than
reading the template and it cannot be wrong.

**If an element has no `data-test`, add one upstream** — in the webui template,
or in `@truenas/ui-components` following the patterns in that library's
`docs/test_ids.md`. Do not fall back to a fragile selector. Both repositories
are in-house.

Known gap: `tn-table` has no per-row test id, so table-row-driven journeys
(deleting a pool, dataset or share from a list) cannot currently be automated
without adding one.

## Waiting

**Never `waitForTimeout`.** Wait on conditions.

- UI: Playwright's assertions retry on their own.
- Middleware jobs: poll the observable outcome with `expect.poll`, or await the
  job. Pool creation and service control are jobs — they complete *after* the
  call returns, so asserting immediately races them.
- **`isVisible()` does not wait.** Probing for a dialog right after the click
  that opens it returns `false` before it renders, silently skips the
  interaction, and surfaces minutes later as an unrelated timeout. Wait for
  dialogs with `expect(...).toBeVisible()`.

Give each operation an explicit, generous timeout rather than leaning on the
global one — a wrong selector should fail in seconds, not burn the test budget.

## Teardown

Clean up over the API, in `afterEach`, **unconditionally** — it has to run after
a failure, which is when it matters most.

- A leaked pool holds its disks and starves every later run.
- Order matters: stop the service, then remove the share, then the pool, so
  nothing is left pointing at a path that no longer exists.
- **Restore global state you changed.** Starting the SMB service changes which
  dialog the app raises next time (`Start` vs `Restart`), so leaving it running
  makes the following run exercise a different path while still reporting green.
  This is the failure mode a passing suite hides.
- Cleanup runs in `beforeEach` too, so a test is re-runnable against a dirty
  appliance.

## Layout

```
tests/       journeys, named *.e2e.ts (never *.spec.ts — that is Jest's)
flows/       UI-driving actions      — signIn(), createRaidz2Pool()
locators/    data-test values, one module per screen; never inline in a test
fixtures/    API-driving setup and teardown
support/     config, auth, API client, the shared `test` object
```

Import `test` and `expect` from `support/fixtures`, not `@playwright/test`. It
provides a connected `api` client and the resolved `config` as worker-scoped
fixtures, so a spec never wires up a connection or remembers to close it.

## Debugging a failure

**Look at the screenshot first.** It has repeatedly beaten reading source: a
"validation failure" turned out to be a share created successfully with a
"Configure ACL" dialog blocking the panel. `test-results/<dir>/` holds the
screenshot, and the trace has a DOM snapshot per step.

Run with `--retries=0` while iterating; a retry on a slow failure only doubles
the wait to learn the same thing.

Two failures that look like bugs and are not:

- **`[EBUSY] Rate Limit Exceeded`** — 20 unauthenticated calls per method per IP
  per minute. Authenticated calls are exempt, so the budget is spent on
  sign-ins. Usually means running the suite repeatedly in quick succession.
- **`Max Concurrent Calls`** — dev-build only, gated on `!environment.production`.
  The shipped UI cannot produce it. An artifact of the `branch` profile.

## Temporary scaffolding

`support/api/untyped.ts` exists only because `@truenas/api-client`'s typed
`call()` covers a curated subset of the API, missing `user.delete`,
`pool.export`, `sharing.smb.*` and others. A release exposing the full typed
surface — including jobs and events — is coming; when it lands, that file and
its call sites are deleted, and the hand-rolled polling loops in
`fixtures/storage.ts` can await jobs directly. Do not add new `callUntyped`
calls where a typed method exists.
