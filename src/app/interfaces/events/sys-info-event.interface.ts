import { SystemInfo } from 'app/interfaces/system-info.interface';

export interface SystemInfoWithFeatures extends SystemInfo {
  features: SystemFeatures;
}

export interface SystemFeatures {
  HA: boolean;
  enclosure: boolean;
}
