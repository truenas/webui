# TrueNAS WebUI E2E — Environment Architecture

**Status:** Draft 2026-08-08, rewritten 2026-09-02 against the pipeline as built
**Prerequisite:** [`status.md`](./status.md); the pipeline itself is in [`05-ci.md`](./05-ci.md)

> **What is actually running.** `.github/workflows/e2e.yml` is green: one
> appliance per run, installed from a nightly ISO and destroyed afterwards. No
> sharding, no snapshot restore. Everything in this document beyond E6, E11 and
> E12 is design for what comes next, argued from numbers that are now partly
> measured and partly still guessed. The two that decide everything — the cost
> of a restore (**Q0b**) and the length of a representative test (**Q1**) —
> are still guesses.

The suite's own decisions — how to drive a browser, how to talk to middleware —
are settled and live in `status.md` and `e2e/CLAUDE.md`. Those decisions
assumed an appliance was simply *there*. This document is about where that
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

Established 2026-08-08 with grwilliam; corrected 2026-09-02 by building the
pipeline. Where the two disagree, the build wins.

- **The appliance is a nested VM on a TrueNAS host.** The lab runner *is* the
  TrueNAS box. `tn_guest.py` (iXsystems/api-ci-testbed) creates the VM through
  that box's own middleware API — `vm.create`, `vm.device.create`, zvols in a
  dataset per deployment under `<pool>/test-vms/` — installs from an ISO via
  the installer's API, sets the admin password, and returns connection details.
  `ixnode`, which the first draft assumed, is that repository's *older* tool for
  dedicated Debian KVM hosts (libvirt, `virt-install`, a `/data` tree, root),
  and cannot run on a TrueNAS appliance.
- **Install to a usable, credentialed API is ~3.5 minutes** from a v27 nightly
  ISO (**Q0a**, measured 2026-09-02). ~10 minutes from a 25.10 release ISO,
  which the suite cannot use anyway: it is typed against API v27.
- **Disks are zvols; snapshots are ZFS snapshots.** The VM API exposes no
  memory-state save, so a restore is stop, `zfs rollback`, start, boot. See
  **E1**.
- **The guest is 6GB, 4 vCPU, a 10GB OS disk and ten 10GB sparse data disks.**
  8GB crashed the interim host twice. The 4GB the first draft treated as
  confirmed (**Q6**) was never tried.
- **Networking is `hostfwd` NAT by default.** Only guest ports 80 and 443 are
  forwarded to the host, so the suite reaches `localhost:<port>` and nothing
  reaches SSH. `tn_guest.py` also offers `--network bridge`, which gives the
  guest a routable DHCP address. **E8** depends on that.
- **The browser runs in Playwright's container on the host** with host
  networking. The host has a read-only root and no apt, so nothing browser-
  shaped is installed on it.
- **One VM per run is affordable on the interim box.** More is unquantified
  (**Q5**); the box that was assumed in **E13** is not the box that exists.
- AD, LDAP, S3 and KMIP **exist in the lab and can be shared** (**Q3**,
  answered 2026-08-10) — which makes **E9**'s per-run identity work *required*
  rather than conditional.
- **HA failover is in scope** — later, but definitely.
- **CI is GitHub Actions on a self-hosted runner**, running. See **E12** and
  `05-ci.md`.

### 0.3 The budget this all has to fit inside

**R8.1** sets ≤45 minutes for the v1 suite. That is 2,700 seconds, and it is the
number every decision here is ultimately spending. It is worth stating plainly
because the arithmetic is unforgiving:

> At the measured ~210-second install and a ~90-second test, an appliance
> reinstalled per test completes **nine tests** in the entire budget, with
> **70% of wall-clock spent in the installer**.

Nine — and that is the shard's *whole* budget, before any Local or Contained
test has run. It is the reason **E1** restores by snapshot rollback rather than
by reinstalling, and the single number most likely to decide whether this suite
scales.

(The 90-second test is a placeholder. The measured figures are ~20s per journey
and ~90s for the whole four-test suite today; Global tests will be slower, but
by how much is **Q1**. The conclusion survives any plausible value, because the
210s dominates either way.)

---

## E1. Restore is a snapshot rollback of the deployment

Roll the appliance back to a ZFS snapshot of its deployment dataset. Reinstall
only to *build* a baseline, not to return to one.

