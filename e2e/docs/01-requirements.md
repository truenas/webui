# TrueNAS WebUI E2E — Requirements

**Status:** Agreed, 2026-07-30
**Phase:** 1 of 3 (Requirements → Technology decisions → Implementation plan)

This document defines *what* the suite must do and the constraints it operates
under. It deliberately makes no technology choices — no framework, no runner, no
CI system. Those belong in `02-technology.md`.

---

## 0. Context

### 0.1 System under test

TrueNAS WebUI (`github.com/truenas/webui`) — an Angular application, ~3,200
TypeScript files across 19 top-level feature areas, backed by NgRx. It already
carries 1,096 Jest specs at the component level; this suite complements them
rather than overlapping.

The backend is **JSON-RPC 2.0 over WebSocket** to middleware at
`ws://<host>/api/current` — not REST. Any tooling that assumes HTTP request
interception will need adapting.

### 0.2 Component library migration

webui is mid-migration from Angular Material to `@truenas/ui-components`
(local checkout: `../truenas-ui-components`). The migration is far along —
`tn-*` components outnumber residual `mat-*` roughly 20:1 in templates.

This matters for selectors, and the news is good. Both the legacy `[ixTest]`
directive and the library's `testId` inputs emit the **same attribute**, because
webui overrides the library default:

```ts
// webui src/main.ts:67
{ provide: TN_TEST_ATTR, useValue: 'data-test' }
```

Current coverage in webui templates:

| Source | Usages | Templates |
|---|---|---|
| `@truenas/ui-components` `testId` inputs | 1,633 | 468 |
| Legacy `[ixTest]` directive | 279 | 128 |
| — | — | of 828 total |

Both organisations are in-house, so a missing `data-test` is a fixable defect
rather than an obstacle. See R5.

### 0.3 Decisions already taken

| Decision | Choice |
|---|---|
| Backend | Real TrueNAS instance (not mocked) |
| Instance lifecycle | Ephemeral VMs, provisioned per run |
| Build under test | Nightly builds |
| Coverage model | User-story journeys, critical paths first |
| Execution trigger | Nightly / scheduled |
| Repo layout | In-tree, under `e2e/` (reversed from an initial separate-repo decision) |

---

## R1. Functional scope

The suite is organised around **user stories** — journeys a real user takes,
verified end to end — not around exhaustive per-screen assertions.

### R1.1 The v1 story set

| # | Story |
|---|---|
| S1 | Sign in with username/password, land on dashboard, sign out |
| S2 | Create a local user |
| S3 | Create a storage pool from available disks |
| S4 | Create a dataset under that pool |
| S5 | Create an SMB share on that dataset and enable the SMB service |
| S6 | Set dataset permissions/ACL granting the S2 user access |
| S7 | Take a manual snapshot of the dataset |
| S8 | Delete the share, dataset, and pool through the UI |

**S1** is the only story that performs a real login; every other story uses a
pre-authenticated session (R4).

**S8** exists because destruction paths are where users lose data. It is a test
in its own right, not a side effect of teardown (R3.2).

### R1.2 Story independence

S3→S4→S5→S6→S7→S8 form a natural chain, but they are implemented as
**independent tests with API-provisioned preconditions**, not as one linear
journey. Rationale in R3.1.

### R1.3 Explicitly out of scope for v1

Installing apps from the catalog, periodic snapshot tasks, replication,
groups, alert/email configuration, directory services, VMs, containers,
reporting dashboards, and audit. These are later-phase candidates, not
rejections.

---

## R2. Environment and system under test

**R2.1 — Target safety.** The suite must sanity-check that its target is an
approved test host before running. Ephemeral VMs make this low-risk, but a stale
or mistyped target address could point at a real NAS, and the suite creates and
destroys pools.

**R2.2 — Disk inventory.** The VM is provisioned with **8 small virtual disks**
(a few GB each) reserved for the suite. Generous provisioning is deliberate: it
lets pool tests claim their own disks rather than contending for a scarce
resource, so a failed teardown degrades instead of cascading. The suite must
enumerate free disks via the API at startup and fail fast with a clear message
when inventory is short, rather than failing mid-journey with an opaque UI error.

**R2.3 — Known-good state.** Satisfied by construction: each run gets a fresh
VM. No snapshot-revert or reset machinery is required.

**R2.4 — Version recording.** Every run records and reports the TrueNAS version,
middleware version, and webui commit under test. Nightly builds mean middleware
changes continuously; without this, a failure cannot be attributed. Recording
the version is necessary but not sufficient — the JSON-RPC capture in R7.1 is
what actually distinguishes "we broke the form" from "the API contract moved".

