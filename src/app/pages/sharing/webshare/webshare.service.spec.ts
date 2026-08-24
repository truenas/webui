import { signal } from '@angular/core';
import { createServiceFactory, mockProvider, SpectatorService } from '@ngneat/spectator/jest';
import { provideMockStore } from '@ngrx/store/testing';
import { TranslateService } from '@ngx-translate/core';
import { firstValueFrom, of, throwError } from 'rxjs';
import { MockApiService } from 'app/core/testing/classes/mock-api.service';
import { mockCall, mockApi } from 'app/core/testing/utils/mock-api.utils';
import { CollectionChangeType } from 'app/enums/api.enum';
import { ServiceName } from 'app/enums/service-name.enum';
import { ServiceStatus } from 'app/enums/service-status.enum';
import { TruenasConnectStatus } from 'app/enums/truenas-connect-status.enum';
import { WINDOW } from 'app/helpers/window.helper';
import { Service } from 'app/interfaces/service.interface';
import { TruenasConnectConfig } from 'app/interfaces/truenas-connect-config.interface';
import { User } from 'app/interfaces/user.interface';
import { WebShare } from 'app/interfaces/webshare-config.interface';
import { FormSidePanelService } from 'app/modules/slide-ins/form-side-panel/form-side-panel.service';
import { SlideInResult } from 'app/modules/slide-ins/slide-in-result';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { TruenasConnectService } from 'app/modules/truenas-connect/services/truenas-connect.service';
import { ApiService } from 'app/modules/websocket/api.service';
import { WebShareSharesFormComponent } from 'app/pages/sharing/webshare/webshare-shares-form/webshare-shares-form.component';
import { LicenseService } from 'app/services/license.service';
import { selectServices } from 'app/store/services/services.selectors';
import { WebShareService } from './webshare.service';

const mockConfiguredTncConfig = {
  status: TruenasConnectStatus.Configured,
} as TruenasConnectConfig;

const mockRunningWebshareService = {
  service: ServiceName.WebShare,
  state: ServiceStatus.Running,
} as Service;

const mockStoreWithRunningService = provideMockStore({
  selectors: [
    { selector: selectServices, value: [mockRunningWebshareService] },
  ],
});

