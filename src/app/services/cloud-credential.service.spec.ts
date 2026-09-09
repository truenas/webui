import { createServiceFactory, SpectatorService } from '@ngneat/spectator/jest';
import { firstValueFrom } from 'rxjs';
import { mockTypedApi, mockTypedCall, mockTypedQuery } from 'app/core/testing/utils/mock-typed-api.utils';
import { CloudSyncProviderName } from 'app/enums/cloudsync-provider.enum';
import { CloudSyncCredentialEntry } from 'app/interfaces/cloudsync-credential.interface';
import { CloudSyncProvider } from 'app/interfaces/cloudsync-provider.interface';
import { TypedApiService } from 'app/modules/websocket/typed-api/typed-api.service';
import { CloudCredentialPayload, CloudCredentialService } from 'app/services/cloud-credential.service';

describe('CloudCredentialService', () => {
  let spectator: SpectatorService<CloudCredentialService>;

  const entry = {
    id: 3,
    name: 'Backups',
    provider: {
      type: CloudSyncProviderName.AmazonS3,
      access_key_id: 'key',
      secret_access_key: 'secret',
    },
  } as CloudSyncCredentialEntry;

  const payload = {
    name: 'Backups',
    provider: entry.provider,
  } as CloudCredentialPayload;

  const createService = createServiceFactory({
    service: CloudCredentialService,
    providers: [
      mockTypedApi([
        mockTypedCall('cloudsync.providers', [{ name: 'S3', title: 'Amazon S3' } as CloudSyncProvider]),
        mockTypedQuery('cloudsync.credentials.query', [entry]),
        mockTypedCall('cloudsync.list_buckets', [{ Name: 'bucket', Path: 'bucket', Enabled: true }]),
        mockTypedCall('cloudsync.credentials.create', entry),
        mockTypedCall('cloudsync.credentials.update', entry),
        mockTypedCall('cloudsync.credentials.verify', { valid: true }),
      ]),
    ],
  });

  beforeEach(() => {
    spectator = createService();
  });

  it('lists providers with their titles', async () => {
    expect(await firstValueFrom(spectator.service.getProviders())).toEqual([{ name: 'S3', title: 'Amazon S3' }]);
  });

  it('queries credentials and reshapes each entry for the UI', async () => {
    expect(await firstValueFrom(spectator.service.getCloudSyncCredentials())).toEqual([{
      id: 3,
      name: 'Backups',
      provider: { type: 'S3', access_key_id: 'key', secret_access_key: 'secret' },
    }]);
    expect(spectator.inject(TypedApiService).query).toHaveBeenCalledWith('cloudsync.credentials.query');
  });

  it('lists buckets for a credential', async () => {
    expect(await firstValueFrom(spectator.service.getBuckets(3))).toEqual([{ Name: 'bucket', Path: 'bucket', Enabled: true }]);
    expect(spectator.inject(TypedApiService).call).toHaveBeenCalledWith('cloudsync.list_buckets', [3]);
  });

  it('creates and updates credentials, handing back the saved credential', async () => {
    expect(await firstValueFrom(spectator.service.createCredential(payload))).toMatchObject({ id: 3, name: 'Backups' });
    expect(spectator.inject(TypedApiService).call).toHaveBeenCalledWith('cloudsync.credentials.create', [payload]);

    expect(await firstValueFrom(spectator.service.updateCredential(3, payload))).toMatchObject({ id: 3 });
    expect(spectator.inject(TypedApiService).call).toHaveBeenCalledWith('cloudsync.credentials.update', [3, payload]);
  });

  it('verifies a provider payload', async () => {
    expect(await firstValueFrom(spectator.service.verifyCredential(payload.provider))).toEqual({ valid: true });
    expect(spectator.inject(TypedApiService).call).toHaveBeenCalledWith('cloudsync.credentials.verify', [payload.provider]);
  });
});
