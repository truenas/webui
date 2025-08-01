import { Injectable, inject } from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { UUID } from 'angular2-uuid';
import { environment } from 'environments/environment';
import {
  BehaviorSubject,
  combineLatest,
  filter,
  map,
  merge,
  mergeMap,
  Observable,
  of,
  Subject,
  Subscription,
  take,
  tap,
  timer,
  shareReplay,
  catchError,
  throwError,
} from 'rxjs';
import { makeRequestMessage } from 'app/helpers/api.helper';
import { WEBSOCKET } from 'app/helpers/websocket.helper';
import { WINDOW } from 'app/helpers/window.helper';
import {
  RequestMessage, IncomingMessage,
} from 'app/interfaces/api-message.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { WebSocketConnection } from 'app/modules/websocket/websocket-connection.class';
import { MockResponseService } from 'app/modules/websocket-debug-panel/services/mock-response.service';
import { WebSocketDebugService } from 'app/modules/websocket-debug-panel/services/websocket-debug.service';
import { WebSocketStatusService } from 'app/services/websocket-status.service';
import {
  MockGenerationError, MockServiceError,
  WebSocketSendError,
} from './errors';

type ApiCall = Required<Pick<RequestMessage, 'id' | 'method' | 'params'>> & { jsonrpc: '2.0' };

@UntilDestroy()
@Injectable({
  providedIn: 'root',
})
export class WebSocketHandlerService {
  private wsStatus = inject(WebSocketStatusService);
  private dialogService = inject(DialogService);
  private translate = inject(TranslateService);
  protected window = inject<Window>(WINDOW);
  private webSocket = inject(WEBSOCKET);
  private debugService = inject(WebSocketDebugService);
  private mockResponseService = inject(MockResponseService);

  private readonly wsConnection: WebSocketConnection;
  private connectionUrl: string;

  private readonly reconnectTimeoutMillis = 5 * 1000;
  private reconnectTimerSubscription: Subscription | undefined;
  private readonly maxConcurrentCalls = 20;

  private shutDownInProgress = false;
  get isSystemShuttingDown(): boolean {
    return this.shutDownInProgress;
  }

  private readonly hasRestrictedError$ = new BehaviorSubject(false);
  set isAccessRestricted(value: boolean) {
    this.hasRestrictedError$.next(value);
  }

  get isAccessRestricted$(): Observable<boolean> {
    return this.hasRestrictedError$.asObservable();
  }

  private readonly isConnectionLive$ = new BehaviorSubject(false);
  get isClosed$(): Observable<boolean> {
    return this.isConnectionLive$.pipe(map((isLive) => !isLive));
  }

  private readonly triggerNextCall$ = new Subject<void>();
  private activeCalls = 0;
  private readonly queuedCalls: ApiCall[] = [];
  private readonly pendingCalls = new Map<string, ApiCall>();
  private showingConcurrentCallsError = false;
  private callsInConcurrentCallsError = new Set<string>();

  // Create a single shared responses$ observable
  private _responses$: Observable<IncomingMessage> | undefined;

  get responses$(): Observable<IncomingMessage> {
    if (!this._responses$) {
      // Return merged stream of real and mock responses
      const realResponses$ = this.wsConnection.stream$ as Observable<IncomingMessage>;
      const mockResponses$ = this.mockResponseService.responses$;

      this._responses$ = merge(realResponses$, mockResponses$).pipe(
        tap((message) => {
          // Log incoming messages for debugging
          if (environment.debugPanel?.enabled) {
            const isMocked = this.mockResponseService.isMockedResponse(message);
            this.debugService.logIncomingMessage(message, isMocked);
          }
        }),
        shareReplay({ bufferSize: 1, refCount: true }),
      );
    }
    return this._responses$;
  }

  constructor() {
    // Initialize connection properties
    this.wsConnection = new WebSocketConnection(this.webSocket);
    this.connectionUrl = (this.window.location.protocol === 'https:' ? 'wss://' : 'ws://') + environment.remote + '/api/current';

    this.setupWebSocket();
  }

  private setupWebSocket(): void {
    this.connectWebSocket();
    this.setupScheduledCalls();
  }

  private setupScheduledCalls(): void {
    combineLatest([
      this.triggerNextCall$,
      this.wsStatus.isConnected$,
    ]).pipe(
      filter(([, isConnected]) => isConnected),
      tap(() => {
        if (this.activeCalls + 1 < this.maxConcurrentCalls) {
          return;
        }
        this.raiseConcurrentCallsError();
      }),
      mergeMap(() => {
        const queuedCall = this.queuedCalls.shift();
        return queuedCall ? this.processCall(queuedCall) : of(null);
      }, this.maxConcurrentCalls),
    ).subscribe();
  }

  private cleanupCall(callId: string): void {
    this.activeCalls--;
    this.pendingCalls.delete(callId);
    this.triggerNextCall$.next();
  }

