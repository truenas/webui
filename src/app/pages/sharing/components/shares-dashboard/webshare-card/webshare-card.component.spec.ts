import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { Signal } from '@angular/core';
import { provideRouter, Router } from '@angular/router';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { provideMockStore } from '@ngrx/store/testing';
import {
  TnBannerHarness, TnButtonHarness, TnSlideToggleHarness, TnTableHarness, type TnMenuItem,
} from '@truenas/ui-components';
import { EMPTY, of } from 'rxjs';
import { mockCall, mockApi } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { ServiceName } from 'app/enums/service-name.enum';
import { ServiceStatus } from 'app/enums/service-status.enum';
import { TruenasConnectStatus } from 'app/enums/truenas-connect-status.enum';
import { WebSharePasskey } from 'app/enums/webshare-passkey.enum';
import { WINDOW } from 'app/helpers/window.helper';
import { ConfirmDeleteCallOptions } from 'app/interfaces/dialog.interface';
import { Service } from 'app/interfaces/service.interface';
import { TruenasConnectConfig } from 'app/interfaces/truenas-connect-config.interface';
import { User } from 'app/interfaces/user.interface';
import { WebShare, WebShareConfig } from 'app/interfaces/webshare-config.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { FormErrorHandlerService } from 'app/modules/forms/ix-forms/services/form-error-handler.service';
import {
  IxTablePagerShowMoreComponent,
} from 'app/modules/ix-table/components/ix-table-pager-show-more/ix-table-pager-show-more.component';
import { FormSidePanelService } from 'app/modules/slide-ins/form-side-panel/form-side-panel.service';
import { SlideIn } from 'app/modules/slide-ins/slide-in';
import { SlideInResult } from 'app/modules/slide-ins/slide-in-result';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { TruenasConnectService } from 'app/modules/truenas-connect/services/truenas-connect.service';
import { ApiService } from 'app/modules/websocket/api.service';
import { ServiceWebshareComponent } from 'app/pages/services/components/service-webshare/service-webshare.component';
import {
  ServiceActionsMenuService,
} from 'app/pages/sharing/components/shares-dashboard/service-extra-actions/service-actions-menu.service';
import { selectServices } from 'app/store/services/services.selectors';
import { selectSystemInfo } from 'app/store/system-info/system-info.selectors';
import { WebShareCardComponent } from './webshare-card.component';

