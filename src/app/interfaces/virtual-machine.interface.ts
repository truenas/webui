import { ServiceStatus } from 'app/enums/service-status.enum';
import { VmBootloader, VmCpuMode, VmTime } from 'app/enums/vm.enum';
import { VmDevice } from 'app/interfaces/vm-device.interface';

export interface VirtualMachine {
  autostart: boolean;
  bootloader: VmBootloader;
  cores: number;
  cpu_mode: VmCpuMode;
  cpu_model: string;
  description: string;
  devices: VmDevice[];
  grubconfig: string;
  hide_from_msr: boolean;
  ensure_display_device: boolean;
  id: number;
  memory: number;
  name: string;
  shutdown_timeout: number;
  status: {
    state: ServiceStatus;
    pid: number;
    domain_state: string; // Enum? SHUTOFF
  };
  threads: number;
  time: VmTime;
  vcpus: number;
}

export type VmStopParams = [
  id: number,
  params: {
    force: boolean;
    force_after_timeout: boolean;
  },
];

export type VmDisplayWebUriParams = [
  id: number,
  domain: string,
  options?: {
    devices_passwords: [
      {
        device_id: number;
        password: string;
      },
    ];
  },
];

export interface VmPortWizardResult {
  port: number;
  web: number;
}

export interface VmDisplayWebUri {
  error: string;
  uri: string;
}

export interface VmDisplayResponse {
  error: unknown;
  uri: string;
}

export type VmCloneParams = [
  id: number,
  newName?: string,
];

export type VmDeleteParams = [
  id: number,
  params: { zvols: boolean; force: boolean },
];

export interface VirtualizationDetails {
  supported: boolean;
  error: string;
}
