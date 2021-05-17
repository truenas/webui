interface VmDeviceAttributes {
  path: string;
  type: string;
  logical_sectorsize: null;
  physical_sectorsize: null;
  mac: string;
  nic_attach: string;
  pptdev: string;
  web: boolean;
  resolution: string;
  port: number;
  bind: string;
  wait: boolean;
  password: null;
}

export interface VmDevice {
  id: number;
  dtype: string;
  attributes: VmDeviceAttributes;
  order: number;
  vm: number;
}
