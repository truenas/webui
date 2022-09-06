import { createServiceFactory, SpectatorService } from '@ngneat/spectator';
import { mockProvider } from '@ngneat/spectator/jest';
import { TestScheduler } from 'rxjs/testing';
import { Dataset } from 'app/interfaces/dataset.interface';
import { Pool } from 'app/interfaces/pool.interface';
import { PoolsDashboardStore } from 'app/pages/storage/stores/pools-dashboard-store.service';
import { DialogService, StorageService, WebSocketService } from 'app/services';

describe('PoolsDashboardStore', () => {
  let spectator: SpectatorService<PoolsDashboardStore>;
  let testScheduler: TestScheduler;
  const createService = createServiceFactory({
    service: PoolsDashboardStore,
    providers: [
      StorageService,
      mockProvider(WebSocketService),
      mockProvider(DialogService),
    ],
  });

  beforeEach(() => {
    spectator = createService();
    testScheduler = new TestScheduler((actual, expected) => {
      expect(actual).toEqual(expected);
    });
  });

  it('loads pool topology and root datasets and sets loading indicators when loadNodes is called', () => {
    testScheduler.run(({ cold, expectObservable }) => {
      const mockWebsocket = spectator.inject(WebSocketService);
      const pools = [
        { name: 'pool1' },
        { name: 'pool2' },
      ] as Pool[];
      const rootDatasets = [
        { id: 'pool1' },
        { id: 'pool2' },
      ] as Dataset[];
      jest.spyOn(mockWebsocket, 'call').mockImplementation((method: string) => {
        if (method === 'pool.dataset.query') {
          return cold('-a|', { a: rootDatasets });
        }
        return cold('-a|', { a: pools });
      });

      spectator.service.loadDashboard();
      expectObservable(spectator.service.state$).toBe('a-b', {
        a: {
          isLoading: true,
          pools: [],
          rootDatasets: {},
        },
        b: {
          isLoading: false,
          pools: [
            { name: 'pool1' },
            { name: 'pool2' },
          ],
          rootDatasets: {
            pool1: { id: 'pool1' },
            pool2: { id: 'pool2' },
          },
        },
      });
    });
  });
});