  private handleMockResponse(call: ApiCall): Observable<unknown> | null {
    if (!environment.debugPanel?.enabled) {
      return null;
    }

    let mockConfig;
    try {
      mockConfig = this.mockResponseService.checkMock(call);
    } catch (error) {
      // Log mock config errors but don't fail the request
      console.warn('Mock config check failed, proceeding with real request:', error);
      return null;
    }

    if (!mockConfig) {
      // Log normal outgoing message
      try {
        this.debugService.logOutgoingMessage(call, false);
      } catch (error) {
        console.error('Error logging outgoing message:', error);
      }
      return null;
    }

    // Handle mock response
    try {
      this.debugService.logOutgoingMessage(call, true);
      this.mockResponseService.generateMockResponse(call, mockConfig);
    } catch (error) {
      console.error('Mock generation failed:', error);
      this.cleanupCall(call.id);
      return throwError(() => new MockGenerationError(
        `Failed to generate mock response for ${call.method}`,
        error,
      ));
    }

    // Return observable for mock response
    return this.responses$.pipe(
      filter((message) => 'id' in message && message.id === call.id),
      take(1),
      tap(() => this.cleanupCall(call.id)),
      catchError((error: unknown) => {
        console.error('Mock response processing failed:', error);
        this.cleanupCall(call.id);
        // Wrap in MockServiceError if not already a mock error
        if (error instanceof MockServiceError) {
          return throwError(() => error);
        }
        return throwError(() => new MockServiceError(
          'Failed to process mock response',
          error,
        ));
      }),
    );
  }

  private processCall(call: ApiCall): Observable<unknown> {
    this.activeCalls++;
    this.pendingCalls.set(call.id, call);

    try {
      // Check if we should handle this as a mock response
      const mockResponse$ = this.handleMockResponse(call);
      if (mockResponse$) {
        return mockResponse$;
      }

      // Send the real request
      try {
        this.wsConnection.send(call);
      } catch (error) {
        console.error('Failed to send WebSocket message:', error);
        this.cleanupCall(call.id);
        return throwError(() => new WebSocketSendError(
          `Failed to send ${call.method} over WebSocket`,
          error,
        ));
      }

      return this.responses$.pipe(
        filter((message) => 'id' in message && message.id === call.id),
        take(1),
        tap(() => this.cleanupCall(call.id)),
        catchError((error: unknown) => {
          console.error('Error processing WebSocket response:', error);
          this.cleanupCall(call.id);
          return throwError(() => error);
        }),
      );
    } catch (error) {
      // Catch any unexpected errors
      console.error('Unexpected error in processCall:', error);
      this.cleanupCall(call.id);
      return throwError(() => new Error(`Unexpected error: ${error instanceof Error ? error.message : 'Unknown error'}`));
    }
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

    if (this.showingConcurrentCallsError) {
      return;
    }

    if (!environment.production) {
      console.error('Max concurrent calls', JSON.stringify(callsWithoutErrorsReported));
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
    if (!this.wsConnection.closed) {
      this.wsConnection.close();
    }
    performance.mark('WS Init');
    this.wsConnection
      .connect({
        url: this.connectionUrl,
        openObserver: {
          next: this.onOpen.bind(this),
        },
        closeObserver: {
          next: this.onClose.bind(this),
        },
      })
      .subscribe();
  }

  private onClose(event: CloseEvent): void {
    this.wsStatus.setConnectionStatus(false);
    this.isConnectionLive$.next(false);

    // Clean up pending calls when connection closes
    this.activeCalls = 0;
    this.pendingCalls.clear();
    this.callsInConcurrentCallsError.clear();
    // Note: queuedCalls are kept so they can be processed when connection reopens

    if (this.reconnectTimerSubscription) {
      return;
    }

    // TODO: Extract code in some constant.
    if (event.code === 1008) {
      this.isAccessRestricted = true;
    } else {
      this.initiateReconnect();
    }
  }

  private onOpen(): void {
    if (this.reconnectTimerSubscription) {
      this.wsConnection.close();
      return;
    }
    this.shutDownInProgress = false;
    this.wsStatus.setConnectionStatus(true);

    performance.mark('WS Connected');
    performance.measure('Establishing WS connection', 'WS Init', 'WS Connected');

    this.scheduleCall({
      method: 'core.set_options',
      params: [{ legacy_jobs: false }],
      id: UUID.UUID(),
    });
  }

  scheduleCall(payload: Pick<ApiCall, 'id' | 'method' | 'params'>): void {
    const message = makeRequestMessage(payload);
    this.queuedCalls.push(message as ApiCall);
    this.triggerNextCall$.next();
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

  private unsubscribeReconnectSubscription(): void {
    this.reconnectTimerSubscription?.unsubscribe();
    this.reconnectTimerSubscription = undefined;
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
