# Proposal: a `testing` entry for `@truenas/api-client`

Status: draft, 2026-09-09. Written from the webui migration
(`docs/devs/typed-api-client.md`), where every consumer of the client has so
far had to build its own test double. Fold into gap 7 of that document once
it lands.

## Why

Three hand-rolled fakes of the same client exist today:

| Where | What it fakes | Size |
|---|---|---|
| webui `MockTypedApiService` | the API verbs: call, query, job, events | ~80 lines |
| webui `typed-api.service.spec.ts` | a whole client: connection, authenticator, api | ~60 lines |
| client `src/api/truenas-api.spec.ts` and `__mocks__/truenas-socket.ts` | a connection and a socket | not published |

None is typed by the directory, so fixtures are cast into shape with `as`.
None shares a message shape, so each reaches into the client's internals by
hand and breaks silently when a field renames. And the first service webui
migrated caused six spec suites to build the *real* client and hang on a
socket for 30 seconds each, because nothing in the package offered a safe
substitute to reach for.

The client is framework-agnostic and depends only on rxjs. Whatever it ships
for tests serves webui (Jest), the client's own suite (Vitest) and TrueNAS
Connect with one implementation. `@truenas/ui-components` already sets the
precedent with `TnIconTesting.jest.providers()` and its harnesses.

## Goals

- A fake client a consumer can drop in for `createTrueNasClient` with no
  socket, no timers, and no network.
- Typed by the same directory as the real client: an unknown method, or a
  fixture of the wrong shape, is a compile error.
- No dependency on a test runner. Spies are the consumer's choice.
- Unmocked calls fail immediately with a message that names the method.
- Usable both as a unit double for the verbs and as an integration seam for
  code that drives `connection` and `authenticator` directly.

## Non-goals

- Angular providers, Spectator helpers, or anything framework-shaped. Those
  stay in the consuming app.
- Simulating middleware semantics (validation, roles, job scheduling). The
  fake replays what it is told.

## Surface

Published as a subpath so test code never enters a production bundle:

```ts
import { createFakeClient } from '@truenas/api-client/testing';
```

### `createFakeClient`

```ts
function createFakeClient<V extends SupportedApiVersion>(
  options?: { version?: V; authenticated?: boolean; opened?: boolean },
): FakeTrueNasClient<DerivedDirectory<V>>;
```

Same version derivation as `createTrueNasClient`, so `version: 'v27.0.0'`
yields a client typed against `ApiDirectoryV27_0_0`. Defaults to the oldest
supported version, matching the real factory. Synchronous, since there is
nothing to discover.

`FakeTrueNasClient<D>` is structurally a `TrueNasApiClient<D>`, so it is
assignable wherever the real client is expected, with these members widened
to their fakes:

```ts
interface FakeTrueNasClient<D> extends TrueNasApiClient<D> {
  readonly api: FakeTrueNasApi<D>;
  readonly connection: FakeConnection;
  readonly authenticator: FakeAuthenticator;
}
```

### `FakeTrueNasApi<D>`

Every verb of `TrueNasApi<D>` with the same signature, backed by a registry:

```ts
interface FakeTrueNasApi<D> extends TrueNasApi<D> {
  mockCall<M extends CallMethod<D>>(
    method: M,
    response: CallResponse<D, M> | ((params: CallParams<D, M>) => CallResponse<D, M>),
  ): void;

  /** Feeds `query`, `queryOne` (first row) and `queryCount` (row count). */
  mockQuery<M extends QueryMethod<D['call']>>(method: M, rows: QueryEntity<D['call'], M>[]): void;

  /** One update or a sequence; `job` emits them in order and completes on a terminal state. */
  mockJob<M extends JobMethod<D>>(method: M, updates: Job<JobResult<D, M>> | Job<JobResult<D, M>>[]): void;

  /** Pushes a change to every subscriber of `events(event)`. */
  emit<E extends EventName<D>>(event: E, change: EventUnion<D, E>): void;

  /** Every verb invocation, in order, for assertions without a spy library. */
  readonly calls: readonly { verb: 'call' | 'query' | 'queryOne' | 'queryCount' | 'job' | 'callAndGetJobId'; method: string; params: unknown }[];

  reset(): void;
}
```

Behaviour:

- An unmocked verb returns `throwError(() => new Error('Unmocked call system.info with [...]'))`.
  Throwing inside the observable rather than at call time keeps the fake
  usable with code that composes calls lazily.
- `mockCall` with a function receives the params, so a spec can branch on
  filters without a spy.
- `mockQuery` feeds all three query verbs from one fixture, which is how the
  real methods relate.
- `mockJob` with a single update emits it once; with an array, emits each in
  order. Nothing is synthesised: if the sequence never reaches a terminal
  state, `job` never completes, which is what a real hung job looks like.
