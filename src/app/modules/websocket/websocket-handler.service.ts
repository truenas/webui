import { DestroyRef, inject, Injectable } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TranslateService } from '@ngx-translate/core';
import { environment } from 'environments/environment';
import {
  BehaviorSubject,
  combineLatest,
  distinctUntilChanged,
  filter,
  map,
  merge,
  mergeMap,
  Observable,
  of,
  shareReplay,
  Subject,
  switchMap,
  take,
  tap,
  catchError,
  throwError,
} from 'rxjs';
import { makeRequestMessage } from 'app/helpers/api.helper';
import {
  RequestMessage, IncomingMessage,
} from 'app/interfaces/api-message.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { TYPED_API_CLIENT, WebUiApiClient } from 'app/modules/websocket/typed-api/typed-api-client.token';
import { MockResponseService } from 'app/modules/websocket-debug-panel/services/mock-response.service';
import { WebSocketDebugService } from 'app/modules/websocket-debug-panel/services/websocket-debug.service';
import { WebSocketStatusService } from 'app/services/websocket-status.service';
import {
  MockGenerationError, MockServiceError,
  WebSocketSendError,
} from './errors';

type ApiCall = Required<Pick<RequestMessage, 'id' | 'method' | 'params'>> & { jsonrpc: '2.0' };

/**
 * The typed client's connection.
 *
 * Named off the client rather than imported, because `TrueNasConnection` is
 * not exported from the package's main entry — see gap 6 in
 * `docs/devs/typed-api-client.md`.
 */
type TypedConnection = WebUiApiClient['connection'];

/**
 * The legacy JSON-RPC client's transport.
 *
 * It no longer owns a socket. Since NAS-143989 it rides the typed client's
 * connection: `responses$` is that connection's message stream, and
 * `scheduleCall` writes to it. One socket per tab, one session, one login —
 * where the two sockets of Phase 0 meant two sessions, two entries in
 * `auth.sessions`, and every audited call recorded twice.
 *
 * What stays here is everything the typed client has no seam for, and that
 * the calls still riding this service depend on:
 *
 * - the call queue and its 20-concurrent-call ceiling,
 * - the WebSocket debug panel's logging and its mock interception,
 * - the connection status the app's reconnect, shutdown and failover flows
 *   read (`isClosed$`, `isAccessRestricted$`, `isSystemShuttingDown`).
 *
 * What went with the socket: the reconnect timer (the client's connection
 * retries on its own), `core.set_options` on open (the client sends it), and
 * the ping timer (the client pings every 20s).
 *
 * The traffic itself moved from `/api/current` to `/api/v27.0.0`, which is the
 * path the client opens. Middleware serves the same methods on both.
 */
@Injectable({
  providedIn: 'root',
})
export class WebSocketHandlerService {
  private client$ = inject(TYPED_API_CLIENT);
  private wsStatus = inject(WebSocketStatusService);
  private dialogService = inject(DialogService);
  private translate = inject(TranslateService);
  private debugService = inject(WebSocketDebugService);
  private mockResponseService = inject(MockResponseService);
  private destroyRef = inject(DestroyRef);

  private readonly connection$: Observable<TypedConnection> = this.client$.pipe(
    map((client) => client.connection),
    shareReplay({ bufferSize: 1, refCount: false }),
  );

  /**
   * The connection, once the client has been built, for the synchronous paths
   * that cannot wait for it: `processCall` only ever runs behind
   * `isConnected$`, which this service itself raises from the connection, so
   * by then it is here.
   */
  private connection: TypedConnection | undefined;

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

  /** Measured once, on the first socket of the tab. */
  private hasMeasuredFirstConnection = false;

  /**
   * Every message the appliance sends, merged with the debug panel's mocked
   * answers.
   *
   * Built once and kept: the client's `messages()` follows the connection
   * across reconnects, where the socket this service used to own had to be
   * rebuilt with it.
   *
   * Typed calls ride the same socket, so their replies pass through here too.
   * Nothing correlates on them — every consumer filters by the id it sent, or
   * by a collection it subscribed to — and the debug panel is the better for
   * seeing the whole wire.
   */
  readonly responses$: Observable<IncomingMessage> = merge(
    this.connection$.pipe(
      switchMap((connection) => connection.messages()),
    ) as unknown as Observable<IncomingMessage>,
    this.mockResponseService.responses$,
  ).pipe(
    tap((message) => {
      // Log incoming messages for debugging
      if (environment.debugPanel?.enabled) {
        const isMocked = this.mockResponseService.isMockedResponse(message);
        this.debugService.logIncomingMessage(message, isMocked);
      }
    }),
    shareReplay({ bufferSize: 1, refCount: true }),
  );

