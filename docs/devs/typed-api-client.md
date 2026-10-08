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
| `@truenas/api-client` as a runtime dependency (8.0.0 at the time of writing) | `package.json` |
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

What the handler still owns is what the client has no seam for: the legacy call
queue, the debug panel's logging, and its mock interception. The ceiling on
concurrent calls is no longer the handler's alone: middleware refuses the 21st
call in flight on a connection, whoever sent it, so `limitConcurrentCalls` holds
the whole tab to 19 on the connection's `send`, one short of the ceiling to
leave room for the keepalive ping (see gap 20). Connection state — open, closed, refused, shutting down — is
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
- **Filters built before the call** are typed
  `TypedQueryFilter<WebUiQueryEntity<'user.query'>>[]`, both from the token
  file, since the client does not export its own `QueryFilters` yet (gap 6).
  An `OR` takes a list of filter *lists*, `['OR', [[a], [b]]]`, where
  `ParamsBuilder` writes `['OR', [a, b]]`.
- **Events are a discriminated union** on `msg`. A removal carries an `id`
  and no `fields`; narrow before reading.
- **Calls made before sign-in use `callUnauthenticated`.** Every other verb
  waits for an authenticated session, so a method middleware answers without
  one (`system.advanced.login_banner`, `user.has_local_administrator_set_up`,
  `truenas.managed_by_truecommand`, `user.setup_local_administrator`) would
  hang on the sign-in page through `call`. `callUnauthenticated` waits for the
  client only. The legacy client sent these regardless of the session, so
  nothing marks them; check whether a page runs before login when moving it.
- **`callAndSubscribe` is `queryAndSubscribe`.** It queries the collection,
  then folds its change events into the rows by `id` (`followCollection`), and
  takes filters and `extra` but no `select`, since the events carry whole rows.
  Script it in specs with `mockTypedQuery` for the rows and `emitEvent` for the
  changes.
- **A form's enums still come back as literals.** A config read (`smb.config`,
  `ssh.config`, `ups.config`) spells its enum fields as the wire literals, and a
  form control typed with the UI's enum will not take them. Cast the field to
  the enum where the form is patched, with a comment, rather than retyping the
  control; on the way out an enum is already assignable to the literal. A
  control whose options come from a choices call (`smb.unixcharset_choices`)
  holds a wire value typed as `string`, and is cast to the payload's field type
  at the submit.
- **A query whose params are one object is a `call`.** `audit.query` takes its
  filters and options inside a single object rather than as
  `[filters, options]`, so it is not a typed query method: call it with `call`
  and script it with `mockTypedCall`.
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
  goes out synchronously. A service or store spec, with no fixture to wait on,
  awaits `settleTypedApi()` from the same utils instead. The same applies before a submit when the component
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

Two things it gets wrong, both found moving `src/app/services`. A spec that
already has a `mockTypedApi([...])` gets a second one rather than a merged
one, and the later provider hides the earlier; merge them by hand. And a
method a component reads both directly and through a migrated service (the
replication wizard's `replication.query`, the S3 grant rows' `user.query`)
needs a mock on both doubles, which `--only` cannot express: it moves the
legacy mock rather than copying it.

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
   same. Unchanged as of 8.0.0. Fix: a typed error class carrying the full
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
   or a non-throwing variant, would close it. Still so in 8.0.0.
4. **A password login is cached in the authenticator.** `loginWithUserPass`
   keeps the plaintext password on the authenticator and replays it on every
   reconnect. The UI never wanted that — it keeps a single-use token instead —
   and there is no way to decline it. Worth closing in the library; until then
   a password session re-logs itself in on reconnect, racing the sign-in
   page's token login, which the authenticator's epoch guard resolves. Still so
   in 7.0.1.
5. **Parameterised subscriptions.** `EventName` excludes events that take
   subscription params (`method:param` style, e.g. file tailing), which the
   legacy `subscribe` supports. Needed before Phase 1 step 4. Until then the
   log tails stay on `ApiService`: `ConsoleMessagesStore` and the job progress
   dialog's `filesystem.file_tail_follow`, the installed app's container logs
   (`app.container_log_follow`), next to `NetworkService`'s `reporting.realtime`,
   and the dashboard's `WidgetResourcesService`, which streams
   `reporting.realtime` and `app.stats`.
