import { Injectable } from '@angular/core';
import {
  CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router,
} from '@angular/router';
import { WebSocketService } from 'app/services/ws.service';

@Injectable()
export class AuthService implements CanActivate {
  constructor(private router: Router, private ws: WebSocketService) { }

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    if (this.ws.loggedIn) {
      return true;
    }
    this.ws.redirectUrl = state.url;
    this.router.navigate(['/sessions/signin']);
    return false;
  }
}
