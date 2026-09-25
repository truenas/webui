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
rewrite. To see where it stands, run `yarn check-api-migration --report`.

## What is in place

| Piece | Where |
|---|---|
| `@truenas/api-client` as a runtime dependency (7.0.1 at the time of writing) | `package.json` |
| The client instance, typed against `v27.0.0` | `src/app/modules/websocket/typed-api/typed-api-client.token.ts` |
| `TypedApiService`, the migration target for `ApiService` | `src/app/modules/websocket/typed-api/typed-api.service.ts` |
| The version the UI is written against | `WebUiApiDirectory` in the token file |
| `mockTypedApi()` and `MockTypedApiService`, the spec double | `src/app/core/testing/utils/mock-typed-api.utils.ts`, `src/app/core/testing/classes/mock-typed-api.service.ts` |
| `EmptyTypedApiService`, the global guard against unmocked specs | `src/app/core/testing/utils/empty-typed-api.service.ts`, registered in `src/setup-jest.ts` |

The typed client owns **the** WebSocket — one per tab, on `/api/v27.0.0`. It
is opened at startup by an app initializer in `main.ts`, unconditionally on
purpose: migrated pages run entirely on it, so there is no build in which it
can be left closed.

Since NAS-143989 the legacy client has no socket of its own. Everything still
riding `ApiService` — the jobs store, the debug panel, every call that has not
moved — goes over the same connection: `WebSocketHandlerService.responses$` is
`client.connection.messages()`, and `scheduleCall` writes through
`client.connection.send()`. Phase 0 and 1 ran two sockets and two sessions per
tab, which showed up as two entries in `auth.sessions` and every audited call
recorded twice. That is gone.

What the handler still owns is what the client has no seam for: the call queue
and its 20-concurrent ceiling, the debug panel's logging, and its mock
interception. Connection state — open, closed, refused, shutting down — is
`ConnectionService`'s (NAS-143990). What it lost with the socket: the reconnect timer (the client's
connection retries on its own), `core.set_options` on open (the client sends
it), and the ping timer (the client pings every 20s, so `PingService` is
gone too).

### One session

The user signs in on the typed client. `AuthService` drives
`client.authenticator` (`loginWithUserPass`, `loginWithOtp`, `loginWithToken`,
`logout`), so the session holds the credentials, the session's roles and the
`reconnect_token` chain — every login asks middleware for the next token, and
the sign-in page spends it on the next reconnect. `WebSocketStatusService`
projects `authenticator.authenticated$`, so "the app is authenticated" is a
statement about that session.

One socket means one session: a login authenticates the legacy calls as much as
the typed ones, and there is nothing to keep in step. An `ENOTAUTHENTICATED`
refusal on either path therefore means the same thing — the session lapsed —
and both answer it the same way: drop the call, end the app's session, and let
`AppComponent` bounce the tab to /signin, which logs straight back in from the
stored token and navigates back to `redirectUrl`.

Call sites never authenticate. Every typed request is held until the session is
authenticated, so a call made before sign-in or across a reconnect waits
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

The spec half has a codemod. Once an area's production code injects
`TypedApiService`, run

```bash
yarn codemod:typed-api-specs src/app/pages/<area>
yarn codemod:typed-api-specs --only 'keychaincredential.*' src/app/pages/<consumers>   # a shared service moved
yarn codemod:typed-api-specs --keep-legacy 'cloudsync.create' src/app/pages/<area>    # some calls stay legacy
```

It rewrites `mockApi` / `mockCall` / `mockJob` to `mockTypedApi` /
`mockTypedCall` / `mockTypedQuery` / `mockTypedJob`, renames `ApiService` and
`MockApiService`, moves `call('x.query', [filters, options])` assertions to
`query` / `queryOne` / `queryCount`, adds `await spectator.fixture.whenStable()`
after `spectator.component.submit()`, and fixes the imports. It prints
`file:line` for what it left alone: query factories, `mockProvider(ApiService)`
(bare or with stubs: a spy object leaves the query verbs undefined), `jest.spyOn(api, 'call')`
in a spec whose queries moved, hand-written `method === 'x.query'` dispatch, `failApiCall`,
`emitSubscribeEvent`, `mockCallOnce`, `callAndSubscribe`,
`expect(api.call).not.toHaveBeenCalled()` / `.toHaveBeenCalledTimes(n)` (which name no method, so they
pass once a query has moved to `query`), and, under `--only` /
`--keep-legacy`, a bare `mockApi()`, since nothing in it says whether the
spec's calls moved.

`mockTypedApi()` is not a drop-in for everything `mockApi()` provided.
`mockApi()` also stubs `WebSocketStatusService`, `WebSocketHandlerService`,
`SubscriptionManagerService` and its own ICU-aware `TranslateService`. After
conversion a spec gets `setup-jest.ts`'s global `TranslateModule` instead. A
spec whose component injects one of those websocket services needs its own
`mockProvider`. The specs checked so far already have one.

