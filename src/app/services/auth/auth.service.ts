import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';

import {WebSocketService} from '../../services/ws.service';

@Injectable()
export class AuthService implements CanActivate {
  public authToken;
  
  constructor(private router: Router, private ws: WebSocketService) { }
  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot) {
    if (this.ws.connected) {
      return true;
    }
    this.router.navigate(['/sessions/signin']);
    return false;
  }
}