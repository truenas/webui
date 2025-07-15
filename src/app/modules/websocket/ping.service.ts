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

  constructor(
    private wsHandler: WebSocketHandlerService,
    private wsStatus: WebSocketStatusService,
  ) {
    // Check current connection status immediately
    if (this.wsStatus.isConnected) {
      this.setupPing();
    }
    
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
