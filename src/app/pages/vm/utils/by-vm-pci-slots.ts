import { Device } from 'app/interfaces/device.interface';

export function byVmPciSlots(vmPciSlots: string[]): (device: Device) => boolean {
  return (device: Device) => {
    return device.devices.every((pciDevice) => {
      return vmPciSlots.includes(pciDevice.vm_pci_slot);
    });
  };
}
