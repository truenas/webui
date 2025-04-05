import { ActivatedRoute, Router } from '@angular/router';
import { createServiceFactory, SpectatorService } from '@ngneat/spectator';
import { mockProvider } from '@ngneat/spectator/jest';
import { BehaviorSubject, firstValueFrom, of } from 'rxjs';
import { MockApiService } from 'app/core/testing/classes/mock-api.service';
import { mockApi, mockCall } from 'app/core/testing/utils/mock-api.utils';
import { LoginResult } from 'app/enums/login-result.enum';
import { WINDOW } from 'app/helpers/window.helper';
import { GlobalTwoFactorConfig } from 'app/interfaces/two-factor-config.interface';
import { AuthService } from 'app/modules/auth/auth.service';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { ApiService } from 'app/modules/websocket/api.service';
import { WebSocketHandlerService } from 'app/modules/websocket/websocket-handler.service';
import { SigninStore } from 'app/pages/signin/store/signin.store';
import { SystemGeneralService } from 'app/services/system-general.service';
import { TokenLastUsedService } from 'app/services/token-last-used.service';
import { UpdateService } from 'app/services/update.service';
import { WebSocketStatusService } from 'app/services/websocket-status.service';

describe('SigninStore', () => {
  let spectator: SpectatorService<SigninStore>;
  let api: MockApiService;
  let authService: AuthService;

  const isTokenWithinTimeline$ = new BehaviorSubject<boolean>(true);

  const createService = createServiceFactory({
    service: SigninStore,
    providers: [
      mockApi([
        mockCall('user.has_local_administrator_set_up', true),
        mockCall('auth.twofactor.config', { enabled: false } as GlobalTwoFactorConfig),
        mockCall('system.advanced.login_banner', ''),
      ]),
      mockProvider(WebSocketStatusService, {
        isConnected$: of(true),
      }),
      mockProvider(WebSocketHandlerService, {
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
            origin: 'https://localhost',
            protocol: 'https:',
          },
        },
      },
      mockProvider(ActivatedRoute, { snapshot: { queryParamMap: { get: jest.fn(() => null) } } }),
    ],
  });

  beforeEach(() => {
    spectator = createService();
    api = spectator.inject(MockApiService);
    authService = spectator.inject(AuthService);

    Object.defineProperty(authService, 'authToken$', {
      value: of('EXISTING_TOKEN'),
    });
    Object.defineProperty(authService, 'user$', {
      get: () => of({ twofactor_auth_configured: false }),
    });
    jest.spyOn(authService, 'loginWithToken').mockReturnValue(of(LoginResult.Success));
    jest.spyOn(authService, 'clearAuthToken').mockReturnValue(undefined);
    jest.spyOn(authService, 'setQueryToken').mockReturnValue(undefined);
  });

  describe('selectors', () => {
    const initialState = {
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

    it('isLoading$', async () => {
      expect(await firstValueFrom(spectator.service.isLoading$)).toBe(false);
    });

    it('canLogin$', async () => {
      expect(await firstValueFrom(spectator.service.canLogin$)).toBe(true);
    });
  });

  describe('handleSuccessfulLogin', () => {
    it('redirects user to dashboard by default', () => {
      jest.spyOn(spectator.inject(ApiService), 'call').mockReturnValueOnce(of({ enabled: false }));
      jest.spyOn(spectator.inject(Router), 'navigateByUrl');
      spectator.service.handleSuccessfulLogin();
      expect(spectator.inject(Router).navigateByUrl).toHaveBeenCalledWith('/dashboard');
    });

    it('redirects user to url stored in sessionStorage', () => {
      jest.spyOn(spectator.inject(ApiService), 'call').mockReturnValueOnce(of({ enabled: false }));
      jest.spyOn(spectator.inject(Router), 'navigateByUrl');
      jest.spyOn(spectator.inject<Window>(WINDOW).sessionStorage, 'getItem').mockReturnValueOnce('/some-url');

      spectator.service.handleSuccessfulLogin();

      expect(spectator.inject(Router).navigateByUrl).toHaveBeenCalledWith('/some-url');
    });

    it('redirects url to url stored in sessionStorage cropping out token query param', () => {
      jest.spyOn(spectator.inject(ApiService), 'call').mockReturnValueOnce(of({ enabled: false }));
      jest.spyOn(spectator.inject(Router), 'navigateByUrl');
      jest.spyOn(spectator.inject<Window>(WINDOW).sessionStorage, 'getItem').mockReturnValueOnce('/some-url?token=123');

      spectator.service.handleSuccessfulLogin();

      expect(spectator.inject(Router).navigateByUrl).toHaveBeenCalledWith('/some-url');
    });
  });

  describe('init', () => {
    it('checks login banner and show if set', async () => {
      api.mockCall('system.advanced.login_banner', 'HELLO USER');
      spectator.service.init();

      expect(await firstValueFrom(spectator.service.state$)).toEqual({
        wasAdminSet: true,
        loginBanner: 'HELLO USER',
        isLoading: false,
      });
    });

    it('checks if root password is set', async () => {
      spectator.service.init();

      expect(api.call).toHaveBeenCalledWith('user.has_local_administrator_set_up');

      expect(await firstValueFrom(spectator.service.state$)).toEqual({
        wasAdminSet: true,
        loginBanner: '',
        isLoading: false,
      });
    });

    it('logs in with token if it is present in local storage (via AuthService.token)', () => {
      spectator.service.init();

      expect(authService.loginWithToken).toHaveBeenCalled();
      expect(spectator.inject(Router).navigateByUrl).toHaveBeenCalledWith('/dashboard');
    });

    it('should not call "loginWithToken" if token is not within timeline and clear auth token and queryToken is null', () => {
      isTokenWithinTimeline$.next(false);
      spectator.service.init();

      expect(authService.clearAuthToken).toHaveBeenCalled();
      expect(authService.loginWithToken).not.toHaveBeenCalled();
      expect(spectator.inject(Router).navigateByUrl).not.toHaveBeenCalled();
    });

    it('should call "loginWithToken" if queryToken is not null', () => {
      isTokenWithinTimeline$.next(false);
      const token = 'token';
      const activatedRoute = spectator.inject(ActivatedRoute);
      jest.spyOn(activatedRoute.snapshot.queryParamMap, 'get').mockImplementationOnce(() => token);
      spectator.service.init();
      expect(authService.setQueryToken).toHaveBeenCalledWith(token);
      expect(authService.loginWithToken).toHaveBeenCalled();
    });
  });
});