- `events` returns a shared stream per event name, as the real one does, so
  two subscribers see one `emit`.

### `FakeConnection`

Structurally a `TrueNasConnection`, driven by the test:

```ts
interface FakeConnection extends TrueNasConnection {
  /** Flips `opened` to true and replays `enabled` semantics. */
  open(): void;
  /** Flips `opened` to false and emits `closed`. Accepts a close code for policy closes. */
  close(code?: number, reason?: string): void;
  /** As if middleware sent this message. */
  receive(message: TrueNasMessage): void;
  /** Every message `send` was given, in order. */
  readonly sent: readonly TrueNasMessage[];
  /** Answer the most recent sent request carrying this method, by id. */
  reply(method: string, result: unknown): void;
  replyError(method: string, error: TrueNasMessage['error']): void;
}
```

`reply` and `replyError` are what make the fake an integration seam: code
that does its own dispatch over `connection` (webui's `TypedApiService.call`
does, to keep the JSON-RPC error payload) can be exercised end to end without
knowing message ids.

### `FakeAuthenticator`

Structurally a `TrueNasAuthenticator`:

```ts
interface FakeAuthenticator extends TrueNasAuthenticator {
  /** The next login of any kind resolves with this response and sets `authenticated$`. */
  succeedNextLogin(response?: Partial<AuthResponse>): void;
  /** The next login of any kind errors with this. */
  failNextLogin(error?: Error): void;
  /** Every login attempt: mechanism and credential given. */
  readonly logins: readonly { mechanism: TrueNasAuthMechanism; credential: string }[];
}
```

Default behaviour without scripting: logins succeed with
`{ response_type: 'SUCCESS' }` and a fresh `reconnect_token`, so the common
case needs no setup, and a test of token chaining can read the token it was
handed back.

### Spies

The core records calls itself. For consumers who prefer their runner's
matchers, one adapter that takes the spy factory:

```ts
import { withSpies } from '@truenas/api-client/testing';

const client = withSpies(createFakeClient({ version: 'v27.0.0' }), jest.fn);  // or vi.fn
expect(client.api.call).toHaveBeenCalledWith('system.info');
```

`withSpies` wraps every verb of `api`, `send` on `connection`, and every
login on `authenticator`, preserving behaviour. This mirrors how
`TnIconTesting` keeps the mocks runner-neutral and lets the runner supply the
spy.

### Errors

```ts
import { UnmockedCallError } from '@truenas/api-client/testing';
```

A named error class, so a consumer's global guard can distinguish "the test
forgot a mock" from a real failure and render it prominently.

## Packaging

- New entry `src/testing/index.ts`, built by `tsup` alongside the main entry.
- `package.json` `exports` gains `"./testing"` with the same `import` /
  `require` shape as `"."`.
- No new dependencies. The fake uses rxjs subjects only.
- The existing `__mocks__/truenas-socket.ts` becomes an implementation
  detail of `FakeConnection` and stops being a manual mock.

## Adoption

### In the client's own suite

`truenas-api.spec.ts` builds `mockConnection` by hand on a `Subject` and
constructs `TrueNasApi` over it. `FakeConnection` replaces that verbatim,
and the connection spec's socket mock becomes `FakeConnection`'s internals.
This is the first consumer and keeps the fake honest: if the real
`TrueNasApi` cannot run on `FakeConnection`, the fake is wrong.

### In webui

Before, in every spec:

```ts
mockTypedApi([mockTypedQuery('keychaincredential.query', rows as KeychainCredentialEntry[])])
```

After, `mockTypedApi` becomes a thin Angular provider over the package's
fake, `MockTypedApiService` disappears, and fixtures are checked against the
directory instead of cast:

```ts
mockTypedApi((api) => api.mockQuery('keychaincredential.query', rows))
```

`typed-api.service.spec.ts` drops its 60-line hand-rolled client for
`createFakeClient` and tests the auth bridge through `authenticator.logins`
and `connection.open()` / `close()`.

The global `EmptyTypedApiService` guard in `setup-jest.ts` stays. Its job is
to catch the spec that forgot to mock, which a fake cannot do.

## Open questions

- **One fake per version, or version-generic?** The proposal derives the
  directory from `version` like the real factory. A consumer pinned to one
  version never notices; a consumer testing across versions gets a fake per
  version, which matches how the real clients differ.
- **Should `mockQuery` honour `select`?** Projecting rows to the selected
  fields would make `queryOne('x', [], { select: [...] })` return what
  middleware would. Cheap to do, and it catches a class of bug the current
  webui mock cannot.
- **Should `receive` validate against the directory?** A message for a method
  the directory does not declare could throw. Useful, but it makes the fake
  stricter than middleware, which does not validate responses at runtime.
