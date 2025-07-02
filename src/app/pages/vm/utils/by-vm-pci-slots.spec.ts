import { Device } from 'app/interfaces/device.interface';
import { byVmPciSlots } from 'app/pages/vm/utils/by-vm-pci-slots';

describe('byVmPciSlots', () => {
  it('returns a function that can be used as a function to filter PCI devices fully matching vm_pci_slots', () => {
    const vmPciSlots = ['pci_0000_01_00_0', 'pci_0000_02_00_0', 'pci_0000_03_00_0'];
    const devices = [
      {
        description: 'ASPEED Technology, Inc. ASPEED Graphics Family',
        devices: [
          { vm_pci_slot: 'pci_0000_01_00_0' },
          { vm_pci_slot: 'pci_0000_02_00_0' },
        ],
      },
      {
        description: 'Radeon',
        devices: [
          { vm_pci_slot: 'pci_0000_03_00_0' },
          { vm_pci_slot: 'pci_0000_04_00_0' },
        ],
      },
    ] as Device[];

    const filteredDevices = devices.filter(byVmPciSlots(vmPciSlots));

    expect(filteredDevices).toEqual([
      {
        description: 'ASPEED Technology, Inc. ASPEED Graphics Family',
        devices: [
          { vm_pci_slot: 'pci_0000_01_00_0' },
          { vm_pci_slot: 'pci_0000_02_00_0' },
        ],
      },
    ]);
  });
});
