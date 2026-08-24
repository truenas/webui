# TrueNAS WebUI E2E — Environment Architecture

**Status:** Draft for review, 2026-08-08
**Prerequisite:** [`status.md`](./status.md)

The suite's own decisions — how to drive a browser, how to talk to middleware —
are settled and live in `status.md` and `e2e/CLAUDE.md`.
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
- Provisioning already exists: **`ixnode`**, a Jenkins-invoked script that
  installs TrueNAS from an ISO. **The team that owns it is resistant to
  changes**, which is a design input, not just an inconvenience — see **E5**.
- The hypervisor is **libvirt/KVM**, which supports domain-level snapshots with
  optional memory state. This is what makes **E1** possible. Disks are
  **qcow2 files**; guests need **4GB of RAM**, 8GB worst case.
- The `ixnode` team **will add snapshot and revert verbs** (**Q2**, answered
  2026-08-10). **E1** is therefore buildable as written, not contingent.
- **One VM per run is affordable.** More than one per run is unquantified
  (**Q5**), and **E3** depends on the answer.
- AD, LDAP, S3 and KMIP **exist in the lab and can be shared** (**Q3**,
  answered 2026-08-10) — which makes **E9**'s per-run identity work *required*
  rather than conditional.
- A self-hosted runner **can sit on the libvirt host** in a restricted segment
  (**Q7**), so snapshot and revert are local `virsh` calls.
- **HA failover is in scope** — later, but definitely.
- **CI should run in GitHub Actions**, not Jenkins, using **self-hosted
  runners** for the VM work. See **E12**.

### 0.3 The budget this all has to fit inside

**R8.1** sets ≤45 minutes for the v1 suite. That is 2,700 seconds, and it is the
number every decision here is ultimately spending. It is worth stating plainly
because the arithmetic is unforgiving:

> At a 210-second provision and a ~90-second test, an appliance reprovisioned
> per test completes **nine tests** in the entire budget, with **70% of
> wall-clock spent in the installer**.

Nine — and that is the shard's *whole* budget, before any Local or Contained
test has run. It is the reason **E1** restores by snapshot rollback rather than
by reinstalling, and the single number most likely to decide whether this suite
scales.

(The 90-second test is a placeholder. The only measured figures available are
~20s per journey and ~32s for the whole suite today; Global tests will be
slower, but by how much is **Q1**. The conclusion survives any plausible value,
because the 210s dominates either way.)

---

## E1. Restore is a VM snapshot rollback

Roll the appliance back to a libvirt snapshot. Reinstall only to *build* a
baseline, not to return to one.

| Primitive | Cost | Restores | Used for |
|---|---|---|---|
| API cleanup — delete what you created | seconds | Objects the test created | Local, Contained |
| `virsh snapshot-revert` to a baseline | RAM-dependent, see below (**Q0b**) | Everything: config DB, system dataset, pools, on-disk state | Global, Infrastructural |
| Full ISO install via `ixnode` | ~210s (**Q0a**) | Everything, plus installer coverage | Building a baseline; periodic fidelity run |

**Why snapshots, having first rejected them.** This document's earlier drafts
argued that a 3m30s install was cheap enough to make snapshot tooling not worth
owning, and looked for an in-band restore instead. Both conclusions were wrong,
and the second one failed for a reason worth recording.

**No in-band restore works, because TrueNAS state is not in one place.** It is
spread across the configuration database, the system dataset, and the pools —
and the system dataset *relocates between pools* when its current one goes away.
Every partial mechanism covers one store and leaves the others:

- **`config.reset`** restores the configuration database — to the
  package-build-time `factory-v1.db` (`middlewared/plugins/config.py`;
  `debian/rules` bakes it at build time). It therefore discards the admin
  account the installer created, breaking **R2.8** and locking the suite out.
  It also touches no data whatsoever.
