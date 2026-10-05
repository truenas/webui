import { CallParams } from '@truenas/api-client';
import {
  VmBootloader, VmCpuMode, VmState, VmTime,
} from 'app/enums/vm.enum';
import { VmDevice } from 'app/interfaces/vm-device.interface';
import { WebUiApiDirectory, WebUiQueryEntity } from 'app/modules/websocket/typed-api/typed-api-client.token';

export interface VirtualMachine {
  autostart: boolean;
  bootloader: VmBootloader;
  bootloader_ovmf: string;
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
    state: VmState;
    pid: number;
    domain_state: string; // Enum? SHUTOFF, RUNNING
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
  display_available: boolean;
  trusted_platform_module: boolean;
  enable_secure_boot: boolean;
}

/** What the VM forms send, to `vm.create` and `vm.update` alike. */
export type VirtualMachineUpdate = CallParams<WebUiApiDirectory, 'vm.create'>[0];

export interface VirtualizationDetails {
  supported: boolean;
  error: string | null;
}

/**
 * Reads a `vm.query` row into the shape the VM pages are written against. The generated entry
 * spells `bootloader`, `cpu_mode`, `time` and `status.state` as the wire literals where the pages
 * compare them with the UI's enums, leaves the fields middleware defaults optional, and types
 * `devices` as the generated union; it describes the same object.
 */
export function toVirtualMachine(vm: WebUiQueryEntity<'vm.query'>): VirtualMachine {
  return vm as VirtualMachine;
}
