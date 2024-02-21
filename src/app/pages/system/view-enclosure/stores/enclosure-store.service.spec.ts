import { createServiceFactory, SpectatorService } from '@ngneat/spectator';
import { mockProvider } from '@ngneat/spectator/jest';
import { EnclosureDispersalStrategy, MockStorageScenario } from 'app/core/testing/enums/mock-storage.enum';
import { MockStorageGenerator } from 'app/core/testing/utils/mock-storage-generator.utils';
import { mockCall, mockWebsocket } from 'app/core/testing/utils/mock-websocket.utils';
import { TopologyItemType } from 'app/enums/v-dev-type.enum';
import {
  EnclosureUi, EnclosureUiSlot,
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
          mockCall('webui.enclosure.dashboard', mockStorage.enclosures),
          mockCall('pool.query', [mockStorage.poolState as unknown as Pool]),
          mockCall('disk.query', mockStorage.disks),
        ]),
        mockProvider(DialogService),
      ],
    });

    beforeEach(() => {
      spectator = createService();
    });

    it.skip('should receive authentic Mock data', () => {
      expect(mockStorage.poolState.topology.data.length).toBeGreaterThan(0);
      expect(mockStorage.disks).toHaveLength(42);

      const controllerSlots: [string, EnclosureUiSlot][] = mockStorage.getEnclosureSlots(mockStorage.enclosures[0].id);
      const shelfSlots: [string, EnclosureUiSlot][] = mockStorage.getEnclosureSlots(mockStorage.enclosures[1].id);
      expect(controllerSlots).toHaveLength(24);
      expect(shelfSlots).toHaveLength(24);
    });

    it.skip('loads data and generates correct views data', () => {
      expect(1).toBe(1);
      spectator.service.loadData();
      spectator.service.data$.subscribe((data: EnclosureState) => {
        if (
          data.areEnclosuresLoading
          // && data.areDisksLoading
          // && data.arePoolsLoading
        ) {
          return;
        }

        expect(data.enclosures).toHaveLength(2);
      });

      spectator.service.enclosureViews$.subscribe((views: EnclosureUi[]) => {
        if (!views.length) return;

        expect(views).toHaveLength(2);
        expect(Object.keys(views[0].elements['Array Device Slot'])).toHaveLength(24);
        expect(Object.keys(views[1].elements['Array Device Slot'])).toHaveLength(24);

        const emptySlots = Object.entries(views[1].elements['Array Device Slot'])
          .map((keyValue: [string, EnclosureUiSlot]) => keyValue[1])
          .filter((slot: EnclosureUiSlot) => !slot.dev);
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
          mockCall('webui.enclosure.dashboard', mockStorage.enclosures),
          mockCall('pool.query', [mockStorage.poolState as unknown as Pool]),
          mockCall('disk.query', mockStorage.disks),
        ]),
        mockProvider(DialogService),
      ],
    });

    beforeEach(() => {
      spectator = createService();
    });

    it.skip('should properly merge M50/M60 enclosures into single enclosure view', () => {
      spectator.service.loadData();
      spectator.service.data$.subscribe((data: EnclosureState) => {
        if (
          data.areEnclosuresLoading
          // && data.areDisksLoading
          // && data.arePoolsLoading
        ) {
          return;
        }

        expect(data.enclosures).toHaveLength(3);
      });

      spectator.service.enclosureViews$.subscribe((views: EnclosureUi[]) => {
        if (!views.length) return;

        // M50/M60 report 24 slot front chassis and a separate 4 slot rear chassis
        // the EnclosureStore should merge these into a single 28 slot chassis to make it consistent
        // with all other models.
        expect(views).toHaveLength(2);
        expect(Object.keys(views[0].elements['Array Device Slot'])).toHaveLength(28);
        expect(Object.keys(views[1].elements['Array Device Slot'])).toHaveLength(24);
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
          mockCall('webui.enclosure.dashboard', mockStorage.enclosures),
          mockCall('pool.query', [mockStorage.poolState as unknown as Pool]),
          mockCall('disk.query', mockStorage.disks),
        ]),
        mockProvider(DialogService),
      ],
    });

    beforeEach(() => {
      spectator = createService();
    });

    it.skip('should be treated as rackmount server', () => {
      spectator.service.loadData();
      spectator.service.data$.subscribe((data: EnclosureState) => {
        if (
          data.areEnclosuresLoading
          // && data.areDisksLoading
          // && data.arePoolsLoading
        ) {
          return;
        }

        // No shelves or rear slots and should be marked as rackmount
        expect(data.enclosures).toHaveLength(1);
        expect(data.enclosures[0].rackmount).toBeTruthy();
      });
    });

    it.skip('should have exactly 12 slots', () => {
      spectator.service.loadData();
      spectator.service.data$.subscribe((data: EnclosureState) => {
        if (
          data.areEnclosuresLoading
          // && data.areDisksLoading
          // && data.arePoolsLoading
        ) {
          return;
        }

        // Make sure there is only one enclosure with 12 slots
        const slots = data.enclosures[0].elements;// (data.enclosures[0].elements)[0].elements;
        expect(data.enclosures).toHaveLength(1);
        expect(slots).toHaveLength(12);
        expect(data.enclosures).toHaveLength(1);
        expect(Object.keys(data.enclosures[0].elements['Array Device Slot'])).toHaveLength(12);
      });
    });

    it.skip('should have the correct amount of empty slots', () => {
      spectator.service.loadData();
      spectator.service.data$.subscribe((data: EnclosureState) => {
        const emptySlots = Object.entries(data.enclosures[0].elements['Array Device Slot'])
          .filter((keyValue: [string, EnclosureUiSlot]) => keyValue[1].status.includes('Not installed'));

        expect(emptySlots).toHaveLength(4);
      });
    });
  });
});