- **`config.save` / `config.upload`** avoids the factory-state problem — it
  restores to a state you captured — but still covers only configuration, still
  needs a reboot, and needs `secretseed: true` or every encrypted field in the
  restored database becomes undecryptable on restore.
- **ZFS rollback** is per-dataset. It cannot resurrect a destroyed dataset, so
  any test touching dataset lifecycle defeats it, and it does not address the
  configuration database at all.

A VM snapshot has none of these problems precisely because it is *not*
state-aware: it captures the disks and optionally the memory, so where TrueNAS
keeps a given piece of state stops mattering.

**Why the original rejection was wrong.** It compared a one-off saving against
the fidelity of exercising the installer. But installer coverage is bought by
the **first** provision of a run — paying 210s again on restore #40 buys
nothing — while the install cost repeats every time. Once restores are frequent,
the comparison inverts. The periodic fidelity run in row 3 preserves the
coverage that mattered.

### Mechanics on libvirt/KVM

**Atomicity across disks is free, and losing it would be silent.**
`virsh snapshot-create-as` operates on the **domain**, so all disks — **R2.2**
provisions 8 — are captured in one operation with the guest briefly paused.
Snapshotting volumes individually instead would let a restore assemble a set of
disks that never coexisted, which is an unimportable or subtly corrupt pool. The
rule is *snapshot the VM, never the volumes*.

**Memory state is worth having, and its cost scales with RAM.**
`--memspec file=…,snapshot=external` captures RAM alongside the disks, and
revert brings back a running machine rather than one that must boot. Revert
re-reads the whole memory image, so the guest's RAM size sets the floor.

At the confirmed **4GB** (**Q6**) that image is small: expect single-digit
seconds on NVMe, perhaps 15–20s on SATA SSD. The 8GB worst case roughly doubles
it and is still well inside a boot. Two consequences survive knowing the number:

- **Guest RAM is a test-infrastructure parameter.** Every gigabyte is paid on
  every restore, so 4GB is worth defending against future creep.
- Keep memory images on the fastest storage available — and note that
  **N simultaneous reverts share that throughput**, so per-revert cost degrades
  as the shard count rises (**Q5**).

**Disk-only is the fallback, not a failure.** An external disk snapshot plus a
boot still removes the ISO install — roughly 2x better than reinstall against
~10x for memory state — with no RAM image to move.

**Backing store is qcow2** (**Q6**), which is the simple path: a single
domain-level `virsh` snapshot covers all 8 disks, and both internal and external
snapshots are available. External remains the safer default — easier to delete
and less prone to growing the base image. The zvol alternative, which would have
needed a recursive `zfs snapshot` paired with `virsh save`, does not arise.

### What a snapshot still does not fix

**Restore invalidates the suite's session, and nothing re-mints it.** The
`setup` project writes `e2e/.auth/storage-state.json` once per run and the
`authenticated` project consumes it (`playwright.config.ts`); it holds a live
middleware token. A reverted guest has stale in-guest TCP state, so the
WebSocket is dead whether the restore booted the machine or resumed it. This is
unchanged from every other restore mechanism considered, and it means the
harness needs per-appliance re-authentication after restore — which pulls
**E10**'s "the harness must be able to expect disconnection" out of the HA
future and onto the critical path now.

**Clock jump on resume.** A resumed guest's clock is stale by however long it
sat. **Kerberos tolerates roughly five minutes of skew**, so AD-joined baselines
can fail in a way that reads as a UI bug; TLS validity windows and scheduled
tasks are affected too. Force an NTP resync as part of the restore rather than
discovering this later.

**State outside the appliance is untouched** — a domain machine account, an S3
bucket, a KMIP key (**E9**). No local snapshot reaches it.

**Rejected: accepting reinstall as the restore primitive.** It is the honest
fallback if the substrate disappoints, but at the measured ~20s test it demands
12 appliances per shard (**E2**) where a memory-state revert demands 2. That is
a lab-capacity difference, not a tuning difference.

## E2. Size the appliance pool from the restore cost

