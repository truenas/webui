import { createServiceFactory, SpectatorService } from '@ngneat/spectator/jest';
import { createFakeClient, FakeTrueNasClient } from '@truenas/api-client/testing';
import { firstValueFrom, of } from 'rxjs';
import { ConnectionService } from 'app/modules/websocket/connection.service';
import { TYPED_API_CLIENT, WebUiApiDirectory } from 'app/modules/websocket/typed-api/typed-api-client.token';
import { WebSocketStatusService } from 'app/services/websocket-status.service';

/** The fake reports opens and closes on a microtask, as a socket would. */
const settle = (): Promise<void> => new Promise((resolve) => {
  setTimeout(resolve);
});

describe('ConnectionService', () => {
  let spectator: SpectatorService<ConnectionService>;
  let client: FakeTrueNasClient<WebUiApiDirectory>;

  const createService = createServiceFactory({
    service: ConnectionService,
    providers: [
      {
        provide: TYPED_API_CLIENT,
        useFactory: () => of(client),
      },
      WebSocketStatusService,
    ],
  });

  beforeEach(() => {
    client = createFakeClient({ version: 'v27.0.0', opened: false });
    spectator = createService();
  });

  afterEach(() => {
    client.close();
  });

  it('reports the connection as open and closed as the socket comes and goes', async () => {
    const wsStatus = spectator.inject(WebSocketStatusService);

    await expect(firstValueFrom(spectator.service.isClosed$)).resolves.toBe(true);

    client.connection.simulateOpen();
    await settle();
    expect(wsStatus.isConnected).toBe(true);
    await expect(firstValueFrom(spectator.service.isClosed$)).resolves.toBe(false);

    client.connection.simulateClose();
    await settle();
    expect(wsStatus.isConnected).toBe(false);
    await expect(firstValueFrom(spectator.service.isClosed$)).resolves.toBe(true);
  });

  it('flags access as restricted when the appliance refuses the client, until acknowledged', async () => {
    client.connection.simulateOpen();
    await settle();

    client.connection.simulateClose(1008);
    await settle();
    await expect(firstValueFrom(spectator.service.isAccessRestricted$)).resolves.toBe(true);

    spectator.service.acknowledgeAccessRestricted();
    await expect(firstValueFrom(spectator.service.isAccessRestricted$)).resolves.toBe(false);
  });

  it('does not flag access as restricted when the socket is merely lost', async () => {
    client.connection.simulateOpen();
    await settle();

    client.connection.simulateClose();
    await settle();

    await expect(firstValueFrom(spectator.service.isAccessRestricted$)).resolves.toBe(false);
  });

  it('keeps the shutdown flag up until a new socket opens', async () => {
    client.connection.simulateOpen();
    await settle();

    spectator.service.prepareShutdown();
    expect(spectator.service.isSystemShuttingDown).toBe(true);

    client.connection.simulateClose();
    await settle();
    expect(spectator.service.isSystemShuttingDown).toBe(true);

    client.connection.simulateOpen();
    await settle();
    expect(spectator.service.isSystemShuttingDown).toBe(false);
  });

  it('lowers the shutdown flag before it reports the new socket as connected', async () => {
    const flagWhenConnected: boolean[] = [];
    spectator.inject(WebSocketStatusService).isConnected$.subscribe((isConnected) => {
      if (isConnected) {
        flagWhenConnected.push(spectator.service.isSystemShuttingDown);
      }
    });

    spectator.service.prepareShutdown();
    client.connection.simulateOpen();
    await settle();

    expect(flagWhenConnected).toEqual([false]);
  });

  it('asks the connection for a new socket on reconnect', async () => {
    const setEnabled = jest.spyOn(client.connection, 'setEnabled');

    spectator.service.reconnect();
    await settle();

    // The round trip through `false` is what asks: the gate is distinct.
    expect(setEnabled.mock.calls).toEqual([[false], [true]]);
  });

  it('re-points the connection when the appliance moves address', async () => {
    const setEndpoint = jest.spyOn(client.connection, 'setEndpoint');

    spectator.service.setEndpoint('https:', 'truenas.local:444');
    await settle();

    expect(setEndpoint).toHaveBeenCalledWith({
      hostnames: ['truenas.local:444'],
      protocol: 'https:',
    });
  });
});
