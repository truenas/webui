import { createServiceFactory, mockProvider, SpectatorService } from '@ngneat/spectator/jest';
import { createFakeClient, FakeTrueNasClient } from '@truenas/api-client/testing';
import { environment } from 'environments/environment';
import { EMPTY, firstValueFrom, of } from 'rxjs';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { TYPED_API_CLIENT, WebUiApiDirectory } from 'app/modules/websocket/typed-api/typed-api-client.token';
import { WebSocketHandlerService } from 'app/modules/websocket/websocket-handler.service';
import { MockResponseService } from 'app/modules/websocket-debug-panel/services/mock-response.service';
import { WebSocketDebugService } from 'app/modules/websocket-debug-panel/services/websocket-debug.service';
import { WebSocketStatusService } from 'app/services/websocket-status.service';

/** The fake writes and answers frames on a microtask, as a socket would. */
const settle = (): Promise<void> => new Promise((resolve) => {
  setTimeout(resolve);
});

describe('WebSocketHandlerService', () => {
  let spectator: SpectatorService<WebSocketHandlerService>;
  let client: FakeTrueNasClient<WebUiApiDirectory>;
  let debugPanelWasEnabled: boolean;

  const createService = createServiceFactory({
    service: WebSocketHandlerService,
    providers: [
      {
        provide: TYPED_API_CLIENT,
        useFactory: () => of(client),
      },
      // The real one, so the status this service publishes on opening is the
      // status its own call queue waits for. That loop is the subject of half
      // of these tests.
      WebSocketStatusService,
      mockProvider(DialogService),
      mockProvider(WebSocketDebugService),
      mockProvider(MockResponseService, { responses$: EMPTY }),
    ],
  });

  const sentMethods = (): string[] => client.connection.sent.map((frame) => String(frame.method));

  beforeEach(() => {
    // The debug panel's interception is exercised in
    // `websocket-handler-error-handling.spec.ts`; here it would only stand
    // between a scheduled call and the wire.
    debugPanelWasEnabled = Boolean(environment.debugPanel?.enabled);
    environment.debugPanel = { ...environment.debugPanel, enabled: false };

    client = createFakeClient({ version: 'v27.0.0', opened: false });
    spectator = createService();
  });

  afterEach(() => {
    client.close();
    environment.debugPanel = { ...environment.debugPanel, enabled: debugPanelWasEnabled };
  });

  it('sends a scheduled call over the typed client’s connection', async () => {
    client.connection.simulateOpen();
    spectator.service.scheduleCall({ id: 'message-1', method: 'truenas.get_eula', params: [] });
    await settle();

    expect(client.connection.sent).toContainEqual({
      jsonrpc: '2.0',
      id: 'message-1',
      method: 'truenas.get_eula',
      params: [],
    });
  });

  it('reports the connection as open and closed as the borrowed socket comes and goes', async () => {
    const wsStatus = spectator.inject(WebSocketStatusService);

    client.connection.simulateOpen();
    await settle();
    expect(wsStatus.isConnected).toBe(true);
    await expect(firstValueFrom(spectator.service.isClosed$)).resolves.toBe(false);

    client.connection.simulateClose();
    await settle();
    expect(wsStatus.isConnected).toBe(false);
    await expect(firstValueFrom(spectator.service.isClosed$)).resolves.toBe(true);
  });

  it('holds calls made while the connection is down and sends them when it comes back', async () => {
    client.connection.simulateOpen();
    spectator.service.scheduleCall({ id: 'message-1', method: 'truenas.get_eula', params: [] });
    await settle();

    client.connection.simulateClose();
    spectator.service.scheduleCall({ id: 'message-2', method: 'truenas.is_eula_accepted', params: [] });
    spectator.service.scheduleCall({ id: 'message-3', method: 'truenas.accept_eula', params: [] });
    await settle();

    expect(sentMethods()).toContain('truenas.get_eula');
    expect(sentMethods()).not.toContain('truenas.is_eula_accepted');
    expect(sentMethods()).not.toContain('truenas.accept_eula');

    client.connection.simulateOpen();
    await settle();
    expect(sentMethods()).toContain('truenas.is_eula_accepted');

    // The queue releases one call per completion, so the third waits for the
    // second to be answered.
    client.connection.receive({ jsonrpc: '2.0', id: 'message-2', result: true });
    await settle();
    expect(sentMethods()).toContain('truenas.accept_eula');
  });

  it('carries the connection’s messages on responses$', async () => {
    client.connection.simulateOpen();
    const answer = firstValueFrom(spectator.service.responses$);

    client.connection.receive({ jsonrpc: '2.0', id: 'message-1', result: 'eula' });

    await expect(answer).resolves.toMatchObject({ id: 'message-1', result: 'eula' });
  });

  it('flags access as restricted when the appliance refuses the client', async () => {
    client.connection.simulateOpen();
    await settle();

    client.connection.simulateClose(1008);
    await settle();

    await expect(firstValueFrom(spectator.service.isAccessRestricted$)).resolves.toBe(true);
  });

  it('clears the shutdown flag when the connection comes back', async () => {
    spectator.service.prepareShutdown();
    expect(spectator.service.isSystemShuttingDown).toBe(true);

    client.connection.simulateOpen();
    await settle();

    expect(spectator.service.isSystemShuttingDown).toBe(false);
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

    spectator.service.setupConnectionUrl('https:', 'truenas.local:444');
    await settle();

    expect(setEndpoint).toHaveBeenCalledWith({
      hostnames: ['truenas.local:444'],
      protocol: 'https:',
    });
  });
});
