import { createServiceFactory, SpectatorService, SpyObject } from '@ngneat/spectator';
import { mockProvider } from '@ngneat/spectator/jest';
import { lastValueFrom, of } from 'rxjs';
import { mockCall, mockApi } from 'app/core/testing/utils/mock-api.utils';
import { VmDeviceType } from 'app/enums/vm.enum';
import { Device } from 'app/interfaces/device.interface';
import { VirtualMachine } from 'app/interfaces/virtual-machine.interface';
import { ApiService } from 'app/modules/websocket/api.service';
import { VmGpuService } from 'app/pages/vm/utils/vm-gpu.service';
import { GpuService } from 'app/services/gpu/gpu.service';

describe('VmGpuService', () => {
  let spectator: SpectatorService<VmGpuService>;
  let api: SpyObject<ApiService>;

  const radeon = {
    addr: {
      pci_slot: '0000:01:00.0',
    },
    description: 'Radeon',
    devices: [
      {
        pci_slot: '0000:01:00.0',
        vm_pci_slot: 'pci_0000_01_00_0',
      },
    ],
  };
  const geforce = {
    addr: {
      pci_slot: '0000:02:00.0',
    },
    description: 'geForce',
    devices: [
      {
        pci_slot: '0000:02:00.0',
        vm_pci_slot: 'pci_0000_02_00_0',
      },
    ],
  };

  const arc = {
    addr: {
      pci_slot: '0000:03:00.0',
    },
    description: 'Intel Arc',
    devices: [
      {
        pci_slot: '0000:03:00.0',
        vm_pci_slot: 'pci_0000_03_00_0',
      },
    ],
  };

  const createService = createServiceFactory({
    service: VmGpuService,
    providers: [
      mockProvider(GpuService, {
        getAllGpus: () => of([
          radeon,
          geforce,
          arc,
        ] as Device[]),
      }),
      mockApi([
        mockCall('vm.device.create'),
        mockCall('vm.device.delete'),
      ]),
    ],
  });

  const vm = {
    id: 2,
    devices: [
      {
        id: 13,
        attributes: {
          dtype: VmDeviceType.Pci,
          pptdev: 'pci_0000_02_00_0',
        },
        vm: 2,
      },
    ],
  } as VirtualMachine;

  beforeEach(() => {
    spectator = createService();
    api = spectator.inject(ApiService);
  });

  describe('updateVmGpus', () => {
    it('creates new VM PCI device when new GPU is added', async () => {
      await lastValueFrom(spectator.service.updateVmGpus(vm, ['0000:01:00.0', '0000:02:00.0']));

      expect(api.call).toHaveBeenCalledTimes(1);
      expect(api.call).toHaveBeenCalledWith('vm.device.create', [{
        vm: 2,
        attributes: {
          dtype: VmDeviceType.Pci,
          pptdev: 'pci_0000_01_00_0',
        },
      }]);
    });

    it('removes existing VM PCI device when associated GPU is removed', async () => {
      await lastValueFrom(spectator.service.updateVmGpus(vm, []));

      expect(api.call).toHaveBeenCalledTimes(1);
      expect(api.call).toHaveBeenCalledWith('vm.device.delete', [13]);
    });

    it('both creates and removes VM PCI devices to match selected GPUs', async () => {
      await lastValueFrom(spectator.service.updateVmGpus(vm, ['0000:01:00.0', '0000:03:00.0']));

      expect(api.call).toHaveBeenCalledTimes(3);
      expect(api.call).toHaveBeenCalledWith('vm.device.delete', [13]);
      expect(api.call).toHaveBeenCalledWith('vm.device.create', [{
        vm: 2,
        attributes: {
          dtype: VmDeviceType.Pci,
          pptdev: 'pci_0000_01_00_0',
        },
      }]);
      expect(api.call).toHaveBeenCalledWith('vm.device.create', [{
        vm: 2,
        attributes: {
          dtype: VmDeviceType.Pci,
          pptdev: 'pci_0000_03_00_0',
        },
      }]);
    });

    it('does nothing when already existing VM PCI devices match selected GPUs', async () => {
      await lastValueFrom(spectator.service.updateVmGpus(vm, ['0000:02:00.0']));

      expect(api.call).not.toHaveBeenCalled();
    });
  });
});
