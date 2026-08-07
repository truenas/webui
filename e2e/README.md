# E2E test suite

Playwright tests that drive a real browser against a real TrueNAS appliance.

Run every command from the repository root.

> **These tests create and destroy pools.** Point them at a disposable VM, never
> at a NAS you care about.

---

## Setup

One-time, after `yarn install`:

```bash
yarn playwright install chromium
```

```bash
cp .env.example .env
```

Fill in `TN_PROFILE`, `TN_USERNAME` and `TN_PASSWORD`. Then point webui at your
appliance — this configures the dev server, the API proxy **and** these tests
together:

```bash
yarn ui remote -i <vm>
```

`TN_HOST` is read from `src/environments/environment.ts`, so that one command is
all the targeting you need. Set `TN_HOST` in `.env` to override it.

## Running

```bash
yarn e2e
```

```bash
yarn e2e --project=unauthenticated
```

```bash
yarn e2e fresh-install
```

The last form filters by filename substring. Add `--retries=0` while iterating —
a retry on a slow failure only doubles the wait.

### Targets

| Profile | UI served from | Set up with |
|---|---|---|
| `shipped` | `https://<host>/ui/` — the appliance's own UI | nothing; works out of the box |
| `branch` | `http://localhost:4200/` — your working copy | `yarn start` in another terminal |

Use `shipped` unless you are testing UI changes you have not pushed. `branch`
runs your local code against the same appliance, but the dev server surfaces
developer-only dialogs the shipped UI never shows, so a failure there is not
always a real one.

Whichever you use, **the dev server and `TN_HOST` must be the same appliance**.
The login token is minted against one and redeemed by the other; when they
disagree, sign-in fails with nothing explaining why.

```bash
grep remote: src/environments/environment.ts
```

## Watching and debugging

Watch it run, slowed down enough to follow:

```bash
TN_SLOW_MO=600 yarn e2e:headed
```

Step through interactively, with a DOM snapshot at every action and a locator
picker — the best way to find a `data-test` value:

```bash
yarn e2e:ui
```

Record every test to `test-results/`:

```bash
TN_VIDEO=1 yarn e2e
```

Leave created pools, shares and users on the appliance to inspect:

```bash
TN_KEEP_TEST_DATA=1 yarn e2e
```

Cleanup still runs at the *start* of each test, so this changes only what a run
leaves behind, never what it finds.

After a run:

```bash
yarn e2e:report
```

For a failure, the trace is the fastest way in — network, console, and a DOM
snapshot per step:

```bash
yarn playwright show-trace test-results/<dir>/trace.zip
```

`test-results/` is wiped at the start of every run. Copy anything you want to
keep.

## Layout

```
e2e/
  tests/       journeys, named *.e2e.ts
  flows/       UI-driving actions      — signIn(), createRaidz2Pool()
  locators/    data-test values, one module per screen
  fixtures/    API-driving setup and teardown
  support/     config, auth, API client
  docs/        why it is built this way, and what is planned next
```

`playwright.config.ts` lives at the repository root, where the CLI looks for it.

## Adding a test

**1. Name it `*.e2e.ts`** under `e2e/tests/`. Not `*.spec.ts` — that belongs to
Jest, which would otherwise try to run it.

Put it in `tests/unauthenticated/` if it covers sign-in, sign-out or session
identity; those run without the token bypass. Everything else goes in `tests/`
and starts already signed in.

**2. Add selectors to `locators/`, never inline in the test.** Find the
`data-test` value by searching the template for `testId` or `ixTest`, then work
out what is emitted — components prefix by type, so
`<tn-input [testId]="'username'">` becomes `data-test="input-username"`:

| Template | Emitted |
|---|---|
| `<tn-input [testId]="'username'">` | `input-username` |
| `<tn-button testId="save">` | `button-save` |
| `<tn-checkbox formControlName="create_smb">` | `checkbox-create-smb` (falls back to the control name) |
| `<tn-select [testId]="'role'">` | `select-role`, options `option-role-<value>` |

Two gotchas. Option ids are kebab-cased, but a control declaring
`[optionTestIdKey]` may use lodash `kebabCase` instead of the library's, and the
two disagree — lodash turns `RAIDZ2` into `raidz-2`, the library into `raidz2`.
And a few components (`tn-tree-node`) write the value verbatim with no prefix.
When in doubt, `yarn e2e:ui` and click the element.

**If the element has no `data-test`, add one upstream** — in the webui template
or in `@truenas/ui-components`. Do not fall back to a CSS class or text match.
Both repos are in-house; see `docs/test_ids.md` in the component library.

**3. Put UI actions in `flows/`, preconditions in `fixtures/`.** A test must
never use the API to do the thing it is testing — that is the difference between
testing the UI and testing middleware. But it should use the API for state it
merely depends on: driving the pool wizard to test a *share* makes one broken
wizard fail six tests.

**4. Clean up in `afterEach`, over the API, unconditionally.** It has to run
after a failure too, which is when it matters most. A leaked pool holds its
disks and starves every later run. If your test changes global state — a
service, a system setting — restore that as well, or the next run silently
tests a different scenario.

**5. Wait on conditions, never on time.** No `waitForTimeout`. Playwright's
assertions retry on their own; middleware operations are jobs, so poll their
state with `expect.poll`. If you need a dialog, wait for it — `isVisible()`
does not wait, and probing for a dialog right after the click that opens it will
silently miss.

## Troubleshooting

| Symptom | Cause |
|---|---|
| `ConfigError` listing variables | `.env` incomplete; it names everything missing at once |
| `[EBUSY] Rate Limit Exceeded` | 20 unauthenticated calls per method per IP per minute. Authenticated calls are exempt, so this is sign-ins — wait a minute, or run fewer times in quick succession |
| Sign-in times out on `ix-admin-layout` | Usually `TN_HOST` and the dev server pointing at different appliances |
| `Max Concurrent Calls` dialog | Dev-build only; the shipped UI cannot produce it. An artifact of `branch`, not a real failure |
| Test needs *N* unused disks | A previous run leaked a pool, or the VM was provisioned with too few |
