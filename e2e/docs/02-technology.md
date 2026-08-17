# TrueNAS WebUI E2E — Technology Decisions

**Status:** Agreed, 2026-07-30
**Phase:** 2 of 3 (Requirements → **Technology decisions** → Implementation plan)
**Prerequisite:** [`01-requirements.md`](./01-requirements.md)

Each decision cites the requirements it serves. Rejected alternatives are
recorded where the choice was not obvious.

---

## T1. Browser automation — Playwright Test

`@playwright/test` as both automation library and test runner.

**Why.** Three requirements are effectively free with it and expensive without:

- **R7.1** (trace, video, screenshot on failure) is built in — the trace viewer
  gives a DOM-and-network timeline of the failure with no bespoke work.
- **R7.1** also demands WebSocket capture. Playwright exposes
  `page.on('websocket')` with `framesent`/`framereceived`, which is the only
  practical way to record this application's JSON-RPC traffic from the browser
  side. This is the decisive capability.
- **R8.3** (no fixed sleeps) is the default behaviour, not a discipline —
  web-first assertions auto-retry until timeout.

Fixtures with guaranteed teardown also map directly onto **R3.2**, which is
otherwise the easiest requirement to violate.

**Also relevant:** the team already has a toehold — `.mcp.json` configures
`@playwright/mcp`, and webui carries `scripts/playwright-helpers/`.

**Rejected.** Cypress — its architecture makes WebSocket frame capture and
multi-origin work awkward, and R7.1 is not negotiable. WebdriverIO — viable, but
no advantage here and a weaker trace story.

---

## T2. Toolchain

| | Choice | Note |
|---|---|---|
| Language | TypeScript | Matches webui, `@truenas/api-client`, and the component library |
| Runtime | Node 24 | webui requires `>=24.13.1`; `@truenas/api-client` requires ≥22 |
| Package manager | Yarn 4 | Already declared in this repo's `package.json` |

---

## T3. Middleware client — `@truenas/api-client`

Used for all API-side work: preconditions (**R3.1**), teardown (**R3.2**),
verification, and server-side artifact collection (**R7.2**).

**Why.** It is a framework-agnostic TypeScript client for exactly this API,
maintained in-house, and it solves several of our problems directly rather than
incidentally:

- **Generated from the real schema.** `scripts/generate-api-interface` builds
  from a `middlewared --dump-api` dump, so method names and payloads are typed.
  Against a moving nightly target (**R2.4**), an API change becomes a compile
  error instead of a runtime mystery.
- **First-class job support** — `JobState`, `Job`, `core.job_wait`,
  `core.get_jobs`. Every slow TrueNAS operation is a job, so this is load-bearing
  for **R8.3**, not a convenience.
- **Runtime version discovery** — `VersionDiscovery` plus per-version clients
  (`TrueNasApiClientV2510`, `TrueNasApiClientV26`). Directly serves **R2.4**.
- **Semver contract.** `src/index.ts` states the curated exports are the
  package's contract under semver; connection internals are deliberately not
  re-exported.

**On stability.** The local checkout's README says "early extraction in
progress" and its `package.json` reads `0.0.0`. Both are stale: the published
package is **`@truenas/api-client@1.0.3`**. Consume from npm, not the local
checkout.

**Cost accepted.** `rxjs ^7.8` is a peer dependency — natural inside an Angular
app, weight this suite would not otherwise carry. Worth it for typed calls and
job handling.

### T3.1 Findings from Phase 0

Three things discovered while building against it. None invalidates the choice;
two add work to later phases.

**The typed `call()` surface is a curated subset, not the generated API.**
`TrueNasApi.call()` is generic over `ApiCallDirectory` in
`src/types/api-call-directory.type.ts` — a hand-maintained directory of **65
endpoints** keyed by the `TrueNasEndpoint` enum, inherited from TrueNAS Connect.
The full generated per-version directories exist and are exported, but are not
wired into `call()`.

**Resolved upstream — pending release.** A forthcoming version of the client
exposes the entire API surface fully typed, including jobs and events, and adds
a v27 client. Verified as *not* shipped in 1.0.7: `ApiCallMethod` there still
derives from the curated `TrueNasEndpoint`-keyed directory, and
`CLIENT_BY_VERSION_KEY` still maps only `25.10` and `26`. The options below are
therefore recorded for context, not as a decision to make — the workaround
stands until the release lands.

When it does, three things follow:

- `e2e/support/api/untyped.ts` and its five call sites are deleted. `tsc` then
  checks every payload against the real signatures, which is the value the
  escape hatch has been deferring.
- `pool.export` and `service.control` are **jobs**, not calls. Typed job support
  lets them be awaited directly, removing the hand-rolled polling loops in
  `ensurePoolAbsent` and `ensureSmbServiceStopped`.
