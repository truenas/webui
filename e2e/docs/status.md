# E2E — status and next steps

Replaces `01-requirements.md`, `02-technology.md` and `03-plan-and-status.md`.
Those were requirement and technology records written before the suite existed;
by the time it did, several of their claims described a suite that was never
built, and correcting them round after round cost more than they returned. Their
content is in git history if the reasoning behind a decision is ever wanted.

`e2e/CLAUDE.md` holds the conventions and the traps. `e2e/README.md` covers
setup and running. `05-ci.md` is the CI pipeline as built. **This file is only
status and direction — keep it that way, and keep it short.**

---

## Where we are

Running on **`@truenas/api-client` 5.x**, which types the full generated API
surface per version rather than a curated subset of 65 endpoints. There is no
escape hatch: every middleware call is checked against a real signature.
`pool.export` and `service.control` are declared as jobs and go through `runJob`
in `support/jobs.ts`, which starts the job and re-reads `core.get_jobs` until it
reaches a terminal state — a poll rather than `client.api.job()`, because both
jobs restart services over the socket the event stream depends on.

`support/api/client.ts` names the API surface the suite is written against:
**v27**, which the nightlies advertise and the client implements. That type
parameter is the one place the choice is made; unset, the client defaults to
v25.10.0 and most of what the fixtures call looks unavailable.

Three tests were **green on the 3.x client against a freshly installed v27
nightly, in CI, 2026-09-02** — the first real run after the client move, and it
passed first time once the appliance was right. The later move to 5.x (2026-09-08)
changed nothing the suite calls; it was proven by the same runs that proved S3.

S3 followed (2026-09-07/08), in `tests/s3*.e2e.ts`: creating a bucket with
object lock from the Shares dashboard and minting an access key under
Credentials (`s3.e2e.ts`, green in CI from run 34257876916: no retries, once the
harness signed each test in with its own token — see the `page` fixture); then
the service on a TLS listener (`s3-service`), grants to a real user and group,
the row toggle and delete (`s3-bucket-management`), and rotating and deleting a
key (`s3-access-key-management`). They need a pool (any, or they build a
one-disk one through the worker-scoped `pool` fixture, exported when the worker
ends) and the S3 service. The S3 work also
moved the suite to `@truenas/api-client` 5.0, the first release whose v27
directory carries `sharing.s3.*` and `s3.accesskey.*`, and pulled the shared
pieces out: `fixtures/services.ts` (one service-stop protocol for SMB and S3)
and `support/cleanup.ts` (the run-every-step teardown).

Sign-in came next, in `tests/unauthenticated/signin.e2e.ts`: the refusals and
warnings the front door had no coverage of. Two of them are the authorization
half rather than the authentication one, and both were probed against a v27
appliance rather than reasoned about — an account with no privilege is refused
by middleware (`DENIED`), while an account holding a privilege that grants no UI
access is *authenticated* (`SUCCESS`, `webui_access: false`) and refused by the
app alone. The suite grew a page-scoped dismissal for the development build's
concurrency dialog at the same time; it is modal, the dashboard's own startup
raises it, and without that it blocked every interaction after sign-in.

Users followed, in `tests/users-form.e2e.ts` and `tests/users-deletion.e2e.ts`:
the add-user form's conditional role control and its two refusals, and deleting
a user — the row it was told to, and both branches of the primary-group
checkbox. Every saved or deleted account is checked through `user.query` rather
than the list, which is what separates "the screen believed it" from "the
appliance did it". Writing them turned up a real gap: the duplicate-username
validator was wired only on the edit form, so a new user learned the name was
taken only after submitting. Fixed in the same change.

Groups came after, in `tests/groups-form.e2e.ts`, `tests/groups-members.e2e.ts`
and `tests/groups-deletion.e2e.ts`. Two of those cover the same ground the user
specs do — a form with a conditional field and a list that deletes the row you
opened — and the third covers the thing groups have that users do not:
membership, which lives on a route of its own and which the *list* reads back to
decide whether Delete is offered at all. Editing one screen changing what another
will permit is the only cross-screen rule on these pages, and nothing below E2E
can see it. Two smaller notes came out of writing them: the group form's
`Allow All Sudo Commands` checkbox is not an API field, so what it stores
(`sudo_commands: ['ALL']`) is only observable through `group.query`; and
`group.users` holds *auxiliary* members, not only the accounts whose primary
group it is — confirmed against a v27 appliance, and the reason a group with any
member at all cannot be deleted from the list.

