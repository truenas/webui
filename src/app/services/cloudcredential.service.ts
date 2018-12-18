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
    'B':1,
  };

  constructor(protected ws: WebSocketService) {};

  getProviders() {
  	return this.ws.call(this.credentialProviders, []);
  }

  getByte(data: string): Number {
      let unit = 'K'; // default unit
      let index = -1;

      for (let i = 0; i < data.length; i++) {
        if (data[i].toUpperCase() == 'B' || data[i].toUpperCase() == 'K' ||
            data[i].toUpperCase() == 'M' || data[i].toUpperCase() == 'G' ||
            data[i].toUpperCase() == 'T') {
          unit = data[i].toUpperCase();
          index = i;
          break;
        }
      }
      const rest_unit = data.slice(index + 1, data.length).toUpperCase();
      if (index == -1 && Number(data)) {
        return Number(data) * this.byteMap[unit];
      } else if (rest_unit == 'IB' || rest_unit == 'B' || rest_unit == '') {
        if (unit == 'B' && rest_unit != '') {
          return -1;
        }
        return Number(data.slice(0, index)) * this.byteMap[unit];
      } else {
        return -1;
      }

    }

}