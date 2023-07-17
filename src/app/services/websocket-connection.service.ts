import { Inject, Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { UUID } from 'angular2-uuid';
import { environment } from 'environments/environment';
import {
  BehaviorSubject, EMPTY, interval, Observable, of, switchMap, tap, timer,
} from 'rxjs';
import { webSocket, WebSocketSubject } from 'rxjs/webSocket';
import { IncomingApiMessageType, OutgoingApiMessageType } from 'app/enums/api-message-type.enum';
import { WINDOW } from 'app/helpers/window.helper';
import { ApiEvent, IncomingWebsocketMessage } from 'app/interfaces/api-message.interface';
import { DialogService } from 'app/services/dialog.service';

@UntilDestroy()
@Injectable({
  providedIn: 'root',
})
export class WebsocketConnectionService {
  private ws$: WebSocketSubject<unknown>;

  private readonly pingTimeoutMillis = 20 * 1000;
  private readonly reconnectTimeoutMillis = 5 * 1000;
  private pendingCallsBeforeConnectionReady = new Map<string, unknown>();

  private isTryingReconnect = false;
  private shutDownInProgress = false;
  private connectionUrl = (this.window.location.protocol === 'https:' ? 'wss://' : 'ws://') + environment.remote + '/websocket';

  private isConnectionReady = false;
  private wsAsObservable$: Observable<unknown>;

  get websocket$(): Observable<unknown> {
    return this.wsAsObservable$;
  }

  readonly isConnected$ = new BehaviorSubject(false);

  constructor(
    @Inject(WINDOW) protected window: Window,
    protected router: Router,
    private dialog: MatDialog,
    private dialogService: DialogService,
    private translate: TranslateService,
  ) {
    this.initializeWebsocket();
  }

  private initializeWebsocket(): void {
    if (this.ws$) {
      this.ws$.complete();
    }

    this.ws$ = webSocket({
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
    this.setupConnectionEvents();
  }

  /** TODO: Extract disconnection logic somewhere else */
  private onClose(event: CloseEvent): void {
    if (this.isTryingReconnect) {
      return;
    }
    this.isTryingReconnect = true;
    this.isConnected$.next(false);
    this.resetUi();
    if (event.code === 1008) {
      this.dialogService.fullScreenDialog(
        this.translate.instant('Access restricted'),
        this.translate.instant('Access from your IP is restricted'),
      ).pipe(untilDestroyed(this)).subscribe(() => {
        timer(this.reconnectTimeoutMillis).pipe(untilDestroyed(this)).subscribe({
          next: () => {
            this.isTryingReconnect = false;
            this.initializeWebsocket();
          },
        });
      });
    } else {
      timer(this.reconnectTimeoutMillis).pipe(untilDestroyed(this)).subscribe({
        next: () => {
          this.isTryingReconnect = false;
          this.initializeWebsocket();
        },
      });
    }
  }

  resetUi(): void {
    this.closeAllDialogs();
    if (!this.shutDownInProgress) {
      this.router.navigate(['/sessions/signin']);
    }
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
    this.ws$.next({
      msg: OutgoingApiMessageType.Connect,
      version: '1',
      support: ['1'],
    });
    this.setupPing();
  }

  private closeAllDialogs(): void {
    for (const openDialog of this.dialog.openDialogs) {
      openDialog.close();
    }
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