**R2.5 — Connectivity hazards excluded.** Anything that can sever the runner's
connection to the appliance — network interface configuration, static IP
changes, management-interface service restarts — is out of scope for v1.
Locking the suite out of the box mid-run produces uninterpretable failures.

**R2.6 — Credentials.** Supplied via environment or CI secrets. No credentials
in the repository, including in fixtures and example configuration.

**R2.7 — Provisioning is the pipeline's job.** The suite receives a reachable
host plus credentials and asserts nothing about how the VM came to exist. This
keeps it runnable by hand against a developer's own VM.

**R2.8 — Boot state contract.** The VM image must boot fully configured: admin
credentials set, no first-boot wizard, no EULA interstitial, network up. Any
interactive first-boot step is handled at provisioning time. Otherwise every
test in the suite silently carries the setup wizard as a dependency.

**R2.9 — TLS.** The shipped UI is served over HTTPS with a self-signed
certificate; a locally-served build is plain HTTP. The browser context must
tolerate the former, without that leniency masking genuine certificate problems.

**R2.10 — Source-tree coupling is deliberate, confined, and opt-in. (Revised
twice.)** Originally the inverse: the suite must never assume a local webui
checkout. That followed from the separate-repo layout and no longer applies
in-tree, where reading webui's own configuration is useful — `TN_HOST=auto`
resolves the appliance from whatever `yarn ui remote` wrote into
`src/environments/environment.ts`.

**Opt-in, not a default.** This was the fallback for any unset `TN_HOST`, and
the setup instructions told you to leave it unset. Since the suite exports pools
with `destroy: true` and deletes users, that made the documented happy path a
destructive run against a machine nobody had named — the developer's own dev
appliance, in the common case. `TN_HOST` is now required, and every run opens
with a banner stating the appliance, where the address came from, and whether
TLS verification is on.

What survives is the *discipline*: the coupling lives in exactly one module
(`support/webui-environment.ts`) so it stays visible, and nothing requires a
working tree that has ever run that command. Verified by running the whole suite
with `.env` and `environment.ts` both removed, `TN_*` supplied directly.

### R2.11 Target profiles

The browser must be able to load the UI from either of two places. The two modes
differ in **exactly one thing** — the UI base URL — and share selectors, API
client, and authentication.

| Profile | UI served from | Middleware | Used by |
|---|---|---|---|
| `shipped` | `https://<vm>/ui/` | `<vm>` | Nightly |
| `branch` | `http://localhost:4200/` | `<vm>` | PR CI, local dev |

`branch` mode reuses webui's existing mechanism: `yarn ui remote -i <ip>`
rewrites `proxy.config.json` to forward `/api`, `/_upload` and `/_download` to
the remote host, and points `src/environments/environment.ts` at it.

**The two paths differ, and the shared invariant is the trailing slash.** An
earlier revision of this document claimed both profiles serve under `/ui/`. That
is wrong: `/ui/` is a property of the *appliance's* nginx configuration, not of
webui builds. Only `build:prod` passes `--base-href /ui/`; `angular.json` sets no
`baseHref`, so `yarn build` and `ng serve` both serve at `/`.

What must hold for both is that the base URL **ends with `/`**, because
`new URL(path, base)` replaces the base's last segment otherwise —
`new URL('signin', 'http://h/ui')` resolves to `http://h/signin`, silently
dropping `/ui`. The suite validates the trailing slash for both profiles and the
`/ui/` path for `shipped` only. See R5.5.

**`branch` mode works today against `ng serve`.** Phase 0 validated it: with
webui's dev server pointed at the VM (`yarn ui remote -i <vm>`, then
`yarn start`), the suite authenticates and drives the UI at
`http://localhost:4200/`. Two constraints apply, neither obvious:

- **The dev server and `TN_HOST` must name the same appliance.** The token is
  minted against `TN_HOST` and redeemed by a UI that authenticates against
  `environment.remote`. Point them at different machines and the token is
  rejected with nothing indicating why. Nothing currently checks this — see D5.
- **`ng serve` serves at `/`, not `/ui/`.** Handled by the profile-dependent
  path validation described above.

**A production build still needs more than a static server.** In a *production*
build, webui addresses `environment.remote` directly and
bypasses any proxy, in both the WebSocket
(`websocket-handler.service.ts:114`) and HTTP
(`global-api-http.service.ts:18`, gated on `environment.production`). So serving
`dist/` statically is not sufficient on its own. Two coherent designs:

- **Direct-to-VM** — build with `remote = <vm>`, serve `dist/` with any static
  server. Cross-origin, so it depends on middleware CORS, and a page served over
  HTTP makes the app derive plaintext `ws://` / `http://` to the appliance.
