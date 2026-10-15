# E2E — status and next steps

Replaces `01-requirements.md`, `02-technology.md` and `03-plan-and-status.md`.
Those were requirement and technology records written before the suite existed;
by the time it did, several of their claims described a suite that was never
built, and correcting them round after round cost more than they returned. Their
content is in git history if the reasoning behind a decision is ever wanted.

`e2e/CLAUDE.md` holds the conventions and the traps. `e2e/README.md` covers
setup and running. `05-ci.md` is the CI pipeline as built. **This file is only
status and direction — keep it that way, and keep it short.**

**The suite's test total is not recorded here.** It reads like status but is a
derived value: every PR that added a test rewrote the same sentence, and branches
in flight together conflicted over it. The count lives in
`<testsuites tests="N">` in the `e2e-junit-<shard>` artifacts of an unfiltered
E2E run, summed across shards — cite the run id when a number is wanted. A PR adding tests touches only its own feature's
paragraph here, or nothing.

---

## Where we are

Running on **`@truenas/api-client` 5.x**, which types the full generated API
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

Three tests were **green on the 3.x client against a freshly installed v27
nightly, in CI, 2026-09-02** — the first real run after the client move, and it
passed first time once the appliance was right. The later move to 5.x (2026-09-08)
changed nothing the suite calls; it was proven by the same runs that proved S3.

S3 followed (2026-09-07/08), in `tests/s3*.e2e.ts`: creating a bucket with
object lock from the Shares dashboard and minting an access key under
Credentials (`s3.e2e.ts`, green in CI from run 34257876916: no retries, once the
harness signed each test in with its own token — see the `page` fixture); then
the service on a TLS listener (`s3-service`), grants to a real user and group,
the row toggle and delete (`s3-bucket-management`), and rotating and deleting a
key (`s3-access-key-management`). They need a pool (any, or they build a
one-disk one through the worker-scoped `pool` fixture, exported when the worker
ends) and the S3 service. The S3 work also
moved the suite to `@truenas/api-client` 5.0, the first release whose v27
directory carries `sharing.s3.*` and `s3.accesskey.*`, and pulled the shared
pieces out: `fixtures/services.ts` (one service-stop protocol for SMB and S3)
and `support/cleanup.ts` (the run-every-step teardown).

Sign-in came next, in `tests/unauthenticated/signin.e2e.ts`: the refusals and
warnings the front door had no coverage of. Two of them are the authorization
half rather than the authentication one, and both were probed against a v27
appliance rather than reasoned about — an account with no privilege is refused
by middleware (`DENIED`), while an account holding a privilege that grants no UI
access is *authenticated* (`SUCCESS`, `webui_access: false`) and refused by the
app alone. The suite grew a page-scoped dismissal for the development build's
concurrency dialog at the same time; it is modal, the dashboard's own startup
raises it, and without that it blocked every interaction after sign-in.

Users followed, in `tests/users-form.e2e.ts` and `tests/users-deletion.e2e.ts`:
the add-user form's conditional role control and its two refusals, and deleting
a user — the row it was told to, and both branches of the primary-group
checkbox. Every saved or deleted account is checked through `user.query` rather
than the list, which is what separates "the screen believed it" from "the
appliance did it". Writing them turned up a real gap: the duplicate-username
validator was wired only on the edit form, so a new user learned the name was
taken only after submitting. Fixed in the same change.

Groups came after, in `tests/groups-form.e2e.ts`, `tests/groups-members.e2e.ts`
and `tests/groups-deletion.e2e.ts`. Two of those cover the same ground the user
specs do — a form with a conditional field and a list that deletes the row you
opened — and the third covers the thing groups have that users do not:
membership, which lives on a route of its own and which the *list* reads back to
decide whether Delete is offered at all. Editing one screen changing what another
will permit is the only cross-screen rule on these pages, and nothing below E2E
can see it. Two smaller notes came out of writing them: the group form's
`Allow All Sudo Commands` checkbox is not an API field, so what it stores
(`sudo_commands: ['ALL']`) is only observable through `group.query`; and
`group.users` holds *auxiliary* members, not only the accounts whose primary
group it is — confirmed against a v27 appliance, and the reason a group with any
member at all cannot be deleted from the list.

The members picker had no per-record test id, so no test could name one user
among the hundreds a stock appliance lists. Added in the same change
(`list-item-available-<name>` / `list-item-selected-<name>`). It is built from
each record's displayed name, because the picker's own key is a numeric id the
appliance allocates and no test can know in advance — which makes the id exactly
as unique as the displayed name is. Usernames qualify. The control's only other
consumer, the iSCSI initiator form, does *not*: it displays
`<initiator> (<address>)`, so an id there would carry a client IP that moves.
Addressing that picker needs a discriminator of its own first.

Preferences came next, in `tests/preferences.e2e.ts` and one spec under
`tests/unauthenticated/`. It is the only area covered so far whose defining claim
is unreachable below this layer: a unit test can prove the reducer built a new
object and the effect called `auth.set_attribute`, but only a browser against an
appliance can say the value came back. So each test asserts twice — the screen
re-rendered, *and* `auth.me` holds it — and the session spec signs out, clears
both `localStorage` and `sessionStorage` (the theme is cached in each, under
webui's key and the library's) and signs back in, which is the only way to ask
the question the feature actually answers.

Its setup and teardown are unlike anything else here and are worth reading before
copying: preferences are a blob hanging off the account the whole suite signs in
as, so there is nothing to delete and a per-field undo is not enough.
`fixtures/preferences.ts` therefore *establishes* a known baseline before each
test and hands back exactly what `afterEach` must write. It does not snapshot
and restore what it found — that would make every test's precondition "whatever
the appliance happened to be set to", and a run interrupted between a change and
its restore would leave the next one measuring from somewhere nobody chose. One
subtlety it turns on: an absent `preferences` attribute is not an empty one, and
writing `{}` over an account that had none leaves the app with no `lifetime`, no
`language` and no `sidenavStatus`. Two facts found while writing it: the applied
theme is a class on `<html>` under the
*library's* name (`ix-dark` is stored, `tn-dark` renders — the map lives in
`theme.service.ts`), while `<body>` carries a static `ix-dark` from
`src/index.html` that nothing ever updates, so a test asserting on the body class
would pass against any theme at all.

Dataset deletion came next, in `tests/datasets-deletion.e2e.ts`, and it is here
for a reason the other specs are not: it covers a bug that *shipped to
nightlies*. The delete-dataset dialog gates on the dataset's name typed back and
a Confirm tick, and disables its button until it has both — but the tn-dialog
migration moved the dialog's actions outside `<form>`, and `tn-button` renders
`type="button"`, so the form was left with one text input and no submit button
at all. That is exactly the shape the HTML spec submits when Enter is pressed in
a text field, and the handler did not re-check validity. Enter in the name field
destroyed the dataset with both gates untouched.

Nothing below E2E could see it, and that is the point of the spec. The unit
tests asserted the confirm button was disabled and it genuinely was; the browser
submitted the form regardless. Only a real browser driving a real dialog can ask
whether the *keyboard* can reach a destructive call, so the claims are about
Enter rather than about the button, and each is settled through
`pool.dataset.query` — a dialog left open is not evidence the dataset survived.
The fifth test is the counterweight: a guard that swallowed Enter unconditionally
would satisfy the other four and quietly break deletion for anyone not reaching
for the mouse.

Writing it turned up a `data-test` collision. The dialog's confirm button
declared `testId="delete-dataset"`, the same value the details card behind it
emits, so with the dialog open `[data-test="button-delete-dataset"]` matched two
elements. Renamed to `dialog-delete-dataset`, following the convention webui's
shared confirm dialog already uses (`button-dialog-confirm`). The generic
dataset fixtures moved to `fixtures/storage.ts` at the same time — they had been
sitting in `fixtures/s3.ts`, which is not their home and is not where anyone
would look for them.

