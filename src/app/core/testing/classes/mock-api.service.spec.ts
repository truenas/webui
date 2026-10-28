import { createServiceFactory, SpectatorService } from '@ngneat/spectator/jest';
import { UnmockedCallError } from '@truenas/api-client/testing';
import { firstValueFrom, lastValueFrom } from 'rxjs';
import { MockApiService } from 'app/core/testing/classes/mock-api.service';
import { ApiCallError } from 'app/services/errors/error.classes';

describe('MockApiService', () => {
  let spectator: SpectatorService<MockApiService>;

  const createService = createServiceFactory(MockApiService);

  beforeEach(() => {
    spectator = createService();
  });

  it('answers a call from a scripted response and records the frame', async () => {
    spectator.service.mockCall('alert.dismiss', null);

    const result = await firstValueFrom(spectator.service.call('alert.dismiss', ['alert-uuid']));

    expect(result).toBeNull();
    expect(spectator.service.client.connection.sent).toContainEqual(expect.objectContaining({
      method: 'alert.dismiss',
      params: ['alert-uuid'],
    }));
  });

  it('throws an ApiCallError with the full payload when a call is scripted to fail', async () => {
    spectator.service.mockCallError('alert.dismiss', {
      errname: 'EINVAL',
      reason: 'Invalid value',
      extra: [['alert_dismiss.uuid', 'Not allowed', 22]],
    });

    const result = firstValueFrom(spectator.service.call('alert.dismiss', ['alert-uuid']));

    await expect(result).rejects.toBeInstanceOf(ApiCallError);
    await expect(result).rejects.toMatchObject({
      error: { data: { errname: 'EINVAL', extra: [['alert_dismiss.uuid', 'Not allowed', 22]] } },
    });
  });

  it('throws an ApiCallError when a query or a job is scripted to fail', async () => {
    spectator.service.mockCallError('user.query', { errname: 'EPERM' });
    spectator.service.mockCallError('pool.dataset.export_key', { errname: 'EINVAL' });

    await expect(firstValueFrom(spectator.service.query('user.query'))).rejects.toMatchObject({
      error: { data: { errname: 'EPERM' } },
    });
    await expect(lastValueFrom(spectator.service.job('pool.dataset.export_key', ['tank/enc']))).rejects.toMatchObject({
      error: { data: { errname: 'EINVAL' } },
    });
  });

  it('fails a call nothing scripted instead of hanging', async () => {
    await expect(firstValueFrom(spectator.service.call('system.info'))).rejects.toBeInstanceOf(UnmockedCallError);
  });
});
