import { Inject, Injectable } from '@angular/core';
import {
  CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router,
} from '@angular/router';
import { WINDOW } from 'app/helpers/window.helper';
import { WebSocketService } from 'app/services/ws.service';

@Injectable()
export class AuthService implements CanActivate {
  constructor(
    private router: Router,
    private ws: WebSocketService,
    @Inject(WINDOW) private window: Window,
  ) { }

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    if (this.ws.loggedIn) {
      return true;
    }

    this.window.localStorage.setItem('redirectUrl', state.url);
    this.router.navigate(['/sessions/signin']);

    return false;
  }
}
