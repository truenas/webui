import { Inject, Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { WINDOW } from 'app/helpers/window.helper';
import { AuthService } from 'app/services/auth/auth.service';

@UntilDestroy()
@Injectable({
  providedIn: 'root',
})
export class AuthGuardService {
  isAuthenticated = false;
  constructor(
    private router: Router,
    private authService: AuthService,
    @Inject(WINDOW) private window: Window,
  ) {
    this.authService.isAuthenticated$.pipe(untilDestroyed(this)).subscribe((isLoggedIn) => {
      this.isAuthenticated = isLoggedIn;
    });
  }

  canActivate({ queryParams }: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    if (this.isAuthenticated) {
      return true;
    }

    this.window.sessionStorage.setItem('redirectUrl', state.url.split('?')[0]);
    this.router.navigate(['/signin'], { queryParams });

    return false;
  }
}
