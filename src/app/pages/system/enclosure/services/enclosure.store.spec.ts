import {
  createServiceFactory,
  mockProvider,
  SpectatorService,
} from '@ngneat/spectator/jest';
import { EventUnion } from '@truenas/api-client';
import { MockApiService } from 'app/core/testing/classes/mock-api.service';
import { mockApi, mockCall, settleApi } from 'app/core/testing/utils/mock-api.utils';
import { CollectionChangeType } from 'app/enums/api.enum';
import { DriveBayLightStatus, EnclosureElementType } from 'app/enums/enclosure-slot-status.enum';
import {
  DashboardEnclosure,
  DashboardEnclosureElements,
  DashboardEnclosureSlot, EnclosureVdevDisk,
} from 'app/interfaces/enclosure.interface';
import { ThemeService } from 'app/modules/theme/theme.service';
import { ApiService } from 'app/modules/websocket/api.service';
import { WebUiApiDirectory } from 'app/modules/websocket/typed-api/typed-api-client.token';
import { EnclosureStore } from 'app/pages/system/enclosure/services/enclosure.store';
import { EnclosureView } from 'app/pages/system/enclosure/types/enclosure-view.enum';
import { EnclosureSide } from 'app/pages/system/enclosure/utils/supported-enclosures';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';

