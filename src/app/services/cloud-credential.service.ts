import { Injectable, inject } from '@angular/core';
import { CallParams } from '@truenas/api-client';
import { map, Observable } from 'rxjs';
import {
  CloudSyncBucket, CloudSyncCredential, CloudSyncCredentialEntry, CloudSyncCredentialVerifyResult,
} from 'app/interfaces/cloudsync-credential.interface';
import { CloudSyncProvider } from 'app/interfaces/cloudsync-provider.interface';
import { WebUiApiDirectory } from 'app/modules/websocket/typed-api/typed-api-client.token';
import { TypedApiService } from 'app/modules/websocket/typed-api/typed-api.service';

/** The create payload as middleware declares it: a name and one provider model, discriminated on `type`. */
export type CloudCredentialPayload = CallParams<WebUiApiDirectory, 'cloudsync.credentials.create'>[0];

/** One provider's attributes, as middleware declares them. */
export type CloudCredentialProviderPayload = CloudCredentialPayload['provider'];

@Injectable({
  providedIn: 'root',
})
export class CloudCredentialService {
  private api = inject(TypedApiService);

  getProviders(): Observable<CloudSyncProvider[]> {
    return this.api.call('cloudsync.providers').pipe(
      // The generated type is missing `title`, which middleware does declare
      // and send: the client's generator strips every nested `title` key from
      // the schema, a real property of that name included. Until that is
      // fixed upstream the UI's own interface describes the wire correctly.
      map((providers) => providers as CloudSyncProvider[]),
    );
  }

  getCloudSyncCredentials(): Observable<CloudSyncCredential[]> {
    return this.api.query('cloudsync.credentials.query').pipe(
      map((credentials) => credentials.map((credential) => toCloudSyncCredential(credential))),
    );
  }

  getBuckets(credentialId: number): Observable<CloudSyncBucket[]> {
    return this.api.call('cloudsync.list_buckets', [credentialId]).pipe(
      // Middleware declares the rows as free-form dicts; the UI knows the shape it reads.
      map((buckets) => buckets as unknown as CloudSyncBucket[]),
    );
  }

  createCredential(payload: CloudCredentialPayload): Observable<CloudSyncCredential> {
    return this.api.call('cloudsync.credentials.create', [payload]).pipe(
      map((credential) => toCloudSyncCredential(credential)),
    );
  }

  updateCredential(id: number, payload: CloudCredentialPayload): Observable<CloudSyncCredential> {
    return this.api.call('cloudsync.credentials.update', [id, payload]).pipe(
      map((credential) => toCloudSyncCredential(credential)),
    );
  }

  verifyCredential(provider: CloudCredentialProviderPayload): Observable<CloudSyncCredentialVerifyResult> {
    return this.api.call('cloudsync.credentials.verify', [provider]);
  }
}

/**
 * The one place the generated entry meets the UI's `CloudSyncCredential`.
 *
 * Middleware describes `provider` as a union of nineteen provider models;
 * the UI describes it as a bag of attributes with a `type`, because the
 * provider forms are dynamic and read it that way. Both are the same wire
 * object. The UI's shape is retired once the last cloud-sync consumer reads
 * the union instead, and this adapter goes with it.
 */
function toCloudSyncCredential(entry: CloudSyncCredentialEntry): CloudSyncCredential {
  return {
    id: entry.id,
    name: entry.name,
    // A union of interfaces and an indexed bag of attributes do not overlap
    // for the compiler, so this cannot be a plain assertion.
    provider: entry.provider as unknown as CloudSyncCredential['provider'],
  };
}
