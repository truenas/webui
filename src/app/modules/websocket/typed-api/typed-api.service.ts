import { DestroyRef, inject, Injectable } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  ArgsOf,
  CallMethod,
  CallParams,
  CallResponse,
  EventName,
  EventSourceName,
  EventUnion,
  JobMethod,
  JobParams,
  JobResult,
  SubscribableEvent,
  SubscriptionArgs,
} from '@truenas/api-client';
import {
  catchError,
  defer,
  distinctUntilChanged,
  EMPTY,
  filter,
  map,
  MonoTypeOperatorFunction,
  Observable,
  pipe,
  switchMap,
  take,
  throwError,
} from 'rxjs';
import { ApiErrorName } from 'app/enums/api.enum';
import { observeJob } from 'app/helpers/operators/observe-job.operator';
import { Job } from 'app/interfaces/job.interface';
import { followCollection } from 'app/modules/websocket/typed-api/follow-collection';
import { rethrowAsApiCallError } from 'app/modules/websocket/typed-api/rethrow-as-api-call-error';
import {
  TYPED_API_CLIENT,
  TypedQueryFilter,
  UndeclaredCallDirectory,
  UndeclaredCallMethod,
  WebUiApiClient,
  WebUiApiDirectory,
  WebUiQueryEntity,
  WebUiQueryMethod,
} from 'app/modules/websocket/typed-api/typed-api-client.token';
import { DuplicateCallTrackerService } from 'app/modules/websocket-debug-panel/services/duplicate-call-tracker.service';
import { ApiCallError } from 'app/services/errors/error.classes';
import { WebSocketStatusService } from 'app/services/websocket-status.service';

type D = WebUiApiDirectory;
type ClientApi = WebUiApiClient['api'];

/**
 * Fully-typed API access, backed by `@truenas/api-client`.
 *
 * Method names, params and responses come from types generated from
 * `middlewared --dump-api`, so an unknown method or a wrong param shape is a
 * compile error rather than a runtime surprise, and there is no hand-maintained
 * directory to keep in sync.
 *
 * ## Session
 *
 * There is one socket, one session and one login, and they are this client's:
 * `AuthService` drives `client.authenticator`, so the session holds the
 * credentials, the reconnect-token chain and the session's roles.
 *
 * Call sites therefore never authenticate here. Requests are held until the
 * session is authenticated, which is what a page loaded before sign-in, or one
 * caught mid-reconnect, is waiting for.
 *
 * ## Duplicate calls
 *
 * Every request verb reports itself to `DuplicateCallTrackerService` as it is
 * called, before it waits for the session, so a repeat is warned about with the
 * stack of the code that made it. Tracking at the connection instead would see
 * only the client's internals on the stack.
 *
 * ## Errors
 *
 * Every verb throws a refusal as `ApiCallError` carrying the full JSON-RPC
 * error, which `ErrorHandlerService` and form validation read. The verbs that
 * need a session also end it on `ENOTAUTHENTICATED`.
 */
@Injectable({
  providedIn: 'root',
})
export class TypedApiService {
  private client$ = inject(TYPED_API_CLIENT);
  private wsStatus = inject(WebSocketStatusService);
  private destroyRef = inject(DestroyRef);
  private duplicates = inject(DuplicateCallTrackerService);

  /**
   * Emits the client once its session is authenticated. Every request waits on
   * this, so a call made before sign-in or across a reconnect is held rather
   * than refused by middleware.
   */
  private readonly ready$: Observable<WebUiApiClient> = defer(() => this.client$.pipe(
    switchMap((client) => client.authenticator.authenticated$.pipe(
      filter(Boolean),
      take(1),
      map(() => client),
    )),
  ));

  constructor() {
    this.projectSessionStatus();
  }

  /**
   * Send a request and emit its result.
   *
   * ```typescript
   * this.typedApi.call('system.info');                 // Observable<SystemInfoResult>
   * this.typedApi.call('alert.dismiss', ['uuid-1']);   // params required
   * this.typedApi.call('nope.nope');                   // compile error
   * ```
   *
   * Errors are thrown as `ApiCallError`; see "Errors" above.
   */
  call<M extends CallMethod<D>>(method: M, ...params: ArgsOf<CallParams<D, M>>): Observable<CallResponse<D, M>> {
    this.duplicates.trackCall(method, params[0]);
    return this.ready$.pipe(
      switchMap((client) => client.api.call(method, ...params)),
      this.handleRefusal(),
    );
  }