  constructor() {
    performance.mark('WS Init');
    this.trackConnection();
    this.setupScheduledCalls();
  }

  /**
   * Projects the borrowed connection's state onto the surface the app reads.
   *
   * A refusal (1008, e.g. the client's IP is not in Allowed IP Addresses) is
   * the one close the connection does not retry after; `reconnect()` is how
   * `WebSocketConnectionGuard` asks again once the user has acknowledged it.
   */
  private trackConnection(): void {
    this.connection$.pipe(
      takeUntilDestroyed(this.destroyRef),
    ).subscribe((connection) => {
      this.connection = connection;
    });

    this.connection$.pipe(
      switchMap((connection) => connection.opened$),
      distinctUntilChanged(),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe((isOpen) => {
      if (isOpen) {
        this.onOpen();
      } else {
        this.onClose();
      }
    });

    this.connection$.pipe(
      switchMap((connection) => connection.closes$),
      filter((close) => close.refused),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(() => {
      this.isAccessRestricted = true;
    });
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
        this.sendOverConnection(call);
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

  /**
   * The connection's own `send` queues a frame until a socket exists, but a
   * call that got this far was already gated on the connection being up, so a
   * missing connection here is a bug rather than a wait — and one this
   * service's callers know how to report.
   */
  private sendOverConnection(call: ApiCall): void {
    if (!this.connection) {
      throw new Error('The API client connection has not been created yet');
    }

    this.connection.send(call);
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
        message: this.translate.instant('Max concurrent calls limit reached.\nThere are more than 20 calls queued.\nSee queued calls in the browser\'s console logs'),
        title: this.translate.instant('Max Concurrent Calls'),
        // Named so the E2E harness can dismiss this development-only diagnostic
        // without matching its wording, and without touching a real error.
        // The name is spelled again in `e2e/support/constants.ts`
        // (`concurrentCallsDialogTitleId`); changing it here means changing it
        // there, or the harness stops recognising this dialog.
        testId: 'concurrent-calls',
      }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
        next: () => {
          this.showingConcurrentCallsError = false;
        },
      });
    }
  }

  private onClose(): void {
    this.wsStatus.setConnectionStatus(false);
    this.isConnectionLive$.next(false);

    // Clean up pending calls when connection closes
    this.activeCalls = 0;
    this.pendingCalls.clear();
    this.callsInConcurrentCallsError.clear();
    // Note: queuedCalls are kept so they can be processed when connection reopens
  }

  private onOpen(): void {
    this.shutDownInProgress = false;
    this.wsStatus.setConnectionStatus(true);
    this.isConnectionLive$.next(true);

    performance.mark('WS Connected');
    if (!this.hasMeasuredFirstConnection) {
      this.hasMeasuredFirstConnection = true;
      performance.measure('Establishing WS connection', 'WS Init', 'WS Connected');
    }
  }

  scheduleCall(payload: Pick<ApiCall, 'id' | 'method' | 'params'>): void {
    const message = makeRequestMessage(payload);
    this.queuedCalls.push(message as ApiCall);
    this.triggerNextCall$.next();
  }

  prepareShutdown(): void {
    this.shutDownInProgress = true;
  }

  /**
   * Asks the connection for another socket.
   *
   * The round trip through `false` is what asks: the connection's gate is
   * `distinctUntilChanged`, so re-asserting `true` on a connection that
   * believes it is enabled — which is every connection that has merely lost
   * its socket, and every connection the appliance has refused — does nothing.
   */
  reconnect(): void {
    this.withConnection((connection) => {
      connection.setEnabled(false);
      connection.setEnabled(true);
    });
  }

  /**
   * Re-points the socket at another address, as a GUI address or port change
   * does. The API path is the client's and does not change with it.
   */
  setupConnectionUrl(protocol: string, remote: string): void {
    this.withConnection((connection) => {
      connection.setEndpoint({
        hostnames: [remote],
        // `location.protocol` is a plain string that can be `file:` or
        // `chrome-extension:`, so this narrows rather than casts.
        protocol: protocol === 'http:' ? 'http:' : 'https:',
      });
    });
  }

  private withConnection(action: (connection: TypedConnection) => void): void {
    this.connection$.pipe(
      take(1),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(action);
  }
}
