import { Injectable } from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { filter, interval, switchMap } from 'rxjs';
import { AuthService } from 'app/services/auth/auth.service';
import { WebSocketService } from 'app/services/ws.service';

@UntilDestroy()
@Injectable({
  providedIn: 'root',
})
export class PingService {
  private readonly pingTimeoutMillis = 20 * 1000;

  constructor(
    private ws: WebSocketService,
    private authService: AuthService,
  ) {}

  setupPing(): void {
    interval(this.pingTimeoutMillis).pipe(
      switchMap(() => this.authService.isAuthenticated$),
      filter(Boolean),
      switchMap(() => this.ws.call('core.ping')),
      untilDestroyed(this),
    ).subscribe();
  }
}