- Typed events give R7.1 a server-side job timeline to attach to a failed run —
  which answers "did the job fail, or did the UI not react?" without reading raw
  frames. Use events for synchronisation and diagnostics only: asserting on
  middleware state instead of the UI would erode R3.1.

`disk.get_unused` is worth confirming separately — it works against a live
appliance but appears nowhere in the generated manifest, so it may be absent
from the `--dump-api` dump rather than merely uncurated.

For Phase 0 this is fine: `auth.generate_token` is present. **Phase 2 hits the
wall immediately** — `pool.create`, `pool.export`, `user.create`, `user.delete`,
`sharing.smb.*` and `system.debug` are all absent, and those are exactly the
fixtures R3.1 and R3.2 need. Two options, to decide at the start of Phase 2:

1. Extend the curated enum and directory upstream. Small, mechanical, and we own
   the repository — but it grows a list that is already duplicating generated
   data.
2. Make `call()` generic over the generated `ApiCallDirectory` instead. Larger
   and it touches the client's public contract, but it is the correct fix and
   removes the duplication permanently.

Casting around the types locally is the option to avoid — the typing is most of
why this client was chosen.

**Endpoints must be addressed via the enum, not string literals.**
`ApiCallDirectory` is keyed by `TrueNasEndpoint` members, and TypeScript treats
string enum members nominally, so `'auth.generate_token'` is not assignable to
`TrueNasEndpoint.GenerateToken`. Caught by `tsc`, not at runtime.

**`MAX_SUPPORTED_VERSION` is `v26.0.0`.** `CLIENT_BY_VERSION_KEY` maps only
`25.10` and `26`, though v27 types are generated. A v27 nightly would fail at
`createTrueNasClient`. A one-line fix in a repo we own, but a hard blocker until
made — worth checking which version nightlies currently build before Phase 1.

---

## T4. Suite architecture — four layers

The structure exists to enforce one rule: **a test must never use the API to
perform the action it is testing.** Blur that and the suite quietly stops
testing the UI.

```
tests/       one file per user story; reads as prose
flows/       UI-driving actions   — createPool(), createSmbShare()
locators/    data-test constants and Locator factories, per screen
fixtures/    API-driving setup and cleanup — ensurePoolAbsent(), requireUnusedDisks()
support/     config, auth, API client, the shared `test` object
```

**Naming carries the rule.** UI actions read as imperatives (`createRaidz2Pool`);
API-side helpers say what they guarantee — `ensure*` for idempotent cleanup that
must be safe to run twice, `require*` for a precondition that fails loudly when
the appliance cannot support the test. A test that says `ensurePoolAbsent()` then
`createRaidz2Pool()` is unambiguous about which half is under test.

*(An earlier revision specified `given*` — `givenPool()`, `givenDataset()`. No
such function was ever written. `ensure*`/`require*` is what exists and it
distinguishes two things `given*` collapses, so this record follows the code.)*

**`locators/` is the only place selector strings appear** (**R5.3**), with two
documented exceptions in `support/constants.ts`: `adminLayout` and
`errorDialogRole`, both harness plumbing rather than test assertions. It must
accommodate both naming conventions (**R5.4**) — `[ixTest]` and the library's
`tnTestIdType` each prefix the element type, and their kebab-casers disagree.

**`fixtures/` is plain async helpers called from explicit `beforeEach`/
`afterEach`, not Playwright fixtures.** An earlier revision specified Playwright
fixtures on the grounds that "an explicit `afterEach` is easier to bypass" —
but `test.afterEach` does run after failure and after timeout, so it satisfies
**R3.2** as written and the premise for preferring fixtures was weaker than
stated. Cleanup that must also run *before* a test (**R3.5**, re-runnable against
a dirty appliance) reads more directly as a call in both hooks than as fixture
setup. The only true Playwright fixtures are `config` and `api` in
`support/fixtures.ts`, which are worker-scoped because a connection costs a
sign-in.

---

## T5. Authentication — setup project plus `storageState`

A Playwright *setup project*, which every other project depends on, performs
authentication once per run and persists browser state for reuse (**R4.1**).

Mechanism: log in with username and password, call `auth.generate_token` for a
token with an explicit TTL, navigate to `<uiBaseUrl>signin?token=…`, wait for
`ix-admin-layout` to appear, then save `storageState`.

**Revised during Phase 0 — `auth.generate_token`, not `reconnect_token`.**
webui's helper requests a `reconnect_token` via `login_options`, but that field
only exists from **v26.0.0** onward (`AuthCommonOptions` changed in v26; v25.10
does not have it). `auth.generate_token` was introduced in v25.10.0 and has
never changed, so it works across every version the client supports — and it
takes an explicit TTL rather than inheriting whatever the server defaults to,
which makes R4.3 a value we choose.

