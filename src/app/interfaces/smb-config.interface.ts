import { SmbEncryption } from 'app/enums/smb-encryption.enum';
import { BindIp } from 'app/interfaces/bind-ip.interface';

export interface SmbConfig {
  aapl_extensions: boolean;
  admin_group: string | null;
  bindip: BindIp[];
  cifs_SID: string;
  description: string;
  dirmask: string;
  enable_smb1: boolean;
  filemask: string;
  guest: string;
  debug: boolean;
  id: number;
  localmaster: boolean;
  netbiosalias: string[];
  netbiosname: string;
  next_rid: number;
  ntlmv1_auth: boolean;
  syslog: boolean;
  unixcharset: string;
  workgroup: string;
  encryption: SmbEncryption;
}

export type SmbConfigUpdate = {
  multichannel?: boolean;
} & Omit<SmbConfig, 'cifs_SID' | 'id' | 'next_rid'>;
