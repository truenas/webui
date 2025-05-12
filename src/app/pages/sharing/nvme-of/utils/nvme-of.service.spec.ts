import { createServiceFactory, SpectatorService } from '@ngneat/spectator/jest';
import { firstValueFrom } from 'rxjs';
import { mockApi, mockCall } from 'app/core/testing/utils/mock-api.utils';
import { NvmeOfSubsystem } from 'app/interfaces/nvme-of.interface';
import { ApiService } from 'app/modules/websocket/api.service';
import { NvmeOfService } from 'app/pages/sharing/nvme-of/utils/nvme-of.service';

describe('NvmeOfService', () => {
  let spectator: SpectatorService<NvmeOfService>;
  let api: ApiService;

  const createService = createServiceFactory({
    service: NvmeOfService,
    providers: [
      mockApi([
        mockCall('nvmet.port_subsys.create'),
        mockCall('nvmet.host_subsys.create'),
      ]),
    ],
  });

  beforeEach(() => {
    spectator = createService();
    api = spectator.inject(ApiService);
  });

  describe('associatePorts', () => {
    it('should make multiple calls to associate port with a subsystem', async () => {
      const subsystem = { id: 1 } as NvmeOfSubsystem;
      const portIds: number[] = [1, 2, 3];

      await firstValueFrom(spectator.service.associatePorts(subsystem, portIds));

      expect(api.call).toHaveBeenCalledTimes(portIds.length);
      portIds.forEach((portId) => {
        expect(api.call).toHaveBeenCalledWith(
          'nvmet.port_subsys.create',
          [{ port_id: portId, subsys_id: subsystem.id }],
        );
      });
    });
  });

  describe('associateHosts', () => {
    it('should make multiple calls to associate host with a subsystem', async () => {
      const subsystem = { id: 1 } as NvmeOfSubsystem;
      const hostIds: number[] = [1, 2, 3];

      await firstValueFrom(spectator.service.associateHosts(subsystem, hostIds));

      expect(api.call).toHaveBeenCalledTimes(hostIds.length);
      hostIds.forEach((hostId) => {
        expect(api.call).toHaveBeenCalledWith(
          'nvmet.host_subsys.create',
          [{ host_id: hostId, subsys_id: subsystem.id }],
        );
      });
    });
  });
});
