import { createServiceFactory, mockProvider, SpectatorService } from '@ngneat/spectator/jest';
import { TranslateService } from '@ngx-translate/core';
import { of } from 'rxjs';
import { mockCall, mockApi } from 'app/core/testing/utils/mock-api.utils';
import { WINDOW } from 'app/helpers/window.helper';
import { WebShare } from 'app/interfaces/webshare-config.interface';
import { SlideIn } from 'app/modules/slide-ins/slide-in';
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
      ]),
      mockProvider(SnackbarService),
      mockProvider(TranslateService, {
        instant: jest.fn((key: string) => key),
      }),
      mockProvider(LicenseService, {
        hasTruenasConnect$: of(true),
      }),
      mockProvider(SlideIn, {
        open: jest.fn(() => of({ response: true, error: null })),
      }),
      mockProvider(TruenasConnectService, {
        openStatusModal: jest.fn(),
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
      const slideIn = spectator.inject(SlideIn);
      const formData = { isNew: true, name: '', path: '' };

      spectator.service.openWebShareForm(formData).subscribe((result) => {
        expect(result).toBe(true);
      });

      expect(slideIn.open).toHaveBeenCalledWith(WebShareSharesFormComponent, {
        data: formData,
      });
    });


    it('should return false when form is cancelled', () => {
      const slideIn = spectator.inject(SlideIn);
      jest.spyOn(slideIn, 'open').mockReturnValue(of({ response: false, error: null }));

      const formData = { isNew: true, name: '', path: '' };

      spectator.service.openWebShareForm(formData).subscribe((result) => {
        expect(result).toBe(false);
      });
    });

    it('should pass edit data to form when editing', () => {
      const slideIn = spectator.inject(SlideIn);
      const formData = {
        isNew: false,
        id: 1,
        name: 'documents',
        path: '/mnt/tank/documents',
      };

      spectator.service.openWebShareForm(formData).subscribe();

      expect(slideIn.open).toHaveBeenCalledWith(WebShareSharesFormComponent, {
        data: formData,
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
      mockApi([]),
      mockProvider(SnackbarService),
      mockProvider(TranslateService),
      mockProvider(LicenseService),
      mockProvider(SlideIn),
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
      mockApi([]),
      mockProvider(SnackbarService),
      mockProvider(TranslateService, {
        instant: jest.fn((key: string) => key),
      }),
      mockProvider(LicenseService, {
        hasTruenasConnect$: of(false),
      }),
      mockProvider(SlideIn, {
        open: jest.fn(() => of({ response: true, error: null })),
      }),
      mockProvider(TruenasConnectService, {
        openStatusModal: jest.fn(),
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
    const slideIn = spectator.inject(SlideIn);
    const formData = { isNew: true, name: '', path: '' };

    spectator.service.openWebShareForm(formData).subscribe((result) => {
      expect(result).toBe(false);
    });

    expect(truenasConnectService.openStatusModal).toHaveBeenCalled();
    expect(slideIn.open).not.toHaveBeenCalled();
  });
});