- **Proxying static server** — build with `remote = localhost:4200`, serve
  `dist/` at `/ui/` with `/api`, `/_upload` and `/_download` proxied to the VM.
  Same-origin, no CORS dependency, closest to production (nginx at `/ui/` with
  the API on the same origin). Costs a small proxy server.

The proxying design is preferred when this is built. It is deferred rather than
blocking: `ng serve` covers local development and PR CI today, and the nightly
deliverable uses `shipped`. Serving a production build matters only if the dev
bundle's differences from the shipped artifact turn out to matter — revisit it
then, or when PR gating (**D1**) makes the distinction worth paying for.

This flexibility is inexpensive if designed in from the first commit and
expensive to retrofit, because by then paths and URLs are hardcoded throughout.
See R4.4 for the remaining constraint it imposes.

---

## R3. State, isolation, and ordering

**R3.1 — Preconditions via API, assertions via UI.** This is the highest-leverage
structural decision in the suite. S5 (SMB share) does not create its pool and
dataset by driving the S3 and S4 wizards — it provisions them over the
middleware API in a fixture, and clicks only the share creation it is actually
testing.

Three consequences, all desirable:

- Runtime drops substantially — API provisioning is seconds, wizards are minutes.
- Failures stop cascading. A broken pool wizard fails one test, not six.
- Each failure is attributable to exactly one feature.

**R3.2 — Unconditional teardown.** Teardown runs via the API in an `afterEach`,
including after failure and after timeout. With ephemeral VMs this is no longer
about cross-run hygiene — it is about **intra-run resource release** during a
serial suite. A pool left holding disks starves later tests.

**R3.3 — Run-scoped naming.** All created objects carry a unique run-scoped name
(`e2e-<runid>-…`) so leaked artifacts are identifiable and concurrent runs
cannot collide.

**R3.4 — Serial execution in v1.** Pools, services, and system settings are
global to the appliance; parallel workers against one instance will interfere.
Parallelism is a later-phase concern, achieved by sharding across *instances*,
not across workers on one instance.

**R3.5 — Isolated runnability.** Every test must pass when run alone
(`--grep`-style) against an already-dirty box. No hidden inter-test dependencies.

---

## R4. Authentication

**R4.1 — Token-based session reuse.** Non-login tests bypass the ~15 second
login flow using a `reconnect_token`, captured once per run and reused as an
authenticated browser session.

**R4.2 — One real login.** S1 drives the actual sign-in form, so the bypass can
never hide a broken login page.

**R4.3 — Token TTL.** Tokens expire after 2 hours. A run exceeding that must
refresh rather than fail obscurely.

**R4.4 — Own the token helper.** webui's `scripts/playwright-helpers/generate-token.ts`
has the right logic (WebSocket → `auth.login_ex` with `login_options.reconnect_token`
→ token) but hardcodes `http://localhost:${port}` as the base URL, which is
incompatible with `shipped` mode (R2.11). webui-e2e implements its own version
taking the UI base URL as a parameter — roughly 40 lines. Do not shell out to
`yarn auth-url`; it also implies a webui checkout, violating R2.10.

---

## R5. Selectors

**R5.1 — `[data-test="…"]` only.** No CSS class selectors, no text matching, no
XPath, no structural or nth-child selectors. This is enforceable because both
selector sources emit the same attribute (§0.2).

**R5.2 — Missing test IDs are upstream defects.** A missing `data-test` is fixed
at its source, never worked around with a fragile selector. Both fix paths are
in-house:

- Consumer side: pass `testId` on the `tn-*` component in the webui template.
- Library side: add a `testId` input following the Patterns A/B/C documented in
  `truenas-ui-components/docs/test_ids.md`.

**R5.3 — Selectors live in a locator layer.** Never inline in test bodies. A
renamed test ID must be a one-line fix.

**R5.4 — Two naming conventions coexist.** `[ixTest]` auto-prefixes the element
type (`button-reset-settings`, `row-…`, `input-…`); library `testId` values are
verbatim and unprefixed by design. The locator layer must not assume a single
naming scheme.

**R5.5 — Navigation is relative to the configured base URL. No absolute paths,
ever.** A previous revision downgraded this to hygiene on the grounds that both
profiles served under `/ui/`. That premise was wrong (see R2.11), so the
requirement is load-bearing again and restored to its original strength.

The paths genuinely diverge — `/ui/` on the appliance, `/` for a local build —
so an absolute path silently breaks one profile while passing in the other. That
is the worst failure shape available: it looks fine in whichever mode the author
was using. This is the constraint most likely to be violated by accident and the
most tedious to retrofit.

---

## R6. Cross-repo coupling — resolved

