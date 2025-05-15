import { createServiceFactory, SpectatorService } from '@ngneat/spectator/jest';
import { mockApi, mockCall } from 'app/core/testing/utils/mock-api.utils';
import {
  NvmeOfNamespace, NvmeOfSubsystem, SubsystemHostAssociation, SubsystemPortAssociation,
} from 'app/interfaces/nvme-of.interface';
import { NvmeOfStore } from 'app/pages/sharing/nvme-of/nvme-of.store';

const mockedSubsys1 = {
  allow_any_host: true,
  id: 1,
  name: 'subsys-1',
  ieee_oui: 'ieee_oui-1',
  ana: false,
  pi_enable: true,
  qix_max: 4,
  serial: 'serial-1',
  subnqn: 'subnqn-1',
};
const mockedSubsys2 = {
  allow_any_host: true,
  id: 2,
  name: 'subsys-2',
  ieee_oui: 'ieee_oui-2',
  ana: false,
  pi_enable: true,
  qix_max: 4,
  serial: 'serial-2',
  subnqn: 'subnqn-2',
};
const mockedSubsystems: NvmeOfSubsystem[] = [
  mockedSubsys1,
  mockedSubsys2,
];

const mockedNameSpaces: NvmeOfNamespace[] = [
  {
    id: 1,
    subsystem: mockedSubsys1,
  } as unknown as NvmeOfNamespace,
];

const mockedPorts: SubsystemPortAssociation[] = [
  {
    id: 1,
    subsystem: mockedSubsys1,
  } as unknown as SubsystemPortAssociation,
];

const mockedHosts: SubsystemHostAssociation[] = [
  {
    id: 1,
    subsystem: mockedSubsys1,
  } as unknown as SubsystemHostAssociation,
];

describe('NvmeOfstore', () => {
  let spectator: SpectatorService<NvmeOfStore>;

  const createService = createServiceFactory({
    service: NvmeOfStore,
    providers: [
      mockApi([
        mockCall('nvmet.subsys.query', mockedSubsystems),
        mockCall('nvmet.namespace.query', mockedNameSpaces),
        mockCall('nvmet.port_subsys.query', mockedPorts),
        mockCall('nvmet.host_subsys.query', mockedHosts),
      ]),
    ],
  });

  beforeEach(() => {
    spectator = createService();
  });

  it('emits subsystems', () => {
    expect(spectator.service.subsystems()).toEqual([mockedSubsys1, mockedSubsys2]);
  });

  it('returns correct number of namespaces', () => {
    expect(spectator.service.getSubsystemNamespaces(mockedSubsys1)).toBe(1);
    expect(spectator.service.getSubsystemNamespaces(mockedSubsys2)).toBe(0);
  });

  it('returns correct number of hosts', () => {
    expect(spectator.service.getSubsystemHosts(mockedSubsys1)).toBe(1);
    expect(spectator.service.getSubsystemHosts(mockedSubsys2)).toBe(0);
  });

  it('returns correct number of ports', () => {
    expect(spectator.service.getSubsystemPorts(mockedSubsys1)).toBe(1);
    expect(spectator.service.getSubsystemPorts(mockedSubsys2)).toBe(0);
  });
});
