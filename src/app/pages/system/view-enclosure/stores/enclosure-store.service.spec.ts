import { createServiceFactory, SpectatorService } from '@ngneat/spectator';
import { mockProvider } from '@ngneat/spectator/jest';
import { EnclosureDispersalStrategy, MockStorageScenario } from 'app/core/testing/enums/mock-storage.enum';
import { MockStorageGenerator } from 'app/core/testing/utils/mock-storage-generator.utils';
import { mockCall, mockWebsocket } from 'app/core/testing/utils/mock-websocket.utils';
import { TopologyItemType } from 'app/enums/v-dev-type.enum';
import {
  EnclosureElement, EnclosureElementsGroup,
  EnclosureSlot,
  EnclosureView,
} from 'app/interfaces/enclosure.interface';
import { Pool } from 'app/interfaces/pool.interface';
import { DialogService } from 'app/services/dialog.service';
import { StorageService } from 'app/services/storage.service';
import { EnclosureState, EnclosureStore } from './enclosure-store.service';

describe('EnclosureStore', () => {
  let spectator: SpectatorService<EnclosureStore>;

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

    const createService = createServiceFactory({
      service: EnclosureStore,
      providers: [
        StorageService,
        mockWebsocket([
          mockCall('enclosure.query', mockStorage.enclosures),
          mockCall('pool.query', [mockStorage.poolState as unknown as Pool]),
          mockCall('disk.query', mockStorage.disks),
        ]),
        mockProvider(DialogService),
      ],
    });

    beforeEach(() => {
      spectator = createService();
    });

    it('should receive authentic Mock data', () => {
      expect(mockStorage.poolState.topology.data.length).toBeGreaterThan(0);
      expect(mockStorage.disks).toHaveLength(42);

      const controllerSlots: EnclosureElement[] = mockStorage.getEnclosureSlots(0);
      const shelfSlots: EnclosureElement[] = mockStorage.getEnclosureSlots(1);
      expect(controllerSlots).toHaveLength(24);
      expect(shelfSlots).toHaveLength(24);
    });

    it('loads data and generates correct views data', () => {
      expect(1).toBe(1);
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

    const createService = createServiceFactory({
      service: EnclosureStore,
      providers: [
        StorageService,
        mockWebsocket([
          mockCall('enclosure.query', mockStorage.enclosures),
          mockCall('pool.query', [mockStorage.poolState as unknown as Pool]),
          mockCall('disk.query', mockStorage.disks),
        ]),
        mockProvider(DialogService),
      ],
    });

    beforeEach(() => {
      spectator = createService();
    });

    it('should properly merge M50/M60 enclosures into single enclosure view', () => {
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

        // M50/M60 report 24 slot front chassis and a separate 4 slot rear chassis
        // the EnclosureStore should merge these into a single 28 slot chassis to make it consistent
        // with all other models.
        expect(views).toHaveLength(2);
        expect(views[0].slots).toHaveLength(28);
        expect(views[1].slots).toHaveLength(24);
      });
    });
  });

  describe('scenarios with MINI-R data', () => {
    const mockStorage = new MockStorageGenerator();
    const mockModel = 'MINI-R';

    mockStorage.addDataTopology({
      scenario: MockStorageScenario.MixedVdevLayout,
      layout: TopologyItemType.Mirror,
      diskSize: 4,
      width: 2,
      repeats: 3,
    }).addSpecialTopology({
      scenario: MockStorageScenario.Uniform,
      layout: TopologyItemType.Mirror,
      diskSize: 4,
      width: 2,
      repeats: 0,
    }).addEnclosures({
      controllerModel: mockModel,
      expansionModels: [],
      dispersal: EnclosureDispersalStrategy.Default,
    });

    const createService = createServiceFactory({
      service: EnclosureStore,
      providers: [
        StorageService,
        mockWebsocket([
          mockCall('enclosure.query', mockStorage.enclosures),
          mockCall('pool.query', [mockStorage.poolState as unknown as Pool]),
          mockCall('disk.query', mockStorage.disks),
        ]),
        mockProvider(DialogService),
      ],
    });

    beforeEach(() => {
      spectator = createService();
    });

    it('should be treated as rackmount server', () => {
      spectator.service.loadData();
      spectator.service.data$.subscribe((data: EnclosureState) => {
        if (
          data.areDisksLoading
          && data.arePoolsLoading
          && data.areEnclosuresLoading
        ) {
          return;
        }

        // No shelves or rear slots and should be marked as rackmount
        expect(data.enclosures).toHaveLength(1);
        expect(data.enclosureViews[0].isRackmount).toBeTruthy();
      });
    });

    it('should have exactly 12 slots', () => {
      spectator.service.loadData();
      spectator.service.data$.subscribe((data: EnclosureState) => {
        if (
          data.areDisksLoading
          && data.arePoolsLoading
          && data.areEnclosuresLoading
        ) {
          return;
        }

        // Make sure there is only one enclosure with 12 slots
        const slots = (data.enclosures[0].elements as EnclosureElementsGroup[])[0].elements;
        expect(data.enclosures).toHaveLength(1);
        expect(slots).toHaveLength(12);
        expect(data.enclosureViews).toHaveLength(1);
        expect(data.enclosureViews[0].slots).toHaveLength(12);
      });
    });

    it('should have the correct amount of empty slots', () => {
      spectator.service.loadData();
      spectator.service.data$.subscribe((data: EnclosureState) => {
        const emptySlots = (data.enclosures[0].elements[0] as EnclosureElementsGroup).elements
          .filter((element: EnclosureElement) => element.status === 'Not installed');
        const emptyViewSlots = data.enclosureViews[0].slots
          .filter((slot: EnclosureSlot) => slot.slotStatus === 'Not installed');

        expect(emptySlots).toHaveLength(4);
        expect(emptyViewSlots).toHaveLength(4);
      });
    });
  });
});
