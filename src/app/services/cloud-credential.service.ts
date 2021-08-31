import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { CloudsyncCredential } from 'app/interfaces/cloudsync-credential.interface';
import { CloudsyncProvider } from 'app/interfaces/cloudsync-provider.interface';
import { WebSocketService } from './ws.service';

@Injectable()
export class CloudCredentialService {
  protected credentialProviders: 'cloudsync.providers' = 'cloudsync.providers';
  protected byteMap = {
    T: 1024 ** 4,
    G: 1024 ** 3,
    M: 1024 ** 2,
    K: 1024 ** 1,
    B: 1024 ** 0,
  };

  constructor(protected ws: WebSocketService) {}

  getProviders(): Observable<CloudsyncProvider[]> {
    return this.ws.call(this.credentialProviders);
  }

  getCloudsyncCredentials(): Promise<CloudsyncCredential[]> {
    return this.ws.call('cloudsync.credentials.query').toPromise();
  }

  getByte(data: string): number {
    // TODO: Here and in other places extract to proper type
    let unit: keyof CloudCredentialService['byteMap'] = 'K'; // default unit
    let index = -1;

    for (let i = 0; i < data.length; i++) {
      if (data[i].toUpperCase() == 'B' || data[i].toUpperCase() == 'K'
            || data[i].toUpperCase() == 'M' || data[i].toUpperCase() == 'G'
            || data[i].toUpperCase() == 'T') {
        unit = data[i].toUpperCase() as keyof CloudCredentialService['byteMap'];
        index = i;
        break;
      }
    }
    const rest_unit = data.slice(index + 1, data.length).toUpperCase();
    if (index == -1 && Number(data)) {
      return Number(data) * this.byteMap[unit];
    } if (rest_unit == 'IB' || rest_unit == 'B' || rest_unit == '') {
      if (unit == 'B' && rest_unit != '') {
        return -1;
      }
      return Number(data.slice(0, index)) * this.byteMap[unit];
    }
    return -1;
  }
}
