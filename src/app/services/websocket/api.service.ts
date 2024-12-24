import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { UUID } from 'angular2-uuid';
import {
  filter,
  map,
  merge,
  Observable,
  of,
  startWith,
  Subject,
  switchMap,
  take,
  takeUntil,
  throwError,
} from 'rxjs';
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
  SuccessfulResponse,
} from 'app/interfaces/api-message.interface';
import { Job } from 'app/interfaces/job.interface';
import { SubscriptionManagerService } from 'app/services/websocket/subscription-manager.service';
import { WebSocketHandlerService } from 'app/services/websocket/websocket-handler.service';

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  readonly clearSubscriptions$ = new Subject<void>();

  constructor(
    protected wsHandler: WebSocketHandlerService,
    protected subscriptionManager: SubscriptionManagerService,
    protected translate: TranslateService,
  ) {
    this.wsHandler.isConnected$?.subscribe((isConnected) => {
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
    return this.callMethod(method, params);
  }

  /**
   * In your subscription, next will be next job update, complete will be when the job is complete.
   */
  job<M extends ApiJobMethod>(
    method: M,
    params?: ApiJobParams<M>,
  ): Observable<Job<ApiJobResponse<M>>> {
    return this.callMethod(method, params).pipe(
      switchMap((jobId: number) => {
        return merge(
          this.subscribeToJobUpdates(jobId),
          // Get job status here for jobs that complete too fast.
          this.call('core.get_jobs', [[['id', '=', jobId]]]).pipe(map((jobs) => jobs[0])),
        )
          .pipe(observeJob());
      }),
      takeUntil(this.clearSubscriptions$),
    ) as Observable<Job<ApiJobResponse<M>>>;
  }

  subscribe<K extends ApiEventMethod = ApiEventMethod>(method: K | `${K}:${string}`): Observable<ApiEventTyped<K>> {
    return this.subscriptionManager.subscribe(method).pipe(
      switchMap((apiEvent) => {
        const erroredEvent = apiEvent as unknown as IncomingMessage;
        if (isErrorResponse(erroredEvent)) {
          console.error('Error: ', erroredEvent.error);
          return throwError(() => erroredEvent.error);
        }
        return of(apiEvent);
      }),
      takeUntil(this.clearSubscriptions$),
    );
  }

  clearSubscriptions(): void {
    this.clearSubscriptions$.next();
  }

  private callMethod<M extends ApiCallMethod>(method: M, params?: ApiCallParams<M>): Observable<ApiCallResponse<M>>;
  private callMethod<M extends ApiJobMethod>(method: M, params?: ApiJobParams<M>): Observable<number>;
  private callMethod<M extends ApiCallMethod | ApiJobMethod>(method: M, params?: unknown[]): Observable<unknown> {
    const uuid = UUID.UUID();
    return of(uuid).pipe(
      switchMap(() => {
        performance.mark(`${method} - ${uuid} - start`);
        this.wsHandler.scheduleCall({
          id: uuid, method, params,
        });
        return this.wsHandler.responses$.pipe(
          filter((message) => 'id' in message && message.id === uuid),
        );
      }),
      switchMap((message: SuccessfulResponse | ErrorResponse) => {
        if (isErrorResponse(message)) {
          this.printError(message, { method, params });
          const error = this.enhanceError(message, { method });
          return throwError(() => error);
        }

        performance.mark(`${method} - ${uuid} - end`);
        performance.measure(method, `${method} - ${uuid} - start`, `${method} - ${uuid} - end`);
        return of(message);
      }),

      map((message) => message.result),
      take(1),
    );
  }

  private subscribeToJobUpdates(jobId: number): Observable<Job> {
    return this.subscribe('core.get_jobs').pipe(
      filter((apiEvent) => apiEvent.id === jobId),
      map((apiEvent) => apiEvent.fields),
      takeUntil(this.clearSubscriptions$),
    );
  }

  private printError(response: ErrorResponse, context: { method: string; params: unknown }): void {
    if (response.error.data?.errname === ApiErrorName.NoAccess) {
      console.error(`Access denied to ${context.method} with ${context.params ? JSON.stringify(context.params) : 'no params'}. Original message: ${response.error.message}`);
      return;
    }

    // Do not log validation errors.
    if (response.error.data?.errname === ApiErrorName.Validation) {
      return;
    }

    console.error('Error: ', response.error);
  }

  // TODO: Probably doesn't belong here. Consider building something similar to interceptors.
  private enhanceError(response: ErrorResponse, context: { method: string }): ErrorResponse {
    if (response.error.data?.errname === ApiErrorName.NoAccess) {
      return {
        ...response,
        error: {
          ...response.error,
          data: {
            ...response.error.data,
            reason: response.error.message || this.translate.instant('Access denied to {method}', { method: context.method }),
          },
        },
      };
    }
    return response;
  }
}
