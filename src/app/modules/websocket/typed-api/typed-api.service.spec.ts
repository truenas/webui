import { createServiceFactory, SpectatorService } from '@ngneat/spectator/jest';
import { JobState, TrueNasAuthMechanism } from '@truenas/api-client';
import {
  createFakeClient, fakeApiError, fakeJob, FakeTrueNasClient, withSpies,
} from '@truenas/api-client/testing';
import {
  BehaviorSubject, firstValueFrom, lastValueFrom, of, throwError,
} from 'rxjs';
import { mockApi, mockCall } from 'app/core/testing/utils/mock-api.utils';
import { ApiService } from 'app/modules/websocket/api.service';
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
  let legacyAuthenticated$: BehaviorSubject<boolean>;

  const createService = createServiceFactory({
    service: TypedApiService,
    providers: [
      mockApi([
        mockCall('auth.generate_token', 'one-shot-token'),
      ]),
      {
        provide: TYPED_API_CLIENT,
        useFactory: () => of(client),
      },
      {
        provide: WebSocketStatusService,
        useFactory: () => ({ isAuthenticated$: legacyAuthenticated$ }),
      },
    ],
  });

  beforeEach(() => {
    // Not strict: these specs answer frames by hand with `connection.reply`.
    client = withSpies(
      createFakeClient({ version: 'v27.0.0', authenticated: false, opened: false }),
      jest.fn,
    );
    legacyAuthenticated$ = new BehaviorSubject(false);

    spectator = createService();
  });

  afterEach(() => {
    client.close();
  });

  const sentMethods = (): string[] => client.connection.sent.map((frame) => String(frame.method));
  const loginTokens = (): string[] => client.authenticator.logins
    .filter((login) => login.mechanism === TrueNasAuthMechanism.Token)
    .map((login) => login.credential);

  async function bringSessionUp(): Promise<void> {
    client.connection.simulateOpen();
    legacyAuthenticated$.next(true);
    await settle();
  }

  async function dropSocket(): Promise<void> {
    client.connection.simulateClose();
    await settle();
  }

  describe('authentication bridge', () => {
    it('logs the typed socket in with a one-shot token from the legacy session once both are up', async () => {
      client.connection.simulateOpen();
      expect(loginTokens()).toEqual([]);

      legacyAuthenticated$.next(true);
      await settle();

      expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('auth.generate_token', [300, {}, true, true]);
      expect(loginTokens()).toEqual(['one-shot-token']);
      expect(client.authenticated).toBe(true);
    });

    it('does not mint a token while the typed socket is closed', async () => {
      legacyAuthenticated$.next(true);
      await settle();

      expect(spectator.inject(ApiService).call).not.toHaveBeenCalled();
      expect(loginTokens()).toEqual([]);
    });

    it('logs the typed session out when the legacy session ends', async () => {
      await bringSessionUp();

      legacyAuthenticated$.next(false);

      expect(sentMethods()).toContain('auth.logout');
      expect(client.authenticated).toBe(false);
    });

    it('spends the reconnect token from the previous login when the typed socket reconnects', async () => {
      client.authenticator.succeedNextLogin({ reconnect_token: 'chained-1' });
      await bringSessionUp();
      await dropSocket();

      client.connection.simulateOpen();
      await settle();

      expect(loginTokens()).toEqual(['one-shot-token', 'chained-1']);
      expect(spectator.inject(ApiService).call).toHaveBeenCalledTimes(1);
    });

    it('keeps chaining across several reconnects', async () => {
      client.authenticator.succeedNextLogin({ reconnect_token: 'chained-1' });
      await bringSessionUp();
      client.authenticator.succeedNextLogin({ reconnect_token: 'chained-2' });
      await dropSocket();
      client.connection.simulateOpen();
      await settle();
      await dropSocket();

      client.connection.simulateOpen();
      await settle();

      expect(loginTokens()).toEqual(['one-shot-token', 'chained-1', 'chained-2']);
      expect(spectator.inject(ApiService).call).toHaveBeenCalledTimes(1);
    });

    it('falls back to a fresh legacy token when middleware refuses the chained one', async () => {
      client.authenticator.succeedNextLogin({ reconnect_token: 'chained-1' });
      await bringSessionUp();
      await dropSocket();
      client.authenticator.failNextLogin();

      client.connection.simulateOpen();
      await settle();

      expect(loginTokens()).toEqual(['one-shot-token', 'chained-1', 'one-shot-token']);
      expect(spectator.inject(ApiService).call).toHaveBeenCalledTimes(2);
      expect(client.authenticated).toBe(true);
    });

    it('starts a new chain after the legacy session ends and comes back', async () => {
      client.authenticator.succeedNextLogin({ reconnect_token: 'chained-1' });
      await bringSessionUp();
      legacyAuthenticated$.next(false);

      legacyAuthenticated$.next(true);
      await settle();

      expect(loginTokens()).toEqual(['one-shot-token', 'one-shot-token']);
      expect(spectator.inject(ApiService).call).toHaveBeenCalledTimes(2);
    });

    it('keeps bridging after a failed seed', async () => {
      jest.spyOn(console, 'error').mockImplementation();
      jest.mocked(spectator.inject(ApiService).call).mockReturnValueOnce(throwError(() => new Error('legacy down')));
      await bringSessionUp();
      expect(client.authenticated).toBe(false);

      await dropSocket();
      client.connection.simulateOpen();
      await settle();

      expect(loginTokens()).toEqual(['one-shot-token']);
      expect(client.authenticated).toBe(true);
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
    it('delivers events pushed to the client stream', async () => {
      const received = firstValueFrom(spectator.service.subscribe('alert.list'));
      await settle();

      client.mock.emit('alert.list', { msg: 'removed', id: 1 });

      expect(await received).toEqual({ msg: 'removed', id: 1 });
    });
  });
});
