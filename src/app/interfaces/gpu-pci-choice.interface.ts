export interface GpuPciChoice {
  pci_slot: string;
  uses_system_critical_devices: boolean;
  critical_reason: string;
}

export type GpuPciChoices = Record<string, GpuPciChoice>;
