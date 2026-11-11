import { createServiceFactory, SpectatorService } from '@ngneat/spectator/jest';
import { throwError } from 'rxjs';
import { mockApi, mockQuery, settleApi } from 'app/core/testing/utils/mock-api.utils';
import {
  NvmeOfHost,
  NvmeOfNamespace, NvmeOfPort, NvmeOfSubsystem,
} from 'app/interfaces/nvme-of.interface';
import { ApiService } from 'app/modules/websocket/api.service';
import { WebUiQueryEntity } from 'app/modules/websocket/typed-api/typed-api-client.token';
import { NvmeOfStore } from 'app/pages/sharing/nvme-of/services/nvme-of.store';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';

const mockedSubsystem1 = {
  allow_any_host: true,
  id: 1,
  name: 'subsys-1',
  ieee_oui: 'ieee_oui-1',
  ana: false,
  pi_enable: true,
  qid_max: 4,
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
  qid_max: 4,
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
        mockQuery('nvmet.subsys.query', mockedSubsystems),
        mockQuery('nvmet.namespace.query', mockedNameSpaces as WebUiQueryEntity<'nvmet.namespace.query'>[]),
        mockQuery('nvmet.port.query', mockedPorts),
        mockQuery('nvmet.host.query', mockedHosts as WebUiQueryEntity<'nvmet.host.query'>[]),
      ]),
    ],
  });

  beforeEach(() => {
    spectator = createService();
  });

  it('loads subsystems, namespaces, hosts and ports and updates the state', async () => {
    const api = spectator.inject(ApiService);

    spectator.service.initialize();
    await settleApi();

    expect(api.query).toHaveBeenCalledWith('nvmet.subsys.query', [], { extra: { verbose: true } });
    expect(api.query).toHaveBeenCalledWith('nvmet.namespace.query');
    expect(api.query).toHaveBeenCalledWith('nvmet.host.query');
    expect(api.query).toHaveBeenCalledWith('nvmet.port.query');

    expect(spectator.service.namespaces()).toEqual(mockedNameSpaces);
    expect(spectator.service.hosts()).toEqual(mockedHosts);
    expect(spectator.service.ports()).toEqual(mockedPorts);
    expect(spectator.service.subsystems().map((subsystem) => subsystem.id)).toEqual([1, 2]);
    expect(spectator.service.isLoading()).toBe(false);
  });

  it('clears the loading flag and shows the error when loading fails', async () => {
    const error = new Error('Boom');
    jest.spyOn(spectator.inject(ApiService), 'query').mockReturnValue(throwError(() => error));
    jest.spyOn(spectator.inject(ErrorHandlerService), 'showErrorModal').mockImplementation();

    spectator.service.initialize();
    await settleApi();

    expect(spectator.inject(ErrorHandlerService).showErrorModal).toHaveBeenCalledWith(error);
    expect(spectator.service.isLoading()).toBe(false);
  });

  it('reloads only ports with reloadPorts()', async () => {
    const api = spectator.inject(ApiService);

    spectator.service.reloadPorts();
    await settleApi();

    expect(api.query).toHaveBeenCalledTimes(1);
    expect(api.query).toHaveBeenCalledWith('nvmet.port.query');
    expect(spectator.service.ports()).toEqual(mockedPorts);
  });

  it('reloads only hosts with reloadHosts()', async () => {
    const api = spectator.inject(ApiService);

    spectator.service.reloadHosts();
    await settleApi();

    expect(api.query).toHaveBeenCalledTimes(1);
    expect(api.query).toHaveBeenCalledWith('nvmet.host.query');
    expect(spectator.service.hosts()).toEqual(mockedHosts);
  });

  describe('subsystems()', () => {
    it('returns an array of subsystems together with their relations as NvmeOfSubsystemDetails', async () => {
      spectator.service.initialize();
      await settleApi();

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
