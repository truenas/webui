import { createServiceFactory, SpectatorService } from '@ngneat/spectator/jest';
import {
  BehaviorSubject, firstValueFrom, lastValueFrom, of, Subject, Subscription, throwError,
} from 'rxjs';
import { mockApi, mockCall } from 'app/core/testing/utils/mock-api.utils';
import { JobState } from 'app/enums/job-state.enum';
import { Job } from 'app/interfaces/job.interface';
import { ApiService } from 'app/modules/websocket/api.service';
import { TYPED_API_CLIENT, WebUiApiClient } from 'app/modules/websocket/typed-api/typed-api-client.token';
import { TypedApiService } from 'app/modules/websocket/typed-api/typed-api.service';
import { ApiCallError, FailedJobError } from 'app/services/errors/error.classes';
import { WebSocketStatusService } from 'app/services/websocket-status.service';

interface SentMessage {
  jsonrpc: string;
  id: string;
  method: string;
  params: unknown;
}

describe('TypedApiService', () => {
  let spectator: SpectatorService<TypedApiService>;
  let messages$: Subject<Record<string, unknown>>;
  let opened$: BehaviorSubject<boolean>;
  let authenticated$: BehaviorSubject<boolean>;
  let legacyAuthenticated$: BehaviorSubject<boolean>;
  let fakeClient: {
    authenticated: boolean;
    connection: { opened: BehaviorSubject<boolean>; messages: jest.Mock; send: jest.Mock };
    authenticator: { authenticated$: BehaviorSubject<boolean>; loginWithToken: jest.Mock; logout: jest.Mock };
    api: { job: jest.Mock; events: jest.Mock; callAndGetJobId: jest.Mock; query: jest.Mock };
  };

  const createService = createServiceFactory({
    service: TypedApiService,
    providers: [
      mockApi([
        mockCall('auth.generate_token', 'one-shot-token'),
      ]),
      {
        provide: TYPED_API_CLIENT,
        useFactory: () => of(fakeClient as unknown as WebUiApiClient),
      },
      {
        provide: WebSocketStatusService,
        useFactory: () => ({ isAuthenticated$: legacyAuthenticated$ }),
      },
    ],
  });

  beforeEach(() => {
    messages$ = new Subject();
    opened$ = new BehaviorSubject(false);
    authenticated$ = new BehaviorSubject(false);
    legacyAuthenticated$ = new BehaviorSubject(false);

    fakeClient = {
      get authenticated() {
        return authenticated$.value;
      },
      connection: {
        opened: opened$,
        messages: jest.fn(() => messages$),
        send: jest.fn(() => new Subscription()),
      },
      authenticator: {
        authenticated$,
        loginWithToken: jest.fn((token: string) => {
          authenticated$.next(true);
          return of({ response_type: 'SUCCESS', reconnect_token: `next-after-${token}` });
        }),
        logout: jest.fn(() => {
          authenticated$.next(false);
          return of(true);
        }),
      },
      api: {
        job: jest.fn(),
        events: jest.fn(),
        callAndGetJobId: jest.fn(),
        query: jest.fn(),
      },
    };

    spectator = createService();
  });

  function lastSentMessage(): SentMessage {
    const calls = fakeClient.connection.send.mock.calls as [SentMessage][];
    return calls[calls.length - 1][0];
  }

  function bringSessionUp(): void {
    opened$.next(true);
    legacyAuthenticated$.next(true);
  }

  function dropSocket(): void {
    opened$.next(false);
    authenticated$.next(false);
  }

  describe('authentication bridge', () => {
    it('logs the typed socket in with a one-shot token from the legacy session once both are up', () => {
      opened$.next(true);
      expect(fakeClient.authenticator.loginWithToken).not.toHaveBeenCalled();

      legacyAuthenticated$.next(true);

      expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('auth.generate_token', [300, {}, true, true]);
      expect(fakeClient.authenticator.loginWithToken).toHaveBeenCalledWith('one-shot-token');
      expect(fakeClient.authenticated).toBe(true);
    });

    it('does not mint a token while the typed socket is closed', () => {
      legacyAuthenticated$.next(true);

      expect(spectator.inject(ApiService).call).not.toHaveBeenCalled();
      expect(fakeClient.authenticator.loginWithToken).not.toHaveBeenCalled();
    });

    it('logs the typed session out when the legacy session ends', () => {
      bringSessionUp();

      legacyAuthenticated$.next(false);

      expect(fakeClient.authenticator.logout).toHaveBeenCalled();
      expect(fakeClient.authenticated).toBe(false);
    });

    it('spends the reconnect token from the previous login when the typed socket reconnects', () => {
      bringSessionUp();
      dropSocket();

      opened$.next(true);

      expect(fakeClient.authenticator.loginWithToken).toHaveBeenLastCalledWith('next-after-one-shot-token');
      expect(spectator.inject(ApiService).call).toHaveBeenCalledTimes(1);
    });

    it('keeps chaining across several reconnects', () => {
      bringSessionUp();
      dropSocket();
      opened$.next(true);
      dropSocket();

      opened$.next(true);

      expect(fakeClient.authenticator.loginWithToken).toHaveBeenLastCalledWith('next-after-next-after-one-shot-token');
      expect(spectator.inject(ApiService).call).toHaveBeenCalledTimes(1);
    });

    it('falls back to a fresh legacy token when middleware refuses the chained one', () => {
      bringSessionUp();
      dropSocket();
      fakeClient.authenticator.loginWithToken.mockReturnValueOnce(throwError(() => new Error('expired')));

      opened$.next(true);

      expect(fakeClient.authenticator.loginWithToken).toHaveBeenNthCalledWith(2, 'next-after-one-shot-token');
      expect(fakeClient.authenticator.loginWithToken).toHaveBeenNthCalledWith(3, 'one-shot-token');
      expect(spectator.inject(ApiService).call).toHaveBeenCalledTimes(2);
      expect(fakeClient.authenticated).toBe(true);
    });

    it('starts a new chain after the legacy session ends and comes back', () => {
      bringSessionUp();
      legacyAuthenticated$.next(false);

      legacyAuthenticated$.next(true);

      expect(fakeClient.authenticator.loginWithToken).toHaveBeenLastCalledWith('one-shot-token');
      expect(spectator.inject(ApiService).call).toHaveBeenCalledTimes(2);
    });

    it('keeps bridging after a failed seed', () => {
      jest.spyOn(console, 'error').mockImplementation();
      jest.mocked(spectator.inject(ApiService).call).mockReturnValueOnce(throwError(() => new Error('legacy down')));
      bringSessionUp();
      expect(fakeClient.authenticated).toBe(false);

      dropSocket();
      opened$.next(true);

      expect(fakeClient.authenticator.loginWithToken).toHaveBeenLastCalledWith('one-shot-token');
      expect(fakeClient.authenticated).toBe(true);
    });
  });

  describe('call', () => {
    it('holds the request until the typed session is authenticated, then sends a JSON-RPC message', async () => {
      const result = firstValueFrom(spectator.service.call('system.info'));
      expect(fakeClient.connection.send).not.toHaveBeenCalled();

      bringSessionUp();

      expect(fakeClient.connection.send).toHaveBeenCalledWith(expect.objectContaining({
        jsonrpc: '2.0',
        method: 'system.info',
        params: [],
      }));

      messages$.next({ id: lastSentMessage().id, result: { version: 'TrueNAS-27.0.0' } });

      expect(await result).toEqual({ version: 'TrueNAS-27.0.0' });
    });

    it('passes params through and ignores replies to other requests', async () => {
      bringSessionUp();
      const result = firstValueFrom(spectator.service.call('alert.dismiss', ['alert-uuid']));
      const sent = lastSentMessage();

      expect(sent.params).toEqual(['alert-uuid']);

      messages$.next({ id: 'someone-else', result: 'nope' });
      messages$.next({ id: sent.id, result: null });

      expect(await result).toBeNull();
    });

    it('throws an ApiCallError carrying the full JSON-RPC error payload', async () => {
      bringSessionUp();
      const result = firstValueFrom(spectator.service.call('system.info'));
      const error = {
        code: -32000,
        message: 'Validation error',
        data: {
          errname: 'EINVAL',
          reason: 'Invalid value',
          extra: [['system_info.field', 'Not allowed', 22]],
        },
      };

      messages$.next({ id: lastSentMessage().id, error });

      await expect(result).rejects.toBeInstanceOf(ApiCallError);
      await expect(result).rejects.toMatchObject({ error });
    });
  });

  describe('job', () => {
    it('follows a job to completion and emits the final state', async () => {
      bringSessionUp();
      fakeClient.api.job.mockReturnValue(of(
        {
          id: 1, state: JobState.Running, time_finished: null, progress: { percent: 50 },
        },
        {
          id: 1, state: JobState.Success, time_finished: { $date: 1 }, result: 'done',
        },
      ));

      const job = await lastValueFrom(spectator.service.job('pool.dataset.export_key', ['tank/enc']));

      expect(fakeClient.api.job).toHaveBeenCalledWith('pool.dataset.export_key', ['tank/enc']);
      expect(job).toMatchObject({ state: JobState.Success, result: 'done' });
    });

    it('throws a FailedJobError when the job fails', async () => {
      bringSessionUp();
      fakeClient.api.job.mockReturnValue(of(
        {
          id: 1, state: JobState.Failed, time_finished: { $date: 1 }, error: 'boom',
        } as Job,
      ));

      await expect(lastValueFrom(spectator.service.job('pool.dataset.export_key', ['tank/enc'])))
        .rejects.toBeInstanceOf(FailedJobError);
    });
  });

  describe('subscribe', () => {
    it('delegates to the client event stream without waiting for authentication', async () => {
      const event = { msg: 'changed', id: 1, fields: { id: 1 } };
      fakeClient.api.events.mockReturnValue(of(event));

      const received = await firstValueFrom(spectator.service.subscribe('alert.list'));

      expect(fakeClient.api.events).toHaveBeenCalledWith('alert.list');
      expect(received).toEqual(event);
    });
  });
});
