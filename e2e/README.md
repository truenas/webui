# E2E test suite

End-to-end tests for the TrueNAS WebUI, driving a real browser against a real
appliance. Preconditions are established over the middleware API and assertions
are made through the UI, so each test's failure points at one feature rather
than a chain of them.

**Planning documents**

| | |
|---|---|
| [`docs/01-requirements.md`](docs/01-requirements.md) | What the suite must do, and the constraints |
| [`docs/02-technology.md`](docs/02-technology.md) | Technology choices and rationale |
| [`docs/03-implementation-plan.md`](docs/03-implementation-plan.md) | Phased delivery plan |

> These were written while the suite lived in a separate repository. The
> repo-layout decision has since been reversed — the suite is in-tree — which
> retires R6.1 (test-id drift is now caught by the PR that causes it) and makes
> D1 (PR gating) reachable. R2.10 no longer applies either: reading webui's
> source is now deliberate, and confined to `support/webui-environment.ts`.

**Status:** two user-story journeys passing — an admin-user lifecycle, and a
fresh-install journey covering pool, dataset and SMB share creation.

---

## Requirements

- webui's own toolchain (`yarn install` at the repository root)
- A TrueNAS VM you are willing to have pools created and destroyed on

## Setup

From the repository root:

```bash
yarn playwright install chromium
```

```bash
cp .env.example .env
```

Then point webui at your appliance — this configures the dev server, the API
proxy, **and** the E2E suite in one step:

```bash
yarn ui remote -i <vm>
```

`TN_HOST` defaults to whatever that command wrote into
`src/environments/environment.ts`, so `.env` only needs `TN_PROFILE`,
`TN_USERNAME` and `TN_PASSWORD`. Set `TN_HOST` explicitly to override it — which
is how CI targets a machine without a working tree.

## Running

The suite runs against one of two targets, differing only in where the UI is
served from. Everything else — selectors, API client, authentication — is
identical.

| Profile | UI | Middleware | Used by |
|---|---|---|---|
| `shipped` | `https://<host>/ui/` | `<host>` | Nightly |
| `branch` | `http://localhost:4200/` | `<host>` | CI, local dev |

The paths differ: `/ui/` is where the appliance's nginx serves the UI, while a
locally served build defaults to `/` — only webui's `build:prod` passes
`--base-href /ui/`. What both must have is a **trailing slash**, or relative
navigation drops the last path segment. The suite checks this at startup.

### Against the appliance's own UI

```bash
TN_PROFILE=shipped TN_HOST=<vm> TN_USERNAME=<user> TN_PASSWORD=<pass> yarn e2e
```

The suite disables Node's TLS verification for you, because the API client
speaks `wss://` exclusively and test appliances present self-signed
certificates. This applies in both profiles — the profile changes where the
browser loads the UI from, not where the API client connects. Set
`NODE_TLS_REJECT_UNAUTHORIZED` explicitly to override.

### Against a webui branch

Point webui's dev server at the same VM and start it:

```bash
cd ../webui && yarn ui remote -i <vm> && yarn start
```

Then, from this repo:

```bash
TN_PROFILE=branch TN_HOST=<vm> TN_USERNAME=<user> TN_PASSWORD=<pass> yarn e2e
```

Set `TN_UI_BASE_URL` if you serve the UI somewhere other than
`http://localhost:4200/`.

> **`TN_HOST` must be the same appliance the dev server points at.** The token
> is minted against `TN_HOST` and redeemed by a UI that authenticates against
> its own `environment.remote`. If they disagree, login fails with nothing
> indicating why. Check with:
>
> ```bash
> grep remote: ../webui/src/environments/environment.ts
> ```

Serving a *production* build instead of `ng serve` needs a proxying server that
does not exist here yet — see R2.11. It is a refinement, not a blocker.

### Watching and debugging a run

Watch it in a real browser, slowed down enough to follow:

```bash
TN_SLOW_MO=600 yarn e2e:headed
```

`TN_SLOW_MO` pauses between browser actions. It is a launch option, not a CLI
flag — there is no `--slow-mo`. Use it for observation only; as a standing
setting it is a fixed delay on every action, which R8.3 rules out.

Leave created test data on the appliance for inspection:

```bash
TN_KEEP_TEST_DATA=1 yarn e2e
```

Cleanup still runs at the *start* of each test, so this only changes what a run
leaves behind — never what it finds.

### Other commands

```bash
yarn e2e:headed
```

```bash
yarn e2e:ui
```

```bash
yarn report
```

```bash
yarn check
```

## Layout

```
e2e/
  tests/          user-story specs, named *.e2e.ts
  flows/          UI-driving actions   — createPool(), signIn()
  locators/       data-test values, per screen
  fixtures/       API-driving setup    — givenPool(), ensurePoolAbsent()
  support/        config, auth, API client
  docs/           planning documents
playwright.config.ts   at the repository root, where the CLI looks for it
```

**Specs are `*.e2e.ts`, not `*.spec.ts`.** `*.spec.ts` belongs to Jest, whose
config sets no `testMatch` and would otherwise sweep these up. `e2e/` is also in
Jest's `testPathIgnorePatterns`.

## Conventions

**Selectors are `[data-test="…"]` only** — no CSS classes, no text matching, no
XPath. webui emits this attribute uniformly, from both the legacy `[ixTest]`
directive and `@truenas/ui-components` `testId` inputs, because `main.ts`
provides `{ provide: TN_TEST_ATTR, useValue: 'data-test' }`.

A missing `data-test` is a defect to fix upstream — in webui or in
`@truenas/ui-components` — not a reason to fall back to a fragile selector. Both
are in-house. See `truenas-ui-components/docs/test_ids.md` for the patterns.

**API sets up, UI asserts.** A test must never use the API to perform the action
it is testing. Naming carries the rule: UI actions are imperative
(`createPool()`), API preconditions are `given*` (`givenPool()`).

**No fixed sleeps.** Wait on conditions — Playwright's auto-retrying assertions
for the UI, job state for the API.
