import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { CloudSyncBucket, CloudSyncCredential } from 'app/interfaces/cloudsync-credential.interface';
import { CloudSyncProvider } from 'app/interfaces/cloudsync-provider.interface';
import { WebSocketService } from 'app/services/api.service';

@Injectable({
  providedIn: 'root',
})
export class CloudCredentialService {
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
}
