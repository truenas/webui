import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { TnButtonHarness } from '@truenas/ui-components';
import { MockComponents, MockModule } from 'ng-mocks';
import { NgxSkeletonLoaderModule } from 'ngx-skeleton-loader';
import { of } from 'rxjs';
import { mockApi, mockCall } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { DatasetTier } from 'app/enums/dataset-tier.enum';
import { DatasetType } from 'app/enums/dataset.enum';
import { OnOff } from 'app/enums/on-off.enum';
import { ZfsPropertySource } from 'app/enums/zfs-property-source.enum';
import { DatasetQuota } from 'app/interfaces/dataset-quota.interface';
import { DatasetDetails } from 'app/interfaces/dataset.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { FileSizePipe } from 'app/modules/pipes/file-size/file-size.pipe';
import { FormSidePanelService } from 'app/modules/slide-ins/form-side-panel/form-side-panel.service';
import { SlideInResult } from 'app/modules/slide-ins/slide-in-result';
import { DatasetCapacityManagementCardComponent } from 'app/pages/datasets/components/dataset-capacity-management-card/dataset-capacity-management-card.component';
import { DatasetCapacitySettingsComponent } from 'app/pages/datasets/components/dataset-capacity-management-card/dataset-capacity-settings/dataset-capacity-settings.component';
import { SpaceManagementChartComponent } from 'app/pages/datasets/components/dataset-capacity-management-card/space-management-chart/space-management-chart.component';
import { DatasetTreeStore } from 'app/pages/datasets/store/dataset-store.service';
import { SharingTierService } from 'app/pages/sharing/components/sharing-tier.service';

const datasetQuotas = {
  refreservation: {
    parsed: 1024,
  },
  reservation: {
    parsed: 4096,
  },
  quota: {
    parsed: 8388608,
  },
  readonly: {
    parsed: false,
    rawvalue: 'off',
    value: OnOff.Off,
    source: ZfsPropertySource.Local,
  },
} as DatasetDetails;

const datasetFilesystem = {
  ...datasetQuotas,
  id: 'filesystem pool',
  type: DatasetType.Filesystem,
  available: {
    parsed: 1395752960,
  },
} as DatasetDetails;

const datasetZvol = {
  ...datasetQuotas,
  id: 'zvol pool',
  type: DatasetType.Volume,
  available: {
    parsed: 1395752960 * 2,
  },
  volsize: {
    parsed: 2048,
  },
  thick_provisioned: true,
} as DatasetDetails;

