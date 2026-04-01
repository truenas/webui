import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatDialog } from '@angular/material/dialog';
import { MatMenuHarness } from '@angular/material/menu/testing';
import { MatSlideToggleHarness } from '@angular/material/slide-toggle/testing';
import { Spectator } from '@ngneat/spectator';
import { createComponentFactory, mockProvider } from '@ngneat/spectator/jest';
import { provideMockStore } from '@ngrx/store/testing';
import { MockComponents } from 'ng-mocks';
import { of } from 'rxjs';
import { mockApi, mockCall } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { NfsSecurityProvider } from 'app/enums/nfs-security-provider.enum';
import { ServiceName } from 'app/enums/service-name.enum';
import { ServiceStatus } from 'app/enums/service-status.enum';
import { NfsShare } from 'app/interfaces/nfs-share.interface';
import { Pool } from 'app/interfaces/pool.interface';
import { Service } from 'app/interfaces/service.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { IxTableHarness } from 'app/modules/ix-table/components/ix-table/ix-table.harness';
import {
  IxTablePagerShowMoreComponent,
} from 'app/modules/ix-table/components/ix-table-pager-show-more/ix-table-pager-show-more.component';
import { LoaderService } from 'app/modules/loader/loader.service';
import { SlideIn } from 'app/modules/slide-ins/slide-in';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
import { SlideInResult } from 'app/modules/slide-ins/slide-in-result';
import { ApiService } from 'app/modules/websocket/api.service';
import { NfsCardComponent } from 'app/pages/sharing/components/shares-dashboard/nfs-card/nfs-card.component';
import { ServiceExtraActionsComponent } from 'app/pages/sharing/components/shares-dashboard/service-extra-actions/service-extra-actions.component';
import { ServiceStateButtonComponent } from 'app/pages/sharing/components/shares-dashboard/service-state-button/service-state-button.component';
import { NfsFormComponent } from 'app/pages/sharing/nfs/nfs-form/nfs-form.component';
import { selectServices } from 'app/store/services/services.selectors';

