import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatButtonHarness } from '@angular/material/button/testing';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { MockComponents, MockModule } from 'ng-mocks';
import { NgxSkeletonLoaderModule } from 'ngx-skeleton-loader';
import { of } from 'rxjs';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { mockWebSocket, mockCall } from 'app/core/testing/utils/mock-websocket.utils';
import { DatasetType } from 'app/enums/dataset.enum';
import { DatasetQuota } from 'app/interfaces/dataset-quota.interface';
import { DatasetDetails } from 'app/interfaces/dataset.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { FileSizePipe } from 'app/modules/pipes/file-size/file-size.pipe';
import { DatasetCapacityManagementCardComponent } from 'app/pages/datasets/components/dataset-capacity-management-card/dataset-capacity-management-card.component';
import { DatasetCapacitySettingsComponent } from 'app/pages/datasets/components/dataset-capacity-management-card/dataset-capacity-settings/dataset-capacity-settings.component';
import { SpaceManagementChartComponent } from 'app/pages/datasets/components/dataset-capacity-management-card/space-management-chart/space-management-chart.component';
import { DatasetTreeStore } from 'app/pages/datasets/store/dataset-store.service';
import { SlideInService } from 'app/services/slide-in.service';

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
      mockWebSocket([
        mockCall('pool.dataset.get_quota', [
          { id: 1 },
          { id: 2 },
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
      mockProvider(SlideInService, {
        open: jest.fn(() => ({
          slideInClosed$: of(),
        })),
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
      expect(spectator.query('mat-card-header h3')).toHaveText('Dataset Space Management');
      expect(spectator.query('mat-card-header button')).toHaveText('Edit');
    });

    it('shows SpaceManagementChartComponent', () => {
      expect(spectator.query(SpaceManagementChartComponent).dataset).toBe(datasetFilesystem);
    });

    it('shows chart block', () => {
      const chartExtra = spectator.query('.chart-extra').querySelectorAll('.details-item');
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
      expect(items[0].querySelector('.label')).toHaveText('Space Available to Dataset:');
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
      expect(spectator.query('mat-card-header h3')).toHaveText('Zvol Space Management');
      expect(spectator.query('mat-card-header button')).not.toExist();
    });

    it('shows SpaceManagementChartComponent', () => {
      expect(spectator.query(SpaceManagementChartComponent).dataset).toBe(datasetZvol);
    });

    it('shows chart block', () => {
      const chartExtra = spectator.query('.chart-extra').querySelectorAll('.details-item');
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
    const editButton = await loader.getHarness(MatButtonHarness.with({ text: 'Edit' }));
    await editButton.click();

    expect(spectator.inject(SlideInService).open)
      .toHaveBeenCalledWith(DatasetCapacitySettingsComponent, { data: datasetFilesystem, wide: true });
  });
});
