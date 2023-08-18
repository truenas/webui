import { SpectatorService, createServiceFactory } from '@ngneat/spectator/jest';
import { TestScheduler } from 'rxjs/testing';
import { getTestScheduler } from 'app/core/testing/utils/get-test-scheduler.utils';
import { mockCall, mockWebsocket } from 'app/core/testing/utils/mock-websocket.utils';
import { Dataset } from 'app/interfaces/dataset.interface';
import { Pool } from 'app/interfaces/pool.interface';
import { DashboardStorageStore } from 'app/pages/dashboard/store/dashboard-storage-store.service';

const mockDatasets = [
  {
    name: 'APPS',
    id: 'dataset_id1',
    used: { parsed: 1024 },
    available: { parsed: 1024 },
  },
  {
    name: 'POOL',
    id: 'dataset_id2',
    used: { parsed: 512 },
    available: { parsed: 1024 },
  },
] as Dataset[];

describe('DashboardStorageStoreService', () => {
  let spectator: SpectatorService<DashboardStorageStore>;
  let testScheduler: TestScheduler;

  const createService = createServiceFactory({
    service: DashboardStorageStore,
    providers: [
      mockWebsocket([
        mockCall('pool.query', [
          {
            name: 'pool2',
          } as Pool,
        ]),
        mockCall('pool.dataset.query', mockDatasets),
      ]),
    ],
  });

  beforeEach(() => {
    spectator = createService();

    testScheduler = getTestScheduler();
  });

  it('emits the correct state value', () => {
    testScheduler.run(({ expectObservable }) => {
      expectObservable(spectator.service.state$).toBe('b', {
        b: {
          pools: [
            { name: 'pool2' },
          ],
          isLoading: false,
          volumesData: {
            dataset_id1: {
              avail: 1024,
              id: 'dataset_id1',
              name: 'APPS',
              used: 1024,
              used_pct: '50%',
            },
            dataset_id2: {
              avail: 1024,
              id: 'dataset_id2',
              name: 'POOL',
              used: 512,
              used_pct: '33%',
            },
          },
        },
      });
    });
  });
});