describe('WebShareService', () => {
  let spectator: SpectatorService<WebShareService>;

  const mockWebShares: WebShare[] = [
    { id: 1, name: 'documents', path: '/mnt/tank/documents' },
    { id: 2, name: 'media', path: '/mnt/tank/media' },
  ];

  const mockWindow = {
    location: {
      protocol: 'https:',
      hostname: 'mynas.truenas.direct',
    },
    open: jest.fn(),
  };

  const createService = createServiceFactory({
    service: WebShareService,
    providers: [
      mockApi([
        mockCall('sharing.webshare.query', mockWebShares),
        mockCall('tn_connect.ips_with_hostnames', {}),
        mockCall('interface.websocket_local_ip', '192.168.1.100'),
      ]),
      mockProvider(SnackbarService),
      mockProvider(TranslateService, {
        instant: jest.fn((key: string) => key),
      }),
      mockProvider(LicenseService, {
        hasTruenasConnect$: of(true),
      }),
      mockProvider(FormSidePanelService, {
        open: jest.fn(() => SlideInResult.empty()),
      }),
      mockProvider(TruenasConnectService, {
        openStatusModal: jest.fn(),
        config: signal(mockConfiguredTncConfig),
      }),
      mockStoreWithRunningService,
      {
        provide: WINDOW,
        useValue: mockWindow,
      },
    ],
  });

  beforeEach(() => {
    spectator = createService();
    jest.clearAllMocks();
  });

  describe('isTruenasDirectDomain', () => {
    it('should return true when hostname contains .truenas.direct', () => {
      expect(spectator.service.isTruenasDirectDomain).toBe(true);
    });
  });

  describe('openWebShare', () => {
    it('should open WebShare root listing in new window when no shareName provided', () => {
      spectator.service.openWebShare();

      expect(mockWindow.open).toHaveBeenCalledWith(
        'https://mynas.truenas.direct:755/webshare/',
        '_blank',
      );
    });

    it('should open specific WebShare in new window when shareName provided', () => {
      spectator.service.openWebShare('documents');

      expect(mockWindow.open).toHaveBeenCalledWith(
        'https://mynas.truenas.direct:755/webshare/documents',
        '_blank',
      );
    });

    it('should show error snackbar when popup is blocked', () => {
      mockWindow.open.mockReturnValue(null);
      const snackbar = spectator.inject(SnackbarService);

      spectator.service.openWebShare();

      expect(snackbar.error).toHaveBeenCalledWith(
        "Unable to open WebShare. Please check your browser's popup blocker settings.",
      );
    });

    it('should not show error snackbar when popup opens successfully', () => {
      mockWindow.open.mockReturnValue({});
      const snackbar = spectator.inject(SnackbarService);

      spectator.service.openWebShare();

      expect(snackbar.error).not.toHaveBeenCalled();
    });
  });

  describe('openWebShareForm', () => {
    it('should open form when TrueNAS Connect is configured', () => {
      const formPanel = spectator.inject(FormSidePanelService);
      const formData = { isNew: true, name: '', path: '' };

      spectator.service.openWebShareForm(formData).subscribe((result) => {
        expect(result).toBe(true);
      });

      expect(formPanel.open).toHaveBeenCalledWith(WebShareSharesFormComponent, {
        title: 'Add WebShare',
        inputs: { webShareData: formData },
      });
    });


    it('should return false when form is cancelled', () => {
      const formPanel = spectator.inject(FormSidePanelService);
      jest.spyOn(formPanel, 'open').mockReturnValue(SlideInResult.cancel());

      const formData = { isNew: true, name: '', path: '' };

      spectator.service.openWebShareForm(formData).subscribe((result) => {
        expect(result).toBe(false);
      });
    });

    it('should pass edit data to form when editing', () => {
      const formPanel = spectator.inject(FormSidePanelService);
      const formData = {
        isNew: false,
        id: 1,
        name: 'documents',
        path: '/mnt/tank/documents',
      };

      spectator.service.openWebShareForm(formData).subscribe();

      expect(formPanel.open).toHaveBeenCalledWith(WebShareSharesFormComponent, {
        title: 'Edit WebShare',
        inputs: { webShareData: formData },
      });
    });
  });

  describe('getWebShareTableRows', () => {
    it('should fetch and transform WebShare data', async () => {
      const rows = await new Promise<{ id: number; name: string; path: string }[]>((resolve) => {
        spectator.service.getWebShareTableRows().subscribe((result) => {
          resolve(result);
        });
      });

      expect(rows).toEqual([
        {
          id: 1, name: 'documents', path: '/mnt/tank/documents', isHomeBase: false,
        },
        {
          id: 2, name: 'media', path: '/mnt/tank/media', isHomeBase: false,
        },
      ]);

      const api = spectator.inject(ApiService);
      expect(api.call).toHaveBeenCalledWith('sharing.webshare.query', [[]]);
    });
  });

  describe('transformToTableRows', () => {
    it('should transform WebShare objects to table row format', () => {
      const shares = [
        { id: 1, name: 'share1', path: '/mnt/pool/share1' },
        { id: 2, name: 'share2', path: '/mnt/pool/share2' },
      ];

      const result = spectator.service.transformToTableRows(shares);

      expect(result).toEqual([
        {
          id: 1, name: 'share1', path: '/mnt/pool/share1', isHomeBase: false,
        },
        {
          id: 2, name: 'share2', path: '/mnt/pool/share2', isHomeBase: false,
        },
      ]);
    });

    it('should return empty array for empty input', () => {
      const result = spectator.service.transformToTableRows([]);
      expect(result).toEqual([]);
    });
  });

  describe('hasWebshareUsers$', () => {
    it('re-queries webshare users when a user.query collection event arrives', () => {
      const api = spectator.inject(MockApiService);
      api.mockCall('user.query', []);

      const emissions: boolean[] = [];
      const subscription = spectator.service.hasWebshareUsers$.subscribe((value) => emissions.push(value));

      expect(api.call).toHaveBeenCalledWith('user.query', [[['webshare', '=', true], ['local', '=', true]]]);

      api.mockCall('user.query', [{ id: 1, username: 'bob', webshare: true } as User]);
      api.emitSubscribeEvent({
        id: 'test-id-1',
        msg: CollectionChangeType.Added,
        collection: 'user.query',
        fields: null,
      });

      expect(emissions).toEqual([false, true]);
      subscription.unsubscribe();
    });
  });
});

