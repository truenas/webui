import { FormControl } from '@angular/forms';
import { createServiceFactory, mockProvider, SpectatorService } from '@ngneat/spectator/jest';
import { firstValueFrom, of } from 'rxjs';
import { Device } from 'app/interfaces/device.interface';
import { GpuService } from 'app/services/gpu/gpu.service';
import { IsolatedGpuValidatorService } from 'app/services/gpu/isolated-gpu-validator.service';

describe('IsolatedGpuValidatorService', () => {
  let spectator: SpectatorService<IsolatedGpuValidatorService>;
  const createService = createServiceFactory({
    service: IsolatedGpuValidatorService,
    providers: [
      mockProvider(GpuService, {
        getAllGpus: () => of([
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
          {
            addr: {
              pci_slot: '0000:03:00.0',
            },
            description: 'Intel Arc',
          },
        ] as Device[]),
        getIsolatedGpus: () => of([
          {
            addr: {
              pci_slot: '0000:02:00.0',
            },
            description: 'Radeon',
          },
        ]),
        getIsolatedGpuPciIds: () => of(['0000:02:00.0']),
      }),
    ],
  });

  beforeEach(() => {
    spectator = createService();
  });

  describe('validateGpu - validation passes', () => {
    it('returns null when no new GPUs have been selected', async () => {
      const control = new FormControl([]);
      const result = await firstValueFrom(spectator.service.validateGpu(control));
      expect(result).toBeNull();
    });

    it(`returns null when selecting new GPUs leaves at least 1 available GPU
    for host system`, async () => {
      const control = new FormControl(['0000:02:00.0', '0000:01:00.0']);
      const result = await firstValueFrom(spectator.service.validateGpu(control));
      expect(result).toBeNull();
    });
  });

  describe('validateGpu - validation fails', () => {
    it(`returns an error when too many new GPUs are selected
    leaving no GPU for host system`, async () => {
      jest.spyOn(spectator.inject(GpuService), 'getIsolatedGpuPciIds').mockReturnValue(of([] as string[]));
      jest.spyOn(spectator.inject(GpuService), 'getIsolatedGpus').mockReturnValue(of([] as Device[]));

      const control = new FormControl(['0000:01:00.0', '0000:02:00.0', '0000:03:00.0']);
      const result = await firstValueFrom(spectator.service.validateGpu(control));
      expect(result).toEqual({
        gpus: {
          message: 'At least 1 GPU is required by the host for its functions.<p>With your selection, no GPU is available for the host to consume.</p>',
        },
      });
    });

    it('returns an error listing currently isolated GPUs when validation fails', async () => {
      const control = new FormControl(['0000:01:00.0', '0000:03:00.0', '0000:02:00.0']);
      const result = await firstValueFrom(spectator.service.validateGpu(control));
      expect(result).toEqual({
        gpus: {
          message: 'At least 1 GPU is required by the host for its functions.<p>Currently following GPU(s) have been isolated:<ol><li>1. Radeon</li></ol></p><p>With your selection, no GPU is available for the host to consume.</p>',
        },
      });
    });
  });
});