Follow it with
`yarn lint:fix` on the changed files, then `tsc`. `tsc` is where the real
work is. Typed fixtures are checked against the generated directory, so a UI
interface cast (`as Pool[]` where the query returns `PoolEntry`) or a
`mockTypedCall('x', null)` for a method that returns something fails to
compile. Each of those is drift the legacy mocks were hiding. Run on all of
`src/app` at the time of writing, it rewrote 444 specs and flagged 84 for
hand conversion.

As the last consumer of a method moves, delete its entry from the hand-written
directory. The shrinking directories are the progress bar.

Guardrails, in place since NAS-143991 and both keyed to one list of finished
paths (`scripts/api-migration-areas.mjs`):

- `yarn check-api-migration` counts remaining legacy dependants per area, and
  runs in CI's lint job. `--report` prints the breakdown; the gate itself only
  fails on the list going stale — an entry that matches nothing, an entry that
  imports the legacy client again, or an area that has finished migrating and
  has not been pinned. It counts *files that import the client*, not `inject()`
  sites: about twenty dependants take `api: ApiService` as a parameter instead
  (the `*.form-config.ts` helpers, `ApiDataProvider`), and the import is what
  the lint rule below keys on, so the two agree on what "moved" means.
- A path-scoped `no-restricted-imports` (`migratedApiOverrides` in
  `eslint.config.mjs`) bans `ApiService` and `mockApi` in those same paths, so
  a finished area cannot slide back.

Adding a path is the last step of migrating it: once the area's last legacy
import goes, `check-api-migration` fails until it is listed. Infrastructure
that owns both clients by definition — `modules/websocket`, `core/testing`,
and `interfaces`, which only aliases generated types — is exempt.

### Phase 2 — move the infrastructure

Once most call sites are typed, move what still depends on the legacy socket:

- **Login.** Done (NAS-143988). `AuthService` drives `client.authenticator`
  (`loginWithUserPass`, `loginWithOtp`, `loginWithToken`, `logout`) and the
  typed session is the app's session.
- **The socket.** Done (NAS-143989). `WebSocketHandlerService` borrows
  `client.connection` instead of opening a socket, which retired the second
  session along with `WebSocketConnection`, `PingService`, the reconnect timer
  and the token-borrowing bridge NAS-143988 had put in as a stopgap.
- **Jobs store.** `job.effects.ts` subscribes to `core.get_jobs` on the typed
  client.
- **Connection UX.** Done (NAS-143990). `ConnectionService` is a thin layer
  over `client.connection`: `opened$` feeds `isClosed$` and
  `WebSocketStatusService`, `closes$.refused` feeds `isAccessRestricted$`,
  `reconnect()` cycles `setEnabled`, and `setEndpoint()` re-points it. It also
  holds the two UI-level flags with no counterpart on the connection —
  `prepareShutdown()` / `isSystemShuttingDown` and the access-restricted
  acknowledgement. The guard, the shutdown / restart / failover / config-reset
  pages, the GUI form and the forced password change read it instead of the
  handler, which is now only the legacy call queue and the debug panel.
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
   throw plain `Error`s: `ErrorParserService` takes its generic branch and
   shows the reason alone, without the `errname`, `extra` and trace that the
   legacy `call` path renders. A migrated `query` read is therefore a small
   downgrade in error reporting today (`cloudsync.credentials.query`,
   `keychaincredential.query`), and the first `job` site will inherit the
   same. Unchanged as of 7.0.1. Fix: a typed error class carrying the full
   payload; until then, route a query through `call` where the report
   matters. `call` is also the only verb that can act on `ENOTAUTHENTICATED`,
   which is why ending the app's session on that refusal lives there.
2. **Token sessions are the caller's to re-login.** Since 3.0.5 (commit
   `8f7d6e0`, "add token re-authentication and reconnect tokens") the client
   has `loginWithToken` and asks for a `reconnect_token` on every v26+ login.
   By design it re-authenticates automatically only for password and API-key
   sessions; a token session is not covered, because the token is single-use.
   `AuthService` is that caller: it stores the `reconnect_token` every login
   returns, and the sign-in page spends it after a reconnect. Middleware holds
   tokens in memory for 600s and a `middlewared` restart voids them, so a
   reconnect across a restart lands back on the password prompt.
3. **`AuthError` does not carry the response it came from.** `loginWithToken`
   throws on every non-success, with the `response_type` interpolated into the
   message and nowhere else. `recoverLoginFailure` therefore has to read all of
   them back as `AUTH_ERR`, which collapses `EXPIRED`, `DENIED` and `REDIRECT`
   into one outcome on the token path — the path every reconnect takes. Only the
   message the sign-in page shows differs today (`LoginResult.Redirect` and
   `Denied` reach no UI from `loginWithToken`, only from the interactive login,
   which is unaffected because a password login throws on `AUTH_ERR` alone), so
   this is a fidelity gap rather than a broken flow. A `response` on the error,
   or a non-throwing variant, would close it. Still so in 7.0.1.
