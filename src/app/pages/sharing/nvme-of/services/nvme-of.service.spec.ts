import { createServiceFactory, mockProvider, SpectatorService } from '@ngneat/spectator/jest';
import { firstValueFrom, of } from 'rxjs';
import { MockApiService } from 'app/core/testing/classes/mock-api.service';
import { mockApi, mockCall } from 'app/core/testing/utils/mock-api.utils';
import { NvmeOfTransportType } from 'app/enums/nvme-of.enum';
import { RdmaProtocolName } from 'app/enums/service-name.enum';
import {
  NvmeOfHost, NvmeOfPort, NvmeOfSubsystem, SubsystemPortAssociation,
} from 'app/interfaces/nvme-of.interface';
import { ApiService } from 'app/modules/websocket/api.service';
import { NvmeOfService } from 'app/pages/sharing/nvme-of/services/nvme-of.service';
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
        mockCall('rdma.capable_protocols', [RdmaProtocolName.Nvmet]),
        mockCall('nvmet.port_subsys.delete'),
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
      const ports = [
        { id: 1 },
        { id: 2 },
        { id: 3 },
      ] as NvmeOfPort[];

      await firstValueFrom(spectator.service.associatePorts(subsystem, ports));

      expect(api.call).toHaveBeenCalledTimes(ports.length);
      ports.forEach((port) => {
        expect(api.call).toHaveBeenCalledWith(
          'nvmet.port_subsys.create',
          [{ port_id: port.id, subsys_id: subsystem.id }],
        );
      });
    });
  });

  describe('removePortAssociation', () => {
    it('queries for subsystem-port association and deletes it', async () => {
      const mockedApi = spectator.inject(MockApiService);
      mockedApi.mockCall('nvmet.port_subsys.query', [{ id: 1 } as SubsystemPortAssociation]);

      await firstValueFrom(spectator.service.removePortAssociation({ id: 1 }, { id: 1 } as NvmeOfPort));

      expect(api.call).toHaveBeenCalledWith('nvmet.port_subsys.query', [[['subsys_id', '=', 1], ['port_id', '=', 1]]]);
      expect(api.call).toHaveBeenCalledWith('nvmet.port_subsys.delete', [1]);
    });
  });

  describe('associateHosts', () => {
    it('should make multiple calls to associate host with a subsystem', async () => {
      const subsystem = { id: 1 } as NvmeOfSubsystem;
      const hosts = [
        { id: 1 },
        { id: 2 },
        { id: 3 },
      ] as NvmeOfHost[];

      await firstValueFrom(spectator.service.associateHosts(subsystem, hosts));

      expect(api.call).toHaveBeenCalledTimes(hosts.length);
      hosts.forEach((host) => {
        expect(api.call).toHaveBeenCalledWith(
          'nvmet.host_subsys.create',
          [{ host_id: host.id, subsys_id: subsystem.id }],
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

  describe('isRdmaCapable', () => {
    it('should return whether RDMA is capable and cache the result', async () => {
      const first = await firstValueFrom(spectator.service.isRdmaCapable());
      const second = await firstValueFrom(spectator.service.isRdmaCapable());

      expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('rdma.capable_protocols');
      expect(spectator.inject(ApiService).call).toHaveBeenCalledTimes(1);
      expect(first).toBe(true);
      expect(second).toBe(true);
    });
  });
});
