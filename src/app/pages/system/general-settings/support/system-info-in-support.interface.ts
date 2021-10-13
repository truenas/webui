import { SystemInfo } from 'app/interfaces/system-info.interface';

export interface SystemInfoInSupport extends SystemInfo {
  memory?: string;
  system_serial_ha?: string;
  serial?: string;
}
