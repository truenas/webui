export interface DeviceAddress {
  bus: string;
  domain: string;
  pci_slot: string;
  slot: string;
}

export interface PciDevice {
  pci_id: string;
  pci_slot: string;
  vm_pci_slot: string;
}

export interface Device {
  addr: DeviceAddress;
  available_to_host: boolean;
  description: string;
  devices: PciDevice[];
  vendor: string;
}
