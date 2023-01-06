import { Inject, Injectable, OnDestroy } from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { UUID } from 'angular2-uuid';
import { environment } from 'environments/environment';
import { webSocket, WebSocketSubject } from 'rxjs/webSocket';
import { OutgoingApiMessageType } from 'app/enums/api-message-type.enum';
import { WINDOW } from 'app/helpers/window.helper';
import { Timeout } from 'app/interfaces/timeout.interface';

@UntilDestroy()
@Injectable({
  providedIn: 'root',
})
export class WebsocketManagerService implements OnDestroy {
  private pingTimeout: Timeout;
  private ws$: WebSocketSubject<unknown>;
  private readonly pingTimeoutMillis = 20 * 1000;

  get websocketSubject$(): WebSocketSubject<unknown> {
    return this.ws$;
  }

  constructor(
    @Inject(WINDOW) protected window: Window,
  ) {
    this.initializeWebsocket();
  }

  initializeWebsocket(): void {
    if (!this.ws$ || this.ws$.closed) {
      this.ws$ = webSocket(
        (this.window.location.protocol === 'https:' ? 'wss://' : 'ws://')
        + environment.remote + '/websocket',
      );
    }
    this.setupConnectionEvents();
  }

  private setupPing(): void {
    this.clearPingTimeout();
    this.pingTimeout = setInterval(() => {
      this.ws$.next({ msg: OutgoingApiMessageType.Ping, id: UUID.UUID() });
    }, this.pingTimeoutMillis);
  }

  ngOnDestroy(): void {
    this.clearPingTimeout();
  }

  private clearPingTimeout(): void {
    if (this.pingTimeout) {
      clearTimeout(this.pingTimeout);
    }
  }

  private setupConnectionEvents(): void {
    this.send({
      msg: OutgoingApiMessageType.Connect,
      version: '1',
      support: ['1'],
    });
    this.setupPing();
    this.ws$.pipe(untilDestroyed(this)).subscribe({
      complete: () => this.initializeWebsocket(),
    });
  }

  private send(payload: unknown): void {
    this.ws$.next(payload);
  }
}
