# E2E — what the suite assumes and what it cannot do

Replaces `01-requirements.md`, `02-technology.md` and `03-plan-and-status.md`.
Those were requirement and technology records written before the suite existed;
by the time it did, several of their claims described a suite that was never
built, and correcting them round after round cost more than they returned. Their
content is in git history if the reasoning behind a decision is ever wanted.

`e2e/CLAUDE.md` holds the conventions and the traps. `e2e/README.md` covers
setup and running. `05-ci.md` is the CI pipeline as built.

**This file holds only what the tests and the CI run cannot tell you**: what an
appliance must provide, the gaps a test cannot close on its own, and the decision
numbers code comments cite. **Adding a test does not touch it.**

It used to carry a feature-by-feature narrative of what was covered, which every
test-adding PR appended to. Pull requests in flight together conflicted over it,
and a fully green pull request was refused a merge on it alone, so the narrative
was dropped (and before it, the suite's test total). What is covered is the
`tests/` directory; how many tests ran, and which, is the `e2e-junit-<shard>`
artifact of an E2E run. The narrative is in git history up to its removal.

---

## What the suite needs from an appliance

- **At least 9 identical unused disks.** Identical is load-bearing: the pool
  wizard groups by `(type, size)` and offers widths from one group at a time.
- Disks with duplicate or blank serials, or carrying an exported pool, are
  filtered out by the wizard and do not count. Hypervisors hand out blank
  serials readily — set distinct ones.
- An admin account **without** two-factor. The suite cannot answer the challenge.
- Fully booted, no first-boot wizard, no EULA.
- **A cleartext origin for the UI.** One test asserts the insecure-connection
  warning, which is decided from the scheme the page was loaded with, so it
  needs an address that is really `http:`. An appliance serves port 80 without
  redirecting; CI publishes one beside the TLS port and names it in
  `TN_UI_BASE_URL_HTTP`. Where neither exists the test skips rather than fails,
  and the id it asserts then has no cover on that target.
- **Outbound HTTPS to github.com and ghcr.io** for `tests/apps-install.e2e.ts`,
  which syncs the apps catalog from github.com/truenas/apps and installs IT
  Tools, whose image is on ghcr.io. Without it those tests fail at the catalog
  sync or the install job. `tests/apps-custom-yaml.e2e.ts` needs ghcr.io too:
  it pulls BusyBox from there before installing a custom app that runs it, and
  pulls it again from Manage Container Images. Without it those tests fail at
  the pull. `tests/apps-settings.e2e.ts` needs github.com: its preferred-trains
  tests sync the catalog so that the form has trains to offer. Without it they
  fail at the sync, and the file's other tests still run.
- **An Active Directory domain it can reach and join**, for
  `tests/unpublished/directory-services-ad.e2e.ts`, named by the `TN_AD_*` variables
  (`.env.example`); without `TN_AD_DOMAIN` that file skips. The domain
  controllers must serve its DNS, since the spec points the nameservers at
  them, and the account must be allowed to create and delete computer objects
  in `TN_AD_COMPUTER_OU`. CI uses the internal test domain (`docs/05-ci.md`).
- **A spare NIC with no address and no peer**, for
  `tests/network-interfaces-commit.e2e.ts`. That file commits interface
  changes, and a commit on the NIC the suite talks to can cut the run off. List
  the spare's MAC in `TN_SPARE_NICS` (comma-separated, the first is used).
  Without it the file skips. CI boots its appliance with one
  (`spare-nics: 1`, `docs/05-ci.md`). The spec pins the management NIC as DHCP
  in the database while it runs and removes that row afterwards. On an
  appliance whose management NIC is already configured, it leaves that row
  alone.

## Known gaps

- **TLS verification is disabled process-wide** by `playwright.config.ts`, not
  scoped to the one connection that needs it. Still no seam in
  `@truenas/api-client@5.0.0`: `CreateClientOptions` gained a `version` option
  but still exposes no TLS, socket-constructor or dispatcher option. See the
  comment there for what would close it.
- **Nothing guards the `data-test` contract.** Every locator depends on
  attributes that webui's own convention forbids unit tests from asserting on,
  so they have no coverage in the repository that emits them. NAS-142069 was one
  such attribute deleted by a migration and caught by a person, not by CI.
- **Per-test token login** replaced `storageState` once two authenticated tests
  ran back to back (the S3 pair). `setup` still gates the authenticated project
  as the earliest report of a broken token login. Each login mints its own
  token: middleware stops honouring one once the session that redeemed it ends,
  so a per-worker token carried exactly one test too. Cost: one authenticated
  call and a few seconds per test.
- **Fixed names** (`bob`, `e2e_tank`, `e2e_shared_tank`, the S3 specs' owners) mean two runs against one appliance
  collide. Fine for one-appliance-per-run; run-scoped naming is the fix.
- **List assertions assume the row is on page one.** The pager defaults to 50,
  and the group and user lists hide built-ins behind a *persisted per-admin
  preference* — so on an appliance where someone once turned built-ins on, a
  freshly created group (highest GID, ascending sort) lands on page two and its
  spec times out against a screen that is working. No code here flips that
  preference and the golden snapshot has it off, so nothing fails today. The fix
  is a shared "find this row" flow that filters first, across the user specs as
  well as the group ones. **This has now bitten once**, in the preferences spec,
  which turns built-ins on deliberately: it asserts on `wheel` (GID 0) precisely
  because `builtin_administrators` is 79th of 93 and therefore on page two.
- **The preferences fixture cannot restore an account that had none.** Middleware
  exposes `auth.set_attribute` and no way to unset an attribute, so on an account
  that has never saved a preference `establishPreferenceBaseline` leaves one
  behind — webui's own defaults, which is what that account was already being
  given at runtime, but now written down rather than inferred. Harmless in
  practice and irreversible, so it is recorded rather than worked around.
  `fixtures/dashboard.ts` has the same limit for `dashState`: an account that
  never saved a layout is restored to `null`, which webui renders as the default
  layout exactly as it does a missing attribute, but the key stays behind.
- **`isNewTimeMachineShare` in `smb-form.component.ts` is dead code**, and the
  restart prompt is broader than the comments around it imply. The prompt is
  gated on `isRestartRequired`, which is `this.isNew || this.form.dirty` — so it
  appears for every new share and every edit while SMB is running, whatever the
  purpose. The Time Machine transition logic the comments describe lives in
  `isNewTimeMachineShare`, which nothing in `src/` references. So
  `smb-service.e2e.ts` covers the Apple-extensions gate and leaves the restart
  prompt alone: pinning the current behaviour would encode something that reads
  as unintended. Worth a product answer before it is tested either way.
- **The batch-delete dialog's clone guard never fires.** It disables Delete on
  `properties.clones`, which middleware does not return from either snapshot
  query, requested or not. The details row had the same dead guard and now asks
  `pool.dataset.query` for datasets whose `origin` is the snapshot; the batch
  dialog still relies on middleware refusing.
- **The delete-group dialog's "delete these users too" checkbox is unreachable**,
  and so has no test. It renders when the group has members, while the button
  that opens the dialog is disabled for exactly that reason — two rules that
  contradict each other, added at different times. Deciding which one is right
  is a product call rather than a test one; the tooltip ("Groups with privileges
  or members cannot be deleted") reads like the deliberate half.
- **A run that dies mid-join leaves a computer account in the shared domain.**
  Teardown leaves the domain, which deletes it, but a runner that is cancelled
  or lost never gets there. Every account the suite creates is named `e2eui-`
  and eight random characters, in `TN_AD_COMPUTER_OU`, so the leftovers can be
  told apart; nothing sweeps them yet.
- **`AuthResponseType` is declared but not exported** while
  `AuthResponse.response_type` is typed as it, so `support/api/client.ts` checks
  a successful login by comparing `String(...)` against `'SUCCESS'`. Still true
  in 5.0.0. (`ServiceControlAction`, which had the same problem, is gone from
  5.0 altogether; `service.control` is a job whose path takes the verb as a
  literal, so nothing here needed it.)

---

## Decision numbers cited in code

Code comments carry `R`/`T`/`D` numbers from the removed records. They are kept
because they mark deliberate decisions rather than incidental choices; this is
the whole of what they mean. **Do not add new ones** — write the reason in the
comment instead.

| | |
|---|---|
| R1.2 | Stories are independent tests with API-provisioned preconditions, not one chain |
| R2.2 | Disk inventory — see "What the suite needs" above |
| R2.7 | Provisioning is the pipeline's job; the suite is handed a reachable host and asserts nothing about how it came to exist |
| R2.8 | The appliance boots fully configured — credentials set, no first-boot wizard, no EULA |
| R2.9 | The appliance's certificate is self-signed; tolerate it without hiding real failures |
| R2.10 | Reading webui's own config is allowed in-tree, confined to one module, and opt-in |
| R2.11 | Two target profiles differing in exactly one thing: the UI base URL |
| R3.1 | Preconditions via API, assertions via UI. Never use the API to do the thing under test |
| R3.2 | Teardown runs over the API, unconditionally, including after failure |
| R3.3 | Run-scoped naming, so concurrent runs cannot collide (not yet implemented) |
| R3.4 | Serial execution; scale by sharding across appliances, not workers |
| R3.5 | Every test passes when run alone against an already-dirty appliance |
| R4.1 | Token-based session reuse via `auth.generate_token`, not `reconnect_token` |
| R4.2 | One real login: sign-in tests use no token bypass |
| R4.3 | Tokens expire after 2 hours; a longer run must refresh rather than fail obscurely |
| R4.4 | The suite owns its token helper; webui's hardcodes a localhost base URL |
| R5.1 | `[data-test="…"]` selectors only — no classes, text, XPath or nth-child |
| R5.3 | Selectors live in the locator layer, never inline in a test |
| R5.5 | Navigation is relative to the configured base URL. No absolute paths |
| R6.2 | A failure must be triageable without a local reproduction |
| R7.1 | Client-side capture on failure: trace, screenshot, video |
| R7.2 | Server-side capture on failure: middleware logs, before the appliance is reclaimed |
| R7.4 | Run history, so flake rate is measurable |
| R8.1 | Runtime target ≤45 minutes |
| R8.2 | At most one retry per test |
| R8.3 | No fixed sleeps — wait on observable conditions |
| R8.4 | Quarantine policy for persistently flaky tests |
| R9.2 | One command runs the suite against a developer's own appliance |
| T3 | Middleware client is `@truenas/api-client` (5.x since 2026-09-08, 3.x before; T3.1 covered the curated-subset problem that 3.x removed) |
| T5 | Authentication via a setup project plus `storageState` — the `storageState` half was dropped 2026-09-08: the app rotates the persisted token into a five-minute single-use one, so the snapshot carried exactly one test. Each authenticated test now signs in through the token URL in the `page` fixture |
| T10 | Configuration through target profiles, resolved in one module |
| D1 | PR gating — deferred; needs a measured flake rate first. The `e2e` check runs on same-repo PRs touching the suite, but it is not a required check, so a red run informs and does not block |
| D2 | Parallel execution by sharding across appliances — two shards by default since 2026-10-22 |
