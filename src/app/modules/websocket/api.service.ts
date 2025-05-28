import { inject, Injectable } from '@angular/core';
import { select, Store } from '@ngrx/store';
import { TranslateService } from '@ngx-translate/core';
import { UUID } from 'angular2-uuid';
import {
  filter,
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
  SuccessfulResponse,
} from 'app/interfaces/api-message.interface';
import { Job } from 'app/interfaces/job.interface';
import { JobSlice, selectJobWithCallId } from 'app/modules/jobs/store/job.selectors';
import { SubscriptionManagerService } from 'app/modules/websocket/subscription-manager.service';
import { WebSocketHandlerService } from 'app/modules/websocket/websocket-handler.service';
import { ApiCallError } from 'app/services/errors/error.classes';
import { WebSocketStatusService } from 'app/services/websocket-status.service';

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  readonly clearSubscriptions$ = new Subject<void>();

  private store$: Store<JobSlice> = inject<Store<JobSlice>>(Store<JobSlice>);

  constructor(
    protected wsHandler: WebSocketHandlerService,
    protected wsStatus: WebSocketStatusService,
    protected subscriptionManager: SubscriptionManagerService,
    protected translate: TranslateService,
  ) {
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
    const uuid = UUID.UUID();
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
    );
    return this.store$.pipe(
      select(selectJobWithCallId(uuid)),
      filter((job): job is Job<ApiJobResponse<M>> => !!job),
      observeJob(),
      takeUntil(merge(this.clearSubscriptions$, callResponse$)),
    ) as Observable<Job<ApiJobResponse<M>>>;
  }

  subscribe<K extends ApiEventMethod = ApiEventMethod>(method: K | `${K}:${string}`): Observable<ApiEventTyped<K>> {
    return this.subscriptionManager.subscribe(method).pipe(
      switchMap((apiEvent) => {
        const erroredEvent = apiEvent as unknown as IncomingMessage;
        if (isErrorResponse(erroredEvent)) {
          return throwError(() => new ApiCallError(erroredEvent.error));
        }
        return of(apiEvent);
      }),
      takeUntil(this.clearSubscriptions$),
    );
  }

  clearSubscriptions(): void {
    this.clearSubscriptions$.next();
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
    const uuid = UUID.UUID();
    return of(uuid).pipe(
      switchMap(() => {
        performance.mark(`${method} - ${uuid} - start`);

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
        return throwError(() => new ApiCallError(message.error));
      }

      performance.mark(`${method} - ${uuid} - end`);
      performance.measure(method, `${method} - ${uuid} - start`, `${method} - ${uuid} - end`);
      return of(message);
    });
  }
}
