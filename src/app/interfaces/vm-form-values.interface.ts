import {
  VmBootloader, VmCpuMode, VmDiskMode, VmDisplayType, VmNicType, VmTime,
} from 'app/enums/vm.enum';

export interface VmFormValues {
  NIC_mac: string;
  NIC_type: VmNicType;
  autostart: boolean;
  bind: string;
  bootloader: VmBootloader;
  cores: number;
  cpu_mode: VmCpuMode;
  cpu_model: string;
  datastore: string;
  description: string;
  disk_radio: boolean;
  display_type: VmDisplayType;
  enable_display: boolean;
  ensure_display_device: boolean;
  gpus: string[];
  hdd_path: string;
  hdd_type: VmDiskMode;
  hide_from_msr: boolean;
  iso_path: string;
  memory: string;
  min_memory: string;
  memory_warning: string;
  name: string;
  nic_attach: string;
  os: string;
  shutdown_timeout: number;
  threads: number;
  time: VmTime;
  upload_iso: string;
  upload_iso_checkbox: boolean;
  upload_iso_path: string;
  vcpu_limit: string;
  vcpus: number;
  volsize: string;
  wait: boolean;
  cpuset: string;
  nodeset: string;
  pin_vcpus: boolean;
  hyperv_enlightenments: boolean;
  trust_guest_rx_filters: boolean;
}
