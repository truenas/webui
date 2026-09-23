import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MatMenuHarness } from '@angular/material/menu/testing';
import { Router } from '@angular/router';
import { Spectator, createComponentFactory, mockProvider } from '@ngneat/spectator/jest';
import { provideMockStore } from '@ngrx/store/testing';
import { Subject, of } from 'rxjs';
import { mockApi, mockCall } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { DatasetTier } from 'app/enums/dataset-tier.enum';
import { S3ObjectOwnership, S3PermissionsModel, S3Versioning } from 'app/enums/s3.enum';
import { Pool } from 'app/interfaces/pool.interface';
import { S3Bucket } from 'app/interfaces/s3.interface';
import { ZfsTierRewriteJobEntry } from 'app/interfaces/zfs-tier.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { EmptyService } from 'app/modules/empty/empty.service';
import { BasicSearchComponent } from 'app/modules/forms/search-input/components/basic-search/basic-search.component';
import { IxTableHarness } from 'app/modules/ix-table/components/ix-table/ix-table.harness';
import {
  IxTableColumnsSelectorComponent,
} from 'app/modules/ix-table/components/ix-table-columns-selector/ix-table-columns-selector.component';
import { FakeProgressBarComponent } from 'app/modules/loader/components/fake-progress-bar/fake-progress-bar.component';
import { SlideIn } from 'app/modules/slide-ins/slide-in';
import { ApiService } from 'app/modules/websocket/api.service';
import { mockSharingTierService } from 'app/pages/sharing/components/testing/mock-sharing-tier.utils';
import { S3BucketFormComponent } from 'app/pages/sharing/s3/s3-bucket-form/s3-bucket-form.component';
import { S3BucketListComponent } from 'app/pages/sharing/s3/s3-bucket-list/s3-bucket-list.component';
import { selectPreferences } from 'app/store/preferences/preferences.selectors';

