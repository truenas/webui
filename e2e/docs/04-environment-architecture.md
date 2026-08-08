# TrueNAS WebUI E2E — Environment Architecture

**Status:** Draft for review, 2026-08-08
**Phase:** Supplement to phase 2 (appliance side of [`02-technology.md`](./02-technology.md))
**Prerequisites:** [`01-requirements.md`](./01-requirements.md),
[`02-technology.md`](./02-technology.md), [`03-plan-and-status.md`](./03-plan-and-status.md)

`02-technology.md` decided how to drive a browser and how to talk to middleware.
It assumed an appliance was simply *there*. This document is about where that
appliance comes from, what shape it is in, and what happens to it during a run.

Decisions are numbered `E<n>` and cited the way `R`, `T` and `D` already are.
Unresolved items are `Q<n>` — questions needing an answer from outside this
repository, distinct from `D<n>`, which are decisions deliberately postponed.

---

## 0. Context

### 0.1 The constraint that drives everything

**The appliance is the fixture.** Not a database that can be truncated, not a
container discarded in a second — a stateful storage appliance whose
configuration changes what the UI under test even renders.

Three consequences, in descending order of trouble caused:

**State taints across tests.** A pool created in one topology changes which
options later screens offer and which warnings they show. So the *order* tests
run in becomes significant. Order-dependent suites fail only in full runs, never
in isolation, and cannot be bisected — the failure mode that gets a suite
deleted rather than fixed. **R3.5** already forbids this; the appliance is what
makes it hard to honour.

**The API is necessary but not sufficient.** Preconditions are cheap over
JSON-RPC (**R3.1**), but some states have no API. Degraded pools, full datasets,
ungracefully stopped services — the interesting failure states — are reachable
only by doing something unorthodox to the box over SSH.

**Some features are only real with real infrastructure.** Active Directory,
LDAP, S3/Backblaze, KMIP. If the point is the integration, there is nothing to
stub.

Cleanup-based isolation — the suite's current approach — handles exactly one
class of change: things that can be created and then deleted. It cannot un-taint
a ZFS feature flag, an ungracefully restarted service, or a joined domain. The
two journeys shipped in the POC sit almost exactly at that ceiling.

### 0.2 What we know

Established 2026-08-08 with grwilliam. These numbers drive the decisions below;
if they are wrong, revisit.

- A middleware-test VM **installs and boots in ~3m30s**. That suite does no
  snapshotting or rollback.
- Provisioning already exists: **`ixnode`**, a Jenkins-invoked script that brings
  up a VM in the condition a run needs. Its capabilities are not yet mapped
  (**Q2**).
- **One VM per run is affordable.** More than one per run is unquantified
  (**Q5**), and **E3** depends on the answer.
- AD, LDAP, S3 and KMIP **exist in the lab**; whether they can be shared across
  concurrent runs is unconfirmed (**Q3**).
- **HA failover is in scope** — later, but definitely.

### 0.3 The budget this all has to fit inside

**R8.1** sets ≤45 minutes for the v1 suite. That is 2,700 seconds, and it is the
number every decision here is ultimately spending. It is worth stating plainly
because the arithmetic is unforgiving:

> At a 210-second provision and a ~90-second test, an appliance reprovisioned
> per test completes **nine tests** in the entire budget, with **70% of
> wall-clock spent in the installer**.

Nine — and that is the shard's *whole* budget, before any Local or Contained
test has run. It is the reason this document is not simply "reinstall between
tests".

(The 90-second test is a placeholder. The only measured figures available are
~20s per journey and ~32s for the whole suite today; Global tests will be
slower, but by how much is **Q1**. The conclusion survives any plausible value,
because the 210s dominates either way.)

---

## E1. Restore is a price list, not a single primitive

There are four ways to return an appliance to a known state. Pick the cheapest
one that is *sufficient* for what the test dirtied.

