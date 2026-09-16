# Migrating to the typed API client

`@truenas/api-client` is the fully-typed, framework-agnostic client for the
middleware JSON-RPC API. Its method names, params and responses are generated
from `middlewared --dump-api`, so a typo in a method name or a wrong param
shape is a compile error, and there is no hand-maintained directory to keep in
sync with middleware.

The UI has its own client — `ApiService` over `WebSocketHandlerService` — with
hand-written directories (`src/app/interfaces/api/*-directory.interface.ts`,
about 1,350 lines describing 555 calls, 80 jobs and 31 events) that drift from
middleware. When the migration started on 2026-09-08 they were used from
roughly 870 `call`, 110 `job` and 45 `subscribe` sites across 414 files. This
document describes how the UI moves from one to the other without a big-bang
rewrite. To see where it stands, count `inject(ApiService)` against
`inject(TypedApiService)` in non-spec files.

## What is in place

| Piece | Where |
|---|---|
| `@truenas/api-client` as a runtime dependency (6.0.3 at the time of writing) | `package.json` |
| The client instance, typed against `v27.0.0` | `src/app/modules/websocket/typed-api/typed-api-client.token.ts` |
| `TypedApiService`, the migration target for `ApiService` | `src/app/modules/websocket/typed-api/typed-api.service.ts` |
| The version the UI is written against | `WebUiApiDirectory` in the token file |
| `mockTypedApi()` and `MockTypedApiService`, the spec double | `src/app/core/testing/utils/mock-typed-api.utils.ts`, `src/app/core/testing/classes/mock-typed-api.service.ts` |
| `EmptyTypedApiService`, the global guard against unmocked specs | `src/app/core/testing/utils/empty-typed-api.service.ts`, registered in `src/setup-jest.ts` |

The typed client owns a **second WebSocket**, opened at startup in parallel
with the legacy one (an app initializer in `main.ts` creates the service). That
is intentional: the two coexist for the whole migration, and the legacy socket
is removed last. The initializer is unconditional on purpose: the Backup
Credentials page already runs entirely on the typed client, so gating the
socket on a flag would break it. Every build of `master`, production builds
included, therefore opens both sockets and holds two authenticated sessions
per tab, which is visible in session lists and audit records. That is
acceptable for `master` while the migration runs and is not something a
release branch should ship until login has moved to the typed client.

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
instead of being refused by middleware. A login that fails is retried with
backoff (1s, 2s, 4s); after that the bridge gives up and the held requests
fail with `TypedApiSessionError` rather than hanging. The next socket reopen
or legacy re-login starts a fresh attempt.

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
- **Discriminants are literals, enums stay for writing.** Generated types
  carry the wire literal (`type: 'SSH_KEY_PAIR'`); the UI's enums are still
  assignable *to* those literals and comparable with them, but a literal is
  not assignable to an enum. So an interface that describes API data types its
  discriminant as the literal, spelled as the enum's value so the two cannot
  drift: `` type: `${KeychainCredentialType.SshKeyPair}` ``. Code keeps
  writing and comparing with the enum.
- **Optional on the wire is optional in the interface.** Middleware defaults
  (`port = 22`) come through as optional properties. A UI interface that
  requires them cannot receive the generated value; loosen it.
