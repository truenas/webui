import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatButtonHarness } from '@angular/material/button/testing';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { MockComponents } from 'ng-mocks';
import { NgxSkeletonLoaderComponent } from 'ngx-skeleton-loader';
import { of } from 'rxjs';
import { mockWebsocket, mockCall } from 'app/core/testing/utils/mock-websocket.utils';
import { DatasetType } from 'app/enums/dataset.enum';
import { DatasetQuota } from 'app/interfaces/dataset-quota.interface';
import { DatasetDetails } from 'app/interfaces/dataset.interface';
import { DatasetCapacityManagementCardComponent } from 'app/pages/datasets/components/dataset-capacity-management-card/dataset-capacity-management-card.component';
import { DatasetCapacitySettingsComponent } from 'app/pages/datasets/components/dataset-capacity-management-card/dataset-capacity-settings/dataset-capacity-settings.component';
import { SpaceManagementChartComponent } from 'app/pages/datasets/components/dataset-capacity-management-card/space-management-chart/space-management-chart.component';
import { DatasetTreeStore } from 'app/pages/datasets/store/dataset-store.service';
import { IxSlideInService } from 'app/services/ix-slide-in.service';

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
    declarations: [
      MockComponents(
        SpaceManagementChartComponent,
        NgxSkeletonLoaderComponent,
      ),
    ],
    providers: [
      mockWebsocket([
        mockCall('pool.dataset.get_quota', [
          { id: 1 },
          { id: 2 },
        ] as DatasetQuota[]),
      ]),
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
      expect(chartExtra.length).toEqual(2);
      expect(chartExtra[0].querySelector('.label')).toHaveText('Reserved for Dataset:');
      expect(chartExtra[0].querySelector('.value')).toHaveText('1 KiB');
      expect(chartExtra[1].querySelector('.label')).toHaveText('Reserved for Dataset & Children:');
      expect(chartExtra[1].querySelector('.value')).toHaveText('4 KiB');
    });

    it('shows details block', () => {
      const details = spectator.queryAll('.details');
      expect(details.length).toEqual(2);

      let items = details[0].querySelectorAll('.details-item');
      expect(items.length).toEqual(3);
      expect(items[0].querySelector('.label')).toHaveText('Space Available to Dataset  :');
      expect(items[0].querySelector('.value')).toHaveText('1 GiB');
      expect(items[1].querySelector('.label')).toHaveText('Applied Dataset Quota:');
      expect(items[1].querySelector('.value')).toHaveText('8 MiB');
      expect(items[2].querySelector('.label')).toHaveText('Inherited Quotas:');
      expect(items[2].querySelector('.value')).toHaveText('16 MiB');

      items = details[1].querySelectorAll('.details-item');
      expect(items.length).toEqual(2);
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
      expect(spectator.query('mat-card-header button')).toHaveText('Edit');
    });

    it('shows SpaceManagementChartComponent', () => {
      expect(spectator.query(SpaceManagementChartComponent).dataset).toBe(datasetZvol);
    });

    it('shows chart block', () => {
      const chartExtra = spectator.query('.chart-extra').querySelectorAll('.details-item');
      expect(chartExtra.length).toEqual(2);
      expect(chartExtra[0].querySelector('.label')).toHaveText('Provisioning Type:');
      expect(chartExtra[0].querySelector('.value')).toHaveText('Thick');
      expect(chartExtra[1].querySelector('.label')).toHaveText('Volume Size:');
      expect(chartExtra[1].querySelector('.value')).toHaveText('2 KiB');
    });

    it('shows details block', () => {
      const details = spectator.queryAll('.details');
      expect(details.length).toEqual(2);

      let items = details[0].querySelectorAll('.details-item');
      expect(items.length).toEqual(2);
      expect(items[0].querySelector('.label')).toHaveText('Space Available to Zvol  :');
      expect(items[0].querySelector('.value')).toHaveText('3 GiB');
      expect(items[1].querySelector('.label')).toHaveText('Inherited Quotas:');
      expect(items[1].querySelector('.value')).toHaveText('16 MiB');

      items = details[1].querySelectorAll('.details-item');
      expect(items.length).toEqual(2);
      expect(items[0]).toHaveText('User Quotas: None');
      expect(items[1]).toHaveText('Group Quotas: None');
    });
  });

  beforeEach(() => {
    spectator = createComponent({
      props: {
        dataset: datasetZvol,
      },
    });
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  it('opens capacity settings form when Edit button is clicked', async () => {
    const ixSlideInService = spectator.inject(IxSlideInService);
    jest.spyOn(ixSlideInService, 'open').mockImplementation();

    const editButton = await loader.getHarness(MatButtonHarness.with({ text: 'Edit' }));
    await editButton.click();

    expect(ixSlideInService.open).toHaveBeenCalledWith(DatasetCapacitySettingsComponent, { wide: true });
  });
});
