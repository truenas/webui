import { Router } from '@angular/router';
import { createServiceFactory, SpectatorService } from '@ngneat/spectator';
import { mockProvider } from '@ngneat/spectator/jest';
import { BehaviorSubject, firstValueFrom, of } from 'rxjs';
import { MockApiService } from 'app/core/testing/classes/mock-api.service';
import { getTestScheduler } from 'app/core/testing/utils/get-test-scheduler.utils';
import { mockCall, mockApi } from 'app/core/testing/utils/mock-api.utils';
import { FailoverDisabledReason } from 'app/enums/failover-disabled-reason.enum';
import { FailoverStatus } from 'app/enums/failover-status.enum';
import { LoginResult } from 'app/enums/login-result.enum';
import { WINDOW } from 'app/helpers/window.helper';
import { ApiEvent } from 'app/interfaces/api-message.interface';
import { FailoverDisabledReasonEvent } from 'app/interfaces/failover-disabled-reasons.interface';
import { GlobalTwoFactorConfig } from 'app/interfaces/two-factor-config.interface';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { SigninStore } from 'app/pages/signin/store/signin.store';
import { AuthService } from 'app/services/auth/auth.service';
import { SystemGeneralService } from 'app/services/system-general.service';
import { TokenLastUsedService } from 'app/services/token-last-used.service';
import { UpdateService } from 'app/services/update.service';
import { ApiService } from 'app/services/websocket/api.service';
import { WebSocketHandlerService } from 'app/services/websocket/websocket-handler.service';

describe('SigninStore', () => {
  let spectator: SpectatorService<SigninStore>;
  let websocket: MockApiService;
  let authService: AuthService;
  const testScheduler = getTestScheduler();

  const isTokenWithinTimeline$ = new BehaviorSubject<boolean>(true);

  const createService = createServiceFactory({
    service: SigninStore,
    providers: [
      mockApi([
        mockCall('user.has_local_administrator_set_up', true),
        mockCall('failover.status', FailoverStatus.Single),
        mockCall('failover.get_ips', ['123.23.44.54']),
        mockCall('auth.twofactor.config', { enabled: false } as GlobalTwoFactorConfig),
        mockCall('failover.disabled.reasons', [FailoverDisabledReason.NoLicense]),
        mockCall('system.advanced.login_banner', ''),
      ]),
      mockProvider(WebSocketHandlerService, {
        isConnected$: of(true),
        responses$: of(),
      }),
      mockProvider(TokenLastUsedService, {
        isTokenWithinTimeline$,
      }),
      mockProvider(Router),
      mockProvider(SnackbarService),
      mockProvider(UpdateService, {
        hardRefreshIfNeeded: () => of(undefined),
      }),
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
    websocket = spectator.inject(MockApiService);
    authService = spectator.inject(AuthService);

    Object.defineProperty(authService, 'authToken$', {
      value: of('EXISTING_TOKEN'),
    });
    Object.defineProperty(authService, 'user$', {
      get: () => of({ twofactor_auth_configured: false }),
    });
    jest.spyOn(authService, 'loginWithToken').mockReturnValue(of(LoginResult.Success));
    jest.spyOn(authService, 'clearAuthToken').mockReturnValue(null);
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
      loginBanner: '',
    };
    beforeEach(() => {
      spectator.service.setState(initialState);
    });

    it('loginBanner$', async () => {
      expect(await firstValueFrom(spectator.service.loginBanner$)).toBe('');
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
    it('redirects user', () => {
      jest.spyOn(spectator.inject(ApiService), 'call').mockReturnValueOnce(of({ enabled: false }));
      jest.spyOn(spectator.inject(Router), 'navigateByUrl');
      spectator.service.handleSuccessfulLogin();
      expect(spectator.inject(Router).navigateByUrl).toHaveBeenCalledWith('/dashboard');
    });
  });

  describe('init', () => {
    it('checks login banner and show if set', async () => {
      websocket.mockCall('system.advanced.login_banner', 'HELLO USER');
      spectator.service.init();

      expect(await firstValueFrom(spectator.service.state$)).toEqual({
        wasAdminSet: true,
        loginBanner: 'HELLO USER',
        isLoading: false,
        failover: {
          status: FailoverStatus.Single,
        },
      });
    });

    it('checks if root password is set and loads failover status', async () => {
      spectator.service.init();

      expect(websocket.call).toHaveBeenCalledWith('user.has_local_administrator_set_up');
      expect(websocket.call).toHaveBeenCalledWith('failover.status');

      expect(await firstValueFrom(spectator.service.state$)).toEqual({
        wasAdminSet: true,
        loginBanner: '',
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
        loginBanner: '',
        failover: {
          disabledReasons: [FailoverDisabledReason.NoLicense],
          ips: ['123.23.44.54'],
          status: FailoverStatus.Master,
        },
      });
    });

    it('logs in with token if it is present in local storage (via AuthService.token)', () => {
      spectator.service.init();

      expect(authService.loginWithToken).toHaveBeenCalled();
      expect(spectator.inject(Router).navigateByUrl).toHaveBeenCalledWith('/dashboard');
    });

    it('should not call "loginWithToken" if token is not within timeline and clear auth token', () => {
      isTokenWithinTimeline$.next(false);
      spectator.service.init();

      expect(authService.clearAuthToken).toHaveBeenCalled();
      expect(authService.loginWithToken).not.toHaveBeenCalled();
      expect(spectator.inject(Router).navigateByUrl).not.toHaveBeenCalled();
    });
  });

  describe('init - failover subscriptions', () => {
    beforeEach(() => {
      websocket.mockCall('failover.status', FailoverStatus.Master);
    });

    it('subscribes to failover updates if failover status is not Single', () => {
      spectator.service.init();

      expect(websocket.subscribe).toHaveBeenCalledWith('failover.status');
      expect(websocket.subscribe).toHaveBeenCalledWith('failover.disabled.reasons');
    });

    it('changes failover status in store when websocket event is emitted', async () => {
      jest.spyOn(websocket, 'subscribe').mockImplementation((method) => {
        if (method !== 'failover.status') {
          return of();
        }

        return of({ fields: { status: FailoverStatus.Importing } } as ApiEvent<{ status: FailoverStatus }>);
      });

      spectator.service.init();

      expect(await firstValueFrom(spectator.service.state$)).toEqual({
        wasAdminSet: true,
        isLoading: false,
        loginBanner: '',
        failover: {
          disabledReasons: [FailoverDisabledReason.NoLicense],
          ips: ['123.23.44.54'],
          status: FailoverStatus.Importing,
        },
      });
    });

    it('changes disabled reasons in store when websocket event is emitted', () => {
      testScheduler.run(({ cold, expectObservable }) => {
        jest.spyOn(websocket, 'subscribe').mockImplementation((method) => {
          if (method !== 'failover.disabled.reasons') {
            return of();
          }

          return cold('a', {
            a: {
              fields: {
                disabled_reasons: [FailoverDisabledReason.DisagreeVip],
              },
            } as ApiEvent<FailoverDisabledReasonEvent>,
          });
        });

        spectator.service.init();

        expectObservable(spectator.service.state$).toBe('a', {
          a: {
            wasAdminSet: true,
            isLoading: false,
            loginBanner: '',
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