describe('EnclosureStore', () => {
  let spectator: SpectatorService<EnclosureStore>;
  const enclosures = [
    {
      id: 'enc1',
      elements: {
        [EnclosureElementType.ArrayDeviceSlot]: {
          1: {
            drive_bay_number: 1,
            pool_info: {
              pool_name: 'pool1',
            },
          } as DashboardEnclosureSlot,
        },
      } as DashboardEnclosureElements,
    },
    {
      id: 'enc2',
      elements: {
        [EnclosureElementType.ArrayDeviceSlot]: {
          4: {
            drive_bay_number: 4,
            pool_info: {
              pool_name: 'pool2',
            },
          } as DashboardEnclosureSlot,
        },
      } as DashboardEnclosureElements,
    },
  ] as DashboardEnclosure[];
  const createService = createServiceFactory({
    service: EnclosureStore,
    providers: [
      mockApi([
        mockCall('webui.enclosure.dashboard', enclosures),
      ]),
      mockProvider(ThemeService),
      mockProvider(ErrorHandlerService),
    ],
  });

  beforeEach(async () => {
    spectator = createService();
    spectator.service.initiate();
    await settleApi();
  });

  describe('initiate', () => {
    it('loads dashboard information', () => {
      expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('webui.enclosure.dashboard');

      expect(spectator.service.enclosures()).toEqual(enclosures);
      expect(spectator.service.isLoading()).toBe(false);
      expect(spectator.service.selectedEnclosure()).toEqual(enclosures[0]);
      expect(spectator.service.selectedSlot()).toBeNull();
      expect(spectator.service.selectedView()).toBe(EnclosureView.Pools);
      expect(spectator.service.selectedSide()).toBe(EnclosureSide.Front);
    });

    it('resets the selection when called again', async () => {
      spectator.service.selectEnclosure('enc2');
      spectator.service.selectSlot(4);
      spectator.service.selectView(EnclosureView.Expanders);

      spectator.service.initiate();
      expect(spectator.service.isLoading()).toBe(true);
      await settleApi();

      expect(spectator.service.isLoading()).toBe(false);
      expect(spectator.service.selectedEnclosure()).toEqual(enclosures[0]);
      expect(spectator.service.selectedSlot()).toBeNull();
      expect(spectator.service.selectedView()).toBe(EnclosureView.Pools);
    });

    it('clears the loading indicator, shows the error and can be called again when loading fails', async () => {
      const mockApiService = spectator.inject(MockApiService);
      mockApiService.mockCallError('webui.enclosure.dashboard');

      spectator.service.initiate();
      await settleApi();

      expect(spectator.service.isLoading()).toBe(false);
      expect(spectator.service.enclosures()).toEqual([]);
      expect(spectator.inject(ErrorHandlerService).showErrorModal).toHaveBeenCalled();

      mockApiService.mockCall('webui.enclosure.dashboard', enclosures);
      spectator.service.initiate();
      await settleApi();

      expect(spectator.service.enclosures()).toEqual(enclosures);
    });
  });

  describe('listenForDiskUpdates', () => {
    afterEach(() => {
      jest.useRealTimers();
    });

    it('updates dashboard information when disks are changed, keeping the selection', async () => {
      jest.useFakeTimers();
      const updatedEnclosures = [enclosures[0], { ...enclosures[1], label: 'updated' }];
      const mockApiService = spectator.inject(MockApiService);
      mockApiService.mockCall('webui.enclosure.dashboard', updatedEnclosures);
      spectator.service.selectEnclosure('enc2');
      spectator.service.selectSlot(4);
      spectator.service.listenForDiskUpdates().subscribe();

      mockApiService.emitEvent('disk.query', {
        id: 'test-id-1',
        msg: CollectionChangeType.Changed,
        collection: 'disk.query',
        fields: null,
      } as unknown as EventUnion<WebUiApiDirectory, 'disk.query'>);

      await jest.advanceTimersByTimeAsync(1 * 1000);
      expect(spectator.inject(ApiService).subscribe).toHaveBeenCalledWith('disk.query');
      expect(spectator.inject(ApiService).call).toHaveBeenLastCalledWith('webui.enclosure.dashboard');

      expect(spectator.service.enclosures()).toEqual(updatedEnclosures);
      expect(spectator.service.selectedEnclosure()).toEqual(updatedEnclosures[1]);
      expect(spectator.service.selectedSlot()).toEqual(
        updatedEnclosures[1].elements[EnclosureElementType.ArrayDeviceSlot][4],
      );
    });
  });

  describe('selectEnclosure', () => {
    it('selects new enclosure and resets the slot, side and view', () => {
      spectator.service.selectSlot(1);
      spectator.service.selectSide(EnclosureSide.Internal);
      spectator.service.selectView(EnclosureView.Expanders);

      spectator.service.selectEnclosure('enc2');

      expect(spectator.service.selectedEnclosure()).toEqual(enclosures[1]);
      expect(spectator.service.selectedSlot()).toBeNull();
      expect(spectator.service.selectedView()).toBe(EnclosureView.Pools);
      expect(spectator.service.selectedSide()).toBe(EnclosureSide.Front);
    });

    it('keeps the current selection when the enclosure is already selected', () => {
      spectator.service.selectSlot(1);
      spectator.service.selectView(EnclosureView.Expanders);

      spectator.service.selectEnclosure('enc1');

      expect(spectator.service.selectedSlot()).toEqual(enclosures[0].elements[EnclosureElementType.ArrayDeviceSlot][1]);
      expect(spectator.service.selectedView()).toBe(EnclosureView.Expanders);
    });

    it('falls back to the first enclosure when the id does not exist', () => {
      spectator.service.selectEnclosure('enc2');

      spectator.service.selectEnclosure('non-existent');

      expect(spectator.service.selectedEnclosure()).toEqual(enclosures[0]);
    });
  });

  describe('renameSelectedEnclosure', () => {
    it('renames selected enclosure', () => {
      spectator.service.renameSelectedEnclosure('new label');

      expect(spectator.service.enclosures()[0].label).toBe('new label');
      expect(spectator.service.enclosures()[1].label).toBeUndefined();
    });
  });

  describe('selectSlot', () => {
    it('updates selected slot', () => {
      const slot = enclosures[0].elements[EnclosureElementType.ArrayDeviceSlot][1];

      spectator.service.selectSlot(slot.drive_bay_number!);

      expect(spectator.service.selectedSlot()).toEqual(slot);
    });
  });

  describe('selectSlotByVdevDisk', () => {
    it('switches to vdev disk enclosure and slot', () => {
      spectator.service.selectSlotByVdevDisk({
        slot: 4,
        enclosure_id: 'enc2',
      } as EnclosureVdevDisk);

      expect(spectator.service.selectedEnclosure()).toEqual(enclosures[1]);
      expect(spectator.service.selectedSlot()).toEqual(enclosures[1].elements[EnclosureElementType.ArrayDeviceSlot][4]);
      expect(spectator.service.selectedView()).toBe(EnclosureView.Pools);
      expect(spectator.service.selectedSide()).toBe(EnclosureSide.Front);
    });
  });

  describe('selectView', () => {
    it('updates selected view', () => {
      spectator.service.selectView(EnclosureView.Expanders);

      expect(spectator.service.selectedView()).toBe(EnclosureView.Expanders);
    });
  });

  describe('selectSide', () => {
    it('updates selected side and clears the slot', () => {
      spectator.service.selectSlot(1);

      spectator.service.selectSide(EnclosureSide.Internal);

      expect(spectator.service.selectedSide()).toBe(EnclosureSide.Internal);
      expect(spectator.service.selectedSlot()).toBeNull();
    });

    it('keeps the slot when the side is already selected', () => {
      spectator.service.selectSlot(1);

      spectator.service.selectSide(EnclosureSide.Front);

      expect(spectator.service.selectedSlot()).toEqual(enclosures[0].elements[EnclosureElementType.ArrayDeviceSlot][1]);
    });
  });

  describe('changeLightStatus', () => {
    it('updates the light status of the drive bay without touching the loaded data', () => {
      spectator.service.selectSlot(1);

      spectator.service.changeLightStatus({
        enclosureId: 'enc1',
        driveBayNumber: 1,
        status: DriveBayLightStatus.On,
      });

      expect(spectator.service.selectedSlot()?.drive_bay_light_status).toBe(DriveBayLightStatus.On);
      expect(enclosures[0].elements[EnclosureElementType.ArrayDeviceSlot][1].drive_bay_light_status).toBeUndefined();
    });

    it('does nothing when the enclosure does not exist', () => {
      const before = spectator.service.enclosures();

      spectator.service.changeLightStatus({
        enclosureId: 'non-existent',
        driveBayNumber: 1,
        status: DriveBayLightStatus.On,
      });

      expect(spectator.service.enclosures()).toBe(before);
    });
  });

  describe('selectors', () => {
    it('selectedEnclosureSlots - returns slots of currently selected enclosure', async () => {
      spectator.service.initiate();
      await settleApi();

      spectator.service.selectEnclosure('enc2');

      expect(spectator.service.selectedEnclosureSlots()).toMatchObject([{
        drive_bay_number: 4,
        pool_info: { pool_name: 'pool2' },
      }]);
    });

    it('poolColors - returns dictionary of pools and their colors', () => {
      jest.spyOn(spectator.inject(ThemeService), 'getRgbBackgroundColorByIndex').mockImplementation((index) => {
        return ['red', 'blue', 'green'][index];
      });

      const poolColors = spectator.service.poolColors();

      expect(poolColors).toEqual({
        pool1: 'red',
        pool2: 'blue',
      });
    });
  });
});
