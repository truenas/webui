import { DestroyRef, inject, Injectable } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  ArgsOf,
  CallMethod,
  CallParams,
  CallResponse,
  EventName,
  EventUnion,
  JobMethod,
  JobParams,
  JobResult,
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
  switchMap,
  take,
  throwError,
} from 'rxjs';
import { ApiErrorName } from 'app/enums/api.enum';
import { observeJob } from 'app/helpers/operators/observe-job.operator';
import { Job } from 'app/interfaces/job.interface';
import { dispatchTypedCall } from 'app/modules/websocket/typed-api/dispatch-typed-call';
import {
  TYPED_API_CLIENT,
  WebUiApiClient,
  WebUiApiDirectory,
} from 'app/modules/websocket/typed-api/typed-api-client.token';
import { ApiCallError } from 'app/services/errors/error.classes';
import { WebSocketStatusService } from 'app/services/websocket-status.service';

type D = WebUiApiDirectory;
type ClientApi = WebUiApiClient['api'];

/**
 * Fully-typed API access, backed by `@truenas/api-client`.
 *
 * This is the migration target for `ApiService`. Method names, params and
 * responses come from types generated from `middlewared --dump-api`, so an
 * unknown method or a wrong param shape is a compile error rather than a
 * runtime surprise, and there is no hand-maintained directory to keep in sync.
 *
 * ## Coexistence with `ApiService`
 *
 * There is one socket, one session and one login, and they are this client's:
 * `AuthService` drives `client.authenticator`, so the typed session holds the
 * credentials, the reconnect-token chain and the session's roles. `ApiService`
 * and everything still riding it — the jobs store, the debug panel, every call
 * that has not moved — share this client's connection rather than opening one
 * of their own, so they are authenticated by the same login (NAS-143989).
 *
 * Call sites therefore never authenticate here. Migrate a call by swapping the
 * injected service. Requests are held until the session is authenticated,
 * which is what a page loaded before sign-in, or one caught mid-reconnect, is
 * waiting for.
 *
 * ## What is deliberately not here yet
 *
 * - Calls are not intercepted by the WebSocket debug panel or its mocks.
 * - There is no concurrent-call limit.
 * - `query` / `queryOne` / `queryCount` are exposed straight from the client
 *   until the wrapper grows its own error handling for them.
 */
@Injectable({
  providedIn: 'root',
})
export class TypedApiService {
  private client$ = inject(TYPED_API_CLIENT);
  private wsStatus = inject(WebSocketStatusService);
  private destroyRef = inject(DestroyRef);

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
   * Errors are thrown as `ApiCallError` carrying the full JSON-RPC error, the
   * same class the legacy `ApiService` throws, so `ErrorHandlerService` and
   * form validation keep working unchanged. See `dispatchTypedCall` for why
   * this does not go through the client's own `call`.
   */
  call<M extends CallMethod<D>>(method: M, ...params: ArgsOf<CallParams<D, M>>): Observable<CallResponse<D, M>> {
    return this.ready$.pipe(
      switchMap((client) => dispatchTypedCall<CallResponse<D, M>>(client, method, params[0])),
      this.endSessionOnRefusal(),
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
  ) => this.ready$.pipe(switchMap((client) => client.api.query(...args)))) as ClientApi['query'];

  /** Query the single matching entry. Middleware errors unless exactly one matches. */
  readonly queryOne = ((
    ...args: Parameters<ClientApi['queryOne']>
  ) => this.ready$.pipe(switchMap((client) => client.api.queryOne(...args)))) as ClientApi['queryOne'];

  /** Count the matching entries. */
  readonly queryCount = ((
    ...args: Parameters<ClientApi['queryCount']>
  ) => this.ready$.pipe(switchMap((client) => client.api.queryCount(...args)))) as ClientApi['queryCount'];

  /**
   * Start a job and follow it to completion.
   *
   * Emits every update, completes on success and throws `FailedJobError` on
   * failure — the same contract as `ApiService.job`, so `observeJob`-based
   * consumers migrate without changes.
   */
  job<M extends JobMethod<D>>(
    method: M,
    ...params: ArgsOf<JobParams<D, M>>
  ): Observable<Job<JobResult<D, M>>> {
    return this.ready$.pipe(
      switchMap((client) => client.api.job(method, ...params)),
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
   */
  startJob<M extends JobMethod<D>>(method: M, ...params: ArgsOf<JobParams<D, M>>): Observable<number> {
    return this.ready$.pipe(
      switchMap((client) => client.api.callAndGetJobId(method, ...params)),
    );
  }

  /**
   * Subscribe to a collection's change events.
   *
   * Held until the typed session is authenticated like every other verb:
   * middleware refuses `core.subscribe` on an unauthenticated session, and the
   * refusal is silent and one-shot rather than retried.
   *
   * The emitted union is discriminated on `msg`; narrow on it before reading
   * `fields`, since a removal carries only an `id`.
   */
  subscribe<E extends EventName<D>>(event: E): Observable<EventUnion<D, E>> {
    return this.ready$.pipe(
      switchMap((client) => client.api.events(event)),
    );
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
   * Ends the app's session when middleware refuses a typed call for want of
   * one, as `ApiService` does for the calls that still ride it: swallow the
   * error, drop the session, and let the app fall back to the sign-in page,
   * which logs straight back in when the stored token is still good.
   *
   * Only `call` gets this. It is the one verb that keeps the whole JSON-RPC
   * error — the client's own verbs reduce it to a reason string, and
   * `errname` is what distinguishes this refusal from any other.
   */
  private endSessionOnRefusal<T>(): MonoTypeOperatorFunction<T> {
    return catchError((error: unknown) => {
      if (error instanceof ApiCallError && error.error?.data?.errname === ApiErrorName.NotAuthenticated) {
        this.wsStatus.setLoginStatus(false);
        return EMPTY;
      }

      return throwError(() => error);
    });
  }
}
