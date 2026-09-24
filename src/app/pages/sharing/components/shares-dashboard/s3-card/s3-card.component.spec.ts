import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { Router } from '@angular/router';
import { Spectator } from '@ngneat/spectator';
import { createComponentFactory, mockProvider } from '@ngneat/spectator/jest';
import { provideMockStore } from '@ngrx/store/testing';
import {
  TnButtonHarness, TnDialog, TnIconButtonHarness, TnMenuHarness, TnMenuTesting, TnSlideToggleHarness, TnTableHarness,
} from '@truenas/ui-components';
import { Subject, of } from 'rxjs';
import { mockApi, mockCall } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { DatasetTier } from 'app/enums/dataset-tier.enum';
import { ServiceName } from 'app/enums/service-name.enum';
import { ServiceStatus } from 'app/enums/service-status.enum';
import { Pool } from 'app/interfaces/pool.interface';
import { S3Bucket } from 'app/interfaces/s3.interface';
import { Service } from 'app/interfaces/service.interface';
import { ZfsTierRewriteJobEntry } from 'app/interfaces/zfs-tier.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { LoaderService } from 'app/modules/loader/loader.service';
import { FormSidePanelService } from 'app/modules/slide-ins/form-side-panel/form-side-panel.service';
import { SlideInResult } from 'app/modules/slide-ins/slide-in-result';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import {
  TablePagerShowMoreComponent,
} from 'app/modules/tn-table/components/table-pager-show-more/table-pager-show-more.component';
import { ApiService } from 'app/modules/websocket/api.service';
import { S3CardComponent } from 'app/pages/sharing/components/shares-dashboard/s3-card/s3-card.component';
import { mockSharingTierService } from 'app/pages/sharing/components/testing/mock-sharing-tier.utils';
import { S3BucketFormComponent } from 'app/pages/sharing/s3/s3-bucket-form/s3-bucket-form.component';
import { selectServices } from 'app/store/services/services.selectors';