describe('WebShareService - user.query subscription error', () => {
  let spectator: SpectatorService<WebShareService>;

  const createService = createServiceFactory({
    service: WebShareService,
    providers: [
      mockProvider(ApiService, {
        subscribe: jest.fn(() => throwError(() => new Error('subscription failed'))),
        call: jest.fn(() => of([])),
      }),
      mockProvider(SnackbarService),
      mockProvider(TranslateService),
      mockProvider(LicenseService),
      mockProvider(FormSidePanelService),
      mockProvider(TruenasConnectService, {
        config: signal(mockConfiguredTncConfig),
      }),
      mockStoreWithRunningService,
      {
        provide: WINDOW,
        useValue: {
          location: {
            protocol: 'https:',
            hostname: 'mynas.truenas.direct',
          },
          open: jest.fn(),
        },
      },
    ],
  });

  beforeEach(() => {
    spectator = createService();
  });

  it('emits false instead of erroring when the user.query subscription errors', () => {
    const emissions: boolean[] = [];
    let streamError: unknown;
    spectator.service.hasWebshareUsers$.subscribe({
      next: (value) => emissions.push(value),
      error: (error: unknown) => streamError = error,
    });

    expect(streamError).toBeUndefined();
    expect(emissions.at(-1)).toBe(false);
  });
});

describe('WebShareService - non-TrueNAS Direct domain', () => {
  let spectator: SpectatorService<WebShareService>;

  const createService = createServiceFactory({
    service: WebShareService,
    providers: [
      mockApi([
        mockCall('tn_connect.ips_with_hostnames', {}),
        mockCall('interface.websocket_local_ip', '192.168.1.100'),
      ]),
      mockProvider(SnackbarService),
      mockProvider(TranslateService),
      mockProvider(LicenseService),
      mockProvider(FormSidePanelService),
      mockProvider(TruenasConnectService, {
        config: signal(mockConfiguredTncConfig),
      }),
      mockStoreWithRunningService,
      {
        provide: WINDOW,
        useValue: {
          location: {
            protocol: 'https:',
            hostname: 'localhost',
          },
          open: jest.fn(),
        },
      },
    ],
  });

  beforeEach(() => {
    spectator = createService();
  });

  it('should return false for isTruenasDirectDomain when hostname does not contain .truenas.direct', () => {
    expect(spectator.service.isTruenasDirectDomain).toBe(false);
  });
});

describe('WebShareService - hostname mapping', () => {
  let spectator: SpectatorService<WebShareService>;

  const mockWindow = {
    location: {
      protocol: 'https:',
      hostname: '192.168.1.100',
    },
    open: jest.fn(),
  };

  const createService = createServiceFactory({
    service: WebShareService,
    providers: [
      mockApi([
        mockCall('tn_connect.ips_with_hostnames', {
          '192.168.1.100': 'mynas.truenas.direct',
          '10.0.0.5': 'other.truenas.direct',
        }),
        mockCall('interface.websocket_local_ip', '192.168.1.100'),
      ]),
      mockProvider(SnackbarService),
      mockProvider(TranslateService, {
        instant: jest.fn((key: string) => key),
      }),
      mockProvider(LicenseService, {
        hasTruenasConnect$: of(true),
      }),
      mockProvider(FormSidePanelService),
      mockProvider(TruenasConnectService, {
        config: signal(mockConfiguredTncConfig),
      }),
      mockStoreWithRunningService,
      {
        provide: WINDOW,
        useValue: mockWindow,
      },
    ],
  });

  beforeEach(() => {
    spectator = createService();
    jest.clearAllMocks();
  });

  it('should resolve hostname from IP mapping', async () => {
    const result = await firstValueFrom(spectator.service.hostnameMapping$);

    expect(result.hostname).toBe('mynas.truenas.direct');
    expect(result.localIp).toBe('192.168.1.100');
  });

  it('should set canOpenWebShare to true when hostname is resolved', async () => {
    await firstValueFrom(spectator.service.hostnameMapping$);

    expect(spectator.service.canOpenWebShare()).toBe(true);
  });

  it('should open WebShare using resolved hostname', async () => {
    await firstValueFrom(spectator.service.hostnameMapping$);

    spectator.service.openWebShare('documents');

    expect(mockWindow.open).toHaveBeenCalledWith(
      'https://mynas.truenas.direct:755/webshare/documents',
      '_blank',
    );
  });
});

