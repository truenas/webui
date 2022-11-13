import { Injectable } from '@angular/core';
import _ from 'lodash';
import { forkJoin, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { VmDeviceType } from 'app/enums/vm.enum';
import { Device, PciDevice } from 'app/interfaces/device.interface';
import { VirtualMachine } from 'app/interfaces/virtual-machine.interface';
import { VmPciPassthroughDevice } from 'app/interfaces/vm-device.interface';
import { byVmPciSlots } from 'app/pages/vm/utils/by-vm-pci-slots';
import { WebSocketService } from 'app/services';
import { GpuService } from 'app/services/gpu/gpu.service';

@Injectable()
export class VmGpuService {
  constructor(
    private gpuService: GpuService,
    private ws: WebSocketService,
  ) {}

  /**
   * TODO: Clean up further. Make a model class?
   * Device
   * - devices: PciDevice[]
   *
   * PciDevice
   * - vm_pci_slot
   *
   * VmPciPassthroughDevice
   * - pptdev
   *
   * Device ---<  PciDevice ----- VmPciPassthroughDevice
   *     devices  vm_pci_slot    pptdev
   */
  updateVmGpus(vm: VirtualMachine, newGpuIds: string[]): Observable<unknown> {
    return this.gpuService.getAllGpus().pipe(
      map((allGpus) => {
        const previousVmPciDevices = vm.devices.filter((device) => {
          return device.dtype === VmDeviceType.Pci;
        }) as VmPciPassthroughDevice[];
        const previousSlots = previousVmPciDevices.map((device) => device.attributes.pptdev);
        const previousGpus = allGpus.filter(byVmPciSlots(previousSlots));

        const newGpus = allGpus.filter((gpu) => newGpuIds.includes(gpu.addr.pci_slot));

        const gpusToAdd = this.subtractGpus(newGpus, previousGpus);
        const gpusToRemove = this.subtractGpus(previousGpus, newGpus);

        const requests: Observable<unknown>[] = [];
        gpusToAdd.forEach((gpuToAdd) => {
          const gpuPciDevices = gpuToAdd.devices.filter((gpuPciDevice) => {
            return !previousSlots.includes(gpuPciDevice.vm_pci_slot);
          });
          const createRequests = this.createVmPciDevices(vm, gpuPciDevices);
          requests.push(...createRequests);
        });

        gpusToRemove.forEach((gpuToRemove) => {
          const previousVmPciSlots = gpuToRemove.devices.map((device) => device.vm_pci_slot);
          const vmPciDevices = previousVmPciDevices.filter((device) => {
            return previousVmPciSlots.includes(device.attributes.pptdev);
          });

          const deleteRequests = this.deleteVmPciDevices(vmPciDevices);
          requests.push(...deleteRequests);
        });

        return forkJoin(requests);
      }),
    );
  }

  private subtractGpus(gpus: Device[], gpusToSubtract: Device[]): Device[] {
    return _.differenceBy(gpus, gpusToSubtract, (gpu) => gpu.addr.pci_slot);
  }

  private createVmPciDevices(vm: VirtualMachine, gpuPciDevices: PciDevice[]): Observable<unknown>[] {
    return gpuPciDevices.map((gpuPciDevice) => {
      return this.ws.call('vm.device.create', [{
        dtype: VmDeviceType.Pci,
        vm: vm.id,
        attributes: {
          pptdev: gpuPciDevice.vm_pci_slot,
        },
      }]);
    });
  }

  private deleteVmPciDevices(devices: VmPciPassthroughDevice[]): Observable<unknown>[] {
    return devices.map((device) => {
      return this.ws.call('vm.device.delete', [device.id]);
    });
  }
}
