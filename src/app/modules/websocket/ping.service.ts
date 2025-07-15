import { Injectable } from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { UUID } from 'angular2-uuid';
import {
  filter, interval, switchMap, tap, Subscription, distinctUntilChanged,
} from 'rxjs';
import { WebSocketHandlerService } from 'app/modules/websocket/websocket-handler.service';
import { WebSocketStatusService } from 'app/services/websocket-status.service';

@UntilDestroy()
@Injectable({
  providedIn: 'root',
})
export class PingService {
  private readonly pingTimeoutMillis = 20 * 1000;
  private pingSubscription: Subscription | null = null;
  private isInitialized = false;

  constructor(
    private wsHandler: WebSocketHandlerService,
    private wsStatus: WebSocketStatusService,
  ) {
    // Initialization will be called from AppComponent to ensure proper service instantiation
  }

  /**
   * Initialize ping service to automatically setup ping when WebSocket connection is established.
   * This ensures ping is sent every 20 seconds while connected, including on signin page.
   */
  public initializePingService(): void {
    // Guard against multiple initialization calls
    if (this.isInitialized) {
      return;
    }
    this.isInitialized = true;

    // Automatically setup ping when connection is established
    this.wsStatus.isConnected$.pipe(
      distinctUntilChanged(),
      filter(Boolean),
      untilDestroyed(this),
    ).subscribe(() => {
      this.setupPing();
    });
  }


  private setupPing(): void {
    // Guard against setting up ping if service is not initialized
    if (!this.isInitialized) {
      return;
    }

    // Clean up existing ping subscription to prevent duplicates
    if (this.pingSubscription) {
      this.pingSubscription.unsubscribe();
    }

    this.pingSubscription = interval(this.pingTimeoutMillis).pipe(
      switchMap(() => this.wsStatus.isConnected$),
      filter(Boolean),
      tap(() => this.wsHandler.scheduleCall({
        id: UUID.UUID(),
        method: 'core.ping',
        params: [],
      })),
      untilDestroyed(this),
    ).subscribe();
  }
}
