import { createServiceFactory, SpectatorService } from '@ngneat/spectator/jest';
import { JobState } from '@truenas/api-client';
import {
  createFakeClient, fakeApiError, fakeJob, FakeTrueNasClient, withSpies,
} from '@truenas/api-client/testing';
import {
  BehaviorSubject, defaultIfEmpty, EMPTY, firstValueFrom, lastValueFrom, NEVER, of, throwError,
} from 'rxjs';
import { MockApiService } from 'app/core/testing/classes/mock-api.service';
import { mockApi, mockCall } from 'app/core/testing/utils/mock-api.utils';
import { ApiErrorName } from 'app/enums/api.enum';
import { LoginExResponse, LoginExResponseType } from 'app/interfaces/auth.interface';
import { TYPED_API_CLIENT, WebUiApiDirectory } from 'app/modules/websocket/typed-api/typed-api-client.token';
import { TypedApiService } from 'app/modules/websocket/typed-api/typed-api.service';
import { ApiCallError, FailedJobError, TypedApiSessionError } from 'app/services/errors/error.classes';
import { WebSocketStatusService } from 'app/services/websocket-status.service';

/** The fake answers frames on a microtask, as a socket would; let those land. */
const settle = (): Promise<void> => new Promise((resolve) => {
  setTimeout(resolve);
});

