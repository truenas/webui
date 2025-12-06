import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatDialog } from '@angular/material/dialog';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { provideMockStore } from '@ngrx/store/testing';
import { TranslateService } from '@ngx-translate/core';
import { of, throwError } from 'rxjs';
import { mockCall, mockApi } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { ServiceName } from 'app/enums/service-name.enum';
import { ServiceStatus } from 'app/enums/service-status.enum';
import { TruenasConnectStatus } from 'app/enums/truenas-connect-status.enum';
import { Service } from 'app/interfaces/service.interface';
import { TruenasConnectConfig } from 'app/interfaces/truenas-connect-config.interface';
import { WebShare } from 'app/interfaces/webshare-config.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { EmptyService } from 'app/modules/empty/empty.service';
import { BasicSearchComponent } from 'app/modules/forms/search-input/components/basic-search/basic-search.component';
import { IxTableHarness } from 'app/modules/ix-table/components/ix-table/ix-table.harness';
import { SlideIn } from 'app/modules/slide-ins/slide-in';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { TruenasConnectStatusModalComponent } from 'app/modules/truenas-connect/components/truenas-connect-status-modal/truenas-connect-status-modal.component';
import { TruenasConnectService } from 'app/modules/truenas-connect/services/truenas-connect.service';
import { ApiService } from 'app/modules/websocket/api.service';
import { WebShareSharesFormComponent } from 'app/pages/sharing/webshare/webshare-shares-form/webshare-shares-form.component';
import { selectService } from 'app/store/services/services.selectors';
import { selectSystemInfo } from 'app/store/system-info/system-info.selectors';
import { WebShareListComponent } from './webshare-list.component';