How many appliances a shard needs is a function of how long a restore takes
relative to a test. Get the restore cheap enough and the question disappears.

**Why this decision exists at all.** In earlier drafts, with reinstall as the
restore primitive, this section was about pipelining — warming the next
appliance while the current one ran tests, to hide a 210-second install. **E1**
largely dissolves that problem rather than managing it: a memory-state revert is
comparable to a test in duration, so there is little left to hide.

**The formula.** If restores are overlapped with tests, a shard's steady-state
throughput is `max(restore, test)`, so reaching test-speed requires:

> **appliances per shard = 1 + ⌈restore ÷ test⌉**

Figures below use the **measured** ~20s journey duration
(`status.md`) rather than a guess. Global tests will be slower — by
how much is **Q1** — and slower tests need *fewer* appliances, so these are
pessimistic, which is the right direction for a budget ask.

| Restore primitive | Restore cost | Appliances per shard at a 20s test |
|---|---|---|
| Memory-state revert, 4GB guest on NVMe | <10s (**Q0b**) | **2** |
| Memory-state revert, 4GB guest on SATA SSD | ~20s (**Q0b**) | **2** |
| Memory-state revert, 8GB guest | ~30s (**Q0b**) | **3** |
| Disk-only snapshot + boot | ~90s | **6** |
| Full ISO reinstall | ~210s (**Q0a**) | **12** |

With the confirmed 4GB guest (**Q6**) the expected row is the first or second,
so **two appliances per shard** is the planning figure — not the optimistic
case it looked like when the guest size was unknown.

Derivation, so the numbers can be checked rather than trusted: an appliance's
full cycle is `test + restore`, so N appliances deliver one test every
`(test + restore) / N`; requiring that to be ≤ `test` gives
`N ≥ 1 + restore ÷ test`.

**The counter-intuitive part, stated so nobody rediscovers it in month three:
faster tests need *more* appliances, not fewer.** The ratio is
restore-over-test, so speeding tests up raises the appliance count unless
restore speeds up with them.

**This is the argument for memory-state snapshots in one line:** the difference
between the top and bottom rows is a lab capacity question — two VMs per shard
or twelve — not a tuning preference. It is also why guest RAM sizing (**E1**)
is an infrastructure decision rather than a detail.

**Overlapping restores with tests only matters for the slow rows.** At ~10s
against a ~20s test, a shard can simply restore in place between tests and stay
close to test-speed with a single appliance; the pool exists for resilience and
for the Infrastructural tier, not to hide latency.

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
(D2 in `status.md`), promoted from deferred to load-bearing.

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
| **Global** | Pool topology, service enable/disable, network, encryption, anything reached over SSH | `virsh snapshot-revert` to the test's baseline |
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

## E5. Baselines are snapshots, and `ixnode` has to take them

A baseline is a named appliance condition — `fresh-install`, `single-pool`,
`pool-and-ad-joined` — captured as a **VM snapshot**. A test names the baseline
it needs; restoring is a revert (**E1**).

**Why snapshots rather than recipes.** A recipe has to be re-run; a snapshot is
returned to. This is what makes the Global tier affordable, and it is the thing
`config.upload` was reaching for and failing at — a snapshot captures the
configuration database, the system dataset and the pools together, so the
distributed-state problem in **E1** never arises.

**Where this has to live, given `ixnode` owns the VMs.** `ixnode` manages the
domains through libvirt itself, so there is no clean way to bolt snapshotting on
from outside: a second thing driving `virsh` against domains `ixnode` believes
it owns is two owners for one resource, and it will break the first time
`ixnode` reclaims or rebuilds one.

So the ask has to go to that team. Given they are resistant to change, **the
ask should be made as small as it honestly is** — two additive verbs over
machinery they already drive:

- **snapshot this domain** (with memory, if the substrate allows)
- **revert this domain to that snapshot**

