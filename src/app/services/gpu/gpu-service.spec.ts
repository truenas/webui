import { createServiceFactory, SpectatorService } from '@ngneat/spectator/jest';
import { provideMockStore } from '@ngrx/store/testing';
import { firstValueFrom } from 'rxjs';
import { mockCall, mockWebsocket } from 'app/core/testing/utils/mock-websocket.utils';
import { AdvancedConfig } from 'app/interfaces/advanced-config.interface';
import { Device } from 'app/interfaces/device.interface';
import { GpuService } from 'app/services/gpu/gpu.service';
import { WebSocketService } from 'app/services/ws.service';
import { selectAdvancedConfig } from 'app/store/system-config/system-config.selectors';

describe('GpuService', () => {
  let spectator: SpectatorService<GpuService>;
  const createService = createServiceFactory({
    service: GpuService,
    providers: [
      mockWebsocket([
        mockCall('system.advanced.update_gpu_pci_ids'),
        mockCall('device.get_info', [
          {
            addr: {
              pci_slot: '0000:01:00.0',
            },
            description: 'GeForce',
          },
          {
            addr: {
              pci_slot: '0000:02:00.0',
            },
            description: 'Radeon',
          },
        ] as Device[]),
      ]),
      provideMockStore({
        selectors: [
          {
            selector: selectAdvancedConfig,
            value: {
              isolated_gpu_pci_ids: ['0000:02:00.0'],
            } as AdvancedConfig,
          },
        ],
      }),
    ],
  });

  beforeEach(() => {
    spectator = createService();
  });

  describe('getGpuOptions', () => {
    it('returns an observable with a list of options for GPU select', async () => {
      const options = await firstValueFrom(spectator.service.getGpuOptions());
      expect(options).toEqual([
        { label: 'GeForce', value: '0000:01:00.0' },
        { label: 'Radeon', value: '0000:02:00.0' },
      ]);
    });
  });

  describe('getIsolatedGpuPciIds', () => {
    it('returns an observable with list of ids for isolated gpus', async () => {
      const options = await firstValueFrom(spectator.service.getIsolatedGpuPciIds());
      expect(options).toEqual(['0000:02:00.0']);
    });
  });

  describe('getIsolatedGpus', () => {
    it('returns a observable with gpu devices that have been isolated', async () => {
      const gpus = await firstValueFrom(spectator.service.getIsolatedGpus());
      expect(gpus).toEqual([{
        addr: {
          pci_slot: '0000:02:00.0',
        },
        description: 'Radeon',
      }]);
    });
  });

  describe('addIsolatedGpuPciIds', () => {
    it('adds new ids of new isolated gpu devices in addition to ones that were previously isolated', async () => {
      await firstValueFrom(spectator.service.addIsolatedGpuPciIds(['0000:01:00.0', '0000:02:00.0']));

      expect(spectator.inject(WebSocketService).call).toHaveBeenCalledWith(
        'system.advanced.update_gpu_pci_ids',
        [['0000:02:00.0', '0000:01:00.0']],
      );
    });
  });
});
