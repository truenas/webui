import { Inject, Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { WINDOW } from 'app/helpers/window.helper';
import { AuthService } from 'app/services/auth/auth.service';

@UntilDestroy()
@Injectable()
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

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    if (this.isAuthenticated) {
      return true;
    }

    this.window.sessionStorage.setItem('redirectUrl', state.url);
    this.router.navigate(['/sessions/signin']);

    return false;
  }
}
