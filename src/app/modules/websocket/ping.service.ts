import { Injectable } from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { UUID } from 'angular2-uuid';
import {
  filter, interval, switchMap, tap,
} from 'rxjs';
import { WebSocketHandlerService } from 'app/modules/websocket/websocket-handler.service';
import { WebSocketStatusService } from 'app/services/websocket-status.service';

@UntilDestroy()
@Injectable({
  providedIn: 'root',
})
export class PingService {
  private readonly pingTimeoutMillis = 20 * 1000;

  constructor(
    private wsHandler: WebSocketHandlerService,
    private wsStatus: WebSocketStatusService,
  ) {}

  setupPing(): void {
    interval(this.pingTimeoutMillis).pipe(
      switchMap(() => this.wsStatus.isConnected$),
      filter(Boolean),
      switchMap(() => this.wsStatus.isAuthenticated$),
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