6. **Query, message and connection types are not exported.** `QueryFilters`
   and `QueryProjection` are internal, so the wrapper forwards the query verbs
   through `Parameters<>` rather than declaring them; `TrueNasMessage` and
   `TrueNasConnection` are absent from the main entry too, so
   `ConnectionService` names the connection as
   `WebUiApiClient['connection']` (`TypedConnection`). Still so in 8.0.0.

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

14. **Methods missing from the dump.** `interface.lag_supported_protocols` is
    in no generated directory, most likely because middleware marks it
    private. `NetworkService` therefore keeps `ApiService` for it, next to
    `reporting.realtime` (gap 5), and `src/app/services` cannot be pinned as a
    whole until both have a typed route. `kerberos.keytab.kerberos_principal_choices`
    and `nfs.add_principal` are missing the same way, so the directory services
    form's credential step and the NFS service's Add SPN dialog keep `ApiService`
    too, and `pages/directory-service` and `pages/services` are pinned below their
    roots.

15. **Dates are typed as strings.** Middleware sends a `datetime` as an
    `{ $date: <ms> }` envelope and a `date` as `{ $type: 'date', $value }`, and
    the client passes both through untouched, but the generated types declare
    them as plain `string`. `system.info`'s timestamps and the dates in
    `truenas.license.info` hit this first; `SystemInfoEffects` narrows them
    once, in `toSystemInfo` and `normalizeLicense`, to the UI's `ApiTimestamp`
    and `ApiDate`. Fix: emit the envelopes in the generator. The same cast is
    where the license's missing top-level `expires_at` would hide, so `License`
    declares it optional; the readers fall back to the `Support` feature's date.

16. **An event model without its `fields` wrapper.** `pool.scan` declares its
    `changed` payload as `{ name, scan }` at the top level, while middleware
    sends it under `fields` like every other collection update (the legacy
    readers take `event.fields.scan` and work). The client forwards the frame
    untouched, so the generated type names properties that are not there.
    `poolScanFromEvent` in `app/helpers/pool-scan-event.helper.ts` reads the
    wire shape once for every consumer. Fix: wrap event payloads in the
    generator, or correct the model in middleware.

