import { createServiceFactory, SpectatorService } from '@ngneat/spectator/jest';
import { JobState } from '@truenas/api-client';
import {
  createFakeClient, fakeApiError, fakeJob, FakeTrueNasClient, withSpies,
} from '@truenas/api-client/testing';
import { defaultIfEmpty, firstValueFrom, lastValueFrom, of } from 'rxjs';
import { ApiErrorName } from 'app/enums/api.enum';
import { TYPED_API_CLIENT, WebUiApiDirectory } from 'app/modules/websocket/typed-api/typed-api-client.token';
import { TypedApiService } from 'app/modules/websocket/typed-api/typed-api.service';
import { ApiCallError, FailedJobError } from 'app/services/errors/error.classes';
import { WebSocketStatusService } from 'app/services/websocket-status.service';

/** The fake answers frames on a microtask, as a socket would; let those land. */
const settle = (): Promise<void> => new Promise((resolve) => {
  setTimeout(resolve);
});

describe('TypedApiService', () => {
  let spectator: SpectatorService<TypedApiService>;
  let client: FakeTrueNasClient<WebUiApiDirectory>;
  let wsStatus: WebSocketStatusService;

  const createService = createServiceFactory({
    service: TypedApiService,
    providers: [
      {
        provide: TYPED_API_CLIENT,
        useFactory: () => of(client),
      },
      {
        provide: WebSocketStatusService,
        useFactory: () => wsStatus,
      },
    ],
  });

  beforeEach(() => {
    // Not strict: these specs answer frames by hand with `connection.reply`.
    client = withSpies(
      createFakeClient({ version: 'v27.0.0', authenticated: false, opened: false }),
      jest.fn,
    );
    wsStatus = {
      setSessionStatus: jest.fn(),
      setLoginStatus: jest.fn(),
    } as unknown as WebSocketStatusService;

    spectator = createService();
  });

  afterEach(() => {
    client.close();
  });

  const sentMethods = (): string[] => client.connection.sent.map((frame) => String(frame.method));

  function signIn(): void {
    client.authenticator.authenticated$.next(true);
  }

  async function bringSessionUp(): Promise<void> {
    client.connection.simulateOpen();
    signIn();
    await settle();
  }

  describe('session status', () => {
    it('projects the typed session onto the status service', async () => {
      expect(wsStatus.setSessionStatus).toHaveBeenCalledWith(false);

      await bringSessionUp();
      expect(wsStatus.setSessionStatus).toHaveBeenCalledWith(true);

      client.authenticator.authenticated$.next(false);
      expect(wsStatus.setSessionStatus).toHaveBeenLastCalledWith(false);
    });
  });

  describe('call', () => {
    it('holds the request until the typed session is authenticated, then sends a JSON-RPC frame', async () => {
      const result = firstValueFrom(spectator.service.call('system.info'));
      expect(sentMethods()).not.toContain('system.info');

      await bringSessionUp();

      expect(client.connection.sent).toContainEqual(expect.objectContaining({
        jsonrpc: '2.0',
        method: 'system.info',
        params: [],
      }));

      client.connection.reply('system.info', { version: 'TrueNAS-27.0.0' });

      expect(await result).toEqual({ version: 'TrueNAS-27.0.0' });
    });

    it('passes params through and answers the request by its own id', async () => {
      await bringSessionUp();
      const result = firstValueFrom(spectator.service.call('alert.dismiss', ['alert-uuid']));

      expect(client.connection.sent).toContainEqual(expect.objectContaining({
        method: 'alert.dismiss',
        params: ['alert-uuid'],
      }));

      client.connection.reply('alert.dismiss', null);

      expect(await result).toBeNull();
    });

    it('throws an ApiCallError carrying the full JSON-RPC error payload', async () => {
      await bringSessionUp();
      const result = firstValueFrom(spectator.service.call('system.info'));

      client.connection.replyError('system.info', fakeApiError({
        errname: 'EINVAL',
        reason: 'Invalid value',
        extra: [['system_info.field', 'Not allowed', 22]],
      }));

      await expect(result).rejects.toBeInstanceOf(ApiCallError);
      await expect(result).rejects.toMatchObject({
        error: {
          data: {
            errname: 'EINVAL',
            reason: 'Invalid value',
            extra: [['system_info.field', 'Not allowed', 22]],
          },
        },
      });
    });

    it('ends the app session when the appliance refuses the call for want of one', async () => {
      await bringSessionUp();
      const result = firstValueFrom(
        spectator.service.call('system.info').pipe(defaultIfEmpty('refused')),
      );

      client.connection.replyError('system.info', fakeApiError({ errname: ApiErrorName.NotAuthenticated }));

      expect(await result).toBe('refused');
      expect(wsStatus.setLoginStatus).toHaveBeenCalledWith(false);
    });
  });

  describe('job', () => {
    it('follows a job through the real correlation and emits the final state', async () => {
      await bringSessionUp();
      client.mock.job('pool.dataset.export_key', [
        { state: JobState.Running, progress: { percent: 50 } },
        { state: JobState.Success, result: 'done', time_finished: { $date: 1 } },
      ]);

      const job = await lastValueFrom(spectator.service.job('pool.dataset.export_key', ['tank/enc']));

      expect(client.connection.sent).toContainEqual(expect.objectContaining({
        method: 'pool.dataset.export_key',
        params: ['tank/enc'],
      }));
      expect(job).toMatchObject({ state: JobState.Success, result: 'done' });
    });

    it('throws a FailedJobError when the job fails', async () => {
      await bringSessionUp();
      client.mock.job('pool.dataset.export_key', fakeJob({
        state: JobState.Failed,
        error: 'boom',
        time_finished: { $date: 1 },
      }));

      await expect(lastValueFrom(spectator.service.job('pool.dataset.export_key', ['tank/enc'])))
        .rejects.toBeInstanceOf(FailedJobError);
    });
  });

  describe('subscribe', () => {
    it('holds the subscription until the typed session is authenticated, then delivers events', async () => {
      const received = firstValueFrom(spectator.service.subscribe('alert.list'));
      await settle();
      expect(sentMethods()).not.toContain('core.subscribe');

      await bringSessionUp();
      expect(sentMethods()).toContain('core.subscribe');

      client.mock.emit('alert.list', { msg: 'removed', id: 1 });

      expect(await received).toEqual({ msg: 'removed', id: 1 });
    });
  });
});