describe('WebShareCardComponent', () => {
  let spectator: Spectator<WebShareCardComponent>;
  let loader: HarnessLoader;
  const mockWindow = {
    location: {
      origin: 'http://test.truenas.direct:4200',
      hostname: 'test.truenas.direct',
      protocol: 'http:',
    } as Location,
    open: jest.fn(),
  } as unknown as Window;

  const mockWebShares: WebShare[] = [
    {
      id: 1,
      name: 'documents',
      path: '/mnt/tank/documents',
    },
    {
      id: 2,
      name: 'media',
      path: '/mnt/tank/media',
    },
  ];

  const mockService: Service = {
    id: 10,
    service: ServiceName.WebShare,
    enable: true,
    state: ServiceStatus.Running,
  } as Service;

  const mockTnConnectConfig: TruenasConnectConfig = {
    enabled: true,
    status: TruenasConnectStatus.Configured,
  } as TruenasConnectConfig;

  const mockWebShareConfig: WebShareConfig = {
    id: 1,
    search: true,
    passkey: WebSharePasskey.Enabled,
  };

  const createComponent = createComponentFactory({
    component: WebShareCardComponent,
    imports: [IxTablePagerShowMoreComponent,
    ],
    providers: [
      mockAuth(),
      mockProvider(SlideIn, {
        open: jest.fn(() => SlideInResult.empty()),
      }),
      mockProvider(FormSidePanelService, {
        open: jest.fn(() => SlideInResult.empty()),
      }),
      mockProvider(DialogService, {
        confirmDelete: jest.fn((options: ConfirmDeleteCallOptions) => options.call()),
      }),
      mockProvider(SnackbarService),
      mockProvider(FormErrorHandlerService),
      mockApi([
        mockCall('sharing.webshare.query', mockWebShares),
        mockCall('sharing.webshare.delete'),
        mockCall('tn_connect.config', mockTnConnectConfig),
        mockCall('tn_connect.ips_with_hostnames', {}),
        mockCall('interface.websocket_local_ip', '192.168.1.100'),
        mockCall('user.query', [{ id: 1, username: 'testuser', webshare: true } as User]),
        mockCall('webshare.config', mockWebShareConfig),
        mockCall('webshare.update', mockWebShareConfig),
      ]),
      provideMockStore({
        initialState: {
          alerts: {
            ids: [], entities: {}, isLoading: false, isPanelOpen: false, error: null,
          },
        },
        selectors: [
          {
            selector: selectSystemInfo,
            value: {
              license: { features: ['TRUENAS_CONNECT'] },
            },
          },
          {
            selector: selectServices,
            value: [mockService],
          },
        ],
      }),
      mockProvider(TruenasConnectService, {
        config$: of(mockTnConnectConfig),
        openStatusModal: jest.fn(),
      }),
      provideRouter([]),
      {
        provide: WINDOW,
        useValue: mockWindow,
      },
    ],
  });

  beforeEach(() => {
    jest.clearAllMocks();
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  it('shows table with WebShare entries', async () => {
    const table = await loader.getHarness(TnTableHarness);
    expect(await table.getRowCount()).toBe(2);

    const rows = await table.getAllRowTexts();
    expect(rows[0]).toContain('documents');
    expect(rows[0]).toContain('/mnt/tank/documents');
  });

  it('shows Open WebShare button when service is running', async () => {
    const openButton = await loader.getHarnessOrNull(
      TnButtonHarness.with({ label: 'Open WebShare' }),
    );
    expect(openButton).toBeTruthy();
  });

  it('opens WebShare in new tab when Open WebShare is clicked', async () => {
    // Suppress console error for window.open not implemented in jsdom
    const consoleError = jest.spyOn(console, 'error').mockImplementation();

    const openButton = await loader.getHarness(
      TnButtonHarness.with({ label: 'Open WebShare' }),
    );
    await openButton.click();

    expect(mockWindow.open).toHaveBeenCalledWith('https://test.truenas.direct:755/webshare/', '_blank');

    consoleError.mockRestore();
  });

  it('opens add form when Add button is clicked', async () => {
    const slideIn = spectator.inject(SlideIn);

    const addButton = await loader.getHarness(
      TnButtonHarness.with({ label: 'Add' }),
    );
    await addButton.click();

    expect(slideIn.open).toHaveBeenCalled();
  });

  it('toggles the WebShare service when the projected header toggle is changed', async () => {
    const toggleState = jest.spyOn(spectator.inject(ServiceActionsMenuService), 'toggleServiceState')
      .mockImplementation(() => {});
    const toggle = await loader.getHarness(
      TnSlideToggleHarness.with({ ancestor: '.tn-card__header-right' }),
    );
    await toggle.toggle();

    expect(toggleState).toHaveBeenCalledWith(expect.objectContaining({ service: ServiceName.WebShare }));
  });

  it('shows delete confirmation and deletes WebShare', () => {
    // Find and click delete button for first row
    const deleteButtons = spectator.queryAll('[aria-label*="Delete"]');
    expect(deleteButtons.length).toBeGreaterThan(0);

    deleteButtons[0].dispatchEvent(new Event('click'));
    spectator.detectChanges();

    expect(spectator.inject(DialogService).confirmDelete).toHaveBeenCalledWith({
      title: 'Delete WebShare',
      message: 'Are you sure you want to delete the WebShare "documents"?<br><br>Users will no longer be able to access /mnt/tank/documents through WebShare.',
      call: expect.any(Function),
      successMessage: 'WebShare deleted',
    });
    expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('sharing.webshare.delete', [1]);
  });

  it('does not delete when confirmation is cancelled', () => {
    (spectator.inject(DialogService).confirmDelete as jest.Mock).mockReturnValue(EMPTY);

    const deleteButtons = spectator.queryAll('[aria-label*="Delete"]');
    deleteButtons[0].dispatchEvent(new Event('click'));
    spectator.detectChanges();

    expect(spectator.inject(ApiService).call).not.toHaveBeenCalledWith('sharing.webshare.delete', expect.anything());
  });

  it('does not show the TrueNAS Connect banner when TrueNAS Connect is configured', async () => {
    expect(await loader.hasHarness(TnBannerHarness)).toBe(false);
  });

  describe('Config Service', () => {
    /**
     * Triggering "Config Service" from the card-header menu opens the WebShare config form
     * in a side panel via FormSidePanelService. The menu items are built by
     * ServiceActionsMenuService.buildServiceCardMenu.
     */
    function serviceMenu(): TnMenuItem[] | undefined {
      return (spectator.component as unknown as { serviceMenu: Signal<TnMenuItem[] | undefined> }).serviceMenu();
    }

    it('exposes a Config Service menu item with the legacy test ID', () => {
      const configItem = serviceMenu()?.find((item) => item.id === 'service-config');
      expect(configItem).toBeDefined();
      expect(configItem?.label).toBe('Config Service');
      expect(configItem?.testId).toBe('button-webshare-actions-menu-config-service');
    });

    it('opens the WebShare config form in a side panel when Config Service is triggered', () => {
      serviceMenu()?.find((item) => item.id === 'service-config')?.action();

      expect(spectator.inject(FormSidePanelService).open).toHaveBeenCalledWith(
        ServiceWebshareComponent,
        { title: 'WebShare' },
      );
    });
  });
});

describe('WebShareCardComponent - TrueNAS Connect not configured', () => {
  let spectator: Spectator<WebShareCardComponent>;
  let loader: HarnessLoader;

  const mockTnConnectConfigDisabled: TruenasConnectConfig = {
    enabled: false,
    status: TruenasConnectStatus.Disabled,
  } as TruenasConnectConfig;

  const mockService: Service = {
    id: 10,
    service: ServiceName.WebShare,
    enable: false,
    state: ServiceStatus.Stopped,
  } as Service;

  const createComponent = createComponentFactory({
    component: WebShareCardComponent,
    imports: [IxTablePagerShowMoreComponent,
    ],
    providers: [
      mockAuth(),
      mockProvider(SlideIn),
      mockProvider(DialogService),
      mockProvider(SnackbarService),
      mockApi([
        mockCall('sharing.webshare.query', []),
        mockCall('user.query', []),
        mockCall('tn_connect.ips_with_hostnames', {}),
        mockCall('interface.websocket_local_ip', '192.168.1.100'),
      ]),
      provideMockStore({
        initialState: {
          alerts: {
            ids: [], entities: {}, isLoading: false, isPanelOpen: false, error: null,
          },
        },
        selectors: [
          {
            selector: selectSystemInfo,
            value: {
              license: { features: [] },
            },
          },
          {
            selector: selectServices,
            value: [mockService],
          },
        ],
      }),
      mockProvider(TruenasConnectService, {
        config$: of(mockTnConnectConfigDisabled),
        openStatusModal: jest.fn(),
      }),
      provideRouter([]),
      {
        provide: WINDOW,
        useValue: {
          location: {
            origin: 'http://test.truenas.direct:4200',
            hostname: 'test.truenas.direct',
            protocol: 'http:',
          } as Location,
          open: jest.fn(),
        } as unknown as Window,
      },
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  it('shows the TrueNAS Connect banner when TrueNAS Connect is not configured', async () => {
    const banner = await loader.getHarness(TnBannerHarness.with({ textContains: /WebShares unavailable/ }));
    expect(await banner.getText()).toContain('WebShare service requires TrueNAS Connect to be configured and active.');
  });

  it('disables the service toggle so it cannot be started while TrueNAS Connect is not configured', async () => {
    const toggle = await loader.getHarness(
      TnSlideToggleHarness.with({ ancestor: '.tn-card__header-right' }),
    );
    expect(await toggle.isDisabled()).toBe(true);
  });

  it('opens TrueNAS Connect dialog when the banner is clicked', () => {
    const truenasConnectService = spectator.inject(TruenasConnectService);

    spectator.click('tn-banner');

    expect(truenasConnectService.openStatusModal).toHaveBeenCalled();
  });
});

describe('WebShareCardComponent - No WebShare users configured', () => {
  let spectator: Spectator<WebShareCardComponent>;
  let loader: HarnessLoader;
  const mockWindow = {
    location: {
      origin: 'http://test.truenas.direct:4200',
      hostname: 'test.truenas.direct',
      protocol: 'http:',
    } as Location,
    open: jest.fn(),
  } as unknown as Window;

  const mockTnConnectConfig: TruenasConnectConfig = {
    enabled: true,
    status: TruenasConnectStatus.Configured,
  } as TruenasConnectConfig;

  const mockService: Service = {
    id: 10,
    service: ServiceName.WebShare,
    enable: true,
    state: ServiceStatus.Running,
  } as Service;

  const createComponent = createComponentFactory({
    component: WebShareCardComponent,
    imports: [IxTablePagerShowMoreComponent,
    ],
    providers: [
      mockAuth(),
      mockProvider(SlideIn),
      mockProvider(DialogService),
      mockProvider(SnackbarService),
      mockApi([
        mockCall('sharing.webshare.query', []),
        mockCall('user.query', []),
        mockCall('tn_connect.ips_with_hostnames', {}),
        mockCall('interface.websocket_local_ip', '192.168.1.100'),
      ]),
      provideMockStore({
        initialState: {
          alerts: {
            ids: [], entities: {}, isLoading: false, isPanelOpen: false, error: null,
          },
        },
        selectors: [
          {
            selector: selectSystemInfo,
            value: {
              license: { features: ['TRUENAS_CONNECT'] },
            },
          },
          {
            selector: selectServices,
            value: [mockService],
          },
        ],
      }),
      mockProvider(TruenasConnectService, {
        config$: of(mockTnConnectConfig),
        openStatusModal: jest.fn(),
      }),
      provideRouter([]),
      {
        provide: WINDOW,
        useValue: mockWindow,
      },
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  it('shows the banner when no users have WebShare access configured', async () => {
    const banner = await loader.getHarness(TnBannerHarness);
    const text = await banner.getText();
    expect(text).toContain('No WebShare users');
    expect(text).toContain('It appears you have no users configured to access WebShare.');
  });

  it('navigates to users page when the banner is clicked', () => {
    const router = spectator.inject(Router);
    jest.spyOn(router, 'navigate').mockReturnValue(Promise.resolve(true));

    spectator.click('tn-banner');

    expect(router.navigate).toHaveBeenCalledWith(['/credentials', 'users']);
  });
});

describe('WebShareCardComponent - TrueNAS Connect not configured but service running', () => {
  let spectator: Spectator<WebShareCardComponent>;
  let loader: HarnessLoader;

  const mockTnConnectConfigDisabled: TruenasConnectConfig = {
    enabled: false,
    status: TruenasConnectStatus.Disabled,
  } as TruenasConnectConfig;

  const mockService: Service = {
    id: 10,
    service: ServiceName.WebShare,
    enable: true,
    state: ServiceStatus.Running,
  } as Service;

  const createComponent = createComponentFactory({
    component: WebShareCardComponent,
    imports: [IxTablePagerShowMoreComponent,
    ],
    providers: [
      mockAuth(),
      mockProvider(SlideIn),
      mockProvider(DialogService),
      mockProvider(SnackbarService),
      mockApi([
        mockCall('sharing.webshare.query', []),
        mockCall('user.query', []),
        mockCall('tn_connect.ips_with_hostnames', {}),
        mockCall('interface.websocket_local_ip', '192.168.1.100'),
      ]),
      provideMockStore({
        initialState: {
          alerts: {
            ids: [], entities: {}, isLoading: false, isPanelOpen: false, error: null,
          },
        },
        selectors: [
          {
            selector: selectSystemInfo,
            value: {
              license: { features: [] },
            },
          },
          {
            selector: selectServices,
            value: [mockService],
          },
        ],
      }),
      mockProvider(TruenasConnectService, {
        config$: of(mockTnConnectConfigDisabled),
        openStatusModal: jest.fn(),
      }),
      provideRouter([]),
      {
        provide: WINDOW,
        useValue: {
          location: {
            origin: 'http://test.truenas.direct:4200',
            hostname: 'test.truenas.direct',
            protocol: 'http:',
          } as Location,
          open: jest.fn(),
        } as unknown as Window,
      },
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  it('keeps the service toggle enabled so a running service can still be stopped', async () => {
    const toggle = await loader.getHarness(
      TnSlideToggleHarness.with({ ancestor: '.tn-card__header-right' }),
    );
    expect(await toggle.isDisabled()).toBe(false);
  });
});
