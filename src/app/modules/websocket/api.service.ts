import { inject, Injectable } from '@angular/core';
import { select, Store } from '@ngrx/store';
import { TranslateService } from '@ngx-translate/core';
import {
  catchError,
  EMPTY,
  filter,
  finalize,
  map,
  merge,
  Observable,
  of,
  OperatorFunction,
  startWith,
  Subject,
  switchMap,
  take,
  takeUntil,
  throwError,
} from 'rxjs';
import { v4 as uuidv4 } from 'uuid';
import { ApiErrorName } from 'app/enums/api.enum';
import { isErrorResponse } from 'app/helpers/api.helper';
import { applyApiEvent } from 'app/helpers/operators/apply-api-event.operator';
import { observeJob } from 'app/helpers/operators/observe-job.operator';
import {
  ApiCallAndSubscribeMethod,
  ApiCallAndSubscribeResponse,
} from 'app/interfaces/api/api-call-and-subscribe-directory.interface';
import { ApiCallMethod, ApiCallParams, ApiCallResponse } from 'app/interfaces/api/api-call-directory.interface';
import { ApiJobMethod, ApiJobParams, ApiJobResponse } from 'app/interfaces/api/api-job-directory.interface';
import {
  ApiEventMethod,
  ApiEventTyped,
  ErrorResponse,
  IncomingMessage,
  JsonRpcError,
  SuccessfulResponse,
} from 'app/interfaces/api-message.interface';
import { Job } from 'app/interfaces/job.interface';
import { JobSlice, selectJobWithCallId } from 'app/modules/jobs/store/job.selectors';
import { DuplicateCallTrackerService } from 'app/modules/websocket/duplicate-call-tracker.service';
import { SubscriptionManagerService } from 'app/modules/websocket/subscription-manager.service';
import { WebSocketHandlerService } from 'app/modules/websocket/websocket-handler.service';
import { ApiCallError, FailedJobError } from 'app/services/errors/error.classes';
import { WebSocketStatusService } from 'app/services/websocket-status.service';

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  protected wsHandler = inject(WebSocketHandlerService);
  protected wsStatus = inject(WebSocketStatusService);
  protected subscriptionManager = inject(SubscriptionManagerService);
  protected translate = inject(TranslateService);
  protected duplicateTracker = inject(DuplicateCallTrackerService);

  readonly clearSubscriptions$ = new Subject<void>();

  private store$: Store<JobSlice> = inject<Store<JobSlice>>(Store<JobSlice>);
  private jobApiErrors = new Map<string, ApiCallError>();

  constructor() {
    this.wsStatus.isConnected$?.subscribe((isConnected) => {
      if (!isConnected) {
        this.clearSubscriptions();
      }
    });
  }

  call<M extends ApiCallMethod>(method: M, params?: ApiCallParams<M>): Observable<ApiCallResponse<M>> {
    return this.callMethod(method, params);
  }

  /**
   * For jobs better to use the `selectJob` store selector.
   */
  callAndSubscribe<M extends ApiCallAndSubscribeMethod>(
    method: M,
    params?: ApiCallParams<M>,
  ): Observable<ApiCallAndSubscribeResponse<M>[]> {
    return this.callMethod<M>(method, params)
      .pipe(
        switchMap((items) => this.subscribe(method).pipe(
          startWith(null),
          map((event) => ([items, event])),
        )),
        applyApiEvent(),
        takeUntil(this.clearSubscriptions$),
      );
  }

  /**
   * Use this method when you want to start a job, but don't care about the progress or result.
   * Use `job` otherwise.
   */
  startJob<M extends ApiJobMethod>(method: M, params?: ApiJobParams<M>): Observable<number> {
    return this.job(method, params).pipe(
      take(1),
      map((job) => job.id),
    );
  }

  /**
   * In your subscription, next will be next job update, complete will be when the job is complete.
   */
  job<M extends ApiJobMethod>(
    method: M,
    params?: ApiJobParams<M>,
  ): Observable<Job<ApiJobResponse<M>>> {
    const uuid = uuidv4();
    // Cast needed: ApiJobParams<M> is a tuple type that doesn't directly match unknown[]
    this.duplicateTracker.trackCall(method, params as unknown[]);
    this.wsHandler.scheduleCall({
      id: uuid,
      method,
      params: params as unknown[] ?? [],
    });
    const callResponse$ = this.wsHandler.responses$.pipe(
      filter((message) => 'id' in message && message.id === uuid),
      this.getErrorSwitchMap(method, uuid),
      map((message) => message.result),
      take(1),
      // On success, don't emit — let observeJob() handle completion via the store.
      // Emitting here would cause takeUntil to cancel the store subscription before
      // the final job update (with time_finished/result) reaches the store.
      switchMap(() => EMPTY),
      catchError((error: unknown) => {
        // When a job exists in the store, save the API error details for later enrichment
        // and let observeJob() handle the failure with full job data (including logs_excerpt).
        // Only propagate errors when no job was created (e.g. validation failures).
        return this.store$.pipe(
          select(selectJobWithCallId(uuid)),
          take(1),
          switchMap((job) => {
            if (job) {
              if (error instanceof ApiCallError) {
                this.jobApiErrors.set(uuid, error);
              }
              return EMPTY;
            }
            return throwError(() => error);
          }),
        );
      }),
    );
    return this.store$.pipe(
      select(selectJobWithCallId(uuid)),
      filter((job): job is Job<ApiJobResponse<M>> => !!job),
      observeJob(),
      catchError((error: unknown) => {
        const savedApiError = this.jobApiErrors.get(uuid);
        this.jobApiErrors.delete(uuid);
        if (error instanceof FailedJobError && savedApiError?.error?.data) {
          error.apiErrorDetails = savedApiError.error.data;
        }
        return throwError(() => error);
      }),
      // callResponse$ no longer emits next (success → EMPTY), so it won't trigger
      // takeUntil's completion. It must remain here because when no job is created
      // (e.g. validation failures), its throwError propagates through the merge
      // notifier as an error — the only way to unblock this otherwise-hanging pipe.
      takeUntil(merge(this.clearSubscriptions$, callResponse$)),
      finalize(() => this.jobApiErrors.delete(uuid)),
    ) as Observable<Job<ApiJobResponse<M>>>;
  }

  subscribe<K extends ApiEventMethod = ApiEventMethod>(method: K | `${K}:${string}`): Observable<ApiEventTyped<K>> {
    return this.subscriptionManager.subscribe(method).pipe(
      switchMap((apiEvent) => {
        const erroredEvent = apiEvent as unknown as IncomingMessage;
        if (isErrorResponse(erroredEvent)) {
          return throwError(() => new ApiCallError(erroredEvent.error as JsonRpcError));
        }
        return of(apiEvent);
      }),
      takeUntil(this.clearSubscriptions$),
    );
  }

  clearSubscriptions(): void {
    this.clearSubscriptions$.next();
    this.jobApiErrors.clear();
  }

  private callMethod<M extends ApiCallMethod>(
    method: M,
    params?: ApiCallParams<M>,
    callUuid?: string
  ): Observable<ApiCallResponse<M>>;
  private callMethod<M extends ApiJobMethod>(
    method: M,
    params?: ApiJobParams<M>,
    callUuid?: string
  ): Observable<ApiJobResponse<M>>;
  private callMethod<M extends ApiCallMethod | ApiJobMethod>(
    method: M,
    params?: unknown[],
  ): Observable<unknown> {
    const uuid = uuidv4();
    this.duplicateTracker.trackCall(method, params);
    return of(uuid).pipe(
      switchMap(() => {
        if (typeof performance !== 'undefined' && typeof performance.mark === 'function') {
          performance.mark(`${method} - ${uuid} - start`);
        }

        this.wsHandler.scheduleCall({
          id: uuid,
          method,
          params: params ?? [],
        });
        return this.wsHandler.responses$.pipe(
          filter((message) => 'id' in message && message.id === uuid),
        );
      }),
      this.getErrorSwitchMap(method, uuid),
      map((message) => message.result),
      take(1),
    );
  }

  private getErrorSwitchMap(
    method: string,
    uuid: string,
  ): OperatorFunction<SuccessfulResponse | ErrorResponse, SuccessfulResponse> {
    return switchMap((message: SuccessfulResponse | ErrorResponse) => {
      if (isErrorResponse(message)) {
        // Always create end mark on error to match the start mark
        if (typeof performance !== 'undefined' && typeof performance.mark === 'function' && typeof performance.measure === 'function') {
          performance.mark(`${method} - ${uuid} - end`);
          try {
            performance.measure(method, `${method} - ${uuid} - start`, `${method} - ${uuid} - end`);
          } catch {
            // Ignore if start mark doesn't exist
          }
        }

        if (message?.error?.data?.errname === ApiErrorName.NotAuthenticated) {
          this.wsStatus.setLoginStatus(false);
          return EMPTY;
        }

        return throwError(() => new ApiCallError(message.error as JsonRpcError));
      }

      if (typeof performance !== 'undefined' && typeof performance.mark === 'function' && typeof performance.measure === 'function') {
        performance.mark(`${method} - ${uuid} - end`);
        try {
          performance.measure(method, `${method} - ${uuid} - start`, `${method} - ${uuid} - end`);
        } catch {
          // Ignore if start mark doesn't exist
        }
      }

      return of(message);
    });
  }
}
