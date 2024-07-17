import {
  createServiceFactory,
  mockProvider,
  SpectatorService,
} from '@ngneat/spectator/jest';
import { mockCall, mockWebSocket } from 'app/core/testing/utils/mock-websocket.utils';
import { EnclosureElementType } from 'app/enums/enclosure-slot-status.enum';
import {
  DashboardEnclosure,
  DashboardEnclosureElements,
  DashboardEnclosureSlot, EnclosureVdevDisk,
} from 'app/interfaces/enclosure.interface';
import { EnclosureStore } from 'app/pages/system/enclosure/services/enclosure.store';
import { EnclosureView } from 'app/pages/system/enclosure/types/enclosure-view.enum';
import { EnclosureSide } from 'app/pages/system/enclosure/utils/supported-enclosures';
import { ThemeService } from 'app/services/theme/theme.service';
import { WebSocketService } from 'app/services/ws.service';

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
      mockWebSocket([
        mockCall('webui.enclosure.dashboard', enclosures),
      ]),
      mockProvider(ThemeService),
    ],
  });

  beforeEach(() => {
    spectator = createService();
    spectator.service.initiate();
  });

  describe('initiate', () => {
    it('loads dashboard information', () => {
      expect(spectator.inject(WebSocketService).call).toHaveBeenCalledWith('webui.enclosure.dashboard');

      expect(spectator.service.state()).toMatchObject({
        enclosures,
        isLoading: false,
        selectedEnclosureIndex: 0,
        selectedSlot: undefined,
        selectedView: EnclosureView.Pools,
        selectedSide: undefined,
      });
    });
  });

  describe('selectEnclosure', () => {
    it('selects new enclosure', () => {
      spectator.service.selectEnclosure('enc2');

      expect(spectator.service.state()).toMatchObject({
        enclosures,
        isLoading: false,
        selectedEnclosureIndex: 1,
        selectedSlot: undefined,
        selectedView: EnclosureView.Pools,
        selectedSide: undefined,
      });
    });
  });

  describe('renameSelectedEnclosure', () => {
    it('renames selected enclosure', () => {
      spectator.service.renameSelectedEnclosure('new label');

      expect(spectator.service.state().enclosures[0].label).toBe('new label');
    });
  });

  describe('selectSlot', () => {
    it('updates selected slot', () => {
      const slot = enclosures[0].elements[EnclosureElementType.ArrayDeviceSlot][1];

      spectator.service.selectSlot(slot);

      expect(spectator.service.state().selectedSlot).toBe(slot);
    });
  });

  describe('selectSlotByVdevDisk', () => {
    it('switches to vdev disk enclosure and slot', () => {
      spectator.service.selectSlotByVdevDisk({
        slot: 4,
        enclosure_id: 'enc2',
      } as EnclosureVdevDisk);

      expect(spectator.service.state()).toMatchObject({
        enclosures,
        isLoading: false,
        selectedEnclosureIndex: 1,
        selectedSlot: enclosures[1].elements[EnclosureElementType.ArrayDeviceSlot][4],
        selectedView: EnclosureView.Pools,
        selectedSide: undefined,
      });
    });
  });

  describe('selectView', () => {
    it('updates selected view', () => {
      spectator.service.selectView(EnclosureView.Expanders);

      expect(spectator.service.state().selectedView).toBe(EnclosureView.Expanders);
    });
  });

  describe('selectSide', () => {
    it('updates selected side', () => {
      spectator.service.selectSide(EnclosureSide.Internal);

      expect(spectator.service.state().selectedSide).toBe(EnclosureSide.Internal);
    });
  });

  describe('selectors', () => {
    it('selectedEnclosureSlots - returns slots of currently selected enclosure', () => {
      spectator.service.initiate();

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
