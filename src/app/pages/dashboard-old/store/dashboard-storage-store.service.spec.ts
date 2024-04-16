import { SpectatorService, createServiceFactory } from '@ngneat/spectator/jest';
import { TestScheduler } from 'rxjs/testing';
import { getTestScheduler } from 'app/core/testing/utils/get-test-scheduler.utils';
import { mockCall, mockWebSocket } from 'app/core/testing/utils/mock-websocket.utils';
import { Dataset } from 'app/interfaces/dataset.interface';
import { Pool } from 'app/interfaces/pool.interface';
import { DashboardStorageStore } from 'app/pages/dashboard-old/store/dashboard-storage-store.service';
import { WebSocketService } from 'app/services/ws.service';

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
      mockWebSocket([
        mockCall('pool.query', [{ name: 'pool2' }] as Pool[]),
        mockCall('pool.dataset.query', mockDatasets),
      ]),
    ],
  });

  beforeEach(() => {
    spectator = createService();

    testScheduler = getTestScheduler();
  });

  it('emits the correct state value', () => {
    expect(spectator.inject(WebSocketService).callAndSubscribe).toHaveBeenCalledWith('pool.query');
    expect(spectator.inject(WebSocketService).call).toHaveBeenCalledWith('pool.dataset.query', [
      [], { extra: { retrieve_children: false } },
    ]);

    testScheduler.run(({ expectObservable }) => {
      expectObservable(spectator.service.state$).toBe('b', {
        b: {
          pools: [
            { name: 'pool2' },
          ],
          isLoading: false,
          volumesData: new Map([
            ['dataset_id1', {
              avail: 1024,
              id: 'dataset_id1',
              name: 'APPS',
              used: 1024,
              used_pct: '50%',
            }],
            ['dataset_id2', {
              avail: 1024,
              id: 'dataset_id2',
              name: 'POOL',
              used: 512,
              used_pct: '33%',
            }],
          ]),
        },
      });
    });
  });
});