Targeting `/signin` directly rather than a deep link is also deliberate: webui
reads the token in `signin.store.ts` via `queryParamMap.get('token')`, so it must
be on the signin route's URL. Deep links do work — a guard redirects and
preserves the query parameter — but relying on that preservation adds a moving
part to the one flow every other test depends on.

**We own the token helper** (**R4.4**). webui's `generate-token.ts` has the right
logic but hardcodes `http://localhost:${port}`, incompatible with `shipped` mode,
and shelling out to `yarn auth-url` would imply a webui checkout, violating
**R2.10**. Roughly 40 lines to reimplement against `@truenas/api-client`.

**S1 is excluded from the setup dependency** and drives the real sign-in form
(**R4.2**).

Token TTL is 2 hours (**R4.3**); with a ≤45 minute budget (**R8.1**) a single
acquisition suffices, but the helper should refresh rather than fail if a run
overruns.

---

## T6. Waiting strategy

- **UI waits** — Playwright web-first assertions only. No `waitForTimeout`.
- **API waits** — poll the observable outcome. Never `waitForTimeout`; never a
  guessed sleep. In a spec that means `expect.poll`; in a fixture it means
  `support/wait.ts`'s `waitUntil`, which keeps the domain-specific failure
  message that an assertion helper would bury.

  *(An earlier revision said "`core.job_wait` / `JobState`, never polling loops".
  That is the destination, not the current state: the curated call directory does
  not expose the job surface, so `pool.export` and `service.control` return
  before their work is done and asking again is the only honest test of
  completion. Switch to awaiting jobs directly when the typed surface lands —
  tracked under "Temporary scaffolding" in `e2e/CLAUDE.md`.)*
- **Timeouts are per-operation and explicit.** Pool creation legitimately takes
  minutes; a global timeout tuned for it would let genuinely hung tests run long.

Serves **R8.3**.

---

## T7. Observability

### Client side (**R7.1**)

Playwright's built-in trace, video, and screenshot, all `on-first-retry`.

WebSocket capture is a **custom fixture** subscribing to `page.on('websocket')`
and recording `framesent`/`framereceived`, attached to the test report. This is
the highest-value artifact in the suite: most apparent UI failures in this
application are middleware responses, and without the frames that distinction
costs an engineer an afternoon (**R6.2**).

### Server side (**R7.2**)

Collected over the API — no SSH, no extra credentials:

- `core.job_download_logs` — logs for the specific job that failed
- `system.debug` (job) plus `core.download` — full debug bundle when warranted

**Timing is critical.** VMs are ephemeral, so collection must complete *before*
teardown destroys the box. Debug bundles are large; default to job logs and
gather a full bundle only on failure.

---

## T8. CI — Jenkins

- **Execution environment:** the official Playwright container image, so browser
  and system dependencies are pinned rather than inherited from the agent.
- **Provisioning:** Jenkins already has pipelines that stand up ephemeral
  TrueNAS VMs, and this suite's pipeline runs in the same Jenkins environment.
  Our pipeline consumes one of those VMs and receives a host plus credentials
  (**R2.7**); it does not reimplement provisioning.
- **Network reach:** because the provisioning pipelines already run in this
  environment, agent-to-VM reachability is expected rather than in question.
  Still worth confirming in passing during Phase 1 — the suite needs both
  HTTP(S) and the WebSocket endpoint, and the existing pipelines may only
  exercise one.
- **Results:** JUnit XML reporter into the Jenkins JUnit plugin, giving per-test
  history and flake-rate trends — which is what makes the quarantine policy
  (**R8.4**) enforceable rather than aspirational (**R7.4**).
- **Artifacts:** Playwright HTML report, traces, and captured frames archived on
  the build, with a retention policy (**R7.3**, open item O2).
- **Notification:** Jenkins → team channel on failure (**R7.3**, open item O3).

VM provisioning stays outside the suite (**R2.7**): the pipeline creates the VM
and passes a host and credentials in.

---

## T9. Lint and formatting — webui's config, with an e2e override

**Revised during Phase 0.** The original decision was to reuse
`@truenas/common-typescript`, as webui does. On inspection it does not fit: the
config is Angular-coupled throughout — `angular-eslint`,
`processInlineTemplates`, `angular-file-naming` (which expects
`*.component.ts`-style names), HTML template linting, and `jest` as a peer
dependency. `eslint/eslint-ts-rules-extra.mjs` alone carries 25 Angular
references. Applying it to a Playwright suite would mean fighting rules written
for a different kind of repository.

