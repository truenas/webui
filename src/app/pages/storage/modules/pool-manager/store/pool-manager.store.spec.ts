import { createServiceFactory, mockProvider, SpectatorService } from '@ngneat/spectator/jest';
import { firstValueFrom } from 'rxjs';
import { mockCall, mockWebsocket } from 'app/core/testing/utils/mock-websocket.utils';
import { Enclosure } from 'app/interfaces/enclosure.interface';
import { UnusedDisk } from 'app/interfaces/storage.interface';
import { initialState, PoolManagerStore } from 'app/pages/storage/modules/pool-manager/store/pool-manager.store';
import {
  GenerateVdevsService,
} from 'app/pages/storage/modules/pool-manager/utils/generate-vdevs/generate-vdevs.service';
import { WebSocketService } from 'app/services';

describe('PoolManagerStore', () => {
  let spectator: SpectatorService<PoolManagerStore>;
  const disks = [
    {
      devname: 'sda',
      enclosure: {
        number: 1,
        slot: 1,
      },
    },
    {
      devname: 'sdb',
    },
  ] as UnusedDisk[];
  const enclosures = [
    { name: 'Front', number: 1 },
    { name: 'Back', number: 2 },
  ] as Enclosure[];
  const createService = createServiceFactory({
    service: PoolManagerStore,
    providers: [
      mockWebsocket([
        mockCall('disk.get_unused', disks),
        mockCall('enclosure.query', enclosures),
      ]),
      mockProvider(GenerateVdevsService),
    ],
  });

  beforeEach(() => {
    spectator = createService();
  });

  describe('selectors', () => {
    it('hasMultipleEnclosuresInAllowedDisks$ - returns true when allowed disks contain multiple enclosures', async () => {
      spectator.service.initialize();
      expect(await firstValueFrom(spectator.service.hasMultipleEnclosuresInAllowedDisks$)).toBe(true);
    });
  });

  describe('initialize', () => {
    it('loads disks and enclosures', async () => {
      spectator.service.initialize();

      const websocket = spectator.inject(WebSocketService);
      expect(websocket.call).toHaveBeenCalledWith('disk.get_unused');
      expect(websocket.call).toHaveBeenCalledWith('enclosure.query');

      expect(await firstValueFrom(spectator.service.state$)).toMatchObject({
        ...initialState,
        enclosures,
        isLoading: false,
        allDisks: disks,
      });
    });
  });
});