| Primitive | Cost | Restores | Used for |
|---|---|---|---|
| API cleanup — delete what you created | seconds | Objects the test created | Local, Contained |
| `zfs rollback` of the deployment dataset, then boot | boot-dominated, unmeasured (**Q0b**) | Everything: config DB, system dataset, pools, on-disk state | Global, Infrastructural |
| Full ISO install via `tn_guest.py` | ~210s (**Q0a**, measured) | Everything, plus installer coverage | Building a baseline; periodic fidelity run |

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
- **ZFS rollback *inside the guest*** is per-dataset. It cannot resurrect a
  destroyed dataset, so any test touching dataset lifecycle defeats it, and it
  does not address the configuration database at all.

A snapshot *of the guest's disks, taken from the host*, has none of these
problems precisely because it is *not* state-aware: it captures every block the
guest has, so where TrueNAS keeps a given piece of state stops mattering.

**Why the original rejection was wrong.** It compared a one-off saving against
the fidelity of exercising the installer. But installer coverage is bought by
the **first** provision of a run — paying 210s again on restore #40 buys
nothing — while the install cost repeats every time. Once restores are frequent,
the comparison inverts. The periodic fidelity run in row 3 preserves the
coverage that mattered.

### Mechanics on a TrueNAS host

**A deployment is one dataset, and that is what makes atomicity free.**
`tn_guest.py` puts every zvol of a VM — the OS disk and all data disks — under
`<pool>/test-vms/<name>`. A recursive `zfs snapshot` of that dataset captures
all of them at one instant, with the VM stopped. Snapshotting volumes
individually would let a restore assemble a set of disks that never coexisted,
which is an unimportable or subtly corrupt pool. The rule is *snapshot the
deployment, never the volumes*, and the dataset layout enforces it.

**The restore cycle is stop, rollback, start, boot.** `vm.stop` (or
`vm.poweroff`), `zfs rollback -r` to the baseline snapshot, `vm.start`, then
wait for the middleware API to answer. Every step is either the host's own API
or a `zfs` command on the host, and the runner is on the host, so there is no
remote channel and no credential beyond the one the pipeline already holds.

**There is no memory-state row.** libvirt sits under TrueNAS's VM service and
could `virsh save` a running guest, but driving `virsh` behind middleware's back
is two owners for one domain — the same argument the first draft made against
snapshotting `ixnode`'s domains, and it applies equally here. So the restore
always includes a boot, and **Q0b** is the duration of that whole cycle. The
first draft's single-digit-second revert is not on offer; its "disk-only
fallback" is the primary.

**Boot is the cost, so boot is what to measure and shave.** An install-to-API
of ~210s is dominated by the installer, not the boot; a rollback-to-API has
only the boot in it. Guest RAM, vCPU count and disk count all feed boot time,
which is why they are infrastructure parameters rather than details.

### What a snapshot still does not fix

**Restore invalidates the suite's session, and nothing re-mints it.** The
`setup` project writes `e2e/.auth/storage-state.json` once per run and the
`authenticated` project consumes it (`playwright.config.ts`); it holds a live
middleware token. A rebooted guest has no memory of that session, so the
WebSocket is dead and the token is gone. The harness needs per-appliance
re-authentication after restore — which pulls **E10**'s "the harness must be
able to expect disconnection" out of the HA future and onto the critical path
now.

**Clock is fine, ports are not.** A guest that booted has a correct clock, so
the resume-time skew the first draft worried about does not arise. What does
arise under `hostfwd`: the forwarded port pair belongs to the deployment name,
so a restored deployment keeps its address — but a *new* deployment on the same
host gets a different one, and nothing in the suite may assume the address is
stable across claims.

**State outside the appliance is untouched** — a domain machine account, an S3
bucket, a KMIP key (**E9**). No local snapshot reaches it.

**Rejected: accepting reinstall as the restore primitive.** It is the honest
fallback if the substrate disappoints, but at the measured ~20s test it demands
12 appliances per shard (**E2**) where a rollback-and-boot demands perhaps 5 or
6. That is a lab-capacity difference, not a tuning difference.

---

## E2. Size the appliance pool from the restore cost

How many appliances a shard needs is a function of how long a restore takes
relative to a test. Get the restore cheap enough and the question shrinks.

**Why this decision exists at all.** With reinstall as the restore primitive,
this section was about pipelining — warming the next appliance while the
current one ran tests, to hide a 210-second install. A rollback-and-boot does
not dissolve that problem the way a memory-state revert would have; it roughly
halves it. Pipelining is still the shape.

