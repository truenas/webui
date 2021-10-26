import { UpsMode, UpsShutdownMode } from 'app/enums/ups-mode.enum';

export interface UpsConfig {
  complete_identifier: string;
  description: string;
  driver: string;
  extrausers: string;
  hostsync: number;
  id: number;
  identifier: string;
  mode: UpsMode;
  monpwd: string;
  monuser: string;
  nocommwarntime: unknown;
  options: string;
  optionsupsd: string;
  port: string;
  powerdown: boolean;
  remotehost: string;
  remoteport: number;
  rmonitor: boolean;
  shutdown: UpsShutdownMode;
  shutdowncmd: unknown;
  shutdowntimer: number;
}

export type UpsConfigUpdate = Omit<UpsConfig, 'id'>;
