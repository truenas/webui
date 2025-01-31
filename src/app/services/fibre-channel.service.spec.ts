import { createServiceFactory, SpectatorService } from '@ngneat/spectator/jest';
import { lastValueFrom, of } from 'rxjs';
import { mockCall, mockApi } from 'app/core/testing/utils/mock-api.utils';
import { FibreChannelHost, FibreChannelPort } from 'app/interfaces/fibre-channel.interface';
import { nullOption, skipOption } from 'app/interfaces/option.interface';
import { ApiService } from 'app/modules/websocket/api.service';
import { FibreChannelService } from 'app/services/fibre-channel.service';

describe('FibreChannelService', () => {
  let spectator: SpectatorService<FibreChannelService>;
  const fakeTargetId = 11;
  const fakeHostId = 22;
  const fakePortId = 33;
  const fakePort = 'fc/1';

  const createService = createServiceFactory({
    service: FibreChannelService,
    providers: [
      mockApi([
        mockCall('fcport.query', [{ id: fakePortId }] as FibreChannelPort[]),
        mockCall('fcport.create'),
        mockCall('fcport.update'),
        mockCall('fcport.delete'),
        mockCall('fc.fc_host.query', [{ id: fakeHostId, alias: 'fc', npiv: 1 }] as FibreChannelHost[]),
        mockCall('fc.fc_host.update'),
      ]),
    ],
  });

  beforeEach(() => spectator = createService());

  describe('linkFiberChannelToTarget', () => {
    it('creates link', async () => {
      jest.spyOn(spectator.inject(ApiService), 'call').mockImplementationOnce((method) => {
        if (method === 'fcport.query') {
          return of([]);
        }
        return of(null);
      });

      await lastValueFrom(spectator.service.linkFiberChannelToTarget(fakeTargetId, fakePort));

      expect(spectator.inject(ApiService).call).toHaveBeenCalledWith(
        'fcport.create',
        [{ target_id: fakeTargetId, port: fakePort }],
      );
    });

    it('updates link', async () => {
      await lastValueFrom(spectator.service.linkFiberChannelToTarget(fakeTargetId, fakePort));

      expect(spectator.inject(ApiService).call).toHaveBeenCalledWith(
        'fcport.update',
        [fakePortId, { target_id: fakeTargetId, port: fakePort }],
      );
    });

    it('deletes link', async () => {
      await lastValueFrom(spectator.service.linkFiberChannelToTarget(fakeTargetId, nullOption));

      expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('fcport.delete', [fakePortId]);
    });

    it('skips all operations', async () => {
      await lastValueFrom(spectator.service.linkFiberChannelToTarget(fakeTargetId, skipOption));

      expect(spectator.inject(ApiService).call).toHaveBeenCalledWith(
        'fcport.query',
        [[['target.id', '=', fakeTargetId]]],
      );
      expect(spectator.inject(ApiService).call).toHaveBeenCalledTimes(1);
    });

    it('creates new port and updates link', async () => {
      await lastValueFrom(spectator.service.linkFiberChannelToTarget(fakeTargetId, undefined, fakeHostId));

      expect(spectator.inject(ApiService).call).toHaveBeenCalledWith(
        'fc.fc_host.update',
        [fakeHostId, { npiv: 2 }],
      );

      expect(spectator.inject(ApiService).call).toHaveBeenLastCalledWith(
        'fcport.update',
        [fakePortId, { target_id: fakeTargetId, port: 'fc/2' }],
      );
    });
  });
});