That is deliberately *not* "teach `ixnode` about baselines". Baseline **content**
stays ours: `ixnode` installs a clean box, our own script drives it to the
baseline state over the API we already have, and then asks `ixnode` to snapshot
it. `ixnode` never needs to know what `pool-and-ad-joined` means, and adding a
baseline never needs a ticket in their queue. The interface is two verbs about
domains, which is the smallest surface that can work.

**Three ways this can land**, in preference order:

1. **`ixnode` adds the two verbs.** Smallest ask, and it keeps the thing
   `ixnode` genuinely provides.
2. **`ixnode` cedes libvirt lifecycle for our domains** and we snapshot and
   revert them ourselves. Technically straightforward, still needs the same
   team's agreement — a different conversation, not a way to avoid one.
3. **We own a separate pool of domains outright**, with no `ixnode` dependency.
   Viable because **E12** puts a runner on the libvirt host anyway.

Option 3 is a real fallback rather than a threat, but it is not free, and it is
worth being precise about why. What `ixnode` provides is not `virt-install` — it
is the **unattended TrueNAS install**: EULA, first-boot wizard, admin
credentials, the whole **R2.8** boot-state contract. Reimplementing that is the
actual cost of option 3.

Its saving grace is that the cost is one-time and bounded: baselines are built
rarely, only when the nightly image moves. If option 1 stalls, option 3 is a
schedule we control rather than one we wait on.

**Baselines must specify a disk profile,** and there is an existing mismatch to
settle when they do: **R2.2** specifies 8 virtual disks, while
`fresh-install.e2e.ts:38` builds a 9-wide RAIDZ2 and calls
`requireUnusedDisks(api, 9)`. Today that is a fail-fast at startup on an 8-disk
box, and it is a concrete argument for pinning disk inventory to a baseline
rather than assuming it.

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

**No real-endpoint runs are needed** (**Q4**, answered 2026-08-10): there is no
certification or contractual commitment to a named provider that a stand-in
would fail to evidence. So there is no vendor credential in CI, no third-party
uptime in our results, and no spend.

**Where the difference does show, for the record.** Samba AD DC is not Windows
AD — DNS integration and functional levels differ — and cloud providers vary at
the edges. If a commitment to a named vendor ever appears, the answer is a
small, separate, explicitly tolerant nightly against real endpoints, kept out of
the main suite because it partly measures someone else's uptime. Not needed
today.

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

## E12. CI: GitHub Actions on self-hosted runners

**Sharding is native.** Playwright accepts `--shard=i/n`, and a matrix job maps
onto it directly: each leg claims one appliance, so **E2**'s appliance count
*is* the matrix size. No bespoke orchestration.

**The concurrency guard stops being something we build.** §0.1's problem — two
runs against one appliance destroying each other — is a `concurrency:` group,
expressed declaratively. It is also how **Q5**'s appliance budget gets enforced:
cap the matrix, cap the pool.

**Artifacts.** `upload-artifact` covers traces, video and JUnit XML (**R7.1**)
without a plugin. **R7.2**'s middleware log collection still has to run before
the VM is reclaimed, which is a teardown step regardless of CI system.

**Put the runner on the libvirt host.** Then snapshot and revert are local
`virsh` calls: no remote hypervisor API, no credential plumbing, no network hop
on the hot path. Anywhere else and every restore needs an authenticated remote
channel to the hypervisor. This also makes **E5**'s option 3 viable.

### The public-repository constraint

**`truenas/webui` is public, and self-hosted runners on public repositories are
a known attack path.** If any workflow with access to these runners can be
triggered by a pull request from a **fork**, then an arbitrary person on the
internet can execute code on a machine that sits on the lab network and holds
`virsh` access to every appliance. GitHub's own guidance is not to pair
self-hosted runners with public repositories, precisely because of this.

It is workable, but only with the gates set deliberately:

- **Never** trigger e2e on `pull_request` from forks, and never use
  `pull_request_target` with a checkout of PR code.
- Restrict triggers to `push` on protected branches, `schedule`, and
  `workflow_dispatch`.