**The formula.** If restores are overlapped with tests, a shard's steady-state
throughput is `max(restore, test)`, so reaching test-speed requires:

> **appliances per shard = 1 + ⌈restore ÷ test⌉**

Figures below use the **measured** ~20s journey duration (`status.md`) rather
than a guess. Global tests will be slower — by how much is **Q1** — and slower
tests need *fewer* appliances, so these are pessimistic, which is the right
direction for a budget ask.

| Restore primitive | Restore cost | Appliances per shard at a 20s test |
|---|---|---|
| Rollback + boot, 6GB guest | ~60–90s, **unmeasured (Q0b)** | **4–6** |
| Full ISO reinstall | ~210s (**Q0a**, measured) | **12** |

Derivation, so the numbers can be checked rather than trusted: an appliance's
full cycle is `test + restore`, so N appliances deliver one test every
`(test + restore) / N`; requiring that to be ≤ `test` gives
`N ≥ 1 + restore ÷ test`.

**The counter-intuitive part, stated so nobody rediscovers it in month three:
faster tests need *more* appliances, not fewer.** The ratio is
restore-over-test, so speeding tests up raises the appliance count unless
restore speeds up with them.

**The honest alternative is to not chase test-speed.** A single appliance that
restores in place between Global tests runs them at `test + restore` each —
about 100s per Global test at the guessed numbers, or ~25 of them in the whole
budget with nothing else. That is a real option on the interim host, and it
may be the right one until **Q1** says how many Global tests there are.

**This is a ceiling for the Global tier alone.** R8.1's 2,700s covers the whole
v1 suite; Local, Contained and Infrastructural tests draw on the same per-shard
wall clock. "~30 per shard" assumes a shard containing nothing else, which no
real shard will be.

**Rejected: accepting restore on the critical path as the permanent design.**
It caps the Global tier at low double digits per shard while **E4** explicitly
expects that tier to grow, and it spends most of the budget on a boot whose
coverage value is nil.

---

## E3. Scale by sharding across appliances, not workers

Concurrency comes from N appliances each executing a disjoint slice serially. It
never comes from raising Playwright's `workers`.

**Why.** `playwright.config.ts` pins `workers: 1` because pools, services
and system settings are global to an appliance — two workers against one box
interfere by construction (**R3.4**). That reasoning does not change; the unit
of parallelism just has to be the appliance. This is **D2**
(D2 in `status.md`), promoted from deferred to load-bearing.

**Blocked on Q5.** §0.2 records one VM per run as affordable on the interim
host. **E2** needs `1 + ⌈restore ÷ test⌉` per shard — between 4 and 12
depending on the primitive and on numbers nobody has measured. Shard count is
therefore a *derived* quantity, not the thing to ask for: the budget question is
total concurrent appliances. Until that is answered, this is a shape, not a plan.

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
| **Global** | Pool topology, service enable/disable, network, encryption, anything reached over SSH | Rollback to the test's baseline |
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

## E5. Baselines are snapshots, and we take them

A baseline is a named appliance condition — `fresh-install`, `single-pool`,
`pool-and-ad-joined` — captured as a **ZFS snapshot of a deployment dataset**.
A test names the baseline it needs; restoring is a rollback (**E1**).

**Why snapshots rather than recipes.** A recipe has to be re-run; a snapshot is
returned to. This is what makes the Global tier affordable, and it is the thing
`config.upload` was reaching for and failing at — a snapshot captures the
configuration database, the system dataset and the pools together, so the
distributed-state problem in **E1** never arises.

**Ownership is not a question any more.** The first draft spent this section
on how to ask the `ixnode` team for snapshot and revert verbs, because `ixnode`
owned the libvirt domains and a second owner would break things. There is no
`ixnode` in the pipeline. The deployment is a dataset the pipeline created
through the host's API, and `zfs snapshot` and `zfs rollback` on it are ours to
run. `tn_guest.py` already provides the one thing that was expensive to
reimplement — the unattended install with the **R2.8** boot-state contract —
so the "option 3" the first draft priced as a fallback is simply the plan, at
a fraction of its stated cost.

**How a baseline is built.** `tn_guest.py create` produces a clean install.
Our own script drives it to the baseline state over the API the suite already
uses — create a pool, join a domain — then the VM is stopped and the deployment
dataset snapshotted under the baseline's name. Baseline *content* is defined
here, in this repository; nothing outside it needs to know what
`pool-and-ad-joined` means, and adding a baseline is a script change.