The members picker had no per-record test id, so no test could name one user
among the hundreds a stock appliance lists. Added in the same change
(`list-item-available-<name>` / `list-item-selected-<name>`). It is built from
each record's displayed name, because the picker's own key is a numeric id the
appliance allocates and no test can know in advance — which makes the id exactly
as unique as the displayed name is. Usernames qualify. The control's only other
consumer, the iSCSI initiator form, does *not*: it displays
`<initiator> (<address>)`, so an id there would carry a client IP that moves.
Addressing that picker needs a discriminator of its own first.

Preferences came next, in `tests/preferences.e2e.ts` and one spec under
`tests/unauthenticated/`. It is the only area covered so far whose defining claim
is unreachable below this layer: a unit test can prove the reducer built a new
object and the effect called `auth.set_attribute`, but only a browser against an
appliance can say the value came back. So each test asserts twice — the screen
re-rendered, *and* `auth.me` holds it — and the session spec signs out, clears
both `localStorage` and `sessionStorage` (the theme is cached in each, under
webui's key and the library's) and signs back in, which is the only way to ask
the question the feature actually answers.

Its setup and teardown are unlike anything else here and are worth reading before
copying: preferences are a blob hanging off the account the whole suite signs in
as, so there is nothing to delete and a per-field undo is not enough.
`fixtures/preferences.ts` therefore *establishes* a known baseline before each
test and hands back exactly what `afterEach` must write. It does not snapshot
and restore what it found — that would make every test's precondition "whatever
the appliance happened to be set to", and a run interrupted between a change and
its restore would leave the next one measuring from somewhere nobody chose. One
subtlety it turns on: an absent `preferences` attribute is not an empty one, and
writing `{}` over an account that had none leaves the app with no `lifetime`, no
`language` and no `sidenavStatus`. Two facts found while writing it: the applied
theme is a class on `<html>` under the
*library's* name (`ix-dark` is stored, `tn-dark` renders — the map lives in
`theme.service.ts`), while `<body>` carries a static `ix-dark` from
`src/index.html` that nothing ever updates, so a test asserting on the body class
would pass against any theme at all.

Dataset deletion came next, in `tests/datasets-deletion.e2e.ts`, and it is here
for a reason the other specs are not: it covers a bug that *shipped to
nightlies*. The delete-dataset dialog gates on the dataset's name typed back and
a Confirm tick, and disables its button until it has both — but the tn-dialog
migration moved the dialog's actions outside `<form>`, and `tn-button` renders
`type="button"`, so the form was left with one text input and no submit button
at all. That is exactly the shape the HTML spec submits when Enter is pressed in
a text field, and the handler did not re-check validity. Enter in the name field
destroyed the dataset with both gates untouched.

Nothing below E2E could see it, and that is the point of the spec. The unit
tests asserted the confirm button was disabled and it genuinely was; the browser
submitted the form regardless. Only a real browser driving a real dialog can ask
whether the *keyboard* can reach a destructive call, so the claims are about
Enter rather than about the button, and each is settled through
`pool.dataset.query` — a dialog left open is not evidence the dataset survived.
The fifth test is the counterweight: a guard that swallowed Enter unconditionally
would satisfy the other four and quietly break deletion for anyone not reaching
for the mouse.

Writing it turned up a `data-test` collision. The dialog's confirm button
declared `testId="delete-dataset"`, the same value the details card behind it
emits, so with the dialog open `[data-test="button-delete-dataset"]` matched two
elements. Renamed to `dialog-delete-dataset`, following the convention webui's
shared confirm dialog already uses (`button-dialog-confirm`). The generic
dataset fixtures moved to `fixtures/storage.ts` at the same time — they had been
sitting in `fixtures/s3.ts`, which is not their home and is not where anyone
would look for them.

