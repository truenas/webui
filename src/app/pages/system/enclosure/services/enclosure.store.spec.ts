import { SpectatorService, createServiceFactory, mockProvider } from '@ngneat/spectator/jest';
import { mockCall, mockWebSocket } from 'app/core/testing/utils/mock-websocket.utils';
import { EnclosureElementType } from 'app/enums/enclosure-slot-status.enum';
import {
  DashboardEnclosure, DashboardEnclosureElements, DashboardEnclosureSlot, EnclosureVdevDisk,
} from 'app/interfaces/enclosure.interface';
import { EnclosureStore } from 'app/pages/system/enclosure/services/enclosure.store';
import { DisksUpdateService } from 'app/services/disks-update.service';
import { ThemeService } from 'app/services/theme/theme.service';
import { WebSocketService } from 'app/services/ws.service';

describe('EnclosureStore', () => {
  let spectator: SpectatorService<EnclosureStore>;

  const enclosures = [
    {
      id: 'enclosure1',
      elements: {
        [EnclosureElementType.ArrayDeviceSlot]: {
          1: { model: 'test1' } as DashboardEnclosureSlot,
          2: { model: 'test2' } as DashboardEnclosureSlot,
        },
      } as DashboardEnclosureElements,
    },
    {
      id: 'enclosure2',
      elements: {
        [EnclosureElementType.ArrayDeviceSlot]: {
          3: { model: 'test3' } as DashboardEnclosureSlot,
          4: { model: 'test4' } as DashboardEnclosureSlot,
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
      mockProvider(ThemeService, {
        getRgbBackgroundColorByIndex: () => [0, 0, 0],
      }),
      mockProvider(DisksUpdateService),
    ],
  });

  beforeEach(() => {
    spectator = createService();
    spectator.service.initiate();
  });

  it('calls webui.enclosure.dashboard when loading data', () => {
    expect(spectator.inject(WebSocketService).call).toHaveBeenCalledWith('webui.enclosure.dashboard');
  });

  describe('addListenerForDiskUpdates', () => {
    it('adds subscriber', () => {
      spectator.service.addListenerForDiskUpdates();
      expect(spectator.inject(DisksUpdateService).addSubscriber).toHaveBeenCalled();
    });
  });

  describe('removeListenerForDiskUpdates', () => {
    it('removes subscriber', () => {
      spectator.service.removeListenerForDiskUpdates();
      expect(spectator.inject(DisksUpdateService).removeSubscriber).toHaveBeenCalled();
    });
  });

  describe('selectSlotByVdevDisk', () => {
    it('selects enclosure and slot', () => {
      expect(spectator.service.selectedEnclosure()).toEqual(enclosures[0]);
      expect(spectator.service.selectedSlot()).toBeUndefined();

      const slot = 4;
      const vdevDisk = {
        enclosure_id: 'enclosure2',
        slot: slot + 1,
      } as EnclosureVdevDisk;
      spectator.service.selectSlotByVdevDisk(vdevDisk);

      expect(spectator.service.selectedEnclosure()).toEqual(enclosures[1]);
      expect(spectator.service.selectedSlot()).toEqual(enclosures[1].elements['Array Device Slot'][slot]);
    });
  });
});