**Clones make a baseline a template, not just a restore point.** A ZFS
snapshot can be cloned, and a clone of the baseline's zvols attached to a new
VM is a new appliance at that baseline without an install: seconds of `zfs
clone` and a boot. This is how the per-run install in the current pipeline goes
away, and it is the same shape as the `<pool>/ci/golden` layout the
api-ci-testbed setup notes already reserve for pre-installed images. It also
answers **E2**'s "warm spare" cheaply: spares are clones.

**Baselines age with the nightly.** A baseline built from one ISO is that
build. Rebuild them when the nightly moves — on a schedule, not per run — so
the install cost is paid once per image rather than once per test. The
periodic reinstall is also **E1**'s installer-fidelity run.

**Baselines must specify a disk profile.** The mismatch that motivated this —
**R2.2** said 8 virtual disks while `fresh-install.e2e.ts` builds a 9-wide
RAIDZ2 and calls `requireUnusedDisks(api, 9)` — was met in CI exactly as
predicted, as a fail-fast on a one-disk guest, and is closed: `appliance.sh`
provisions ten identical 10GB data disks with distinct serials. The lesson
stands: disk inventory is part of a baseline's definition, not an assumption.

---

## E6. The environment contract

Orchestration hands the suite a **descriptor**. It states:

- the appliance **topology** — nodes with roles, and a VIP where one exists
  (**E10**)
- credentials
- which **baseline** the appliance was built to
- which **capabilities** are present — `ad`, `ldap`, `kmip`, `s3`, `ha`, `ssh`, …
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
once. This extends something that exists and works. Today the pipeline hands
over the pre-descriptor form of this: `TN_HOST`, credentials, `TN_BASELINE`
and `TN_DOMAIN` as environment variables (`e2e/ci/appliance.sh`).

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

**Where they run.** The host already runs Docker for the browser (**E12**), so
these are further containers on the same host. Under `hostfwd` the guest can
reach them only outbound, through NAT, which is the direction it needs.

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

**It is a capability, not a given.** The pipeline's default guest is behind
`hostfwd` NAT with only 80 and 443 forwarded, so SSH does not exist there.
Reaching it needs either `--network bridge` (a routable guest address, which
`tn_guest.py` supports and which is also what HA needs, **E10**) or an extra
forwarded port. Either way it is something the environment declares (**E6**,
`ssh`), and a test that needs it skips or fails according to the manifest —
this is exactly the case the capability model exists for.

**Why named helpers.** Two independent reasons, either sufficient:

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
(**Q3**), because the answer decides whether sharing is viable at all. The
pipeline already names each deployment after its run and attempt
(`e2e-<run>-<attempt>`), which is the identity to derive the rest from.

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
something an individual test can arrange. **E1**'s restore needs the same
capability, which is why it is on the critical path now.

Failover is the extreme of Global: a controller pair per test, and a real
failover to recover from.

**The provisioner already knows the shape.** `tn_guest.py --ha` builds a
controller pair with a private heartbeat bridge and iSCSI-shared data disks. It
requires bridge networking, which is one more reason **E8**'s bridge mode is
the eventual default rather than an exception.

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

## E12. CI: GitHub Actions on a self-hosted runner on the host

Implemented; `05-ci.md` is the operational record. What this section keeps is
the reasoning, and what the build settled.

**The runner is the TrueNAS host.** Every provisioning call is then the host's
own API over localhost or a `zfs` command, with no remote hypervisor channel,
no credential plumbing, and no network hop on the restore path. The browser
runs in Playwright's container on the same host with host networking, so it
reaches the guest exactly as the host does. The host itself installs nothing
browser-shaped — it has a read-only root — which is what makes this
arrangement possible on an appliance at all.

**Sharding is native.** Playwright accepts `--shard=i/n`, and a matrix job maps
onto it directly: each leg claims one appliance, so **E2**'s appliance count
*is* the matrix size. No bespoke orchestration. Not yet used: one shard.

**The concurrency guard is declarative.** §0.1's problem — two runs against one
appliance destroying each other — is a `concurrency:` group. It is also how
**Q5**'s appliance budget gets enforced: cap the matrix, cap the pool. One
caveat the first draft missed: a group holds one running and one pending run,
and a third supersedes the pending one, so under load some PR runs never
happen. That is acceptable for an informational check and not for a gate
(**D1**).