describe('S3BucketListComponent', () => {
  let spectator: Spectator<S3BucketListComponent>;
  let loader: HarnessLoader;
  let table: IxTableHarness;

  const buckets = [
    {
      id: 1,
      name: 'backups',
      dataset: 'tank/buckets/backups',
      owner: 'bob',
      permissions_model: S3PermissionsModel.S3,
      object_ownership: S3ObjectOwnership.BucketOwnerEnforced,
      versioning: S3Versioning.Enabled,
      object_lock: true,
      enabled: true,
      locked: false,
    },
  ] as S3Bucket[];

  const buildFactory = (
    rows: S3Bucket[],
    tierOpts: Parameters<typeof mockSharingTierService>[0] = {},
  ): ReturnType<typeof createComponentFactory<S3BucketListComponent>> => createComponentFactory({
    component: S3BucketListComponent,
    imports: [
      BasicSearchComponent,
      IxTableColumnsSelectorComponent,
      FakeProgressBarComponent,
    ],
    providers: [
      mockAuth(),
      mockProvider(EmptyService),
      mockSharingTierService(tierOpts),
      mockProvider(DialogService, {
        confirm: jest.fn(() => of(true)),
      }),
      mockProvider(SlideIn, {
        open: jest.fn(() => of({ response: true })),
      }),
      provideMockStore({
        selectors: [{ selector: selectPreferences, value: {} }],
      }),
      mockApi([
        mockCall('sharing.s3.query', rows),
        mockCall('sharing.s3.delete'),
        mockCall('sharing.s3.update'),
        mockCall('pool.query', [{ path: '/mnt/tank' }] as Pool[]),
      ]),
    ],
  });

  const createComponent = buildFactory(buckets);

  beforeEach(async () => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    table = await loader.getHarness(IxTableHarness);
  });

  it('shows the page title with the experimental badge', () => {
    expect(spectator.query('h3')).toHaveText('S3 Buckets');
    expect(spectator.query('.experimental-badge')).toHaveText('Experimental');
  });

  it('shows table rows', async () => {
    const cells = await table.getCellTexts();
    expect(cells).toEqual([
      ['Name', 'Dataset', 'Owner', 'Permissions Model', 'Versioning', 'Object Lock', 'Enabled', ''],
      ['backups', 'tank/buckets/backups', 'bob', 'S3', 'Enabled', 'Yes', '', ''],
    ]);
  });

  it('opens bucket form when Add is pressed', async () => {
    const addButton = await loader.getHarness(MatButtonHarness.with({ text: 'Add' }));
    await addButton.click();

    expect(spectator.inject(SlideIn).open).toHaveBeenCalledWith(S3BucketFormComponent);
  });

  it('opens bucket form for editing when Edit is pressed', async () => {
    const [menu] = await loader.getAllHarnesses(MatMenuHarness.with({ selector: '[mat-icon-button]' }));
    await menu.open();
    await menu.clickItem({ text: 'Edit' });

    expect(spectator.inject(SlideIn).open).toHaveBeenCalledWith(S3BucketFormComponent, {
      data: expect.objectContaining(buckets[0]),
    });
  });

  it('navigates to the filesystem ACL editor for the bucket data directory when Edit Filesystem ACL is pressed', async () => {
    const router = spectator.inject(Router);
    jest.spyOn(router, 'navigate').mockImplementation();

    const [menu] = await loader.getAllHarnesses(MatMenuHarness.with({ selector: '[mat-icon-button]' }));
    await menu.open();
    await menu.clickItem({ text: 'Edit Filesystem ACL' });

    expect(router.navigate).toHaveBeenCalledWith(['/', 'datasets', 'acl', 'edit'], {
      queryParams: { path: '/mnt/tank/buckets/backups/s3data', returnUrl: router.url },
    });
  });

  it('deletes a bucket after confirmation when Delete is pressed', async () => {
    const [menu] = await loader.getAllHarnesses(MatMenuHarness.with({ selector: '[mat-icon-button]' }));
    await menu.open();
    await menu.clickItem({ text: 'Delete' });

    expect(spectator.inject(DialogService).confirm).toHaveBeenCalled();
    expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('sharing.s3.delete', [1]);
  });

  describe('storage tier', () => {
    const tier = { tier_type: DatasetTier.Performance, tier_job: null };

    async function tierMenuItems(): Promise<string[]> {
      const [menu] = await loader.getAllHarnesses(MatMenuHarness.with({ selector: '[mat-icon-button]' }));
      await menu.open();
      const items = await menu.getItems({ text: /Change Storage Tier/ });
      return Promise.all(items.map((item) => item.getText()));
    }

    describe('with a tiered bucket', () => {
      const createTierComponent = buildFactory([{ ...buckets[0], tier }], { enabled: true });

      beforeEach(() => {
        spectator = createTierComponent();
        loader = TestbedHarnessEnvironment.loader(spectator.fixture);
      });

      it('shows Change Storage Tier in the action menu', async () => {
        expect(await tierMenuItems()).toEqual(['Change Storage Tier']);
      });
    });

    describe('with a bucket that has no tier info', () => {
      const createNoTierComponent = buildFactory([{ ...buckets[0], tier: null }], { enabled: true });

      beforeEach(() => {
        spectator = createNoTierComponent();
        loader = TestbedHarnessEnvironment.loader(spectator.fixture);
      });

      it('does not show Change Storage Tier in the action menu', async () => {
        expect(await tierMenuItems()).toEqual([]);
      });
    });

    describe('with a locked bucket', () => {
      const createLockedComponent = buildFactory([{ ...buckets[0], locked: true, tier }], { enabled: true });

      beforeEach(() => {
        spectator = createLockedComponent();
        loader = TestbedHarnessEnvironment.loader(spectator.fixture);
      });

      it('does not show Change Storage Tier in the action menu', async () => {
        expect(await tierMenuItems()).toEqual([]);
      });
    });

    describe('tier job refresh', () => {
      const jobUpdates$ = new Subject<ZfsTierRewriteJobEntry>();
      const createRefreshComponent = buildFactory(buckets, { enabled: true, jobUpdates$ });

      beforeEach(() => {
        spectator = createRefreshComponent();
      });

      it('reloads buckets when a tier job update is emitted', () => {
        const loadSpy = jest.spyOn(spectator.component.dataProvider, 'load');
        jobUpdates$.next({ tier_job_id: 'job-1' } as ZfsTierRewriteJobEntry);
        expect(loadSpy).toHaveBeenCalled();
      });
    });
  });
});
