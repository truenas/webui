interface GpuDeviceAddress {
  bus: string;
  domain: string;
  pci_slot: string;
  slot: string;
}

interface GpuPciDevice {
  pci_id: string;
  pci_slot: string;
  vm_pci_slot: string;
}

export interface GpuDevice {
  addr: GpuDeviceAddress;
  available_to_host: boolean;
  description: string;
  devices: GpuPciDevice[];
  vendor: string;
}
