# E2E — plan and status

**Living document.** Unlike `01-requirements.md` and `02-technology.md`, which
record decisions and age slowly, this one is expected to change with the work.
If it disagrees with the code, the code is right — fix this.

Last reviewed against the suite: after the in-tree move and the shared `api`
fixture.

---

## Where we are

Two user-story journeys and a smoke test, green against three different
appliances including one the suite had never seen.

**Total runtime is unmeasured.** This said "~32 seconds", which was measured when
the smoke test was the whole suite and cannot describe one containing
`fresh-install.e2e.ts`. The two journeys perform four cold form sign-ins between
them at ~15s each (R4.1) — a minute before any feature work — and `fresh-install`
then builds a 9-wide RAIDZ2 pool, which `playwright.config.ts` and
`flows/storage.ts` both budget in minutes. Several minutes is the plausible
range; the number itself needs a timed run against a known appliance, and it
matters because the R8.1 budget and the D2 deferral are both argued from it.

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
- **Helper coverage**: `findGroupAclGrants`, `waitUntil` and config validation
  have no unit tests. Each was verified by hand, once.
- **Scoped TLS leniency**: `playwright.config.ts` sets
  `NODE_TLS_REJECT_UNAUTHORIZED=0`, which disables certificate verification for
  every outbound connection the runner makes, for the life of the process —
  including ones a later change adds without reading the comment. It should be
  scoped to the one connection that needs it: middleware over `wss://`, plus the
  version-discovery `fetch` that precedes it.

  Blocked upstream, verified against `@truenas/api-client@1.0.6` — what the
  `~1.0.3` range in `package.json` currently resolves to.
  `CreateClientOptions` exposes `uuid`, `hostnames`, `enabled`, `systemName` and
  `logger` only; the rxjs `WebSocketSubjectConfig` is built internally, so there
  is no `WebSocketCtor` or dispatcher to hand a lenient agent to, and version
  discovery's `fetch` has no seam either. `NODE_EXTRA_CA_CERTS` is not an answer
  while the certificate is generated per appliance at install time.

  **The ask**: one option on `CreateClientOptions` — a `WebSocketCtor`, or an
  undici dispatcher used for both the socket and version discovery. Until then
  the concession is stated on every run in the startup banner rather than left
  to a comment.
- **Two api-client types are declared but not exported**, and both appear in
  signatures the package expects callers to satisfy:
  - `AuthResponseType` — `AuthResponse.response_type` is typed as it, so
    checking for a successful login means comparing `String(...)` against
    `'SUCCESS'` (`support/api/client.ts`).
  - `ServiceControlAction` — the first parameter of `service.control`. Because
    it is a string enum, the literal `'STOP'` is rejected and there is no way to
    obtain the value, so that one call still goes through `callUntyped` while
    `service.query` and `service.update` beside it are typed
    (`fixtures/storage.ts`).

  Neither is a workaround worth keeping. **The ask**: export both. Verified
  against `@truenas/api-client@1.0.6`.

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

- Delete `support/api/untyped.ts` and its **eleven** call sites, covering ten
  methods:
  - `fixtures/storage.ts` (8) — `disk.details`, `sharing.smb.query`,
    `sharing.smb.delete`, `user.query`, `group.query`, `filesystem.getacl`,
    `service.control`, `pool.export`
  - `tests/unauthenticated/fresh-install.e2e.ts` (2) — `sharing.smb.query`,
    `service.query`
  - `fixtures/users.ts` (1) — `user.delete`

  Not `service.update`, which an earlier version of this list named:
  `fixtures/storage.ts` calls it through `TrueNasEndpoint.ServiceUpdate`
  already, as it does `service.query` in `querySmbService`. Note the asymmetry —
  `service.query` is typed in the fixture and untyped in the spec, which is
  worth collapsing when this work happens.
- `pool.export` and `service.control` are **jobs** — await them directly and
  delete the polling in `ensurePoolAbsent` and `ensureSmbServiceStopped`
- `service.control` needs `ServiceControlAction` exported before it can be typed
  at all; see the upstream asks under "Not yet"
- Confirm `disk.details` is included. (This bullet used to name
  `disk.get_unused`; nothing in `e2e/` calls that any more — see
  `getSelectableDisks` for why the wizard's inventory is the other endpoint.)

Do it as its own commit, so the diff reads as "remove workaround".

**One live risk until then**: the current client maps only `25.10` and `26`,
while appliances already advertise `v27.0.0`. It negotiates down and works
today, but throws at `createTrueNasClient` — before any test runs — the moment
v26 leaves the advertised range.

### 3. CI

Entirely infrastructure. The suite side is done and verified: it runs from
environment variables alone, emits JUnit XML and an HTML report, and gates
`forbidOnly` on `CI`. `yarn e2e:typecheck` runs in the `lint` job of
`main.yml` — `e2e/` is outside the root tsconfig's project, so before that
nothing type-checked this directory at all.

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
  it when runtime actually hurts. Two journeys are plainly not enough to hurt,
  but the "~32s" this used to cite was wrong — see "Where we are".
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
  set is complete. How much headroom there is cannot be said until a journey is
  actually timed — the "~20s each" this used to assume was the smoke test's
  figure, and `fresh-install` spends minutes in pool creation alone. Whenever the
  budget does come under pressure, the first thing to check is R3.1: tests
  driving the UI for preconditions is what makes a suite slow.
- **More than one story is quarantined.** Quarantine is a pressure valve, not
  storage for known-broken tests.