- **Specs** use `mockTypedApi()` from
  `app/core/testing/utils/mock-typed-api.utils`, the typed counterpart of
  `mockApi()`: `mockTypedCall`, `mockTypedCallError`, `mockTypedQuery`,
  `mockTypedJob`, and `MockTypedApiService` for adjusting answers on the fly. Behind it is a real
  `@truenas/api-client` running on the package's own fake connection
  (`@truenas/api-client/testing`, since 6.0), so the real dispatch, job
  correlation and subscriptions run and only the *answers* are scripted. The
  client is strict: a call nothing scripted fails with `UnmockedCallError`
  naming the method. Fixtures for a query or entry response are typed as the
  generated entity (for example `CloudSyncCredentialEntry`), not the UI's
  reading of it. `mockTypedCall` refuses `.query` methods; script those with
  `mockTypedQuery`, which feeds `query`, `queryOne` and `queryCount` from one
  set of rows. The double's `call` runs the same `dispatchTypedCall` as
  `TypedApiService`, so an error scripted with `mockTypedCallError(method,
  { errname, extra })` is thrown as the `ApiCallError` production throws,
  `extra` included, which is what a form's error-path spec needs. For
  connection-level scenarios reach the client itself:
  `spectator.inject(MockTypedApiService).client.connection.simulateClose()`.
  The fake answers frames on a microtask, as a socket would, so a spec that
  asserts on the outcome of a submit needs `await spectator.fixture.whenStable()`
  after `submit()`; asserting that the call was made does not, since the frame
  goes out synchronously. The same applies before a submit when the component
  loads data on init and gates saving on it: settle, then `detectChanges()`,
  because a loading flag that flipped back on the microtask has not yet
  crossed an input binding such as `<ix-form [externalLoading]>`.
- **`TypedApiService`'s own spec** provides `TYPED_API_CLIENT` with a
  non-strict `createFakeClient` and answers frames by hand with
  `connection.reply` / `replyError`, which is how the auth bridge and the
  service's own dispatch are exercised end to end without a socket.
- **A spec that reaches `TypedApiService` unmocked fails fast.**
  `setup-jest.ts` provides `EmptyTypedApiService` globally, the way it
  provides `EmptyApiService`, so an unmocked call throws
  `TypedApiService injection not provided` instead of building the real
  client, which would open a WebSocket to `environment.remote` from jsdom and
  hang the test until its timeout. That guard exists because the first
  service migration caused exactly that: `KeychainCredentialService` moved,
  and every spec of every component that renders `ix-ssh-credentials-select`
  timed out at 30 seconds with nothing in the assertion to explain why.
- **Migrating a service migrates its consumers' specs.** The service's own
  spec is the small part. Every spec that used `mockCall('x.query', ...)` to
  feed that service through the legacy `ApiService` now needs
  `mockTypedQuery('x.query', ...)` instead, including specs of components
  that only embed a consumer. Before moving a service, grep for its methods'
  names in `mockCall(` across `src/app` and convert those specs in the same
  change. A spec's `mockProvider(TheService)` is not proof it is safe: a
  component that lists the service in its own `providers: [...]` gets a fresh
  real instance that the spec's mock never reaches, so grep for that too.
- **A shared interface is retired by its last consumer.** Until then the
  service that fronts it is the one place that converts, with a named adapter
  rather than a cast at each call site (`CloudCredentialService`'s
  `toCloudSyncCredential` is the pattern).

## Phases

### Phase 0 — foundation (this branch)

- `@truenas/api-client` is a runtime dependency.
- `TypedApiService` and the client token exist, with the authentication bridge,
  and the socket opens at startup.
- One pilot consumer, `KeychainCredentialService`, to prove the path end to
  end. It surfaced the first drift: `SshConnectionSetup` was one loose object
  where middleware declares a discriminated union, and is now shaped to match.
- The Backup Credentials page, cloud credentials included, as the first whole
  feature area: eight components, `CloudCredentialService`,
  `KeychainCredentialService`, and the `mockTypedApi()` spec helper.
- Its interfaces alias the client's generated types (`v27_0_0.*` where the
  namespace names the type, derived from the directory where it does not);
  `keychain-credential.interface.ts` is the pattern.
