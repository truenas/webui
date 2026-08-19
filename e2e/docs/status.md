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

Three tests, green against real appliances. `smoke` proves the authenticated
session loads; `admin-user` creates a TrueNAS admin and signs in as them;
`fresh-install` is the day-one journey — user, 9-wide RAIDZ2 pool, dataset, SMB
share, start the service, then verify over the API that the appliance is really
serving and that the owner can actually write to it.

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
2. **CI.** Only `yarn e2e:typecheck` runs today, in the lint job. Running the
   suite needs runners that can reach the appliance network and a provisioning
   step — see `NAS-e2e-environment-architecture` for that design.
3. **Retire `support/api/untyped.ts`.** Eleven call sites across
   `fixtures/storage.ts` (8), `fresh-install.e2e.ts` (2) and `fixtures/users.ts`
   (1), waiting on an api-client release that types the full surface and jobs.
   `pool.export` and `service.control` are jobs, so that release also removes
   the polling in `ensurePoolAbsent` and `ensureSmbServiceStopped`.
4. **Observability.** No WebSocket capture, no middleware log collection, no
   version recording in reports. These are what make a 3am failure diagnosable
   by someone who did not write the test.

## Known gaps

- **TLS verification is disabled process-wide** by `playwright.config.ts`, not
  scoped to the one connection that needs it. No seam exists in
  `@truenas/api-client@1.0.6` — see the comment there for what would be needed.
- **Nothing guards the `data-test` contract.** Every locator depends on
  attributes that webui's own convention forbids unit tests from asserting on,
  so they have no coverage in the repository that emits them. NAS-142069 was one
  such attribute deleted by a migration and caught by a person, not by CI.
- **Fixed names** (`bob`, `e2e_tank`) mean two runs against one appliance
  collide. Fine for one-appliance-per-run; run-scoped naming is the fix.
- **Upstream asks on `@truenas/api-client`:** `AuthResponseType` and
  `ServiceControlAction` are declared but not exported, and both appear in
  signatures callers must satisfy. The second is why `service.control` alone
  cannot go through the typed API.

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
| T3 | Middleware client is `@truenas/api-client` |
| T3.1 | Its typed `call()` covers a curated subset, hence `support/api/untyped.ts` |
| T5 | Authentication via a setup project plus `storageState` |
| T10 | Configuration through target profiles, resolved in one module |
| D2 | Parallel execution by sharding across appliances — deferred |