| Primitive | Cost | Restores to | Tier |
|---|---|---|---|
| API cleanup — delete what you created | seconds | Whatever the test started from | Local, Contained |
| Export data pools, then `config.upload` a per-baseline golden config | a reboot (**Q0b**) | The baseline, admin account intact | Most of Global |
| Full `ixnode` reinstall | ~210s (**Q0a**) | Factory, plus whatever provisioning adds | Session start, periodic fidelity |
| `boot.environment.clone` / `.activate` | a reboot (**Q0b**) | Boot-pool state only — *orthogonal*, see below | Forward-looking |

**Why this shape.** The instinctive framing is "reinstall vs hypervisor
snapshots", and that was this document's first draft. It is a false dichotomy,
and the arithmetic in §0.3 kills both horns of it. **TrueNAS ships its own
restore primitives, and the suite already holds a client that can call them.**

**Why `config.upload` and not `config.reset`.** `config.reset` looks like the
obvious choice and is the wrong one. It does
`shutil.copy('/data/factory-v1.db', FREENAS_DATABASE)`
(`middlewared/plugins/config.py`), and `factory-v1.db` is baked when the
middleware `.deb` is built (`debian/rules`), not captured post-install. So reset
does not return the box to *your* known-good state — it returns it to the
factory state, **discarding the admin account the installer created**. That
breaks **R2.8** (admin credentials set, no first-boot wizard) and the suite
cannot log in afterwards. The UI corroborates the intent: `config-reset.component.ts`
sends the browser to `/signin` and waits for the system to come back.

`config.save` / `config.upload` are the same cost bracket and the right shape:

- **Restores to an e2e-ready state**, not the factory one. R2.8 survives.
- **It materialises E5's baselines.** Build `single-pool` once, `config.save`
  it, and `config.upload` returns any appliance to it. A baseline stops being
  only an `ixnode` recipe and becomes an artifact — cheap to *restore*, not just
  cheap to *request*.

Three mechanics to plan for.

**Save baselines with `secretseed: true`.** This is the one that will cost an
afternoon if missed. `save()` with no options routes to `save_db_only` — the
database alone, no `pwenc_secret`. On restore, `handle_db_upload_path()` finds
no secret and *generates a fresh one*, leaving *every encrypted field in the
restored database undecryptable*: service passwords, cloud-sync credentials, the
AD bind password, KMIP. It fails **silently** — the upload succeeds, the box
boots, and the damage only appears when something tries to decrypt. Since the
DB-only save is the default, a naive smoke test passes.

`upload` is a job with an **input pipe**, so it needs the `/_upload` HTTP
endpoint rather than JSON-RPC alone (**R2.11** already lists `/_upload` in the
proxy set).

`upload_impl` runs `migrate` on the uploaded database, so a config saved against
an older nightly restores onto a newer one — useful against **R2.4**'s moving
target, at the cost of a schema migration on every restore.

**What `config.upload` still does not undo.** Worth stating, because these are
the ones that will bite:

- The **system dataset** survives. It carries Samba `passdb` and `group_mapping`
  (middleware has `test_smb_passdb_reinit.py` for exactly this class of
  problem), reporting data, and config backups. If it sits on the boot pool it
  survives a data-pool destroy too.
- Anything outside the database and `CONFIG_FILES` — on-disk state a test wrote
  directly, or damage inflicted over SSH (**E8**).

Note the boundary is `CONFIG_FILES`, not the database alone: `upload` genuinely
manages `pwenc_secret`, the three `authorized_keys` files and `snmp_engine_id`,
unlinking them when they are absent from the tarball. `config.reset` touches
none of them, so a key added over SSH would have survived a reset. Another point
to the chosen primitive.

**Ordering matters, and getting it backwards is unrecoverable.** Encryption keys
and passphrases live in the config database, and **E4**'s Global tier includes
encryption. **Export or destroy pools first, then restore the config** — do it
the other way and the keys are gone before the pool that needs them. The
disk-wipe half is already solved: `ensurePoolAbsent` uses `pool.export` with
`{ cascade: true, restart_services: true, destroy: true }`
(`fixtures/storage.ts:212-215`).