Pool disconnect followed immediately, in `tests/pool-disconnect.e2e.ts`, because
it is the same defect somewhere far more expensive: "Delete Pool" plus the
destroy tick runs `pool.export` with `destroy: true`, which wipes every member
disk with no undo — and `startExportDisconnectJob()` had no validity check of
any kind, not even the dataset dialog's reliance on a disabled button.

Two things about it are worth copying and one is worth not repeating. It builds
**its own pool** rather than using the worker-scoped `pool` fixture: a spec whose
subject is destroying a pool would otherwise take the rest of the worker's run
with it the moment it regressed, surfacing as a dozen unrelated specs failing.
`ensurePoolPresent` in `fixtures/pool.ts` is the extraction that made that cheap
— `providePool` had the only API pool-builder in the suite, hardcoded to
`e2e_shared_tank`, and both now share `buildStripePool`.

The thing not to repeat: the first version of its negative assertion **passed
against the broken build**. The delete-dataset dialog closes when it submits, so
"the dialog is still usable" is a sound tell there; this one hands off to a job
dialog and closes later, so the same reasoning proved nothing while looking
identical. The readback had to become the dashboard — dismiss, navigate back,
and require the pool's own card — which is a full round trip and cannot resolve
before the app has sent what the keypress queued. Any negative assertion in this
suite should be checked by running it against a build with the bug still in;
both of these were, and the second one is the reason to insist on it.

That work also hardened both `ensurePoolAbsent` and `ensureDatasetAbsent`: a
journey that drives a deletion through the UI has one in flight when teardown
runs, so the row can go between the query and the delete, and middleware answers
with `[ENOENT]`. Both now re-ask whether the thing is gone rather than matching
on the message, and only then let the failure pass.

Three sibling dialogs remain uncovered here: app delete, SED reset and VM device
delete. All are guarded in the same change with Jest regression tests, but an
appliance-level journey needs an installed app, SED hardware and a VM
respectively.

The groups built-ins toggle turns out to be one of these — account state wearing
the clothes of view state — which is also the "page one" gap below. The
preferences spec met that gap head-on: `builtin_administrators` is 79th of 93
groups by GID, so with a 50-row page it is not in the DOM at all.

ZFS tiering came next, in `tests/tiering-config.e2e.ts` and
`tests/tiering-dataset.e2e.ts`: turning tiering on and editing its limits from
the Tiering panel on the storage dashboard, and moving a dataset to the
performance tier from its details card, with and without migrating its data.
Both skip on an appliance without the `ZFSTIER` key, because `zfs.tier.update`
refuses there, so for now they run only where someone has uploaded a licence.
The dataset spec builds its own pool (`e2e_tier_tank`, one data and one special
disk), because a dataset has no tier at all on a pool without a special vdev,
and it removes that pool in `afterAll`.

