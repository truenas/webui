import { createServiceFactory, SpectatorService } from '@ngneat/spectator';
import { mockProvider } from '@ngneat/spectator/jest';
import { Subject } from 'rxjs';
import { TestScheduler } from 'rxjs/testing';
import { getTestScheduler } from 'app/core/testing/utils/get-test-scheduler.utils';
import {
  EnclosureDispersalStrategy,
  MockStorageGenerator,
  MockStorageScenario,
} from 'app/core/testing/utils/mock-storage-generator.utils';
import { TopologyItemType } from 'app/enums/v-dev-type.enum';
import { ApiEvent } from 'app/interfaces/api-message.interface';
import {
  Enclosure,
  EnclosureElement,
  EnclosureSlot,
  EnclosureView,
} from 'app/interfaces/enclosure.interface';
import { Pool } from 'app/interfaces/pool.interface';
import { Disk } from 'app/interfaces/storage.interface';
import { DialogService, StorageService, WebSocketService } from 'app/services';
import { EnclosureState, EnclosureStore } from './enclosure-store.service';

describe('EnclosureStore', () => {
  const websocketSubscription$ = new Subject<ApiEvent<Pool>>();
  let spectator: SpectatorService<EnclosureStore>;
  let testScheduler: TestScheduler;
  const createService = createServiceFactory({
    service: EnclosureStore,
    providers: [
      StorageService,
      mockProvider(WebSocketService, {
        subscribe: jest.fn(() => websocketSubscription$),
      }),
      mockProvider(DialogService),
    ],
  });

  beforeEach(() => {
    spectator = createService();
    testScheduler = getTestScheduler();
  });

  describe('broadcast received and generated data', () => {
    const mockStorage = new MockStorageGenerator();
    const mockModel = 'M40';
    const mockShelf = 'ES24';

    mockStorage.addDataTopology({
      scenario: MockStorageScenario.MixedVdevLayout,
      layout: TopologyItemType.Mirror,
      diskSize: 4,
      width: 2,
      repeats: 20,
    }).addSpecialTopology({
      scenario: MockStorageScenario.Uniform,
      layout: TopologyItemType.Mirror,
      diskSize: 4,
      width: 2,
      repeats: 0,
    }).addEnclosures({
      controllerModel: mockModel,
      expansionModels: [mockShelf],
      dispersal: EnclosureDispersalStrategy.Default,
    });

    it('should receive authentic Mock data', () => {
      expect(mockStorage.poolState.topology.data.length).toBeGreaterThan(0);
      expect(mockStorage.disks).toHaveLength(42);

      const controllerSlots: EnclosureElement[] = mockStorage.getEnclosureSlots(0);
      const shelfSlots: EnclosureElement[] = mockStorage.getEnclosureSlots(1);
      expect(controllerSlots).toHaveLength(24);
      expect(shelfSlots).toHaveLength(24);
    });

    it('loads data and generates views data', () => {
      testScheduler.run(({ cold }) => {
        const mockWebsocket: WebSocketService = spectator.inject(WebSocketService);
        const poolResponse: Pool[] = [mockStorage.poolState];
        const diskResponse: Disk[] = mockStorage.disks;
        const enclosureResponse: Enclosure[] = mockStorage.enclosures;

        jest.spyOn(mockWebsocket, 'call').mockImplementation((method: string) => {
          switch (method) {
            case 'pool.query':
              return cold('-a|', { a: poolResponse });
            case 'disk.query':
              return cold('-a|', { a: [...diskResponse] });
            case 'enclosure.query':
              return cold('-a|', { a: [...enclosureResponse] });
            default:
              throw new Error(`Unexpected method: ${method}`);
          }
        });

        spectator.service.loadData();
        spectator.service.data$.subscribe((data: EnclosureState) => {
          if (
            data.areDisksLoading
            && data.arePoolsLoading
            && data.areEnclosuresLoading
          ) {
            return;
          }

          expect(data.enclosures).toHaveLength(2);
        });

        spectator.service.enclosureViews$.subscribe((views: EnclosureView[]) => {
          if (!views.length) return;

          expect(views).toHaveLength(2);
          expect(views[0].slots).toHaveLength(24);
          expect(views[1].slots).toHaveLength(24);

          const emptySlots = views[1].slots.filter((slot: EnclosureSlot) => !slot.disk);
          expect(emptySlots).toHaveLength(6);
        });
      });
    });
  });

  describe('scenarios with M50/M60 plx chassis', () => {
    const mockStorage = new MockStorageGenerator();
    const mockModel = 'M50';
    const mockShelf = 'ES24';

    mockStorage.addDataTopology({
      scenario: MockStorageScenario.MixedVdevLayout,
      layout: TopologyItemType.Mirror,
      diskSize: 4,
      width: 2,
      repeats: 20,
    }).addSpecialTopology({
      scenario: MockStorageScenario.Uniform,
      layout: TopologyItemType.Mirror,
      diskSize: 4,
      width: 2,
      repeats: 0,
    }).addEnclosures({
      controllerModel: mockModel,
      expansionModels: [mockShelf],
      dispersal: EnclosureDispersalStrategy.Default,
    });

    it('should properly merge M50/M60 enclosures into single enclosure view', () => {
      testScheduler.run(({ cold }) => {
        const mockWebsocket: WebSocketService = spectator.inject(WebSocketService);
        const poolResponse: Pool[] = [mockStorage.poolState];
        const diskResponse: Disk[] = mockStorage.disks;
        const enclosureResponse: Enclosure[] = mockStorage.enclosures;

        jest.spyOn(mockWebsocket, 'call').mockImplementation((method: string) => {
          switch (method) {
            case 'pool.query':
              return cold('-a|', { a: poolResponse });
            case 'disk.query':
              return cold('-a|', { a: [...diskResponse] });
            case 'enclosure.query':
              return cold('-a|', { a: [...enclosureResponse] });
            default:
              throw new Error(`Unexpected method: ${method}`);
          }
        });

        spectator.service.loadData();
        spectator.service.data$.subscribe((data: EnclosureState) => {
          if (
            data.areDisksLoading
            && data.arePoolsLoading
            && data.areEnclosuresLoading
          ) {
            return;
          }

          expect(data.enclosures).toHaveLength(3);
        });

        spectator.service.enclosureViews$.subscribe((views: EnclosureView[]) => {
          if (!views.length) return;

          // M50/M60 report 24 bay front chassis and a separate 4 bay rear chassis
          // the EnclosureStore should merge these into a single 28 bay chassis to make it consistent
          // with all other models.
          expect(views).toHaveLength(2);
          expect(views[0].slots).toHaveLength(28);
          expect(views[1].slots).toHaveLength(24);
        });
      });
    });
  });
});
