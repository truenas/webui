import { createServiceFactory, mockProvider, SpectatorService } from '@ngneat/spectator/jest';
import { TranslateService } from '@ngx-translate/core';
import { firstValueFrom, of } from 'rxjs';
import { mockCall, mockApi } from 'app/core/testing/utils/mock-api.utils';
import { TruenasConnectStatus } from 'app/enums/truenas-connect-status.enum';
import { WINDOW } from 'app/helpers/window.helper';
import { TruenasConnectConfig } from 'app/interfaces/truenas-connect-config.interface';
import { WebShare } from 'app/interfaces/webshare-config.interface';
import { FormSidePanelService } from 'app/modules/slide-ins/form-side-panel/form-side-panel.service';
import { SlideInResult } from 'app/modules/slide-ins/slide-in-result';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { TruenasConnectService } from 'app/modules/truenas-connect/services/truenas-connect.service';
import { ApiService } from 'app/modules/websocket/api.service';
import { WebShareSharesFormComponent } from 'app/pages/sharing/webshare/webshare-shares-form/webshare-shares-form.component';
import { LicenseService } from 'app/services/license.service';
import { WebShareService } from './webshare.service';

describe('WebShareService', () => {
  let spectator: SpectatorService<WebShareService>;

  const mockWebShares: WebShare[] = [
    { id: 1, name: 'documents', path: '/mnt/tank/documents' },
    { id: 2, name: 'media', path: '/mnt/tank/media' },
  ];

  const configuredConfig = { status: TruenasConnectStatus.Configured } as unknown as TruenasConnectConfig;

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
        config: () => configuredConfig,
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
      mockProvider(TruenasConnectService),
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
      mockProvider(TruenasConnectService),
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
      mockProvider(TruenasConnectService),
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
        config: () => ({ status: TruenasConnectStatus.Disabled } as unknown as TruenasConnectConfig),
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
