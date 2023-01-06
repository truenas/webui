import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { UUID } from 'angular2-uuid';
import { LocalStorage } from 'ngx-webstorage';
import {
  EMPTY, Observable, of,
} from 'rxjs';
import {
  filter, map, share, switchMap, take,
} from 'rxjs/operators';
import { WebSocketSubject } from 'rxjs/webSocket';
import { IncomingApiMessageType, OutgoingApiMessageType } from 'app/enums/api-message-type.enum';
import { ApiDirectory, ApiMethod } from 'app/interfaces/api-directory.interface';
import { ApiEventDirectory } from 'app/interfaces/api-event-directory.interface';
import { ApiEvent, IncomingWebsocketMessage, ResultMessage } from 'app/interfaces/api-message.interface';
import { Job } from 'app/interfaces/job.interface';
import { WebsocketManagerService } from 'app/services/ws-manager.service';

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

  get ws$(): WebSocketSubject<unknown> {
    return this.wsManager.websocketSubject$;
  }

  get isConnected(): boolean {
    return !this.ws$.closed;
  }

  call<K extends ApiMethod>(method: K, params?: ApiDirectory[K]['params']): Observable<ApiDirectory[K]['response']> {
    const uuid = UUID.UUID();
    this.ws$.next({
      id: uuid, msg: IncomingApiMessageType.Method, method, params,
    });
    return this.ws$.pipe(
      filter((data: IncomingWebsocketMessage) => data.msg === IncomingApiMessageType.Result && data.id === uuid),
      switchMap((data: IncomingWebsocketMessage) => {
        if (this.hasAuthError(data)) {
          this.ws$.complete();
          return EMPTY;
        }
        return of(data);
      }),
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

  private hasAuthError(data: IncomingWebsocketMessage): boolean {
    return 'error' in data && data.error.error === 207;
  }

  subscribe<K extends keyof ApiEventDirectory>(name: K): Observable<ApiEvent<ApiEventDirectory[K]['response']>> {
    const endpoint = name.replace('.', '_'); // Avoid weird behavior
    const uuid = UUID.UUID();
    const oldObservable$ = this.eventSubscriptions.get(endpoint);
    if (oldObservable$) {
      return oldObservable$ as Observable<ApiEvent<ApiEventDirectory[K]['response']>>;
    }

    const subObs$ = this.ws$.multiplex(
      () => {
        return {
          id: uuid,
          name,
          msg: OutgoingApiMessageType.Sub,
        };
      },
      () => {
        return {
          id: uuid,
          msg: OutgoingApiMessageType.UnSub,
        };
      },
      (message) => {
        return (message as ApiEvent).collection === name;
      },
    ).pipe(share()) as Observable<ApiEvent<ApiEventDirectory[K]['response']>>;
    this.eventSubscriptions.set(endpoint, subObs$);
    return subObs$;
  }

  subscribeToLogs(name: string): Observable<ApiEvent<{ data: string }>> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return this.subscribe(name as any) as unknown as Observable<ApiEvent<{ data: string }>>;
  }
}
