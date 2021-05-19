import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { WebSocketService } from './ws.service';

@Injectable()
export class KeychainCredentialService {
  constructor(protected ws: WebSocketService) { }

  getSSHKeys(): Observable<any[]> {
    return this.ws.call('keychaincredential.query', [[['type', '=', 'SSH_KEY_PAIR']]]);
  }

  getSSHConnections(): Observable<any[]> {
    return this.ws.call('keychaincredential.query', [[['type', '=', 'SSH_CREDENTIALS']]]);
  }
}
