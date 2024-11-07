import { Inject, Injectable } from '@angular/core';
import { untilDestroyed } from '@ngneat/until-destroy';
import { UUID } from 'angular2-uuid';
import { environment } from 'environments/environment';
import { BehaviorSubject, buffer, combineLatest, concatMap, filter, interval, map, merge, NEVER, Observable, Subject, switchMap, tap, timer } from 'rxjs';
import { webSocket as rxjsWebSocket } from 'rxjs/webSocket';
import { IncomingApiMessageType, OutgoingApiMessageType } from 'app/enums/api-message-type.enum';
import { WEBSOCKET } from 'app/helpers/websocket.helper';
import { WINDOW } from 'app/helpers/window.helper';
import { ApiEventMethod, ApiEventTyped, IncomingApiMessage } from 'app/interfaces/api-message.interface';
import { WebSocketConnection } from 'app/services/websocket/websocket-connection.class';

@Injectable({
  providedIn: 'root',
})
export class WebSocketHandlerService {
  private readonly wsConnection: WebSocketConnection = new WebSocketConnection(this.webSocket);
  private connectionUrl = (this.window.location.protocol === 'https:' ? 'wss://' : 'ws://') + environment.remote + '/websocket';
  private readonly callScheduler$ = new Subject<unknown>();

  private readonly connectMsgReceived = new BehaviorSubject(false);
  readonly isConnected$ = this.connectMsgReceived.asObservable();

  private readonly pingTimeoutMillis = 20 * 1000;
  private readonly reconnectTimeoutMillis = 5 * 1000;

  private isReconnecting = false;

  private readonly hasRestrictedError$ = new BehaviorSubject(false);
  set isAccessRestricted$(value: boolean) {
    this.hasRestrictedError$.next(value);
  }

  get isAccessRestricted$(): Observable<boolean> {
    return this.hasRestrictedError$.asObservable();
  }

  get responseStream$(): Observable<unknown> {
    return this.wsConnection.stream$;
  }

  constructor(
    @Inject(WINDOW) protected window: Window,
    @Inject(WEBSOCKET) private webSocket: typeof rxjsWebSocket,
  ) {
    this.setupWebSocket();
  }

  private setupWebSocket(): void {
    this.connectWebSocket();
    this.setupSubscriptionUpdates();
    this.setupScheduledCalls();
    this.setupPing();
  }

  private connectWebSocket(): void {
    this.wsConnection.connect({
      url: this.connectionUrl,
      openObserver: {
        next: this.sendConnectMessage.bind(this),
      },
      closeObserver: {
        next: this.onClose.bind(this),
      },
    });
  }

  private setupSubscriptionUpdates(): void {
    this.wsConnection.stream$.pipe(
      tap((response: IncomingApiMessage) => {
        if (response.msg === IncomingApiMessageType.Connected) {
          performance.mark('WS Connected');
          performance.measure('Establishing WS connection', 'WS Init', 'WS Connected');
          this.connectMsgReceived.next(true);
        }
      }),
    ).subscribe();
  }

  private setupPing(): void {
    this.connectMsgReceived.pipe(
      switchMap((isConnected) => {
        if (!isConnected) {
          return NEVER;
        }

        return interval(this.pingTimeoutMillis);
      }),
    ).subscribe(() => {
      this.wsConnection.send({ msg: OutgoingApiMessageType.Ping, id: UUID.UUID() });
    });
  }

  private sendConnectMessage(): void {
    this.wsConnection.send({
      msg: OutgoingApiMessageType.Connect,
      version: '1',
      support: ['1'],
    });
  }

  private onClose(event: CloseEvent): void {
    this.connectMsgReceived.next(false);
    if (event.code === 1008) {
      this.isAccessRestricted$ = true;
    } else {
      this.reconnect();
    }
  }

  private reconnect(): void {
    this.isReconnecting = true;
    timer(this.reconnectTimeoutMillis).subscribe({
      next: () => {
        this.isReconnecting = false;
        this.setupWebSocket();
      },
    });
  }

  private setupScheduledCalls(): void {
    const bufferedCalls$ = this.callScheduler$.pipe(
      buffer(this.isConnected$.pipe(filter(Boolean))),
    );
    const delayedCalls$ = this.isConnected$.pipe(
      filter((isConnected) => !isConnected),
      switchMap(() => bufferedCalls$),
      concatMap((calls) => calls),
    );

    const immediateCalls$ = combineLatest([
      this.callScheduler$,
      this.isConnected$,
    ]).pipe(
      filter(([, isConnected]) => isConnected),
      map(([payload]) => payload),
    );

    merge(immediateCalls$, delayedCalls$).pipe(
      tap((call: unknown) => {
        this.wsConnection.send(call);
      }),
      untilDestroyed(this),
    ).subscribe();
  }

  scheduleCall(payload: unknown): void {
    this.callScheduler$.next(payload);
  }

  buildSubscriber<K extends ApiEventMethod, R extends ApiEventTyped<K>>(name: K): Observable<R> {
    const id = UUID.UUID();
    return this.wsConnection.event(
      () => ({ id, name, msg: OutgoingApiMessageType.Sub }),
      () => ({ id, msg: OutgoingApiMessageType.UnSub }),
      (message: R) => (message.collection === name && message.msg !== IncomingApiMessageType.NoSub),
    );
  }
}
