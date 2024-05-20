import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import {
  GiB, KiB, MiB, TiB,
} from 'app/constants/bytes.constant';
import { CloudSyncTaskUpdate } from 'app/interfaces/cloud-sync-task.interface';
import { CloudSyncBucket, CloudSyncCredential } from 'app/interfaces/cloudsync-credential.interface';
import { CloudSyncProvider } from 'app/interfaces/cloudsync-provider.interface';
import { WebSocketService } from 'app/services/ws.service';

@Injectable({
  providedIn: 'root',
})
export class CloudCredentialService {
  protected byteMap = {
    T: TiB,
    G: GiB,
    M: MiB,
    K: KiB,
    B: 1,
  };

  constructor(protected ws: WebSocketService) {}

  getProviders(): Observable<CloudSyncProvider[]> {
    return this.ws.call('cloudsync.providers');
  }

  getCloudSyncCredentials(): Observable<CloudSyncCredential[]> {
    return this.ws.call('cloudsync.credentials.query');
  }

  getBuckets(credentialId: number): Observable<CloudSyncBucket[]> {
    return this.ws.call('cloudsync.list_buckets', [credentialId]);
  }

  getByte(data: string): number {
    // TODO: Here and in other places extract to proper type
    let unit: keyof CloudCredentialService['byteMap'] = 'K'; // default unit
    let index = -1;

    for (let i = 0; i < data.length; i++) {
      if (data[i].toUpperCase() === 'B' || data[i].toUpperCase() === 'K'
            || data[i].toUpperCase() === 'M' || data[i].toUpperCase() === 'G'
            || data[i].toUpperCase() === 'T') {
        unit = data[i].toUpperCase() as keyof CloudCredentialService['byteMap'];
        index = i;
        break;
      }
    }
    const restUnit = data.slice(index + 1, data.length).toUpperCase();
    if (index === -1 && Number(data)) {
      return Number(data) * this.byteMap[unit];
    }
    if (restUnit === 'IB' || restUnit === 'B' || restUnit === '') {
      if (unit === 'B' && restUnit !== '') {
        return -1;
      }
      return Number(data.slice(0, index)) * this.byteMap[unit];
    }
    return -1;
  }

  prepareBwlimit(bwlimit: string[]): CloudSyncTaskUpdate['bwlimit'] {
    const bwlimtResult = [];

    for (const limit of bwlimit) {
      const sublimitArr = limit.split(/\s*,\s*/);
      if (sublimitArr.length === 1 && bwlimit.length === 1 && !sublimitArr[0].includes(':')) {
        sublimitArr.unshift('00:00');
      }
      if (sublimitArr[1] && sublimitArr[1] !== 'off') {
        if (sublimitArr[1].endsWith('/s') || sublimitArr[1].endsWith('/S')) {
          sublimitArr[1] = sublimitArr[1].substring(0, sublimitArr[1].length - 2);
        }
        if (this.getByte(sublimitArr[1]) !== -1) {
          (sublimitArr[1] as number | string) = this.getByte(sublimitArr[1]).toFixed(0);
        }
      }
      const subLimit = {
        time: sublimitArr[0],
        bandwidth: sublimitArr[1] === 'off' ? null : sublimitArr[1],
      };

      bwlimtResult.push(subLimit);
    }
    return bwlimtResult;
  }
}