  /**
   * `call` for the few methods middleware serves but leaves out of the generated directory
   * (gap 14 in docs/devs/typed-api-client.md). They are typed by `UndeclaredCallDirectory`,
   * written by hand, so nothing checks them against middleware; prefer `call` for anything else.
   */
  callUndeclared<M extends UndeclaredCallMethod>(
    method: M,
    ...params: ArgsOf<UndeclaredCallDirectory[M]['params']>
  ): Observable<UndeclaredCallDirectory[M]['response']> {
    // The client's `call` only names generated methods; on the wire an undeclared one is the same frame.
    type LooseCall = (method: string, ...params: unknown[]) => Observable<UndeclaredCallDirectory[M]['response']>;
    this.duplicates.trackCall(method, params[0]);
    return this.ready$.pipe(
      switchMap((client) => (client.api.call as LooseCall).call(client.api, method, ...params)),
      this.handleRefusal(),
    );
  }

  /**
   * `call` for the methods middleware answers without a session, such as the sign-in page's
   * `system.advanced.login_banner`. It waits for the client only, not for a login, which `call`
   * would hold it for until the user had signed in.
   *
   * There is no session to end, so a refusal is thrown like any other error.
   */
  callUnauthenticated<M extends CallMethod<D>>(
    method: M,
    ...params: ArgsOf<CallParams<D, M>>
  ): Observable<CallResponse<D, M>> {
    this.duplicates.trackCall(method, params[0]);
    return this.client$.pipe(
      take(1),
      switchMap((client) => client.api.call(method, ...params)),
      rethrowAsApiCallError(),
    );
  }

  /**
   * Query a collection. Typed by the entity behind the `.query` method, with
   * `select` narrowing the rows to the picked fields.
   *
   * Use `satisfies` rather than an annotation when building options into a
   * variable, or the result widens to `Partial<E>[]`.
   *
   * The query verbs are forwarded rather than declared because the types
   * their signatures need (`QueryFilters`, `QueryProjection`) are not
   * exported by the client yet. The cast restores the client's own generic
   * signature over the forwarding arrow; the arguments and return value are
   * exactly the client's, so nothing is widened at the call site.
   */
  readonly query = ((
    ...args: Parameters<ClientApi['query']>
  ) => {
    this.trackQuery(args);
    return this.ready$.pipe(
      switchMap((client) => client.api.query(...args)),
      this.handleRefusal(),
    );
  }) as ClientApi['query'];

  /** Query the single matching entry. Middleware errors unless exactly one matches. */
  readonly queryOne = ((
    ...args: Parameters<ClientApi['queryOne']>
  ) => {
    this.trackQuery(args);
    return this.ready$.pipe(
      switchMap((client) => client.api.queryOne(...args)),
      this.handleRefusal(),
    );
  }) as ClientApi['queryOne'];

  /** Count the matching entries. */
  readonly queryCount = ((
    ...args: Parameters<ClientApi['queryCount']>
  ) => {
    this.trackQuery(args);
    return this.ready$.pipe(
      switchMap((client) => client.api.queryCount(...args)),
      this.handleRefusal(),
    );
  }) as ClientApi['queryCount'];

  /**
   * Start a job and follow it to completion.
   *
   * Emits every update, completes on success and throws `FailedJobError` on
   * failure, the contract `observeJob`-based consumers rely on. A method
   * refused before it starts a job (validation, a missing role) throws
   * `ApiCallError` instead.
   */
  job<M extends JobMethod<D>>(
    method: M,
    ...params: ArgsOf<JobParams<D, M>>
  ): Observable<Job<JobResult<D, M>>> {
    this.duplicates.trackCall(method, params[0]);
    return this.ready$.pipe(
      switchMap((client) => client.api.job(method, ...params)),
      this.handleRefusal(),
      // The client's Job and the UI's Job describe the same wire object; the
      // client is merely honest about a few fields being null before the job
      // starts. Narrowing to the UI's shape keeps the existing operators and
      // error classes usable until the UI adopts the client's type.
      map((job) => job as unknown as Job<JobResult<D, M>>),
      observeJob(),
    );
  }

