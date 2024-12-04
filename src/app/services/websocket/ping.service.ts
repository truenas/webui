import { Injectable } from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { UUID } from 'angular2-uuid';
import {
  filter, interval, switchMap, tap,
} from 'rxjs';
import { AuthService } from 'app/services/auth/auth.service';
import { WebSocketHandlerService } from 'app/services/websocket/websocket-handler.service';

@UntilDestroy()
@Injectable({
  providedIn: 'root',
})
export class PingService {
  private readonly pingTimeoutMillis = 20 * 1000;

  constructor(
    private wsHandler: WebSocketHandlerService,
    private authService: AuthService,
  ) {}

  setupPing(): void {
    interval(this.pingTimeoutMillis).pipe(
      switchMap(() => this.wsHandler.isConnected$),
      filter(Boolean),
      switchMap(() => this.authService.isAuthenticated$),
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
