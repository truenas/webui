import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
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
import {
  ApiCallDirectory, ApiCallMethod,
} from 'app/interfaces/api/api-call-directory.interface';
import { ApiEventDirectory } from 'app/interfaces/api/api-event-directory.interface';
import { ApiJobDirectory, ApiJobMethod } from 'app/interfaces/api/api-job-directory.interface';
import { ApiEvent, IncomingWebsocketMessage, ResultMessage } from 'app/interfaces/api-message.interface';
import { Job } from 'app/interfaces/job.interface';
import { WebsocketConnectionService } from 'app/services/websocket-connection.service';

@UntilDestroy()
@Injectable({
  providedIn: 'root',
})
export class WebSocketService {
  private readonly eventSubscriptions = new Map<string, { obs$: Observable<unknown>; takeUntil$: Subject<void> }>();
  mockUtils: MockEnclosureUtils;
  constructor(
    protected router: Router,
    protected wsManager: WebsocketConnectionService,
  ) {
    if (environment.mockConfig && !environment?.production) this.mockUtils = new MockEnclosureUtils();
    this.wsManager.isConnected$?.pipe(untilDestroyed(this)).subscribe((isConnected) => {
      if (!isConnected) {
        this.clearSubscriptions();
      }
    });
  }

  private get ws$(): Observable<unknown> {
    return this.wsManager.websocket$;
  }

  call<M extends ApiCallMethod>(method: M, params?: ApiCallDirectory[M]['params']): Observable<ApiCallDirectory[M]['response']> {
    return this.callMethod(method, params);
  }

  /**
   * Use `job` when you care about job progress or result.
   */
  startJob<M extends ApiJobMethod>(method: M, params?: ApiJobDirectory[M]['params']): Observable<number> {
    return this.callMethod(method, params);
  }

  /**
   * In your subscription, next will be next job update, complete will be when the job is complete.
   */
  job<M extends ApiJobMethod>(
    method: M,
    params?: ApiJobDirectory[M]['params'],
  ): Observable<Job<ApiJobDirectory[M]['response']>> {
    return this.callMethod(method, params).pipe(
      switchMap((jobId: number) => {
        return merge(
          this.subscribeToJobUpdates(jobId),
          // Get job status here for jobs that complete too fast.
          this.call('core.get_jobs', [[['id', '=', jobId]]]).pipe(map((jobs) => jobs[0])),
        )
          .pipe(
            takeWhile((job) => job.state !== JobState.Success, true),
            switchMap((job) => {
              if (job.state === JobState.Failed) {
                return throwError(() => job.error);
              }
              return of(job);
            }),
          );
      }),
    ) as Observable<Job<ApiJobDirectory[M]['response']>>;
  }

  subscribe<K extends keyof ApiEventDirectory>(name: K): Observable<ApiEvent<ApiEventDirectory[K]['response']>> {
    const oldObservable$ = this.eventSubscriptions.get(name)?.obs$;
    if (oldObservable$) {
      return oldObservable$ as Observable<ApiEvent<ApiEventDirectory[K]['response']>>;
    }

    const takeUntil$ = new Subject<void>();
    const subObs$ = this.wsManager.buildSubscriber(name).pipe(
      switchMap((apiEvent: unknown) => {
        const erroredEvent = apiEvent as { error: unknown };
        if (erroredEvent.error) {
          console.error('Error: ', erroredEvent.error);
          return throwError(() => erroredEvent.error);
        }
        return of(apiEvent);
      }),
      share(),
      takeUntil(takeUntil$),
    );
    this.eventSubscriptions.set(name, { obs$: subObs$, takeUntil$ });
    return subObs$ as Observable<ApiEvent<ApiEventDirectory[K]['response']>>;
  }

  subscribeToLogs(name: string): Observable<ApiEvent<{ data: string }>> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return this.subscribe(name as any) as unknown as Observable<ApiEvent<{ data: string }>>;
  }

  clearSubscriptions(): void {
    this.eventSubscriptions.forEach(
      ({ takeUntil$ }: { takeUntil$: Subject<void> }) => {
        takeUntil$.next();
      },
    );
    this.eventSubscriptions.clear();
  }

  private callMethod<M extends ApiCallMethod>(method: M, params?: ApiCallDirectory[M]['params']): Observable<ApiCallDirectory[M]['response']>;
  private callMethod<M extends ApiJobMethod>(method: M, params?: ApiJobDirectory[M]['params']): Observable<number>;
  private callMethod<M extends ApiCallMethod | ApiJobMethod>(method: M, params?: unknown): Observable<unknown> {
    const uuid = UUID.UUID();
    return of(uuid).pipe(
      tap(() => {
        this.wsManager.send({
          id: uuid, msg: IncomingApiMessageType.Method, method, params,
        });
      }),
      switchMap(() => this.ws$),
      filter((data: IncomingWebsocketMessage) => data.msg === IncomingApiMessageType.Result && data.id === uuid),
      switchMap((data: IncomingWebsocketMessage) => {
        if ('error' in data && data.error) {
          console.error('Error: ', data.error);
          return throwError(() => data.error);
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
    );
  }
}