**Boot environments are orthogonal, not a cheaper reinstall.** `/data` is
persistent and separate from the root filesystem — which is why configuration
survives upgrades — so a BE rollback leaves the config database untouched. The
row stays because it is the right tool for upgrade-path coverage, but that is a
declared v1 non-goal (**R10**), so treat it as forward-looking.

**Restoring the Infrastructural tier is not covered by any row above.** An
AD-joined appliance has a machine account on a domain controller that no local
operation removes (**E9**). Either leave the domain explicitly in teardown, or
accept a reinstall — and note the domain-side object still needs cleaning.

**Every reboot-based row invalidates the suite's session, and nothing currently
re-mints it.** The `setup` project writes `e2e/.auth/storage-state.json` once per
run and the `authenticated` project consumes it (`playwright.config.ts`); it
holds a live middleware token, and middleware sessions do not survive a reboot.
So the first Global-tier restore silently invalidates authentication for every
later test in that shard.

This is a harness gap, not a test-authoring detail, and it has a consequence
worth naming: **it pulls E10's "the harness must be able to expect
disconnection" out of the HA future and onto the critical path now.** Any
reboot-based restore needs the harness to tolerate the appliance going away and
re-authenticate against it afterwards, per appliance rather than once per run.

**On fidelity, stated precisely.** Reinstalling exercises the installer and
first-boot path. That is real coverage — and it is fully bought by the **first**
provision of a run. Reinstalls 2..N re-cover a covered path. So fidelity argues
for *reinstall at least once*, not for reinstall between every test, and it is
not an argument against a cheaper per-test primitive.

**Relationship to R2.3.** `01-requirements.md` states that a known-good state is
"satisfied by construction: each run gets a fresh VM. No snapshot-revert or
reset machinery is required." That reasoning holds **per run** and this document
does not dispute it. What §0.1 establishes is that per-run freshness does not
give per-*test* isolation once the Global tier exists. This table is the
smallest escalation that closes the gap, and it deliberately still requires no
snapshot-revert machinery.

**Rejected: hypervisor snapshot/rollback.** An estimated 15–30s restore
(unmeasured — an estimate, not a finding) against substrate-specific tooling
owned indefinitely. `config.upload` occupies the same cost bracket, is already
built, is already tested, and is already reachable from the API client the suite
holds.

**What would change this.** Not the ZFS feature flags this section originally
guessed at. The real risk is the *opposite* of under-restoring: that the
reboot-based row proves more expensive in wall-clock than it looks on paper
(**Q0b**), or that the system dataset turns out to carry a taint class that
matters. Either would narrow the gap to a full reinstall enough to make the
cheap row not worth its complexity.

---

## E2. Keep provisioning off the critical path

Restore the *next* appliance while the current one is still running tests, so a
test never waits on a restore.

**Why.** This is the lever that dissolves §0.3's arithmetic, and it is cheaper
than any cleverness about restore primitives. Restoring is throughput-bound, not
latency-bound: nothing about a 210-second install requires a test to sit and
watch it.

**The formula, because the obvious guess is wrong.** A pipeline's steady-state
throughput is `max(stage_times)`, not the stage you care about. "One in use, one
warming" only reaches test-speed when restore ≤ test; otherwise the warm
appliance is still warming when the test finishes. The requirement is:

> **appliances per shard = 1 + ⌈restore ÷ test⌉**

Planning figures below. Test duration is a **placeholder** — the only evidence
in the repo is ~20s per journey and ~32s for the whole suite
(`03-plan-and-status.md`), and Global-tier tests will be slower, but 90s is a
guess pending **Q1**. It matters, because it sets the appliance count.

| Approach | Seconds per Global test | Appliances per shard | Tests per shard in 45 min |
|---|---|---|---|
| Reinstall (210s), serial | 300 | 1 | ~9 |
| Config restore (~90s — also a guess, **Q0b**), serial | ~180 | 1 | ~15 |
| Reinstall, pipelined | ~90 | **4** | ~30 |
| Config restore, pipelined | ~90 | **2** (no slack) | ~30 |

