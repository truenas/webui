import { ServiceStatus } from 'app/enums/service-status.enum';
import { VmBootloader, VmCpuMode, VmTime } from 'app/enums/vm.enum';
import { VmDevice } from 'app/interfaces/vm-device.interface';

export interface VirtualMachine {
  autostart: boolean;
  bootloader: VmBootloader;
  hyperv_enlightenments: boolean;
  cores: number;
  cpu_mode: VmCpuMode;
  cpu_model: string;
  description: string;
  devices: VmDevice[];
  hide_from_msr: boolean;
  ensure_display_device: boolean;
  id: number;
  /**
   * In megabytes.
   */
  memory: number;
  name: string;
  shutdown_timeout: number;
  status: {
    state: ServiceStatus;
    pid: number;
    domain_state: string; // Enum? SHUTOFF
  };
  threads: number;
  cpuset: string;
  pin_vcpus: boolean;
  nodeset: string;
  time: VmTime;
  vcpus: number;
  arch_type: string;
  machine_type: string;
  command_line_args: string;
  suspend_on_snapshot: boolean;
  min_memory: number;
  uuid: string;
}

export type VirtualMachineUpdate = Omit<VirtualMachine, 'status' | 'id' | 'devices'>;

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
  options?: VmDisplayWebUriParamsOptions,
];

export interface VmDisplayWebUriParamsOptions {
  protocol?: string;
  devices_passwords?: [
    {
      device_id: number;
      password: string;
    },
  ];
}

export interface VmPortWizardResult {
  port: number;
  web: number;
}

export interface VmDisplayWebUri {
  error: string;
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
