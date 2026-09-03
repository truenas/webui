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

Running on **`@truenas/api-client` 3.x**, which types the full generated API
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

Three tests. **Green on the 3.x client against a freshly installed v27 nightly,
in CI, 2026-09-02** — the first real run after the client move, and it passed
first time once the appliance was right. The move to 3.x is no longer unproven.

The framework is done and the coverage is not. Two journeys against 19 top-level
feature areas. What the work bought is that the next twenty tests are cheap: the
target seam, auth, fixtures, unconditional teardown, selector discipline and
failure legibility are all built and proven against three different appliances.

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

## Next steps

1. **Widen coverage.** Dataset ACL and manual snapshot are the two uncovered
   stories worth taking next. Deleting things through the UI is blocked: no
   per-row test id on `tn-table`, so no list-driven journey can be automated
   compliantly. Fixing that once unblocks every future one.
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
   `ixnode` on libvirt, and its next step is measuring the rollback cycle.

   What is next for the pipeline, in order: rotate the nightly ISO
   automatically, publish traces (the per-claim credential the design required
   now holds), enable the nightly schedule, and give the `main.yml` unit-test
   job a label that does not match the lab runner.
3. **Observability.** No WebSocket capture, no middleware log collection (the
   guest is behind `hostfwd`, so it needs an API route rather than SSH), no
   version recording in reports. These are what make a 3am failure diagnosable
   by someone who did not write the test.

## Known gaps

- **TLS verification is disabled process-wide** by `playwright.config.ts`, not
  scoped to the one connection that needs it. Still no seam in
  `@truenas/api-client@3.0.2`: `CreateClientOptions` still exposes no TLS,
  socket-constructor or dispatcher option. See the comment there for what would
  close it.
- **Nothing guards the `data-test` contract.** Every locator depends on
  attributes that webui's own convention forbids unit tests from asserting on,
  so they have no coverage in the repository that emits them. NAS-142069 was one
  such attribute deleted by a migration and caught by a person, not by CI.
- **Fixed names** (`bob`, `e2e_tank`) mean two runs against one appliance
  collide. Fine for one-appliance-per-run; run-scoped naming is the fix.
- **`AuthResponseType` is declared but not exported** while
  `AuthResponse.response_type` is typed as it, so `support/api/client.ts` checks
  a successful login by comparing `String(...)` against `'SUCCESS'`. Still true
  in 3.0.2. `ServiceControlAction` has the same problem but no longer costs
  anything: `service.control` is a job, and the job path takes the verb as a
  literal.

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
| T3 | Middleware client is `@truenas/api-client` (3.x; T3.1 covered the curated-subset problem that version removed) |
| T5 | Authentication via a setup project plus `storageState` |
| T10 | Configuration through target profiles, resolved in one module |
| D1 | PR gating — deferred; needs a measured flake rate first. The `e2e` check runs on same-repo PRs touching the suite, but it is not a required check, so a red run informs and does not block |
| D2 | Parallel execution by sharding across appliances — deferred |
