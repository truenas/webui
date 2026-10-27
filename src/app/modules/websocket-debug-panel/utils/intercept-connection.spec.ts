import { TestBed } from '@angular/core/testing';
import { mockProvider } from '@ngneat/spectator/jest';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import { createFakeClient, FakeTrueNasClient } from '@truenas/api-client/testing';
import { environment } from 'environments/environment';
import { firstValueFrom, take, toArray } from 'rxjs';
import { MockGenerationError } from 'app/modules/websocket/errors';
import { WebUiApiDirectory } from 'app/modules/websocket/typed-api/typed-api-client.token';
import { MockConfig } from 'app/modules/websocket-debug-panel/interfaces/mock-config.interface';
import { MockResponseService } from 'app/modules/websocket-debug-panel/services/mock-response.service';
import { WebSocketDebugService } from 'app/modules/websocket-debug-panel/services/websocket-debug.service';
import { selectEnabledMockConfigs } from 'app/modules/websocket-debug-panel/store/websocket-debug.selectors';
import { interceptConnection } from 'app/modules/websocket-debug-panel/utils/intercept-connection';

describe('interceptConnection', () => {
  let client: FakeTrueNasClient<WebUiApiDirectory>;
  let store$: MockStore;
  let debug: WebSocketDebugService;
  let mocks: MockResponseService;
  let debugPanelWasEnabled: boolean;

  const eulaMock = {
    id: 'mock-1',
    enabled: true,
    methodName: 'truenas.get_eula',
    response: { type: 'success', result: 'mocked eula' },
  } as MockConfig;

  const sentMethods = (): string[] => client.connection.sent.map((frame) => String(frame.method));

  beforeEach(() => {
    debugPanelWasEnabled = Boolean(environment.debugPanel?.enabled);
    environment.debugPanel = { ...environment.debugPanel, enabled: true };

    TestBed.configureTestingModule({
      providers: [
        MockResponseService,
        mockProvider(WebSocketDebugService),
        provideMockStore({
          selectors: [{ selector: selectEnabledMockConfigs, value: [eulaMock] }],
        }),
      ],
    });
    store$ = TestBed.inject(MockStore);
    debug = TestBed.inject(WebSocketDebugService);
    mocks = TestBed.inject(MockResponseService);

    client = createFakeClient({ version: 'v28.0.0', opened: true });
    interceptConnection(client.connection, debug, mocks);
  });

  afterEach(() => {
    client.close();
    environment.debugPanel = { ...environment.debugPanel, enabled: debugPanelWasEnabled };
  });

  it('answers a typed call from a mock config without writing it to the wire', async () => {
    // The client's verbs listen after sending, so this also proves a mocked answer arrives late enough.
    const answer = await firstValueFrom(client.api.call('truenas.get_eula'));

    expect(answer).toBe('mocked eula');
    expect(sentMethods()).not.toContain('truenas.get_eula');
    expect(debug.logOutgoingMessage).toHaveBeenCalledWith(
      expect.objectContaining({ method: 'truenas.get_eula' }),
      true,
    );
    expect(debug.logIncomingMessage).toHaveBeenCalledWith(
      expect.objectContaining({ result: 'mocked eula' }),
      true,
    );
  });

  it('sends and logs a call no mock config matches', async () => {
    client.mock.call('system.host_id', 'host-1');

    const answer = await firstValueFrom(client.api.call('system.host_id'));

    expect(answer).toBe('host-1');
    expect(sentMethods()).toContain('system.host_id');
    expect(debug.logOutgoingMessage).toHaveBeenCalledWith(
      expect.objectContaining({ method: 'system.host_id' }),
      false,
    );
    expect(debug.logIncomingMessage).toHaveBeenCalledWith(
      expect.objectContaining({ result: 'host-1' }),
      false,
    );
  });

  it('puts a mocked job’s events on the connection’s message stream', async () => {
    store$.overrideSelector(selectEnabledMockConfigs, [{
      ...eulaMock,
      methodName: 'pool.scrub.run',
      response: { type: 'success', result: 1 },
      events: [{ delay: 0, fields: { state: 'SUCCESS' } }],
    }]);
    store$.refreshState();

    const jobUpdates = firstValueFrom(client.connection.messages().pipe(
      // The reply, the job's `added` and its `changed`.
      take(3),
      toArray(),
    ));
    client.connection.send({
      jsonrpc: '2.0', id: 'call-1', method: 'pool.scrub.run', params: [],
    });

    expect(await jobUpdates).toEqual(expect.arrayContaining([
      expect.objectContaining({
        method: 'collection_update',
        params: expect.objectContaining({
          collection: 'core.get_jobs',
          fields: expect.objectContaining({ state: 'SUCCESS', message_ids: ['call-1'] }),
        }),
      }),
    ]));
  });

  it('fails the send with MockGenerationError when a mock cannot be generated', () => {
    jest.spyOn(mocks, 'generateMockResponse').mockImplementation(() => {
      throw new Error('Template error');
    });

    expect(() => client.connection.send({
      jsonrpc: '2.0', id: 'call-1', method: 'truenas.get_eula', params: [],
    })).toThrow(MockGenerationError);
  });

  it('sends the real request when checking the mock configs fails', () => {
    jest.spyOn(mocks, 'checkMock').mockImplementation(() => {
      throw new Error('Config check failed');
    });
    const warn = jest.spyOn(console, 'warn').mockImplementation();

    client.connection.send({
      jsonrpc: '2.0', id: 'call-1', method: 'truenas.get_eula', params: [],
    });

    expect(sentMethods()).toContain('truenas.get_eula');
    expect(warn).toHaveBeenCalledWith('Mock config check failed, proceeding with real request:', expect.any(Error));
  });
});