- For PR gating later (**D1**): same-repo branches only, plus a GitHub
  **environment with required reviewers**, so a human approves before untrusted
  code runs.
- Put the runner in its own network segment with no route to anything but the
  lab, and treat it as compromised-by-default.

Decide this before the first nightly rather than after. "Add PR gating" is
exactly the later change that opens the hole quietly.

---

## E13. Host sizing, and the two hardware asks

Working assumption, 2026-08-10: a 64-thread AMD Epyc, 128GB RAM, 512GB SSD.
**Hardware is not yet assigned**, so this section exists to influence the spec
while that is still possible.

### What the assumed box supports

| Resource | Capacity | Concurrent appliances |
|---|---|---|
| RAM | 128GB, less ~8GB host/libvirt, ~5GB per guest incl. qemu overhead | ~24 |
| CPU | 64 threads, 2 vCPU per guest | ~32 before oversubscription — not the constraint |
| Disk | 512GB, less ~80GB of baselines | **~12–20, depending on churn** |

**Disk binds first.** Fixed cost is roughly 15GB per baseline base image plus a
4GB memory image, so four baselines is ~80GB before a test runs. The remaining
~430GB is per-VM overlay churn, which is what actually varies: at ~10GB per VM
that is ~40 concurrent, at ~20GB it is ~21.

**One hazard specific to this suite.** `fillDataset` (**E8**) deliberately fills
a dataset, and on 8 thin-provisioned disks that grows the overlay by however
much it writes. Several of those concurrently is how a 512GB device fills
mid-run. **Cap the fill size inside the helper** rather than letting each test
choose — the same argument as **E8**'s named-helper rule, applied to resource
consumption.

### Ask 1: NVMe, not SATA

This matters more than anything else on the list, because **revert speed is the
design**.

A 4GB memory image reads back in roughly 1.5s on NVMe against ~8s on SATA SSD —
already a difference of two rows in **E2**'s table. The decisive factor is
contention: reverts do not happen one at a time, and a sharded run reverts many
appliances at once against one device.

| | 12 concurrent reverts, ~48GB moved |
|---|---|
| NVMe | a few seconds each |
| SATA SSD | **~90 seconds aggregate** |

The SATA case puts revert above the cost of a boot, which collapses the entire
argument for memory snapshots and pushes the design back to disk-only or
reinstall. Same budget, materially worse outcome.

### Ask 2: more than 512GB

Disk is the only real ceiling on that box, and it is the cheapest component to
change. 2TB of NVMe is a rounding error beside a 64-thread Epyc with 128GB, and
it removes concurrency as a constraint outright — no overlay pruning between
runs, no cap on how many baselines are kept, no fill-test hazard.

If 512GB is fixed it remains workable: keep to three or four baselines, prune
overlays between runs, cap `fillDataset`. That is operational care spent for no
particular reason.

### Sizing recommendation

**Start at 8 shards** — 8 to 16 VMs depending on whether shards hold a warm
spare (**E2**). Comfortably inside every limit on the assumed box, and already
more parallelism than the Global tier needs at its present size. Grow when
measurement justifies it, not before.

---

## Open questions

