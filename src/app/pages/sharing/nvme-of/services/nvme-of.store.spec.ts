import { createServiceFactory, SpectatorService } from '@ngneat/spectator/jest';
import { mockApi, mockCall } from 'app/core/testing/utils/mock-api.utils';
import {
  NvmeOfHost,
  NvmeOfNamespace, NvmeOfPort, NvmeOfSubsystem,
} from 'app/interfaces/nvme-of.interface';
import { ApiService } from 'app/modules/websocket/api.service';
import { NvmeOfStore } from 'app/pages/sharing/nvme-of/services/nvme-of.store';

const mockedSubsystem1 = {
  allow_any_host: true,
  id: 1,
  name: 'subsys-1',
  ieee_oui: 'ieee_oui-1',
  ana: false,
  pi_enable: true,
  qix_max: 4,
  serial: 'serial-1',
  subnqn: 'subnqn-1',
  hosts: [],
  ports: [],
  namespaces: [],
} as NvmeOfSubsystem;

const mockedSubsystem2 = {
  allow_any_host: true,
  id: 2,
  name: 'subsys-2',
  ieee_oui: 'ieee_oui-2',
  ana: false,
  pi_enable: true,
  qix_max: 4,
  serial: 'serial-2',
  subnqn: 'subnqn-2',
  namespaces: [1],
  ports: [10, 11],
  hosts: [100],
} as NvmeOfSubsystem;

const mockedSubsystems = [
  mockedSubsystem1,
  mockedSubsystem2,
] as NvmeOfSubsystem[];

const mockedNameSpaces = [
  { id: 1 },
] as NvmeOfNamespace[];

const mockedPorts = [
  { id: 10 },
  { id: 11 },
] as NvmeOfPort[];

const mockedHosts = [
  { id: 100 },
] as NvmeOfHost[];

describe('NvmeOfstore', () => {
  let spectator: SpectatorService<NvmeOfStore>;

  const createService = createServiceFactory({
    service: NvmeOfStore,
    providers: [
      mockApi([
        mockCall('nvmet.subsys.query', mockedSubsystems),
        mockCall('nvmet.namespace.query', mockedNameSpaces),
        mockCall('nvmet.port.query', mockedPorts),
        mockCall('nvmet.host.query', mockedHosts),
      ]),
    ],
  });

  beforeEach(() => {
    spectator = createService();
  });

  it('loads subsystems, namespaces, hosts and ports and updates the state', () => {
    const api = spectator.inject(ApiService);

    spectator.service.initialize();

    expect(api.call).toHaveBeenCalledWith('nvmet.subsys.query', [[], { extra: { verbose: true } }]);
    expect(api.call).toHaveBeenCalledWith('nvmet.namespace.query');
    expect(api.call).toHaveBeenCalledWith('nvmet.host.query');
    expect(api.call).toHaveBeenCalledWith('nvmet.port.query');

    expect(spectator.service.state()).toEqual({
      subsystems: mockedSubsystems,
      namespaces: mockedNameSpaces,
      hosts: mockedHosts,
      ports: mockedPorts,
      isLoading: false,
    });
  });

  describe('subsystems()', () => {
    it('returns an array of subsystems together with their relations as NvmeOfSubsystemDetails', () => {
      const subsystems = spectator.service.subsystems();

      expect(subsystems).toHaveLength(2);
      expect(subsystems[0]).toEqual(mockedSubsystem1);
      expect(subsystems[1]).toEqual({
        ...mockedSubsystem2,
        hosts: mockedHosts,
        ports: mockedPorts,
        namespaces: mockedNameSpaces,
      });
    });
  });
});
