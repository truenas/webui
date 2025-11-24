import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatButtonHarness } from '@angular/material/button/testing';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { provideMockStore } from '@ngrx/store/testing';
import { MockComponents } from 'ng-mocks';
import { of, throwError } from 'rxjs';
import { mockCall, mockApi } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { ServiceName } from 'app/enums/service-name.enum';
import { ServiceStatus } from 'app/enums/service-status.enum';
import { WINDOW } from 'app/helpers/window.helper';
import { Service } from 'app/interfaces/service.interface';
import { TruenasConnectConfig } from 'app/interfaces/truenas-connect-config.interface';
import { WebShare } from 'app/interfaces/webshare-config.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import {
  IxTablePagerShowMoreComponent,
} from 'app/modules/ix-table/components/ix-table-pager-show-more/ix-table-pager-show-more.component';
import { SlideIn } from 'app/modules/slide-ins/slide-in';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
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
  } as TruenasConnectConfig;

  const createComponent = createComponentFactory({
    component: WebShareCardComponent,
    imports: [
      IxTablePagerShowMoreComponent,
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
        open: jest.fn(() => of(true)),
      }),
      mockProvider(DialogService),
      mockProvider(SnackbarService),
      mockApi([
        mockCall('sharing.webshare.query', mockWebShares),
        mockCall('tn_connect.config', mockTnConnectConfig),
      ]),
      provideMockStore({
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

    expect(mockWindow.open).toHaveBeenCalledWith('http://test.truenas.direct:755/webshare/', '_blank');

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
    const dialog = spectator.inject(DialogService);
    const api = spectator.inject(ApiService);
    const snackbar = spectator.inject(SnackbarService);

    jest.spyOn(dialog, 'confirm').mockReturnValue(of(true as unknown as never));
    jest.spyOn(api, 'call').mockImplementation((method) => {
      if (method === 'sharing.webshare.delete') {
        return of(true);
      }
      return of(mockWebShares);
    });

    // Find and click delete button for first row
    const deleteButtons = spectator.queryAll('[aria-label*="Delete"]');
    expect(deleteButtons.length).toBeGreaterThan(0);

    deleteButtons[0].dispatchEvent(new Event('click'));
    spectator.detectChanges();

    expect(dialog.confirm).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Delete WebShare',
        buttonText: 'Delete',
      }),
    );

    expect(api.call).toHaveBeenCalledWith('sharing.webshare.delete', [1]);
    expect(snackbar.success).toHaveBeenCalledWith('WebShare deleted');
  });

  it('handles error when deleting WebShare fails', () => {
    const dialog = spectator.inject(DialogService);
    const api = spectator.inject(ApiService);

    jest.spyOn(dialog, 'confirm').mockReturnValue(of(true as unknown as never));
    jest.spyOn(api, 'call').mockImplementation((method) => {
      if (method === 'sharing.webshare.delete') {
        return throwError(() => new Error('Delete failed'));
      }
      return of(mockWebShares);
    });
    jest.spyOn(dialog, 'error');

    const deleteButtons = spectator.queryAll('[aria-label*="Delete"]');
    deleteButtons[0].dispatchEvent(new Event('click'));
    spectator.detectChanges();

    expect(dialog.error).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Error deleting WebShare',
      }),
    );
  });

  it('does not delete when confirmation is cancelled', () => {
    const dialog = spectator.inject(DialogService);
    const api = spectator.inject(ApiService);

    jest.spyOn(dialog, 'confirm').mockReturnValue(of(false as unknown as never));
    jest.spyOn(api, 'call');

    const deleteButtons = spectator.queryAll('[aria-label*="Delete"]');
    deleteButtons[0].dispatchEvent(new Event('click'));
    spectator.detectChanges();

    // API should not be called if confirmation is cancelled
    expect(api.call).not.toHaveBeenCalledWith('sharing.webshare.delete', expect.anything());
  });
});
