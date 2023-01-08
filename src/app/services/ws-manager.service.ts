import { Inject, Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { UUID } from 'angular2-uuid';
import { environment } from 'environments/environment';
import {
  BehaviorSubject, EMPTY, interval, Observable, of, switchMap, timer,
} from 'rxjs';
import { webSocket, WebSocketSubject } from 'rxjs/webSocket';
import { OutgoingApiMessageType } from 'app/enums/api-message-type.enum';
import { WINDOW } from 'app/helpers/window.helper';
import { ApiEvent, IncomingWebsocketMessage } from 'app/interfaces/api-message.interface';

@UntilDestroy()
@Injectable({
  providedIn: 'root',
})
export class WebsocketManagerService {
  private ws$: WebSocketSubject<unknown>;
  private readonly pingTimeoutMillis = 20 * 1000;
  private readonly reconnectTimeoutMillis = 5 * 1000;
  private isConnectionReady$ = new BehaviorSubject(false);

  get websocketSubject$(): Observable<unknown> {
    return this.ws$.asObservable().pipe(
      switchMap((data: IncomingWebsocketMessage) => {
        if (this.hasAuthError(data)) {
          this.ws$.complete();
          return EMPTY;
        }
        return of(data);
      }),
    );
  }

  get isConnected$(): Observable<boolean> {
    return this.isConnectionReady$.asObservable();
  }

  constructor(
    @Inject(WINDOW) protected window: Window,
    protected router: Router,
  ) {
    this.initializeWebsocket();
  }

  private initializeWebsocket(): void {
    this.ws$ = webSocket({
      url: (this.window.location.protocol === 'https:' ? 'wss://' : 'ws://') + environment.remote + '/websocket',
      openObserver: {
        next: this.onOpen.bind(this),
      },
      closeObserver: {
        next: this.onClose.bind(this),
      },
    });

    // Atleast one explicit subscription required to keep the connection open
    this.ws$.pipe(untilDestroyed(this)).subscribe();
  }

  private onOpen(): void {
    this.isConnectionReady$.next(true);
    this.setupConnectionEvents();
  }

  private onClose(): void {
    this.isConnectionReady$.next(false);
    this.router.navigate(['/sessions/signin']);
    timer(this.reconnectTimeoutMillis).pipe(untilDestroyed(this)).subscribe({
      next: () => this.initializeWebsocket(),
    });
  }

  private hasAuthError(data: IncomingWebsocketMessage): boolean {
    return 'error' in data && data.error.error === 207;
  }

  private setupPing(): void {
    interval(this.pingTimeoutMillis).pipe(untilDestroyed(this)).subscribe({
      next: () => {
        this.ws$.next({ msg: OutgoingApiMessageType.Ping, id: UUID.UUID() });
      },
    });
  }

  private setupConnectionEvents(): void {
    this.send({
      msg: OutgoingApiMessageType.Connect,
      version: '1',
      support: ['1'],
    });
    this.setupPing();
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
    this.ws$.next(payload);
  }
}
