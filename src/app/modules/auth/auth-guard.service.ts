import { DestroyRef, Injectable, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot } from '@angular/router';
import { WINDOW } from 'app/helpers/window.helper';
import { WebSocketStatusService } from 'app/services/websocket-status.service';

@Injectable({
  providedIn: 'root',
})
export class AuthGuardService {
  private router = inject(Router);
  private wsStatus = inject(WebSocketStatusService);
  private window = inject<Window>(WINDOW);
  private destroyRef = inject(DestroyRef);

  isAuthenticated = false;
  constructor() {
    this.wsStatus.isAuthenticated$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((isLoggedIn) => {
      this.isAuthenticated = isLoggedIn;
    });
  }

  canActivate({ queryParams }: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    if (this.isAuthenticated) {
      return true;
    }

    this.window.sessionStorage.setItem('redirectUrl', state.url);
    this.router.navigate(['/signin'], { queryParams });

    return false;
  }
}
