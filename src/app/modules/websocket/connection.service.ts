import { DestroyRef, inject, Injectable } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  BehaviorSubject,
  distinctUntilChanged,
  filter,
  map,
  Observable,
  shareReplay,
  switchMap,
  take,
} from 'rxjs';
import { TYPED_API_CLIENT, WebUiApiClient } from 'app/modules/websocket/typed-api/typed-api-client.token';
import { WebSocketStatusService } from 'app/services/websocket-status.service';

/**
 * The typed client's connection.
 *
 * Named off the client rather than imported, because `TrueNasConnection` is
 * not exported from the package's main entry — see gap 6 in
 * `docs/devs/typed-api-client.md`.
 */
export type TypedConnection = WebUiApiClient['connection'];

/**
 * The app's view of the tab's one connection: the typed client's.
 *
 * The connection is the transport; this is what the UI layers over it — whether
 * it is up, whether the appliance refused us, and whether the system is being
 * taken down on purpose. The last two are UI concepts with no counterpart on the
 * connection, which is why they live here and not on it.
 *
 * Nothing here owns a socket. Reconnecting is the connection's own business;
 * `reconnect()` and `setEndpoint()` only ask it for another attempt.
 *
 * An app initializer in `main.ts` creates this at startup, so the status it
 * publishes to `WebSocketStatusService` is live before anything reads it.
 */
@Injectable({
  providedIn: 'root',
})
export class ConnectionService {
  private client$ = inject(TYPED_API_CLIENT);
  private wsStatus = inject(WebSocketStatusService);
  private destroyRef = inject(DestroyRef);

  readonly connection$: Observable<TypedConnection> = this.client$.pipe(
    map((client) => client.connection),
    shareReplay({ bufferSize: 1, refCount: false }),
  );

  private readonly isOpen$ = new BehaviorSubject(false);

  /** Emits `true` until the first socket opens, and whenever the socket is lost. */
  readonly isClosed$: Observable<boolean> = this.isOpen$.pipe(map((isOpen) => !isOpen));

  private readonly isRefused$ = new BehaviorSubject(false);

  /**
   * Raised when the appliance refuses this client (close code 1008, e.g. its IP
   * is not in Allowed IP Addresses). The connection does not retry after that;
   * whoever shows the refusal lowers the flag with `acknowledgeAccessRestricted()`
   * and asks again with `reconnect()`.
   */
  readonly isAccessRestricted$: Observable<boolean> = this.isRefused$.asObservable();

  private shutDownInProgress = false;

  /**
   * Whether the UI took the system down on purpose — shutdown, restart,
   * failover, config reset or a GUI address change — and the connection it
   * started on has not been replaced yet. Lowered by the next socket to open.
   */
  get isSystemShuttingDown(): boolean {
    return this.shutDownInProgress;
  }

  /** Measured once, on the first socket of the tab. */
  private hasMeasuredFirstConnection = false;

  constructor() {
    performance.mark('WS Init');
    this.trackConnection();
  }

  /**
   * Marks the connection that is up now as one that is about to go away, so
   * that a caller waiting for the system to come back does not mistake it for
   * the new one. See `waitForWebSocketReconnect`.
   */
  prepareShutdown(): void {
    this.shutDownInProgress = true;
  }

  acknowledgeAccessRestricted(): void {
    this.isRefused$.next(false);
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
  setEndpoint(protocol: string, remote: string): void {
    this.withConnection((connection) => {
      connection.setEndpoint({
        hostnames: [remote],
        // `location.protocol` is a plain string that can be `file:` or
        // `chrome-extension:`, so this narrows rather than casts.
        protocol: protocol === 'http:' ? 'http:' : 'https:',
      });
    });
  }

  private trackConnection(): void {
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
      this.isRefused$.next(true);
    });
  }

  private onOpen(): void {
    // Lowered before the status goes out, so that anyone waiting on the
    // status for the system to come back sees this socket as the new one.
    this.shutDownInProgress = false;
    this.wsStatus.setConnectionStatus(true);
    this.isOpen$.next(true);

    performance.mark('WS Connected');
    if (!this.hasMeasuredFirstConnection) {
      this.hasMeasuredFirstConnection = true;
      performance.measure('Establishing WS connection', 'WS Init', 'WS Connected');
    }
  }

  private onClose(): void {
    this.wsStatus.setConnectionStatus(false);
    this.isOpen$.next(false);
  }

  private withConnection(action: (connection: TypedConnection) => void): void {
    this.connection$.pipe(
      take(1),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(action);
  }
}