Four sibling dialogs share the defective shape and are **not** covered here:
pool export/disconnect, app delete, SED reset and VM device delete. All four are
guarded in the same change, with Jest regression tests, but an appliance-level
journey for them needs a pool it may destroy, an installed app, SED hardware and
a VM respectively. Pool export is the one worth taking next and the one this
suite could actually reach.

The groups built-ins toggle turns out to be one of these — account state wearing
the clothes of view state — which is also the "page one" gap below. The
preferences spec met that gap head-on: `builtin_administrators` is 79th of 93
groups by GID, so with a 50-row page it is not in the DOM at all.

The framework is done and the coverage is not. Fifty-one tests — fifty
journeys and the smoke — against 19 top-level feature areas. What the work
bought is that the next twenty tests are cheap: the target seam, auth, fixtures,
unconditional teardown, selector discipline and failure legibility are all built
and proven against three different appliances.

**Flake rate has a number now.** Six consecutive full-suite runs on one
appliance, zero failures and zero flaky — three from a golden snapshot and three
back to back without one, which also showed teardown leaving no pool, dataset,
user, share or running service behind. That bounds the per-test rate under ~2%
and the per-run rate only under ~39%; D1's gating decision wants more runs than
six, but it is no longer resting on nothing.

**Total runtime is measured:** the suite takes ~1.5 minutes on one worker
against a nested VM, and the whole CI job ~6 minutes of which ~3.5 is the
install. The runtime budget and the decision to defer parallelism now rest on
a number. See `05-ci.md`.

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

## Next steps

1. **Widen coverage.** Dataset ACL and manual snapshot are the two uncovered
   stories worth taking next, and **pool export/disconnect** joins them — it is
   the one remaining dialog of the confirmation-bypass class this suite can
   actually reach (see the dataset-deletion paragraph above). S3 is covered as a feature — create, configure,
   edit, toggle, rotate, delete — except auditing, which is licence-gated and
   needs an Enterprise appliance. List-driven journeys (deleting a pool, dataset
   or share from a list) are no longer blocked: `tn-table` still writes nothing
   on the `<tr>`, but every list tags its cells with the row's identity and a
   lint step keeps it that way — see "Addressing a table row" in `CLAUDE.md`
   (NAS-143804).
2. **CI is running.** `.github/workflows/e2e.yml` installs a nested TrueNAS VM
   on the lab runner (a TrueNAS box) with `tn_guest.py` from
   iXsystems/api-ci-testbed, runs the suite against it from Playwright's
   container, and destroys it. Green on same-repo pull requests touching the
   suite. `05-ci.md` is the operational record: prerequisites, numbers, and
   what each failed run taught. `ixnode`, which the design assumed, is the
   legacy KVM-host tool and cannot run on a TrueNAS appliance.

   Deliberately smaller than `04-environment-architecture.md`, which shards
   across appliances and rolls back a snapshot between tests. Neither exists
   yet. That document was rewritten against the pipeline as built: the design
   stands, the substrate is a TrueNAS host with zvol-backed VMs rather than
   `ixnode` on libvirt, and the rollback cycle it wanted measured is now
   read off every clone.

   It runs nightly and on every merged UI change, drives the UI built from
   the checkout, and publishes traces for failed tests. Appliances are
   clones of a template rebuilt whenever the weekly-rotated nightly ISO moves,
   rather than fresh ISO installs (E5 in the design, first form). What is next for the pipeline is reading the
   rollback cycle (Q0b) off the clone timings and deciding about per-test
   restore on that number.
3. **Observability.** No WebSocket capture, no middleware log collection (the
   guest is behind `hostfwd`, so it needs an API route rather than SSH), no
   version recording in reports. These are what make a 3am failure diagnosable
   by someone who did not write the test.

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
- **The delete-group dialog's "delete these users too" checkbox is unreachable**,
  and so has no test. It renders when the group has members, while the button
  that opens the dialog is disabled for exactly that reason — two rules that
  contradict each other, added at different times. Deciding which one is right
  is a product call rather than a test one; the tooltip ("Groups with privileges
  or members cannot be deleted") reads like the deliberate half.
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
| D2 | Parallel execution by sharding across appliances — deferred |