describe('DatasetCapacityManagementCardComponent', () => {
  let spectator: Spectator<DatasetCapacityManagementCardComponent>;
  let loader: HarnessLoader;
  const createComponent = createComponentFactory({
    component: DatasetCapacityManagementCardComponent,
    imports: [
      FileSizePipe,
    ],
    componentProviders: [
      MockModule(NgxSkeletonLoaderModule),
    ],
    declarations: [
      MockComponents(
        SpaceManagementChartComponent,
      ),
    ],
    providers: [
      mockAuth(),
      mockApi([
        mockCall('pool.dataset.get_quota', [
          { id: 1, quota: 200 },
          { id: 2, quota: 200 },
        ] as DatasetQuota[]),
      ]),
      mockProvider(DialogService),
      mockProvider(DatasetTreeStore, {
        datasetUpdated: jest.fn(),
        selectedBranch$: of([{
          id: 'quota',
          name: 'quota',
          quota: {
            parsed: 16777216,
          },
        }]),
      }),
      mockProvider(FormSidePanelService, {
        open: jest.fn(() => SlideInResult.empty()),
      }),
      mockProvider(SharingTierService, {
        getTierConfig: () => of({ enabled: false }),
        tierEnabled: () => false,
      }),
    ],
  });

  describe('renders component when dataset type is "Filesystem"', () => {
    beforeEach(() => {
      spectator = createComponent({
        props: {
          dataset: datasetFilesystem,
        },
      });
    });

    it('shows header', () => {
      expect(spectator.query('.tn-card__title')).toHaveText('Space Management');
    });

    it('shows Edit button in footer', async () => {
      const editLoader = TestbedHarnessEnvironment.loader(spectator.fixture);
      const editButtons = await editLoader.getAllHarnesses(TnButtonHarness.with({ label: 'Edit' }));
      expect(editButtons).toHaveLength(1);
    });

    it('shows SpaceManagementChartComponent', () => {
      expect(spectator.query(SpaceManagementChartComponent)!.dataset).toBe(datasetFilesystem);
    });

    it('shows chart block', () => {
      const chartExtra = spectator.query('.chart-extra')!.querySelectorAll('.details-item');
      expect(chartExtra).toHaveLength(2);
      expect(chartExtra[0].querySelector('.label')).toHaveText('Reserved for Dataset:');
      expect(chartExtra[0].querySelector('.value')).toHaveText('1 KiB');
      expect(chartExtra[1].querySelector('.label')).toHaveText('Reserved for Dataset & Children:');
      expect(chartExtra[1].querySelector('.value')).toHaveText('4 KiB');
    });

    it('shows details block', () => {
      const details = spectator.queryAll('.details');
      expect(details).toHaveLength(2);

      let items = details[0].querySelectorAll('.details-item');
      expect(items).toHaveLength(3);
      expect(items[0].querySelector('.label')).toHaveText('Available Space:');
      expect(items[0].querySelector('.value')).toHaveText('1.3 GiB');
      expect(items[1].querySelector('.label')).toHaveText('Applied Dataset Quota:');
      expect(items[1].querySelector('.value')).toHaveText('8 MiB');
      expect(items[2].querySelector('.label')).toHaveText('Inherited Quotas:');
      expect(items[2].querySelector('.value')).toHaveText('16 MiB');

      items = details[1].querySelectorAll('.details-item');
      expect(items).toHaveLength(2);
      expect(items[0].querySelector('.label')).toHaveText('User Quotas:');
      expect(items[0].querySelector('.value')).toHaveText('Quotas set for 2 users');
      expect(items[1].querySelector('.label')).toHaveText('Group Quotas:');
      expect(items[1].querySelector('.value')).toHaveText('Quotas set for 2 groups');
    });
  });

  describe('renders component when dataset type is "Zvol"', () => {
    beforeEach(() => {
      spectator = createComponent({
        props: {
          dataset: datasetZvol,
        },
      });
    });

    it('shows header', () => {
      expect(spectator.query('.tn-card__title')).toHaveText('Zvol Space Management');
    });

    it('does not show Edit button for zvol', async () => {
      const editLoader = TestbedHarnessEnvironment.loader(spectator.fixture);
      const editButtons = await editLoader.getAllHarnesses(TnButtonHarness.with({ label: 'Edit' }));
      expect(editButtons).toHaveLength(0);
    });

    it('shows SpaceManagementChartComponent', () => {
      expect(spectator.query(SpaceManagementChartComponent)!.dataset).toBe(datasetZvol);
    });

    it('shows chart block', () => {
      const chartExtra = spectator.query('.chart-extra')!.querySelectorAll('.details-item');
      expect(chartExtra).toHaveLength(2);
      expect(chartExtra[0].querySelector('.label')).toHaveText('Provisioning Type:');
      expect(chartExtra[0].querySelector('.value')).toHaveText('Thick');
      expect(chartExtra[1].querySelector('.label')).toHaveText('Volume Size:');
      expect(chartExtra[1].querySelector('.value')).toHaveText('2 KiB');
    });

    it('shows only space details block and not quotas', () => {
      const details = spectator.queryAll('.details');
      expect(details).toHaveLength(1);

      const items = details[0].querySelectorAll('.details-item');
      expect(items).toHaveLength(2);
      expect(items[0].querySelector('.label')).toHaveText('Space Available to Zvol:');
      expect(items[0].querySelector('.value')).toHaveText('2.6 GiB');
      expect(items[1].querySelector('.label')).toHaveText('Inherited Quotas:');
      expect(items[1].querySelector('.value')).toHaveText('16 MiB');
    });
  });

  beforeEach(() => {
    spectator = createComponent({
      props: {
        dataset: datasetFilesystem,
      },
    });
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  it('opens capacity settings form when Edit button is clicked', async () => {
    const editButton = await loader.getHarness(TnButtonHarness.with({ label: 'Edit' }));
    await editButton.click();

    expect(spectator.inject(FormSidePanelService).open)
      .toHaveBeenCalledWith(DatasetCapacitySettingsComponent, {
        title: 'Capacity Settings',
        wide: true,
        inputs: { datasetToEdit: datasetFilesystem },
      });
  });

  describe('tiering', () => {
    const createTieredComponent = createComponentFactory({
      component: DatasetCapacityManagementCardComponent,
      imports: [
        FileSizePipe,
      ],
      componentProviders: [
        MockModule(NgxSkeletonLoaderModule),
      ],
      declarations: [
        MockComponents(SpaceManagementChartComponent),
      ],
      providers: [
        mockAuth(),
        mockApi([
          mockCall('pool.dataset.get_quota', []),
          mockCall('zpool.query', [{
            name: 'dozer',
            properties: {
              class_special_available: { value: 1024 * 1024 * 1024 * 5 },
            },
          }] as never),
        ]),
        mockProvider(DialogService),
        mockProvider(DatasetTreeStore, {
          datasetUpdated: jest.fn(),
          selectedBranch$: of([]),
        }),
        mockProvider(FormSidePanelService, { open: jest.fn(() => SlideInResult.empty()) }),
        mockProvider(SharingTierService, {
          getTierConfig: () => of({ enabled: true }),
          tierEnabled: () => true,
        }),
      ],
    });

    it('uses "Available to Dataset (Regular Tier)" label when tiering is enabled', () => {
      spectator = createTieredComponent({
        props: {
          dataset: { ...datasetFilesystem, pool: 'dozer', tier: { tier_type: DatasetTier.Regular } } as DatasetDetails,
        },
      });
      const label = spectator.queryAll('.details .details-item .label')[0];
      expect(label).toHaveText('Available to Dataset (Regular Tier):');
    });

    it('shows "Pool Performance Tier Available" when dataset is on the Performance tier', () => {
      spectator = createTieredComponent({
        props: {
          dataset: {
            ...datasetFilesystem,
            pool: 'dozer',
            tier: { tier_type: DatasetTier.Performance },
          } as DatasetDetails,
        },
      });
      const labels = Array.from(spectator.queryAll('.details .details-item .label'));
      const perfRow = labels.find((el) => el.textContent?.includes('Pool Performance Tier Available'));
      expect(perfRow).toBeTruthy();
      expect(perfRow!.nextElementSibling).toHaveText('5 GiB');
    });

    it('does not show Pool Performance Tier row when dataset is on the Regular tier', () => {
      spectator = createTieredComponent({
        props: {
          dataset: {
            ...datasetFilesystem,
            pool: 'dozer',
            tier: { tier_type: DatasetTier.Regular },
          } as DatasetDetails,
        },
      });
      const labels = Array.from(spectator.queryAll('.details .details-item .label'));
      expect(labels.find((el) => el.textContent?.includes('Pool Performance Tier Available'))).toBeFalsy();
    });
  });
});
