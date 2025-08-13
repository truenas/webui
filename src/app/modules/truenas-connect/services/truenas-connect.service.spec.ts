import {
  createServiceFactory,
  mockProvider,
  SpectatorService,
} from '@ngneat/spectator/jest';
import { mockApi, mockCall } from 'app/core/testing/utils/mock-api.utils';
import { mockWindow } from 'app/core/testing/utils/mock-window.utils';
import {
  TruenasConnectStatus,
  TruenasConnectStatusReason,
} from 'app/enums/truenas-connect-status.enum';
import { WINDOW } from 'app/helpers/window.helper';
import { TruenasConnectConfig } from 'app/interfaces/truenas-connect-config.interface';
import { TruenasConnectService, resetGlobalTruenasConnectWindow } from 'app/modules/truenas-connect/services/truenas-connect.service';
import { ApiService } from 'app/modules/websocket/api.service';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';

describe('TruenasConnectService', () => {
  let spectator: SpectatorService<TruenasConnectService>;
  const config: TruenasConnectConfig = {
    id: 1,
    ips: [''],
    interfaces_ips: [],
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
    ],
  });

  beforeEach(() => {
    spectator = createService();
    // Reset global window reference for clean test state
    resetGlobalTruenasConnectWindow();
  });

  it('should disable a tnc service', () => {
    const errorHandler = spectator.inject(ErrorHandlerService);
    spectator.service.config.set(config);
    spectator.service.disableService().subscribe();
    expect(spectator.inject(ApiService).call).toHaveBeenCalledWith(
      'tn_connect.update',
      [{ enabled: false }],
    );
    expect(errorHandler.withErrorHandler).toHaveBeenCalled();
  });

  it('should throw error when config is null in disableService', () => {
    spectator.service.config.set(null);
    expect(() => spectator.service.disableService()).toThrow('Truenas Connect config is not available');
  });

  it('should enable a tnc service', () => {
    const errorHandler = spectator.inject(ErrorHandlerService);
    spectator.service.config.set(config);
    spectator.service.enableService().subscribe();
    expect(spectator.inject(ApiService).call).toHaveBeenCalledWith(
      'tn_connect.update',
      [{ enabled: true }],
    );
    expect(errorHandler.withErrorHandler).toHaveBeenCalled();
  });

  it('should throw error when config is null in enableService', () => {
    spectator.service.config.set(null);
    expect(() => spectator.service.enableService()).toThrow('Truenas Connect config is not available');
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
      'TrueNASConnect',
      'menubar=yes,location=yes,resizable=yes,scrollbars=yes,status=yes',
    );
    expect(mockTncWindow.focus).toHaveBeenCalled();
    expect(errorHandler.withErrorHandler).toHaveBeenCalled();
  });

  it('should reuse existing window when connecting again', () => {
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
    spectator.service.openWindow(firstUrl);
    expect(windowMock.open).toHaveBeenCalledTimes(1);
    expect(windowMock.open).toHaveBeenCalledWith(
      firstUrl,
      'TrueNASConnect',
      'menubar=yes,location=yes,resizable=yes,scrollbars=yes,status=yes',
    );
    expect(mockTncWindow.focus).toHaveBeenCalledTimes(1);

    // Reset focus mock to test the second call
    mockTncWindow.focus.mockClear();

    // Second connection - should reuse existing window with empty URL (focus only)
    const secondUrl = 'https://second-url.com';
    spectator.service.openWindow(secondUrl);

    // Should call open again but with empty URL for focus only
    expect(windowMock.open).toHaveBeenCalledTimes(2);
    expect(windowMock.open).toHaveBeenNthCalledWith(2, '', 'TrueNASConnect');
    expect(mockTncWindow.focus).toHaveBeenCalledTimes(1); // Called once in the second attempt
    // URL should NOT be changed - no navigation
    expect(mockTncWindow.location.href).toBe(''); // Original URL unchanged
  });

  it('should open new window when existing window is closed', () => {
    const windowMock = spectator.inject(WINDOW) as unknown as jest.Mocked<Window>;

    // Mock an existing window object that's closed
    const mockClosedWindow = {
      closed: true,
      location: { href: '' },
      focus: jest.fn(),
    };

    // Mock a new window object
    const mockNewWindow = {
      closed: false,
      location: { href: '' },
      focus: jest.fn(),
    };

    windowMock.open = jest.fn()
      .mockReturnValueOnce(mockClosedWindow)
      .mockReturnValueOnce(mockNewWindow);

    // First connection - open window
    const firstUrl = 'https://first-url.com';
    spectator.service.openWindow(firstUrl);
    expect(windowMock.open).toHaveBeenCalledTimes(1);

    // Simulate window being closed
    mockClosedWindow.closed = true;

    // Second connection - should open new window since previous is closed
    const secondUrl = 'https://second-url.com';
    spectator.service.openWindow(secondUrl);

    // Should open new window since previous was closed
    expect(windowMock.open).toHaveBeenCalledTimes(2);
    expect(windowMock.open).toHaveBeenLastCalledWith(
      secondUrl,
      'TrueNASConnect',
      'menubar=yes,location=yes,resizable=yes,scrollbars=yes,status=yes',
    );
    expect(mockNewWindow.focus).toHaveBeenCalled();
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
    spectator.service.openWindow(testUrl);

    expect(windowMock.open).toHaveBeenCalledWith(
      testUrl,
      'TrueNASConnect',
      'menubar=yes,location=yes,resizable=yes,scrollbars=yes,status=yes',
    );
    expect(mockTncWindow.focus).toHaveBeenCalled();
  });

  it('should not reload page when navigating to same URL in existing window', () => {
    const windowMock = spectator.inject(WINDOW) as unknown as jest.Mocked<Window>;
    const sameUrl = 'https://same-url.com';

    // Mock an existing window object that's already on the target URL
    const mockTncWindow = {
      closed: false,
      location: { href: sameUrl },
      focus: jest.fn(),
    };
    windowMock.open = jest.fn().mockReturnValue(mockTncWindow);

    // First connection - open window
    spectator.service.openWindow(sameUrl);
    expect(windowMock.open).toHaveBeenCalledTimes(1);

    // Reset focus mock and location.href setter
    mockTncWindow.focus.mockClear();
    const originalHref = mockTncWindow.location.href;

    // Second connection with same URL - should only focus, not navigate
    spectator.service.openWindow(sameUrl);

    // Should call open again with empty URL (focus only) and not change location
    expect(windowMock.open).toHaveBeenCalledTimes(2); // Called twice: first with URL, second with empty
    expect(windowMock.open).toHaveBeenNthCalledWith(2, '', 'TrueNASConnect');
    expect(mockTncWindow.focus).toHaveBeenCalledTimes(1);
    expect(mockTncWindow.location.href).toBe(originalHref); // URL unchanged
  });

  it('should focus existing window without navigation even with different URL', () => {
    const windowMock = spectator.inject(WINDOW) as unknown as jest.Mocked<Window>;
    const firstUrl = 'https://first-url.com';
    const secondUrl = 'https://second-url.com';

    // Mock an existing window object
    const mockTncWindow = {
      closed: false,
      location: { href: firstUrl },
      focus: jest.fn(),
    };
    windowMock.open = jest.fn().mockReturnValue(mockTncWindow);

    // First connection
    spectator.service.openWindow(firstUrl);
    expect(windowMock.open).toHaveBeenCalledTimes(1);

    // Reset focus mock
    mockTncWindow.focus.mockClear();

    // Second connection with different URL - should only focus, no navigation
    spectator.service.openWindow(secondUrl);

    // Should call open with empty URL (focus only) and not navigate
    expect(windowMock.open).toHaveBeenCalledTimes(2); // Called twice: first with URL, second with empty
    expect(windowMock.open).toHaveBeenNthCalledWith(2, '', 'TrueNASConnect');
    expect(mockTncWindow.focus).toHaveBeenCalledTimes(1);
    expect(mockTncWindow.location.href).toBe(firstUrl); // URL unchanged - stays at original
  });

  it('should test getConfig method', () => {
    expect(spectator.service.config()).toEqual(config);
    expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('tn_connect.config');
    expect(spectator.inject(ApiService).subscribe).toHaveBeenCalledWith('tn_connect.config');
  });
});
