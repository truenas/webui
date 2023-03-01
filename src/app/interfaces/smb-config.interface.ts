import { LogLevel } from 'app/enums/log-level.enum';

export interface SmbConfig {
  aapl_extensions: boolean;
  admin_group: string;
  bindip: string[];
  cifs_SID: string;
  description: string;
  dirmask: string;
  enable_smb1: boolean;
  filemask: string;
  guest: string;
  id: number;
  localmaster: boolean;
  loglevel: LogLevel;
  netbiosalias: string[];
  netbiosname: string;
  netbiosname_local: string;
  next_rid: number;
  ntlmv1_auth: boolean;
  syslog: boolean;
  unixcharset: string;
  workgroup: string;
}

export type SmbConfigUpdate = {
  multichannel?: boolean;
} & Omit<SmbConfig, 'cifs_SID' | 'id' | 'netbiosname_local' | 'next_rid'>;
