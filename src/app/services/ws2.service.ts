import { Inject, Injectable, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { UUID } from 'angular2-uuid';
import { environment } from 'environments/environment';
import {
  EMPTY, Observable, of,
} from 'rxjs';
import {
  filter, map, share, switchMap, take,
} from 'rxjs/operators';
import { webSocket, WebSocketSubject } from 'rxjs/webSocket';
import { IncomingApiMessageType, OutgoingApiMessageType } from 'app/enums/api-message-type.enum';
import { WINDOW } from 'app/helpers/window.helper';
import { ApiDirectory, ApiMethod } from 'app/interfaces/api-directory.interface';
import { ApiEventDirectory } from 'app/interfaces/api-event-directory.interface';
import { ApiEvent, IncomingWebsocketMessage, ResultMessage } from 'app/interfaces/api-message.interface';
import { Timeout } from 'app/interfaces/timeout.interface';

@Injectable()
export class WebSocketService2 implements OnDestroy {
  ws$: WebSocketSubject<unknown>;
  pingTimeout: Timeout;
  private readonly pingTimeoutMillis = 20 * 1000;
  private readonly eventSubscriptions: Map<string, Observable<unknown>> = new Map();
  constructor(
    protected router: Router,
    @Inject(WINDOW) protected window: Window,
  ) {
    this.initiateWebSocketConnection();
    this.ws$.subscribe({
      complete: () => {
        this.router.navigate(['/sessions/signin']);
        this.initiateWebSocketConnection();
      },
    });
  }

  initiateWebSocketConnection(): void {
    this.ws$ = this.buildWebSocketConnection();
    this.send({
      msg: OutgoingApiMessageType.Connect,
      version: '1',
      support: ['1'],
    });
    this.ping();
  }

  ngOnDestroy(): void {
    if (this.pingTimeout) {
      clearTimeout(this.pingTimeout);
    }
  }

  ping(): void {
    this.ngOnDestroy();
    this.pingTimeout = setTimeout(() => {
      this.send({ msg: OutgoingApiMessageType.Ping, id: UUID.UUID() });
    }, this.pingTimeoutMillis);
  }

  call<K extends ApiMethod>(method: K, params?: ApiDirectory[K]['params']): Observable<ApiDirectory[K]['response']> {
    const uuid = UUID.UUID();
    this.send({
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

  hasAuthError(data: IncomingWebsocketMessage): boolean {
    return 'error' in data && data.error.error === 207;
  }

  send(payload: unknown): void {
    this.ws$.next(payload);
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

  buildWebSocketConnection(): WebSocketSubject<unknown> {
    return webSocket(
      (this.window.location.protocol === 'https:' ? 'wss://' : 'ws://')
      + environment.remote + '/websocket',
    );
  }
}
