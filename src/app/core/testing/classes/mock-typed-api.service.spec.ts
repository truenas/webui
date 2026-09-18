import { createServiceFactory, SpectatorService } from '@ngneat/spectator/jest';
import { UnmockedCallError } from '@truenas/api-client/testing';
import { firstValueFrom } from 'rxjs';
import { MockTypedApiService } from 'app/core/testing/classes/mock-typed-api.service';
import { ApiCallError } from 'app/services/errors/error.classes';

describe('MockTypedApiService', () => {
  let spectator: SpectatorService<MockTypedApiService>;

  const createService = createServiceFactory(MockTypedApiService);

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

  it('fails a call nothing scripted instead of hanging', async () => {
    await expect(firstValueFrom(spectator.service.call('system.info'))).rejects.toBeInstanceOf(UnmockedCallError);
  });
});