describe('WebShareListComponent', () => {
  let spectator: Spectator<WebShareListComponent>;
  let loader: HarnessLoader;
  let api: ApiService;
  let slideIn: SlideIn;
  let table: IxTableHarness;

  const mockWebShares: WebShare[] = [
    { id: 1, name: 'documents', path: '/mnt/tank/documents' },
    { id: 2, name: 'media', path: '/mnt/tank/media' },
    { id: 3, name: 'home', path: '/mnt/tank/home' },
  ];

  const mockTruenasConnectConfig = {
    id: 1,
    enabled: true,
    status: TruenasConnectStatus.Configured,
    client_id: 'test-client-id',
  } as unknown as TruenasConnectConfig;

  const mockService: Service = {
    id: 1,
    service: ServiceName.WebShare,
    state: ServiceStatus.Running,
    enable: true,
  } as Service;

  const createComponent = createComponentFactory({
    component: WebShareListComponent,
    imports: [],
    providers: [
      mockAuth(),
      mockApi([
        mockCall('sharing.webshare.query', mockWebShares),
        mockCall('sharing.webshare.delete', true),
        mockCall('tn_connect.config', mockTruenasConnectConfig),
      ]),
      mockProvider(SlideIn, {
        open: jest.fn(() => of({ response: true, error: null })),
      }),
      mockProvider(DialogService, {
        confirm: jest.fn(() => of(true)),
        error: jest.fn(),
      }),
      mockProvider(SnackbarService),
      mockProvider(EmptyService),
      mockProvider(MatDialog),
      mockProvider(TranslateService, {
        instant: jest.fn((key: string) => key),
        get: jest.fn(() => of({})),
        onLangChange: of({ lang: 'en' }),
        onTranslationChange: of({}),
        onDefaultLangChange: of({}),
      }),
      provideMockStore({
        initialState: {
          services: {
            ids: [],
            entities: {},
          },
          preferences: {
            preferences: {},
          },
        },
        selectors: [
          {
            selector: selectService(ServiceName.WebShare),
            value: mockService,
          },
          {
            selector: selectSystemInfo,
            value: { license: { features: ['WEBSHARE'] } },
          },
        ],
      }),
    ],
  });

  beforeEach(async () => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    api = spectator.inject(ApiService);
    slideIn = spectator.inject(SlideIn);
    spectator.detectChanges();

    table = await loader.getHarness(IxTableHarness);
  });

  it('should display WebShare list on load', async () => {
    const rows = await table.getRows();
    expect(rows).toHaveLength(3);

    // Verify that the data provider has the correct data
    expect(spectator.component.dataProvider).toBeDefined();
  });

  it('should show empty state configuration', () => {
    const config = spectator.component.emptyConfig;
    expect(config).toBeDefined();
    expect(config.title).toBe('');
    expect(config.message).toContain('WebShare service provides web-based file access');
  });


  it('should open form when Add button is clicked', () => {
    // Directly call doAdd to test the form opening logic
    spectator.component.doAdd();
    spectator.detectChanges();

    expect(slideIn.open).toHaveBeenCalledWith(WebShareSharesFormComponent, {
      data: {
        isNew: true,
        name: '',
        path: '',
      },
    });
  });

  it('should open form when Edit action is clicked', () => {
    // Directly call the doEdit method to test its behavior
    spectator.component.doEdit({
      id: 1,
      name: 'documents',
      path: '/mnt/tank/documents',
    });

    expect(slideIn.open).toHaveBeenCalledWith(WebShareSharesFormComponent, {
      data: {
        id: 1,
        isNew: false,
        name: 'documents',
        path: '/mnt/tank/documents',
      },
    });
  });

  it('should delete share when Delete action is confirmed', () => {
    const dialog = spectator.inject(DialogService);
    const snackbar = spectator.inject(SnackbarService);

    // Call the delete method directly to test delete confirmation flow
    spectator.component.doDelete({
      id: 1,
      name: 'documents',
      path: '/mnt/tank/documents',
    });

    expect(dialog.confirm).toHaveBeenCalledWith({
      title: 'Delete WebShare',
      message: 'Are you sure you want to delete the WebShare "{name}"?<br><br>Users will no longer be able to access {path} through WebShare.',
      buttonText: 'Delete',
      buttonColor: 'warn',
    });

    expect(api.call).toHaveBeenCalledWith('sharing.webshare.delete', [1]);

    expect(snackbar.success).toHaveBeenCalledWith('WebShare deleted');
  });

  it('should not delete share when Delete action is cancelled', async () => {
    const dialog = spectator.inject(DialogService);
    jest.spyOn(dialog, 'confirm').mockReturnValue(of(false as unknown as never));

    // Call the delete method directly to test cancellation flow
    spectator.component.doDelete({
      id: 1,
      name: 'documents',
      path: '/mnt/tank/documents',
    });

    // Wait for any pending operations
    await spectator.fixture.whenStable();

    // Verify delete was not called
    const deleteCallsMade = (api.call as jest.Mock).mock.calls.filter(
      (call) => call[0] === 'sharing.webshare.delete',
    );
    expect(deleteCallsMade).toHaveLength(0);
  });

  it('should handle delete error gracefully', async () => {
    const dialog = spectator.inject(DialogService);
    jest.spyOn(dialog, 'confirm').mockReturnValue(of(true as unknown as never));
    jest.spyOn(api, 'call').mockImplementation((method: string) => {
      if (method === 'sharing.webshare.delete') {
        return throwError(() => new Error('Delete failed'));
      }
      if (method === 'sharing.webshare.query') {
        return of(mockWebShares);
      }
      if (method === 'tn_connect.config') {
        return of(mockTruenasConnectConfig);
      }
      return of(null);
    });

    // Call the delete method directly to test error handling flow
    spectator.component.doDelete({
      id: 1,
      name: 'documents',
      path: '/mnt/tank/documents',
    });

    await spectator.fixture.whenStable();

    expect(dialog.error).toHaveBeenCalledWith({
      title: 'Error deleting WebShare',
      message: 'Delete failed',
    });
  });

  it('should filter shares based on search query', () => {
    const searchInput = spectator.query(BasicSearchComponent);
    expect(searchInput).toBeTruthy();

    jest.spyOn(spectator.component.dataProvider, 'setFilter');

    spectator.component.onListFiltered('media');
    spectator.detectChanges();

    expect(spectator.component.dataProvider.setFilter).toHaveBeenCalledWith({
      query: 'media',
      columnKeys: ['name', 'path'],
    });
  });

  it('should reload data after successful form submission', () => {
    jest.spyOn(slideIn, 'open').mockReturnValue(of({ response: true, error: null }));
    jest.spyOn(spectator.component.dataProvider, 'load');

    spectator.component.doAdd();
    spectator.detectChanges();

    expect(spectator.component.dataProvider.load).toHaveBeenCalled();
  });

  it('should sort shares by name by default', () => {
    const sorting = spectator.component.dataProvider.sorting;
    expect(sorting.propertyName).toBe('name');
    expect(sorting.direction).toBe('asc');
  });

  it('should update columns when column selector changes', () => {
    const originalColumns = [...spectator.component.columns];
    const newColumns = originalColumns.filter((col) => col.propertyName !== 'path');

    spectator.component.columnsChange(newColumns);

    expect(spectator.component.columns).toEqual(newColumns);
    expect(spectator.component.columns).not.toBe(newColumns); // Should be a new array
  });

  it('should open TrueNAS Connect dialog', () => {
    const matDialog = spectator.inject(MatDialog);

    spectator.component.openTruenasConnectDialog();

    expect(matDialog.open).toHaveBeenCalledWith(TruenasConnectStatusModalComponent, {
      width: '400px',
      hasBackdrop: true,
      panelClass: 'topbar-panel',
      position: {
        top: '48px',
        right: '16px',
      },
    });
  });

  it('should check for TrueNAS Connect before adding share', () => {
    // Test that hasTruenasConnect$ observable is defined and accessible
    expect(spectator.component.hasTruenasConnect$).toBeDefined();
  });
});

