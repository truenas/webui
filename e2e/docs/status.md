# E2E — status and next steps

Replaces `01-requirements.md`, `02-technology.md` and `03-plan-and-status.md`.
Those were requirement and technology records written before the suite existed;
by the time it did, several of their claims described a suite that was never
built, and correcting them round after round cost more than they returned. Their
content is in git history if the reasoning behind a decision is ever wanted.

`e2e/CLAUDE.md` holds the conventions and the traps. `e2e/README.md` covers
setup and running. **This file is only status and direction — keep it that way,
and keep it short.**

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

Three tests. Green against real appliances on the 1.x client — **the move to
3.x has not been re-run against hardware.** Every middleware call in the
fixtures was rewritten, job handling moved, and the API budgets changed; what
backs it is typecheck, lint, test collection, and `ensurePoolAbsent` driven
against a scripted middleware over nine cases. Treat a first real run as
unproven until someone does it.

The framework is done and the coverage is not. Two journeys against 19 top-level
feature areas. What the work bought is that the next twenty tests are cheap: the
target seam, auth, fixtures, unconditional teardown, selector discipline and
failure legibility are all built and proven against three different appliances.

**Total runtime is unmeasured.** Four cold sign-ins at ~15s plus pool creation in
minutes puts it in the several-minute range, but nobody has timed it. Worth
doing, because the runtime budget and the decision to defer parallelism are both
argued from a number that does not exist.

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
2. **CI.** `.github/workflows/e2e.yml` runs the suite against one appliance on
   a same-repo pull request: claim, run, release. Deliberately smaller than the
   design in `04-environment-architecture.md`, which shards across appliances
   and reverts a snapshot between tests — both need `ixnode` verbs that do not
   exist. Proving the reduced shape first tests the parts nobody has exercised
   (runner-to-appliance networking, the claim/release contract, teardown after a
   failure) without waiting on anything.

   Not published: traces, videos and screenshots. Artifacts on a public
   repository are world-readable and a trace records the appliance password as
   typed. The fix is a credential worthless once published — unique per claim,
   appliance destroyed at release — which is a property of the `ixnode`
   contract, so JUnit XML is all that leaves the runner until it holds.
3. **Observability.** No WebSocket capture, no middleware log collection, no
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
| D1 | PR gating — deferred; needs CI and a measured flake rate first |
| D2 | Parallel execution by sharding across appliances — deferred |