- The global `EmptyTypedApiService` guard, added after the first service
  migration hung six spec suites (see the spec rules above).
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
   `client.connection` (`dispatchTypedCall`, shared with the spec double).
   `query*` and `job` still go through the client and so
   throw plain `Error`s. Unchanged as of 6.0.3. Fix: a typed error class
   carrying the full payload. Related and deliberate: `TypedApiService`
   throws `ENOTAUTHENTICATED` like any other error rather than logging the
   app out as `ApiService` does, because the typed session is secondary and
   the bridge re-establishes it; the legacy behaviour moves over with login
   in Phase 2.
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
4. **Query and message types are not exported.** `QueryFilters` and
   `QueryProjection` are internal, so the wrapper forwards the query verbs
   through `Parameters<>` rather than declaring them; `TrueNasMessage` and
   the error-frame types are absent from the main entry too, so the wrapper's
   own dispatch types the frame by hand (the `testing` entry does export
   `TrueNasErrorFrame` and `TrueNasErrorData`). Unchanged as of 6.0.3.
5. **No message hook.** The debug panel and mock responses intercept messages
   in `WebSocketHandlerService`; the client has no equivalent seam. Needed for
   Phase 2.
6. **Job type drift.** The client's `Job` is honest about `result` and
   `time_started` being `null` before a job starts; the UI's is not. The
   wrapper narrows for now; the UI should adopt the client's type.
7. **Test double** — shipped in 6.0 as `@truenas/api-client/testing`
   (`createFakeClient`, `mock.call` / `query` / `job` / `emit`, `withSpies`,
   `UnmockedCallError`, fixture builders; `truenas/api-client-ts` #54, #56,
   #59). webui's `MockTypedApiService` and `typed-api.service.spec.ts` run
   on it. The 6.0.2 release had the base connection's 20-second ping timer
   pending for every fake, which inside Angular's zone stopped fixtures from
   ever settling; 6.0.3 derives that timer from the socket stream
   (`truenas/api-client-ts#60`), so a fake holds no timer at all.
8. **`crypto.randomUUID`.** The client falls back to `getRandomValues` on
   insecure origins, so plain-http dev boxes work. Noting it because it is the
   kind of thing that breaks quietly.
9. **Properties named `title` were dropped** — fixed in 5.0.1. The
   generator's `stripNestedTitles` removed every non-root `title` key to stop
   `json-schema-to-typescript` hoisting aliases, taking real fields of that
   name with it: no generated interface had a `title` property while thirteen
   middleware models declared one. `truenas/api-client-ts#53` guards the
   strip on the value being a string, restores 24 declarations across the
   chain, and is correctly a breaking change, since 18 of them are required.
   The UI's casts for `cloudsync.providers` and `keychaincredential.used_by`
   are gone; the one that remains on providers is for `name`, which
   middleware types as a plain string and the UI narrows to its enum.
10. **Impossible intersections.** `S3CredentialsModel` types `skip_region`
    and `signatures_v2` as `boolean & string`, which is `never`. Something in
    the schema for those fields (a `bool | str` coercion, most likely) is
    being emitted as an intersection rather than a union. Harmless until a
    form tries to write those fields through the typed client. Still so in
    6.0.3.
11. **Version namespaces are type-only and partial.** Generated model types
    are reachable as `v27_0_0.Name`, and that is how the UI's interface files
    now alias them (`keychain-credential.interface.ts` is the pattern). Two
    limits, both in the client's `.d.ts` bundling: the const objects the
    generator emits for enums are exported type-only, so
    `v27_0_0.KeychainCredentialEntryType.SshKeyPair` does not compile in any
    version namespace, and a later namespace carries only the types that
    changed in that version, so `SSHKeyPairEntry` and
    `CredentialsVerifyResult` exist under `v25_10_0` but not `v27_0_0`. Until
    fixed (still so in 6.0.3): keep the UI's enums as value holders, and
    derive a missing type from the directory
    (`CallResponse<D, 'keychaincredential.create'>`) rather than importing it
    from an older version's namespace.

## Version policy

`WebUiApiDirectory` pins `v27.0.0`. The literal must stay at the
`createTrueNasClient` call site — forwarding it through a variable widens the
derived surface to the oldest supported version without a compile error.
Bumping the version is a one-line change followed by a compile pass; methods
that moved between call and job directories, or changed shape, surface as
errors at their call sites.
