export interface ReportingRealtimeUpdate {
  cpu: AllCpusUpdate;
  disks: DisksUpdate;
  interfaces: AllNetworkInterfacesUpdate;
  memory: MemoryUpdate;
  virtual_memory: VirtualMemoryUpdate;
  zfs: ZfsUpdate;
}

export interface AllCpusUpdate {
  [cpuNumber: number]: CpuUpdate;
  average: CpuUpdate;
  temperature: any;
  temperature_celsius: any;
}

export interface CpuUpdate {
  guest: number;
  guest_nice: number;
  idle: number;
  iowait: number;
  irq: number;
  nice: number;
  softirq: number;
  steal: number;
  system: number;
  usage: number;
  user: number;
}

export interface DisksUpdate {
  busy: number;
  read_bytes: number;
  read_ops: number;
  write_bytes: number;
  write_ops: number;
}

export interface AllNetworkInterfacesUpdate {
  [interfaceName: string]: NetworkInterfaceUpdate;
}

export interface NetworkInterfaceUpdate {
  received_bytes: number;
  received_bytes_rate: number;
  sent_bytes: number;
  sent_bytes_rate: number;
  speed: number;
}

export interface MemoryUpdate {
  classes: {
    apps: number;
    arc: number;
    buffers: number;
    cache: number;
    page_tables: number;
    slab_cache: number;
    swap_cache: number;
    unused: number;
  };
  extra: {
    active: number;
    committed: number;
    inactive: number;
    mapped: number;
    vmalloc_used: number;
  };
  swap: {
    total: number;
    used: number;
  };
}

export interface VirtualMemoryUpdate {
  active: number;
  available: number;
  buffers: number;
  cached: number;
  free: number;
  inactive: number;
  percent: number;
  shared: number;
  slab: number;
  total: number;
  used: number;
}

export interface ZfsUpdate {
  arc_max_size: number;
  arc_size: number;
  cache_hit_ratio: number;
}
