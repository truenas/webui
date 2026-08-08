# E2E — plan and status

**Living document.** Unlike `01-requirements.md` and `02-technology.md`, which
record decisions and age slowly, this one is expected to change with the work.
If it disagrees with the code, the code is right — fix this.

Last reviewed against the suite: after the in-tree move and the shared `api`
fixture.

---

## Where we are

Two user-story journeys and a smoke test, green against three different
appliances including one the suite had never seen. Whole suite runs in ~32
seconds.

| | |
|---|---|
| `tests/smoke.e2e.ts` | authenticated session loads the admin shell |
| `tests/unauthenticated/admin-user.e2e.ts` | create a TrueNAS admin, sign out, sign in as them |
| `tests/unauthenticated/fresh-install.e2e.ts` | day one: user → 9-wide RAIDZ2 pool → dataset → SMB share → start service → verify access |

**The framework is ready; the coverage is not.** Two journeys against 19
top-level feature areas. What the work so far bought is that the next twenty
tests are much cheaper than the first two — the seam, auth, fixtures, teardown,
selector discipline and failure legibility are all built and proven.

### Proven

- Both target profiles (`shipped`, `branch`) against real appliances
- Token auth for speed, real form login where login is the subject
- API fixtures with unconditional teardown, including restoring global state
- `[data-test]`-only selectors, with the derivation rules documented
- Failure legibility — middleware errors surface by name, not as timeouts
- Runs from pure environment variables, with no developer working-tree state

### Not yet

- **CI**: nothing wired up. Infrastructure-blocked, not suite-blocked.
- **Flake history**: R8.4's quarantine policy is unenforceable without a
  measured failure rate. Needs weeks of scheduled runs.
- **Observability**: no WebSocket capture, no middleware log collection, no
  version recording in reports (R7.1, R7.2, R2.4).
- **Helper coverage**: `findGroupAclGrants`, the polling loops and config
  validation have no unit tests. Each was verified by hand, once.
- **Nothing guards the `data-test` contract.** Every locator depends on
  attributes that webui's own convention forbids unit tests from using, so they
  have no coverage in the repository that emits them. NAS-142069 was one such
  attribute deleted by a component migration, caught by a person rather than by
  CI. Until this is closed, each new test enlarges the surface that can break
  silently on an unrelated refactor. Cheapest fix: a Jest guard asserting the
  ids the suite's locators reference actually render.

---

## Next steps

Roughly in dependency order. Nothing here blocks anything else except where
noted.

### 1. Widen story coverage

The cheapest valuable work, and the reason the framework exists. From the
original story set (R1.1), still uncovered:

| | Story | Note |
|---|---|---|
| S6 | Dataset permissions / ACL | The most complex UI in the set |
| S7 | Manual snapshot | |
| S8 | Delete share, dataset, pool through the UI | **Blocked** — see below |

**S8 is blocked on a library gap.** `tn-table` has no per-row test id, so no
table-row-driven journey can be automated compliantly. Deleting a pool, dataset
or share all start by clicking a row. The fix is a `rowTestId` extractor input
on `tn-table` following the library's Pattern C, then wiring it up in the
consuming templates. Worth doing once — it unblocks every future list-driven
test, not just S8.

### 2. Retire the untyped escape hatch

Waiting on the api-client release that exposes the full typed surface, jobs and
events, plus a v27 client. When it lands:

- Delete `support/api/untyped.ts` and its five call sites (`sharing.smb.delete`,
  `service.update`, `service.control`, `pool.export`, `user.delete`)
- `pool.export` and `service.control` are **jobs** — await them directly and
  delete the hand-rolled polling loops in `fixtures/storage.ts`
- Confirm `disk.get_unused` is included; it works live but appears nowhere in
  the generated manifest, so it may be absent from the `--dump-api` dump

Do it as its own commit, so the diff reads as "remove workaround".

**One live risk until then**: the current client maps only `25.10` and `26`,
while appliances already advertise `v27.0.0`. It negotiates down and works
today, but throws at `createTrueNasClient` — before any test runs — the moment
v26 leaves the advertised range.

### 3. CI

Entirely infrastructure. The suite side is done and verified: it runs from
environment variables alone, emits JUnit XML and an HTML report, and gates
`forbidOnly` on `CI`.

What's needed:

- **Runners that can reach the appliance network.** No suite change can solve
  this; hosted runners cannot see it.
- **A concurrency guard.** The suite assumes it owns the appliance — two runs
  against one VM will destroy each other's pools. One VM per run, or serialise.
- **Secrets** for credentials, and `TN_HOST` from the provisioning step.

### 4. Observability (R7)

Worth doing before coverage grows much further — these are what make a 3am
failure diagnosable by someone who did not write the test.

- WebSocket/JSON-RPC frame capture attached to failed tests
- Middleware job logs collected **before** an ephemeral VM is destroyed
- TrueNAS, middleware and webui versions recorded in the report

Typed events (arriving with the new api-client) would make the job timeline much
easier than reading raw frames.

### 5. Hardening

- Unit tests for the suite's own helpers
- Run-scoped naming (R3.3), if the suite ever needs to tolerate concurrent runs
  against one appliance. Currently fixed names (`bob`, `e2e_tank`) — fine for
  one-VM-per-run, collides on a shared dev VM.
- A triage runbook, once there are enough failures to know what triage looks
  like

---

## Deferred, with reasons

- **PR gating (D1)** — reachable now the suite is in-tree, but a gate that flaps
  for unrelated reasons gets ignored. Needs CI and a measured flake rate first.
- **Parallelism (D2)** — sharding across VM instances, not workers. Only worth
  it when runtime actually hurts; ~32s today.
- **Production-build `branch` profile** — `ng serve` covers local and PR use.
  Serving a production build needs a proxying server, and matters only if the
  dev bundle's differences turn out to matter (R2.11).
- **Appliance mismatch detection (D5)** — a `branch` run pointed at a different
  appliance than the dev server fails opaquely. Cheap to detect once the
  WebSocket capture fixture exists, since the browser reveals the host it
  connects to.

---

## Signals to stop and re-plan

- **Test-ID gaps turn out to be pervasive** rather than occasional. Then the
  dependency on other teams' review cycles *is* the schedule, and that should be
  an explicit decision rather than a discovered one.
- **The suite exceeds its runtime budget** (R8.1, ≤45 min) well before the story
  set is complete. With journeys at ~20s each that is far off, but it would
  indicate R3.1 being violated — tests driving the UI for preconditions.
- **More than one story is quarantined.** Quarantine is a pressure valve, not
  storage for known-broken tests.
