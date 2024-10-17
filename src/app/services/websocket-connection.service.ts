import { Inject, Injectable } from '@angular/core';
import { UUID } from 'angular2-uuid';
import { environment } from 'environments/environment';
import {
  BehaviorSubject, interval, NEVER, Observable, of, switchMap, tap, timer,
} from 'rxjs';
import { webSocket as rxjsWebSocket, WebSocketSubject } from 'rxjs/webSocket';
import { IncomingApiMessageType, OutgoingApiMessageType } from 'app/enums/api-message-type.enum';
import { WEBSOCKET } from 'app/helpers/websocket.helper';
import { WINDOW } from 'app/helpers/window.helper';
import { ApiEventMethod, ApiEventTyped, IncomingWebSocketMessage } from 'app/interfaces/api-message.interface';

@Injectable({
  providedIn: 'root',
})
export class WebSocketConnectionService {
  private ws$: WebSocketSubject<unknown>;

  private readonly pingTimeoutMillis = 20 * 1000;
  private readonly reconnectTimeoutMillis = 5 * 1000;
  private pendingCallsBeforeConnectionReady = new Map<string, unknown>();

  isTryingReconnect = false;
  shutDownInProgress = false;
  private connectionUrl = (this.window.location.protocol === 'https:' ? 'wss://' : 'ws://') + environment.remote + '/websocket';

  private isConnectionReady = false;
  private wsAsObservable$: Observable<unknown>;

  get websocket$(): Observable<unknown> {
    return this.wsAsObservable$;
  }

  readonly isConnected$ = new BehaviorSubject(false);
  private readonly _isClosed$ = new BehaviorSubject(false);
  private readonly _isAccessRestricted$ = new BehaviorSubject(false);

  set isClosed$(value: boolean) {
    this._isClosed$.next(value);
  }

  get isClosed$(): Observable<boolean> {
    return this._isClosed$;
  }

  set isAccessRestricted$(value: boolean) {
    this._isAccessRestricted$.next(value);
  }

  get isAccessRestricted$(): Observable<boolean> {
    return this._isAccessRestricted$;
  }

  constructor(
    @Inject(WINDOW) protected window: Window,
    @Inject(WEBSOCKET) private webSocket: typeof rxjsWebSocket,
  ) {
    this.initializeWebSocket();
    this.subscribeToConnectionStatus();
    this.setupPing();
  }

  private initializeWebSocket(): void {
    if (this.ws$) {
      this.ws$.complete();
    }

    performance.mark('WS Init');
    this.ws$ = this.webSocket({
      url: this.connectionUrl,
      openObserver: {
        next: this.onOpen.bind(this),
      },
      closeObserver: {
        next: this.onClose.bind(this),
      },
    });
    this.wsAsObservable$ = this.ws$.asObservable().pipe(
      switchMap((data: IncomingWebSocketMessage) => {
        if (this.hasAuthError(data)) {
          console.error(data);
          this.ws$.complete();
        }
        return of(data);
      }),
    );
    // At least one explicit subscription required to keep the connection open
    this.ws$.pipe(
      tap((response: IncomingWebSocketMessage) => {
        if (response.msg === IncomingApiMessageType.Connected) {
          performance.mark('WS Connected');
          performance.measure('Establishing WS connection', 'WS Init', 'WS Connected');
          this.isConnected$.next(true);
        }
      }),
    ).subscribe();
  }

  private onOpen(): void {
    if (this.isTryingReconnect) {
      this.closeWebSocketConnection();
      return;
    }
    this.shutDownInProgress = false;
    this.sendConnectMessage();
  }

  /** TODO: Extract disconnection logic somewhere else */
  private onClose(event: CloseEvent): void {
    if (this.isTryingReconnect) {
      return;
    }
    this.isTryingReconnect = true;
    this.isConnected$.next(false);
    this.isClosed$ = true;
    if (event.code === 1008) {
      this.isAccessRestricted$ = true;
    } else {
      this.reconnect();
    }
  }

  reconnect(): void {
    timer(this.reconnectTimeoutMillis).subscribe({
      next: () => {
        this.isTryingReconnect = false;
        this.initializeWebSocket();
      },
    });
  }

  private hasAuthError(data: IncomingWebSocketMessage): boolean {
    return 'error' in data && data.error.error === 207;
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
      this.ws$.next({ msg: OutgoingApiMessageType.Ping, id: UUID.UUID() });
    });
  }

  private sendConnectMessage(): void {
    this.ws$.next({
      msg: OutgoingApiMessageType.Connect,
      version: '1',
      support: ['1'],
    });
  }

  buildSubscriber<K extends ApiEventMethod, R extends ApiEventTyped<K>>(name: K): Observable<R> {
    const id = UUID.UUID();
    return this.ws$.multiplex(
      () => ({ id, name, msg: OutgoingApiMessageType.Sub }),
      () => ({ id, msg: OutgoingApiMessageType.UnSub }),
      (message: R) => (message.collection === name && message.msg !== IncomingApiMessageType.NoSub),
    ) as Observable<R>;
  }

  send(payload: unknown): void {
    if (this.isConnectionReady) {
      this.ws$.next(payload);
    } else {
      this.pendingCallsBeforeConnectionReady.set(UUID.UUID(), payload);
    }
  }

  sendPendingCalls(): void {
    this.pendingCallsBeforeConnectionReady.forEach((value, key) => {
      this.send(value);
      this.pendingCallsBeforeConnectionReady.delete(key);
    });
  }

  closeWebSocketConnection(): void {
    this.ws$.complete();
  }

  prepareShutdown(): void {
    this.shutDownInProgress = true;
  }

  setupConnectionUrl(protocol: string, remote: string): void {
    this.connectionUrl = (protocol === 'https:' ? 'wss://' : 'ws://') + remote + '/websocket';
  }

  private subscribeToConnectionStatus(): void {
    this.isConnected$.subscribe({
      next: (isConnected) => {
        this.isConnectionReady = isConnected;
        if (isConnected) {
          this.sendPendingCalls();
        }
      },
    });
  }
}
