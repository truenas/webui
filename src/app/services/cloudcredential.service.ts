import { Injectable } from '@angular/core';
import { Observable, Subject, Subscription } from 'rxjs';

import { WebSocketService } from './ws.service';

@Injectable()
export class CloudCredentialService {
  protected credentialProviders: string = 'cloudsync.providers';

  constructor(protected ws: WebSocketService) {};

  getProviders() {
  	return this.ws.call(this.credentialProviders, []);
  }
}