import { createServiceFactory, SpectatorService, SpyObject } from '@ngneat/spectator';
import { mockProvider } from '@ngneat/spectator/jest';
import { lastValueFrom, of } from 'rxjs';
import { mockCall, mockWebsocket } from 'app/core/testing/utils/mock-websocket.utils';
import { VmDeviceType } from 'app/enums/vm.enum';
import { Device } from 'app/interfaces/device.interface';
import { VirtualMachine } from 'app/interfaces/virtual-machine.interface';
import { VmGpuService } from 'app/pages/vm/utils/vm-gpu.service';
import { GpuService } from 'app/services/gpu/gpu.service';
import { WebSocketService } from 'app/services/ws.service';

describe('VmGpuService', () => {
  let spectator: SpectatorService<VmGpuService>;
  let websocket: SpyObject<WebSocketService>;

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
      mockWebsocket([
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
        dtype: VmDeviceType.Pci,
        attributes: {
          pptdev: 'pci_0000_02_00_0',
        },
        vm: 2,
      },
    ],
  } as VirtualMachine;

  beforeEach(() => {
    spectator = createService();
    websocket = spectator.inject(WebSocketService);
  });

  describe('updateVmGpus', () => {
    it('creates new VM PCI device when new GPU is added', async () => {
      await lastValueFrom(spectator.service.updateVmGpus(vm, ['0000:01:00.0', '0000:02:00.0']));

      expect(websocket.call).toHaveBeenCalledTimes(1);
      expect(websocket.call).toHaveBeenCalledWith('vm.device.create', [{
        vm: 2,
        dtype: VmDeviceType.Pci,
        attributes: {
          pptdev: 'pci_0000_01_00_0',
        },
      }]);
    });

    it('removes existing VM PCI device when associated GPU is removed', async () => {
      await lastValueFrom(spectator.service.updateVmGpus(vm, []));

      expect(websocket.call).toHaveBeenCalledTimes(1);
      expect(websocket.call).toHaveBeenCalledWith('vm.device.delete', [13]);
    });

    it('both creates and removes VM PCI devices to match selected GPUs', async () => {
      await lastValueFrom(spectator.service.updateVmGpus(vm, ['0000:01:00.0', '0000:03:00.0']));

      expect(websocket.call).toHaveBeenCalledTimes(3);
      expect(websocket.call).toHaveBeenCalledWith('vm.device.delete', [13]);
      expect(websocket.call).toHaveBeenCalledWith('vm.device.create', [{
        vm: 2,
        dtype: VmDeviceType.Pci,
        attributes: {
          pptdev: 'pci_0000_01_00_0',
        },
      }]);
      expect(websocket.call).toHaveBeenCalledWith('vm.device.create', [{
        vm: 2,
        dtype: VmDeviceType.Pci,
        attributes: {
          pptdev: 'pci_0000_03_00_0',
        },
      }]);
    });

    it('does nothing when already existing VM PCI devices match selected GPUs', async () => {
      await lastValueFrom(spectator.service.updateVmGpus(vm, ['0000:02:00.0']));

      expect(websocket.call).not.toHaveBeenCalled();
    });
  });
});
