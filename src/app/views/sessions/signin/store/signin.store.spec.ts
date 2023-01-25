import { Router } from '@angular/router';
import { createServiceFactory, SpectatorService } from '@ngneat/spectator';
import { mockProvider } from '@ngneat/spectator/jest';
import {
  BehaviorSubject, firstValueFrom, of,
} from 'rxjs';
import { MockWebsocketService } from 'app/core/testing/classes/mock-websocket.service';
import { MockWebsocketService2 } from 'app/core/testing/classes/mock-websocket2.service';
import { getTestScheduler } from 'app/core/testing/utils/get-test-scheduler.utils';
import { mockCall, mockWebsocket } from 'app/core/testing/utils/mock-websocket.utils';
import { FailoverDisabledReason } from 'app/enums/failover-disabled-reason.enum';
import { FailoverStatus } from 'app/enums/failover-status.enum';
import { WINDOW } from 'app/helpers/window.helper';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { SystemGeneralService } from 'app/services';
import { AuthService } from 'app/services/auth/auth.service';
import { SigninStore } from 'app/views/sessions/signin/store/signin.store';

describe('SigninStore', () => {
  let spectator: SpectatorService<SigninStore>;
  let websocket: MockWebsocketService;
  let websocket2: MockWebsocketService2;
  const testScheduler = getTestScheduler();

  const createService = createServiceFactory({
    service: SigninStore,
    providers: [
      mockProvider(AuthService, {
        loginWithToken: jest.fn(() => of(true)),
        generateToken: jest.fn(() => of('AUTH_TOKEN')),
        generateTokenWithDefaultLifetime: jest.fn(() => of('AUTH_TOKEN')),
      }),
      mockWebsocket([
        mockCall('auth.generate_token', 'AUTH_TOKEN'),
        mockCall('auth.login_with_token', true),
        mockCall('user.has_local_administrator_set_up', true),
        mockCall('failover.status', FailoverStatus.Single),
        mockCall('failover.get_ips', ['123.23.44.54']),
        mockCall('failover.disabled.reasons', [FailoverDisabledReason.NoLicense]),
      ]),
      mockProvider(Router),
      mockProvider(SnackbarService),
      mockProvider(SystemGeneralService, {
        loadProductType: () => of(undefined),
      }),
      {
        provide: WINDOW,
        useValue: {
          sessionStorage: {
            getItem: jest.fn(),
          },
          location: {
            protocol: 'https:',
          },
        },
      },
    ],
  });

  beforeEach(() => {
    spectator = createService();
    websocket = spectator.inject(MockWebsocketService);
    websocket2 = spectator.inject(MockWebsocketService2);
    // This strips @LocalStorage() decorator from token.
    Object.defineProperty(websocket, 'token', {
      value: '',
      writable: true,
    });
    Object.defineProperty(websocket2, 'token2', {
      value: '',
      writable: true,
    });
    websocket.isConnected$ = new BehaviorSubject(true);
    jest.spyOn(websocket, 'loginWithToken').mockReturnValue(of(true));
  });

  describe('selectors', () => {
    const initialFailover = {
      status: FailoverStatus.Error,
      ips: ['23.234.124.123'],
      disabledReasons: [FailoverDisabledReason.NoPong, FailoverDisabledReason.NoLicense],
    };
    const initialState = {
      failover: initialFailover,
      wasAdminSet: true,
      isLoading: false,
    };
    beforeEach(() => {
      spectator.service.setState(initialState);
    });

    it('hasRootPassword$', async () => {
      expect(await firstValueFrom(spectator.service.wasAdminSet$)).toBe(true);
    });

    it('failover$', async () => {
      expect(await firstValueFrom(spectator.service.failover$)).toBe(initialFailover);
    });

    it('isLoading$', async () => {
      expect(await firstValueFrom(spectator.service.isLoading$)).toBe(false);
    });

    it('canLogin$', async () => {
      expect(await firstValueFrom(spectator.service.canLogin$)).toBe(false);
    });
  });

  describe('handleSuccessfulLogin', () => {
    it('generates auth token and redirects user inside', () => {
      spectator.service.handleSuccessfulLogin();
      expect(websocket.call).toHaveBeenCalledWith('auth.generate_token', [300]);
      expect(websocket.token).toBe('AUTH_TOKEN');
      expect(spectator.inject(Router).navigateByUrl).toHaveBeenCalledWith('/dashboard');
    });
  });

  describe('init', () => {
    it('checks if root password is set and loads failover status', async () => {
      spectator.service.init();

      expect(websocket.call).toHaveBeenCalledWith('user.has_local_administrator_set_up');
      expect(websocket.call).toHaveBeenCalledWith('failover.status');

      expect(await firstValueFrom(spectator.service.state$)).toEqual({
        wasAdminSet: true,
        isLoading: false,
        failover: {
          status: FailoverStatus.Single,
        },
      });
    });

    it('loads additional failover info if failover status is not Single', async () => {
      websocket.mockCall('failover.status', FailoverStatus.Master);

      spectator.service.init();

      expect(websocket.call).toHaveBeenCalledWith('failover.get_ips');
      expect(websocket.call).toHaveBeenCalledWith('failover.disabled.reasons');
      expect(await firstValueFrom(spectator.service.state$)).toEqual({
        wasAdminSet: true,
        isLoading: false,
        failover: {
          disabledReasons: [FailoverDisabledReason.NoLicense],
          ips: ['123.23.44.54'],
          status: FailoverStatus.Master,
        },
      });
    });

    it('logs in with token if it is present in local storage (via WebsocketService.token)', () => {
      websocket.token = 'EXISTING_TOKEN';
      spectator.service.init();

      expect(websocket.loginWithToken).toHaveBeenCalledWith('EXISTING_TOKEN');
      expect(spectator.inject(Router).navigateByUrl).toHaveBeenCalledWith('/dashboard');
    });
  });

  describe('init - failover subscriptions', () => {
    beforeEach(() => {
      websocket.mockCall('failover.status', FailoverStatus.Master);
    });

    it('subscribes to failover updates if failover status is not Single', () => {
      spectator.service.init();

      expect(websocket.sub).toHaveBeenCalledWith('failover.status', expect.any(String));
      expect(websocket.sub).toHaveBeenCalledWith('failover.disabled.reasons', expect.any(String));
    });

    it('changes failover status in store when websocket event is emitted', () => {
      testScheduler.run(({ cold, expectObservable }) => {
        jest.spyOn(websocket, 'sub').mockImplementation((method) => {
          if (method !== 'failover.status') {
            return of();
          }

          return cold('a', { a: FailoverStatus.Importing });
        });

        spectator.service.init();

        expectObservable(spectator.service.state$).toBe('a', {
          a: {
            wasAdminSet: true,
            isLoading: false,
            failover: {
              disabledReasons: [FailoverDisabledReason.NoLicense],
              ips: ['123.23.44.54'],
              status: FailoverStatus.Importing,
            },
          },
        });
      });
    });

    it('changes disabled reasons in store when websocket event is emitted', () => {
      testScheduler.run(({ cold, expectObservable }) => {
        jest.spyOn(websocket, 'sub').mockImplementation((method) => {
          if (method !== 'failover.disabled.reasons') {
            return of();
          }

          return cold('a', {
            a: {
              disabled_reasons: [FailoverDisabledReason.DisagreeVip],
            },
          });
        });

        spectator.service.init();

        expectObservable(spectator.service.state$).toBe('a', {
          a: {
            wasAdminSet: true,
            isLoading: false,
            failover: {
              disabledReasons: [FailoverDisabledReason.DisagreeVip],
              ips: ['123.23.44.54'],
              status: FailoverStatus.Master,
            },
          },
        });
      });
    });
  });
});
