import { Injectable } from '@angular/core';
import { Observable, Subject, Subscription } from 'rxjs/Rx';

import { WebSocketService } from './ws.service';

@Injectable()
export class CloudCredentialService {
  protected credentialProviders: string = 'cloudsync.providers';
  protected byteMap: Object= {
    'TB': 1099511627776,
    'GB': 1073741824,
    'MB': 1048576,
    'KB': 1024,
  };

  constructor(protected ws: WebSocketService) {};

  getProviders() {
  	return this.ws.call(this.credentialProviders, []);
  }

  getByte(data: string): Number {
    const unit = data.charAt(data.length - 1);
    const value = Number(data.slice(0, data.length - 1));
    return value * this.byteMap[unit.toUpperCase()];
  }
}