describe('WebShareService - no hostname mapping', () => {
  let spectator: SpectatorService<WebShareService>;

  const mockWindow = {
    location: {
      protocol: 'https:',
      hostname: '10.0.0.99',
    },
    open: jest.fn(),
  };

  const createService = createServiceFactory({
    service: WebShareService,
    providers: [
      mockApi([
        mockCall('tn_connect.ips_with_hostnames', {
          '192.168.1.100': 'mynas.truenas.direct',
        }),
        mockCall('interface.websocket_local_ip', '10.0.0.99'),
      ]),
      mockProvider(SnackbarService),
      mockProvider(TranslateService, {
        instant: jest.fn((key: string) => key),
      }),
      mockProvider(LicenseService, {
        hasTruenasConnect$: of(true),
      }),
      mockProvider(FormSidePanelService),
      mockProvider(TruenasConnectService, {
        config: signal(mockConfiguredTncConfig),
      }),
      mockStoreWithRunningService,
      {
        provide: WINDOW,
        useValue: mockWindow,
      },
    ],
  });

  beforeEach(() => {
    spectator = createService();
    jest.clearAllMocks();
  });

  it('should not resolve hostname when local IP is not in mapping', async () => {
    const result = await firstValueFrom(spectator.service.hostnameMapping$);

    expect(result.hostname).toBeUndefined();
  });

  it('should keep canOpenWebShare as false when no hostname is resolved', async () => {
    await firstValueFrom(spectator.service.hostnameMapping$);

    expect(spectator.service.canOpenWebShare()).toBe(false);
  });

  it('should expose the domain reason when TrueNAS Connect is configured but no hostname resolves', async () => {
    await firstValueFrom(spectator.service.hostnameMapping$);

    expect(spectator.service.webShareUnavailableReason()).toBe(
      'WebShare can only be opened when accessed via a .truenas.direct domain',
    );
  });
});

describe('WebShareService - TrueNAS Connect disabled', () => {
  let spectator: SpectatorService<WebShareService>;

  const mockWindow = {
    location: {
      protocol: 'https:',
      hostname: 'mynas.truenas.direct',
    },
    open: jest.fn(),
  };

  const createService = createServiceFactory({
    service: WebShareService,
    providers: [
      mockApi([
        mockCall('tn_connect.ips_with_hostnames', {}),
        mockCall('interface.websocket_local_ip', '192.168.1.100'),
      ]),
      mockProvider(SnackbarService),
      mockProvider(TranslateService, {
        instant: jest.fn((key: string) => key),
      }),
      mockProvider(LicenseService, {
        hasTruenasConnect$: of(false),
      }),
      mockProvider(FormSidePanelService),
      mockProvider(TruenasConnectService, {
        config: signal({ status: TruenasConnectStatus.Disabled } as TruenasConnectConfig),
      }),
      mockStoreWithRunningService,
      {
        provide: WINDOW,
        useValue: mockWindow,
      },
    ],
  });

  beforeEach(() => {
    spectator = createService();
    jest.clearAllMocks();
  });

  it('should report canOpenWebShare as false even on a truenas.direct domain', () => {
    expect(spectator.service.canOpenWebShare()).toBe(false);
  });

  it('should expose the TrueNAS Connect disabled reason rather than a domain reason', () => {
    expect(spectator.service.webShareUnavailableReason()).toBe(
      'WebShare is unavailable because TrueNAS Connect is disabled.',
    );
  });

  it('should not open a WebShare window and shows an error when TrueNAS Connect is disabled', () => {
    const snackbar = spectator.inject(SnackbarService);

    spectator.service.openWebShare('documents');

    expect(mockWindow.open).not.toHaveBeenCalled();
    expect(snackbar.error).toHaveBeenCalledWith(
      'WebShare is unavailable because TrueNAS Connect is disabled.',
    );
  });
});

