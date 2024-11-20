import { Inject, Injectable } from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { UUID } from 'angular2-uuid';
import { environment } from 'environments/environment';
import {
  BehaviorSubject,
  combineLatest,
  filter,
  interval,
  map,
  mergeMap,
  NEVER,
  Observable,
  of,
  Subject,
  Subscription,
  switchMap,
  take,
  tap,
  timer,
} from 'rxjs';
import { webSocket as rxjsWebSocket } from 'rxjs/webSocket';
import { IncomingApiMessageType, OutgoingApiMessageType } from 'app/enums/api-message-type.enum';
import { WEBSOCKET } from 'app/helpers/websocket.helper';
import { WINDOW } from 'app/helpers/window.helper';
import { ApiEventMethod, ApiEventTyped, IncomingApiMessage } from 'app/interfaces/api-message.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { WebSocketConnection } from 'app/services/websocket/websocket-connection.class';

@UntilDestroy()
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
  private reconnectTimerSubscription: Subscription;
  private readonly maxConcurrentCalls = 20;

  private shutDownInProgress = false;
  get isSystemShuttingDown(): boolean {
    return this.shutDownInProgress;
  }

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
  private showingConcurrentCallsError = false;
  private callsInConcurrentCallsError = new Set<string>();

  constructor(
    private dialogService: DialogService,
    private translate: TranslateService,
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
    combineLatest([
      this.triggerNextCall$,
      this.isConnected$,
    ]).pipe(
      filter(([, isConnected]) => isConnected),
      tap(() => {
        if (this.activeCalls + 1 < this.maxConcurrentCalls) {
          return;
        }
        this.raiseConcurrentCallsError();
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

  private raiseConcurrentCallsError(): void {
    const callsWithoutErrorsReported = [
      ...this.queuedCalls,
      ...(this.pendingCalls.values()),
    ].filter((call: { id: string; method: string }) => {
      if (this.callsInConcurrentCallsError.has(call.id)) {
        return false;
      }
      this.callsInConcurrentCallsError.add(call.id);
      return true;
    }).map((call: { id: string; method: string }) => {
      return environment.production ? call.method : call;
    });
    if (!callsWithoutErrorsReported.length) {
      return;
    }
    console.error('Max concurrent calls', JSON.stringify(callsWithoutErrorsReported));

    if (this.showingConcurrentCallsError) {
      return;
    }

    if (!environment.production) {
      this.showingConcurrentCallsError = true;
      this.dialogService.error({
        message: this.translate.instant(`Max concurrent calls limit reached.
        There are more than 20 calls queued. 
        See queued calls in the browser's console logs`),
        title: this.translate.instant('Max Concurrent Calls'),
      }).pipe(untilDestroyed(this)).subscribe({
        next: () => {
          this.showingConcurrentCallsError = false;
        },
      });
    }
  }

  private connectWebSocket(): void {
    this.wsConnection.close();
    performance.mark('WS Init');
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
    this.connectMsgReceived$.next(false);
    this.isConnectionLive$.next(false);
    if (this.reconnectTimerSubscription) {
      return;
    }
    if (event.code === 1008) {
      this.isAccessRestricted$ = true;
    } else {
      this.initiateReconnect();
    }
  }

  private unsubscribeReconnectSubscription(): void {
    this.reconnectTimerSubscription.unsubscribe();
    this.reconnectTimerSubscription = undefined;
  }

  private onOpen(): void {
    if (this.reconnectTimerSubscription) {
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

  reconnect(): void {
    if (this.wsConnection.closed) {
      this.initiateReconnect();
    } else {
      this.wsConnection.close();
    }
  }

  private initiateReconnect(): void {
    if (this.reconnectTimerSubscription) {
      this.unsubscribeReconnectSubscription();
    }

    this.reconnectTimerSubscription = timer(this.reconnectTimeoutMillis).subscribe({
      next: () => {
        this.unsubscribeReconnectSubscription();
        this.setupWebSocket();
      },
    });
  }

  setupConnectionUrl(protocol: string, remote: string): void {
    this.connectionUrl = (protocol === 'https:' ? 'wss://' : 'ws://') + remote + '/websocket';
  }
}