Derivation, so the numbers can be checked rather than trusted: an appliance's
full cycle is `test + restore`, so N appliances deliver one test every
`(test + restore) / N`; requiring that to be ≤ `test` gives
`N ≥ 1 + restore ÷ test`.

**The counter-intuitive part, stated so nobody rediscovers it in month three:
faster tests need *more* appliances, not fewer.** The ratio is
restore-over-test, so if Global tests land at 45s rather than 90s, the reinstall
row needs six appliances per shard, not four. At the *measured* journey duration
of ~20s it would need twelve.

**The config-restore row is the only one whose count does not move**, because
its restore and test durations are the same order. That stability is a real
argument for the primitive, independent of the wall-clock saving.

**Cost, corrected.** Not "two VMs per shard" — see the table. Plus a queue in
front of `ixnode`, which may itself serialise (**Q2**). Note the two pipelined
rows have different resource shapes: reinstall queues *provisions*, while config
restore holds additional **live** appliances and resets the idle one in place.

**This is a ceiling for the Global tier alone.** R8.1's 2,700s covers the whole
v1 suite; Local, Contained and Infrastructural tests draw on the same per-shard
wall clock. "~30 per shard" assumes a shard containing nothing else, which no
real shard will be.

**Rejected: accepting restore on the critical path.** It caps the Global tier at
single digits per shard while **E4** explicitly expects that tier to grow, and
it spends most of the budget on an installer whose coverage value was already
banked by the first run.

---

## E3. Scale by sharding across appliances, not workers

Concurrency comes from N appliances each executing a disjoint slice serially. It
never comes from raising Playwright's `workers`.

**Why.** `playwright.config.ts:73-79` pins `workers: 1` because pools, services
and system settings are global to an appliance — two workers against one box
interfere by construction (**R3.4**). That reasoning does not change; the unit
of parallelism just has to be the appliance. This is **D2**
(`01-requirements.md:426`), promoted from deferred to load-bearing.

**Blocked on Q5.** §0.2 records one VM per run as affordable. **E2** needs
`1 + ⌈restore ÷ test⌉` per shard — between 2 and 12 depending on the primitive
and on numbers nobody has measured. Shard count is therefore a *derived*
quantity, not the thing to ask for: the budget question is total concurrent
appliances. Until that is answered
is known, this is a shape, not a plan.

**Consequence, and it is a hard rule.** Shard assignment is by test file, and no
test may depend on another's residue: **any test must produce the same result
run alone, run first, or run last** (**R3.5**). If that is ever untrue the suite
has a defect, whether or not it is currently passing.

---

## E4. Classify tests by blast radius

Every test declares a tier. The tier determines which restore primitive
(**E1**) the harness owes it.

| Tier | Contains | Restore |
|---|---|---|
| **Local** | Forms, validation, navigation, rendering of state the test itself created | API cleanup; many tests share one appliance |
| **Contained** | Creates and deletes a user, share, dataset, snapshot | API cleanup, fresh appliance at suite boundary |
| **Global** | Pool topology, service enable/disable, network, encryption, anything reached over SSH | Export pools, then `config.upload` the baseline; reinstall only where that is insufficient |
| **Infrastructural** | AD/LDAP join, KMIP, cloud credentials, HA failover | Dedicated environment with that capability |

**Why tiers.** Uniform per-test appliances would be correct and unaffordable.
Uniform cleanup is affordable and wrong. Most tests genuinely are Local — a form
validating an IP address taints nothing — and should not pay for the few that
reshape the box.

**Local excludes reading any global collection.** A test asserting an empty pool
list is order-dependent by construction: the list is empty only if nothing else
left a pool behind. Such a test is Contained at best, whatever it looks like.
This is the most likely way the tier model gets quietly violated.

**Tier should be implied, not asserted.** Calling an SSH helper (**E8**) or
requesting a capability (**E6**) should set the tier automatically, so the
classification cannot drift from the truth as tests are edited.

**The honest cost.** Failure-condition simulation lands in Global, because
inducing a failure is exactly a change you cannot undo. That is unfortunate:
error and degraded states are the highest-value thing a UI suite can cover, and
what manual QA exercises least. Expect Global to grow — **E1** and **E2** exist
so that it can.