describe('NfsCardComponent', () => {
  let spectator: Spectator<NfsCardComponent>;
  let loader: HarnessLoader;
  let table: IxTableHarness;

  const nfsShares = [
    {
      id: 10,
      path: '/mnt/x',
      aliases: [] as string[],
      comment: 'sweet',
      hosts: [] as string[],
      ro: false,
      maproot_user: '',
      maproot_group: '',
      mapall_user: '',
      mapall_group: '',
      security: [] as NfsSecurityProvider[],
      enabled: true,
      networks: [] as string[],
      locked: false,
    },
  ] as NfsShare[];

  const slideInRef: SlideInRef<NfsShare | undefined, unknown> = {
    close: jest.fn(),
    requireConfirmationWhen: jest.fn(),
    getData: jest.fn((): undefined => undefined),
  };

  const commonImports = [IxTablePagerShowMoreComponent];

  const commonDeclarations = [
    MockComponents(
      ServiceStateButtonComponent,
      ServiceExtraActionsComponent,
    ),
  ];

  const commonProviders = [
    mockAuth(),
    mockProvider(DialogService, {
      confirm: jest.fn(() => of(true)),
      confirmDelete: jest.fn(() => of(undefined)),
    }),
    mockProvider(SlideInRef, slideInRef),
    mockProvider(MatDialog, {
      open: jest.fn(() => ({
        afterClosed: () => of(true),
      })),
    }),
    mockProvider(LoaderService, {
      withLoader: jest.fn(() => (source$: unknown) => source$),
    }),
    mockProvider(SlideIn, {
      open: jest.fn(() => SlideInResult.empty()),
    }),
    provideMockStore({
      initialState: {
        alerts: {
          ids: [], entities: {}, isLoading: false, isPanelOpen: false, error: null,
        },
      },
      selectors: [
        {
          selector: selectServices,
          value: [{
            id: 4,
            service: ServiceName.Nfs,
            state: ServiceStatus.Stopped,
            enable: false,
          } as Service],
        },
      ],
    }),
  ];

  const createComponent = createComponentFactory({
    component: NfsCardComponent,
    imports: commonImports,
    declarations: commonDeclarations,
    providers: [
      ...commonProviders,
      mockApi([
        mockCall('sharing.nfs.query', nfsShares),
        mockCall('sharing.nfs.delete'),
        mockCall('sharing.nfs.update'),
        mockCall('pool.query', [{ path: '/mnt/x' }] as Pool[]),
      ]),
    ],
  });

  describe('with active pool shares', () => {
    beforeEach(async () => {
      spectator = createComponent();
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
      table = await loader.getHarness(IxTableHarness);
    });

    it('should show table rows', async () => {
      const expectedRows = [
        ['Path', 'Description', 'Enabled', ''],
        ['/mnt/x', 'sweet', '', ''],
      ];

      const cells = await table.getCellTexts();
      expect(cells).toEqual(expectedRows);
    });

    it('shows form to edit an existing NFS Share when Edit button is pressed', async () => {
      const [menu] = await loader.getAllHarnesses(MatMenuHarness.with({ selector: '[mat-icon-button]' }));
      await menu.open();
      await menu.clickItem({ text: 'Edit' });

      expect(spectator.inject(SlideIn).open).toHaveBeenCalledWith(NfsFormComponent, {
        data: { existingNfsShare: expect.objectContaining(nfsShares[0]) },
      });
    });

    it('shows confirmation to delete NFS Share when Delete button is pressed', async () => {
      const [menu] = await loader.getAllHarnesses(MatMenuHarness.with({ selector: '[mat-icon-button]' }));
      await menu.open();
      await menu.clickItem({ text: 'Delete' });

      expect(spectator.inject(DialogService).confirmDelete).toHaveBeenCalled();
    });

    it('updates NFS Enabled status once mat-toggle is updated', async () => {
      const toggle = await table.getHarnessInCell(MatSlideToggleHarness, 1, 2);

      expect(await toggle.isChecked()).toBe(true);

      await toggle.uncheck();

      expect(spectator.inject(ApiService).call).toHaveBeenCalledWith(
        'sharing.nfs.update',
        [10, { enabled: false }],
      );
    });

    it('should not disable toggle when share is on an active pool', async () => {
      const toggle = await table.getHarnessInCell(MatSlideToggleHarness, 1, 2);
      expect(await toggle.isDisabled()).toBe(false);
    });
  });

  describe('with exported pool shares', () => {
    const createExportedComponent = createComponentFactory({
      component: NfsCardComponent,
      imports: commonImports,
      declarations: commonDeclarations,
      providers: [
        ...commonProviders,
        mockApi([
          mockCall('sharing.nfs.query', [{
            ...nfsShares[0],
            path: '/mnt/exported/data',
          }] as NfsShare[]),
          mockCall('sharing.nfs.delete'),
          mockCall('sharing.nfs.update'),
          mockCall('pool.query', [{ path: '/mnt/x' }] as Pool[]),
        ]),
      ],
    });

    beforeEach(async () => {
      spectator = createExportedComponent();
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
      table = await loader.getHarness(IxTableHarness);
    });

    it('should disable toggle when share is on an exported pool', async () => {
      const toggle = await table.getHarnessInCell(MatSlideToggleHarness, 1, 2);
      expect(await toggle.isDisabled()).toBe(true);
    });
  });

  describe('with locked shares', () => {
    const createLockedComponent = createComponentFactory({
      component: NfsCardComponent,
      imports: commonImports,
      declarations: commonDeclarations,
      providers: [
        ...commonProviders,
        mockApi([
          mockCall('sharing.nfs.query', [{
            ...nfsShares[0],
            locked: true,
          }] as NfsShare[]),
          mockCall('sharing.nfs.delete'),
          mockCall('sharing.nfs.update'),
          mockCall('pool.query', [{ path: '/mnt/x' }] as Pool[]),
        ]),
      ],
    });

    beforeEach(async () => {
      spectator = createLockedComponent();
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
      table = await loader.getHarness(IxTableHarness);
    });

    it('should disable toggle when share is locked', async () => {
      const toggle = await table.getHarnessInCell(MatSlideToggleHarness, 1, 2);
      expect(await toggle.isDisabled()).toBe(true);
    });
  });
});
