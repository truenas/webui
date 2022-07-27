import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { MockComponents } from 'ng-mocks';
import { NgxSkeletonLoaderComponent } from 'ngx-skeleton-loader';
import { of } from 'rxjs';
import { mockWebsocket, mockCall } from 'app/core/testing/utils/mock-websocket.utils';
import { DatasetType } from 'app/enums/dataset.enum';
import { DatasetQuota } from 'app/interfaces/dataset-quota.interface';
import { Dataset } from 'app/interfaces/dataset.interface';
import { DatasetCapacityManagementCardComponent } from 'app/pages/datasets/components/dataset-capacity-management-card/dataset-capacity-management-card.component';
import { SpaceManagementChartComponent } from 'app/pages/datasets/components/space-management-chart/space-management-chart.component';
import { DatasetInTree } from 'app/pages/datasets/store/dataset-in-tree.interface';
import { DatasetTreeStore } from 'app/pages/datasets/store/dataset-store.service';

const datasetFilesystem = {
  id: 'filesystem pool',
  type: DatasetType.Filesystem,
  available: {
    parsed: 1395752960,
  },
} as DatasetInTree;

const datasetZvol = {
  id: 'zvol pool',
  type: DatasetType.Volume,
  available: {
    parsed: 1395752960 * 2,
  },
} as DatasetInTree;

describe('DatasetCapacityManagementCardComponent', () => {
  let spectator: Spectator<DatasetCapacityManagementCardComponent>;
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
        mockCall('pool.dataset.query', [{
          refreservation: {
            parsed: 1024,
          },
          reservation: {
            parsed: 4096,
          },
          volsize: {
            parsed: 2048,
          },
          quota: {
            parsed: 8388608,
          },
        } as Dataset]),
        mockCall('pool.dataset.get_quota', [
          { id: 1 },
          { id: 2 },
        ] as DatasetQuota[]),
      ]),
      mockProvider(DatasetTreeStore, {
        datasetUpdated: jest.fn(),
        selectedBranch$: of([{
          id: 'quota',
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
      expect(spectator.query('mat-card-header')).toHaveText('Dataset Space ManagementEdit');
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
      expect(items[0].querySelector('.label')).toHaveText('Space Available to Dataset:');
      expect(items[0].querySelector('.value')).toHaveText('1 GiB');
      expect(items[1].querySelector('.label')).toHaveText('Applied Dataset Quotas:');
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
      expect(spectator.query('mat-card-header')).toHaveText('Zvol Space ManagementEdit');
    });

    it('shows SpaceManagementChartComponent', () => {
      expect(spectator.query(SpaceManagementChartComponent).dataset).toBe(datasetZvol);
    });

    it('shows chart block', () => {
      const chartExtra = spectator.query('.chart-extra').querySelectorAll('.details-item');
      expect(chartExtra.length).toEqual(1);
      expect(chartExtra[0].querySelector('.label')).toHaveText('Volume Size:');
      expect(chartExtra[0].querySelector('.value')).toHaveText('2 KiB');
    });

    it('shows details block', () => {
      const details = spectator.queryAll('.details');
      expect(details.length).toEqual(2);

      let items = details[0].querySelectorAll('.details-item');
      expect(items.length).toEqual(2);
      expect(items[0].querySelector('.label')).toHaveText('Space Available to Zvol:');
      expect(items[0].querySelector('.value')).toHaveText('3 GiB');
      expect(items[1].querySelector('.label')).toHaveText('Inherited Quotas:');
      expect(items[1].querySelector('.value')).toHaveText('16 MiB');

      items = details[1].querySelectorAll('.details-item');
      expect(items.length).toEqual(2);
      expect(items[0]).toHaveText('User Quotas: None');
      expect(items[1]).toHaveText('Group Quotas: None');
    });
  });
});