**Interaction with E5.** Baseline grouping amortises provisioning across
Contained and Infrastructural tests. It does **not** amortise for Global, where
each test needs its own restore. Ordered chains within one baseline are
permissible for Global where the ordering is explicit and declared — but that is
a considered exception to **R3.5**, not a default, and each chain should say why
it earns one.

---

## E5. Baselines are named, and they live in `ixnode`

A baseline is a named appliance condition — `fresh-install`, `single-pool`,
`pool-and-ad-joined`, `pool-and-kmip`. A test names the baseline it needs; the
suite never builds one.

**Why named baselines.** Otherwise every Global test constructs its own world,
which is slow, duplicated, and quietly violates **R3.1** the first time someone
builds a precondition through the UI because it was easier to write.

**Why in `ixnode`.** It already turns "a box in condition X" into a running
appliance, and is owned by people who work in that stack daily. Duplicating it
here would produce a second, worse provisioner maintained by people who do not.
The division is clean: **`ixnode` shapes appliances; the suite consumes them.**

**Baselines must specify a disk profile,** and there is an existing mismatch to
settle when they do: **R2.2** specifies 8 virtual disks, while
`fresh-install.e2e.ts:38` builds a 9-wide RAIDZ2 and calls
`requireUnusedDisks(api, 9)`. Today that is a fail-fast at startup on an
8-disk box. It is also a concrete argument for this decision — disk inventory is
part of a baseline, not an assumption.

**Open:** what `ixnode` can already express (**Q2**). The middleware nightly
must need some of this, so plausibly more than we assume.

---

## E6. The environment contract

Orchestration hands the suite a **descriptor**. It states:

- the appliance **topology** — nodes with roles, and a VIP where one exists
  (**E10**)
- credentials
- which **baseline** the appliance was built to
- which **capabilities** are present — `ad`, `ldap`, `kmip`, `s3`, `ha`, …
- which capabilities the run **requires**

Tests declare what they need. An undeclared missing capability **skips with a
stated reason**; a *declared-but-absent* capability **fails the run**.

**Why both halves.** Skip-only is the obvious design and it is a trap: a nightly
that should have KMIP, silently skipping fourteen tests, has lost coverage while
reporting green. The required-capability manifest is what makes that loud. And
skip-never-fail on its own is still right for the other direction — fourteen red
tests because the lab was busy is noise, and a suite that cries wolf gets
ignored. Same instinct as **R8.4**'s quarantine policy, applied to environments.

**Why this is the first thing to build.** It is small and it decouples
everything else: suite work and infrastructure work stop blocking each other,
because both sides need only agree on the descriptor. It also makes every future
environment additive — AD support becomes a capability flag plus tests that
require it, not a redesign. Without it, each new environment type is a config
rewrite and "can we test KMIP yet?" is a project rather than a boolean.

**It must have a hand-run default.** **R2.7** and **R9.2** require running
against a developer's own VM with no orchestration present. Absent a descriptor,
the suite must assume a single-node, no-optional-capabilities environment and
proceed — not skip everything.

**Where it goes.** `e2e/support/config.ts` already resolves and validates target
configuration in one place and fails at load naming every missing variable at
once. This extends something that exists and works.

---

## E7. External services: containerised by default

Stand up Samba AD DC, OpenLDAP, MinIO (S3-compatible) and PyKMIP alongside the
appliance. Reserve real vendor endpoints for a small, separate, explicitly
tolerant nightly.

**Why.** In the overwhelming majority of cases the UI cannot distinguish them —
it talks to middleware, and middleware talks to something speaking the protocol.
What containerisation buys is determinism, no third-party rate limits, no spend,
no production credentials in CI, and a suite that works offline.

**Where the difference does show.** Samba AD DC is not Windows AD: DNS
integration and functional levels differ, and cloud providers vary at the edges.
That is exactly why the real-endpoint nightly exists — but those tests partly
measure *someone else's uptime*, so they belong in a run allowed to be red
without blocking anything. Mixing them into the main suite reliably teaches
people to ignore it.

