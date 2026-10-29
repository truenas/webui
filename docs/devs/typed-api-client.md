# Migrating to the typed API client

`@truenas/api-client` is the fully-typed, framework-agnostic client for the
middleware JSON-RPC API. Its method names, params and responses are generated
from `middlewared --dump-api`, so a typo in a method name or a wrong param
shape is a compile error, and there is no hand-maintained directory to keep in
sync with middleware.

The UI used to have its own client — `ApiService` over `WebSocketHandlerService` — with
hand-written directories (`src/app/interfaces/api/*-directory.interface.ts`,
about 1,350 lines describing 555 calls, 80 jobs and 31 events) that drifted from
middleware. When the migration started on 2026-09-08 they were used from
roughly 870 `call`, 110 `job` and 45 `subscribe` sites across 414 files. This
document describes how the UI moved from one to the other without a big-bang
rewrite. The migration finished in NAS-144009, which deleted the legacy client
(Phase 3 below). A follow-up gave the typed one its name back: what the history below
calls `TypedApiService`, `mockTypedApi()`, `mockTypedCall()` and so on is now
`ApiService`, `mockApi()`, `mockCall()`. The sections up to "Phases" describe
the client as it is; the rest is the record of how it got there, in the names
of the time.

## What is in place

| Piece | Where |
|---|---|
| `@truenas/api-client` as a runtime dependency (9.0.1 at the time of writing) | `package.json` |
| The client instance, typed against `v28.0.0` | `src/app/modules/websocket/typed-api/typed-api-client.token.ts` |
| `ApiService`, what the app injects | `src/app/modules/websocket/api.service.ts` |
| The version the UI is written against | `WebUiApiDirectory` in the token file |
| `mockApi()` and `MockApiService`, the spec double | `src/app/core/testing/utils/mock-api.utils.ts`, `src/app/core/testing/classes/mock-api.service.ts` |
| `EmptyApiService`, the global guard against unmocked specs | `src/app/core/testing/utils/empty-api.service.ts`, registered in `src/setup-jest.ts` |

The typed client owns **the** WebSocket — one per tab, on `/api/v28.0.0`. It
is opened at startup by an app initializer in `main.ts`, unconditionally on
purpose: migrated pages run entirely on it, so there is no build in which it
can be left closed.

Everything goes over that one connection. The debug panel's logging and mock
interception sit on it (`interceptConnection`, installed by the
`TYPED_API_CLIENT` factory when the panel is enabled, NAS-144008), so they see
and answer all traffic. Middleware refuses the 21st call in flight on a
connection, so `limitConcurrentCalls` holds the whole tab to 19 on the
connection's `send`, one short of the ceiling to leave room for the keepalive
ping (see gap 20). Connection state — open, closed, refused, shutting down — is
`ConnectionService`'s (NAS-143990). The client retries the connection on its
own, sends `core.set_options` on open and pings every 20s.

### One session

The user signs in on the typed client. `AuthService` drives
`client.authenticator` (`loginWithUserPass`, `loginWithOtp`, `loginWithToken`,
`logout`), so the session holds the credentials, the session's roles and the
`reconnect_token` chain — every login asks middleware for the next token, and
the sign-in page spends it on the next reconnect. `WebSocketStatusService`
projects `authenticator.authenticated$`, so "the app is authenticated" is a
statement about that session.

An `ENOTAUTHENTICATED` refusal means the session lapsed, and `ApiService`
answers it the same way on every verb: drop the call, end the app's session, and let
`AppComponent` bounce the tab to /signin, which logs straight back in from the
stored token and navigates back to `redirectUrl`.

Call sites never authenticate. Every request is held until the session is
authenticated, so a call made before sign-in or across a reconnect waits
instead of being refused by middleware.

## Calling the API

```typescript
private api = inject(ApiService);
this.api.call('system.info');
this.api.call('alert.dismiss', [uuid]);
this.api.job('pool.dataset.export_key', [dataset]);
this.api.subscribe('alert.list');
```

What to know, much of it learned moving off the hand-written directories:

- **Response types come from the client.** Name a shape with
  `CallResponse<WebUiApiDirectory, 'system.info'>`. When a generated type disagrees with a
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
  client only. Nothing marks these methods; check whether a page runs before
  login when it calls one.