describe('WebShareService - TrueNAS Connect not configured', () => {
  let spectator: SpectatorService<WebShareService>;

  const mockWindow = {
    location: {
      protocol: 'https:',
      hostname: 'mynas.truenas.direct',
    },
    open: jest.fn(),
  };

  const createService = createServiceFactory({
    service: WebShareService,
    providers: [
      mockApi([
        mockCall('tn_connect.ips_with_hostnames', {}),
        mockCall('interface.websocket_local_ip', '192.168.1.100'),
      ]),
      mockProvider(SnackbarService),
      mockProvider(TranslateService, {
        instant: jest.fn((key: string) => key),
      }),
      mockProvider(LicenseService, {
        hasTruenasConnect$: of(false),
      }),
      mockProvider(FormSidePanelService, {
        open: jest.fn(() => SlideInResult.empty()),
      }),
      mockProvider(TruenasConnectService, {
        openStatusModal: jest.fn(),
        config: signal({ status: TruenasConnectStatus.Disabled } as unknown as TruenasConnectConfig),
      }),
      mockStoreWithRunningService,
      {
        provide: WINDOW,
        useValue: mockWindow,
      },
    ],
  });

  beforeEach(() => {
    spectator = createService();
    jest.clearAllMocks();
  });

  it('should open TrueNAS Connect status modal when not configured', () => {
    const truenasConnectService = spectator.inject(TruenasConnectService);
    const formPanel = spectator.inject(FormSidePanelService);
    const formData = { isNew: true, name: '', path: '' };

    spectator.service.openWebShareForm(formData).subscribe((result) => {
      expect(result).toBe(false);
    });

    expect(truenasConnectService.openStatusModal).toHaveBeenCalled();
    expect(formPanel.open).not.toHaveBeenCalled();
  });
});

describe('WebShareService - WebShare service not running', () => {
  let spectator: SpectatorService<WebShareService>;

  const mockWindow = {
    location: {
      protocol: 'https:',
      hostname: 'mynas.truenas.direct',
    },
    open: jest.fn(),
  };

  const createService = createServiceFactory({
    service: WebShareService,
    providers: [
      mockApi([
        mockCall('tn_connect.ips_with_hostnames', {}),
        mockCall('interface.websocket_local_ip', '192.168.1.100'),
      ]),
      mockProvider(SnackbarService),
      mockProvider(TranslateService, {
        instant: jest.fn((key: string) => key),
      }),
      mockProvider(LicenseService, {
        hasTruenasConnect$: of(true),
      }),
      mockProvider(FormSidePanelService),
      mockProvider(TruenasConnectService, {
        config: signal(mockConfiguredTncConfig),
      }),
      provideMockStore({
        selectors: [
          {
            selector: selectServices,
            value: [{ service: ServiceName.WebShare, state: ServiceStatus.Stopped } as Service],
          },
        ],
      }),
      {
        provide: WINDOW,
        useValue: mockWindow,
      },
    ],
  });

  beforeEach(() => {
    spectator = createService();
    jest.clearAllMocks();
  });

  it('should report canOpenWebShare as false even on a truenas.direct domain', () => {
    expect(spectator.service.canOpenWebShare()).toBe(false);
  });

  it('should expose the service not running reason', () => {
    expect(spectator.service.webShareUnavailableReason()).toBe(
      'WebShare is unavailable because the WebShare service is not running.',
    );
  });

  it('should not open a WebShare window and shows an error when the service is stopped', () => {
    const snackbar = spectator.inject(SnackbarService);

    spectator.service.openWebShare('documents');

    expect(mockWindow.open).not.toHaveBeenCalled();
    expect(snackbar.error).toHaveBeenCalledWith(
      'WebShare is unavailable because the WebShare service is not running.',
    );
  });
});

describe('WebShareService - service state not loaded yet', () => {
  let spectator: SpectatorService<WebShareService>;

  const createService = createServiceFactory({
    service: WebShareService,
    providers: [
      mockApi([
        mockCall('tn_connect.ips_with_hostnames', {}),
        mockCall('interface.websocket_local_ip', '192.168.1.100'),
      ]),
      mockProvider(SnackbarService),
      mockProvider(TranslateService, {
        instant: jest.fn((key: string) => key),
      }),
      mockProvider(LicenseService, {
        hasTruenasConnect$: of(true),
      }),
      mockProvider(FormSidePanelService),
      mockProvider(TruenasConnectService, {
        config: signal(mockConfiguredTncConfig),
      }),
      provideMockStore({
        selectors: [
          // Services slice not loaded (or service.query failed): no entries.
          { selector: selectServices, value: [] },
        ],
      }),
      {
        provide: WINDOW,
        useValue: {
          location: {
            protocol: 'https:',
            hostname: 'mynas.truenas.direct',
          },
          open: jest.fn(),
        },
      },
    ],
  });

  beforeEach(() => {
    spectator = createService();
    jest.clearAllMocks();
  });

  it('does not claim the service is stopped while its state is unknown', () => {
    // An unloaded slice must not flash "service is not running" on page load —
    // only a loaded entry with a non-running state produces that reason.
    expect(spectator.service.webShareUnavailableReason()).toBeNull();
    expect(spectator.service.canOpenWebShare()).toBe(true);
  });
});
