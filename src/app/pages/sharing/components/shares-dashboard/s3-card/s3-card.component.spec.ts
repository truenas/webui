import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatMenuHarness } from '@angular/material/menu/testing';
import { MatSlideToggleHarness } from '@angular/material/slide-toggle/testing';
import { Router } from '@angular/router';
import { Spectator } from '@ngneat/spectator';
import { createComponentFactory, mockProvider } from '@ngneat/spectator/jest';
import { provideMockStore } from '@ngrx/store/testing';
import { MockComponents } from 'ng-mocks';
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
import { IxTableHarness } from 'app/modules/ix-table/components/ix-table/ix-table.harness';
import {
  IxTablePagerShowMoreComponent,
} from 'app/modules/ix-table/components/ix-table-pager-show-more/ix-table-pager-show-more.component';
import { SlideIn } from 'app/modules/slide-ins/slide-in';
import { ApiService } from 'app/modules/websocket/api.service';
import { S3CardComponent } from 'app/pages/sharing/components/shares-dashboard/s3-card/s3-card.component';
import { ServiceExtraActionsComponent } from 'app/pages/sharing/components/shares-dashboard/service-extra-actions/service-extra-actions.component';
import { ServiceStateButtonComponent } from 'app/pages/sharing/components/shares-dashboard/service-state-button/service-state-button.component';
import { mockSharingTierService } from 'app/pages/sharing/components/testing/mock-sharing-tier.utils';
import { S3BucketFormComponent } from 'app/pages/sharing/s3/s3-bucket-form/s3-bucket-form.component';
import { selectServices } from 'app/store/services/services.selectors';

describe('S3CardComponent', () => {
  let spectator: Spectator<S3CardComponent>;
  let loader: HarnessLoader;
  let table: IxTableHarness;

  const buckets = [
    {
      id: 10,
      name: 'photos',
      dataset: 'tank/buckets/photos',
      owner: 'alice',
      enabled: true,
      locked: false,
    },
  ] as S3Bucket[];

  const buildFactory = (
    rows: S3Bucket[],
    tierOpts: Parameters<typeof mockSharingTierService>[0] = {},
  ): ReturnType<typeof createComponentFactory<S3CardComponent>> => createComponentFactory({
    component: S3CardComponent,
    imports: [IxTablePagerShowMoreComponent],
    declarations: [
      MockComponents(
        ServiceStateButtonComponent,
        ServiceExtraActionsComponent,
      ),
    ],
    providers: [
      mockAuth(),
      mockApi([
        mockCall('sharing.s3.query', rows),
        mockCall('sharing.s3.delete'),
        mockCall('sharing.s3.update'),
        mockCall('pool.query', [{ path: '/mnt/tank' }] as Pool[]),
      ]),
      mockSharingTierService(tierOpts),
      mockProvider(DialogService, {
        confirm: jest.fn(() => of(true)),
      }),
      mockProvider(SlideIn, {
        open: jest.fn(() => of({ response: true })),
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
              service: ServiceName.S3,
              state: ServiceStatus.Stopped,
              enable: false,
            } as Service],
          },
        ],
      }),
    ],
  });

  const createComponent = buildFactory(buckets);

  beforeEach(async () => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    table = await loader.getHarness(IxTableHarness);
  });

  it('shows table rows', async () => {
    const cells = await table.getCellTexts();
    expect(cells).toEqual([
      ['Name', 'Dataset', 'Owner', 'Enabled', ''],
      ['photos', 'tank/buckets/photos', 'alice', '', ''],
    ]);
  });

  it('opens form to edit an existing bucket when Edit is pressed', async () => {
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
      queryParams: { path: '/mnt/tank/buckets/photos/s3data', returnUrl: router.url },
    });
  });

  it('confirms and deletes a bucket when Delete is pressed', async () => {
    const [menu] = await loader.getAllHarnesses(MatMenuHarness.with({ selector: '[mat-icon-button]' }));
    await menu.open();
    await menu.clickItem({ text: 'Delete' });

    expect(spectator.inject(DialogService).confirm).toHaveBeenCalled();
    expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('sharing.s3.delete', [10]);
  });

  it('updates enabled state when toggle is changed', async () => {
    const toggle = await table.getHarnessInCell(MatSlideToggleHarness, 1, 3);
    expect(await toggle.isChecked()).toBe(true);

    await toggle.uncheck();

    expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('sharing.s3.update', [10, { enabled: false }]);
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