Writing it turned up a middleware defect: a rewrite job is keyed by dataset
*name* and never forgotten. A dataset created under a name that was migrated
before (deleted since, even on a pool destroyed and rebuilt since) comes back
`REGULAR` while carrying the old job, `COMPLETE`, so the UI shows a finished
migration on a dataset that never had one. The spec names its datasets per run
to stay clear of it. Running it also exposed a second: the tiering daemon
(`truenas_zfstierd`) is restarted by every `zfs.tier.update` and by every pool
create or export (each moves the system dataset), and enough of that trips
systemd's start limit. The daemon then stays down, and every migration fails with
`[Errno 2] No such file or directory` while the tier change still goes through.
So the dataset spec builds its pool and turns tiering on once per file, and
`establishTierBaseline` skips writes that change nothing. And one UI bug: the
Datasets page reloaded once after Apply and could miss the migration it had just
started. It now refreshes in the background when a tier job starts or changes
status. The readout ids the dataset spec asserts on (`text-tier` and the
dialogs' values) arrived in NAS-143970 on 2026-09-25, so a `shipped` run needs
a nightly built after that.

SMB shares came next, in `tests/smb-form.e2e.ts`, `tests/smb-list.e2e.ts`,
`tests/smb-dataset-preset.e2e.ts` and `tests/smb-service.e2e.ts` — the first
area since S3 with a conditional surface big enough to be the point. A share's
purpose selects a preset and `presetEnabledFields` decides from it which options
exist at all, so one panel is seven different forms; `smb-form` pins the swap in
both directions and the External Share case, where the path control is replaced
by a remote-path list and the appliance stores the sentinel `EXTERNAL`. Both
name refusals go through `sharing.smb.share_precheck`, so they are a round trip
to middleware rather than a lookup in a cached list. They are asserted on the
message under the field, not on Save being disabled, which is also true while
the check is still pending; doing so found the invalid-characters branch showing
middleware's raw `[EINVAL] …` text, because the validator matched its sentence
by case and middleware had lowered it. `smb-list` deletes and
edits a share from its row menu, each beside a second share that must come
through untouched. `smb-dataset-preset` covers a rule that spans two features:
a dataset created with the SMB preset publishes a share, and the form then
offers to start the service — which it does not do for a preset that makes no
share (Generic is the control; Multiprotocol and a running service are not
exercised). `smb-service` covers what lives on the
service rather than the share: the Apple-extensions gate a Time Machine share
is held behind (the write, `smb.update`, outlives the share, so the spec puts
it back), a row's Enabled switch, and the card's own start/stop switch.

Four things in this area are not what the template implies, and were read off
a running appliance: row actions collapse into a kebab menu whose items carry the
icon *with its library* (`…-more-action-mdi-delete-row-action`); the card's row
tag uses the library normalizer while the cells inside the same row use lodash;
`Legacy Share` is filtered out of the purpose picker for new shares; and the
"Configure ACL" prompt depends on `filesystem.stat(path).acl` rather than on the
purpose, which is why these specs never see it and `fresh-install` always does.

NFS shares followed, in `tests/nfs-form.e2e.ts`, `tests/nfs-list.e2e.ts` and
`tests/nfs-service.e2e.ts`, on the same plan as SMB with one difference that
runs through all of it: an NFS share has no name. Its path is its identity, and
the card folds the description in as well, so a row's ids are
`…-<path>-<description>` and **editing the description renames every id on the
row**. `nfs-form` publishes a share and holds the untouched access defaults to
what the appliance stored, then narrows them — read-only, one network, one
host — and asserts those through `sharing.nfs.query`, since none of it is on
the card. Its two refusals (a pool's root dataset, a network that is not an
address) are asserted on the message as well as on Save, which took ids the
form did not have: the first network and the first host both resolved to
`input-0`, the control name of a form array's first member, and neither field
nor the path had an id for its error text. They are now `input-network-<i>`,
`input-host-<i>`, `form-field-network-<i>` and `text-path-errors` — the last
from `ix-explorer`, so every explorer that renders its own errors has it —
and `button-remove-from-list` went the same way (`button-remove-network-<i>`,
`button-remove-host-<i>`).
`nfs-list` unshares and edits from the row menu beside a second share, on two
datasets rather than one. `nfs-service` covers the service from its three
entry points: accepting the start offer after a save (which also enables it at
boot, the dialog's toggle being on), the card's switch (which does not), and a
row's Enabled switch (which leaves the service alone). `nfs-access` covers
the rest of the Access section: a maproot user and group, a mapall user and
group (one test each, since middleware refuses both users on one share), and
the Security select, which the form renders only while `nfs.config` lists
NFSv4 — so one test turns NFSv4 on from the card's Config Service and saves a
Kerberos flavour, which middleware refuses without it, and one holds the
select absent with NFSv4 off. The service form's Enabled Protocols select got
an explicit `testId="protocols"` for this; the emitted id is unchanged.

Two things here were read off a running appliance rather than the template.
The path field hands its value to the form when it loses focus, so a path that
is typed and not left is on screen while Save still answers for the old one —
`fillNfsSharePath` blurs for that reason. And a host is resolved by middleware
before it is saved, so a hostname that does not resolve is refused, and the
refusal arrives as an error dialog rather than under the field.

Manual snapshots came next, in `tests/snapshot-create.e2e.ts`,
`tests/snapshot-list.e2e.ts` and `tests/snapshot-rollback.e2e.ts`, all reached
the way a user reaches them: a dataset in the tree, then its Data Protection
card. `snapshot-create` takes one from the card's form — which arrives with the
dataset chosen and a name generated — and holds Recursive to its word on a
child dataset, in both directions. `snapshot-list` deletes, holds and clones
from the expanded row beside a second snapshot that must come through
untouched; a hold is invisible everywhere else in the UI, and a clone is only
known to be *of that snapshot* by the new dataset's `origin` — after which
the row no longer offers Delete. `snapshot-rollback`
is about a dataset's contents, so it makes a directory after the snapshot
(`filesystem.mkdir`) and asks whether it survived: properties and child
datasets outlive a rollback and cannot show one. It then pins the safety check
as a pair — refused while a newer snapshot exists, with nothing changed, and
carried out with "No Safety Check", which destroys that snapshot.

Writing it found that **no snapshot row was addressable**: the list built its
row tag from `snapshot.id`, and its query selects only `snapshot_name`,
`dataset` and `name`, so every row and every cell resolved to the same
`row-snapshot` / `text-…-snapshot-row-text`. The Jest spec passed because its
fixtures carry an `id` the real rows do not. The tag is built from `name` now,
which is the value the legacy row carried.

Init/shutdown scripts came next, in `tests/init-shutdown-scripts.e2e.ts`: adding,
editing and deleting a command script from the card on System > Advanced
Settings, each asserted on the card and through `initshutdownscript.query`, and
edit and delete each beside a second script that must come through untouched.
Two things about the card shape the spec. Its row tag is
`card-init-shutdown-<command>-<when>`, so editing either renames every id on the
row and the spec looks it up again under the new values. And every form on
Advanced Settings is preceded, once per page load, by a first-time warning held
in memory by `FirstTimeWarningService` — certain on the fresh page each test
gets, which is why the flows wait for it rather than probe. Script-type entries,
which pick a file through `ix-explorer`, are not covered.

API keys came next, in `tests/api-keys.e2e.ts`: creating a key for a user and
deleting one, from the API Keys page under Credentials > Users, each beside a
second key on the same account that must come through untouched. The page has no
sidebar entry, so the spec reaches it the way an admin does — the user's Access
card, whose "View API Keys" link exists only once that user holds a key, which is
the second reason the bystander is there. The create picks the account in the
form, which opens on the signed-in admin, and ties the key the one-time dialog
showed to the stored record by its `<id>-` prefix. Editing, resetting and an
expiry date are not covered.

Cron jobs came next, in `tests/cron-jobs.e2e.ts`: adding, editing, running and
deleting a job from the card on System > Advanced Settings, each beside a second
job that must come through untouched. It sits on the same card shape as
init/shutdown scripts, and the first-time warning both cards raise now lives in
`flows/advanced-settings.ts`. Its row tag is `card-cron-<command>-<user>`, so
editing the command renames the row. "Run job" is the one action with no record
to read back: it starts a `cronjob.run` job, so the spec waits for a new one for
that job's id in `core.get_jobs` to reach `SUCCESS`, and checks that none started
for the bystander. Custom schedules, built in the scheduler's own dialog, are not
covered.

Sysctl variables came next, in `tests/sysctl-tunables.e2e.ts`: adding, editing
and deleting one from the Tunable card on System > Advanced Settings, each
asserted on the card and through `tunable.query`, and edit and delete each beside
a second tunable that must come through untouched. Unlike the two cards before
it, its form is built by `ix-form-renderer`, and every write is a job, so the
fixtures go through `runJob`. A sysctl tunable sets the kernel variable when it
is saved, so the spec moves three TCP keepalive and timeout settings a step or
two below their defaults; deleting or disabling a tunable puts the old value
back. The row tag is `tunable-<var>`, and Variable is disabled on edit, so an
edit never renames the row. UDEV and ZFS tunables are not covered.

SSH keypairs came next, in `tests/ssh-keypairs.e2e.ts`: generating one with the
form's Generate Keypair button and deleting one, from the SSH Keypairs card on
Credentials > Backup Credentials. The generate test reads the pair the form
filled in and requires `keychaincredential.query` to hold that same pair, so a
save that dropped or regenerated the keys fails. The delete runs beside a second
keypair that must come through untouched. The card lists five keypairs, oldest
first, before View All. The delete test presses it when there are more. The
generate test cannot, because the card reloads after the save with nothing to
wait on, so it fails at the start if the new keypair would not fit on the card.
Pasting a key in, editing, downloading and deleting a keypair an SSH connection
still uses are not covered.

Periodic snapshot tasks came next, in `tests/periodic-snapshot-tasks.e2e.ts`:
adding, editing and deleting a task from the card on Data Protection, each
asserted on the card and through `pool.snapshottask.query`, which holds the
retention, naming schema and schedule the card does not show. Edit and delete
each run beside a second task that must come through untouched. A task has no
name, so the row tag is `snapshot-task-<dataset>`, and each task gets a dataset
of its own, made fresh per test so no snapshot an earlier run's task took can
put the "keep snapshots" box in the delete dialog. The card lists four tasks,
and its View All leaves for the full list rather than expanding, so each test
fails at the start if its rows would not fit. Two more tests watch a task run.
Nothing in the UI runs one on demand, so each is scheduled every minute: one
requires every snapshot on its fresh dataset to match its naming schema and the
dataset's snapshot list to show one, and the other switches a task off with
the card's Enabled switch and requires it to take nothing after the tick already
under way, using a second task left on the same schedule as the clock. Two more
delete a task that has a snapshot, seeded over the API with a name the task's
schema and schedule claim, and the "keep snapshots" box ticked or not. With it
ticked, `pool.snapshot.query`'s `retention` must move from the task to a
`property` on the snapshot with the same date, and a manual snapshot beside it
must get none. With it unticked, the snapshot stays and has no removal date.
Custom schedules and exclusions are not covered. The full list page is
`tests/snapshot-task-list.e2e.ts`'s, below.

The dataset form came next, in `tests/datasets-form.e2e.ts`: creating a dataset
under a pool and editing one, both through Other Options, the form's advanced
half. Each save is checked in the tree or on the details card and through
`pool.dataset.query`. There every field is a ZFS property whose `source` reads
`LOCAL` only if the form actually sent it, so the spec also asserts that
fields it left alone stayed inherited. The edit runs beside a sibling dataset
that must come through untouched. The share presets other than Generic, quotas,
encryption and zvols are not covered here; `smb-dataset-preset` covers the SMB
preset.

NTP servers came next, in `tests/ntp-servers.e2e.ts`: adding, editing and
deleting a server from the card on System > Advanced Settings, each asserted on
the card and through `system.ntpserver.query`, and edit and delete each beside a
second server that must come through untouched. Middleware queries a server
before saving it and refuses one that does not answer unless Force is ticked, so
every address is in 192.0.2.0/24, reserved for documentation and reachable from
nowhere, and every save ticks Force. That keeps the outcome independent of
whether the appliance can reach the internet. The row tag is
`ntp-server-<address>-<minpoll>-<maxpoll>`, so an edit to either interval
renames the row. Unlike most cards on that page, this one raises no
first-time warning. The refusal without Force is not covered.

Syslog settings came next, in `tests/syslog-settings.e2e.ts`: one test sets
every field on the Syslog card's form, starting from the defaults, and the other
starts from everything set and undoes it, removing the server. Each is asserted
on the card's readouts and through `system.advanced.config`. The settings are
one config record rather than a list, so there is nothing to delete; like the
preferences spec, each test starts from a fixed baseline, middleware's defaults,
and teardown writes it back. The servers are a form array whose Host and
Transport carry no index in their ids, so the specs never put two servers in
the form, and the two-server limit and the TLS certificate are not covered.

Audit settings came next, in `tests/audit-settings.e2e.ts`, on the same plan as
syslog: one test changes all five fields from the defaults and sets a reservation
and a quota on the audit dataset, and the other starts with both set and clears
them, which the card shows as `None`. Each is asserted on the card's readouts
and through `audit.config`, and teardown writes middleware's defaults back. The
form is built by `ix-form-renderer`, so its ids are the field names. The form's
refusals (the range on each field, and Quota Fill Critical not above Quota Fill
Warning) are not covered.

Console settings came next, in `tests/console-settings.e2e.ts`, on the same plan:
one test starts from the defaults, turns the serial console on at a new speed,
hides the text console behind a password and changes the banner, and the other
undoes all of it and empties the banner. Each is asserted on the card's readouts
and through `system.advanced.config`, and teardown writes middleware's defaults
back. The serial port is never changed, because which ports exist depends on
the machine; the specs keep `ttyS0`, the port the CI appliance's console is read
from.

The Access card's session timeout came next, in `tests/access-settings.e2e.ts`.
The card only shows the timeout. It is the account's own `lifetime` preference,
and the card's "Preferences" link opens the Preferences form, which edits it in
minutes. One test raises it from ten minutes to two hours, asserted on the card
and through `auth.me`, with the preferences spec's baseline and teardown. It only
goes up, because a lower timeout drops an idle session. The rest of the card is
not covered: the login banner, the directory service toggle, and the session
list with its terminate actions.

The Replication card's tasks limit came next, in `tests/replication-settings.e2e.ts`:
one test sets a limit where there was none, and the other empties the field,
which the form saves as no limit and the card shows as `–`. Each is asserted on
the card and through `replication.config.config`. Middleware's schema declares
no default for the limit, so teardown writes back what the appliance held
before the first test rather than a fixed baseline.

Static routes came next, in `tests/static-routes.e2e.ts`: adding, editing and
deleting a route from the card on System > Network, the first spec to reach
that page. Each is asserted on the card and through `staticroute.query`, which
also carries the description the card does not show, and edit and delete each
run beside a second route that must come through untouched. Every destination
and gateway is reserved for documentation, so no route the suite adds can take
a real path away. The row tag is `static-route-<destination>-<gateway>`, so the
edit, which changes the gateway, renames the row. The card's Edit and Delete
are inline buttons on the row, not a kebab menu, and Delete goes through the
card's own dialog. The card lists four routes before View All, sorted by
destination: edit and delete press View All when the appliance holds more, and
the add test fails up front unless its new row will fit. The form's refusal of
a gateway that is not an address is not covered.

Alert services came next, in `tests/alert-services.e2e.ts`: adding, editing and
deleting a service from the Alert Services table on System > Alert Settings,
each asserted on the table and through `alertservice.query`, which also carries
the webhook URL the table does not show. Edit and delete each run beside a
second service that must come through untouched. Every service is a Slack one,
whose only setting is a URL, and every URL is under `example.com`; saving a
service sends nothing. The form renders the type's own fields a tick after it
opens for an edit, so the edit waits for the stored URL before typing over it.
The row tag is `alert-service-<name>` and the edit leaves the name alone, so the
row keeps its ids. Writing it turned up a `data-test` collision: the Category
card beside the table also emitted `button-save`, so with the panel open the
side panel's Save matched two elements. The card's is now
`button-save-alert-config`. The other nine service types and Send Test Alert are
not covered.

The Category card beside it came next, in `tests/alert-settings.e2e.ts`: changing
one alert class's level, and another test its frequency, each asserted through
`alertclasses.config` and on the card reopened from the sidebar. The card sends
every override it holds and middleware replaces the set whole, so each test runs
beside a second class whose own override must survive the save. The classes are
picked from `alert.list_categories` when the file starts, from a category other
than the one the card opens on, because their names belong to middleware. A
row's ids are built from the class's title, not its id. Teardown writes back
every override the appliance held before the first test.

Boot environments came next, in `tests/boot-environments.e2e.ts`: cloning the
running one, marking one to be kept, and deleting one, from the list on System >
Boot, each asserted on the list and through `boot.environment.query`. Keep and
delete each run beside a second boot environment that must come through
untouched. Every one the suite makes is a clone of the running one, so none of
them is booted into and nothing changes what the appliance boots next. The row
tag is `bootenv-<name>`, and the row's actions are inline buttons, not a kebab
menu. Delete goes through the page's own dialog, which lists what it will delete.
Activating, unkeeping, the batch delete, scrubbing the boot pool and the
Stats/Settings dialog are not covered.

Localization came next, in `tests/localization.e2e.ts`: changing the timezone,
the language and the date format. They are no longer saved in one place. The
timezone is the appliance's, set from the Localization card on System > General
Settings and checked on the card and through `system.general.config`. The
language and the date format are the account's, set from the Localization
section of the Preferences form and checked through `auth.me`, with the
preferences spec's baseline and teardown. That baseline now pins English and the
default date format too. German is checked by the card's Settings button
reading `Einstellungen`, and the date format by the running boot environment's
Date Created cell. Two things about the date format are worth knowing. Each
option's label is today's date in that format, so its id changes daily, and
`dd/MM/yyyy` and `dd.MM.yyyy` always share one. And the `formatDateTime` pipe,
which renders that cell, reads the format only from `localStorage`, which the
form writes on save. So in a new browser the pipe shows the default, whatever the
account holds. Writing the spec turned up a bug there: the form announced the
change before writing `localStorage`, so the pipe re-read the old format and
dates already on screen kept it until a reload. It now writes first. A `shipped`
run needs a nightly built after that fix. The keyboard map and the time format
are not covered.

The Email card beside it came next, in `tests/email-settings.e2e.ts`: setting up
mail over SMTP with authentication from the defaults, and moving it to another
server with authentication turned off, each asserted on the card's From line and
through `mail.config`. Between them every SMTP control is changed. Every address
is under `example.com`, and saving sends nothing. Teardown writes middleware's
defaults back, so a run clears an appliance's real mail setup — except the sender,
which `mail.update` will not accept empty, so it becomes `baseline@example.com`.
With authentication off the form does not send the username, so middleware keeps
the old one. The OAuth send methods need a real Google or Microsoft login and are
not covered, and neither is Send Test Mail.

The Disks page under Storage came next, in `tests/disks.e2e.ts`, the first spec
to reach it. It is not in the sidebar, so the spec opens it from the Disks button
in the Storage dashboard's header. One test checks that every disk `disk.query`
reports has a row showing its name and serial, and that searching for one disk's
serial keeps its row and hides another disk's. One edits a disk's description, HDD Standby and
Advanced Power Management, asserted through `disk.query` and on a freshly opened
page, where those columns are hidden and read from the expanded row. Teardown
writes middleware's defaults back. The third wipes a disk, and a blank disk would
show nothing for it, so the disk carries a pool exported without `destroy`. The
page labels that disk `<pool> (Exported)`, and the wipe dialog warns that the
pool will be lost. After the wipe, the Pool column reads `N/A` and `disk.details`
no longer reports the pool on the disk. A disk left carrying an exported pool is
one the pool wizard will not offer, so teardown wipes any that remain. Only the
Quick method is used. The bulk edit, the column picker and the SED actions are
not covered.

Importing a pool came next, in `tests/pool-import.e2e.ts`: one test imports a
pool that was exported, from the Import Pool button in the Storage dashboard's
header. The pool is the spec's own, `e2e_import_tank`, built on one disk and
exported over the API without `destroy`, which is how the disk wipe test gets
its disk too. After the import, the pool's card is on the dashboard,
`pool.query` reports it `ONLINE`, and `disk.details` no longer reports its disk
as carrying an exported pool. The panel's options are `<name> | <guid>`, and
the guid changes with every build, so the option is matched by name and the
flow asserts there is exactly one. Teardown destroys the pool if it was
imported and wipes its disk if it was not. Locked SED disks and a pool with an
encrypted root are not covered.

Zvols came next, in `tests/zvols.e2e.ts`: creating one from Add Zvol on the
Datasets page, growing one and setting its Sync from Edit Zvol on the details card,
and deleting one with the dialog fully confirmed. Each is asserted on screen and
through `pool.dataset.query`, where the size is checked in bytes and Sync has to
read `LOCAL`. Edit and delete each run beside a second zvol that must come through
untouched. The form's ZFS properties are inline editables whose trigger id is
built from the value they show, so the spec opens them by their `text-<field>`
view instead. Encryption, the block size, shrinking (which the form refuses) and
the read-only/size interaction are not covered.

User and group quotas came next, in `tests/dataset-quotas.e2e.ts`: setting,
changing and removing a quota, once for users and once for groups, on a dataset
of the spec's own, reached from the Manage links on the Space Management card.
The two pages are one component routed twice, so each story runs per kind. Each
is asserted in the list and through `pool.dataset.get_quota`, where the data
quota typed as `1 GiB` has to arrive as bytes. Changing and removing each run
beside a second principal whose own quota must come through untouched. The
search, "Show all", Remove Invalid Quotas, unsetting both quotas from the edit
form, and quotas for directory-service accounts are not covered.

A dataset's Unix permissions came next, in `tests/dataset-permissions.e2e.ts`:
changing the owner, the group and the mode in the Unix Permissions Editor, which
Edit on the Permissions card opens while the dataset's ACL is trivial. Each is
asserted on the card the app returns to and through `filesystem.stat`, and each
checks that the other two came through unchanged. The dataset is the spec's own,
and every test starts it from one owner, group and mode with the ACL stripped,
set over `filesystem.setperm`. The card names each entry after its owner or
group, so its ids change with them. The ACL editor, presets, and applying
permissions recursively are not covered.

Encrypted datasets came next, in `tests/datasets-encryption.e2e.ts`: creating a
dataset encrypted with a passphrase from the form's Encryption Options, locking
one from the Encryption card, and unlocking one from the card's Unlock page
through both summary dialogs. Each is asserted on the card's Current State and
through `pool.dataset.query`, which says whether the key is really loaded. Every
dataset is its own encryption root with a passphrase, because the card shows
Lock only on a root and disables it there without one. The lock and unlock tests start from one made over the API.
Writing it turned up a `data-test` collision: the Lock dialog's own button emits
`button-lock`, the same as the card's behind it. Rather than rename either, the
dialog's action row now carries `actions-lock-dataset`, and the locator selects
the button inside it. Key encryption, unlocking from a key file, child datasets
that inherit encryption, Edit on the card, and exporting keys are not covered.

Rsync tasks came next, in `tests/rsync-tasks.e2e.ts`: adding, editing and
deleting a task from the card on Data Protection, each asserted on the card and
through `rsynctask.query`, which holds the remote end, the direction, the
schedule and the transfer options the card does not show. Edit and delete each
run beside a second task that must come through untouched. Every task is in
Module mode against `127.0.0.1`, where no rsync daemon listens: middleware
connects to nothing on save in that mode, and a task that fires before teardown
fails without touching data. The row tag is `card-rsync-task-<path>-<host>`, so
each task syncs a dataset of its own and the edit leaves both alone. The card
lists four tasks and its View All leaves for the full list, so each test fails at
the start if its rows would not fit. SSH mode and the Enabled switch are not
covered here; Run job is `tests/rsync-task-run.e2e.ts`, SSH mode and Pull
`tests/rsync-task-ssh.e2e.ts`, and the full list page
`tests/rsync-task-list.e2e.ts`, all below.

Local replication followed, in `tests/replication-tasks.e2e.ts`: creating a task
between two datasets on the same appliance through the card's wizard, with Run
Once, and running a task from the card's row menu. Both assert the task through
`replication.query`, the run through `core.get_jobs`, and the outcome through
`pool.snapshot.query`, because the target holding the source's snapshots is the
point of a replication and nothing on the screen shows it. Run Once is the one
path where the UI does every step itself: it snapshots the empty source, saves the
task and starts it. The run from the card sits beside a second task that must not
run. No target dataset is made in advance, so a target that exists afterwards is
evidence of a run. Middleware hands a deleted task's id to the next task and keeps
finished jobs, so runs are counted only from jobs that did not exist before the
action. Editing and deleting from the row menu followed, each beside a task that
must come through untouched. Edit opens the full replication form, not the wizard.
The test renames the task and changes its retries, read-only policy and Enabled,
then reads back the same record by id. Restore and Download keys followed in the
same spec. Restore only creates the reverse task, a disabled local pull from the
original's target. So the original is run over the API as setup, and the restored
task is then run from the card into a dataset that did not exist; the original's
snapshot arriving there is the data coming back. Download keys is offered only
for a source whose key middleware stores, which a passphrase never is. The source
is therefore encrypted with a key the test chooses, and the downloaded file must
map the target to exactly that key. Scheduled tasks and the periodic snapshot task
the wizard makes for them are not covered. Push over SSH is
`tests/replication-ssh.e2e.ts`'s, the full list page
`tests/replication-task-list.e2e.ts`'s, and the full form's retention, naming
schema and encryption options `tests/replication-form-options.e2e.ts`'s, all below.

Privileges came next, in `tests/privileges.e2e.ts`: adding, editing and deleting
a privilege from the list on Credentials > Privileges, each asserted on the list
and through `privilege.query`, which holds the roles' wire values and the groups
themselves where the list shows labels and a count. Edit and delete each run
beside a second privilege that must come through untouched. The edited privilege
names a local group of the spec's own, made over the API, and the edit leaves it
alone: the form shows groups by name and resolves them back to gids on save, so
the same gid has to come back. Roles is a multiple select whose panel stays open,
so the flow closes it with Escape and checks the side panel did not close too.
The row tag is `privilege-<name>` and the edit leaves the name alone. Picking a
group in the form, directory-service groups, the Enable DS Authentication prompt,
built-in privileges and the search are not covered.

A pool's devices came next, in `tests/pool-devices.e2e.ts`: taking a disk offline
and bringing it back online, and adding a spare, both from the pool's VDEVs page.
That page is reached from View VDEVs on the pool's card on the Storage dashboard.
Each change is asserted on the page and through `pool.query`. The spec builds its
own pool, `e2e_devices_tank`, as a two-disk mirror, because a disk can only go
offline from a vdev that survives losing it. It rebuilds the pool before each test
and destroys it after. Offline and Online are in the ZFS Info card's menu. The
spare is added through Add VDEV, which opens the pool wizard on that pool, on its
Spare step. A vdev or disk in the tree is keyed by its ZFS guid, not its name. Two
ids changed for the spec. View VDEVs was `button-manage-vdevs` on every pool's card,
so with two pools on the dashboard a test could not say which one it meant. It is
now `button-<pool>-manage-vdevs`, like the pool's Disconnect and View Datasets. The ZFS Info
card's menu trigger now passes `button-zfs-actions` in full, as the other callers
of that input do. Replace, Extend, Detach, Remove and the other kinds of vdev are
not covered.

Scrubbing a pool came next, in `tests/pool-scrub.e2e.ts`: one test starts a
scrub from Scrub Now on the pool's Storage Health card and waits for it to
finish. `pool.query` has to report a finished `SCRUB` with no errors. The card
has to show "Finished Scrub on …" and 0 errors without a reload. The spec builds
its own one-disk pool, `e2e_scrub_tank`, and rebuilds it before each test, so
the card cannot already show an old scrub. The shared `pool` fixture can be a
developer's real pool, and scrubbing that could take hours. Scrub Now's id now
carries the pool's name (`button-scrub-<pool>`, was `button-scrub`), like
Disconnect's, because the dashboard shows one per pool. Pause, Resume
and Stop are not covered: a scrub of an empty pool ends before they can be
clicked. The scheduled scrub form is not covered either.

Certificates followed, in `tests/certificates.e2e.ts`: creating a certificate
signing request through the Add CSR wizard and deleting one from its row on the
CSR card under Credentials > Certificates. Both are asserted on the card and
through `certificate.query`, whose PEM request and parsed subject are the
evidence that a key pair was generated and a request signed. The delete runs
beside a second CSR that must come through untouched. The wizard is driven with
its defaults (no profile, RSA 2048, SHA256, no extensions) and only the subject
filled in. The row tag is `csr-<name>`. The card lists four CSRs before its
pager, so each test fails at the start if its rows would not fit. Importing a
CSR, profiles, extensions, Edit, Download, ACME certificates, the Certificates
card itself and ACME DNS authenticators are not covered.

The Portals, Initiators and Authorized Access tabs of the full iSCSI page, and
its Global Target Configuration, are in `tests/iscsi-config.e2e.ts`, reached
through the iSCSI card's title. A portal is added with a `0.0.0.0` listen
address, and one is edited and one deleted beside a second that must not
change; middleware refuses an address two portals share, so the second listens
on `::`. An initiator group is added on the routed add page with two typed IQNs
and edited from its row. An authorized access entry is added with Mutual CHAP,
and one deleted beside a second. The global configuration gets an iSNS server
and a pool available-space threshold, and teardown writes back what it found;
the server is `127.0.0.1:443`, since Save is refused unless middleware can
connect to it. Everything is read back through the `iscsi.*` queries. Row tags
are `iscsi-portal-<comment>`, `iscsi-initiator-<id>` and
`iscsi-authorized-access-<user>-<peer user>`, through lodash. The base name, the
listen port, Edit on authorized access, the "Connected Initiators" list, ALUA
and iSER are not covered. The Authorized Access Add button keeps its frozen id,
`add-target-extent`.

iSCSI shares followed, in `tests/iscsi-shares.e2e.ts`: creating a share with the
iSCSI Wizard from the Block (iSCSI) Shares Targets card on the Shares dashboard,
and deleting a target from its row there. The wizard makes a new zvol, an extent
on it, a new portal listening on `0.0.0.0`, an initiator group, a target, and the
association between target and extent, all named after the share. The create
is asserted through the `iscsi.*` queries and `pool.dataset.query`: the zvol, the
extent on it, the target, its association with the extent and the portal its
group points at. The initiator group is not read back. The delete ticks "Delete
associated extents" and runs beside a second target that must come through
untouched. The extent has to go and the zvol has to stay. The row tag is
`card-iscsi-target-<name>` through lodash, so `e2e` reads `e-2-e` in every id
on the row. The card lists four targets before its pager, so each test fails at
the start if its rows would not fit. Teardown finds the portal and initiator
group by the `comment` the wizard gives them. File extents, existing targets,
portals and zvols in the wizard, initiators, Fibre Channel, Edit, the global
configuration and a real initiator login are not covered there.

The Targets and Extents tabs of the full iSCSI page followed, in
`tests/iscsi-targets-extents.e2e.ts`, reached through the card's title. On
Targets: adding a target with an authorized network and one group pointing at a
portal and an initiator group made over the API, and associating an extent with
a target as a LUN and then unlinking it, which must leave both ends in place. On
Extents: adding a Device extent on a zvol with a non-default block size, adding a
File extent at a path that does not exist yet (its file must then exist), editing
one extent's description beside a second that must not change, and deleting a
File extent with "Remove file?" ticked, which must take its file and leave a
second extent's. Everything is read back through the `iscsi.*` queries, and a
file through `filesystem.listdir`. Row tags are `iscsi-target-<name>` and
`iscsi-extent-<name>` through lodash. The Extents tab's Add button is
`add-target`, the same id as the Targets tab's, and is left that way because a
`data-test` is a Release Engineering contract; one tab is mounted at a time, so
the flow clicks it once the Extents URL shows and checks for Extent Type.
Teardown removes targets before extents, and extents before the portal and
initiator group, since middleware refuses to delete an extent a target still
uses.
Editing a target, deleting one from this page, Force, the Initiators, Portals
and Authorized Access tabs, CHAP and Fibre Channel are not covered.

The Services page under System followed, in `tests/services.e2e.ts`: starting FTP
from its row's play button and stopping it from the stop button and its
confirmation, and saving the SSH and FTP forms the rows' pencils open. A start or
stop is asserted on the row's Status cell and through `service.query`, which also
has to show the start did not turn on Start Automatically. A save is asserted
through `ssh.config` or `ftp.config`, since the page shows no settings. The row
tag is `service-<name>`. FTP is the service started because nothing the suite or
CI uses depends on it; it goes back to stopped, and both forms' fields to a fixed
baseline, before and after each test. The Start Automatically switch, the search,
the other services' forms, advanced options and View Logs/Sessions are not covered.

Virtual Machines followed, in `tests/virtual-machines.e2e.ts`: creating a Linux VM
with the wizard on a new zvol, and editing and deleting one from its row's detail
panel beside a bystander that must not change. Each is asserted through `vm.query`,
and the created VM's disk and NIC through `vm.device.query`. No test starts a
machine: the wizard turns Start on Boot and the VNC display off, every readback
expects STOPPED, and rows are expanded through the Name cell rather than the row,
which also holds the Running toggle. The spec fails rather than skips on an
appliance without virtualization support, since the page then shows no list. The
wizard's zvol goes under a dataset of its own, removed in teardown. Starting and
stopping, devices, cloning, installation media, GPUs and the display are not
covered.

Three read-only pages followed, one test each: `tests/dashboard.e2e.ts`,
`tests/reporting.e2e.ts` and `tests/audit-log.e2e.ts`. Each opens its page from the
sidebar and checks a value the appliance supplied. On the Dashboard, the System
Information widget's hostname and version have to match `system.info`. On
Reporting, the first series of the CPU tab's `cpu` report has to show a Mean.
Its title, which every id on the report is keyed by, is read from
`reporting.netdata_graphs`. On Audit, the newest middleware record from
`audit.query` has to have its row, with the same user and event. That row's id
ends in the record's UUID. The Dashboard spec relies on the admin's layout still
holding that widget, and nothing in the suite changes the layout. Editing the
dashboard, the other widgets, the other reporting tabs, zooming and stepping, the
audit search, the details panel and the export are not covered.

The topbar's two panels followed, one test each: `tests/alerts-panel.e2e.ts` and
`tests/jobs-panel.e2e.ts`. Middleware has no public call that raises an alert, so
the alerts spec creates an NFS share restricted to a hundred networks, which
raises a `NFSNetworkListExcessive` warning as the share is saved; deleting the
share deletes it. The class matters: middleware *deletes* a one-shot alert such
as `RsyncFailed` when it is dismissed, so only a class it marks dismissed can be
reopened. The test dismisses the alert from the bell's panel and reopens it from
the Dismissed filter, asserted in the panel and through `alert.list`. The jobs
spec opens the panel, starts a `sleep 20` cron job over the API, and requires its
row first in the running list and then in the finished one, with `core.get_jobs`
reporting SUCCESS. The two lists had no ids, so a row could not say which it was
in; they are now `list-ongoing-jobs` and `list-finished-jobs`. Dismiss All, the
severity filters' counts, the smart actions, aborting a job and the job's log
dialog are not covered.

Cloud Sync tasks followed, in `tests/cloud-sync-tasks.e2e.ts`: adding a task
through the card's wizard, and editing, running, restoring from and deleting one
from its row menu on Data Protection. Every task syncs through an SFTP credential
pointing at `127.0.0.1`, so the remote is a dataset on the appliance itself and no
outside service is involved. Root signs in with a key, which `sshd_config` allows
without password settings: the spec generates a keypair, appends its public key to
root's `sshpubkey` with a marker comment, starts SSH if it was stopped, and undoes
all three once for the file. Each action is asserted through `cloudsync.query`; the
run also through `core.get_jobs` and the remote's `filesystem.listdir`, beside a
second task that must not run. The API has no public call that writes a file, so
the file a run copies is written by a one-off cron job. A restore only creates the
opposite, PULL, task, so the spec checks its fields and then runs it over the API
to show it brings the file back. Edit and delete each run beside a second task. The
row tag is `card-cloudsync-task-<description>`, so no test edits the description.
A second wizard test makes a PULL task with SYNC and checks that the folders are
stored the right way round. A dry run is read from its job: `dry_run` set, rclone's
log naming the file, and nothing on the remote. Stop needs a run that lasts, so the
task gets a `bwlimit` and a 32 MiB file, and its job has to end ABORTED. Custom
Transfers is set through its dialog, whose Save shares `button-save` with the form
behind it; the dialog's action row now carries `actions-custom-transfers` to scope
it. The Enabled switch and other providers are not covered. The full list page is
`tests/cloud-sync-task-list.e2e.ts`'s, below.

Replication over SSH followed, in `tests/replication-ssh.e2e.ts`: creating a push
task to a different system through the wizard, with Run Once, picking an SSH
connection made over the API. The different system is the appliance itself: the
connection points at `127.0.0.1` as root, trusts the host key
`keychaincredential.remote_ssh_host_key_scan` reads, and signs in with a keypair
authorized the same way the cloud sync spec's is. That part now lives in
`fixtures/loopback-ssh.ts`, which both use, each with its own marker. The task is
asserted through `replication.query`, including its SSH transport and connection,
the run through `core.get_jobs`, and the target's snapshots through
`pool.snapshot.query`. Pull from a different system, SSH+NETCAT, sudo, making the
connection in the wizard's own "Add New" form and the SSH Connections page are not
covered.

TrueCloud Backup followed, in `tests/cloud-backup-tasks.e2e.ts`, and only as far as
an appliance with no Storj account goes: the card's empty state, the full list page
opened from the card's title and its own empty state, and the add form refusing
Name, Keep Last and Password when each is touched and left empty. Neither empty
state had an id; they are now `text-cloud-backup-task-empty` and
`text-cloud-backup-list-empty`, and those three fields' `form-field-*` wrappers
carry ids too. `cloud_backup.create` initializes a restic repository on Storj
before it stores anything, so no task can be made here — saving, running,
restoring, the row actions and the details page all need a real account.

The Data Protection page as a whole is `tests/data-protection-dashboard.e2e.ts`:
all five cards rendering together, each with its seeded task or its empty state,
each card's title opening its own full list, View All on a snapshot card holding
five tasks, and the Enabled switch on a snapshot, replication, rsync and cloud sync
row turning that task off and on again with the other three untouched. The four
cards that had no id on their empty state now emit `text-<card>-task-empty`, as
TrueCloud Backup's does. The full list pages themselves are covered by their own
specs, below.

Running a rsync task is `tests/rsync-task-run.e2e.ts`: Run job from the card's row
menu on a push task in SSH mode, beside a Module-mode task that must not run. The
task signs in through an SSH connection to `127.0.0.1` made with
`fixtures/ssh-connections.ts`, as the replication over SSH spec's does, under its
own name. The run is asserted on the row's state, through `core.get_jobs`, and
through `filesystem.listdir` on the target, which holds the source directory
itself afterwards: middleware passes the local path to rsync with no trailing
slash. The file it copies is written by the cloud sync spec's one-off cron job.

SSH mode in the form, and Pull, are `tests/rsync-task-ssh.e2e.ts`, through a
connection of its own to the same loopback. Adding a Pull task in SSH mode through
a keychain connection is read back through `rsynctask.query`; editing an SSH task's
description must leave its mode, connection and remote path as they were; and a
Pull task run from the card copies the remote directory into the local dataset
with nothing going the other way. In keychain mode the form sends no host, so such
a row's tag ends in `-null`. Saving with Validate Remote Path ticked, the form's
default, signs in over the connection, so each remote path is a real dataset.

The full list pages each have a spec of their own: `tests/replication-task-list.e2e.ts`,
`tests/cloud-sync-task-list.e2e.ts`, `tests/rsync-task-list.e2e.ts` and
`tests/snapshot-task-list.e2e.ts`. Each opens its list from the card's title,
searches it down to one task, and edits and deletes a task from its row beside a
second task that must come through untouched. Replication, cloud sync and rsync
also run one, checked through `core.get_jobs` and by what the run copied.
Replication's Enabled switch turns its task off and on again. The other three
lists show Enabled as a Yes/No cell, so their edit tests switch the task off
through the form instead. A list's ids are not its card's: `toUniqueRowTag` runs
the whole row tag through lodash, so `e2e` is `e-2-e` there. The detail-panel
actions are keyed by the task's id, or by a snapshot task's dataset and naming
schema, rather than by the row tag. TrueCloud Backup's list is not covered, for
the Storj reason above.

A task's State, and the log behind it, is `tests/rsync-task-state.e2e.ts`. Every
card renders its State through the same `ix-task-state-cell`, and rsync is the one
where both outcomes need nothing outside the appliance: a Module-mode task against
`127.0.0.1` fails with the connection refused, and an SSH-mode task with
`--verbose` succeeds and names what it copied. Each run is started over the API —
the card's Run job raises an error dialog of its own when a run fails, which would
stand in for the one under test. Failed opens the error dialog with the job's log
under View Details; Completed opens the logs dialog, whose text now carries
`text-logs-excerpt`.

The full replication form's options are `tests/replication-form-options.e2e.ts`:
each test edits one local task from the full list, reads it back through
`replication.query`, and runs it. Same as Source retention removes from the target
a snapshot the source has dropped, which middleware does in a pass after the task
finishes, so the test polls for it. A naming schema set in place of a regular
expression sends only the source snapshot it matches. Encryption with a HEX key
the test chooses makes a target that is its own encryption root. Custom retention,
passphrase and inherited encryption, a key stored on the target, and periodic
snapshot tasks are not covered.

NVMe-oF followed, in `tests/nvme-of.e2e.ts`: adding a subsystem with the Add
Subsystem form from the NVMe-oF Subsystems card on the Shares dashboard, with a
zvol namespace, one existing TCP port and one existing allowed host; adding and
removing a namespace, a port and a host on its details page, beside a second
subsystem whose links must not change; creating a host with Require Host
Authentication and a generated key; deleting a subsystem from its card row with
Force; and saving the global base NQN. Each is asserted through the `nvmet.*`
queries, reading the association ids `nvmet.subsys.query` returns with
`verbose`. Ports and hosts are shared objects, so unlinking or deleting has to
leave them, and the zvols, in place. The ports listen on `0.0.0.0` on service ids
of their own, and the service is never started. The card's row tag is
`nvmeof-subsys-<name>` without lodash, so `e2e` stays `e2e` on the row, its Name
cell and its actions. RDMA, ANA and the SPDK implementation need RDMA hardware,
HA or an entitlement, so the test only checks that they are disabled or absent.
Creating a port through the port form, File namespaces, Manage Ports and Manage
Hosts, Diffie–Hellman, renaming, the standalone list's search and a real
initiator connection are not covered.

The framework is done and the coverage of the 19 top-level feature areas is
not. What the work bought is that the next twenty tests are cheap: the target
seam, auth, fixtures, unconditional teardown, selector discipline and failure
legibility are all built and proven against three different appliances.

**Flake rate has a number now.** Six consecutive full-suite runs on one
appliance, zero failures and zero flaky — three from a golden snapshot and three
back to back without one, which also showed teardown leaving no pool, dataset,
user, share or running service behind. That bounds the per-test rate under ~2%
and the per-run rate only under ~39%; D1's gating decision wants more runs than
six, but it is no longer resting on nothing.

**Total runtime is measured:** the suite takes ~1.5 minutes on one worker
against a nested VM, and the whole CI job ~6 minutes of which ~3.5 is the
install. The runtime budget and the decision to defer parallelism now rest on
a number. See `05-ci.md`.

## What the suite needs from an appliance

- **At least 9 identical unused disks.** Identical is load-bearing: the pool
  wizard groups by `(type, size)` and offers widths from one group at a time.
- Disks with duplicate or blank serials, or carrying an exported pool, are
  filtered out by the wizard and do not count. Hypervisors hand out blank
  serials readily — set distinct ones.
- An admin account **without** two-factor. The suite cannot answer the challenge.
- Fully booted, no first-boot wizard, no EULA.
- **A cleartext origin for the UI.** One test asserts the insecure-connection
  warning, which is decided from the scheme the page was loaded with, so it
  needs an address that is really `http:`. An appliance serves port 80 without
  redirecting; CI publishes one beside the TLS port and names it in
  `TN_UI_BASE_URL_HTTP`. Where neither exists the test skips rather than fails,
  and the id it asserts then has no cover on that target.

## Next steps

1. **Widen coverage.** Dataset ACL is the uncovered story worth taking next.
   Manual snapshots are covered — take, recursive, delete, hold, clone, roll
   back and its safety check — but not batch delete, the list's own Add
   button, naming schemas, the extra columns or VMware sync. The confirmation-bypass class is now covered
   everywhere this suite can reach it — datasets, zvols and pool disconnect;
   what is left needs an app, SED hardware or a VM. ZFS tiering's configuration
   and a dataset's tier change are covered; the share-list tier action and the
   tier gating are next — the SMB specs brought the share fixture and row
   locators the first of those needs. SMB shares are covered from the Shares
   dashboard — publish, the purpose presets, edit, enable, unshare, the service
   switch — but not the share and filesystem ACL editors, the standalone list
   page, or anything a real SMB client would have to prove. NFS shares are
   covered the same way — publish, read-only, networks, hosts, edit, enable,
   unshare, the service switch and the start offer, maproot, mapall and the
   Security select — but not the service's own settings beyond turning NFSv4
   on, the standalone list and sessions pages, or a real mount. S3 is covered as a feature — create, configure,
   edit, toggle, rotate, delete — except auditing, which is licence-gated and
   needs an Enterprise appliance. List-driven journeys (deleting a pool, dataset
   or share from a list) are no longer blocked: `tn-table` still writes nothing
   on the `<tr>`, but every list tags its cells with the row's identity and a
   lint step keeps it that way — see "Addressing a table row" in `CLAUDE.md`
   (NAS-143804).
2. **CI is running.** `.github/workflows/e2e.yml` installs a nested TrueNAS VM
   on the lab runner (a TrueNAS box) with `tn_guest.py` from
   iXsystems/api-ci-testbed, runs the suite against it from Playwright's
   container, and destroys it. Green on same-repo pull requests touching the
   suite. `05-ci.md` is the operational record: prerequisites, numbers, and
   what each failed run taught. `ixnode`, which the design assumed, is the
   legacy KVM-host tool and cannot run on a TrueNAS appliance.

   Deliberately smaller than `04-environment-architecture.md`, which shards
   across appliances and rolls back a snapshot between tests. Neither exists
   yet. That document was rewritten against the pipeline as built: the design
   stands, the substrate is a TrueNAS host with zvol-backed VMs rather than
   `ixnode` on libvirt, and the rollback cycle it wanted measured is now
   read off every clone.

   It runs nightly and on every merged UI change, drives the UI built from
   the checkout, and publishes traces for failed tests. Appliances are
   clones of a template rebuilt whenever the weekly-rotated nightly ISO moves,
   rather than fresh ISO installs (E5 in the design, first form). What is next for the pipeline is reading the
   rollback cycle (Q0b) off the clone timings and deciding about per-test
   restore on that number.
3. **Observability.** No WebSocket capture, no middleware log collection (the
   guest is behind `hostfwd`, so it needs an API route rather than SSH), no
   version recording in reports. These are what make a 3am failure diagnosable
   by someone who did not write the test.

## Known gaps

- **TLS verification is disabled process-wide** by `playwright.config.ts`, not
  scoped to the one connection that needs it. Still no seam in
  `@truenas/api-client@5.0.0`: `CreateClientOptions` gained a `version` option
  but still exposes no TLS, socket-constructor or dispatcher option. See the
  comment there for what would close it.
- **Nothing guards the `data-test` contract.** Every locator depends on
  attributes that webui's own convention forbids unit tests from asserting on,
  so they have no coverage in the repository that emits them. NAS-142069 was one
  such attribute deleted by a migration and caught by a person, not by CI.
- **Per-test token login** replaced `storageState` once two authenticated tests
  ran back to back (the S3 pair). `setup` still gates the authenticated project
  as the earliest report of a broken token login. Each login mints its own
  token: middleware stops honouring one once the session that redeemed it ends,
  so a per-worker token carried exactly one test too. Cost: one authenticated
  call and a few seconds per test.
- **Fixed names** (`bob`, `e2e_tank`, `e2e_shared_tank`, the S3 specs' owners) mean two runs against one appliance
  collide. Fine for one-appliance-per-run; run-scoped naming is the fix.
- **List assertions assume the row is on page one.** The pager defaults to 50,
  and the group and user lists hide built-ins behind a *persisted per-admin
  preference* — so on an appliance where someone once turned built-ins on, a
  freshly created group (highest GID, ascending sort) lands on page two and its
  spec times out against a screen that is working. No code here flips that
  preference and the golden snapshot has it off, so nothing fails today. The fix
  is a shared "find this row" flow that filters first, across the user specs as
  well as the group ones. **This has now bitten once**, in the preferences spec,
  which turns built-ins on deliberately: it asserts on `wheel` (GID 0) precisely
  because `builtin_administrators` is 79th of 93 and therefore on page two.
- **The preferences fixture cannot restore an account that had none.** Middleware
  exposes `auth.set_attribute` and no way to unset an attribute, so on an account
  that has never saved a preference `establishPreferenceBaseline` leaves one
  behind — webui's own defaults, which is what that account was already being
  given at runtime, but now written down rather than inferred. Harmless in
  practice and irreversible, so it is recorded rather than worked around.
- **`isNewTimeMachineShare` in `smb-form.component.ts` is dead code**, and the
  restart prompt is broader than the comments around it imply. The prompt is
  gated on `isRestartRequired`, which is `this.isNew || this.form.dirty` — so it
  appears for every new share and every edit while SMB is running, whatever the
  purpose. The Time Machine transition logic the comments describe lives in
  `isNewTimeMachineShare`, which nothing in `src/` references. So
  `smb-service.e2e.ts` covers the Apple-extensions gate and leaves the restart
  prompt alone: pinning the current behaviour would encode something that reads
  as unintended. Worth a product answer before it is tested either way.
- **A snapshot row's selection tick box has no id**, so batch delete has no
  test. `tn-table` renders the box itself (`aria-label="Select row N"`), which
  the template cannot tag; it needs a row-scoped id from the library.
- **The batch-delete dialog's clone guard never fires.** It disables Delete on
  `properties.clones`, which middleware does not return from either snapshot
  query, requested or not. The details row had the same dead guard and now asks
  `pool.dataset.query` for datasets whose `origin` is the snapshot; the batch
  dialog still relies on middleware refusing.
- **The delete-group dialog's "delete these users too" checkbox is unreachable**,
  and so has no test. It renders when the group has members, while the button
  that opens the dialog is disabled for exactly that reason — two rules that
  contradict each other, added at different times. Deciding which one is right
  is a product call rather than a test one; the tooltip ("Groups with privileges
  or members cannot be deleted") reads like the deliberate half.
- **`AuthResponseType` is declared but not exported** while
  `AuthResponse.response_type` is typed as it, so `support/api/client.ts` checks
  a successful login by comparing `String(...)` against `'SUCCESS'`. Still true
  in 5.0.0. (`ServiceControlAction`, which had the same problem, is gone from
  5.0 altogether; `service.control` is a job whose path takes the verb as a
  literal, so nothing here needed it.)

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
| T3 | Middleware client is `@truenas/api-client` (5.x since 2026-09-08, 3.x before; T3.1 covered the curated-subset problem that 3.x removed) |
| T5 | Authentication via a setup project plus `storageState` — the `storageState` half was dropped 2026-09-08: the app rotates the persisted token into a five-minute single-use one, so the snapshot carried exactly one test. Each authenticated test now signs in through the token URL in the `page` fixture |
| T10 | Configuration through target profiles, resolved in one module |
| D1 | PR gating — deferred; needs a measured flake rate first. The `e2e` check runs on same-repo PRs touching the suite, but it is not a required check, so a red run informs and does not block |
| D2 | Parallel execution by sharding across appliances — deferred |
