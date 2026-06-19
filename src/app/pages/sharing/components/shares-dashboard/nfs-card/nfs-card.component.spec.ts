import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { Spectator } from '@ngneat/spectator';
import { createComponentFactory, mockProvider } from '@ngneat/spectator/jest';
import { provideMockStore } from '@ngrx/store/testing';
import {
  TnButtonHarness,
  TnDialog,
  TnMenuHarness, TnMenuTesting, TnSlideToggleHarness, TnTableHarness,
} from '@truenas/ui-components';
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
import {
  IxTablePagerShowMoreComponent,
} from 'app/modules/ix-table/components/ix-table-pager-show-more/ix-table-pager-show-more.component';
import { LoaderService } from 'app/modules/loader/loader.service';
import { SlideIn } from 'app/modules/slide-ins/slide-in';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
import { SlideInResult } from 'app/modules/slide-ins/slide-in-result';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { ApiService } from 'app/modules/websocket/api.service';
import { NfsCardComponent } from 'app/pages/sharing/components/shares-dashboard/nfs-card/nfs-card.component';
import {
  ServiceActionsMenuService,
} from 'app/pages/sharing/components/shares-dashboard/service-extra-actions/service-actions-menu.service';
import { mockSharingTierService } from 'app/pages/sharing/components/testing/mock-sharing-tier.utils';
import { NfsFormComponent } from 'app/pages/sharing/nfs/nfs-form/nfs-form.component';
import { selectServices } from 'app/store/services/services.selectors';

