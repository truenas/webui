import {
  createServiceFactory,
  mockProvider,
  SpectatorService,
} from '@ngneat/spectator/jest';
import { of } from 'rxjs';
import { mockApi, mockCall } from 'app/core/testing/utils/mock-api.utils';
import { mockWindow } from 'app/core/testing/utils/mock-window.utils';
import {
  TruenasConnectStatus,
  TruenasConnectStatusReason,
} from 'app/enums/truenas-connect-status.enum';
import { WINDOW } from 'app/helpers/window.helper';
import { TruenasConnectConfig } from 'app/interfaces/truenas-connect-config.interface';
import { TruenasConnectService } from 'app/modules/truenas-connect/services/truenas-connect.service';
import { ApiService } from 'app/modules/websocket/api.service';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';
import { WebSocketStatusService } from 'app/services/websocket-status.service';

describe('TruenasConnectService', () => {
  let spectator: SpectatorService<TruenasConnectService>;
  const config: TruenasConnectConfig = {
    id: 1,
    ips: [''],
    interfaces: [],
    interfaces_ips: [],
    use_all_interfaces: true,
    enabled: true,
    tnc_base_url: 'https://tnc-test.ixsystems.com',
    account_service_base_url: 'https://account-service-test.ixsystems.com',
    leca_service_base_url: 'https://leca-test.ixsystems.com',
    heartbeat_url: 'https://heartbeat-test.ixsystems.com',
    status: TruenasConnectStatus.Configured,
    status_reason: TruenasConnectStatusReason[TruenasConnectStatus.Configured],
    registration_details: {
      scopes: [],
      account_id: '',
      system_id: '',
      account_name: '',
      exp: 0,
      iat: 0,
      iss: '',
    },
    certificate: 0,
  };
  const url
    = 'https://tnc.ixsystems.net/en/#/auth/login?redirectUrl=%2Fsystem%2Fregister%3Fversion%3D25.10.0-MASTER-20250409-224807%26model%3DUNKNOWN%26system_id%3D249cdb8d-5bfc-49f0-981b-f2184eb7992e%26token%3Deb48fa51-6e6e-4f4f-ab30-976bb209bfa6';
  const createService = createServiceFactory({
    service: TruenasConnectService,
    providers: [
      mockApi([
        mockCall('tn_connect.config', config),
        mockCall('tn_connect.update', {
          ...config,
          status: TruenasConnectStatus.Disabled,
        }),
        mockCall('tn_connect.generate_claim_token'),
        mockCall('tn_connect.get_registration_uri', url),
      ]),
      mockWindow({
        open: jest.fn(),
      }),
      mockProvider(ErrorHandlerService, {
        withErrorHandler: jest.fn().mockReturnValue((source: unknown) => source),
      }),
      mockProvider(WebSocketStatusService, {
        isAuthenticated$: of(true),
      }),
    ],
  });

  beforeEach(() => {
    spectator = createService();
  });

  it('should disable a tnc service', () => {
    const errorHandler = spectator.inject(ErrorHandlerService);
    spectator.service.disableService().subscribe();
    expect(spectator.inject(ApiService).call).toHaveBeenCalledWith(
      'tn_connect.update',
      [{
        enabled: false,
      }],
    );
    expect(errorHandler.withErrorHandler).toHaveBeenCalled();
  });

  it('should enable a tnc service', () => {
    const errorHandler = spectator.inject(ErrorHandlerService);
    spectator.service.enableService().subscribe();
    expect(spectator.inject(ApiService).call).toHaveBeenCalledWith(
      'tn_connect.update',
      [{
        enabled: true,
      }],
    );
    expect(errorHandler.withErrorHandler).toHaveBeenCalled();
  });

  it('should generate claim_token', () => {
    const errorHandler = spectator.inject(ErrorHandlerService);
    spectator.service.generateToken().subscribe();
    expect(spectator.inject(ApiService).call).toHaveBeenCalledWith(
      'tn_connect.generate_claim_token',
    );
    expect(errorHandler.withErrorHandler).toHaveBeenCalled();
  });

  it('should connect to TNC and open new window', () => {
    const windowMock = spectator.inject(WINDOW) as unknown as jest.Mocked<Window>;
    const errorHandler = spectator.inject(ErrorHandlerService);

    // Mock a new window object
    const mockTncWindow = {
      closed: false,
      location: { href: '' },
      focus: jest.fn(),
    };
    windowMock.open = jest.fn().mockReturnValue(mockTncWindow);

    spectator.service.connect().subscribe();

    expect(spectator.inject(ApiService).call).toHaveBeenCalledWith(
      'tn_connect.get_registration_uri',
    );
    expect(windowMock.open).toHaveBeenCalledWith(
      url,
      'TrueNAS Connect',
      'menubar=yes,location=yes,resizable=yes,scrollbars=yes,status=yes',
    );
    expect(mockTncWindow.focus).toHaveBeenCalled();
    expect(errorHandler.withErrorHandler).toHaveBeenCalled();
  });

  it('should navigate existing window to new URL when connecting again', () => {
    const windowMock = spectator.inject(WINDOW) as unknown as jest.Mocked<Window>;

    // Mock an existing window object that's still open
    const mockTncWindow = {
      closed: false,
      location: { href: '' },
      focus: jest.fn(),
    };
    windowMock.open = jest.fn().mockReturnValue(mockTncWindow);

    // First connection - should open new window
    const firstUrl = 'https://first-url.com';
    spectator.service.openTruenasConnectWindow(firstUrl);
    expect(windowMock.open).toHaveBeenCalledTimes(1);
    expect(windowMock.open).toHaveBeenCalledWith(
      firstUrl,
      'TrueNAS Connect',
      'menubar=yes,location=yes,resizable=yes,scrollbars=yes,status=yes',
    );
    expect(mockTncWindow.focus).toHaveBeenCalledTimes(1);

    // Reset focus mock to test the second call
    mockTncWindow.focus.mockClear();

    // Second connection - should navigate existing window to new URL
    const secondUrl = 'https://second-url.com';
    spectator.service.openTruenasConnectWindow(secondUrl);

    // Should call open again with the new URL, which navigates the existing window
    expect(windowMock.open).toHaveBeenCalledTimes(2);
    expect(windowMock.open).toHaveBeenNthCalledWith(
      2,
      secondUrl,
      'TrueNAS Connect',
      'menubar=yes,location=yes,resizable=yes,scrollbars=yes,status=yes',
    );
    expect(mockTncWindow.focus).toHaveBeenCalledTimes(1);
  });

  it('should open window using openWindow public method', () => {
    const windowMock = spectator.inject(WINDOW) as unknown as jest.Mocked<Window>;
    const mockTncWindow = {
      closed: false,
      location: { href: '' },
      focus: jest.fn(),
    };
    windowMock.open = jest.fn().mockReturnValue(mockTncWindow);

    const testUrl = 'https://test-url.com';
    spectator.service.openTruenasConnectWindow(testUrl);

    expect(windowMock.open).toHaveBeenCalledWith(
      testUrl,
      'TrueNAS Connect',
      'menubar=yes,location=yes,resizable=yes,scrollbars=yes,status=yes',
    );
    expect(mockTncWindow.focus).toHaveBeenCalled();
  });

  it('should test getConfig method', () => {
    expect(spectator.service.config()).toEqual(config);
    expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('tn_connect.config');
    expect(spectator.inject(ApiService).subscribe).toHaveBeenCalledWith('tn_connect.config');
  });
});
