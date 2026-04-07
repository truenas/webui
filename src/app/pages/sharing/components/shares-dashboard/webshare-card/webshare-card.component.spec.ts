import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatButtonHarness } from '@angular/material/button/testing';
import { provideRouter, Router } from '@angular/router';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { provideMockStore } from '@ngrx/store/testing';
import { MockComponents } from 'ng-mocks';
import { EMPTY, of } from 'rxjs';
import { mockCall, mockApi } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { ServiceName } from 'app/enums/service-name.enum';
import { ServiceStatus } from 'app/enums/service-status.enum';
import { TruenasConnectStatus } from 'app/enums/truenas-connect-status.enum';
import { WINDOW } from 'app/helpers/window.helper';
import { ConfirmDeleteCallOptions } from 'app/interfaces/dialog.interface';
import { Service } from 'app/interfaces/service.interface';
import { TruenasConnectConfig } from 'app/interfaces/truenas-connect-config.interface';
import { User } from 'app/interfaces/user.interface';
import { WebShare } from 'app/interfaces/webshare-config.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import {
  IxTablePagerShowMoreComponent,
} from 'app/modules/ix-table/components/ix-table-pager-show-more/ix-table-pager-show-more.component';
import { SlideIn } from 'app/modules/slide-ins/slide-in';
import { SlideInResult } from 'app/modules/slide-ins/slide-in-result';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { TruenasConnectService } from 'app/modules/truenas-connect/services/truenas-connect.service';
import { ApiService } from 'app/modules/websocket/api.service';
import { ServiceExtraActionsComponent } from 'app/pages/sharing/components/shares-dashboard/service-extra-actions/service-extra-actions.component';
import { ServiceStateButtonComponent } from 'app/pages/sharing/components/shares-dashboard/service-state-button/service-state-button.component';
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

  const createComponent = createComponentFactory({
    component: WebShareCardComponent,
    imports: [IxTablePagerShowMoreComponent,
    ],
    declarations: [
      MockComponents(
        ServiceStateButtonComponent,
        ServiceExtraActionsComponent,
      ),
    ],
    providers: [
      mockAuth(),
      mockProvider(SlideIn, {
        open: jest.fn(() => SlideInResult.empty()),
      }),
      mockProvider(DialogService, {
        confirmDelete: jest.fn((options: ConfirmDeleteCallOptions) => options.call()),
      }),
      mockProvider(SnackbarService),
      mockApi([
        mockCall('sharing.webshare.query', mockWebShares),
        mockCall('sharing.webshare.delete'),
        mockCall('tn_connect.config', mockTnConnectConfig),
        mockCall('tn_connect.ips_with_hostnames', {}),
        mockCall('interface.websocket_local_ip', '192.168.1.100'),
        mockCall('user.query', [{ id: 1, username: 'testuser', webshare: true } as User]),
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

  it('shows table with WebShare entries', () => {
    const rows = spectator.queryAll('ix-table tbody tr');
    expect(rows).toHaveLength(2);

    expect(rows[0]).toHaveText('documents');
    expect(rows[0]).toHaveText('/mnt/tank/documents');
  });

  it('shows Open WebShare button when service is running', async () => {
    const openButton = await loader.getHarnessOrNull(
      MatButtonHarness.with({ text: 'Open WebShare' }),
    );
    expect(openButton).toBeTruthy();
  });

  it('opens WebShare in new tab when Open WebShare is clicked', async () => {
    // Suppress console error for window.open not implemented in jsdom
    const consoleError = jest.spyOn(console, 'error').mockImplementation();

    const openButton = await loader.getHarness(
      MatButtonHarness.with({ text: 'Open WebShare' }),
    );
    await openButton.click();

    expect(mockWindow.open).toHaveBeenCalledWith('https://test.truenas.direct:755/webshare/', '_blank');

    consoleError.mockRestore();
  });

  it('opens add form when Add button is clicked', async () => {
    const slideIn = spectator.inject(SlideIn);

    const addButton = await loader.getHarness(
      MatButtonHarness.with({ text: 'Add' }),
    );
    await addButton.click();

    expect(slideIn.open).toHaveBeenCalled();
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

  it('does not show info message when TrueNAS Connect is configured', () => {
    const infoMessage = spectator.query('.info-message');
    expect(infoMessage).not.toExist();
  });
});

describe('WebShareCardComponent - TrueNAS Connect not configured', () => {
  let spectator: Spectator<WebShareCardComponent>;

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
    declarations: [
      MockComponents(
        ServiceStateButtonComponent,
        ServiceExtraActionsComponent,
      ),
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
  });

  it('shows info message when TrueNAS Connect is not configured', () => {
    const infoMessage = spectator.query('.info-message');
    expect(infoMessage).toExist();
    expect(infoMessage).toHaveText('WebShare service requires TrueNAS Connect to be configured and active.');
  });

  it('opens TrueNAS Connect dialog when info message is clicked', () => {
    const truenasConnectService = spectator.inject(TruenasConnectService);

    spectator.click('.info-message');

    expect(truenasConnectService.openStatusModal).toHaveBeenCalled();
  });
});

describe('WebShareCardComponent - No WebShare users configured', () => {
  let spectator: Spectator<WebShareCardComponent>;
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
    declarations: [
      MockComponents(
        ServiceStateButtonComponent,
        ServiceExtraActionsComponent,
      ),
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
  });

  it('shows info message when no users have WebShare access configured', () => {
    const infoMessages = spectator.queryAll('.info-message');
    expect(infoMessages).toHaveLength(1);
    expect(infoMessages[0]).toHaveText('It appears you have no users configured to access WebShare.');
  });

  it('navigates to users page when info message is clicked', () => {
    const router = spectator.inject(Router);
    jest.spyOn(router, 'navigate').mockReturnValue(Promise.resolve(true));

    spectator.click('.info-message');

    expect(router.navigate).toHaveBeenCalledWith(['/credentials', 'users']);
  });
});
