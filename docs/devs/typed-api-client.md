# Migrating to the typed API client

`@truenas/api-client` is the fully-typed, framework-agnostic client for the
middleware JSON-RPC API. Its method names, params and responses are generated
from `middlewared --dump-api`, so a typo in a method name or a wrong param
shape is a compile error, and there is no hand-maintained directory to keep in
sync with middleware.

The UI has its own client — `ApiService` over `WebSocketHandlerService` — with
hand-written directories (`src/app/interfaces/api/*-directory.interface.ts`,
about 1,350 lines describing 555 calls, 80 jobs and 31 events) that drift from
middleware and are used from roughly 900 `call`, 110 `job` and 45 `subscribe`
sites across 414 files. This document describes how the UI moves from one to
the other without a big-bang rewrite.

## What is in place

| Piece | Where |
|---|---|
| The client instance, typed against `v27.0.0` | `src/app/modules/websocket/typed-api/typed-api-client.token.ts` |
| `TypedApiService`, the migration target for `ApiService` | `src/app/modules/websocket/typed-api/typed-api.service.ts` |
| The version the UI is written against | `WebUiApiDirectory` in the token file |

The typed client owns a **second WebSocket**, opened at startup in parallel
with the legacy one (an app initializer in `main.ts` creates the service). That
is intentional: the two coexist for the whole migration, and the legacy socket
is removed last. Nothing is production-ready about running two sockets; this
is a `master`-only arrangement.

### How the two sessions stay in step

The legacy socket still carries login, the jobs store, the debug panel and
every call that has not moved. `TypedApiService` borrows authentication from
it once: when the typed socket is open and the legacy session is
authenticated, it mints a single-use token on the legacy socket
(`auth.generate_token`) and logs the typed socket in with it. From then on the
typed session runs the same token chain `AuthService` runs for the legacy one:
every login asks middleware for the next `reconnect_token`, and every
reconnect spends it. If middleware refuses the chained token, or the seed
failed, it borrows from the legacy session again. Logging out of the legacy
session logs the typed one out and drops the chain.

Call sites never authenticate and never need to know which socket a method
rides on. Every typed request is held until the typed session is
authenticated, so a call made during startup or across a reconnect waits
instead of being refused by middleware.

## Migrating a call site

Swap the injected service. The call syntax is the same.

```typescript
// before
private api = inject(ApiService);
this.api.call('system.info');
this.api.call('alert.dismiss', [uuid]);
this.api.job('pool.dataset.export_key', [dataset]);
this.api.subscribe('alert.list');

// after
private api = inject(TypedApiService);
this.api.call('system.info');
this.api.call('alert.dismiss', [uuid]);
this.api.job('pool.dataset.export_key', [dataset]);
this.api.subscribe('alert.list');
```

Where things differ:

- **Response types come from the client.** Name a shape with
  `CallResponse<WebUiApiDirectory, 'system.info'>` rather than
  `ApiCallResponse<'system.info'>`. When a generated type disagrees with a
  hand-written interface in `src/app/interfaces`, the generated one is the
  truth — it came from middleware. Fix or retire the interface; do not cast the
  response into it.
- **Queries have verbs.** `call('user.query', [filters, { get: true }])` is
  `queryOne('user.query', filters)`; `{ count: true }` is `queryCount`. The
  verb picks the result type, so there is nothing to narrow.
- **Events are a discriminated union** on `msg`. A removal carries an `id`
  and no `fields`; narrow before reading.
- **Errors are unchanged.** `call` throws the same `ApiCallError` as
  `ApiService`, with the full JSON-RPC payload, so `ErrorHandlerService` and
  form validation work as before. `job` throws `FailedJobError` on failure.
- **Specs** mock `TypedApiService` the way they mock any service:
  `mockProvider(TypedApiService, { call: jest.fn(() => of(...)) })`. A
  `mockTypedApi()` helper mirroring `mockApi()` is a Phase 1 deliverable.

## Phases

### Phase 0 — foundation (this branch)

- `@truenas/api-client` is a runtime dependency.
- `TypedApiService` and the client token exist, with the authentication bridge,
  and the socket opens at startup.
- One pilot consumer, `KeychainCredentialService`, to prove the path end to
  end. It surfaced the first drift: `SshConnectionSetup` was one loose object
  where middleware declares a discriminated union, and is now shaped to match.
- This document.

### Phase 1 — move call sites

