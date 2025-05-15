import { createServiceFactory, mockProvider, SpectatorService } from '@ngneat/spectator/jest';
import { firstValueFrom, of } from 'rxjs';
import { mockApi, mockCall } from 'app/core/testing/utils/mock-api.utils';
import { NvmeOfTransportType } from 'app/enums/nvme-of.enum';
import { NvmeOfSubsystem } from 'app/interfaces/nvme-of.interface';
import { ApiService } from 'app/modules/websocket/api.service';
import { NvmeOfService } from 'app/pages/sharing/nvme-of/utils/nvme-of.service';
import { LicenseService } from 'app/services/license.service';

describe('NvmeOfService', () => {
  let spectator: SpectatorService<NvmeOfService>;
  let api: ApiService;

  const createService = createServiceFactory({
    service: NvmeOfService,
    providers: [
      mockApi([
        mockCall('nvmet.port_subsys.create'),
        mockCall('nvmet.host_subsys.create'),
        mockCall('nvmet.global.rdma_enabled', true),
      ]),
      mockProvider(LicenseService, {
        hasFibreChannel$: of(false),
      }),
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

  describe('getSupportedTransports', () => {
    it('should return supported transports based on license and RDMA', async () => {
      const transports = await firstValueFrom(spectator.service.getSupportedTransports());

      expect(transports).toEqual([NvmeOfTransportType.Tcp, NvmeOfTransportType.Rdma]);
    });
  });

  describe('isRdmaEnabled', () => {
    it('should return whether RDMA is enabled and cache the result', async () => {
      const first = await firstValueFrom(spectator.service.isRdmaEnabled());
      const second = await firstValueFrom(spectator.service.isRdmaEnabled());

      expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('nvmet.global.rdma_enabled');
      expect(spectator.inject(ApiService).call).toHaveBeenCalledTimes(1);
      expect(first).toBe(true);
      expect(second).toBe(true);
    });
  });
});