**Artifacts.** JUnit XML leaves the runner on every run, and traces, video and
screenshots (**R7.1**) for failed tests. Publishing a trace is safe only
because the credential it records is per claim and the appliance it belonged
to is destroyed at release; that is the rule, and it holds here. **R7.2**'s
middleware log collection has no path under `hostfwd`; it needs an API route
or bridge mode.

**When it runs.** Nightly, and on every push to master that touches the UI or
the suite — those are the runs that test merged code, since the suite drives
the UI built from the checkout. Pull requests run it only when they change the
suite or the pipeline; any other branch opts in with `workflow_dispatch`. Not
every PR, deliberately: one runner, one appliance, and the concurrency caveat
above.

### The public-repository constraint

**`truenas/webui` is public, and self-hosted runners on public repositories are
a known attack path.** If any workflow with access to this runner can be
triggered by a pull request from a **fork**, then an arbitrary person on the
internet can execute code on a machine that sits on the lab network and holds
an API credential for the host. GitHub's own guidance is not to pair
self-hosted runners with public repositories, precisely because of this.

The gates as set:

- The `pull_request` trigger is guarded by an `if:` requiring the head
  repository to be this repository, so a fork PR queues nothing. Never use
  `pull_request_target` with a checkout of PR code, which would defeat it.
- The job runs in the `e2e-lab` environment, which holds the lab credential.
  **Required reviewers on that environment are not yet configured**; they are
  the second line, and the thing to add before **D1**.
- A pull request that only changes `e2e/docs` does not trigger a run. The
  filter is evaluated against the whole PR, so a docs commit inside a PR that
  also touches code still runs.
- The runner should be in its own network segment with no route to anything
  but the lab, and treated as compromised-by-default. Whether the interim box
  is segmented that way is not known from this repository.

---

## E13. Host sizing, and the hardware asks

Working assumption, 2026-08-10: a 64-thread AMD Epyc, 128GB RAM, 512GB SSD.
**Hardware is not yet assigned.** The pipeline runs on an interim TrueNAS VM
host that crashed under an 8GB guest, so the eventual box is still the one
to influence, and the arithmetic below is for it.

### What the assumed box supports

| Resource | Capacity | Concurrent appliances |
|---|---|---|
| RAM | 128GB, less ~10GB for the host, Docker and the browser; ~7GB per 6GB guest with qemu overhead | **~16** |
| CPU | 64 threads, 4 vCPU per guest | ~16 before oversubscription; drop to 2 vCPU and it is not the constraint |
| Disk | 512GB of zvols, thin | not the constraint at present sizes, see below |

**RAM binds first now, not disk.** The first draft's disk arithmetic was about
qcow2 overlays and 4GB memory images. There are no memory images, and zvols are
thin: a baseline snapshot costs what the install wrote (a few GB), a clone
costs nothing until the guest writes, and a run's writes are modest. Sixteen
6GB guests, on the other hand, is the whole of a 128GB box. Guest RAM is the
sizing parameter, and 6GB is worth defending against creep for exactly that
reason.

**One hazard specific to this suite.** `fillDataset` (**E8**) deliberately fills
a dataset, and on thin-provisioned zvols that is real space on the host. Several
of those concurrently is how a pool fills mid-run. **Cap the fill size inside
the helper** rather than letting each test choose — the same argument as
**E8**'s named-helper rule, applied to resource consumption.

### Ask 1: RAM before anything else

Every concurrent appliance is ~7GB resident. The box's RAM divided by that is
the shard ceiling, with nothing else to trade against it. 256GB doubles the
ceiling; nothing else on the list does.

### Ask 2: fast storage still matters, for boot

The first draft asked for NVMe because memory-image reads set the revert time.
Without memory images, storage speed shows up in the boot that every restore
now includes, and in N guests booting at once against one pool. It is worth
having; it is no longer decisive. 512GB of it is adequate at present sizes.

### Sizing recommendation

**Start at 4 shards** — 4 to 8 VMs depending on whether shards hold a warm
spare (**E2**) — once **Q0b** and **Q1** are measured and say sharding is
needed at all. On the interim host, one appliance restoring in place is the
plan. Grow when measurement justifies it, not before.

---

## Open questions