4. **A password login is cached in the authenticator.** `loginWithUserPass`
   keeps the plaintext password on the authenticator and replays it on every
   reconnect. The UI never wanted that — it keeps a single-use token instead —
   and there is no way to decline it. Worth closing in the library; until then
   a password session re-logs itself in on reconnect, racing the sign-in
   page's token login, which the authenticator's epoch guard resolves. Still so
   in 7.0.1.
5. **Parameterised subscriptions.** `EventName` excludes events that take
   subscription params (`method:param` style, e.g. file tailing), which the
   legacy `subscribe` supports. Needed before Phase 1 step 4.
6. **Query, message and connection types are not exported.** `QueryFilters`
   and `QueryProjection` are internal, so the wrapper forwards the query verbs
   through `Parameters<>` rather than declaring them; `TrueNasMessage` and
   `TrueNasConnection` are absent from the main entry too, so
   `ConnectionService` names the connection as
   `WebUiApiClient['connection']` (`TypedConnection`). Still so in 7.0.1.

   Partly closed there: 7.0.1 exports `TrueNasErrorFrame` and `TrueNasErrorData`
   from the main entry, where 6.x had them only under `testing`. The wrapper's
   own dispatch still types the frame by hand, but for a different reason now —
   `TrueNasErrorFrame` extends the *client's* `JsonRpcError` and carries
   `TrueNasErrorData`, while `ApiCallError` takes the UI's `JsonRpcError` with
   `ApiErrorDetails`. Converging those two is what would retire the cast.
7. **No message hook.** The debug panel and mock responses intercept messages
   in `WebSocketHandlerService`; the client has no equivalent seam. Since
   NAS-143989 the panel's *incoming* log is complete anyway — the handler reads
   the shared connection, so typed replies pass through it — but outgoing typed
   frames are still invisible, and a mock can only intercept a call scheduled
   through the handler. Needed before the handler can be deleted.
8. **Job type drift.** The client's `Job` is honest about `result` and
   `time_started` being `null` before a job starts; the UI's is not. The
   wrapper narrows for now; the UI should adopt the client's type.
9. **Test double** — shipped in 6.0 as `@truenas/api-client/testing`
   (`createFakeClient`, `mock.call` / `query` / `job` / `emit`, `withSpies`,
   `UnmockedCallError`, fixture builders; `truenas/api-client-ts` #54, #56,
   #59). webui's `MockTypedApiService` and `typed-api.service.spec.ts` run
   on it. The 6.0.2 release had the base connection's 20-second ping timer
   pending for every fake, which inside Angular's zone stopped fixtures from
   ever settling; 6.0.3 derives that timer from the socket stream
   (`truenas/api-client-ts#60`), so a fake holds no timer at all.
10. **`crypto.randomUUID`.** The client falls back to `getRandomValues` on
   insecure origins, so plain-http dev boxes work. Noting it because it is the
   kind of thing that breaks quietly.
11. **Properties named `title` were dropped** — fixed in 5.0.1. The
   generator's `stripNestedTitles` removed every non-root `title` key to stop
   `json-schema-to-typescript` hoisting aliases, taking real fields of that
   name with it: no generated interface had a `title` property while thirteen
   middleware models declared one. `truenas/api-client-ts#53` guards the
   strip on the value being a string, restores 24 declarations across the
   chain, and is correctly a breaking change, since 18 of them are required.
   The UI's casts for `cloudsync.providers` and `keychaincredential.used_by`
   are gone; the one that remains on providers is for `name`, which
   middleware types as a plain string and the UI narrows to its enum.
12. **Impossible intersections.** `S3CredentialsModel` types `skip_region`
    and `signatures_v2` as `boolean & string`, which is `never`. Something in
    the schema for those fields (a `bool | str` coercion, most likely) is
    being emitted as an intersection rather than a union. Harmless until a
    form tries to write those fields through the typed client. Still so in
    7.0.1, which regenerated the types.
13. **Version namespaces are type-only and partial.** Generated model types
    are reachable as `v27_0_0.Name`, and that is how the UI's interface files
    now alias them (`keychain-credential.interface.ts` is the pattern). Two
    limits, both in the client's `.d.ts` bundling: the const objects the
    generator emits for enums are exported type-only, so
    `v27_0_0.KeychainCredentialEntryType.SshKeyPair` does not compile in any
    version namespace, and a later namespace carries only the types that
    changed in that version, so `SSHKeyPairEntry` and
    `CredentialsVerifyResult` exist under `v25_10_0` but not `v27_0_0`. Until
    fixed (still so in 7.0.1): keep the UI's enums as value holders, and
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
