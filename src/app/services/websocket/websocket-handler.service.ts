import { Inject, Injectable } from '@angular/core';
import { UUID } from 'angular2-uuid';
import { environment } from 'environments/environment';
import { BehaviorSubject, filter, interval, map, mergeMap, NEVER, Observable, of, Subject, switchMap, take, tap, timer } from 'rxjs';
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

  private readonly connectMsgReceived$ = new BehaviorSubject(false);
  readonly isConnected$ = this.connectMsgReceived$.asObservable();

  private readonly pingTimeoutMillis = 20 * 1000;
  private readonly reconnectTimeoutMillis = 5 * 1000;
  private readonly maxConcurrentCalls = 20;

  private isReconnectScheduled = false;
  private shutDownInProgress = false;

  private readonly hasRestrictedError$ = new BehaviorSubject(false);
  set isAccessRestricted$(value: boolean) {
    this.hasRestrictedError$.next(value);
  }

  get isAccessRestricted$(): Observable<boolean> {
    return this.hasRestrictedError$.asObservable();
  }

  private readonly isConnectionLive$ = new BehaviorSubject(false);
  get isClosed$(): Observable<boolean> {
    return this.isConnectionLive$.pipe(map((isLive) => !isLive));
  }

  get responses$(): Observable<IncomingApiMessage> {
    return this.wsConnection.stream$ as Observable<IncomingApiMessage>;
  }

  private readonly triggerNextCall$ = new Subject<void>();
  private activeCalls = 0;
  private readonly queuedCalls: { id: string; [key: string]: unknown }[] = [];
  private readonly pendingCalls = new Map<string, { id: string; [key: string]: unknown }>();

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

  private setupScheduledCalls(): void {
    this.triggerNextCall$.pipe(
      tap(() => {
        if (this.activeCalls + 1 < this.maxConcurrentCalls) {
          return;
        }
        console.error(
          'Max concurrent calls',
          JSON.stringify(
            [
              ...this.queuedCalls,
              ...(this.pendingCalls.values()),
            ].map((call: { id: string; method: string }) => call.method),
          ),
        );
        if (!environment.production) {
          throw new Error(
            `Max concurrent calls limit reached.
            There are more than 20 calls queued. 
            See queued calls in the browser's console logs`,
          );
        }
      }),
      mergeMap(() => {
        return this.queuedCalls.length > 0 ? this.processCall(this.queuedCalls.shift()) : of(null);
      }, this.maxConcurrentCalls),
    ).subscribe();
  }

  private processCall(call: { id: string; [key: string]: unknown }): Observable<unknown> {
    this.activeCalls++;
    this.pendingCalls.set(call.id, call);
    this.wsConnection.send(call);

    return this.responses$.pipe(
      filter((data: IncomingApiMessage) => data.msg === IncomingApiMessageType.Result && data.id === call.id),
      take(1),
      tap(() => {
        this.activeCalls--;
        this.pendingCalls.delete(call.id);
        this.triggerNextCall$.next();
      }),
    );
  }

  private connectWebSocket(): void {
    this.wsConnection.connect({
      url: this.connectionUrl,
      openObserver: {
        next: this.onOpen.bind(this),
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
          this.connectMsgReceived$.next(true);
        }
      }),
    ).subscribe();
  }

  private setupPing(): void {
    this.isConnected$.pipe(
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
    if (this.isReconnectScheduled) {
      return;
    }
    this.isReconnectScheduled = true;
    this.connectMsgReceived$.next(false);
    this.isConnectionLive$.next(false);
    if (event.code === 1008) {
      this.isAccessRestricted$ = true;
    } else {
      this.reconnect();
    }
  }

  private reconnect(): void {
    this.isReconnectScheduled = true;
    timer(this.reconnectTimeoutMillis).subscribe({
      next: () => {
        this.isReconnectScheduled = false;
        this.setupWebSocket();
      },
    });
  }

  private onOpen(): void {
    if (this.isReconnectScheduled) {
      this.wsConnection.close();
      return;
    }
    this.shutDownInProgress = false;
    this.sendConnectMessage();
  }

  scheduleCall(payload: { id: string; [key: string]: unknown }): void {
    this.queuedCalls.push(payload);
    this.triggerNextCall$.next();
  }

  buildSubscriber<K extends ApiEventMethod, R extends ApiEventTyped<K>>(name: K): Observable<R> {
    const id = UUID.UUID();
    return this.wsConnection.event(
      () => ({ id, name, msg: OutgoingApiMessageType.Sub }),
      () => ({ id, msg: OutgoingApiMessageType.UnSub }),
      (message: R) => (message.collection === name && message.msg !== IncomingApiMessageType.NoSub),
    );
  }

  prepareShutdown(): void {
    this.shutDownInProgress = true;
  }
}
