import { createServiceFactory, SpectatorService } from '@ngneat/spectator/jest';
import { Store } from '@ngrx/store';
import { provideMockStore } from '@ngrx/store/testing';
import { firstValueFrom } from 'rxjs';
import { TestScheduler } from 'rxjs/testing';
import { getTestScheduler } from 'app/core/testing/utils/get-test-scheduler.utils';
import { mockCall, mockWebSocket } from 'app/core/testing/utils/mock-websocket.utils';
import { DeviceType } from 'app/enums/device-type.enum';
import { AdvancedConfig } from 'app/interfaces/advanced-config.interface';
import { Device } from 'app/interfaces/device.interface';
import { GpuService } from 'app/services/gpu/gpu.service';
import { WebSocketService } from 'app/services/ws.service';
import { advancedConfigUpdated } from 'app/store/system-config/system-config.actions';
import { selectAdvancedConfig } from 'app/store/system-config/system-config.selectors';

describe('GpuService', () => {
  let spectator: SpectatorService<GpuService>;
  let testScheduler: TestScheduler;

  const allGpus = [
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
  ] as Device[];
  const createService = createServiceFactory({
    service: GpuService,
    providers: [
      mockWebSocket([
        mockCall('system.advanced.update_gpu_pci_ids'),
        mockCall('device.get_info', allGpus),
        mockCall('system.advanced.get_gpu_pci_choices', {
          'GeForce [0000:01:00.0]': '0000:01:00.0',
          'Radeon [0000:02:00.0]': '0000:02:00.0',
        }),
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
    testScheduler = getTestScheduler();
  });

  describe('getAllGpus', () => {
    it('returns a list of all gpus available in the system', async () => {
      const gpus = await firstValueFrom(spectator.service.getAllGpus());

      expect(gpus).toEqual(allGpus);
      expect(spectator.inject(WebSocketService).call).toHaveBeenCalledWith('device.get_info', [{ type: DeviceType.Gpu }]);
    });
  });

  describe('getGpuOptions', () => {
    it('returns an observable with a list of options for GPU select', async () => {
      const store$ = spectator.inject(Store);
      jest.spyOn(store$, 'dispatch');
      const options = await firstValueFrom(spectator.service.getGpuOptions());
      expect(options).toEqual([
        { label: 'GeForce [0000:01:00.0]', value: '0000:01:00.0' },
        { label: 'Radeon [0000:02:00.0]', value: '0000:02:00.0' },
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
      const store$ = spectator.inject(Store);
      jest.spyOn(store$, 'dispatch');
      await firstValueFrom(spectator.service.addIsolatedGpuPciIds(['0000:01:00.0']));

      expect(spectator.inject(WebSocketService).call).toHaveBeenCalledWith(
        'system.advanced.update_gpu_pci_ids',
        [['0000:02:00.0', '0000:01:00.0']],
      );
      expect(spectator.inject(Store).dispatch).toHaveBeenCalledWith(advancedConfigUpdated());
    });

    it('does nothing when new gpu has already been isolated', () => {
      testScheduler.run(({ expectObservable }) => {
        const call$ = spectator.service.addIsolatedGpuPciIds(['0000:02:00.0']);

        expect(spectator.inject(WebSocketService).call).not.toHaveBeenCalled();
        expectObservable(call$).toBe('(a|)', { a: undefined });
      });
    });
  });
});
