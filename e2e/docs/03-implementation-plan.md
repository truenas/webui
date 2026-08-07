# TrueNAS WebUI E2E — Implementation Plan

**Status:** Proposed, 2026-07-30
**Phase:** 3 of 3 (Requirements → Technology decisions → **Implementation plan**)
**Prerequisites:** [`01-requirements.md`](./01-requirements.md), [`02-technology.md`](./02-technology.md)

---

## Sequencing rationale

Two deliberate departures from the conventional order.

**Infrastructure risk comes first.** The things most likely to derail this work
are not the tests — they are the seams between this suite and the environment it
runs in: the provisioning handshake (O1) and agent-to-VM reachability (O4). Both
are now largely de-risked, since Jenkins already runs ephemeral TrueNAS VM
pipelines and this suite will live in the same environment. What remains is
mechanical: reading the existing pipeline and wiring to it. Still worth doing
first — it is cheap in week one and expensive in week six, after eight stories
have been written against a wrong assumption about how a VM arrives.

**Observability precedes the bulk of the tests.** Traces and WebSocket capture
are how you debug the stories while writing them. Building reporting afterwards
means writing eight tests blind, then retrofitting the tooling that would have
made them quick.

The consequence is that Phases 0–3 produce almost no feature coverage. That is
intentional and worth stating up front, because it looks like slow progress and
is not.

---

## Phase 0 — Walking skeleton

**Goal.** One trivial test, running green locally in *both* target profiles.
No feature coverage whatsoever.

**Work**

- Repo scaffolding: dependencies per T2/T3, `tsconfig`, ESLint (T9, revised to a
  lean local config), `playwright.config.ts`
- **Target profile configuration (T10) — built first, before anything else.**
  `uiBaseUrl` and `middlewareHost` from environment, no defaults assuming either
  mode, `ignoreHTTPSErrors` scoped to `shipped`. Validate the trailing slash for
  both profiles and the `/ui/` path for `shipped` only — the paths diverge (R5.5)
- Token helper (R4.4): `auth.generate_token`, base URL as a parameter
- Playwright setup project: authenticate once, persist `storageState` (T5)
- One smoke test: load the dashboard authenticated, assert `ix-admin-layout`
  is present

**Exit criteria.** `yarn e2e` green against a hand-provisioned VM from a
developer machine.

**Status: complete, both profiles.** Setup plus smoke pass against a real
appliance in ~4s, validating version discovery, `wss://` with a self-signed
certificate from Node, `auth.generate_token`, the `/signin?token=` flow,
`ix-admin-layout` as the readiness signal, and `storageState` reuse. Token login
costs ~2.3s against roughly 15s for a form login — R4.1 paying for itself
immediately.

`branch` runs against webui's `ng serve` pointed at the same VM. Serving a
*production* build still needs a proxying server and stays deferred (R2.11), but
that is a refinement rather than a blocker.

**Two bugs the profiles caught in each other**, both from wrong assumptions in
the original design rather than from the code:

- `/ui/` was applied to both profiles. It belongs to the appliance's nginx
  configuration only; `ng serve` and `yarn build` serve at `/`. The invariant
  common to both is the trailing slash (R5.5).
- Node-side TLS leniency was scoped to `ignoreHttpsErrors`, conflating two
  different connections. The browser's TLS situation is profile-dependent; the
  API client's is not, because it always reaches the appliance over `wss://`.
  In `branch` this surfaced as a 30 second WebSocket timeout.

Both are the shape R5.5 warns about: a mistake that passes in whichever profile
the author happened to be using. Running both was what exposed them.

**Size:** S · **Risk:** low, but high information value

---

## Phase 1 — CI skeleton

**Goal.** The Phase 0 smoke test running nightly in Jenkins against an
ephemeral VM. Still no feature coverage.

**Work**

- Jenkins pipeline running the official Playwright container image (T8)
- Wire to the existing ephemeral TrueNAS VM pipelines: consume a provisioned
  VM, receive host and credentials as environment (R2.7) — **resolves O1**
- Confirm reach on both HTTP(S) and WebSocket — **resolves O4**
- Basic artifact archiving and a failure notification — **resolves O2, O3**

**Exit criteria.** A scheduled Jenkins job obtains a VM, runs the smoke test,
archives artifacts, releases the VM, and notifies on failure.

**Fallback if needed.** If the handshake with the provisioning pipelines takes
longer than expected, run this phase against a long-lived VM and treat ephemeral
provisioning as a follow-up. The suite cannot tell the difference (R2.7) — which
is exactly why that requirement exists.

**Size:** S–M · **Risk:** low — the provisioning pipelines and the network path
already exist; this is integration, not construction

---

## Phase 2 — Fixtures and flows foundation

**Goal.** Prove R3.1 — API-provisioned preconditions with guaranteed teardown —
before any story depends on it.

**Work**

- **Decide how to widen the API client's typed surface — do this first.**
  Phase 0 found that `TrueNasApi.call()` is generic over a curated 65-endpoint
  directory, not the generated API, and that `pool.create`, `pool.export`,
  `user.create`, `user.delete`, `sharing.smb.*` and `system.debug` are all
  absent. Every fixture below depends on the answer. See T3.1 for the two
  options; casting around the types is not one of them.
- `@truenas/api-client` wiring: authenticated client fixture, job waiting via
  `core.job_wait` / `JobState`
- `given*` fixtures with unconditional teardown (R3.2): `givenPool`,
  `givenDataset`, `givenUser`
