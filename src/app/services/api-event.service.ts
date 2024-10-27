import { Injectable } from '@angular/core';
import { UUID } from 'angular2-uuid';
import { filter, map, merge, Observable, of, share, startWith, Subject, Subscriber, switchMap, takeUntil, throwError } from 'rxjs';
import { IncomingApiMessageType, OutgoingApiMessageType } from 'app/enums/api-message-type.enum';
import { applyApiEvent } from 'app/helpers/operators/apply-api-event.operator';
import { observeJob } from 'app/helpers/operators/observe-job.operator';
import { ApiCallAndSubscribeMethod, ApiCallAndSubscribeResponse } from 'app/interfaces/api/api-call-and-subscribe-directory.interface';
import { ApiCallParams } from 'app/interfaces/api/api-call-directory.interface';
import { ApiJobMethod, ApiJobParams, ApiJobResponse } from 'app/interfaces/api/api-job-directory.interface';
import { ApiEvent, ApiEventMethod, ApiEventTyped, ResultMessage } from 'app/interfaces/api-message.interface';
import { Job } from 'app/interfaces/job.interface';
import { ApiMethodService } from 'app/services/api-method.service';
import { WebSocketHandlerService } from 'app/services/websocket-handler.service';

@Injectable({
  providedIn: 'root',
})
export class ApiEventService {
  private readonly eventSubscribers = new Map<ApiEventMethod, Observable<ApiEventTyped>>();
  readonly clearSubscriptions$ = new Subject<void>();

  constructor(
    private wsHandler: WebSocketHandlerService,
    private apiMethodService: ApiMethodService,
  ) {
    this.wsHandler.isConnected$?.subscribe((isConnected) => {
      if (!isConnected) {
        this.clearSubscriptions();
      }
    });
  }

  clearSubscriptions(): void {
    this.clearSubscriptions$.next();
    this.eventSubscribers.clear();
  }

  /**
   * For jobs better to use the `selectJob` store selector.
   */
  callAndSubscribe<M extends ApiCallAndSubscribeMethod>(
    method: M,
    params?: ApiCallParams<M>,
  ): Observable<ApiCallAndSubscribeResponse<M>[]> {
    return this.apiMethodService.call<M>(method, params)
      .pipe(
        switchMap((items) => this.subscribe(method).pipe(
          startWith(null),
          map((event) => ([items, event])),
        )),
        applyApiEvent(),
        takeUntil(this.clearSubscriptions$),
      );
  }

  subscribe<K extends ApiEventMethod = ApiEventMethod>(method: K | `${K}:${string}`): Observable<ApiEventTyped<K>> {
    if (this.eventSubscribers.has(method as K)) {
      return this.eventSubscribers.get(method as K);
    }
    const observable$ = new Observable((trigger: Subscriber<ApiEventTyped<K>>) => {
      const subscription = this.getEventSubscriber<K, ApiEventTyped<K>>(method as K).subscribe(trigger);
      return () => {
        subscription.unsubscribe();
        this.eventSubscribers.delete(method as K);
      };
    }).pipe(
      switchMap((apiEvent) => {
        const erroredEvent = apiEvent as unknown as ResultMessage;
        if (erroredEvent?.error) {
          console.error('Error: ', erroredEvent.error);
          return throwError(() => erroredEvent.error);
        }
        return of(apiEvent);
      }),
      share(),
      takeUntil(this.clearSubscriptions$),
    );

    this.eventSubscribers.set(method as K, observable$);
    return observable$;
  }

  private getEventSubscriber<K extends ApiEventMethod, R extends ApiEventTyped<K>>(name: K): Observable<R> {
    const id = UUID.UUID();
    return this.wsHandler.wsConnection.event(
      () => ({ id, name, msg: OutgoingApiMessageType.Sub }),
      () => ({ id, msg: OutgoingApiMessageType.UnSub }),
      (message: R) => (message.collection === name && message.msg !== IncomingApiMessageType.NoSub),
    );
  }

  subscribeToLogs(name: string): Observable<ApiEvent<{ data: string }>> {
    return this.subscribe(name as ApiEventMethod) as unknown as Observable<ApiEvent<{ data: string }>>;
  }

  /**
   * Use `job` when you care about job progress or result.
   */
  startJob<M extends ApiJobMethod>(method: M, params?: ApiJobParams<M>): Observable<number> {
    return this.apiMethodService.call(method, params);
  }

  /**
   * In your subscription, next will be next job update, complete will be when the job is complete.
   */
  job<M extends ApiJobMethod>(
    method: M,
    params?: ApiJobParams<M>,
  ): Observable<Job<ApiJobResponse<M>>> {
    return this.apiMethodService.call(method, params).pipe(
      switchMap((jobId: number) => {
        return merge(
          this.subscribeToJobUpdates(jobId),
          // Get job status here for jobs that complete too fast.
          this.apiMethodService.call('core.get_jobs', [[['id', '=', jobId]]]).pipe(map((jobs) => jobs[0])),
        )
          .pipe(observeJob());
      }),
      takeUntil(this.clearSubscriptions$),
    ) as Observable<Job<ApiJobResponse<M>>>;
  }

  private subscribeToJobUpdates(jobId: number): Observable<Job> {
    return this.subscribe('core.get_jobs').pipe(
      filter((apiEvent) => apiEvent.id === jobId),
      map((apiEvent) => apiEvent.fields),
      takeUntil(this.clearSubscriptions$),
    );
  }
}
