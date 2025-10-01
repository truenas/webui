import { SmbEncryption } from 'app/enums/smb-encryption.enum';
import { SmbProtocol } from 'app/enums/smb-protocol.enum';

export interface SmbConfig {
  aapl_extensions: boolean;
  admin_group: string | null;
  bindip: string[];
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
  search_protocols: [SmbProtocol.Spotlight] | [];
}

export type SmbConfigUpdate = {
  multichannel?: boolean;
} & Partial<Omit<SmbConfig, 'cifs_SID' | 'id' | 'next_rid'>>;