**Note.** Backblaze B2 exposes an S3-compatible API, so most cloud-sync coverage
does not need B2 specifically (**Q4** covers where a real vendor is contractually
required).

---

## E8. SSH is a first-class capability, and a narrow one

Fault injection over SSH is necessary (§0.1). Expose it only through named
helpers — `degradePool`, `fillDataset`, `stopServiceUncleanly` — never as
arbitrary command strings at the call site.

**Why.** Two independent reasons, either sufficient:

- Unorthodox commands are the most version-fragile thing the suite will contain.
  When one breaks on a new release it should break in one file, under a name
  that says what it was for.
- **Calling one is the signal that a test is Global tier** (**E4**). Making the
  helper declare the tier keeps the classification honest.

**Precedent, in both directions.** `middlewared/test/integration/utils/ssh.py`
exports a single generic `ssh(command, ...)`, and it is imported directly by
well over a hundred files under `tests/`. That is the outcome this decision is
trying to avoid, and it is worth naming rather than pretending otherwise.

The pattern to copy is a directory over:
`middlewared/test/integration/utils/failover.py` exports `do_failover()` and
`disable_failover()` — named helpers that wrap exactly this kind of unorthodox
command, including `echo b > /proc/sysrq-trigger` behind an `abusive=True`
flag. Same repository, same problem, better shape.

---

## E9. Shared lab services need per-run identity

If AD, LDAP or KMIP are shared between concurrent runs, they taint the way the
appliance does.

**Why it matters more than it sounds.** Two runs joining the same domain with
the same machine account collide, and the symptom is *a UI test failing
strangely* — not an obvious resource conflict. Expensive to debug, easy to
misattribute to flakiness, and it erodes trust in the whole suite.

**Either** give each run a unique identity — machine name, OU, bucket prefix,
key name — **or** dedicated service instances. This is **R3.3**'s run-scoped
naming applied outside the appliance. Settle it before the first AD test
(**Q3**), because the answer decides whether sharing is viable at all.

---

## E10. HA: shape the seam now, implement later

Two cheap decisions now avoid an expensive rewrite later.

**Make the descriptor describe a topology, not a host** (**E6**). One node
today. The alternative is reworking configuration, fixtures, client wiring and
every test's assumptions at the moment HA arrives.

**The harness must be able to expect disconnection.** Every test today treats a
dropped WebSocket or failed call as failure. In a failover test that *is* the
subject: the UI should show a reconnecting state and recover against the
surviving controller. Unless the harness can be told "disconnection is expected
here", these tests cannot be written — and that is a harness capability, not
something an individual test can arrange.

Failover is the extreme of Global: a controller pair per test, and a real
failover to recover from.

**Config restore is a whole-pair operation on a licensed HA system.**
`_handle_failover` sends the database to the peer and reboots both controllers,
so **E1**'s cheap row costs two appliances and two reboots here, not one.

**The mechanics are already solved on the Python side** and should be borrowed
rather than reinvented — `failover.py` provides `do_failover()`,
`disable_failover()` and `settle_ha()`, and `ha.py` carries an `ha_enabled` flag
from `auto_config`.

---

## E11. Where the line is

**The UI suite proves the UI is faithful to the appliance:** that it renders real
state correctly, that its forms produce the intended calls, and that it presents
errors and degraded states honestly.

**It does not prove middleware works.** That is what `middleware/tests` is for,
and re-proving it through a browser is the slowest available method.

**Worked example.** `fresh-install.e2e.ts` ends by asserting a write-capable ACL
grant exists, captioned — honestly — "confirm the new admin can actually use the
share". The UI's job finished when the right calls went out and the resulting
state rendered. Whether SMB then serves bytes is a middleware property, and
Python already has the protocol clients to assert it properly (`smbclient`,
`pynfs`, `cython-iscsi`) where TypeScript does not.

Keep one thin check of this kind to catch total disconnection between UI and
reality. Do not repeat the pattern per feature.

