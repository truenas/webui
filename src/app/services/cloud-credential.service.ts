import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { CloudSyncBucket, CloudSyncCredential } from 'app/interfaces/cloudsync-credential.interface';
import { CloudSyncProvider } from 'app/interfaces/cloudsync-provider.interface';
import { ApiService } from 'app/modules/websocket/api.service';

@Injectable({
  providedIn: 'root',
})
export class CloudCredentialService {
  constructor(protected api: ApiService) {}

  getProviders(): Observable<CloudSyncProvider[]> {
    return this.api.call('cloudsync.providers');
  }

  getCloudSyncCredentials(): Observable<CloudSyncCredential[]> {
    return this.api.call('cloudsync.credentials.query');
  }

  getBuckets(credentialId: number): Observable<CloudSyncBucket[]> {
    return this.api.call('cloudsync.list_buckets', [credentialId]);
  }
}
