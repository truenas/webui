import { Injectable, inject } from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { UUID } from 'angular2-uuid';
import {
  interval, tap, Subscription, distinctUntilChanged, startWith,
} from 'rxjs';
import { WebSocketHandlerService } from 'app/modules/websocket/websocket-handler.service';
import { WebSocketStatusService } from 'app/services/websocket-status.service';

@UntilDestroy()
@Injectable({
  providedIn: 'root',
})
export class PingService {
  private wsHandler = inject(WebSocketHandlerService);
  private wsStatus = inject(WebSocketStatusService);

  private readonly pingTimeoutMillis = 20 * 1000;
  private pingSubscription: Subscription | null = null;
  private isInitialized = false;

  constructor() {
    // Auto-initialize service on first instantiation
    this.initializePingService();
  }

  /**
   * Initialize ping service to automatically setup ping when WebSocket connection is established.
   * This ensures ping is sent every 20 seconds while connected, including on signin page.
   * This method is idempotent and safe to call multiple times.
   */
  initializePingService(): void {
    // Guard against multiple initialization calls
    if (this.isInitialized) {
      return;
    }
    this.isInitialized = true;

    // Automatically setup ping when connection is established
    // Use startWith to handle the case where service is instantiated after connection is established
    this.wsStatus.isConnected$.pipe(
      startWith(this.wsStatus.isConnected),
      distinctUntilChanged(),
      untilDestroyed(this),
    ).subscribe((isConnected) => {
      if (isConnected) {
        this.setupPing();
      } else {
        this.cleanupPing();
      }
    });
  }

  private setupPing(): void {
    // Clean up existing ping subscription to prevent duplicates
    this.cleanupPing();

    // Simplified ping setup - no double-checking since outer subscription already filters for connected state
    this.pingSubscription = interval(this.pingTimeoutMillis).pipe(
      tap(() => this.wsHandler.scheduleCall({
        id: UUID.UUID(),
        method: 'core.ping',
        params: [],
      })),
      untilDestroyed(this),
    ).subscribe();
  }

  private cleanupPing(): void {
    if (this.pingSubscription) {
      this.pingSubscription.unsubscribe();
      this.pingSubscription = null;
    }
  }
}