**Corollary: the cross-language seam is data, not code.** A journey publishes
what it created — share name, credentials, dataset path — as a small JSON
artifact; a Python check consumes it. To be explicit, because it would be easy
to assume otherwise: **JUnit XML is not this seam.** It is a result-reporting
format written once at end-of-run, and both sides emit it as output. The handoff
artifact does not exist yet and has to be built.

---

## Open questions

| | Question | Blocks |
|---|---|---|
| **Q0a** | End-to-end `ixnode` turnaround for an e2e-ready box — invocation, VM create, install, boot, **R2.8** boot-state contract, first successful connect | **E1**, **E2**; the 210s figure is a *middleware-test* number and is certainly a floor |
| **Q0b** | **Reboot-to-usable.** `system.reboot` carries a built-in 10s delay and the reset/upload job returns *before* the reboot happens, so the real cost is 10s + shutdown + boot + middleware ready + reconnect + re-auth | **E1**, **E2**. The most load-bearing unmeasured number in this document |
| **Q1** | How long does the Local tier take against one appliance, and how long is a representative Global test? | Whether tiering is needed *yet*; sets the appliance count in **E2** |
| **Q2** | What baselines can `ixnode` express, and does it serialise? | **E5**, **E2** |
| **Q3** | Can lab AD/LDAP/KMIP be shared, and with what per-run identity? | **E9**, first AD test |
| **Q4** | Which providers need *real* endpoints for certification reasons? | **E7** |
| **Q5** | **Total concurrent appliance budget** for one run — not the shard count, which **E2**'s formula derives from it and the answers to Q0a/Q0b/Q1 | **E3** |

---

## Sequence

Front-loaded with measurement, because most of this document assumes a scaling
problem that has not been demonstrated.

1. **Measure Q0a, Q0b and Q1.** Three numbers decide whether the rest of this
   document is worth building. In particular, if the Local tier runs 80 tests in
   20 minutes on one appliance without tainting, tiering is premature and the
   right move is to write tests. Do not build the architecture above on the
   strength of this document alone.
2. **Environment descriptor, capability manifest, hand-run default** (**E6**).
   Small, unblocking, and it stops the next environment type being a rewrite.
   Make the descriptor topology-shaped while in there (**E10**).
3. **Try the config-restore cycle end to end** (**E1**): export pools,
   `config.upload` a saved baseline, reboot, re-authenticate, confirm the box is
   reachable with the suite's credentials and that the previous test's traces
   are gone. Half a day, and it answers Q0b at the same time. Check *both*
   directions — that it restores enough, and that it does not overshoot past the
   state the suite needs. Include an encrypted field in the baseline, so a
   `secretseed`-less save fails the experiment rather than production.
4. **Map `ixnode`** (**Q2**) with its owners; agree baseline names and disk
   profiles.
5. **Settle shared-service identity** (**Q3**) before the first AD test.
6. **Pipeline restores** (**E2**) when the Global tier is large enough to feel
   it — not before, and size the appliance count with the formula rather than
   the guess.

---

## Signals to re-plan

- **The Local tier taints anyway.** Then the tier model is wrong and per-test
  restore is the honest answer for everything, with a much larger appliance
  budget as the price.
- **Config restore does not clear a taint class that matters** — the system
  dataset is the likeliest culprit — or **Q0b comes back close to Q0a**. Either
  collapses the gap between reboot and reinstall, and hypervisor snapshots
  become worth pricing after all.
- **`ixnode` cannot express the baselines we need** and extending it is not
  wanted. Baseline construction then has to live somewhere, and that should be a
  deliberate decision rather than defaulting into the suite.
- **Skipped-for-capability counts stay high** run after run. Skipping is a
  pressure valve for a busy lab, not a permanent state hiding coverage we
  believe we have.
- **Per-test restore makes R7.2 unaffordable.** `middlewared.log` must be
  collected before a VM is reclaimed. At one reprovision per run that is a
  teardown step; at one per test it is a per-test cost that has to be measured
  and may constrain the tier model.
