import { Injectable } from '@angular/core';
import { Observable, Subject, Subscription } from 'rxjs/Rx';

import { WebSocketService } from './ws.service';

@Injectable()
export class CloudCredentialService {
  protected credentialProviders: string = 'cloudsync.providers';
  protected byteMap: Object= {
    'T': 1099511627776,
    'G': 1073741824,
    'M': 1048576,
    'K': 1024,
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