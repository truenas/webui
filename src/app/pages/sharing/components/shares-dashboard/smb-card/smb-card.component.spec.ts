import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { Router } from '@angular/router';
import { Spectator } from '@ngneat/spectator';
import { createComponentFactory, mockProvider } from '@ngneat/spectator/jest';
import { provideMockStore } from '@ngrx/store/testing';
import {
  TnDialog,
  TnMenuHarness, TnMenuTesting, TnSlideToggleHarness, TnTableHarness,
} from '@truenas/ui-components';
import { of } from 'rxjs';
import { mockApi, mockCall } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { ServiceName } from 'app/enums/service-name.enum';
import { ServiceStatus } from 'app/enums/service-status.enum';
import { Pool } from 'app/interfaces/pool.interface';
import { Service } from 'app/interfaces/service.interface';
import { SmbSharePurpose, SmbShare, SmbSharesec } from 'app/interfaces/smb-share.interface';
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
import { SmbCardComponent } from 'app/pages/sharing/components/shares-dashboard/smb-card/smb-card.component';
import { mockSharingTierService } from 'app/pages/sharing/components/testing/mock-sharing-tier.utils';
import { SmbAclComponent } from 'app/pages/sharing/smb/smb-acl/smb-acl.component';
import { SmbFormComponent } from 'app/pages/sharing/smb/smb-form/smb-form.component';
import { selectServices } from 'app/store/services/services.selectors';