**Resolved by moving the suite in-tree.** This section recorded the cost of the
separate-repo layout; that layout is gone. Retained because R6.2 still stands on
its own, and because the reasoning explains why in-tree was worth the move.

**R6.1 — Drift is caught late. (No longer applies.)** A webui PR renaming a test
ID now breaks its own E2E test in the same PR, rather than surfacing in a
nightly run days later. This was the main cost of the separate repo and the main
reason for moving.

**R6.2 — Failures must be triageable without a local repro.** A report must make
"application bug" versus "test ID drift" obvious from the artifacts alone.

**R6.3 — Independent drift detection. (Largely moot.)** Extracting a test-ID
inventory to diff between runs was a workaround for R6.1's latency. With the
suite in-tree the PR itself is the signal, so this is no longer worth building.

---

## R7. Reporting and observability

Nightly execution means nobody is watching when it breaks. The artifacts of a
failed run *are* the product.

**R7.1 — Client-side capture on failure.** Execution trace, video, screenshot,
browser console log, and **the JSON-RPC/WebSocket traffic**. The last matters
disproportionately in this application: a large share of apparent UI failures
are actually middleware responses, and without the traffic the distinction costs
an engineer an afternoon.

**R7.2 — Server-side capture on failure.** `middlewared.log` covering the
failure window, and optionally a debug bundle. Because VMs are ephemeral, this
must be collected **before** the VM is destroyed — otherwise the evidence is
gone by the time anyone looks.

**R7.3 — Active notification.** Results published to a durable location with a
retention policy, plus a push notification to a channel the team actually reads.
Not a report someone has to remember to open.

**R7.4 — Run history.** Retained so per-test flake rate is measurable over time,
which is what makes R8.4 enforceable rather than aspirational.

---

## R8. Reliability budget

**R8.1 — Runtime target ≤45 minutes** for the v1 suite. Nightly is forgiving,
but a three-hour suite stops getting fixed.

**R8.2 — At most one retry per test.** Retries absorb genuine environmental
noise; they are not a mechanism for hiding a flaky test.

**R8.3 — No fixed sleeps.** All waiting is on observable conditions. TrueNAS
operations are job-based and genuinely slow — pool creation can take minutes —
so waits key off job state or UI state with explicit, generous timeouts.

**R8.4 — Quarantine policy.** A test failing intermittently twice in a rolling
week is quarantined: it still runs, is reported separately, and does not fail
the suite. Quarantine requires a tracking ticket and is time-boxed. It is not a
graveyard.

---

## R9. Maintenance

**R9.1 — Definition of done for a story:** journey implemented; setup and
teardown via API; failure produces a triageable artifact set per R7; runs green
three consecutive nights.

**R9.2 — One-command local run.** The repository documents how to run against a
developer's own VM in a single command. A suite that is hard to run locally does
not get fixed when it breaks.

---

## R10. Non-goals for v1

Cross-browser execution (Chromium only), visual regression, performance and load
testing, accessibility auditing, mobile viewports, upgrade and migration paths,
HA failover and clustering, and the feature areas listed in R1.3.

---

## Deferred decisions

Recorded so they are made deliberately later rather than by accident now.

**D1 — PR gating.** Running the suite as a gate on webui PRs is attractive but
carries two unsolved problems:

- A PR-branch UI runs against *some* middleware. If that is a nightly, the check
  can fail because middleware moved overnight — nothing to do with the PR. A
  gate that flaps for unrelated reasons is ignored within a month. The fix is to
  pin PR CI to a known-good middleware build and bump it deliberately, which is
  ongoing maintenance somebody must own.
- ~~A webui PR must check out webui-e2e at *some* version.~~ Resolved by the
  in-tree move: the suite is versioned with the code it tests.
- Infrastructure, not suite work: CI runners must reach the appliance network,
  and concurrent runs each need their own VM — the suite assumes it owns the
  appliance.

v1 builds the seam (R2.11) so gating is possible later, but does not wire it up.

**D5 — Detect a `branch`/`TN_HOST` appliance mismatch.** In `branch` mode the
token is minted against `TN_HOST` but redeemed by a UI configured with its own
`environment.remote`. When those disagree the failure is an opaque auth
rejection. The browser reveals the answer — it opens a WebSocket to whatever
`environment.remote` says — so the capture fixture built for R7.1 could compare
that host against `TN_HOST` and fail with a precise message. Cheap once that
fixture exists in Phase 3; not worth a bespoke mechanism before then.

**D2 — Parallel execution** by sharding across VM instances (R3.4).

**D3 — Independent test-ID drift detection** (R6.3).

**D4 — Result storage and notification target** (R7.3) — depends on existing CI
infrastructure, to be settled in the implementation plan.
