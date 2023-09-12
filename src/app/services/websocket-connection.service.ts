import { Inject, Injectable } from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { UUID } from 'angular2-uuid';
import { environment } from 'environments/environment';
import {
  BehaviorSubject, EMPTY, interval, NEVER, Observable, of, switchMap, tap, timer,
} from 'rxjs';
import { webSocket as rxjsWebsocket, WebSocketSubject } from 'rxjs/webSocket';
import { IncomingApiMessageType, OutgoingApiMessageType } from 'app/enums/api-message-type.enum';
import { WEBSOCKET } from 'app/helpers/websocket.helper';
import { WINDOW } from 'app/helpers/window.helper';
import { ApiEvent, IncomingWebsocketMessage } from 'app/interfaces/api-message.interface';

@UntilDestroy()
@Injectable({
  providedIn: 'root',
})
export class WebsocketConnectionService {
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
    @Inject(WEBSOCKET) private webSocket: typeof rxjsWebsocket,
  ) {
    this.initializeWebsocket();
    this.setupPing();
  }

  private initializeWebsocket(): void {
    if (this.ws$) {
      this.ws$.complete();
    }

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
      switchMap((data: IncomingWebsocketMessage) => {
        if (this.hasAuthError(data)) {
          this.ws$.complete();
          return EMPTY;
        }
        return of(data);
      }),
    );
    // At least one explicit subscription required to keep the connection open
    this.ws$.pipe(
      tap((response: IncomingWebsocketMessage) => {
        if (response.msg === IncomingApiMessageType.Connected) {
          this.isConnected$.next(true);
        }
      }),
      untilDestroyed(this),
    ).subscribe();
    this.isConnected$.pipe(untilDestroyed(this)).subscribe({
      next: (isConnected) => {
        this.isConnectionReady = isConnected;
        if (isConnected) {
          const keys = this.pendingCallsBeforeConnectionReady.keys();
          for (const key of keys) {
            this.send(this.pendingCallsBeforeConnectionReady.get(key));
            this.pendingCallsBeforeConnectionReady.delete(key);
          }
        }
      },
    });
  }

  private onOpen(): void {
    if (this.isTryingReconnect) {
      this.closeWebsocketConnection();
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
    timer(this.reconnectTimeoutMillis).pipe(untilDestroyed(this)).subscribe({
      next: () => {
        this.isTryingReconnect = false;
        this.initializeWebsocket();
      },
    });
  }

  private hasAuthError(data: IncomingWebsocketMessage): boolean {
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
      untilDestroyed(this),
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

  buildSubscriber(name: string): Observable<unknown> {
    const uuid = UUID.UUID();
    return this.ws$.multiplex(
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
      (message) => ((message as ApiEvent).collection === name),
    );
  }

  send(payload: unknown): void {
    if (this.isConnectionReady) {
      this.ws$.next(payload);
    } else {
      this.pendingCallsBeforeConnectionReady.set(UUID.UUID(), payload);
    }
  }

  closeWebsocketConnection(): void {
    this.ws$.complete();
  }

  prepareShutdown(): void {
    this.shutDownInProgress = true;
  }

  setupConnectionUrl(protocol: string, remote: string): void {
    this.connectionUrl = (protocol === 'https:' ? 'wss://' : 'ws://')
      + remote + '/websocket';
  }
}