**Revised again on moving in-tree.** The above was written for a standalone
repository, where a lean local config was the right answer. In-tree the suite is
simply linted by webui's own `eslint.config.mjs`, which is the correct default —
one style for one repository.

What it needs is a narrow override block for `e2e/**`, switching off rules that
assume Angular (`angular-file-naming` expects `*.component.ts`-style names),
Jest-oriented rules that misread Playwright's thenable `expect`, and
`import/no-default-export` for `playwright.config.ts`, which Playwright
requires. Everything else — including `strictCamelCase` naming and import
ordering — applies, and the suite conforms to it.

---

## T10. Configuration — target profiles

**R2.11** requires the browser to load the UI from either of two places. This is
one seam, and it is the single most important thing to get right on day one,
because retrofitting it means unpicking hardcoded URLs everywhere.

| Profile | UI base URL | Middleware | Used by |
|---|---|---|---|
| `shipped` | `https://<vm>/ui/` | `<vm>` | Nightly |
| `branch` | `http://localhost:4200/` | `<vm>` | PR CI, local dev |

Everything resolves from two values — `uiBaseUrl` and `middlewareHost` — supplied
by environment variables, with no defaults that assume either mode.

**The paths diverge, and that makes R5.5 load-bearing.** An earlier revision
claimed both profiles served under `/ui/` and downgraded R5.5 accordingly. That
was wrong: `/ui/` belongs to the appliance's nginx configuration, not to webui
builds. Only `build:prod` passes `--base-href /ui/`, and `angular.json` sets no
`baseHref`, so `yarn build` and `ng serve` both serve at `/`.

What the suite validates instead:

- **Trailing slash, both profiles.** `new URL(path, base)` replaces the base's
  last segment without one, so `new URL('signin', 'http://h/ui')` yields
  `http://h/signin` — silently dropping `/ui`. This is the invariant that
  actually matters, and it fails quietly, so it is checked at startup.
- **`/ui/` path, `shipped` only.** Catches a mistyped `TN_UI_BASE_URL` override
  without constraining where a local build is served.

One constraint remains: **`ignoreHTTPSErrors` for `shipped` only** (**R2.9**),
scoped to that profile so the leniency cannot mask a genuine certificate problem
in the other.

**TLS is also a Node-side concern, not just a browser one.** Discovered in
Phase 0: `truenas-connection.ts` builds `wss://${hostname}${path}` — the client
speaks secure WebSocket exclusively — and test appliances present self-signed
certificates, which Node rejects by default. The runner therefore needs
`NODE_TLS_REJECT_UNAUTHORIZED=0` — for **both** profiles, not just `shipped`.
Scoping it to the profile was tried and was a bug: `branch` changes where the
*browser* loads the UI from, while the API client still connects to the same
appliance over `wss://`, and the symptom was a 30 second socket timeout rather
than a certificate error. `playwright.config.ts` sets it unconditionally and
explains this at the point of use.

It is a blunt instrument, accepted only because the targets are disposable
internal test VMs. The honest account of the concession — why it cannot currently
be scoped to the one connection that needs it, and the specific upstream change
that would let it be — is in `03-plan-and-status.md` under "Not yet". Every run
also states it in the startup banner. It is *not* documented in the README or
`.env.example`; an earlier revision claimed it was.

---

## Dependencies

| Package | Source | Purpose |
|---|---|---|
| `@playwright/test` | npm | Automation and runner (T1) |
| `@truenas/api-client` | npm `^1.0.3` | Middleware client (T3) |
| `rxjs` | npm `^7.8` | Peer dependency of the above |
| `@truenas/common-typescript` | `github:truenas/tn-common-typescript#master` | Lint config (T9) |
| `typescript` | npm | — |

Deliberately no assertion library beyond Playwright's `expect`, no BDD layer, and
no page-object framework. The four-layer structure in T4 is convention, not
dependency.

---

## Open items

Carried into the implementation plan.

- **O1 — VM provisioning interface.** *Mostly resolved:* Jenkins has existing
  pipelines for ephemeral TrueNAS VMs and this suite runs in the same
  environment. What remains is the mechanical contract — upstream job with
  parameter passing, shared library, or something else — and how the host
  address and credentials reach the suite. A "read the existing pipeline" task
  rather than an unknown.
- **O2 — Artifact retention.** How long traces and reports are kept on Jenkins.
- **O3 — Notification target.** Which channel receives failures (**R7.3**).
- **O4 — Agent network reach.** *Largely retired* by O1 — the provisioning
  pipelines already run here. Confirm in passing that both HTTP(S) and the
  WebSocket endpoint are reachable, since existing pipelines may only use one.