- **`queryAndSubscribe`** queries the collection,
  then folds its change events into the rows by `id` (`followCollection`), and
  takes filters and `extra` but no `select`, since the events carry whole rows.
  Script it in specs with `mockQuery` for the rows and `emitEvent` for the
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
  and script it with `mockCall`.
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
- **Specs** use `mockApi()` from
  `app/core/testing/utils/mock-api.utils`: `mockCall`, `mockCallError`, `mockQuery`,
  `mockJob`, and `MockApiService` for adjusting answers on the fly. Behind it is a real
  `@truenas/api-client` running on the package's own fake connection
  (`@truenas/api-client/testing`, since 6.0), so the real dispatch, job
  correlation and subscriptions run and only the *answers* are scripted. The
  client is strict: a call nothing scripted fails with `UnmockedCallError`
  naming the method. Fixtures for a query or entry response are typed as the
  generated entity (for example `CloudSyncCredentialEntry`), not the UI's
  reading of it. `mockCall` refuses `.query` methods; script those with
  `mockQuery`, which feeds `query`, `queryOne` and `queryCount` from one
  set of rows. The double's verbs run the same `rethrowAsApiCallError` as
  `ApiService`, so an error scripted with `mockCallError(method,
  { errname, extra })` is thrown as the `ApiCallError` production throws,
  `extra` included, which is what a form's error-path spec needs. It takes
  `.query` and job methods too, failing `query*` and `job` the same way. For
  connection-level scenarios reach the client itself:
  `spectator.inject(MockApiService).client.connection.simulateClose()`.
  The fake answers frames on a microtask, as a socket would, so a spec that
  asserts on the outcome of a submit needs `await spectator.fixture.whenStable()`
  after `submit()`; asserting that the call was made does not, since the frame
  goes out synchronously. A service or store spec, with no fixture to wait on,
  awaits `settleApi()` from the same utils instead. The same applies before a submit when the component
  loads data on init and gates saving on it: settle, then `detectChanges()`,
  because a loading flag that flipped back on the microtask has not yet
  crossed an input binding such as `<ix-form [externalLoading]>`.
- **`ApiService`'s own spec** provides `TYPED_API_CLIENT` with a
  non-strict `createFakeClient` and answers frames by hand with
  `connection.reply` / `replyError`, which is how the auth bridge and the
  service's own dispatch are exercised end to end without a socket.
- **A spec that reaches `ApiService` unmocked fails fast.**
  `setup-jest.ts` provides `EmptyApiService` globally, so an unmocked call throws
  `ApiService injection not provided` instead of building the real
  client, which would open a WebSocket to `environment.remote` from jsdom and
  hang the test until its timeout. That guard exists because the first
  service migration caused exactly that: `KeychainCredentialService` moved,
  and every spec of every component that renders `ix-ssh-credentials-select`
  timed out at 30 seconds with nothing in the assertion to explain why.
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
- Its interfaces alias the client's generated types (`v28_0_0.*` where the
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
4. `subscribe` sites, including event sources with arguments (gap 5).

Each area is a small PR: swap the injection, fix the types the compiler now
reports, update the spec's mock, and verify against a box. Prefer several
narrow PRs to one wide one; the diff per file is mechanical and easy to review
in isolation.

The spec half had a codemod (`yarn codemod:typed-api-specs`), and two
guardrails pinned finished areas against sliding back: `yarn
check-api-migration` in CI, and a path-scoped `no-restricted-imports` in
`eslint.config.mjs`. All three went with the legacy client in NAS-144009.

### Phase 2 — move the infrastructure

Once most call sites are typed, move what still depends on the legacy socket:

- **Login.** Done (NAS-143988). `AuthService` drives `client.authenticator`
  (`loginWithUserPass`, `loginWithOtp`, `loginWithToken`, `logout`) and the
  typed session is the app's session.
- **The socket.** Done (NAS-143989). `WebSocketHandlerService` borrows
  `client.connection` instead of opening a socket, which retired the second
  session along with `WebSocketConnection`, `PingService`, the reconnect timer
  and the token-borrowing bridge NAS-143988 had put in as a stopgap.
- **Jobs store.** Done. `job.effects.ts` loads with `query('core.get_jobs')`
  and subscribes to `core.get_jobs` on the typed client. The generated event
  declares only `added` and `changed`; middleware also sends `removed` when it
  drops a finished job, so the effects read the wire shape (`JobEvent`).
- **Session teardown.** Done. `AuthService` runs on `TypedApiService`, and
  `clearSubscriptions()` went with it: the client drops every event
  subscription when the session ends and subscribes again on the next login.
  `TokenLastUsedService` stamps on `client.connection.messages()` rather than
  the handler's `responses$`.
- **Connection UX.** Done (NAS-143990). `ConnectionService` is a thin layer
  over `client.connection`: `opened$` feeds `isClosed$` and
  `WebSocketStatusService`, `closes$.refused` feeds `isAccessRestricted$`,
  `reconnect()` cycles `setEnabled`, and `setEndpoint()` re-points it. It also
  holds the two UI-level flags with no counterpart on the connection —
  `prepareShutdown()` / `isSystemShuttingDown` and the access-restricted
  acknowledgement. The guard, the shutdown / restart / failover / config-reset
  pages, the GUI form and the forced password change read it instead of the
  handler, which is now only the legacy call queue.
