import { Inject, Injectable } from '@angular/core';
import { UUID } from 'angular2-uuid';
import { environment } from 'environments/environment';
import { BehaviorSubject, interval, NEVER, Observable, switchMap, tap, timer } from 'rxjs';
import { IncomingApiMessageType, OutgoingApiMessageType } from 'app/enums/api-message-type.enum';
import { WINDOW } from 'app/helpers/window.helper';
import { IncomingApiMessage } from 'app/interfaces/api-message.interface';
import { WebSocketConnection2Service } from 'app/services/websocket-connection2.service';

@Injectable({
  providedIn: 'root',
})
export class WebSocketHandlerService {
  private connectionUrl = (this.window.location.protocol === 'https:' ? 'wss://' : 'ws://') + environment.remote + '/websocket';

  readonly isConnected$ = new BehaviorSubject(false);

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

  constructor(
    @Inject(WINDOW) protected window: Window,
    public wsConnection: WebSocketConnection2Service,
  ) {
    this.setupWebSocket();
  }

  private setupWebSocket(): void {
    this.connectWebSocket();
    this.setupSubscriptionUpdates();
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
    this.wsConnection.websocket$.pipe(
      tap((response: IncomingApiMessage) => {
        if (response.msg === IncomingApiMessageType.Connected) {
          performance.mark('WS Connected');
          performance.measure('Establishing WS connection', 'WS Init', 'WS Connected');
          this.isConnected$.next(true);
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
    this.isConnected$.next(false);
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
}