describe('S3CardComponent', () => {
  let spectator: Spectator<S3CardComponent>;
  let loader: HarnessLoader;
  let table: TnTableHarness;

  const buckets = [
    {
      id: 10,
      name: 'photos',
      dataset: 'tank/buckets/photos',
      owner: 'alice',
      enabled: true,
      locked: false,
      // Carries tier info so the tiering-disabled test below pins that clause, not a missing tier.
      tier: { tier_type: DatasetTier.Regular, tier_job: null },
    },
  ] as S3Bucket[];

  /** What `sharing.s3.query` answers, so a test can shape the row its action reads. */
  let listedBuckets: S3Bucket[];

  const commonProviders = [
    mockAuth(),
    mockApi([
      mockCall('sharing.s3.query', () => listedBuckets),
      mockCall('sharing.s3.delete'),
      mockCall('sharing.s3.update', { id: 10 } as S3Bucket),
      mockCall('pool.query', [{ path: '/mnt/tank' }] as Pool[]),
    ]),
    mockProvider(DialogService, {
      confirm: jest.fn(() => of(true)),
      confirmDelete: jest.fn(() => of(undefined)),
    }),
    mockProvider(TnDialog, {
      open: jest.fn(() => ({ closed: of(true) })),
    }),
    mockProvider(LoaderService, {
      withLoader: jest.fn(() => (source$: unknown) => source$),
    }),
    mockProvider(FormSidePanelService, {
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
            service: ServiceName.S3,
            state: ServiceStatus.Stopped,
            enable: false,
          } as Service],
        },
      ],
    }),
  ];

  const createComponent = createComponentFactory({
    component: S3CardComponent,
    imports: [TablePagerShowMoreComponent],
    providers: [...commonProviders, mockSharingTierService({ enabled: false })],
  });

  async function openRowMenu(): Promise<TnMenuHarness> {
    const trigger = await loader.getHarness(TnIconButtonHarness.with({ name: 'dots-vertical', ancestor: 'tn-table' }));
    await trigger.click();
    return TnMenuTesting.rootLoader(spectator.fixture).getHarness(TnMenuHarness);
  }

  beforeEach(async () => {
    listedBuckets = buckets;
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    table = await loader.getHarness(TnTableHarness);
  });

  it('shows table rows', async () => {
    expect(await table.getHeaderTexts()).toEqual(['Name', 'Dataset', 'Owner', 'Enabled', '']);
    expect(await table.getAllRowTexts()).toEqual([
      ['photos', 'tank/buckets/photos', 'alice', '', ''],
    ]);
  });

  it('opens the bucket form in a side panel when Add is pressed', async () => {
    const addButton = await loader.getHarness(TnButtonHarness.with({ label: 'Add' }));
    await addButton.click();

    expect(spectator.inject(FormSidePanelService).open).toHaveBeenCalledWith(S3BucketFormComponent, {
      title: 'Add S3 Bucket',
      inputs: { bucket: undefined },
    });
  });

  it('opens the bucket form with the row when Edit is pressed', async () => {
    const menu = await openRowMenu();
    await menu.clickItem({ label: /^Edit$/ });

    expect(spectator.inject(FormSidePanelService).open).toHaveBeenCalledWith(S3BucketFormComponent, {
      title: 'Edit S3 Bucket',
      inputs: { bucket: expect.objectContaining(buckets[0]) },
    });
  });

  it('navigates to the filesystem ACL editor for the bucket data directory when Edit Filesystem ACL is pressed', async () => {
    const router = spectator.inject(Router);
    jest.spyOn(router, 'navigate').mockImplementation();

    const menu = await openRowMenu();
    await menu.clickItem({ label: 'Edit Filesystem ACL' });

    expect(router.navigate).toHaveBeenCalledWith(['/', 'datasets', 'acl', 'edit'], {
      queryParams: { path: '/mnt/tank/buckets/photos/s3data', returnUrl: router.url },
    });
  });

  it('confirms deletion when Delete is pressed', async () => {
    const menu = await openRowMenu();
    await menu.clickItem({ label: 'Delete' });

    expect(spectator.inject(DialogService).confirmDelete).toHaveBeenCalledWith({
      title: expect.any(String),
      message: expect.any(String),
      call: expect.any(Function),
    });
  });

  it('updates enabled state when the row toggle is changed', async () => {
    const toggle = await loader.getHarness(TnSlideToggleHarness.with({ ancestor: 'tn-table' }));
    expect(await toggle.isChecked()).toBe(true);

    await toggle.uncheck();

    expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('sharing.s3.update', [10, { enabled: false }]);
    expect(spectator.inject(SnackbarService).success).toHaveBeenCalledWith('S3 bucket «photos» disabled');
  });

  it('does not offer Change Storage Tier when tiering is disabled', async () => {
    const menu = await openRowMenu();
    expect(await menu.getItemLabels()).not.toContain('Change Storage Tier');
  });

  describe('with tiering enabled', () => {
    const tier = { tier_type: DatasetTier.Regular, tier_job: null };

    const createTierComponent = createComponentFactory({
      component: S3CardComponent,
      imports: [TablePagerShowMoreComponent],
      providers: [...commonProviders, mockSharingTierService({ enabled: true })],
    });

    async function createWithBuckets(rows: S3Bucket[]): Promise<void> {
      listedBuckets = rows;
      spectator = createTierComponent();
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
      table = await loader.getHarness(TnTableHarness);
    }

    it('shows the Storage Tier column before the actions column', async () => {
      await createWithBuckets([{ ...buckets[0], tier }]);

      expect(await table.getHeaderTexts()).toEqual(['Name', 'Dataset', 'Owner', 'Enabled', 'Storage Tier', '']);
      expect(await table.getAllRowTexts()).toEqual([
        ['photos', 'tank/buckets/photos', 'alice', '', 'Regular', ''],
      ]);
    });

    it('offers Change Storage Tier for a bucket with tier info', async () => {
      await createWithBuckets([{ ...buckets[0], tier }]);

      const menu = await openRowMenu();
      expect(await menu.getItemLabels()).toContain('Change Storage Tier');
    });

    it('does not offer Change Storage Tier for a bucket without tier info', async () => {
      await createWithBuckets([{ ...buckets[0], tier: null }]);

      const menu = await openRowMenu();
      expect(await menu.getItemLabels()).not.toContain('Change Storage Tier');
    });
  });

  // Its own block with its own Subject: the mock's job subscription outlives the component,
  // so a Subject shared with other tests would keep their destroyed components subscribed.
  describe('tier job refresh', () => {
    const tierJobUpdates$ = new Subject<ZfsTierRewriteJobEntry>();

    const createTierJobComponent = createComponentFactory({
      component: S3CardComponent,
      imports: [TablePagerShowMoreComponent],
      providers: [...commonProviders, mockSharingTierService({ enabled: true, jobUpdates$: tierJobUpdates$ })],
    });

    it('reloads buckets when a tier job update is emitted', () => {
      listedBuckets = [{ ...buckets[0], tier: { tier_type: DatasetTier.Regular, tier_job: null } }];
      spectator = createTierJobComponent();
      const loadSpy = jest.spyOn(spectator.component.dataProvider, 'load');

      tierJobUpdates$.next({ tier_job_id: 'job-1' } as ZfsTierRewriteJobEntry);

      expect(loadSpy).toHaveBeenCalledTimes(1);
    });
  });
});