describe('SmbCardComponent', () => {
  let spectator: Spectator<SmbCardComponent>;
  let loader: HarnessLoader;
  let table: TnTableHarness;

  // The "⋮" row-action trigger test id, derived from the row's uniqueRowTag.
  const rowMenuTrigger = '[data-test="button-card-smb-share-smb123-more-action"]';

  const smbShares = [
    {
      id: 3,
      purpose: SmbSharePurpose.LegacyShare,
      path: '/mnt/APPS/smb1',
      name: 'smb123',
      comment: 'pool',
      enabled: true,
      audit: {
        enable: true,
      },
      options: {
        home: true,
      },
    },
  ] as SmbShare[];

  const slideInRef: SlideInRef<SmbShare | undefined, unknown> = {
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
            service: ServiceName.Cifs,
            state: ServiceStatus.Stopped,
            enable: false,
          } as Service],
        },
      ],
    }),
  ];

  const createComponent = createComponentFactory({
    component: SmbCardComponent,
    imports: commonImports,
    providers: [
      ...commonProviders,
      mockApi([
        mockCall('sharing.smb.query', smbShares),
        mockCall('sharing.smb.delete'),
        // Return a truthy share so accumulateLoadingState's `!!value` filter
        // lets the success handler (reload + toast) run.
        mockCall('sharing.smb.update', { id: 3 } as SmbShare),
        mockCall('sharing.smb.getacl', { share_name: 'test' } as SmbSharesec),
        mockCall('pool.query', [{ path: '/mnt/APPS' }] as Pool[]),
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

      const router = spectator.inject(Router);
      Object.defineProperty(router, 'url', {
        value: '/sharing',
        writable: false,
      });
    });

    it('should show table rows', async () => {
      expect(await table.getHeaderTexts()).toEqual(['Name', 'Path', 'Description', 'Enabled', 'Audit Logging', '']);
      expect(await table.getAllRowTexts()).toEqual([
        ['smb123', '/mnt/APPS/smb1', 'pool', '', 'Yes', ''],
      ]);
    });

    it('shows form to edit an existing SMB Share when Edit button is pressed', async () => {
      const menu = await openRowMenu();
      await menu.clickItem({ label: /^Edit$/ });

      expect(spectator.inject(SlideIn).open).toHaveBeenCalledWith(SmbFormComponent, {
        data: { existingSmbShare: expect.objectContaining(smbShares[0]) },
      });
    });

    it('shows confirmation to delete SMB Share when Delete button is pressed', async () => {
      const menu = await openRowMenu();
      await menu.clickItem({ label: 'Delete' });

      expect(spectator.inject(DialogService).confirmDelete).toHaveBeenCalled();
    });

    it('updates SMB Enabled status once toggle is updated', async () => {
      const toggle = await loader.getHarness(TnSlideToggleHarness.with({ ancestor: 'tn-table' }));

      expect(await toggle.isChecked()).toBe(true);

      await toggle.uncheck();

      expect(spectator.inject(ApiService).call).toHaveBeenCalledWith(
        'sharing.smb.update',
        [3, { enabled: false }],
      );
      expect(spectator.inject(SnackbarService).success).toHaveBeenCalledWith('SMB share «smb123» disabled');
    });

    it('handles edit Share ACL', async () => {
      const menu = await openRowMenu();
      await menu.clickItem({ label: 'Edit Share ACL' });

      expect(spectator.inject(ApiService).call).toHaveBeenCalledWith(
        'sharing.smb.getacl',
        [{ share_name: 'homes' }],
      );

      expect(spectator.inject(SlideIn).open).toHaveBeenCalledWith(SmbAclComponent, { data: 'test' });
    });

    it('handles edit Filesystem ACL', async () => {
      const router = spectator.inject(Router);
      jest.spyOn(router, 'navigate').mockImplementation();

      const menu = await openRowMenu();
      await menu.clickItem({ label: 'Edit Filesystem ACL' });

      expect(router.navigate).toHaveBeenCalledWith(
        ['/', 'datasets', 'acl', 'edit'],
        { queryParams: { path: '/mnt/APPS/smb1', returnUrl: '/sharing' } },
      );
    });

    it('should not disable toggle when share is on an active pool', async () => {
      const toggle = await loader.getHarness(TnSlideToggleHarness.with({ ancestor: 'tn-table' }));
      expect(await toggle.isDisabled()).toBe(false);
    });
  });

  describe('with exported pool shares', () => {
    const createExportedComponent = createComponentFactory({
      component: SmbCardComponent,
      imports: commonImports,
      providers: [
        ...commonProviders,
        mockApi([
          mockCall('sharing.smb.query', [{
            ...smbShares[0],
            path: '/mnt/exported/data',
          }] as SmbShare[]),
          mockCall('sharing.smb.delete'),
          mockCall('sharing.smb.update'),
          mockCall('sharing.smb.getacl', { share_name: 'test' } as SmbSharesec),
          mockCall('pool.query', [{ path: '/mnt/APPS' }] as Pool[]),
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

    it('should disable Edit Share ACL for exported pool shares', async () => {
      const menu = await openRowMenu();
      expect(await menu.isItemDisabled({ label: 'Edit Share ACL' })).toBe(true);
    });

    it('should disable Edit Filesystem ACL for exported pool shares', async () => {
      const menu = await openRowMenu();
      expect(await menu.isItemDisabled({ label: 'Edit Filesystem ACL' })).toBe(true);
    });
  });

  describe('with locked shares', () => {
    const createLockedComponent = createComponentFactory({
      component: SmbCardComponent,
      imports: commonImports,
      providers: [
        ...commonProviders,
        mockApi([
          mockCall('sharing.smb.query', [{
            ...smbShares[0],
            locked: true,
          }] as SmbShare[]),
          mockCall('sharing.smb.delete'),
          mockCall('sharing.smb.update'),
          mockCall('sharing.smb.getacl', { share_name: 'test' } as SmbSharesec),
          mockCall('pool.query', [{ path: '/mnt/APPS' }] as Pool[]),
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

    it('should disable Edit Share ACL for locked shares', async () => {
      const menu = await openRowMenu();
      expect(await menu.isItemDisabled({ label: 'Edit Share ACL' })).toBe(true);
    });

    it('should disable Edit Filesystem ACL for locked shares', async () => {
      const menu = await openRowMenu();
      expect(await menu.isItemDisabled({ label: 'Edit Filesystem ACL' })).toBe(true);
    });
  });
});
