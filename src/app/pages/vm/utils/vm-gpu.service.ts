import { Injectable } from '@angular/core';
import _ from 'lodash';
import {
  forkJoin, Observable, of, switchMap,
} from 'rxjs';
import { VmDeviceType } from 'app/enums/vm.enum';
import { Device, PciDevice } from 'app/interfaces/device.interface';
import { VirtualMachine } from 'app/interfaces/virtual-machine.interface';
import { VmPciPassthroughDevice } from 'app/interfaces/vm-device.interface';
import { byVmPciSlots } from 'app/pages/vm/utils/by-vm-pci-slots';
import { GpuService } from 'app/services/gpu/gpu.service';
import { WebSocketService } from 'app/services/ws.service';

@Injectable({
  providedIn: 'root',
})
export class VmGpuService {
  constructor(
    private gpuService: GpuService,
    private ws: WebSocketService,
  ) {}

  /**
   * Relationship is:
   * Device has many PciDevice via `devices`
   * PciDevice ------- VmPciPassthroughDevice
   *   vm_pci_slot  pptdev
   */
  updateVmGpus(vm: VirtualMachine, newGpuIds: string[]): Observable<unknown> {
    return this.gpuService.getAllGpus().pipe(
      switchMap((allGpus) => {
        const previousVmPciDevices = vm.devices.filter((device) => {
          return device.dtype === VmDeviceType.Pci;
        }) as VmPciPassthroughDevice[];
        const previousSlots = previousVmPciDevices.map((device) => device.attributes.pptdev);
        const previousGpus = allGpus.filter(byVmPciSlots(previousSlots));

        const newGpus = allGpus.filter((gpu) => newGpuIds.includes(gpu.addr.pci_slot));

        const gpusToAdd = this.subtractGpus(newGpus, previousGpus);
        const gpusToRemove = this.subtractGpus(previousGpus, newGpus);

        if (!gpusToAdd.length && !gpusToRemove.length) {
          return of(null);
        }

        return forkJoin([
          ...this.addGpus(vm, previousSlots, gpusToAdd),
          ...this.deleteGpus(previousVmPciDevices, gpusToRemove),
        ]);
      }),
    );
  }

  private subtractGpus(gpus: Device[], gpusToSubtract: Device[]): Device[] {
    return _.differenceBy(gpus, gpusToSubtract, (gpu) => gpu.addr.pci_slot);
  }

  private addGpus(vm: VirtualMachine, previousSlots: string[], gpusToAdd: Device[]): Observable<unknown>[] {
    const deicesToAdd = gpusToAdd
      .map((gpuToAdd) => {
        return gpuToAdd.devices.filter((gpuPciDevice) => {
          return !previousSlots.includes(gpuPciDevice.vm_pci_slot);
        });
      })
      .flat();

    return deicesToAdd.map((deviceToAdd) => this.createVmPciDevice(vm, deviceToAdd));
  }

  private createVmPciDevice(vm: VirtualMachine, device: PciDevice): Observable<unknown> {
    return this.ws.call('vm.device.create', [{
      dtype: VmDeviceType.Pci,
      vm: vm.id,
      attributes: {
        pptdev: device.vm_pci_slot,
      },
    }]);
  }

  private deleteGpus(previousVmPciDevices: VmPciPassthroughDevice[], gpusToRemove: Device[]): Observable<unknown>[] {
    const slotsToRemove = this.findSlotsToRemove(previousVmPciDevices, gpusToRemove);
    return slotsToRemove.map((device) => this.ws.call('vm.device.delete', [device.id]));
  }

  private findSlotsToRemove(
    previousVmPciDevices: VmPciPassthroughDevice[],
    gpusToRemove: Device[],
  ): VmPciPassthroughDevice[] {
    return gpusToRemove
      .map((gpuToRemove) => {
        const slotsToRemove = gpuToRemove.devices.map((device) => device.vm_pci_slot);
        return previousVmPciDevices.filter((device) => {
          return slotsToRemove.includes(device.attributes.pptdev);
        });
      })
      .flat();
  }
}