  /**
   * Start a job and emit only its id. Use `job` when progress or the result matter.
   *
   * A method refused before it starts a job throws `ApiCallError`.
   */
  startJob<M extends JobMethod<D>>(method: M, ...params: ArgsOf<JobParams<D, M>>): Observable<number> {
    this.duplicates.trackCall(method, params[0]);
    return this.ready$.pipe(
      switchMap((client) => client.api.callAndGetJobId(method, ...params)),
      this.handleRefusal(),
    );
  }

  /**
   * Subscribe to a collection's change events, or to an event source with its arguments.
   *
   * ```typescript
   * this.typedApi.subscribe('pool.query');
   * this.typedApi.subscribe('filesystem.file_tail_follow', { path: '/var/log/messages' });
   * ```
   *
   * Held until the typed session is authenticated like every other verb:
   * middleware refuses `core.subscribe` on an unauthenticated session, and the
   * refusal is silent and one-shot rather than retried.
   *
   * The emitted union is discriminated on `msg`; narrow on it before reading
   * `fields`, since a removal carries only an `id`. An event source completes
   * when middleware ends it and throws `ApiCallError` when middleware rejects its arguments.
   */
  subscribe<E extends EventName<D>>(event: E): Observable<EventUnion<D, E>>;
  // Not unifiable: the two overloads constrain `E` differently, as the client's own `events` does.
  // eslint-disable-next-line @typescript-eslint/unified-signatures
  subscribe<E extends EventSourceName<D>>(event: E, ...params: SubscriptionArgs<D, E>): Observable<EventUnion<D, E>>;
  subscribe(event: SubscribableEvent<D>, params?: unknown): Observable<unknown> {
    // The client's two overloads cannot be picked through the erased `event`; it builds the
    // subscription name from `params` itself, a bare name when they are absent.
    type LooseEvents = (event: string, params?: unknown) => Observable<unknown>;
    return this.ready$.pipe(
      switchMap((client) => (client.api.events as LooseEvents).call(client.api, event, params)),
      this.handleRefusal(),
    );
  }

  /**
   * Query a collection and keep the rows current from its change events.
   *
   * There is no `select`: the change events carry whole rows, so a projection would be undone
   * by the first one. The client shares one event stream per collection and releases it with
   * `core.unsubscribe` when the last consumer goes.
   */
  queryAndSubscribe<M extends WebUiQueryMethod & EventName<D>>(
    method: M,
    filters: TypedQueryFilter<WebUiQueryEntity<M>>[] = [],
    options: { extra?: Record<string, unknown> } = {},
  ): Observable<WebUiQueryEntity<M>[]> {
    // The query and event verbs are generic over the directory, which `M` cannot be narrowed
    // through; `followCollection` takes the erased shapes and folds rows by `id` alone.
    interface LooseRow { id?: unknown }
    const looseQuery = this.query as unknown as (
      method: string, filters: unknown, options: unknown,
    ) => Observable<LooseRow[]>;
    const changes$ = this.subscribe(method) as unknown as Observable<{ msg: string; id?: unknown; fields?: LooseRow }>;
    return followCollection(looseQuery(method, filters, options), changes$) as Observable<WebUiQueryEntity<M>[]>;
  }

  /** The query verbs' arguments are the method followed by its filters and options. */
  private trackQuery([method, ...params]: readonly unknown[]): void {
    this.duplicates.trackCall(String(method), params);
  }

  /**
   * Keeps `WebSocketStatusService` in step with the session the app runs on.
   *
   * Pushed rather than pulled so that service does not have to own the typed
   * client; see the note on `setSessionStatus`.
   */
  private projectSessionStatus(): void {
    this.client$.pipe(
      switchMap((client) => client.authenticator.authenticated$),
      distinctUntilChanged(),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next: (isAuthenticated) => this.wsStatus.setSessionStatus(isAuthenticated),
      error: (error: unknown) => console.error('Typed API session status could not be tracked', error),
    });
  }

  /**
   * Rethrows a refusal as `ApiCallError`, and ends the app's session when
   * middleware refused for want of one: swallow the error, drop the session, and let the app
   * fall back to the sign-in page, which logs straight back in when the stored
   * token is still good.
   */
  private handleRefusal<T>(): MonoTypeOperatorFunction<T> {
    return pipe(
      rethrowAsApiCallError<T>(),
      catchError((error: unknown) => {
        if (error instanceof ApiCallError && error.error?.data?.errname === ApiErrorName.NotAuthenticated) {
          this.wsStatus.setLoginStatus(false);
          return EMPTY;
        }

        return throwError(() => error);
      }),
    );
  }
}