- **Debug panel and mocks.** Done (NAS-144008), on the connection seam rather
  than a client hook — see gap 7 for the one path it cannot reach. The
  duplicate-call warning moved there too: `DuplicateCallTrackerService` lives in
  the debug panel, and every `TypedApiService` request verb reports itself to it
  as it is called, before waiting for the session. That keeps the warning's
  stacks pointing at the caller (at the connection they would show only the
  client's internals) and keeps it on in every non-production build, whether
  or not the panel is enabled.

### Phase 3 — remove the legacy client

Done (NAS-144009). `ApiService`, `WebSocketHandlerService`,
`SubscriptionManagerService`, the hand-written directories,
`mockApi` / `MockApiService` / `EmptyApiService` and their registrations in
`main.ts` and `setup-jest.ts` are gone, along with the migration guardrails
(`check-api-migration`, `scripts/api-migration-areas.mjs`,
`migratedApiOverrides` in `eslint.config.mjs`) and the spec codemod.
`DuplicateCallTrackerService` stays: it is the debug panel's now.

### Phase 4 — retire duplicated model types

NAS-144010 cleaned up the model files the area tickets had not reached. A
throwaway script compared each exported interface with every type the client
generates; when the two were assignable both ways, the interface was replaced
by an alias of the generated type (`export type FailoverConfig = v28_0_0.FailoverEntry`).
That covered 41 interfaces, among them the update, reboot, failover, ZFS tier,
iSCSI portal and initiator, SMB share option, NVMe-oF global, container stop
and delete, app stats and realtime reporting shapes. Three more interfaces were
looser than their generated type, which assigned to them but not the other way
round: `SystemGeneralConfig`, `NetworkConfigurationState` and `AppUsedPort`.
They became aliases as well, because every consumer still compiled. Two
files, `core-options` and `export-params`, were deleted. So were about twenty
exports that nothing read: params types the deleted legacy directory used to
name, and the `login_ex` request shapes.

What stays hand-written, on purpose:

- **Enums.** The client exports its enum const objects as types only (gap 13),
  so the UI's enums are still the only values code can write and compare
  with. None of them is unused.
- **Interfaces read through a `toX` adapter.** Each one differs from its
  generated type in a way some consumer depends on. The UI uses its enums
  where the wire sends literals, and reads `{ $date }` envelopes and loose
  records as the shapes the pages expect. Each area's drift notes below list
  these.
- **Discriminated unions the generated model leaves flat.** For example,
  `KeychainCredential` pairs `attributes` with `type`, and `SmbShare` pairs
  `options` with `purpose`.

When a spec fixture's partial object no longer casts to an aliased type, as
happens when a non-empty tuple meets `['0.0.0.0']`, cast the field
(`as SystemGeneralConfig['ui_address']`), not the whole object through
`unknown`.

## Known gaps and library follow-ups

Things the wrapper works around today, in the order they block the phases
above. Each is a change for `truenas/api-client-ts`.

1. ~~**Errors lose their payload.**~~ Resolved by NAS-144007, on 9.0.1, which
   carries api-client-ts #68 (TNC-2582). The client now
   throws `TrueNasApiError` with the whole JSON-RPC error from `call`, the
   query verbs, and a job method refused before it starts a job (which used
   to hang forever). Every `ApiService` verb rethrows it as `ApiCallError`
   through `rethrowAsApiCallError`, shared with the spec double, so
   `ErrorParserService` renders `errname`, `extra` and the trace exactly as
   on the legacy path, and every verb that needs a session ends it on
   `ENOTAUTHENTICATED`. `dispatchTypedCall`, the hand-rolled round trip
   `call` used to work around this, is gone. A job that starts and then
   fails still throws `FailedJobError` from its `FAILED` state. It no longer
   carries `apiErrorDetails`, though. The legacy client copied the job call's
   error reply into it, nothing sets it now, and `ErrorParserService` still
   reads it. That regression is tracked separately.
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
   or a non-throwing variant, would close it. Still so in 9.0.1.
4. **A password login is cached in the authenticator.** `loginWithUserPass`
   keeps the plaintext password on the authenticator and replays it on every
   reconnect. The UI never wanted that — it keeps a single-use token instead —
   and there is no way to decline it. Worth closing in the library; until then
   a password session re-logs itself in on reconnect, racing the sign-in
   page's token login, which the authenticator's epoch guard resolves. Still so
   in 9.0.1.
5. ~~**Parameterised subscriptions.**~~ Resolved by NAS-144006, on 9.0.1, which
   carries api-client-ts #69 (TNC-2583).
   `events()` takes an event source's arguments after its name, typed from the
   entry's `subscriptionParams`, and `ApiService.subscribe` forwards them:
   `subscribe('filesystem.file_tail_follow', { path })`. The client builds the
   `name:<json>` string itself, with sorted keys. A source middleware ends
   completes the stream, and one whose arguments it rejects throws an
   `ApiCallError` carrying middleware's error, as the other verbs do (gap 1).
   NAS-144006 moved the log tails (`ConsoleMessagesStore`, the job progress dialog's
   `filesystem.file_tail_follow`, the installed app's `app.container_log_follow`)
   and `SharingTierService`'s `zfs.tier.rewrite_job_query` and
   `zfs.tier.rewrite_job_status`. The generated models declare only `added` for
   a source, so narrowing on it is what types `fields`. That holds on the wire
   for the log tails, but not everywhere: `zfs.tier.rewrite_job_status` sends
   `changed`, and `zfs.tier.rewrite_job_query` sends all three kinds (gap 16).
   The timer-driven sources (`reporting.realtime`, `app.stats`, `container.metrics`)
   moved once gap 17 was closed; see there.
6. **Query, message and connection types are not exported.** `QueryFilters`
   and `QueryProjection` are internal, so the wrapper forwards the query verbs
   through `Parameters<>` rather than declaring them; `TrueNasMessage` and
   `TrueNasConnection` are absent from the main entry too, so
   `ConnectionService` names the connection as
   `WebUiApiClient['connection']` (`TypedConnection`). Still so in 9.0.1.

   Partly closed there: 7.0.1 exports `TrueNasErrorFrame` and `TrueNasErrorData`
   from the main entry, where 6.x had them only under `testing`.
   `rethrowAsApiCallError` still casts the frame, but for a different reason now —
   `TrueNasErrorFrame` extends the *client's* `JsonRpcError` and carries
   `TrueNasErrorData`, while `ApiCallError` takes the UI's `JsonRpcError` with
   `ApiErrorDetails`. Converging those two is what would retire the cast.
7. **No message hook.** The client has no interception seam, so
   `interceptConnection` (NAS-144008) wraps the connection's `send` and
   `messages()` the way `limitConcurrentCalls` wraps `send`: every frame either
   client writes is logged and checked against the mock configs, and mocked
   answers are mixed into `messages()` on a later tick (the client's verbs send
   before they listen, so an answer inside `send` would be lost). It is installed
   after the gate, so a mocked call takes no place in flight. A typed `job()`
   used to be out of reach, because `TrueNasApi` built its `jobEvents` stream
   from `messages()` before anything could wrap it. Since 9.0.1 it builds that
   stream with `defer` (api-client-ts #70), so a mocked job's synthetic
   `core.get_jobs` events reach `job()` too. Still open: frames the client
   writes straight to the socket, such as the keepalive `core.ping`, are not
   seen, and a message interceptor in `createTrueNasClient` would retire the
   `send` patch.
8. **Job type drift.** The client's `Job` is honest about `result` and
   `time_started` being `null` before a job starts; the UI's is not. The
   wrapper narrows for now; the UI should adopt the client's type.
9. **Test double** — shipped in 6.0 as `@truenas/api-client/testing`
   (`createFakeClient`, `mock.call` / `query` / `job` / `emit`, `withSpies`,
   `UnmockedCallError`, fixture builders; `truenas/api-client-ts` #54, #56,
   #59). webui's `MockApiService` and `api.service.spec.ts` run
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
    9.0.1.
13. **Version namespaces are type-only and partial.** Generated model types
    are reachable as `v28_0_0.Name`, and that is how the UI's interface files
    now alias them (`keychain-credential.interface.ts` is the pattern). Two
    limits, both in the client's `.d.ts` bundling: the const objects the
    generator emits for enums are exported type-only, so
    `v28_0_0.KeychainCredentialEntryType.SshKeyPair` does not compile in any
    version namespace, and a later namespace carries only the types that
    changed in that version, so `SSHKeyPairEntry` and
    `CredentialsVerifyResult` exist under `v25_10_0` but not `v28_0_0`. Until
    fixed (still so in 9.0.1): keep the UI's enums as value holders, and
    derive a missing type from the directory
    (`CallResponse<D, 'keychaincredential.create'>`) rather than importing it
    from an older version's namespace. Checked again in 9.0.1 for NAS-144011:
    the second limit is really renames. `v27_0_0` still exports
    `SSHKeyPairEntry`, `v28_0_0` calls it `SSHKeyPair`, and `v27_0_0` exports
    53 of the 54 names the UI takes from `v28_0_0`. A namespace is the whole
    model of its version, which is what the bump procedure under "Version
    policy" relies on.

14. **Methods missing from the dump.** `interface.lag_supported_protocols`,
    `kerberos.keytab.kerberos_principal_choices` and `nfs.add_principal` are in no
    generated directory, most likely because middleware marks them private.
    `UndeclaredCallDirectory` in `typed-api-client.token.ts` declares them by hand,
    and `NetworkService`, the directory services form's credential step and the
    NFS Add SPN dialog reach them through `ApiService.callUndeclared`
    (`mockUndeclaredCall` in specs). A separate verb rather than a widened
    `WebUiApiDirectory`, which would stop the client and its fake from being the
    directory's own type. Nothing checks those three entries against middleware;
    drop each one once the generated directory carries it.

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

    The storage tier's event sources go wrong the other way.
    `zfs.tier.rewrite_job_query` and `zfs.tier.rewrite_job_status` declare a
    model that already has `fields`, and the generator wraps it again, so the
    type reads `event.fields.fields`. Middleware sends the entry under `fields`
    once (`send_event(..., fields=entry)` in `plugins/zfs/tier.py`). Both also
    declare only `added`, while the status source sends `changed` and the query
    source sends `added`, `changed` and `removed`. `tierJobFromEvent` in
    `SharingTierService` reads the wire shape whatever the kind, and the list
    refresh reloads on every kind.

17. ~~**Event subscriptions are never released.**~~ Resolved by 9.0.1, which
    carries api-client-ts #69 (TNC-2583). The client still shares one stream per
    subscription name, but now resets it when the last subscriber leaves and
    sends `core.unsubscribe`, as the legacy `subscribe` does. That was what kept
    the event sources middleware pushes on a timer (`reporting.realtime`,
    `app.stats`, `container.metrics`) on `ApiService`. They have moved:
    `ContainersStore` (`container.metrics`), `AppsStatsService` (`app.stats`), the
    app details' resources card and `NetworkService` (`reporting.realtime`) and
    `WidgetResourcesService` (`reporting.realtime`, `app.stats`), each subscribed by bare name as before and narrowed on `added`. The
    generated payloads match what the readers take; two are looser than the UI's
    interfaces and are cast at the site: `container.metrics` is a dictionary of
    `unknown` (read as `ContainerMetrics`), and `reporting.realtime` types its
    CPUs as an open record and its pools as `Record<string, number>` maps (read as
    `ReportingRealtimeUpdate`, whose `AllCpusUpdate` also lists aggregate fields —
    `user`, `nice`, … — that the model does not declare and nothing reads).

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
    - `selectJobsByMethod` keyed on the legacy `ApiJobMethod`, so `cloud_backup.sync` and
      `rsynctask.run` stayed in the job directory until the jobs store moved. It takes
      `JobMethod<WebUiApiDirectory>` now.

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
      `UploadService.uploadAsJob` took the legacy `ApiJobMethod`, and the unlock dialog starts both
      through it when a key file is uploaded. It takes `JobMethod<WebUiApiDirectory>` now.

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

25. **Drift found moving credentials.** Handled at one site each:
    - The query rows are read into the UI interfaces through a `toX` adapter per interface: `toCertificate`,
      `toDnsAuthenticator`, `toPrivilege` and `toPrivilegeRole`, `toS3AccessKey`, `toApiKey`, and `toUser` /
      `toGroup`, which move out of `UserService` into their interface files now that the pages share them.
      Middleware spells roles, statuses and key types as plain strings, and the timestamps of API keys and
      S3 access keys as strings where the wire carries `{ $date }` envelopes (gap 15).
    - `acme.dns.authenticator.authenticator_schemas` declares each schema as a bare `{ _name_, title, _required_ }`,
      where the wire carries the whole JSON schema the form builds its fields from; `toAuthenticatorSchemas`
      reads it as the UI's `Schema`. Create and update type `attributes` as a union of one schema per provider,
      which the form edits as one record; `toDnsAuthenticatorCreateArgs` hands it over unchanged.
    - `webui.crypto.csr_profiles` declares its profiles as fixed keys (`toCertificateProfiles`), and
      `webui.crypto.get_certificate_domain_names` as `unknown[]`, read as the strings it returns.
    - `certificate.create` narrows the key type, length, curve and digest to the values it accepts, and
      `dns_mapping` to authenticator ids; the forms send those values typed loosely, through
      `toCertificateCreateArgs`. `user.create` requires `username` and `full_name`, which the form always fills
      (`toUserCreateArgs`); `api_key.*` and `s3.accesskey.*` take `expires_at` as the `{ $date }` envelope or
      `null` (`toApiKeyCreateArgs`, `toS3AccessKeyCreateArgs` and their update twins).
    - `audit.query` declares one response for every `query-options`, a count and a single entry included;
      `toAuditEntries` reads the rows of a plain query, for the user details' last action.
    - `ApiDataProvider` was still typed by the legacy directory (it takes `CallMethod<WebUiApiDirectory>`
      since NAS-144009), so `user.query`, `privilege.query` and
      `api_key.query` keep their entries as types, not call sites: the users, privileges and API keys lists
      hand it `TypedApiService` as its structural client, and the fake answers the query frames it sends
      through `call` from `mockTypedQuery` rows, counts included. `group.query`, `sharing.smb.query`,
      `system.general.update`, `system.security.config` and the 2FA secret calls keep theirs for the sharing,
      system and two-factor pages that still use them. The `user.query`, `group.query` and
      `directoryservices.status` event and call-and-subscribe entries had no legacy consumer left and are gone,
      with `kmip-config.interface.ts`, `CertificateUpdate` and the group, user, API key and DNS authenticator
      param types only the directory read.
    - Spec traps: `privilege.roles` is a query method without the `.query` suffix, so the codemod scripted it
      with `mockTypedCall`; a spec that imports its own `TranslateModule.forRoot()` lost ICU interpolation
      once `mockApi()`'s `TranslateService` went, and reads the global one now; and a fixture that depends on
      the filters (the privilege form's `group in` lookups) answers through `connection.autoReply`, since
      `mockTypedQuery` returns the same rows whatever the filters.

26. **Drift found moving sharing.** Handled at one site each:
    - The query rows are read into the UI interfaces through a `toX` adapter per interface: `toSmbShare`,
      `toNfsShare`, `toS3Bucket`, `toIscsiTarget`, `toIscsiExtent`, `toFibreChannelPort` / `toFibreChannelHost`,
      and `toNvmeOfSubsystem` / `Namespace` / `Host` / `Port`. Middleware spells enums as literals, leaves its
      defaulted fields optional, and types `sharing.smb.query`'s `options` as one union not paired with `purpose`.
      `fcport.query` declares the port's `target`, and `nfs.get_nfs4_clients` its `info`, as loose records;
      `fcport.status` is `unknown[]` (`toFibreChannelStatuses`) and `smb.status` a loose record per row for every
      info level (`toSmbStatus`). `SharingWebshareEntry` reads as `WebShare` unchanged.
    - `iscsi.global.sessions`, `nfs.get_nfs3_clients` and `nfs.get_nfs4_clients` are query methods without the
      `.query` suffix, so they are read with `query` and scripted with `mockTypedQuery`; `zpool.query` takes one
      object and stays a `call`.
    - Payloads typed more loosely than the generated inputs go through a `*CreateArgs` adapter unchanged:
      `iscsi.extent.*` narrows `blocksize` to 512–4096 (`toIscsiExtentCreateArgs`), `sharing.s3.*` narrows
      `audit` to the action names `sharing.s3.audit_choices` returns (`toS3BucketCreateArgs` / `UpdateArgs`),
      `sharing.smb.*` takes the input variants of the option shapes (`toSmbShareCreateArgs`), `nvmet.host.*`
      narrows `dhchap_hash` and `dhchap_dhgroup` to the values its choices calls return
      (`toNvmeOfHostCreateArgs`), and `nvmet.port.*` is a union of one shape per transport that the form edits
      as one (`toNvmeOfPortCreateArgs`).
    - `nvmet.port_subsys.query` and `nvmet.host_subsys.query` rows carry the whole `port` / `host` and `subsys`,
      so their entity has no `subsys_id`, `port_id` or `host_id`, while the UI filters on those columns. The
      requests are unchanged, with the filters asserted to `TypedQueryFilter`; worth a box check before
      switching to `subsys.id`. The UI's `qix_max` was a typo for the wire's `qid_max`, and the namespace's
      `subsystem` is `subsys`; neither was read.
    - `sharing.smb.getacl` has no `id`, makes `share_acl` optional, types `ae_who_id.id_type` as `USER` or `GROUP`
      only, and adds `CUSTOM` to `ae_perm`. `SmbSharesec` and `SmbSharesecAce` alias the generated types, and the
      editor casts `ae_perm` and `ae_type` to the UI enums where it patches. The old `id_type !== Everyone`
      guards could never be false and collapsed to `ae_who_id?.id`; how middleware reports an everyone entry
      wants a box check.
    - The legacy directory lost every `sharing.*`, `iscsi.*`, `fc.*`, `fcport.*` and `nvmet.*` entry, with
      `smb.config` / `update` / `status`, `nfs.config`, `group.query`, `pool.dataset.query` / `create` /
      `delete`, `zfs.tier.config`, `service.control` and a few lookups, plus the types only the directory read:
      `IscsiGlobalConfig`, `zpool.interface.ts`, and the NVMe-oF, iSCSI, NFS and WebShare update and
      association shapes. `user.query`, `pool.query` and `tn_connect.config` keep theirs for `ApiDataProvider`,
      the system pages and TrueNAS Connect.
    - Spec traps: the codemod split mock lists in two in a dozen specs, and the later `mockTypedApi` hid the
      earlier one's `pool.query`, which rendered exported-pool toggles enabled; row factories
      (`mockCall('sharing.s3.query', () => rows)`) became `connection.autoReply`; and the WebShare validator spec
      lost ICU interpolation with `mockApi()` and moved to `createServiceFactory`.

27. **Drift found moving system.** Handled at one site each:
    - The query rows are read into the UI interfaces through a `toX` adapter per interface: `toNtpServer`,
      `toTunable`, `toInitShutdownScript`, `toCronjob`, `toStaticRoute`, `toAlertService`, `toBootEnvironment`,
      `toJbof`, `toAuthSession` and `toNetworkInterface`. Middleware spells enums as literals and leaves its
      defaulted fields optional; `boot.environment.query` and `auth.sessions` carry gap 15's `{ $date }` envelopes.
      The config reads have one each: `toMailConfig`, `toResilverConfig`, `toNetworkConfiguration`,
      `toUpdateStatus`, `toAlertCategories`, `toLoggedInUser` (`auth.me`) and `toBootPoolInstance`
      (`boot.get_state`, which declares none of the `id`, `guid` or encryption fields `PoolInstance` names).
    - `system.security.config` sends `password_complexity_ruleset` in the `{ $set: [...] }` envelope middleware's
      JSON encoder writes for a Python set, and the form and card read `.$set`; the generated model declares a plain
      list. `toSystemSecurityConfig` reads the wire shape and `toSystemSecurityUpdateArgs` hands the update over
      unchanged, envelope included. `auth.me`'s privilege roles are the same envelope.
    - `auth.sessions` and `core.get_jobs` are query methods without the `.query` suffix, and `ipmi.lan.query` is the
      reverse: it takes its filters inside one object, next to `ipmi-options`, so it stays a `call` and
      `toIpmiChannels` reads its rows. The codemod gets all three wrong; script them by hand.
    - `cronjob.run` is a job in every generated directory, which the legacy client called and got a job id back.
      It is started with `startJob`, which sends the same frame. `ipmi.sel.elist` is a job there too, and the
      IPMI events dialog now follows it with `job`, as it did before NAS-141809 moved it to `call` (the same fix
      also changed the dialog's height, which may have been what made events show). Not yet checked on a box.
    - `interface.network_config_to_be_removed` is declared as a list of setting names, while the default gateway
      dialog has always read their values off an object. `toNetworkConfigToBeRemoved` keeps the request and the
      reading as they were; worth a box check.
    - Payloads typed more loosely than the generated inputs go through an adapter unchanged:
      `system.advanced.update` caps `syslogservers` at two and narrows `serialspeed` (`toAdvancedConfigUpdateArgs`),
      `system.general.update` wants non-empty address lists and literal protocols (`toSystemGeneralUpdateArgs`),
      `interface.create` / `update` narrow the protocols and hash policies (`toNetworkInterfaceCreateArgs`),
      `ipmi.lan.update` is one shape per `dhcp` (`toIpmiUpdateArgs`), and `alertservice.*` takes `attributes` as one
      model per service type (`toAlertServiceCreateArgs`). `GlobalTwoFactorConfig`, `MailConfigUpdate` and the
      tunable's create args alias the generated types; `tunable.tunable_type_choices` and the interface form's
      hash policy and LACPDU rate choices declare fixed keys and are copied into `Choices` first.
    - `core.download` is declared as `unknown[]`; the debug button reads the `[jobId, url]` pair as
      `CoreDownloadResponse`, as `DownloadService` does. `core.bulk` answers in the order given, so the boot
      environment delete dialog reads its rows by index from the arguments it sent.
    - The legacy directory lost 116 entries: every `system.*`, `alertservice.*`, `boot.*`, `cronjob.*`,
      `initshutdownscript.*`, `interface.*`, `ipmi.*` (but `ipmi.sel.*`), `jbof.*`, `mail.*`, `staticroute.*`,
      `support.*`, `tunable.*` and `update.*` entry this area was the last to use, with `docker.status`,
      `disk.details` and `core.bulk`, plus the types only the directory read: `replication-config-update.interface.ts`,
      the init/shutdown, NTP, cron job, static route, resilver, failover, system dataset and network configuration
      update shapes, the IPMI chassis params and `SendMailParams`. `UpdateComponent` computed the manual update link
      from a `toSignal` with no initial value, which the synchronous legacy mocks never let render before
      `webui.main.dashboard.sys_info` answered; it now tolerates the version being unknown.
    - Spec traps: the codemod again split two specs' mock lists (the boot pool attach and replace dialogs), and a
      default `mockTypedJob('core.bulk')` collided with each test scripting its own. Several OnPush forms patched in
      a subscription need `detectComponentChanges()` after settling, not `detectChanges()`; and the update page's
      header runs the fake progress bar's interval while loading, so its spec mocks `PageHeaderComponent`.

## Version policy

### What is pinned, and where

The UI is written against one API version, `v28.0.0`, and says so in three places
that must agree:

| Pin | Where | What it decides |
|---|---|---|
| `WebUiApiDirectory = ApiDirectoryV28_0_0` | `typed-api-client.token.ts` | Every method name, param and response the app compiles against |
| `version: 'v28.0.0'` | the `createTrueNasClient` call in the same file | The socket the app opens, `/api/v28.0.0` |
| `E2eApiDirectory` and `expectedApiVersion` | `e2e/support/api/client.ts` | The surface the E2E fixtures compile against, and the version they insist on at runtime |

The `version` literal must stay at the `createTrueNasClient` call site. The
client derives its typed surface from the literal, so forwarding it through a
variable or a wrapper widens the surface to the oldest supported version without
a compile error.

### What the pin means at runtime

The app names its version, so the client skips discovery and opens
`/api/v28.0.0` whatever the appliance's newest version is. Before the typed
client the UI opened `/api/current`, which followed the appliance. That is
still how `stable/27` works. `master` is the first branch with a pin, and
`stable/28` will be the first release to ship one.

- **An appliance newer than the pin** keeps working for as long as it still
  serves `v28.0.0`, that is, while `/api/versions` still lists it next to the
  newer versions. What the UI loses is everything middleware adds
  only to the newer surface. On `master`, that is every new method and field
  from the day the next version opens.
- **An appliance that no longer serves the pin** refuses the socket. The client
  retries forever, and the UI sits on the connecting screen with no error that
  names the version.
- **An appliance older than the pin**, such as a 27 box under `yarn ui remote`,
  has no `/api/v28.0.0`, and fails the same way. A master UI needs a master
  appliance.

E2E is different: it runs discovery and takes the newest version that the
appliance advertises *and* the installed `@truenas/api-client` implements. It
then fails at connect when the year it got is not `expectedApiVersion.year`.
So a package release that adds a newer directory changes what E2E negotiates
against a master appliance, even though nothing in the suite changed.

### When to bump, and who does it

**When:** as soon as both of these are true. Middleware `master` advertises a
newer year in `/api/versions`, and a `@truenas/api-client` release ships that
year's directory (`SUPPORTED_API_VERSIONS` and `MAX_SUPPORTED_VERSION` name it).
The first usually happens when `master` moves to the next release, the same move
that changes the version segment in PR titles (`28.0.0-BETA.1` → `29.0.0-…`).
The `v27` → `v28` renumber in api-client 9.0.0 (NAS-144342) was the same kind of
event, and took the same procedure.

Don't wait for a feature that needs the new surface. Once the next version
opens, master middleware changes go into it and no longer into `v28.0.0`, so
the gap only grows.

**Who:** the webui developer who bumps `@truenas/api-client` to the release
that adds the directory. The dependency bump and the pin move in **one PR**:

- A package bump without the pin makes E2E negotiate the new year and fail the
  year check on every run.
- A pin without the package bump does not compile, because the directory does
  not exist yet.

So no package bump that adds a version directory is complete without the pin,
and a reviewer can hold the PR to it. If a client release ships a new year and
nobody picks it up, file it as a webui ticket against the current release
rather than letting it ride.

**Stable branches never move their pin.** `stable/28` stays on `v28.0.0` for
its whole life. Its appliances also advertise point versions (`v28.0.1`, …, as
`v25.10.1` to `v25.10.5` were), and the UI keeps ignoring them. Move the pin to
a point version only when a backported fix needs something that exists only
there. Make that decision on the backport PR, and say so in it.

### The bump, step by step

Take `v28.0.0` → `v29.0.0` as the example.

1. `yarn add @truenas/api-client@<release>`, and check that its
   `SUPPORTED_API_VERSIONS` lists `v29.0.0`.
2. In `typed-api-client.token.ts`, change `ApiDirectoryV28_0_0` to
   `ApiDirectoryV29_0_0`, and `version: 'v28.0.0'` to `version: 'v29.0.0'`.
   Change the year in the doc comment as well.
3. In `e2e/support/api/client.ts`, change `E2eApiDirectory` and
   `expectedApiVersion` (`year` and `label`) together.
4. Change the version-named fakes in specs:
   `grep -rln "createFakeClient({ version: 'v28" src`.
5. Run `tsc -p tsconfig.json` and fix what it reports. Methods that moved
   between the call and job directories, renamed fields, and changed params all
   surface at their call sites. Compare against the spec-only error baseline
   (see Phase 4), not against zero.
6. Move every model alias to the new namespace, all at once:
   `v28_0_0.` → `v29_0_0.` across `src` (29 interface files and a few services
   at the time of writing). Each version's namespace exports that version's
   whole model, not only what changed. Of the 54 names the UI takes from
   `v28_0_0`, `v27_0_0` exports 53, and the one it lacks was renamed
   (`VMVirtualizationDetails`). So the rename is safe, and a name the new
   namespace no longer exports fails to compile, which is the signal to look up
   what it became. Don't leave aliases on the old namespace to save a step.
   They keep compiling and keep the old shape, and they drift away from the
   directory without an error. Re-run `tsc` afterwards.
7. Check `UndeclaredCallDirectory` against the new directory. Delete any entry
   the generated directory now declares, together with its `callUndeclared`
   call sites.
8. Update the version mentions in this document ("What is in place", the
   socket path), in `docker/nginx.conf`'s comment and in `e2e/CLAUDE.md`. Leave
   the version names in the history sections as they are.
9. Run lint and the specs `yarn test:changed` picks up. Then run the full E2E
   suite against a master appliance that advertises the new year, and record
   the appliance build in the PR. NAS-144342's PR is the model.