| | Question | Blocks |
|---|---|---|
| ~~**Q0a**~~ | **Answered 2026-09-02: ~3.5 minutes** from `tn_guest.py create` to a usable, credentialed API on a v27 nightly ISO; ~10 minutes on a 25.10 release ISO. See `05-ci.md` | — |
| **Q0b** | **Rollback-to-usable**: `vm.stop` + `zfs rollback` + `vm.start` + middleware ready + re-auth, on a 6GB guest on the actual host | **E1**, **E2**. The most load-bearing unmeasured number in this document — it sets the appliance count |
| **Q1** | How long does the Local tier take against one appliance, and how long is a representative Global test? | Whether tiering is needed *yet*; sets the appliance count in **E2** |
| ~~**Q2**~~ | ~~Will `ixnode` add snapshot and revert?~~ **Moot 2026-09-02:** no `ixnode`; snapshot and revert are ours (**E5**) | — |
| ~~**Q3**~~ | **Answered 2026-08-10: shared.** So per-run identity is now required work, not a contingency — see **E9** | — |
| ~~**Q4**~~ | **Answered 2026-08-10: no commitment, local stand-ins are fine.** MinIO, Samba AD DC, OpenLDAP and PyKMIP cover everything; no real-endpoint nightly needed | — |
| **Q5** | **Host capacity.** The interim box holds one guest safely. The assumed 64-thread/128GB box is *not yet assigned hardware*, so still influenceable. See **E13** | **E3**, **E2** |
| ~~**Q6**~~ | ~~qcow2, 4GB guests.~~ **Revised 2026-09-02: zvols, 6GB guests.** 8GB crashed the interim host; 4GB was never tried | — |
| ~~**Q7**~~ | **Answered: yes, the runner is on the host.** Snapshot and revert are the host's own API and `zfs`, not `virsh` | — |

---

## Sequence

Front-loaded with measurement, because most of this document assumes a scaling
problem that has not been demonstrated.

1. ~~Open the `ixnode` conversation.~~ **Overtaken.** There is nobody to ask;
   snapshot and revert are a script against the host's API (**E5**).
2. **Measure Q0b, then Q1.** By hand on the interim host: install, snapshot the
   deployment dataset, create a pool, roll back, boot, re-authenticate, and
   time it. Half a day, and it decides whether **E2**'s pool is two appliances
   or six. If the Local tier also runs 80 tests in 20 minutes on one appliance
   without tainting, tiering is premature and the right move is simply to
   write tests — do not build the architecture above on the strength of this
   document alone.
3. **Environment descriptor, capability manifest, hand-run default** (**E6**).
   Small, unblocking, and it stops the next environment type being a rewrite.
   Make the descriptor topology-shaped while in there (**E10**), and make
   `ssh` a declared capability (**E8**).
4. **Re-authentication after restore** (**E1**, **E10**). Nothing else works
   until the harness survives an appliance rebooting under it.
5. **Baselines as snapshots, and clones as provisioning** (**E5**). Build
   `fresh-install` and `single-pool` once per nightly, clone per run. This is
   what removes the 3.5-minute install from every run.
6. **Settle shared-service identity** (**Q3**) before the first AD test — no
   local snapshot restores a domain machine account. Derive it from the
   deployment name the pipeline already assigns.
7. ~~Decide runner placement and the fork-trigger policy.~~ **Done** (**E12**).
   Still to do there: required reviewers on the `e2e-lab` environment, and
   confirming the interim box's network segment.
8. **Publish traces** (**E12**). The precondition holds; flip it.

---

## Signals to re-plan

- **The Local tier taints anyway.** Then the tier model is wrong and per-test
  restore is the honest answer for everything, with a much larger appliance
  budget as the price.
- **Q0b comes back close to Q0a.** If a rollback-and-boot is nearly as slow as
  an install, the snapshot machinery is not earning its complexity — check
  guest RAM, vCPU and disk count before concluding it, since boot time is what
  is being measured.
- **Snapshots turn out not to be honest restores.** The premise of **E1** is
  that a host-side snapshot is state-agnostic. If rolled-back appliances
  misbehave in ways a freshly installed one does not, that premise is wrong and
  the whole approach needs revisiting.
- **Skipped-for-capability counts stay high** run after run. Skipping is a
  pressure valve for a busy lab, not a permanent state hiding coverage we
  believe we have.
- **The interim host keeps falling over.** Two crashes at 8GB were the reason
  for 6GB. If 6GB is not stable either, the box cannot host this and the
  hardware ask in **E13** stops being a request for later.
