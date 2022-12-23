import { Inject, Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { UUID } from 'angular2-uuid';
import { environment } from 'environments/environment';
import { EMPTY, Observable, of } from 'rxjs';
import {
  filter, map, share, switchMap, take,
} from 'rxjs/operators';
import { webSocket, WebSocketSubject } from 'rxjs/webSocket';
import { IncomingApiMessageType, OutgoingApiMessageType } from 'app/enums/api-message-type.enum';
import { WINDOW } from 'app/helpers/window.helper';
import { ApiDirectory, ApiMethod } from 'app/interfaces/api-directory.interface';
import { ApiEventDirectory, LogsEventDirectory } from 'app/interfaces/api-event-directory.interface';
import { ApiEvent, IncomingWebsocketMessage, ResultMessage } from 'app/interfaces/api-message.interface';

@Injectable()
export class WebsocketService2 {
  subject$: WebSocketSubject<unknown>;
  private readonly eventSubscriptions: Map<string, Observable<unknown>> = new Map();
  constructor(
    protected router: Router,
    @Inject(WINDOW) protected window: Window,
  ) {
    this.subject$ = webSocket(
      (this.window.location.protocol === 'https:' ? 'wss://' : 'ws://')
      + environment.remote + '/websocket',
    );
    this.send({
      msg: OutgoingApiMessageType.Connect,
      version: '1',
      support: ['1'],
    });

    this.subject$.subscribe({
      complete: () => {
        this.router.navigate(['/sessions/signin']);
      },
    });
    this.ping();
  }

  ping(): void {
    this.subject$.next({ msg: OutgoingApiMessageType.Ping, id: UUID.UUID() });
    setTimeout(() => this.ping(), 20 * 1000);
  }

  setupCall<K extends ApiMethod>(method: K, params?: ApiDirectory[K]['params']): Observable<ApiDirectory[K]['response']> {
    const uuid = UUID.UUID();
    this.send({
      id: uuid, msg: IncomingApiMessageType.Method, method, params,
    });
    return this.subject$.pipe(
      filter((msg: IncomingWebsocketMessage) => msg.msg === IncomingApiMessageType.Result),
      switchMap((msg: ResultMessage<ApiDirectory[K]['response']>) => {
        const data: IncomingWebsocketMessage = msg;
        if (this.hasAuthError(data)) {
          this.subject$.complete();
          return EMPTY;
        }
        return of(data);
      }),
      filter((data: IncomingWebsocketMessage) => {
        return data.msg === IncomingApiMessageType.Result && data.id === uuid;
      }),
      map((data: ResultMessage<ApiDirectory[K]['response']>) => data.result),
      take(1),
    );
  }

  hasAuthError(data: IncomingWebsocketMessage): boolean {
    return 'error' in data && data.error.error === 207;
  }

  send(payload: unknown): void {
    this.subject$.next(payload);
  }

  setupSubscription<K extends keyof ApiEventDirectory>(name: K | string): Observable<ApiEvent<ApiEventDirectory[K]['response'] & LogsEventDirectory[K]['response']>> {
    const endpoint = name.replace('.', '_'); // Avoid weird behavior
    const uuid = UUID.UUID();
    const oldObservable$ = this.eventSubscriptions.get(endpoint);
    if (oldObservable$) {
      return oldObservable$ as Observable<ApiEvent<ApiEventDirectory[K]['response'] & LogsEventDirectory[K]['response']>>;
    }

    const subObs$ = this.subject$.multiplex(
      () => ({
        id: uuid,
        name,
        msg: OutgoingApiMessageType.Sub,
      }),
      () => ({
        id: uuid,
        msg: OutgoingApiMessageType.UnSub,
      }),
      (message) => {
        return (message as ApiEvent).collection === name;
      },
    ).pipe(share()) as Observable<ApiEvent<ApiEventDirectory[K]['response'] & LogsEventDirectory[K]['response']>>;
    this.eventSubscriptions.set(endpoint, subObs$);
    return subObs$;
  }
}
