import { Router } from '@angular/router';
import { createServiceFactory, SpectatorService } from '@ngneat/spectator';
import { mockProvider } from '@ngneat/spectator/jest';
import {
  BehaviorSubject, firstValueFrom, of,
} from 'rxjs';
import { MockWebsocketService } from 'app/core/testing/classes/mock-websocket.service';
import { mockCall, mockWebsocket } from 'app/core/testing/utils/mock-websocket.utils';
import { FailoverDisabledReason } from 'app/enums/failover-disabled-reason.enum';
import { FailoverStatus } from 'app/enums/failover-status.enum';
import { WINDOW } from 'app/helpers/window.helper';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { SigninStore } from 'app/views/sessions/signin/store/signin.store';

describe('SigninStore', () => {
  let spectator: SpectatorService<SigninStore>;
  let websocket: MockWebsocketService;

  const createService = createServiceFactory({
    service: SigninStore,
    providers: [
      mockWebsocket([
        mockCall('auth.generate_token', 'AUTH_TOKEN'),
        mockCall('user.has_root_password', true),
        mockCall('failover.status', FailoverStatus.Single),
        mockCall('failover.get_ips', ['123.23.44.54']),
        mockCall('failover.disabled.reasons', [FailoverDisabledReason.NoLicense]),
      ]),
      mockProvider(Router),
      mockProvider(SnackbarService),
      {
        provide: WINDOW,
        useValue: {
          sessionStorage: {
            getItem: jest.fn(),
          },
        },
      },
    ],
  });

  beforeEach(() => {
    spectator = createService();
    websocket = spectator.inject(MockWebsocketService);
    // This strips @LocalStorage() decorator from token.
    Object.defineProperty(websocket, 'token', {
      value: '',
      writable: true,
    });
    websocket.isConnected$ = new BehaviorSubject(true);
    jest.spyOn(websocket, 'loginToken').mockReturnValue(of(true));
  });

  describe('selectors', () => {
    const failover = {
      status: FailoverStatus.Error,
      ips: ['23.234.124.123'],
      disabledReasons: [FailoverDisabledReason.NoPong, FailoverDisabledReason.NoLicense],
    };
    beforeEach(() => {
      spectator.service.setState({
        failover,
        hasRootPassword: true,
        isLoading: false,
      });
    });

    it('hasRootPassword$', async () => {
      expect(await firstValueFrom(spectator.service.hasRootPassword$)).toBe(true);
    });

    it('failover$', async () => {
      expect(await firstValueFrom(spectator.service.failover$)).toBe(failover);
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

      expect(websocket.call).toHaveBeenCalledWith('user.has_root_password');
      expect(websocket.call).toHaveBeenCalledWith('failover.status');

      expect(await firstValueFrom(spectator.service.state$)).toEqual({
        hasRootPassword: true,
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
        hasRootPassword: true,
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

      expect(websocket.loginToken).toHaveBeenCalledWith('EXISTING_TOKEN');
      expect(spectator.inject(Router).navigateByUrl).toHaveBeenCalledWith('/dashboard');
    });
  });

  describe('methods', () => {

  });

  describe('getRedirectUrl', () => {

  });
});
