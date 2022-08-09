import { createServiceFactory, SpectatorService } from '@ngneat/spectator';
import { mockProvider } from '@ngneat/spectator/jest';
import { TestScheduler } from 'rxjs/testing';
import { Pool } from 'app/interfaces/pool.interface';
import { PoolsDashboardStore } from 'app/pages/storage2/stores/pools-dashboard-store.service';
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

  it('loads pool topology, disks and sets loading indicators when loadNodes is called', () => {
    testScheduler.run(({ cold, expectObservable }) => {
      const mockWebsocket = spectator.inject(WebSocketService);
      const pools = [
        { name: 'pool1' },
        { name: 'pool2' },
      ] as Pool[];
      jest.spyOn(mockWebsocket, 'call').mockReturnValue(cold('-b|', { b: pools }));

      spectator.service.loadDashboard();
      expectObservable(spectator.service.state$).toBe('ab', {
        a: {
          isLoading: true,
          pools: [],
        },
        b: {
          isLoading: false,
          pools: [
            { name: 'pool1' },
            { name: 'pool2' },
          ],
        },
      });
    });
  });
});