describe('NfsCardComponent', () => {
  let spectator: Spectator<NfsCardComponent>;
  let loader: HarnessLoader;
  let table: TnTableHarness;

  // The "⋮" row-action trigger test id, derived from the row's uniqueRowTag
  // (path + comment, normalized: /mnt/x + sweet -> card-nfs-share-mnt-x-sweet).
  const rowMenuTrigger = '[data-test="button-card-nfs-share-mnt-x-sweet-more-action"]';

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

  const commonProviders = [
    mockAuth(),
    mockProvider(DialogService, {
      confirm: jest.fn(() => of(true)),
      confirmDelete: jest.fn(() => of(undefined)),
    }),
    mockProvider(SlideInRef, slideInRef),
    mockProvider(TnDialog, {
      open: jest.fn(() => ({
        closed: of(true),
      })),
    }),
    mockProvider(LoaderService, {
      withLoader: jest.fn(() => (source$: unknown) => source$),
    }),
    mockProvider(SlideIn, {
      open: jest.fn(() => SlideInResult.empty()),
    }),
    mockProvider(SnackbarService),
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
    providers: [
      ...commonProviders,
      mockApi([
        mockCall('sharing.nfs.query', nfsShares),
        mockCall('sharing.nfs.delete'),
        // Return a truthy share so accumulateLoadingState's `!!value` filter
        // lets the success handler (reload + toast) run.
        mockCall('sharing.nfs.update', { id: 10 } as NfsShare),
        mockCall('pool.query', [{ path: '/mnt/x' }] as Pool[]),
      ]),
      mockSharingTierService({ enabled: false }),
    ],
  });

  async function openRowMenu(): Promise<TnMenuHarness> {
    spectator.click(rowMenuTrigger);
    return TnMenuTesting.rootLoader(spectator.fixture).getHarness(TnMenuHarness);
  }

  describe('with active pool shares', () => {
    beforeEach(async () => {
      spectator = createComponent();
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
      table = await loader.getHarness(TnTableHarness);
    });

    it('should show table rows', async () => {
      expect(await table.getHeaderTexts()).toEqual(['Path', 'Description', 'Enabled', '']);
      expect(await table.getAllRowTexts()).toEqual([
        ['/mnt/x', 'sweet', '', ''],
      ]);
    });

    it('opens the NFS form when the projected Add button is clicked', async () => {
      const addButton = await loader.getHarness(TnButtonHarness.with({ label: 'Add' }));
      await addButton.click();

      expect(spectator.inject(SlideIn).open).toHaveBeenCalledWith(NfsFormComponent, {
        data: { existingNfsShare: undefined },
      });
    });

    it('toggles the NFS service when the projected header toggle is changed', async () => {
      const toggleState = jest.spyOn(spectator.inject(ServiceActionsMenuService), 'toggleServiceState')
        .mockImplementation(() => {});
      const toggle = await loader.getHarness(
        TnSlideToggleHarness.with({ ancestor: '.tn-card__header-right' }),
      );
      await toggle.toggle();

      expect(toggleState).toHaveBeenCalledWith(expect.objectContaining({ service: ServiceName.Nfs }));
    });

    it('shows form to edit an existing NFS Share when Edit button is pressed', async () => {
      const menu = await openRowMenu();
      await menu.clickItem({ label: /^Edit$/ });

      expect(spectator.inject(SlideIn).open).toHaveBeenCalledWith(NfsFormComponent, {
        data: { existingNfsShare: expect.objectContaining(nfsShares[0]) },
      });
    });

    it('shows confirmation to delete NFS Share when Delete button is pressed', async () => {
      const menu = await openRowMenu();
      await menu.clickItem({ label: 'Delete' });

      expect(spectator.inject(DialogService).confirmDelete).toHaveBeenCalled();
    });

    it('updates NFS Enabled status once toggle is updated', async () => {
      const toggle = await loader.getHarness(TnSlideToggleHarness.with({ ancestor: 'tn-table' }));

      expect(await toggle.isChecked()).toBe(true);

      await toggle.uncheck();

      expect(spectator.inject(ApiService).call).toHaveBeenCalledWith(
        'sharing.nfs.update',
        [10, { enabled: false }],
      );
      expect(spectator.inject(SnackbarService).success).toHaveBeenCalledWith('NFS share «/mnt/x» disabled');
    });

    it('should not disable toggle when share is on an active pool', async () => {
      const toggle = await loader.getHarness(TnSlideToggleHarness.with({ ancestor: 'tn-table' }));
      expect(await toggle.isDisabled()).toBe(false);
    });
  });

  describe('with exported pool shares', () => {
    const createExportedComponent = createComponentFactory({
      component: NfsCardComponent,
      imports: commonImports,
      providers: [
        ...commonProviders,
        mockApi([
          mockCall('sharing.nfs.query', [{
            ...nfsShares[0],
            path: '/mnt/exported/data',
          }] as NfsShare[]),
          mockCall('sharing.nfs.delete'),
          mockCall('sharing.nfs.update', { id: 10 } as NfsShare),
          mockCall('pool.query', [{ path: '/mnt/x' }] as Pool[]),
        ]),
      ],
    });

    beforeEach(async () => {
      spectator = createExportedComponent();
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
      table = await loader.getHarness(TnTableHarness);
    });

    it('should disable toggle when share is on an exported pool', async () => {
      const toggle = await loader.getHarness(TnSlideToggleHarness.with({ ancestor: 'tn-table' }));
      expect(await toggle.isDisabled()).toBe(true);
    });
  });

  describe('with locked shares', () => {
    const createLockedComponent = createComponentFactory({
      component: NfsCardComponent,
      imports: commonImports,
      providers: [
        ...commonProviders,
        mockApi([
          mockCall('sharing.nfs.query', [{
            ...nfsShares[0],
            locked: true,
          }] as NfsShare[]),
          mockCall('sharing.nfs.delete'),
          mockCall('sharing.nfs.update', { id: 10 } as NfsShare),
          mockCall('pool.query', [{ path: '/mnt/x' }] as Pool[]),
        ]),
      ],
    });

    beforeEach(async () => {
      spectator = createLockedComponent();
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
      table = await loader.getHarness(TnTableHarness);
    });

    it('should disable toggle when share is locked', async () => {
      const toggle = await loader.getHarness(TnSlideToggleHarness.with({ ancestor: 'tn-table' }));
      expect(await toggle.isDisabled()).toBe(true);
    });
  });
});