- Pre-flight checks that fail fast with a clear message:
  - disk inventory (R2.2) — refuse to start if fewer than expected free disks
  - target safety (R2.1)
- Run-scoped naming: `e2e-<runid>-…` (R3.3)
- `locators/` conventions, accommodating both `[ixTest]` prefixed and library
  verbatim `testId` values (R5.4)

**Exit criteria.** A test that provisions a pool and dataset over the API,
asserts nothing, and leaves the system clean — including when deliberately
failed mid-test and when timed out.

**Test the teardown by breaking it.** Kill a test mid-fixture and confirm the
pool is still released. R3.2 is the requirement most likely to be quietly
broken, and the failure mode is a suite that poisons itself overnight.

**Size:** M · **Risk:** low

---

## Phase 3 — Observability

**Goal.** A failing test produces everything needed to triage it without a local
reproduction (R6.2).

**Work**

- WebSocket capture fixture: `page.on('websocket')` → `framesent` /
  `framereceived`, attached to the report (R7.1)
- Failure hook collecting `core.job_download_logs`, and `system.debug` +
  `core.download` when warranted — **before** VM teardown (R7.2)
- Version recording: TrueNAS, middleware, webui commit, surfaced in the report
  (R2.4)
- Reporters: Playwright HTML plus JUnit XML into the Jenkins JUnit plugin (R7.4)

**Exit criteria.** An intentionally failing test yields trace, video, screenshot,
console log, WebSocket frames, relevant job logs, and version metadata — and
someone who did not write the test can say from the artifacts alone whether it
is an application bug or test-ID drift.

**Validate that last claim with an actual person.** It is the whole purpose of
the phase and it is easy to convince yourself of alone.

**Size:** M · **Risk:** low

---

## Phase 4 — The story set

**Goal.** S1–S8 implemented, each meeting the definition of done in R9.1.

Ordered so the highest-risk story lands early enough for its surprises to be
absorbed:

| Order | Story | Notes |
|---|---|---|
| 1 | **S1** Sign in / sign out | No dependencies; validates the real login form (R4.2) |
| 2 | **S2** Create a local user | Simple form — establishes the form-interaction pattern |
| 3 | **S3** Create a storage pool | **Hardest.** Wizard, disk selection, long-running job |
| 4 | **S4** Create a dataset | |
| 5 | **S5** SMB share + enable service | Global service state |
| 6 | **S6** Dataset permissions / ACL | Most complex UI in the set |
| 7 | **S7** Manual snapshot | |
| 8 | **S8** Delete share, dataset, pool via UI | Destruction paths in their own right |

**Budget explicitly for upstream test-ID work.** Roughly 60% of webui templates
currently carry a test ID (468 + 128 of 828). Gaps will surface here, and per
R5.2 they are fixed upstream in webui or `@truenas/ui-components` rather than
worked around. **This is the largest estimation uncertainty in the plan** — the
work is small individually but arrives as a stream of cross-repo PRs on someone
else's review cycle.

Mitigation: audit the screens for S1–S8 for missing test IDs at the *start* of
this phase and raise the upstream PRs in one batch, rather than discovering them
one at a time and blocking on each.

**Size:** L · **Risk:** medium — concentrated in test-ID gaps and S3/S6

---

## Phase 5 — Hardening and handover

**Goal.** The suite is trustworthy and someone other than its author can own it.

**Work**

- Three consecutive green nights (R9.1)
- Quarantine mechanism and policy in practice (R8.4)
- Runtime within the ≤45 minute budget (R8.1); profile and trim if not
- One-command local run, documented (R9.2)
- Triage runbook: how to read a failure and route it

**Exit criteria.** Someone who did not build the suite diagnoses a seeded
failure using only the runbook and the artifacts.

**Size:** S · **Risk:** low

---

## Critical path and parallelism

Phases 0 and 1 are strictly sequential and hard to parallelise — they are one
person's work and everything else waits on them.

From Phase 2 onward, if more than one person is available:

- **Track A:** Phase 2 fixtures → Phase 4 stories (the main line)
- **Track B:** Phase 3 observability, independent once Phase 1 lands
- **Track C:** the test-ID audit and upstream PRs, which can begin as soon as
  the S1–S8 screens are known — i.e. immediately, since they are already listed

Track C is the best use of a second person early, because it has the longest
lead time and the least dependency on this repo.

---

## Signals to stop and re-plan

Worth naming in advance, so they are recognised rather than absorbed.

- **Test-ID gaps turn out to be pervasive rather than occasional.** If more than
  a handful of the S1–S8 screens need upstream work, the dependency on other
  teams' review cycles becomes the schedule, and that should be an explicit
  decision rather than a discovered one.
- **The suite exceeds the runtime budget before Phase 5.** With eight stories
  that would indicate something structurally wrong — most likely R3.1 being
  violated, with tests driving the UI for preconditions.
- **More than one story is quarantined at the end of Phase 4.** The quarantine
  policy is a pressure valve, not a place to store known-broken tests.

---

## Deferred beyond v1

Carried from `01-requirements.md`, unchanged:

- **D1** — PR gating, with its middleware-pinning and cross-repo-checkout
  problems
- **D2** — Parallel execution by sharding across VM instances
- **D3** — Independent test-ID drift detection
- Feature areas listed in R1.3: apps, replication, snapshot tasks, groups,
  alerting, directory services, VMs, containers