Migrate by feature area, lowest risk first:

1. Read-only `call` sites in services and stores.
2. Mutating `call` sites (forms).
3. `job` sites.
4. `subscribe` sites, once parameterised subscriptions are supported (see gaps).

Each area is a small PR: swap the injection, fix the types the compiler now
reports, update the spec's mock, and verify against a box. Prefer several
narrow PRs to one wide one; the diff per file is mechanical and easy to review
in isolation.

As the last consumer of a method moves, delete its entry from the hand-written
directory. The shrinking directories are the progress bar.

Guardrails to add early in this phase:

- A script that counts remaining `inject(ApiService)` sites per top-level
  folder, so progress is visible and regressions are obvious.
- A path-scoped `no-restricted-imports` rule for `ApiService` in folders that
  have finished migrating, so they cannot slide back.

### Phase 2 — move the infrastructure

Once most call sites are typed, move what still depends on the legacy socket:

- **Login.** `AuthService` moves to `client.authenticator`
  (`loginWithUserPass`, `loginWithOtp`, `loginWithToken`, `logout`). At that
  point the token bridge in `TypedApiService` is deleted and the typed session
  becomes the primary one.
- **Jobs store.** `job.effects.ts` subscribes to `core.get_jobs` on the typed
  client.
- **Connection UX.** Reconnect, shutdown, failover and password-change flows
  that reach into `WebSocketHandlerService` directly (about ten files) move to
  `client.connection` (`opened$`, `hasConnectionError$`, `setEnabled`).
- **Debug panel and mocks.** Need a hook on the client (see gaps).

### Phase 3 — remove the legacy client

Delete `ApiService`, `WebSocketHandlerService`, `SubscriptionManagerService`,
`DuplicateCallTrackerService`, the hand-written directories and `mockApi`.
Rename `TypedApiService` back to `ApiService` if that reads better.

## Known gaps and library follow-ups

Things the wrapper works around today, in the order they block the phases
above. Each is a change for `truenas/api-client-ts`.

1. **Errors lose their payload.** `client.api.call` reduces a JSON-RPC error
   to its `reason` string. The UI needs `errname` (auth handling) and `extra`
   (field validation), so `TypedApiService.call` does its own round trip over
   `client.connection`. `query*` and `job` still go through the client and so
   throw plain `Error`s. Fix: a typed error class carrying the full payload.
2. **Token sessions are the caller's to re-login.** Since 3.0.5 (commit
   `8f7d6e0`, "add token re-authentication and reconnect tokens") the client
   has `loginWithToken` and asks for a `reconnect_token` on every v26+ login.
   By design it re-authenticates automatically only for password and API-key
   sessions; a token session is not covered, because the token is single-use.
   The bridge is that caller: it chains the `reconnect_token` each typed
   login returns and falls back to a fresh token from the legacy socket when
   the chain breaks, since middleware holds tokens in memory for 600s and a
   `middlewared` restart voids them. Nothing to change in the library.
3. **Parameterised subscriptions.** `EventName` excludes events that take
   subscription params (`method:param` style, e.g. file tailing), which the
   legacy `subscribe` supports. Needed before Phase 1 step 4.
4. **Query types are not exported.** `QueryFilters` and `QueryProjection`
   are internal, so the wrapper forwards the query verbs through
   `Parameters<>` rather than declaring them. Export them.
5. **No message hook.** The debug panel and mock responses intercept messages
   in `WebSocketHandlerService`; the client has no equivalent seam. Needed for
   Phase 2.
6. **Job type drift.** The client's `Job` is honest about `result` and
   `time_started` being `null` before a job starts; the UI's is not. The
   wrapper narrows for now; the UI should adopt the client's type.
7. **Test double.** A `createFakeClient()` for consumers' specs would replace
   the hand-rolled fake in `typed-api.service.spec.ts`.
8. **`crypto.randomUUID`.** The client falls back to `getRandomValues` on
   insecure origins, so plain-http dev boxes work. Noting it because it is the
   kind of thing that breaks quietly.

## Version policy

`WebUiApiDirectory` pins `v27.0.0`. The literal must stay at the
`createTrueNasClient` call site — forwarding it through a variable widens the
derived surface to the oldest supported version without a compile error.
Bumping the version is a one-line change followed by a compile pass; methods
that moved between call and job directories, or changed shape, surface as
errors at their call sites.