| | Question | Blocks |
|---|---|---|
| **Q0a** | End-to-end `ixnode` turnaround for an e2e-ready box — invocation, VM create, ISO install, boot, **R2.8** boot-state contract, first successful connect | **E1**, **E5**; the 210s figure is a *middleware-test* number and is certainly a floor. Now paid per *baseline build*, not per restore |
| **Q0b** | **Revert-to-usable**, for the guest RAM and backing store actually in use: `virsh snapshot-revert` + NTP resync + middleware ready + WebSocket reconnect + re-auth | **E1**, **E2**. The most load-bearing unmeasured number in this document — it sets the appliance count |
| **Q1** | How long does the Local tier take against one appliance, and how long is a representative Global test? | Whether tiering is needed *yet*; sets the appliance count in **E2** |
| ~~**Q2**~~ | **Answered 2026-08-10: yes**, `ixnode` will add snapshot and revert. **E5** option 1 applies; options 2 and 3 are no longer needed | — |
| ~~**Q3**~~ | **Answered 2026-08-10: shared.** So per-run identity is now required work, not a contingency — see **E9** | — |
| ~~**Q4**~~ | **Answered 2026-08-10: no commitment, local stand-ins are fine.** MinIO, Samba AD DC, OpenLDAP and PyKMIP cover everything; no real-endpoint nightly needed | — |
| **Q5** | **libvirt host capacity.** Working assumption 2026-08-10: 64-thread Epyc, 128GB RAM, 512GB SSD — *not yet assigned hardware*, so still influenceable. See **E13** | **E3**, **E2** |
| ~~**Q6**~~ | **Answered 2026-08-10: qcow2, 4GB guests (8GB worst case).** Folded into **E1** and **E2** | — |
| ~~**Q7**~~ | **Answered 2026-08-10: yes.** Snapshot and revert are local `virsh` calls | — |

---

## Sequence

Front-loaded with measurement, because most of this document assumes a scaling
problem that has not been demonstrated.

1. ~~Open the `ixnode` conversation.~~ **Done — Q2 answered yes.** The two
   verbs are agreed, so **E1** is unblocked and **E5** option 1 applies. What
   remains is agreeing their exact shape with that team.
2. **Measure Q0b, then Q1.** A revert-to-usable time is what sets the appliance
   count, and it is cheap to measure by hand on one box. If the Local tier also
   runs 80 tests in 20 minutes on one appliance without tainting, tiering is
   premature and the right move is simply to write tests — do not build the
   architecture above on the strength of this document alone.
3. **Environment descriptor, capability manifest, hand-run default** (**E6**).
   Small, unblocking, and it stops the next environment type being a rewrite.
   Make the descriptor topology-shaped while in there (**E10**).
4. **Prove the revert cycle by hand** (**E1**): build a box to a baseline,
   snapshot it with memory, run something destructive — create a pool, join a
   domain — then revert and confirm the appliance is genuinely back, the suite
   can re-authenticate, and the clock resynced. Half a day, and it answers Q0b.
5. **Re-authentication after restore** (**E1**, **E10**). Nothing else works
   until the harness survives an appliance disappearing.
6. **Settle shared-service identity** (**Q3**) before the first AD test — no
   local snapshot restores a domain machine account.
   Decide runner placement and the fork-trigger policy at the same time
   (**E12**, **Q7**) — the security gates are cheaper to set before the first
   workflow exists than to retrofit.
7. **Agree baseline names and disk profiles** (**E5**), including the 8-vs-9
   disk mismatch.

---

## Signals to re-plan

- **The Local tier taints anyway.** Then the tier model is wrong and per-test
  restore is the honest answer for everything, with a much larger appliance
  budget as the price.
- **Q2 comes back no**, on both the verbs and the fallback. Then reinstall is
  the only restore available, the Global tier has to be held to single digits
  per shard, and that constraint should drive test design explicitly rather than
  being absorbed quietly.
- **Q0b comes back close to Q0a.** If a revert is nearly as slow as an install,
  the snapshot machinery is not earning its complexity — check guest RAM and the
  backing store (**Q6**) before concluding it, since both dominate that number.
- **Snapshots turn out not to be honest restores.** The premise of **E1** is
  that a VM snapshot is state-agnostic. If reverted appliances misbehave in ways
  a freshly installed one does not, that premise is wrong and the whole approach
  needs revisiting.
- **Skipped-for-capability counts stay high** run after run. Skipping is a
  pressure valve for a busy lab, not a permanent state hiding coverage we
  believe we have.
- **Per-test restore makes R7.2 unaffordable.** `middlewared.log` must be
  collected before a VM is reclaimed. At one reprovision per run that is a
  teardown step; at one per test it is a per-test cost that has to be measured
  and may constrain the tier model.