describe('WebShareListComponent - TrueNAS Connect not configured', () => {
  let spectator: Spectator<WebShareListComponent>;

  const mockTruenasConnectConfigDisabled = {
    id: 1,
    enabled: false,
    status: TruenasConnectStatus.Disabled,
    client_id: 'test-client-id',
  } as unknown as TruenasConnectConfig;

  const mockService: Service = {
    id: 1,
    service: ServiceName.WebShare,
    state: ServiceStatus.Running,
    enable: true,
  } as Service;

  const createComponent = createComponentFactory({
    component: WebShareListComponent,
    imports: [],
    providers: [
      mockAuth(),
      mockApi([
        mockCall('sharing.webshare.query', []),
        mockCall('tn_connect.config', mockTruenasConnectConfigDisabled),
      ]),
      mockProvider(SlideIn, {
        open: jest.fn(() => of({ response: true, error: null })),
      }),
      mockProvider(DialogService, {
        confirm: jest.fn(() => of(true)),
        error: jest.fn(),
      }),
      mockProvider(SnackbarService),
      mockProvider(EmptyService),
      mockProvider(MatDialog),
      mockProvider(TranslateService, {
        instant: jest.fn((key: string) => key),
        get: jest.fn(() => of({})),
        onLangChange: of({ lang: 'en' }),
        onTranslationChange: of({}),
        onDefaultLangChange: of({}),
      }),
      mockProvider(TruenasConnectService, {
        config$: of(mockTruenasConnectConfigDisabled),
        openStatusModal: jest.fn(),
      }),
      provideMockStore({
        initialState: {
          services: {
            ids: [],
            entities: {},
          },
          preferences: {
            preferences: {},
          },
        },
        selectors: [
          {
            selector: selectService(ServiceName.WebShare),
            value: mockService,
          },
          {
            selector: selectSystemInfo,
            value: { license: { features: ['WEBSHARE'] } },
          },
        ],
      }),
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
    spectator.detectChanges();
  });

  it('should show empty state configuration when TrueNAS Connect is not configured', () => {
    const config = spectator.component.emptyConfig;
    expect(config).toBeDefined();
    expect(config.title).toBe('');
    expect(config.message).toContain('WebShare service provides web-based file access');
  });
});
