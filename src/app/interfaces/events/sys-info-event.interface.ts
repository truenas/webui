import { SystemInfo } from 'app/interfaces/system-info.interface';

export interface SysInfoEvent {
  name: 'SysInfo';
  sender: unknown;
  data: SystemInfoWithFeatures;
}

export interface SystemInfoWithFeatures extends SystemInfo {
  features: SystemFeatures;
}

export interface SystemFeatures {
  HA: boolean;
  enclosure: boolean;
}