17. **Event subscriptions are never released.** `client.api.events` shares one
    stream per event with `resetOnRefCountZero: false` and never sends
    `core.unsubscribe`, where the legacy `subscribe` unsubscribes when its last
    consumer goes. For a collection that only emits on change (`pool.query`,
    `app.query`) that costs little. For an event source that pushes on a timer
    (`reporting.realtime`, `app.stats`, `container.metrics`) it would keep
    streaming after the page that wanted it is closed, so those must not move
    until the client releases subscriptions, even once gap 5 lets them compile.
    `container.metrics` takes no params and already compiles, so
    `ContainersStore` keeps `ApiService` for that one subscription. The apps
    pages do the same for `app.stats` (`AppsStatsService`) and
    `reporting.realtime` (the app details' resources card).

18. **`directoryservices.update` asks for a discriminant the form never sends.**
    The generated input requires `service_type` inside `configuration` as well
    as at the top level; the directory services form has only ever sent the
    top-level one, and middleware has accepted that. The migration keeps the
    request unchanged, so `toDirectoryServicesUpdateArgs` asserts the generated
    shape over a payload without the inner field. Sending it is a one-line
    change in `transformFormDataToApiPayload`, but it changes the request, so
    it wants a box check of all three service types first, or a correction to
    the model in middleware if the inner field is not meant to be required.

19. **Drift found moving VMs and containers.** Four places where the generated directory and
    what middleware or the UI actually does disagree, each handled at one site:
    - `container.query`'s change event is declared with a numeric `id` and a whole row, but a
      status-only change arrives keyed by the container's *name* and carrying only `status`.
      `ContainersStore` reads the event as that wire shape (`ContainerQueryEvent`) rather than the
      generated one, and keeps its name-matching workaround.
    - `lxc.update` declares `v4_network` and `v6_network` as optional strings, while the global
      settings form has always cleared a network by sending `null`. The request is unchanged and
      asserted to the generated input at the submit; worth a box check before dropping the `null`.
    - `lxc.config` is not an event source in any version's event directory, so the containers
      config store's subscription to it could never have fired. It is gone; the header reloads
      the config after the settings form saves, which is what kept it current.
    - `vm.device.update` and `container.device.update` type `attributes` as
      `{ [k: string]: unknown }`, which a device interface has no index signature to satisfy, where
      the matching `create` takes the typed device union. The call sites spread the attributes into
      an anonymous object rather than cast.
20. **No limit on concurrent calls.** Middleware holds 20 calls per connection
    (ten running, ten waiting) and refuses the next with "Maximum number of
    concurrent calls (20) has exceeded". The client sends whatever it is given.
    While the two clients shared a socket and only the legacy queue counted, a
    page load put up to 26 in flight and middleware refused the excess — a
    click that did nothing, or a `core.subscribe` refused and a store left
    stale for the session. `limitConcurrentCalls` closes it from the UI by
    replacing `connection.send` on the instance, which works because the
    client's verbs and authenticator all go out through that method. Two
    frames do not: `core.set_options` on open, answered before anything else is
    sent, and the 20-second `core.ping`, which is why the gate stops at 19. A
    `maxConcurrentCalls` option on the client, counting its own ping, would
    retire the patch and the spare slot.

21. **Drift found moving data protection.** Handled at one site each:
    - `replication.create` / `update` and `replication.count_eligible_manual_snapshots` declare
      their dataset lists as non-empty (`[string, ...string[]]`). The forms build `string[]` and
      require a dataset before submitting, so `toReplicationCreateArgs` and
      `toCountManualSnapshotsArgs` hand the payload over unchanged.
    - `TransportMode.Legacy` (`LEGACY`) is in no generated transport union and no form offered it,
      so the member is gone.
    - `cloudsync.list_directory` returns loose records (rclone's `lsjson` output);
      `toCloudSyncDirectoryListing` names the fields the explorers read.
    - `cloud_backup.list_snapshots` types `time` as a string where the wire sends a `$date`
      envelope (gap 15); `toCloudBackupSnapshot` reads it as the envelope.
    - The task entries (`cloud_backup`, `cloudsync`, `pool.snapshottask`, `replication`,
      `rsynctask`, `vmware`) are read into the UI interfaces through a `toX` adapter per
      interface, as `toVirtualMachine` does, rather than retyping every consumer.
    - `selectJobsByMethod` keys on the legacy `ApiJobMethod`, so `cloud_backup.sync` and
      `rsynctask.run` stay in the job directory until the jobs store moves.

22. **Drift found moving datasets.** Handled at one site each:
    - `pool.dataset.query` rows type every ZFS property as a loose record and declare neither
      `mounted` nor `share_type`; `toDataset` reads them into `Dataset`, and `toDatasetDetails` does the
      same for `pool.dataset.details`, which middleware declares as a list of loose records.
    - `pool.dataset.update` takes `user_properties` as a `{ key, value }` list, as `create` does. The
      UI's `DatasetUpdate` had it as a record; nothing wrote it, so the interface now matches.
    - `pool.dataset.get_quota` declares every shape a query can return across all four kinds of quota,
      and types its filters over the union, so only fields every kind has can be named.
      `toDatasetQuotas` and `toDatasetQuotaFilters` read the user and group rows the quota pages use.
      It is not a `.query` method, so it is called with `call`, but it has an entity, so the fake
      answers it as a query: script it with `mockTypedQuery`.
    - `pool.dataset.checksum_choices` declares a fixed set of keys, which an interface without an
      index signature cannot be read as `Choices`; the dataset form copies it into one first.
    - `filesystem.getacl` and `filesystem.acltemplate.by_path` spell tags, types and permissions as
      wire literals and do not pair `acltype` with the kind of entries; `toAcl` and
      `toAclTemplateByPath` read them into the editors' types.
    - `pool.snapshot.query` types each property's `parsed` as `unknown` and `retention.datetime` as a
      string (gap 15); `toZfsSnapshot` reads rows and change events alike.
    - `pool.dataset.encryption_summary` and `pool.dataset.unlock` stay in the job directory:
      `UploadService.uploadAsJob` takes the legacy `ApiJobMethod`, and the unlock dialog starts both
      through it when a key file is uploaded.

23. **Drift found moving storage.** Handled at one site each:
    - The query rows are read into the UI interfaces through a `toX` adapter per interface: `toPool`
      (`pool.query`: enums as literals, timestamps as strings per gap 15, and no `is_upgraded` or tier
      sizes), `toDisk` (`disk.query`: `bus`, `type` and the power settings as strings), `toEnclosure`
      (`enclosure2.query`) and `toScrubTask` (`pool.scrub.query`). `disk.temperature_alerts` returns
      alerts, so it shares `toAlert` with the alerts store, which now lives in `alert.interface.ts`.
    - `disk.details` is declared as a loose record or list, because its shape depends on `type`.
      `toDiskDetails` reads the used/unused split every caller asks for, the unused-disk select
      included.
    - `pool.create` and `pool.update` narrow each vdev class to the layouts it allows and `checksum`
      to its algorithms; the wizard builds every class from one `CreateVdevLayout`.
      `toPoolCreateArgs` and `toPoolUpdateArgs` hand the payload over unchanged.
    - Some UI interfaces described fields middleware does not send, or missed ones it does.
      `SystemDatasetConfig` named `is_decrypted`, `uuid_a` and `uuid_b` and is now the generated
      config; `ZfsTierConfig` gains the `id` it carries; `PoolAttachParams` (no `passphrase`,
      `target_vdev` and `new_disk` required), `PruneDedupTableParams` and `PoolFindResult` alias the
      generated types.
    - `core.get_jobs` is a query method, so `PoolExtendJobService` reads it with `query`, and the
      export dialog's pool count is `queryCount` rather than a `{ count: true }` cast.
    - The legacy specs' synchronous mocks hid an ordering bug. The pool wizard's general step picked
      its default encryption type once, on init, before the store's disk load could land, so SED
      never became the default on a real box. It now waits for the load to finish. The same
      synchronous answers had also kept the wizard's fake progress bar from ever starting its
      `interval` in the integration specs; they stub the bar now.

24. **Drift found moving apps.** Handled at one site each:
    - `app.query`, `app.available` / `app.latest` / `app.similar` and `catalog.get_app_details` are
      open models (`{ [k: string]: unknown }`) where the pages read the catalog's structure:
      `metadata`, `capabilities`, `run_as_context`, `versions`, `app_metadata`. They do not overlap
      the UI's `App`, `AvailableApp` and `CatalogApp`, so `toApp`, `toAvailableApp` and
      `toCatalogApp` convert through `unknown`, once, in `ApplicationsService`. The available
      apps' `last_update` is gap 15's `{ $date }` envelope again.
    - A workload's `container_port` and `host_port` are numbers on the wire; the UI had them as
      strings. `AppUsedPort` and `AppHostPort` now say `number`.
    - `docker.status` and `docker.state` declare `MIGRATING` and `MIGRATION_FAILED`, which
      `DockerStatus` does not have. `toDockerStatusData` reads the status as the enum, so those two
      show no label, as before.
    - `docker.update` declares `pool?: string`, while choosing no pool for apps has always sent
      `pool: null`. The request is unchanged and asserted to the generated input in
      `DockerStore.setDockerPool`; worth a box check before changing it.
    - `core.bulk` answers each call as `{ job_id, error, result }`, in the order given, so the
      image delete dialog reads its rows by index from the arguments it sent, rather than from the
      job's echoed `arguments`.

## Version policy

`WebUiApiDirectory` pins `v27.0.0`. The literal must stay at the
`createTrueNasClient` call site — forwarding it through a variable widens the
derived surface to the oldest supported version without a compile error.
Bumping the version is a one-line change followed by a compile pass; methods
that moved between call and job directories, or changed shape, surface as
errors at their call sites.
