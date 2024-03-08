import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { UUID } from 'angular2-uuid';
import { environment } from 'environments/environment';
import {
  merge, Observable, of, Subject, throwError,
} from 'rxjs';
import {
  filter, map, share, switchMap, take, takeUntil, takeWhile, tap,
} from 'rxjs/operators';
import { MockEnclosureUtils } from 'app/core/testing/utils/mock-enclosure.utils';
import { IncomingApiMessageType } from 'app/enums/api-message-type.enum';
import { JobState } from 'app/enums/job-state.enum';
import { ResponseErrorType } from 'app/enums/response-error-type.enum';
import { WebSocketErrorName } from 'app/enums/websocket-error-name.enum';
import {
  ApiCallMethod,
  ApiCallParams,
  ApiCallResponse,
} from 'app/interfaces/api/api-call-directory.interface';
import { ApiEventDirectory } from 'app/interfaces/api/api-event-directory.interface';
import {
  ApiJobMethod,
  ApiJobParams,
  ApiJobResponse,
} from 'app/interfaces/api/api-job-directory.interface';
import { ApiEvent, IncomingWebSocketMessage, ResultMessage } from 'app/interfaces/api-message.interface';
import { Job } from 'app/interfaces/job.interface';
import { WebSocketError } from 'app/interfaces/websocket-error.interface';
import { WebSocketConnectionService } from 'app/services/websocket-connection.service';

export type ApiEventSubscription = Observable<ApiEvent<ApiEventDirectory[keyof ApiEventDirectory]['response']>>;

@Injectable({
  providedIn: 'root',
})
export class WebSocketService {
  private readonly eventSubscriptions = new Map<string, ApiEventSubscription>();
  clearSubscriptions$ = new Subject<void>();
  mockUtils: MockEnclosureUtils;

  constructor(
    protected router: Router,
    protected wsManager: WebSocketConnectionService,
    protected translate: TranslateService,
  ) {
    if (environment.mockConfig && !environment?.production) this.mockUtils = new MockEnclosureUtils();
    this.wsManager.isConnected$?.subscribe((isConnected) => {
      if (!isConnected) {
        this.clearSubscriptions();
      }
    });
  }

  private get ws$(): Observable<unknown> {
    return this.wsManager.websocket$;
  }

  call<M extends ApiCallMethod>(method: M, params?: ApiCallParams<M>): Observable<ApiCallResponse<M>> {
    return this.callMethod(method, params);
  }

  /**
   * Use `job` when you care about job progress or result.
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
          .pipe(
            takeWhile((job) => !job.time_finished, true),
            switchMap((job) => {
              if (job.state === JobState.Failed) {
                return throwError(() => job);
              }
              return of(job);
            }),
          );
      }),
      takeUntil(this.clearSubscriptions$),
    ) as Observable<Job<ApiJobResponse<M>>>;
  }

  subscribe<K extends keyof ApiEventDirectory>(name: K): Observable<ApiEvent<ApiEventDirectory[K]['response']>> {
    if (this.eventSubscriptions.has(name)) {
      return this.eventSubscriptions.get(name);
    }

    const eventSubscription$ = this.wsManager.buildSubscriber(name).pipe(
      switchMap((apiEvent: unknown) => {
        const erroredEvent = apiEvent as { error: unknown };
        if (erroredEvent.error) {
          console.error('Error: ', erroredEvent.error);
          return throwError(() => erroredEvent.error);
        }
        return of(apiEvent);
      }),
      share(),
      takeUntil(this.clearSubscriptions$),
    ) as Observable<ApiEvent<ApiEventDirectory[K]['response']>>;
    this.eventSubscriptions.set(name, eventSubscription$);
    return eventSubscription$;
  }

  subscribeToLogs(name: string): Observable<ApiEvent<{ data: string }>> {
    return this.subscribe(name as keyof ApiEventDirectory) as unknown as Observable<ApiEvent<{ data: string }>>;
  }

  clearSubscriptions(): void {
    this.clearSubscriptions$.next();
    this.eventSubscriptions.clear();
  }

  private callMethod<M extends ApiCallMethod>(method: M, params?: ApiCallParams<M>): Observable<ApiCallResponse<M>>;
  private callMethod<M extends ApiJobMethod>(method: M, params?: ApiJobParams<M>): Observable<number>;
  private callMethod<M extends ApiCallMethod | ApiJobMethod>(method: M, params?: unknown): Observable<unknown> {
    const uuid = UUID.UUID();
    return of(uuid).pipe(
      tap(() => {
        this.wsManager.send({
          id: uuid, msg: IncomingApiMessageType.Method, method, params,
        });
      }),
      switchMap(() => this.ws$),
      filter((data: IncomingWebSocketMessage) => data.msg === IncomingApiMessageType.Result && data.id === uuid),
      switchMap((data: IncomingWebSocketMessage) => {
        if ('error' in data && data.error) {
          this.printError(data.error, { method, params });
          const error = this.enhanceError(data.error, { method });
          return throwError(() => error);
        }

        if (
          this.mockUtils
          && environment.mockConfig?.enabled
          && this.mockUtils?.canMock
          && data.msg === IncomingApiMessageType.Result
        ) {
          const mockResultMessage: ResultMessage = this.mockUtils.overrideMessage(data, method);
          return of(mockResultMessage);
        }

        return of(data);
      }),

      map((data: ResultMessage) => data.result),
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

  private printError(error: WebSocketError, context: { method: string; params: unknown }): void {
    if (error.errname === WebSocketErrorName.NoAccess) {
      console.error(`Access denied to ${context.method} with ${context.params ? JSON.stringify(context.params) : 'no params'}`);
      return;
    }

    // Do not log validation errors.
    if (error.type === ResponseErrorType.Validation) {
      return;
    }

    console.error('Error: ', error);
  }

  private enhanceError(error: WebSocketError, context: { method: string }): WebSocketError {
    if (error.errname === WebSocketErrorName.NoAccess) {
      return {
        ...error,
        reason: this.translate.instant('Access denied to {method}', { method: context.method }),
      };
    }

    return error;
  }
}
