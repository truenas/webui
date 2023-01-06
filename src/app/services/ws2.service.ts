import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { UntilDestroy } from '@ngneat/until-destroy';
import { UUID } from 'angular2-uuid';
import { LocalStorage } from 'ngx-webstorage';
import { Observable } from 'rxjs';
import {
  filter, map, share, switchMap, take,
} from 'rxjs/operators';
import { IncomingApiMessageType } from 'app/enums/api-message-type.enum';
import { ApiDirectory, ApiMethod } from 'app/interfaces/api-directory.interface';
import { ApiEventDirectory } from 'app/interfaces/api-event-directory.interface';
import { ApiEvent, IncomingWebsocketMessage, ResultMessage } from 'app/interfaces/api-message.interface';
import { Job } from 'app/interfaces/job.interface';
import { WebsocketManagerService } from 'app/services/ws-manager.service';

@UntilDestroy()
@Injectable({
  providedIn: 'root',
})
export class WebSocketService2 {
  @LocalStorage() token2: string;
  private readonly eventSubscriptions: Map<string, Observable<unknown>> = new Map();
  constructor(
    protected router: Router,
    private wsManager: WebsocketManagerService,
  ) { }

  private get ws$(): Observable<unknown> {
    return this.wsManager.websocketSubject$;
  }

  call<K extends ApiMethod>(method: K, params?: ApiDirectory[K]['params']): Observable<ApiDirectory[K]['response']> {
    const uuid = UUID.UUID();
    this.wsManager.send({
      id: uuid, msg: IncomingApiMessageType.Method, method, params,
    });
    return this.ws$.pipe(
      filter((data: IncomingWebsocketMessage) => data.msg === IncomingApiMessageType.Result && data.id === uuid),
      map((data: ResultMessage<ApiDirectory[K]['response']>) => data.result),
      take(1),
    );
  }

  job<K extends ApiMethod>(
    method: K,
    params?: ApiDirectory[K]['params'],
  ): Observable<ApiEvent<Job<ApiDirectory[K]['response']>>> {
    return this.call(method, params).pipe(
      switchMap((jobId) => {
        return this.subscribe('core.get_jobs').pipe(
          filter((apiEvent) => apiEvent.id === jobId),
        );
      }),
    );
  }

  subscribe<K extends keyof ApiEventDirectory>(name: K): Observable<ApiEvent<ApiEventDirectory[K]['response']>> {
    const oldObservable$ = this.eventSubscriptions.get(name);
    if (oldObservable$) {
      return oldObservable$ as Observable<ApiEvent<ApiEventDirectory[K]['response']>>;
    }

    const subObs$ = this.wsManager.buildSubscriber(name).pipe(share());
    this.eventSubscriptions.set(name, subObs$);
    return subObs$ as Observable<ApiEvent<ApiEventDirectory[K]['response']>>;
  }

  subscribeToLogs(name: string): Observable<ApiEvent<{ data: string }>> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return this.subscribe(name as any) as unknown as Observable<ApiEvent<{ data: string }>>;
  }
}