describe('TypedApiService', () => {
  let spectator: SpectatorService<TypedApiService>;
  let client: FakeTrueNasClient<WebUiApiDirectory>;
  let legacyConnected$: BehaviorSubject<boolean>;
  let wsStatus: WebSocketStatusService;

  const createService = createServiceFactory({
    service: TypedApiService,
    providers: [
      mockApi([
        mockCall('auth.login_ex', { response_type: LoginExResponseType.Success } as LoginExResponse),
      ]),
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
    client.mock.call('auth.generate_token', 'one-shot-token');
    legacyConnected$ = new BehaviorSubject(false);
    wsStatus = {
      isConnected$: legacyConnected$,
      setSessionStatus: jest.fn(),
      setLoginStatus: jest.fn(),
    } as unknown as WebSocketStatusService;

    spectator = createService();
  });

  afterEach(() => {
    client.close();
  });

  const sentMethods = (): string[] => client.connection.sent.map((frame) => String(frame.method));
  const mintedTokenCount = (): number => sentMethods().filter((method) => method === 'auth.generate_token').length;
  const legacyApi = (): MockApiService => spectator.inject(MockApiService);
  const legacyLogins = (): unknown[] => jest.mocked(legacyApi().call).mock.calls
    .filter(([method]) => method === 'auth.login_ex')
    .map(([, params]) => params);

  function signIn(): void {
    client.authenticator.authenticated$.next(true);
  }

  async function bringSessionUp(): Promise<void> {
    client.connection.simulateOpen();
    signIn();
    legacyConnected$.next(true);
    await settle();
  }

  describe('lending the session to the legacy socket', () => {
    it('mints a one-shot token and logs the legacy socket in with it once both are up', async () => {
      client.connection.simulateOpen();
      signIn();
      await settle();
      expect(legacyLogins()).toEqual([]);

      legacyConnected$.next(true);
      await settle();

      expect(client.connection.sent).toContainEqual(expect.objectContaining({
        method: 'auth.generate_token',
        params: [300, {}, true, true],
      }));
      expect(legacyLogins()).toEqual([[{ mechanism: 'TOKEN_PLAIN', token: 'one-shot-token' }]]);
    });

    it('does not lend anything while the typed session is not signed in', async () => {
      client.connection.simulateOpen();
      legacyConnected$.next(true);
      await settle();

      expect(sentMethods()).not.toContain('auth.generate_token');
      expect(legacyLogins()).toEqual([]);
    });

    it('lends again when the legacy socket reconnects', async () => {
      await bringSessionUp();

      legacyConnected$.next(false);
      legacyConnected$.next(true);
      await settle();

      expect(legacyLogins()).toHaveLength(2);
    });

    it('lends again when middleware refuses a call on the legacy socket for want of a session', async () => {
      await bringSessionUp();

      legacyApi().sessionLost.next();
      await settle();

      expect(legacyLogins()).toHaveLength(2);
    });

    it('mints one token when a sign-in and the reconnect both ask for the borrow', async () => {
      const lent = firstValueFrom(spectator.service.lendSessionToLegacySocket());

      await bringSessionUp();

      await expect(lent).resolves.toBeUndefined();
      expect(sentMethods().filter((method) => method === 'auth.generate_token')).toHaveLength(1);
      expect(legacyLogins()).toHaveLength(1);
    });
  });

  describe('lending after a failed borrow', () => {
    const tick = (ms: number): Promise<void> => jest.advanceTimersByTimeAsync(ms);

    beforeEach(() => {
      jest.useFakeTimers();
      jest.spyOn(console, 'error').mockImplementation();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('retries with backoff and succeeds without bothering the caller', async () => {
      const legacyCall = jest.mocked(legacyApi().call);
      const legacyDown = (): Error => new Error('legacy down');
      legacyCall
        .mockReturnValueOnce(throwError(legacyDown))
        .mockReturnValueOnce(throwError(legacyDown));
      client.connection.simulateOpen();
      signIn();

      const lent = firstValueFrom(spectator.service.lendSessionToLegacySocket());
      await tick(0);
      expect(legacyCall).toHaveBeenCalledTimes(1);

      await tick(1000);
      expect(legacyCall).toHaveBeenCalledTimes(2);

      await tick(2000);
      await expect(lent).resolves.toBeUndefined();
      expect(legacyCall).toHaveBeenCalledTimes(3);
    });

    it('reports the failure once the retries are spent', async () => {
      const legacyCall = jest.mocked(legacyApi().call);
      legacyCall.mockReturnValue(throwError(() => new Error('legacy down')));
      client.connection.simulateOpen();
      signIn();

      const lent = firstValueFrom(spectator.service.lendSessionToLegacySocket());
      await tick(1000 + 2000 + 4000);

      await expect(lent).rejects.toBeInstanceOf(TypedApiSessionError);
      expect(legacyCall).toHaveBeenCalledTimes(4);
    });

    it('reports a borrow the legacy socket refuses', async () => {
      legacyApi().mockCall('auth.login_ex', { response_type: LoginExResponseType.AuthErr } as LoginExResponse);
      client.connection.simulateOpen();
      signIn();

      const lent = firstValueFrom(spectator.service.lendSessionToLegacySocket());
      await tick(1000 + 2000 + 4000);

      await expect(lent).rejects.toBeInstanceOf(TypedApiSessionError);
    });

    it('ends the app session once the reactive borrow has given up', async () => {
      // `ApiService` used to drop the session directly on ENOTAUTHENTICATED. Without
      // this the admin shell keeps rendering as signed in while every legacy call
      // fails, with no route back to the sign-in page that would repair it.
      jest.mocked(legacyApi().call).mockReturnValue(throwError(() => new Error('legacy down')));
      client.connection.simulateOpen();
      signIn();
      legacyConnected$.next(true);

      await tick(1000 + 2000 + 4000);

      expect(wsStatus.setLoginStatus).toHaveBeenCalledWith(false);
    });

    it('treats a legacy answer that never comes as a failed borrow', async () => {
      // `ApiService.call` completes without emitting on ENOTAUTHENTICATED. Carried
      // through, that would finish a sign-in without a result or an error.
      jest.mocked(legacyApi().call).mockReturnValue(EMPTY);
      client.connection.simulateOpen();
      signIn();

      const lent = firstValueFrom(spectator.service.lendSessionToLegacySocket());
      await tick(1000 + 2000 + 4000);

      await expect(lent).rejects.toBeInstanceOf(TypedApiSessionError);
    });

    it('makes one borrow for a burst of refusals, not one per refused call', async () => {
      await tick(0);
      client.connection.simulateOpen();
      signIn();
      legacyConnected$.next(true);
      await tick(0);
      const afterFirstBorrow = mintedTokenCount();

      // A socket that comes back unauthenticated has every queued call refused at
      // once; each refusal cancelling the borrow they are all waiting on would
      // abandon a token it had already minted.
      legacyApi().sessionLost.next();
      legacyApi().sessionLost.next();
      legacyApi().sessionLost.next();
      await tick(600);

      expect(mintedTokenCount()).toBe(afterFirstBorrow + 1);
    });

    it('re-borrows on the first refusal rather than waiting out the burst', async () => {
      await tick(0);
      client.connection.simulateOpen();
      signIn();
      legacyConnected$.next(true);
      await tick(0);
      const afterFirstBorrow = mintedTokenCount();

      // Trailing-edge debouncing delayed every re-borrow by the window, and
      // starved it entirely while refusals kept arriving faster than that.
      legacyApi().sessionLost.next();
      await tick(0);

      expect(mintedTokenCount()).toBe(afterFirstBorrow + 1);
    });

    it('keeps re-borrowing across successive bursts', async () => {
      await tick(0);
      client.connection.simulateOpen();
      signIn();
      legacyConnected$.next(true);
      await tick(0);
      const afterFirstBorrow = mintedTokenCount();

      legacyApi().sessionLost.next();
      await tick(600);
      legacyApi().sessionLost.next();
      await tick(600);

      expect(mintedTokenCount()).toBe(afterFirstBorrow + 2);
    });

    it('gives up on a borrow whose answer never comes, rather than hanging on it', async () => {
      // `ApiService.call` can neither emit, complete nor error when the socket
      // closes cleanly mid-call: its `responses$` merges the socket stream with a
      // Subject that never completes.
      jest.mocked(legacyApi().call).mockReturnValue(NEVER);
      client.connection.simulateOpen();
      signIn();

      const lent = firstValueFrom(spectator.service.lendSessionToLegacySocket());
      await tick(4 * 10_000 + 1000 + 2000 + 4000);

      await expect(lent).rejects.toBeInstanceOf(TypedApiSessionError);
    });

    it('does not let a hung borrow pin the ones after it', async () => {
      // `exhaustMap` holds the subscription and `share()` cannot reset while it
      // does, so a borrow that never settles would swallow every later trigger
      // and leave the legacy socket unauthenticated for the life of the tab.
      const legacyCall = jest.mocked(legacyApi().call);
      legacyCall.mockReturnValue(NEVER);
      client.connection.simulateOpen();
      signIn();
      legacyConnected$.next(true);
      await tick(4 * 10_000 + 1000 + 2000 + 4000);

      legacyCall.mockReturnValue(of({ response_type: LoginExResponseType.Success } as LoginExResponse));
      const lent = firstValueFrom(spectator.service.lendSessionToLegacySocket());
      await tick(0);

      await expect(lent).resolves.toBeUndefined();
    });

    it('gives up even while refusals keep arriving', async () => {
      jest.mocked(legacyApi().call).mockReturnValue(throwError(() => new Error('legacy down')));
      client.connection.simulateOpen();
      signIn();
      legacyConnected$.next(true);

      // A page polling on a socket with no session produces a refusal well inside
      // the retry ladder's ~7s. Each one restarting the borrow would hand it a
      // fresh ladder, so it would never exhaust and the give-up path would never
      // run — the session would stay up with every legacy call failing.
      for (let index = 0; index < 16; index += 1) {
        legacyApi().sessionLost.next();
        await tick(600);
      }

      expect(wsStatus.setLoginStatus).toHaveBeenCalledWith(false);
    });

    it('starts a fresh borrow the next time one is asked for', async () => {
      const legacyCall = jest.mocked(legacyApi().call);
      legacyCall.mockReturnValue(throwError(() => new Error('legacy down')));
      client.connection.simulateOpen();
      signIn();
      const failed = firstValueFrom(spectator.service.lendSessionToLegacySocket());
      await tick(1000 + 2000 + 4000);
      await expect(failed).rejects.toBeInstanceOf(TypedApiSessionError);

      legacyCall.mockReturnValue(of({ response_type: LoginExResponseType.Success } as LoginExResponse));
      const lent = firstValueFrom(spectator.service.lendSessionToLegacySocket());
      await tick(0);

      await expect(lent).resolves.toBeUndefined();
    });
  });

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
